// Band-sensitivity / saturation harness for AUDIOIN (parts/part2e_audioin.js).
//
// Answers, with numbers, the question kicktest.mjs cannot: "is the audio
// engine SATURATING?" — i.e. do inp.audio.bass/mid/treble/level actually
// MOVE when a real, mastered dance track is playing, or do they sit pinned
// at 1.0 (clipped) / 0.0 (dead)?
//
// Usage (run from the repo root, like tools/kicktest.mjs):
//   node tools/bandtest.mjs
//   GAIN=-12 node tools/bandtest.mjs
//   GAIN=-24 START=120 DURATION=60 SETTLE=15 node tools/bandtest.mjs
//   node tools/bandtest.mjs --compare scratchshots/a.json scratchshots/b.json ...
//
// env:
//   TRACK=path        audio file to play through the engine
//                     (default ~/Downloads/Wonderlight/source-scenes/Leila.mp3)
//   GAIN=0|-12|-24    input staging in dB, applied by a GainNode before the
//                     MediaStreamAudioDestinationNode (default 0)
//   START=90          seconds into the track to start (default 90 — a real
//                     groove, not the intro)
//   DURATION=45       seconds of playback (default 45)
//   SETTLE=15         seconds of playback discarded before measuring
//                     (default 15; must be < DURATION)
//   SCENE=none        scene to openFocus() first ("none"/blank = wall only,
//                     the default — AUDIOIN.tick() runs off part5_tail.js's
//                     frame() either way, so no scene is needed)
//   CHROMIUM=...      path to a real Chrome/Chromium binary (see shot.mjs)
//   OUT=...           output JSON (default scratchshots/bandtest_<gain>.json)
//   REBUILD=0         skip the preview freshness check
//
// What it does:
//  1. rebuilds night-circuit-preview.html if missing/stale, same offline
//     artifact shot.mjs / kicktest.mjs use.
//  2. opens it headless (swiftshader) with localStorage cleared, so the
//     engine starts from a virgin calibration exactly like a show laptop
//     that has never run this build.
//  3. INSIDE the page: decodeAudioData()s the REAL track in a second real
//     AudioContext, plays the requested excerpt through an
//     AudioBufferSourceNode -> GainNode(GAIN dB) ->
//     MediaStreamAudioDestinationNode, and wires that stream into the live
//     engine via AUDIOIN._wire(stream); AUDIOIN.connected = true — the exact
//     code path a real mic / line-in / captured-app stream takes, so
//     AUDIOIN.tick() (already running every rAF off part5_tail.js's main
//     loop) does the real analysis, mapping and calibration.
//     A monitoring analyser sits on the same node the stream is fed from, so
//     the report can state the TRUE input RMS dBFS it delivered rather than
//     assuming the staging worked.
//  4. samples AUDIOIN.level/bass/mid/treble — and sub/lowmid/db/dev/flux if
//     the engine has them; MISSING FIELDS ARE SIMPLY SKIPPED, so this runs
//     unchanged against both the current engine and the reworked one —
//     every rAF frame, discarding the first SETTLE seconds.
//  5. reports per signal p5/p25/p50/p75/p95, the fraction of frames above
//     0.95 and below 0.02, and a 20-bucket ASCII histogram, then a PASS/FAIL
//     verdict. Exits non-zero on FAIL so it works as a gate.
//
// --compare a.json b.json [...]  reads finished reports and checks the
// cross-gain-staging criterion (band distributions within ~0.1 across
// stagings — the AGC actually doing its job). No browser, no playback.
//
// CAVEAT (same as kicktest): this measures the in-browser analysis pipeline
// only — Web Audio graph -> MediaStreamAudioDestinationNode -> AUDIOIN's
// AnalyserNodes -> AUDIOIN.tick(). No microphone, ADC, OS audio stack,
// speaker or room is involved. That is the point: it isolates the CODE PATH,
// which is the same path a real mic or captured-app source runs through.

import { chromium } from 'playwright-core';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// ---------------------------------------------------------------- pass gate
const PASS = {
  maxFracAbove: 0.05,   // < 5% of frames above HI
  maxFracBelow: 0.05,   // < 5% of frames below LO
  HI: 0.95,
  LO: 0.02,
  minSpread: 0.55,      // p95 - p5
  crossGainTol: 0.10,   // max percentile drift between input stagings
};
const GRADED = ['level', 'bass', 'mid', 'treble'];       // required to pass
const ADVISORY = ['sub', 'lowmid'];                       // reported, not fatal

function log(...a) { console.log(...a); }

// ================================================================= --compare
const argv = process.argv.slice(2);
if (argv[0] === '--compare') {
  const files = argv.slice(1);
  if (files.length < 2) { console.error('--compare needs >= 2 report JSON paths'); process.exit(2); }
  const reports = files.map(f => ({ f, r: JSON.parse(fs.readFileSync(f, 'utf8')) }));
  const keys = ['p5', 'p25', 'p50', 'p75', 'p95'];
  let fail = false;
  log('');
  log('==== bandtest cross-staging comparison ===========================');
  log('files: ' + reports.map(x => `${path.basename(x.f)} (gain ${x.r.config.gainDb}dB)`).join(', '));
  for (const sig of [...GRADED, ...ADVISORY]) {
    const present = reports.filter(x => x.r.stats[sig]);
    if (present.length < 2) continue;
    let worst = 0, worstKey = '';
    for (const k of keys) {
      const vals = present.map(x => x.r.stats[sig][k]);
      const d = Math.max(...vals) - Math.min(...vals);
      if (d > worst) { worst = d; worstKey = k; }
    }
    const req = GRADED.includes(sig);
    const ok = worst <= PASS.crossGainTol;
    if (req && !ok) fail = true;
    log(`  ${sig.padEnd(8)} max percentile drift ${worst.toFixed(3)} (at ${worstKey})  ` +
        `${ok ? 'ok' : 'DRIFT'}${req ? '' : ' [advisory]'}`);
  }
  log(`tolerance: <= ${PASS.crossGainTol}`);
  log(fail ? 'CROSS-STAGING: FAIL' : 'CROSS-STAGING: PASS');
  log('=================================================================');
  process.exit(fail ? 1 : 0);
}

// ==================================================================== config
const HOME = os.homedir();
const TRACK = process.env.TRACK || path.join(HOME, 'Downloads/Wonderlight/source-scenes/Leila.mp3');
const GAIN_DB = process.env.GAIN === undefined ? 0 : +process.env.GAIN;
const START = process.env.START === undefined ? 90 : +process.env.START;
const DURATION = process.env.DURATION === undefined ? 45 : +process.env.DURATION;
const SETTLE = process.env.SETTLE === undefined ? 15 : +process.env.SETTLE;
const SCENE = process.env.SCENE === undefined ? 'none' : process.env.SCENE;
const sceneId = (SCENE && SCENE.toLowerCase() !== 'none') ? SCENE : null;
const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PREVIEW = 'night-circuit-preview.html';
const gainTag = (GAIN_DB === 0 ? '0' : String(GAIN_DB)) + 'db';
const OUT = process.env.OUT || `scratchshots/bandtest_${gainTag}.json`;

if (!(SETTLE < DURATION)) { console.error('FATAL: SETTLE must be < DURATION'); process.exit(2); }
if (!fs.existsSync(TRACK)) { console.error('FATAL: track not found: ' + TRACK); process.exit(2); }

// -------------------------------------------- 1. preview artifact freshness
function needsRebuild() {
  if (!fs.existsSync(PREVIEW)) return true;
  try {
    const out = execSync(
      `find parts index.html tools/build.sh tools/build_preview.py -newer ${PREVIEW} 2>/dev/null`,
      { encoding: 'utf8' }
    ).trim();
    return out.length > 0;
  } catch (e) { return true; }
}
if (process.env.REBUILD !== '0' && needsRebuild()) {
  log('preview missing/stale -> bash tools/build.sh && python3 tools/build_preview.py');
  execSync('bash tools/build.sh', { stdio: 'inherit' });
  execSync('python3 tools/build_preview.py', { stdio: 'inherit' });
} else {
  log('preview up to date, skipping rebuild');
}
if (!fs.existsSync(PREVIEW)) { console.error('FATAL: ' + PREVIEW + ' still missing after build'); process.exit(1); }

const trackB64 = fs.readFileSync(TRACK).toString('base64');
log(`track ${TRACK} (${(fs.statSync(TRACK).size / 1e6).toFixed(1)} MB)`);
log(`gain ${GAIN_DB} dB · start ${START}s · duration ${DURATION}s · settle ${SETTLE}s · scene ${sceneId || '(none)'}`);

// ------------------------------------------------------- 2. launch and open
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
page.on('console', msg => { if (/^\[bandtest\]/.test(msg.text())) log(msg.text()); });
// virgin calibration: a show laptop that has never run this build. Also stops
// a saturated srcAudioInCal from a prior run leaking into a measurement.
await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2000);

if (sceneId) {
  const idx = await page.evaluate((id) => {
    const i = (typeof PIECES !== 'undefined') ? PIECES.findIndex(p => p.id === id) : -1;
    if (i >= 0) openFocus(i);
    return i;
  }, sceneId);
  log('scene index for', sceneId, '=', idx);
  if (idx < 0) log('WARNING: scene not found, continuing on the wall');
  else await page.waitForTimeout(1500);
}

// ------------------- 3-4. play the real track into the real engine, sample
const rec = await page.evaluate(async ({ b64, gainDb, start, duration, settle }) => {
  const say = m => console.log('[bandtest] ' + m);

  // base64 -> ArrayBuffer
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }

  const buf = await ctx.decodeAudioData(bytes.buffer);
  say(`decoded ${buf.duration.toFixed(1)}s ${buf.numberOfChannels}ch @${buf.sampleRate}Hz`);

  const startOff = Math.min(start, Math.max(0, buf.duration - duration - 0.5));
  const gain = ctx.createGain();
  gain.gain.value = Math.pow(10, gainDb / 20);

  const dest = ctx.createMediaStreamDestination();
  gain.connect(dest);
  // zero-gain tap to hardware output: some engines throttle a graph with
  // nothing routed to destination (same trick kicktest.mjs uses).
  const silent = ctx.createGain(); silent.gain.value = 0;
  gain.connect(silent); silent.connect(ctx.destination);

  // truth-teller: what is ACTUALLY being handed to the engine, post-gain.
  const monAn = ctx.createAnalyser();
  monAn.fftSize = 2048; monAn.smoothingTimeConstant = 0;
  monAn.channelCount = 1; monAn.channelCountMode = 'explicit';
  gain.connect(monAn);
  const monBuf = new Float32Array(monAn.fftSize);
  let monSumSq = 0, monN = 0, monPeak = 0;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(gain);

  // wire into the REAL engine — identical to a live mic/line-in stream
  AUDIOIN._wire(dest.stream);
  AUDIOIN.connected = true;
  AUDIOIN._testOverride = false;
  AUDIOIN.denied = false;
  if (AUDIOIN.ctx && AUDIOIN.ctx.state !== 'running') { try { await AUDIOIN.ctx.resume(); } catch (e) {} }

  const t0 = ctx.currentTime + 0.15;
  src.start(t0, startOff, duration + 0.5);

  // -------- sample every rAF ------------------------------------------
  // Field discovery is dynamic: anything the engine exposes and this build
  // understands gets sampled; anything absent is silently skipped, so the
  // harness runs against the current engine AND the reworked one.
  const SCALARS = ['level', 'bass', 'mid', 'treble', 'sub', 'lowmid', 'onset', 'pan'];
  const GROUPS = ['db', 'dev', 'flux'];
  const series = {};
  // A DROPPED SAMPLE IS A FINDING, NOT A TIDY-UP. This used to silently skip
  // NaN/+-Infinity, so a signal that went NaN on 90% of frames would have its
  // percentiles computed from the surviving 10% and print a perfectly normal
  // PASS — while every scene reading inp.audio.<sig> drew nothing (clamp()
  // passes NaN straight through: NaN<0 and NaN>1 are both false). Count them
  // instead; the scoring below fails the run outright if a graded signal is
  // missing even one frame, and the report prints n per signal.
  const dropped = {};
  const push = (k, v) => {
    if (typeof v === 'number' && isFinite(v)) (series[k] || (series[k] = [])).push(v);
    else { dropped[k] = (dropped[k] || 0) + 1; if (!series[k]) series[k] = []; }
  };

  // PRE-NORMALIZATION diagnostics. The public fields are post-calibration, so
  // they can look healthy while the analysis underneath is already clipped.
  // Recompute the engine's own bandEnergy() straight off its byte FFT buffer
  // (`raw.*`), and measure what fraction of each band's bins are literally
  // 255 (`sat.*`) — that is the direct evidence for or against "the byte FFT
  // is pinned at its -30 dBFS ceiling". Skipped entirely once the engine
  // stops using a Uint8 buffer, like every other optional field here.
  const byteFft = () => (AUDIOIN.freqBuf && AUDIOIN.freqBuf.BYTES_PER_ELEMENT === 1 &&
                         AUDIOIN.analyserMono && AUDIOIN.ctx) ? AUDIOIN.freqBuf : null;
  function rawDiag() {
    const fb = byteFft(); if (!fb) return;
    const binHz = AUDIOIN.ctx.sampleRate / AUDIOIN.analyserMono.fftSize;
    const bands = AUDIOIN.BANDS || {};
    for (const name in bands) {
      const [lo, hi] = bands[name];
      const i0 = Math.max(0, Math.floor(lo / binHz)), i1 = Math.min(fb.length - 1, Math.ceil(hi / binHz));
      let sum = 0, n = 0, sat = 0;
      for (let i = i0; i <= i1; i++) { sum += fb[i]; n++; if (fb[i] >= 255) sat++; }
      if (!n) continue;
      push('raw.' + name, (sum / n) / 255);
      push('sat.' + name, sat / n);
    }
    let satAll = 0;
    for (let i = 0; i < fb.length; i++) if (fb[i] >= 255) satAll++;
    push('sat.allbins', satAll / fb.length);
  }

  const measureStart = t0 + settle;
  const measureEnd = t0 + duration;
  let frames = 0, onsetEdges = 0, prevOnsetHigh = false, kickN = AUDIOIN.kick ? AUDIOIN.kick.n : 0, kicks = 0;
  const frameDts = []; let prevPerf = 0;

  await new Promise(resolve => {
    function poll() {
      const now = performance.now();
      if (prevPerf) frameDts.push(now - prevPerf);
      prevPerf = now;
      const ct = ctx.currentTime;

      // input-staging truth: RMS/peak of what the engine is being fed
      monAn.getFloatTimeDomainData(monBuf);
      let s = 0, pk = 0;
      for (let i = 0; i < monBuf.length; i++) { const x = monBuf[i]; s += x * x; if (Math.abs(x) > pk) pk = Math.abs(x); }
      if (ct >= measureStart) { monSumSq += s / monBuf.length; monN++; if (pk > monPeak) monPeak = pk; }

      // onset / kick liveness (must-not-regress signals, reported not graded)
      const hot = AUDIOIN.onset > 0.5;
      if (ct >= measureStart) {
        if (hot && !prevOnsetHigh) onsetEdges++;
        if (AUDIOIN.kick && AUDIOIN.kick.n !== kickN) { kickN = AUDIOIN.kick.n; kicks++; }
      } else if (AUDIOIN.kick) { kickN = AUDIOIN.kick.n; }
      prevOnsetHigh = hot;

      if (ct >= measureStart) {
        frames++;
        for (const k of SCALARS) push(k, AUDIOIN[k]);
        for (const g of GROUPS) {
          const o = AUDIOIN[g];
          if (o && typeof o === 'object') for (const k in o) push(g + '.' + k, o[k]);
        }
        rawDiag();
      }
      if (ct < measureEnd) requestAnimationFrame(poll); else resolve();
    }
    requestAnimationFrame(poll);
  });

  try { src.stop(); } catch (e) {}
  const dbfs = v => (v > 0 ? 20 * Math.log10(v) : -Infinity);
  const inRms = monN ? Math.sqrt(monSumSq / monN) : 0;

  return {
    series, dropped, frames, onsetEdges, kicks,
    frameDts,
    measuredSeconds: measureEnd - measureStart,
    input: {
      rms: inRms, rmsDbfs: isFinite(dbfs(inRms)) ? dbfs(inRms) : null,
      peak: monPeak, peakDbfs: isFinite(dbfs(monPeak)) ? dbfs(monPeak) : null,
      gainLinear: Math.pow(10, gainDb / 20),
    },
    engine: {
      sampleRate: AUDIOIN.ctx ? AUDIOIN.ctx.sampleRate : null,
      fftSize: AUDIOIN.analyserMono ? AUDIOIN.analyserMono.fftSize : null,
      smoothing: AUDIOIN.analyserMono ? AUDIOIN.analyserMono.smoothingTimeConstant : null,
      bands: AUDIOIN.BANDS ? JSON.parse(JSON.stringify(AUDIOIN.BANDS)) : null,
      calAtEnd: AUDIOIN.cal ? JSON.parse(JSON.stringify(AUDIOIN.cal)) : null,
      kickBpm: AUDIOIN.kickBpm || 0,
      fieldsSeen: Object.keys(series),
    },
    trackDuration: buf.duration,
    startOffset: startOff,
  };
}, { b64: trackB64, gainDb: GAIN_DB, start: START, duration: DURATION, settle: SETTLE });

await browser.close();

// ================================================================ 5. scoring
function pct(sorted, q) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
function stat(name, arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  const above = arr.filter(v => v > PASS.HI).length / n;
  const below = arr.filter(v => v < PASS.LO).length / n;
  const p5 = pct(s, 0.05), p25 = pct(s, 0.25), p50 = pct(s, 0.5), p75 = pct(s, 0.75), p95 = pct(s, 0.95);
  return {
    name, n, min: s[0], max: s[n - 1],
    mean: arr.reduce((a, b) => a + b, 0) / n,
    p5, p25, p50, p75, p95, spread: p95 - p5,
    fracAbove095: above, fracBelow002: below,
  };
}
const BARS = ' ▁▂▃▄▅▆▇█';
function histo(arr, lo, hi, buckets = 20) {
  const b = new Array(buckets).fill(0);
  for (const v of arr) {
    let i = Math.floor((v - lo) / (hi - lo) * buckets);
    if (i < 0) i = 0; if (i >= buckets) i = buckets - 1;
    b[i]++;
  }
  return b;
}
function histoLine(counts) {
  const mx = Math.max(...counts, 1);
  return counts.map(c => (c === 0 ? BARS[0] : BARS[Math.max(1, Math.round(c / mx * 8))])).join('');
}

const stats = {};
for (const k of Object.keys(rec.series)) {
  if (rec.series[k].length) stats[k] = stat(k, rec.series[k]);
}

let fail = false;
const verdicts = {};
for (const sig of [...GRADED, ...ADVISORY]) {
  const st = stats[sig];
  if (!st) {
    // present-but-all-non-finite is NOT "this engine doesn't have the field"
    const allBad = !!(rec.dropped && rec.dropped[sig]);
    verdicts[sig] = { present: allBad, required: GRADED.includes(sig), ok: false,
                      checks: { allFinite: false } };
    if (allBad && GRADED.includes(sig)) fail = true;
    continue;
  }
  const checks = {
    notPinnedHigh: st.fracAbove095 < PASS.maxFracAbove,
    notPinnedLow: st.fracBelow002 < PASS.maxFracBelow,
    spread: st.spread >= PASS.minSpread,
    // every measured frame must have produced a real number for this signal
    allFinite: st.n === rec.frames && !(rec.dropped && rec.dropped[sig]),
  };
  const ok = checks.notPinnedHigh && checks.notPinnedLow && checks.spread && checks.allFinite;
  const required = GRADED.includes(sig);
  if (required && !ok) fail = true;
  verdicts[sig] = { present: true, required, ok, checks };
}

const frameDtsSorted = [...rec.frameDts].sort((a, b) => a - b);
const report = {
  tool: 'tools/bandtest.mjs',
  when: new Date().toISOString(),
  config: {
    track: TRACK, gainDb: GAIN_DB, startSec: START, durationSec: DURATION,
    settleSec: SETTLE, measuredSeconds: rec.measuredSeconds, scene: sceneId,
    preview: PREVIEW, passCriteria: PASS, graded: GRADED, advisory: ADVISORY,
  },
  input: rec.input,
  engine: rec.engine,
  frames: rec.frames,
  dropped: rec.dropped,
  frameDtMedianMs: frameDtsSorted.length ? frameDtsSorted[frameDtsSorted.length >> 1] : null,
  onsetEdges: rec.onsetEdges,
  kicks: rec.kicks,
  stats,
  verdicts,
  pass: !fail,
  caveats: [
    'Measures the in-browser analysis pipeline only: AudioBufferSource -> ' +
    'GainNode -> MediaStreamAudioDestinationNode -> AUDIOIN._wire()/' +
    'AnalyserNode -> AUDIOIN.tick(). No microphone, ADC, OS audio stack, ' +
    'speaker or room — the same code path a real mic or captured-app source ' +
    'runs through, which is exactly what is under test.',
    'localStorage is cleared before load, so the engine calibrates from ' +
    'virgin state every run (a show laptop that has never run this build).',
  ],
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

// ---------------------------------------------------------------- print it
const f3 = v => (v === null || v === undefined ? '  n/a' : v.toFixed(3));
const pctS = v => (v * 100).toFixed(1).padStart(5) + '%';
log('');
log('==== bandtest report ============================================');
log(`track ${path.basename(TRACK)}  offset ${rec.startOffset.toFixed(1)}s  gain ${GAIN_DB}dB`);
log(`fed to engine: RMS ${rec.input.rmsDbfs === null ? 'n/a' : rec.input.rmsDbfs.toFixed(2)} dBFS   ` +
    `peak ${rec.input.peakDbfs === null ? 'n/a' : rec.input.peakDbfs.toFixed(2)} dBFS`);
log(`measured ${rec.measuredSeconds.toFixed(1)}s = ${rec.frames} frames ` +
    `(rAF median ${report.frameDtMedianMs === null ? 'n/a' : report.frameDtMedianMs.toFixed(1)}ms)  ` +
    `engine SR ${rec.engine.sampleRate}  fft ${rec.engine.fftSize}`);
log(`fields seen: ${rec.engine.fieldsSeen.join(', ')}`);
log(`liveness: onset rising edges ${rec.onsetEdges}  ·  AUDIOIN.kick hits ${rec.kicks}  ·  kickBpm ${rec.engine.kickBpm}`);
log('');
log('signal      p5    p25    p50    p75    p95  spread  >0.95   <0.02      n  verdict');
log('------------------------------------------------------------------------------------');
for (const sig of [...GRADED, ...ADVISORY]) {
  const st = stats[sig];
  if (!st) { log(`${sig.padEnd(8)}  (not present in this engine)`); continue; }
  const v = verdicts[sig];
  const tag = v.ok ? 'PASS' : (v.required ? 'FAIL' : 'fail(adv)');
  const why = v.ok ? '' : ' ' + Object.entries(v.checks).filter(([, o]) => !o).map(([k]) => k).join(',');
  const nTag = String(st.n).padStart(6) + (st.n === rec.frames ? '' : ` (-${rec.frames - st.n}!)`);
  log(`${sig.padEnd(8)} ${f3(st.p5)}  ${f3(st.p25)}  ${f3(st.p50)}  ${f3(st.p75)}  ${f3(st.p95)}  ` +
      `${f3(st.spread)}  ${pctS(st.fracAbove095)} ${pctS(st.fracBelow002)} ${nTag}  ${tag}${why}`);
}
const droppedKeys = Object.keys(rec.dropped || {});
if (droppedKeys.length) {
  log('');
  log('NON-FINITE SAMPLES (NaN/Infinity reached a public field — a real defect,');
  log('not a harness artifact; a graded signal with any of these FAILS the run):');
  for (const k of droppedKeys) log(`  ${k.padEnd(12)} ${rec.dropped[k]} of ${rec.frames} frames`);
}
log('');
log('distributions (20 buckets, 0.0 -> 1.0):');
for (const sig of [...GRADED, ...ADVISORY, 'onset']) {
  const arr = rec.series[sig];
  if (!arr || !arr.length) continue;
  log(`  ${sig.padEnd(8)} |${histoLine(histo(arr, 0, 1))}|  min ${f3(stats[sig].min)} max ${f3(stats[sig].max)}`);
}
const extras = Object.keys(stats).filter(k => k.includes('.'));
if (extras.length) {
  log('');
  log('diagnostics — raw.* = pre-normalization band energy, sat.* = fraction of');
  log('that band\'s FFT bins at the byte ceiling (255), plus any new engine fields:');
  for (const k of extras) {
    const st = stats[k];
    const lo = k.startsWith('db.') ? st.min : 0, hi = k.startsWith('db.') ? st.max : 1;
    log(`  ${k.padEnd(12)} |${histoLine(histo(rec.series[k], lo, hi))}|  ` +
        `p5 ${f3(st.p5)} p50 ${f3(st.p50)} p95 ${f3(st.p95)}  [${f3(lo)}..${f3(hi)}]`);
  }
}
log('');
log(`criteria: <${(PASS.maxFracAbove * 100).toFixed(0)}% of frames >${PASS.HI}, ` +
    `<${(PASS.maxFracBelow * 100).toFixed(0)}% <${PASS.LO}, p95-p5 >= ${PASS.minSpread}  ` +
    `(graded: ${GRADED.join('/')}; advisory: ${ADVISORY.join('/')})`);
log(fail ? 'VERDICT: FAIL' : 'VERDICT: PASS');
log('cross-staging check is a separate step: node tools/bandtest.mjs --compare <json> <json> ...');
log('=================================================================');
log('JSON written to', OUT);
process.exit(fail ? 1 : 0);
