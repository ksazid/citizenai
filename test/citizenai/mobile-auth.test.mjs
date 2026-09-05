import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (path) => fs.readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('mobile auth uses pinned Supabase client with SecureStore-backed native sessions', async () => {
  const [packageJson, client, auth] = await Promise.all([
    read('apps/mobile/package.json'),
    read('apps/mobile/src/supabaseClient.ts'),
    read('apps/mobile/src/auth.tsx')
  ]);
  const pkg = JSON.parse(packageJson);

  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.115.0');
  assert.equal(pkg.dependencies['react-native-url-polyfill'], '4.0.0');
  assert.match(client, /SecureStore\.setItemAsync/);
  assert.match(client, /persistSession:\s*true/);
  assert.match(client, /autoRefreshToken:\s*true/);
  assert.match(auth, /signUp\(/);
  assert.match(auth, /signInWithPassword/);
  assert.match(auth, /signOut\(/);
  assert.doesNotMatch(client + auth, /service[_-]?role/i, 'mobile must never contain a Supabase service-role credential');
});

test('mobile account sync claims the existing guest learner and preserves the frozen screen inventory', async () => {
  const [auth, apiClient, app, model] = await Promise.all([
    read('apps/mobile/src/auth.tsx'),
    read('apps/mobile/src/apiClient.ts'),
    read('apps/mobile/App.tsx'),
    read('apps/mobile/src/model.ts')
  ]);

  assert.match(auth, /\/v1\/account\/learner/);
  assert.match(auth, /\/v1\/account\/claim/);
  assert.match(auth, /x-citizenai-guest-token/);
  assert.match(apiClient, /deleteGuestAccessToken/);
  assert.match(app, /accountEnhancedScreens/);
  const ids = model.match(/^\s*'[^']+',?$/gm) ?? [];
  assert.equal(ids.length, 28, 'authenticated account foundation must not add screens to the frozen 28-screen MVP');
});
