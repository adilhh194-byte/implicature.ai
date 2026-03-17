import { describe, expect, it } from 'vitest';
import { normalizeReview } from './reviewNormalizer.js';
import { extractCandidateFeatures } from './candidateFeatureExtractor.js';

describe('candidateFeatureExtractor', () => {
    it('derives expectation, aspect, and category features deterministically', () => {
        const normalized = normalizeReview('I expected better quality from this camera.');
        const features = extractCandidateFeatures({
            text: 'I expected better quality from this camera',
            source: 'clause',
            boundaryReason: 'family_start:expected better',
            relativeClauseSide: 'right'
        }, normalized);

        expect(features.boolean.contains_expectation_pattern).toBe(true);
        expect(features.boolean.contains_aspect_keyword).toBe(true);
        expect(features.numeric.candidate_length_tokens).toBeGreaterThan(4);
        expect(features.categorical.likely_category_hint).toBe('Camera');
        expect(features.categorical.likely_complaint_type).toBe('EXPECTATION_FAILURE');
    });

    it('captures marker-side and negative cue features', () => {
        const normalized = normalizeReview('Great app, but shipping was slow.');
        const features = extractCandidateFeatures({
            text: 'but shipping was slow',
            source: 'clause',
            boundaryReason: 'after:but',
            relativeClauseSide: 'right'
        }, normalized);

        expect(features.boolean.contains_contrast_marker).toBe(true);
        expect(features.boolean.contains_direct_negative_cue).toBe(true);
        expect(features.boolean.starts_after_marker).toBe(true);
        expect(features.boolean.appears_in_right_clause).toBe(true);
        expect(features.numeric.negative_cue_count).toBeGreaterThanOrEqual(1);
    });

    it('flags quote and csv-like artifacts', () => {
        const normalized = normalizeReview('review_12, "Not ideal for me"');
        const features = extractCandidateFeatures({
            text: 'review_12, "Not ideal for me"',
            source: 'sentence',
            boundaryReason: 'sentence_context',
            relativeClauseSide: null
        }, normalized);

        expect(features.boolean.quote_artifact_present).toBe(true);
        expect(features.boolean.csv_id_artifact_present).toBe(true);
    });
});
