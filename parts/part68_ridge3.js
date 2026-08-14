/* ---------- SRC-42.3 · RIDGE LOOM V3 (left hand plays bass, right hand plays lead) ---------- */
reg({
  id: 'SRC-42.3', family: 'SRC-42', ver: 3, title: 'Ridge Loom V3', tech: 'SIX CORES / BASS LEFT, LEADS RIGHT',
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
  tags: ['LEFT HAND = BASS', 'RIGHT HAND = LEADS', 'SIX CORES, SIX COLOURS', 'A LOOP IS A NOTE'],
  desc: 'A field of fat parallel ridges — fingerprint, leopard, chemical clock, all the same maths — flowing slowly across the frame. At rest there are two focal points under the fabric, one warm on the left and one cool on the right, and the ridges close into loops around them. Raise a hand and a SECOND focus surfaces on that side, then a THIRD, each arriving with its own colour bleeding out into the ridges around it, until the frame holds six centres and six colours: coral, pink, cream on the left, blue, cyan, indigo on the right. Ridges far from every core keep almost no colour, so the picture is a map of where the light is coming from.',
  interact: 'The two hands are two different musicians. L is the RHYTHM SECTION: its three warm cores are the bassline, and every one you surface makes that line busier and more melodic — one core is a root on the downbeat, two is a walking pair, three is a full syncopated figure whose notes are chosen by how many loops each core has closed. R is the FRONT LINE: its three cool cores are three different leads, and they arrive one at a time — first a long singing tone, then a running eighth-note arpeggio beside it, then a high answering bell on top. So the left hand decides how the floor moves and the right hand decides who is soloing over it, and both are readable in the picture: count the whorls on a side and you know what that side is playing. Bring both hands home and the frame drains back to two colours and a slow flow.',
  sound: 'Split down the middle by hand. LEFT = bass (MIDI role: bass): one core gives a root on the downbeat, a second adds the walking pair, a third opens a syncopated sixteenth figure — and the notes are taken from each warm core\'s own loop count, so the bassline is literally written by the picture. RIGHT = leads (role: lead, plus bells): core one is a long bowed tone that re-sings whenever its loop count changes, core two is a running eighth arpeggio around its own loop count, core three is a sparse high bell answering off the beat. Every loop gained or lost is also an accent on its own side. When rings start enclosing more than one core the scene changes state: a bell and a sub bloom, and the lead voices converge toward one pitch, so a crowded frame resolves instead of clashing. Under it: a bowed loom bed whose brightness follows how much ridge is on screen, a quiet triangle glue pad, and a pedal on C♯ that never moves — no sawtooth, no horns. Ableton: bass ch3, lead ch1, bells ch5, pad ch2, texture ch6.',

  init(P) {
    const w = P.w, h = P.h;
    // P.focused is false during init — size off the area. Wall tiles get a
    // much coarser field; nobody counts ridges on a thumbnail.
    const fine = areaScale(P) > 1.6 ? 1 : 0.38;
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
    // finer grid + a smoothing pass = ridges that curve instead of faceting
    const GX = Math.max(30, Math.round(112 * fine)), GY = Math.max(20, Math.round(70 * fine));
    const N = (GX + 1) * (GY + 1);
    P.state = {
      GX, GY, cores: CORES, pres: 0, ph: 0,
      f: new Float32Array(N), fs: new Float32Array(N),
      own: new Uint8Array(N), ownV: new Float32Array(N),
      sig: w * 0.075, lo: -0.95, step: 0.42, NL: 26, wMax: 5,
      shared: 0, ridges: 0, live: 2, nL: 1, nR: 1, evq: [],
      waves: [
        { k: 3.1, a: 0.55, dir: 0.4, sp: 1 },
        { k: 5.3, a: 0.33, dir: 2.1, sp: -0.62 },
        { k: 8.7, a: 0.18, dir: 3.9, sp: 0.41 }
      ],
      seg: [], NB: 19
    };
    for (let i = 0; i < 19; i++) P.state.seg.push([]);
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const HV = [clamp(inp.L), clamp(inp.R)];
    const TH = [[0, 0.28, 0.9], [0.32, 0.4, 0], [0.64, 0.36, 0]];
    let liveN = 0, nL = 0, nR = 0;
    for (const c of s.cores) {
      const x = HV[c.side];
      const th = TH[c.slot];
      const want = (c.slot === 0 ? clamp(th[1] + x * th[2]) : clamp((x - th[0]) / th[1])) * s.wMax;
      c.w += (want - c.w) * Math.min(1, dt * 4.5);
      c.ph += dt * 0.3;
      c.x = c.hx * w + Math.sin(c.ph) * w * 0.012;
      c.y = c.hy * h + Math.cos(c.ph * 0.8) * h * 0.02;
      if (c.w > 0.8) { liveN++; if (c.side) nR++; else nL++; }
    }
    s.live = liveN; s.nL = nL; s.nR = nR;
    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.ph = beats * TAU;
    const sig2 = 2 * s.sig * s.sig;

    // ---- the field, and who owns each part of it -----------------------
    const GX = s.GX, GY = s.GY, f = s.f, fs = s.fs, own = s.own, ownV = s.ownV;
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
    // one five-point smoothing pass — this is what takes the faceting off the
    // contours without paying for a finer grid everywhere
    const RW = GX + 1;
    for (let j = 0; j <= GY; j++) {
      for (let i = 0; i <= GX; i++) {
        const o = j * RW + i;
        const l = i > 0 ? f[o - 1] : f[o], r = i < GX ? f[o + 1] : f[o];
        const u = j > 0 ? f[o - RW] : f[o], d = j < GY ? f[o + RW] : f[o];
        fs[o] = f[o] * 0.44 + (l + r + u + d) * 0.14;
      }
    }

    // ---- march it into ridges -------------------------------------------
    const seg = s.seg, lo = s.lo, st = s.step, NL = s.NL;
    for (let k = 0; k < s.NB; k++) seg[k].length = 0;
    for (let j = 0; j < GY; j++) {
      for (let i = 0; i < GX; i++) {
        const o = j * RW + i;
        const a = fs[o], b = fs[o + 1], c = fs[o + RW + 1], d = fs[o + RW];
        let mn = a, mx = a;
        if (b < mn) mn = b; else if (b > mx) mx = b;
        if (c < mn) mn = c; else if (c > mx) mx = c;
        if (d < mn) mn = d; else if (d > mx) mx = d;
        let k0 = Math.ceil((mn - lo) / st), k1 = Math.floor((mx - lo) / st);
        if (k0 < 0) k0 = 0;
        if (k1 > NL - 1) k1 = NL - 1;
        if (k1 < k0) continue;
        const x0 = i * cw, y0 = j * ch;
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
    s.ridges = ridges >> 2;
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#0d0a12';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const lw = Math.max(3.4 * ms, Math.min(w, h) * 0.011);
    const BASE = [92, 74, 104];

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
    const BASSN = ['—', 'ROOT', 'WALKING', 'SYNCOPATED'];
    const LEADN = ['—', 'TONE', 'TONE+ARP', 'TONE+ARP+BELL'];
    g.fillText('BASS ' + BASSN[s.nL] + ' (' + s.nL + ')   LEAD ' + LEADN[s.nR] + ' (' + s.nR + ')' +
      '   LOOPS ' + s.cores.map(c => c.loops).join('/') + '   SHARED ' + s.shared +
      (s.pres < 0.3 ? '   · FLOWING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the loom: bowed air -------------------------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 800, 1.6), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- glue: triangle only. No sawtooth anywhere in this version ------ */
    const bed = A.padVoices(v, 3, { type: 'triangle', gain: 0.008, cutoff: 300, q: 0.6 });
    const place = glide => A.leadToChord(bed, -1, glide);
    place(0.05);
    H.onChord(() => place(0.2));
    v.fadeIn(1, 1.4);

    // THE PICTURE WRITES THE PARTS: a core's loop count is its note
    const warmTone = (i, oct) => H.chordTone(P.state.cores[i].deg + P.state.cores[i].loops, oct);
    const coolTone = (i, oct) => H.chordTone(P.state.cores[i].deg + P.state.cores[i].loops, oct);

    // bass figures, indexed by how many warm cores are up. 1 = downbeat root,
    // 2 = a walking pair, 3 = a syncopated sixteenth line. Values are which
    // warm core supplies the note.
    const BASS = [
      [],
      [[0, 0]],
      [[0, 0], [8, 1], [14, 0]],
      [[0, 0], [3, 2], [6, 1], [10, 0], [11, 2], [14, 1]]
    ];

    let nextT = T.next(0.25), lastLoops = [0, 0, 0, 0, 0, 0], arpI = 0;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const shared = s.shared || 0;
        const conv = clamp(shared / 5);

        A.set(ng.gain, (0.004 + clamp(s.ridges / 900) * 0.012) * gate, 0.3);
        A.set(nf.frequency, 400 + clamp(s.ridges / 900) * 2000, 0.3);
        bed.forEach(b => { b.level(0.006 + s.pres * 0.004, 0.5); b.bright(220 + clamp(s.ridges / 900) * 400, 0.4); });

        /* ---- the grid: bass on the left, leads on the right ----------- */
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 24) {
          const st = ((Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;

          // LEFT HAND — the floor. More warm cores, busier line.
          const fig = BASS[Math.min(3, s.nL)];
          for (const [step, coreI] of fig) {
            if (step !== st) continue;
            const c = s.cores[coreI];
            if (!c || c.w < 0.8) continue;
            const dur = s.nL > 2 ? 0.5 : s.nL > 1 ? 0.9 : 2.4;
            A.bassNote(warmTone(coreI, -1), { at: nextT, vol: (0.1 + clamp(c.w / 5) * 0.06) * gate, dur });
          }

          // RIGHT HAND — the front line. Each core is a different player.
          const c4 = s.cores[4];
          if (c4 && c4.w > 0.8 && st % 2 === 0) {
            // the running arpeggio, around its own loop count
            arpI++;
            const off = [0, 2, 4, 2, 5, 3][arpI % 6];
            A.pluck2(H.chordTone(c4.deg + c4.loops + off, 0), {
              at: nextT, vol: (0.03 + clamp(c4.w / 5) * 0.02) * gate,
              dur: 0.55, pan: 0.6, rev: 0.45, del: 0.2, role: 'lead'
            });
          }
          const c5 = s.cores[5];
          if (c5 && c5.w > 0.8 && (st === 6 || st === 13)) {
            // the high answer, off the beat and sparse
            A.bell(H.chordTone(c5.deg + c5.loops + 4, 1), {
              at: nextT, vol: 0.028 * gate, dur: 2.4, pan: 0.25, rev: 0.75
            });
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        /* ---- the long lead re-sings whenever its loops change ---------- */
        const c3 = s.cores[3];
        if (c3 && c3.w > 0.8 && c3.loops !== lastLoops[3]) {
          lastLoops[3] = c3.loops;
          const f = coolTone(3, 0);
          const at = T.next(0.5);
          A.tone(f * (1 - conv * 0.02), {
            at, vol: 0.06 * gate, dur: 3.4, attack: 0.5, type: 'triangle',
            pan: 0.5, rev: 0.6, del: 0.1, role: 'lead'
          });
          // the doubling is the same voice — it must not become its own note
          const sp = MOut.suspend; MOut.suspend = true;
          A.tone(f * 1.005, { at: at + 0.03, vol: 0.03 * gate, dur: 3, attack: 0.6, type: 'triangle', pan: 0.2, rev: 0.7 });
          MOut.suspend = sp;
        }

        /* ---- accents: a loop gained or lost, on its own side ----------- */
        let ev, k = 0;
        while ((ev = s.evq.shift()) && k < 4) {
          k++;
          const at = T.next(0.25);
          if (ev.core < 0) {
            // rings that enclose more than one core
            if (ev.up) {
              A.bell(H.chordTone(ev.n + 2, 1), { at, vol: 0.045 * gate, dur: 3.2, pan: 0, rev: 0.78 });
              A.bassNote(H.chordTone(0, -1), { at, vol: 0.07 * gate, dur: 2.2 });
            } else {
              A.pluck2(H.chordTone(ev.n, 0), { at, vol: 0.025 * gate, dur: 1.1, pan: 0, rev: 0.5, role: 'lead' });
            }
            continue;
          }
          const c = s.cores[ev.core];
          if (c.side === 0) {
            // the floor moved
            A.bassNote(warmTone(ev.core, -1), { at, vol: (ev.up ? 0.09 : 0.05) * gate, dur: ev.up ? 1.4 : 0.7 });
          } else if (ev.core !== 3) {
            A.pluck2(coolTone(ev.core, 0), {
              at, vol: (ev.up ? 0.045 : 0.026) * gate, dur: ev.up ? 1.1 : 0.6,
              pan: (c.hx * 2 - 1) * 0.8, rev: 0.5, del: 0.18, role: 'lead'
            });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('bass', clamp(s.nL / 3));
          MOut.expr('lead', clamp(s.nR / 3));
          MOut.expr('pad', clamp(s.ridges / 900));
        }
      },
      stop() { v.kill(); }
    };
  }
});
