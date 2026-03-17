import { ASPECT_KEYWORD_GROUPS } from '../lexicons/aspectKeywords.js';

const CATEGORY_PHRASES = {
    Battery: ['weak battery life', 'short battery life', 'fast battery drain', 'poor battery life'],
    Charging: ['slow charging', 'charging issue', 'does not charge', 'will not charge', 'charge problem'],
    Performance: ['performance regression', 'update regression', 'slow performance', 'slow app performance', 'slow search'],
    Bug: ['buggy performance', 'unfixed bugs', 'software bug', 'crashing app', 'not working'],
    Reliability: ['reliability regression', 'unreliable connection', 'intermittent failure'],
    Quality: ['quality below expectations', 'cheap build quality', 'damaged product', 'poor quality', 'underwhelming quality'],
    Durability: ['peeling finish', 'poor durability', 'wears out quickly', 'wrinkles easily'],
    Shipping: ['slow shipping', 'shipping delay', 'shipping took forever'],
    Delivery: ['late delivery', 'damaged package', 'missing item', 'wrong item'],
    Support: ['slow support response', 'poor support', 'support issue', 'customer support'],
    Documentation: ['poor documentation', 'unclear instructions', 'missing documentation'],
    Price: ['high price', 'too expensive', 'overpriced', 'hidden fees'],
    Value: ['poor value', 'not worth it', 'bad value for money'],
    Camera: ['camera underperforms', 'poor camera', 'blurry photos'],
    Audio: ['poor audio', 'weak speaker', 'bad microphone'],
    'UI/UX': ['confusing interface', 'clunky interface', 'glitchy checkout', 'bad navigation'],
    Connectivity: ['poor connectivity', 'wifi issue', 'bluetooth issue', 'signal drop'],
    Sizing: ['wrong size', 'runs small', 'runs large', 'poor fit'],
    Features: ['notification issue', 'broken notifications', 'missing features', 'limited features'],
    Compatibility: ['compatibility issue', 'browser compatibility', 'not compatible', 'poor browser experience'],
    Service: ['poor service', 'rude service', 'rude staff', 'bad installation service'],
    Other: []
};

const CATEGORY_PRIORITY = {
    Charging: 1,
    Battery: 2,
    Shipping: 3,
    Delivery: 4,
    Support: 5,
    Service: 6,
    Documentation: 7,
    Price: 8,
    Value: 9,
    Camera: 10,
    Audio: 11,
    Connectivity: 12,
    Compatibility: 13,
    Sizing: 14,
    Features: 15,
    'UI/UX': 16,
    Reliability: 17,
    Bug: 18,
    Durability: 19,
    Quality: 20,
    Performance: 21,
    Other: 99
};

const CATEGORY_CONTEXT_PATTERNS = {
    Battery: [
        { label: 'battery life', regex: /\bbattery life\b/i, weight: 3 },
        { label: 'battery drain', regex: /\b(?:battery|power).*(?:drain|dies fast|runs out)\b|\bfast battery drain\b/i, weight: 3 }
    ],
    Charging: [
        { label: 'charging failure', regex: /\b(?:will not charge|does not charge|not charging|charge problem|charging issue|charges? slowly)\b/i, weight: 4 },
        { label: 'charger', regex: /\bcharger\b|\bcharging port\b/i, weight: 2 }
    ],
    Performance: [
        { label: 'slow performance', regex: /\b(?:slow performance|slow app|slow search|slow startup|too slow to start|too slow to load|loading slowly|performance regression|update regression)\b/i, weight: 4 },
        { label: 'regression', regex: /\b(?:old|previous) version\b.*\b(?:smoother|faster|better)\b/i, weight: 3 }
    ],
    Bug: [
        { label: 'bug issue', regex: /\b(?:bug|bugs|buggy|glitch|glitchy|error|errors|freeze|crash|crashing|unfixed bugs)\b/i, weight: 4 }
    ],
    Reliability: [
        { label: 'reliability issue', regex: /\b(?:reliability regression|unreliable|intermittent|keeps disconnecting|random disconnects|unstable)\b/i, weight: 4 }
    ],
    Quality: [
        { label: 'damaged product', regex: /\b(?:damaged product|defective product|product inside is damaged|item is damaged|quality below expectations|underwhelming quality)\b/i, weight: 4 },
        { label: 'cheap build quality', regex: /\b(?:cheap build quality|poor quality|flimsy|cheap material|feels cheap)\b/i, weight: 3 }
    ],
    Durability: [
        { label: 'durability issue', regex: /\b(?:peeling finish|fell apart|wears out quickly|wrinkles easily|cracked after|tore after)\b/i, weight: 4 }
    ],
    Shipping: [
        { label: 'shipping delay', regex: /\b(?:shipping|shipment|courier|dispatch|transit)\b.*\b(?:slow|delay|late|forever|stuck)\b|\bslow shipping\b/i, weight: 4 }
    ],
    Delivery: [
        { label: 'delivery issue', regex: /\b(?:delivery|delivered|package|parcel|box|arrived)\b.*\b(?:late|missing|wrong|damaged|crushed)\b|\b(?:damaged package|late delivery|missing item|wrong item)\b/i, weight: 4 }
    ],
    Support: [
        { label: 'support response', regex: /\b(?:support|customer support|help desk|ticket)\b.*\b(?:slow|late|reply|response|unhelpful|refund)\b|\bslow support response\b/i, weight: 4 }
    ],
    Documentation: [
        { label: 'documentation issue', regex: /\b(?:documentation|docs|manual|instructions|guide|tutorial|faq)\b.*\b(?:unclear|missing|poor|outdated|confusing)\b|\bpoor documentation\b/i, weight: 4 }
    ],
    Price: [
        { label: 'price issue', regex: /\b(?:price|pricing|cost|subscription|fees)\b.*\b(?:high|too much|expensive)\b|\b(?:overpriced|high price|hidden fees)\b/i, weight: 4 }
    ],
    Value: [
        { label: 'value issue', regex: /\b(?:not worth it|poor value|bad value|for the money|for what it offers)\b/i, weight: 4 }
    ],
    Camera: [
        { label: 'camera issue', regex: /\b(?:camera|photo|photos|video|image|lens)\b.*\b(?:poor|bad|blurry|underperforms|worse)\b|\bcamera underperforms\b/i, weight: 4 }
    ],
    Audio: [
        { label: 'audio issue', regex: /\b(?:audio|sound|speaker|speakers|microphone|mic|volume)\b.*\b(?:poor|weak|low|bad|broken|quiet)\b|\bpoor audio\b/i, weight: 4 }
    ],
    'UI/UX': [
        { label: 'ui issue', regex: /\b(?:interface|navigation|layout|menu|checkout|onboarding)\b.*\b(?:confusing|clunky|awkward|glitchy|bad)\b|\b(?:confusing interface|glitchy checkout)\b/i, weight: 4 }
    ],
    Connectivity: [
        { label: 'connectivity issue', regex: /\b(?:wifi|wi-fi|bluetooth|network|signal|pairing|connection|connectivity)\b.*\b(?:drops|drop|disconnect|unstable|weak|fails|issue)\b|\bpoor connectivity\b/i, weight: 4 }
    ],
    Sizing: [
        { label: 'sizing issue', regex: /\b(?:size|sizing|fit)\b.*\b(?:wrong|off|small|big|tight|loose)\b|\b(?:runs small|runs large|poor fit)\b/i, weight: 4 }
    ],
    Features: [
        { label: 'feature issue', regex: /\b(?:notification|notifications|alert|alerts|feature|features)\b.*\b(?:missing|broken|delayed|late|limited|issue|issues)\b|\b(?:notification issue|broken notifications|missing features)\b/i, weight: 4 },
        { label: 'bare feature noun', regex: /^\s*(?:notification|notifications|feature|features)\s*$/i, weight: 3 }
    ],
    Compatibility: [
        { label: 'compatibility issue', regex: /\b(?:compatibility|browser|device|platform|android|ios)\b.*\b(?:issue|issues|problem|problems|not compatible|poor|different)\b|\bpoor browser experience\b/i, weight: 4 }
    ],
    Service: [
        { label: 'service issue', regex: /\b(?:service|staff|technician|installation|sales)\b.*\b(?:rude|poor|bad|slow|dismissive)\b|\b(?:poor service|rude staff)\b/i, weight: 4 }
    ]
};

const FALLBACK_LINEAR_MODEL = {
    Other: {
        intercept: 0.35,
        terms: {
            disappointment: 1.6,
            disappointing: 1.4,
            lacking: 1.5,
            average: 0.9,
            underwhelming: 1.1,
            'not for me': 1.8,
            'not ideal': 1.3,
            regret: 0.8,
            meh: 0.8
        }
    },
    Value: {
        intercept: 0.05,
        terms: {
            worth: 1.2,
            'for the money': 1.8,
            'for what it offers': 1.8,
            value: 1.4,
            overpriced: 1.0,
            expensive: 0.8
        }
    },
    Quality: {
        intercept: 0.05,
        terms: {
            quality: 1.5,
            flimsy: 1.2,
            cheap: 1.0,
            average: 0.6,
            damaged: 0.9
        }
    },
    Features: {
        intercept: 0.05,
        terms: {
            feature: 1.5,
            features: 1.5,
            notification: 1.6,
            notifications: 1.6,
            lacking: 0.8,
            missing: 1.0,
            limited: 0.8
        }
    },
    Compatibility: {
        intercept: 0.05,
        terms: {
            browser: 1.6,
            device: 1.1,
            platform: 1.1,
            compatible: 1.2,
            compatibility: 1.3
        }
    },
    'UI/UX': {
        intercept: 0.05,
        terms: {
            confusing: 1.0,
            clunky: 1.2,
            awkward: 1.0,
            interface: 1.2,
            navigation: 1.2,
            design: 0.3
        }
    },
    Service: {
        intercept: 0.05,
        terms: {
            service: 1.4,
            staff: 1.5,
            rude: 1.2,
            technician: 1.4
        }
    },
    Support: {
        intercept: 0.05,
        terms: {
            support: 1.5,
            response: 1.3,
            reply: 1.3,
            help: 0.6,
            refund: 0.7
        }
    }
};

function escapeForRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function sigmoid(value) {
    return 1 / (1 + Math.exp(-value));
}

function tokenize(text) {
    return (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

function findGroup(category) {
    return ASPECT_KEYWORD_GROUPS.find(entry => entry.category === category);
}

function collectPhraseMatches(lowered, category) {
    return (CATEGORY_PHRASES[category] || []).filter(phrase => lowered.includes(phrase));
}

function collectKeywordMatches(text, lowered, category) {
    const group = findGroup(category);
    return (group?.keywords || []).filter(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedKeyword.includes(' ')) {
            return lowered.includes(normalizedKeyword);
        }

        return new RegExp(`\\b${escapeForRegex(normalizedKeyword)}\\b`, 'i').test(text);
    });
}

function collectContextMatches(text, category) {
    return (CATEGORY_CONTEXT_PATTERNS[category] || [])
        .filter(rule => rule.regex.test(text))
        .map(rule => ({ label: rule.label, weight: rule.weight }));
}

function isDamagedProductQualityCase(lowered) {
    return /\b(?:damaged product|defective product|product inside is damaged|item is damaged|product arrived damaged|the product is damaged)\b/.test(lowered);
}

function isDamagedPackageDeliveryCase(lowered) {
    return /\b(?:damaged package|package arrived damaged|damaged parcel|box was crushed|parcel was crushed)\b/.test(lowered);
}

function ruleOverrideCategory(lowered) {
    if (isDamagedProductQualityCase(lowered)) {
        return 'Quality';
    }

    if (isDamagedPackageDeliveryCase(lowered)) {
        return 'Delivery';
    }

    if (/\b(?:shipping|shipment|courier|dispatch|transit)\b/.test(lowered) && /\b(?:slow|delay|late|forever|stuck)\b/.test(lowered)) {
        return 'Shipping';
    }

    if (/\b(?:delivery|delivered|arrived|package|parcel|box)\b/.test(lowered) && /\b(?:late|missing|wrong|damaged|crushed)\b/.test(lowered)) {
        return 'Delivery';
    }

    return null;
}

function collectRuleMatches(text, category) {
    const lowered = text.toLowerCase();
    const phraseMatches = collectPhraseMatches(lowered, category);
    const keywordMatches = collectKeywordMatches(text, lowered, category);
    const contextMatches = collectContextMatches(text, category);
    const score = (phraseMatches.length * 4) + (keywordMatches.length * 2) + contextMatches.reduce((sum, item) => sum + item.weight, 0);

    return {
        category,
        priority: CATEGORY_PRIORITY[category] || 99,
        score,
        matchedKeywords: [...new Set([
            ...phraseMatches,
            ...keywordMatches,
            ...contextMatches.map(item => item.label)
        ])]
    };
}

const SPECIFIC_ASPECT_CATEGORIES = new Set(['Battery', 'Charging', 'Camera', 'Audio', 'Support', 'Shipping', 'Delivery', 'Documentation', 'Connectivity', 'Sizing', 'Features', 'Compatibility']);

function hasStrongRuleEvidence(best, tokenCount) {
    if (!best || best.score <= 0) {
        return false;
    }

    const hasPhrase = (CATEGORY_PHRASES[best.category] || []).some(phrase => best.matchedKeywords.includes(phrase));
    const hasContext = (CATEGORY_CONTEXT_PATTERNS[best.category] || []).some(rule => best.matchedKeywords.includes(rule.label));

    if (hasPhrase || hasContext) {
        return true;
    }

    if (best.score >= 4 || (best.score >= 2 && best.matchedKeywords.length > 0 && tokenCount <= 3)) {
        return true;
    }

    return best.score >= 2 && best.matchedKeywords.length > 0 && SPECIFIC_ASPECT_CATEGORIES.has(best.category);
}

function toRuleConfidence(score, matchCount) {
    if (score <= 0) {
        return 0;
    }

    return Math.min(0.98, Number((0.28 + (score * 0.07) + (matchCount * 0.03)).toFixed(2)));
}

function normalizeHintCategory(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }

    return CATEGORY_PRIORITY[value] ? value : null;
}

function extractHintContributions(featureHints = {}) {
    const contributions = [];
    const hintCategory = normalizeHintCategory(
        featureHints.likelyCategoryHint || featureHints.likely_category_hint || featureHints.categoryHint || featureHints.category
    );

    if (hintCategory) {
        contributions.push({ category: hintCategory, feature: `hint:${hintCategory}`, weight: hintCategory === 'Other' ? 0.4 : 1.2 });
    }

    const evidenceSignals = Array.isArray(featureHints.evidenceSignals) ? featureHints.evidenceSignals : [];
    evidenceSignals.forEach(signal => {
        const match = /^ASPECT_CATEGORY:\s*(.+)$/i.exec(signal);
        if (!match) {
            return;
        }

        const category = normalizeHintCategory(match[1].trim());
        if (category) {
            contributions.push({ category, feature: `signal:${category}`, weight: 0.8 });
        }
    });

    return contributions;
}

function runFallbackClassifier(text, featureHints = {}) {
    const lowered = (text || '').toLowerCase().trim();
    const contributionsByCategory = Object.fromEntries(
        Object.keys(FALLBACK_LINEAR_MODEL).map(category => [category, []])
    );

    const scores = Object.fromEntries(
        Object.entries(FALLBACK_LINEAR_MODEL).map(([category, model]) => [category, model.intercept || 0])
    );

    Object.entries(FALLBACK_LINEAR_MODEL).forEach(([category, model]) => {
        Object.entries(model.terms).forEach(([term, weight]) => {
            if (lowered.includes(term)) {
                scores[category] += weight;
                contributionsByCategory[category].push({ feature: term, weight });
            }
        });
    });

    extractHintContributions(featureHints).forEach(({ category, feature, weight }) => {
        if (!(category in scores)) {
            return;
        }

        scores[category] += weight;
        contributionsByCategory[category].push({ feature, weight });
    });

    const ranked = Object.entries(scores)
        .map(([category, score]) => ({
            category,
            score,
            matchedKeywords: contributionsByCategory[category].map(item => item.feature),
            priority: CATEGORY_PRIORITY[category] || 99
        }))
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            return left.priority - right.priority;
        });

    const best = ranked[0] || { category: 'Other', score: 0.35, matchedKeywords: [] };
    const runnerUp = ranked[1] || { score: 0 };
    const confidence = clamp(
        Number((0.18 + (sigmoid(best.score) * 0.42) + ((best.score - runnerUp.score) * 0.06)).toFixed(2)),
        0.18,
        0.82
    );

    return {
        category: best.score <= 0.55 ? 'Other' : best.category,
        confidence,
        matchedKeywords: best.matchedKeywords,
        fallbackUsed: true
    };
}

export function categorizeComplaint(text, featureHints = {}) {
    if (!text || typeof text !== 'string' || !text.trim()) {
        return {
            category: 'Other',
            confidence: 0,
            matchedKeywords: [],
            fallbackUsed: false
        };
    }

    const normalized = text.trim();
    const lowered = normalized.toLowerCase();
    const overrideCategory = ruleOverrideCategory(lowered);

    if (overrideCategory) {
        const overrideMatches = collectRuleMatches(normalized, overrideCategory);
        return {
            category: overrideCategory,
            confidence: toRuleConfidence(Math.max(overrideMatches.score, 4), overrideMatches.matchedKeywords.length || 1),
            matchedKeywords: overrideMatches.matchedKeywords,
            fallbackUsed: false
        };
    }

    const tokenCount = tokenize(normalized).length;
    const ranked = ASPECT_KEYWORD_GROUPS
        .filter(group => group.category !== 'Other')
        .map(group => collectRuleMatches(normalized, group.category))
        .filter(result => result.score > 0)
        .sort((left, right) => {
            if (right.score !== left.score) {
                return right.score - left.score;
            }

            if (right.matchedKeywords.length !== left.matchedKeywords.length) {
                return right.matchedKeywords.length - left.matchedKeywords.length;
            }

            return left.priority - right.priority;
        });

    const bestRule = ranked[0];
    if (hasStrongRuleEvidence(bestRule, tokenCount)) {
        return {
            category: bestRule.category,
            confidence: toRuleConfidence(bestRule.score, bestRule.matchedKeywords.length),
            matchedKeywords: bestRule.matchedKeywords,
            fallbackUsed: false
        };
    }

    return runFallbackClassifier(normalized, featureHints);
}

export class TopicCategorizer {
    categorize(text, featureHints = {}) {
        return categorizeComplaint(text, featureHints);
    }
}

