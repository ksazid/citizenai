import test from 'node:test';
import assert from 'node:assert/strict';
import { createMasteryState, evidenceWeight, updateMastery, masteryMean, masteryConfidence, retentionAt, effectiveMastery, classifyMasteryState } from '../../src/citizenai/mastery.mjs';

test('unseen delayed recall has stronger evidence than repeated wording', () => {
  const strong = evidenceWeight({ difficulty: 0.8, isUnseenVariant: true, delayedRecall: true, repeatedVariantCount: 0 });
  const repeated = evidenceWeight({ difficulty: 0.8, isUnseenVariant: false, delayedRecall: false, repeatedVariantCount: 4 });
  assert.ok(strong > repeated * 2);
});

test('correct evidence increases Bayesian mastery', () => {
  const initial = createMasteryState({ conceptId: 'c1' });
  const next = updateMastery(initial, { correct: true, difficulty: 0.7, variantId: 'v1', at: '2026-09-01T10:00:00Z' });
  assert.ok(masteryMean(next) > masteryMean(initial));
  assert.equal(next.exposureCount, 1);
});

test('confidence requires evidence volume and variant diversity', () => {
  let state = createMasteryState({ conceptId: 'c1' });
  for (let i = 0; i < 4; i += 1) {
    state = updateMastery(state, { correct: true, variantId: `v${i}`, at: `2026-09-0${i + 1}T10:00:00Z`, delayedRecall: i > 0 });
  }
  assert.ok(masteryConfidence(state) > 0.5);
});

test('retention decays and effective mastery is conservative', () => {
  let state = createMasteryState({ conceptId: 'c1', stabilityDays: 7 });
  for (let i = 0; i < 5; i += 1) state = updateMastery(state, { correct: true, variantId: `v${i}`, at: '2026-09-01T00:00:00Z' });
  const retention = retentionAt(state, '2026-09-15T00:00:00Z');
  assert.ok(retention < 0.5);
  assert.ok(effectiveMastery(state, '2026-09-15T00:00:00Z') < masteryMean(state));
  assert.equal(classifyMasteryState(state, '2026-09-15T00:00:00Z'), 'LOW_RETENTION');
});
