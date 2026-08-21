/* ---------- SRC-34.6 · WHITE STUDY V6 ---------- */
reg({
  id: 'SRC-34.6', family: 'SRC-34', ver: 6, title: 'White Study V6', tech: 'DATA MINIMAL / GATED GRID + DROP',
  music: {
    bpm: 120, root: 45, mode: 'aeolian', chordBars: 2,
    // A pedal the whole time — the root never moves, but the color now walks a
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
  tags: ['SEVERE', 'ETCHED PLATES', 'GATED GRID', 'SINE + CLICK', 'THE DROP'],
  desc: 'The study earns its drop. Everything V5 built stays — the gated grid, the amber/violet stabs, the pedal bed, the continuous left hand — and two things deepen. The harmony now MOVES: six chord colors over the same unmoving A pedal, changing every two bars (the bVI and bVII lean in and resolve home — trance changes, spelled in sine), with a sparse two-note hook singing on the offbeat eighths once the groove is committed. And at the very top of the instrument there is now a DROP: throw BOTH hands wide and HOLD them there, and the machine starts to build — clicks accelerating, a tone rising, the lattice vibrating faster and faster — for a bar or two, then one silent sixteenth, then a root-tuned KICK lands on the downbeat and runs four-on-the-floor for as long as you stay wide. Back your hands off and it is gone. The kick exists nowhere else in the scene: maximum commitment is the only way in.',
  interact: 'L = structural density, continuous (1 bar → 48) AND brightness — lattice, lowpass and bed all open with L, instantly. R = groove density: how many of the bar\'s 16 steps sound, beats-first (1 → all 16). FLICK either hand outward = stab on the next sixteenth (LEFT amber + low tone, RIGHT violet + high ping; speed = force). NEW — THE DROP: hold BOTH hands wide (past ~80% reach) and a build starts, quantized to land on a bar head: accelerating clicks, a rising tone, the lattice re-cutting faster and faster, then one sixteenth of dead silence and the kick drops, four-on-the-floor, pumping the whole lattice on every beat. It runs while you hold both hands committed and collapses when you come down. Dropping your hands mid-build aborts it — the drop must be HELD into existence. The pink window still breathes on its own bar-locked clock, telegraphed a beat early. Idle: one quiet tick every two seconds over a barely-there drone.',
  sound: 'Ikeda goes to the club, reduced. Harmony: six-chord pedal cycle every 2 bars (Am7 → Am9 → F/A → Am11 → G/A → Am♭13) — the bed\'s color tones glide through it and a quiet chord roll marks each change, so the motion is audible without a single pad swell. Melody: steps 6 and 14 of the grid carry an authored two-note hook (longer, slightly louder dual-sine) that recolors with every chord — a figure, not a pattern. THE DROP: sustained both-hands commitment past 80% starts a build — 16th clicks crescendo and double to 32nds, a dual sine rises an octave — cut one sixteenth BEFORE the bar head (the silence is the trigger being pulled), then a pitch-dropping root-tuned kick (165→54Hz in 55ms, tight 0.3s tail) lands four-on-the-floor with the bar heads accented, layered over the beat sub. Abort the build by unclenching; the kick dies when commitment drops. MIDI: kick → perc ch10 note 36, everything else as V5; the build riser stays browser-side. In Ableton: the drop reads as note-36 four-on-the-floor arriving out of silence — sidechain the bed to it and the whole rig breathes.',
  // step-fill order: beats first, then offbeat 8ths, then 16ths (bit-reversed) —
  // any R value yields a machine-plausible groove, low R yields real silence
  _FILL: [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15],
  _BR8: [0, 4, 2, 6, 1, 5, 3, 7],   // per-step walk of the chord ladder
  _nSteps(r) { return 1 + Math.round(clamp(r) * 15); },
  init(P) {
    P.state = {
      bars: [], lastStep: -1, seed: P.seed, imgs: [], imgsReady: false,
      beats: 0, cutoff: 450, rank: [], stabs: [], age: 0,
      pL: undefined, pR: undefined, coolL: 0, coolR: 0,
      // the drop state machine: off → build (held commitment) → kick → off
      mode: 'off', buildStartBeat: 0, dropAtBeat: null, kickOn: false,
      dropCool: 0, lastKickBeat: -1, pump: 0, flash: 0, riser: null
    };
    this._FILL.forEach((st, i) => { P.state.rank[st] = i; });
    this._loadImages(P);
    this._recut(P, 6);
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
  _mkBar(P) {
    const s = P.state;
    const nImgs = (s.imgs && s.imgs.length) || 1;
    return {
      x: P.rand(), w2: 0.002 + P.rand() * P.rand() * 0.05,
      y0: P.rand() < 0.75 ? 0 : P.rand() * 0.5,
      y1: 1 - (P.rand() < 0.75 ? 0 : P.rand() * 0.5),
      neg: P.rand() < 0.12,
      img: Math.floor(P.rand() * nImgs),
      samp: 0.18 + P.rand() * 0.35, ax: P.rand(), ay: P.rand()
    };
  },
  _recut(P, n) {
    const s = P.state;
    s.bars = [];
    for (let i = 0; i < n; i++) s.bars.push(this._mkBar(P));
  },
  // a hand flicked outward = the player strikes: stab on the NEXT 16th.
  // The stab bar carries the SIDE LAW's color — amber left, violet right:
  // color on this wall means a human put it there.
  _stab(P, side, speed) {
    const s = P.state;
    const vel = Math.min(1, speed / 6);
    const atBeat = T.running ? Math.ceil(s.beats * 4 + 1e-3) / 4 : s.beats;
    s.stabs.push({
      side, atBeat,
      x: side === 'L' ? 0.05 + P.rand() * 0.40 : 0.55 + P.rand() * 0.40
    });
    P.ping(A => {
      const at = T.running ? Math.max(0, T.next(0.25) - A.t()) : 0;
      if (side === 'L') {
        // the human gets the hole: the low-mid band the machine leaves empty
        this._playTone(A, H.chordTone(0, 0), {
          vol: 0.10 + 0.06 * vel, dur: 0.35, cutoff: Math.max(900, s.cutoff), role: 'lead', at
        });
      } else {
        this._playTone(A, H.chordTone(2, 3), {
          vol: 0.07 + 0.05 * vel, dur: 0.12, cutoff: 6000, role: 'lead', at
        });
      }
    });
  },
  // the build's rising tone: scheduled once with hard ramps to the drop moment,
  // so it lands sample-exact; killed early if the player unclenches
  _startRiser(P) {
    const s = P.state;
    P.ping(A => {
      if (!T.running) return;
      const t0 = A.t(), tDrop = T.t0 + s.dropAtBeat * T.beat;
      if (tDrop <= t0) return;
      const o1 = A.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.setValueAtTime(110, t0);
      const o2 = A.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(110, t0); o2.detune.value = 7;
      o1.frequency.exponentialRampToValueAtTime(440, tDrop);
      o2.frequency.exponentialRampToValueAtTime(440, tDrop);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.012, t0);
      g.gain.linearRampToValueAtTime(0.055, tDrop - 0.13);
      g.gain.setValueAtTime(0.0001, tDrop - 0.12); // the last 16th is SILENT — that's the trigger being pulled
      o1.connect(g); o2.connect(g); g.connect(A.master);
      o1.start(t0); o2.start(t0); o1.stop(tDrop); o2.stop(tDrop);
      s.riser = { o1, o2, g };
    });
  },
  _killRiser(P) {
    const s = P.state;
    if (!s.riser) return;
    P.ping(A => {
      try {
        s.riser.g.gain.cancelScheduledValues(A.t());
        s.riser.g.gain.setValueAtTime(s.riser.g.gain.value, A.t());
        s.riser.g.gain.linearRampToValueAtTime(0.0001, A.t() + 0.1);
        s.riser.o1.stop(A.t() + 0.15); s.riser.o2.stop(A.t() + 0.15);
      } catch (e) {}
    });
    s.riser = null;
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.age += dt;
    const density = Math.max(1, Math.round(1 + inp.L * 47));
    const n = this._nSteps(inp.R);
    s.nSteps = n;
    s.cutoff = 450 * Math.pow(13, inp.L);
    const beats = (P.focused && T.running) ? T.beats() : t * 2;
    s.beats = beats;
    // THE DROP state machine: both hands held wide = build → kick; unclench = gone
    const commit = Math.min(inp.L, inp.R);
    s.dropCool -= dt;
    if (P.focused && T.running && s.age > 0.7) {
      if (s.mode === 'off' && commit > 0.78 && s.dropCool <= 0) {
        s.mode = 'build';
        s.buildStartBeat = beats;
        const nextBar = Math.ceil(beats / 4) * 4;
        // land on a bar head at least 3 beats out — a build needs room to mean it
        s.dropAtBeat = (nextBar - beats < 3) ? nextBar + 4 : nextBar;
        this._startRiser(P);
      } else if (s.mode === 'build') {
        if (commit < 0.5) {          // unclenched mid-build: the drop is denied
          this._killRiser(P);
          s.mode = 'off'; s.dropAtBeat = null; s.dropCool = 1;
        } else if (beats >= s.dropAtBeat) {
          s.mode = 'kick'; s.kickOn = true; s.riser = null;
          s.flash = 1;               // the drop hits the room as one white blast
          this._recut(P, density);
        }
      } else if (s.mode === 'kick' && commit < 0.45) {
        s.mode = 'off'; s.kickOn = false; s.dropAtBeat = null; s.dropCool = 2;
      }
    } else if (s.mode !== 'off') {
      this._killRiser(P);
      s.mode = 'off'; s.kickOn = false; s.dropAtBeat = null;
    }
    // the kick pumps the whole lattice on every beat
    if (s.kickOn) {
      const kb = Math.floor(beats);
      if (kb !== s.lastKickBeat) { s.lastKickBeat = kb; s.pump = 1; }
    }
    s.pump *= Math.pow(0.001, dt);
    s.flash *= Math.pow(0.0001, dt);
    // L reads IMMEDIATELY: the lattice grows/prunes live between re-cuts,
    // so the left hand answers now instead of at the next sounding step
    if (s.bars.length < density) {
      const add = Math.min(3, density - s.bars.length);
      for (let i = 0; i < add; i++) s.bars.push(this._mkBar(P));
    } else if (s.bars.length > density + 1) {
      s.bars.length = density;
    }
    // rhythmic pulse: the full re-cut still lands only on steps that SOUND —
    // except during a build, where the lattice vibrates on every 16th
    const stv = Math.floor(beats * 4);
    if (stv !== s.lastStep) {
      s.lastStep = stv;
      const st = ((stv % 16) + 16) % 16;
      if (s.mode === 'build' || s.rank[st] < n) this._recut(P, density);
    }
    // flick detection (outward = strike); guarded against the open-scene inp jump
    if (s.pL === undefined) { s.pL = inp.L; s.pR = inp.R; }
    const dtc = Math.max(dt, 1e-3);
    const vlL = (inp.L - s.pL) / dtc, vlR = (inp.R - s.pR) / dtc;
    s.pL = inp.L; s.pR = inp.R;
    s.coolL -= dt; s.coolR -= dt;
    if (s.age > 0.7 && P.focused) {
      if (vlL > 2.0 && inp.L > 0.25 && s.coolL <= 0) { s.coolL = 0.5; this._stab(P, 'L', vlL); }
      if (vlR > 2.0 && inp.R > 0.25 && s.coolR <= 0) { s.coolR = 0.5; this._stab(P, 'R', vlR); }
    }
  },
  // one full pass of the composition; flipped = inside the inversion window
  _pass(P, g, w, h, flipped) {
    const s = P.state;
    g.fillStyle = flipped ? '#fff' : '#000'; g.fillRect(0, 0, w, h);
    const solidFill = flipped ? '#000' : '#fff';
    const texMinPx = Math.max(6, w * 0.006);
    for (const b of s.bars) {
      if (b.neg && !flipped) continue; // negatives live only inside the window
      const bx = b.x * w, by = b.y0 * h, bh = (b.y1 - b.y0) * h;
      const bw = Math.max(1, b.w2 * w * (1 + 0.16 * (s.pump || 0))); // kick pump breathes the lattice
      const img = s.imgsReady ? s.imgs[b.img % s.imgs.length] : null;
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
    // data strip
    g.fillStyle = flipped ? '#000' : 'rgba(255,255,255,0.8)';
    g.font = '9px ui-monospace,monospace';
    let str = '';
    const rr = mulberry32(s.lastStep * 7 + 3);
    for (let i = 0; i < 48; i++) str += (rr() * 16 | 0).toString(16).toUpperCase() + ' ';
    g.fillText(str, 8, h - 22);
    g.fillText('STEPS ' + (s.nSteps || 1) + '/16  N ' + s.bars.length + '  T ' + (s.lastStep || 0) + '  ' + (H.label || ''), 8, h - 8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    this._pass(P, g, w, h, false);
    // The window keeps its own 16-beat clock (chords now change every 8): bar 4
    // of every 4 is the inverted phase, still releasing exactly on a chord-change
    // downbeat. The inversion is a WINDOW (~1/3 of the frame), never a flood.
    const cyc = 16;
    const bb = ((s.beats % cyc) + cyc) % cyc;
    const cycN = Math.floor(s.beats / cyc);
    const wr = mulberry32((cycN * 131 + 17) >>> 0);
    const bandW = (0.30 + wr() * 0.14) * w;
    const bandX = wr() * (w - bandW);
    if (bb >= 11 && bb < 12) {
      // telegraph: one beat before the flip, the window's edges pre-glow pink
      const k = bb - 11;
      g.fillStyle = 'rgba(255,20,147,' + (0.10 * k).toFixed(3) + ')';
      g.fillRect(bandX, 0, bandW, h);
      g.fillStyle = 'rgba(255,20,147,' + (0.35 + 0.5 * k).toFixed(3) + ')';
      const rail = Math.max(4, w * 0.003);
      g.fillRect(bandX - rail / 2, 0, rail, h);
      g.fillRect(bandX + bandW - rail / 2, 0, rail, h);
    } else if (bb >= 12) {
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
    // the player's stabs — drawn LAST so they punch through the pink window
    // (V4 drew them under it and they vanished mid-flip). Amber = left hand,
    // violet = right: the side law, reserved for marks a human made.
    for (const sb of s.stabs) {
      const age = s.beats - sb.atBeat;
      if (age < 0 || age > 0.9) continue;
      const a = 1 - age / 0.9;
      g.fillStyle = (sb.side === 'L'
        ? 'rgba(255,154,60,' : 'rgba(167,110,255,') + (a * 0.95).toFixed(3) + ')';
      const bw = Math.max(6, w * 0.008) * (0.6 + a * 0.4);
      g.fillRect(sb.x * w - bw / 2, 0, bw, h);
    }
    s.stabs = s.stabs.filter(sb => s.beats - sb.atBeat < 1);
    // the drop lands as one white blast (~100ms) — a strobe EVENT, not a strobe
    if (s.flash > 0.02) {
      g.fillStyle = 'rgba(255,255,255,' + (s.flash * 0.85).toFixed(3) + ')';
      g.fillRect(0, 0, w, h);
    }
  },
  audio(A, P) {
    const self = this, s = P.state;
    // THE BED — the tooth for improvisers to bite on. Four whisper-level
    // triangle voices: pedal root at 55 and 110Hz plus two chord colors,
    // behind one gentle lowpass. Chord-locked (colors re-glide on every
    // change, root never moves) and hand-coupled (level + filter follow L)
    // — not autonomous, per the no-risers law.
    const v = A.voice();
    const filt = A.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 600; filt.Q.value = 0.4;
    filt.connect(v.group);
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
      // colors glide to the new chord over the pedal (≤0.2s, per the taste law)
      for (const dr of drones) A.set(dr.o.frequency, H.chordTone(dr.d.i, dr.d.o), 0.18);
      // and the change is audible as a moment: quiet low-to-high roll
      [0, 2, 4].forEach((ci, i) => {
        self._playTone(A, H.chordTone(ci, 0), {
          vol: 0.04, dur: 0.25, cutoff: (s.cutoff || 900) * 0.8, role: 'bells', at: i * 0.07
        });
      });
    });
    v.fadeIn(1, 1.5);
    // the pattern is scheduled on the AUDIO clock with a lookahead horizon —
    // a precision scene must not flam against its own MIDI clock
    let nextT = 0, lastIdx = -1;
    return {
      tick(inp) {
        // the bed answers the LEFT hand immediately, even between ticks:
        // reach out and it swells and brightens, come back and it recedes
        const open = 0.35 + 0.65 * clamp(inp.L);
        for (const dr of drones) A.set(dr.g.gain, dr.d.g * open, 0.25);
        A.set(filt.frequency, 300 + (s.cutoff || 450) * 0.45, 0.2);
        if (!T.running || !A.ctx) return;
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
            const cutoff = 450 * Math.pow(13, clamp(inp.L));
            const building = s.mode === 'build' && s.dropAtBeat != null && b < s.dropAtBeat;
            if (building) {
              // THE BUILD: 16th clicks crescendo and double to 32nds late —
              // and the last 16th before the drop is dead silence
              if (s.dropAtBeat - b > 0.26) {
                const prog = clamp((b - s.buildStartBeat) / Math.max(0.25, s.dropAtBeat - s.buildStartBeat));
                A.hit({ vol: 0.05 + prog * 0.07, dur: 0.006, freq: 8000, q: 0.4, at: tt });
                if (prog > 0.55) A.hit({ vol: 0.03 + prog * 0.05, dur: 0.005, freq: 9500, q: 0.4, at: tt + stepDur / 2 });
              }
            } else if (s.rank[st] < self._nSteps(inp.R)) {
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
              if (st % 4 === 0) self._playTone(A, H.rootFreq(-2), { vol: 0.16, dur: 0.1, cutoff: cutoff * 0.5, role: 'bass', at });
            }
            // THE KICK: root-tuned pitch-drop, four-on-the-floor, only while the
            // drop is held open. (Beats at/past dropAtBeat inside the build's
            // lookahead also fire, so the landing kick is never late.)
            const kicking = s.kickOn || (s.mode === 'build' && s.dropAtBeat != null && b >= s.dropAtBeat);
            if (kicking && st % 4 === 0) {
              const kvol = st === 0 ? 0.32 : 0.27;
              const bf = H.rootFreq(-2);
              const o = A.ctx.createOscillator(); o.type = 'sine';
              o.frequency.setValueAtTime(bf * 3.1, tt);
              o.frequency.exponentialRampToValueAtTime(Math.max(30, bf * 0.98), tt + 0.055);
              const kg = A.ctx.createGain();
              kg.gain.setValueAtTime(0.0001, tt);
              kg.gain.linearRampToValueAtTime(kvol, tt + 0.0025);
              kg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.3);
              o.connect(kg); kg.connect(A.master); o.start(tt); o.stop(tt + 0.38);
              MOut.evDrum(36, kvol, tt);
            }
          }
          nextT += stepDur;
        }
        MOut.expr('lead', inp.L); // L = brightness → Ableton filter on the player's channel
        MOut.expr('arp', inp.R);  // R = groove density → energy on the pattern's channel
      },
      stop() { self._killRiser(P); v.kill(); }
    };
  }
});
