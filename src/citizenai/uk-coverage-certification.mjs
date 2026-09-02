import { sourceSnapshotCoverage } from './uk-source-snapshots.mjs';

export function buildUkCoverageReport({ pack, validation, snapshots = [] }) {
  if (!pack?.manifest?.version) throw new Error('pack with manifest version required');
  const snapshotCoverage = sourceSnapshotCoverage({ sources: pack.sources ?? [], snapshots });
  const blockers = [];

  if (!validation?.ok) blockers.push('pack_validation_failed');
  if (pack.manifest.status !== 'review') blockers.push('pack_not_in_review');
  if (!pack.manifest.coverage?.officialGuideAligned) blockers.push('official_guide_alignment_not_certified');
  if (!pack.manifest.coverage?.examComplete) blockers.push('exam_coverage_not_complete');
  if (!pack.manifest.coverage?.activationAllowed) blockers.push('activation_not_allowed');
  if ((pack.manifest.coverage?.openGaps ?? []).length > 0) blockers.push('coverage_gaps_open');
  if (!snapshotCoverage.complete) blockers.push('source_snapshot_backfill_incomplete');

  return Object.freeze({
    packId: pack.manifest.id,
    exactPackVersion: pack.manifest.version,
    validationOk: Boolean(validation?.ok),
    coverageStatus: pack.manifest.coverage?.status ?? 'unknown',
    openGaps: Object.freeze([...(pack.manifest.coverage?.openGaps ?? [])]),
    snapshotCoverage,
    blockers: Object.freeze([...new Set(blockers)]),
    certifiable: blockers.length === 0
  });
}

export function certifyUkCoverage({ pack, validation, snapshots = [], reviewerId, reviewedAt = new Date().toISOString() }) {
  const report = buildUkCoverageReport({ pack, validation, snapshots });
  const blockers = [...report.blockers];
  if (!reviewerId) blockers.push('coverage_reviewer_missing');

  if (blockers.length > 0) {
    return Object.freeze({
      status: 'blocked',
      approved: false,
      reviewerId: reviewerId ?? null,
      reviewedAt,
      exactPackVersion: report.exactPackVersion,
      reasons: Object.freeze([...new Set(blockers)]),
      report
    });
  }

  return Object.freeze({
    status: 'approved',
    approved: true,
    reviewerId,
    reviewedAt,
    exactPackVersion: report.exactPackVersion,
    reasons: Object.freeze([]),
    report
  });
}

export function assertCoverageCertificationForPack({ pack, certification }) {
  if (!certification?.approved) throw new Error('coverage certification not approved');
  if (certification.exactPackVersion !== pack?.manifest?.version) throw new Error('coverage certification version mismatch');
  if (!certification.reviewerId) throw new Error('coverage certification reviewer missing');
  return true;
}
