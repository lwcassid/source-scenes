// Kick-detection latency/robustness harness for AUDIOIN (parts/part2e_audioin.js).
// Usage: node tools/kicktest.mjs   (run from the repo root, like tools/shot.mjs)
//   env BPM=128         tempo of the synthesized techno/house loop
//   env DURATION=20      seconds of loop to test (after a short lead-in)
//   env SCENE=SRC-43.10  scene to open + also track its own s.kick envelope
//                         (blank/"none" to skip opening a scene)
//   env CHROMIUM=...      path to a real Chrome/Chromium binary (see shot.mjs)
//   env OUT=...           output JSON path (default scratchshots/kicktest_*.json)
//
// What it does:
//  1. rebuilds night-circuit-preview.html if missing/stale (bash tools/build.sh
//     && python3 tools/build_preview.py), same offline artifact shot.mjs uses.
//  2. opens it headless (swiftshader), optionally openFocus()es SCENE.
//  3. INSIDE the page, builds a techno/house loop entirely in Web Audio (a
//     real, second AudioContext) — kick (150->45Hz sine sweep + a short
//     click) on every beat, an off-beat-AND-on-beat 16th-note bassline
//     (55Hz saw -> lowpass, so some notes deliberately land ON the kick,
//     testing the "layered" case), closed hats on 8ths, a sustained low pad —
//     rendered into a MediaStreamAudioDestinationNode.
//  4. wires that stream straight into the real engine via
//     AUDIOIN._wire(dest.stream); AUDIOIN.connected = true — the exact same
//     code path a live mic/line-in/captured-app stream takes, so
//     AUDIOIN.tick() (already running every rAF frame off part5_tail.js's
//     main loop) does the real analysis, calibration and onset detection.
//  5. polls AUDIOIN.onset every rAF for a rising edge (onset > 0.5), and (if
//     a scene is open) SRC-43.10's own P.state.kick envelope for its own
//     rising edges, all timestamped with performance.now() mapped onto the
//     synth AudioContext's own clock (both are real, un-throttled
//     AudioContexts on the same machine — negligible relative drift over a
//     20s run).
//  6. matches each scheduled kick to the nearest detection within +-80ms,
//     reports per-kick latency (median/p90), misses (kicks with no
//     detection in that window) and false positives (detections that don't
//     belong to any kick — nearest bass/hat event is named for each).
//
// IMPORTANT: this only measures the in-browser analysis pipeline (Web Audio
// graph -> MediaStream -> AnalyserNode -> AUDIOIN.tick -> onset). There is
// no real microphone, ADC, OS audio stack or speaker/room involved, so it
// does NOT capture real mic/OS input latency or acoustic room response —
// only says something true about the *code path*, which is exactly the
// path a captured-app-audio source also takes (getDisplayMedia stream ->
// same _wire()), and structurally close to a real mic (getUserMedia stream
// -> same _wire()).

import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BPM = +(process.env.BPM || 128);
const DURATION = +(process.env.DURATION || 20);
const SCENE = process.env.SCENE === undefined ? 'SRC-43.11' : process.env.SCENE;
const sceneId = (SCENE && SCENE.toLowerCase() !== 'none') ? SCENE : null;
const PREVIEW = 'night-circuit-preview.html';
const OUT = process.env.OUT || `scratchshots/kicktest_${Date.now()}.json`;

function log(...a) { console.log(...a); }

// ---- 1. make sure the preview artifact exists and is fresh ----------------
function needsRebuild() {
  if (!fs.existsSync(PREVIEW)) return true;
  try {
    const out = execSync(
      `find parts index.html tools/build.sh tools/build_preview.py -newer ${PREVIEW} 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
    return out.length > 0;
  } catch (e) {
    return true; // can't tell -> rebuild to be safe
  }
}
if (needsRebuild()) {
  log('preview missing/stale -> bash tools/build.sh && python3 tools/build_preview.py');
  execSync('bash tools/build.sh', { stdio: 'inherit' });
  execSync('python3 tools/build_preview.py', { stdio: 'inherit' });
} else {
  log('preview up to date, skipping rebuild');
}
if (!fs.existsSync(PREVIEW)) {
  console.error('FATAL: ' + PREVIEW + ' still missing after build');
  process.exit(1);
}

// ---- 2. launch + open ------------------------------------------------------
const fileUrl = 'file://' + path.resolve(PREVIEW) + '?proj';
const browser = await chromium.launch({
  executablePath: EXE,
  headless: true,
  args: [
    '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
    '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox',
  ],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
page.on('pageerror', e => log('PAGEERR:', e.message));
page.on('console', msg => { if (/^\[kicktest\]/.test(msg.text())) log(msg.text()); });
await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2000); // let three + GLBs settle, same as shot.mjs

let sceneOpen = false;
if (sceneId) {
  const idx = await page.evaluate((id) => {
    const i = (typeof PIECES !== 'undefined') ? PIECES.findIndex(p => p.id === id) : -1;
    if (i >= 0) openFocus(i);
    return i;
  }, sceneId);
  log('scene index for', sceneId, '=', idx);
  if (idx >= 0) {
    sceneOpen = true;
    await page.waitForTimeout(1500); // scene init (three.js shader compile etc)
  } else {
    log('WARNING: scene not found, continuing without scene tracking');
  }
}

// ---- 3-6. build the loop in-page, wire it into AUDIOIN, measure ----------
const result = await page.evaluate(async ({ bpm, durationSec, sceneOpen }) => {
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }

  const master = ctx.createGain(); master.gain.value = 0.9;
  const dest = ctx.createMediaStreamDestination();
  master.connect(dest);
  // a zero-gain tap to real destination — some engines throttle/suspend
  // graph processing for a context with nothing routed to hardware output.
  const silent = ctx.createGain(); silent.gain.value = 0;
  master.connect(silent); silent.connect(ctx.destination);

  const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.25), ctx.sampleRate);
  { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }

  function schedKick(t) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(1.0, t + 0.008);       // 8ms attack
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.008 + 0.25); // ~250ms decay
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.34);
    // click transient (high band, doesn't feed the bass-band detector but
    // makes the hit acoustically real)
    const cs = ctx.createBufferSource(); cs.buffer = noiseBuf;
    const cf = ctx.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 3000;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.0001, t);
    cg.gain.exponentialRampToValueAtTime(0.3, t + 0.002);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
    cs.connect(cf); cf.connect(cg); cg.connect(master);
    cs.start(t); cs.stop(t + 0.03);
  }

  function schedBass(t, dur) {
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 280; f.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55, t + 0.005);      // sharp-ish attack, on purpose:
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);      // stresses the detector the same
    o.connect(f); f.connect(g); g.connect(master);             // way a kick's attack does
    o.start(t); o.stop(t + dur + 0.02);
  }

  function schedHat(t) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + 0.06);
  }

  function schedPad(t0, t1) {
    [110, 138.6, 164.8].forEach(fr => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.045, t0 + 0.5);
      g.gain.setValueAtTime(0.045, Math.max(t0 + 0.5, t1 - 0.2));
      g.gain.linearRampToValueAtTime(0.0001, t1);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t1 + 0.05);
    });
  }

  const beatDur = 60 / bpm;
  const leadIn = 0.4; // lets AUDIOIN prime its flux baseline on near-silence first
  const startAt = ctx.currentTime + leadIn;
  const endAt = startAt + durationSec;
  const kickTimes = [], bassTimes = [], hatTimes = [];
  for (let t = startAt; t < endAt; t += beatDur) {
    schedKick(t); kickTimes.push(t);
    // 16th-note bassline on ALL 4 subdivisions of the beat, INCLUDING the
    // downbeat — so some bass notes deliberately land exactly on the kick
    // (the "layered" case), and the other three are the off-beat stress
    // test (must NOT trigger).
    for (let sub = 0; sub < 4; sub++) {
      const st = t + sub * beatDur / 4;
      schedBass(st, (beatDur / 4) * 0.85);
      bassTimes.push(st);
    }
    for (let sub = 0; sub < 2; sub++) {
      const st = t + sub * beatDur / 2;
      schedHat(st);
      hatTimes.push(st);
    }
  }
  schedPad(startAt, endAt);

  // ctx-time -> performance.now() mapping (one real AudioContext's clock is
  // effectively lockstep with performance.now(); AUDIOIN._wire() below opens
  // a SECOND real AudioContext to analyze the stream, whose currentTime we
  // never read — all measurement happens on this shared performance.now()
  // timeline instead, so there's nothing to reconcile).
  const t0Perf = performance.now(), t0Ctx = ctx.currentTime;
  const ctxToPerf = (ct) => t0Perf + (ct - t0Ctx) * 1000;

  // ---- wire the synthesized loop into the REAL engine, exactly like a
  // live mic/line-in/captured-app stream would (connect()/captureAppAudio()
  // both funnel into this same _wire()).
  AUDIOIN._wire(dest.stream);
  AUDIOIN.connected = true;
  AUDIOIN._testOverride = false;
  AUDIOIN.denied = false;

  // ---- measurement loop: independent rAF poll of AUDIOIN.onset (engine
  // detection) and, if a scene is open, SRC-43.10's own s.kick envelope
  // (rising edge = a single-frame jump too big to be the envelope's own
  // decay — its decay is a small multiplicative fraction per frame, its
  // hits are Math.max() snaps, so any frame-over-frame INCREASE past a
  // small threshold can only be a fresh hit).
  const detections = [];
  const sceneDet = [];
  const kickPoll = [], kickExact = [];
  const frameDts = []; let prevPoll = 0;   // AUDIOIN.kick: frame the poll saw it / its back-dated sample time
  let prevHigh = false, prevKick = 0, prevN = AUDIOIN.kick ? AUDIOIN.kick.n : 0;
  const pollEnd = ctxToPerf(endAt) + 1200; // + tail, to catch trailing decay/detection
  await new Promise((resolve) => {
    function poll() {
      const now = performance.now();
      if (prevPoll) frameDts.push(now - prevPoll); prevPoll = now;
      const on = AUDIOIN.onset > 0.5;
      if (on && !prevHigh) detections.push(now);
      prevHigh = on;
      if (AUDIOIN.kick && AUDIOIN.kick.n !== prevN) {
        prevN = AUDIOIN.kick.n;
        kickPoll.push(now);
        // AUDIOIN.ctx is the engine's own context; map its clock to perf via its own offset
        kickExact.push(now - (AUDIOIN.ctx.currentTime - AUDIOIN.kick.t) * 1000);
      }
      if (sceneOpen && window.focus && focus.P && focus.P.state) {
        const st = focus.P.state;
        const k = typeof st.kBass === 'number' ? st.kBass : (typeof st.kick === 'number' ? st.kick : 0);
        if (k - prevKick > 0.04) sceneDet.push(now);
        prevKick = k;
      }
      if (now < pollEnd) requestAnimationFrame(poll); else resolve();
    }
    requestAnimationFrame(poll);
  });

  return {
    bpm, durationSec,
    kickTimes: kickTimes.map(ctxToPerf),
    bassTimes: bassTimes.map(ctxToPerf),
    hatTimes: hatTimes.map(ctxToPerf),
    detections,
    kickPoll, kickExact,
    frameDtMedianMs: (() => { const a = [...frameDts].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; })(),
    sceneDetections: sceneDet,
    onsetCountAtEnd: AUDIOIN.onsetCount,
    calAtEnd: JSON.parse(JSON.stringify(AUDIOIN.cal)),
  };
}, { bpm: BPM, durationSec: DURATION, sceneOpen });

await browser.close();

// ---- 7. score it ------------------------------------------------------------
function median(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function p90(a) { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(0.9 * s.length) - 1)]; }
function nearest(arr, t) { let best = Infinity; for (const x of arr) best = Math.min(best, Math.abs(x - t)); return best === Infinity ? null : best; }

function score(kicks, dets, bass, hats, tolMs = 80) {
  const used = new Array(dets.length).fill(false);
  const matches = [], misses = [];
  for (const k of kicks) {
    let bestI = -1, bestAbs = Infinity;
    for (let i = 0; i < dets.length; i++) {
      if (used[i]) continue;
      const d = dets[i] - k;
      if (Math.abs(d) <= tolMs && Math.abs(d) < bestAbs) { bestAbs = Math.abs(d); bestI = i; }
    }
    if (bestI >= 0) { used[bestI] = true; matches.push({ kickT: k, detT: dets[bestI], latencyMs: dets[bestI] - k }); }
    else misses.push(k);
  }
  const falsePositives = dets
    .map((d, i) => ({ d, i }))
    .filter(({ i }) => !used[i])
    .map(({ d }) => ({
      t: d,
      nearestBassMs: nearest(bass, d),
      nearestHatMs: nearest(hats, d),
      nearestKickMs: nearest(kicks, d),
    }));
  const lat = matches.map(m => m.latencyMs);
  return {
    kicks: kicks.length, detections: dets.length,
    matched: matches.length, misses: misses.length, falsePositives: falsePositives.length,
    latencyMedianMs: median(lat), latencyP90Ms: p90(lat),
    latencyMinMs: lat.length ? Math.min(...lat) : null, latencyMaxMs: lat.length ? Math.max(...lat) : null,
    matches, missesDetail: misses, falsePositivesDetail: falsePositives,
  };
}

const engine = score(result.kickTimes, result.detections, result.bassTimes, result.hatTimes, 80);
const scene = sceneOpen ? score(result.kickTimes, result.sceneDetections, result.bassTimes, result.hatTimes, 80) : null;
const kPoll = score(result.kickTimes, result.kickPoll, result.bassTimes, result.hatTimes, 80);
const kExact = score(result.kickTimes, result.kickExact, result.bassTimes, result.hatTimes, 80);

const report = {
  bpm: result.bpm, durationSec: result.durationSec, sceneId: sceneOpen ? sceneId : null,
  engineOnset: engine,
  engineKickPoll: kPoll,
  engineKickExact: kExact,
  harnessFrameDtMedianMs: result.frameDtMedianMs,
  sceneKick: scene,
  calAtEnd: result.calAtEnd,
  caveats: [
    'Measures the in-browser analysis pipeline only (Web Audio graph -> ' +
    'MediaStreamAudioDestinationNode -> AUDIOIN._wire()/AnalyserNode -> ' +
    'AUDIOIN.tick() -> onset). No real microphone, ADC, OS audio stack, ' +
    'speaker or room is involved, so real mic/OS input latency and acoustic ' +
    'response are NOT captured here — only the code path, which a real mic ' +
    'or captured-app-audio source also runs through via the same _wire().',
    'Detection timestamps and scheduled-note timestamps are both on the ' +
    "page's performance.now() timeline; the synth AudioContext's own " +
    'currentTime is converted onto it once at test start via a fixed offset ' +
    '(two real, un-throttled AudioContexts on one machine drift negligibly ' +
    'over a 20s run).',
  ],
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

function fmt(ms) { return ms === null || ms === undefined ? 'n/a' : ms.toFixed(1) + 'ms'; }
log('');
log('==== kicktest report =========================================');
log(`BPM ${report.bpm}  duration ${report.durationSec}s  scene ${report.sceneId || '(none)'}`);
log('---- engine onset (AUDIOIN.onset, legacy FFT path; kick now raises it too) ----');
log(`kicks ${engine.kicks}  matched ${engine.matched}  misses ${engine.misses}  falsePositives ${engine.falsePositives}`);
log(`latency median ${fmt(engine.latencyMedianMs)}  p90 ${fmt(engine.latencyP90Ms)}  min ${fmt(engine.latencyMinMs)}  max ${fmt(engine.latencyMaxMs)}`);
if (engine.falsePositivesDetail.length) {
  log('false positives (closest bass/hat note):');
  for (const fp of engine.falsePositivesDetail.slice(0, 20)) {
    log(`  t+${(fp.t - result.kickTimes[0]).toFixed(0)}ms  nearestBass ${fmt(fp.nearestBassMs)}  nearestHat ${fmt(fp.nearestHatMs)}  nearestKick ${fmt(fp.nearestKickMs)}`);
  }
  if (engine.falsePositivesDetail.length > 20) log(`  ...and ${engine.falsePositivesDetail.length - 20} more`);
}
log(`harness rAF interval median ${fmt(result.frameDtMedianMs)} (poll latency can never beat this; a real 60fps rig is 16.7ms)`);
log('---- engine kick (AUDIOIN.kick, time-domain LP150 scanner) ----');
log(`poll  : matched ${kPoll.matched}/${kPoll.kicks}  misses ${kPoll.misses}  FP ${kPoll.falsePositives}  latency median ${fmt(kPoll.latencyMedianMs)}  p90 ${fmt(kPoll.latencyP90Ms)}`);
log(`exact : matched ${kExact.matched}/${kExact.kicks}  misses ${kExact.misses}  FP ${kExact.falsePositives}  latency median ${fmt(kExact.latencyMedianMs)}  p90 ${fmt(kExact.latencyP90Ms)}  (back-dated sample time)`);
for (const fp of kPoll.falsePositivesDetail.slice(0, 8)) log(`  FP t+${(fp.t - result.kickTimes[0]).toFixed(0)}ms nearestBass ${fmt(fp.nearestBassMs)} nearestKick ${fmt(fp.nearestKickMs)}`);
if (scene) {
  log(`---- scene: ${sceneId} own kick envelope (kBass) rising edges ----`);
  log(`kicks ${scene.kicks}  matched ${scene.matched}  misses ${scene.misses}  falsePositives ${scene.falsePositives}`);
  log(`latency median ${fmt(scene.latencyMedianMs)}  p90 ${fmt(scene.latencyP90Ms)}  min ${fmt(scene.latencyMinMs)}  max ${fmt(scene.latencyMaxMs)}`);
}
log('----------------------------------------------------------------');
log('JSON written to', OUT);
