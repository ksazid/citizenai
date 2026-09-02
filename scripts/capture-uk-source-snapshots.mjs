import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import crypto from 'node:crypto';
import { UK_RELEASE_CANDIDATE_PACK } from '../src/citizenai/uk-release-candidate.mjs';
import { buildSourceSnapshot, sourceSnapshotCoverage } from '../src/citizenai/uk-source-snapshots.mjs';

const execFileAsync = promisify(execFile);
const OUT_DIR = path.resolve('.artifacts');
const OUT_FILE = path.join(OUT_DIR, 'uk-source-snapshots.json');
const TIMEOUT_MS = 12_000;
const CHROME_TIMEOUT_MS = 35_000;
const MIN_BODY_CHARS = 120;
const HTTP_CONCURRENCY = 8;
const CHROME_CONCURRENCY = 2;
const CHROME_ATTEMPTS = 3;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function assertUsefulBody(body, sourceId) {
  const text = String(body ?? '').trim();
  if (text.length < MIN_BODY_CHARS) throw new Error(`body too small (${text.length})`);
  if (/\b(?:403 forbidden|access denied|request blocked)\b/i.test(text.slice(0, 8000))) throw new Error(`blocked response body for ${sourceId}`);
  return text;
}

async function fetchViaHttp(source) {
  const response = await fetch(source.url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5',
      'accept-language': 'en-GB,en;q=0.9'
    },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { body: assertUsefulBody(await response.text(), source.id), finalUrl: response.url, status: response.status, captureMode: 'http' };
}

async function fetchViaChromeOnce(source, attempt) {
  const profile = path.join(os.tmpdir(), `citizenai-chrome-${crypto.randomUUID()}`);
  try {
    const { stdout } = await execFileAsync('google-chrome', [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
      '--disable-background-networking', '--disable-component-update', '--no-first-run',
      `--user-data-dir=${profile}`, `--virtual-time-budget=${4500 + attempt * 1500}`, '--dump-dom', source.url
    ], { timeout: CHROME_TIMEOUT_MS, maxBuffer: 24 * 1024 * 1024 });
    return { body: assertUsefulBody(stdout, source.id), finalUrl: source.url, status: 200, captureMode: 'headless-chrome' };
  } finally {
    await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

async function fetchViaChrome(source) {
  let lastError;
  for (let attempt = 1; attempt <= CHROME_ATTEMPTS; attempt += 1) {
    try {
      return await fetchViaChromeOnce(source, attempt);
    } catch (error) {
      lastError = error;
      if (attempt < CHROME_ATTEMPTS) await sleep(attempt * 1200);
    }
  }
  throw lastError;
}

await fs.mkdir(OUT_DIR, { recursive: true });
const snapshots = [];
const failures = [];
const protectedQueue = [];
const httpQueue = [...UK_RELEASE_CANDIDATE_PACK.sources];

function addSnapshot(source, fetched) {
  snapshots.push(Object.freeze({
    ...buildSourceSnapshot({ sourceId: source.id, url: source.url, body: fetched.body }),
    finalUrl: fetched.finalUrl,
    httpStatus: fetched.status,
    captureMode: fetched.captureMode,
    sourceType: source.sourceType,
    dynamic: Boolean(source.dynamic)
  }));
  console.log(`SNAPSHOT_OK ${source.id} ${fetched.captureMode}`);
}

async function httpWorker() {
  while (httpQueue.length > 0) {
    const source = httpQueue.shift();
    if (!source) return;
    try {
      addSnapshot(source, await fetchViaHttp(source));
    } catch (error) {
      protectedQueue.push({ source, httpError: error });
    }
  }
}

await Promise.all(Array.from({ length: HTTP_CONCURRENCY }, () => httpWorker()));
console.log(`SNAPSHOT_BROWSER_FALLBACK ${protectedQueue.length}`);

async function chromeWorker() {
  while (protectedQueue.length > 0) {
    const item = protectedQueue.shift();
    if (!item) return;
    const { source, httpError } = item;
    try {
      addSnapshot(source, await fetchViaChrome(source));
    } catch (chromeError) {
      const message = `${source.id} ${source.url}: http=${httpError?.message ?? httpError}; chrome=${chromeError?.message ?? chromeError}`;
      failures.push({ sourceId: source.id, url: source.url, error: message });
      console.error(`SNAPSHOT_FAIL ${source.id}: ${message}`);
    }
  }
}

await Promise.all(Array.from({ length: CHROME_CONCURRENCY }, () => chromeWorker()));
snapshots.sort((a, b) => a.sourceId.localeCompare(b.sourceId));
failures.sort((a, b) => a.sourceId.localeCompare(b.sourceId));

const coverage = sourceSnapshotCoverage({ sources: UK_RELEASE_CANDIDATE_PACK.sources, snapshots });
const artifact = {
  packId: UK_RELEASE_CANDIDATE_PACK.manifest.id,
  exactPackVersion: UK_RELEASE_CANDIDATE_PACK.manifest.version,
  generatedAt: new Date().toISOString(),
  algorithm: 'sha256',
  normalizationVersion: 1,
  sourceOriginPolicy: 'original-authoritative-url-only',
  capturePolicy: `http-${HTTP_CONCURRENCY}-way then chrome-${CHROME_CONCURRENCY}-way with ${CHROME_ATTEMPTS} attempts`,
  coverage,
  failures,
  snapshots
};

await fs.writeFile(OUT_FILE, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(`SNAPSHOT_ARTIFACT ${OUT_FILE}`);
console.log(`SNAPSHOT_COVERAGE ${coverage.snapshotCount}/${coverage.sourceCount}`);
if (failures.length > 0 || !coverage.complete) process.exitCode = 1;
