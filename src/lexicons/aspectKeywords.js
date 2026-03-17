import { createPatternObject } from './patternUtils.js';

function makeAspectGroup(category, keywords, notes) {
    return {
        category,
        notes,
        keywords,
        patterns: keywords.map(keyword => createPatternObject({
            pattern: keyword,
            family: `ASPECT_${category.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
            weight: 1,
            directionHint: 'aspect',
            notes
        }))
    };
}

export const ASPECT_KEYWORD_GROUPS = [
    makeAspectGroup('Battery', ['battery', 'battery life', 'power'], 'Battery endurance and power-life complaints.'),
    makeAspectGroup('Charging', ['charging', 'charge', 'charger', 'recharge', 'charging port'], 'Charging speed and charging reliability complaints.'),
    makeAspectGroup('Performance', ['performance', 'loading', 'load time', 'startup', 'search', 'checkout', 'response time', 'update', 'version', 'latency'], 'Speed, latency, regression, and smoothness complaints.'),
    makeAspectGroup('Bug', ['bug', 'bugs', 'buggy', 'glitch', 'glitchy', 'error', 'errors', 'freeze', 'crash', 'crashing', 'crashes', 'fails', 'failure'], 'Software malfunction and defect complaints.'),
    makeAspectGroup('Reliability', ['reliability', 'reliable', 'unreliable', 'stability', 'intermittent', 'disconnect', 'dropouts'], 'Consistency and trustworthiness complaints.'),
    makeAspectGroup('Quality', ['quality', 'build quality', 'material', 'finish', 'defect', 'defective', 'damaged product'], 'Build, finish, and product quality complaints.'),
    makeAspectGroup('Durability', ['durability', 'durable', 'peeling', 'wear', 'wrinkles', 'fell apart', 'tear', 'crack'], 'Wear-and-tear and longevity complaints.'),
    makeAspectGroup('Shipping', ['shipping', 'shipment', 'courier', 'dispatch', 'transit'], 'Shipment speed and logistics complaints.'),
    makeAspectGroup('Delivery', ['delivery', 'delivered', 'package', 'parcel', 'box', 'missing item', 'wrong item', 'damaged package'], 'Delivery completion and package-condition complaints.'),
    makeAspectGroup('Support', ['support', 'customer support', 'help desk', 'ticket', 'response', 'reply', 'refund'], 'Support responsiveness and help quality complaints.'),
    makeAspectGroup('Documentation', ['documentation', 'docs', 'manual', 'instructions', 'guide', 'tutorial', 'faq'], 'Documentation clarity and completeness complaints.'),
    makeAspectGroup('Price', ['price', 'pricing', 'cost', 'overpriced', 'expensive', 'subscription', 'fees'], 'Price and billing complaints.'),
    makeAspectGroup('Value', ['value', 'worth', 'for the money', 'for what it offers'], 'Value-for-money complaints distinct from absolute price.'),
    makeAspectGroup('Camera', ['camera', 'photo', 'photos', 'video', 'image', 'lens'], 'Camera quality and capture complaints.'),
    makeAspectGroup('Audio', ['audio', 'sound', 'speaker', 'speakers', 'microphone', 'mic', 'volume'], 'Sound output and input complaints.'),
    makeAspectGroup('UI/UX', ['interface', 'navigation', 'layout', 'design', 'checkout flow', 'onboarding', 'menu'], 'Usability and interface complaints.'),
    makeAspectGroup('Connectivity', ['connectivity', 'connection', 'wifi', 'wi-fi', 'bluetooth', 'network', 'signal', 'pairing'], 'Network, pairing, and connection complaints.'),
    makeAspectGroup('Sizing', ['size', 'sizing', 'fit', 'too small', 'too big', 'runs small', 'runs large', 'small hands', 'large hands', 'hands'], 'Sizing and fit complaints.'),
    makeAspectGroup('Features', ['feature', 'features', 'notification', 'notifications', 'alert', 'alerts', 'missing feature', 'auto mode', 'manual settings', 'manual setting'], 'Missing, limited, or malfunctioning feature complaints.'),
    makeAspectGroup('Compatibility', ['compatibility', 'compatible', 'browser', 'device', 'platform', 'android', 'ios'], 'Cross-device, browser, or platform compatibility complaints.'),
    makeAspectGroup('Service', ['service', 'staff', 'technician', 'installation', 'sales', 'warranty', 'replace', 'replacement', 'replace it'], 'Human service and staff interaction complaints outside direct support workflows.'),
    makeAspectGroup('Other', ['daily use', 'travel', 'home use'], 'Fallback contextual usage cues when no strong product aspect is present.')
];

export const ASPECT_PATTERN_OBJECTS = ASPECT_KEYWORD_GROUPS.flatMap(group => group.patterns);
export const ASPECT_KEYWORDS = [...new Set(ASPECT_KEYWORD_GROUPS.flatMap(group => group.keywords))];

// These hints help keep short complaint fragments that would otherwise look too small to analyze.
export const COMPLAINT_FRAGMENT_HINTS = [
    'better',
    'slow',
    'faster',
    'expected',
    'wish',
    'needs',
    'should',
    'broken',
    'buggy',
    'not ideal',
    'too',
    'worse',
    'issue',
    'problem',
    'disappointment',
    'lacking',
    'not for me',
    ...ASPECT_KEYWORDS
];

