/* ---------- SRC-16.7 · RAIN ATRIUM V7 (the conductor) ---------- */
/* Lance on V6: "it doesn't really sound like an instrument" — agreed on the
   diagnosis: the weather owned every musical decision (note lottery, pitch
   from the wandering cell, gusts fighting a live hand, random flick pitch).
   V7 = THE CONDUCTOR: the hands play, the weather accompanies.
   - REGISTER IS YOURS: a hand's height chooses the degree window the earned
     notes draw from — sweep the hand and the rain audibly climbs the ladder.
     The cell keeps choosing WHERE drops land; it no longer chooses pitch.
   - FLICK IS A LEAD VOICE: pitch = the chord tone your hand points at in the
     flick moment, velocity = flick speed, cooldown 0.35s — a phrase you can
     actually play. One MIDI note per felt note now (partials stay local).
   - THE WEATHER YIELDS: gust/lull autonomy fades with your side's presence.
     Idle room = the weather performs; hands live = steady rain under you.
   - LIGHTNING: the earned thunder now LANDS — twin branched bolts strike
     each side's storm cell, big drops where they hit, the sky flash after.
   - Ripples/splashes fattened for mesh; the sky glow rides your storm cell. */
reg({
  id: 'SRC-16.7', family: 'SRC-16', ver: 7, title: 'Rain Atrium V7', tech: 'TWO-FIELD WATER / THE CONDUCTOR',
  music: {
    bpm: 64, root: 50, mode: 'aeolian', chordBars: 2,
    chords: [
      [0, 7, 15, 22, 26],    // D · A · F · C · E
      [0, 8, 15, 19, 22],    // D · Bb · F · A · C
      [0, 10, 15, 17, 26],   // D · C · F · G · E
      [0, 5, 8, 15, 19]      // D · G · Bb · F · A
    ],
    chordNames: ['Dm9', 'B♭maj9/D', 'Dm11', 'Gm9/D']
  },
  fx: { bloom: 0.55, edge: true },
  tags: ['WAVE INTERFERENCE', 'FELT PIANO', 'HAND = REGISTER', 'FLICK = LEAD NOTE', 'LIGHTNING'],
  desc: 'The rain becomes an instrument. Your hand\'s height is a register: hold it low and the drops that earn notes speak low and sparse, reach out and the rain climbs the chord ladder with you — sweep and you can hear the sky follow your arm. A flick places a real note: the tone your hand is pointing at, as hard as you threw it. Alone, the room truly rests — the rain keeps falling but the piano waits for a person, murmuring low if it speaks at all. And the storm finally pays off: charge it with both hands and twin bolts of lightning tear into the two storm cells as the thunder lands — and each storm the room survives leaves the pool soaked, the reverb deeper, the bed wider, for the rest of the night.',
  interact: 'L = rain over the left (ember) half, R = right (violet) — height is BOTH density and register: low hand, low sparse notes; high hand, dense and climbing. FLICK outward to place a note — pitch is where your hand is, loudness is how fast you flicked (0.35s cooldown). Set a register, then phrase with flicks. Both hands high charges the storm; one bar of warning, lightning + thunder on the downbeat; stillness after earns the petrichor. Idle, the weather plays itself; your first gesture makes it yield.',
  sound: 'Felt piano with a note budget, now conducted: the earned notes\' degree window tracks the hand (register = expression), volumes ride drop size wide enough for a velocity patch to expose, and each felt note mirrors as ONE lead note (partials no longer double-strike MIDI). Flick = a lead note whose pitch and velocity are literally the gesture, and it briefly holds the rain\'s note budget shut so it stands alone. PRESENCE GATES THE PIANO: an empty room gets visual rain and the low bed only — note chance, volume and register all scale with presence (idle speaks rarely, low, soft). Downpour is carried by weight now (patter + rumble up) instead of reading as a dropout. THE SOAKED POOL is the arc: each thunderstorm deepens the felt reverb, opens the bed filter and widens the drones for the rest of the session (SOAK on the HUD). Pinned key, empty mids, D pedal underneath.',
  // felt piano: small notes are 2 dry partials; big notes get the full wet
  // stack. Only the FUNDAMENTAL mirrors to MIDI (one lead note per felt note,
  // its vol = the velocity); partials are local timbre, suspended from the
  // mirror so the Live patch never gets octave double-strikes.
  _felt(A, freq, { at = 0, vol = 0.1, pan = 0, dur = 1.4, big = false, soak = 0 } = {}) {
    if (!isFinite(freq) || freq <= 20) return;
    const t0 = Math.max(A.t(), at || 0);
    // soak: the soaked-pool arc — each survived storm deepens the reverb
    const rev = (big ? 0.5 : 0.18) + soak;
    A.tone(freq, { at: t0, vol: vol, dur: dur, attack: 0.014, type: 'triangle', pan, rev, del: big ? 0.08 : 0 });
    const sp = (typeof MOut !== 'undefined') && MOut.suspend;
    if (typeof MOut !== 'undefined') MOut.suspend = true;
    A.tone(freq * 2.003, { at: t0, vol: vol * 0.3, dur: dur * 0.55, attack: 0.012, type: 'sine', pan, rev: rev * 0.9 });
    if (big) {
      A.tone(freq * 2.997, { at: t0, vol: vol * 0.11, dur: dur * 0.3, attack: 0.01, type: 'sine', pan, rev: 0.4 });
      A.tone(freq * 0.5, { at: t0, vol: vol * 0.3, dur: 0.07, attack: 0.004, type: 'triangle', pan, rev: 0.1 });
    }
    if (typeof MOut !== 'undefined') MOut.suspend = sp;
  },
  // palette variants per chord — wider than V5 so the drift is actually felt
  _WPAL: [[255, 150, 92], [255, 116, 130], [255, 186, 64], [240, 104, 120]],
  _VPAL: [[138, 112, 255], [186, 96, 235], [96, 136, 255], [160, 84, 255]],
  init(P) {
    const hi = areaScale(P) > 2;
    const W = hi ? 240 : 120, Hh = hi ? 150 : 75;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = Hh;
    P.state = {
      W, Hh,
      L: { cur: new Float32Array(W * Hh), prev: new Float32Array(W * Hh) },
      R: { cur: new Float32Array(W * Hh), prev: new Float32Array(W * Hh) },
      oc, og: oc.getContext('2d'), img: new ImageData(W, Hh),
      vL: 0, vR: 0, splashes: [],
      gustL: 0.9, gustR: 0.9, gustLT: 0.9, gustRT: 0.9, gustTimerL: 0, gustTimerR: 0,
      ccL: 0.25, ccR: 0.75, ccLT: 0.25, ccRT: 0.75,
      loadL: 0, loadR: 0,                       // recent injected energy → storm chop dies faster
      pL: undefined, pR: undefined, coolL: -9, coolR: -9,
      lastNoteAny: -9, lastNoteL: -9, lastNoteR: -9, lastBass: -9,
      warm: [255, 150, 92], viol: [138, 112, 255],
      warmT: [255, 150, 92], violT: [138, 112, 255],
      charge: 0, primed: false, strikeBeat: 0, strikeTimer: 0, flash: 0, glow: 0,
      petriArmed: false, petri: 0,
      presL: 0, presR: 0, bolts: [], soaked: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, Hh } = s;
    const k = Math.min(1, dt * 6);
    s.vL += (clamp(inp.L) - s.vL) * k;
    s.vR += (clamp(inp.R) - s.vR) * k;
    s.loadL *= Math.exp(-dt * 0.35); s.loadR *= Math.exp(-dt * 0.35);
    // per-side presence: the weather defers to a live hand, performs for an
    // empty room
    const liveL = chan.L.mode === 'live' ? 1 : 0, liveR = chan.R.mode === 'live' ? 1 : 0;
    s.presL += (liveL - s.presL) * Math.min(1, dt * (liveL ? 3 : 0.6));
    s.presR += (liveR - s.presR) * Math.min(1, dt * (liveR ? 3 : 0.6));
    // THE POOL ANSWERS YOUR ARRIVAL: a low quiet hand can otherwise wait
    // ~10s for the rain to earn its first note (agency fail) — so the first
    // presence after real absence always lands one soft placed note, at the
    // hand's register, at that side's cell, within the first beat.
    for (const side of [0, 1]) {
      const pv = side === 0 ? s.presL : s.presR;
      const wk = side === 0 ? '_hereL' : '_hereR';
      if (pv < 0.15) { s[wk] = 0; continue; }
      if (pv >= 0.3 && !s[wk]) {
        s[wk] = 1;
        const cc = side === 0 ? s.ccL : s.ccR;
        const lo = side === 0 ? 0.02 : 0.52, hi = side === 0 ? 0.48 : 0.98;
        const xf = clamp(cc, lo, hi);
        const adeg = Math.min(6, Math.floor(clamp(side === 0 ? inp.L : inp.R) * 6.99));
        s.lastNoteAny = t; if (side === 0) s.lastNoteL = t; else s.lastNoteR = t;
        s.splashes.push({ x: xf, y: 0.45 + P.rand() * 0.2, amp: 3, side, age: 0 });
        P.ping(A => {
          P.def._felt(A, H.chordTone(adeg, 0), {
            at: A.t() + 0.005, vol: 0.12, pan: xf * 2 - 1, dur: 2.2, big: true,
            soak: (s.soaked || 0) * 0.07
          });
        });
      }
    }
    // ---- gusts AND lulls: the weather's own phrasing — but it YIELDS to
    // presence: lulls stop stealing a held gesture, gust depth steadies, and
    // only the CELL keeps wandering (where rain lands stays weather) ----
    const gust = side => {
      const pres = side === 0 ? s.presL : s.presR;
      const T_ = side === 0 ? 'gustTimerL' : 'gustTimerR';
      s[T_] -= dt;
      if (s[T_] <= 0) {
        const lull = P.rand() < 0.18 * (1 - 0.85 * pres);
        s[T_] = lull ? 2.5 + P.rand() * 3 : 1.6 + P.rand() * 3.5;
        const wild = lull ? 0.03 : 0.25 + P.rand() * 1.45;
        const steady = 0.85 + P.rand() * 0.35;
        const targ = wild + (steady - wild) * pres;
        // 25% of retargets aim the cell near the middle — the rose collision zone
        const mid = P.rand() < 0.25;
        if (side === 0) { s.gustLT = targ; s.ccLT = mid ? 0.33 + P.rand() * 0.15 : 0.06 + P.rand() * 0.38; }
        else { s.gustRT = targ; s.ccRT = mid ? 0.52 + P.rand() * 0.15 : 0.56 + P.rand() * 0.38; }
      }
      if (side === 0) { s.gustL += (s.gustLT - s.gustL) * dt * 0.8; s.ccL += (s.ccLT - s.ccL) * dt * 0.35; }
      else { s.gustR += (s.gustRT - s.gustR) * dt * 0.8; s.ccR += (s.ccRT - s.ccR) * dt * 0.35; }
    };
    gust(0); gust(1);
    // ---- hand velocity: flicks place notes; a fresh gesture always answers
    // mid-lull. Returns the flick SPEED (0 = no flick) — speed is velocity. ----
    const hv = (side, v) => {
      const pk = side === 0 ? 'pL' : 'pR';
      const prev = s[pk] === undefined ? v : s[pk];
      const vel = (v - prev) / Math.max(dt, 1e-3);
      s[pk] = v;
      if (vel > 0.5) { if (side === 0) s.gustL = Math.max(s.gustL, 0.8); else s.gustR = Math.max(s.gustR, 0.8); }
      const ck = side === 0 ? 'coolL' : 'coolR';
      if (vel > 2.2 && v > 0.3 && t - s[ck] > 0.35) { s[ck] = t; return vel; }
      return 0;
    };
    const flickL = hv(0, clamp(inp.L)), flickR = hv(1, clamp(inp.R));
    // ---- drops: clustered around the wandering cell; a NOTE is earned, not given ----
    const dropAt = (side, xf, y, amp, placed) => {
      const f = side === 0 ? s.L : s.R;
      const x = xf * W | 0;
      f.cur[y * W + x] -= amp;
      if (x > 0) f.cur[y * W + x - 1] -= amp * 0.5;
      if (x < W - 1) f.cur[y * W + x + 1] -= amp * 0.5;
      if (side === 0) s.loadL += amp; else s.loadR += amp;
      s.splashes.push({ x: xf, y: y / Hh, amp: placed ? amp * 1.3 : amp, side, age: 0 });
    };
    const duckNow = 1 - 0.85 * clamp(((inp.L + inp.R) / 2 - 0.5) / 0.35);
    const tryDrop = (side, dens) => {
      const g = side === 0 ? s.gustL : s.gustR;
      if (P.rand() >= dens * dens * dt * 20 * g) return;
      const cc = side === 0 ? s.ccL : s.ccR;
      const lo = side === 0 ? 0.02 : 0.52, hi = side === 0 ? 0.48 : 0.98;
      const xf = P.rand() < 0.65
        ? clamp(cc + (P.rand() + P.rand() - 1) * 0.16, lo, hi)
        : lo + P.rand() * (hi - lo);
      const y = (P.rand() * (Hh - 8) + 4) | 0;
      const amp = 1.2 + P.rand() * 2.2;
      dropAt(side, xf, y, amp, false);
      // note economy: most drops are just water
      if (!(amp > 2.55 || P.rand() < 0.18)) return;
      if (P.rand() > 1.15 - 0.75 * ((inp.L + inp.R) / 2)) return;   // downpour yields to weather
      if (t - s.lastNoteAny < 0.22) return;                          // global budget ≈ 2–3/s
      if (t - (side === 0 ? s.lastNoteL : s.lastNoteR) < 0.35) return;
      s.lastNoteAny = t; if (side === 0) s.lastNoteL = t; else s.lastNoteR = t;
      const big = amp > 2.9 && t - s.lastBass > 1.2;
      if (big) s.lastBass = t;
      // PRESENCE GATES THE PIANO (listening-test fail: idle played 96 notes
      // in 15s, some at full volume, for an empty room). Ghost rain stays
      // visual; the piano is for people: chance and volume scale with the
      // side's presence, and an idle plate speaks only low, only softly.
      const pres = side === 0 ? s.presL : s.presR;
      if (P.rand() > 0.12 + 0.88 * pres) return;
      // REGISTER IS YOURS: the degree window follows the HAND's height, not
      // the wandering cell — sweep the hand, hear the rain climb the ladder.
      // Half the notes sit exactly on the hand's degree, the rest ±1.
      const vh = side === 0 ? s.vL : s.vR;
      const base = Math.min(6, Math.floor(vh * 6.99));
      let deg = Math.max(0, P.rand() < 0.5 ? base : base + (P.rand() < 0.5 ? -1 : 1));
      if (pres < 0.35) deg = Math.min(deg, 2);   // idle highs stay dead
      P.ping(A => {
        const at = A.t() + 0.005 + P.rand() * 0.03;
        // velocity lives here: drop size drives vol over a range wide enough
        // for a velocity-sensitive patch to expose (was clamped 0.05–0.12)
        const vol = clamp(0.04 + amp * 0.045 + P.rand() * 0.012, 0.05, 0.17)
          * duckNow * (0.35 + 0.65 * pres);
        P.def._felt(A, big ? H.chordTone(deg % 4, 0) : H.chordTone(deg, 1), {
          at, vol: big ? vol * (1 + 0.5 * pres) : vol, pan: xf * 2 - 1, dur: big ? 2.4 : 1.3, big,
          soak: (s.soaked || 0) * 0.07
        });
      });
    };
    tryDrop(0, inp.L); tryDrop(1, inp.R);
    // ---- flick = a LEAD NOTE you played: pitch is the chord tone the hand
    // points at in the flick moment, velocity is the flick's speed. The drop
    // still lands at your storm cell; the note is yours. ----
    for (const [side, flick] of [[0, flickL], [1, flickR]]) {
      if (!flick) continue;
      const cc = side === 0 ? s.ccL : s.ccR;
      const lo = side === 0 ? 0.02 : 0.52, hi = side === 0 ? 0.48 : 0.98;
      const xf = clamp(cc + (P.rand() - 0.5) * 0.08, lo, hi);
      const y = (Hh * (0.3 + P.rand() * 0.4)) | 0;
      const fvol = clamp(0.10 + (flick - 2.2) * 0.03, 0.10, 0.22);
      dropAt(side, xf, y, 3.2 + clamp((flick - 2.2) * 0.35, 0, 1.2), true);
      const fdeg = Math.min(6, Math.floor(clamp(side === 0 ? inp.L : inp.R) * 6.99));
      // one gesture = one statement: the flick's own splash would earn a burst
      // of rain notes right on top of the placed note — hold that side's (and
      // the global) note budget shut for a beat so the note stands alone
      s.lastNoteAny = t + 0.35;
      if (side === 0) s.lastNoteL = t + 0.45; else s.lastNoteR = t + 0.45;
      P.ping(A => {
        P.def._felt(A, H.chordTone(fdeg, 0), {
          at: A.t() + 0.005, vol: fvol * duckNow, pan: xf * 2 - 1, dur: 2.6, big: true,
          soak: (s.soaked || 0) * 0.07
        });
      });
    }
    // ---- storm meter: thunder is earned, telegraphed a bar, lands on the downbeat ----
    const both = Math.min(s.vL, s.vR);
    if (both > 0.68) s.charge = Math.min(1, s.charge + dt / 10);
    else s.charge = Math.max(s.primed ? 1 : 0, s.charge - dt / 6);
    if (s.charge >= 1 && !s.primed) {
      s.primed = true;
      s.strikeBeat = T.running ? (Math.floor(T.beats() / 4) + 1) * 4 : 0;
      s.strikeTimer = 0;
    }
    if (s.primed) {
      s.strikeTimer += dt;
      const due = T.running ? T.beats() >= s.strikeBeat : s.strikeTimer > 1.6;
      s.glow = T.running ? clamp(1 - (s.strikeBeat - T.beats()) / 4) : clamp(s.strikeTimer / 1.6);
      if (due) {
        s.primed = false; s.charge = 0.15; s.glow = 0; s.flash = 1; s.petriArmed = true;
        // THE SOAKED POOL (the arc): each storm the room survives leaves it
        // wetter for the rest of the night — reverb deepens, the bed opens
        s.soaked = Math.min(3, (s.soaked || 0) + 1);
        P.ping(A => {
          const at = A.t() + 0.02;
          A.hit({ vol: 0.5, dur: 2.0, freq: 90, q: 0.6, type: 'lowpass', at });
          A.hit({ vol: 0.22, dur: 3.5, freq: 210, q: 0.4, type: 'lowpass', at: at + 0.35 });
          A.tone(H.rootFreq(-2), { at, vol: 0.16, dur: 3.2, attack: 0.35, type: 'sine', rev: 0.6 });
        });
        // LIGHTNING: twin branched bolts, one into each side's storm cell —
        // fat jagged polylines (normalized coords), a big drop where each
        // lands, the sky flash right behind them
        const mkBolt = (x0, yEnd) => {
          const pts = [[x0 + (P.rand() - 0.5) * 0.06, -0.02]];
          let x = pts[0][0], y = -0.02;
          while (y < yEnd - 0.03) {
            y += 0.03 + P.rand() * 0.04;
            x += (P.rand() - 0.5) * 0.07 + (x0 - x) * 0.18;
            pts.push([x, y]);
          }
          pts.push([x0 + (P.rand() - 0.5) * 0.02, yEnd]);
          return pts;
        };
        s.bolts = [];
        [s.ccL, s.ccR].forEach((cx, side) => {
          const yEnd = 0.42 + P.rand() * 0.2;
          const main = mkBolt(cx, yEnd);
          s.bolts.push({ pts: main, side, age: 0, w: 1, ph: P.rand() * 9 });
          const bi = 1 + (P.rand() * (main.length - 3) | 0);   // one thin branch
          const [bx0, by0] = main[bi];
          const br = [[bx0, by0]];
          let bx = bx0, by = by0;
          const dir = P.rand() < 0.5 ? -1 : 1;
          for (let i = 0; i < 5; i++) {
            bx += dir * (0.015 + P.rand() * 0.025) + (P.rand() - 0.5) * 0.02;
            by += 0.03 + P.rand() * 0.035;
            br.push([bx, by]);
          }
          s.bolts.push({ pts: br, side, age: 0, w: 0.45, ph: P.rand() * 9 });
          dropAt(side, clamp(cx, side ? 0.52 : 0.02, side ? 0.98 : 0.48),
                 Math.min(Hh - 3, (yEnd * Hh) | 0), 3.6, false);
        });
        for (let i = 0; i < 8; i++) {
          const x = 0.02 + P.rand() * 0.96, y = 2 + (P.rand() * (Hh - 4)) | 0;
          dropAt(i % 2, clamp(x, i % 2 ? 0.52 : 0.02, i % 2 ? 0.98 : 0.48), y, 1.5 + P.rand() * 1.5, false);
        }
      }
    }
    s.flash = Math.max(0, s.flash - dt * 1.4);
    // bolts live ~0.65s, flickering as they die
    if (s.bolts.length) {
      for (const b of s.bolts) b.age += dt * 1.55;
      s.bolts = s.bolts.filter(b => b.age < 1);
    }
    // ---- petrichor: stillness after the strike earns a golden answer ----
    if (s.petriArmed && s.vL < 0.18 && s.vR < 0.18) {
      s.petriArmed = false; s.petri = 1;
      P.ping(A => {
        const t0 = T.running ? T.next(0.5) : A.t() + 0.1;
        [5, 7, 6, 9, 8].forEach((ci, i) => {
          P.def._felt(A, H.chordTone(ci, 1), {
            at: t0 + i * (T.beat || 0.9) * 0.5, vol: 0.055 - i * 0.006, pan: (i - 2) * 0.35, dur: 2.2, big: true,
            soak: (s.soaked || 0) * 0.07
          });
        });
      });
    }
    s.petri = Math.max(0, s.petri - dt * 0.25);
    // ---- palette drift (targets set on chord changes) ----
    for (let c = 0; c < 3; c++) {
      s.warm[c] += (s.warmT[c] - s.warm[c]) * dt * 0.15;
      s.viol[c] += (s.violT[c] - s.viol[c]) * dt * 0.15;
    }
    // ---- splashes age ----
    for (const sp of s.splashes) sp.age += dt * 1.3;
    if (s.splashes.length) s.splashes = s.splashes.filter(sp => sp.age < 1);
    // ---- wave step — 9-point isotropic; a loaded field damps harder, so storm
    // chop dies faster than a lone drop's rings and the dark mass survives ----
    const base = W > 200 ? 0.988 : 0.979;
    for (const f of [s.L, s.R]) {
      const load = f === s.L ? s.loadL : s.loadR;
      const damp = base - Math.min(0.007, Math.max(0, load - 4) * 0.0006);
      const cur = f.cur, next = f.prev;
      for (let y = 1; y < Hh - 1; y++) {
        const y0 = y * W;
        for (let x = 1; x < W - 1; x++) {
          const i = y0 + x;
          const c = cur[i];
          const lap = (cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5
                    + (cur[i - W - 1] + cur[i - W + 1] + cur[i + W - 1] + cur[i + W + 1]) * 0.25
                    - 3 * c;
          next[i] = (c * 2 - next[i] + 0.3 * lap) * damp;
        }
      }
      f.prev = cur; f.cur = next;
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, Hh, img } = s, d = img.data;
    const cL = s.L.cur, cR = s.R.cur;
    const WM = s.warm, VI = s.viol;
    const flashTop = s.flash * s.flash;
    // ADAPTIVE edge gain: sparse rain spends bright (mesh eats half the
    // light), a downpour backs off so the dark mass survives the churn
    const gnL = 1.75 - 0.6 * s.vL, gnR = 1.75 - 0.6 * s.vR;
    for (let y = 0; y < Hh; y++) {
      const ty = 1 - y / Hh;
      const dusk = ty * ty;
      let bR = 10 + 20 * dusk, bG = 7 + 9 * dusk, bB = 24 + 7 * dusk;
      if (flashTop > 0 && ty > 0.6) {
        const fw = flashTop * (ty - 0.6) * 2.5;
        bR += 90 * fw; bG += 85 * fw; bB += 115 * fw;
      }
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l0 = x > 0 ? cL[i - 1] : 0, r0 = x < W - 1 ? cL[i + 1] : 0;
        const u0 = y > 0 ? cL[i - W] : 0, dn0 = y < Hh - 1 ? cL[i + W] : 0;
        const l1 = x > 0 ? cR[i - 1] : 0, r1 = x < W - 1 ? cR[i + 1] : 0;
        const u1 = y > 0 ? cR[i - W] : 0, dn1 = y < Hh - 1 ? cR[i + W] : 0;
        const eL = Math.max(0, clamp((l0 - r0) * 0.9 + (u0 - dn0) * 0.6, -0.06, 1) * gnL);
        const eR = Math.max(0, clamp((l1 - r1) * 0.9 + (u1 - dn1) * 0.6, -0.06, 1) * gnR);
        const gold = (eL + eR) * s.petri;
        d[i * 4]     = Math.min(255, bR + eL * WM[0] + eR * VI[0] + gold * 200);
        d[i * 4 + 1] = Math.min(255, bG + eL * WM[1] + eR * VI[1] + gold * 150);
        d[i * 4 + 2] = Math.min(255, bB + eL * WM[2] + eR * VI[2] + gold * 40);
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(s.oc, 0, 0, w, h);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const sp of s.splashes) {
      const fade = (1 - sp.age) * (1 - sp.age);
      const r = (0.013 + sp.amp * 0.011) * w * (0.3 + sp.age * 1.1);
      const c = sp.side === 0 ? WM : VI;
      const gr = g.createRadialGradient(sp.x * w, sp.y * h, 0, sp.x * w, sp.y * h, r);
      gr.addColorStop(0, `rgba(255,244,230,${fade * 0.85})`);
      gr.addColorStop(0.3, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${fade * 0.55})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(sp.x * w - r, sp.y * h - r, r * 2, r * 2);
    }
    g.restore();
    // LIGHTNING: white-hot core over a side-colored halo, flickering out.
    // Fat strokes — thin lines die on mesh.
    if (s.bolts.length) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (const b of s.bolts) {
        const die = (1 - b.age) * (1 - b.age);
        const fl = die * (0.75 + 0.25 * Math.sin(t * 62 + b.ph));
        if (fl <= 0.02) continue;
        const c = b.side === 0 ? WM : VI;
        const path = () => {
          g.beginPath();
          g.moveTo(b.pts[0][0] * w, b.pts[0][1] * h);
          for (let i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i][0] * w, b.pts[i][1] * h);
        };
        // three passes, wide → hot: the bolt must beat a bright churn
        g.strokeStyle = `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(fl * 0.7).toFixed(3)})`;
        g.lineWidth = h * 0.06 * b.w; path(); g.stroke();
        g.strokeStyle = `rgba(255,252,245,${(fl * 0.85).toFixed(3)})`;
        g.lineWidth = h * 0.024 * b.w; path(); g.stroke();
        g.strokeStyle = `rgba(255,255,255,${fl.toFixed(3)})`;
        g.lineWidth = h * 0.011 * b.w; path(); g.stroke();
      }
      g.restore();
    }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [side, v] of [[0, s.vL], [1, s.vR]]) {
      const c = side === 0 ? WM : VI;
      const a = 0.05 + v * 0.13 + s.charge * 0.06 + s.glow * 0.3 + s.flash * 0.35;
      // the sky glow rides YOUR storm cell — you can see where a flick will land
      const cx = w * (side === 0 ? s.ccL : s.ccR), rr = w * 0.42;
      const gr = g.createRadialGradient(cx, -h * 0.12, 0, cx, -h * 0.12, rr);
      gr.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 0.7)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(cx - rr, 0, rr * 2, h * 0.35);
    }
    g.restore();
    if (P.focused) {
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.font = '10px monospace';
      g.fillText('L ' + s.vL.toFixed(2) + '  R ' + s.vR.toFixed(2) + '  GUST ' + s.gustL.toFixed(1) + '/' + s.gustR.toFixed(1) +
        '  STORM ' + (s.charge * 100 | 0) + '%' + (s.primed ? ' ⚡' : '') +
        (s.soaked ? '  SOAK ' + s.soaked : '') + '  ' + (H.label || ''), 8, h - 8);
    }
  },
  audio(A, P) {
    const self = this, s = P.state;
    const v = A.voice();
    const filt = A.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 500; filt.Q.value = 0.4;
    filt.connect(v.group);
    const DR = [
      { i: 0, o: -1, g: 0.010 },
      { i: 0, o: 0,  g: 0.005 },
      { i: 2, o: 0,  g: 0.006 },
      { i: 4, o: 0,  g: 0.006 }
    ];
    const drones = DR.map(d => {
      const o = v.osc('triangle', H.chordTone(d.i, d.o));
      const g = v.g(0.0001);
      o.connect(g); g.connect(filt);
      return { o, g, d };
    });
    const layer = (type, freq, q, pan) => {
      const n = v.noise();
      const f = v.filter(type, freq, q);
      const gg = v.g(0);
      n.connect(f); f.connect(gg);
      if (A.ctx.createStereoPanner && pan !== 0) {
        const p = A.ctx.createStereoPanner(); p.pan.value = pan;
        gg.connect(p); p.connect(v.group);
      } else gg.connect(v.group);
      return gg;
    };
    const rumble = layer('lowpass', 240, 0.5, 0);
    const patL = layer('bandpass', 2600, 0.8, -0.7), patR = layer('bandpass', 2600, 0.8, 0.7);
    const spkL = layer('highpass', 6000, 0.7, -0.5), spkR = layer('highpass', 6000, 0.7, 0.5);
    let jT = 0, jL = 1, jR = 1;
    H.onChord(() => {
      for (const dr of drones) A.set(dr.o.frequency, H.chordTone(dr.d.i, dr.d.o), 0.18);
      const ci = H.step % self._WPAL.length;
      s.warmT = self._WPAL[ci].slice();
      s.violT = self._VPAL[ci].slice();
      // presence-gated: ghost drift must not make an empty room roll chords
      const inten = ((s.vL + s.vR) / 2) * Math.max(s.presL || 0, s.presR || 0);
      if (inten < 0.05) return;
      [0, 1, 2, 3, 4].forEach((cj, i) => {
        self._felt(A, H.chordTone(cj, 0), {
          at: A.t() + i * 0.075, vol: 0.028 + inten * 0.055, pan: (i - 2) * 0.28, dur: 2.6, big: true,
          soak: (s.soaked || 0) * 0.07
        });
      });
    });
    v.fadeIn(1, 1.2);
    let nextT = 0, lastIdx = -1;
    return {
      tick(inp) {
        const wet = (s.vL + s.vR) / 2;
        const soak = s.soaked || 0;
        // the soaked pool: each survived storm opens the bed a little — the
        // room stays wetter for the rest of the night
        const open = (0.3 + 0.7 * wet) * (1 + 0.12 * soak);
        for (const dr of drones) A.set(dr.g.gain, dr.d.g * open, 0.3);
        A.set(filt.frequency, 400 + wet * 500 + soak * 120, 0.3);
        // the crescendo is AUDIBLE: rumble swells with the storm charge and
        // the pre-strike glow, so lightning arrives announced, not sprung.
        // 0.06 → 0.085: the downpour measured QUIETER than mid rain — when
        // the piano yields, the weather has to actually take over
        A.set(rumble.gain, wet * wet * 0.085 + s.flash * 0.05 + s.charge * 0.025 + s.glow * 0.05, 0.3);
        jT -= 1 / 60;
        if (jT <= 0) { jT = 0.05 + Math.random() * 0.07; jL = 0.55 + Math.random() * 0.9; jR = 0.55 + Math.random() * 0.9; }
        // lulls duck the patter — quiet is really quiet. 0.05 → 0.075: the
        // downpour is carried by WATER, so the water has to weigh something
        A.set(patL.gain, s.vL * s.vL * 0.075 * jL * (0.35 + 0.65 * Math.min(1, s.gustL)), 0.06);
        A.set(patR.gain, s.vR * s.vR * 0.075 * jR * (0.35 + 0.65 * Math.min(1, s.gustR)), 0.06);
        A.set(spkL.gain, Math.max(0, s.vL - 0.55) * 0.06, 0.25);
        A.set(spkR.gain, Math.max(0, s.vR - 0.55) * 0.06, 0.25);
        // ---- the earned groove, now breathing: bar-aware kick/bass/ticks ----
        if (!T.running || !A.ctx) return;
        const gate = clamp((wet - 0.38) / 0.35);
        const stepDur = T.beat * 0.25;
        if (!nextT || nextT < A.t() - 0.05) nextT = T.next(0.25);
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const idx = Math.round((nextT - T.t0) / stepDur);
          if (idx > lastIdx) {
            lastIdx = idx;
            const st = ((idx % 16) + 16) % 16;
            const bar = Math.floor(idx / 16);
            if (gate > 0.03) {
              const at = nextT + (st % 4 === 2 ? T.beat * 0.06 : 0);
              if (st === 0) {
                // bar heads accented (~×1.3) — flat velocity is a doorbell
                const acc = bar % 4 === 0 ? 1.3 : 1;
                A.kick(at, (0.06 + 0.13 * gate) * acc * (0.9 + Math.random() * 0.2));
                A.bassNote(H.chordTone(bar % 4 === 3 ? 1 : 0, -1), { at, vol: (0.05 + 0.09 * gate) * acc, dur: 1.6 });
              }
              if (st === 8 && bar % 2 === 0) A.kick(at, (0.06 + 0.13 * gate) * 0.5);
              if (st === 4 || st === 12) A.hat(at, { vol: (0.016 + 0.026 * gate) * (0.85 + Math.random() * 0.3) });
              if (gate > 0.6 && st === 14 && bar % 4 === 3) A.hat(at, { vol: 0.016 });
              if (gate > 0.75 && st === 10 && bar % 2 === 1) A.hat(at, { vol: 0.02, open: true });
            }
          }
          nextT += stepDur;
        }
      },
      stop() { v.kill(); }
    };
  }
});
