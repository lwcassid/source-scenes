/* ---------- SRC-38.20 · LUMEN FILM V20 (the closed film breathes)
   The rest round (Lance: "we need a resting state"). A closed film was
   near-silence -- correct highs-dead law, but dead is not rest. V20
   gives the idle the studio's lure: randomized low breaths on the root
   (length, depth and spacing all rolled per breath, 8-22s apart, never
   a metronome), the air floor undulating on two incommensurate LFOs so
   the quiet is never constant, and roughly 1-in-7 breaths sinking a
   single deep glass toll into long reverb -- the sound you walk toward.
   Presence pushes the breath away; the first reach snaps the organ
   awake as ever. Breaths mirror as soft bass notes; the toll rings the
   bells seat. (V19 notes below.) ------------------------------------ */
/* ---------- SRC-38.19 · LUMEN FILM V19 (the organ meets the rack)
   Pre-built rig round (Lance asleep, head-start request): the scene's own
   sound brief said "bass ch = pedal" but the root pedal was going out as a
   PAD voice (padVoices auto-mirror), so the PADS track held a bass note and
   SYNTH BASS sat silent. V19: the pedal is a real held BASS note (D2,
   re-struck softly on each chord so the phrase breathes; browser sub keeps
   its deep D1). Burst velocities were machine-flat 62 -- now honest: height
   in frame + lamp set each entrance (52-90), so a velocity-sensitive glass
   patch reads the picture. Bells accent with height too. NO PERCUSSION,
   as ever. Visuals untouched from V18. ------------------------------- */
/* ---------- SRC-38.18 · LUMEN FIELD (no small stones) ---------- */
// Colour-stop strings, memoised by the alpha they were built for. Measured:
// this does NOT move the needle under software rendering — the cost is the
// rasterising of the gradient-filled triangles, not building their stop
// strings (caching them changed nothing). Kept only because it is free and
// the balance tips the other way on a real GPU, where the fills are cheap
// and per-frame JS allocation is the larger share.
const LUMEN20_STOPCACHE = new Map();
reg({
  id: 'SRC-38.20', family: 'SRC-38', ver: 20, title: 'Lumen Film V20', tech: 'GEM FILM / APERTURE ORGAN',
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
  tags: ['NO SMALL STONES', 'DENSITY HOLDS AT ANY SHAPE', 'SAME LIGHT', 'L TURNS THE GRADIENTS TOO'],
  desc: 'V18: the two smallest bands of stone are gone — the little ones were reading as grit against the big cut faces rather than as gems of their own. The floor of the size range lifts, the spread narrows from roughly four-to-one to under two-to-one, and because the weave is held as a fraction of the frame the count simply falls out of that: bigger stones, fewer of them, the same amount of picture under stone. — V17: the weave is now held as a fraction of the frame rather than a fixed number of stones, so it looks the same whatever shape the window or the projector is. Before this it did not: the stones are sized off the short side of the frame while the area grows with the long one, which means a set count quietly gets sparser the wider the window gets — the field that reads right in a long letterbox comes out close to twice as dense on a projector nearer square. The count is now solved from the coverage instead, so a stone stays the same size against the frame and the same fraction of the picture is stone at every shape. Everything else is V16. — V16: the stones are 40% smaller — they were reading too large once the frame went full screen. Two things had to move with them or the change would have taken the scene apart. There are more of them, 100 rather than 44, because area falls with the square of the radius and a thinned-out field both shows black between the stones and starves the lights, which only exist where two stones overlap. And the bursts keep their old size rather than shrinking along with their host, since the light was already where it wanted to be; fewer stones in a hundred are chosen to carry one, so the count of lights on screen stays about what it was. The result is a finer weave under the same lamp.',
  interact: 'R = LIGHT PRESSURE, unchanged — the lamp behind the sheet. Draw in and the film is closed, a dark faceted field and nothing else. Reach out and the bursts light one at a time, scattered anywhere in the frame, each on its own clock, each adding its held note to the chord. A burst always tells you before it commits — it leaks a little glow half a beat early, then blooms with its note on the sixteenth. L = ORIENTATION — an absolute dial: hand at the sphere and the crystals sit at rest; reach out and the whole field turns with your hand, up to a full turn at full reach, AND the gradients inside the stones lag round behind it, so the colour travels across the facets while they turn. Every burst sits on a real edge of a real stone and slides along it, so its rays swing with the geometry making them.',
  sound: 'An aperture organ. Every lit burst holds one voice — pitch by where it sits in the frame (high in the frame = high in the chord), stereo position by where it sits left to right — so the picture and the chord are the same object. Voices enter rolled low-to-high like a harp and each entrance is doubled by a glass bell (MIDI role: bells) on the sixteenth it commits. Fewer, larger bursts than before means a sparser, more deliberate chord. L still opens every voice filter together and detunes their partials. Underneath: a slow air bed and a root pedal that never moves. NO PERCUSSION. Ableton: pad = the burst voices (CC74 = L, velocity by height + lamp), bells = the glass doubles, texture = air (CC74 only), bass = the held D pedal, re-struck gently each chord. NO PERCUSSION. THE REST (V20): a closed film breathes - randomized low root swells (soft bass notes), an undulating air floor, and 1-in-7 a single deep glass toll into long reverb.',

  init(P) {
    const S = Math.min(P.w, P.h), w = P.w, h = P.h;
    // P.focused is still false during init — size off the area instead
    // DENSITY IS A COVERAGE FRACTION, NOT A COUNT. A fixed count only holds
    // its look at one window shape: the frame's area grows with width while
    // the stones are sized off min(w,h). Since (w*h)/min(w,h)^2 IS the aspect
    // ratio, a fixed count makes density track aspect directly — the same 64
    // stones that read right in a 2.9:1 window come out ~1.8x denser on a
    // 16:10 projector. So pick the count that puts a set fraction of the
    // frame under stone instead. A kite is 2*(0.78r)*(1.08r) = 1.6848 r^2,
    // and r is uniform over [R_LO,R_HI]*S, so E[r^2] = S^2*(lo^2+lo*d+d^2/3).
    // ...and SIZE is a fraction of the LONG side, not the short one. Sizing
    // off min(w,h) is what made the stones look too big full screen: the
    // same coefficient that gives a stone 9.9% of the frame width in a 2.9:1
    // window gives it 18.1% on a 16:10 projector, because the short side
    // grows when the shape squares up. Against the long side it is 9.9% in
    // both. Coefficients below are the old ones re-expressed against that
    // basis, so the full-window view is pixel-for-pixel what it was.
    const B = Math.max(P.w, P.h);
    // The two smallest size bands are gone. The radius was uniform over
    // 0.0153..0.0632 of the long side; split five ways that is bands of
    // 0.00958, so dropping the bottom two lifts the floor to 0.0345 and
    // leaves a 1.83x spread instead of 4.13x. Coverage is unchanged, so the
    // count falls out on its own — bigger stones, fewer of them: 83 rather
    // than 118 at 1920x1200, for the same fraction of the frame under stone
    // and therefore the same fill cost.
    const R_LO = 0.0345, R_HI = 0.0632, RD = R_HI - R_LO;
    const meanKite = 1.6848 * B * B * (R_LO * R_LO + R_LO * RD + RD * RD / 3);
    // 0.55 is the weave signed off in the full-window view. Tiles run thinner
    // — they are thumbnails and the wall draws a lot of them at once.
    const COVER = areaScale(P) > 1.6 ? 0.55 : 0.34;
    // Clamped only to stop a freak window shape starving the field or running
    // away with the count. The ceiling is high because the count is NOT what
    // costs: measured at one canvas, this version draws 114 stones at 6.7fps
    // while V16 drew 64 at 5.4 — more stones, cheaper, because sizing off the
    // long side makes each one so much smaller that total fill area drops.
    // Fill area is the bill here, not the number of draws.
    const N = Math.max(10, Math.min(130, Math.round(COVER * w * h / meanKite)));
    const cells = [];
    for (let i = 0; i < N; i++) {
      cells.push({
        x: P.rand() * w, y: P.rand() * h,
        r: B * (R_LO + P.rand() * RD),       // fraction of the LONG side
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
      // held down from 0.6 to keep the SAME number of lights on screen as
      // V15 (~23) now that there are nearly three times as many stones — the
      // sparse, deliberate spread is the part that was working. Roughly a
      // third of the stones that draw the ticket get rejected below for
      // having no anchor that sits inside a neighbour, so this runs a little
      // above the target rate.
      if (P.rand() > 0.55) continue;             // not every stone lights
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
        // divided through by the 0.6 shrink so the bursts and their rays
        // stay the size that was signed off, instead of quietly getting 40%
        // smaller along with the stone they sit on. Still scales with the
        // host, so a bigger stone still throws a bigger light.
        size: host.r * (0.83 + P.rand() * 1.92),
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
    const addSvgStops = (grad, a) => {
      let set = LUMEN20_STOPCACHE.get(a);
      if (!set) {
        set = SVGSTOPS.map(([t, rgb]) => [t, `rgba(${rgb},${a})`]);
        LUMEN20_STOPCACHE.set(a, set);
      }
      for (let i = 0; i < set.length; i++) grad.addColorStop(set[i][0], set[i][1]);
    };

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
      [0, 242, 255, 242, 1.32],
      [0.25, 37, 85, 238, 1.06],
      [0.55, 255, 214, 90, 0.6],
      [0.82, 225, 61, 47, 0.2],
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
        // ALL FOUR RAYS ARE BUILT THE SAME WAY. The cross pair stays short
        // and a little thinner, but it gets the identical falloff, colour
        // split and fading tail — drawing it as one flat stroke is what left
        // it stopping at a hard edge.
        const dirs = [
          { a: eAng, len: 1, w: 0.475, wMin: 4.5, av: 0.27 },
          { a: eAng + Math.PI, len: 1, w: 0.475, wMin: 4.5, av: 0.27 },
          { a: eAng + Math.PI / 2, len: 0.4, w: 0.22, wMin: 3, av: 0.19 },
          { a: eAng - Math.PI / 2, len: 0.4, w: 0.22, wMin: 3, av: 0.19 }
        ];
        g.lineCap = 'round';
        for (const dr of dirs) {
          const Ln = L * dr.len, cx = Math.cos(dr.a) * Ln, cy = Math.sin(dr.a) * Ln;
          const ex = sx + cx, ey = sy + cy;
          // wide beams cover a lot of ground, so each pass stays faint
          const av = p.open * dr.av * bright;
          const coreW = Math.max(dr.wMin * ms, R * dr.w * p.open);
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
          // the soft outer falloff — widest and faintest. Held back while
          // the rest was brightened: this is the pass that covers the most
          // ground, so it is what washes the frame out if it climbs too.
          g.strokeStyle = mkGrad(0.26);
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
          // a hot thread down the middle so the beam still has a core
          g.strokeStyle = mkGrad(1.6);
          g.lineWidth = Math.max(2.4 * ms, coreW * 0.2);
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        }
        g.lineCap = 'butt';
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
    const setV = (vc, freq, glide, vel) => {
      if (!isFinite(freq) || freq <= 20) return;
      vc.freq = freq;
      if (vel !== undefined) vc.vel = vel;
      A.set(vc.o1.frequency, freq, glide);
      A.set(vc.o2.frequency, freq, glide);
      A.set(vc.o3.frequency, freq * 2.01, glide);
      if (typeof MOut !== 'undefined') {
        const note = MOut.f2n(freq);
        if (note !== vc.note) {
          // velocity is the entrance's, kept across chord retunes -- height
          // in frame + lamp wrote it; flat 62 was a machine
          const kv = Math.max(1, Math.min(120, Math.round(vc.vel || 62)));
          const ch = MOut.chFor('pad'), p = performance.now();
          if (vc.note >= 0 && MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0], p); } catch (e) {} }
          vc.note = note;
          MOut.log.push({ p, role: 'pad', ch, note, vel: kv, durMs: 2600 });
          if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, kv], p); } catch (e) {} }
        }
      }
    };

    /* --- the pedal ------------------------------------------------------ */
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.014, cutoff: 220, q: 0.5, midi: false });
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
    // THE PEDAL IS A BASS NOTE (the scene's own brief): D2 on SYNTH BASS,
    // held a chord long, re-struck softly at each change -- the browser sub
    // keeps its deeper D1 as color. Lamp writes the strike velocity.
    const bassPedal = () => {
      if (typeof MOut === 'undefined') return;
      const hold = Math.max(4, 4 * T.beat * (H.chordBars || 4) + 0.3);
      MOut.evNote('bass', H.rootFreq(-1), (0.06 + 0.05 * (s0.lamp || 0)) * (0.45 + 0.55 * (s0.pres || 0)), 0, hold);
    };
    retune(0.05);
    bassPedal();
    H.onChord(() => { retune(0.2); bassPedal(); });
    v.fadeIn(1, 1.6);
    // THE REST: the closed film breathes on its own clock
    let nextBreath = A.t() + 4 + Math.random() * 6;

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const thick = s.thick || 0;

        // the idle air undulates on two incommensurate LFOs -- never dead,
        // never constant (the lure law); presence hands the floor back to
        // the lamp
        const und = 0.5 + 0.3 * Math.sin(now * 0.21) + 0.2 * Math.sin(now * 0.13 + 1.4);
        A.set(ng.gain, (0.003 + s.lamp * 0.012) * gate + (1 - s.pres) * 0.0035 * und, 0.4);
        A.set(nf.frequency, 360 + s.lamp * 1500 + thick * 400, 0.4);
        sub[0].level(0.01 + s.lamp * 0.008 + (1 - s.pres) * 0.004 * und, 0.5);
        /* THE REST: randomized low breaths, 1-in-7 a deep glass toll --
           rolled per breath, pushed away by presence, never a metronome */
        if (s.pres < 0.25) {
          if (now >= nextBreath) {
            const deep = Math.random() < 1 / 7;
            const bvol = (0.04 + Math.random() * 0.04) * (deep ? 1.5 : 1);
            A.tone(H.rootFreq(-1), { at: now + 0.05, vol: bvol, dur: 2.5 + Math.random() * 3, attack: 1 + Math.random() * 1.2, type: 'triangle', rev: 0.55, role: 'bass' });
            if (deep) A.bell(H.chordTone(0, 0), { at: now + 0.15, vol: 0.045, dur: 6, rev: 0.85 });
            nextBreath = now + 8 + Math.random() * 14;
          }
        } else nextBreath = Math.max(nextBreath, now + 5);

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
            // velocity presence-scaled: the drift's idle organ must reach
            // the rack as a whisper, not a performance (browser gain is
            // already gated 25% at rest; the mirror follows)
            setV(vc, H.chordTone(deg, oct), 0.08, (52 + 26 * s.lamp + 12 * up) * (0.4 + 0.6 * s.pres));
            if (vc.pan) A.set(vc.pan.pan, clamp(p.x / P.w * 2 - 1, -1, 1) * 0.7, 0.2);
            const at = T.next(0.25) + p.voice * 0.012;   // low-to-high harp stagger
            A.set(vc.g.gain, 0.024 + thick * 0.012, 0.35);
            A.bell(H.chordTone(deg + 3, oct + 1), { at, vol: (0.04 + 0.03 * up) * gate, dur: 2.4, pan: clamp(p.x / P.w * 2 - 1, -1, 1) * 0.8, rev: 0.7 });
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
          MOut.expr('bass', 0.35 + 0.65 * s.lamp);
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
