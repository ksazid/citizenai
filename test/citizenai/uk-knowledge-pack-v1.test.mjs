import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_PACK_MANIFEST, UK_PACK_V1, UK_QUESTIONS, validateUkPackV1 } from '../../src/citizenai/uk-knowledge-pack-v1.mjs';

test('UK foundation pack has complete provenance and official-source authority', () => {
  const result = validateUkPackV1();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { sources: 13, evidence: 13, concepts: 13, facts: 13, questions: 39 });
});

test('UK pack preserves the official current test contract without claiming guaranteed readiness', () => {
  assert.deepEqual(UK_PACK_MANIFEST.examContract, {
    questions: 24,
    minutes: 45,
    passMark: 0.75,
    sourceId: 'src-govuk-test'
  });
  assert.equal(UK_PACK_MANIFEST.coverage.examComplete, false);
  assert.equal(UK_PACK_MANIFEST.coverage.activationAllowed, false);
});

test('every question is independently authored, uniquely identified and linked to an approved fact', () => {
  const facts = new Map(UK_PACK_V1.facts.map((fact) => [fact.id, fact]));
  const ids = new Set();
  for (const question of UK_QUESTIONS) {
    assert.equal(ids.has(question.id), false, `duplicate question ${question.id}`);
    ids.add(question.id);
    assert.ok(facts.has(question.factId), `missing fact for ${question.id}`);
    assert.equal(question.status, 'approved');
    assert.equal(question.provenanceStatus, 'verified');
    assert.equal(/official guide for new residents|life in the uk handbook/i.test(question.stem), false, `handbook-derived wording guard: ${question.id}`);
    assert.equal(question.options.length, 4);
  }
});

test('question pool supports full mock generation and three variants per concept', () => {
  assert.ok(UK_QUESTIONS.length >= 24);
  const counts = new Map();
  for (const question of UK_QUESTIONS) counts.set(question.conceptId, (counts.get(question.conceptId) ?? 0) + 1);
  for (const [conceptId, count] of counts) assert.equal(count, 3, `${conceptId} should have three variants`);
});
