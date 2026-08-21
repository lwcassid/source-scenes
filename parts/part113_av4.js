/* ---------- SRC-09.4 · ATTRACTOR VESPERS V4 (the hum is the instrument) ---------- */
reg({
  id: 'SRC-09.4', family: 'SRC-09', ver: 4, title: 'Attractor Vespers V4', tech: 'CLIFFORD MAP / FLAME DENSITY',
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
  tags: ['STRANGE ATTRACTOR', 'FLAME DENSITY', 'THE HUM PLAYS', 'RIFF HUNTING'],
  desc: 'Four constants and a spark, rendered as flame: fold density becomes light, so the caustic anatomy burns instead of hiding. V4 turns the mix right side up — the humming IS the instrument now. The bed and the cathedral air swell, brighten and beat continuously with the apparition itself, and the orbit\'s sampled notes surface from inside that hum as soft swells instead of barging over it. Collapsed orbits condense into glowing dust — the smoke\'s own material, brightened — not lanterns.',
  interact: 'L bends constant a, R bends constant b — the figure obeys instantly, and reach outward = more: at the sphere the map rests as condensed embers, full stretch on both sides is the torn smoke at its most chaotic. The hum answers every millimeter continuously — level, brightness and beating all ride the figure — while the orbit is still sampled on the beat for melody: position picks the pitch and pan, a collapsed orbit locks into a riff, a fast flick swells a run. Hunt the periodic windows between rest and full reach.',
  sound: 'One instrument: a hum you play with the shape of the smoke. DRONE, promoted to the lead voice: sub root on a G pedal, five triangle voices (extensions earned as the figure fills), and the bandpassed cathedral air whose formants track the apparition\'s spread — all of it coupled continuously, so the hum swells, opens and beats wider the moment the figure does. Chord color drifts Gm(add9) → Gm9 → Cm11 → E♭maj9 every four bars, marked by a quiet low-to-high roll. QUANTIZED, demoted to texture: the orbit\'s landings become slow-attack swells well under the bed — they surface from the hum, they never bury it; sparse at rest, eighths at most, a locked orbit tolls its riff. REACTIVE: fast hands bend the whole hum down and it crawls back; a flick answers with a soft run. Ableton: arp ch4, pad ch2, bells ch5, sub on texture ch6; CC74 arp = drive, pad = figure.',
  init(P) {
    // CURATED SEED (same as V3): the figure must be rich where the hands
    // actually reach; the rest corner may collapse — that is the design.
    let c = 0.95, d = 0.8, bestScore = -1;
    for (let tr = 0; tr < 8; tr++) {
      const cc = 0.7 + P.rand() * 0.5, dd = 0.55 + P.rand() * 0.5;
      let score = 0, pass = true;
      for (const [a, b, floor] of [[-1.9, 2.0, 45], [-1.475, 1.575, 28], [-1.9, 1.15, 10], [-1.05, 2.0, 10]]) {
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
      mx: 0.31, my: 0.17,              // the musical walker — same map, its own orbit
      spreadX: 1, spreadY: 1,
      pres: 0, occ: 0, vel: 0, pL: 0, pR: 0, tilt: 0, drive: 0,
      den: null, img: null, dcv: null, dg: null, dw: 0, dh: 0, bandOf: null,
      lut: null, lutPeak: -1, lutMix: -1, peak: 60,
      sparks: [], histM: [], lockP: 0, lockN: 0, dt: 0.016
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
    /* ---- FLAME-DENSITY RENDER (see V3) ---------------------------------
       V4 drops the lantern sprites: a collapsing orbit instead deposits its
       hits with a small halo kernel into the density field itself, so
       condensed states read as brightened DUST — the same material as the
       smoke, breathing on the beat — never as a different picture. */
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
    // condensation: how collapsed the figure is (from last frame's occupancy)
    const jw = clamp((0.012 - s.occ) / 0.010);
    const pulse = (typeof T !== 'undefined' && T.running) ? T.beatPulse() : 0.5;
    const halo = jw > 0.05;
    const n = P.focused ? (window.IS_MOBILE ? 7000 : (jw > 0.5 ? 6000 : 16000)) : 3000;
    // ember radius (half-res cells) — breathes with the beat
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
          // around each landing point — the smoke's own material, no sprites
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
    /* palette LUT — nine bands across the frame, warm left → violet right
       (the side law painted into the picture), hands slide the crossover.
       V4: lighter ramps + a stronger low lift for visibility on mesh. */
    if (!s.lut || Math.abs(s.peak - s.lutPeak) > s.lutPeak * 0.1 || Math.abs(s.tilt - s.lutMix) > 0.04) {
      s.lutPeak = s.peak; s.lutMix = s.tilt;
      const lut = s.lut || (s.lut = new Uint8ClampedArray(9 * 4096 * 3));
      // stop 0 is IDENTICAL in both ramps — the background must not band
      const VIO = [[3, 2, 6], [40, 26, 120], [140, 80, 210], [230, 150, 235], [252, 246, 255]];
      const WRM = [[3, 2, 6], [90, 32, 52], [235, 110, 95], [255, 190, 90], [255, 250, 232]];
      const inv = 1 / Math.log1p(s.peak);
      for (let band = 0; band < 9; band++) {
        const colFrac = (band + 0.5) / 9;
        const mixW = clamp(0.5 + (0.5 - colFrac) * 1.4 + s.tilt * 0.35);
        for (let i = 0; i < 4096; i++) {
          const tt = Math.pow(clamp(Math.log1p(i / 16) * inv), 0.62) * 3.999;
          const k = tt | 0, f = tt - k, k1 = k + 1 > 4 ? 4 : k + 1;
          for (let ch = 0; ch < 3; ch++) {
            const a0 = VIO[k][ch] + (WRM[k][ch] - VIO[k][ch]) * mixW;
            const a1 = VIO[k1][ch] + (WRM[k1][ch] - VIO[k1][ch]) * mixW;
            lut[(band * 4096 + i) * 3 + ch] = a0 + (a1 - a0) * f;
          }
        }
      }
    }
    // one pass: decay + tone-map + occupancy + peak
    const dec = Math.exp(-(s.dt || 0.016) * 2.4);
    const d8 = s.img.data, lut = s.lut, bandOf = s.bandOf;
    let rawMax = 0, lit = 0, col = 0;
    for (let i = 0, j = 0; i < den.length; i++, j += 4) {
      const v = den[i] * dec;
      den[i] = v;
      if (v > rawMax) rawMax = v;
      if (v > 0.6) lit++;
      const idx = bandOf[col] + (v >= 255 ? 4095 : (v * 16) | 0) * 3;
      d8[j] = lut[idx]; d8[j + 1] = lut[idx + 1]; d8[j + 2] = lut[idx + 2];
      col++; if (col === bw) col = 0;
    }
    s.peak = Math.max(30, s.peak + (rawMax - s.peak) * 0.08);
    s.occ += (lit / den.length - s.occ) * 0.12;
    s.dg.putImageData(s.img, 0, 0);
    g.drawImage(s.dcv, 0, 0, w, h);
    const k = Math.min(w, h) / 1200;
    // NOTE SPARKS — each swell glows softly at the exact point that played it
    if (s.sparks.length) {
      const now = (typeof AE !== 'undefined' && AE.ctx) ? AE.t() : t;
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        const age = now - sp.at;
        if (age > 1.0) { s.sparks.splice(i, 1); continue; }
        if (age < -0.02) continue;
        const px = cx + sp.fx * scx, py = cy + sp.fy * scy;
        const r = (10 + age * 30) * k * (0.8 + sp.v * 3);
        const al = Math.max(0, 1 - age / 1.0) * (0.16 + sp.v * 2.2);
        const gr = g.createRadialGradient(px, py, 0, px, py, r);
        const col2 = sp.fx < 0 ? '255,200,140' : '200,160,255';
        gr.addColorStop(0, `rgba(${col2},${Math.min(0.6, al)})`);
        gr.addColorStop(1, `rgba(${col2},0)`);
        g.fillStyle = gr;
        g.fillRect(px - r, py - r, r * 2, r * 2);
      }
      g.restore();
    }
    g.fillStyle = 'rgba(140,190,110,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('A ' + s.a.toFixed(3) + '  B ' + s.b.toFixed(3) + '  C ' + s.c.toFixed(2) + '  D ' + s.d.toFixed(2), 10, h - 10);
    if (P.focused) {
      g.fillStyle = 'rgba(140,190,110,0.55)';
      g.fillText('FIGURE ' + Math.round(clamp(s.occ / 0.09) * 100) + '   DRIVE ' + Math.round(s.drive * 100) +
        (s.lockP ? '   RIFF ×' + s.lockP : ''), 10, h - 24);
    }
  },
  audio(A, P) {
    const v = A.voice();

    /* --- THE HUM, promoted to the instrument -----------------------------
       Three bandpassed airs (the cathedral breath), a sub pedal, and five
       triangle voices. Everything here is coupled CONTINUOUSLY to the
       figure: level, brightness, formants and beating all move the moment
       the smoke does — this layer is what a hand plays first. */
    const n1 = v.noise(), n2 = v.noise(), n3 = v.noise();
    const f1 = v.filter('bandpass', 800, 6), f2 = v.filter('bandpass', 1400, 6), f3 = v.filter('bandpass', 480, 8);
    const g1 = v.g(0.014), g2 = v.g(0.014), g3 = v.g(0.008);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);
    n3.connect(f3); f3.connect(g3); g3.connect(v.group);

    const sub = v.osc('sine', H.rootFreq(-1));
    const sg = v.g(0.05);
    sub.connect(sg); sg.connect(v.group);

    const pads = A.padVoices(v, 5, { type: 'triangle', gain: 0.0001, cutoff: 320, q: 0.8 });
    const setPads = (gl) => { for (let i = 0; i < 5; i++) pads[i].set(H.chordTone(i, 0), gl); };
    setPads(0.05);
    let fig = 0;
    H.onChord(() => {
      setPads(0.18);
      // a quiet low-to-high roll marks the turn — under the hum, not over it
      [2, 3, 4].forEach((ci, i) => {
        A.bell(H.chordTone(ci, 1), { at: A.t() + i * 0.09, vol: 0.011 + fig * 0.012, pan: (i - 1) * 0.4, rev: 0.7 });
      });
    });
    v.fadeIn(1, 1.6);

    let nextT = T.next(0.25), burst = 0, coolT = -9, swoop = 0;
    return {
      tick(inp, dt) {
        const s = P.state;
        dt = Math.min(0.1, dt || 0.016);
        const now = A.t();
        fig = clamp(s.occ / 0.09);
        const drive = s.drive = s.pres * (0.25 + 0.75 * fig);

        // REACTIVE — a fast hand bends the whole hum down and it crawls back
        swoop = Math.max(swoop * Math.pow(0.12, dt), Math.min(1, s.vel * 0.35));
        pads.forEach((p, i) => {
          A.set(p.o1.detune, -4 - i * 1.8 - 170 * swoop - drive * 6, 0.06);
          A.set(p.o2.detune, 5 + i * 2.4 - 170 * swoop + drive * 6, 0.06);
        });
        if (s.vel > 1.4 && now - coolT > 0.6) { burst = 4; coolT = now; }

        // THE HUM — louder than V3 by design, extensions earned by the figure,
        // brightness and formants opening as the smoke fills the frame
        const bedAmp = 0.7 + 0.3 * s.pres;
        pads[0].level(0.016 * bedAmp, 0.4);
        pads[1].level(0.014 * bedAmp * clamp(fig * 4), 0.4);
        pads[2].level(0.013 * bedAmp * clamp((fig - 0.15) / 0.3), 0.5);
        pads[3].level(0.012 * bedAmp * clamp((fig - 0.3) / 0.3), 0.5);
        pads[4].level(0.012 * bedAmp * clamp((fig - 0.45) / 0.3), 0.5);
        pads.forEach(p => p.bright(240 + fig * 420 + (s.spreadX + s.spreadY) * 160, 0.4));
        A.set(sg.gain, 0.04 + fig * 0.035, 0.5);
        A.set(f1.frequency, 300 + s.spreadX * 900, 0.2);
        A.set(f2.frequency, 500 + s.spreadY * 1400, 0.2);
        A.set(f3.frequency, 420 + fig * 260, 0.3);
        A.set(g1.gain, 0.012 + (1 - fig * 0.5) * 0.014, 0.4);
        A.set(g2.gain, 0.012 + (1 - fig * 0.5) * 0.014, 0.4);
        A.set(g3.gain, 0.006 + fig * 0.007, 0.4);

        /* QUANTIZED — the orbit still writes the melody, but as SLOW-ATTACK
           SWELLS well under the bed: they surface from inside the hum and
           sink back into it. Eighths at most; a locked orbit tolls its riff. */
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const tt = nextT;
          const stAbs = Math.round((tt - T.t0) / (T.beat * 0.25));
          const st = ((stAbs % 16) + 16) % 16, barAt = Math.floor(stAbs / 16);
          let play = false, vol = 0;
          if (burst > 0) { play = true; burst--; vol = 0.04; }
          else if (drive < 0.08) {
            if (st === 0 && barAt % 2 === 0) { play = true; vol = 0.02; }
          } else if (s.lockP === 1) {
            if (st % 8 === 0) { play = true; vol = 0.028; }
          } else if (drive < 0.4) { if (st % 4 === 0) { play = true; vol = 0.026; } }
          else { if (st % 2 === 0 || st === 14) { play = true; vol = 0.03; } }
          if (play) {
            for (let k = 0; k < 3; k++) {
              const nx = Math.sin(s.a * s.my) + s.c * Math.cos(s.a * s.mx);
              const ny = Math.sin(s.b * s.mx) + s.d * Math.cos(s.b * s.my);
              s.mx = nx; s.my = ny;
            }
            if (!isFinite(s.mx) || !isFinite(s.my)) { s.mx = 0.31; s.my = 0.17; }
            s.histM.push([s.mx, s.my]);
            if (s.histM.length > 13) s.histM.shift();
            let lp = 0;
            for (let p = 1; p <= 6 && !lp; p++) {
              const q = s.histM.length - 1 - p;
              if (q < 0) break;
              const hx = s.histM[q][0] - s.mx, hy = s.histM[q][1] - s.my;
              if (hx * hx + hy * hy < 1.5e-3) lp = p;
            }
            s.lockN = lp ? Math.min(9, s.lockN + 1) : 0;
            s.lockP = s.lockN >= 3 ? lp : 0;
            const lad = Math.max(0, Math.min(7, Math.round(((s.mx / 2.2) + 1) * 3.5)));
            const oct = 1 + (s.my < -0.35 ? 1 : 0);
            let local = 0;
            if (s.den && s.dw) {
              const bx = ((s.dw + s.mx * s.dw * 0.43) / 2) | 0, by = ((s.dh + s.my * s.dh * 0.53) / 2) | 0;
              if (bx >= 0 && bx < s.dw && by >= 0 && by < s.dh) local = clamp(Math.log1p(s.den[by * s.dw + bx]) / Math.log1p(s.peak));
            }
            vol = (vol + local * 0.02) * (st === 0 ? 1.5 : st % 4 === 0 ? 1.2 : 1);
            const dur = drive < 0.4 ? 2.2 : 1.5;
            A.tone(H.chordTone(lad, oct), {
              at: tt, vol, dur, attack: 0.18, type: 'triangle',
              pan: clamp(s.mx / 2.2, -1, 1) * 0.7, rev: 0.6, del: 0.1, role: 'arp'
            });
            s.sparks.push({ fx: s.mx, fy: s.my, at: tt, v: vol });
            if (s.sparks.length > 24) s.sparks.shift();
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('arp', drive);
          MOut.expr('pad', fig);
        }
      },
      stop() { v.kill(); }
    };
  }
})
