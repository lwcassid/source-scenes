/* ---------- SRC-16.13 · RAIN ATRIUM V13 (the band is summoned) -----------
   Lance's paradigm round: this scene is a VIBE — the beats were too easy
   to stumble into. The whole groove (kick, hats, snare, bass figure) now
   lives behind THE SUMMONS, the new cross-scene master code (left hand
   parked at the source + right hand wiggling, ~4s — core SUMMON in
   part2_core): ambient rain, piano, drone and the real recordings for
   everyone; the band walks in for ~45s for whoever knows the code, with
   a floor under the gate so there is always a pocket to jam over while
   the window is open. A soft ember glow rises from the floor as the
   charge fills. (V12 notes below.) -----------------------------------
   Lance's next round on V11, five fixes: (1) an earned piano note now
   VISIBLY lands — extra dent + brighter splash, so the rain goes with the
   piano strikes; (2) thunder's booms no longer mirror as kick 36 (they
   were doubling the drum lane) — browser color only, plus a proper
   thunder one-shot on sfx note 38 for his sample; (3) the accidental
   hand pan is silenced: the bed voice was auto-mirroring to texture ch9
   (_noHold now set) — it was never a cast; (4) bass shape widened to his
   spec: D · D · B♭ · B♭→G per 4-bar phrase — the key leans away a full
   bar before walking home; (5) turnaround hats slip into TRIPLETS for
   that one bar. (Original V11 notes below.) --------------------------
   The pocket is now STOLEN FROM LANCE'S OWN REFERENCE (midi/
   140_drums_fun.mid — "the groove is better, the hat work too intense"):
   his 140 BPM half-time boom-bap cell mapped 8ths-to-16ths onto our
   64 BPM bar. Kept verbatim: the kick placements (including his vel-16
   GHOST kick), the backbeat snare, and the loud/soft breathing of his
   closed-hat bed with his velocities. Dropped whole: the 32nd hat rolls
   and chromatic riser fills. Added ~56% swing on the weak hats (his file
   is straight; lo-fi convention is 54-58) and RANKED them in past
   mid-gate. Bass: D pedal three bars with air at the end, then Lance's
   TURNAROUND — up to B-flat, then G, falling home to D, diatonic on both
   chords it meets. Rain recordings unchanged from V8 (39 forest / 40
   storm), lead-breathes-with-wetness unchanged from V9. */
reg({
  id: 'SRC-16.13', family: 'SRC-16', ver: 13, title: 'Rain Atrium V13', tech: 'TWO-FIELD WATER / SUMMONED BAND',
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
  tags: ['WAVE INTERFERENCE', 'MOTIF RAIN', 'FLICK = PLACED DROP', 'GUSTS & LULLS', 'REAL RAIN ON SFX'],
  desc: 'The pocket is Lance\'s now — his own reference groove, parsed and thinned: the kicks land where his did, ghost kick and all, the snare cracks his backbeat, and the hats keep his loud-soft breathing while the busy 32nd rolls and riser fills stay on the cutting-room floor. A lazy 56%-swing drag makes the straight grid slouch. The bass chills on D with air at the end of every bar, then once a phrase walks up — B-flat, G — and falls home. The motif rain, the real forest-and-thunderstorm recordings, and the piano that breathes with the wetness all carry over.',
  interact: 'L = rain density over the left (ember) half, R = right (violet). The rain gusts AND lulls on its own — silence is part of the weather now. FLICK either hand outward: one placed drop, low and loud, at your storm cell (0.6s cooldown) — set a level with the hand, then punctuate with flicks. Both hands high charges the storm; one bar of warning, thunder on the downbeat; stillness after earns the petrichor. A fresh gesture always answers immediately, even mid-lull.',
  sound: 'MOTIF RAIN kept from V7 (3-tone voice-led cell per chord, ~1 note/0.7s, big drops anchor low, only fundamentals mirror to MIDI). POCKET = LANCE\'S OWN GROOVE (midi/140_drums_fun.mid, 8ths→16ths onto the 64 BPM bar): his kicks with the vel-16 ghost on the and-of-2, snare crack on the backbeat, his hats\' loud/soft breathing with ~56% swing added; his 32nd rolls and chromatic fills dropped; weak hats ranked in past mid-gate. BASS SHAPE (Lance): D · D · B-flat · B-flat-to-G each 4-bar phrase — a full bar away from home before the walk back; air at the end of every sustain. TURNAROUND HATS: triplets on the walk bar only. THUNDER: browser booms no longer mirror to the kick lane; the strike sends a thunder one-shot on sfx 38. The bed voice no longer auto-mirrors to texture (it was playing the hand pan uninvited). Earned notes land visibly harder — ear and eye agree. ABLETON RAIN ×2: note 39 = forest rainfall held all scene (volume rides sfx CC74), note 40 = thunderstorm held past ~55% wetness with hysteresis (give its Simpler a slow amp attack/release — it walks in, never pops). THE GROOVE IS SUMMONED (V13): drums and bass figure exist only inside the master-code window (SUMMON, ~45s, gate floored at 0.3 so the pocket holds for jamming); ambient state is rain + motif piano + drone + the real recordings — the vibe. Cast OUT: MIDI; browser patter is the offline fallback. LEAD CC74 = wetness (V9): the felt piano\'s filter closes off in light rain and opens with the storm — set the mapping\'s Min/Max in Live to taste (Lance\'s ear: 640 Hz → 8.72 kHz). Pinned key, empty mids, D pedal underneath.',
  // felt piano: small notes are 2 dry partials; big notes get the full wet stack
  _felt(A, freq, { at = 0, vol = 0.1, pan = 0, dur = 1.4, big = false } = {}) {
    if (!isFinite(freq) || freq <= 20) return;
    const t0 = Math.max(A.t(), at || 0);
    const rev = big ? 0.5 : 0.18;
    // only the fundamental mirrors to MIDI — the stacked partials below are
    // browser color, and mirroring them sent up to 4 notes per drop to Live
    A.tone(freq, { at: t0, vol: vol, dur: dur, attack: 0.014, type: 'triangle', pan, rev, del: big ? 0.08 : 0 });
    A.tone(freq * 2.003, { at: t0, vol: vol * 0.3, dur: dur * 0.55, attack: 0.012, type: 'sine', pan, rev: rev * 0.9, midi: false });
    if (big) {
      A.tone(freq * 2.997, { at: t0, vol: vol * 0.11, dur: dur * 0.3, attack: 0.01, type: 'sine', pan, rev: 0.4, midi: false });
      A.tone(freq * 0.5, { at: t0, vol: vol * 0.3, dur: 0.07, attack: 0.004, type: 'triangle', pan, rev: 0.1, midi: false });
    }
  },
  // palette variants per chord — wider than V5 so the drift is actually felt
  _WPAL: [[255, 150, 92], [255, 116, 130], [255, 186, 64], [240, 104, 120]],
  _VPAL: [[138, 112, 255], [186, 96, 235], [96, 136, 255], [160, 84, 255]],
  // MOTIF CELLS — one 3-tone cell per chord as ladder indices; index pattern
  // [4,3,1] voice-leads across this progression's voicings: Dm9 → E C A ·
  // B♭maj9 → C A F · Dm11 → E G C · Gm9 → A F G. The top tone E→C→E→A is a
  // melody; ladder idx 2 is the passing tone. Kept per-chord for later tuning.
  _CELL: [[4, 3, 1], [4, 3, 1], [4, 3, 1], [4, 3, 1]],
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
      lastNoteAny: -9, lastNoteL: -9, lastNoteR: -9, lastBass: -9, cellPos: 0,
      warm: [255, 150, 92], viol: [138, 112, 255],
      warmT: [255, 150, 92], violT: [138, 112, 255],
      charge: 0, primed: false, strikeBeat: 0, strikeTimer: 0, flash: 0, glow: 0,
      petriArmed: false, petri: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, Hh } = s;
    const k = Math.min(1, dt * 6);
    s.vL += (clamp(inp.L) - s.vL) * k;
    s.vR += (clamp(inp.R) - s.vR) * k;
    s.loadL *= Math.exp(-dt * 0.35); s.loadR *= Math.exp(-dt * 0.35);
    // ---- gusts AND lulls: silence is part of the weather now ----
    const gust = side => {
      const T_ = side === 0 ? 'gustTimerL' : 'gustTimerR';
      s[T_] -= dt;
      if (s[T_] <= 0) {
        const lull = P.rand() < 0.18;
        s[T_] = lull ? 2.5 + P.rand() * 3 : 1.6 + P.rand() * 3.5;
        const targ = lull ? 0.03 : 0.25 + P.rand() * 1.45;
        // 25% of retargets aim the cell near the middle — the rose collision zone
        const mid = P.rand() < 0.25;
        if (side === 0) { s.gustLT = targ; s.ccLT = mid ? 0.33 + P.rand() * 0.15 : 0.06 + P.rand() * 0.38; }
        else { s.gustRT = targ; s.ccRT = mid ? 0.52 + P.rand() * 0.15 : 0.56 + P.rand() * 0.38; }
      }
      if (side === 0) { s.gustL += (s.gustLT - s.gustL) * dt * 0.8; s.ccL += (s.ccLT - s.ccL) * dt * 0.35; }
      else { s.gustR += (s.gustRT - s.gustR) * dt * 0.8; s.ccR += (s.ccRT - s.ccR) * dt * 0.35; }
    };
    gust(0); gust(1);
    // ---- hand velocity: flicks place drops; a fresh gesture always answers mid-lull ----
    const hv = (side, v) => {
      const pk = side === 0 ? 'pL' : 'pR';
      const prev = s[pk] === undefined ? v : s[pk];
      const vel = (v - prev) / Math.max(dt, 1e-3);
      s[pk] = v;
      if (vel > 0.5) { if (side === 0) s.gustL = Math.max(s.gustL, 0.8); else s.gustR = Math.max(s.gustR, 0.8); }
      const ck = side === 0 ? 'coolL' : 'coolR';
      if (vel > 2.2 && v > 0.3 && t - s[ck] > 0.6) { s[ck] = t; return true; }
      return false;
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
      if (t - s.lastNoteAny < 0.7) return;                           // budget ≈ 1 note / 0.7s
      if (t - (side === 0 ? s.lastNoteL : s.lastNoteR) < 1.0) return;
      s.lastNoteAny = t; if (side === 0) s.lastNoteL = t; else s.lastNoteR = t;
      // the note IS the drop (Lance: "the rain needs to go with the piano
      // strikes"): an earned note visibly lands harder — extra dent and a
      // brighter splash, so ear and eye agree
      dropAt(side, xf, y, amp * 0.7, true);
      const big = amp > 2.9 && t - s.lastBass > 1.2;
      if (big) s.lastBass = t;
      // MOTIF, not dice (V7): walk the chord's 3-tone cell stepwise — the
      // drop's position only nudges the walk's direction — with a rare
      // passing tone and a rare octave lift. Big drops anchor the cell an
      // octave down. A phrase the weather keeps almost remembering.
      const cell = P.def._CELL[H.step % P.def._CELL.length];
      const xh = (xf - lo) / (hi - lo);
      if (P.rand() < 0.6) s.cellPos = clamp(s.cellPos + (xh > 0.5 ? 1 : -1), 0, 2);
      const idx = P.rand() < 0.12 ? 2 : cell[s.cellPos | 0];
      const lift = !big && P.rand() < 0.1 ? 1 : 0;
      P.ping(A => {
        const at = A.t() + 0.005 + P.rand() * 0.03;
        const vol = clamp(0.05 + amp * 0.03 + P.rand() * 0.015, 0.05, 0.12) * duckNow;
        P.def._felt(A, H.chordTone(idx, big ? -1 : lift), {
          at, vol: big ? vol * 1.6 : vol, pan: xf * 2 - 1, dur: big ? 2.6 : 1.5, big
        });
      });
    };
    tryDrop(0, inp.L); tryDrop(1, inp.R);
    // ---- flick = one placed drop: bigger, lower, louder, at your storm cell ----
    for (const [side, flick] of [[0, flickL], [1, flickR]]) {
      if (!flick) continue;
      const cc = side === 0 ? s.ccL : s.ccR;
      const lo = side === 0 ? 0.02 : 0.52, hi = side === 0 ? 0.48 : 0.98;
      const xf = clamp(cc + (P.rand() - 0.5) * 0.08, lo, hi);
      const y = (Hh * (0.3 + P.rand() * 0.4)) | 0;
      dropAt(side, xf, y, 3.4 + P.rand() * 0.8, true);
      P.ping(A => {
        P.def._felt(A, H.chordTone(P.def._CELL[H.step % P.def._CELL.length][P.rand() * 3 | 0], 0), {
          at: A.t() + 0.005, vol: 0.15 * duckNow, pan: xf * 2 - 1, dur: 2.6, big: true
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
        P.ping(A => {
          const at = A.t() + 0.02;
          // browser color only — mirrored booms were doubling the kick lane
          A.hit({ vol: 0.5, dur: 2.0, freq: 90, q: 0.6, type: 'lowpass', at, midi: false });
          A.hit({ vol: 0.22, dur: 3.5, freq: 210, q: 0.4, type: 'lowpass', at: at + 0.35, midi: false });
          A.tone(H.rootFreq(-2), { at, vol: 0.16, dur: 3.2, attack: 0.35, type: 'sine', rev: 0.6, midi: false });
          // the strike goes where it belongs: thunder one-shot on sfx 38
          if (typeof MOut !== 'undefined') MOut.sfxNote(38, 0.85, 3);
        });
        for (let i = 0; i < 8; i++) {
          const x = 0.02 + P.rand() * 0.96, y = 2 + (P.rand() * (Hh - 4)) | 0;
          dropAt(i % 2, clamp(x, i % 2 ? 0.52 : 0.02, i % 2 ? 0.98 : 0.48), y, 1.5 + P.rand() * 1.5, false);
        }
      }
    }
    s.flash = Math.max(0, s.flash - dt * 1.4);
    // ---- petrichor: stillness after the strike earns a golden answer ----
    if (s.petriArmed && s.vL < 0.18 && s.vR < 0.18) {
      s.petriArmed = false; s.petri = 1;
      P.ping(A => {
        const t0 = T.running ? T.next(0.5) : A.t() + 0.1;
        [5, 7, 6, 9, 8].forEach((ci, i) => {
          P.def._felt(A, H.chordTone(ci, 1), {
            at: t0 + i * (T.beat || 0.9) * 0.5, vol: 0.055 - i * 0.006, pan: (i - 2) * 0.35, dur: 2.2, big: true
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
        const eL = Math.max(0, clamp((l0 - r0) * 0.9 + (u0 - dn0) * 0.6, -0.06, 1) * 1.3);
        const eR = Math.max(0, clamp((l1 - r1) * 0.9 + (u1 - dn1) * 0.6, -0.06, 1) * 1.3);
        const gold = (eL + eR) * s.petri;
        d[i * 4]     = Math.min(255, bR + eL * WM[0] + eR * VI[0] + gold * 200);
        d[i * 4 + 1] = Math.min(255, bG + eL * WM[1] + eR * VI[1] + gold * 150);
        d[i * 4 + 2] = Math.min(255, bB + eL * WM[2] + eR * VI[2] + gold * 40);
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    // the summons charging: ember warmth rises from the floor of the pool
    const sc = (typeof SUMMON !== 'undefined') ? SUMMON.charge : 0;
    if (sc > 0.02) {
      const og2 = s.og; og2.save(); og2.globalCompositeOperation = 'lighter';
      const grd = og2.createLinearGradient(0, Hh, 0, Hh * 0.55);
      grd.addColorStop(0, `rgba(255,150,70,${sc * 0.22})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
      og2.fillStyle = grd; og2.fillRect(0, Hh * 0.55, W, Hh * 0.45); og2.restore();
    }
    g.imageSmoothingEnabled = true;
    g.drawImage(s.oc, 0, 0, w, h);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const sp of s.splashes) {
      const fade = (1 - sp.age) * (1 - sp.age);
      const r = (0.010 + sp.amp * 0.009) * w * (0.3 + sp.age * 1.1);
      const c = sp.side === 0 ? WM : VI;
      const gr = g.createRadialGradient(sp.x * w, sp.y * h, 0, sp.x * w, sp.y * h, r);
      gr.addColorStop(0, `rgba(255,244,230,${fade * 0.85})`);
      gr.addColorStop(0.3, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${fade * 0.55})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(sp.x * w - r, sp.y * h - r, r * 2, r * 2);
    }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [side, v] of [[0, s.vL], [1, s.vR]]) {
      const c = side === 0 ? WM : VI;
      const a = 0.05 + v * 0.13 + s.charge * 0.06 + s.glow * 0.3 + s.flash * 0.35;
      const cx = w * (side === 0 ? 0.24 : 0.76), rr = w * 0.42;
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
        '  STORM ' + (s.charge * 100 | 0) + '%' + (s.primed ? ' ⚡' : '') + '  ' + (H.label || ''), 8, h - 8);
    }
  },
  audio(A, P) {
    const self = this, s = P.state;
    const v = A.voice();
    v._noHold = true;   // the bed must NOT auto-mirror to texture — it was
                        // playing Lance's hand pan uninvited (V12)
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
      const inten = (s.vL + s.vR) / 2;
      if (inten < 0.05) return;
      [0, 1, 2, 3, 4].forEach((cj, i) => {
        self._felt(A, H.chordTone(cj, 0), {
          at: A.t() + i * 0.075, vol: 0.028 + inten * 0.055, pan: (i - 2) * 0.28, dur: 2.6, big: true
        });
      });
    });
    v.fadeIn(1, 1.2);
    let nextT = 0, lastIdx = -1, sfxHoldT = 0, stormOn = false, stormHoldT = 0;
    return {
      tick(inp) {
        const wet = (s.vL + s.vR) / 2;
        // KEY THE ABLETON RAIN, two recordings layered by intensity:
        // note 39 = forest rainfall, held all scene, volume rides sfx CC74;
        // note 40 = the thunderstorm, held only past ~55% wetness (release
        // below 45% — hysteresis so it never flutters), the Simpler's own
        // amp envelope does the walk-in/walk-out. Held notes re-issue every
        // 8s; managed offs keep them seamless. Browser patter = fallback.
        if (typeof MOut !== 'undefined') {
          // the piano breathes with the rain (Lance, V9): lead CC74 rides
          // wetness; the sweep's RANGE lives in Live's mapping Min/Max
          MOut.expr('lead', clamp(0.15 + wet * 1.1));
          MOut.expr('sfx', clamp(wet * 1.25));
          if (A.t() > sfxHoldT) { MOut.evNote('sfx', 78.7, 0.2, 0, 10); sfxHoldT = A.t() + 8; }
          if (!stormOn && wet > 0.55) stormOn = true;
          else if (stormOn && wet < 0.45) { stormOn = false; stormHoldT = 0; }
          if (stormOn && A.t() > stormHoldT) { MOut.evNote('sfx', 83.4, 0.24, 0, 10); stormHoldT = A.t() + 8; }
        }
        const open = 0.3 + 0.7 * wet;
        for (const dr of drones) A.set(dr.g.gain, dr.d.g * open, 0.3);
        A.set(filt.frequency, 400 + wet * 500, 0.3);
        A.set(rumble.gain, wet * wet * 0.06 + s.flash * 0.05, 0.3);
        jT -= 1 / 60;
        if (jT <= 0) { jT = 0.05 + Math.random() * 0.07; jL = 0.55 + Math.random() * 0.9; jR = 0.55 + Math.random() * 0.9; }
        // lulls duck the patter — quiet is really quiet
        A.set(patL.gain, s.vL * s.vL * 0.05 * jL * (0.35 + 0.65 * Math.min(1, s.gustL)), 0.06);
        A.set(patR.gain, s.vR * s.vR * 0.05 * jR * (0.35 + 0.65 * Math.min(1, s.gustR)), 0.06);
        A.set(spkL.gain, Math.max(0, s.vL - 0.55) * 0.06, 0.25);
        A.set(spkR.gain, Math.max(0, s.vR - 0.55) * 0.06, 0.25);
        // ---- the groove is SUMMONED (V13): without the master code this
        // scene is rain, piano and drone — the band only walks in for the
        // ~45s window, with a floor so there is always a pocket to jam over
        if (!T.running || !A.ctx) return;
        const sum = (typeof SUMMON !== 'undefined' && SUMMON.active) ? 1 : 0;
        const gate = sum ? Math.max(0.3, clamp((wet - 0.38) / 0.35)) : 0;
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
              // LANCE'S GROOVE (midi/140_drums_fun.mid), 8ths→16ths:
              // kicks with his velocities incl. the vel-16 ghost, snare on
              // the backbeat, his hats' loud/soft breathing. Fills dropped.
              const swing = T.beat * 0.03;                       // ~56%
              const KICKS = { 0: 1, 5: 0.13, 6: 1, 10: 1, 13: 1 };
              const HATV = [0.31, 0.14, 0.42, 0.11, 0.41, 0.07, 0.46, 0.10,
                            0.31, 0.14, 0.42, 0.11, 0.41, 0.07, 0.46, 0.10];
              const weak = st % 2 === 1;
              const at2 = nextT + (weak ? swing : 0);
              if (KICKS[st]) A.kick(at2, (0.05 + 0.14 * gate) * KICKS[st] * (0.92 + Math.random() * 0.16));
              if ((st === 4 || st === 12) && gate > 0.25)
                A.hit({ at: at2 + swing * 0.5, vol: 0.02 + 0.04 * gate, dur: 0.06, freq: 900, q: 1.3, type: 'bandpass' });
              if (bar % 4 === 3) {
                // TURNAROUND HATS (Lance): the one bar the grid slips into
                // TRIPLETS, riding the B♭→G walk
                if (st % 4 === 0 && gate > 0.2) for (let k = 0; k < 3; k++)
                  A.hat(nextT + k * T.beat / 3, { vol: (0.010 + 0.02 * gate) * [0.42, 0.2, 0.3][k] * 2.2 * (0.9 + Math.random() * 0.2) });
              } else if (weak ? gate > 0.5 : gate > 0.12)
                A.hat(at2, { vol: (0.010 + 0.02 * gate) * HATV[st] * 2.2 * (0.85 + Math.random() * 0.3) });
              // BASS SHAPE (Lance, V12): D · D · B♭ · B♭→G each 4-bar
              // phrase — the key leans away for a full bar before the walk
              // home, tracking the chord cycle underneath.
              const BB = H.rootFreq(-1) * Math.pow(2, 8 / 12), GG = H.rootFreq(-1) * Math.pow(2, 5 / 12);
              if (st === 0) {
                const ph = bar % 4;
                if (ph <= 1) A.bassNote(H.chordTone(0, -1), { at: nextT, vol: 0.04 + 0.07 * gate, dur: T.beat * 2.6 });
                else if (ph === 2) A.bassNote(BB, { at: nextT, vol: 0.042 + 0.072 * gate, dur: T.beat * 2.6 });
                else A.bassNote(BB, { at: nextT, vol: 0.045 + 0.075 * gate, dur: T.beat * 1.8 });
              }
              if (st === 8 && bar % 4 === 3) A.bassNote(GG, { at: nextT, vol: 0.045 + 0.075 * gate, dur: T.beat * 1.7 });
            }
          }
          nextT += stepDur;
        }
      },
      stop() { v.kill(); }
    };
  }
});
