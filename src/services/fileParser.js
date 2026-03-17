import Papa from 'papaparse';
import * as xlsx from 'xlsx';
import Tesseract from 'tesseract.js';
import { sanitizeImportedReviewText } from './reviewTextSanitizer.js';

const REVIEW_COLUMNS = ['review', 'review_text', 'comment', 'feedback', 'text', 'content', 'body', 'message'];

function createReviewItem(review) {
    return {
        review,
        id: crypto.randomUUID()
    };
}

function buildReviewPayload(reviewTexts) {
    const reviews = reviewTexts
        .map(sanitizeImportedReviewText)
        .filter(Boolean)
        .map(createReviewItem);

    return {
        totalReviews: reviews.length,
        reviews
    };
}

function looksLikeReviewHeader(value) {
    const lowered = String(value || '').trim().toLowerCase();
    return REVIEW_COLUMNS.some(column => lowered === column || lowered.includes(column));
}

function detectReviewColumn(row) {
    const keys = Object.keys(row || {});
    for (const col of REVIEW_COLUMNS) {
        const match = keys.find(key => key.toLowerCase().includes(col));
        if (match) {
            return match;
        }
    }

    return keys[0] || null;
}

function scoreCandidateCell(value) {
    const cleaned = sanitizeImportedReviewText(value);
    if (!cleaned) {
        return -10;
    }

    const words = cleaned.split(/\s+/).filter(Boolean);
    const letters = (cleaned.match(/[a-z]/gi) || []).length;
    const digits = (cleaned.match(/\d/g) || []).length;
    const punctuationBonus = /[;,.!?]/.test(cleaned) ? 3 : 0;
    const clauseBonus = /\b(?:but|however|although|though|while)\b/i.test(cleaned) ? 4 : 0;
    const lengthBonus = words.length >= 5 ? 8 : words.length >= 3 ? 4 : 1;
    const alphaBonus = letters > digits ? 3 : 0;
    const numericPenalty = /^\d+$/.test(cleaned) ? -12 : 0;

    return punctuationBonus + clauseBonus + lengthBonus + alphaBonus + numericPenalty;
}

function detectReviewColumnIndex(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return { index: 0, dataRows: [] };
    }

    const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
    const headerIndex = firstRow.findIndex(looksLikeReviewHeader);
    if (headerIndex >= 0) {
        return {
            index: headerIndex,
            dataRows: rows.slice(1)
        };
    }

    const maxColumns = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let index = 0; index < maxColumns; index += 1) {
        const score = rows
            .slice(0, 20)
            .reduce((sum, row) => sum + scoreCandidateCell(Array.isArray(row) ? row[index] : ''), 0);

        if (score > bestScore) {
            bestScore = score;
            bestIndex = index;
        }
    }

    return {
        index: bestIndex,
        dataRows: rows
    };
}

function processArrayData(data) {
    if (!Array.isArray(data) || data.length === 0) {
        return { totalReviews: 0, reviews: [] };
    }

    const reviewColumn = detectReviewColumn(data[0]);
    if (!reviewColumn) {
        return { totalReviews: 0, reviews: [] };
    }

    const reviewTexts = data
        .map(row => row?.[reviewColumn])
        .map(sanitizeImportedReviewText)
        .filter(Boolean);

    return buildReviewPayload(reviewTexts);
}

function processMatrixData(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return { totalReviews: 0, reviews: [] };
    }

    const { index, dataRows } = detectReviewColumnIndex(rows);
    const reviewTexts = dataRows
        .map(row => Array.isArray(row) ? row[index] : '')
        .map(sanitizeImportedReviewText)
        .filter(Boolean);

    return buildReviewPayload(reviewTexts);
}

export function parseDelimitedReviewText(rawText) {
    const parsed = Papa.parse(rawText || '', {
        header: false,
        skipEmptyLines: true
    });

    return processMatrixData(parsed.data || []);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event.target?.result || ''));
        reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
        reader.readAsText(file);
    });
}

function parseJsonPayload(text) {
    const data = JSON.parse(text);

    if (Array.isArray(data)) {
        if (data.length === 0) {
            return { totalReviews: 0, reviews: [] };
        }

        if (Array.isArray(data[0])) {
            return processMatrixData(data);
        }

        if (typeof data[0] === 'object' && data[0] !== null) {
            return processArrayData(data);
        }

        return buildReviewPayload(data);
    }

    if (data && typeof data === 'object') {
        return processArrayData([data]);
    }

    return buildReviewPayload([String(data)]);
}

export async function parseFile(file) {
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
        const text = await readFileAsText(file);
        return parseDelimitedReviewText(text);
    }

    if (['xlsx', 'xls'].includes(fileExt)) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = event => {
                const data = new Uint8Array(event.target?.result || new ArrayBuffer(0));
                const workbook = xlsx.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
                    header: 1,
                    defval: ''
                });
                resolve(processMatrixData(rows));
            };
            reader.readAsArrayBuffer(file);
        });
    }

    if (fileExt === 'json') {
        const text = await readFileAsText(file);
        return parseJsonPayload(text);
    }

    if (fileExt === 'txt') {
        const text = await readFileAsText(file);
        const lines = text
            .split(/\r?\n/)
            .map(sanitizeImportedReviewText)
            .filter(Boolean);

        return buildReviewPayload(lines);
    }

    if (['png', 'jpg', 'jpeg'].includes(fileExt)) {
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(file);
        await worker.terminate();

        const blocks = text
            .split(/\r?\n/)
            .map(sanitizeImportedReviewText)
            .filter(Boolean);

        return buildReviewPayload(blocks.length > 0 ? blocks : [text]);
    }

    throw new Error('Unsupported file format');
}
