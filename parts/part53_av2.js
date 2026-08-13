/* ---------- SRC-09.2 · ATTRACTOR VESPERS V2 (the figure scores itself) ---------- */
reg({
  id: 'SRC-09.2', family: 'SRC-09', ver: 2, title: 'Attractor Vespers V2', tech: 'CLIFFORD MAP / DENSITY SMOKE',
  music: {
    bpm: 56, root: 43, mode: 'aeolian', chordBars: 1, prog: [0],
    // A LADDER IN G MINOR, not a loop. The MEASURED SHAPE picks the band and
    // can jump to it immediately; the pair inside each band alternates on the
    // bar so the harmony always breathes.
    // Band 0 = VANISHING · 1 = FULL · 2 = TWISTING · 3 = TORN.
    chords: [
      [0, 7, 14, 15, 19],   // Gm(add9)   — open fifth, ninth, rest
      [0, 8, 15, 19, 22],   // E♭maj9/G   — the softest place in the key
      [0, 7, 15, 22, 26],   // Gm9        — colour, still consonant
      [0, 15, 17, 20, 22],  // Cm11/G     — subdominant lean, first pull
      [0, 14, 17, 20, 23],  // A°7/G      — diminished over the pedal
      [0, 7, 15, 21, 26],   // Gm6/9      — E♮ against B♭, tritone inside
      [-1, 11, 14, 17, 20], // F♯°7       — the leading-tone diminished
      [-1, 11, 17, 20, 24]  // F♯°7♭9     — G against F♯, the peak
    ],
    chordNames: ['Gm(add9)', 'E♭maj9/G', 'Gm9', 'Cm11/G', 'A°7/G', 'Gm6/9', 'F♯°7', 'F♯°7(♭9)']
  }, fx: { bloom: 0.5 },
  tags: ['STRANGE ATTRACTOR', 'CELLO VS VIOLIN', 'G MINOR DIMINISHED', 'CONTRACT = TENSION'],
  desc: 'Four constants and a spark. The same point is thrown a hundred thousand times and lands as smoke, never twice in the same place, never once outside the figure. Your hands hold two of the constants; bend them and the whole apparition swims to a new anatomy without ever tearing.',
  interact: 'L bends constant a, R bends constant b — both drawn IN is the violent corner, both wide open is dissolution. The music does not listen to your hands; it listens to the FIGURE they make. Two things are measured live: how much apparition is actually on screen, and its Lyapunov exponent — how hard the map is folding. Those pick the harmony, so a gesture that barely changes the shape barely changes the sound, and one that snaps it to a new anatomy lands as a new chord within half a second. The HUD prints both numbers and the stage name, so the surface is learnable: contract into the torn corner, open outward to walk back through twisting and full into ambient.',
  sound: 'A string duet in G minor that answers the apparition rather than the controller. FOUR STAGES, chosen by measurement. VANISHING (the figure collapses to a point or a thin loop): the bow lifts off, the strings all but disappear and the bandpassed noise beds take the room — pure ambience on Gm(add9)/E♭maj9. FULL (broad, coherent smoke): cello and violin agree, Gm9/Cm11. TWISTING: A°7/G and Gm6/9, the tritone creeping in. TORN (violently folded): F♯°7 and F♯°7(♭9) — the cello takes the sourest double-stop the chord contains, the violin sits a minor 9th above it. CELLO (MIDI role: bass) is bowed saws through a resonant low-pass with rosin noise underneath; presence follows how much figure there is, bow pressure follows the fold. VIOLIN (role: lead) exists only where the figure is both present and torn — vibrato widens 4.5→7Hz and its two strings detune apart into audible beating, so the roughness IS the dissonance. Harmony jumps the moment the stage changes rather than waiting for the bar; the bar clock only alternates the pair inside a stage. Fast hand motion still bends the violin down a whole tone and lets it crawl back. Ableton: cello ch3, violin ch1, pad ch2; CC74 = bow pressure, violin presence, figure.',
  init(P) {
    P.state = {
      x: 0.1, y: 0.1, c: 0.7 + P.rand() * 0.5, d: 0.55 + P.rand() * 0.5,
      spreadX: 1, spreadY: 1, first: true,
      // shape sensing: an occupancy grid (how much figure there is) and a
      // tangent vector riding the map (how violently it folds)
      GB: 28, grid: new Uint8Array(28 * 28), pres: 0, twist: 0,
      lx: 0.12, ly: 0.31, vx: 1, vy: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.a = -1.9 + inp.L * 0.85;
    // R RUNS BACKWARDS so that BOTH hands at zero is the peak: drawn all the
    // way in the figure is at its most torn, wide open it dissolves.
    s.b = 2.00 - inp.R * 0.85;
    // ---- HOW TWISTED IS IT? ----------------------------------------------
    // The largest Lyapunov exponent, measured live: ride a tangent vector
    // through the map's Jacobian and watch how fast it stretches. λ≤0 means
    // the figure is collapsing to a point or a loop; big λ means it is folding
    // chaotically. This is the honest number behind the word "twisted".
    let lx = s.lx, ly = s.ly, vx = s.vx, vy = s.vy, acc = 0;
    const IT = 420;
    for (let i = 0; i < IT; i++) {
      const j11 = -s.c * s.a * Math.sin(s.a * lx), j12 = s.a * Math.cos(s.a * ly);
      const j21 = s.b * Math.cos(s.b * lx), j22 = -s.d * s.b * Math.sin(s.b * ly);
      const ux = j11 * vx + j12 * vy, uy = j21 * vx + j22 * vy;
      const m = Math.sqrt(ux * ux + uy * uy) || 1e-12;
      vx = ux / m; vy = uy / m;
      acc += Math.log(m);
      const nx = Math.sin(s.a * ly) + s.c * Math.cos(s.a * lx);
      const ny = Math.sin(s.b * lx) + s.d * Math.cos(s.b * ly);
      lx = nx; ly = ny;
    }
    if (!isFinite(lx) || !isFinite(ly)) { lx = 0.12; ly = 0.31; vx = 1; vy = 0; acc = 0; }
    s.lx = lx; s.ly = ly; s.vx = vx; s.vy = vy;
    const lam = acc / IT;                                  // nats per iteration
    const k = Math.min(1, dt * 5);
    s.twist += (clamp(lam / 0.55) - s.twist) * k;          // ~0.55 = full chaos
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.first) { g.fillStyle = '#060806'; g.fillRect(0, 0, w, h); s.first = false; }
    g.fillStyle = 'rgba(6,8,6,0.14)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) * 0.27;
    let { x, y } = s;
    let sx = 0, sy = 0;
    // incense smoke whose color breathes with the constants
    const hue = 235 + s.a * 34 + s.b * 22;
    g.fillStyle = `hsla(${hue},48%,80%,0.34)`;
    const n = P.focused ? 12000 : 2600;
    // ---- HOW MUCH FIGURE IS THERE? ---------------------------------------
    // Coarse occupancy: a collapsed attractor lights a handful of cells, a
    // full apparition lights hundreds. This is what "disappearing" means.
    const GB = s.GB, grid = s.grid, q = GB / 6;
    grid.fill(0);
    for (let i = 0; i < n; i++) {
      const nx = Math.sin(s.a * y) + s.c * Math.cos(s.a * x);
      const ny = Math.sin(s.b * x) + s.d * Math.cos(s.b * y);
      x = nx; y = ny;
      sx += Math.abs(x); sy += Math.abs(y);
      const bx = (x + 3) * q | 0, by = (y + 3) * q | 0;
      if (bx >= 0 && bx < GB && by >= 0 && by < GB) grid[by * GB + bx] = 1;
      g.fillRect(cx + x * sc, cy + y * sc * 0.92, 1.5, 1.5);
    }
    let occ = 0;
    for (let i = 0; i < grid.length; i++) occ += grid[i];
    s.x = x; s.y = y;
    s.spreadX = sx / n; s.spreadY = sy / n;
    // normalize: a broad Clifford lights roughly a quarter of the box
    s.pres += (clamp(occ / (GB * GB) / 0.26) - s.pres) * 0.12;
    g.fillStyle = 'rgba(140,190,110,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('A ' + s.a.toFixed(3) + '  B ' + s.b.toFixed(3) + '  C ' + s.c.toFixed(2) + '  D ' + s.d.toFixed(2), 10, h - 10);
    if (P.focused) {
      g.fillStyle = 'rgba(140,190,110,0.55)';
      g.fillText('FIGURE ' + Math.round(s.pres * 100) + '   TWIST ' + Math.round(s.twist * 100) +
        '   ' + (s.stageName || ''), 10, h - 24);
    }
  },
  audio(A, P) {
    const v = A.voice();

    /* --- the cathedral: the attractor's own spread, as air --------------- */
    const n1 = v.noise(), n2 = v.noise();
    const f1 = v.filter('bandpass', 800, 6), f2 = v.filter('bandpass', 1400, 6);
    const g1 = v.g(0.014), g2 = v.g(0.014);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);

    /* --- put a section on its own MIDI channel --------------------------- */
    // padVoices already wraps set() to emit on the 'pad' channel; pre-seeding
    // _mNote makes that wrapper early-out so each section speaks once, its own way.
    const route = (voices, role, vel) => voices.forEach(vc => {
      const base = vc.set.bind(vc);
      vc.set = function (freq, glide) {
        if (isFinite(freq) && freq > 20 && typeof MOut !== 'undefined') {
          const note = MOut.f2n(freq);
          if (vc._rNote !== note) {
            const ch = MOut.chFor(role), p = performance.now();
            if (vc._rNote !== undefined && MOut.wants() && MOut.port) {
              try { MOut.port.send([0x80 | (ch - 1), vc._rNote, 0], p); } catch (e) {}
            }
            vc._rNote = note;
            MOut.log.push({ p, role, ch, note, vel, durMs: 1800 });
            if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, vel], p); } catch (e) {} }
          }
          vc._mNote = note; // silence the generic pad emitter for this voice
        }
        base(freq, glide);
      };
    });

    /* --- CELLO: bowed saws, resonant body, rosin under the bow ----------- */
    const cello = A.padVoices(v, 2, { type: 'sawtooth', gain: 0.05, cutoff: 240, q: 3.2 });
    route(cello, 'bass', 66);
    const rosin = v.noise(), rf = v.filter('lowpass', 620, 1.4), rg = v.g(0.004);
    rosin.connect(rf); rf.connect(rg); rg.connect(v.group);

    /* --- VIOLIN: thinner, higher, vibrato that widens with the argument -- */
    const violin = A.padVoices(v, 2, { type: 'sawtooth', gain: 0.0001, cutoff: 900, q: 2.6 });
    route(violin, 'lead', 74);
    const vib = violin.map(() => {
      const o = v.osc('sine', 4.6), d = v.g(0);
      o.connect(d); return { o, d };
    });
    violin.forEach((vc, i) => { vib[i].d.connect(vc.o1.frequency); vib[i].d.connect(vc.o2.frequency); });
    const hair = v.noise(), hf = v.filter('bandpass', 3200, 3), hg = v.g(0.0001);
    hair.connect(hf); hf.connect(hg); hg.connect(v.group);

    /* --- organ glue, very quiet ------------------------------------------ */
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.024, cutoff: 320, q: 0.6 });

    /* --- voicing: cello takes the floor, violin the ceiling -------------- */
    let tn = 0;                       // dissonance — how twisted the figure is
    let fig = 0;                      // presence — how much figure there is
    // how much an interval bites, by semitone class — the cello's second note
    // is chosen from the chord's OWN tones, so the strain is never a wrong note
    const BITE = [0, 2.6, 1.0, 0.4, 0.4, 0.3, 3.0, 0, 1.2, 0.2, 1.4, 2.6];
    const strainTone = () => {
      const b = H.chordSemis[0];
      let best = b + 12, bs = -1;
      for (let i = 1; i < H.chordSemis.length; i++) {
        const iv = (((H.chordSemis[i] - b) % 12) + 12) % 12;
        // seconds are mud this low — open them out to a ninth instead
        if (BITE[iv] > bs) { bs = BITE[iv]; best = b + (iv === 0 ? 12 : iv < 3 ? iv + 12 : iv); }
      }
      return mtof(best);
    };
    const place = (glide) => {
      // cello holds the floor; its second note relaxes to the next chord tone
      // and, under strain, climbs to the sourest double-stop the chord allows
      cello[0].set(H.chordTone(0, 0), glide);
      cello[1].set(tn > 0.6 && fig > 0.35 ? strainTone() : H.chordTone(1, 0), glide);
      violin[0].set(H.chordTone(3, 1), glide);
      violin[1].set(H.chordTone(4, 1), glide);
      A.leadToChord(pads, 0, glide);
    };
    place(0.05);
    H.onChord(() => place(2.2));
    v.fadeIn(1, 1.6);

    const STAGE = ['VANISHING', 'FULL', 'TWISTING', 'TORN'];
    let prevL = 0, prevR = 0, swoop = 0, band = 1, cand = 1, candT = -9, lastCh = -9;
    return {
      tick(inp, dt) {
        const s = P.state;
        dt = Math.min(0.1, dt || 0.016);
        const now = A.t();
        const L = inp ? inp.L : 0, R = inp ? inp.R : 0;

        /* ---- THE SHAPE IS THE SCORE ------------------------------------
           Two measured quantities, not the raw hands:
             fig  = how much figure is on screen  (0 = vanishing)
             tn   = how violently it folds        (0 = smooth, 1 = torn)
           The hands still author both — but the music now answers the
           apparition, so a gesture that barely changes the shape barely
           changes the sound, and one that snaps it into a new anatomy
           lands as a new chord immediately.                              */
        fig = clamp(((s.pres || 0) - 0.10) / 0.45);
        tn = s.twist || 0;

        // Stage: vanishing overrides everything; otherwise twist chooses.
        // Thresholds are calibrated to how this map ACTUALLY distributes —
        // any figure that stays on screen is already chaotic, so the useful
        // range of λ among living figures is ~0.3–0.9, not 0–1. Splitting it
        // at the real thirds is what makes all three stages playable.
        const target = fig < 0.35 ? 0 : tn < 0.45 ? 1 : tn < 0.68 ? 2 : 3;
        if (target !== cand) { cand = target; candT = now; }
        // commit once the new stage has held briefly — no chatter on the edge,
        // but no waiting for the bar either: the harmony moves when the shape does
        if (target !== band && now - candT > 0.28 && now - lastCh > 0.5) {
          band = target; lastCh = now;
          H.prog = [band * 2 + (H.phrase & 1)];
          H.build();
          place(band > 1 ? 0.5 : 1.1);   // into tension fast, out of it gracefully
          if (typeof T !== 'undefined' && T.running) H.nextChangeBar = T.bar() + H.chordBars;
        }
        s.stageName = STAGE[band];
        H.prog = [band * 2 + (H.phrase & 1)];

        // doppler: a fast hand bends the violin down a tone and it crawls back
        const vel = (Math.abs(L - prevL) + Math.abs(R - prevR)) / dt;
        prevL = L; prevR = R;
        swoop = Math.max(swoop * Math.pow(0.12, dt), Math.min(1, vel * 0.55));
        violin.forEach(vc => A.set(vc.o1.detune, -200 * swoop, 0.05));

        // BITE — the same λ, stretched over the range a living figure actually
        // occupies, so a calm full apparition reads as 0 and a torn one as 1.
        const bite = clamp((tn - 0.34) / 0.52);

        // CELLO — the body of the figure. When the apparition thins toward
        // nothing the bow lifts off the string; when it fills out, it digs in.
        // Bite is the bow PRESSURE: brighter, rosin-loud, more grain.
        const bow = 0.2 + fig * 0.8;
        cello[0].bright(150 + bite * 620 + fig * 120, 0.3);
        cello[1].bright(130 + bite * 520 + fig * 100, 0.3);
        cello[0].level(bow * (0.045 + bite * 0.035), 0.4);
        cello[1].level(bow * (0.022 + bite * 0.052), 0.4);
        A.set(rg.gain, bow * (0.002 + bite * 0.013), 0.3);
        A.set(rf.frequency, 480 + bite * 900, 0.3);

        // VIOLIN — it only exists where the figure is BOTH present and torn.
        // Vibrato widens and the two strings detune apart into beating: the
        // roughness IS the dissonance.
        const vlv = fig * clamp((bite - 0.12) / 0.8);
        violin.forEach((vc, i) => {
          vc.level(vlv * vlv * (0.03 + bite * 0.022), 0.5);
          vc.bright(700 + bite * 2600 + s.spreadY * 400, 0.3);
          A.set(vc.o2.detune, 5 + i * 3 + bite * bite * 26, 0.4);
          A.set(vib[i].o.frequency, 4.5 + bite * 2.6, 0.5);
          A.set(vib[i].d.gain, vc.freq * (0.004 + bite * 0.012), 0.4);
        });
        A.set(hg.gain, vlv * vlv * 0.006, 0.4);

        // THE CATHEDRAL — the ambient layer, and the ONLY layer left when the
        // figure vanishes: as the strings lift off, the air takes the room.
        const air = 1 - fig * 0.72;
        A.set(f1.frequency, 300 + s.spreadX * 900, 0.2);
        A.set(f2.frequency, 500 + s.spreadY * 1400, 0.2);
        A.set(g1.gain, 0.008 + air * 0.026, 0.4);
        A.set(g2.gain, 0.008 + air * 0.026, 0.4);
        pads.forEach(p => {
          p.bright(200 + (s.spreadX + s.spreadY) * 260 + bite * 300, 0.3);
          p.level(0.012 + fig * 0.016, 0.5);
        });

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('bass', bow);                // bow pressure
          MOut.expr('lead', vlv);                // violin presence
          MOut.expr('pad', fig);                 // how much figure there is
        }
      },
      stop() { v.kill(); }
    };
  }
})

