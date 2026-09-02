export const REQUIRED_MVP_FLOW = Object.freeze([
  'welcome',
  'test-setup',
  'diagnostic',
  'diagnostic-result',
  'home',
  'learning',
  'mock',
  'pass-ready',
  'exam-outcome',
]);

export function verifyFlowCoverage(screenIds = []) {
  const present = new Set(screenIds);
  const missing = REQUIRED_MVP_FLOW.filter((id) => !present.has(id));
  return { ok: missing.length === 0, missing };
}

export function verifyAccessibilityContract({ minimumTouchTarget = 44, contrastAA = true, dynamicType = true, reducedMotion = true } = {}) {
  const failures = [];
  if (minimumTouchTarget < 44) failures.push('touch targets must be at least 44pt');
  if (!contrastAA) failures.push('AA contrast required');
  if (!dynamicType) failures.push('dynamic type support required');
  if (!reducedMotion) failures.push('reduced motion support required');
  return { ok: failures.length === 0, failures };
}

export function buildProductCertificationEvidence({
  commitSha,
  preflightPassed,
  flowCoverage,
  accessibility,
  knowledgePackVersion,
  uiDnaVersion = 'citizenai-ui-v1',
}) {
  if (!commitSha) throw new Error('exact commit SHA required');
  return Object.freeze({
    product: 'CitizenAI',
    exactCommitSha: commitSha,
    preflightPassed: Boolean(preflightPassed),
    flowCoverage,
    accessibility,
    knowledgePackVersion,
    uiDnaVersion,
    readyForCertification:
      Boolean(preflightPassed) && Boolean(flowCoverage?.ok) && Boolean(accessibility?.ok) && Boolean(knowledgePackVersion),
  });
}
