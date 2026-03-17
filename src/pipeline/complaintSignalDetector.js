import {
    CONTRASTIVE_MARKER_PATTERNS,
    EXCEPTION_MARKER_PATTERNS,
    LEGACY_MARKER_FAMILIES
} from '../lexicons/discourseMarkers.js';
import { CONCESSIVE_PATTERN_OBJECTS } from '../lexicons/concessivePatterns.js';
import { EXPECTATION_PATTERN_OBJECTS } from '../lexicons/expectationPatterns.js';
import { COMPARISON_PATTERN_OBJECTS } from '../lexicons/comparisonPatterns.js';
import { PREFERENCE_AVOIDANCE_PATTERN_OBJECTS } from '../lexicons/preferenceAvoidancePatterns.js';
import { WISH_COUNTERFACTUAL_PATTERN_OBJECTS } from '../lexicons/wishCounterfactualPatterns.js';
import { SOFT_DISSATISFACTION_PATTERN_OBJECTS } from '../lexicons/softDissatisfactionPatterns.js';
import { DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS } from '../lexicons/negativeCueWords.js';
import { PRAISE_CUE_PATTERN_OBJECTS } from '../lexicons/praiseCueWords.js';
import { matchPattern } from '../lexicons/patternUtils.js';

export const SIGNAL_FAMILIES = [
    { type: 'CONTRASTIVE_MARKER', complaintTypeHint: 'EXPLICIT_CONTRAST', patterns: CONTRASTIVE_MARKER_PATTERNS },
    { type: 'EXCEPTION_MARKER', complaintTypeHint: 'EXCEPTION_COMPLAINT', patterns: EXCEPTION_MARKER_PATTERNS },
    { type: 'CONCESSIVE_PATTERN', complaintTypeHint: 'EXPLICIT_CONTRAST', patterns: CONCESSIVE_PATTERN_OBJECTS },
    { type: 'EXPECTATION_FAILURE', complaintTypeHint: 'EXPECTATION_FAILURE', patterns: EXPECTATION_PATTERN_OBJECTS },
    { type: 'NEGATIVE_COMPARISON', complaintTypeHint: 'NEGATIVE_COMPARISON', patterns: COMPARISON_PATTERN_OBJECTS },
    { type: 'PREFERENCE_AVOIDANCE', complaintTypeHint: 'PREFERENCE_AVOIDANCE', patterns: PREFERENCE_AVOIDANCE_PATTERN_OBJECTS },
    { type: 'WISH_COUNTERFACTUAL', complaintTypeHint: 'WISH_REQUEST', patterns: WISH_COUNTERFACTUAL_PATTERN_OBJECTS },
    { type: 'SOFT_DISSATISFACTION', complaintTypeHint: 'SOFT_DISSATISFACTION', patterns: SOFT_DISSATISFACTION_PATTERN_OBJECTS },
    { type: 'DIRECT_NEGATIVE_CUE', complaintTypeHint: 'DIRECT_COMPLAINT', patterns: DIRECT_NEGATIVE_CUE_PATTERN_OBJECTS },
    { type: 'PRAISE_CUE', complaintTypeHint: null, patterns: PRAISE_CUE_PATTERN_OBJECTS }
];

const LEGACY_MARKER_TYPES = new Set(LEGACY_MARKER_FAMILIES);

export function detectComplaintSignals(clauseText) {
    if (!clauseText || typeof clauseText !== 'string') {
        return {
            signals: [],
            markerFound: null,
            complaintTypeHints: []
        };
    }

    const matches = [];
    const dedupe = new Set();

    SIGNAL_FAMILIES.forEach(family => {
        family.patterns.forEach(patternObject => {
            const found = matchPattern(clauseText, patternObject);
            if (!found) {
                return;
            }

            const key = `${family.type}:${found.match.toLowerCase()}:${found.index}`;
            if (dedupe.has(key)) {
                return;
            }

            dedupe.add(key);
            matches.push({
                type: family.type,
                match: found.match.toLowerCase(),
                weight: patternObject.weight,
                complaintTypeHint: family.complaintTypeHint,
                index: found.index
            });
        });
    });

    matches.sort((left, right) => {
        if (left.index !== right.index) {
            return left.index - right.index;
        }

        return right.weight - left.weight;
    });

    const complaintTypeHints = [
        ...new Set(matches
            .map(match => match.complaintTypeHint)
            .filter(Boolean))
    ];

    const hasPraiseCue = matches.some(match => match.type === 'PRAISE_CUE');
    const hasComplaintSignal = matches.some(match => match.type !== 'PRAISE_CUE');
    if (hasPraiseCue && hasComplaintSignal) {
        complaintTypeHints.push('CONCESSIVE_PRAISE');
    }

    const firstLegacyMarker = matches.find(match => LEGACY_MARKER_TYPES.has(match.type)) || null;

    return {
        signals: matches.map(({ type, match, weight }) => ({ type, match, weight })),
        markerFound: firstLegacyMarker ? firstLegacyMarker.match : null,
        complaintTypeHints: [...new Set(complaintTypeHints)]
    };
}
