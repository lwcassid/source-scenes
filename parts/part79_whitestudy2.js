/* ---------- SRC-34.2 · WHITE STUDY V2 ---------- */
reg({
  id: 'SRC-34.2', family: 'SRC-34', ver: 2, title: 'White Study V2', tech: 'DATA MINIMAL / ETCHED PLATES',
  music: { bpm: 120, root: 45, mode: 'aeolian', prog: [0], chordBars: 8 },
  tags: ['SEVERE', 'BLACK & WHITE', 'ETCHED PLATES', 'TIME DIVISION', 'SINE + CLICK'],
  desc: 'No color. No softness added — but no longer emptiness either. The flat white bars are gone; in their place, cropped fragments of three etched plates (a hatched portrait, a sea-cave engraving, an asteroid-storm woodcut), chopped into the same rhythmic geometry that used to hold plain light. Sine tones, clicks, and the mathematics of a bar of time being divided in front of you — now the divisions carve up scavenged prints instead of blank rectangles. The left hand adds structure — from one lone bar to a dense lattice, each a different window onto the plates. The right hand divides time — whole notes splitting to eighths, the geometry re-cutting itself and re-sampling the plates on every subdivision. Through the nets it becomes a data-cathedral built out of stolen engravings.',
  interact: 'L = structural density (1 bar → 48), each a fresh crop of one of three etched plates, AND tone brightness — the lowpass on every sine hit opens with L, so a sparse scene sounds muted and dark and a dense lattice rings out full and bright. Thin hairline bars stay flat white; the plates only reveal themselves once a bar is wide enough to read. R = time division (1/1 → 1/8) — the old top-end intensity, which used to live at 60% reach, now arrives exactly at full extension, so the whole slider throw does something instead of the last 40% going nowhere. Every tick of the current division re-cuts the lattice and re-samples the plates. Both low: a single dark etched sliver and a slow, muted pulse. Both high: a dense, bright-ringing wall of engravings. Underneath both hands, every 10 seconds the whole scene quietly inverts — black ground to white, white ground to black, plates flipping to their negative — holds, then reverts; a slow breathing swap, not a strobe, running on its own clock. Precision is still the aesthetic — the imagery is raw material for the geometry, not a picture to look at.',
  sound: 'Ikeda rules, with some velvet: every tone hit is a pair of detuned sines through a lowpass filter (rounder than a bare sine, no longer clinical) with a short slap-back echo baked in — one quiet repeat, no wash, no feedback tail. L opens the filter: closed and muted at rest, full and bright at max density. The click stays exactly as before — one dry 6ms noise burst per tick, no color, no echo — it is still the precision instrument; the tone is now the one with some body. A sub pulse lands on the beat, and a 30-second sweep sine rises almost imperceptibly underneath. Division rate = tick rate, capped at 1/8. In Ableton: route lead to a filtered dual-osc sine patch with a touch of slap delay (no reverb, no long tail), perc clicks stay dry and tight.',
  init(P) {
    P.state = { bars: [], lastTick: -1, seed: P.seed, imgs: [], imgsReady: false };
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
  // dual detuned sine through a lowpass (rounder than a bare sine) + a short manual slap-back echo
  _playTone(A, freq, { vol = 0.05, dur = 0.05, cutoff = 4000 } = {}) {
    if (!A.ctx) return;
    const t0 = A.t();
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
    // 0..3 → 1/1..1/8: the old ceiling (previously reached at R=0.6) now spans the FULL slider throw
    const divPow = Math.round(inp.R * 3);
    s.div = Math.pow(2, divPow);
    const beats = (P.focused && T.running) ? T.beats() : t * 2;
    const tick = Math.floor(beats * s.div / 4 * 4);
    if (tick !== s.lastTick) {
      s.lastTick = tick;
      this._recut(P, density);
      const isBeat = tick % s.div === 0;
      // L = brightness: dark/muted lowpass at rest, opens up toward a full bright tone as the lattice fills in
      const cutoff = 450 * Math.pow(13, inp.L);
      P.ping(A => {
        A.hit({ vol: 0.09, dur: 0.006, freq: 8000, q: 0.4 });
        const oct = 1 + (tick % 3);
        this._playTone(A, H.rootFreq(oct), { vol: 0.05, dur: 0.05, cutoff });
        if (isBeat) this._playTone(A, H.rootFreq(-2), { vol: 0.16, dur: 0.1, cutoff: cutoff * 0.5 });
      });
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    // slow autonomous invert/revert, independent of hands or tick rate — no strobe, just a held 10s swap
    const flashing = Math.floor(t / 10) % 2 === 1;
    if (flashing) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
    const solidFill = flashing ? '#000' : '#fff';
    const texMinPx = Math.max(6, w * 0.006);
    for (const b of s.bars) {
      if (b.neg && !flashing) continue;
      const bx = b.x * w, by = b.y0 * h, bw = Math.max(1, b.w2 * w), bh = (b.y1 - b.y0) * h;
      const img = s.imgsReady ? s.imgs[b.img % s.imgs.length] : null;
      if (img && bw >= texMinPx && bh >= texMinPx) {
        const src = flashing ? img.ci : img.c;
        // crop aspect always matches the bar's aspect — thin bars pull a thin sliver, never a stretched square
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
    g.fillStyle = flashing ? '#000' : 'rgba(255,255,255,0.8)';
    g.font = '9px ui-monospace,monospace';
    let str = '';
    const rr = mulberry32(s.lastTick * 7 + 3);
    for (let i = 0; i < 48; i++) str += (rr() * 16 | 0).toString(16).toUpperCase() + ' ';
    g.fillText(str, 8, h - 22);
    g.fillText('DIV 1/' + (s.div || 1) + '  N ' + s.bars.length + '  T ' + (s.lastTick || 0), 8, h - 8);
  },
  audio(A, P) {
    const v = A.voice();
    // the imperceptible riser: 30s sweep
    const sw = v.osc('sine', 220);
    const swg = v.g(0.015);
    sw.connect(swg); swg.connect(v.group);
    let swStart = AE.t();
    v.fadeIn(1, 0.4);
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
