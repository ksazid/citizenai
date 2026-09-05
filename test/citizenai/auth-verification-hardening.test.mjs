import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseAuthVerifier } from '../../src/citizenai/account-access.mjs';
import { assertAccountAuthConfiguration } from '../../src/citizenai/api-server.mjs';

const USER_ID = '11111111-1111-4111-8111-111111111111';

test('Supabase account verification carries an abort signal and is bounded', async () => {
  let observedSignal = null;
  const verifier = createSupabaseAuthVerifier({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    timeoutMs: 100,
    fetchImpl: async (_url, init) => {
      observedSignal = init.signal;
      return await new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      });
    }
  });

  assert.equal(verifier.configured, true);
  assert.equal(verifier.timeoutMs, 100);
  assert.equal(await verifier('account-token'), null, 'timeout must fail authentication closed');
  assert.ok(observedSignal instanceof AbortSignal);
  assert.equal(observedSignal.aborted, true);
});

test('Supabase account verification still returns a validated account before timeout', async () => {
  const verifier = createSupabaseAuthVerifier({
    supabaseUrl: 'https://project.supabase.co',
    publishableKey: 'sb_publishable_test',
    timeoutMs: 100,
    fetchImpl: async (_url, init) => {
      assert.equal(init.signal.aborted, false);
      return { ok: true, json: async () => ({ id: USER_ID, email: 'learner@example.com' }) };
    }
  });

  assert.deepEqual(await verifier('account-token'), { id: USER_ID, email: 'learner@example.com' });
});

test('non-development runtime refuses to start with account auth silently unconfigured', () => {
  assert.equal(assertAccountAuthConfiguration({ environment: 'development', configured: false }), true);
  assert.equal(assertAccountAuthConfiguration({ environment: 'test', configured: false }), true);
  assert.equal(assertAccountAuthConfiguration({ environment: 'staging', configured: true }), true);
  assert.equal(assertAccountAuthConfiguration({ environment: 'staging', configured: false, injected: true }), true);
  assert.throws(
    () => assertAccountAuthConfiguration({ environment: 'staging', configured: false }),
    /Supabase Auth server configuration is required/
  );
});
