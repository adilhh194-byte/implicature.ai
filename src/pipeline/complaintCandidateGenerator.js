import {
    CONTRASTIVE_MARKER_PATTERNS,
    EXCEPTION_MARKER_PATTERNS
} from '../lexicons/discourseMarkers.js';
import { CONCESSIVE_PATTERN_OBJECTS } from '../lexicons/concessivePatterns.js';
import { EXPECTATION_PATTERN_OBJECTS } from '../lexicons/expectationPatterns.js';
import { COMPARISON_PATTERN_OBJECTS } from '../lexicons/comparisonPatterns.js';
import { PREFERENCE_AVOIDANCE_PATTERN_OBJECTS } from '../lexicons/preferenceAvoidancePatterns.js';
import { WISH_COUNTERFACTUAL_PATTERN_OBJECTS } from '../lexicons/wishCounterfactualPatterns.js';
import { SOFT_DISSATISFACTION_PATTERN_OBJECTS } from '../lexicons/softDissatisfactionPatterns.js';
import { DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS } from '../lexicons/negativeCueWords.js';
import { normalizeReview } from './reviewNormalizer.js';
import { segmentClauses } from './clauseSegmenter.js';
import { detectComplaintSignals } from './complaintSignalDetector.js';
import { countWords } from './textUtils.js';
import { matchPattern } from '../lexicons/patternUtils.js';

function cleanCandidateText(text) {
    return (text || '')
        .replace(/^[\s,;:.!?-]+|[\s,;:.!?-]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

const DISCOURSE_BOUNDARY_PATTERNS = [
    ...CONTRASTIVE_MARKER_PATTERNS,
    ...EXCEPTION_MARKER_PATTERNS,
    ...CONCESSIVE_PATTERN_OBJECTS,
    { pattern: /\binstead\s+of\b/i, label: 'instead of', family: 'PREFERENCE_AVOIDANCE' },
    { pattern: /\bconversely\b/i, label: 'conversely', family: 'EXPLICIT_CONTRAST' },
    { pattern: /\bon\s+the\s+other\s+hand\b/i, label: 'on the other hand', family: 'EXPLICIT_CONTRAST' },
    { pattern: /\bwhereas\b/i, label: 'whereas', family: 'EXPLICIT_CONTRAST' },
    { pattern: /(?:^|[,;]\s*)while\b/i, label: 'while', family: 'EXPLICIT_CONTRAST' },
    { pattern: /\bregardless(?:\s+of)?\b/i, label: 'regardless', family: 'EXPLICIT_CONTRAST' }
];

const FAMILY_START_PATTERNS = [
    ...EXPECTATION_PATTERN_OBJECTS,
    ...WISH_COUNTERFACTUAL_PATTERN_OBJECTS,
    ...PREFERENCE_AVOIDANCE_PATTERN_OBJECTS,
    ...COMPARISON_PATTERN_OBJECTS,
    ...SOFT_DISSATISFACTION_PATTERN_OBJECTS,
    ...DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS
];

function getSentenceStart(normalizedReview, sentence, fallbackCursor) {
    const index = normalizedReview.normalized.indexOf(sentence, fallbackCursor);
    return index >= 0 ? index : fallbackCursor;
}

function collectFamilyHints(text) {
    const signalResult = detectComplaintSignals(text);
    return {
        familyHints: signalResult.complaintTypeHints,
        complaintSignalCount: signalResult.signals.filter(signal => signal.type !== 'PRAISE_CUE').length,
        markerFound: signalResult.markerFound
    };
}

function shouldKeepCandidate(text, familyHints, complaintSignalCount) {
    const tokenCount = countWords(text);
    if (tokenCount >= 3) {
        return true;
    }

    return familyHints.length > 0 || complaintSignalCount > 0;
}

function addCandidate(collection, seen, candidate) {
    const cleanedText = cleanCandidateText(candidate.text);
    const familyInfo = collectFamilyHints(cleanedText);
    if (!cleanedText || !shouldKeepCandidate(cleanedText, familyInfo.familyHints, familyInfo.complaintSignalCount)) {
        return;
    }

    const key = `${candidate.source}:${candidate.sentenceIndex}:${candidate.boundaryReason}:${cleanedText.toLowerCase()}`;
    if (seen.has(key)) {
        return;
    }

    seen.add(key);
    collection.push({
        text: cleanedText,
        sentenceIndex: candidate.sentenceIndex,
        clauseIndex: candidate.clauseIndex ?? -1,
        source: candidate.source,
        familyHints: [...new Set([...(candidate.familyHints || []), ...familyInfo.familyHints])],
        boundaryReason: candidate.boundaryReason,
        startHint: candidate.startHint ?? null,
        endHint: candidate.endHint ?? null,
        relativeClauseSide: candidate.relativeClauseSide || null,
        markerFound: familyInfo.markerFound
    });
}

function collectBoundaryMatches(sentence) {
    return DISCOURSE_BOUNDARY_PATTERNS
        .map(patternObject => {
            const found = matchPattern(sentence, patternObject);
            if (!found) {
                return null;
            }

            return {
                label: patternObject.label || (typeof patternObject.pattern === 'string' ? patternObject.pattern : 'boundary'),
                familyHint: patternObject.family,
                index: found.index,
                match: found.match
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.index - right.index);
}

function collectFamilyStartMatches(sentence) {
    return FAMILY_START_PATTERNS
        .map(patternObject => {
            const found = matchPattern(sentence, patternObject);
            if (!found) {
                return null;
            }

            return {
                familyHint: patternObject.family,
                index: found.index,
                label: patternObject.label || (typeof patternObject.pattern === 'string' ? patternObject.pattern : patternObject.family)
            };
        })
        .filter(Boolean)
        .sort((left, right) => left.index - right.index);
}

function shouldIncludeSentenceCandidate(sentence, sentenceClauses, options) {
    if (options.includeSentenceCandidates) {
        return true;
    }

    if (sentenceClauses.length > 1) {
        return true;
    }

    const familyInfo = collectFamilyHints(sentence);
    return familyInfo.complaintSignalCount > 0 || familyInfo.familyHints.length > 0;
}

export function generateComplaintCandidates(reviewObj, options = {}) {
    const normalizedReview = reviewObj?.normalized
        ? reviewObj
        : normalizeReview(reviewObj || '');

    if (!normalizedReview.normalized) {
        return [];
    }

    const candidates = [];
    const seen = new Set();
    const clauses = segmentClauses(normalizedReview);
    let searchCursor = 0;

    normalizedReview.sentences.forEach((sentence, sentenceIndex) => {
        const sentenceStart = getSentenceStart(normalizedReview, sentence, searchCursor);
        searchCursor = sentenceStart + sentence.length;
        const sentenceEnd = sentenceStart + sentence.length;
        const sentenceClauses = clauses.filter(clause => clause.sentenceIndex === sentenceIndex);

        sentenceClauses.forEach(clause => {
            addCandidate(candidates, seen, {
                text: clause.text,
                sentenceIndex,
                clauseIndex: clause.clauseIndex,
                source: 'clause',
                boundaryReason: 'segment_clause',
                startHint: clause.startHint,
                endHint: clause.endHint,
                relativeClauseSide: clause.clauseIndex === 0 ? 'left' : 'right'
            });
        });

        if (shouldIncludeSentenceCandidate(sentence, sentenceClauses, options)) {
            addCandidate(candidates, seen, {
                text: sentence,
                sentenceIndex,
                clauseIndex: -1,
                source: 'sentence',
                boundaryReason: 'sentence_context',
                startHint: sentenceStart,
                endHint: sentenceEnd,
                relativeClauseSide: null
            });
        }

        collectBoundaryMatches(sentence).forEach(match => {
            const leftText = sentence.slice(0, match.index);
            const rightText = sentence.slice(match.index);
            const postMarkerText = sentence.slice(match.index + match.match.length);

            addCandidate(candidates, seen, {
                text: leftText,
                sentenceIndex,
                clauseIndex: -1,
                source: 'clause',
                familyHints: match.familyHint ? [match.familyHint] : [],
                boundaryReason: `left_of:${match.label}`,
                startHint: sentenceStart,
                endHint: sentenceStart + match.index,
                relativeClauseSide: 'left'
            });

            addCandidate(candidates, seen, {
                text: rightText,
                sentenceIndex,
                clauseIndex: -1,
                source: 'clause',
                familyHints: match.familyHint ? [match.familyHint] : [],
                boundaryReason: `after:${match.label}`,
                startHint: sentenceStart + match.index,
                endHint: sentenceEnd,
                relativeClauseSide: 'right'
            });

            addCandidate(candidates, seen, {
                text: postMarkerText,
                sentenceIndex,
                clauseIndex: -1,
                source: 'clause',
                familyHints: match.familyHint ? [match.familyHint] : [],
                boundaryReason: `post_marker:${match.label}`,
                startHint: sentenceStart + match.index + match.match.length,
                endHint: sentenceEnd,
                relativeClauseSide: 'right'
            });
        });

        collectFamilyStartMatches(sentence).forEach(match => {
            addCandidate(candidates, seen, {
                text: sentence.slice(match.index),
                sentenceIndex,
                clauseIndex: -1,
                source: 'clause',
                familyHints: [match.familyHint],
                boundaryReason: `family_start:${match.label}`,
                startHint: sentenceStart + match.index,
                endHint: sentenceEnd,
                relativeClauseSide: null
            });
        });
    });

    if (options.includeWholeReviewCandidate) {
        addCandidate(candidates, seen, {
            text: normalizedReview.normalized,
            sentenceIndex: 0,
            clauseIndex: -1,
            source: 'review',
            boundaryReason: 'whole_review',
            startHint: 0,
            endHint: normalizedReview.normalized.length,
            relativeClauseSide: null
        });
    }

    return candidates;
}

