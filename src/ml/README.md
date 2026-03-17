# Candidate Reranker

This folder contains the compact offline reranker used to nudge complaint candidate selection after the rule engine has already generated and scored spans.

## Runtime

The browser and worker use:
- `src/ml/exported_candidate_reranker.json`
- `src/ml/candidateReranker.js`

Runtime inference is pure JavaScript and has no Python dependency.

## Retraining

1. Update `src/eval/gold_reviews.json` with reviews, gold complaint spans, categories, and complaint types.
2. Run:
   ```bash
   python src/ml/train_candidate_reranker.py
   ```
3. The script rewrites `src/ml/exported_candidate_reranker.json`.
4. Run the test suite:
   ```bash
   npm test -- --run
   ```

## Training Notes

- The training script uses the JS candidate generator and feature extractor, so offline training sees the same candidate space as runtime.
- Features are intentionally sparse and interpretable:
  - numeric/boolean/categorical linguistic features
  - compact token features from candidate text
  - compact character n-grams
- The model is meant to rerank candidates, not replace the rule engine.
