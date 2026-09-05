const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeBaseUrl = (value) => String(value ?? '').trim().replace(/\/$/, '');

export function createSupabaseAuthVerifier({
  supabaseUrl = process.env.SUPABASE_URL,
  publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY,
  fetchImpl = globalThis.fetch
} = {}) {
  const baseUrl = normalizeBaseUrl(supabaseUrl);
  const apiKey = String(publishableKey ?? '').trim();
  const configured = Boolean(baseUrl && apiKey && typeof fetchImpl === 'function');

  const verify = async (accessToken) => {
    const token = String(accessToken ?? '').trim();
    if (!configured || !token || token.startsWith('citizenai_guest_')) return null;

    let response;
    try {
      response = await fetchImpl(`${baseUrl}/auth/v1/user`, {
        headers: {
          apikey: apiKey,
          authorization: `Bearer ${token}`,
          accept: 'application/json'
        }
      });
    } catch {
      return null;
    }
    if (!response?.ok) return null;

    let user;
    try { user = await response.json(); }
    catch { return null; }
    if (!UUID_RE.test(String(user?.id ?? ''))) return null;
    return { id: user.id, email: typeof user.email === 'string' ? user.email : null };
  };
  verify.configured = configured;
  return verify;
}

export class MemoryAccountOwnershipRepository {
  #byLearner = new Map();
  #byUser = new Map();

  async findByLearnerId(learnerId) {
    return this.#byLearner.get(learnerId) ?? null;
  }

  async findByAuthUserId(authUserId) {
    return this.#byUser.get(authUserId) ?? null;
  }

  async claim(learnerId, authUserId) {
    const learnerOwner = this.#byLearner.get(learnerId);
    if (learnerOwner && learnerOwner.authUserId !== authUserId) return null;
    const accountLearner = this.#byUser.get(authUserId);
    if (accountLearner && accountLearner.learnerId !== learnerId) return null;

    const row = { learnerId, authUserId, claimedAt: new Date().toISOString() };
    this.#byLearner.set(learnerId, row);
    this.#byUser.set(authUserId, row);
    return row;
  }
}

export class PostgresAccountOwnershipRepository {
  constructor(pool) {
    if (!pool?.query) throw new Error('Postgres pool with query() required');
    this.pool = pool;
  }

  async findByLearnerId(learnerId) {
    const { rows } = await this.pool.query(
      `SELECT learner_id AS "learnerId", auth_user_id AS "authUserId", claimed_at AS "claimedAt"
       FROM citizenai_learner_account WHERE learner_id=$1`,
      [learnerId]
    );
    return rows[0] ?? null;
  }

  async findByAuthUserId(authUserId) {
    const { rows } = await this.pool.query(
      `SELECT learner_id AS "learnerId", auth_user_id AS "authUserId", claimed_at AS "claimedAt"
       FROM citizenai_learner_account WHERE auth_user_id=$1`,
      [authUserId]
    );
    return rows[0] ?? null;
  }

  async claim(learnerId, authUserId) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO citizenai_learner_account (learner_id, auth_user_id)
         VALUES ($1,$2)
         ON CONFLICT (learner_id) DO UPDATE
           SET auth_user_id=EXCLUDED.auth_user_id
           WHERE citizenai_learner_account.auth_user_id=EXCLUDED.auth_user_id
         RETURNING learner_id AS "learnerId", auth_user_id AS "authUserId", claimed_at AS "claimedAt"`,
        [learnerId, authUserId]
      );
      return rows[0] ?? null;
    } catch (error) {
      if (error?.code === '23505') return null;
      throw error;
    }
  }
}
