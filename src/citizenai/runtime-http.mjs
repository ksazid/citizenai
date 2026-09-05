import crypto from 'node:crypto';
import { URL } from 'node:url';
import { bearerTokenFromRequest } from './runtime-access.mjs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_MAX_BODY_BYTES = 256 * 1024;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX = 120;
const DEFAULT_CREATE_WINDOW_MS = 10 * 60_000;
const DEFAULT_CREATE_MAX = 30;

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function assertUuid(value, label) {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw httpError(400, `${label} must be a valid UUID`);
  return value;
}

async function readJson(req, maxBodyBytes = DEFAULT_MAX_BODY_BYTES) {
  const contentType = String(req.headers['content-type'] ?? '').toLowerCase();
  if (!/^application\/(?:[a-z0-9.+-]+\+)?json(?:\s*;|$)/i.test(contentType)) {
    throw httpError(415, 'content-type must be application/json');
  }

  const declaredLength = Number(req.headers['content-length']);
  if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
    throw httpError(413, `request body exceeds ${maxBodyBytes} bytes`);
  }

  const chunks = [];
  let received = 0;
  for await (const chunk of req) {
    received += chunk.length;
    if (received > maxBodyBytes) throw httpError(413, `request body exceeds ${maxBodyBytes} bytes`);
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); }
  catch { throw httpError(400, 'invalid JSON body'); }
}

function normalizeAllowedOrigins(value) {
  if (Array.isArray(value)) return [...new Set(value.map(String).map((row) => row.trim()).filter(Boolean))];
  const text = String(value ?? '').trim();
  if (!text) return [];
  if (text === '*') return ['*'];
  return [...new Set(text.split(',').map((row) => row.trim()).filter(Boolean))];
}

function requestOrigin(req) {
  const value = req.headers.origin;
  return Array.isArray(value) ? value[0] : value ?? null;
}

function resolveCorsOrigin(allowedOrigins, origin) {
  if (allowedOrigins.includes('*')) return '*';
  if (!origin) return null;
  return allowedOrigins.includes(origin) ? origin : null;
}

function send(res, statusCode, payload, { corsOrigin = null, requestId, extraHeaders = {} } = {}) {
  const body = statusCode === 204 ? '' : JSON.stringify(payload);
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-headers': 'content-type,x-citizenai-learner-id,authorization',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,OPTIONS',
    'access-control-max-age': '600',
    'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
    'permissions-policy': 'camera=(), microphone=(), geolocation=()',
    'referrer-policy': 'no-referrer',
    'strict-transport-security': 'max-age=31536000; includeSubDomains',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-request-id': requestId,
    ...extraHeaders
  };
  if (corsOrigin) headers['access-control-allow-origin'] = corsOrigin;
  if (corsOrigin && corsOrigin !== '*') headers.vary = 'Origin';
  res.writeHead(statusCode, headers);
  res.end(body);
}

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function createFixedWindowLimiter({ windowMs, maxRequests, maxEntries = 10_000 }) {
  const buckets = new Map();
  let requestsSeen = 0;

  return function consume(key, now = Date.now()) {
    if (!(maxRequests > 0) || !(windowMs > 0)) return { allowed: true, retryAfterSeconds: 0 };
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    requestsSeen += 1;

    if (requestsSeen % 1000 === 0 && buckets.size > maxEntries) {
      for (const [bucketKey, value] of buckets) {
        if (now - value.startedAt >= windowMs) buckets.delete(bucketKey);
      }
      while (buckets.size > maxEntries) buckets.delete(buckets.keys().next().value);
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000));
    return { allowed: bucket.count <= maxRequests, retryAfterSeconds };
  };
}

function learnerIdFromRequest(req, url) {
  const headerValue = req.headers['x-citizenai-learner-id'];
  const fromHeader = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return assertUuid(fromHeader || url.searchParams.get('learnerId'), 'learnerId');
}

export function createRuntimeHttpHandler({
  service,
  issueLearnerAccessToken,
  authorizeLearner,
  resolveMockLearnerId,
  allowedOrigin = '*',
  maxBodyBytes = DEFAULT_MAX_BODY_BYTES,
  rateLimitWindowMs = DEFAULT_RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests = DEFAULT_RATE_LIMIT_MAX,
  learnerCreateWindowMs = DEFAULT_CREATE_WINDOW_MS,
  learnerCreateMaxRequests = DEFAULT_CREATE_MAX
}) {
  if (!service) throw new Error('runtime service required');
  if (typeof issueLearnerAccessToken !== 'function') throw new Error('issueLearnerAccessToken required');
  if (typeof authorizeLearner !== 'function') throw new Error('authorizeLearner required');
  if (typeof resolveMockLearnerId !== 'function') throw new Error('resolveMockLearnerId required');
  const allowedOrigins = normalizeAllowedOrigins(allowedOrigin);
  const generalLimiter = createFixedWindowLimiter({ windowMs: rateLimitWindowMs, maxRequests: rateLimitMaxRequests });
  const learnerCreateLimiter = createFixedWindowLimiter({ windowMs: learnerCreateWindowMs, maxRequests: learnerCreateMaxRequests });

  async function requireLearnerAccess(req, learnerId) {
    const token = bearerTokenFromRequest(req);
    if (!token || !await authorizeLearner(learnerId, token)) throw httpError(401, 'authentication required');
  }

  async function requireMockAccess(req, mockId) {
    const learnerId = await resolveMockLearnerId(mockId);
    if (!learnerId) throw httpError(404, 'mock not found');
    await requireLearnerAccess(req, learnerId);
  }

  return async function handler(req, res) {
    const requestId = crypto.randomUUID();
    let path = '/';
    const origin = requestOrigin(req);
    const corsOrigin = resolveCorsOrigin(allowedOrigins, origin);

    try {
      if (origin && !corsOrigin) {
        return send(res, 403, { error: 'origin_not_allowed', message: 'request origin is not allowed' }, { requestId });
      }

      if (req.method === 'OPTIONS') return send(res, 204, {}, { corsOrigin, requestId });
      const url = new URL(req.url ?? '/', 'http://citizenai.local');
      path = url.pathname;

      if (req.method === 'GET' && path === '/healthz') {
        return send(res, 200, { ok: true, service: 'citizenai-runtime-api' }, { corsOrigin, requestId });
      }

      const key = clientKey(req);
      const rate = generalLimiter(key);
      if (!rate.allowed) {
        return send(res, 429, { error: 'rate_limited', message: 'too many requests' }, {
          corsOrigin,
          requestId,
          extraHeaders: { 'retry-after': String(rate.retryAfterSeconds) }
        });
      }

      if (req.method === 'POST' && path === '/v1/learners') {
        const createRate = learnerCreateLimiter(key);
        if (!createRate.allowed) {
          return send(res, 429, { error: 'rate_limited', message: 'too many learner creation requests' }, {
            corsOrigin,
            requestId,
            extraHeaders: { 'retry-after': String(createRate.retryAfterSeconds) }
          });
        }
        const learner = await service.createLearner(await readJson(req, maxBodyBytes));
        return send(res, 201, { ...learner, accessToken: issueLearnerAccessToken(learner.id) }, { corsOrigin, requestId });
      }

      const learnerMatch = path.match(/^\/v1\/learners\/([^/]+)$/);
      if (learnerMatch && req.method === 'PATCH') {
        const learnerId = assertUuid(learnerMatch[1], 'learnerId');
        await requireLearnerAccess(req, learnerId);
        return send(res, 200, await service.updateLearner(learnerId, await readJson(req, maxBodyBytes)), { corsOrigin, requestId });
      }

      const learnerSnapshotMatch = path.match(/^\/v1\/learners\/([^/]+)\/snapshot$/);
      if (learnerSnapshotMatch && req.method === 'GET') {
        const learnerId = assertUuid(learnerSnapshotMatch[1], 'learnerId');
        await requireLearnerAccess(req, learnerId);
        return send(res, 200, { snapshot: await service.getSnapshot(learnerId) }, { corsOrigin, requestId });
      }
      if (learnerSnapshotMatch && req.method === 'PUT') {
        const learnerId = assertUuid(learnerSnapshotMatch[1], 'learnerId');
        await requireLearnerAccess(req, learnerId);
        const body = await readJson(req, maxBodyBytes);
        return send(res, 200, await service.saveSnapshot(learnerId, body.state ?? body), { corsOrigin, requestId });
      }

      if (req.method === 'GET' && path === '/v1/dashboard') {
        const learnerId = learnerIdFromRequest(req, url);
        await requireLearnerAccess(req, learnerId);
        return send(res, 200, await service.dashboard(learnerId), { corsOrigin, requestId });
      }
      if (req.method === 'GET' && path === '/v1/diagnostic/next') {
        const learnerId = learnerIdFromRequest(req, url);
        await requireLearnerAccess(req, learnerId);
        return send(res, 200, await service.nextDiagnosticQuestion(learnerId), { corsOrigin, requestId });
      }
      if (req.method === 'GET' && path === '/v1/study-plan/today') {
        const learnerId = learnerIdFromRequest(req, url);
        await requireLearnerAccess(req, learnerId);
        const dashboard = await service.dashboard(learnerId);
        return send(res, 200, dashboard.studyPlan, { corsOrigin, requestId });
      }
      if (req.method === 'GET' && path === '/v1/readiness') {
        const learnerId = learnerIdFromRequest(req, url);
        await requireLearnerAccess(req, learnerId);
        const dashboard = await service.dashboard(learnerId);
        return send(res, 200, { ...dashboard.readiness, passReady: dashboard.passReady, coverageConfidence: dashboard.readiness.confidence }, { corsOrigin, requestId });
      }
      if (req.method === 'GET' && path === '/v1/learning/next') {
        const learnerId = learnerIdFromRequest(req, url);
        await requireLearnerAccess(req, learnerId);
        return send(res, 200, await service.nextLearningAction(learnerId), { corsOrigin, requestId });
      }
      if (req.method === 'POST' && path === '/v1/attempts') {
        const body = await readJson(req, maxBodyBytes);
        const learnerId = assertUuid(body.learnerId, 'learnerId');
        await requireLearnerAccess(req, learnerId);
        return send(res, 200, await service.recordAttempt(body), { corsOrigin, requestId });
      }
      if (req.method === 'POST' && path === '/v1/mocks') {
        const body = await readJson(req, maxBodyBytes);
        const learnerId = assertUuid(body.learnerId, 'learnerId');
        await requireLearnerAccess(req, learnerId);
        return send(res, 201, await service.startMock(learnerId), { corsOrigin, requestId });
      }

      const mockAnswerMatch = path.match(/^\/v1\/mocks\/([^/]+)\/answer$/);
      if (mockAnswerMatch && req.method === 'POST') {
        const mockId = assertUuid(mockAnswerMatch[1], 'mockId');
        await requireMockAccess(req, mockId);
        return send(res, 200, await service.answerMock(mockId, await readJson(req, maxBodyBytes)), { corsOrigin, requestId });
      }

      const mockCompleteMatch = path.match(/^\/v1\/mocks\/([^/]+)\/complete$/);
      if (mockCompleteMatch && req.method === 'POST') {
        const mockId = assertUuid(mockCompleteMatch[1], 'mockId');
        await requireMockAccess(req, mockId);
        await readJson(req, maxBodyBytes);
        return send(res, 200, await service.finishMock(mockId), { corsOrigin, requestId });
      }

      if (req.method === 'POST' && path === '/v1/exam-outcomes') {
        const body = await readJson(req, maxBodyBytes);
        const learnerId = assertUuid(body.learnerId, 'learnerId');
        await requireLearnerAccess(req, learnerId);
        return send(res, 201, await service.saveExamOutcome(body), { corsOrigin, requestId });
      }
      return send(res, 404, { error: 'not_found' }, { corsOrigin, requestId });
    } catch (error) {
      const statusCode = Number(error?.statusCode) || 500;
      if (statusCode >= 500) {
        console.error('CitizenAI runtime request failed', {
          requestId,
          method: req.method,
          path,
          errorCode: error?.code ?? error?.name ?? 'Error'
        });
      }
      return send(res, statusCode, statusCode >= 500
        ? { error: 'internal_error', requestId }
        : { error: statusCode === 401 ? 'unauthorized' : 'request_error', message: error?.message ?? 'request failed', requestId },
      { corsOrigin, requestId });
    }
  };
}
