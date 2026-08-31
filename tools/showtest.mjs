// SHOWTEST — the Electron end-to-end MIDI harness.
//
// Every other harness tests the plain browser; this one launches the REAL
// show-runner (both windows, the relay, the stow/reveal lifecycle) and
// verifies the paths that kept breaking on rehearsal laptops:
//   PHASE 1 (web-app mode): operator clicks a tile with no show live — the
//     scene runs in the CONTROL window, which must stream MIDI through its
//     own local port (Lance's brittle-MIDI round; this was impossible
//     before, by ADR-0003, and nothing tested it).
//   PHASE 2 (show mode): showLive raised, scene opens in the SHOW window,
//     which must stream MIDI — including while BURIED behind the console
//     (rAF pauses for occluded windows; the watchdog must carry the music).
//
// Usage: node tools/showtest.mjs   (repo root; build_preview.py run first)
// Safe beside a running show-runner: SHOWTEST=1 skips the single-instance
// lock and uses a scratch profile. MIDI ports are STUBBED — Ableton hears
// nothing. Exits 1 on any phase failing.
import { _electron } from 'playwright-core';
import path from 'path';

const exe = path.resolve('electron/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');
const app = await _electron.launch({
  executablePath: exe,
  args: [path.resolve('electron')],
  env: { ...process.env, SHOWTEST: '1' },
});
const windows = {};
for (let i = 0; i < 40 && Object.keys(windows).length < 2; i++) {
  for (const w of app.windows()) {
    try {
      const role = await w.evaluate(() => window.ELECTRON_ROLE);
      if (role && !windows[role]) windows[role] = w;
    } catch (e) {}
  }
  if (Object.keys(windows).length < 2) await new Promise(r => setTimeout(r, 500));
}
const { show, control } = windows;
if (!show || !control) { console.error('FAIL: windows never identified', Object.keys(windows)); await app.close(); process.exit(1); }
await control.waitForFunction(() => typeof PIECES !== 'undefined' && typeof QUEUE !== 'undefined', null, { timeout: 30000 });
await show.waitForFunction(() => typeof PIECES !== 'undefined' && typeof MOut !== 'undefined', null, { timeout: 30000 });

const stubInto = win => win.evaluate(() => {
  window.__sent = { notes: 0, ccs: 0, clock: 0, chans: {} };
  window.__stub = { name: 'SHOWTEST STUB', send: (msg) => {
    if (msg[0] === 0xF8) { window.__sent.clock++; return; }
    const st = msg[0] & 0xf0, ch = (msg[0] & 0x0f) + 1;
    if (st === 0x90 && msg[2] > 0) { window.__sent.notes++; window.__sent.chans[ch] = (window.__sent.chans[ch] || 0) + 1; }
    else if (st === 0xB0) window.__sent.ccs++;
  } };
  MOut.port = window.__stub;
  window.__keepStub = setInterval(() => { if (MOut.port !== window.__stub && !(window.ELECTRON_ROLE === 'control' && showLive)) MOut.port = window.__stub; }, 400);
});
const drive = () => control.evaluate(() => { setChan('L', 1); setChan('R', 1); });
const readSent = win => win.evaluate(() => ({ ...window.__sent }));

// ---- PHASE 1: tile-click, no show live — the CONTROL window must stream
await stubInto(control);
await control.evaluate(() => { const ck = document.getElementById('ckAbleton'); if (ck && !ck.checked) ck.click(); });
await control.evaluate(() => { openFocus(PIECES.findIndex(p => p.id === 'SRC-15.23')); });
await new Promise(r => setTimeout(r, 1500));
for (let i = 0; i < 6; i++) { await drive(); await new Promise(r => setTimeout(r, 1000)); }
const p1 = await control.evaluate(() => ({ ...window.__sent, voice: !!focus.voice, mode: MOut.mode, showLive, port: MOut.port && MOut.port.name }));
console.log('PHASE 1 · web-app mode (control sends):', JSON.stringify(p1, null, 1));

// ---- PHASE 2: show mode via the REAL gesture — QUEUE.play(true) is what
// START THE SHOW clicks; SHOWTIME, per-scene OUT overrides and all.
await control.evaluate(() => { closeFocus(); });
await stubInto(show);
await control.evaluate(() => { QUEUE.play(true); });
await new Promise(r => setTimeout(r, 2500));
for (let i = 0; i < 6; i++) { await drive(); await new Promise(r => setTimeout(r, 1000)); }
const p2 = await show.evaluate(() => ({ ...window.__sent, sceneId: focus.idx >= 0 ? PIECES[focus.idx].id : null, voice: !!focus.voice, mode: MOut.mode, aeState: AE.ctx ? AE.ctx.state : 'no-ctx' }));
console.log('PHASE 2 · show mode (show window sends):', JSON.stringify(p2, null, 1));

// bury the show window behind the console, keep playing (the watchdog test)
try { await control.evaluate(() => window.focus()); } catch (e) {}
await show.evaluate(() => { window.__sent.notes = 0; window.__sent.ccs = 0; window.__sent.clock = 0; });
for (let i = 0; i < 5; i++) { await drive(); await new Promise(r => setTimeout(r, 1000)); }
const p3 = await show.evaluate(() => ({ ...window.__sent, frameFresh: performance.now() - (window.__lastFrameMs || 0) < 500 }));
console.log('PHASE 3 · show window buried:', JSON.stringify(p3, null, 1));

// ---- PHASE 4: the SOUND OUT checkboxes must bite DURING a show (console
// mode relays them to the show window — Lance found them inert there)
const ck = (id, on) => control.evaluate(([id2, on2]) => {
  const el = document.getElementById(id2);
  if (el && el.checked !== on2) el.click();
}, [id, on]);
await ck('ckAbleton', false);
await new Promise(r => setTimeout(r, 1500));
await show.evaluate(() => { window.__sent.notes = 0; });
for (let i = 0; i < 3; i++) { await drive(); await new Promise(r => setTimeout(r, 1000)); }
const ablOff = await show.evaluate(() => ({ wants: MOut.wants(), mode: MOut.mode, notes: window.__sent.notes }));
await ck('ckAbleton', true);
await new Promise(r => setTimeout(r, 1500));
await show.evaluate(() => { window.__sent.notes = 0; });
for (let i = 0; i < 3; i++) { await drive(); await new Promise(r => setTimeout(r, 1000)); }
const ablOn = await show.evaluate(() => ({ wants: MOut.wants(), mode: MOut.mode, notes: window.__sent.notes }));
await ck('ckBrowser', false);
await new Promise(r => setTimeout(r, 1500));
const spkOff = await show.evaluate(() => ({ aeOn: AE.on, master: AE.master ? +AE.master.gain.value.toFixed(4) : null }));
await ck('ckBrowser', true);
await new Promise(r => setTimeout(r, 1500));
const spkOn = await show.evaluate(() => ({ aeOn: AE.on, master: AE.master ? +AE.master.gain.value.toFixed(4) : null }));
console.log('PHASE 4 · console checkboxes:', JSON.stringify({ ablOff, ablOn, spkOff, spkOn }, null, 1));

// ---- PHASE 5: a scene whose queued OUT override is 'midi' mutes the synth
// behind the operator's back — the SYNTH box must SHOW that (unchecked) and
// checking it must genuinely bring the synth in (Lance: boxes looked inert)
await control.evaluate(() => { QUEUE.goToFamily('SRC-38'); }); // Lumen Film, out: midi
await new Promise(r => setTimeout(r, 3000));
const mid1 = await control.evaluate(() => ({ boxShows: document.getElementById('ckBrowser').checked, relayedMode: rigRelay.mode }));
await ck('ckBrowser', true);
await new Promise(r => setTimeout(r, 1500));
const mid2 = await show.evaluate(() => ({ mode: MOut.mode, master: AE.master ? +AE.master.gain.value.toFixed(4) : null }));
console.log('PHASE 5 · midi-override scene:', JSON.stringify({ mid1, mid2 }, null, 1));

await app.close();
const ok1 = p1.notes > 0, ok2 = p2.notes > 0, ok3 = p3.notes > 0;
const ok4 = ablOff.notes === 0 && !ablOff.wants && ablOn.notes > 0 && ablOn.wants &&
            spkOff.aeOn === false && (spkOff.master !== null && spkOff.master < 0.01) &&
            spkOn.aeOn === true && (spkOn.master !== null && spkOn.master > 0.1);
const ok5 = mid1.boxShows === false && mid2.mode === 'both' && (mid2.master !== null && mid2.master > 0.1);
console.log(`VERDICT: web-app ${ok1 ? 'PASS' : 'FAIL'} · show ${ok2 ? 'PASS' : 'FAIL'} · buried ${ok3 ? 'PASS' : 'FAIL'} · console-boxes ${ok4 ? 'PASS' : 'FAIL'} · midi-override ${ok5 ? 'PASS' : 'FAIL'}`);
process.exit(ok1 && ok2 && ok3 && ok4 && ok5 ? 0 : 1);
