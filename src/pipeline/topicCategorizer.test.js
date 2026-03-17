import { describe, expect, it } from 'vitest';
import { categorizeComplaint } from './topicCategorizer.js';

describe('topicCategorizer', () => {
    it('categorizes weak battery life with rule evidence', () => {
        const result = categorizeComplaint('weak battery life');

        expect(result.category).toBe('Battery');
        expect(result.confidence).toBeGreaterThan(0.4);
        expect(result.matchedKeywords).toContain('weak battery life');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes slow charging separately from battery', () => {
        const result = categorizeComplaint('charging is painfully slow');

        expect(result.category).toBe('Charging');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes slow support response', () => {
        const result = categorizeComplaint('slow support response');

        expect(result.category).toBe('Support');
        expect(result.matchedKeywords).toContain('slow support response');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes performance regression', () => {
        const result = categorizeComplaint('performance regression');

        expect(result.category).toBe('Performance');
        expect(result.matchedKeywords).toContain('performance regression');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes reliability regression', () => {
        const result = categorizeComplaint('reliability regression');

        expect(result.category).toBe('Reliability');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes overpriced as price', () => {
        const result = categorizeComplaint('overpriced');

        expect(result.category).toBe('Price');
        expect(result.matchedKeywords).toContain('overpriced');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes poor value separately from price', () => {
        const result = categorizeComplaint('not worth it for the money');

        expect(result.category).toBe('Value');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes notification issue as features', () => {
        const result = categorizeComplaint('notification issue');

        expect(result.category).toBe('Features');
        expect(result.matchedKeywords).toContain('notification issue');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes camera underperforms', () => {
        const result = categorizeComplaint('camera underperforms');

        expect(result.category).toBe('Camera');
        expect(result.matchedKeywords).toContain('camera underperforms');
        expect(result.fallbackUsed).toBe(false);
    });

    it('categorizes poor browser experience as compatibility', () => {
        const result = categorizeComplaint('poor browser experience');

        expect(result.category).toBe('Compatibility');
        expect(result.fallbackUsed).toBe(false);
    });

    it('does not misclassify damaged product as shipping', () => {
        const result = categorizeComplaint('damaged product');

        expect(result.category).toBe('Quality');
        expect(result.fallbackUsed).toBe(false);
    });

    it('distinguishes damaged package as delivery', () => {
        const result = categorizeComplaint('package arrived damaged');

        expect(result.category).toBe('Delivery');
        expect(result.fallbackUsed).toBe(false);
    });

    it('uses classifier fallback for disappointment-like complaints', () => {
        const result = categorizeComplaint("it's a disappointment");

        expect(result.category).toBe('Other');
        expect(result.fallbackUsed).toBe(true);
        expect(result.confidence).toBeGreaterThan(0.2);
    });

    it('uses classifier fallback for lacking complaints', () => {
        const result = categorizeComplaint('I found it lacking');

        expect(result.category).toBe('Other');
        expect(result.fallbackUsed).toBe(true);
    });

    it('uses classifier fallback for preference-style complaints', () => {
        const result = categorizeComplaint("it's not for me");

        expect(result.category).toBe('Other');
        expect(result.fallbackUsed).toBe(true);
    });

    it('can use feature hints during fallback', () => {
        const result = categorizeComplaint('it is lacking', { likelyCategoryHint: 'Features' });

        expect(result.category).toBe('Features');
        expect(result.fallbackUsed).toBe(true);
        expect(result.matchedKeywords).toContain('hint:Features');
    });
});
