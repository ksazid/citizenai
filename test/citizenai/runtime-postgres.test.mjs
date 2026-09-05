import test from 'node:test';
import assert from 'node:assert/strict';

const databaseUrl = process.env.CITIZENAI_TEST_DATABASE_URL;
const RUNTIME_TABLES = [
  'citizenai_learner',
  'citizenai_attempt',
  'citizenai_concept_mastery',
  'citizenai_mock',
  'citizenai_exam_outcome',
  'citizenai_runtime_snapshot'
];

test('PostgreSQL persists CitizenAI learner, attempts and mastery across repository instances', { skip: !databaseUrl }, async () => {
  const { createPostgresPool, migrateRuntime } = await import('../../src/citizenai/api-server.mjs');
  const { PostgresRuntimeRepository } = await import('../../src/citizenai/runtime-repository.mjs');
  const { createRuntimeService } = await import('../../src/citizenai/runtime-service.mjs');
  const { UK_ACTIVE_PACK } = await import('../../src/citizenai/uk-active-pack.mjs');

  const pool = await createPostgresPool(databaseUrl);
  try {
    await migrateRuntime(pool);

    const rls = await pool.query(`
      SELECT c.relname, c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY($1::text[])
      ORDER BY c.relname
    `, [RUNTIME_TABLES]);
    assert.equal(rls.rows.length, RUNTIME_TABLES.length);
    assert.equal(rls.rows.every((row) => row.relrowsecurity === true), true, 'every CitizenAI public runtime table must have RLS enabled');

    const examOutcomeIndex = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'citizenai_exam_outcome'
        AND indexname = 'citizenai_exam_outcome_learner_idx'
    `);
    assert.equal(examOutcomeIndex.rows.length, 1, 'exam outcome learner foreign key must have a covering index');

    const repository = new PostgresRuntimeRepository(pool);
    const service = createRuntimeService({ repository });
    const learner = await service.createLearner({ examDate: '2026-10-01' });
    const next = await service.nextDiagnosticQuestion(learner.id);
    const full = UK_ACTIVE_PACK.questions.find((question) => question.id === next.question.id);
    await service.recordAttempt({
      learnerId: learner.id,
      questionId: next.question.id,
      optionId: full.correctOptionId,
      sessionType: 'diagnostic',
      responseMs: 740
    });

    const secondRepository = new PostgresRuntimeRepository(pool);
    const attempts = await secondRepository.listAttempts(learner.id);
    const masteries = await secondRepository.listMasteries(learner.id);
    assert.equal(attempts.length, 1);
    assert.equal(attempts[0].correct, true);
    assert.equal(masteries.length, 1);
    assert.equal(masteries[0].conceptId, next.question.conceptId);
    assert.ok(masteries[0].masteryMean > 0.5);

    const secondService = createRuntimeService({ repository: secondRepository });
    const dashboard = await secondService.dashboard(learner.id);
    assert.equal(dashboard.diagnosticAnswered, 1);
    assert.ok(Array.isArray(dashboard.studyPlan.activities));
  } finally {
    await pool.end();
  }
});
