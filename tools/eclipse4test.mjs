// eclipse4test.mjs — SRC-66.3 vs SRC-66.4 (Light Eclipse): what the sound does
// under the hands. RMS and spectral centroid at the hand poles, pad/sub
// pitches, how fast the tone answers a hand step, and 1920x1200 shots.
//   node tools/eclipse4test.mjs [ids,comma] [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'fs';
const IDS = (process.argv[2] || 'SRC-66.3,SRC-66.4').split(',');
const BASE = process.argv[3] || 'http://127.0.0.1:8765';
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', '--ignore-gpu-blocklist'] });
fs.mkdirSync('scratchshots', { recursive: true });
for (const id of IDS) {
  const pg = await b.newPage({ viewport: { width: 1920, height: 1200 } });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html#scene=' + id, { waitUntil: 'load' });
  await pg.waitForTimeout(1500);
  const open = await pg.evaluate(() => {
    AE.on = true; AE.ensure();
    if (!focus.voice && typeof startVoice === 'function') startVoice();
    const an = AE.ctx.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0;
    AE.master.connect(an); window.__an = an;
    document.getElementById('overlay').classList.add('fs', 'zen');
    return PIECES[focus.idx] && PIECES[focus.idx].id;
  });
  // one reading: RMS (dBFS) and spectral centroid (Hz) of the master, averaged
  const meas = () => pg.evaluate(async () => {
    const an = window.__an, sr = AE.ctx.sampleRate, N = an.frequencyBinCount;
    const td = new Float32Array(an.fftSize), fd = new Float32Array(N);
    let rs = 0, cs = 0, n = 0;
    for (let k = 0; k < 10; k++) {
      an.getFloatTimeDomainData(td); an.getFloatFrequencyData(fd);
      // AUDIBLE band only (>= 30 Hz): V3's 21.8 Hz sub carried most of its raw RMS and nobody hears it
      const i0 = Math.ceil(30 * an.fftSize / sr);
      let e = 0, num = 0, den = 0;
      for (let i = i0; i < N; i++) { const pw = Math.pow(10, fd[i] / 10), m = Math.sqrt(pw); e += pw; num += m * i * sr / an.fftSize; den += m; }
      rs += e;
      cs += den > 0 ? num / den : 0; n++;
      await new Promise(r => setTimeout(r, 60));
    }
    return { db: +(10 * Math.log10(rs / n + 1e-12)).toFixed(1), cen: Math.round(cs / n) };
  });
  const pose = async (L, R, ms) => { await pg.evaluate(({ L, R }) => { setChan('L', L); setChan('R', R); }, { L, R }); await pg.waitForTimeout(ms); };
  console.log('\n== ' + id + ' (open: ' + open + ')');
  const rows = [];
  for (const [L, R] of [[0, 0], [0.5, 0.5], [1, 0], [0, 1], [1, 1]]) {
    await pose(L, R, 2500);
    const m = await meas();
    rows.push({ L, R, ...m });
    if ((L === 0 && R === 0) || (L === 1 && R === 1) || (L === 0.5)) await pg.screenshot({ path: `scratchshots/e_${id}_${L}_${R}.png` });
  }
  console.table(rows);
  // response: step R 0 -> 1; how long until the hand the SOUND reads is 90% there
  await pose(0.5, 0, 2500);
  const resp = await pg.evaluate(() => new Promise(res => {
    const s = focus.P.state, k = s.aR !== undefined ? 'aR' : 'x', t0 = performance.now();
    setChan('R', 1);
    const f = () => { if (s[k] > 0.9 || performance.now() - t0 > 2000) res([k, Math.round(performance.now() - t0)]); else requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }));
  console.log('  R step 0->1: the sound\'s hand (' + resp[0] + ') 90% there in', resp[1], 'ms');
  await pg.waitForTimeout(2000);
  const st = await pg.evaluate(() => { const s = focus.P.state; return { pres: s.pres, stage: s.stage, rungs: s.rungs, m: s.m, x: s.x }; });
  console.log('  state', JSON.stringify(st));
  const fps = await pg.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const t = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(t); else res(Math.round(n / 3)); }; requestAnimationFrame(t); }));
  console.log('  fps', fps, ' errors', errs.length ? errs.slice(0, 3) : 'none');
  await pg.close();
}
await b.close();
