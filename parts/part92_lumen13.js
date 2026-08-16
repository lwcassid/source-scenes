/* ---------- SRC-38.13 · LUMEN FIELD (one big beam per stone) ---------- */
reg({
  id: 'SRC-38.13', family: 'SRC-38', ver: 13, title: 'Lumen Film', tech: 'GEM FILM / APERTURE ORGAN',
  music: {
    bpm: 66, root: 50, mode: 'dorian', chordBars: 4,
    // PEDAL ON D. The film gets lighter as the progression walks — Dm9 is the
    // closed frame, D6/9 is the frame full of holes.
    chords: [
      [0, 7, 15, 19, 26],   // Dm9
      [0, 5, 12, 17, 22],   // Gsus/D
      [0, 8, 15, 20, 24],   // B♭/D
      [0, 9, 14, 16, 21]    // D6/9    — the light gets through
    ],
    chordNames: ['Dm9', 'Gsus/D', 'B♭/D', 'D6/9']
  },
  fx: { bloom: 0.46 },
  tags: ['ONE BEAM PER STONE', 'BIG SOFT RAYS', 'SPLIT-CHANNEL EDGES', 'L TURNS THE GRADIENTS TOO'],
  desc: 'V13: the overlay blending at the crossings is gone — the stone colour is back to what it was. The light is rarer and far larger: at most ONE burst per stone, and only some stones get one at all, chosen at random, each at its own random size. The rays off them are about ten times the width they were and much longer, falling away to nothing well before their tip, with the three colour channels still drawn separately and slightly out of register so the wide edges carry red down one side and blue down the other. And the left hand now does two things at once: it turns the whole field as before, and it also drags the gradients inside each stone round by a fraction of that, so the colour slides across the facets as you turn rather than riding along rigidly with them.',
  interact: 'R = LIGHT PRESSURE, unchanged — the lamp behind the sheet. Draw in and the film is closed, a dark faceted field and nothing else. Reach out and the bursts light one at a time, scattered anywhere in the frame, each on its own clock, each adding its held note to the chord. A burst always tells you before it commits — it leaks a little glow half a beat early, then blooms with its note on the sixteenth. L = ORIENTATION — an absolute dial: hand at the sphere and the crystals sit at rest; reach out and the whole field turns with your hand, up to a full turn at full reach, AND the gradients inside the stones lag round behind it, so the colour travels across the facets while they turn. Every burst sits on a real edge of a real stone and slides along it, so its rays swing with the geometry making them.',
  sound: 'An aperture organ. Every lit burst holds one voice — pitch by where it sits in the frame (high in the frame = high in the chord), stereo position by where it sits left to right — so the picture and the chord are the same object. Voices enter rolled low-to-high like a harp and each entrance is doubled by a glass bell (MIDI role: bells) on the sixteenth it commits. Fewer, larger bursts than before means a sparser, more deliberate chord. L still opens every voice filter together and detunes their partials. Underneath: a slow air bed and a root pedal that never moves. NO PERCUSSION. Ableton: pad ch2 = the voices (CC74 = L), bells ch5, texture ch6 = air, bass ch3 = pedal.',

  init(P) {
    const S = Math.min(P.w, P.h), w = P.w, h = P.h;
    // P.focused is still false during init — size off the area instead
    const N = areaScale(P) > 1.6 ? 44 : 18;
    const cells = [];
    for (let i = 0; i < N; i++) {
      cells.push({
        x: P.rand() * w, y: P.rand() * h,
        r: S * (0.075 + P.rand() * 0.235),   // wide size spread
        ph: P.rand() * TAU, sp: 0.1 + P.rand() * 0.22,
        // per-stone gradient tilt: every stone leans the palette its own way
        gradRot: (P.rand() - 0.5) * 1.3,
        drift: (P.rand() - 0.5) * 0.5,
        baseRot: P.rand() * TAU, rot: 0
      });
    }
    // a few rounds of pushing apart — soap does this on its own in a second
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = cells[i], b = cells[j];
          // 0.74 — the cells must OVERLAP, or the sheet has holes in it that
          // are not apertures, just gaps, and it stops reading as one film
          const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * 0.74;
          const d = Math.hypot(dx, dy) || 1;
          if (d < rr) {
            const f = (rr - d) * 0.5, ux = dx / d * f, uy = dy / d * f;
            a.x -= ux; a.y -= uy; b.x += ux; b.y += uy;
          }
        }
      }
      for (const c of cells) {
        c.x = clamp(c.x, -c.r * 0.3, w + c.r * 0.3);
        c.y = clamp(c.y, -c.r * 0.3, h + c.r * 0.3);
      }
    }
    const vertsAt = (c, rot) => {
      const rx = c.r * 0.78, ry = c.r * 1.08, ca = Math.cos(rot), sa = Math.sin(rot);
      return [[0, -ry], [rx, 0], [0, ry], [-rx, 0]]
        .map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };
    // is a point inside a stone? the kite is convex, so every edge has to
    // see the point on the same side
    const inKite = (pt, poly) => {
      let sign = 0;
      for (let k = 0; k < 4; k++) {
        const A = poly[k], B = poly[(k + 1) % 4];
        const cr = (B[0] - A[0]) * (pt[1] - A[1]) - (B[1] - A[1]) * (pt[0] - A[0]);
        if (cr === 0) continue;
        const sg = cr > 0 ? 1 : -1;
        if (sign === 0) sign = sg; else if (sg !== sign) return false;
      }
      return true;
    };
    // who overlaps whom
    const neigh = [];
    for (let i = 0; i < N; i++) neigh.push([]);
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = cells[i], b = cells[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) > (a.r + b.r) * 0.82) continue;
        neigh[i].push(j); neigh[j].push(i);
      }
    }
    // ONE BURST PER STONE AT MOST, and only for some stones. The burst sits
    // on a point of the host's own outline that is also INSIDE a neighbour —
    // tested, not assumed — which is what keeps it over diamond and never
    // over the black. Of the candidates, take the one furthest into the
    // neighbour so the slow slide along the edge cannot walk it out.
    const ap = [];
    for (let i = 0; i < N; i++) {
      if (!neigh[i].length) continue;
      if (P.rand() > 0.6) continue;              // not every stone lights
      const host = cells[i];
      const hv = vertsAt(host, host.baseRot);
      // try neighbours nearest first — deepest overlap
      const order = neigh[i].slice().sort((x, y) =>
        Math.hypot(cells[x].x - host.x, cells[x].y - host.y) -
        Math.hypot(cells[y].x - host.x, cells[y].y - host.y));
      let found = null;
      for (const j of order) {
        const guest = cells[j], gv = vertsAt(guest, guest.baseRot);
        let bd = Infinity, be = -1, bu = 0.5;
        for (let e = 0; e < 4; e++) {
          const p0 = hv[e], p1 = hv[(e + 1) % 4];
          for (let si = 0; si <= 24; si++) {
            const u = si / 24;
            const pt = [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u];
            if (!inKite(pt, gv)) continue;
            const dd = Math.hypot(pt[0] - guest.x, pt[1] - guest.y);
            if (dd < bd) { bd = dd; be = e; bu = u; }
          }
        }
        if (be >= 0) { found = { e: be, u: bu }; break; }
      }
      if (!found) continue;
      ap.push({
        host: i, eIdx: found.e, u0: clamp(found.u, 0.16, 0.84),
        // the burst slides slowly back and forth along its edge
        uSp: 0.12 + P.rand() * 0.3, uPh: P.rand() * TAU,
        // every burst its own size
        size: host.r * (0.5 + P.rand() * 1.15),
        open: 0, lit: 0, on: false, arm: 0,
        x: host.x, y: host.y,
        // SCATTERED: threshold independent of position, so bursts turn up
        // anywhere in the frame rather than opening outward from the centre
        th: clamp(0.06 + P.rand() * 0.92),
        // each grows and fades at its own rate — separate timelines
        growRate: 2.4 + P.rand() * 4.6, fadeRate: 1.1 + P.rand() * 2.8
      });
    }
    ap.sort((u, z) => u.th - z.th);
    ap.forEach((p, i) => { p.i = i; p.voice = i < 8 ? i : -1; });
    P.state = { cells, ap, pres: 0, lightP: 0, thick: 0, rotL: 0, spin: 0, openN: 0, lamp: 0, evq: [] };
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.lightP += (clamp(inp.R) - s.lightP) * Math.min(1, dt * 7);
    s.thick += (clamp(inp.L) - s.thick) * Math.min(1, dt * 6);
    // idle tease: the lamp behind the sheet breathes on its own
    const idle = (1 - s.pres) * (0.12 + 0.1 * Math.sin(t * 0.31));
    s.lamp = Math.max(s.lightP, idle);

    // ORIENTATION: absolute dial. Hand at the sphere = the field sits at its
    // resting cut; reach out and the whole field turns with the hand, up to
    // one full turn — no momentum, it tracks the hand directly. At rest
    // (no presence) the field settles back to zero, per the abandoned-scene
    // rule, with a tiny sinusoidal wobble that hints it CAN be turned.
    s.rotL += (clamp(inp.L) - s.rotL) * Math.min(1, dt * 8);
    const targetSpin = s.pres > 0.05 ? s.rotL * TAU : 0;
    s.spin += (targetSpin - s.spin) * Math.min(1, dt * 7);

    for (const c of s.cells) {
      c.ph += dt * c.sp;
      c.x += Math.cos(c.ph * 0.7 + c.drift) * dt * 5;
      c.y += Math.sin(c.ph) * dt * 4;
      c.rot = c.baseRot + s.spin + (1 - s.pres) * 0.05 * Math.sin(t * 0.25 + c.ph * 2);
    }
    let open = 0;
    for (const p of s.ap) {
      const H = s.cells[p.host];
      p.x = H.x; p.y = H.y;
      const want = s.lamp > p.th;
      // TELEGRAPH: light starts leaking before the burst commits, so the eye
      // is warned half a beat before the ear.
      const lead = clamp((s.lamp - p.th + 0.09) / 0.14);
      p.lit += (lead - p.lit) * Math.min(1, dt * 9);
      if (want !== p.on) {
        p.arm += dt;
        if (p.arm > 0.05) { p.on = want; p.arm = 0; s.evq.push({ p, on: want }); }
      } else p.arm = 0;
      p.open += ((p.on ? 1 : 0) - p.open) * Math.min(1, dt * (p.on ? p.growRate : p.fadeRate));
      if (p.on) open++;
    }
    s.openN = open;
    if (s.evq.length > 20) s.evq.splice(0, s.evq.length - 20);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#010103';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const gate = clamp(s.pres * 1.15);          // keeps the field dark at rest
    const LIGHT_DIR = -Math.PI / 2;              // the sun is fixed; the field turns

    // THE PALETTE — lifted directly from the reference illustration's own
    // linear gradient (black → blue → mint → near-white → gold → red →
    // indigo → black). This is the ONLY colour source in the whole scene.
    const SVGSTOPS = [
      [0, '0,0,0'], [0.2, '37,85,238'], [0.4, '100,215,160'], [0.5, '242,255,242'],
      [0.6, '255,214,90'], [0.7, '225,61,47'], [0.8, '0,14,223'], [1, '0,0,0']
    ];
    const addSvgStops = (grad, a) => { for (const [t, rgb] of SVGSTOPS) grad.addColorStop(t, `rgba(${rgb},${a})`); };

    // a diamond's 4 vertices — taller than wide, like a cut stone
    const diamondPts = (c, rScale) => {
      const rx = c.r * 0.78 * rScale, ry = c.r * 1.08 * rScale, a = c.rot;
      const ca = Math.cos(a), sa = Math.sin(a);
      const raw = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]];
      return raw.map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };

    // ---- THE FILM: six wedges off a ridge, palette running from each
    // wedge's inner edge outward. The gradient axis is the stone's own
    // gradRot PLUS a fraction of the field's turn — so as L rotates the
    // field, the colour also creeps round inside each stone instead of
    // being carried along rigidly with it.
    const gradLag = s.spin * 0.34;
    const stonePts = [];
    for (const c of s.cells) {
      const pts = diamondPts(c, 1);
      stonePts.push(pts);
      const T = pts[0], R = pts[1], B = pts[2], L = pts[3];
      const U = [c.x + (T[0] - c.x) * 0.45, c.y + (T[1] - c.y) * 0.45];
      const D = [c.x + (B[0] - c.x) * 0.45, c.y + (B[1] - c.y) * 0.45];
      const tris = [[T, U, R], [U, D, R], [D, B, R], [T, U, L], [U, D, L], [D, B, L]];
      const gAng = c.gradRot + gradLag;
      const cr = Math.cos(gAng), sr = Math.sin(gAng);
      for (const [inA, inB, outV] of tris) {
        const mx = (inA[0] + inB[0]) / 2, my = (inA[1] + inB[1]) / 2;
        const facetAngle = Math.atan2(outV[1] - my, outV[0] - mx);
        const lit = 0.5 + 0.5 * Math.cos(facetAngle - LIGHT_DIR);
        const alphaEnv = clamp(0.04 + lit * 0.5 * gate + s.lamp * 0.3);
        const dx0 = outV[0] - mx, dy0 = outV[1] - my;
        const gx = mx + dx0 * cr - dy0 * sr, gy = my + dx0 * sr + dy0 * cr;
        const fg = g.createLinearGradient(mx, my, gx, gy);
        addSvgStops(fg, alphaEnv.toFixed(2));
        g.fillStyle = fg;
        g.beginPath(); g.moveTo(inA[0], inA[1]); g.lineTo(inB[0], inB[1]); g.lineTo(outV[0], outV[1]); g.closePath();
        g.fill();
      }
    }
    // NO OUTLINE, and no overlay pass — the stone colour is left alone.

    // ---- THE LAMP: few, large, soft ------------------------------------
    g.globalCompositeOperation = 'lighter';
    // the beam's colour run, as explicit channels so each can be drawn on
    // its own and nudged off the others. Alphas fall away well before the
    // tip so the ray fades out rather than stopping.
    const BEAM = [
      [0, 242, 255, 242, 1.15],
      [0.22, 37, 85, 238, 0.92],
      [0.5, 255, 214, 90, 0.48],
      [0.78, 225, 61, 47, 0.16],
      [1, 225, 61, 47, 0]
    ];
    for (const p of s.ap) {
      const a = Math.max(p.lit * 0.35, p.open);
      if (a < 0.01) continue;
      const hv = stonePts[p.host];
      const e0 = hv[p.eIdx], e1 = hv[(p.eIdx + 1) % 4];
      // slide along that edge — the light travels the stone's own border
      const u = clamp(p.u0 + Math.sin(t * p.uSp + p.uPh) * 0.12, 0.06, 0.94);
      const sx = e0[0] + (e1[0] - e0[0]) * u, sy = e0[1] + (e1[1] - e0[1]) * u;
      // the edge's own direction: beams built off this swing with the stone
      const eAng = Math.atan2(e1[1] - e0[1], e1[0] - e0[0]);

      const R = p.size * (0.13 + a * 0.4);
      const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(242,255,242,${(Math.min(0.92, a) * bright).toFixed(2)})`);
      gr.addColorStop(0.35, `rgba(37,85,238,${(a * 0.55 * bright).toFixed(2)})`);
      gr.addColorStop(0.7, `rgba(255,214,90,${(a * 0.3 * bright).toFixed(2)})`);
      gr.addColorStop(1, 'rgba(225,61,47,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();

      if (p.open > 0.2) {
        const L = R * (2.2 + p.open * 5);            // longer than before
        const dirs = [
          { a: eAng, len: 1 },
          { a: eAng + Math.PI, len: 1 },
          { a: eAng + Math.PI / 2, len: 0.4 },
          { a: eAng - Math.PI / 2, len: 0.4 }
        ];
        for (const dr of dirs) {
          const primary = dr.len > 0.9;
          const Ln = L * dr.len, cx = Math.cos(dr.a) * Ln, cy = Math.sin(dr.a) * Ln;
          const ex = sx + cx, ey = sy + cy;
          // wide beams cover far more ground, so each pass is much fainter
          const av = p.open * (primary ? 0.15 : 0.09) * bright;
          const coreW = Math.max(9 * ms, R * (primary ? 0.95 : 0.3) * p.open);
          if (!primary) {
            g.strokeStyle = `rgba(214,232,255,${(av * 0.8).toFixed(2)})`;
            g.lineWidth = coreW;
            g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
            continue;
          }
          const mkGrad = (mult, ch) => {
            const gd = g.createLinearGradient(sx, sy, ex, ey);
            for (const st of BEAM) {
              const rr = (ch === undefined || ch === 0) ? st[1] : 0;
              const gg = (ch === undefined || ch === 1) ? st[2] : 0;
              const bb = (ch === undefined || ch === 2) ? st[3] : 0;
              gd.addColorStop(st[0], `rgba(${rr},${gg},${bb},${(av * st[4] * mult).toFixed(3)})`);
            }
            return gd;
          };
          // the soft outer falloff — widest and faintest
          g.strokeStyle = mkGrad(0.3);
          g.lineWidth = coreW * 1.5;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();

          // THE REFRACTION: the same ray drawn once per colour channel,
          // each shifted across the ray. Added together the three recombine
          // to the original colour down the middle, and the shift leaves red
          // along one edge and blue along the other — genuinely out of
          // register, not a coloured line drawn alongside.
          const perpx = -cy / Ln, perpy = cx / Ln;
          const sep = Math.max(1.5 * ms, coreW * 0.085);
          for (let ch = 0; ch < 3; ch++) {
            g.strokeStyle = mkGrad(1, ch);
            g.lineWidth = coreW;
            const off = (ch - 1) * sep;      // red +, green centre, blue −
            g.beginPath();
            g.moveTo(sx + perpx * off, sy + perpy * off);
            g.lineTo(ex + perpx * off, ey + perpy * off);
            g.stroke();
          }
          // a hot thread down the middle so the wide beam still has a core
          g.strokeStyle = mkGrad(1.15);
          g.lineWidth = Math.max(2 * ms, coreW * 0.16);
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        }
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(190,225,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('SPOTS ' + s.openN + '/' + s.ap.length + '   LAMP ' + Math.round(s.lamp * 100) +
      '   TURN ' + Math.round(s.spin / TAU * 100) + '%' +
      (s.pres < 0.3 ? '   · CLOSED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const s0 = P.state;

    /* --- air behind the sheet ------------------------------------------ */
    const n = v.noise(), nf = v.filter('bandpass', 500, 0.9), ng = v.g(0.006);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- ONE VOICE PER BURST. Eight of them; the rest of the field is
       light only. Pitch by height in the frame, pan by side — the chord
       and the picture are the same object.                               */
    const NV = 8;
    const voices = [];
    for (let i = 0; i < NV; i++) {
      const o1 = v.osc('triangle', 220), o2 = v.osc('triangle', 220), o3 = v.osc('sine', 440);
      o2.detune.value = 6;
      const f = v.filter('lowpass', 700, 1.1);
      const g = v.g(0.0001);
      const pan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
      o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g);
      if (pan) { g.connect(pan); pan.connect(v.group); } else { g.connect(v.group); }
      if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; g.connect(sd); sd.connect(AE.revIn); }
      voices.push({ o1, o2, o3, f, g, pan, freq: 220, note: -1, lvl: 0 });
    }
    const setV = (vc, freq, glide) => {
      if (!isFinite(freq) || freq <= 20) return;
      vc.freq = freq;
      A.set(vc.o1.frequency, freq, glide);
      A.set(vc.o2.frequency, freq, glide);
      A.set(vc.o3.frequency, freq * 2.01, glide);
      if (typeof MOut !== 'undefined') {
        const note = MOut.f2n(freq);
        if (note !== vc.note) {
          const ch = MOut.chFor('pad'), p = performance.now();
          if (vc.note >= 0 && MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0], p); } catch (e) {} }
          vc.note = note;
          MOut.log.push({ p, role: 'pad', ch, note, vel: 62, durMs: 2600 });
          if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, 62], p); } catch (e) {} }
        }
      }
    };

    /* --- the pedal ------------------------------------------------------ */
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.014, cutoff: 220, q: 0.5 });
    const retune = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      // every lit burst re-voices into the new chord, rolled low to high
      const ap = P.state.ap;
      for (const p of ap) {
        if (p.voice < 0 || !p.on) continue;
        const vc = voices[p.voice];
        setV(vc, H.chordTone(p.deg || 0, p.oct || 0), glide);
      }
    };
    retune(0.05);
    H.onChord(() => retune(0.2));
    v.fadeIn(1, 1.6);

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const thick = s.thick || 0;

        A.set(ng.gain, (0.003 + s.lamp * 0.012) * gate, 0.4);
        A.set(nf.frequency, 360 + s.lamp * 1500 + thick * 400, 0.4);
        sub[0].level(0.01 + s.lamp * 0.008, 0.5);

        /* ---- bursts committing: the entrance is rolled and quantised -- */
        let ev, i = 0;
        while ((ev = s.evq.shift()) && i < 6) {
          i++;
          const p = ev.p;
          if (p.voice < 0) continue;
          const vc = voices[p.voice];
          if (ev.on) {
            // HEIGHT IS PITCH: a burst near the top of the frame sings high
            const up = clamp(1 - p.y / P.h);
            const deg = Math.round(up * 9);
            const oct = up > 0.72 ? 1 : 0;
            p.deg = deg; p.oct = oct;
            setV(vc, H.chordTone(deg, oct), 0.08);
            if (vc.pan) A.set(vc.pan.pan, clamp(p.x / P.w * 2 - 1, -1, 1) * 0.7, 0.2);
            const at = T.next(0.25) + p.voice * 0.012;   // low-to-high harp stagger
            A.set(vc.g.gain, 0.024 + thick * 0.012, 0.35);
            A.bell(H.chordTone(deg + 3, oct + 1), { at, vol: 0.05 * gate, dur: 2.4, pan: clamp(p.x / P.w * 2 - 1, -1, 1) * 0.8, rev: 0.7 });
          } else {
            A.set(vc.g.gain, 0.0001, 0.5);
            if (typeof MOut !== 'undefined' && vc.note >= 0) {
              const ch = MOut.chFor('pad');
              if (MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
              vc.note = -1;
            }
          }
        }

        /* ---- L opens every voice's filter together --------------------- */
        for (let k = 0; k < NV; k++) {
          const vc = voices[k];
          A.set(vc.f.frequency, 420 + (1 - thick) * 2600 + s.lamp * 700, 0.25);
          A.set(vc.o2.detune, 4 + (1 - thick) * 16, 0.3);
          A.set(vc.o3.detune, (1 - thick) * 9, 0.3);
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', 1 - thick);
          MOut.expr('texture', s.lamp);
          MOut.expr('bells', clamp(s.openN / 8));
        }
      },
      stop() {
        if (typeof MOut !== 'undefined' && MOut.wants() && MOut.port) {
          const ch = MOut.chFor('pad');
          for (const vc of voices) if (vc.note >= 0) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
        }
        v.kill();
      }
    };
  }
});
