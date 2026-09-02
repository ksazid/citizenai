import test from 'node:test';
import assert from 'node:assert/strict';
import { diffSourceVersion, impactAnalysis, publishImmutablePack } from '../../src/citizenai/admin-content-ops.mjs';

test('detects source changes', () => {
  const result = diffSourceVersion(
    { contentHash: 'old' },
    { id: 'src-1', contentHash: 'new', retrievedAt: '2026-09-02T00:00:00Z' },
  );
  assert.equal(result.changed, true);
});

test('maps changed facts to affected questions', () => {
  const result = impactAnalysis({
    changedFactIds: ['f1'],
    questions: [{ id: 'q1', factId: 'f1' }, { id: 'q2', factId: 'f2' }],
  });
  assert.deepEqual(result.affectedQuestionIds, ['q1']);
});

test('requires both content and release approval before publishing', () => {
  assert.throws(() => publishImmutablePack({
    pack: { id: 'gb', version: '1.0.0', status: 'review' },
    facts: [],
    questions: [],
    approvals: { content: { by: 'reviewer' } },
    publishedBy: 'publisher',
  }), /content and release approvals required/);
});
