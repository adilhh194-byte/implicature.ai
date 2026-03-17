import { LengthAwareReviewAnalyzer } from './lengthAwareReviewAnalyzer.js';

const LONG_ANALYZER_KEY = 'long';

// Long reviews use the same core pipeline, but allow sentence-level backup candidates.
export class LongReviewAnalyzer extends LengthAwareReviewAnalyzer {
    constructor() {
        super(LONG_ANALYZER_KEY);
    }
}
