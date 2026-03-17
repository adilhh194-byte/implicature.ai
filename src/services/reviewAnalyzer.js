import { extractComplaint } from '../pipeline/contrastExtractor.js';

function normalizeReviewInput(reviewObj) {
    const source = typeof reviewObj === 'string' ? { review: reviewObj } : (reviewObj || {});
    return {
        id: source.id || crypto.randomUUID(),
        review: typeof source.review === 'string'
            ? source.review
            : typeof source.text === 'string'
                ? source.text
                : ''
    };
}

function buildFailureResult(id, reviewText, errorMessage) {
    return {
        id,
        original_review: reviewText,
        review: reviewText,
        original_text: reviewText,
        has_hidden_complaint: false,
        complaint_text: '',
        condensed_complaint: '',
        category: 'Other',
        marker_found: null,
        complaint_type: null,
        confidence: 0,
        evidence_signals: [],
        model_features: {},
        word_count: typeof reviewText === 'string' && reviewText.trim()
            ? reviewText.trim().split(/\s+/).filter(Boolean).length
            : 0,
        complaint: '',
        marker: null,
        confidence_score: 0,
        complaint_level: 'Error',
        error: errorMessage,
        analysis_error: errorMessage
    };
}

/**
 * ReviewAnalyzer wraps single-review extraction and exposes a stable safeAnalyze API.
 */
export class ReviewAnalyzer {
    /**
     * Analyze a single review using the complaint extraction orchestrator.
     * @param {{ id?: string, review?: string, text?: string } | string} reviewObj
     * @returns {object}
     */
    analyze(reviewObj) {
        const normalized = normalizeReviewInput(reviewObj);
        const result = extractComplaint(normalized.review);

        return {
            id: normalized.id,
            ...result,
            review: result.review ?? normalized.review,
            original_text: result.original_text ?? normalized.review,
            model_features: result.model_features || {}
        };
    }

    /**
     * Safely analyze a review and always return a predictable payload.
     * @param {{ id?: string, review?: string, text?: string } | string} reviewObj
     * @returns {object}
     */
    safeAnalyze(reviewObj) {
        const normalized = normalizeReviewInput(reviewObj);

        try {
            const result = this.analyze(normalized);
            return {
                ...result,
                confidence_score: typeof result.confidence === 'number' ? result.confidence : 0,
                complaint_level: result.has_hidden_complaint ? 'Flagged' : 'Clean'
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown analysis error';
            console.error('SafeAnalyze error:', error);
            return buildFailureResult(normalized.id, normalized.review, errorMessage);
        }
    }
}
