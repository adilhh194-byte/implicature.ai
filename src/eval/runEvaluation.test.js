import { describe, expect, it } from 'vitest';
import { evaluateGoldReviews, generateEvaluationReportMarkdown } from './runEvaluation.js';

class StubAnalyzer {
    constructor(results) {
        this.results = results;
    }

    safeAnalyze({ id }) {
        return this.results[id];
    }
}

describe('runEvaluation', () => {
    it('computes detection, span, and family metrics from gold cases', () => {
        const goldRows = [
            {
                id: 'tp',
                review: 'Battery life could be better.',
                has_hidden_complaint: true,
                gold_span: 'Battery life could be better',
                category: 'Battery',
                complaint_type: 'SOFT_DISSATISFACTION'
            },
            {
                id: 'fn',
                review: 'I expected more from the camera.',
                has_hidden_complaint: true,
                gold_span: 'expected more from the camera',
                category: 'Camera',
                complaint_type: 'EXPECTATION_FAILURE'
            },
            {
                id: 'fp',
                review: 'Works fine overall.',
                has_hidden_complaint: false,
                gold_span: '',
                category: 'Other',
                complaint_type: null
            }
        ];

        const analyzer = new StubAnalyzer({
            tp: {
                has_hidden_complaint: true,
                complaint_text: 'Battery life could be better',
                category: 'Battery',
                complaint_type: 'SOFT_DISSATISFACTION',
                confidence: 0.7,
                evidence_signals: []
            },
            fn: {
                has_hidden_complaint: false,
                complaint_text: '',
                category: 'No Complaint',
                complaint_type: null,
                confidence: 0,
                evidence_signals: []
            },
            fp: {
                has_hidden_complaint: true,
                complaint_text: '84,"works fine overall',
                category: 'Other',
                complaint_type: 'DIRECT_COMPLAINT',
                confidence: 0.41,
                evidence_signals: []
            }
        });

        const summary = evaluateGoldReviews(goldRows, analyzer);

        expect(summary.detection.truePositives).toBe(1);
        expect(summary.detection.falseNegatives).toBe(1);
        expect(summary.detection.falsePositives).toBe(1);
        expect(summary.detection.precision).toBe(0.5);
        expect(summary.detection.recall).toBe(0.5);
        expect(summary.detection.f1).toBe(0.5);
        expect(summary.familyBreakdown.soft_dissatisfaction.familyRecall).toBe(1);
        expect(summary.familyBreakdown.expectation_failure.familyRecall).toBe(0);
        expect(summary.malformedExtractionCount).toBe(1);
        expect(summary.worstMisses.falseNegatives).toHaveLength(1);
        expect(summary.worstMisses.falsePositives).toHaveLength(1);
    });

    it('renders a readable markdown report', () => {
        const summary = {
            generatedAt: '2026-03-17T00:00:00.000Z',
            totalReviews: 2,
            positiveReviews: 1,
            predictedComplaints: 1,
            detection: {
                truePositives: 1,
                falsePositives: 0,
                falseNegatives: 0,
                trueNegatives: 1,
                precision: 1,
                recall: 1,
                f1: 1
            },
            span: {
                averagePositiveSpanF1: 1,
                averageDetectedSpanF1: 1,
                exactSpanMatchRate: 1
            },
            category: {
                correct: 1,
                accuracy: 1
            },
            familyBreakdown: Object.fromEntries([
                'explicit_contrast',
                'exception',
                'concessive_front',
                'expectation_failure',
                'comparison_regression',
                'wish_or_counterfactual',
                'preference_avoidance',
                'soft_dissatisfaction',
                'direct_complaint'
            ].map(key => [key, {
                support: key === 'soft_dissatisfaction' ? 1 : 0,
                detected: key === 'soft_dissatisfaction' ? 1 : 0,
                familyMatched: key === 'soft_dissatisfaction' ? 1 : 0,
                recall: key === 'soft_dissatisfaction' ? 1 : 0,
                familyRecall: key === 'soft_dissatisfaction' ? 1 : 0,
                averageSpanF1: key === 'soft_dissatisfaction' ? 1 : 0
            }])),
            malformedExtractionCount: 0,
            worstMisses: {
                falseNegatives: [],
                falsePositives: [],
                poorOverlaps: []
            }
        };

        const markdown = generateEvaluationReportMarkdown(summary);

        expect(markdown).toContain('# Analyzer Evaluation Report');
        expect(markdown).toContain('## Overview');
        expect(markdown).toContain('## Worst Misses');
        expect(markdown).toContain('soft_dissatisfaction');
    });
});
