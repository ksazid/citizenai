import test from 'node:test';
import assert from 'node:assert/strict';
import { citizenAiConfig } from '../../src/citizenai/config.mjs';

test('CitizenAI UK exam contract is frozen', () => {
  assert.equal(citizenAiConfig.product, 'CitizenAI');
  assert.equal(citizenAiConfig.market, 'GB');
  assert.equal(citizenAiConfig.exam.questionCount, 24);
  assert.equal(citizenAiConfig.exam.durationMinutes, 45);
  assert.equal(citizenAiConfig.exam.passMark, 0.75);
});

test('PES-v2 remains conservative by default', () => {
  assert.equal(citizenAiConfig.governance.pesMode, 'lite-single-worker');
  assert.equal(citizenAiConfig.governance.multiAgentEnabled, false);
  assert.equal(citizenAiConfig.governance.humanContentApprovalRequired, true);
  assert.equal(citizenAiConfig.governance.humanReleaseApprovalRequired, true);
});
