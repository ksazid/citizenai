import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await fs.readFile(path, 'utf8'));

test('native guest access tokens use Expo SecureStore while web keeps the CI-compatible fallback', async () => {
  const mobilePackage = await readJson('apps/mobile/package.json');
  const appConfig = await readJson('apps/mobile/app.json');
  const apiClient = await fs.readFile('apps/mobile/src/apiClient.ts', 'utf8');

  assert.equal(mobilePackage.dependencies['expo-secure-store'], '~57.0.3');

  const secureStorePlugin = appConfig.expo.plugins?.find((entry) => Array.isArray(entry) && entry[0] === 'expo-secure-store');
  assert.ok(secureStorePlugin, 'expo-secure-store config plugin is required');
  assert.equal(secureStorePlugin[1]?.configureAndroidBackup, true);

  assert.match(apiClient, /import \* as SecureStore from 'expo-secure-store'/);
  assert.match(apiClient, /Platform\.OS === 'web'/);
  assert.match(apiClient, /SecureStore\.getItemAsync\(key\)/);
  assert.match(apiClient, /SecureStore\.setItemAsync\(key, token\)/);
  assert.match(apiClient, /One-time migration for Expo Go sessions created before encrypted token storage/);
  assert.match(apiClient, /await AsyncStorage\.removeItem\(key\)/);
});
