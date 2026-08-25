/* ---------- SRC-28.26 · CHLADNI COURT V26 (the bells learn restraint)
   Lance on V25 with Dreamies newly racked: "the bells are way too much
   when the beat drops" -- the scene has ALWAYS rung two bells per lock,
   inaudible until his rack called the bluff. V26: lock bells are MUTED
   while the beat window runs (a drop needs no bings), rate-limited to
   one ring per 2.5s otherwise, and repeat-locks whisper -- only a NOVEL
   discovery gets the full bell. The ARP drops to ONE held root ("even
   one note can sound good") -- two tones through a stacked-fifth patch
   was four pitches of mud. Bells CC74 now streams (resonance + charge,
   floored) so a future cutoff mapping breathes. (V25 notes below.) --- */
/* ---------- SRC-28.25 · CHLADNI COURT V25 (let the instrument do the work)
   Lance's audition on the finished rack, three fixes: (1) the ARP was
   machine-gunning single 8th notes at Science Class -- a patch with its
   own arpeggiator ("hold chords and let the arp do the work" -- also
   already our own notebook rule). The beat window now HOLDS two chord
   tones (root + color), re-struck on chord changes, and the patch
   arpeggiates; CC74 still rides the gate. (2) the idle breath bass sat
   at D0, under the patch's range ("too low or something") -- breaths and
   the lock bass move up an octave. (3) the idle finally has its tease in
   Live: each breath swells a soft pad note on the Jup-8 (Deep Blue
   Voices), so resting = pad breath + bass + the 1-in-7 Dreamies toll.
   (V24 notes below.) ---------------------------------------------------- */
/* ---------- SRC-28.24 · CHLADNI COURT V24 (Lance's first rig-walk round)
   Three verdicts from the first audition on the real rack:
   (1) SHRINE drowned the room -- the five standing pad voices of the low
   floor now stay BROWSER-SIDE (padVoices midi:false, new engine opt);
   the pad channel is for intentional notes, not washes. (2) The 14
   Omnisphere is now ARP SYNTH (arp role moved to ch14, bells parked at
   15 until the toll patch exists) and Lance's law: the ARP is RHYTHMIC
   -- here it plays a gated 8th-note chord-tone line ONLY while the
   unlocked beat runs, on the grid, entering and dying with the drums.
   (3) resting sand was silting into a horizontal band: the idle stream
   was compressible (dy depended on y), so grains converged onto its
   slow-moving attractor lines; the current is now a shear-cell field
   (dx from y, dy from x -- divergence-free, can never pile up) plus a
   whisper of idle evaporation. (V23 notes below.) ----
   Lance's audition round (the first with the real rack): the HandPan --
   THE instrument this scene was cast around -- was getting only the
   engine's one low mirror note; "every detent catch is a mallet strike"
   lived in rig.json but no code sent it. V23 scores it: each hand's mode
   number CATCHING an integer now strikes a plate tone on the texture
   channel (browser bell + ch9 HandPan via one A.bell role call), velocity
   from approach speed, hysteresis + a 120ms floor so a hovering hand
   can't machine-gun the edge. The full LOCK adds the second tone a beat
   of a heart later. Lance's Omnisphere pan patch self-rolls on held
   notes -- short strikes ride that as a natural grace-note roll.
   (V22 notes below.) ---------------------------------------------------- */
/* Lance on V21: going to rest, the sand snapped once and then froze - the
   old pattern's clumps sat there forever as little squares instead of
   dissipating, and the change itself was abrupt. V21's FALLEN LINES was a
   one-shot: 35% of the sand teleported fresh, the survivors got a single
   hard smudge, then rest-mode jitter (~zero) locked whatever was left.
   V22 = THE SETTLING: nothing snaps. When the hands leave, the plate simply
   stops holding, and the lines let go grain by grain - each grain owns a
   fixed heading (golden-angle by index) and exhales outward on a slowly
   decaying envelope (~22s), with a whisper of evaporation (gentle
   re-scatter) underneath - so the pattern melts into the drifting
   starfield over about half a minute, continuous the whole way down.
   The lure (irregular breaths, gusts, the toll) is unchanged. */
reg({
  id: 'SRC-28.26', family: 'SRC-28', ver: 26, title: 'Chladni Court V26', tech: 'STANDING WAVES / SAND ON A PLATE',
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
  tags: ['CYMATICS', 'THE LURE', 'THE SETTLING', 'THE RAIL SECRET', 'KICK-REACTIVE SAND'],
  desc: 'The court becomes a lure. At rest it murmurs low - a floor that rises and sinks on its own slow tides, never twice the same - and breathes at its own irregular will: some breaths are pure bass, most roll a visible gust of sand across the frame with the wash of sound, and once in a while a single deep bell tolls into long reverb, the sound you walk toward from three camps away. When the hands leave nothing snaps: the plate stops holding and the last-played lines let go grain by grain, exhaling apart into the drifting starfield over half a minute. Under hands the bass is structural, the detents are earned, and the rail secret still waits - charge it blue, dance it violet, every kick pulsing through the grains.',
  interact: 'L = mode number n (1-7), R = mode number m. Integers pull like detents, narrowing as the numbers climb; the throb slows as you close and stops at the lock, bass and BING arriving together. First discovery of a ratio rings fullest. THE SECRET: hold either hand hard at its extreme for five full seconds - watch the sand bunch and go blue - and a beat unlocks for 45 seconds. Re-hold to keep it. Leave the court alone and it returns to drifting starfield sand and the occasional deep breath.',
  sound: 'Idle = the lure: an undulating low floor (bedLo + subs on two incommensurate LFOs) under irregular breaths - length 4-9s, spacing 10-32s, random depth and skew - voiced as bass-only, bass + panning sand wash with a matching visible gust, or (1 in 7) a deep lure toll (low chord-tone bell, rev 0.88) over a soft root. No high register at rest, ever. Play: modal plate tones, beat partners, JUST shimmer, structural bass; every detent catch is a mallet strike on the texture channel (the HandPan lives there). Unlock: half-time break with 32nd skitter, kick-reactive violet sand, and the ARP holding ONE root for Science Class\'s own arpeggiator; lock bells mute during the window, rate-limited outside it. MIDI unchanged.',
  init(P) {
    const n = Math.round(3800 * Math.min(2.6, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0, lockT: -9, found: {}, appr: 0, resPrev: 0, pres: 0, tNow: 0, teaseT: 6, teaseUntil: -9, tease: 0, surgeUntil: -9, charge: 0, beatUntil: -9, beatOn: false, unlockCol: 0, beatCol: 0, beatPulse: 0, wasAwake: false, settle: 0, brLen: 5, brDepth: 1, brSkew: 0.4, gustA: 1, gustDir: 0, tollQ: false, tolled: false, inWinL: false, inWinR: false, panT: -9 };
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
    // THE PAN GETS ITS PART (V23): a hand CATCHING a detent is a mallet
    // strike on the plate -- browser bell + HandPan ch9 in one role call.
    // Hysteresis (enter at 0.8w, leave at 1.15w) + a 120ms floor keep a
    // hand hovering on the window's edge from machine-gunning.
    const wN = Math.max(0.065, 0.115 - (Math.round(nM) - 1) * 0.008);
    const wM = Math.max(0.065, 0.115 - (Math.round(mM) - 1) * 0.008);
    for (const [hand, f, w, k] of [['L', fn, wN, Math.round(nM)], ['R', fm, wM, Math.round(mM)]]) {
      const key = 'inWin' + hand;
      const inside = s[key] ? f < w * 1.15 : f < w * 0.8;
      if (inside && !s[key] && s.pres > 0.2 && t - s.panT > 0.12) {
        s.panT = t;
        const vel = 0.35 + 0.65 * clamp(s.appr / 2.5);
        P.ping(A => A.bell(H.chordTone(k, -1), {
          role: 'texture', at: A.q(), vol: 0.05 + 0.09 * vel * (0.35 + 0.65 * s.pres),
          dur: 2.2, rev: 0.55, pan: hand === 'L' ? -0.3 : 0.3
        }));
      }
      s[key] = inside;
    }
    const locked = s.res > 0.6;
    if (locked && !s.wasLocked && s.pres > 0.2) {
      s.lockT = t;
      const ni = Math.round(nM), mi = Math.round(mM);
      const key = ni + ':' + mi;
      const novel = !s.found[key];
      s.found[key] = true;
      const gate = 0.35 + 0.65 * s.pres;
      const vel = (0.55 + 0.45 * clamp(s.appr / 2.5)) * (novel ? 1 : 0.55) * gate;
      // THE BELLS LEARN RESTRAINT (V26): silent while the beat runs (a drop
      // needs no bings), one ring per 2.5s otherwise, repeats whisper --
      // only a NOVEL discovery gets the full bell. Dreamies made this layer
      // audible for the first time; it was scored against silence.
      const ringBells = !s.beatOn && t - (s.bellT || -9) > 2.5;
      if (ringBells) s.bellT = t;
      const bellV = vel * (novel ? 1 : 0.45);
      P.ping(A => {
        const t0 = A.q();
        A.bassNote(H.rootFreq(-1), { at: t0, vol: 0.1 + 0.1 * vel, dur: 2.5 });
        if (ringBells) {
          A.bell(H.chordTone(Math.min(ni, mi), 0), { at: t0 + 0.07, vol: 0.05 + 0.08 * bellV, dur: 5, rev: 0.75 });
          A.bell(H.chordTone(Math.max(ni, mi), 0), { at: t0 + 0.15, vol: 0.04 + 0.07 * bellV, dur: 5, rev: 0.75, pan: 0.3 });
        }
        // V23: the lock lands on the PAN too -- both mode tones, staggered
        A.bell(H.chordTone(Math.min(ni, mi), -1), { role: 'texture', at: t0 + 0.05, vol: 0.05 + 0.08 * vel, dur: 3, rev: 0.6 });
        A.bell(H.chordTone(Math.max(ni, mi), -1), { role: 'texture', at: t0 + 0.32, vol: 0.04 + 0.07 * vel, dur: 3, rev: 0.6, pan: 0.25 });
        if (novel) A.hit({ vol: 0.16 * gate, dur: 0.5, freq: 240, q: 0.6, type: 'lowpass' });
      });
    }
    s.wasLocked = locked;
    // THE SETTLING: when the hands leave, nothing snaps. A settle envelope
    // arms as presence fades and decays over ~22s; while it runs, each grain
    // exhales outward on its own fixed heading (dispersal in the grain loop
    // below) and a whisper of re-scatter evaporates the densest clumps -
    // the pattern melts into starfield instead of freezing as square blobs.
    if (s.pres > 0.4) { s.wasAwake = true; s.settle = 0; }
    if (s.wasAwake && s.pres < 0.25) { s.wasAwake = false; s.settle = 1; }
    if (s.settle > 0) s.settle *= Math.exp(-dt / 22);
    // THE TEASE: rarer now — a sleeping plate hums maybe twice a minute,
    // draws the sand loosely toward a figure, and lets it fall again.
    // THE LURE: every breath rolls its own length, depth, shape, spacing,
    // heading and voice - a vibe, not a metronome.
    s.teaseT -= dt;
    let tease = 0;
    if (s.pres < 0.25) {
      if (s.teaseT <= 0) {
        s.brLen = 4 + P.rand() * 5;
        s.brDepth = 0.55 + P.rand() * 0.45;
        s.brSkew = 0.3 + P.rand() * 0.5;
        s.gustA = 0.6 + P.rand() * 1.6;
        s.gustDir = P.rand() * TAU;
        const kind = P.rand();
        s.gustA *= kind < 0.45 ? 0.25 : 1;      // bass-only breaths barely stir
        s.tollQ = kind > 0.86;                   // ~1 in 7: the lure toll
        s.tolled = false;
        // the breath breathes in LIVE too (V25): one soft pad swell per
        // breath on the Jup-8 -- the idle tease the rack was missing
        if (typeof MOut !== 'undefined' && typeof H !== 'undefined')
          MOut.evNote('pad', H.chordTone(0, 0), 0.08 + 0.06 * s.brDepth, 0, s.brLen + 3);
        s.teaseUntil = t + s.brLen;
        s.teaseT = 10 + P.rand() * 22;
      }
      if (t < s.teaseUntil) {
        const u = 1 - (s.teaseUntil - t) / s.brLen;
        tease = (u < s.brSkew
          ? Math.sin((u / s.brSkew) * Math.PI * 0.5)
          : Math.cos(((u - s.brSkew) / (1 - s.brSkew)) * Math.PI * 0.5)) * s.brDepth;
        if (s.tollQ && !s.tolled && u >= s.brSkew) {
          s.tolled = true;
          const deg = [0, 2, 4][(P.rand() * 3) | 0];
          const pan = (P.rand() - 0.5) * 0.9;
          P.ping(A => {
            A.bell(H.chordTone(deg, -1), { at: A.t() + 0.05, vol: 0.05 + 0.03 * s.brDepth, dur: 7, rev: 0.88, pan });
            A.bassNote(H.rootFreq(-1), { at: A.t() + 0.05, vol: 0.06, dur: 4 });
          });
        }
      }
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
    const gustAmt = dt * 0.055 * tease * s.gustA * (1 - s.pres);
    const eps = 0.004, k = dt * (0.05 + s.res * 0.15) * drive;
    // STILL SAND: jitter and the anti-trapping reseed both follow presence -
    // a dead plate's grains stop moving entirely (tease briefly stirs them).
    const jit = dt * ((0.05 * (1 - s.res) + 0.03) * (0.09 + 0.91 * s.pres) * (1 - s.charge * 0.6) + tease * 0.035);
    // the settle's two motions: a slow per-grain exhale (ballistic, so the
    // clumps actually disperse - a random walk this small never would) and
    // a gentle evaporation folded into the reseed
    const setAmt = dt * 0.022 * s.settle * (1 - s.pres);
    const setRe = dt * 0.025 * s.settle * (1 - s.pres);
    const reseed = dt * 0.2 * s.pres + setRe + dt * 0.0035 * (1 - s.pres); // idle evaporation: any slow gather bleeds away
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
        // SHEAR-CELL stream (V24): dx depends only on y, dy only on x --
        // divergence-free, so the circulation can NEVER silt the sand into
        // a band the way the old y-fed dy did over a long rest
        const a = curPh + Math.sin(y * 4.2 + curPh) * 1.3;
        dx += Math.cos(a) * curAmt;
        dy += Math.sin(curPh * 0.83 + x * 3.7) * curAmt * 0.55;
      }
      if (gustAmt > 0) {
        // the breath's gust: the sand visibly rolls with the wash sound
        dx += Math.cos(s.gustDir) * gustAmt;
        dy += Math.sin(s.gustDir) * gustAmt * 0.6;
      }
      if (setAmt > 0) {
        // the settle's exhale: golden-angle heading by index, so any clump
        // holds every direction and breathes apart instead of translating;
        // per-grain speed (second irrational hash) fills the cloud - one
        // shared speed turns every clump into an expanding ring
        const sa = i * 2.39996;
        const sp = 0.15 + 0.85 * ((i * 0.7548776662) % 1);
        dx += Math.cos(sa) * setAmt * sp;
        dy += Math.sin(sa) * setAmt * sp;
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
    const bedLo = A.padVoices(v, 2, { type: 'triangle', gain: 0.02, cutoff: 300, midi: false });
    const bedMid = A.padVoices(v, 3, { type: 'triangle', gain: 0.03, cutoff: 800, q: 0.7, midi: false });
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
        // between breaths: not dead - a faint low floor undulating on two
        // incommensurate LFOs, so the murmur never repeats and never grates
        const tt0 = s.tNow || 0;
        const floorAmt = Math.max(0.04, 0.16 + 0.1 * Math.sin(tt0 * 0.031) + 0.07 * Math.sin(tt0 * 0.017 + 1.7));
        const amb = pres + (1 - pres) * Math.min(1, floorAmt + 0.9 * (s.tease || 0));
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
          // THE ARP HOLDS CHORDS (V25, Lance: "let the instrument do the
          // work") -- Science Class carries its own arpeggiator, so the
          // window holds root + a color tone and re-strikes on each chord
          // change; the patch does the rhythm, CC74 rides the gate.
          if (typeof MOut !== 'undefined' && typeof H !== 'undefined' && s._arpChord !== H.step) {
            s._arpChord = H.step;
            const hold = Math.max(2, Math.min(rem, 4 * T.beat * ((typeof H.chordBars === 'number' ? H.chordBars : 4))) + 0.2);
            MOut.evNote('arp', H.chordTone(0, 0), 0.1, 0, hold);
          }
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
        MOut.expr('arp', s.beatOn ? 0.35 + 0.65 * gate : 0.1);
        MOut.expr('bells', clamp(0.2 + 0.5 * s.res + 0.3 * (s.charge || 0)));
        if (!s.beatOn) s._arpChord = -1;
        MOut.expr('sfx', Math.min(1, (s.motion || 0) * 2.5));
      },
      stop() { vx.kill(); v.kill(); }
    };
  }
});
