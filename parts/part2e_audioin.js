/* ============================================================
   AUDIO IN — a scene can react to a live audio signal (mic/line-in)
   instead of, or alongside, hand input and its own sound (grill-me
   session, Cell Front V4 is the first scene to use it).

   Same split as MIDI-in (ADR-0006): this is a real-time signal, so it is
   captured and analyzed in the SHOW window only — the control window has
   no picture of its own to drive (ADR-0007), only a device picker and a
   status readout, relayed the same way midi:devices already works. Works
   identically in the plain browser (there is only one window there).

   Capture is CONNECT-once, then continuous for the whole show, same as
   MIDI — not gated to whichever scene happens to be open, so switching
   between an audio-reactive scene and a hand-driven one never has a
   reconnect beat.

   Chrome's default getUserMedia audio constraints apply voice-call-style
   processing (echo cancellation, noise suppression, auto-gain) tuned for
   speech, not music — left on, a quiet passage gets gated to silence and a
   loud one gets flattened. All three are explicitly disabled below.

   inp.audio (built in part5_tail.js's frame(), same place inp.L/inp.R are
   built) is a small fixed object, not raw FFT bins — level/bass/mid/treble
   are engine-smoothed (fast attack, slower release) before a scene ever
   sees them; onset stays a sharp, un-smoothed pulse for hit-timing; pan is
   the stereo balance, recomputed fresh every frame, needing no calibration
   of its own. ============================================================ */
const AUDIOIN = {
  ctx: null, stream: null, srcNode: null, splitter: null,
  analyserMono: null, analyserL: null, analyserR: null,
  freqBuf: null, timeBufL: null, timeBufR: null,

  devices: [],            // [{id, label}] — needs one granted stream before labels are visible
  device: null,            // {id, label} — persisted pick, same shape as NAV.dev
  connected: false, denied: false,

  // the public signal — part5_tail.js's frame() reads these straight into inp.audio
  level: 0, bass: 0, mid: 0, treble: 0, onset: 0, pan: 0,
  // A rising-edge counter, not just the raw `onset` value above — the Audio
  // in monitor panel's flash dot in the control window only ever sees this
  // through telemetry:tick's 4Hz sampling, and a single onset pulse can
  // decay in ~150ms, well under that period. Sampling the raw value risks
  // aliasing straight past a real hit; a monotonic count survives it — any
  // change between two samples means at least one hit happened in between,
  // regardless of exactly when.
  onsetCount: 0, _pulseWasHigh: false,

  // self-widening range per band (Q16: "same as CAL"), one shared REST
  // sample rather than per-side — there is one signal here, not two hands.
  cal: {
    lo: { level: 1, bass: 1, mid: 1, treble: 1 },
    hi: { level: 0, bass: 0, mid: 0, treble: 0 },
    rest: null,             // {level, bass, mid, treble} from SET REST; null until set
  },
  restSampling: false, restData: [], restTimer: null,

  // global default band split (Hz) — a scene can override via its own
  // reg({audioIn:{bands:{...}}}) if it wants a narrower band (Q12)
  BANDS: { bass: [20, 250], mid: [250, 2000], treble: [2000, 12000] },

  // onset/beat-detection state (Nima: techno/house needs real beat
  // detection, not a broadband-vs-slow-average threshold — see tick()).
  _onsetEnv: 0, _fluxSlow: 0, _onsetGap: 0, _fluxPrimed: false, _prevBassRaw: 0,

  load() {
    try {
      const d = JSON.parse(localStorage.getItem('srcAudioInDev') || 'null');
      if (d) this.device = d;
    } catch (e) {}
    try {
      const c = JSON.parse(localStorage.getItem('srcAudioInCal') || 'null');
      if (c) { this.cal.lo = c.lo || this.cal.lo; this.cal.hi = c.hi || this.cal.hi; this.cal.rest = c.rest || null; }
    } catch (e) {}
  },
  save() {
    try { localStorage.setItem('srcAudioInDev', JSON.stringify(this.device)); } catch (e) {}
    try { localStorage.setItem('srcAudioInCal', JSON.stringify(this.cal)); } catch (e) {}
  },
  _saveT: null,
  saveSoon() { if (!this._saveT) this._saveT = setTimeout(() => { this._saveT = null; this.save(); }, 1200); },

  // raw → self-widening 0..1, same shape as calValue() in part2_core.js
  norm(band, raw) {
    if (raw < this.cal.lo[band]) { this.cal.lo[band] = raw; this.saveSoon(); }
    if (raw > this.cal.hi[band]) { this.cal.hi[band] = raw; this.saveSoon(); }
    const span = this.cal.hi[band] - this.cal.lo[band];
    return clamp(span > 0.02 ? (raw - this.cal.lo[band]) / span : raw);
  },

  // control window never opens a real stream (ADR-0006's precedent) — relay
  // the request, same shape as connectMidi().
  connect() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.requestAudioInConnect) window.electronAPI.requestAudioInConnect();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) { this.denied = true; this.relayIfElectron(); return; }
    const constraints = {
      audio: {
        deviceId: this.device?.id ? { exact: this.device.id } : undefined,
        echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      this._wire(stream);
      // labels only appear on enumerateDevices() once a stream has been granted
      navigator.mediaDevices.enumerateDevices().then(list => {
        this.devices = list.filter(d => d.kind === 'audioinput').map(d => ({ id: d.deviceId, label: d.label || 'input' }));
        this.connected = true; this.denied = false;
        this.relayIfElectron();
      });
    }).catch(() => { this.connected = false; this.denied = true; this.relayIfElectron(); });
  },
  // "choose the output of any active app... as the audio input" — a running
  // app/window's own audio, picked through the OS's real picker
  // (ScreenCaptureKit on macOS via useSystemPicker, armed in electron/
  // main.js for exactly this one call), not a microphone. getDisplayMedia
  // requires requesting video by spec; the video track is stopped the
  // instant the stream arrives — nothing renders it, no reason to pay for
  // capturing a picture nobody looks at.
  captureAppAudio() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.requestAppAudioCapture) window.electronAPI.requestAppAudioCapture();
      // the OS picker is modal and can sit open for a while — say so instead
      // of the button looking like the click did nothing
      this._appAudioPending = true;
      if (typeof this.ui === 'function') this.ui();
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) { this.denied = true; this.relayIfElectron(); return; }
    if (window.electronAPI?.armAppAudioPicker) window.electronAPI.armAppAudioPicker();
    navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(stream => {
      if (window.electronAPI?.appAudioPickDone) window.electronAPI.appAudioPickDone();
      stream.getVideoTracks().forEach(t => t.stop());
      const at = stream.getAudioTracks();
      if (!at.length) {
        // picked a source with no audio track (screen-share dialogs on some
        // platforms don't offer per-app audio, or the operator left "Share
        // Audio" unchecked) — say so rather than connecting to silence
        stream.getTracks().forEach(t => t.stop());
        this.connected = false; this.denied = true; this.relayIfElectron();
        return;
      }
      this.device = { id: 'app-audio', label: at[0].label || 'app audio' };
      this._wire(stream);
      this.devices = []; // this source isn't in enumerateDevices() — nothing to list
      this.connected = true; this.denied = false;
      this.relayIfElectron();
    }).catch(() => {
      // includes the operator just cancelling the picker — not worth a
      // scarier message than the plain CONNECT failure path already has
      if (window.electronAPI?.appAudioPickDone) window.electronAPI.appAudioPickDone();
      this.connected = false; this.denied = true; this.relayIfElectron();
    });
  },
  // control window: picking a device — relay it, the show window reconnects
  setDevice(id) {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.setAudioInDevice) window.electronAPI.setAudioInDevice(id);
      const opt = this.devices.find(d => d.id === id);
      this.device = id ? { id, label: opt ? opt.label : '' } : null;
      return;
    }
    const opt = this.devices.find(d => d.id === id);
    this.device = id ? { id, label: opt ? opt.label : '' } : null;
    this.save();
    this._teardown();
    this.connect();
  },
  _wire(stream) {
    this._teardown();
    this._testOverride = false; // a real device takes over from any setAudioIn() test values
    this.stream = stream;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.srcNode = this.ctx.createMediaStreamSource(stream);

    // mono-summed analyser for bass/mid/treble — forcing channelCount to 1
    // downmixes whatever the source carries (mono or stereo) so the band
    // split reflects L+R together, per the grilling decision.
    this.analyserMono = this.ctx.createAnalyser();
    // Nima: beat detection on techno/house was jittery — traced to the
    // AnalyserNode's own DEFAULT smoothingTimeConstant (0.8), an 80%-old/
    // 20%-new exponential blend the browser applies BEFORE we ever see a
    // byte of frequency data. That smears every kick's transient into mush
    // no matter how fast we poll it. Zero it out so getByteFrequencyData()
    // hands back the RAW current-frame spectrum — "as close to the metal
    // as possible" — and let our own attack/release envelopes (below, and
    // the flux detector) do 100% of the deliberate shaping instead of an
    // invisible browser default nobody chose. fftSize down from 2048 to
    // 1024 too: half the analysis window (~23ms vs ~46ms at 44.1kHz) for
    // tighter time resolution: bass/kick content only needs ~43Hz bins to
    // resolve, it never needed 2048's frequency precision.
    this.analyserMono.fftSize = 1024;
    this.analyserMono.smoothingTimeConstant = 0;
    this.analyserMono.channelCount = 1;
    this.analyserMono.channelCountMode = 'explicit';
    this.freqBuf = new Uint8Array(this.analyserMono.frequencyBinCount);
    this._fluxPrimed = false; this._fluxSlow = 0; this._onsetGap = 0; this._onsetEnv = 0; this._prevBassRaw = 0;

    // a 2-channel split feeds two small time-domain analysers, used only to
    // compute per-channel RMS for stereo pan — not the band analysis above.
    this.splitter = this.ctx.createChannelSplitter(2);
    this.analyserL = this.ctx.createAnalyser(); this.analyserL.fftSize = 512;
    this.analyserR = this.ctx.createAnalyser(); this.analyserR.fftSize = 512;
    this.timeBufL = new Float32Array(this.analyserL.fftSize);
    this.timeBufR = new Float32Array(this.analyserR.fftSize);

    this.srcNode.connect(this.analyserMono);
    this.srcNode.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);
  },
  _teardown() {
    if (this.stream) { try { this.stream.getTracks().forEach(t => t.stop()); } catch (e) {} }
    if (this.ctx) { try { this.ctx.close(); } catch (e) {} }
    this.stream = null; this.ctx = null; this.srcNode = null; this.splitter = null;
    this.analyserMono = this.analyserL = this.analyserR = null;
  },

  // Show window: run the analysis, called once per frame from part5_tail.js
  // regardless of which scene is open — the library wall's own ambient
  // step() calls read inp.audio too, so this stays live the whole show.
  tick(dt) {
    if (window.ELECTRON_ROLE === 'control') return;
    // Test hook active (setAudioIn, no real device wired) — leave whatever
    // it just set completely alone. Without this, this method's own
    // no-device branch below would decay/zero those values on the very next
    // animation frame, before a scene ever got to read them.
    if (this._testOverride) { this._pushHistory(dt); return; }
    if (!this.connected || !this.analyserMono) {
      // decay toward silence rather than freezing at the last reading — a
      // scene reading this after a mid-show disconnect should see the
      // signal actually die, not hang at whatever it last heard.
      const decay = Math.min(1, dt * 3);
      this.level -= this.level * decay; this.bass -= this.bass * decay;
      this.mid -= this.mid * decay; this.treble -= this.treble * decay;
      this.onset = 0;
      this._pushHistory(dt);
      return;
    }

    this.analyserMono.getByteFrequencyData(this.freqBuf);
    const sr = this.ctx.sampleRate, binHz = sr / this.analyserMono.fftSize;
    const bandEnergy = ([lo, hi]) => {
      const i0 = Math.max(0, Math.floor(lo / binHz)), i1 = Math.min(this.freqBuf.length - 1, Math.ceil(hi / binHz));
      let sum = 0, n = 0;
      for (let i = i0; i <= i1; i++) { sum += this.freqBuf[i]; n++; }
      return n ? (sum / n) / 255 : 0;
    };
    const bassRaw = bandEnergy(this.BANDS.bass);
    const midRaw = bandEnergy(this.BANDS.mid);
    const trebleRaw = bandEnergy(this.BANDS.treble);

    this.analyserL.getFloatTimeDomainData(this.timeBufL);
    this.analyserR.getFloatTimeDomainData(this.timeBufR);
    const rms = buf => { let s = 0; for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]; return Math.sqrt(s / buf.length); };
    const rmsL = rms(this.timeBufL), rmsR = rms(this.timeBufR);
    const levelRaw = (rmsL + rmsR) * 3; // time-domain RMS is small (~0..0.3ish for music) — scale toward the 0..1 the band analysis already reads in

    // engine-side attack/release: fast up, slower release (Q13) — onset stays
    // on the raw, un-smoothed broadband energy below, for tight hit timing.
    const smooth = (cur, target, upRate, downRate) =>
      cur + (target - cur) * Math.min(1, dt * (target > cur ? upRate : downRate));
    this.level = smooth(this.level, this.norm('level', levelRaw), 18, 4);
    this.bass = smooth(this.bass, this.norm('bass', bassRaw), 18, 4);
    this.mid = smooth(this.mid, this.norm('mid', midRaw), 18, 4);
    this.treble = smooth(this.treble, this.norm('treble', trebleRaw), 18, 4);
    this.pan = clamp((rmsR - rmsL) / Math.max(rmsR + rmsL, 1e-4), -1, 1);
    if (this.restSampling) this.restData.push({ level: this.level, bass: this.bass, mid: this.mid, treble: this.treble });

    // onset: the bass band's own frame-to-frame RISE (positive part of its
    // derivative), not a broadband-level threshold. A sustained kick
    // pattern (or a driving bassline note) that keeps the bass band loud
    // and roughly CONSTANT produces near-zero rise, because nothing is
    // actually changing; only a fresh transient (a new kick hit) spikes it.
    // That's exactly what defeated the old broadband-vs-slow-average
    // approach on four-on-the-floor house/techno, where the bass band
    // rarely drops enough for a level threshold to "reset" between hits.
    // (Tried a full per-bin spectral-flux version first — summing each
    // bin's positive delta separately — but a kick's own pitch-sweep
    // artifact double-triggered as it crossed bin boundaries; the band's
    // single aggregate level is steadier and cheaper.)
    if (this._fluxPrimed) {
      const rise = Math.max(0, bassRaw - this._prevBassRaw);
      // adaptive threshold: a fast-local mean of RECENT rises (~0.3s), so a
      // hot, driving set doesn't need re-calibrating by hand — the trigger
      // bar rises and falls with how spiky the material actually is.
      this._fluxSlow += (rise - this._fluxSlow) * Math.min(1, dt * 3.2);
      this._onsetGap += dt;
      // ~150ms refractory: comfortably clear of a single kick's own
      // transient (attack + short decay), still well under real dance-
      // music subdivision spacing (an eighth note at 180bpm is ~167ms).
      if (rise > this._fluxSlow * 1.8 + 0.028 && this._onsetGap > 0.15) {
        this._onsetEnv = 1;
        this._onsetGap = 0;
      }
    } else {
      // first tick after connecting: seed the baseline, don't fire — every
      // reading looks like a "rise" off a zeroed start otherwise.
      this._fluxPrimed = true;
      this._fluxSlow = 0;
    }
    this._prevBassRaw = bassRaw;
    this._onsetEnv = Math.max(this._onsetEnv - dt * 7.5, 0);
    this.onset = this._onsetEnv;

    this._statusAcc = (this._statusAcc || 0) + dt;
    if (this._statusAcc > 1) { this._statusAcc = 0; this.relayIfElectron(); }
    this._pushHistory(dt);
  },
  // A rolling ~15s trace for the Audio in monitor panel (under the stage,
  // replaces THE RIG for scenes that declare audioIn) — throttled to ~10Hz,
  // plenty for a scrolling meter, cheap enough to keep running every frame
  // regardless of whether that panel is even open right now.
  history: [],
  _histAcc: 0,
  _pushHistory(dt) {
    // Rising-edge check runs every frame (not throttled below) — a pulse
    // that both rises and decays inside one 100ms history-push window would
    // otherwise never register at all.
    const hot = this.onset > 0.5;
    if (hot && !this._pulseWasHigh) this.onsetCount++;
    this._pulseWasHigh = hot;
    this._histAcc += dt;
    if (this._histAcc < 0.1) return;
    this._histAcc = 0;
    this.history.push({ p: performance.now(), level: this.level, bass: this.bass, mid: this.mid, treble: this.treble, onset: this.onset });
    if (this.history.length > 200) this.history.shift();
  },

  // SET REST — same shape and purpose as the hands' startRest(): sample
  // ~1.6s of true silence and use it to pull the self-widening floor down to
  // a deliberate reading instead of waiting for the show to organically
  // pass through a quiet moment.
  startRest() {
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI?.sendShowControl) window.electronAPI.sendShowControl('audioinRest');
      return;
    }
    if (this.restSampling || !this.connected) return;
    this.restSampling = true;
    this.restData = [];
    clearTimeout(this.restTimer);
    this.restTimer = setTimeout(() => this._finishRest(), 1600);
  },
  _finishRest() {
    clearTimeout(this.restTimer);
    this.restSampling = false;
    if (this.restData.length < 4) return;
    const median = arr => { const s = [...arr].sort((a, b) => a - b); return s[s.length >> 1]; };
    const rest = {
      level: median(this.restData.map(d => d.level)),
      bass: median(this.restData.map(d => d.bass)),
      mid: median(this.restData.map(d => d.mid)),
      treble: median(this.restData.map(d => d.treble)),
    };
    this.cal.rest = rest;
    for (const band of ['level', 'bass', 'mid', 'treble']) this.cal.lo[band] = Math.min(this.cal.lo[band], rest[band]);
    this.restData = [];
    this.save();
    this.relayIfElectron();
  },

  // Show window only: mirror device list + connection + a light status
  // picture to the control window, same combined shape as midi:devices.
  relayIfElectron() {
    if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendAudioInDevices) return;
    window.electronAPI.sendAudioInDevices({
      connected: this.connected, denied: this.denied,
      devices: this.devices, device: this.device,
      level: this.level, restSet: !!this.cal.rest,
    });
  },
};
AUDIOIN.load();
window.AUDIOIN = AUDIOIN;

// Control window: relayed picture of the show window's real state — never
// local, same split as midiRelay.
const audioInRelay = { connected: false, denied: false, devices: [], device: null, level: 0, restSet: false };
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onAudioInDevices) {
  window.electronAPI.onAudioInDevices(st => {
    Object.assign(audioInRelay, st);
    AUDIOIN._appAudioPending = false;
    if (typeof AUDIOIN.ui === 'function') AUDIOIN.ui();
  });
}
// Show window: run the real connect/device-pick when the console asks.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAudioInConnectRequested) {
  window.electronAPI.onAudioInConnectRequested(() => AUDIOIN.connect());
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAudioInSetDeviceRequested) {
  window.electronAPI.onAudioInSetDeviceRequested(id => AUDIOIN.setDevice(id));
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAppAudioCaptureRequested) {
  window.electronAPI.onAppAudioCaptureRequested(() => AUDIOIN.captureAppAudio());
}

// Test hook, mirroring setChan(): playtest.js/shotcam.mjs have no real mic
// in a sandbox — this lets them drive an audio-reactive scene deterministically
// for the idle/minimal/full screenshot states every other scene already gets.
function setAudioIn(vals) {
  if (!vals) return;
  Object.assign(AUDIOIN, vals);
  AUDIOIN.connected = true;
  AUDIOIN._testOverride = true;
}
window.setAudioIn = setAudioIn;
