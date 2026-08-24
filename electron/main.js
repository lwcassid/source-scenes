// Show/control instance model + IPC contract (wayfinder ticket #29,
// docs/adr/0003-electron-instance-model-and-ipc-contract.md).
//
// Two windows, one process. The show window owns AudioContext, Web MIDI
// in/out, and scene rendering exclusively (part1_head.html's
// window.ELECTRON_ROLE gate — see AE.ensure()/connectMidi() in
// part2_core.js). The control window reuses the exact same app build,
// flagged via ?role=control, and mirrors scenes silently (its own local
// openFocus() call fires, but audio/MIDI never do).
//
// Renderers never talk to each other directly — everything relays through
// this process: control's preload sends over IPC, this file forwards to
// the show window's webContents, and vice versa for telemetry.
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');

// Nima: SHOW CHECK's SOUND row sat red until someone clicked WAKE AUDIO —
// AE.ensure() (part2_core.js) already runs on every openFocus(), but a
// browser's autoplay policy holds AudioContext.resume() suspended until a
// genuine user gesture, and the show window is deliberately picture-only
// (no visible chrome to click — Nima's "none of the dials" call), so under
// the plain web app's rules it could never get one on its own. This app is
// a closed kiosk, not a general webpage, so it's safe to lift that gate —
// same flag tools/playtest.js and the shot harnesses already launch
// Chromium with for the identical reason. Must be set before app is ready.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// SCREENS' existing label()/aimedInternal()/auto-pick logic (part5_tail.js)
// already reads sc.label/width/height/isPrimary/isInternal — Electron's own
// Display objects already carry .label and .internal natively, so this is
// a rename, not a reshape. No web Window Management permission needed;
// main-process screen access has no permission gate at all (ticket #31).
function listDisplaysForRenderer() {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map(d => ({
    label: d.label || '',
    width: d.bounds.width,
    height: d.bounds.height,
    isPrimary: d.id === primaryId,
    isInternal: d.internal,
    _electronDisplayId: d.id,
  }));
}

let showWindow = null;
let controlWindow = null;
let pickedDisplayLabel = null; // ticket #37 — what display-added retries onto

// Same matching + placement logic display:pick uses, extracted so
// display-added (ticket #37) can retry it without duplicating it. Returns
// whether a match was placed, purely so the caller can log/decide.
function placeShowWindowOnLabel(label) {
  if (!showWindow || !label) return false;
  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;
  const match = displays.find(d => {
    const l = { label: d.label || '', width: d.bounds.width, height: d.bounds.height, isPrimary: d.id === primaryId };
    return `${l.label} ${l.width}×${l.height}${l.isPrimary ? ' (primary)' : ''}` === label;
  });
  if (!match) return false;
  showWindow.setBounds(match.bounds);
  showWindow.setFullScreen(true);
  return true;
}

// The whole point of this app is running the show on playa, no internet —
// index.html loads three.js from a CDN (same trap docs/SHOW-KIT.md already
// warns about for the plain Netlify site), so this loads the offline,
// vendored artifact instead (`python3 tools/build_preview.py`, already a
// required pre-show step per SHOW-KIT.md, functionally identical to
// index.html — build_preview.py only inlines CDN scripts/assets, it doesn't
// touch any app logic, so ?role=/window.ELECTRON_ROLE work exactly the
// same). Ticket #34 — this file didn't exist until this fix.
const OFFLINE_BUILD = path.join(__dirname, '..', 'night-circuit-preview.html');

function createWindow(role) {
  const fs = require('node:fs');
  if (!fs.existsSync(OFFLINE_BUILD)) {
    throw new Error(
      `${OFFLINE_BUILD} doesn't exist yet. Run: python3 tools/build_preview.py (from the repo root) before npm start.`
    );
  }
  const win = new BrowserWindow({
    width: 1920,
    height: 1200,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadFile(OFFLINE_BUILD, { query: { role } });
  return win;
}

// Nima: closing the control window should close the whole app, show window
// included — there's no point in either surviving alone (the control
// window has nothing to control; the show window has no operator).
// app.isQuitting guards against both 'closed' handlers firing (whichever
// window the operator didn't click close on also fires 'closed' once
// app.quit() closes it) and trying to quit twice.
function linkWindowLifetimes(show, control) {
  // Explicit destroy() of the sibling, not just app.quit() and hoping it
  // closes everything — Nima found app.quit() alone didn't reliably take
  // the other window down. .isDestroyed() guards make both directions
  // safe to fire even though each destroy() below triggers the other
  // window's own 'closed' handler too.
  show.on('closed', () => {
    if (!control.isDestroyed()) control.destroy();
    app.quit();
  });
  control.on('closed', () => {
    if (!show.isDestroyed()) show.destroy();
    app.quit();
  });
}

app.whenReady().then(() => {
  showWindow = createWindow('show');
  controlWindow = createWindow('control');
  linkWindowLifetimes(showWindow, controlWindow);

  // The one channel wired end-to-end this session, to prove the round trip
  // works: control mirrors a scene locally AND tells the show window to
  // open the same one (optimistic/synchronous per ADR-0003 — no
  // confirmation wait). The rest of the contract (queue:update, show:play,
  // hand:drive, telemetry:tick, display:pick, midi:monitor) is decided
  // (ADR-0003) but not yet wired — real follow-up implementation, not a
  // new decision.
  ipcMain.on('show:openScene', (_event, sceneId) => {
    if (showWindow) showWindow.webContents.send('show:openScene', sceneId);
  });

  // control:syncScene — the reverse direction. The show window can open a
  // scene on its own (SHOWTIME auto-advance, an edge click) with nobody
  // in the control window having triggered it; this is how the control
  // window's mirror finds out and catches up.
  ipcMain.on('control:syncScene', (_event, sceneId) => {
    if (controlWindow) controlWindow.webContents.send('control:syncScene', sceneId);
  });

  // hand:drive — mouse/keyboard-driven virtual theremin input from the
  // control window (its only source of hand values, since real MIDI-in
  // stays exclusively the show window's per ADR-0006) relayed to the show
  // window's setChan(), so it actually drives the live scene.
  ipcMain.on('hand:drive', (_event, { side, v }) => {
    if (showWindow) showWindow.webContents.send('hand:drive', { side, v });
  });

  // display:list / display:pick (ticket #31) — the Electron path never
  // touches the web Window Management API (SCREENS.probe() branches to
  // this instead): main has unconditional access to the real displays and
  // is the only thing that can actually move/fullscreen the SHOW window,
  // since one BrowserWindow's renderer cannot trigger fullscreen on
  // another's (proved empirically resolving ticket #29's map).
  ipcMain.handle('display:list', () => listDisplaysForRenderer());
  ipcMain.on('display:pick', (_event, label) => {
    pickedDisplayLabel = label;
    placeShowWindowOnLabel(label);
  });

  // Auto-reconnect (ticket #37): the picked display can drop mid-show — a
  // loose cable, a display sleep/wake cycle, an AirPlay/Sidecar hiccup —
  // and come back. Retry immediately and unconditionally (not gated to
  // PLAY mode) whenever Electron reports a new display; if its label
  // matches what was picked, the show window snaps back onto it exactly
  // as if display:pick had just fired. No warning UI on failure — the
  // show window's own picture (wrong screen / missing) is already the
  // signal, and MIDI's equivalent gap (below) surfaces for free through
  // the existing DBG "MIDI OUT" line once its port ref stops going stale.
  screen.on('display-added', () => placeShowWindowOnLabel(pickedDisplayLabel));

  // midi:devices (ticket #36) — same shape as display:list/pick, but the
  // direction is reversed: main has no Web MIDI access of its own (that's a
  // renderer API), so the SHOW window (which has real midi.access) relays
  // its device list here, and this just forwards it on to the control
  // window's pickers. Picking a device is UI-only there — the show window
  // is what actually binds to it (Nima's call: lowest latency).
  ipcMain.on('midi:devices', (_event, devices) => {
    if (controlWindow) controlWindow.webContents.send('midi:devices', devices);
  });

  // midi:connect / midi:test — Nima found the CONNECT button did nothing
  // from the control window (connectMidi() correctly no-ops there, but
  // nothing ever asked the show window to connect on its behalf, and its
  // own button is invisible by design). Same one-way relay shape as
  // show:openScene.
  ipcMain.on('midi:connect', () => {
    if (showWindow) showWindow.webContents.send('midi:connect');
  });
  ipcMain.on('midi:test', () => {
    if (showWindow) showWindow.webContents.send('midi:test');
  });

  // midi:learnStart / midi:learnResult / midi:setInput — Nima: MAP HANDS
  // should actually work from the control window, same as the wall's own
  // MAP button, not just point at the show window. LEARN and device
  // filtering both need the show window's real MIDI-in, so relay start
  // requests there and the finished/canceled result back.
  ipcMain.on('midi:learnStart', (_event, side) => {
    if (showWindow) showWindow.webContents.send('midi:learnStart', side);
  });
  ipcMain.on('midi:learnResult', (_event, result) => {
    if (controlWindow) controlWindow.webContents.send('midi:learnResult', result);
  });
  ipcMain.on('midi:setInput', (_event, id) => {
    if (showWindow) showWindow.webContents.send('midi:setInput', id);
  });

  // audio:status / audio:wake — Nima's SHOW CHECK screenshot: the SOUND row
  // read the control window's own (permanently inert) AudioContext and
  // showed a false "no audio context yet" error even though the show
  // window's audio was running fine. Same mirror shape as midi:devices.
  ipcMain.on('audio:status', (_event, status) => {
    if (controlWindow) controlWindow.webContents.send('audio:status', status);
  });
  ipcMain.on('audio:wake', () => {
    if (showWindow) showWindow.webContents.send('audio:wake');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      showWindow = createWindow('show');
      controlWindow = createWindow('control');
      linkWindowLifetimes(showWindow, controlWindow);
    }
  });
});

// Always quit with no windows open — the usual "stay running on macOS"
// convention doesn't fit a single-purpose show-runner with no other UI.
app.on('window-all-closed', () => app.quit());
