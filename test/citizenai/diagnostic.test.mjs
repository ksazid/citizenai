import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDiagnosticQuestion, shouldCompleteDiagnostic, summarizeDiagnostic } from '../../src/citizenai/diagnostic.mjs';

test('diagnostic prioritizes important uncovered concepts', () => {
  const concepts = [
    { id: 'low', domainId: 'culture', importance: 0.2, baseDifficulty: 0.2 },
    { id: 'high', domainId: 'government', importance: 0.95, baseDifficulty: 0.7 }
  ];
  const selected = selectDiagnosticQuestion({ concepts, attemptsByConcept: new Map([['low', 2]]), limit: 1 });
  assert.equal(selected[0].id, 'high');
});

test('diagnostic only completes early after minimum evidence and coverage', () => {
  assert.equal(shouldCompleteDiagnostic({ answeredCount: 19, domainCoverage: 1, importantConceptCoverage: 1 }), false);
  assert.equal(shouldCompleteDiagnostic({ answeredCount: 20, domainCoverage: 1, importantConceptCoverage: 0.8 }), true);
  assert.equal(shouldCompleteDiagnostic({ answeredCount: 30, domainCoverage: 0.5, importantConceptCoverage: 0.5 }), true);
});

test('diagnostic summary is concept-importance weighted by domain', () => {
  const concepts = new Map([
    ['a', { id: 'a', domainId: 'history', importance: 1 }],
    ['b', { id: 'b', domainId: 'history', importance: 0 }]
  ]);
  const summary = summarizeDiagnostic({ answers: [{ conceptId: 'a', correct: true }, { conceptId: 'b', correct: false }], conceptsById: concepts });
  assert.equal(summary.history.answered, 2);
  assert.ok(summary.history.score > 50);
});
