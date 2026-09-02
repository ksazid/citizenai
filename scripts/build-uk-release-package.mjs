import fs from 'node:fs/promises';
import path from 'node:path';
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST, validateUkActivePack } from '../src/citizenai/uk-active-pack.mjs';
import { UK_RC4_COVERAGE_CERTIFICATION } from '../src/citizenai/uk-rc4-approval.mjs';

const validation = validateUkActivePack();
if (!validation.ok) throw new Error(`UK active pack failed validation: ${validation.errors.join(', ')}`);

const outDir = path.resolve('.artifacts');
const outFile = path.join(outDir, `citizenai-uk-pack-${UK_ACTIVE_PACK_MANIFEST.version}.json`);
await fs.mkdir(outDir, { recursive: true });

const artifact = {
  schemaVersion: 1,
  manifest: UK_ACTIVE_PACK_MANIFEST,
  certification: UK_RC4_COVERAGE_CERTIFICATION,
  counts: validation.counts,
  sources: UK_ACTIVE_PACK.sources,
  evidence: UK_ACTIVE_PACK.evidence,
  concepts: UK_ACTIVE_PACK.concepts,
  facts: UK_ACTIVE_PACK.facts,
  questions: UK_ACTIVE_PACK.questions
};

await fs.writeFile(outFile, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(`UK_RELEASE_PACKAGE ${outFile}`);
console.log(`UK_RELEASE_VERSION ${UK_ACTIVE_PACK_MANIFEST.version}`);
console.log(`UK_RELEASE_DIGEST ${UK_ACTIVE_PACK_MANIFEST.contentDigest}`);
