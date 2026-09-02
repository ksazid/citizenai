import crypto from 'node:crypto';
import { selectDiagnosticQuestion, shouldCompleteDiagnostic, summarizeDiagnostic } from './diagnostic.mjs';
import { createMasteryState, updateMastery, masteryMean, masteryConfidence, retentionAt, effectiveMastery } from './mastery.mjs';
import { buildReadiness } from './pass-intelligence.mjs';
import { buildStudyPlan } from './study-engine.mjs';
import { remediationForAttempt } from './learning.mjs';
import { createMock, recordMockAnswer, completeMock } from './mock-test.mjs';
import { canUnlockPassReady, maintenanceMode, recordExamOutcome } from './pass-ready.mjs';
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST, validateUkActivePack } from './uk-active-pack.mjs';

const DOMAINS = ['government', 'history', 'rights', 'culture'];
const nowIso = () => new Date().toISOString();

function assertPack() {
  const validation = validateUkActivePack();
  if (!validation.ok) throw new Error(`active UK pack invalid: ${validation.errors.join(', ')}`);
}

function conceptMap() { return new Map(UK_ACTIVE_PACK.concepts.map((concept) => [concept.id, concept])); }
function questionMap() { return new Map(UK_ACTIVE_PACK.questions.map((question) => [question.id, question])); }

function publicQuestion(question) {
  return {
    id: question.id,
    conceptId: question.conceptId,
    stem: question.stem,
    options: question.options.map(({ id, text }) => ({ id, text })),
    difficulty: question.difficulty,
    variantId: question.variantId
  };
}

export function createRuntimeService({ repository }) {
  if (!repository) throw new Error('repository required');
  assertPack();
  const conceptsById = conceptMap();
  const questionsById = questionMap();

  async function loadMasteryMap(learnerId) {
    const rows = await repository.listMasteries(learnerId);
    const map = new Map(rows.map((row) => [row.conceptId, row.state]));
    for (const concept of UK_ACTIVE_PACK.concepts) {
      if (!map.has(concept.id)) map.set(concept.id, createMasteryState({ conceptId: concept.id }));
    }
    return map;
  }

  async function buildSignals(learnerId, at = nowIso()) {
    const masteries = await loadMasteryMap(learnerId);
    return UK_ACTIVE_PACK.concepts.map((concept) => {
      const state = masteries.get(concept.id);
      return {
        ...concept,
        mastery: masteryMean(state),
        confidence: masteryConfidence(state),
        retention: retentionAt(state, at),
        effectiveMastery: effectiveMastery(state, at),
        exposureCount: state.exposureCount,
        variantDiversity: Math.min(1, (state.variantIds?.length ?? 0) / 3),
        expectedLearningGain: 0.65,
        studyMinutes: concept.studyMinutes ?? 3
      };
    });
  }

  async function createLearner(input = {}) {
    const learner = await repository.createLearner({
      countryPackId: UK_ACTIVE_PACK_MANIFEST.id,
      examDate: input.examDate ?? null,
      explanationLanguage: input.explanationLanguage ?? 'English',
      preparation: input.preparation ?? 'Some'
    });
    return { ...learner, pack: { id: UK_ACTIVE_PACK_MANIFEST.id, version: UK_ACTIVE_PACK_MANIFEST.version } };
  }

  async function updateLearner(learnerId, patch) {
    const learner = await repository.updateLearner(learnerId, patch);
    if (!learner) throw Object.assign(new Error('learner not found'), { statusCode: 404 });
    return learner;
  }

  async function dashboard(learnerId) {
    const learner = await repository.getLearner(learnerId);
    if (!learner) throw Object.assign(new Error('learner not found'), { statusCode: 404 });
    const attempts = await repository.listAttempts(learnerId);
    const mocks = await repository.listMocks(learnerId);
    const signals = await buildSignals(learnerId);
    const diagnosticAttempts = attempts.filter((attempt) => attempt.sessionType === 'diagnostic');
    const testedDomains = new Set(diagnosticAttempts.map((attempt) => conceptsById.get(attempt.conceptId)?.domainId).filter(Boolean));
    const important = UK_ACTIVE_PACK.concepts.filter((concept) => concept.importance >= 0.75);
    const testedImportant = new Set(diagnosticAttempts.map((attempt) => attempt.conceptId));
    const mocksPassed = mocks.filter((mock) => mock.passed === true).length;
    const variantDiversity = signals.reduce((sum, signal) => sum + signal.variantDiversity, 0) / Math.max(1, signals.length);
    const readiness = buildReadiness({
      concepts: signals,
      coverage: {
        domains: DOMAINS.map((id) => ({ id, tested: testedDomains.has(id) })),
        importantConcepts: important.map((concept) => ({ id: concept.id, tested: testedImportant.has(concept.id) })),
        mocks: mocksPassed,
        variantDiversity
      }
    });
    const studyPlan = buildStudyPlan({ concepts: signals, availableMinutes: 15 });
    const criticalWeakConcepts = signals.filter((signal) => signal.importance >= 0.8 && signal.effectiveMastery < 0.7).length;
    const passReady = canUnlockPassReady({ readiness, mocksPassed, criticalWeakConcepts });
    const daysUntilExam = learner.examDate ? Math.max(0, Math.ceil((new Date(learner.examDate).getTime() - Date.now()) / 86_400_000)) : null;
    const maintenance = maintenanceMode({ daysUntilExam: daysUntilExam ?? 30, concepts: signals });
    const summary = summarizeDiagnostic({ answers: diagnosticAttempts, conceptsById });
    const domainScores = Object.fromEntries(DOMAINS.map((domain) => [
      domain,
      summary[domain]?.score ?? Math.round(
        signals.filter((signal) => signal.domainId === domain).reduce((sum, signal) => sum + signal.effectiveMastery, 0) /
        Math.max(1, signals.filter((signal) => signal.domainId === domain).length) * 100
      )
    ]));
    return {
      learner,
      pack: { id: UK_ACTIVE_PACK_MANIFEST.id, version: UK_ACTIVE_PACK_MANIFEST.version, status: UK_ACTIVE_PACK_MANIFEST.status },
      readiness: { ...readiness, scorePercent: Math.round(readiness.score * 100) },
      domainScores,
      studyPlan,
      mocksPassed,
      criticalWeakConcepts,
      passReady,
      maintenance,
      diagnosticAnswered: diagnosticAttempts.length
    };
  }

  async function nextDiagnosticQuestion(learnerId) {
    const attempts = (await repository.listAttempts(learnerId)).filter((attempt) => attempt.sessionType === 'diagnostic');
    const attemptsByConcept = new Map();
    for (const attempt of attempts) attemptsByConcept.set(attempt.conceptId, (attemptsByConcept.get(attempt.conceptId) ?? 0) + 1);
    const ranked = selectDiagnosticQuestion({ concepts: UK_ACTIVE_PACK.concepts, attemptsByConcept, limit: 24 });
    const concept = ranked[0] ?? UK_ACTIVE_PACK.concepts[0];
    const seen = attemptsByConcept.get(concept.id) ?? 0;
    const variants = UK_ACTIVE_PACK.questions.filter((question) => question.conceptId === concept.id);
    const question = variants[seen % Math.max(1, variants.length)] ?? UK_ACTIVE_PACK.questions[0];
    return { question: publicQuestion(question), answered: attempts.length, target: 24 };
  }

  async function recordAttempt(input) {
    const learner = await repository.getLearner(input.learnerId);
    if (!learner) throw Object.assign(new Error('learner not found'), { statusCode: 404 });
    const question = questionsById.get(input.questionId);
    if (!question) throw Object.assign(new Error('question not found'), { statusCode: 404 });
    const masteries = await loadMasteryMap(input.learnerId);
    const previous = masteries.get(question.conceptId);
    const correct = input.optionId === question.correctOptionId;
    const at = nowIso();
    const next = updateMastery(previous, {
      correct,
      difficulty: question.difficulty,
      variantId: question.variantId,
      isUnseenVariant: !(previous.variantIds ?? []).includes(question.variantId),
      responseQuality: input.sessionType === 'mock' ? 0.8 : 1,
      at
    });
    await repository.recordAttempt({
      learnerId: input.learnerId,
      questionId: question.id,
      conceptId: question.conceptId,
      sessionType: input.sessionType ?? 'practice',
      optionId: input.optionId ?? null,
      correct,
      responseMs: input.responseMs ?? null,
      variantId: question.variantId,
      difficulty: question.difficulty,
      attemptedAt: at
    });
    await repository.upsertMastery({
      learnerId: input.learnerId,
      conceptId: question.conceptId,
      state: next,
      masteryMean: masteryMean(next),
      masteryConfidence: masteryConfidence(next),
      retention: retentionAt(next, at)
    });
    const remediation = input.sessionType === 'practice'
      ? remediationForAttempt({ correct, misconceptionCode: correct ? null : question.misconceptionCode, retention: retentionAt(next, at) })
      : null;
    const attempts = (await repository.listAttempts(input.learnerId)).filter((attempt) => attempt.sessionType === 'diagnostic');
    const testedDomains = new Set(attempts.map((attempt) => conceptsById.get(attempt.conceptId)?.domainId).filter(Boolean));
    const important = UK_ACTIVE_PACK.concepts.filter((concept) => concept.importance >= 0.75);
    const testedImportant = new Set(attempts.map((attempt) => attempt.conceptId));
    const diagnosticDone = input.sessionType === 'diagnostic' ? shouldCompleteDiagnostic({
      answeredCount: attempts.length,
      minimumQuestions: 20,
      maximumQuestions: 24,
      domainCoverage: testedDomains.size / DOMAINS.length,
      importantConceptCoverage: important.filter((concept) => testedImportant.has(concept.id)).length / Math.max(1, important.length)
    }) : false;
    return {
      correct,
      reason: question.explanation,
      remediation,
      misconception: correct ? null : question.misconceptionCode ?? null,
      diagnosticDone,
      mastery: { mean: masteryMean(next), confidence: masteryConfidence(next), retention: retentionAt(next, at) }
    };
  }

  async function nextLearningAction(learnerId) {
    const result = await dashboard(learnerId);
    const activity = result.studyPlan.activities[0] ?? null;
    if (!activity) return { activity: null, question: null };
    const question = UK_ACTIVE_PACK.questions.find((row) => row.conceptId === activity.conceptId) ?? UK_ACTIVE_PACK.questions[0];
    return { activity, question: publicQuestion(question) };
  }

  async function startMock(learnerId) {
    const learner = await repository.getLearner(learnerId);
    if (!learner) throw Object.assign(new Error('learner not found'), { statusCode: 404 });
    const previous = await repository.listMocks(learnerId);
    const state = createMock({ questionPool: UK_ACTIVE_PACK.questions, seed: 42 + previous.length });
    const id = crypto.randomUUID();
    await repository.saveMock({ id, learnerId, state, status: 'in_progress', startedAt: state.startedAt });
    return { id, questions: state.questions.map(publicQuestion), durationMinutes: 45, questionCount: 24 };
  }

  async function answerMock(mockId, { questionId, optionId }) {
    const row = await repository.getMock(mockId);
    if (!row) throw Object.assign(new Error('mock not found'), { statusCode: 404 });
    const next = recordMockAnswer(row.state, { questionId, optionId });
    await repository.saveMock({ ...row, state: next, status: 'in_progress' });
    return { saved: true, answered: Object.keys(next.answers ?? {}).length };
  }

  async function finishMock(mockId) {
    const row = await repository.getMock(mockId);
    if (!row) throw Object.assign(new Error('mock not found'), { statusCode: 404 });
    const result = completeMock(row.state);
    for (const graded of result.gradedAnswers) {
      await recordAttempt({ learnerId: row.learnerId, questionId: graded.questionId, optionId: graded.optionId, sessionType: 'mock' });
    }
    await repository.saveMock({
      ...row,
      state: result,
      status: 'completed',
      passed: result.passed,
      score: result.score,
      completedAt: nowIso()
    });
    return { ...result, dashboard: await dashboard(row.learnerId) };
  }

  async function saveExamOutcome(input) {
    const outcome = recordExamOutcome({
      result: input.result,
      consentToCalibration: Boolean(input.consentToCalibration),
      feedback: input.feedback ?? {}
    });
    return repository.saveExamOutcome({ learnerId: input.learnerId, ...outcome });
  }

  async function saveSnapshot(learnerId, state) {
    return repository.saveSnapshot({ learnerId, packVersion: UK_ACTIVE_PACK_MANIFEST.version, state });
  }

  async function getSnapshot(learnerId) { return repository.getSnapshot(learnerId); }

  return Object.freeze({
    createLearner,
    updateLearner,
    dashboard,
    nextDiagnosticQuestion,
    recordAttempt,
    nextLearningAction,
    startMock,
    answerMock,
    finishMock,
    saveExamOutcome,
    saveSnapshot,
    getSnapshot
  });
}
