import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_MVP_FLOW, verifyFlowCoverage, verifyAccessibilityContract, buildProductCertificationEvidence } from '../../src/citizenai/e2e-contract.mjs';

test('requires all frozen MVP flow checkpoints', () => {
  assert.equal(verifyFlowCoverage(REQUIRED_MVP_FLOW).ok, true);
  const incomplete = verifyFlowCoverage(REQUIRED_MVP_FLOW.filter((id) => id !== 'mock'));
  assert.equal(incomplete.ok, false);
  assert.deepEqual(incomplete.missing, ['mock']);
});

test('enforces accessibility baseline', () => {
  assert.equal(verifyAccessibilityContract().ok, true);
  assert.equal(verifyAccessibilityContract({ minimumTouchTarget: 40 }).ok, false);
});

test('binds certification evidence to an exact SHA', () => {
  const evidence = buildProductCertificationEvidence({
    commitSha: 'abc123',
    preflightPassed: true,
    flowCoverage: { ok: true, missing: [] },
    accessibility: { ok: true, failures: [] },
    knowledgePackVersion: 'GB-1.0.0',
  });
  assert.equal(evidence.exactCommitSha, 'abc123');
  assert.equal(evidence.readyForCertification, true);
});
