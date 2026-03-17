import { describe, expect, it } from 'vitest';
import { parseDelimitedReviewText } from './fileParser.js';
import { sanitizeImportedReviewText } from './reviewTextSanitizer.js';

describe('fileParser ingestion sanitization', () => {
    it('strips numeric id prefixes and wrapping CSV quotes from imported rows', () => {
        expect(sanitizeImportedReviewText('84,"The packaging is beautiful; however, the product inside is damaged."'))
            .toBe('The packaging is beautiful; however, the product inside is damaged.');
        expect(sanitizeImportedReviewText('2,"I loved the design of this phone; however, the battery life is disappointingly short."'))
            .toBe('I loved the design of this phone; however, the battery life is disappointingly short.');
        expect(sanitizeImportedReviewText('56,"While the battery lasts long, charging is slow."'))
            .toBe('While the battery lasts long, charging is slow.');
    });

    it('removes surrounding CSV quotes and escaped punctuation remnants', () => {
        expect(sanitizeImportedReviewText('"The camera is good, but the app is slow."')).toBe('The camera is good, but the app is slow.');
        expect(sanitizeImportedReviewText('84,\"The checkout feels glitchy\"')).toBe('The checkout feels glitchy');
    });

    it('parses headerless CSV review files into plain review text only', () => {
        const csvText = [
            '84,"The packaging is beautiful; however, the product inside is damaged."',
            '2,"I loved the design of this phone; however, the battery life is disappointingly short."',
            '56,"While the battery lasts long, charging is slow."'
        ].join('\n');

        const result = parseDelimitedReviewText(csvText);

        expect(result.totalReviews).toBe(3);
        expect(result.reviews.map(item => item.review)).toEqual([
            'The packaging is beautiful; however, the product inside is damaged.',
            'I loved the design of this phone; however, the battery life is disappointingly short.',
            'While the battery lasts long, charging is slow.'
        ]);
    });

    it('keeps headered review columns clean as well', () => {
        const csvText = [
            'id,review',
            '84,"The packaging is beautiful; however, the product inside is damaged."',
            '56,"While the battery lasts long, charging is slow."'
        ].join('\n');

        const result = parseDelimitedReviewText(csvText);

        expect(result.reviews.map(item => item.review)).toEqual([
            'The packaging is beautiful; however, the product inside is damaged.',
            'While the battery lasts long, charging is slow.'
        ]);
    });
});
