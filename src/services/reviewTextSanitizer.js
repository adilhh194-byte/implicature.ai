const EXTRA_SPACE_REGEX = /\s+/g;
const WRAPPING_DOUBLE_QUOTES_REGEX = /^"([\s\S]*)"$/;
const WRAPPING_SINGLE_QUOTES_REGEX = /^'([\s\S]*)'$/;
const LEADING_ID_PREFIX_REGEXES = [
    /^\s*\d+\s*,\s*(?=["'])/,
    /^\s*\d+\s*[;|\t]\s*(?=["'])/,
    /^\s*(?:row|review|record|entry|id)\s*[:#-]?\s*\d+\s*[,;|:-]+\s*/i
];

function normalizeEscapedPunctuation(text) {
    return text
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\([,;:.!?()\[\]{}-])/g, '$1')
        .replace(/""/g, '"')
        .replace(/''/g, "'");
}

function stripLeadingIdPrefix(text) {
    let cleaned = text;

    LEADING_ID_PREFIX_REGEXES.forEach(regex => {
        cleaned = cleaned.replace(regex, '');
    });

    return cleaned;
}

function stripWrappingQuotes(text) {
    let cleaned = text.trim();
    let previous = null;

    while (cleaned && previous !== cleaned) {
        previous = cleaned;

        const doubleQuoted = cleaned.match(WRAPPING_DOUBLE_QUOTES_REGEX);
        if (doubleQuoted) {
            cleaned = doubleQuoted[1].trim();
            continue;
        }

        const singleQuoted = cleaned.match(WRAPPING_SINGLE_QUOTES_REGEX);
        if (singleQuoted) {
            cleaned = singleQuoted[1].trim();
            continue;
        }
    }

    return cleaned
        .replace(/^["'`]+/, '')
        .replace(/["'`]+$/, '')
        .trim();
}

export function sanitizeImportedReviewText(text) {
    if (text === null || text === undefined) {
        return '';
    }

    let cleaned = String(text)
        .replace(/^\uFEFF/, '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\r\n\t]+/g, ' ')
        .trim();

    if (!cleaned) {
        return '';
    }

    cleaned = normalizeEscapedPunctuation(cleaned);
    cleaned = stripLeadingIdPrefix(cleaned);
    cleaned = stripWrappingQuotes(cleaned);
    cleaned = normalizeEscapedPunctuation(cleaned);
    cleaned = cleaned
        .replace(/^[\s,;|]+/, '')
        .replace(/[\s]+([,;:.!?])/g, '$1')
        .replace(EXTRA_SPACE_REGEX, ' ')
        .trim();

    return cleaned;
}

export function sanitizeImportedReviewRecord(record) {
    if (typeof record === 'string') {
        return sanitizeImportedReviewText(record);
    }

    if (!record || typeof record !== 'object') {
        return '';
    }

    const text = typeof record.review === 'string'
        ? record.review
        : typeof record.text === 'string'
            ? record.text
            : typeof record.original_review === 'string'
                ? record.original_review
                : '';

    return sanitizeImportedReviewText(text);
}
