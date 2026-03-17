export class DiscourseDetector {
    constructor() {
        // Categorized markers based on discourse structure
        this.markerCategories = {
            CONCESSIVE_FRONT: {
                markers: ['even though', 'although', 'while', 'despite the fact that', 'in spite of the fact that', 'despite', 'in spite of', 'regardless of', 'instead of'],
                priority: 1
            },
            EXCEPTION: {
                markers: ['except for', 'except', 'only if'],
                priority: 2
            },
            CONTRAST: {
                // Priority: but/however > though/whereas > still/yet
                levels: [
                    ['but', 'however', 'on the other hand', 'conversely', 'alternatively'],
                    ['though', 'whereas'],
                    ['still', 'yet']
                ],
                priority: 3
            },
            PRAGMATIC: {
                markers: ['unfortunately', 'sadly', 'regrettably', 'the problem is', 'the issue is'],
                priority: 4
            },
            NEGATIVE_RECOMMENDATION: {
                markers: ["i'd rather", "i would rather", "id rather"],
                priority: 5
            }
        };

        // Pre-compile regexes for each category/level
        this.regexes = {
            CONCESSIVE_FRONT: this._buildRegex(this.markerCategories.CONCESSIVE_FRONT.markers),
            EXCEPTION: this._buildRegex(this.markerCategories.EXCEPTION.markers),
            CONTRAST_L1: this._buildRegex(this.markerCategories.CONTRAST.levels[0]),
            CONTRAST_L2: this._buildRegex(this.markerCategories.CONTRAST.levels[1]),
            CONTRAST_L3: this._buildRegex(this.markerCategories.CONTRAST.levels[2]),
            PRAGMATIC: this._buildRegex(this.markerCategories.PRAGMATIC.markers),
            NEGATIVE_RECOMMENDATION: this._buildRegex(this.markerCategories.NEGATIVE_RECOMMENDATION.markers)
        };
    }

    _buildRegex(markers) {
        // Sort descending by length so longer phrases match first (e.g. "except for" before "except")
        const sorted = [...markers].sort((a, b) => b.length - a.length);
        const escaped = sorted.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        return new RegExp(`\\b(${escaped.join('|')})\\b`, 'i');
    }

    detect(text) {
        if (!text || typeof text !== 'string') {
            return { marker: null, type: null, position: -1 };
        }

        const matches = [];

        // 1. Detect Concessive Fronts
        const matchCF = text.match(this.regexes.CONCESSIVE_FRONT);
        if (matchCF) matches.push({ marker: matchCF[1], position: matchCF.index, type: 'CONCESSIVE_FRONT', priority: 1 });

        // 2. Detect Exceptions
        const matchEx = text.match(this.regexes.EXCEPTION);
        if (matchEx) {
            matches.push({ marker: matchEx[1], position: matchEx.index, type: 'EXCEPTION', priority: 2 });
        }

        // 3. Detect Contrasts (Level 1 > Level 2 > Level 3)
        const matchC1 = text.match(this.regexes.CONTRAST_L1);
        if (matchC1) {
            matches.push({ marker: matchC1[1], position: matchC1.index, type: 'CONTRAST', priority: 3 });
        } else {
            const matchC2 = text.match(this.regexes.CONTRAST_L2);
            if (matchC2) {
                matches.push({ marker: matchC2[1], position: matchC2.index, type: 'CONTRAST', priority: 4 });
            } else {
                const matchC3 = text.match(this.regexes.CONTRAST_L3);
                if (matchC3) {
                    matches.push({ marker: matchC3[1], position: matchC3.index, type: 'CONTRAST', priority: 5 });
                }
            }
        }

        // 4. Detect Pragmatic
        const matchPrag = text.match(this.regexes.PRAGMATIC);
        if (matchPrag) matches.push({ marker: matchPrag[1], position: matchPrag.index, type: 'PRAGMATIC', priority: 6 });

        // 5. Detect Negative Recommendation
        const matchNegReq = text.match(this.regexes.NEGATIVE_RECOMMENDATION);
        if (matchNegReq) matches.push({ marker: matchNegReq[1], position: matchNegReq.index, type: 'NEGATIVE_RECOMMENDATION', priority: 7 });

        if (matches.length === 0) {
            return { marker: null, type: null, position: -1 };
        }

        // Sort by priority (lower number = higher priority).
        // If same priority, take the first one that appears in text.
        matches.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.position - b.position;
        });

        return {
            marker: matches[0].marker,
            type: matches[0].type,
            position: matches[0].position
        };
    }
}
