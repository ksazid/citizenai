export const UK_RC4_COVERAGE_CERTIFICATION = Object.freeze({
  status: 'approved',
  approved: true,
  reviewerId: 'ksazid',
  reviewedAt: '2026-09-02T11:09:23.000Z',
  exactPackId: 'GB-2026.09.02-rc.4',
  exactPackVersion: '2026.09.02-rc.4',
  approvalScope: 'CitizenAI independently authored UK preparation coverage',
  approvalChannel: 'explicit product-owner approval',
  sourceSnapshotEvidence: Object.freeze({
    workflowRunId: 33619666540,
    artifactId: 9842390335,
    snapshotCoverage: '65/65',
    algorithm: 'sha256',
    normalizationVersion: 1
  }),
  limitations: Object.freeze([
    'This approval does not claim equivalence to or reproduction of the official Guide for New Residents.',
    'This approval does not guarantee an exam result or pass outcome.',
    'Any factual-content change requires a new exact-version certification.'
  ]),
  notes: 'RC4 coverage approved for CitizenAI’s stated preparation product after engineering gates, source provenance and 65/65 live source-body snapshot capture passed.'
});
