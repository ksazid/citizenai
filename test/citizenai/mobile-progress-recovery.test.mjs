import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('mobile preserves the stored learner when remote progress restoration fails', async () => {
  const runtime = await fs.readFile('apps/mobile/src/runtime.tsx', 'utf8');
  const app = await fs.readFile('apps/mobile/App.tsx', 'utf8');

  assert.match(runtime, /readStoredLearnerId/);
  assert.match(runtime, /writeStoredLearnerId/);
  assert.match(runtime, /setLearnerId\(storedId\)/);
  assert.match(runtime, /await refreshRemote\(storedId\)/);
  assert.doesNotMatch(runtime, /removeItem\(LEARNER_STORAGE_KEY\)/);
  assert.doesNotMatch(runtime, /AsyncStorage\.removeItem\(/);
  assert.match(runtime, /retryBackend/);
  assert.match(runtime, /hasRemoteState/);

  assert.match(app, /backendState === 'error'/);
  assert.match(app, /!rt\.hasRemoteState/);
  assert.match(app, /Your saved progress has not been replaced/);
  assert.match(app, /label="Try again"/);
});
