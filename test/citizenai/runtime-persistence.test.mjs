import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRuntimeRepository } from '../../src/citizenai/runtime-repository.mjs';
import { createRuntimeService } from '../../src/citizenai/runtime-service.mjs';
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST } from '../../src/citizenai/uk-active-pack.mjs';

test('runtime persists learner evidence and delegates readiness/study decisions to certified engines', async () => {
  const repository = new MemoryRuntimeRepository();
  const service = createRuntimeService({ repository });
  const learner = await service.createLearner({
    examDate: '2026-09-30',
    explanationLanguage: 'English',
    preparation: 'Some'
  });

  assert.equal(learner.pack.version, UK_ACTIVE_PACK_MANIFEST.version);
  assert.equal(learner.countryPackId, UK_ACTIVE_PACK_MANIFEST.id);

  let done = false;
  for (let i = 0; i < 24 && !done; i += 1) {
    const next = await service.nextDiagnosticQuestion(learner.id);
    const full = UK_ACTIVE_PACK.questions.find((question) => question.id === next.question.id);
    const result = await service.recordAttempt({
      learnerId: learner.id,
      questionId: next.question.id,
      optionId: full.correctOptionId,
      sessionType: 'diagnostic',
      responseMs: 900
    });
    done = result.diagnosticDone;
  }

  const attempts = await repository.listAttempts(learner.id);
  assert.ok(attempts.length >= 20 && attempts.length <= 24);
  assert.equal(attempts.every((attempt) => attempt.correct), true);

  const masteries = await repository.listMasteries(learner.id);
  assert.ok(masteries.length > 0);
  assert.ok(masteries.every((row) => row.masteryMean > 0.5));

  const dashboard = await service.dashboard(learner.id);
  assert.equal(dashboard.pack.version, UK_ACTIVE_PACK_MANIFEST.version);
  assert.equal(typeof dashboard.readiness.score, 'number');
  assert.equal(typeof dashboard.readiness.confidence, 'number');
  assert.ok(Array.isArray(dashboard.studyPlan.activities));
  assert.equal(dashboard.diagnosticAnswered, attempts.length);
});

test('runtime persists snapshot, mock state and exam outcome', async () => {
  const repository = new MemoryRuntimeRepository();
  const service = createRuntimeService({ repository });
  const learner = await service.createLearner({ examDate: '2026-10-10' });

  const snapshot = await service.saveSnapshot(learner.id, { screen: 'home', schemaVersion: 1 });
  assert.equal(snapshot.packVersion, UK_ACTIVE_PACK_MANIFEST.version);
  assert.deepEqual((await service.getSnapshot(learner.id)).state, { screen: 'home', schemaVersion: 1 });

  const mock = await service.startMock(learner.id);
  assert.equal(mock.questionCount, 24);
  assert.equal(mock.questions.length, 24);
  const first = mock.questions[0];
  const full = UK_ACTIVE_PACK.questions.find((question) => question.id === first.id);
  const saved = await service.answerMock(mock.id, { questionId: first.id, optionId: full.correctOptionId });
  assert.equal(saved.saved, true);
  assert.equal(saved.answered, 1);

  const outcome = await service.saveExamOutcome({ learnerId: learner.id, result: 'passed', consentToCalibration: true });
  assert.equal(outcome.result, 'passed');
  assert.equal(outcome.consentToCalibration, true);
});

test('active pack remains the only runtime content authority', async () => {
  const repository = new MemoryRuntimeRepository();
  const service = createRuntimeService({ repository });
  const learner = await service.createLearner({});
  const next = await service.nextDiagnosticQuestion(learner.id);
  assert.ok(UK_ACTIVE_PACK.questions.some((question) => question.id === next.question.id));
  assert.equal('correctOptionId' in next.question, false, 'API must not leak the correct answer');
});
