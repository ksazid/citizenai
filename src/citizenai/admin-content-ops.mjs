import { canPublishFact, validateQuestionProvenance } from './knowledge.mjs';

export function diffSourceVersion(previous, current) {
  const changed = previous.contentHash !== current.contentHash;
  return {
    sourceId: current.id,
    changed,
    previousHash: previous.contentHash,
    currentHash: current.contentHash,
    retrievedAt: current.retrievedAt,
  };
}

export function impactAnalysis({ changedFactIds = [], questions = [] }) {
  const affectedQuestions = questions
    .filter((question) => changedFactIds.includes(question.factId))
    .map((question) => question.id);

  return {
    changedFactIds: [...new Set(changedFactIds)],
    affectedQuestionIds: [...new Set(affectedQuestions)],
  };
}

export function reviewFact({ fact, reviewerId, decision, reviewedAt = new Date().toISOString() }) {
  if (!['approve', 'reject'].includes(decision)) throw new Error('invalid review decision');

  if (decision === 'approve' && !canPublishFact(fact)) {
    return { status: 'blocked', reasons: ['fact_not_publishable'], reviewerId, reviewedAt };
  }

  return {
    status: decision === 'approve' ? 'approved' : 'rejected',
    reviewerId,
    reviewedAt,
  };
}

export function reviewQuestion({ question, facts, reviewerId, decision, reviewedAt = new Date().toISOString() }) {
  if (!['approve', 'reject'].includes(decision)) throw new Error('invalid review decision');

  if (decision === 'approve') {
    const factsById = new Map((facts ?? []).map((fact) => [fact.id, fact]));
    const validation = validateQuestionProvenance({ question, factsById });
    if (!validation.ok) {
      return { status: 'blocked', reasons: [validation.reason], reviewerId, reviewedAt };
    }
  }

  return {
    status: decision === 'approve' ? 'approved' : 'rejected',
    reviewerId,
    reviewedAt,
  };
}

export function publishImmutablePack({ pack, facts, questions, approvals, publishedBy, publishedAt = new Date().toISOString() }) {
  if (pack.status === 'active') throw new Error('active pack is immutable');
  if (!approvals?.content || !approvals?.release) throw new Error('content and release approvals required');

  return Object.freeze({
    ...pack,
    status: 'active',
    publishedAt,
    publishedBy,
    facts: Object.freeze([...facts]),
    questions: Object.freeze([...questions]),
    audit: Object.freeze({
      contentApproval: approvals.content,
      releaseApproval: approvals.release,
    }),
  });
}
