function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value)));
}

export function selectDiagnosticQuestion({ concepts, attemptsByConcept = new Map(), limit = 24 }) {
  const ranked = concepts
    .map((concept) => {
      const attempts = attemptsByConcept.get(concept.id) ?? 0;
      const coveragePenalty = attempts === 0 ? 1 : 1 / (attempts + 1);
      const priority = (concept.importance ?? 0.5) * 0.55 + (concept.baseDifficulty ?? 0.5) * 0.2 + coveragePenalty * 0.25;
      return { concept, attempts, priority };
    })
    .sort((a, b) => b.priority - a.priority || a.attempts - b.attempts || a.concept.id.localeCompare(b.concept.id));

  return ranked.slice(0, limit).map(({ concept }) => concept);
}

export function shouldCompleteDiagnostic({ answeredCount, minimumQuestions = 20, maximumQuestions = 30, domainCoverage = 0, importantConceptCoverage = 0 }) {
  if (answeredCount >= maximumQuestions) return true;
  if (answeredCount < minimumQuestions) return false;
  return clamp01(domainCoverage) >= 1 && clamp01(importantConceptCoverage) >= 0.8;
}

export function summarizeDiagnostic({ answers, conceptsById }) {
  const domains = new Map();
  for (const answer of answers) {
    const concept = conceptsById.get(answer.conceptId);
    if (!concept) continue;
    const current = domains.get(concept.domainId) ?? { weightedCorrect: 0, weight: 0, answered: 0 };
    const weight = 0.5 + clamp01(concept.importance ?? 0.5);
    current.weightedCorrect += answer.correct ? weight : 0;
    current.weight += weight;
    current.answered += 1;
    domains.set(concept.domainId, current);
  }

  return Object.fromEntries([...domains.entries()].map(([domainId, stats]) => [domainId, {
    score: stats.weight === 0 ? 0 : Math.round((stats.weightedCorrect / stats.weight) * 100),
    answered: stats.answered
  }]));
}
