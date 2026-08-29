'use strict';
/* ============================================================
   SOURCE // INTERACTION LIBRARY — core framework
   Two channels. L and R. Everything else is interpretation.
   ============================================================ */

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
// smooth bump centered at c with half-width w, evaluated at x (all 0..1 space)
const bump = (x, c, w) => { const d = Math.abs(x - c) / w; return d >= 1 ? 0 : smooth(1 - d); };

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// minor pentatonic helper
const PENTA = [0, 3, 5, 7, 10];
function penta(n, base = 220) {
  const oct = Math.floor(n / PENTA.length), st = PENTA[((n % PENTA.length) + PENTA.length) % PENTA.length];
  return base * Math.pow(2, oct + st / 12);
}

/* ============================================================
   AUDIO ENGINE
   ============================================================ */
/* Nima: "when I click on a scene and I haven't triggered the set, it should
   just do what it used to on the web — the detail view, and let me interact
   with it." ADR-0007 turned the control window into a show console
   UNCONDITIONALLY, which was wrong: the console is what you want DURING a
   show, and the plain web app is what you want the rest of the time.
   showLive is that distinction. PLAY raises it; CLOSE drops it. While it is
   down the control window is the web app — it renders its own scene, makes
   its own sound, and does NOT drive the show window (two copies of the same
   scene would otherwise both play audio). While it is up it is the console:
   set list, live feed of the wall, silent locally. */
let showLive = false;
function setShowLive(on) {
  showLive = !!on;
  if (window.ELECTRON_ROLE !== 'control') return;
  document.documentElement.classList.toggle('showlive', showLive);
  // the control window's own output is muted only while the wall is live
  if (AE._mute) AE._mute.gain.value = showLive ? 0 : 1;
  if (!showLive && focus.idx >= 0 && !focus.P) {
    // came back from a show with a scene still open and no local instance —
    // rebuild it so the stage isn't an empty box
    const i = focus.idx; closeFocus(); openFocus(i);
  }
}
const AE = {
  ctx: null, master: null, on: true, _noiseBuf: null,
  ensure() {
    // Review pass on this branch: the control window used to bail here with no
    // AudioContext at all, which left T.beats()/T.bar()/H.update() pinned
    // at 0 (they read ctx.currentTime) and starved the MOut monitor + RIG
    // rack of ticks (a scene's audio() never runs without a ctx to build
    // nodes on). The control window now gets a REAL context too — same
    // graph, same DSP cost — so T advances and the mirror renders scenes
    // keyed to the beat correctly. Only the last hop (comp -> destination)
    // is role-gated, muted for control so none of it is ever audible.
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.85;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 6;
      this.master.connect(comp);
      if (window.ELECTRON_ROLE === 'control') {
        // silent sink: real graph, zero output — see comment above.
        // Audible by default: the control window is the plain web app until
        // PLAY. setShowLive() closes this to 0 for the duration of a show,
        // when the only thing that should make noise is the show window.
        const mute = this.ctx.createGain();
        mute.gain.value = showLive ? 0 : 1;
        this._mute = mute;
        comp.connect(mute); mute.connect(this.ctx.destination);
      } else {
        comp.connect(this.ctx.destination);
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    relayAudioStatusIfElectron();
  },
  t() { return this.ctx ? this.ctx.currentTime : 0; },
  out() { return this.master; },
  noiseBuf() {
    if (!this._noiseBuf) {
      const len = this.ctx.sampleRate | 0, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._noiseBuf = b;
    }
    return this._noiseBuf;
  },
  pan(node, pan) {
    if (this.ctx.createStereoPanner && pan !== 0) {
      const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1);
      node.connect(p); return p;
    }
    return node;
  },
  // short decaying tone
  pluck(freq, { vol = 0.18, dur = 0.4, type = 'sine', pan = 0, detune = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.t();
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    this.pan(g, pan).connect(this.out());
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  // bell-ish: fundamental + inharmonic partial
  chime(freq, { vol = 0.12, dur = 1.4, pan = 0 } = {}) {
    if (!this.ctx) return;
    this.pluck(freq, { vol, dur, type: 'sine', pan });
    this.pluck(freq * 2.76, { vol: vol * 0.35, dur: dur * 0.6, type: 'sine', pan });
    this.pluck(freq * 5.4, { vol: vol * 0.12, dur: dur * 0.3, type: 'sine', pan });
  },
  // filtered noise burst
  hit({ vol = 0.2, dur = 0.15, freq = 2000, q = 1, pan = 0, type = 'bandpass', at = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = Math.max(this.t(), at || 0);
    const src = this.ctx.createBufferSource(); src.buffer = this.noiseBuf();
    src.playbackRate.value = 0.9 + Math.random() * 0.2;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g);
    this.pan(g, pan).connect(this.out());
    src.start(t0); src.stop(t0 + dur + 0.05);
  },
  // continuous voice factory — returns handle with nodes + kill()
  voice() {
    const group = this.ctx.createGain(); group.gain.value = 0;
    group.connect(this.out());
    const oscs = [];
    const h = {
      group,
      gain: group.gain,
      osc: (type, freq) => {
        const o = AE.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
        o.start(); oscs.push(o); return o;
      },
      noise: () => {
        const s = AE.ctx.createBufferSource(); s.buffer = AE.noiseBuf(); s.loop = true;
        s.start(); oscs.push(s); return s;
      },
      filter: (type, freq, q = 1) => {
        const f = AE.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f;
      },
      g: (v = 0) => { const g = AE.ctx.createGain(); g.gain.value = v; return g; },
      fadeIn: (v = 1, s = 0.4) => { group.gain.cancelScheduledValues(AE.t()); group.gain.setTargetAtTime(v, AE.t(), s); },
      kill: (s = 0.25) => {
        try {
          group.gain.cancelScheduledValues(AE.t());
          group.gain.setTargetAtTime(0, AE.t(), s);
        } catch (e) {}
        setTimeout(() => { oscs.forEach(o => { try { o.stop(); } catch (e) {} }); try { group.disconnect(); } catch (e) {} }, s * 1000 + 600);
      }
    };
    return h;
  },
  // smooth param set
  set(param, v, s = 0.06) { try { param.setTargetAtTime(v, this.t(), s); } catch (e) {} }
};

/* ============================================================
   CHANNELS — the two hands
   ============================================================ */
const chan = {
  L: { v: 0, target: 0, mode: 'drift', last: -99, raw: 0, hist: [], absentSince: 0 },
  R: { v: 0, target: 0, mode: 'drift', last: -99, raw: 0, hist: [], absentSince: 0 }
};

/* ============================================================
   CALIBRATION — turning what the sensor says into what the
   scenes are written against.
   Every scene assumes the same contract: 0 = hands at the
   source, 1 = full reach outward. A laser rangefinder or a
   theremin knows none of that. It has its own working range,
   possibly the opposite polarity, and — the part that bites on
   playa — it keeps streaming a value whether or not a hand is
   in front of it, so "a message arrived" cannot mean "someone
   is playing".
   Three fixes, all opt-in: the learn sweep's measured range is
   kept instead of thrown away, polarity is a toggle, and REST
   (sampled with nobody at the instrument) is what presence is
   actually measured against.
   Nothing here engages until a range is learned, so on-screen
   input, keys and plain MIDI controllers behave exactly as
   before.
   ============================================================ */
const CAL = {
  DEADZONE: 0.02,    // bottom of the mapped range reads as a clean 0
  REST_EPS: 0.06,    // raw distance from the rest reading that counts as a hand
  MOVE_EPS: 0.02,    // ...or this much movement inside the window, hand parked at rest
  WINDOW: 2.5,       // seconds of raw history the movement test looks at
  ABSENT_HOLD: 1.2   // seconds of confirmed absence before the channel lets go
};
function ghostL(t) { return clamp(0.5 + 0.42 * Math.sin(t * 0.13 + 1.7) + 0.09 * Math.sin(t * 0.53 + 0.4)); }
function ghostR(t) { return clamp(0.5 + 0.40 * Math.sin(t * 0.094 + 4.2) + 0.10 * Math.sin(t * 0.61 + 2.1)); }
let nowT = 0;
// `raw` present means this came off a sensor and is subject to the presence
// test. A pointer, key or slider is a human by definition and always counts.
/* NEAR = MORE (Lance, Aug 2026) — one global flip of the hand grammar:
   physically approaching the source reads as intensity. Applied here, at
   the single gate every REAL input passes through (mouse, keys, learned
   sensors alike), so all nine scenes keep ONE grammar; ghosts author their
   drift in scene units and are deliberately untouched. Presence detection
   runs on raw readings and is unaffected. THE CHANNEL STAYS IN HAND SPACE
   (0 = at the source, 1 = arm's reach) so beams, widgets and the DBG bars
   track the physical hands truthfully — Lance caught the lazy version,
   which flipped the value here and mirrored the laser against the hand.
   The semantic flip (near = intense) happens at the ONE place scenes read
   input: the inp construction in part5_tail. Unconditional, no state. */
function setChan(side, v, raw) {
  // Nima, testing live: mouse-driven hand input in the control window
  // wasn't reaching the show window at all. Real MIDI already doesn't need
  // this — it's read directly in the show window (ADR-0006) and drives
  // chan.L/R there natively — but the control window's mouse/keyboard
  // virtual-theremin fallback (this function, called with no `raw`) had
  // nowhere else to go. Relay it; the show window's own setChan() call
  // below (from onHandDrive) doesn't re-relay, so no echo risk.
  if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.driveHand(side, v);
  const c = chan[side];
  if (raw === undefined) {
    c.target = clamp(v); c.mode = 'live'; c.last = nowT; c.absentSince = 0;
    return;
  }
  c.raw = raw;
  c.hist.push({ t: nowT, raw });
  while (c.hist.length && nowT - c.hist[0].t > CAL.WINDOW) c.hist.shift();
  if (handPresent(side)) {
    c.target = clamp(v); c.mode = 'live'; c.last = nowT; c.absentSince = 0;
  } else {
    if (!c.absentSince) c.absentSince = nowT;
    // still tracking through the grace period — a hand that pauses dead still
    // for half a second must not get dropped mid-gesture
    if (c.mode === 'live') c.target = clamp(v);
  }
}
// Is there a hand out there, or is this just the sensor idling?
function handPresent(side) {
  const c = chan[side], cal = midi.cal[side];
  // no rest reading → fall back to the old rule: a message IS a hand
  if (!cal || cal.rest === null || cal.rest === undefined) return true;
  if (Math.abs(c.raw - cal.rest) > CAL.REST_EPS) return true;
  // sitting at rest but still moving: someone is working right at the sphere
  let lo = 1, hi = 0;
  for (let i = 0; i < c.hist.length; i++) {
    const r = c.hist[i].raw;
    if (r < lo) lo = r;
    if (r > hi) hi = r;
  }
  return (hi - lo) > CAL.MOVE_EPS;
}
let ghostsOn = true;      // the library wall breathes by default
let sceneGhosts = false;  // a focused scene STARTS still — GHOSTS in its sidebar opts in
function updateChannels(t, dt) {
  nowT = t;
  const ambient = focus.idx < 0 ? ghostsOn : sceneGhosts;
  for (const side of ['L', 'R']) {
    const c = chan[side];
    if (c.mode === 'live') {
      if (c.absentSince) {
        // a rest-calibrated sensor can tell "held still" from "nobody there",
        // so it lets go in about a second and settles the instrument to rest
        // instead of freezing on whatever an empty sensor happens to read
        if (t - c.absentSince > CAL.ABSENT_HOLD) { c.mode = 'drift'; if (!ambient) c.target = 0; }
      } else if (t - c.last > 6) { c.mode = 'drift'; if (!ambient) c.target = c.v; } // HOLD, don't snap
    }
    if (c.mode === 'drift' && ambient) c.target = side === 'L' ? ghostL(t) : ghostR(t);
    c.v += (c.target - c.v) * Math.min(1, dt * (c.mode === 'live' ? 14 : 2.2));
  }
  SUMMON.step(t, dt);
}

/* THE SUMMONS (Lance, Aug 2026) — the master code, ONE grammar across every
   scene: park the LEFT hand at the source and WIGGLE the right hand for a
   few seconds. The charge fills (~3.5s), then a ~45s BEAT WINDOW opens for
   any scene that gates its groove on it. The scenes stay ambient art for
   strangers; whoever knows the code brings the band in to jam. Per-scene
   secret unlocks (Chladni's rail) remain their own thing on top.
   LIVE HANDS ONLY — ghosts can never summon. Scenes read window.SUMMON
   ({charge 0..1, active 0|1}) or inp.summon / inp.summonCharge. */
const SUMMON = {
  charge: 0, active: 0, until: 0, _dir: 0, _flips: 0, _flipT: -9, _lastR: 0,
  step(t, dt) {
    const live = chan.L.mode === 'live' && chan.R.mode === 'live';
    const parked = live && chan.L.v < 0.18;          // raw hand space: AT the source
    const dR = chan.R.v - this._lastR; this._lastR = chan.R.v;
    if (Math.abs(dR) > 0.006) {
      const d = dR > 0 ? 1 : -1;
      if (d !== this._dir) { this._dir = d; this._flips++; this._flipT = t; }
    }
    if (t - this._flipT > 0.8) this._flips = 0;
    if (parked && this._flips >= 4) this.charge = Math.min(1, this.charge + dt / 3.5);
    else if (!this.active) this.charge = Math.max(0, this.charge - dt / 1.5);
    if (this.charge >= 1 && !this.active) { this.active = 1; this.until = t + 45; }
    if (this.active && t > this.until) { this.active = 0; this.charge = 0; this._flips = 0; }
  }
};
window.SUMMON = SUMMON;

/* ============================================================
   MIDI IN — device picker + range-based learn.
   Learn watches ~2.5s of movement and infers the encoding:
   CC (any number, 0–127), pitch bend (14-bit), or channel
   pressure — binding whichever source actually moved, ON the
   device it moved on. Two different theremins can therefore
   drive L and R independently, even on the same channel/CC.
   ============================================================ */
const midi = {
  access: null, map: { L: null, R: null }, learn: null, learnData: null, learnTimer: null, inputId: 'all',
  // per-side calibration: {lo, hi} working range, `inv` polarity, `rest` = the
  // raw reading with nobody at the instrument. null until a range is learned.
  cal: { L: null, R: null },
  restSampling: false, restData: { L: [], R: [] }, restTimer: null
};
// Electron control window (ticket #36): never opens real MIDI — this is the
// relayed picture of the show window's real midi.access, same pattern as
// ticket #31's display list. Picking a device is UI-only here; the show
// window is what actually binds to it, for lowest latency (Nima's call).
// Review pass: inputId relayed too, so the control window's IN
// dropdown can show the show window's real selection instead of always
// defaulting to ALL DEVICES.
const midiRelay = { connected: false, inputs: [], outputs: [], map: { L: null, R: null }, calRested: { L: false, R: false }, calInv: { L: false, R: false }, denied: false, inputId: 'all' };
// Nima: clicking CONNECT in the control window relays the request and
// returns immediately (the real connect happens in the show window) — with
// nothing marking that gap, the button just vanished once midiRelay caught
// up, reading as "it did nothing." This tracks the wait so SHOW CHECK's
// HANDS row can say "connecting…" instead, and gives up after 6s (denied
// permission, no navigator.requestMIDIAccess, or the show window just isn't
// answering) rather than spinning forever.
let midiConnectPending = false, midiConnectTimer = null;
function clearMidiConnectPending() { midiConnectPending = false; clearTimeout(midiConnectTimer); midiConnectTimer = null; }
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onMidiDevices) {
  window.electronAPI.onMidiDevices(devices => {
    Object.assign(midiRelay, devices);
    clearMidiConnectPending();
    if (typeof refreshMidiUI === 'function') refreshMidiUI();
  });
}
// Nima: LEARN now works from the control window too — relayed to the show
// window, which owns the real device (ADR-0006). Same "the click landed
// but there's a round trip" problem as CONNECT: track per-side pending so
// the button can say MOVE L… during the ~2.6s sweep instead of just sitting
// there, and time out at 3.2s if the show window never answers.
let midiLearnPending = { L: false, R: false }, midiLearnTimer = { L: null, R: null };
function clearMidiLearnPending(side) {
  midiLearnPending[side] = false;
  clearTimeout(midiLearnTimer[side]); midiLearnTimer[side] = null;
}
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onMidiLearnResult) {
  window.electronAPI.onMidiLearnResult(({ side, map }) => {
    clearMidiLearnPending(side);
    if (map) midiRelay.map = map;
    if (typeof refreshMidiUI === 'function') refreshMidiUI();
  });
}
// Nima: SHOW CHECK's SOUND row was reading local AE.ctx/AE.on in the
// control window, whose graph is real but silent (AE.ensure, above) — so
// it can never answer "is the wall audible", and before the muted-graph
// fix it read "no audio context yet" forever. Same fix shape as MIDI:
// relay the real state instead of checking local state that can never be
// real. PRE.rows() (part5_tail.js) reads this when inElectronControl.
const audioRelay = { on: true, ctxState: null, sampleRate: null };
function relayAudioStatusIfElectron() {
  if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendAudioStatus) return;
  window.electronAPI.sendAudioStatus({
    on: AE.on,
    ctxState: AE.ctx ? AE.ctx.state : null,
    sampleRate: AE.ctx ? AE.ctx.sampleRate : null,
  });
}
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onAudioStatus) {
  // Just store it — PRE's own 600ms poll (part5_tail.js) already re-renders
  // the open modal and will pick this up on its next tick. Nima found that
  // forcing an extra immediate PRE.render() here, racing that poll on its
  // own out-of-phase ~1s cadence, was rebuilding the modal's innerHTML twice
  // in quick, unsynced succession — that's what read as button flicker.
  window.electronAPI.onAudioStatus(status => { Object.assign(audioRelay, status); });
}
// Show window: relay periodically too, not just on ensure() — ctx.resume()
// is async and audio can suspend/resume on its own (tab backgrounding
// etc.), neither of which re-calls ensure().
if (window.ELECTRON_ROLE === 'show') setInterval(relayAudioStatusIfElectron, 1000);
// Show window: AE.ensure() normally only runs when a scene opens (or a
// manual gesture) — so SHOW CHECK read red the moment you opened it, before
// PLAY/any scene had ever run, even with the autoplay-policy gate lifted
// (electron/main.js) making the ensure() itself perfectly safe to do early.
// Nima: "still happening... when I'm in CHECK mode." Start it at boot
// instead of waiting for a scene to ask for it.
// Review pass: AE.ensure() now builds a real (muted) graph for
// control too, so control needs to boot its context at startup the same
// way show does — otherwise T/H stay pinned at 0 until a scene opens.
// Only 'show' gets AE.on = true; control's audible flag must stay whatever
// SOUND relay/local state says (it never actually outputs regardless).
if (window.ELECTRON_ROLE) {
  if (window.ELECTRON_ROLE === 'show') AE.on = true;
  AE.ensure();
}
// Show window: control's WAKE AUDIO fix button has no local AudioContext to
// wake (see fix above) — relayed here instead, same shape as midi:connect.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onAudioWakeRequested) {
  window.electronAPI.onAudioWakeRequested(() => {
    AE.on = true; AE.ensure();
    if (focus.idx >= 0 && typeof startVoice === 'function') startVoice();
  });
}
// Show window (ticket #34): the other half of openFocus()'s relay above —
// PIECES isn't populated yet at this point in the concatenated build, but
// this only registers the callback; PIECES is real by the time PLAY fires.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onOpenScene) {
  window.electronAPI.onOpenScene(sceneId => {
    const idx = PIECES.findIndex(p => p.id === sceneId);
    // Review pass, belt-and-braces: part5_tail.js's openFocus wrapper
    // is supposed to pass fromRelay through untouched, but if a future
    // wrapper ever drops the second arg again, this guard still stops the
    // ping-pong — never re-open the scene the show window is already on.
    if (idx >= 0 && idx !== focus.idx) {
      // control no longer sends a closeScene before a switch (that stows the
      // window), so do the close half here — otherwise a switch stacks a new
      // scene on the old one and the previous scene's notes never get an
      // all-off into Live.
      if (focus.idx >= 0) closeFocus();
      openFocus(idx, true);
    }
  });
}
// Control window: the reverse direction — the show window advanced on its
// own (SHOWTIME auto-advance, an edge click, PADMAP), so the mirror has to
// catch up too. fromRelay=true suppresses re-relaying back to show; the
// idx check skips the redundant re-open when this is just the echo of a
// scene control opened itself a moment ago.
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onSyncSceneFromShow) {
  window.electronAPI.onSyncSceneFromShow(sceneId => {
    const idx = PIECES.findIndex(p => p.id === sceneId);
    if (idx >= 0 && idx !== focus.idx) openFocus(idx, true);
  });
}
// Show window: the control window's mouse/keyboard virtual theremin has no
// other way to reach the real engine (real MIDI-in stays exclusively
// show's own — ADR-0006). setChan() here doesn't re-relay (that only
// happens for role==='control'), so this can't echo back.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onHandDrive) {
  window.electronAPI.onHandDrive((side, v) => setChan(side, v));
}
// Show window, same review pass: hand input was one-way (control -> show only),
// so while a real theremin drove the show window, the control window's own
// chan.L/R sat at rest and rendered wrong. Broadcast the real values at
// 20Hz so the mirror actually mirrors.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.sendHandMirror) {
  setInterval(() => window.electronAPI.sendHandMirror({
    L: { v: chan.L.v, target: chan.L.target, mode: chan.L.mode },
    R: { v: chan.R.v, target: chan.R.target, mode: chan.R.mode },
  }), 50);
}
// Control window: apply the relayed hand state DIRECTLY to chan, never
// through setChan() — setChan() on the control side relays control->show,
// so routing through it here would ping the value straight back to show.
// This also fixes the keyboard: applyKeys() reads chan[side].target, which
// is now the show window's real value instead of a stale local one.
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onHandMirror) {
  window.electronAPI.onHandMirror(state => {
    for (const side of ['L', 'R']) {
      const s = state[side], c = chan[side];
      if (!s) continue;
      c.v = s.v; c.target = s.target; c.mode = s.mode;
      c.last = nowT; c.absentSince = 0;
    }
  });
}
// Show window: the control window's CONNECT/TEST/LEARN buttons all funnel
// through connectMidi()/MOut.testBurst(), which now relay here instead of
// running locally (see connectMidi() below, MOut.testBurst() override at
// the very end of this file, after MOut exists).
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onMidiConnectRequested) {
  window.electronAPI.onMidiConnectRequested(() => connectMidi());
}
// Show window: LEARN clicks and device picks from the control window's own
// MAP popover, relayed here — startLearn(side)'s existing toggle logic
// (below) handles both start and cancel from the same channel.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onMidiLearnRequested) {
  window.electronAPI.onMidiLearnRequested(side => startLearn(side));
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onMidiSetInputRequested) {
  window.electronAPI.onMidiSetInputRequested(id => { midi.inputId = id; refreshMidiUI(); });
}
// Show window, same review pass: the other half of closeFocus()'s relay above —
// CLOSE clicked in the control window actually closes the scene here too.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onCloseScene) {
  window.electronAPI.onCloseScene(() => { if (focus.idx >= 0) closeFocus(); });
}
// restore learned theremin bindings from a previous visit
try {
  const sm = JSON.parse(localStorage.getItem('srcMidiMap') || 'null');
  if (sm && (sm.L || sm.R)) { midi.map.L = sm.L || null; midi.map.R = sm.R || null; }
} catch (e) {}
try {
  const sc = JSON.parse(localStorage.getItem('srcMidiCal') || 'null');
  if (sc) { midi.cal.L = sc.L || null; midi.cal.R = sc.R || null; }
} catch (e) {}
let _calSaveT = null;
function saveCal() {
  clearTimeout(_calSaveT); _calSaveT = null;
  try { localStorage.setItem('srcMidiCal', JSON.stringify(midi.cal)); } catch (e) {}
}
// the range self-widens while playing; coalesce those writes
function saveCalSoon() { if (!_calSaveT) _calSaveT = setTimeout(saveCal, 1200); }

/* Raw sensor reading → the 0..1 every scene is written against:
   working range → polarity → deadzone. */
function calValue(side, raw) {
  const cal = midi.cal[side];
  if (!cal) return raw;
  // the 2.6s sweep is a starting guess. Hardware drifts with heat and dust and
  // nobody re-sweeps mid-show, so the range keeps widening to fit reality.
  if (raw < cal.lo) { cal.lo = raw; saveCalSoon(); }
  if (raw > cal.hi) { cal.hi = raw; saveCalSoon(); }
  const span = cal.hi - cal.lo;
  let v = clamp(span > 0.02 ? (raw - cal.lo) / span : raw);
  if (cal.inv) v = 1 - v;
  return v <= CAL.DEADZONE ? 0 : (v - CAL.DEADZONE) / (1 - CAL.DEADZONE);
}
const srcKey = m => m ? m.type + ':' + m.ch + ':' + m.num + ':' + m.dev : '';
/* REST — hold everyone back from the instrument and press this. Whatever the
   sensors read with nobody there becomes the zero point of presence, which is
   what lets an always-streaming rangefinder ever go idle. */
// Nima: "I always see REST not set. How do I set that?" — because in the
// control window there was no button: the whole calibration box was hidden
// and SHOW CHECK's fix said "set it in the SHOW window", which means walking
// to the projector. The stated reason was that calibration needs a live
// raw-value stream, and that is only half true: SET REST is a fire-and-forget
// 1.6s sample whose RESULT already comes back over midiRelay.calRested. Only
// the live #calRead readout genuinely needs the stream. So the three actions
// relay; the readout stays show-only and is hidden here rather than lying.
let restPending = false, restPendingTimer = null;
function startRest() {
  if (window.ELECTRON_ROLE === 'control') {
    if (window.electronAPI) window.electronAPI.sendShowControl('setRest');
    restPending = true;                       // covers the 1.6s sample + round trip
    clearTimeout(restPendingTimer);
    restPendingTimer = setTimeout(() => { restPending = false; refreshMidiUI(); }, 2000);
    refreshMidiUI();
    return;
  }
  if (midi.restSampling) return;
  midi.restSampling = true;
  midi.restData = { L: [], R: [] };
  clearTimeout(midi.restTimer);
  midi.restTimer = setTimeout(finishRest, 1600);
  refreshMidiUI();
}
function finishRest() {
  clearTimeout(midi.restTimer);
  midi.restSampling = false;
  for (const side of ['L', 'R']) {
    const d = midi.restData[side];
    if (d.length < 4) continue;                 // that side never spoke — leave it alone
    d.sort((a, b) => a - b);
    const rest = d[d.length >> 1];              // median: one spike can't move it
    const cal = midi.cal[side] || (midi.cal[side] = { lo: 0, hi: 1, inv: false, rest: null });
    cal.rest = rest;
    cal.src = srcKey(midi.map[side]);
  }
  midi.restData = { L: [], R: [] };
  saveCal();
  refreshMidiUI();
}
function setInvert(side, on) {
  if (window.ELECTRON_ROLE === 'control') {
    if (window.electronAPI) window.electronAPI.sendShowControl('invert', side);
    return;   // the show window flips it and relays the new state back
  }
  const cal = midi.cal[side] || (midi.cal[side] = { lo: 0, hi: 1, inv: false, rest: null });
  cal.inv = on === undefined ? !cal.inv : !!on;
  saveCal(); refreshMidiUI();
}
function clearCal() {
  if (window.ELECTRON_ROLE === 'control') {
    if (window.electronAPI) window.electronAPI.sendShowControl('calClear');
    return;
  }
  midi.cal.L = null; midi.cal.R = null;
  for (const side of ['L', 'R']) { chan[side].hist.length = 0; chan[side].absentSince = 0; }
  saveCal(); refreshMidiUI();
}
function bindMidiInputs() {
  if (!midi.access) return;
  midi.access.inputs.forEach(inp => { inp.onmidimessage = onMidiMsg; });
}
// parse one message into {srcKey parts, value 0..1} or null
function parseMidi(e) {
  const [st, d1, d2] = e.data;
  const ch = st & 15, hi = st & 0xF0;
  const dev = (e.target && e.target.id) || 'dev';
  if (hi === 0xB0) return { type: 'cc', ch, num: d1, dev, val: d2 / 127 };
  if (hi === 0xE0) return { type: 'bend', ch, num: 0, dev, val: ((d2 << 7) | d1) / 16383 };
  if (hi === 0xD0) return { type: 'at', ch, num: 0, dev, val: d1 / 127 };
  return null;
}
function srcMatches(m, p) {
  return m && m.type === p.type && m.ch === p.ch && m.num === p.num && m.dev === p.dev;
}
function onMidiMsg(e) {
  // OUR OWN ECHO (Lance's queue-jump bug, Aug 2026): a mac IAC bus mirrors
  // everything sent into it back out to every listener, so the browser
  // hears every note it plays into Live. Drop anything arriving from the
  // port MIDI OUT is talking to — otherwise scene notes masquerade as pad
  // hits (opening Rain "pressed" a queue pad) and a stray echo during
  // PAD LEARN or hand LEARN poisons the mapping.
  if (typeof MOut !== 'undefined' && MOut.port && e.target &&
      e.target.name && e.target.name === MOut.port.name) return;
  // SHOW CONTROL (ADR-0008) gets first look, BEFORE the hands' midi.inputId
  // filter below. That filter is one global scalar: the moment an operator
  // picks a specific device for the hands, a second device's CCs would be
  // dropped before the nav pad ever saw them. Note-ons already bypassed it —
  // CCs must too, or the nav controller only half works.
  //
  // Note-ons are also a separate NAMESPACE: the hand system binds cc/bend/at
  // only, so pad notes can never be mistaken for a hand.
  const hi0 = e.data[0] & 0xF0;
  const navDev = (e.target && e.target.id) || 'dev';
  const navDevName = (e.target && e.target.name) || '';
  if (window.NAV) {
    if (hi0 === 0x90 && e.data[2] > 0) {
      window.NAV.onMsg({ type: 'note', ch: e.data[0] & 15, num: e.data[1], dev: navDev, devName: navDevName });
    } else if (hi0 === 0xB0) {
      // RISING EDGE ONLY — a momentary switch sends 127 then 0, and firing on
      // both would advance two scenes per press.
      const key = (e.data[0] & 15) + ':' + e.data[1] + ':' + navDev;
      const was = window.NAV._last[key] || 0, now = e.data[2];
      window.NAV._last[key] = now;
      if (now > 63 && was <= 63) {
        window.NAV.onMsg({ type: 'cc', ch: e.data[0] & 15, num: e.data[1], dev: navDev, devName: navDevName });
      }
    }
  }
  const p = parseMidi(e);
  if (!p) return;
  if (midi.learn) {
    // device filter applies during learn too, unless listening to all
    if (midi.inputId !== 'all' && p.dev !== midi.inputId) return;
    // ...and never bind something SHOW CONTROL already owns: a nav pad
    // pressed during a hand sweep would otherwise steal the hand. claims()
    // covers the pad SLOT RANGE as well as prev/next — checking only
    // prev/next left a CC-based pad base stealable.
    if (window.NAV && NAV.claims(p)) return;
    const key = p.type + ':' + p.ch + ':' + p.num + ':' + p.dev;
    const d = midi.learnData[key] || (midi.learnData[key] = { min: 1, max: 0, n: 0, src: { type: p.type, ch: p.ch, num: p.num, dev: p.dev } });
    d.min = Math.min(d.min, p.val); d.max = Math.max(d.max, p.val); d.n++;
    // decisive: one source swept most of its range
    if (d.max - d.min > 0.5 && d.n > 8) finishLearn();
    return;
  }
  if (midi.inputId !== 'all' && p.dev !== midi.inputId) return;
  for (const side of ['L', 'R']) {
    if (!srcMatches(midi.map[side], p)) continue;
    if (midi.restSampling) { midi.restData[side].push(p.val); continue; }
    setChan(side, calValue(side, p.val), p.val);
  }
}
function startLearn(side) {
  // Nima: "it should really be allowing me to pick the device and map it
  // in" — LEARN needs live MIDI events, which only the show window has
  // (ADR-0006), so relay the request instead of running a fake sweep here
  // that can never see anything move. The show window's own startLearn()
  // already toggles start/cancel on a repeat call for the same side — relay
  // every click unconditionally and let it decide which; mirror that same
  // toggle locally for the button's MOVE L…/LEARN L text.
  if (window.ELECTRON_ROLE === 'control') {
    if (window.electronAPI) window.electronAPI.requestMidiLearn(side);
    if (midiLearnPending[side]) {
      clearMidiLearnPending(side);
    } else {
      midiLearnPending[side] = true;
      clearTimeout(midiLearnTimer[side]);
      midiLearnTimer[side] = setTimeout(() => clearMidiLearnPending(side), 3200);
    }
    if (typeof refreshMidiUI === 'function') refreshMidiUI();
    return;
  }
  if (midi.learn === side) { cancelLearn(); return; }
  midi.learn = side;
  midi.learnData = {};
  clearTimeout(midi.learnTimer);
  // after 2.6s of listening, bind the source that moved the most
  midi.learnTimer = setTimeout(finishLearn, 2600);
  refreshMidiUI();
}
function finishLearn() {
  clearTimeout(midi.learnTimer);
  const side = midi.learn;
  if (!side) return;
  let best = null, bestScore = 0;
  for (const key in midi.learnData) {
    const d = midi.learnData[key];
    const score = (d.max - d.min) + Math.min(d.n, 40) * 0.002; // range wins, activity breaks ties
    if (score > bestScore) { bestScore = score; best = d; }
  }
  midi.learn = null; midi.learnData = null;
  if (best && bestScore > 0.04) {
    const wasKey = srcKey(midi.map[side]), prev = midi.cal[side];
    midi.map[side] = best.src;
    try { localStorage.setItem('srcMidiMap', JSON.stringify(midi.map)); } catch (e) {}
    // the sweep measured this control's working range — KEEP it. Without this
    // a sensor that really travels 0.15–0.72 gives the scenes 0.15–0.72 and
    // full reach never arrives at 1.0.
    const sameSrc = wasKey && wasKey === srcKey(best.src);
    midi.cal[side] = {
      lo: best.min, hi: best.max,
      inv: prev ? prev.inv : false,                       // polarity is an operator choice
      rest: sameSrc && prev ? prev.rest : null,           // a different control needs a new REST
      src: srcKey(best.src)
    };
    saveCal();
  }
  refreshMidiUI();
  relayMidiLearnResultIfElectron(side);
}
function cancelLearn() {
  clearTimeout(midi.learnTimer);
  const side = midi.learn;
  midi.learn = null; midi.learnData = null;
  refreshMidiUI();
  if (side) relayMidiLearnResultIfElectron(side);
}
// Show window only: tell the control window a sweep ended (bound or not —
// the fresh map label either way) so its LEARN button stops showing MOVE
// L… immediately instead of waiting out the 3.2s pending timeout.
function relayMidiLearnResultIfElectron(side) {
  if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendMidiLearnResult) return;
  window.electronAPI.sendMidiLearnResult({ side, map: { L: mapLabel(midi.map.L), R: mapLabel(midi.map.R) } });
}
function connectMidi() {
  // control window never opens real MIDI ports itself — that's still the
  // rule (ADR-0003/#36). But every existing call site (the CONNECT button,
  // TEST, LEARN's auto-connect, SHOW CHECK's fix button, mode-switch
  // auto-connect) calls this function directly, and a plain no-op here
  // left every one of them silently broken from the control window — the
  // CONNECT button did nothing, with no way to trigger the real connect
  // from anywhere else either, since the show window's own button is now
  // invisible by design (picture-only). Relay the REQUEST instead of
  // no-op'ing: every caller above gets fixed for free.
  if (window.ELECTRON_ROLE === 'control') {
    // Review pass: MOut.setMode/applyMode and btnTest all guard with
    // "if (!midi.access) connectMidi()" — and midi.access is ALWAYS null in
    // the control window (it never owns real MIDI), so every OUT-mode
    // change and every TEST click re-fired midi:connect and re-armed the
    // pending timer, flipping SHOW CHECK's Hands row to "connecting…" for
    // no reason even when the show window was already connected. Once the
    // relay says connected, there's nothing left to request.
    if (midiRelay.connected) return;
    if (window.electronAPI) window.electronAPI.requestMidiConnect();
    midiConnectPending = true;
    midiRelay.denied = false; // retrying — don't keep showing the last failure
    clearTimeout(midiConnectTimer);
    midiConnectTimer = setTimeout(clearMidiConnectPending, 6000);
    return;
  }
  if (!navigator.requestMIDIAccess) {
    document.getElementById('btnMidi').textContent = 'MIDI: N/A';
    relayMidiFailureIfElectron();
    return;
  }
  navigator.requestMIDIAccess().then(a => {
    midi.access = a; bindMidiInputs();
    a.onstatechange = () => { bindMidiInputs(); refreshMidiUI(); relayMidiDevicesIfElectron(); };
    refreshMidiUI();
    relayMidiDevicesIfElectron();
  }).catch(() => { document.getElementById('btnMidi').textContent = 'MIDI: DENIED'; relayMidiFailureIfElectron(); });
}
// Show window only: tell the control window CONNECT didn't work (denied
// permission, no Web MIDI at all) so it stops showing "connecting…" and
// gives an actual reason instead of just timing out after 6s.
function relayMidiFailureIfElectron() {
  if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendMidiDevices) return;
  window.electronAPI.sendMidiDevices({
    connected: false, inputs: [], outputs: [],
    map: { L: null, R: null }, calRested: { L: false, R: false }, denied: true,
    inputId: 'all',
  });
}
// Show window only (ticket #36): send the real device list to the control
// window's picker UI, same shape as ticket #31's display:list. Also carries
// map/calRested (Nima: SHOW CHECK's HANDS/CALIBRATION rows were reading
// local midi.access/midi.map/midi.cal — permanently null/inert in the
// control window, same class of bug as SOUND — so CONNECT looked broken
// there even after the show window connected for real).
function relayMidiDevicesIfElectron() {
  if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendMidiDevices || !midi.access) return;
  window.electronAPI.sendMidiDevices({
    connected: true,
    inputs: [...midi.access.inputs.values()].map(d => ({ id: d.id, name: d.name })),
    outputs: [...midi.access.outputs.values()].map(d => ({ id: d.id, name: d.name })),
    map: { L: mapLabel(midi.map.L), R: mapLabel(midi.map.R) },
    calRested: {
      L: !!(midi.cal.L && midi.cal.L.rest !== null && midi.cal.L.rest !== undefined),
      R: !!(midi.cal.R && midi.cal.R.rest !== null && midi.cal.R.rest !== undefined),
    },
    calInv: { L: !!(midi.cal.L && midi.cal.L.inv), R: !!(midi.cal.R && midi.cal.R.inv) },
    denied: false, // clears any stale denial from an earlier failed attempt
    inputId: midi.inputId,
  });
}
// Map/cal can change from LEARN or SET REST, both show-window-only actions
// (ticket #36's deferred half) — poll periodically so those changes still
// reach the control window's SHOW CHECK, same shape as the audio relay.
if (window.ELECTRON_ROLE === 'show') setInterval(relayMidiDevicesIfElectron, 1000);
function mapLabel(m) {
  if (!m) return null;
  return m.type === 'cc' ? 'CC' + m.num : m.type === 'bend' ? 'BEND' : 'AT';
}
function refreshMidiUI() {
  const b = document.getElementById('btnMidi');
  const bl = document.getElementById('btnLearnL'), br = document.getElementById('btnLearnR');
  const sel = document.getElementById('midiInSel');
  // control window (ADR-0006): status + input-device picker reflect the
  // relayed real state (never local — the show window is the sole real
  // owner). LEARN itself is relayed too — clicking it here starts the exact
  // same sweep in the show window, same MOVE L…/LEARN L toggle text, driven
  // by midiLearnPending/midiRelay.map instead of the local midi.learn/map
  // that's permanently inert in this window. Calibration (REST/INVERT)
  // still needs a live raw-value stream this doesn't have yet, so that box
  // stays hidden — SHOW CHECK's CALIBRATION row points at the show window.
  if (window.ELECTRON_ROLE === 'control') {
    b.textContent = midiRelay.connected ? 'MIDI: ON' : 'MIDI: N/A';
    b.classList.toggle('off', !midiRelay.connected);
    bl.style.display = br.style.display = midiRelay.connected ? '' : 'none';
    bl.textContent = midiLearnPending.L ? 'MOVE L…' : midiRelay.map.L ? 'L=' + midiRelay.map.L : 'LEARN L';
    br.textContent = midiLearnPending.R ? 'MOVE R…' : midiRelay.map.R ? 'R=' + midiRelay.map.R : 'LEARN R';
    bl.classList.toggle('learning', midiLearnPending.L);
    br.classList.toggle('learning', midiLearnPending.R);
    const box = document.getElementById('calBox');
    if (box) {
      box.style.display = '';
      const rb = document.getElementById('btnRest');
      if (rb) { rb.textContent = restPending ? 'SAMPLING…' : 'SET REST'; rb.classList.toggle('learning', restPending); }
      for (const side of ['L', 'R']) {
        const ib = document.getElementById('btnInv' + side);
        if (ib) ib.classList.toggle('off', !midiRelay.calInv[side]);
      }
      // #calRead is the LIVE raw-value stream, which is not relayed — an
      // empty box here would read as "the sensors are dead", so hide it and
      // say where it lives instead.
      const rd = document.getElementById('calRead');
      if (rd) rd.style.display = 'none';
      const note = document.getElementById('calRelayNote');
      if (note) note.style.display = '';
    }
    if (sel) {
      if (midiRelay.connected) {
        sel.style.display = '';
        const inputs = midiRelay.inputs;
        // Review pass: fold the relayed selection into the signature
        // too — otherwise picking a device in the show window never
        // rebuilt this <select> (the id/name list alone hadn't changed),
        // so the option never got marked selected here.
        const want = ['all', ...inputs.map(i => i.id)].join('|') + '#' + midiRelay.inputId;
        if (sel.dataset.sig !== want) {
          sel.dataset.sig = want;
          sel.innerHTML = '<option value="all">IN: ALL DEVICES</option>' +
            inputs.map(i => `<option value="${i.id}"${i.id === midiRelay.inputId ? ' selected' : ''}>IN: ${i.name}</option>`).join('');
        }
      } else sel.style.display = 'none';
    }
    return;
  }
  if (midi.access) {
    b.textContent = 'MIDI: ON'; b.classList.remove('off');
    bl.style.display = br.style.display = '';
    bl.textContent = midi.learn === 'L' ? 'MOVE L…' : midi.map.L ? 'L=' + mapLabel(midi.map.L) : 'LEARN L';
    br.textContent = midi.learn === 'R' ? 'MOVE R…' : midi.map.R ? 'R=' + mapLabel(midi.map.R) : 'LEARN R';
    bl.classList.toggle('learning', midi.learn === 'L');
    br.classList.toggle('learning', midi.learn === 'R');
    const box = document.getElementById('calBox');
    if (box) {
      box.style.display = '';
      const rb = document.getElementById('btnRest');
      if (rb) { rb.textContent = midi.restSampling ? 'SAMPLING…' : 'SET REST'; rb.classList.toggle('learning', midi.restSampling); }
      for (const side of ['L', 'R']) {
        const ib = document.getElementById('btnInv' + side);
        if (ib) ib.classList.toggle('off', !(midi.cal[side] && midi.cal[side].inv));
      }
    }
    if (sel) {
      sel.style.display = '';
      const inputs = [...midi.access.inputs.values()];
      const want = ['all', ...inputs.map(i => i.id)].join('|');
      if (sel.dataset.sig !== want) {
        sel.dataset.sig = want;
        sel.innerHTML = '<option value="all">IN: ALL DEVICES</option>' +
          inputs.map(i => `<option value="${i.id}"${i.id === midi.inputId ? ' selected' : ''}>IN: ${i.name}</option>`).join('');
      }
    }
  }
}

/* ============================================================
   SOURCE WIDGET — sphere + lasers
   ============================================================ */
function drawWidget(cv, t) {
  // the instrument, drawn the way it works in the room: the source on its
  // pedestal, hands approaching HORIZONTALLY — closer to the sphere = more
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.clearRect(0, 0, w, h);
  const LT = document.body.classList.contains('light'); // ink palette on the light shell
  const cx = w / 2;
  const floorY = h * 0.82;
  // floor line
  g.strokeStyle = LT ? 'rgba(60,60,60,0.45)' : 'rgba(140,140,140,0.3)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(4, floorY); g.lineTo(w - 4, floorY); g.stroke();
  // pedestal — reflective metal, like the real stand
  const ph = Math.max(10, h * 0.22);
  const r = Math.max(7, Math.min(14, h * 0.1));
  const pw0 = r * 1.7, pw1 = r * 1.05;
  const pg = g.createLinearGradient(cx - pw0 / 2, 0, cx + pw0 / 2, 0);
  pg.addColorStop(0, 'rgba(90,95,92,0.9)'); pg.addColorStop(0.35, 'rgba(225,230,228,0.95)');
  pg.addColorStop(0.5, 'rgba(150,156,152,0.9)'); pg.addColorStop(0.75, 'rgba(200,206,202,0.9)');
  pg.addColorStop(1, 'rgba(70,74,72,0.9)');
  g.fillStyle = pg;
  g.beginPath();
  g.moveTo(cx - pw0 / 2, floorY); g.lineTo(cx - pw1 / 2, floorY - ph);
  g.lineTo(cx + pw1 / 2, floorY - ph); g.lineTo(cx + pw0 / 2, floorY);
  g.closePath(); g.fill();
  g.strokeStyle = LT ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)'; g.stroke();
  const sy = floorY - ph - r + 1; // sphere center height
  const inX = { L: cx - r - 6, R: cx + r + 6 };       // v = 0 (at the source — rest)
  const outX = { L: w * 0.05, R: w * 0.95 };          // v = 1 (arm's reach — full)
  const intensity = 1 - (chan.L.v + chan.R.v) / 2;   // glow = leaning in
  for (const side of ['L', 'R']) {
    const v = chan[side].v;
    const live = chan[side].mode === 'live';
    // beams live in hand space — they track the hands; intensity is read inverted
    const hx = inX[side] + (outX[side] - inX[side]) * v;
    // sensing rail the hand travels on
    g.strokeStyle = LT ? 'rgba(80,80,80,0.3)' : 'rgba(140,140,140,0.22)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(outX[side], sy); g.lineTo(inX[side], sy); g.stroke();
    // the laser — green, like the real beams — stretches as the hand reaches out
    const grad = side === 'L'
      ? g.createLinearGradient(hx, sy, cx - r, sy)
      : g.createLinearGradient(hx, sy, cx + r, sy);
    grad.addColorStop(0, live ? (LT ? 'rgba(4,120,48,0.95)' : 'rgba(210,255,220,0.95)') : (LT ? 'rgba(8,140,55,0.55)' : 'rgba(80,255,120,0.5)'));
    grad.addColorStop(1, LT ? `rgba(8,150,58,${0.2 + v * 0.75})` : `rgba(80,255,120,${0.15 + v * 0.8})`);
    g.strokeStyle = grad;
    g.lineWidth = (1.2 + v * 2.6) * (live ? 1.2 : 1);
    g.shadowColor = LT ? '#0a9e3e' : '#39ff5c'; g.shadowBlur = 3 + v * 9;
    g.beginPath(); g.moveTo(hx, sy); g.lineTo(side === 'L' ? cx - r : cx + r, sy); g.stroke();
    g.shadowBlur = 0;
    // the hand — a vertical palm bar sliding along the rail
    g.fillStyle = live ? (LT ? '#065c28' : '#eafff0') : (LT ? '#7c8a80' : '#6a8a72');
    g.fillRect(hx - 1.5, sy - 8 - v * 4, 3, 16 + v * 8);
    // cc readout under the hand's home edge
    g.fillStyle = live ? (LT ? '#0a7a30' : '#39ff5c') : (LT ? '#6a726c' : '#6a7a6c');
    g.font = '9px ui-monospace,monospace'; g.textAlign = side === 'L' ? 'left' : 'right';
    g.fillText(Math.round(v * 127), side === 'L' ? 4 : w - 4, h - 3);
    if (h > 90) {
      g.fillStyle = live ? (LT ? 'rgba(10,122,48,0.9)' : 'rgba(80,255,120,0.8)') : (LT ? 'rgba(110,118,110,0.8)' : 'rgba(140,150,140,0.6)');
      g.font = '8px ui-monospace,monospace';
      g.fillText(live ? 'LIVE' : 'DRIFT', side === 'L' ? 4 : w - 4, h - 13);
    }
  }
  g.textAlign = 'left';
  // the source — white sphere, halo swells with intensity
  drawWidget._i = (drawWidget._i === undefined ? intensity : drawWidget._i) + (intensity - (drawWidget._i || 0)) * 0.06;
  const di = drawWidget._i;
  const halo = g.createRadialGradient(cx, sy, r * 0.4, cx, sy, r * (2.2 + di * 2.2));
  halo.addColorStop(0, LT ? `rgba(40,80,55,${0.08 + di * 0.2})` : `rgba(240,255,245,${0.1 + di * 0.28})`);
  halo.addColorStop(1, LT ? 'rgba(40,80,55,0)' : 'rgba(240,255,245,0)');
  g.fillStyle = halo;
  g.beginPath(); g.arc(cx, sy, r * (2.2 + di * 2.2), 0, TAU); g.fill();
  const sg = g.createRadialGradient(cx - 3, sy - 3, 1, cx, sy, r + 2);
  sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.55, LT ? '#eef1ee' : '#dfe4e0'); sg.addColorStop(1, LT ? '#b8beba' : '#8a908c');
  g.fillStyle = sg;
  g.beginPath(); g.arc(cx, sy, r, 0, TAU); g.fill();
  if (LT) { g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, sy, r, 0, TAU); g.stroke(); }
}
// the source widget IS the virtual theremin — drag a hand toward the sphere.
// Wired on BOTH views: the scene sidebar's live source AND the library rail's,
// so the wall itself can be played without opening a scene.
function wireSourceWidget(wf) {
  if (!wf) return;
  let drag = false;
  const drive = e => {
    const r = wf.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    // REVERSED like the physical source: at the sphere = 0, reach out = 1
    if (x < 0.5) setChan('L', 1 - clamp((x - 0.05) / (0.44 - 0.05)));
    else setChan('R', 1 - clamp(((1 - x) - 0.05) / (0.44 - 0.05)));
  };
  wf.style.touchAction = 'none'; wf.style.cursor = 'ew-resize';
  wf.addEventListener('pointerdown', e => { drag = true; wf.setPointerCapture(e.pointerId); drive(e); e.preventDefault(); });
  wf.addEventListener('pointermove', e => { if (drag) drive(e); });
  wf.addEventListener('pointerup', () => drag = false);
  wf.addEventListener('pointercancel', () => drag = false);
}
wireSourceWidget(document.getElementById('widgetFocus'));
wireSourceWidget(document.getElementById('widgetTop'));

/* ============================================================
   PIECE REGISTRY + INSTANCES
   ============================================================ */
const PIECES = [];
function reg(def) { PIECES.push(def); }

function makeInstance(def, canvas, w, h) {
  const P = {
    def, canvas, g: canvas.getContext('2d'),
    w, h, state: {}, seed: (Math.random() * 1e9) | 0,
    focused: false, visible: true,
    rand: null,
    ping(cb) { if (P.focused && AE.on && AE.ctx) { try { cb(AE); } catch (e) {} } }
  };
  P.reinit = (newSeed) => {
    if (newSeed !== undefined) P.seed = newSeed;
    P.rand = mulberry32(P.seed);
    P.state = {};
    def.init(P);
  };
  canvas.width = w; canvas.height = h;
  P.reinit();
  return P;
}

/* ============================================================
   FOCUS MODE
   ============================================================ */
const focus = { P: null, voice: null, idx: -1 };
const overlay = document.getElementById('overlay');
const focusCanvas = document.getElementById('focusCanvas');

/* ---------- PROJECTOR FRAME (the default) ----------
   The show is ONE WUXGA render — 1920x1200, 16:10 — fullscreen, cloned to both
   PT-VMZ50s off the splitter. A browser window is never that shape: windowed,
   the stage is a ~3:1 letterbox strip, so scenes get composed in a frame they
   will never actually play in, at half the pixel density areaScale() will see
   live. PROJ pins the render to the real thing: canvas is exactly 1920x1200
   whatever the window is, drawn into the largest 16:10 box that fits and
   centered — the surrounding black is invisible on scrim anyway.
   ON BY DEFAULT everywhere we design (desktop site + preview). Opt out with
   ?win (or press P on the stage) for a native-window canvas. Phones default
   to native — a 2.3MP canvas is ~8x the pixel work a phone screen needs and
   the framerate pays for it — but ?proj forces the show frame even there.    */
const PROJ = (() => {
  const q = location.search;
  const force = /[?&]proj\b/i.test(q), off = /[?&]win\b/i.test(q);
  const P = { w: 1920, h: 1200, on: force || (!off && !window.IS_MOBILE) };
  // ?frame=… picks a different projector class and cascades through every
  // scene (they all read P.w/P.h + areaScale). Named or literal WxH:
  //   ?frame=fhd   ?frame=wxga   ?frame=1400x1050
  const NAMED = { wuxga: [1920, 1200], fhd: [1920, 1080], '1080p': [1920, 1080],
                  wxga: [1280, 800], xga: [1024, 768], uhd: [3840, 2160], '4k': [3840, 2160] };
  const fm = q.match(/[?&]frame=([a-z0-9]+x[0-9]+|[a-z0-9]+)/i);
  if (fm) {
    const v = fm[1].toLowerCase();
    const wh = NAMED[v] || (v.match(/^(\d{3,4})x(\d{3,4})$/) || []).slice(1).map(Number);
    if (wh && wh.length === 2 && wh[0] > 0) { P.w = wh[0]; P.h = wh[1]; if (!off) P.on = true; }
  }
  return P;
})();
// live re-frame (console / future RIG dropdown): setFrame(1920,1080) cascades
// through the open scene immediately — everything reads PROJ.w/h
function setFrame(w, h) { PROJ.w = w | 0; PROJ.h = h | 0; PROJ.on = true; if (typeof syncStage === 'function') syncStage(true); }

/* ---------- VIEW MODES ----------
   What the stage shows: the flat frame, the two-projector ghost, or the
   throw into The Cave (head-on / room 3D). Picked from the VIEW dropdown
   on the stage or cycled with V; the choice persists across scenes and
   visits. Scrim modes need three.js and are skipped on mobile.          */
const VIEW = { mode: 'flat', MODES: ['flat', 'double', 'scrim'] };
// srcView is shared (ticket #30) — the show window must stay FLAT
// regardless of whatever the control window last had set while testing;
// same unconditional-force pattern as PANELS above (ADR-0003).
if (window.ELECTRON_ROLE !== 'show') {
  try {
    let v = localStorage.getItem('srcView');
    if (v === 'scrim3d') v = 'scrim'; // pre-orbit builds had two scrim modes
    if (VIEW.MODES.includes(v)) VIEW.mode = v;
  } catch (e) {}
}
function setView(mode) {
  if (mode === 'scrim3d') mode = 'scrim';
  if (!VIEW.MODES.includes(mode)) return;
  if (mode === 'scrim' && typeof THREE === 'undefined') {
    console.warn('the scrim view needs three.js'); mode = 'flat';
  }
  VIEW.mode = mode;
  try { localStorage.setItem('srcView', mode); } catch (e) {}
  const sel = document.getElementById('viewSel');
  if (sel && sel.value !== mode) sel.value = mode;
  const ov = document.getElementById('overlay');
  if (ov) ov.classList.toggle('scrimmode', mode === 'scrim'); // shows the vantage chips
  // the scrim view is full bleed, the frame views are letterboxed — refit
  if (typeof focus !== 'undefined' && focus.P) syncStage();
}
// the scrim view is the ROOM, not the frame: it always fills the stage full
// bleed (aspect belongs to the 3D camera there), while the SCENE keeps
// rendering offscreen in the pinned show frame that feeds the virtual throw
function scrimBleed() { return typeof VIEW !== 'undefined' && VIEW.mode === 'scrim' && typeof THREE !== 'undefined'; }
function stageMetrics() {
  const stage = focusCanvas.parentElement;
  const cw = stage.clientWidth, ch = stage.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const dw = Math.floor(cw * dpr) || 1280, dh = Math.floor(ch * dpr) || 720;
  if (PROJ.on) {
    let bw = cw, bh = Math.round(cw * PROJ.h / PROJ.w);
    if (bh > ch) { bh = ch; bw = Math.round(ch * PROJ.w / PROJ.h); }
    return { cssW: bw, cssH: bh, left: Math.round((cw - bw) / 2), top: Math.round((ch - bh) / 2),
             pw: PROJ.w, ph: PROJ.h, dw, dh };
  }
  return { cssW: cw, cssH: ch, left: 0, top: 0, pw: dw, ph: dh, dw, dh };
}
function applyStageBox(m) {
  // letterbox color comes from CSS: --letterbox (white in the light theme so
  // the frame boundary is visible; black in dark). Fullscreen forces black —
  // on the projector the bars must be invisible.
  const s = focusCanvas.style;
  if (PROJ.on && !scrimBleed()) {
    s.inset = 'auto'; s.left = m.left + 'px'; s.top = m.top + 'px';
    s.width = m.cssW + 'px'; s.height = m.cssH + 'px';
  } else {
    s.inset = '0'; s.left = ''; s.top = ''; s.width = '100%'; s.height = '100%';
  }
}
// re-measure the stage and hand the piece the frame it should have. CSS is
// always refit; the backing store (and the piece's init) only when it changed.
function syncStage(force) {
  const m = stageMetrics();
  applyStageBox(m);
  // the DISPLAY canvas: full-bleed in the scrim view, the scene frame otherwise
  const dw = scrimBleed() ? m.dw : m.pw, dh = scrimBleed() ? m.dh : m.ph;
  if (focusCanvas.width !== dw || focusCanvas.height !== dh) {
    focusCanvas.width = dw; focusCanvas.height = dh;
  }
  if (!focus.P || m.pw <= 0 || m.ph <= 0) return;
  if (m.pw === focus.P.w && m.ph === focus.P.h) return;
  if (!force) {
    // resizing the backing store means reinit (scenes cache geometry), and
    // reinit reads as the scene RESTARTING. Small viewport shifts — the
    // mobile URL bar collapsing on scroll, the console reflowing — are not
    // worth that jump: let CSS stretch a few percent and keep playing.
    // A real change (rotation, big window resize) still re-inits.
    const ar = (m.pw / m.ph) / (focus.P.w / focus.P.h);
    const area = (m.pw * m.ph) / (focus.P.w * focus.P.h);
    // mobile bars + console reflow can move the stage ~30%; rotation flips
    // the aspect ~3-4x and still lands outside this window
    if (ar > 0.68 && ar < 1.47 && area > 0.45 && area < 2.2) return;
  }
  focus.P.w = focus.P.canvas.width = m.pw;
  focus.P.h = focus.P.canvas.height = m.ph;
  focus.P.reinit(focus.P.seed); // scenes cache geometry in init()
}
function setProj(on) { PROJ.on = !!on; syncStage(true); }
// the console/bar can reflow after the overlay opens (wrapping hint text), which
// used to leave the canvas sized to a stage that no longer existed
if (window.ResizeObserver) new ResizeObserver(() => { if (focus.P) syncStage(); })
  .observe(focusCanvas.parentElement);

function openFocus(i, fromRelay) {
  AE.ensure();
  // deep-link entry: the autoplay policy holds the context suspended until a
  // real gesture — say so instead of sitting silent (wakeAudio clears it)
  if (AE.on && AE.ctx && AE.ctx.state === 'suspended') {
    const hint = document.getElementById('useHint');
    if (hint) {
      hint.textContent = 'touch anywhere or press any key to wake the sound';
      hint.dataset.sound = '1';
      hint.style.display = 'block';
      hint.classList.remove('gone');
    }
  }
  const def = PIECES[i];
  // Bidirectional scene relay (tickets #29/#34, extended now). control:
  // mirror locally (below, unchanged) AND tell the show window to open the
  // same scene for real — optimistic/no-confirm per ADR-0003 — but only
  // for a GENUINE local action (fromRelay false), never re-relaying a scene
  // control was just told about (would ping-pong control->show->control).
  // show: always relay outward, regardless of trigger — an auto-advance or
  // edge-click firing locally in the show window (see resetRotation's new
  // gate below) needs the control window's mirror to catch up too, which
  // is the same problem this solves either way.
  if (window.electronAPI) {
    if (window.ELECTRON_ROLE === 'control' && showLive && !fromRelay) window.electronAPI.openScene(def.id);
    else if (window.ELECTRON_ROLE === 'show') window.electronAPI.syncSceneToControl(def.id);
  }
  if (typeof T !== 'undefined') {
    T.start((def.music && def.music.bpm) || 78);
    H.setup(def.music, (Math.random() * 1e9) | 0);
  }
  focus.idx = i;
  overlay.classList.add('open'); // measure the stage only once it is laid out
  const m = stageMetrics();
  applyStageBox(m);
  const w2 = m.pw, h2 = m.ph;
  // pieces render to an offscreen scene; post-FX composites onto the visible canvas
  // ADR-0007: the control window does NOT build a scene instance any more.
  // Its picture is a live video feed of the show window (#showFeed), so
  // re-running the scene here would be a second, divergent performance paid
  // for on the machine driving the projectors. focus.idx is still set, so
  // every bit of scene-IDENTITY UI below (title, tags, versions, history,
  // act chips) keeps working; focus.P stays null, which the render loop and
  // syncStage already guard on.
  if (!(window.ELECTRON_ROLE === 'control' && showLive)) {
    const scene = document.createElement('canvas');
    focusCanvas.width = w2; focusCanvas.height = h2;
    focus.fctx = focusCanvas.getContext('2d');
    focus.P = makeInstance(def, scene, w2, h2);
    focus.P.focused = true;
  }
  document.getElementById('oTid').textContent = def.id;
  document.getElementById('oTitle').textContent = def.title;
  document.getElementById('oTag').textContent = def.tech;
  document.getElementById('ipDesc').textContent = def.desc;
  document.getElementById('ipInt').textContent = def.interact;
  document.getElementById('ipSound').textContent = def.sound;
  const chipbox = document.getElementById('ipChips');
  chipbox.innerHTML = def.tags.map(x => `<span class="chip">${x}</span>`).join('');
  if (typeof FAV !== 'undefined') FAV.refresh();
  if (typeof renderFocusVersions === 'function') renderFocusVersions(i);
  if (typeof renderFocusHistory === 'function') renderFocusHistory(i);
  if (typeof renderFocusActs === 'function') renderFocusActs(i);
  // scene atmosphere: the bed HUMS THE SCENE'S ROOT, an octave down,
  // clamped to the hum band. The old 20+SRC formula climbed to shrill
  // keys on the pitched Nebula sampler (Lumen's bed was B-flat 3 —
  // Lance: "a little shrill"). Low, musical, spaceship register.
  if (typeof MOut !== 'undefined') {
    const fm = (def.family || def.id).match(/(\d+)/);
    const br = (def.music && def.music.root) ? def.music.root : (fm ? 20 + +fm[1] : 45);
    MOut.bedOn(Math.max(24, Math.min(43, br - 12)));
  }
  startVoice();
  // the bars settle a frame later; take the frame that actually survives
  requestAnimationFrame(() => { if (focus.P) syncStage(); });
  // Review pass, SHOW-BREAKING: resetRotation() bails whenever
  // focus.idx < 0, and used to be called from the relay block up above —
  // SEVEN LINES before "focus.idx = i" ran. On a fresh PLAY the show
  // window starts on the library wall (focus.idx === -1), so the dwell
  // timer was never armed and SHOWTIME sat on its first scene forever; if
  // a scene WAS already open, the timer armed with the PREVIOUS scene's
  // MIN instead of this one's. Arm it here, at the very end, once
  // focus.idx actually points at the scene that just opened.
  if (window.ELECTRON_ROLE === 'show' && window.SHOW) SHOW.resetRotation();
}
function startVoice() {
  if (focus.voice) { focus.voice.stop(); focus.voice = null; }
  // ADR-0007: no scene audio in the control window. This was the last big
  // unconditional cost there — the mirror's DSP ran at full rate whatever
  // the render throttle said. The audio the operator needs to know about is
  // the wall's, and that arrives over telemetry:tick.
  if (window.ELECTRON_ROLE === 'control' && showLive) return;
  const def = PIECES[focus.idx];
  if (AE.on && AE.ctx && def.audio && focus.P) {
    try { focus.voice = def.audio(AE, focus.P) || null; } catch (e) { focus.voice = null; }
  }
}
function closeFocus() {
  // NOTE: closeFocus is a PRIMITIVE, not "end the show". Every scene change
  // is closeFocus() then openFocus() — goToFamily, step(), play() all do it —
  // so nothing here may tear a show down. Ending a show is endShow(), below.
  if (focus.voice) { try { focus.voice.stop(); } catch (e) {} focus.voice = null; }
  if (typeof MOut !== 'undefined') { MOut.bedOff(); MOut.allOff(); }
  if (typeof T !== 'undefined') { T.stop(); H.listeners = []; }
  focus.P = null; focus.idx = -1;
  overlay.classList.remove('open');
}
/* Nima: "when I click another item in the queue during a show it switches to
   it but I lose the list and the whole top becomes the visual."
   Because CLOSE-the-show was bolted onto closeFocus(), and closeFocus() is
   the first half of every scene CHANGE. Clicking a row in the running order
   therefore ended the show: showLive dropped, the console vanished and the
   stage went full-bleed — and worse, the show window was stowed and then
   revealed a moment later, which on macOS is a fullscreen Space transition on
   the projector for every single scene switch.
   Ending a show is a deliberate act with exactly two triggers — the CLOSE
   button and Escape — so it lives here, not in the primitive. */
function endShow() {
  const wasLive = window.ELECTRON_ROLE === 'control' && showLive;
  if (wasLive && window.electronAPI && focus.idx >= 0) window.electronAPI.closeScene();  // stow the wall
  closeFocus();                       // the wrapped one: URL sync + OUT restore
  if (wasLive) setShowLive(false);    // after the close, so it can't rebuild a local instance
}
window.addEventListener('resize', () => { if (focus.P) syncStage(); });
// P toggles the projector frame live — see the same scene in a window and in the show
window.addEventListener('keydown', e => {
  if (e.key !== 'p' && e.key !== 'P') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (focus.idx < 0) return;
  // Show window: P un-pins the 1920×1200 show frame — the exact thing the
  // whole PROJ default exists to guarantee. Same reasoning as V above: this
  // window is the wall, and it holds keyboard focus after PLAY.
  if (window.ELECTRON_ROLE === 'show') return;
  setProj(!PROJ.on);
});

/* ============================================================
   INPUT — pointer halves, touch, sliders, keys
   ============================================================ */
const activePtrs = new Map();
function hideHint() { document.getElementById('useHint').classList.add('gone'); }
focusCanvas.addEventListener('pointerdown', e => {
  try { focusCanvas.setPointerCapture(e.pointerId); } catch (err) {}
  activePtrs.set(e.pointerId, true);
  ptrDrive(e); hideHint();
});
focusCanvas.addEventListener('pointermove', e => { if (activePtrs.has(e.pointerId)) ptrDrive(e); });
focusCanvas.addEventListener('pointerup', e => activePtrs.delete(e.pointerId));
focusCanvas.addEventListener('pointercancel', e => activePtrs.delete(e.pointerId));
function ptrDrive(e) {
  // in the scrim view the pointer belongs to the CAMERA (orbit lives in part2d)
  if (typeof VIEW !== 'undefined' && VIEW.mode === 'scrim') return;
  // REVERSED like the room: the source rests at center — reach OUTWARD = more
  const r = focusCanvas.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  if (x < 0.5) setChan('L', 1 - clamp((x - 0.02) / 0.44));
  else setChan('R', 1 - clamp(((1 - x) - 0.02) / 0.44));
}

// laser sliders
for (const side of ['L', 'R']) {
  const el = document.getElementById('sl' + side);
  let dragging = false;
  const drive = e => {
    const r = el.getBoundingClientRect();
    setChan(side, 1 - clamp((e.clientY - r.top) / r.height));
    hideHint();
  };
  el.addEventListener('pointerdown', e => { dragging = true; el.setPointerCapture(e.pointerId); drive(e); });
  el.addEventListener('pointermove', e => { if (dragging) drive(e); });
  el.addEventListener('pointerup', () => dragging = false);
  el.addEventListener('pointercancel', () => dragging = false);
}

// keyboard
const keys = {};
window.addEventListener('keydown', e => {
  // Escape still dismisses the help modal in the show window; what it must
  // NOT do there is closeFocus() — that drops the projectors to the library
  // wall from a keystroke aimed at a window the operator only has focus on
  // because setFullScreen() raised it. CLOSE lives in the control window.
  if (e.key === 'Escape') {
    if (document.getElementById('helpModal').classList.contains('open')) document.getElementById('helpModal').classList.remove('open');
    else if (window.ELECTRON_ROLE !== 'show') endShow();
  }
  if (!focus.P) return;
  const k = e.key.toLowerCase();
  if (['w', 's', 'arrowup', 'arrowdown'].includes(k)) { keys[k] = true; hideHint(); e.preventDefault(); }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function applyKeys(dt) {
  if (!focus.P) return;
  const rate = dt * 0.9;
  if (keys['w']) setChan('L', chan.L.target + rate);
  if (keys['s']) setChan('L', chan.L.target - rate);
  if (keys['arrowup']) setChan('R', chan.R.target + rate);
  if (keys['arrowdown']) setChan('R', chan.R.target - rate);
}

/* ============================================================
   UI WIRING
   ============================================================ */
// late-bound: part5_tail wraps closeFocus for deep-link cleanup — a direct
// reference here would skip the wrapper and leave #scene= stuck in the URL
document.getElementById('btnClose').addEventListener('click', () => endShow());
// the experience summary un-clamps in place at the top of the sidebar
document.getElementById('sNotesTog').addEventListener('click', e => {
  const on = document.getElementById('sceneNotes').classList.toggle('open');
  e.target.textContent = on ? 'less' : 'more';
});
// the section notes fold under the group they describe (input / music)
document.querySelectorAll('.sntog').forEach(tog => tog.addEventListener('click', () => {
  const body = document.getElementById(tog.dataset.for);
  if (!body) return;
  const on = body.classList.toggle('open');
  tog.textContent = (on ? '▾' : '▸') + tog.textContent.slice(1);
}));
// R reseeds the open scene — the only part of REGEN worth a control
window.addEventListener('keydown', e => {
  if (e.key !== 'r' && e.key !== 'R') return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  // Reseeding is not destructive the way V/P/Escape are, but it must have
  // exactly ONE driver or the mirror and the show end up on different
  // seeds — showing the operator a picture the wall isn't making. Control
  // reseeds locally AND relays the same seed; the show window takes it from
  // there rather than rolling its own.
  if (window.ELECTRON_ROLE === 'show') return;
  const seed = (Math.random() * 1e9) | 0;
  if (focus.P) focus.P.reinit(seed);
  if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('reseed', seed);
});
document.getElementById('btnSound').addEventListener('click', e => {
  AE.on = !AE.on;
  e.target.textContent = AE.on ? 'SOUND: ON' : 'SOUND: OFF';
  e.target.classList.toggle('off', !AE.on);
  if (AE.on) { AE.ensure(); startVoice(); }
  else if (focus.voice) { try { focus.voice.stop(); } catch (err) {} focus.voice = null; }
  // Review pass: the control window's own AE is silent by design
  // (the muted sink in AE.ensure) — flipping AE.on here never actually mutes
  // or unmutes the wall. The show window is the only thing that can; relay
  // the intent there via the show:control channel.
  if (window.ELECTRON_ROLE === 'control' && window.electronAPI)
    window.electronAPI.sendShowControl('sound', AE.on);
});
document.getElementById('btnMidi').addEventListener('click', connectMidi);
document.getElementById('btnLearnL').addEventListener('click', () => startLearn('L'));
document.getElementById('btnLearnR').addEventListener('click', () => startLearn('R'));
document.getElementById('midiInSel').addEventListener('change', e => {
  midi.inputId = e.target.value;
  // control window: this local value only ever drove filtering in the show
  // window's own MIDI parsing (ADR-0006) — relay the pick there instead of
  // leaving it inert.
  if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.setMidiInput(e.target.value);
});
document.getElementById('btnRest').addEventListener('click', startRest);
// stale NEAR=MORE toggle state from the brief toggle era must never pin a
// browser to the old grammar again — the flip is unconditional now
try { localStorage.removeItem('srcNearMore'); } catch (e) {}
document.getElementById('btnInvL').addEventListener('click', () => setInvert('L'));
document.getElementById('btnInvR').addEventListener('click', () => setInvert('R'));
document.getElementById('btnCalClear').addEventListener('click', clearCal);
/* The calibration readout — raw in, mapped out, and whether the page believes
   a hand is there. This is the panel you stare at when the wall "feels wrong"
   on playa, so it shows the whole chain rather than a verdict. */
setInterval(() => {
  const el = document.getElementById('calRead');
  if (!el || !document.getElementById('mapPop').classList.contains('open')) return;
  const pad = (x, n) => String(x).padEnd(n);
  const num = x => (x === null || x === undefined) ? '—' : x.toFixed(2);
  const rows = [pad('', 7) + pad('raw', 6) + pad('out', 6) + pad('range', 13) + pad('rest', 6) + 'hand'];
  for (const side of ['L', 'R']) {
    const c = chan[side], cal = midi.cal[side];
    rows.push(
      pad(side + ' hand', 7) +
      pad(num(c.raw), 6) +
      pad(num(c.v), 6) +
      pad(cal ? num(cal.lo) + '–' + num(cal.hi) + (cal.inv ? ' INV' : '') : 'unlearned', 13) +
      pad(cal ? num(cal.rest) : '—', 6) +
      (c.mode === 'live' ? 'PLAYING' : 'idle'));
  }
  const txt = rows.join('\n');
  if (el.textContent !== txt) el.textContent = txt;
}, 200);
document.getElementById('btnHelp').addEventListener('click', () => document.getElementById('helpModal').classList.add('open'));
document.getElementById('btnHelpClose').addEventListener('click', () => document.getElementById('helpModal').classList.remove('open'));
document.getElementById('helpModal').addEventListener('click', e => { if (e.target.id === 'helpModal') e.target.classList.remove('open'); });
// ANY gesture must be able to wake audio, not just the first click: a
// deep-link entry (#scene=...) builds the scene into a context the autoplay
// policy holds suspended, and a keyboard-only player never fires
// pointerdown — so resume on either kind of gesture (ensure() resumes a
// suspended ctx), and rebuild the scene voice if it was created before the
// context could run.
const wakeAudio = () => {
  AE.ensure();
  if (AE.on && AE.ctx && focus.idx >= 0 && !focus.voice) startVoice();
  if (AE.ctx && AE.ctx.state === 'running') {
    const hint = document.getElementById('useHint');
    if (hint && hint.dataset.sound) { hint.classList.add('gone'); delete hint.dataset.sound; }
  }
};
window.addEventListener('pointerdown', wakeAudio);
window.addEventListener('keydown', wakeAudio);

/* ============================================================
   SLIDER + LABEL REFRESH
   ============================================================ */
function refreshSliders() {
  for (const side of ['L', 'R']) {
    const el = document.getElementById('sl' + side);
    if (!el) continue;
    const v = chan[side].v;
    el.querySelector('.fill').style.height = (v * 100) + '%';
    el.querySelector('.knob').style.bottom = (v * 100) + '%';
    document.getElementById('cc' + side).textContent = Math.round(v * 127);
    const m = document.getElementById('mode' + side);
    const live = chan[side].mode === 'live';
    m.textContent = live ? 'LIVE' : 'DRIFT';
    m.classList.toggle('live', live);
  }
}
