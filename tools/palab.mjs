// palab.mjs — PALETTE A/B: does a version that READS the palette look like the
// version it came from, standalone? Builds both instances the way the mixer
// does (same seed, mulberry32, the same fixed steps and hands), draws one
// frame each on its own 1920x1200 canvas and diffs the pixels.
//   node tools/palab.mjs [baseUrl] [--shots]
// Reports mean |Δ| per channel (0..255) and the share of pixels off by > 8.
import { chromium } from 'playwright-core';
import fs from 'fs';

const args = process.argv.slice(2);
const BASE = args.find(a => !a.startsWith('--')) || 'http://127.0.0.1:8765';
const SHOTS = args.includes('--shots');
const PAIRS = [['SRC-56.2', 'SRC-56.3'], ['SRC-57', 'SRC-57.2'], ['SRC-58.2', 'SRC-58.3'], ['SRC-71', 'SRC-71.2']];
const LIMIT = { mean: 1.5, off: 0.02 };     // what "unchanged" means here
let fails = 0;

const b = await chromium.launch({ channel: 'chrome', args: ['--mute-audio'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto(BASE + '/index.html', { waitUntil: 'load' });
await pg.waitForTimeout(2500);
await pg.evaluate(() => localStorage.removeItem('srcPalettes'));

for (const [A, B] of PAIRS) {
  const r = await pg.evaluate(async ({ A, B, SHOTS }) => {
    const W = 1920, H = 1200;
    const frame = id => {
      const def = PIECES.find(p => p.id === id);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const g = cv.getContext('2d');
      const P = { def, canvas: cv, g, w: W, h: H, state: {}, seed: 12345, focused: true, visible: true, rand: null, hosted: false, ping() {} };
      P.rand = mulberry32(P.seed);
      const inp = { L: 0.62, R: 0.58, audio: { level: 0.3, bass: 0.3, mid: 0.3, treble: 0.3, onset: 0, live: false } };
      def.init(P);
      let t = 10;
      for (let i = 0; i < 90; i++) { t += 1 / 60; def.step(P, 1 / 60, t, inp); }
      g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
      def.draw(P, g, W, H, t, inp);
      return { cv, px: g.getImageData(0, 0, W, H).data };
    };
    const a = frame(A), bb = frame(B);
    let sum = 0, off = 0; const n = W * H;
    for (let i = 0; i < a.px.length; i += 4) {
      const d = Math.abs(a.px[i] - bb.px[i]) + Math.abs(a.px[i + 1] - bb.px[i + 1]) + Math.abs(a.px[i + 2] - bb.px[i + 2]);
      sum += d / 3; if (d / 3 > 8) off++;
    }
    let lit = 0; for (let i = 0; i < a.px.length; i += 4) if (a.px[i] + a.px[i + 1] + a.px[i + 2] > 24) lit++;
    return { mean: +(sum / n).toFixed(3), off: +(off / n).toFixed(4), lit: +(lit / n).toFixed(3),
             shots: SHOTS ? [a.cv.toDataURL('image/png'), bb.cv.toDataURL('image/png')] : null };
  }, { A, B, SHOTS });
  const pass = r.mean <= LIMIT.mean && r.off <= LIMIT.off && r.lit > 0.001;
  console.log((pass ? '  ok   ' : '  FAIL ') + `${A} → ${B}: mean |Δ| ${r.mean} · ${(r.off * 100).toFixed(2)}% of pixels off by > 8 · ${(r.lit * 100).toFixed(1)}% of the frame lit`);
  if (!pass) fails++;
  if (r.shots) {
    fs.mkdirSync('scratchshots', { recursive: true });
    r.shots.forEach((u, i) => fs.writeFileSync(`scratchshots/palab_${[A, B][i]}.png`, Buffer.from(u.split(',')[1], 'base64')));
  }
}
if (errs.length) { console.log('  FAIL page errors', errs.slice(0, 3)); fails++; }
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
process.exit(fails ? 1 : 0);
