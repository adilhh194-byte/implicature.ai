import { describe, expect, it } from 'vitest';
import { runWorkerAnalysis } from './analyzer.worker.js';

describe('analyzer.worker helpers', () => {
    it('returns structured rows with upgraded complaint fields', async () => {
        const messages = [];
        const { results, summary } = await runWorkerAnalysis(
            [
                { review: 'Battery life could be better.' },
                { review: 'Works perfectly and I love it.' }
            ],
            { chunkSize: 1 },
            message => messages.push(message)
        );

        expect(results).toHaveLength(2);
        expect(results[0].condensed_complaint).toBe('weak battery life');
        expect(results[0].complaint_type).toBe('SOFT_DISSATISFACTION');
        expect(Array.isArray(results[0].evidence_signals)).toBe(true);
        expect(typeof results[0].confidence).toBe('number');
        expect(typeof results[0].model_features.numeric.candidate_length_tokens).toBe('number');
        expect(summary.totalReviews).toBe(2);
        expect(messages.some(message => message.type === 'progress')).toBe(true);
        expect(messages.at(-1)?.type).toBe('complete');
    });

    it('handles empty worker datasets safely', async () => {
        const messages = [];
        const { results, summary } = await runWorkerAnalysis([], {}, message => messages.push(message));

        expect(results).toEqual([]);
        expect(summary.pivotRatio).toBe(0);
        expect(messages.at(-1)).toEqual({
            type: 'complete',
            results: [],
            summary
        });
    });
});
