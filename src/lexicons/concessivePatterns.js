import { createPatternObject } from './patternUtils.js';

// Concessive patterns capture praise-before-complaint framing without relying on a simple "but" marker.
export const CONCESSIVE_PATTERN_OBJECTS = [
    createPatternObject({ pattern: 'even though', family: 'CONCESSIVE_PATTERN', weight: 3, directionHint: 'concession', notes: 'Signals a concession that often contrasts with a negative span.' }),
    createPatternObject({ pattern: 'despite', family: 'CONCESSIVE_PATTERN', weight: 3, directionHint: 'concession', notes: 'Allows praise or usage context before a complaint.' }),
    createPatternObject({ pattern: 'despite the fact that', family: 'CONCESSIVE_PATTERN', weight: 3, directionHint: 'concession', notes: 'Long-form concessive frame.' }),
    createPatternObject({ pattern: 'in spite of', family: 'CONCESSIVE_PATTERN', weight: 3, directionHint: 'concession', notes: 'Concessive marker for mixed reviews.' }),
    createPatternObject({ pattern: 'regardless of', family: 'CONCESSIVE_PATTERN', weight: 2.5, directionHint: 'concession', notes: 'Indicates the complaint persists despite context.' })
];
