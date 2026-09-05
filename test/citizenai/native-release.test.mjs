import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const appConfig = JSON.parse(fs.readFileSync(new URL('../../apps/mobile/app.json', import.meta.url), 'utf8')).expo;
const eas = JSON.parse(fs.readFileSync(new URL('../../apps/mobile/eas.json', import.meta.url), 'utf8'));
const mobilePackage = JSON.parse(fs.readFileSync(new URL('../../apps/mobile/package.json', import.meta.url), 'utf8'));
const appSource = fs.readFileSync(new URL('../../apps/mobile/App.tsx', import.meta.url), 'utf8');

const stagingApi = 'https://citizenai-api-staging.onrender.com';

test('native app identity is explicit and versionable', () => {
  assert.equal(appConfig.owner, 'ksazids-team');
  assert.equal(appConfig.extra.eas.projectId, '08717dc8-a438-45c3-b404-31c2465d5268');
  assert.equal(appConfig.scheme, 'citizenai');
  assert.equal(appConfig.ios.bundleIdentifier, 'ai.citizen.mobile');
  assert.equal(appConfig.android.package, 'ai.citizen.mobile');
  assert.equal(appConfig.ios.buildNumber, '1');
  assert.equal(appConfig.android.versionCode, 1);
});

test('device, simulator and TestFlight profiles are explicit', () => {
  assert.equal(eas.cli.appVersionSource, 'remote');
  assert.equal(eas.build.development.developmentClient, true);
  assert.equal(eas.build.development.distribution, 'internal');
  assert.equal(eas.build['ios-simulator'].ios.simulator, true);
  assert.equal(eas.build.staging.distribution, 'internal');
  assert.equal(eas.build.staging.android.buildType, 'apk');
  assert.equal(eas.build.testflight.distribution, 'store');
  assert.equal(eas.build.testflight.autoIncrement, true);
  assert.equal(eas.build.production.autoIncrement, true);
});

test('non-production builds target the certified staging API without embedding secrets', () => {
  assert.equal(eas.build.development.env.EXPO_PUBLIC_CITIZENAI_API_URL, stagingApi);
  assert.equal(eas.build.staging.env.EXPO_PUBLIC_CITIZENAI_API_URL, stagingApi);
  assert.equal(eas.build.testflight.env.EXPO_PUBLIC_CITIZENAI_API_URL, stagingApi);
  assert.equal(eas.build.production.env, undefined);
  assert.match(stagingApi, /^https:\/\//);
  assert.doesNotMatch(JSON.stringify(eas), /password|service[_-]?role|database_url/i);
});

test('real-device shell uses native safe-area context', () => {
  assert.equal(mobilePackage.dependencies['react-native-safe-area-context'], '~5.7.0');
  assert.equal(mobilePackage.dependencies['expo-dev-client'], '~57.0.18');
  assert.match(appSource, /SafeAreaProvider/);
  assert.match(appSource, /useSafeAreaInsets/);
  assert.match(appSource, /initialWindowMetrics/);
  assert.match(appSource, /edges=\{\['top', 'left', 'right'\]\}/);
});
