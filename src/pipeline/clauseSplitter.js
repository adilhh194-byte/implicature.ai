import { PolarityChecker } from './polarityChecker.js';

export class ClauseSplitter {
    constructor() {
        this.polarityChecker = new PolarityChecker();
    }

    _cleanClause(clause) {
        if (!clause) return '';
        // Trim spaces, remove punctuation at the beginning and end, normalize capitalization
        let cleaned = clause.replace(/^[\s,;:\-"'.]+|[\s,;:\-"'.]+$/g, '').trim();
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        return cleaned;
    }

    split(text, markerInfo) {
        if (!text || !markerInfo || !markerInfo.marker) {
            return null;
        }

        const { marker, type, position } = markerInfo;
        const textLower = text.toLowerCase();
        const markerLower = marker.toLowerCase();
        // Since discourseDetector uses regex, the position might differ slightly from indexOf if there are multiple occurrences.
        // But indexOf from position is safe since discourse detector found it there.
        const actualPos = textLower.indexOf(markerLower, position >= 0 ? position : 0);

        if (actualPos === -1) return null;

        const clauseBefore = text.substring(0, actualPos).trim();
        const clauseAfter = text.substring(actualPos + marker.length).trim();

        let targetComplaint = '';

        if (type === 'CONCESSIVE_FRONT') {
            // e.g. "Although X, Y" or "Despite X, Y"
            // If marker is at start of sentence, the complaint is usually the clause after the comma
            if (actualPos < 5) { // Roughly at the start
                const commaPos = clauseAfter.indexOf(',');
                if (commaPos !== -1) {
                    targetComplaint = clauseAfter.substring(commaPos + 1);
                } else {
                    // No comma? Just take the whole thing and hope polarity checker or something catches it?
                    // Usually there's a comma. If not, it's hard to split structurally. Return clauseAfter.
                    targetComplaint = clauseAfter;
                }
            } else {
                // e.g. "The fabric feels cheap although the dress fits well"
                // Marker is in the middle. Complaint is usually BEFORE the marker.
                // Wait, "The fabric feels cheap" (clauseBefore).
                targetComplaint = clauseBefore;
            }
        }
        else if (type === 'EXCEPTION') {
            // e.g. "All works well except the bluetooth"
            // Complaint is ALWAYS after the marker.
            targetComplaint = clauseAfter;
        }
        else if (type === 'PRAGMATIC') {
            // e.g. "Unfortunately, it broke"
            // Complaint is ALWAYS after the marker.
            targetComplaint = clauseAfter;
        }
        else if (type === 'CONTRAST') {
            // e.g. "X but Y", "X yet Y"
            // Default assumes Y is complaint. BUT user noted: "I waited..., yet the refund was smooth"
            // Need polarity check.
            const isANeg = this.polarityChecker.isNegative(clauseBefore);
            const isBNeg = this.polarityChecker.isNegative(clauseAfter);

            if (isANeg && !isBNeg) {
                targetComplaint = clauseBefore;  // Negative -> Positive
            } else if (!isANeg && isBNeg) {
                targetComplaint = clauseAfter;   // Positive -> Negative
            } else {
                // Ambiguous or both negative. Default to discourse structure (clause after contrast).
                targetComplaint = clauseAfter || clauseBefore;
            }
        } else if (type === 'NEGATIVE_RECOMMENDATION') {
            // "I'd rather X" -> complaint is "I'd rather X"
            targetComplaint = marker + ' ' + clauseAfter;
        } else {
            // Catch-all for any unknown type
            targetComplaint = clauseAfter || clauseBefore;
        }

        const complaintClause = this._cleanClause(targetComplaint);

        if (!complaintClause) {
            // Failsafe: if polarity resolution returns empty string or fails, just return the clause after the marker
            const fallback = clauseAfter ? clauseAfter : clauseBefore;
            if (!fallback) return null;
            return {
                clauseBefore,
                complaintClause: this._cleanClause(fallback)
            };
        }

        return {
            clauseBefore,
            complaintClause
        };
    }
}
