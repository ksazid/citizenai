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

async function jsonRequest(path) {
  const response = await fetch(`${apiUrl}${path}`);
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
let restoredDashboardSeen = false;
let learnerId = null;

page.on('response', async (response) => {
  try {
    const request = response.request();
    if (request.method() === 'POST' && response.url() === `${apiUrl}/v1/learners` && response.ok()) {
      const body = await response.json();
      if (body?.id) learnerIds.push(body.id);
    }
    if (learnerId && request.method() === 'GET' && response.url().startsWith(`${apiUrl}/v1/dashboard?`) && response.url().includes(encodeURIComponent(learnerId)) && response.ok()) {
      restoredDashboardSeen = true;
    }
  } catch {
    // Response may have been consumed or closed. The E2E assertions below remain authoritative.
  }
});

try {
  await page.goto(webUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByText('Get ready to pass', { exact: true }).waitFor({ timeout: 30_000 });

  await waitUntil(() => learnerIds.length >= 1, { timeoutMs: 60_000, message: 'initial mobile learner was not created' });

  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByText('Tell us about your test', { exact: true }).waitFor();

  const learnerCountBeforeReset = learnerIds.length;
  await page.getByRole('button', { name: 'Check my readiness' }).click();
  await page.getByText(/Diagnostic ·/).waitFor({ timeout: 30_000 });

  await waitUntil(() => learnerIds.length > learnerCountBeforeReset, { timeoutMs: 60_000, message: 'diagnostic reset did not create a persisted staging learner' });
  learnerId = learnerIds.at(-1);
  assert.ok(learnerId, 'missing diagnostic learner id');

  let diagnosticCompleted = false;
  for (let answer = 0; answer < 24; answer += 1) {
    const resultTitle = page.getByText(/You’re (Not Ready|Building|Nearly Ready|Pass Ready|Strongly Ready|More evidence needed)/).first();
    if (await resultTitle.isVisible().catch(() => false)) {
      diagnosticCompleted = true;
      break;
    }

    await page.getByRole('button', { name: 'I don’t know' }).click();
    const nextButton = page.getByRole('button', { name: /Next question|Finish readiness check/ });
    await nextButton.click();
    await sleep(180);
  }

  if (!diagnosticCompleted) {
    await page.getByText(/You’re (Not Ready|Building|Nearly Ready|Pass Ready|Strongly Ready|More evidence needed)/).first().waitFor({ timeout: 30_000 });
  }

  await waitUntil(async () => {
    const dashboard = await jsonRequest(`/v1/dashboard?learnerId=${encodeURIComponent(learnerId)}`);
    return dashboard.diagnosticAnswered >= 20;
  }, { timeoutMs: 60_000, intervalMs: 500, message: 'diagnostic attempts did not persist to Supabase' });

  const dashboardAfterDiagnostic = await jsonRequest(`/v1/dashboard?learnerId=${encodeURIComponent(learnerId)}`);
  assert.equal(dashboardAfterDiagnostic.pack.version, '2026.09.02.1');
  assert.ok(dashboardAfterDiagnostic.studyPlan?.activities?.length > 0, 'server did not return a study plan');

  await page.getByRole('button', { name: 'Start my plan' }).click();
  await page.getByText('Today’s plan', { exact: true }).waitFor({ timeout: 15_000 });
  await page.getByText(/Chosen by the study engine/).waitFor();
  await page.getByRole('button', { name: 'Start plan' }).click();

  await waitUntil(async () => {
    const candidates = [
      page.getByText(/Today’s plan · Learn/),
      page.getByText(/Today’s plan · Compare/),
      page.getByText(/Recall ·/),
      page.getByRole('button', { name: 'Check answer' })
    ];
    for (const candidate of candidates) {
      if (await candidate.first().isVisible().catch(() => false)) return true;
    }
    return false;
  }, { timeoutMs: 15_000, message: 'study plan did not open a learning activity' });

  restoredDashboardSeen = false;
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.getByText('Get ready to pass', { exact: true }).waitFor({ timeout: 30_000 });
  await waitUntil(() => restoredDashboardSeen, { timeoutMs: 60_000, message: 'app restart did not restore the same learner from AsyncStorage' });

  await page.getByRole('button', { name: 'I already have an account' }).click();
  await page.getByText('Your readiness', { exact: true }).waitFor({ timeout: 15_000 });
  await page.getByText('Today’s plan', { exact: true }).waitFor();

  const dashboardAfterRestart = await jsonRequest(`/v1/dashboard?learnerId=${encodeURIComponent(learnerId)}`);
  assert.equal(dashboardAfterRestart.diagnosticAnswered, dashboardAfterDiagnostic.diagnosticAnswered, 'diagnostic evidence changed across restart');
  assert.equal(dashboardAfterRestart.pack.version, dashboardAfterDiagnostic.pack.version, 'pack version changed across restart');
  assert.ok(dashboardAfterRestart.studyPlan?.activities?.length > 0, 'study plan disappeared across restart');

  console.log(JSON.stringify({
    ok: true,
    webUrl,
    apiUrl,
    learnerId,
    packVersion: dashboardAfterRestart.pack.version,
    diagnosticAnswered: dashboardAfterRestart.diagnosticAnswered,
    readinessScorePercent: dashboardAfterRestart.readiness.scorePercent,
    studyActivities: dashboardAfterRestart.studyPlan.activities.length,
    restoredSameLearnerAfterReload: true
  }, null, 2));
} finally {
  await browser.close();
}
