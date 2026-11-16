import { existsSync, readFileSync } from 'node:fs';
const required = ['www/index.html','www/app.js','www/style.css','www/sw.js','www/manifest.webmanifest','capacitor.config.json'];
const missing = required.filter(path => !existsSync(path));
if (missing.length) {
  console.error('Missing required files:', missing.join(', '));
  process.exit(1);
}
const html = readFileSync('www/index.html', 'utf8');
const js = readFileSync('www/app.js', 'utf8');
const config = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
if (!html.includes('Cinema King') || !js.includes('function renderVideo') || config.appId !== 'com.cinemaking.king' || config.webDir !== 'www') {
  throw new Error('Cinema King source validation failed');
}
console.log('Cinema King web source validation passed.');
