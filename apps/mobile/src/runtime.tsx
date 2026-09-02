import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createCitizenAIApiClient } from './apiClient';

// These are the production domain engines already certified in the repository.
// They remain the offline fallback and deterministic visual-test runtime.
// @ts-ignore
import { selectDiagnosticQuestion, shouldCompleteDiagnostic, summarizeDiagnostic } from '../../../src/citizenai/diagnostic.mjs';
// @ts-ignore
import { createMasteryState, updateMastery, masteryMean, masteryConfidence, retentionAt, effectiveMastery } from '../../../src/citizenai/mastery.mjs';
// @ts-ignore
import { buildReadiness } from '../../../src/citizenai/pass-intelligence.mjs';
// @ts-ignore
import { buildStudyPlan } from '../../../src/citizenai/study-engine.mjs';
// @ts-ignore
import { remediationForAttempt, completeLearningSession } from '../../../src/citizenai/learning.mjs';
// @ts-ignore
import { createMock, recordMockAnswer, completeMock } from '../../../src/citizenai/mock-test.mjs';
// @ts-ignore
import { canUnlockPassReady, maintenanceMode, recordExamOutcome } from '../../../src/citizenai/pass-ready.mjs';

export type DomainId = 'government' | 'history' | 'rights' | 'culture';
export type Concept = {
  id: string;
  domainId: DomainId;
  title: string;
  importance: number;
  baseDifficulty: number;
  studyMinutes: number;
  misconceptionCode?: string | null;
};
export type Question = {
  id: string;
  conceptId: string;
  stem: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  difficulty: number;
  variantId: string;
  explanation: string;
  misconceptionCode?: string | null;
};

type DiagnosticAnswer = { conceptId: string; questionId: string; optionId: string | null; correct: boolean };
type MasteryState = ReturnType<typeof createMasteryState>;
type BackendState = 'local' | 'connecting' | 'api' | 'error';

type Runtime = {
  examDate: string;
  explanationLanguage: string;
  preparation: string;
  setExamDate: (value: string) => void;
  setExplanationLanguage: (value: string) => void;
  setPreparation: (value: string) => void;
  daysUntilExam: number;
  visualDemo: boolean;
  backendState: BackendState;
  learnerId: string | null;
  diagnosticQuestion: Question;
  diagnosticAnswered: number;
  diagnosticTarget: number;
  submitDiagnosticAnswer: (optionId: string | null) => boolean;
  resetDiagnostic: () => void;
  domainScores: Record<DomainId, number>;
  readinessScore: number;
  readinessConfidence: number;
  readinessStatus: string;
  studyPlan: { durationMinutes: number; estimatedGain: number; activities: Array<{ conceptId: string; type: string; minutes: number; priority?: number }> };
  conceptById: (id: string) => Concept | undefined;
  practiceQuestion: Question;
  lastAttempt: null | { correct: boolean; remediation: any; question: Question };
  answerPractice: (optionId: string) => void;
  sessionSummary: { minutes: number; conceptsStrengthened: number; readinessDelta: number | null };
  startMock: () => void;
  mock: any;
  currentMockQuestion: Question | null;
  answerMock: (optionId: string) => void;
  finishMock: () => any;
  lastMockResult: any;
  mocksPassed: number;
  passReady: boolean;
  criticalWeakConcepts: number;
  maintenance: any;
  saveExamOutcome: (result: 'passed' | 'failed' | 'rescheduled', consent?: boolean, feedback?: Record<string, boolean>) => void;
  examOutcome: any;
};

const DOMAINS: DomainId[] = ['government', 'history', 'rights', 'culture'];
const LEARNER_STORAGE_KEY = 'citizenai.runtime.learnerId.v1';

export const CONCEPTS: Concept[] = [
  { id: 'parliament-government', domainId: 'government', title: 'Parliament vs Government', importance: 1, baseDifficulty: 0.62, studyMinutes: 4, misconceptionCode: 'parliament_government_reversal' },
  { id: 'elections', domainId: 'government', title: 'UK Elections', importance: 0.9, baseDifficulty: 0.58, studyMinutes: 4 },
  { id: 'magna-carta', domainId: 'history', title: 'Magna Carta', importance: 0.8, baseDifficulty: 0.48, studyMinutes: 3 },
  { id: 'modern-history', domainId: 'history', title: 'Modern British History', importance: 0.78, baseDifficulty: 0.56, studyMinutes: 4 },
  { id: 'rule-of-law', domainId: 'rights', title: 'Rule of Law', importance: 0.92, baseDifficulty: 0.48, studyMinutes: 3 },
  { id: 'rights-responsibilities', domainId: 'rights', title: 'Rights & Responsibilities', importance: 0.85, baseDifficulty: 0.52, studyMinutes: 3 },
  { id: 'uk-nations', domainId: 'culture', title: 'UK Nations', importance: 0.72, baseDifficulty: 0.38, studyMinutes: 3 },
  { id: 'culture-traditions', domainId: 'culture', title: 'Culture & Traditions', importance: 0.65, baseDifficulty: 0.42, studyMinutes: 3 }
];

const BASE_QUESTIONS: Omit<Question, 'id' | 'variantId'>[] = [
  { conceptId: 'parliament-government', stem: 'Which institution makes laws and holds the Government accountable?', options: [{ id: 'p', text: 'Parliament' }, { id: 'g', text: 'The Government' }, { id: 'c', text: 'The Cabinet Office' }, { id: 's', text: 'The Civil Service' }], correctOptionId: 'p', difficulty: 0.55, explanation: 'Parliament makes and scrutinises laws and holds the Government accountable.', misconceptionCode: 'parliament_government_reversal' },
  { conceptId: 'elections', stem: 'What do voters choose at a UK general election?', options: [{ id: 'mp', text: 'Members of Parliament' }, { id: 'pm', text: 'The Prime Minister directly' }, { id: 'jl', text: 'Judges' }, { id: 'ld', text: 'Members of the House of Lords' }], correctOptionId: 'mp', difficulty: 0.5, explanation: 'Voters elect MPs to represent constituencies.' },
  { conceptId: 'magna-carta', stem: 'Which idea is Magna Carta commonly associated with?', options: [{ id: 'law', text: 'Limits on arbitrary power and the rule of law' }, { id: 'vote', text: 'Universal voting at age 18' }, { id: 'nhs', text: 'Creation of the NHS' }, { id: 'eu', text: 'Joining the European Union' }], correctOptionId: 'law', difficulty: 0.46, explanation: 'Magna Carta is an important historical symbol of limits on arbitrary power and the rule of law.' },
  { conceptId: 'modern-history', stem: 'The Industrial Revolution is associated with which broad change?', options: [{ id: 'ind', text: 'Large-scale industrialisation and urban growth' }, { id: 'rom', text: 'Roman conquest' }, { id: 'norm', text: 'Norman rule beginning' }, { id: 'mag', text: 'Signing Magna Carta' }], correctOptionId: 'ind', difficulty: 0.5, explanation: 'The Industrial Revolution transformed production, transport and urban life.' },
  { conceptId: 'rule-of-law', stem: 'What does the rule of law mean in civic life?', options: [{ id: 'all', text: 'The law applies to everyone, including those in authority' }, { id: 'gov', text: 'Government decisions cannot be challenged' }, { id: 'mp', text: 'Only MPs are subject to law' }, { id: 'jury', text: 'Every case must use a jury' }], correctOptionId: 'all', difficulty: 0.5, explanation: 'The rule of law means public power is exercised within law and the law applies to everyone.' },
  { conceptId: 'rights-responsibilities', stem: 'Which is a civic responsibility?', options: [{ id: 'law', text: 'Obeying the law' }, { id: 'peer', text: 'Becoming a peer' }, { id: 'mp', text: 'Standing for Parliament' }, { id: 'jury', text: 'Serving on every jury' }], correctOptionId: 'law', difficulty: 0.42, explanation: 'People are expected to obey the law and respect the rights of others.' },
  { conceptId: 'uk-nations', stem: 'Which four nations make up the United Kingdom?', options: [{ id: 'uk', text: 'England, Scotland, Wales and Northern Ireland' }, { id: 'gb', text: 'England, Scotland, Wales and Ireland' }, { id: 'isles', text: 'England, Scotland, Wales and the Isle of Man' }, { id: 'all', text: 'England, Scotland, Wales and Jersey' }], correctOptionId: 'uk', difficulty: 0.35, explanation: 'The UK consists of England, Scotland, Wales and Northern Ireland.' },
  { conceptId: 'culture-traditions', stem: 'Which statement best reflects the UK’s civic values?', options: [{ id: 'tol', text: 'Respect for law, freedoms and people with different beliefs' }, { id: 'one', text: 'Only one political opinion is permitted' }, { id: 'relig', text: 'Everyone must follow one religion' }, { id: 'gov', text: 'Government cannot be criticised' }], correctOptionId: 'tol', difficulty: 0.4, explanation: 'Civic life includes respect for law, freedoms and people with different beliefs.' }
];

export const QUESTIONS: Question[] = BASE_QUESTIONS.flatMap((question) => [0, 1, 2].map((variant) => ({
  ...question,
  id: `${question.conceptId}-q${variant + 1}`,
  variantId: `${question.conceptId}-v${variant + 1}`,
  stem: variant === 0 ? question.stem : variant === 1 ? `Choose the correct statement: ${question.stem}` : `In different wording: ${question.stem}`,
  difficulty: Math.min(1, question.difficulty + variant * 0.05)
})));

const RuntimeContext = createContext<Runtime | null>(null);

const isoDaysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
const scoreStatus = (score: number, confidence: number) => confidence < 0.75 ? 'More evidence needed' : score >= 0.95 ? 'Strongly Ready' : score >= 0.85 ? 'Pass Ready' : score >= 0.75 ? 'Nearly Ready' : score >= 0.6 ? 'Building' : 'Not Ready';

function isVisualCapture() {
  const search = String((globalThis as any).location?.search ?? '');
  return /[?&]screen=(welcome|diagnostic-result|home|compare-concepts|pass-ready)/.test(search);
}

export function CitizenAIRuntimeProvider({ children }: { children: React.ReactNode }) {
  const visualDemo = isVisualCapture();
  const api = useMemo(() => createCitizenAIApiClient(), []);
  const [backendState, setBackendState] = useState<BackendState>(api.enabled && !visualDemo ? 'connecting' : 'local');
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [remoteDashboard, setRemoteDashboard] = useState<any>(null);
  const [remoteDiagnostic, setRemoteDiagnostic] = useState<any>(null);
  const [remoteLearning, setRemoteLearning] = useState<any>(null);
  const [remoteMockId, setRemoteMockId] = useState<string | null>(null);

  const [examDate, setExamDate] = useState('2026-09-14');
  const [explanationLanguage, setExplanationLanguage] = useState('English');
  const [preparation, setPreparation] = useState('Some');
  const [masteries, setMasteries] = useState<Record<string, MasteryState>>(() => Object.fromEntries(CONCEPTS.map(c => [c.id, createMasteryState({ conceptId: c.id })])));
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswer[]>([]);
  const [lastAttempt, setLastAttempt] = useState<Runtime['lastAttempt']>(null);
  const [sessionActivities, setSessionActivities] = useState<Array<{ conceptId: string; minutes: number }>>([]);
  const [mock, setMock] = useState<any>(null);
  const [mockIndex, setMockIndex] = useState(0);
  const [lastMockResult, setLastMockResult] = useState<any>(null);
  const [localMocksPassed, setLocalMocksPassed] = useState(0);
  const [examOutcome, setExamOutcome] = useState<any>(null);

  async function refreshRemote(id: string) {
    if (!api.enabled || visualDemo) return;
    const [dashboard, diagnostic, learning] = await Promise.all([
      api.dashboard(id),
      api.nextDiagnostic(id),
      api.nextLearning(id)
    ]);
    setRemoteDashboard(dashboard);
    setRemoteDiagnostic(diagnostic);
    setRemoteLearning(learning);
    setBackendState('api');
  }

  async function createRemoteLearner() {
    const learner = await api.createLearner({ examDate, explanationLanguage, preparation });
    await AsyncStorage.setItem(LEARNER_STORAGE_KEY, learner.id);
    setLearnerId(learner.id);
    await refreshRemote(learner.id);
    return learner.id as string;
  }

  useEffect(() => {
    if (!api.enabled || visualDemo) return;
    let cancelled = false;
    (async () => {
      try {
        setBackendState('connecting');
        const storedId = await AsyncStorage.getItem(LEARNER_STORAGE_KEY);
        if (cancelled) return;
        if (storedId) {
          try {
            await api.dashboard(storedId);
            if (cancelled) return;
            setLearnerId(storedId);
            await refreshRemote(storedId);
            return;
          } catch {
            await AsyncStorage.removeItem(LEARNER_STORAGE_KEY);
          }
        }
        if (!cancelled) await createRemoteLearner();
      } catch {
        if (!cancelled) setBackendState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [api, visualDemo]);

  useEffect(() => {
    if (!api.enabled || !learnerId || visualDemo) return;
    const timer = setTimeout(() => {
      api.updateLearner(learnerId, { examDate, explanationLanguage, preparation })
        .catch(() => setBackendState('error'));
    }, 250);
    return () => clearTimeout(timer);
  }, [api, learnerId, examDate, explanationLanguage, preparation, visualDemo]);

  const attemptsByConcept = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of diagnosticAnswers) map.set(a.conceptId, (map.get(a.conceptId) ?? 0) + 1);
    return map;
  }, [diagnosticAnswers]);

  const rankedConcepts = selectDiagnosticQuestion({ concepts: CONCEPTS, attemptsByConcept, limit: 24 });
  const nextConcept = rankedConcepts[0] ?? CONCEPTS[0];
  const nextVariant = attemptsByConcept.get(nextConcept.id) ?? 0;
  const localDiagnosticQuestion = QUESTIONS.find(q => q.conceptId === nextConcept.id && q.id.endsWith(`q${(nextVariant % 3) + 1}`)) ?? QUESTIONS[0];
  const diagnosticQuestion = remoteDiagnostic?.question?.id ? QUESTIONS.find(q => q.id === remoteDiagnostic.question.id) ?? localDiagnosticQuestion : localDiagnosticQuestion;

  const conceptSignals = CONCEPTS.map((concept) => {
    const state = masteries[concept.id] ?? createMasteryState({ conceptId: concept.id });
    const at = new Date().toISOString();
    return {
      ...concept,
      mastery: masteryMean(state),
      confidence: masteryConfidence(state),
      retention: retentionAt(state, at),
      effectiveMastery: effectiveMastery(state, at),
      exposureCount: state.exposureCount,
      variantDiversity: Math.min(1, state.variantIds.length / 3),
      expectedLearningGain: 0.65
    };
  });

  const testedDomains = new Set(diagnosticAnswers.map(a => CONCEPTS.find(c => c.id === a.conceptId)?.domainId).filter(Boolean));
  const important = CONCEPTS.filter(c => c.importance >= 0.75);
  const testedImportant = new Set(diagnosticAnswers.map(a => a.conceptId));
  const variantDiversity = conceptSignals.reduce((sum, c) => sum + c.variantDiversity, 0) / Math.max(1, conceptSignals.length);
  const localReadiness = buildReadiness({
    concepts: conceptSignals,
    coverage: {
      domains: DOMAINS.map(id => ({ id, tested: testedDomains.has(id) })),
      importantConcepts: important.map(c => ({ id: c.id, tested: testedImportant.has(c.id) })),
      mocks: localMocksPassed,
      variantDiversity
    }
  });

  const conceptsById = new Map(CONCEPTS.map(c => [c.id, c]));
  const diagnosticSummary = summarizeDiagnostic({ answers: diagnosticAnswers, conceptsById });
  const localDomainScores = Object.fromEntries(DOMAINS.map(domain => [domain, diagnosticSummary[domain]?.score ?? Math.round(conceptSignals.filter(c => c.domainId === domain).reduce((sum, c) => sum + c.effectiveMastery, 0) / Math.max(1, conceptSignals.filter(c => c.domainId === domain).length) * 100)])) as Record<DomainId, number>;
  const localStudyPlan = buildStudyPlan({ concepts: conceptSignals, availableMinutes: 15 });
  const studyPlan = remoteDashboard?.studyPlan ?? localStudyPlan;
  const practiceConceptId = remoteLearning?.activity?.conceptId ?? studyPlan.activities[0]?.conceptId ?? 'parliament-government';
  const practiceQuestion = remoteLearning?.question?.id ? QUESTIONS.find(q => q.id === remoteLearning.question.id) ?? QUESTIONS.find(q => q.conceptId === practiceConceptId) ?? QUESTIONS[0] : QUESTIONS.find(q => q.conceptId === practiceConceptId) ?? QUESTIONS[0];
  const localCriticalWeakConcepts = conceptSignals.filter(c => c.importance >= 0.8 && c.effectiveMastery < 0.7).length;
  const localPassReady = canUnlockPassReady({ readiness: localReadiness, mocksPassed: localMocksPassed, criticalWeakConcepts: localCriticalWeakConcepts });
  const localMaintenance = maintenanceMode({ daysUntilExam: isoDaysUntil(examDate), concepts: conceptSignals });

  const readinessScore = remoteDashboard?.readiness?.scorePercent ?? Math.round(localReadiness.score * 100);
  const readinessConfidence = remoteDashboard?.readiness?.confidence ?? localReadiness.confidence;
  const readinessStatus = scoreStatus(readinessScore / 100, readinessConfidence);
  const domainScores = (remoteDashboard?.domainScores ?? localDomainScores) as Record<DomainId, number>;
  const mocksPassed = remoteDashboard?.mocksPassed ?? localMocksPassed;
  const criticalWeakConcepts = remoteDashboard?.criticalWeakConcepts ?? localCriticalWeakConcepts;
  const passReady = remoteDashboard?.passReady ?? localPassReady;
  const maintenance = remoteDashboard?.maintenance ?? localMaintenance;

  function updateFromQuestion(question: Question, optionId: string | null, responseQuality = 1) {
    const correct = optionId === question.correctOptionId;
    setMasteries(prev => {
      const previous = prev[question.conceptId] ?? createMasteryState({ conceptId: question.conceptId });
      return { ...prev, [question.conceptId]: updateMastery(previous, {
        correct,
        difficulty: question.difficulty,
        variantId: question.variantId,
        isUnseenVariant: !previous.variantIds.includes(question.variantId),
        responseQuality,
        at: new Date().toISOString()
      }) };
    });
    return correct;
  }

  function syncRemoteAttempt(question: Question, optionId: string | null, sessionType: 'diagnostic' | 'practice' | 'mock') {
    if (!api.enabled || !learnerId || visualDemo) return;
    api.recordAttempt({ learnerId, questionId: question.id, optionId, sessionType })
      .then(() => refreshRemote(learnerId))
      .catch(() => setBackendState('error'));
  }

  function submitDiagnosticAnswer(optionId: string | null) {
    const correct = updateFromQuestion(diagnosticQuestion, optionId);
    const nextAnswers = [...diagnosticAnswers, { conceptId: diagnosticQuestion.conceptId, questionId: diagnosticQuestion.id, optionId, correct }];
    setDiagnosticAnswers(nextAnswers);
    syncRemoteAttempt(diagnosticQuestion, optionId, 'diagnostic');
    const nextDomains = new Set(nextAnswers.map(a => CONCEPTS.find(c => c.id === a.conceptId)?.domainId).filter(Boolean));
    const nextImportant = new Set(nextAnswers.map(a => a.conceptId));
    return shouldCompleteDiagnostic({
      answeredCount: nextAnswers.length,
      minimumQuestions: 20,
      maximumQuestions: 24,
      domainCoverage: nextDomains.size / DOMAINS.length,
      importantConceptCoverage: important.filter(c => nextImportant.has(c.id)).length / Math.max(1, important.length)
    });
  }

  function resetDiagnostic() {
    setDiagnosticAnswers([]);
    setMasteries(Object.fromEntries(CONCEPTS.map(c => [c.id, createMasteryState({ conceptId: c.id })])));
    setRemoteDashboard(null);
    setRemoteDiagnostic(null);
    setRemoteLearning(null);
    if (api.enabled && !visualDemo) {
      createRemoteLearner().catch(() => setBackendState('error'));
    }
  }

  function answerPractice(optionId: string) {
    const correct = updateFromQuestion(practiceQuestion, optionId);
    const signal = conceptSignals.find(c => c.id === practiceQuestion.conceptId)!;
    const remediation = remediationForAttempt({ correct, misconceptionCode: correct ? null : practiceQuestion.misconceptionCode, retention: signal.retention });
    setLastAttempt({ correct, remediation, question: practiceQuestion });
    setSessionActivities(prev => [...prev, { conceptId: practiceQuestion.conceptId, minutes: 3 }]);
    syncRemoteAttempt(practiceQuestion, optionId, 'practice');
  }

  const sessionSummaryRaw = completeLearningSession({ activities: sessionActivities, readinessBefore: null, readinessAfter: readinessScore / 100 });
  const sessionSummary = { minutes: sessionSummaryRaw.minutes, conceptsStrengthened: sessionSummaryRaw.conceptsStrengthened, readinessDelta: sessionSummaryRaw.readinessDelta };

  function startMock() {
    setMock(createMock({ questionPool: QUESTIONS, seed: 42 + localMocksPassed }));
    setMockIndex(0);
    setRemoteMockId(null);
    if (api.enabled && learnerId && !visualDemo) {
      api.startMock(learnerId).then(remote => setRemoteMockId(remote.id)).catch(() => setBackendState('error'));
    }
  }

  function answerMock(optionId: string) {
    if (!mock) return;
    const question = mock.questions[mockIndex];
    const next = recordMockAnswer(mock, { questionId: question.id, optionId });
    setMock(next);
    if (remoteMockId && api.enabled && !visualDemo) {
      api.answerMock(remoteMockId, question.id, optionId).catch(() => setBackendState('error'));
    }
    if (mockIndex < 23) setMockIndex(i => i + 1);
  }

  function finishMock() {
    if (!mock) return null;
    const result = completeMock(mock);
    setLastMockResult(result);
    if (result.passed) setLocalMocksPassed(v => v + 1);
    for (const graded of result.gradedAnswers) {
      const question = QUESTIONS.find(q => q.id === graded.questionId);
      if (question) updateFromQuestion(question, graded.optionId, 0.8);
    }
    setMock(result);
    if (remoteMockId && api.enabled && learnerId && !visualDemo) {
      api.finishMock(remoteMockId).then(remote => {
        setRemoteDashboard(remote.dashboard);
        return refreshRemote(learnerId);
      }).catch(() => setBackendState('error'));
    }
    return result;
  }

  function saveExamOutcome(result: 'passed' | 'failed' | 'rescheduled', consent = false, feedback: Record<string, boolean> = {}) {
    setExamOutcome(recordExamOutcome({ result, consentToCalibration: consent, feedback }));
    if (api.enabled && learnerId && !visualDemo) {
      api.saveOutcome({ learnerId, result, consentToCalibration: consent, feedback }).catch(() => setBackendState('error'));
    }
  }

  const value: Runtime = {
    examDate, explanationLanguage, preparation, setExamDate, setExplanationLanguage, setPreparation,
    daysUntilExam: isoDaysUntil(examDate), visualDemo, backendState, learnerId,
    diagnosticQuestion,
    diagnosticAnswered: remoteDiagnostic?.answered ?? remoteDashboard?.diagnosticAnswered ?? diagnosticAnswers.length,
    diagnosticTarget: remoteDiagnostic?.target ?? 24,
    submitDiagnosticAnswer, resetDiagnostic,
    domainScores,
    readinessScore, readinessConfidence, readinessStatus,
    studyPlan,
    conceptById: (id) => CONCEPTS.find(c => c.id === id),
    practiceQuestion, lastAttempt, answerPractice, sessionSummary,
    startMock, mock, currentMockQuestion: mock?.questions?.[mockIndex] ?? null, answerMock, finishMock, lastMockResult, mocksPassed,
    passReady, criticalWeakConcepts, maintenance, saveExamOutcome, examOutcome
  };

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}

export function useCitizenAI() {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error('useCitizenAI must be used inside CitizenAIRuntimeProvider');
  return value;
}
