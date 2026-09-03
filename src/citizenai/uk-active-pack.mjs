import crypto from 'node:crypto';
import { assertCoverageCertificationForPack } from './uk-coverage-certification.mjs';
import { UK_RELEASE_CANDIDATE_PACK, validateUkReleaseCandidate } from './uk-release-candidate.mjs';
import { UK_RC4_COVERAGE_CERTIFICATION } from './uk-rc4-approval.mjs';
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST, validateUkActivePackData } from './uk-active-pack-data.mjs';

export { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST };

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

export function validateUkActivePack() {
  const dataValidation = validateUkActivePackData();
  const errors = [...dataValidation.errors];
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

  if (contentDigest(UK_RELEASE_CANDIDATE_PACK) !== UK_ACTIVE_PACK_MANIFEST.contentDigest) {
    errors.push('content_digest_mismatch');
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts: dataValidation.counts
  });
}
