// Sighted-iteration harness for STRUCTURAL audio states (build/drop, ADR-0009
// Layer 6). shotaudio.mjs drives bands and kicks; this drives the ARC a DJ
// set actually has — groove → build (bass withheld, build rising) → THE DROP
// (setAudioDrop) → the jam window — and shoots each phase, so a scene's
// drop payoff (Event Horizon's stargate, Chladni's violet unlock, White
// Study's pink window) is a reproducible screenshot instead of luck.
//
// Usage: CHROMIUM=... node tools/shotdrop.mjs <pieceId> <outPrefix>
// Shots: <prefix>_groove / _build / _drop1s / _jam8s / _after
import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pieceId = process.argv[2];
const outPrefix = process.argv[3] || 'drop';
if (!pieceId) { console.error('usage: node tools/shotdrop.mjs <pieceId> <outPrefix>'); process.exit(1); }

const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
    '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
page.on('pageerror', e => console.log('PAGEERR:', e.message));
await page.goto('file://' + path.resolve('night-circuit-preview.html') + '?proj',
  { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

const idx = await page.evaluate((id) => {
  document.getElementById('overlay').classList.add('fs', 'zen');
  const i = (typeof PIECES !== 'undefined') ? PIECES.findIndex(p => p.id === id) : -1;
  if (i >= 0) openFocus(i);
  return i;
}, pieceId);
if (idx < 0) { console.error('piece not found: ' + pieceId); await browser.close(); process.exit(1); }
console.log('piece index', idx);
await page.waitForTimeout(1200);

fs.mkdirSync('scratchshots', { recursive: true });
const shot = async name => {
  const p = 'scratchshots/' + outPrefix + '_' + name + '.png';
  await page.screenshot({ path: p });
  console.log('shot', p);
};

// keepalive: re-assert hands + audio every 1.5s, kicks at 128 BPM when on
// HANDS=0 keeps the pedestal empty — the audio-only picture (a scene whose
// hands OWN a control, like Chladni's modes, can't show its audio path
// while the harness parks live hands on it)
const HANDS = process.env.HANDS !== '0';
const phase = async (ms, vals, kicks) => {
  const t0 = Date.now();
  let nextKick = 0;
  while (Date.now() - t0 < ms) {
    await page.evaluate((v) => {
      if (v.hands) { setChan('L', v.L); setChan('R', v.R); }
      setAudioIn(v.audio);
    }, { ...vals, hands: HANDS });
    if (kicks && Date.now() >= nextKick) {
      await page.evaluate(() => setAudioKick(0.85));
      nextKick = Date.now() + 469;
    }
    await page.waitForTimeout(120);
  }
};

const GROOVE = { L: 0.4, R: 0.4, audio: { level: 0.55, bass: 0.62, mid: 0.45, treble: 0.35, onset: 0, pan: 0 } };
const BUILD = { L: 0.4, R: 0.4, audio: { level: 0.72, bass: 0.10, mid: 0.62, treble: 0.75, onset: 0, pan: 0, build: 0.8 } };
const JAM = { L: 0.35, R: 0.35, audio: { level: 0.85, bass: 0.9, mid: 0.6, treble: 0.5, onset: 0, pan: 0 } };

await phase(9000, GROOVE, true);
await shot('groove');
await phase(8000, BUILD, false);
await shot('build');
await page.evaluate(() => setAudioDrop(0.9));
await phase(1000, JAM, true);
await shot('drop1s');
await phase(7000, JAM, true);
await shot('jam8s');
// signal gone: everything must decay home
await phase(6000, { L: 0.9, R: 0.9, audio: { level: 0, bass: 0, mid: 0, treble: 0, onset: 0, pan: 0, live: false } }, false);
await shot('after');

const hud = await page.evaluate(() => {
  const P = (typeof focus !== 'undefined' && focus.P) ? focus.P : null;
  if (!P || !P.state) return null;
  const s = P.state;
  return { jam: s.jam, chg: s.chg, beatOn: s.beatOn, win: !!s.win, aPres: s.aPres, presV: s.presV, pump: s.pump };
});
console.log('state after run:', JSON.stringify(hud));
await browser.close();
