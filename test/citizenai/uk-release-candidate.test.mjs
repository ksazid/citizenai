import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_RELEASE_CANDIDATE_PACK, UK_RELEASE_CANDIDATE_MANIFEST, validateUkReleaseCandidate } from '../../src/citizenai/uk-release-candidate.mjs';
import { buildReleaseCandidateReadiness, certifyReleaseCandidateCoverage, assertCoverageCertificationForPack } from '../../src/citizenai/uk-coverage-certification.mjs';

test('UK release candidate validates with sports and pre-1066 expansion', () => {
  const result = validateUkReleaseCandidate();
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.deepEqual(result.counts, { sources: 65, evidence: 68, concepts: 68, facts: 68, questions: 204 });
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.status, 'release_candidate');
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.sportsSourcePolicyClosed, true);
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.pre1066BreadthMapped, true);
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.sourceSnapshotPolicy.historicalBackfillComplete, true);
});

test('sports and pre-1066 concepts are present', () => {
  const ids = new Set(UK_RELEASE_CANDIDATE_PACK.concepts.map((concept) => concept.id));
  for (const id of ['roman-britain','early-medieval-britain','anglo-saxon-settlement','viking-britain','sutton-hoo','uk-sport-role','national-sporting-events','popular-spectator-sports','wimbledon']) {
    assert.ok(ids.has(id), `missing ${id}`);
  }
});

test('release candidate source policy remains public-authority only', () => {
  for (const source of UK_RELEASE_CANDIDATE_PACK.sources) {
    assert.ok(['government','public_authority'].includes(source.sourceType), `${source.id} has disallowed type ${source.sourceType}`);
  }
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.sourcePolicy.commercialStudySourcesAllowed, false);
});

test('all release-candidate questions have four unique options and exactly one selected correct answer', () => {
  for (const question of UK_RELEASE_CANDIDATE_PACK.questions) {
    assert.equal(question.options.length, 4, question.id);
    assert.equal(new Set(question.options.map((option) => option.id)).size, 4, question.id);
    assert.equal(question.options.filter((option) => option.id === question.correctOptionId).length, 1, question.id);
  }
});

const snapshotsForEverySource = UK_RELEASE_CANDIDATE_PACK.sources.map((source, index) => ({
  sourceId: source.id,
  url: source.url,
  bodyHash: String(index).padStart(64, '0').slice(-64),
  retrievedAt: '2026-09-02T10:30:00.000Z',
  normalizedCharCount: 1000,
  normalizationVersion: 1
}));

test('engineering readiness reaches green when every live-source snapshot is present', () => {
  const validation = validateUkReleaseCandidate();
  const readiness = buildReleaseCandidateReadiness({ pack: UK_RELEASE_CANDIDATE_PACK, validation, snapshots: snapshotsForEverySource });
  assert.equal(readiness.engineeringReady, true, readiness.engineeringBlockers.join(', '));
  assert.deepEqual(readiness.engineeringBlockers, []);
  assert.equal(readiness.humanCertificationRequired, true);
});

test('human exact-version approval is the final certification action', () => {
  const validation = validateUkReleaseCandidate();
  const blocked = certifyReleaseCandidateCoverage({
    pack: UK_RELEASE_CANDIDATE_PACK,
    validation,
    snapshots: snapshotsForEverySource,
    reviewerId: 'human-reviewer',
    approved: false
  });
  assert.equal(blocked.approved, false);
  assert.ok(blocked.reasons.includes('human_coverage_approval_missing'));

  const approved = certifyReleaseCandidateCoverage({
    pack: UK_RELEASE_CANDIDATE_PACK,
    validation,
    snapshots: snapshotsForEverySource,
    reviewerId: 'human-reviewer',
    approved: true,
    notes: 'Explicit exact-version coverage review.'
  });
  assert.equal(approved.approved, true);
  assert.equal(approved.exactPackVersion, UK_RELEASE_CANDIDATE_MANIFEST.version);
  assert.equal(assertCoverageCertificationForPack({ pack: UK_RELEASE_CANDIDATE_PACK, certification: approved }), true);
});

test('release candidate itself never claims exam completeness before human certification', () => {
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.officialGuideAligned, false);
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.examComplete, false);
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.activationAllowed, false);
  assert.equal(UK_RELEASE_CANDIDATE_MANIFEST.coverage.openGaps.length, 1);
});
