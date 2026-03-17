export class PolarityChecker {
    constructor() {
        this.negativeWords = [
            'bad', 'poor', 'weak', 'cheap', 'expensive', 'overpriced', 'slow', 'lag', 'broken',
            'defective', 'flimsy', 'terrible', 'awful', 'horrible', 'worse', 'worst', 'failed',
            'fails', 'failing', 'crash', 'crashes', 'crashing', 'error', 'glitch', 'malfunction',
            'drain', 'drains', 'overheat', 'dies', 'pain', 'uncomfortable', 'heavy', 'noisy',
            'ugly', 'bulky', 'confusing', 'complicated', 'difficult', 'bland', 'stale', 'tight',
            'missing', 'damaged', 'late', 'delayed', 'never', 'nothing', 'issue', 'problem',
            'sadly', 'unfortunately', 'regrettably', 'disappointed', 'disappointing', 'defect',
            'useless', 'garbage', 'trash', 'ridiculous', 'joke', 'waste', 'hate',
            'last minute', 'waited'
        ];

        // Use word boundaries for exact matches
        const escapedWords = this.negativeWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        this.negativeRegex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'i');
    }

    isNegative(text) {
        if (!text || typeof text !== 'string') return false;

        // Simple heuristic: if it contains a known negative word, we consider the clause negative
        // This is not full sentiment analysis, just a tie-breaker for contrastive clauses
        return this.negativeRegex.test(text.toLowerCase());
    }
}
