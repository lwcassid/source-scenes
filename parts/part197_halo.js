/* ---------- SRC-49 · SPECTRUM HALO (a long exposure of the spectrum) ----------
   Nima's reference plate: a ring built out of dozens of translucent
   contours laid over each other — a dense dark band where they agree, big
   soft lobes where one of them wandered, a scalloped hole in the middle.
   That is a LONG EXPOSURE of one breathing closed curve, so that is what
   this scene is.

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

const HL_SLICES = 96;          // ring buffer depth — 3.0s at 32 stamps/sec
const HL_PTS = 112;            // samples around the curve (order 17 needs ~68)
const HL_CAP = 1 / 32;         // seconds between stamps — fixed, not per-frame

// fixed sample angles: the cos/sin table is built once and never changes,
// so a whole frame of 96 contours costs multiplies, not 27k trig calls.
const HL_COS = new Float32Array(HL_PTS), HL_SIN = new Float32Array(HL_PTS);
for (let j = 0; j < HL_PTS; j++) {
  const a = j / HL_PTS * TAU;
  HL_COS[j] = Math.cos(a); HL_SIN[j] = Math.sin(a);
}

const HL_COLD = [64, 118, 255];    // bass-heavy moment
const HL_WARM = [255, 238, 202];   // treble-heavy moment
const HL_ORANGE = [247, 140, 58];  // LEFT hand's speed
const HL_VIOLET = [162, 82, 255];  // RIGHT hand's speed

// one stamp = the curve as RADII (fractions of min(w,h)), frozen forever.
// Rotation is baked in: a long exposure is fixed in world space.
function hlStamp(P) {
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
  const base = (0.230 + 0.130 * s.field + 0.020 * rest) * breath * (1 + 0.085 * s.kEnv);
  const hole = 0.44 - 0.12 * s.field;
  const RMAX = 0.480;
  const p = s.ph, rot = s.rot;

  for (let j = 0; j < HL_PTS; j++) {
    const a = j / HL_PTS * TAU + rot;
    const m = ab * Math.sin(2 * a + p[0]) + 0.62 * ab * Math.sin(3 * a + p[1])
            + am * Math.sin(5 * a + p[2]) + 0.75 * am * Math.sin(7 * a + p[3])
            + at * Math.sin(11 * a + p[4]) + 0.60 * at * Math.sin(17 * a + p[5]);
    const r = base * (1 + m);
    // soft compression instead of a clamp — excursions stay in the frame
    // without ever flattening into a straight edge.
    const ro = RMAX * Math.tanh(r / RMAX);
    sl.out[j] = ro;
    const mi = 0.40 * m + 0.70 * am * Math.sin(8 * a + p[7]) + 2.40 * at * Math.sin(13 * a + p[8])
             + 0.40 * ab * Math.sin(3 * a + p[6]);
    sl.inn[j] = Math.max(0.02, Math.min(ro * 0.85, base * hole * (1 + mi)));
  }
}

reg({
  id: 'SRC-49', family: 'SRC-49', ver: 1,
  title: 'Spectrum Halo', tech: 'POLAR CONTOUR / LONG EXPOSURE / AUDIO-DRAWN',
  audioIn: true,
  fx: { bloom: 0.35 },
  tags: ['AUDIO IN', 'CC1 = EXPOSURE', 'CC2 = SENSITIVITY', 'BAND = HARMONIC ORDER', 'THE KICK IS A RING'],
  desc: 'One closed curve around one centre, stamped into the frame thirty-two times a second and left there — so the picture is the last three seconds of the music standing still. The spectrum owns the curve by HARMONIC ORDER: bass swings the two and three-lobed shapes that throw the whole ring off-round, mid fills the five and seven-lobed body of the band, treble writes the fine scallop on the outer edge and the hole in the middle. Where the stamps agree they pile into a dense luminous band; where one wandered it leaves a soft translucent lobe hanging off the side, which is what the loud moments look like a second after they happen. Each stamp keeps the spectral balance it was born with, so it is coloured by its own moment — blue where the bass was carrying, cream where the top end was — and a section change reads as a coloured band growing through the stack. The kick is the only fast thing in the frame: it punches the newest ring outward and lights it, and then that ring simply ages backwards through the exposure. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music draws the curve; the hands decide how it is exposed and how hard it is listening. LEFT HAND / CC1 IS EXPOSURE: closed, you get a single crisp ring that moves like a live oscilloscope; opened, three full seconds of history smear out behind it into the layered plate. It answers the instant you move, with or without a signal. RIGHT HAND / CC2 IS SENSITIVITY: a gain on what the mic hears, from a placid almost-circle to a ring thrashing on every bar — a gain, never a value, so a hand the wall\'s ghost drift parked somewhere just leaves the scene near its base sensitivity instead of pretending the room is loud. Moving a hand FAST paints: the left hand breathes orange into the old end of the stack, the right hand violet into the live edge, and both fade back over a couple of seconds. In silence the ring keeps a slow breath so an unattended scene is still alive.',
  sound: 'Makes no sound of its own — an audio-in scene, same as Cell Front V4-V13 and Penrose Bloom. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants a full spectrum with a real kick: the kick is the only unsmoothed move in the picture and it is read off the engine\'s time-domain detector, so four-on-the-floor draws one bright ring per beat marching backwards through the exposure. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const depth = as > 3.2 ? HL_SLICES : as > 1.7 ? 64 : 40;
    const sl = [];
    for (let i = 0; i < depth; i++) {
      sl.push({ out: new Float32Array(HL_PTS), inn: new Float32Array(HL_PTS), tilt: 0.5, kick: 0 });
    }
    P.state = {
      sl, depth, head: -1, n: 0, capT: 0, life: 0,
      pres: 0, rest: 1, expo: 0.78, sens: 1.0, velL: 0, velR: 0, pL: 0.5, pR: 0.5,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0, tilt: 0.5,
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
    const sensT = handLive ? 0.55 + cc2 * 1.15 : 1.0;
    s.expo += (expoT - s.expo) * Math.min(1, dt * 5);
    s.sens += (sensT - s.sens) * Math.min(1, dt * 4);

    // SPEED is its own input: a held hand has zero velocity, so no stale
    // controller value can fake it. Snap up, fade over ~2.4s.
    const vL = clamp(Math.abs(cc1 - s.pL) / Math.max(dt, 1e-3) * 0.85);
    const vR = clamp(Math.abs(cc2 - s.pR) / Math.max(dt, 1e-3) * 0.85);
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
    const bT = Math.max(idle, clamp(inp.audio.bass * s.sens));
    const mT = Math.max(idle * 0.7, clamp(inp.audio.mid * s.sens));
    const tT = Math.max(idle * 0.6, clamp(inp.audio.treble * s.sens));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 1.8 : 1.1));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 1.8 : 1.1));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 1.8 : 1.1));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    const fieldT = Math.pow(clamp(0.44 * s.bass + 0.34 * s.mid + 0.26 * s.treble), 1.25);
    s.field += (fieldT - s.field) * Math.min(1, dt * 1.3);
    // spectral balance of THIS moment — stamped into every slice as its colour
    const tiltT = clamp((s.treble * 1.25 + s.mid * 0.45) / (s.treble * 1.25 + s.mid * 0.45 + s.bass + 0.02));
    s.tilt += (tiltT - s.tilt) * Math.min(1, dt * 1.1);

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
    while (s.capT >= HL_CAP && stamps < 2) { s.capT -= HL_CAP; stamps++; hlStamp(P); }
    if (s.capT > HL_CAP * 4) s.capT = 0;   // never spiral after a hitch
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
      let cr = HL_COLD[0] + (HL_WARM[0] - HL_COLD[0]) * sl.tilt;
      let cg = HL_COLD[1] + (HL_WARM[1] - HL_COLD[1]) * sl.tilt;
      let cb = HL_COLD[2] + (HL_WARM[2] - HL_COLD[2]) * sl.tilt;
      // an ACCENT, not a takeover: a fast hand can pull the colour ~60% of
      // the way to its own, never all of it, so the spectrum stays legible
      // underneath the paint (a full repaint is the same mistake as a
      // full-canvas tint).
      const mo = clamp(wOld * s.velL * 1.15) * 0.60, mv = clamp(wNew * s.velR * 1.15) * 0.60;
      cr += (HL_ORANGE[0] - cr) * mo; cg += (HL_ORANGE[1] - cg) * mo; cb += (HL_ORANGE[2] - cb) * mo;
      cr += (HL_VIOLET[0] - cr) * mv; cg += (HL_VIOLET[1] - cg) * mv; cb += (HL_VIOLET[2] - cb) * mv;
      const col = (al) => `rgba(${cr | 0},${cg | 0},${cb | 0},${al})`;

      // every sixth stamp also lays the BAND down as one translucent fill —
      // one continuous shape, never a fan of strokes. That is where the big
      // soft lobes of the plate come from.
      if (i % 12 === 0 && i > 3) {
        g.beginPath();
        for (let j = 0; j < HL_PTS; j++) {
          const r = sl.out[j] * S;
          const x = cx + r * HL_COS[j], y = cy + r * HL_SIN[j];
          j ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.closePath();
        for (let j = 0; j < HL_PTS; j++) {
          const r = sl.inn[j] * S;
          const x = cx + r * HL_COS[j], y = cy + r * HL_SIN[j];
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
      for (let j = 0; j < HL_PTS; j++) {
        const r = sl.out[j] * S;
        const x = cx + r * HL_COS[j], y = cy + r * HL_SIN[j];
        j ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath();
      g.stroke();

      if (live || i % 3 === 0) {
        g.lineWidth = live ? lwLive * 0.8 : lwHist * 0.8;
        g.strokeStyle = col(live ? (liveA * 0.78 + 0.22 * s.kEnv) * bright
                                 : (0.062 + 0.048 * sl.kick) * fade * bright * dens);
        g.beginPath();
        for (let j = 0; j < HL_PTS; j++) {
          const r = sl.inn[j] * S;
          const x = cx + r * HL_COS[j], y = cy + r * HL_SIN[j];
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
      '  KICK ' + Math.round(s.kEnv * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') +
      ' age ' + Math.round(s._kAge * 1000) + 'ms' +
      (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ')' +
      '  EXPO ' + vis + '/' + s.depth + ' (' + (vis / 32).toFixed(2) + 's)' +
      '  SENS ' + s.sens.toFixed(2) +
      '  PAINT ' + Math.round(s.velL * 100) + '/' + Math.round(s.velR * 100) +
      '  REST ' + Math.round(s.rest * 100) +
      (s.pres < 0.3 ? '   · HALO BREATHING' : ''), 10, h - 10);
  }
});
