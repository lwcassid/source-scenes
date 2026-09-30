/* ---------- SRC-66.11 · ISOTRP A · LIGHT ECLIPSE, THE BEND  +  SRC-66.12 · ACT 1 WITH THE BEND (Sep 30, 2026) ----------
   Edson, Sep 29 20:32, in the jam: "the sound of the left is great, but I
   would like to do something different with the right hand. Its almost like
   I want it to be a distortion of the left. Like a guitar player that plays
   a note, and then holds the chords moving them up and down to distort the
   sounds he is doing." And 00:49: "put this 3 things in knobs of the
   twister so I can test it. Default is 1 up, 2 whole, 3 subtle."

   THE RIGHT HAND IS THE LEFT HAND'S STRING. Everything the left hand
   sounds (the pad chord and the rung bells) runs through one bus that the
   right hand bends, shakes and drives:
     R HEIGHT   = the BEND. Every oscillator's detune follows it, including
                  bells ALREADY RINGING (they are built here, not with
                  A.bell, which is fire-and-forget), so a struck note bends
                  while it sounds, like a string pushed after the pick.
     R MOVEMENT = the VIBRATO. A 5.5 Hz wobble whose depth is how fast the
                  right hand is moving: shake the hand, shake the string.
                  A still hand is a clean held bend.
     R HEIGHT   = the DRIVE too: a waveshaper blended in by (knob) × R.
   THE SOURCE LAW holds: right hand at the instrument = the pure left
   sound, no bend, clean. And THE LAST POSITION HOLDS: a bend you leave
   stays until the right hand comes home.

   THE THREE KNOBS (Twister macro knobs 13 · 14 · 15):
     13 BEND DIR    0 = UP ONLY (default, a real string bend; the right hand
                    at the source is the note, arm's length is the top of
                    the bend)  ·  past half = UP AND DOWN (a whammy bar:
                    the middle of the reach is the note, in is flat, out
                    is sharp)
     14 BEND RANGE  0 → 12 semitones; default a WHOLE STEP (2)
     15 DRIVE       0 = clean → 1 = fuzz; default SUBTLE (0.2)

   The picture is SRC-66.9's, untouched (this spreads it). V4's sound is
   kept voice for voice (pad, sub, rung ladder, form bells, the silence
   when both hands are home); only the right hand's job changes. The sub
   stays clean and unbent: it is the floor, not the string.            */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-66.9');
  if (!prev) return;

  const MACROS = [
    { k: 'bdir',   label: 'BEND DIR', def: 0 },          // 0 up only · >0.5 up and down
    { k: 'brange', label: 'BEND RANGE', def: 2 / 12 },   // × 12 semitones: a whole step
    { k: 'drive',  label: 'DRIVE', def: 0.2 }            // subtle
  ];
  const DEF = {}; MACROS.forEach(d => { DEF[d.k] = d.def; });
  const knob = (P, k) => (P.macro && P.macro[k] !== undefined) ? P.macro[k] : DEF[k];
  const BELL = [[1, 1, 1], [2.0, 0.42, 0.6], [3.01, 0.2, 0.36], [4.16, 0.09, 0.22], [5.43, 0.045, 0.13]];  // A.bell's partials

  function shaperCurve() {
    const n = 2048, c = new Float32Array(n), k = 3, norm = Math.tanh(k);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / norm; }
    return c;
  }

  reg(Object.assign({}, prev, {
    id: 'SRC-66.11', family: 'SRC-66', ver: 11,
    title: 'ISOTRP A · Light Eclipse, The Bend',
    tech: 'GLSL LIGHT FIELDS / FULL LIGHT / R BENDS, SHAKES AND DRIVES THE LEFT',
    tags: (prev.tags || []).concat(['THE BEND']),
    macros: MACROS,
    interact: 'THE SOURCE LAW, AT FULL LIGHT. L WALKS THE SHAPE and PLAYS: the pad and a bell for every step of the hand. R IS THE STRING: its height BENDS everything the left is sounding, even a bell already ringing; its movement is VIBRATO (shake the hand, shake the string); and it drives the sound dirty. R at the instrument is the clean note. The bend holds where you leave it. Knobs: 13 BEND DIR (up only · past half up and down), 14 BEND RANGE (to an octave; a whole step by default), 15 DRIVE (subtle by default). R still sizes the picture.',
    sound: 'V4\'s sound, voice for voice: the sub on F1, three triangle pad voices voice-led through the chords, the rung bells under L and the brighter form bells. New: the pad and the bells run through the right hand\'s string, a shared detune (the bend), a 5.5 Hz vibrato whose depth is the right hand\'s speed, and a tanh waveshaper blended in by DRIVE × R. The sub stays clean. Both hands at the Source is silence.',

    audio(A, P) {
      const c = A.ctx;
      const vs = A.voice();                 // owns the oscillators (so kill stops them); its group is unused
      const out = A.voice();                // the layer's output: the mixer moves THIS group onto the fader bus
      const inBus = c.createGain();         // everything the left hand sounds lands here, before the string

      // ---- THE STRING: bend (a constant) + vibrato (an LFO) summed into every detune ----
      const bend = c.createConstantSource(); bend.offset.value = 0; bend.start();
      const lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5.5; lfo.start();
      const vib = c.createGain(); vib.gain.value = 0; lfo.connect(vib);
      const string = o => { bend.connect(o.detune); vib.connect(o.detune); };

      // ---- THE DRIVE: dry + (pre → tanh → tone → trim), crossfaded ----
      const dry = c.createGain(), pre = c.createGain(), sh = c.createWaveShaper(), tone = c.createBiquadFilter(), wet = c.createGain();
      sh.curve = shaperCurve(); sh.oversample = '4x';
      tone.type = 'lowpass'; tone.frequency.value = 5200; tone.Q.value = 0.5;
      inBus.connect(dry); dry.connect(out.group);
      inBus.connect(pre); pre.connect(sh); sh.connect(tone); tone.connect(wet); wet.connect(out.group);
      wet.gain.value = 0;

      // ---- V4's voices, on the string ----
      const pv = { osc: vs.osc, filter: vs.filter, g: vs.g, group: inBus };
      const pad = A.padVoices(pv, 3, { type: 'triangle', gain: 0.01, cutoff: 600, q: 0.8, midi: false });
      pad.forEach((p, i) => { string(p.o1); string(p.o2); p.set(262 * (1 + i * 0.25), 0.01); });
      const place = gl => A.leadToChord(pad, 0, gl); place(0.05);
      const sub = vs.osc('sine', 44), sg = vs.g(0.01); sub.connect(sg); sg.connect(out.group);   // clean floor
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -1), gl); tune(0.05);
      H.onChord(() => { place(0.9); tune(0.9); });
      out.fadeIn(1, 1.5);

      // a bell built here so the string reaches it while it rings (A.bell's partials and envelope)
      const bell = (freq, { vol = 0.12, dur = 2.2, pan = 0, rev = 0.5, del = 0.12 } = {}) => {
        if (!isFinite(freq) || freq <= 20) return;
        const t0 = A.t();
        for (const [r, v, d] of BELL) {
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq * r; string(o);
          const g = c.createGain(), len = dur * d;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.linearRampToValueAtTime(vol * v, t0 + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.006 + len);
          o.connect(g);
          let node = g;
          if (c.createStereoPanner) { const pn = c.createStereoPanner(); pn.pan.value = pan; g.connect(pn); node = pn; }
          node.connect(inBus);
          if (rev > 0 && A.revIn) { const s = c.createGain(); s.gain.value = rev; g.connect(s); s.connect(A.revIn); }
          if (r === 1 && del > 0 && A.delIn) { const s = c.createGain(); s.gain.value = del; g.connect(s); s.connect(A.delIn); }
          o.start(t0); o.stop(t0 + len + 0.1);
          o.onended = () => { try { bend.disconnect(o.detune); vib.disconnect(o.detune); } catch (e) {} };
        }
      };

      const aStage = L => Math.min(3, Math.floor(L * 3 + 0.5));
      let lastStage = null, lastRung = null, lastT = null, lastR = null, motR = 0;
      return {
        tick() {
          const s = P.state, gate = 0.35 + s.pres * 0.65;
          const armed = s.pres > 0.95 && chan.L.mode === 'live';
          const L = clamp(s.aL), R = clamp(s.aR), M = s.motion;
          const zo = clamp((Math.max(L, R) - 0.02) / 0.13), open = zo * zo * (3 - 2 * zo);
          if (lastRung === null) { if (!s.seeded) return; lastRung = s.rungN; lastStage = aStage(L); }

          // ---- the right hand as the string ----
          const now = A.t(), dt = lastT === null ? 0 : Math.max(1e-3, now - lastT);
          if (lastT !== null) {
            const vel = Math.abs(R - lastR) / dt;                        // hand-space per second
            motR = Math.max(clamp(vel / 1.2), motR * Math.exp(-dt / 0.25));
          }
          lastT = now; lastR = R;
          const semis = 12 * clamp(knob(P, 'brange'));
          const updown = knob(P, 'bdir') >= 0.5;
          const cents = (updown ? (2 * R - 1) : R) * semis * 100;
          A.set(bend.offset, cents, 0.015);                              // the bend follows in ~15 ms
          A.set(vib.gain, motR * 55, 0.03);                              // up to ±55 cents while shaking
          const d = clamp(knob(P, 'drive')) * R;                         // DRIVE × R: clean at the source
          const g = 1 + 150 * Math.pow(d, 1.5), mix = Math.min(1, d * 2.5);
          A.set(pre.gain, g, 0.02);
          A.set(wet.gain, mix / (3 * g) * 1.6, 0.02);                    // tanh(3x) slope 3 → level-matched, a touch hot
          A.set(dry.gain, 1 - 0.75 * mix, 0.02);
          s.string = { cents: Math.round(cents), vib: Math.round(motR * 55), drive: +d.toFixed(2) };   // for the HUD and tests

          // ---- V4's tone, unchanged except R no longer owns the filter alone ----
          const kk = s.kick * (0.35 + 0.65 * R);
          const bow = 0.75 + 0.8 * M;
          pad.forEach(p => {
            p.level((0.0022 + 0.0068 * L) * gate * open * bow * (1 + 0.5 * kk), 0.02);
            p.bright(Math.max(2.5 * p.freq, 500 + 3200 * Math.pow(R, 1.3)) + 1500 * M + 1200 * kk, 0.02);
          });
          A.set(sg.gain, (0.004 + 0.006 * L) * gate * open, 0.02);
          if (s.rungN !== lastRung) {
            if (armed && open > 0.01) bell(s.rungHz, { vol: (0.008 + 0.010 * R) * gate * open, dur: 2.2, rev: 0.6, pan: (L - 0.5) * 0.6 });
            lastRung = s.rungN;
          }
          if (aStage(L) !== lastStage) {
            if (armed && open > 0.01) bell(s.rungHz * 2, { vol: 0.02 * gate * open, dur: 3, rev: 0.7 });
            lastStage = aStage(L);
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', L); MOut.expr('bass', L); MOut.expr('bells', R); }
        },
        stop() {
          vs.kill(); out.kill();
          setTimeout(() => { [bend, lfo].forEach(n => { try { n.stop(); } catch (e) {} });
                             [inBus, dry, pre, sh, tone, wet, vib].forEach(n => { try { n.disconnect(); } catch (e) {} }); }, 1200);
        }
      };
    }
  }));

  /* ---------- SRC-66.12 · ACT 1 with the bend: 66.10 with its opener swapped and the three knobs ---------- */
  if (!window.MIX || !MIX.make) return;
  const act = PIECES.find(p => p.id === 'SRC-66.10');
  if (!act) return;
  MIX.make({
    id: 'SRC-66.12', part: 'I',
    title: act.title, tech: act.tech, music: act.music, desc: act.desc, sound: act.sound,
    interact: (act.interact || '') + ' THE BEND (layer 1): the right hand bends, shakes and drives what the left plays. Knob 13 BEND DIR (up only · past half up and down), 14 BEND RANGE (whole step by default), 15 DRIVE (subtle by default).',
    layers: ['SRC-66.11', 'SRC-59.3', 'SRC-80.4'],
    cost: { 'SRC-66.11': 3, 'SRC-59.3': 1, 'SRC-80.4': 3 },
    shots: [{ id: 'SRC-77', label: 'LAUNCH' }],
    macros: MACROS
  });
  const d = PIECES.find(p => p.id === 'SRC-66.12'); if (!d) return;
  d.family = 'SRC-66'; d.ver = 12; d.fx = {};
  d.tags = ['BIRTH OF A TEMPLE', 'ACT 1', 'FULL LIGHT', 'THE BEND'].concat((d.tags || []).filter(t => t !== 'TEMPLE SET'));
})();
