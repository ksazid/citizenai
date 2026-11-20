import test from 'node:test';
import assert from 'node:assert/strict';
import { UK_ACTIVE_PACK } from '../../src/citizenai/uk-active-pack.mjs';
import { UK_EXPANSION_DRAFT_PACK, validateUkExpansionDraft } from '../../src/citizenai/uk-expansion-draft.mjs';

test('300 new draft questions have provenance, distinct options and five-topic coverage', () => {
  const validation = validateUkExpansionDraft();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.counts.questions, 300);
  assert.equal(validation.counts.topics, 5);
  assert.ok(validation.counts.sourceLinks >= 15);
});

test('newly authored content does not enter certified active runtime without approval', () => {
  assert.equal(UK_ACTIVE_PACK.questions.length, 204);
  assert.equal(UK_ACTIVE_PACK.manifest.version, '2026.09.02.1');
  assert.equal(UK_EXPANSION_DRAFT_PACK.manifest.status, 'draft');
  assert.equal(UK_EXPANSION_DRAFT_PACK.manifest.coverage.activationAllowed, false);
  assert.equal(UK_EXPANSION_DRAFT_PACK.manifest.coverage.humanReviewed, false);
  assert.ok(UK_EXPANSION_DRAFT_PACK.facts.every(f => f.verificationStatus === 'pending'));
});
