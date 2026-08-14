/* ---------- SRC-42 · RIDGE LOOM (two whorls, one seam) ---------- */
reg({
  id: 'SRC-42', family: 'SRC-42', ver: 1, title: 'Ridge Loom', tech: 'ISO-CONTOUR RIDGES / TOPOLOGY = PITCH',
  music: {
    bpm: 96, root: 49, mode: 'dorian', chordBars: 2,
    chords: [
      [0, 7, 15, 21, 26],   // C♯m13   — the dorian sixth, bright for a minor
      [0, 5, 12, 17, 21],   // F♯/C♯
      [0, 7, 14, 19, 22],   // C♯m9
      [0, 10, 15, 19, 24]   // C♯m7
    ],
    chordNames: ['C♯m13', 'F♯/C♯', 'C♯m9', 'C♯m7']
  },
  fx: { bloom: 0.5 },
  tags: ['FINGERPRINT RIDGES', 'A NEW LOOP IS A NEW NOTE', 'WHORLS THAT MERGE', 'ORANGE / CYAN'],
  desc: 'A field of fat parallel ridges — a fingerprint, a leopard, a chemical clock, all the same maths — flowing slowly across the frame. Two cores sit under the fabric, one under each hand. Push a core up and the ridges nearest it stop running with the field and close into loops around it, one loop at a time, and the loops it steals bend every other ridge in the picture. Push both cores up together and the two whorls stop being neighbours: their loops merge, one line at a time, into shared rings that go round the pair. That merge is the event the whole scene is for.',
  interact: 'L raises the warm core on the left, R the cool core on the right, and each new ridge that closes into a loop around a core is one note up its ladder — so the hands are two harps and you can count the notes on screen before you hear them. Raise one alone and you climb a line; raise both and the two whorls first fight over the ridges between them (the seam between them crackles and the two voices beat against each other) and then MERGE, their loops joining into shared rings that enclose the pair, with the two voices resolving onto one pitch as they do. Let a hand go and the loops peel off again, note by note, down the same ladder. The ridges never stop flowing, and they flow one ridge-width per beat, so the whole field breathes on the grid whether or not anyone is playing.',
  sound: 'Topology is pitch. Each hand holds a sustained bowed voice (MIDI role: pad) whose note is the number of loops closed around its core — warm hand low and left, cool hand high and right — so the picture and the interval are the same fact. Every loop gained or lost is a harp pluck on the next sixteenth (lead), panned to its side, rising as you push and falling as you let go. When loops start to enclose BOTH cores the scene changes state: a bell and a sub bloom mark each shared ring (bells + bass), the two voices converge toward a unison, and the beating between them — which is what the crackling seam sounds like — resolves. Under it all: a loom bed of bowed noise whose brightness is the number of ridges on screen, and a pedal that never moves. Ableton: pad ch2 (CC74 = total ridges), lead ch1, bells ch5, bass ch3, texture ch6.',

  init(P) {
    const S = Math.min(P.w, P.h);
    const fine = areaScale(P) > 1.6 ? 1 : 0.5;   // P.focused is false during init
    P.state = {
      GX: Math.max(24, Math.round(72 * fine)), GY: Math.max(16, Math.round(46 * fine)),
      f: null, pres: 0, wL: 0, wR: 0, ph: 0,
      sig: S * 0.23, lo: -0.95, step: 0.42, NL: 17, sigK: 0.3,
      onlyL: 0, onlyR: 0, both: 0, ridges: 0, seam: 0,
      evq: [], waves: [
        { k: 3.1, a: 0.55, dir: 0.4, sp: 1 },
        { k: 5.3, a: 0.33, dir: 2.1, sp: -0.62 },
        { k: 8.7, a: 0.18, dir: 3.9, sp: 0.41 }
      ]
    };
    P.state.f = new Float32Array((P.state.GX + 1) * (P.state.GY + 1));
    P.state.segs = [];
    for (let i = 0; i < P.state.NL; i++) P.state.segs.push([]);
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.wL += (clamp(inp.L) * 6.2 - s.wL) * Math.min(1, dt * 6);
    s.wR += (clamp(inp.R) * 6.2 - s.wR) * Math.min(1, dt * 6);
    // THE FLOW IS ON THE GRID: one ridge-width per beat, always
    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.ph = beats * TAU;

    const cxL = w * 0.29, cyL = h * (0.5 + Math.sin(t * 0.21) * 0.05);
    const cxR = w * 0.71, cyR = h * (0.5 + Math.sin(t * 0.17 + 2) * 0.05);
    s.cL = [cxL, cyL]; s.cR = [cxR, cyR];
    // the reach of a core is set by how far apart the two cores are: any other
    // choice and the pair either never shares a ridge or shares all of them
    s.sig = s.sigK * Math.hypot(cxR - cxL, cyR - cyL);
    const sig2 = 2 * s.sig * s.sig;

    // ---- the field ----------------------------------------------------
    const GX = s.GX, GY = s.GY, f = s.f;
    const cw = w / GX, ch = h / GY;
    const W = s.waves;
    for (let j = 0; j <= GY; j++) {
      const y = j * ch;
      for (let i = 0; i <= GX; i++) {
        const x = i * cw;
        let val = 0;
        for (let q = 0; q < W.length; q++) {
          const wv = W[q];
          const u = (x * Math.cos(wv.dir) + y * Math.sin(wv.dir)) / Math.max(w, h);
          val += wv.a * Math.sin(u * wv.k * TAU + s.ph * wv.sp * 0.25 + q);
        }
        const dxl = x - cxL, dyl = y - cyL, dxr = x - cxR, dyr = y - cyR;
        val += s.wL * Math.exp(-(dxl * dxl + dyl * dyl) / sig2);
        val += s.wR * Math.exp(-(dxr * dxr + dyr * dyr) / sig2);
        f[j * (GX + 1) + i] = val;
      }
    }

    // ---- march it into ridges -----------------------------------------
    const segs = s.segs, lo = s.lo, st = s.step, NL = s.NL;
    for (let k = 0; k < NL; k++) segs[k].length = 0;
    for (let j = 0; j < GY; j++) {
      for (let i = 0; i < GX; i++) {
        const o = j * (GX + 1) + i;
        const a = f[o], b = f[o + 1], c = f[o + GX + 2], d = f[o + GX + 1];
        let mn = a, mx = a;
        if (b < mn) mn = b; else if (b > mx) mx = b;
        if (c < mn) mn = c; else if (c > mx) mx = c;
        if (d < mn) mn = d; else if (d > mx) mx = d;
        let k0 = Math.ceil((mn - lo) / st), k1 = Math.floor((mx - lo) / st);
        if (k0 < 0) k0 = 0;
        if (k1 > NL - 1) k1 = NL - 1;
        if (k1 < k0) continue;
        const x0 = i * cw, y0 = j * ch;
        for (let k = k0; k <= k1; k++) {
          const lev = lo + k * st;
          const m = (a > lev ? 1 : 0) | (b > lev ? 2 : 0) | (c > lev ? 4 : 0) | (d > lev ? 8 : 0);
          if (m === 0 || m === 15) continue;
          const out = segs[k];
          // edge crossings: A top · B right · C bottom · D left
          const ax = x0 + cw * (lev - a) / (b - a), ay = y0;
          const bx = x0 + cw, by = y0 + ch * (lev - b) / (c - b);
          const cx2 = x0 + cw * (lev - d) / (c - d), cy2 = y0 + ch;
          const dx2 = x0, dy2 = y0 + ch * (lev - a) / (d - a);
          switch (m) {
            case 1: case 14: out.push(dx2, dy2, ax, ay); break;
            case 2: case 13: out.push(ax, ay, bx, by); break;
            case 3: case 12: out.push(dx2, dy2, bx, by); break;
            case 4: case 11: out.push(bx, by, cx2, cy2); break;
            case 6: case 9: out.push(ax, ay, cx2, cy2); break;
            case 7: case 8: out.push(dx2, dy2, cx2, cy2); break;
            case 5: out.push(dx2, dy2, ax, ay, bx, by, cx2, cy2); break;
            case 10: out.push(ax, ay, bx, by, cx2, cy2, dx2, dy2); break;
          }
        }
      }
    }

    // ---- TOPOLOGY: how many loops belong to whom -----------------------
    // The saddle between the two cores decides it: a level below the saddle
    // encloses BOTH cores, a level above it belongs to one core alone.
    const dxc = cxR - cxL, dyc = cyR - cyL, d2 = dxc * dxc + dyc * dyc;
    const mid = (s.wL + s.wR) * Math.exp(-(d2 / 4) / sig2);
    const waveCeil = 0.72;
    const cnt = (a, b) => Math.max(0, Math.floor((b - lo) / st) - Math.floor((Math.max(a, waveCeil) - lo) / st));
    const nL = cnt(mid, s.wL), nR = cnt(mid, s.wR), nB = cnt(waveCeil, Math.min(mid, Math.min(s.wL, s.wR)));
    if (nL !== s.onlyL) { s.evq.push({ side: 'L', n: nL, up: nL > s.onlyL }); s.onlyL = nL; }
    if (nR !== s.onlyR) { s.evq.push({ side: 'R', n: nR, up: nR > s.onlyR }); s.onlyR = nR; }
    if (nB !== s.both) { s.evq.push({ side: 'B', n: nB, up: nB > s.both }); s.both = nB; }
    if (s.evq.length > 12) s.evq.splice(0, s.evq.length - 12);
    let ridges = 0;
    for (let k = 0; k < NL; k++) ridges += segs[k].length > 0 ? 1 : 0;
    s.ridges = ridges;
    // the seam: how hard the two whorls are fighting over the ridges between
    s.seam = clamp(Math.min(s.wL, s.wR) / 4.5) * (1 - clamp(s.both / 5));
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#03060a';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const lw = Math.max(3.4 * ms, Math.min(w, h) * 0.011);

    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let k = 0; k < s.NL; k++) {
      const seg = s.segs[k];
      if (!seg.length) continue;
      const lev = s.lo + k * s.step;
      // levels that have climbed above the seam belong to a core — they get
      // that core's colour and burn brighter
      const own = clamp((lev - 0.72) / 1.4);
      const gr = g.createLinearGradient(0, 0, w, 0);
      const a = (0.5 + own * 0.4) * bright;
      gr.addColorStop(0, `rgba(255,${118 - own * 40},${34},${a})`);
      gr.addColorStop(0.44, `rgba(255,${168 - own * 30},70,${a * 0.95})`);
      gr.addColorStop(0.62, `rgba(80,${210 + own * 20},${230},${a * 0.95})`);
      gr.addColorStop(1, `rgba(38,${168 + own * 40},255,${a})`);
      g.strokeStyle = gr;
      g.lineWidth = lw * (0.8 + own * 0.5);
      g.beginPath();
      for (let i = 0; i < seg.length; i += 4) {
        g.moveTo(seg[i], seg[i + 1]);
        g.lineTo(seg[i + 2], seg[i + 3]);
      }
      g.stroke();
    }

    // the seam between the whorls, while they are still fighting over it
    if (s.seam > 0.05 && s.cL && s.cR) {
      const mx = (s.cL[0] + s.cR[0]) / 2, my = (s.cL[1] + s.cR[1]) / 2;
      const R = Math.min(w, h) * 0.2 * s.seam;
      g.globalCompositeOperation = 'lighter';
      const sg = g.createRadialGradient(mx, my, 0, mx, my, R);
      sg.addColorStop(0, `rgba(255,255,240,${s.seam * 0.3 * bright})`);
      sg.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(mx, my, R, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
    }

    g.fillStyle = 'rgba(255,190,120,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('LOOPS L ' + s.onlyL + '   R ' + s.onlyR + '   SHARED ' + s.both +
      '   RIDGES ' + s.ridges + (s.both > 0 ? '   · MERGED' : s.seam > 0.4 ? '   · SEAM' : '') +
      (s.pres < 0.3 ? '   · FLOWING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the loom: bowed air -------------------------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 800, 1.6), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- one bowed voice per hand, panned to its side ------------------- */
    const hands = A.padVoices(v, 2, { type: 'sawtooth', gain: 0.0001, cutoff: 500, q: 2.2 });
    const pans = hands.map(() => (A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null));
    hands.forEach((vc, i) => {
      if (pans[i]) { try { vc.g.disconnect(v.group); } catch (e) {} vc.g.connect(pans[i]); pans[i].connect(v.group); }
      if (pans[i]) pans[i].pan.value = i ? 0.6 : -0.6;
    });

    /* --- the pedal ------------------------------------------------------ */
    const bed = A.padVoices(v, 2, { type: 'triangle', gain: 0.01, cutoff: 260, q: 0.6 });
    const place = glide => { bed[0].set(H.rootFreq(-2), glide); bed[1].set(H.chordTone(2, -1), glide); };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.4);

    const pitchL = n2 => H.chordTone(n2, -1);
    const pitchR = n2 => H.chordTone(n2 + 3, 0);
    let lf = 0, rf = 0;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const both = s.both || 0;

        A.set(ng.gain, (0.004 + clamp(s.ridges / 14) * 0.012 + s.seam * 0.01) * gate, 0.3);
        A.set(nf.frequency, 400 + clamp(s.ridges / 14) * 2200 + s.seam * 900, 0.3);
        bed.forEach(b => { b.level(0.008 + s.pres * 0.005, 0.5); b.bright(200 + clamp(s.ridges / 14) * 400, 0.4); });

        /* ---- the two bowed voices ------------------------------------ */
        // once loops are shared, the two hands are singing the same ring:
        // the voices converge, and the beating between them stops
        const conv = clamp(both / 4);
        const fL = pitchL(s.onlyL || 0), fR = pitchR(s.onlyR || 0);
        const tL = fL * (1 - conv) + Math.sqrt(fL * fR) * conv;
        const tR = fR * (1 - conv) + Math.sqrt(fL * fR) * conv;
        if (tL !== lf) { lf = tL; hands[0].set(tL, 0.14); }
        if (tR !== rf) { rf = tR; hands[1].set(tR, 0.14); }
        hands[0].level(clamp(s.wL / 5) * 0.03 * gate, 0.3);
        hands[1].level(clamp(s.wR / 5) * 0.03 * gate, 0.3);
        hands[0].bright(260 + clamp(s.wL / 6) * 1100, 0.3);
        hands[1].bright(320 + clamp(s.wR / 6) * 1500, 0.3);
        // the seam IS the beating: detune the two voices apart while they fight
        A.set(hands[0].o2.detune, 5 + s.seam * 26, 0.3);
        A.set(hands[1].o2.detune, -5 - s.seam * 26, 0.3);

        /* ---- a loop gained or lost is a pluck on the next sixteenth --- */
        let ev, i = 0;
        while ((ev = s.evq.shift()) && i < 4) {
          i++;
          const at = T.next(0.25);
          if (ev.side === 'B') {
            // THE MERGE: a ring that goes round both cores
            if (ev.up) {
              A.bell(H.chordTone(ev.n + 2, 1), { at, vol: 0.055 * gate, dur: 3.2, pan: 0, rev: 0.78 });
              A.bassNote(H.chordTone(0, -1), { at, vol: 0.07 * gate, dur: 2.2 });
            } else {
              A.pluck2(H.chordTone(ev.n, 0), { at, vol: 0.03 * gate, dur: 1.1, pan: 0, rev: 0.5 });
            }
          } else {
            const left = ev.side === 'L';
            const f = left ? pitchL(ev.n) : pitchR(ev.n);
            A.pluck2(f * (left ? 2 : 1), {
              at, vol: (ev.up ? 0.06 : 0.032) * gate, dur: ev.up ? 1.3 : 0.7,
              pan: left ? -0.7 : 0.7, rev: 0.5, del: 0.18
            });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', clamp(s.ridges / 14));
          MOut.expr('texture', s.seam);
          MOut.expr('lead', clamp((s.onlyL + s.onlyR) / 8));
        }
      },
      stop() { v.kill(); }
    };
  }
});
