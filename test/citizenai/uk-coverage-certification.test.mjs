import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_CANDIDATE_PACK, UK_CANDIDATE_MANIFEST, validateUkCandidatePack } from '../../src/citizenai/uk-knowledge-pack-candidate.mjs';
import { buildUkCoverageReport, certifyUkCoverage, assertCoverageCertificationForPack } from '../../src/citizenai/uk-coverage-certification.mjs';
import { buildSourceSnapshot } from '../../src/citizenai/uk-source-snapshots.mjs';

test('current UK candidate report exposes the blocking conditions', () => {
  const report = buildUkCoverageReport({ pack: UK_CANDIDATE_PACK, validation: validateUkCandidatePack(), snapshots: [] });
  assert.equal(report.certifiable, false);
  assert.equal(report.exactPackVersion, UK_CANDIDATE_MANIFEST.version);
  assert.ok(report.blockers.includes('official_guide_alignment_not_certified'));
  assert.ok(report.blockers.includes('exam_coverage_not_complete'));
  assert.ok(report.blockers.includes('activation_not_allowed'));
  assert.ok(report.blockers.includes('coverage_gaps_open'));
  assert.ok(report.blockers.includes('source_snapshot_backfill_incomplete'));
});

test('human reviewer alone cannot approve incomplete coverage', () => {
  const result = certifyUkCoverage({
    pack: UK_CANDIDATE_PACK,
    validation: validateUkCandidatePack(),
    snapshots: [],
    reviewerId: 'coverage-reviewer'
  });
  assert.equal(result.approved, false);
  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('exam_coverage_not_complete'));
  assert.throws(() => assertCoverageCertificationForPack({ pack: UK_CANDIDATE_PACK, certification: result }), /not approved/);
});

test('snapshot backfill is independently measurable from coverage alignment', () => {
  const snapshots = UK_CANDIDATE_PACK.sources.map((source) => buildSourceSnapshot({
    sourceId: source.id,
    url: source.url,
    body: `Snapshot body for ${source.id}`,
    retrievedAt: '2026-09-02T11:30:00.000Z'
  }));
  const report = buildUkCoverageReport({ pack: UK_CANDIDATE_PACK, validation: validateUkCandidatePack(), snapshots });
  assert.equal(report.snapshotCoverage.complete, true);
  assert.equal(report.blockers.includes('source_snapshot_backfill_incomplete'), false);
  assert.equal(report.certifiable, false);
  assert.ok(report.blockers.includes('official_guide_alignment_not_certified'));
});
