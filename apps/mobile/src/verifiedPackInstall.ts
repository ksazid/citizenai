// Installs the independently authored, provenance-verified UK coverage candidate into
// the existing engine-backed runtime. The pack remains status=review and is not presented
// as exam-complete until lawful exact-version coverage certification is complete.
// @ts-ignore - production domain pack is an ESM module outside the mobile TS project.
import { UK_CANDIDATE_PACK, UK_CANDIDATE_MANIFEST, validateUkCandidatePack } from '../../../src/citizenai/uk-knowledge-pack-candidate.mjs';
import { CONCEPTS, QUESTIONS, Concept, Question } from './runtime';

const validation = validateUkCandidatePack();
if (!validation.ok) throw new Error(`UK knowledge pack failed validation: ${validation.errors.join(', ')}`);

const concepts: Concept[] = UK_CANDIDATE_PACK.concepts.map((concept: any) => ({
  id: concept.id,
  domainId: concept.domainId,
  title: concept.title,
  importance: concept.importance,
  baseDifficulty: concept.baseDifficulty,
  studyMinutes: concept.studyMinutes,
  misconceptionCode: concept.misconceptionCode ?? null
}));

const questions: Question[] = UK_CANDIDATE_PACK.questions.map((question: any) => ({
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
  id: UK_CANDIDATE_MANIFEST.id,
  version: UK_CANDIDATE_MANIFEST.version,
  status: UK_CANDIDATE_MANIFEST.status,
  coverageStatus: UK_CANDIDATE_MANIFEST.coverage.status,
  examComplete: UK_CANDIDATE_MANIFEST.coverage.examComplete,
  activationAllowed: UK_CANDIDATE_MANIFEST.coverage.activationAllowed,
  sourceCount: UK_CANDIDATE_PACK.sources.length,
  evidenceCount: UK_CANDIDATE_PACK.evidence.length,
  conceptCount: UK_CANDIDATE_PACK.concepts.length,
  factCount: UK_CANDIDATE_PACK.facts.length,
  questionCount: UK_CANDIDATE_PACK.questions.length,
  openGapCount: UK_CANDIDATE_MANIFEST.coverage.openGaps.length,
  sourceSnapshotBackfillComplete: UK_CANDIDATE_MANIFEST.sourceSnapshotPolicy.historicalBackfillComplete
});
