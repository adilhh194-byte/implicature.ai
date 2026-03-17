import { describe, expect, it } from 'vitest';
import { scoreCandidateRuleBased, scoreCandidateHybrid } from './hybridComplaintScorer.js';

describe('hybridComplaintScorer', () => {
    it('gives strong rule scores to expectation and exception candidates', () => {
        const result = scoreCandidateRuleBased({
            numeric: {
                candidate_length_tokens: 5,
                review_length_tokens: 8,
                negative_cue_count: 0,
                praise_cue_count: 0,
                aspect_count: 1,
                complaint_signal_count: 2,
                total_signal_count: 2
            },
            boolean: {
                contains_exception_marker: true,
                contains_expectation_pattern: true,
                contains_aspect_keyword: true,
                contains_praise_cue: false,
                appears_in_right_clause: true,
                starts_after_marker: true,
                quote_artifact_present: false,
                csv_id_artifact_present: false
            },
            categorical: {
                likely_complaint_type: 'EXPECTATION_FAILURE'
            },
            evidenceSignals: []
        });

        expect(result.ruleScore).toBeGreaterThan(7);
        expect(result.complaintType).toBe('EXPECTATION_FAILURE');
        expect(result.reasons.length).toBeGreaterThan(1);
    });

    it('penalizes praise-only malformed spans', () => {
        const result = scoreCandidateRuleBased({
            numeric: {
                candidate_length_tokens: 1,
                review_length_tokens: 3,
                negative_cue_count: 0,
                praise_cue_count: 1,
                aspect_count: 0,
                complaint_signal_count: 0,
                total_signal_count: 1
            },
            boolean: {
                contains_praise_cue: true,
                quote_artifact_present: true,
                csv_id_artifact_present: true
            },
            categorical: {},
            evidenceSignals: []
        });

        expect(result.ruleScore).toBeLessThan(0);
    });

    it('combines rule and ML scores transparently', () => {
        const result = scoreCandidateHybrid({
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
                contains_aspect_keyword: true,
                contains_direct_negative_cue: true,
                appears_in_right_clause: true,
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

        expect(typeof result.ruleScore).toBe('number');
        expect(typeof result.finalScore).toBe('number');
        expect(typeof result.confidence).toBe('number');
        expect(result.mlScore).not.toBe(null);
        expect(result.reasons.some(reason => reason.includes('bounded ML rerank nudge'))).toBe(true);
    });
});
