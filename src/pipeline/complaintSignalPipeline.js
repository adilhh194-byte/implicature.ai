import { CLAUSE_SEGMENT_MARKERS } from '../lexicons/discourseMarkers.js';
import { normalizeReview } from './reviewNormalizer.js';
import { generateComplaintCandidates } from './complaintCandidateGenerator.js';
import { detectComplaintSignals } from './complaintSignalDetector.js';
import { extractCandidateFeatures } from './candidateFeatureExtractor.js';
import { scoreCandidateHybrid } from './hybridComplaintScorer.js';
import { selectComplaintCandidate } from './complaintSelector.js';
import { condenseComplaint } from './complaintCondenser.js';
import { categorizeComplaint } from './topicCategorizer.js';
import { ANALYZER_PROFILES, getProfileForReview } from './reviewLengthRouter.js';

function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const LEADING_MARKER_TOKENS = [...new Set([
    ...CLAUSE_SEGMENT_MARKERS,
    'conversely',
    'regardless',
    'regardless of',
    'despite',
    'instead of'
])];

const LEADING_MARKER_REGEX = new RegExp(
    `^(?:${LEADING_MARKER_TOKENS
        .slice()
        .sort((a, b) => b.length - a.length)
        .map(escapeForRegex)
        .join('|')})\\b[\\s,:-]*`,
    'i'
);

const FRONTED_CONTEXT_REGEXES = [
    /^(?:even though|although|though|while)\b[^,]+,\s*(.+)$/i,
    /^(?:despite(?: the fact that)?|in spite of|regardless of|instead of)\b[^,]+,\s*(.+)$/i
];

function stripLeadingMarker(text) {
    return (text || '')
        .replace(LEADING_MARKER_REGEX, '')
        .replace(/[\s,;:.!?-]+$/g, '')
        .trim();
}

function normalizeComplaintSpan(text) {
    let cleaned = String(text || '').trim();

    for (const regex of FRONTED_CONTEXT_REGEXES) {
        const match = cleaned.match(regex);
        if (match?.[1]) {
            cleaned = match[1].trim();
            break;
        }
    }

    cleaned = stripLeadingMarker(cleaned)
        .replace(/^(?:the fact that|fact that)\s+/i, '')
        .replace(/^[\s,;:.!?-]+/, '')
        .replace(/[\s,;:.!?-]+$/g, '')
        .trim();

    return cleaned;
}

function emptyModelFeatures() {
    return {
        numeric: {},
        boolean: {},
        categorical: {},
        evidenceSignals: []
    };
}

function buildNoComplaintResult(normalizedReview) {
    return {
        original_review: normalizedReview.original,
        has_hidden_complaint: false,
        complaint_text: '',
        condensed_complaint: '',
        category: 'No Complaint',
        marker_found: null,
        complaint_type: null,
        confidence: 0,
        evidence_signals: [],
        model_features: emptyModelFeatures(),
        word_count: normalizedReview.wordCount,
        review: normalizedReview.original,
        original_text: normalizedReview.original,
        complaint: '',
        marker: null,
        wordCount: normalizedReview.wordCount
    };
}

function toEvidenceSignals(candidate) {
    const evidence = [
        ...((candidate.modelFeatures?.evidenceSignals) || []),
        ...(candidate.signals || []).map(signal => `${signal.type}: ${signal.match}`)
    ];

    if (candidate.source) {
        evidence.push(`SOURCE: ${candidate.source}`);
    }

    if (typeof candidate.mlScore === 'number') {
        evidence.push(`ML_SCORE: ${candidate.mlScore}`);
    }

    return [...new Set(evidence)];
}

function normalizeProfile(inputProfile, reviewText) {
    if (inputProfile && inputProfile.analyzerKey) {
        return {
            ...ANALYZER_PROFILES[inputProfile.analyzerKey],
            ...inputProfile
        };
    }

    return getProfileForReview(reviewText || '');
}

function buildScoredCandidates(normalizedReview, profile) {
    const candidateUnits = generateComplaintCandidates(normalizedReview, {
        includeSentenceCandidates: profile.includeSentenceCandidates,
        includeWholeReviewCandidate: profile.includeWholeReviewCandidate
    });

    const scored = candidateUnits.map(unit => {
        const signalResult = detectComplaintSignals(unit.text);
        const featureInput = {
            ...unit,
            signals: signalResult.signals,
            familyHints: [...new Set([...(unit.familyHints || []), ...signalResult.complaintTypeHints])],
            markerFound: signalResult.markerFound
        };
        const modelFeatures = extractCandidateFeatures(featureInput, normalizedReview);
        const scoreResult = scoreCandidateHybrid(modelFeatures);

        return {
            ...unit,
            signals: signalResult.signals,
            score: scoreResult.ruleScore,
            hybridScore: scoreResult.finalScore,
            mlScore: scoreResult.mlScore,
            confidence: scoreResult.confidence,
            complaintType: scoreResult.complaintType,
            markerFound: signalResult.markerFound,
            reasons: scoreResult.reasons,
            modelFeatures: {
                ...modelFeatures,
                numeric: {
                    ...(modelFeatures.numeric || {}),
                    rule_score: scoreResult.ruleScore,
                    final_score: scoreResult.finalScore,
                    ...(typeof scoreResult.mlScore === 'number' ? { ml_probability: scoreResult.mlScore } : {})
                },
                categorical: {
                    ...(modelFeatures.categorical || {}),
                    selected_complaint_type: scoreResult.complaintType || ''
                }
            },
            mlDebug: scoreResult.mlDebug || null
        };
    });

    return scored
        .sort((left, right) => {
            if ((right.hybridScore || 0) !== (left.hybridScore || 0)) {
                return (right.hybridScore || 0) - (left.hybridScore || 0);
            }

            if (right.score !== left.score) {
                return right.score - left.score;
            }

            return (right.signals?.length || 0) - (left.signals?.length || 0);
        })
        .slice(0, profile.maxCandidates || scored.length);
}

export function analyzeComplaintReview(review, options = {}) {
    const normalizedReview = normalizeReview(review);

    if (!normalizedReview.normalized) {
        return buildNoComplaintResult(normalizedReview);
    }

    const profile = normalizeProfile(options.profile, normalizedReview.normalized);
    const candidates = buildScoredCandidates(normalizedReview, profile);
    const selection = selectComplaintCandidate(candidates, { safeThreshold: profile.safeThreshold });

    if (!selection.best) {
        return buildNoComplaintResult(normalizedReview);
    }

    const complaintText = normalizeComplaintSpan(selection.best.text);
    const categoryHints = {
        likelyCategoryHint: selection.best.modelFeatures?.categorical?.likely_category_hint,
        evidenceSignals: selection.best.modelFeatures?.evidenceSignals || []
    };
    const complaintCategory = categorizeComplaint(complaintText, categoryHints);
    const condensedComplaint = condenseComplaint(complaintText, complaintCategory.category);
    const condensedCategory = categorizeComplaint(condensedComplaint || complaintText, categoryHints);
    const hintedCategory = categoryHints.likelyCategoryHint || 'Other';
    const finalCategory = complaintCategory.category !== 'Other'
        ? complaintCategory.category
        : condensedCategory.category !== 'Other'
            ? condensedCategory.category
            : hintedCategory;

    return {
        original_review: normalizedReview.original,
        has_hidden_complaint: true,
        complaint_text: complaintText,
        condensed_complaint: condensedComplaint,
        category: finalCategory,
        marker_found: selection.best.markerFound,
        complaint_type: selection.best.complaintType,
        confidence: Number(selection.best.confidence.toFixed(2)),
        evidence_signals: toEvidenceSignals(selection.best),
        model_features: selection.best.modelFeatures || emptyModelFeatures(),
        word_count: normalizedReview.wordCount,
        review: normalizedReview.original,
        original_text: normalizedReview.original,
        complaint: condensedComplaint,
        marker: selection.best.markerFound,
        wordCount: normalizedReview.wordCount,
        complaint_clause_raw: selection.best.text,
        ranked_candidates: selection.ranked,
        analyzer_profile: profile.analyzerKey
    };
}

export function analyzeComplaintReviewObject(reviewObj, options = {}) {
    const id = reviewObj && typeof reviewObj === 'object' && reviewObj.id
        ? reviewObj.id
        : crypto.randomUUID();

    const reviewText = typeof reviewObj === 'string'
        ? reviewObj
        : reviewObj?.review ?? reviewObj?.text ?? '';

    return {
        id,
        ...analyzeComplaintReview(reviewText, options)
    };
}
