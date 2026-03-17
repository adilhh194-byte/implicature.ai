import { createPatternObject } from './patternUtils.js';

// Expectation failures capture disappointment relative to what the reviewer thought would happen.
export const EXPECTATION_PATTERN_OBJECTS = [
    createPatternObject({ pattern: /\bexpected\s+(?:better|more)(?:\s+from)?\b/i, family: 'EXPECTATION_FAILURE', weight: 4, directionHint: 'under-delivery', notes: 'Reviewer states the product underperformed expectations.', label: 'expected better/more' }),
    createPatternObject({ pattern: /\bshould\s+have\b/i, family: 'EXPECTATION_FAILURE', weight: 4, directionHint: 'under-delivery', notes: 'Implies a missed expected capability.', label: 'should have' }),
    createPatternObject({ pattern: /\bsupposed\s+to\b/i, family: 'EXPECTATION_FAILURE', weight: 4, directionHint: 'under-delivery', notes: 'Signals a promised behavior that failed.', label: 'supposed to' }),
    createPatternObject({ pattern: /\bthought\s+it\s+would\b/i, family: 'EXPECTATION_FAILURE', weight: 4, directionHint: 'under-delivery', notes: 'Expectation mismatch phrase.', label: 'thought it would' }),
    createPatternObject({ pattern: /\bhoped\s+it\s+would\b/i, family: 'EXPECTATION_FAILURE', weight: 4, directionHint: 'under-delivery', notes: 'Softened disappointment tied to hoped-for performance.', label: 'hoped it would' })
];

export const EXPECTATION_FAILURE_PHRASES = ['expected better', 'expected more', 'should have', 'supposed to', 'thought it would', 'hoped it would'];
export const EXPECTATION_FAILURE_REGEX_PATTERNS = EXPECTATION_PATTERN_OBJECTS
    .filter(entry => entry.pattern instanceof RegExp)
    .map(entry => ({ label: entry.label, regex: entry.pattern }));
