// Shared helpers for normalized lexicon entries.
export function createPatternObject({
    pattern,
    family,
    weight,
    directionHint,
    notes,
    label = null
}) {
    return {
        pattern,
        family,
        weight,
        directionHint,
        notes,
        label: label || (typeof pattern === 'string' ? pattern : String(pattern))
    };
}

export function toRegex(pattern) {
    if (pattern instanceof RegExp) {
        return pattern;
    }

    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i');
}

export function matchPattern(text, patternObject) {
    if (!text || !patternObject) {
        return null;
    }

    const regex = toRegex(patternObject.pattern);
    const match = regex.exec(text);
    if (!match) {
        return null;
    }

    return {
        match: match[0],
        index: match.index,
        regex
    };
}

export function flattenPatternLabels(patternObjects = []) {
    return patternObjects
        .map(entry => entry.label || (typeof entry.pattern === 'string' ? entry.pattern : null))
        .filter(Boolean);
}
