/* ---------- SRC-46.9 · PENROSE BLOOM V9 (the lattice is actually rubber) ----
   Nima, on V8: "CC2 should cause much more noticeable ripples than it does
   now."

   He is right, and the numbers say why. V6 introduced elasticity and V7/V8
   inherited it untouched: at a fully open right hand the radial swell was
   1.6% of the plate's radius (~18px at show size) with THREE AND A HALF
   wavelengths packed across it — a corrugation finer than the tiling it was
   deforming, moving at a fixed rate no matter where the hand sat. On mesh
   scrim that is not a ripple, it is a shimmer, and it disappears entirely
   into the grain of the ink. This round is that one control and nothing
   else: no new mechanic, no second hand job, no new mark.

   1. FEWER, BIGGER WAVES. Wavenumber 22 -> 10.5, so the swell is about one
      and three quarter wavelengths from seed to rim — a rolling breath the
      whole plate takes, not a texture. That buys the amplitude: the
      no-folding law is `amp * waveNumber < 1` (radial slope stays positive,
      shells never cross), so a longer wave earns a taller one. Peak radial
      displacement goes 0.028 -> 0.080 of R, gradient 0.62 -> 0.84 — near
      three times the throw, still provably un-torn.

   2. THE HAND ALSO SETS THE SPEED. Before, only the kick made the wave run
      (1.5 rad/s at rest either way). Now opening CC2 speeds it up as well as
      swells it, so the difference between a closed and an open hand is a
      still crystal versus a plate visibly breathing outward — legible in
      one second, from across the room, with no music playing at all.

   3. AND IT SHEARS, NOT JUST BREATHES. A purely radial map scales every
      diamond along one axis; the eye reads that as a zoom, which is exactly
      why V6-V8's elasticity was easy to miss. A second wave of TWIST —
      angle displaced as a function of radius, so the whole thing is still a
      pure function of position and the sheet stays welded — skews the cells
      instead, up to ~0.42 of shear. Twist cannot fold a mesh at all (it
      leaves the Jacobian determinant alone), so it is the cheap half of the
      budget, and it is the half that makes the word "rubber" land. The two
      waves run at different rates so they never lock into a single motion.

   Everything else is V8's, byte for byte: the two orders of line, the pen
   pooling by valence, the wash under the ink, the paper, and every audio
   coupling. The helper tables (pbTiles / pb4Rose / pb8Wash / pb8Diag /
   pb8Verts / pb7*) are V7's and V8's, reused, not redefined. */

reg({
  id: 'SRC-46.9', family: 'SRC-46', ver: 9,
  title: 'Penrose Bloom V9', tech: 'PENROSE DEFLATION / INK + WASH ON PAPER / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'CC1 = SPIN', 'CC2 = RUBBER', 'THE PLATE BREATHES', 'KITES AND DARTS', 'PAPER EVERYWHERE'],
  desc: 'V8\'s plate — same ink, same wash, same paper, same music — with the right hand finally doing what its copy always claimed. Elasticity was inherited untouched from V6 and it was a shimmer: a swell under two percent of the radius, corrugated finer than the tiling it deformed, running at one fixed speed whether the hand was open or shut. Three numbers and one new term fix it. The wave is longer (about one and three quarter wavelengths from seed to rim instead of three and a half), which under the no-folding law earns it nearly three times the height, so the whole plate visibly breathes. The hand now sets the wave\'s SPEED as well as its size, so a closed hand is a still crystal and an open one is a lattice rolling outward with no music needed. And a second wave of twist shears the diamonds instead of only scaling them — a pure zoom is what made the old version easy to miss. Nothing else moved.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music grows the crystal and paints it; the hands play the GEOMETRY. LEFT HAND / CC1 IS SPIN: the whole plate turns about its seed, from still to a revolution every eleven seconds, with the fine control at the bottom of the throw. RIGHT HAND / CC2 IS RUBBER, and it is now unmistakable: at zero the lattice is a rigid crystal; open it and a slow swell runs outward through the whole plate while a second wave of twist skews the diamonds against it, so the sheet stretches, squashes and rolls rather than shimmering. Opening the hand raises the wave and speeds it up together, so the hand reads even in silence — and the kick still matters twice, once as the ring of light it always was and again as a surge through the rubber. Both hands settle when nobody is playing.',
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

  /* step is V8's, with ONE change: the wave's rate now rides the hand as
     well as the kick, so opening CC2 speeds the ripple up as it swells it. */
  step(P, dt, t, inp) {
    const s = P.state, N = s.tiles.length;
    s.life += dt;

    /* ---- HANDS: CC1 spins the plate, CC2 stretches it ------------------ */
    const cc1 = clamp(inp.L), cc2 = clamp(inp.R);
    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const spinT = handLive ? Math.pow(cc1, 1.6) * 0.55 : 0.05;
    const elasT = handLive ? cc2 : 0.10;
    s.spin += (spinT - s.spin) * Math.min(1, dt * 4);
    // the rubber answers FASTER than the spin does — this is the hand whose
    // whole job is to feel immediate (dt*6, the Vespers floor).
    s.elas += (elasT - s.elas) * Math.min(1, dt * 6);
    s.rot += s.spin * dt;
    if (s.rot > TAU) s.rot -= TAU;
    // OPENING THE HAND MAKES THE WAVE RUN, not just swell. At 10.5 rad of
    // wavenumber this is 0.09 -> 0.30 of the radius per second at rest and
    // ~0.7 under a kick: a plate that rolls, still slow enough for scrim.
    s.wave += dt * (0.9 + 2.4 * s.elas + 4.2 * s.kEnv);
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
    /* THE RUBBER. Both waves are pure functions of RADIUS, so two tiles
       sharing a corner move it identically and the sheet can never tear.
       SWELL: peak 0.080 of R against wavenumber 10.5 = a gradient of 0.84,
       just inside the amp*k < 1 law that keeps the radial map monotonic
       (slope never drops below 0.16, so shells cannot cross). V8 ran 0.028
       against 22 — a third of the throw at twice the frequency, which is
       why it read as grain rather than motion.
       TWIST: displacing the ANGLE by a function of radius is a shear, and a
       shear leaves the Jacobian determinant alone — it cannot fold the mesh
       at any amplitude, it only skews the diamonds. That is the half that
       makes this read as rubber instead of as a zoom; ~0.42 of shear at the
       rim, on a slower clock than the swell so the two never lock. */
    const ela = Math.pow(s.elas, 1.25);
    const amp = ela * (0.050 + 0.030 * s.kEnv), WK = 10.5;
    const twist = ela * (0.045 + 0.025 * s.kEnv), TK = 6.0;
    const live = amp > 1e-5 || twist > 1e-5;
    let PX = 0, PY = 0;
    const px = (px0, py0) => {
      let px1 = px0, py1 = py0;
      const rr = Math.hypot(px1, py1);
      if (rr > 1e-4 && live) {
        // the seed is the anchor: both waves ramp in over the first tenth of
        // the radius so the crystal's centre never slides off its own glow.
        const ramp = Math.min(1, rr / 0.12);
        const f = (rr + amp * ramp * Math.sin(rr * WK - s.wave)) / rr;
        px1 *= f; py1 *= f;
        const th = twist * ramp * Math.sin(rr * TK - s.wave * 0.62 + 1.1);
        const ct = Math.cos(th), st = Math.sin(th);
        const nx = px1 * ct - py1 * st;
        py1 = px1 * st + py1 * ct; px1 = nx;
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
      '  SWELL ' + (amp * 100).toFixed(1) + '%R/' + (amp * WK).toFixed(2) +
      '  SHEAR ' + (twist * TK).toFixed(2) +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  }
});
