import { describe, expect, it } from 'vitest';
import { analyzeComplaintReview } from '../pipeline/complaintSignalPipeline.js';
import { ReviewAnalyzer } from './reviewAnalyzer.js';

describe('Complaint-signal analyzer coverage', () => {
    const analyzer = new ReviewAnalyzer();

    function expectComplaint(text, expectation) {
        const result = analyzer.safeAnalyze({ text });
        expect(result.has_hidden_complaint).toBe(expectation.hasHiddenComplaint);
        expect(result.complaint_text).toContain(expectation.complaintTextPart);
        expect(result.condensed_complaint).toBe(expectation.condensedComplaint);
        expect(result.category).toBe(expectation.category);
        expect(result.complaint_type).toBe(expectation.complaintType);
        expect(result.confidence).toBeGreaterThanOrEqual(expectation.minConfidence);
        expect(result.confidence).toBeLessThanOrEqual(1);
        expect(typeof result.model_features.numeric.candidate_length_tokens).toBe('number');
        expect(typeof result.model_features.numeric.ml_probability).toBe('number');
    }

    function expectFailureCase(text, expectation) {
        const result = analyzer.safeAnalyze({ text });

        expect(result.has_hidden_complaint).toBe(true);
        expect(result.complaint_type).toBe(expectation.complaintType);
        expect(result.confidence).toBeGreaterThanOrEqual(expectation.minConfidence);
        expect(result.confidence).toBeLessThanOrEqual(1);

        if (expectation.complaintTextPart) {
            expect(result.complaint_text.toLowerCase()).toContain(expectation.complaintTextPart.toLowerCase());
        }

        if (expectation.normalizedComplaint) {
            expect(result.condensed_complaint).toBe(expectation.normalizedComplaint);
        }

        if (expectation.category) {
            expect(result.category).toBe(expectation.category);
        }
    }

    describe('explicit contrast', () => {
        it('detects contrastive complaints', () => {
            expectComplaint('Great product but shipping was slow.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'shipping was slow',
                condensedComplaint: 'slow shipping',
                category: 'Shipping',
                complaintType: 'EXPLICIT_CONTRAST',
                minConfidence: 0.7
            });
        });
    });

    describe('exception complaints', () => {
        it('detects exception complaints', () => {
            expectComplaint('Everything is good except notifications.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'notifications',
                condensedComplaint: 'notifications',
                category: 'Features',
                complaintType: 'EXCEPTION_COMPLAINT',
                minConfidence: 0.6
            });
        });
    });

    describe('soft dissatisfaction without markers', () => {
        it('detects soft dissatisfaction', () => {
            expectComplaint('Battery life could be better.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'Battery life could be better',
                condensedComplaint: 'weak battery life',
                category: 'Battery',
                complaintType: 'SOFT_DISSATISFACTION',
                minConfidence: 0.5
            });
        });

        it('detects softened speed complaints', () => {
            expectComplaint('Good overall, just too slow to start.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'too slow to start',
                condensedComplaint: 'slow performance',
                category: 'Performance',
                complaintType: 'SOFT_DISSATISFACTION',
                minConfidence: 0.5
            });
        });
    });

    describe('expectation failure', () => {
        it('detects expectation mismatch', () => {
            expectComplaint('I expected more from the camera.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'expected more from the camera',
                condensedComplaint: 'camera underperforms',
                category: 'Camera',
                complaintType: 'EXPECTATION_FAILURE',
                minConfidence: 0.6
            });
        });
    });

    describe('wish request complaints', () => {
        it('detects wish/request complaints', () => {
            expectComplaint('I wish customer support replied faster.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'wish customer support replied faster',
                condensedComplaint: 'slow support response',
                category: 'Support',
                complaintType: 'WISH_REQUEST',
                minConfidence: 0.5
            });
        });
    });

    describe('negative comparison regression', () => {
        it('detects regression complaints', () => {
            expectComplaint('The previous version was smoother.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'previous version was smoother',
                condensedComplaint: 'performance regression',
                category: 'Performance',
                complaintType: 'NEGATIVE_COMPARISON',
                minConfidence: 0.5
            });
        });
    });

    describe('direct complaints', () => {
        it('detects direct complaint forms', () => {
            expectComplaint('Overpriced for what it offers.', {
                hasHiddenComplaint: true,
                complaintTextPart: 'Overpriced',
                condensedComplaint: 'high price',
                category: 'Price',
                complaintType: 'DIRECT_COMPLAINT',
                minConfidence: 0.3
            });
        });

        it('detects direct soft-negatives like not ideal', () => {
            const result = analyzeComplaintReview('Not ideal for travel.');
            expect(result.has_hidden_complaint).toBe(true);
            expect(result.complaint_text).toBe('Not ideal for travel');
            expect(result.condensed_complaint.length).toBeGreaterThan(0);
            expect(result.category).toBe('Other');
            expect(result.complaint_type).toBe('SOFT_DISSATISFACTION');
            expect(result.confidence).toBeGreaterThanOrEqual(0.4);
            expect(result.confidence).toBeLessThanOrEqual(1);
            expect(typeof result.model_features.numeric.candidate_length_tokens).toBe('number');
        });
    });

    describe('preference and avoidance', () => {
        it('detects avoidance-style complaints without explicit negatives', () => {
            const result = analyzer.safeAnalyze({ text: "I'd rather not rely on this for daily use." });
            expect(result.has_hidden_complaint).toBe(true);
            expect(result.complaint_type).toBe('PREFERENCE_AVOIDANCE');
            expect(result.category).toBe('Other');
            expect(result.marker_found).toBe(null);
        });
    });

    describe('praise only false positive protection', () => {
        it('does not flag praise only reviews', () => {
            const result = analyzer.safeAnalyze({ text: 'Love the design and it works perfectly.' });
            expect(result.has_hidden_complaint).toBe(false);
            expect(result.complaint_text).toBe('');
            expect(result.condensed_complaint).toBe('');
            expect(result.category).toBe('No Complaint');
            expect(result.complaint_type).toBe(null);
            expect(result.confidence).toBe(0);
            expect(result.model_features.numeric).toEqual({});
        });
    });

    describe('category assignment', () => {
        it('assigns shipping category correctly', () => {
            const result = analyzer.safeAnalyze({ text: 'Shipping took forever.' });
            expect(result.has_hidden_complaint).toBe(true);
            expect(result.condensed_complaint).toBe('slow shipping');
            expect(result.category).toBe('Shipping');
            expect(result.complaint_type).toBe('DIRECT_COMPLAINT');
            expect(result.confidence).toBeGreaterThanOrEqual(0.3);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });

    describe('confidence sanity', () => {
        it('keeps complaint confidence in range for mixed praise+complaint', () => {
            const result = analyzer.safeAnalyze({ text: 'Good product, only issue is the price.' });
            expect(result.has_hidden_complaint).toBe(true);
            expect(result.complaint_text).toContain('issue is the price');
            expect(result.condensed_complaint).toBe('high price');
            expect(result.category).toBe('Price');
            expect(result.complaint_type).toBe('DIRECT_COMPLAINT');
            expect(result.confidence).toBeGreaterThanOrEqual(0.3);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
    });

    describe('evaluation failure cases from the 100-review set', () => {
        it('covers difficult hidden complaint forms seen in evaluation misses', () => {
            const cases = [
                {
                    text: 'The interface is intuitive; nevertheless, it crashes frequently.',
                    complaintTextPart: 'crashes frequently',
                    complaintType: 'EXPLICIT_CONTRAST',
                    minConfidence: 0.85,
                    category: 'Bug'
                },
                {
                    text: 'Instead of improving my experience, the update made things worse.',
                    normalizedComplaint: 'update regression',
                    complaintType: 'NEGATIVE_COMPARISON',
                    minConfidence: 0.9,
                    category: 'Performance'
                },
                {
                    text: 'Alternatively, you could try the manual settings, whereas the auto mode often fails.',
                    complaintTextPart: 'auto mode often fails',
                    complaintType: 'EXPLICIT_CONTRAST',
                    minConfidence: 0.85,
                    category: 'Features'
                },
                {
                    text: 'While the camera takes great photos in daylight, it struggles in low light.',
                    complaintTextPart: 'low light',
                    complaintType: 'EXPLICIT_CONTRAST',
                    minConfidence: 0.85,
                    category: 'Camera'
                },
                {
                    text: 'Regardless of the price, I expected better quality.',
                    normalizedComplaint: 'quality below expectations',
                    complaintType: 'EXPECTATION_FAILURE',
                    minConfidence: 0.9,
                    category: 'Quality'
                },
                {
                    text: 'The app has great potential; nevertheless, it lacks essential features.',
                    complaintTextPart: 'lacks essential features',
                    complaintType: 'EXPLICIT_CONTRAST',
                    minConfidence: 0.85,
                    category: 'Features'
                },
                {
                    text: "I'd give it five stars only if the bugs were fixed.",
                    normalizedComplaint: 'unfixed bugs',
                    complaintType: 'WISH_REQUEST',
                    minConfidence: 0.85,
                    category: 'Bug'
                },
                {
                    text: 'Conversely, the cheaper version actually performs better.',
                    complaintTextPart: 'cheaper version actually performs better',
                    complaintType: 'NEGATIVE_COMPARISON',
                    minConfidence: 0.8
                },
                {
                    text: "I'd rather not use it again, whereas my friend loves his.",
                    complaintTextPart: 'rather not use it again',
                    complaintType: 'PREFERENCE_AVOIDANCE',
                    minConfidence: 0.8
                },
                {
                    text: 'Despite the warranty, they refused to replace it.',
                    complaintTextPart: 'refused to replace',
                    complaintType: 'EXPLICIT_CONTRAST',
                    minConfidence: 0.85,
                    category: 'Service'
                },
                {
                    text: "Regardless of the hype, it's just average.",
                    normalizedComplaint: 'underwhelming quality',
                    complaintType: 'SOFT_DISSATISFACTION',
                    minConfidence: 0.8,
                    category: 'Quality'
                },
                {
                    text: 'I recommend this only if you have small hands.',
                    complaintTextPart: 'small hands',
                    complaintType: 'PREFERENCE_AVOIDANCE',
                    minConfidence: 0.8,
                    category: 'Sizing'
                },
                {
                    text: 'On the other hand, the support team is unresponsive.',
                    complaintTextPart: 'support team is unresponsive',
                    complaintType: 'SOFT_DISSATISFACTION',
                    minConfidence: 0.9,
                    category: 'Support'
                },
                {
                    text: 'Conversely, the wired version has no latency.',
                    complaintTextPart: 'wired version has no latency',
                    complaintType: 'NEGATIVE_COMPARISON',
                    minConfidence: 0.8,
                    category: 'Performance'
                },
                {
                    text: "I'd rather use a different browser.",
                    normalizedComplaint: 'poor browser experience',
                    complaintType: 'PREFERENCE_AVOIDANCE',
                    minConfidence: 0.75,
                    category: 'Compatibility'
                }
            ];

            cases.forEach(testCase => expectFailureCase(testCase.text, testCase));
        });
    });

    describe('complaint extraction quality regressions', () => {
        it('produces readable extracted complaints for real spreadsheet failures', () => {
            const cases = [
                {
                    text: "Even though it's organic, it tasted artificial.",
                    complaintText: 'it tasted artificial',
                    condensedComplaint: 'artificial taste',
                    category: 'Other',
                    complaintType: 'EXPLICIT_CONTRAST'
                },
                {
                    text: 'Although the food presentation was excellent, the taste was quite bland.',
                    complaintText: 'the taste was quite bland',
                    condensedComplaint: 'bland taste',
                    category: 'Other',
                    complaintType: 'EXPLICIT_CONTRAST'
                },
                {
                    text: "In spite of the claims, it doesn't work as advertised.",
                    complaintText: 'it does not work as advertised',
                    condensedComplaint: 'does not work as advertised',
                    category: 'Other',
                    complaintType: 'EXPLICIT_CONTRAST'
                },
                {
                    text: 'Despite the fact that it looks sturdy, it broke after two uses.',
                    complaintText: 'it broke after two uses',
                    condensedComplaint: 'poor durability',
                    category: 'Durability',
                    complaintType: 'EXPLICIT_CONTRAST'
                },
                {
                    text: "Even though it's a trusted brand, I received a counterfeit.",
                    complaintText: 'I received a counterfeit',
                    condensedComplaint: 'counterfeit product',
                    category: 'Other',
                    complaintType: 'EXPLICIT_CONTRAST'
                },
                {
                    text: 'Even though the instructions are clear, assembly took hours.',
                    complaintText: 'assembly took hours',
                    condensedComplaint: 'time-consuming assembly',
                    category: 'Documentation',
                    complaintType: 'EXPLICIT_CONTRAST'
                },
                {
                    text: 'I recommend this only if you have small hands.',
                    complaintText: 'if you have small hands',
                    condensedComplaint: 'limited hand fit',
                    category: 'Sizing',
                    complaintType: 'PREFERENCE_AVOIDANCE'
                }
            ];

            cases.forEach(testCase => {
                const result = analyzer.safeAnalyze({ text: testCase.text });
                expect(result.has_hidden_complaint).toBe(true);
                expect(result.complaint_text).toBe(testCase.complaintText);
                expect(result.condensed_complaint).toBe(testCase.condensedComplaint);
                expect(result.category).toBe(testCase.category);
                expect(result.complaint_type).toBe(testCase.complaintType);
            });
        });

        it('does not extract a fake complaint from positive contrast structure alone', () => {
            const result = analyzer.safeAnalyze({ text: 'I waited till the last minute to return it, yet the refund process was smooth.' });
            expect(result.has_hidden_complaint).toBe(false);
            expect(result.complaint_text).toBe('');
            expect(result.condensed_complaint).toBe('');
            expect(result.category).toBe('No Complaint');
            expect(result.complaint_type).toBe(null);
        });
    });
});
