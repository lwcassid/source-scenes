// point4test.mjs — SRC-56.4 The Point, Voiced: the ladder is harmonic, the
// notes pulse (quick attack, slow return), and 1920x1200 shots of both poles.
//   node tools/point4test.mjs [baseUrl]
import { chromium } from 'playwright-core';
import fs from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:8765';
let fails = 0;
const ok = (n, c, got) => { console.log((c ? '  ok   ' : '  FAIL ') + n + (c ? '' : '  got: ' + JSON.stringify(got))); if (!c) fails++; };
const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const pg = await b.newPage({ viewport: { width: 1920, height: 1200 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));
await pg.goto('about:blank');
await pg.goto(BASE + '/index.html#scene=SRC-56.4', { waitUntil: 'load' });
await pg.waitForTimeout(150);
const early = await pg.evaluate(() => { const s = focus.P && focus.P.state; return s ? { env: s.env, notes: s.notes } : null; });
await pg.waitForTimeout(3350);
const st = () => pg.evaluate(() => { const s = focus.P.state; return { motion: s.motion, id: PIECES[focus.idx] && PIECES[focus.idx].id, size: s.size, heat: s.heat, midi: s.midi, semis: H.chordSemis.join(), notes: s.notes, env: s.env, envNote: s.envNote, envRoom: s.envRoom }; });
ok('opening fires nothing (no pulse, no note)', early && early.env < 0.05 && early.notes === 0, early);
ok('SRC-56.4 is open', (await st()).id === 'SRC-56.4', await st());

// the ladder: sweep R slowly; every note held is in the key, in F2..F4, rising
await pg.evaluate(() => setChan('R', 0)); await pg.waitForTimeout(800);
const sweep = [];
for (let i = 0; i <= 40; i++) { await pg.evaluate(v => setChan('R', v), i / 40); await pg.waitForTimeout(120); const q = await st(); sweep.push([i / 40, q.midi, q.semis]); }
const ms = sweep.map(r => r[1]); const rising = ms.every((m, i) => i === 0 || m >= ms[i - 1]);
console.log('  sweep notes', [...new Set(ms)].join(' '), ' (chords seen:', [...new Set(sweep.map(r => r[2]))].join(' | ') + ')');
const keyOk = await pg.evaluate(ms => { const pcs = [0,1,2,3,4,5,6].map(d => ((H.degSemi(d) % 12) + 12) % 12); return ms.every(m => pcs.includes(m % 12)); }, ms);
ok('every held note is in the key (F aeolian)', keyOk, ms);
ok('many notes under the hand (>= 12 distinct)', new Set(ms).size >= 12, [...new Set(ms)]);
ok('the sweep only rises (no fold-back)', rising, ms);
ok('range F2..F4', Math.min(...ms) >= 41 && Math.max(...ms) <= 65 && Math.max(...ms) === 65, [Math.min(...ms), Math.max(...ms)]);
await pg.evaluate(() => document.getElementById('overlay').classList.add('fs', 'zen'));
fs.mkdirSync('scratchshots', { recursive: true });
const pose = async (L, R, ms) => { await pg.evaluate(({ L, R }) => { setChan('L', L); setChan('R', R); }, { L, R }); await pg.waitForTimeout(ms); };

// both hands at the Source (setChan 0 = lean-in = FAR? follow the law: 1 = far)
await pose(0, 0, 2500);
let a = await st(); console.log('  source:', JSON.stringify(a));
await pg.screenshot({ path: 'scratchshots/p4_source.png' });
await pose(1, 1, 2500);
let z = await st(); console.log('  wide:  ', JSON.stringify(z));
ok('L far is bigger than L near', z.size > a.size + 0.3, [a.size, z.size]);
ok('R far is F4', z.midi === 65, z.midi);
await pg.waitForTimeout(2500);
await pg.screenshot({ path: 'scratchshots/p4_wide.png' });

// a new note: pulse jumps, then falls back over ~1 s
await pose(0.5, 0.2, 2500);
const n0 = (await st()).notes;
await pg.evaluate(() => setChan('R', 0.5));
const trace = [];
for (let i = 0; i < 14; i++) { const s = await st(); trace.push([i * 100, +s.envNote.toFixed(2), s.midi]); if (i === 2) await pg.screenshot({ path: 'scratchshots/p4_pulse.png' }); await pg.waitForTimeout(100); }
console.log('  pulse trace [ms, envNote, midi]:', JSON.stringify(trace));
const peak = Math.max(...trace.map(r => r[1]));
ok('a new note pulses (sampled peak > 0.45; the hit itself is 1.0)', peak > 0.45, peak);
ok('it returns slowly (still > 0.05 ~1 s later, < 0.4)', trace[11][1] > 0.02 && trace[11][1] < 0.4, trace[11]);
ok('notes counted', (await st()).notes > n0, n0);

// jitter on a REAL boundary: F3 (53) / G3 (55) midpoint is 54 → R = 13/24 = 0.5417
await pose(0.5, 0.52, 1500);
const r0 = await st();
for (let i = 0; i < 20; i++) { await pg.evaluate(v => setChan('R', v), 0.5417 + (i % 2 ? 0.006 : -0.006)); await pg.waitForTimeout(200); }
const r1 = await st();
ok('±0.6% on a note boundary (F3/G3), 5 flips/s for 4 s: at most one new note', r1.notes - r0.notes <= 1, [r0.notes, r1.notes, r1.midi]);

// the BAND: level up → instant; level off → slow return; a kick jumps it; max, not sum
await pose(0.5, 0.5, 2000);
await pg.evaluate(() => setAudioIn({ level: 0.9, bass: 0.9, mid: 0.5, treble: 0.3, onset: 0, pan: 0 }));
await pg.waitForTimeout(80);
const b1 = await st();
await pg.evaluate(() => setAudioIn({ level: 0, bass: 0, mid: 0, treble: 0, onset: 0, pan: 0 }));
await pg.waitForTimeout(500);
const b2 = await st();
console.log('  band: on', b1.envRoom.toFixed(2), '→ 0.5 s after off', b2.envRoom.toFixed(2));
ok('the band lifts it at once', b1.envRoom > 0.5, b1);
ok('and it returns slowly (0.15..0.6 of the hit after 0.5 s)', b2.envRoom > 0.15 * b1.envRoom && b2.envRoom < 0.6 * b1.envRoom, [b1.envRoom, b2.envRoom]);
await pg.waitForTimeout(3000);
await pg.evaluate(() => { setAudioKick(1); setChan('R', 0.2); });
await pg.waitForTimeout(60);
const b3 = await st();
ok('a kick jumps it; a note + a kick together stay <= 1', b3.envRoom > 0.8 && b3.env <= 1.0001, b3);

// response: a hand step is followed within ~80 ms; motion is heard, stillness settles
await pose(0.3, 0.3, 1500);
await pg.evaluate(() => setChan('L', 0.8)); await pg.waitForTimeout(80);
const q1 = await st();
const cv = await pg.evaluate(() => focus.P.state.size - chan.L.v);
ok('the dot tracks the core hand channel within two frames mid-glide (|size - chan.L.v| < 0.1)', Math.abs(cv) < 0.1, cv);
ok('a moving hand is heard (motion > 0.5)', q1.motion > 0.5, q1.motion);
await pg.waitForTimeout(1500);
ok('a still hand settles (motion < 0.05)', (await st()).motion < 0.05, (await st()).motion);
const fps = await pg.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const t = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(t); else res(Math.round(n / 3)); }; requestAnimationFrame(t); }));
console.log('  fps', fps);
ok('no page errors', errs.length === 0, errs.slice(0, 3));
await b.close();
console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
