// bot2test.mjs — BIRTH OF A TEMPLE 0.2: the three hosts, the macros, BLACKOUT,
// the MEDIA layers, and the protection rule (nothing of ours changes a scene
// that is not ours).
//   node tools/bot2test.mjs [baseUrl] [--shots]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
// --shots also writes 1920x1200 frames of each act to scratchshots/bot2_*.png.
//
// NOTE: a hash-only page.goto() is a SAME-DOCUMENT navigation and does not
// reload, so every page change here goes via about:blank first.
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
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await chromium.launch({ channel: 'chrome',
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const pg = await b.newPage({ viewport: SHOTS ? { width: 1920, height: 1200 } : { width: 1600, height: 1100 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const open = async hash => {
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html' + (hash ? '#' + hash : ''), { waitUntil: 'load' });
  await pg.waitForTimeout(3000);
  await pg.evaluate(() => { if (typeof midi !== 'undefined' && !midi.access) midi.access = { inputs: new Map(), outputs: new Map() }; });
  await pg.waitForTimeout(400);
};
const scene = id => open('scene=' + id);
const mix = () => pg.evaluate(() => (window.MIX && MIX.state) ? MIX.state() : null);
const shot = async (name, faders, macros, ms) => {
  if (!SHOTS) return;
  await pg.evaluate(({ faders, macros }) => {
    document.getElementById('overlay').classList.add('fs', 'zen');
    faders.forEach((v, i) => MIX.set(i, v));
    (macros || []).forEach((v, i) => MIX.macro(i, v));
    setChan('L', 0.6); setChan('R', 0.6);
  }, { faders, macros });
  await pg.waitForTimeout(ms || 3500);
  fs.mkdirSync('scratchshots', { recursive: true });
  await pg.screenshot({ path: 'scratchshots/bot2_' + name + '.png' });
  await pg.evaluate(() => document.getElementById('overlay').classList.remove('fs', 'zen'));
};
const fps = async (ms) => pg.evaluate(ms => new Promise(res => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n++; if (performance.now() - t0 < ms) requestAnimationFrame(tick); else res(Math.round(n / ((performance.now() - t0) / 1000))); };
  requestAnimationFrame(tick);
}), ms);

console.log('THE SET: BIRTH OF A TEMPLE 0.2 is a shared set of three, in order');
await open('set=BIRTH+OF+A+TEMPLE+0.2');
const setIds = await pg.evaluate(() => (typeof QUEUE !== 'undefined' && QUEUE.shared) ? QUEUE.shared.slice() : null);
ok('three acts, in order', setIds && setIds.join() === 'SRC-73,SRC-74,SRC-75', setIds);

console.log('ACT I · SRC-73: six layers, two macros, the media layers wake and sleep');
await scene('SRC-73');
let s = await mix();
ok('host is open with six layers', s && s.layers.length === 6, s);
ok('macros are DEPTH and DIRECTION, DIRECTION starts UP', s && s.macroNames.join() === 'DEPTH,DIRECTION' && s.macro[1] === 1, s);
ok('layer 1 opened up, the rest down', s && s.want[0] === 1 && s.want.slice(1).every(v => v === 0), s);
// the Twister lays the act out: faders 1-6, macros on 13/14, STOP on 11, BLACKOUT on 12
await pg.evaluate(() => { MIDIRIG.add('twister'); TWIST.autoMap(); });
await wait(300);
const lay = await pg.evaluate(() => TWIST.slots.map(S => S.turn + '/' + S.push));
ok('AUTO-MAP: faders on 1-6', lay.slice(0, 6).every((x, i) => x === 'fader' + i + '/solo' + i), lay);
ok('AUTO-MAP: macro A on 13, macro B on 14, nothing on 15 and 7', lay[12] === 'macro0/none' && lay[13] === 'macro1/none' && lay[14] === 'none/none' && lay[6] === 'none/none', lay);
ok('AUTO-MAP: GO BACK STOP BLACKOUT on 9-12, SOUND OUT on 16', lay[8] === 'none/go' && lay[9] === 'none/back' && lay[10] === 'none/stop' && lay[11] === 'none/blackout' && lay[15] === 'vol/none', lay);
// a knob turn reaches the macro, and the light reads it back
await pg.evaluate(() => TWIST.fire('macro0', 0.5));
s = await mix();
ok('knob 13 → DEPTH 0.5', s.macro[0] === 0.5, s.macro);
const light = await pg.evaluate(() => TWIST.lightFor(12));
ok('the ring shows the macro value', light.ring === 64, light);
// the media layer: fader up from nothing starts the clip; down parks it
await pg.evaluate(() => MIX.set(3, 1));
await wait(2500);
let m = await pg.evaluate(() => MEDIA.state('SRC-77'));
ok('LAUNCH CLIP: fader up → the clip is playing from the top', m && m.ready && !m.paused && m.t > 0.3 && m.t < 2.6, m);
await pg.evaluate(() => MIX.set(3, 0));
await wait(1800);
m = await pg.evaluate(() => MEDIA.state('SRC-77'));
ok('fader down → parked', m && m.paused, m);
await pg.evaluate(() => MIX.set(3, 1));
await wait(1200);
m = await pg.evaluate(() => MEDIA.state('SRC-77'));
ok('fader up again → from the top again', m && !m.paused && m.t < 1.4, m);
await pg.evaluate(() => MIX.set(3, 0));
const still = await pg.evaluate(() => { MIX.set(4, 1); return MEDIA.state('SRC-78'); });
ok('THE TEMPLE still is loaded', still && still.ready && !still.err, still);
await pg.evaluate(() => MIX.set(4, 0));
// BLACKOUT: everything glides to black and comes back where it was
await pg.evaluate(() => { MIX.set(0, 1); MIX.set(1, 0.7); MIX.set(2, 0.4); });
await wait(600);
await pg.evaluate(() => TWIST.fire('blackout', 1));
await wait(2200);
s = await mix();
ok('BLACKOUT: every fader at zero within ~2 s', s.black && s.fade.every(v => v < 0.03), s);
const blk = await pg.evaluate(() => TWIST.lightFor(11));
ok('knob 12 burns while the wall is black', blk.anim === 47, blk);
await pg.evaluate(() => TWIST.fire('blackout', 1));
await wait(2500);
s = await mix();
ok('BLACKOUT again: back to 1 / 0.7 / 0.4', !s.black && s.want[0] === 1 && s.want[1] === 0.7 && s.want[2] === 0.4 && s.fade[0] > 0.9, s);
await shot('I_flat', [1, 0, 0, 0, 0, 0], [0, 1]);
await shot('I_space', [1, 0.8, 0.7, 0, 0, 0], [1, 1]);
await shot('I_clip', [0.3, 0, 0.5, 1, 0, 0], [1, 1], 2500);
await shot('I_triumph', [0.6, 0.5, 1, 0, 0, 0.8], [1, 1]);
const f1 = await pg.evaluate(async () => { MIX.set(0, 1); MIX.set(1, 1); MIX.set(2, 1); MIX.set(3, 0); MIX.set(4, 0); MIX.set(5, 1); return 1; });
await wait(1500);
const fpsI = await fps(3000);
console.log('  fps  ACT I with Point+Circle+Passage+Eclipse up: ' + fpsI + ' (headless, pessimistic; budget stands layers down)');

console.log('ACT II · SRC-74: four layers, three macros, the names divide');
await scene('SRC-74');
s = await mix();
ok('four layers, INSIDE / DIVIDE / DIRECTION, DIRECTION starts DOWN', s && s.layers.length === 4 && s.macroNames.join() === 'INSIDE,DIVIDE,DIRECTION' && s.macro[2] === 0, s);
await pg.evaluate(() => TWIST.autoMap());
const lay2 = await pg.evaluate(() => TWIST.slots.map(S => S.turn));
ok('AUTO-MAP: three macros on 13, 14, 15; knob 7 free', lay2[12] === 'macro0' && lay2[13] === 'macro1' && lay2[14] === 'macro2' && lay2[6] === 'none', lay2);
await pg.evaluate(() => { MIX.set(1, 1); MIX.macro(1, 0.75); });
await wait(2500);
const dv = await pg.evaluate(() => { const P = MIX.P(); return +P.state.insts[1].state.divide.toFixed(2); });
ok('DIVIDE reaches the names layer', dv > 0.5, dv);
await shot('II_descent', [1, 0.6, 0, 0], [0, 0, 0]);
await shot('II_names', [0.2, 1, 0, 0], [0, 0, 0]);
await shot('II_qr', [0.2, 0.5, 1, 0], [0, 0, 0]);
await shot('II_inside', [0, 1, 0, 0.3], [1, 0, 0]);
await shot('II_divide', [0, 1, 0, 0.3], [0.3, 1, 0]);

console.log('ACT III · SRC-75: three layers, no macros yet');
await scene('SRC-75');
s = await mix();
ok('three layers, no macros', s && s.layers.length === 3 && s.macro.length === 0, s);
await pg.evaluate(() => TWIST.autoMap());
const lay3 = await pg.evaluate(() => TWIST.slots.map(S => S.turn + '/' + S.push));
ok('AUTO-MAP: no macro knobs, BLACKOUT still on 12', lay3[12] === 'none/none' && lay3[11] === 'none/blackout', lay3);
await shot('III_ascension', [1, 0.5, 0.4], []);

console.log('0.1 STILL WORKS · SRC-62 hosts two layers, no macros, and BLACKOUT works there too');
await scene('SRC-62');
s = await mix();
ok('two layers, zero macros', s && s.layers.length === 2 && s.macro.length === 0, s);
await pg.evaluate(() => MIX.blackout()); await wait(2200);
s = await mix();
ok('blackout on 0.1', s.black && s.fade.every(v => v < 0.03), s);

console.log('THE PROTECTION RULE · a scene that is not ours sees none of this');
await scene('SRC-28');
const foreign = await pg.evaluate(() => {
  const before = JSON.stringify({ solo: null, want: null });
  const r = { hasMix: !!(MIX.P()), mapped: TWIST.mapped(), macroCount: MIX.macroCount(), threw: false };
  try { TWIST.fire('macro0', 1); TWIST.fire('blackout', 1); MIX.macro(0, 1); MIX.blackout(); MIX.fire(0); } catch (e) { r.threw = String(e); }
  r.state = MIX.state();
  return r;
});
ok('SRC-28: no host, the Twister is dark, every new call is a no-op', !foreign.hasMix && !foreign.mapped && foreign.macroCount === 0 && foreign.threw === false && foreign.state === null, foreign);
const turns = await pg.evaluate(() => TWIST.turnOpts().filter(k => k.indexOf('macro') === 0).length);
ok('the editor still offers all four macros where there is no host (configurable, like faders)', turns === 4, turns);

console.log('THE MEDIA SCENES STAND ALONE · SRC-79 opens on its own; SRC-77 plays when focused');
await scene('SRC-79');
const qr = await pg.evaluate(() => MEDIA.state('SRC-79'));
ok('the QR still is ready standalone', qr && qr.ready, qr);
await scene('SRC-77');
await wait(1500);
const clipF = await pg.evaluate(() => MEDIA.state('SRC-77'));
ok('the clip plays when it is the focused scene', clipF && clipF.ready && !clipF.paused, clipF);

console.log('THE LIBRARY WALL IS SILENT · a tile is a thumbnail, not a play button (Edson, Sep 27 04:00)');
await open('lib?src=56-&sort=new');
await wait(2500);
const wall = await pg.evaluate(() => ({ clip: MEDIA.state('SRC-77'), focus: (typeof focus !== 'undefined') ? focus.idx : null }));
ok('no scene open, the launch clip is parked', wall.focus < 0 && wall.clip && wall.clip.paused, wall);

ok('no page errors', errs.length === 0, errs.slice(0, 3));
await b.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
