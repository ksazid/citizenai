import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const webUrl = String(process.env.CITIZENAI_MOBILE_WEB_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const apiUrl = String(process.env.CITIZENAI_STAGING_API_URL ?? 'https://citizenai-api-staging.onrender.com').replace(/\/$/, '');
const chromePath = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function waitUntil(predicate, { timeoutMs = 60_000, intervalMs = 250, message = 'condition timed out' } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return;
    await sleep(intervalMs);
  }
  throw new Error(message);
}

async function jsonRequest(path, { learnerId = null, accessToken = null } = {}) {
  const headers = {};
  if (learnerId) headers['x-citizenai-learner-id'] = learnerId;
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${apiUrl}${path}`, { headers: Object.keys(headers).length ? headers : undefined });
  assert.equal(response.ok, true, `${path} returned ${response.status}`);
  return response.json();
}

async function warmStaging() {
  await waitUntil(async () => {
    try {
      const health = await jsonRequest('/healthz');
      return health.ok === true;
    } catch {
      return false;
    }
  }, { timeoutMs: 90_000, intervalMs: 2_000, message: 'staging API did not become healthy' });
}

await warmStaging();

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
const page = await context.newPage();
const learnerIds = [];
const learnerTokens = new Map();
let restoredDashboardSeen = false;
let learnerId = null;

page.on('console', message => console.log(`[browser:${message.type()}] ${message.text()}`));
page.on('pageerror', error => console.error(`[browser:pageerror] ${error.stack ?? error.message}`));

page.on('response', async (response) => {
  try {
    const request = response.request();
    if (request.method() === 'POST' && response.url() === `${apiUrl}/v1/learners` && response.ok()) {
      const body = await response.json();
      if (body?.id) learnerIds.push(body.id);
      if (body?.id && body?.accessToken) learnerTokens.set(body.id, body.accessToken);
    }
    if (learnerId && request.method() === 'GET' && response.url().startsWith(`${apiUrl}/v1/dashboard`) && response.ok()) {
      const headers = request.headers();
      const learnerFromHeader = headers['x-citizenai-learner-id'];
      const learnerFromQuery = response.url().includes(encodeURIComponent(learnerId));
      if (learnerFromHeader === learnerId || learnerFromQuery) restoredDashboardSeen = true;
    }
  } catch {
    // Response may have been consumed or closed. The E2E assertions below remain authoritative.
  }
});

const authFor = (id) => ({ learnerId: id, accessToken: learnerTokens.get(id) ?? null });
const bodyText = () => page.locator('body').innerText().catch(() => '');
const bodyIncludes = async (text) => (await bodyText()).includes(text);
const bodyMatches = async (pattern) => pattern.test(await bodyText());

try {
  await page.goto(webUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitUntil(() => bodyIncludes('Get ready to pass'), { timeoutMs: 30_000, message: 'Welcome screen did not render' });

  await waitUntil(() => learnerIds.length >= 1, { timeoutMs: 60_000, message: 'initial mobile learner was not created' });

  await page.getByRole('button', { name: 'Get started' }).click();
  await waitUntil(() => bodyIncludes('Tell us about your test'), { timeoutMs: 15_000, message: 'test setup screen did not render' });

  const learnerCountBeforeReset = learnerIds.length;
  await page.getByRole('button', { name: 'Check my readiness' }).click();
  await waitUntil(() => bodyIncludes('Diagnostic ·'), { timeoutMs: 30_000, message: 'diagnostic screen did not render' });

  await waitUntil(() => learnerIds.length > learnerCountBeforeReset, { timeoutMs: 60_000, message: 'diagnostic reset did not create a persisted staging learner' });
  learnerId = learnerIds.at(-1);
  assert.ok(learnerId, 'missing diagnostic learner id');

  const resultPattern = /You’re (Not Ready|Building|Nearly Ready|Pass Ready|Strongly Ready|More evidence needed)/;
  let diagnosticCompleted = false;
  for (let answer = 0; answer < 24; answer += 1) {
    if (await bodyMatches(resultPattern)) {
      diagnosticCompleted = true;
      break;
    }

    await page.getByRole('button', { name: 'I don’t know' }).click();
    const nextButton = page.getByRole('button', { name: /Next question|Finish readiness check/ });
    await nextButton.click();
    await sleep(180);
  }

  if (!diagnosticCompleted) {
    await waitUntil(() => bodyMatches(resultPattern), { timeoutMs: 30_000, message: 'diagnostic result did not render after 24 answers' });
  }

  await waitUntil(async () => {
    const dashboard = await jsonRequest('/v1/dashboard', authFor(learnerId));
    return dashboard.diagnosticAnswered >= 20;
  }, { timeoutMs: 60_000, intervalMs: 500, message: 'diagnostic attempts did not persist to Supabase' });

  const dashboardAfterDiagnostic = await jsonRequest('/v1/dashboard', authFor(learnerId));
  assert.equal(dashboardAfterDiagnostic.pack.version, '2026.09.02.1');
  assert.ok(dashboardAfterDiagnostic.studyPlan?.activities?.length > 0, 'server did not return a study plan');

  await page.getByRole('button', { name: 'Start my plan' }).click();
  await waitUntil(() => bodyIncludes('Today’s plan'), { timeoutMs: 15_000, message: 'Today plan screen did not render' });
  await waitUntil(() => bodyIncludes('Chosen by the study engine'), { timeoutMs: 15_000, message: 'server-backed study plan copy missing' });
  await page.getByRole('button', { name: 'Start plan' }).click();

  await waitUntil(async () => {
    const text = await bodyText();
    return text.includes('Today’s plan · Learn') || text.includes('Today’s plan · Compare') || text.includes('Recall ·') || text.includes('Check answer');
  }, { timeoutMs: 15_000, message: 'study plan did not open a learning activity' });

  restoredDashboardSeen = false;
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitUntil(() => bodyIncludes('Get ready to pass'), { timeoutMs: 30_000, message: 'Welcome screen did not render after restart' });
  await waitUntil(() => restoredDashboardSeen, { timeoutMs: 60_000, message: 'app restart did not restore the same learner from AsyncStorage' });

  await page.getByRole('button', { name: 'I already have an account' }).click();
  await waitUntil(() => bodyIncludes('Your readiness'), { timeoutMs: 15_000, message: 'Home readiness did not render after restart' });
  await waitUntil(() => bodyIncludes('Today’s plan'), { timeoutMs: 15_000, message: 'Home study plan did not render after restart' });

  const dashboardAfterRestart = await jsonRequest('/v1/dashboard', authFor(learnerId));
  assert.equal(dashboardAfterRestart.diagnosticAnswered, dashboardAfterDiagnostic.diagnosticAnswered, 'diagnostic evidence changed across restart');
  assert.equal(dashboardAfterRestart.pack.version, dashboardAfterDiagnostic.pack.version, 'pack version changed across restart');
  assert.ok(dashboardAfterRestart.studyPlan?.activities?.length > 0, 'study plan disappeared across restart');

  console.log(JSON.stringify({
    ok: true,
    webUrl,
    apiUrl,
    learnerId,
    guestTokenObserved: learnerTokens.has(learnerId),
    packVersion: dashboardAfterRestart.pack.version,
    diagnosticAnswered: dashboardAfterRestart.diagnosticAnswered,
    readinessScorePercent: dashboardAfterRestart.readiness.scorePercent,
    studyActivities: dashboardAfterRestart.studyPlan.activities.length,
    restoredSameLearnerAfterReload: true
  }, null, 2));
} catch (error) {
  console.error('[mobile-staging-e2e] body text:', await bodyText());
  throw error;
} finally {
  await browser.close();
}
