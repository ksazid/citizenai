import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const baseUrl = (process.env.CITIZENAI_STAGING_API_URL ?? 'https://citizenai-api-staging.onrender.com').replace(/\/$/, '');

async function request(path, { method = 'GET', body, learnerId, accessToken } = {}) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (learnerId) headers['x-citizenai-learner-id'] = learnerId;
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; }
  catch { payload = text; }
  if (!response.ok) {
    throw new Error(`${method} ${path} -> ${response.status}: ${text}`);
  }
  return payload;
}

const health = await request('/healthz');
assert.equal(health.ok, true);
assert.equal(health.service, 'citizenai-runtime-api');

const learner = await request('/v1/learners', {
  method: 'POST',
  body: {
    preparation: 'Some',
    explanationLanguage: 'English'
  }
});
assert.match(learner.id, /^[0-9a-f-]{36}$/i);
assert.ok(learner.pack?.version);
assert.match(learner.accessToken, /^citizenai_guest_/);

const auth = { learnerId: learner.id, accessToken: learner.accessToken };

const unauthorized = await fetch(`${baseUrl}/v1/dashboard`, {
  headers: { 'x-citizenai-learner-id': learner.id }
});
assert.equal(unauthorized.status, 401);

const next = await request('/v1/diagnostic/next', auth);
assert.ok(next.question?.id);
assert.ok(Array.isArray(next.question?.options));
assert.ok(next.question.options.length >= 2);

const attempt = await request('/v1/attempts', {
  ...auth,
  method: 'POST',
  body: {
    learnerId: learner.id,
    questionId: next.question.id,
    optionId: next.question.options[0].id,
    sessionType: 'diagnostic',
    responseMs: 750
  }
});
assert.equal(typeof attempt.correct, 'boolean');
assert.ok(attempt.mastery?.mean >= 0 && attempt.mastery?.mean <= 1);

const dashboard1 = await request('/v1/dashboard', auth);
assert.equal(dashboard1.learner.id, learner.id);
assert.equal(dashboard1.diagnosticAnswered, 1);
assert.ok(dashboard1.readiness);
assert.ok(dashboard1.studyPlan);

const readiness = await request('/v1/readiness', auth);
assert.equal(typeof readiness.scorePercent, 'number');
assert.equal(typeof readiness.coverageConfidence, 'number');

const studyPlan = await request('/v1/study-plan/today', auth);
assert.ok(Array.isArray(studyPlan.activities));

const marker = `staging-e2e-${crypto.randomUUID()}`;
await request(`/v1/learners/${encodeURIComponent(learner.id)}/snapshot`, {
  ...auth,
  method: 'PUT',
  body: { state: { marker, phase: 'persisted-http-e2e' } }
});

const snapshot = await request(`/v1/learners/${encodeURIComponent(learner.id)}/snapshot`, auth);
assert.equal(snapshot.snapshot?.learnerId, learner.id);
assert.equal(snapshot.snapshot?.state?.marker, marker);
assert.equal(snapshot.snapshot?.state?.phase, 'persisted-http-e2e');

const dashboard2 = await request('/v1/dashboard', auth);
assert.equal(dashboard2.diagnosticAnswered, 1);
assert.equal(dashboard2.learner.id, learner.id);
assert.equal(dashboard2.pack.version, learner.pack.version);

console.log(JSON.stringify({
  ok: true,
  baseUrl,
  learnerId: learner.id,
  guestTokenProtected: true,
  packVersion: learner.pack.version,
  diagnosticAnswered: dashboard2.diagnosticAnswered,
  readinessScorePercent: dashboard2.readiness.scorePercent,
  snapshotMarker: marker
}, null, 2));
