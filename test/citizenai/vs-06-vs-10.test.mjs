import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReadiness, READINESS } from '../../src/citizenai/pass-intelligence.mjs';
import { buildStudyPlan, classifyActivity } from '../../src/citizenai/study-engine.mjs';
import { remediationForAttempt, buildTransferSequence } from '../../src/citizenai/learning.mjs';
import { createMock, recordMockAnswer, completeMock, UK_MOCK_CONTRACT } from '../../src/citizenai/mock-test.mjs';
import { canUnlockPassReady, maintenanceMode, recordExamOutcome } from '../../src/citizenai/pass-ready.mjs';

const strongConcepts = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, effectiveMastery: 0.95, importance: 0.8 }));

test('VS-06 requires coverage confidence before Pass Ready', () => {
  const weakCoverage = buildReadiness({ concepts: strongConcepts, coverage: { domains: [{ tested: true }], importantConcepts: [{ tested: false }], mocks: 0, variantDiversity: 0.2 } });
  assert.equal(weakCoverage.status, READINESS.MORE_EVIDENCE);
  const strongCoverage = buildReadiness({ concepts: strongConcepts, coverage: { domains: [{ tested: true }, { tested: true }], importantConcepts: [{ tested: true }, { tested: true }], mocks: 2, variantDiversity: 1 } });
  assert.ok([READINESS.PASS_READY, READINESS.STRONGLY_READY].includes(strongCoverage.status));
});

test('VS-07 prioritizes weak or forgotten concepts', () => {
  const plan = buildStudyPlan({ concepts: [
    { id: 'strong', importance: 0.8, effectiveMastery: 0.95, retention: 0.95, confidence: 0.9, studyMinutes: 3 },
    { id: 'weak', importance: 0.9, effectiveMastery: 0.35, retention: 0.5, confidence: 0.5, studyMinutes: 3 }
  ], availableMinutes: 3 });
  assert.equal(plan.activities[0].conceptId, 'weak');
  assert.equal(classifyActivity({ exposureCount: 3, misconceptionCode: 'x' }), 'compare');
});

test('VS-08 routes misconceptions through compare and transfer', () => {
  assert.equal(remediationForAttempt({ correct: false, misconceptionCode: 'parliament-vs-government' }).type, 'compare');
  const sequence = buildTransferSequence({ conceptId: 'gov', misconceptionCode: 'x' });
  assert.deepEqual(sequence.map((s) => s.type), ['compare', 'recall', 'unseen_variant']);
});

test('VS-09 mock contract is 24 questions / 45 minutes and scores pass', () => {
  const pool = Array.from({ length: 30 }, (_, i) => ({ id: `q${i}`, conceptId: `c${i}`, correctOptionId: 'a' }));
  let mock = createMock({ questionPool: pool });
  assert.equal(mock.questions.length, 24);
  assert.equal(mock.durationMinutes, 45);
  for (const q of mock.questions) mock = recordMockAnswer(mock, { questionId: q.id, optionId: 'a' });
  const result = completeMock(mock);
  assert.equal(result.correct, UK_MOCK_CONTRACT.questions);
  assert.equal(result.passed, true);
});

test('VS-10 unlocks only with readiness, mocks and no critical gaps', () => {
  const readiness = { status: READINESS.PASS_READY, confidence: 0.9 };
  assert.equal(canUnlockPassReady({ readiness, mocksPassed: 2, criticalWeakConcepts: 0 }), true);
  assert.equal(canUnlockPassReady({ readiness, mocksPassed: 1, criticalWeakConcepts: 0 }), false);
  assert.equal(maintenanceMode({ daysUntilExam: 0, concepts: [] }).state, 'test_day');
  assert.equal(recordExamOutcome({ result: 'passed', consentToCalibration: true }).consentToCalibration, true);
});
