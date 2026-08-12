/* ============================================================
   PIECES 09–16
   ============================================================ */

/* ---------- SRC-09 · ATTRACTOR VESPERS ---------- */
reg({
  id: 'SRC-09', title: 'Attractor Vespers', tech: 'CLIFFORD MAP / DENSITY SMOKE',
  music: { bpm: 56, root: 50, mode: 'aeolian', prog: [0, 3], chordBars: 4 }, fx: { bloom: 0.5 },
  tags: ['STRANGE ATTRACTOR', 'PARAMETER BEND', 'ADDITIVE PLOT', 'SPECTRAL WASH'],
  desc: 'Four constants and a spark. The same point is thrown a hundred thousand times and lands as smoke, never twice in the same place, never once outside the figure. Your hands hold two of the constants; bend them and the whole apparition swims to a new anatomy without ever tearing.',
  interact: 'L bends constant a, R bends constant b of the Clifford map. The figure obeys instantly and totally — this is the purest "two numbers, infinite variety" demonstration in the library.',
  sound: 'A breath, not a melody: white noise through two parallel bandpasses whose centers track the attractor\'s horizontal and vertical spread (Ableton: two auto-filters on a noise loop, cutoffs CC-mapped). Underneath, a very quiet chord pad whose brightness follows total density. When a hand moves fast, add a subtle pitch-down doppler swoop (pitch-bend the pad −2st and recover). The piece should sound like the inside of a cathedral ventilation system.',
  init(P) {
    P.state = { x: 0.1, y: 0.1, c: 0.7 + P.rand() * 0.5, d: 0.55 + P.rand() * 0.5, spreadX: 1, spreadY: 1, first: true };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.a = -1.9 + inp.L * 0.85;
    s.b = 1.15 + inp.R * 0.85;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.first) { g.fillStyle = '#060806'; g.fillRect(0, 0, w, h); s.first = false; }
    g.fillStyle = 'rgba(6,8,6,0.14)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) * 0.27;
    let { x, y } = s;
    let sx = 0, sy = 0;
    // incense smoke whose color breathes with the constants
    const hue = 235 + s.a * 34 + s.b * 22;
    g.fillStyle = `hsla(${hue},48%,80%,0.34)`;
    const n = P.focused ? 12000 : 2600;
    for (let i = 0; i < n; i++) {
      const nx = Math.sin(s.a * y) + s.c * Math.cos(s.a * x);
      const ny = Math.sin(s.b * x) + s.d * Math.cos(s.b * y);
      x = nx; y = ny;
      sx += Math.abs(x); sy += Math.abs(y);
      g.fillRect(cx + x * sc, cy + y * sc * 0.92, 1.5, 1.5);
    }
    s.x = x; s.y = y;
    s.spreadX = sx / n; s.spreadY = sy / n;
    g.fillStyle = 'rgba(140,190,110,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('A ' + s.a.toFixed(3) + '  B ' + s.b.toFixed(3) + '  C ' + s.c.toFixed(2) + '  D ' + s.d.toFixed(2), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n1 = v.noise(), n2 = v.noise();
    const f1 = v.filter('bandpass', 800, 6), f2 = v.filter('bandpass', 1400, 6);
    const g1 = v.g(0.03), g2 = v.g(0.03);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);
    const pads = A.padVoices(v, 4, { type: 'triangle', gain: 0.045, cutoff: 340, q: 0.6 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 1.6));
    v.fadeIn(1, 1.4);
    return {
      tick() {
        const s = P.state;
        A.set(f1.frequency, 300 + s.spreadX * 900, 0.2);
        A.set(f2.frequency, 500 + s.spreadY * 1400, 0.2);
        pads.forEach(p => p.bright(200 + (s.spreadX + s.spreadY) * 260));
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-10 · WEATHER STATION ---------- */
reg({
  id: 'SRC-10', ver: 2, title: 'Weather Station', tech: 'FLOW FIELD / IDEOMETRIC PLANE',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 }, fx: { bloom: 0.4, edge: true },
  tags: ['VECTOR FIELD', 'HEADING + TURBULENCE', 'SPEED = HEAT', 'AEOLIAN TONES'],
  desc: 'Weather for a place that has no sky: a wind measured by thousands of travelling motes, each with its own weight and temperament. The left hand is the compass — it turns the prevailing wind through all 360 degrees. The right hand is the weather itself: drifting slate dust at rest, white-hot streaking gale at full stretch. Color is windspeed: cold steel when slow, burning ice when fast.',
  interact: 'L = wind heading (full circle). R = energy — speed and turbulence together. Each mote carries its own speed, so even one gesture produces a spread of temperatures across the screen. Note the paradigm: one hand steers a direction, the other pushes intensity.',
  sound: 'Wind: noise through LP, cutoff and gain both riding R (the classic). Aeolian tones: two or three quiet sines around 400–900Hz with slow random vibrato, detuning wider as turbulence rises — like wires singing in wind (Ableton: Operator sines, LFO amount on pitch mapped to R). Heading L maps to stereo azimuth — pan the entire weather across the field as the compass turns.',
  init(P) {
    const parts = [];
    const n = Math.min(3000, Math.round(1050 * areaScale(P)));
    for (let i = 0; i < n; i++) parts.push({
      x: P.rand() * P.w, y: P.rand() * P.h, px: 0, py: 0,
      ph: P.rand() * TAU,                     // personal phase in the field
      sp: 0.55 + P.rand() * 1.1,              // personal speed temperament
      sz: P.rand() < 0.12 ? 1.8 + P.rand() * 1.6 : 0.8 + P.rand() * 0.9, // a few heavy motes
      j: 0
    });
    P.state = { parts, first: true };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const heading = inp.L * TAU;
    const speed = 30 + inp.R * 200;
    const turb = 0.3 + inp.R * 2.6;
    const k1 = 0.008, k2 = 0.011, k3 = 0.006;
    for (const p of s.parts) {
      // personal jitter walk — breaks the lockstep so motes never fully align
      p.j += (P.rand() - 0.5) * dt * (1.2 + turb * 2.2);
      p.j *= Math.pow(0.25, dt);
      const a = heading
        + turb * Math.sin(p.x * k1 + t * 0.35 + p.ph)
        + turb * Math.cos(p.y * k2 - t * 0.28 + p.ph * 0.6)
        + turb * 0.7 * Math.sin((p.x + p.y) * k3 + t * 0.15)
        + p.j;
      p.px = p.x; p.py = p.y;
      const v = speed * p.sp;
      p.x += Math.cos(a) * v * dt;
      p.y += Math.sin(a) * v * dt;
      if (p.x < 0 || p.x > P.w || p.y < 0 || p.y > P.h) {
        p.x = P.rand() * P.w; p.y = P.rand() * P.h; p.px = p.x; p.py = p.y;
      }
    }
    s.heading = heading; s.energy = inp.R; s.dt = dt;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    if (s.first) { g.fillStyle = '#0a0c0d'; g.fillRect(0, 0, w, h); s.first = false; }
    g.fillStyle = `rgba(10,12,13,${0.10 + s.energy * 0.06})`; g.fillRect(0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));   // design for fullscreen, not the thumbnail
    const dt = Math.max(0.001, s.dt || 0.016);
    const vmax = 230 * dt; // fastest plausible frame distance
    // COLOR IS WINDSPEED: slow = cold slate, fast = burning ice-white
    for (const p of s.parts) {
      const d = Math.hypot(p.x - p.px, p.y - p.py);
      if (d > 42 * ms || d < 0.3) continue;
      const vn = Math.min(1, d / vmax);
      const vv = vn * vn;
      g.strokeStyle = `hsla(${208 - vv * 26},${35 + vv * 60}%,${30 + vv * 62}%,${0.10 + vv * 0.66})`;
      g.lineWidth = p.sz * (0.7 + vv * 1.9) * ms;
      g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
      if (vn > 0.82 && p.sz > 1.5) { // the heaviest, fastest motes flare white
        g.strokeStyle = `rgba(240,250,255,${(vn - 0.82) * 2.6})`;
        g.lineWidth = p.sz * 0.8 * ms;
        g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
      }
    }
    // compass — needle on a quiet ring (heading), warmth ring shows energy
    const cx = w - 46 * ms, cy = 44 * ms, r = 22 * ms;
    g.strokeStyle = 'rgba(120,150,170,0.4)'; g.lineWidth = 2 * ms;
    g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
    g.strokeStyle = `hsla(190,90%,${45 + s.energy * 40}%,${0.3 + s.energy * 0.6})`; g.lineWidth = 3 * ms;
    g.beginPath(); g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + s.energy * TAU); g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 2 * ms;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(s.heading) * r, cy + Math.sin(s.heading) * r); g.stroke();
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('WIND ' + Math.round((s.heading / TAU) * 360) + '°  ENERGY ' + Math.round(s.energy * 100), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 500, 0.5);
    const ng = v.g(0.06);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    const w1 = v.osc('sine', H.scaleTone(4, 1)), w2 = v.osc('sine', H.scaleTone(8, 1));
    const wg = v.g(0.015);
    w1.connect(wg); w2.connect(wg); wg.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.8; wg.connect(s2); s2.connect(A.revIn); }
    const lfo = v.osc('sine', 3), lg = v.g(0);
    lfo.connect(lg); lg.connect(w1.frequency); lg.connect(w2.frequency);
    H.onChord(() => {
      A.set(w1.frequency, H.chordTone(2, 1), 2.2);
      A.set(w2.frequency, H.chordTone(4, 1), 2.8);
    });
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        A.set(f.frequency, 300 + inp.R * 2400, 0.2);
        A.set(ng.gain, 0.025 + inp.R * 0.08, 0.2);
        A.set(lg.gain, inp.R * 22, 0.3);
        A.set(wg.gain, 0.006 + inp.R * 0.028, 0.3);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-11 · ARCHIVE TERRITORIES ---------- */
reg({
  id: 'SRC-11', title: 'Archive Territories', tech: 'VORONOI CENSUS / ANNEXATION',
  music: { bpm: 72, root: 46, mode: 'dorian', prog: [0, 4, 3, 5] }, fx: { bloom: 0.3, edge: true },
  tags: ['CELL BORDERS', 'TERRITORIAL PUSH', 'PIXEL SURVEY', 'GEODE CRACKS'],
  desc: 'The archive surveyed as land. Two dynasties of holdings — a west and an east — annex and concede pixels while the census never closes. Push with a hand and that dynasty\'s seats march on the frontier; the border towns flicker as they change flags, and every capture is logged as a crack in the record.',
  interact: 'L = expansion pressure of the western holdings, R = eastern. Both high = a contested, shivering frontier down the middle. Both low = détente. The output is a border, and the border is alive.',
  sound: 'Captures: dry wooden clicks (rimshot-ish, Ableton: DrumRack wood tick), rate = flips per second, panned to where the flip happened. A big cascade (many flips in one beat) triggers a geode crack — layered noise snap + resonant low ping (~110Hz). Bed: archive hum, a barely-there 100Hz + air-conditioner noise. Border length maps to a faint tape-hiss send: longer frontier = more static in the room.',
  init(P) {
    const seeds = [];
    for (let i = 0; i < 22; i++) {
      const hx = P.rand(), hy = P.rand();
      seeds.push({ hx, hy, x: hx, y: hy, side: hx < 0.5 ? 0 : 1, id: i });
    }
    const GW = 88, GH = 55;
    const oc = document.createElement('canvas'); oc.width = GW; oc.height = GH;
    P.state = {
      seeds, GW, GH, owner: new Int8Array(GW * GH).fill(-1),
      oc, og: oc.getContext('2d'), img: new ImageData(GW, GH),
      flips: 0, flipAvg: 0, lastClick: 0, lastCrack: 0, border: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    for (const sd of s.seeds) {
      const home = sd.side === 0 ? sd.hx * 0.5 : 0.5 + sd.hx * 0.5;
      const invade = sd.side === 0 ? inp.L : inp.R;
      const goal = sd.side === 0 ? lerp(home, 0.55 + sd.hy * 0.4, invade) : lerp(home, 0.45 - sd.hy * 0.4, invade);
      sd.x += (goal - sd.x) * Math.min(1, dt * 1.8);
      sd.y = sd.hy + 0.03 * Math.sin(t * 0.5 + sd.id);
    }
    // census
    const { GW, GH, owner, seeds } = s;
    let flips = 0, border = 0;
    for (let gy = 0; gy < GH; gy++) {
      for (let gx = 0; gx < GW; gx++) {
        const px = gx / GW, py = gy / GH;
        let best = 1e9, bi = 0;
        for (const sd of seeds) {
          const dx = px - sd.x, dy = (py - sd.y) * 0.7;
          const dd = dx * dx + dy * dy;
          if (dd < best) { best = dd; bi = sd.side; }
        }
        const i = gy * GW + gx;
        if (owner[i] !== bi) {
          if (owner[i] !== -1) {
            flips++;
            if (t - s.lastClick > 0.05 && flips < 6) {
              s.lastClick = t;
              const pan = px * 2 - 1;
              P.ping(A => A.hit({ vol: 0.13, dur: 0.05, freq: 1600 + P.rand() * 900, q: 6, pan }));
            }
          }
          owner[i] = bi;
        }
        if (gx > 0 && owner[i] !== owner[i - 1]) border++;
      }
    }
    s.flipAvg += (flips - s.flipAvg) * Math.min(1, dt * 3);
    s.border = border;
    if (s.flipAvg > 14 && t - s.lastCrack > 1.2) {
      s.lastCrack = t;
      P.ping(A => { A.hit({ vol: 0.22, dur: 0.25, freq: 300, q: 1 }); A.bassNote(H.rootFreq(-1), { at: A.q(0.5), vol: 0.18 }); });
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { GW, GH, owner, img } = s;
    const d = img.data;
    for (let gy = 0; gy < GH; gy++) {
      for (let gx = 0; gx < GW; gx++) {
        const i = gy * GW + gx;
        const o = owner[i];
        const checker = ((gx >> 1) + (gy >> 1)) % 2 === 0 ? 1 : 0.86;
        const edge = (gx > 0 && owner[i - 1] !== o) || (gy > 0 && owner[i - GW] !== o);
        if (edge) { d[i * 4] = 245; d[i * 4 + 1] = 238; d[i * 4 + 2] = 215; }
        else if (o === 0) { d[i * 4] = 152 * checker; d[i * 4 + 1] = 74 * checker; d[i * 4 + 2] = 46 * checker; }   // terracotta west
        else { d[i * 4] = 46 * checker; d[i * 4 + 1] = 66 * checker; d[i * 4 + 2] = 112 * checker; }               // slate east
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    // seed markers
    for (const sd of s.seeds) {
      const x = sd.x * w, y = sd.y * h;
      g.strokeStyle = sd.side === 0 ? 'rgba(255,170,120,0.95)' : 'rgba(150,190,255,0.95)';
      g.lineWidth = 1;
      g.beginPath(); g.arc(x, y, 4, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.moveTo(x, y - 7); g.lineTo(x, y + 7); g.stroke();
    }
    g.fillStyle = 'rgba(180,220,140,0.85)'; g.font = '10px ui-monospace,monospace';
    const west = (() => { let c = 0; for (let i = 0; i < owner.length; i++) if (owner[i] === 0) c++; return c; })();
    g.fillText('WEST ' + Math.round(west / owner.length * 100) + '%  FRONTIER ' + s.border + '  FLUX ' + s.flipAvg.toFixed(1), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const hum = v.osc('sine', H.rootFreq(-2));
    const hg = v.g(0.035);
    hum.connect(hg); hg.connect(v.group);
    H.onChord(() => A.set(hum.frequency, H.rootFreq(-2), 1.2));
    const n = v.noise();
    const nf = v.filter('highpass', 5000, 0.5);
    const ng = v.g(0.004);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);
    v.fadeIn(1, 1);
    return {
      tick() { A.set(ng.gain, 0.002 + Math.min(1, P.state.border / 260) * 0.014, 0.4); },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-12 · MURMURATION DUET ---------- */
reg({
  id: 'SRC-12', title: 'Murmuration Duet', tech: 'TWIN FLOCKS / BOIDS',
  music: { bpm: 66, root: 50, mode: 'ionian', prog: [0, 5, 3, 4] }, fx: { bloom: 0.5 },
  tags: ['SWARM STEER', 'CONVERGENCE REWARD', 'HEIGHT = PITCH', 'CHORAL DRONE'],
  desc: 'Two flocks that have never met: a green one that answers your left hand, a pale one that answers your right. Each hand is only an altitude — raise it and your flock climbs. But bring the two altitudes together and the flocks begin to hear each other, weaving into one body and one chord.',
  interact: 'L = altitude of the west flock, R = east. Convergence is the mechanic: matching your hands within a few CC ticks braids the flocks and rewards you with unison. A duet you play by agreeing.',
  sound: 'Two choir-adjacent drones (Ableton: Wavetable "choir" tables or granular vocal pad), one per flock, pitch quantized to a shared pentatonic — altitude picks the degree. Detune each voice by its flock\'s internal scatter (tight flock = pure, scattered = chorused). When altitudes match, snap both voices to the same note, add a soft octave shimmer and let the beating vanish — consonance as a physical reward for symmetry.',
  init(P) {
    const mk = side => Array.from({ length: 52 }, () => ({
      x: (side === 0 ? 0.1 : 0.6) * P.w + P.rand() * P.w * 0.3,
      y: P.rand() * P.h,
      vx: (P.rand() - 0.5) * 40, vy: (P.rand() - 0.5) * 40, side
    }));
    P.state = { boids: [...mk(0), ...mk(1)], scatter: [0, 0], merged: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const targets = [
      { x: w * (0.3 + 0.1 * Math.sin(t * 0.3)), y: h * (0.88 - inp.L * 0.76) },
      { x: w * (0.7 + 0.1 * Math.cos(t * 0.26)), y: h * (0.88 - inp.R * 0.76) }
    ];
    const close = Math.abs(inp.L - inp.R) < 0.07;
    s.merged += ((close ? 1 : 0) - s.merged) * Math.min(1, dt * 1.5);
    if (close && !s.wasClose) P.ping(A => A.bell(H.chordTone(8), { at: A.q(), vol: 0.09, dur: 2.4 }));
    s.wasClose = close;
    // centroids
    const cent = [{ x: 0, y: 0, n: 0 }, { x: 0, y: 0, n: 0 }];
    for (const b of s.boids) { const c = cent[b.side]; c.x += b.x; c.y += b.y; c.n++; }
    for (const c of cent) { c.x /= c.n; c.y /= c.n; }
    const scat = [0, 0];
    for (const b of s.boids) {
      let ax = 0, ay = 0;
      const tg = targets[b.side];
      ax += (tg.x - b.x) * 0.9; ay += (tg.y - b.y) * 1.4;
      const c = cent[b.side];
      ax += (c.x - b.x) * 0.5; ay += (c.y - b.y) * 0.5;
      if (s.merged > 0.3) {
        const oc = cent[1 - b.side];
        ax += (oc.x - b.x) * 0.55 * s.merged; ay += (oc.y - b.y) * 0.55 * s.merged;
      }
      // separation + alignment with a few sampled neighbors
      for (let k = 0; k < 4; k++) {
        const o = s.boids[(Math.random() * s.boids.length) | 0];
        if (o === b) continue;
        const dx = b.x - o.x, dy = b.y - o.y, dd = dx * dx + dy * dy;
        if (dd < 500 && dd > 0.01) { const inv = 34 / dd; ax += dx * inv * 9; ay += dy * inv * 9; }
        if (o.side === b.side && dd < 4000) { ax += (o.vx - b.vx) * 0.12; ay += (o.vy - b.vy) * 0.12; }
      }
      b.vx += ax * dt; b.vy += ay * dt;
      const sp = Math.hypot(b.vx, b.vy), maxSp = 150;
      if (sp > maxSp) { b.vx *= maxSp / sp; b.vy *= maxSp / sp; }
      b.x += b.vx * dt; b.y += b.vy * dt;
      scat[b.side] += Math.hypot(b.x - cent[b.side].x, b.y - cent[b.side].y);
    }
    s.scatter[0] = scat[0] / 52 / Math.min(w, h);
    s.scatter[1] = scat[1] / 52 / Math.min(w, h);
    s.cent = cent;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = 'rgba(6,8,7,0.28)'; g.fillRect(0, 0, w, h);
    for (const b of s.boids) {
      const m = s.merged;
      const col = b.side === 0
        ? `rgba(${255 - m * 40},${186 + m * 40},${92 + m * 60},0.9)`   // amber flock
        : `rgba(${150 + m * 40},${216 + m * 10},${255 - m * 70},0.9)`; // ice flock
      g.fillStyle = col;
      const ang = Math.atan2(b.vy, b.vx);
      g.save(); g.translate(b.x, b.y); g.rotate(ang);
      g.beginPath(); g.moveTo(5.2, 0); g.lineTo(-4, 2.6); g.lineTo(-4, -2.6); g.closePath(); g.fill();
      g.restore();
    }
    if (s.merged > 0.5 && s.cent) {
      g.strokeStyle = `rgba(234,255,200,${(s.merged - 0.5) * 0.5})`;
      g.lineWidth = 1;
      g.beginPath();
      g.arc((s.cent[0].x + s.cent[1].x) / 2, (s.cent[0].y + s.cent[1].y) / 2,
        40 + Math.sin(t * 2) * 8, 0, TAU);
      g.stroke();
    }
  },
  audio(A, P) {
    const v = A.voice();
    const mk = () => {
      const o1 = v.osc('triangle', 220), o2 = v.osc('triangle', 220);
      const f = v.filter('lowpass', 900, 0.8);
      const gg = v.g(0.075);
      o1.connect(gg); o2.connect(gg); gg.connect(f); f.connect(v.group);
      return { o1, o2, f };
    };
    const vL = mk(), vR = mk();
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const s = P.state;
        const close = Math.abs(inp.L - inp.R) < 0.07;
        // altitudes climb the chord-tone ladder — the duet is always chordal
        const iL = Math.round(inp.L * 6), iR = close ? iL : Math.round(inp.R * 6);
        const fL = H.chordTone(iL, -1), fR = H.chordTone(iR, -1) * (close ? 2 : 1);
        A.set(vL.o1.frequency, fL, 0.12); A.set(vL.o2.frequency, fL, 0.12);
        A.set(vR.o1.frequency, fR, 0.12); A.set(vR.o2.frequency, fR, 0.12);
        A.set(vL.o2.detune, 4 + s.scatter[0] * 90, 0.2);
        A.set(vR.o2.detune, -4 - s.scatter[1] * 90, 0.2);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-13 · CABLE STRUM ---------- */
reg({
  id: 'SRC-13', title: 'Cable Strum', tech: 'VERLET ROPE / TENSION PITCH',
  music: { bpm: 76, root: 45, mode: 'dorian', prog: [0, 3, 4, 5] }, fx: { bloom: 0.5 },
  tags: ['SOFT BODY', 'ANCHOR HEIGHTS', 'WAVE PROPAGATION', 'PHYSICAL STRING', 'VOLUME NATIVE'],
  desc: 'A single slack cable strung between two masts, sagging like a power line on a hot day. Each hand owns a mast. Raise them apart and the cable pulls taut and bright; jerk one and a wave runs the whole span and rings it like a struck string. The instrument is the sag itself.',
  interact: 'L = height of the left anchor, R = right. Slow moves retune (more tension = higher, brighter). Fast moves strum — the wave you see is the note you hear. Asymmetry tilts the whole catenary.',
  sound: 'Karplus-Strong string (Ableton: Tension, or Corpus on a short noise burst). Pitch = cable tension: CC distance between the anchors mapped over about an octave (E2–E3). Trigger = anchor velocity crossing a threshold, velocity → note volume and brightness. Slow continuous moves send pitch-bend to the ringing voice instead of new notes, so drags become glissandi. A faint AC-line hum (50Hz) underneath, louder as tension rises.',
  init(P) {
    const N = 40;
    const nodes = [];
    for (let i = 0; i < N; i++) nodes.push({ x: 0, y: 0, ox: 0, oy: 0 });
    P.state = { N, nodes, seg: 0, tension: 0, wave: 0, lastPluck: 0, init: false };
  },
  step(P, dt, t, inp) {
    const s = P.state, { N, nodes } = s, w = P.w, h = P.h;
    const ax = w * 0.1, bx = w * 0.9;
    const ay = h * (0.82 - inp.L * 0.62), by = h * (0.82 - inp.R * 0.62);
    if (!s.init) {
      s.init = true;
      for (let i = 0; i < N; i++) {
        const tt = i / (N - 1);
        nodes[i].x = nodes[i].ox = lerp(ax, bx, tt);
        nodes[i].y = nodes[i].oy = lerp(ay, by, tt) + Math.sin(tt * Math.PI) * h * 0.2;
      }
    }
    // raising hands also winches the cable in: high hands = taut + high pitch
    s.seg = (bx - ax) * (1.34 - 0.37 * ((inp.L + inp.R) / 2)) / (N - 1);
    // verlet
    const sub = 2;
    for (let ss = 0; ss < sub; ss++) {
      const sdt = dt / sub;
      for (let i = 1; i < N - 1; i++) {
        const nd = nodes[i];
        const vx = (nd.x - nd.ox) * 0.996, vy = (nd.y - nd.oy) * 0.996;
        nd.ox = nd.x; nd.oy = nd.y;
        nd.x += vx; nd.y += vy + 1300 * sdt * sdt;
      }
      nodes[0].x = ax; nodes[0].y = ay;
      nodes[N - 1].x = bx; nodes[N - 1].y = by;
      let stretch = 0;
      for (let it = 0; it < 14; it++) {
        for (let i = 0; i < N - 1; i++) {
          const a = nodes[i], b = nodes[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1e-5;
          const diff = (d - s.seg) / d * 0.5;
          if (it === 0) stretch += Math.max(0, d - s.seg);
          const mA = i === 0 ? 0 : 1, mB = i === N - 2 ? 0 : 1;
          const tot = mA + mB || 1;
          a.x += dx * diff * 2 * mA / tot; a.y += dy * diff * 2 * mA / tot;
          b.x -= dx * diff * 2 * mB / tot; b.y -= dy * diff * 2 * mB / tot;
        }
        nodes[0].x = ax; nodes[0].y = ay;
        nodes[N - 1].x = bx; nodes[N - 1].y = by;
      }
      s.tension += (Math.min(1, stretch / (s.seg * N * 0.045)) - s.tension) * 0.12;
    }
    // wave energy
    let wave = 0;
    for (let i = 1; i < N - 1; i++) wave += Math.abs(nodes[i].y - nodes[i].oy);
    s.wave += (wave / N - s.wave) * 0.25;
    if (s.wave > 1.1 && t - s.lastPluck > 0.16) {
      s.lastPluck = t;
      // tension picks the pitch, then snaps to the nearest scale tone — slides become musical
      const f0 = H.nearestScale(82 * Math.pow(2, s.tension * 1.2));
      const vol = clamp(s.wave / 8, 0.06, 0.28);
      P.ping(A => {
        A.pluck2(f0, { at: A.q(), vol, dur: 1.8, rev: 0.35, del: 0.22 });
        A.hit({ vol: vol * 0.4, dur: 0.03, freq: f0 * 8, q: 2 });
      });
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { N, nodes } = s;
    g.fillStyle = 'rgba(8,8,6,0.35)'; g.fillRect(0, 0, w, h);
    // masts
    for (const [x, v] of [[w * 0.1, inp.L], [w * 0.9, inp.R]]) {
      const y = h * (0.82 - v * 0.62);
      g.strokeStyle = 'rgba(140,130,90,0.5)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, h * 0.95); g.lineTo(x, y - 14); g.stroke();
      g.fillStyle = '#ffd98a'; g.shadowColor = '#ffd98a'; g.shadowBlur = 10;
      g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
    // the curtain of light hanging from the cable — in the volume this is a
    // full draped plane between the two hands, not a line
    const heat0 = s.tension;
    for (let i = 1; i < N - 1; i += 2) {
      const nd = nodes[i];
      const sway = Math.abs(nd.y - nd.oy) * 4;
      const gr = g.createLinearGradient(0, nd.y, 0, h * 0.96);
      gr.addColorStop(0, `rgba(255,225,160,${0.1 + heat0 * 0.1 + Math.min(0.3, sway * 0.06)})`);
      gr.addColorStop(1, 'rgba(255,200,120,0)');
      g.strokeStyle = gr;
      g.lineWidth = (w / N) * 1.6;
      g.beginPath(); g.moveTo(nd.x, nd.y); g.lineTo(nd.x, h * 0.96); g.stroke();
    }
    // cable
    const heat = s.tension;
    g.strokeStyle = `rgba(${230 + heat * 25},${200 + heat * 40},${120 + heat * 80},${0.7 + heat * 0.3})`;
    g.lineWidth = 2 + heat * 1.2;
    g.shadowColor = '#ffe9a8'; g.shadowBlur = 6 + heat * 12 + s.wave * 2;
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.stroke();
    g.shadowBlur = 0;
    g.fillStyle = '#080806'; g.fillRect(0, h - 24, 250, 24);
    g.fillStyle = 'rgba(220,200,150,0.85)'; g.font = '10px ui-monospace,monospace';
    g.fillText('TENSION ' + (s.tension * 100).toFixed(0) + '%  PITCH ' + Math.round(82 * Math.pow(2, s.tension * 1.2)) + 'Hz', 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const hum = v.osc('sine', H.rootFreq(-2)), hum2 = v.osc('sine', H.rootFreq(-1));
    const hg = v.g(0.025);
    hum.connect(hg); hum2.connect(hg); hg.connect(v.group);
    H.onChord(() => {
      A.set(hum.frequency, H.rootFreq(-2), 1.5);
      A.set(hum2.frequency, H.rootFreq(-1), 1.5);
    });
    v.fadeIn(1, 0.8);
    return {
      tick() { A.set(hg.gain, 0.012 + P.state.tension * 0.04, 0.3); },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-14 · TILT CHAMBER ---------- */
reg({
  id: 'SRC-14', title: 'Tilt Chamber', tech: 'RIGID BODIES / SHARED GRAVITY',
  music: { bpm: 88, root: 50, mode: 'ionian', prog: [0, 4, 5, 3] }, fx: { bloom: 0.45 },
  tags: ['DIFFERENTIAL TILT', 'COLLISION MUSIC', 'PEG FIELD', 'TUNED MARIMBA'],
  desc: 'A sealed room of luminous stones and a floor you can tip like a tea tray. The stones only ever obey gravity — but gravity is the difference between your hands. Tip the world and the room replies in tuned wood, every stone a different note, every peg a different argument.',
  interact: 'R − L = tilt of gravity. Balanced hands = stones settle and the room goes quiet. This is percussion you play by pouring — the melody emerges from physics, not from aim.',
  sound: 'Collisions: marimba/vibes hits, pitch fixed per stone by its size (big = low; tune the set to a hexatonic scale so any cascade is musical), velocity → volume + mallet hardness (Ableton: Collision, map velocity to noise amount). Rolling contact: low felt rumble, gain = total rolling speed. Let hard wall hits also fire a short room-clap sample for weight. Silence is part of this piece — reward stillness.',
  init(P) {
    const m = Math.min(P.w, P.h);
    const balls = [];
    for (let i = 0; i < 11; i++) {
      balls.push({
        x: P.w * (0.15 + P.rand() * 0.7), y: P.h * (0.1 + P.rand() * 0.4),
        vx: 0, vy: 0, r: m * (0.03 + P.rand() * 0.044), note: i
      });
    }
    const pegs = [];
    for (let i = 0; i < 5; i++) pegs.push({ x: P.w * (0.2 + P.rand() * 0.6), y: P.h * (0.35 + P.rand() * 0.35), r: m * 0.018 });
    P.state = { balls, pegs, roll: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const tilt = (inp.R - inp.L) * 1.1;
    const gx = Math.sin(tilt) * 640, gy = Math.cos(tilt) * 640;
    const pad = 8;
    let roll = 0;
    const hitSound = (b, speed) => {
      if (speed < 55) return;
      const vol = clamp((speed - 55) / 500, 0.02, 0.22);
      // each stone is a tone of the current chord — cascades are always chordal
      const freq = H.chordTone(9 - Math.round(b.r / (Math.min(w, h) * 0.007)));
      P.ping(A => A.pluck2(clamp(freq, 90, 1700), { at: A.q(0.25), vol, dur: 0.7, pan: (b.x / w) * 2 - 1, rev: 0.3 }));
    };
    for (const b of s.balls) {
      b.vx += gx * dt; b.vy += gy * dt;
      b.vx *= (1 - 0.12 * dt); b.vy *= (1 - 0.12 * dt);
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < pad + b.r) { b.x = pad + b.r; if (b.vx < 0) { hitSound(b, -b.vx); b.vx *= -0.72; } }
      if (b.x > w - pad - b.r) { b.x = w - pad - b.r; if (b.vx > 0) { hitSound(b, b.vx); b.vx *= -0.72; } }
      if (b.y < pad + b.r) { b.y = pad + b.r; if (b.vy < 0) { hitSound(b, -b.vy); b.vy *= -0.72; } }
      if (b.y > h - pad - b.r) {
        b.y = h - pad - b.r;
        if (b.vy > 0) { hitSound(b, b.vy); b.vy *= -0.72; }
        roll += Math.abs(b.vx);
      }
      for (const pg of s.pegs) {
        const dx = b.x - pg.x, dy = b.y - pg.y, d = Math.hypot(dx, dy), min = b.r + pg.r;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d;
          const rel = b.vx * nx + b.vy * ny;
          b.x = pg.x + nx * min; b.y = pg.y + ny * min;
          if (rel < 0) { hitSound(b, -rel); b.vx -= 1.7 * rel * nx; b.vy -= 1.7 * rel * ny; }
        }
      }
    }
    // pairwise
    for (let i = 0; i < s.balls.length; i++) {
      for (let j = i + 1; j < s.balls.length; j++) {
        const a = s.balls[i], b = s.balls[j];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d, overlap = (min - d) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            hitSound(a, -rel * 0.8);
            const imp = -rel * 0.85;
            a.vx -= imp * nx; a.vy -= imp * ny;
            b.vx += imp * nx; b.vy += imp * ny;
          }
        }
      }
    }
    s.roll += (Math.min(1, roll / 700) - s.roll) * Math.min(1, dt * 4);
    s.tilt = tilt;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#070906'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,150,90,0.4)'; g.lineWidth = 1.5;
    g.strokeRect(8, 8, w - 16, h - 16);
    for (const pg of s.pegs) {
      g.strokeStyle = 'rgba(160,190,120,0.55)';
      g.beginPath(); g.arc(pg.x, pg.y, pg.r, 0, TAU); g.stroke();
      g.fillStyle = 'rgba(160,190,120,0.15)';
      g.beginPath(); g.arc(pg.x, pg.y, pg.r, 0, TAU); g.fill();
    }
    for (const b of s.balls) {
      const sp = Math.hypot(b.vx, b.vy);
      const heat = Math.min(1, sp / 400);
      const hue = (b.note * 37) % 360; // jewel tone per stone
      g.strokeStyle = `hsla(${hue},70%,${62 + heat * 20}%,0.95)`;
      g.lineWidth = 1.6;
      if (heat > 0.3) { g.shadowColor = `hsl(${hue},80%,70%)`; g.shadowBlur = 12 * heat; }
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.stroke();
      g.fillStyle = `hsla(${hue},75%,60%,${0.08 + heat * 0.25})`;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(255,255,245,0.85)';
      g.beginPath(); g.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, 1.6, 0, TAU); g.fill();
    }
    // level HUD
    const lx = w / 2, ly = 24, lw2 = w * 0.11;
    g.strokeStyle = 'rgba(150,180,110,0.5)';
    g.beginPath(); g.moveTo(lx - lw2, ly); g.lineTo(lx + lw2, ly); g.stroke();
    g.fillStyle = '#eaffb0';
    g.beginPath(); g.arc(lx + s.tilt * lw2 * 0.85, ly, 4, 0, TAU); g.fill();
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 160, 0.6);
    const ng = v.g(0);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    v.fadeIn(1, 0.6);
    return {
      tick() { A.set(ng.gain, P.state.roll * 0.12, 0.15); },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-15 · FERRO BLOOM ---------- */
reg({
  id: 'SRC-15', title: 'Ferro Bloom', tech: 'POLAR BLOB / SPIKE SPRINGS',
  music: { bpm: 58, root: 46, mode: 'aeolian', prog: [0, 5], chordBars: 4 }, fx: { bloom: 0.55 },
  tags: ['SOFT CREATURE', 'HEMISPHERE FIELDS', 'SPRING WOBBLE', 'SUB WOBBLE'],
  desc: 'A drop of something patient, floating in its own magnetic weather. Bring up a hand and that side of the creature blooms into ferrofluid spikes, each one a spring that overshoots and shivers. It is not a display — it is a body, and it clearly has a left and a right.',
  interact: 'L = spike field on the left hemisphere, R = right. The mechanic is embodiment: the audience reads the blob as a creature responding to being approached from either side. Fast raises overshoot and wobble; slow raises bristle smoothly.',
  sound: 'Sub: 45–55Hz sine, amplitude-wobbled at a rate that follows total spike energy (Ableton: Operator sine + LFO on volume, LFO rate CC-mapped 0.5–9Hz). Spikes overshooting fire soft resonant zaps (short sine blip through a peaked EQ around 900Hz, pitch slightly randomized). The overall feel: a subwoofer purring, with static electricity on top. Magenta-pink piece — let the sound be warmer/rounder than the green pieces.',
  init(P) {
    const NS = 26, spikes = [];
    for (let i = 0; i < NS; i++) spikes.push({ a: i / NS * TAU, v: 0, x: 0, hot: false });
    P.state = { spikes, NS, energy: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    let energy = 0;
    for (const sp of s.spikes) {
      // hemisphere weight: angle 0 = +x (right)
      const rightness = (Math.cos(sp.a) + 1) / 2;
      const target = inp.R * Math.pow(smooth(rightness), 1.6) + inp.L * Math.pow(smooth(1 - rightness), 1.6);
      const acc = (target - sp.x) * 90 - sp.v * 6.5;
      sp.v += acc * dt; sp.x += sp.v * dt;
      energy += Math.abs(sp.x);
      const over = sp.v > 2.2 && sp.x > 0.5;
      if (over && !sp.hot) {
        P.ping(A => A.tone(H.chordTone(7 + ((Math.random() * 3) | 0), 1), { at: A.q(), vol: 0.045, dur: 0.2, pan: Math.cos(sp.a) * 0.7, rev: 0.5 }));
      }
      sp.hot = over;
    }
    s.energy += (energy / s.NS - s.energy) * Math.min(1, dt * 5);
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = 'rgba(12,7,12,0.3)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R0 = Math.min(w, h) * 0.24;
    const rAt = a => {
      // interpolate spike amplitudes around the circle
      const fi = (a / TAU) * s.NS;
      const i0 = ((Math.floor(fi) % s.NS) + s.NS) % s.NS, i1 = (i0 + 1) % s.NS;
      const fr = fi - Math.floor(fi);
      const amp = lerp(s.spikes[i0].x, s.spikes[i1].x, fr);
      const spikeShape = Math.pow(Math.abs(Math.cos((fi - i0 < 0.5 ? fi - i0 : fi - i0 - 1) * Math.PI)), 2.6);
      const breathe = 1 + 0.04 * Math.sin(t * 1.1 + a * 3);
      return R0 * breathe + amp * spikeShape * R0 * 1.5 + amp * R0 * 0.1;
    };
    const grad = g.createRadialGradient(cx, cy - R0 * 0.2, R0 * 0.1, cx, cy, R0 * 2.2);
    grad.addColorStop(0, 'rgba(255,170,220,0.95)');
    grad.addColorStop(0.45, 'rgba(230,90,180,0.75)');
    grad.addColorStop(1, 'rgba(60,10,50,0)');
    g.fillStyle = grad;
    g.shadowColor = '#ff6ec0'; g.shadowBlur = 24;
    g.beginPath();
    const STEPS = 140;
    for (let i = 0; i <= STEPS; i++) {
      const a = i / STEPS * TAU;
      const r = rAt(a);
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.9;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.closePath(); g.fill();
    g.shadowBlur = 0;
    // core
    const cg = g.createRadialGradient(cx - R0 * 0.15, cy - R0 * 0.2, 2, cx, cy, R0 * 0.75);
    cg.addColorStop(0, 'rgba(255,235,250,0.95)');
    cg.addColorStop(1, 'rgba(255,120,200,0.0)');
    g.fillStyle = cg;
    g.beginPath(); g.arc(cx, cy, R0 * 0.75, 0, TAU); g.fill();
  },
  audio(A, P) {
    const v = A.voice();
    const sub = v.osc('sine', 48);
    const am = v.g(0.16);
    sub.connect(am); am.connect(v.group);
    const lfo = v.osc('sine', 1), lg = v.g(0.1);
    lfo.connect(lg); lg.connect(am.gain);
    v.fadeIn(1, 0.8);
    return {
      tick() {
        const e = Math.min(1, P.state.energy);
        A.set(lfo.frequency, 0.6 + e * 8.5, 0.2);
        A.set(lg.gain, 0.03 + e * 0.11, 0.2);
        A.set(sub.frequency, H.rootFreq(-2) * (1 + e * 0.12), 0.3);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-16 · RAIN ATRIUM ---------- */
reg({
  id: 'SRC-16', title: 'Rain Atrium', tech: 'HEIGHTFIELD WATER / TWO CLOUDS',
  music: { bpm: 64, root: 50, mode: 'ionian', prog: [0, 3, 4, 0] }, fx: { bloom: 0.4, edge: true },
  tags: ['WAVE EQUATION', 'DENSITY CONTROL', 'PENTATONIC PLINKS', 'STEREO WEATHER'],
  desc: 'A dark pool under two private clouds. The left cloud rains only on the left of the water, the right cloud on the right, and every drop writes a ring that argues with every other ring. Hands high, downpour; hands low, the last circles widen and the pool goes back to holding still.',
  interact: 'L = rain density over the left half, R = right. Interference is the secret content: medium rain from both sides makes moiré where the ring systems collide in the middle. Density, not position — a third paradigm for what a hand can mean.',
  sound: 'Plinks: each drop is a pentatonic note — x-position picks the degree (low notes left, high right), drop size → volume, everything through a bright short reverb (Ableton: rack of tuned Operator sines or a music-box sampler; velocity random 20%). Bed: real rain-on-glass noise layer per side, gain = that hand\'s density, panned hard. When both hands are high, duck the plinks 3dB under the noise — downpours drown melodies, and that is correct.',
  init(P) {
    const W = 132, H = 82;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    P.state = {
      W, H, cur: new Float32Array(W * H), prev: new Float32Array(W * H),
      oc, og: oc.getContext('2d'), img: new ImageData(W, H)
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, H, cur, prev } = s;
    // drops
    const tryDrop = (side, dens) => {
      if (P.rand() < dens * dens * dt * 15) {
        const x = (side === 0 ? P.rand() * 0.48 : 0.52 + P.rand() * 0.46) * W | 0;
        const y = (P.rand() * (H - 8) + 4) | 0;
        const amp = 1.2 + P.rand() * 2.2;
        cur[y * W + x] -= amp;
        if (x > 0) cur[y * W + x - 1] -= amp * 0.5;
        if (x < W - 1) cur[y * W + x + 1] -= amp * 0.5;
        const deg = Math.round((x / W) * 9);
        const duck = 1 - 0.55 * clamp(inp.L + inp.R - 1); // downpours drown melodies
        const vol = clamp(amp * 0.04, 0.03, 0.12) * duck;
        P.ping(A => A.pluck2(H.scaleTone(deg, 1), { at: A.q(), vol, dur: 0.9, pan: (x / W) * 2 - 1, rev: 0.45 }));
      }
    };
    tryDrop(0, inp.L); tryDrop(1, inp.R);
    // downpour: distant thunder on the texture channel (rack your real thunder samples there)
    if (inp.L > 0.72 && inp.R > 0.72 && P.rand() < dt * 0.1) {
      P.ping(A => {
        MOut.evNote('texture', H.rootFreq(-3), 0.5, A.q(1), 3.5);
        A.hit({ vol: 0.3, dur: 1.1, freq: 75, q: 0.5, type: 'lowpass', at: A.q(1) });
      });
    }
    // wave step
    const next = prev; // reuse buffer
    for (let y = 1; y < H - 1; y++) {
      const y0 = y * W;
      for (let x = 1; x < W - 1; x++) {
        const i = y0 + x;
        next[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) / 2 - next[i]) * 0.976;
      }
    }
    s.prev = cur; s.cur = next;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, H, cur, img } = s;
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l = x > 0 ? cur[i - 1] : 0, r = x < W - 1 ? cur[i + 1] : 0;
        const u = y > 0 ? cur[i - W] : 0, dn = y < H - 1 ? cur[i + W] : 0;
        const shade = (l - r) * 0.9 + (u - dn) * 0.6;
        // near-black water; only ripple crests catch light (projection-safe)
        const crest = clamp(shade * 1.05, -0.06, 1);
        // moonlit water: indigo depths, silver crests
        d[i * 4] = 7 + Math.max(0, crest) * 165;
        d[i * 4 + 1] = 10 + Math.max(0, crest) * 190;
        d[i * 4 + 2] = 26 + Math.max(0, crest) * 224;
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    // clouds
    for (const [side, v] of [[0, inp.L], [1, inp.R]]) {
      const cx = w * (side === 0 ? 0.25 : 0.75), cy = 26;
      g.fillStyle = `rgba(160,200,215,${0.25 + v * 0.55})`;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(cx + (k - 1.5) * 13, cy + Math.sin(t + k) * 2, 9 + (k % 2) * 4, 0, TAU);
        g.fill();
      }
      // falling streaks
      g.strokeStyle = `rgba(170,220,235,${v * 0.5})`;
      g.lineWidth = 1;
      for (let k = 0; k < Math.round(v * 6); k++) {
        const rx = cx + (P.rand() - 0.5) * 60, ry = 40 + ((t * 260 + k * 47) % (h - 60));
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 2, ry + 9); g.stroke();
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    const mkRain = pan => {
      const n = v.noise();
      const f = v.filter('bandpass', 5500, 0.6);
      const gg = v.g(0);
      n.connect(f); f.connect(gg);
      if (A.ctx.createStereoPanner) {
        const p = A.ctx.createStereoPanner(); p.pan.value = pan;
        gg.connect(p); p.connect(v.group);
      } else gg.connect(v.group);
      return gg;
    };
    const gL = mkRain(-0.7), gR = mkRain(0.7);
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        A.set(gL.gain, inp.L * inp.L * 0.055, 0.25);
        A.set(gR.gain, inp.R * inp.R * 0.055, 0.25);
      },
      stop() { v.kill(); }
    };
  }
});
