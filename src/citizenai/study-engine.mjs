const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export function studyOpportunity(concept) {
  const importance = clamp(concept.importance ?? 0.5);
  const weakness = 1 - clamp(concept.effectiveMastery ?? concept.mastery ?? 0);
  const forgettingRisk = 1 - clamp(concept.retention ?? 1);
  const uncertainty = 1 - clamp(concept.confidence ?? 0.5);
  const expectedLearningGain = clamp(concept.expectedLearningGain ?? 0.6);
  const studyCost = Math.max(1, concept.studyMinutes ?? 3);
  return (importance * (0.45 * weakness + 0.25 * forgettingRisk + 0.2 * uncertainty + 0.1 * expectedLearningGain)) / studyCost;
}

export function classifyActivity(concept) {
  if ((concept.exposureCount ?? 0) === 0) return 'learn';
  if (concept.misconceptionCode) return 'compare';
  if ((concept.retention ?? 1) < 0.65) return 'recall';
  if ((concept.variantDiversity ?? 0) < 0.4) return 'unseen_variant';
  if ((concept.confidence ?? 0) < 0.65) return 'measure';
  return 'review';
}

export function buildStudyPlan({ concepts, availableMinutes = 15, now = new Date() }) {
  const ranked = concepts
    .map((concept) => ({ ...concept, priority: studyOpportunity(concept), activity: classifyActivity(concept) }))
    .sort((a, b) => b.priority - a.priority);

  const activities = [];
  let used = 0;
  for (const concept of ranked) {
    const minutes = Math.max(1, Math.round(concept.studyMinutes ?? 3));
    if (used + minutes > availableMinutes && activities.length) continue;
    activities.push({ conceptId: concept.id, type: concept.activity, minutes, priority: concept.priority });
    used += minutes;
    if (used >= availableMinutes) break;
  }

  return {
    generatedAt: now.toISOString(),
    durationMinutes: used,
    requestedMinutes: availableMinutes,
    activities,
    estimatedGain: clamp(activities.reduce((sum, a) => sum + Math.min(0.05, a.priority * a.minutes), 0))
  };
}

export function scheduleReview({ retention = 1, stabilityDays = 3, now = new Date() }) {
  const risk = 1 - clamp(retention);
  const days = Math.max(1, Math.round(stabilityDays * (1 - 0.7 * risk)));
  const next = new Date(now);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString();
}
