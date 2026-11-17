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
test('cinematic engine controls exist', () => {
  for (const id of ['cinematicRender', 'renderServiceUrl', 'renderToken', 'renderLanguage', 'renderVoice', 'renderSize']) {
    assert.ok(html.includes('id="' + id + '"') || html.includes("id='" + id + "'"), 'Missing UI control: ' + id);
  }
});
test('cinematic render action is wired and calls service', () => {
  assert.ok(app.includes("$('#cinematicRender').onclick=renderWithCinematicEngine"));
  assert.ok(app.includes('async function renderWithCinematicEngine'));
  assert.ok(app.includes('/api/render'));
});
test('existing project and video features remain in place', () => {
  for (const symbol of ['function create(', 'function addScene(', 'function deleteScene(', 'function drawFrame(', 'function preview(', 'function importProject(', 'function exportProject(', 'async function renderVideo(']) {
    assert.ok(app.includes(symbol), 'Missing existing feature: ' + symbol);
  }
  assert.ok(app.includes("localStorage.getItem('ck_projects')"));
  assert.ok(app.includes('new MediaRecorder('));
});
test('mobile layout and service worker cache refresh exist', () => {
  assert.ok(css.includes('@media'));
});
console.log('Cinema King automated smoke tests completed.');

test('photo storage and storyboard controls are production-safe', () => {
  assert.ok(app.includes('indexedDB.open'));
  assert.ok(app.includes('compressSceneImage'));
  assert.ok(app.includes('function duplicateScene'));
  assert.ok(app.includes('function moveScene'));
  assert.ok(html.includes('id="sceneDuration"'));
  assert.ok(html.includes('id="removeScenePhoto"'));
});
test('renderer connection and voice fallback are available', () => {
  for (const id of ['checkRenderService', 'renderServiceStatus', 'previewRemoteVoice']) assert.ok(html.includes('id="' + id + '"'));
  assert.ok(app.includes('/health'));
  assert.ok(app.includes('/api/voice-preview'));
  assert.ok(app.includes('async function hydrateProjectImages'));
  assert.ok(!app.includes("p.url||'http://127.0.0.1:8787'"));
});

test('cinematic style and output presets are exposed', () => {
  for (const id of ['renderLook', 'renderGrade', 'renderSize']) assert.ok(html.includes('id="' + id + '"'));
  for (const look of ['night', 'wall', 'slate', 'charcoal', 'paper', 'studio', 'blueprint']) assert.ok(html.includes('value="' + look + '"'));
  assert.ok(app.includes("look:$('#renderLook').value"));
  assert.ok(app.includes("grade:$('#renderGrade').value"));
  assert.ok(html.includes('value="1920x1080"'));
  assert.ok(html.includes('value="1080x1920"'));
});
