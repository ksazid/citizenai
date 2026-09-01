# CitizenAI — VS-06 to VS-10

## VS-06 Pass Intelligence

- Monte Carlo readiness simulation over a 24-question exam model.
- Separate coverage-confidence calculation.
- Pass Ready cannot unlock while evidence confidence is below 0.75.
- Statuses: not ready, building, nearly ready, pass ready, strongly ready, more evidence needed.
- Output exposes weakest concepts and confidence blocking instead of presenting a guaranteed pass probability.

## VS-07 Study Engine

- Prioritizes importance, weakness, forgetting risk, uncertainty, expected learning gain and study cost.
- Selects Learn / Compare / Recall / unseen variant / measurement / review.
- Builds a bounded daily plan and review schedule.

## VS-08 Learning UX domain contract

- Mistakes route to concept-appropriate remediation instead of blind repetition.
- Misconceptions route through Compare → Recall → unseen transfer question.
- Session completion records time, concepts strengthened and readiness delta.

## VS-09 Mock Test

- Frozen UK mock contract: 24 questions, 45 minutes, 75% pass threshold.
- No correctness feedback during the mock.
- Completion produces score, pass/fail, concept errors and lower mastery-evidence weighting than targeted learning.

## VS-10 Pass Ready

Pass Ready requires all of:

- readiness status pass-ready or strongly-ready;
- coverage confidence >= 0.75;
- at least two passed mocks;
- zero critical weak concepts.

Maintenance mode may explicitly recommend no study when knowledge remains stable. Exam countdown supports maintenance, final refresh, day-before, test-day and post-exam states. Actual exam outcome is collected only with explicit calibration consent.

## Integrity boundaries

- Readiness is an estimate, never a guarantee.
- No leaked or claimed real exam distribution is used.
- Question/content provenance remains governed by VS-03.
- Actual learner outcomes will later be used to calibrate the model only with consent.
- Multi-agent execution remains disabled.
