import { ASPECT_KEYWORD_GROUPS } from '../lexicons/aspectKeywords.js';
import { categorizeComplaint } from './topicCategorizer.js';
import { detectComplaintSignals } from './complaintSignalDetector.js';
import { countWords } from './textUtils.js';
import { COMPLAINT_TYPE_PRECEDENCE } from './complaintSelector.js';

const SIGNAL_TYPE_TO_COMPLAINT_TYPE = {
    EXCEPTION_MARKER: 'EXCEPTION_COMPLAINT',
    EXPECTATION_FAILURE: 'EXPECTATION_FAILURE',
    WISH_COUNTERFACTUAL: 'WISH_REQUEST',
    NEGATIVE_COMPARISON: 'NEGATIVE_COMPARISON',
    PREFERENCE_AVOIDANCE: 'PREFERENCE_AVOIDANCE',
    SOFT_DISSATISFACTION: 'SOFT_DISSATISFACTION',
    CONTRASTIVE_MARKER: 'EXPLICIT_CONTRAST',
    CONCESSIVE_PATTERN: 'EXPLICIT_CONTRAST',
    DIRECT_NEGATIVE_CUE: 'DIRECT_COMPLAINT'
};

function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectAspectMatches(text) {
    const lowered = (text || '').toLowerCase();
    const categories = [];
    const matchedKeywords = [];

    ASPECT_KEYWORD_GROUPS.forEach(group => {
        const groupMatches = group.keywords.filter(keyword => {
            const normalizedKeyword = keyword.toLowerCase();
            if (normalizedKeyword.includes(' ')) {
                return lowered.includes(normalizedKeyword);
            }

            return new RegExp(`\\b${escapeForRegex(normalizedKeyword)}\\b`, 'i').test(lowered);
        });

        if (groupMatches.length > 0) {
            categories.push(group.category);
            matchedKeywords.push(...groupMatches);
        }
    });

    return {
        aspectCategories: [...new Set(categories)],
        matchedAspectKeywords: [...new Set(matchedKeywords)]
    };
}

function countSignals(signals, type) {
    return signals.filter(signal => signal.type === type).length;
}

function hasSignal(signals, type) {
    return countSignals(signals, type) > 0;
}

function normalizeComplaintHints(hints = []) {
    return [...new Set(
        hints
            .map(hint => SIGNAL_TYPE_TO_COMPLAINT_TYPE[hint] || hint)
            .filter(hint => hint && hint !== 'CONCESSIVE_PRAISE')
    )];
}

function deriveHintsFromSignals(signals = []) {
    return normalizeComplaintHints(
        signals
            .map(signal => SIGNAL_TYPE_TO_COMPLAINT_TYPE[signal.type])
            .filter(Boolean)
    );
}

function rankComplaintHints(hints = []) {
    const precedenceIndex = hint => {
        const index = COMPLAINT_TYPE_PRECEDENCE.indexOf(hint);
        return index === -1 ? COMPLAINT_TYPE_PRECEDENCE.length : index;
    };

    return normalizeComplaintHints(hints)
        .sort((left, right) => precedenceIndex(left) - precedenceIndex(right));
}

function deriveLikelyComplaintType(candidate, signalResult) {
    if (candidate?.complaintType) {
        return candidate.complaintType;
    }

    const rankedHints = rankComplaintHints([
        ...(candidate?.familyHints || []),
        ...(signalResult?.complaintTypeHints || []),
        ...deriveHintsFromSignals(signalResult?.signals || [])
    ]);

    return rankedHints[0] || null;
}

export function extractCandidateFeatures(candidate, normalizedReview) {
    const text = candidate?.text || '';
    const signalResult = Array.isArray(candidate?.signals)
        ? {
            signals: candidate.signals,
            complaintTypeHints: rankComplaintHints([
                ...(candidate.familyHints || []),
                ...deriveHintsFromSignals(candidate.signals)
            ]),
            markerFound: candidate.markerFound || null
        }
        : detectComplaintSignals(text);

    const signals = signalResult.signals || [];
    const complaintSignals = signals.filter(signal => signal.type !== 'PRAISE_CUE');
    const aspectInfo = collectAspectMatches(text);
    const categoryHint = categorizeComplaint(text, {
        evidenceSignals: aspectInfo.aspectCategories.map(category => `ASPECT_CATEGORY: ${category}`)
    }).category;
    const reviewLength = normalizedReview?.wordCount || countWords(normalizedReview?.normalized || normalizedReview?.original || '');
    const candidateLength = countWords(text);
    const boundaryReason = candidate?.boundaryReason || 'unknown';
    const quoteArtifactPresent = /["“”`]/.test(text);
    const csvIdArtifactPresent = /\b(?:row|review|id)[_-]?\d+\b/i.test(text) || /^(?:\d+\s*,)/.test(text);

    const numeric = {
        candidate_length_tokens: candidateLength,
        review_length_tokens: reviewLength,
        negative_cue_count: countSignals(signals, 'DIRECT_NEGATIVE_CUE'),
        praise_cue_count: countSignals(signals, 'PRAISE_CUE'),
        aspect_count: aspectInfo.matchedAspectKeywords.length,
        complaint_signal_count: complaintSignals.length,
        total_signal_count: signals.length
    };

    const boolean = {
        contains_contrast_marker: hasSignal(signals, 'CONTRASTIVE_MARKER'),
        contains_exception_marker: hasSignal(signals, 'EXCEPTION_MARKER'),
        contains_concessive_front: hasSignal(signals, 'CONCESSIVE_PATTERN'),
        contains_expectation_pattern: hasSignal(signals, 'EXPECTATION_FAILURE'),
        contains_comparison_pattern: hasSignal(signals, 'NEGATIVE_COMPARISON'),
        contains_preference_avoidance_pattern: hasSignal(signals, 'PREFERENCE_AVOIDANCE'),
        contains_wish_counterfactual_pattern: hasSignal(signals, 'WISH_COUNTERFACTUAL'),
        contains_soft_dissatisfaction: hasSignal(signals, 'SOFT_DISSATISFACTION'),
        contains_direct_negative_cue: hasSignal(signals, 'DIRECT_NEGATIVE_CUE'),
        contains_aspect_keyword: aspectInfo.matchedAspectKeywords.length > 0,
        contains_praise_cue: hasSignal(signals, 'PRAISE_CUE'),
        starts_after_marker: boundaryReason.startsWith('after:') || boundaryReason.startsWith('post_marker:'),
        appears_in_right_clause: candidate?.relativeClauseSide === 'right',
        appears_in_left_clause: candidate?.relativeClauseSide === 'left',
        quote_artifact_present: quoteArtifactPresent,
        csv_id_artifact_present: csvIdArtifactPresent
    };

    const categorical = {
        likely_complaint_type: deriveLikelyComplaintType(candidate, signalResult),
        likely_category_hint: categoryHint,
        source: candidate?.source || 'clause',
        boundary_reason: boundaryReason,
        marker_found: signalResult.markerFound || null,
        candidate_text: text.toLowerCase(),
        family_hints: rankComplaintHints(candidate?.familyHints || []).join('|')
    };

    const evidenceSignals = [
        ...signals.map(signal => `${signal.type}: ${signal.match}`),
        ...aspectInfo.aspectCategories.map(category => `ASPECT_CATEGORY: ${category}`),
        ...aspectInfo.matchedAspectKeywords.map(keyword => `ASPECT_KEYWORD: ${keyword}`)
    ];

    return {
        numeric,
        boolean,
        categorical,
        evidenceSignals: [...new Set(evidenceSignals)]
    };
}

export function flattenCandidateFeatures(featureSet) {
    const numeric = featureSet?.numeric || {};
    const boolean = featureSet?.boolean || {};

    return {
        ...numeric,
        ...Object.fromEntries(
            Object.entries(boolean).map(([key, value]) => [key, value ? 1 : 0])
        )
    };
}
