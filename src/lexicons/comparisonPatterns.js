import { createPatternObject } from './patternUtils.js';

// Comparison patterns capture regressions and unfavorable comparisons against older or competing products.
export const COMPARISON_PATTERN_OBJECTS = [
    createPatternObject({ pattern: /\bold\s+version\s+was\s+(?:much\s+)?(?:better|more\s+reliable|smoother|faster)\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.5, directionHint: 'regression', notes: 'Direct regression claim against an older version.', label: 'old version was better' }),
    createPatternObject({ pattern: /\bprevious\s+version\s+(?:was|felt)\s+(?:much\s+)?(?:better|more\s+reliable|smoother|faster)\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.5, directionHint: 'regression', notes: 'Direct regression claim against the previous version.', label: 'previous version was more reliable' }),
    createPatternObject({ pattern: /\bcompetitor\s+offers\s+better\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.5, directionHint: 'inferior-comparison', notes: 'Competitor explicitly outperforms this product.', label: 'competitor offers better' }),
    createPatternObject({ pattern: /\bcheaper\s+version\s+(?:actually\s+)?performs?\s+better\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.6, directionHint: 'inferior-value', notes: 'Lower-priced alternative performs better.', label: 'cheaper version performs better' }),
    createPatternObject({ pattern: /\balternative\s+product\s+works\s+flawlessly\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.5, directionHint: 'inferior-comparison', notes: 'Alternative product is framed as trouble-free.', label: 'alternative product works flawlessly' }),
    createPatternObject({ pattern: /\bused\s+to\s+be\s+better\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.5, directionHint: 'regression', notes: 'Short regression formulation.', label: 'used to be better' }),
    createPatternObject({ pattern: /\bupdate\b.*\bmade\b.*\bworse\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.7, directionHint: 'regression', notes: 'An update explicitly degraded the experience.', label: 'update made things worse' }),
    createPatternObject({ pattern: /\bwired\s+version\s+has\s+no\s+(?:latency|lag)\b/i, family: 'NEGATIVE_COMPARISON', weight: 3.4, directionHint: 'variant-comparison', notes: 'A wired variant is described as avoiding the current problem.', label: 'wired version has no latency' })
];

export const NEGATIVE_COMPARISON_PHRASES = [
    'used to be better',
    'old version was better',
    'previous version was more reliable',
    'competitor offers better',
    'cheaper version performs better',
    'alternative product works flawlessly',
    'update made things worse',
    'wired version has no latency'
];
export const NEGATIVE_COMPARISON_REGEX_PATTERNS = COMPARISON_PATTERN_OBJECTS
    .filter(entry => entry.pattern instanceof RegExp)
    .map(entry => ({ label: entry.label, regex: entry.pattern }));
