import exportedModel from './exported_candidate_reranker.json' with { type: 'json' };

function sigmoid(value) {
    return 1 / (1 + Math.exp(-value));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function tokenize(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 40);
}

function extractCharNgrams(text) {
    const normalized = (text || '').toLowerCase().replace(/\s+/g, ' ');
    const grams = [];
    for (let size = 3; size <= 5; size += 1) {
        for (let index = 0; index <= normalized.length - size; index += 1) {
            grams.push(normalized.slice(index, index + size));
        }
    }
    return grams;
}

function toSparseFeatureMap(features) {
    const sparse = {};
    const numeric = features?.numeric || {};
    const boolean = features?.boolean || {};
    const categorical = features?.categorical || {};

    Object.entries(numeric).forEach(([key, value]) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
            sparse[`num:${key}`] = value;
        }
    });

    Object.entries(boolean).forEach(([key, value]) => {
        sparse[`bool:${key}`] = value ? 1 : 0;
    });

    Object.entries(categorical).forEach(([key, value]) => {
        if (typeof value === 'string' && value) {
            sparse[`cat:${key}=${value}`] = 1;
        }
    });

    const candidateText = categorical.candidate_text || '';
    tokenize(candidateText).forEach(token => {
        sparse[`tok:${token}`] = (sparse[`tok:${token}`] || 0) + 1;
    });

    extractCharNgrams(candidateText).forEach(gram => {
        sparse[`char:${gram}`] = (sparse[`char:${gram}`] || 0) + 1;
    });

    return sparse;
}

function getWeight(model, featureKey) {
    if (featureKey.startsWith('tok:')) {
        return model.token_weights?.[featureKey.slice(4)] || 0;
    }

    if (featureKey.startsWith('char:')) {
        return model.char_ngram_weights?.[featureKey.slice(5)] || 0;
    }

    return model.feature_weights?.[featureKey] || 0;
}

export function predictCandidateScore(features, model = exportedModel) {
    const sparse = toSparseFeatureMap(features);
    const contributions = [];
    let rawScore = model.intercept || 0;

    Object.entries(sparse).forEach(([featureKey, value]) => {
        const weight = getWeight(model, featureKey);
        if (!weight || !value) {
            return;
        }

        const contribution = weight * value;
        rawScore += contribution;
        contributions.push({
            feature: featureKey,
            value,
            weight: Number(weight.toFixed(4)),
            contribution: Number(contribution.toFixed(4))
        });
    });

    contributions.sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution));
    const probability = sigmoid(rawScore);

    return {
        rawScore: Number(rawScore.toFixed(4)),
        probability: Number(clamp(probability, 0, 1).toFixed(4)),
        topContributors: contributions.slice(0, 8),
        featureCount: contributions.length,
        modelVersion: model.version || 'unknown'
    };
}

export function getDefaultCandidateRerankerModel() {
    return exportedModel;
}

export { exportedModel as EXPORTED_CANDIDATE_RERANKER_MODEL };
