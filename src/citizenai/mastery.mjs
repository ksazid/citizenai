const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));

export function createMasteryState({ conceptId, alpha = 1, beta = 1, stabilityDays = 7, exposureCount = 0, variantIds = [], lastSeenAt = null } = {}) {
  if (!conceptId) throw new Error('conceptId is required');
  if (alpha <= 0 || beta <= 0) throw new Error('alpha and beta must be > 0');
  return Object.freeze({
    conceptId,
    alpha: Number(alpha),
    beta: Number(beta),
    stabilityDays: Math.max(0.25, Number(stabilityDays)),
    exposureCount: Number(exposureCount),
    variantIds: Object.freeze([...new Set(variantIds)]),
    lastSeenAt
  });
}

export function evidenceWeight({ difficulty = 0.5, isUnseenVariant = true, delayedRecall = false, repeatedVariantCount = 0, responseQuality = 1 } = {}) {
  const difficultyFactor = 0.85 + clamp(difficulty, 0, 1) * 0.3;
  const variationFactor = isUnseenVariant ? 1.2 : 0.7;
  const recallFactor = delayedRecall ? 1.15 : 1;
  const repeatPenalty = repeatedVariantCount <= 0 ? 1 : Math.max(0.35, 1 / (repeatedVariantCount + 1));
  const quality = clamp(responseQuality, 0.5, 1.1);
  return difficultyFactor * variationFactor * recallFactor * repeatPenalty * quality;
}

export function updateMastery(state, observation) {
  const weight = evidenceWeight(observation);
  const correct = Boolean(observation.correct);
  const variantId = observation.variantId ?? null;
  const nextVariants = variantId ? [...new Set([...state.variantIds, variantId])] : [...state.variantIds];
  const stabilityMultiplier = correct && observation.delayedRecall ? 1.2 : correct ? 1.05 : 0.9;
  return createMasteryState({
    conceptId: state.conceptId,
    alpha: state.alpha + (correct ? weight : 0),
    beta: state.beta + (correct ? 0 : weight),
    stabilityDays: state.stabilityDays * stabilityMultiplier,
    exposureCount: state.exposureCount + 1,
    variantIds: nextVariants,
    lastSeenAt: observation.at ?? state.lastSeenAt
  });
}

export function masteryMean(state) {
  return state.alpha / (state.alpha + state.beta);
}

export function masteryConfidence(state) {
  const evidence = state.alpha + state.beta - 2;
  const volumeConfidence = 1 - Math.exp(-Math.max(0, evidence) / 5);
  const diversityConfidence = Math.min(1, state.variantIds.length / 3);
  return clamp(volumeConfidence * 0.7 + diversityConfidence * 0.3, 0, 1);
}

export function retentionAt(state, at) {
  if (!state.lastSeenAt) return 0.5;
  const elapsedMs = Math.max(0, new Date(at).getTime() - new Date(state.lastSeenAt).getTime());
  const elapsedDays = elapsedMs / 86_400_000;
  return Math.exp(-elapsedDays / state.stabilityDays);
}

export function effectiveMastery(state, at) {
  return masteryMean(state) * retentionAt(state, at) * masteryConfidence(state);
}

export function classifyMasteryState(state, at) {
  const mean = masteryMean(state);
  const confidence = masteryConfidence(state);
  const retention = retentionAt(state, at);
  if (state.exposureCount === 0 || confidence < 0.25) return 'LOW_CONFIDENCE';
  if (mean < 0.5) return 'UNKNOWN';
  if (retention < 0.65) return 'LOW_RETENTION';
  if (state.variantIds.length < 2 && state.exposureCount >= 3) return 'WORDING_DEPENDENT';
  if (effectiveMastery(state, at) >= 0.7) return 'MASTERED';
  return 'BUILDING';
}
