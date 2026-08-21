/* ---------- SRC-34.7 · WHITE STUDY V7 ---------- */
reg({
  id: 'SRC-34.7', family: 'SRC-34', ver: 7, title: 'White Study V7', tech: 'DATA MINIMAL / GATED GRID + DROP',
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
  tags: ['SEVERE', 'ETCHED PLATES', 'GATED GRID', 'THE DROP', 'PINK IS YOURS'],
  desc: 'The pink belongs to the player now. Strike BOTH hands at once — amber and violet landing together — and they summon the inversion window: rails snap up where it will stand, and on the next beat a third of the frame flips hot pink for one bar. While hands are live that is the ONLY way pink happens; the scene breathes its old autonomous cycle only when nobody is playing, as its own advertisement. The drop grew manners: it arms only when both wide hands go STILL (flailing past the top no longer trips it), the bed now ducks under every kick so the whole mix pumps house-style, and letting go no longer kills the kick mid-bar — it finishes the bar and lands one final accented hit on the downbeat. Flick detection was rebuilt to survive real calibrated hardware, and when the scene sits idle it occasionally demonstrates a ghost stab — a faint colored hairline, a whisper of tone — teaching the verb to whoever is watching.',
  interact: 'L = structural density, continuous (1 bar → 48) AND brightness. R = groove density (1 step → all 16, beats first). FLICK either hand outward = stab on the next sixteenth (LEFT amber low, RIGHT violet high; force = flick size). STRIKE BOTH HANDS TOGETHER (within a quarter second) = SUMMON: pink rails mark the window, and on the next beat it inverts for one full bar — while you are playing, pink happens only when you call it. THE DROP: hold both hands wide AND STILL for a quarter-second — the build starts, lands on a bar head after one silent sixteenth, and the kick runs four-on-the-floor with the bed pumping under it. Ease off and it finishes the bar and lands a final accent on the downbeat; recommit before the bar ends and it keeps riding. Idle: one tick every two seconds, the autonomous pink breath, and the occasional ghost stab showing you how it is played.',
  sound: 'V6\'s club machine, mixed like a record. SIDECHAIN: a duck gain behind the bed dips to ~60% on every kick and recovers in a quarter second — the pedal drone pumps under the four-on-the-floor exactly the way the genre demands, and the beat sub drops to half weight while the kick runs so 55Hz never doubles up. THE LANDING: releasing the drop schedules kicks through the end of the current bar plus one accented hit on the next downbeat — no more mid-bar cliff. Kick MIDI velocities are scaled (accent 119, others ~100) so the browser\'s accent actually survives to Ableton instead of clamping flat. The SUMMON announces itself as a bolder low-to-high chord roll on bells. Stabs and teases: stab velocity follows flick size; idle ghost stabs whisper at vol 0.035. Everything else — gated grid, hook on steps 6/14, six-chord pedal cycle, chord rolls — is V6. MIDI: summon roll → bells ch5, kick → perc 36 with real velocity tiers, rest unchanged.',
  // step-fill order: beats first, then offbeat 8ths, then 16ths (bit-reversed) —
  // any R value yields a machine-plausible groove, low R yields real silence
  _FILL: [0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15],
  _BR8: [0, 4, 2, 6, 1, 5, 3, 7],   // per-step walk of the chord ladder
  _nSteps(r) { return 1 + Math.round(clamp(r) * 15); },
  init(P) {
    P.state = {
      bars: [], lastStep: -1, seed: P.seed, imgs: [], imgsReady: false,
      beats: 0, cutoff: 450, rank: [], stabs: [], age: 0,
      coolL: 0, coolR: 0, slowL: 0, slowR: 0, engage: 0,
      // the drop state machine: off → build (held STILL commitment) → kick → landing
      mode: 'off', buildStartBeat: 0, dropAtBeat: null, kickOn: false,
      kickUntilBeat: null, armTime: 0, dropCool: 0, lastKickBeat: -1,
      pump: 0, flash: 0, riser: null,
      // the player-owned window + the idle tease
      win: null, summonCount: 0, lastStabAgeL: -9, lastStabAgeR: -9, teaseT: 8
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
  // BOTH hands struck together — amber and violet landing at once — summon the
  // window: pink is the player's now. Rails mark it immediately; it inverts on
  // the next beat for one full bar.
  _summon(P) {
    const s = P.state;
    const startBeat = T.running ? Math.ceil(s.beats + 1e-3) : s.beats + 0.001;
    s.summonCount++;
    const wr = mulberry32(((s.seed + s.summonCount * 977) | 0) >>> 0);
    const ww = 0.30 + wr() * 0.14;
    s.win = { armBeat: s.beats, startBeat, endBeat: startBeat + 4, x: wr() * (1 - ww), w: ww };
    P.ping(A => {
      // the summon announces as a bolder low-to-high roll
      [0, 2, 4].forEach((ci, i) => {
        this._playTone(A, H.chordTone(ci, 1), {
          vol: 0.05, dur: 0.3, cutoff: Math.max(1200, s.cutoff), role: 'bells', at: i * 0.06
        });
      });
    });
  },
  // a hand flicked outward = the player strikes. `tease` = the idle ghost that
  // demos the verb at a whisper while nobody is playing.
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
    // a lagging reference per hand: a flick is "risen well above your own recent
    // average" — robust against the smoothing calibrated hardware applies,
    // where raw dv/dt thresholds silently never fire
    const k4 = Math.min(1, dt * 4);
    s.slowL += (inp.L - s.slowL) * k4;
    s.slowR += (inp.R - s.slowR) * k4;
    const dL = inp.L - s.slowL, dR = inp.R - s.slowR;
    const still = Math.abs(dL) < 0.05 && Math.abs(dR) < 0.05;
    // engagement (slow decay): while hands are live the pink is player-owned
    s.engage = Math.max(s.engage * Math.pow(0.5, dt / 2.5), inp.L, inp.R);
    const commit = Math.min(inp.L, inp.R);
    s.dropCool -= dt;
    // THE DROP state machine — armed by commitment AND stillness, ends with a landing
    if (P.focused && T.running && s.age > 0.7) {
      if (s.mode === 'off') {
        if (commit > 0.78 && still && s.dropCool <= 0) s.armTime += dt; else s.armTime = 0;
        if (s.armTime > 0.3) {
          s.armTime = 0;
          s.mode = 'build';
          s.buildStartBeat = beats;
          const nextBar = Math.ceil(beats / 4) * 4;
          // land on a bar head at least 3 beats out — a build needs room to mean it
          s.dropAtBeat = (nextBar - beats < 3) ? nextBar + 4 : nextBar;
          this._startRiser(P);
        }
      } else if (s.mode === 'build') {
        if (commit < 0.5) {          // unclenched mid-build: the drop is denied
          this._killRiser(P);
          s.mode = 'off'; s.dropAtBeat = null; s.dropCool = 1;
        } else if (beats >= s.dropAtBeat) {
          s.mode = 'kick'; s.kickOn = true; s.kickUntilBeat = null; s.riser = null;
          s.flash = 1;               // the drop hits the room as one white blast
          this._recut(P, density);
        }
      } else if (s.mode === 'kick') {
        if (s.kickUntilBeat === null && commit < 0.45) {
          // THE LANDING: finish the bar, one final accented hit on the next head
          s.kickUntilBeat = Math.ceil(beats / 4) * 4;
        } else if (s.kickUntilBeat !== null && commit > 0.78) {
          s.kickUntilBeat = null;    // recommitted before the bar ended: keep riding
        } else if (s.kickUntilBeat !== null && beats > s.kickUntilBeat + 0.1) {
          s.mode = 'off'; s.kickOn = false; s.kickUntilBeat = null;
          s.dropAtBeat = null; s.dropCool = 2;
        }
      }
    } else if (s.mode !== 'off') {
      this._killRiser(P);
      s.mode = 'off'; s.kickOn = false; s.kickUntilBeat = null; s.dropAtBeat = null;
    }
    // the kick pumps the whole lattice on every beat
    if (s.kickOn) {
      const kb = Math.floor(beats);
      if (kb !== s.lastKickBeat) { s.lastKickBeat = kb; s.pump = 1; }
    }
    s.pump *= Math.pow(0.001, dt);
    s.flash *= Math.pow(0.0001, dt);
    // L reads IMMEDIATELY: the lattice grows/prunes live between re-cuts
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
    // flicks (suppressed while arming/building — stillness owns that gesture)
    s.coolL -= dt; s.coolR -= dt;
    if (s.age > 0.7 && P.focused && s.mode !== 'build') {
      if (dL > 0.14 && inp.L > 0.25 && s.coolL <= 0) { s.coolL = 0.5; this._strike(P, 'L', clamp((dL - 0.14) / 0.2)); }
      if (dR > 0.14 && inp.R > 0.25 && s.coolR <= 0) { s.coolR = 0.5; this._strike(P, 'R', clamp((dR - 0.14) / 0.2)); }
    }
    // summoned window expiry
    if (s.win && beats > s.win.endBeat + 0.05) s.win = null;
    // the idle tease: while nobody plays, the scene demos its own verbs —
    // a ghost stab every so often, at a whisper
    if (P.focused && s.engage < 0.08) {
      s.teaseT -= dt;
      if (s.teaseT <= 0) {
        s.teaseT = 6 + P.rand() * 7;
        this._strike(P, P.rand() < 0.5 ? 'L' : 'R', 0.3, true);
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
    // THE WINDOW. While hands are live it exists only when SUMMONED (both
    // hands struck together); unattended, the scene breathes its old
    // autonomous bar-locked cycle as its own advertisement.
    let flip = false, pre = 0, bandX = 0, bandW = 0;
    if (s.win) {
      bandX = s.win.x * w; bandW = s.win.w * w;
      if (s.beats < s.win.startBeat) {
        pre = clamp((s.beats - s.win.armBeat) / Math.max(0.1, s.win.startBeat - s.win.armBeat));
      } else if (s.beats < s.win.endBeat) flip = true;
    } else if (s.engage < 0.15) {
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
    // THE BED — whisper-level chord-locked pedal, hand-coupled to L — now
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
      [0, 2, 4].forEach((ci, i) => {
        self._playTone(A, H.chordTone(ci, 0), {
          vol: 0.04, dur: 0.25, cutoff: (s.cutoff || 900) * 0.8, role: 'bells', at: i * 0.07
        });
      });
    });
    v.fadeIn(1, 1.5);
    let nextT = 0, lastIdx = -1;
    return {
      tick(inp) {
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
            // kick runs while the drop is held, through the landing bar, plus
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
              // half-weight sub while the kick owns 55Hz
              if (st % 4 === 0) self._playTone(A, H.rootFreq(-2), { vol: kicking ? 0.09 : 0.16, dur: 0.1, cutoff: cutoff * 0.5, role: 'bass', at });
            }
            if (kicking && st % 4 === 0) {
              const isLanding = s.kickUntilBeat !== null && Math.abs(b - s.kickUntilBeat) < 1e-4;
              const accent = st === 0 || isLanding;
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
        MOut.expr('lead', inp.L); // L = brightness → Ableton filter on the player's channel
        MOut.expr('arp', inp.R);  // R = groove density → energy on the pattern's channel
      },
      stop() { self._killRiser(P); v.kill(); }
    };
  }
});
