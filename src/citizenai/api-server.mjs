import crypto from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PostgresRuntimeRepository } from './runtime-repository.mjs';
import { createRuntimeService } from './runtime-service.mjs';
import { createRuntimeHttpHandler } from './runtime-http.mjs';
import { guestAccessTokenForLearner, validateGuestTokenSecret, verifyGuestAccessToken } from './runtime-access.mjs';

const DEVELOPMENT_GUEST_TOKEN_SECRET = crypto.randomBytes(32).toString('base64url');

function positiveInteger(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export function assertRuntimeLaunchPolicy({ environment = 'development', allowedOrigin = '*' } = {}) {
  if (environment !== 'production') return true;
  const origins = String(allowedOrigin ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  if (origins.includes('*')) throw new Error('production runtime cannot use wildcard CORS');
  throw new Error('production runtime launch is blocked until consumer authentication is implemented');
}

export async function createPostgresPool(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const { Pool } = await import('pg');
  return new Pool({
    connectionString: databaseUrl,
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false },
    max: positiveInteger(process.env.PGPOOL_MAX, 10, { min: 1, max: 50 }),
    connectionTimeoutMillis: positiveInteger(process.env.PG_CONNECTION_TIMEOUT_MS, 10_000, { min: 1000, max: 60_000 }),
    idleTimeoutMillis: positiveInteger(process.env.PG_IDLE_TIMEOUT_MS, 30_000, { min: 1000, max: 300_000 })
  });
}

export async function migrateRuntime(pool) {
  const sql = await fs.readFile(path.resolve('db/migrations/001_citizenai_runtime.sql'), 'utf8');
  await pool.query(sql);
}

export async function startCitizenAIServer(options = {}) {
  const environment = options.environment ?? process.env.NODE_ENV ?? 'development';
  const allowedOrigin = options.allowedOrigin ?? process.env.CITIZENAI_ALLOWED_ORIGIN ?? '*';
  assertRuntimeLaunchPolicy({ environment, allowedOrigin });

  const configuredGuestSecret = options.guestTokenSecret ?? process.env.CITIZENAI_GUEST_TOKEN_SECRET;
  if (!configuredGuestSecret && environment !== 'development' && environment !== 'test') {
    throw new Error('CITIZENAI_GUEST_TOKEN_SECRET is required outside development/test');
  }
  const guestTokenSecret = validateGuestTokenSecret(configuredGuestSecret || DEVELOPMENT_GUEST_TOKEN_SECRET);

  const pool = options.pool ?? await createPostgresPool(options.databaseUrl);
  if (options.migrate !== false) await migrateRuntime(pool);
  const repository = new PostgresRuntimeRepository(pool);
  const service = createRuntimeService({ repository });
  const handler = createRuntimeHttpHandler({
    service,
    issueLearnerAccessToken: (learnerId) => guestAccessTokenForLearner(learnerId, guestTokenSecret),
    authorizeLearner: async (learnerId, token) => verifyGuestAccessToken({ learnerId, token, secret: guestTokenSecret }),
    resolveMockLearnerId: async (mockId) => (await repository.getMock(mockId))?.learnerId ?? null,
    allowedOrigin,
    maxBodyBytes: positiveInteger(options.maxBodyBytes ?? process.env.CITIZENAI_MAX_BODY_BYTES, 256 * 1024, { min: 1024, max: 2 * 1024 * 1024 }),
    rateLimitWindowMs: positiveInteger(options.rateLimitWindowMs ?? process.env.CITIZENAI_RATE_LIMIT_WINDOW_MS, 60_000, { min: 1000, max: 3_600_000 }),
    rateLimitMaxRequests: positiveInteger(options.rateLimitMaxRequests ?? process.env.CITIZENAI_RATE_LIMIT_MAX, 120, { min: 1, max: 10_000 }),
    learnerCreateWindowMs: positiveInteger(options.learnerCreateWindowMs ?? process.env.CITIZENAI_LEARNER_CREATE_WINDOW_MS, 10 * 60_000, { min: 1000, max: 86_400_000 }),
    learnerCreateMaxRequests: positiveInteger(options.learnerCreateMaxRequests ?? process.env.CITIZENAI_LEARNER_CREATE_MAX, 30, { min: 1, max: 1000 })
  });
  const port = Number(options.port ?? process.env.PORT ?? 8787);
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';
  const server = http.createServer(handler);
  server.requestTimeout = positiveInteger(options.requestTimeoutMs ?? process.env.CITIZENAI_REQUEST_TIMEOUT_MS, 15_000, { min: 1000, max: 120_000 });
  server.headersTimeout = Math.min(
    positiveInteger(options.headersTimeoutMs ?? process.env.CITIZENAI_HEADERS_TIMEOUT_MS, 10_000, { min: 1000, max: 60_000 }),
    server.requestTimeout
  );
  server.keepAliveTimeout = positiveInteger(options.keepAliveTimeoutMs ?? process.env.CITIZENAI_KEEP_ALIVE_TIMEOUT_MS, 5_000, { min: 1000, max: 30_000 });
  server.maxHeadersCount = 100;
  server.maxRequestsPerSocket = 1000;
  server.on('clientError', (_error, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });
  return { server, pool, service, repository, port, host };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const runtime = await startCitizenAIServer();
  console.log(`CitizenAI runtime API listening on http://${runtime.host}:${runtime.port}`);
  const close = async () => {
    await new Promise((resolve) => runtime.server.close(resolve));
    await runtime.pool.end();
  };
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}
