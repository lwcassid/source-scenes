/* ============================================================
   PIECES 33–35 — ROUND THREE: STILLNESS, SEVERITY, SUBSTANCE
   ============================================================ */

/* ---------- SRC-33 · APNEA ---------- */
reg({
  id: 'SRC-33', title: 'Apnea', tech: 'STILLNESS CREATURE / MOVEMENT QUALITY',
  music: { bpm: 50, root: 52, mode: 'lydian', prog: [0, 1], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['STILLNESS IS INPUT', 'TRUST METER', 'BIOFEEDBACK', 'COMMUNION'],
  desc: 'Something lives in this dark, and it is watching your hands. It does not care where they are — only HOW they move. Jitter, and it darts to the far edge of the volume. Hold almost-still, and it drifts closer, one cautious length at a time, its tendrils testing the water. The stiller you stay, the more it trusts you, and trust is the music: one held tone becomes two, becomes a chord, becomes a slow bloom of harmony — until the creature rests in the space between your hands and sings. Move suddenly and it all scatters. The only scene you play by not playing.',
  interact: 'The first piece that reads movement QUALITY, not position. Your hands\' stillness builds trust (watch your own wisps: they flicker when you fidget — biofeedback). Trust brings the creature closer and adds harmonic voices. Sudden motion breaks everything. At full trust: communion — the creature settles between your hands and offers a melody. Deep-crowd counterprogramming: the person who wins this scene is the one who can be still at a festival.',
  sound: 'Trust ladder on a lydian pad: 1 voice at wary distance, 4 voices in full bloom, each fading in as trust crosses a quartile (Ableton: warm choir/glass pad, CC74 mapped from pad channel = trust). Communion: a gentle quantized melody of high chord tones — the creature\'s song (music box / celesta). Scatter: harmony collapses to a single low tone + a rush of noise like wings. Sub root throughout, very quiet. This scene should be nearly silent until someone earns it.',
  init(P) {
    P.state = {
      cx: 0.5, cy: 0.35, tx: 0.5, ty: 0.35,
      trust: 0, agit: 0, prevL: 0.5, prevR: 0.5,
      tendrils: Array.from({ length: 7 }, (_, i) => ({ a: i / 7 * TAU, ph: P.rand() * TAU, len: 0.5 + P.rand() * 0.5 })),
      scare: 0, songT: 0, lastNote: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // movement quality: velocity of both channels, smoothed
    const vel = (Math.abs(inp.L - s.prevL) + Math.abs(inp.R - s.prevR)) / Math.max(dt, 1e-4);
    s.prevL = inp.L; s.prevR = inp.R;
    s.agit += (Math.min(1, vel * 1.6) - s.agit) * Math.min(1, dt * 5);
    if (s.agit > 0.55 && s.trust > 0.1) {
      // startled: scatter
      s.scare = 1;
      s.trust = Math.max(0, s.trust - 0.35);
      s.tx = 0.1 + P.rand() * 0.8; s.ty = 0.08 + P.rand() * 0.2;
      P.ping(A => {
        A.hit({ vol: 0.14, dur: 0.4, freq: 2400, q: 0.6 });
        A.tone(H.rootFreq(-1), { vol: 0.1, dur: 2, type: 'sine', rev: 0.5 });
      });
    }
    s.scare *= Math.pow(0.05, dt);
    const still = 1 - Math.min(1, s.agit * 2.6);
    s.trust = clamp(s.trust + (still > 0.75 ? dt * 0.055 : still > 0.4 ? 0 : -dt * 0.12));
    // creature seeks the midpoint between the hands' heights as trust grows
    const homeY = 0.85 - ((inp.L + inp.R) / 2) * 0.6;
    const wary = 1 - s.trust;
    if (s.scare < 0.1) {
      s.tx += (lerp(s.tx, 0.5, 0.8) - s.tx) * dt;
      s.tx = lerp(s.tx, 0.5, dt * (0.1 + s.trust * 0.7));
      s.ty = lerp(s.ty, lerp(0.14, homeY, s.trust), dt * (0.1 + s.trust * 0.6));
    }
    const speed = 0.24 + s.scare * 3;
    s.cx += (s.tx - s.cx) * Math.min(1, dt * speed);
    s.cy += (s.ty - s.cy) * Math.min(1, dt * speed);
    // communion song
    if (s.trust > 0.9) {
      s.songT += dt;
      if (T.running && t - s.lastNote > T.beat) {
        s.lastNote = t;
        const seq = [4, 6, 7, 9, 7, 6][(s.songT * 1.3 | 0) % 6];
        P.ping(A => A.tone(H.chordTone(seq, 1), { at: A.q(0.5), vol: 0.07, dur: 1.6, type: 'sine', rev: 0.65, del: 0.2 }));
      }
    } else s.songT = 0;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(2,5,6,0.32)'; g.fillRect(0, 0, w, h);
    // your wisps — they flicker when you fidget (biofeedback)
    for (const [colX, v] of [[w * 0.18, inp.L], [w * 0.82, inp.R]]) {
      const topY = h * (0.85 - v * 0.6), gY = h * 0.92;
      const jit = s.agit * 8;
      g.strokeStyle = `rgba(150,220,210,${0.2 + s.agit * 0.3})`;
      g.lineWidth = 1.6;
      g.beginPath();
      for (let yy = gY; yy >= topY; yy -= (gY - topY) / 14 || 6) {
        const sway = Math.sin(yy * 0.02 + t * 1.4) * 4 + (Math.random() - 0.5) * jit;
        yy === gY ? g.moveTo(colX + sway, yy) : g.lineTo(colX + sway, yy);
      }
      g.stroke();
    }
    const cx = s.cx * w, cy = s.cy * h;
    const size = Math.min(w, h) * (0.03 + s.trust * 0.05);
    const glow = 0.3 + s.trust * 0.7;
    // aura at high trust
    if (s.trust > 0.5) {
      const ag = g.createRadialGradient(cx, cy, size, cx, cy, size * (5 + s.trust * 5));
      ag.addColorStop(0, `rgba(255,220,235,${(s.trust - 0.5) * 0.3})`);
      ag.addColorStop(1, 'rgba(255,220,235,0)');
      g.fillStyle = ag;
      g.beginPath(); g.arc(cx, cy, size * 10, 0, TAU); g.fill();
    }
    // tendrils
    for (const td of s.tendrils) {
      const wave = Math.sin(t * (1.1 + s.agit * 5) + td.ph);
      const a = td.a + Math.sin(t * 0.4 + td.ph) * 0.4;
      const len = size * (2.2 + td.len * 2.4) * (0.6 + s.trust * 0.5);
      g.strokeStyle = `rgba(140,235,225,${glow * 0.5})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(cx, cy);
      const midx = cx + Math.cos(a) * len * 0.5 + Math.cos(a + 1.6) * wave * size * 0.8;
      const midy = cy + Math.sin(a) * len * 0.5 + Math.sin(a + 1.6) * wave * size * 0.8;
      g.quadraticCurveTo(midx, midy, cx + Math.cos(a) * len, cy + Math.sin(a) * len + wave * 3);
      g.stroke();
      g.fillStyle = `rgba(200,255,245,${glow * 0.8})`;
      g.beginPath(); g.arc(cx + Math.cos(a) * len, cy + Math.sin(a) * len + wave * 3, 1.6, 0, TAU); g.fill();
    }
    // body
    const bg2 = g.createRadialGradient(cx - size * 0.2, cy - size * 0.25, 1, cx, cy, size * 1.6);
    bg2.addColorStop(0, `rgba(255,235,245,${0.85 * glow + 0.15})`);
    bg2.addColorStop(0.55, `rgba(255,170,200,${0.5 * glow})`);
    bg2.addColorStop(1, 'rgba(120,60,110,0)');
    g.fillStyle = bg2;
    g.beginPath(); g.arc(cx, cy, size * 1.6, 0, TAU); g.fill();
    // heartbeat
    const hb = Math.max(0, Math.sin(t * (1.4 + s.trust)));
    g.fillStyle = `rgba(255,250,252,${0.5 + hb * 0.5})`;
    g.beginPath(); g.arc(cx, cy, size * (0.4 + hb * 0.12), 0, TAU); g.fill();
    // trust meter
    g.fillStyle = 'rgba(170,230,220,0.75)'; g.font = '10px ui-monospace,monospace';
    g.fillText('TRUST ' + Math.round(s.trust * 100) + '%  ' + (s.agit > 0.4 ? '· TOO FAST' : s.trust > 0.9 ? '◆ COMMUNION' : 'BE STILL'), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 4, { type: 'triangle', gain: 0.0001, cutoff: 500 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2.4));
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.04);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => A.set(sub.frequency, H.rootFreq(-2), 2));
    v.fadeIn(1, 1.6);
    return {
      tick() {
        const s = P.state;
        // voices fade in by trust quartile
        pads.forEach((p, i) => {
          const on = s.trust > (i + 1) * 0.22;
          p.level(on ? 0.035 : 0.0001, 0.9);
          p.bright(300 + s.trust * 900, 0.6);
        });
        MOut.expr('pad', s.trust);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-34 · WHITE STUDY ---------- */
reg({
  id: 'SRC-34', title: 'White Study', tech: 'DATA MINIMAL / TEST PATTERN',
  music: { bpm: 120, root: 45, mode: 'aeolian', prog: [0], chordBars: 8 },
  tags: ['SEVERE', 'BLACK & WHITE', 'TIME DIVISION', 'SINE + CLICK'],
  desc: 'No color. No softness. No metaphor. White bars on black, sine tones, clicks, and the mathematics of a bar of time being divided in front of you. The left hand adds structure — from one lone bar to a dense lattice. The right hand divides time — whole notes splitting to halves, quarters, sixteenths, thirty-seconds, the geometry re-cutting itself on every subdivision. Through the nets it becomes pure architecture: hard white planes flickering in space. Between the warm scenes this one hits like ice water — the palate cleanser, and some people\'s favorite thing on the wall.',
  interact: 'L = structural density (1 bar → 48). R = time division (1/1 → 1/32) — every tick of the current division re-cuts a slice of the structure, so raising R makes the architecture itself vibrate faster. Both low: a single white line and a slow pulse, almost nothing, completely confident. Both high: strobing data-cathedral. Precision is the aesthetic: nothing here is organic, and that is the point.',
  sound: 'Ikeda rules: sine tones only (root octaves — severity, but still coherent with the wall), one click per tick (short 6ms noise burst), a sub pulse on the beat, and a 30-second sweep sine rising almost imperceptibly. Division rate = tick rate. In Ableton: route lead to a pure sine patch with NO reverb — bone dry — and perc clicks to a tight click sample. The dryness IS the sound design. (Contains brief strobe flashes.)',
  init(P) {
    P.state = { bars: [], lastTick: -1, flash: 0, scan: 0, seed: P.seed };
    this._recut(P, 6);
  },
  _recut(P, n) {
    const s = P.state;
    s.bars = [];
    for (let i = 0; i < n; i++) {
      s.bars.push({
        x: P.rand(), w2: 0.002 + P.rand() * P.rand() * 0.05,
        y0: P.rand() < 0.75 ? 0 : P.rand() * 0.5,
        y1: 1 - (P.rand() < 0.75 ? 0 : P.rand() * 0.5),
        neg: P.rand() < 0.12
      });
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const density = Math.max(1, Math.round(1 + inp.L * 47));
    const divPow = Math.round(inp.R * 5); // 0..5 → 1/1 .. 1/32
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
    // strobe frame
    if (s.flash > 0.65) { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); }
    g.fillStyle = s.flash > 0.65 ? '#000' : '#fff';
    for (const b of s.bars) {
      if (b.neg && s.flash <= 0.65) continue;
      g.fillRect(b.x * w, b.y0 * h, Math.max(1, b.w2 * w), (b.y1 - b.y0) * h);
    }
    // scan line + data strip
    g.fillStyle = s.flash > 0.65 ? '#000' : 'rgba(255,255,255,0.8)';
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
        MOut.expr('lead', P.state.div / 32);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-35 · FERROUS INK ---------- */
reg({
  id: 'SRC-35', title: 'Ferrous Ink', tech: 'LIQUID METAL / TWO POLES',
  music: { bpm: 56, root: 45, mode: 'aeolian', prog: [0, 3], chordBars: 4 },
  fx: { edge: true },
  tags: ['SUBSTANCE', 'MAGNETIC POLES', 'TEAR + SLAM', 'ONE GRANULAR VOICE'],
  desc: 'A single body of liquid metal floating in the dark — not particles, not lines: a substance, viscous and whole, with a molten sheen. Each hand is a magnetic pole. Raise one and the mass leans, stretches, pours itself toward it. Raise both and the body is TORN — it necks, strains, and splits into two trembling drops, each orbiting a hand. Drop your hands and the halves rush back together and SLAM into one, wobbling like mercury. There is only one object in this scene, and after ten seconds nobody believes it\'s a screen.',
  interact: 'L = pull of the west pole, R = east. The mass always wants to be whole; you are the argument against that. The tear is the payoff going out, the slam is the payoff coming back — and the sound is one continuous granular voice that stretches when the metal stretches and booms when it reunites. Pure material embodiment: no score, no goal, just a substance that obeys you.',
  sound: 'ONE voice, continuous, physical: a granular drone whose pitch bends DOWN as the body stretches (tension = lower, like pulled taffy), grain scatter widening as it necks. The tear: a fabric-rip transient + the voice splitting into two detuned halves, hard-panned to the poles. The slam: sub boom + the halves snapping back to unison. In Ableton: granular pad (Granulator) with CC74 mapped to grain spread — the pad channel streams the stretch. Sidechain nothing; this scene is one instrument, played by pulling.',
  init(P) {
    const a = areaScale(P);
    const n = Math.min(2600, Math.round(1300 * a));
    const parts = [];
    for (let i = 0; i < n; i++) {
      const aa = P.rand() * TAU, rr = Math.sqrt(P.rand());
      parts.push({
        u: P.rand(),                       // which lobe this flesh belongs to
        ox: Math.cos(aa) * rr * 0.16, oy: Math.sin(aa) * rr * 0.115,
        x: 0.5, y: 0.52, vx: 0, vy: 0, wob: P.rand() * TAU
      });
    }
    const oc = document.createElement('canvas');
    oc.width = Math.max(2, P.w >> 1); oc.height = Math.max(2, P.h >> 1);
    const mc = document.createElement('canvas');
    mc.width = P.w; mc.height = P.h;
    P.state = { parts, oc, og: oc.getContext('2d'), mc, mg: mc.getContext('2d'), split: false, elong: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const poles = [
      { x: 0.24, y: 0.82 - inp.L * 0.6, s: inp.L },
      { x: 0.76, y: 0.82 - inp.R * 0.6, s: inp.R }
    ];
    s.poles = poles;
    // deformable body: two lobes, each drawn toward its pole; flesh between forms the neck
    const cx0 = 0.5, cy0 = 0.52;
    const lobeL = { x: lerp(cx0, poles[0].x, poles[0].s * 0.82), y: lerp(cy0, poles[0].y, poles[0].s * 0.82) };
    const lobeR = { x: lerp(cx0, poles[1].x, poles[1].s * 0.82), y: lerp(cy0, poles[1].y, poles[1].s * 0.82) };
    const squeeze = 1 - 0.25 * ((poles[0].s + poles[1].s) / 2);
    for (const p of s.parts) {
      const k = smooth(p.u);
      const wobX = Math.sin(t * 1.4 + p.wob) * 0.008;
      const wobY = Math.cos(t * 1.1 + p.wob * 2) * 0.008;
      const tx = lerp(lobeL.x, lobeR.x, k) + p.ox * squeeze + wobX;
      const ty = lerp(lobeL.y, lobeR.y, k) + p.oy * squeeze + wobY;
      // goopy spring: the flesh lags, overshoots, wobbles
      p.vx += (tx - p.x) * 26 * dt;
      p.vy += (ty - p.y) * 26 * dt;
      const damp = Math.pow(0.004, dt);
      p.vx *= damp; p.vy *= damp;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    const elong = clamp((Math.hypot(lobeR.x - lobeL.x, lobeR.y - lobeL.y) - 0.06) / 0.42);
    s.elong += (elong - s.elong) * Math.min(1, dt * 4);
    const nowSplit = s.elong > 0.62;
    if (nowSplit && !s.split) {
      // THE TEAR
      P.ping(A => {
        A.hit({ vol: 0.3, dur: 0.35, freq: 900, q: 0.5 });
        A.hit({ vol: 0.2, dur: 0.1, freq: 4200, q: 1 });
        A.bassNote(H.rootFreq(-1), { vol: 0.18, dur: 1 });
      });
    }
    if (!nowSplit && s.split) {
      // THE SLAM
      P.ping(A => {
        A.kick(0, 0.4);
        A.tone(H.rootFreq(-2), { vol: 0.24, dur: 2.4, attack: 0.01, type: 'sine', rev: 0.4 });
        A.bell(H.chordTone(2, 0), { vol: 0.1, dur: 3, rev: 0.6 });
      });
    }
    s.split = nowSplit;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const { oc, og, mc, mg } = s;
    if (mc.width !== w) { mc.width = w; mc.height = h; }
    // blob pass on TRANSPARENT ground — only the ink body has alpha
    og.clearRect(0, 0, oc.width, oc.height);
    og.fillStyle = 'rgba(255,255,255,0.9)';
    const pr = Math.max(3.5, oc.width * 0.014);
    for (const p of s.parts) {
      og.beginPath();
      og.arc(p.x * oc.width, p.y * oc.height, pr, 0, TAU);
      og.fill();
    }
    // intermediate: soft halo + solid body, then chrome tint clipped to the body
    mg.clearRect(0, 0, w, h);
    mg.save();
    mg.filter = 'blur(6px)';
    mg.drawImage(oc, 0, 0, w, h);
    mg.filter = 'none';
    mg.drawImage(oc, 0, 0, w, h);
    mg.restore();
    mg.save();
    mg.globalCompositeOperation = 'source-atop';
    const tint = mg.createLinearGradient(0, 0, 0, h);
    tint.addColorStop(0, 'rgba(240,244,252,0.96)');
    tint.addColorStop(0.45, 'rgba(150,165,195,0.95)');
    tint.addColorStop(1, 'rgba(38,48,84,0.98)');
    mg.fillStyle = tint;
    mg.fillRect(0, 0, w, h);
    mg.restore();
    g.fillStyle = '#030308'; g.fillRect(0, 0, w, h);
    g.drawImage(mc, 0, 0);
    // pole glints
    if (s.poles) {
      for (const pl of s.poles) {
        const gg = g.createRadialGradient(pl.x * w, pl.y * h, 1, pl.x * w, pl.y * h, 40);
        gg.addColorStop(0, `rgba(200,220,255,${0.25 + pl.s * 0.5})`);
        gg.addColorStop(1, 'rgba(200,220,255,0)');
        g.fillStyle = gg;
        g.beginPath(); g.arc(pl.x * w, pl.y * h, 40, 0, TAU); g.fill();
      }
    }
    g.fillStyle = 'rgba(170,185,215,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('STRAIN ' + Math.round(s.elong * 100) + '%' + (s.split ? '  ◆ TORN' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const o1 = v.osc('sawtooth', H.rootFreq(-1)), o2 = v.osc('sawtooth', H.rootFreq(-1));
    const f = v.filter('lowpass', 500, 2);
    const og2 = v.g(0.07);
    o1.connect(og2); o2.connect(og2); og2.connect(f); f.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.4; f.connect(s2); s2.connect(A.revIn); }
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.07);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => {
      A.set(sub.frequency, H.rootFreq(-2), 1.6);
    });
    v.fadeIn(1, 1.2);
    return {
      tick() {
        const s = P.state;
        // stretch bends the voice DOWN and splits it apart
        const bend = 1 - s.elong * 0.22;
        A.set(o1.frequency, H.rootFreq(-1) * bend, 0.15);
        A.set(o2.frequency, H.rootFreq(-1) * bend, 0.15);
        A.set(o2.detune, s.elong * 55, 0.2);
        A.set(o1.detune, -s.elong * 55, 0.2);
        A.set(f.frequency, 300 + s.elong * 1400, 0.2);
        MOut.expr('pad', s.elong);
      },
      stop() { v.kill(); }
    };
  }
});
