import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_PACK_V2, UK_PACK_V2_MANIFEST, validateUkPackV2 } from '../../src/citizenai/uk-knowledge-pack-v2.mjs';
import { UK_PACK_MANIFEST } from '../../src/citizenai/uk-knowledge-pack-v1.mjs';
import { ukPackReleaseGate } from '../../src/citizenai/uk-pack-ops.mjs';

test('expanded UK review pack validates with 39 concepts and 117 questions', () => {
  const result = validateUkPackV2();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { sources: 38, evidence: 39, concepts: 39, facts: 39, questions: 117 });
});

test('expanded coverage remains review-only and cannot claim exam completeness', () => {
  assert.equal(UK_PACK_V2_MANIFEST.status, 'review');
  assert.equal(UK_PACK_V2_MANIFEST.coverage.officialGuideAligned, false);
  assert.equal(UK_PACK_V2_MANIFEST.coverage.examComplete, false);
  assert.equal(UK_PACK_V2_MANIFEST.coverage.activationAllowed, false);
  assert.ok(UK_PACK_V2_MANIFEST.coverage.openGaps.length > 0);
});

test('all expanded questions preserve fact provenance and four-option MCQ contract', () => {
  const facts = new Map(UK_PACK_V2.facts.map((fact) => [fact.id, fact]));
  const allowedPackVersions = new Set([UK_PACK_MANIFEST.version, UK_PACK_V2_MANIFEST.version]);
  for (const question of UK_PACK_V2.questions) {
    assert.ok(question.factId, `missing factId: ${question.id}`);
    assert.ok(facts.has(question.factId), `fact not found: ${question.id}`);
    assert.ok(allowedPackVersions.has(question.packVersion), `unexpected pack version: ${question.id} -> ${question.packVersion}`);
    assert.equal(question.options.length, 4, `wrong option count: ${question.id}`);
    assert.ok(question.options.some((option) => option.id === question.correctOptionId), `correct option missing: ${question.id}`);
    assert.equal(question.provenanceStatus, 'verified');
  }
});

test('new coverage includes government, rights, history and culture expansions', () => {
  const ids = new Set(UK_PACK_V2.concepts.map((concept) => concept.id));
  for (const expected of [
    'constitution-uncodified', 'parliamentary-sovereignty', 'prime-minister-cabinet',
    'jury-service', 'fundamental-values', 'freedom-religion-belief',
    'norman-conquest', 'english-civil-war', 'industrial-revolution',
    'first-world-war', 'second-world-war', 'attlee-postwar', 'union-flag'
  ]) assert.ok(ids.has(expected), `missing expanded concept: ${expected}`);
});

test('current-rule concepts are marked dynamic where source changes can affect answers', () => {
  const facts = new Map(UK_PACK_V2.facts.map((fact) => [fact.conceptId, fact]));
  for (const conceptId of ['electoral-register','voting-age-general-election','by-elections','local-government','jury-service','fundamental-values','freedom-religion-belief','union-flag']) {
    assert.equal(facts.get(conceptId)?.dynamic, true, `${conceptId} should be dynamic`);
  }
});

test('release gate stays closed even when a reviewer is supplied', () => {
  const validation = validateUkPackV2();
  const gate = ukPackReleaseGate({
    manifest: UK_PACK_V2_MANIFEST,
    validation,
    coverageCertification: { approved: true, reviewerId: 'coverage-reviewer', exactPackVersion: UK_PACK_V2_MANIFEST.version }
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.reasons.includes('exam_coverage_not_complete'));
  assert.ok(gate.reasons.includes('activation_not_allowed'));
});
