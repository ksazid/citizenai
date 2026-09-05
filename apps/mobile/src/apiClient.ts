import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: { env: { EXPO_PUBLIC_CITIZENAI_API_URL?: string } };

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

const ACCESS_TOKEN_PREFIX = 'citizenai.runtime.guestAccess.v1.';
const MOCK_LEARNER_PREFIX = 'citizenai.runtime.mockLearner.v1.';

// Expo substitutes EXPO_PUBLIC_* values only when referenced with static dot notation.
const configuredBaseUrl = () => String(process.env.EXPO_PUBLIC_CITIZENAI_API_URL ?? '').replace(/\/$/, '');
const learnerTokenKey = (learnerId: string) => `${ACCESS_TOKEN_PREFIX}${learnerId}`;
const mockLearnerKey = (mockId: string) => `${MOCK_LEARNER_PREFIX}${mockId}`;

export function createCitizenAIApiClient(baseUrl = configuredBaseUrl()) {
  const enabled = Boolean(baseUrl);

  async function request<T>(path: string, init: RequestInitLike = {}): Promise<T> {
    if (!enabled) throw new Error('CitizenAI API URL is not configured');
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init.headers ?? {}) }
    });
    const text = await response.text();
    let payload: any = null;
    try { payload = text ? JSON.parse(text) : null; }
    catch { payload = null; }
    if (!response.ok) throw new Error(payload?.message ?? `CitizenAI API ${response.status}`);
    if (payload === null && text) throw new Error('CitizenAI API returned invalid JSON');
    return payload as T;
  }

  async function learnerHeaders(learnerId: string) {
    const token = await AsyncStorage.getItem(learnerTokenKey(learnerId));
    return {
      'x-citizenai-learner-id': learnerId,
      ...(token ? { authorization: `Bearer ${token}` } : {})
    };
  }

  async function learnerRequest<T>(learnerId: string, path: string, init: RequestInitLike = {}) {
    return request<T>(path, { ...init, headers: { ...(await learnerHeaders(learnerId)), ...(init.headers ?? {}) } });
  }

  async function mockRequest<T>(mockId: string, path: string, init: RequestInitLike = {}) {
    const learnerId = await AsyncStorage.getItem(mockLearnerKey(mockId));
    if (!learnerId) return request<T>(path, init); // Backward-compatible while old staging is still deployed.
    return learnerRequest<T>(learnerId, path, init);
  }

  return Object.freeze({
    enabled,
    baseUrl,
    health: () => request<{ ok: boolean }>('/healthz'),
    createLearner: async (body: { examDate?: string | null; explanationLanguage?: string; preparation?: string }) => {
      const learner = await request<any>('/v1/learners', { method: 'POST', body: JSON.stringify(body) });
      if (learner?.id && learner?.accessToken) await AsyncStorage.setItem(learnerTokenKey(learner.id), learner.accessToken);
      return learner;
    },
    updateLearner: (learnerId: string, body: { examDate?: string | null; explanationLanguage?: string; preparation?: string }) =>
      learnerRequest<any>(learnerId, `/v1/learners/${encodeURIComponent(learnerId)}`, { method: 'PATCH', body: JSON.stringify(body) }),
    dashboard: (learnerId: string) => learnerRequest<any>(learnerId, '/v1/dashboard'),
    nextDiagnostic: (learnerId: string) => learnerRequest<{ question: RemoteQuestion; answered: number; target: number }>(learnerId, '/v1/diagnostic/next'),
    recordAttempt: (body: { learnerId: string; questionId: string; optionId: string | null; sessionType: 'diagnostic' | 'practice' | 'mock'; responseMs?: number }) =>
      learnerRequest<any>(body.learnerId, '/v1/attempts', { method: 'POST', body: JSON.stringify(body) }),
    nextLearning: (learnerId: string) => learnerRequest<any>(learnerId, '/v1/learning/next'),
    startMock: async (learnerId: string) => {
      const mock = await learnerRequest<any>(learnerId, '/v1/mocks', { method: 'POST', body: JSON.stringify({ learnerId }) });
      if (mock?.id) await AsyncStorage.setItem(mockLearnerKey(mock.id), learnerId);
      return mock;
    },
    answerMock: (mockId: string, questionId: string, optionId: string) =>
      mockRequest<any>(mockId, `/v1/mocks/${encodeURIComponent(mockId)}/answer`, { method: 'POST', body: JSON.stringify({ questionId, optionId }) }),
    finishMock: async (mockId: string) => {
      const result = await mockRequest<any>(mockId, `/v1/mocks/${encodeURIComponent(mockId)}/complete`, { method: 'POST', body: '{}' });
      await AsyncStorage.removeItem(mockLearnerKey(mockId));
      return result;
    },
    saveOutcome: (body: { learnerId: string; result: 'passed' | 'failed' | 'rescheduled'; consentToCalibration?: boolean; feedback?: Record<string, boolean> }) =>
      learnerRequest<any>(body.learnerId, '/v1/exam-outcomes', { method: 'POST', body: JSON.stringify(body) }),
    getSnapshot: (learnerId: string) => learnerRequest<any>(learnerId, `/v1/learners/${encodeURIComponent(learnerId)}/snapshot`),
    saveSnapshot: (learnerId: string, state: unknown) =>
      learnerRequest<any>(learnerId, `/v1/learners/${encodeURIComponent(learnerId)}/snapshot`, { method: 'PUT', body: JSON.stringify({ state }) })
  });
}
