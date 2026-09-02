import { URL } from 'node:url';

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); }
  catch { throw Object.assign(new Error('invalid JSON body'), { statusCode: 400 }); }
}

function send(res, statusCode, payload, origin = '*') {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-origin': origin,
    'access-control-allow-headers': 'content-type,x-citizenai-learner-id',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,OPTIONS',
    'cache-control': 'no-store'
  });
  res.end(body);
}

export function createRuntimeHttpHandler({ service, allowedOrigin = '*' }) {
  if (!service) throw new Error('runtime service required');

  return async function handler(req, res) {
    if (req.method === 'OPTIONS') return send(res, 204, {}, allowedOrigin);
    const url = new URL(req.url ?? '/', 'http://citizenai.local');
    const path = url.pathname;
    try {
      if (req.method === 'GET' && path === '/healthz') {
        return send(res, 200, { ok: true, service: 'citizenai-runtime-api' }, allowedOrigin);
      }
      if (req.method === 'POST' && path === '/v1/learners') {
        return send(res, 201, await service.createLearner(await readJson(req)), allowedOrigin);
      }
      const learnerMatch = path.match(/^\/v1\/learners\/([^/]+)$/);
      if (learnerMatch && req.method === 'PATCH') {
        return send(res, 200, await service.updateLearner(learnerMatch[1], await readJson(req)), allowedOrigin);
      }
      const learnerSnapshotMatch = path.match(/^\/v1\/learners\/([^/]+)\/snapshot$/);
      if (learnerSnapshotMatch && req.method === 'GET') {
        return send(res, 200, { snapshot: await service.getSnapshot(learnerSnapshotMatch[1]) }, allowedOrigin);
      }
      if (learnerSnapshotMatch && req.method === 'PUT') {
        const body = await readJson(req);
        return send(res, 200, await service.saveSnapshot(learnerSnapshotMatch[1], body.state ?? body), allowedOrigin);
      }
      if (req.method === 'GET' && path === '/v1/dashboard') {
        return send(res, 200, await service.dashboard(url.searchParams.get('learnerId')), allowedOrigin);
      }
      if (req.method === 'GET' && path === '/v1/diagnostic/next') {
        return send(res, 200, await service.nextDiagnosticQuestion(url.searchParams.get('learnerId')), allowedOrigin);
      }
      if (req.method === 'GET' && path === '/v1/study-plan/today') {
        const dashboard = await service.dashboard(url.searchParams.get('learnerId'));
        return send(res, 200, dashboard.studyPlan, allowedOrigin);
      }
      if (req.method === 'GET' && path === '/v1/readiness') {
        const dashboard = await service.dashboard(url.searchParams.get('learnerId'));
        return send(res, 200, { ...dashboard.readiness, passReady: dashboard.passReady, coverageConfidence: dashboard.readiness.confidence }, allowedOrigin);
      }
      if (req.method === 'GET' && path === '/v1/learning/next') {
        return send(res, 200, await service.nextLearningAction(url.searchParams.get('learnerId')), allowedOrigin);
      }
      if (req.method === 'POST' && path === '/v1/attempts') {
        return send(res, 200, await service.recordAttempt(await readJson(req)), allowedOrigin);
      }
      if (req.method === 'POST' && path === '/v1/mocks') {
        const body = await readJson(req);
        return send(res, 201, await service.startMock(body.learnerId), allowedOrigin);
      }
      const mockAnswerMatch = path.match(/^\/v1\/mocks\/([^/]+)\/answer$/);
      if (mockAnswerMatch && req.method === 'POST') {
        return send(res, 200, await service.answerMock(mockAnswerMatch[1], await readJson(req)), allowedOrigin);
      }
      const mockCompleteMatch = path.match(/^\/v1\/mocks\/([^/]+)\/complete$/);
      if (mockCompleteMatch && req.method === 'POST') {
        return send(res, 200, await service.finishMock(mockCompleteMatch[1]), allowedOrigin);
      }
      if (req.method === 'POST' && path === '/v1/exam-outcomes') {
        return send(res, 201, await service.saveExamOutcome(await readJson(req)), allowedOrigin);
      }
      return send(res, 404, { error: 'not_found' }, allowedOrigin);
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;
      return send(res, statusCode, {
        error: statusCode >= 500 ? 'internal_error' : 'request_error',
        message: error?.message ?? String(error)
      }, allowedOrigin);
    }
  };
}
