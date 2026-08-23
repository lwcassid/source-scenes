/* ---------- SRC-34.8 · WHITE STUDY V8 ---------- */
reg({
  id: 'SRC-34.8', family: 'SRC-34', ver: 8, title: 'White Study V8', tech: 'DATA MINIMAL / INWARD FIELD + LATCHED KICK',
  music: {
    bpm: 120, root: 45, mode: 'aeolian', chordBars: 2,
    // A pedal the whole time — the root never moves, but the color walks a
    // 6-chord trance-minor cycle (i · i9 · bVI · i11 · bVII · i b13), 2 bars each.
    chords: [
      [0, 12, 15, 19, 22],   // Am7    · A A C E G
      [0, 12, 15, 22, 26],   // Am9    · A A C G B
      [0, 8, 15, 20, 24],    // F/A    · A F C F A — the bVI lift
      [0, 12, 17, 22, 27],   // Am11   · A A D G C
      [0, 10, 14, 22, 26],   // G/A    · A G B G B — the bVII pull home
      [0, 12, 15, 20, 26]    // Am b13 · A A C F B
    ],
    chordNames: ['Am7', 'Am9', 'F/A', 'Am11', 'G/A', 'Am♭13']
  },
  tags: ['SEVERE', 'ETCHED PLATES', 'INWARD FIELD', 'LATCHED KICK', 'THE CRASH'],
  desc: 'The field turned inside out: intensity lives AT the source now. Lean a hand in toward the sphere and the lattice thickens and brightens around you; withdraw and it thins to nothing — the far edge of the field is the quiet end, so a hand drifting out of tracking settles the scene instead of slamming it. Press BOTH hands deep and hold still and the crash builds — a rising wall of noise that cuts to one silent sixteenth and detonates on the next chord change, cymbal and kick together on beat one. Then the beat is YOURS: the kick latches for sixteen bars with your hands completely free, so you can actually drum — jab either hand at the source and the stab lands on the next sixteenth while the whole lattice pumps to every kick. The pink came back too: besides the two-hand summon, the inversion window now drifts through on its own every now and then while you play, rails first, one bar of hot pink, gone. And when nobody is there the scene finally RESTS — a dim lattice of slender plates breathing slowly, low bass breaths instead of clicks, the occasional ghost stab still teaching the verb.',
  interact: 'INWARD = MORE, both hands. L toward the source = structural density (1 bar → 48) AND brightness; R toward the source = groove density (1 step → all 16, beats first). JAB either hand IN at the source = stab on the next sixteenth (LEFT amber low, RIGHT violet high; force = jab size). JAB BOTH TOGETHER (within a quarter second) = SUMMON the pink window. THE CRASH: press both hands deep AND STILL for a quarter-second — the noise riser builds and the drop detonates on the next chord change (crash + kick on beat one). The kick then runs SIXTEEN BARS on its own — drum over it; press deep-and-still again to extend, walk away and it finishes the bar with one final accent. While you play, pink also visits uninvited about once a phrase. Idle: the scene rests — dim breathing plates, slow bass breaths, the autonomous pink cycle, ghost stabs.',
  sound: 'V7\'s club machine with the polarity flipped and the drop rebuilt. THE RISER IS A CRASH NOW: a looping white-noise sweep (bandpass 300→5200Hz) crescendos under thin detuned sines, cuts to one dead-silent sixteenth, and a highpassed noise CRASH lands sample-locked with the first kick — and the drop is TIMED: it always falls on the next 2-bar chord boundary at least one bar out, so beat one of the drop is also a chord change. THE LATCH: the kick no longer needs held hands — it runs 16 bars free (recommit extends, absence or expiry schedules the landing bar + final accent at 119 velocity), so stabs (cooldown down to 0.3s) become an actual drum performance over the four-on-the-floor, sidechain pump and all. THE REST: idle drops every click (idle highs are dead) — the bed sits at a whisper and randomized low bass breaths (55Hz swells, 1-in-7 a deeper two-voice toll) breathe the picture visibly; grid, hook and sub wake with presence. MIDI: crash → perc 49, breaths → bed ch12, rest unchanged.',
  // step-fill order: beats first, then offbeat 8ths, then 16ths (bit-reversed) —
  // any R value yields a machine-plausible groove, low R yields real silence
  _FILL: [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15],
  _BR8: [0, 4, 2, 6, 1, 5, 3, 7],   // per-step walk of the chord ladder
  _nSteps(r) { return 1 + Math.round(clamp(r) * 15); },
  init(P) {
    P.state = {
      bars: [], lastStep: -1, seed: P.seed, imgs: [], imgsReady: false,
      beats: 0, cutoff: 450, rank: [], stabs: [], age: 0,
      coolL: 0, coolR: 0, slowL: 0, slowR: 0,
      // inward field: eL/eR = presence-gated closeness, pres = anyone there at all
      eL: 0, eR: 0, pres: 0, breathVis: 0,
      // the drop state machine: off → build (pressed-in STILL commitment) → kick (latched)
      mode: 'off', buildStartBeat: 0, dropAtBeat: null, kickOn: false,
      kickEndBeat: null, kickUntilBeat: null, armTime: 0, dropCool: 0, lastKickBeat: -1,
      pump: 0, flash: 0, riser: null, lastBar: -1,
      // the pink window: summoned, uninvited (during play), or the idle breath
      win: null, summonCount: 0, lastStabAgeL: -9, lastStabAgeR: -9, teaseT: 8
    };
    this._FILL.forEach((st, i) => { P.state.rank[st] = i; });
    this._loadImages(P);
    this._recut(P, 9, true);
  },
  _loadImages(P) {
    const s = P.state;
    const files = [
      'assets/white-study/portrait-etching.jpg',
      'assets/white-study/cave-etching.jpg',
      'assets/white-study/asteroid-woodcut.jpg'
    ];
    let remaining = files.length;
    files.forEach(fp => {
      const img = new Image();
      const done = () => { if (--remaining === 0) s.imgsReady = s.imgs.length > 0; };
      img.onload = () => {
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const norm = document.createElement('canvas');
        norm.width = Math.max(1, Math.round(img.width * scale));
        norm.height = Math.max(1, Math.round(img.height * scale));
        const ng = norm.getContext('2d');
        ng.filter = 'grayscale(1) contrast(1.25) brightness(1.05)';
        ng.drawImage(img, 0, 0, norm.width, norm.height);
        const inv = document.createElement('canvas');
        inv.width = norm.width; inv.height = norm.height;
        const ig = inv.getContext('2d');
        ig.filter = 'invert(1)';
        ig.drawImage(norm, 0, 0);
        s.imgs.push({ c: norm, ci: inv, w: norm.width, h: norm.height });
        done();
      };
      img.onerror = done;
      img.src = fp;
    });
  },
  // dual detuned sine through a lowpass + one slap-back repeat; mirrors to MIDI.
  // `at` is an offset in seconds from now (0 = immediately).
  _playTone(A, freq, { vol = 0.05, dur = 0.05, cutoff = 4000, role = 'lead', at = 0 } = {}) {
    if (!A.ctx) return;
    const t0 = A.t() + at;
    MOut.evNote(role, freq, vol, t0, dur);
    const build = (att, v) => {
      const o1 = A.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
      const o2 = A.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq; o2.detune.value = 6;
      const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.5;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.0001, att);
      g.gain.linearRampToValueAtTime(v, att + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, att + dur);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(A.master);
      o1.start(att); o2.start(att); o1.stop(att + dur + 0.05); o2.stop(att + dur + 0.05);
    };
    build(t0, vol);
    build(t0 + 0.055, vol * 0.4); // slap-back: one quiet repeat, no feedback tail
  },
  // `rest` cuts PLATES, not data-bars: wide enough that every one clears the
  // texture cutoff even at the breath's narrowest — the resting scene is
  // etchings, never bare slivers. imgSeed resolves to an image AT DRAW TIME,
  // so a lattice cut before the files finish loading still gets its textures.
  _mkBar(P, rest) {
    return {
      x: P.rand(),
      w2: rest ? 0.010 + P.rand() * 0.028 : 0.002 + P.rand() * P.rand() * 0.05,
      y0: P.rand() < 0.75 ? 0 : P.rand() * 0.5,
      y1: 1 - (P.rand() < 0.75 ? 0 : P.rand() * 0.5),
      neg: !rest && P.rand() < 0.12,
      imgSeed: P.rand(),
      samp: 0.18 + P.rand() * 0.35, ax: P.rand(), ay: P.rand(),
      ph: P.rand() * TAU, rate: 0.25 + P.rand() * 0.3 // the rest-state breath
    };
  },
  _recut(P, n, rest) {
    const s = P.state;
    s.bars = [];
    for (let i = 0; i < n; i++) s.bars.push(this._mkBar(P, rest));
  },
  // schedule a pink inversion window: rails telegraph from armBeat, flip at
  // startBeat for one bar. Used by the summon, the uninvited visit, and idle.
  _openWin(P, armBeat, startBeat, seedMix) {
    const s = P.state;
    const wr = mulberry32(((s.seed + seedMix) | 0) >>> 0);
    const ww = 0.30 + wr() * 0.14;
    s.win = { armBeat, startBeat, endBeat: startBeat + 4, x: wr() * (1 - ww), w: ww };
  },
  // BOTH hands jabbed together — amber and violet landing at once — summon the
  // window: rails mark it immediately; it inverts on the next beat for one bar.
  _summon(P) {
    const s = P.state;
    const startBeat = T.running ? Math.ceil(s.beats + 1e-3) : s.beats + 0.001;
    s.summonCount++;
    this._openWin(P, s.beats, startBeat, s.summonCount * 977);
    P.ping(A => {
      // the summon announces as a bolder low-to-high roll
      [0, 2, 4].forEach((ci, i) => {
        this._playTone(A, H.chordTone(ci, 1), {
          vol: 0.05, dur: 0.3, cutoff: Math.max(1200, s.cutoff), role: 'bells', at: i * 0.06
        });
      });
    });
  },
  // a hand JABBED INWARD at the source = the player strikes. `tease` = the idle
  // ghost that demos the verb at a whisper while nobody is playing.
  _strike(P, side, vel, tease) {
    const s = P.state;
    if (!tease) {
      const otherAge = side === 'L' ? s.lastStabAgeR : s.lastStabAgeL;
      if (s.age - otherAge < 0.28 && !s.win) {
        s.lastStabAgeL = s.lastStabAgeR = -9;
        this._summon(P);
        return;
      }
      if (side === 'L') s.lastStabAgeL = s.age; else s.lastStabAgeR = s.age;
    }
    const atBeat = T.running ? Math.ceil(s.beats * 4 + 1e-3) / 4 : s.beats;
    s.stabs.push({
      side, atBeat, tease: !!tease,
      x: side === 'L' ? 0.05 + P.rand() * 0.40 : 0.55 + P.rand() * 0.40
    });
    P.ping(A => {
      const at = T.running ? Math.max(0, T.next(0.25) - A.t()) : 0;
      if (side === 'L') {
        // the human gets the hole: the low-mid band the machine leaves empty
        this._playTone(A, H.chordTone(0, 0), {
          vol: tease ? 0.035 : 0.10 + 0.06 * vel, dur: 0.35,
          cutoff: Math.max(900, s.cutoff), role: 'lead', at
        });
      } else {
        this._playTone(A, H.chordTone(2, 3), {
          vol: tease ? 0.03 : 0.07 + 0.05 * vel, dur: 0.12, cutoff: 6000, role: 'lead', at
        });
      }
    });
  },
  // THE RISER IS A CRASH: a looping noise sweep crescendos to the drop under
  // thin detuned sines, then one dead-silent 16th. Scheduled once with hard
  // ramps so it lands sample-exact; killed early if the player pulls out.
  _startRiser(P) {
    const s = P.state;
    P.ping(A => {
      if (!T.running) return;
      const t0 = A.t(), tDrop = T.t0 + s.dropAtBeat * T.beat;
      if (tDrop <= t0) return;
      const buf = A.ctx.createBuffer(1, A.ctx.sampleRate, A.ctx.sampleRate);
      const dd = buf.getChannelData(0);
      for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1;
      const src = A.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8;
      f.frequency.setValueAtTime(300, t0);
      f.frequency.exponentialRampToValueAtTime(5200, tDrop);
      const ng = A.ctx.createGain();
      ng.gain.setValueAtTime(0.006, t0);
      ng.gain.exponentialRampToValueAtTime(0.11, tDrop - 0.13);
      ng.gain.setValueAtTime(0.0001, tDrop - 0.12); // the last 16th is SILENT — the breath before the crash
      src.connect(f); f.connect(ng); ng.connect(A.master);
      src.start(t0); src.stop(tDrop);
      const o1 = A.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.setValueAtTime(110, t0);
      const o2 = A.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(110, t0); o2.detune.value = 7;
      o1.frequency.exponentialRampToValueAtTime(440, tDrop);
      o2.frequency.exponentialRampToValueAtTime(440, tDrop);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.008, t0);
      g.gain.linearRampToValueAtTime(0.035, tDrop - 0.13);
      g.gain.setValueAtTime(0.0001, tDrop - 0.12);
      o1.connect(g); o2.connect(g); g.connect(A.master);
      o1.start(t0); o2.start(t0); o1.stop(tDrop); o2.stop(tDrop);
      s.riser = { o1, o2, g, src, ng };
    });
  },
  _killRiser(P) {
    const s = P.state;
    if (!s.riser) return;
    P.ping(A => {
      try {
        for (const gn of [s.riser.g, s.riser.ng]) {
          if (!gn) continue;
          gn.gain.cancelScheduledValues(A.t());
          gn.gain.setValueAtTime(gn.gain.value, A.t());
          gn.gain.linearRampToValueAtTime(0.0001, A.t() + 0.1);
        }
        s.riser.o1.stop(A.t() + 0.15); s.riser.o2.stop(A.t() + 0.15);
        if (s.riser.src) s.riser.src.stop(A.t() + 0.15);
      } catch (e) {}
    });
    s.riser = null;
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.age += dt;
    // THE INWARD FIELD: closeness to the source is intensity, gated by real
    // presence — a hand drifting out of tracking eases the scene to rest
    // instead of pinning it at max (the field edge is a gentle state).
    const liveL = chan.L.mode === 'live', liveR = chan.R.mode === 'live';
    s.eL += ((liveL ? 1 - inp.L : 0) - s.eL) * Math.min(1, dt * (liveL ? 8 : 1.2));
    s.eR += ((liveR ? 1 - inp.R : 0) - s.eR) * Math.min(1, dt * (liveR ? 8 : 1.2));
    const live = (liveL || liveR) ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 2 : 0.6));
    // THE REST STATE is designed, not leftover: nine slender plates, dim,
    // breathing; presence clears the table and hands the density to the player
    const liveN = 1 + s.eL * 47;
    const density = Math.max(1, Math.round(9 + (liveN - 9) * s.pres));
    const n = this._nSteps(s.eR);
    s.nSteps = n;
    s.cutoff = 450 * Math.pow(13, s.eL);
    const beats = (P.focused && T.running) ? T.beats() : t * 2;
    s.beats = beats;
    // a lagging reference per hand: a jab is "dropped well below your own recent
    // average" — robust against the smoothing calibrated hardware applies
    const k4 = Math.min(1, dt * 4);
    s.slowL += (inp.L - s.slowL) * k4;
    s.slowR += (inp.R - s.slowR) * k4;
    const dInL = s.slowL - inp.L, dInR = s.slowR - inp.R; // positive = moving IN
    const still = Math.abs(dInL) < 0.05 && Math.abs(dInR) < 0.05;
    const commit = Math.min(liveL ? 1 - inp.L : 0, liveR ? 1 - inp.R : 0);
    s.dropCool -= dt;
    s.breathVis *= Math.pow(0.3, dt);
    // THE DROP state machine — armed by pressing IN and holding STILL; the
    // kick then LATCHES so the hands are free to drum
    if (P.focused && T.running && s.age > 0.7) {
      if (s.mode === 'off') {
        if (commit > 0.78 && still && s.dropCool <= 0) s.armTime += dt; else s.armTime = 0;
        if (s.armTime > 0.3) {
          s.armTime = 0;
          s.mode = 'build';
          s.buildStartBeat = beats;
          // land on the next 2-bar CHORD boundary at least a bar out — beat
          // one of the drop is also a chord change: the right moment
          const cyc = 8, nb = Math.ceil(beats / cyc) * cyc;
          s.dropAtBeat = (nb - beats < 4) ? nb + cyc : nb;
          this._startRiser(P);
        }
      } else if (s.mode === 'build') {
        if (commit < 0.5) {          // pulled back out mid-build: the drop is denied
          this._killRiser(P);
          s.mode = 'off'; s.dropAtBeat = null; s.dropCool = 1;
        } else if (beats >= s.dropAtBeat) {
          s.mode = 'kick'; s.kickOn = true; s.riser = null;
          s.kickEndBeat = s.dropAtBeat + 64;   // SIXTEEN BARS, hands free
          s.kickUntilBeat = null;
          s.flash = 1;               // the drop hits the room as one white blast
          this._recut(P, density);
        }
      } else if (s.mode === 'kick') {
        if (commit > 0.78 && still && beats > s.dropAtBeat + 4) {
          // press deep-and-still again: the latch extends, no ceremony
          s.kickEndBeat = Math.max(s.kickEndBeat, Math.ceil(beats / 8) * 8 + 64);
        }
        if (s.kickUntilBeat === null && s.pres < 0.25) {
          // walked away: finish the bar, one final accented hit on the next head
          s.kickUntilBeat = Math.ceil(beats / 4) * 4;
        } else if (s.kickUntilBeat === null && beats >= s.kickEndBeat - 1e-3) {
          s.kickUntilBeat = s.kickEndBeat; // the window expires on a chord boundary
        } else if (s.kickUntilBeat !== null && s.kickUntilBeat < s.kickEndBeat && commit > 0.78) {
          s.kickUntilBeat = null;    // came back before the bar ended: keep riding
        } else if (s.kickUntilBeat !== null && beats > s.kickUntilBeat + 0.1) {
          s.mode = 'off'; s.kickOn = false; s.kickUntilBeat = null;
          s.dropAtBeat = null; s.kickEndBeat = null; s.dropCool = 2;
        }
      }
    } else if (s.mode !== 'off') {
      this._killRiser(P);
      s.mode = 'off'; s.kickOn = false; s.kickUntilBeat = null;
      s.dropAtBeat = null; s.kickEndBeat = null;
    }
    // the kick pumps the whole lattice on every beat
    if (s.kickOn) {
      const kb = Math.floor(beats);
      if (kb !== s.lastKickBeat) { s.lastKickBeat = kb; s.pump = 1; }
    }
    s.pump *= Math.pow(0.001, dt);
    s.flash *= Math.pow(0.0001, dt);
    // eL reads IMMEDIATELY: the lattice grows/prunes live between re-cuts
    if (s.bars.length < density) {
      const add = Math.min(3, density - s.bars.length);
      for (let i = 0; i < add; i++) s.bars.push(this._mkBar(P));
    } else if (s.bars.length > density + 1) {
      s.bars.length = density;
    }
    // rhythmic pulse: the full re-cut lands only on steps that SOUND — except
    // during a build (every 16th) — and at REST only every fourth bar
    const stv = Math.floor(beats * 4);
    if (stv !== s.lastStep) {
      s.lastStep = stv;
      const st = ((stv % 16) + 16) % 16;
      const resting = s.pres < 0.15;
      if (resting ? (st === 0 && Math.floor(beats / 4) % 4 === 0)
                  : (s.mode === 'build' || s.rank[st] < n)) this._recut(P, density, resting);
    }
    // THE UNINVITED PINK: while someone plays, the window also visits on its
    // own about once a phrase — rails one beat ahead, one bar of inversion
    const barIdx = Math.floor(beats / 4);
    if (barIdx !== s.lastBar) {
      s.lastBar = barIdx;
      if (!s.win && s.pres > 0.3 && s.mode !== 'build' && s.dropCool <= 0) {
        const wr = mulberry32(((s.seed + barIdx * 613) | 0) >>> 0);
        if (wr() < 0.17) this._openWin(P, barIdx * 4 + 3, barIdx * 4 + 4, barIdx * 389);
      }
    }
    // jabs (suppressed while arming/building — stillness owns that gesture)
    s.coolL -= dt; s.coolR -= dt;
    if (s.age > 0.7 && P.focused && s.mode !== 'build') {
      if (liveL && dInL > 0.14 && inp.L < 0.75 && s.coolL <= 0) { s.coolL = 0.3; this._strike(P, 'L', clamp((dInL - 0.14) / 0.2)); }
      if (liveR && dInR > 0.14 && inp.R < 0.75 && s.coolR <= 0) { s.coolR = 0.3; this._strike(P, 'R', clamp((dInR - 0.14) / 0.2)); }
    }
    // window expiry
    if (s.win && beats > s.win.endBeat + 0.05) s.win = null;
    // the idle tease: while nobody plays, the scene demos its own verbs —
    // a ghost stab every so often, at a whisper, mostly the low one
    if (P.focused && s.pres < 0.08) {
      s.teaseT -= dt;
      if (s.teaseT <= 0) {
        s.teaseT = 6 + P.rand() * 7;
        this._strike(P, P.rand() < 0.7 ? 'L' : 'R', 0.3, true);
      }
    } else {
      s.teaseT = Math.max(s.teaseT, 2);
    }
  },
  // one full pass of the composition; flipped = inside the inversion window
  _pass(P, g, w, h, flipped) {
    const s = P.state;
    g.fillStyle = flipped ? '#fff' : '#000'; g.fillRect(0, 0, w, h);
    const solidFill = flipped ? '#000' : '#fff';
    const texMinPx = Math.max(6, w * 0.006);
    const rest = 1 - s.pres;
    // resting the scene DIMS and breathes; the kick pump snaps it bright
    const lum = Math.min(1, 0.55 + 0.45 * s.pres + 0.12 * rest * Math.sin(s.age * 0.23)
      + 0.15 * s.breathVis + 0.3 * (s.pump || 0));
    g.globalAlpha = lum;
    for (const b of s.bars) {
      if (b.neg && !flipped) continue; // negatives live only inside the window
      const bx = b.x * w, by = b.y0 * h, bh = (b.y1 - b.y0) * h;
      const breath = 1 + rest * 0.35 * Math.sin(s.age * b.rate + b.ph);
      const bw = Math.max(1, b.w2 * w * breath * (1 + 0.55 * (s.pump || 0))); // kick pump breathes the lattice
      const img = s.imgs.length ? s.imgs[Math.floor(b.imgSeed * s.imgs.length) % s.imgs.length] : null;
      if (img && bw >= texMinPx && bh >= texMinPx) {
        const src = flipped ? img.ci : img.c;
        // crop aspect always matches the bar's aspect — thin bars pull a thin sliver
        const ar = bw / bh;
        let cropH = b.samp * img.h, cropW = cropH * ar;
        const fit = Math.min(1, img.w / cropW, img.h / cropH);
        cropW *= fit; cropH *= fit;
        const sx = b.ax * (img.w - cropW), sy = b.ay * (img.h - cropH);
        g.drawImage(src, sx, sy, cropW, cropH, bx, by, bw, bh);
      } else {
        g.fillStyle = solidFill;
        g.fillRect(bx, by, bw, bh);
      }
    }
    g.globalAlpha = 1;
    // data strip
    g.fillStyle = flipped ? '#000' : 'rgba(255,255,255,' + (0.5 + 0.3 * s.pres + 0.2 * (s.pump || 0)).toFixed(2) + ')';
    g.font = '9px ui-monospace,monospace';
    let str = '';
    const rr = mulberry32(s.lastStep * 7 + 3);
    for (let i = 0; i < 48; i++) str += (rr() * 16 | 0).toString(16).toUpperCase() + ' ';
    g.fillText(str, 8, h - 22);
    g.fillText('STEPS ' + (s.nSteps || 1) + '/16  N ' + s.bars.length + '  ' +
      (s.pres < 0.15 ? 'REST' : s.mode.toUpperCase()) +
      (s.kickOn && s.kickEndBeat ? ' ' + Math.max(0, Math.ceil((s.kickEndBeat - s.beats) / 4)) + 'b' : '') +
      '  ' + (H.label || ''), 8, h - 8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    this._pass(P, g, w, h, false);
    // THE WINDOW: summoned by the player, visiting uninvited once a phrase,
    // or breathing its idle 16-beat cycle when nobody is there.
    let flip = false, pre = 0, bandX = 0, bandW = 0;
    if (s.win) {
      bandX = s.win.x * w; bandW = s.win.w * w;
      if (s.beats < s.win.armBeat) { /* not yet telegraphed */ }
      else if (s.beats < s.win.startBeat) {
        pre = clamp((s.beats - s.win.armBeat) / Math.max(0.1, s.win.startBeat - s.win.armBeat));
      } else if (s.beats < s.win.endBeat) flip = true;
    } else if (s.pres < 0.15) {
      const cyc = 16;
      const bb = ((s.beats % cyc) + cyc) % cyc;
      const cycN = Math.floor(s.beats / cyc);
      const wr = mulberry32((cycN * 131 + 17) >>> 0);
      bandW = (0.30 + wr() * 0.14) * w;
      bandX = wr() * (w - bandW);
      if (bb >= 11 && bb < 12) pre = bb - 11;
      else if (bb >= 12) flip = true;
    }
    if (pre > 0) {
      // telegraph: rails and a faint wash where the window will stand
      g.fillStyle = 'rgba(255,20,147,' + (0.10 * pre).toFixed(3) + ')';
      g.fillRect(bandX, 0, bandW, h);
      g.fillStyle = 'rgba(255,20,147,' + (0.35 + 0.5 * pre).toFixed(3) + ')';
      const rail = Math.max(4, w * 0.003);
      g.fillRect(bandX - rail / 2, 0, rail, h);
      g.fillRect(bandX + bandW - rail / 2, 0, rail, h);
    } else if (flip) {
      g.save();
      g.beginPath(); g.rect(bandX, 0, bandW, h); g.clip();
      this._pass(P, g, w, h, true);
      // hot-pink multiply keeps the negative from blasting white through the mesh
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = '#ff1493';
      g.fillRect(bandX, 0, bandW, h);
      g.globalCompositeOperation = 'source-over';
      g.restore();
    }
    // the player's stabs — drawn LAST so they punch through the pink window.
    // Amber = left hand, violet = right; ghosts (idle teases) at half strength.
    for (const sb of s.stabs) {
      const age = s.beats - sb.atBeat;
      if (age < 0 || age > 0.9) continue;
      const a = (1 - age / 0.9) * (sb.tease ? 0.42 : 0.95);
      g.fillStyle = (sb.side === 'L'
        ? 'rgba(255,154,60,' : 'rgba(167,110,255,') + a.toFixed(3) + ')';
      const bw = Math.max(6, w * 0.008) * (0.6 + a * 0.4) * (1 + 0.4 * (s.pump || 0));
      g.fillRect(sb.x * w - bw / 2, 0, bw, h);
    }
    s.stabs = s.stabs.filter(sb => s.beats - sb.atBeat < 1);
    // while the kick runs, the room breathes white with it — a pulse, not a strobe
    if (s.kickOn && s.pump > 0.03) {
      g.fillStyle = 'rgba(255,255,255,' + (s.pump * 0.055).toFixed(3) + ')';
      g.fillRect(0, 0, w, h);
    }
    // the drop lands as one white blast (~100ms) — a strobe EVENT, not a strobe
    if (s.flash > 0.02) {
      g.fillStyle = 'rgba(255,255,255,' + (s.flash * 0.85).toFixed(3) + ')';
      g.fillRect(0, 0, w, h);
    }
  },
  audio(A, P) {
    const self = this, s = P.state;
    // THE BED — whisper-level chord-locked pedal, hand-coupled to closeness —
    // behind a DUCK gain the kick sidechains: the pump IS the house feel.
    const v = A.voice();
    const filt = A.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 600; filt.Q.value = 0.4;
    const duck = A.ctx.createGain(); duck.gain.value = 1;
    filt.connect(duck); duck.connect(v.group);
    const DR = [
      { i: 0, o: -1, g: 0.012 },  // root, 55Hz
      { i: 0, o: 0,  g: 0.006 },  // root, 110Hz — the reference pitch
      { i: 2, o: -1, g: 0.007 },  // chord color
      { i: 4, o: -1, g: 0.007 }   // chord color — this one moves the most
    ];
    const drones = DR.map(d => {
      const o = v.osc('triangle', H.chordTone(d.i, d.o));
      const g = v.g(0.0001);
      o.connect(g); g.connect(filt);
      return { o, g, d };
    });
    H.onChord(() => {
      for (const dr of drones) A.set(dr.o.frequency, H.chordTone(dr.d.i, dr.d.o), 0.18);
      if (s.pres > 0.15) [0, 2, 4].forEach((ci, i) => {
        self._playTone(A, H.chordTone(ci, 0), {
          vol: 0.04, dur: 0.25, cutoff: (s.cutoff || 900) * 0.8, role: 'bells', at: i * 0.07
        });
      });
    });
    v.fadeIn(1, 1.5);
    // the rest breath: a randomized low swell on its own clock — never a
    // metronome, 1-in-7 a deeper two-voice toll (the walk-toward payoff)
    const breathe = () => {
      if (!A.ctx) return;
      const t0 = A.t();
      const toll = Math.random() < 1 / 7;
      const vol = toll ? 0.07 + Math.random() * 0.03 : 0.035 + Math.random() * 0.02;
      const rise = 0.8 + Math.random() * 0.9, fall = 1.2 + Math.random() * 1.2;
      const freqs = toll ? [H.rootFreq(-1), H.chordTone(2, -1)] : [H.rootFreq(-1)];
      MOut.evNote('bed', freqs[0], vol, t0, rise + fall);
      freqs.forEach((fq, i) => {
        const o = A.ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = fq;
        const g = A.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol * (i ? 0.5 : 1), t0 + rise);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + rise + fall);
        o.connect(g); g.connect(A.master);
        o.start(t0); o.stop(t0 + rise + fall + 0.1);
      });
      s.breathVis = 1; // the sound visibly moves the picture
    };
    let nextT = 0, lastIdx = -1, breathT = 0;
    return {
      tick(inp) {
        const open = 0.35 + 0.65 * clamp(s.eL);
        for (const dr of drones) A.set(dr.g.gain, dr.d.g * open, 0.25);
        A.set(filt.frequency, 300 + (s.cutoff || 450) * 0.45, 0.2);
        if (!T.running || !A.ctx) return;
        const resting = s.pres < 0.12 && s.mode === 'off';
        // idle keeps its highs DEAD: no clicks, just the bed and slow breaths
        if (resting) {
          if (!breathT) breathT = A.t() + 2;
          if (A.t() > breathT) { breathe(); breathT = A.t() + 4 + Math.random() * 6; }
        } else breathT = 0;
        const stepDur = T.beat * 0.25;
        if (!nextT || nextT < A.t() - 0.05) nextT = T.next(0.25);
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const idx = Math.round((nextT - T.t0) / stepDur);
          if (idx > lastIdx) {
            lastIdx = idx;
            const st = ((idx % 16) + 16) % 16;
            const b = idx * 0.25;
            const tt = nextT, at = tt - A.t();
            const cutoff = 450 * Math.pow(13, clamp(s.eL));
            // kick runs while the latch holds, through the landing bar, plus
            // beats at/past dropAtBeat still inside the build's lookahead
            const kicking = (s.kickOn && (s.kickUntilBeat === null || b <= s.kickUntilBeat + 1e-4)) ||
                            (s.mode === 'build' && s.dropAtBeat !== null && b >= s.dropAtBeat);
            const building = s.mode === 'build' && s.dropAtBeat !== null && b < s.dropAtBeat;
            if (building) {
              // THE BUILD: 16th clicks crescendo and double to 32nds late —
              // and the last 16th before the drop is dead silence
              if (s.dropAtBeat - b > 0.26) {
                const prog = clamp((b - s.buildStartBeat) / Math.max(0.25, s.dropAtBeat - s.buildStartBeat));
                A.hit({ vol: 0.05 + prog * 0.07, dur: 0.006, freq: 8000, q: 0.4, at: tt });
                if (prog > 0.55) A.hit({ vol: 0.03 + prog * 0.05, dur: 0.005, freq: 9500, q: 0.4, at: tt + stepDur / 2 });
              }
            } else if (!resting && s.rank[st] < self._nSteps(s.eR)) {
              A.hit({ vol: 0.09, dur: 0.006, freq: 8000, q: 0.4, at: tt }); // machine-flat, by design
              if (st === 6 || st === 14) {
                // the hook: an authored figure on the offbeat 8ths — longer, a
                // touch louder, recolored by every chord. A melody, not a pattern.
                const hookDeg = [5, 6, 8, 6][((idx / 16) | 0) % 4];
                self._playTone(A, H.chordTone(hookDeg, 2), { vol: 0.06, dur: 0.13, cutoff, role: 'arp', at });
              } else {
                const vol = st === 0 ? 0.085 : st % 4 === 0 ? 0.062 : 0.045;
                // an octave above V3: the pattern lives up top, the mids stay empty
                self._playTone(A, H.chordTone(self._BR8[st % 8], 2), { vol, dur: 0.05, cutoff, role: 'arp', at });
              }
              // half-weight sub while the kick owns 55Hz
              if (st % 4 === 0) self._playTone(A, H.rootFreq(-2), { vol: kicking ? 0.09 : 0.16, dur: 0.1, cutoff: cutoff * 0.5, role: 'bass', at });
            }
            if (kicking && st % 4 === 0) {
              const isDrop = s.dropAtBeat !== null && Math.abs(b - s.dropAtBeat) < 1e-4;
              if (isDrop) {
                // THE CRASH — the riser's payoff, sample-locked to beat one
                const cb = A.ctx.createBuffer(1, A.ctx.sampleRate * 1.4 | 0, A.ctx.sampleRate);
                const cd = cb.getChannelData(0);
                for (let i = 0; i < cd.length; i++) cd[i] = Math.random() * 2 - 1;
                const cs = A.ctx.createBufferSource(); cs.buffer = cb;
                const cf = A.ctx.createBiquadFilter(); cf.type = 'highpass'; cf.frequency.value = 2600; cf.Q.value = 0.5;
                const cg = A.ctx.createGain();
                cg.gain.setValueAtTime(0.0001, tt);
                cg.gain.linearRampToValueAtTime(0.19, tt + 0.004);
                cg.gain.exponentialRampToValueAtTime(0.0001, tt + 1.2);
                cs.connect(cf); cf.connect(cg); cg.connect(A.master);
                cs.start(tt); cs.stop(tt + 1.3);
                MOut.evDrum(49, 0.22, tt);
              }
              const isLanding = s.kickUntilBeat !== null && Math.abs(b - s.kickUntilBeat) < 1e-4;
              const accent = st === 0 || isLanding || isDrop;
              const kvol = accent ? 0.32 : 0.27;
              const bf = H.rootFreq(-2);
              const o = A.ctx.createOscillator(); o.type = 'sine';
              o.frequency.setValueAtTime(bf * 3.1, tt);
              o.frequency.exponentialRampToValueAtTime(Math.max(30, bf * 0.98), tt + 0.055);
              const kg = A.ctx.createGain();
              kg.gain.setValueAtTime(0.0001, tt);
              kg.gain.linearRampToValueAtTime(kvol, tt + 0.0025);
              kg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.3);
              o.connect(kg); kg.connect(A.master); o.start(tt); o.stop(tt + 0.38);
              // scaled for MIDI so the accent survives v2v's clamp (119 vs ~100)
              MOut.evDrum(36, accent ? 0.24 : 0.19, tt);
              // the sidechain: the bed dips under every kick and recovers in ~0.24s
              try {
                duck.gain.setValueAtTime(1, Math.max(A.t(), tt - 0.004));
                duck.gain.linearRampToValueAtTime(0.6, tt + 0.02);
                duck.gain.linearRampToValueAtTime(1, tt + 0.24);
              } catch (e) {}
            }
          }
          nextT += stepDur;
        }
        MOut.expr('lead', s.eL); // closeness = brightness → Ableton filter on the player's channel
        MOut.expr('arp', s.eR);  // closeness = groove density → energy on the pattern's channel
      },
      stop() { self._killRiser(P); v.kill(); }
    };
  }
});
