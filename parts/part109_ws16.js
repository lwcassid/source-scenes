/* ---------- SRC-10.16 · WEATHER STATION V16 (sharp grain at show scale) ---------- */
reg({
  id: 'SRC-10.16', family: 'SRC-10', ver: 17,
  title: 'Weather Station V16', tech: 'FIXED-SIZE GRAIN / SHARP AT 1920×1200',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.7, edge: true },
  tags: ['FIXED-SIZE GRAIN', 'SHARP AT SHOW SCALE', 'NEVER A KNOT', 'WARM AT PEAK CHAOS'],
  desc: 'Same smoke, same wind, same one hand-placed form — but the grain itself is honest now about the size it should be. At the show\'s real 1920×1200 frame the points had swollen into soft, blurred squares that mushed together instead of reading as fine dust; they are drawn small and near-fixed in size now, the way Attractor Vespers\' own smoke stays a crisp 1.5px no matter how large the canvas gets, so the weave reads as grain again instead of a bloom.',
  interact: 'L = heading AND placement — the wrapped form leans downwind and the pole travels a wide loop across the sky as you move your hand. R = the pole\'s reach: small at rest, ballooning hard as you raise the hand, until the shared elliptical rings sprawl across most of the visible sky, dense with fine, sharp points rather than blurred ones.',
  sound: 'One wind body whose gain and filter open hard with the gale (R) and take a brief extra breath on a hard heading turn. Riding it, a bell figure ticks on the grid, one per active gust; its pitch and stereo position are set by heading (L). Ableton: wind → texture channel, bells → bells channel, CC74 on both from gale strength.',
  init(P) {
    const as = areaScale(P), w = P.w, h = P.h;
    const n = Math.min(2200, Math.round(850 * as));
    const mass = [];
    const RINGS = [0.2, 0.36, 0.52, 0.68, 0.84];
    for (let i = 0; i < n; i++) {
      const x = P.rand() * w, y = P.rand() * h;
      const conform = P.rand() < 0.8;
      const orbitFrac = conform
        ? RINGS[(P.rand() * RINGS.length) | 0] + (P.rand() - 0.5) * 0.02
        : 0.12 + P.rand() * 0.65;
      mass.push({
        x, y, vx: 0, vy: 0, trail: [{ x, y }], TLcur: 2,
        pri: P.rand(), lenP: Math.pow(P.rand(), 2.1), widP: P.rand(), hueJ: (P.rand() - 0.5) * 70,
        warmJ: (P.rand() - 0.5) * 70, ph: P.rand() * TAU, seed: P.rand() * 1000,
        conform, orbitFrac, orbitDir: P.rand() < 0.5 ? 1 : -1, ringPh: orbitFrac * 23.7,
        curlPh: P.rand() * TAU, curlFr: 0.4 + P.rand() * 1.7,
        curlAmp: conform ? 0.08 + P.rand() * 0.1 : 0.5 + P.rand() * 1.3,
        boost: 0, depth: 0
      });
    }
    const pole = {
      x: w / 2, y: h / 2, baseR: Math.sqrt(w * h) * 0.22, r: 0,
      wobPh: P.rand() * TAU, wobFr: 0.09 + P.rand() * 0.1, wobAmp: 0.1 + P.rand() * 0.12
    };
    P.state = { mass, pole, head: 0, spin: 0, turnPulse: 0, hue: 200, dens: 0, gust: 0, warmT: 0, pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, pole = s.pole;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const heading = inp.L * TAU;
    let dh = heading - (s.head || 0);
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const instSpin = Math.abs(dh) / Math.max(dt, 1e-4);
    s.spin += (instSpin - s.spin) * Math.min(1, dt * 5);
    s.turnPulse = Math.max((s.turnPulse || 0) * Math.pow(0.02, dt), Math.min(1, s.spin / 5));
    s.head = heading;
    s.hue = 175 + (heading / TAU) * 70; // cool sweep only — the warm flare is layered on separately, at peak chaos
    const dens = 0.06 + inp.R * 0.94;
    s.dens += (dens - s.dens) * Math.min(1, dt * 5);
    const spd0 = 34 + inp.R * 190;
    s.gust = spd0;
    const warmTarget = Math.pow(clamp((inp.R - 0.72) / 0.28), 2); // stays 0 until deep into the gale, then ramps hard
    s.warmT += (warmTarget - s.warmT) * Math.min(1, dt * 2.5);
    const turnCoherence = 1 - 0.6 * s.turnPulse; // a hard turn straightens the whole field briefly
    const chaos = inp.R;
    const turb = 0.5 + chaos * 2.6;
    const growT = chaos * chaos; // the pole's reach balloons sharply as the hand rises, not linearly
    const windx = Math.cos(heading), windy = Math.sin(heading);
    const squashY = 0.52; // how tilted the rings read — 1 would be a flat circle, lower = more oblique

    // one pole — the left hand now carries it around a wide loop, not just its lean
    pole.wobPh += dt * pole.wobFr;
    pole.r = pole.baseR * (1 + growT * 8);
    const targetX = w * 0.5 + Math.cos(heading) * w * 0.4;
    const targetY = h * 0.5 + Math.sin(heading) * h * 0.34;
    pole.x += (targetX - pole.x) * Math.min(1, dt * 1.1) + Math.cos(pole.wobPh) * 5 * dt;
    pole.y += (targetY - pole.y) * Math.min(1, dt * 1.1) + Math.sin(pole.wobPh * 1.3) * 5 * dt;

    const base = clamp(dens * 1.05); // right hand is the only thing that lets lines start growing
    const leanBlend = 0.4; // how much the shared wind bends every orbit downwind — this is what keeps L visible
    for (const m of s.mass) {
      // work in a squash-normalized space so a "circular" orbit here becomes a tilted ellipse on screen
      const u = m.x - pole.x, v = (m.y - pole.y) / squashY;
      const dN = Math.sqrt(u * u + v * v) || 1;
      const boost = dN < pole.r ? clamp(1 - dN / pole.r) : 0;
      m.boost = boost;
      m.depth = boost > 0.01 ? v / dN : m.depth * 0.9; // near/far cue for shading, fades out once it leaves orbit

      // quiet dust never settles: an idle, un-elongated thread occasionally lets go and reappears elsewhere
      if (boost < 0.02 && m.TLcur < 4 && P.rand() < dt * 0.025) {
        m.x = P.rand() * w; m.y = P.rand() * h; m.vx = 0; m.vy = 0;
        m.trail.length = 0; m.trail.push({ x: m.x, y: m.y });
        continue;
      }

      // the shared wind direction — every thread's baseline, orbiting or not
      m.curlPh += dt * m.curlFr * (1 + chaos * 2.2);
      const curl = Math.sin(m.curlPh) * m.curlAmp + Math.sin(m.curlPh * 1.8 + 1.7) * m.curlAmp * 0.5;
      const windAngle = heading + turb * curl * 0.4
        + 0.5 * turnCoherence * Math.sin(m.x * 0.01 + t * 0.6 + m.ph)
        + 0.5 * turnCoherence * Math.cos(m.y * 0.012 - t * 0.5 + m.ph);
      let desiredVx = Math.cos(windAngle) * spd0, desiredVy = Math.sin(windAngle) * spd0;

      if (boost > 0.01) {
        const nu = u / dN, nv = v / dN;
        const tu = -nv * m.orbitDir, tv = nu * m.orbitDir;
        const windV = windy / squashY, wl = Math.hypot(windx, windV) || 1;
        const windUn = windx / wl, windVn = windV / wl;
        // the orbit direction leans toward the wind, so the whole ring visibly tips as heading changes
        let dirU = tu * (1 - leanBlend) + windUn * leanBlend;
        let dirV = tv * (1 - leanBlend) + windVn * leanBlend;
        const dl = Math.hypot(dirU, dirV) || 1; dirU /= dl; dirV /= dl;
        // a shared, slowly shifting lumpiness — same for every thread on this ring, so the outline reads
        // as one organic form (not a circle) instead of noise
        const angN = Math.atan2(v, u);
        const lumpy = 1 + 0.22 * Math.sin(angN * 3 + t * 0.15 + m.ringPh) + 0.13 * Math.sin(angN * 5 - t * 0.09 + m.ringPh * 1.4);
        const orbitRN = pole.r * m.orbitFrac * lumpy;
        const radialTerm = (dN - orbitRN) * 1.1;
        const orbSpeed = spd0 * (0.65 + boost * 0.85);
        const desU = dirU * orbSpeed + nu * radialTerm;
        const desV = dirV * orbSpeed + nv * radialTerm;
        const orbVx = desU, orbVy = desV * squashY;
        desiredVx = desiredVx * (1 - boost) + orbVx * boost;
        desiredVy = desiredVy * (1 - boost) + orbVy * boost;
      }
      m.vx += (desiredVx - m.vx) * Math.min(1, dt * 7);
      m.vy += (desiredVy - m.vy) * Math.min(1, dt * 7);
      m.x += m.vx * dt; m.y += m.vy * dt;
      let wrapped = false;
      if (m.x < -40) { m.x = w + 40; wrapped = true; } else if (m.x > w + 40) { m.x = -40; wrapped = true; }
      if (m.y < -40) { m.y = h + 40; wrapped = true; } else if (m.y > h + 40) { m.y = -40; wrapped = true; }

      const own = clamp((base - m.pri) / 0.85); // very wide band — almost everyone can join in at full reach
      const ownSharp = own * own;
      const targetLen = 2 + boost * ownSharp * (16 + m.lenP * 260); // breadth over extreme reach — many strands, not just a few huge ones
      m.TLcur += (targetLen - m.TLcur) * Math.min(1, dt * 1.6);
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
    g.fillStyle = 'rgba(4,6,9,0.14)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + s.pres * 0.58;
    for (const m of s.mass) {
      const trail = m.trail;
      const coolHue = clamp(s.hue + m.hueJ, 150, 262);
      if (trail.length < 5) {
        const spd = Math.hypot(m.vx, m.vy);
        if (spd < 4) continue;
        const len = (3 + Math.min(1, spd / 140) * 6 + s.turnPulse * 6) * ms;
        const nx = m.vx / (spd || 1), ny = m.vy / (spd || 1);
        g.strokeStyle = `hsla(${coolHue},58%,68%,${(0.22 + s.turnPulse * 0.4) * pres})`;
        g.lineWidth = 1 * ms; g.lineCap = 'round';
        g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x - nx * len, m.y - ny * len); g.stroke();
        continue;
      }
      // emergent long thread — plotted as quiet points, Attractor-Vespers style, not a stroked
      // line: dense overlap reads as soft glow, never as a knot of crossing curves
      const warmMix = clamp(s.warmT * (0.3 + m.boost * 0.9));
      const warmAnchor = 350 + m.warmJ;
      const hue = ((coolHue + (warmAnchor - coolHue) * warmMix) % 360 + 360) % 360;
      const sat = 20 + warmMix * 48;
      const depthMul = 1 + m.depth * 0.25;
      const N = trail.length;
      // fixed-ish pixel size, NOT scaled by canvas area — this is what keeps grain sharp
      // at the show's real 1920x1200 frame instead of swelling into a blur (Vespers does the same)
      const r = (0.5 + m.widP * 0.3 + m.boost * 0.2) * depthMul;
      const rr = r * 2;
      const baseA = (0.09 + clamp((N - 5) / 260) * 0.11 + m.boost * 0.09) * pres;
      for (let i = 0; i < N; i++) {
        const p = trail[i];
        const headT = i / (N - 1 || 1); // 0 tail .. 1 head — a gentle brightening, not a hot flare
        const a = baseA * (0.5 + headT * 0.7);
        const lum = 55 + headT * 20 + warmMix * 8 + m.depth * 6;
        g.fillStyle = `hsla(${hue},${sat}%,${lum}%,${a})`;
        g.fillRect(p.x - r, p.y - r, rr, rr);
      }
    }
    // compass — hue ring, brightens and thickens on a hard turn
    const cx = w - 46, cy = 44, r2 = 22;
    for (let a = 0; a < 24; a++) {
      g.strokeStyle = `hsla(${175 + (a / 24) * 70},70%,55%,0.55)`;
      g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy, r2, a / 24 * TAU, (a + 0.8) / 24 * TAU); g.stroke();
    }
    g.strokeStyle = `rgba(255,255,255,${0.8 + s.turnPulse * 0.2})`; g.lineWidth = 2 + s.turnPulse * 2.4;
    g.beginPath(); g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(s.head) * r2, cy + Math.sin(s.head) * r2); g.stroke();

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
        A.set(ng.gain, 0.014 + dens * 0.09 + s.pres * 0.012 + tp * 0.02, 0.2);
        A.set(f.frequency, 340 + dens * 3200 + tp * 1300, 0.2);
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
