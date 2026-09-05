BEGIN;

CREATE TABLE IF NOT EXISTS citizenai_learner_account (
  learner_id uuid PRIMARY KEY REFERENCES citizenai_learner(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS citizenai_learner_account_auth_user_idx
  ON citizenai_learner_account(auth_user_id);

ALTER TABLE citizenai_learner_account ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'citizenai_learner_account_auth_user_fk'
         AND conrelid = 'citizenai_learner_account'::regclass
     ) THEN
    ALTER TABLE citizenai_learner_account
      ADD CONSTRAINT citizenai_learner_account_auth_user_fk
      FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
DECLARE
  table_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     AND to_regprocedure('auth.uid()') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS citizenai_account_own_select ON citizenai_learner_account';
    EXECUTE 'CREATE POLICY citizenai_account_own_select ON citizenai_learner_account FOR SELECT TO authenticated USING (auth_user_id = (select auth.uid()))';

    EXECUTE 'DROP POLICY IF EXISTS citizenai_learner_own_select ON citizenai_learner';
    EXECUTE 'CREATE POLICY citizenai_learner_own_select ON citizenai_learner FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM citizenai_learner_account a WHERE a.learner_id = citizenai_learner.id AND a.auth_user_id = (select auth.uid())))';

    FOREACH table_name IN ARRAY ARRAY[
      'citizenai_attempt',
      'citizenai_concept_mastery',
      'citizenai_mock',
      'citizenai_exam_outcome',
      'citizenai_runtime_snapshot'
    ]
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', table_name || '_own_select', table_name);
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM citizenai_learner_account a WHERE a.learner_id = %I.learner_id AND a.auth_user_id = (select auth.uid())))',
        table_name || '_own_select', table_name, table_name
      );
    END LOOP;
  END IF;
END $$;

COMMIT;
