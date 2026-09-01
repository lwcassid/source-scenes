/* ---------- SRC-46.11 · PENROSE BLOOM V11 (the constants find the new ground)
   No new mechanic, no new control, not one geometry or material constant
   touched. V10's picture exactly — CC1 walking the deflation, CC2 rolling the
   lattice, two orders of line, the pen pooling by valence, the wash, the
   paper — with every AUDIO constant re-seated. The AUDIO IN engine was
   rewritten under this family: it used to hand every band a compressed signal
   that sat at 0.9 and barely moved, and it now auto-ranges to the material
   (bass p5 0.645 -> 0.012, spread 0.31 -> 0.81). The audio path had come down
   from V6 BYTE FOR BYTE through V7, V8, V9 and V10 — every one of those rounds
   was geometry or paint — so all of it is still calibrated to the old, pinned
   signal. This round re-seats it, and in doing so finally fixes the thing Nima
   complained about at V6: "BASS 100 / MID 100 / TREBLE 95 and the plate barely
   moves with the music".

   Measured first, on Leila.mp3 from 90s, a minute of real techno, ~475
   sampled frames. Two separate diseases:

   A — THE CRYSTAL WAS TOO SMALL. `hwm` sat at p50 0.405 = 19% of the plate.
   On the old engine the same line meant 0.51. Coverage goes as radius
   squared, so that one number is essentially all of the measured dimming.
   `baseTarget` 0.13+0.38 -> 0.215+0.48 puts hwm back at p50 ~0.60 — a plate
   that fills the 1200px frame and spills a few percent past it. On mesh scrim
   the frame edge is invisible, so the overflow costs nothing and buys the
   light back. The growth front is normalised per deflation level, so this
   sizes the plate the same at every depth CC1 reaches.

   B — THE PAINT DID NOT REACT AT ALL, AND NEVER DID ON THIS ENGINE. `loud =
   energy*1.6` saturates for any energy above 0.625; the measured 5th
   percentile of energy is 0.590, so loud read 1.000 on 78% of frames, spread
   0.093. `exc = field*1.5` saturates above 0.667 against a median field of
   0.662 — pinned from the median up. `edgeA` therefore moved by 0.008 across
   the 5th-to-95th percentile of a full minute of music. That is not an engine
   regression; those multipliers saturated on the old signal too. The engine
   change merely took the crystal down with them.

   The root of B is that the scene threw away three quarters of the range
   before painting with it: three lowpasses in series (cascaded tau ~1.5s)
   averaging three bands that the engine AGCs INDEPENDENTLY. Engine bass spans
   0.817 p5->p95; `s.bass` arrived with 0.193. The rates go 1.2/0.8 ->
   3.0/2.0, energy 2 -> 3, field 1.4 -> 2.5, and the `^1.35` on fieldMix —
   free when its input pinned at 1.0, a 9-point darkening curve now — is
   deleted.

   Then the real find. In techno the level is near-constant BY DESIGN; what
   moves is each band's departure from its own recent mean, which the engine
   now publishes as `dev`. Raw devAvg measures spread 0.625 where s.energy has
   0.139. `loud` and `exc` are rebuilt as half absolute level, half deviation,
   each windowed on its own measured distribution — loud comes out spread
   0.257, exc 0.329, neither clipped.

   And the colour deal, which was the worst of it and is NOT a gain problem.
   `centroid` and `harm` were RATIOS BETWEEN INDEPENDENTLY AGC'd BANDS, so
   they carried almost nothing: centroid spanned 0.060 out of 0..1, and the
   dealt family q came out 9/84/381/0/0 over 474 frames — three of the five
   colour families never appeared, one held 80% of the show. Both now ride the
   DIFFERENCE of two deviations (dev.treble - dev.mid; dev.bass vs dev.treble
   measure r = 0.088, near-independent). The histogram becomes 65/111/123/87/21,
   all five families, and the plate re-deals between pink/magenta and
   yellow/green/blue the way the shipped build never does. `qHold` goes 0.18 ->
   0.45 to match, because a deal re-firing faster than dealPulse's own 0.5s
   decay is a flash, not a re-deal.

   THE ANTI-V7 CLAUSE, and it is the reason this version is allowed to ship.
   The last signal-driven Penrose was withdrawn because it bought reactivity
   with ink and measured DIMMER on scrim. Once `loud` stops pinning at 1.0,
   V10's alpha bases would drop edgeA from a constant 0.60 to 0.45-0.51 —
   exactly that trade. So the floors come UP: fillA 0.30 -> 0.56 (gain 0.46 ->
   0.34), edgeA 0.40 -> 0.58 (gain 0.20 -> 0.16). edgeA now sits at 0.65-0.70
   across the whole measured range: brighter than the shipped constant at every
   percentile AND moving. More reactivity must not cost legible ink; here it
   costs none.

   One thing genuinely new, and it is a size mechanic rather than a paint one:
   `s.front` breathes on deviation (0.92 + 0.20*dev), so the plate blooms into
   a drop and settles back through a breakdown. `hwm` is a high-water mark with
   a slow decay — it was never going to pulse on the beat. This is the
   arrangement-scale swing the music never had here, and it does not fight
   CC1: the hand changes what the crystal is MADE OF, the music changes how big
   it is. `audioLive` moves to the engine's own `live` gate, keeping
   `level > 0.05` as the fallback for a source the confidence has not seated.

   Left alone deliberately: `drive = 1.15` (correct headroom — bass p95 0.893,
   so it clips ~7% of frames), the entire kick path and `kEnv` (unchanged by
   the rewrite, measured identical at 8 and 54 fps), V10's whole deflation
   dissolve and V9's rubber, the navy under-glow at 0.15, `sub` (r = 0.996 with
   bass at this FFT size — a duplicate, not a signal), `lowmid` (real, but
   adding a fourth term to a three-band AVERAGE reduces variance, which is the
   opposite of this round), and every geometry and material constant: the
   diagonal's 0.40 weight, the three valence buckets, the bare-paper 0.62+0.38
   load, the off-register nudge, the 0.55 wash canvas and its blur-plus-sharp
   double composite. None of them read the audio; all of them are the medium.
   (V10's notes follow.) ------------------------------------------------- */

/* ---------- SRC-46.10 · PENROSE BLOOM V10 (the left hand subdivides it) -----
   Nima, on V9: "I need some ideas for what to do with CC1 for something high
   contrast such that when the user plays with it they notice the difference.
   Spinning speed isn't very visually interesting or high contrast." Of the
   options put up, he picked DEFLATION DEPTH — and it is the right one,
   because it is the thing the scene is already named after and the only axis
   left that changes the picture's STRUCTURE rather than its treatment.

   CC1 now walks the tiling's own deflation:

       level    3     4     5     6
       tiles  130   340   890  2330      (the show frame runs 3 -> 6)

   Closed hand: 130 hand-sized plates, a nib-drawn medallion. Open hand: 2330
   cells, a fine crystal. Eighteen times the count across one throw, and the
   move is legible in well under a second from across a dark room.

   WHY IT READS AS SUBDIVISION AND NOT AS A DISSOLVE. Deflation subdivides:
   the children of a tile exactly cover their parent, so a coarse level's
   lines are a SUB-LATTICE of the fine level's. Dissolving level n into
   level n+1 therefore leaves every shared line standing while the new
   interior lines fade in inside each rhomb — the plate looks like it is
   dividing under the hand, which is exactly what it is doing. Two adjacent
   levels are painted every frame, EQUAL-POWER (sqrt) weighted for the same
   reason a pan law is: two half-alpha strokes over each other come to 0.75,
   not 1, so a linear crossfade dips in the middle of the throw.

   The tables were already cached per level globally (pbTiles / pb4Rose /
   pb8Wash / pb8Diag / pb8Verts), so a "bundle" costs only its two growth
   arrays; all four are built in init, because the first reach into the
   coarse end during a show is not the moment to build a tiling. The growth
   front means the same thing at every depth — pbTiles normalises each
   level's radii to 0..1 — so loudness still sizes the crystal identically
   while the hand changes what it is made of.

   THE NIB DOES NOT CHANGE. One line weight at every depth, the way a plate
   drawn with one pen would be: it keeps the coarse end from reading as a
   cartoon, and it makes the shared lines identical during the dissolve.

   SPIN IS GONE, as a control. It was CC1's old job and it was the least
   interesting thing in the scene; what is left is a fixed slow drift (one
   revolution every forty seconds) so the plate is never quite dead. That is
   the subtraction this round pays for the addition.

   Everything else is V9: the rubber right hand, the two orders of line, the
   pen pooling by valence, the wash under the ink, the paper, and every audio
   coupling. */

/* one per deflation depth. Only `lit`/`fl`/`pts` are per-instance — every
   table behind them is a global cache keyed by level. */
function pb10Bundle(levels) {
  const tiles = pbTiles(levels), rose = pb4Rose(tiles, levels);
  return {
    lv: levels, tiles, rose,
    wash: pb8Wash(tiles, levels, rose),
    diag: pb8Diag(tiles, levels),
    vt: pb8Verts(tiles, levels),
    lit: new Float32Array(tiles.length),
    fl: new Float32Array(tiles.length),
    n: 0, pts: null, warm: false
  };
}

reg({
  id: 'SRC-46.11', family: 'SRC-46', ver: 11,
  title: 'Penrose Bloom V11', tech: 'PENROSE DEFLATION / INK + WASH ON PAPER / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'CC1 = DEFLATION DEPTH', 'CC2 = RUBBER', 'THE CRYSTAL SUBDIVIDES', 'KITES AND DARTS', 'RIDES DEVIATION'],
  desc: 'V10\'s plate — the left hand walking the deflation, the right hand rolling it like rubber, kites and darts on paper — with every AUDIO constant re-seated on the engine that ships today. Those numbers date from V6 and were tuned against a signal that sat at 0.9 and barely moved, so on the rewritten engine they all saturated or starved: the paint alphas moved by less than a hundredth across a full minute of techno, and the crystal grew to a fifth of the plate instead of a third. Two fixes, and not one geometry, hand or material constant touched. The plate is twice the size again, filling the frame and spilling past its edge, where on mesh scrim the edge is invisible anyway. And the paint rides DEVIATION — how far each band sits from its own recent average — which is the thing that actually moves in dance music, where the level is deliberately constant. The crystal now blooms into a drop and settles through a breakdown; the colour deal, which used to spend eighty percent of the show in one family, walks all five. The ink got BRIGHTER doing it, not dimmer: reactivity is not allowed to cost legibility on scrim.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music grows the crystal and paints it; the hands play the GEOMETRY. LEFT HAND / CC1 IS THE DEFLATION DEPTH: draw it back and the plate coarsens into a few enormous diamonds; reach in and it subdivides, twice, three times, into a fine crystal — the same tiling, drawn at four scales, with the new lines splitting each rhomb in place. It is the highest-contrast move in the scene and it needs no music at all. RIGHT HAND / CC2 IS RUBBER: at zero the lattice is a rigid crystal; open it and a slow swell runs outward while a second wave of twist skews the diamonds against it, so the sheet stretches, squashes and rolls — and the kick surges through it. With nobody playing, the plate drifts slowly across one subdivision and back, which is the tease: it shows you the mechanic without giving it away.',
  sound: 'Makes no sound of its own — an audio-in scene, the same as Cell Front V4-V11. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. Built for a full spectrum: it wants a kick under a bassline, and it shows a change in the harmonic balance as a re-deal of the colours. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const HI = as > 3.2 ? 6 : as > 1.7 ? 5 : 4;
    // LEVEL 3 IS THE FLOOR, not level 2. Two deflations leave 50 tiles, and
    // in a small window that is six enormous shapes overflowing the frame —
    // past "coarse" and out the other side, where it stops reading as a
    // Penrose tiling at all. Every state on the throw has to be a plate.
    const LO = Math.max(3, HI - 3);
    // ALL of them, now, in init: the tables are cheap at the coarse end and
    // the first reach into them during a show is not the moment to find out.
    const B = {};
    for (let L = LO; L <= HI; L++) B[L] = pb10Bundle(L);
    P.state = {
      B, LO, HI, levels: HI,
      depth: HI - 0.5, loLv: HI - 1, frac: 1, paper: pb7Paper(),
      life: 0, pres: 0, drive: 1.15, anchor: 0.5,
      rot: 0, elas: 0.10, wave: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0, dv: 0.5,
      tilt: 0.45, chord: 0, qNow: 0, qWant: -1, qHold: 0, dealPulse: 0,
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      fbase: 0.15, front: 0.15, hwm: 0.15, vel: 0,
      wc: null, wx: null, wb: null, wbx: null,
      twk: 1.8
    };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;

    /* ---- HANDS: CC1 subdivides the plate, CC2 stretches it -------------- */
    const cc1 = clamp(inp.L), cc2 = clamp(inp.R);
    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    // NEAR = MORE = FINER. The far end of the throw is the coarse plate,
    // which is a beautiful state in its own right — so a hand leaving the
    // field lands somewhere the picture still works, never on a collapse.
    const depthT = handLive
      ? s.LO + cc1 * (s.HI - s.LO)
      // unattended, the plate drifts across ONE subdivision and back, once a
      // minute: the tease that shows the mechanic without handing it over.
      : s.HI - 0.5 + 0.5 * Math.sin(s.life * 0.12);
    s.depth += (depthT - s.depth) * Math.min(1, dt * 5);
    s.depth = Math.max(s.LO, Math.min(s.HI, s.depth));
    const elasT = handLive ? cc2 : 0.10;
    s.elas += (elasT - s.elas) * Math.min(1, dt * 6);
    // spin is no longer a control — just enough drift that the plate is never
    // dead: one revolution every forty seconds.
    s.rot += 0.157 * dt;
    if (s.rot > TAU) s.rot -= TAU;
    s.wave += dt * (0.9 + 2.4 * s.elas + 4.2 * s.kEnv);
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
    // fieldMix weights sum to 1.06) — so it meant 0.51, ~680 of 2330 tiles at
    // the fine end. On the new engine field lands at 0.674 and it delivered
    // 0.386 = 440 tiles, 19% of the plate. 0.215 + 0.48 puts hwm back at
    // p50 ~0.60 — a plate that fills the 1200px frame and overflows it by a
    // few percent. The overflow is intended: on scrim the frame edge is
    // invisible black, and coverage goes as radius squared. The growth front
    // is normalised per level, so this sizes the plate identically at every
    // depth CC1 walks to.
    const baseTarget = 0.215 + 0.48 * s.field;
    s.fbase += (baseTarget - s.fbase) * Math.min(1, dt * (baseTarget > s.fbase ? 1.4 : 0.9));
    const prev = s.front;
    // AND IT BREATHES. hwm is a high-water mark with a 0.9/s decay — it was
    // never going to pulse on the beat, and even retuned it only spans
    // 0.554 -> 0.623. Deviation gives it a +10/-8% swing on arrangement scale,
    // so the plate blooms into a drop and settles back in a breakdown: the
    // only SIZE mechanic the music has ever had here (CC1's depth is the
    // hand's, and the two read as different things — one changes how big the
    // crystal is, the other what it is made of). Centred at 0.92 rather than
    // 0.88: a breath that SHRINKS the trough costs brightness at exactly the
    // moment already closest to the legibility floor.
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

    /* ---- CRYSTALLISE, ON WHICHEVER TWO LEVELS ARE ON SCREEN ------------ */
    s.loLv = Math.max(s.LO, Math.min(s.HI - 1, Math.floor(s.depth)));
    s.frac = s.depth - s.loLv;
    const up = Math.min(1, dt * 7), dn = Math.min(1, dt * 2.4), fd = Math.min(1, dt * 3.2);
    const grow = (b) => {
      const T = b.tiles, M = T.length;
      if (!b.warm) {
        // a level coming back on screen arrives ALREADY GROWN to the current
        // front — it is the same crystal at another scale, not a new one, so
        // it must not sweep out from the seed again (or flash while doing it)
        b.n = 0;
        while (b.n < M && T[b.n].r <= s.hwm) { b.lit[b.n] = 1; b.n++; }
        for (let i = b.n; i < M; i++) { b.lit[i] = 0; }
        b.fl.fill(0);
        b.warm = true;
      } else {
        while (b.n < M && T[b.n].r <= s.hwm) { b.fl[b.n] = 1; b.n++; }
        while (b.n > 0 && T[b.n - 1].r > s.hwm) b.n--;
      }
      for (let i = 0; i < M; i++) {
        const tgt = i < b.n ? 1 : 0;
        b.lit[i] += (tgt - b.lit[i]) * (tgt ? up : dn);
        if (b.fl[i] > 0.001) b.fl[i] -= b.fl[i] * fd;
      }
    };
    for (let L = s.LO; L <= s.HI; L++) {
      const on = L === s.loLv ? s.frac < 0.999 : (L === s.loLv + 1 && s.frac > 0.001);
      if (on) grow(s.B[L]); else s.B[L].warm = false;
    }

    // the twinkle lives on whichever plate is carrying the picture
    const dom = s.B[s.frac > 0.5 ? s.loLv + 1 : s.loLv];
    s.twk -= dt;
    if (s.twk <= 0) {
      s.twk = 2.4 + P.rand() * 3.6;
      if (dom.n > 2) dom.fl[(P.rand() * dom.n) | 0] = 1;
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.92;
    const bright = 0.45 + s.pres * 0.55;

    /* THE WASH LAYER lives on its own canvas (V7's law: the paper grain and
       the bleed are operations on the whole body of pigment, and the ink has
       to go over the dried wash rather than be added to it), rendered at a
       fraction of the frame and blown back up. */
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
    // ONE NIB AT EVERY DEPTH. A plate is drawn with one pen; scaling the line
    // with the cell would make the coarse end a cartoon, and it would stop
    // the shared lines of two levels from landing on top of each other.
    const lw = Math.max(2.6, 2.6 * ms);
    /* THE ANTI-V7 CLAUSE. The last signal-driven Penrose was withdrawn for
       buying reactivity with ink: once `loud` stops pinning at 1.0, V10's
       bases would drop edgeA from a constant 0.60 to 0.45-0.51. The floors
       come up so edgeA sits at 0.65-0.70 across the WHOLE measured range —
       brighter than the shipped constant at every percentile and moving.
       fillA likewise: 0.69-0.81 against a flat 0.78, over 2x the tiles. */
    const fillA = 0.56 + loud * 0.34 + s.kEnv * 0.08 + s.dealPulse * 0.10;
    const edgeA = 0.58 + loud * 0.16 + s.dealPulse * 0.10;

    const ca = Math.cos(s.rot), sa = Math.sin(s.rot);
    /* THE RUBBER (V9), unchanged: two waves, both pure functions of RADIUS,
       so tiles sharing a corner move it identically and the sheet never
       tears. Swell 0.080 of R against wavenumber 10.5 = gradient 0.84, just
       inside the amp*k < 1 law; twist shears instead of scaling and leaves
       the Jacobian determinant alone, so it cannot fold the mesh at all. */
    const ela = Math.pow(s.elas, 1.25);
    const amp = ela * (0.050 + 0.030 * s.kEnv), WK = 10.5;
    const twist = ela * (0.045 + 0.025 * s.kEnv), TK = 6.0;
    const live = amp > 1e-5 || twist > 1e-5;
    let PX = 0, PY = 0;
    const px = (px0, py0) => {
      let px1 = px0, py1 = py0;
      const rr = Math.hypot(px1, py1);
      if (rr > 1e-4 && live) {
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

    /* --- THE TWO PLATES ---------------------------------------------------
       EQUAL-POWER, not linear: two half-alpha strokes over each other come to
       0.75, so a linear dissolve dips exactly where the hand spends the most
       time. sqrt puts the shared lines at 0.91 in the middle instead. */
    const A = s.B[s.loLv], Bh = s.B[s.loLv + 1] || null;
    const mixA = Math.sqrt(1 - s.frac), mixB = Math.sqrt(s.frac);

    /* --- pass one: the wash, both plates, onto the small canvas ---------- */
    const washPass = (b, mix) => {
      if (mix < 0.012) return;
      const N = b.tiles.length;
      if (!b.pts || b.pts.length < N * 6) b.pts = new Float32Array(N * 6);
      const PT = b.pts;
      const off = (b.wash.edge || 0.05) * R * 0.055;
      const rimW = Math.max(1.2, (b.wash.edge || 0.05) * R * 0.095);
      for (let i = 0; i < N; i++) {
        const l = b.lit[i];
        if (l < 0.02) continue;
        const tl = b.tiles[i], o = i * 6;
        px(tl.x[0], tl.y[0]); PT[o] = PX; PT[o + 1] = PY;
        px(tl.x[1], tl.y[1]); PT[o + 2] = PX; PT[o + 3] = PY;
        px(tl.x[2], tl.y[2]); PT[o + 4] = PX; PT[o + 5] = PY;

        const wd = b.wash[i];
        if (wd < 0.01) continue;
        const fam = b.rose[i];
        const stray = b.wash.stray[i];
        const a = l * bright * mix;
        const shim = 0.72 + 0.28 * Math.sin(tl.r * 17 - s.life * 0.75 + tl.dir * 0.63);
        const dealt = (tl.cls + s.chord) % 1;
        const c = fam
          ? pbCol(tiltT + (fam === 1 ? -0.12 : 0.30) + tl.r * 0.16 + (dealt - 0.5) * 0.26)
          : CREAM;
        const load = wd * a * shim * fillA * (fam ? (0.55 + 0.95 * exc)
          : stray ? (0.26 + 0.34 * exc) : (0.16 + 0.22 * exc));
        const body = pb7Pig(c, 0.28);
        const oa = pb7Hash(i * 9 + 41) * TAU, om = off * (0.35 + 0.65 * pb7Hash(i * 9 + 42));
        const dx = Math.cos(oa) * om, dy = Math.sin(oa) * om;
        x.beginPath();
        x.moveTo(PT[o] + dx, PT[o + 1] + dy);
        x.lineTo(PT[o + 2] + dx, PT[o + 3] + dy);
        x.lineTo(PT[o + 4] + dx, PT[o + 5] + dy);
        x.closePath();
        x.fillStyle = `rgba(${body[0] | 0},${body[1] | 0},${body[2] | 0},${Math.min(0.82, load * 0.84)})`;
        x.fill();
        if (stray) {
          x.lineWidth = rimW;
          x.strokeStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.min(0.92, load * 1.18)})`;
          x.stroke();
        }
      }
    };
    washPass(A, mixA);
    if (Bh) washPass(Bh, mixB);

    /* --- the sheet's own tooth, then the paper drinks it past the line --- */
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = 0.72 + 0.28 * exc;
    x.fillStyle = s.paper;
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';

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

    /* --- pass two: the ink, over the dried wash, both plates ------------- */
    g.lineJoin = 'round';
    const inkPass = (b, mix) => {
      if (mix < 0.012) return;
      const N = b.tiles.length, PT = b.pts;
      if (!PT) return;
      for (let i = 0; i < N; i++) {
        const l = b.lit[i];
        if (l < 0.02) continue;
        const tl = b.tiles[i], o = i * 6;
        const a = l * bright * mix, fam = b.rose[i], f = b.fl[i];
        const dealt = (tl.cls + s.chord) % 1;
        const c = fam
          ? pbCol(tiltT + (fam === 1 ? -0.12 : 0.30) + tl.r * 0.16 + (dealt - 0.5) * 0.26)
          : CREAM;
        const r0 = (CREAM[0] * 0.55 + c[0] * 0.45) | 0;
        const g0 = (CREAM[1] * 0.55 + c[1] * 0.45) | 0;
        const b0 = (CREAM[2] * 0.55 + c[2] * 0.45) | 0;
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
        const oi = b.diag[i], i0 = ((oi + 1) % 3) * 2, i1 = ((oi + 2) % 3) * 2, i2 = oi * 2;
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
    };
    inkPass(A, mixA);
    if (Bh) inkPass(Bh, mixB);

    /* --- the pen pools at every junction, on both plates ------------------
       A coarse plate has fewer junctions and they are further apart, so the
       coarse end is a constellation and the fine end is a field — same rule,
       different scale, which is the whole point of the hand. */
    g.globalCompositeOperation = 'lighter';
    const poolPass = (b, mix) => {
      if (mix < 0.012) return;
      const V = b.vt, Rl = b.tiles.rMin + clamp(s.hwm, 0, 1.06) * b.tiles.rSpan;
      const base = Math.max(1.1, 1.15 * ms);
      for (let q = 0; q < 3; q++) {
        const lo = q === 0 ? 0 : q === 1 ? 6 : 9;
        const hi = q === 0 ? 5 : q === 1 ? 8 : 99;
        g.fillStyle = `rgba(255,240,212,${(0.07 + 0.17 * q) * bright * mix})`;
        g.beginPath();
        for (let i = 0; i < V.x.length; i++) {
          if (V.v[i] < lo || V.v[i] > hi || V.r[i] > Rl) continue;
          px(V.x[i], V.y[i]);
          const rr = base * (1 + 0.95 * q);
          g.moveTo(PX + rr, PY);
          g.arc(PX, PY, rr, 0, TAU);
        }
        g.fill();
      }
    };
    poolPass(A, mixA);
    if (Bh) poolPass(Bh, mixB);

    // the front — brightest on the frame a kick throws it outward. Its radius
    // is blended between the two plates, since each level normalises its own
    // shells and a hard swap would step the ring.
    const rMin = Bh ? A.tiles.rMin + (Bh.tiles.rMin - A.tiles.rMin) * s.frac : A.tiles.rMin;
    const rSpan = Bh ? A.tiles.rSpan + (Bh.tiles.rSpan - A.tiles.rSpan) * s.frac : A.tiles.rSpan;
    const fr = (rMin + clamp(s.front, 0, 1.06) * rSpan) * R;
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

    const dom = s.frac > 0.5 && Bh ? Bh : A;
    g.fillStyle = 'rgba(226,200,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '  MID ' + Math.round(s.mid * 100) +
      '  TREBLE ' + Math.round(s.treble * 100) + '  FIELD ' + Math.round(s.field * 100) +
      '  KICK ' + Math.round(s.kEnv * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') +
      ' age ' + Math.round(s._kAge * 1000) + 'ms' +
      (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ')' +
      '  FRONT ' + s.front.toFixed(2) + '/' + s.hwm.toFixed(2) +
      '  DEPTH ' + s.depth.toFixed(2) + ' (' + A.tiles.length + (Bh ? '+' + Bh.tiles.length : '') + ')' +
      '  TILES ' + dom.n + '/' + dom.tiles.length +
      '  TILT ' + Math.round(s.tilt * 100) + '  DEAL ' + s.qNow + '/5' +
      '  WASH ' + Math.round(exc * 100) + '  DEV ' + Math.round(s.dv * 100) +
      '  LOUD ' + Math.round(loud * 100) +
      '  ELAS ' + Math.round(s.elas * 100) +
      '  SWELL ' + (amp * 100).toFixed(1) + '%R/' + (amp * WK).toFixed(2) +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  }
});
