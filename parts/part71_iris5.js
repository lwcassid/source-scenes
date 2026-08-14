/* ---------- SRC-37.5 · IRIS ENGINE V5 (the left hand is a drum machine) ---------- */
reg({
  id: 'SRC-37.5', family: 'SRC-37', ver: 5, title: 'Iris Engine V5', tech: 'GARAGE LADDER / CHORD = GRADIENT',
  music: {
    bpm: 132, root: 43, mode: 'lydian', chordBars: 8,
    // SIX CHORDS FOR SIX SHAPES, all on a G pedal. 132 BPM — garage tempo.
    chords: [
      [0, 7, 14, 19, 26],   // 0 · circles      Gsus2      — no third, all air
      [0, 7, 16, 21, 26],   // 1 · three lobes  G6/9
      [0, 9, 14, 16, 21],   // 2 · four lobes   Em11/G
      [0, 6, 14, 18, 23],   // 3 · five lobes   Gmaj7♯11   — the lydian signature
      [0, 6, 11, 14, 18],   // 4 · six lobes    G♯11(add9)
      [0, 1, 6, 13, 18]     // 5 · seven lobes  G♯11♭9     — the sourest shape
    ],
    chordNames: ['Gsus2', 'G6/9', 'Em11/G', 'Gmaj7♯11', 'G♯11(add9)', 'G♯11♭9']
  },
  fx: { bloom: 0.6 },
  tags: ['LEFT HAND = THE BREAKBEAT', 'RIGHT HAND = THE CHORD AND THE COLOUR', 'THE TUNNEL ANSWERS THE DRUMS', 'G LYDIAN AT 132'],
  desc: 'A tunnel of fat bands boiling out of one eye, in one colour at a time — a gradient running from the middle of the frame outward, pale and hot at the eye, deepening as it travels. Now it has a rhythm section. The left hand walks a ladder of London garage: from an empty room, through a two-step skeleton, into a shuffled garage groove, and out the far end into a full chopped breakbeat with rolls. The picture is wired to the kit — the kick shoves the whole tunnel outward, the snare lights the side walls, the hats put a shimmer on the halos — and the rings run faster at the busier settings because they are keeping up with the drums, not because a speed knob was turned.',
  interact: 'L = THE BEAT, in six steps. Drawn in there is no kit at all, just the drone and a band every two beats. Lift and a two-step skeleton arrives (kick, snare, off-beat sub); lift again and it shuffles — swung sixteenth hats, ghost snares, the bassline landing on the ands; keep going and the kit breaks apart into a chopped break, and at the top it is a full break with sixteenth rolls at the end of the bar. Every step up also drives the tunnel harder: more bands per beat, and every drum in the pattern is visible — a kick is a thump that pushes the whole tunnel outward, a snare throws light onto the left and right walls, hats sparkle in the halos. R = MORPH: the shape of the rings, and with it the chord and the colour of the entire room — Gsus2 in gold, G6/9 coral, Em11/G violet, Gmaj7♯11 rose, G♯11 ember, G♯11♭9 deep purple, crossfading over about a second. Left hand for the groove, right hand for the harmony, and the frame stays lit as long as either hand is off its rest.',
  sound: 'A garage rig at 132 in G lydian. The left hand indexes six kits: (0) nothing, (1) kick and snare skeleton, (2) two-step with an off-beat sub bass, (3) shuffled garage — swung hats, ghost snares, syncopated kick, (4) chopped breakbeat, (5) full break with a sixteenth roll into the bar. Swing is applied to the odd sixteenths from level 3 up, which is what makes it walk instead of march. Bass (MIDI role: bass) plays the root and fifth of whatever chord the right hand is holding, on the pattern\'s own off-beats. The ring arpeggio (role: arp) thins out as the kit gets busy so the drums have the room. Underneath, a sawtooth pedal filtered by two formants driven straight off the raw hands (CC1/CC2) with a tremolo at the ring rate. Chord jumps happen the moment the shape settles, not on the bar. Ableton: perc ch10 (36 kick / 38 snare / 42 closed / 46 open), bass ch3, arp ch4, texture ch6, pad ch2, bells ch5.',

  // one gradient per chord: inner (at the eye) · middle · outer (at the walls)
  _GRAD: [
    [[255, 236, 196], [255, 178, 68], [150, 60, 30]],    // 0 gold → ember
    [[255, 226, 200], [255, 120, 70], [140, 34, 52]],    // 1 cream → coral → crimson
    [[240, 214, 255], [176, 74, 205], [62, 42, 110]],    // 2 lilac → violet → indigo
    [[255, 220, 235], [230, 90, 170], [84, 30, 92]],     // 3 rose → magenta → plum
    [[255, 228, 170], [255, 96, 46], [110, 22, 32]],     // 4 amber → orange → oxblood
    [[236, 208, 255], [140, 60, 200], [42, 22, 74]]      // 5 violet → purple → night
  ],

  // SIX KITS. Each row is one bar of sixteenths; the number is velocity.
  // 0 = silence · 1 = skeleton · 2 = two-step · 3 = shuffled garage
  // 4 = chopped break · 5 = full break with a roll
  _KIT: [
    { k: [], s: [], h: [], b: [] },
    {
      k: [[0, 1]], s: [[8, 0.9]], h: [], b: [[0, 0.8]]
    },
    {
      k: [[0, 1], [10, 0.85]], s: [[4, 0.9], [12, 0.9]],
      h: [[2, 0.5], [6, 0.55], [14, 0.5]], b: [[6, 0.7], [14, 0.6]]
    },
    {
      k: [[0, 1], [10, 0.9], [11, 0.5]], s: [[4, 0.95], [12, 0.95], [7, 0.35], [15, 0.4]],
      h: [[2, 0.5], [3, 0.3], [6, 0.6], [9, 0.35], [11, 0.4], [14, 0.6], [15, 0.3]],
      b: [[3, 0.8], [6, 0.75], [11, 0.7], [14, 0.65]]
    },
    {
      k: [[0, 1], [3, 0.6], [10, 0.9]], s: [[4, 0.95], [12, 0.95], [14, 0.45], [7, 0.4]],
      h: [[1, 0.3], [2, 0.55], [5, 0.35], [6, 0.6], [8, 0.4], [9, 0.35], [13, 0.4], [14, 0.6]],
      b: [[3, 0.85], [6, 0.8], [10, 0.7], [13, 0.7]]
    },
    {
      k: [[0, 1], [3, 0.7], [6, 0.5], [10, 0.95]],
      s: [[4, 1], [7, 0.45], [12, 1], [14, 0.6], [15, 0.5]],
      h: [[1, 0.35], [2, 0.6], [3, 0.3], [5, 0.4], [6, 0.65], [8, 0.45], [9, 0.4], [10, 0.3], [13, 0.45], [14, 0.65], [15, 0.4]],
      b: [[3, 0.9], [6, 0.85], [9, 0.7], [11, 0.8], [14, 0.75]]
    }
  ],
  _RATE: [0.5, 1, 1, 2, 2, 3],   // bands per beat at each kit level

  init(P) {
    P.state = {
      pres: 0, NR: 22, morph: 0, morphS: 0, lean: 0, leanS: 0, rate: 1, rateS: 1, level: 0,
      phase: 0, pulse: 0, spin: 0, wake: 0, act: 0, melt: 0, exc: new Float32Array(16),
      prevL: 0, prevR: 0, candT: 0, cand: 0, warp: 0,
      grad: 0, gradFrom: 0, gradMix: 1,
      kickE: 0, snareE: 0, hatE: 0, lastStep: -1, st: 0
    };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

    /* ---- AWAKE = A HAND OFF ITS REST, OR A HAND MOVING ------------------ */
    const vel = (Math.abs(inp.L - s.prevL) + Math.abs(inp.R - s.prevR)) / Math.max(dt, 1e-3);
    s.prevL = inp.L; s.prevR = inp.R;
    s.act += (vel - s.act) * Math.min(1, dt * 12);
    const held = clamp((Math.max(inp.L, inp.R) - 0.03) / 0.22);
    const woken = Math.min(1, s.act * 2.6);
    s.wake = Math.max(s.wake * Math.pow(0.5, dt / 3.4), Math.max(held, woken));

    // ---- L: THE KIT. Six steps, schmitt-latched so it never chatters.
    const want = clamp(inp.L) * 5.999 | 0;
    if (want > s.level && inp.L > want / 6 + 0.03) s.level = want;
    else if (want < s.level && inp.L < (want + 1) / 6 - 0.03) s.level = want;
    s.rate = this._RATE[s.level];
    s.rateS += (s.rate - s.rateS) * Math.min(1, dt * 4);
    s.melt += (clamp(inp.L * 0.6 + s.level / 5 * 0.4) - s.melt) * Math.min(1, dt * 4);

    // ---- R: morph. Six shapes; each owns a chord AND a gradient.
    const m = clamp(inp.R) * 5.999 | 0;
    if (m !== s.cand) { s.cand = m; s.candT = t; }
    if (m !== s.morph && t - s.candT > 0.22) {
      s.gradFrom = s.grad; s.grad = m; s.gradMix = 0;
      s.morph = m;
    }
    s.gradMix = Math.min(1, s.gradMix + dt * 1.1);
    s.morphS += (s.morph - s.morphS) * Math.min(1, dt * 5);
    s.warp = clamp(inp.R);
    s.lean = clamp(inp.R) * 0.3;
    s.leanS += (s.lean - s.leanS) * Math.min(1, dt * 4);

    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 2.2;
    s.phase = beats * s.rate;
    const fr = s.phase - Math.floor(s.phase);
    s.pulse = Math.pow(1 - fr, 2.6);
    s.spin += dt * (0.05 + s.warp * 0.2);

    /* ---- THE PICTURE IS WIRED TO THE KIT -------------------------------
       Both the drums and these envelopes are read from the same pattern on
       the same transport, so what you see is exactly what is playing.     */
    const step16 = Math.floor(beats * 4);
    if (step16 !== s.lastStep) {
      s.lastStep = step16;
      const st = ((step16 % 16) + 16) % 16;
      s.st = st;
      const kit = this._KIT[s.level];
      if (kit) {
        for (const [p, v2] of kit.k) if (p === st) s.kickE = Math.max(s.kickE, v2);
        for (const [p, v2] of kit.s) if (p === st) s.snareE = Math.max(s.snareE, v2);
        for (const [p, v2] of kit.h) if (p === st) s.hatE = Math.max(s.hatE, v2);
      }
    }
    s.kickE = Math.max(0, s.kickE - dt * 4.2);
    s.snareE = Math.max(0, s.snareE - dt * 5.5);
    s.hatE = Math.max(0, s.hatE - dt * 12);

    if (typeof AE !== 'undefined' && AE.SB && typeof H !== 'undefined' && H.chordSemis.length) {
      for (let i = 0; i < 16; i++) {
        const e = AE.SB.excite(H.chordTone(i, -1));
        s.exc[i] += (e - s.exc[i]) * Math.min(1, dt * 8);
      }
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#050308';
    g.fillRect(0, 0, w, h);
    const wake = smooth(clamp(s.wake));
    if (wake < 0.006) {
      g.fillStyle = 'rgba(255,226,186,0.3)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('· ASLEEP — MOVE A HAND ·', 10, h - 10);
      return;
    }
    const cx = w / 2 - s.leanS * w * 0.12;
    const cy = h / 2 + Math.sin(s.spin * 0.7) * h * 0.025;
    const maxR = Math.hypot(w, h) * 0.62;
    const NR = s.NR, SEG = P.focused ? 96 : 40;
    // THE KICK SHOVES THE TUNNEL, the snare lights the walls, hats shimmer
    const thump = 1 + s.kickE * 0.055;
    const bright = (0.45 + s.pres * 0.55) * (1 + s.kickE * 0.3);

    const GA = this._GRAD[s.gradFrom] || this._GRAD[0];
    const GB = this._GRAD[s.grad] || this._GRAD[0];
    const mixv = smooth(clamp(s.gradMix));
    const ramp = u => {
      const q = clamp(u), k = q < 0.5 ? q * 2 : (q - 0.5) * 2;
      const i0 = q < 0.5 ? 0 : 1, i1 = i0 + 1;
      const out = [0, 0, 0];
      for (let c = 0; c < 3; c++) {
        const a = GA[i0][c] + (GA[i1][c] - GA[i0][c]) * k;
        const b = GB[i0][c] + (GB[i1][c] - GB[i0][c]) * k;
        out[c] = (a + (b - a) * mixv) | 0;
      }
      return out;
    };
    // the room closes from the sides when it is left alone — and the snare
    // throws light back onto those same walls when it hits
    const edge = clamp((wake - 0.55) / 0.45 + s.snareE * 0.5);
    const mid = clamp((wake - 0.18) / 0.5 + s.snareE * 0.3);
    const core = clamp(wake / 0.3);

    g.globalCompositeOperation = 'lighter';
    for (let k = NR - 1; k >= 0; k--) {
      const u = ((k + s.phase) % NR + NR) % NR / NR;
      const r0 = Math.pow(u, 1.5) * maxR * thump;
      if (r0 < 2) continue;
      const far = Math.pow(1 - Math.min(1, r0 / (maxR * 1.02)), 1.15);
      if (far < 0.012) continue;
      const near = 1 - Math.abs(u - 0.34) / 0.34;
      const flare = Math.max(0, near) * s.pulse;
      const tone = s.exc[(k * 3) % 16] || 0;
      const lobes = 2 + Math.round(s.morphS);
      const amp = r0 * (0.015 + s.warp * 0.15) * Math.pow(u, 0.7);
      const off = s.leanS * r0 * 0.45;
      const base = Math.max(3 * ms, r0 * 0.05 + 3 * ms);
      const col = ramp(Math.pow(u, 0.85) * (1 - flare * 0.45));

      for (let pass = 0; pass < 2; pass++) {
        const halo = pass === 0;
        const lw = halo
          ? base * (1.4 + s.melt * 2.6)
          : base * (1 + flare * 0.6 + tone * 0.4) * (1 + s.melt * 0.4);
        const a = (halo ? (0.03 + s.melt * 0.085 + tone * 0.08 + s.hatE * 0.05)
          : (0.5 + flare * 0.5 + tone * 0.35)) * bright * far;
        if (a < 0.004) continue;
        const gr = g.createLinearGradient(cx - maxR, 0, cx + maxR, 0);
        const rgb = `${col[0]},${col[1]},${col[2]}`;
        gr.addColorStop(0, `rgba(${rgb},${a * edge})`);
        gr.addColorStop(0.26, `rgba(${rgb},${a * mid})`);
        gr.addColorStop(0.5, `rgba(${rgb},${a * core})`);
        gr.addColorStop(0.74, `rgba(${rgb},${a * mid})`);
        gr.addColorStop(1, `rgba(${rgb},${a * edge})`);
        g.strokeStyle = gr;
        g.lineWidth = lw;
        g.beginPath();
        for (let i = 0; i <= SEG; i++) {
          const an = i / SEG * TAU;
          // hats put a fine grain on the ring edge — the top of the kit
          // should be visible in the geometry, not only in the brightness
          const jit = s.hatE * amp * 0.22 * Math.sin(an * 17 + k * 2.3 + s.spin * 9);
          const rr = r0 + Math.sin(an * lobes + s.spin * 1.7 + k * 0.6) * amp
            + Math.sin(an * (lobes + 2) - s.spin * 1.1 + k * 0.31) * amp * 0.4 + jit;
          const x = cx + Math.cos(an) * rr + off, y = cy + Math.sin(an) * rr * 0.97;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        g.stroke();
      }
    }
    const inner = ramp(0);
    const rr = Math.pow(0.34, 1.5) * maxR;
    const eg = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.15);
    const eA = (0.1 + s.pulse * 0.22 + s.kickE * 0.3) * bright * core;
    eg.addColorStop(0, `rgba(${inner[0]},${inner[1]},${inner[2]},${eA})`);
    eg.addColorStop(0.5, `rgba(${inner[0]},${inner[1]},${inner[2]},${eA * 0.5})`);
    eg.addColorStop(1, `rgba(${inner[0]},${inner[1]},${inner[2]},0)`);
    g.fillStyle = eg;
    g.beginPath(); g.arc(cx, cy, rr * 1.15, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    const hud = ramp(0.25);
    g.fillStyle = `rgba(${hud[0]},${hud[1]},${hud[2]},0.9)`;
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const KITN = ['NO KIT', 'SKELETON', 'TWO-STEP', 'GARAGE (SWUNG)', 'CHOPPED BREAK', 'FULL BREAK'];
    g.fillText('KIT ' + KITN[s.level] + '   SHAPE ' + (2 + s.morph) + '-LOBE · ' + (H.label || '') +
      '   MELT ' + Math.round(s.melt * 100) + '   WAKE ' + Math.round(wake * 100) +
      (wake < 0.3 ? '  · CLOSING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- THE VOWEL DRONE: the hands are two formants -------------------- */
    const o1 = v.osc('sawtooth', 82), o2 = v.osc('sawtooth', 82);
    o2.detune.value = 7;
    const fA = v.filter('bandpass', 500, 4.5), fB = v.filter('bandpass', 1400, 5.5);
    const gA = v.g(0.03), gB = v.g(0.02);
    const trem = v.g(1);
    const lfo = v.osc('sine', 2), lfoG = v.g(0.35);
    lfo.connect(lfoG); lfoG.connect(trem.gain);
    o1.connect(fA); o2.connect(fA); o1.connect(fB); o2.connect(fB);
    fA.connect(gA); fB.connect(gB);
    gA.connect(trem); gB.connect(trem); trem.connect(v.group);
    if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.4; trem.connect(sd); sd.connect(AE.revIn); }

    const bed = A.padVoices(v, 3, { type: 'triangle', gain: 0.01, cutoff: 340, q: 0.7 });
    const place = glide => {
      A.leadToChord(bed, -1, glide);
      const rf = H.rootFreq(-2);
      A.set(o1.frequency, rf, 0.12); A.set(o2.frequency, rf, 0.12);
      if (typeof MOut !== 'undefined') MOut.evNote('texture', rf, 0.12, 0, 4.2);
    };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.2);

    /* --- the snare the kit is missing: a tight garage crack ------------- */
    const snare = (at, vol) => {
      if (!A.ctx) return;
      const t0 = Math.max(A.t(), at || 0);
      // body
      const o = A.ctx.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(330, t0);
      o.frequency.exponentialRampToValueAtTime(170, t0 + 0.05);
      const og = A.ctx.createGain();
      og.gain.setValueAtTime(vol * 0.5, t0);
      og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(og); og.connect(A.master);
      o.start(t0); o.stop(t0 + 0.12);
      // the crack
      const n = A.ctx.createBufferSource(); n.buffer = A.noiseBuf();
      const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2100; f.Q.value = 0.9;
      const ng = A.ctx.createGain();
      ng.gain.setValueAtTime(vol * 0.8, t0);
      ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
      n.connect(f); f.connect(ng); ng.connect(A.master);
      if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.22; ng.connect(sd); sd.connect(AE.revIn); }
      n.start(t0); n.stop(t0 + 0.2);
      if (typeof MOut !== 'undefined') MOut.evDrum(38, vol * 0.8, t0);
    };

    let nextT = T.next(0.25), idx = 0, shape = -1;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const wake = smooth(clamp(s.wake));
        const gate = (0.3 + s.pres * 0.7) * (0.22 + wake * 0.78);
        const L = inp ? inp.L : 0, R = inp ? inp.R : 0;
        const kit = P.def._KIT[s.level];
        const lvl = s.level;

        /* ---- THE SHAPE IS THE CHORD: jump the moment it settles ------- */
        if (s.morph !== shape) {
          shape = s.morph;
          H.prog = [shape];
          H.step = 0;
          H.build();
          place(0.28);
          if (typeof T !== 'undefined' && T.running) H.nextChangeBar = T.bar() + H.chordBars;
        }

        A.set(fA.frequency, 220 + L * 1500, 0.05);
        A.set(fB.frequency, 700 + R * 3400, 0.05);
        A.set(gA.gain, (0.016 + L * 0.03) * gate, 0.15);
        A.set(gB.gain, (0.01 + R * 0.024) * gate, 0.15);
        A.set(lfo.frequency, Math.max(0.2, s.rateS / Math.max(T.beat, 0.05)), 0.2);
        A.set(lfoG.gain, 0.2 + clamp(s.rateS / 6) * 0.5, 0.3);
        bed.forEach(b => { b.level((0.007 + s.pres * 0.005) * (0.3 + wake * 0.7), 0.5); b.bright(260 + R * 500, 0.4); });

        /* ---- THE KIT, walked one sixteenth at a time ------------------- */
        const sw = lvl >= 3 ? T.beat * 0.25 * 0.16 : 0;   // garage shuffle
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 40) {
          const step16 = Math.round((nextT - T.t0) / (T.beat * 0.25));
          const st = ((step16 % 16) + 16) % 16;
          const swung = nextT + (st % 2 ? sw : 0);
          if (kit && wake > 0.08) {
            for (const [p, vv] of kit.k) if (p === st) A.kick(swung, 0.2 * vv * gate * 1.6);
            for (const [p, vv] of kit.s) if (p === st) snare(swung, 0.17 * vv * gate * 1.6);
            for (const [p, vv] of kit.h) if (p === st) A.hat(swung, { vol: 0.03 * vv * gate * 1.6, open: st === 14 && lvl >= 3 });
            // the bassline lives on the pattern's own off-beats
            for (const [p, vv] of kit.b) {
              if (p !== st) continue;
              const deg = (st % 8 === 0) ? 0 : (st % 3 === 0 ? 2 : 1);
              A.bassNote(H.chordTone(deg, -1), { at: swung, vol: (0.09 + lvl * 0.012) * vv * gate, dur: 0.34 });
            }
          }
          // the ring arpeggio — thinned out as the kit gets busy so the
          // drums have room to breathe
          const per = Math.max(1, Math.round(1 / (s.rate * 0.25)));
          if (wake > 0.06 && step16 % per === 0) {
            idx += 1 + s.morph;
            const i = ((idx % 13) + 13) % 13;
            const vol = (0.032 + clamp(L) * 0.03) * gate * (lvl >= 4 ? 0.55 : lvl >= 2 ? 0.8 : 1);
            const pan = Math.sin(idx * 1.7) * 0.5;
            A.pluck2(H.chordTone(i, 0), { at: nextT, vol, dur: Math.min(0.9, per * T.beat * 0.25 * 1.6), pan, rev: 0.4, del: 0.2, role: 'arp' });
            if (s.morph >= 2 && lvl >= 3 && (idx % 4) === 0) {
              A.bell(H.chordTone(i + 3, 1), { at: nextT, vol: vol * 0.45, dur: 1.4, pan: -pan, rev: 0.66 });
            }
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('perc', clamp(lvl / 5));
          MOut.expr('arp', clamp(s.rateS / 3));
          MOut.expr('texture', wake);
          MOut.expr('pad', clamp(s.morph / 5));
        }
      },
      stop() { v.kill(); }
    };
  }
});
