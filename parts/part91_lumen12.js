/* ---------- SRC-38.12 · LUMEN FIELD (V10 look, split-channel rays) ---------- */
reg({
  id: 'SRC-38.12', family: 'SRC-38', ver: 12, title: 'Lumen Film', tech: 'GEM FILM / APERTURE ORGAN',
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
  tags: ['V10 CUT', 'SPLIT-CHANNEL RAYS', 'OVERLAY WHERE STONES MEET', 'LIGHT ON THE EDGE'],
  desc: 'V12: V10 again — the V5 cut, six wedges off a ridge with each stone leaning the palette at its own angle — with the two things V11 got right kept: no outline around the stones, and the light living on a real edge of a real stone instead of floating in the gap. New here: the rays are wider and their edges come apart into colour. Each ray is drawn three times, once per colour channel, each nudged a little to the side, so red rides one edge and blue the other and they recombine to white down the middle — an actual channel misalignment rather than a fringe painted on top. Under that sits one wide faint pass of the whole beam, which is what softens the edge without a blur filter. And where two stones cross, the upper one is blended into the lower the way Photoshop overlays: darks deepen, lights lift, so the crossings carry a colour of their own.',
  interact: 'R = LIGHT PRESSURE, unchanged — the lamp behind the sheet. Draw in and the film is closed, a dark faceted field and nothing else. Reach out and junctions blow open — scattered across the whole frame, each with its own grow and fade speed — each one adding its own held note to the chord. A hole always tells you before it commits — it leaks a little glow half a beat early, then blooms with its note on the sixteenth. L = ORIENTATION — an absolute dial: hand at the sphere and the crystals sit at rest; reach out and the whole field turns with your hand, up to a full turn at full reach. Every burst sits on a real edge of a real stone and slides along it, so turning L carries the light and its rays around with the geometry making it. Sonically L still runs the same glassy-to-warm sweep it always has.',
  sound: 'An aperture organ. Every open hole holds one voice — pitch by where it sits in the frame (high in the frame = high in the chord), stereo position by where it sits left to right — so the picture and the chord are literally the same object; count the holes and you have counted the voices. Voices enter rolled low-to-high like a harp and each entrance is doubled by a glass bell (MIDI role: bells) on the sixteenth it commits. L still opens every voice filter together and detunes their partials. Underneath: a slow air bed and a root pedal that never moves. NO PERCUSSION. Ableton: pad ch2 = the aperture voices (CC74 = L), bells ch5, texture ch6 = air, bass ch3 = pedal.',

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
        // V5/V10's per-stone gradient tilt: every stone leans the same
        // reference palette at its own angle
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
    // vertices of a stone at a given rotation — needed here to choose where
    // each light will live
    const vertsAt = (c, rot) => {
      const rx = c.r * 0.78, ry = c.r * 1.08, ca = Math.cos(rot), sa = Math.sin(rot);
      return [[0, -ry], [rx, 0], [0, ry], [-rx, 0]]
        .map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };
    // THE SEAMS: every place two cells press together is a junction, and a
    // junction is where the film gets thin enough for the lamp to find it.
    const ap = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = cells[i], b = cells[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > (a.r + b.r) * 0.82) continue;
        const k = a.r / (a.r + b.r);
        const jx = a.x + (b.x - a.x) * k, jy = a.y + (b.y - a.y) * k;
        // THE LIGHT LIVES ON A REAL EDGE OF A REAL STONE. Host it on the
        // SMALLER of the pair and find the point on that stone's outline
        // closest to the bigger one's centre: the two overlap, so that point
        // is inside the neighbour as well, which keeps the burst on top of
        // the diamonds and never over the black.
        const hostIsA = a.r <= b.r;
        const host = hostIsA ? a : b, guest = hostIsA ? b : a;
        const hv = vertsAt(host, host.baseRot);
        let bd = Infinity, be = 0, bu = 0.5;
        for (let e = 0; e < 4; e++) {
          const p0 = hv[e], p1 = hv[(e + 1) % 4];
          for (let si = 0; si <= 20; si++) {
            const u = si / 20;
            const px = p0[0] + (p1[0] - p0[0]) * u, py = p0[1] + (p1[1] - p0[1]) * u;
            const dd = Math.hypot(px - guest.x, py - guest.y);
            if (dd < bd) { bd = dd; be = e; bu = u; }
          }
        }
        ap.push({
          a: i, b: j, x: jx, y: jy,
          host: hostIsA ? i : j,
          eIdx: be, u0: clamp(bu, 0.14, 0.86),
          // the burst slides slowly back and forth along its edge
          uSp: 0.12 + P.rand() * 0.3, uPh: P.rand() * TAU,
          open: 0, lit: 0, on: false, arm: 0, size: Math.min(a.r, b.r),
          // SCATTERED, not radial: threshold is independent of position, so
          // sparks turn up anywhere in the frame — edges as readily as the
          // middle — instead of opening outward from the centre in order.
          th: clamp(0.06 + P.rand() * 0.92),
          // each junction grows and fades at its own rate — different
          // sparks on different timelines, not one shared clock
          growRate: 2.4 + P.rand() * 4.6, fadeRate: 1.1 + P.rand() * 2.8
        });
      }
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
      const a = s.cells[p.a], b = s.cells[p.b];
      const k = a.r / (a.r + b.r);
      p.x = a.x + (b.x - a.x) * k; p.y = a.y + (b.y - a.y) * k;
      const want = s.lamp > p.th;
      // TELEGRAPH: light starts leaking through the seam before the hole
      // commits, so the eye is warned half a beat before the ear.
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
    const kitePath = pts => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath();
    };

    // ---- THE FILM: the V5/V10 cut. A ridge runs T→B through two interior
    // points (U and D, 45% of the way out) splitting the kite into six
    // triangles, three a side. Every facet carries the reference palette
    // from its inner edge outward, the whole set tilted by this stone's own
    // gradRot. Litness (fixed overhead sun × the facet's true angle) gates
    // brightness, scaled by presence so the sheet stays dark at rest.
    const stonePts = [];
    for (const c of s.cells) {
      const pts = diamondPts(c, 1);
      stonePts.push(pts);
      const T = pts[0], R = pts[1], B = pts[2], L = pts[3];
      const U = [c.x + (T[0] - c.x) * 0.45, c.y + (T[1] - c.y) * 0.45];
      const D = [c.x + (B[0] - c.x) * 0.45, c.y + (B[1] - c.y) * 0.45];
      const tris = [[T, U, R], [U, D, R], [D, B, R], [T, U, L], [U, D, L], [D, B, L]];
      const cr = Math.cos(c.gradRot), sr = Math.sin(c.gradRot);
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
    // NO OUTLINE — the facets meet the black on their own.

    // ---- WHERE STONES CROSS: Photoshop's overlay. One pass of each stone,
    // its own palette across its own tilt, composited 'overlay' onto what is
    // already down. Over black it contributes almost nothing (overlay of
    // anything onto black stays black, which is exactly why the stones are
    // laid down normally first); over another stone it does the real work —
    // darks deepen, lights lift — so every crossing gets a colour the two
    // stones only make together.
    g.globalCompositeOperation = 'overlay';
    const ovA = clamp(0.10 + gate * 0.34 + s.lamp * 0.22);
    for (let i = 0; i < s.cells.length; i++) {
      const c = s.cells[i];
      const ang = c.gradRot + c.rot;
      const ax = Math.cos(ang) * c.r, ay = Math.sin(ang) * c.r;
      const og = g.createLinearGradient(c.x - ax, c.y - ay, c.x + ax, c.y + ay);
      addSvgStops(og, ovA.toFixed(2));
      g.fillStyle = og;
      kitePath(stonePts[i]);
      g.fill();
    }

    // ---- THE LAMP ------------------------------------------------------
    g.globalCompositeOperation = 'lighter';
    // the beam's colour run, kept as explicit channels so each one can be
    // drawn on its own and nudged off the others
    const BEAM = [
      [0, 242, 255, 242, 1.2],
      [0.3, 37, 85, 238, 1.0],
      [0.62, 255, 214, 90, 0.7],
      [1, 225, 61, 47, 0]
    ];
    for (const p of s.ap) {
      const a = Math.max(p.lit * 0.35, p.open);
      if (a < 0.01) continue;
      const HC = s.cells[p.host];
      const hv = stonePts[p.host];
      const e0 = hv[p.eIdx], e1 = hv[(p.eIdx + 1) % 4];
      // slide along that edge — the light travels the stone's own border
      const u = clamp(p.u0 + Math.sin(t * p.uSp + p.uPh) * 0.14, 0.05, 0.95);
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
        const L = R * (1.4 + p.open * 2.4);
        // two long rays running the edge itself, two short ones across it
        const dirs = [
          { a: eAng, len: 1 },
          { a: eAng + Math.PI, len: 1 },
          { a: eAng + Math.PI / 2, len: 0.42 },
          { a: eAng - Math.PI / 2, len: 0.42 }
        ];
        for (const dr of dirs) {
          const primary = dr.len > 0.9;
          const Ln = L * dr.len, cx = Math.cos(dr.a) * Ln, cy = Math.sin(dr.a) * Ln;
          const ex = sx + cx, ey = sy + cy;
          const av = p.open * (primary ? 0.34 : 0.16) * bright;
          // wider than V10 was
          const coreW = Math.max(1.4 * ms, R * (primary ? 0.1 : 0.06) * p.open);
          if (!primary) {
            g.strokeStyle = `rgba(214,232,255,${(av * 0.85).toFixed(2)})`;
            g.lineWidth = coreW;
            g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
            continue;
          }
          // the soft edge: one wide faint pass of the whole beam underneath.
          // A canvas blur() here is what used to make the frame crawl.
          const halo = g.createLinearGradient(sx, sy, ex, ey);
          for (const st of BEAM) halo.addColorStop(st[0], `rgba(${st[1]},${st[2]},${st[3]},${(av * st[4] * 0.34).toFixed(3)})`);
          g.strokeStyle = halo;
          g.lineWidth = coreW * 3.6 + 2.2 * ms;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();

          // THE REFRACTION: the same beam drawn once per colour channel,
          // each shifted a little across the ray. Added together the three
          // recombine to the original colour down the middle, and where the
          // shift leaves them uncovered you get red along one edge and blue
          // along the other — the channels genuinely out of register, not a
          // coloured line drawn beside the beam.
          const perpx = -cy / Ln, perpy = cx / Ln;
          const sep = Math.max(1 * ms, coreW * 0.42);
          for (let ch = 0; ch < 3; ch++) {
            const cg = g.createLinearGradient(sx, sy, ex, ey);
            for (const st of BEAM) {
              const rr = ch === 0 ? st[1] : 0, gg = ch === 1 ? st[2] : 0, bb = ch === 2 ? st[3] : 0;
              cg.addColorStop(st[0], `rgba(${rr},${gg},${bb},${(av * st[4]).toFixed(3)})`);
            }
            const off = (ch - 1) * sep;          // red +, green centre, blue −
            g.strokeStyle = cg;
            g.lineWidth = coreW;
            g.beginPath();
            g.moveTo(sx + perpx * off, sy + perpy * off);
            g.lineTo(ex + perpx * off, ey + perpy * off);
            g.stroke();
          }
        }
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(190,225,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HOLES ' + s.openN + '/' + s.ap.length + '   LAMP ' + Math.round(s.lamp * 100) +
      '   TURN ' + Math.round(s.spin / TAU * 100) + '%' +
      (s.pres < 0.3 ? '   · CLOSED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const s0 = P.state;

    /* --- air behind the sheet ------------------------------------------ */
    const n = v.noise(), nf = v.filter('bandpass', 500, 0.9), ng = v.g(0.006);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- ONE VOICE PER HOLE. Eight of them; the rest of the sheet is
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
      // every open hole re-voices into the new chord, rolled low to high
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

        /* ---- holes committing: the entrance is rolled and quantised --- */
        let ev, i = 0;
        while ((ev = s.evq.shift()) && i < 6) {
          i++;
          const p = ev.p;
          if (p.voice < 0) continue;
          const vc = voices[p.voice];
          if (ev.on) {
            // HEIGHT IS PITCH: a hole near the top of the sheet sings high
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
