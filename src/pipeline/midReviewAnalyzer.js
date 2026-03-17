import { LengthAwareReviewAnalyzer } from './lengthAwareReviewAnalyzer.js';

const MID_ANALYZER_KEY = 'mid';

// Mid-length reviews keep the same core pipeline with a balanced pruning budget.
export class MidReviewAnalyzer extends LengthAwareReviewAnalyzer {
    constructor() {
        super(MID_ANALYZER_KEY);
    }
}
