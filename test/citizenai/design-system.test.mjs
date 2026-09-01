import test from 'node:test';
import assert from 'node:assert/strict';
import { citizenAiTokens, citizenAiUiPrinciples } from '../../src/citizenai/design-system.mjs';

test('design system exposes the approved premium light palette', () => {
  assert.equal(citizenAiTokens.color.canvas, '#F7FAFC');
  assert.equal(citizenAiTokens.color.surface, '#FFFFFF');
  assert.equal(citizenAiTokens.color.primary, '#2563EB');
  assert.equal(citizenAiTokens.color.accent, '#0F9F9A');
});

test('design principles protect the approved UI DNA', () => {
  assert.ok(citizenAiUiPrinciples.some((rule) => rule.includes('Readiness')));
  assert.ok(citizenAiUiPrinciples.some((rule) => rule.includes('childish gamification')));
  assert.ok(citizenAiUiPrinciples.some((rule) => rule.includes('One dominant action')));
});
