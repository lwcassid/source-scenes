/* ---------- SRC-10.5 · WEATHER STATION V5 (mass + gust-cell ribbons) ---------- */
reg({
  id: 'SRC-10.5', family: 'SRC-10', ver: 6,
  title: 'Weather Station V5', tech: 'MASS SWARM / GUST-CELL RIBBONS',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.65, edge: true },
  tags: ['MASS + RIBBONS', 'GUST CELLS DRIFT', 'DIRECTION SNAPS', 'NEVER REPEATS'],
  desc: 'Two kinds of wind share the field now. Underneath, a dense mass of tiny threads streams together in lockstep — the plain, honest readout of which way the compass points, and it snaps to a new heading almost the instant your left hand turns. Above it, a smaller population of long dry-brush ribbons rides pockets of gust that wander the frame on their own timers — clustering thick and bright in one place, thinning to nothing, flaring up somewhere else a breath later. Length, color and density never settle into a pattern.',
  interact: 'L = heading. Watch the whole background mass reorient almost instantly when you turn your hand — a fast turn also pulls the wandering gust-ribbons into a brief aligned sweep before they loosen back into their own curling drift. R = the gale: more and faster ribbons, hotter gust pockets, a denser mass underneath.',
  sound: 'One wind body whose gain and filter open with the gale (R) and take a brief extra breath on a hard heading turn — an audible echo of the visual snap. Riding it, a bell figure ticks on the grid, one per active gust; its pitch and stereo position are set by heading (L). Ableton: wind → texture channel, bells → bells channel, CC74 on both from gale strength.',
  _spawnGust(P, w, h) {
    return {
      x: P.rand() * w, y: P.rand() * h,
      r: Math.min(w, h) * (0.12 + P.rand() * 0.24),
      life: 0, maxLife: 3.2 + P.rand() * 4.6,
      wander: P.rand() * TAU, wSpeed: 36 + P.rand() * 90, str: 0
    };
  },
  init(P) {
    const as = areaScale(P), w = P.w, h = P.h;
    const massN = Math.min(2000, Math.round(760 * as));
    const mass = [];
    for (let i = 0; i < massN; i++) mass.push({ x: P.rand() * w, y: P.rand() * h, vx: 0, vy: 0, hueJ: (P.rand() - 0.5) * 40, ph: P.rand() * TAU });
    const heroN = Math.min(360, Math.round(150 * as));
    const hero = [];
    for (let i = 0; i < heroN; i++) {
      const x = P.rand() * w, y = P.rand() * h;
      const off = P.rand() < 0.4 ? [{ ox: (P.rand() - 0.5) * 6, oy: (P.rand() - 0.5) * 6, wMul: 0.4 + P.rand() * 0.3, aMul: 0.25 + P.rand() * 0.2 }] : [];
      hero.push({
        x, y, vx: 0, vy: 0, trail: [{ x, y }], TLcur: 2,
        baseLen: 3 + Math.pow(P.rand(), 1.6) * 30,
        curlPh: P.rand() * TAU, curlFr: 0.35 + P.rand() * 1.4, curlAmp: 0.5 + P.rand() * 1.0,
        hueJ: (P.rand() - 0.5) * 120, satJ: P.rand(), pri: P.rand(), off
      });
    }
    const NG = 6, gusts = [];
    for (let i = 0; i < NG; i++) { const gu = this._spawnGust(P, w, h); gu.life = P.rand() * gu.maxLife; gusts.push(gu); }
    P.state = { mass, hero, gusts, head: 0, spin: 0, turnPulse: 0, hue: 200, dens: 0, gust: 0, pres: 0 };
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
    s.turnPulse = Math.max((s.turnPulse || 0) * Math.pow(0.015, dt), Math.min(1, s.spin / 5));
    s.head = heading;
    s.hue = 170 + (heading / TAU) * 80; // cool sweep only: teal -> cyan -> blue -> indigo
    const dens = 0.06 + inp.R * 0.92;
    s.dens += (dens - s.dens) * Math.min(1, dt * 5);
    const gust = 55 + inp.R * 430;
    s.gust = gust;
    const turb = (0.5 + inp.R * 2.8) * (1 - 0.55 * s.turnPulse); // curl damps during a hard turn — the field redirects as one
    const chaos = inp.R;

    // gust cells: pockets of intensity that wander the frame, biased downwind
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

    // mass swarm — coherent, fast to reorient: the direct, honest readout of heading
    const massSpd = 34 + inp.R * 150;
    for (const m of s.mass) {
      const a = heading + 0.5 * Math.sin(m.x * 0.01 + t * 0.6 + m.ph) + 0.5 * Math.cos(m.y * 0.012 - t * 0.5 + m.ph);
      m.vx += (Math.cos(a) * massSpd - m.vx) * Math.min(1, dt * 8);
      m.vy += (Math.sin(a) * massSpd - m.vy) * Math.min(1, dt * 8);
      m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < -20) m.x = w + 20; if (m.x > w + 20) m.x = -20;
      if (m.y < -20) m.y = h + 20; if (m.y > h + 20) m.y = -20;
    }

    // hero ribbons — patchy, chaotic, long and short, bright and dim
    for (const p of s.hero) {
      p.curlPh += dt * p.curlFr * (1 + chaos * 1.8);
      const curl = Math.sin(p.curlPh) * p.curlAmp + Math.sin(p.curlPh * 1.9 + 2.1) * p.curlAmp * 0.55;
      const a = heading + turb * curl
        + turb * 0.4 * Math.sin(p.x * 0.006 + t * 0.5)
        + turb * 0.4 * Math.cos(p.y * 0.007 - t * 0.42);
      p.vx += (Math.cos(a) * gust - p.vx) * Math.min(1, dt * 6) + (P.rand() - 0.5) * 140 * chaos * dt;
      p.vy += (Math.sin(a) * gust - p.vy) * Math.min(1, dt * 6) + (P.rand() - 0.5) * 140 * chaos * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      let wrapped = false;
      if (p.x < -80) { p.x = w + 80; wrapped = true; } else if (p.x > w + 80) { p.x = -80; wrapped = true; }
      if (p.y < -80) { p.y = h + 80; wrapped = true; } else if (p.y > h + 80) { p.y = -80; wrapped = true; }
      let boost = 0;
      for (const gu of s.gusts) {
        const dx = p.x - gu.x, dy = p.y - gu.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < gu.r) boost = Math.max(boost, gu.str * (1 - d / gu.r));
      }
      p.boost = boost;
      const TLtarget = p.baseLen * (0.35 + boost * 2.2) * (0.5 + s.dens * 0.9);
      p.TLcur += (TLtarget - p.TLcur) * Math.min(1, dt * 3);
      const cap = Math.max(2, Math.round(p.TLcur));
      if (wrapped) {
        p.trail.length = 0; p.trail.push({ x: p.x, y: p.y });
      } else {
        p.trail.push({ x: p.x, y: p.y });
        while (p.trail.length > cap) p.trail.shift();
      }
    }
  },
  draw(P, g, w, h, t) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(4,6,9,0.17)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + s.pres * 0.58;

    // mass swarm — tiny, dense, coherent: the field snapping to a new heading
    const massA = (0.22 + s.turnPulse * 0.4) * pres;
    for (const m of s.mass) {
      const spd = Math.hypot(m.vx, m.vy);
      if (spd < 4) continue;
      const hue = clamp(s.hue + m.hueJ, 150, 262);
      const len = (3 + Math.min(1, spd / 140) * 6 + s.turnPulse * 6) * ms;
      const nx = m.vx / (spd || 1), ny = m.vy / (spd || 1);
      g.strokeStyle = `hsla(${hue},60%,66%,${massA})`;
      g.lineWidth = 1 * ms; g.lineCap = 'round';
      g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - nx * len, m.y - ny * len); g.stroke();
    }

    // hero ribbons — patchy, varied length and color
    for (const p of s.hero) {
      const base = clamp((s.dens - p.pri) / 0.6);
      const act = clamp(base * 0.55 + p.boost * 0.9);
      if (act <= 0.05 || p.trail.length < 3) continue;
      const trail = p.trail;
      const hue = clamp(s.hue + p.hueJ, 150, 262);
      const spd = Math.hypot(p.vx, p.vy);
      const spdN = Math.min(1, spd / 260);
      const headLum = 46 + spdN * 30 + p.boost * 24 + p.satJ * 8;
      const sat = 55 + p.satJ * 30;
      const baseA = (0.14 + act * 0.5) * pres;
      const baseW = (1 + act * 3.2 + spdN * 1.3 + p.boost * 1.6) * ms;
      const passes = [{ ox: 0, oy: 0, wMul: 1, aMul: 1 }, ...p.off];
      for (const pass of passes) {
        const gr = g.createLinearGradient(
          trail[0].x + pass.ox * ms, trail[0].y + pass.oy * ms,
          trail[trail.length - 1].x + pass.ox * ms, trail[trail.length - 1].y + pass.oy * ms
        );
        gr.addColorStop(0, `hsla(${hue + 14},${sat}%,32%,0)`);
        gr.addColorStop(0.55, `hsla(${hue},${sat}%,48%,${baseA * pass.aMul})`);
        gr.addColorStop(1, `hsla(${hue - 6},${Math.max(0, sat - 10)}%,${headLum}%,${baseA * pass.aMul * 1.3})`);
        g.strokeStyle = gr;
        g.lineWidth = baseW * (pass.wMul || 1);
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath();
        g.moveTo(trail[0].x + pass.ox * ms, trail[0].y + pass.oy * ms);
        for (let i = 1; i < trail.length - 1; i++) {
          const c = trail[i], nx2 = trail[i + 1];
          const mx = (c.x + nx2.x) / 2 + pass.ox * ms, my = (c.y + nx2.y) / 2 + pass.oy * ms;
          g.quadraticCurveTo(c.x + pass.ox * ms, c.y + pass.oy * ms, mx, my);
        }
        const last = trail[trail.length - 1];
        g.lineTo(last.x + pass.ox * ms, last.y + pass.oy * ms);
        g.stroke();
      }
    }

    // compass — hue ring, brightens and thickens on a hard turn
    const cx = w - 46, cy = 44, r = 22;
    for (let a = 0; a < 24; a++) {
      g.strokeStyle = `hsla(${170 + (a / 24) * 80},70%,55%,0.55)`;
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
