import { countWords } from './textUtils.js';

const SMART_PUNCTUATION_REPLACEMENTS = [
    [/[\u2018\u2019]/g, "'"],
    [/[\u201C\u201D]/g, '"'],
    [/[\u2013\u2014]/g, ' - ']
];

const CONTRACTION_REPLACEMENTS = [
    [/\bcan't\b/gi, 'can not'],
    [/\bwon't\b/gi, 'will not'],
    [/\bisn't\b/gi, 'is not'],
    [/\bwasn't\b/gi, 'was not'],
    [/\bdidn't\b/gi, 'did not'],
    [/\bdoesn't\b/gi, 'does not'],
    [/\bcouldn't\b/gi, 'could not'],
    [/\bshouldn't\b/gi, 'should not']
];

function normalizeSmartPunctuation(text) {
    return SMART_PUNCTUATION_REPLACEMENTS.reduce(
        (current, [pattern, replacement]) => current.replace(pattern, replacement),
        text
    );
}

function expandContractions(text) {
    return CONTRACTION_REPLACEMENTS.reduce(
        (current, [pattern, replacement]) => current.replace(pattern, replacement),
        text
    );
}

function splitSentences(text) {
    if (!text) {
        return [];
    }

    return text
        .split(/(?<=[.!?;])\s+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);
}

export function normalizeReview(review) {
    const original = typeof review === 'string' ? review : '';

    let normalized = original.trim();
    normalized = normalizeSmartPunctuation(normalized);
    normalized = expandContractions(normalized);
    normalized = normalized.replace(/\s+/g, ' ');
    normalized = normalized.replace(/\s+([,.!?;:])/g, '$1');
    normalized = normalized.trim();

    return {
        original,
        normalized,
        lowered: normalized.toLowerCase(),
        wordCount: countWords(normalized),
        sentences: splitSentences(normalized)
    };
}
