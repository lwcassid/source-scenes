/* ---------- SRC-37 · IRIS ENGINE (the rings are the sequencer) ---------- */
reg({
  id: 'SRC-37', family: 'SRC-37', ver: 1, title: 'Iris Engine', tech: 'RING TUNNEL / OPTICAL SEQUENCER',
  music: {
    bpm: 112, root: 40, mode: 'phrygian', chordBars: 4,
    // PEDAL ON E, phrygian colour. Four bars each — the tunnel is hypnotic,
    // the harmony should move like weather, not like a chord chart.
    chords: [
      [0, 7, 15, 19, 22],   // Em7
      [0, 8, 15, 20, 24],   // C/E      — the light lets in
      [0, 7, 14, 17, 22],   // Em11
      [0, 1, 8, 13, 20]     // E♭9      — phrygian bite, the tunnel narrows
    ],
    chordNames: ['Em7', 'C/E', 'Em11', 'E♭9 phryg']
  },
  fx: { bloom: 0.62 },
  tags: ['CONCENTRIC TUNNEL', 'RINGS ARE THE CLOCK', 'LOBES ARE THE INTERVAL', 'RINGS FLARE AT WHAT THEY HEAR'],
  desc: 'A tunnel of fat concentric bands boiling out of a single eye. The bands are not decoration — they are the machine. Each one that crosses the reading circle plays a note, so what you are watching IS the sequence: count the rings and you have counted the beat. The bands are locked to the transport, so the tunnel can never drift out of time with the room, and each band is tuned to one tone of the chord — when anything else on the wall rings that tone, that band flares on its own.',
  interact: 'R = SPEED. It steps through a ladder of subdivisions — a ring every two beats, every beat, every half, every third, every sixteenth — so the tunnel visibly changes gear and the pulse changes with it, always on the grid. Reach out and the tunnel accelerates into a strobing drill; draw in and it becomes a single slow eye opening once every two bars. L = SHAPE, and shape is pitch: at rest the rings are perfect circles and the engine repeats one note; reach out and the rings grow lobes — three, five, seven — and the sequence leaps by exactly that many chord tones per ring. The picture tells you the interval before you hear it. L also leans the whole tunnel off-axis, so the eye slides away from the middle of the frame and the outer bands go lopsided.',
  sound: 'An optical sequencer over a two-vowel drone. Each ring crossing fires a short reed tone (MIDI role: arp) whose pitch walks the chord ladder by the lobe count — so L is the interval and R is the rhythm, and both are visible before they are audible. Underneath, a sustained saw pedal on the root is filtered by TWO formants driven directly by the raw hand positions (CC1 and CC2): even between notes, moving a hand audibly changes the vowel of the drone. A tremolo on that drone runs at exactly the ring rate, so the flicker you see is the flicker you hear. Bells double the crossing an octave up once the tunnel is fast and wide; a kick lands on the downbeat only when the engine is genuinely spun up. Ableton: arp ch4, pad ch2, texture ch6 = the vowel drone (CC74 = speed), bells ch5, perc ch10.',

  init(P) {
    P.state = {
      pres: 0, NR: 22, gear: 1, gearS: 1, rate: 1, rateS: 1, rateIdx: 2,
      lean: 0, leanS: 0, phase: 0, pulse: 0, warp: 0,
      exc: new Float32Array(16), spin: 0, idx: 0
    };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

    // ---- R: the gearbox. Speed is quantised so crossings can never fall
    // off the grid — the tunnel changes gear the way a drummer does.
    const LAD = [0.5, 1, 2, 3, 4, 6];          // rings per beat
    const want = clamp(inp.R) * (LAD.length - 0.001) | 0;
    // schmitt: needs a real move to change gear, so it never chatters
    if (want > s.rateIdx && inp.R > (want / LAD.length) + 0.03) s.rateIdx = want;
    else if (want < s.rateIdx && inp.R < ((want + 1) / LAD.length) - 0.03) s.rateIdx = want;
    s.rate = LAD[s.rateIdx];
    s.rateS += (s.rate - s.rateS) * Math.min(1, dt * 4);

    // ---- L: lobes. The shape IS the interval.
    s.gear = 1 + Math.round(clamp(inp.L) * 6);
    s.gearS += (s.gear - s.gearS) * Math.min(1, dt * 6);
    s.warp += (clamp(inp.L) - s.warp) * Math.min(1, dt * 6);
    s.lean = clamp(inp.L) * 0.34;
    s.leanS += (s.lean - s.leanS) * Math.min(1, dt * 4);

    // ---- the tunnel runs off the TRANSPORT, not off wall-clock time, so
    // what you see is exactly what the sequencer is doing.
    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.phase = beats * s.rate;
    const fr = s.phase - Math.floor(s.phase);
    s.pulse = Math.pow(1 - fr, 2.6);          // the flash that rides every crossing
    s.spin += dt * (0.06 + s.warp * 0.22);

    // ---- each band is tuned to a chord tone; the SOUNDING BUS makes it
    // answer anything on the wall that agrees with it.
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
    g.fillStyle = '#040308';
    g.fillRect(0, 0, w, h);
    const cx = w / 2 - s.leanS * w * 0.13;
    const cy = h / 2 + Math.sin(s.spin * 0.7) * h * 0.03;
    const maxR = Math.hypot(w, h) * 0.62;
    const NR = s.NR, bright = 0.45 + s.pres * 0.55;
    const SEG = P.focused ? 96 : 40;

    // the two hands own the two sides of the frame: warm country on the left,
    // violet on the right, and the bands are painted across both.
    const warm = 0.25 + clamp(inp.L) * 0.75, cool = 0.25 + clamp(inp.R) * 0.75;

    g.globalCompositeOperation = 'lighter';
    for (let k = NR - 1; k >= 0; k--) {
      const u = ((k + s.phase) % NR + NR) % NR / NR;
      const r0 = Math.pow(u, 1.75) * maxR;
      if (r0 < 2) continue;
      const near = 1 - Math.abs(u - 0.34) / 0.34;               // close to the reading circle
      const flare = Math.max(0, near) * s.pulse;
      const tone = s.exc[(k * 3) % 16] || 0;                     // what this band can hear
      const lobes = 2 + Math.round(s.gearS);
      const amp = r0 * (0.02 + s.warp * 0.16) * Math.pow(u, 0.7);
      const off = s.leanS * r0 * 0.5;
      const lw = Math.max(3 * ms, r0 * 0.055 + 3 * ms) * (1 + flare * 0.7 + tone * 0.5);

      // three inks, the way the reference prints: cream, teal, magenta
      const band = k % 3;
      const gr = g.createLinearGradient(cx - maxR, 0, cx + maxR, 0);
      const a = (0.3 + flare * 0.55 + tone * 0.4) * bright;
      if (band === 0) {
        gr.addColorStop(0, `rgba(255,150,60,${a * warm})`);
        gr.addColorStop(0.5, `rgba(255,238,208,${a})`);
        gr.addColorStop(1, `rgba(196,120,255,${a * cool})`);
      } else if (band === 1) {
        gr.addColorStop(0, `rgba(255,110,40,${a * 0.7 * warm})`);
        gr.addColorStop(0.5, `rgba(48,232,214,${a})`);
        gr.addColorStop(1, `rgba(150,110,255,${a * cool})`);
      } else {
        gr.addColorStop(0, `rgba(255,90,42,${a * warm})`);
        gr.addColorStop(0.5, `rgba(255,79,154,${a})`);
        gr.addColorStop(1, `rgba(178,86,255,${a * cool})`);
      }
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

    // the reading circle — where a band becomes a note
    const rr = Math.pow(0.34, 1.75) * maxR;
    g.strokeStyle = `rgba(255,255,255,${(0.1 + s.pulse * 0.35) * bright})`;
    g.lineWidth = 1.6 * ms;
    g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.stroke();
    // the eye
    const eg = g.createRadialGradient(cx, cy, 0, cx, cy, rr * 0.9);
    eg.addColorStop(0, `rgba(255,246,236,${(0.28 + s.pulse * 0.5) * bright})`);
    eg.addColorStop(1, 'rgba(255,120,180,0)');
    g.fillStyle = eg;
    g.beginPath(); g.arc(cx, cy, rr * 0.9, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(120,240,225,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const names = ['1/2 BEAT', '1 PER BEAT', '8ths', 'TRIPLETS', '16ths', 'SEXTUPLETS'];
    g.fillText('SPEED ' + names[s.rateIdx] + '   LOBES ' + (2 + s.gear) + '   STEP +' + s.gear +
      '   LEAN ' + Math.round(s.leanS * 100) + (s.pres < 0.3 ? '   · IDLING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- THE VOWEL DRONE: the hands are two formants -------------------
       This is the layer that answers CC1/CC2 with no notes involved — move
       a hand between crossings and the drone still changes colour.        */
    const o1 = v.osc('sawtooth', 82), o2 = v.osc('sawtooth', 82);
    o2.detune.value = 7;
    const fA = v.filter('bandpass', 500, 4.5), fB = v.filter('bandpass', 1400, 5.5);
    const gA = v.g(0.03), gB = v.g(0.02);
    const trem = v.g(1);                      // ring-rate tremolo on the whole drone
    const lfo = v.osc('sine', 2), lfoG = v.g(0.35);
    lfo.connect(lfoG); lfoG.connect(trem.gain);
    o1.connect(fA); o2.connect(fA); o1.connect(fB); o2.connect(fB);
    fA.connect(gA); fB.connect(gB);
    gA.connect(trem); gB.connect(trem); trem.connect(v.group);
    if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.4; trem.connect(sd); sd.connect(AE.revIn); }

    /* --- the pedal underneath ------------------------------------------ */
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

    let nextT = T.next(1), idx = 0, bar = -1;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.3 + s.pres * 0.7;
        const L = inp ? inp.L : 0, R = inp ? inp.R : 0;

        // the vowels: straight off the raw hands, no quantising, no waiting
        A.set(fA.frequency, 220 + L * 1500, 0.05);
        A.set(fB.frequency, 700 + R * 3400, 0.05);
        A.set(gA.gain, (0.02 + L * 0.03) * gate, 0.15);
        A.set(gB.gain, (0.012 + R * 0.026) * gate, 0.15);
        A.set(lfo.frequency, Math.max(0.2, s.rateS / Math.max(T.beat, 0.05)), 0.2);
        A.set(lfoG.gain, 0.2 + clamp(s.rateS / 6) * 0.5, 0.3);
        bed.forEach(b => { b.level(0.008 + s.pres * 0.006, 0.5); b.bright(260 + R * 500, 0.4); });

        /* ---- crossings. The grid step IS the ring rate, so the note and
           the band arrive together and nothing has to be quantised after
           the fact.                                                       */
        const stepBeats = 1 / s.rate;
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 24) {
          idx += s.gear;
          const i = ((idx % 13) + 13) % 13;
          const spread = clamp(s.warp);
          const f = H.chordTone(i, 0);
          const vol = (0.055 + spread * 0.05) * gate * (s.rate > 3 ? 0.75 : 1);
          const pan = Math.sin(idx * 1.7) * 0.5;
          A.pluck2(f, { at: nextT, vol, dur: Math.min(1.1, stepBeats * T.beat * 1.8), pan, rev: 0.4, del: 0.2, role: 'arp' });
          // wide + fast earns the octave sparkle
          if (spread > 0.45 && s.rate >= 2 && (idx % 4) === 0) {
            A.bell(H.chordTone(i + 3, 1), { at: nextT, vol: vol * 0.5, dur: 1.6, pan: -pan, rev: 0.66 });
          }
          nextT += T.beat * stepBeats;
        }
        if (nextT < now) nextT = T.next(1);

        // the engine only gets a kick once it is genuinely spun up
        if (T.running && s.rate >= 3 && s.pres > 0.3) {
          const b = T.bar();
          if (b !== bar) { bar = b; A.kick(T.next(4), 0.2 + clamp(s.warp) * 0.1); }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('arp', clamp(s.warp));
          MOut.expr('texture', clamp(s.rateS / 6));
          MOut.expr('pad', s.pres);
        }
      },
      stop() { v.kill(); }
    };
  }
});
