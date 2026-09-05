import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { once } from 'node:events';
import { createRuntimeHttpHandler } from '../../src/citizenai/runtime-http.mjs';
import { MemoryRuntimeRepository } from '../../src/citizenai/runtime-repository.mjs';
import { createRuntimeService } from '../../src/citizenai/runtime-service.mjs';
import { assertRuntimeLaunchPolicy } from '../../src/citizenai/api-server.mjs';
import { UK_ACTIVE_PACK } from '../../src/citizenai/uk-active-pack.mjs';

async function withServer({ service, ...handlerOptions }, fn) {
  const server = http.createServer(createRuntimeHttpHandler({ service, ...handlerOptions }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function jsonRequest(baseUrl, path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? headers : { 'content-type': 'application/json', ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; }
  catch { payload = text; }
  return { response, payload, text };
}

test('HTTP boundary applies security headers and rejects unapproved browser origins', async () => {
  await withServer({ service: {}, allowedOrigin: 'https://app.example' }, async (baseUrl) => {
    const allowed = await jsonRequest(baseUrl, '/healthz', { headers: { origin: 'https://app.example' } });
    assert.equal(allowed.response.status, 200);
    assert.equal(allowed.response.headers.get('access-control-allow-origin'), 'https://app.example');
    assert.equal(allowed.response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(allowed.response.headers.get('x-frame-options'), 'DENY');
    assert.equal(allowed.response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(allowed.response.headers.get('content-security-policy'), /default-src 'none'/);
    assert.ok(allowed.response.headers.get('x-request-id'));

    const blocked = await jsonRequest(baseUrl, '/healthz', { headers: { origin: 'https://evil.example' } });
    assert.equal(blocked.response.status, 403);
    assert.equal(blocked.response.headers.get('access-control-allow-origin'), null);
    assert.equal(blocked.payload.error, 'origin_not_allowed');
  });
});

test('HTTP boundary rejects unsupported content types, malformed JSON and oversized bodies', async () => {
  const repository = new MemoryRuntimeRepository();
  const service = createRuntimeService({ repository });
  await withServer({ service, maxBodyBytes: 64 }, async (baseUrl) => {
    const wrongType = await jsonRequest(baseUrl, '/v1/learners', {
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'text/plain' }
    });
    assert.equal(wrongType.response.status, 415);

    const malformed = await jsonRequest(baseUrl, '/v1/learners', { method: 'POST', body: '{nope' });
    assert.equal(malformed.response.status, 400);

    const oversized = await jsonRequest(baseUrl, '/v1/learners', {
      method: 'POST',
      body: { explanationLanguage: 'x'.repeat(100) }
    });
    assert.equal(oversized.response.status, 413);
  });
});

test('unexpected server failures never expose internal error messages to clients', async () => {
  const learnerId = crypto.randomUUID();
  const service = {
    async dashboard() { throw new Error('DATABASE_URL=supersecret'); }
  };
  await withServer({ service }, async (baseUrl) => {
    const result = await jsonRequest(baseUrl, '/v1/dashboard', {
      headers: { 'x-citizenai-learner-id': learnerId }
    });
    assert.equal(result.response.status, 500);
    assert.equal(result.payload.error, 'internal_error');
    assert.ok(result.payload.requestId);
    assert.doesNotMatch(result.text, /DATABASE_URL|supersecret/);
    assert.equal('message' in result.payload, false);
  });
});

test('HTTP boundary rate limits repeated non-health requests', async () => {
  const learnerId = crypto.randomUUID();
  const service = { async dashboard() { return { ok: true }; } };
  await withServer({ service, rateLimitMaxRequests: 2, rateLimitWindowMs: 60_000 }, async (baseUrl) => {
    const headers = { 'x-citizenai-learner-id': learnerId };
    assert.equal((await jsonRequest(baseUrl, '/v1/dashboard', { headers })).response.status, 200);
    assert.equal((await jsonRequest(baseUrl, '/v1/dashboard', { headers })).response.status, 200);
    const limited = await jsonRequest(baseUrl, '/v1/dashboard', { headers });
    assert.equal(limited.response.status, 429);
    assert.equal(limited.payload.error, 'rate_limited');
    assert.ok(Number(limited.response.headers.get('retry-after')) >= 1);
  });
});

test('runtime rejects invalid ownership/input references before persistence', async () => {
  const repository = new MemoryRuntimeRepository();
  const service = createRuntimeService({ repository });
  const missingLearner = crypto.randomUUID();

  await assert.rejects(() => service.nextDiagnosticQuestion(missingLearner), (error) => error.statusCode === 404);
  await assert.rejects(() => service.saveSnapshot(missingLearner, { screen: 'home' }), (error) => error.statusCode === 404);
  await assert.rejects(() => service.saveExamOutcome({ learnerId: missingLearner, result: 'passed' }), (error) => error.statusCode === 404);

  const learner = await service.createLearner({ examDate: '2026-09-30' });
  await assert.rejects(() => service.updateLearner(learner.id, { admin: true }), (error) => error.statusCode === 400);
  const next = await service.nextDiagnosticQuestion(learner.id);
  await assert.rejects(() => service.recordAttempt({
    learnerId: learner.id,
    questionId: next.question.id,
    optionId: 'not-an-option',
    sessionType: 'diagnostic'
  }), (error) => error.statusCode === 400);
  assert.equal((await repository.listAttempts(learner.id)).length, 0);
});

test('mock completion is idempotent and completed mocks cannot be reopened', async () => {
  const repository = new MemoryRuntimeRepository();
  const service = createRuntimeService({ repository });
  const learner = await service.createLearner({});
  const mock = await service.startMock(learner.id);
  const first = mock.questions[0];
  const full = UK_ACTIVE_PACK.questions.find((question) => question.id === first.id);
  assert.ok(full);

  await service.answerMock(mock.id, { questionId: first.id, optionId: full.correctOptionId });
  const completedOnce = await service.finishMock(mock.id);
  const attemptsAfterFirst = await repository.listAttempts(learner.id);
  assert.equal(attemptsAfterFirst.filter((attempt) => attempt.sessionType === 'mock').length, 1);

  const completedTwice = await service.finishMock(mock.id);
  const attemptsAfterSecond = await repository.listAttempts(learner.id);
  assert.equal(attemptsAfterSecond.filter((attempt) => attempt.sessionType === 'mock').length, 1);
  assert.equal(completedTwice.score, completedOnce.score);

  await assert.rejects(() => service.answerMock(mock.id, {
    questionId: first.id,
    optionId: full.correctOptionId
  }), (error) => error.statusCode === 409);
});

test('production launch is fail-closed until consumer authentication exists', () => {
  assert.throws(
    () => assertRuntimeLaunchPolicy({ environment: 'production', allowedOrigin: '*' }),
    /wildcard CORS/
  );
  assert.throws(
    () => assertRuntimeLaunchPolicy({ environment: 'production', allowedOrigin: 'https:\/\/app.citizenai.example' }),
    /authentication is implemented/
  );
  assert.equal(assertRuntimeLaunchPolicy({ environment: 'staging', allowedOrigin: '*' }), true);
});
