/* ---------- SRC-09.3 · ATTRACTOR VESPERS V3 (the orbit is the sequencer) ---------- */
reg({
  id: 'SRC-09.3', family: 'SRC-09', ver: 3, title: 'Attractor Vespers V3', tech: 'CLIFFORD MAP / FLAME DENSITY',
  music: {
    bpm: 56, root: 43, mode: 'aeolian', chordBars: 4, prog: [0, 1, 2, 3],
    // A PEDAL, not a ladder: G never moves, the color over it breathes.
    // One full cycle ≈ 68 seconds — the slow chord change is the point.
    chords: [
      [0, 7, 14, 15, 19],   // Gm(add9)  — open fifth, ninth
      [0, 7, 15, 22, 26],   // Gm9       — color, still consonant
      [0, 15, 17, 20, 22],  // Cm11/G    — subdominant lean over the pedal
      [0, 8, 15, 19, 22]    // E♭maj9/G  — the softest place in the key
    ],
    chordNames: ['Gm(add9)', 'Gm9', 'Cm11/G', 'E♭maj9/G']
  }, fx: { bloom: 0.5 },
  tags: ['STRANGE ATTRACTOR', 'FLAME DENSITY', 'ORBIT ARPEGGIO', 'RIFF HUNTING'],
  desc: 'Four constants and a spark. The same point is thrown a hundred thousand times and lands as smoke — now rendered the way flame fractals are rendered: fold density becomes light, so the caustic anatomy burns instead of hiding. And the point that draws the figure also PLAYS it: the orbit is sampled on the grid and every landing is a note. Where the map goes chaotic the melody never repeats; find a window where the figure collapses to a blazing filament and the melody locks into a riff you discovered.',
  interact: 'L bends constant a, R bends constant b — the figure obeys instantly and totally, and reach outward = more: hands at the sphere the map rests as a still burning jewel, full stretch on both sides is the torn smoke at its most chaotic. The same orbit that draws the smoke is sampled on the beat: its position picks the pitch (left-right = chord tone, height = octave, side = pan), so a broad apparition cascades and never repeats, while a collapsed one plays a locked ostinato — periodic windows in parameter space ARE riffs, and hunting them between rest and full reach is the game. A fast flick fires a run.',
  sound: 'One instrument, three layers, all of it the figure. DRONE: a G pedal that never moves — sub root, quiet triangle bed whose upper extensions only ring as the apparition fills out (thin figure = bare fifth, full smoke = the whole Gm9 stack), chord color drifting Gm(add9) → Gm9 → Cm11 → E♭maj9 every four bars. QUANTIZED: the orbit arpeggio — the map itself is sampled on the grid and each landing is a plucked note in key, velocity from how dense the smoke is where it lands, sparse at rest, cascading when the figure is full and hands are in. Every note flashes a spark at the exact point that played it. REACTIVE: a fast hand bends the bed down and it crawls back, and a flick answers with a run on the next 16th. Ableton: arp ch4, pad ch2, bells ch5 on chord turns, sub on texture ch6; CC74 arp = drive, pad = figure.',
  init(P) {
    // CURATED SEED: try a handful of (c,d) draws and keep one whose figure is
    // rich where the hands actually spend their reach — full stretch and the
    // one-handed edges must be alive (transients skipped, so a slow spiral
    // into a fixed point can't fake richness). The rest corner is ALLOWED to
    // collapse: that jewel is the design. Interior periodic windows survive
    // too — those are the riffs, not the bug.
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
      lut: null, lutPeak: -1, lutMix: -1, peak: 60, tail: new Float32Array(16),
      sparks: [], histM: [], lockP: 0, lockN: 0, dt: 0.016
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // REACH OUTWARD = MORE: at the sphere the map rests near a still point —
    // a quiet jewel — and full reach on both sides is the torn smoke at
    // (-1.9, 2.0). The dead zones now live only at rest, where they are the
    // design, not scattered across the reach.
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
    /* ---- FLAME-DENSITY RENDER ------------------------------------------
       Hits accumulate into a half-res density buffer with temporal decay;
       a log tone-map through a warm↔violet palette turns fold density into
       light. Faint wisps get lifted, dense caustics burn white — and a
       collapsed periodic orbit concentrates every hit into a few cells, so
       the old "dead" states now read as a blazing filament. */
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
      // which of the 9 palette bands each column sits in (byte offset into lut)
      s.bandOf = new Uint32Array(bw);
      for (let col = 0; col < bw; col++) s.bandOf[col] = (((col * 9) / bw) | 0) * 4096 * 3;
      s.lutPeak = -1;
    }
    const den = s.den;
    // fill the 16:10 frame — the figure has no canonical aspect, so stretch it
    const cx = w / 2, cy = h / 2, scx = w * 0.215, scy = h * 0.265;
    let { x, y } = s;
    let sx = 0, sy = 0;
    const n = P.focused ? (window.IS_MOBILE ? 7000 : 16000) : 3000;
    for (let i = 0; i < n; i++) {
      const nx = Math.sin(s.a * y) + s.c * Math.cos(s.a * x);
      const ny = Math.sin(s.b * x) + s.d * Math.cos(s.b * y);
      x = nx; y = ny;
      sx += Math.abs(x); sy += Math.abs(y);
      const bx = (cx + x * scx) >> 1, by = (cy + y * scy) >> 1;
      if (bx >= 0 && bx < bw && by >= 0 && by < bh) den[by * bw + bx] += 1;
      if (i >= n - 8) { const q = (i - (n - 8)) * 2; s.tail[q] = x; s.tail[q + 1] = y; }
    }
    s.x = x; s.y = y;
    s.spreadX = sx / n; s.spreadY = sy / n;
    /* palette LUT — indexed by density ×16, log curve baked in. NINE BANDS
       across the frame: the left country burns warm orange, the right violet
       (the side law painted into the picture itself), blending through
       magenta at the seam; the hands' balance slides the crossover. */
    if (!s.lut || Math.abs(s.peak - s.lutPeak) > s.lutPeak * 0.1 || Math.abs(s.tilt - s.lutMix) > 0.04) {
      s.lutPeak = s.peak; s.lutMix = s.tilt;
      const lut = s.lut || (s.lut = new Uint8ClampedArray(9 * 4096 * 3));
      // both ramps multi-hue (lows lifted by the 0.72 pow — mesh eats faint wisps)
      // stop 0 is IDENTICAL in both ramps — the background must not band
      const VIO = [[3, 2, 6], [26, 14, 90], [110, 50, 170], [220, 120, 190], [250, 240, 255]];
      const WRM = [[3, 2, 6], [70, 20, 40], [210, 80, 80], [255, 170, 60], [255, 248, 225]];
      const inv = 1 / Math.log1p(s.peak);
      for (let band = 0; band < 9; band++) {
        const colFrac = (band + 0.5) / 9;
        const mixW = clamp(0.5 + (0.5 - colFrac) * 1.4 + s.tilt * 0.35);
        for (let i = 0; i < 4096; i++) {
          const tt = Math.pow(clamp(Math.log1p(i / 16) * inv), 0.72) * 3.999;
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
    /* THE JEWELS — a collapsed orbit lands on a handful of points; raw they
       are four-pixel specks, invisible at 41ft. Below a sliver of occupancy
       each landing point becomes a burning orb breathing with the beat: the
       rest state and every periodic window read as vesper lamps, not as a
       dead screen. */
    const jewel = clamp((0.004 - s.occ) / 0.0035);
    if (jewel > 0.05) {
      const pulse = (typeof T !== 'undefined' && T.running) ? T.beatPulse() : 0.5;
      g.save();
      g.globalCompositeOperation = 'lighter';
      const done = [];
      for (let iP = 0; iP < 8; iP++) {
        const fx = s.tail[iP * 2], fy = s.tail[iP * 2 + 1];
        if (!isFinite(fx)) continue;
        let dup = false;
        for (let q = 0; q < done.length; q++) {
          const dx = fx - done[q][0], dy = fy - done[q][1];
          if (dx * dx + dy * dy < 0.004) { dup = true; break; }
        }
        if (dup) continue;
        done.push([fx, fy]);
        const px = cx + fx * scx, py = cy + fy * scy;
        const r = (34 + pulse * 14) * k;
        const col2 = fx < 0 ? '255,190,120' : '190,140,255';
        const gr = g.createRadialGradient(px, py, 0, px, py, r);
        gr.addColorStop(0, `rgba(255,252,244,${0.85 * jewel})`);
        gr.addColorStop(0.25, `rgba(${col2},${0.5 * jewel})`);
        gr.addColorStop(1, `rgba(${col2},0)`);
        g.fillStyle = gr;
        g.fillRect(px - r, py - r, r * 2, r * 2);
      }
      g.restore();
    }
    // NOTE SPARKS — each arp note flashes at the exact point that played it
    if (s.sparks.length) {
      const now = (typeof AE !== 'undefined' && AE.ctx) ? AE.t() : t;
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = s.sparks.length - 1; i >= 0; i--) {
        const sp = s.sparks[i];
        const age = now - sp.at;
        if (age > 0.8) { s.sparks.splice(i, 1); continue; }
        if (age < -0.02) continue;                 // scheduled, not sounding yet
        const px = cx + sp.fx * scx, py = cy + sp.fy * scy;
        const r = (14 + age * 40) * k * (0.8 + sp.v * 4);
        const al = Math.max(0, 1 - age / 0.8) * (0.28 + sp.v * 3);
        const gr = g.createRadialGradient(px, py, 0, px, py, r);
        const col = sp.fx < 0 ? '255,190,120' : '190,140,255';
        gr.addColorStop(0, `rgba(${col},${Math.min(0.9, al)})`);
        gr.addColorStop(1, `rgba(${col},0)`);
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

    /* --- the air: V1's cathedral breath, kept quiet under everything ----- */
    const n1 = v.noise(), n2 = v.noise();
    const f1 = v.filter('bandpass', 800, 6), f2 = v.filter('bandpass', 1400, 6);
    const g1 = v.g(0.010), g2 = v.g(0.010);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);

    /* --- the pedal: sub root, never moves ------------------------------- */
    const sub = v.osc('sine', H.rootFreq(-1));
    const sg = v.g(0.05);
    sub.connect(sg); sg.connect(v.group);

    /* --- the bed: one triangle voice per chord tone; upper extensions only
           ring as the figure fills out ----------------------------------- */
    const pads = A.padVoices(v, 5, { type: 'triangle', gain: 0.0001, cutoff: 300, q: 0.7 });
    const setPads = (gl) => { for (let i = 0; i < 5; i++) pads[i].set(H.chordTone(i, 0), gl); };
    setPads(0.05);
    let fig = 0;
    H.onChord(() => {
      setPads(0.18);                                 // snap, don't smear
      // mark the turn with a gentle low-to-high roll off the new chord's crown
      [2, 3, 4].forEach((ci, i) => {
        A.bell(H.chordTone(ci, 1), { at: A.t() + i * 0.08, vol: 0.016 + fig * 0.018, pan: (i - 1) * 0.4, rev: 0.6 });
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

        // REACTIVE — a fast hand bends the bed down and it crawls back
        swoop = Math.max(swoop * Math.pow(0.12, dt), Math.min(1, s.vel * 0.35));
        pads.forEach((p, i) => {
          A.set(p.o1.detune, -4 - i * 1.8 - 170 * swoop, 0.06);
          A.set(p.o2.detune, 5 + i * 2.4 - 170 * swoop, 0.06);
        });
        // a flick answers with a run on the next 16th
        if (s.vel > 1.4 && now - coolT > 0.6) { burst = 5; coolT = now; }

        // DRONE — extensions are EARNED by how much figure there is
        const bedAmp = 0.55 + 0.45 * s.pres;
        pads[0].level(0.011 * bedAmp, 0.4);
        pads[1].level(0.009 * bedAmp * clamp(fig * 4), 0.4);
        pads[2].level(0.009 * bedAmp * clamp((fig - 0.2) / 0.3), 0.5);
        pads[3].level(0.008 * bedAmp * clamp((fig - 0.35) / 0.3), 0.5);
        pads[4].level(0.008 * bedAmp * clamp((fig - 0.5) / 0.3), 0.5);
        pads.forEach(p => p.bright(220 + fig * 260 + (s.spreadX + s.spreadY) * 120, 0.4));
        A.set(sg.gain, 0.035 + fig * 0.025, 0.5);
        const air = 1 - fig * 0.6;
        A.set(f1.frequency, 300 + s.spreadX * 900, 0.2);
        A.set(f2.frequency, 500 + s.spreadY * 1400, 0.2);
        A.set(g1.gain, 0.006 + air * 0.014, 0.4);
        A.set(g2.gain, 0.006 + air * 0.014, 0.4);

        /* QUANTIZED — THE ORBIT IS THE SEQUENCER. The walker rides the same
           map; on each sounding 16th it advances a fixed stride and the
           landing point IS the note: x picks the chord tone, height the
           octave, side the pan, local smoke density the velocity. Chaotic
           figure = cascades that never repeat; periodic window = a locked
           riff. The music can't help but match the picture — same orbit. */
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const tt = nextT;
          // bar-aligned grid position, so accents land on real downbeats
          const stAbs = Math.round((tt - T.t0) / (T.beat * 0.25));
          const st = ((stAbs % 16) + 16) % 16, barAt = Math.floor(stAbs / 16);
          let play = false, vol = 0;
          if (burst > 0) { play = true; burst--; vol = 0.065; }
          else if (drive < 0.08) {                       // idle tease: one toll every 2 bars
            if (st === 0 && barAt % 2 === 0) { play = true; vol = 0.035; }
          } else if (s.lockP === 1) {                    // fixed point: a slow toll, not a stuck 16th
            if (st % 8 === 0) { play = true; vol = 0.05; }
          } else if (drive < 0.35) { if (st % 4 === 0) { play = true; vol = 0.042; } }
          else if (drive < 0.65) { if (st % 2 === 0) { play = true; vol = 0.048; } }
          else if (st % 4 !== 3) { play = true; vol = 0.05; }   // 16ths with a breath before each beat
          if (play) {
            for (let k = 0; k < 3; k++) {
              const nx = Math.sin(s.a * s.my) + s.c * Math.cos(s.a * s.mx);
              const ny = Math.sin(s.b * s.mx) + s.d * Math.cos(s.b * s.my);
              s.mx = nx; s.my = ny;
            }
            if (!isFinite(s.mx) || !isFinite(s.my)) { s.mx = 0.31; s.my = 0.17; }
            // RIFF DETECTION — does the sampled orbit repeat?
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
            // pitch from position: x = which rung of the ladder, height = octave
            const lad = Math.max(0, Math.min(7, Math.round(((s.mx / 2.2) + 1) * 3.5)));
            const oct = 1 + (s.my < -0.35 ? 1 : 0);
            // velocity from the smoke where it lands, accented on the beat
            let local = 0;
            if (s.den && s.dw) {
              const bx = ((s.dw + s.mx * s.dw * 0.43) / 2) | 0, by = ((s.dh + s.my * s.dh * 0.53) / 2) | 0;
              if (bx >= 0 && bx < s.dw && by >= 0 && by < s.dh) local = clamp(Math.log1p(s.den[by * s.dw + bx]) / Math.log1p(s.peak));
            }
            vol = (vol + local * 0.04) * (st === 0 ? 1.35 : st % 4 === 0 ? 1.15 : 1);
            const dur = drive < 0.35 ? 1.5 : drive < 0.65 ? 1.0 : 0.65;
            A.pluck2(H.chordTone(lad, oct), { at: tt, vol, dur, pan: clamp(s.mx / 2.2, -1, 1) * 0.7, rev: 0.45, del: 0.18, role: 'arp' });
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
