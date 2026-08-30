/* ---------- SRC-49.2 · SPECTRUM HALO V2 (CC2 is a real sensitivity control) ----------
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

const H2_SLICES = 96;          // ring buffer depth — 3.0s at 32 stamps/sec
const H2_PTS = 112;            // samples around the curve (order 17 needs ~68)
const H2_CAP = 1 / 32;         // seconds between stamps — fixed, not per-frame

// fixed sample angles: the cos/sin table is built once and never changes,
// so a whole frame of 96 contours costs multiplies, not 27k trig calls.
const H2_COS = new Float32Array(H2_PTS), H2_SIN = new Float32Array(H2_PTS);
for (let j = 0; j < H2_PTS; j++) {
  const a = j / H2_PTS * TAU;
  H2_COS[j] = Math.cos(a); H2_SIN[j] = Math.sin(a);
}

// WHITE PLATE CORE, DIVERGING LAYERS (Nima). The plate keeps its white
// centre — most stamps are born mid-spectrum and stay white — but the two
// ENDS now diverge instead of running one way: a stamp born while the bass
// was carrying goes COOL, one born while the top end was carrying goes WARM,
// and the layers of the stack come out different colours from each other.
// Colour is still the form's own data, never a gradient across the screen.
// SLATE / CORAL (Nima's pick out of ten). Slate keeps the cool end quiet so
// the warm strata sit forward; coral is the warmest reading that never turns
// red. The core is a hair off pure white, warm enough to belong to the coral.
const H2_COLD = [70, 99, 158];     // bass-heavy stamp — slate
const H2_CORE = [253, 250, 250];   // mid-spectrum stamp — the white plate
const H2_WARM = [255, 127, 107];   // treble-heavy stamp — coral
// [window lo, window hi, plateau]. The window is WHERE MUSIC ACTUALLY LIVES
// (Penrose V3's law: narrow the input, don't crank the weight — a wide window
// clamps every stamp to one end and the palette is lost, not louder). The
// plateau is how much of the ramp's middle is held at the core white, so the
// plate stays white and colour is reserved for a real spectral extreme.
const H2_RAMP = [0.34, 0.68, 0.30];
const H2_ORANGE = [255, 162, 74];  // LEFT hand's speed
const H2_VIOLET = [185, 140, 255]; // RIGHT hand's speed

// one stamp = the curve as RADII (fractions of min(w,h)), frozen forever.
// Rotation is baked in: a long exposure is fixed in world space.
function h2Stamp(P) {
  const s = P.state;
  s.head = (s.head + 1) % s.depth;
  if (s.n < s.depth) s.n++;
  const sl = s.sl[s.head];
  sl.tilt = s.tilt; sl.kick = s.kEnv;

  const rest = s.rest;
  const ab = 0.055 + 0.150 * s.bass + 0.075 * rest;    // orders 2, 3
  const am = 0.022 + 0.085 * s.mid + 0.030 * rest;     // orders 5, 7
  const at = 0.007 + 0.032 * s.treble + 0.012 * rest;  // orders 11, 17 (13 inside)
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
  // gradient is 1, so there is no visible crease where it takes over.
  const KNEE = 0.32, RMAX = 0.50, SPAN = RMAX - KNEE;
  const p = s.ph, rot = s.rot;

  for (let j = 0; j < H2_PTS; j++) {
    const a = j / H2_PTS * TAU + rot;
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
  id: 'SRC-49.2', family: 'SRC-49', ver: 2,
  title: 'Spectrum Halo V2', tech: 'POLAR CONTOUR / LONG EXPOSURE / AUDIO-DRAWN',
  audioIn: true,
  fx: { bloom: 0.35 },
  tags: ['AUDIO IN', 'CC1 = EXPOSURE', 'CC2 = SENSITIVITY CURVE', 'BAND = HARMONIC ORDER', 'LOUD IS BIG', 'SLATE + CORAL LAYERS'],
  desc: 'One closed curve around one centre, stamped into the frame thirty-two times a second and left there \u2014 so the picture is the last three seconds of the music standing still. LOUDNESS IS DIAMETER: the halo is a small quiet ring in an intro and swells to fill the frame on a drop, and because what you see is ninety-six stamps at once, that swell arrives as strata laid down over three seconds rather than a jumping outline. The spectrum owns the SHAPE by harmonic order: bass swings the two and three-lobed forms that throw the whole ring off-round, mid fills the five and seven-lobed body of the band, treble writes the fine scallop on the outer edge and the hole in the middle. Where the stamps agree they pile into a dense luminous band; where one wandered it leaves a soft translucent lobe hanging off the side, which is what a loud moment looks like a second after it happens. The plate is white at its core and DIVERGES at the ends: most stamps are born mid-spectrum and stay white, but one laid down while the bass was doing the work goes slate blue and one laid down while the top end was carrying goes coral, so the layers of the stack are different colours from each other and a section change is a band of colour growing through the exposure. Each slice wears the spectral balance it was born with \u2014 nothing is a gradient laid across the screen, and a quiet, even passage stays a plain white plate. The kick is the only fast thing here: it punches the newest ring outward and lights it, and then that ring simply ages backwards through the exposure. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music draws the curve; the hands decide how it is exposed and how hard it is listening. LEFT HAND / CC1 IS EXPOSURE: closed, you get a single crisp ring that moves like a live oscilloscope; opened, three full seconds of history smear out behind it into the layered plate. It answers the instant you move, with or without a signal. RIGHT HAND / CC2 IS SENSITIVITY, and in V2 it is a real one: it reshapes the whole response curve rather than just scaling it, so the entire throw does something on any material. Closed, only genuine peaks move the picture and a busy room stays a small still ring; open, quiet detail fills the frame and the room\'s own noise floor is enough to keep a plate breathing; the middle of the throw leaves the music exactly as the engine heard it. On typical material the two ends are about seven times apart, and it works with nothing connected too \u2014 it sizes the resting breath — a gain, never a value, so a hand the wall\'s ghost drift parked somewhere just leaves the scene near its base sensitivity instead of pretending the room is loud. The music colours the layers slate and coral; the hands own a colour of their own on top of that. Moving one FAST paints \u2014 fast being a real whip, since a deliberate sensitivity sweep is below the gate and paints nothing \u2014 the left breathing orange into the old end of the stack and the right violet into the live edge, both fading back over a couple of seconds and both capped so they tint the plate rather than replace it. In silence the ring keeps a slow breath so an unattended scene is still alive.',
  sound: 'Makes no sound of its own — an audio-in scene, same as Cell Front V4-V13 and Penrose Bloom. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants a full spectrum with a real kick, and it wants DYNAMICS above all \u2014 the diameter tracks loudness, so a track that never drops never shows the scene\'s range. The kick is the only unsmoothed move in the picture and it is read off the engine\'s time-domain detector, so four-on-the-floor draws one bright ring per beat marching backwards through the exposure. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const depth = as > 3.2 ? H2_SLICES : as > 1.7 ? 64 : 40;
    const sl = [];
    for (let i = 0; i < depth; i++) {
      sl.push({ out: new Float32Array(H2_PTS), inn: new Float32Array(H2_PTS), tilt: 0.5, kick: 0 });
    }
    P.state = {
      sl, depth, head: -1, n: 0, capT: 0, life: 0,
      pres: 0, rest: 1, expo: 0.78, sens: 1.0, velL: 0, velR: 0, pL: 0.5, pR: 0.5,
      level: 0, bass: 0, mid: 0, treble: 0, energy: 0, field: 0, tilt: 0.5,
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
    // controller value can fake it. Snap up, fade over ~2.4s. V2 GATES it at
    // 0.55 controller units/sec: setting sensitivity is a deliberate, slow
    // move and must paint nothing, or the paint is all you see and the hand
    // reads as a colour control instead of the control it is. A whip still
    // paints in full.
    const GATE = 0.55;
    const vL = clamp((Math.abs(cc1 - s.pL) / Math.max(dt, 1e-3) - GATE) * 1.1);
    const vR = clamp((Math.abs(cc2 - s.pR) / Math.max(dt, 1e-3) - GATE) * 1.1);
    s.pL = cc1; s.pR = cc2;
    s.velL -= s.velL * Math.min(1, dt * 0.42); if (vL > s.velL) s.velL = vL;
    s.velR -= s.velR * Math.min(1, dt * 0.42); if (vR > s.velR) s.velR = vR;

    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);
    // REST: nobody at the instrument AND nothing to listen to. The scene has
    // to be a PLATE at rest, not a wire ring — with no music moving the curve
    // the 96 stamps land almost on top of each other, so rest deliberately
    // opens the lobes and widens the breath until the strata separate again.
    s.rest += (((handLive || audioLive) ? 0 : 1) - s.rest) * Math.min(1, dt * 0.8);

    /* ---- THE BANDS (slow clock) — the shape of the curve ---------------- */
    // engine-smoothed already; eased again at ~1.8/s so a bassline note
    // moves the ring over a bar, never over a frame. Silence still breathes.
    const idle = (0.045 + 0.030 * Math.sin(s.life * 0.21)) * (1 - 0.72 * s.pres);
    // SENSITIVITY IS A CURVE. V1 multiplied then clamped, so the top of the
    // throw saturated on anything loud and the control had no range where it
    // mattered. A gamma reshapes the whole response instead and only reaches
    // 1 when the band itself does. Applied AFTER the idle floor, so the hand
    // still sizes the resting breath when nothing is connected.
    const gam = 1 / s.sens;
    const sens = (v) => Math.pow(clamp(v), gam);
    const rL = Math.max(idle, inp.audio.level);
    const rB = Math.max(idle, inp.audio.bass);
    const rM = Math.max(idle * 0.7, inp.audio.mid);
    const rT = Math.max(idle * 0.6, inp.audio.treble);
    const lT = sens(rL), bT = sens(rB), mT = sens(rM), tT = sens(rT);
    s.level += (lT - s.level) * Math.min(1, dt * (lT > s.level ? 2.2 : 1.4));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 2.2 : 1.4));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 2.2 : 1.4));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 2.2 : 1.4));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    // LOUDNESS IS DIAMETER. `level` carries most of it (it is the honest
    // broadband loudness), the bands only tilt it; the curve is near-linear
    // rather than compressed, and the whole thing eases at 2.2/s instead of
    // 1.3 — still smooth, because the picture is an integral of 96 stamps.
    const fieldT = Math.pow(clamp(0.36 * s.level + 0.28 * s.bass + 0.22 * s.mid + 0.16 * s.treble), 1.05);
    s.field += (fieldT - s.field) * Math.min(1, dt * 2.2);
    // spectral balance of THIS moment — stamped into every slice as its colour
    // TILT COMES OFF THE RAW BALANCE, not the sensitivity-shaped bands. A
    // gamma does not preserve ratios, so deriving colour from the shaped
    // values turned CC2 into a hue control — low sensitivity drove the plate
    // blue, high drove it white — and colour has to stay the music's own
    // spectral balance. Sensitivity changes how MUCH the picture responds,
    // never what colour it is.
    const tiltT = clamp((rT * 1.25 + rM * 0.45) / (rT * 1.25 + rM * 0.45 + rB + 0.02));
    // Eased at 2.0/s rather than 1.1: the tilt is what each stamp WEARS, so a
    // slower ease means a 3s exposure only ever holds ~3 distinct hues and the
    // stack looks monochrome. This tracks bar-to-bar spectral movement, so
    // neighbouring layers genuinely differ, without chasing single notes.
    s.tilt += (tiltT - s.tilt) * Math.min(1, dt * 2.0);

    /* ---- THE KICK (fast clock) — the only unsmoothed move --------------- */
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetEdge = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetEdge) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    if (edge && s._kGap > 0.09) {
      s._kGap = 0; s._kAge = age;
      // back-date along the envelope's own decay by the hit's true age plus
      // the display lead, so the ring is where it belongs for THIS vsync.
      s.kEnv = Math.max(s.kEnv, clamp(hit * Math.exp(-3.4 * (age + s.LEAD))));
    }
    s.kEnv -= s.kEnv * Math.min(1, dt * 3.0);

    /* ---- PHASES + the slow turn that makes the stack smear -------------- */
    const spd = 0.55 + 0.90 * s.energy + 0.85 * s.rest;
    const RATE = [0.55, -0.67, 0.62, -0.78, 0.86, -1.02, 0.44, -0.58, 0.79];
    for (let i = 0; i < 9; i++) {
      s.ph[i] += RATE[i] * spd * dt;
      if (s.ph[i] > 1e5 || s.ph[i] < -1e5) s.ph[i] = 0;
    }
    s.rot += (0.10 + 0.22 * s.energy) * dt;
    if (s.rot > TAU) s.rot -= TAU;

    /* ---- STAMP the curve into the ring buffer at a FIXED rate ----------- */
    s.capT += dt;
    let stamps = 0;
    while (s.capT >= H2_CAP && stamps < 2) { s.capT -= H2_CAP; stamps++; h2Stamp(P); }
    if (s.capT > H2_CAP * 4) s.capT = 0;   // never spiral after a hitch
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
      const u = clamp((sl.tilt - H2_RAMP[0]) / Math.max(1e-4, H2_RAMP[1] - H2_RAMP[0]));
      const d = (u - 0.5) * 2;
      const k = clamp((Math.abs(d) - H2_RAMP[2]) / Math.max(1e-4, 1 - H2_RAMP[2]));
      const tw = k * k * (3 - 2 * k);
      const end = d < 0 ? H2_COLD : H2_WARM;
      let cr = H2_CORE[0] + (end[0] - H2_CORE[0]) * tw;
      let cg = H2_CORE[1] + (end[1] - H2_CORE[1]) * tw;
      let cb = H2_CORE[2] + (end[2] - H2_CORE[2]) * tw;
      // an ACCENT, not a takeover: a fast hand can pull the colour ~60% of
      // the way to its own, never all of it, so the spectrum stays legible
      // underneath the paint (a full repaint is the same mistake as a
      // full-canvas tint).
      const mo = clamp(wOld * s.velL * 1.15) * 0.60, mv = clamp(wNew * s.velR * 1.15) * 0.60;
      cr += (H2_ORANGE[0] - cr) * mo; cg += (H2_ORANGE[1] - cg) * mo; cb += (H2_ORANGE[2] - cb) * mo;
      cr += (H2_VIOLET[0] - cr) * mv; cg += (H2_VIOLET[1] - cg) * mv; cb += (H2_VIOLET[2] - cb) * mv;
      const col = (al) => `rgba(${cr | 0},${cg | 0},${cb | 0},${al})`;

      // every sixth stamp also lays the BAND down as one translucent fill —
      // one continuous shape, never a fan of strokes. That is where the big
      // soft lobes of the plate come from.
      if (i % 12 === 0 && i > 3) {
        g.beginPath();
        for (let j = 0; j < H2_PTS; j++) {
          const r = sl.out[j] * S;
          const x = cx + r * H2_COS[j], y = cy + r * H2_SIN[j];
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        for (let j = 0; j < H2_PTS; j++) {
          const r = sl.inn[j] * S;
          const x = cx + r * H2_COS[j], y = cy + r * H2_SIN[j];
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
      for (let j = 0; j < H2_PTS; j++) {
        const r = sl.out[j] * S;
        const x = cx + r * H2_COS[j], y = cy + r * H2_SIN[j];
        j ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
      g.stroke();

      if (live || i % 3 === 0) {
        g.lineWidth = live ? lwLive * 0.8 : lwHist * 0.8;
        g.strokeStyle = col(live ? (liveA * 0.78 + 0.22 * s.kEnv) * bright
                                 : (0.062 + 0.048 * sl.kick) * fade * bright * dens);
        g.beginPath();
        for (let j = 0; j < H2_PTS; j++) {
          const r = sl.inn[j] * S;
          const x = cx + r * H2_COS[j], y = cy + r * H2_SIN[j];
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        g.stroke();
      }
    }

    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(220,226,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '  MID ' + Math.round(s.mid * 100) +
      '  TREBLE ' + Math.round(s.treble * 100) + '  FIELD ' + Math.round(s.field * 100) +
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
