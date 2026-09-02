import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_PACK_MANIFEST, UK_PACK_V1 } from '../../src/citizenai/uk-knowledge-pack-v1.mjs';
import { sourceChangeImpact, ukPackReleaseGate } from '../../src/citizenai/uk-pack-ops.mjs';

test('source changes resolve through evidence to affected facts and questions', () => {
  const changedSource = UK_PACK_V1.sources.find((source) => source.id === 'src-parliament-magna');
  const currentSources = UK_PACK_V1.sources.map((source) => source.id === changedSource.id ? { ...source, contentHash: `changed-${source.contentHash}` } : source);
  const impact = sourceChangeImpact({
    previousSources: UK_PACK_V1.sources,
    currentSources,
    facts: UK_PACK_V1.facts,
    evidence: UK_PACK_V1.evidence,
    questions: UK_PACK_V1.questions
  });
  assert.deepEqual(impact.changedSourceIds, ['src-parliament-magna']);
  assert.ok(impact.changedFactIds.includes('fact-magna-carta'));
  assert.ok(impact.changedFactIds.includes('fact-rule-of-law'));
  assert.ok(impact.affectedQuestionIds.some((id) => id.startsWith('magna-carta-')));
  assert.ok(impact.affectedQuestionIds.some((id) => id.startsWith('rule-of-law-')));
});

test('foundation pack cannot be activated before exact-version coverage certification', () => {
  const gate = ukPackReleaseGate({
    manifest: UK_PACK_MANIFEST,
    coverageCertification: { approved: true, reviewerId: 'reviewer', exactPackVersion: UK_PACK_MANIFEST.version }
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.reasons.includes('exam_coverage_not_complete'));
  assert.ok(gate.reasons.includes('activation_not_allowed'));
});
