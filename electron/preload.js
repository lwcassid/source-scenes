// The control<->show API surface (ADR-0003). Only one channel is actually
// wired end-to-end this session (openScene) to prove the mechanism; the
// rest of the contract is decided but stubbed as clear follow-up work —
// see main.js's comment for the full list.
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
  driveHand(side, v) { ipcRenderer.send('hand:drive', { side, v }); },
  onHandDrive(callback) {
    ipcRenderer.on('hand:drive', (_event, { side, v }) => callback(side, v));
  },
  // ticket #31 — SCREENS.probe()/enterShow() branch to these under Electron
  getDisplays() { return ipcRenderer.invoke('display:list'); },
  pickDisplay(label) { ipcRenderer.send('display:pick', label); },
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
