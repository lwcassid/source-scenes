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

console.log('LEARN is gone');
const l = await pg.evaluate(() => ({ arm: typeof TWIST.arm, glyphs: [...document.querySelectorAll('#twistGroup button')].filter(x => x.textContent === '⌖').length }));
ok('no TWIST.arm', l.arm === 'undefined', l); ok('no learn targets', l.glyphs === 0, l);

console.log('the map follows the scene');
const m = await pg.evaluate(() => { TWIST.autoMap(); return { n: TWIST.nLayers(), turns: TWIST.turnOpts(), mapped: TWIST.slots.map(s => s.turn).filter(x => x !== 'none') }; });
ok('SRC-64 has 2 layers', m.n === 2, m);
ok('two faders + instrument', m.mapped.join() === 'fader0,fader1,inst', m);
ok('dropdown offers L1-L2 only', m.turns.join() === 'none,fader0,fader1,inst', m);

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

console.log('nothing overflows the rail');
const g = await pg.evaluate(() => { const G = document.getElementById('twistGroup');
  const row = [...G.querySelectorAll('.srow')].find(x => /AUTO-MAP/.test(x.textContent));
  const grid = G.querySelector('div[style*="grid"]');
  return { row: row.scrollWidth - Math.round(row.getBoundingClientRect().width),
           grid: grid.scrollWidth - Math.round(grid.getBoundingClientRect().width) }; });
ok('footer and grid fit', g.row === 0 && g.grid === 0, g);

console.log('no Web MIDI: one button, and nothing that cannot work');
const c = await pg.evaluate(() => { let n = 0; const real = window.connectMidi;
  window.connectMidi = function () { n++; return real && real.apply(this, arguments); };
  const G = document.getElementById('twistGroup');
  const seen = e => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const btns = [...G.querySelectorAll('button')].filter(seen);
  btns.forEach(x => x.click());
  window.connectMidi = real;
  return { access: TWIST.hasAccess(), labels: btns.map(x => x.textContent),
           selects: [...G.querySelectorAll('select')].filter(seen).length,
           status: G.querySelector('h5 span').textContent, calls: n }; });
ok('one visible button, and it connects', !c.access && c.labels.length === 1 && c.calls === 1, c);
ok('no controls that cannot work', c.selects === 0, c);
ok('header says NOT CONNECTED', c.status === 'NOT CONNECTED', c);

console.log('the header folds anywhere along it, status label included');
const fold = [];
for (const id of ['twistGroup', 'mixGroup']) {
  if (!await pg.evaluate(i => !!document.getElementById(i), id)) continue;
  await pg.evaluate(i => document.getElementById(i).classList.remove('fold'), id);
  const box = await pg.evaluate(i => { const r = document.getElementById(i).querySelector('h5 span').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; }, id);
  if (box.w > 0) await pg.mouse.click(box.x, box.y);
  fold.push([id, await pg.evaluate(i => document.getElementById(i).classList.contains('fold'), id)]);
  await pg.evaluate(i => document.getElementById(i).classList.remove('fold'), id);
}
ok('status label is not a dead zone', fold.length > 0 && fold.every(([, f]) => f), fold);

console.log('a scene with no mixer says so');
await pg.goto(URL + '#scene=SRC-67', { waitUntil: 'load' });
await pg.waitForTimeout(3200);
// headless has no Web MIDI, and the panel correctly hides its body without it.
// Stub just enough access that the body renders, so the dimming can be judged.
await pg.evaluate(() => { if (typeof midi !== 'undefined' && !midi.access) midi.access = { inputs: new Map(), outputs: new Map() }; });
await pg.waitForTimeout(400);
const nm = await pg.evaluate(() => { const G = document.getElementById('twistGroup');
  const sels = [...G.querySelectorAll('select')];
  const am = [...G.querySelectorAll('button')].find(x => x.textContent === 'AUTO-MAP');
  // every binding that needs a mixer must be dimmed — no more, no fewer
  const needs = f => f !== 'none' && (f.indexOf('fader') === 0 || f.indexOf('solo') === 0 || f === 'inst' || f === 'unsolo');
  const expect = TWIST.slots.reduce((a2, S) => a2 + (needs(S.turn) ? 1 : 0) + (needs(S.push) ? 1 : 0), 0);
  return { hasMix: TWIST.hasMix(), expect, dim: sels.filter(s => s.style.opacity === '0.35').length,
           amDim: am.style.opacity === '0.4',
           note: [...G.querySelectorAll('p.sinfo')][1].textContent.indexOf('no mixer') >= 0,
           cueLeds: [8, 9, 10, 11].map(i => TWIST.lightFor(i).anim),
           faderLeds: [0, 1].map(i => TWIST.lightFor(i).anim) }; });
ok('every mixer control dimmed, exactly', !nm.hasMix && nm.expect > 0 && nm.dim === nm.expect, nm);
ok('AUTO-MAP disabled and explained', nm.amDim && nm.note, nm);
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
