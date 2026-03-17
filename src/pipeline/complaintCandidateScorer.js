import { extractCandidateFeatures } from './candidateFeatureExtractor.js';
import { scoreCandidateRuleBased } from './hybridComplaintScorer.js';

export function scoreComplaintCandidate(clauseObj, signalResult, normalizedReview = null) {
    const features = extractCandidateFeatures(
        {
            ...(clauseObj || {}),
            signals: Array.isArray(signalResult?.signals) ? signalResult.signals : [],
            familyHints: signalResult?.complaintTypeHints || clauseObj?.familyHints || [],
            markerFound: signalResult?.markerFound ?? clauseObj?.markerFound ?? null
        },
        normalizedReview || {
            normalized: clauseObj?.text || '',
            wordCount: typeof clauseObj?.text === 'string'
                ? clauseObj.text.trim().split(/\s+/).filter(Boolean).length
                : 0
        }
    );

    const result = scoreCandidateRuleBased(features);
    return {
        score: result.ruleScore,
        confidence: result.ruleScore <= 0 ? 0 : Math.max(0, Math.min(1, Number((((result.ruleScore + 1) / 8)).toFixed(2)))),
        reasons: result.reasons,
        complaintType: result.complaintType
    };
}
