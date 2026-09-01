export const UK_MOCK_CONTRACT = Object.freeze({ questions: 24, minutes: 45, passMark: 0.75 });

export function createMock({ questionPool, seed = 42 }) {
  if (!Array.isArray(questionPool) || questionPool.length < UK_MOCK_CONTRACT.questions) throw new Error('At least 24 questions required');
  const pool = [...questionPool];
  let x = seed >>> 0;
  const rand = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; };
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return {
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    durationMinutes: UK_MOCK_CONTRACT.minutes,
    questions: pool.slice(0, UK_MOCK_CONTRACT.questions).map((q, index) => ({ index: index + 1, ...q })),
    answers: []
  };
}

export function recordMockAnswer(mock, answer) {
  if (mock.status !== 'in_progress') throw new Error('Mock is not active');
  const exists = mock.questions.some((q) => q.id === answer.questionId);
  if (!exists) throw new Error('Question is not part of this mock');
  const remaining = mock.answers.filter((a) => a.questionId !== answer.questionId);
  return { ...mock, answers: [...remaining, answer] };
}

export function completeMock(mock) {
  const byId = new Map(mock.questions.map((q) => [q.id, q]));
  const graded = mock.answers.map((a) => {
    const q = byId.get(a.questionId);
    return { ...a, correct: Boolean(q && a.optionId === q.correctOptionId), conceptId: q?.conceptId ?? null };
  });
  const correct = graded.filter((a) => a.correct).length;
  const score = correct / UK_MOCK_CONTRACT.questions;
  const passed = score >= UK_MOCK_CONTRACT.passMark;
  const conceptErrors = graded.filter((a) => !a.correct && a.conceptId).reduce((acc, a) => {
    acc[a.conceptId] = (acc[a.conceptId] ?? 0) + 1;
    return acc;
  }, {});
  return {
    ...mock,
    status: 'completed',
    completedAt: new Date().toISOString(),
    gradedAnswers: graded,
    correct,
    total: UK_MOCK_CONTRACT.questions,
    score,
    passed,
    conceptErrors,
    masteryEvidenceWeight: 0.8
  };
}
