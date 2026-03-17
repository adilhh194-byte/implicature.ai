import { describe, expect, it, vi } from 'vitest';
import { ReviewAnalyzer } from './reviewAnalyzer.js';

describe('ReviewAnalyzer service wrapper', () => {
    it('safeAnalyze returns structured success payloads', () => {
        const analyzer = new ReviewAnalyzer();
        const result = analyzer.safeAnalyze({ text: 'I expected more from the camera.' });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_text).toBe('I expected more from the camera');
        expect(result.condensed_complaint).toBe('camera underperforms');
        expect(result.category).toBe('Camera');
        expect(result.complaint_type).toBe('EXPECTATION_FAILURE');
        expect(typeof result.model_features.numeric.candidate_length_tokens).toBe('number');
        expect(typeof result.model_features.numeric.ml_probability).toBe('number');
        expect(result.confidence_score).toBe(result.confidence);
        expect(result.complaint_level).toBe('Flagged');
    });

    it('safeAnalyze returns a predictable object on failure', () => {
        const analyzer = new ReviewAnalyzer();
        analyzer.analyze = vi.fn(() => {
            throw new Error('forced failure');
        });

        const result = analyzer.safeAnalyze({ id: 'r1', text: 'Battery life could be better.' });

        expect(result.id).toBe('r1');
        expect(result.has_hidden_complaint).toBe(false);
        expect(result.complaint_text).toBe('');
        expect(result.condensed_complaint).toBe('');
        expect(result.category).toBe('Other');
        expect(result.complaint_type).toBe(null);
        expect(result.confidence).toBe(0);
        expect(result.evidence_signals).toEqual([]);
        expect(result.model_features).toEqual({});
        expect(result.error).toBe('forced failure');
        expect(result.complaint_level).toBe('Error');
    });
});
