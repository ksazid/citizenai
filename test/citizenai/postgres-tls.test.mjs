import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPostgresSslConfig,
  sanitizePostgresConnectionString
} from '../../src/citizenai/api-server.mjs';

const TEST_CA = '-----BEGIN CERTIFICATE-----\\nTEST-CERTIFICATE\\n-----END CERTIFICATE-----';

test('PostgreSQL TLS is fail-closed unless explicitly disabled', () => {
  assert.equal(createPostgresSslConfig({ pgssl: 'disable' }), false);
  assert.throws(
    () => createPostgresSslConfig({ pgssl: 'require', rootCertificate: '' }),
    /PGSSLROOTCERT_PEM is required/
  );

  const ssl = createPostgresSslConfig({ pgssl: 'require', rootCertificate: TEST_CA });
  assert.equal(ssl.rejectUnauthorized, true);
  assert.equal(ssl.ca, '-----BEGIN CERTIFICATE-----\nTEST-CERTIFICATE\n-----END CERTIFICATE-----');
});

test('connection-string SSL parameters cannot override explicit verified TLS config', () => {
  const sanitized = sanitizePostgresConnectionString(
    'postgresql://user:secret@example.test:5432/postgres?sslmode=require&sslrootcert=unsafe.crt&application_name=citizenai'
  );
  const parsed = new URL(sanitized);

  assert.equal(parsed.searchParams.has('sslmode'), false);
  assert.equal(parsed.searchParams.has('sslrootcert'), false);
  assert.equal(parsed.searchParams.get('application_name'), 'citizenai');
});
