import { describe, expect, it } from 'vitest';
import { predictCandidateScore } from './candidateReranker.js';

describe('candidateReranker', () => {
    it('predicts a transparent score with top contributors', () => {
        const result = predictCandidateScore({
            numeric: {
                candidate_length_tokens: 4,
                review_length_tokens: 6,
                negative_cue_count: 1,
                praise_cue_count: 0,
                aspect_count: 1,
                complaint_signal_count: 2,
                total_signal_count: 2
            },
            boolean: {
                contains_expectation_pattern: true,
                contains_direct_negative_cue: true,
                contains_aspect_keyword: true,
                contains_praise_cue: false,
                starts_after_marker: false,
                appears_in_right_clause: true,
                appears_in_left_clause: false,
                quote_artifact_present: false,
                csv_id_artifact_present: false
            },
            categorical: {
                likely_complaint_type: 'EXPECTATION_FAILURE',
                likely_category_hint: 'Camera',
                source: 'clause',
                candidate_text: 'expected more from the camera'
            },
            evidenceSignals: []
        });

        expect(result.probability).toBeGreaterThan(0);
        expect(result.probability).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.topContributors)).toBe(true);
        expect(result.topContributors.length).toBeGreaterThan(0);
        expect(typeof result.modelVersion).toBe('string');
    });
});
