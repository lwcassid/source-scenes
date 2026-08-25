/* ---------- SRC-42.14 · RIDGE LOOM V14 (a seat for the funk loop)
   The loop-first drums round: pad G2 / note 55 is RIDGE'S LOOP SEAT.
   When the summons window first opens, the pad is struck once on a bar
   boundary and held all scene; perc CC74 (the window energy) fades it
   in and out -- map ch1 CC74 to the pad's chain volume, Min -inf. Drop
   a dry funk loop there (~96 BPM, warped) and the pocket becomes YOUR
   drummer; until then the pad is empty and the programmed V13 kit
   carries the window unchanged. Once a loop is seated, say so and the
   programmed hits go browser-only in one line. (V13 notes below.) --- */
/* ---------- SRC-42.13 · RIDGE LOOM V13 (the band gets its drummer)
   The pocket round (Lance: "jam modes where beats can come in"). Ridge
   is THE BAND -- a bassist and three leads with no drummer, which is
   why its brief said "tight DRY kit" and the mix never delivered one.
   V13 puts the kit behind THE SUMMONS (the cross-scene master code:
   left hand parked at the source, right hand wiggling ~4s): a ~45s
   window where a bone-dry 96 BPM funk pocket fades in -- kick on the
   one, the and-of-2 and the and-of-3, side-stick backbeat, hats RANKED
   beats-first to 16ths with the window's energy, shaker offbeats and an
   open-hat sigh only near full burn. Scene-side swing (~10% on the odd
   16ths), velocities ranked and ghosted -- a drummer, not a machine.
   The groove FADES with the latch (no hard starts, the Rain V13 gate
   law); the charge telegraphs as quiet hat ticks growing under the
   wiggle. Everything else untouched from V12 (below). ---------------- */
/* ---------- SRC-42.12 · RIDGE LOOM V12 (the band meets the rack)
   Pre-built rig round (Lance's head-start): two casting fixes. The glue
   bed (three held triangle voices) was auto-mirroring as a standing
   PAD-channel stack -- the wash the pad law bans; it stays browser-side
   now. And the right hand's running arpeggio was machine-gunning 8th
   notes at the FELT PIANO alongside the long tone and the accents --
   three voices on one channel, and exactly the per-note spam Lance
   banned for the ARP SYNTH's own arpeggiator. V12 recasts it: the
   browser 8ths stay as the web voice, and ARP SYNTH gets one HELD note
   carrying the arpeggio's convergence pitch -- struck on the grid
   (first on the next beat, re-struck each bar line, the Chladni V28
   grid-lock), re-pitched as rings pull it toward the long tone, with
   CC74 = the earned density so cutoff rides the reach. Science Class
   does the rhythm; the scene does the harmony. FELT PIANO keeps only
   the long lead and the accents. Browser sound and visuals untouched
   from V11. ---------------------------------------------------------- */
/* ---------- SRC-42.11 · RIDGE LOOM V11 (V10's picture; the rest is a breath) ---------- */
reg({
  id: 'SRC-42.14', family: 'SRC-42', ver: 14, title: 'Ridge Loom V14', tech: 'V10 + BREATHING REST, EARNED GRID, REAL CONVERGENCE',
  music: {
    bpm: 96, root: 49, mode: 'dorian', chordBars: 2,
    chords: [
      [0, 7, 15, 21, 26],   // C♯m13   — the dorian sixth
      [0, 5, 12, 17, 21],   // F♯/C♯
      [0, 7, 14, 19, 22],   // C♯m9
      [0, 10, 15, 19, 24]   // C♯m7
    ],
    chordNames: ['C♯m13', 'F♯/C♯', 'C♯m9', 'C♯m7']
  },
  fx: { bloom: 0.45 },
  tags: ['LEFT HAND = BASS', 'RIGHT HAND = LEADS', 'HEIGHT IS THE COLOUR', 'REST BREATHES, NEVER TICKS'],
  desc: 'V10\'s palette and line, with the resting state rebuilt. An empty frame now genuinely rests: it settles to the violet flow the card always promised and BREATHES — soft low swells at irregular intervals, each one visibly pumping the whole weave and warming the frame a shade before it cools. The six-second two-state palette crossing (violet floor / orange summits into orange floor / cyan summits) now belongs to PRESENCE: it runs while someone is playing and eases home to violet when they leave, so the breath you see at rest is the breath you hear, never a clock. First touch snaps the scene awake; letting go unravels it slowly instead of dropping it.',
  interact: 'The two hands are two different musicians. L is the RHYTHM SECTION: its three cores are the bassline, and every one you surface makes that line busier and more melodic — one core is a root on the downbeat, two is a walking pair, three is a full syncopated figure whose notes are chosen by how many loops each core has closed. R is the FRONT LINE: its three cores are three different leads, arriving one at a time — first a long singing tone, then an arpeggio that runs faster the further you reach, then a high answering bell on top. New in V11: how HARD you play is in the sound — a fast reach strikes louder than a creep, downbeats lean heavier than off-beats, and when rings start enclosing more than one core the three right-hand voices audibly pull onto one pitch. Bring both hands home and the frame cools to a violet flow that breathes on its own clock.',
  sound: 'The playing instrument is V10\'s band with dynamics: every grid voice now derives its velocity from the gesture (core width and reach speed) with downbeat accents, the arpeggio\'s density is earned (quarters at low reach, eighths near full), and the shared-ring convergence is real — arp and bell degrees are pulled toward the long tone\'s pitch as rings enclose more cores, instead of a 2-cent detune nobody could hear. The RESTING state is rebuilt to the studio\'s idle law: the bar-clock bass root is gone; below presence the grid is silent and the scene breathes instead — randomized low swells (length, depth, voice and spacing all rolled per breath, roughly one in seven landing a deeper toll) over a loom-noise floor that undulates on two incommensurate slow LFOs, never dead, never periodic. Each breath pumps the wave field so the sound visibly moves the picture. Ableton: bass = the picture-written figures, lead = the long tone + accents only, ARP SYNTH holds the arpeggio\'s convergence note on the grid (CC74 = earned density; the patch arpeggiates), bells = the answers; the glue bed stays browser-side. THE POCKET (V13): the summons opens a ~45s window where a dry funk kit fades in on the real pads; pad 55 = the LOOP SEAT (drop a ~96 BPM funk loop there, ch1 CC74 fades it) - kick 36 (one, and-of-2, and-of-3), side-stick 38 backbeat, ranked hats 42, shaker 51 offbeats, open-hat 46 sigh - swung scene-side, velocity-ranked, perc CC74 = the window energy. Velocities carry the dynamics.',

  init(P) {
    const w = P.w, h = P.h;
    // P.focused is false during init — size off the area. Wall tiles get a
    // much coarser field; nobody counts ridges on a thumbnail.
    const fine = areaScale(P) > 1.6 ? 1 : 0.38;
    const CORES = [
      { hx: 0.13, hy: 0.30, side: 0, slot: 0, deg: 0 },
      { hx: 0.22, hy: 0.80, side: 0, slot: 1, deg: 2 },
      { hx: 0.40, hy: 0.22, side: 0, slot: 2, deg: 4 },
      { hx: 0.87, hy: 0.30, side: 1, slot: 0, deg: 1 },
      { hx: 0.78, hy: 0.80, side: 1, slot: 1, deg: 3 },
      { hx: 0.58, hy: 0.72, side: 1, slot: 2, deg: 5 }
    ];
    for (const c of CORES) {
      c.x = c.hx * w; c.y = c.hy * h; c.w = 0; c.loops = 0; c.ph = P.rand() * TAU;
      c.spd = 0; c.pend = 0; c.pendT = 0;
    }
    const GX = Math.max(30, Math.round(112 * fine)), GY = Math.max(20, Math.round(70 * fine));
    const N = (GX + 1) * (GY + 1);
    const lo = -0.95, step = 0.42, NL = 26;
    P.state = {
      GX, GY, cores: CORES, pres: 0, ph: 0,
      f: new Float32Array(N), fs: new Float32Array(N),
      ownV: new Float32Array(N),
      sig: w * 0.075, lo, step, NL, wMax: 5,
      shared: 0, sharedPend: 0, sharedT: 0, ridges: 0, live: 2, nL: 1, nR: 1, evq: [],
      // breathEnv is the resting swell: audio sets it, the field and the
      // brightness read it, so the breath is one thing seen and heard
      breathEnv: 0,
      waves: [
        { k: 3.1, a: 0.55, dir: 0.4, sp: 1 },
        { k: 5.3, a: 0.33, dir: 2.1, sp: -0.62 },
        { k: 8.7, a: 0.18, dir: 3.9, sp: 0.41 }
      ],
      seg: [], NB: NL * 6,
      oTh: [0.12, 0.4, 0.9, 1.7, 2.8], tierA: [0.24, 0.34, 0.47, 0.64, 0.82, 1],
      dLo: 0.28, dSpan: 0.34, dFloor: 0.6, dens: 1,
      rSpan: 5.65, lut: [], lutT: []
    };
    const s = P.state;
    //   state 1: floor #4900ff  ->  peaks #f36c3b
    //   state 2: floor #f36c3b  ->  peaks #00edff
    s.palLo = [[257.2, 1, 1], [16.0, 0.757, 0.953]];
    s.palHi = [[16.0, 0.757, 0.953], [184.2, 1, 1]];
    s.cyc = 6;            // seconds per crossing; a full there-and-back is 12
    s.mix = 0;
    s.curLo = [0x49, 0x00, 0xff];
    s.curHi = [0xf3, 0x6c, 0x3b];
    s.h2r = (h, sa, v) => {
      h = ((h % 360) + 360) % 360;
      const c = v * sa, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
      else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
      else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
      return [((r + m) * 255) | 0, ((g + m) * 255) | 0, ((b + m) * 255) | 0];
    };
    s.ramp = u => {
      const t = clamp(u), A = s.curLo, B = s.curHi;
      return [
        Math.sqrt(A[0] * A[0] * (1 - t) + B[0] * B[0] * t) | 0,
        Math.sqrt(A[1] * A[1] * (1 - t) + B[1] * B[1] * t) | 0,
        Math.sqrt(A[2] * A[2] * (1 - t) + B[2] * B[2] * t) | 0
      ];
    };
    for (let k = 0; k < NL; k++) {
      const t = clamp(k * step / s.rSpan);
      s.lutT.push(t);
      s.lut.push(s.ramp(t));
    }
    for (let b = 0; b < s.NB; b++) s.seg.push([]);
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    // asymmetric presence: first touch snaps the scene awake, absence lets it
    // down slowly — a tracker wobble must never yank a build to the floor
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 8 : 0.45));
    s.breathEnv *= Math.exp(-dt / 2.2);
    const HV = [clamp(inp.L), clamp(inp.R)];
    const TH = [[0, 0.28, 0.9], [0.32, 0.4, 0], [0.64, 0.36, 0]];
    let liveN = 0, nL = 0, nR = 0;
    for (const c of s.cores) {
      const x = HV[c.side];
      const th = TH[c.slot];
      const want = (c.slot === 0 ? clamp(th[1] + x * th[2]) : clamp((x - th[0]) / th[1])) * s.wMax;
      const pw = c.w;
      // grow fast, shrink slower — the walk-away is an unravel, not a collapse
      c.w += (want - c.w) * Math.min(1, dt * (want > c.w ? 4.5 : 2.2));
      // reach speed, smoothed: the audio strikes harder for a fast gesture
      c.spd += (Math.abs(c.w - pw) / Math.max(dt, 1e-3) - c.spd) * Math.min(1, dt * 3);
      c.ph += dt * 0.3;
      c.x = c.hx * w + Math.sin(c.ph) * w * 0.012;
      c.y = c.hy * h + Math.cos(c.ph * 0.8) * h * 0.02;
      if (c.w > 0.8) { liveN++; if (c.side) nR++; else nL++; }
    }
    s.live = liveN; s.nL = nL; s.nR = nR;
    // ---- the palette breath now belongs to PRESENCE ----------------------
    // playing: V10's 6s two-state crossing, full range. resting: the frame
    // eases home to the violet state and only the audible breath warms it —
    // partway, briefly — so what the room sees at rest is what it hears.
    const ph = (t % (s.cyc * 2)) / s.cyc;
    const tri = ph < 1 ? ph : 2 - ph;
    const cross = tri * tri * (3 - 2 * tri);   // smoothstep: dwell at each state
    s.mix = clamp(cross * s.pres + (1 - s.pres) * s.breathEnv * 0.22);
    for (let e = 0; e < 2; e++) {
      const P0 = (e ? s.palHi : s.palLo)[0], P1 = (e ? s.palHi : s.palLo)[1];
      let dh = P1[0] - P0[0];
      if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;  // shortest arc
      const col = s.h2r(P0[0] + dh * s.mix,
                        P0[1] + (P1[1] - P0[1]) * s.mix,
                        P0[2] + (P1[2] - P0[2]) * s.mix);
      const dst = e ? s.curHi : s.curLo;
      dst[0] = col[0]; dst[1] = col[1]; dst[2] = col[2];
    }
    for (let k = 0; k < s.NL; k++) {
      const c = s.ramp(s.lutT[k]), d = s.lut[k];
      d[0] = c[0]; d[1] = c[1]; d[2] = c[2];
    }

    const beats = (typeof T !== 'undefined' && T.running) ? T.beats() : t * 1.6;
    s.ph = beats * TAU;
    const sig2 = 2 * s.sig * s.sig;

    // ---- the field --------------------------------------------------------
    // the breath pumps the waves: each resting swell visibly moves the weave
    const wamp = 1 + s.breathEnv * 0.6;
    const GX = s.GX, GY = s.GY, f = s.f, fs = s.fs, ownV = s.ownV;
    const cw = w / GX, ch = h / GY, W = s.waves, C = s.cores;
    for (let j = 0; j <= GY; j++) {
      const y = j * ch;
      for (let i = 0; i <= GX; i++) {
        const x = i * cw;
        let val = 0;
        for (let q = 0; q < W.length; q++) {
          const wv = W[q];
          const u = (x * Math.cos(wv.dir) + y * Math.sin(wv.dir)) / Math.max(w, h);
          val += wv.a * wamp * Math.sin(u * wv.k * TAU + s.ph * wv.sp * 0.25 + q);
        }
        let best = 0;
        for (let q = 0; q < 6; q++) {
          const c = C[q];
          if (c.w < 0.05) continue;
          const dx = x - c.x, dy = y - c.y;
          const e = c.w * Math.exp(-(dx * dx + dy * dy) / sig2);
          val += e;
          if (e > best) best = e;
        }
        const o = j * (GX + 1) + i;
        f[o] = val; ownV[o] = best;
      }
    }
    const RW = GX + 1;
    for (let j = 0; j <= GY; j++) {
      for (let i = 0; i <= GX; i++) {
        const o = j * RW + i;
        const l = i > 0 ? f[o - 1] : f[o], r = i < GX ? f[o + 1] : f[o];
        const u = j > 0 ? f[o - RW] : f[o], d = j < GY ? f[o + RW] : f[o];
        fs[o] = f[o] * 0.44 + (l + r + u + d) * 0.14;
      }
    }

    // ---- march it into ridges: level picks the hue, ownV picks the burn ----
    const seg = s.seg, lo = s.lo, st = s.step, NL = s.NL, oTh = s.oTh;
    for (let k = 0; k < s.NB; k++) seg[k].length = 0;
    for (let j = 0; j < GY; j++) {
      for (let i = 0; i < GX; i++) {
        const o = j * RW + i;
        const a = fs[o], b = fs[o + 1], c = fs[o + RW + 1], d = fs[o + RW];
        let mn = a, mx = a;
        if (b < mn) mn = b; else if (b > mx) mx = b;
        if (c < mn) mn = c; else if (c > mx) mx = c;
        if (d < mn) mn = d; else if (d > mx) mx = d;
        let k0 = Math.ceil((mn - lo) / st), k1 = Math.floor((mx - lo) / st);
        if (k0 < 0) k0 = 0;
        if (k1 > NL - 1) k1 = NL - 1;
        if (k1 < k0) continue;
        const x0 = i * cw, y0 = j * ch;
        const ov = ownV[o];
        const tier = ov > oTh[4] ? 5 : ov > oTh[3] ? 4 : ov > oTh[2] ? 3
          : ov > oTh[1] ? 2 : ov > oTh[0] ? 1 : 0;
        for (let k = k0; k <= k1; k++) {
          const lev = lo + k * st;
          const m = (a > lev ? 1 : 0) | (b > lev ? 2 : 0) | (c > lev ? 4 : 0) | (d > lev ? 8 : 0);
          if (m === 0 || m === 15) continue;
          const out = seg[k * 6 + tier];
          const ax = x0 + cw * (lev - a) / (b - a), ay = y0;
          const bx = x0 + cw, by = y0 + ch * (lev - b) / (c - b);
          const cx2 = x0 + cw * (lev - d) / (c - d), cy2 = y0 + ch;
          const dx2 = x0, dy2 = y0 + ch * (lev - a) / (d - a);
          switch (m) {
            case 1: case 14: out.push(dx2, dy2, ax, ay); break;
            case 2: case 13: out.push(ax, ay, bx, by); break;
            case 3: case 12: out.push(dx2, dy2, bx, by); break;
            case 4: case 11: out.push(bx, by, cx2, cy2); break;
            case 6: case 9: out.push(ax, ay, cx2, cy2); break;
            case 7: case 8: out.push(dx2, dy2, cx2, cy2); break;
            case 5: out.push(dx2, dy2, ax, ay, bx, by, cx2, cy2); break;
            case 10: out.push(ax, ay, bx, by, cx2, cy2, dx2, dy2); break;
          }
        }
      }
    }

    // ---- TOPOLOGY: whose loops are whose (untouched — this writes the music)
    const waveCeil = 0.72;
    const cnt = (a, b) => Math.max(0, Math.min(s.NL,
      Math.floor((Math.min(b, lo + (s.NL - 1) * st) - lo) / st) - Math.floor((Math.max(a, waveCeil) - lo) / st)));
    let topSaddle = 0;
    for (let i = 0; i < 6; i++) {
      const ci = C[i];
      if (ci.w < 0.8) { if (ci.loops !== 0) { s.evq.push({ core: i, n: 0, up: false }); ci.loops = 0; } continue; }
      let sad = 0;
      for (let j = 0; j < 6; j++) {
        if (i === j) continue;
        const cj = C[j];
        if (cj.w < 0.8) continue;
        const dx = cj.x - ci.x, dy = cj.y - ci.y;
        const v2 = (ci.w + cj.w) * Math.exp(-((dx * dx + dy * dy) / 4) / sig2);
        if (v2 > sad) sad = v2;
        if (v2 > topSaddle) topSaddle = v2;
      }
      // a count must HOLD before it commits: the cores' ambient wobble sits
      // topology right on contour boundaries and flips the raw count every
      // few frames — undebounced, the long lead re-sings five times a second.
      // 0.18s also folds a fast reach into ONE statement (the landing count)
      // instead of machine-gunning every count it swept through.
      const n = cnt(sad, ci.w);
      if (n !== ci.pend) { ci.pend = n; ci.pendT = 0; }
      if (n !== ci.loops) {
        ci.pendT += dt;
        if (ci.pendT > 0.18) { s.evq.push({ core: i, n, up: n > ci.loops }); ci.loops = n; }
      }
    }
    const nB = cnt(waveCeil, topSaddle);
    if (nB !== s.sharedPend) { s.sharedPend = nB; s.sharedT = 0; }
    if (nB !== s.shared) {
      s.sharedT = (s.sharedT || 0) + dt;
      if (s.sharedT > 0.18) { s.evq.push({ core: -1, n: nB, up: nB > s.shared }); s.shared = nB; }
    }
    if (s.evq.length > 14) s.evq.splice(0, s.evq.length - 14);
    let ridges = 0;
    for (let k = 0; k < s.NB; k++) ridges += seg[k].length;
    s.ridges = ridges >> 2;
    const dn = s.ridges / (GX * GY);
    const want = s.dFloor + (1 - s.dFloor) * clamp((dn - s.dLo) / s.dSpan);
    s.dens += (want - s.dens) * Math.min(1, dt * 2.2);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#08070b';
    g.fillRect(0, 0, w, h);
    // presence says "someone is here", fullness says "and this is how much
    // they have built" — and at rest the breath lifts the light with the sound
    const bright = (0.5 + s.pres * 0.5) * s.dens * (1 + s.breathEnv * 0.25);
    const lw = Math.max(3.4 * ms, Math.min(w, h) * 0.011) * 0.56;

    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = lw;
    // low ground first so the summits paint over their own flanks
    for (let b = 0; b < s.NB; b++) {
      const sg = s.seg[b];
      if (!sg || !sg.length) continue;
      const k = (b / 6) | 0, c = s.lut[k];
      const a = s.tierA[b % 6] * (0.88 + s.lutT[k] * 0.12) * bright;
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`;
      g.beginPath();
      for (let i = 0; i < sg.length; i += 4) {
        g.moveTo(sg[i], sg[i + 1]);
        g.lineTo(sg[i + 2], sg[i + 3]);
      }
      g.stroke();
    }

    g.globalCompositeOperation = 'lighter';
    for (const c of s.cores) {
      if (c.w < 0.6) continue;
      const col = s.ramp((c.w - s.lo) / s.rSpan);
      const R = s.sig * (0.5 + clamp(c.w / s.wMax) * 0.5);
      const gr = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
      gr.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.16 * clamp(c.w / s.wMax) * bright})`);
      gr.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(c.x, c.y, R, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(243,108,59,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const BASSN = ['—', 'ROOT', 'WALKING', 'SYNCOPATED'];
    const LEADN = ['—', 'TONE', 'TONE+ARP', 'TONE+ARP+BELL'];
    const resting = s.pres < 0.3;
    g.fillText('BASS ' + (resting ? '—' : BASSN[s.nL] + ' (' + s.nL + ')') +
      '   LEAD ' + (resting ? '—' : LEADN[s.nR] + ' (' + s.nR + ')') +
      '   LOOPS ' + s.cores.map(c => c.loops).join('/') + '   SHARED ' + s.shared +
      (resting ? '   · RESTING (BREATHES)' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the loom: bowed air -------------------------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 800, 1.6), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- glue: triangle only. No sawtooth anywhere in this version ------ */
    const bed = A.padVoices(v, 3, { type: 'triangle', gain: 0.008, cutoff: 300, q: 0.6, midi: false });
    const place = glide => A.leadToChord(bed, -1, glide);
    place(0.05);
    H.onChord(() => place(0.2));
    v.fadeIn(1, 1.4);

    // THE PICTURE WRITES THE PARTS: a core's loop count is its note
    const toneOf = (i, oct) => H.chordTone(P.state.cores[i].deg + P.state.cores[i].loops, oct);
    // ...but a BASSIST stays in the pocket: the floor folds its loop-walk
    // back into a playable register (V11 climbed unbounded -- note 82 on a
    // bass patch by minute three). Loops still choose the note; the octave
    // stays a bass octave.
    const bassToneOf = i => H.chordTone(P.state.cores[i].deg + (P.state.cores[i].loops % 5), -1);

    // bass figures, indexed by how many left cores are up. Third value is the
    // accent: downbeats lean, off-beats sit back — flat velocity is a doorbell.
    const BASS = [
      [],
      [[0, 0, 1.25]],
      [[0, 0, 1.3], [8, 1, 1.1], [14, 0, 0.85]],
      [[0, 0, 1.3], [3, 2, 0.85], [6, 1, 1.05], [10, 0, 1.0], [11, 2, 0.8], [14, 1, 0.95]]
    ];

    let nextT = T.next(0.25), lastLoops = [0, 0, 0, 0, 0, 0], arpI = 0;
    // THE POCKET: summons-gated dry kit. Ranked hats (beats first, then
    // offbeat 8ths, then 16ths) so mid-energy is a syncopated groove, not
    // a slower metronome; kick/stick from the one-and funk shape.
    const HATRANK = [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15];
    const KICKP = [1, 0, 0, 0, 0, 0, 0, 0.75, 0, 0, 0.9, 0, 0, 0, 0, 0];
    let jam = 0, barPar = 0;
    // the resting breath's own clock — unquantized, spacing rolled per breath
    let nextBreath = A.t() + 3 + P.rand() * 4;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        // the grid belongs to a present player; an empty room never ticks
        const gridOn = s.pres > 0.15;
        const shared = s.shared || 0;
        const conv = clamp(shared / 5);
        // the pitch everything converges on: the long tone's own note
        const tgt = s.cores[3].deg + s.cores[3].loops;
        const spdAcc = c => 1 + clamp(c.spd / 6) * 0.4;

        /* ---- the floor: undulating at rest, ridge-following in play ---- */
        const ridgeAmt = clamp(s.ridges / 900);
        // two incommensurate slow LFOs — the idle floor is never dead and
        // never periodic (31s and 21s beat against each other for minutes)
        const und = 0.5 + 0.3 * Math.sin(now * TAU * 0.031) + 0.2 * Math.sin(now * TAU * 0.047 + 1.7);
        const pf = s.pres;
        A.set(ng.gain,
          (0.0035 + 0.003 * und + s.breathEnv * 0.004) * (1 - pf) + (0.004 + ridgeAmt * 0.012) * pf, 0.3);
        A.set(nf.frequency, (300 + und * 220) * (1 - pf) + (400 + ridgeAmt * 2000) * pf, 0.3);
        bed.forEach(b => { b.level(0.006 + s.pres * 0.004, 0.5); b.bright(220 + ridgeAmt * 400, 0.4); });

        /* ---- the resting breath: randomized swells, never a metronome -- */
        if (s.pres < 0.3) {
          if (now >= nextBreath) {
            const deep = P.rand() < 1 / 7;               // the rare walk-toward-it toll
            const f = H.chordTone(P.rand() < 0.3 ? 1 : 0, -1);
            const vol = (0.045 + P.rand() * 0.05) * (deep ? 1.5 : 1);
            const dur = 2.2 + P.rand() * 2.8;
            if (P.rand() < 0.45) {
              A.tone(f, { at: now + 0.05, vol, dur, attack: 0.8 + P.rand() * 1.2, type: 'triangle', rev: 0.5, role: 'bass' });
            } else {
              A.bassNote(f, { at: now + 0.05, vol, dur, rev: 0.25 });
            }
            if (deep) A.bell(H.chordTone(0, 0), { at: now + 0.12, vol: 0.05, dur: 6, pan: 0, rev: 0.85 });
            s.breathEnv = deep ? 1 : 0.45 + P.rand() * 0.3;
            nextBreath = now + 6 + P.rand() * 9;
          }
        } else {
          // playing pushes the breath away so it can't fire the moment hands drop
          nextBreath = Math.max(nextBreath, now + 5);
        }

        /* ---- THE POCKET: the drummer answers the master code ----------- */
        const sumA = (typeof SUMMON !== 'undefined' && SUMMON.active) ? 1 : 0;
        const sumC = (typeof SUMMON !== 'undefined') ? SUMMON.charge : 0;
        // fade in ~1s, out ~3s -- the groove breathes with the latch, it
        // never starts or stops (the Rain gate law)
        jam += (sumA - jam) * Math.min(1, dt * (sumA > jam ? 1.2 : 0.35));
        // THE LOOP SEAT (V14): pad 55 struck once at the first summons,
        // held all scene; perc CC74 does every fade
        if (typeof MOut !== 'undefined' && sumA && !s._loopHeld && MOut.wants()) {
          s._loopHeld = true;
          const barLen = T.beat * 4;
          const nextBar = T.t0 + Math.ceil((now - T.t0) / barLen) * barLen;
          MOut.evNote('perc', 196.0, 0.22, nextBar, 3600);
        }
        // window energy: floored at 0.3 so the pocket holds for jamming,
        // riding how much band is up above that
        const pockG = jam * (0.3 + 0.7 * clamp((s.nL + s.nR) / 5));
        if (typeof MOut !== 'undefined') MOut.expr('perc', Math.max(pockG, sumC * 0.4));

        /* ---- the grid: bass on the left, leads on the right ----------- */
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 24) {
          const st = ((Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;

          // LEFT HAND — the floor. More cores up, busier line.
          if (gridOn) {
            const fig = BASS[Math.min(3, s.nL)];
            for (const [step, coreI, acc] of fig) {
              if (step !== st) continue;
              const c = s.cores[coreI];
              if (!c || c.w < 0.8) continue;
              const dur = s.nL > 2 ? 0.5 : s.nL > 1 ? 0.9 : 2.4;
              A.bassNote(bassToneOf(coreI), {
                at: nextT, vol: (0.1 + clamp(c.w / 5) * 0.06) * acc * spdAcc(c) * gate, dur
              });
            }
          }

          // RIGHT HAND — the front line. Each core is a different player.
          const c4 = s.cores[4];
          if (gridOn && c4 && c4.w > 0.8 && st % 2 === 0) {
            // density is EARNED: quarters at low reach, eighths near full
            const depth = clamp((c4.w - 0.8) / (s.wMax - 0.8));
            if (depth > 0.45 || st % 4 === 0) {
              arpI++;
              const off = [0, 2, 4, 2, 5, 3][arpI % 6];
              const own = c4.deg + c4.loops + off;
              // shared rings pull the arp onto the long tone's pitch — the
              // convergence the card promises, audible instead of 2 cents
              const deg = Math.round(own + (tgt - own) * conv * 0.8);
              const acc = st === 0 ? 1.3 : st % 4 === 0 ? 1.1 : 0.82;
              A.pluck2(H.chordTone(deg, 0), {
                at: nextT, vol: (0.024 + depth * 0.028) * acc * gate,
                dur: 0.55, pan: 0.6, rev: 0.45, del: 0.2, midi: false
              });
            }
          }
          const c5 = s.cores[5];
          if (gridOn && c5 && c5.w > 0.8 && (st === 6 || st === 13)) {
            const own = c5.deg + c5.loops + 4;
            const deg = Math.round(own + (tgt - own) * conv * 0.7);
            const acc = (st === 6 ? 1 : 0.8) * spdAcc(c5);
            A.bell(H.chordTone(deg, 1), {
              at: nextT, vol: (0.02 + clamp(c5.w / 5) * 0.016) * acc * gate, dur: 2.4, pan: 0.25, rev: 0.75
            });
          }
          // THE POCKET: bone-dry, swung scene-side, ranked. Nothing plays
          // below jam ~0.05; the charge telegraphs as beat ticks.
          if (st === 0) barPar = 1 - barPar;
          const sw = (st % 2 === 1) ? T.beat * 0.025 : 0;   // ~10% swing on odd 16ths
          if (jam > 0.05) {
            if (KICKP[st]) A.kick(nextT + sw, (0.11 + 0.09 * KICKP[st]) * pockG);
            if (st === 4 || st === 12) {
              A.hit({ at: nextT, vol: 0.085 * pockG, dur: 0.09, freq: 900, q: 1.3 });
            }
            if (st === 15 && barPar && pockG > 0.45) {
              A.hit({ at: nextT + sw, vol: 0.03 * pockG, dur: 0.06, freq: 900, q: 1.3 });  // the ghost stick
            }
            const nHats = Math.floor(3 + pockG * 11);
            if (HATRANK.indexOf(st) < nHats) {
              A.hat(nextT + sw, { vol: (st % 4 === 0 ? 0.022 : st % 2 === 0 ? 0.014 : 0.009) * pockG });
            }
            if ((st === 2 || st === 6 || st === 10 || st === 14) && pockG > 0.55) {
              A.hit({ at: nextT + sw, vol: 0.012 * pockG, dur: 0.04, freq: 7000, q: 0.8, midi: false });
              MOut.evDrum(51, 0.16 * pockG, nextT + sw);
            }
            if (st === 14 && !barPar && pockG > 0.5) A.hat(nextT, { open: true, vol: 0.014 * pockG });
          } else if (sumC > 0.25 && st % 4 === 0) {
            // the charge telegraphs: quiet hat ticks growing under the wiggle
            A.hat(nextT, { vol: 0.006 + sumC * 0.012 });
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        /* ---- ARP SYNTH: one held note, struck ON the grid, re-struck on
           every bar line (Chladni V28's grid lock) so Science Class's own
           pattern re-pins to the downbeat; the pitch is the arpeggio's
           convergence note, so rings audibly pull the patch's line ----- */
        if (typeof MOut !== 'undefined') {
          const c4a = s.cores[4];
          const arpOn = gridOn && c4a && c4a.w > 0.8;
          if (arpOn) {
            const depth = clamp((c4a.w - 0.8) / (s.wMax - 0.8));
            if (!s._arpT || s._arpT < now - 0.1) s._arpT = T.next(1);
            let ag = 0;
            while (s._arpT < now + 0.15 && ag++ < 4) {
              const tOn = s._arpT;
              const bpos = (tOn - T.t0) / T.beat;
              const tEnd = T.t0 + Math.ceil((bpos + 0.5) / 4) * 4 * T.beat;
              const own = c4a.deg + c4a.loops;
              const deg = Math.round(own + (tgt - own) * conv * 0.8);
              MOut.evNote('arp', H.chordTone(deg, 0), (0.07 + 0.06 * depth) * gate, tOn, Math.max(0.4, tEnd - tOn - 0.06));
              s._arpT = tEnd;
            }
            MOut.expr('arp', 0.25 + 0.75 * depth);
          } else { s._arpT = 0; MOut.expr('arp', 0.1); }
        }

        /* ---- the long lead re-sings whenever its loops change ---------- */
        const c3 = s.cores[3];
        if (!gridOn) lastLoops[3] = c3.loops;   // silent bookkeeping at rest
        if (gridOn && c3 && c3.w > 0.8 && c3.loops !== lastLoops[3]) {
          lastLoops[3] = c3.loops;
          const f = toneOf(3, 0);
          const at = T.next(0.5);
          A.tone(f, {
            at, vol: (0.05 + clamp(c3.w / 5) * 0.025) * spdAcc(c3) * gate,
            dur: 3.4, attack: 0.5, type: 'triangle',
            pan: 0.5, rev: 0.6, del: 0.1, role: 'lead'
          });
          // the doubling is the same voice — it must not become its own note
          const sp = MOut.suspend; MOut.suspend = true;
          A.tone(f * 1.005, { at: at + 0.03, vol: 0.03 * gate, dur: 3, attack: 0.6, type: 'triangle', pan: 0.2, rev: 0.7 });
          MOut.suspend = sp;
        }

        /* ---- accents: a loop gained or lost, on its own side ----------- */
        // drained even at rest (the queue must not stockpile), but only a
        // present player SOUNDS them — an empty room's topology drift is
        // bookkeeping, not a performance
        let ev, k = 0;
        while ((ev = s.evq.shift()) && k < 4) {
          k++;
          if (!gridOn) continue;
          const at = T.next(0.25);
          if (ev.core < 0) {
            // rings that enclose more than one core
            if (ev.up) {
              A.bell(H.chordTone(ev.n + 2, 1), { at, vol: 0.045 * gate, dur: 3.2, pan: 0, rev: 0.78 });
              A.bassNote(H.chordTone(0, -1), { at, vol: 0.07 * gate, dur: 2.2 });
            } else {
              A.pluck2(H.chordTone(ev.n, 0), { at, vol: 0.025 * gate, dur: 1.1, pan: 0, rev: 0.5, role: 'lead' });
            }
            continue;
          }
          const c = s.cores[ev.core];
          if (c.side === 0) {
            // the floor moved
            A.bassNote(bassToneOf(ev.core), { at, vol: (ev.up ? 0.09 : 0.05) * spdAcc(c) * gate, dur: ev.up ? 1.4 : 0.7 });
          } else if (ev.core !== 3) {
            A.pluck2(toneOf(ev.core, 0), {
              at, vol: (ev.up ? 0.045 : 0.026) * spdAcc(c) * gate, dur: ev.up ? 1.1 : 0.6,
              pan: (c.hx * 2 - 1) * 0.8, rev: 0.5, del: 0.18, role: 'lead'
            });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('bass', clamp(s.nL / 3));
          MOut.expr('lead', clamp(s.nR / 3));
          MOut.expr('pad', clamp(s.ridges / 900));
        }
      },
      stop() { v.kill(); }
    };
  }
});
