/* ---------- SRC-10.4 · WEATHER STATION V4 (ribbons in the gale) ---------- */
reg({
  id: 'SRC-10.4', family: 'SRC-10', ver: 5,
  title: 'Weather Station V4', tech: 'CURLING RIBBON TRAILS / GALE',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.65, edge: true },
  tags: ['RIBBON WIND', 'GALE ON THE RIGHT HAND', 'CURL PER STROKE', 'HUE = HEADING'],
  desc: 'The brush marks now have their own will. Each is a long ribbon of light caught in the gale, following the prevailing gust from your left hand but curling, looping and fluttering with a flow all its own — like a thousand strips of silk loose in strong wind. Raise your right hand and the storm answers on two fronts at once: more ribbons join the field, and every one of them starts moving faster and wilder, hotter at the core the harder it flies.',
  interact: 'L = heading, a full circle — the direction the whole gale leans, and the hue the field takes on. R = the gale itself: more ribbons appear AND they move harder, curl more violently, and burn brighter at full reach. Low R is a lazy scatter of drifting threads; high R is a chaotic, dense, fast-moving storm.',
  sound: 'One wind body whose gain and filter open hard with the gale (R) — real air pressure, not just volume. Riding it, a bell figure ticks on the grid, one per active gust; its pitch and stereo position are set by heading (L), so turning the compass is heard sliding across the field exactly as the hue slides across the ribbons. Subdivision tightens all the way to sixteenths at full gale. Ableton: wind → texture channel, bells → bells channel, CC74 on both from gale strength.',
  init(P) {
    const as = areaScale(P);
    const n = Math.min(760, Math.round(280 * as));
    const TL = 11;
    const strokes = [];
    for (let i = 0; i < n; i++) {
      const x = P.rand() * P.w, y = P.rand() * P.h;
      const trail = [];
      for (let k = 0; k < TL; k++) trail.push({ x, y });
      const nb = 1 + ((P.rand() * 2) | 0);
      const off = [];
      for (let b = 0; b < nb; b++) off.push({
        ox: (P.rand() - 0.5) * 7, oy: (P.rand() - 0.5) * 7,
        wMul: 0.35 + P.rand() * 0.3, aMul: 0.26 + P.rand() * 0.22
      });
      strokes.push({
        x, y, vx: 0, vy: 0, trail, off,
        curlPh: P.rand() * TAU, curlFr: 0.4 + P.rand() * 1.3, curlAmp: 0.5 + P.rand() * 0.95,
        hueJ: (P.rand() - 0.5) * 30, pri: P.rand(), wBase: 0.6 + P.rand() * 0.9
      });
    }
    P.state = { strokes, head: 0, dens: 0, hue: 200, gust: 0, pres: 0, TL };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const heading = inp.L * TAU;
    s.head = heading;
    s.hue = 170 + (heading / TAU) * 80; // cool sweep only: teal -> cyan -> blue -> indigo
    const dens = 0.06 + inp.R * 0.92;
    s.dens += (dens - s.dens) * Math.min(1, dt * 5);
    const gust = 55 + inp.R * 430; // gale strength — amount AND speed both ride R
    s.gust = gust;
    const turb = 0.5 + inp.R * 2.8; // more unpredictability as the gale builds
    const chaos = inp.R;
    for (const p of s.strokes) {
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
      if (wrapped) {
        for (const tp of p.trail) { tp.x = p.x; tp.y = p.y; }
      } else {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > s.TL) p.trail.shift();
      }
    }
  },
  draw(P, g, w, h, t) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(4,6,9,0.17)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + s.pres * 0.58;
    for (const p of s.strokes) {
      const act = clamp((s.dens - p.pri) / 0.07);
      if (act <= 0.02) continue;
      const trail = p.trail;
      if (trail.length < 3) continue;
      const hue = s.hue + p.hueJ;
      const spd = Math.hypot(p.vx, p.vy);
      const spdN = Math.min(1, spd / 260);
      const headLum = 56 + spdN * 36; // hotter, brighter core the faster the ribbon flies
      const baseA = (0.16 + act * 0.4) * pres;
      const baseW = (1.1 + p.wBase + act * 3.0 + spdN * 1.5) * ms;
      const passes = [{ ox: 0, oy: 0, wMul: 1, aMul: 1 }, ...p.off];
      for (const pass of passes) {
        const gr = g.createLinearGradient(
          trail[0].x + pass.ox * ms, trail[0].y + pass.oy * ms,
          trail[trail.length - 1].x + pass.ox * ms, trail[trail.length - 1].y + pass.oy * ms
        );
        gr.addColorStop(0, `hsla(${hue + 14},55%,36%,0)`);
        gr.addColorStop(0.55, `hsla(${hue},72%,52%,${baseA * pass.aMul})`);
        gr.addColorStop(1, `hsla(${hue - 6},45%,${headLum}%,${baseA * pass.aMul * 1.25})`);
        g.strokeStyle = gr;
        g.lineWidth = baseW * pass.wMul;
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
    // compass — hue ring, cool sweep only, matches the field's palette
    const cx = w - 46, cy = 44, r = 22;
    for (let a = 0; a < 24; a++) {
      g.strokeStyle = `hsla(${170 + (a / 24) * 80},70%,55%,0.55)`;
      g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, r, a / 24 * TAU, (a + 0.8) / 24 * TAU); g.stroke();
    }
    g.strokeStyle = '#fff'; g.lineWidth = 2;
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
        const s = P.state, heading = s.head || 0, dens = s.dens || 0;
        A.set(ng.gain, 0.014 + dens * 0.075 + s.pres * 0.012, 0.25);
        A.set(f.frequency, 340 + dens * 2900, 0.25);
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
