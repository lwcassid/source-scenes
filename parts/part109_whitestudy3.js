/* ---------- SRC-34.3 · WHITE STUDY V3 ---------- */
reg({
  id: 'SRC-34.3', family: 'SRC-34', ver: 3, title: 'White Study V3', tech: 'DATA MINIMAL / ETCHED PLATES',
  music: {
    bpm: 120, root: 45, mode: 'aeolian', chordBars: 4,
    // A pedal the whole time — the root never moves, the color shifts over it.
    chords: [
      [0, 12, 15, 19, 22],   // A · A · C · E · G
      [0, 12, 15, 22, 26],   // A · A · C · G · B
      [0, 12, 17, 22, 27],   // A · A · D · G · C
      [0, 12, 15, 20, 26]    // A · A · C · F · B
    ],
    chordNames: ['Am7', 'Am9', 'Am11', 'Am♭13(9)']
  },
  tags: ['SEVERE', 'BLACK & WHITE', 'ETCHED PLATES', 'TIME DIVISION', 'SINE + CLICK'],
  desc: 'The metronome learns harmony. Same severe geometry — cropped fragments of three etched plates chopped into rhythmic bars over true black — but the tones are no longer bare root octaves: every tick now walks a chord ladder in bit-reversed order, over an A pedal whose color shifts Am7 → Am9 → Am11 → Am♭13 every four bars, so the same machine pattern keeps recoloring itself. And the inversion is no longer a flood. Instead of the whole canvas flashing to pink, a single tall WINDOW — about a third of the frame, standing somewhere new each pass — inverts and blushes for exactly one bar, the last bar of each chord, then releases on the downbeat the new chord arrives. The negatives hide inside it. One clock drives everything you see and everything you hear.',
  interact: 'L = structural density (1 bar → 48), each a fresh crop of one of three etched plates, AND tone brightness — the lowpass on every hit opens with L. R = time division (1/1 → 1/8); every tick re-cuts the lattice and advances the arpeggio, so R is also how fast the harmony is spelled out. Underneath both hands the scene runs one bar-locked clock: each chord lasts 4 bars; during bar 4 a vertical window inverts to the hot-pink negative (telegraphed one beat early by a pink pre-glow at its edges), and snaps back exactly when the chord changes. Both low: a lone dark sliver, a slow muted pulse, one quiet chord. Both high: a dense bright wall spelling the harmony in sixteenths. Precision is still the aesthetic — but now it is musical precision.',
  sound: 'Ikeda with a chord book. Every tone hit is still the V2 voice — detuned sine pair through a lowpass with one slap-back repeat, filter opened by L — but pitches come from H.chordTone over an A-pedal color cycle (Am7/Am9/Am11/Am♭13, 4 bars each, key pinned for sit-in players), walked in bit-reversed order [0,4,2,6,1,5,3,7]. Velocity is shaped, not flat: bar heads ring loudest, beats next, offbeats quiet — the CLICK alone stays machine-identical, by design. Each chord change gets a quiet low-to-high three-tone roll (the transition is audible as a moment). Sub pulse stays on the pedal root; the 30-second riser remains. MIDI mirror is complete again: ticks → lead ch1, sub → bass ch3, chord rolls → bells ch5, clicks → perc ch10, CC74 on lead = L. In Ableton: dual-osc sine with slap delay on lead, dry click on perc, and the chord roll wants a soft mallet patch on bells.',
  init(P) {
    P.state = { bars: [], lastTick: -1, seed: P.seed, imgs: [], imgsReady: false, beats: 0, cutoff: 450 };
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
  // dual detuned sine through a lowpass + one slap-back repeat; mirrors to MIDI (V2 forgot to)
  _playTone(A, freq, { vol = 0.05, dur = 0.05, cutoff = 4000, role = 'lead', at = 0 } = {}) {
    if (!A.ctx) return;
    const t0 = A.t() + at;
    MOut.evNote(role, freq, vol, t0, dur);
    const build = (at, v) => {
      const o1 = A.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
      const o2 = A.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq; o2.detune.value = 6;
      const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = 0.5;
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(v, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(A.master);
      o1.start(at); o2.start(at); o1.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
    };
    build(t0, vol);
    build(t0 + 0.055, vol * 0.4); // slap-back: one quiet repeat, no feedback tail
  },
  _recut(P, n) {
    const s = P.state;
    s.bars = [];
    const nImgs = (s.imgs && s.imgs.length) || 1;
    for (let i = 0; i < n; i++) {
      s.bars.push({
        x: P.rand(), w2: 0.002 + P.rand() * P.rand() * 0.05,
        y0: P.rand() < 0.75 ? 0 : P.rand() * 0.5,
        y1: 1 - (P.rand() < 0.75 ? 0 : P.rand() * 0.5),
        neg: P.rand() < 0.12,
        img: Math.floor(P.rand() * nImgs),
        samp: 0.18 + P.rand() * 0.35, ax: P.rand(), ay: P.rand()
      });
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const density = Math.max(1, Math.round(1 + inp.L * 47));
    const divPow = Math.round(inp.R * 3); // 0..3 → 1/1..1/8 across the full throw
    s.div = Math.pow(2, divPow);
    const beats = (P.focused && T.running) ? T.beats() : t * 2;
    s.beats = beats;
    const tick = Math.floor(beats * s.div / 4 * 4);
    if (tick !== s.lastTick) {
      s.lastTick = tick;
      this._recut(P, density);
      const isBeat = tick % s.div === 0;
      const isBarHead = tick % (4 * s.div) === 0;
      // L = brightness: dark/muted lowpass at rest, full bright at max density
      const cutoff = 450 * Math.pow(13, inp.L);
      s.cutoff = cutoff;
      P.ping(A => {
        A.hit({ vol: 0.09, dur: 0.006, freq: 8000, q: 0.4 }); // the click stays machine-flat, by design
        // bit-reversed walk of the chord ladder — same machine pattern, recolored by every chord
        const BR = [0, 4, 2, 6, 1, 5, 3, 7];
        const vol = isBarHead ? 0.085 : isBeat ? 0.062 : 0.045;
        this._playTone(A, H.chordTone(BR[tick % 8], 1), { vol, dur: 0.05, cutoff });
        if (isBeat) this._playTone(A, H.rootFreq(-2), { vol: 0.16, dur: 0.1, cutoff: cutoff * 0.5, role: 'bass' });
      });
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
      const bx = b.x * w, by = b.y0 * h, bw = Math.max(1, b.w2 * w), bh = (b.y1 - b.y0) * h;
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
    const rr = mulberry32(s.lastTick * 7 + 3);
    for (let i = 0; i < 48; i++) str += (rr() * 16 | 0).toString(16).toUpperCase() + ' ';
    g.fillText(str, 8, h - 22);
    g.fillText('DIV 1/' + (s.div || 1) + '  N ' + s.bars.length + '  T ' + (s.lastTick || 0) + '  ' + (H.label || ''), 8, h - 8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    this._pass(P, g, w, h, false);
    // ONE bar-locked clock: each chord holds 4 bars (16 beats); bar 4 is the
    // inverted phase, released exactly on the chord-change downbeat. The
    // inversion is a WINDOW (~1/3 of the frame, standing somewhere new each
    // cycle), not a full-canvas flood.
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
  },
  audio(A, P) {
    const v = A.voice();
    // the imperceptible riser: 30s sweep
    const sw = v.osc('sine', 220);
    const swg = v.g(0.015);
    sw.connect(swg); swg.connect(v.group);
    let swStart = AE.t();
    v.fadeIn(1, 0.4);
    // the chord change is audible as a moment: quiet low-to-high roll of the new color
    H.onChord(() => {
      const s = P.state;
      [0, 2, 4].forEach((ci, i) => {
        this._playTone(A, H.chordTone(ci, 0), {
          vol: 0.04, dur: 0.25, cutoff: (s.cutoff || 900) * 0.8, role: 'bells', at: i * 0.07
        });
      });
    });
    return {
      tick(inp) {
        const k = ((AE.t() - swStart) % 30) / 30;
        A.set(sw.frequency, H.rootFreq(0) * (1 + k * 3), 0.1);
        if (k > 0.99) swStart = AE.t();
        MOut.expr('lead', inp.L); // mirrors the browser's L-driven brightness for Ableton's filter
      },
      stop() { v.kill(); }
    };
  }
});
