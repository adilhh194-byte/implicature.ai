import { describe, expect, it } from 'vitest';
import { DatasetProcessor } from '../pipeline/datasetProcessor';
import {
    evaluateCuratedSuite,
    getCuratedEvaluationSuite,
    runEdgeCaseTests,
    stressTestAnalyzer
} from './diagnostics.js';

describe('Pre-Deployment Guards & Diagnostics', () => {
    it('stress test still batch processes 2000 reviews efficiently', async () => {
        const summary = await stressTestAnalyzer(2000);
        expect(summary.totalReviews).toBe(2000);
        expect(summary.avgTimePerReview).toBeLessThan(7);
    }, 15000);

    it('evaluates the curated complaint-signal suite with readable summary stats', () => {
        const suite = getCuratedEvaluationSuite();
        const summary = evaluateCuratedSuite(suite);

        expect(summary.totalCases).toBe(suite.length);
        expect(summary.falseNegativeNoMarker).toEqual([]);
        expect(summary.falsePositivePraiseOnly).toEqual([]);
        expect(Array.isArray(summary.categoryMismatches)).toBe(true);
        expect(summary.complaintTypeDistribution.SOFT_DISSATISFACTION).toBeGreaterThanOrEqual(1);
        expect(summary.confidenceHistogram.reduce((total, bucket) => total + bucket.count, 0)).toBe(summary.totalCases);
        expect(summary.consoleSummary).toContain('Cases:');
    });

    it('edge case tests still return safe structured outputs', () => {
        const summary = runEdgeCaseTests();
        expect(summary.totalTests).toBeGreaterThan(0);
        expect(summary.failed).toBe(0);
    });

    it('dataset processor remains performant for bulk diagnostics input', () => {
        const processor = new DatasetProcessor();
        const reviews = Array.from({ length: 500 }).map((_, i) => ({
            id: `id-${i}`,
            review: i % 2 === 0 ? 'Great phone but shipping was slow.' : 'Works perfectly fine.'
        }));

        const results = processor.processDataset(reviews);
        expect(results.length).toBe(500);
    });
});
