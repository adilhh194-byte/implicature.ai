import { describe, expect, it } from 'vitest';
import { DatasetProcessor, calculateDatasetAggregates } from './datasetProcessor.js';

describe('datasetProcessor', () => {
    it('returns an empty result for an empty dataset', () => {
        const processor = new DatasetProcessor();
        const results = processor.processDataset([]);
        const summary = processor.summarize(results);

        expect(results).toEqual([]);
        expect(summary.totalReviews).toBe(0);
        expect(summary.hiddenComplaintCount).toBe(0);
        expect(summary.pivotRatio).toBe(0);
    });

    it('handles mixed valid and invalid rows safely', () => {
        const processor = new DatasetProcessor();
        const results = processor.processDataset([
            { review: 'Battery life could be better.' },
            null,
            { text: 'I expected more from the camera.' },
            { review: 42 },
            'I wish support replied faster.'
        ]);

        expect(results).toHaveLength(5);
        expect(results[0].has_hidden_complaint).toBe(true);
        expect(results[1].has_hidden_complaint).toBe(false);
        expect(results[1].original_review).toBe('');
        expect(results[2].category).toBe('Camera');
        expect(results[3].has_hidden_complaint).toBe(false);
        expect(results[4].category).toBe('Support');
        expect(results.every(result => typeof result.word_count === 'number')).toBe(true);
    });

    it('sanitizes imported row artifacts before analysis', () => {
        const processor = new DatasetProcessor();
        const results = processor.processDataset([
            { review: '84,"The packaging is beautiful; however, the product inside is damaged."' },
            { review: '2,"I loved the design of this phone; however, the battery life is disappointingly short."' },
            { review: '56,"While the battery lasts long, charging is slow."' }
        ]);

        expect(results[0].original_review).toBe('The packaging is beautiful; however, the product inside is damaged.');
        expect(results[0].original_review.startsWith('84,')).toBe(false);
        expect(results[0].original_review.endsWith('"')).toBe(false);
        expect(results[1].original_review).toBe('I loved the design of this phone; however, the battery life is disappointingly short.');
        expect(results[1].complaint_text.startsWith('2,')).toBe(false);
        expect(results[1].complaint_text.endsWith('"')).toBe(false);
        expect(results[2].original_review).toBe('While the battery lasts long, charging is slow.');
        expect(results[2].complaint_text.startsWith('56,')).toBe(false);
        expect(results[2].complaint_text.endsWith('"')).toBe(false);
    });

    it('calculates pivot ratio and category distribution correctly', () => {
        const summary = calculateDatasetAggregates([
            { has_hidden_complaint: true, category: 'Battery' },
            { has_hidden_complaint: false, category: 'No Complaint' },
            { has_hidden_complaint: true, category: 'Support' },
            { has_hidden_complaint: true, category: 'Battery' }
        ]);

        expect(summary.totalReviews).toBe(4);
        expect(summary.hiddenComplaintCount).toBe(3);
        expect(summary.pivotRatio).toBe(75);
        expect(summary.categoryDistribution).toEqual({
            Battery: 2,
            Support: 1
        });
    });
});

