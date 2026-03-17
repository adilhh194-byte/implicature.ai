import { createPatternObject, flattenPatternLabels } from './patternUtils.js';

// Discourse markers identify explicit pivots where praise or neutral framing turns toward a problem.
export const CONTRASTIVE_MARKER_PATTERNS = [
    createPatternObject({ pattern: 'but', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Classic positive-to-negative pivot marker.' }),
    createPatternObject({ pattern: 'however', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Sentence-level contrast marker.' }),
    createPatternObject({ pattern: 'though', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Light contrast marker common in reviews.' }),
    createPatternObject({ pattern: 'although', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Concessive lead-in that often carries a complaint clause nearby.' }),
    createPatternObject({ pattern: 'yet', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Contrastive follow-up cue.' }),
    createPatternObject({ pattern: 'still', family: 'CONTRASTIVE_MARKER', weight: 2.5, directionHint: 'contrast', notes: 'Can soften but still introduce dissatisfaction.' }),
    createPatternObject({ pattern: 'nevertheless', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Strong explicit contrast transition.' }),
    createPatternObject({ pattern: 'on the other hand', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'contrast', notes: 'Explicit comparison frame across clauses.' }),
    createPatternObject({ pattern: 'whereas', family: 'CONTRASTIVE_MARKER', weight: 2.5, directionHint: 'contrast', notes: 'Comparative contrast marker.' }),
    createPatternObject({ pattern: /^\s*while\b/i, family: 'CONTRASTIVE_MARKER', weight: 2, directionHint: 'contrast', notes: 'Contrastive only when it opens the clause, not when used in temporal phrases.', label: 'while' }),
    createPatternObject({ pattern: 'unfortunately', family: 'CONTRASTIVE_MARKER', weight: 3, directionHint: 'negative-turn', notes: 'Pragmatic fronting for bad news.' })
];

// Exception markers isolate the one failing part of an otherwise positive review.
export const EXCEPTION_MARKER_PATTERNS = [
    createPatternObject({ pattern: 'except', family: 'EXCEPTION_MARKER', weight: 4, directionHint: 'exception', notes: 'Isolates the complaint-bearing exception.' }),
    createPatternObject({ pattern: 'except for', family: 'EXCEPTION_MARKER', weight: 4, directionHint: 'exception', notes: 'Common review exception phrase.' }),
    createPatternObject({ pattern: 'apart from', family: 'EXCEPTION_MARKER', weight: 4, directionHint: 'exception', notes: 'Positive framing followed by a negative exception.' }),
    createPatternObject({ pattern: 'other than', family: 'EXCEPTION_MARKER', weight: 4, directionHint: 'exception', notes: 'Excludes all but the problem area.' })
];

export const DISCOURSE_MARKER_PATTERNS = [
    ...CONTRASTIVE_MARKER_PATTERNS,
    ...EXCEPTION_MARKER_PATTERNS
];

export const LEGACY_MARKER_FAMILIES = ['CONTRASTIVE_MARKER', 'EXCEPTION_MARKER'];

export const CLAUSE_SEGMENT_MARKERS = [
    ...new Set([
        ...flattenPatternLabels(DISCOURSE_MARKER_PATTERNS),
        'only',
        'just'
    ])
];
