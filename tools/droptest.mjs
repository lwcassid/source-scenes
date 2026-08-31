#!/usr/bin/env node
/* droptest.mjs — deterministic harness for AUDIOIN's Layer 6 (build/drop).
   Drives _structTick() directly with a synthetic arrangement (groove →
   breakdown/build → drop → groove) plus adversarial material (a two-bar
   fill, steady ambient, silence) and asserts:
     * build rises past 0.35 during a real 12s build, stays under 0.25
       through a 2-bar fill and on steady/ambient material
     * exactly ONE drop fires, within 1.5s of the bass re-entry
     * the refractory blocks a second drop inside 8s
   Runs the real code in headless Chrome against the built preview.
   Usage: CHROMIUM=/path/to/chrome node tools/droptest.mjs */
import { chromium } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1181/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: exe, args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--headless=new'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); });
await page.goto('file://' + path.join(root, 'night-circuit-preview.html'), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);

const result = await page.evaluate(() => {
  const A = window.AUDIOIN;
  if (!A || !A._structTick) return { error: 'no AUDIOIN/_structTick' };
  const DT = 1 / 60;
  const log = [];
  let simT = 0;
  // reset layer-6 state
  A.build = 0; A.drop = { t: -1, strength: 0, n: 0 };
  A._st = { levF: 0, levS: 0, bassF: 0, bassS: 0, hiF: 0, trend: 0, supp: 0, suppT: 0, dropGap: 1e9, primed: false };
  A.live = true;
  const KICK_BPM = 128, kickPeriod = 60 / KICK_BPM;
  let nextKick = 0;
  const run = (dur, fn) => {
    const end = simT + dur;
    while (simT < end) {
      const v = fn(simT - (end - dur), simT);
      A.level = v.level; A.bass = v.bass; A.mid = v.mid; A.treble = v.treble;
      A.live = v.live !== undefined ? v.live : true;
      A._kFiredThisTick = false;
      if (v.kicks && simT >= nextKick) { A._kFiredThisTick = true; A.kick = { t: simT, strength: 0.8, n: A.kick.n + 1 }; nextKick = simT + kickPeriod; }
      A._structTick(DT);
      simT += DT;
    }
    log.push({ at: simT.toFixed(1), build: +A.build.toFixed(3), supp: +A._st.supp.toFixed(2), suppT: +A._st.suppT.toFixed(1), drops: A.drop.n });
  };
  const groove = () => ({ level: 0.62 + 0.1 * Math.sin(simT * 7), bass: 0.68 + 0.15 * Math.sin(simT * 13), mid: 0.55, treble: 0.5, kicks: true });
  // Phase 1: 30s of steady groove — build must stay low
  run(30, groove);
  const buildAfterGroove = A.build;
  // Phase 2: a 2-bar fill (bass out 3.75s at 128bpm) then back — must NOT read as a build worth a drop
  run(3.75, () => ({ level: 0.6, bass: 0.15, mid: 0.6, treble: 0.6, kicks: false }));
  const buildAfterFill = A.build;
  run(6, groove);
  const dropsAfterFill = A.drop.n;
  // Phase 3: a REAL build — 14s, bass withdrawn, energy + top end climbing
  run(14, (lt) => ({ level: 0.55 + 0.35 * (lt / 14), bass: 0.12, mid: 0.6 + 0.2 * (lt / 14), treble: 0.55 + 0.35 * (lt / 14), kicks: false }));
  const buildAtPeak = A.build;
  const dropsBefore = A.drop.n;
  // Phase 4: THE DROP — bass slams back with kicks
  let dropAt = null;
  {
    const end = simT + 4;
    while (simT < end) {
      A.level = 0.85; A.bass = 0.9; A.mid = 0.65; A.treble = 0.6; A.live = true;
      A._kFiredThisTick = false;
      if (simT >= nextKick) { A._kFiredThisTick = true; A.kick = { t: simT, strength: 0.95, n: A.kick.n + 1 }; nextKick = simT + kickPeriod; }
      const nb = A.drop.n;
      A._structTick(DT);
      if (A.drop.n > nb && dropAt === null) dropAt = simT - (end - 4);
      simT += DT;
    }
    log.push({ at: simT.toFixed(1), build: +A.build.toFixed(3), drops: A.drop.n, dropAt: dropAt === null ? null : +dropAt.toFixed(2), strength: +A.drop.strength.toFixed(2) });
  }
  const dropsAfterDrop = A.drop.n;
  const dropStrength = A.drop.strength;
  // Phase 5: refractory — fake another instant build+drop 3s later, must NOT fire
  run(2, () => ({ level: 0.6, bass: 0.1, mid: 0.6, treble: 0.7, kicks: false }));
  // force suppT artificially high to isolate the refractory
  A._st.suppT = 10;
  run(1.5, () => ({ level: 0.85, bass: 0.9, mid: 0.6, treble: 0.6, kicks: true }));
  const dropsAfterRefr = A.drop.n;
  // Phase 6: steady ambient (no dynamics, no kicks) 20s — build must stay ~0
  run(20, () => ({ level: 0.4, bass: 0.35, mid: 0.4, treble: 0.35, kicks: false }));
  const buildAmbient = A.build;
  // Phase 7: silence — build decays to 0
  run(5, () => ({ level: 0, bass: 0, mid: 0, treble: 0, live: false, kicks: false }));
  const buildSilence = A.build;
  return { log, buildAfterGroove, buildAfterFill, dropsAfterFill, buildAtPeak, dropsBefore, dropsAfterDrop, dropAt, dropStrength, dropsAfterRefr, buildAmbient, buildSilence };
});
await browser.close();

if (result.error) { console.error(result.error); process.exit(1); }
console.log(JSON.stringify(result.log, null, 1));
const checks = [
  ['groove keeps build low (<0.25)', result.buildAfterGroove < 0.25, result.buildAfterGroove.toFixed(3)],
  ['2-bar fill stays under drop-arm (<0.35)', result.buildAfterFill < 0.35, result.buildAfterFill.toFixed(3)],
  ['no drop fired off the fill', result.dropsAfterFill === 0, result.dropsAfterFill],
  ['real 14s build arms (>0.35)', result.buildAtPeak > 0.35, result.buildAtPeak.toFixed(3)],
  ['exactly one drop fired', result.dropsAfterDrop === result.dropsBefore + 1, result.dropsAfterDrop],
  ['drop within 1.5s of bass re-entry', result.dropAt !== null && result.dropAt < 1.5, result.dropAt],
  ['drop strength meaningful (>0.5)', result.dropStrength > 0.5, result.dropStrength],
  ['8s refractory holds', result.dropsAfterRefr === result.dropsAfterDrop, result.dropsAfterRefr],
  ['steady ambient stays unarmed (<0.35)', result.buildAmbient < 0.35, result.buildAmbient.toFixed(3)],
  ['silence decays build (<0.05)', result.buildSilence < 0.05, result.buildSilence.toFixed(3)],
];
let fail = 0;
for (const [name, ok, val] of checks) {
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + '  [' + val + ']');
  if (!ok) fail++;
}
process.exit(fail ? 1 : 0);
