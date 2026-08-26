/* ---------- SRC-46 · PENROSE BLOOM (a quasicrystal grown from one seed) -----
   Nima's reference plate: a Penrose kite-and-dart tiling — five-fold rosettes,
   blue rhombs against gold ones, order that never repeats. The plate is a
   finished, static, cream-coloured diagram. What makes it a SCENE is the one
   thing the plate cannot show you: the tiling has to be GROWN, and a Penrose
   tiling only grows one way — outward from a seed, by deflation, each new
   shell forced by the shells already placed. So the hands grow it.

   The geometry is the real thing, not a lookalike: ten Robinson triangles in
   a wheel, subdivided by the golden ratio N times (`pbDeflate`). Every tile
   the algorithm hands back is sorted by how far its centre sits from the
   seed, and a single radius — the FRONT — sweeps that sorted list. A tile the
   front has passed is crystallised and lit; a tile it has not reached is not
   there yet. That is the whole mechanic, and it reads in about a second.

   Colour is Ferro Bloom's palette, verbatim and in its order — ember, blush,
   orchid, chartreuse (the pivot), teal, lavender, electric blue — but hue
   never comes from screen position (law 3). It comes from the tiling's OWN
   structure: in a Penrose tiling every tile points one of exactly ten ways,
   so orientation × tile type picks the colour. That is why the colour lands
   in fives and clusters into rosettes instead of smearing across the frame,
   the same way the reference plate's blues and golds do.                    */

const PB_PHI = (1 + Math.sqrt(5)) / 2;
const PB_INV = 1 / PB_PHI;

/* the wheel of ten thin Robinson triangles — a decagonal "sun" seed */
function pbSeed() {
  const tris = [];
  for (let i = 0; i < 10; i++) {
    let b = [Math.cos((2 * i - 1) * Math.PI / 10), Math.sin((2 * i - 1) * Math.PI / 10)];
    let c = [Math.cos((2 * i + 1) * Math.PI / 10), Math.sin((2 * i + 1) * Math.PI / 10)];
    if (i % 2 === 0) { const q = b; b = c; c = q; }   // mirror every other one
    tris.push({ t: 0, a: [0, 0], b, c });
  }
  return tris;
}

/* one deflation step: thin → thin + fat, fat → fat + fat + thin, all cuts at
   1/φ along an edge. This is the aperiodicity — nothing here is a grid. */
function pbDeflate(tris) {
  const out = [];
  const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
  for (const T of tris) {
    const a = T.a, b = T.b, c = T.c;
    if (T.t === 0) {
      const P = lerp(a, b, PB_INV);
      out.push({ t: 0, a: c, b: P, c: b });
      out.push({ t: 1, a: P, b: c, c: a });
    } else {
      const Q = lerp(b, a, PB_INV);
      const R = lerp(b, c, PB_INV);
      out.push({ t: 1, a: R, b: c, c: a });
      out.push({ t: 1, a: Q, b: R, c: b });
      out.push({ t: 0, a: R, b: Q, c: a });
    }
  }
  return out;
}

/* FERRO BLOOM'S PALETTE, warm → cool, exactly as SRC-15 orders it */
const PB_PAL = [
  [250, 158, 87],    // ember orange — warmest
  [242, 140, 158],   // blush pink
  [255, 87, 212],    // hot orchid
  [224, 255, 41],    // acid chartreuse — the pivot
  [41, 140, 148],    // teal
  [148, 143, 230],   // lavender
  [0, 67, 255]       // electric blue — coolest
];
function pbCol(pos) {
  const x = clamp(pos) * (PB_PAL.length - 1);
  const i = Math.min(PB_PAL.length - 2, Math.floor(x)), f = x - i;
  const a = PB_PAL[i], b = PB_PAL[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

const PB_CACHE = {};
function pbTiles(levels) {
  if (PB_CACHE[levels]) return PB_CACHE[levels];
  let tris = pbSeed();
  for (let i = 0; i < levels; i++) tris = pbDeflate(tris);
  const out = [];
  let maxR = 0, minR = 1e9;
  for (const T of tris) {
    const cx = (T.a[0] + T.b[0] + T.c[0]) / 3, cy = (T.a[1] + T.b[1] + T.c[1]) / 3;
    const r = Math.hypot(cx, cy);
    if (r > maxR) maxR = r;
    if (r < minR) minR = r;
    // apex-away-from-base = the tile's orientation; ten of them, always
    const ang = Math.atan2(T.a[1] - (T.b[1] + T.c[1]) / 2, T.a[0] - (T.b[0] + T.c[0]) / 2);
    const dir = ((Math.round(ang / (TAU / 10)) % 10) + 10) % 10;
    out.push({ x: [T.a[0], T.b[0], T.c[0]], y: [T.a[1], T.b[1], T.c[1]], t: T.t, cx, cy, r, dir });
  }
  // the front is a 0..1 sweep of the SORTED list, so it has to mean the same
  // thing at every deflation depth: rescale so the innermost shell sits at 0
  // and the outermost at 1. without this a coarse tile (fewer, bigger tiles,
  // all of them further from the centre) opens on an empty frame.
  const span = 1 / ((maxR - minR) || 1);
  for (const o of out) {
    o.r = (o.r - minR) * span;
    // colour class: FIVE, not ten. a tile and its mirror partner across a
    // rhomb's diagonal point opposite ways, so keying on all ten orientations
    // shatters every rhomb into two colours and the picture reads as confetti.
    // folding to five lets the rhombs and the rosettes hold one colour, the
    // way the reference plate's blue kites and gold darts do.
    o.cls = (((o.dir * 2) % 5) / 4) * 0.80 + (o.t ? 0.20 : 0);
  }
  out.sort((p, q) => p.r - q.r);   // the front walks this list, and only this
  out.rMin = minR; out.rSpan = maxR - minR;   // front 0..1 → actual disc radius
  PB_CACHE[levels] = out;
  return out;
}

reg({
  id: 'SRC-46', family: 'SRC-46', ver: 1,
  title: 'Penrose Bloom', tech: 'PENROSE DEFLATION / GROWTH FRONT',
  music: {
    bpm: 88, root: 50, mode: 'aeolian', chordBars: 2,
    // one D pedal, four colours over it — a crystal has one centre, so the
    // harmony keeps one root and lets the extensions do the moving
    chords: [
      [0, 7, 10, 15, 17],   // Dm11
      [0, 7, 10, 14, 21],   // Dm13      — the E rubbing against the F above
      [0, 8, 10, 15, 19],   // B♭maj9/D
      [0, 5, 8, 10, 15]     // Gm11/D
    ],
    chordNames: ['Dm11', 'Dm13', 'B♭maj9/D', 'Gm11/D']
  },
  fx: { bloom: 0.4 },
  tags: ['GROWS FROM THE SEED OUT', 'FIVE-FOLD, NEVER REPEATS', 'FERRO BLOOM PALETTE', 'THE ARP IS QUASIPERIODIC TOO'],
  desc: 'A Penrose tiling — the real one, five-fold and aperiodic, kites and darts cut at the golden ratio — grown live out of a single seed at the centre of the frame. Reach and the crystal accretes outward in shells: a ring of tiles snaps into place, rings and holds, and the next ring is already forced by the one before it. Pull back and the outer shells dissolve again, leaving the ten-fold rosette burning at the middle. The colour is Ferro Bloom\'s: ember orange and blush pink at the warm end, hot orchid, acid chartreuse as the pivot, teal, lavender, electric blue at the cool end — but it is dealt out by the tiling\'s own structure, not by where a tile sits on screen. Every Penrose tile points one of exactly ten ways, so orientation picks the hue and the colour lands in fives, clustering into rosettes the way the plate does. Left hand heats the whole ramp: the crystal slides from cool blue lattice to burning ember plates, edges to solid light.',
  interact: 'RIGHT HAND GROWS IT. Reach out and the crystallisation front sweeps outward from the seed; every tile it crosses flashes white at its edges and rings a bell. Draw the hand back and the front retreats — the outer shells fade out, and the ten-fold rosette at the centre is what is left. Full reach floods the frame past the corners. LEFT HAND IS THE HEAT: drawn in, the tiling is a cool lattice of dim plates with luminous edges; reach out and the whole palette slides warm and the plates fill in and burn. Heat also earns the subdivision — the lattice ticks in quarters, then eighths, then sixteenths as it gets hotter. Grow past half the frame and the arp arrives; past three quarters and the kit comes in under it. Left hand alone, with nothing grown, still heats the seed rosette: no hand position is dead.',
  sound: 'Pinned to a D minor pedal so a live player can sit in (chord name on the HUD). DRONE: three glide voices voice-led on the chord plus a sub D and a band of air that opens as the crystal spreads. REACTIVE: every tile the front crosses rings a bell, quantised to the sixteenth, pitched by how far out it landed — the crystal literally climbs as it grows — and panned to the side of the frame it appeared on. QUANTISED: past ~52% growth an arp walks the chord ladder on a GOLDEN-RATIO sequence, so like the tiling it never repeats; past ~74% a kick and hat come in under it. Ableton: bells ch15 (births), arp ch14 (the lattice tick), pad ch5 + bass ch3 (drone and sub), perc ch1 (kick 36 / hat 42). CC74: pad = growth, arp = heat, bells = how fast the front is moving.',

  init(P) {
    const as = areaScale(P);
    // tile size, not tile count, is what has to survive the mesh — pick the
    // deflation depth that keeps an edge fat at the size we are actually drawn
    const levels = as > 3.2 ? 5 : as > 1.7 ? 4 : 3;
    const tiles = pbTiles(levels);
    P.state = {
      tiles, n: 0, levels,
      pres: 0, reach: 0, heat: 0, front: 0.16, vel: 0,
      lit: new Float32Array(tiles.length),
      fl: new Float32Array(tiles.length),
      evq: [], teaseq: [], twk: 1.8,
      nextT: 0, step16: 0, arpI: 0
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, N = s.tiles.length;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    // presence rises quickly, falls slowly — a hand held still is not absent
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 2.2 : 0.4));
    s.reach += (clamp(inp.R) - s.reach) * Math.min(1, dt * 5);
    s.heat += (clamp(inp.L) - s.heat) * Math.min(1, dt * 6);

    const idle = 0.20 + 0.055 * Math.sin(t * 0.21) + 0.03 * Math.sin(t * 0.083);
    const played = 0.13 + s.reach * 1.02;
    const ft = idle + (played - idle) * s.pres;
    const prev = s.front;
    s.front += (ft - s.front) * Math.min(1, dt * 3.4);
    s.vel = dt > 0 ? (s.front - prev) / dt : 0;

    // THE FRONT. tiles are sorted by radius, so growth is one pointer moving.
    while (s.n < N && s.tiles[s.n].r <= s.front) {
      s.fl[s.n] = 1;
      if (s.evq.length < 48) s.evq.push(s.n);
      s.n++;
    }
    while (s.n > 0 && s.tiles[s.n - 1].r > s.front) s.n--;

    const up = Math.min(1, dt * 7), dn = Math.min(1, dt * 2.4), fd = Math.min(1, dt * 3.2);
    for (let i = 0; i < N; i++) {
      const tgt = i < s.n ? 1 : 0;
      s.lit[i] += (tgt - s.lit[i]) * (tgt ? up : dn);
      if (s.fl[i] > 0.001) s.fl[i] -= s.fl[i] * fd;
    }

    // the sleeping crystal winks — a tease that shows what a hand would do
    s.twk -= dt;
    if (s.twk <= 0) {
      s.twk = 2.4 + P.rand() * 3.6;
      if (s.n > 2) {
        const k = (P.rand() * s.n) | 0;
        s.fl[k] = 1;
        if (s.pres < 0.4 && s.teaseq.length < 3) s.teaseq.push(k);
      }
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, N = s.tiles.length;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const R = Math.hypot(w, h) * 0.52;      // full reach floods past the corners
    const bright = 0.45 + s.pres * 0.55;

    // the deep well the crystal sits in (Ferro Bloom's deep blue)
    g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    gr.addColorStop(0, `rgba(18,30,92,${0.34 * bright})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';

    // TILES. paint, not light — they lie over each other, they do not add up
    const lw = Math.max(2.6, 2.6 * ms);
    // the plates NEVER become a flood: heat roughly doubles a low fill, it
    // does not fill the frame. the edges stay the light.
    const fillA = 0.13 + s.heat * 0.14;
    const edgeA = 0.44 + s.heat * 0.24;
    g.lineJoin = 'round';
    for (let i = 0; i < N; i++) {
      const l = s.lit[i];
      if (l < 0.02) continue;
      const tl = s.tiles[i];
      const a = l * bright;
      const shim = 0.72 + 0.28 * Math.sin(tl.r * 17 - t * 0.75 + tl.dir * 0.63);
      // heat slides the ramp warm but never collapses it — the core burns
      // ember while the rim stays teal and lavender, Ferro Bloom's own split
      const c = pbCol(tl.cls * 0.32 + tl.r * 0.56 - s.heat * 0.22 + 0.06);
      const f = s.fl[i];
      g.beginPath();
      g.moveTo(cx + tl.x[0] * R, cy + tl.y[0] * R);
      g.lineTo(cx + tl.x[1] * R, cy + tl.y[1] * R);
      g.lineTo(cx + tl.x[2] * R, cy + tl.y[2] * R);
      g.closePath();
      const r0 = c[0] | 0, g0 = c[1] | 0, b0 = c[2] | 0;
      g.fillStyle = `rgba(${r0},${g0},${b0},${fillA * shim * a})`;
      g.fill();
      if (f > 0.02) {
        // the moment of crystallisation: the edge goes to white and fattens
        const wf = f * 0.8;   // hot, but never bleached to paper white
        g.lineWidth = lw * (1 + f * 0.9);
        g.strokeStyle = `rgba(${(r0 + (255 - r0) * wf) | 0},${(g0 + (246 - g0) * wf) | 0},${(b0 + (218 - b0) * wf) | 0},${a * (edgeA + 0.46 * f)})`;
      } else {
        g.lineWidth = lw;
        g.strokeStyle = `rgba(${r0},${g0},${b0},${a * edgeA})`;
      }
      g.stroke();
    }

    // the crystallisation front itself — brightest when it is actually moving
    g.globalCompositeOperation = 'lighter';
    const fr = (s.tiles.rMin + clamp(s.front, 0, 1.06) * s.tiles.rSpan) * R;
    if (fr > R * 0.03) {
      const rg = g.createRadialGradient(cx, cy, Math.max(0, fr - R * 0.11), cx, cy, fr + R * 0.07);
      rg.addColorStop(0, 'rgba(255,214,168,0)');
      rg.addColorStop(0.7, `rgba(255,206,150,${(0.09 + clamp(Math.abs(s.vel) * 1.5) * 0.30) * bright})`);
      rg.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(cx, cy, fr + R * 0.07, 0, TAU); g.fill();
    }
    // the seed
    const sr = R * (0.11 + s.heat * 0.09);
    const sg = g.createRadialGradient(cx, cy, 0, cx, cy, sr);
    sg.addColorStop(0, `rgba(255,214,168,${(0.09 + s.heat * 0.14) * bright})`);
    sg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = sg;
    g.beginPath(); g.arc(cx, cy, sr, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(226,200,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('PENROSE  FRONT ' + s.front.toFixed(2) + '  TILES ' + s.n + '/' + N +
      '  HEAT ' + Math.round(s.heat * 100) + '  ' + (H.label || '') +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- air moving through the lattice --------------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 480, 1.2), ng = v.g(0.005);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- the pedal: one root, the colour above it moving ---------------- */
    const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.010, cutoff: 320, q: 0.8 });
    const place = gl => {
      pad[0].set(H.rootFreq(-2), gl);
      pad[1].set(H.chordTone(1, -1), gl);
      pad[2].set(H.chordTone(3, 0), gl);
    };
    place(0.05);
    H.onChord(() => place(0.3));
    v.fadeIn(1, 1.6);

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.3 + s.pres * 0.7;

        A.set(ng.gain, (0.003 + s.front * 0.004 + s.heat * 0.004) * gate, 0.35);
        A.set(nf.frequency, 380 + s.front * 900 + s.heat * 1400, 0.35);
        for (const p of pad) {
          p.level((0.006 + s.front * 0.006 + s.heat * 0.004) * gate, 0.5);
          p.bright(200 + s.heat * 1500 + s.front * 500, 0.4);
        }

        /* ---- BIRTHS: the front crossing a tile rings it. quantised to the
           sixteenth, pitched by how far out it landed, panned to its side. */
        let i = 0;
        while (s.evq.length && i < 3) {
          const tl = s.tiles[s.evq.shift()];
          i++;
          const at = T.next(0.25);
          const deg = Math.round(tl.r * 8) + (tl.t ? 2 : 0);
          A.bell(H.chordTone(deg, tl.r > 0.62 ? 1 : 0), {
            at, vol: (0.028 + s.heat * 0.036) * gate * (1 - tl.r * 0.3),
            dur: 1.2 + (1 - tl.r) * 1.6, pan: clamp(tl.cx, -1, 1) * 0.62,
            rev: 0.62, role: 'bells'
          });
        }
        /* ---- the sleeping crystal's wink gets a single soft bell -------- */
        while (s.teaseq.length) {
          const tl = s.tiles[s.teaseq.shift()];
          A.bell(H.chordTone(Math.round(tl.r * 6) + 2, 1), {
            at: T.next(0.5), vol: 0.020, dur: 3.0,
            pan: clamp(tl.cx, -1, 1) * 0.5, rev: 0.8, role: 'bells'
          });
        }

        /* ---- THE LATTICE TICKS ----------------------------------------- */
        if (!s.nextT || s.nextT < now - 0.6) { s.nextT = T.next(0.25); s.step16 = 0; }
        const horizon = now + 0.15;
        let guard = 0;
        while (s.nextT < horizon && guard++ < 32) {
          const st = s.step16 % 16, at = s.nextT;
          const sub = s.heat < 0.34 ? 4 : s.heat < 0.68 ? 2 : 1;   // heat earns the grid
          if (s.front > 0.52 && st % sub === 0) {
            // golden-ratio walk: like the tiling itself, it never repeats
            s.arpI++;
            const deg = 1 + Math.floor(((s.arpI * PB_PHI) % 1) * 8);
            A.pluck2(H.chordTone(deg, 0), {
              at, vol: (0.026 + s.heat * 0.028) * gate * clamp((s.front - 0.52) / 0.34),
              dur: 0.7, pan: (st % 8 < 4 ? -0.42 : 0.42), rev: 0.4, del: 0.2, role: 'arp'
            });
          }
          if (st === 0 && (s.step16 % 32) === 0) {
            A.bassNote(H.rootFreq(-2), { at, vol: 0.10 + s.front * 0.06, dur: 2.4, role: 'bass' });
          }
          if (s.front > 0.74 && s.pres > 0.4) {
            const gv = clamp((s.front - 0.74) / 0.26);
            if (st === 0 || st === 10) A.kick(at, 0.15 * gv * gate);
            if (st % 4 === 2) A.hat(at, { vol: 0.030 * gv * gate });
          }
          s.step16++;
          s.nextT += T.beat * 0.25;
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', clamp(s.front));
          MOut.expr('arp', s.heat);
          MOut.expr('bells', clamp(Math.abs(s.vel) * 1.5));
          MOut.expr('bass', clamp(s.front * 0.6 + s.heat * 0.4));
        }
      },
      stop() { v.kill(); }
    };
  }
});
