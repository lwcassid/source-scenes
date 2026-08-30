/* ---------- SRC-46.7 · PENROSE BLOOM V7 (it moves with the music) ----------
   Nima: the picture barely moves with the track. V6's HUD is the confession —
   BASS 100  MID 100  TREBLE 100  FIELD 100, all night, on every kind of
   music. Half of that was the engine (part2e_audioin.js read bands off a
   BYTE FFT against Chrome's unset -100..-30 dBFS window, so a mastered track
   at -11 dBFS RMS returned a literal 255 in every bin — the bands were
   CLIPPED, not smooth). That is fixed underneath this version: float FFT,
   per-band pink tilt, a rolling-percentile AGC. Measured on Leila.mp3 the
   three bands now run p5 0.10 -> p95 0.89 with a cross-staging drift of
   0.01-0.03 (tools/bandtest.mjs).

   The other half is this scene, and it is the more interesting half. Even
   with honest bands, TECHNO IS LOUD ALL THE TIME — that is what mastering
   is for. A picture wired to absolute level sits at its own average and
   breathes about as much as the master bus does, which is to say not at
   all. What actually MOVES in this music is each band's departure from its
   own recent self: the drop out of a breakdown, the hats arriving, the bass
   dropping away for two bars. The engine now hands that over directly —
   `inp.audio.dev` (each band against its own ~1.5s mean, 0.5 = doing what it
   has been doing) and `inp.audio.flux` (positive rise only; a sustained loud
   band reads ZERO, only a fresh transient spikes). V7 is V6 re-driven off
   those, plus the two new bands the recut gave us.

   FOUR RE-WIRINGS, no new controls — the hands are V6's exactly:

   1. SIZE IS DEVIATION. The front's base was 0.13 + 0.38·field, and on a
      mastered track field barely leaves 0.7, so the boundary sat at 0.40 all
      night. Now it is 0.13 + 0.28·field + 0.22·swell, where swell is the
      band-weighted deviation (bass 0.45 / mid 0.32 / treble 0.23), doubled
      (×2.2) and clamped — signed, so a breakdown PULLS THE CRYSTAL IN, which
      is the half of the dynamic V6 never had. Measured through the real
      engine on 45s of Leila.mp3: swell p5 -0.19 / p95 +0.29 (min -0.42, max
      +0.42), front p5 0.18 / p95 0.36, min 0.10 max 0.40, tiles 60 -> 390.
      The boundary travels a factor of TWO over a couple of phrases where V6
      held one radius. Field keeps enough authority (0.28) that a genuinely
      quiet section is still a smaller crystal; it is no longer the whole
      story. The high-water melt goes 1.1 -> 1.5/s so a retreat can be seen
      inside its own bars instead of being smoothed away.

   2. THE BEAT IS A RING OF LIGHT THAT TRAVELS. V6 gave the kick a 0.16
      nudge on the front and brightened a fixed gradient at the boundary —
      on a plate this dense that is a glow, not an event. Now every kick
      launches a pulse that runs OUTWARD through the tiles: a 0.045-wide
      band in front units, sped so it always crosses the crystal in ~0.34s
      whatever size the crystal currently is (speed = hwm/0.34), i.e. about
      one beat at 128 BPM. It lights tiles through V6's own crystallisation
      flash channel — the same white-hot edge a tile gets when it is born —
      so nothing new is drawn, an existing mark just gets a second reason to
      fire. Radial, fat, one at a time: exactly what mesh survives.

   3. THE COLOUR LISTENS TO WHO IS WINNING. The centroid keeps 58% of the
      tilt (window 0.36..0.66, V3's), and 42% now comes from
      dev.treble - dev.bass — "which end is above its own recent self". With
      the AGC holding all three bands near their own mid, the raw centroid
      is a much lazier signal than it was when the bands were clipped; the
      deviation difference swings the full ramp on a hat section or a bass
      drop and returns to centre when the mix settles. Same for THE DEAL,
      the five-way re-paint: 55% harmonic balance, 45% dev.treble - dev.mid,
      still held 0.18s so it steps rather than shimmers.

   4. THE TWO NEW BANDS TAKE THE TWO SURFACES. The recut split 20-250Hz
      (which merged the kick with the whole bassline) into sub 28-110 and
      bass 35-160, and gave lowmid 180-400 to the bass NOTES. So: LOWMID is
      the plate's MASS — it fills the diamonds in (fill alpha 0.10 + 0.20·
      body). TREBLE is the plate's EDGE — hats sharpen the lattice's lines
      (edge alpha 0.40 + 0.28·air). SUB is the seed, breathing under
      everything. And flux (0.5·bass + 0.8·mid + 0.6·treble, snap up, 2.6/s
      down) rides the rosette contrast, so a stab resolves the figure out of
      the paper for a moment and lets it settle back — V4's "excitement
      resolves the plate", now driven by transients instead of by a number
      that never changed.

   The elastic wave is still the RIGHT HAND'S. Light ripples on the beat
   whatever the hands do; the lattice only GIVES if someone opens CC2. Two
   ripples, two owners, and they read as different things — one is
   brightness travelling, one is geometry stretching. The kick still deepens
   the wave, and flux.bass now adds a little amplitude too (capped at
   amp·22 < 1, so shells squash and never cross).

   Everything else is V6: geometry, rosette classification, palette, the
   kick detector, CC1 SPIN and CC2 ELASTICITY, no sound of its own.
   (V6 notes below.) ---------------------------------------------------- */
/* ---------- SRC-46.6 · PENROSE BLOOM V6 (it turns, and it gives) ------------
   CC1 · SPIN, the whole plate turning about the seed (0.55 rad/s at the top,
   curved ^1.6 so the bottom of the throw is fine control). CC2 · ELASTICITY,
   a radial standing wave travelling outward through the lattice, displacing
   every vertex by a pure function of WHERE IT IS so the tiling stretches
   without ever tearing, amplitude capped so shells can squash but never
   cross. The kick excites it. With no hands live the crystal settles.
   (Earlier versions' notes live in part181_penrose6.js.) --------------- */

reg({
  id: 'SRC-46.7', family: 'SRC-46', ver: 7,
  title: 'Penrose Bloom V7', tech: 'PENROSE DEFLATION / DEVIATION-DRIVEN / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.4 },
  tags: ['AUDIO IN', 'CC1 = SPIN', 'CC2 = ELASTICITY', 'THE BEAT RUNS OUT AS LIGHT', 'SIZE IS DEPARTURE, NOT LOUDNESS'],
  desc: 'V6\'s spun, elastic plate, re-wired onto the part of the music that actually moves. A mastered track is loud all the time, so a crystal sized by loudness sits at its own average and barely breathes; this one is sized by DEPARTURE — how far each band is from its own last bar and a half — so a breakdown visibly pulls the shells back in, a drop throws them to the corners, and the plate keeps working the whole way through a flat, hot mix. The beat is no longer a glow at the boundary: every kick launches a ring of light that runs outward through the tiles and crosses the crystal in about a beat, lighting each diamond with the same white-hot edge it got when it was born. The bass NOTES fill the plates in and the hats sharpen their edges, so the surface itself changes texture with the arrangement, and a stab resolves the rosettes out of the bare paper for a moment before they settle back. Colour listens for which end of the spectrum is above its own recent self, so a hat section and a bass drop sit at opposite ends of the ramp. The hands are unchanged: CC1 spins the plate, CC2 takes the rigidity out of it. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music grows the crystal, paints it and beats through it; the hands play the GEOMETRY. LEFT HAND / CC1 IS SPIN: the whole plate turns about its seed, from still to a revolution every eleven seconds, fine control at the bottom of the throw. RIGHT HAND / CC2 IS ELASTICITY: at zero the lattice is a rigid crystal, and as it opens a wave runs outward through the structure and the diamonds squash and stretch as it passes. Two ripples travel here and they belong to different owners — LIGHT ripples on every kick whether or not anyone is playing, GEOMETRY only gives if a hand opens it. Both hands settle when nobody is playing, so an abandoned scene turns slowly and breathes rather than sitting wherever the wall\'s ghost drift left the controller.',
  sound: 'Makes no sound of its own — an audio-in scene, the same as Cell Front V4-V11. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants a full-spectrum mix with a kick: the sub and the bass notes carry the plate\'s mass, the hats carry its edges, and the size is driven by CHANGE, so it rewards arrangement — breakdowns and drops are the gesture it is listening for. No MIDI out either; there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const levels = as > 3.2 ? 6 : as > 1.7 ? 5 : 4;
    const tiles = pbTiles(levels);
    P.state = {
      tiles, rose: pb4Rose(tiles, levels), n: 0, levels, life: 0,
      pres: 0, drive: 1.15,
      spin: 0, rot: 0, elas: 0.10, wave: 0,
      bass: 0, mid: 0, treble: 0, sub: 0, lowmid: 0, energy: 0, field: 0,
      swell: 0, spark: 0, exc: 0,
      tilt: 0.5, chord: 0, qNow: 0, qWant: -1, qHold: 0, dealPulse: 0,
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      pulse: [],
      fbase: 0.15, front: 0.15, hwm: 0.15, vel: 0,
      lit: new Float32Array(tiles.length),
      fl: new Float32Array(tiles.length),
      twk: 1.8
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, N = s.tiles.length;
    s.life += dt;

    // the new engine fields, with fallbacks — a scene should never explode
    // because it is looking at an input the build in front of it lacks.
    const A = inp.audio;
    const D = A.dev || { bass: 0.5, mid: 0.5, treble: 0.5 };
    const F = A.flux || { bass: 0, mid: 0, treble: 0 };
    const subIn = A.sub === undefined ? A.bass : A.sub;
    const lowIn = A.lowmid === undefined ? (A.bass + A.mid) * 0.5 : A.lowmid;

    /* ---- HANDS: CC1 spins the plate, CC2 stretches it (V6, unchanged) --- */
    const cc1 = clamp(inp.L), cc2 = clamp(inp.R);
    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const spinT = handLive ? Math.pow(cc1, 1.6) * 0.55 : 0.05;
    const elasT = handLive ? cc2 : 0.10;
    s.spin += (spinT - s.spin) * Math.min(1, dt * 4);
    s.elas += (elasT - s.elas) * Math.min(1, dt * 4);
    s.rot += s.spin * dt;
    if (s.rot > TAU) s.rot -= TAU;
    // the elastic wave travels outward; a kick makes it run, and a fresh
    // rise in the low end gives it a little more to give
    s.wave += dt * (1.5 + 5.0 * s.kEnv + 1.8 * F.bass);
    if (s.wave > 1e6) s.wave -= 1e6;
    const audioLive = A.level > 0.05 || A.onset > 0.3;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    /* ---- SLOW BANDS → THE FIELD (clock one) ---------------------------- */
    // still here, still eased at ~1.2/s, but with a THIRD of the authority
    // it had in V6: it says how loud this section is, not how the picture
    // moves. Silence still breathes.
    const idle = (0.030 + 0.016 * Math.sin(s.life * 0.19)) * (1 - 0.7 * s.pres) * s.drive;
    const bT = Math.max(idle, clamp(A.bass * s.drive));
    const mT = Math.max(idle * 0.7, clamp(A.mid * s.drive));
    const tT = Math.max(idle, clamp(A.treble * s.drive));
    const sT = Math.max(idle, clamp(subIn * s.drive));
    const lT = Math.max(idle * 0.85, clamp(lowIn * s.drive));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 1.2 : 0.8));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 1.2 : 0.8));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 1.2 : 0.8));
    s.sub += (sT - s.sub) * Math.min(1, dt * (sT > s.sub ? 2.0 : 1.2));
    s.lowmid += (lT - s.lowmid) * Math.min(1, dt * (lT > s.lowmid ? 1.4 : 0.9));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    const fieldMix = clamp(0.42 * s.bass + 0.34 * s.mid + 0.30 * s.treble);
    s.field += (Math.pow(fieldMix, 1.35) - s.field) * Math.min(1, dt * 1.4);

    /* ---- DEVIATION → THE SWELL (what techno actually does) -------------- */
    // dev is 0.5-centred: 0.5 = "doing what it has been doing". A normal bar
    // sits ±0.2 off that, so ×2.2 gives a ±0.44 swell for ordinary music and
    // saturates only on a real arrangement change. Signed, so a breakdown
    // PULLS THE CRYSTAL IN — the picture can go down, which is the half of
    // the dynamic V6 never had.
    const devE = 0.45 * (D.bass - 0.5) + 0.32 * (D.mid - 0.5) + 0.23 * (D.treble - 0.5);
    const swellT = clamp(devE * 2.2, -1, 1);
    s.swell += (swellT - s.swell) * Math.min(1, dt * (swellT > s.swell ? 3.0 : 2.0));

    /* ---- FLUX → THE SPARK (a rise, not a level) ------------------------- */
    // positive rise only, so a sustained loud band contributes NOTHING and
    // only a fresh transient lights it. Snap up, 2.6/s down — long enough to
    // read on one vsync, short enough that 16ths don't smear into a level.
    const fluxE = clamp(0.5 * F.bass + 0.8 * F.mid + 0.6 * F.treble);
    s.spark = Math.max(fluxE, s.spark - dt * 2.6);

    /* ---- THE KICK (clock two) — sample-accurate, unfiltered ------------- */
    const k = A.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetRaw = A.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = A.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(A.now - k.t, 0, 0.2);
      }
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + A.level * 0.4); }
    if (edge && s._kGap > 0.09) {
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      s.kEnv = Math.max(s.kEnv, clamp(hit * Math.exp(-3.4 * (age + s.LEAD)) * clamp(s.drive * 0.6, 0.3, 1)));
      // AND THE RING OF LIGHT LEAVES THE SEED. Amplitude takes flux.bass as
      // a bonus, so a kick landing on a fresh bass rise is a brighter ring
      // than one landing under a sustained note.
      if (s.pulse.length > 3) s.pulse.shift();
      s.pulse.push({ p: 0.02, a: clamp((0.55 + 0.45 * hit) * (0.78 + 0.40 * F.bass)) });
    }
    s.kEnv -= s.kEnv * Math.min(1, dt * 2.8);

    /* ---- THE FRONT ----------------------------------------------------- */
    // 0.13 + 0.28·field + 0.22·swell. Field is the section, swell is the bar.
    // Measured on Leila through the real engine: front p5 0.18 -> p95 0.36,
    // min 0.10 max 0.40 — the boundary travels a factor of two over a couple
    // of phrases where V6 sat at a near-constant 0.40.
    // The kick keeps its small 0.16 push on the boundary; the beat is carried
    // by the travelling ring now, not by the edge moving.
    const baseTarget = Math.max(0.07, 0.13 + 0.28 * s.field + 0.22 * s.swell);
    s.fbase += (baseTarget - s.fbase) * Math.min(1, dt * (baseTarget > s.fbase ? 1.8 : 1.2));
    const prev = s.front;
    s.front = s.fbase * (1 + 0.16 * s.kEnv);
    s.vel = dt > 0 ? (s.front - prev) / dt : 0;
    // the high-water mark still owns which tiles exist — growth instant,
    // retreat a melt — but at 1.5/s instead of V6's 1.1 so a breakdown is
    // visible as a retreat inside its own bars.
    s.hwm = s.front > s.hwm ? s.front : s.hwm + (s.front - s.hwm) * Math.min(1, dt * 1.5);

    // THE RING TRAVELS. Speed is proportional to the crystal's own size, so
    // it always crosses in ~0.34s — one beat at 128 BPM — whether the plate
    // is a rosette or fills the frame.
    if (s.pulse.length) {
      const spd = Math.max(0.22, s.hwm) / 0.34;
      for (let i = s.pulse.length - 1; i >= 0; i--) {
        const pu = s.pulse[i];
        pu.p += dt * spd;
        pu.a -= pu.a * Math.min(1, dt * 2.0);
        if (pu.a < 0.03 || pu.p > s.hwm + 0.10) s.pulse.splice(i, 1);
      }
    }

    /* ---- THE SPECTRUM PAINTS ------------------------------------------- */
    // TILT: 58% the centroid through V3's window, 42% "which end is above its
    // own recent self". With the AGC holding every band near its own middle,
    // the centroid alone is a lazy signal; the deviation difference is what
    // swings the ramp when the hats arrive or the bass drops out.
    const tot = s.bass + s.mid + s.treble + 1e-4;
    const centroid = (s.mid * 0.5 + s.treble) / tot;
    const cN = clamp((centroid - 0.36) / 0.30);
    const dTilt = clamp(0.5 + (D.treble - D.bass) * 1.15);
    s.tilt += (clamp(0.58 * cN + 0.42 * dTilt) - s.tilt) * Math.min(1, dt * 3.4);
    // THE DEAL: quantised to five, held 0.18s so it steps on a section change
    // instead of shimmering — same 55/45 split between the standing balance
    // and which of the two is currently rising.
    const harm = clamp((s.treble * 1.6 - s.mid * 0.35) / (s.mid + s.treble + 0.05));
    const mixQ = clamp(0.55 * harm + 0.45 * (0.5 + (D.treble - D.mid) * 1.2));
    const q = Math.min(4, Math.floor(mixQ * 5));
    if (q !== s.qWant) { s.qWant = q; s.qHold = 0; } else s.qHold += dt;
    if (s.qHold > 0.18 && q !== s.qNow) { s.qNow = q; s.dealPulse = 1; }
    s.chord += (s.qNow / 5 - s.chord) * Math.min(1, dt * 3.0);
    s.dealPulse -= s.dealPulse * Math.min(1, dt * 2.0);

    // EXCITEMENT resolves the rosettes out of the bare paper. Section loudness
    // sets where it sits; the transient is what makes it FLARE, so the figure
    // answers a stab and settles back rather than sitting at one contrast.
    // WEIGHTS MEASURED, not guessed: the first cut (1.15·field + 0.45·spark)
    // put exc at p50 0.95 / p95 0.99 on the real track — i.e. pinned, which
    // is the exact disease this version exists to cure, just relocated. At
    // 0.60/0.38 it runs p50 ~0.66 and only peaks touch 1, so quiet really is
    // one lattice and a drop really does resolve the plate.
    const excT = clamp(0.60 * s.field + 0.38 * s.spark + 0.45 * (D.mid - 0.5) + 0.30 * (D.treble - 0.5));
    s.exc += (excT - s.exc) * Math.min(1, dt * (excT > s.exc ? 6 : 3));

    /* ---- CRYSTALLISE ---------------------------------------------------- */
    while (s.n < N && s.tiles[s.n].r <= s.hwm) { s.fl[s.n] = 1; s.n++; }
    while (s.n > 0 && s.tiles[s.n - 1].r > s.hwm) s.n--;
    const up = Math.min(1, dt * 7), dn = Math.min(1, dt * 2.4), fd = Math.min(1, dt * 3.2);
    for (let i = 0; i < N; i++) {
      const tgt = i < s.n ? 1 : 0;
      s.lit[i] += (tgt - s.lit[i]) * (tgt ? up : dn);
      if (s.fl[i] > 0.001) s.fl[i] -= s.fl[i] * fd;
    }

    // the sleeping crystal winks — the tease, silent
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
    const R = Math.min(w, h) * 0.92;           // short side (V5's fix)
    const bright = 0.45 + s.pres * 0.55;

    g.globalCompositeOperation = 'lighter';
    const wg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    wg.addColorStop(0, `rgba(18,30,92,${0.34 * bright})`);
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = wg;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';

    // THE TWO SURFACES. The bass NOTES (lowmid, 180-400Hz — where a bassline
    // actually lives now that it is not merged with the kick) fill the plates
    // in; the hats sharpen the lines. So the plate's texture changes with the
    // arrangement even when its size is holding.
    const loud = clamp(s.energy * 1.6);
    const body = clamp(0.55 * s.lowmid + 0.45 * s.bass);
    const air = clamp(s.treble);
    const lw = Math.max(2.6, 2.6 * ms);
    const fillA = 0.10 + 0.20 * body + s.kEnv * 0.05 + s.dealPulse * 0.07;
    const edgeA = 0.40 + 0.28 * air + 0.10 * loud + s.dealPulse * 0.10;

    // THE PLATE TURNS, AND IT GIVES (V6). Radial displacement is a function
    // of the POINT, so shared vertices move identically and the tiling
    // stretches without tearing; amp·WK stays under 1 so shells never cross.
    const ca = Math.cos(s.rot), sa = Math.sin(s.rot);
    const amp = s.elas * (0.016 + 0.012 * s.kEnv + 0.008 * s.spark), WK = 22;
    let PX = 0, PY = 0;
    const px = (x, y) => {
      const rr = Math.hypot(x, y);
      if (rr > 1e-4 && amp > 1e-5) {
        const f = (rr + amp * Math.sin(rr * WK - s.wave) * Math.min(1, rr / 0.10)) / rr;
        x *= f; y *= f;
      }
      PX = cx + (x * ca - y * sa) * R;
      PY = cy + (x * sa + y * ca) * R;
    };

    const tiltT = (s.tilt - 0.5) * 0.58 + 0.42;
    const exc = s.exc;
    const CREAM = [247, 230, 204];              // Ferro Bloom's own cream
    // the travelling rings, read per tile against the tile's own radius
    const PU = s.pulse, np = PU.length, PW = 0.045;
    g.lineJoin = 'round';
    for (let i = 0; i < N; i++) {
      const l = s.lit[i];
      if (l < 0.02) continue;
      const tl = s.tiles[i];
      const a = l * bright;
      const shim = 0.72 + 0.28 * Math.sin(tl.r * 17 - s.life * 0.75 + tl.dir * 0.63);
      const dealt = (tl.cls + s.chord) % 1;
      const fam = s.rose[i];
      let c, fa, ea;
      if (fam) {
        const off = fam === 1 ? -0.12 : 0.30;
        c = pbCol(tiltT + off + tl.r * 0.16 + (dealt - 0.5) * 0.26);
        fa = fillA * (1 + 0.55 * exc);
        ea = edgeA * (1 + 0.30 * exc);
      } else {
        c = CREAM;
        fa = fillA * (0.20 - 0.13 * exc);
        ea = edgeA * (0.42 - 0.22 * exc);
      }
      // THE BEAT, ARRIVING HERE. A pulse lights this tile through the SAME
      // channel its birth flash uses — no new sprite, no second mark
      // language, just a second reason for an edge to go white-hot.
      let pw = 0;
      for (let j = 0; j < np; j++) {
        const pu = PU[j], d = tl.r - pu.p;
        const ad = d < 0 ? -d : d;
        if (ad < PW) { const v = pu.a * (1 - ad / PW); if (v > pw) pw = v; }
      }
      const f = Math.max(s.fl[i], pw * 0.88);
      g.beginPath();
      px(tl.x[0], tl.y[0]); g.moveTo(PX, PY);
      px(tl.x[1], tl.y[1]); g.lineTo(PX, PY);
      px(tl.x[2], tl.y[2]); g.lineTo(PX, PY);
      g.closePath();
      const r0 = c[0] | 0, g0 = c[1] | 0, b0 = c[2] | 0;
      g.fillStyle = `rgba(${r0},${g0},${b0},${fa * shim * a})`;
      g.fill();
      if (f > 0.02) {
        const wf = f * 0.8;   // hot, but never bleached to paper white
        g.lineWidth = lw * (1 + f * 0.9);
        g.strokeStyle = `rgba(${(r0 + (255 - r0) * wf) | 0},${(g0 + (246 - g0) * wf) | 0},${(b0 + (218 - b0) * wf) | 0},${a * (ea + 0.46 * f)})`;
      } else {
        g.lineWidth = lw;
        g.strokeStyle = `rgba(${r0},${g0},${b0},${a * ea})`;
      }
      g.stroke();
    }

    g.globalCompositeOperation = 'lighter';
    // the boundary keeps a soft glow on the kick envelope (V3's rule: the
    // beat is light, not motion) — but it is no longer the only thing the
    // beat does, so it sits back a little to leave room for the ring.
    const fr = (s.tiles.rMin + clamp(s.front, 0, 1.06) * s.tiles.rSpan) * R;
    if (fr > R * 0.03) {
      const rg = g.createRadialGradient(cx, cy, Math.max(0, fr - R * 0.13), cx, cy, fr + R * 0.08);
      rg.addColorStop(0, 'rgba(255,214,168,0)');
      rg.addColorStop(0.7, `rgba(255,206,150,${(0.06 + s.kEnv * 0.26) * bright})`);
      rg.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(cx, cy, fr + R * 0.08, 0, TAU); g.fill();
    }
    // THE RING ITSELF also gets a wash, so it reads as light in the air
    // between the tiles and not only as hot edges — that is what survives
    // being sliced across three hanging panels.
    for (let j = 0; j < np; j++) {
      const pu = PU[j];
      const pr = (s.tiles.rMin + clamp(pu.p, 0, 1.06) * s.tiles.rSpan) * R;
      if (pr < R * 0.02) continue;
      const bandPx = PW * s.tiles.rSpan * R * 1.6;
      const rg2 = g.createRadialGradient(cx, cy, Math.max(0, pr - bandPx), cx, cy, pr + bandPx);
      rg2.addColorStop(0, 'rgba(255,196,150,0)');
      rg2.addColorStop(0.5, `rgba(255,222,190,${0.16 * pu.a * bright})`);
      rg2.addColorStop(1, 'rgba(255,160,110,0)');
      g.fillStyle = rg2;
      g.beginPath(); g.arc(cx, cy, pr + bandPx, 0, TAU); g.fill();
    }
    // the seed, breathing on the SUB under everything
    const sr = R * (0.10 + s.kEnv * 0.07 + 0.05 * s.sub);
    const sg = g.createRadialGradient(cx, cy, 0, cx, cy, sr);
    sg.addColorStop(0, `rgba(255,214,168,${(0.08 + loud * 0.09 + s.kEnv * 0.13 + 0.06 * s.sub) * bright})`);
    sg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = sg;
    g.beginPath(); g.arc(cx, cy, sr, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    const A = inp.audio, D = A.dev || { bass: 0.5, mid: 0.5, treble: 0.5 };
    g.fillStyle = 'rgba(226,200,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    // one line, and it has to FIT 1920 — the first cut ran off the right edge
    // and lost SPIN/ELAS, which is exactly the half a player needs.
    g.fillText('B' + Math.round(s.bass * 100) + ' M' + Math.round(s.mid * 100) +
      ' T' + Math.round(s.treble * 100) + ' S' + Math.round(s.sub * 100) +
      ' L' + Math.round(s.lowmid * 100) +
      '  DEV ' + Math.round(D.bass * 100) + '/' + Math.round(D.mid * 100) + '/' + Math.round(D.treble * 100) +
      '  SWL ' + s.swell.toFixed(2) + '  SPK ' + Math.round(s.spark * 100) +
      '  FLD ' + Math.round(s.field * 100) + '  EXC ' + Math.round(exc * 100) +
      '  K ' + Math.round(s.kEnv * 100) + ' ' + (A.kick ? '#' + A.kick.n : 'ons') +
      '/' + Math.round(s._kAge * 1000) + 'ms' +
      (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? '/' + AUDIOIN.kickBpm + 'bpm' : '') +
      '  RG ' + s.pulse.length +
      '  FR ' + s.front.toFixed(2) + '/' + s.hwm.toFixed(2) + '  TL ' + s.n +
      '  HUE ' + Math.round(s.tilt * 100) + '  DL ' + s.qNow + '/5' +
      '  SPIN ' + s.spin.toFixed(2) + '  ELAS ' + Math.round(s.elas * 100) +
      (s.pres < 0.3 ? '  · SEED SLEEPING' : ''), 10, h - 10);
  }
});
