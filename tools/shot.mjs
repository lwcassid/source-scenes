// Sighted-iteration harness for Night Circuit.
// Usage: node tools/shot.mjs <pieceId> <outPrefix> [driveSpec]
//   driveSpec: comma list of "label:L:R:pres:act:ms" states to capture.
//   L/R are hand values (0..1, reach OUTWARD = higher = 1). act -1 = leave.
// Renders night-circuit-preview.html headless (swiftshader) and screenshots
// each state after settling. Re-issues hand values every 500ms (live decays).
// SHOOTS THE SHOW FRAME: 1920x1200 / 16:10, the WUXGA render both PT-VMZ50s
// get. `?proj` pins the canvas to exactly that, so composition AND density
// (areaScale) match the wall. PROJ=0 in the env falls back to a plain window.
import { chromium } from 'playwright-core';
import path from 'path';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pieceId = process.argv[2] || 'SRC-18.16';
const outPrefix = process.argv[3] || 'v16';
const spec = (process.argv[4] || 'full:0:0:1:0:3500').split(',');
const PROJ = process.env.PROJ !== '0';
const fileUrl = 'file://' + path.resolve('night-circuit-preview.html') + (PROJ ? '?proj' : '?win');

const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
         '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage(PROJ
  ? { viewport: { width: 1920, height: 1200 } }   // 1:1 with the projector output
  : { viewport: { width: 1280, height: 760 } });
page.on('pageerror', e => console.log('PAGEERR:', e.message));
await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500); // let three + GLBs settle

const idx = await page.evaluate((id) => {
  // fs+zen = SHOWTIME: the stage owns every pixel and the chrome is invisible
  document.getElementById('overlay').classList.add('fs', 'zen');
  const i = (typeof PIECES !== 'undefined') ? PIECES.findIndex(p => p.id === id) : -1;
  if (i >= 0) openFocus(i);
  return i;
}, pieceId);
console.log('piece index', idx);
if (idx < 0) { console.log('PIECE NOT FOUND'); await browser.close(); process.exit(1); }
await page.waitForTimeout(1500);

for (const st of spec) {
  const [label, L, R, pres, act, ms] = st.split(':');
  await page.evaluate(({ L, R, pres, act }) => {
    const def = (focus.idx >= 0) ? PIECES[focus.idx] : null;
    if (act >= 0 && def && def.setAct) { def.setAct(focus.P, act|0); if (focus.P.state) { focus.P.state.act = act|0; focus.P.state.pending = null; focus.P.state.trans = 0; } }
    window.__drive = { L: +L, R: +R, pres: +pres };
    clearInterval(window.__di);
    window.__di = setInterval(() => {
      const d = window.__drive; if (!d) return;
      setChan('L', d.L); setChan('R', d.R);
      if (focus.P && focus.P.state) focus.P.state.pres = d.pres;
    }, 300);
  }, { L, R, pres, act: act === undefined ? -1 : +act });
  await page.waitForTimeout(+ms || 3000);
  const out = `/home/user/source-scenes/scratchshots/${outPrefix}_${label}.png`;
  await page.screenshot({ path: out });
  console.log('shot', out);
}
await browser.close();
