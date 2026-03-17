import { analyzeComplaintReview } from './complaintSignalPipeline.js';

function buildCompatibilityResult(result) {
    return {
        ...result,
        originalReview: result.original_review,
        complaint: result.condensed_complaint,
        marker: result.marker_found,
        markerType: result.complaint_type
    };
}

export function extractComplaint(reviewText) {
    const result = analyzeComplaintReview(typeof reviewText === 'string' ? reviewText : '');
    return buildCompatibilityResult(result);
}

export class ContrastExtractor {
    extract(reviewText) {
        return extractComplaint(reviewText);
    }
}
