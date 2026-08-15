/* ---------- SRC-38.11 · LUMEN FIELD (the illustration, opaque) ---------- */
reg({
  id: 'SRC-38.11', family: 'SRC-38', ver: 11, title: 'Lumen Film', tech: 'GEM FILM / APERTURE ORGAN',
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
  tags: ['THE ILLUSTRATION, EXACT', 'OPAQUE NESTED FACETS', 'LIGHT RIDES A REAL EDGE', 'NO OUTLINE'],
  desc: 'V11: three fixes. The outline around every stone is gone — the facets meet the black on their own. The light no longer floats: each burst is pinned to a point ON one stone’s actual edge, picked where that stone overlaps its neighbour, so it is always sitting on a diamond and never over the gap; it glides slowly along that edge, and because the edge belongs to the stone, the burst and its beams swing round with the stone as it turns. And the facets are the illustration exactly — same nested construction, same three gradient vectors read straight out of the file and re-solved onto every stone, but painted OPAQUE now. That last word is what was wrong before: the file paints six solid shapes in order so the narrow one covers the wide one, while this scene had been fading every colour stop, letting all three blend into one muddy band. Presence and lamp now dim the colours toward black instead of thinning them, which on a black ground looks the same and layers correctly.',
  interact: 'R = LIGHT PRESSURE, unchanged — the lamp behind the sheet. Draw in and the film is closed, a dark faceted field and nothing else. Reach out and junctions blow open — scattered across the whole frame, each with its own grow and fade speed — each one adding its own held note to the chord. A hole always tells you before it commits — it leaks a little glow half a beat early, then blooms with its note on the sixteenth. L = ORIENTATION — an absolute dial: hand at the sphere and the crystals sit at rest; reach out and the whole field turns with your hand, up to a full turn at full reach. Every burst lives on a real edge of a real stone, so turning L carries the light and its beams around with the geometry that is making it. Sonically L still runs the same glassy-to-warm sweep it always has.',
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
        drift: (P.rand() - 0.5) * 0.5,
        // no per-stone gradient tilt any more: the cut is the illustration
        // exactly, and the variety across the field comes from each stone
        // sitting at its own baseRot to begin with
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
    // vertices of a stone at a given rotation — the same kite the draw pass
    // builds, needed here to choose where each light will live
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
        // closest to the bigger one's centre: the two stones overlap, so
        // that point is inside the neighbour as well, which is what keeps
        // the burst on top of the diamonds and never over the black. Chosen
        // once here, then simply carried around by the stone as it turns.
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

    // THE PALETTE — the illustration's eight stops, verbatim.
    // The file paints its shapes SOLID, so these are drawn solid too and the
    // gating is done by scaling the colour toward black rather than by
    // dropping alpha. Same result against a black ground, but the nested
    // triangles then cover one another the way they do in the file instead
    // of blending into one another.
    const SVGSTOPS = [
      [0, 0, 0, 0], [0.2, 37, 85, 238], [0.4, 100, 215, 160], [0.5, 242, 255, 242],
      [0.6, 255, 214, 90], [0.7, 225, 61, 47], [0.8, 0, 14, 223], [1, 0, 0, 0]
    ];
    const addSvgStops = (grad, k) => {
      for (const st of SVGSTOPS) {
        grad.addColorStop(st[0], 'rgb(' + ((st[1] * k) | 0) + ',' + ((st[2] * k) | 0) + ',' + ((st[3] * k) | 0) + ')');
      }
    };
    const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

    // ---- THE ILLUSTRATION, MEASURED ----------------------------------
    // Its drawing is 124.4 x 239.2 with T(62.2,0), L(0,119.8), R(124.4,119.8).
    // Top half: three triangles all sharing apex T and corner L, the third
    // point sliding along the base at x = 124.4 / 77.1 / 31.5, i.e. these
    // fractions from L toward R, painted widest first. Bottom half is the
    // same three mirrored through the file's own gradientTransform, which is
    // exactly the affine map (L,T,R) -> (R,B,L) — checked against the file's
    // stated bottom coordinates and it reproduces them.
    const REF_T = [62.2, 0], REF_L = [0, 119.8], REF_R = [124.4, 119.8];
    const FRACS = [1, 0.6198, 0.2532];
    // and its three gradient vectors, in the same paint order
    const REF_GRADS = [
      [[48.9, 6.2], [65.2, 145.3]],
      [[27.5, 54.9], [78.1, 126.2]],
      [[29.3, 26.1], [34.2, 117.8]]
    ];
    const affineMap = (refA, refB, refC, actA, actB, actC) => {
      const rB0 = refB[0] - refA[0], rB1 = refB[1] - refA[1];
      const rC0 = refC[0] - refA[0], rC1 = refC[1] - refA[1];
      const aB0 = actB[0] - actA[0], aB1 = actB[1] - actA[1];
      const aC0 = actC[0] - actA[0], aC1 = actC[1] - actA[1];
      const det = rB0 * rC1 - rC0 * rB1;
      const i11 = rC1 / det, i12 = -rC0 / det, i21 = -rB1 / det, i22 = rB0 / det;
      const A11 = aB0 * i11 + aC0 * i21, A12 = aB0 * i12 + aC0 * i22;
      const A21 = aB1 * i11 + aC1 * i21, A22 = aB1 * i12 + aC1 * i22;
      return (px, py) => {
        const dx = px - refA[0], dy = py - refA[1];
        return [actA[0] + A11 * dx + A12 * dy, actA[1] + A21 * dx + A22 * dy];
      };
    };

    // a diamond's 4 vertices — taller than wide, like a cut stone
    const diamondPts = (c, rScale) => {
      const rx = c.r * 0.78 * rScale, ry = c.r * 1.08 * rScale, a = c.rot;
      const ca = Math.cos(a), sa = Math.sin(a);
      const raw = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]];
      return raw.map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };

    // ---- THE FILM ------------------------------------------------------
    for (const c of s.cells) {
      const pts = diamondPts(c, 1);
      const T = pts[0], R = pts[1], B = pts[2], L = pts[3];
      const halves = [{ apex: T, cA: L, cB: R }, { apex: B, cA: R, cB: L }];
      for (const half of halves) {
        const map = affineMap(REF_L, REF_T, REF_R, half.cA, half.apex, half.cB);
        for (let i = 0; i < 3; i++) {
          const Q = lerp2(half.cA, half.cB, FRACS[i]);
          // brightness comes from the facet's own true facing against the
          // fixed sun, so turning the field still sweeps the light across it
          const natAngle = Math.atan2(Q[1] - half.apex[1], Q[0] - half.apex[0]);
          const lit = 0.5 + 0.5 * Math.cos(natAngle - LIGHT_DIR);
          const kB = clamp(0.05 + lit * 0.52 * gate + s.lamp * 0.34);
          const p1 = map(REF_GRADS[i][0][0], REF_GRADS[i][0][1]);
          const p2 = map(REF_GRADS[i][1][0], REF_GRADS[i][1][1]);
          const fg = g.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
          addSvgStops(fg, kB);
          g.fillStyle = fg;
          g.beginPath();
          g.moveTo(half.apex[0], half.apex[1]);
          g.lineTo(half.cA[0], half.cA[1]);
          g.lineTo(Q[0], Q[1]);
          g.closePath(); g.fill();
        }
      }
    }
    // NO OUTLINE — the facets meet the black on their own now.

    // ---- THE LAMP: every burst sits on a real edge of a real stone ------
    g.globalCompositeOperation = 'lighter';
    for (const p of s.ap) {
      const a = Math.max(p.lit * 0.35, p.open);
      if (a < 0.01) continue;
      const HC = s.cells[p.host];
      const hv = diamondPts(HC, 1);
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
          const coreW = Math.max(0.9 * ms, R * (primary ? 0.07 : 0.045) * p.open);
          if (!primary) {
            // the cross flares are short and faint enough that a plain
            // stroke reads the same as the full treatment, for far less
            g.strokeStyle = `rgba(214,232,255,${(av * 0.85).toFixed(2)})`;
            g.lineWidth = coreW;
            g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
            continue;
          }
          const core = g.createLinearGradient(sx, sy, ex, ey);
          core.addColorStop(0, `rgba(242,255,242,${(av * 1.2).toFixed(2)})`);
          core.addColorStop(0.3, `rgba(37,85,238,${av.toFixed(2)})`);
          core.addColorStop(0.62, `rgba(255,214,90,${(av * 0.7).toFixed(2)})`);
          core.addColorStop(1, 'rgba(225,61,47,0)');
          g.strokeStyle = core;
          // bloom without a blur filter: one wide faint pass under the core
          g.globalAlpha = 0.3;
          g.lineWidth = coreW * 3.4 + 1.5 * ms;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
          g.globalAlpha = 1;
          g.lineWidth = coreW;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();

          // RGB fringe riding just off the beam's edges
          const perpx = -cy / Ln, perpy = cx / Ln, fr = 1.1 * ms;
          const fA = (av * 0.5).toFixed(2);
          g.lineWidth = Math.max(0.5 * ms, coreW * 0.4);
          g.strokeStyle = `rgba(225,61,47,${fA})`;
          g.beginPath(); g.moveTo(sx + perpx * fr, sy + perpy * fr); g.lineTo(ex + perpx * fr, ey + perpy * fr); g.stroke();
          g.strokeStyle = `rgba(37,85,238,${fA})`;
          g.beginPath(); g.moveTo(sx - perpx * fr, sy - perpy * fr); g.lineTo(ex - perpx * fr, ey - perpy * fr); g.stroke();
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
