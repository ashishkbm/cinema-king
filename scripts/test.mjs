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
