import test from 'node:test';
import assert from 'node:assert/strict';

const databaseUrl = process.env.CITIZENAI_TEST_DATABASE_URL;

test('PostgreSQL persists CitizenAI learner, attempts and mastery across repository instances', { skip: !databaseUrl }, async () => {
  const { createPostgresPool, migrateRuntime } = await import('../../src/citizenai/api-server.mjs');
  const { PostgresRuntimeRepository } = await import('../../src/citizenai/runtime-repository.mjs');
  const { createRuntimeService } = await import('../../src/citizenai/runtime-service.mjs');
  const { UK_ACTIVE_PACK } = await import('../../src/citizenai/uk-active-pack.mjs');

  const pool = await createPostgresPool(databaseUrl);
  try {
    await migrateRuntime(pool);
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
