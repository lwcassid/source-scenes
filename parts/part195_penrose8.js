/* ---------- SRC-46.8 · PENROSE BLOOM V8 (the paper comes back) --------------
   Nima, on V7: "the parts of the visual that are just gray geometry" — and,
   after looking at three prototypes side by side, "K (1+3) is the approach,
   with the caveat that the inside of the geometry should also be filled up
   (but lower opacity than the rest of the filled up ones) with the
   colour/hue of the borders."

   V7 painted the rosettes and left everything else as a grey web on black.
   The reference plate is about 60% BARE PAPER, and paper is a material —
   toned, warm, grained — so inverting it to black deleted more than half the
   picture and left only lines. Three changes, all of them structure or
   material, none of them a new mechanic or a new control:

   1. TWO ORDERS OF LINE. Every Robinson triangle is isoceles — fat 1/1/φ,
      thin 1/φ/φ — so its ODD edge is the rhomb's internal diagonal, with no
      convention to get wrong: 1190 such edges at depth 6, of which 1140 are
      shared by exactly two triangles OF THE SAME TYPE, i.e. a rhomb glued
      from two congruent halves. `pb8Diag` finds them once per depth. The
      rhomb's own two sides keep full ink; the diagonal drops to 40% weight
      and 38% alpha. 1140 lines fall out of the noise and the field stops
      being a triangle mesh and starts being kites and darts — which is what
      the plate is a picture of. (Removing one edge of a triangle always
      leaves a CONNECTED two-edge polyline, so the corner is still a real
      join and still pools.)

   2. THE PEN POOLS AT EVERY JUNCTION. `pb8Verts` gives the 1211 unique
      vertices and how many tile-corners meet at each — 460 fours, 430 sixes,
      151 tens, 100 eights, a few threes and fives on the rim. The plate has
      a dark blob wherever the nib stopped; on black that is a bright one,
      sized and lit BY VALENCE, so the ten-way sun vertices are the brightest
      points on the plate and a rosette is legible in the bare field before
      any wash reaches it. Three valence buckets, three fills — the cost of
      1211 dots is three paths.

   3. THE FIELD IS PAPER, NOT A HOLE. Every diamond now carries a wash, not
      just the rosettes and V7's one-in-eight strays: the field takes the
      colour of its OWN INK — the plate's warm cream — at about a quarter of
      a rosette's opacity, so the lattice sits on a toned sheet instead of
      floating on black. `pb8Wash` gives field tiles a real base load where
      V7 gave them zero, and the field's rim is cut to 40% because the ink
      line is already there and two edges on one boundary just fattens the
      lattice. Costs contrast on mesh — that is the honest trade for having
      paper at all, and it rides `exc` like everything else, so the quiet
      plate stays nearly black and only a loud one is fully sized.

   The Ammann bars — the five families of straight rulings that ARE in this
   tiling (project the vertices onto any axis normal and 1211 of them collapse
   onto 83 levels spaced in a φ-ratio Fibonacci chain) — were prototyped and
   deliberately NOT shipped here: at close range they cut across the rhombs
   and undo what change 1 just clarified, and being low-alpha thin lines they
   are the element most likely to vanish on mosquito net. They are a separate
   version to judge on the actual wall.
   (V7 notes below.) ------------------------------------------------------ */
/* ---------- SRC-46.7 · PENROSE BLOOM V7 (ink and wash on paper) ------------
   Nima, with the reference plate a third time: "add similar textures as you
   see in the reference image — we may need to use some shaders for it."

   The plate has never been a vector drawing. It is PIGMENT ON PAPER: every
   diamond outlined in ink, some of them washed with a colour that dried
   unevenly — heavier where the brush stopped, granulated by the sheet's own
   tooth, wicked a little way past the line it was meant to stay inside. V6
   painted the same geometry with flat fills and clean strokes, which is why
   it read as a diagram of the plate rather than the plate.

   V7 changes only HOW A TILE IS PAINTED. Geometry, growth, the rosette
   families, the spectrum's colour deal, spin and elasticity are V6's, line
   for line. Four things happen to the paint:

   1. THE PAPER. `pb7Paper` bakes a seamless 384px sheet of periodic value
      noise with a drawn-out FIBRE in one axis — a laid sheet's grain — once
      per session, and lays it over the wash layer with `source-atop`, so it
      darkens only where pigment actually sits and never fogs the black. It
      is pinned to the SCREEN, not to the plate: the crystal turns across the
      paper, which is exactly what the scrim is.

   2. THE WASH IS ONE STROKE PER ROSETTE. `pb7Wash` measures every tile's
      distance to its own sun vertex — the same suns V4's families come from,
      but keeping the distance V4 threw away — and loads each tile with
      pigment that is heaviest at the star's heart and dries out toward its
      points. Ten tiles of a rosette therefore share one gradation across the
      whole star instead of ten equal fills, and the wash reads as a single
      brushstroke laid over its own linework (law 8, at rosette scale). A
      stable one-in-eight of the FIELD tiles catches a faint wash too: a
      perfectly clean field is a diagram, and the plate has these strays.

   3. PIGMENT POOLS AT THE EDGE, AND POOLED PIGMENT IS STRONGER. A wash dries
      darker where it stops. Inverted onto black that is a BRIGHT RIM around
      a dimmer body — which is law 3, dark mass and luminous edge, arrived at
      by being honest about watercolour. The body takes the chalky version of
      the ramp's colour (`pb7Pig` — pigment is never neon) and the rim takes
      the ramp's colour undiluted, so each diamond also gains chroma toward
      its own edge the way real edge-darkening does.

   4. THE PAPER SUCKS THE WASH PAST THE LINE. The whole wash layer composites
      TWICE — once through a blur, once sharp — so every wash carries the
      halo of pigment wicking into fibre, while the ink lattice stays crisp
      on top of it. Soft wash under hard line is the whole tell of ink and
      wash; V6 had neither half.

   And the ink stops being one weight: each tile's line takes a stable
   multiplier off its index, so the lattice has the wobble of a hand instead
   of the evenness of a plotter. TEXTURE RIDES EXCITEMENT with everything
   else — quiet, the plate is nearly bare paper and grain; loud, the washes
   flood and pool. No new control, no new mechanic, no sound. The hands still
   spin (CC1) and stretch (CC2) exactly as they did.
   (V6 notes are in part181; V5/V4/V3/V2/V1 below them.) ------------------ */

/* `pb7Paper`, `pb7Hash` and `pb7Pig` are V7's, reused as-is from part194 —
   the sheet, the hash and the pigment law are properties of the medium, not
   of a version. `pb4Rose` is still V4's. Only the wash LOADS change here, so
   `pb8Wash` replaces `pb7Wash` rather than editing it. */

/* the rhomb's internal diagonal: each triangle's ODD-length edge. Cached per
   depth — which edge is a diagonal is a property of the geometry. */
const PB8_D = {};
function pb8Diag(tiles, levels) {
  if (PB8_D[levels]) return PB8_D[levels];
  const d = new Uint8Array(tiles.length);
  for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    const L = [0, 1, 2].map(k => {
      const j = (k + 1) % 3;
      return Math.hypot(t.x[k] - t.x[j], t.y[k] - t.y[j]);
    });
    d[i] = Math.abs(L[0] - L[1]) < 1e-6 ? 2 : Math.abs(L[1] - L[2]) < 1e-6 ? 0 : 1;
  }
  PB8_D[levels] = d;
  return d;
}

/* the unique vertices and their valence — how many tile-corners meet there.
   The tens are the suns, and they are what makes a rosette readable with no
   colour in it at all. */
const PB8_V = {};
function pb8Verts(tiles, levels) {
  if (PB8_V[levels]) return PB8_V[levels];
  const M = new Map();
  for (const t of tiles) {
    for (let i = 0; i < 3; i++) {
      const k = Math.round(t.x[i] * 1e4) + ',' + Math.round(t.y[i] * 1e4);
      let v = M.get(k);
      if (!v) { v = { x: t.x[i], y: t.y[i], n: 0 }; M.set(k, v); }
      v.n++;
    }
  }
  const n = M.size;
  const o = { x: new Float32Array(n), y: new Float32Array(n), v: new Uint8Array(n), r: new Float32Array(n) };
  let i = 0;
  for (const [, v] of M) { o.x[i] = v.x; o.y[i] = v.y; o.v[i] = v.n; o.r[i] = Math.hypot(v.x, v.y); i++; }
  PB8_V[levels] = o;
  return o;
}

/* V7's wash loads, with the FIELD no longer at zero. Every diamond carries
   paper tone; the one-in-eight that caught the brush still carries a real
   wash on top of it, and `stray` marks them so only they get a pooled rim. */
const PB8_W = {};
function pb8Wash(tiles, levels, rose) {
  if (PB8_W[levels]) return PB8_W[levels];
  const vt = new Map();
  for (const T of tiles) {
    for (let i = 0; i < 3; i++) {
      const k = Math.round(T.x[i] * 1e4) + ',' + Math.round(T.y[i] * 1e4);
      let v = vt.get(k);
      if (!v) { v = [0, 0]; vt.set(k, v); }
      v[T.t]++;
    }
  }
  const suns = [];
  for (const [k, v] of vt) {
    if (v[0] === 0 && v[1] === 10) { const p = k.split(','); suns.push([+p[0] / 1e4, +p[1] / 1e4]); }
  }
  let e = 1e9;
  for (const T of tiles) {
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3;
      const dd = Math.hypot(T.x[i] - T.x[j], T.y[i] - T.y[j]);
      if (dd < e) e = dd;
    }
  }
  const d = new Float32Array(tiles.length), st = new Uint8Array(tiles.length);
  for (let i = 0; i < tiles.length; i++) {
    const T = tiles[i];
    let best = 1e9;
    for (const sn of suns) {
      const dd = Math.hypot(T.cx - sn[0], T.cy - sn[1]);
      if (dd < best) best = dd;
    }
    const r = best / (e || 1), hsh = pb7Hash(i * 3 + 11);
    if (rose[i]) {
      d[i] = Math.max(0, Math.min(1, (1 - r / 2.7) * (0.60 + 0.40 * hsh) + 0.20));
      st[i] = 1;
    } else if (hsh > 0.87) {
      d[i] = 0.16 + 0.26 * pb7Hash(i + 7777);
      st[i] = 1;                                  // the stray that caught the brush
    } else {
      // BARE PAPER IS STILL PAPER: a tone every diamond carries, uneven the
      // way a sheet is, and nothing like a rosette's load.
      d[i] = 0.62 + 0.38 * pb7Hash(i + 313);
    }
  }
  d.edge = e; d.stray = st;
  PB8_W[levels] = d;
  return d;
}

reg({
  id: 'SRC-46.8', family: 'SRC-46', ver: 8,
  title: 'Penrose Bloom V8', tech: 'PENROSE DEFLATION / INK + WASH ON PAPER / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'CC1 = SPIN', 'CC2 = ELASTICITY', 'KITES AND DARTS', 'THE PEN POOLS', 'PAPER EVERYWHERE'],
  desc: 'V7\'s ink and wash, with the bare geometry finally doing some work. Three changes, no new controls. The rhomb\'s own two sides now carry full ink and its internal diagonal drops back, so the field reads as kites and darts instead of a triangle mesh — the thing the reference plate is actually a picture of. Every junction pools like a nib that stopped, sized by how many tiles meet there, so the ten-way sun vertices are the brightest points and a rosette is legible in the bare field before any colour reaches it. And the field is no longer a hole: every diamond carries a wash in the colour of its own ink, at about a quarter of a rosette\'s opacity, so the lattice sits on a toned sheet rather than floating on black. Everything the music does is unchanged — loudness grows the crystal, the spectrum paints it, and the whole treatment rides excitement, so a quiet plate is still nearly black.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music grows the crystal and paints it; the hands play the GEOMETRY. LEFT HAND / CC1 IS SPIN: the whole plate turns about its seed, from still to a revolution every eleven seconds, with the fine control at the bottom of the throw. RIGHT HAND / CC2 IS ELASTICITY: at zero the lattice is a rigid crystal, and as it opens a wave runs outward through the structure and the diamonds squash and stretch — the kick then matters twice, once as the ring of light it always was and again as a ripple through the rubber. Both hands settle when nobody is playing.',
  sound: 'Makes no sound of its own — an audio-in scene, the same as Cell Front V4-V11. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. Built for a full spectrum: it wants a kick under a bassline, and it shows a change in the harmonic balance as a re-deal of the colours. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const levels = as > 3.2 ? 6 : as > 1.7 ? 5 : 4;
    const tiles = pbTiles(levels);
    const rose = pb4Rose(tiles, levels);
    P.state = {
      tiles, rose, wash: pb8Wash(tiles, levels, rose), paper: pb7Paper(),
      diag: pb8Diag(tiles, levels), vt: pb8Verts(tiles, levels),
      n: 0, levels, life: 0,
      pres: 0, drive: 1.15, anchor: 0.5,
      spin: 0, rot: 0, elas: 0.10, wave: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0,
      tilt: 0.45, chord: 0, qNow: 0, qWant: -1, qHold: 0, dealPulse: 0,
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      fbase: 0.15, front: 0.15, hwm: 0.15, vel: 0,
      lit: new Float32Array(tiles.length),
      fl: new Float32Array(tiles.length),
      wc: null, wx: null, wb: null, wbx: null,
      twk: 1.8
    };
  },

  /* step is V6's, unchanged — this round is paint, not behaviour. */
  step(P, dt, t, inp) {
    const s = P.state, N = s.tiles.length;
    s.life += dt;

    /* ---- HANDS: CC1 spins the plate, CC2 stretches it ------------------ */
    const cc1 = clamp(inp.L), cc2 = clamp(inp.R);
    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const spinT = handLive ? Math.pow(cc1, 1.6) * 0.55 : 0.05;
    const elasT = handLive ? cc2 : 0.10;
    s.spin += (spinT - s.spin) * Math.min(1, dt * 4);
    s.elas += (elasT - s.elas) * Math.min(1, dt * 4);
    s.rot += s.spin * dt;
    if (s.rot > TAU) s.rot -= TAU;
    s.wave += dt * (1.5 + 5.0 * s.kEnv);
    if (s.wave > 1e6) s.wave -= 1e6;
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    /* ---- SLOW BANDS → THE FIELD (clock one) ---------------------------- */
    const idle = (0.030 + 0.016 * Math.sin(s.life * 0.19)) * (1 - 0.7 * s.pres) * s.drive;
    const bT = Math.max(idle, clamp(inp.audio.bass * s.drive));
    const mT = Math.max(idle * 0.7, clamp(inp.audio.mid * s.drive));
    const tT = Math.max(idle, clamp(inp.audio.treble * s.drive));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 1.2 : 0.8));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 1.2 : 0.8));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 1.2 : 0.8));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    const fieldMix = clamp(0.42 * s.bass + 0.34 * s.mid + 0.30 * s.treble);
    const fieldTarget = Math.pow(fieldMix, 1.35);
    s.field += (fieldTarget - s.field) * Math.min(1, dt * 1.4);

    /* ---- THE KICK (clock two) — the only fast size move ---------------- */
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetRaw = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    if (edge && s._kGap > 0.09) {
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      s.kEnv = Math.max(s.kEnv, clamp(hit * Math.exp(-3.4 * (age + s.LEAD)) * clamp(s.drive * 0.6, 0.3, 1)));
    }
    s.kEnv -= s.kEnv * Math.min(1, dt * 2.8);

    /* ---- THE FRONT ----------------------------------------------------- */
    const baseTarget = 0.13 + 0.38 * s.field;
    s.fbase += (baseTarget - s.fbase) * Math.min(1, dt * (baseTarget > s.fbase ? 1.4 : 0.9));
    const prev = s.front;
    s.front = s.fbase * (1 + 0.16 * s.kEnv);
    s.vel = dt > 0 ? (s.front - prev) / dt : 0;
    s.hwm = s.front > s.hwm ? s.front : s.hwm + (s.front - s.hwm) * Math.min(1, dt * 1.1);

    /* ---- THE SPECTRUM PAINTS ------------------------------------------- */
    const tot = s.bass + s.mid + s.treble + 1e-4;
    const centroid = (s.mid * 0.5 + s.treble) / tot;
    s.tilt += (centroid - s.tilt) * Math.min(1, dt * 3.2);
    const harm = clamp((s.treble * 1.6 - s.mid * 0.35) / (s.mid + s.treble + 0.05));
    const q = Math.min(4, Math.floor(harm * 5));
    if (q !== s.qWant) { s.qWant = q; s.qHold = 0; } else s.qHold += dt;
    if (s.qHold > 0.18 && q !== s.qNow) { s.qNow = q; s.dealPulse = 1; }
    s.chord += (s.qNow / 5 - s.chord) * Math.min(1, dt * 3.0);
    s.dealPulse -= s.dealPulse * Math.min(1, dt * 2.0);

    /* ---- CRYSTALLISE ---------------------------------------------------- */
    while (s.n < N && s.tiles[s.n].r <= s.hwm) { s.fl[s.n] = 1; s.n++; }
    while (s.n > 0 && s.tiles[s.n - 1].r > s.hwm) s.n--;
    const up = Math.min(1, dt * 7), dn = Math.min(1, dt * 2.4), fd = Math.min(1, dt * 3.2);
    for (let i = 0; i < N; i++) {
      const tgt = i < s.n ? 1 : 0;
      s.lit[i] += (tgt - s.lit[i]) * (tgt ? up : dn);
      if (s.fl[i] > 0.001) s.fl[i] -= s.fl[i] * fd;
    }

    s.twk -= dt;
    if (s.twk <= 0) {
      s.twk = 2.4 + P.rand() * 3.6;
      if (s.n > 2) s.fl[(P.rand() * s.n) | 0] = 1;
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, N = s.tiles.length;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.92;
    const bright = 0.45 + s.pres * 0.55;

    /* THE WASH LAYER lives on its own canvas, because the paper grain and the
       bleed are operations on the WHOLE body of pigment, not on one tile — and
       because the ink has to go over the dried wash rather than be added to it.
       It is rendered at a FRACTION of the frame and blown back up: a wash is
       soft by definition, the upscale is itself part of the bleed, and the
       full-resolution version cost three times V6's whole frame for a layer
       whose finest feature is a blurred edge. The context is scaled, so every
       coordinate below — and the paper pattern with them — stays in stage
       units and lands the same size on screen. */
    const SC = 0.55;
    const W = Math.max(1, Math.round(w * SC)), Hh = Math.max(1, Math.round(h * SC));
    if (!s.wc || s.wc.width !== W || s.wc.height !== Hh) {
      s.wc = document.createElement('canvas');
      s.wc.width = W; s.wc.height = Hh;
      s.wx = s.wc.getContext('2d');
      s.wb = document.createElement('canvas');
      s.wb.width = W; s.wb.height = Hh;
      s.wbx = s.wb.getContext('2d');
    }
    const x = s.wx;
    x.setTransform(SC, 0, 0, SC, 0, 0);
    x.globalCompositeOperation = 'source-over';
    x.filter = 'none';
    x.clearRect(0, 0, w, h);
    x.lineJoin = 'round';

    g.globalCompositeOperation = 'lighter';
    const wg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    // HALVED FOR V8. With a bare black field the navy under-glow was the only
    // thing giving the disc a body; now that every diamond carries paper tone
    // the two fight, and the navy wins — the cream reads cold and the paper
    // stops looking like paper. The tone is the body now.
    wg.addColorStop(0, `rgba(18,30,92,${0.15 * bright})`);
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = wg;
    g.fillRect(0, 0, w, h);

    const loud = clamp(s.energy * 1.6);
    const lw = Math.max(2.6, 2.6 * ms);
    const fillA = 0.30 + loud * 0.46 + s.kEnv * 0.08 + s.dealPulse * 0.10;
    const edgeA = 0.40 + loud * 0.20 + s.dealPulse * 0.10;
    // the rim is a soft line hugging the tile boundary: half of it lands
    // inside the wash (the pool) and half spills past (the bleed). Scaled off
    // the tiling's own rhomb side, so it is the same fraction of a diamond at
    // every deflation depth.
    const rimW = Math.max(1.2, (s.wash.edge || 0.05) * R * 0.095);

    const ca = Math.cos(s.rot), sa = Math.sin(s.rot);
    const amp = s.elas * (0.016 + 0.012 * s.kEnv), WK = 22;
    let PX = 0, PY = 0;
    const px = (px0, py0) => {
      let px1 = px0, py1 = py0;
      const rr = Math.hypot(px1, py1);
      if (rr > 1e-4 && amp > 1e-5) {
        const f = (rr + amp * Math.sin(rr * WK - s.wave) * Math.min(1, rr / 0.10)) / rr;
        px1 *= f; py1 *= f;
      }
      PX = cx + (px1 * ca - py1 * sa) * R;
      PY = cy + (px1 * sa + py1 * ca) * R;
    };

    const tiltN = clamp((s.tilt - 0.36) / 0.30);
    const tiltT = (tiltN - 0.5) * 0.58 + 0.42;
    const exc = clamp(s.field * 1.5);
    const CREAM = [247, 230, 204];

    /* THE PROJECTED CORNERS ARE COMPUTED ONCE. The wash has to be laid down,
       granulated and bled BEFORE the ink goes over it — that is what makes it
       ink ON wash rather than two glows added together — so the tiles are
       walked twice. Re-running the elastic displacement for the second walk
       would be pure waste, so the six numbers are kept. */
    if (!s.pts || s.pts.length < N * 6) s.pts = new Float32Array(N * 6);
    const PT = s.pts;
    const off = (s.wash.edge || 0.05) * R * 0.055;

    for (let i = 0; i < N; i++) {
      const l = s.lit[i];
      if (l < 0.02) continue;
      const tl = s.tiles[i], o = i * 6;
      px(tl.x[0], tl.y[0]); PT[o] = PX; PT[o + 1] = PY;
      px(tl.x[1], tl.y[1]); PT[o + 2] = PX; PT[o + 3] = PY;
      px(tl.x[2], tl.y[2]); PT[o + 4] = PX; PT[o + 5] = PY;

      const wd = s.wash[i];
      if (wd < 0.01) continue;
      const fam = s.rose[i];
      const stray = s.wash.stray[i];
      const a = l * bright;
      const shim = 0.72 + 0.28 * Math.sin(tl.r * 17 - s.life * 0.75 + tl.dir * 0.63);
      const dealt = (tl.cls + s.chord) % 1;
      const c = fam
        ? pbCol(tiltT + (fam === 1 ? -0.12 : 0.30) + tl.r * 0.16 + (dealt - 0.5) * 0.26)
        : CREAM;
      // load rises with excitement: quiet is nearly bare paper, loud floods.
      // THE FIELD'S SHARE IS DELIBERATELY SMALL — it is paper tone, a quarter
      // of a rosette, not a second wash competing with one.
      const load = wd * a * shim * fillA * (fam ? (0.55 + 0.95 * exc)
        : stray ? (0.26 + 0.34 * exc) : (0.16 + 0.22 * exc));
      const body = pb7Pig(c, 0.28);
      // OFF-REGISTER: a brush does not land on the line. Every wash is nudged
      // a few percent of a rhomb side in its own fixed direction, so it
      // overshoots some of its diamond's edges and falls short of others —
      // which is the single loudest hand-painted cue the plate has.
      const oa = pb7Hash(i * 9 + 41) * TAU, om = off * (0.35 + 0.65 * pb7Hash(i * 9 + 42));
      const dx = Math.cos(oa) * om, dy = Math.sin(oa) * om;
      x.beginPath();
      x.moveTo(PT[o] + dx, PT[o + 1] + dy);
      x.lineTo(PT[o + 2] + dx, PT[o + 3] + dy);
      x.lineTo(PT[o + 4] + dx, PT[o + 5] + dy);
      x.closePath();
      x.fillStyle = `rgba(${body[0] | 0},${body[1] | 0},${body[2] | 0},${Math.min(0.82, load * 0.84)})`;
      x.fill();
      // POOLED PIGMENT: a little stronger, and undiluted — the chroma step
      // from body to rim is what tells the eye the wash dried rather than was
      // filled. It is an accent on the wash, never a second outline.
      // ...on the washes. Bare paper gets none: the ink line is already on that
      // boundary and a second edge over it only fattens the lattice.
      if (stray) {
        x.lineWidth = rimW;
        x.strokeStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.min(0.92, load * 1.18)})`;
        x.stroke();
      }
    }

    /* --- THE SHEET'S OWN TOOTH ------------------------------------------
       `source-atop` is the whole trick: the grain darkens only where pigment
       already sits and cannot fog the black, which a multiply over the frame
       would. Pinned to the screen, so the plate turns ACROSS the paper. */
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = 0.72 + 0.28 * exc;
    x.fillStyle = s.paper;
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';

    /* --- and the paper drinks it past the line --------------------------
       The blurred pass is the pigment wicking into fibre and is ADDED, the
       sharp pass is the wash itself and is LAID DOWN. Adding the sharp pass
       too was V7's first mistake: three additive layers plus the ink piled
       every rosette up to white and the colour went with it. */
    // the blur happens on the SMALL canvas, never on the stage: a canvas
    // filter costs its DESTINATION's pixels, and blurring 1920x1200 was on its
    // own half again as expensive as everything else V7 draws.
    if (typeof g.filter === 'string') {
      const bx = s.wbx;
      bx.setTransform(1, 0, 0, 1, 0, 0);
      bx.clearRect(0, 0, W, Hh);
      bx.filter = `blur(${Math.max(1, 1.6 * ms * SC)}px)`;
      bx.drawImage(s.wc, 0, 0);
      bx.filter = 'none';
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.32;
      g.drawImage(s.wb, 0, 0, w, h);
      g.globalAlpha = 1;
    }
    g.globalCompositeOperation = 'source-over';
    g.drawImage(s.wc, 0, 0, w, h);

    /* --- THE INK, over the dried wash -----------------------------------
       One weight per tile off a stable hash, so the lattice has the wobble of
       a hand rather than the evenness of a plotter. `source-over` on top of
       the wash: a line drawn ON the paint, not a second glow added to it. */
    g.lineJoin = 'round';
    for (let i = 0; i < N; i++) {
      const l = s.lit[i];
      if (l < 0.02) continue;
      const tl = s.tiles[i], o = i * 6;
      const a = l * bright, fam = s.rose[i], f = s.fl[i];
      const dealt = (tl.cls + s.chord) % 1;
      // the ink is one colour — the plate's line is drawn before any pigment
      // touches it — warmed a little toward whatever the tile carries so the
      // lattice never reads as a grid laid over a picture
      const c = fam
        ? pbCol(tiltT + (fam === 1 ? -0.12 : 0.30) + tl.r * 0.16 + (dealt - 0.5) * 0.26)
        : CREAM;
      const r0 = (CREAM[0] * 0.55 + c[0] * 0.45) | 0;
      const g0 = (CREAM[1] * 0.55 + c[1] * 0.45) | 0;
      const b0 = (CREAM[2] * 0.55 + c[2] * 0.45) | 0;
      // washed diamonds need LESS line, not more: the wash is carrying them,
      // and the bare field is where the lattice has to do all the work
      const ea = edgeA * (fam ? (0.80 - 0.24 * exc) : (0.62 - 0.16 * exc));
      const jw = 0.68 + 0.62 * pb7Hash(i * 5 + 3);
      let R0 = r0, G0 = g0, B0 = b0, A0, LW;
      if (f > 0.02) {
        const wf = f * 0.8;
        R0 = (r0 + (255 - r0) * wf) | 0;
        G0 = (g0 + (246 - g0) * wf) | 0;
        B0 = (b0 + (218 - b0) * wf) | 0;
        LW = lw * jw * (1 + f * 0.9);
        A0 = Math.min(1, a * (ea + 0.46 * f));
      } else { LW = lw * jw; A0 = a * ea; }
      // TWO ORDERS OF LINE: the rhomb's own two sides, then its diagonal
      // dropped back. Dropping ONE edge of a triangle always leaves a
      // connected polyline, so the middle corner is still a real join.
      const oi = s.diag[i], i0 = ((oi + 1) % 3) * 2, i1 = ((oi + 2) % 3) * 2, i2 = oi * 2;
      g.lineWidth = LW;
      g.strokeStyle = `rgba(${R0},${G0},${B0},${A0})`;
      g.beginPath();
      g.moveTo(PT[o + i0], PT[o + i0 + 1]);
      g.lineTo(PT[o + i1], PT[o + i1 + 1]);
      g.lineTo(PT[o + i2], PT[o + i2 + 1]);
      g.stroke();
      g.lineWidth = LW * 0.40;
      g.strokeStyle = `rgba(${R0},${G0},${B0},${A0 * 0.38})`;
      g.beginPath();
      g.moveTo(PT[o + i2], PT[o + i2 + 1]);
      g.lineTo(PT[o + i0], PT[o + i0 + 1]);
      g.stroke();
    }

    /* --- THE PEN POOLS AT EVERY JUNCTION --------------------------------
       Sized and lit by VALENCE, so the ten-way sun vertices are the brightest
       points on the plate and the rosette structure is readable in the bare
       field with no colour in it. Three buckets, three fills — 1211 dots for
       the price of three paths. They ride the elastic displacement through
       the same `px` every tile corner does, so a dot never leaves its own
       junction. */
    g.globalCompositeOperation = 'lighter';
    {
      const V = s.vt, Rl = s.tiles.rMin + clamp(s.hwm, 0, 1.06) * s.tiles.rSpan;
      const base = Math.max(1.1, 1.15 * ms);
      for (let b = 0; b < 3; b++) {
        const lo = b === 0 ? 0 : b === 1 ? 6 : 9;
        const hi = b === 0 ? 5 : b === 1 ? 8 : 99;
        g.fillStyle = `rgba(255,240,212,${(0.07 + 0.17 * b) * bright})`;
        g.beginPath();
        for (let i = 0; i < V.x.length; i++) {
          if (V.v[i] < lo || V.v[i] > hi || V.r[i] > Rl) continue;
          px(V.x[i], V.y[i]);
          const rr = base * (1 + 0.95 * b);
          g.moveTo(PX + rr, PY);
          g.arc(PX, PY, rr, 0, TAU);
        }
        g.fill();
      }
    }

    // the front — brightest on the frame a kick throws it outward
    const fr = (s.tiles.rMin + clamp(s.front, 0, 1.06) * s.tiles.rSpan) * R;
    if (fr > R * 0.03) {
      const rg = g.createRadialGradient(cx, cy, Math.max(0, fr - R * 0.13), cx, cy, fr + R * 0.08);
      rg.addColorStop(0, 'rgba(255,214,168,0)');
      rg.addColorStop(0.7, `rgba(255,206,150,${(0.06 + s.kEnv * 0.30) * bright})`);
      rg.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(cx, cy, fr + R * 0.08, 0, TAU); g.fill();
    }
    // the seed, breathing on the kick
    const sr = R * (0.11 + s.kEnv * 0.08);
    const sg = g.createRadialGradient(cx, cy, 0, cx, cy, sr);
    sg.addColorStop(0, `rgba(255,214,168,${(0.08 + loud * 0.09 + s.kEnv * 0.13) * bright})`);
    sg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = sg;
    g.beginPath(); g.arc(cx, cy, sr, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(226,200,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '  MID ' + Math.round(s.mid * 100) +
      '  TREBLE ' + Math.round(s.treble * 100) + '  FIELD ' + Math.round(s.field * 100) +
      '  KICK ' + Math.round(s.kEnv * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') +
      ' age ' + Math.round(s._kAge * 1000) + 'ms' +
      (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ')' +
      '  FRONT ' + s.front.toFixed(2) + '/' + s.hwm.toFixed(2) + '  TILES ' + s.n + '/' + N +
      '  TILT ' + Math.round(s.tilt * 100) + '  DEAL ' + s.qNow + '/5' +
      '  WASH ' + Math.round(exc * 100) + '  VERTS ' + s.vt.x.length +
      '  SPIN ' + s.spin.toFixed(2) + '  ELAS ' + Math.round(s.elas * 100) +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  }
});
