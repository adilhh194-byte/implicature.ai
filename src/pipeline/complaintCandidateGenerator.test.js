import { describe, expect, it } from 'vitest';
import { normalizeReview } from './reviewNormalizer.js';
import { generateComplaintCandidates } from './complaintCandidateGenerator.js';

describe('complaintCandidateGenerator', () => {
    it('generates local and sentence candidates around explicit contrast', () => {
        const candidates = generateComplaintCandidates(normalizeReview('Great app, but the search is slow.'));

        expect(candidates.some(candidate => candidate.text.includes('but the search is slow'))).toBe(true);
        expect(candidates.some(candidate => candidate.source === 'sentence')).toBe(true);
        expect(candidates.some(candidate => candidate.boundaryReason.includes('after:but'))).toBe(true);
    });

    it('generates family-driven spans for expectation and wish forms', () => {
        const candidates = generateComplaintCandidates(normalizeReview("I'd give it five stars only if the bugs were fixed. I expected better quality."));

        expect(candidates.some(candidate => candidate.text.includes('only if the bugs were fixed'))).toBe(true);
        expect(candidates.some(candidate => candidate.text.includes('expected better quality'))).toBe(true);
    });

    it('keeps preference, comparison, and soft dissatisfaction spans', () => {
        const candidates = generateComplaintCandidates(normalizeReview("I'd rather use a different browser. The old version was more reliable. It's just average. It's not for me."));

        expect(candidates.some(candidate => candidate.familyHints.includes('PREFERENCE_AVOIDANCE'))).toBe(true);
        expect(candidates.some(candidate => candidate.familyHints.includes('NEGATIVE_COMPARISON'))).toBe(true);
        expect(candidates.some(candidate => candidate.familyHints.includes('SOFT_DISSATISFACTION'))).toBe(true);
    });
});
