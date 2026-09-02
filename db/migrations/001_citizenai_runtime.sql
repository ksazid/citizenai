BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS citizenai_learner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_pack_id text NOT NULL,
  exam_date date,
  explanation_language text NOT NULL DEFAULT 'English',
  preparation text NOT NULL DEFAULT 'Some',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citizenai_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES citizenai_learner(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  concept_id text NOT NULL,
  session_type text NOT NULL CHECK (session_type IN ('diagnostic','practice','mock')),
  option_id text,
  correct boolean NOT NULL,
  response_ms integer,
  variant_id text,
  difficulty double precision NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS citizenai_attempt_learner_idx ON citizenai_attempt(learner_id, attempted_at);
CREATE INDEX IF NOT EXISTS citizenai_attempt_concept_idx ON citizenai_attempt(learner_id, concept_id);

CREATE TABLE IF NOT EXISTS citizenai_concept_mastery (
  learner_id uuid NOT NULL REFERENCES citizenai_learner(id) ON DELETE CASCADE,
  concept_id text NOT NULL,
  state jsonb NOT NULL,
  mastery_mean double precision NOT NULL,
  mastery_confidence double precision NOT NULL,
  retention double precision NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, concept_id)
);

CREATE TABLE IF NOT EXISTS citizenai_mock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES citizenai_learner(id) ON DELETE CASCADE,
  state jsonb NOT NULL,
  status text NOT NULL,
  passed boolean,
  score double precision,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS citizenai_mock_learner_idx ON citizenai_mock(learner_id, started_at DESC);

CREATE TABLE IF NOT EXISTS citizenai_exam_outcome (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES citizenai_learner(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('passed','failed','rescheduled')),
  consent_to_calibration boolean NOT NULL DEFAULT false,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citizenai_runtime_snapshot (
  learner_id uuid PRIMARY KEY REFERENCES citizenai_learner(id) ON DELETE CASCADE,
  pack_version text NOT NULL,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMIT;
