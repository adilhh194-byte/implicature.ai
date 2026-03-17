import { describe, expect, it } from 'vitest';
import { detectComplaintSignals } from './complaintSignalDetector.js';

describe('complaintSignalDetector', () => {
    it('detects contrastive markers', () => {
        const result = detectComplaintSignals('but the search is slow');

        expect(result.signals.some(signal => signal.type === 'CONTRASTIVE_MARKER')).toBe(true);
        expect(result.markerFound).toBe('but');
    });

    it('detects exception markers', () => {
        const result = detectComplaintSignals('except notifications');

        expect(result.signals.some(signal => signal.type === 'EXCEPTION_MARKER')).toBe(true);
        expect(result.markerFound).toBe('except');
    });

    it('detects concessive patterns', () => {
        const result = detectComplaintSignals('even though the design is nice, the app is confusing');

        expect(result.signals.some(signal => signal.type === 'CONCESSIVE_PATTERN')).toBe(true);
    });

    it('does not fake legacy markers for soft dissatisfaction', () => {
        const result = detectComplaintSignals('battery life could be better');

        expect(result.signals.some(signal => signal.type === 'SOFT_DISSATISFACTION')).toBe(true);
        expect(result.markerFound).toBe(null);
    });

    it('detects expectation mismatch patterns', () => {
        const result = detectComplaintSignals('I expected more from the camera');

        expect(result.signals.some(signal => signal.type === 'EXPECTATION_FAILURE')).toBe(true);
        expect(result.markerFound).toBe(null);
    });

    it('detects wish and counterfactual complaints', () => {
        const result = detectComplaintSignals('I wish support replied faster');

        expect(result.signals.some(signal => signal.type === 'WISH_COUNTERFACTUAL')).toBe(true);
    });

    it('detects preference and avoidance complaints', () => {
        const result = detectComplaintSignals("I'd rather not rely on this outside home");

        expect(result.signals.some(signal => signal.type === 'PREFERENCE_AVOIDANCE')).toBe(true);
    });

    it('detects negative comparison patterns', () => {
        const result = detectComplaintSignals('The old version was smoother');

        expect(result.signals.some(signal => signal.type === 'NEGATIVE_COMPARISON')).toBe(true);
    });

    it('detects direct negative cues', () => {
        const result = detectComplaintSignals('The app is buggy and slow');

        expect(result.signals.some(signal => signal.type === 'DIRECT_NEGATIVE_CUE')).toBe(true);
    });

    it('detects praise context to reduce false positives', () => {
        const result = detectComplaintSignals('Works fine overall');

        expect(result.signals.some(signal => signal.type === 'PRAISE_CUE')).toBe(true);
    });
});
