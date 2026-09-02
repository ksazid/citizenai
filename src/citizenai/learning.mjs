export const LearningActivity = Object.freeze({
  LEARN: 'learn',
  COMPARE: 'compare',
  RECALL: 'recall',
  QUESTION: 'question',
  UNSEEN_VARIANT: 'unseen_variant',
  MEASURE: 'measure',
  REVIEW: 'review'
});

export function remediationForAttempt({ correct, misconceptionCode, repeatedStem = false, retention = 1 }) {
  if (correct && repeatedStem) return { type: LearningActivity.UNSEEN_VARIANT, reason: 'wording_dependency_check' };
  if (correct && retention < 0.65) return { type: LearningActivity.RECALL, reason: 'retention_refresh' };
  if (correct) return { type: LearningActivity.REVIEW, reason: 'reinforce' };
  if (misconceptionCode) return { type: LearningActivity.COMPARE, reason: 'concept_confusion', misconceptionCode };
  return { type: LearningActivity.LEARN, reason: 'knowledge_gap' };
}

export function buildTransferSequence({ conceptId, misconceptionCode = null }) {
  return [
    { type: misconceptionCode ? LearningActivity.COMPARE : LearningActivity.LEARN, conceptId },
    { type: LearningActivity.RECALL, conceptId },
    { type: LearningActivity.UNSEEN_VARIANT, conceptId }
  ];
}

export function completeLearningSession({ activities = [], readinessBefore = null, readinessAfter = null }) {
  const minutes = activities.reduce((sum, a) => sum + (a.minutes ?? 0), 0);
  const concepts = new Set(activities.map((a) => a.conceptId).filter(Boolean));
  return {
    completed: true,
    minutes,
    conceptsStrengthened: concepts.size,
    readinessBefore,
    readinessAfter,
    readinessDelta: Number.isFinite(readinessBefore) && Number.isFinite(readinessAfter)
      ? readinessAfter - readinessBefore
      : null,
    nextAction: 'finish',
    optionalAction: 'keep_practicing'
  };
}
