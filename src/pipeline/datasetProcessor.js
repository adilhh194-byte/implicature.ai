import { ShortReviewAnalyzer } from './shortReviewAnalyzer.js';
import { MidReviewAnalyzer } from './midReviewAnalyzer.js';
import { LongReviewAnalyzer } from './longReviewAnalyzer.js';
import { getAnalyzerForReview } from './reviewLengthRouter.js';
import { sanitizeImportedReviewRecord } from '../services/reviewTextSanitizer.js';

function normalizeReviewRow(reviewObj, fallbackIndex) {
    if (typeof reviewObj === 'string') {
        const cleanedReview = sanitizeImportedReviewRecord(reviewObj);
        return {
            id: `row-${fallbackIndex}`,
            original_review: cleanedReview,
            review: cleanedReview
        };
    }

    if (!reviewObj || typeof reviewObj !== 'object') {
        return {
            id: `row-${fallbackIndex}`,
            original_review: '',
            review: ''
        };
    }

    const cleanedReview = sanitizeImportedReviewRecord(reviewObj);

    return {
        ...reviewObj,
        id: reviewObj.id || `row-${fallbackIndex}`,
        original_review: cleanedReview,
        review: cleanedReview,
        text: cleanedReview || reviewObj.text || ''
    };
}

export function calculateDatasetAggregates(results) {
    const safeResults = Array.isArray(results) ? results : [];
    const totalReviews = safeResults.length;
    const hiddenComplaintCount = safeResults.filter(result => result.has_hidden_complaint).length;
    const pivotRatio = totalReviews === 0
        ? 0
        : Number(((hiddenComplaintCount / totalReviews) * 100).toFixed(1));

    const categoryDistribution = safeResults.reduce((distribution, result) => {
        if (!result?.has_hidden_complaint) {
            return distribution;
        }

        const category = result.category || 'Other';
        distribution[category] = (distribution[category] || 0) + 1;
        return distribution;
    }, {});

    return {
        totalReviews,
        hiddenComplaintCount,
        pivotRatio,
        categoryDistribution
    };
}

export class DatasetProcessor {
    constructor() {
        this.shortAnalyzer = new ShortReviewAnalyzer();
        this.midAnalyzer = new MidReviewAnalyzer();
        this.longAnalyzer = new LongReviewAnalyzer();
    }

    summarize(results) {
        return calculateDatasetAggregates(results);
    }

    processDataset(reviewsArray, onProgress = null) {
        if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
            if (onProgress) onProgress(100);
            return [];
        }

        const results = [];
        const total = reviewsArray.length;

        for (let i = 0; i < total; i++) {
            const normalizedRow = normalizeReviewRow(reviewsArray[i], i);
            const text = normalizedRow.review || '';
            const { analyzerKey, wordCount } = getAnalyzerForReview(text);

            try {
                const analyzer = analyzerKey === 'short'
                    ? this.shortAnalyzer
                    : analyzerKey === 'mid'
                        ? this.midAnalyzer
                        : this.longAnalyzer;

                const baseResult = analyzer.analyze(normalizedRow);
                results.push({
                    id: normalizedRow.id,
                    original_review: baseResult.original_review ?? text,
                    has_hidden_complaint: Boolean(baseResult.has_hidden_complaint),
                    complaint_text: baseResult.complaint_text ?? '',
                    condensed_complaint: baseResult.condensed_complaint ?? '',
                    category: baseResult.category ?? 'Other',
                    marker_found: baseResult.marker_found ?? null,
                    complaint_type: baseResult.complaint_type ?? null,
                    confidence: typeof baseResult.confidence === 'number' ? baseResult.confidence : 0,
                    evidence_signals: Array.isArray(baseResult.evidence_signals) ? baseResult.evidence_signals : [],
                    model_features: baseResult.model_features || {},
                    word_count: baseResult.word_count ?? wordCount,
                    review: baseResult.review ?? text,
                    original_text: baseResult.original_text ?? text,
                    complaint: baseResult.complaint ?? baseResult.condensed_complaint ?? '',
                    marker: baseResult.marker ?? baseResult.marker_found ?? null,
                    wordCount: baseResult.wordCount ?? wordCount,
                    analyzerUsed: analyzerKey,
                    ranked_candidates: baseResult.ranked_candidates ?? []
                });
            } catch (error) {
                results.push({
                    id: normalizedRow.id,
                    original_review: text,
                    has_hidden_complaint: false,
                    complaint_text: '',
                    condensed_complaint: '',
                    category: 'Error',
                    marker_found: null,
                    complaint_type: null,
                    confidence: 0,
                    evidence_signals: [],
                    model_features: {},
                    word_count: wordCount,
                    review: text,
                    original_text: text,
                    complaint: '',
                    marker: null,
                    wordCount: wordCount,
                    analyzerUsed: analyzerKey,
                    analysis_error: error?.message || 'Unknown analysis error'
                });
            }

            if (onProgress && (i % 10 === 0 || i === total - 1)) {
                onProgress(Math.round(((i + 1) / total) * 100));
            }
        }

        return results;
    }

    processDatasetWithSummary(reviewsArray, onProgress = null) {
        const results = this.processDataset(reviewsArray, onProgress);
        return {
            results,
            summary: this.summarize(results)
        };
    }
}
