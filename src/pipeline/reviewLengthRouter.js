import { countWords } from './textUtils.js';

export const REVIEW_LENGTH_THRESHOLDS = {
    midMinWords: 26,
    longMinWords: 101
};

function createAnalyzerProfile({ analyzerKey, includeSentenceCandidates, maxCandidates, safeThreshold }) {
    return {
        analyzerKey,
        includeSentenceCandidates,
        maxCandidates,
        safeThreshold,
        candidatePruningStrategy: maxCandidates <= 4 ? 'tight' : maxCandidates <= 8 ? 'balanced' : 'broad',
        thresholdCalibration: safeThreshold >= 4 ? 'strict' : 'standard'
    };
}

export const ANALYZER_PROFILES = {
    short: createAnalyzerProfile({
        analyzerKey: 'short',
        includeSentenceCandidates: false,
        maxCandidates: 4,
        safeThreshold: 3
    }),
    mid: createAnalyzerProfile({
        analyzerKey: 'mid',
        includeSentenceCandidates: false,
        maxCandidates: 8,
        safeThreshold: 3
    }),
    long: createAnalyzerProfile({
        analyzerKey: 'long',
        includeSentenceCandidates: true,
        maxCandidates: 16,
        safeThreshold: 4
    })
};

export function getAnalyzerForReview(text) {
    const wordCount = countWords(text);

    if (wordCount >= REVIEW_LENGTH_THRESHOLDS.longMinWords) {
        return { analyzerKey: 'long', wordCount };
    }

    if (wordCount >= REVIEW_LENGTH_THRESHOLDS.midMinWords) {
        return { analyzerKey: 'mid', wordCount };
    }

    return { analyzerKey: 'short', wordCount };
}

export function getProfileForAnalyzerKey(analyzerKey) {
    return ANALYZER_PROFILES[analyzerKey] || ANALYZER_PROFILES.mid;
}

export function getProfileForReview(text) {
    const routing = getAnalyzerForReview(text);
    return {
        ...getProfileForAnalyzerKey(routing.analyzerKey),
        wordCount: routing.wordCount
    };
}
