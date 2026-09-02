import { diffSourceVersion, impactAnalysis, publishImmutablePack } from './admin-content-ops.mjs';
import { validateUkPackV1 } from './uk-knowledge-pack-v1.mjs';

export function sourceChangeImpact({ previousSources = [], currentSources = [], facts = [], evidence = [], questions = [] }) {
  const previousById = new Map(previousSources.map((source) => [source.id, source]));
  const changedSourceIds = [];
  const sourceDiffs = [];

  for (const current of currentSources) {
    const previous = previousById.get(current.id);
    if (!previous) {
      changedSourceIds.push(current.id);
      sourceDiffs.push({ sourceId: current.id, changed: true, previousHash: null, currentHash: current.contentHash, retrievedAt: current.retrievedAt });
      continue;
    }
    const diff = diffSourceVersion(previous, current);
    sourceDiffs.push(diff);
    if (diff.changed) changedSourceIds.push(current.id);
  }

  const changedEvidenceIds = evidence.filter((item) => changedSourceIds.includes(item.sourceId)).map((item) => item.id);
  const changedFactIds = facts.filter((fact) => fact.evidenceIds.some((id) => changedEvidenceIds.includes(id))).map((fact) => fact.id);
  const impact = impactAnalysis({ changedFactIds, questions });

  return Object.freeze({
    sourceDiffs: Object.freeze(sourceDiffs),
    changedSourceIds: Object.freeze([...new Set(changedSourceIds)]),
    changedEvidenceIds: Object.freeze([...new Set(changedEvidenceIds)]),
    changedFactIds: Object.freeze(impact.changedFactIds),
    affectedQuestionIds: Object.freeze(impact.affectedQuestionIds)
  });
}

export function ukPackReleaseGate({ manifest, coverageCertification = null, validation = validateUkPackV1() }) {
  const reasons = [];
  if (!validation.ok) reasons.push('pack_validation_failed');
  if (manifest.status !== 'review') reasons.push('pack_not_in_review');
  if (!manifest.coverage?.examComplete) reasons.push('exam_coverage_not_complete');
  if (!manifest.coverage?.activationAllowed) reasons.push('activation_not_allowed');
  if (!coverageCertification?.approved) reasons.push('coverage_certification_missing');
  if (!coverageCertification?.reviewerId) reasons.push('coverage_reviewer_missing');
  if (!coverageCertification?.exactPackVersion || coverageCertification.exactPackVersion !== manifest.version) reasons.push('coverage_version_mismatch');
  return Object.freeze({ allowed: reasons.length === 0, reasons: Object.freeze(reasons) });
}

export function publishCertifiedUkPack({ manifest, pack, facts, questions, approvals, coverageCertification, publishedBy, publishedAt }) {
  const validation = validateUkPackV1();
  const gate = ukPackReleaseGate({ manifest, coverageCertification, validation });
  if (!gate.allowed) throw new Error(`UK pack release blocked: ${gate.reasons.join(', ')}`);
  return publishImmutablePack({ pack, facts, questions, approvals, publishedBy, publishedAt });
}
