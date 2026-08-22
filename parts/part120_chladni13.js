/* ---------- SRC-28.13 · CHLADNI COURT V13 (bass at the lock, sleep on the plate) ---------- */
/* Lance's feedback round on V12:
   1. BASS — a real bass voice swelling with resonance, tuned to the LOWER
      of the two locked modes an octave down: fullness arrives exactly at
      the lock, where it matters. Sub pedal lifted a notch.
   2. SLEEP — when nobody is there the plate is OFF, physics-honest: the
      drive pulling sand to the nodal lines winds down, so the last played
      pattern slowly loosens and disperses like sand on a dead plate. Every
      ~15-25s the plate HUMS for a moment — the sand tightens loosely
      toward a pattern with a faint swell of tone, then lets go: the tease.
      Ghost hands steer where the tease gathers but can no longer make the
      scene perform — resonance is presence-scaled, so lock payoffs (bells,
      blooms, full gathers) simply don't happen for an empty room. */
reg({
  id: 'SRC-28.13', family: 'SRC-28', ver: 13, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
  music: {
    bpm: 58, root: 50, mode: 'lydian', chordBars: 4,
    chords: [
      [0, 7, 16, 21, 26],    // D · A · F♯ · B · E
      [0, 11, 16, 18, 26],   // D · C♯ · F♯ · G♯ · E — the lydian light
      [0, 12, 19, 23, 26],   // D · D · A · C♯ · E
      [0, 7, 14, 16, 23]     // D · A · E · F♯ · C♯
    ],
    chordNames: ['D6/9', 'Dmaj9♯11', 'A/D', 'Dmaj9']
  },
  fx: { bloom: 0.22, edge: true },
  tags: ['CYMATICS', 'BEATING SEEK', 'BASS AT THE LOCK', 'THE PLATE SLEEPS', 'MIRRORED KALEIDOSCOPE'],
  desc: 'V12\'s ringing plate, with Lance\'s round applied. A bass voice now swells in under every lock — tuned to the lower of the two modes, an octave down — so landing a ratio has real weight, and the sub floor sits a little higher throughout. And the court finally sleeps: leave it and the drive holding the sand to its silent lines lets go, the last pattern loosening into scattered grains like sand on a plate that has been switched off. Every so often the plate hums to itself — the grains draw loosely toward a figure, a soft tone swells, and it releases — a tease of what your hands could do. Walk up and it wakes instantly; nothing rings its bells but a person.',
  interact: 'L = mode number n (1–7), R = mode number m. The play is the hunt for resonance — hear the distance: the throb slows as you close on an integer and stops when the pattern locks, and the bass arrives with it. Ratio matters like the harmonograph: n:m = 2:3 locks a fifth in geometry and in pure intonation. Land decisively and the bloom hits harder; a ratio you have not found before rings fullest. Left alone, the sand disperses and the plate only murmurs — the occasional gathering hum is an invitation, not a performance.',
  sound: 'Two plate tones as modal stacks (inharmonic partials opening with resonance) with beat partners that throb at the fractional distance to the integer — stillness at lock. NEW: a lowpassed triangle bass an octave under the lower locked mode, gain riding resonance squared with a slow release, and the D sub lifted to sit under everything. Lock shimmer sings the JUST ratio of n:m; lock bloom rolls low-to-high, velocity from approach decisiveness, tam-tam on first discovery — and none of it fires without a person present. Idle: resonance is presence-scaled so the tones fall to a murmur, the sand noise loosens, and the tease is a faint swell only. Partials/partners are _noHold: MIDI stays two mode tones on texture, bass and blooms on their channels, resonance on lead CC74, sand on sfx CC74.',
  init(P) {
    const n = Math.round(3800 * Math.min(2.6, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0, lockT: -9, found: {}, appr: 0, resPrev: 0, pres: 0, tNow: 0, teaseT: 6, teaseUntil: -9, tease: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.tNow = t;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 2 : 0.5));
    const nM = 1 + inp.L * 6, mM = 1 + inp.R * 6;
    s.nM = nM; s.mM = mM;
    const fn = Math.abs(nM - Math.round(nM)), fm = Math.abs(mM - Math.round(mM));
    // PRESENCE-SCALED RESONANCE: ghost hands can steer, but only a person can
    // resonate — idle res tops out at 0.2, far under the 0.6 lock threshold,
    // which silently disables locks, blooms and full gathers for an empty room.
    const res = clamp(1 - (fn + fm) / 0.14) * (0.2 + 0.8 * s.pres);
    s.res += (res - s.res) * Math.min(1, dt * 3);
    const rise = Math.max(0, (s.res - s.resPrev) / Math.max(dt, 1e-4));
    s.appr += (rise - s.appr) * Math.min(1, dt * 6);
    s.resPrev = s.res;
    const locked = s.res > 0.6;
    if (locked && !s.wasLocked && s.pres > 0.2) {
      s.lockT = t;
      const ni = Math.round(nM), mi = Math.round(mM);
      const key = ni + ':' + mi;
      const novel = !s.found[key];
      s.found[key] = true;
      const gate = 0.35 + 0.65 * s.pres;
      const vel = (0.55 + 0.45 * clamp(s.appr / 2.5)) * (novel ? 1 : 0.55) * gate;
      P.ping(A => {
        const t0 = A.q();
        A.bassNote(H.rootFreq(-2), { at: t0, vol: 0.1 + 0.1 * vel, dur: 2.5 });
        A.bell(H.chordTone(Math.min(ni, mi), 0), { at: t0 + 0.07, vol: 0.06 + 0.11 * vel, dur: 5, rev: 0.75 });
        A.bell(H.chordTone(Math.max(ni, mi), 0), { at: t0 + 0.15, vol: 0.05 + 0.1 * vel, dur: 5, rev: 0.75, pan: 0.3 });
        if (novel) A.hit({ vol: 0.16 * gate, dur: 0.5, freq: 240, q: 0.6, type: 'lowpass' });
      });
    }
    s.wasLocked = locked;
    // THE TEASE: on a sleeping plate, a periodic hum — the drive lifts for a
    // couple of seconds, the sand draws loosely toward a figure, and lets go.
    s.teaseT -= dt;
    let tease = 0;
    if (s.pres < 0.25) {
      if (s.teaseT <= 0) { s.teaseT = 15 + P.rand() * 10; s.teaseUntil = t + 2.8; }
      if (t < s.teaseUntil) tease = Math.sin(((s.teaseUntil - t) / 2.8) * Math.PI);
    }
    s.tease = tease;
    // slow phase drift: the pattern sweeps toward a corner and breathes back
    // to center. Small amplitude so it always fills the square.
    const dphx = 0.16 * Math.sin(t * 0.066), dphy = 0.16 * Math.sin(t * 0.051 + 1.3);
    const PI = Math.PI;
    const chi = (x, y) => {
      const X = x + dphx, Y = y + dphy;
      return Math.cos(nM * PI * X) * Math.cos(mM * PI * Y) - Math.cos(mM * PI * X) * Math.cos(nM * PI * Y);
    };
    // sand physics: descend the energy |χ|², jitter when unresolved — but the
    // DRIVE is presence-scaled: a dead plate stops holding its pattern and the
    // grains loosen into scatter, exactly like sand on a switched-off plate.
    const drive = Math.max(0.12 + 0.88 * s.pres, tease * 0.55);
    const eps = 0.004, k = dt * (0.05 + s.res * 0.15) * drive;
    const jit = dt * ((0.05 * (1 - s.res) + 0.03) * (1 + (1 - s.pres) * 0.6));
    // continuous reseed: without this, grains fall into the deep nodal wells and
    // stay trapped, so the antinodes empty and the frame goes dark over ~30s.
    const reseed = dt * 0.2;
    let motion = 0;
    const g2 = s.grains;
    for (let i = 0; i < s.n; i++) {
      if (Math.random() < reseed) { g2[i * 2] = Math.random(); g2[i * 2 + 1] = Math.random(); continue; }
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
    // The tile is a square of side = frame HEIGHT → two squares fill top-to-
    // bottom and meet at the centre, bleeding off the outer left/right edges.
    const m = Math.max(2, Math.round(h));
    // offscreen square tile — the plate is drawn ONCE here, then mirror-blitted
    if (!s.tile || s.tile.width !== m) {
      s.tile = document.createElement('canvas');
      s.tile.width = m; s.tile.height = m;
      s.tg = s.tile.getContext('2d');
    }
    const tg = s.tg, g2 = s.grains;
    const rj = s.res > 0.6 ? Math.sin(t * 40) * s.res * 1.5 : 0;
    // FULL clear each frame — no fade-trail, so every grain is a crisp square at
    // its current position instead of a smeared streak of where it has been.
    tg.fillStyle = '#040405'; tg.fillRect(0, 0, m, m);
    tg.imageSmoothingEnabled = false;
    // lock shockwave (baked in → rings burst from every cell together)
    const sinceLock = t - s.lockT;
    if (sinceLock < 1.2) {
      const kk = sinceLock / 1.2;
      tg.strokeStyle = `rgba(255,235,180,${(1 - kk) * 0.7})`;
      tg.lineWidth = 3 * (1 - kk);
      tg.beginPath(); tg.arc(m / 2, m / 2, kk * m * 0.75, 0, TAU); tg.stroke();
    }
    // sand — crisp, fairly opaque gold grains (sharp, not glowy); slight on-lock
    // swell. Drawn on integer pixels so each grain is a clean square.
    const sz = Math.max(2.2, m * 0.0036) * (1 + warm * 0.4);
    tg.fillStyle = `rgba(240,${(205 + warm * 25) | 0},${(130 + warm * 55) | 0},${0.58 + warm * 0.32})`;
    for (let i = 0; i < s.n; i++) { tg.fillRect((g2[i * 2] * m + rj) | 0, (g2[i * 2 + 1] * m) | 0, sz, sz); }
    // composite TWO full-height squares meeting at the frame centre, the left
    // one mirrored so the centre seam is a clean reflection axis.
    g.fillStyle = '#040405'; g.fillRect(0, 0, w, h);
    g.imageSmoothingEnabled = false;      // pixel-crisp mirror blits, no resample
    const startX = Math.round((w - 2 * m) / 2);   // centre the pair → equal bleed
    for (let c = 0; c < 2; c++) {
      const xflip = (c === 0);            // left square mirrored, right = base
      g.save();
      g.translate(startX + c * m + (xflip ? m : 0), 0);
      g.scale(xflip ? -1 : 1, 1);
      g.drawImage(s.tile, 0, 0);
      g.restore();
    }
    g.fillStyle = 'rgba(200,190,150,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('N ' + (s.nM || 1).toFixed(2) + '  M ' + (s.mM || 1).toFixed(2) + (s.res > 0.6 ? '  ◆ MODE LOCK ' + Math.round(s.nM) + ':' + Math.round(s.mM) : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();          // MIRRORED group: mode tones + bass + pads + sub
    const vx = A.voice();         // partials + beat partners: sound only,
    vx._noHold = true;            // never their own MIDI notes
    const oN = v.osc('sine', 220), oM = v.osc('sine', 330);
    const gN = v.g(0.0001), gM = v.g(0.0001);
    oN.connect(gN); gN.connect(v.group);
    oM.connect(gM); gM.connect(v.group);
    // the seeking throb: a near-twin per tone, offset by distance-to-integer
    const bN = vx.osc('sine', 220), bM = vx.osc('sine', 330);
    const bgN = vx.g(0.0001), bgM = vx.g(0.0001);
    bN.connect(bgN); bgN.connect(vx.group);
    bM.connect(bgM); bgM.connect(vx.group);
    // plate partials — inharmonic, opening with resonance: glass, not beep
    const PR = [2.31, 3.85], PG = [0.32, 0.12];
    const parts = [];
    [0, 1].forEach(side => PR.forEach((r, i) => {
      const o = vx.osc('sine', 220 * r);
      const g = vx.g(0.0001);
      o.connect(g); g.connect(vx.group);
      parts.push({ o, g, side, r, gi: PG[i] });
    }));
    if (A.revIn) {
      const s2 = A.ctx.createGain(); s2.gain.value = 0.7;
      gN.connect(s2); gM.connect(s2); bgN.connect(s2); bgM.connect(s2);
      s2.connect(A.revIn);
    }
    const sand = v.noise();
    const sf = v.filter('bandpass', 3800, 0.8);
    const sg = v.g(0);
    sand.connect(sf); sf.connect(sg); sg.connect(v.group);
    const pads = A.padVoices(v, 2, { type: 'triangle', gain: 0.025, cutoff: 300 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2));
    const sub = v.osc('sine', H.rootFreq(-1));
    const subG = v.g(0.01);
    sub.connect(subG); subG.connect(v.group);
    // THE LOCK'S BASS — an octave under the lower mode, arriving with resonance
    const bass = v.osc('triangle', 110);
    const bassF = v.filter('lowpass', 300, 0.7);
    const bassG = v.g(0.0001);
    bass.connect(bassF); bassF.connect(bassG); bassG.connect(v.group);
    const shO = v.osc('sine', 440), shF = v.osc('sine', 660);
    const shG = v.g(0.0001);
    shO.connect(shG); shF.connect(shG); shG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.8; shG.connect(s2); s2.connect(A.revIn); }
    v.fadeIn(1, 1.2); vx.fadeIn(1, 1.2);
    let lastGN = 0, lastGM = 0, lastGB = 0;
    return {
      tick() {
        const s = P.state;
        const gate = 0.3 + 0.7 * (s.pres || 0);
        const ni = Math.round(s.nM || 1), mi = Math.round(s.mM || 1);
        const fn = (s.nM || 1) - ni, fm = (s.mM || 1) - mi;
        // pitch stays nearly on the ladder — the SEEKING signal is the beat
        const fNt = H.chordTone(ni, 0) * (1 + fn * 0.03);
        const fMt = H.chordTone(mi, 0) * (1 + fm * 0.03);
        A.set(oN.frequency, fNt, 0.1);
        A.set(oM.frequency, fMt, 0.1);
        // beat rate from fractional distance: ~7Hz far out, stillness at lock
        A.set(bN.frequency, fNt + Math.max(0.05, Math.min(7, Math.abs(fn) * 14)), 0.1);
        A.set(bM.frequency, fMt + Math.max(0.05, Math.min(7, Math.abs(fm) * 14)), 0.1);
        const r2 = s.res * s.res;
        // fast attack, slow release: leaving a lock rings out like a bowl.
        // The tease adds a faint swell on a sleeping plate.
        const tgtN = (0.014 + r2 * 0.09) * gate + (s.tease || 0) * 0.01, tgtM = tgtN;
        A.set(gN.gain, tgtN, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(bgN.gain, tgtN * 0.9, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(gM.gain, tgtM, tgtM >= lastGM ? 0.15 : 1.3);
        A.set(bgM.gain, tgtM * 0.9, tgtM >= lastGM ? 0.15 : 1.3);
        lastGN = tgtN; lastGM = tgtM;
        // the bass under the lock: lower mode, an octave down, resonance-ridden
        A.set(bass.frequency, H.chordTone(Math.min(ni, mi), -1), 0.15);
        const tgtB = r2 * 0.055 * gate;
        A.set(bassG.gain, tgtB, tgtB >= lastGB ? 0.2 : 1.5);
        lastGB = tgtB;
        // the stack opens with resonance — lock = the plate's full spectrum
        for (const p of parts) {
          A.set(p.o.frequency, (p.side ? fMt : fNt) * p.r, 0.12);
          A.set(p.g.gain, tgtN * p.gi * (0.3 + 0.7 * s.res), 0.3);
        }
        let ratio = mi / Math.max(1, ni);
        while (ratio > 2) ratio /= 2;
        while (ratio < 1) ratio *= 2;
        const shBase = H.chordTone(ni, 1);
        A.set(shO.frequency, shBase, 0.2);
        A.set(shF.frequency, shBase * ratio, 0.25);
        A.set(shG.gain, r2 * 0.05 * gate, 0.4);
        // the bed breathes with the pattern's own slow drift
        const breath = 0.82 + 0.18 * Math.sin((s.tNow || 0) * 0.066);
        pads.forEach(p => { p.level((0.012 + r2 * 0.045) * breath * (0.5 + 0.5 * gate), 0.4); p.bright(260 + r2 * 1400, 0.4); });
        A.set(subG.gain, (0.01 + r2 * 0.012) * gate, 0.5);
        A.set(sg.gain, Math.min(0.09, (s.motion || 0) * 0.35) * (1 - s.res * 0.75) * (0.45 + 0.55 * gate), 0.15);
        MOut.expr('lead', s.res);
        MOut.expr('sfx', Math.min(1, (s.motion || 0) * 2.5));
      },
      stop() { vx.kill(); v.kill(); }
    };
  }
});
