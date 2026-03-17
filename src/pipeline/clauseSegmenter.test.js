import { describe, expect, it } from 'vitest';
import { normalizeReview } from './reviewNormalizer.js';
import { segmentClauses } from './clauseSegmenter.js';

describe('clauseSegmenter', () => {
    it('segments contrastive reviews into candidate clauses', () => {
        const clauses = segmentClauses(normalizeReview('Great app, but the search is slow.'));

        expect(clauses.map(clause => clause.text)).toEqual([
            'Great app',
            'but the search is slow'
        ]);
    });

    it('keeps softened complaint fragments like just too slow', () => {
        const clauses = segmentClauses(normalizeReview('Works fine overall, just too slow to load.'));

        expect(clauses.map(clause => clause.text)).toEqual([
            'Works fine overall',
            'just too slow to load'
        ]);
    });

    it('segments exception clauses without losing the target noun phrase', () => {
        const clauses = segmentClauses(normalizeReview('Everything is good except notifications.'));

        expect(clauses.map(clause => clause.text)).toEqual([
            'Everything is good',
            'except notifications'
        ]);
    });

    it('keeps single expectation clauses intact', () => {
        const clauses = segmentClauses(normalizeReview('I expected more from the battery life.'));

        expect(clauses.map(clause => clause.text)).toEqual([
            'I expected more from the battery life'
        ]);
    });
});
