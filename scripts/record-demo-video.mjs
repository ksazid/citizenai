import assert from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const webUrl = String(process.env.CITIZENAI_MOBILE_WEB_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const apiUrl = String(process.env.CITIZENAI_STAGING_API_URL ?? 'https://citizenai-api-staging.onrender.com').replace(/\/$/, '');
const chromePath = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const artifactDir = '.artifacts/demo-video';
const shotDir = path.join(artifactDir, 'shots');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(predicate, { timeoutMs = 60_000, intervalMs = 250, message = 'condition timed out' } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await predicate()) return;
    await sleep(intervalMs);
  }
  throw new Error(message);
}

async function jsonRequest(pathname) {
  const response = await fetch(`${apiUrl}${pathname}`);
  assert.equal(response.ok, true, `${pathname} returned ${response.status}`);
  return response.json();
}

await waitUntil(async () => {
  try {
    const health = await jsonRequest('/healthz');
    return health.ok === true;
  } catch {
    return false;
  }
}, { timeoutMs: 90_000, intervalMs: 2_000, message: 'staging API did not become healthy' });

await rm(artifactDir, { recursive: true, force: true });
await mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});
const context = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const learnerIds = [];
const shots = [];
let learnerId = null;

page.on('response', async (response) => {
  try {
    const request = response.request();
    if (request.method() === 'POST' && response.url() === `${apiUrl}/v1/learners` && response.ok()) {
      const body = await response.json();
      if (body?.id) learnerIds.push(body.id);
    }
  } catch {}
});

page.on('pageerror', (error) => console.error(`[browser:pageerror] ${error.stack ?? error.message}`));

const bodyText = () => page.locator('body').innerText().catch(() => '');
const bodyIncludes = async (text) => (await bodyText()).includes(text);
const bodyMatches = async (pattern) => pattern.test(await bodyText());

async function capture(name, durationSeconds) {
  const filename = `${String(shots.length + 1).padStart(2, '0')}-${name}.jpg`;
  const filePath = path.join(shotDir, filename);
  await page.screenshot({ path: filePath, type: 'jpeg', quality: 88, fullPage: false });
  shots.push({ filePath, durationSeconds });
}

try {
  await page.goto(webUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitUntil(() => bodyIncludes('Get ready to pass'), { timeoutMs: 30_000, message: 'Welcome screen did not render' });
  await waitUntil(() => learnerIds.length >= 1, { timeoutMs: 60_000, message: 'initial learner was not created' });
  await capture('welcome', 3.2);

  await page.getByRole('button', { name: 'Get started' }).click();
  await waitUntil(() => bodyIncludes('Tell us about your test'), { timeoutMs: 15_000, message: 'test setup did not render' });
  await capture('test-setup', 2.8);

  const learnerCountBeforeReset = learnerIds.length;
  await page.getByRole('button', { name: 'Check my readiness' }).click();
  await waitUntil(() => bodyIncludes('Diagnostic ·'), { timeoutMs: 30_000, message: 'diagnostic did not render' });
  await waitUntil(() => learnerIds.length > learnerCountBeforeReset, { timeoutMs: 60_000, message: 'diagnostic learner was not created' });
  learnerId = learnerIds.at(-1);
  await capture('diagnostic', 3.0);

  await page.getByRole('button', { name: 'I don’t know' }).click();
  await sleep(350);
  await capture('diagnostic-response', 2.4);
  await page.getByRole('button', { name: /Next question|Finish readiness check/ }).click();

  const resultPattern = /You’re (Not Ready|Building|Nearly Ready|Pass Ready|Strongly Ready|More evidence needed)/;
  for (let answer = 1; answer < 24; answer += 1) {
    if (await bodyMatches(resultPattern)) break;
    await page.getByRole('button', { name: 'I don’t know' }).click();
    await page.getByRole('button', { name: /Next question|Finish readiness check/ }).click();
    await sleep(90);
  }

  await waitUntil(() => bodyMatches(resultPattern), { timeoutMs: 30_000, message: 'diagnostic result did not render' });
  await capture('readiness-result', 3.4);

  const dashboard = await jsonRequest(`/v1/dashboard?learnerId=${encodeURIComponent(learnerId)}`);
  assert.equal(dashboard.pack.version, '2026.09.02.1');
  assert.ok(dashboard.studyPlan?.activities?.length > 0, 'server did not return a study plan');

  await page.getByRole('button', { name: 'Start my plan' }).click();
  await waitUntil(() => bodyIncludes('Today’s plan'), { timeoutMs: 15_000, message: 'Today plan did not render' });
  await capture('todays-plan', 3.2);

  await page.getByRole('button', { name: 'Start plan' }).click();
  await waitUntil(async () => {
    const text = await bodyText();
    return text.includes('Today’s plan · Learn') || text.includes('Today’s plan · Compare') || text.includes('Recall ·') || text.includes('Check answer');
  }, { timeoutMs: 15_000, message: 'learning activity did not render' });
  await capture('learning-activity', 3.6);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitUntil(() => bodyIncludes('Get ready to pass'), { timeoutMs: 30_000, message: 'Welcome screen did not render after reload' });
  await page.getByRole('button', { name: 'I already have an account' }).click();
  await waitUntil(() => bodyIncludes('Your readiness'), { timeoutMs: 15_000, message: 'Home readiness did not render' });
  await capture('restored-home', 3.8);

  await writeFile(path.join(artifactDir, 'timeline.json'), JSON.stringify({ fps: 8, shots }, null, 2));
  console.log(JSON.stringify({ ok: true, learnerId, packVersion: dashboard.pack.version, shots: shots.length }, null, 2));
} finally {
  await browser.close();
}
