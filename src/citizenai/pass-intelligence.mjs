const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const READINESS = Object.freeze({
  NOT_READY: 'not_ready',
  BUILDING: 'building',
  NEARLY_READY: 'nearly_ready',
  PASS_READY: 'pass_ready',
  STRONGLY_READY: 'strongly_ready',
  MORE_EVIDENCE: 'more_evidence'
});

export function coverageConfidence({ domains = [], importantConcepts = [], mocks = 0, variantDiversity = 0 }) {
  const domainCoverage = domains.length ? domains.filter((d) => d.tested).length / domains.length : 0;
  const importantCoverage = importantConcepts.length
    ? importantConcepts.filter((c) => c.tested).length / importantConcepts.length
    : 0;
  const mockFactor = clamp(mocks / 2);
  return clamp(0.3 * domainCoverage + 0.4 * importantCoverage + 0.2 * clamp(variantDiversity) + 0.1 * mockFactor);
}

export function readinessStatus(score, confidence) {
  if (confidence < 0.75) return READINESS.MORE_EVIDENCE;
  if (score < 0.60) return READINESS.NOT_READY;
  if (score < 0.75) return READINESS.BUILDING;
  if (score < 0.85) return READINESS.NEARLY_READY;
  if (score < 0.95) return READINESS.PASS_READY;
  return READINESS.STRONGLY_READY;
}

function pseudoRandom(seed) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

export function simulatePassReadiness({ concepts, iterations = 5000, questionsPerExam = 24, passMark = 0.75, seed = 42 }) {
  if (!Array.isArray(concepts) || concepts.length === 0) throw new Error('concepts are required');
  const weighted = concepts.map((c) => ({
    ...c,
    effectiveMastery: clamp(c.effectiveMastery ?? c.mastery ?? 0),
    importance: Math.max(0.01, c.importance ?? 0.5)
  }));
  const totalWeight = weighted.reduce((sum, c) => sum + c.importance, 0);
  const rand = pseudoRandom(seed);
  let passes = 0;
  const required = Math.ceil(questionsPerExam * passMark);

  for (let i = 0; i < iterations; i += 1) {
    let correct = 0;
    for (let q = 0; q < questionsPerExam; q += 1) {
      let r = rand() * totalWeight;
      let chosen = weighted[weighted.length - 1];
      for (const c of weighted) {
        r -= c.importance;
        if (r <= 0) { chosen = c; break; }
      }
      if (rand() <= chosen.effectiveMastery) correct += 1;
    }
    if (correct >= required) passes += 1;
  }

  return {
    probability: passes / iterations,
    iterations,
    questionsPerExam,
    passMark,
    requiredCorrect: required
  };
}

export function buildReadiness({ concepts, coverage }) {
  const simulation = simulatePassReadiness({ concepts });
  const confidence = coverageConfidence(coverage);
  return {
    score: simulation.probability,
    confidence,
    status: readinessStatus(simulation.probability, confidence),
    simulation,
    explainability: {
      weakestConcepts: [...concepts].sort((a, b) => (a.effectiveMastery ?? 0) - (b.effectiveMastery ?? 0)).slice(0, 5).map((c) => c.id),
      confidenceBlocked: confidence < 0.75
    }
  };
}
