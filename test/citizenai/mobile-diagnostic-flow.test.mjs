import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('mobile diagnostic uses the backend question as the online source of truth', async () => {
  const source = await fs.readFile('apps/mobile/src/diagnosticScreen.tsx', 'utf8');

  assert.match(source, /createCitizenAIApiClient/);
  assert.match(source, /api\.nextDiagnostic\(rt\.learnerId\)/);
  assert.match(source, /api\.recordAttempt\(\{/);
  assert.match(source, /questionId: question\.id/);
  assert.match(source, /sessionType: 'diagnostic'/);
  assert.match(source, /const question = api\.enabled \? remoteDiagnostic\?\.question \?\? null : rt\.diagnosticQuestion/);
  assert.doesNotMatch(source, /QUESTIONS\.find/);
});

test('diagnostic submission is serialized and refuses a stale repeated question', async () => {
  const source = await fs.readFile('apps/mobile/src/diagnosticScreen.tsx', 'utf8');

  assert.match(source, /if \(!question \|\| submitting\) return/);
  assert.match(source, /setSubmitting\(true\)/);
  assert.match(source, /disabled=\{submitting\}/);
  assert.match(source, /next\.question\?\.id === question\.id/);
  assert.match(source, /Diagnostic question did not advance/);
});

test('I do not know records a null answer immediately', async () => {
  const source = await fs.readFile('apps/mobile/src/diagnosticScreen.tsx', 'utf8');

  assert.match(source, /accessibilityLabel="I don't know"/);
  assert.match(source, /submitAnswer\(null\)/);
  assert.match(source, /optionId,/);
});

test('diagnostic owns its scrolling body and fixed safe-area action footer', async () => {
  const app = await fs.readFile('apps/mobile/App.tsx', 'utf8');
  const source = await fs.readFile('apps/mobile/src/diagnosticScreen.tsx', 'utf8');

  assert.match(app, /current === 'diagnostic'/);
  assert.match(app, /<View style=\{styles\.fixedContent\}>/);
  assert.match(source, /<ScrollView[\s\S]*<\/ScrollView>\s*<View style=\{\[styles\.footer/);
  assert.match(source, /Math\.max\(insets\.bottom, 12\)/);
});
