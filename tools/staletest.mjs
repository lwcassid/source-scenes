#!/usr/bin/env node
/* staletest.mjs — harness for the AGC's STALE-RANGE watchdog (part2e).
   Drives the REAL engine (analysers, envelopes, quantile trackers) with a
   synthesized program: an in-page oscillator bank feeding AUDIOIN._wire()
   through a MediaStreamDestination, so every layer runs exactly as live.
   Asserts the two behaviors that matter:
     1. STAGING DROP: after 20s of loud material, the source drops 15 dB
        (a quieter track / a booth gain change). WITHOUT the watchdog the
        bands sat flat for 30-60s; WITH it they must recover to >0.45
        within 12s.
     2. BREAKDOWN GUARD: cutting ONLY the low oscillator (the DJ pulls the
        bass) must NOT fire the watchdog — the bass band's collapse
        picture ("the bass left") survives, and stale.on stays false.
   Usage: CHROMIUM=/path/to/chrome node tools/staletest.mjs */
import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1181/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--headless=new'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
await page.goto('file://' + path.join(root, 'night-circuit-preview.html'), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);

const setup = await page.evaluate(async () => {
  const A = window.AUDIOIN;
  if (!A) return { error: 'no AUDIOIN' };
  const ctx = new AudioContext();
  await ctx.resume();
  const dest = ctx.createMediaStreamDestination();
  // a crude techno bed: 55Hz "bassline" pulsed by a 2Hz kick-ish LFO, a
  // 900Hz body, a 5kHz hat shimmer — enough dynamics to open every band
  const mk = (freq, g0) => {
    const o = ctx.createOscillator(); o.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = g0;
    o.connect(g); g.connect(dest); o.start();
    return g;
  };
  const master = ctx.createGain(); master.gain.value = 1;
  const bass = ctx.createOscillator(); bass.frequency.value = 55;
  const bassG = ctx.createGain(); bassG.gain.value = 0.55;
  bass.connect(bassG); bassG.connect(master); bass.start();
  const mid = ctx.createOscillator(); mid.frequency.value = 900;
  const midG = ctx.createGain(); midG.gain.value = 0.12;
  mid.connect(midG); midG.connect(master); mid.start();
  const tre = ctx.createOscillator(); tre.frequency.value = 5000;
  const treG = ctx.createGain(); treG.gain.value = 0.05;
  tre.connect(treG); treG.connect(master); tre.start();
  // THE PULSE: a real 128bpm kick envelope on the whole program — sharp
  // attack, exponential decay to 0.12 — which is what earns the engine's
  // dynamic-range confidence (a steady sine bed reads as a ROOM, by
  // design) and what articulates the bass band between hits.
  const pulse = ctx.createGain(); pulse.gain.value = 0.12;
  master.connect(pulse); pulse.connect(dest);
  const beat = 60 / 128;
  let schedT = ctx.currentTime + 0.1;
  const schedule = () => {
    while (schedT < ctx.currentTime + 2) {
      pulse.gain.setValueAtTime(1, schedT);
      pulse.gain.exponentialRampToValueAtTime(0.12, schedT + 0.34);
      schedT += beat;
    }
  };
  schedule();
  window._stInt = setInterval(schedule, 900);
  A._wire(dest.stream);
  A.connected = true; A._testOverride = false;
  window._st = { ctx, master, bassG };
  return { ok: true };
});
if (setup.error) { console.error(setup.error); process.exit(1); }

const read = () => page.evaluate(() => {
  const A = window.AUDIOIN;
  return { level: +A.level.toFixed(3), bass: +A.bass.toFixed(3), mid: +A.mid.toFixed(3),
    live: A.live, staleOn: A._stale.on, staleT: +A._stale.t.toFixed(1),
    ceil: +A._ag.level.ceil.toFixed(1), db: +A._ag.level.db.toFixed(1),
    bassGate: A._ag.bass.gate === undefined ? 1 : +A._ag.bass.gate.toFixed(2) };
});

console.log('phase 1: loud program, 20s settle…');
await page.waitForTimeout(20000);
const loud = await read();
console.log('  loud:', JSON.stringify(loud));

console.log('phase 2: 15 dB staging drop…');
await page.evaluate(() => { window._st.master.gain.value = 0.178; });   // -15 dB
const t0 = Date.now();
let recovered = null, staleFired = false;
while (Date.now() - t0 < 25000) {
  await page.waitForTimeout(500);
  const r = await read();
  if (r.staleOn) staleFired = true;
  if (recovered === null && r.level > 0.45 && r.bass > 0.45) recovered = (Date.now() - t0) / 1000;
  if (recovered !== null && Date.now() - t0 > (recovered + 2) * 1000) break;
}
const afterDrop = await read();
console.log('  after drop:', JSON.stringify(afterDrop), 'staleFired:', staleFired, 'recovered at', recovered, 's');

console.log('phase 3: re-settle, then BREAKDOWN (bass only pulled)…');
await page.waitForTimeout(8000);
await page.evaluate(() => { window._st.bassG.gain.value = 0.001; });
let falseFire = false;
const t1 = Date.now();
while (Date.now() - t1 < 15000) {
  await page.waitForTimeout(500);
  const r = await read();
  if (r.staleOn) falseFire = true;
}
const bkdn = await read();
console.log('  breakdown:', JSON.stringify(bkdn), 'falseFire:', falseFire);

const checks = [
  ['loud program reads healthy (level>0.4)', loud.level > 0.4, loud.level],
  ['engine judges source live', loud.live === true, loud.live],
  ['watchdog fired on the staging drop', staleFired, staleFired],
  ['bands recovered <12s after 15dB drop', recovered !== null && recovered < 12, recovered],
  ['breakdown: bass band collapses (gate<0.5)', bkdn.bassGate < 0.5, bkdn.bassGate],
  ['breakdown: watchdog does NOT fire', falseFire === false, falseFire],
];
let fail = 0;
for (const [name, ok, val] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + '  [' + val + ']');
  if (!ok) fail++;
}
await browser.close();
process.exit(fail ? 1 : 0);
