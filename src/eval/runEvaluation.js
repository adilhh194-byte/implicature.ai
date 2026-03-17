import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ReviewAnalyzer } from '../services/reviewAnalyzer.js';

export const FAMILY_BUCKETS = [
    'explicit_contrast',
    'exception',
    'concessive_front',
    'expectation_failure',
    'comparison_regression',
    'wish_or_counterfactual',
    'preference_avoidance',
    'soft_dissatisfaction',
    'direct_complaint'
];

const CONCESSIVE_FRONT_REGEX = /\b(?:even though|despite|despite the fact that|in spite of|regardless of?)\b/i;
const LEADING_ID_ARTIFACT_REGEX = /^\s*(?:row|review|record|entry|id)?\s*[:#-]?\s*\d+\s*[,;|:-]/i;
const QUOTE_ARTIFACT_REGEX = /(?:^\s*["'`])|(?:["'`]\s*$)|\\["']/;
const BROKEN_BOUNDARY_REGEX = /(?:^[,;:-]+)|(?:[,;:-]+$)|(?:^\s*(?:but|however|although|though|yet|still|except|despite)\s*$)/i;

function toPercent(value) {
    return Number((value * 100).toFixed(1));
}

function safeDivide(numerator, denominator) {
    if (!denominator) {
        return 0;
    }

    return numerator / denominator;
}

function normalizeText(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[^a-z0-9\s]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(text) {
    const normalized = normalizeText(text);
    return normalized ? normalized.split(' ') : [];
}

function computeTokenOverlap(goldSpan, predictedSpan) {
    const goldTokens = tokenize(goldSpan);
    const predictedTokens = tokenize(predictedSpan);

    if (goldTokens.length === 0 || predictedTokens.length === 0) {
        return {
            precision: 0,
            recall: 0,
            f1: 0,
            exactMatch: normalizeText(goldSpan) === normalizeText(predictedSpan)
        };
    }

    const goldCounts = goldTokens.reduce((counts, token) => {
        counts[token] = (counts[token] || 0) + 1;
        return counts;
    }, {});

    let overlap = 0;
    predictedTokens.forEach(token => {
        if (goldCounts[token]) {
            overlap += 1;
            goldCounts[token] -= 1;
        }
    });

    const precision = safeDivide(overlap, predictedTokens.length);
    const recall = safeDivide(overlap, goldTokens.length);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    return {
        precision: Number(precision.toFixed(3)),
        recall: Number(recall.toFixed(3)),
        f1: Number(f1.toFixed(3)),
        exactMatch: normalizeText(goldSpan) === normalizeText(predictedSpan)
    };
}

function inferFamilyBucket(complaintType, text = '', evidenceSignals = []) {
    switch (complaintType) {
    case 'EXCEPTION_COMPLAINT':
        return 'exception';
    case 'EXPECTATION_FAILURE':
        return 'expectation_failure';
    case 'NEGATIVE_COMPARISON':
        return 'comparison_regression';
    case 'WISH_REQUEST':
        return 'wish_or_counterfactual';
    case 'PREFERENCE_AVOIDANCE':
        return 'preference_avoidance';
    case 'SOFT_DISSATISFACTION':
        return 'soft_dissatisfaction';
    case 'DIRECT_COMPLAINT':
        return 'direct_complaint';
    case 'EXPLICIT_CONTRAST': {
        const evidenceText = `${text} ${(evidenceSignals || []).join(' ')}`;
        return CONCESSIVE_FRONT_REGEX.test(evidenceText) || /CONCESSIVE_PATTERN:/i.test(evidenceText)
            ? 'concessive_front'
            : 'explicit_contrast';
    }
    default:
        return 'unmapped';
    }
}

function isMalformedExtraction(result) {
    if (!result?.has_hidden_complaint) {
        return false;
    }

    const complaintText = String(result.complaint_text || '');
    if (!complaintText.trim()) {
        return true;
    }

    return LEADING_ID_ARTIFACT_REGEX.test(complaintText)
        || QUOTE_ARTIFACT_REGEX.test(complaintText)
        || BROKEN_BOUNDARY_REGEX.test(complaintText);
}

function createEmptyFamilyBreakdown() {
    return Object.fromEntries(FAMILY_BUCKETS.map(bucket => [bucket, {
        support: 0,
        detected: 0,
        familyMatched: 0,
        recall: 0,
        familyRecall: 0,
        averageSpanF1: 0
    }]));
}

function average(values) {
    if (!values.length) {
        return 0;
    }

    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));
}

function buildWorstMisses(caseResults) {
    const falseNegatives = caseResults
        .filter(item => item.gold.has_hidden_complaint && !item.result.has_hidden_complaint)
        .map(item => ({
            id: item.gold.id,
            family: item.expectedFamily,
            review: item.gold.review,
            goldSpan: item.gold.gold_span,
            expectedCategory: item.gold.category
        }));

    const falsePositives = caseResults
        .filter(item => !item.gold.has_hidden_complaint && item.result.has_hidden_complaint)
        .map(item => ({
            id: item.gold.id,
            review: item.gold.review,
            predictedSpan: item.result.complaint_text,
            predictedCategory: item.result.category,
            predictedFamily: item.predictedFamily,
            confidence: item.result.confidence
        }));

    const poorOverlaps = caseResults
        .filter(item => item.gold.has_hidden_complaint && item.result.has_hidden_complaint)
        .filter(item => item.span.f1 < 0.5)
        .sort((left, right) => left.span.f1 - right.span.f1)
        .slice(0, 8)
        .map(item => ({
            id: item.gold.id,
            family: item.expectedFamily,
            review: item.gold.review,
            goldSpan: item.gold.gold_span,
            predictedSpan: item.result.complaint_text,
            spanF1: item.span.f1,
            predictedCategory: item.result.category,
            expectedCategory: item.gold.category
        }));

    return {
        falseNegatives: falseNegatives.slice(0, 8),
        falsePositives: falsePositives.slice(0, 8),
        poorOverlaps
    };
}

function createMarkdownTable(headers, rows) {
    const headerRow = `| ${headers.join(' | ')} |`;
    const dividerRow = `| ${headers.map(() => '---').join(' | ')} |`;
    const bodyRows = rows.map(row => `| ${row.join(' | ')} |`);
    return [headerRow, dividerRow, ...bodyRows].join('\n');
}

function formatExampleList(items, formatter) {
    if (!items.length) {
        return '- None';
    }

    return items.map((item, index) => `- ${index + 1}. ${formatter(item)}`).join('\n');
}

export function generateEvaluationReportMarkdown(summary) {
    const familyRows = FAMILY_BUCKETS.map(bucket => {
        const entry = summary.familyBreakdown[bucket];
        return [
            bucket,
            String(entry.support),
            String(entry.detected),
            `${toPercent(entry.recall)}%`,
            `${toPercent(entry.familyRecall)}%`,
            entry.averageSpanF1.toFixed(3)
        ];
    });

    const overviewRows = [
        ['Gold reviews', String(summary.totalReviews)],
        ['Positive hidden complaints', String(summary.positiveReviews)],
        ['Predicted complaints', String(summary.predictedComplaints)],
        ['Precision', `${toPercent(summary.detection.precision)}%`],
        ['Recall', `${toPercent(summary.detection.recall)}%`],
        ['F1', `${toPercent(summary.detection.f1)}%`],
        ['Average span F1 (all positives)', summary.span.averagePositiveSpanF1.toFixed(3)],
        ['Average span F1 (detected positives)', summary.span.averageDetectedSpanF1.toFixed(3)],
        ['Category accuracy', `${toPercent(summary.category.accuracy)}%`],
        ['Malformed extractions', String(summary.malformedExtractionCount)]
    ];

    return [
        '# Analyzer Evaluation Report',
        '',
        `Generated: ${summary.generatedAt}`,
        '',
        '## Overview',
        '',
        createMarkdownTable(['Metric', 'Value'], overviewRows),
        '',
        '## Detection Breakdown',
        '',
        createMarkdownTable(['Metric', 'Count'], [
            ['True positives', String(summary.detection.truePositives)],
            ['False positives', String(summary.detection.falsePositives)],
            ['False negatives', String(summary.detection.falseNegatives)],
            ['True negatives', String(summary.detection.trueNegatives)]
        ]),
        '',
        '## Category And Family',
        '',
        createMarkdownTable(['Family', 'Support', 'Detected', 'Recall', 'Family Recall', 'Avg Span F1'], familyRows),
        '',
        '## Worst Misses',
        '',
        '### False Negatives',
        '',
        formatExampleList(summary.worstMisses.falseNegatives, item => `[
${item.id}] family=${item.family} category=${item.expectedCategory} review="${item.review}" gold_span="${item.goldSpan}"`.replace(/\n/g, ' ')),
        '',
        '### False Positives',
        '',
        formatExampleList(summary.worstMisses.falsePositives, item => `[
${item.id}] predicted_family=${item.predictedFamily} predicted_category=${item.predictedCategory} confidence=${item.confidence} review="${item.review}" predicted_span="${item.predictedSpan}"`.replace(/\n/g, ' ')),
        '',
        '### Lowest Span Overlaps',
        '',
        formatExampleList(summary.worstMisses.poorOverlaps, item => `[
${item.id}] family=${item.family} span_f1=${item.spanF1.toFixed(3)} gold_span="${item.goldSpan}" predicted_span="${item.predictedSpan}"`.replace(/\n/g, ' ')),
        '',
        '## Debug Notes',
        '',
        '- This harness is hidden-complaint focused: recall on positive gold reviews is treated as the primary success metric.',
        '- Family recall requires both complaint detection and the correct complaint-family bucket.',
        '- Malformed extraction count flags artifacts like row-id prefixes, dangling quotes, or broken clause boundaries in extracted complaint text.'
    ].join('\n');
}

export function evaluateGoldReviews(goldRows, analyzer = new ReviewAnalyzer()) {
    const safeRows = Array.isArray(goldRows) ? goldRows : [];
    const caseResults = safeRows.map(gold => {
        const result = analyzer.safeAnalyze({ id: gold.id, text: gold.review });
        const span = computeTokenOverlap(gold.gold_span, result.complaint_text);
        const expectedFamily = gold.has_hidden_complaint
            ? inferFamilyBucket(gold.complaint_type, gold.review)
            : null;
        const predictedFamily = result.has_hidden_complaint
            ? inferFamilyBucket(result.complaint_type, result.complaint_text, result.evidence_signals)
            : null;

        return {
            gold,
            result,
            span,
            expectedFamily,
            predictedFamily,
            malformedExtraction: isMalformedExtraction(result)
        };
    });

    const truePositives = caseResults.filter(item => item.gold.has_hidden_complaint && item.result.has_hidden_complaint).length;
    const falsePositives = caseResults.filter(item => !item.gold.has_hidden_complaint && item.result.has_hidden_complaint).length;
    const falseNegatives = caseResults.filter(item => item.gold.has_hidden_complaint && !item.result.has_hidden_complaint).length;
    const trueNegatives = caseResults.filter(item => !item.gold.has_hidden_complaint && !item.result.has_hidden_complaint).length;
    const positiveCases = caseResults.filter(item => item.gold.has_hidden_complaint);
    const detectedPositiveCases = positiveCases.filter(item => item.result.has_hidden_complaint);

    const familyBreakdown = createEmptyFamilyBreakdown();
    FAMILY_BUCKETS.forEach(bucket => {
        const bucketCases = positiveCases.filter(item => item.expectedFamily === bucket);
        const detected = bucketCases.filter(item => item.result.has_hidden_complaint);
        const familyMatched = bucketCases.filter(item => item.predictedFamily === bucket);

        familyBreakdown[bucket] = {
            support: bucketCases.length,
            detected: detected.length,
            familyMatched: familyMatched.length,
            recall: safeDivide(detected.length, bucketCases.length),
            familyRecall: safeDivide(familyMatched.length, bucketCases.length),
            averageSpanF1: average(detected.map(item => item.span.f1))
        };
    });

    const categoryCorrect = positiveCases.filter(item => item.result.has_hidden_complaint && item.result.category === item.gold.category).length;
    const malformedCases = caseResults.filter(item => item.malformedExtraction);

    const summary = {
        generatedAt: new Date().toISOString(),
        totalReviews: safeRows.length,
        positiveReviews: positiveCases.length,
        predictedComplaints: caseResults.filter(item => item.result.has_hidden_complaint).length,
        detection: {
            truePositives,
            falsePositives,
            falseNegatives,
            trueNegatives,
            precision: Number(safeDivide(truePositives, truePositives + falsePositives).toFixed(3)),
            recall: Number(safeDivide(truePositives, truePositives + falseNegatives).toFixed(3)),
            f1: Number((() => {
                const precision = safeDivide(truePositives, truePositives + falsePositives);
                const recall = safeDivide(truePositives, truePositives + falseNegatives);
                return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
            })().toFixed(3))
        },
        span: {
            averagePositiveSpanF1: average(positiveCases.map(item => item.span.f1)),
            averageDetectedSpanF1: average(detectedPositiveCases.map(item => item.span.f1)),
            exactSpanMatchRate: Number(safeDivide(
                positiveCases.filter(item => item.span.exactMatch && item.result.has_hidden_complaint).length,
                positiveCases.length
            ).toFixed(3))
        },
        category: {
            correct: categoryCorrect,
            accuracy: Number(safeDivide(categoryCorrect, positiveCases.length).toFixed(3))
        },
        familyBreakdown,
        malformedExtractionCount: malformedCases.length,
        malformedExtractions: malformedCases.map(item => ({
            id: item.gold.id,
            review: item.gold.review,
            predictedSpan: item.result.complaint_text,
            predictedFamily: item.predictedFamily,
            confidence: item.result.confidence
        })),
        worstMisses: buildWorstMisses(caseResults),
        caseResults: caseResults.map(item => ({
            id: item.gold.id,
            review: item.gold.review,
            goldComplaint: item.gold.has_hidden_complaint,
            predictedComplaint: item.result.has_hidden_complaint,
            goldSpan: item.gold.gold_span,
            predictedSpan: item.result.complaint_text,
            goldCategory: item.gold.category,
            predictedCategory: item.result.category,
            goldFamily: item.expectedFamily,
            predictedFamily: item.predictedFamily,
            complaintType: item.result.complaint_type,
            confidence: item.result.confidence,
            spanF1: item.span.f1,
            malformedExtraction: item.malformedExtraction
        }))
    };

    return summary;
}

export async function loadGoldReviews(goldPath = new URL('./gold_reviews.json', import.meta.url)) {
    const content = await fs.readFile(goldPath, 'utf8');
    return JSON.parse(content);
}

export async function writeEvaluationArtifacts(summary, options = {}) {
    const evalDir = options.evalDir || path.dirname(fileURLToPath(import.meta.url));
    const markdownPath = options.markdownPath || path.join(evalDir, 'evaluationReport.md');
    const summaryPath = options.summaryPath || path.join(evalDir, 'evaluationSummary.json');
    const markdown = generateEvaluationReportMarkdown(summary);

    await fs.writeFile(markdownPath, markdown, 'utf8');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');

    return {
        markdownPath,
        summaryPath,
        markdown
    };
}

export async function runEvaluation(options = {}) {
    const goldRows = await loadGoldReviews(options.goldPath);
    const analyzer = options.analyzer || new ReviewAnalyzer();
    const summary = evaluateGoldReviews(goldRows, analyzer);
    const artifacts = await writeEvaluationArtifacts(summary, options);

    return {
        summary,
        artifacts
    };
}

function printConsoleSummary(summary, artifacts) {
    console.log('\n--- Analyzer Evaluation ---');
    console.table({
        totalReviews: summary.totalReviews,
        positiveReviews: summary.positiveReviews,
        predictedComplaints: summary.predictedComplaints,
        precision: `${toPercent(summary.detection.precision)}%`,
        recall: `${toPercent(summary.detection.recall)}%`,
        f1: `${toPercent(summary.detection.f1)}%`,
        avgSpanF1: summary.span.averagePositiveSpanF1,
        categoryAccuracy: `${toPercent(summary.category.accuracy)}%`,
        malformedExtractionCount: summary.malformedExtractionCount
    });

    console.log('\nFamily Recall');
    console.table(Object.fromEntries(
        FAMILY_BUCKETS.map(bucket => [bucket, {
            support: summary.familyBreakdown[bucket].support,
            recall: `${toPercent(summary.familyBreakdown[bucket].recall)}%`,
            familyRecall: `${toPercent(summary.familyBreakdown[bucket].familyRecall)}%`,
            avgSpanF1: summary.familyBreakdown[bucket].averageSpanF1
        }])
    ));

    console.log('\nWorst False Negatives');
    summary.worstMisses.falseNegatives.slice(0, 5).forEach(item => {
        console.log(`- ${item.id} [${item.family}] ${item.review}`);
    });

    console.log('\nWorst False Positives');
    summary.worstMisses.falsePositives.slice(0, 5).forEach(item => {
        console.log(`- ${item.id} [${item.predictedFamily}] ${item.predictedSpan}`);
    });

    console.log(`\nWrote report: ${artifacts.markdownPath}`);
    console.log(`Wrote summary: ${artifacts.summaryPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    runEvaluation()
        .then(({ summary, artifacts }) => {
            printConsoleSummary(summary, artifacts);
        })
        .catch(error => {
            console.error('Evaluation run failed:', error);
            process.exitCode = 1;
        });
}
