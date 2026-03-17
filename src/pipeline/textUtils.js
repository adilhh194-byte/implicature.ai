/**
 * Normalizes whitespace by collapsing multiple spaces, tabs, and newlines into single spaces
 * and trimming the result.
 */
export function normalizeWhitespace(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * Counts words in a string, filtering out empty matches and handling punctuation.
 */
export function countWords(text) {
    if (!text || typeof text !== 'string') return 0;
    const words = text.trim().split(/\s+/);
    return words.filter(word => word.length > 0).length;
}

/**
 * Basic sentence splitter using common punctuation markers.
 */
export function splitIntoSentences(text) {
    if (!text || typeof text !== 'string') return [];
    // Split by ., !, or ? followed by whitespace or end of string
    return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

/**
 * Splits a sentence into clauses based on commas, semicolons, and certain conjunctions.
 */
export function splitIntoClauses(text) {
    if (!text || typeof text !== 'string') return [];
    // Simple split by comma or semicolon for clause-level analysis
    return text.split(/[,;]\s*/).filter(c => c.trim().length > 0);
}
