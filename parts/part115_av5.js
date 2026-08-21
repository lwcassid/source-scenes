/* ---------- SRC-09.5 · ATTRACTOR VESPERS V5 (the light is the sound) ---------- */
reg({
  id: 'SRC-09.5', family: 'SRC-09', ver: 5, title: 'Attractor Vespers V5', tech: 'CLIFFORD MAP / FLAME DENSITY',
  music: {
    bpm: 56, root: 43, mode: 'aeolian', chordBars: 4, prog: [0, 1, 2, 3],
    chords: [
      [0, 7, 14, 15, 19],   // Gm(add9)  — open fifth, ninth
      [0, 7, 15, 22, 26],   // Gm9       — color, still consonant
      [0, 15, 17, 20, 22],  // Cm11/G    — subdominant lean over the pedal
      [0, 8, 15, 19, 22]    // E♭maj9/G  — the softest place in the key
    ],
    chordNames: ['Gm(add9)', 'Gm9', 'Cm11/G', 'E♭maj9/G']
  }, fx: { bloom: 0.5 },
  tags: ['STRANGE ATTRACTOR', 'FLAME DENSITY', 'LIGHT = SOUND', 'ONE SYNTH'],
  desc: 'Four constants and a spark, rendered as flame — and in V5 the sound and the light are finally the same thing. No note events at all: one contorting synth whose intensity is measured off the rendered picture every frame. When the caustics burn, the sound burns — saws bare their teeth and the filters open; when the smoke thins to embers, it recedes to a breathing hum. A single singing voice rides the light\'s center of mass across the chord, bending as the apparition swims.',
  interact: 'L bends constant a, R bends constant b — the figure obeys instantly, and reach outward = more: at the sphere the map rests as condensed embers, full stretch on both sides is the torn smoke at its most chaotic. The sound is the light: brightness measured from the picture drives loudness, filter opening and the saw layer\'s teeth; the sharpness of the caustics rings the air\'s resonance; and one voice slides along the chord following where the light\'s mass sits — push the figure left and it walks down the ladder, lift it and it climbs an octave. Fast hands bend the whole hum down and it crawls back. Every millimeter answers; nothing waits for a grid.',
  sound: 'ONE SYNTH, played by the picture. The rendered frame is measured every tick — total luminous energy, caustic sharpness, and the centroid of the light — and those three numbers are the instrument. BRIGHTNESS = INTENSITY: the bed (five triangle voices on a G pedal, extensions earned as the figure fills), the sub and a sawtooth teeth-layer all swell and open their filters as the picture brightens, and fall back to a talkable hum as it dims. SHARPNESS = RESONANCE: collapsed filaments and hard caustics raise the cathedral air\'s Q until it sings. THE BEAM: one voice glides continuously along the chord ladder wherever the light\'s mass sits — left/right picks the tone and the pan, height picks the octave — a theremin inside the theremin. Chord color still drifts Gm(add9) → Gm9 → Cm11 → E♭maj9 every four bars, marked by a quiet roll; fast hands doppler the whole hum. No sequenced notes anywhere. Ableton: pad ch2 CC74 = the LIGHT itself, beam held on lead ch1, sub on texture ch6.',
  init(P) {
    // CURATED SEED (as V3/V4): rich where the hands reach; rest may collapse.
    let c = 0.95, d = 0.8, bestScore = -1;
    for (let tr = 0; tr < 8; tr++) {
      const cc = 0.7 + P.rand() * 0.5, dd = 0.55 + P.rand() * 0.5;
      let score = 0, pass = true;
      for (const [a, b, floor] of [[-1.9, 2.0, 45], [-1.475, 1.575, 28], [-1.9, 1.15, 20], [-1.05, 2.0, 20]]) {
        let x = 0.1, y = 0.1;
        const seen = new Set();
        for (let i = 0; i < 480; i++) {
          const nx = Math.sin(a * y) + cc * Math.cos(a * x);
          const ny = Math.sin(b * x) + dd * Math.cos(b * y);
          x = nx; y = ny;
          if (i > 220) seen.add((((x + 3) * 4) | 0) * 32 + (((y + 3) * 4) | 0));
        }
        if (seen.size < floor) pass = false;
        score += Math.min(seen.size, floor * 2);
      }
      if (score > bestScore) { bestScore = score; c = cc; d = dd; }
      if (pass) break;
    }
    P.state = {
      x: 0.1, y: 0.1, c, d,
      spreadX: 1, spreadY: 1,
      pres: 0, occ: 0, vel: 0, pL: 0, pR: 0, tilt: 0, drive: 0,
      // the picture, measured — what the synth actually plays
      bright: 0, conc: 0, cenX: 0.5, cenY: 0.5,
      den: null, img: null, dcv: null, dg: null, dw: 0, dh: 0, bandOf: null,
      lut: null, tcurve: null, lutPeak: -1, lutMix: -1, peak: 60, dt: 0.016
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // REACH OUTWARD = MORE: sphere = rest (embers), full stretch = torn smoke
    s.a = -1.05 - inp.L * 0.85;
    s.b = 1.15 + inp.R * 0.85;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 3 : 0.4));
    s.vel = s.vel * Math.max(0, 1 - dt * 2.2) + (Math.abs(inp.L - s.pL) + Math.abs(inp.R - s.pR)) * 6;
    s.pL = inp.L; s.pR = inp.R;
    s.tilt = inp.L - inp.R;
    s.dt = dt;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    /* ---- FLAME-DENSITY RENDER (see V3/V4) ------------------------------
       V5 also MEASURES the picture while rendering it: total luminous
       energy, caustic sharpness and the centroid of the light. Those
       numbers are handed straight to the synth — the sound is the light. */
    const bw = Math.max(8, w >> 1), bh = Math.max(8, h >> 1);
    if (s.dw !== bw || s.dh !== bh) {
      s.dw = bw; s.dh = bh;
      s.den = new Float32Array(bw * bh);
      s.img = new ImageData(bw, bh);
      const d = s.img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = 255;
      s.dcv = document.createElement('canvas');
      s.dcv.width = bw; s.dcv.height = bh;
      s.dg = s.dcv.getContext('2d');
      s.bandOf = new Uint32Array(bw);
      for (let col = 0; col < bw; col++) s.bandOf[col] = (((col * 9) / bw) | 0) * 4096 * 3;
      s.lutPeak = -1;
    }
    const den = s.den;
    const cx = w / 2, cy = h / 2, scx = w * 0.215, scy = h * 0.265;
    let { x, y } = s;
    let sx = 0, sy = 0;
    const jw = clamp((0.012 - s.occ) / 0.010);
    const pulse = (typeof T !== 'undefined' && T.running) ? T.beatPulse() : 0.5;
    const halo = jw > 0.05;
    const n = P.focused ? (window.IS_MOBILE ? 7000 : (jw > 0.5 ? 6000 : 16000)) : 3000;
    const rr1 = jw * (3.2 + 1.2 * pulse), rr2 = jw * (9 + 4 * pulse);
    for (let i = 0; i < n; i++) {
      const nx = Math.sin(s.a * y) + s.c * Math.cos(s.a * x);
      const ny = Math.sin(s.b * x) + s.d * Math.cos(s.b * y);
      x = nx; y = ny;
      sx += Math.abs(x); sy += Math.abs(y);
      const bx = (cx + x * scx) >> 1, by = (cy + y * scy) >> 1;
      if (bx >= 0 && bx < bw && by >= 0 && by < bh) {
        den[by * bw + bx] += 1;
        if (halo) {
          // condensed orbits scatter extra hits into soft embers of DUST
          const a1 = P.rand() * TAU, r1 = (P.rand() + P.rand()) * 0.5 * rr1;
          const j1x = bx + Math.round(Math.cos(a1) * r1), j1y = by + Math.round(Math.sin(a1) * r1);
          if (j1x >= 0 && j1x < bw && j1y >= 0 && j1y < bh) den[j1y * bw + j1x] += 0.7;
          const a2 = P.rand() * TAU, r2 = (P.rand() + P.rand()) * 0.5 * rr2;
          const j2x = bx + Math.round(Math.cos(a2) * r2), j2y = by + Math.round(Math.sin(a2) * r2);
          if (j2x >= 0 && j2x < bw && j2y >= 0 && j2y < bh) den[j2y * bw + j2x] += 0.55;
        }
      }
    }
    s.x = x; s.y = y;
    s.spreadX = sx / n; s.spreadY = sy / n;
    /* palette LUT — nine bands, warm left → violet right, lighter V4 ramps.
       tcurve keeps the tone-map curve itself for the brightness measure. */
    if (!s.lut || Math.abs(s.peak - s.lutPeak) > s.lutPeak * 0.1 || Math.abs(s.tilt - s.lutMix) > 0.04) {
      s.lutPeak = s.peak; s.lutMix = s.tilt;
      const lut = s.lut || (s.lut = new Uint8ClampedArray(9 * 4096 * 3));
      const tcv = s.tcurve || (s.tcurve = new Float32Array(4096));
      const VIO = [[3, 2, 6], [40, 26, 120], [140, 80, 210], [230, 150, 235], [252, 246, 255]];
      const WRM = [[3, 2, 6], [90, 32, 52], [235, 110, 95], [255, 190, 90], [255, 250, 232]];
      const inv = 1 / Math.log1p(s.peak);
      for (let i = 0; i < 4096; i++) tcv[i] = Math.pow(clamp(Math.log1p(i / 16) * inv), 0.62);
      for (let band = 0; band < 9; band++) {
        const colFrac = (band + 0.5) / 9;
        const mixW = clamp(0.5 + (0.5 - colFrac) * 1.4 + s.tilt * 0.35);
        for (let i = 0; i < 4096; i++) {
          const tt = tcv[i] * 3.999;
          const k = tt | 0, f = tt - k, k1 = k + 1 > 4 ? 4 : k + 1;
          for (let ch = 0; ch < 3; ch++) {
            const a0 = VIO[k][ch] + (WRM[k][ch] - VIO[k][ch]) * mixW;
            const a1 = VIO[k1][ch] + (WRM[k1][ch] - VIO[k1][ch]) * mixW;
            lut[(band * 4096 + i) * 3 + ch] = a0 + (a1 - a0) * f;
          }
        }
      }
    }
    // one pass: decay + tone-map + occupancy + peak + THE LIGHT MEASURE
    const dec = Math.exp(-(s.dt || 0.016) * 2.4);
    const d8 = s.img.data, lut = s.lut, bandOf = s.bandOf, tcv = s.tcurve;
    let rawMax = 0, lit = 0, col = 0, row = 0;
    let sumT = 0, sumTX = 0, sumTY = 0, hi = 0;
    for (let i = 0, j = 0; i < den.length; i++, j += 4) {
      const v = den[i] * dec;
      den[i] = v;
      if (v > rawMax) rawMax = v;
      if (v > 0.6) lit++;
      const q = v >= 255 ? 4095 : (v * 16) | 0;
      const tn = tcv[q];
      sumT += tn; sumTX += tn * col; sumTY += tn * row;
      if (tn > 0.6) hi++;
      const idx = bandOf[col] + q * 3;
      d8[j] = lut[idx]; d8[j + 1] = lut[idx + 1]; d8[j + 2] = lut[idx + 2];
      col++; if (col === bw) { col = 0; row++; }
    }
    s.peak = Math.max(30, s.peak + (rawMax - s.peak) * 0.08);
    s.occ += (lit / den.length - s.occ) * 0.12;
    // the three numbers the synth plays — tight loop, fast smoothing
    const kf = Math.min(1, (s.dt || 0.016) * 8);
    // compressive curve: a few embers on black still read as light in the
    // room (and must still hum) — only near-true-black reads as silence
    s.bright += (Math.pow(clamp((sumT / den.length) / 0.075), 0.45) - s.bright) * kf;
    s.conc += (clamp(hi / Math.max(1, lit) / 0.08) - s.conc) * kf;
    if (sumT > 1) {
      s.cenX += (sumTX / sumT / bw - s.cenX) * kf;
      s.cenY += (sumTY / sumT / bh - s.cenY) * kf;
    }
    s.dg.putImageData(s.img, 0, 0);
    g.drawImage(s.dcv, 0, 0, w, h);
    g.fillStyle = 'rgba(140,190,110,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('A ' + s.a.toFixed(3) + '  B ' + s.b.toFixed(3) + '  C ' + s.c.toFixed(2) + '  D ' + s.d.toFixed(2), 10, h - 10);
    if (P.focused) {
      g.fillStyle = 'rgba(140,190,110,0.55)';
      g.fillText('FIGURE ' + Math.round(clamp(s.occ / 0.09) * 100) + '   BRIGHT ' + Math.round(s.bright * 100) +
        '   SHARP ' + Math.round(s.conc * 100) + '   DRIVE ' + Math.round(s.drive * 100), 10, h - 24);
    }
  },
  audio(A, P) {
    const v = A.voice();

    /* --- ONE SYNTH, played by the picture --------------------------------
       Every layer here rides the measured LIGHT continuously. Nothing is
       scheduled; nothing waits for a grid. If the picture burns, it burns. */
    const n1 = v.noise(), n2 = v.noise(), n3 = v.noise();
    const f1 = v.filter('bandpass', 800, 6), f2 = v.filter('bandpass', 1400, 6), f3 = v.filter('bandpass', 480, 8);
    const g1 = v.g(0.012), g2 = v.g(0.012), g3 = v.g(0.008);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);
    n3.connect(f3); f3.connect(g3); g3.connect(v.group);

    const sub = v.osc('sine', H.rootFreq(-1));
    const sg = v.g(0.05);
    sub.connect(sg); sg.connect(v.group);

    // the hum's bones: five triangle voices on the pedal
    const pads = A.padVoices(v, 5, { type: 'triangle', gain: 0.0001, cutoff: 320, q: 0.8 });
    // the TEETH: three saws, silent until the light burns them awake
    const teeth = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.0001, cutoff: 200, q: 2.2 });
    const setVoices = (gl) => {
      for (let i = 0; i < 5; i++) pads[i].set(H.chordTone(i, 0), gl);
      for (let i = 0; i < 3; i++) teeth[i].set(H.chordTone(i, 0), gl);
    };
    setVoices(0.05);

    /* --- THE BEAM: one voice riding the light's center of mass ----------- */
    const bv = A.voice();
    bv._noHold = true;                       // mirrored by hand on ch1 below
    const bo1 = bv.osc('sawtooth', 220), bo2 = bv.osc('triangle', 220.6);
    const bf = bv.filter('lowpass', 900, 2.6);
    const bg = bv.g(0.0001);
    bo1.connect(bf); bo2.connect(bf); bf.connect(bg);
    let bp = null;
    if (AE.ctx.createStereoPanner) { bp = AE.ctx.createStereoPanner(); bg.connect(bp); bp.connect(bv.group); }
    else bg.connect(bv.group);
    if (AE.revIn) { const sR = AE.ctx.createGain(); sR.gain.value = 0.6; bg.connect(sR); sR.connect(AE.revIn); }
    const beamH = {};                        // MIDI hold handle, lead ch1
    bv.fadeIn(1, 1.2);

    let fig = 0;
    H.onChord(() => {
      setVoices(0.18);
      // a quiet low-to-high roll marks the turn — the only pitched events left
      [2, 3, 4].forEach((ci, i) => {
        A.bell(H.chordTone(ci, 1), { at: A.t() + i * 0.09, vol: 0.011 + fig * 0.012, pan: (i - 1) * 0.4, rev: 0.7 });
      });
    });
    v.fadeIn(1, 1.6);

    let swoop = 0;
    return {
      tick(inp, dt) {
        const s = P.state;
        dt = Math.min(0.1, dt || 0.016);
        fig = clamp(s.occ / 0.09);
        const br = s.bright, conc = s.conc;
        s.drive = s.pres * (0.25 + 0.75 * fig);

        // REACTIVE — a fast hand bends the whole synth down and it crawls back
        swoop = Math.max(swoop * Math.pow(0.12, dt), Math.min(1, s.vel * 0.35));
        pads.forEach((p, i) => {
          A.set(p.o1.detune, -4 - i * 1.8 - 170 * swoop - s.drive * 6, 0.06);
          A.set(p.o2.detune, 5 + i * 2.4 - 170 * swoop + s.drive * 6, 0.06);
        });
        teeth.forEach((p, i) => {
          A.set(p.o1.detune, -6 - i * 2 - 170 * swoop - conc * 10, 0.06);
          A.set(p.o2.detune, 7 + i * 2.6 - 170 * swoop + conc * 10, 0.06);
        });

        /* BRIGHTNESS = INTENSITY. The bed swells and opens with the light;
           the teeth only exist where the picture actually burns. */
        const lvl = 0.55 + 0.45 * s.pres;
        const glow = 0.45 + 0.9 * br;
        pads[0].level(0.015 * lvl * glow, 0.3);
        pads[1].level(0.013 * lvl * glow * clamp(fig * 4), 0.3);
        pads[2].level(0.012 * lvl * glow * clamp((fig - 0.15) / 0.3), 0.4);
        pads[3].level(0.011 * lvl * glow * clamp((fig - 0.3) / 0.3), 0.4);
        pads[4].level(0.011 * lvl * glow * clamp((fig - 0.45) / 0.3), 0.4);
        pads.forEach(p => p.bright(240 + br * 780 + (s.spreadX + s.spreadY) * 140, 0.25));
        const bite = Math.pow(br, 1.4) * clamp((br - 0.12) / 0.5);
        teeth.forEach((p, i) => {
          p.level(0.012 * lvl * bite * (1 - i * 0.18), 0.3);
          p.bright(170 + br * 1500 + conc * 400, 0.25);
        });
        A.set(sg.gain, 0.032 + br * 0.05, 0.4);

        /* SHARPNESS = RESONANCE. Hard caustics and filaments ring the air. */
        A.set(f1.frequency, 300 + s.spreadX * 900, 0.2);
        A.set(f2.frequency, 500 + s.spreadY * 1400, 0.2);
        A.set(f3.frequency, 420 + br * 300, 0.3);
        A.set(f1.Q, 6 + conc * 9, 0.4);
        A.set(f2.Q, 6 + conc * 9, 0.4);
        A.set(f3.Q, 8 + conc * 10, 0.4);
        A.set(g1.gain, 0.010 + (1 - fig * 0.5) * 0.012 + br * 0.006, 0.4);
        A.set(g2.gain, 0.010 + (1 - fig * 0.5) * 0.012 + br * 0.006, 0.4);
        A.set(g3.gain, 0.005 + br * 0.007 + conc * 0.005, 0.4);

        /* THE BEAM — glides along the chord wherever the light's mass sits.
           Left/right = tone + pan, height = octave: a theremin inside the
           theremin, and the tightest loop in the scene. */
        const lad = Math.max(0, Math.min(7, Math.round(s.cenX * 7)));
        const bfreq = H.chordTone(lad, s.cenY < 0.42 ? 2 : 1);
        A.set(bo1.frequency, bfreq, 0.10);
        A.set(bo2.frequency, bfreq * 1.004, 0.11);
        A.set(bf.frequency, 320 + br * 2400, 0.15);
        // gated on ANY real figure — the beam is the ember state's voice too
        const bl = s.pres * (0.004 + br * 0.028) * clamp(s.occ / 0.004);
        A.set(bg.gain, bl, 0.2);
        if (bp) A.set(bp.pan, clamp((s.cenX - 0.5) * 1.6, -1, 1), 0.2);
        if (typeof MOut !== 'undefined') {
          if (bl > 0.0035) MOut.holdOn(beamH, 'lead', bfreq, Math.round(34 + br * 66));
          else MOut.holdOff(beamH);
          MOut.expr('pad', br);              // CC74 pad = THE LIGHT itself
          MOut.expr('lead', clamp(bl * 28));
        }
      },
      stop() { if (typeof MOut !== 'undefined') MOut.holdOff(beamH); bv.kill(); v.kill(); }
    };
  }
})
