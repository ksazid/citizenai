# VS-05 — Mastery Engine

CitizenAI models mastery per concept, not per question bank completion.

## Model
- Beta prior: `alpha=1`, `beta=1`
- Correct/incorrect evidence updates alpha/beta using weighted observations
- Unseen wording and delayed recall contribute more evidence
- Repeated variants are explicitly discounted
- Confidence combines evidence volume and variant diversity
- Retention decays exponentially using concept memory stability
- Effective mastery = mastery mean × retention × confidence

## Learner states
`LOW_CONFIDENCE`, `UNKNOWN`, `LOW_RETENTION`, `WORDING_DEPENDENT`, `BUILDING`, `MASTERED`.

This is intentionally deterministic and explainable for MVP. Machine learning is deferred until real learner trajectories and voluntary exam outcomes exist.
