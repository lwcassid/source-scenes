// Render V17 camera + music-line options.
// spec entries: label:camMode:L:R:act:ms
import { chromium } from 'playwright-core';
import path from 'path';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const outPrefix = process.argv[2] || 'cam';
const spec = (process.argv[3] || 'chase:0:0:0:0:9000').split(',');
const b = await chromium.launch({ executablePath: EXE, headless: true, args: ['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader','--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1280, height: 760 } });
p.on('pageerror', e => console.log('PAGEERR:', e.message));
await p.goto('file://' + path.resolve('night-circuit-preview.html'), { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2500);
await p.evaluate(() => { const i = PIECES.findIndex(x => x.id === 'SRC-18.18'); openFocus(i); });
await p.waitForTimeout(3200);
for (const st of spec) {
  const [label, cam, L, R, act, ms] = st.split(':');
  await p.evaluate(({ cam, L, R, act }) => {
    const def = PIECES[focus.idx];
    def.setAct(focus.P, act|0); focus.P.state.act = act|0; focus.P.state.pending = null; focus.P.state.trans = 0;
    clearInterval(window.__di);
    window.__di = setInterval(() => { setChan('L', +L); setChan('R', +R); const s = focus.P.state; s.pres = 1; s.camMode = cam|0; }, 200);
  }, { cam, L, R, act });
  await p.waitForTimeout(+ms || 9000);
  const out = `/home/user/source-scenes/scratchshots/${outPrefix}_${label}.png`;
  await p.screenshot({ path: out });
  console.log('shot', out);
}
await b.close();
