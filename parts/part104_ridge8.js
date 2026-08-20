/* ---------- SRC-42.8 · RIDGE LOOM V8 (the palette breathes between two states) ---------- */
reg({
  id: 'SRC-42.8', family: 'SRC-42', ver: 8, title: 'Ridge Loom V8', tech: 'CONTOUR HEAT / TWO PALETTES, 6S BREATH',
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
  tags: ['LEFT HAND = BASS', 'RIGHT HAND = LEADS', 'HEIGHT IS THE COLOUR', 'THE PALETTE BREATHES'],
  desc: 'V7 with the palette on a slow breath. Two colour states, six seconds apart, running back and forth forever. STATE ONE is the one you know: deep violet (#4900ff) on the low ground and outermost rings, climbing to hot orange (#f36c3b) at the summits. STATE TWO rolls the whole ramp forward — the orange that was on the summits becomes cyan (#00edff), and the violet that was on the floor becomes that orange. So the picture never sits still: over six seconds the low country warms from violet through magenta and red into orange while the peaks run up through gold and green into cyan, then it all comes back. The hues rotate rather than cross-fade — a straight blend from orange to cyan passes through dead grey, and this scene cannot afford a grey frame. Everything else is V7: one fine stroke, height picks the hue, proximity picks the burn, an empty frame stays dark.',
  interact: 'The two hands are two different musicians. L is the RHYTHM SECTION: its three cores are the bassline, and every one you surface makes that line busier and more melodic — one core is a root on the downbeat, two is a walking pair, three is a full syncopated figure whose notes are chosen by how many loops each core has closed. R is the FRONT LINE: its three cores are three different leads, arriving one at a time — first a long singing tone, then a running eighth-note arpeggio beside it, then a high answering bell on top. So the left hand decides how the floor moves and the right hand decides who is soloing over it, and both stay readable: count the whorls on a side and you know what that side is playing, and read the colour at the middle of a whorl to know how hard that hand is pushing. Bring both hands home and the frame cools back to a violet flow.',
  sound: 'Unchanged from V3 — this revision is colour and line weight only. Split down the middle by hand. LEFT = bass (MIDI role: bass): one core gives a root on the downbeat, a second adds the walking pair, a third opens a syncopated sixteenth figure — and the notes are taken from each left core\'s own loop count, so the bassline is literally written by the picture. RIGHT = leads (role: lead, plus bells): core one is a long bowed tone that re-sings whenever its loop count changes, core two is a running eighth arpeggio around its own loop count, core three is a sparse high bell answering off the beat. Every loop gained or lost is also an accent on its own side. When rings start enclosing more than one core the scene changes state: a bell and a sub bloom, and the lead voices converge toward one pitch, so a crowded frame resolves instead of clashing. Under it: a bowed loom bed whose brightness follows how much ridge is on screen, a quiet triangle glue pad, and a pedal on C♯ that never moves — no sawtooth, no horns. Ableton: bass ch3, lead ch1, bells ch5, pad ch2, texture ch6.',

  init(P) {
    const w = P.w, h = P.h;
    // P.focused is false during init — size off the area. Wall tiles get a
    // much coarser field; nobody counts ridges on a thumbnail.
    const fine = areaScale(P) > 1.6 ? 1 : 0.38;
    const CORES = [
      { hx: 0.13, hy: 0.30, side: 0, slot: 0, deg: 0 },
      { hx: 0.22, hy: 0.80, side: 0, slot: 1, deg: 2 },
      { hx: 0.40, hy: 0.22, side: 0, slot: 2, deg: 4 },
      { hx: 0.87, hy: 0.30, side: 1, slot: 0, deg: 1 },
      { hx: 0.78, hy: 0.80, side: 1, slot: 1, deg: 3 },
      { hx: 0.58, hy: 0.72, side: 1, slot: 2, deg: 5 }
    ];
    for (const c of CORES) {
      c.x = c.hx * w; c.y = c.hy * h; c.w = 0; c.loops = 0; c.ph = P.rand() * TAU;
    }
    // finer grid + a smoothing pass = ridges that curve instead of faceting
    const GX = Math.max(30, Math.round(112 * fine)), GY = Math.max(20, Math.round(70 * fine));
    const N = (GX + 1) * (GY + 1);
    const lo = -0.95, step = 0.42, NL = 26;
    P.state = {
      GX, GY, cores: CORES, pres: 0, ph: 0,
      f: new Float32Array(N), fs: new Float32Array(N),
      // how hard the nearest core owns each cell — V3's term, back again. This
      // is what fades the open country and burns the middle of a whorl.
      ownV: new Float32Array(N),
      sig: w * 0.075, lo, step, NL, wMax: 5,
      shared: 0, ridges: 0, live: 2, nL: 1, nR: 1, evq: [],
      waves: [
        { k: 3.1, a: 0.55, dir: 0.4, sp: 1 },
        { k: 5.3, a: 0.33, dir: 2.1, sp: -0.62 },
        { k: 8.7, a: 0.18, dir: 3.9, sp: 0.41 }
      ],
      // BUCKET = CONTOUR LEVEL × PROXIMITY TIER. The level picks the hue, the
      // tier picks how hard it burns. V3 folded both into one 19-bucket list
      // keyed on which core owned the ground; splitting them lets height and
      // intensity say different things.
      seg: [], NB: NL * 6,
      // V3's own thresholds on ownV, subdivided: V3 stepped the burn in three
      // jumps and hid the seams under a width change too, which this version
      // doesn't have — six finer steps keep the falloff from ringing.
      // The floor sits higher than V3's 0.4 because #4900ff is a far darker
      // colour than V3's grey-purple far field; the same alpha would sink it
      // below what the mesh can carry.
      // V5's spread was 1.9x floor-to-summit, which matched V3 but read flat.
      // 4.2x here: the open country has to be genuinely dark for a whorl to
      // land as a knot of light rather than just a warmer patch of weave.
      oTh: [0.12, 0.4, 0.9, 1.7, 2.8], tierA: [0.24, 0.34, 0.47, 0.64, 0.82, 1],
      // HOW FULL THE FRAME IS decides how much light it gets. Normalised by
      // grid size, not raw segment count — a wall tile marches a far coarser
      // field and would otherwise be pinned dark forever.
      dLo: 0.28, dSpan: 0.34, dFloor: 0.6, dens: 1,
      // The heat ramp. rSpan is chosen so a fully-extended core (w = wMax)
      // tops out at pure orange while the flowing background — which never
      // gets above the wave ceiling — stays down in the violets.
      rSpan: 5.65, lut: [], lutT: []
    };
    const s = P.state;
    // TWO PALETTE STATES, six seconds apart. Anchors are held in HSV because
    // the endpoints have to travel by ROTATING hue: orange and cyan sit nearly
    // opposite each other, so a straight blend collapses through #abb8b9 —
    // a grey frame, which this scene cannot afford. Both endpoints rotate the
    // same way (+119 deg on the floor, +168 on the peaks), so the whole ramp
    // sweeps together instead of pulling apart.
    //   state 1: floor #4900ff  ->  peaks #f36c3b
    //   state 2: floor #f36c3b  ->  peaks #00edff
    s.palLo = [[257.2, 1, 1], [16.0, 0.757, 0.953]];
    s.palHi = [[16.0, 0.757, 0.953], [184.2, 1, 1]];
    s.cyc = 6;            // seconds per crossing; a full there-and-back is 12
    s.mix = 0;
    s.curLo = [0x49, 0x00, 0xff];
    s.curHi = [0xf3, 0x6c, 0x3b];
    // HSV -> RGB, kept on state so step() can call it every frame
    s.h2r = (h, sa, v) => {
      h = ((h % 360) + 360) % 360;
      const c = v * sa, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
      return [((r + m) * 255) | 0, ((g + m) * 255) | 0, ((b + m) * 255) | 0];
    };
    // the ramp itself still blends in gamma space between whatever the two
    // endpoints currently are — that is what keeps the mid-ramp saturated
    s.ramp = u => {
      const t = clamp(u), A = s.curLo, B = s.curHi;
      return [
        Math.sqrt(A[0] * A[0] * (1 - t) + B[0] * B[0] * t) | 0,
        Math.sqrt(A[1] * A[1] * (1 - t) + B[1] * B[1] * t) | 0,
        Math.sqrt(A[2] * A[2] * (1 - t) + B[2] * B[2] * t) | 0
      ];
    };
    for (let k = 0; k < NL; k++) {
      const t = clamp(k * step / s.rSpan);
      s.lutT.push(t);
      s.lut.push(s.ramp(t));
    }
    for (let b = 0; b < s.NB; b++) s.seg.push([]);
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
    // ---- the palette breath: 6s across, 6s back, forever ------------------
    // wall-clock, not beats — a continuous drift is not an event, and the
    // design law only quantises events to the grid.
    const ph = (t % (s.cyc * 2)) / s.cyc;
    const tri = ph < 1 ? ph : 2 - ph;
    s.mix = tri * tri * (3 - 2 * tri);   // smoothstep: dwell at each state
    for (let e = 0; e < 2; e++) {
      const P0 = (e ? s.palHi : s.palLo)[0], P1 = (e ? s.palHi : s.palLo)[1];
      let dh = P1[0] - P0[0];
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;  // shortest arc
      const col = s.h2r(P0[0] + dh * s.mix,
                        P0[1] + (P1[1] - P0[1]) * s.mix,
                        P0[2] + (P1[2] - P0[2]) * s.mix);
      const dst = e ? s.curHi : s.curLo;
      dst[0] = col[0]; dst[1] = col[1]; dst[2] = col[2];
    }
    for (let k = 0; k < s.NL; k++) {
      const c = s.ramp(s.lutT[k]), d = s.lut[k];
      d[0] = c[0]; d[1] = c[1]; d[2] = c[2];
    }

    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.ph = beats * TAU;
    const sig2 = 2 * s.sig * s.sig;

    // ---- the field --------------------------------------------------------
    const GX = s.GX, GY = s.GY, f = s.f, fs = s.fs, ownV = s.ownV;
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
        let best = 0;
        for (let q = 0; q < 6; q++) {
          const c = C[q];
          if (c.w < 0.05) continue;
          const dx = x - c.x, dy = y - c.y;
          const e = c.w * Math.exp(-(dx * dx + dy * dy) / sig2);
          val += e;
          if (e > best) best = e;
        }
        const o = j * (GX + 1) + i;
        f[o] = val; ownV[o] = best;
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

    // ---- march it into ridges: level picks the hue, ownV picks the burn ----
    const seg = s.seg, lo = s.lo, st = s.step, NL = s.NL, oTh = s.oTh;
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
        const ov = ownV[o];
        const tier = ov > oTh[4] ? 5 : ov > oTh[3] ? 4 : ov > oTh[2] ? 3
          : ov > oTh[1] ? 2 : ov > oTh[0] ? 1 : 0;
        for (let k = k0; k <= k1; k++) {
          const lev = lo + k * st;
          const m = (a > lev ? 1 : 0) | (b > lev ? 2 : 0) | (c > lev ? 4 : 0) | (d > lev ? 8 : 0);
          if (m === 0 || m === 15) continue;
          const out = seg[k * 6 + tier];
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

    // ---- TOPOLOGY: whose loops are whose (untouched — this writes the music)
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
    // segments per grid cell — resolution-independent, so the tile and the
    // 1920x1200 focus land on the same fullness for the same gesture
    const dn = s.ridges / (GX * GY);
    const want = s.dFloor + (1 - s.dFloor) * clamp((dn - s.dLo) / s.dSpan);
    // ease it so the frame swells and sinks rather than flickering with the
    // per-frame segment count
    s.dens += (want - s.dens) * Math.min(1, dt * 2.2);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#08070b';
    g.fillRect(0, 0, w, h);
    // presence says "someone is here", fullness says "and this is how much
    // they have built" — an empty frame is dark even with hands on the sphere
    const bright = (0.5 + s.pres * 0.5) * s.dens;
    // ONE WEIGHT for every ridge. V4-V6 ran V3's thinnest stroke (0.8); this
    // is that pulled 30% finer again — 0.8 * 0.7. At 1920x1200 that lands
    // near 7.4px, just under the ~8px the scrim survey wants, so the mesh
    // is what decides whether this holds.
    const lw = Math.max(3.4 * ms, Math.min(w, h) * 0.011) * 0.56;

    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = lw;
    // low ground first so the summits paint over their own flanks
    for (let b = 0; b < s.NB; b++) {
      const sg = s.seg[b];
      if (!sg || !sg.length) continue;
      const k = (b / 6) | 0, c = s.lut[k];
      // Proximity carries the fade (V3's job); height only trims the last
      // sliver, so the summit tier lands on exactly #f36c3b. The alpha spread
      // is gentler than V3's because the hue ramp is already climbing hard in
      // luminance — violet is dark, orange is bright — and the two compound.
      const a = s.tierA[b % 6] * (0.88 + s.lutT[k] * 0.12) * bright;
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      g.beginPath();
      for (let i = 0; i < sg.length; i += 4) {
        g.moveTo(sg[i], sg[i + 1]);
        g.lineTo(sg[i + 2], sg[i + 3]);
      }
      g.stroke();
    }

    // the summit haze takes the colour of the height it has actually reached,
    // so a core visibly heats violet → orange as that hand reaches out
    g.globalCompositeOperation = 'lighter';
    for (const c of s.cores) {
      if (c.w < 0.6) continue;
      const col = s.ramp((c.w - s.lo) / s.rSpan);
      const R = s.sig * (0.5 + clamp(c.w / s.wMax) * 0.5);
      const gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
      gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.16 * clamp(c.w / s.wMax) * bright})`);
      gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(c.x, c.y, R, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(243,108,59,0.85)';
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

    // bass figures, indexed by how many left cores are up. 1 = downbeat root,
    // 2 = a walking pair, 3 = a syncopated sixteenth line. Values are which
    // left core supplies the note.
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

          // LEFT HAND — the floor. More cores up, busier line.
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
