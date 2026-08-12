/* ============================================================
   MUSIC ENGINE — transport, harmony, effects, voices
   Round 2: everything in key, everything on the grid.
   ============================================================ */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10]
};
const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/* ---------- TRANSPORT ---------- */
const T = {
  bpm: 78, beat: 60 / 78, running: false, t0: 0,
  start(bpm) {
    this.bpm = bpm || 78; this.beat = 60 / this.bpm;
    this.t0 = AE.ctx ? AE.t() + 0.08 : 0; this.running = true;
    setDelayTimes();
  },
  stop() { this.running = false; },
  beats() { return this.running && AE.ctx ? (AE.t() - this.t0) / this.beat : 0; },
  bar() { return Math.floor(this.beats() / 4); },
  phase(lenBeats = 4) { const b = this.beats(); return ((b % lenBeats) + lenBeats) % lenBeats / lenBeats; },
  beatPulse() { const p = this.beats() % 1; return Math.max(0, 1 - p * 4); },
  // audio-context time of the next grid line; sub in beats (0.25 = 16th)
  next(sub = 0.25) {
    if (!this.running || !AE.ctx) return 0;
    const b = this.beats();
    return this.t0 + Math.ceil(b / sub + 1e-4) * sub * this.beat;
  }
};

/* ---------- HARMONY ---------- */
const H = {
  root: 50, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2,
  step: 0, phrase: 0, nextChangeBar: 0, chordSemis: [], listeners: [], hrand: Math.random,
  setup(music, seed) {
    const m = music || {};
    this.root = m.root !== undefined ? m.root : 50;
    this.mode = m.mode || 'aeolian';
    this.prog = m.prog || [0, 5, 3, 4];
    // EXPLICIT CHORDS (opt-in): music.chords = arrays of semitone offsets from
    // root — any voicing, any extension, borrowed chords welcome. Scenes that
    // use them get a PINNED key (no auto-modulation) for jamming with live
    // musicians. music.chordNames labels them for the HUD.
    this.chords = m.chords || null;
    this.chordNames = m.chordNames || null;
    if (this.chords && !m.prog) this.prog = this.chords.map((_, i) => i);
    this.chordBars = m.chordBars || 2;
    this.step = 0; this.phrase = 0; this.nextChangeBar = this.chordBars;
    this.listeners = [];
    this.hrand = mulberry32((seed || 1) ^ 0x9e37);
    this.build();
  },
  degSemi(d) {
    const sc = MODES[this.mode];
    const oct = Math.floor(d / 7);
    return this.root + sc[((d % 7) + 7) % 7] + oct * 12;
  },
  build() {
    const deg = this.prog[this.step];
    if (this.chords) {
      const ci = ((deg % this.chords.length) + this.chords.length) % this.chords.length;
      this.chordSemis = this.chords[ci].map(s => this.root + s);
      this.label = this.chordNames ? this.chordNames[ci]
        : NOTE_NAMES[((this.chordSemis[0] % 12) + 12) % 12];
      this.keyLabel = NOTE_NAMES[((this.root % 12) + 12) % 12] + ' ' + this.mode.toUpperCase();
      return;
    }
    this.chordSemis = [0, 2, 4, 6].map(k => this.degSemi(deg + k));
    this.label = NOTE_NAMES[((this.chordSemis[0] % 12) + 12) % 12] +
      (this.mode === 'lydian' || this.mode === 'ionian' || this.mode === 'mixolydian' ? '' : 'm') + '7';
    this.keyLabel = NOTE_NAMES[((this.root % 12) + 12) % 12] + ' ' + this.mode.toUpperCase();
  },
  update() {
    if (!T.running) return;
    if (T.bar() >= this.nextChangeBar) {
      this.nextChangeBar += this.chordBars;
      this.step = (this.step + 1) % this.prog.length;
      if (this.step === 0) {
        this.phrase++;
        if (this.phrase % 2 === 0) this.modulate();
      }
      this.build();
      for (const cb of this.listeners) { try { cb(); } catch (e) {} }
    }
  },
  modulate() {
    if (this.chords) return; // explicit-chord scenes stay pinned — live players are in a key
    const r = this.hrand();
    if (r < 0.4) this.root += 5;        // up a fourth
    else if (r < 0.7) this.root -= 2;   // down a step
    else if (r < 0.85) this.root += 7;  // up a fifth
    // else stay
    while (this.root > 55) this.root -= 12;
    while (this.root < 44) this.root += 12;
  },
  onChord(cb) { this.listeners.push(cb); },
  // ladder of chord tones stacked across octaves; i can be any integer
  chordTone(i, octShift = 0) {
    const n = this.chordSemis.length;
    const oct = Math.floor(i / n);
    return mtof(this.chordSemis[((i % n) + n) % n] + (oct + octShift) * 12);
  },
  scaleTone(d, octShift = 0) { return mtof(this.degSemi(d) + octShift * 12); },
  rootFreq(octShift = 0) { return mtof(this.root + octShift * 12); },
  nearestScale(freq) {
    let best = freq, bd = 1e9;
    for (let d = -14; d < 22; d++) {
      const f = this.scaleTone(d);
      const dd = Math.abs(Math.log2(f / freq));
      if (dd < bd) { bd = dd; best = f; }
    }
    return best;
  }
};
// legacy shim: old penta() calls now land in the current key/mode
function pentaShim(n, base = 220) {
  const octShift = Math.round(Math.log2(base / 220));
  return H.scaleTone(n, octShift);
}
// eslint-disable-next-line no-func-assign
penta = pentaShim;

/* ---------- EXTENDED FX GRAPH ---------- */
const _origEnsure = AE.ensure.bind(AE);
AE.ensure = function () {
  _origEnsure();
  if (this.ctx && !this._fx) buildFxGraph();
};
let _delayNodes = null;
function makeIR(seconds, decayPow) {
  const c = AE.ctx, len = (c.sampleRate * seconds) | 0;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const n = (Math.random() * 2 - 1) * Math.pow(1 - t, decayPow);
      lp += (n - lp) * 0.28; // darken tail
      d[i] = lp * 3;
    }
  }
  return buf;
}
function buildFxGraph() {
  const c = AE.ctx;
  AE._fx = true;
  // reverb bus
  AE.revIn = c.createGain(); AE.revIn.gain.value = 1;
  const conv = c.createConvolver(); conv.buffer = makeIR(3.4, 2.6);
  const revOut = c.createGain(); revOut.gain.value = 1.15;
  AE.revIn.connect(conv); conv.connect(revOut); revOut.connect(AE.master);
  // tempo ping-pong delay bus
  AE.delIn = c.createGain();
  const dl = c.createDelay(3), dr = c.createDelay(3);
  const fb = c.createGain(); fb.gain.value = 0.38;
  const dOut = c.createGain(); dOut.gain.value = 0.8;
  const pL = c.createStereoPanner ? c.createStereoPanner() : c.createGain();
  const pR = c.createStereoPanner ? c.createStereoPanner() : c.createGain();
  if (pL.pan) { pL.pan.value = -0.6; pR.pan.value = 0.6; }
  AE.delIn.connect(dl);
  dl.connect(pL); pL.connect(dOut);
  dl.connect(dr); dr.connect(pR); pR.connect(dOut);
  dr.connect(fb); fb.connect(dl);
  dOut.connect(AE.master);
  const dRev = c.createGain(); dRev.gain.value = 0.25;
  dOut.connect(dRev); dRev.connect(AE.revIn);
  _delayNodes = { dl, dr };
  setDelayTimes();
}
function setDelayTimes() {
  if (!_delayNodes || !AE.ctx) return;
  _delayNodes.dl.delayTime.value = T.beat * 0.75;  // dotted eighth
  _delayNodes.dr.delayTime.value = T.beat * 0.5;
}

/* ---------- VOICES (scheduled, with sends) ---------- */
function _sends(g, rev, del) {
  if (rev > 0 && AE.revIn) { const s = AE.ctx.createGain(); s.gain.value = rev; g.connect(s); s.connect(AE.revIn); }
  if (del > 0 && AE.delIn) { const s = AE.ctx.createGain(); s.gain.value = del; g.connect(s); s.connect(AE.delIn); }
}
AE.tone = function (freq, { at = 0, vol = 0.15, dur = 0.8, attack = 0.006, type = 'sine', pan = 0, rev = 0.25, del = 0, detune = 0 } = {}) {
  if (!this.ctx || !isFinite(freq) || freq <= 20) return;
  const t0 = Math.max(this.t(), at || 0);
  const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + dur);
  o.connect(g);
  this.pan(g, pan).connect(this.master);
  _sends(g, rev, del);
  o.start(t0); o.stop(t0 + attack + dur + 0.1);
};
AE.bell = function (freq, { at = 0, vol = 0.12, dur = 2.2, pan = 0, rev = 0.5, del = 0.12 } = {}) {
  const P = [[1, 1, 1], [2.0, 0.42, 0.6], [3.01, 0.2, 0.36], [4.16, 0.09, 0.22], [5.43, 0.045, 0.13]];
  for (const [r, v, d] of P) {
    this.tone(freq * r, { at, vol: vol * v, dur: dur * d, type: 'sine', pan, rev, del: del * (r === 1 ? 1 : 0) });
  }
};
AE.pluck2 = function (freq, { at = 0, vol = 0.16, dur = 1.1, pan = 0, rev = 0.3, del = 0.15 } = {}) {
  if (!this.ctx || !isFinite(freq) || freq <= 20) return;
  const t0 = Math.max(this.t(), at || 0);
  const o1 = this.ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
  const o2 = this.ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = freq; o2.detune.value = 7;
  const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 1;
  f.frequency.setValueAtTime(freq * 6, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 120), t0 + dur * 0.5);
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o1.connect(f); o2.connect(f); f.connect(g);
  this.pan(g, pan).connect(this.master);
  _sends(g, rev, del);
  o1.start(t0); o2.start(t0); o1.stop(t0 + dur + 0.1); o2.stop(t0 + dur + 0.1);
};
AE.bassNote = function (freq, { at = 0, vol = 0.2, dur = 1.6, rev = 0.06 } = {}) {
  if (!this.ctx) return;
  const t0 = Math.max(this.t(), at || 0);
  this.tone(freq, { at: t0, vol, dur, type: 'sine', rev: 0 });
  const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq;
  const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq * 3.2; f.Q.value = 0.7;
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol * 0.4, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.7);
  o.connect(f); f.connect(g); g.connect(this.master);
  _sends(g, rev, 0);
  o.start(t0); o.stop(t0 + dur);
};
AE.kick = function (at = 0, vol = 0.32) {
  if (!this.ctx) return;
  const t0 = Math.max(this.t(), at || 0);
  const o = this.ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(130, t0);
  o.frequency.exponentialRampToValueAtTime(38, t0 + 0.11);
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
  o.connect(g); g.connect(this.master);
  o.start(t0); o.stop(t0 + 0.3);
};
AE.hat = function (at = 0, { vol = 0.045, open = false } = {}) {
  if (!this.ctx) return;
  const t0 = Math.max(this.t(), at || 0);
  const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf();
  const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
  const g = this.ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + (open ? 0.22 : 0.04));
  s.connect(f); f.connect(g); g.connect(this.master);
  s.start(t0); s.stop(t0 + 0.3);
};
// persistent glide voices for voice-led pads; built on an AE.voice() group v
AE.padVoices = function (v, n, { type = 'sawtooth', gain = 0.045, cutoff = 900, q = 0.7 } = {}) {
  const voices = [];
  for (let i = 0; i < n; i++) {
    const o1 = v.osc(type, 220), o2 = v.osc(type, 220);
    o2.detune.value = 5 + i * 2.4; o1.detune.value = -4 - i * 1.8;
    const f = v.filter('lowpass', cutoff, q);
    const g = v.g(gain);
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(v.group);
    if (AE.revIn) { const s = AE.ctx.createGain(); s.gain.value = 0.55; g.connect(s); s.connect(AE.revIn); }
    voices.push({
      o1, o2, f, g, freq: 220,
      set(freq, glide = 0.5) {
        if (!isFinite(freq) || freq <= 20) return;
        this.freq = freq;
        AE.set(o1.frequency, freq, glide * 0.33);
        AE.set(o2.frequency, freq, glide * 0.36);
      },
      level(x, s = 0.2) { AE.set(g.gain, x, s); },
      bright(hz, s = 0.25) { AE.set(f.frequency, hz, s); }
    });
  }
  return voices;
};
// move an array of pad voices to the nearest tones of the current chord (voice leading)
AE.leadToChord = function (voices, octShift = 0, glide = 0.7) {
  const targets = [];
  for (let i = -4; i < 12; i++) targets.push(H.chordTone(i, octShift));
  const used = new Set();
  for (const vc of voices) {
    let best = -1, bd = 1e9;
    targets.forEach((f, idx) => {
      if (used.has(idx)) return;
      const d = Math.abs(Math.log2(f / vc.freq));
      if (d < bd) { bd = d; best = idx; }
    });
    if (best >= 0) { used.add(best); vc.set(targets[best], glide); }
  }
};
// quantize helper: audio time of next 16th (or given subdivision)
AE.q = sub => T.next(sub === undefined ? 0.25 : sub);

/* ---------- BLOOM / EDGE POST-FX ---------- */
let _bloomCv = null, _bloomCtx = null;
// composite src + blurred src onto target ctx — non-destructive, no feedback
function bloomTo(g, src, w, h, amt) {
  const bw = Math.max(2, w >> 2), bh = Math.max(2, h >> 2);
  if (!_bloomCv || _bloomCv.width !== bw || _bloomCv.height !== bh) {
    _bloomCv = document.createElement('canvas');
    _bloomCv.width = bw; _bloomCv.height = bh;
    _bloomCtx = _bloomCv.getContext('2d');
  }
  _bloomCtx.save();
  _bloomCtx.clearRect(0, 0, bw, bh);
  _bloomCtx.filter = 'blur(5px)';
  _bloomCtx.drawImage(src, 0, 0, bw, bh);
  _bloomCtx.restore();
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = amt;
  g.drawImage(_bloomCv, 0, 0, w, h);
  g.restore();
}
function edgeFadeCtx(g, w, h, px) {
  const e = px || Math.min(w, h) * 0.06;
  for (const [x0, y0, x1, y1, gx0, gy0, gx1, gy1] of [
    [0, 0, w, e, 0, 0, 0, e], [0, h - e, w, e, 0, h, 0, h - e],
    [0, 0, e, h, 0, 0, e, 0], [w - e, 0, e, h, w, 0, w - e, 0]
  ]) {
    const gr = g.createLinearGradient(gx0, gy0, gx1, gy1);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x0, y0, x1, y1);
  }
}
// area scale factor: 1 at tile size, ~2.4 fullscreen — pieces use to scale counts/sizes
function areaScale(P) { return Math.sqrt((P.w * P.h) / (420 * 264)); }
