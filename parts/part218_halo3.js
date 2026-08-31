/* ---------- SRC-49.3 · SPECTRUM HALO V3 (the plate finds the new ground) ----
   No new mechanic, no new hand, and not one draw-side constant touched. The
   AUDIO IN engine was rewritten under this scene: it used to hand every band
   a compressed signal that sat near 0.9 and barely moved, and it now
   auto-ranges to the material. Every number in V2 was calibrated against the
   pinned signal, so on the new engine the same constants land far lower and
   the halo measured DIMMER than it ever shipped — >50-luminance coverage
   22.1% -> 14.8% on the same music. V3 re-seats the constants. Measured
   throughout on Leila.mp3 from 90s, 50s of real techno at ~440 sampled
   frames, played through a MediaStreamAudioDestinationNode into the REAL
   AUDIOIN path (not setAudioIn, which pins dev to 0.5 and flux to onset and
   therefore cannot exercise half of this round), localStorage cleared so the
   engine calibrates from virgin state; luminance off the 1920x1200 show frame
   with the HUD row excluded. Every V2 figure below was re-measured on that
   same rig rather than quoted, and it reproduces the shipped build's numbers
   to within a point.

   WHAT THE MEASUREMENT ACTUALLY SAID, because it is not what it looks like.
   The scene's DYNAMICS did not get worse — they got better. The 2.2/1.4 ease
   turns the engine's fast 0.78-spread band into its running mean, so s.bass
   now sits at p50 0.668 where it used to sit at ~0.87, but its eased spread
   (0.257) is WIDER than the old flat signal could ever produce. This is a
   mean-restoration problem, not a smoothing problem, so the ease is
   untouched: the header's "it can't jitter" law is intact and the ease is
   what makes it true.

   And the ugly one: `base` is geometrically capped at 0.450 (0.155+0.295),
   and a pinned sweep shows the old engine ran it at 0.447. The halo was
   PINNED AT ITS OWN CEILING on the old engine — "LOUDNESS IS DIAMETER" was
   as broken then as now, in the opposite direction. Over 38s of real music
   the diameter moved less than the idle breath LFO does (two frames 16s
   apart differ by 1.8x in bright coverage while field moves 0.002). So the
   brightness is restored SPLIT across diameter, lobe amplitude and smear
   rate — all three of which now have real spread to spend.

   ONE SHARED BAND WINDOW does all the re-seating (Penrose V3's law: narrow
   the input, don't crank the weight). The eased bands live in [0.29,0.78]
   with a p50 of 0.62-0.67; every constant downstream was written for 0.87.
   win(v) = clamp((v-0.26)*1.45) puts the p50 back where the constants expect
   it AND hands the scene the 1.45x wider excursion the new engine earned.
   It RELAXES TO IDENTITY at rest (wLo *= 1-rest, gain 1.45->1.00), because
   with no music there is nothing to window and V2's "CC2 sizes the resting
   breath in a silent room" lives entirely below that floor — a fixed 0.26
   floor would collapse that whole throw to nearly nothing and kill "the hand
   is never dead in a silent room". At rest=1 win(v) is exactly v. (The
   WINDOW is identity there; the coefficients it feeds are not, so the resting
   ring is ~6% wider than V2's. Measured rest during music: p50 0.000, p95
   0.011 — the window is at full strength whenever there is anything to hear.)

   Then each constant is set so its p50 lands on its old-engine value:
   · ab  0.150 -> 0.220 on wB   (old 0.1855 = 0.055 + C*0.592)
   · am  0.085 -> 0.168 on wM   (old 0.0960 = 0.022 + C*0.441)
   · at  0.032 -> 0.050 on wT   (old 0.0348 = 0.007 + C*0.551)
   · energy off the windowed bands (p50 0.528)
   · spd  0.90 -> 1.48, rot 0.22 -> 0.36 on that energy (old 1.333 / 0.2914).
     spd is the easy one to miss and it matters most: it is the phase drift
     that SEPARATES the 96 stamps, and at 1.11 they were landing on top of
     each other — a thin ring where the scene is supposed to be a wide plate.
   · field weights x1.56 (0.36/0.28/0.22/0.16 -> 0.56/0.44/0.34/0.25) and the
     ^1.05 exponent dropped, since the window now owns the shaping. field
     p50 0.539 -> 0.841, spread 0.167 -> ~0.53. The top few percent clamp,
     which is the drop filling the frame and is correct; the old constants
     clamped nothing because they never got near 1.

   WHAT THE RETUNE MEASURED, same rig, 50s of the same music, V2 vs V3, hands
   off (sens 1.0 — the engine-identity case), and the one number that only
   just makes it:
     >lum 50   15.5% -> 27.8%        (old engine 22.1%)
     >lum 15   28.7% -> 38.0%        (old engine ~40%; 37.1/37.5/38.0 over
                                      three runs, so it STRADDLES its 38% bar)
     mean lum  18.00 -> 24.94        (24)
     vfill     0.835 -> 0.943        (0.93)
     field spread (p95-p5) 0.153 -> 0.373, i.e. 2.4x, measured both sides on
       this rig. The retune's own spec predicted ~0.53 by combining the bands'
       separate percentiles, which treats them as independent and overstates
       what a single eased frame can do; the honest comparison is against V2
       measured the same way.
   And the price, stated plainly: below the window's 0.26 floor the bands read
   zero, so a genuinely quiet passage now draws a SMALL ring where V2 drew a
   medium one (synthetic bands pinned at 0.15-0.20: mean luminance 6.8 -> 3.2).
   That is the dynamic range this round exists to restore — "a quiet passage
   is a small ring and a drop fills the frame" is the scene's first law — but
   on a set with a long ambient intro it will read as darker than the shipped
   build, and that is the trade. On real techno the engine's AGC never takes
   the eased bands that low: measured mean luminance p5 is 19.7.

   The escalation for that >15 miss was measured and REFUSED. Field weights
   x1.70 (0.61/0.48/0.37/0.27) do clear it — >15 39.0%, >50 30.3% — but the
   outer contour's lobe depth drops 0.754 -> 0.719 and the uncompressed radius
   runs 0.640 p50 against an 0.50 ceiling, so the tanh flattens the loud end
   into a near-perfect CIRCLE and half the frames sit on the ceiling — V2's
   own disease, from the other side. The whole point of this ring is that bass
   throws it off-round. That is buying brightness by making it a different
   scene, which is not what a retune is for. At x1.56 the lobe depth is 0.754,
   IDENTICAL to V2's, while everything is bigger. So: within noise of the
   dim-outskirts bar, comfortably past every other one, lobes intact. If
   anyone wants that last point it is a look call about the KNEE, not a gain,
   and it is Lance's to make.

   THE PALETTE WAS A REAL DEFECT, not a scaling one. H2_RAMP centred the
   diverging ramp at tilt 0.51; the measured tilt distribution centres at
   0.600 (p5 0.504, p95 0.691, min 0.427). So the slate end LITERALLY NEVER
   APPEARED — 0% of frames — while over half carried visible coral, and every
   screenshot of V2 is white-and-coral. That is not the scene the header
   describes. [0.50, 0.70, 0.38] centres on the measured p50, reaches full
   colour at p5/p95, and its plateau holds the middle 50% of frames white
   (measured p25-p75 is +-0.037, the plateau is +-0.038). Both ends live, the
   white core preserved, colour reserved for a real spectral extreme. Honest
   caveat: the window is now calibrated to techno's spectral centroid, and a
   very bass-heavy set will sit cold. V2's tiltT formula and its 2.0/s ease
   are untouched — deriving tilt off the RAW bands was V2's fix and it works
   exactly as written (tilt p50 0.607/0.600/0.607 across the whole CC2 throw).

   THREE NEW ENGINE SIGNALS, used where they are actually the right answer:
   · `live` REPLACES `level > 0.05` as the audio arbiter. That test was
     written when level's p5 was 0.645; it is now 0.119 with a min of 0.000,
     so it is one bad frame from dropping out mid-track. `live` was true on
     100% of measured music frames.
   · `dev.bass` supplements the big lobes. What reads as "the bass just came
     in" is DEVIATION, not absolute level — the AGC makes absolute level
     constant across a set by construction. Centred (dev-0.5), so it is a
     strict no-op under setAudioIn (which pins dev to 0.5) and no harness
     baseline moves; +-0.030 at the extremes, and ab can never invert.
   · `flux.treble` supplements the fine scallop. flux is a sparse transient
     pulse (p50 0, p95 0.746, ~125ms decay = 4 stamps), so a hat writes a
     visibly scalloped stamp that then AGES BACKWARDS through the exposure —
     which is the long-exposure grammar itself, and what makes strata
     legible. Caveat: under setAudioIn this term reads `onset`, so shotaudio
     cannot exercise it; it needs a real-audio driver.
   NOT used, deliberately: `sub` (measured p50 0.709 vs bass 0.703 — a
   near-duplicate at fft 1024), and `dev` for FIELD — dev is centred on 0.5
   by construction, so a diameter driven by it has a constant mean and would
   never be small in an intro and big on a drop. Field stays on absolute
   level. That is Nima's law and it outranks the reactivity.

   THE WINDOW SITS AFTER THE GAMMA, on purpose. V2's CC2 response curve is
   preserved exactly: the gamma still reshapes response between 0 and 1 and
   the window rescales what the ease produced. Moving it before the gamma
   would rescale what CC2 MEANS and re-break what V2 fixed. One honest change
   to the throw: field now saturates above CC2 ~0.57, so past that point the
   hand stops making the halo bigger and keeps making it wilder (lobes) and
   faster (smear). "Wide open = the frame is full" is V2's stated intent, but
   the top half of the throw does something different now, and Lance should
   know. What forced it: on the shipped build a performer has to pin the
   sensitivity hand WIDE OPEN (21.7% coverage) to get back to what the scene
   did at neutral on the old engine (22.1%). The whole operating window had
   slid down one full control throw. That is the mandate this version serves.

   Left alone on measurement, not on faith: the kick path (kEnv p5 0.107 /
   p50 0.233 / p95 0.480, a healthy per-beat envelope — k.strength is
   time-domain and gain-normalised, so the engine change never touched it),
   the tanh knee (frame geometry, not an audio scale — expect the outer edge
   to stop growing linearly on loud passages now that base crosses it, which
   is the design working as documented), the eases, the idle floor, every
   hand mechanic V2 shipped, and every draw-side alpha and line width. Buying
   the brightness number by raising those would make it a different scene,
   and that is a look call, not a retune.
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
// [window lo, window hi, plateau]. RE-CENTRED ON THE MEASURED TILT (V3).
// V2's [0.34,0.68,0.30] centred at 0.51 against a distribution centred at
// 0.600, so the plate was permanently warm-tinted and the slate end never
// once appeared. Centre 0.600 = measured p50; half-width 0.10 reaches full
// colour at the measured p5/p95; plateau 0.38*0.10 = +-0.038 holds the middle
// 50% of frames (p25-p75 = +-0.037) at the core white. Both ends live now.
const H3_RAMP = [0.50, 0.70, 0.38];
// the tilt that reads as pure core white — the centre of the window above.
const H3_TCORE = (H3_RAMP[0] + H3_RAMP[1]) / 2;
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
  const am = 0.022 + 0.168 * s.wM + 0.030 * rest;                           // orders 5, 7
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
  desc: 'One closed curve around one centre, stamped into the frame thirty-two times a second and left there — so the picture is the last three seconds of the music standing still. LOUDNESS IS DIAMETER: the halo is a small quiet ring in an intro and swells to fill the frame on a drop, and because what you see is ninety-six stamps at once, that swell arrives as strata laid down over three seconds rather than a jumping outline. V3 re-seats every one of those numbers against the rewritten listening engine, which auto-ranges to the material instead of pinning near full scale — the diameter, the size of the lobes and the rate the stack smears at all move over their real range again for the first time, rather than sitting near a ceiling and breathing. The spectrum owns the SHAPE by harmonic order: bass swings the two and three-lobed forms that throw the whole ring off-round, mid fills the five and seven-lobed body of the band, treble writes the fine scallop on the outer edge and the hole in the middle, and a fresh hat or stab now scallops the one stamp it is born into, which then ages backwards through the exposure as its own visible stratum. Where the stamps agree they pile into a dense luminous band; where one wandered it leaves a soft translucent lobe hanging off the side, which is what a loud moment looks like a second after it happens. The plate is white at its core and DIVERGES at the ends: most stamps are born mid-spectrum and stay white, but one laid down while the bass was doing the work goes slate blue and one laid down while the top end was carrying goes coral, so the layers of the stack are different colours from each other and a section change is a band of colour growing through the exposure. V3 re-centres that palette window on where the balance of real music actually sits, so the slate end finally appears at all instead of the plate reading white-and-coral forever. Each slice wears the spectral balance it was born with — nothing is a gradient laid across the screen, and a quiet, even passage stays a plain white plate. The kick is the only fast thing here: it punches the newest ring outward and lights it, and then that ring simply ages backwards through the exposure. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music draws the curve; the hands decide how it is exposed and how hard it is listening. LEFT HAND / CC1 IS EXPOSURE: closed, you get a single crisp ring that moves like a live oscilloscope; opened, three full seconds of history smear out behind it into the layered plate. It answers the instant you move, with or without a signal. RIGHT HAND / CC2 IS SENSITIVITY, and since V2 it is a real one: it reshapes the whole response curve rather than just scaling it, so the entire throw does something on any material. Closed, only genuine peaks move the picture and a busy room stays a small still ring; open, quiet detail fills the frame and the room\'s own noise floor is enough to keep a plate breathing; the middle of the throw leaves the music exactly as the engine heard it. V3 re-seats where that throw sits: on the shipped build you had to pin this hand wide open just to get the brightness the scene used to have at neutral, and now neutral is neutral again — the trade is that past about the middle of the throw the halo stops growing in diameter and instead keeps getting wilder in its lobes and faster in its smear. It works with nothing connected too — it sizes the resting breath — a gain, never a value, so a hand the wall\'s ghost drift parked somewhere just leaves the scene near its base sensitivity instead of pretending the room is loud. The music colours the layers slate and coral; the hands own a colour of their own on top of that. Moving one FAST paints — fast being a real whip, since a deliberate sensitivity sweep is below the gate and paints nothing — the left breathing orange into the old end of the stack and the right violet into the live edge, both fading back over a couple of seconds and both capped so they tint the plate rather than replace it. In silence the ring keeps a slow breath so an unattended scene is still alive.',
  sound: 'Makes no sound of its own — an audio-in scene, same as Cell Front V4-V14 and Penrose Bloom. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants a full spectrum with a real kick, and it wants DYNAMICS above all — the diameter tracks loudness, so a track that never drops never shows the scene\'s range. V3 is tuned against the rewritten engine on real four-on-the-floor techno, where the loudness is near-constant by design and what actually moves is each band\'s departure from its own recent average; the bass lobes read that departure and the fine scallop reads fresh treble transients, so a track that is merely loud still looks different from one that is doing something. The kick is the only unsmoothed move in the picture and it is read off the engine\'s time-domain detector, so four-on-the-floor draws one bright ring per beat marching backwards through the exposure. No MIDI out either — there are no events to mirror.',

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
    const fieldT = clamp(0.56 * s.wL + 0.44 * s.wB + 0.34 * s.wM + 0.25 * s.wT);
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
    const spd = 0.55 + 1.48 * s.energy + 0.85 * s.rest;
    const RATE = [0.55, -0.67, 0.62, -0.78, 0.86, -1.02, 0.44, -0.58, 0.79];
    for (let i = 0; i < 9; i++) {
      s.ph[i] += RATE[i] * spd * dt;
      if (s.ph[i] > 1e5 || s.ph[i] < -1e5) s.ph[i] = 0;
    }
    s.rot += (0.10 + 0.36 * s.energy) * dt;
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
      const u = clamp((sl.tilt - H3_RAMP[0]) / Math.max(1e-4, H3_RAMP[1] - H3_RAMP[0]));
      const d = (u - 0.5) * 2;
      const k = clamp((Math.abs(d) - H3_RAMP[2]) / Math.max(1e-4, 1 - H3_RAMP[2]));
      const tw = k * k * (3 - 2 * k);
      const end = d < 0 ? H3_COLD : H3_WARM;
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
                               : (0.055 + 0.045 * sl.kick) * fade * bright * dens);
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
                                 : (0.062 + 0.048 * sl.kick) * fade * bright * dens);
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
