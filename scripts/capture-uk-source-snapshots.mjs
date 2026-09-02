import fs from 'node:fs/promises';
import path from 'node:path';
import { UK_RELEASE_CANDIDATE_PACK } from '../src/citizenai/uk-release-candidate.mjs';
import { buildSourceSnapshot, sourceSnapshotCoverage } from '../src/citizenai/uk-source-snapshots.mjs';

const OUT_DIR = path.resolve('.artifacts');
const OUT_FILE = path.join(OUT_DIR, 'uk-source-snapshots.json');
const TIMEOUT_MS = 25_000;
const MIN_BODY_CHARS = 120;

async function fetchText(source) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(source.url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'CitizenAI-SourceVerifier/1.0 (+https://github.com/ksazid/citizenai)',
          'accept': 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5'
        },
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      if (body.trim().length < MIN_BODY_CHARS) throw new Error(`body too small (${body.trim().length})`);
      return { body, finalUrl: response.url, status: response.status };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`${source.id} ${source.url}: ${lastError?.message ?? lastError}`);
}

await fs.mkdir(OUT_DIR, { recursive: true });
const snapshots = [];
const failures = [];

for (const source of UK_RELEASE_CANDIDATE_PACK.sources) {
  try {
    const fetched = await fetchText(source);
    snapshots.push(Object.freeze({
      ...buildSourceSnapshot({ sourceId: source.id, url: source.url, body: fetched.body }),
      finalUrl: fetched.finalUrl,
      httpStatus: fetched.status,
      sourceType: source.sourceType,
      dynamic: Boolean(source.dynamic)
    }));
    console.log(`SNAPSHOT_OK ${source.id}`);
  } catch (error) {
    failures.push({ sourceId: source.id, url: source.url, error: String(error?.message ?? error) });
    console.error(`SNAPSHOT_FAIL ${source.id}: ${error?.message ?? error}`);
  }
}

const coverage = sourceSnapshotCoverage({ sources: UK_RELEASE_CANDIDATE_PACK.sources, snapshots });
const artifact = {
  packId: UK_RELEASE_CANDIDATE_PACK.manifest.id,
  exactPackVersion: UK_RELEASE_CANDIDATE_PACK.manifest.version,
  generatedAt: new Date().toISOString(),
  algorithm: 'sha256',
  normalizationVersion: 1,
  coverage,
  failures,
  snapshots
};

await fs.writeFile(OUT_FILE, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(`SNAPSHOT_ARTIFACT ${OUT_FILE}`);
console.log(`SNAPSHOT_COVERAGE ${coverage.snapshotCount}/${coverage.sourceCount}`);

if (failures.length > 0 || !coverage.complete) {
  process.exitCode = 1;
}
