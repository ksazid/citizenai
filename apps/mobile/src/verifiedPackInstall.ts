// Installs the independently authored, provenance-verified UK release candidate into
// the existing engine-backed runtime. It remains review-only until an exact-version
// human coverage certification is explicitly approved.
// @ts-ignore - production domain pack is an ESM module outside the mobile TS project.
import { UK_RELEASE_CANDIDATE_PACK, UK_RELEASE_CANDIDATE_MANIFEST, validateUkReleaseCandidate } from '../../../src/citizenai/uk-release-candidate.mjs';
import { CONCEPTS, QUESTIONS, Concept, Question } from './runtime';

const validation = validateUkReleaseCandidate();
if (!validation.ok) throw new Error(`UK release candidate failed validation: ${validation.errors.join(', ')}`);

const concepts: Concept[] = UK_RELEASE_CANDIDATE_PACK.concepts.map((concept: any) => ({
  id: concept.id,
  domainId: concept.domainId,
  title: concept.title,
  importance: concept.importance,
  baseDifficulty: concept.baseDifficulty,
  studyMinutes: concept.studyMinutes,
  misconceptionCode: concept.misconceptionCode ?? null
}));

const questions: Question[] = UK_RELEASE_CANDIDATE_PACK.questions.map((question: any) => ({
  id: question.id,
  conceptId: question.conceptId,
  stem: question.stem,
  options: question.options.map((option: any) => ({ id: option.id, text: option.text })),
  correctOptionId: question.correctOptionId,
  difficulty: question.difficulty,
  variantId: question.variantId,
  explanation: question.explanation,
  misconceptionCode: question.misconceptionCode ?? null
}));

CONCEPTS.splice(0, CONCEPTS.length, ...concepts);
QUESTIONS.splice(0, QUESTIONS.length, ...questions);

export const VERIFIED_UK_PACK_META = Object.freeze({
  id: UK_RELEASE_CANDIDATE_MANIFEST.id,
  version: UK_RELEASE_CANDIDATE_MANIFEST.version,
  status: UK_RELEASE_CANDIDATE_MANIFEST.status,
  coverageStatus: UK_RELEASE_CANDIDATE_MANIFEST.coverage.status,
  examComplete: UK_RELEASE_CANDIDATE_MANIFEST.coverage.examComplete,
  activationAllowed: UK_RELEASE_CANDIDATE_MANIFEST.coverage.activationAllowed,
  sourceCount: UK_RELEASE_CANDIDATE_PACK.sources.length,
  evidenceCount: UK_RELEASE_CANDIDATE_PACK.evidence.length,
  conceptCount: UK_RELEASE_CANDIDATE_PACK.concepts.length,
  factCount: UK_RELEASE_CANDIDATE_PACK.facts.length,
  questionCount: UK_RELEASE_CANDIDATE_PACK.questions.length,
  openGapCount: UK_RELEASE_CANDIDATE_MANIFEST.coverage.openGaps.length,
  sourceSnapshotBackfillComplete: UK_RELEASE_CANDIDATE_MANIFEST.sourceSnapshotPolicy.historicalBackfillComplete,
  sportsSourcePolicyClosed: UK_RELEASE_CANDIDATE_MANIFEST.coverage.sportsSourcePolicyClosed,
  pre1066BreadthMapped: UK_RELEASE_CANDIDATE_MANIFEST.coverage.pre1066BreadthMapped
});
