// tools/midiecho.mjs — MIDI-IN harness with a FAKE CONTROLLER (no hardware).
// Stubs Web MIDI with one USB-style device whose input and output ports
// share a name, binds the hands to it, then checks that the hands keep
// driving the channels on the wall, inside a default-set scene (whose OUT
// override makes MOut acquire a port), and after the scene closes — and
// that a loopback echo of our own notes is still dropped before SHOW
// CONTROL while a real pad press passes. Born from the Oct 2026 bug where
// the controller worked on the wall and died in every scene.
//   bash tools/build.sh && python3 tools/build_preview.py && node tools/midiecho.mjs
// Env: CHROMIUM (browser binary), PW_MODULE (playwright | playwright-core).
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/');
const { chromium } = require(process.env.PW_MODULE || 'playwright-core');
const path = require('path');
const file = 'file://' + path.resolve('night-circuit-preview.html') + '?proj';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1234/chrome-linux/chrome', args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
await page.addInitScript(() => {
  const mk = (id, name, kind) => ({ id, name, type: kind, state: 'connected', connection: 'open', onmidimessage: null, send(b, t) { (window.__sent ||= []).push([Array.from(b), t]); }, open() {}, close() {} });
  const inp = mk('in-ctl', 'Fake Controller MIDI', 'input'), out = mk('out-ctl', 'Fake Controller MIDI', 'output');
  const inputs = new Map([[inp.id, inp]]), outputs = new Map([[out.id, out]]);
  navigator.requestMIDIAccess = () => Promise.resolve({ inputs, outputs, onstatechange: null });
  window.__midiIn = inp;
  window.__send = bytes => inp.onmidimessage && inp.onmidimessage({ data: new Uint8Array(bytes), target: inp, timeStamp: performance.now() });
});
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(file);
await page.waitForTimeout(1500);
const r = {};
r.step0 = await page.evaluate(async () => {
  connectMidi();
  await new Promise(r => setTimeout(r, 300));
  midi.map.L = { type: 'cc', ch: 0, num: 1, dev: 'in-ctl' };
  midi.map.R = { type: 'cc', ch: 0, num: 2, dev: 'in-ctl' };
  __send([0xB0, 1, 30]); __send([0xB0, 2, 90]);
  await new Promise(r => setTimeout(r, 200));
  return { bound: !!__midiIn.onmidimessage, mode: MOut.mode, port: MOut.port && MOut.port.name, L: { mode: chan.L.mode, target: +chan.L.target.toFixed(3) }, R: { mode: chan.R.mode, target: +chan.R.target.toFixed(3) } };
});
// open the first default-set scene (OUT=both) the way the wall does
r.step1 = await page.evaluate(async () => {
  const fam = QUEUE.list[0]; const i = PIECES.map((p, i) => [p, i]).filter(([p]) => famOf(p) === (fam.id || fam)).pop()[1];
  openFocus(i);
  await new Promise(r => setTimeout(r, 2500)); // the 1.5s MOut poll acquires a port
  __send([0xB0, 1, 100]); __send([0xB0, 2, 20]);
  await new Promise(r => setTimeout(r, 200));
  return { scene: PIECES[i].id, out: QUEUE.outFor(famOf(PIECES[i])), mode: MOut.mode, port: MOut.port && MOut.port.name, L: { mode: chan.L.mode, target: +chan.L.target.toFixed(3) }, R: { mode: chan.R.mode, target: +chan.R.target.toFixed(3) } };
});
r.step2 = await page.evaluate(async () => {
  closeFocus();
  await new Promise(r => setTimeout(r, 300));
  __send([0xB0, 1, 60]);
  await new Promise(r => setTimeout(r, 200));
  return { mode: MOut.mode, port: MOut.port && MOut.port.name, L: { mode: chan.L.mode, target: +chan.L.target.toFixed(3) } };
});
// REGRESSION: a loopback (IAC-style) echo of our own note must still be
// dropped before SHOW CONTROL sees it, and a hand CC must still pass.
r.step3 = await page.evaluate(async () => {
  const got = []; const o = NAV.onMsg; NAV.onMsg = m => got.push(m);
  MOut.port.send([0x90, 60, 90]);            // we play a note into the bus...
  __send([0x90, 60, 90]);                    // ...and the bus mirrors it back
  MOut.port.send([0x90, 61, 90], performance.now() + 120);  // scheduled ahead
  await new Promise(r => setTimeout(r, 120));
  __send([0x90, 61, 90]);                    // echo arrives at its scheduled time
  __send([0x90, 62, 90]);                    // a REAL pad press we never sent
  __send([0xB0, 1, 70]);                     // a REAL hand move
  await new Promise(r => setTimeout(r, 100));
  NAV.onMsg = o;
  return { navGot: got.filter(m => m.type === 'note').map(m => m.num), L: +chan.L.target.toFixed(3) };
});
console.log(JSON.stringify(r, null, 1));
const ok = Math.abs(r.step1.L.target - 100 / 127) < 0.02 && Math.abs(r.step2.L.target - 60 / 127) < 0.02
  && JSON.stringify(r.step3.navGot) === '[62]' && Math.abs(r.step3.L - 70 / 127) < 0.02;
console.log(ok ? 'HANDS OK IN SCENE' : 'BUG: HANDS DEAD IN SCENE');
await browser.close();
process.exit(ok ? 0 : 1);
