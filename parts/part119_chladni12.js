/* ---------- SRC-28.12 · CHLADNI COURT V12 (the plate learns to ring) ---------- */
/* V11's harmony/lock layer kept whole; this version is the AUDIBLE redesign,
   testing the browser-first concepts:
   1. PLATE, NOT BEEP — each mode tone is a small modal stack (inharmonic
      partials that open with resonance), so the plate rings glassy.
   2. SEEKING IS BEATING — each tone carries a near-coincident partner whose
      offset is the fractional distance to the integer: far from a lock the
      plate throbs, near it the beats stretch out, the lock is stillness.
      You can tune the plate blindfolded; the sand and the throb are one.
   3. LOCK-HOPPING IS A MELODY — tone gains attack fast but RELEASE slow
      (~1.3s), so walking 2:3 → 3:4 → 2:5 phrases pure intervals instead of
      choking each one on departure.
   4. PRESENCE MANNERS — the whole voice ducks to ~30% for an empty room
      (V10/V11 played at full commitment all night). Silence is inventory.
   5. THE BED BREATHES with the pattern's own slow drift.
   Partials and beat partners live in a _noHold voice group: they are sound
   only, never their own MIDI notes — the mirror still holds just the two
   mode tones. Visuals byte-identical to V10. */
reg({
  id: 'SRC-28.12', family: 'SRC-28', ver: 12, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
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
  tags: ['CYMATICS', 'BEATING SEEK', 'PLATE PARTIALS', 'JUST INTERVALS', 'MIRRORED KALEIDOSCOPE'],
  desc: 'The oldest trick for seeing sound, and now the oldest trick for HEARING it too: the plate rings with glassy inharmonic partials instead of bare sines, and while you hunt, each mode tone beats against a near-twin — fast anxious throbbing far from a lock, long slow waves as you close in, dead stillness the moment the geometry lands. Tuning by ear and tuning by sand become the same act. Leave a lock and it releases like a struck bowl instead of choking, so walking ratio to ratio plays a phrase of pure intervals. The room\'s manners improved too: an empty court murmurs at a third of its played volume, and the whisper bed breathes with the pattern\'s own slow drift.',
  interact: 'L = mode number n (1–7), R = mode number m. The play is the hunt for resonance — and now you can hear the distance: the throb slows as you close on an integer and stops when the pattern locks. Ratio matters like the harmonograph: n:m = 2:3 locks a fifth in geometry and in pure intonation. Land decisively and the bloom hits harder; a ratio you have not found before rings fullest. Walk lock to lock and the released tones overlap into a phrase.',
  sound: 'Two plate tones as modal stacks — fundamental plus inharmonic partials (2.31x, 3.85x) that open with resonance: glass, not beep. Each fundamental carries a beat partner offset by the fractional distance to the integer (up to ~7Hz far out, ~0 at lock) — the seeking throb IS the interface. Fast attack, ~1.3s release on the tones so lock-hopping is melodic. Lock shimmer sings the JUST ratio of n:m; lock bloom rolls low-to-high with velocity from approach decisiveness, tam-tam on first discovery only. Whisper D sub, triangle pads breathing with the plate\'s drift, granular sand noise from grain motion (streams as sfx CC74). Everything gated to ~30% when nobody is there. Partials/partners are _noHold — MIDI stays clean: two mode tones on texture, blooms on bells, resonance on lead CC74.',
  init(P) {
    const n = Math.round(3800 * Math.min(2.6, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0, lockT: -9, found: {}, appr: 0, resPrev: 0, pres: 0, tNow: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.tNow = t;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 2 : 0.5));
    const nM = 1 + inp.L * 6, mM = 1 + inp.R * 6;
    s.nM = nM; s.mM = mM;
    const fn = Math.abs(nM - Math.round(nM)), fm = Math.abs(mM - Math.round(mM));
    const res = clamp(1 - (fn + fm) / 0.14);
    s.res += (res - s.res) * Math.min(1, dt * 3);
    const rise = Math.max(0, (s.res - s.resPrev) / Math.max(dt, 1e-4));
    s.appr += (rise - s.appr) * Math.min(1, dt * 6);
    s.resPrev = s.res;
    const locked = s.res > 0.6;
    if (locked && !s.wasLocked) {
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
    const eps = 0.004, k = dt * (0.05 + s.res * 0.15);
    const jit = dt * (0.05 * (1 - s.res) + 0.03);
    // continuous reseed: without this, grains fall into the deep nodal wells and
    // stay trapped, so the antinodes empty and the frame goes dark over ~30s.
    // Resprinkling a small fraction each frame keeps the field full and the
    // grain COUNT identical (they respawn, they don't leave).
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
    const v = A.voice();          // MIRRORED group: the two mode tones + pads + sub
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
    const subG = v.g(0.008);
    sub.connect(subG); subG.connect(v.group);
    const shO = v.osc('sine', 440), shF = v.osc('sine', 660);
    const shG = v.g(0.0001);
    shO.connect(shG); shF.connect(shG); shG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.8; shG.connect(s2); s2.connect(A.revIn); }
    v.fadeIn(1, 1.2); vx.fadeIn(1, 1.2);
    let lastGN = 0, lastGM = 0;
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
        // fast attack, slow release: leaving a lock rings out like a bowl
        const tgtN = (0.014 + r2 * 0.09) * gate, tgtM = tgtN;
        A.set(gN.gain, tgtN, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(bgN.gain, tgtN * 0.9, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(gM.gain, tgtM, tgtM >= lastGM ? 0.15 : 1.3);
        A.set(bgM.gain, tgtM * 0.9, tgtM >= lastGM ? 0.15 : 1.3);
        lastGN = tgtN; lastGM = tgtM;
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
        A.set(subG.gain, 0.008 * gate, 0.5);
        A.set(sg.gain, Math.min(0.09, (s.motion || 0) * 0.35) * (1 - s.res * 0.75) * (0.45 + 0.55 * gate), 0.15);
        MOut.expr('lead', s.res);
        MOut.expr('sfx', Math.min(1, (s.motion || 0) * 2.5));
      },
      stop() { vx.kill(); v.kill(); }
    };
  }
});
