import { READINESS } from './pass-intelligence.mjs';

export function canUnlockPassReady({ readiness, mocksPassed = 0, criticalWeakConcepts = 0 }) {
  return Boolean(
    readiness &&
    [READINESS.PASS_READY, READINESS.STRONGLY_READY].includes(readiness.status) &&
    readiness.confidence >= 0.75 &&
    mocksPassed >= 2 &&
    criticalWeakConcepts === 0
  );
}

export function maintenanceMode({ daysUntilExam, concepts = [] }) {
  if (daysUntilExam < 0) return { state: 'post_exam', activities: [] };
  const atRisk = concepts.filter((c) => (c.retention ?? 1) < 0.8 || (c.effectiveMastery ?? 1) < 0.85);
  if (daysUntilExam === 0) return { state: 'test_day', activities: atRisk.slice(0, 2).map((c) => ({ conceptId: c.id, minutes: 2, type: 'optional_recall' })) };
  if (daysUntilExam <= 1) return { state: 'day_before', activities: atRisk.slice(0, 3).map((c) => ({ conceptId: c.id, minutes: 2, type: 'confidence_review' })) };
  if (daysUntilExam <= 3) return { state: 'final_refresh', activities: atRisk.slice(0, 4).map((c) => ({ conceptId: c.id, minutes: 3, type: 'recall' })) };
  if (atRisk.length === 0) return { state: 'no_study_needed', activities: [] };
  return { state: 'maintenance', activities: atRisk.slice(0, 4).map((c) => ({ conceptId: c.id, minutes: 3, type: 'recall' })) };
}

export function recordExamOutcome({ result, consentToCalibration = false, feedback = {} }) {
  if (!['passed', 'failed', 'rescheduled'].includes(result)) throw new Error('Invalid exam result');
  return {
    result,
    consentToCalibration: Boolean(consentToCalibration),
    feedback: result === 'failed' ? {
      unfamiliarTopics: Boolean(feedback.unfamiliarTopics),
      wordingDifferent: Boolean(feedback.wordingDifferent),
      timePressure: Boolean(feedback.timePressure),
      harderThanExpected: Boolean(feedback.harderThanExpected)
    } : {},
    capturedAt: new Date().toISOString()
  };
}
