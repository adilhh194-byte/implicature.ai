import { analyzeComplaintReviewObject } from './complaintSignalPipeline.js';
import { getProfileForAnalyzerKey } from './reviewLengthRouter.js';

export class LengthAwareReviewAnalyzer {
    constructor(analyzerKey) {
        this.profile = getProfileForAnalyzerKey(analyzerKey);
    }

    analyze(reviewObj) {
        return analyzeComplaintReviewObject(reviewObj, { profile: this.profile });
    }
}
