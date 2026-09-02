declare const process: { env?: Record<string, string | undefined> };

export type RemoteQuestion = {
  id: string;
  conceptId: string;
  stem: string;
  options: Array<{ id: string; text: string }>;
  difficulty: number;
  variantId: string;
};

type RequestInitLike = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

const configuredBaseUrl = () => String(process?.env?.EXPO_PUBLIC_CITIZENAI_API_URL ?? '').replace(/\/$/, '');

export function createCitizenAIApiClient(baseUrl = configuredBaseUrl()) {
  const enabled = Boolean(baseUrl);

  async function request<T>(path: string, init: RequestInitLike = {}): Promise<T> {
    if (!enabled) throw new Error('CitizenAI API URL is not configured');
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message ?? `CitizenAI API ${response.status}`);
    return payload as T;
  }

  return Object.freeze({
    enabled,
    baseUrl,
    health: () => request<{ ok: boolean }>('/healthz'),
    createLearner: (body: { examDate?: string | null; explanationLanguage?: string; preparation?: string }) =>
      request<any>('/v1/learners', { method: 'POST', body: JSON.stringify(body) }),
    updateLearner: (learnerId: string, body: { examDate?: string | null; explanationLanguage?: string; preparation?: string }) =>
      request<any>(`/v1/learners/${encodeURIComponent(learnerId)}`, { method: 'PATCH', body: JSON.stringify(body) }),
    dashboard: (learnerId: string) => request<any>(`/v1/dashboard?learnerId=${encodeURIComponent(learnerId)}`),
    nextDiagnostic: (learnerId: string) => request<{ question: RemoteQuestion; answered: number; target: number }>(`/v1/diagnostic/next?learnerId=${encodeURIComponent(learnerId)}`),
    recordAttempt: (body: { learnerId: string; questionId: string; optionId: string | null; sessionType: 'diagnostic' | 'practice' | 'mock'; responseMs?: number }) =>
      request<any>('/v1/attempts', { method: 'POST', body: JSON.stringify(body) }),
    nextLearning: (learnerId: string) => request<any>(`/v1/learning/next?learnerId=${encodeURIComponent(learnerId)}`),
    startMock: (learnerId: string) => request<any>('/v1/mocks', { method: 'POST', body: JSON.stringify({ learnerId }) }),
    answerMock: (mockId: string, questionId: string, optionId: string) =>
      request<any>(`/v1/mocks/${encodeURIComponent(mockId)}/answer`, { method: 'POST', body: JSON.stringify({ questionId, optionId }) }),
    finishMock: (mockId: string) => request<any>(`/v1/mocks/${encodeURIComponent(mockId)}/complete`, { method: 'POST', body: '{}' }),
    saveOutcome: (body: { learnerId: string; result: 'passed' | 'failed' | 'rescheduled'; consentToCalibration?: boolean; feedback?: Record<string, boolean> }) =>
      request<any>('/v1/exam-outcomes', { method: 'POST', body: JSON.stringify(body) }),
    getSnapshot: (learnerId: string) => request<any>(`/v1/learners/${encodeURIComponent(learnerId)}/snapshot`),
    saveSnapshot: (learnerId: string, state: unknown) =>
      request<any>(`/v1/learners/${encodeURIComponent(learnerId)}/snapshot`, { method: 'PUT', body: JSON.stringify({ state }) })
  });
}
