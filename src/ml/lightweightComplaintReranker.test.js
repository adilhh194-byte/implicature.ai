import { describe, expect, it } from 'vitest';
import { rerankComplaintCandidates, scoreFeaturesWithLinearModel } from './lightweightComplaintReranker.js';

describe('lightweightComplaintReranker', () => {
    it('assigns higher model probability to feature-rich complaint candidates', () => {
        const positive = scoreFeaturesWithLinearModel({
            numeric: {
                candidate_length_tokens: 5,
                review_length_tokens: 10,
                negative_cue_count: 1,
                praise_cue_count: 0,
                aspect_count: 1,
                complaint_signal_count: 2,
                total_signal_count: 2
            },
            boolean: {
                contains_expectation_pattern: true,
                contains_praise_cue: false,
                contains_aspect_keyword: true,
                appears_in_right_clause: true,
                appears_in_left_clause: false,
                quote_artifact_present: false,
                csv_id_artifact_present: false
            },
            categorical: {},
            evidenceSignals: []
        });
        const negative = scoreFeaturesWithLinearModel({
            numeric: {
                candidate_length_tokens: 3,
                review_length_tokens: 3,
                negative_cue_count: 0,
                praise_cue_count: 1,
                aspect_count: 0,
                complaint_signal_count: 0,
                total_signal_count: 1
            },
            boolean: {
                contains_expectation_pattern: false,
                contains_praise_cue: true,
                contains_aspect_keyword: false,
                appears_in_right_clause: false,
                appears_in_left_clause: false,
                quote_artifact_present: false,
                csv_id_artifact_present: false
            },
            categorical: {},
            evidenceSignals: []
        });

        expect(positive.probability).toBeGreaterThan(negative.probability);
    });

    it('nudges hybrid scores without replacing rule scores', () => {
        const [candidate] = rerankComplaintCandidates([
            {
                text: 'battery life could be better',
                score: 4,
                confidence: 0.63,
                modelFeatures: {
                    numeric: {
                        candidate_length_tokens: 4,
                        review_length_tokens: 4,
                        negative_cue_count: 0,
                        praise_cue_count: 0,
                        aspect_count: 1,
                        complaint_signal_count: 1,
                        total_signal_count: 1
                    },
                    boolean: {
                        contains_soft_dissatisfaction: true,
                        contains_aspect_keyword: true,
                        appears_in_right_clause: true,
                        appears_in_left_clause: false,
                        quote_artifact_present: false,
                        csv_id_artifact_present: false
                    },
                    categorical: {},
                    evidenceSignals: []
                }
            }
        ]);

        expect(candidate.hybridScore).toBeGreaterThan(3);
        expect(candidate.hybridScore).toBeLessThan(6.5);
        expect(typeof candidate.modelFeatures.numeric.ml_probability).toBe('number');
    });
});
