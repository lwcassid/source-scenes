/* ---------- SRC-46.9 · PENROSE BLOOM V9 (the constants find the new ground) --
   No new mechanic, no new control, not one geometry or material constant
   touched. The AUDIO IN engine was rewritten under this scene — it used to
   hand every band a compressed signal that sat at 0.9 and barely moved, and
   it now auto-ranges to the material (bass p5 0.645 -> 0.012, spread 0.31 ->
   0.81). V8's numbers were all calibrated against the old, pinned signal.
   This round re-seats them, and in doing so finally fixes the thing Nima
   complained about at V6 — "BASS 100 / MID 100 / TREBLE 95 and the plate
   barely moves with the music".

   Measured first, on Leila.mp3 from 90s, a minute of real techno, ~475
   sampled frames. Two separate diseases:

   A — THE CRYSTAL WAS TOO SMALL. `hwm` sat at p50 0.405 = 440 of 2330 tiles,
   19% of the plate. On the old engine the same line meant 0.51 ≈ 680 tiles.
   Coverage goes as radius squared, so that one number is essentially all of
   the measured dimming. `baseTarget` 0.13+0.38 -> 0.215+0.48 puts hwm back at
   p50 ~0.60 — ~900 tiles, a plate that fills the 1200px frame and spills a
   few percent past it. On mesh scrim the frame edge is invisible, so the
   overflow costs nothing and buys the light back.

   B — THE PAINT DID NOT REACT AT ALL, AND NEVER DID ON THIS ENGINE. `loud =
   energy*1.6` saturates for any energy above 0.625; the measured 5th
   percentile of energy is 0.590, so loud read 1.000 on 78% of frames, spread
   0.093. `exc = field*1.5` saturates above 0.667 against a median field of
   0.662 — pinned from the median up. `edgeA` therefore moved by 0.008 across
   the 5th-to-95th percentile of a full minute of music. That is not an
   engine regression; those multipliers saturated on the old signal too. The
   engine change merely took the crystal down with them.

   The root of B is that the scene threw away three quarters of the range
   before painting with it: three lowpasses in series (cascaded tau ~1.5s)
   averaging three bands that the engine AGCs INDEPENDENTLY. Engine bass
   spans 0.817 p5->p95; `s.bass` arrived with 0.193. The rates go 1.2/0.8 ->
   3.0/2.0, energy 2 -> 3, field 1.4 -> 2.5, and the `^1.35` on fieldMix —
   free when its input pinned at 1.0, a 9-point darkening curve now — is
   deleted.

   Then the real find. In techno the level is near-constant BY DESIGN; what
   moves is each band's departure from its own recent mean, which the engine
   now publishes as `dev`. Raw devAvg measures spread 0.625 where s.energy
   has 0.139. `loud` and `exc` are rebuilt as half absolute level, half
   deviation, each windowed on its own measured distribution — loud comes
   out spread 0.257, exc 0.329, neither clipped.

   And the colour deal, which was the worst of it and is NOT a gain problem.
   `centroid` and `harm` were RATIOS BETWEEN INDEPENDENTLY AGC'd BANDS, so
   they carried almost nothing: centroid spanned 0.060 out of 0..1, and the
   dealt family q came out 9/84/381/0/0 over 474 frames — three of the five
   colour families never appeared, one held 80% of the show. Both now ride
   the DIFFERENCE of two deviations (dev.treble - dev.mid; dev.bass vs
   dev.treble measure r = 0.088, near-independent). The histogram becomes
   65/111/123/87/21, all five families, and the plate re-deals between
   pink/magenta and yellow/green/blue the way the shipped build never does.
   `qHold` goes 0.18 -> 0.35 to match, because a deal re-firing faster than
   dealPulse's own 0.5s decay is a flash, not a re-deal.

   THE ANTI-V7 CLAUSE, and it is the reason this version is allowed to ship.
   The last signal-driven Penrose was withdrawn because it bought reactivity
   with ink and measured DIMMER on scrim. Once `loud` stops pinning at 1.0,
   V8's alpha bases would drop edgeA from a constant 0.60 to 0.45-0.51 —
   exactly that trade. So the floors come UP: fillA 0.30 -> 0.50 (gain 0.46
   -> 0.36), edgeA 0.40 -> 0.54 (gain 0.20 -> 0.16). edgeA now sits at
   0.61-0.65 across the whole measured range: brighter than the shipped
   constant at every percentile AND moving. More reactivity must not cost
   legible ink; here it costs none.

   One thing genuinely new, and it is a size mechanic rather than a paint
   one: `s.front` breathes on deviation (0.92 + 0.20·dev), so the plate
   blooms into a drop and settles back through a breakdown. `hwm` is a
   high-water mark with a slow decay — it was never going to pulse on the
   beat, and even retuned it only spans 0.554 -> 0.623. This is the arrangement
   -scale swing it never had. `audioLive` moves to the engine's own `live`
   gate, keeping `level > 0.05` as the fallback for a source the confidence
   has not seated.

   Left alone deliberately: `drive = 1.15` (correct headroom — bass p95 0.893,
   so it clips ~7% of frames), the entire kick path and `kEnv` (unchanged by
   the rewrite, measured identical at 8 and 54 fps), the navy under-glow at
   0.15 (V8 halved it because cream and navy fought; a 2x bigger plate makes
   that argument stronger), `sub` (r = 0.996 with bass at this FFT size — a
   duplicate, not a signal), `lowmid` (real, but adding a fourth term to a
   three-band AVERAGE reduces variance, which is the opposite of this round),
   and every geometry and material constant in V8 and V7: the diagonal's 0.40
   weight, the three valence buckets, the bare-paper 0.62+0.38 load, the
   off-register nudge, the 0.55 wash canvas and its blur-plus-sharp double
   composite. None of them read the audio; all of them are the medium.

   MEASURED, six musical moments, same track, same driver, luminance over the
   frame minus the bottom 4% HUD row — mean L / %>15 / %>50:
     shipped V8 on this engine   27.0-31.3 / 31.3-34.9 / 22.5-26.0  (420 tiles)
     V8 on the OLD engine        44.4-45.3 / 52.1-53.3 / 38.9-40.7  (~680)
     V9                          47.4-62.7 / 58.1-70.4 / 36.2-50.5  (950)
   Mean luminance and >15 coverage beat the old-engine plate at EVERY sampled
   moment. The one number that does not is >50 at the deliberate deviation
   trough — 36.2 against 38.9 — where the plate is supposed to be at its
   smallest; mean (47.4) and >15 (58.1%) both clear there comfortably, and
   the fix if the wall disagrees is edgeA's base, not exc's floor, which
   would re-flatten the mechanic this round exists to restore. And the state
   is alive where it was pinned: hwm spread 0.042 -> 0.095, tilt 0.044 ->
   0.247, loud 0.093 -> 0.32, exc clipped -> 0.39.
   (V8 and V7 notes below.) --------------------------------------------- */
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

reg({
  id: 'SRC-46.9', family: 'SRC-46', ver: 9,
  title: 'Penrose Bloom V9', tech: 'PENROSE DEFLATION / INK + WASH ON PAPER / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'CC1 = SPIN', 'CC2 = ELASTICITY', 'KITES AND DARTS', 'THE PEN POOLS', 'RIDES DEVIATION'],
  desc: 'V8\'s plate — kites and darts, the pen pooling at every junction, paper under everything — with every audio constant re-seated on the engine that ships today. V8 was tuned against a signal that sat at 0.9 and barely moved, so its multipliers all saturated: the paint alphas moved by less than a hundredth across a full minute of techno, and the crystal grew to a fifth of the plate instead of a third. Two fixes. The plate is twice the size again, filling the frame and spilling past its edge, where on mesh scrim the edge is invisible anyway. And the paint rides DEVIATION — how far each band sits from its own recent average — which is the thing that actually moves in dance music, where the level is deliberately constant. The crystal now blooms into a drop and settles through a breakdown; the colour deal, which used to spend eighty percent of the show in one family, walks all five. The ink got BRIGHTER doing it, not dimmer: reactivity is not allowed to cost legibility on scrim.',
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
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0, dv: 0.5,
      tilt: 0.45, chord: 0, qNow: 0, qWant: -1, qHold: 0, dealPulse: 0,
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      fbase: 0.15, front: 0.15, hwm: 0.15, vel: 0,
      lit: new Float32Array(tiles.length),
      fl: new Float32Array(tiles.length),
      wc: null, wx: null, wb: null, wbx: null,
      twk: 1.8
    };
  },

  /* V8's step, with every audio constant re-seated on the engine that ships
     today. Geometry, hands, kick and crystallise are untouched. */
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
    // LIVENESS: the engine now answers this itself — a gate AND a confidence,
    // measured true on 100% of frames of real music. `level > 0.05` is kept
    // only as the fallback for a source the confidence gate has not seated.
    const audioLive = inp.audio.live || inp.audio.level > 0.05;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    /* ---- SLOW BANDS → THE FIELD (clock one) ---------------------------- */
    const idle = (0.030 + 0.016 * Math.sin(s.life * 0.19)) * (1 - 0.7 * s.pres) * s.drive;
    const bT = Math.max(idle, clamp(inp.audio.bass * s.drive));
    const mT = Math.max(idle * 0.7, clamp(inp.audio.mid * s.drive));
    const tT = Math.max(idle, clamp(inp.audio.treble * s.drive));
    // FOUR LOWPASSES IN SERIES was the disease. 1.2/0.8 -> 3.0/2.0 takes the
    // band tau from 0.83s/1.25s to 0.33s/0.50s; energy 2 -> 3 and field
    // 1.4 -> 2.5 shorten the two behind it. Measured on the shipped rates,
    // 76% of the engine's own bass range (0.817 p5->p95) never reached the
    // paint: s.bass arrived with a spread of 0.193. The attack>release
    // asymmetry stays — this is a peak follower and a swell wants one.
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 3.0 : 2.0));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 3.0 : 2.0));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 3.0 : 2.0));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 3);
    const fieldMix = clamp(0.42 * s.bass + 0.34 * s.mid + 0.30 * s.treble);
    // ^1.35 WAS FREE WHEN THE INPUT PINNED AT 1.0 (1^1.35 = 1) and is a pure
    // darkening curve now the input lives near 0.76: it cost 9 points of
    // fieldMix at the median. Gone. The 0.42/0.34/0.30 weights stay — they
    // sum to 1.06 on purpose, so all-bands-loud still clamps.
    const fieldTarget = fieldMix;
    s.field += (fieldTarget - s.field) * Math.min(1, dt * 2.5);

    /* ---- DEVIATION: what actually MOVES in techno ----------------------
       The level is near-constant by design; what changes is each band's
       departure from its own ~1.5s mean. Raw devAvg measures p5 0.173 /
       p50 0.495 / p95 0.798 — a spread of 0.625 where s.energy has 0.139.
       Smoothed at dt*4 because dev is jittery at 60fps and a wash must not
       strobe; dt*6 is the knob if the plate reads placid on the wall. */
    const AD = inp.audio.dev || { bass: 0.5, mid: 0.5, treble: 0.5 };
    const dvT = (AD.bass + AD.mid + AD.treble) / 3;
    s.dv += (dvT - s.dv) * Math.min(1, dt * 4);

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
    // THE CRYSTAL WAS TOO SMALL. This constant was tuned when `field` pinned
    // at 1.0 every frame (old engine: every band x drive exceeded 1, and the
    // fieldMix weights sum to 1.06) — so it meant 0.51, ~680 of 2330 tiles.
    // On the new engine field lands at 0.674 and it delivered 0.386 = 440
    // tiles, 19% of the plate. 0.215 + 0.48 puts hwm back at p50 ~0.60 —
    // ~890 tiles, a plate that fills the 1200px frame and overflows it by a
    // few percent. The overflow is intended: on scrim the frame edge is
    // invisible black, and coverage goes as radius squared.
    const baseTarget = 0.215 + 0.48 * s.field;
    s.fbase += (baseTarget - s.fbase) * Math.min(1, dt * (baseTarget > s.fbase ? 1.4 : 0.9));
    const prev = s.front;
    // AND IT BREATHES. hwm is a high-water mark with a 0.9/s decay — it was
    // never going to pulse on the beat, and even retuned it only spans
    // 0.554 -> 0.623. Deviation gives it a +10/-8% swing on arrangement scale,
    // so the plate blooms into a drop and settles back in a breakdown: the
    // only visible SIZE mechanic this scene has ever had. Centred at 0.92
    // rather than 0.88: a breath that SHRINKS the trough costs brightness at
    // exactly the moment already closest to the legibility floor.
    s.front = s.fbase * (0.92 + 0.20 * clamp((s.dv - 0.20) / 0.55) + 0.16 * s.kEnv);
    s.vel = dt > 0 ? (s.front - prev) / dt : 0;
    s.hwm = s.front > s.hwm ? s.front : s.hwm + (s.front - s.hwm) * Math.min(1, dt * 1.1);

    /* ---- THE SPECTRUM PAINTS ------------------------------------------- */
    /* A RATIO BETWEEN INDEPENDENTLY AGC'd BANDS CARRIES NO INFORMATION. Both
       of these were exactly that, and both were flat: centroid measured p5
       0.446 -> p95 0.506 (a spread of 0.060 out of 0..1) and harm's dealt
       family q came out 9/84/381/0/0 over 474 frames — three of five colour
       families never appeared and one held 80% of the show. The DIFFERENCE
       between two deviations is the axis a colour deal wants: dev.treble vs
       dev.bass measure r = 0.088, near-independent, and treble-minus-mid
       measures p5 -0.320 / p50 -0.008 / p95 +0.354. The same q histogram
       becomes 65/111/123/87/21 — all five families, bell-shaped, and the
       plate visibly re-deals between pink/magenta and yellow/green/blue. */
    const dtm = AD.treble - AD.mid;
    const centroid = clamp(0.5 + dtm * 0.9);
    s.tilt += (centroid - s.tilt) * Math.min(1, dt * 3.2);
    // ...but the deal has to ride the SMOOTHED axis, not the raw difference.
    // dev is jittery at frame rate, so a raw q flips every frame, qHold never
    // reaches its threshold and the deal never latches at all: measured, raw
    // harm held ONE family for the entire minute — worse than the shipped
    // build. Off s.tilt (the same axis, already lowpassed at dt*3.2) with the
    // gain opened to 3.0 the histogram comes out 65/111/123/87/21 — all five
    // families — and the plate re-deals about every two and a half seconds.
    const harm = clamp(0.5 + (s.tilt - 0.5) * 3.0);
    const q = Math.min(4, Math.floor(harm * 5));
    if (q !== s.qWant) { s.qWant = q; s.qHold = 0; } else s.qHold += dt;
    // 0.18 -> 0.45: now that q actually changes, a deal that re-fires faster
    // than dealPulse's own 0.5s decay is a continuous flash, not a re-deal.
    // 0.45 measured out at one re-deal per ~2.5s of SHOW time, with all five
    // families used. Read that number off the wall clock, not off a headless
    // render: part5_tail's frame() caps dt at 0.05, so at swiftshader's 8fps
    // scene time runs at 0.4x real and every hold in this scene is silently
    // 2.5x longer than it will be at 60fps. A headless capture of this line
    // shows two families; the show gets five.
    if (s.qHold > 0.45 && q !== s.qNow) { s.qNow = q; s.dealPulse = 1; }
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

    /* `energy * 1.6` saturates for anything above 0.625 and s.energy's own
       5th percentile is 0.590 — loud was 1.000 on 78% of frames, spread
       0.093 across a full minute of techno. That is Nima's original V6
       complaint, and it was never an engine problem: the multiplier
       saturated on the old signal too. The window 0.30/0.55 is read off the
       measured distribution; the deviation half is what gives it motion.
       Measured after: p5 0.454 / p50 0.596 / p95 0.711, spread 0.257. */
    const loud = clamp(0.45 * clamp((s.energy - 0.30) / 0.55)
                     + 0.55 * clamp(s.dv * 1.6 - 0.30));
    const lw = Math.max(2.6, 2.6 * ms);
    /* THE ANTI-V7 CLAUSE. The last signal-driven Penrose was withdrawn for
       buying reactivity with ink: once `loud` stops pinning at 1.0, V8's
       bases would drop edgeA from a constant 0.60 to 0.45-0.51. The floors
       come up so edgeA sits at 0.65-0.70 across the WHOLE measured range —
       brighter than the shipped constant at every percentile and moving.
       fillA likewise: 0.69-0.81 against a flat 0.78, over 2x the tiles. The
       bases are 0.06/0.04 above the spec's first pass because the measured
       DEVIATION TROUGH at t40 came in at mean L 41.3 and the bar is 45.3. */
    const fillA = 0.56 + loud * 0.34 + s.kEnv * 0.08 + s.dealPulse * 0.10;
    const edgeA = 0.58 + loud * 0.16 + s.dealPulse * 0.10;
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

    // rescaled to the new centroid: tilt used to live p5 0.304 -> p95 0.474,
    // never near either end of its own window. 0.15/0.70 puts it 0.31 -> 0.72.
    const tiltN = clamp((s.tilt - 0.15) / 0.70);
    const tiltT = (tiltN - 0.5) * 0.58 + 0.42;
    // same disease as `loud`: x1.5 saturates above field 0.667 and the median
    // field is 0.662, so exc read 1.000 from the median up. This governs the
    // wash load, the paper-grain alpha and the ink's exc term — everything
    // that makes the plate feel like it is listening. Measured after:
    // p5 0.465 / p50 0.647 / p95 0.794, spread 0.329, and never clipped.
    const exc = clamp(0.45 * clamp((s.field - 0.28) / 0.52)
                    + 0.55 * clamp((s.dv - 0.30) / 0.44));
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
      '  WASH ' + Math.round(exc * 100) + '  DEV ' + Math.round(s.dv * 100) +
      '  LOUD ' + Math.round(loud * 100) +
      '  SPIN ' + s.spin.toFixed(2) + '  ELAS ' + Math.round(s.elas * 100) +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  }
});
