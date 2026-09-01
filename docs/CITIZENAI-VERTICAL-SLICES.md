# CitizenAI — Vertical Slice Plan

## VS-01 Foundation
Repo tailoring, architecture baseline, environments, CI, mobile/API shells, PES-v2 product intake, and delivery conventions.

## VS-02 Design System
CitizenAI UI DNA, tokens, typography, spacing, components, interaction states, accessibility baseline, and implementation-ready screen primitives.

## VS-03 UK Knowledge Pack
Versioned domains, concepts, facts, evidence, provenance, source refresh/change detection, content review, and pack publication.

## VS-04 Diagnostic
Adaptive diagnostic session, domain/concept coverage, baseline measurement, confidence handling, and diagnostic result.

## VS-05 Mastery Engine
Beta-distribution mastery, evidence weighting, variant diversity, retention decay, uncertainty, and concept state transitions.

## VS-06 Pass Intelligence
Coverage confidence, Monte Carlo readiness simulation, readiness status thresholds, conservative unlock rules, and explainable output.

## VS-07 Study Engine
Next-best-study prioritization, study-plan assembly, learning-cost estimates, review scheduling, and activity selection.

## VS-08 Learning UX
Learn, Compare, Recall, Question, explanation, misconception remediation, transfer questions, and session completion.

## VS-09 Mock Test
24-question / 45-minute test flow, review/submit, mock scoring, mastery evidence weighting, and result analysis.

## VS-10 Pass Ready
Pass Ready unlock, maintenance mode, exam countdown, test-day state, and post-exam outcome capture.

## VS-11 Admin / Content Ops
Source change review, affected-fact/question impact analysis, approval/rejection, immutable pack publishing, and auditability.

## VS-12 End-to-End Certification
Welcome → diagnostic → home → learning → mock → Pass Ready, with PES-v2 gates, evidence, exact-SHA certification, accessibility and functional QA.

## Sequencing constraints

- VS-02 may progress alongside late VS-01 once the shell is stable.
- VS-03 must establish canonical knowledge/provenance before production question generation.
- VS-05 depends on attempt/question semantics from VS-04.
- VS-06 depends on VS-05 and calibrated pack weighting assumptions.
- VS-07 depends on VS-05 and VS-06.
- VS-08 depends on VS-02 and VS-07.
- VS-09 depends on VS-03, VS-05 and VS-06.
- VS-10 depends on VS-06 and VS-09.
- VS-11 is required before production content publication.
- VS-12 certifies the integrated exact SHA only after all required upstream slices pass.

## PES-v2 posture

CitizenAI starts in Lite / single-worker mode. Multi-agent execution stays disabled until a measured workload proves a material quality or speed advantage under budget and governance gates.
