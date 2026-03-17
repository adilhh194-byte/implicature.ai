import { createPatternObject } from './patternUtils.js';

// Praise cues suppress false positives when a clause is positive and lacks complaint evidence.
export const PRAISE_CUE_PATTERN_OBJECTS = [
    createPatternObject({ pattern: 'great', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Generic praise cue.' }),
    createPatternObject({ pattern: 'good', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Generic praise cue.' }),
    createPatternObject({ pattern: 'nice', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Generic praise cue.' }),
    createPatternObject({ pattern: 'love', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Strong positive cue.' }),
    createPatternObject({ pattern: 'works fine', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Review says the product is functioning acceptably.' }),
    createPatternObject({ pattern: 'overall good', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Broad positive framing.' }),
    createPatternObject({ pattern: 'works well', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Broad positive functioning cue.' }),
    createPatternObject({ pattern: 'works perfectly', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Strong positive functioning cue.' }),
    createPatternObject({ pattern: 'easy to use', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Positive usability cue.' }),
    createPatternObject({ pattern: 'love the design', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Positive UI/design cue.' }),
    createPatternObject({ pattern: 'smooth', family: 'PRAISE_CUE', weight: -1.8, directionHint: 'positive', notes: 'Positive friction-free cue.' }),
    createPatternObject({ pattern: 'excellent', family: 'PRAISE_CUE', weight: -2, directionHint: 'positive', notes: 'Strong praise cue.' }),
    createPatternObject({ pattern: 'logical', family: 'PRAISE_CUE', weight: -1.6, directionHint: 'positive', notes: 'Positive usability cue.' }),
    createPatternObject({ pattern: 'lightweight', family: 'PRAISE_CUE', weight: -1.4, directionHint: 'positive', notes: 'Positive portability cue.' }),
    createPatternObject({ pattern: 'organic', family: 'PRAISE_CUE', weight: -1.2, directionHint: 'positive', notes: 'Positive attribute framing cue.' }),
    createPatternObject({ pattern: 'sturdy', family: 'PRAISE_CUE', weight: -1.5, directionHint: 'positive', notes: 'Positive durability cue.' }),
    createPatternObject({ pattern: 'trusted', family: 'PRAISE_CUE', weight: -1.4, directionHint: 'positive', notes: 'Positive reputation cue.' }),
    createPatternObject({ pattern: 'clear', family: 'PRAISE_CUE', weight: -1.3, directionHint: 'positive', notes: 'Positive clarity cue.' })
];

export const PRAISE_CUES = PRAISE_CUE_PATTERN_OBJECTS.map(entry => entry.pattern).filter(pattern => typeof pattern === 'string');
