/* ============================================================
   SRC-23 · PENROSE COURT — for Roger, and for the tattoo
   ============================================================ */
reg({
  id: 'SRC-23', title: 'Penrose Court', tech: 'APERIODIC TILING / φ',
  music: { bpm: 60, root: 50, mode: 'lydian', prog: [0, 1, 4, 3], chordBars: 4 },
  fx: { bloom: 0.5, edge: true },
  tags: ['KITES & DARTS', 'GOLDEN RATIO', 'DEFLATION DEPTH', 'INCOMMENSURABLE LOOPS'],
  desc: 'A court tiled the way Penrose proved a plane could be: kites and darts locked in fivefold order that never once repeats. The left hand is deflation — raise it and every tile subdivides into smaller tiles in the golden ratio, generation inside generation. The right hand is a decagonal light that sweeps the court; tiles answer only when their orientation faces it, so the sweep plays the tiling like a ten-spoked instrument. At the center, drawn in the thinnest light, the impossible triangle — it only burns when both hands agree.',
  interact: 'L = deflation depth (the φ-subdivision cascade, coarse ancestors to fine descendants — each generation also lifts the arpeggios an octave). R = angle of the decagonal light; each of the ten orientation families rings one chord tone as the beam crosses it. Hold both hands high and matched to ignite the tribar.',
  sound: 'Two layers, per Eno: an on-grid layer (the orientation arpeggios — quantized 16ths, chord tones, one per tile family, pitched up with deflation depth) and a floating layer — two bell loops whose periods sit in the golden ratio (5.0s and 8.09s), so like the tiling they never re-align and never repeat. In Ableton: felt piano or celeste for the arpeggios (CH1), voice-led string pad (CH2), sub root (CH3); put the two φ-loops on their own return with 12s shimmer. The φ relationship is the piece: aperiodic geometry, aperiodic time.',
  _PHI: (1 + Math.sqrt(5)) / 2,
  _subdivide(tris) {
    const PHI = this._PHI, out = [];
    for (const t of tris) {
      const [c, ax, ay, bx, by, cx, cy] = t;
      if (c === 0) {
        const px = ax + (bx - ax) / PHI, py = ay + (by - ay) / PHI;
        out.push([0, cx, cy, px, py, bx, by], [1, px, py, cx, cy, ax, ay]);
      } else {
        const qx = bx + (ax - bx) / PHI, qy = by + (ay - by) / PHI;
        const rx = bx + (cx - bx) / PHI, ry = by + (cy - by) / PHI;
        out.push([1, rx, ry, cx, cy, ax, ay], [1, qx, qy, rx, ry, bx, by], [0, rx, ry, qx, qy, ax, ay]);
      }
    }
    return out;
  },
  init(P) {
    const cx = P.w / 2, cy = P.h / 2;
    const R = Math.hypot(P.w, P.h) * 0.62;
    let tris = [];
    for (let i = 0; i < 10; i++) {
      const a1 = (2 * i - 1) * Math.PI / 10 - Math.PI / 2;
      const a2 = (2 * i + 1) * Math.PI / 10 - Math.PI / 2;
      let b = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
      let c = [cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
      if (i % 2 === 0) [b, c] = [c, b];
      tris.push([0, cx, cy, b[0], b[1], c[0], c[1]]);
    }
    // pre-subdivide, snapshot levels
    for (let k = 0; k < 3; k++) tris = this._subdivide(tris);
    const levels = [];
    const maxLevels = P.focused || areaScale(P) > 1.4 ? 5 : 3;
    for (let k = 0; k < maxLevels; k++) {
      // annotate: orientation bin + centroid
      const anno = tris.map(t => {
        const [, ax, ay, bx, by, cxx, cyy] = t;
        const mx = (bx + cxx) / 2, my = (by + cyy) / 2;
        const ang = Math.atan2(my - ay, mx - ax);
        const bin = ((Math.round(ang / (Math.PI / 5)) % 10) + 10) % 10;
        return { c: t[0], ax, ay, bx, by, cx: cxx, cy: cyy, bin, gx: (ax + mx) / 2, gy: (ay + my) / 2 };
      });
      levels.push(anno);
      if (k < maxLevels - 1) tris = this._subdivide(tris);
    }
    P.state = { levels, lastBin: -1, lastDepth: -1, glow: new Float32Array(10), agree: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const maxIdx = s.levels.length - 1;
    s.depthF = inp.L * maxIdx;
    const depth = Math.round(s.depthF);
    const litBin = Math.min(9, Math.floor(inp.R * 9.999));
    s.litBin = litBin;
    for (let b = 0; b < 10; b++) s.glow[b] *= Math.pow(0.06, dt);
    s.glow[litBin] = Math.min(1, s.glow[litBin] + dt * 6);
    if (litBin !== s.lastBin) {
      s.lastBin = litBin;
      const oct = Math.round(s.depthF) - 1;
      P.ping(A => A.pluck2(H.chordTone((litBin % 5) + 2, oct), { at: A.q(), vol: 0.1, rev: 0.5, del: 0.2, pan: (litBin / 9) * 1.4 - 0.7 }));
    }
    if (depth !== s.lastDepth) {
      const rising = depth > s.lastDepth;
      s.lastDepth = depth;
      P.ping(A => {
        for (let k = 0; k < 3; k++) {
          A.tone(H.chordTone(3 + k * 2, depth - 1 + (rising ? 0 : 1)), { at: A.q() + k * 0.07, vol: 0.06, dur: 1.4, type: 'triangle', rev: 0.55 });
        }
      });
    }
    s.agree = (1 - Math.abs(inp.L - inp.R)) * ((inp.L + inp.R) / 2);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = '#060509'; g.fillRect(0, 0, w, h);
    const maxIdx = s.levels.length - 1;
    const i0 = Math.min(maxIdx, Math.floor(s.depthF));
    const frac = s.depthF - i0;
    const drawLevel = (tris, alpha) => {
      g.globalAlpha = alpha;
      for (let i = 0; i < tris.length; i++) {
        const tr = tris[i];
        const shade = (i * 2654435761 >>> 0) % 9;
        g.fillStyle = tr.c === 0
          ? `hsl(250,44%,${13 + shade}%)`
          : `hsl(272,40%,${20 + shade}%)`;
        g.beginPath();
        g.moveTo(tr.ax, tr.ay); g.lineTo(tr.bx, tr.by); g.lineTo(tr.cx, tr.cy);
        g.closePath(); g.fill();
      }
      if (tris.length < 1400) {
        g.strokeStyle = `rgba(212,180,110,${0.14 * alpha})`;
        g.lineWidth = 0.7;
        for (const tr of tris) {
          g.beginPath();
          g.moveTo(tr.ax, tr.ay); g.lineTo(tr.bx, tr.by); g.lineTo(tr.cx, tr.cy);
          g.closePath(); g.stroke();
        }
      }
      // lit families
      for (const tr of tris) {
        const gl = s.glow[tr.bin];
        if (gl < 0.04) continue;
        g.fillStyle = `hsla(46,92%,66%,${gl * 0.5 * alpha})`;
        g.beginPath();
        g.moveTo(tr.ax, tr.ay); g.lineTo(tr.bx, tr.by); g.lineTo(tr.cx, tr.cy);
        g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
    };
    drawLevel(s.levels[i0], 1);
    if (frac > 0.04 && i0 < maxIdx) drawLevel(s.levels[i0 + 1], frac * 0.9);
    // decagonal light spokes
    const cx = w / 2, cy = h / 2, Rr = Math.min(w, h) * 0.5;
    const ang = s.litBin * Math.PI / 5;
    g.strokeStyle = `rgba(255,230,160,${0.25 + s.glow[s.litBin] * 0.3})`;
    g.lineWidth = 1.2;
    g.shadowColor = '#ffe9b0'; g.shadowBlur = 10;
    g.beginPath();
    g.moveTo(cx - Math.cos(ang) * Rr, cy - Math.sin(ang) * Rr);
    g.lineTo(cx + Math.cos(ang) * Rr, cy + Math.sin(ang) * Rr);
    g.stroke();
    g.shadowBlur = 0;
    // the tribar — burns when both hands agree
    const k = s.agree * s.agree;
    if (k > 0.008) {
      const Rt = Math.min(w, h) * 0.16, u = Rt * 0.3;
      g.save();
      g.translate(cx, cy);
      g.lineJoin = 'round';
      for (let arm = 0; arm < 3; arm++) {
        const a0 = -Math.PI / 2 + arm * TAU / 3, a1 = -Math.PI / 2 + (arm + 1) * TAU / 3;
        const Vx = Math.cos(a0) * Rt, Vy = Math.sin(a0) * Rt;
        const Wx = Math.cos(a1) * Rt, Wy = Math.sin(a1) * Rt;
        const V2x = Math.cos(a0) * (Rt - u * 1.9), V2y = Math.sin(a0) * (Rt - u * 1.9);
        const W2x = Math.cos(a1 + 0.32) * (Rt - u * 1.9), W2y = Math.sin(a1 + 0.32) * (Rt - u * 1.9);
        g.fillStyle = `hsla(${20 + arm * 8},70%,${38 + arm * 14}%,${k * 0.55})`;
        g.beginPath();
        g.moveTo(Vx, Vy); g.lineTo(Wx, Wy); g.lineTo(W2x, W2y); g.lineTo(V2x, V2y);
        g.closePath(); g.fill();
        g.strokeStyle = `hsla(35,90%,72%,${k * 0.8})`;
        g.lineWidth = 1.2;
        g.stroke();
      }
      g.restore();
    }
    g.fillStyle = 'rgba(200,180,140,0.75)'; g.font = '10px ui-monospace,monospace';
    g.fillText('DEFLATION ' + s.depthF.toFixed(2) + '  FAMILY ' + s.litBin + '/10  φ ' + this._PHI.toFixed(6), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 4, { type: 'sawtooth', gain: 0.034, cutoff: 480, q: 0.5 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2));
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.06);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => A.set(sub.frequency, H.rootFreq(-2), 1.8));
    // two loops whose periods sit in the golden ratio — they never re-align
    const PHI = (1 + Math.sqrt(5)) / 2;
    let nextA = AE.t() + 1, nextB = AE.t() + 2.6;
    v.fadeIn(1, 1.6);
    return {
      tick(inp) {
        const now = AE.t();
        if (now >= nextA) { nextA += 5.0; A.bell(H.chordTone(4, 1), { vol: 0.05, dur: 4, rev: 0.75 }); }
        if (now >= nextB) { nextB += 5.0 * PHI; A.bell(H.chordTone(6, 1), { vol: 0.045, dur: 4.5, rev: 0.8, pan: 0.3 }); }
        pads.forEach(p => p.bright(300 + (inp.L + inp.R) * 700, 0.5));
      },
      stop() { v.kill(); }
    };
  }
});
