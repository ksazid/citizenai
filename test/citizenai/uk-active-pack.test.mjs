import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_RC4_COVERAGE_CERTIFICATION } from '../../src/citizenai/uk-rc4-approval.mjs';
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST, validateUkActivePack } from '../../src/citizenai/uk-active-pack.mjs';

test('RC4 human approval is exact-version and immutable', () => {
  assert.equal(UK_RC4_COVERAGE_CERTIFICATION.approved, true);
  assert.equal(UK_RC4_COVERAGE_CERTIFICATION.exactPackVersion, '2026.09.02-rc.4');
  assert.equal(UK_RC4_COVERAGE_CERTIFICATION.sourceSnapshotEvidence.snapshotCoverage, '65/65');
  assert.equal(UK_RC4_COVERAGE_CERTIFICATION.reviewerId, 'ksazid');
});

test('certified RC4 activates as immutable production pack', () => {
  const result = validateUkActivePack();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { sources: 65, evidence: 68, concepts: 68, facts: 68, questions: 204 });
  assert.equal(UK_ACTIVE_PACK_MANIFEST.status, 'active');
  assert.equal(UK_ACTIVE_PACK_MANIFEST.coverage.activationAllowed, true);
  assert.equal(UK_ACTIVE_PACK_MANIFEST.coverage.humanCoverageCertified, true);
});

test('activation does not overclaim official-guide alignment or pass certainty', () => {
  assert.equal(UK_ACTIVE_PACK_MANIFEST.coverage.officialGuideAligned, false);
  assert.equal(UK_ACTIVE_PACK_MANIFEST.coverage.examComplete, false);
  assert.equal(UK_ACTIVE_PACK_MANIFEST.coverage.guaranteedPass, false);
});

test('active pack keeps the certified factual inventory', () => {
  assert.equal(UK_ACTIVE_PACK.sources.length, 65);
  assert.equal(UK_ACTIVE_PACK.facts.length, 68);
  assert.equal(UK_ACTIVE_PACK.questions.length, 204);
  assert.equal(new Set(UK_ACTIVE_PACK.questions.map((q) => q.id)).size, 204);
  assert.equal(UK_ACTIVE_PACK_MANIFEST.contentDigest.length, 64);
});

test('all active records point at the immutable active version', () => {
  for (const source of UK_ACTIVE_PACK.sources) assert.equal(source.packId, UK_ACTIVE_PACK_MANIFEST.id, source.id);
  for (const question of UK_ACTIVE_PACK.questions) assert.equal(question.packVersion, UK_ACTIVE_PACK_MANIFEST.version, question.id);
});
