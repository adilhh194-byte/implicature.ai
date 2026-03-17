import { createPatternObject } from './patternUtils.js';

// Direct negative cues capture explicit problem words and short high-signal complaint phrases.
export const DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS = [
    createPatternObject({ pattern: 'slow', family: 'DIRECT_NEGATIVE_CUE', weight: 2, directionHint: 'problem', notes: 'General performance or service complaint.' }),
    createPatternObject({ pattern: 'broken', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Hard failure cue.' }),
    createPatternObject({ pattern: 'buggy', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Software reliability complaint.' }),
    createPatternObject({ pattern: 'overpriced', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Direct value complaint.' }),
    createPatternObject({ pattern: 'delayed', family: 'DIRECT_NEGATIVE_CUE', weight: 2, directionHint: 'problem', notes: 'Shipping, delivery, or support latency cue.' }),
    createPatternObject({ pattern: 'poor', family: 'DIRECT_NEGATIVE_CUE', weight: 2, directionHint: 'problem', notes: 'Generic negative quality cue.' }),
    createPatternObject({ pattern: 'weak', family: 'DIRECT_NEGATIVE_CUE', weight: 2, directionHint: 'problem', notes: 'Direct underperformance cue.' }),
    createPatternObject({ pattern: 'unreliable', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Reliability complaint cue.' }),
    createPatternObject({ pattern: 'laggy', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Performance complaint cue.' }),
    createPatternObject({ pattern: 'bland', family: 'DIRECT_NEGATIVE_CUE', weight: 2.2, directionHint: 'problem', notes: 'Taste or quality shortfall cue.' }),
    createPatternObject({ pattern: 'artificial', family: 'DIRECT_NEGATIVE_CUE', weight: 2.1, directionHint: 'problem', notes: 'Artificial quality or taste cue.' }),
    createPatternObject({ pattern: 'counterfeit', family: 'DIRECT_NEGATIVE_CUE', weight: 2.8, directionHint: 'problem', notes: 'Counterfeit product cue.' }),
    createPatternObject({ pattern: 'defect', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Explicit defect cue.' }),
    createPatternObject({ pattern: 'defective', family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Explicit defective-item cue.' }),
    createPatternObject({ pattern: 'scratched', family: 'DIRECT_NEGATIVE_CUE', weight: 2.2, directionHint: 'problem', notes: 'Damaged-surface cue.' }),
    createPatternObject({ pattern: 'repetitive', family: 'DIRECT_NEGATIVE_CUE', weight: 2.2, directionHint: 'problem', notes: 'Repetition complaint cue.' }),
    createPatternObject({ pattern: 'bad', family: 'DIRECT_NEGATIVE_CUE', weight: 1.9, directionHint: 'problem', notes: 'Generic negative experience cue.' }),
    createPatternObject({ pattern: /\bcrash(?:es|ing)?\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Stability failure cue.', label: 'crashes' }),
    createPatternObject({ pattern: /\bfail(?:s|ed|ing)?\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.4, directionHint: 'problem', notes: 'Explicit failure cue.', label: 'fails' }),
    createPatternObject({ pattern: /\bstruggl(?:e|es|ed|ing)\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.3, directionHint: 'problem', notes: 'Performance or capability shortfall cue.', label: 'struggles' }),
    createPatternObject({ pattern: /\black(?:s|ing)\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.3, directionHint: 'problem', notes: 'Missing capability cue.', label: 'lacks' }),
    createPatternObject({ pattern: /\bworse\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.4, directionHint: 'problem', notes: 'Regression cue when the product got worse.', label: 'worse' }),
    createPatternObject({ pattern: 'unresponsive', family: 'DIRECT_NEGATIVE_CUE', weight: 2.4, directionHint: 'problem', notes: 'Responsiveness failure cue.' }),
    createPatternObject({ pattern: /\brefus(?:e|ed|es|ing)\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.4, directionHint: 'problem', notes: 'Refusal cue for support or service failures.', label: 'refused' }),
    createPatternObject({ pattern: /\black(?:s)?\s+(?:essential\s+)?features\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.6, directionHint: 'problem', notes: 'Explicit missing features cue.', label: 'lacks essential features' }),
    createPatternObject({ pattern: /\bcrashes?\s+frequently\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.8, directionHint: 'problem', notes: 'Frequent crashes are a strong complaint cue.', label: 'crashes frequently' }),
    createPatternObject({ pattern: /\bdoes\s+not\s+work\s+as\s+advertised\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 3, directionHint: 'problem', notes: 'Explicit product-performance mismatch cue.', label: 'does not work as advertised' }),
    createPatternObject({ pattern: /\bbroke\s+after\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.8, directionHint: 'problem', notes: 'Early breakage cue.', label: 'broke after' }),
    createPatternObject({ pattern: /\btook\s+hours\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.2, directionHint: 'problem', notes: 'Time-cost complaint cue.', label: 'took hours' }),
    createPatternObject({ pattern: /\bmoisture\s+inside\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.6, directionHint: 'problem', notes: 'Water ingress cue.', label: 'moisture inside' }),
    createPatternObject({ pattern: /\btook\s+forever\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Direct latency complaint cue.', label: 'took forever' }),
    createPatternObject({ pattern: /\bdrains\s+fast\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Battery complaint cue.', label: 'drains fast' }),
    createPatternObject({ pattern: /\bnot\s+working\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2.5, directionHint: 'problem', notes: 'Direct malfunction cue.', label: 'not working' }),
    createPatternObject({ pattern: /\bonly\s+issue\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 2, directionHint: 'problem', notes: 'Explicitly names a singular issue.', label: 'only issue' }),
    createPatternObject({ pattern: /\bissue\b/i, family: 'DIRECT_NEGATIVE_CUE', weight: 1.5, directionHint: 'problem', notes: 'Generic issue cue when anchored to an aspect.', label: 'issue' })
];

export const DIRECT_NEGATIVE_CUE_WORDS = DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS
    .filter(entry => typeof entry.pattern === 'string')
    .map(entry => entry.pattern);
export const DIRECT_NEGATIVE_CUE_REGEX_PATTERNS = DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS
    .filter(entry => entry.pattern instanceof RegExp)
    .map(entry => ({ label: entry.label, regex: entry.pattern }));
