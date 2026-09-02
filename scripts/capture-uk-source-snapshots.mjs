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
const CHROME_TIMEOUT_MS = 25_000;
const MIN_BODY_CHARS = 120;
const CONCURRENCY = 6;

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

async function fetchViaChrome(source) {
  const profile = path.join(os.tmpdir(), `citizenai-chrome-${crypto.randomUUID()}`);
  try {
    const { stdout } = await execFileAsync('google-chrome', [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
      `--user-data-dir=${profile}`, '--virtual-time-budget=3500', '--dump-dom', source.url
    ], { timeout: CHROME_TIMEOUT_MS, maxBuffer: 24 * 1024 * 1024 });
    return { body: assertUsefulBody(stdout, source.id), finalUrl: source.url, status: 200, captureMode: 'headless-chrome' };
  } finally {
    await fs.rm(profile, { recursive: true, force: true }).catch(() => {});
  }
}

async function fetchText(source) {
  let httpError;
  try {
    return await fetchViaHttp(source);
  } catch (error) {
    httpError = error;
  }
  try {
    return await fetchViaChrome(source);
  } catch (chromeError) {
    throw new Error(`${source.id} ${source.url}: http=${httpError?.message ?? httpError}; chrome=${chromeError?.message ?? chromeError}`);
  }
}

await fs.mkdir(OUT_DIR, { recursive: true });
const snapshots = [];
const failures = [];
const queue = [...UK_RELEASE_CANDIDATE_PACK.sources];

async function worker() {
  while (queue.length > 0) {
    const source = queue.shift();
    if (!source) return;
    try {
      const fetched = await fetchText(source);
      snapshots.push(Object.freeze({
        ...buildSourceSnapshot({ sourceId: source.id, url: source.url, body: fetched.body }),
        finalUrl: fetched.finalUrl,
        httpStatus: fetched.status,
        captureMode: fetched.captureMode,
        sourceType: source.sourceType,
        dynamic: Boolean(source.dynamic)
      }));
      console.log(`SNAPSHOT_OK ${source.id} ${fetched.captureMode}`);
    } catch (error) {
      failures.push({ sourceId: source.id, url: source.url, error: String(error?.message ?? error) });
      console.error(`SNAPSHOT_FAIL ${source.id}: ${error?.message ?? error}`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
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
  coverage,
  failures,
  snapshots
};

await fs.writeFile(OUT_FILE, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(`SNAPSHOT_ARTIFACT ${OUT_FILE}`);
console.log(`SNAPSHOT_COVERAGE ${coverage.snapshotCount}/${coverage.sourceCount}`);
if (failures.length > 0 || !coverage.complete) process.exitCode = 1;
