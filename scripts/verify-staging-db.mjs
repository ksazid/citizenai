import { createPostgresPool, migrateRuntime } from '../src/citizenai/api-server.mjs';

const requiredTables = [
  'citizenai_learner',
  'citizenai_attempt',
  'citizenai_concept_mastery',
  'citizenai_mock',
  'citizenai_exam_outcome',
  'citizenai_runtime_snapshot'
];

const pool = await createPostgresPool(process.env.DATABASE_URL);
try {
  await migrateRuntime(pool);
  const result = await pool.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_name = any($1::text[])
     order by table_name`,
    [requiredTables]
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((name) => !found.has(name));
  if (missing.length) throw new Error(`missing runtime tables: ${missing.join(', ')}`);
  const health = await pool.query('select current_database() as database, current_user as role, version() as version');
  console.log(JSON.stringify({ ok: true, tables: requiredTables.length, database: health.rows[0].database, role: health.rows[0].role, version: health.rows[0].version }, null, 2));
} finally {
  await pool.end();
}
