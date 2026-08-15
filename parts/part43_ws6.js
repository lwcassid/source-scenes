/* ---------- SRC-10.6 · WEATHER STATION V6 (one field, long lines emerge) ---------- */
reg({
  id: 'SRC-10.6', family: 'SRC-10', ver: 7,
  title: 'Weather Station V6', tech: 'ONE FIELD / EMERGENT WHITE LINES',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.65, edge: true },
  tags: ['ONE PARTICLE FIELD', 'LINES EMERGE ON THE RIGHT', 'WHITE, NOT RAINBOW', 'DENSITY + EMPTY SPACE'],
  desc: 'Back to one field, no second layer pretending to be something else. A thousand tiny threads stream together in the wind, same as always. Raise your right hand and some of those same threads start remembering where they have been — their own path lengthens into a long, near-white line, brighter the longer it holds. Where the wind happens to gather (pockets that drift, bloom and fade on their own), those lines run long and bright; everywhere else stays a scatter of tiny marks. Nothing is drawn that isn\'t the field\'s own motion, just given a longer memory.',
  interact: 'L = heading — the whole field snaps to a new direction almost instantly, and a fast turn briefly straightens everything into one aligned sweep before it loosens back. R = memory — at rest every thread is a tiny mark; raise the hand and threads inside the wind\'s gathering pockets stretch into long, bright, near-white lines, thinning to nothing outside them. Composition is made of density and empty space, not color.',
  sound: 'One wind body whose gain and filter open with the gale (R) and take a brief extra breath on a hard heading turn. Riding it, a bell figure ticks on the grid, one per active gust; its pitch and stereo position are set by heading (L). Ableton: wind → texture channel, bells → bells channel, CC74 on both from gale strength.',
  _spawnGust(P, w, h) {
    return {
      x: P.rand() * w, y: P.rand() * h,
      r: Math.min(w, h) * (0.12 + P.rand() * 0.26),
      life: 0, maxLife: 3.4 + P.rand() * 5.2,
      wander: P.rand() * TAU, wSpeed: 32 + P.rand() * 80, str: 0
    };
  },
  init(P) {
    const as = areaScale(P), w = P.w, h = P.h;
    const n = Math.min(1800, Math.round(700 * as));
    const mass = [];
    for (let i = 0; i < n; i++) {
      const x = P.rand() * w, y = P.rand() * h;
      mass.push({
        x, y, vx: 0, vy: 0, trail: [{ x, y }], TLcur: 2,
        pri: P.rand(), hueJ: (P.rand() - 0.5) * 40, ph: P.rand() * TAU, boost: 0
      });
    }
    const NG = 5, gusts = [];
    for (let i = 0; i < NG; i++) { const gu = this._spawnGust(P, w, h); gu.life = P.rand() * gu.maxLife; gusts.push(gu); }
    P.state = { mass, gusts, head: 0, spin: 0, turnPulse: 0, hue: 200, dens: 0, gust: 0, pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const heading = inp.L * TAU;
    let dh = heading - (s.head || 0);
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const instSpin = Math.abs(dh) / Math.max(dt, 1e-4);
    s.spin += (instSpin - s.spin) * Math.min(1, dt * 5);
    s.turnPulse = Math.max((s.turnPulse || 0) * Math.pow(0.02, dt), Math.min(1, s.spin / 5));
    s.head = heading;
    s.hue = 175 + (heading / TAU) * 70; // cool sweep only, subtle — the lines read white, not colored
    const dens = 0.06 + inp.R * 0.94;
    s.dens += (dens - s.dens) * Math.min(1, dt * 5);
    const spd0 = 34 + inp.R * 190;
    s.gust = spd0;
    const turnCoherence = 1 - 0.6 * s.turnPulse; // a hard turn straightens the whole field briefly

    for (let i = 0; i < s.gusts.length; i++) {
      const gu = s.gusts[i];
      gu.life += dt;
      const k = gu.life / gu.maxLife;
      gu.str = Math.sin(Math.min(1, k) * Math.PI);
      const driftAng = heading * 0.7 + gu.wander * 0.3;
      gu.x += Math.cos(driftAng) * gu.wSpeed * dt;
      gu.y += Math.sin(driftAng) * gu.wSpeed * dt;
      if (gu.x < -gu.r) gu.x = w + gu.r; if (gu.x > w + gu.r) gu.x = -gu.r;
      if (gu.y < -gu.r) gu.y = h + gu.r; if (gu.y > h + gu.r) gu.y = -gu.r;
      if (gu.life >= gu.maxLife) s.gusts[i] = this._spawnGust(P, w, h);
    }

    const base = clamp((s.dens) * 1.02); // right hand is the only thing that lets lines start growing
    for (const m of s.mass) {
      const a = heading
        + 0.5 * turnCoherence * Math.sin(m.x * 0.01 + t * 0.6 + m.ph)
        + 0.5 * turnCoherence * Math.cos(m.y * 0.012 - t * 0.5 + m.ph);
      m.vx += (Math.cos(a) * spd0 - m.vx) * Math.min(1, dt * 8);
      m.vy += (Math.sin(a) * spd0 - m.vy) * Math.min(1, dt * 8);
      m.x += m.vx * dt; m.y += m.vy * dt;
      let wrapped = false;
      if (m.x < -40) { m.x = w + 40; wrapped = true; } else if (m.x > w + 40) { m.x = -40; wrapped = true; }
      if (m.y < -40) { m.y = h + 40; wrapped = true; } else if (m.y > h + 40) { m.y = -40; wrapped = true; }

      let boost = 0;
      for (const gu of s.gusts) {
        const dx = m.x - gu.x, dy = m.y - gu.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < gu.r) boost = Math.max(boost, gu.str * (1 - d / gu.r));
      }
      m.boost = boost;
      const own = clamp((base - m.pri) / 0.5); // this particle's own turn to elongate, gated by R
      const targetLen = 2 + own * 8 + boost * own * 42;
      m.TLcur += (targetLen - m.TLcur) * Math.min(1, dt * 1.8);
      const cap = Math.max(2, Math.round(m.TLcur));
      if (wrapped) {
        m.trail.length = 0; m.trail.push({ x: m.x, y: m.y });
      } else {
        m.trail.push({ x: m.x, y: m.y });
        while (m.trail.length > cap) m.trail.shift();
      }
    }
  },
  draw(P, g, w, h, t) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(4,6,9,0.16)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + s.pres * 0.58;
    for (const m of s.mass) {
      const trail = m.trail;
      const hue = clamp(s.hue + m.hueJ, 150, 262);
      if (trail.length < 5) {
        const spd = Math.hypot(m.vx, m.vy);
        if (spd < 4) continue;
        const len = (3 + Math.min(1, spd / 140) * 6 + s.turnPulse * 6) * ms;
        const nx = m.vx / (spd || 1), ny = m.vy / (spd || 1);
        g.strokeStyle = `hsla(${hue},55%,68%,${(0.22 + s.turnPulse * 0.4) * pres})`;
        g.lineWidth = 1 * ms; g.lineCap = 'round';
        g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - nx * len, m.y - ny * len); g.stroke();
        continue;
      }
      // emergent long line — this particle's own path, brighter and whiter the longer it holds
      const lenFrac = clamp((trail.length - 5) / 32);
      const a = (0.16 + lenFrac * 0.6 + m.boost * 0.2) * pres;
      const wgt = (0.8 + lenFrac * 2.1 + m.boost * 1.0) * ms;
      const gr = g.createLinearGradient(trail[0].x, trail[0].y, trail[trail.length - 1].x, trail[trail.length - 1].y);
      gr.addColorStop(0, `hsla(${hue},32%,40%,0)`);
      gr.addColorStop(0.62, `hsla(${hue},20%,74%,${a})`);
      gr.addColorStop(1, `hsla(${hue},8%,${92 + m.boost * 6}%,${Math.min(1, a * 1.25)})`);
      g.strokeStyle = gr;
      g.lineWidth = wgt;
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length - 1; i++) {
        const c = trail[i], nx2 = trail[i + 1];
        const mx = (c.x + nx2.x) / 2, my = (c.y + nx2.y) / 2;
        g.quadraticCurveTo(c.x, c.y, mx, my);
      }
      const last = trail[trail.length - 1];
      g.lineTo(last.x, last.y);
      g.stroke();
    }
    // compass — hue ring, brightens and thickens on a hard turn
    const cx = w - 46, cy = 44, r = 22;
    for (let a = 0; a < 24; a++) {
      g.strokeStyle = `hsla(${175 + (a / 24) * 70},70%,55%,0.55)`;
      g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, r, a / 24 * TAU, (a + 0.8) / 24 * TAU); g.stroke();
    }
    g.strokeStyle = `rgba(255,255,255,${0.8 + s.turnPulse * 0.2})`; g.lineWidth = 2 + s.turnPulse * 2.4;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(s.head) * r, cy + Math.sin(s.head) * r); g.stroke();

    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HEADING ' + Math.round((s.head / TAU) * 360) + '°  LINES ' + Math.round(s.dens * 100) + '%  GUST ' + Math.round(s.gust) + (s.pres < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 420, 0.55);
    const ng = v.g(0.02);
    const pan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
    n.connect(f); f.connect(ng);
    if (pan) { ng.connect(pan); pan.connect(v.group); } else { ng.connect(v.group); }
    v.fadeIn(1, 1);
    let nextT = T.next(2);
    return {
      tick() {
        const s = P.state, heading = s.head || 0, dens = s.dens || 0, tp = s.turnPulse || 0;
        A.set(ng.gain, 0.014 + dens * 0.075 + s.pres * 0.012 + tp * 0.02, 0.2);
        A.set(f.frequency, 340 + dens * 2900 + tp * 1300, 0.2);
        const az = Math.sin(heading);
        if (pan) A.set(pan.pan, az * 0.7, 0.3);
        MOut.expr('texture', dens);
        MOut.expr('bells', dens);
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          if (dens > 0.12) {
            const deg = Math.round((heading / TAU) * 7);
            const oct = Math.cos(heading) > 0 ? 0 : -1;
            const vol = Math.min(0.16, 0.03 + dens * 0.17);
            A.bell(H.scaleTone(deg, oct), { at: nextT, vol, dur: 2.2, pan: az * 0.8, rev: 0.68 });
          }
          const iv = dens < 0.3 ? 2 : dens < 0.55 ? 1 : dens < 0.82 ? 0.5 : 0.25;
          nextT += T.beat * iv;
        }
        if (nextT < A.t()) nextT = T.next(2);
      },
      stop() { v.kill(); }
    };
  }
});
