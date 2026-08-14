/* ---------- SRC-37.2 · IRIS ENGINE V2 (fig light, and it only wakes for movement) ---------- */
reg({
  id: 'SRC-37.2', family: 'SRC-37', ver: 2, title: 'Iris Engine V2', tech: 'RING TUNNEL / MORPH = CHORD',
  music: {
    bpm: 112, root: 40, mode: 'phrygian', chordBars: 8,
    // SIX CHORDS FOR SIX SHAPES. The chord is not on a timer — it is chosen by
    // the shape the right hand is making, so morphing the tunnel IS modulating.
    chords: [
      [0, 7, 15, 19, 22],   // 0 · circles      Em7
      [0, 8, 15, 20, 24],   // 1 · three lobes  C/E
      [0, 7, 14, 17, 22],   // 2 · four lobes   Em11
      [0, 5, 12, 17, 22],   // 3 · five lobes   Am11/E
      [0, 1, 8, 13, 20],    // 4 · six lobes    E♭9 phrygian
      [0, 1, 8, 15, 18]     // 5 · seven lobes  E♭9♯11 — the sourest shape
    ],
    chordNames: ['Em7', 'C/E', 'Em11', 'Am11/E', 'E♭9 phryg', 'E♭9♯11']
  },
  fx: { bloom: 0.55 },
  tags: ['FIG PALETTE', 'SHAPE CHOOSES THE CHORD', 'FADES OUT IF YOU STOP MOVING', 'DISSOLVES OUTWARD'],
  desc: 'A tunnel of fat bands in fig colours — indigo, royal purple, amber, pale tan — boiling out of one eye. The bands only exist near the middle: the further they travel the more they give up, until they have dissolved entirely before they reach the frame. And the whole apparition is conditional. It answers MOVEMENT, not position: hold still, however far out your hands are, and over about ten seconds the light drains out of the frame and leaves black. Move again and it comes straight back. Nothing here is on a timer; the picture is a direct read of whether anybody is actually playing.',
  interact: 'R = MORPH, and morph is harmony. Drawn in the rings are true circles; reach out and they grow lobes — three, four, five, six, seven — and lean off-axis, and each of those six shapes has its own chord, taken the moment the shape settles. So the right hand is a chord selector you can SEE: the picture tells you which harmony you are in before the ear does, and sweeping the hand walks Em7 → C/E → Em11 → Am11/E → E♭9 → E♭9♯11, from open to sour. L = INTENSITY. It steps the tunnel through a ladder of speeds — a band every two beats up to sixteenths — and opens everything else with it: brightness, the arpeggio, the octave sparkle, the kick. Left hand for how much is happening, right hand for what it is. Neither of them matters if you stop moving.',
  sound: 'Everything is gated on two things: the shape (R) and the energy (L). The arpeggio walks the chord ladder one band per crossing (MIDI role: arp), with the grid step taken straight from the ring rate so the note and the band arrive together and nothing has to be quantised after the fact. Underneath, a sawtooth pedal filtered by two formants driven directly off the raw hands (CC1/CC2), so even between notes a moving hand changes the vowel of the drone, and a tremolo on it runs at exactly the ring rate — the flicker you see is the flicker you hear. When the shape settles into a new morph the harmony JUMPS to that chord rather than waiting for the bar. Bells double the arpeggio an octave up once the tunnel is both fast and lobed; the kick only appears at the top of the intensity ladder. Let the hands go still and the whole rig ducks to a bare pedal as the picture fades. Ableton: arp ch4, texture ch6 = the vowel drone, pad ch2, bells ch5, perc ch10.',

  init(P) {
    P.state = {
      pres: 0, NR: 22, morph: 0, morphS: 0, lean: 0, leanS: 0, rate: 1, rateS: 1, rateIdx: 1,
      phase: 0, pulse: 0, spin: 0, wake: 0, act: 0, exc: new Float32Array(16),
      prevL: 0, prevR: 0, chordIdx: 0, candT: 0, cand: 0
    };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

    /* ---- IT ANSWERS MOVEMENT, NOT POSITION -----------------------------
       Speed of the hands, not their height, is what keeps the light on.
       Rises instantly, drains over about ten seconds of stillness.        */
    const vel = (Math.abs(inp.L - s.prevL) + Math.abs(inp.R - s.prevR)) / Math.max(dt, 1e-3);
    s.prevL = inp.L; s.prevR = inp.R;
    s.act += (vel - s.act) * Math.min(1, dt * 12);
    s.wake = Math.max(s.wake * Math.pow(0.5, dt / 3.4), Math.min(1, s.act * 2.6));

    // ---- L: intensity. A ladder of speeds, so crossings stay on the grid.
    const LAD = [0.5, 1, 2, 3, 4, 6];
    const want = clamp(inp.L) * (LAD.length - 0.001) | 0;
    if (want > s.rateIdx && inp.L > want / LAD.length + 0.03) s.rateIdx = want;
    else if (want < s.rateIdx && inp.L < (want + 1) / LAD.length - 0.03) s.rateIdx = want;
    s.rate = LAD[s.rateIdx];
    s.rateS += (s.rate - s.rateS) * Math.min(1, dt * 4);

    // ---- R: morph. Six shapes, and the shape IS the chord.
    const m = clamp(inp.R) * 5.999 | 0;
    if (m !== s.cand) { s.cand = m; s.candT = t; }
    if (m !== s.morph && t - s.candT > 0.22) s.morph = m;
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
    if (wake < 0.008) {
      g.fillStyle = 'rgba(235,199,154,0.35)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('· ASLEEP — MOVE A HAND ·', 10, h - 10);
      return;
    }
    const cx = w / 2 - s.leanS * w * 0.12;
    const cy = h / 2 + Math.sin(s.spin * 0.7) * h * 0.025;
    const maxR = Math.hypot(w, h) * 0.62;
    const NR = s.NR, bright = (0.45 + s.pres * 0.55) * wake;
    const SEG = P.focused ? 96 : 40;
    // the fig: amber and fig-flesh on the left, indigo and purple on the right,
    // pale tan through the middle
    // the fig, pushed up in luminance — these swatches are mid-tones on paper
    // and mud on a black field until you open them up
    const INK = [
      [255, 178, 68], [176, 74, 205], [255, 226, 186], [255, 96, 46], [122, 86, 190]
    ];
    const warm = 0.3 + clamp(inp.L) * 0.7, cool = 0.3 + clamp(inp.R) * 0.7;

    g.globalCompositeOperation = 'lighter';
    for (let k = NR - 1; k >= 0; k--) {
      const u = ((k + s.phase) % NR + NR) % NR / NR;
      const r0 = Math.pow(u, 1.5) * maxR;
      if (r0 < 2) continue;
      // DISSOLVING OUTWARD: a band spends its light as it travels
      const far = Math.pow(1 - Math.min(1, r0 / (maxR * 1.02)), 1.15);
      if (far < 0.012) continue;
      const near = 1 - Math.abs(u - 0.34) / 0.34;
      const flare = Math.max(0, near) * s.pulse;
      const tone = s.exc[(k * 3) % 16] || 0;
      const lobes = 2 + Math.round(s.morphS);
      const amp = r0 * (0.015 + s.warp * 0.15) * Math.pow(u, 0.7);
      const off = s.leanS * r0 * 0.45;
      const lw = Math.max(3 * ms, r0 * 0.05 + 3 * ms) * (1 + flare * 0.6 + tone * 0.4);
      const a = (0.5 + flare * 0.5 + tone * 0.35) * bright * far;
      const c0 = INK[k % 5], c1 = INK[(k + 2) % 5], c2 = INK[(k + 4) % 5];
      const gr = g.createLinearGradient(cx - maxR, 0, cx + maxR, 0);
      gr.addColorStop(0, `rgba(${c0[0]},${c0[1]},${c0[2]},${a * warm})`);
      gr.addColorStop(0.5, `rgba(${c1[0]},${c1[1]},${c1[2]},${a})`);
      gr.addColorStop(1, `rgba(${c2[0]},${c2[1]},${c2[2]},${a * cool})`);
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
    // the eye: a warm amber breath, never a white disc
    const rr = Math.pow(0.34, 1.5) * maxR;
    const eg = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 1.15);
    eg.addColorStop(0, `rgba(235,199,154,${(0.1 + s.pulse * 0.22) * bright})`);
    eg.addColorStop(0.5, `rgba(206,138,50,${(0.05 + s.pulse * 0.12) * bright})`);
    eg.addColorStop(1, 'rgba(196,69,31,0)');
    g.fillStyle = eg;
    g.beginPath(); g.arc(cx, cy, rr * 1.15, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(235,199,154,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const names = ['1 / 2 BEATS', '1 PER BEAT', '8ths', 'TRIPLETS', '16ths', 'SEXTUPLETS'];
    g.fillText('SHAPE ' + (2 + s.morph) + '-LOBE · ' + (H.label || '') +
      '   INTENSITY ' + names[s.rateIdx] +
      '   WAKE ' + Math.round(wake * 100) + (wake < 0.25 ? '  · FADING' : ''), 10, h - 10);
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
        // stillness ducks the whole rig back to a bare pedal
        const gate = (0.3 + s.pres * 0.7) * (0.22 + wake * 0.78);
        const L = inp ? inp.L : 0, R = inp ? inp.R : 0;

        /* ---- THE SHAPE IS THE CHORD: jump the moment it settles ------- */
        if (s.morph !== shape) {
          shape = s.morph;
          H.prog = [shape];
          H.step = 0;
          H.build();
          place(0.28);
          // push the timed change out of the way — the shape owns the harmony
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
          const vol = (0.03 + clamp(inp ? inp.L : 0) * 0.05) * gate * (s.rate > 3 ? 0.75 : 1);
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
