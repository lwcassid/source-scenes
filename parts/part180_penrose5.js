/* ---------- SRC-46.5 · PENROSE BLOOM V5 (smaller tiles, denser plate) -------
   Nima, looking at V3/V4 live in a wide browser window: "the shape gets too
   large as part of the total size of the screen even at ambient noise
   without a kick/beat. Shrink it such that it expands as much in terms of
   layers but the whole thing is more dense."

   Three changes, no new mechanics:

   1. ONE MORE DEFLATION. Depth 5 -> 6 at show size (890 -> 2330 tiles, and
      4 -> 5 / 3 -> 4 below that). Tiles get ~1.6x smaller, so the same
      radius holds ~1.6x more of them and the rosette structure comes with
      it — 56 sun vertices instead of 21, all at 24/17/59% core/point/field,
      because that ratio is scale-invariant in a Penrose tiling. Many small
      rosettes is also much closer to the reference plate than seven big
      ones were.
   2. THE DISC IS ANCHORED TO THE SHORT SIDE. R was hypot(w,h)*0.52, which is
      dominated by WIDTH — in Nima's 1881x819 window that put the boundary
      well past the top and bottom of the frame while the HUD still read
      FRONT 0.39. min(w,h)*0.92 is the same size in the 16:10 show frame and
      behaves in every other aspect.
   3. A SHORTER LEASH ON THE FRONT: 0.13 + 0.38*field, down from 0.22 +
      0.52. Ambient now sits at ~52% of the frame height instead of
      overflowing it, a real drop reaches ~91%, and a kick on top of a drop
      just brushes past. Because the shells are thinner at depth 6 this
      still crosses MORE layers than V4 did (~9.5 vs ~8.3) — which is
      exactly the ask: smaller and denser, not shorter-travelled.
   (V4 notes below.) ----------------------------------------------------- */
/* ---------- SRC-46.4 · PENROSE BLOOM V4 (the rosettes come out) -------------
   Nima, with the reference plate again: at full excitement the colour should
   ARRANGE ITSELF into the plate's pattern — five-fold star rosettes standing
   out of a mostly uncoloured field — not tint every diamond evenly. Palette
   unchanged; what changes is WHICH tiles get it.

   The plate is not decorated, it is DIAGNOSED: its colour picks out the
   tiling's sun vertices. A P3 sun is five fat rhombs meeting at their 72°
   corners, and in this triangulation that vertex is unmistakable — exactly
   ten fat triangle-corners and no thin ones. `pb4Rose` finds them once per
   deflation depth (21 of them at the show's depth, 6 one level down, 1 in a
   thumbnail — the seed itself), measures every tile's distance to the
   nearest one in rhomb-edge units, and the tiling sorts itself into three
   families with no fudging at all:
     · CORE  (< 1.55 edges) — the ten fat tiles at the sun. 210 of 890.
     · POINT (< 2.2 edges)  — the ring of thin darts around it. 160 of 890.
     · FIELD (everything else) — 520 of 890, the plate's bare paper.
   Core and point take opposite offsets on Ferro Bloom's ramp, so a rosette
   reads as a warm heart inside cooler points, the way the plate's gold
   centres sit inside violet ones. The field takes Ferro Bloom's own cream,
   dim — on black that is the plate's paper inverted into light.

   AND IT EMERGES WITH EXCITEMENT. The arrangement is always the arrangement,
   but its CONTRAST rides the field: quiet, the rosettes are barely brighter
   than the paper and the whole crystal reads as one lattice; loud, the paper
   recedes and the stars blaze out of it. That is the picture the plate shows
   — arrived at by getting louder.
   (V3 notes below.) ---------------------------------------------------- */

/* `pb4Rose` and its cache are V4's, reused as-is — which tiles form a
   rosette is a property of the geometry, not of a version. */

/* ---------- SRC-46.3 · PENROSE BLOOM V3 (a calmer crystal, a louder palette)
   Nima on V2: "the size change is too sensitive and the color change is not
   sensitive enough." Both, and they turn out to be one trade — V2 spent its
   whole dynamic range on the radius and almost none of it on the ramp.

   SIZE, CALMED — three changes, the first of which is the real one:
   · A HIGH-WATER MARK owns which tiles exist. In V2 the tile list was swept
     by the live front, so every wobble of the front CRYSTALLISED and then
     DISSOLVED a whole ring — a binary, white-flashing edge strobing at the
     beat. Now growth is instant and retreat is a melt: `hwm` snaps out to
     the front and eases back at ~1.1/s, so a kick still adds a shell but the
     boundary never flickers, and a small dip in the track no longer costs
     the crystal a ring.
   · The kick's authority over SIZE drops 0.45 → 0.16. It has not gone quiet:
     the beat now reads mostly as LIGHT — the front ring brightens with the
     kick envelope directly instead of with the front's velocity — which is
     what the beat should be on scrim anyway.
   · The base sits in a narrower, higher band (0.22 + 0.52·field instead of
     0.08 + 0.80·field) and the bands and field are all eased slower. A
     track's loud and quiet are still clearly different crystals; they are no
     longer a different scene.

   COLOUR, WIDENED — the spectrum now owns most of the ramp:
   · The centroid's usable window is tighter (0.36..0.66 rather than
     0.32..0.74) and its weight nearly doubles (0.80 → 1.25), so bass-heavy
     and treble-heavy sit at opposite ends of Ferro Bloom's palette instead
     of two stops apart, and it eases in at 3.2/s instead of 2.2.
   · The radial massing gives up room for it (0.38 → 0.26) and the dealt
     orientation class takes more (0.38 → 0.52), so the diamonds differ more
     from each other AND the whole mosaic travels further.
   · The deal commits after 0.18s instead of 0.25s, so a chord change lands
     sooner. Everything else — geometry, the two clocks, hands as drive and
     anchor, no sound of its own — is V2.
   (V2 notes below.) ---------------------------------------------------- */
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
  id: 'SRC-46.5', family: 'SRC-46', ver: 5,
  title: 'Penrose Bloom V5', tech: 'PENROSE DEFLATION / SUN ROSETTES / AUDIO-GROWN',
  audioIn: true,
  fx: { bloom: 0.4 },
  tags: ['AUDIO IN', 'FINE PLATE, MANY ROSETTES', 'LOUD RESOLVES THE PATTERN', 'THE BEAT IS LIGHT', 'FIVE-FOLD, NEVER REPEATS'],
  desc: 'V4 at a finer grain. One more golden-ratio deflation makes the tiles about a third smaller and the plate correspondingly denser — 2330 of them at show size instead of 890, carrying fifty-six star rosettes instead of twenty-one, because the sun vertices the colour picks out come along with the geometry at every scale. Many small rosettes is a far closer read of the reference plate than seven big ones. The crystal is also physically smaller in the frame now, and anchored to the frame\'s short side rather than its diagonal, so ambient room noise sits at about half the frame height instead of running off the top and bottom of a wide window; a real drop takes it to the edges and a kick on top of that just brushes past. It still travels through MORE layers of growth than before, not fewer — the shells are thinner, so the same reach crosses more of them. Everything else is V4: the rosettes standing out of bare cream paper, resolving out of the lattice as the track gets louder, the spectrum tilting the whole ramp warm or cool and re-dealing on a change in the harmonic balance. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. The music grows the crystal and paints it; the hands set how it listens, they never compete with the signal. LEFT HAND IS DRIVE: drawn in, a whole track barely stirs the seed rosette; reach out and the same track fills the frame. Drive is a gain, so a hand left parked by the wall\'s ghost drift can only make the scene less reactive — it can never fake a level the microphone never heard. RIGHT HAND IS THE ANCHOR: reach out and the whole palette slides toward the cool end, so you pick the key the colour sits in while the spectrum plays inside it. With nothing connected and nobody there, the crystal breathes at the seed — which is itself a sun vertex, so the resting picture is a single rosette — and winks a tile now and then.',
  sound: 'Makes no sound of its own — an audio-in scene, the same as Cell Front V4-V11. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. Built for a full spectrum: it wants a kick under a bassline, and it shows a change in the harmonic balance as a re-deal of the colours. No MIDI out either — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const levels = as > 3.2 ? 6 : as > 1.7 ? 5 : 4;
    const tiles = pbTiles(levels);
    P.state = {
      tiles, rose: pb4Rose(tiles, levels), n: 0, levels, life: 0,
      pres: 0, drive: 0.85, anchor: 0.5,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0,
      tilt: 0.45, chord: 0, qNow: 0, qWant: -1, qHold: 0, dealPulse: 0,
      kEnv: 0, _kN: -1, _kGap: 1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      fbase: 0.15, front: 0.15, hwm: 0.15, vel: 0,
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
      // back-date the envelope along its own decay by the hit's real age plus
      // the display lead, so the shell is where it should be for this vsync
      s.kEnv = Math.max(s.kEnv, clamp(hit * Math.exp(-3.4 * (age + s.LEAD)) * clamp(s.drive * 0.6, 0.3, 1)));
    }
    s.kEnv -= s.kEnv * Math.min(1, dt * 2.8);

    /* ---- THE FRONT ----------------------------------------------------- */
    // V5: a shorter leash again (0.13 + 0.38, was 0.22 + 0.52) — ambient sits
    // at about half the frame height instead of overflowing it, a real drop
    // reaches ~91%, and a kick on top of a drop just brushes past. Depth 6's
    // thinner shells mean this still crosses MORE layers than V4 did.
    // The kick keeps its small push (0.16) because the beat is carried by
    // LIGHT, not by the boundary.
    const baseTarget = 0.13 + 0.38 * s.field;
    s.fbase += (baseTarget - s.fbase) * Math.min(1, dt * (baseTarget > s.fbase ? 1.4 : 0.9));
    const prev = s.front;
    s.front = s.fbase * (1 + 0.16 * s.kEnv);
    s.vel = dt > 0 ? (s.front - prev) / dt : 0;
    // THE HIGH-WATER MARK is what actually owns the tiles. Growth is instant,
    // retreat is a melt — so the boundary never strobes, and a dip in the
    // track costs the crystal nothing until the dip is real.
    s.hwm = s.front > s.hwm ? s.front : s.hwm + (s.front - s.hwm) * Math.min(1, dt * 1.1);

    /* ---- THE SPECTRUM PAINTS ------------------------------------------- */
    // TILT: the centroid. all bass = 0 (warm end), all treble = 1 (cool end).
    const tot = s.bass + s.mid + s.treble + 1e-4;
    // raw centroid lives in a narrow band for real music (~0.32..0.74), so
    // stretch it across the ramp before using it — otherwise bass-heavy and
    // treble-heavy are one palette stop apart and the frequencies read as
    // doing nothing.
    const centroid = (s.mid * 0.5 + s.treble) / tot;
    s.tilt += (centroid - s.tilt) * Math.min(1, dt * 3.2);
    // THE DEAL: the mid/treble balance — level-independent on purpose, so it
    // tracks the VOICING rather than how loud the track is — quantised to
    // FIVE and committed only after it has held, so it steps on a chord
    // change instead of shimmering on every note. The diamonds re-paint in
    // fives, all at once, and the step gets its own short bloom.
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
    // ANCHORED TO THE SHORT SIDE (V5). hypot(w,h) is dominated by WIDTH, so
    // in a wide window the boundary ran off the top and bottom of the frame
    // while the HUD still read a modest FRONT. Same size at 16:10, sane
    // everywhere else.
    const R = Math.min(w, h) * 0.92;
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
    // V3: the tighter window (0.36..0.66 — where real music actually lives)
    // is what buys the sensitivity; the WEIGHT then has to leave room for the
    // mosaic. At 1.25 the treble section clamped every tile to electric blue
    // and the diamonds stopped differing from each other at all — one flat
    // colour is not a more sensitive palette, it is a lost one. 0.58 moves
    // the ramp's CENTRE most of its length while the class and radius terms
    // still spread the tiles around it.
    const tiltN = clamp((s.tilt - 0.36) / 0.30);
    const tiltT = (tiltN - 0.5) * 0.58 + (s.anchor - 0.5) * 0.40 + 0.42;
    // EXCITEMENT resolves the plate: quiet, paper and rosette are nearly the
    // same brightness and the crystal is one lattice; loud, the paper drops
    // away and the stars stand out of it.
    const exc = clamp(s.field * 1.5);
    const CREAM = [247, 230, 204];              // Ferro Bloom's own cream
    g.lineJoin = 'round';
    for (let i = 0; i < N; i++) {
      const l = s.lit[i];
      if (l < 0.02) continue;
      const tl = s.tiles[i];
      const a = l * bright;
      const shim = 0.72 + 0.28 * Math.sin(tl.r * 17 - s.life * 0.75 + tl.dir * 0.63);
      const dealt = (tl.cls + s.chord) % 1;
      const fam = s.rose[i];
      // CORE sits low on the ramp and POINT high, so a rosette is a warm
      // heart inside cooler points — the plate's gold-in-violet. FIELD is
      // bare paper and takes no ramp position at all.
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
      const f = s.fl[i];
      g.beginPath();
      g.moveTo(cx + tl.x[0] * R, cy + tl.y[0] * R);
      g.lineTo(cx + tl.x[1] * R, cy + tl.y[1] * R);
      g.lineTo(cx + tl.x[2] * R, cy + tl.y[2] * R);
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

    // the front — brightest on the frame a kick throws it outward
    g.globalCompositeOperation = 'lighter';
    // THE BEAT IS LIGHT (V3): the ring brightens on the kick ENVELOPE, not on
    // how fast the boundary is moving — the boundary barely moves now.
    const fr = (s.tiles.rMin + clamp(s.front, 0, 1.06) * s.tiles.rSpan) * R;
    if (fr > R * 0.03) {
      const rg = g.createRadialGradient(cx, cy, Math.max(0, fr - R * 0.13), cx, cy, fr + R * 0.08);
      rg.addColorStop(0, 'rgba(255,214,168,0)');
      rg.addColorStop(0.7, `rgba(255,206,150,${(0.07 + s.kEnv * 0.34) * bright})`);
      rg.addColorStop(1, 'rgba(255,150,90,0)');
      g.fillStyle = rg;
      g.beginPath(); g.arc(cx, cy, fr + R * 0.08, 0, TAU); g.fill();
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
      '  FRONT ' + s.front.toFixed(2) + '/' + s.hwm.toFixed(2) + '  TILES ' + s.n + '/' + N +
      '  TILT ' + Math.round(s.tilt * 100) + '  DEAL ' + s.qNow + '/5' +
      '  ROSE ' + Math.round(clamp(s.field * 1.5) * 100) +
      '  DRIVE ' + Math.round(s.drive * 100) + '  ANCHOR ' + Math.round(s.anchor * 100) +
      (s.pres < 0.3 ? '   · SEED SLEEPING' : ''), 10, h - 10);
  }
});
