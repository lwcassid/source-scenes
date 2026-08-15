/* ---------- SRC-34.2 · WHITE STUDY V2 ---------- */
reg({
  id: 'SRC-34.2', family: 'SRC-34', ver: 2, title: 'White Study V2', tech: 'DATA MINIMAL / ETCHED PLATES',
  music: { bpm: 120, root: 45, mode: 'aeolian', prog: [0], chordBars: 8 },
  tags: ['SEVERE', 'BLACK & WHITE', 'ETCHED PLATES', 'TIME DIVISION', 'SINE + CLICK'],
  desc: 'No color. No softness added — but no longer emptiness either. The flat white bars are gone; in their place, cropped fragments of three etched plates (a hatched portrait, a sea-cave engraving, an asteroid-storm woodcut), chopped into the same rhythmic geometry that used to hold plain light. Sine tones, clicks, and the mathematics of a bar of time being divided in front of you — now the divisions carve up scavenged prints instead of blank rectangles. The left hand adds structure — from one lone bar to a dense lattice, each a different window onto the plates. The right hand divides time — whole notes splitting to eighths, the geometry re-cutting itself and re-sampling the plates on every subdivision. Through the nets it becomes a data-cathedral built out of stolen engravings.',
  interact: 'L = structural density (1 bar → 48), each a fresh crop of one of three etched plates; thin hairline bars stay flat white, the plates only reveal themselves once a bar is wide enough to read. R = time division (1/1 → 1/8) — the old top-end intensity, which used to live at 60% reach, now arrives exactly at full extension, so the whole slider throw does something instead of the last 40% going nowhere. Every tick of the current division re-cuts the lattice and re-samples the plates. Both low: a single etched sliver and a slow pulse. Both high: a strobing wall of inverted engravings. Precision is still the aesthetic — the imagery is raw material for the geometry, not a picture to look at.',
  sound: 'Ikeda rules: sine tones only (root octaves — severity, but still coherent with the wall), one click per tick (short 6ms noise burst), a sub pulse on the beat, and a 30-second sweep sine rising almost imperceptibly. Division rate = tick rate, now capped at 1/8 (the old 1/16–1/32 range is retired along with the top 40% of the R slider that used to reach it). In Ableton: route lead to a pure sine patch with NO reverb — bone dry — and perc clicks to a tight click sample. The dryness IS the sound design. (Contains brief strobe flashes.)',
  init(P) {
    P.state = { bars: [], lastTick: -1, flash: 0, scan: 0, seed: P.seed, imgs: [], imgsReady: false };
    this._loadImages(P);
    this._recut(P, 6);
  },
  _loadImages(P) {
    const s = P.state;
    const files = ['portrait-etching.jpg', 'cave-etching.jpg', 'asteroid-woodcut.jpg'];
    let remaining = files.length;
    files.forEach(fn => {
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
      img.src = 'assets/white-study/' + fn;
    });
  },
  _recut(P, n) {
    const s = P.state;
    s.bars = [];
    const nImgs = (s.imgs && s.imgs.length) || 1;
    for (let i = 0; i < n; i++) {
      const cw = 0.12 + P.rand() * 0.28;
      const ch = 0.12 + P.rand() * 0.28;
      const cx = P.rand() * (1 - cw);
      const cy = P.rand() * (1 - ch);
      s.bars.push({
        x: P.rand(), w2: 0.002 + P.rand() * P.rand() * 0.05,
        y0: P.rand() < 0.75 ? 0 : P.rand() * 0.5,
        y1: 1 - (P.rand() < 0.75 ? 0 : P.rand() * 0.5),
        neg: P.rand() < 0.12,
        img: Math.floor(P.rand() * nImgs),
        cw, ch, cx, cy
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
      s.flash = (tick % (4 * s.div) === 0) ? 1 : 0.25;
      const isBeat = tick % s.div === 0;
      P.ping(A => {
        A.hit({ vol: 0.09, dur: 0.006, freq: 8000, q: 0.4 });
        const oct = 1 + (tick % 3);
        A.tone(H.rootFreq(oct), { vol: 0.05, dur: 0.05, attack: 0.001, type: 'sine', rev: 0 });
        if (isBeat) A.tone(H.rootFreq(-2), { vol: 0.16, dur: 0.1, attack: 0.002, type: 'sine', rev: 0 });
      });
    }
    s.flash *= Math.pow(0.0005, dt);
    s.scan = (s.scan + dt * 0.13) % 1;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const flashing = s.flash > 0.65;
    if (flashing) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
    const solidFill = flashing ? '#000' : '#fff';
    const texMinPx = Math.max(6, w * 0.006);
    for (const b of s.bars) {
      if (b.neg && !flashing) continue;
      const bx = b.x * w, by = b.y0 * h, bw = Math.max(1, b.w2 * w), bh = (b.y1 - b.y0) * h;
      const img = s.imgsReady ? s.imgs[b.img % s.imgs.length] : null;
      if (img && bw >= texMinPx && bh >= texMinPx) {
        const src = flashing ? img.ci : img.c;
        g.drawImage(src, b.cx * img.w, b.cy * img.h, b.cw * img.w, b.ch * img.h, bx, by, bw, bh);
      } else {
        g.fillStyle = solidFill;
        g.fillRect(bx, by, bw, bh);
      }
    }
    // scan line + data strip
    g.fillStyle = flashing ? '#000' : 'rgba(255,255,255,0.8)';
    g.fillRect(0, s.scan * h, w, 1);
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
      tick() {
        const k = ((AE.t() - swStart) % 30) / 30;
        A.set(sw.frequency, H.rootFreq(0) * (1 + k * 3), 0.1);
        if (k > 0.99) swStart = AE.t();
        MOut.expr('lead', P.state.div / 8);
      },
      stop() { v.kill(); }
    };
  }
});
