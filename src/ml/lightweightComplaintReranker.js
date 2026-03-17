import { predictCandidateScore, EXPORTED_CANDIDATE_RERANKER_MODEL } from './candidateReranker.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function scoreFeaturesWithLinearModel(features, model = EXPORTED_CANDIDATE_RERANKER_MODEL) {
    const prediction = predictCandidateScore(features, model);
    return {
        rawScore: prediction.rawScore,
        probability: prediction.probability
    };
}

export function rerankComplaintCandidates(candidates, options = {}) {
    const model = options.model || EXPORTED_CANDIDATE_RERANKER_MODEL;

    return (Array.isArray(candidates) ? candidates : []).map(candidate => {
        const modelFeatures = candidate.modelFeatures || {
            numeric: {},
            boolean: {},
            categorical: {},
            evidenceSignals: []
        };
        const prediction = predictCandidateScore(modelFeatures, model);
        const hybridScore = Number((candidate.score + ((prediction.probability - 0.5) * 2.4)).toFixed(2));
        const hybridConfidence = Number(clamp(
            (candidate.confidence * 0.65) + (prediction.probability * 0.35),
            0,
            1
        ).toFixed(2));

        return {
            ...candidate,
            mlScore: prediction.rawScore,
            mlProbability: prediction.probability,
            hybridScore,
            confidence: hybridConfidence,
            modelFeatures: {
                ...modelFeatures,
                numeric: {
                    ...(modelFeatures.numeric || {}),
                    ml_raw_score: prediction.rawScore,
                    ml_probability: prediction.probability,
                    hybrid_score: hybridScore
                },
                categorical: {
                    ...(modelFeatures.categorical || {}),
                    reranker_model_version: prediction.modelVersion
                }
            },
            mlTopContributors: prediction.topContributors
        };
    });
}

export const LIGHTWEIGHT_RERANKER_WEIGHTS = EXPORTED_CANDIDATE_RERANKER_MODEL.feature_weights;
