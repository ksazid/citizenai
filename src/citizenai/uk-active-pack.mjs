import { assertCoverageCertificationForPack } from './uk-coverage-certification.mjs';
import { UK_RELEASE_CANDIDATE_PACK, validateUkReleaseCandidate } from './uk-release-candidate.mjs';
import { UK_RC4_COVERAGE_CERTIFICATION } from './uk-rc4-approval.mjs';
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST, validateUkActivePackData } from './uk-active-pack-data.mjs';

export { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST };

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

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts: dataValidation.counts
  });
}
