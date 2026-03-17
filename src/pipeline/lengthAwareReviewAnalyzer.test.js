import { describe, expect, it } from 'vitest';
import { ShortReviewAnalyzer } from './shortReviewAnalyzer.js';
import { MidReviewAnalyzer } from './midReviewAnalyzer.js';
import { LongReviewAnalyzer } from './longReviewAnalyzer.js';
import { getAnalyzerForReview, getProfileForAnalyzerKey } from './reviewLengthRouter.js';

describe('length-aware analyzers', () => {
    it('detects short contrast complaints with the shared core', () => {
        const analyzer = new ShortReviewAnalyzer();
        const result = analyzer.analyze({ review: 'Great app, but shipping was slow.' });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe('EXPLICIT_CONTRAST');
        expect(result.category).toBe('Shipping');
        expect(result.complaint_text).toContain('shipping was slow');
    });

    it('detects short expectation failures with the shared core', () => {
        const analyzer = new ShortReviewAnalyzer();
        const result = analyzer.analyze({ review: 'I expected more from the camera.' });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe('EXPECTATION_FAILURE');
        expect(result.category).toBe('Camera');
        expect(result.condensed_complaint).toBe('camera underperforms');
    });

    it('detects mid-length soft dissatisfaction without switching complaint logic', () => {
        const analyzer = new MidReviewAnalyzer();
        const result = analyzer.analyze({
            review: 'The setup was quick and the design is polished, and after using it for a week I feel the battery life could be better for daily commuting.'
        });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe('SOFT_DISSATISFACTION');
        expect(result.category).toBe('Battery');
        expect(result.condensed_complaint).toBe('weak battery life');
    });

    it('detects long concessive reviews with the same contrast family', () => {
        const analyzer = new LongReviewAnalyzer();
        const result = analyzer.analyze({
            review: 'Even though the onboarding was straightforward and the screen looks sharp, the experience becomes frustrating after a few days because charging is still painfully slow during normal workdays. I can manage around it, but it keeps turning a simple top-up into a wait that feels longer than it should.'
        });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe('EXPLICIT_CONTRAST');
        expect(result.category).toBe('Charging');
        expect(result.complaint_text.toLowerCase()).toContain('charging');
    });

    it('detects long comparison and regression reviews consistently', () => {
        const analyzer = new LongReviewAnalyzer();
        const result = analyzer.analyze({
            review: 'The interface still looks clean and the setup process is easy enough. After the recent update, the previous version was much more reliable in daily use. It used to hold a connection throughout the afternoon, and now I keep noticing random drops that make the product feel less dependable than it was before.'
        });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe('NEGATIVE_COMPARISON');
        expect(result.category).toBe('Reliability');
        expect(result.condensed_complaint).toBe('reliability regression');
    });

    it('recognizes explicit contrast consistently across short and long reviews', () => {
        const shortAnalyzer = new ShortReviewAnalyzer();
        const longAnalyzer = new LongReviewAnalyzer();

        const shortResult = shortAnalyzer.analyze({ review: 'Great app, but shipping was slow.' });
        const longResult = longAnalyzer.analyze({
            review: 'Even though the setup was easy and the display looks sharp, shipping was still slow and the order took longer than promised. The product itself is decent, and that shipping delay made the overall experience feel worse than it needed to.'
        });

        expect(shortResult.complaint_type).toBe('EXPLICIT_CONTRAST');
        expect(longResult.complaint_type).toBe('EXPLICIT_CONTRAST');
        expect(shortResult.category).toBe('Shipping');
        expect(longResult.category).toBe('Shipping');
    });

    it('recognizes expectation failure consistently across short and long reviews', () => {
        const shortAnalyzer = new ShortReviewAnalyzer();
        const longAnalyzer = new LongReviewAnalyzer();

        const shortResult = shortAnalyzer.analyze({ review: 'I expected more from the camera.' });
        const longResult = longAnalyzer.analyze({
            review: 'The phone feels premium, the battery is fine for casual use, and the speakers are acceptable for calls. I expected more from the camera once I started taking evening photos, because the results are softer and less reliable than the marketing suggested.'
        });

        expect(shortResult.complaint_type).toBe('EXPECTATION_FAILURE');
        expect(longResult.complaint_type).toBe('EXPECTATION_FAILURE');
        expect(shortResult.category).toBe('Camera');
        expect(longResult.category).toBe('Camera');
    });

    it('keeps routing and profile settings aligned with the shared core', () => {
        expect(getAnalyzerForReview('short review').analyzerKey).toBe('short');
        expect(getAnalyzerForReview(Array(40).fill('word').join(' ')).analyzerKey).toBe('mid');
        expect(getAnalyzerForReview(Array(130).fill('word').join(' ')).analyzerKey).toBe('long');
        expect(getProfileForAnalyzerKey('short').maxCandidates).toBeLessThan(getProfileForAnalyzerKey('mid').maxCandidates);
        expect(getProfileForAnalyzerKey('mid').maxCandidates).toBeLessThan(getProfileForAnalyzerKey('long').maxCandidates);
        expect(getProfileForAnalyzerKey('long').includeSentenceCandidates).toBe(true);
        expect(getProfileForAnalyzerKey('short')).not.toHaveProperty('includeWholeReviewCandidate');
    });
});


