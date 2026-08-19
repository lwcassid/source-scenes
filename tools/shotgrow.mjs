// Sighted-iteration harness for scenes whose state ACCUMULATES over time.
// Usage: node tools/shotgrow.mjs <pieceId> <outPrefix> <spec>
//   spec: comma list of "label:L:R:pres:age:ms" — age -1 leaves it alone,
//   0..1 forces P.state.age so an era can be reached without playing for
//   two minutes. Otherwise identical to tools/shot.mjs: show frame, 1920x1200.
import { chromium } from 'playwright-core';
import path from 'path';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const pieceId = process.argv[2] || 'SRC-44';
const pfx = process.argv[3] || 'gf';
const spec = (process.argv[4] || 'idle:0:0:0:-1:5000').split(',');
const fileUrl = 'file://' + path.resolve('night-circuit-preview.html') + '?proj';
const browser = await chromium.launch({ executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required','--use-gl=swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
page.on('pageerror', e => console.log('PAGEERR:', e.message));
page.on('console', m => { const t=m.text(); if (/error|Error|WARN|shader/i.test(t)) console.log('CONSOLE:', t.slice(0,300)); });
await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
const idx = await page.evaluate((id) => {
  document.getElementById('overlay').classList.add('fs','zen');
  const i = PIECES.findIndex(p => p.id === id); if (i>=0) openFocus(i); return i;
}, pieceId);
console.log('piece index', idx);
if (idx < 0) { await browser.close(); process.exit(1); }
await page.waitForTimeout(1200);
for (const st of spec) {
  const [label, L, R, pres, age, ms] = st.split(':');
  await page.evaluate(({L,R,pres,age}) => {
    window.__drive = { L:+L, R:+R, pres:+pres, age:+age };
    clearInterval(window.__di);
    window.__di = setInterval(() => {
      const d = window.__drive; if (!d) return;
      setChan('L', d.L); setChan('R', d.R);
      if (focus.P && focus.P.state) { focus.P.state.pres = d.pres; if (d.age >= 0) focus.P.state.age = d.age; }
    }, 250);
  }, { L, R, pres, age: age===undefined?-1:+age });
  await page.waitForTimeout(+ms || 4000);
  const out = `/home/user/source-scenes/scratchshots/${pfx}_${label}.png`;
  await page.screenshot({ path: out });
  const dbg = await page.evaluate(() => { const s=focus.P&&focus.P.state; return s?{age:+s.age.toFixed(3),era:s.era,org:s.org.length,tips:s.tips.length,blooms:s.org.filter(o=>o.bloom&&!o.dead).length}:null; });
  console.log('shot', label, JSON.stringify(dbg));
}
await browser.close();
