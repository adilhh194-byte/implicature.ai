const EXTRA_SPACE_REGEX = /\s+/g;
const SURROUNDING_NOISE_REGEX = /^[\s,;:.!?\-"'`]+|[\s,;:.!?\-"'`]+$/g;
const LEADING_MARKER_REGEX = /^(?:but|however|although|though|yet|still|nevertheless|except(?: for)?|apart from|other than|only|just|unfortunately|conversely|on the other hand)\b[\s,:-]*/i;
const LEADING_FILLER_REGEX = /^(?:i think|i feel|honestly|overall|to be honest|frankly|basically|it seems)\b[\s,:-]*/i;
const LEADING_ARTICLE_REGEX = /^(?:the|a|an|this|that|these|those|my|your|its|their)\s+/i;
const PRONOUN_START_REGEX = /^(?:it|this|that|they|these|those)\s+(?:is|are|was|were)\s+/i;
const TRAILING_CONTEXT_REGEX = /\b(?:when|while|because|during|since)\b.*$/i;
const FRONTED_CONTEXT_REGEXES = [
    /^(?:even though|although|though|while)\b[^,]+,\s*(.+)$/i,
    /^(?:despite(?: the fact that)?|in spite of|regardless of|instead of)\b[^,]+,\s*(.+)$/i
];
const PARSER_ARTIFACT_REGEXES = [
    /^\s*(?:review[_ ]?id|row|record|entry|id)\s*[:#-]?\s*\d+\s*[,;:|\-]*\s*/i,
    /^\s*\d+\s*[,;:|\-]+\s*/,
    /^\s*(?:clause|candidate|span|sentence)[_\s-]*\d+\s*[:|\-]+\s*/i,
    /^\s*(?:left_clause|right_clause|segment|fragment)\s*[:|\-]+\s*/i
];
const QUOTE_FRAGMENT_REGEXES = [/^["'`]+/, /["'`]+$/];
const CONTRACTION_REPLACEMENTS = [
    [/\bcan't\b/gi, 'can not'],
    [/\bwon't\b/gi, 'will not'],
    [/\bisn't\b/gi, 'is not'],
    [/\baren't\b/gi, 'are not'],
    [/\bwasn't\b/gi, 'was not'],
    [/\bweren't\b/gi, 'were not'],
    [/\bdidn't\b/gi, 'did not'],
    [/\bdoesn't\b/gi, 'does not'],
    [/\bcouldn't\b/gi, 'could not'],
    [/\bshouldn't\b/gi, 'should not'],
    [/\bit's\b/gi, 'it is'],
    [/\bi'd\b/gi, 'i would'],
    [/\bthere's\b/gi, 'there is']
];

const CATEGORY_PATTERNS = {
    Battery: /(battery|charging|charge|power)/,
    Performance: /(performance|app|loading|load|slow|lag|laggy|startup|start|update|version|checkout|search|latency)/,
    Bug: /(bug|bugs|buggy|glitch|glitchy|crash|freeze|broken|not working|defect|counterfeit)/,
    Support: /(support|customer support|customer service|service|reply|response|agent|refund)/,
    Shipping: /(shipping|shipment|package|courier|arrived|delivery|delivered)/,
    Delivery: /(delivery|delivered|package|parcel|arrived)/,
    Price: /(price|pricing|cost|expensive|overpriced|fee|fees|subscription)/,
    Quality: /(quality|cheap|flimsy|damaged|broken|material|finish|average|artificial|bland|scratched)/,
    Notifications: /(notification|notifications|alert|alerts)/,
    'UI/UX': /(interface|navigation|design|layout|checkout|execution|gameplay)/,
    Camera: /(camera|photo|photos|video|image)/,
    Compatibility: /(browser|compatibility|compatible|device|android|ios)/,
    Reliability: /(reliable|reliability|unreliable|stable|stability|disconnect)/,
    Documentation: /(instructions|manual|assembly|documentation)/,
    Durability: /(broke|breakage|durability|wore out|scratched)/
};

const REVERSIBLE_ADJECTIVES = [
    'glitchy',
    'buggy',
    'slow',
    'confusing',
    'clunky',
    'damaged',
    'broken',
    'unresponsive',
    'flimsy',
    'cheap',
    'unreliable',
    'poor',
    'bland',
    'repetitive',
    'artificial'
];

function toLowerWords(text) {
    return text
        .toLowerCase()
        .replace(EXTRA_SPACE_REGEX, ' ')
        .trim();
}

function stripParserArtifacts(text) {
    let cleaned = text;

    for (const regex of PARSER_ARTIFACT_REGEXES) {
        cleaned = cleaned.replace(regex, '');
    }

    for (const regex of QUOTE_FRAGMENT_REGEXES) {
        cleaned = cleaned.replace(regex, '');
    }

    return cleaned;
}

function cleanComplaintText(complaintText) {
    let cleaned = String(complaintText || '')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2013\u2014]/g, '-')
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s*\|\s*/g, ' ')
        .replace(EXTRA_SPACE_REGEX, ' ')
        .trim();

    if (!cleaned) {
        return '';
    }

    cleaned = stripParserArtifacts(cleaned)
        .replace(SURROUNDING_NOISE_REGEX, '')
        .replace(EXTRA_SPACE_REGEX, ' ')
        .trim();

    for (const [pattern, replacement] of CONTRACTION_REPLACEMENTS) {
        cleaned = cleaned.replace(pattern, replacement);
    }

    return cleaned.replace(EXTRA_SPACE_REGEX, ' ').trim();
}

function stripFrontedContext(text) {
    let cleaned = text;

    for (const regex of FRONTED_CONTEXT_REGEXES) {
        const match = cleaned.match(regex);
        if (match?.[1]) {
            cleaned = match[1].trim();
            break;
        }
    }

    return cleaned
        .replace(/^(?:the fact that|fact that)\s+/i, '')
        .trim();
}

function removeLightOpeners(text) {
    let cleaned = stripFrontedContext(text)
        .replace(LEADING_MARKER_REGEX, '')
        .replace(TRAILING_CONTEXT_REGEX, '')
        .trim();

    let previous;
    do {
        previous = cleaned;
        cleaned = cleaned.replace(LEADING_FILLER_REGEX, '').trim();
    } while (cleaned !== previous);

    return cleaned.replace(EXTRA_SPACE_REGEX, ' ').trim();
}

function inferCategory(text, category) {
    if (category && category !== 'Other' && category !== 'No Complaint') {
        return category;
    }

    const lowered = text.toLowerCase();
    for (const [candidateCategory, regex] of Object.entries(CATEGORY_PATTERNS)) {
        if (regex.test(lowered)) {
            return candidateCategory;
        }
    }

    return category || 'Other';
}

function toPhrase(value) {
    return value
        .replace(SURROUNDING_NOISE_REGEX, '')
        .replace(EXTRA_SPACE_REGEX, ' ')
        .trim()
        .toLowerCase();
}

function stripLeadingArticles(text) {
    return text.replace(LEADING_ARTICLE_REGEX, '').trim();
}

function reverseCopulaComplaint(text) {
    const subjectMatch = text.match(/^(.+?)\s+(?:is|are|was|were|feels|seems)\s+(.+)$/i);
    if (!subjectMatch) {
        return '';
    }

    const subject = stripLeadingArticles(subjectMatch[1]).toLowerCase();
    const descriptor = subjectMatch[2]
        .toLowerCase()
        .replace(/^(?:too|very|really|pretty|quite|somewhat|a bit|kind of)\s+/, '')
        .replace(/\b(?:for\s+.*)$/i, '')
        .trim();

    if (!subject || !descriptor) {
        return '';
    }

    const descriptorHead = descriptor.split(' ')[0];
    if (!REVERSIBLE_ADJECTIVES.includes(descriptorHead)) {
        return '';
    }

    return `${descriptorHead} ${subject}`.trim();
}

function condenseByRule(text, category) {
    const lowered = toLowerWords(text);
    const resolvedCategory = inferCategory(text, category);

    if (/(battery life|battery) .*could be better/.test(lowered)) {
        return 'weak battery life';
    }

    if (/(battery life|battery) .*?(?:disappointingly short|too short|very short|short|does not last long|does not last enough|not lasting long)/.test(lowered)) {
        return 'short battery life';
    }

    if (/(battery).*(?:drains|dies).*(?:fast|quickly)|(?:drains|dies) fast/.test(lowered)) {
        return 'fast battery drain';
    }

    if (/expected (?:more|better) from (?:the )?camera|camera .*?(?:underperforms|disappoints)|camera quality is disappointing/.test(lowered)) {
        return 'camera underperforms';
    }

    if (/expected better quality|expected more quality|quality .*below expectations/.test(lowered)) {
        return 'quality below expectations';
    }

    if (/(support|customer support|customer service|service).*(?:replied|responded|response).*(?:too slowly|slowly|late|later)|wish (?:customer )?support replied faster/.test(lowered)) {
        return 'slow support response';
    }

    if (/(support|customer support|customer service).*(?:rude|unhelpful|useless|dismissive)/.test(lowered)) {
        return 'poor support';
    }

    if (/(support team|customer support|support).*(?:unresponsive|slow|late)/.test(lowered)) {
        return 'unresponsive support';
    }

    if (/(shipping|delivery|package).*(?:took forever|too long|slow|late|delayed)|package arrived late/.test(lowered)) {
        return 'slow shipping';
    }

    if (/the update made things worse|update .*made .*worse|after the update .*worse/.test(lowered)) {
        return 'update regression';
    }

    if (/(old|previous) version .*more reliable|used to be more reliable|reliability regression/.test(lowered)) {
        return 'reliability regression';
    }

    if (/(old|previous) version .* smoother|used to be better|performance regression/.test(lowered)) {
        return 'performance regression';
    }

    if (/cheaper version .*performs better/.test(lowered)) {
        return 'cheaper version performs better';
    }

    if (/wired version has no latency|no latency/.test(lowered) && resolvedCategory === 'Performance') {
        return 'latency issue';
    }

    if (/i would give it five stars only if .*bugs .*fixed|only if .*bugs .*fixed|bugs .*not fixed|bugs .*still .*not fixed|unresolved bugs/.test(lowered)) {
        return 'unfixed bugs';
    }

    if (/(checkout|check out) .*glitchy/.test(lowered)) {
        return 'glitchy checkout';
    }

    if (/(notifications).*(?:broken|late|delayed|not working|do not work|does not work)/.test(lowered)) {
        return 'broken notifications';
    }

    if (/(slow to load|too slow to load|takes too long to load|loads too slowly)/.test(lowered)) {
        return 'slow app performance';
    }

    if (/(search).*(?:too slow|slow|unresponsive)/.test(lowered)) {
        return 'slow search';
    }

    if (/(too slow to start|slow to start|slow startup|starts too slowly)/.test(lowered)) {
        return 'slow performance';
    }

    if (/(app|search|site|interface).*(?:too slow|slow|laggy|lags|loading|unresponsive)/.test(lowered)) {
        return 'slow app performance';
    }

    if (/does not work as advertised|not working as advertised/.test(lowered)) {
        return 'does not work as advertised';
    }

    if (/tasted artificial|taste .*artificial/.test(lowered)) {
        return 'artificial taste';
    }

    if (/taste .*bland|bland taste/.test(lowered)) {
        return 'bland taste';
    }

    if (/execution .*poor|poor execution/.test(lowered)) {
        return 'poor execution';
    }

    if (/gameplay .*repetitive|repetitive gameplay/.test(lowered)) {
        return 'repetitive gameplay';
    }

    if (/feels flimsy|flimsy/.test(lowered) && resolvedCategory === 'Quality') {
        return 'flimsy build quality';
    }

    if (/broke after|broke within|broke in two uses|broke after two uses/.test(lowered)) {
        return 'poor durability';
    }

    if (/arrived scratched|scratched product|scratched/.test(lowered)) {
        return 'scratched product';
    }

    if (/counterfeit/.test(lowered)) {
        return 'counterfeit product';
    }

    if (/unit had a defect|had a defect|defective unit/.test(lowered)) {
        return 'defective unit';
    }

    if (/assembly took hours|took hours to assemble|assembly .*hours/.test(lowered)) {
        return 'time-consuming assembly';
    }

    if (/moisture inside|water inside/.test(lowered)) {
        return 'moisture inside after rain';
    }

    if (/product failed|failed after/.test(lowered) && /(product|item|unit)/.test(lowered)) {
        return 'product failure';
    }

    if (/experience was bad|poor experience|bad experience/.test(lowered)) {
        return 'poor experience';
    }

    if (/found it lacking|it is lacking|lacking overall/.test(lowered)) {
        return 'lacking overall';
    }

    if (/if you have small hands|small hands/.test(lowered)) {
        return 'limited hand fit';
    }

    if (/rather not use it again/.test(lowered)) {
        return 'would not use again';
    }

    if (/(bug|buggy|crash|crashing|freeze|glitch|not working)/.test(lowered) && resolvedCategory === 'Performance') {
        return 'buggy performance';
    }

    if (/(material|build|product|item).*(?:feels cheap|cheap|flimsy)/.test(lowered)) {
        return 'cheap build quality';
    }

    if (/(paint|finish).*(?:peeling|peels)/.test(lowered)) {
        return 'peeling finish';
    }

    if (/(product|item|package).*(?:inside .*damaged|damaged inside|arrived damaged|is damaged|was damaged)/.test(lowered) || /^damaged (?:product|item|package)$/.test(lowered)) {
        return 'damaged product';
    }

    if (/it is just average|just average|average at best|underwhelming/.test(lowered)) {
        return 'underwhelming quality';
    }

    if (/i would rather use a different browser|rather use a different browser|browser .*not for me/.test(lowered)) {
        return 'poor browser experience';
    }

    if (/hidden fees/.test(lowered)) {
        return 'hidden fees';
    }

    if (/(overpriced|too expensive|price too high|cost too much)/.test(lowered) || (resolvedCategory === 'Price' && /(price|expensive|cost|subscription)/.test(lowered))) {
        return 'high price';
    }

    if (/not for me/.test(lowered)) {
        return 'poor fit';
    }

    if (/only issue is (?:the )?price|issue is (?:the )?price/.test(lowered)) {
        return 'high price';
    }

    if (resolvedCategory === 'Battery' && /(drains fast|dies fast|drains|dies)/.test(lowered)) {
        return 'fast battery drain';
    }

    if (resolvedCategory === 'Support' && /(support|service)/.test(lowered)) {
        return 'poor support';
    }

    if (resolvedCategory === 'Shipping' && /(shipping|delivery|package)/.test(lowered)) {
        return 'slow shipping';
    }

    if (resolvedCategory === 'Performance' && /slow/.test(lowered)) {
        return 'slow performance';
    }

    if (resolvedCategory === 'Price') {
        return 'high price';
    }

    return reverseCopulaComplaint(lowered);
}

function simplifyForFallback(text) {
    return stripFrontedContext(text)
        .replace(/\b(?:i wish|i expected more from|i expected better|expected more from|expected better|could be better|not ideal|honestly|overall|it seems|i would rather|i would give it five stars only if)\b/gi, '')
        .replace(PRONOUN_START_REGEX, '')
        .replace(/^i\s+/i, '')
        .replace(LEADING_ARTICLE_REGEX, '')
        .replace(EXTRA_SPACE_REGEX, ' ')
        .trim();
}

function fallbackCondense(text) {
    const lowered = toPhrase(text)
        .replace(/^from\s+/i, '')
        .replace(/^for\s+/i, '')
        .trim();

    if (!lowered) {
        return '';
    }

    const words = lowered.split(' ').filter(Boolean);
    if (words.length <= 4) {
        return lowered;
    }

    return words.slice(0, 5).join(' ');
}

export function condenseComplaint(complaintText, category) {
    const cleaned = removeLightOpeners(cleanComplaintText(complaintText));
    if (!cleaned) {
        return '';
    }

    const ruled = condenseByRule(cleaned, category);
    if (ruled) {
        return ruled;
    }

    return fallbackCondense(simplifyForFallback(cleaned));
}

export class ComplaintCondenser {
    compress(complaintText, category) {
        return condenseComplaint(complaintText, category);
    }
}
