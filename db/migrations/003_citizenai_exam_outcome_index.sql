BEGIN;

CREATE INDEX IF NOT EXISTS citizenai_exam_outcome_learner_idx
  ON citizenai_exam_outcome(learner_id, recorded_at DESC);

COMMIT;
