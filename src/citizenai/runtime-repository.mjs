import crypto from 'node:crypto';

const clone = (value) => value == null ? value : structuredClone(value);
const nowIso = () => new Date().toISOString();

export class MemoryRuntimeRepository {
  #learners = new Map();
  #attempts = new Map();
  #masteries = new Map();
  #mocks = new Map();
  #outcomes = new Map();
  #snapshots = new Map();

  async createLearner(input) {
    const id = input.id ?? crypto.randomUUID();
    const row = {
      id,
      countryPackId: input.countryPackId,
      examDate: input.examDate ?? null,
      explanationLanguage: input.explanationLanguage ?? 'English',
      preparation: input.preparation ?? 'Some',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    this.#learners.set(id, row);
    return clone(row);
  }

  async getLearner(id) { return clone(this.#learners.get(id) ?? null); }

  async updateLearner(id, patch) {
    const current = this.#learners.get(id);
    if (!current) return null;
    const next = { ...current, ...patch, id, updatedAt: nowIso() };
    this.#learners.set(id, next);
    return clone(next);
  }

  async recordAttempt(input) {
    const row = { id: input.id ?? crypto.randomUUID(), ...input, attemptedAt: input.attemptedAt ?? nowIso() };
    const list = this.#attempts.get(input.learnerId) ?? [];
    list.push(row);
    this.#attempts.set(input.learnerId, list);
    return clone(row);
  }

  async listAttempts(learnerId) { return clone(this.#attempts.get(learnerId) ?? []); }

  async upsertMastery(input) {
    const byConcept = this.#masteries.get(input.learnerId) ?? new Map();
    byConcept.set(input.conceptId, { ...input, updatedAt: nowIso() });
    this.#masteries.set(input.learnerId, byConcept);
    return clone(byConcept.get(input.conceptId));
  }

  async listMasteries(learnerId) {
    return [...(this.#masteries.get(learnerId)?.values() ?? [])].map(clone);
  }

  async saveMock(input) {
    const id = input.id ?? crypto.randomUUID();
    const row = { ...input, id };
    this.#mocks.set(id, row);
    return clone(row);
  }

  async getMock(id) { return clone(this.#mocks.get(id) ?? null); }
  async listMocks(learnerId) { return [...this.#mocks.values()].filter(row => row.learnerId === learnerId).map(clone); }

  async saveExamOutcome(input) {
    const row = { id: input.id ?? crypto.randomUUID(), ...input, recordedAt: input.recordedAt ?? nowIso() };
    const list = this.#outcomes.get(input.learnerId) ?? [];
    list.push(row);
    this.#outcomes.set(input.learnerId, list);
    return clone(row);
  }

  async saveSnapshot(input) {
    const row = { ...input, updatedAt: nowIso() };
    this.#snapshots.set(input.learnerId, row);
    return clone(row);
  }

  async getSnapshot(learnerId) { return clone(this.#snapshots.get(learnerId) ?? null); }
}

export class PostgresRuntimeRepository {
  constructor(pool) {
    if (!pool?.query) throw new Error('Postgres pool with query() required');
    this.pool = pool;
  }

  async createLearner(input) {
    const { rows } = await this.pool.query(
      `INSERT INTO citizenai_learner (country_pack_id, exam_date, explanation_language, preparation)
       VALUES ($1,$2,$3,$4)
       RETURNING id, country_pack_id AS "countryPackId", exam_date::text AS "examDate",
                 explanation_language AS "explanationLanguage", preparation,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [input.countryPackId, input.examDate ?? null, input.explanationLanguage ?? 'English', input.preparation ?? 'Some']
    );
    return rows[0];
  }

  async getLearner(id) {
    const { rows } = await this.pool.query(
      `SELECT id, country_pack_id AS "countryPackId", exam_date::text AS "examDate",
              explanation_language AS "explanationLanguage", preparation,
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM citizenai_learner WHERE id=$1`, [id]
    );
    return rows[0] ?? null;
  }

  async updateLearner(id, patch) {
    const current = await this.getLearner(id);
    if (!current) return null;
    const { rows } = await this.pool.query(
      `UPDATE citizenai_learner
       SET exam_date=$2, explanation_language=$3, preparation=$4, updated_at=now()
       WHERE id=$1
       RETURNING id, country_pack_id AS "countryPackId", exam_date::text AS "examDate",
                 explanation_language AS "explanationLanguage", preparation,
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [id, patch.examDate ?? current.examDate, patch.explanationLanguage ?? current.explanationLanguage, patch.preparation ?? current.preparation]
    );
    return rows[0] ?? null;
  }

  async recordAttempt(input) {
    const { rows } = await this.pool.query(
      `INSERT INTO citizenai_attempt
       (learner_id, question_id, concept_id, session_type, option_id, correct, response_ms, variant_id, difficulty, attempted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10::timestamptz, now()))
       RETURNING id, learner_id AS "learnerId", question_id AS "questionId", concept_id AS "conceptId",
                 session_type AS "sessionType", option_id AS "optionId", correct, response_ms AS "responseMs",
                 variant_id AS "variantId", difficulty, attempted_at AS "attemptedAt"`,
      [input.learnerId, input.questionId, input.conceptId, input.sessionType, input.optionId ?? null, input.correct,
       input.responseMs ?? null, input.variantId ?? null, input.difficulty, input.attemptedAt ?? null]
    );
    return rows[0];
  }

  async listAttempts(learnerId) {
    const { rows } = await this.pool.query(
      `SELECT id, learner_id AS "learnerId", question_id AS "questionId", concept_id AS "conceptId",
              session_type AS "sessionType", option_id AS "optionId", correct, response_ms AS "responseMs",
              variant_id AS "variantId", difficulty, attempted_at AS "attemptedAt"
       FROM citizenai_attempt WHERE learner_id=$1 ORDER BY attempted_at`, [learnerId]
    );
    return rows;
  }

  async upsertMastery(input) {
    const { rows } = await this.pool.query(
      `INSERT INTO citizenai_concept_mastery
       (learner_id, concept_id, state, mastery_mean, mastery_confidence, retention, updated_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,now())
       ON CONFLICT (learner_id, concept_id) DO UPDATE SET
         state=EXCLUDED.state, mastery_mean=EXCLUDED.mastery_mean,
         mastery_confidence=EXCLUDED.mastery_confidence, retention=EXCLUDED.retention, updated_at=now()
       RETURNING learner_id AS "learnerId", concept_id AS "conceptId", state,
                 mastery_mean AS "masteryMean", mastery_confidence AS "masteryConfidence", retention, updated_at AS "updatedAt"`,
      [input.learnerId, input.conceptId, JSON.stringify(input.state), input.masteryMean, input.masteryConfidence, input.retention]
    );
    return rows[0];
  }

  async listMasteries(learnerId) {
    const { rows } = await this.pool.query(
      `SELECT learner_id AS "learnerId", concept_id AS "conceptId", state,
              mastery_mean AS "masteryMean", mastery_confidence AS "masteryConfidence", retention, updated_at AS "updatedAt"
       FROM citizenai_concept_mastery WHERE learner_id=$1`, [learnerId]
    );
    return rows;
  }

  async saveMock(input) {
    const id = input.id ?? crypto.randomUUID();
    const { rows } = await this.pool.query(
      `INSERT INTO citizenai_mock (id, learner_id, state, status, passed, score, started_at, completed_at)
       VALUES ($1,$2,$3::jsonb,$4,$5,$6,COALESCE($7::timestamptz,now()),$8)
       ON CONFLICT (id) DO UPDATE SET state=EXCLUDED.state,status=EXCLUDED.status,passed=EXCLUDED.passed,
         score=EXCLUDED.score,completed_at=EXCLUDED.completed_at
       RETURNING id, learner_id AS "learnerId", state, status, passed, score,
                 started_at AS "startedAt", completed_at AS "completedAt"`,
      [id, input.learnerId, JSON.stringify(input.state), input.status, input.passed ?? null, input.score ?? null,
       input.startedAt ?? null, input.completedAt ?? null]
    );
    return rows[0];
  }

  async getMock(id) {
    const { rows } = await this.pool.query(
      `SELECT id, learner_id AS "learnerId", state, status, passed, score,
              started_at AS "startedAt", completed_at AS "completedAt"
       FROM citizenai_mock WHERE id=$1`, [id]
    );
    return rows[0] ?? null;
  }

  async listMocks(learnerId) {
    const { rows } = await this.pool.query(
      `SELECT id, learner_id AS "learnerId", state, status, passed, score,
              started_at AS "startedAt", completed_at AS "completedAt"
       FROM citizenai_mock WHERE learner_id=$1 ORDER BY started_at`, [learnerId]
    );
    return rows;
  }

  async saveExamOutcome(input) {
    const { rows } = await this.pool.query(
      `INSERT INTO citizenai_exam_outcome (learner_id,result,consent_to_calibration,feedback,recorded_at)
       VALUES ($1,$2,$3,$4::jsonb,COALESCE($5::timestamptz,now()))
       RETURNING id, learner_id AS "learnerId", result, consent_to_calibration AS "consentToCalibration",
                 feedback, recorded_at AS "recordedAt"`,
      [input.learnerId, input.result, Boolean(input.consentToCalibration), JSON.stringify(input.feedback ?? {}), input.recordedAt ?? null]
    );
    return rows[0];
  }

  async saveSnapshot(input) {
    const { rows } = await this.pool.query(
      `INSERT INTO citizenai_runtime_snapshot (learner_id, pack_version, state, updated_at)
       VALUES ($1,$2,$3::jsonb,now())
       ON CONFLICT (learner_id) DO UPDATE SET pack_version=EXCLUDED.pack_version,state=EXCLUDED.state,updated_at=now()
       RETURNING learner_id AS "learnerId", pack_version AS "packVersion", state, updated_at AS "updatedAt"`,
      [input.learnerId, input.packVersion, JSON.stringify(input.state)]
    );
    return rows[0];
  }

  async getSnapshot(learnerId) {
    const { rows } = await this.pool.query(
      `SELECT learner_id AS "learnerId", pack_version AS "packVersion", state, updated_at AS "updatedAt"
       FROM citizenai_runtime_snapshot WHERE learner_id=$1`, [learnerId]
    );
    return rows[0] ?? null;
  }
}
