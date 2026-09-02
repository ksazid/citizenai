import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const model = fs.readFileSync(new URL('../../apps/mobile/src/model.ts', import.meta.url), 'utf8');
const screens = fs.readFileSync(new URL('../../apps/mobile/src/screens.tsx', import.meta.url), 'utf8');
const theme = fs.readFileSync(new URL('../../apps/mobile/src/theme.ts', import.meta.url), 'utf8');
const components = fs.readFileSync(new URL('../../apps/mobile/src/components.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../../apps/mobile/App.tsx', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../../apps/mobile/package.json', import.meta.url), 'utf8'));

const expected = [
  'welcome', 'test-setup', 'diagnostic', 'diagnostic-result', 'home', 'today-plan',
  'learn-concept', 'compare-concepts', 'recall', 'question', 'answer-explanation',
  'session-complete', 'progress-overview', 'domain-detail', 'concept-detail',
  'mock-intro', 'mock-question', 'mock-review', 'mock-result', 'pass-ready',
  'maintenance-review', 'exam-countdown', 'exam-day', 'exam-result', 'passed',
  'failed', 'profile', 'source-info'
];

test('mobile UI keeps the frozen 28-screen inventory', () => {
  for (const id of expected) {
    assert.match(model, new RegExp(`['\\"]${id}['\\"]`));
    assert.match(screens, new RegExp(`['\\"]?${id.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}['\\"]?\\s*:`));
  }
  assert.equal(expected.length, 28);
});

test('navigation exposes only the frozen four primary tabs', () => {
  for (const tab of ['home', 'learn', 'progress', 'profile']) assert.match(model, new RegExp(`${tab}:`));
  for (const forbidden of ['chat:', 'community:', 'explore:', 'courses:']) assert.doesNotMatch(model, new RegExp(forbidden));
});

test('approved UI DNA remains encoded in mobile tokens', () => {
  assert.match(theme, /background: '#FBFCFF'/);
  assert.match(theme, /text: '#071B57'/);
  assert.match(theme, /primary: '#1F5BE8'/);
  assert.match(theme, /teal: '#16A3A1'/);
  assert.match(theme, /Pass Ready/);
});

test('approved five visual anchors are explicitly represented', () => {
  for (const anchor of ['Get ready to pass', 'You’re Building', 'Your readiness', 'Parliament vs Government', 'Pass Ready']) {
    assert.match(screens, new RegExp(anchor));
  }
  assert.match(components, /ProgressRing/);
  assert.match(components, /shield-crown-outline/);
  assert.match(components, /BottomTabs/);
  assert.match(components, /IconTile/);
});

test('mobile app is interactive rather than a static mockup', () => {
  assert.match(app, /useState<ScreenId\[]>/);
  assert.match(app, /navigate/);
  assert.match(screens, /onPress=/);
  assert.match(screens, /TextInput/);
});

test('mobile scaffold targets stable Expo SDK 57', () => {
  assert.equal(pkg.dependencies.expo, '~57.0.0');
  assert.equal(pkg.dependencies.react, '19.2.3');
  assert.equal(pkg.dependencies['react-native'], '0.86.0');
  assert.ok(pkg.dependencies['@expo/vector-icons']);
  assert.ok(pkg.dependencies['react-native-svg']);
});
