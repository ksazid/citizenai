import { validateQuestionProvenance } from './knowledge.mjs';
import { UK_PACK_V3, UK_PACK_V3_MANIFEST, validateUkPackV3 } from './uk-knowledge-pack-v3.mjs';

export const UK_CANDIDATE_MANIFEST = Object.freeze({
  ...UK_PACK_V3_MANIFEST,
  id: 'GB-2026.09.02-candidate.3.1',
  version: '2026.09.02-candidate.3.1',
  basePackId: UK_PACK_V3_MANIFEST.id,
  supersedes: UK_PACK_V3_MANIFEST.version,
  generatorHardening: Object.freeze({ uniqueOptionIds: true, singleCanonicalAnswer: true })
});

const extensionConceptIds = new Set(
  UK_PACK_V3.questions.filter((question) => question.packVersion === UK_PACK_V3_MANIFEST.version).map((question) => question.conceptId)
);
const baseQuestions = UK_PACK_V3.questions.filter((question) => !extensionConceptIds.has(question.conceptId));
const conceptsById = new Map(UK_PACK_V3.concepts.map((concept) => [concept.id, concept]));
const factsByConcept = new Map(UK_PACK_V3.facts.map((fact) => [fact.conceptId, fact]));
const ids = ['a','b','c','d'];
const distractors = [
  'This statement is not supported by the authoritative source for this concept.',
  'This describes an unrelated constitutional process rather than this concept.',
  'This places the event or person in a different historical context.'
];

function buildQuestion(concept, fact, variantIndex) {
  const stems = [
    `Which statement best describes ${concept.title}?`,
    `Which verified summary is associated with ${concept.title}?`,
    `Choose the correct description of ${concept.title}.`
  ];
  const position = variantIndex % 3;
  const texts = [...distractors];
  texts.splice(position, 0, fact.canonicalValue);
  const options = texts.map((text, index) => Object.freeze({ id: ids[index], text }));
  return Object.freeze({
    id: `${concept.id}-verified-q${variantIndex + 1}`,
    conceptId: concept.id,
    factId: fact.id,
    packVersion: UK_CANDIDATE_MANIFEST.version,
    questionType: 'multiple_choice',
    stem: stems[variantIndex],
    options: Object.freeze(options),
    correctOptionId: ids[position],
    difficulty: Math.min(1, concept.baseDifficulty + variantIndex * 0.04),
    variantId: `${concept.id}-verified-v${variantIndex + 1}`,
    explanation: fact.canonicalValue,
    status: 'approved',
    provenanceStatus: 'verified'
  });
}

const hardenedQuestions = [...extensionConceptIds].flatMap((conceptId) => {
  const concept = conceptsById.get(conceptId);
  const fact = factsByConcept.get(conceptId);
  return [0,1,2].map((index) => buildQuestion(concept, fact, index));
});

export const UK_CANDIDATE_PACK = Object.freeze({
  manifest: UK_CANDIDATE_MANIFEST,
  sources: Object.freeze(UK_PACK_V3.sources.map((source) => Object.freeze({ ...source, packId: UK_CANDIDATE_MANIFEST.id }))),
  evidence: UK_PACK_V3.evidence,
  concepts: UK_PACK_V3.concepts,
  facts: UK_PACK_V3.facts,
  questions: Object.freeze([...baseQuestions, ...hardenedQuestions])
});

export function validateUkCandidatePack() {
  const errors = [];
  const inherited = validateUkPackV3();
  if (!inherited.ok) errors.push(...inherited.errors.map((error) => `v3:${error}`));

  const uniqueIds = (rows) => new Set(rows.map((row) => row.id)).size === rows.length;
  for (const [name, rows] of [
    ['sources', UK_CANDIDATE_PACK.sources],
    ['evidence', UK_CANDIDATE_PACK.evidence],
    ['concepts', UK_CANDIDATE_PACK.concepts],
    ['facts', UK_CANDIDATE_PACK.facts],
    ['questions', UK_CANDIDATE_PACK.questions]
  ]) {
    if (!uniqueIds(rows)) errors.push(`duplicate_${name}_id`);
  }

  const sourcesById = new Map(UK_CANDIDATE_PACK.sources.map((source) => [source.id, source]));
  const evidenceById = new Map(UK_CANDIDATE_PACK.evidence.map((evidence) => [evidence.id, evidence]));
  for (const source of UK_CANDIDATE_PACK.sources) {
    if (source.packId !== UK_CANDIDATE_MANIFEST.id) errors.push(`source_pack_mismatch:${source.id}`);
    if (source.verificationStatus !== 'approved') errors.push(`source_not_approved:${source.id}`);
  }
  for (const evidence of UK_CANDIDATE_PACK.evidence) {
    if (!sourcesById.has(evidence.sourceId)) errors.push(`evidence_source_missing:${evidence.id}`);
  }

  const factsById = new Map(UK_CANDIDATE_PACK.facts.map((fact) => [fact.id, fact]));
  for (const fact of UK_CANDIDATE_PACK.facts) {
    if (fact.verificationStatus !== 'approved' || fact.confidence !== 1 || fact.evidenceIds.length === 0) errors.push(`fact_not_publishable:${fact.id}`);
    for (const evidenceId of fact.evidenceIds) if (!evidenceById.has(evidenceId)) errors.push(`fact_evidence_missing:${fact.id}:${evidenceId}`);
  }

  const stems = new Set();
  for (const question of UK_CANDIDATE_PACK.questions) {
    const provenance = validateQuestionProvenance({ question, factsById });
    if (!provenance.ok) errors.push(`question_provenance:${question.id}:${provenance.reason}`);
    if (question.options.length !== 4) errors.push(`question_options:${question.id}`);
    const optionIds = question.options.map((option) => option.id);
    if (new Set(optionIds).size !== 4) errors.push(`duplicate_option_id:${question.id}`);
    if (!question.options.some((option) => option.id === question.correctOptionId)) errors.push(`missing_correct_option:${question.id}`);
    const correctText = question.options.find((option) => option.id === question.correctOptionId)?.text;
    if (question.options.filter((option) => option.text === correctText).length !== 1) errors.push(`duplicate_correct_text:${question.id}`);
    if (question.packVersion === UK_CANDIDATE_MANIFEST.version && correctText !== factsById.get(question.factId)?.canonicalValue) errors.push(`correct_answer_not_canonical:${question.id}`);
    if (stems.has(question.stem)) errors.push(`duplicate_question_stem:${question.id}`);
    stems.add(question.stem);
  }

  if (UK_CANDIDATE_PACK.concepts.length !== 59) errors.push(`concept_count:${UK_CANDIDATE_PACK.concepts.length}`);
  if (UK_CANDIDATE_PACK.questions.length !== 177) errors.push(`question_count:${UK_CANDIDATE_PACK.questions.length}`);
  if (UK_CANDIDATE_MANIFEST.coverage.examComplete || UK_CANDIDATE_MANIFEST.coverage.activationAllowed) errors.push('coverage_gate_must_remain_closed');

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    counts: Object.freeze({
      sources: UK_CANDIDATE_PACK.sources.length,
      evidence: UK_CANDIDATE_PACK.evidence.length,
      concepts: UK_CANDIDATE_PACK.concepts.length,
      facts: UK_CANDIDATE_PACK.facts.length,
      questions: UK_CANDIDATE_PACK.questions.length
    })
  });
}
