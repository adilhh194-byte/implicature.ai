import { describe, expect, it } from 'vitest';
import { condenseComplaint } from './complaintCondenser.js';

describe('complaintCondenser', () => {
    const cases = [
        ['battery life could be better', 'Battery', 'weak battery life'],
        ['Battery life is disappointingly short.', 'Battery', 'short battery life'],
        ['BATTERY LIFE IS TOO SHORT', 'Battery', 'short battery life'],
        ['The battery drains fast', 'Battery', 'fast battery drain'],
        ['battery does not last long enough', 'Battery', 'short battery life'],
        ['I expected more from the camera', 'Camera', 'camera underperforms'],
        ['camera quality is disappointing', 'Camera', 'camera underperforms'],
        ['I expected better quality', 'Quality', 'quality below expectations'],
        ['support replied too slowly', 'Support', 'slow support response'],
        ['I wish support replied faster', 'Support', 'slow support response'],
        ['customer service was rude', 'Support', 'poor support'],
        ['the support team is unresponsive', 'Support', 'unresponsive support'],
        ['shipping took forever', 'Shipping', 'slow shipping'],
        ['the package arrived late', 'Shipping', 'slow shipping'],
        ['delivery was delayed again', 'Shipping', 'slow shipping'],
        ['the update made things worse', 'Performance', 'update regression'],
        ['after the update everything feels worse', 'Performance', 'update regression'],
        ['the old version was smoother', 'Performance', 'performance regression'],
        ['the previous version was more reliable', 'Reliability', 'reliability regression'],
        ['cheaper version actually performs better', 'Performance', 'cheaper version performs better'],
        ['wired version has no latency', 'Performance', 'latency issue'],
        ['checkout is glitchy', 'UI/UX', 'glitchy checkout'],
        ['clause_4: "checkout is glitchy"', 'UI/UX', 'glitchy checkout'],
        ['the app is buggy', 'Performance', 'buggy performance'],
        ['works fine overall, just too slow to load', 'Performance', 'slow app performance'],
        ['Good overall, just too slow to start.', 'Performance', 'slow performance'],
        ['the search is slow', 'Performance', 'slow search'],
        ['the interface is confusing', 'UI/UX', 'confusing interface'],
        ['notifications are not working', 'Bug', 'broken notifications'],
        ['the material feels cheap and flimsy', 'Quality', 'flimsy build quality'],
        ['the paint is peeling', 'Quality', 'peeling finish'],
        ['the product inside is damaged', 'Quality', 'damaged product'],
        ['the product arrived damaged', 'Quality', 'damaged product'],
        ['the monthly price is too expensive', 'Price', 'high price'],
        ['subscription cost too much', 'Price', 'high price'],
        ['Good product, only issue is the price.', 'Price', 'high price'],
        ['hidden fees make this overpriced', 'Price', 'hidden fees'],
        ['I\'d give it five stars only if the bugs were fixed', 'Bug', 'unfixed bugs'],
        ['there are bugs that are still not fixed', 'Bug', 'unfixed bugs'],
        ['it is just average', 'Quality', 'underwhelming quality'],
        ['It\'s just average.', 'Quality', 'underwhelming quality'],
        ['I\'d rather use a different browser', 'Compatibility', 'poor browser experience'],
        ['it is not for me', 'Other', 'poor fit'],
        ['honestly the support team was rude', 'Support', 'poor support'],
        ['1023 - "battery life is disappointingly short"', 'Battery', 'short battery life'],
        ['REVIEW_ID: 77, "I expected better quality"', 'Quality', 'quality below expectations'],
        ['Even though it\'s organic, it tasted artificial.', 'Other', 'artificial taste'],
        ['Although the food presentation was excellent, the taste was quite bland.', 'Other', 'bland taste'],
        ['Even though it\'s lightweight, it feels flimsy.', 'Quality', 'flimsy build quality'],
        ['In spite of the claims, it doesn\'t work as advertised.', 'Other', 'does not work as advertised'],
        ['Despite the fact that it looks sturdy, it broke after two uses.', 'Durability', 'poor durability'],
        ['Despite the fact that it\'s new, it arrived scratched.', 'Quality', 'scratched product'],
        ['Even though it claims to be waterproof, I found moisture inside after a light rain.', 'Other', 'moisture inside after rain'],
        ['Even though it\'s a trusted brand, I received a counterfeit.', 'Other', 'counterfeit product'],
        ['In spite of the five-star reviews, my experience was bad.', 'Other', 'poor experience'],
        ['Despite the fact that it\'s popular, I found it lacking.', 'Other', 'lacking overall'],
        ['In spite of the positive reviews, my unit had a defect.', 'Quality', 'defective unit'],
        ['Even though the instructions are clear, assembly took hours.', 'Documentation', 'time-consuming assembly'],
        ['Despite the fact that it\'s a top brand, the product failed.', 'Bug', 'product failure'],
        ['I recommend this only if you have small hands.', 'Sizing', 'limited hand fit'],
        ['I\'d rather not use it again, whereas my friend loves his.', 'Other', 'would not use again']
    ];

    it.each(cases)('condenses %s', (input, category, expected) => {
        expect(condenseComplaint(input, category)).toBe(expected);
    });

    it('returns a simple normalized fragment when only an aspect noun remains', () => {
        expect(condenseComplaint('notifications', 'Features')).toBe('notifications');
    });

    it('strips parser artifacts and quote remnants before fallback condensation', () => {
        expect(condenseComplaint('span-2: `The interface feels clunky`', 'UI/UX')).toBe('clunky interface');
    });

    it('returns an empty string for nullish or whitespace-only inputs', () => {
        expect(condenseComplaint('', 'Other')).toBe('');
        expect(condenseComplaint('   ', 'Other')).toBe('');
        expect(condenseComplaint(null, 'Other')).toBe('');
    });
});

