// Capture timed creature events by forcing state.evtT into the event window.
// Usage: node tools/shotevt.mjs <outPrefix> "<label:act:evtT:L:R>,..."
import { chromium } from 'playwright-core';
import path from 'path';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const outPrefix = process.argv[2] || 'evt';
const spec = (process.argv[3] || 'manta:0:6:0:0').split(',');
const b = await chromium.launch({ executablePath: EXE, headless: true, args: ['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
p.on('pageerror', e => console.log('PAGEERR:', e.message));
await p.goto('file://' + path.resolve('night-circuit-preview.html'), { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const i = PIECES.findIndex(x => x.id === 'SRC-18.16'); openFocus(i); });
await p.waitForTimeout(3500); // let GLBs (manta/crab/bear) load
for (const st of spec) {
  const [label, act, evtT, L, R] = st.split(':');
  await p.evaluate(({ act, evtT, L, R }) => {
    const def = PIECES[focus.idx];
    def.setAct(focus.P, act|0); focus.P.state.act = act|0; focus.P.state.pending = null; focus.P.state.trans = 0;
    clearInterval(window.__di);
    window.__di = setInterval(() => { setChan('L', +L); setChan('R', +R); const s = focus.P.state; s.pres = 1; s.evtT = +evtT; }, 120);
  }, { act, evtT, L, R });
  await p.waitForTimeout(2200);
  const out = `/home/user/source-scenes/scratchshots/${outPrefix}_${label}.png`;
  await p.screenshot({ path: out });
  console.log('shot', out, 'evtT', evtT);
}
await b.close();
