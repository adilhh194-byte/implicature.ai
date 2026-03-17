#!/usr/bin/env python3
"""Train a compact sparse linear reranker for complaint candidates.

This script stays dependency-light and uses only Python's standard library.
It relies on the JS candidate generator and feature extractor so training sees
exactly the same candidate space as the in-browser runtime.

Usage:
    python src/ml/train_candidate_reranker.py

Outputs:
    src/ml/exported_candidate_reranker.json
"""

from __future__ import annotations

import json
import math
import re
import subprocess
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOLD_PATH = ROOT / 'src' / 'eval' / 'gold_reviews.json'
OUTPUT_PATH = ROOT / 'src' / 'ml' / 'exported_candidate_reranker.json'
TEMP_JS_PATH = ROOT / 'src' / 'ml' / '__tmp_train_candidate_reranker__.mjs'

TOKEN_LIMIT = 80
CHAR_LIMIT = 60
EPOCHS = 220
LEARNING_RATE = 0.08
L2 = 0.0008


def load_gold_reviews():
    with GOLD_PATH.open('r', encoding='utf-8') as handle:
        return json.load(handle)


def run_js_feature_dump(_gold_rows):
    script = """
import fs from 'node:fs';
import { normalizeReview } from '../pipeline/reviewNormalizer.js';
import { generateComplaintCandidates } from '../pipeline/complaintCandidateGenerator.js';
import { detectComplaintSignals } from '../pipeline/complaintSignalDetector.js';
import { extractCandidateFeatures } from '../pipeline/candidateFeatureExtractor.js';

const goldPath = process.argv[2];
const rows = JSON.parse(fs.readFileSync(goldPath, 'utf8'));

const payload = rows.map(row => {
    const normalized = normalizeReview(row.review || '');
    const candidates = generateComplaintCandidates(normalized, {
        includeSentenceCandidates: true
    }).map(candidate => {
        const signalResult = detectComplaintSignals(candidate.text);
        const enriched = {
            ...candidate,
            signals: signalResult.signals,
            familyHints: [...new Set([...(candidate.familyHints || []), ...signalResult.complaintTypeHints])],
            markerFound: signalResult.markerFound
        };

        return {
            text: enriched.text,
            features: extractCandidateFeatures(enriched, normalized)
        };
    });

    return {
        id: row.id,
        review: row.review,
        gold_span: row.gold_span || '',
        has_hidden_complaint: Boolean(row.has_hidden_complaint),
        candidates
    };
});

process.stdout.write(JSON.stringify(payload));
"""

    TEMP_JS_PATH.write_text(script, encoding='utf-8')
    try:
        result = subprocess.run(
            ['node', str(TEMP_JS_PATH), str(GOLD_PATH)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            check=True,
        )
    except subprocess.CalledProcessError as exc:
        sys.stderr.write(exc.stderr)
        raise
    finally:
        try:
            TEMP_JS_PATH.unlink()
        except OSError:
            pass

    return json.loads(result.stdout)


def normalize_text(text):
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9\s]+', ' ', (text or '').lower())).strip()


def token_set(text):
    normalized = normalize_text(text)
    return set(normalized.split()) if normalized else set()


def overlap_score(candidate_text, gold_span):
    candidate_tokens = token_set(candidate_text)
    gold_tokens = token_set(gold_span)
    if not candidate_tokens or not gold_tokens:
        return 0.0

    overlap = len(candidate_tokens & gold_tokens)
    precision = overlap / len(candidate_tokens)
    recall = overlap / len(gold_tokens)
    if precision + recall == 0:
        return 0.0
    return (2 * precision * recall) / (precision + recall)


def label_candidate(review_row, candidate_text):
    if not review_row['has_hidden_complaint']:
        return 0

    gold_span = review_row['gold_span']
    if not gold_span:
        return 0

    normalized_candidate = normalize_text(candidate_text)
    normalized_gold = normalize_text(gold_span)

    if normalized_candidate == normalized_gold:
        return 1
    if normalized_candidate and normalized_gold and (
        normalized_candidate in normalized_gold or normalized_gold in normalized_candidate
    ):
        return 1

    return 1 if overlap_score(candidate_text, gold_span) >= 0.55 else 0


def tokenize(text):
    return normalize_text(text).split()


def char_ngrams(text):
    normalized = normalize_text(text)
    grams = []
    for size in (3, 4, 5):
        for index in range(0, max(0, len(normalized) - size + 1)):
            grams.append(normalized[index:index + size])
    return grams


def collect_vocab(examples):
    token_counts = Counter()
    char_counts = Counter()

    for example in examples:
        candidate_text = example['features']['categorical'].get('candidate_text', '')
        token_counts.update(tokenize(candidate_text))
        char_counts.update(char_ngrams(candidate_text))

    token_vocab = {token for token, _ in token_counts.most_common(TOKEN_LIMIT)}
    char_vocab = {gram for gram, _ in char_counts.most_common(CHAR_LIMIT)}
    return token_vocab, char_vocab


def sparse_features(feature_obj, token_vocab, char_vocab):
    sparse = {}

    for key, value in feature_obj.get('numeric', {}).items():
        if isinstance(value, (int, float)) and math.isfinite(value):
            sparse[f'num:{key}'] = float(value)

    for key, value in feature_obj.get('boolean', {}).items():
        sparse[f'bool:{key}'] = 1.0 if value else 0.0

    for key, value in feature_obj.get('categorical', {}).items():
        if isinstance(value, str) and value:
            sparse[f'cat:{key}={value}'] = 1.0

    candidate_text = feature_obj.get('categorical', {}).get('candidate_text', '')
    for token in tokenize(candidate_text):
        if token in token_vocab:
            sparse[f'tok:{token}'] = sparse.get(f'tok:{token}', 0.0) + 1.0

    for gram in char_ngrams(candidate_text):
        if gram in char_vocab:
            sparse[f'char:{gram}'] = sparse.get(f'char:{gram}', 0.0) + 1.0

    return sparse


def train_logistic_regression(examples, token_vocab, char_vocab):
    weights = {'__bias__': 0.0}
    sparse_examples = [
        (sparse_features(example['features'], token_vocab, char_vocab), example['label'])
        for example in examples
    ]

    for _ in range(EPOCHS):
        for features, label in sparse_examples:
            raw_score = weights['__bias__']
            for key, value in features.items():
                raw_score += weights.get(key, 0.0) * value

            prediction = 1.0 / (1.0 + math.exp(-raw_score))
            error = label - prediction

            weights['__bias__'] += LEARNING_RATE * error
            for key, value in features.items():
                current = weights.get(key, 0.0)
                gradient = (error * value) - (L2 * current)
                weights[key] = current + (LEARNING_RATE * gradient)

    return weights


def split_weights(weights):
    feature_weights = {}
    token_weights = {}
    char_weights = {}

    for key, value in weights.items():
        if key == '__bias__' or abs(value) < 0.025:
            continue
        rounded = round(value, 4)
        if key.startswith('tok:'):
            token_weights[key[4:]] = rounded
        elif key.startswith('char:'):
            char_weights[key[5:]] = rounded
        else:
            feature_weights[key] = rounded

    return feature_weights, token_weights, char_weights


def build_export(weights):
    feature_weights, token_weights, char_weights = split_weights(weights)
    return {
        'version': '1.0.0',
        'model_type': 'sparse_linear_logistic',
        'generated_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'training_source': 'src/eval/gold_reviews.json',
        'intercept': round(weights.get('__bias__', 0.0), 4),
        'feature_weights': dict(sorted(feature_weights.items())),
        'token_weights': dict(sorted(token_weights.items())),
        'char_ngram_weights': dict(sorted(char_weights.items())),
        'notes': [
            'Compact offline reranker trained for candidate ranking, not end-to-end complaint generation.',
            'Rule scores remain primary; this model provides a transparent reranking nudge.',
            'Top contributing features are exposed at runtime for debugging.'
        ],
        'retrain': {
            'command': 'python src/ml/train_candidate_reranker.py',
            'output': 'src/ml/exported_candidate_reranker.json'
        }
    }


def main():
    gold_rows = load_gold_reviews()
    generated = run_js_feature_dump(gold_rows)

    examples = []
    for review_row in generated:
        for candidate in review_row['candidates']:
            examples.append({
                'features': candidate['features'],
                'label': label_candidate(review_row, candidate['text'])
            })

    token_vocab, char_vocab = collect_vocab(examples)
    weights = train_logistic_regression(examples, token_vocab, char_vocab)
    export_payload = build_export(weights)

    with OUTPUT_PATH.open('w', encoding='utf-8') as handle:
        json.dump(export_payload, handle, indent=2)
        handle.write('\n')

    print(f'Wrote {OUTPUT_PATH.relative_to(ROOT)}')
    print(f'Examples: {len(examples)} | Token vocab: {len(token_vocab)} | Char vocab: {len(char_vocab)}')


if __name__ == '__main__':
    main()

