import crypto from 'node:crypto';

export function normalizeSourceBody(input = '') {
  return String(input)
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function hashSourceBody(input = '') {
  return crypto.createHash('sha256').update(normalizeSourceBody(input), 'utf8').digest('hex');
}

export function buildSourceSnapshot({ sourceId, url, body, retrievedAt = new Date().toISOString() }) {
  if (!sourceId || !url) throw new Error('source snapshot identity required');
  const normalized = normalizeSourceBody(body);
  if (!normalized) throw new Error('source snapshot body required');
  return Object.freeze({
    sourceId,
    url,
    retrievedAt,
    bodyHash: hashSourceBody(normalized),
    normalizedCharCount: normalized.length,
    normalizationVersion: 1
  });
}

export function diffSourceSnapshots(previous, current) {
  if (!previous || !current || previous.sourceId !== current.sourceId) throw new Error('matching source snapshots required');
  return Object.freeze({
    sourceId: current.sourceId,
    changed: previous.bodyHash !== current.bodyHash,
    previousHash: previous.bodyHash,
    currentHash: current.bodyHash,
    previousRetrievedAt: previous.retrievedAt,
    currentRetrievedAt: current.retrievedAt
  });
}

export function sourceSnapshotCoverage({ sources = [], snapshots = [] }) {
  const snapshotBySource = new Map(snapshots.map((snapshot) => [snapshot.sourceId, snapshot]));
  const missingSourceIds = sources.filter((source) => !snapshotBySource.has(source.id)).map((source) => source.id);
  return Object.freeze({
    sourceCount: sources.length,
    snapshotCount: sources.length - missingSourceIds.length,
    missingSourceIds: Object.freeze(missingSourceIds),
    complete: missingSourceIds.length === 0
  });
}
