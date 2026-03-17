import { CLAUSE_SEGMENT_MARKERS } from '../lexicons/discourseMarkers.js';
import { CONCESSIVE_PATTERN_OBJECTS } from '../lexicons/concessivePatterns.js';
import { COMPLAINT_FRAGMENT_HINTS } from '../lexicons/aspectKeywords.js';
import { countWords } from './textUtils.js';

function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SEGMENT_CUES = [
    ...CLAUSE_SEGMENT_MARKERS.filter(cue => cue !== 'while'),
    ...CONCESSIVE_PATTERN_OBJECTS
        .map(entry => entry.label || (typeof entry.pattern === 'string' ? entry.pattern : null))
        .filter(Boolean)
];

const CUE_REGEXES = [...new Set(SEGMENT_CUES)]
    .sort((a, b) => b.length - a.length)
    .map(cue => ({
        cue,
        regex: new RegExp(`\\b${escapeForRegex(cue)}\\b`, 'i')
    }));

function cleanFragment(text) {
    return (text || '')
        .replace(/^[\s,;:.!?-]+|[\s,;:.!?-]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasComplaintHint(text) {
    const lowered = (text || '').toLowerCase();
    return COMPLAINT_FRAGMENT_HINTS.some(hint => lowered.includes(hint));
}

function isMeaningfulFragment(text, forceTinyKeep = false) {
    const cleaned = cleanFragment(text);
    if (!cleaned) {
        return false;
    }

    const wordCount = countWords(cleaned);
    if (wordCount >= 2) {
        return true;
    }

    return forceTinyKeep || hasComplaintHint(cleaned);
}

function splitOnPunctuation(sentence) {
    const fragments = [];
    const boundaryRegex = /,|;|\s[\-–—]\s/g;

    let cursor = 0;
    let match;
    while ((match = boundaryRegex.exec(sentence)) !== null) {
        fragments.push({
            text: sentence.slice(cursor, match.index),
            start: cursor,
            end: match.index
        });
        cursor = match.index + match[0].length;
    }

    fragments.push({
        text: sentence.slice(cursor),
        start: cursor,
        end: sentence.length
    });

    return fragments;
}

function findEarliestCue(text) {
    let earliest = null;

    for (const cuePattern of CUE_REGEXES) {
        const match = cuePattern.regex.exec(text);
        if (!match || match.index === 0) {
            continue;
        }

        if (!earliest || match.index < earliest.index) {
            earliest = {
                cue: cuePattern.cue,
                index: match.index
            };
        }
    }

    return earliest;
}

function splitOnCueBoundaries(text, offset) {
    const earliestCue = findEarliestCue(text);
    if (!earliestCue) {
        return [{ text, start: offset, end: offset + text.length }];
    }

    const before = text.slice(0, earliestCue.index);
    const after = text.slice(earliestCue.index);
    const segments = [];

    if (isMeaningfulFragment(before)) {
        segments.push(...splitOnCueBoundaries(before, offset));
    }

    if (isMeaningfulFragment(after, true)) {
        segments.push(...splitOnCueBoundaries(after, offset + earliestCue.index));
    }

    return segments;
}

export function segmentClauses(normalizedReviewObj) {
    if (!normalizedReviewObj || !normalizedReviewObj.normalized) {
        return [];
    }

    const sentences = Array.isArray(normalizedReviewObj.sentences) && normalizedReviewObj.sentences.length > 0
        ? normalizedReviewObj.sentences
        : [normalizedReviewObj.normalized];

    const clauses = [];
    let searchCursor = 0;

    sentences.forEach((sentence, sentenceIndex) => {
        const sentenceStart = normalizedReviewObj.normalized.indexOf(sentence, searchCursor);
        searchCursor = sentenceStart >= 0 ? sentenceStart + sentence.length : searchCursor;

        const sentenceOffset = sentenceStart >= 0 ? sentenceStart : null;
        const punctuationFragments = splitOnPunctuation(sentence);
        const clauseCandidates = punctuationFragments.flatMap(fragment =>
            splitOnCueBoundaries(fragment.text, fragment.start)
        );

        let clauseIndex = 0;
        clauseCandidates.forEach(candidate => {
            const cleanedText = cleanFragment(candidate.text);
            if (!isMeaningfulFragment(cleanedText)) {
                return;
            }

            clauses.push({
                text: cleanedText,
                sentenceIndex,
                clauseIndex,
                startHint: sentenceOffset === null ? null : sentenceOffset + candidate.start,
                endHint: sentenceOffset === null ? null : sentenceOffset + candidate.end
            });
            clauseIndex += 1;
        });
    });

    return clauses;
}
