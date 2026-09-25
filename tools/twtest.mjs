// twtest.mjs — the Twister and the Source hold, checked against a running page.
//   node tools/twtest.mjs [url]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
import { chromium } from 'playwright-core';
const URL = process.argv[2] || 'http://127.0.0.1:8765/index.html';
const b = await chromium.launch({ channel: 'chrome' });
const pg = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
let fails = 0;
const ok = (name, cond, got) => { console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond ? '' : '  got: ' + JSON.stringify(got))); if (!cond) fails++; };

await pg.goto(URL + '#scene=SRC-64', { waitUntil: 'load' });
await pg.waitForTimeout(3200);

/* The Twister is a DRIVER on the desk (parts/partcore_midirig.js), and each
   scene maps it or leaves it dark. On a fresh profile it is on no desk and
   no scene has a map — correctly asleep. Put it on the desk and map this
   scene first, or the suite measures a controller that is meant to be off. */
await pg.evaluate(() => { MIDIRIG.add('twister'); TWIST.autoMap(); });
await pg.waitForTimeout(600);
ok('the twister is on the desk and this scene maps it', await pg.evaluate(() => TWIST.inRig()), false);

console.log('LEARN is gone');
const l = await pg.evaluate(() => { TWISTPANEL.open(); const r = { arm: typeof TWIST.arm, glyphs: [...document.querySelectorAll('#twMap button')].filter(x => x.textContent === '⌖').length }; TWISTPANEL.close(); return r; });
ok('no TWIST.arm', l.arm === 'undefined', l); ok('no learn targets', l.glyphs === 0, l);

console.log('the map follows the scene');
const m = await pg.evaluate(() => { TWIST.autoMap(); return { n: TWIST.nLayers(), turns: TWIST.turnOpts(), mapped: TWIST.slots.map(s => s.turn).filter(x => x !== 'none') }; });
ok('SRC-64 has 2 layers', m.n === 2, m);
ok('two faders + SOUND OUT on knob 16', m.mapped.join() === 'fader0,fader1,vol', m);
ok('dropdown offers L1-L2 only, plus SOUND OUT', m.turns.join() === 'none,fader0,fader1,vol', m);

console.log('a press lands, whichever shape it arrives in');
for (const [name, msg] of [['NOTE ch0', [0x90, 8, 127]], ['NOTE ch1', [0x91, 8, 127]], ['CC ch1', [0xB1, 8, 127]], ['CC ch2', [0xB2, 8, 127]]]) {
  const r = await pg.evaluate(({ msg }) => { try { POEMDECK.abort(); } catch (e) {} TWIST.lastMsg = ''; TWIST._hit = {};
    TWIST.handle({ data: msg, target: { id: null } });
    let phase = null; try { phase = (POEMDECK.state() || {}).phase; } catch (e) {}
    return { slot: TWIST.lastMsg, blink: TWIST.hitAge(8) < 0.2, phase }; }, { msg });
  ok(name + ' → knob 9 cues + blinks', r.slot === 'K9' && r.blink && r.phase === 'armed', r);
}
const t = await pg.evaluate(() => { TWIST._hit = {}; TWIST.handle({ data: [0xB0, 1, 100], target: { id: null } });
  return { slot: TWIST.lastMsg, falsePress: TWIST.hitAge(1) > 1, L2: MIX.get(1) }; });
ok('a turn is still a turn', t.slot === 'K2' && t.falsePress && t.L2 > 0.5, t);

console.log('the blink is two messages, not a stream');
const bl = await pg.evaluate(async () => { window.__s = [];
  TWIST.out = { send: x => window.__s.push(x.slice()) }; TWIST.findOut = () => TWIST.out; TWIST.lights = true;
  TWIST._hit = {}; await new Promise(r => setTimeout(r, 250)); window.__s = [];
  TWIST.handle({ data: [0x90, 10, 127], target: { id: null } });
  await new Promise(r => setTimeout(r, 500)); return window.__s.slice(); });
ok('press = BURN then back', bl.length === 2 && bl[0][2] === 47 && bl[1][2] === 39, bl);

console.log('nothing overflows the rail or the MAP window');
const g = await pg.evaluate(() => { const G = document.getElementById('drvbody-twister');
  const row = [...G.querySelectorAll('.srow')].find(x => /AUTO-MAP/.test(x.textContent));
  const cv = document.getElementById('twSurface');
  TWISTPANEL.open();
  const grid = document.querySelector('#twMap div[style*="grid-template"]');
  const pop = document.getElementById('twMap').getBoundingClientRect();
  const r = { row: row.scrollWidth - Math.round(row.getBoundingClientRect().width),
           grid: grid.scrollWidth - Math.round(grid.getBoundingClientRect().width),
           cv: Math.round(cv.getBoundingClientRect().width) - G.clientWidth,
           popInView: pop.right <= innerWidth && pop.left >= 0 };
  TWISTPANEL.close(); return r; });
ok('rail row, picture and editor grid all fit', g.row === 0 && g.grid === 0 && g.cv <= 0 && g.popInView, g);

console.log('no Web MIDI: one button, and nothing that cannot work');
const c = await pg.evaluate(() => { let n = 0; const real = window.connectMidi;
  window.connectMidi = function () { n++; return real && real.apply(this, arguments); };
  const G = document.getElementById('drvbody-twister');
  const seen = e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const btns = [...G.querySelectorAll('button')].filter(seen);
  btns.forEach(x => x.click());
  window.connectMidi = real;
  return { access: TWIST.hasAccess(), labels: btns.map(x => x.textContent),
           selects: [...G.querySelectorAll('select')].filter(seen).length,
           status: document.getElementById('drvstat-twister').textContent, calls: n }; });
ok('one visible button, and it connects', !c.access && c.labels.length === 1 && c.calls === 1, c);
ok('no controls that cannot work', c.selects === 0, c);
ok('header says NOT CONNECTED', c.status === 'NOT CONNECTED', c);

console.log('the header folds anywhere along it, status label included');
const fold = [];
for (const id of ['midiGroup', 'mixGroup']) {
  if (!await pg.evaluate(i => !!document.getElementById(i), id)) continue;
  await pg.evaluate(i => document.getElementById(i).classList.remove('fold'), id);
  // the status label if it has any width, else the heading — an empty label
  // is not a target, and the header must still fold
  const box = await pg.evaluate(i => { const h = document.getElementById(i).querySelector('h5');
    let r = h.querySelector('span').getBoundingClientRect(); if (!r.width) r = h.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; }, id);
  if (box.w > 0) await pg.mouse.click(box.x, box.y);
  fold.push([id, await pg.evaluate(i => document.getElementById(i).classList.contains('fold'), id)]);
  await pg.evaluate(i => document.getElementById(i).classList.remove('fold'), id);
}
ok('status label is not a dead zone', fold.length > 0 && fold.every(([, f]) => f), fold);

console.log('connecting restores the layout, it does not flatten it');
const lay = await pg.evaluate(async () => {
  const G = document.getElementById('drvbody-twister');
  TWISTPANEL.open();
  const grid = document.querySelector('#twMap div[style*="grid-template"]');
  const row = [...G.querySelectorAll('.srow')].find(x => /AUTO-MAP/.test(x.textContent));
  const vis = e => e.getBoundingClientRect().height > 0;
  const off = { grid: vis(grid), row: vis(row) };
  if (typeof midi !== 'undefined' && !midi.access) midi.access = { inputs: new Map(), outputs: new Map() };
  await new Promise(r => setTimeout(r, 400));
  const cs = getComputedStyle(grid);
  const r = { off, gridDisplay: cs.display, columns: cs.gridTemplateColumns.split(' ').length,
           rowDisplay: getComputedStyle(row).display,
           cellW: Math.round(grid.firstChild.getBoundingClientRect().width) };
  TWISTPANEL.close(); return r; });
ok('hidden while disconnected', !lay.off.grid && !lay.off.row, lay);
// un-hiding with display:'' would erase the inline display:grid and stack all
// sixteen slots into one column — which is exactly what happened once
ok('grid comes back as a 4-column grid', lay.gridDisplay === 'grid' && lay.columns === 4, lay);
ok('footer comes back as flex', lay.rowDisplay === 'flex', lay);
ok('editor cells are wide enough to read', lay.cellW > 100 && lay.cellW < 160, lay);

console.log('a scene with no mixer says so');
await pg.goto(URL + '#scene=SRC-67', { waitUntil: 'load' });
await pg.waitForTimeout(3200);
// headless has no Web MIDI, and the panel correctly hides its body without it.
// Stub just enough access that the body renders, so the dimming can be judged.
await pg.evaluate(() => { if (typeof midi !== 'undefined' && !midi.access) midi.access = { inputs: new Map(), outputs: new Map() }; });
await pg.waitForTimeout(400);
// SRC-67 is dark until mapped. Copy SRC-64's map in, so there ARE mixer
// bindings here for the dimming to be judged on.
const cue = await pg.evaluate(() => { TWIST.autoMap(); const f = TWIST.slots.filter(S => S.turn !== 'none' || S.push !== 'none');
  const r = { turns: TWIST.slots.filter(S => S.turn !== 'none').length, pushes: f.map(S => S.push) };
  TWIST.unmap(); TWIST.copyFrom('SRC-64'); return r; });
await pg.waitForTimeout(400);
const nm = await pg.evaluate(() => { TWISTPANEL.open(); const G = document.getElementById('twMap');
  const sels = [...G.querySelectorAll('div[style*="grid-template"] select')];

  // every binding that needs a mixer must be dimmed — no more, no fewer
  const needs = f => f !== 'none' && (f.indexOf('fader') === 0 || f.indexOf('solo') === 0 || f === 'unsolo');
  const expect = TWIST.slots.reduce((a2, S) => a2 + (needs(S.turn) ? 1 : 0) + (needs(S.push) ? 1 : 0), 0);
  const note = [...G.querySelectorAll('p')].some(p => p.textContent.indexOf('no mixer') >= 0);
  TWISTPANEL.close();
  return { hasMix: TWIST.hasMix(), expect, dim: sels.filter(s => s.style.opacity === '0.35').length,
           note,
           cueLeds: [8, 9, 10, 11].map(i => TWIST.lightFor(i).anim),
           faderLeds: [0, 1].map(i => TWIST.lightFor(i).anim) }; });
ok('every mixer control dimmed, exactly', !nm.hasMix && nm.expect > 0 && nm.dim === nm.expect, nm);
ok('the panel says there is no mixer', nm.note, nm);
ok('AUTO-MAP here maps the poem cues + SOUND OUT, no dead faders', cue.turns === 1 && cue.pushes.join() === 'go,back,abort,stop,none', cue);
ok('poem cues stay live, faders go dim', nm.cueLeds.every(x => x === 39) && nm.faderLeds.every(x => x === 19), nm);

console.log('the last position holds');
await pg.goto(URL + '#scene=SRC-56', { waitUntil: 'load' });
await pg.waitForTimeout(2500);
await pg.evaluate(() => { clearInterval(window.__di);
  window.__di = setInterval(() => { setChan('L', 0.5); setChan('R', 0.3); }, 100); });
await pg.waitForTimeout(2500);
await pg.evaluate(() => clearInterval(window.__di));
await pg.waitForTimeout(9000);
const h = await pg.evaluate(() => { const s = focus.P.state;
  return { mode: chan.L.mode, pres: s.pres, size: +s.size.toFixed(3), heat: +s.heat.toFixed(3) }; });
ok('hands gone 9s, scene unchanged', h.mode === 'drift' && h.pres > 0.999 && h.size === 0.5 && h.heat === 0.3, h);

ok('no page errors', errs.length === 0, errs.slice(0, 3));
await b.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
