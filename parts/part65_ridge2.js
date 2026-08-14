/* ---------- SRC-42.2 · RIDGE LOOM V2 (six focal points, six colours) ---------- */
reg({
  id: 'SRC-42.2', family: 'SRC-42', ver: 2, title: 'Ridge Loom V2', tech: 'SIX CORES / COLOUR OOZES OUT OF THEM',
  music: {
    bpm: 96, root: 49, mode: 'dorian', chordBars: 2,
    chords: [
      [0, 7, 15, 21, 26],   // C♯m13   — the dorian sixth
      [0, 5, 12, 17, 21],   // F♯/C♯
      [0, 7, 14, 19, 22],   // C♯m9
      [0, 10, 15, 19, 24]   // C♯m7
    ],
    chordNames: ['C♯m13', 'F♯/C♯', 'C♯m9', 'C♯m7']
  },
  fx: { bloom: 0.45 },
  tags: ['TWO CORES BECOME SIX', 'EACH CORE OOZES ITS OWN COLOUR', 'A LOOP IS A NOTE', 'CORAL / PINK / CREAM / BLUE'],
  desc: 'A field of fat parallel ridges — fingerprint, leopard, chemical clock, all the same maths — flowing slowly across the frame. At rest there are two focal points under the fabric, one warm on the left and one cool on the right, and the ridges close into loops around them. Raise a hand and a SECOND focus surfaces on that side, then a THIRD, each arriving with its own colour bleeding out into the ridges around it, until the frame holds six centres and six colours: coral, pink, cream on the left, blue, cyan, indigo on the right. Ridges far from every core keep almost no colour at all, so the picture is literally a map of where the light is coming from.',
  interact: 'L raises the warm side, R the cool side, and each hand does the same two things at once: it drives its cores harder and it brings out new ones. Drawn in, your side is one soft focus in one colour. A third of the way out a second core surfaces beside it; two thirds out a third arrives near the middle of the frame — and every core that appears takes ridges away from its neighbours and dyes them its own colour, so the frame gains structure and palette together. Every ridge that closes into a loop around a core is one note up that core\'s ladder, so the picture can be counted before it is heard, and when loops start enclosing more than one core at a time those voices converge onto a shared pitch. Bring both hands home and the frame drains back to two colours and a slow flow.',
  sound: 'Up to six bowed voices, one per focus, panned across the frame in the order they appear (MIDI role: pad). A voice\'s note is the number of loops closed around its own core — so raising a hand walks its voices up their ladders and lets go walks them back down, and the harmony is a direct read of the picture. Every loop gained or lost is a harp pluck on the next sixteenth (lead), panned to the core that gained it. When rings start enclosing more than one core the scene changes state: a bell and a sub bloom for each shared ring (bells + bass), and the voices involved converge toward one pitch, so a crowded frame resolves instead of clashing. Under it: a bowed loom bed whose brightness follows how many ridges are on screen, and a pedal on C♯ that never moves. Ableton: pad ch2 (CC74 = ridge count), lead ch1, bells ch5, bass ch3, texture ch6.',

  init(P) {
    const w = P.w, h = P.h;
    const fine = areaScale(P) > 1.6 ? 1 : 0.5;   // P.focused is false during init
    // three cores per side; the first of each is the one you always see
    // spread so that the ones that arrive last are not born on top of a
    // neighbour — two cores closer than about 2σ can never hold private loops
    const CORES = [
      { hx: 0.13, hy: 0.30, side: 0, slot: 0, col: [240, 112, 60], deg: 0 },   // coral
      { hx: 0.22, hy: 0.80, side: 0, slot: 1, col: [238, 159, 180], deg: 2 },  // pink
      { hx: 0.40, hy: 0.22, side: 0, slot: 2, col: [247, 201, 168], deg: 4 },  // cream
      { hx: 0.87, hy: 0.30, side: 1, slot: 0, col: [62, 111, 176], deg: 1 },   // blue
      { hx: 0.78, hy: 0.80, side: 1, slot: 1, col: [79, 168, 196], deg: 3 },   // cyan
      { hx: 0.58, hy: 0.72, side: 1, slot: 2, col: [110, 107, 192], deg: 5 }   // indigo
    ];
    for (const c of CORES) {
      c.x = c.hx * w; c.y = c.hy * h; c.w = 0; c.loops = 0; c.ph = P.rand() * TAU;
    }
    const GX = Math.max(24, Math.round(76 * fine)), GY = Math.max(16, Math.round(48 * fine));
    P.state = {
      GX, GY, cores: CORES, pres: 0, ph: 0,
      f: new Float32Array((GX + 1) * (GY + 1)),
      own: new Uint8Array((GX + 1) * (GY + 1)),
      ownV: new Float32Array((GX + 1) * (GY + 1)),
      // σ small enough that six cores keep their own whorls, and enough
      // levels that a pile-up in the middle still has ridges in it
      sig: w * 0.075, lo: -0.95, step: 0.42, NL: 26, wMax: 5,
      shared: 0, ridges: 0, live: 2, evq: [],
      waves: [
        { k: 3.1, a: 0.55, dir: 0.4, sp: 1 },
        { k: 5.3, a: 0.33, dir: 2.1, sp: -0.62 },
        { k: 8.7, a: 0.18, dir: 3.9, sp: 0.41 }
      ],
      // 6 cores × 3 colour tiers, plus one bucket for ridges nobody owns
      seg: [], NB: 19
    };
    for (let i = 0; i < 19; i++) P.state.seg.push([]);
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const HV = [clamp(inp.L), clamp(inp.R)];
    // slot 0 is always there; slots 1 and 2 surface as the hand climbs
    const TH = [[0, 0.28, 0.9], [0.32, 0.4, 0], [0.64, 0.36, 0]];
    let liveN = 0;
    for (const c of s.cores) {
      const x = HV[c.side];
      const th = TH[c.slot];
      const want = (c.slot === 0 ? clamp(th[1] + x * th[2]) : clamp((x - th[0]) / th[1])) * s.wMax;
      c.w += (want - c.w) * Math.min(1, dt * 4.5);
      c.ph += dt * 0.3;
      c.x = c.hx * w + Math.sin(c.ph) * w * 0.012;
      c.y = c.hy * h + Math.cos(c.ph * 0.8) * h * 0.02;
      if (c.w > 0.8) liveN++;
    }
    s.live = liveN;
    // THE FLOW IS ON THE GRID: one ridge-width per beat, always
    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.ph = beats * TAU;
    const sig2 = 2 * s.sig * s.sig;

    // ---- the field, and who owns each part of it -----------------------
    const GX = s.GX, GY = s.GY, f = s.f, own = s.own, ownV = s.ownV;
    const cw = w / GX, ch = h / GY, W = s.waves, C = s.cores;
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
        let best = 0, bi = 0;
        for (let q = 0; q < 6; q++) {
          const c = C[q];
          if (c.w < 0.05) continue;
          const dx = x - c.x, dy = y - c.y;
          const e = c.w * Math.exp(-(dx * dx + dy * dy) / sig2);
          val += e;
          if (e > best) { best = e; bi = q; }
        }
        const o = j * (GX + 1) + i;
        f[o] = val; own[o] = bi; ownV[o] = best;
      }
    }

    // ---- march it into ridges -------------------------------------------
    const seg = s.seg, lo = s.lo, st = s.step, NL = s.NL;
    for (let k = 0; k < s.NB; k++) seg[k].length = 0;
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
        // WHOSE COLOUR is this piece of ridge wearing, and how strongly
        const oi = own[o], ov = ownV[o];
        const tier = ov > 2.2 ? 2 : ov > 0.8 ? 1 : ov > 0.22 ? 0 : -1;
        const bucket = tier < 0 ? 18 : oi * 3 + tier;
        for (let k = k0; k <= k1; k++) {
          const lev = lo + k * st;
          const m = (a > lev ? 1 : 0) | (b > lev ? 2 : 0) | (c > lev ? 4 : 0) | (d > lev ? 8 : 0);
          if (m === 0 || m === 15) continue;
          const out = seg[bucket];
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

    // ---- TOPOLOGY: whose loops are whose --------------------------------
    // A level encloses one core alone only if it sits above every saddle
    // that core shares with a living neighbour.
    const waveCeil = 0.72;
    const cnt = (a, b) => Math.max(0, Math.min(s.NL,
      Math.floor((Math.min(b, lo + (s.NL - 1) * st) - lo) / st) - Math.floor((Math.max(a, waveCeil) - lo) / st)));
    let topSaddle = 0;
    for (let i = 0; i < 6; i++) {
      const ci = C[i];
      if (ci.w < 0.8) { if (ci.loops !== 0) { s.evq.push({ core: i, n: 0, up: false }); ci.loops = 0; } continue; }
      let sad = 0;
      for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        const cj = C[j];
        if (cj.w < 0.8) continue;
        const dx = cj.x - ci.x, dy = cj.y - ci.y;
        const v2 = (ci.w + cj.w) * Math.exp(-((dx * dx + dy * dy) / 4) / sig2);
        if (v2 > sad) sad = v2;
        if (v2 > topSaddle) topSaddle = v2;
      }
      const n = cnt(sad, ci.w);
      if (n !== ci.loops) { s.evq.push({ core: i, n, up: n > ci.loops }); ci.loops = n; }
    }
    const nB = cnt(waveCeil, topSaddle);
    if (nB !== s.shared) { s.evq.push({ core: -1, n: nB, up: nB > s.shared }); s.shared = nB; }
    if (s.evq.length > 14) s.evq.splice(0, s.evq.length - 14);
    let ridges = 0;
    for (let k = 0; k < s.NB; k++) ridges += seg[k].length;
    s.ridges = ridges >> 2;                       // how much ridge is on screen
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#0d0a12';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const lw = Math.max(3.4 * ms, Math.min(w, h) * 0.011);
    const BASE = [92, 74, 104];       // ridges nobody owns — a dim plum

    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let b = 18; b >= 0; b--) {
      const seg = s.seg[b];
      if (!seg || !seg.length) continue;
      let col, a, wid;
      if (b === 18) { col = BASE; a = 0.4 * bright; wid = lw * 0.8; }
      else {
        const c = s.cores[(b / 3) | 0], tier = b % 3;
        const mix = [0.34, 0.68, 1][tier];
        col = [
          BASE[0] + (c.col[0] - BASE[0]) * mix,
          BASE[1] + (c.col[1] - BASE[1]) * mix,
          BASE[2] + (c.col[2] - BASE[2]) * mix
        ];
        a = (0.45 + tier * 0.22) * bright;
        wid = lw * (0.85 + tier * 0.22);
      }
      g.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
      g.lineWidth = wid;
      g.beginPath();
      for (let i = 0; i < seg.length; i += 4) {
        g.moveTo(seg[i], seg[i + 1]);
        g.lineTo(seg[i + 2], seg[i + 3]);
      }
      g.stroke();
    }

    // the glow each living core throws into its own colour
    g.globalCompositeOperation = 'lighter';
    for (const c of s.cores) {
      if (c.w < 0.6) continue;
      const R = s.sig * (0.5 + clamp(c.w / s.wMax) * 0.5);
      const gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
      gr.addColorStop(0, `rgba(${c.col[0]},${c.col[1]},${c.col[2]},${0.16 * clamp(c.w / s.wMax) * bright})`);
      gr.addColorStop(1, `rgba(${c.col[0]},${c.col[1]},${c.col[2]},0)`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(c.x, c.y, R, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(247,201,168,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const loops = s.cores.map(c => c.loops).join('/');
    g.fillText('CORES ' + s.live + '/6   LOOPS ' + loops + '   SHARED ' + s.shared +
      '   RIDGES ' + s.ridges + (s.pres < 0.3 ? '   · FLOWING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the loom: bowed air -------------------------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 800, 1.6), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- one bowed voice per focus, panned where it sits ---------------- */
    const NC = 6;
    const voices = A.padVoices(v, NC, { type: 'sawtooth', gain: 0.0001, cutoff: 500, q: 2.2 });
    const pans = voices.map(() => (A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null));
    voices.forEach((vc, i) => {
      if (pans[i]) {
        try { vc.g.disconnect(v.group); } catch (e) {}
        vc.g.connect(pans[i]); pans[i].connect(v.group);
        pans[i].pan.value = (P.state.cores[i].hx * 2 - 1) * 0.75;
      }
    });

    const bed = A.padVoices(v, 2, { type: 'triangle', gain: 0.01, cutoff: 260, q: 0.6 });
    const place = glide => { bed[0].set(H.rootFreq(-2), glide); bed[1].set(H.chordTone(2, -1), glide); };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.4);

    // left cores speak low, right cores high; loops walk each one up its ladder
    const pitchOf = (i, loops) => {
      const c = P.state.cores[i];
      return H.chordTone(c.deg + loops, c.side ? 0 : -1);
    };
    const last = new Array(NC).fill(0);
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const shared = s.shared || 0;
        const conv = clamp(shared / 5);

        A.set(ng.gain, (0.004 + clamp(s.ridges / 16) * 0.012) * gate, 0.3);
        A.set(nf.frequency, 400 + clamp(s.ridges / 16) * 2200, 0.3);
        bed.forEach(b => { b.level(0.008 + s.pres * 0.005, 0.5); b.bright(200 + clamp(s.ridges / 16) * 400, 0.4); });

        /* ---- the voices ----------------------------------------------- */
        // where rings enclose more than one core, those voices are singing
        // the same ring — pull them toward one pitch
        let mean = 0, liveN = 0;
        const want = [];
        for (let i = 0; i < NC; i++) {
          const c = s.cores[i];
          const f = pitchOf(i, c.loops);
          want.push(f);
          if (c.w > 0.8) { mean += Math.log(f); liveN++; }
        }
        mean = liveN ? Math.exp(mean / liveN) : 0;
        for (let i = 0; i < NC; i++) {
          const c = s.cores[i];
          const on = c.w > 0.8;
          const f = liveN ? want[i] * (1 - conv) + mean * conv : want[i];
          if (on && Math.abs(f - last[i]) > 0.5) { last[i] = f; voices[i].set(f, 0.16); }
          voices[i].level(on ? clamp(c.w / 5) * 0.026 * gate : 0.0001, 0.35);
          voices[i].bright(240 + clamp(c.w / s.wMax) * 1300, 0.3);
          A.set(voices[i].o2.detune, (i % 2 ? 6 : -6) + (1 - conv) * 14, 0.3);
        }

        /* ---- a loop gained or lost is a pluck on the next sixteenth ---- */
        let ev, k = 0;
        while ((ev = s.evq.shift()) && k < 4) {
          k++;
          const at = T.next(0.25);
          if (ev.core < 0) {
            if (ev.up) {
              A.bell(H.chordTone(ev.n + 2, 1), { at, vol: 0.05 * gate, dur: 3.2, pan: 0, rev: 0.78 });
              A.bassNote(H.chordTone(0, -1), { at, vol: 0.065 * gate, dur: 2.2 });
            } else {
              A.pluck2(H.chordTone(ev.n, 0), { at, vol: 0.028 * gate, dur: 1.1, pan: 0, rev: 0.5 });
            }
          } else {
            const c = s.cores[ev.core];
            const f = pitchOf(ev.core, ev.n);
            A.pluck2(f * (c.side ? 1 : 2), {
              at, vol: (ev.up ? 0.055 : 0.03) * gate, dur: ev.up ? 1.3 : 0.7,
              pan: (c.hx * 2 - 1) * 0.8, rev: 0.5, del: 0.18
            });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', clamp(s.ridges / 16));
          MOut.expr('texture', clamp(s.live / 6));
          MOut.expr('lead', conv);
        }
      },
      stop() { v.kill(); }
    };
  }
});
