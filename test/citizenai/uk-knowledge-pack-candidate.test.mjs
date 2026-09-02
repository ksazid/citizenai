import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_CANDIDATE_MANIFEST, UK_CANDIDATE_PACK, validateUkCandidatePack } from '../../src/citizenai/uk-knowledge-pack-candidate.mjs';

test('UK coverage candidate validates with the expected inventory', () => {
  const result = validateUkCandidatePack();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { sources: 58, evidence: 59, concepts: 59, facts: 59, questions: 177 });
});

test('candidate remains review-only and cannot claim exam completeness', () => {
  assert.equal(UK_CANDIDATE_MANIFEST.status, 'review');
  assert.equal(UK_CANDIDATE_MANIFEST.coverage.officialGuideAligned, false);
  assert.equal(UK_CANDIDATE_MANIFEST.coverage.examComplete, false);
  assert.equal(UK_CANDIDATE_MANIFEST.coverage.activationAllowed, false);
  assert.equal(UK_CANDIDATE_MANIFEST.sourceSnapshotPolicy.historicalBackfillComplete, false);
  assert.ok(UK_CANDIDATE_MANIFEST.coverage.openGaps.length > 0);
});

test('hardened candidate questions have unique option ids and one canonical correct answer', () => {
  const facts = new Map(UK_CANDIDATE_PACK.facts.map((fact) => [fact.id, fact]));
  const candidateQuestions = UK_CANDIDATE_PACK.questions.filter((question) => question.packVersion === UK_CANDIDATE_MANIFEST.version);
  assert.equal(candidateQuestions.length, 60);
  for (const question of candidateQuestions) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options.map((option) => option.id)).size, 4, question.id);
    const correct = question.options.find((option) => option.id === question.correctOptionId);
    assert.ok(correct, question.id);
    assert.equal(correct.text, facts.get(question.factId).canonicalValue, question.id);
    assert.equal(question.options.filter((option) => option.text === correct.text).length, 1, question.id);
  }
});

test('candidate keeps three variants per concept across all 59 concepts', () => {
  const counts = new Map();
  for (const question of UK_CANDIDATE_PACK.questions) counts.set(question.conceptId, (counts.get(question.conceptId) ?? 0) + 1);
  assert.equal(counts.size, 59);
  for (const [conceptId, count] of counts) assert.equal(count, 3, conceptId);
});

test('candidate includes the major final-pass history, migration, literature, science and national-day concepts', () => {
  const ids = new Set(UK_CANDIDATE_PACK.concepts.map((concept) => concept.id));
  for (const expected of [
    'reformation-parliament', 'gunpowder-plot', 'glorious-revolution',
    'indian-independence-1947', 'windrush-generation',
    'william-shakespeare', 'jane-austen', 'robert-burns',
    'isaac-newton', 'charles-darwin', 'alexander-fleming', 'alan-turing', 'tim-berners-lee',
    'st-georges-day', 'st-davids-day', 'st-andrews-day', 'st-patricks-day'
  ]) assert.ok(ids.has(expected), expected);
});
