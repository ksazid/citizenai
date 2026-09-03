import assert from 'node:assert/strict';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const webUrl = String(process.env.CITIZENAI_MOBILE_WEB_URL ?? 'http://127.0.0.1:4173').replace(/\/$/, '');
const apiUrl = String(process.env.CITIZENAI_STAGING_API_URL ?? 'https://citizenai-api-staging.onrender.com').replace(/\/$/, '');
const chromePath = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
const frameDir = process.env.CITIZENAI_VIDEO_FRAME_DIR ?? '.artifacts/demo-video/frames';
const frameIntervalMs = Number(process.env.CITIZENAI_VIDEO_FRAME_INTERVAL_MS ?? 125);

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

await rm(frameDir, { recursive: true, force: true });
await mkdir(frameDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
});

const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 1
});
const page = await context.newPage();
const learnerIds = [];
let learnerId = null;
let recording = true;
let frame = 0;

page.on('response', async (response) => {
  try {
    const request = response.request();
    if (request.method() === 'POST' && response.url() === `${apiUrl}/v1/learners` && response.ok()) {
      const body = await response.json();
      if (body?.id) learnerIds.push(body.id);
    }
  } catch {
    // Best-effort instrumentation only.
  }
});

page.on('pageerror', (error) => console.error(`[browser:pageerror] ${error.stack ?? error.message}`));

const bodyText = () => page.locator('body').innerText().catch(() => '');
const bodyIncludes = async (text) => (await bodyText()).includes(text);
const bodyMatches = async (pattern) => pattern.test(await bodyText());

const captureLoop = (async () => {
  while (recording) {
    try {
      frame += 1;
      const filename = `frame-${String(frame).padStart(6, '0')}.jpg`;
      await page.screenshot({
        path: path.join(frameDir, filename),
        type: 'jpeg',
        quality: 82,
        fullPage: false
      });
    } catch (error) {
      if (recording) console.error(`[video:capture] ${error.message}`);
    }
    await sleep(frameIntervalMs);
  }
})();

async function hold(ms) {
  await sleep(ms);
}

try {
  await page.goto(webUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitUntil(() => bodyIncludes('Get ready to pass'), { timeoutMs: 30_000, message: 'Welcome screen did not render' });
  await waitUntil(() => learnerIds.length >= 1, { timeoutMs: 60_000, message: 'initial learner was not created' });
  await hold(2800);

  await page.getByRole('button', { name: 'Get started' }).click();
  await waitUntil(() => bodyIncludes('Tell us about your test'), { timeoutMs: 15_000, message: 'test setup did not render' });
  await hold(2400);

  const learnerCountBeforeReset = learnerIds.length;
  await page.getByRole('button', { name: 'Check my readiness' }).click();
  await waitUntil(() => bodyIncludes('Diagnostic ·'), { timeoutMs: 30_000, message: 'diagnostic did not render' });
  await waitUntil(() => learnerIds.length > learnerCountBeforeReset, { timeoutMs: 60_000, message: 'diagnostic learner was not created' });
  learnerId = learnerIds.at(-1);
  await hold(1800);

  const resultPattern = /You’re (Not Ready|Building|Nearly Ready|Pass Ready|Strongly Ready|More evidence needed)/;
  for (let answer = 0; answer < 24; answer += 1) {
    if (await bodyMatches(resultPattern)) break;
    await page.getByRole('button', { name: 'I don’t know' }).click();
    await hold(answer < 2 ? 700 : 90);
    await page.getByRole('button', { name: /Next question|Finish readiness check/ }).click();
    await hold(answer < 2 ? 650 : 100);
  }

  await waitUntil(() => bodyMatches(resultPattern), { timeoutMs: 30_000, message: 'diagnostic result did not render' });
  await hold(3200);

  const dashboard = await jsonRequest(`/v1/dashboard?learnerId=${encodeURIComponent(learnerId)}`);
  assert.equal(dashboard.pack.version, '2026.09.02.1');
  assert.ok(dashboard.studyPlan?.activities?.length > 0, 'server did not return a study plan');

  await page.getByRole('button', { name: 'Start my plan' }).click();
  await waitUntil(() => bodyIncludes('Today’s plan'), { timeoutMs: 15_000, message: 'Today plan did not render' });
  await hold(2800);

  await page.getByRole('button', { name: 'Start plan' }).click();
  await waitUntil(async () => {
    const text = await bodyText();
    return text.includes('Today’s plan · Learn') || text.includes('Today’s plan · Compare') || text.includes('Recall ·') || text.includes('Check answer');
  }, { timeoutMs: 15_000, message: 'learning activity did not render' });
  await hold(3200);

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
  await waitUntil(() => bodyIncludes('Get ready to pass'), { timeoutMs: 30_000, message: 'Welcome screen did not render after reload' });
  await hold(1200);

  await page.getByRole('button', { name: 'I already have an account' }).click();
  await waitUntil(() => bodyIncludes('Your readiness'), { timeoutMs: 15_000, message: 'Home readiness did not render' });
  await hold(3500);

  console.log(JSON.stringify({
    ok: true,
    learnerId,
    packVersion: dashboard.pack.version,
    frames: frame
  }, null, 2));
} finally {
  recording = false;
  await captureLoop;
  await browser.close();
}
