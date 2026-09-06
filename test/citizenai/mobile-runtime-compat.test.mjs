import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

async function sourceFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(full));
    else if (/\.(?:ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test('mobile source avoids unsupported ES2023 copy-on-write array helpers', async () => {
  const root = path.resolve('apps/mobile/src');
  const files = await sourceFiles(root);
  const unsupported = /\.(?:toSorted|toReversed|toSpliced)\s*\(/;

  for (const file of files) {
    const source = await fs.readFile(file, 'utf8');
    assert.doesNotMatch(source, unsupported, `${path.relative(process.cwd(), file)} uses an array helper not guaranteed by the native JS runtime`);
  }
});
