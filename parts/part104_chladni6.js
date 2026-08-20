/* ---------- SRC-28.6 · CHLADNI COURT V6 ---------- */
/* Fills the projector's 16:10 frame as a mirrored kaleidoscopic grid. The
   plate is rendered once to an offscreen square tile of side w/3, then blitted
   into a 3-column x N-row grid with alternating reflections — three across
   (the frieze, unchanged from V4) and reflected into rows to fill the height,
   with the horizontal mirror seam on the frame's centre line. No letterbox,
   square (undistorted) tiles, and one grain pass instead of one-per-cell. */
reg({
  id: 'SRC-28.6', family: 'SRC-28', ver: 6, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
  music: { bpm: 58, root: 50, mode: 'lydian', prog: [0, 4], chordBars: 4 },
  fx: { bloom: 0.5, edge: true },
  tags: ['CYMATICS', 'MODE LOCK', 'SOUND MADE VISIBLE', 'MIRRORED KALEIDOSCOPE'],
  desc: 'The oldest trick for seeing sound: sand on a vibrating plate gathers along the silent lines. One plate, reflected across the wall into a mirrored kaleidoscope that fills the whole frame. Each hand tunes one of the two mode numbers. Between integers the sand seethes, homeless; land both hands on whole numbers and the plate LOCKS — a resonant mode snaps into geometry, the sand rushes to its nodal lines, the whole field brightens and the grains swell, and the two modes sound as an interval. Cymatics is the thesis of the whole installation: light behaving the way sound does.',
  interact: 'L = mode number n (1–7), R = mode number m. The play is the hunt for resonance: integers are stable patterns, everything between is beautiful chaos. Ratio matters like the harmonograph — n:m = 2:3 locks a fifth in both geometry and sound. Slow hands near a lock let you watch the pattern crystallize band by band. Left alone, the pattern drifts and breathes across the plate.',
  sound: 'Two plate tones — the actual modes: sine-heavy voices at the chord tones indexed by n and m, gain swelling with resonance (Ableton: glass/bowl patches, one per hand-side). Sand: granular rushing noise, gain from total grain motion — a real shhhh as patterns break and reform (granular engine, tiny grains, band-passed 2–6k). On lock: one soft tam-tam-ish bloom, then let the interval ring. On break: the noise swells as the geometry dissolves.',
  init(P) {
    const n = Math.round(3800 * Math.min(2.6, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0, lockT: -9 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const nM = 1 + inp.L * 6, mM = 1 + inp.R * 6;
    s.nM = nM; s.mM = mM;
    const fn = Math.abs(nM - Math.round(nM)), fm = Math.abs(mM - Math.round(mM));
    const res = clamp(1 - (fn + fm) / 0.14);
    s.res += (res - s.res) * Math.min(1, dt * 3);
    const locked = s.res > 0.6;
    if (locked && !s.wasLocked) {
      s.lockT = t;
      const ni = Math.round(nM), mi = Math.round(mM);
      P.ping(A => {
        A.bell(H.chordTone(ni, 0), { at: A.q(), vol: 0.14, dur: 5, rev: 0.75 });
        A.bell(H.chordTone(mi, 0), { at: A.q(), vol: 0.14, dur: 5, rev: 0.75, pan: 0.3 });
        A.bassNote(H.rootFreq(-2), { at: A.q(), vol: 0.2, dur: 2.5 });
        A.hit({ vol: 0.16, dur: 0.5, freq: 240, q: 0.6, type: 'lowpass' });
      });
    }
    s.wasLocked = locked;
    // slow phase drift: the pattern sweeps toward a corner and breathes back
    // to center. Small amplitude so it always fills the square.
    const dphx = 0.16 * Math.sin(t * 0.066), dphy = 0.16 * Math.sin(t * 0.051 + 1.3);
    const PI = Math.PI;
    const chi = (x, y) => {
      const X = x + dphx, Y = y + dphy;
      return Math.cos(nM * PI * X) * Math.cos(mM * PI * Y) - Math.cos(mM * PI * X) * Math.cos(nM * PI * Y);
    };
    // sand physics: descend the energy |χ|², jitter when unresolved. The jitter
    // FLOOR is raised so nodal lines keep thickness — bold bands, not razors.
    const eps = 0.004, k = dt * (0.06 + s.res * 0.22);
    const jit = dt * (0.05 * (1 - s.res) + 0.014);
    let motion = 0;
    const g2 = s.grains;
    for (let i = 0; i < s.n; i++) {
      let x = g2[i * 2], y = g2[i * 2 + 1];
      const c0 = chi(x, y);
      const gx = (Math.abs(chi(x + eps, y)) - Math.abs(c0)) / eps;
      const gy = (Math.abs(chi(x, y + eps)) - Math.abs(c0)) / eps;
      const dx = -gx * k + (Math.random() - 0.5) * jit;
      const dy = -gy * k + (Math.random() - 0.5) * jit;
      x += dx; y += dy;
      motion += Math.abs(dx) + Math.abs(dy);
      if (x < 0.015) x = 0.015; if (x > 0.985) x = 0.985;
      if (y < 0.015) y = 0.015; if (y > 0.985) y = 0.985;
      g2[i * 2] = x; g2[i * 2 + 1] = y;
    }
    s.motion += (motion / s.n / Math.max(dt, 1e-4) - s.motion) * Math.min(1, dt * 4);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const warm = s.res;
    // The tile is a square of side w/3 → three columns fill the width exactly.
    const m = Math.max(2, Math.round(w / 3));
    // offscreen square tile — the plate is drawn ONCE here, then mirror-blitted
    if (!s.tile || s.tile.width !== m) {
      s.tile = document.createElement('canvas');
      s.tile.width = m; s.tile.height = m;
      s.tg = s.tile.getContext('2d');
    }
    const tg = s.tg, g2 = s.grains;
    const rj = s.res > 0.6 ? Math.sin(t * 40) * s.res * 1.5 : 0;
    // fade the tile for faint grain trails
    tg.fillStyle = 'rgba(4,4,5,0.5)'; tg.fillRect(0, 0, m, m);
    // lock shockwave (baked in → rings burst from every cell together)
    const sinceLock = t - s.lockT;
    if (sinceLock < 1.2) {
      const kk = sinceLock / 1.2;
      tg.strokeStyle = `rgba(255,235,180,${(1 - kk) * 0.7})`;
      tg.lineWidth = 3 * (1 - kk);
      tg.beginPath(); tg.arc(m / 2, m / 2, kk * m * 0.75, 0, TAU); tg.stroke();
    }
    // sand — bold gold bands; on-lock swell (~1.5x), held warm not white
    const sz = Math.max(2.4, m * 0.0055) * (1 + warm * 0.5);
    tg.fillStyle = `rgba(235,${(200 + warm * 28) | 0},${(120 + warm * 55) | 0},${0.32 + warm * 0.5})`;
    for (let i = 0; i < s.n; i++) { tg.fillRect(g2[i * 2] * m + rj, g2[i * 2 + 1] * m, sz, sz); }
    // resonance glow pass: brightens (not enlarges) on lock
    if (warm > 0.45) {
      tg.globalCompositeOperation = 'lighter';
      tg.fillStyle = `rgba(255,235,180,${(warm - 0.45) * 0.22})`;
      for (let i = 0; i < s.n; i += 3) { tg.fillRect(g2[i * 2] * m + rj, g2[i * 2 + 1] * m, sz, sz); }
      tg.globalCompositeOperation = 'source-over';
    }
    // composite the mirrored grid: 3 columns across, reflected into enough rows
    // to fill the height, horizontal mirror seam centred on the frame.
    g.fillStyle = '#040405'; g.fillRect(0, 0, w, h);
    const rows = Math.max(1, Math.round(h / m));
    const yStart = (h - rows * m) / 2;
    for (let c = 0; c < 3; c++) {
      const xflip = (c !== 1);            // centre column = base, flanks mirrored
      for (let r = 0; r < rows; r++) {
        const yflip = (r % 2 === 1);      // reflect each successive row
        g.save();
        g.translate(c * m + (xflip ? m : 0), yStart + r * m + (yflip ? m : 0));
        g.scale(xflip ? -1 : 1, yflip ? -1 : 1);
        g.drawImage(s.tile, 0, 0);
        g.restore();
      }
    }
    g.fillStyle = 'rgba(200,190,150,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('N ' + (s.nM || 1).toFixed(2) + '  M ' + (s.mM || 1).toFixed(2) + (s.res > 0.6 ? '  ◆ MODE LOCK ' + Math.round(s.nM) + ':' + Math.round(s.mM) : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const oN = v.osc('sine', 220), oM = v.osc('sine', 330);
    const gN = v.g(0.0001), gM = v.g(0.0001);
    oN.connect(gN); gN.connect(v.group);
    oM.connect(gM); gM.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.7; gN.connect(s2); gM.connect(s2); s2.connect(A.revIn); }
    const sand = v.noise();
    const sf = v.filter('bandpass', 3800, 0.8);
    const sg = v.g(0);
    sand.connect(sf); sf.connect(sg); sg.connect(v.group);
    const pads = A.padVoices(v, 2, { type: 'triangle', gain: 0.025, cutoff: 300 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2));
    // resonance reward voices: octave + fifth shimmer, silent until locked
    const shO = v.osc('sine', 440), shF = v.osc('sine', 660);
    const shG = v.g(0.0001);
    shO.connect(shG); shF.connect(shG); shG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.8; shG.connect(s2); s2.connect(A.revIn); }
    v.fadeIn(1, 1.2);
    return {
      tick() {
        const s = P.state;
        const ni = Math.round(s.nM || 1), mi = Math.round(s.mM || 1);
        const fn = (s.nM || 1) - ni, fm = (s.mM || 1) - mi;
        A.set(oN.frequency, H.chordTone(ni, 0) * (1 + fn * 0.08), 0.1);
        A.set(oM.frequency, H.chordTone(mi, 0) * (1 + fm * 0.08), 0.1);
        const r2 = s.res * s.res;
        A.set(gN.gain, 0.018 + r2 * 0.11, 0.2);
        A.set(gM.gain, 0.018 + r2 * 0.11, 0.2);
        A.set(shO.frequency, H.chordTone(ni, 1), 0.2);
        A.set(shF.frequency, H.chordTone(ni + 2, 1), 0.25);
        A.set(shG.gain, r2 * 0.05, 0.4);
        pads.forEach(p => { p.level(0.012 + r2 * 0.045, 0.4); p.bright(260 + r2 * 1400, 0.4); });
        A.set(sg.gain, Math.min(0.09, (s.motion || 0) * 0.35) * (1 - s.res * 0.75), 0.15);
        MOut.expr('lead', s.res);
      },
      stop() { v.kill(); }
    };
  }
});
