/* ---------- SRC-28.20 · CHLADNI COURT V20 (silence punctuated · the fallen lines · kick-reactive) ---------- */
/* Lance's round on V19, five notes:
   1. IDLE IS SILENCE, PUNCTUATED - the wash was constant (still a drone).
      Now the sand-noise lives INSIDE the breath envelope only: nothing,
      then bass + sand wash swell together every while, then nothing. All
      pitched voices hard-zero without presence (tones, shimmer, mids).
   2. THE FALLEN LINES - leaving the plate re-sprinkles ~25% of grains
      (fresh sand dusted from above) while the rest hold the last
      pattern's ghost; idle erosion slowed 3x so the ghost flattens over
      minutes. Sleep = half-remembered geometry under fresh scatter.
   3. BASS IS STRUCTURAL - the whole physics is bass on a sub: lock bass
      up, sub reinforcement rises with presence. Present, not overdone.
   4. THE BREAK - kick/backbeat stay half-time (the space Lance likes)
      but 32nd ghost pushes on the hats give it the broken double-time
      skitter over the slow harmonic rate - breaks, not straight R&B.
   5. KICK-REACTIVE SAND - in beat mode the grains pulse with each kick
      and the field leans light purple: charging = blue, dancing = violet. */
reg({
  id: 'SRC-28.20', family: 'SRC-28', ver: 20, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
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
  tags: ['CYMATICS', 'SILENCE PUNCTUATED', 'THE FALLEN LINES', 'THE RAIL SECRET', 'KICK-REACTIVE SAND'],
  desc: 'Silence, punctuated. An idle court makes NO sound at all - then every while a low bass breath rolls in with a wash of moving sand riding it, and dies back to nothing. The picture sleeps the way a real plate does: the last lines fall, drift and flatten over minutes under a fresh dusting of scattered grains - half-remembered geometry, not a blank slate, not a diagram. Under hands the bass is structural (this instrument lives on a sub), and for those who know the rail secret: charge it blue, and the unlocked beat turns the field light violet, every kick pulsing through the grains. Broken hats skitter double-time over the half-time kick - a break with space in it.',
  interact: 'L = mode number n (1-7), R = mode number m. Integers pull like detents, narrowing as the numbers climb; the throb slows as you close and stops at the lock, bass and BING arriving together. First discovery of a ratio rings fullest. THE SECRET: hold either hand hard at its extreme for five full seconds - watch the sand bunch and go blue - and a beat unlocks for 45 seconds. Re-hold to keep it. Leave the court alone and it returns to drifting starfield sand and the occasional deep breath.',
  sound: 'Idle: true silence between breaths - the bass swell (sub + low pair) and the panning sand wash share one envelope, every 12-25s, and every pitched voice hard-zeros without presence. Play: modal plate tones with beat partners, JUST-ratio shimmer, lock bass at 0.075 and presence-risen sub - bass is structural, the plate physics on the big speaker. THE UNLOCK: half-time kick and cracked backbeat with 32nd ghost-hat pushes and a ghost kick - breaks over a slow harmonic rate; grains pulse with each kick, field goes light violet. MIDI: drums ch10, perc CC74 = charge/beat, tones on texture, blooms ch5, lead CC74 = resonance, sfx CC74 = sand.',
  init(P) {
    const n = Math.round(3800 * Math.min(2.6, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0, lockT: -9, found: {}, appr: 0, resPrev: 0, pres: 0, tNow: 0, teaseT: 6, teaseUntil: -9, tease: 0, surgeUntil: -9, charge: 0, beatUntil: -9, beatOn: false, unlockCol: 0, beatCol: 0, beatPulse: 0, wasAwake: false };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.tNow = t;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    // WAKE SURGE: hands arriving on a sleeping plate overdrive the rush —
    // the strewn sand snaps into its lines. Cooldown so play doesn't retrigger.
    if (live && s.pres < 0.35 && t > s.surgeUntil + 6) s.surgeUntil = t + 3.5;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 2 : 0.5));
    // THE RAIL SECRET: hold either hand at its extreme for 5s to charge -
    // the sand bunches and blues - then beats unlock for 45s. Re-hold to
    // relight. Not announced anywhere; masters know.
    const rail = live && (inp.L <= 0.02 || inp.L >= 0.98 || inp.R <= 0.02 || inp.R >= 0.98);
    if (rail && s.pres > 0.4) s.charge = Math.min(1, s.charge + dt / 5);
    else s.charge = Math.max(0, s.charge - dt / 1.5);
    if (s.charge >= 1) { s.beatUntil = t + 45; s.charge = 0; }
    s.beatOn = t < s.beatUntil;
    s.unlockCol += (s.charge - s.unlockCol) * Math.min(1, dt * 2);
    s.beatCol += ((s.beatOn ? 1 : 0) - s.beatCol) * Math.min(1, dt * 2);
    s.beatPulse = (s.beatPulse || 0) * Math.exp(-dt * 7);
    // MAGNETIC DETENTS: whole numbers pull. Inside a 0.14 window the raw
    // fraction eases cubically flat, so a hand can SIT on a resonance
    // mid-range — in the raw mapping the only exact integers were the rails
    // (inp 0 and 1), which is why V13 only BINGed corner-to-corner.
    // EARNED: the window narrows as the mode number climbs - low integers
    // catch a slow stranger, the fine patterns need a hand that knows.
    const detent = vv => {
      const r = Math.round(vv), f = vv - r;
      const w = Math.max(0.065, 0.115 - (r - 1) * 0.008);
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
    // THE FALLEN LINES: when the hands leave, dust ~25% of the sand fresh
    // from above - the rest keeps the ghost of the last pattern.
    if (s.pres > 0.4) s.wasAwake = true;
    if (s.wasAwake && s.pres < 0.25) {
      s.wasAwake = false;
      const g0 = s.grains;
      for (let i = 0; i < s.n; i++) {
        if (P.rand() < 0.35) { g0[i * 2] = P.rand(); g0[i * 2 + 1] = P.rand(); }
        else {
          // the survivors drift and flatten: one soft smudge kills the hard
          // edge instantly, leaving the memory of the line, not the line
          g0[i * 2] += (P.rand() - 0.5) * 0.045;
          g0[i * 2 + 1] += (P.rand() - 0.5) * 0.045;
        }
      }
    }
    // THE TEASE: rarer now — a sleeping plate hums maybe twice a minute,
    // draws the sand loosely toward a figure, and lets it fall again.
    // THE BREATH: at rest the plate inhales every 12-25s - a ~6s swell that
    // lifts the bed AND stirs the sand as one gesture, then lets both go.
    s.teaseT -= dt;
    let tease = 0;
    if (s.pres < 0.25) {
      if (s.teaseT <= 0) { s.teaseT = 12 + P.rand() * 13; s.teaseUntil = t + 6; }
      if (t < s.teaseUntil) tease = Math.sin(((s.teaseUntil - t) / 6) * Math.PI);
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
    // NO presence = NO pattern force at all: lines can never condense in
    // sleep. The tease stirs (jitter below), it does not gather.
    // dead zone: drive reaches ZERO while presence is still fading, so the
    // sleep smudge sticks instead of being re-condensed onto the old lines
    const drive = Math.max(0, (s.pres - 0.3) / 0.7) * surge * (1 + s.charge * 1.4);
    // A LITTLE STREAM: at rest a whisper-slow serpentine current carries the
    // grains gracefully around the frame (they wrap, so it circulates
    // forever) - the sleeping plate is still, but not dead.
    const curAmt = dt * 0.008 * (1 - s.pres);
    const curPh = t * 0.045;
    const eps = 0.004, k = dt * (0.05 + s.res * 0.15) * drive;
    // STILL SAND: jitter and the anti-trapping reseed both follow presence -
    // a dead plate's grains stop moving entirely (tease briefly stirs them).
    const jit = dt * ((0.05 * (1 - s.res) + 0.03) * (0.09 + 0.91 * s.pres) * (1 - s.charge * 0.6) + tease * 0.035);
    const reseed = dt * 0.2 * s.pres;
    let motion = 0;
    const g2 = s.grains;
    for (let i = 0; i < s.n; i++) {
      if (Math.random() < reseed) { g2[i * 2] = Math.random(); g2[i * 2 + 1] = Math.random(); continue; }
      let x = g2[i * 2], y = g2[i * 2 + 1];
      const c0 = chi(x, y);
      const gx = (Math.abs(chi(x + eps, y)) - Math.abs(c0)) / eps;
      const gy = (Math.abs(chi(x, y + eps)) - Math.abs(c0)) / eps;
      let dx = -gx * k + (Math.random() - 0.5) * jit;
      let dy = -gy * k + (Math.random() - 0.5) * jit;
      if (curAmt > 0) {
        const a = curPh + Math.sin(y * 4.2 + curPh) * 1.3;
        dx += Math.cos(a) * curAmt;
        dy += Math.sin(a) * curAmt * 0.55;
      }
      x += dx; y += dy;
      motion += Math.abs(dx) + Math.abs(dy);
      if (drive < 0.2) {
        // asleep: the stream circulates - grains wrap instead of piling up
        if (x < 0.01) x += 0.975; else if (x > 0.985) x -= 0.975;
        if (y < 0.01) y += 0.975; else if (y > 0.985) y -= 0.975;
      } else {
        if (x < 0.015) x = 0.015; if (x > 0.985) x = 0.985;
        if (y < 0.015) y = 0.015; if (y > 0.985) y = 0.985;
      }
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
    const sz = Math.max(2.2, m * 0.0036) * (1 + warm * 0.4 + (s.beatPulse || 0) * 0.3);
    const uc = s.unlockCol || 0, bc = s.beatCol || 0, kp = s.beatPulse || 0;
    // gold -> blue while charging, then -> light violet in beat mode
    let cr = 240 - 130 * uc, cg = (205 + warm * 25) - 20 * uc, cb = (130 + warm * 55) + (255 - (130 + warm * 55)) * uc;
    cr += (205 - cr) * bc * 0.85; cg += (170 - cg) * bc * 0.85; cb += (255 - cb) * bc * 0.85;
    tg.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${Math.min(1, 0.58 + warm * 0.32 + kp * 0.14)})`;
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
    g.fillText('N ' + (s.nM || 1).toFixed(2) + '  M ' + (s.mM || 1).toFixed(2)
      + (s.res > 0.6 ? '  ◆ MODE LOCK ' + Math.round(s.nM) + ':' + Math.round(s.mM) : '')
      + (s.beatOn ? '  ◈ BEAT ' + Math.max(0, Math.ceil(s.beatUntil - t)) + 's'
                  : (s.charge > 0.05 ? '  ◈ ' + Math.round(s.charge * 100) + '%' : '')), 10, h - 10);
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
    sand.connect(sf); sf.connect(sg);
    let sandPan = null;
    if (A.ctx.createStereoPanner) { sandPan = A.ctx.createStereoPanner(); sg.connect(sandPan); sandPan.connect(v.group); }
    else sg.connect(v.group);
    // THE BED, SPLIT BY REGISTER: the low anchor keeps the weight on real
    // speakers; the mid trio carries the ambient color where ears (and
    // laptops) actually are. V15 had everything at octave -1 under a 300Hz
    // lowpass - playing, inaudible.
    const bedLo = A.padVoices(v, 2, { type: 'triangle', gain: 0.02, cutoff: 300 });
    const bedMid = A.padVoices(v, 3, { type: 'triangle', gain: 0.03, cutoff: 800, q: 0.7 });
    const placeBed = glide => { A.leadToChord(bedLo, -1, glide); A.leadToChord(bedMid, 0, glide); };
    placeBed(0.05);
    H.onChord(() => placeBed(2));
    const sub = v.osc('sine', H.rootFreq(-1));
    const subG = v.g(0.012);
    sub.connect(subG); subG.connect(v.group);
    // second harmonic so the root reads on small drivers too
    const sub2 = v.osc('sine', H.rootFreq(0));
    const sub2G = v.g(0.007);
    sub2.connect(sub2G); sub2G.connect(v.group);
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
    // the unlocked break: 16ths at 58bpm read as 8ths at the 116 feel —
    // kick / cracked backbeat / ghost hats, broken not four-on-the-floor
    const KICKS = [1, 0, 0, 0, 0, 0, 0, 0.8, 0, 0, 1, 0, 0, 0.55, 0, 0];
    const HATS = [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    const PUSH = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0]; // 32nd ghost pushes
    let beatNextT = 0, lastPulseSt = -1;
    return {
      tick() {
        const s = P.state;
        const pres = s.pres || 0;
        const gate = 0.3 + 0.7 * pres;
        const ni = Math.round(s.nM || 1), mi = Math.round(s.mM || 1);
        const fn = (s.nM || 1) - ni, fm = (s.mM || 1) - mi;
        const fNt = H.chordTone(ni, 0) * (1 + fn * 0.03);
        const fMt = H.chordTone(mi, 0) * (1 + fm * 0.03);
        A.set(oN.frequency, fNt, 0.1);
        A.set(oM.frequency, fMt, 0.1);
        A.set(bN.frequency, fNt + Math.max(0.05, Math.min(7, Math.abs(fn) * 14)), 0.1);
        A.set(bM.frequency, fMt + Math.max(0.05, Math.min(7, Math.abs(fm) * 14)), 0.1);
        const r2 = s.res * s.res;
        // pitched voices exist ONLY under hands — zero floor, nothing to grate
        const tgtN = (0.015 * pres + r2 * 0.09) * gate, tgtM = tgtN;
        A.set(gN.gain, tgtN, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(bgN.gain, tgtN * 0.9, tgtN >= lastGN ? 0.15 : 1.3);
        A.set(gM.gain, tgtM, tgtM >= lastGM ? 0.15 : 1.3);
        A.set(bgM.gain, tgtM * 0.9, tgtM >= lastGM ? 0.15 : 1.3);
        lastGN = tgtN; lastGM = tgtM;
        A.set(bass.frequency, H.chordTone(Math.min(ni, mi), -1), 0.15);
        const tgtB = r2 * 0.075 * gate;
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
        A.set(shG.gain, r2 * 0.05 * gate * pres, 0.4);
        const breath = 0.82 + 0.18 * Math.sin((s.tNow || 0) * 0.066);
        // THE SLEEPING BED BREATHES: at rest it sits at embers and swells with
        // the tease (the same envelope that stirs the sand); under hands it
        // holds constant full presence - steady BECAUSE you are there.
        const amb = pres + (1 - pres) * (0.08 + 0.92 * (s.tease || 0));
        // the idle breath is a BASS event — low frequencies carry across the
        // playa and pull people in; the mid trio only lives under hands
        bedMid.forEach(p => { p.level((0.019 + r2 * 0.03) * breath * amb * (0.15 + 0.85 * pres), 0.6); p.bright(500 + r2 * 1200, 0.4); });
        bedLo.forEach(p => { p.level((0.013 + r2 * 0.03) * breath * amb, 0.6); p.bright(260 + r2 * 900, 0.4); });
        // bass is structural: the sub rises with presence — the physics of the
        // plate lives on the big speaker (present, not overdone)
        A.set(subG.gain, (0.022 + 0.012 * pres + r2 * 0.014) * amb, 0.6);
        A.set(sub2G.gain, (0.011 + 0.006 * pres + r2 * 0.007) * amb, 0.6);
        // STARFIELD: at rest the sand itself is the voice — a soft wash
        // drifting in stereo with the stream
        // silence, punctuated: the sand wash exists only inside the breath —
        // between breaths the idle court makes NO sound at all
        const wash = (1 - pres) * (s.tease || 0) * 0.02;
        A.set(sg.gain, wash + Math.min(0.09, (s.motion || 0) * 0.35) * (1 - s.res * 0.75) * (0.45 + 0.55 * gate), 0.15);
        if (sandPan) A.set(sandPan.pan, Math.sin((s.tNow || 0) * 0.05) * 0.6, 0.3);
        A.set(sf.frequency, 3800 + (s.charge || 0) * 1600, 0.3);
        // THE UNLOCKED BEAT: runs while the window lasts, fades out over its
        // final 4s, ducks if the player walks away. Drums auto-mirror ch10.
        if (s.beatOn && T.running) {
          const rem = (s.beatUntil || 0) - (s.tNow || 0);
          const fade = Math.max(0.15, Math.min(1, rem / 4)) * gate;
          if (!beatNextT || beatNextT < A.t() - 0.1) beatNextT = T.next(0.25);
          const bh = A.t() + 0.15;
          let guard = 0;
          while (beatNextT < bh && guard++ < 24) {
            const st = ((Math.round((beatNextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;
            if (KICKS[st]) {
              A.kick(beatNextT, (0.14 + 0.16 * KICKS[st]) * fade);
              A.bassNote(H.chordTone(0, -1), { at: beatNextT, vol: 0.08 * fade, dur: 0.3 });
            }
            if (st === 4 || st === 12) A.hit({ at: beatNextT, vol: 0.12 * fade, dur: 0.11, freq: 1900, q: 1.1 });
            if (HATS[st]) A.hat(beatNextT, { vol: (st % 4 === 2 ? 0.02 : 0.012) * fade });
            // the skitter: 32nd ghost pushes make it a BREAK over the slow
            // harmonic rate instead of straight R&B
            if (PUSH[st]) A.hat(beatNextT + T.beat * 0.125, { vol: 0.008 * fade });
            if (st === 9) A.kick(beatNextT + T.beat * 0.125, 0.07 * fade);
            beatNextT += T.beat * 0.25;
          }
          // kick-reactive sand: flag the pulse as each kick step arrives
          const nowSt = ((Math.floor((A.t() - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;
          if (nowSt !== lastPulseSt) { lastPulseSt = nowSt; if (KICKS[nowSt]) s.beatPulse = 1; }
        } else beatNextT = 0;
        MOut.expr('lead', s.res);
        MOut.expr('perc', s.beatOn ? 1 : (s.charge || 0));
        MOut.expr('sfx', Math.min(1, (s.motion || 0) * 2.5));
      },
      stop() { vx.kill(); v.kill(); }
    };
  }
});
