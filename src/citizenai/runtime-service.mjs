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
const SESSION_TYPES = new Set(['diagnostic', 'practice', 'mock']);
const EXAM_RESULTS = new Set(['passed', 'failed', 'rescheduled']);
const LEARNER_FIELDS = new Set(['examDate', 'explanationLanguage', 'preparation']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const nowIso = () => new Date().toISOString();

function requestError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function assertPlainObject(value, label = 'input') {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) throw requestError(400, `${label} must be an object`);
  return value;
}

function assertKnownKeys(value, allowed, label = 'input') {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw requestError(400, `${label} contains unsupported field: ${unknown[0]}`);
}

function assertUuid(value, label) {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw requestError(400, `${label} must be a valid UUID`);
  return value;
}

function shortString(value, label, maxLength = 128) {
  if (typeof value !== 'string') throw requestError(400, `${label} must be a string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw requestError(400, `${label} is invalid`);
  return normalized;
}

function examDate(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw requestError(400, 'examDate must use YYYY-MM-DD');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw requestError(400, 'examDate is not a valid calendar date');
  return value;
}

function sanitizeLearnerInput(input = {}) {
  assertPlainObject(input);
  assertKnownKeys(input, LEARNER_FIELDS);
  const safe = {};
  if ('examDate' in input) safe.examDate = examDate(input.examDate);
  if ('explanationLanguage' in input) safe.explanationLanguage = shortString(input.explanationLanguage, 'explanationLanguage', 64);
  if ('preparation' in input) safe.preparation = shortString(input.preparation, 'preparation', 64);
  return safe;
}

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
  const finishingMocks = new Set();

  async function requireLearner(learnerId) {
    assertUuid(learnerId, 'learnerId');
    const learner = await repository.getLearner(learnerId);
    if (!learner) throw requestError(404, 'learner not found');
    return learner;
  }

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
    const safe = sanitizeLearnerInput(input);
    const learner = await repository.createLearner({
      countryPackId: UK_ACTIVE_PACK_MANIFEST.id,
      examDate: safe.examDate ?? null,
      explanationLanguage: safe.explanationLanguage ?? 'English',
      preparation: safe.preparation ?? 'Some'
    });
    return { ...learner, pack: { id: UK_ACTIVE_PACK_MANIFEST.id, version: UK_ACTIVE_PACK_MANIFEST.version } };
  }

  async function updateLearner(learnerId, patch) {
    assertUuid(learnerId, 'learnerId');
    const safe = sanitizeLearnerInput(patch);
    const learner = await repository.updateLearner(learnerId, safe);
    if (!learner) throw requestError(404, 'learner not found');
    return learner;
  }

  async function dashboard(learnerId) {
    const learner = await requireLearner(learnerId);
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
    await requireLearner(learnerId);
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
    assertPlainObject(input);
    assertKnownKeys(input, new Set(['learnerId', 'questionId', 'optionId', 'sessionType', 'responseMs']));
    const learnerId = assertUuid(input.learnerId, 'learnerId');
    await requireLearner(learnerId);
    const questionId = shortString(input.questionId, 'questionId', 160);
    const question = questionsById.get(questionId);
    if (!question) throw requestError(404, 'question not found');
    const sessionType = input.sessionType ?? 'practice';
    if (!SESSION_TYPES.has(sessionType)) throw requestError(400, 'sessionType is invalid');
    const optionId = input.optionId ?? null;
    if (optionId !== null) {
      shortString(optionId, 'optionId', 160);
      if (!question.options.some((option) => option.id === optionId)) throw requestError(400, 'optionId is not valid for this question');
    }
    const responseMs = input.responseMs ?? null;
    if (responseMs !== null && (!Number.isInteger(responseMs) || responseMs < 0 || responseMs > 3_600_000)) {
      throw requestError(400, 'responseMs is invalid');
    }

    const masteries = await loadMasteryMap(learnerId);
    const previous = masteries.get(question.conceptId);
    const correct = optionId === question.correctOptionId;
    const at = nowIso();
    const next = updateMastery(previous, {
      correct,
      difficulty: question.difficulty,
      variantId: question.variantId,
      isUnseenVariant: !(previous.variantIds ?? []).includes(question.variantId),
      responseQuality: sessionType === 'mock' ? 0.8 : 1,
      at
    });
    await repository.recordAttempt({
      learnerId,
      questionId: question.id,
      conceptId: question.conceptId,
      sessionType,
      optionId,
      correct,
      responseMs,
      variantId: question.variantId,
      difficulty: question.difficulty,
      attemptedAt: at
    });
    await repository.upsertMastery({
      learnerId,
      conceptId: question.conceptId,
      state: next,
      masteryMean: masteryMean(next),
      masteryConfidence: masteryConfidence(next),
      retention: retentionAt(next, at)
    });
    const remediation = sessionType === 'practice'
      ? remediationForAttempt({ correct, misconceptionCode: correct ? null : question.misconceptionCode, retention: retentionAt(next, at) })
      : null;
    const attempts = (await repository.listAttempts(learnerId)).filter((attempt) => attempt.sessionType === 'diagnostic');
    const testedDomains = new Set(attempts.map((attempt) => conceptsById.get(attempt.conceptId)?.domainId).filter(Boolean));
    const important = UK_ACTIVE_PACK.concepts.filter((concept) => concept.importance >= 0.75);
    const testedImportant = new Set(attempts.map((attempt) => attempt.conceptId));
    const diagnosticDone = sessionType === 'diagnostic' ? shouldCompleteDiagnostic({
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
    await requireLearner(learnerId);
    const previous = await repository.listMocks(learnerId);
    const state = createMock({ questionPool: UK_ACTIVE_PACK.questions, seed: 42 + previous.length });
    const id = crypto.randomUUID();
    await repository.saveMock({ id, learnerId, state, status: 'in_progress', startedAt: state.startedAt });
    return { id, questions: state.questions.map(publicQuestion), durationMinutes: 45, questionCount: 24 };
  }

  async function answerMock(mockId, input) {
    assertUuid(mockId, 'mockId');
    assertPlainObject(input);
    assertKnownKeys(input, new Set(['questionId', 'optionId']));
    const row = await repository.getMock(mockId);
    if (!row) throw requestError(404, 'mock not found');
    if (row.status === 'completed') throw requestError(409, 'mock is already completed');
    if (row.status !== 'in_progress') throw requestError(409, 'mock is not active');
    const questionId = shortString(input.questionId, 'questionId', 160);
    const optionId = shortString(input.optionId, 'optionId', 160);
    const question = row.state.questions.find((candidate) => candidate.id === questionId);
    if (!question) throw requestError(400, 'question is not part of this mock');
    if (!question.options.some((option) => option.id === optionId)) throw requestError(400, 'optionId is not valid for this question');
    const next = recordMockAnswer(row.state, { questionId, optionId });
    await repository.saveMock({ ...row, state: next, status: 'in_progress' });
    return { saved: true, answered: next.answers?.length ?? 0 };
  }

  async function finishMock(mockId) {
    assertUuid(mockId, 'mockId');
    const row = await repository.getMock(mockId);
    if (!row) throw requestError(404, 'mock not found');
    if (row.status === 'completed') return { ...row.state, dashboard: await dashboard(row.learnerId) };
    if (row.status !== 'in_progress') throw requestError(409, 'mock is not active');
    if (finishingMocks.has(mockId)) throw requestError(409, 'mock completion is already in progress');

    finishingMocks.add(mockId);
    try {
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
    } finally {
      finishingMocks.delete(mockId);
    }
  }

  async function saveExamOutcome(input) {
    assertPlainObject(input);
    assertKnownKeys(input, new Set(['learnerId', 'result', 'consentToCalibration', 'feedback']));
    const learnerId = assertUuid(input.learnerId, 'learnerId');
    await requireLearner(learnerId);
    if (!EXAM_RESULTS.has(input.result)) throw requestError(400, 'result is invalid');
    if ('consentToCalibration' in input && typeof input.consentToCalibration !== 'boolean') throw requestError(400, 'consentToCalibration must be boolean');
    if ('feedback' in input) assertPlainObject(input.feedback, 'feedback');
    const outcome = recordExamOutcome({
      result: input.result,
      consentToCalibration: Boolean(input.consentToCalibration),
      feedback: input.feedback ?? {}
    });
    return repository.saveExamOutcome({ learnerId, ...outcome });
  }

  async function saveSnapshot(learnerId, state) {
    await requireLearner(learnerId);
    if (state === undefined) throw requestError(400, 'snapshot state is required');
    return repository.saveSnapshot({ learnerId, packVersion: UK_ACTIVE_PACK_MANIFEST.version, state });
  }

  async function getSnapshot(learnerId) {
    await requireLearner(learnerId);
    return repository.getSnapshot(learnerId);
  }

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
