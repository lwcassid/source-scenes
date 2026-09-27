// palshots.mjs — SRC-73 in metals: each generated layer of Act I soloed, with
// all three bands on GOLD1, COPPER1, SILVER1 in turn, and the act as
// declared. 1920x1200 frames in scratchshots/palshot_*.png, plus fps with the
// two heavies (Eclipse + Passage) and the Point all at full.
//   node tools/palshots.mjs [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'fs';

const BASE = process.argv.slice(2).find(a => !a.startsWith('--')) || 'http://127.0.0.1:8765';
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1200 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('about:blank');
await pg.goto(BASE + '/index.html', { waitUntil: 'load' });
await pg.evaluate(() => localStorage.removeItem('srcPalettes'));
await pg.goto('about:blank');
await pg.goto(BASE + '/index.html#scene=SRC-73', { waitUntil: 'load' });
await pg.waitForTimeout(3000);
await pg.evaluate(() => { document.getElementById('overlay').classList.add('fs', 'zen'); });
fs.mkdirSync('scratchshots', { recursive: true });

const LAYERS = [[0, 'point', [0.7]], [1, 'circle', []], [2, 'passage', []], [5, 'eclipse', []]];
const METALS = ['DECLARED', 'GOLD1', 'COPPER1', 'SILVER1'];
const fps = ms => pg.evaluate(ms => new Promise(res => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - t0) / 1000))); };
  requestAnimationFrame(tick);
}), ms);

for (const [i, name, macros] of LAYERS) {
  for (const m of METALS) {
    await pg.evaluate(({ i, m, macros }) => {
      for (let k = 0; k < 6; k++) MIX.set(k, k === i ? 1 : 0);
      macros.forEach((v, k) => MIX.macro(k, v));
      PAL.set('reset');
      if (m !== 'DECLARED') for (let j = 0; j < 3; j++) PAL.set('preset', j, m);
      setChan('L', 0.6); setChan('R', 0.6);
      if (typeof setAudioIn === 'function') setAudioIn({ level: 0.35, bass: 0.4, mid: 0.3, treble: 0.3, onset: 0, pan: 0 });
    }, { i, m, macros });
    await pg.waitForTimeout(name === 'circle' ? 6000 : 3000);
    await pg.screenshot({ path: `scratchshots/palshot_${name}_${m}.png` });
    console.log('  shot', name, m);
  }
}
// the act as Edson will open it on Thursday: the declared palette, the four layers up
await pg.evaluate(() => { PAL.set('reset'); [1, 0.8, 0.7, 0, 0, 0.9].forEach((v, k) => MIX.set(k, v)); MIX.macro(0, 0.8); setChan('L', 0.6); setChan('R', 0.6); });
await pg.waitForTimeout(4000);
await pg.screenshot({ path: 'scratchshots/palshot_act_DECLARED.png' });
const st = await pg.evaluate(() => MIX.state());
console.log('  act I live layers', st.live.join(','), 'load', st.load);
// fps: the two heavies and the Point at full, the Circle down
await pg.evaluate(() => { [1, 0, 1, 0, 0, 1].forEach((v, k) => MIX.set(k, v)); });
await pg.waitForTimeout(2500);
console.log('  fps  Point + Passage + Eclipse at full (58.3 + 57.2):', await fps(4000));
await pg.evaluate(() => { for (let j = 0; j < 3; j++) PAL.set('preset', j, 'next'); });
console.log('  fps  …while the palette changes (one preset step, then still):', await fps(3000));
await pg.evaluate(() => PAL.forget('SRC-73'));
console.log(errs.length ? '  page errors: ' + errs.slice(0, 3).join(' | ') : '  no page errors');
await b.close();
