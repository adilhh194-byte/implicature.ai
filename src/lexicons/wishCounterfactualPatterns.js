import { createPatternObject } from './patternUtils.js';

// Wish and counterfactual patterns encode a complaint as a desired alternate reality or fix.
export const WISH_COUNTERFACTUAL_PATTERN_OBJECTS = [
    createPatternObject({ pattern: /\bwish\s+it\s+had\b/i, family: 'WISH_COUNTERFACTUAL', weight: 3.5, directionHint: 'desired-fix', notes: 'Missing capability phrased as a wish.', label: 'wish it had' }),
    createPatternObject({ pattern: /\bwish\s+it\s+was\b/i, family: 'WISH_COUNTERFACTUAL', weight: 3.5, directionHint: 'desired-fix', notes: 'Desired better state phrased as a wish.', label: 'wish it was' }),
    createPatternObject({ pattern: /\bwould\s+be\s+better\s+if\b/i, family: 'WISH_COUNTERFACTUAL', weight: 3.5, directionHint: 'desired-fix', notes: 'Counterfactual improvement request.', label: 'would be better if' }),
    createPatternObject({ pattern: /\bi(?:\s+would|'d)\s+give\s+it\s+five\s+stars\s+only\s+if\b/i, family: 'WISH_COUNTERFACTUAL', weight: 3.5, directionHint: 'conditional-praise', notes: 'Praise is withheld unless a complaint is fixed.', label: "I'd give it five stars only if" }),
    createPatternObject({ pattern: /\bi\s+wish\b/i, family: 'WISH_COUNTERFACTUAL', weight: 3, directionHint: 'desired-fix', notes: 'General wish-based complaint cue.', label: 'i wish' })
];

export const WISH_REQUEST_PHRASES = ['wish it had', 'wish it was', 'would be better if'];
export const WISH_REQUEST_REGEX_PATTERNS = WISH_COUNTERFACTUAL_PATTERN_OBJECTS
    .filter(entry => entry.pattern instanceof RegExp)
    .map(entry => ({ label: entry.label, regex: entry.pattern }));
