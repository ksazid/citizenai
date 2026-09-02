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

export function buildReleaseCandidateReadiness({ pack, validation, snapshots = [] }) {
  if (!pack?.manifest?.version) throw new Error('pack with manifest version required');
  const snapshotCoverage = sourceSnapshotCoverage({ sources: pack.sources ?? [], snapshots });
  const blockers = [];
  const coverage = pack.manifest.coverage ?? {};

  if (!validation?.ok) blockers.push('pack_validation_failed');
  if (pack.manifest.status !== 'review') blockers.push('pack_not_in_review');
  if (coverage.status !== 'release_candidate') blockers.push('not_release_candidate');
  if (!coverage.publicScopeMapComplete) blockers.push('public_scope_map_incomplete');
  if (!coverage.sportsSourcePolicyClosed) blockers.push('sports_source_policy_open');
  if (!coverage.pre1066BreadthMapped) blockers.push('pre1066_breadth_open');
  if (!snapshotCoverage.complete) blockers.push('source_snapshot_backfill_incomplete');

  const nonHumanGaps = (coverage.openGaps ?? []).filter((gap) => !/human coverage certification/i.test(gap));
  if (nonHumanGaps.length > 0) blockers.push('non_human_coverage_gaps_open');

  return Object.freeze({
    packId: pack.manifest.id,
    exactPackVersion: pack.manifest.version,
    validationOk: Boolean(validation?.ok),
    snapshotCoverage,
    engineeringBlockers: Object.freeze([...new Set(blockers)]),
    engineeringReady: blockers.length === 0,
    humanCertificationRequired: true,
    humanCertificationGap: (coverage.openGaps ?? []).find((gap) => /human coverage certification/i.test(gap)) ?? null
  });
}

export function certifyReleaseCandidateCoverage({ pack, validation, snapshots = [], reviewerId, approved, reviewedAt = new Date().toISOString(), notes = null }) {
  const readiness = buildReleaseCandidateReadiness({ pack, validation, snapshots });
  const reasons = [...readiness.engineeringBlockers];
  if (!reviewerId) reasons.push('coverage_reviewer_missing');
  if (approved !== true) reasons.push('human_coverage_approval_missing');

  if (reasons.length > 0) {
    return Object.freeze({
      status: 'blocked',
      approved: false,
      reviewerId: reviewerId ?? null,
      reviewedAt,
      exactPackVersion: readiness.exactPackVersion,
      notes,
      reasons: Object.freeze([...new Set(reasons)]),
      readiness
    });
  }

  return Object.freeze({
    status: 'approved',
    approved: true,
    reviewerId,
    reviewedAt,
    exactPackVersion: readiness.exactPackVersion,
    notes,
    reasons: Object.freeze([]),
    readiness
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
