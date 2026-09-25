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
