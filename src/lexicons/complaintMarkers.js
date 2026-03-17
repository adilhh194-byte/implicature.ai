import {
    CLAUSE_SEGMENT_MARKERS,
    CONTRASTIVE_MARKER_PATTERNS,
    EXCEPTION_MARKER_PATTERNS,
    LEGACY_MARKER_FAMILIES
} from './discourseMarkers.js';
import { PRAISE_CUES } from './praiseCueWords.js';

// Compatibility wrapper for legacy imports while the analyzer migrates to the normalized lexicon layer.
export const CONTRASTIVE_MARKERS = CONTRASTIVE_MARKER_PATTERNS.map(entry => entry.label);
export const EXCEPTION_MARKERS = EXCEPTION_MARKER_PATTERNS.map(entry => entry.label);
export const PRAISE_CUES_LEGACY = PRAISE_CUES;
export const PRAISE_CUES = PRAISE_CUES_LEGACY;
export const CLAUSE_SEGMENT_CUES = CLAUSE_SEGMENT_MARKERS;
export const LEGACY_MARKER_SIGNAL_TYPES = LEGACY_MARKER_FAMILIES;
