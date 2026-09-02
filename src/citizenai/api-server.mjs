import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PostgresRuntimeRepository } from './runtime-repository.mjs';
import { createRuntimeService } from './runtime-service.mjs';
import { createRuntimeHttpHandler } from './runtime-http.mjs';

export async function createPostgresPool(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  const { Pool } = await import('pg');
  return new Pool({ connectionString: databaseUrl, ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false } });
}

export async function migrateRuntime(pool) {
  const sql = await fs.readFile(path.resolve('db/migrations/001_citizenai_runtime.sql'), 'utf8');
  await pool.query(sql);
}

export async function startCitizenAIServer(options = {}) {
  const pool = options.pool ?? await createPostgresPool(options.databaseUrl);
  if (options.migrate !== false) await migrateRuntime(pool);
  const repository = new PostgresRuntimeRepository(pool);
  const service = createRuntimeService({ repository });
  const handler = createRuntimeHttpHandler({
    service,
    allowedOrigin: options.allowedOrigin ?? process.env.CITIZENAI_ALLOWED_ORIGIN ?? '*'
  });
  const port = Number(options.port ?? process.env.PORT ?? 8787);
  const host = options.host ?? process.env.HOST ?? '0.0.0.0';
  const server = http.createServer(handler);
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
