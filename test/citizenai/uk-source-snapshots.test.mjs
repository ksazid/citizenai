import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSourceBody, hashSourceBody, buildSourceSnapshot, diffSourceSnapshots, sourceSnapshotCoverage } from '../../src/citizenai/uk-source-snapshots.mjs';

test('source body normalization and hashing are deterministic', () => {
  const a = 'Heading\r\n\r\n  Some   verified\ttext.  \r\n';
  const b = 'Heading\n\n Some verified text.\n';
  assert.equal(normalizeSourceBody(a), normalizeSourceBody(b));
  assert.equal(hashSourceBody(a), hashSourceBody(b));
  assert.match(hashSourceBody(a), /^[a-f0-9]{64}$/);
});

test('source snapshot diff detects a substantive body change', () => {
  const previous = buildSourceSnapshot({ sourceId: 'src-1', url: 'https://www.gov.uk/example', body: 'Verified fact A', retrievedAt: '2026-09-01T00:00:00.000Z' });
  const current = buildSourceSnapshot({ sourceId: 'src-1', url: 'https://www.gov.uk/example', body: 'Verified fact B', retrievedAt: '2026-09-02T00:00:00.000Z' });
  const diff = diffSourceSnapshots(previous, current);
  assert.equal(diff.changed, true);
  assert.notEqual(diff.previousHash, diff.currentHash);
});

test('snapshot coverage reports exact missing source ids', () => {
  const sources = [{ id: 'src-1' }, { id: 'src-2' }];
  const snapshots = [buildSourceSnapshot({ sourceId: 'src-1', url: 'https://www.gov.uk/example', body: 'Verified content' })];
  const coverage = sourceSnapshotCoverage({ sources, snapshots });
  assert.equal(coverage.complete, false);
  assert.equal(coverage.sourceCount, 2);
  assert.equal(coverage.snapshotCount, 1);
  assert.deepEqual(coverage.missingSourceIds, ['src-2']);
});
