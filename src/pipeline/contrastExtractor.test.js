import { describe, expect, it } from 'vitest';
import { extractComplaint } from './contrastExtractor.js';

describe('contrastExtractor orchestrator', () => {
    it('handles an explicit marker review', () => {
        const result = extractComplaint('Great app, but the search is slow.');

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.marker_found).toBe('but');
        expect(result.complaint_type).toBe('EXPLICIT_CONTRAST');
        expect(result.category).toBe('Performance');
    });

    it('handles a no-marker soft complaint', () => {
        const result = extractComplaint('Battery life could be better.');

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.condensed_complaint).toBe('weak battery life');
        expect(result.category).toBe('Battery');
    });

    it('handles an expectation complaint', () => {
        const result = extractComplaint('I expected more from the camera.');

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe('EXPECTATION_FAILURE');
        expect(result.category).toBe('Camera');
    });

    it('returns no complaint for praise-only reviews', () => {
        const result = extractComplaint('Works perfectly and I love it.');

        expect(result.has_hidden_complaint).toBe(false);
        expect(result.complaint_text).toBe('');
        expect(result.category).toBe('No Complaint');
    });

    it('extracts the strongest complaint from a mixed long review', () => {
        const review = 'I really wanted to love this app because the design looks polished and the onboarding seemed smooth. After a week, however, the old version felt smoother, notifications stopped arriving on time, and support replied too slowly whenever I asked for help. The camera is decent, but the app is still too slow to load every morning.';
        const result = extractComplaint(review);

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_text.length).toBeGreaterThan(0);
        expect(result.condensed_complaint.length).toBeGreaterThan(0);
        expect(result.evidence_signals.length).toBeGreaterThan(0);
        expect(['Performance', 'Features', 'Support']).toContain(result.category);
    });
});

