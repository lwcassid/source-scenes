/* ---------- SRC-57.2 · ECLIPSE — it reads the palette ----------
   Sep 27, 2026 (PLAN-PALETTE). SRC-57 hard-coded its reds; this version
   reads them, so Act I can play it in copper.
   · THE BODY is band g1: the centre is its highlight, the rim its dark end
     (u = 1 → 0.3 → 0, the three stops 57 had). The body's grain is the
     highlight, lifted toward white.
   · THE CROWN is c2 (the warm crown held tight) walking to c3 (the lift-off
     as it is thrown wide) — 57's fire → ice, as two generators.
   · THE BLADE is c2 lifted, going white as the crown opens.
   Standalone it declares 57's own colours as its palette, so the library
   card does not change. Everything else is SRC-57. */
/* ---------- SRC-57 · ECLIPSE (the occultation) ----------
   A vermilion body on black, and around it a corona of two thousand drypoint
   strokes — light that got around the thing blocking it.

   THE ALGORITHM IS THE IDEA. The corona's outline is a Fourier sum on the
   circle: five standing modes, L(θ) = Σ a_k·cos(kθ + φ_k), the same modes a
   ring or a dome actually rings in. The phases drift at incommensurate rates
   so the weave never repeats. And the five amplitudes are ALSO the five held
   voices in the sound — mode 2 louder means a wider lobe AND a louder second
   voice. The drawn thing plays the notes; nothing is measured in secret.

   An eclipse is an occultation: a body deciding what passes. OW1 asks who
   can be accepted and who shall be denied. The disc is that decision, and
   the corona is everything that got through anyway. */
(() => {
  const MODES = 5;
  const HAS = typeof PAL !== 'undefined';
  const mixc = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const lift = (c, f) => mixc(c, [255, 255, 255], f);
  const rgb = c => (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0);
  // SRC-57's body, as a band: rim (u 0) → the 0.72 stop (u 0.3) → centre (u 1)
  const BODY = u => u < 0.3 ? mixc([176, 40, 26], [233, 62, 34], u / 0.3) : mixc([233, 62, 34], [255, 96, 58], (u - 0.3) / 0.7);
  reg({
    id: 'SRC-57.2', family: 'SRC-57', ver: 2, title: 'BoT · Eclipse', tech: 'FOURIER CORONA / FIVE RINGING MODES / READS THE PALETTE',
    palette: HAS ? {
      c: ['#d4af37', '#947733', '#eb764e', '#8cbeff', '#4f4f4f'],
      g: [PAL.PRESETS.GOLD1, PAL.ramp(BODY), PAL.PRESETS.SILVER1],
      hl: [null, 0, null],
      names: { c2: 'THE CROWN', c3: 'THE LIFT-OFF', g1: 'THE BODY: RIM → CENTRE' }
    } : undefined,
    textIsContent: true,
    music: {
      bpm: 56, root: 38, mode: 'dorian', chordBars: 4,
      chords: [
        [0, 7, 14, 21, 26],    // Dm9(add13) open
        [0, 5, 12, 19, 24],    // Gsus2/D
        [0, 7, 12, 16, 23],    // Dm(maj7)
        [0, 9, 14, 17, 21]     // B♭maj7/D
      ],
      chordNames: ['Dm9', 'Gsus2/D', 'Dm(maj7)', 'B♭maj7/D']
    },
    fx: { bloom: 0.45 },
    tags: ['TEMPLE SET', 'PALETTE: g1 BODY · c2 CROWN · c3 LIFT-OFF', 'OPEN L = THE BODY', 'OPEN R = THE CORONA', 'FIVE MODES, SEEN AND HEARD'],
    desc: 'A red body hangs in the middle of black, and around it a woven crown of two thousand fine strokes — the light that got past it. Hold both hands at the Source and it is a small coal with the crown lying flat against it. Open the left hand and the body swells until it has eaten most of the frame, pushing the crown out into a thin brilliant ring. Open the right and the crown itself reaches: further, wilder, lifting off into blue. The crown is not a circle — it rings in five standing modes, like a struck bell seen edge-on, and those same five modes are the five voices you hear. A wide lobe is a loud voice. You are looking at the chord.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE BODY — a coal at the instrument, an enormous disc with a blade of light around its rim at full reach. R OPENS THE CORONA — reach and unrest. Closed, the crown lies flat and even and red. Open, the five modes separate, the lobes swing out past the frame, and the weave runs to ice. Nothing here is symmetrical for long: the modes drift against each other and never land on the same shape twice.',
    sound: 'D dorian, four bars a chord. FIVE HELD VOICES, one per corona mode, each tuned to a rung of the ladder and each voice\'s level IS that mode\'s amplitude on screen — this is the scene\'s whole integration: what you see bulging is what you hear swelling. The body is a sub and a low filtered pad; growing it opens the filter and pushes the voices apart in detune. The corona hand raises the whole choir and its brightness. A soft strike on the bell channel each chord change, and a single low gong when the body crosses three-quarters — the only event in the scene. No drums.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const N = Math.min(2600, Math.round(760 * areaScale(P)));
      const jit = new Float32Array(N), len = new Float32Array(N), br = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        jit[i] = (P.rand() - 0.5) * 0.030;
        len[i] = 0.30 + Math.pow(P.rand(), 1.7) * 1.35;
        br[i] = 0.30 + Math.pow(P.rand(), 1.4) * 0.70;
      }
      const amp = new Float32Array(MODES), ph = new Float32Array(MODES), rate = new Float32Array(MODES);
      for (let k = 0; k < MODES; k++) { ph[k] = P.rand() * TAU; rate[k] = 0.031 * (1 + k * 0.618) * (P.rand() * 0.4 + 0.8); }
      P.state = { cx: w / 2, cy: h / 2, S, N, jit, len, br, amp, ph, rate, pres: 0, body: 0, cor: 0, drift: P.rand() * 60, gong: 0, events: [] };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleB = 0.20 + Math.sin(s.drift * 0.043) * 0.09;
      const idleC = 0.24 + Math.sin(s.drift * 0.067 + 2.1) * 0.09;
      const wantB = SOURCE(inp.L) * s.pres + idleB * (1 - s.pres);
      const wantC = SOURCE(inp.R) * s.pres + idleC * (1 - s.pres);
      s.body += (wantB - s.body) * Math.min(1, dt * 6);
      s.cor += (wantC - s.cor) * Math.min(1, dt * 6.5);
      // the modes: drift in phase, amplitude opened by the corona hand
      for (let k = 0; k < MODES; k++) {
        s.ph[k] += dt * s.rate[k] * TAU * (0.5 + s.cor * 1.6);
        const shape = Math.pow(s.cor, 0.7) * (k === 0 ? 0.30 : 1);
        s.amp[k] = shape * (0.22 + 0.78 * (0.5 + 0.5 * Math.sin(s.ph[k] * 0.37 + k)));
      }
      // one event in the whole scene: the body crossing three-quarters
      if (s.body > 0.75 && s.gong <= 0) { s.events.push({ kind: 'gong' }); s.gong = 6; }
      if (s.body < 0.66) s.gong = 0; else s.gong -= dt;
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      // HOSTED BY THE MIXER: the ground is painted once, by the mixer, and a
      // layer that repaints it erases every layer under it. Standalone this
      // is unchanged.
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const S = s.S;
      const R = S * (0.085 + s.body * 0.325);
      const bright = (0.5 + s.pres * 0.5) * room;
      const reach = S * (0.045 + s.cor * 0.30);

      g.globalCompositeOperation = 'lighter';
      // THE PALETTE: read once a frame, a handful of values
      const bHi = HAS ? PAL.along(P, 1, 1, BODY) : BODY(1), bMid = HAS ? PAL.along(P, 1, 0.3, BODY) : BODY(0.3), bLo = HAS ? PAL.along(P, 1, 0, BODY) : BODY(0);
      const cWarm = (HAS && PAL.c(P, 2)) || [235, 118, 78], cIce = (HAS && PAL.c(P, 3)) || [140, 190, 255];

      // ---- THE BODY: g1, its own faint internal weave
      const bg = g.createRadialGradient(s.cx, s.cy, R * 0.15, s.cx, s.cy, R);
      bg.addColorStop(0, `rgba(${rgb(bHi)},${0.90 * bright})`);
      bg.addColorStop(0.72, `rgba(${rgb(bMid)},${0.86 * bright})`);
      bg.addColorStop(1, `rgba(${rgb(bLo)},${0.70 * bright})`);
      g.fillStyle = bg; g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();
      // the body's own grain: concentric, not scanlines — a ruled horizontal
      // set reads as a broadcast artifact, and on scrim it reads as damage
      g.strokeStyle = `rgba(${rgb(lift(bHi, 0.45))},${0.022 * bright})`; g.lineWidth = 1 * ms;
      g.beginPath();
      for (let i = 1; i <= 9; i++) g.arc(s.cx, s.cy, R * (i / 9.4), 0, TAU);
      g.stroke();

      // ---- THE CORONA: one path per brightness bucket, five buckets for 2600 strokes
      const BK = 5;
      const paths = []; for (let b = 0; b < BK; b++) paths.push([]);
      for (let i = 0; i < s.N; i++) {
        const a = (i / s.N) * TAU;
        let env = 1;
        for (let k = 0; k < MODES; k++) env += s.amp[k] * Math.cos((k + 1) * a + s.ph[k]);
        env = Math.max(0.05, env * 0.52);
        const th = a + s.jit[i];
        const c = Math.cos(th), sn = Math.sin(th);
        const r0 = R * (0.995 + s.jit[i] * 0.5);
        const L = reach * s.len[i] * env;
        const b = Math.min(BK - 1, (s.br[i] * BK) | 0);
        paths[b].push(s.cx + c * r0, s.cy + sn * r0, s.cx + c * (r0 + L), s.cy + sn * (r0 + L));
      }
      g.lineCap = 'butt';
      for (let b = 0; b < BK; b++) {
        const arr = paths[b]; if (!arr.length) continue;
        const f = (b + 1) / BK;
        // hue comes from the FORM: near the body it is still red, far out it is ice
        // hue from the FORM: still the body's fire when the crown is tight,
        // true ice when it is thrown wide
        const cc = mixc(cWarm, cIce, s.cor * 0.85);     // c2 → c3
        g.strokeStyle = `rgba(${rgb(cc)},${(0.04 + f * 0.20) * (0.45 + s.cor * 0.55) * bright})`;
        g.lineWidth = (0.6 + f * 1.5) * ms;
        g.beginPath();
        for (let j = 0; j < arr.length; j += 4) { g.moveTo(arr[j], arr[j + 1]); g.lineTo(arr[j + 2], arr[j + 3]); }
        g.stroke();
      }

      // the blade: a hard bright rim where body meets corona
      g.strokeStyle = `rgba(${rgb(mixc(lift(cWarm, 0.6), [255, 255, 255], s.cor))},${(0.14 + s.body * 0.34) * bright})`;
      g.lineWidth = (0.9 + s.body * 2.0) * ms;
      g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.stroke();

      // HOSTED: the mixer draws the readout for the whole movement. A layer
      // that also draws its own puts two lines of text on the same pixels.
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {

        g.globalCompositeOperation = 'source-over';

        g.fillStyle = 'rgba(225,225,235,0.8)';

        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;

        g.fillText('BODY ' + Math.round(s.body * 100) + '   CORONA ' + Math.round(s.cor * 100) + (s.pres < 0.3 ? '   · RINGING' : ''), 10, h - 10);

      }

      // HOSTED: the mixer runs the poems once for the whole movement. Left in,
      // this ran the overlay once PER LIVE LAYER — the dark plate stacked and
      // the text was painted over itself three times a frame.
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.0035, cutoff: 180, q: 0.8, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 37), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const modes = [];
      for (let k = 0; k < MODES; k++) {
        const o = v.osc('triangle', 220), o2 = v.osc('sine', 220), f = v.filter('lowpass', 700, 0.8), gg = v.g(0.0001);
        o.connect(f); o2.connect(f); f.connect(gg);
        A.pan(gg, (k / (MODES - 1) - 0.5) * 1.3).connect(v.group);
        if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; gg.connect(sd); sd.connect(A.revIn); }
        modes.push({ o, o2, f, gg });
      }
      const tune = gl => {
        A.set(sub.frequency, H.chordTone(0, -2), gl);
        modes.forEach((m, k) => { const f = H.chordTone(k, k < 2 ? -1 : 0); A.set(m.o.frequency, f, gl); A.set(m.o2.frequency, f, gl); });
      };
      tune(0.05);
      H.onChord(() => {
        place(0.6); tune(0.5);
        A.tone(H.chordTone(2, 1), { vol: 0.010, dur: 4.5, attack: 0.03, type: 'sine', rev: 0.85, role: 'bells' });
      });
      v.fadeIn(1, 2);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t(), gate = 0.3 + s.pres * 0.7;
          const B = s.body, C = s.cor;
          modes.forEach((m, k) => {
            // THE INTEGRATION: the voice's level IS the mode's amplitude on screen
            const lv = (0.0012 + s.amp[k] * 0.0075) * (0.35 + C * 0.9) * gate;
            A.set(m.gg.gain, lv, 0.25);
            A.set(m.f.frequency, 240 + C * 1700 + k * 150 + B * 300, 0.3);
            try { m.o2.detune.setTargetAtTime((k % 2 ? 1 : -1) * (4 + B * 26), now, 0.4); } catch (e) {}
          });
          pad.forEach(p => { p.level((0.0015 + B * 0.004) * gate, 0.4); p.bright(150 + B * 700, 0.4); });
          A.set(sg.gain, (0.014 + B * 0.026) * gate, 0.3);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'gong') A.tone(H.chordTone(0, -1), { vol: 0.03, dur: 8, attack: 0.25, type: 'sine', rev: 1, role: 'perc' });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', B); MOut.expr('texture', C); MOut.expr('bass', B); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
