// Installs the independently authored, provenance-verified expanded UK review pack into
// the existing engine-backed runtime. The pack remains status=review and is not presented
// as exam-complete until lawful exact-version coverage certification is complete.
// @ts-ignore - production domain pack is an ESM module outside the mobile TS project.
import { UK_PACK_V2, validateUkPackV2 } from '../../../src/citizenai/uk-knowledge-pack-v2.mjs';
import { CONCEPTS, QUESTIONS, Concept, Question } from './runtime';

const validation = validateUkPackV2();
if (!validation.ok) throw new Error(`UK knowledge pack failed validation: ${validation.errors.join(', ')}`);

const concepts: Concept[] = UK_PACK_V2.concepts.map((concept: any) => ({
  id: concept.id,
  domainId: concept.domainId,
  title: concept.title,
  importance: concept.importance,
  baseDifficulty: concept.baseDifficulty,
  studyMinutes: concept.studyMinutes,
  misconceptionCode: concept.misconceptionCode ?? null
}));

const questions: Question[] = UK_PACK_V2.questions.map((question: any) => ({
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
  id: UK_PACK_V2.manifest.id,
  version: UK_PACK_V2.manifest.version,
  status: UK_PACK_V2.manifest.status,
  coverageStatus: UK_PACK_V2.manifest.coverage.status,
  examComplete: UK_PACK_V2.manifest.coverage.examComplete,
  activationAllowed: UK_PACK_V2.manifest.coverage.activationAllowed,
  sourceCount: UK_PACK_V2.sources.length,
  evidenceCount: UK_PACK_V2.evidence.length,
  conceptCount: UK_PACK_V2.concepts.length,
  factCount: UK_PACK_V2.facts.length,
  questionCount: UK_PACK_V2.questions.length,
  openGapCount: UK_PACK_V2.manifest.coverage.openGaps.length
});
