/* ============================================================
   HISTORY — earlier versions of explorations, excavated from
   the session record. Registered with family + ver so every
   tile keeps its full lineage. Latest version is the default;
   the V-pills flip back through time.
   ============================================================ */

/* ---------- SRC-01 · EPICYCLE COURT ---------- */
reg({
  id: 'SRC-01.1h', family: 'SRC-01', ver: 1, title: 'Epicycle Court', tech: 'CONCENTRIC RESONATOR',
  music: { bpm: 72, root: 50, mode: 'lydian', prog: [0, 1, 4, 5] }, fx: { bloom: 0.55 },
  tags: ['RING FIELD', 'SPARKLE DECAY', 'LOCAL SWELL', 'PENTATONIC BELLS'],
  desc: 'A court of nested rings that never stops shimmering. Each hand is a vertical field line; wherever it stands, the rings swell toward it like iron filings remembering a magnet. The left and right of the body become the left and right of the orbit.',
  interact: 'L = horizontal position of the left field line (left half). R = the same on the right. Rings bulge outward inside each field line\'s column, so both hands visibly bend the same geometry at once.',
  sound: 'Bed: warm pad, two detuned saws through a slow LP (Ableton: Analog, unison 2, cutoff ~600Hz, LFO on cutoff at 0.1Hz). Bulge energy opens the filter. Sparkles: bell rack in D minor pentatonic (Operator, sine + 2.76x partial), one note each time a dot crosses the swell threshold; dot x-position → pan, ring radius → pitch (inner = high). Keep bells at -18dB, lots of them, like rain on a gong.',
  init(P) {
    const m = Math.min(P.w, P.h), cx = P.w / 2, cy = P.h / 2;
    const rings = [];
    for (let i = 0; i < 8; i++) {
      const r = m * (0.07 + i * 0.052);
      const n = 14 + i * 8, dots = [];
      for (let j = 0; j < n; j++) dots.push({ a: j / n * TAU, tw: P.rand() * TAU, d: 0, hot: false });
      rings.push({ r, dots });
    }
    P.state = { rings, cx, cy, m, energy: 0, lastBell: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const xL = inp.L * 0.5, xR = 0.5 + inp.R * 0.5;
    let energy = 0;
    for (const ring of s.rings) {
      for (const dot of ring.dots) {
        const wx = (s.cx + Math.cos(dot.a + t * 0.05) * ring.r) / P.w;
        const target = bump(wx, xL, 0.1) + bump(wx, xR, 0.1);
        dot.d += (target - dot.d) * Math.min(1, dt * 6);
        energy += dot.d;
        const isHot = dot.d > 0.55;
        if (isHot && !dot.hot && t - s.lastBell > 0.045) {
          s.lastBell = t;
          const pitch = H.chordTone(9 - Math.round(ring.r / (s.m * 0.052)));
          const pan = wx * 2 - 1;
          P.ping(A => A.bell(pitch, { at: A.q(), vol: 0.05, pan }));
        }
        dot.hot = isHot;
      }
    }
    s.energy = energy / 400;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#080a06'; g.fillRect(0, 0, w, h);
    for (const ring of s.rings) {
      g.strokeStyle = 'rgba(122,160,70,0.18)'; g.lineWidth = 1;
      g.beginPath(); g.arc(s.cx, s.cy, ring.r, 0, TAU); g.stroke();
      for (const dot of ring.dots) {
        const a = dot.a + t * 0.05;
        const rr = ring.r * (1 + dot.d * 0.16);
        const x = s.cx + Math.cos(a) * rr, y = s.cy + Math.sin(a) * rr;
        const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + dot.tw);
        const sz = (0.8 + dot.d * 1.5) * tw * (1 + ring.r / s.m * 3);
        const lum = 0.25 + 0.75 * Math.max(tw * 0.4, dot.d);
        const hue = 70 - ring.r / s.m * 55; // inner gold → outer green
        g.fillStyle = dot.d > 0.4 ? `hsla(${hue + 10},100%,84%,${lum})` : `hsla(${hue + 55},45%,62%,${lum * 0.75})`;
        if (dot.d > 0.5) { g.shadowColor = '#b8ff3e'; g.shadowBlur = 10; }
        g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
        g.shadowBlur = 0;
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.038, cutoff: 520 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    v.fadeIn(1, 1);
    return {
      tick() { const b = 320 + P.state.energy * 2400; pads.forEach(p => p.bright(b)); },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-01 · EPICYCLE COURT ---------- */
reg({
  id: 'SRC-01.2h', family: 'SRC-01', ver: 2, title: 'Epicycle Court', tech: 'CONCENTRIC RESONATOR',
  music: { bpm: 72, root: 50, mode: 'lydian', prog: [0, 1, 4, 5] }, fx: { bloom: 0.55 },
  tags: ['RING FIELD', 'SPARKLE DECAY', 'LOCAL SWELL', 'PENTATONIC BELLS'],
  desc: 'A court of nested rings that never stops shimmering. Each hand is a vertical field line; wherever it stands, the rings swell toward it like iron filings remembering a magnet. The left and right of the body become the left and right of the orbit.',
  interact: 'Mirror-symmetric: raising either hand pushes its field line OUTWARD from center — left hand sweeps left, right hand sweeps right, like opening a pair of doors. Rings bulge inside each field line\'s column, so both hands visibly bend the same geometry at once.',
  sound: 'Bed: warm pad, two detuned saws through a slow LP (Ableton: Analog, unison 2, cutoff ~600Hz, LFO on cutoff at 0.1Hz). Bulge energy opens the filter. Sparkles: bell rack in D minor pentatonic (Operator, sine + 2.76x partial), one note each time a dot crosses the swell threshold; dot x-position → pan, ring radius → pitch (inner = high). Keep bells at -18dB, lots of them, like rain on a gong.',
  init(P) {
    const m = Math.min(P.w, P.h), cx = P.w / 2, cy = P.h / 2;
    const rings = [];
    for (let i = 0; i < 8; i++) {
      const r = m * (0.08 + i * 0.056);
      const n = 14 + i * 8, dots = [];
      for (let j = 0; j < n; j++) dots.push({ a: j / n * TAU, tw: P.rand() * TAU, d: 0, hot: false });
      rings.push({ r, dots });
    }
    P.state = { rings, cx, cy, m, energy: 0, lastBell: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // mirror mapping: hands push their field lines outward from center
    const xL = 0.5 - inp.L * 0.44, xR = 0.5 + inp.R * 0.44;
    let energy = 0;
    for (const ring of s.rings) {
      for (const dot of ring.dots) {
        const wx = (s.cx + Math.cos(dot.a + t * 0.05) * ring.r) / P.w;
        const target = bump(wx, xL, 0.12) + bump(wx, xR, 0.12);
        dot.d += (target - dot.d) * Math.min(1, dt * 6);
        energy += dot.d;
        const isHot = dot.d > 0.55;
        if (isHot && !dot.hot && t - s.lastBell > 0.045) {
          s.lastBell = t;
          const pitch = H.chordTone(9 - Math.round(ring.r / (s.m * 0.052)));
          const pan = wx * 2 - 1;
          P.ping(A => A.bell(pitch, { at: A.q(), vol: 0.05, pan }));
        }
        dot.hot = isHot;
      }
    }
    s.energy = energy / 400;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#080a06'; g.fillRect(0, 0, w, h);
    for (const ring of s.rings) {
      g.strokeStyle = 'rgba(122,160,70,0.18)'; g.lineWidth = 1;
      g.beginPath(); g.arc(s.cx, s.cy, ring.r, 0, TAU); g.stroke();
      for (const dot of ring.dots) {
        const a = dot.a + t * 0.05;
        const rr = ring.r * (1 + dot.d * 0.24);
        const x = s.cx + Math.cos(a) * rr, y = s.cy + Math.sin(a) * rr;
        const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + dot.tw);
        const sz = (1.15 + dot.d * 2.4) * tw * (1 + ring.r / s.m * 3.4);
        const lum = 0.25 + 0.75 * Math.max(tw * 0.4, dot.d);
        const hue = 70 - ring.r / s.m * 55; // inner gold → outer green
        g.fillStyle = dot.d > 0.4 ? `hsla(${hue + 10},100%,84%,${lum})` : `hsla(${hue + 55},45%,62%,${lum * 0.75})`;
        if (dot.d > 0.5) { g.shadowColor = '#b8ff3e'; g.shadowBlur = 10; }
        g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
        g.shadowBlur = 0;
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.038, cutoff: 520 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    v.fadeIn(1, 1);
    return {
      tick() { const b = 320 + P.state.energy * 2400; pads.forEach(p => p.bright(b)); },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-02 · PHYLLO REACTOR ---------- */
reg({
  id: 'SRC-02.1h', family: 'SRC-02', ver: 1, title: 'Phyllo Reactor', tech: 'VOGEL SPIRAL / 137.507°',
  music: { bpm: 76, root: 52, mode: 'dorian', prog: [0, 3, 4, 6] }, fx: { bloom: 0.5 },
  tags: ['GOLDEN ANGLE', 'DISK LIFT', 'PARALLAX', 'HARP GLISS'],
  desc: 'A seed-head of six hundred florets packed at the golden angle, spinning at the speed of a slow thought. Slide a hand underneath and the disk deforms upward over your palm — the florets rise, brighten, and pour off notes as they crest the hill you are making.',
  interact: 'L = height of the left palm under the disk, R = height of the right. Each lifts its side of the spiral into a hill; the tilt between hands rolls the whole ridge across the disk.',
  sound: 'Bed: soft pad following the tilt — L/R difference maps to stereo balance and LP cutoff (Wavetable, gentle wavetable position drift). Gliss: as florets crest the ridge, fire plucked harp notes ascending with floret radius (Ableton: Collision, marble mallet). Fast lifts = cascading glissandi; slow lifts = single drops. Send everything to a long shimmer reverb (Valhalla-style, 8s+).',
  init(P) {
    const m = Math.min(P.w, P.h);
    const n = Math.min(1300, Math.round(480 * areaScale(P))), dots = [];
    const GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      dots.push({ i, a: i * GA, r: Math.sqrt(i / n) * m * 0.46, z: 0, prevZ: 0 });
    }
    P.state = { dots, rot: P.rand() * TAU, m, lastGl: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.rot += dt * 0.12;
    for (const d of s.dots) {
      const a = d.a + s.rot;
      const nx = (P.w / 2 + Math.cos(a) * d.r) / P.w;
      const target = inp.L * bump(nx, 0.28, 0.34) + inp.R * bump(nx, 0.72, 0.34);
      d.prevZ = d.z;
      d.z += (target - d.z) * Math.min(1, dt * 7);
      const dz = d.z - d.prevZ;
      if (dz > 0.012 && d.z > 0.3 && t - s.lastGl > 0.05) {
        s.lastGl = t;
        const note = Math.round((1 - d.r / (s.m * 0.44)) * 9) + 2;
        P.ping(A => A.pluck2(H.scaleTone(note), { at: A.q(), vol: 0.09, pan: nx * 2 - 1, rev: 0.4 }));
      }
    }
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#07090a'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    for (const d of s.dots) {
      const a = d.a + s.rot;
      const x = cx + Math.cos(a) * d.r;
      const y = cy + Math.sin(a) * d.r * 0.82 - d.z * s.m * 0.23;
      const sz = (0.85 + d.r / s.m * 3.2) * (1 + d.z * 1.1);
      const lum = 0.3 + d.z * 0.7;
      if (d.z > 0.35) { g.shadowColor = '#bfffe9'; g.shadowBlur = 8; }
      g.fillStyle = d.z > 0.25 ? `rgba(214,255,238,${lum})` : `hsla(${168 + (d.i % 5) * 8},48%,52%,${0.2 + 0.22 * Math.sin(t + d.i)})`;
      g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.06, cutoff: 620 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        pads.forEach(p => { p.bright(320 + (inp.L + inp.R) * 800); });
        A.set(pads[0].o2.detune, (inp.R - inp.L) * 20, 0.2);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-04 · RADAR COURT ---------- */
reg({
  id: 'SRC-04.1h', family: 'SRC-04', ver: 1, title: 'Radar Court', tech: 'SWEEP ARMS / BUBBLE POP',
  music: { bpm: 70, root: 50, mode: 'aeolian', prog: [0, 5, 1, 4] }, fx: { bloom: 0.5 },
  tags: ['TWO ARMS', 'POP PARADIGM', 'ANGULAR MAP', 'PLUCK FIELD'],
  desc: 'Bubbles gather in a quiet circular court, each one humming to itself. Two radar arms belong to your hands — one owns the left semicircle, one the right. Sweep an arm through a bubble and it pops with a ring of light and a note sized exactly to its body.',
  interact: 'Both arms rise as your hands rise — L sweeps the left semicircle bottom-to-top, R mirrors it on the right. Nothing pops automatically; the sweep is yours, and a hand held still is a held position in space.',
  sound: 'Pops: sine pluck, pitch inversely proportional to bubble radius (big = low), with a tiny noise tick transient (Ableton: simple Operator sine + short noise sample layered, pitch by velocity zone). Pan follows the bubble position. Bed: sub-audible room tone + faint servo whir whose pitch follows arm angular velocity (slew a sine with portamento). Popped court slowly refills — density of hum rises as bubbles respawn.',
  init(P) {
    const m = Math.min(P.w, P.h);
    const R = m * 0.47, bubbles = [];
    for (let i = 0; i < 20; i++) bubbles.push(this._spawn(P, R));
    P.state = { R, bubbles, prevL: 0.5, prevR: 0.5, trailL: [], trailR: [] };
  },
  _spawn(P, R) {
    const a = P.rand() * TAU, rr = Math.sqrt(P.rand()) * R * 0.86 + R * 0.1;
    return {
      x: Math.cos(a) * rr, y: Math.sin(a) * rr,
      r: 9 + P.rand() * 21, ph: P.rand() * TAU,
      alive: true, respawn: 0, pop: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // both arms RISE with the hands (right was inverted before)
    const aL = Math.PI / 2 + inp.L * Math.PI;
    const aR = Math.PI / 2 - inp.R * Math.PI;
    s.aL = aL; s.aR = aR;
    s.velL = (inp.L - s.prevL) / Math.max(dt, 1e-4); s.prevL = inp.L;
    s.velR = (inp.R - s.prevR) / Math.max(dt, 1e-4); s.prevR = inp.R;
    for (const b of s.bubbles) {
      if (!b.alive) {
        b.respawn -= dt;
        if (b.respawn <= 0) Object.assign(b, this._spawn(P, s.R));
        continue;
      }
      b.pop *= Math.pow(0.01, dt);
      // gentle drift
      b.x += Math.sin(t * 0.4 + b.ph) * dt * 4;
      b.y += Math.cos(t * 0.33 + b.ph * 2) * dt * 4;
      const dist = Math.hypot(b.x, b.y);
      if (dist > s.R - b.r) { b.x *= 0.995; b.y *= 0.995; }
      const ba = Math.atan2(b.y, b.x);
      const arm = b.x < 0 ? aL : aR;
      let diff = Math.atan2(Math.sin(ba - arm), Math.cos(ba - arm));
      const halo = Math.atan2(b.r, dist);
      if (Math.abs(diff) < halo) {
        b.alive = false; b.respawn = 2.5 + P.rand() * 4;
        b.deathX = b.x; b.deathY = b.y; b.deathR = b.r; b.deathT = t;
        // bubble size picks a tone of the CURRENT CHORD: big = low, small = high
        const ladder = Math.round((31 - b.r) / 3.6);
        const pan = b.x / s.R;
        P.ping(A => {
          A.pluck2(H.chordTone(ladder), { at: A.q(), vol: 0.15, pan, rev: 0.45, del: 0.2 });
          A.hit({ vol: 0.05, dur: 0.04, freq: 5200, pan });
        });
      }
    }
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = 'rgba(4,7,11,0.4)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    g.save(); g.translate(cx, cy);
    // court rings — deep sonar
    g.strokeStyle = 'rgba(90,130,170,0.25)'; g.lineWidth = 1;
    for (let i = 1; i <= 4; i++) { g.beginPath(); g.arc(0, 0, s.R * i / 4, 0, TAU); g.stroke(); }
    g.beginPath(); g.moveTo(0, -s.R); g.lineTo(0, s.R); g.stroke();
    // bubbles — iridescent by size
    for (const b of s.bubbles) {
      if (b.alive) {
        const breathe = 1 + 0.06 * Math.sin(t * 1.8 + b.ph);
        const hue = 165 + b.r * 4.5; // small teal → big violet
        g.strokeStyle = `hsla(${hue},85%,72%,0.9)`; g.lineWidth = 2;
        g.shadowColor = `hsl(${hue},90%,70%)`; g.shadowBlur = 8;
        g.beginPath(); g.arc(b.x, b.y, b.r * breathe, 0, TAU); g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = `hsla(${hue},90%,65%,0.1)`;
        g.beginPath(); g.arc(b.x, b.y, b.r * breathe, 0, TAU); g.fill();
        g.fillStyle = 'rgba(240,250,255,0.95)';
        g.beginPath(); g.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, 2, 0, TAU); g.fill();
      } else if (b.deathT && t - b.deathT < 0.6) {
        const k = (t - b.deathT) / 0.6;
        g.strokeStyle = `rgba(255,255,255,${1 - k})`; g.lineWidth = 3 * (1 - k);
        g.beginPath(); g.arc(b.deathX, b.deathY, b.deathR * (1 + k * 3.2), 0, TAU); g.stroke();
      }
    }
    // arms — electric white-cyan
    for (const [a, live] of [[s.aL, chan.L.mode === 'live'], [s.aR, chan.R.mode === 'live']]) {
      const grad = g.createLinearGradient(0, 0, Math.cos(a) * s.R, Math.sin(a) * s.R);
      grad.addColorStop(0, 'rgba(240,252,255,0.98)'); grad.addColorStop(1, 'rgba(110,215,255,0.12)');
      g.strokeStyle = grad; g.lineWidth = live ? 4 : 2.5;
      g.shadowColor = '#9fe4ff'; g.shadowBlur = 16;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * s.R, Math.sin(a) * s.R); g.stroke();
      g.shadowBlur = 0;
    }
    g.fillStyle = '#f2fbff'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill();
    g.restore();
  },
  audio(A, P) {
    const v = A.voice();
    const whir = v.osc('sine', 300);
    const wg = v.g(0);
    whir.connect(wg); wg.connect(v.group);
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.03, cutoff: 380 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    v.fadeIn(1, 0.8);
    return {
      tick() {
        const s = P.state;
        const vel = Math.min(1, (Math.abs(s.velL || 0) + Math.abs(s.velR || 0)) * 0.8);
        A.set(wg.gain, vel * 0.022, 0.08);
        A.set(whir.frequency, 260 + vel * 420, 0.05);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-05 · CHIME GROVE ---------- */
reg({
  id: 'SRC-05.1h', family: 'SRC-05', ver: 1, title: 'Chime Grove', tech: 'RECURSIVE TREES / WIND',
  music: { bpm: 80, root: 52, mode: 'ionian', prog: [0, 3, 5, 4] }, fx: { bloom: 0.5 },
  tags: ['FRACTAL FLORA', 'BRUSH PARADIGM', 'GUST FIELD', 'CELESTA RAIN'],
  desc: 'Seven glass trees stand in a row, always swaying a little, the way things do when a room is almost still. Your hands are gusts: raise one and the trees on that side lean away and their leaves shake loose sparks of light and sound, like brushing past wind chimes in the dark.',
  interact: 'L = gust strength on the left of the grove, R = on the right. Trees bend in proportion to the wind reaching them; the speed of your change is what shakes the leaves — fast gestures jingle, slow pressure just leans.',
  sound: 'Bed: wind — white noise through an LP whose cutoff follows total wind (Ableton: noise osc in Wavetable, cutoff 300–2500Hz). Jingles: high celesta/tingsha plucks in E major pentatonic, triggered stochastically with density proportional to shake energy, panned to tree position (Collision, glass mallet, short decay + shimmer verb). One rule builds the whole soundscape: lean = filter, shake = notes.',
  _grow(P, a, len, depth) {
    const node = { a, len, depth, kids: [] };
    if (depth > 1 && len > 3) {
      const spread = 0.42 + P.rand() * 0.2;
      node.kids.push(this._grow(P, -spread, len * (0.66 + P.rand() * 0.1), depth - 1));
      node.kids.push(this._grow(P, spread, len * (0.66 + P.rand() * 0.1), depth - 1));
    }
    return node;
  },
  init(P) {
    const trees = [];
    const nT = 7;
    for (let i = 0; i < nT; i++) {
      const tx = (i + 0.5 + (P.rand() - 0.5) * 0.4) / nT;
      const hgt = Math.min(P.w, P.h) * (0.22 + P.rand() * 0.13);
      const root = this._grow(P, -Math.PI / 2 + (P.rand() - 0.5) * 0.2, hgt, 6);
      trees.push({ tx, root, sway: 0, prevSway: 0, ph: P.rand() * TAU, shake: 0 });
    }
    P.state = { trees, sparks: [], lastJ: 0, tips: [] };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    for (const tr of s.trees) {
      const breeze = 0.06 * Math.sin(t * 0.7 + tr.ph) + 0.03 * Math.sin(t * 1.9 + tr.ph * 3);
      const wind = inp.L * bump(tr.tx, 0.22, 0.42) + inp.R * bump(tr.tx, 0.78, 0.42);
      const target = breeze + wind * 0.55;
      tr.prevSway = tr.sway;
      tr.sway += (target - tr.sway) * Math.min(1, dt * 3.4);
      const vel = Math.abs(tr.sway - tr.prevSway) / Math.max(dt, 1e-4);
      tr.shake += (vel - tr.shake) * Math.min(1, dt * 5);
      if (tr.shake > 0.09 && P.rand() < tr.shake * dt * 42 && t - s.lastJ > 0.04) {
        s.lastJ = t;
        const tips = s.tips.filter(tp => tp.tree === tr);
        const tip = tips[(P.rand() * tips.length) | 0];
        if (tip) {
          s.sparks.push({ x: tip.x, y: tip.y, vx: (P.rand() - 0.5) * 30, vy: -20 - P.rand() * 40, life: 1 });
          const note = H.chordTone(5 + ((P.rand() * 5) | 0), 1);
          P.ping(A => A.bell(note, { at: A.q(), vol: 0.042, pan: tr.tx * 2 - 1 }));
        }
      }
    }
    for (const sp of s.sparks) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 18 * dt; sp.life -= dt * 0.8; }
    s.sparks = s.sparks.filter(sp => sp.life > 0);
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#0a0608'; g.fillRect(0, 0, w, h);
    // ground — dusk
    g.strokeStyle = 'rgba(190,120,90,0.35)';
    g.beginPath(); g.moveTo(0, h * 0.92); g.lineTo(w, h * 0.92); g.stroke();
    s.tips.length = 0;
    for (const tr of s.trees) {
      const bendPer = tr.sway * 0.22;
      const drawNode = (node, x, y, absA) => {
        const a2 = absA + node.a + bendPer * (7 - node.depth);
        const x2 = x + Math.cos(a2) * node.len, y2 = y + Math.sin(a2) * node.len;
        // autumn dusk: plum trunks → amber-rose canopy
        const k7 = 7 - node.depth;
        g.strokeStyle = `rgba(${110 + k7 * 24},${62 + k7 * 20},${118 - k7 * 9},${0.28 + node.depth * 0.1})`;
        g.lineWidth = Math.max(0.9, node.depth * 0.95);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
        if (node.kids.length === 0) {
          s.tips.push({ x: x2, y: y2, tree: tr });
          const glow = 0.35 + 0.5 * Math.abs(Math.sin(t * 1.4 + x2 * 0.05));
          g.fillStyle = `rgba(255,${175 + Math.min(1, tr.shake) * 60},135,${glow * (0.5 + Math.min(1, tr.shake))})`;
          g.beginPath(); g.arc(x2, y2, 2.2 + Math.min(1, tr.shake) * 3.4, 0, TAU); g.fill();
        } else {
          for (const k of node.kids) drawNode(k, x2, y2, a2);
        }
      };
      drawNode(tr.root, tr.tx * w, h * 0.92, 0);
    }
    for (const sp of s.sparks) {
      g.fillStyle = `rgba(255,214,180,${sp.life})`;
      g.shadowColor = '#ffcfa8'; g.shadowBlur = 9;
      g.beginPath(); g.arc(sp.x, sp.y, 2 + sp.life * 1.6, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 400, 0.4);
    const ng = v.g(0.05);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const wind = (inp.L + inp.R) / 2;
        A.set(f.frequency, 280 + wind * 2200, 0.25);
        A.set(ng.gain, 0.03 + wind * 0.08, 0.25);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-07 · CORAL SCRIPTORIUM ---------- */
reg({
  id: 'SRC-07.1h', family: 'SRC-07', ver: 1, title: 'Coral Scriptorium', tech: 'GRAY-SCOTT REACTION-DIFFUSION',
  music: { bpm: 66, root: 48, mode: 'dorian', prog: [0, 2, 5, 3], chordBars: 4 }, fx: { bloom: 0.3, edge: true },
  tags: ['MORPHOGENESIS', 'FEED / KILL', 'CONTOUR BANDS', 'DRONE MORPH'],
  desc: 'A chemical argument settling into skin. The two hands hold the two liturgical constants of the reaction: what is fed in, and what is taken away. Between them the scriptorium writes corals, worms, mazes and mitosis — and rewrites them the moment either hand moves.',
  interact: 'The living patterns of Gray-Scott lie along a narrow diagonal ridge of parameter space, so the hands are mapped to the ridge itself: L walks along it (spots → worms → mazes → coral → waves, feed and kill moving together), R leans across it — the dangerous direction, toward dissolution on one side and freeze on the other. If a lean kills the reaction, the scriptorium quietly reseeds.',
  sound: 'Drone: two detuned saws through a morphing bandpass — feed maps to filter center (200–1800Hz), kill maps to resonance and detune spread (Ableton: Wavetable 2-osc, macro-morph a wavetable position with feed). Reaction activity (how fast the pattern is changing) gates a slow tremolo and a granular shimmer send. When the pattern reaches steady state the sound should go nearly still — the piece breathes only while it is deciding what to be.',
  init(P) {
    const W = 128, H = 80;
    const U = new Float32Array(W * H).fill(1), V = new Float32Array(W * H);
    const U2 = new Float32Array(W * H), V2 = new Float32Array(W * H);
    for (let k = 0; k < 7; k++) {
      const sx = (P.rand() * (W - 12)) | 0, sy = (P.rand() * (H - 12)) | 0;
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) V[(sy + y) * W + sx + x] = 0.6 + P.rand() * 0.3;
    }
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    P.state = { W, H, U, V, U2, V2, oc, og: oc.getContext('2d'), img: new ImageData(W, H), act: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, H } = s;
    const F = 0.018 + inp.L * 0.042;
    const K = 0.0495 + 0.2 * F + (inp.R - 0.5) * 0.006;
    const Du = 0.16, Dv = 0.08;
    let act = 0;
    // auto-reseed if the reaction has died
    let tot = 0;
    for (let i = 0; i < W * H; i += 7) tot += s.V[i];
    if (tot < 3) {
      for (let k = 0; k < 6; k++) {
        const sx = (P.rand() * (W - 12)) | 0, sy = (P.rand() * (H - 12)) | 0;
        for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) s.V[(sy + y) * W + sx + x] = 0.6 + P.rand() * 0.3;
      }
    }
    for (let iter = 0; iter < 6; iter++) {
      const { U, V, U2, V2 } = s;
      for (let y = 0; y < H; y++) {
        const ym = ((y - 1 + H) % H) * W, yp = ((y + 1) % H) * W, y0 = y * W;
        for (let x = 0; x < W; x++) {
          const xm = (x - 1 + W) % W, xp = (x + 1) % W;
          const i = y0 + x;
          const u = U[i], vv = V[i];
          const lapU = U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x] - 4 * u;
          const lapV = V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x] - 4 * vv;
          const uvv = u * vv * vv;
          U2[i] = u + Du * lapU - uvv + F * (1 - u);
          V2[i] = vv + Dv * lapV + uvv - (F + K) * vv;
          if (iter === 5) act += Math.abs(V2[i] - vv);
        }
      }
      s.U.set(U2); s.V.set(V2);
    }
    s.act += (act / (W * H) * 300 - s.act) * 0.08;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, H, V, img } = s;
    const d = img.data;
    for (let i = 0; i < W * H; i++) {
      const v = clamp(V[i] * 2.4);
      const band = Math.floor(v * 6) / 6;
      const vv = v * 0.45 + band * 0.55;
      // deep-sea ramp: black → teal → lime → cream
      d[i * 4] = vv < 0.5 ? vv * 40 : 20 + (vv - 0.5) * 2 * 215;
      d[i * 4 + 1] = vv * 120 + vv * vv * 135;
      d[i * 4 + 2] = vv < 0.55 ? vv * 175 : 96 - (vv - 0.55) * 60;
      d[i * 4 + 3] = 255;
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    g.fillStyle = 'rgba(140,190,110,0.85)'; g.font = '10px ui-monospace,monospace';
    const F = 0.018 + inp.L * 0.042, K = 0.0495 + 0.2 * F + (inp.R - 0.5) * 0.006;
    g.fillText('FEED ' + F.toFixed(4) + '  KILL ' + K.toFixed(4), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const o1 = v.osc('sawtooth', H.chordTone(0, -1)), o2 = v.osc('sawtooth', H.chordTone(1, -1));
    const f = v.filter('bandpass', 600, 2.5);
    const og = v.g(0.07);
    o1.connect(og); o2.connect(og); og.connect(f); f.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.6; f.connect(s2); s2.connect(A.revIn); }
    H.onChord(() => {
      A.set(o1.frequency, H.chordTone(0, -1), 1.4);
      A.set(o2.frequency, H.chordTone(1, -1), 1.8);
    });
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        A.set(f.frequency, 220 + inp.L * 1300, 0.25);
        A.set(f.Q, 2 + inp.R * 7, 0.25);
        A.set(og.gain, 0.02 + Math.min(1, P.state.act) * 0.07, 0.35);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-08 · HARMONOGRAPH DUET ---------- */
reg({
  id: 'SRC-08.1h', family: 'SRC-08', ver: 1, title: 'Harmonograph Duet', tech: 'LISSAJOUS / JUST INTONATION',
  music: { bpm: 72, root: 45, mode: 'ionian', prog: [0], chordBars: 8 }, fx: { bloom: 0.6 },
  tags: ['RATIO LOCK', 'AUDIBLE GEOMETRY', 'TRAIL DECAY', 'TWO SINES'],
  desc: 'Two pendulums, one for each hand, drawing with the same pen. Each hand chooses a pitch from a just-intonation ladder; the figure on screen is literally the interval between them. Simple ratios close into calm knots — a fifth is a trefoil, an octave is a lens. Dissonance never stops writhing.',
  interact: 'L = frequency of the horizontal pendulum, R = vertical, both snapped to an 8-step just-intonation ladder. The visual IS the sound: when the figure closes and holds still, you are hearing a consonant interval. Hunt for the knots.',
  sound: 'Literal: two sine oscillators at the actual displayed ratio (base A2 110Hz × ratio, one per hand, L panned slightly left, R right). Slow attack, no effects except a tiny room verb — the interference is the content. In Ableton: two Operator sines, pitch via CC-mapped scale device constrained to a just scale; add a sub-octave when the interval locks (ratio = simple) for reward weight.',
  init(P) {
    P.state = { s: 0, ph: P.rand() * TAU, prevIL: -1, prevIR: -1, lock: 0, cleared: false };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const RAT = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2];
    s.iL = Math.round(inp.L * 7); s.iR = Math.round(inp.R * 7);
    s.rL = RAT[s.iL]; s.rR = RAT[s.iR];
    if (s.iL !== s.prevIL || s.iR !== s.prevIR) {
      s.prevIL = s.iL; s.prevIR = s.iR;
      P.ping(A => A.pluck2(H.rootFreq(0) * s.rL, { at: A.q(), vol: 0.05, dur: 0.3 }));
    }
    s.s += dt * 1.4;
    s.ph += dt * 0.07;
    // consonance measure: simple ratio of ratios
    const q = s.rL / s.rR;
    const SIMPLE = [1, 2, 0.5, 1.5, 2 / 3, 4 / 3, 0.75, 1.25, 0.8];
    let best = 99;
    for (const sm of SIMPLE) best = Math.min(best, Math.abs(q - sm));
    const locked = best < 0.01;
    s.lock += ((locked ? 1 : 0) - s.lock) * Math.min(1, dt * 2);
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = 'rgba(6,8,7,0.045)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, A0 = Math.min(w, h) * 0.42;
    const w1 = s.rL * 1.9, w2 = s.rR * 1.9;
    const steps = 160;
    // rose-violet, burning to white at lock
    g.strokeStyle = `hsla(${300 + s.lock * 30},${65 - s.lock * 40}%,${68 + s.lock * 26}%,${0.6 + s.lock * 0.4})`;
    g.lineWidth = 2.2 + s.lock * 1.4;
    if (s.lock > 0.6) { g.shadowColor = '#ffe8ff'; g.shadowBlur = 12; }
    g.beginPath();
    for (let i = 0; i <= steps; i++) {
      const tt = s.s + i / steps * 0.3;
      const x = cx + A0 * Math.sin(w1 * tt * TAU * 0.2 + s.ph);
      const y = cy + A0 * 0.8 * Math.sin(w2 * tt * TAU * 0.2);
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    g.shadowBlur = 0;
    // pen head
    const x = cx + A0 * Math.sin(w1 * (s.s + 0.3) * TAU * 0.2 + s.ph);
    const y = cy + A0 * 0.8 * Math.sin(w2 * (s.s + 0.3) * TAU * 0.2);
    g.fillStyle = '#fff'; g.shadowColor = '#ffeaff'; g.shadowBlur = 14;
    g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill();
    g.shadowBlur = 0;
    // ratio label on a solid strip (so it doesn't ghost into the trail)
    const NAMES = ['1:1', '9:8', '5:4', '4:3', '3:2', '5:3', '15:8', '2:1'];
    const fs = Math.max(10, h * 0.022);
    g.fillStyle = '#060807'; g.fillRect(0, 0, w, fs * 2.1);
    g.fillStyle = 'rgba(235,180,225,0.9)'; g.font = `${fs}px ui-monospace,monospace`;
    g.fillText('L ' + NAMES[s.iL] + '   R ' + NAMES[s.iR] + (s.lock > 0.7 ? '   ◆ LOCK' : ''), 12, fs * 1.4);
  },
  audio(A, P) {
    const v = A.voice();
    const oL = v.osc('sine', 220), oR = v.osc('sine', 220);
    const gL = v.g(0.09), gR = v.g(0.09);
    oL.connect(gL); oR.connect(gR);
    if (A.ctx.createStereoPanner) {
      const pL = A.ctx.createStereoPanner(); pL.pan.value = -0.4;
      const pR = A.ctx.createStereoPanner(); pR.pan.value = 0.4;
      gL.connect(pL); pL.connect(v.group); gR.connect(pR); pR.connect(v.group);
    } else { gL.connect(v.group); gR.connect(v.group); }
    const sub = v.osc('sine', 55);
    const sg = v.g(0);
    sub.connect(sg); sg.connect(v.group);
    v.fadeIn(1, 0.8);
    return {
      tick() {
        const s = P.state;
        const base = H.rootFreq(0);
        A.set(oL.frequency, base * s.rL, 0.07);
        A.set(oR.frequency, base * s.rR, 0.07);
        A.set(sg.gain, s.lock * 0.07, 0.3);
        A.set(sub.frequency, base * 0.5 * s.rL, 0.2);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-10 · WEATHER STATION ---------- */
reg({
  id: 'SRC-10.1h', family: 'SRC-10', ver: 1, title: 'Weather Station', tech: 'FLOW FIELD / IDEOMETRIC PLANE',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 }, fx: { bloom: 0.4, edge: true },
  tags: ['VECTOR FIELD', 'HEADING + TURBULENCE', 'TRAIL FADE', 'AEOLIAN TONES'],
  desc: 'Weather for a place that has no sky: a wind measured by a grid of a thousand travelling particles. The left hand is the compass — it turns the prevailing wind through all 360 degrees. The right hand is the weather itself: calm lines at rest, storm cells and vortices at full stretch.',
  interact: 'L = wind heading (full circle). R = energy — speed and turbulence together. Note the paradigm: one hand steers a direction, the other pushes intensity. Angular + scalar is one of the strongest two-hand pairings.',
  sound: 'Wind: noise through LP, cutoff and gain both riding R (the classic). Aeolian tones: two or three quiet sines around 400–900Hz with slow random vibrato, detuning wider as turbulence rises — like wires singing in wind (Ableton: Operator sines, LFO amount on pitch mapped to R). Heading L maps to stereo azimuth — pan the entire weather across the field as the compass turns.',
  init(P) {
    const parts = [];
    const n = Math.min(1600, Math.round(650 * areaScale(P)));
    for (let i = 0; i < n; i++) parts.push({ x: P.rand() * P.w, y: P.rand() * P.h, px: 0, py: 0 });
    P.state = { parts, first: true };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const heading = inp.L * TAU;
    const speed = 26 + inp.R * 170;
    const turb = 0.25 + inp.R * 2.4;
    const k1 = 0.008, k2 = 0.011, k3 = 0.006;
    for (const p of s.parts) {
      const a = heading
        + turb * Math.sin(p.x * k1 + t * 0.35)
        + turb * Math.cos(p.y * k2 - t * 0.28)
        + turb * 0.7 * Math.sin((p.x + p.y) * k3 + t * 0.15);
      p.px = p.x; p.py = p.y;
      p.x += Math.cos(a) * speed * dt;
      p.y += Math.sin(a) * speed * dt;
      if (p.x < 0 || p.x > P.w || p.y < 0 || p.y > P.h) {
        p.x = P.rand() * P.w; p.y = P.rand() * P.h; p.px = p.x; p.py = p.y;
      }
    }
    s.heading = heading; s.energy = inp.R;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    if (s.first) { g.fillStyle = '#0a0c0d'; g.fillRect(0, 0, w, h); s.first = false; }
    g.fillStyle = 'rgba(10,12,13,0.09)'; g.fillRect(0, 0, w, h);
    g.lineWidth = 1.6;
    // THE WIND IS A COLOR WHEEL: direction of travel = hue, so the compass
    // becomes visible in the weather itself
    for (const p of s.parts) {
      const d = Math.hypot(p.x - p.px, p.y - p.py);
      if (d > 30 || d < 0.4) continue;
      const hue = (Math.atan2(p.y - p.py, p.x - p.px) / TAU * 360 + 360) % 360;
      g.strokeStyle = `hsla(${hue},75%,${58 + s.energy * 18}%,${0.2 + s.energy * 0.3})`;
      g.beginPath(); g.moveTo(p.px, p.py); g.lineTo(p.x, p.y); g.stroke();
    }
    // compass — hue ring
    const cx = w - 46, cy = 44, r = 22;
    for (let a = 0; a < 24; a++) {
      g.strokeStyle = `hsla(${a * 15},75%,60%,0.6)`;
      g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, r, a / 24 * TAU, (a + 0.8) / 24 * TAU); g.stroke();
    }
    g.strokeStyle = '#fff'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(s.heading) * r, cy + Math.sin(s.heading) * r); g.stroke();
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = '10px ui-monospace,monospace';
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

/* ---------- SRC-28 · CHLADNI COURT ---------- */
reg({
  id: 'SRC-28.1h', family: 'SRC-28', ver: 1, title: 'Chladni Court', tech: 'STANDING WAVES / SAND ON A PLATE',
  music: { bpm: 58, root: 50, mode: 'lydian', prog: [0, 4], chordBars: 4 },
  fx: { bloom: 0.5, edge: true },
  tags: ['CYMATICS', 'MODE LOCK', 'SOUND MADE VISIBLE', 'RESONANCE REWARD'],
  desc: 'The oldest trick for seeing sound: sand on a vibrating plate gathers along the silent lines. Here the source itself is the driver at the center of the plate, and each hand tunes one of the two mode numbers. Between integers the sand seethes, homeless; land both hands on whole numbers and the plate LOCKS — a resonant mode snaps into geometry, the sand rushes to its nodal lines, and the two modes sound as an interval. Cymatics is the thesis of the whole installation: this is light behaving the way sound does.',
  interact: 'L = mode number n (1–7), R = mode number m. The play is the hunt for resonance: integers are stable patterns, everything between is beautiful chaos. Ratio matters like the harmonograph — n:m = 2:3 locks a fifth in both geometry and sound. Slow hands near a lock let you watch the pattern crystallize grain by grain.',
  sound: 'Two plate tones — the actual modes: sine-heavy voices at the chord tones indexed by n and m, gain swelling with resonance (Ableton: glass/bowl patches, one per hand-side). Sand: granular rushing noise, gain from total grain motion — a real shhhh as patterns break and reform (granular engine, tiny grains, band-passed 2–6k). On lock: one soft tam-tam-ish bloom, then let the interval ring. On break: the noise swells as the geometry dissolves.',
  init(P) {
    const n = Math.round(2200 * Math.min(2.2, areaScale(P)));
    const grains = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { grains[i * 2] = P.rand(); grains[i * 2 + 1] = P.rand(); }
    P.state = { grains, n, res: 0, wasLocked: false, motion: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const nM = 1 + inp.L * 6, mM = 1 + inp.R * 6;
    s.nM = nM; s.mM = mM;
    const fn = Math.abs(nM - Math.round(nM)), fm = Math.abs(mM - Math.round(mM));
    const res = clamp(1 - (fn + fm) / 0.14);
    s.res += (res - s.res) * Math.min(1, dt * 3);
    const locked = s.res > 0.6;
    if (locked && !s.wasLocked) {
      const ni = Math.round(nM), mi = Math.round(mM);
      P.ping(A => {
        A.bell(H.chordTone(ni, 0), { at: A.q(), vol: 0.09, dur: 5, rev: 0.75 });
        A.bell(H.chordTone(mi, 0), { at: A.q(), vol: 0.09, dur: 5, rev: 0.75, pan: 0.3 });
      });
    }
    s.wasLocked = locked;
    // sand physics: descend the energy |χ|², jitter when unresolved
    const PI = Math.PI;
    const chi = (x, y) => Math.cos(nM * PI * x) * Math.cos(mM * PI * y) - Math.cos(mM * PI * x) * Math.cos(nM * PI * y);
    const eps = 0.004, k = dt * (0.07 + s.res * 0.3);
    const jit = dt * (0.04 * (1 - s.res) + 0.005);
    let motion = 0;
    const g2 = s.grains;
    for (let i = 0; i < s.n; i++) {
      let x = g2[i * 2], y = g2[i * 2 + 1];
      const c0 = chi(x, y);
      const gx = (Math.abs(chi(x + eps, y)) - Math.abs(c0)) / eps;
      const gy = (Math.abs(chi(x, y + eps)) - Math.abs(c0)) / eps;
      const dx = -gx * k + (Math.random() - 0.5) * jit;
      const dy = -gy * k + (Math.random() - 0.5) * jit;
      x += dx; y += dy;
      motion += Math.abs(dx) + Math.abs(dy);
      if (x < 0.02) x = 0.02; if (x > 0.98) x = 0.98;
      if (y < 0.02) y = 0.02; if (y > 0.98) y = 0.98;
      g2[i * 2] = x; g2[i * 2 + 1] = y;
    }
    s.motion += (motion / s.n / Math.max(dt, 1e-4) - s.motion) * Math.min(1, dt * 4);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,4,5,0.55)'; g.fillRect(0, 0, w, h);
    const m = Math.min(w, h) * 0.92;
    const x0 = (w - m) / 2, y0 = (h - m) / 2;
    // plate
    g.strokeStyle = `rgba(160,150,130,${0.2 + s.res * 0.3})`;
    g.lineWidth = 1.5;
    g.strokeRect(x0, y0, m, m);
    // sand
    const warm = s.res;
    g.fillStyle = `rgba(${235},${218 + warm * 20},${160 + warm * 60},${0.5 + warm * 0.4})`;
    const g2 = s.grains;
    for (let i = 0; i < s.n; i++) {
      g.fillRect(x0 + g2[i * 2] * m, y0 + g2[i * 2 + 1] * m, 1.3, 1.3);
    }
    // the driver — the source at plate center
    const cx = w / 2, cy = h / 2;
    const pulse = 0.5 + 0.5 * Math.sin(t * (2 + s.res * 6));
    g.fillStyle = `rgba(10,10,12,1)`;
    g.beginPath(); g.arc(cx, cy, m * 0.035, 0, TAU); g.fill();
    g.strokeStyle = `rgba(200,255,180,${0.25 + pulse * 0.4 * (0.4 + s.res)})`;
    g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, m * 0.035 + 3 + pulse * 3, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(200,190,150,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('N ' + s.nM.toFixed(2) + '  M ' + s.mM.toFixed(2) + (s.res > 0.6 ? '  ◆ MODE LOCK ' + Math.round(s.nM) + ':' + Math.round(s.mM) : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const oN = v.osc('sine', 220), oM = v.osc('sine', 330);
    const gN = v.g(0.0001), gM = v.g(0.0001);
    oN.connect(gN); gN.connect(v.group);
    oM.connect(gM); gM.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.7; gN.connect(s2); gM.connect(s2); s2.connect(A.revIn); }
    const sand = v.noise();
    const sf = v.filter('bandpass', 3800, 0.8);
    const sg = v.g(0);
    sand.connect(sf); sf.connect(sg); sg.connect(v.group);
    const pads = A.padVoices(v, 2, { type: 'triangle', gain: 0.025, cutoff: 300 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2));
    v.fadeIn(1, 1.2);
    return {
      tick() {
        const s = P.state;
        A.set(oN.frequency, H.chordTone(Math.round(s.nM || 1), 0), 0.2);
        A.set(oM.frequency, H.chordTone(Math.round(s.mM || 1), 0), 0.2);
        A.set(gN.gain, s.res * 0.06, 0.3);
        A.set(gM.gain, s.res * 0.06, 0.3);
        A.set(sg.gain, Math.min(0.09, (s.motion || 0) * 0.35) * (1 - s.res * 0.6), 0.15);
        MOut.expr('lead', s.res);
      },
      stop() { v.kill(); }
    };
  }
});

/* ============================================================
   SRC-30 · STORM GARDEN — herd the clouds, build the beat
   ============================================================ */
reg({
  id: 'SRC-30.1h', family: 'SRC-30', ver: 1, title: 'Storm Garden', tech: 'CLOUD HERD / ARRANGEMENT ENGINE',
  music: { bpm: 96, root: 45, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { bloom: 0.6, edge: true },
  tags: ['CHARGE = INTENSITY', 'BEAT THAT BUILDS', 'LIGHTNING PAYOFF', 'VOLUME NATIVE'],
  desc: 'A garden of slow clouds drifting through the volume, each one an instrument waiting to be fed. Each hand is a storm front — a horizontal line of pressure at your hand\'s height. Sweep it through a cloud and the cloud charges: darker, denser, raining harder, and the rain is the music. The arrangement obeys the weather: a calm sky is pads and sparse piano-rain; feed the clouds and a pulse fades in; keep feeding and the hats arrive; drive the whole garden to storm and the beat drops fully. Overcharge any single cloud and it DISCHARGES — lightning to the ground, the whole volume flashes white, thunder on your sample channel — and that cloud, spent, drifts quiet again.',
  interact: 'L = altitude of the west storm front, R = east (up is up — clouds at your hand\'s height charge). Herding is the game: rake a front up and down to feed many clouds a little, or park it on one cloud and ride it to lightning. Total charge = arrangement intensity; single-cloud overcharge = the strike. Build the storm, then conduct it.',
  sound: 'The arrangement ladder, all on the grid at 96bpm, all over MIDI: STAGE 0 pads + rain-plinks (lead, pitch by cloud position). STAGE 1 (+charge) pulse bass 8ths fades in. STAGE 2 swung hats + sparse arp. STAGE 3 four-on-the-floor + clap — the drop. Lightning: crack on bells, thunder = long low note on the texture channel (rack your REAL thunder + rain samples there; this scene was built for them). In Ableton: sidechain pads/bass to the kick so the storm pumps; map CC74 (pad) to a big reverb size — the sky literally opens as it charges.',
  init(P) {
    const clouds = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const puffs = [];
      for (let k = 0; k < 5; k++) {
        puffs.push({ dx: (P.rand() - 0.5) * 1.7, dy: (P.rand() - 0.5) * 0.5, r: 0.55 + P.rand() * 0.6 });
      }
      clouds.push({
        x: (i + 0.5) / n + (P.rand() - 0.5) * 0.06, y: 0.14 + P.rand() * 0.42,
        vx: (P.rand() - 0.5) * 0.008, scale: 0.75 + P.rand() * 0.6,
        charge: P.rand() * 0.15, puffs, ph: P.rand() * TAU, flash: 0, lastPlink: 0
      });
    }
    P.state = { clouds, drops: [], splashes: [], bolts: [], skyFlash: 0, total: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const groundY = 0.88;
    const bandL = 0.08 + (1 - inp.L) * 0.6;   // hand height → front altitude (up is up)
    const bandR = 0.08 + (1 - inp.R) * 0.6;
    s.bandL = bandL; s.bandR = bandR;
    let total = 0;
    for (const c of s.clouds) {
      c.x += c.vx * dt + Math.sin(t * 0.13 + c.ph) * dt * 0.004;
      if (c.x < -0.08) c.x = 1.08; if (c.x > 1.08) c.x = -0.08;
      c.y += Math.sin(t * 0.21 + c.ph * 2) * dt * 0.004;
      const band = c.x < 0.5 ? bandL : bandR;
      const handV = c.x < 0.5 ? inp.L : inp.R;
      const feed = bump(c.y, band, 0.11) * (0.25 + handV * 0.4);
      c.charge = clamp(c.charge + feed * dt * 0.4 - dt * 0.025, 0, 1.02);
      c.flash *= Math.pow(0.01, dt);
      total += Math.min(1, c.charge);
      // rain
      const rate = c.charge * c.charge * 34;
      if (P.rand() < rate * dt) {
        s.drops.push({
          x: (c.x + (P.rand() - 0.5) * 0.09 * c.scale) * w,
          y: (c.y + 0.05) * h, vy: (260 + P.rand() * 160) * (0.6 + c.charge * 0.5), c
        });
      }
      // LIGHTNING
      if (c.charge >= 1) {
        c.charge = 0.22; c.flash = 1; s.skyFlash = 1;
        const pts = [[c.x * w, (c.y + 0.04) * h]];
        let bx = c.x * w;
        for (let yy = c.y + 0.08; yy < groundY; yy += 0.07) {
          bx += (P.rand() - 0.5) * w * 0.05;
          pts.push([bx, yy * h]);
        }
        pts.push([bx, groundY * h]);
        s.bolts.push({ pts, life: 1 });
        const pan = c.x * 2 - 1;
        P.ping(A => {
          MOut.evNote('texture', H.rootFreq(-3), 0.6, 0, 4);           // your real thunder lives here
          A.hit({ vol: 0.4, dur: 1.4, freq: 70, q: 0.4, type: 'lowpass' });
          A.hit({ vol: 0.22, dur: 0.08, freq: 6000, q: 0.4, pan });
          A.bell(H.chordTone(9, 1), { vol: 0.12, dur: 3, rev: 0.8, pan });
          A.bassNote(H.rootFreq(-2), { vol: 0.25, dur: 2.2 });
        });
      }
    }
    s.total += (total / s.clouds.length - s.total) * Math.min(1, dt * 2);
    s.skyFlash *= Math.pow(0.004, dt);
    // drops fall
    for (const d of s.drops) { d.y += d.vy * dt; }
    const gY = groundY * h;
    for (const d of s.drops) {
      if (d.y >= gY) {
        s.splashes.push({ x: d.x, t });
        if (t - d.c.lastPlink > 0.13 && d.c.charge > 0.12) {
          d.c.lastPlink = t;
          const deg = Math.round(d.c.x * 9);
          const vol = 0.05 + d.c.charge * 0.07;
          P.ping(A => A.pluck2(H.scaleTone(deg, 0), { at: A.q(), vol, dur: 1, pan: d.c.x * 2 - 1, rev: 0.4, del: 0.15 }));
        }
      }
    }
    s.drops = s.drops.filter(d => d.y < gY);
    s.splashes = s.splashes.filter(sp => t - sp.t < 0.5);
    for (const b of s.bolts) b.life -= dt * 2.6;
    s.bolts = s.bolts.filter(b => b.life > 0);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,5,10,0.5)'; g.fillRect(0, 0, w, h);
    // sky flash — the whole volume ignites
    if (s.skyFlash > 0.01) {
      g.fillStyle = `rgba(225,220,255,${s.skyFlash * 0.4})`;
      g.fillRect(0, 0, w, h);
    }
    const groundY = 0.88 * h;
    // storm fronts (the hands)
    for (const [band, x0, x1, live] of [[s.bandL, 0, w * 0.5, chan.L.mode === 'live'], [s.bandR, w * 0.5, w, chan.R.mode === 'live']]) {
      const y = band * h;
      g.strokeStyle = `rgba(160,200,255,${live ? 0.5 : 0.22})`;
      g.lineWidth = 1.5;
      g.setLineDash([10, 8]);
      g.beginPath(); g.moveTo(x0 + 8, y); g.lineTo(x1 - 8, y); g.stroke();
      g.setLineDash([]);
      const cx2 = (x0 + x1) / 2;
      g.fillStyle = `rgba(200,225,255,${live ? 0.9 : 0.4})`;
      g.beginPath(); g.arc(cx2, y, 4, 0, TAU); g.fill();
    }
    // rain
    g.lineWidth = 1.4;
    for (const d of s.drops) {
      const ch = d.c.charge;
      g.strokeStyle = `rgba(${165 + ch * 60},${200 + ch * 30},255,${0.3 + ch * 0.5})`;
      g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 1.5, d.y + 9 + ch * 8); g.stroke();
    }
    // splashes
    for (const sp of s.splashes) {
      const k = (t - sp.t) / 0.5;
      g.strokeStyle = `rgba(180,215,255,${(1 - k) * 0.5})`;
      g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(sp.x, groundY, 4 + k * 16, (4 + k * 16) * 0.3, 0, 0, TAU); g.stroke();
    }
    // ground
    g.strokeStyle = 'rgba(120,150,200,0.3)';
    g.beginPath(); g.moveTo(w * 0.03, groundY); g.lineTo(w * 0.97, groundY); g.stroke();
    // clouds
    const m = Math.min(w, h);
    for (const c of s.clouds) {
      const cx2 = c.x * w, cy2 = c.y * h;
      const base = m * 0.052 * c.scale;
      const ch = Math.min(1, c.charge);
      for (const p2 of c.puffs) {
        const px = cx2 + p2.dx * base * 1.6, py = cy2 + p2.dy * base * 1.4 + Math.sin(t * 0.6 + c.ph + p2.dx) * 2;
        const pr = base * p2.r * (1 + ch * 0.24);
        const gr = g.createRadialGradient(px, py - pr * 0.3, pr * 0.1, px, py, pr);
        // indigo sleeper → violet-white storm core
        const lum = 26 + ch * 52 + c.flash * 40;
        gr.addColorStop(0, `hsla(${255 - ch * 25},${38 + ch * 42}%,${lum + 26}%,${0.75})`);
        gr.addColorStop(0.7, `hsla(${250 - ch * 15},${34 + ch * 30}%,${lum}%,${0.5})`);
        gr.addColorStop(1, `hsla(245,30%,${lum * 0.6}%,0)`);
        g.fillStyle = gr;
        g.beginPath(); g.arc(px, py, pr, 0, TAU); g.fill();
      }
      // charge meter: a heartbeat glow under the cloud, pulsing with the transport
      if (ch > 0.08) {
        const pulse = (P.focused && T.running) ? T.beatPulse() : Math.max(0, Math.sin(t * 5));
        g.fillStyle = `hsla(${265 - ch * 40},90%,${60 + ch * 25}%,${ch * (0.25 + pulse * 0.45)})`;
        g.beginPath(); g.arc(cx2, cy2 + base * 1.1, base * (0.34 + ch * 0.3), 0, TAU); g.fill();
      }
    }
    // bolts
    for (const b of s.bolts) {
      g.strokeStyle = `rgba(240,238,255,${b.life})`;
      g.lineWidth = 2.5 + b.life * 2;
      g.shadowColor = '#cfc4ff'; g.shadowBlur = 24 * b.life;
      g.beginPath();
      g.moveTo(b.pts[0][0], b.pts[0][1]);
      for (let i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i][0], b.pts[i][1]);
      g.stroke();
      g.shadowBlur = 0;
    }
    // storm meter HUD
    g.fillStyle = 'rgba(170,195,240,0.8)'; g.font = '10px ui-monospace,monospace';
    const stage = s.total > 0.72 ? 3 : s.total > 0.5 ? 2 : s.total > 0.28 ? 1 : 0;
    g.fillText('STORM ' + Math.round(s.total * 100) + '%  STAGE ' + stage + ['  · PADS', '  · +PULSE', '  · +HATS', '  · FULL BEAT'][stage], 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 4, { type: 'sawtooth', gain: 0.034, cutoff: 420, q: 0.5 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 1.4));
    let next16 = T.next(0.25), st16 = 0;
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const s = P.state;
        const total = s.total;
        pads.forEach(p => p.bright(320 + total * 1600, 0.4));
        MOut.expr('pad', total);
        const horizon = AE.t() + 0.15;
        while (next16 < horizon) {
          const st = st16 % 16;
          const sw = st % 2 === 1 ? T.beat * 0.075 : 0;
          const tt = next16 + sw;
          // STAGE 1+: pulse bass fades in with the storm
          if (total > 0.28 && st % 2 === 0) {
            const bv = Math.min(0.2, (total - 0.24) * 0.5);
            const bf = H.rootFreq(st % 8 === 0 ? -2 : -1);
            A.bassNote(bf, { at: next16, vol: bv, dur: 0.24 });
          }
          // STAGE 2+: swung hats + sparse arp
          if (total > 0.5) {
            if (st % 2 === 1) A.hat(tt, { vol: 0.02 + total * 0.03 });
            if (st % 8 === 6) A.hat(tt, { vol: 0.02, open: true });
            if (st % 4 === 2) A.tone(H.chordTone(2 + ((st16 >> 2) % 4) * 2, 0), { at: tt, vol: 0.05 + total * 0.03, dur: 0.18, type: 'square', rev: 0.2, del: 0.35 });
          }
          // STAGE 3: the drop — four-on-the-floor + clap
          if (total > 0.72) {
            if (st % 4 === 0) A.kick(next16, 0.3);
            if (st % 8 === 4) {
              MOut.evDrum(38, 0.24, next16);
              A.hit({ vol: 0.16, dur: 0.14, freq: 1900, q: 0.8, at: next16 });
            }
          }
          st16++; next16 += T.beat * 0.25;
        }
        if (next16 < AE.t()) next16 = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});

/* ============================================================
   SRC-32 · SONORA — desert stones in an unseen river
   ============================================================ */
reg({
  id: 'SRC-32.1h', family: 'SRC-32', ver: 1, title: 'Sonora', tech: 'STONE BED / SIDE PRESSURE',
  music: { bpm: 60, root: 46, mode: 'mixolydian', prog: [0, 6, 4, 5], chordBars: 4 },
  fx: { bloom: 0.45, edge: true },
  tags: ['OVERTONE SERIES', 'PRESSURE FROM THE SIDES', 'UNSEEN WATER', 'STONE PERCUSSION'],
  desc: 'Sun-baked stones — Sedona reds, ochres, dusty rose, each banded with its strata — floating in a bed of water you never see. You only know the water by how the stones move: heavy, damped, patient. Your hands are pressure from the walls of the canyon: raise them and an unseen force closes in from both sides, herding the stones together. When stone meets stone, sound — and because every stone is tuned to a harmonic of the same deep fundamental, every collision is consonant with every other. Squeeze hard and the bed clatters into a ringing overtone chorus; release, and the river slows the stones to silence.',
  interact: 'L = pressure from the west wall, R = east. Both high: the stones crowd the center and the collisions cascade. One hand: herd the whole bed to the far side. Let go entirely and watch the water bring everything to rest — the silence at the end is part of the piece. Pressure, not aim: you play this like squeezing a slow instrument.',
  sound: 'Collisions: stone knock (short woody transient) + a ringing partial — each stone owns one harmonic (2nd through 12th) of the key\'s deep fundamental, big stones low, pebbles high; impact speed = velocity. The overtone series means ANY simultaneous collisions form a natural chord (Ableton: tuned log drums / Collision wood resonator on CH1; the harmonics land on real pitches). Bed: near-silent root+fifth drone that swells with the bed\'s total motion, plus a soft underwater wash. Rolls and grinds: low friction noise when stones slide along each other. Let the ringing tails stack in a warm plate reverb.',
  init(P) {
    const m = Math.min(P.w, P.h);
    const HARM = [2, 3, 4, 5, 6, 8, 9, 10, 12, 3, 5, 6, 8, 4];
    const stones = [];
    const n = 13;
    for (let i = 0; i < n; i++) {
      const r = m * (0.028 + P.rand() * 0.05);
      // organic rounded-polygon outline
      const verts = [];
      const nv = 9 + (P.rand() * 4 | 0);
      for (let k = 0; k < nv; k++) verts.push(0.78 + P.rand() * 0.34);
      stones.push({
        x: P.w * (0.12 + P.rand() * 0.76), y: P.h * (0.15 + P.rand() * 0.7),
        vx: 0, vy: 0, r, verts, ang: P.rand() * TAU, va: 0,
        hue: 8 + P.rand() * 28, sat: 45 + P.rand() * 25, lum: 38 + P.rand() * 18,
        ph: P.rand() * TAU, lastHit: 0
      });
    }
    // biggest stone = lowest harmonic
    const sorted = [...stones].sort((a, b) => b.r - a.r);
    sorted.forEach((st, i) => { st.harm = HARM[i % HARM.length]; });
    P.state = { stones, ripples: [], chips: [], energy: 0, grind: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    let energy = 0, grind = 0;
    for (const st of s.stones) {
      // side pressure: unseen canyon walls closing in
      const pushL = inp.L * 620 * Math.pow(Math.max(0, 1 - st.x / (w * 0.62)), 2);
      const pushR = inp.R * 620 * Math.pow(Math.max(0, 1 - (w - st.x) / (w * 0.62)), 2);
      st.vx += (pushL - pushR) * dt;
      // gentle river wander so the bed is never dead
      st.vx += Math.sin(t * 0.23 + st.ph) * dt * 6;
      st.vy += Math.cos(t * 0.19 + st.ph * 2) * dt * 6;
      // the unseen water: heavy drag
      const drag = Math.pow(0.32, dt);
      st.vx *= drag; st.vy *= drag; st.va *= drag;
      st.x += st.vx * dt; st.y += st.vy * dt; st.ang += st.va * dt;
      // soft bounds
      const pad = st.r + 6;
      if (st.x < pad) { st.x = pad; st.vx = Math.abs(st.vx) * 0.4; }
      if (st.x > w - pad) { st.x = w - pad; st.vx = -Math.abs(st.vx) * 0.4; }
      if (st.y < pad) { st.y = pad; st.vy = Math.abs(st.vy) * 0.4; }
      if (st.y > h - pad) { st.y = h - pad; st.vy = -Math.abs(st.vy) * 0.4; }
      energy += Math.hypot(st.vx, st.vy);
    }
    // stone-on-stone
    for (let i = 0; i < s.stones.length; i++) {
      for (let j = i + 1; j < s.stones.length; j++) {
        const a = s.stones[i], b = s.stones[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.92;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d;
          const overlap = (min - d) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          const tang = Math.abs((b.vx - a.vx) * -ny + (b.vy - a.vy) * nx);
          grind += tang;
          if (rel < 0) {
            const imp = -rel * 0.72;
            a.vx -= imp * nx; a.vy -= imp * ny;
            b.vx += imp * nx; b.vy += imp * ny;
            a.va += (P.rand() - 0.5) * imp * 0.02;
            b.va += (P.rand() - 0.5) * imp * 0.02;
            const speed = -rel;
            if (speed > 26 && t - a.lastHit > 0.12 && t - b.lastHit > 0.09) {
              a.lastHit = b.lastHit = t;
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              s.ripples.push({ x: mx, y: my, t });
              for (let k = 0; k < 3; k++) s.chips.push({ x: mx, y: my, vx: (P.rand() - 0.5) * 60, vy: (P.rand() - 0.5) * 60, life: 0.7 });
              const big = a.r > b.r ? a : b;
              const f0 = H.rootFreq(-2);
              const vol = clamp((speed - 26) / 320, 0.04, 0.22);
              const pan = (mx / w) * 2 - 1;
              P.ping(A => {
                A.hit({ vol: vol * 0.9, dur: 0.035, freq: 1500 + big.harm * 120, q: 2.4, pan });
                A.tone(f0 * big.harm, { vol, dur: 0.5 + big.r / 40, type: 'sine', pan, rev: 0.4 });
                A.tone(f0 * big.harm * 2, { vol: vol * 0.28, dur: 0.3, type: 'sine', pan, rev: 0.4 });
              });
            }
          }
        }
      }
    }
    s.energy += (Math.min(1, energy / (s.stones.length * 90)) - s.energy) * Math.min(1, dt * 3);
    s.grind += (Math.min(1, grind / 500) - s.grind) * Math.min(1, dt * 5);
    for (const rp of s.ripples) void rp;
    s.ripples = s.ripples.filter(rp => t - rp.t < 1.6);
    for (const c of s.chips) { c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt * 1.6; }
    s.chips = s.chips.filter(c => c.life > 0);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,4,8,0.5)'; g.fillRect(0, 0, w, h);
    // pressure walls — warm light pressing in from the sides
    for (const [v, x0, dir] of [[inp.L, 0, 1], [inp.R, w, -1]]) {
      if (v < 0.03) continue;
      const gw = w * 0.2 * v;
      const gr = g.createLinearGradient(x0, 0, x0 + dir * gw, 0);
      gr.addColorStop(0, `rgba(255,150,80,${0.16 + v * 0.2})`);
      gr.addColorStop(1, 'rgba(255,150,80,0)');
      g.fillStyle = gr;
      g.fillRect(dir > 0 ? 0 : w - gw, 0, gw, h);
    }
    // ripples — the only proof of water
    for (const rp of s.ripples) {
      const k = (t - rp.t) / 1.6;
      g.strokeStyle = `rgba(110,220,215,${(1 - k) * 0.55})`;
      g.lineWidth = 1.6 * (1 - k);
      g.beginPath(); g.arc(rp.x, rp.y, 8 + k * 90, 0, TAU); g.stroke();
      g.strokeStyle = `rgba(110,220,215,${(1 - k) * 0.25})`;
      g.beginPath(); g.arc(rp.x, rp.y, 4 + k * 55, 0, TAU); g.stroke();
    }
    // stones
    for (const st of s.stones) {
      const nv = st.verts.length;
      g.save();
      g.translate(st.x, st.y); g.rotate(st.ang);
      g.beginPath();
      for (let k = 0; k <= nv; k++) {
        const a = k / nv * TAU;
        const rr = st.r * st.verts[k % nv];
        k === 0 ? g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath();
      // sun-baked gradient
      const gr = g.createLinearGradient(0, -st.r, 0, st.r);
      gr.addColorStop(0, `hsl(${st.hue + 8},${st.sat + 12}%,${st.lum + 16}%)`);
      gr.addColorStop(0.55, `hsl(${st.hue},${st.sat}%,${st.lum}%)`);
      gr.addColorStop(1, `hsl(${st.hue - 6},${st.sat - 8}%,${st.lum - 14}%)`);
      g.fillStyle = gr;
      g.fill();
      // strata bands
      g.save();
      g.clip();
      for (let b = -2; b <= 2; b++) {
        const by = b * st.r * 0.34 + Math.sin(st.ph * 3 + b) * st.r * 0.08;
        g.fillStyle = `hsla(${st.hue - 10},${st.sat}%,${st.lum - 10 + (b % 2) * 6}%,0.4)`;
        g.fillRect(-st.r * 1.3, by, st.r * 2.6, st.r * 0.1);
      }
      g.restore();
      // rim light from the pressure side
      g.strokeStyle = `hsla(28,80%,${58 + (inp.L + inp.R) * 14}%,${0.35 + Math.min(1, Math.hypot(st.vx, st.vy) / 120) * 0.5})`;
      g.lineWidth = 1.6;
      g.stroke();
      g.restore();
    }
    // chips
    for (const c of s.chips) {
      g.fillStyle = `rgba(240,190,130,${c.life})`;
      g.fillRect(c.x, c.y, 2, 2);
    }
    g.fillStyle = 'rgba(235,190,150,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('PRESSURE W ' + Math.round(inp.L * 100) + '%  E ' + Math.round(inp.R * 100) + '%  MOTION ' + Math.round(s.energy * 100) + '%', 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const o1 = v.osc('sine', H.rootFreq(-2)), o2 = v.osc('sine', H.rootFreq(-2) * 1.5);
    const og = v.g(0.03);
    o1.connect(og); o2.connect(og); og.connect(v.group);
    H.onChord(() => {
      A.set(o1.frequency, H.rootFreq(-2), 2);
      A.set(o2.frequency, H.rootFreq(-2) * 1.5, 2.4);
    });
    const wash = v.noise();
    const wf = v.filter('lowpass', 300, 0.5);
    const wg = v.g(0.012);
    wash.connect(wf); wf.connect(wg); wg.connect(v.group);
    const grindN = v.noise();
    const gf = v.filter('bandpass', 480, 1.4);
    const gg = v.g(0);
    grindN.connect(gf); gf.connect(gg); gg.connect(v.group);
    v.fadeIn(1, 1.4);
    return {
      tick(inp) {
        const s = P.state;
        A.set(og.gain, 0.018 + s.energy * 0.055, 0.4);
        A.set(gg.gain, s.grind * 0.05, 0.12);
        A.set(wg.gain, 0.008 + s.energy * 0.02, 0.4);
        MOut.expr('lead', (inp.L + inp.R) / 2);
      },
      stop() { v.kill(); }
    };
  }
});
