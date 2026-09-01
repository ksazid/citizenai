const ALLOWED_SOURCE_TYPES = new Set(['government', 'public_authority']);
const ALLOWED_PACK_STATUS = new Set(['draft', 'review', 'active', 'retired']);

export function createCountryPack(input) {
  const pack = {
    id: input.id,
    countryCode: input.countryCode,
    version: input.version,
    status: input.status ?? 'draft',
    effectiveFrom: input.effectiveFrom ?? null,
    publishedAt: input.publishedAt ?? null
  };
  if (!pack.id || !pack.countryCode || !pack.version) throw new Error('pack identity is required');
  if (!ALLOWED_PACK_STATUS.has(pack.status)) throw new Error('invalid pack status');
  return Object.freeze(pack);
}

export function createSource(input) {
  if (!input.id || !input.url || !input.title) throw new Error('source identity is required');
  if (!ALLOWED_SOURCE_TYPES.has(input.sourceType)) throw new Error('source must be government or public authority');
  return Object.freeze({
    id: input.id,
    packId: input.packId,
    url: input.url,
    sourceType: input.sourceType,
    title: input.title,
    retrievedAt: input.retrievedAt,
    contentHash: input.contentHash,
    dynamic: Boolean(input.dynamic),
    verificationStatus: input.verificationStatus ?? 'pending'
  });
}

export function createConcept(input) {
  if (!input.id || !input.domainId || !input.key || !input.title) throw new Error('concept identity is required');
  const importance = Number(input.importance ?? 0.5);
  const baseDifficulty = Number(input.baseDifficulty ?? 0.5);
  if (importance < 0 || importance > 1 || baseDifficulty < 0 || baseDifficulty > 1) throw new Error('concept scores must be within 0..1');
  return Object.freeze({ ...input, importance, baseDifficulty, status: input.status ?? 'draft' });
}

export function createFact(input) {
  if (!input.id || !input.conceptId || !input.canonicalValue) throw new Error('fact identity is required');
  const evidenceIds = [...new Set(input.evidenceIds ?? [])];
  return Object.freeze({
    id: input.id,
    conceptId: input.conceptId,
    canonicalValue: input.canonicalValue,
    dynamic: Boolean(input.dynamic),
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
    verificationStatus: input.verificationStatus ?? 'pending',
    confidence: Number(input.confidence ?? 0),
    evidenceIds: Object.freeze(evidenceIds)
  });
}

export function canPublishFact(fact) {
  return fact.verificationStatus === 'approved' && fact.confidence === 1 && fact.evidenceIds.length > 0;
}

export function validateQuestionProvenance({ question, factsById }) {
  if (!question?.factId || !question?.conceptId) return { ok: false, reason: 'missing_fact_or_concept' };
  const fact = factsById.get(question.factId);
  if (!fact) return { ok: false, reason: 'fact_not_found' };
  if (fact.conceptId !== question.conceptId) return { ok: false, reason: 'concept_fact_mismatch' };
  if (!canPublishFact(fact)) return { ok: false, reason: 'fact_not_publishable' };
  return { ok: true };
}
