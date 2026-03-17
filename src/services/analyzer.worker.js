import { DatasetProcessor, calculateDatasetAggregates } from '../pipeline/datasetProcessor.js';

/**
 * @typedef {{ reviews?: Array<any>, options?: { chunkSize?: number } }} AnalyzerWorkerRequest
 * @typedef {{ type: 'progress', progress: number }} AnalyzerWorkerProgressMessage
 * @typedef {{ type: 'complete', results: Array<object>, summary: ReturnType<typeof calculateDatasetAggregates> }} AnalyzerWorkerCompleteMessage
 * @typedef {{ type: 'error', error: string, results: Array<object>, summary: ReturnType<typeof calculateDatasetAggregates> }} AnalyzerWorkerErrorMessage
 */

const DEFAULT_CHUNK_SIZE = 100;
const MIN_CHUNK_SIZE = 25;
const MAX_CHUNK_SIZE = 500;

function clampChunkSize(chunkSize) {
    if (typeof chunkSize !== 'number' || Number.isNaN(chunkSize)) {
        return DEFAULT_CHUNK_SIZE;
    }

    return Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, Math.floor(chunkSize)));
}

/**
 * Runs dataset analysis in worker-friendly chunks.
 * Returns the same result rows the UI already expects, plus a lightweight summary.
 *
 * @param {Array<any>} reviews
 * @param {{ chunkSize?: number }} options
 * @param {(message: AnalyzerWorkerProgressMessage | AnalyzerWorkerCompleteMessage | AnalyzerWorkerErrorMessage) => void} postMessageFn
 */
export async function runWorkerAnalysis(reviews, options = {}, postMessageFn = () => {}) {
    const processor = new DatasetProcessor();
    const safeReviews = Array.isArray(reviews) ? reviews : [];
    const chunkSize = clampChunkSize(options.chunkSize);

    if (safeReviews.length === 0) {
        const summary = calculateDatasetAggregates([]);
        postMessageFn({ type: 'progress', progress: 100 });
        postMessageFn({ type: 'complete', results: [], summary });
        return { results: [], summary };
    }

    const total = safeReviews.length;
    let processed = 0;
    let allResults = [];

    for (let i = 0; i < total; i += chunkSize) {
        const chunk = safeReviews.slice(i, i + chunkSize);
        const chunkResults = processor.processDataset(chunk);
        allResults = allResults.concat(chunkResults);
        processed += chunk.length;

        postMessageFn({
            type: 'progress',
            progress: Math.round((processed / total) * 100)
        });

        // Yield between chunks so large datasets stay responsive off the main thread.
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    const summary = calculateDatasetAggregates(allResults);
    postMessageFn({ type: 'complete', results: allResults, summary });
    return { results: allResults, summary };
}

if (typeof self !== 'undefined') {
    self.onmessage = async function onWorkerMessage(event) {
        const payload = event.data || {};

        try {
            await runWorkerAnalysis(payload.reviews, payload.options, message => self.postMessage(message));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Worker analysis failed';
            self.postMessage({
                type: 'error',
                error: errorMessage,
                results: [],
                summary: calculateDatasetAggregates([])
            });
        }
    };
}
