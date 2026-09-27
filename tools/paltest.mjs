// paltest.mjs — PALETTE (partcore_palette.js): the declared palette reads
// back, a write bumps ver and the tables, it persists across a reload, RESET
// comes back, a host's layers see the host's palette, a scene with no
// declaration is untouched, and the panel drives the wall.
//   node tools/paltest.mjs [baseUrl] [--shots]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
import { chromium } from 'playwright-core';
import fs from 'fs';

const args = process.argv.slice(2);
const BASE = args.find(a => !a.startsWith('--')) || 'http://127.0.0.1:8765';
const SHOTS = args.includes('--shots');
let fails = 0;
const ok = (name, cond, got) => {
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond ? '' : '  got: ' + JSON.stringify(got)));
  if (!cond) fails++;
};

const b = await chromium.launch({ channel: 'chrome',
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const pg = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
const open = async hash => {
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html' + (hash ? '#' + hash : ''), { waitUntil: 'load' });
  await pg.waitForTimeout(2500);
};

console.log('CORE');
await open('');
await pg.evaluate(() => localStorage.removeItem('srcPalettes'));
await open('scene=SRC-73');
let st = await pg.evaluate(() => PAL.state());
ok('SRC-73 declares its palette: 5 generators, 3 bands of 10', st && st.c.length === 5 && st.g.length === 3 && st.g.every(r => r.length === 10), st);
ok('c0 is the temple gold', st && st.c[0] === '#d4af37', st && st.c);
ok('g0 is GOLD1 as measured', st && st.g[0][3] === '#f9f9c2' && st.g[0][9] === '#6d5432', st && st.g[0]);
ok('g0 highlight is its brightest swatch (index 3)', st && st.hl[0] === 0.33, st && st.hl);
const hosted = await pg.evaluate(() => { const s = MIX.P().state; return s.insts.every(i => i.palette === s.pal) && !!s.pal; });
ok('every hosted layer reads the host\'s palette', hosted, hosted);
const v0 = st.ver;
const changed = await pg.evaluate(() => PAL.set('c', 0, '#ff0000'));
st = await pg.evaluate(() => PAL.state());
ok('PAL.set changes the slot and bumps ver', changed && st.c[0] === '#ff0000' && st.ver === v0 + 1, st);
const along = await pg.evaluate(() => { const P = MIX.P().state.insts[0]; return [PAL.along(P, 0, 1).map(Math.round), PAL.along(P, 0, 0).map(Math.round)]; });
ok('along(u=1) is the highlight, along(u=0) the dark end', along[0].join() === '249,249,194' && along[1].join() === '109,84,50', along);
await pg.evaluate(() => PAL.set('hue', 2, 0.75));
st = await pg.evaluate(() => PAL.state());
ok('hue2 at 0.75 rotates COPPER a quarter turn', st.c[2] !== '#d37b50' && st.hue[2] === 0.75, st.c);
await pg.evaluate(() => PAL.set('preset', 1, 'ROSEGOLD2'));
st = await pg.evaluate(() => PAL.state());
ok('a preset replaces one band', st.g[1][0] === '#ab7672', st.g[1]);
const same = await pg.evaluate(() => { const s = PAL.snap(); return PAL.set('load', s); });
ok('loading the palette it already has changes nothing (no ver bump)', same === false, same);
const u = await pg.evaluate(() => { const U = PAL.uniforms(MIX.P().state.insts[0]); return [U.uPalC.length, U.uPalG.length, U.uPalH.length]; });
ok('uniforms: 5 + 30 vec3, 3 highlights', u.join() === '15,90,3', u);
await pg.waitForTimeout(600);

console.log('PERSISTENCE');
await open('scene=SRC-73');
st = await pg.evaluate(() => PAL.state());
ok('the palette holds across a reload', st && st.c[0] === '#ff0000' && st.g[1][0] === '#ab7672' && st.hue[2] === 0.75, st);
await pg.evaluate(() => PAL.set('reset'));
st = await pg.evaluate(() => PAL.state());
ok('RESET brings the declared palette back, knobs to the middle', st.c[0] === '#d4af37' && st.g[1][0] === '#b7603f' && st.hue.every(v => v === 0.5), st);
await pg.evaluate(() => { PAL.set('preset', 2, 'SILVER3'); PAL.set('default', 2); PAL.set('preset', 2, 'SILVER2'); PAL.set('reset'); });
st = await pg.evaluate(() => PAL.state());
ok('SET DEFAULT: RESET comes back to the adopted band', st.g[2][0] === '#656569', st.g[2]);
await pg.evaluate(() => { PAL.forget('SRC-73'); });
await pg.waitForTimeout(400);

console.log('PROTECTION: a scene that is not ours');
await open('scene=SRC-28');
const foreign = await pg.evaluate(() => ({ act: PAL.active(), set: PAL.set('c', 0, '#00ff00'), get: PAL.get('hue0'),
  panel: (() => { const g = document.getElementById('paletteGroup'); return g ? getComputedStyle(g).display : 'absent'; })(),
  fb: PAL.c({ def: {} }, 0, [1, 2, 3]) }));
ok('no active palette, PAL.set is a no-op, the panel is hidden', foreign.act === null && foreign.set === false && foreign.get === 0 && (foreign.panel === 'none' || foreign.panel === 'absent'), foreign);
ok('a scene with no declaration reads its fallback unchanged', foreign.fb.join() === '1,2,3', foreign.fb);
const f2 = await pg.evaluate(() => { const st = localStorage.getItem('srcPalettes'); return st; });
ok('nothing was stored for it', !f2 || f2.indexOf('SRC-28') < 0, f2);

console.log('THE PANEL drives the wall');
await open('scene=SRC-73');
await pg.waitForTimeout(500);
const panel = await pg.evaluate(() => { const g = document.getElementById('paletteGroup'); return g ? { d: getComputedStyle(g).display, dots: g.querySelectorAll('.paldot').length } : null; });
ok('the panel is shown with five dots', panel && panel.d !== 'none' && panel.dots === 5, panel);
// click the first dot → the hidden picker gets its value; fire an input as the picker would
const via = await pg.evaluate(async () => {
  const g = document.getElementById('paletteGroup');
  const v0 = PAL.state().ver;
  const inp = g.querySelector('input[type=color]');
  const orig = inp.showPicker; inp.showPicker = () => {};          // headless: no native dialog
  g.querySelectorAll('.paldot')[0].click();
  inp.value = '#00ff00'; inp.dispatchEvent(new Event('input'));
  inp.showPicker = orig;
  return { v0, v1: PAL.state().ver, c0: PAL.state().c[0] };
});
ok('a panel input goes through PAL.set and bumps ver', via.v1 === via.v0 + 1 && via.c0 === '#00ff00', via);
await pg.evaluate(() => PAL.set('reset'));
// THE WALL, not just the state: the Point alone, its centre pixel, before and
// after g0 changes through the panel's own PRESET select
const centre = () => pg.evaluate(() => { const c = document.getElementById('focusCanvas');
  return Array.from(c.getContext('2d').getImageData(c.width >> 1, c.height >> 1, 1, 1).data.slice(0, 3)); });
await pg.evaluate(() => { const n = MIX.count(); for (let k = 0; k < n; k++) MIX.set(k, k === 0 ? 1 : 0); MIX.macro(0, 0.8);
  clearInterval(window.__h); window.__h = setInterval(() => { setChan('L', 0.5); setChan('R', 0.05); }, 100); });   // low heat: the band's dark end, not the white it runs into
await pg.waitForTimeout(2500);
const px0 = await centre();
await pg.evaluate(() => { const sel = document.querySelector('#paletteGroup select'); sel.value = 'COPPER1'; sel.dispatchEvent(new Event('change')); });
await pg.waitForTimeout(1200);
const px1 = await centre();
ok('the panel\'s PRESET on g0 recolours the Point on the wall (centre pixel)', px0.some((v, i) => Math.abs(v - px1[i]) > 6) && px1[2] !== undefined, { px0, px1 });
await pg.evaluate(() => { clearInterval(window.__h); PAL.set('reset'); });

if (SHOTS) {
  fs.mkdirSync('scratchshots', { recursive: true });
  const box = await pg.evaluate(() => { const r = document.getElementById('paletteGroup').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  await pg.screenshot({ path: 'scratchshots/pal_panel.png', clip: box });
  await pg.screenshot({ path: 'scratchshots/pal_scene.png' });
}

ok('no page errors', errs.length === 0, errs.slice(0, 3));
await pg.evaluate(() => PAL.forget('SRC-73'));
await b.close();
console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
process.exit(fails ? 1 : 0);
