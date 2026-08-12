/* ---------- SRC-10.3 · WEATHER STATION V3 (dry-brush wind) ---------- */
reg({
  id: 'SRC-10.3', family: 'SRC-10', ver: 4,
  title: 'Weather Station V3', tech: 'DRY BRUSH / DIRECTIONAL SWARM',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['DRY BRUSH SWARM', 'COMPASS = LEFT HAND', 'LINE COUNT = RIGHT HAND', 'HUE = HEADING'],
  desc: 'The fireflies have become brushstrokes: hundreds of long, tapered, dry-brush marks streaking through the dark like paint caught mid-gust. Your left hand is the compass — turn it and every stroke in the field leans and travels a new way, and the whole palette drifts with it, teal through blue to violet. Your right hand is how much weather there is: raise it and the field thickens from a scattered handful of marks into a dense, wide-stroked gale.',
  interact: 'L = heading, a full circle — the direction every stroke travels and leans, and the hue the whole field takes on. R = line count — how many strokes are alive and how bold they are, from a bare scatter at rest to a packed, heavy sky at full reach.',
  sound: 'One wind body whose gain and filter open with line count (R) — more strokes, more air. Riding it, a quiet bell ticks on the grid, one per active gust; its pitch and its stereo position are set by heading (L), so turning the compass is heard sliding across the field exactly as the hue slides across the strokes. Subdivision tightens (whole → eighths) as the count climbs. Ableton: wind → texture channel, bells → bells channel, CC74 on both from line count.',
  init(P) {
    const as = areaScale(P);
    const n = Math.min(900, Math.round(340 * as));
    const strokes = [];
    for (let i = 0; i < n; i++) {
      const nb = 2 + ((P.rand() * 3) | 0);
      const off = [];
      for (let b = 0; b < nb; b++) off.push({ o: (P.rand() - 0.5) * 7, a: 0.5 + P.rand() * 0.5, ph: P.rand() * TAU });
      strokes.push({
        x: P.rand() * P.w, y: P.rand() * P.h, vx: 0, vy: 0,
        len: 30 + P.rand() * 46, wob: P.rand() * TAU, wobFr: 0.12 + P.rand() * 0.3,
        hueJ: (P.rand() - 0.5) * 28, pri: P.rand(), off
      });
    }
    P.state = { strokes, head: 0, dens: 0, hue: 200, pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const heading = inp.L * TAU;
    s.head = heading;
    s.hue = 170 + (heading / TAU) * 80; // cool sweep only: teal -> cyan -> blue -> indigo (stops short of pink)
    const dens = 0.06 + inp.R * 0.92;
    s.dens += (dens - s.dens) * Math.min(1, dt * 5);
    const speed = 55, turb = 0.4;
    for (const p of s.strokes) {
      const a = heading
        + turb * Math.sin(p.x * 0.007 + t * 0.3)
        + turb * Math.cos(p.y * 0.009 - t * 0.24);
      p.vx += (Math.cos(a) * speed - p.vx) * Math.min(1, dt * 6);
      p.vy += (Math.sin(a) * speed - p.vy) * Math.min(1, dt * 6);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -60) p.x = w + 60; if (p.x > w + 60) p.x = -60;
      if (p.y < -60) p.y = h + 60; if (p.y > h + 60) p.y = -60;
      p.wob += dt * p.wobFr;
    }
  },
  draw(P, g, w, h, t) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(4,6,9,0.22)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + s.pres * 0.58;
    const ang = s.head, dx = Math.cos(ang), dy = Math.sin(ang);
    const px = -dy, py = dx;
    for (const p of s.strokes) {
      const act = clamp((s.dens - p.pri) / 0.07);
      if (act <= 0.02) continue;
      const len = p.len * ms;
      const hue = s.hue + p.hueJ;
      const baseA = (0.16 + act * 0.28) * pres;
      for (const br of p.off) {
        const flick = 0.7 + 0.3 * Math.sin(t * 2.1 + br.ph + p.wob);
        const ox = px * br.o * ms, oy = py * br.o * ms;
        const x0 = p.x + ox, y0 = p.y + oy;
        const x1 = x0 - dx * len * br.a, y1 = y0 - dy * len * br.a;
        const gr = g.createLinearGradient(x0, y0, x1, y1);
        gr.addColorStop(0, `hsla(${hue},72%,${58 + act * 10}%,${baseA * flick})`);
        gr.addColorStop(1, `hsla(${hue + 16},60%,42%,0)`);
        g.strokeStyle = gr;
        g.lineWidth = (1.4 + act * 2.6) * ms;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
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
    g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r); g.stroke();
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HEADING ' + Math.round((ang / TAU) * 360) + '°  LINES ' + Math.round(s.dens * 100) + '%' + (s.pres < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
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
        A.set(ng.gain, 0.016 + dens * 0.05 + s.pres * 0.012, 0.3);
        A.set(f.frequency, 380 + dens * 2000, 0.3);
        const az = Math.sin(heading);
        if (pan) A.set(pan.pan, az * 0.7, 0.3);
        MOut.expr('texture', dens);
        MOut.expr('bells', dens);
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          if (dens > 0.12) {
            const deg = Math.round((heading / TAU) * 7);
            const oct = Math.cos(heading) > 0 ? 0 : -1;
            const vol = Math.min(0.15, 0.03 + dens * 0.15);
            A.bell(H.scaleTone(deg, oct), { at: nextT, vol, dur: 2.4, pan: az * 0.8, rev: 0.68 });
          }
          const iv = dens < 0.35 ? 2 : dens < 0.7 ? 1 : 0.5;
          nextT += T.beat * iv;
        }
        if (nextT < A.t()) nextT = T.next(2);
      },
      stop() { v.kill(); }
    };
  }
});
