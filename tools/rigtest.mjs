// rigtest.mjs — MIDIRIG: the controller lives on the desk (the home), and
// each scene maps it or leaves it dark.
//   node tools/rigtest.mjs [baseUrl]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
//
// NOTE: a hash-only page.goto() is a SAME-DOCUMENT navigation and does not
// reload, so every page change here goes via about:blank first.
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://127.0.0.1:8765';
let fails = 0;
const ok = (name, cond, got) => {
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond ? '' : '  got: ' + JSON.stringify(got)));
  if (!cond) fails++;
};

const b = await chromium.launch({ channel: 'chrome' });
const pg = await b.newPage({ viewport: { width: 1600, height: 1100 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

// headless has no Web MIDI, and the panel rightly shows only CONNECT without
// it. Stub just enough access that the body renders and can be judged.
const open = async hash => {
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html' + (hash ? '#' + hash : ''), { waitUntil: 'load' });
  await pg.waitForTimeout(3200);
  await pg.evaluate(() => { if (typeof midi !== 'undefined' && !midi.access) midi.access = { inputs: new Map(), outputs: new Map() }; });
  await pg.waitForTimeout(500);
};
const scene = id => open('scene=' + id);
// the rail is a picture; the editor and the state texts live in the MAP
// window, so state() opens it, reads it, and closes it again
const state = () => pg.evaluate(() => {
  const seen = e => !!e && e.getBoundingClientRect().height > 0;
  const G = document.getElementById('drvbody-twister');
  const txt = G ? G.textContent : '';
  const drawn = !!G && seen(G);
  if (drawn && window.TWISTPANEL) TWISTPANEL.open();
  const M = document.getElementById('twMap');
  const r = {
    panel: !!document.getElementById('midiGroup'),
    title: (document.querySelector('#midiGroup h5') || {}).firstChild
      ? document.querySelector('#midiGroup h5').firstChild.textContent : null,
    desk: MIDIRIG.rig(), key: MIDIRIG.sceneKey(),
    mapped: TWIST.mapped(), deaf: !TWIST.inRig(),
    body: drawn,
    picture: drawn && seen(document.getElementById('twSurface')),
    knobs: M ? [...M.querySelectorAll('select')].filter(s => seen(s) && s.closest('div[style*="grid-template"]')).length : 0,
    darkShown: M ? [...M.querySelectorAll('p')].some(p => seen(p) && /Not mapped/.test(p.textContent)) : false,
    homeShown: M ? [...M.querySelectorAll('p')].some(p => seen(p) && /Open a scene/.test(p.textContent)) : false,
    status: (document.getElementById('drvstat-twister') || {}).textContent,
    has: txt.length > 0
  };
  if (window.TWISTPANEL) TWISTPANEL.close();
  return r;
});

console.log('THE HOME: the panel is there with no scene open, below SOUND IN');
await open('');
let s = await state();
const order = await pg.evaluate(() => [...document.querySelectorAll('#librail .sgroup')]
  .filter(g => g.getBoundingClientRect().height > 0)
  .map(g => ((g.querySelector('h5') || {}).textContent || '').replace(/\s+/g, ' ').trim()));
const iSound = order.findIndex(t => /^Sound in/.test(t));
const iMidi = order.findIndex(t => /^MIDI Controller/.test(t));
ok('no scene is open', s.key === '', s);
ok('named "MIDI Controller"', s.title === 'MIDI Controller', s);
ok('visible at the home, directly below Sound in', iSound >= 0 && iMidi === iSound + 1, { order, iSound, iMidi });

console.log('a fresh profile has nothing on the desk');
ok('desk is empty, twister deaf, nothing drawn', s.desk.length === 0 && s.deaf && !s.body, s);

console.log('ADD from the home puts it on the desk');
await pg.evaluate(() => MIDIRIG.add('twister'));
await pg.waitForTimeout(700);
s = await state();
ok('on the desk, drawn as a picture, MAP says open a scene', s.desk[0] === 'twister' && s.body && s.picture && s.homeShown, s);
const railBtns = await pg.evaluate(() => [...document.querySelectorAll('#drvbody-twister button')]
  .filter(x => x.getBoundingClientRect().height > 0).map(x => x.textContent));
ok('the home rail has MAP and nothing else — no TEST, no LIT', railBtns.join() === 'MAP', railBtns);
ok('no knob grid at the home, and deaf', s.knobs === 0 && s.deaf, s);

console.log('a scene nobody mapped is DARK');
await scene('SRC-64');
s = await state();
ok('still on the desk in the scene', s.desk[0] === 'twister', s);
ok('not mapped, deaf, grid hidden, says so', !s.mapped && s.deaf && s.knobs === 0 && s.darkShown, s);
ok('header says DARK', /^DARK/.test(s.status), s);
const quiet = await pg.evaluate(() => { const before = MIX.get(1); TWIST.lastMsg = '';
  TWIST.handle({ data: [0xB0, 1, 120], target: { id: null } });
  return { before, after: MIX.get(1), slot: TWIST.lastMsg }; });
ok('a knob turned in a dark scene does nothing', quiet.slot === '' && quiet.after === quiet.before, quiet);
const vol = await pg.evaluate(() => { TWIST.lastMsg = ''; TWIST.handle({ data: [0xB0, 15, 64], target: { id: null } });
  const v = +document.getElementById('volSlider').value; TWIST.handle({ data: [0xB0, 15, 108], target: { id: null } });
  return { slot: TWIST.lastMsg, v, v2: +document.getElementById('volSlider').value, AE: +AE.vol.toFixed(3) }; });
ok('but knob 16 is SOUND OUT, even here', vol.slot === 'K16' && vol.v === 50 && vol.v2 === 85, vol);
const sceneBtns = await pg.evaluate(() => [...document.querySelectorAll('#drvbody-twister button')]
  .filter(x => x.getBoundingClientRect().height > 0).map(x => x.textContent));
ok('a scene rail has exactly AUTO-MAP and MAP', sceneBtns.join() === 'AUTO-MAP,MAP', sceneBtns);

console.log('AUTO-MAP from the dark row maps THIS scene');
await pg.evaluate(() => [...document.querySelectorAll('#drvbody-twister button')]
  .find(x => x.textContent === 'AUTO-MAP' && x.getBoundingClientRect().height > 0).click());
await pg.waitForTimeout(500);
s = await state();
ok('mapped, awake, 32 selects', s.mapped && !s.deaf && s.knobs === 32, s);
const turn = await pg.evaluate(() => { TWIST.handle({ data: [0xB0, 1, 110], target: { id: null } }); return { slot: TWIST.lastMsg, L2: MIX.get(1) }; });
ok('and a turn now lands', turn.slot === 'K2' && turn.L2 > 0.5, turn);
console.log('knob 16 is the driver\'s suggestion, not a lock');
const re16 = await pg.evaluate(() => { const was = TWIST.slots[15].turn; TWIST.setFn(15, 'turn', 'fader0'); TWIST.setFn(3, 'turn', 'vol');
  TWIST.handle({ data: [0xB0, 15, 20], target: { id: null } });
  const r = { was, now: TWIST.slots[15].turn, k4: TWIST.slots[3].turn, L1: +MIX.get(0).toFixed(2), saved: JSON.parse(localStorage.getItem('srcTwistMaps'))['SRC-64'][15].turn };
  TWIST.setFn(15, 'turn', 'vol'); TWIST.setFn(3, 'turn', 'none'); return r; });
ok('AUTO-MAP put SOUND OUT on 16; 16 can be a fader, and 4 can be SOUND OUT', re16.was === 'vol' && re16.now === 'fader0' && re16.k4 === 'vol' && re16.L1 < 0.2 && re16.saved === 'fader0', re16);
await pg.reload({ waitUntil: 'load' }); await pg.waitForTimeout(3200);
await pg.evaluate(() => { if (!midi.access) midi.access = { inputs: new Map(), outputs: new Map() }; });

console.log('Escape closes the MAP window and ONLY the MAP window');
const esc = await pg.evaluate(async () => { TWISTPANEL.open();
  (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 300));
  return { open: document.getElementById('twMap').style.display !== 'none', idx: focus.idx, key: MIDIRIG.sceneKey() }; });
ok('window closed, scene still open', !esc.open && esc.idx >= 0 && esc.key === 'SRC-64', esc);
const esc2 = await pg.evaluate(async () => {
  (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await new Promise(r => setTimeout(r, 300)); const r = { idx: focus.idx };
  return r; });
ok('with the window shut, Escape is core\'s again and closes the scene', esc2.idx === -1, esc2);
await scene('SRC-64');

console.log('another scene is still dark');
await scene('SRC-67');
s = await state();
ok('SRC-67 dark, same desk', !s.mapped && s.deaf && s.desk[0] === 'twister', s);

console.log('COPY FROM gives a copy, not a shared map');
const cp = await pg.evaluate(async () => {
  TWISTPANEL.open();
  const sel = [...document.querySelectorAll('#twMap select')].find(x => x.title.indexOf('Start from') === 0 && x.getBoundingClientRect().height > 0);
  const offered = [...sel.options].map(o => o.value);
  const first = sel.options[0] && sel.options[0].textContent;
  const firstScene = [...sel.options].find(o => o.value === 'SRC-64'); const firstSceneT = firstScene && firstScene.textContent;
  sel.value = 'SRC-64'; sel.dispatchEvent(new Event('change'));
  await new Promise(r => setTimeout(r, 300));
  TWIST.setFn(0, 'turn', 'none');
  TWISTPANEL.close();
  return { offered, first, firstScene: firstSceneT, mapped: TWIST.mapped(), here: TWIST.slots[0].turn, there: TWIST.maps['SRC-64'][0].turn };
});
ok('SRC-64 is offered, under a COPY FROM label', cp.offered.includes('SRC-64') && cp.first === 'COPY FROM…', cp);
ok('and its title rides along', /^SRC-64 · /.test(cp.firstScene || ''), cp);
ok('copied, and editing it leaves SRC-64 alone', cp.mapped && cp.here === 'none' && cp.there === 'fader0', cp);

console.log('UNMAP sends it back to dark, not to a map of blanks');
await pg.evaluate(() => { TWISTPANEL.open(); [...document.querySelectorAll('#twMap button')].find(x => x.textContent === 'UNMAP').click(); TWISTPANEL.close(); });
await pg.waitForTimeout(400);
s = await state();
ok('dark again, and the entry is gone', !s.mapped && s.darkShown
  && !(await pg.evaluate(() => 'SRC-67' in TWIST.maps)), s);

console.log('and SRC-64 remembered its own map');
await scene('SRC-64');
s = await state();
ok('SRC-64 mapped and awake', s.mapped && !s.deaf, s);

console.log('the home stays dark even with maps elsewhere');
await open('');
s = await state();
ok('home: on the desk, deaf, no grid', s.desk[0] === 'twister' && s.deaf && s.knobs === 0 && s.homeShown, s);

console.log('ONE PAGE: the panel follows the view into a scene and back');
// no about:blank here — this is the real path, a tile click and BACK
const where = () => pg.evaluate(() => {
  const g = document.getElementById('midiGroup'), h = g.parentNode;
  const sib = g.previousElementSibling;
  return { rail: h.id, after: sib ? (sib.querySelector('h5') || {}).textContent.trim() : null,
           key: MIDIRIG.sceneKey(), twKey: TWIST.key(), mapped: TWIST.mapped(), live: TWIST.inRig() };
});
let w = await where();
ok('home: in #librail after Sound in', w.rail === 'librail' && /^Sound in/.test(w.after) && w.key === '', w);
await pg.evaluate(() => openFocus(PIECES.findIndex(p => p.id.split('.')[0] === 'SRC-64')));
await pg.waitForTimeout(900);
w = await where();
ok('scene: moved into #sidebar after Sound out (where its audio-in lives)', w.rail === 'sidebar' && /^Sound out/.test(w.after), w);
ok('scene: key flipped, SRC-64 mapped and live', w.key === 'SRC-64' && w.twKey === 'SRC-64' && w.mapped && w.live, w);
await pg.evaluate(() => closeFocus());
await pg.waitForTimeout(900);
w = await where();
ok('BACK: in #librail again, no scene, deaf', w.rail === 'librail' && w.key === '' && !w.live, w);
const folds = await pg.evaluate(async () => {
  const g = document.getElementById('midiGroup'); g.classList.remove('fold');
  g.querySelector('h5').click(); await new Promise(r => setTimeout(r, 50));
  const f = g.classList.contains('fold'); g.querySelector('h5').click(); return f; });
ok('the header still folds after the trip', folds, folds);

console.log('DARK IS DARK ON THE DEVICE');
const lit = await pg.evaluate(async () => {
  window.__s = []; const fake = { name: 'Midi Fighter Twister', state: 'connected', send: x => window.__s.push(x.slice()) };
  TWIST.findOut = () => fake; TWIST.out = fake; TWIST.lights = true;
  // a port that opens while we are already dark (CONNECT after load)
  TWIST._cleared = false;
  await new Promise(r => setTimeout(r, 300));
  // the LAST ring value each knob was sent — what the device is now showing
  const rings = () => { const o = {}; for (const m of window.__s) if ((m[0] & 15) === 0) o[m[1]] = m[2]; return o; };
  const clear = rings();
  // TEST at the home, then wait for the restore
  window.__s = []; TWIST.test();
  await new Promise(r => setTimeout(r, 2400));
  return { clearRings: clear, endRings: rings(), vol: Math.round(+document.getElementById('volSlider').value / 100 * 127) };
});
const darkBut16 = R => Object.keys(R).length === 16 && [...Array(15).keys()].every(k => R[k] === 0) && R[15] === lit.vol;
ok('a port found while dark: 15 knobs cleared, knob 16 shows SOUND OUT', darkBut16(lit.clearRings), lit);
ok('TEST at the home ends dark, not on the last blue frame', darkBut16(lit.endRings), lit);

console.log('the MAP window closes on a click outside it');
const outside = await pg.evaluate(async () => { TWISTPANEL.open();
  const inside = document.querySelector('#twMap h4');
  inside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  const stillOpen = document.getElementById('twMap').style.display !== 'none';
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  return { stillOpen, closed: document.getElementById('twMap').style.display === 'none' }; });
ok('a click inside keeps it, a click outside closes it', outside.stillOpen && outside.closed, outside);

console.log('taking it off the desk makes it deaf everywhere');
await pg.evaluate(() => MIDIRIG.remove('twister'));
await scene('SRC-64');
s = await state();
ok('SRC-64 deaf and undrawn, though it has a map', s.desk.length === 0 && s.deaf && !s.body, s);

console.log('ADD hides while every known controller is already on the desk');
await pg.evaluate(() => MIDIRIG.add('twister')); await pg.waitForTimeout(500);
const hid = await pg.evaluate(() => [...document.querySelectorAll('#midiGroup button')]
  .filter(x => /ADD CONTROLLER/.test(x.textContent) && x.getBoundingClientRect().height > 0).length);
ok('no ADD button with nothing to add', hid === 0, hid);
await pg.evaluate(() => MIDIRIG.remove('twister')); await pg.waitForTimeout(500);

console.log('the ADD list is driven by the registry, not hard-coded');
const menu = await pg.evaluate(async () => {
  const g = document.getElementById('midiGroup');
  [...g.querySelectorAll('button')].find(x => /ADD CONTROLLER/.test(x.textContent)).click();
  await new Promise(r => setTimeout(r, 300));
  return { offered: [...g.querySelectorAll('button')].map(x => x.textContent),
           registered: MIDIRIG.drivers().map(d => d.name) };
});
ok('every registered driver is offered', menu.registered.every(n => menu.offered.includes(n)), menu);

console.log('a stray paint error is survived; three in a row retire the driver, loudly');
const stray = await pg.evaluate(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let frame = 0, fail = f => false; const logged = [];
  const ce = console.error; console.error = (...a) => { logged.push(a.join(' ')); ce.apply(console, a); };
  MIDIRIG.registerDriver({ id: 'probe', name: 'probe', build() {}, paint() { frame++; if (fail(frame)) throw new Error('probe'); } });
  MIDIRIG.add('probe'); await wait(400);
  // bad, bad, good — over and over: never three in a row
  const f0 = frame; fail = f => (f - f0) % 3 !== 0; await wait(2000);
  const survived = !!document.getElementById('drv-probe');
  fail = () => true; await wait(800);
  const r = { survived, framesSeen: frame - f0, retired: !document.getElementById('drv-probe'), said: logged.some(l => /MIDIRIG probe paint: probe/.test(l)) };
  console.error = ce; MIDIRIG.remove('probe');
  return r; });
ok('bad-bad-good for 2s: still drawn', stray.survived && stray.framesSeen >= 9, stray);
ok('three in a row: retired, and it says why in the console', stray.retired && stray.said, stray);

console.log('MIGRATION from the per-scene rig and the single shared map');
await pg.evaluate(() => {
  const old = []; for (let i = 0; i < 16; i++) old.push({ turn: 'none', push: 'none', cc: i, note: i, ch: 0, dev: null, led: i });
  old[0].turn = 'fader0'; old[8].push = 'go'; old[7].turn = 'inst';
  localStorage.removeItem('srcMidiDesk'); localStorage.removeItem('srcTwistMaps');
  localStorage.setItem('srcTwist2', JSON.stringify(old));
  localStorage.setItem('srcMidiRig', JSON.stringify({ 'SRC-56': ['twister'], '*': ['twister'] }));
});
await scene('SRC-56');
s = await state();
ok('the twister is on the desk', s.desk[0] === 'twister', s);
const mig = await pg.evaluate(() => TWIST.slots.map(S => S.turn));
ok('a scene it was added to BY NAME keeps the old map', s.mapped && !s.deaf && mig[0] === 'fader0', { s, mig });
ok('INSTRUMENT VOL is gone and knob 16 became SOUND OUT', mig[7] === 'none' && mig[15] === 'vol', mig);
await scene('SRC-67');
s = await state();
const offersOld = await pg.evaluate(() => { TWISTPANEL.open();
  const r = [...document.querySelectorAll('#twMap select')].find(x => x.title.indexOf('Start from') === 0 && x.getBoundingClientRect().height > 0)
    .querySelector('option[value="~old"]') !== null; TWISTPANEL.close(); return r; });
ok('a scene that only had it through ALL is dark', !s.mapped && s.deaf, s);
ok('and can COPY FROM the old shared map', offersOld, offersOld);

ok('no page errors', errs.length === 0, errs.slice(0, 3));
await b.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
