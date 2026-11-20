import { UK_ACTIVE_PACK } from './uk-active-pack.mjs';
import { UK_EXPANSION_ROWS } from './uk-expansion-draft-data.mjs';

// Editorial candidate only: never imported by the active runtime selector.
// Source links point to the public-authority sources already present in the
// certified pack, but the NEW assertions and options require human review.
export const UK_EXPANSION_DRAFT_MANIFEST = Object.freeze({
  id: 'GB-2026.11.20-expansion-draft.1',
  version: '2026.11.20-expansion-draft.1',
  status: 'draft',
  basePackVersion: UK_ACTIVE_PACK.manifest.version,
  authoringRun: 'citizenai-original-question-expansion-2026-11-20',
  author: 'AI-assisted original authoring',
  intendedAdditionalQuestions: 300,
  editorialStatus: 'awaiting_independent_fact_and_distractor_review',
  independentlyAuthored: true,
  sourcePolicy: 'Public-authority links from the certified UK pack; newly authored assertions still require source-level editorial verification.',
  coverage: Object.freeze({
    officialGuideAligned: false,
    examComplete: false,
    activationAllowed: false,
    humanReviewed: false,
    guaranteedPass: false
  })
});

const syllabusTopics = Object.freeze([
  'values_and_principles', 'what_is_the_uk', 'long_history',
  'modern_society', 'government_law_and_your_role'
]);
const sourceById = new Map(UK_ACTIVE_PACK.sources.map(source => [source.id, source]));

export const UK_EXPANSION_DRAFT_PACK = Object.freeze({
  manifest: UK_EXPANSION_DRAFT_MANIFEST,
  sources: Object.freeze(UK_ACTIVE_PACK.sources),
  evidence: Object.freeze(UK_EXPANSION_ROWS.map(row => Object.freeze({
    id: `ev-exp-${row.id}`,
    sourceId: row.sourceId,
    sourceUrl: sourceById.get(row.sourceId)?.url ?? null,
    locator: row.locator,
    evidenceText: row.fact,
    verificationStatus: 'pending_editor_review',
    retrievedAt: null
  }))),
  concepts: Object.freeze(UK_EXPANSION_ROWS.map(row => Object.freeze({
    id: `exp-${row.id}`,
    domainId: row.domainId,
    syllabusTopic: row.syllabusTopic,
    key: `exp-${row.id}`,
    title: row.title,
    status: 'draft'
  }))),
  facts: Object.freeze(UK_EXPANSION_ROWS.map(row => Object.freeze({
    id: `fact-exp-${row.id}`,
    conceptId: `exp-${row.id}`,
    canonicalValue: row.fact,
    evidenceIds: Object.freeze([`ev-exp-${row.id}`]),
    verificationStatus: 'pending',
    confidence: 0
  }))),
  questions: Object.freeze(UK_EXPANSION_ROWS.flatMap((row, rowIndex) =>
    row.stems.map((stem, variantIndex) => {
      const correctPosition = (rowIndex + variantIndex) % 4;
      const texts = [...row.distractors];
      texts.splice(correctPosition, 0, row.answer);
      return Object.freeze({
        id: `exp-${row.id}-q${variantIndex + 1}`,
        conceptId: `exp-${row.id}`,
        factId: `fact-exp-${row.id}`,
        sourceId: row.sourceId,
        packVersion: UK_EXPANSION_DRAFT_MANIFEST.version,
        questionType: 'multiple_choice',
        stem,
        options: Object.freeze(texts.map((text, index) => Object.freeze({id: 'abcd'[index], text}))),
        correctOptionId: 'abcd'[correctPosition],
        variantId: `exp-${row.id}-v${variantIndex + 1}`,
        explanation: row.fact,
        status: 'draft',
        provenanceStatus: 'pending_editor_review'
      });
    })
  ))
});

export function validateUkExpansionDraft() {
  const errors = [];
  const rows = UK_EXPANSION_ROWS;
  const pack = UK_EXPANSION_DRAFT_PACK;
  if (new Set(rows.map(row => row.id)).size !== rows.length) errors.push('duplicate_concept_ids');
  if (rows.length !== 100) errors.push(`expected_100_concepts:${rows.length}`);
  if (pack.questions.length !== 300) errors.push(`expected_300_questions:${pack.questions.length}`);
  if (new Set(pack.questions.map(q => q.id)).size !== pack.questions.length) errors.push('duplicate_question_ids');
  if (new Set(pack.questions.map(q => q.stem.toLowerCase())).size !== pack.questions.length) errors.push('duplicate_stems');
  for (const row of rows) {
    if (!syllabusTopics.includes(row.syllabusTopic)) errors.push(`invalid_syllabus_topic:${row.id}`);
    if (!['government','rights','history','culture'].includes(row.domainId)) errors.push(`invalid_domain:${row.id}`);
    if (!sourceById.has(row.sourceId)) errors.push(`unknown_source:${row.id}:${row.sourceId}`);
    if (!row.locator || !row.fact || !row.title) errors.push(`missing_evidence_metadata:${row.id}`);
    if (row.stems.length !== 3) errors.push(`expected_three_stems:${row.id}`);
    if (row.distractors.length !== 3) errors.push(`expected_three_distractors:${row.id}`);
    if (new Set([row.answer, ...row.distractors].map(s => s.toLowerCase())).size !== 4) errors.push(`ambiguous_options:${row.id}`);
    if ([row.answer,...row.distractors].some(s => !s.trim() || /not supported by|unrelated to this concept|this statement belongs/i.test(s))) errors.push(`weak_option:${row.id}`);
  }
  for (const q of pack.questions) {
    if (q.options.length !== 4 || new Set(q.options.map(o => o.id)).size !== 4) errors.push(`invalid_options:${q.id}`);
    if (q.options.filter(o => o.id === q.correctOptionId).length !== 1) errors.push(`invalid_answer:${q.id}`);
    if (q.status !== 'draft' || q.provenanceStatus !== 'pending_editor_review') errors.push(`unreviewed_question_promoted:${q.id}`);
  }
  for (const topic of syllabusTopics) if (!rows.some(row => row.syllabusTopic === topic)) errors.push(`syllabus_gap:${topic}`);
  if (pack.manifest.coverage.activationAllowed || pack.manifest.coverage.humanReviewed) errors.push('draft_must_remain_blocked');
  return Object.freeze({ok: errors.length === 0, errors: Object.freeze(errors), counts: Object.freeze({concepts:rows.length,questions:pack.questions.length,sourceLinks:new Set(rows.map(r => r.sourceId)).size,topics:new Set(rows.map(r=>r.syllabusTopic)).size})});
}
