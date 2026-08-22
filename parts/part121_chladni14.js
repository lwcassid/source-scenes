/* ---------- SRC-28.14 · CHLADNI COURT V14 (detents + true sleep + wake surge) ---------- */
/* Lance's second round on the court:
   1. MAGNETIC DETENTS — the V13 geometry made mid-range locks nearly
      impossible: a lock needed ~0.5% hand-travel precision, so the only
      reliable integers were the RAILS (inp 0 and 1), and the BINGs only
      happened corner-to-corner (or by parking one hand on a rail to hand
      the whole tolerance to the other). Now integers PULL: inside a 0.14
      detent the mapping eases cubically flat, so a slow hand slides into
      resonance and SITS there, anywhere in the range. Every pair BINGs.
   2. TRUE SLEEP — V13 kept a 12% drive floor, so resting sand still
      congregated. Floor is now 2%: at rest the grains random-walk apart
      into genuinely strewn scatter. Teases are rarer (~25-40s).
   3. WAKE SURGE — hands arriving on a sleeping plate overdrive the sand
      rush for ~3.5s: strewn sand SNAPS into the nodal lines. The plate
      switching on is the opening payoff. */
reg({
  id: 'SRC-28.14', family: 'SRC-28', ver: 14, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
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
  tags: ['CYMATICS', 'MAGNETIC DETENTS', 'EVERY PAIR BINGS', 'WAKE SURGE', 'TRUE SLEEP'],
  desc: 'The court, made landable. Whole numbers are magnetic now: slide a slow hand and feel it caught by each resonance in turn — sit anywhere in the range, not just at the ends of your reach, and every locked pair rings its BING. Asleep, the plate finally goes properly still: the sand drifts apart into strewn scatter, teased back toward a figure only once in a long while. And the reason to walk up is the first second: hands arriving on a sleeping plate overdrive the rush, and all that scattered sand SNAPS into its silent lines — the plate switching on is the show.',
  interact: 'L = mode number n (1–7), R = mode number m. Integers pull like detents — sweep slowly and you feel each resonance catch; rest inside one and the pattern holds. The throb slows as you approach and goes still when it lands, the bass and the BING arriving together. Every pair locks now, anywhere in the range: 2:3 is a fifth, 3:4 a fourth, 2:5 a major third — walk them and play the intervals. Land decisively for a harder bloom; first discovery of a ratio rings fullest. Leave it alone and the sand falls apart into scatter — first touch snaps it back.',
  sound: 'Two plate tones as modal stacks (inharmonic partials opening with resonance) with beat partners that throb at the distance to the nearest integer — stillness inside the detent. A lowpassed triangle bass an octave under the lower locked mode swells with resonance. Lock shimmer sings the JUST ratio of n:m; lock bloom rolls low-to-high, velocity from approach decisiveness, tam-tam on first discovery — none of it for an empty room. Asleep: drive floor ~2% so the sand truly disperses, tones fall to a murmur, tease every 25-40s. Waking: a ~3.5s drive surge slams the scatter into lines while the tones swell back. MIDI: two mode tones on texture, bass ch3, blooms ch5, resonance on lead CC74, sand motion on sfx CC74; partials/partners are _noHold.',
  init(P) {
    const n = Math.round(3800 * Math.min(2.6, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0, lockT: -9, found: {}, appr: 0, resPrev: 0, pres: 0, tNow: 0, teaseT: 6, teaseUntil: -9, tease: 0, surgeUntil: -9 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.tNow = t;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    // WAKE SURGE: hands arriving on a sleeping plate overdrive the rush —
    // the strewn sand snaps into its lines. Cooldown so play doesn't retrigger.
    if (live && s.pres < 0.35 && t > s.surgeUntil + 6) s.surgeUntil = t + 3.5;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 2 : 0.5));
    // MAGNETIC DETENTS: whole numbers pull. Inside a 0.14 window the raw
    // fraction eases cubically flat, so a hand can SIT on a resonance
    // mid-range — in the raw mapping the only exact integers were the rails
    // (inp 0 and 1), which is why V13 only BINGed corner-to-corner.
    const detent = vv => {
      const r = Math.round(vv), f = vv - r, w = 0.14;
      if (Math.abs(f) >= w) return vv;
      const u = f / w;
      return r + u * u * u * w;   // flat at the integer, continuous at the edge
    };
    const nM = detent(1 + inp.L * 6), mM = detent(1 + inp.R * 6);
    s.nM = nM; s.mM = mM;
    const fn = Math.abs(nM - Math.round(nM)), fm = Math.abs(mM - Math.round(mM));
    // presence-scaled: ghost hands steer, only a person resonates
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
    // THE TEASE: rarer now — a sleeping plate hums maybe twice a minute,
    // draws the sand loosely toward a figure, and lets it fall again.
    s.teaseT -= dt;
    let tease = 0;
    if (s.pres < 0.25) {
      if (s.teaseT <= 0) { s.teaseT = 25 + P.rand() * 15; s.teaseUntil = t + 2.4; }
      if (t < s.teaseUntil) tease = Math.sin(((s.teaseUntil - t) / 2.4) * Math.PI);
    }
    s.tease = tease;
    // slow phase drift: the pattern sweeps toward a corner and breathes back
    const dphx = 0.16 * Math.sin(t * 0.066), dphy = 0.16 * Math.sin(t * 0.051 + 1.3);
    const PI = Math.PI;
    const chi = (x, y) => {
      const X = x + dphx, Y = y + dphy;
      return Math.cos(nM * PI * X) * Math.cos(mM * PI * Y) - Math.cos(mM * PI * X) * Math.cos(nM * PI * Y);
    };
    // sand physics, presence-driven: a dead plate holds NOTHING (2% floor —
    // the grains random-walk apart into strewn scatter), a waking plate
    // overdrives the rush for a few seconds.
    const surge = t < s.surgeUntil ? 1.7 : 1;
    const drive = Math.max(0.02 + 0.98 * s.pres, tease * 0.5) * surge;
    const eps = 0.004, k = dt * (0.05 + s.res * 0.15) * drive;
    const jit = dt * ((0.05 * (1 - s.res) + 0.03) * (1 + (1 - s.pres) * 0.8));
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
    const m = Math.max(2, Math.round(h));
    if (!s.tile || s.tile.width !== m) {
      s.tile = document.createElement('canvas');
      s.tile.width = m; s.tile.height = m;
      s.tg = s.tile.getContext('2d');
    }
    const tg = s.tg, g2 = s.grains;
    const rj = s.res > 0.6 ? Math.sin(t * 40) * s.res * 1.5 : 0;
    tg.fillStyle = '#040405'; tg.fillRect(0, 0, m, m);
    tg.imageSmoothingEnabled = false;
    const sinceLock = t - s.lockT;
    if (sinceLock < 1.2) {
      const kk = sinceLock / 1.2;
      tg.strokeStyle = `rgba(255,235,180,${(1 - kk) * 0.7})`;
      tg.lineWidth = 3 * (1 - kk);
      tg.beginPath(); tg.arc(m / 2, m / 2, kk * m * 0.75, 0, TAU); tg.stroke();
    }
    const sz = Math.max(2.2, m * 0.0036) * (1 + warm * 0.4);
    tg.fillStyle = `rgba(240,${(205 + warm * 25) | 0},${(130 + warm * 55) | 0},${0.58 + warm * 0.32})`;
    for (let i = 0; i < s.n; i++) { tg.fillRect((g2[i * 2] * m + rj) | 0, (g2[i * 2 + 1] * m) | 0, sz, sz); }
    g.fillStyle = '#040405'; g.fillRect(0, 0, w, h);
    g.imageSmoothingEnabled = false;
    const startX = Math.round((w - 2 * m) / 2);
    for (let c = 0; c < 2; c++) {
      const xflip = (c === 0);
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
    const bN = vx.osc('sine', 220), bM = vx.osc('sine', 330);
    const bgN = vx.g(0.0001), bgM = vx.g(0.0001);
    bN.connect(bgN); bgN.connect(vx.group);
    bM.connect(bgM); bgM.connect(vx.group);
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
        const fNt = H.chordTone(ni, 0) * (1 + fn * 0.03);
        const fMt = H.chordTone(mi, 0) * (1 + fm * 0.03);
        A.set(oN.frequency, fNt, 0.1);
        A.set(oM.frequency, fMt, 0.1);
        A.set(bN.frequency, fNt + Math.max(0.05, Math.min(7, Math.abs(fn) * 14)), 0.1);
        A.set(bM.frequency, fMt + Math.max(0.05, Math.min(7, Math.abs(fm) * 14)), 0.1);
        const r2 = s.res * s.res;
        const tgtN = (0.014 + r2 * 0.09) * gate + (s.tease || 0) * 0.01, tgtM = tgtN;
        A.set(gN.gain, tgtN, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(bgN.gain, tgtN * 0.9, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(gM.gain, tgtM, tgtM >= lastGM ? 0.15 : 1.3);
        A.set(bgM.gain, tgtM * 0.9, tgtM >= lastGM ? 0.15 : 1.3);
        lastGN = tgtN; lastGM = tgtM;
        A.set(bass.frequency, H.chordTone(Math.min(ni, mi), -1), 0.15);
        const tgtB = r2 * 0.055 * gate;
        A.set(bassG.gain, tgtB, tgtB >= lastGB ? 0.2 : 1.5);
        lastGB = tgtB;
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
