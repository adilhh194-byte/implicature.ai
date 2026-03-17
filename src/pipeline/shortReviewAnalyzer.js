import { LengthAwareReviewAnalyzer } from './lengthAwareReviewAnalyzer.js';

const SHORT_ANALYZER_KEY = 'short';

// Short reviews use the shared complaint pipeline with a tight pruning budget.
export class ShortReviewAnalyzer extends LengthAwareReviewAnalyzer {
    constructor() {
        super(SHORT_ANALYZER_KEY);
    }
}
