import { describe, expect, it } from 'vitest';
import { scoreComplaintCandidate } from './complaintCandidateScorer.js';

describe('complaintCandidateScorer', () => {
    it('penalizes praise-only clauses', () => {
        const result = scoreComplaintCandidate(
            { text: 'Works fine overall' },
            { signals: [{ type: 'PRAISE_CUE', match: 'works fine', weight: -2 }] }
        );

        expect(result.score).toBeLessThan(0);
        expect(result.complaintType).toBe(null);
    });

    it('scores mixed clauses above praise-only clauses', () => {
        const result = scoreComplaintCandidate(
            { text: 'but the search is slow' },
            {
                signals: [
                    { type: 'CONTRASTIVE_MARKER', match: 'but', weight: 3 },
                    { type: 'DIRECT_NEGATIVE_CUE', match: 'slow', weight: 2 }
                ]
            }
        );

        expect(result.score).toBeGreaterThan(0);
        expect(result.complaintType).toBe('EXPLICIT_CONTRAST');
    });

    it('gives strong complaint clauses higher scores', () => {
        const result = scoreComplaintCandidate(
            { text: 'except the battery keeps crashing' },
            {
                signals: [
                    { type: 'EXCEPTION_MARKER', match: 'except', weight: 4 },
                    { type: 'DIRECT_NEGATIVE_CUE', match: 'crashing', weight: 2 }
                ]
            }
        );

        expect(result.score).toBeGreaterThan(6);
        expect(result.complaintType).toBe('EXCEPTION_COMPLAINT');
        expect(result.confidence).toBeGreaterThan(0.8);
    });
});
