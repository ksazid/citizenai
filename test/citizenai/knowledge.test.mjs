import test from 'node:test';
import assert from 'node:assert/strict';
import { createCountryPack, createSource, createConcept, createFact, canPublishFact, validateQuestionProvenance } from '../../src/citizenai/knowledge.mjs';

test('UK knowledge pack and approved public source can be created', () => {
  const pack = createCountryPack({ id: 'uk-v1', countryCode: 'GB', version: '1.0.0' });
  assert.equal(pack.status, 'draft');
  const source = createSource({ id: 'src-1', packId: pack.id, url: 'https://www.gov.uk/example', sourceType: 'government', title: 'Official source', retrievedAt: '2026-09-02', contentHash: 'abc' });
  assert.equal(source.sourceType, 'government');
});

test('non-authoritative source types are rejected', () => {
  assert.throws(() => createSource({ id: 'src-1', url: 'https://example.com', sourceType: 'blog', title: 'Blog' }), /government or public authority/);
});

test('fact cannot publish without approved evidence and full confidence', () => {
  const fact = createFact({ id: 'f1', conceptId: 'c1', canonicalValue: 'value', verificationStatus: 'approved', confidence: 0.9, evidenceIds: ['e1'] });
  assert.equal(canPublishFact(fact), false);
});

test('question provenance requires a publishable fact in the same concept', () => {
  const concept = createConcept({ id: 'c1', domainId: 'history', key: 'magna-carta', title: 'Magna Carta', importance: 0.8, baseDifficulty: 0.4 });
  const fact = createFact({ id: 'f1', conceptId: concept.id, canonicalValue: 'Independent grounded fact', verificationStatus: 'approved', confidence: 1, evidenceIds: ['e1'] });
  const facts = new Map([[fact.id, fact]]);
  assert.deepEqual(validateQuestionProvenance({ question: { factId: 'f1', conceptId: 'c1' }, factsById: facts }), { ok: true });
  assert.equal(validateQuestionProvenance({ question: { factId: 'f1', conceptId: 'other' }, factsById: facts }).ok, false);
});
