import { countWords } from './textUtils.js';

export const COMPLAINT_TYPE_PRECEDENCE = [
    'EXCEPTION_COMPLAINT',
    'EXPECTATION_FAILURE',
    'WISH_REQUEST',
    'NEGATIVE_COMPARISON',
    'PREFERENCE_AVOIDANCE',
    'SOFT_DISSATISFACTION',
    'EXPLICIT_CONTRAST',
    'DIRECT_COMPLAINT'
];

const SAFE_SCORE_THRESHOLD = 3;
const SOURCE_PRECEDENCE = {
    clause: 0,
    sentence: 1,
    review: 2
};
const TYPE_PRECEDENCE_MARGIN = 2.1;

function complaintSignalCount(candidate) {
    return (candidate.signals || []).filter(signal => signal.type !== 'PRAISE_CUE').length;
}

function complaintTypeRank(complaintType) {
    const index = COMPLAINT_TYPE_PRECEDENCE.indexOf(complaintType || '');
    return index === -1 ? COMPLAINT_TYPE_PRECEDENCE.length : index;
}

function sourceRank(source) {
    return SOURCE_PRECEDENCE[source] ?? 99;
}

function informativeLength(candidate) {
    return countWords(candidate.text || '');
}

function effectiveScore(candidate) {
    return typeof candidate.hybridScore === 'number' ? candidate.hybridScore : (candidate.score || 0);
}

function compareCandidates(left, right) {
    const effectiveDelta = effectiveScore(right) - effectiveScore(left);
    if (Math.abs(effectiveDelta) > TYPE_PRECEDENCE_MARGIN) {
        return effectiveDelta;
    }

    const typeDelta = complaintTypeRank(left.complaintType) - complaintTypeRank(right.complaintType);
    if (typeDelta !== 0) {
        return typeDelta;
    }

    if ((right.score || 0) !== (left.score || 0)) {
        return (right.score || 0) - (left.score || 0);
    }

    const signalDelta = complaintSignalCount(right) - complaintSignalCount(left);
    if (signalDelta !== 0) {
        return signalDelta;
    }

    const sourceDelta = sourceRank(left.source) - sourceRank(right.source);
    if (sourceDelta !== 0) {
        return sourceDelta;
    }

    const informativeDelta = informativeLength(right) - informativeLength(left);
    if (informativeDelta !== 0) {
        return informativeDelta;
    }

    return (right.confidence || 0) - (left.confidence || 0);
}

export function selectComplaintCandidate(candidates, options = {}) {
    const ranked = Array.isArray(candidates)
        ? [...candidates].sort(compareCandidates)
        : [];

    const safeThreshold = typeof options.safeThreshold === 'number'
        ? options.safeThreshold
        : SAFE_SCORE_THRESHOLD;

    const bestCandidate = ranked[0] || null;
    const best = bestCandidate
        && complaintSignalCount(bestCandidate) > 0
        && Math.max(bestCandidate.score || 0, effectiveScore(bestCandidate)) >= safeThreshold
        ? bestCandidate
        : null;

    return {
        best,
        ranked
    };
}
