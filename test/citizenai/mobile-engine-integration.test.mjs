import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectDiagnosticQuestion } from '../../src/citizenai/diagnostic.mjs';
import { createMasteryState, effectiveMastery } from '../../src/citizenai/mastery.mjs';
import { buildReadiness } from '../../src/citizenai/pass-intelligence.mjs';
import { buildStudyPlan } from '../../src/citizenai/study-engine.mjs';
import { createMock, recordMockAnswer, completeMock } from '../../src/citizenai/mock-test.mjs';
import { canUnlockPassReady } from '../../src/citizenai/pass-ready.mjs';

const concepts = [
  { id: 'g', domainId: 'government', importance: 1, baseDifficulty: 0.6, studyMinutes: 4 },
  { id: 'h', domainId: 'history', importance: 0.9, baseDifficulty: 0.5, studyMinutes: 4 },
  { id: 'r', domainId: 'rights', importance: 0.9, baseDifficulty: 0.5, studyMinutes: 3 },
  { id: 'c', domainId: 'culture', importance: 0.8, baseDifficulty: 0.4, studyMinutes: 3 }
];

test('mobile app imports the certified domain engines instead of duplicating them', () => {
  const runtime = fs.readFileSync(new URL('../../apps/mobile/src/runtime.tsx', import.meta.url), 'utf8');
  const app = fs.readFileSync(new URL('../../apps/mobile/App.tsx', import.meta.url), 'utf8');
  for (const module of ['diagnostic.mjs', 'mastery.mjs', 'pass-intelligence.mjs', 'study-engine.mjs', 'learning.mjs', 'mock-test.mjs', 'pass-ready.mjs']) {
    assert.match(runtime, new RegExp(module.replace('.', '\\.')));
  }
  assert.match(app, /CitizenAIRuntimeProvider/);
  assert.match(app, /integratedCoreScreens/);
  assert.match(app, /integratedLifecycleScreens/);
});

test('diagnostic selection feeds the same concept model used by study planning', () => {
  const selected = selectDiagnosticQuestion({ concepts, attemptsByConcept: new Map(), limit: 4 });
  assert.equal(selected.length, 4);
  const states = concepts.map((concept) => createMasteryState({ conceptId: concept.id }));
  const signals = concepts.map((concept, i) => ({ ...concept, effectiveMastery: effectiveMastery(states[i], new Date().toISOString()), retention: 0.5, confidence: 0, exposureCount: 0 }));
  const plan = buildStudyPlan({ concepts: signals, availableMinutes: 15 });
  assert.ok(plan.activities.length > 0);
  assert.ok(plan.durationMinutes <= 15);
});

test('readiness, mock result and Pass Ready gate compose end to end', () => {
  const now = new Date().toISOString();
  const strongSignals = concepts.map((concept) => {
    const state = createMasteryState({ conceptId: concept.id, alpha: 99, beta: 1, stabilityDays: 60, exposureCount: 12, variantIds: ['v1','v2','v3'], lastSeenAt: now });
    return { ...concept, effectiveMastery: effectiveMastery(state, now), retention: 1, confidence: 1, variantDiversity: 1 };
  });
  const readiness = buildReadiness({
    concepts: strongSignals,
    coverage: {
      domains: concepts.map((c) => ({ id: c.domainId, tested: true })),
      importantConcepts: concepts.map((c) => ({ id: c.id, tested: true })),
      mocks: 2,
      variantDiversity: 1
    }
  });
  assert.ok(readiness.score >= 0.85);
  assert.ok(readiness.confidence >= 0.75);

  const questionPool = Array.from({ length: 24 }, (_, i) => ({ id: `q${i}`, conceptId: concepts[i % concepts.length].id, correctOptionId: 'a' }));
  let mock = createMock({ questionPool, seed: 7 });
  for (const q of mock.questions) mock = recordMockAnswer(mock, { questionId: q.id, optionId: 'a' });
  const result = completeMock(mock);
  assert.equal(result.passed, true);
  assert.equal(result.correct, 24);
  assert.equal(canUnlockPassReady({ readiness, mocksPassed: 2, criticalWeakConcepts: 0 }), true);
});
