import { createPatternObject } from './patternUtils.js';

// Soft dissatisfaction captures hedged disappointment that still points to a genuine issue.
export const SOFT_DISSATISFACTION_PATTERN_OBJECTS = [
    createPatternObject({ pattern: 'could be better', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'underwhelmed', notes: 'Softened complaint framing.' }),
    createPatternObject({ pattern: 'could use improvement', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'underwhelmed', notes: 'Improvement request framed softly.' }),
    createPatternObject({ pattern: 'leaves a lot to be desired', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'underwhelmed', notes: 'Strong but still indirect dissatisfaction.' }),
    createPatternObject({ pattern: 'not ideal', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'underwhelmed', notes: 'Common understatement complaint.' }),
    createPatternObject({ pattern: 'lacking', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'deficiency', notes: 'Signals missing quality or capability.' }),
    createPatternObject({ pattern: 'just average', family: 'SOFT_DISSATISFACTION', weight: 2.5, directionHint: 'underwhelmed', notes: 'Expectation lowering rather than praise.' }),
    createPatternObject({ pattern: 'disappointing', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'underwhelmed', notes: 'Direct but still non-specific disappointment.' }),
    createPatternObject({ pattern: 'feels cheap', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'quality-drop', notes: 'Implied build-quality issue.' }),
    createPatternObject({ pattern: 'flimsy', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'quality-drop', notes: 'Weak build or material quality.' }),
    createPatternObject({ pattern: /\bwrinkl(?:e|es|ed)\s+easily\b/i, family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'quality-drop', notes: 'Surface/material complaint.', label: 'wrinkles easily' }),
    createPatternObject({ pattern: 'hidden fees', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'value-drop', notes: 'Unexpected pricing friction.' }),
    createPatternObject({ pattern: 'outdated', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'staleness', notes: 'Signals obsolete UI or functionality.' }),
    createPatternObject({ pattern: 'unresponsive', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'sluggishness', notes: 'Implied performance or support latency issue.' }),
    createPatternObject({ pattern: 'confusing', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'friction', notes: 'Usability friction without an explicit bug claim.' }),
    createPatternObject({ pattern: /\ba\s+bit\s+slow\b/i, family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'sluggishness', notes: 'Softened speed complaint.', label: 'a bit slow' }),
    createPatternObject({ pattern: /\btoo\s+slow\b/i, family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'sluggishness', notes: 'Clear but softened speed complaint.', label: 'too slow' }),
    createPatternObject({ pattern: 'slightly disappointing', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'underwhelmed', notes: 'Hedged disappointment.' }),
    createPatternObject({ pattern: 'somewhat frustrating', family: 'SOFT_DISSATISFACTION', weight: 3, directionHint: 'friction', notes: 'Hedged frustration.' })
];

export const SOFT_COMPLAINT_PHRASES = SOFT_DISSATISFACTION_PATTERN_OBJECTS
    .filter(entry => typeof entry.pattern === 'string')
    .map(entry => entry.pattern);
export const SOFT_COMPLAINT_REGEX_PATTERNS = SOFT_DISSATISFACTION_PATTERN_OBJECTS
    .filter(entry => entry.pattern instanceof RegExp)
    .map(entry => ({ label: entry.label, regex: entry.pattern }));
