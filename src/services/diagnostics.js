import { ReviewAnalyzer } from './reviewAnalyzer.js';

const DEFAULT_CURATED_SUITE = [
    {
        id: 'battery-soft',
        text: 'Battery life could be better.',
        expectedComplaint: true,
        expectedCategory: 'Battery',
        expectedComplaintType: 'SOFT_DISSATISFACTION',
        tags: ['no-marker', 'soft-dissatisfaction']
    },
    {
        id: 'camera-expectation',
        text: 'I expected more from the camera.',
        expectedComplaint: true,
        expectedCategory: 'Camera',
        expectedComplaintType: 'EXPECTATION_FAILURE',
        tags: ['no-marker', 'expectation']
    },
    {
        id: 'notifications-exception',
        text: 'Everything is good except notifications.',
        expectedComplaint: true,
        expectedCategory: 'Features',
        expectedComplaintType: 'EXCEPTION_COMPLAINT',
        tags: ['exception']
    },
    {
        id: 'support-wish',
        text: 'I wish support replied faster.',
        expectedComplaint: true,
        expectedCategory: 'Support',
        expectedComplaintType: 'WISH_REQUEST',
        tags: ['no-marker', 'wish-request']
    },
    {
        id: 'regression-comparison',
        text: 'The previous version was much smoother.',
        expectedComplaint: true,
        expectedCategory: 'Performance',
        expectedComplaintType: 'NEGATIVE_COMPARISON',
        tags: ['no-marker', 'regression']
    },
    {
        id: 'praise-design',
        text: 'Great app, love the design.',
        expectedComplaint: false,
        expectedCategory: 'Other',
        expectedComplaintType: null,
        tags: ['praise-only']
    },
    {
        id: 'praise-works-fine',
        text: 'Works fine overall.',
        expectedComplaint: false,
        expectedCategory: 'Other',
        expectedComplaintType: null,
        tags: ['praise-only']
    },
    {
        id: 'daily-use-soft',
        text: 'Not ideal for daily use.',
        expectedComplaint: true,
        expectedCategory: 'Other',
        expectedComplaintType: 'SOFT_DISSATISFACTION',
        tags: ['no-marker', 'soft-dissatisfaction']
    },
    {
        id: 'shipping-direct',
        text: 'Shipping took forever.',
        expectedComplaint: true,
        expectedCategory: 'Shipping',
        expectedComplaintType: 'DIRECT_COMPLAINT',
        tags: ['no-marker', 'direct-complaint']
    },
    {
        id: 'price-only-issue',
        text: 'Good product, only issue is the price.',
        expectedComplaint: true,
        expectedCategory: 'Price',
        expectedComplaintType: 'DIRECT_COMPLAINT',
        tags: ['price', 'mixed-praise']
    }
];

const CONFIDENCE_BUCKETS = [
    { label: '0.00-0.19', min: 0, max: 0.2 },
    { label: '0.20-0.39', min: 0.2, max: 0.4 },
    { label: '0.40-0.59', min: 0.4, max: 0.6 },
    { label: '0.60-0.79', min: 0.6, max: 0.8 },
    { label: '0.80-1.00', min: 0.8, max: 1.001 }
];

export function getCuratedEvaluationSuite() {
    return DEFAULT_CURATED_SUITE.map(item => ({ ...item, tags: [...item.tags] }));
}

function createConfidenceHistogram(results) {
    return CONFIDENCE_BUCKETS.map(bucket => ({
        range: bucket.label,
        count: results.filter(result => {
            const confidence = typeof result.confidence === 'number' ? result.confidence : 0;
            return confidence >= bucket.min && confidence < bucket.max;
        }).length
    }));
}

function toComplaintTypeDistribution(results) {
    return results.reduce((distribution, item) => {
        if (!item.result.has_hidden_complaint) {
            return distribution;
        }

        const complaintType = item.result.complaint_type || 'UNKNOWN';
        distribution[complaintType] = (distribution[complaintType] || 0) + 1;
        return distribution;
    }, {});
}

function safeRate(numerator, denominator) {
    if (denominator === 0) {
        return 0;
    }

    return Number(((numerator / denominator) * 100).toFixed(1));
}

function formatConsoleSummary(summary) {
    const lines = [
        `Cases: ${summary.totalCases}`,
        `Expected complaints: ${summary.expectedComplaintCount}`,
        `Detected complaints: ${summary.detectedComplaintCount}`,
        `False negatives (no-marker): ${summary.falseNegativeNoMarker.length}`,
        `False positives (praise-only): ${summary.falsePositivePraiseOnly.length}`,
        `Category mismatches: ${summary.categoryMismatches.length}`,
        `Precision: ${summary.precision}%`,
        `Recall: ${summary.recall}%`
    ];

    return lines.join(' | ');
}

export function evaluateCuratedSuite(suite = getCuratedEvaluationSuite(), analyzer = new ReviewAnalyzer()) {
    const cases = suite.map(testCase => {
        const result = analyzer.safeAnalyze({ id: testCase.id, text: testCase.text });
        return {
            ...testCase,
            result
        };
    });

    const expectedComplaintCount = cases.filter(item => item.expectedComplaint).length;
    const detectedComplaintCount = cases.filter(item => item.result.has_hidden_complaint).length;
    const truePositives = cases.filter(item => item.expectedComplaint && item.result.has_hidden_complaint).length;
    const falsePositives = cases.filter(item => !item.expectedComplaint && item.result.has_hidden_complaint).length;
    const falseNegatives = cases.filter(item => item.expectedComplaint && !item.result.has_hidden_complaint).length;

    const falseNegativeNoMarker = cases
        .filter(item => item.tags.includes('no-marker') && item.expectedComplaint && !item.result.has_hidden_complaint)
        .map(item => ({ id: item.id, text: item.text, expectedCategory: item.expectedCategory }));

    const falsePositivePraiseOnly = cases
        .filter(item => item.tags.includes('praise-only') && item.result.has_hidden_complaint)
        .map(item => ({ id: item.id, text: item.text, predictedCategory: item.result.category }));

    const categoryMismatches = cases
        .filter(item => item.expectedComplaint && item.result.has_hidden_complaint)
        .filter(item => item.expectedCategory && item.result.category !== item.expectedCategory)
        .map(item => ({
            id: item.id,
            text: item.text,
            expectedCategory: item.expectedCategory,
            predictedCategory: item.result.category
        }));

    const complaintTypeDistribution = toComplaintTypeDistribution(cases);
    const confidenceHistogram = createConfidenceHistogram(cases.map(item => item.result));

    const summary = {
        totalCases: cases.length,
        expectedComplaintCount,
        detectedComplaintCount,
        truePositives,
        falsePositives,
        falseNegatives,
        falseNegativeNoMarker,
        falsePositivePraiseOnly,
        categoryMismatches,
        complaintTypeDistribution,
        confidenceHistogram,
        precision: safeRate(truePositives, truePositives + falsePositives),
        recall: safeRate(truePositives, truePositives + falseNegatives),
        consoleSummary: formatConsoleSummary({
            totalCases: cases.length,
            expectedComplaintCount,
            detectedComplaintCount,
            falseNegativeNoMarker,
            falsePositivePraiseOnly,
            categoryMismatches,
            precision: safeRate(truePositives, truePositives + falsePositives),
            recall: safeRate(truePositives, truePositives + falseNegatives)
        }),
        cases
    };

    return summary;
}

export function printCuratedEvaluation(summary = evaluateCuratedSuite()) {
    console.log('\n--- Complaint Signal Evaluation ---');
    console.log(summary.consoleSummary);
    console.table({
        totalCases: summary.totalCases,
        expectedComplaintCount: summary.expectedComplaintCount,
        detectedComplaintCount: summary.detectedComplaintCount,
        precision: `${summary.precision}%`,
        recall: `${summary.recall}%`,
        falseNegativeNoMarker: summary.falseNegativeNoMarker.length,
        falsePositivePraiseOnly: summary.falsePositivePraiseOnly.length,
        categoryMismatches: summary.categoryMismatches.length
    });
    console.table(summary.complaintTypeDistribution);
    console.table(summary.confidenceHistogram);
    return summary;
}

export async function stressTestAnalyzer(numReviews = 2000) {
    console.log(`\n--- Starting Stress Test: ${numReviews} Reviews ---`);

    let memBefore = null;
    if (typeof performance !== 'undefined' && performance.memory) {
        memBefore = performance.memory.usedJSHeapSize;
    }

    const analyzer = new ReviewAnalyzer();
    const reviews = [];
    const sampleTexts = [
        'Great product but shipping was slow.',
        'Battery life could be better.',
        'I expected more from the camera.',
        'I wish support replied faster.',
        'The previous version was smoother.',
        'Love the design and it works perfectly.'
    ];

    for (let i = 0; i < numReviews; i++) {
        reviews.push({ id: `stress-${i}`, text: sampleTexts[i % sampleTexts.length] });
    }

    let totalTimeMs = 0;
    let peakProcessingTime = 0;
    const chunkSize = 100;
    let currentIndex = 0;

    return new Promise(resolve => {
        const processChunk = () => {
            const end = Math.min(currentIndex + chunkSize, numReviews);
            const chunkStart = typeof performance !== 'undefined' ? performance.now() : Date.now();

            for (; currentIndex < end; currentIndex++) {
                const itemStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
                analyzer.safeAnalyze(reviews[currentIndex]);
                const itemTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - itemStart;
                if (itemTime > peakProcessingTime) peakProcessingTime = itemTime;
            }

            totalTimeMs += (typeof performance !== 'undefined' ? performance.now() : Date.now()) - chunkStart;
            const percent = Math.round((currentIndex / numReviews) * 100);
            console.log(`[Stress Test] Progress ${percent}% (${currentIndex}/${numReviews})`);

            if (currentIndex < numReviews) {
                if (typeof requestIdleCallback !== 'undefined') {
                    requestIdleCallback(processChunk, { timeout: 100 });
                } else {
                    setTimeout(processChunk, 10);
                }
                return;
            }

            if (typeof performance !== 'undefined' && performance.memory && memBefore !== null) {
                const memAfter = performance.memory.usedJSHeapSize;
                const diffMB = ((memAfter - memBefore) / 1024 / 1024).toFixed(2);
                console.log(`Memory change: ~${diffMB} MB`);
            }

            const avgTimePerReview = totalTimeMs / numReviews;
            const summary = {
                totalReviews: numReviews,
                totalTimeMs: Number(totalTimeMs.toFixed(2)),
                avgTimePerReview: Number(avgTimePerReview.toFixed(4)),
                peakProcessingTime: Number(peakProcessingTime.toFixed(4)),
                performanceGrade: avgTimePerReview < 1 ? 'Excellent' : avgTimePerReview < 3 ? 'Good' : 'Needs Optimization'
            };

            console.log('--- Stress Test Results ---');
            console.table(summary);
            resolve(summary);
        };

        processChunk();
    });
}

export function runEdgeCaseTests() {
    console.log('\n--- Starting Edge Case Suite ---');
    const analyzer = new ReviewAnalyzer();
    const cases = [
        { name: 'Empty string', input: '' },
        { name: 'Null input', input: null },
        { name: 'Whitespace only', input: '   \n  \t  ' },
        { name: 'Emoji only', input: '????????' },
        { name: 'All caps review', input: 'GREAT BUT IT CRASHES' },
        { name: 'Repeated conjunctions', input: 'but but but but however although' },
        { name: 'HTML-like text', input: '<script>alert(1)</script> but it fails' }
    ];

    let passed = 0;
    let failed = 0;

    cases.forEach(testCase => {
        const result = analyzer.safeAnalyze({ text: testCase.input });
        if (result && typeof result.category === 'string' && typeof result.confidence_score === 'number') {
            passed += 1;
        } else {
            failed += 1;
        }
    });

    const summary = {
        totalTests: cases.length,
        passed,
        failed,
        crashes: 0
    };

    console.log('--- Edge Case Suite Results ---');
    console.table(summary);
    return summary;
}

export function auditAccuracy() {
    return printCuratedEvaluation(evaluateCuratedSuite());
}

