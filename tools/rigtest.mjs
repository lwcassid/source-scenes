// rigtest.mjs — MIDIRIG: controllers are modular, and per scene.
//   node tools/rigtest.mjs [baseUrl]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
//
// NOTE: a hash-only page.goto() is a SAME-DOCUMENT navigation and does not
// reload, so every scene change here goes via about:blank first.
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

const open = async id => {
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html#scene=' + id, { waitUntil: 'load' });
  await pg.waitForTimeout(3200);
};
const state = () => pg.evaluate(() => ({
  panel: !!document.getElementById('midiGroup'),
  title: (document.querySelector('#midiGroup h5') || {}).firstChild
    ? document.querySelector('#midiGroup h5').firstChild.textContent : null,
  rig: MIDIRIG.rig(),
  deaf: !TWIST.inRig(),
  body: !!document.getElementById('drvbody-twister'),
  knobs: document.querySelectorAll('#drvbody-twister select').length
}));

console.log('the panel exists, is named, and sits below SOUND OUT');
await open('SRC-64');
const order = await pg.evaluate(() => [...document.querySelectorAll('#sidebar .sgroup')]
  .map(g => ((g.querySelector('h5') || {}).textContent || '').replace(/\s+/g, ' ').trim()));
const iSound = order.findIndex(t => /^Sound out/.test(t));
const iMidi = order.findIndex(t => /^MIDI Controller/.test(t));
ok('named "MIDI Controller"', (await state()).title === 'MIDI Controller', await state());
ok('sits directly below Sound out', iSound >= 0 && iMidi === iSound + 1, { order, iSound, iMidi });

console.log('a fresh profile has NO controller anywhere');
let s = await state();
ok('rig is empty', s.rig.length === 0, s);
ok('the twister is deaf', s.deaf, s);
ok('and draws nothing', !s.body, s);

console.log('adding it to THIS scene');
await pg.evaluate(() => MIDIRIG.add('twister'));
await pg.waitForTimeout(700);
s = await state();
ok('now in the rig, awake, drawn', s.rig[0] === 'twister' && !s.deaf && s.knobs === 32, s);

console.log('a scene it was never added to is untouched');
await open('SRC-67');
s = await state();
ok('SRC-67 has no controller', s.rig.length === 0 && s.deaf && !s.body, s);

console.log('and the choice is remembered');
await open('SRC-64');
s = await state();
ok('SRC-64 remembered it', s.rig[0] === 'twister' && !s.deaf, s);

console.log('the ALL scope is a default that reaches every scene');
await pg.evaluate(() => MIDIRIG.add('twister', MIDIRIG.ALL));
await pg.waitForTimeout(600);
await open('SRC-67');
s = await state();
ok('SRC-67 now has it too', s.rig[0] === 'twister' && !s.deaf, s);

console.log('removing takes it out of whichever scope was providing it');
await pg.evaluate(() => MIDIRIG.remove('twister'));
await pg.waitForTimeout(700);
s = await state();
ok('one remove is enough', s.rig.length === 0 && s.deaf, s);

console.log('the ADD list is driven by the registry, not hard-coded');
const menu = await pg.evaluate(async () => {
  const g = document.getElementById('midiGroup');
  [...g.querySelectorAll('button')].find(x => /ADD CONTROLLER/.test(x.textContent)).click();
  await new Promise(r => setTimeout(r, 300));
  return { offered: [...g.querySelectorAll('button')].map(x => x.textContent),
           registered: MIDIRIG.drivers().map(d => d.name) };
});
ok('every registered driver is offered',
  menu.registered.every(n => menu.offered.includes(n)), menu);

ok('no page errors', errs.length === 0, errs.slice(0, 3));
await b.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
