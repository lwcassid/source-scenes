/* ---------- SRC-46.2 · PENROSE BLOOM V2 (the song grows the crystal) --------
   Nima's round: make it LISTEN. V1 played its own D-minor pedal, rang a bell
   on every tile the front crossed, and ran an arp and a kit. All of that is
   gone — V2 has no audio() at all, the same as Cell Front V4-V11. The track
   is the instrument; the crystal is what the track looks like.

   Two things the music does, and only two:

   1. LOUD IS BIG. The crystallisation front — V1's one mechanic, the radius
      that sweeps the tiles sorted by distance from the seed — is driven by
      the music's own strength. Split on two clocks, the law Cell Front V9
      learned the hard way: the slow bands (eased ~1.6/s) set a FIELD that
      sizes the whole crystal over a bar, and the KICK is the only fast size
      move — the engine's time-domain LP150 detector (`inp.audio.kick`, a new
      hit is `n` changing), back-dated by the hit's true age plus a display
      lead so the shell lands on the right vsync, applied to the front with
      NO filter. So a four-on-the-floor throws a new ring of tiles outward on
      every beat, each one flashing as it crystallises, and the ring falls
      back in before the next. A drop takes the crystal to the corners.

   2. THE SPECTRUM PAINTS THE DIAMONDS. Ferro Bloom's palette is unchanged
      and still dealt out by the tiling's own structure — never by screen
      position — but the two structural inputs now come from the sound:
      · TILT, the spectral centroid: bass-heavy pulls the whole ramp warm
        (ember, blush, orchid), treble-heavy pushes it cool (teal, lavender,
        electric blue).
      · THE DEAL, quantised to five: the harmonic balance picks which of the
        five orientation classes takes which stop on the ramp, committed with
        a hold so it steps on a CHORD CHANGE instead of shimmering on every
        note. A new chord re-paints the diamonds in fives, all at once.

   HANDS DON'T COMPETE WITH THE SIGNAL (the V5 rule): L is DRIVE, a gain on
   how hard the music pushes — barely breathing to shells at the corners —
   and R is the palette ANCHOR, sliding the whole ramp cool. A stale hand
   parked by the wall's ghost drift leaves drive near its floor and the
   anchor mid-ramp; it can never lie about what the microphone heard.
   (V1 notes below.) --------------------------------------------------- */
/* ---------- SRC-46 · PENROSE BLOOM (a quasicrystal grown from one seed) ----
   Ten Robinson triangles in a wheel, deflated by the golden ratio; tiles
   sorted by distance from the seed and swept by one radius. Right hand grew
   it, left hand heated it, and it played its own D-minor pedal. Geometry,
   palette and the growth mechanic are carried over verbatim — `pbTiles`,
   `PB_PAL` and `pbCol` are V1's, reused, not copied. ------------------- */
reg({
  id: 'SRC-46.2', family: 'SRC-46', ver: 2,
  title: 'Penrose Bloom V2', tech: 'PENROSE DEFLATION / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.4 },
  tags: ['AUDIO IN', 'THE KICK THROWS A SHELL', 'SPECTRUM PAINTS THE DIAMONDS', 'FIVE-FOLD, NEVER REPEATS'],
  desc: 'V1\'s quasicrystal, listening instead of playing. A real Penrose tiling — five-fold, aperiodic, kites and darts cut at the golden ratio — grows out of a single seed at the centre of the frame, and what grows it is the song. Loud is big: the bassline and the melody size the whole crystal over a bar, and the kick is the only fast move, throwing a fresh ring of tiles outward on every beat that flashes as it crystallises and falls back in before the next one lands. A drop takes it to the corners; a breakdown leaves the five-pointed star burning alone in the middle. The colour is Ferro Bloom\'s — ember orange and blush pink at the warm end, hot orchid, acid chartreuse the pivot, teal, lavender, electric blue at the cool end — and the spectrum deals it: bass-heavy music pulls the whole ramp warm, treble-heavy pushes it cool, and the harmonic balance picks which of the five tile orientations takes which colour, so a chord change re-paints the diamonds in fives all at once. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music grows the crystal and paints it; the hands do not compete with it, they set how it listens. LEFT HAND IS DRIVE: drawn in, the track barely stirs the seed rosette; reach out and the same track throws shells to the corners on every kick. Drive is a gain on the signal, never a value of its own, so a hand left parked by the wall\'s ghost drift can only make the scene less reactive — it can never fake a level the microphone never heard. RIGHT HAND IS THE ANCHOR: reach out and the whole palette slides toward the cool end, so you choose the key the colour sits in while the spectrum plays inside it. With nothing connected and nobody there, the crystal breathes at the seed and winks a tile now and then.',
  sound: 'Makes no sound of its own — an audio-in scene, the same as Cell Front V4-V11. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. Built for a full spectrum: it wants a kick under a bassline, and it shows a chord change as a re-deal of the colours. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const levels = as > 3.2 ? 5 : as > 1.7 ? 4 : 3;
    const tiles = pbTiles(levels);
    P.state = {
      tiles, n: 0, levels, life: 0,
      pres: 0, drive: 0.85, anchor: 0.5,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0,
      tilt: 0.45, chord: 0, qNow: 0, qWant: -1, qHold: 0, dealPulse: 0,
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      fbase: 0.12, front: 0.12, vel: 0,
      lit: new Float32Array(tiles.length),
      fl: new Float32Array(tiles.length),
      twk: 1.8
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, N = s.tiles.length;
    s.life += dt;

    /* ---- HANDS: how it listens, never what it heard -------------------- */
    // inp.L/inp.R arrive NEAR=MORE (flipped at the input gate), so `1 - inp`
    // is REACH: 0 at rest, 1 at full extension.
    const reachL = 1 - clamp(inp.L), reachR = 1 - clamp(inp.R);
    s.drive += ((0.80 + reachL * 0.90) - s.drive) * Math.min(1, dt * 4.5);
    s.anchor += (reachR - s.anchor) * Math.min(1, dt * 4.5);

    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    /* ---- SLOW BANDS → THE FIELD (clock one) ---------------------------- */
    // engine-smoothed already; eased again into the scene at ~1.6/s so a
    // bassline note or a melody run grows the crystal over a bar, never a
    // frame. Silence still breathes.
    // the breath never goes fully away, and DRIVE scales it — so a player
    // standing at a scene with nothing connected still sees their left hand
    // do something to the seed instead of a dead picture.
    const idle = (0.030 + 0.016 * Math.sin(s.life * 0.19)) * (1 - 0.7 * s.pres) * s.drive;
    const bT = Math.max(idle, clamp(inp.audio.bass * s.drive));
    const mT = Math.max(idle * 0.7, clamp(inp.audio.mid * s.drive));
    const tT = Math.max(idle, clamp(inp.audio.treble * s.drive));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 1.6 : 1.0));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 1.6 : 1.0));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 1.6 : 1.0));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    const fieldMix = clamp(0.42 * s.bass + 0.34 * s.mid + 0.30 * s.treble);
    const fieldTarget = Math.pow(fieldMix, 1.35);
    s.field += (fieldTarget - s.field) * Math.min(1, dt * 1.8);

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
      // back-date the envelope along its own decay by the hit's real age plus
      // the display lead, so the shell is where it should be for this vsync
      s.kEnv = Math.max(s.kEnv, clamp(hit * Math.exp(-3.4 * (age + s.LEAD)) * clamp(s.drive * 0.6, 0.3, 1)));
    }
    s.kEnv -= s.kEnv * Math.min(1, dt * 3.4);

    /* ---- THE FRONT ----------------------------------------------------- */
    // base is SMOOTHED (hides band motion); the kick multiplies on top with
    // no filter, so the new shell is on screen the frame the hit is known.
    const baseTarget = 0.08 + 0.80 * s.field;
    s.fbase += (baseTarget - s.fbase) * Math.min(1, dt * (baseTarget > s.fbase ? 2.4 : 1.4));
    const prev = s.front;
    s.front = s.fbase * (1 + 0.45 * s.kEnv);
    s.vel = dt > 0 ? (s.front - prev) / dt : 0;

    /* ---- THE SPECTRUM PAINTS ------------------------------------------- */
    // TILT: the centroid. all bass = 0 (warm end), all treble = 1 (cool end).
    const tot = s.bass + s.mid + s.treble + 1e-4;
    // raw centroid lives in a narrow band for real music (~0.32..0.74), so
    // stretch it across the ramp before using it — otherwise bass-heavy and
    // treble-heavy are one palette stop apart and the frequencies read as
    // doing nothing.
    const centroid = (s.mid * 0.5 + s.treble) / tot;
    s.tilt += (centroid - s.tilt) * Math.min(1, dt * 2.2);
    // THE DEAL: the mid/treble balance — level-independent on purpose, so it
    // tracks the VOICING rather than how loud the track is — quantised to
    // FIVE and committed only after it has held, so it steps on a chord
    // change instead of shimmering on every note. The diamonds re-paint in
    // fives, all at once, and the step gets its own short bloom.
    const harm = clamp((s.treble * 1.6 - s.mid * 0.35) / (s.mid + s.treble + 0.05));
    const q = Math.min(4, Math.floor(harm * 5));
    if (q !== s.qWant) { s.qWant = q; s.qHold = 0; } else s.qHold += dt;
    if (s.qHold > 0.25 && q !== s.qNow) { s.qNow = q; s.dealPulse = 1; }
    s.chord += (s.qNow / 5 - s.chord) * Math.min(1, dt * 3.0);
    s.dealPulse -= s.dealPulse * Math.min(1, dt * 2.0);

    /* ---- CRYSTALLISE ---------------------------------------------------- */
    while (s.n < N && s.tiles[s.n].r <= s.front) { s.fl[s.n] = 1; s.n++; }
    while (s.n > 0 && s.tiles[s.n - 1].r > s.front) s.n--;
    const up = Math.min(1, dt * 7), dn = Math.min(1, dt * 2.4), fd = Math.min(1, dt * 3.2);
    for (let i = 0; i < N; i++) {
      const tgt = i < s.n ? 1 : 0;
      s.lit[i] += (tgt - s.lit[i]) * (tgt ? up : dn);
      if (s.fl[i] > 0.001) s.fl[i] -= s.fl[i] * fd;
    }

    // the sleeping crystal winks — the tease, now silent
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
    const R = Math.hypot(w, h) * 0.52;
    const bright = 0.45 + s.pres * 0.55;

    g.globalCompositeOperation = 'lighter';
    const wg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.9);
    wg.addColorStop(0, `rgba(18,30,92,${0.34 * bright})`);
    wg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = wg;
    g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';

    // TILES. loudness fills the plates in; the edges stay the light.
    const loud = clamp(s.energy * 1.6);
    const lw = Math.max(2.6, 2.6 * ms);
    const fillA = 0.12 + loud * 0.20 + s.kEnv * 0.05 + s.dealPulse * 0.07;
    const edgeA = 0.42 + loud * 0.26 + s.dealPulse * 0.10;
    // the ramp position every tile is measured from: radius does the massing,
    // the dealt orientation class does the local variety, and the spectrum
    // slides the whole thing warm or cool under both.
    const tiltN = clamp((s.tilt - 0.32) / 0.42);
    const tiltT = (tiltN - 0.45) * 0.80 + (s.anchor - 0.5) * 0.40 + 0.16;
    g.lineJoin = 'round';
    for (let i = 0; i < N; i++) {
      const l = s.lit[i];
      if (l < 0.02) continue;
      const tl = s.tiles[i];
      const a = l * bright;
      const shim = 0.72 + 0.28 * Math.sin(tl.r * 17 - s.life * 0.75 + tl.dir * 0.63);
      const dealt = (tl.cls + s.chord) % 1;
      const c = pbCol(tiltT + tl.r * 0.38 + (dealt - 0.5) * 0.38);
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
        const wf = f * 0.8;   // hot, but never bleached to paper white
        g.lineWidth = lw * (1 + f * 0.9);
        g.strokeStyle = `rgba(${(r0 + (255 - r0) * wf) | 0},${(g0 + (246 - g0) * wf) | 0},${(b0 + (218 - b0) * wf) | 0},${a * (edgeA + 0.46 * f)})`;
      } else {
        g.lineWidth = lw;
        g.strokeStyle = `rgba(${r0},${g0},${b0},${a * edgeA})`;
      }
      g.stroke();
    }

    // the front — brightest on the frame a kick throws it outward
    g.globalCompositeOperation = 'lighter';
    const fr = (s.tiles.rMin + clamp(s.front, 0, 1.06) * s.tiles.rSpan) * R;
    if (fr > R * 0.03) {
      const rg = g.createRadialGradient(cx, cy, Math.max(0, fr - R * 0.11), cx, cy, fr + R * 0.07);
      rg.addColorStop(0, 'rgba(255,214,168,0)');
      rg.addColorStop(0.7, `rgba(255,206,150,${(0.08 + clamp(Math.abs(s.vel) * 1.2) * 0.32) * bright})`);
      rg.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(cx, cy, fr + R * 0.07, 0, TAU); g.fill();
    }
    // the seed, breathing on the kick
    const sr = R * (0.11 + s.kEnv * 0.08);
    const sg = g.createRadialGradient(cx, cy, 0, cx, cy, sr);
    sg.addColorStop(0, `rgba(255,214,168,${(0.09 + loud * 0.10 + s.kEnv * 0.14) * bright})`);
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
      '  FRONT ' + s.front.toFixed(2) + '  TILES ' + s.n + '/' + N +
      '  TILT ' + Math.round(s.tilt * 100) + '  DEAL ' + s.qNow + '/5' +
      '  DRIVE ' + Math.round(s.drive * 100) + '  ANCHOR ' + Math.round(s.anchor * 100) +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  }
});
