/* ============================================================
   SRC-32 · SONORA — desert stones in an unseen river
   ============================================================ */
reg({
  id: 'SRC-32', ver: 2, title: 'Sonora', tech: 'STONE BED / SIDE PRESSURE',
  music: { bpm: 60, root: 46, mode: 'mixolydian', prog: [0, 6, 4, 5], chordBars: 4 },
  fx: { bloom: 0.45, edge: true },
  tags: ['OVERTONE SERIES', 'PRESSURE FROM THE SIDES', 'UNSEEN WATER', 'STONE PERCUSSION'],
  desc: 'Sun-baked stones — Sedona reds, ochres, dusty rose, each banded with its strata — floating in a bed of water you never see. You only know the water by how the stones move: heavy, damped, patient. Your hands are pressure from the walls of the canyon: raise them and an unseen force closes in from both sides, herding the stones together. When stone meets stone, sound — and because every stone is tuned to a harmonic of the same deep fundamental, every collision is consonant with every other. Squeeze hard and the bed clatters into a ringing overtone chorus; release, and the river slows the stones to silence.',
  interact: 'The stones roam free — drifting, wandering, ringing off each other now and then. Your hands are two walls of light: raise L and the west wall slides in, raise R and the east wall answers, and the free-floating bed gets caught between them. Squeeze hard and the walls drive everything into a clattering column of collisions; let go and the walls withdraw, the stones scatter back out into open water, and the bed slowly goes quiet.',
  sound: 'Collisions: stone knock (short woody transient) + a ringing partial — each stone owns one harmonic (2nd through 12th) of the key\'s deep fundamental, big stones low, pebbles high; impact speed = velocity. The overtone series means ANY simultaneous collisions form a natural chord (Ableton: tuned log drums / Collision wood resonator on CH1; the harmonics land on real pitches). Bed: near-silent root+fifth drone that swells with the bed\'s total motion, plus a soft underwater wash. Rolls and grinds: low friction noise when stones slide along each other. Let the ringing tails stack in a warm plate reverb.',
  init(P) {
    const m = Math.min(P.w, P.h);
    const HARM = [2, 3, 4, 5, 6, 8, 9, 10, 12, 3, 5, 6, 8, 4];
    const stones = [];
    const n = 13;
    for (let i = 0; i < n; i++) {
      const r = m * (0.03 + P.rand() * 0.052);
      // smooth organic river-stone: low-frequency radius harmonics, no sharp edges
      // tumbled-smooth: barely-there harmonics on a soft oval
      const shape = {
        a1: 0.04 + P.rand() * 0.06, p1: P.rand() * TAU,
        a2: 0.025 + P.rand() * 0.04, p2: P.rand() * TAU,
        a3: 0.008 + P.rand() * 0.016, p3: P.rand() * TAU,
        squash: 0.72 + P.rand() * 0.22
      };
      // tumbled gem-shop mix: some banded agates, some solid polished gems
      const cream = () => `hsl(${34 + P.rand() * 10},${20 + P.rand() * 14}%,${78 + P.rand() * 12}%)`;
      const bands = [];
      if (P.rand() < 0.45) {
        // banded agate (carnelian or blue-gray)
        const mk = P.rand() < 0.55
          ? () => `hsl(${10 + P.rand() * 16},${52 + P.rand() * 18}%,${34 + P.rand() * 22}%)`
          : () => `hsl(${212 + P.rand() * 18},${8 + P.rand() * 10}%,${46 + P.rand() * 22}%)`;
        let sc = 1, bi = 0;
        while (sc > 0.1) {
          bands.push({ scale: sc, color: bi % 2 === 0 ? mk() : (P.rand() < 0.7 ? cream() : mk()) });
          sc -= 0.08 + P.rand() * 0.13;
          bi++;
        }
        bands.push({ scale: 0.09, color: cream() });
      } else {
        // solid polished gem: jade, amethyst, carnelian, rose, amber, jet, milk
        const GEMS = [
          [152, 42, 38], [274, 34, 46], [14, 62, 44], [345, 45, 62],
          [40, 68, 52], [220, 8, 16], [38, 22, 84], [195, 40, 42]
        ];
        const [gh, gs, gl] = GEMS[(P.rand() * GEMS.length) | 0];
        const jit = () => (P.rand() - 0.5) * 8;
        bands.push({ scale: 1, color: `hsl(${gh + jit()},${gs}%,${gl}%)` });
        bands.push({ scale: 0.72 + P.rand() * 0.15, color: `hsl(${gh + jit()},${gs + 6}%,${gl + 7}%)` });
        bands.push({ scale: 0.34 + P.rand() * 0.2, color: `hsl(${gh + jit()},${gs + 4}%,${gl - 6}%)` });
      }
      stones.push({
        x: P.w * (0.12 + P.rand() * 0.76), y: P.h * (0.15 + P.rand() * 0.7),
        vx: 0, vy: 0, r, shape, ang: P.rand() * TAU, va: 0,
        bands, coreX: (P.rand() - 0.5) * 0.5, coreY: (P.rand() - 0.5) * 0.5,
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
    // two walls of light closing in from the sides
    const wallL = w * (0.02 + inp.L * 0.44);
    const wallR = w * (0.98 - inp.R * 0.44);
    const wallVL = (wallL - (s.prevWallL !== undefined ? s.prevWallL : wallL)) / Math.max(dt, 1e-4);
    const wallVR = (wallR - (s.prevWallR !== undefined ? s.prevWallR : wallR)) / Math.max(dt, 1e-4);
    s.prevWallL = wallL; s.prevWallR = wallR;
    s.wallL = wallL; s.wallR = wallR;
    for (const st of s.stones) {
      // free-flowing: lively currents, light water drag — the bed roams
      st.vx += (Math.sin(t * 0.23 + st.ph) + Math.sin(t * 0.11 + st.ph * 3)) * dt * 26;
      st.vy += (Math.cos(t * 0.19 + st.ph * 2) + Math.cos(t * 0.31 + st.ph)) * dt * 26;
      const drag = Math.pow(0.6, dt);
      st.vx *= drag; st.vy *= drag; st.va *= Math.pow(0.4, dt);
      st.x += st.vx * dt; st.y += st.vy * dt; st.ang += st.va * dt;
      // the walls are solid: stones ride and rebound off them
      const pad = st.r + 4;
      if (st.x < wallL + pad) {
        st.x = wallL + pad;
        st.vx = Math.abs(st.vx) * 0.8 + Math.max(0, wallVL) * 0.9 + 14;
      }
      if (st.x > wallR - pad) {
        st.x = wallR - pad;
        st.vx = -Math.abs(st.vx) * 0.8 + Math.min(0, wallVR) * 0.9 - 14;
      }
      if (st.y < pad) { st.y = pad; st.vy = Math.abs(st.vy) * 0.6; }
      if (st.y > h - pad) { st.y = h - pad; st.vy = -Math.abs(st.vy) * 0.6; }
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
            // elastic + RECOIL: stones spring visibly apart when they knock
            const imp = -rel * 0.95 + 22;
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
    // the two walls — tall wisps of warm light, one per hand
    for (const [wx, v, dir] of [[s.wallL !== undefined ? s.wallL : 0, inp.L, 1], [s.wallR !== undefined ? s.wallR : w, inp.R, -1]]) {
      // pressure haze behind the wall
      const gr = g.createLinearGradient(wx, 0, wx - dir * w * 0.12, 0);
      gr.addColorStop(0, `rgba(255,150,80,${0.1 + v * 0.22})`);
      gr.addColorStop(1, 'rgba(255,150,80,0)');
      g.fillStyle = gr;
      g.fillRect(dir > 0 ? wx - w * 0.12 : wx, 0, w * 0.12, h);
      // wispy vertical strands
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = `rgba(255,${170 + k * 25},${100 + k * 40},${(0.3 + v * 0.5) / (k + 1)})`;
        g.lineWidth = 2.5 - k * 0.6;
        g.shadowColor = '#ffa060'; g.shadowBlur = 12;
        g.beginPath();
        for (let yy = 0; yy <= h; yy += h / 22) {
          const sway = Math.sin(yy * 0.012 + t * (1.1 + k * 0.4) + k * 2) * (4 + v * 7);
          yy === 0 ? g.moveTo(wx + sway, yy) : g.lineTo(wx + sway, yy);
        }
        g.stroke();
        g.shadowBlur = 0;
      }
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
      const sh = st.shape;
      g.save();
      g.translate(st.x, st.y); g.rotate(st.ang);
      g.scale(1, sh.squash);
      const outline = (scale, ox, oy) => {
        g.beginPath();
        const NV = 30;
        for (let k = 0; k <= NV; k++) {
          const a = k / NV * TAU;
          const rr = st.r * scale * (1 + sh.a1 * Math.cos(a + sh.p1) + sh.a2 * Math.cos(2 * a + sh.p2) + sh.a3 * Math.cos(3 * a + sh.p3));
          const x = Math.cos(a) * rr + ox, y = Math.sin(a) * rr + oy;
          k === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
        }
        g.closePath();
      };
      // agate bands: nested copies of the outline drifting toward an offset core
      for (const bnd of st.bands) {
        const drift = 1 - bnd.scale;
        outline(bnd.scale, st.coreX * st.r * drift, st.coreY * st.r * drift);
        g.fillStyle = bnd.color;
        g.fill();
      }
      // polish sheen
      outline(1, 0, 0);
      const sheen = g.createLinearGradient(0, -st.r, 0, st.r);
      sheen.addColorStop(0, 'rgba(255,250,240,0.25)');
      sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
      sheen.addColorStop(1, 'rgba(20,10,10,0.34)');
      g.fillStyle = sheen;
      g.fill();
      // glossy specular window — the tumbled-stone shine
      const hx = -st.r * 0.34, hy = -st.r * 0.38;
      const spec = g.createRadialGradient(hx, hy, 1, hx, hy, st.r * 0.42);
      spec.addColorStop(0, 'rgba(255,255,255,0.75)');
      spec.addColorStop(0.35, 'rgba(255,255,255,0.2)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      g.save();
      outline(1, 0, 0);
      g.clip();
      g.fillStyle = spec;
      g.beginPath(); g.ellipse(hx, hy, st.r * 0.42, st.r * 0.3, -0.5, 0, TAU); g.fill();
      g.restore();
      // rim light — brightens with speed
      g.strokeStyle = `hsla(28,80%,${58 + (inp.L + inp.R) * 14}%,${0.3 + Math.min(1, Math.hypot(st.vx, st.vy) / 120) * 0.55})`;
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
