import { describe, expect, it } from 'vitest';
import { selectComplaintCandidate } from './complaintSelector.js';

describe('complaintSelector', () => {
    it('prefers explicit contrast over weaker ties when scores match', () => {
        const result = selectComplaintCandidate([
            {
                text: 'but the search is slow',
                signals: [
                    { type: 'CONTRASTIVE_MARKER', match: 'but' },
                    { type: 'DIRECT_NEGATIVE_CUE', match: 'slow' }
                ],
                score: 5,
                confidence: 0.75,
                complaintType: 'EXPLICIT_CONTRAST',
                markerFound: 'but'
            },
            {
                text: 'the app is slow',
                signals: [{ type: 'DIRECT_NEGATIVE_CUE', match: 'slow' }],
                score: 5,
                confidence: 0.75,
                complaintType: 'DIRECT_COMPLAINT',
                markerFound: 'slow'
            }
        ]);

        expect(result.best?.markerFound).toBe('but');
        expect(result.ranked[0].complaintType).toBe('EXPLICIT_CONTRAST');
    });

    it('selects a soft complaint without a discourse marker', () => {
        const result = selectComplaintCandidate([
            {
                text: 'battery life could be better',
                signals: [{ type: 'SOFT_DISSATISFACTION', match: 'could be better' }],
                score: 3,
                confidence: 0.5,
                complaintType: 'SOFT_DISSATISFACTION',
                markerFound: 'could be better'
            }
        ]);

        expect(result.best?.complaintType).toBe('SOFT_DISSATISFACTION');
    });

    it('prefers expectation complaints over softer ties', () => {
        const result = selectComplaintCandidate([
            {
                text: 'I expected more from the camera',
                signals: [{ type: 'EXPECTATION_FAILURE', match: 'expected more' }],
                score: 4,
                confidence: 0.63,
                complaintType: 'EXPECTATION_FAILURE',
                markerFound: 'expected more'
            },
            {
                text: 'camera could be better',
                signals: [{ type: 'SOFT_DISSATISFACTION', match: 'could be better' }],
                score: 4,
                confidence: 0.63,
                complaintType: 'SOFT_DISSATISFACTION',
                markerFound: 'could be better'
            }
        ]);

        expect(result.best?.complaintType).toBe('EXPECTATION_FAILURE');
    });

    it('returns null when every candidate is below the safe threshold', () => {
        const result = selectComplaintCandidate([
            {
                text: 'works fine overall',
                signals: [{ type: 'PRAISE_CUE', match: 'works fine' }],
                score: -2,
                confidence: 0,
                complaintType: null,
                markerFound: null
            }
        ]);

        expect(result.best).toBe(null);
        expect(result.ranked).toHaveLength(1);
    });
});
