/* ---------- SRC-37.4 · IRIS ENGINE V4 (one gradient per chord, in G lydian) ---------- */
reg({
  id: 'SRC-37.4', family: 'SRC-37', ver: 4, title: 'Iris Engine V4', tech: 'RING HALOS / CHORD = GRADIENT',
  music: {
    bpm: 112, root: 43, mode: 'lydian', chordBars: 8,
    // SIX CHORDS FOR SIX SHAPES, all on a G pedal. Lydian: open and bright at
    // rest, and the ♯11 only bites once the rings have grown lobes.
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
  tags: ['ONE GRADIENT PER CHORD', 'G LYDIAN', 'HALOS MELT AT SPEED', 'THE ROOM CLOSES FROM THE SIDES'],
  desc: 'A tunnel of fat bands boiling out of one eye, and at any moment the whole tunnel is ONE colour — a single gradient running from the middle of the frame outward, pale and hot at the eye, deepening as it travels, so a band walks the length of the gradient over its own lifetime. Each chord owns its own gradient: gold, coral, violet, rose, ember, purple. Change the shape and the harmony changes with it, and the whole room changes colour underneath the change — the light and the chord are the same fact. Every band also carries a halo, and the faster the engine runs the wider those halos spread, until neighbouring rings melt into one another.',
  interact: 'R = MORPH, and morph is both the harmony and the colour. Drawn in the rings are true circles and the room is gold on Gsus2; reach out and they grow lobes — three, four, five, six, seven — and each shape brings its own chord and its own gradient: G6/9 in coral, Em11/G in violet, Gmaj7♯11 in rose, G♯11 in ember, and at full reach G♯11♭9 in deep purple. The gradient crossfades over about a second, so a sweep of the right hand is a slow wash of colour across the whole frame as well as a modulation. L = INTENSITY: a ladder of speeds from a band every two beats up to sixteenths, and with it the halos widen — at the top of the ladder the rings have bled into each other and the tunnel is one melting body. As long as either hand is off its rest the scene stays lit; only when both hands come home AND stop moving does the light withdraw, from the sides inward, over about ten seconds.',
  sound: 'G lydian on a pedal that never moves — open and airy at rest (Gsus2 has no third in it at all), and the raised fourth only starts to bite once the rings have grown lobes. The arpeggio walks the chord ladder one note per band (MIDI role: arp), with the grid step taken straight from the ring rate so the note and the band arrive together. Underneath, a sawtooth pedal filtered by two formants driven directly off the raw hands (CC1/CC2) — even between notes a moving hand changes the vowel of the drone — and a tremolo running at exactly the ring rate, so the flicker you see is the flicker you hear. When the shape settles into a new morph the harmony JUMPS rather than waiting for the bar, and the gradient follows it. Bells double the arpeggio an octave up once the tunnel is both fast and lobed; the kick appears only at the top of the intensity ladder. Ableton: arp ch4, texture ch6 = the vowel drone, pad ch2, bells ch5, perc ch10.',

  // one gradient per chord: inner (at the eye) · middle · outer (at the walls)
  _GRAD: [
    [[255, 236, 196], [255, 178, 68], [150, 60, 30]],    // 0 gold → ember
    [[255, 226, 200], [255, 120, 70], [140, 34, 52]],    // 1 cream → coral → crimson
    [[240, 214, 255], [176, 74, 205], [62, 42, 110]],    // 2 lilac → violet → indigo
    [[255, 220, 235], [230, 90, 170], [84, 30, 92]],     // 3 rose → magenta → plum
    [[255, 228, 170], [255, 96, 46], [110, 22, 32]],     // 4 amber → orange → oxblood
    [[236, 208, 255], [140, 60, 200], [42, 22, 74]]      // 5 violet → purple → night
  ],

  init(P) {
    P.state = {
      pres: 0, NR: 22, morph: 0, morphS: 0, lean: 0, leanS: 0, rate: 1, rateS: 1, rateIdx: 1,
      phase: 0, pulse: 0, spin: 0, wake: 0, act: 0, melt: 0, exc: new Float32Array(16),
      prevL: 0, prevR: 0, candT: 0, cand: 0, warp: 0,
      grad: 0, gradFrom: 0, gradMix: 1
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

    // ---- L: intensity. A ladder of speeds, so crossings stay on the grid.
    const LAD = [0.5, 1, 2, 3, 4, 6];
    const want = clamp(inp.L) * (LAD.length - 0.001) | 0;
    if (want > s.rateIdx && inp.L > want / LAD.length + 0.03) s.rateIdx = want;
    else if (want < s.rateIdx && inp.L < (want + 1) / LAD.length - 0.03) s.rateIdx = want;
    s.rate = LAD[s.rateIdx];
    s.rateS += (s.rate - s.rateS) * Math.min(1, dt * 4);
    s.melt += (clamp(inp.L * 0.7 + s.rateIdx / 5 * 0.3) - s.melt) * Math.min(1, dt * 4);

    // ---- R: morph. Six shapes; each owns a chord AND a gradient.
    const m = clamp(inp.R) * 5.999 | 0;
    if (m !== s.cand) { s.cand = m; s.candT = t; }
    if (m !== s.morph && t - s.candT > 0.22) {
      // the room washes from the old colour to the new one over ~1s
      s.gradFrom = s.grad; s.grad = m; s.gradMix = 0;
      s.morph = m;
    }
    s.gradMix = Math.min(1, s.gradMix + dt * 1.1);
    s.morphS += (s.morph - s.morphS) * Math.min(1, dt * 5);
    s.warp = clamp(inp.R);
    s.lean = clamp(inp.R) * 0.3;
    s.leanS += (s.lean - s.leanS) * Math.min(1, dt * 4);

    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.phase = beats * s.rate;
    const fr = s.phase - Math.floor(s.phase);
    s.pulse = Math.pow(1 - fr, 2.6);
    s.spin += dt * (0.05 + s.warp * 0.2);

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
    const NR = s.NR, bright = 0.45 + s.pres * 0.55;
    const SEG = P.focused ? 96 : 40;

    /* ---- ONE GRADIENT AT A TIME, FLOWING OUT FROM THE MIDDLE -----------
       The colour is a function of a band's RADIUS, so a band walks the whole
       ramp over its own lifetime and the tunnel reads as one colour, not as
       a stack of different ones. Chord changes crossfade the whole ramp.   */
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
    // THE ROOM CLOSES FROM THE SIDES: the walls give up their light first
    const edge = clamp((wake - 0.55) / 0.45);
    const mid = clamp((wake - 0.18) / 0.5);
    const core = clamp(wake / 0.3);

    g.globalCompositeOperation = 'lighter';
    for (let k = NR - 1; k >= 0; k--) {
      const u = ((k + s.phase) % NR + NR) % NR / NR;
      const r0 = Math.pow(u, 1.5) * maxR;
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
      // where this band sits along the ramp — flare pulls it back toward the
      // hot end so a sounding band brightens rather than changing hue
      const col = ramp(Math.pow(u, 0.85) * (1 - flare * 0.45));

      for (let pass = 0; pass < 2; pass++) {
        const halo = pass === 0;
        const lw = halo
          ? base * (1.4 + s.melt * 2.6)
          : base * (1 + flare * 0.6 + tone * 0.4) * (1 + s.melt * 0.4);
        const a = (halo ? (0.03 + s.melt * 0.085 + tone * 0.08)
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
          const rr = r0 + Math.sin(an * lobes + s.spin * 1.7 + k * 0.6) * amp
            + Math.sin(an * (lobes + 2) - s.spin * 1.1 + k * 0.31) * amp * 0.4;
          const x = cx + Math.cos(an) * rr + off, y = cy + Math.sin(an) * rr * 0.97;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        g.stroke();
      }
    }
    // the eye: the hot end of whichever ramp is running
    const inner = ramp(0);
    const rr = Math.pow(0.34, 1.5) * maxR;
    const eg = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.15);
    eg.addColorStop(0, `rgba(${inner[0]},${inner[1]},${inner[2]},${(0.1 + s.pulse * 0.22) * bright * core})`);
    eg.addColorStop(0.5, `rgba(${inner[0]},${inner[1]},${inner[2]},${(0.05 + s.pulse * 0.12) * bright * core})`);
    eg.addColorStop(1, `rgba(${inner[0]},${inner[1]},${inner[2]},0)`);
    g.fillStyle = eg;
    g.beginPath(); g.arc(cx, cy, rr * 1.15, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    const hud = ramp(0.25);
    g.fillStyle = `rgba(${hud[0]},${hud[1]},${hud[2]},0.9)`;
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const names = ['1 / 2 BEATS', '1 PER BEAT', '8ths', 'TRIPLETS', '16ths', 'SEXTUPLETS'];
    g.fillText('SHAPE ' + (2 + s.morph) + '-LOBE · ' + (H.label || '') +
      '   INTENSITY ' + names[s.rateIdx] + '   MELT ' + Math.round(s.melt * 100) +
      '   WAKE ' + Math.round(wake * 100) + (wake < 0.3 ? '  · CLOSING' : ''), 10, h - 10);
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

    let nextT = T.next(1), idx = 0, bar = -1, shape = -1;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const wake = smooth(clamp(s.wake));
        const gate = (0.3 + s.pres * 0.7) * (0.22 + wake * 0.78);
        const L = inp ? inp.L : 0, R = inp ? inp.R : 0;

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

        /* ---- the arpeggio, one note per band --------------------------- */
        const stepBeats = 1 / s.rate;
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 24) {
          idx += 1 + s.morph;
          const i = ((idx % 13) + 13) % 13;
          const f = H.chordTone(i, 0);
          const vol = (0.03 + clamp(L) * 0.05) * gate * (s.rate > 3 ? 0.75 : 1);
          const pan = Math.sin(idx * 1.7) * 0.5;
          if (wake > 0.06) {
            A.pluck2(f, { at: nextT, vol, dur: Math.min(1.1, stepBeats * T.beat * 1.8), pan, rev: 0.4, del: 0.2, role: 'arp' });
            if (s.morph >= 2 && s.rate >= 2 && (idx % 4) === 0) {
              A.bell(H.chordTone(i + 3, 1), { at: nextT, vol: vol * 0.5, dur: 1.6, pan: -pan, rev: 0.66 });
            }
          }
          nextT += T.beat * stepBeats;
        }
        if (nextT < now) nextT = T.next(1);

        if (T.running && s.rateIdx >= 4 && wake > 0.4) {
          const b = T.bar();
          if (b !== bar) { bar = b; A.kick(T.next(4), 0.18 + clamp(s.warp) * 0.1); }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('arp', clamp(s.rateS / 6));
          MOut.expr('texture', wake);
          MOut.expr('pad', clamp(s.morph / 5));
        }
      },
      stop() { v.kill(); }
    };
  }
});
