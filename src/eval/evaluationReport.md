# Analyzer Evaluation Report

Generated: 2026-03-17T03:31:10.580Z

## Overview

| Metric | Value |
| --- | --- |
| Gold reviews | 16 |
| Positive hidden complaints | 14 |
| Predicted complaints | 13 |
| Precision | 100% |
| Recall | 92.9% |
| F1 | 96.3% |
| Average span F1 (all positives) | 0.807 |
| Average span F1 (detected positives) | 0.869 |
| Category accuracy | 85.7% |
| Malformed extractions | 0 |

## Detection Breakdown

| Metric | Count |
| --- | --- |
| True positives | 13 |
| False positives | 0 |
| False negatives | 1 |
| True negatives | 2 |

## Category And Family

| Family | Support | Detected | Recall | Family Recall | Avg Span F1 |
| --- | --- | --- | --- | --- | --- |
| explicit_contrast | 1 | 1 | 100% | 100% | 1.000 |
| exception | 1 | 1 | 100% | 100% | 0.667 |
| concessive_front | 0 | 0 | 0% | 0% | 0.000 |
| expectation_failure | 3 | 3 | 100% | 66.7% | 0.847 |
| comparison_regression | 1 | 1 | 100% | 100% | 0.909 |
| wish_or_counterfactual | 2 | 2 | 100% | 100% | 0.834 |
| preference_avoidance | 2 | 2 | 100% | 100% | 0.813 |
| soft_dissatisfaction | 2 | 1 | 50% | 50% | 1.000 |
| direct_complaint | 2 | 2 | 100% | 100% | 0.945 |

## Worst Misses

### False Negatives

- 1. [ soft-average-1] family=soft_dissatisfaction category=Other review="It's just average." gold_span="just average"

### False Positives

- None

### Lowest Span Overlaps

- None

## Debug Notes

- This harness is hidden-complaint focused: recall on positive gold reviews is treated as the primary success metric.
- Family recall requires both complaint detection and the correct complaint-family bucket.
- Malformed extraction count flags artifacts like row-id prefixes, dangling quotes, or broken clause boundaries in extracted complaint text.