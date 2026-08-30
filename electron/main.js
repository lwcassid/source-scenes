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
const { app, BrowserWindow, ipcMain, screen, session, systemPreferences } = require('electron');
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

// Review pass on this branch: the old listDisplaysForRenderer
// built its label string inline and placeShowWindowOnLabel() rebuilt the
// SAME string format in a second place to match against — two copies of
// one format that could drift, and matching on a bare label string means
// two identical external monitors (same make/model, same resolution)
// collide indistinguishably, or an empty d.label degrades to matching on
// dimensions alone. displayDescriptor() is now the ONE place that shape is
// built, and it carries the real Electron display id so id-matching (the
// primary path in findDisplay(), below) doesn't need the string at all;
// the string stays only as the id-reassignment fallback.
function displayDescriptor(d, primaryId) {
  return {
    id: d.id,
    label: d.label || '',
    width: d.bounds.width,
    height: d.bounds.height,
    isPrimary: d.id === primaryId,
    isInternal: d.internal,
  };
}

// SCREENS' existing label()/aimedInternal()/auto-pick logic (part5_tail.js)
// already reads sc.label/width/height/isPrimary/isInternal — Electron's own
// Display objects already carry .label and .internal natively, so this is
// mostly a rename, not a reshape. No web Window Management permission
// needed; main-process screen access has no permission gate at all
// (ticket #31).
function listDisplaysForRenderer() {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map(d => displayDescriptor(d, primaryId));
}

// Review pass: pick is { id, label } (display:pick's payload, echoed back on
// every display:changed round trip). macOS can renumber display ids across
// a reconnect/sleep cycle, so id is only the FIRST try, not the only one —
// fall back to matching the same label string displayDescriptor() would
// build for each candidate today, the way placeShowWindowOnLabel used to
// match directly, so a stale id after a hot-unplug still resolves.
function findDisplay(pick) {
  if (!pick) return null;
  const displays = screen.getAllDisplays();
  const primaryId = screen.getPrimaryDisplay().id;
  if (pick.id != null) {
    const byId = displays.find(d => d.id === pick.id);
    if (byId) return byId;
  }
  if (pick.label) {
    const byLabel = displays.find(d => {
      const desc = displayDescriptor(d, primaryId);
      const str = `${desc.label} ${desc.width}×${desc.height}${desc.isPrimary ? ' (primary)' : ''}`;
      return str === pick.label;
    });
    if (byLabel) return byLabel;
  }
  return null;
}

let showWindow = null;
let controlWindow = null;
let pickedDisplay = null; // ticket #37 — the { id, label } to retry onto

// Review pass: showWindow/controlWindow were never nulled on 'closed', and
// nothing checked isDestroyed() before sending — the show window's 1s
// intervals (MOut.clock etc.) keep firing during quit, and
// controlWindow.webContents.send() on an already-destroyed window throws
// synchronously in main, which can crash the whole app mid-teardown. Every
// relay below goes through this helper instead of calling .send() directly.
function sendTo(win, channel, payload) {
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return;
  win.webContents.send(channel, payload);
}

// Review pass: the old placeShowWindowOnLabel(label) had two dead ends.
// (a) macOS silently ignores setBounds() on a window already in native
// fullscreen, so re-picking a display mid-show never actually moved it —
// and the display-added retry (ticket #37) inherited that same no-op.
// (b) On a single-display laptop there is nothing to pick, SCREENS.chosen
// is null, and placeShowWindowOnLabel(null) bailed immediately — PLAY did
// nothing visible at all. placeShowWindow(target) fixes both: target is an
// Electron Display OR null, and null is handled deliberately rather than
// treated as "nothing to do".
function placeShowWindow(target) {
  if (!showWindow || showWindow.isDestroyed()) return;
  // target === null means "no display was picked" (single-display laptop,
  // or nothing selected yet) — PLAY must still do something visible, so we
  // fullscreen the show window wherever it already sits instead of no-op.
  const bounds = target ? target.bounds : null;
  const finish = () => {
    if (!showWindow || showWindow.isDestroyed()) return;
    if (bounds) showWindow.setBounds(bounds);
    showWindow.setFullScreen(true);
  };
  if (bounds && showWindow.isFullScreen()) {
    // Drop out of native fullscreen first, wait for the OS to confirm the
    // transition (leave-full-screen), THEN move + re-enter — setBounds()
    // while still fullscreen is a no-op on macOS, which is what made
    // re-picking a display do nothing.
    showWindow.once('leave-full-screen', () => setTimeout(finish, 0));
    showWindow.setFullScreen(false);
  } else {
    finish();
  }
}

// Nima: closing the scene from the control window used to leave the show
// window sitting there fullscreen on the projector showing the LIBRARY WALL —
// the whole app, chrome and all, thrown 20 feet wide at the camp. Closing a
// scene should take the picture away, not swap it for the tool that made it.
//
// So the show window is STOWED, not destroyed: hide() keeps the AudioContext,
// the open MIDI ports and the 43MB build loaded, so the next PLAY is instant
// instead of a cold reload — but the window leaves the screen entirely, which
// is what "close" means to the person watching the wall go dark.
// Exit fullscreen BEFORE hiding: on macOS a hidden window that is still
// fullscreen leaves its empty Space behind for the operator to swipe past.
let showStowed = false, showWasFullScreen = false;
function stowShowWindow() {
  if (!showWindow || showWindow.isDestroyed() || showStowed) return;
  showStowed = true;
  showWasFullScreen = showWindow.isFullScreen();
  const hide = () => { if (showWindow && !showWindow.isDestroyed()) showWindow.hide(); };
  if (showWasFullScreen) {
    showWindow.once('leave-full-screen', () => setTimeout(hide, 0));
    showWindow.setFullScreen(false);
  } else hide();
}
function revealShowWindow() {
  if (!showWindow || showWindow.isDestroyed() || !showStowed) return;
  showStowed = false;
  showWindow.show();
  // Put it back exactly as it was. Only re-fullscreen if it WAS fullscreen —
  // opening a tile from control never fullscreened the show window before
  // this, and it should not start now; that is PLAY's job.
  if (showWasFullScreen) placeShowWindow(pickedDisplay ? findDisplay(pickedDisplay) : null);
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
    // Nima: the show window used to pop up visible at every launch, before
    // PLAY or any scene had been touched — two windows showing the same
    // idle library wall with nothing to do yet. It still needs to LOAD now
    // (AudioContext, MIDI, the build) so the first real PLAY is instant, not
    // a cold boot — it just doesn't need to be SEEN until something actually
    // asks for it. show:false + showStowed=true (bootWindows, below) means
    // it stays hidden until the existing revealShowWindow() call sites
    // (show:openScene, display:pick) bring it up for a real reason.
    show: role !== 'show',
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
// Review pass: the module-level showWindow/controlWindow refs used to
// outlive their windows (never set back to null), so anything that ran
// between 'closed' firing and app.quit() actually tearing the process down
// could still try to send to a destroyed BrowserWindow. Null the ref in
// each handler before touching the sibling, so sendTo()'s own guards (and
// any code checking `showWindow`/`controlWindow` truthiness) see the truth.
function linkWindowLifetimes(show, control) {
  show.on('closed', () => {
    showWindow = null;
    if (!control.isDestroyed()) control.destroy();
    app.quit();
  });
  control.on('closed', () => {
    controlWindow = null;
    if (!show.isDestroyed()) show.destroy();
    app.quit();
  });
}

// Review pass: createWindow() throws synchronously when the offline build is
// missing (see above), and that throw used to happen directly inside
// app.whenReady().then(...) — a rejected promise nothing awaited, so the
// app sat alive with zero windows and the actual fix (run
// build_preview.py) was buried in an unhandled-rejection stack trace
// instead of shown to whoever is standing at the show laptop. Boot is now
// its own function so both call sites (whenReady and activate) can wrap it
// in the same try/catch and fail LOUDLY: a dialog, a console.error, and a
// hard exit — never a silently blank app.
// queue:update's last payload, cached (see the ipcMain handler below). The
// show window has to be able to MISS a push and still end up correct: it
// boots slower than control on a cold start, and Electron drops a send()
// aimed at a webContents that hasn't finished loading. Replaying the cache
// on did-finish-load covers both that race and a mid-show reload of the
// show window.
let lastQueue = null;

// ADR-0007's control-window mirror: getDisplayMedia calls answered
// unconditionally with the show window, no picker, so the operator can
// never aim it at the wrong window. session.setDisplayMediaRequestHandler
// is ONE handler for the whole session — swapped out below (registerXXX
// functions replace each other) for the getDisplayMedia AUDIOIN.
// captureAppAudio() makes from the SHOW window to pick a running app's
// audio, which needs the real OS picker instead.
function registerMirrorDisplayMediaHandler() {
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    if (!showWindow || showWindow.isDestroyed()) return callback({});
    // Must be a WebFrameMain or a DesktopCapturerSource — passing the
    // BrowserWindow itself throws "video must be a WebFrameMain or
    // DesktopCapturerSource". mainFrame is the better of the two anyway:
    // it captures the show window's rendered WEB CONTENT directly rather
    // than going out through the OS window compositor, which means it
    // keeps working when the show window is behind something, and it does
    // not lean on macOS Screen Recording the way desktop capture does.
    try { callback({ video: showWindow.webContents.mainFrame }); }
    catch (e) { console.error('display-media handler failed:', e); callback({}); }
  }, { useSystemPicker: false });
}
// Nima: "make it possible to choose the output of any active app... as the
// audio input." macOS's own ScreenCaptureKit picker (useSystemPicker:true,
// Electron 31+/macOS 13+) already does exactly this — pick a running
// app/window, toggle Share Audio, get that app's isolated audio track —
// but useSystemPicker is a REGISTRATION-time option, not per-call, so the
// handler has to be swapped out for the single getDisplayMedia call
// AUDIOIN.captureAppAudio() makes and swapped back immediately after, or
// every later control-window mirror reconnect would raise the same picker.
let appAudioRevertTimer = null;
function armAppAudioPicker() {
  clearTimeout(appAudioRevertTimer);
  // useSystemPicker:true means the OS picker handles selection directly;
  // Electron docs note the handler itself won't be invoked on platforms
  // that support it — this is only a fallback for one that doesn't.
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => callback({}), { useSystemPicker: true });
  // Safety net: if the renderer never reports back (a crash, a dropped
  // IPC), don't leave the picker armed for the control window's own next
  // mirror reconnect — revert on a timeout either way.
  appAudioRevertTimer = setTimeout(registerMirrorDisplayMediaHandler, 12000);
}
function disarmAppAudioPicker() {
  clearTimeout(appAudioRevertTimer);
  registerMirrorDisplayMediaHandler();
}

function bootWindows() {
  showWindow = createWindow('show');
  controlWindow = createWindow('control');
  // Created hidden (show:false above) — mark it stowed so the first real
  // reveal (a scene mirrored over, or a display picked) goes through
  // revealShowWindow()'s normal path instead of it already being visible.
  showStowed = true;
  showWasFullScreen = false;
  showWindow.webContents.on('did-finish-load', () => {
    if (lastQueue) sendTo(showWindow, 'queue:update', lastQueue);
  });
  linkWindowLifetimes(showWindow, controlWindow);
}

// ONE APP, ALWAYS THE FRESHEST BUILD (Lance: "kill the old and in with the
// new"). Only one show-runner may exist: a second `npm start` doesn't open a
// confusing duplicate pair of windows — it tells the RUNNING app to reload
// both windows from disk (picking up whatever build_preview.py just wrote)
// and front itself, then the newcomer process exits. So "npm start" is also
// the refresh gesture: what you're looking at is always the newest build.
const primary = app.requestSingleInstanceLock();
if (!primary) {
  app.quit();
} else {
  app.on('second-instance', () => {
    for (const win of [showWindow, controlWindow]) {
      if (win && !win.isDestroyed()) win.webContents.reloadIgnoringCache();
    }
    if (controlWindow && !controlWindow.isDestroyed()) {
      if (controlWindow.isMinimized()) controlWindow.restore();
      controlWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  if (!primary) return; // the newcomer is already quitting — hand off to the running app
  try {
    bootWindows();
    // ADR-0007: hand the control window a live stream OF THE SHOW WINDOW.
    // getDisplayMedia normally raises a source picker; this handler answers
    // it directly with the show window, so the operator never picks anything
    // and can never pick WRONG (the control window itself, say, which would
    // be a hall of mirrors). Passing a BrowserWindow captures that window
    // specifically, not the screen it sits on — so it keeps working when the
    // show window moves displays, and it captures the real composited
    // output rather than re-running the scene.
    // useSystemPicker:false keeps macOS's own picker out of a kiosk app.
    registerMirrorDisplayMediaHandler();
  } catch (err) {
    const { dialog } = require('electron');
    dialog.showErrorBox('SOURCE show-runner', err.message);
    console.error(err);
    app.exit(1);
    return; // don't wire any IPC onto a process that's about to exit
  }

  // show:openScene / control:syncScene — the two-way scene-mirror channels.
  // Clicking PLAY or a tile in the control window fires show:openScene so
  // the show window opens the same scene for real (audio + MIDI + render);
  // control:syncScene is the reverse direction, for when the show window
  // opens a scene on its own (SHOWTIME auto-advance, an edge click) with
  // nobody in the control window having triggered it.
  ipcMain.on('show:openScene', (_event, sceneId) => {
    revealShowWindow();   // a scene means the wall is wanted back
    sendTo(showWindow, 'show:openScene', sceneId);
  });
  ipcMain.on('control:syncScene', (_event, sceneId) => {
    // The show window announcing it opened something ITSELF — SHOWTIME
    // auto-advance, an edge click, or the SHOW CONTROL pad (ADR-0008). If it
    // was stowed after a CLOSE, main never saw a show:openScene to un-stow
    // it on, so the pad would look dead while the scene ran on a hidden
    // window. Reveal on the announcement instead.
    revealShowWindow();
    sendTo(controlWindow, 'control:syncScene', sceneId);
  });

  // show:closeScene — control's CLOSE button telling the show window to
  // drop back to the library wall too, so a closed scene in control doesn't
  // leave the show window stuck on a scene nobody is driving anymore.
  ipcMain.on('show:closeScene', () => {
    // Relay FIRST so the renderer tears the scene down properly — voice
    // stopped, bed note off, all-notes-off to Ableton, transport stopped —
    // and only then take the window off the screen. Hiding first would strand
    // notes sounding in Live with nothing to turn them off.
    sendTo(showWindow, 'show:closeScene');
    stowShowWindow();
  });

  // hand:drive — mouse/keyboard-driven virtual theremin input from the
  // control window (its only source of hand values, since real MIDI-in
  // stays exclusively the show window's per ADR-0006) relayed to the show
  // window's setChan(), so it actually drives the live scene.
  ipcMain.on('hand:drive', (_event, { side, v }) => {
    sendTo(showWindow, 'hand:drive', { side, v });
  });

  // hand:mirror — the reverse of hand:drive: the show window reports the
  // REAL calibrated hand state (from actual MIDI-in, live theremin sensors,
  // or its own hand:drive playback) back to control so the sidebar/rail
  // widgets there reflect what's actually driving the scene, not just what
  // control itself last sent.
  ipcMain.on('hand:mirror', (_event, state) => {
    sendTo(controlWindow, 'hand:mirror', state);
  });

  // show:control — one channel for the small set of global toggles control
  // can flip on the show window (sound on/off, OUT routing mode, MIDI
  // clock, output port, scene ghosts, RESEED, and the volume slider) that
  // used to have no way to reach the show window at all, since those
  // controls live in the shared left column and the show window has no
  // visible chrome to click them with itself.
  ipcMain.on('show:control', (_event, msg) => {
    sendTo(showWindow, 'show:control', msg);
  });

  // rig:status — THE RIG rack under the control stage needs to know what
  // the show window's real MOut/MIDI clock state actually is (mode, which
  // port, whether clock is on/running, current bpm) since control's own
  // MOut instance is inert by design (ADR-0003) and would otherwise show
  // nothing lit at all.
  ipcMain.on('rig:status', (_event, status) => {
    sendTo(controlWindow, 'rig:status', status);
  });

  // queue:update (ADR-0003's last unwired channel) — the performance queue,
  // pushed control -> show on every edit. Strictly ONE WAY and control is
  // authoritative: the show window is picture-only, so no human can ever
  // edit a queue there, which makes this a broadcast rather than a merge.
  // Until this existed, the show window auto-advanced off the srcQueue it
  // read at boot: reordering the set, dropping a scene or changing a MIN
  // mid-show changed the drawer and nothing else, and the running order the
  // projectors actually followed was whatever the laptop had at launch.
  // Cached so a show window that boots late or reloads can be caught up
  // (see bootWindows' did-finish-load above).
  ipcMain.on('queue:update', (_event, q) => {
    lastQueue = q;
    sendTo(showWindow, 'queue:update', q);
  });

  // telemetry:tick (ADR-0003, finally built) — the show window's own account
  // of what it is DOING, 4x a second: which scene, which act, when the dwell
  // timer fires, the chord/bar readout, and the MIDI note activity the RIG
  // rack and monitor light up from. The control window used to derive all of
  // that by running its own copy of the scene; once it stops (ADR-0007) this
  // is the only honest source, and it is honest in a way the copy never was —
  // it is the wall's numbers, not a second performance's.
  ipcMain.on('telemetry:tick', (_event, t) => {
    sendTo(controlWindow, 'telemetry:tick', t);
  });

  // preview:status — macOS gates window capture behind Screen Recording, and
  // a missing grant looks exactly like a broken app: a black preview, no
  // error. SHOW CHECK asks this so the pre-flight can SAY so, with a button
  // that opens the right settings pane. 'not-applicable' on Windows/Linux,
  // where there is nothing to grant.
  ipcMain.handle('preview:status', () => {
    if (process.platform !== 'darwin') return 'not-applicable';
    try { return systemPreferences.getMediaAccessStatus('screen'); } catch (e) { return 'unknown'; }
  });
  ipcMain.on('preview:openSettings', () => {
    if (process.platform !== 'darwin') return;
    require('electron').shell.openExternal(
      'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'
    );
  });

  // display:list / display:pick (ticket #31) — the Electron path never
  // touches the web Window Management API (SCREENS.probe() branches to
  // this instead): main has unconditional access to the real displays and
  // is the only thing that can actually move/fullscreen the SHOW window,
  // since one BrowserWindow's renderer cannot trigger fullscreen on
  // another's (proved empirically resolving ticket #29's map).
  //
  // Review pass: pickedDisplay now holds the WHOLE { id, label } object
  // (not just a label string) so findDisplay() has an id to try first.
  ipcMain.handle('display:list', () => listDisplaysForRenderer());
  ipcMain.on('display:pick', (_event, pick) => {
    revealShowWindow();
    pickedDisplay = pick || null;
    placeShowWindow(findDisplay(pickedDisplay || {}));
  });

  // Review pass: the renderer used to probe the display list exactly once
  // (on SHOW CHECK open) and never again, so a monitor plugged in or
  // unplugged afterward left the picker showing a stale list until the
  // whole app restarted — and the display-added retry below only ever
  // helped if something had ALREADY been picked. onDisplaysChanged now
  // covers add/remove/metrics changes uniformly: it pushes the fresh list
  // to control (display:changed, ticket #37's new one-way channel) AND, if
  // a display was picked, retries placing the show window onto whatever
  // that pick now resolves to (covers a loose cable, sleep/wake, or an
  // AirPlay/Sidecar hiccup reconnecting under the same id or label).
  const onDisplaysChanged = () => {
    sendTo(controlWindow, 'display:changed', listDisplaysForRenderer());
    if (pickedDisplay) {
      const target = findDisplay(pickedDisplay);
      if (target) placeShowWindow(target);
    }
  };
  screen.on('display-added', onDisplaysChanged);
  screen.on('display-removed', onDisplaysChanged);
  screen.on('display-metrics-changed', onDisplaysChanged);

  // midi:devices (ticket #36) — same shape as display:list/pick, but the
  // direction is reversed: main has no Web MIDI access of its own (that's a
  // renderer API), so the SHOW window (which has real midi.access) relays
  // its device list here, and this just forwards it on to the control
  // window's pickers. Picking a device is UI-only there — the show window
  // is what actually binds to it (Nima's call: lowest latency).
  ipcMain.on('midi:devices', (_event, devices) => {
    sendTo(controlWindow, 'midi:devices', devices);
  });

  // midi:connect / midi:test — Nima found the CONNECT button did nothing
  // from the control window (connectMidi() correctly no-ops there, but
  // nothing ever asked the show window to connect on its behalf, and its
  // own button is invisible by design). Same one-way relay shape as
  // show:openScene.
  ipcMain.on('midi:connect', () => {
    sendTo(showWindow, 'midi:connect');
  });
  ipcMain.on('midi:test', () => {
    sendTo(showWindow, 'midi:test');
  });

  // midi:learnStart / midi:learnResult / midi:setInput — Nima: MAP HANDS
  // should actually work from the control window, same as the wall's own
  // MAP button, not just point at the show window. LEARN and device
  // filtering both need the show window's real MIDI-in, so relay start
  // requests there and the finished/canceled result back.
  ipcMain.on('midi:learnStart', (_event, side) => {
    sendTo(showWindow, 'midi:learnStart', side);
  });
  ipcMain.on('midi:learnResult', (_event, result) => {
    sendTo(controlWindow, 'midi:learnResult', result);
  });
  ipcMain.on('midi:setInput', (_event, id) => {
    sendTo(showWindow, 'midi:setInput', id);
  });

  // nav:learn / nav:state (ADR-0008) — SHOW CONTROL's LEARN round trip, the
  // same relay shape as the hands': request out to the window with the real
  // MIDI-in, resulting bindings back to the window with the buttons.
  ipcMain.on('nav:learn', (_event, what) => {
    sendTo(showWindow, 'nav:learn', what);
  });
  ipcMain.on('nav:state', (_event, state) => {
    sendTo(controlWindow, 'nav:state', state);
  });

  // audioin:* (grill-me session) — same relay shape as midi:devices/connect/
  // setInput, for a scene that reacts to a live mic/line-in instead of (or
  // alongside) the hands. Real capture stays show-window-only (ADR-0006's
  // precedent); control only ever sees the relayed devices+status push.
  ipcMain.on('audioin:connect', () => {
    sendTo(showWindow, 'audioin:connect');
  });
  ipcMain.on('audioin:listDevices', () => {
    sendTo(showWindow, 'audioin:listDevices');
  });
  ipcMain.on('audioin:setDevice', (_event, id) => {
    sendTo(showWindow, 'audioin:setDevice', id);
  });
  ipcMain.on('audioin:devices', (_event, status) => {
    sendTo(controlWindow, 'audioin:devices', status);
  });
  // audioin:captureAppAudio — "choose the output of any active app... as
  // the audio input." Relayed to the show window like connect(); the arm/
  // done pair around it swaps the display-media handler to the real OS
  // picker for exactly the one getDisplayMedia call this makes.
  ipcMain.on('audioin:captureAppAudio', () => {
    sendTo(showWindow, 'audioin:captureAppAudio');
  });
  ipcMain.on('audioin:armAppAudioPicker', () => armAppAudioPicker());
  ipcMain.on('audioin:appAudioPickDone', () => disarmAppAudioPicker());

  // audio:status / audio:wake — Nima's SHOW CHECK screenshot: the SOUND row
  // read the control window's own (permanently inert) AudioContext and
  // showed a false "no audio context yet" error even though the show
  // window's audio was running fine. Same mirror shape as midi:devices.
  ipcMain.on('audio:status', (_event, status) => {
    sendTo(controlWindow, 'audio:status', status);
  });
  ipcMain.on('audio:wake', () => {
    sendTo(showWindow, 'audio:wake');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      try {
        bootWindows();
      } catch (err) {
        const { dialog } = require('electron');
        dialog.showErrorBox('SOURCE show-runner', err.message);
        console.error(err);
        app.exit(1);
      }
    }
  });
});

// Always quit with no windows open — the usual "stay running on macOS"
// convention doesn't fit a single-purpose show-runner with no other UI.
app.on('window-all-closed', () => app.quit());
