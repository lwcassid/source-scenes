/* ============================================================
   PIECES 28–29 — MATH MADE AUDIBLE
   ============================================================ */

/* ---------- SRC-28 · CHLADNI COURT ---------- */
reg({
  id: 'SRC-28', ver: 2, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
  music: { bpm: 58, root: 50, mode: 'lydian', prog: [0, 4], chordBars: 4 },
  fx: { bloom: 0.5, edge: true },
  tags: ['CYMATICS', 'MODE LOCK', 'SOUND MADE VISIBLE', 'RESONANCE REWARD'],
  desc: 'The oldest trick for seeing sound: sand on a vibrating plate gathers along the silent lines. Here the source itself is the driver at the center of the plate, and each hand tunes one of the two mode numbers. Between integers the sand seethes, homeless; land both hands on whole numbers and the plate LOCKS — a resonant mode snaps into geometry, the sand rushes to its nodal lines, and the two modes sound as an interval. Cymatics is the thesis of the whole installation: this is light behaving the way sound does.',
  interact: 'L = mode number n (1–7), R = mode number m. The play is the hunt for resonance: integers are stable patterns, everything between is beautiful chaos. Ratio matters like the harmonograph — n:m = 2:3 locks a fifth in both geometry and sound. Slow hands near a lock let you watch the pattern crystallize grain by grain.',
  sound: 'Two plate tones — the actual modes: sine-heavy voices at the chord tones indexed by n and m, gain swelling with resonance (Ableton: glass/bowl patches, one per hand-side). Sand: granular rushing noise, gain from total grain motion — a real shhhh as patterns break and reform (granular engine, tiny grains, band-passed 2–6k). On lock: one soft tam-tam-ish bloom, then let the interval ring. On break: the noise swells as the geometry dissolves.',
  init(P) {
    const n = Math.round(3400 * Math.min(2.6, areaScale(P)));
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
    // sand physics: descend the energy |χ|², jitter when unresolved
    const PI = Math.PI;
    const chi = (x, y) => Math.cos(nM * PI * x) * Math.cos(mM * PI * y) - Math.cos(mM * PI * x) * Math.cos(nM * PI * y);
    const eps = 0.004, k = dt * (0.07 + s.res * 0.3);
    const jit = dt * (0.04 * (1 - s.res) + 0.005);
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
      if (x < 0.02) x = 0.02; if (x > 0.98) x = 0.98;
      if (y < 0.02) y = 0.02; if (y > 0.98) y = 0.98;
      g2[i * 2] = x; g2[i * 2 + 1] = y;
    }
    s.motion += (motion / s.n / Math.max(dt, 1e-4) - s.motion) * Math.min(1, dt * 4);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,4,5,0.55)'; g.fillRect(0, 0, w, h);
    const m = Math.min(w, h) * 0.92;
    const x0 = (w - m) / 2, y0 = (h - m) / 2;
    // lock shockwave
    const sinceLock = t - s.lockT;
    if (sinceLock < 1.2) {
      const k = sinceLock / 1.2;
      g.strokeStyle = `rgba(255,235,180,${(1 - k) * 0.7})`;
      g.lineWidth = 3 * (1 - k);
      g.beginPath(); g.arc(w / 2, h / 2, k * m * 0.75, 0, TAU); g.stroke();
    }
    // plate — blazes at resonance, vibrates
    const rj = s.res > 0.6 ? Math.sin(t * 40) * s.res * 1.5 : 0;
    g.strokeStyle = `rgba(${200 + s.res * 55},${185 + s.res * 55},${140 + s.res * 60},${0.18 + s.res * 0.7})`;
    g.lineWidth = 1.5 + s.res * 2.5;
    if (s.res > 0.5) { g.shadowColor = '#ffe9b0'; g.shadowBlur = 18 * s.res; }
    g.strokeRect(x0 + rj, y0, m, m);
    g.shadowBlur = 0;
    // sand — dim scattered dust when searching, blazing gold geometry at resonance
    const warm = s.res;
    const g2 = s.grains;
    const sz = 1.8 + warm * 1.6;
    g.fillStyle = `rgba(235,${210 + warm * 30},${150 + warm * 80},${0.32 + warm * 0.65})`;
    for (let i = 0; i < s.n; i++) {
      g.fillRect(x0 + g2[i * 2] * m + rj, y0 + g2[i * 2 + 1] * m, sz, sz);
    }
    // resonance glow pass: the pattern itself ignites
    if (warm > 0.45) {
      g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(255,240,190,${(warm - 0.45) * 0.35})`;
      for (let i = 0; i < s.n; i += 2) {
        g.fillRect(x0 + g2[i * 2] * m + rj - 1, y0 + g2[i * 2 + 1] * m - 1, sz + 2, sz + 2);
      }
      g.globalCompositeOperation = 'source-over';
    }
    // the driver — the source at plate center
    const cx = w / 2, cy = h / 2;
    const pulse = 0.5 + 0.5 * Math.sin(t * (2 + s.res * 6));
    g.fillStyle = `rgba(10,10,12,1)`;
    g.beginPath(); g.arc(cx, cy, m * 0.035, 0, TAU); g.fill();
    g.strokeStyle = `rgba(200,255,180,${0.25 + pulse * 0.4 * (0.4 + s.res)})`;
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, m * 0.035 + 3 + pulse * 3, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(200,190,150,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('N ' + s.nM.toFixed(2) + '  M ' + s.mM.toFixed(2) + (s.res > 0.6 ? '  ◆ MODE LOCK ' + Math.round(s.nM) + ':' + Math.round(s.mM) : ''), 10, h - 10);
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
        // THE HUNT IS AUDIBLE: off-integer detunes the plate tones — they beat
        // and wander, then glide into pure tune as you approach the mode
        const fn = (s.nM || 1) - ni, fm = (s.mM || 1) - mi;
        A.set(oN.frequency, H.chordTone(ni, 0) * (1 + fn * 0.08), 0.1);
        A.set(oM.frequency, H.chordTone(mi, 0) * (1 + fm * 0.08), 0.1);
        // searching = quiet + uneasy; resonance = the plate SINGS
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

/* ---------- SRC-29 · ACCRETION ---------- */
reg({
  id: 'SRC-29', title: 'Accretion', tech: 'DIFFUSION-LIMITED AGGREGATION',
  music: { bpm: 62, root: 47, mode: 'dorian', prog: [0, 3, 5, 4], chordBars: 4 },
  fx: { bloom: 0.55, edge: true },
  tags: ['CRYSTAL GROWTH', 'GROWS FROM THE SOURCE', 'STICKINESS', 'RADIAL MUSIC'],
  desc: 'A crystal growing outward from the sphere, one wandering particle at a time — real diffusion-limited aggregation, the same mathematics that shapes frost, coral, and lightning. Every particle that finds the structure and sticks rings a note, and pitch follows radius, so you can hear the crystal reaching outward, higher and higher, toward the edges of the volume. When it touches the boundary it lets go — dissolves like breath off glass — and begins again. It grows all day and never grows the same way twice.',
  interact: 'L = stickiness: high builds dense compact coral; low lets particles slide deep into the crevices before catching, growing wild dendritic lightning. R = feed — how thickly the void snows particles into the walk. Patience piece: your choices now shape branches that won\'t exist for another minute.',
  sound: 'Sticking events: tiny crystalline plinks (music box / celesta), pitch mapped to radius — the outward reach is a slow rising scale spread over minutes, pan follows the branch\'s angle. Growth rate → shimmer send. The dissolve: one low gong and a long reversed-reverb wash as the whole structure fades (Ableton: freeze-verb burst). Bed: quiet dorian pad. Map CC74 on bells to crystal size so the room brightens as it grows.',
  init(P) {
    const W = 176, H = 110;
    P.state = {
      W, H, stuck: new Uint8Array(W * H), age: new Float32Array(W * H),
      walkers: [], maxR: 3, fade: 0, gen: 0, lastPlink: 0,
      oc: (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; })(),
      img: new ImageData(W, H), time: 0
    };
    P.state.og = P.state.oc.getContext('2d');
    const cx = W / 2, cy = H / 2;
    for (let a = 0; a < 12; a++) {
      const x = Math.round(cx + Math.cos(a / 12 * TAU) * 2), y = Math.round(cy + Math.sin(a / 12 * TAU) * 2);
      P.state.stuck[y * W + x] = 1;
    }
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, H, stuck, age } = s;
    s.time += dt;
    const cx = W / 2, cy = H / 2;
    const maxRad = Math.min(W, H) * 0.47;
    if (s.fade > 0) {
      s.fade -= dt * 0.3;
      if (s.fade <= 0) {
        stuck.fill(0); age.fill(0); s.maxR = 3; s.gen++; s.walkers.length = 0;
        for (let a = 0; a < 12; a++) {
          const x = Math.round(cx + Math.cos(a / 12 * TAU) * 2), y = Math.round(cy + Math.sin(a / 12 * TAU) * 2);
          stuck[y * W + x] = 1;
        }
      }
      return;
    }
    // feed walkers
    const target = Math.round(14 + inp.R * 100);
    while (s.walkers.length < target) {
      const a = P.rand() * TAU, r = Math.min(s.maxR + 7, maxRad + 4);
      s.walkers.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    const stickP = 0.06 + inp.L * 0.9;
    const steps = 14;
    for (const wk of s.walkers) {
      for (let k = 0; k < steps; k++) {
        // random walk with slight inward pull
        const toC = Math.atan2(cy - wk.y, cx - wk.x);
        const a = Math.random() * TAU * 0.86 + toC - TAU * 0.43;
        wk.x += Math.cos(a) * 1.1; wk.y += Math.sin(a) * 1.1;
        const ix = wk.x | 0, iy = wk.y | 0;
        if (ix < 1 || ix >= W - 1 || iy < 1 || iy >= H - 1) { wk.dead = true; break; }
        const i = iy * W + ix;
        if (stuck[i - 1] || stuck[i + 1] || stuck[i - W] || stuck[i + W]) {
          if (Math.random() < stickP) {
            stuck[i] = 1; age[i] = s.time;
            const r = Math.hypot(wk.x - cx, wk.y - cy);
            s.maxR = Math.max(s.maxR, r);
            wk.dead = true;
            if (t - s.lastPlink > 0.09) {
              s.lastPlink = t;
              const idx = Math.round((r / maxRad) * 10);
              const pan = (wk.x - cx) / (W / 2);
              P.ping(A => A.pluck2(H.chordTone(idx, 0), { at: A.q(), vol: 0.075, dur: 1.4, pan: clamp(pan, -1, 1) * 0.8, rev: 0.5, del: 0.12 }));
            }
            break;
          }
        }
      }
    }
    s.walkers = s.walkers.filter(wk => !wk.dead);
    if (s.maxR >= maxRad && s.fade <= 0) {
      s.fade = 1;
      P.ping(A => {
        A.tone(H.rootFreq(-2), { vol: 0.18, dur: 4, attack: 0.05, type: 'sine', rev: 0.6 });
        A.bell(H.chordTone(0, 1), { vol: 0.08, dur: 6, rev: 0.85 });
      });
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, H, stuck, age, img } = s;
    const d = img.data;
    const fadeK = s.fade > 0 ? s.fade : 1;
    for (let i = 0; i < W * H; i++) {
      if (!stuck[i]) { d[i * 4 + 3] = 255; d[i * 4] = 3; d[i * 4 + 1] = 4; d[i * 4 + 2] = 7; continue; }
      const a = clamp((s.time - age[i]) / 40);
      // new growth burns white-cyan, old settles to deep violet
      d[i * 4] = (40 + (1 - a) * 180) * fadeK + 3;
      d[i * 4 + 1] = (60 + (1 - a) * 190) * fadeK + 4;
      d[i * 4 + 2] = (120 + (1 - a) * 135) * fadeK + 7;
      d[i * 4 + 3] = 255;
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    // walkers as faint snow
    g.fillStyle = 'rgba(150,180,210,0.35)';
    for (const wk of s.walkers) {
      g.fillRect(wk.x / W * w, wk.y / H * h, 1.5, 1.5);
    }
    // the seed — the source
    const cx = w / 2, cy = h / 2;
    g.fillStyle = '#04050a';
    g.beginPath(); g.arc(cx, cy, Math.min(w, h) * 0.022, 0, TAU); g.fill();
    g.strokeStyle = `rgba(160,220,255,${0.3 + 0.3 * Math.sin(t * 2)})`;
    g.beginPath(); g.arc(cx, cy, Math.min(w, h) * 0.022 + 2, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(150,180,210,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('GEN ' + s.gen + '  REACH ' + Math.round((s.maxR / (Math.min(W, H) * 0.47)) * 100) + '%  WALKERS ' + s.walkers.length, 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.03, cutoff: 320 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2));
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.05);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => A.set(sub.frequency, H.rootFreq(-2), 1.8));
    v.fadeIn(1, 1.2);
    return {
      tick() {
        const s = P.state;
        const size = clamp(s.maxR / (Math.min(s.W, s.H) * 0.47));
        pads.forEach(p => p.bright(260 + size * 700, 0.5));
        MOut.expr('bells', size);
      },
      stop() { v.kill(); }
    };
  }
});
