import crypto from 'node:crypto';
import { assertCoverageCertificationForPack } from './uk-coverage-certification.mjs';
import { UK_RELEASE_CANDIDATE_PACK, UK_RELEASE_CANDIDATE_MANIFEST, validateUkReleaseCandidate } from './uk-release-candidate.mjs';
import { UK_RC4_COVERAGE_CERTIFICATION } from './uk-rc4-approval.mjs';

const PUBLISHED_AT = '2026-09-02T11:09:23.000Z';

function contentDigest(pack) {
  const payload = {
    sourceUrls: pack.sources.map((source) => [source.id, source.url]),
    facts: pack.facts.map((fact) => [fact.id, fact.conceptId, fact.canonicalValue, fact.evidenceIds]),
    questions: pack.questions.map((question) => [
      question.id,
      question.conceptId,
      question.factId,
      question.stem,
      question.options.map((option) => [option.id, option.text]),
      question.correctOptionId
    ])
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload), 'utf8').digest('hex');
}

export const UK_ACTIVE_PACK_MANIFEST = Object.freeze({
  id: 'GB-2026.09.02.1',
  countryCode: 'GB',
  version: '2026.09.02.1',
  status: 'active',
  effectiveFrom: PUBLISHED_AT,
  publishedAt: PUBLISHED_AT,
  sourceReleaseCandidateId: UK_RELEASE_CANDIDATE_MANIFEST.id,
  sourceReleaseCandidateVersion: UK_RELEASE_CANDIDATE_MANIFEST.version,
  contentDigest: contentDigest(UK_RELEASE_CANDIDATE_PACK),
  certification: Object.freeze({
    reviewerId: UK_RC4_COVERAGE_CERTIFICATION.reviewerId,
    reviewedAt: UK_RC4_COVERAGE_CERTIFICATION.reviewedAt,
    exactPackVersion: UK_RC4_COVERAGE_CERTIFICATION.exactPackVersion,
    snapshotWorkflowRunId: UK_RC4_COVERAGE_CERTIFICATION.sourceSnapshotEvidence.workflowRunId,
    snapshotArtifactId: UK_RC4_COVERAGE_CERTIFICATION.sourceSnapshotEvidence.artifactId
  }),
  copyrightPolicy: UK_RELEASE_CANDIDATE_MANIFEST.copyrightPolicy,
  coverage: Object.freeze({
    status: 'active_human_certified_public_scope',
    publicScopeMapComplete: true,
    sportsSourcePolicyClosed: true,
    pre1066BreadthMapped: true,
    humanCoverageCertified: true,
    activationAllowed: true,
    officialGuideAligned: false,
    examComplete: false,
    guaranteedPass: false,
    openGaps: Object.freeze([]),
    limitation: 'Active for CitizenAI preparation use. It does not claim official Guide for New Residents equivalence, exhaustive official-exam coverage or a guaranteed pass.'
  })
});

export const UK_ACTIVE_PACK = Object.freeze({
  manifest: UK_ACTIVE_PACK_MANIFEST,
  sources: Object.freeze(UK_RELEASE_CANDIDATE_PACK.sources.map((source) => Object.freeze({
    ...source,
    packId: UK_ACTIVE_PACK_MANIFEST.id
  }))),
  evidence: UK_RELEASE_CANDIDATE_PACK.evidence,
  concepts: UK_RELEASE_CANDIDATE_PACK.concepts,
  facts: UK_RELEASE_CANDIDATE_PACK.facts,
  questions: Object.freeze(UK_RELEASE_CANDIDATE_PACK.questions.map((question) => Object.freeze({
    ...question,
    packVersion: UK_ACTIVE_PACK_MANIFEST.version
  })))
});

export function validateUkActivePack() {
  const errors = [];
  const rcValidation = validateUkReleaseCandidate();
  if (!rcValidation.ok) errors.push(...rcValidation.errors.map((error) => `rc:${error}`));

  try {
    assertCoverageCertificationForPack({
      pack: UK_RELEASE_CANDIDATE_PACK,
      certification: UK_RC4_COVERAGE_CERTIFICATION
    });
  } catch (error) {
    errors.push(`certification:${error.message}`);
  }

  if (UK_ACTIVE_PACK_MANIFEST.status !== 'active') errors.push('active_status_required');
  if (!UK_ACTIVE_PACK_MANIFEST.coverage.activationAllowed) errors.push('activation_not_allowed');
  if (!UK_ACTIVE_PACK_MANIFEST.coverage.humanCoverageCertified) errors.push('human_certification_missing');
  if (UK_ACTIVE_PACK_MANIFEST.coverage.officialGuideAligned) errors.push('official_guide_equivalence_must_not_be_claimed');
  if (UK_ACTIVE_PACK_MANIFEST.coverage.examComplete) errors.push('exam_complete_claim_must_remain_false');
  if (UK_ACTIVE_PACK_MANIFEST.coverage.guaranteedPass) errors.push('guaranteed_pass_claim_must_remain_false');
  if (UK_ACTIVE_PACK_MANIFEST.sourceReleaseCandidateVersion !== UK_RC4_COVERAGE_CERTIFICATION.exactPackVersion) errors.push('certification_source_version_mismatch');

  for (const source of UK_ACTIVE_PACK.sources) {
    if (source.packId !== UK_ACTIVE_PACK_MANIFEST.id) errors.push(`source_pack_mismatch:${source.id}`);
  }
  for (const question of UK_ACTIVE_PACK.questions) {
    if (question.packVersion !== UK_ACTIVE_PACK_MANIFEST.version) errors.push(`question_pack_version_mismatch:${question.id}`);
  }

  const expected = { sources: 65, evidence: 68, concepts: 68, facts: 68, questions: 204 };
  const counts = {
    sources: UK_ACTIVE_PACK.sources.length,
    evidence: UK_ACTIVE_PACK.evidence.length,
    concepts: UK_ACTIVE_PACK.concepts.length,
    facts: UK_ACTIVE_PACK.facts.length,
    questions: UK_ACTIVE_PACK.questions.length
  };
  for (const [key, value] of Object.entries(expected)) if (counts[key] !== value) errors.push(`${key}_count:${counts[key]}`);

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze(counts) });
}
