// Installs the independently authored, provenance-verified and human-certified
// active UK knowledge pack into the existing engine-backed runtime.
// The mobile bundle imports the data-only module so Node-only certification/hash
// tooling stays on the server and in CI.
// @ts-ignore - production domain pack is an ESM module outside the mobile TS project.
import { UK_ACTIVE_PACK, UK_ACTIVE_PACK_MANIFEST, validateUkActivePackData } from '../../../src/citizenai/uk-active-pack-data.mjs';
import { CONCEPTS, QUESTIONS, Concept, Question } from './runtime';

const validation = validateUkActivePackData();
if (!validation.ok) throw new Error(`UK active knowledge pack failed validation: ${validation.errors.join(', ')}`);

const concepts: Concept[] = UK_ACTIVE_PACK.concepts.map((concept: any) => ({
  id: concept.id,
  domainId: concept.domainId,
  title: concept.title,
  importance: concept.importance,
  baseDifficulty: concept.baseDifficulty,
  studyMinutes: concept.studyMinutes,
  misconceptionCode: concept.misconceptionCode ?? null
}));

const questions: Question[] = UK_ACTIVE_PACK.questions.map((question: any) => ({
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
  id: UK_ACTIVE_PACK_MANIFEST.id,
  version: UK_ACTIVE_PACK_MANIFEST.version,
  status: UK_ACTIVE_PACK_MANIFEST.status,
  coverageStatus: UK_ACTIVE_PACK_MANIFEST.coverage.status,
  humanCoverageCertified: UK_ACTIVE_PACK_MANIFEST.coverage.humanCoverageCertified,
  officialGuideAligned: UK_ACTIVE_PACK_MANIFEST.coverage.officialGuideAligned,
  examComplete: UK_ACTIVE_PACK_MANIFEST.coverage.examComplete,
  guaranteedPass: UK_ACTIVE_PACK_MANIFEST.coverage.guaranteedPass,
  activationAllowed: UK_ACTIVE_PACK_MANIFEST.coverage.activationAllowed,
  sourceCount: UK_ACTIVE_PACK.sources.length,
  evidenceCount: UK_ACTIVE_PACK.evidence.length,
  conceptCount: UK_ACTIVE_PACK.concepts.length,
  factCount: UK_ACTIVE_PACK.facts.length,
  questionCount: UK_ACTIVE_PACK.questions.length,
  openGapCount: UK_ACTIVE_PACK_MANIFEST.coverage.openGaps.length,
  sourceSnapshotBackfillComplete: true,
  sportsSourcePolicyClosed: UK_ACTIVE_PACK_MANIFEST.coverage.sportsSourcePolicyClosed,
  pre1066BreadthMapped: UK_ACTIVE_PACK_MANIFEST.coverage.pre1066BreadthMapped,
  contentDigest: UK_ACTIVE_PACK_MANIFEST.contentDigest
});
