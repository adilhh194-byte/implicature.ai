import { createPatternObject } from './patternUtils.js';

// Preference and avoidance patterns flag weakly stated rejection without overt negative wording.
export const PREFERENCE_AVOIDANCE_PATTERN_OBJECTS = [
    createPatternObject({ pattern: /\bi(?:\s+would|'d)\s+rather\s+not\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 3, directionHint: 'avoidance', notes: 'Reviewer avoids future use.' , label: "I'd rather not"}),
    createPatternObject({ pattern: /\bi(?:\s+would|'d)\s+rather\s+use\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 3, directionHint: 'preference-shift', notes: 'Reviewer would choose an alternative instead.', label: "I'd rather use" }),
    createPatternObject({ pattern: /\bi(?:\s+would|'d)\s+rather\s+buy\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 3, directionHint: 'preference-shift', notes: 'Reviewer would buy something else instead.', label: "I'd rather buy" }),
    createPatternObject({ pattern: /\bonly\s+if\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 2.5, directionHint: 'conditional-use', notes: 'Acceptable only under narrow conditions.', label: 'only if' }),
    createPatternObject({ pattern: /\bnot\s+for\s+me\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 3, directionHint: 'avoidance', notes: 'Directly rejects fit or usefulness.', label: 'not for me' }),
    createPatternObject({ pattern: /\bonly\s+at\s+home\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 2.5, directionHint: 'limited-use', notes: 'Suggests limited suitability across contexts.', label: 'only at home' }),
    createPatternObject({ pattern: /\bonly\s+if\s+absolutely\s+necessary\b/i, family: 'PREFERENCE_AVOIDANCE', weight: 3, directionHint: 'avoidance', notes: 'Strong reluctance to use the product.', label: 'only if absolutely necessary' })
];
