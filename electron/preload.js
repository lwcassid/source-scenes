// The control<->show API surface (ADR-0003). Every channel in the contract
// is wired end-to-end as of this pass: scene mirroring both directions,
// hand drive + hand mirror, the display list/pick/changed trio, the MIDI
// device/connect/test/learn set, audio status/wake, show:control's global
// toggles, show:closeScene, and rig:status. (Earlier revisions of this
// comment said only openScene was wired — that stopped being true two
// commits ago; nothing here is a stub anymore.)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  role: new URLSearchParams(location.search).get('role') || null,
  openScene(sceneId) { ipcRenderer.send('show:openScene', sceneId); },
  onOpenScene(callback) {
    ipcRenderer.on('show:openScene', (_event, sceneId) => callback(sceneId));
  },
  syncSceneToControl(sceneId) { ipcRenderer.send('control:syncScene', sceneId); },
  onSyncSceneFromShow(callback) {
    ipcRenderer.on('control:syncScene', (_event, sceneId) => callback(sceneId));
  },
  // show:closeScene — control's CLOSE button telling the show window to
  // drop back to the library wall too (no payload; the show window only
  // needs to know it happened, not which scene it was on).
  closeScene() { ipcRenderer.send('show:closeScene'); },
  onCloseScene(callback) {
    ipcRenderer.on('show:closeScene', () => callback());
  },
  driveHand(side, v) { ipcRenderer.send('hand:drive', { side, v }); },
  onHandDrive(callback) {
    ipcRenderer.on('hand:drive', (_event, { side, v }) => callback(side, v));
  },
  // hand:mirror — the show window's REAL calibrated hand state (live
  // sensors, MIDI-in, or hand:drive played back) reported to control so its
  // rail/sidebar widgets reflect what's actually driving the scene instead
  // of only what control itself last sent over hand:drive.
  sendHandMirror(state) { ipcRenderer.send('hand:mirror', state); },
  onHandMirror(callback) {
    ipcRenderer.on('hand:mirror', (_event, state) => callback(state));
  },
  // show:control — one channel for the global toggles the shared left
  // column exposes (sound/outMode/clock/outPort/ghosts/reseed/vol) that
  // control needs to apply to the show window's actual audio+MIDI state,
  // since the show window has no visible chrome of its own to click them
  // with. `value` is a bare payload, not wrapped further — onShowControl's
  // callback gets the whole { kind, value } object so callers can switch
  // on kind.
  sendShowControl(kind, value) { ipcRenderer.send('show:control', { kind, value }); },
  onShowControl(callback) {
    ipcRenderer.on('show:control', (_event, msg) => callback(msg));
  },
  // rig:status — the show window's real MOut/MIDI-clock state (mode,
  // portName, clockOn, clockRunning, bpm) mirrored to control so THE RIG
  // rack there lights up correctly instead of reading control's own inert
  // MOut instance.
  sendRigStatus(status) { ipcRenderer.send('rig:status', status); },
  onRigStatus(callback) {
    ipcRenderer.on('rig:status', (_event, status) => callback(status));
  },
  // queue:update — the performance queue ({list, cfg}) pushed control -> show
  // on every edit, so SHOWTIME's running order and each scene's MIN/OUT are
  // the ones on screen in the drawer rather than the ones the show window
  // happened to read out of localStorage at launch. One way by design: the
  // show window has no chrome to edit a queue with, so control is always
  // authoritative and there is nothing to merge.
  sendQueue(queue) { ipcRenderer.send('queue:update', queue); },
  onQueue(callback) {
    ipcRenderer.on('queue:update', (_event, queue) => callback(queue));
  },
  // ticket #31 — SCREENS.probe()/enterShow() branch to these under
  // Electron. pickDisplay now takes the whole { id, label } object (not a
  // bare label string) so main's findDisplay() has a real Electron display
  // id to try before falling back to label matching (ids can
  // get reassigned across a reconnect, labels can collide).
  getDisplays() { return ipcRenderer.invoke('display:list'); },
  pickDisplay(pick) { ipcRenderer.send('display:pick', pick); },
  // display:changed — pushed by main (no renderer sender) whenever a
  // display is added/removed/reconfigured, so the picker in control stops
  // showing a stale list the moment something plugs in or drops (review
  // #12 — the old one-shot probe never refreshed on its own).
  onDisplaysChanged(callback) {
    ipcRenderer.on('display:changed', (_event, displays) => callback(displays));
  },
  // ticket #36 — show window calls sendMidiDevices whenever its real device
  // list changes; control window's refreshMidiUI()/MOut.refreshUI() listen
  sendMidiDevices(devices) { ipcRenderer.send('midi:devices', devices); },
  onMidiDevices(callback) {
    ipcRenderer.on('midi:devices', (_event, devices) => callback(devices));
  },
  // control's CONNECT/TEST buttons have nothing real to act on locally —
  // relayed to the show window, which does
  requestMidiConnect() { ipcRenderer.send('midi:connect'); },
  onMidiConnectRequested(callback) {
    ipcRenderer.on('midi:connect', () => callback());
  },
  requestMidiTest() { ipcRenderer.send('midi:test'); },
  onMidiTestRequested(callback) {
    ipcRenderer.on('midi:test', () => callback());
  },
  // audio:status / audio:wake — same shape as the MIDI pair above: the show
  // window's AudioContext is the only real one (AE.ensure() no-ops in
  // control per ADR-0003), so SHOW CHECK's SOUND row in the control window
  // needs a mirror of it instead of reading its own permanently-inert state.
  sendAudioStatus(status) { ipcRenderer.send('audio:status', status); },
  onAudioStatus(callback) {
    ipcRenderer.on('audio:status', (_event, status) => callback(status));
  },
  requestAudioWake() { ipcRenderer.send('audio:wake'); },
  onAudioWakeRequested(callback) {
    ipcRenderer.on('audio:wake', () => callback());
  },
  // midi:learn* / midi:setInput — LEARN and device picking now work from
  // the control window's own MAP popover, relayed to the show window (the
  // sole owner of real MIDI-in, ADR-0006), same shape as CONNECT/TEST.
  requestMidiLearn(side) { ipcRenderer.send('midi:learnStart', side); },
  onMidiLearnRequested(callback) {
    ipcRenderer.on('midi:learnStart', (_event, side) => callback(side));
  },
  sendMidiLearnResult(result) { ipcRenderer.send('midi:learnResult', result); },
  onMidiLearnResult(callback) {
    ipcRenderer.on('midi:learnResult', (_event, result) => callback(result));
  },
  setMidiInput(id) { ipcRenderer.send('midi:setInput', id); },
  onMidiSetInputRequested(callback) {
    ipcRenderer.on('midi:setInput', (_event, id) => callback(id));
  },
});
