import { COMPLAINT_TYPE_PRECEDENCE } from './complaintSelector.js';
import { predictCandidateScore } from '../ml/candidateReranker.js';

const RULE_WEIGHTS = {
    exception: 4.4,
    expectation: 4.6,
    comparison: 3.8,
    wish: 3.6,
    direct: 3.3,
    concessive: 2.4,
    preference: 3.2,
    soft: 2.3,
    praiseOnly: -2.6,
    malformedArtifact: -3.5,
    shortFragment: -1.8,
    aspectBonus: 0.6,
    rightClauseBonus: 0.5
};

function sigmoid(value) {
    return 1 / (1 + Math.exp(-value));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function deriveComplaintType(features) {
    const categorical = features?.categorical || {};
    const boolean = features?.boolean || {};

    if (categorical.likely_complaint_type) {
        return categorical.likely_complaint_type;
    }

    const matched = [];
    if (boolean.contains_exception_marker) matched.push('EXCEPTION_COMPLAINT');
    if (boolean.contains_expectation_pattern) matched.push('EXPECTATION_FAILURE');
    if (boolean.contains_wish_counterfactual_pattern) matched.push('WISH_REQUEST');
    if (boolean.contains_comparison_pattern) matched.push('NEGATIVE_COMPARISON');
    if (boolean.contains_preference_avoidance_pattern) matched.push('PREFERENCE_AVOIDANCE');
    if (boolean.contains_soft_dissatisfaction) matched.push('SOFT_DISSATISFACTION');
    if (boolean.contains_contrast_marker || boolean.contains_concessive_front) matched.push('EXPLICIT_CONTRAST');
    if (boolean.contains_direct_negative_cue) matched.push('DIRECT_COMPLAINT');

    return COMPLAINT_TYPE_PRECEDENCE.find(type => matched.includes(type)) || null;
}

function hasSubstantiveComplaintEvidence(boolean = {}) {
    return Boolean(
        boolean.contains_exception_marker
        || boolean.contains_expectation_pattern
        || boolean.contains_comparison_pattern
        || boolean.contains_wish_counterfactual_pattern
        || boolean.contains_preference_avoidance_pattern
        || boolean.contains_soft_dissatisfaction
        || boolean.contains_direct_negative_cue
    );
}

export function scoreCandidateRuleBased(features) {
    const numeric = features?.numeric || {};
    const boolean = features?.boolean || {};
    const reasons = [];
    let ruleScore = 0;

    if (boolean.contains_exception_marker) {
        ruleScore += RULE_WEIGHTS.exception;
        reasons.push('exception marker strongly supports a complaint span');
    }
    if (boolean.contains_expectation_pattern) {
        ruleScore += RULE_WEIGHTS.expectation;
        reasons.push('expectation failure indicates under-delivery');
    }
    if (boolean.contains_comparison_pattern) {
        ruleScore += RULE_WEIGHTS.comparison;
        reasons.push('negative comparison suggests regression or inferior performance');
    }
    if (boolean.contains_wish_counterfactual_pattern) {
        ruleScore += RULE_WEIGHTS.wish;
        reasons.push('wish/counterfactual phrasing points to a desired fix');
    }
    if (boolean.contains_direct_negative_cue) {
        ruleScore += RULE_WEIGHTS.direct + (numeric.negative_cue_count || 0) * 0.25;
        reasons.push('direct negative cues name a concrete issue');
    }
    if (boolean.contains_contrast_marker || boolean.contains_concessive_front) {
        ruleScore += RULE_WEIGHTS.concessive;
        reasons.push('contrast/concessive structure often introduces the complaint span');
    }
    if (boolean.contains_preference_avoidance_pattern) {
        ruleScore += RULE_WEIGHTS.preference;
        reasons.push('preference/avoidance language implies reluctance to keep using the product');
    }
    if (boolean.contains_soft_dissatisfaction) {
        ruleScore += RULE_WEIGHTS.soft;
        reasons.push('soft dissatisfaction provides indirect complaint evidence');
    }
    if (boolean.contains_aspect_keyword) {
        ruleScore += RULE_WEIGHTS.aspectBonus + Math.min((numeric.aspect_count || 0) * 0.2, 0.8);
        reasons.push('aspect keywords anchor the complaint to a product target');
    }
    if (boolean.appears_in_right_clause || boolean.starts_after_marker) {
        ruleScore += RULE_WEIGHTS.rightClauseBonus;
        reasons.push('candidate appears in the likely complaint-bearing side of the sentence');
    }

    const structuralOnly = !hasSubstantiveComplaintEvidence(boolean)
        && (boolean.contains_contrast_marker || boolean.contains_concessive_front);

    if (boolean.contains_praise_cue && (numeric.complaint_signal_count || 0) == 0) {
        ruleScore += RULE_WEIGHTS.praiseOnly - Math.min((numeric.praise_cue_count || 0) * 0.2, 0.6);
        reasons.push('praise-only span lowers complaint likelihood');
    } else if (boolean.contains_praise_cue && structuralOnly) {
        ruleScore += RULE_WEIGHTS.praiseOnly - Math.min((numeric.praise_cue_count || 0) * 0.15, 0.45);
        reasons.push('positive span with only structural complaint evidence is heavily discounted');
    }

    if (boolean.quote_artifact_present || boolean.csv_id_artifact_present) {
        const artifactPenalty = RULE_WEIGHTS.malformedArtifact
            + (boolean.csv_id_artifact_present ? -0.8 : 0)
            + (boolean.quote_artifact_present ? -0.2 : 0);
        ruleScore += artifactPenalty;
        reasons.push('parser or source artifacts reduce candidate quality');
    }
    if ((numeric.candidate_length_tokens || 0) <= 1) {
        ruleScore += RULE_WEIGHTS.shortFragment;
        reasons.push('extremely short fragment is unlikely to be a stable complaint span');
    } else if ((numeric.candidate_length_tokens || 0) <= 2 && (numeric.complaint_signal_count || 0) === 0) {
        ruleScore -= 1;
        reasons.push('tiny fragment without complaint evidence is penalized');
    }

    const complaintType = deriveComplaintType(features);
    return {
        ruleScore: Number(ruleScore.toFixed(2)),
        reasons,
        complaintType
    };
}

export function scoreCandidateHybrid(features, mlModel = null) {
    const ruleResult = scoreCandidateRuleBased(features);
    const boolean = features?.boolean || {};
    const malformed = boolean.csv_id_artifact_present || boolean.quote_artifact_present;
    const mlPrediction = mlModel === null
        ? predictCandidateScore(features)
        : mlModel
            ? predictCandidateScore(features, mlModel)
            : null;

    const mlScore = mlPrediction ? mlPrediction.probability : null;
    const mlRawScore = mlPrediction ? mlPrediction.rawScore : null;

    let finalScore = ruleResult.ruleScore;
    if (typeof mlScore === 'number') {
        const mlNudge = (mlScore - 0.5) * (malformed ? 0.7 : 1.2);
        finalScore = ruleResult.ruleScore + mlNudge;
    }

    // Strong linguistic evidence stays in control unless the span is malformed.
    if (!malformed && ruleResult.ruleScore >= 3) {
        finalScore = Math.max(finalScore, ruleResult.ruleScore * 0.95);
    }

    const confidenceBase = sigmoid(finalScore / 3.4);
    const confidence = Number(clamp(
        confidenceBase - (malformed ? 0.18 : 0),
        0,
        1
    ).toFixed(2));

    const reasons = [...ruleResult.reasons];
    if (typeof mlScore === 'number') {
        reasons.push('final score uses rule score as the base and applies only a bounded ML rerank nudge');
        reasons.push(`ML score ${mlScore.toFixed(2)} from ${mlPrediction.featureCount} contributing features`);
        mlPrediction.topContributors.slice(0, 4).forEach(item => {
            reasons.push(`ML contributor ${item.feature}=${item.contribution.toFixed(2)}`);
        });
    } else {
        reasons.push('no ML model loaded, using rule-only score');
    }

    return {
        ruleScore: ruleResult.ruleScore,
        mlScore: typeof mlScore === 'number' ? Number(mlScore.toFixed(2)) : null,
        finalScore: Number(finalScore.toFixed(2)),
        confidence,
        reasons,
        complaintType: ruleResult.complaintType,
        mlDebug: mlPrediction
            ? {
                rawScore: mlRawScore,
                topContributors: mlPrediction.topContributors,
                modelVersion: mlPrediction.modelVersion
            }
            : null
    };
}
