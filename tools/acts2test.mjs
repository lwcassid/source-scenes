// acts2test.mjs — BIRTH OF A TEMPLE, Sep 29: each act is a host with its layers
// (part296), and SRC-58.4's WIND (part295).
//   node tools/acts2test.mjs [baseUrl] [--shots]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
// --shots writes 1920x1200 frames to scratchshots/acts2_*.png.
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
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1200 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
const open = async hash => {
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html#' + hash, { waitUntil: 'load' });
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { if (typeof midi !== 'undefined' && !midi.access) midi.access = { inputs: new Map(), outputs: new Map() }; });
  await pg.waitForTimeout(400);
};
const mix = () => pg.evaluate(() => (window.MIX && MIX.state) ? MIX.state() : null);
const fps = ms => pg.evaluate(ms => new Promise(res => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - t0) / 1000))); };
  requestAnimationFrame(tick);
}), ms);
const frame = async (name, faders, macros, hands) => {
  await pg.evaluate(({ faders, macros, hands }) => {
    document.getElementById('overlay').classList.add('fs', 'zen');
    faders.forEach((v, i) => MIX.set(i, v));
    (macros || []).forEach((v, i) => { if (v !== null) MIX.macro(i, v); });
    setChan('L', hands[0]); setChan('R', hands[1]);
  }, { faders, macros, hands: hands || [0.6, 0.6] });
  await pg.waitForTimeout(3500);
  const f = await fps(2000);
  if (SHOTS) { fs.mkdirSync('scratchshots', { recursive: true }); await pg.screenshot({ path: 'scratchshots/acts2_' + name + '.png' }); }
  await pg.evaluate(() => document.getElementById('overlay').classList.remove('fs', 'zen'));
  const s = await mix();
  console.log('         ' + name + ': ' + f + ' fps · load ' + s.load + ' · live ' + s.live.join(','));
  return { f, s };
};

console.log('THE SET is unchanged: families SRC-66, 68, 64, and each opens its new host');
await open('set=BIRTH+OF+A+TEMPLE');
const set = await pg.evaluate(() => ({ ids: QUEUE.shared.slice(),
  latest: ['SRC-66', 'SRC-68', 'SRC-64'].map(f => { const v = PIECES.filter(p => (p.family || p.id) === f); return v[v.length - 1].id + '|' + v[v.length - 1].title; }) }));
ok('set order SRC-66, SRC-68, SRC-64', set.ids.join() === 'SRC-66,SRC-68,SRC-64', set.ids);
ok('latest of each family is titled as its act (a later round, e.g. a bend on Act 1, may sit on top)', set.latest.map(x => x.split('|')[1]).join() === 'Act 1 · Expectation and Launch,Act 2 · The Depths,Act 3 · The Collective Witnesses', set.latest);

const ACTS = [
  { id: 'SRC-66.10', layers: 'SRC-66.9,SRC-59.3,SRC-80.4', macros: '', shots: 1 },
  { id: 'SRC-68.8', layers: 'SRC-68.7,SRC-70.4,SRC-58.5,SRC-79,SRC-59.3', macros: 'DIRECTION,WIND,DIVIDE,INSIDE', shots: 0 },
  { id: 'SRC-64.5', layers: 'SRC-58.5,SRC-60.2,SRC-61.2,SRC-66.9', macros: 'DIRECTION,WIND', shots: 0 },
];
const report = {};
for (const A of ACTS) {
  console.log(A.id);
  await open('scene=' + A.id);
  const s = await mix();
  const ids = await pg.evaluate(() => focus.P.state.L.slice(0, focus.P.state.nL).map(l => l.id).join());
  ok('layers in his order: ' + A.layers, ids === A.layers, ids);
  ok('macros: ' + (A.macros || 'none'), s.macroNames.join() === A.macros, s.macroNames);
  ok('shots: ' + A.shots, (s.shots || []).length === A.shots, s.shots);
  ok('fader 1 opens at full, the rest down', s.want[0] === 1 && s.want.slice(1).every(v => v === 0), s.want);
  await pg.evaluate(() => { MIDIRIG.add('twister'); TWIST.autoMap(); });
  const lay = await pg.evaluate(() => TWIST.slots.map(S => S.turn + '/' + S.push));
  const n = A.layers.split(',').length;
  ok('AUTO-MAP: ' + n + ' faders on knobs 1-' + n, lay.slice(0, n).every((x, i) => x === 'fader' + i + '/solo' + i), lay);
  if (A.macros) ok('AUTO-MAP: DIRECTION on 13, WIND on 14', lay[12].startsWith('macro0') && lay[13].startsWith('macro1'), lay);
  // every layer alone, then each adjacent pair at full: the fps a crossfade costs
  const r = [];
  const L = n;
  for (let i = 0; i < L; i++) r.push(await frame(A.id + '_L' + (i + 1), Array.from({ length: L }, (_, j) => j === i ? 1 : 0)));
  for (let i = 0; i + 1 < L; i++) r.push(await frame(A.id + '_pair' + (i + 1) + (i + 2), Array.from({ length: L }, (_, j) => (j === i || j === i + 1) ? 1 : 0)));
  report[A.id] = r.map(x => x.f);
}

console.log('SRC-58.5 WIND: the rain leans with the knob, and still air is 58.3');
await open('scene=SRC-64.5');
const w = await pg.evaluate(async () => {
  const sub = focus.P.state.insts[0], st = sub.state;
  MIX.macro(1, 1); await new Promise(r => setTimeout(r, 2500));
  const right = st.vx; MIX.macro(1, 0); await new Promise(r => setTimeout(r, 2500));
  const left = st.vx; MIX.macro(1, 0.5); await new Promise(r => setTimeout(r, 5000));   // the wind glides (~1.6/s), it does not jump
  return { right, left, still: st.vx };
});
ok('WIND 1 blows right, 0 blows left, 0.5 is still', w.right > 0.01 && w.left < -0.01 && Math.abs(w.still) < 0.002, w);
if (SHOTS) {
  await frame('SRC-64.5_wind_right', [1, 0, 0, 0], [1, 1], [0.7, 0.7]);
  await open('scene=SRC-68.8');
  await frame('SRC-68.8_rain_down_wind_left', [0, 0, 1, 0, 0], [0, 0.1, null, null], [0.7, 0.7]);
}
await open('scene=SRC-58.5');
const alone = await pg.evaluate(async () => { await new Promise(r => setTimeout(r, 1500)); return focus.P.state.vx; });
ok('58.5 standalone: no wind', Math.abs(alone) < 1e-9, alone);

ok('zero page errors', errs.length === 0, errs.slice(0, 5));
console.log('FPS (layers alone, then adjacent pairs):', JSON.stringify(report));
await b.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
process.exit(fails ? 1 : 0);
