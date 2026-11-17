import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('www/index.html', 'utf8');
const app = readFileSync('www/app.js', 'utf8');
const css = readFileSync('www/style.css', 'utf8');
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));

test('app JavaScript parses without syntax errors', () => {
  assert.doesNotThrow(() => new vm.Script(app, { filename: 'www/app.js' }));
});

test('Android app identity and web output are configured', () => {
  assert.equal(config.appId, 'com.cinemaking.king');
  assert.equal(config.appName, 'Cinema King');
  assert.equal(config.webDir, 'www');
});

test('main screens and controls exist in the HTML', () => {
  const requiredIds = [
    'newProject', 'startBtn', 'importBtn', 'projectFile', 'projects',
    'editor', 'backBtn', 'projectTitle', 'preview', 'sceneList',
    'sceneTitle', 'sceneNarration', 'addScene', 'deleteScene',
    'prevScene', 'nextScene', 'playPreview', 'speakScene',
    'exportProject', 'sceneImage', 'renderVideo', 'status',
    'cinematicRender', 'renderServiceUrl', 'renderToken', 'renderLanguage', 'renderVoice', 'renderSize'
  ];
  for (const id of requiredIds) {
    assert.match(html, new RegExp('id=["\\']' + id + '["\\']'), `Missing UI control: ${id}`);
  }
});

test('core filmmaking actions are wired to UI controls', () => {
  const handlers = [
    /\$('#newProject'\)\.onclick\s*=\s*create/,
    /\$('#startBtn'\)\.onclick\s*=\s*create/,
    /\$('#addScene'\)\.onclick\s*=\s*addScene/,
    /\$('#deleteScene'\)\.onclick\s*=\s*deleteScene/,
    /\$('#renderVideo'\)\.onclick\s*=\s*renderVideo/,
    /\$('#exportProject'\)\.onclick\s*=\s*exportProject/,
    /\$('#cinematicRender'\)\.onclick\s*=\s*renderWithCinematicEngine/
  ];
  for (const pattern of handlers) assert.match(app, pattern, `Missing event binding: ${pattern}`);
});

test('project, storyboard, preview, import/export and rendering features exist', () => {
  for (const symbol of [
    'function create(', 'function addScene(', 'function deleteScene(',
    'function drawFrame(', 'function preview(', 'function importProject(',
    'function exportProject(', 'async function renderVideo(', 'async function renderWithCinematicEngine('
  ]) assert.ok(app.includes(symbol), `Missing feature: ${symbol}`);
  assert.match(app, /localStorage\.getItem\('ck_projects'\)/);
  assert.match(app, /new MediaRecorder\(/);
  assert.match(app, /\/api\/render/);
  assert.match(app, /captureStream\(30\)/);
});

test('mobile layout stylesheet is present and non-empty', () => {
  assert.ok(css.length > 500, 'Stylesheet appears unexpectedly small');
  assert.match(css, /@media/);
});

console.log('Cinema King automated smoke tests completed.');
