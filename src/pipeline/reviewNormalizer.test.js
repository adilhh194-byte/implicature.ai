import { describe, expect, it } from 'vitest';
import { normalizeReview } from './reviewNormalizer.js';

describe('reviewNormalizer', () => {
    it('expands supported contractions', () => {
        const result = normalizeReview("It isn't bad, but it can't load and won't sync.");

        expect(result.normalized).toContain('is not');
        expect(result.normalized).toContain('can not');
        expect(result.normalized).toContain('will not');
    });

    it('cleans punctuation and spacing', () => {
        const result = normalizeReview('  \u201cNice app\u201d \u2014 but   slow.  ');

        expect(result.normalized).toBe('"Nice app" - but slow.');
        expect(result.sentences).toEqual(['"Nice app" - but slow.']);
    });

    it('keeps word counts stable after normalization', () => {
        const result = normalizeReview('Battery life could be better.');

        expect(result.wordCount).toBe(5);
    });

    it('handles empty strings safely', () => {
        const result = normalizeReview('   ');

        expect(result.normalized).toBe('');
        expect(result.lowered).toBe('');
        expect(result.wordCount).toBe(0);
        expect(result.sentences).toEqual([]);
    });
});
