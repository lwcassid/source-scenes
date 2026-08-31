/* ---------- SRC-49.3 · SPECTRUM HALO V3 (the plate finds the new ground) ----
   No new mechanic and no new hand. The AUDIO IN engine was rewritten under
   this scene: it used to hand every band a compressed signal pinned near 0.9,
   and it now auto-ranges to the material. Every number V2 shipped was
   calibrated against the pinned signal, so on the new engine the same
   constants land far lower and the halo went DIM. V3 re-seats them.

   THIS VERSION'S FIRST CUT FAILED AN ADVERSARIAL SCRIM REVIEW — "should not
   ship as it stands" — and was reworked rather than shipped. All three
   findings reproduced on a fresh rig before anything was touched, and the
   worst of them was one the first cut's own header argued for at length. They
   are written down here because the mistake is instructive and generic: it
   placed a white PLATEAU exactly where the data lives instead of SPANNING the
   data, and then measured the result against the number it had optimised
   rather than against the picture.

   HOW EVERY NUMBER BELOW IS MEASURED. Leila.mp3 from 90s, 48s of real techno,
   ~520 sampled frames, decoded in-page and played through a
   MediaStreamAudioDestinationNode into the REAL AUDIOIN path — NOT
   setAudioIn, which pins dev to 0.5 and flux to onset and therefore cannot
   exercise half of this round. localStorage cleared so the engine calibrates
   from virgin state. Pixels read back off the composited 1920x1200 show frame
   (post-bloom) with the bottom 34px HUD row excluded. V2 and V3 are opened
   with IDENTICAL phase seeds, hands off (sens 1.0 — the engine-identity
   case), and captured at IDENTICAL MUSIC TIMESTAMPS, so the pair differs only
   by its constants. Harness caveat: swiftshader runs 11-15 fps and frame()
   caps dt at 0.05, so scene time runs slower than real; both legs share it,
   and no time constant was tuned against harness timing alone.

   THE MEASURED GROUND, which is what everything downstream is placed against:
     eased bands  p50 0.60-0.68, living in [0.29, 0.78] — every V2 constant
                  was written for a signal that sat at 0.87
     tilt         p5 0.502 · p25 0.560 · p50 0.594 · p75 0.621 · p95 0.667,
                  min 0.406 — measured, not assumed
     field (V2)   p5 0.492 · p50 0.633 · p95 0.667 — base 0.30..0.35 against a
                  geometric ceiling of 0.450 and a tanh knee at 0.32

   FINDING 1 — THE PALETTE WAS BACKWARDS. The first cut set the diverging ramp
   to [0.50, 0.70, 0.38]: centre on the measured tilt p50, plateau +-0.038 to
   hold the middle 50% of frames white. Both halves of that are true and the
   result was still wrong, because a SYMMETRIC window cannot serve this
   distribution. Coral needed tilt >0.638 and full coral 0.70 — unreachable on
   this material — so the only end it newly unlocked was SLATE, which is 2.5x
   darker than the core white. Measured: mean R-B of the ink above 150 luma
   went +12.3 (V2) to -13.1, six of six frames negative; the 40-150 body went
   -1.7 to -15.6. V2's stills have an unmistakable coral leading edge with rose
   strata. The first cut's are a white line on cold navy. That is not this
   scene.
   THE FIX IS FOUR MEASURED LANDMARKS, ASYMMETRIC: [slate full, slate onset,
   coral onset, coral full] = [0.455, 0.530, 0.560, 0.680]. The WARM half is
   placed to reproduce V2's response almost exactly — coral opens at ~p26, is
   half strength at p75, full at p95, agreeing with V2's own ramp to within
   0.02 at every percentile — because that half was never broken and it is the
   plate Lance shipped. The COLD half is widened and pushed down instead:
   slate opens at ~p10 and only reaches full depth around 0.455, below this
   track's minimum. So a bass-carrying stratum tints pale cool blue and only
   genuinely bass-dominated material drives deep slate. Both ends are live;
   the dark one is RATIONED, because darkness on scrim is a spend. Measured
   after: R-B above 150 luma +23.8, body +1.6.
   The generalisable rule, and it belongs to whoever writes the next ramp: a
   plateau centred on the p50 spans nothing. Place the ONSETS at percentiles
   you want the colour to start at, and let the ends fall where the tail is.

   FINDING 2 — THE BRIGHTNESS WAS IN THE WRONG PIXELS. The first cut's gain
   was real in the mean (19.7 -> 24.4) but it was mostly a bigger, dimmer
   wash: the ink above 150 luma did not move at all (29.2k -> 31.2k, +7%,
   inside run-to-run noise) while the dim 40-150 body ballooned. Low-contrast
   fill is exactly what mosquito net eats. The cause is not the diameter,
   which was the obvious suspect and the wrong one — it is that field, lobe
   amplitude and smear rate were ALL raised at once, so the same light got
   spread over a wider band with fewer stamps agreeing anywhere.
   THE FIX, in the order it was measured: (a) am 0.168 -> 0.150, because wM
   actually arrives at p50 0.495, not the 0.441 the first cut assumed, so am
   was overshooting its own old-engine target; (b) field weights x1.56 ->
   x1.41 of V2's (0.50/0.39/0.30/0.23 on the windowed bands) — see finding 3;
   (c) spd 1.48 -> 1.07 and rot 0.36 -> 0.30, which puts the phase drift back
   at the value the SHIPPED V2 actually delivers on this engine (1.19 vs 1.12)
   rather than at the old engine's 1.33 — the extra fine strata were more of
   what mesh shreds, not less; and (d) the one draw-side constant this round
   does touch, the HISTORY stroke alpha, 0.055 -> 0.066 outer and 0.062 ->
   0.074 inner (kick terms with them). Enlarging the figure without paying for
   the extra area is what made it a wash; that alpha is the payment, and it
   lands superlinearly in the overlap because the stack composites `lighter`,
   so it buys the dense band and not the outskirts. Pulling the LOBES back
   instead was tried and measured worse on every axis at once (>200 luma
   0.36% -> 0.28%, cv 14.9 -> 13.7) — shallower lobes did not reconcentrate
   the ink, they just made a smaller picture.

   FINDING 3 — THE DIAMETER WAS PINNED AT ITS CEILING, the exact disease this
   version exists to cure. On this rig the first cut ran field p50 0.848 / p95
   0.919, so base sat at 0.405 against a tanh knee of 0.32 and every outward
   lobe excursion was compressed while the inward ones were not. With CC2 wide
   open it was worse than that: field measured p5 0.923 / p50 1.000 — LITERALLY
   CLAMPED — so the top third of the sensitivity throw stopped changing the
   diameter at all.
   Two fixes. The weights come down to 0.50/0.39/0.30/0.23 (field p50 0.763,
   p95 0.833, max 0.872 — off the ceiling with headroom for a drop, and still
   1.6x V2's spread). And the hard clamp becomes a SOFT CAP by the scene's own
   established law (Nima, Penrose V3): body linear, bend only past a knee whose
   gradient is 1, `f <= 0.80 ? f : 0.80 + 0.20*tanh((f-0.80)/0.20)`. It is a
   no-op at neutral and it means the sensitivity hand keeps growing the halo
   all the way to the top of its throw instead of dying at CC2 ~0.64. Measured
   with CC2 wide open: field p50 1.000 (flat from p5 up) before, p50 0.981 /
   p95 0.990 / max 0.992 after — still steep, but never flat.

   WHAT THE FINISHED VERSION MEASURES, V2 / first cut / shipped, same rig,
   same music timestamps, hands off:
     mean luminance     19.7  /  24.4  /  23.4
     >15 luma            29.5% / 36.6% / 35.7%     (the dim outskirts)
     >50 luma            20.4% / 26.3% / 22.3%
     >200 luma           0.53% / 0.48% / 0.52%
     >245 luma           0.21% / 0.19% / 0.17%
     px >150 luma       29.2k / 31.2k / 33.2k      (the ink that survives mesh)
     max-channel >150    1.76% / n/a  /  2.29%     (light, unweighted by luma)
     R-B of ink >150    +12.3 / -13.1 / +22.6      (the coral leading edge)
     R-B of body 40-150  -1.7 / -15.6 /  +1.0
     contour roundness cv 13.3% / 14.6% / 15.1%    (bass throwing it off-round)
     mean radius        0.710 / 0.781 / 0.774      (of the half-frame)
     field p50 / p95    .633/.667 / .848/.919 / .785/.845
     field, CC2 wide open  n/a / p50 1.000 (CLAMPED, p5 0.923 — the hand is
       dead over the top third of its throw) / p50 0.981, p95 0.990, max 0.992
       — asymptotic, so the hand keeps working to the end of the reach
   So: warmer than V2 and warmer than V2 was, 14% MORE ink above 150 rather
   than the first cut's nothing, more off-round, 1.6x the diameter range, and
   the dim-outskirts recovery the round was mandated to deliver. The one
   number still under V2 is >245 luma (-14%), and it is a colour artifact, not
   a light loss: coral maxes at 153 luma by construction, so a warm core
   cannot reach 245 the way a white one can — on the unweighted max-channel
   measure the same pixels are UP (0.38% vs 0.34%).

   HONEST CAVEATS. (1) The ramp is calibrated to techno's spectral centroid; a
   very bass-heavy set will sit cooler, which is now a graceful pale blue
   rather than the first cut's dark slate, but it is still cooler. (2) Below
   the window's 0.26 floor the bands read zero, so a genuinely quiet ambient
   passage draws a smaller ring than the shipped V2 did. That IS the dynamic
   range this round exists to restore — "a quiet passage is a small ring and a
   drop fills the frame" is the scene's first law — but on a long ambient
   intro it will read darker than the build people have seen. (3) The
   >245-luma deficit above.

   KEPT FROM THE FIRST CUT, all of it measured rather than assumed:
   · ONE SHARED BAND WINDOW does the re-seating (Penrose V3's law: narrow the
     input, don't crank the weight). win(v) = clamp((v-0.26)*1.45) puts the
     p50 back where the constants expect it and hands the scene the 1.45x
     wider excursion the new engine earned. It RELAXES TO IDENTITY at rest
     (wLo *= 1-rest, gain 1.45->1.00), because with no music there is nothing
     to window and V2's "CC2 sizes the resting breath in a silent room" lives
     entirely below that floor. Measured rest during music: p50 0.000.
   · ab 0.150 -> 0.220 on wB, at 0.032 -> 0.050 on wT, each set so its p50
     lands on the value the old engine delivered.
   · `live` REPLACES `level > 0.05` as the audio arbiter. That test was
     written when level's p5 was 0.645; it is now 0.119 with a min of 0.000,
     so it was one bad frame from dropping out mid-track.
   · `dev.bass` supplements the big lobes — "the bass just came in" is
     DEVIATION, not absolute level, because the AGC makes absolute level
     constant across a set by construction. Centred (dev-0.5), so it is a
     strict no-op under setAudioIn and ab can never invert.
   · `flux.treble` supplements the fine scallop: a sparse transient pulse, so
     a hat writes a visibly scalloped stamp that then AGES BACKWARDS through
     the exposure — the long-exposure grammar itself.
   · the stamp wears the CORE WHITE when there is no music to have a spectral
     balance (`sl.tilt = TCORE + (tilt-TCORE)*s.aud`). The idle floor's fixed
     band ratios put tiltT at 0.432, which any re-centred window reads as
     cold; without this a silent room drove the whole plate slate.
   · NOT used: `sub` (a near-duplicate of bass at fft 1024) and `dev` for
     FIELD — dev is centred on 0.5 by construction, so a diameter driven by it
     would have a constant mean and could never be small in an intro and big
     on a drop. Field stays on absolute level. That is Nima's law and it
     outranks the reactivity.

   Left alone on measurement, not on faith: the kick path (kEnv p5 0.19 / p50
   0.30 / p95 0.48 — k.strength is time-domain and gain-normalised, so the
   engine change never touched it), the radius knee, the 2.2/1.4 eases, the
   idle floor, V2's tiltT formula and its 2.0/s ease, every hand mechanic V2
   shipped, and the live stroke's own alpha and widths.
   ------ V2 notes follow ------
   ---------- SRC-49.2 · SPECTRUM HALO V2 (CC2 is a real sensitivity control) --
   Nima: "make CC2 change sensitivity to audio instead of what it's doing now."
   It WAS nominally sensitivity in V1 — but as a multiply-then-clamp, which is
   barely a control at all: the band was scaled 0.55..1.70 and then clamped to
   1, so on a loud track everything above the middle of the throw saturated
   and did nothing, and the bottom of the throw only ever halved. The visible
   effect of moving that hand was the violet speed-paint, so CC2 read as "the
   violet hand", not as sensitivity.

   V2 makes it a RESPONSE CURVE instead — a gamma on the already-normalised
   band (`v^(1/sens)`), which is what a sensitivity control actually is:
   · low  (0.42) — only real peaks move the picture; a busy room stays a
     small still ring
   · 1.0        — untouched, exactly V1's response
   · high (2.32) — quiet detail fills the frame; the room's own noise floor
     is enough to keep a plate breathing
   Nothing saturates early, and the biggest change lands in the quiet-to-mid
   range where music actually lives: at level 0.35 the two ends of the throw
   are 7x apart, where V1's were 1.6x and both clipped by 0.6.

   The curve is applied AFTER the idle floor, so CC2 also visibly sizes the
   resting breath in a silent room — the hand is never dead, even with
   nothing connected. And the speed-paint now has a gate (0.55 controller
   units/sec): a deliberate sensitivity sweep paints nothing, only a whip
   does, so the control reads as sensitivity while you are using it as
   sensitivity. Everything else is V1.
   ------ V1 notes follow ------
   ---------- SRC-49 · SPECTRUM HALO (a long exposure of the spectrum) ----------
   Nima's reference plate: a ring built out of dozens of translucent
   contours laid over each other — a dense dark band where they agree, big
   soft lobes where one of them wandered, a scalloped hole in the middle.
   That is a LONG EXPOSURE of one breathing closed curve, so that is what
   this scene is.

   LOUDNESS IS DIAMETER (Nima's second round): `level` carries most of the
   radius, on a near-linear curve over twice the range it used to have, so a
   quiet passage is a small ring and a drop fills the frame. The swell still
   cannot jitter, because the picture is 96 stamps at once.

   The plate is WHITE AT THE CORE with DIVERGING ENDS (Nima, over two palette
   rounds): most stamps are born mid-spectrum and stay white, but a stamp laid
   down while the bass was carrying goes SLATE and one laid down while the top
   end was carrying goes CORAL — so the layers of the stack are different
   colours from each other, and a section change is a band of colour growing
   through the exposure. Colour is still the form's own data: each slice wears
   the spectral balance it was born with, never a gradient across the screen.

   ONE curve, r(theta), and the spectrum owns its harmonics by ORDER:
   · BASS  → orders 2 and 3, the big slow lobes that swing the whole ring
   · MID   → orders 5 and 7, the body of the band
   · TREBLE→ orders 11 and 17 outside, 13 inside, the fine scallop
   Thirty-two times a second the curve is stamped into a ring buffer and
   never touched again, so what you see is the last few SECONDS of the
   track standing still in the frame. A section change is a visible band in
   the stack; a kick is a ring that punches outward and then ages away.

   Why it can't jitter: nothing on screen is a live value. Every band is
   eased into the scene at ~1.8/s on top of the engine's own smoothing, the
   picture is the integral of 96 stamps, and the ONLY fast move in it is the
   kick — read off inp.audio.kick (the time-domain LP150 scanner, not the
   frame-polled onset), applied unsmoothed and back-dated by the hit's real
   age plus a display lead, exactly as Cell Front V11 established.

   The hands do not compete with the mic (Cell Front V5's law):
   · LEFT / CC1 = EXPOSURE — how many stamps are drawn, from a single crisp
     ring to three full seconds of smear. Continuous, immediate, and it is
     the one-second read for a stranger.
   · RIGHT / CC2 = SENSITIVITY — a gain on the bands, placid to violent. A
     hand left stale by the wall's ghost drift can only sit near the base
     floor; it can never lie about what the music is doing.
   Speed paints (Cell Front V12's law): how fast the LEFT hand moves breathes
   ORANGE into the old end of the stack, how fast the RIGHT hand moves
   breathes VIOLET into the live edge — age is the form's own field, so the
   colour is never a gradient laid over the screen.
   Makes no sound of its own. ------ */

const H3_SLICES = 96;          // ring buffer depth — 3.0s at 32 stamps/sec
const H3_PTS = 112;            // samples around the curve (order 17 needs ~68)
const H3_CAP = 1 / 32;         // seconds between stamps — fixed, not per-frame

// fixed sample angles: the cos/sin table is built once and never changes,
// so a whole frame of 96 contours costs multiplies, not 27k trig calls.
const H3_COS = new Float32Array(H3_PTS), H3_SIN = new Float32Array(H3_PTS);
for (let j = 0; j < H3_PTS; j++) {
  const a = j / H3_PTS * TAU;
  H3_COS[j] = Math.cos(a); H3_SIN[j] = Math.sin(a);
}

// WHITE PLATE CORE, DIVERGING LAYERS (Nima). The plate keeps its white
// centre — most stamps are born mid-spectrum and stay white — but the two
// ENDS diverge instead of running one way: a stamp born while the bass was
// carrying goes COOL, one born while the top end was carrying goes WARM.
// SLATE / CORAL (Nima's pick out of ten) — the colours are fine and untouched;
// they were simply never both REACHABLE.
const H3_COLD = [70, 99, 158];     // bass-heavy stamp — slate
const H3_CORE = [253, 250, 250];   // mid-spectrum stamp — the white plate
const H3_WARM = [255, 127, 107];   // treble-heavy stamp — coral
// FOUR MEASURED TILT LANDMARKS: [slate full, slate onset, coral onset,
// coral full]. The ramp is ASYMMETRIC on purpose, because the thing it has to
// span is: tilt over real techno runs p5 0.502 / p25 0.560 / p50 0.594 /
// p75 0.621 / p95 0.667 / min 0.406 (measured, Leila.mp3, 48s, ~520 frames).
// A SYMMETRIC window cannot serve that distribution, and both earlier tries
// prove it from opposite sides. V2's [0.34,0.68,0.30] put the whole
// distribution in its warm half: white-to-coral, correct-looking, but the
// slate end was unreachable (0% of frames). V3's first cut [0.50,0.70,0.38]
// re-centred on the p50 and made the plateau +-0.038 wide — so every frame
// landed IN the plateau or below it, coral needed tilt >0.638 and full coral
// 0.70 (unreachable on this material), and the only end it newly unlocked was
// SLATE, which is 2.5x darker than the core white. Measured cost: mean R-B of
// the ink above 150 luma went +12.3 (V2) to -13.1 (V3) — white line on cold
// navy, with the coral leading edge gone. Six of six frames negative.
// So: the WARM half is placed to reproduce V2's response almost exactly
// (coral opens at ~p26, half coral at p75, full coral at p95 — measured
// against V2's own ramp to within 0.02 at every percentile), because that
// half was never broken and it is the plate Lance shipped. The COLD half is
// widened and pushed down instead: slate opens at ~p10 and only reaches full
// depth around tilt 0.455, below this track's minimum. So a bass-carrying
// moment tints the stratum a pale cool blue, and only genuinely bass-dominated
// material — or another track — drives the deep slate. Both ends live; the
// dark one is rationed, because darkness on scrim is a spend.
const H3_RAMP = [0.455, 0.530, 0.560, 0.680];
// the tilt that reads as pure core white — the middle of the white plateau.
const H3_TCORE = (H3_RAMP[1] + H3_RAMP[2]) / 2;
const H3_ORANGE = [255, 162, 74];  // LEFT hand's speed
const H3_VIOLET = [185, 140, 255]; // RIGHT hand's speed

// one stamp = the curve as RADII (fractions of min(w,h)), frozen forever.
// Rotation is baked in: a long exposure is fixed in world space.
function h3Stamp(P) {
  const s = P.state;
  s.head = (s.head + 1) % s.depth;
  if (s.n < s.depth) s.n++;
  const sl = s.sl[s.head];
  // COLOUR IS THE MUSIC'S OWN SPECTRAL BALANCE — so with no music there is no
  // balance to wear, and the stamp wears the CORE WHITE. Found by measurement,
  // and it is a defect the re-centred window created: the idle floor's fixed
  // band ratios (1 / 0.7 / 0.6) put tiltT at 0.432, which sits below the new
  // window's cold end, so a silent room drove the whole plate to FULL SLATE —
  // 2.5x darker than white on scrim (measured mean luminance at rest 3.72 ->
  // 1.94 before this line). V2's wider window happened to land 0.432 at 13%
  // slate and got away with it. This is a no-op on music: s.aud measured p50
  // 1.000 with real audio playing.
  sl.tilt = H3_TCORE + (s.tilt - H3_TCORE) * s.aud;
  sl.kick = s.kEnv;

  const rest = s.rest;
  // V3: the WINDOWED bands (see step), with each coefficient set so its p50
  // lands on the value the old engine delivered. dev.bass is the "the bass
  // just came in" term — centred, so it is exactly zero under setAudioIn and
  // can never invert the lobe (min ab = 0.025). flux.treble is a sparse
  // transient pulse that scallops the stamp it is born into, which then ages
  // backwards through the exposure.
  const ab = 0.055 + 0.220 * s.wB + 0.060 * (s.devB - 0.5) + 0.075 * rest;  // orders 2, 3
  const am = 0.022 + 0.150 * s.wM + 0.030 * rest;                           // orders 5, 7
  const at = 0.007 + 0.050 * s.wT + 0.014 * s.fluxT + 0.012 * rest;         // orders 11, 17 (13 inside)
  // the kick pushes the newest ring outward, unsmoothed — it then simply
  // ages backwards through the stack as a bright bump.
  const bw = 1 + 0.35 * rest;
  const breath = 1 + bw * (0.130 * Math.sin(s.life * 0.55) + 0.090 * Math.sin(s.life * 0.33 + 2.1)
                         + 0.055 * Math.sin(s.life * 0.21 + 4.0));
  const base = (0.155 + 0.295 * s.field + 0.075 * rest) * breath * (1 + 0.085 * s.kEnv);
  const hole = 0.45 - 0.16 * s.field;
  // The old flat tanh compressed the WHOLE curve, so the loud end never
  // arrived: everything under the knee is now linear and only the excursions
  // bend, against a hard ceiling of exactly half the short side. The knee's
  // gradient is 1, so there is no visible crease where it takes over. V3 note:
  // field now genuinely reaches the top of its range, so `r` crosses the knee
  // far more often and the outer edge visibly stops growing linearly on a loud
  // passage. That is the compressor doing its documented job, not a defect.
  const KNEE = 0.32, RMAX = 0.50, SPAN = RMAX - KNEE;
  const p = s.ph, rot = s.rot;

  for (let j = 0; j < H3_PTS; j++) {
    const a = j / H3_PTS * TAU + rot;
    const m = ab * Math.sin(2 * a + p[0]) + 0.62 * ab * Math.sin(3 * a + p[1])
            + am * Math.sin(5 * a + p[2]) + 0.75 * am * Math.sin(7 * a + p[3])
            + at * Math.sin(11 * a + p[4]) + 0.60 * at * Math.sin(17 * a + p[5]);
    const r = base * (1 + m);
    // soft compression instead of a clamp — excursions stay in the frame
    // without ever flattening into a straight edge.
    const ro = r <= KNEE ? r : KNEE + SPAN * Math.tanh((r - KNEE) / SPAN);
    sl.out[j] = ro;
    const mi = 0.40 * m + 0.70 * am * Math.sin(8 * a + p[7]) + 2.40 * at * Math.sin(13 * a + p[8])
             + 0.40 * ab * Math.sin(3 * a + p[6]);
    sl.inn[j] = Math.max(0.02, Math.min(ro * 0.85, base * hole * (1 + mi)));
  }
}

reg({
  id: 'SRC-49.3', family: 'SRC-49', ver: 3,
  title: 'Spectrum Halo V3', tech: 'POLAR CONTOUR / LONG EXPOSURE / AUDIO-DRAWN',
  audioIn: true,
  fx: { bloom: 0.35 },
  tags: ['AUDIO IN', 'CC1 = EXPOSURE', 'CC2 = SENSITIVITY CURVE', 'BAND = HARMONIC ORDER', 'LOUD IS BIG', 'SLATE + CORAL LAYERS'],
  desc: 'One closed curve around one centre, stamped into the frame thirty-two times a second and left there — so the picture is the last three seconds of the music standing still. LOUDNESS IS DIAMETER: the halo is a small quiet ring in an intro and swells to fill the frame on a drop, and because what you see is ninety-six stamps at once, that swell arrives as strata laid down over three seconds rather than a jumping outline. V3 re-seats every one of those numbers against the rewritten listening engine, which auto-ranges to the material instead of pinning near full scale — the diameter, the size of the lobes and the rate the stack smears at all move over their real range again for the first time, rather than sitting near a ceiling and breathing. The spectrum owns the SHAPE by harmonic order: bass swings the two and three-lobed forms that throw the whole ring off-round, mid fills the five and seven-lobed body of the band, treble writes the fine scallop on the outer edge and the hole in the middle, and a fresh hat or stab now scallops the one stamp it is born into, which then ages backwards through the exposure as its own visible stratum. Where the stamps agree they pile into a dense luminous band; where one wandered it leaves a soft translucent lobe hanging off the side, which is what a loud moment looks like a second after it happens. The plate is white at its core and DIVERGES at the ends: most stamps are born mid-spectrum and stay white, but one laid down while the bass was doing the work goes slate blue and one laid down while the top end was carrying goes coral, so the layers of the stack are different colours from each other and a section change is a band of colour growing through the exposure. V3 re-places that palette window against the balance real music actually has: the coral end is kept exactly where V2 had it — the warm leading edge is this plate’s signature and it was never the thing that broke — while the cool end is widened and pushed down so slate becomes reachable at all instead of never appearing, and reaches its full depth only for genuinely bass-dominated material. Both ends are live and the dark one is rationed. Each slice wears the spectral balance it was born with — nothing is a gradient laid across the screen, and a quiet, even passage stays a plain white plate. The kick is the only fast thing here: it punches the newest ring outward and lights it, and then that ring simply ages backwards through the exposure. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music draws the curve; the hands decide how it is exposed and how hard it is listening. LEFT HAND / CC1 IS EXPOSURE: closed, you get a single crisp ring that moves like a live oscilloscope; opened, three full seconds of history smear out behind it into the layered plate. It answers the instant you move, with or without a signal. RIGHT HAND / CC2 IS SENSITIVITY, and since V2 it is a real one: it reshapes the whole response curve rather than just scaling it, so the entire throw does something on any material. Closed, only genuine peaks move the picture and a busy room stays a small still ring; open, quiet detail fills the frame and the room\'s own noise floor is enough to keep a plate breathing; the middle of the throw leaves the music exactly as the engine heard it. V3 re-seats where that throw sits: on the shipped build you had to pin this hand wide open just to get the brightness the scene used to have at neutral, and now neutral is neutral again, and the halo keeps growing all the way to the top of the throw — the diameter runs into a soft ceiling rather than a wall, so the last third of the reach reads as diminishing returns instead of as a dead hand. It works with nothing connected too — it sizes the resting breath — a gain, never a value, so a hand the wall\'s ghost drift parked somewhere just leaves the scene near its base sensitivity instead of pretending the room is loud. The music colours the layers slate and coral; the hands own a colour of their own on top of that. Moving one FAST paints — fast being a real whip, since a deliberate sensitivity sweep is below the gate and paints nothing — the left breathing orange into the old end of the stack and the right violet into the live edge, both fading back over a couple of seconds and both capped so they tint the plate rather than replace it. In silence the ring keeps a slow breath so an unattended scene is still alive.',
  sound: 'Makes no sound of its own — an audio-in scene, same as Cell Front V4-V14 and Penrose Bloom. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants a full spectrum with a real kick, and it wants DYNAMICS above all — the diameter tracks loudness, so a track that never drops never shows the scene\'s range. V3 is tuned against the rewritten engine on real four-on-the-floor techno, where the loudness is near-constant by design and what actually moves is each band\'s departure from its own recent average; the bass lobes read that departure and the fine scallop reads fresh treble transients, so a track that is merely loud still looks different from one that is doing something. Colour is calibrated to where a four-to-the-floor set’s spectral balance actually sits: mid-spectrum is the white plate, a top-end section grows coral through the exposure, and a bass-dominated one cools it. The kick is the only unsmoothed move in the picture and it is read off the engine\'s time-domain detector, so four-on-the-floor draws one bright ring per beat marching backwards through the exposure. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const depth = as > 3.2 ? H3_SLICES : as > 1.7 ? 64 : 40;
    const sl = [];
    for (let i = 0; i < depth; i++) {
      sl.push({ out: new Float32Array(H3_PTS), inn: new Float32Array(H3_PTS), tilt: 0.5, kick: 0 });
    }
    P.state = {
      sl, depth, head: -1, n: 0, capT: 0, life: 0,
      pres: 0, rest: 1, expo: 0.78, sens: 1.0, velL: 0, velR: 0, pL: 0.5, pR: 0.5,
      level: 0, bass: 0, mid: 0, treble: 0, energy: 0, field: 0, tilt: 0.5,
      // the windowed bands the stamp draws from, plus the two new engine
      // signals it supplements with (kept on state so the fixed-rate stamp
      // reads exactly what the frame that produced it saw).
      wL: 0, wB: 0, wM: 0, wT: 0, devB: 0.5, fluxT: 0, aud: 0,
      rot: 0,
      ph: [P.rand() * TAU, P.rand() * TAU, P.rand() * TAU,
           P.rand() * TAU, P.rand() * TAU, P.rand() * TAU,
           P.rand() * TAU, P.rand() * TAU, P.rand() * TAU],
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _prevOnset: 0, LEAD: 0.030
    };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;

    /* ---- HANDS: exposure and sensitivity, never a signal value --------- */
    const cc1 = clamp(inp.L), cc2 = clamp(inp.R);
    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    // no hands live → settle to a middling exposure and base sensitivity,
    // rather than sit wherever the wall's ambient ghost drift left CC1/CC2.
    const expoT = handLive ? cc1 : 0.78;
    // 0.42 .. 2.32, used as a GAMMA below — not as a multiplier
    const sensT = handLive ? 0.42 + cc2 * 1.90 : 1.0;
    s.expo += (expoT - s.expo) * Math.min(1, dt * 5);
    s.sens += (sensT - s.sens) * Math.min(1, dt * 4);

    // SPEED is its own input: a held hand has zero velocity, so no stale
    // controller value can fake it. Snap up, fade over ~2.4s. GATED at 0.55
    // controller units/sec (V2): setting sensitivity is a deliberate, slow
    // move and must paint nothing, or the paint is all you see and the hand
    // reads as a colour control instead of the control it is. A whip still
    // paints in full.
    const GATE = 0.55;
    const vL = clamp((Math.abs(cc1 - s.pL) / Math.max(dt, 1e-3) - GATE) * 1.1);
    const vR = clamp((Math.abs(cc2 - s.pR) / Math.max(dt, 1e-3) - GATE) * 1.1);
    s.pL = cc1; s.pR = cc2;
    s.velL -= s.velL * Math.min(1, dt * 0.42); if (vL > s.velL) s.velL = vL;
    s.velR -= s.velR * Math.min(1, dt * 0.42); if (vR > s.velR) s.velR = vR;

    // V3: `live` is the ENGINE'S OWN answer to "is a real source playing"
    // (silence gate AND dynamic-range confidence). The old `level > 0.05`
    // was written when level's p5 was 0.645; on the re-based engine that p5
    // is 0.119 with a min of 0.000, so the arbiter was one bad frame from
    // dropping out mid-track. `live` measured true on 100% of music frames.
    const aud = inp.audio;
    const audioLive = aud.live || aud.onset > 0.3;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);
    // REST: nobody at the instrument AND nothing to listen to. The scene has
    // to be a PLATE at rest, not a wire ring — with no music moving the curve
    // the 96 stamps land almost on top of each other, so rest deliberately
    // opens the lobes and widens the breath until the strata separate again.
    s.rest += (((handLive || audioLive) ? 0 : 1) - s.rest) * Math.min(1, dt * 0.8);
    // IS THERE MUSIC — separate from `rest`, which also answers to the hands.
    // Only this decides whether a stamp wears a colour at all.
    s.aud += ((audioLive ? 1 : 0) - s.aud) * Math.min(1, dt * 0.8);

    /* ---- THE BANDS (slow clock) — the shape of the curve ---------------- */
    // engine-smoothed already; eased again at ~1.8/s so a bassline note
    // moves the ring over a bar, never over a frame. Silence still breathes.
    const idle = (0.045 + 0.030 * Math.sin(s.life * 0.21)) * (1 - 0.72 * s.pres);
    // SENSITIVITY IS A CURVE (V2). A gamma reshapes the whole response and
    // only reaches 1 when the band itself does. Applied AFTER the idle floor,
    // so the hand still sizes the resting breath when nothing is connected —
    // and BEFORE V3's window, so what CC2 means is untouched.
    const gam = 1 / s.sens;
    const sens = (v) => Math.pow(clamp(v), gam);
    const rL = Math.max(idle, aud.level);
    const rB = Math.max(idle, aud.bass);
    const rM = Math.max(idle * 0.7, aud.mid);
    const rT = Math.max(idle * 0.6, aud.treble);
    const lT = sens(rL), bT = sens(rB), mT = sens(rM), tT = sens(rT);
    s.level += (lT - s.level) * Math.min(1, dt * (lT > s.level ? 2.2 : 1.4));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 2.2 : 1.4));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 2.2 : 1.4));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 2.2 : 1.4));

    // THE BANDS AS THEY ACTUALLY ARRIVE (V3). Measured over 38s of real techno
    // on the re-based engine: the eased bands live in [0.29,0.78] with a p50 of
    // 0.62-0.67, where every constant below was written for a signal that sat
    // at 0.87. The window puts the p50 back where the constants expect it AND
    // hands the scene the 1.45x wider excursion the new engine earned. It
    // RELAXES TO IDENTITY at rest, because with no music there is nothing to
    // window — and because V2's CC2-sizes-the-resting-breath behaviour lives
    // entirely below this floor.
    const wLo = 0.26 * (1 - s.rest), wG = 1.45 - 0.45 * s.rest;
    const win = (v) => clamp((v - wLo) * wG);
    s.wL = win(s.level); s.wB = win(s.bass); s.wM = win(s.mid); s.wT = win(s.treble);
    // the two supplements the stamp reads, snapshotted here so the fixed-rate
    // stamp uses the same frame's values. Defensive reads: an older engine (or
    // a relay without the new fields) simply contributes nothing.
    s.devB = (aud.dev && typeof aud.dev.bass === 'number') ? aud.dev.bass : 0.5;
    s.fluxT = (aud.flux && typeof aud.flux.treble === 'number') ? aud.flux.treble : 0;

    s.energy += (((s.wB + s.wM + s.wT) / 3) - s.energy) * Math.min(1, dt * 2);
    // LOUDNESS IS DIAMETER. `level` carries most of it (it is the honest
    // broadband loudness), the bands only tilt it. V3: weights x1.56 on the
    // windowed bands, so field p50 goes 0.539 -> 0.841 and its spread 0.167 ->
    // ~0.53 — the halo is genuinely small in an intro and full on a drop
    // instead of parked near the geometric ceiling. The old ^1.05 exponent is
    // gone: it shaved 1-2% and the window owns the shaping now.
    // and a SOFT CAP instead of a clamp, by the same law the radius uses
    // (Nima, Penrose V3): keep the body linear and bend only past a knee whose
    // gradient is 1, so nothing creases. A hard clamp at 1 is what pinned the
    // diameter for the top third of the CC2 throw; past 0.80 the field now
    // asymptotes instead, so opening the sensitivity hand all the way still
    // makes the halo grow — just less and less, which is what a ceiling should
 // feel like. Measured hands-off: p50 0.785, p95 0.845, so this is a no-op
    // on the neutral case and only shapes the top of the hand's range.
    const fRaw = 0.50 * s.wL + 0.39 * s.wB + 0.30 * s.wM + 0.23 * s.wT;
    const FK = 0.80, FS = 0.20;
    const fieldT = fRaw <= FK ? fRaw : FK + FS * Math.tanh((fRaw - FK) / FS);
    s.field += (fieldT - s.field) * Math.min(1, dt * 2.2);
    // spectral balance of THIS moment — stamped into every slice as its colour.
    // TILT COMES OFF THE RAW BALANCE, not the sensitivity-shaped bands, and not
    // the windowed ones either (V2's fix; measured stable across the whole CC2
    // throw, p50 0.607/0.600/0.607). A gamma does not preserve ratios, so
    // deriving colour from shaped values turns CC2 into a hue control.
    // Sensitivity changes how MUCH the picture responds, never what colour.
    const tiltT = clamp((rT * 1.25 + rM * 0.45) / (rT * 1.25 + rM * 0.45 + rB + 0.02));
    // Eased at 2.0/s rather than 1.1: the tilt is what each stamp WEARS, so a
    // slower ease means a 3s exposure only ever holds ~3 distinct hues and the
    // stack looks monochrome. This tracks bar-to-bar spectral movement, so
    // neighbouring layers genuinely differ, without chasing single notes.
    s.tilt += (tiltT - s.tilt) * Math.min(1, dt * 2.0);

    /* ---- THE KICK (fast clock) — the only unsmoothed move --------------- */
    const k = aud.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetEdge = aud.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = aud.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(aud.now - k.t, 0, 0.2);
      }
    } else if (onsetEdge) { edge = true; hit = clamp(0.4 + aud.level * 0.4); }
    if (edge && s._kGap > 0.09) {
      s._kGap = 0; s._kAge = age;
      // back-date along the envelope's own decay by the hit's true age plus
      // the display lead, so the ring is where it belongs for THIS vsync.
      s.kEnv = Math.max(s.kEnv, clamp(hit * Math.exp(-3.4 * (age + s.LEAD))));
    }
    s.kEnv -= s.kEnv * Math.min(1, dt * 3.0);

    /* ---- PHASES + the slow turn that makes the stack smear -------------- */
    // V3: 0.90 -> 1.48 on an energy whose p50 is now 0.528 instead of 0.87, so
    // spd sits back at its old ~1.33. This is the drift that SEPARATES the 96
    // stamps: at 1.11 they land on top of each other and the plate collapses
    // into a thin ring, which is a direct driver of how much of the frame the
    // scene fills.
    const spd = 0.55 + 1.07 * s.energy + 0.85 * s.rest;
    const RATE = [0.55, -0.67, 0.62, -0.78, 0.86, -1.02, 0.44, -0.58, 0.79];
    for (let i = 0; i < 9; i++) {
      s.ph[i] += RATE[i] * spd * dt;
      if (s.ph[i] > 1e5 || s.ph[i] < -1e5) s.ph[i] = 0;
    }
    s.rot += (0.10 + 0.30 * s.energy) * dt;
    if (s.rot > TAU) s.rot -= TAU;

    /* ---- STAMP the curve into the ring buffer at a FIXED rate ----------- */
    s.capT += dt;
    let stamps = 0;
    while (s.capT >= H3_CAP && stamps < 2) { s.capT -= H3_CAP; stamps++; h3Stamp(P); }
    if (s.capT > H3_CAP * 4) s.capT = 0;   // never spiral after a hitch
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    if (s.n === 0) return;

    const cx = w / 2, cy = h / 2;
    const S = Math.min(w, h);          // radial work scales off the SHORT side
    const bright = 0.58 + s.pres * 0.42;
    const vis = Math.max(1, Math.min(s.n, Math.round(8 + s.expo * (s.depth - 8))));

    g.globalCompositeOperation = 'lighter';

    // a breath of light behind the band, so the ring sits in something
    const rg = g.createRadialGradient(cx, cy, S * 0.10, cx, cy, S * 0.48);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(0.55, `rgba(26,40,104,${(0.16 + 0.14 * s.field) * bright})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(cx - S * 0.5, cy - S * 0.5, S, S);

    const lwHist = Math.max(1.6, 2.1 * ms);
    // a shallow stack has nothing piling up behind the live ring, so the ring
    // itself carries the light; a deep one is carried by the accumulation.
    const liveA = 0.20 + 0.34 * (1 - s.expo);
    const lwLive = Math.max(3.0, 3.2 * ms);

    // oldest first so the live edge lands on top
    const DENSE = 24;                 // stamps drawn one for one
    for (let i = vis - 1; i >= 0; i--) {
      if (i >= DENSE && (i & 1)) continue;
      const dens = i >= DENSE ? 2 : 1;
      const sl = s.sl[((s.head - i) % s.depth + s.depth) % s.depth];
      const a = vis > 1 ? i / (vis - 1) : 0;      // 0 = newest, 1 = oldest
      const fade = Math.pow(1 - a, 0.55);
      const live = i === 0;

      // COLOUR: the slice's own spectral balance, then the hands' speed —
      // orange into the old end, violet into the live edge. Age is the
      // form's field, so nothing is a gradient laid across the screen.
      const wOld = 0.18 + 0.82 * a * a, wNew = 0.18 + 0.82 * (1 - a) * (1 - a);
      // DIVERGING: white in the middle, cool one way, warm the other. The
      // plateau is smoothstepped out of the centre so the plate never shows
      // a seam where colour starts.
      // ASYMMETRIC (V3): the warm side reproduces V2's ramp, the cold side is
      // wider and lower so slate is reachable without being cheap. Between the
      // two onsets the stamp is pure core white — that is the plate.
      let end = H3_CORE, k = 0;
      if (sl.tilt >= H3_RAMP[2]) {
        end = H3_WARM;
        k = clamp((sl.tilt - H3_RAMP[2]) / Math.max(1e-4, H3_RAMP[3] - H3_RAMP[2]));
      } else if (sl.tilt <= H3_RAMP[1]) {
        end = H3_COLD;
        k = clamp((H3_RAMP[1] - sl.tilt) / Math.max(1e-4, H3_RAMP[1] - H3_RAMP[0]));
      }
      const tw = k * k * (3 - 2 * k);
      let cr = H3_CORE[0] + (end[0] - H3_CORE[0]) * tw;
      let cg = H3_CORE[1] + (end[1] - H3_CORE[1]) * tw;
      let cb = H3_CORE[2] + (end[2] - H3_CORE[2]) * tw;
      // an ACCENT, not a takeover: a fast hand can pull the colour ~60% of
      // the way to its own, never all of it, so the spectrum stays legible
      // underneath the paint (a full repaint is the same mistake as a
      // full-canvas tint).
      const mo = clamp(wOld * s.velL * 1.15) * 0.60, mv = clamp(wNew * s.velR * 1.15) * 0.60;
      cr += (H3_ORANGE[0] - cr) * mo; cg += (H3_ORANGE[1] - cg) * mo; cb += (H3_ORANGE[2] - cb) * mo;
      cr += (H3_VIOLET[0] - cr) * mv; cg += (H3_VIOLET[1] - cg) * mv; cb += (H3_VIOLET[2] - cb) * mv;
      const col = (al) => `rgba(${cr | 0},${cg | 0},${cb | 0},${al})`;

      // every twelfth stamp also lays the BAND down as one translucent fill —
      // one continuous shape, never a fan of strokes. That is where the big
      // soft lobes of the plate come from.
      if (i % 12 === 0 && i > 3) {
        g.beginPath();
        for (let j = 0; j < H3_PTS; j++) {
          const r = sl.out[j] * S;
          const x = cx + r * H3_COS[j], y = cy + r * H3_SIN[j];
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        for (let j = 0; j < H3_PTS; j++) {
          const r = sl.inn[j] * S;
          const x = cx + r * H3_COS[j], y = cy + r * H3_SIN[j];
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        g.fillStyle = col((0.019 + 0.015 * sl.kick) * fade * bright * dens);
        g.fill('evenodd');
      }

      // the edges: the light. History hairlines pile into the dense band;
      // the newest ring is fat enough to read on scrim on its own.
      g.lineWidth = live ? lwLive : lwHist;
      g.strokeStyle = col(live ? (liveA + 0.30 * s.kEnv) * bright
                               : (0.066 + 0.054 * sl.kick) * fade * bright * dens);
      g.beginPath();
      for (let j = 0; j < H3_PTS; j++) {
        const r = sl.out[j] * S;
        const x = cx + r * H3_COS[j], y = cy + r * H3_SIN[j];
        j ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
      g.stroke();

      if (live || i % 3 === 0) {
        g.lineWidth = live ? lwLive * 0.8 : lwHist * 0.8;
        g.strokeStyle = col(live ? (liveA * 0.78 + 0.22 * s.kEnv) * bright
                                 : (0.074 + 0.058 * sl.kick) * fade * bright * dens);
        g.beginPath();
        for (let j = 0; j < H3_PTS; j++) {
          const r = sl.inn[j] * S;
          const x = cx + r * H3_COS[j], y = cy + r * H3_SIN[j];
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        g.stroke();
      }
    }

    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(220,226,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    // HUD stays on the UN-WINDOWED eased bands, so BASS/MID/TREBLE mean the
    // same thing they have meant in every version; the windowed values the
    // shape is actually drawn from are printed beside them as WIN, rather
    // than silently changing what the debug strip reads.
    g.fillText('BASS ' + Math.round(s.bass * 100) + '  MID ' + Math.round(s.mid * 100) +
      '  TREBLE ' + Math.round(s.treble * 100) +
      '  WIN ' + Math.round(s.wB * 100) + '/' + Math.round(s.wM * 100) + '/' + Math.round(s.wT * 100) +
      '  FIELD ' + Math.round(s.field * 100) +
      '  TILT ' + Math.round(s.tilt * 100) +
      '  LEVEL ' + Math.round(s.level * 100) +
      '  KICK ' + Math.round(s.kEnv * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') +
      ' age ' + Math.round(s._kAge * 1000) + 'ms' +
      (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ')' +
      '  EXPO ' + vis + '/' + s.depth + ' (' + (vis / 32).toFixed(2) + 's)' +
      '  SENS ' + s.sens.toFixed(2) + ' (g' + (1 / s.sens).toFixed(2) + ')' +
      '  PAINT ' + Math.round(s.velL * 100) + '/' + Math.round(s.velR * 100) +
      '  REST ' + Math.round(s.rest * 100) +
      (s.pres < 0.3 ? '   · HALO BREATHING' : ''), 10, h - 10);
  }
});
