// Sighted-iteration harness for AUDIO-IN scenes (reg({audioIn:true})).
// tools/shot.mjs can only drive the hands; an audio-reactive scene's whole
// instrument is inp.audio, so its states were previously unshootable and
// every round hand-rolled a throwaway driver. This is that driver, kept.
//
// Usage: node tools/shotaudio.mjs <pieceId> <outPrefix> [stateSpec]
//   stateSpec: comma list of
//     label:L:R:level:bass:mid:treble:bpm:settleMs:shotOffsetMs
//   L/R are REACH (what setChan takes: 1 = full extension, 0 = at the source).
//   bpm 0 = no kick; otherwise setAudioKick() fires at that tempo, and the
//   shot is taken shotOffsetMs after a hit — so 40 catches the swell at its
//   peak and 380 catches the picture between beats.
//
// Drives the documented test hooks (setAudioIn / setAudioKick), the same ones
// playtest.js uses, so a sandbox with no microphone still produces the real
// states. SHOOTS THE SHOW FRAME (1920x1200); PROJ=0 opts out.
import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pieceId = process.argv[2] || 'SRC-46.2';
const outPrefix = process.argv[3] || 'aud';
const PROJ = process.env.PROJ !== '0';

// a plausible track: silence, a quiet intro, a groove, the groove ON the kick,
// a drop at full drive, a treble-heavy section, the same drop at the drive
// floor (what the left hand is FOR), and a cool anchor.
const DEFAULT = [
  'silence:0.6:0.5:0:0:0:0:0:4500:0',
  'quiet:0.6:0.5:0.18:0.22:0.14:0.08:100:6000:300',
  'groove:0.6:0.5:0.45:0.55:0.40:0.28:128:7000:380',
  'hit:0.6:0.5:0.45:0.55:0.40:0.28:128:7000:40',
  'drop:1:0.5:0.80:0.92:0.60:0.35:128:7000:60',
  'bright:0.6:0.5:0.50:0.16:0.45:0.80:128:7000:380',
  'lowdrive:0:0.5:0.80:0.92:0.60:0.35:128:7000:60',
  'coolanchor:0.6:1:0.50:0.30:0.45:0.40:128:7000:380'
].join(',');
const spec = (process.argv[4] || DEFAULT).split(',');

const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
    '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage(PROJ
  ? { viewport: { width: 1920, height: 1200 } }
  : { viewport: { width: 1280, height: 760 } });
page.on('pageerror', e => console.log('PAGEERR:', e.message));
await page.goto('file://' + path.resolve('night-circuit-preview.html') + (PROJ ? '?proj' : '?win'),
  { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

const idx = await page.evaluate((id) => {
  document.getElementById('overlay').classList.add('fs', 'zen');
  const i = (typeof PIECES !== 'undefined') ? PIECES.findIndex(p => p.id === id) : -1;
  if (i >= 0) openFocus(i);
  return i;
}, pieceId);
console.log('piece index', idx);
if (idx < 0) { console.log('PIECE NOT FOUND'); await browser.close(); process.exit(1); }
await page.waitForTimeout(1500);

for (const st of spec) {
  const [label, L, R, level, bass, mid, treble, bpm, settle, off] = st.split(':');
  await page.evaluate(({ L, R, level, bass, mid, treble, bpm }) => {
    clearInterval(window.__di); clearInterval(window.__ki);
    // re-issue every 80ms: live hand channels decay, and AUDIOIN's test
    // override has to be refreshed the same way setChan does
    window.__di = setInterval(() => {
      setChan('L', +L); setChan('R', +R);
      setAudioIn({ level: +level, bass: +bass, mid: +mid, treble: +treble, onset: 0, pan: 0 });
    }, 80);
    if (+bpm > 0) window.__ki = setInterval(() => setAudioKick(0.85), 60000 / +bpm);
  }, { L, R, level, bass, mid, treble, bpm });
  await page.waitForTimeout(+settle || 6000);
  if (+bpm > 0) {
    // land the shot a known distance after a hit, so "on the kick" and
    // "between beats" are both reproducible states rather than luck
    await page.evaluate(() => setAudioKick(0.85));
    await page.waitForTimeout(Math.max(40, +off || 0));
  }
  fs.mkdirSync('scratchshots', { recursive: true });
  const out = `scratchshots/${outPrefix}_${label}.png`;
  await page.screenshot({ path: out });
  console.log('shot', out);
}
await browser.close();
