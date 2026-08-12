/* ============================================================
   V2 EXPLORATIONS — cross-pollinated versions of shortlisted
   pieces. Registered with family + ver so the wall shows them
   as version history on the original tiles.
   ============================================================ */

/* ---------- SRC-04.2 · BUBBLE FIELD V2 (rope strum) ---------- */
reg({
  id: 'SRC-04.2', family: 'SRC-04', ver: 3,
  title: 'Bubble Field V2', tech: 'VERLET ROPE / BUBBLE NET',
  music: { bpm: 84, root: 45, mode: 'mixolydian', prog: [0, 3, 4, 0], chordBars: 4 },
  fx: { bloom: 0.55, edge: true },
  tags: ['ROPE DYNAMICS', 'STRUM = GLISSANDO', 'BUBBLES UNDER NET', 'CABLE + BUBBLE'],
  desc: 'The Cable Strum rope brought into the bubble world. A slack luminous rope hangs between your hands, and the bubbles rise until they gather beneath it like balloons under a net — waiting. Move gently and the rope herds them; whip it and the rope pops them in a fast run, left to right, a glissando written in bursting light.',
  interact: 'L and R hold the two ends of the rope — height sets each end, so tilting it rolls the gathered bubbles toward the low side. SLOW moves herd; FAST moves strum: any bubble the whipping rope touches pops and plays (pitch = its left-right position across two octaves, loudness = whip speed). Rest and the field refills — tension building toward your next strum.',
  sound: 'Pops are pluck tones on the current chord, two octaves left→right, velocity from rope-whip speed — a strum is a physical glissando. Under it, a quiet air wash follows total rope motion. Ableton: route pops to lead (felt piano or pluck patch), wash to texture; strum velocity → CC74 brightness so hard strums cut through.',
  init(P) {
    const N = 30;
    const pts = [];
    for (let i = 0; i < N; i++) pts.push({ x: i / (N - 1) * P.w, y: P.h * 0.5, py: P.h * 0.5, px: i / (N - 1) * P.w, vy: 0, glow: 0 });
    P.state = { pts, N, bubbles: [], burst: [], spawnT: 0, energy: 0, pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, N = s.N;
    const as = areaScale(P);
    const yL = h * (0.86 - inp.L * 0.7), yR = h * (0.86 - inp.R * 0.7);
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.5);
    // verlet rope, endpoints pinned to the hands
    const avg = (inp.L + inp.R) / 2;
    const rest = w * (1.22 - 0.3 * avg) / (N - 1);
    const sub = 2, sdt = dt / sub;
    for (let ss = 0; ss < sub; ss++) {
      const p0 = s.pts[0], pN = s.pts[N - 1];
      p0.py = p0.y; p0.y = yL; p0.x = 0;
      pN.py = pN.y; pN.y = yR; pN.x = w;
      for (let i = 1; i < N - 1; i++) {
        const p = s.pts[i];
        const vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + 1250 * sdt * sdt;
      }
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < N - 1; i++) {
          const a = s.pts[i], b = s.pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
          const diff = (d - rest) / d * 0.5;
          const mA = i === 0 ? 0 : 1, mB = i + 1 === N - 1 ? 0 : 1;
          const tot = mA + mB || 1;
          a.x += dx * diff * 2 * mA / tot; a.y += dy * diff * 2 * mA / tot;
          b.x -= dx * diff * 2 * mB / tot; b.y -= dy * diff * 2 * mB / tot;
        }
      }
    }
    let en = 0;
    for (let i = 0; i < N; i++) {
      const p = s.pts[i];
      p.vy = (p.y - p.py) / Math.max(dt, 0.001);
      en += Math.abs(p.vy);
      p.glow = Math.max(0, p.glow - dt * 2.4);
    }
    s.energy += (Math.min(1, en / N / 260) - s.energy) * Math.min(1, dt * 5);
    // bubbles rise, gather under the rope, pop when strummed
    s.spawnT -= dt;
    const cap = Math.round(26 * as);
    if (s.spawnT <= 0 && s.bubbles.length < cap) {
      s.spawnT = 0.5 + P.rand() * 0.7;
      const xn = P.rand();
      s.bubbles.push({
        x: xn * w, y: h + 20, xn,
        r: (5 + (1 - xn) * 9 + P.rand() * 4) * Math.sqrt(as),
        vy: -h * (0.05 + P.rand() * 0.06) * (0.7 + xn * 0.8), vx: 0, hue: 180 + xn * 140, rest: 0
      });
    }
    const ropeYat = x => {
      const fi = clamp(x / w) * (N - 1), i0 = Math.min(N - 2, fi | 0), fr = fi - i0;
      return s.pts[i0].y + (s.pts[i0 + 1].y - s.pts[i0].y) * fr;
    };
    const ropeVat = x => {
      const fi = clamp(x / w) * (N - 1), i0 = Math.min(N - 2, fi | 0), fr = fi - i0;
      return s.pts[i0].vy + (s.pts[i0 + 1].vy - s.pts[i0].vy) * fr;
    };
    for (let bi = s.bubbles.length - 1; bi >= 0; bi--) {
      const b = s.bubbles[bi];
      b.x += b.vx * dt + Math.sin(t * 1.7 + b.hue) * 6 * dt;
      b.y += b.vy * dt;
      b.vx *= Math.pow(0.3, dt);
      const ry = ropeYat(b.x);
      if (b.y - b.r * 0.4 < ry + 2 && b.y > ry - b.r * 2) {
        const rv = Math.abs(ropeVat(b.x));
        if (rv > 150 * Math.sqrt(as)) {
          // STRUMMED — pop and play
          const deg = Math.round(b.xn * 14);
          const vol = Math.min(0.16, 0.06 + rv / 2600);
          P.ping(A => {
            A.pluck2(H.scaleTone(deg, -1), { at: A.q(0.25), vol, pan: (b.xn - 0.5) * 0.8, rev: 0.4, del: 0.16 });
            if (b.xn > 0.6) A.bell(H.scaleTone(deg, 0), { at: A.q(0.25), vol: vol * 0.4, dur: 2.5, rev: 0.6 });
          });
          for (let k = 0; k < 10; k++) {
            const a = P.rand() * TAU;
            s.burst.push({ x: b.x, y: ry, vx: Math.cos(a) * (40 + P.rand() * 90), vy: Math.sin(a) * (40 + P.rand() * 90) - 30, life: 0.6, hue: b.hue });
          }
          const gi = Math.round(clamp(b.x / w) * (N - 1));
          for (let g2 = Math.max(0, gi - 2); g2 <= Math.min(N - 1, gi + 2); g2++) s.pts[g2].glow = 1;
          s.bubbles.splice(bi, 1);
          continue;
        }
        // gathered under the net — slide toward the droop
        b.y = ry + b.r * 0.4;
        b.vy = Math.max(b.vy, -6);
        const slope = ropeYat(b.x + 8) - ropeYat(b.x - 8);
        b.vx += slope * 2.4 * dt * 20;
        b.rest = Math.min(1, b.rest + dt * 2);
      } else if (b.y < ry - b.r) {
        b.vy -= 30 * dt; // escaped above (rope lifted) — float away
      }
      if (b.y < -30) s.bubbles.splice(bi, 1);
    }
    for (let k = s.burst.length - 1; k >= 0; k--) {
      const q = s.burst[k];
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; q.life -= dt;
      if (q.life <= 0) s.burst.splice(k, 1);
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(5,7,9,0.32)'; g.fillRect(0, 0, w, h);
    const pres = 0.4 + (s.pres || 0) * 0.6;
    // light wash falling from the rope
    for (let i = 0; i < s.N - 1; i += 3) {
      const p = s.pts[i];
      const a = (0.016 + p.glow * 0.09) * pres;
      const gr = g.createLinearGradient(0, p.y, 0, p.y + h * 0.3);
      gr.addColorStop(0, `rgba(255,232,190,${a})`); gr.addColorStop(1, 'rgba(255,232,190,0)');
      g.fillStyle = gr;
      g.fillRect(p.x, p.y, (s.pts[Math.min(s.N - 1, i + 3)].x - p.x) + 1, h * 0.3);
    }
    // bubbles
    for (const b of s.bubbles) {
      const gr = g.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
      gr.addColorStop(0, `hsla(${b.hue},80%,86%,${0.5 * pres})`);
      gr.addColorStop(0.7, `hsla(${b.hue},70%,60%,${0.16 * pres})`);
      gr.addColorStop(1, `hsla(${b.hue},80%,70%,${0.42 * pres})`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.fill();
      g.strokeStyle = `hsla(${b.hue},85%,78%,${(0.3 + b.rest * 0.25) * pres})`;
      g.lineWidth = 1.1 * ms;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, TAU); g.stroke();
    }
    // burst sparks
    for (const q of s.burst) {
      g.fillStyle = `hsla(${q.hue},90%,80%,${q.life * 1.4})`;
      g.beginPath(); g.arc(q.x, q.y, 1.6 * ms, 0, TAU); g.fill();
    }
    // the rope — glowing, flashing where strummed
    g.lineCap = 'round';
    for (let i = 0; i < s.N - 1; i++) {
      const a = s.pts[i], b = s.pts[i + 1];
      const gl = Math.max(a.glow, b.glow);
      const sp = Math.min(1, Math.abs(a.vy) / 500);
      g.strokeStyle = `hsla(${46 - gl * 10},${70 + gl * 30}%,${58 + sp * 20 + gl * 30}%,${(0.55 + sp * 0.3 + gl * 0.4) * pres})`;
      g.lineWidth = (2.2 + gl * 3 + sp * 1.2) * ms;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
    }
    g.lineCap = 'butt';
    g.fillStyle = 'rgba(200,220,190,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('GATHERED ' + s.bubbles.filter(b => b.rest > 0.5).length + '  WHIP ' + Math.round(s.energy * 100) + '%' + ((s.pres || 0) < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('bandpass', 900, 1.2);
    const ng = v.g(0.0);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        const e = P.state.energy || 0;
        A.set(ng.gain, 0.004 + e * 0.05, 0.15);
        A.set(f.frequency, 500 + e * 2600, 0.15);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-10.2 · WEATHER STATION V2 (firefly lanterns) ---------- */
reg({
  id: 'SRC-10.2', family: 'SRC-10', ver: 3,
  title: 'Weather Station V2', tech: 'FIREFLY SWARM / LANTERN PULL',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['EMBER CHORUS FLIES', 'KOI ATTRACTION', 'SYNC = SONG', 'HEIGHT = PITCH'],
  desc: 'The weather is alive now. A thousand fireflies drift in the dark wind, and each of your hands is a lantern hanging in the field. Raise a hand and its lantern climbs; the flies bend out of the wind and spiral in around it. When enough of them gather they begin to flash together — and a swarm flashing in sync is a note. Two hands, two constellations, a duet of pulsing light.',
  interact: 'L and R set the HEIGHT of the left and right lanterns. Flies within reach are drawn in (the Koi pull); a gathered swarm synchronizes and flashes on the beat — lantern height picks the pitch of its flash-note, swarm size sets its weight. Hold both hands still and the two swarms trade calls. Drop a hand and its swarm scatters back into the wind.',
  sound: 'Each lantern speaks on alternating beats: a soft bell chord-tone whose pitch follows hand height (left lantern an octave below right) and whose volume follows swarm size — you literally hear how many you have gathered. Under it, low aeolian wind. Ableton: bells to the bells channel (celeste / MIDI mallets), wind to texture; swarm size → CC74 so gathering opens the timbre.',
  init(P) {
    const as = areaScale(P);
    const flies = [];
    const n = Math.min(700, Math.round(260 * as));
    for (let i = 0; i < n; i++) flies.push({
      x: P.rand() * P.w, y: P.rand() * P.h, vx: 0, vy: 0,
      ph: P.rand(), fr: 0.3 + P.rand() * 0.25, env: 0, near: 0
    });
    const streaks = [];
    for (let i = 0; i < 50; i++) streaks.push({ x: P.rand() * P.w, y: P.rand() * P.h, s: 0.4 + P.rand() });
    P.state = { flies, streaks, head: P.rand() * TAU, gathL: 0, gathR: 0, flashL: 0, flashR: 0, pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    s.head += dt * (0.05 + Math.sin(t * 0.11) * 0.04);
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.5);
    const Rad = Math.min(w, h) * 0.27;
    const lanterns = [
      { x: w * 0.26, y: h * (0.9 - inp.L * 0.8), v: inp.L },
      { x: w * 0.74, y: h * (0.9 - inp.R * 0.8), v: inp.R }
    ];
    s.lan = lanterns;
    let gL = 0, gR = 0;
    const wind = 14;
    for (const fl of s.flies) {
      // base wind + wander
      fl.vx += (Math.cos(s.head) * wind - fl.vx) * dt * 0.5 + (P.rand() - 0.5) * 60 * dt;
      fl.vy += (Math.sin(s.head) * wind * 0.4 - fl.vy) * dt * 0.5 + (P.rand() - 0.5) * 60 * dt;
      fl.near = 0;
      // lantern pull — koi attraction with a slight spiral
      for (let li = 0; li < 2; li++) {
        const L2 = lanterns[li];
        const dx = L2.x - fl.x, dy = L2.y - fl.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < Rad) {
          // position-based pull: converge onto an orbit ring around the lantern
          const k = (1 - d / Rad);
          const rr = Rad * (0.3 + ((fl.fr * 997) % 1) * 0.22); // per-fly ring radius — a halo, not a point
          const gain = Math.min(1, dt * (0.7 + L2.v * 1.8)) * k;
          fl.x += (dx / d) * (d - rr) * gain;
          fl.y += (dy / d) * (d - rr) * gain;
          const tsp = 34 * dt; // slow orbit shimmer
          fl.x += -(dy / d) * tsp; fl.y += (dx / d) * tsp;
          if (d < Rad * 0.62) { fl.near = li + 1; li === 0 ? gL++ : gR++; }
        }
      }
      const dmp = Math.pow(fl.near ? 0.05 : 0.14, dt);
      fl.vx *= dmp; fl.vy *= dmp;
      fl.x += fl.vx * dt; fl.y += fl.vy * dt;
      if (fl.x < -10) fl.x = w + 10; if (fl.x > w + 10) fl.x = -10;
      if (fl.y < -10) fl.y = h + 10; if (fl.y > h + 10) fl.y = -10;
      // free-running clock; swarm flashes are triggered by the transport
      fl.ph += dt * fl.fr;
      if (fl.ph > 1 && !fl.near) { fl.ph = 0; fl.env = 1; }
      if (fl.ph > 1) fl.ph = 1; // gathered flies wait for the swarm flash
      fl.env = Math.max(0, fl.env - dt * 2.6);
    }
    s.gathL += (gL - s.gathL) * Math.min(1, dt * 4);
    s.gathR += (gR - s.gathR) * Math.min(1, dt * 4);
    // visual swarm flash moments (set by the audio scheduler; fallback clock in gallery)
    for (const which of ['L', 'R']) {
      const key = 'flash' + which;
      if (s[key] > 0 && AE.ctx && AE.t() >= s[key]) {
        for (const fl of s.flies) if (fl.near === (which === 'L' ? 1 : 2)) {
          fl.env = 1; fl.ph = P.rand() * 0.1;
        }
        s[key] = 0;
      }
    }
    for (const st of s.streaks) {
      st.x += Math.cos(s.head) * 30 * st.s * dt; st.y += Math.sin(s.head) * 12 * st.s * dt;
      if (st.x < -5) st.x = w + 5; if (st.x > w + 5) st.x = -5;
      if (st.y < -5) st.y = h + 5; if (st.y > h + 5) st.y = -5;
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(6,8,10,0.24)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + (s.pres || 0) * 0.58;
    // wind streaks — the old weather, demoted to a whisper
    g.strokeStyle = `rgba(90,110,130,${0.1 * pres})`; g.lineWidth = 1 * ms;
    for (const st of s.streaks) {
      g.beginPath(); g.moveTo(st.x, st.y);
      g.lineTo(st.x - Math.cos(s.head) * 8 * st.s * ms, st.y - Math.sin(s.head) * 3 * st.s * ms); g.stroke();
    }
    // lanterns
    if (s.lan) for (let li = 0; li < 2; li++) {
      const L2 = s.lan[li];
      const gath = li === 0 ? s.gathL : s.gathR;
      const glow = Math.min(1, gath / (s.flies.length * 0.12));
      g.strokeStyle = `rgba(120,140,110,${0.12 * pres})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(L2.x, 0); g.lineTo(L2.x, h); g.stroke();
      const r = (11 + glow * 6) * ms;
      const gr = g.createRadialGradient(L2.x, L2.y, 1, L2.x, L2.y, r * 2.1);
      gr.addColorStop(0, `rgba(255,214,140,${(0.5 + glow * 0.4) * pres})`);
      gr.addColorStop(0.3, `rgba(255,190,110,${0.14 * pres})`);
      gr.addColorStop(1, 'rgba(255,190,110,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(L2.x, L2.y, r * 2.1, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,226,170,${(0.5 + glow * 0.4) * pres})`; g.lineWidth = 1.3 * ms;
      g.beginPath(); g.arc(L2.x, L2.y, r * 0.55, 0, TAU); g.stroke();
    }
    // fireflies
    for (const fl of s.flies) {
      const e = fl.env;
      if (e > 0.04) {
        const rr = (2 + e * 5.5) * ms;
        const gr = g.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, rr);
        gr.addColorStop(0, `rgba(226,255,178,${e * 0.95 * pres})`);
        gr.addColorStop(1, 'rgba(226,255,178,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(fl.x, fl.y, rr, 0, TAU); g.fill();
      } else {
        g.fillStyle = `rgba(120,140,96,${(fl.near ? 0.4 : 0.22) * pres})`;
        g.beginPath(); g.arc(fl.x, fl.y, 1.1 * ms, 0, TAU); g.fill();
      }
    }
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('SWARM L ' + Math.round(s.gathL) + '  R ' + Math.round(s.gathR) + ((s.pres || 0) < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 420, 0.6);
    const ng = v.g(0.03);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    v.fadeIn(1, 1);
    let nextL = T.next(2), nextR = T.next(2) + T.beat;
    return {
      tick(inp) {
        const s = P.state;
        A.set(ng.gain, 0.018 + (s.pres || 0) * 0.02, 0.3);
        const horizon = A.t() + 0.15;
        const total = s.flies.length;
        while (nextL < horizon) {
          const amt = s.gathL / (total * 0.14);
          if (amt > 0.12) {
            const deg = Math.round(inp.L * 9);
            const vol = Math.min(0.14, 0.02 + amt * 0.1);
            A.bell(H.scaleTone(deg, -1), { at: nextL, vol, dur: 3, pan: -0.4, rev: 0.7 });
            s.flashL = nextL;
          }
          nextL += T.beat * 2;
        }
        while (nextR < horizon) {
          const amt = s.gathR / (total * 0.14);
          if (amt > 0.12) {
            const deg = Math.round(inp.R * 9);
            const vol = Math.min(0.14, 0.02 + amt * 0.1);
            A.bell(H.scaleTone(deg, 0), { at: nextR, vol, dur: 3, pan: 0.4, rev: 0.7 });
            s.flashR = nextR;
          }
          nextR += T.beat * 2;
        }
        if (nextL < A.t()) nextL = T.next(2);
        if (nextR < A.t()) nextR = T.next(2) + T.beat;
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-30.2 · STORM GARDEN V2 (beams + loom) ---------- */
reg({
  id: 'SRC-30.2', family: 'SRC-30', ver: 3,
  title: 'Storm Garden V2', tech: 'SOLID LIGHT / PULSE LOOM',
  music: { bpm: 96, root: 41, mode: 'dorian', prog: [0, 3, 4, 5], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['AIMED BEAMS', 'QUANTIZED PULSES', 'CHARGE TO LIGHTNING', 'CLOUD = NOTE'],
  desc: 'The selector lines are gone. Now two solid beams of light stand in the dark — one from each corner of the floor — and your hands AIM them. Sweep a beam across the sky and park it on a cloud: pulses of light climb the beam in perfect time, each one landing ON the beat, each landing a note. The longer you hold, the faster the loom weaves — until the cloud is full, and answers with lightning.',
  interact: 'L aims the left beam, R aims the right — raise a hand to sweep its beam across the sky. Hold a beam on a cloud to charge it: pulse rate doubles as charge builds (whole beats → eighths → sixteenths, always locked to the grid), pitch is the cloud\'s position, octave rises with charge. Full charge = lightning + thunder. Two beams on two clouds = a woven two-voice pattern; both on ONE cloud charges it double-speed.',
  sound: 'Pure Pulse Loom logic: every pulse departs its beam source exactly one beat before it lands, so what you see climbing IS the metronome. Notes are dorian chord tones (cloud x-position picks the tone, charge lifts the octave), plucks panned to their beam. Lightning = deep root thump + noise crack on the texture channel. Ableton: pulses → arp channel (mallet/pluck), lightning → texture (your real thunder samples, C1 trigger).',
  init(P) {
    const as = areaScale(P);
    const clouds = [];
    const NC = 6;
    for (let i = 0; i < NC; i++) {
      const cx = P.w * (0.12 + (i + P.rand() * 0.5) / NC * 0.8);
      const cy = P.h * (0.13 + P.rand() * 0.2);
      const rx = P.w * (0.05 + P.rand() * 0.035), ry = rx * (0.42 + P.rand() * 0.15);
      const tris = [];
      const NT = 34;
      for (let k2 = 0; k2 < NT; k2++) {
        // centers packed inside a flat-bottomed ellipse, triangles at random
        // rotations so the mass reads as billowing cloud, not mountain ridge
        const a0 = P.rand() * TAU, r0 = Math.sqrt(P.rand());
        const px = Math.cos(a0) * r0 * rx * 0.78;
        let py = Math.sin(a0) * r0 * ry * 0.8;
        if (py > ry * 0.3) py = ry * 0.3 - (py - ry * 0.3) * 0.4; // flatten base
        const sz = rx * (0.12 + P.rand() * 0.16) * (1 - r0 * 0.45);
        const rot = P.rand() * TAU;
        tris.push({
          x1: px + Math.cos(rot) * sz, y1: py + Math.sin(rot) * sz * 0.75,
          x2: px + Math.cos(rot + 2.0 + P.rand() * 0.4) * sz, y2: py + Math.sin(rot + 2.0) * sz * 0.75,
          x3: px + Math.cos(rot + 4.1 + P.rand() * 0.4) * sz, y3: py + Math.sin(rot + 4.1) * sz * 0.75,
          sh: 0.55 + P.rand() * 0.45
        });
      }
      clouds.push({ x: cx, y: cy, rx, ry, tris, charge: 0, drift: (P.rand() - 0.5) * 4, flick: 0 });
    }
    P.state = { clouds, pulses: [], bolts: [], rain: [], pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.5);
    // beams: origin at floor corners, hands sweep them across the sky
    const beams = [
      { ox: w * 0.06, oy: h + 6, th: -1.52 + inp.L * 1.34, side: 0 },
      { ox: w * 0.94, oy: h + 6, th: -1.62 - inp.R * 1.34, side: 1 }
    ];
    for (const B of beams) {
      B.target = -1;
      let best = 0.08;
      s.clouds.forEach((c, ci) => {
        const dx = c.x - B.ox, dy = c.y - B.oy;
        const ang = Math.atan2(dy, dx);
        const d = Math.sqrt(dx * dx + dy * dy);
        const halo = 0.045 + Math.atan2(c.rx, d);
        let dd = Math.abs(((ang - B.th + Math.PI * 3) % TAU) - Math.PI);
        if (dd < Math.min(best, halo)) { best = dd; B.target = ci; }
      });
    }
    s.beams = beams;
    s.clouds.forEach((c, ci) => {
      c.x += c.drift * dt;
      if (c.x < c.rx) c.drift = Math.abs(c.drift);
      if (c.x > w - c.rx) c.drift = -Math.abs(c.drift);
      const hitCount = beams.filter(B => B.target === ci).length;
      if (hitCount) c.charge = Math.min(1, c.charge + dt * 0.24 * hitCount);
      else c.charge = Math.max(0, c.charge - dt * 0.1);
      c.flick = Math.max(0, c.flick - dt * 3);
      if (c.charge > 0.75 && P.rand() < dt * (c.charge - 0.7) * 8) c.flick = 1;
      if (c.charge >= 1) {
        // LIGHTNING
        c.charge = 0.3;
        const seg = [];
        let bx = c.x, by = c.y + c.ry * 0.5;
        while (by < h) { seg.push([bx, by]); bx += (P.rand() - 0.5) * w * 0.05; by += h * (0.06 + P.rand() * 0.08); }
        seg.push([bx, h]);
        s.bolts.push({ seg, t: 0.28 });
        for (let k = 0; k < 18; k++) s.rain.push({ x: c.x + (P.rand() - 0.5) * c.rx * 2, y: c.y + c.ry, v: h * (0.5 + P.rand() * 0.4), life: 1.2 });
        P.ping(A => {
          A.hit({ vol: 0.3, dur: 0.5, freq: 130, q: 0.6, at: 0 });
          A.bassNote(H.rootFreq(-2), { at: 0, vol: 0.22, dur: 1.6 });
          if (typeof MOut !== 'undefined') {
            MOut.evNote('texture', H.rootFreq(-3), 0.6, 0, 2);
            MOut.sfxNote(37, 0.85, 2.5); // lightning strikes the SFX rack
          }
        });
      }
    });
    for (let i = s.bolts.length - 1; i >= 0; i--) { s.bolts[i].t -= dt; if (s.bolts[i].t <= 0) s.bolts.splice(i, 1); }
    for (let i = s.rain.length - 1; i >= 0; i--) {
      const r = s.rain[i]; r.y += r.v * dt; r.life -= dt;
      if (r.life <= 0 || r.y > h) s.rain.splice(i, 1);
    }
    for (let i = s.pulses.length - 1; i >= 0; i--) {
      if (AE.ctx && AE.t() > s.pulses[i].t1 + 0.1) s.pulses.splice(i, 1);
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    g.fillStyle = 'rgba(5,6,9,0.4)'; g.fillRect(0, 0, w, h);
    const pres = 0.42 + (s.pres || 0) * 0.58;
    // beams
    if (s.beams) for (const B of s.beams) {
      const len = h * 1.5;
      const spread = 0.05;
      const x1 = B.ox + Math.cos(B.th - spread) * len, y1 = B.oy + Math.sin(B.th - spread) * len;
      const x2 = B.ox + Math.cos(B.th + spread) * len, y2 = B.oy + Math.sin(B.th + spread) * len;
      const hit = B.target >= 0;
      const gr = g.createLinearGradient(B.ox, B.oy, B.ox + Math.cos(B.th) * len * 0.7, B.oy + Math.sin(B.th) * len * 0.7);
      gr.addColorStop(0, `rgba(${hit ? '190,200,255' : '150,170,210'},${(hit ? 0.20 : 0.11) * pres})`);
      gr.addColorStop(1, 'rgba(150,170,210,0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(B.ox, B.oy); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
      g.strokeStyle = `rgba(210,220,255,${(hit ? 0.5 : 0.25) * pres})`;
      g.lineWidth = 1.4 * ms;
      g.beginPath(); g.moveTo(B.ox, B.oy);
      g.lineTo(B.ox + Math.cos(B.th) * len, B.oy + Math.sin(B.th) * len); g.stroke();
    }
    // pulses climbing the beams (each lands exactly on the beat)
    if (AE.ctx) for (const p of s.pulses) {
      const k = clamp((AE.t() - p.t0) / (p.t1 - p.t0));
      const x = p.x0 + (p.x1 - p.x0) * k, y = p.y0 + (p.y1 - p.y0) * k;
      const gr = g.createRadialGradient(x, y, 0, x, y, 7 * ms);
      gr.addColorStop(0, `rgba(235,240,255,${0.9 * pres})`); gr.addColorStop(1, 'rgba(235,240,255,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, 7 * ms, 0, TAU); g.fill();
    }
    // clouds — faceted, hue swings blue→violet with charge, flicker near full
    for (const c of s.clouds) {
      const hue = 222 + c.charge * 48;
      const flick = c.flick > 0.5 ? 1 : 0;
      g.save(); g.translate(c.x, c.y);
      for (const tr of c.tris) {
        const li = 18 + c.charge * 30 + tr.sh * 14 + flick * 30;
        g.fillStyle = `hsla(${hue},${40 + c.charge * 40}%,${li}%,${(0.7 + c.charge * 0.3) * pres})`;
        g.beginPath(); g.moveTo(tr.x1, tr.y1); g.lineTo(tr.x2, tr.y2); g.lineTo(tr.x3, tr.y3); g.closePath(); g.fill();
      }
      // base silhouettes — two soft lobes grounding the facets
      g.fillStyle = `hsla(${hue},34%,${13 + c.charge * 16 + flick * 20}%,${0.8 * pres})`;
      g.beginPath(); g.ellipse(-c.rx * 0.3, c.ry * 0.3, c.rx * 0.6, c.ry * 0.45, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(c.rx * 0.32, c.ry * 0.34, c.rx * 0.55, c.ry * 0.4, 0, 0, TAU); g.fill();
      if (c.charge > 0.04) { // charge meter — a thin arc over the cloud
        g.strokeStyle = `hsla(${hue + 20},90%,70%,${0.55 * pres})`;
        g.lineWidth = 1.6 * ms;
        g.beginPath(); g.arc(0, 0, c.rx * 1.12, -Math.PI, -Math.PI + c.charge * Math.PI); g.stroke();
      }
      g.restore();
    }
    // rain + bolts
    g.strokeStyle = `rgba(170,200,255,${0.5 * pres})`; g.lineWidth = 1 * ms;
    for (const r of s.rain) { g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x, r.y + 9 * ms); g.stroke(); }
    for (const b of s.bolts) {
      g.strokeStyle = `rgba(240,244,255,${b.t / 0.28})`;
      g.lineWidth = 2.4 * ms; g.shadowColor = '#cfe0ff'; g.shadowBlur = 16;
      g.beginPath(); b.seg.forEach(([x, y], i) => i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)); g.stroke();
      g.shadowBlur = 0;
      g.fillStyle = `rgba(200,215,255,${b.t / 0.28 * 0.12})`; g.fillRect(0, 0, w, h);
    }
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const tg = s.beams ? s.beams.map(B => B.target >= 0 ? 'CLOUD ' + (B.target + 1) : '—').join(' · ') : '';
    g.fillText('AIM ' + tg + ((s.pres || 0) < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const o1 = v.osc('sine', H.chordTone(0, -1)), o2 = v.osc('sine', H.chordTone(2, -1));
    const pg = v.g(0.03);
    o1.connect(pg); o2.connect(pg); pg.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.7; pg.connect(s2); s2.connect(A.revIn); }
    H.onChord(() => {
      A.set(o1.frequency, H.chordTone(0, -1), 1.8);
      A.set(o2.frequency, H.chordTone(2, -1), 2.2);
    });
    v.fadeIn(1, 1.2);
    const nextT = [T.next(1), T.next(1)];
    return {
      tick(inp) {
        const s = P.state;
        A.set(pg.gain, 0.018 + (s.pres || 0) * 0.02, 0.4);
        if (!s.beams) return;
        const horizon = A.t() + 0.15;
        for (let bi = 0; bi < 2; bi++) {
          const B = s.beams[bi];
          while (nextT[bi] < horizon) {
            if (B.target >= 0) {
              const c = s.clouds[B.target];
              const tone = Math.round(c.x / P.w * 6);
              const oct = c.charge > 0.72 ? 1 : 0;
              const vol = 0.07 + c.charge * 0.05;
              A.pluck2(H.chordTone(tone, oct), { at: nextT[bi], vol, pan: bi ? 0.35 : -0.35, rev: 0.4, del: 0.22 });
              s.pulses.push({ x0: B.ox, y0: B.oy, x1: c.x, y1: c.y, t0: nextT[bi] - T.beat, t1: nextT[bi] });
              const iv = c.charge < 0.4 ? 1 : c.charge < 0.75 ? 0.5 : 0.25;
              nextT[bi] += T.beat * iv;
            } else nextT[bi] += T.beat;
          }
          if (nextT[bi] < A.t()) nextT[bi] = T.next(1);
        }
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-15.2 · FERRO BLOOM V2 (layered flower) ---------- */
reg({
  id: 'SRC-15.2', family: 'SRC-15', ver: 2,
  title: 'Ferro Bloom V2', tech: 'LAYERED BLOOM / PETAL COUNT',
  music: { bpm: 66, root: 50, mode: 'lydian', prog: [0, 1], chordBars: 8 },
  fx: { bloom: 0.65 },
  tags: ['BUD TO BLOOM', 'PETAL LAYERS', 'LIVING FLOWER', 'GROWING COMPLEXITY'],
  desc: 'At rest it is almost nothing: a small warm blob of gradient light, breathing in the dark — a bud. Your left hand opens it: the whole flower swells and its petals unfurl outward. Your right hand decides how MUCH flower there is: three petals, then seven, then a second inner ring, then sixteen — layers of complexity folding out of the center as you rise. Every petal sways on its own slow clock; the bloom is never still, only calm.',
  interact: 'L = expansion — the whole flower scales up and its petals reach further open (this is the drama hand: rest = bud, full = the bloom fills the frame). R = petal count, 3 → 16, added one at a time; past eight, a second inner ring appears with its own rotation. Layers of sound arrive with layers of flower. Both high = a huge living mandala; both low = the quiet bud.',
  sound: 'A lydian pad whose brightness follows expansion (L opens a lowpass exactly as the flower opens). Petal count drives the arpeggio: more petals = denser arp (quarters → eighths → sixteenths, quantized), each new petal announced by one soft bell. Ableton: pad → pad channel (Omnisphere warm layer), arp → arp channel, petal-add bells → bells. CC74 from L so the whole rig brightens as the bloom opens.',
  init(P) {
    P.state = { exp: 0, pet: 3, petPrev: 3, pres: 0, ph: P.rand() * TAU };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.5);
    s.exp += (inp.L - s.exp) * Math.min(1, dt * 3);
    const target = 3 + inp.R * 13;
    s.pet += (target - s.pet) * Math.min(1, dt * 2.5);
    // announce each newly-arrived petal with a bell
    if (Math.floor(s.pet) > Math.floor(s.petPrev)) {
      const n = Math.floor(s.pet);
      P.ping(A => A.bell(H.chordTone(n % 7, 1), { at: A.q(0.5), vol: 0.06, dur: 2.5, rev: 0.65 }));
    }
    s.petPrev = s.pet;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(7,5,9,0.28)'; g.fillRect(0, 0, w, h);
    const pres = 0.45 + (s.pres || 0) * 0.55;
    const cx = w / 2, cy = h / 2;
    const breath = 1 + Math.sin(t * 0.7 + s.ph) * 0.035;
    const base = Math.min(w, h) * (0.10 + s.exp * 0.16) * breath;
    const petLen = base * (0.5 + s.exp * 1.7);
    const open = 0.25 + s.exp * 0.75; // how far petals lean outward
    const nPet = s.pet;
    const outer = Math.min(nPet, 8), inner = Math.max(0, nPet - 8);
    const drawRing = (count, whole, rBase, len, hue0, rot, alpha) => {
      for (let i = 0; i < Math.ceil(count); i++) {
        const ap = clamp(count - i); // fractional petal fades in
        const ang = (i / Math.max(1, Math.round(whole))) * TAU + rot + Math.sin(t * 0.45 + i * 1.7) * 0.05 * open;
        const sway = Math.sin(t * 0.6 + i * 2.3) * 0.06;
        const tipR = rBase + len * (0.85 + Math.sin(t * 0.5 + i) * 0.06);
        const bx = Math.cos(ang) * rBase, by = Math.sin(ang) * rBase;
        const tx = Math.cos(ang + sway) * tipR, ty = Math.sin(ang + sway) * tipR;
        const wdt = len * (0.30 + open * 0.14);
        const px = -Math.sin(ang), py = Math.cos(ang);
        const gr = g.createLinearGradient(cx + bx, cy + by, cx + tx, cy + ty);
        gr.addColorStop(0, `hsla(${hue0},85%,66%,${0.75 * ap * alpha * pres})`);
        gr.addColorStop(0.75, `hsla(${hue0 - 26},70%,52%,${0.5 * ap * alpha * pres})`);
        gr.addColorStop(1, `hsla(${hue0 - 40},80%,64%,${0.2 * ap * alpha * pres})`);
        g.fillStyle = gr;
        g.beginPath();
        g.moveTo(cx + bx, cy + by);
        g.quadraticCurveTo(cx + bx + px * wdt + (tx - bx) * 0.45, cy + by + py * wdt + (ty - by) * 0.45, cx + tx, cy + ty);
        g.quadraticCurveTo(cx + bx - px * wdt + (tx - bx) * 0.45, cy + by - py * wdt + (ty - by) * 0.45, cx + bx, cy + by);
        g.closePath(); g.fill();
        // luminous tip
        if (s.exp > 0.25) {
          const tr = (2 + s.exp * 3) * ms * ap;
          const tg = g.createRadialGradient(cx + tx, cy + ty, 0, cx + tx, cy + ty, tr * 2.4);
          tg.addColorStop(0, `hsla(${hue0},95%,84%,${0.5 * ap * s.exp * pres})`);
          tg.addColorStop(1, 'hsla(320,95%,84%,0)');
          g.fillStyle = tg;
          g.beginPath(); g.arc(cx + tx, cy + ty, tr * 2.4, 0, TAU); g.fill();
        }
      }
    };
    // outer ring (behind): darker violet, appears past 8 petals
    if (inner > 0) drawRing(inner, Math.max(3, Math.floor(inner)), base * 0.7, petLen * 1.2, 285, TAU / 16 + t * 0.02, 0.7);
    drawRing(outer, Math.min(8, Math.max(3, Math.round(outer))), base * 0.55, petLen, 322, -t * 0.015, 1);
    // center bud/heart — the rest state IS this
    const r0 = base * 0.62;
    const gr = g.createRadialGradient(cx - r0 * 0.2, cy - r0 * 0.2, r0 * 0.05, cx, cy, r0);
    gr.addColorStop(0, `hsla(330,95%,${78 + s.exp * 10}%,${0.95 * pres})`);
    gr.addColorStop(0.55, `hsla(318,85%,58%,${0.75 * pres})`);
    gr.addColorStop(1, 'hsla(300,80%,40%,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(cx, cy, r0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(230,180,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('OPEN ' + Math.round(s.exp * 100) + '%  PETALS ' + Math.round(s.pet) + ((s.pres || 0) < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const f = v.filter('lowpass', 500, 0.7);
    const oscs = [0, 2, 4].map((d, i) => { const o = v.osc('triangle', H.chordTone(d, i === 0 ? -1 : 0)); o.connect(f); return o; });
    const pg = v.g(0.055);
    f.connect(pg); pg.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.65; pg.connect(s2); s2.connect(A.revIn); }
    H.onChord(() => {
      [0, 2, 4].forEach((d, i) => A.set(oscs[i].frequency, H.chordTone(d, i === 0 ? -1 : 0), 2.4));
    });
    v.fadeIn(1, 1.2);
    let nextT = T.next(0.5), step = 0;
    return {
      tick(inp) {
        const s = P.state;
        A.set(f.frequency, 260 + s.exp * 2600, 0.3);
        A.set(pg.gain, 0.03 + s.exp * 0.04, 0.4);
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const pets = Math.round(s.pet);
          const div = pets < 6 ? 1 : pets < 11 ? 0.5 : 0.25;
          if (s.exp > 0.08) {
            const deg = step % Math.min(7, pets);
            const oct = (step % (pets < 9 ? 7 : 14)) >= 7 ? 1 : 0;
            A.pluck2(H.chordTone(deg, oct), { at: nextT, vol: 0.035 + s.exp * 0.05, pan: Math.sin(step * 1.3) * 0.4, rev: 0.45, del: 0.2 });
          }
          step++;
          nextT += T.beat * div;
        }
        if (nextT < A.t()) nextT = T.next(0.5);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-18.2 · NIGHT CIRCUIT V2 (the long drive / city sequencer) ---------- */
reg({
  id: 'SRC-18.2', family: 'SRC-18', ver: 2,
  title: 'Night Circuit V2', tech: 'CITY SEQUENCER / LONG DRIVE',
  music: { bpm: 100, root: 45, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { edge: true },
  tags: ['LOCAL TRUTH GLOBAL VIBE', 'SIX-ACT JOURNEY', 'YOU ARE THE BEAM', 'REST = EMBER'],
  desc: 'The corridor opened into a world. A night drive in six acts, eight bars each: ignition in the dark, the long outrun flats, the districts — where the city IS the sequencer: near-field towers light their windows on the actual notes (bass towers thump amber floors, arp spires climb acid-green bands, lead towers flash their trims) while the far skyline just breathes with the mix — then the underpass tightens around you, the vista pays off with a striped geode sun, and it all dissolves back into darkness to re-seed the next cycle. Untouched, it idles as an ember on a dark road — the journey only runs while hands are on it.',
  interact: 'R − L = steer/bank across the lanes (drive the left lane and the bass district looms; right lane, the arp spires). L + R = throttle: speed, filter, and how hard the city plays. You are first-person — a headlight cone, edge trails and an instrument line are your body. Acts advance every 8 bars while you drive; let go and the world exhales back to its resting ember.',
  sound: 'Identical engine to V1 (per crew decision — music pass comes later): straight-16th synthwave at 100, bass 8ths, arp through ping-pong delay, kick 1&3, clap 2&4, altitude filter ride. The city renders what the engine plays: every lit window is a real MIDI event from the log — local truth, global vibe.',
  init(P) {
    const R = P.rand;
    const towers = [];
    for (let i = 0; i < 26; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const near = R() < 0.55;
      const xo = side * (near ? 0.62 + R() * 0.35 : 1.05 + R() * 0.8);
      towers.push({
        z: R(), side, xo, near,
        role: near ? (side < 0 ? 'bass' : 'arp') : (R() < 0.18 ? 'lead' : 'city'),
        w0: near ? 0.05 + R() * 0.04 : 0.05 + R() * 0.08,
        h0: near ? (side < 0 ? 0.16 + R() * 0.1 : 0.3 + R() * 0.22) : 0.14 + R() * 0.3,
        seed: R() * 1000, cols: 2 + (R() * 3 | 0), rows: 5 + (R() * 7 | 0)
      });
    }
    const posts = Array.from({ length: 10 }, (_, i) => ({ z: i / 10 }));
    const dashes = Array.from({ length: 14 }, (_, i) => ({ z: i / 14 }));
    const arches = Array.from({ length: 9 }, (_, i) => ({ z: i / 9 }));
    const stars = Array.from({ length: 60 }, () => ({ x: R(), y: R() * 0.38, tw: R() * TAU }));
    const ridge = Array.from({ length: 24 }, (_, i) => ({ x: i / 23, y: 0.02 + R() * 0.055 }));
    P.state = {
      towers, posts, dashes, arches, stars, ridge,
      speed: 0, lane: 0, bank: 0, pres: 0, actIdx: 0, lastBar: -1,
      pp: { sun: 0.12, city: 0.05, tun: 0, open: 0.3 }, zPulse: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.2);
    const steer = (inp.R - inp.L) * 1.4;
    const thr = clamp((inp.L + inp.R) / 2);
    s.bank += (clamp(steer, -1, 1) - s.bank) * Math.min(1, dt * 2.4);
    s.lane = clamp(s.lane + s.bank * dt * 1.1 - s.lane * dt * 0.5, -1, 1);
    // rest = ember idle; hands = the journey runs
    const energy = 0.22 + s.pres * 0.78;
    s.speed += ((0.05 + Math.pow(thr, 1.3) * 0.95) * energy - s.speed) * Math.min(1, dt * 2);
    // acts advance every 8 bars, only while someone is driving
    if (P.focused && typeof T !== 'undefined' && T.running && s.pres > 0.4) {
      const bar = T.bar();
      if (bar !== s.lastBar) {
        if (bar % 8 === 0 && s.lastBar >= 0) s.actIdx = (s.actIdx + 1) % 6;
        s.lastBar = bar;
      }
    }
    // act parameter targets — the choreography of the journey
    const AP = [
      { sun: 0.14, city: 0.05, tun: 0, open: 0.35 }, // 1 IGNITION — road appears, ember on the horizon
      { sun: 0.5, city: 0.28, tun: 0, open: 1 },     // 2 THE FLATS — outrun openness, city articulates
      { sun: 0.6, city: 1, tun: 0, open: 0.6 },      // 3 THE DISTRICTS — the sequencer city, readable
      { sun: 0.05, city: 0.4, tun: 1, open: 0.15 },  // 4 THE UNDERPASS — compression, beat-locked
      { sun: 1.7, city: 0.55, tun: 0, open: 1 },     // 5 THE VISTA — geode aperture payoff
      { sun: 0.22, city: 0.12, tun: 0, open: 0.5 }   // 6 DISSOLVE — collapse, re-seed
    ];
    const tgt = AP[s.actIdx];
    const k = Math.min(1, dt * 0.9);
    for (const key of ['sun', 'city', 'tun', 'open']) s.pp[key] += (tgt[key] - s.pp[key]) * k;
    // world scroll
    const zr = dt * s.speed * 0.55;
    for (const o of s.dashes) { o.z += zr * 1.6; if (o.z >= 1) o.z -= 1; }
    for (const o of s.posts) { o.z += zr * 1.2; if (o.z >= 1) o.z -= 1; }
    for (const o of s.arches) { o.z += zr * 1.1; if (o.z >= 1) o.z -= 1; }
    for (const tw of s.towers) {
      tw.z += zr * (tw.near ? 1.0 : 0.7);
      if (tw.z >= 1) { tw.z -= 1; tw.seed = (tw.seed * 16807) % 2147483647 || 1; }
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const pres = s.pres, E = 0.3 + pres * 0.7; // global light energy (rest ≤ 40%)
    const pp = s.pp;
    // role activity from the real MIDI log — light that never lies
    const nowMs = performance.now();
    const ract = { bass: 0, arp: 0, lead: 0, perc: 0, pad: 0, bells: 0 };
    const rec = { arp: [], bass: [], lead: [] };
    if (P.focused && typeof MOut !== 'undefined') {
      for (let i = MOut.log.length - 1; i >= 0; i--) {
        const ev = MOut.log[i]; const age = nowMs - ev.p;
        if (age > 1200) break;
        if (age < 0) continue;
        const kk = Math.max(0, 1 - age / 480) * (0.3 + ev.vel / 127 * 0.7);
        if (ract[ev.role] !== undefined) ract[ev.role] = Math.max(ract[ev.role], kk);
        if (rec[ev.role] && age < 380) rec[ev.role].push(ev);
      }
    }
    // ---- frame ----
    g.fillStyle = '#040308'; g.fillRect(0, 0, w, h);
    const cx = w / 2, hor = h * 0.46;
    g.save();
    g.translate(cx, h * 0.55); g.rotate(-s.bank * 0.055); g.translate(-cx, -h * 0.55);
    const vpx = cx - s.lane * w * 0.1;
    const per = z => Math.pow(z, 2.6);
    // stars
    for (const st of s.stars) {
      const a = (0.12 + 0.1 * Math.sin(t * 0.7 + st.tw)) * E * pp.open;
      g.fillStyle = `rgba(200,210,255,${a})`;
      g.fillRect(st.x * w, st.y * h, 1.2 * ms, 1.2 * ms);
    }
    // ---- the landmark: striped sun / geode aperture ----
    if (pp.sun > 0.02) {
      const sr = w * 0.052 * pp.sun * (1 + 0.02 * Math.sin(t * 0.8));
      const sy = hor + sr * 0.15 - (pp.sun > 1 ? sr * 0.3 : 0);
      const glow = g.createRadialGradient(vpx, sy, sr * 0.2, vpx, sy, sr * 3.4);
      glow.addColorStop(0, `rgba(255,120,70,${0.20 * E})`);
      glow.addColorStop(0.5, `rgba(200,60,140,${0.07 * E})`);
      glow.addColorStop(1, 'rgba(200,60,140,0)');
      g.fillStyle = glow; g.fillRect(vpx - sr * 3.4, sy - sr * 3.4, sr * 6.8, sr * 6.8);
      if (pp.sun > 1.1) { // vista: crystalline geode shards
        g.save(); g.translate(vpx, sy);
        for (let i = 0; i < 14; i++) {
          const a0 = (i / 14) * TAU + t * 0.05;
          g.fillStyle = `hsla(${290 + (i % 3) * 25},80%,62%,${0.10 * E * (pp.sun - 1)})`;
          g.beginPath(); g.moveTo(0, 0);
          g.lineTo(Math.cos(a0) * sr * 2.6, Math.sin(a0) * sr * 2.6);
          g.lineTo(Math.cos(a0 + 0.09) * sr * 2.2, Math.sin(a0 + 0.09) * sr * 2.2);
          g.closePath(); g.fill();
        }
        g.restore();
      }
      g.save();
      g.beginPath(); g.arc(vpx, sy, sr, 0, TAU); g.clip();
      const sg = g.createLinearGradient(0, sy - sr, 0, sy + sr);
      sg.addColorStop(0, `rgba(255,214,90,${0.95 * E})`);
      sg.addColorStop(0.55, `rgba(255,110,80,${0.9 * E})`);
      sg.addColorStop(1, `rgba(230,50,140,${0.85 * E})`);
      g.fillStyle = sg; g.fillRect(vpx - sr, sy - sr, sr * 2, sr * 2);
      g.fillStyle = '#040308'; // slats, thicker toward the base
      for (let i = 0; i < 6; i++) {
        const fy = sy - sr + sr * 2 * (0.42 + i * 0.1);
        g.fillRect(vpx - sr, fy, sr * 2, (0.8 + i * 0.85) * ms);
      }
      g.restore();
      // horizon line under it all
      g.strokeStyle = `rgba(120,80,160,${0.25 * E})`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(0, hor); g.lineTo(w, hor); g.stroke();
    }
    // far ridge silhouette (flats acts)
    if (pp.open > 0.4 && pp.city < 0.6) {
      g.fillStyle = `rgba(26,14,40,${0.9 * pp.open * E})`;
      g.beginPath(); g.moveTo(0, hor);
      for (const r of s.ridge) g.lineTo(r.x * w, hor - r.y * h * pp.open);
      g.lineTo(w, hor); g.closePath(); g.fill();
    }
    // ---- ground + road ----
    const gg2 = g.createLinearGradient(0, hor, 0, h);
    gg2.addColorStop(0, 'rgba(16,8,26,0.9)'); gg2.addColorStop(1, 'rgba(6,4,12,1)');
    g.fillStyle = gg2; g.fillRect(0, hor, w, h - hor);
    // longitudinal grid (magenta, low alpha — atmosphere, not subject)
    g.lineWidth = 1 * ms;
    for (let i = -7; i <= 7; i++) {
      if (Math.abs(i) < 2) continue;
      g.strokeStyle = `rgba(190,60,160,${0.06 * E * pp.open})`;
      g.beginPath(); g.moveTo(vpx, hor);
      g.lineTo(cx + i * w * 0.16 - s.lane * w * 0.14, h + 20); g.stroke();
    }
    // lateral scroll lines
    for (const o of s.dashes) {
      const p = per(o.z), y = hor + p * (h - hor);
      g.strokeStyle = `rgba(190,60,160,${(0.03 + p * 0.06) * E * pp.open})`;
      g.lineWidth = Math.max(1, p * 2) * ms;
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    }
    // road edges — cyan world language
    const roadW = p => (0.09 + p * 0.36) * w;
    const roadX = p => vpx + (cx - vpx + s.lane * w * 0.12) * p;
    g.lineWidth = 2 * ms;
    for (const sgn of [-1, 1]) {
      g.strokeStyle = `rgba(90,220,235,${0.5 * E})`;
      g.beginPath();
      for (let zz = 0.02; zz <= 1; zz += 0.049) {
        const p = per(zz), x = roadX(p) + sgn * roadW(p) / 2, y = hor + p * (h - hor);
        zz <= 0.03 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    // center dashes + instrument line (your body on the road)
    for (const o of s.dashes) {
      const p = per(o.z), y = hor + p * (h - hor);
      g.fillStyle = `rgba(120,230,240,${(0.10 + p * 0.35) * E})`;
      g.fillRect(roadX(p) - 1 * ms, y, 2 * ms, Math.max(2, p * 14) * ms);
    }
    // beat markers on the road: perc truth — a bright rung lands with the kick
    if (ract.perc > 0.03) {
      const p = per(0.86), y = hor + p * (h - hor);
      g.fillStyle = `rgba(240,250,255,${ract.perc * 0.5 * E})`;
      g.fillRect(roadX(p) - roadW(p) / 2, y, roadW(p), 3 * ms);
    }
    // roadside posts — strobe white/cyan with percussion
    for (const o of s.posts) {
      const p = per(o.z), y = hor + p * (h - hor);
      for (const sgn of [-1, 1]) {
        const x = roadX(p) + sgn * roadW(p) * 0.62;
        const ph = Math.max(2, p * h * 0.06);
        g.fillStyle = `rgba(200,240,250,${(0.10 + ract.perc * 0.75) * p * E})`;
        g.fillRect(x - 1 * ms, y - ph, 2 * ms, ph);
      }
    }
    // ---- the city ----
    if (pp.city > 0.02) {
      const hash = (a, b) => { const x2 = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x2 - Math.floor(x2); };
      const sorted = [...s.towers].sort((a, b) => a.z - b.z);
      for (const tw of sorted) {
        const p = per(tw.z);
        if (p < 0.02) continue;
        const bw = tw.w0 * w * (0.3 + p * 2.2) * pp.city;
        const bh = tw.h0 * h * (0.25 + p * 2.6) * (0.55 + pp.city * 0.45);
        const x = roadX(p) + tw.xo * (roadW(p) * 0.5 + bw * 0.8) + tw.xo * p * w * 0.22;
        const yb = hor + p * (h - hor) * 0.995;
        const alpha = Math.min(1, p * 2.2) * pp.city * E;
        // body — violet world language
        g.fillStyle = `rgba(30,16,52,${0.92 * alpha})`;
        g.fillRect(x - bw / 2, yb - bh, bw, bh);
        g.strokeStyle = `rgba(150,80,220,${0.28 * alpha})`;
        g.lineWidth = 1 * ms;
        g.strokeRect(x - bw / 2, yb - bh, bw, bh);
        const nearNow = tw.near && p > 0.3;
        if (nearNow && tw.role === 'bass') {
          // LOCAL TRUTH: bass = amber floors thumping from the ground up
          const amt = ract.bass;
          if (amt > 0.02) {
            const fh = bh * (0.2 + amt * 0.4);
            const bg2 = g.createLinearGradient(0, yb - fh, 0, yb);
            bg2.addColorStop(0, 'rgba(255,170,60,0)');
            bg2.addColorStop(1, `rgba(255,170,60,${0.55 * amt * alpha})`);
            g.fillStyle = bg2; g.fillRect(x - bw / 2, yb - fh, bw, fh);
          }
        }
        if (nearNow && tw.role === 'arp') {
          // LOCAL TRUTH: arp = acid bands climbing the spire, one per real note
          for (const ev of rec.arp) {
            const age = (nowMs - ev.p) / 380;
            const row = ((ev.note % 24) / 24);
            const y2 = yb - bh * (0.12 + row * 0.8);
            g.fillStyle = `rgba(150,255,60,${(1 - age) * 0.7 * alpha})`;
            g.fillRect(x - bw / 2 - 1 * ms, y2, bw + 2 * ms, Math.max(2, bh * 0.045));
          }
        }
        if (tw.role === 'lead' && ract.lead > 0.04) {
          // lead = hot trim flash on the building edges only
          g.strokeStyle = `rgba(255,60,190,${ract.lead * 0.85 * alpha})`;
          g.lineWidth = 2 * ms;
          g.strokeRect(x - bw / 2, yb - bh, bw, bh);
        }
        // GLOBAL VIBE: windows twinkle with the whole mix's energy
        const mix = 0.25 + (ract.pad + ract.bells + ract.arp * 0.5 + ract.bass * 0.5) * 0.6;
        if (p > 0.1 && bw > 8) {
          const slot = Math.floor(t * 2.2);
          for (let r = 0; r < tw.rows; r++) for (let c = 0; c < tw.cols; c++) {
            if (hash(tw.seed + r * 7 + c * 13, slot) > mix) continue;
            const wx = x - bw / 2 + bw * (0.18 + c / tw.cols * 0.66);
            const wy = yb - bh * (0.1 + r / tw.rows * 0.82);
            g.fillStyle = `rgba(220,190,255,${0.5 * alpha})`;
            g.fillRect(wx, wy, Math.max(1.4, bw * 0.07), Math.max(1.4, bh * 0.022));
          }
        }
      }
    }
    // ---- the underpass ----
    if (pp.tun > 0.03) {
      const pulse = (typeof T !== 'undefined' && T.running) ? T.beatPulse() : 0.3 + 0.3 * Math.sin(t * 4);
      for (const o of s.arches) {
        const p = per(o.z);
        if (p < 0.02) continue;
        const aw = roadW(p) * 1.5, ah = (h - hor) * p * 1.35;
        const x = roadX(p), y = hor + p * (h - hor);
        const a = Math.min(1, p * 2.5) * pp.tun * E * (0.35 + pulse * 0.65);
        g.strokeStyle = `rgba(90,220,235,${0.55 * a})`;
        g.lineWidth = Math.max(1.4, p * 5) * ms;
        g.beginPath();
        g.moveTo(x - aw / 2, y); g.lineTo(x - aw / 2, y - ah);
        g.lineTo(x + aw / 2, y - ah); g.lineTo(x + aw / 2, y);
        g.stroke();
      }
      // compression vignette
      g.fillStyle = `rgba(2,2,6,${0.4 * pp.tun})`;
      g.fillRect(0, 0, w, hor * 0.8);
    }
    g.restore(); // un-bank
    // ---- you are the beam ----
    const conA = (0.05 + s.speed * 0.1) * E;
    const cone = g.createLinearGradient(0, h, 0, hor + (h - hor) * 0.25);
    cone.addColorStop(0, `rgba(210,245,255,${conA})`); cone.addColorStop(1, 'rgba(210,245,255,0)');
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(cx - w * 0.16 - s.bank * w * 0.05, h);
    g.lineTo(vpx - w * 0.012, hor + (h - hor) * 0.28);
    g.lineTo(vpx + w * 0.012, hor + (h - hor) * 0.28);
    g.lineTo(cx + w * 0.16 - s.bank * w * 0.05, h);
    g.closePath(); g.fill();
    // edge trails
    for (const sgn of [-1, 1]) {
      g.strokeStyle = `rgba(120,235,245,${(0.2 + s.speed * 0.4) * E})`;
      g.lineWidth = 2.4 * ms;
      g.beginPath();
      g.moveTo(cx + sgn * w * 0.3 - s.bank * w * 0.06, h);
      g.quadraticCurveTo(cx + sgn * w * 0.24, h * 0.9, cx + sgn * w * 0.21 - s.bank * w * 0.03, h * 0.86);
      g.stroke();
    }
    // ghosted banking arc on hard steer
    if (Math.abs(s.bank) > 0.5) {
      g.strokeStyle = `rgba(180,240,250,${(Math.abs(s.bank) - 0.5) * 0.5 * E})`;
      g.lineWidth = 1.5 * ms; g.setLineDash([6 * ms, 8 * ms]);
      g.beginPath();
      g.moveTo(cx, h * 0.97);
      g.quadraticCurveTo(cx + s.bank * w * 0.1, h * 0.75, vpx + s.bank * w * 0.05, hor + (h - hor) * 0.3);
      g.stroke(); g.setLineDash([]);
    }
    // instrument glow (cockpit presence, no car)
    g.fillStyle = `rgba(120,230,240,${0.22 * E})`;
    g.fillRect(cx - w * 0.05, h - 4 * ms, w * 0.1, 2.5 * ms);
    // speed streaks at the frame edges
    if (s.speed > 0.55) {
      const n = Math.floor((s.speed - 0.55) * 14);
      for (let i = 0; i < n; i++) {
        const yy = (Math.sin(i * 37.7 + Math.floor(t * 9) * 13.1) * 0.5 + 0.5) * h;
        const side2 = i % 2 ? 1 : -1;
        const x0 = side2 < 0 ? 0 : w;
        g.strokeStyle = `rgba(200,240,250,${(s.speed - 0.55) * 0.35})`;
        g.lineWidth = 1 * ms;
        g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 - side2 * w * 0.08 * s.speed, yy); g.stroke();
      }
    }
    // HUD
    const ACTS = ['IGNITION', 'THE FLATS', 'THE DISTRICTS', 'THE UNDERPASS', 'THE VISTA', 'DISSOLVE'];
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('ACT ' + (s.actIdx + 1) + '/6 — ' + ACTS[s.actIdx] + '  ·  SPEED ' + Math.round(s.speed * 100) + (pres < 0.3 ? '  ·  RESTING' : ''), 10, h - 10);
  },
  audio(A, P) {
    // per crew decision the V1 engine is untouched — V2 delegates to it
    const v1 = PIECES.find(d => d.id === 'SRC-18');
    return v1 && v1.audio ? v1.audio(A, P) : null;
  }
});

/* ---------- SRC-18.3 · NIGHT CIRCUIT V3 (the passage — a spatial slice) ---------- */
reg({
  id: 'SRC-18.3', family: 'SRC-18', ver: 3,
  title: 'Night Circuit V3', tech: 'PROJECTED 3D / THE PASSAGE',
  music: { bpm: 100, root: 45, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { bloom: 0.4, edge: true },
  tags: ['TRUE PERSPECTIVE', 'CURVED PATH', 'SIDE = HAND', 'BREATHING PASSAGE'],
  desc: 'The first true room of the long journey: an endless ride through a dark passage of luminous ribs and crystal growths, built in real projected 3D — the road curves in space, the camera banks into your turns, and everything dissolves into black with distance. The darkness is the architecture. Every few hundred meters the passage breaks open and a striped peach sun hangs far off in the gap before the ribs close in again. Your left hand lights the left wall of the world, your right lights the right; the passage plays what the engine plays.',
  interact: 'Each hand illuminates ITS side of the passage — coral crystal country on the left, cyan-mint on the right — closer to the sphere, brighter the world (and the engine leans that way musically). R − L bends the road itself: steer and the passage curves away ahead of you, the camera rolling into the turn. L + R = speed and reach: how fast you ride and how far your light carries into the dark. Bass thumps the left crystals, the arp climbs the ribs, the kick strikes a rung on the road. Rest your hands and the ride exhales to a slow ember crawl.',
  sound: 'The V1 synthwave engine, untouched, driving the world: straight 16ths, bass 8ths, altitude filter — the passage is a visualization of the same MIDI stream Ableton receives. Environment logic (tighter sound in the closed passage, open reverb in the gaps) is the planned next music pass.',
  init(P) {
    const R = P.rand;
    const N = 56, DS = 3;
    const segs = [];
    for (let i = 0; i < N; i++) {
      segs.push({
        k: (R() - 0.5) * 0.004, dy: 0, open: false,
        seed: R() * 1000,
        cl: R() < 0.6, cr: R() < 0.6 // crystal clusters this segment?
      });
    }
    P.state = {
      segs, N, DS, prog: 0, idx: 0,
      envMode: 'passage', envRun: 34 + R() * 20, hillT: R() * 20,
      speed: 0, steer: 0, bank: 0, pres: 0, wander: 0, wT: R() * 9,
      arpFlash: new Array(20).fill(0), arpCycle: 0, lastEvP: 0,
      bassPulse: 0, kickPulse: 0, leadPulse: 0, sunA: 0, sunSX: null, sunSY: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, R = P.rand;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.2);
    // IGNITION — hands arriving after rest turn the engine over (SFX note 36)
    if (s.pres < 0.22) s.asleep = true;
    if (s.asleep && s.pres > 0.5) {
      s.asleep = false;
      P.ping(A => {
        if (typeof MOut !== 'undefined') MOut.sfxNote(36, 0.85, 3);
        A.hit({ vol: 0.22, dur: 0.7, freq: 85, q: 0.6, at: 0 });
        A.bassNote(H.rootFreq(-2), { at: 0, vol: 0.14, dur: 1.2 });
      });
    }
    const energy = 0.22 + s.pres * 0.78;
    const thr = clamp((inp.L + inp.R) / 2);
    s.speed += ((4 + Math.pow(thr, 1.25) * 34) * energy - s.speed) * Math.min(1, dt * 1.8);
    // steering bends the road being laid down ahead; idle, the road wanders on its own
    s.wT += dt * 0.14;
    s.wander = Math.sin(s.wT) * 0.0035 + Math.sin(s.wT * 0.37 + 2) * 0.002;
    const steerIn = clamp(inp.R - inp.L, -1, 1);
    s.steer += (steerIn - s.steer) * Math.min(1, dt * 2.2);
    s.bank += (s.steer - s.bank) * Math.min(1, dt * 2.6);
    // advance along the passage; recycle segments behind us to the far end
    s.prog += s.speed * dt;
    while (s.prog >= s.DS) {
      s.prog -= s.DS;
      s.segs.shift();
      // environments alternate in long runs: passage ↔ open flats.
      // The transition is free — old world recedes as the new one is laid down.
      s.envRun--;
      if (s.envRun <= 0) {
        s.envMode = s.envMode === 'passage' ? 'open' : 'passage';
        s.envRun = s.envMode === 'open' ? 26 + R() * 18 : 38 + R() * 26;
      }
      const open = s.envMode === 'open';
      // vertical path: the road rises and dips — bigger swells out in the open
      s.hillT += 0.42;
      const dy = Math.sin(s.hillT * 0.5) * (open ? 0.5 : 0.16) + (R() - 0.5) * 0.04;
      s.segs.push({
        k: s.wander + s.steer * 0.022 + (R() - 0.5) * 0.002,
        dy, open, seed: R() * 1000, cl: R() < 0.6, cr: R() < 0.6
      });
      s.idx++;
    }
    // pulses decay
    s.bassPulse = Math.max(0, s.bassPulse - dt * 4.5);
    s.kickPulse = Math.max(0, s.kickPulse - dt * 6);
    s.leadPulse = Math.max(0, s.leadPulse - dt * 3);
    for (let i = 0; i < s.arpFlash.length; i++) s.arpFlash[i] = Math.max(0, s.arpFlash[i] - dt * 4);
    // read the real MIDI stream — light that never lies
    if (P.focused && typeof MOut !== 'undefined') {
      const now = performance.now();
      for (let i = MOut.log.length - 1; i >= 0; i--) {
        const ev = MOut.log[i];
        if (ev.p <= s.lastEvP) break;
        if (ev.p > now) continue;
        if (ev.role === 'arp') { s.arpFlash[s.arpCycle % s.arpFlash.length] = 1; s.arpCycle++; }
        else if (ev.role === 'bass') s.bassPulse = Math.min(1, s.bassPulse + 0.7 * ev.vel / 127);
        else if (ev.role === 'perc') s.kickPulse = 1;
        else if (ev.role === 'lead') s.leadPulse = 1;
      }
      s.lastEvP = now;
    }
    // sun appears when open segments are in the near-mid field
    let openNear = 0;
    for (let i = 4; i < 26; i++) if (s.segs[i].open) openNear++;
    s.sunA += (clamp(openNear / 8) - s.sunA) * Math.min(1, dt * 1.4);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const E = 0.28 + s.pres * 0.72;
    const L = inp.L, Rv = inp.R;
    const reach = 0.5 + ((L + Rv) / 2) * 0.5; // how far your light carries
    g.fillStyle = '#030307'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.52, f = h * 1.05;
    const camY = 1.35, roadW = 7;
    g.save();
    g.translate(cx, cy); g.rotate(-s.bank * 0.11); g.translate(-cx, -cy);
    // ---- integrate the curved path (camera-space centers per segment) ----
    const pts = [{ x: 0, z: 0.9, y: 0, phi: 0, seg: s.segs[0], anchor: true }]; // stable point under the camera
    let phi = 0, x = 0, y = 0, z = 0.9;
    // sub-segment smoothness: start a partial segment in
    let rem = s.DS - s.prog;
    for (let i = 0; i < s.N; i++) {
      const seg = s.segs[i];
      const dd = i === 0 ? rem : s.DS;
      phi += seg.k * dd * 3.2;
      phi = clamp(phi, -0.9, 0.9);
      x += Math.sin(phi) * dd;
      y += seg.dy * (dd / s.DS);
      z += Math.cos(phi) * dd;
      pts.push({ x, z, y, phi, seg });
    }
    // HIGH-CONTRAST WORLD BEND (the V1 feel): steering warps everything visible, instantly
    const bendV = s.bank * 0.0065;
    for (const p of pts) p.x += bendV * p.z * p.z;
    const NP = pts.length;
    const prj = (px, py, pz) => [cx + (px / pz) * f, cy + ((camY - py) / pz) * f];
    const fog = pz => Math.max(0, Math.exp(-pz * ((0.033 - s.sunA * 0.013) / reach)) - 0.015);
    // ---- distant sun in the gap (billboard, behind everything, smoothed anchor) ----
    if (s.sunA > 0.02) {
      const far = pts[Math.min(NP - 1, 42)];
      const [tx2, ty2] = prj(far.x, far.y + camY + 1.2, far.z);
      if (s.sunSX === null) { s.sunSX = tx2; s.sunSY = ty2; }
      s.sunSX += (tx2 - s.sunSX) * 0.045;
      s.sunSY += (ty2 - s.sunSY) * 0.045;
      const sx2 = s.sunSX, sy2 = s.sunSY;
      const sr = w * 0.035 * (1 + s.sunA * 0.6);
      const glow = g.createRadialGradient(sx2, sy2, sr * 0.3, sx2, sy2, sr * 3);
      glow.addColorStop(0, `rgba(255,195,126,${0.24 * s.sunA * E})`);
      glow.addColorStop(1, 'rgba(255,140,110,0)');
      g.fillStyle = glow; g.fillRect(sx2 - sr * 3, sy2 - sr * 3, sr * 6, sr * 6);
      g.save(); g.beginPath(); g.arc(sx2, sy2, sr, 0, TAU); g.clip();
      const sg2 = g.createLinearGradient(0, sy2 - sr, 0, sy2 + sr);
      sg2.addColorStop(0, `rgba(255,214,140,${0.9 * s.sunA * E})`);
      sg2.addColorStop(1, `rgba(255,126,107,${0.85 * s.sunA * E})`);
      g.fillStyle = sg2; g.fillRect(sx2 - sr, sy2 - sr, sr * 2, sr * 2);
      g.fillStyle = '#030307';
      for (let i2 = 0; i2 < 4; i2++) g.fillRect(sx2 - sr, sy2 + sr * (0.15 + i2 * 0.22), sr * 2, (0.8 + i2 * 0.7) * ms);
      g.restore();
    }
    // ---- world, far → near (painter) ----
    for (let i = NP - 1; i >= 0; i--) {
      const p = pts[i];
      if (p.z < 0.7) continue;
      const fz = fog(p.z) * E;
      if (fz < 0.01) continue;
      const seg = p.seg;
      const hash = k2 => { const q = Math.sin(seg.seed * 12.99 + k2 * 78.2) * 43758.55; return q - Math.floor(q); };
      const ribHere = !p.anchor && (s.idx + i) % 3 === 0 && !seg.open;
      // headlight pool — your beam actually carries into the dark
      const head = Math.max(0, 1 - p.z / 17);
      // -- open flats: sparse mint waypost lights instead of walls --
      if (!p.anchor && seg.open && hash(19) < 0.4) {
        for (const side of [-1, 1]) {
          const hand = side < 0 ? L : Rv;
          const a = (0.08 + hand * 0.5 + head * 0.3) * fz;
          if (a < 0.02) continue;
          const px2 = p.x + side * (roadW / 2 + 1.4);
          const ph2 = 1.6 + hash(side + 4) * 0.8;
          const [x0, y0] = prj(px2, p.y, p.z);
          const [x1, y1] = prj(px2, p.y + ph2, p.z);
          g.strokeStyle = `rgba(126,255,201,${a})`;
          g.lineWidth = Math.max(0.7, 16 / p.z) * 0.5 * ms;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          g.fillStyle = `rgba(255,195,126,${a * 1.2})`;
          g.beginPath(); g.arc(x1, y1, Math.max(1, 9 / p.z) * ms, 0, TAU); g.fill();
        }
      }
      // -- crystal growths, per side: coral country left, cyan-mint right --
      for (const side of [-1, 1]) {
        const has = side < 0 ? seg.cl : seg.cr;
        if (!has || seg.open || p.anchor) continue;
        const hand = side < 0 ? L : Rv;
        const pulse = side < 0 ? s.bassPulse : 0;
        const lum = (0.06 + hand * 0.72 + pulse * 0.5 + head * 0.25) * fz;
        if (lum < 0.015) continue;
        const n = 2 + (hash(1) * 3 | 0);
        for (let c = 0; c < n; c++) {
          const bx = side * (roadW / 2 + 0.7 + hash(c + 2) * 3.2);
          const bh = 0.8 + hash(c + 7) * 2.6 + pulse * 0.5;
          const bw2 = 0.35 + hash(c + 11) * 0.5;
          const [x0, y0] = prj(p.x + bx - bw2 * side, p.y, p.z);
          const [x1, y1] = prj(p.x + bx, p.y + bh, p.z);
          const [x2, y2] = prj(p.x + bx + bw2 * side, p.y, p.z);
          const hue = side < 0 ? (hash(c) < 0.5 ? 'rgba(255,110,120' : 'rgba(255,79,216') : (hash(c) < 0.5 ? 'rgba(107,232,240' : 'rgba(126,255,201');
          g.fillStyle = `${hue},${lum})`;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
          // luminous core line
          g.strokeStyle = `${hue},${Math.min(0.9, lum * 2)})`;
          g.lineWidth = Math.max(0.6, 2.4 / p.z * 10) * 0.35 * ms;
          g.beginPath(); g.moveTo((x0 + x2) / 2, y0); g.lineTo(x1, y1); g.stroke();
        }
      }
      // -- passage ribs: lavender arches, each side lit by its hand --
      if (ribHere) {
        const ribN = ((s.idx + i) / 3 | 0) % s.arpFlash.length;
        const flash = s.arpFlash[ribN];
        const rw = roadW * 1.35, rh = 5.2;
        const steps = 9;
        for (const side of [-1, 1]) {
          const hand = side < 0 ? L : Rv;
          const a = (0.06 + hand * 0.75 + flash * 0.65 + head * 0.2) * fz;
          if (a < 0.015) continue;
          g.strokeStyle = flash > 0.35 ? `rgba(126,255,201,${a})` : `rgba(184,161,255,${a})`;
          g.lineWidth = Math.max(0.7, 26 / p.z) * (0.55 + flash * 0.5) * ms;
          g.beginPath();
          for (let k2 = 0; k2 <= steps; k2++) {
            const a0 = (k2 / steps) * (Math.PI / 2);
            const rx = p.x + side * Math.cos(a0) * rw;
            const ry = p.y + Math.sin(a0) * rh;
            const [sx2, sy2] = prj(rx, ry, p.z);
            k2 === 0 ? g.moveTo(sx2, sy2) : g.lineTo(sx2, sy2);
          }
          g.stroke();
        }
        // apex — lead flashes the crown
        if (s.leadPulse > 0.05) {
          const [ax, ay] = prj(p.x, p.y + rh, p.z);
          g.fillStyle = `rgba(255,79,216,${s.leadPulse * fz * 0.9})`;
          g.beginPath(); g.arc(ax, ay, Math.max(1, 14 / p.z) * ms, 0, TAU); g.fill();
        }
      }
      // -- road: edge ribbons + center dashes, headlight-lit --
      if (i < NP - 1) {
        const q = pts[i + 1];
        for (const side of [-1, 1]) {
          const hand = side < 0 ? L : Rv;
          const a = (0.16 + hand * 0.3 + head * 0.55) * fz;
          const [x0, y0] = prj(p.x + side * roadW / 2, p.y, p.z);
          const [x1, y1] = prj(q.x + side * roadW / 2, q.y, q.z);
          g.strokeStyle = `rgba(107,232,240,${a})`;
          g.lineWidth = Math.max(0.8, 30 / p.z) * 0.5 * ms;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        }
        // center dashes: every other segment
        if ((s.idx + i) % 2 === 0) {
          const [x0, y0] = prj(p.x, p.y + 0.01, p.z);
          const [x1, y1] = prj((p.x + q.x) / 2, (p.y + q.y) / 2 + 0.01, (p.z + q.z) / 2);
          g.strokeStyle = `rgba(126,255,201,${(0.10 + head * 0.5) * fz})`;
          g.lineWidth = Math.max(0.6, 16 / p.z) * 0.4 * ms;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        }
        // kick rung — percussion strikes the road
        if (s.kickPulse > 0.05 && (s.idx + i) % 6 === 0 && p.z < 26) {
          const [x0, y0] = prj(p.x - roadW / 2, p.y + 0.02, p.z);
          const [x1, y1] = prj(p.x + roadW / 2, p.y + 0.02, p.z);
          g.strokeStyle = `rgba(240,248,255,${s.kickPulse * fz * 0.8})`;
          g.lineWidth = Math.max(1, 22 / p.z) * 0.6 * ms;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        }
      }
    }
    g.restore();
    // ---- the rider (light-touch embodiment) ----
    // headlight cone
    const coneA = (0.04 + (s.speed / 38) * 0.07) * E;
    const cone = g.createLinearGradient(0, h, 0, h * 0.55);
    cone.addColorStop(0, `rgba(210,245,255,${coneA})`); cone.addColorStop(1, 'rgba(210,245,255,0)');
    g.fillStyle = cone;
    g.beginPath();
    g.moveTo(cx - w * 0.13 - s.bank * w * 0.04, h);
    g.lineTo(cx - w * 0.015 + s.bank * w * 0.02, h * 0.56);
    g.lineTo(cx + w * 0.015 + s.bank * w * 0.02, h * 0.56);
    g.lineTo(cx + w * 0.13 - s.bank * w * 0.04, h);
    g.closePath(); g.fill();
    // fairing silhouette + bars + instrument glow
    g.fillStyle = 'rgba(5,5,10,0.85)';
    g.beginPath();
    g.moveTo(cx - w * 0.30, h);
    g.quadraticCurveTo(cx - w * 0.10, h - h * 0.055 - s.bank * h * 0.012, cx, h - h * 0.075);
    g.quadraticCurveTo(cx + w * 0.10, h - h * 0.055 + s.bank * h * 0.012, cx + w * 0.30, h);
    g.closePath(); g.fill();
    g.strokeStyle = `rgba(126,255,201,${0.30 * E})`; g.lineWidth = 1.6 * ms;
    g.beginPath();
    g.moveTo(cx - w * 0.16, h - h * 0.012 - s.bank * h * 0.01);
    g.quadraticCurveTo(cx, h - h * 0.062, cx + w * 0.16, h - h * 0.012 + s.bank * h * 0.01);
    g.stroke();
    g.fillStyle = `rgba(184,161,255,${0.35 * E})`;
    g.fillRect(cx - w * 0.022, h - h * 0.045, w * 0.044, 2 * ms);
    // HUD
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText((s.sunA > 0.5 ? 'THE FLATS' : 'THE PASSAGE') + ' · ' + Math.round(s.speed * 6) + ' KM/H' + (s.pres < 0.3 ? ' · RESTING' : ''), 10, h - 10);
  },
  audio(A, P) {
    // the V1 engine, untouched — V3 is a new world on the same instrument
    const v1 = PIECES.find(d => d.id === 'SRC-18');
    return v1 && v1.audio ? v1.audio(A, P) : null;
  }
});

/* ---------- SRC-18.4 · THE PASSAGE V4 (embodied depth) ---------- */
reg({
  id: 'SRC-18.4', family: 'SRC-18', ver: 4,
  title: 'Night Circuit V4', tech: 'EMBODIED DEPTH / CHASE CAM',
  music: { bpm: 100, root: 45, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { bloom: 0.35, edge: true },
  tags: ['OPAQUE WORLD', 'CHASE CAM RIDER', 'HEADLIGHT REVEALS', 'WET ROAD'],
  desc: 'The passage becomes a place. Solid two-tone geometry now — crystal prisms with lit faces and black faces that OCCLUDE what lies behind them, a real road surface with a headlight pool and wet reflections, and you are no longer a floating camera: a rider on a black silhouette machine leans through the curves ahead of you, its headlight painting the world into existence as it sweeps. Far things are flat dark cutouts; near things are faceted and edged — the world materializes as it approaches. Cruising tuned: long lazy curves, banking INTO the turn like a rider does.',
  interact: 'Hands as before: each lights its side, R − L steers (gently now — this is a cruise, not a kart), L + R is throttle and reach. The bike leans into your turns, bobs with speed, and its tail lamp flares on the kick. The headlight is the third light source after your two hands: it reveals whatever the road aims it at.',
  sound: 'Identical V1 engine — this is a visual iteration. SFX ignition (note 36) fires when hands arrive after rest.',
  init(P) {
    const R = P.rand;
    const N = 56, DS = 3;
    const segs = [];
    for (let i = 0; i < N; i++) {
      segs.push({
        k: (R() - 0.5) * 0.003, dy: 0, open: false, seed: R() * 1000,
        cl: R() < 0.62, cr: R() < 0.62, gate: false
      });
    }
    P.state = {
      segs, N, DS, prog: 0, idx: 0,
      envMode: 'passage', envRun: 36 + R() * 20, hillT: R() * 20, gateT: 5,
      speed: 0, steer: 0, bank: 0, pres: 0, wander: 0, wT: R() * 9,
      arpFlash: new Array(20).fill(0), arpCycle: 0, lastEvP: 0,
      bassPulse: 0, kickPulse: 0, leadPulse: 0, sunA: 0, sunSX: null, sunSY: 0,
      asleep: true, dip: 0, bob: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, R = P.rand;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.2);
    if (s.pres < 0.22) s.asleep = true;
    if (s.asleep && s.pres > 0.5) {
      s.asleep = false; s.dip = 1;
      P.ping(A => {
        if (typeof MOut !== 'undefined') MOut.sfxNote(36, 0.85, 3);
        A.hit({ vol: 0.22, dur: 0.7, freq: 85, q: 0.6, at: 0 });
        A.bassNote(H.rootFreq(-2), { at: 0, vol: 0.14, dur: 1.2 });
      });
    }
    s.dip = Math.max(0, s.dip - dt * 1.4);
    const energy = 0.22 + s.pres * 0.78;
    const thr = clamp((inp.L + inp.R) / 2);
    s.speed += ((4 + Math.pow(thr, 1.25) * 32) * energy - s.speed) * Math.min(1, dt * 1.6);
    s.bob += dt * (2.5 + s.speed * 0.35);
    // CRUISE steering: slower response, gentler curvature — long lazy arcs
    s.wT += dt * 0.11;
    s.wander = Math.sin(s.wT) * 0.0024 + Math.sin(s.wT * 0.37 + 2) * 0.0014;
    const steerIn = clamp(inp.R - inp.L, -1, 1);
    s.steer += (steerIn - s.steer) * Math.min(1, dt * 1.3);
    s.bank += (s.steer - s.bank) * Math.min(1, dt * 2.0);
    s.prog += s.speed * dt;
    while (s.prog >= s.DS) {
      s.prog -= s.DS;
      s.segs.shift();
      s.envRun--;
      if (s.envRun <= 0) {
        s.envMode = s.envMode === 'passage' ? 'open' : 'passage';
        s.envRun = s.envMode === 'open' ? 26 + R() * 18 : 38 + R() * 26;
      }
      const open = s.envMode === 'open';
      s.hillT += 0.42;
      s.gateT--;
      const gate = s.gateT <= 0 && !open;
      if (gate) s.gateT = 5 + (R() * 6 | 0); // guaranteed near-pass every ~15-30m
      const dy = Math.sin(s.hillT * 0.5) * (open ? 0.5 : 0.16) + (R() - 0.5) * 0.04;
      s.segs.push({
        k: s.wander + s.steer * 0.009 + (R() - 0.5) * 0.0015,
        dy, open, gate, seed: R() * 1000, cl: R() < 0.62, cr: R() < 0.62
      });
      s.idx++;
    }
    s.bassPulse = Math.max(0, s.bassPulse - dt * 4.5);
    s.kickPulse = Math.max(0, s.kickPulse - dt * 6);
    s.leadPulse = Math.max(0, s.leadPulse - dt * 3);
    for (let i = 0; i < s.arpFlash.length; i++) s.arpFlash[i] = Math.max(0, s.arpFlash[i] - dt * 4);
    if (P.focused && typeof MOut !== 'undefined') {
      const now = performance.now();
      for (let i = MOut.log.length - 1; i >= 0; i--) {
        const ev = MOut.log[i];
        if (ev.p <= s.lastEvP) break;
        if (ev.p > now) continue;
        if (ev.role === 'arp') { s.arpFlash[s.arpCycle % s.arpFlash.length] = 1; s.arpCycle++; }
        else if (ev.role === 'bass') s.bassPulse = Math.min(1, s.bassPulse + 0.7 * ev.vel / 127);
        else if (ev.role === 'perc') s.kickPulse = 1;
        else if (ev.role === 'lead') s.leadPulse = 1;
      }
      s.lastEvP = now;
    }
    let openNear = 0;
    for (let i = 4; i < 26; i++) if (s.segs[i].open) openNear++;
    s.sunA += (clamp(openNear / 8) - s.sunA) * Math.min(1, dt * 1.4);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const E = 0.3 + s.pres * 0.7;
    const L = inp.L, Rv = inp.R;
    const thr = (L + Rv) / 2;
    const reach = 0.5 + thr * 0.5;
    const BG = [4, 3, 8];
    g.fillStyle = '#040308'; g.fillRect(0, 0, w, h);
    const cx = w / 2;
    // camera dynamics: chase height, speed bob, ignition dip, throttle FOV
    const cy = h * 0.5 + Math.sin(s.bob) * h * 0.004 * (s.speed / 30) + s.dip * h * 0.03;
    const f = h * (1.02 + thr * 0.09);
    const camY = 2.2, roadW = 7;
    g.save();
    // banking: camera rolls INTO the turn, subtly — the bike does the leaning
    g.translate(cx, h * 0.6); g.rotate(s.bank * 0.045); g.translate(-cx, -h * 0.6);
    // ---- path ----
    const pts = [{ x: 0, z: 0.9, y: 0, seg: s.segs[0], anchor: true }];
    let phi = 0, x = 0, y = 0, z = 0.9;
    let rem = s.DS - s.prog;
    for (let i = 0; i < s.N; i++) {
      const seg = s.segs[i];
      const dd = i === 0 ? rem : s.DS;
      phi = clamp(phi + seg.k * dd * 3.2, -0.7, 0.7);
      x += Math.sin(phi) * dd; y += seg.dy * (dd / s.DS); z += Math.cos(phi) * dd;
      pts.push({ x, z, y, seg });
    }
    const bendV = s.bank * 0.0032; // gentle whole-world lean, correct direction
    for (const p of pts) p.x += bendV * p.z * p.z;
    const NP = pts.length;
    const prj = (px, py, pz) => [cx + (px / pz) * f, cy + ((camY - py) / pz) * f];
    const fogK = (0.033 - s.sunA * 0.013) / reach;
    const fog = pz => Math.max(0, Math.exp(-pz * fogK) - 0.012);
    // opaque fogged color: hue/sat/light dimmed to background with distance
    const col = (hh, ss2, ll, fz) => `hsl(${hh},${Math.round(ss2 * (0.4 + fz * 0.6))}%,${Math.max(1.5, ll * fz)}%)`;
    // road center x at arbitrary z (for cone aim)
    const roadXat = zq => {
      for (let i = 1; i < NP; i++) if (pts[i].z >= zq) {
        const a = pts[i - 1], b = pts[i];
        const k2 = (zq - a.z) / Math.max(0.001, b.z - a.z);
        return [a.x + (b.x - a.x) * k2, a.y + (b.y - a.y) * k2];
      }
      return [pts[NP - 1].x, pts[NP - 1].y];
    };
    // headlight cone factor for a world point — light REVEALS, it doesn't decorate
    const [aim10x] = roadXat(12);
    const coneAmt = 0.35 + s.speed / 36 * 0.65;
    const coneAt = (px, pz) => {
      if (pz < 3.4) return 0;
      const [rx2] = roadXat(pz);
      const lat = px - rx2 - s.bank * Math.min(6, pz * 0.25);
      const cw = 2 + (pz - 3) * 0.24;
      return Math.exp(-(lat * lat) / (2 * cw * cw)) * Math.exp(-Math.max(0, pz - 4) / 24) * coneAmt * (1 + s.kickPulse * 0.15);
    };
    // ---- sun (flat far-field icon, smoothed) ----
    if (s.sunA > 0.02) {
      const far = pts[Math.min(NP - 1, 42)];
      const [tx2, ty2] = prj(far.x, far.y + camY + 1.2, far.z);
      if (s.sunSX === null) { s.sunSX = tx2; s.sunSY = ty2; }
      s.sunSX += (tx2 - s.sunSX) * 0.045; s.sunSY += (ty2 - s.sunSY) * 0.045;
      const sx2 = s.sunSX, sy2 = s.sunSY, sr = w * 0.038 * (1 + s.sunA * 0.5);
      const glow = g.createRadialGradient(sx2, sy2, sr * 0.3, sx2, sy2, sr * 3);
      glow.addColorStop(0, `rgba(255,195,126,${0.2 * s.sunA * E})`);
      glow.addColorStop(1, 'rgba(255,140,110,0)');
      g.fillStyle = glow; g.fillRect(sx2 - sr * 3, sy2 - sr * 3, sr * 6, sr * 6);
      g.save(); g.beginPath(); g.arc(sx2, sy2, sr, 0, TAU); g.clip();
      const sg2 = g.createLinearGradient(0, sy2 - sr, 0, sy2 + sr);
      sg2.addColorStop(0, `rgba(255,214,140,${0.92 * s.sunA * E})`);
      sg2.addColorStop(1, `rgba(255,126,107,${0.88 * s.sunA * E})`);
      g.fillStyle = sg2; g.fillRect(sx2 - sr, sy2 - sr, sr * 2, sr * 2);
      g.fillStyle = '#040308';
      for (let i2 = 0; i2 < 4; i2++) g.fillRect(sx2 - sr, sy2 + sr * (0.15 + i2 * 0.22), sr * 2, (0.8 + i2 * 0.7) * ms);
      g.restore();
    }
    // stars
    if (!s.stars2) { s.stars2 = []; for (let i = 0; i < 46; i++) s.stars2.push({ x: P.rand(), y: P.rand() * 0.34, tw: P.rand() * TAU }); }
    for (const st of s.stars2) {
      g.fillStyle = `rgba(200,210,255,${(0.10 + 0.08 * Math.sin(t + st.tw)) * E * (0.4 + s.sunA * 0.6)})`;
      g.fillRect(st.x * w, st.y * h, 1.2 * ms, 1.2 * ms);
    }
    // ---- GROUND + ROAD SURFACE (a world you travel OVER) ----
    for (let i = NP - 2; i >= 0; i--) {
      const p = pts[i], q = pts[i + 1];
      if (q.z < 0.8) continue;
      const fz = fog(p.z) * E, fzq = fog(q.z) * E;
      if (fz < 0.008) continue;
      // shoulders
      for (const side of [-1, 1]) {
        const [x0, y0] = prj(p.x + side * roadW / 2, p.y, p.z);
        const [x1, y1] = prj(q.x + side * roadW / 2, q.y, q.z);
        const [x2, y2] = prj(q.x + side * roadW * 4.5, q.y - 0.15, q.z);
        const [x3, y3] = prj(p.x + side * roadW * 4.5, p.y - 0.15, p.z);
        g.fillStyle = col(255, 20, 3.4, fz);
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath(); g.fill();
      }
      // road slab — dark asphalt, faintly lit by the cone
      const cf = coneAt(p.x, p.z);
      const [xa, ya] = prj(p.x - roadW / 2, p.y, p.z);
      const [xb, yb] = prj(p.x + roadW / 2, p.y, p.z);
      const [xc, yc] = prj(q.x + roadW / 2, q.y, q.z);
      const [xd, yd] = prj(q.x - roadW / 2, q.y, q.z);
      g.fillStyle = col(230, 25, 4.5 + cf * 16, fz);
      g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.lineTo(xc, yc); g.lineTo(xd, yd); g.closePath(); g.fill();
      // edge light ribbons (ink, but anchored to the slab)
      for (const side of [-1, 1]) {
        const hand = side < 0 ? L : Rv;
        const a = (0.14 + hand * 0.3 + cf * 0.5) * fz;
        g.strokeStyle = `rgba(107,232,240,${a})`;
        g.lineWidth = Math.max(0.8, 26 / p.z) * 0.5 * ms;
        g.beginPath();
        const [ex0, ey0] = side < 0 ? [xa, ya] : [xb, yb];
        const [ex1, ey1] = side < 0 ? [xd, yd] : [xc, yc];
        g.moveTo(ex0, ey0); g.lineTo(ex1, ey1); g.stroke();
      }
      // center dashes
      if ((s.idx + i) % 2 === 0) {
        const [m0x, m0y] = prj(p.x, p.y + 0.01, p.z);
        const [m1x, m1y] = prj((p.x + q.x) / 2, (p.y + q.y) / 2 + 0.01, (p.z + q.z) / 2);
        g.strokeStyle = `rgba(126,255,201,${(0.08 + cf * 0.5) * fz})`;
        g.lineWidth = Math.max(0.6, 14 / p.z) * 0.4 * ms;
        g.beginPath(); g.moveTo(m0x, m0y); g.lineTo(m1x, m1y); g.stroke();
      }
      // kick rung
      if (s.kickPulse > 0.05 && (s.idx + i) % 6 === 0 && p.z < 26 && p.z > 4) {
        g.strokeStyle = `rgba(240,248,255,${s.kickPulse * fz * 0.7})`;
        g.lineWidth = Math.max(1, 20 / p.z) * 0.6 * ms;
        g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
      }
    }
    // headlight pool — the beam landing on the road ahead
    {
      const [px2, py2] = roadXat(10);
      const [sx2, sy2] = prj(px2 - s.bank * 1.6, py2 + 0.02, 10);
      const pw = w * 0.09 * (1 + thr * 0.5), ph2 = h * 0.05;
      const pa = (0.05 + s.speed / 36 * 0.08) * E * (1 + s.kickPulse * 0.3);
      const pg2 = g.createRadialGradient(sx2, sy2, 1, sx2, sy2, pw);
      pg2.addColorStop(0, `rgba(215,245,255,${pa})`); pg2.addColorStop(1, 'rgba(215,245,255,0)');
      g.fillStyle = pg2;
      g.save(); g.translate(sx2, sy2); g.scale(1, ph2 / pw); g.translate(-sx2, -sy2);
      g.beginPath(); g.arc(sx2, sy2, pw, 0, TAU); g.fill(); g.restore();
      // wet-road reflection streak under the sun
      if (s.sunA > 0.1 && s.sunSX !== null) {
        const rg = g.createLinearGradient(0, s.sunSY, 0, s.sunSY + h * 0.3);
        rg.addColorStop(0, `rgba(255,170,110,${0.10 * s.sunA * E})`); rg.addColorStop(1, 'rgba(255,170,110,0)');
        g.fillStyle = rg;
        g.fillRect(s.sunSX - w * 0.012, s.sunSY, w * 0.024, h * 0.3);
      }
    }
    // ---- OBJECTS far → near: opaque two-tone prisms, cutouts far, edges near ----
    for (let i = NP - 1; i >= 0; i--) {
      const p = pts[i];
      if (p.z < 0.9 || p.anchor) continue;
      const fz = fog(p.z) * E;
      if (fz < 0.01) continue;
      const seg = p.seg;
      const hash = k2 => { const q2 = Math.sin(seg.seed * 12.99 + k2 * 78.2) * 43758.55; return q2 - Math.floor(q2); };
      const ribHere = (s.idx + i) % 3 === 0 && !seg.open;
      // open flats: wayposts
      if (seg.open && hash(19) < 0.4) {
        for (const side of [-1, 1]) {
          const hand = side < 0 ? L : Rv;
          const cf = coneAt(p.x + side * (roadW / 2 + 1.4), p.z);
          const a = (0.07 + hand * 0.45 + cf * 0.5) * fz;
          if (a < 0.02) continue;
          const px2 = p.x + side * (roadW / 2 + 1.4);
          const [x0, y0] = prj(px2, p.y, p.z);
          const [x1, y1] = prj(px2, p.y + 1.9, p.z);
          g.strokeStyle = `rgba(126,255,201,${a})`;
          g.lineWidth = Math.max(0.7, 14 / p.z) * 0.5 * ms;
          g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
          g.fillStyle = `rgba(255,195,126,${Math.min(1, a * 1.3)})`;
          g.beginPath(); g.arc(x1, y1, Math.max(1, 8 / p.z) * ms, 0, TAU); g.fill();
        }
      }
      // gate pillars — the guaranteed near pass, whipping by the frame edge
      if (seg.gate) {
        for (const side of [-1, 1]) {
          const gx = p.x + side * (roadW / 2 + 0.65);
          const cf = coneAt(gx, p.z);
          const hand = side < 0 ? L : Rv;
          const lit = clamp(0.1 + hand * 0.5 + cf * 0.9);
          const gw = 0.34, gh = 4.6;
          const [b0x, b0y] = prj(gx - gw, p.y, p.z);
          const [b1x, b1y] = prj(gx + gw, p.y, p.z);
          const [t1x, t1y] = prj(gx + gw, p.y + gh, p.z);
          const [t0x, t0y] = prj(gx - gw, p.y + gh, p.z);
          g.fillStyle = col(258, 60, 6 + lit * 30, fz);
          g.beginPath(); g.moveTo(b0x, b0y); g.lineTo(b1x, b1y); g.lineTo(t1x, t1y); g.lineTo(t0x, t0y); g.closePath(); g.fill();
          if (p.z < 20) {
            g.strokeStyle = col(258, 80, 25 + lit * 45, fz);
            g.lineWidth = Math.max(0.8, 18 / p.z) * 0.6 * ms;
            g.beginPath(); g.moveTo(side < 0 ? b1x : b0x, side < 0 ? b1y : b0y); g.lineTo(side < 0 ? t1x : t0x, side < 0 ? t1y : t0y); g.stroke();
          }
        }
      }
      // crystals — depth-tiered: cutout → facets → edged prisms
      for (const side of [-1, 1]) {
        const has = side < 0 ? seg.cl : seg.cr;
        if (!has || seg.open) continue;
        const hand = side < 0 ? L : Rv;
        const pulse = side < 0 ? s.bassPulse : 0;
        const n = 2 + (hash(1) * 3 | 0);
        for (let c = 0; c < n; c++) {
          const bx = side * (roadW / 2 + 0.9 + hash(c + 2) * 3.4);
          const wx = p.x + bx;
          const cf = coneAt(wx, p.z);
          const lit = clamp(0.08 + hand * 0.6 + pulse * 0.5 + cf * 0.85);
          const bh = (0.9 + hash(c + 7) * 2.8) * (1 + pulse * 0.15);
          const w2 = 0.4 + hash(c + 11) * 0.55;
          const d2 = w2 * 1.3;
          const hue = side < 0 ? (hash(c) < 0.5 ? 350 : 315) : (hash(c) < 0.5 ? 186 : 158);
          if (p.z > 58) {
            // FAR: flat dark cutout
            const [x0, y0] = prj(wx - w2, p.y, p.z);
            const [x1, y1] = prj(wx, p.y + bh, p.z);
            const [x2, y2] = prj(wx + w2, p.y, p.z);
            g.fillStyle = col(hue, 40, 4 + lit * 10, fz);
            g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
          } else {
            // MID/NEAR: two-tone prism — inner face takes the light, front stays dark
            const inX = wx - side * w2 * 0.75;      // toward the road (lit)
            const outX = wx + side * w2;            // away (dark)
            const [A0, A1] = prj(wx, p.y + bh, p.z + d2 * 0.35);
            const [I0, I1] = prj(inX, p.y, p.z);
            const [O0, O1] = prj(outX, p.y, p.z);
            const [B0, B1] = prj(wx + side * w2 * 0.2, p.y, p.z + d2);
            // back/inner face — lit
            g.fillStyle = col(hue, 72, 7 + lit * 46, fz);
            g.beginPath(); g.moveTo(A0, A1); g.lineTo(I0, I1); g.lineTo(B0, B1); g.closePath(); g.fill();
            // front face — near-black, occludes
            g.fillStyle = col(hue, 45, 4 + lit * 13, fz);
            g.beginPath(); g.moveTo(A0, A1); g.lineTo(I0, I1); g.lineTo(O0, O1); g.closePath(); g.fill();
            // rim on the lit edge, near tier only
            if (p.z < 15) {
              g.strokeStyle = col(hue, 85, 30 + lit * 45, fz);
              g.lineWidth = Math.max(0.7, 16 / p.z) * 0.5 * ms;
              g.beginPath(); g.moveTo(A0, A1); g.lineTo(I0, I1); g.stroke();
            }
          }
        }
      }
      // ribs — kept as ink (the illustration layer)
      if (ribHere) {
        const ribN = ((s.idx + i) / 3 | 0) % s.arpFlash.length;
        const flash = s.arpFlash[ribN];
        const rw = roadW * 1.4, rh = 5.4, steps = 9;
        for (const side of [-1, 1]) {
          const hand = side < 0 ? L : Rv;
          const cf = coneAt(p.x + side * rw * 0.5, p.z);
          const a = (0.05 + hand * 0.6 + flash * 0.7 + cf * 0.3) * fz;
          if (a < 0.015) continue;
          g.strokeStyle = flash > 0.35 ? `rgba(126,255,201,${a})` : `rgba(184,161,255,${a})`;
          g.lineWidth = Math.max(0.7, 24 / p.z) * (0.5 + flash * 0.5) * ms;
          g.beginPath();
          for (let k2 = 0; k2 <= steps; k2++) {
            const a0 = (k2 / steps) * (Math.PI / 2);
            const [sx2, sy2] = prj(p.x + side * Math.cos(a0) * rw, p.y + Math.sin(a0) * rh, p.z);
            k2 === 0 ? g.moveTo(sx2, sy2) : g.lineTo(sx2, sy2);
          }
          g.stroke();
        }
        if (s.leadPulse > 0.05) {
          const [ax, ay] = prj(p.x, p.y + rh, p.z);
          g.fillStyle = `rgba(255,79,216,${s.leadPulse * fz * 0.9})`;
          g.beginPath(); g.arc(ax, ay, Math.max(1, 12 / p.z) * ms, 0, TAU); g.fill();
        }
      }
    }
    // ---- THE MACHINE + RIDER — sport silhouette, separate subtle leans ----
    {
      const zB = 7.6;
      const [rx2, ry2] = roadXat(zB);
      const [bx, byRaw] = prj(rx2 + s.bank * 0.5, ry2, zB);
      const by = byRaw + Math.sin(s.bob * 2.1) * h * 0.003 * (s.speed / 30);
      const U = h * 0.0023;
      const kickG = s.kickPulse;
      g.save();
      g.translate(bx, by);
      g.rotate(-s.bank * 0.30); // the machine leans into the turn
      // ground shadow + cool underglow (subtle)
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.beginPath(); g.ellipse(0, 1.5 * U, 28 * U, 5 * U, 0, 0, TAU); g.fill();
      const ug = g.createRadialGradient(0, -2 * U, 2 * U, 0, -2 * U, 22 * U);
      ug.addColorStop(0, `rgba(107,232,240,${0.06 * E})`); ug.addColorStop(1, 'rgba(107,232,240,0)');
      g.fillStyle = ug; g.beginPath(); g.ellipse(0, -2 * U, 22 * U, 7 * U, 0, 0, TAU); g.fill();
      // faint tail-light streak on the wet road
      const tg2 = g.createLinearGradient(0, 0, 0, 20 * U);
      tg2.addColorStop(0, `rgba(255,90,110,${(0.10 + kickG * 0.10) * E})`); tg2.addColorStop(1, 'rgba(255,90,110,0)');
      g.fillStyle = tg2; g.fillRect(-3 * U, 0, 6 * U, 20 * U);
      // wheels — perfect circles (ellipse = yaw only), quiet rim highlight
      const wheel = (wx, wy, rr, sq, a2) => {
        g.fillStyle = '#04040a';
        g.beginPath(); g.ellipse(wx, wy, rr * sq, rr, 0, 0, TAU); g.fill();
        g.strokeStyle = `rgba(190,215,225,${a2})`;
        g.lineWidth = 1.1 * ms;
        g.beginPath(); g.ellipse(wx, wy, rr * 0.8 * sq, rr * 0.8, 0, 0, TAU); g.stroke();
        g.fillStyle = `rgba(140,160,175,${a2 * 0.5})`;
        g.beginPath(); g.ellipse(wx, wy, rr * 0.12 * sq, rr * 0.12, 0, 0, TAU); g.fill();
      };
      wheel(-8 * U, -12 * U, 11.5 * U, 0.46, 0.30 * E);  // rear
      wheel(11 * U, -13 * U, 8.5 * U, 0.36, 0.18 * E);   // front, ahead
      // body — sport fairing wedge: high tail, dipped seat, nose down to the front
      g.fillStyle = '#05050c';
      g.beginPath();
      g.moveTo(-12 * U, -21 * U);                                  // tail cowl tip
      g.bezierCurveTo(-9 * U, -24 * U, -5 * U, -23.5 * U, -2 * U, -21.5 * U); // seat dip
      g.bezierCurveTo(2 * U, -20 * U, 6 * U, -21.5 * U, 10 * U, -19.5 * U);   // tank → nose
      g.bezierCurveTo(14 * U, -18 * U, 15 * U, -15 * U, 13 * U, -13 * U);     // nose drop
      g.bezierCurveTo(8 * U, -10.5 * U, -2 * U, -10 * U, -7 * U, -12 * U);    // belly
      g.bezierCurveTo(-11 * U, -14 * U, -13 * U, -17.5 * U, -12 * U, -21 * U);
      g.closePath(); g.fill();
      // fairing accent line — one thin cool stroke along the flank
      g.strokeStyle = `rgba(107,232,240,${0.28 * E})`;
      g.lineWidth = 1 * ms;
      g.beginPath();
      g.moveTo(-11 * U, -19 * U);
      g.bezierCurveTo(-4 * U, -17 * U, 6 * U, -16.5 * U, 12.5 * U, -14.5 * U);
      g.stroke();
      // windscreen hint
      g.fillStyle = `rgba(140,200,220,${0.14 * E})`;
      g.beginPath();
      g.moveTo(8 * U, -20.5 * U); g.lineTo(12 * U, -18.5 * U); g.lineTo(10.5 * U, -16.5 * U); g.lineTo(7 * U, -19 * U);
      g.closePath(); g.fill();
      // headlight spill past the nose (source hidden, light visible)
      const hg = g.createRadialGradient(13 * U, -15 * U, U, 13 * U, -15 * U, 16 * U);
      hg.addColorStop(0, `rgba(210,240,255,${0.12 * E})`); hg.addColorStop(1, 'rgba(210,240,255,0)');
      g.fillStyle = hg; g.beginPath(); g.arc(13 * U, -15 * U, 16 * U, 0, TAU); g.fill();
      // tail LED — kick flare
      g.fillStyle = `rgba(255,90,110,${0.45 + kickG * 0.45})`;
      g.fillRect(-12.5 * U, -20.5 * U, 1.8 * U, 3.4 * U);
      // ---- THE RIDER — separate figure, its own subtle lean on top ----
      g.save();
      g.translate(-1 * U, -21 * U);          // pivot at the seat
      g.rotate(-s.bank * 0.14);              // subtle extra lean into the turn
      g.translate(1 * U, 21 * U);
      g.fillStyle = '#040409';
      // leg hugging the tank
      g.beginPath();
      g.moveTo(-4 * U, -12 * U);
      g.bezierCurveTo(-6 * U, -16 * U, -5 * U, -20 * U, -2 * U, -21.5 * U);
      g.bezierCurveTo(0, -19 * U, -0.5 * U, -14 * U, -1.5 * U, -11.5 * U);
      g.closePath(); g.fill();
      // torso — forward sport tuck
      g.beginPath();
      g.moveTo(-6 * U, -22 * U);
      g.bezierCurveTo(-4 * U, -30 * U, 3 * U, -32 * U, 8 * U, -27 * U);   // back arc
      g.bezierCurveTo(9.5 * U, -25 * U, 7 * U, -22.5 * U, 3 * U, -22 * U); // shoulders → arms
      g.bezierCurveTo(-1 * U, -21.5 * U, -4 * U, -21 * U, -6 * U, -22 * U);
      g.closePath(); g.fill();
      // arm to the bars
      g.strokeStyle = '#05050c'; g.lineWidth = 2.6 * ms; g.lineCap = 'round';
      g.beginPath(); g.moveTo(5 * U, -25 * U); g.lineTo(10 * U, -20.5 * U); g.stroke();
      g.lineCap = 'butt';
      // helmet
      g.fillStyle = '#04040a';
      g.beginPath(); g.ellipse(7.2 * U, -29 * U, 4 * U, 3.5 * U, -0.3, 0, TAU); g.fill();
      // rim light — one calm lavender stroke along back + helmet crown
      g.strokeStyle = `rgba(184,161,255,${0.5 * E})`;
      g.lineWidth = 1.2 * ms;
      g.beginPath();
      g.moveTo(-5 * U, -23 * U);
      g.bezierCurveTo(-3 * U, -30 * U, 3 * U, -31.5 * U, 7.5 * U, -27.5 * U);
      g.stroke();
      g.beginPath(); g.ellipse(7.2 * U, -29 * U, 4 * U, 3.5 * U, -0.3, -Math.PI * 0.85, -Math.PI * 0.2); g.stroke();
      g.restore(); // rider lean
      g.restore(); // machine lean
    }
    g.restore(); // un-roll
    // HUD
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText((s.sunA > 0.5 ? 'THE FLATS' : 'THE PASSAGE') + ' · ' + Math.round(s.speed * 6) + ' KM/H' + (s.pres < 0.3 ? ' · RESTING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v1 = PIECES.find(d => d.id === 'SRC-18');
    return v1 && v1.audio ? v1.audio(A, P) : null;
  }
});

/* ---------- SRC-18.5 · NIGHT CIRCUIT V5 (the four-act journey) ---------- */
reg({
  id: 'SRC-18.5', family: 'SRC-18', ver: 5,
  title: 'Night Circuit V5', tech: 'WEBGL / FOUR-ACT JOURNEY',
  music: { bpm: 84, root: 45, mode: 'aeolian', prog: [0, 5, 3, 6], chordBars: 4 },
  fx: {},
  tags: ['CAVE CITY TUNNEL SUNSET', 'ACT-AWARE MUSIC', 'TRUE 3D', 'DRUMS EARN THEIR ENTRANCE'],
  desc: 'The journey, in four acts on one endless road: it begins in a crystal cavern — dark, dripping-slow, mushrooms glowing at the walls, no drums, just a low minor pulse. You escape into the neon district: rain on the highway, lit towers, the striped sun behind the skyline, the beat arriving. Then the tunnel — walls close, light rings strobing past, double-time hats, the crescendo. And then out: palm silhouettes against a huge low sun, half-time, big and warm. Smoke-a-cig vibes. Then the road finds another cave mouth and the cycle turns again.',
  interact: 'Hands as ever: sides, steering, throttle. The journey only advances while someone rides — at rest it waits in the cavern, visible and silent. Throttle drives speed, reach, and how hard each act plays; the acts themselves change every ~40 seconds of riding, and the music arranges itself to the world: cave = beatless, city = groove, tunnel = full kit double-time, sunset = half-time weight.',
  sound: 'V5 has its own engine now — 84 BPM aeolian minor, voiced darker: sub-heavy bass, sparse minor arps that thicken by act, kick/clap gated by BOTH presence and act intensity, hats double-time only in the tunnel. Same rig roles and channels; bed/SFX lanes unchanged.',
  init(P) {
    P.state = {
      speed: 6, steer: 0, lane: 0, pres: 0, bob: 0, asleep: true,
      act: 0, actT: 0, trans: 0,
      kickPulse: 0, arpFlash: 0, arpIdx: 0, lastEvP: 0
    };
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setSize(P.w, P.h, false);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    if (THREE.sRGBEncoding !== undefined) r.outputEncoding = THREE.sRGBEncoding;
    T3.renderer = r;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x020107);
    sc.fog = new THREE.FogExp2(0x050310, 0.012);
    T3.scene = sc;
    const cam = new THREE.PerspectiveCamera(58, P.w / P.h, 0.1, 600);
    cam.position.set(1.05, 2.75, 0);
    T3.cam = cam;
    // lights: dim ambience + a REAL headlight that reveals the world
    const hemi = new THREE.HemisphereLight(0x4a3a6a, 0x030208, 0.3); sc.add(hemi); T3.hemi = hemi;
    const head = new THREE.PointLight(0xcfeaff, 2.4, 55, 1.7);
    head.position.set(0, 1.6, -18); sc.add(head); T3.head = head;
    const world = new THREE.Group(); sc.add(world); T3.world = world;
    const B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
    const L2 = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
    // seeded rand
    let seed = 1234567; const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    // ---- shared road ----
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 340), L2(0x0a0c14));
    road.rotation.x = -Math.PI / 2; road.position.z = -150; world.add(road);
    T3.edgeMats = [];
    for (const sx of [-4.5, 4.5]) {
      const em = B(0x2ec8da);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 340), em);
      edge.position.set(sx, 0.015, -150); world.add(edge); T3.edgeMats.push(em);
    }
    T3.dashes = [];
    const dashG = new THREE.BoxGeometry(0.16, 0.02, 1.7), dashM = B(0x59e6b8);
    for (let i = 0; i < 36; i++) {
      const d = new THREE.Mesh(dashG, dashM);
      d.position.set(0, 0.012, -i * 8 - 2);
      world.add(d); T3.dashes.push(d);
    }
    const mkTex = (drawFn, s2 = 256) => { const c = document.createElement('canvas'); c.width = c.height = s2; drawFn(c.getContext('2d'), s2); return new THREE.CanvasTexture(c); };
    // headlight pool sprite
    const poolT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 8, 128, 128, 126); gr.addColorStop(0, 'rgba(205,240,255,0.7)'); gr.addColorStop(1, 'rgba(205,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 16), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -22); world.add(pool); T3.pool = pool;
    // ---- ACT 0 · THE CAVERN ----
    const caveG = new THREE.Group(); world.add(caveG); T3.caveG = caveG;
    {
      const tube = new THREE.CylinderGeometry(9, 9, 360, 22, 64, true);
      const pos = tube.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const ang = Math.atan2(z, x);
        const n = Math.sin(ang * 3.1 + y * 0.11) * 0.5 + Math.sin(ang * 7.3 - y * 0.23) * 0.3 + Math.sin(y * 0.61 + ang) * 0.35;
        const k = 1 + n * 0.22;
        pos.setX(i, x * k); pos.setZ(i, z * k);
      }
      tube.computeVertexNormals();
      const cave = new THREE.Mesh(tube, L2(0x171030, { side: THREE.BackSide }));
      cave.rotation.x = Math.PI / 2; cave.position.set(0, 3.2, -150);
      caveG.add(cave);
      // crystals: mint country left, coral right — and glowing mushrooms
      T3.crystals = [];
      const cryG = new THREE.ConeGeometry(0.32, 1.7, 5);
      for (let i = 0; i < 34; i++) {
        const side = i % 2 ? 1 : -1;
        const col = side < 0 ? 0x7effc9 : 0xff8f7a;
        const m = B(col, { transparent: true, opacity: 0.85 });
        const g2 = new THREE.Group();
        const n2 = 2 + (rnd() * 3 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(cryG, m);
          const sc2 = 0.5 + rnd() * 1.3;
          cr.scale.set(sc2, sc2 * (0.8 + rnd() * 0.8), sc2);
          cr.position.set((rnd() - 0.5) * 1.6, sc2 * 0.7, (rnd() - 0.5) * 1.4);
          cr.rotation.z = (rnd() - 0.5) * 0.5;
          g2.add(cr);
        }
        g2.position.set(side * (5.3 + rnd() * 2.2), 0, -(i * 20 + rnd() * 9) - 6);
        caveG.add(g2);
        T3.crystals.push({ g: g2, m, side, base: 0.85 });
      }
      T3.shrooms = [];
      const stemG = new THREE.CylinderGeometry(0.06, 0.1, 0.5, 6);
      const capG = new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      for (let i = 0; i < 26; i++) {
        const side = rnd() < 0.5 ? -1 : 1;
        const g2 = new THREE.Group();
        const n2 = 2 + (rnd() * 4 | 0);
        const glow = rnd() < 0.5 ? 0xb8a1ff : 0x7effc9;
        for (let c2 = 0; c2 < n2; c2++) {
          const sc2 = 0.5 + rnd() * 1.1;
          const stem = new THREE.Mesh(stemG, L2(0x9a90b8));
          const cap = new THREE.Mesh(capG, L2(0x4a3866, { emissive: glow, emissiveIntensity: 0.9 }));
          stem.scale.setScalar(sc2); cap.scale.setScalar(sc2);
          const ox = (rnd() - 0.5) * 1.4, oz = (rnd() - 0.5) * 1.2;
          stem.position.set(ox, 0.25 * sc2, oz);
          cap.position.set(ox, 0.5 * sc2, oz);
          g2.add(stem); g2.add(cap);
        }
        g2.position.set(side * (5 + rnd() * 1.8), 0, -(i * 26 + rnd() * 12) - 12);
        caveG.add(g2);
        T3.shrooms.push(g2);
      }
    }
    // ---- ACT 1 · NEON DISTRICT ----
    const cityG = new THREE.Group(); world.add(cityG); T3.cityG = cityG;
    {
      const winT = [0x35e0ef, 0xff4fd8].map(col => mkTex((g, S2) => {
        g.fillStyle = '#05050c'; g.fillRect(0, 0, S2, S2);
        const c2 = '#' + col.toString(16).padStart(6, '0');
        for (let y = 8; y < S2 - 8; y += 18) for (let x = 8; x < S2 - 8; x += 14) {
          if (Math.random() < 0.55) { g.fillStyle = Math.random() < 0.85 ? c2 : '#ffd28a'; g.globalAlpha = 0.35 + Math.random() * 0.65; g.fillRect(x, y, 8, 10); }
        }
        g.globalAlpha = 1;
      }, 128));
      T3.towers = [];
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        const h2 = 10 + rnd() * 26, w2 = 4 + rnd() * 6;
        const tex = winT[(rnd() * 2) | 0];
        const bld = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, w2),
          new THREE.MeshBasicMaterial({ map: tex, color: 0x8899aa }));
        bld.position.set(side * (11 + rnd() * 22), h2 / 2 - 0.1, -(i * 26 + rnd() * 14) - 10);
        cityG.add(bld); T3.towers.push(bld);
      }
      // rain
      const rn = 500, rpos = new Float32Array(rn * 3);
      for (let i = 0; i < rn; i++) { rpos[i * 3] = (rnd() - 0.5) * 60; rpos[i * 3 + 1] = rnd() * 30; rpos[i * 3 + 2] = -rnd() * 120; }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
      const rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0x9fc8e8, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
      cityG.add(rain); T3.rain = rain;
    }
    // ---- ACT 2 · THE TUNNEL ----
    const tunG = new THREE.Group(); world.add(tunG); T3.tunG = tunG;
    {
      const tube = new THREE.CylinderGeometry(4.7, 4.7, 360, 18, 1, true);
      const tun = new THREE.Mesh(tube, L2(0x0d1220, { side: THREE.BackSide }));
      tun.rotation.x = Math.PI / 2; tun.position.set(0, 2.4, -150);
      tunG.add(tun);
      T3.rings = [];
      const ringG = new THREE.TorusGeometry(4.5, 0.09, 8, 40);
      for (let i = 0; i < 26; i++) {
        const m = B(0x49c8f2, { transparent: true, opacity: 0.9 });
        const ring = new THREE.Mesh(ringG, m);
        ring.position.set(0, 2.4, -i * 14 - 4);
        tunG.add(ring); T3.rings.push({ ring, m });
      }
      // small orange wall panels
      const panG = new THREE.BoxGeometry(0.7, 0.3, 0.06);
      T3.pans = [];
      for (let i = 0; i < 20; i++) {
        const side = i % 2 ? 1 : -1;
        const pan = new THREE.Mesh(panG, B(0xff8a50));
        pan.position.set(side * 4.3, 1.4, -i * 17 - 9);
        pan.rotation.y = side * Math.PI / 2;
        tunG.add(pan); T3.pans.push(pan);
      }
    }
    // ---- ACT 3 · PALM SUNSET ----
    const sunsetG = new THREE.Group(); world.add(sunsetG); T3.sunsetG = sunsetG;
    {
      const palmT = mkTex((g, S2) => {
        g.clearRect(0, 0, S2, S2);
        g.strokeStyle = '#1a1030'; g.fillStyle = '#1a1030';
        g.lineWidth = 7;
        g.beginPath(); g.moveTo(S2 * 0.5, S2); g.quadraticCurveTo(S2 * 0.58, S2 * 0.55, S2 * 0.52, S2 * 0.3); g.stroke();
        g.lineWidth = 5;
        for (let i = 0; i < 7; i++) {
          const a2 = -Math.PI * 0.9 + i * 0.28;
          g.beginPath(); g.moveTo(S2 * 0.52, S2 * 0.3);
          g.quadraticCurveTo(S2 * 0.52 + Math.cos(a2) * 40, S2 * 0.3 + Math.sin(a2) * 40 - 14, S2 * 0.52 + Math.cos(a2) * 78, S2 * 0.3 + Math.sin(a2) * 78 + 16);
          g.stroke();
        }
      });
      T3.palms = [];
      for (let i = 0; i < 18; i++) {
        const side = i % 2 ? 1 : -1;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: palmT, transparent: true }));
        const h2 = 9 + rnd() * 6;
        sp.scale.set(h2, h2, 1);
        sp.position.set(side * (7.5 + rnd() * 6), h2 * 0.45, -(i * 24 + rnd() * 10) - 8);
        sunsetG.add(sp); T3.palms.push(sp);
      }
    }
    // ---- scenography: sun, halo, ridge, stars ----
    const sunT = mkTex((g, S2) => {
      const gr = g.createLinearGradient(0, 40, 0, 216);
      gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(0.55, '#ffb46e'); gr.addColorStop(1, '#ff7e6b');
      g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 88, 0, 6.284); g.fill();
      g.fillStyle = '#020107';
      for (let i = 0; i < 5; i++) g.fillRect(40, 138 + i * 14, 176, 2.5 + i * 1.6);
    });
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunT, fog: false, transparent: true }));
    sun.scale.set(64, 64, 1); sun.position.set(20, 12, -300); sc.add(sun); T3.sun = sun;
    const haloT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, 'rgba(255,170,110,0.55)'); gr.addColorStop(1, 'rgba(255,140,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, fog: false, transparent: true, blending: THREE.AdditiveBlending }));
    halo.scale.set(150, 150, 1); halo.position.copy(sun.position); halo.position.z -= 1; sc.add(halo); T3.halo = halo;
    {
      const pos2 = [];
      const N2 = 70, W2 = 700;
      for (let i = 0; i < N2; i++) {
        const x0 = -W2 / 2 + (i / (N2 - 1)) * W2, x1 = -W2 / 2 + ((i + 1) / (N2 - 1)) * W2;
        const h0 = 4 + rnd() * 14, h1 = 4 + rnd() * 14;
        pos2.push(x0, 0, 0, x1, 0, 0, x0, h0, 0, x1, 0, 0, x1, h1, 0, x0, h0, 0);
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos2), 3));
      const ridge = new THREE.Mesh(gg, B(0x0b0616, { fog: false }));
      ridge.position.set(0, 0, -290); sc.add(ridge); T3.ridge = ridge;
    }
    {
      const n2 = 220, pos2 = new Float32Array(n2 * 3);
      for (let i = 0; i < n2; i++) { pos2[i * 3] = (rnd() - 0.5) * 800; pos2[i * 3 + 1] = 20 + rnd() * 200; pos2[i * 3 + 2] = -250 - rnd() * 200; }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
      const st = new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xaab4ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false }));
      sc.add(st); T3.stars = st;
    }
    // ---- machine + rider (V5 primitives — hero models drop in when they arrive) ----
    const bike = new THREE.Group(); sc.add(bike); T3.bike = bike;
    bike.position.set(0, 0, -13);
    const dark = 0x11141f, darker = 0x0a0c13, accent = 0x3fd9e8;
    const wheel = (z2, rad) => {
      const w2 = new THREE.Group();
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad, rad * 0.26, 12, 36), B(0x07080d)));
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.035, 8, 32), B(0x232b3d)));
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.016, 8, 32), B(accent, { transparent: true, opacity: 0.55 })));
      w2.position.set(0, rad * 1.26, z2); bike.add(w2); return w2;
    };
    T3.placeholder = [wheel(1.05, 0.58), wheel(-1.15, 0.5)];
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.7, 6, 12), L2(dark));
    body.rotation.x = Math.PI / 2; body.position.set(0, 0.86, -0.1); bike.add(body);
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), L2(0x171b29));
    tank.scale.set(1, 0.72, 1.5); tank.position.set(0, 1.06, 0.32); bike.add(tank);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 10), L2(darker));
    nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.92, -1.35); bike.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.9, 8), L2(darker));
    tail.rotation.x = Math.PI / 2; tail.position.set(0, 1.05, 1.35); bike.add(tail);
    T3.placeholder.push(body, tank, nose, tail);
    for (const sx of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 2.4), B(accent, { transparent: true, opacity: 0.8 }));
      strip.position.set(sx * 0.33, 0.9, 0); bike.add(strip); T3.placeholder.push(strip);
    }
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.05), B(0xff4560));
    tailL.position.set(0, 1.14, 1.62); bike.add(tailL); T3.tailL = tailL;
    bike.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), B(0xdff6ff))).position.set(0, 0.95, -1.8);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 11, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = Math.PI / 2; cone.position.set(0, 0.9, -7.2); bike.add(cone);
    const rider = new THREE.Group(); bike.add(rider); T3.rider = rider;
    rider.position.set(0, 1.15, 0.55);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 6, 10), L2(0x0b0d15));
    torso.rotation.x = 1.05; torso.position.set(0, 0.32, -0.1); rider.add(torso);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), L2(0x0d0f1a));
    helmet.position.set(0, 0.62, -0.42); rider.add(helmet);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.02), B(0x9f8cff, { transparent: true, opacity: 0.85 }));
    visor.position.set(0, 0.62, -0.6); rider.add(visor);
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 4, 8), L2(0x0a0c12));
    legL.rotation.z = 0.5; legL.rotation.x = 0.4; legL.position.set(-0.3, -0.05, 0.1); rider.add(legL);
    const legR = legL.clone(); legR.rotation.z = -0.5; legR.position.x = 0.3; rider.add(legR);
    // ---- HERO ASSETS (CC-BY: Akira Motorcycle by s.navajon; palms via Sketchfab) ----
    if (typeof THREE.GLTFLoader === 'function') {
      const loader = new THREE.GLTFLoader();
      loader.load('models/akira_motorcycle.glb', gl2 => {
        try {
          const m = gl2.scene;
          const bb = new THREE.Box3().setFromObject(m);
          const size = bb.getSize(new THREE.Vector3());
          let f = 3.4 / Math.max(size.x, size.y, size.z, 0.001);
          if (!isFinite(f) || f <= 0) f = 1;
          m.scale.multiplyScalar(f); // multiply — respect the export's own baked scale
          const bb2 = new THREE.Box3().setFromObject(m);
          const c2 = bb2.getCenter(new THREE.Vector3());
          m.position.set(-c2.x, -bb2.min.y, -c2.z);
          m.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: 0x151a2c }); });
          T3.placeholder.forEach(p2 => p2.visible = false);
          T3.bike.add(m); T3.bikeModel = m;
          const topY = bb2.max.y - bb2.min.y;
          T3.rider.position.set(0, topY * 0.8, 0.5);
          T3.tailL.position.set(0, topY * 0.6, 1.68);
        } catch (e) {}
      });
      loader.load('models/palm_trees.glb', gl2 => {
        try {
          const src2 = gl2.scene;
          const bb = new THREE.Box3().setFromObject(src2);
          const size = bb.getSize(new THREE.Vector3());
          let sc2 = 11 / Math.max(size.y, 0.001);
          if (!isFinite(sc2) || sc2 <= 0) sc2 = 1;
          src2.traverse(o => {
            if (o.isMesh && o.material) {
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => {
                if (mm.color) mm.color.setRGB(0.17, 0.12, 0.3);
              });
            }
          });
          T3.palms.forEach(sp => sp.visible = false);
          T3.palmModels = [];
          for (let i = 0; i < 8; i++) {
            const cl = src2.clone();
            cl.scale.multiplyScalar(sc2 * (0.75 + ((i * 37) % 11) / 11 * 0.5));
            const side = i % 2 ? 1 : -1;
            cl.position.set(side * (9.5 + ((i * 13) % 7)), 0, -(i * 46) - 12);
            cl.rotation.y = (i * 1.7) % 6.28;
            T3.sunsetG.add(cl);
            T3.palmModels.push(cl);
          }
        } catch (e) {}
      });
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.2);
    if (s.pres < 0.22) s.asleep = true;
    if (s.asleep && s.pres > 0.5) {
      s.asleep = false;
      P.ping(A => {
        if (typeof MOut !== 'undefined') MOut.sfxNote(36, 0.85, 3);
        A.hit({ vol: 0.22, dur: 0.7, freq: 85, q: 0.6, at: 0 });
      });
    }
    const thr = clamp((inp.L + inp.R) / 2);
    // the journey advances only while someone rides
    const ACT_LEN = [42, 38, 26, 42];
    if (s.pres > 0.45) {
      s.actT += dt;
      if (s.actT > ACT_LEN[s.act]) { s.actT = 0; s.act = (s.act + 1) % 4; s.trans = 1; }
    }
    s.trans = Math.max(0, s.trans - dt * 0.55);
    const tunnel = s.act === 2;
    const spdMax = tunnel ? 46 : s.act === 3 ? 26 : 34;
    s.speed += ((5 + Math.pow(thr, 1.25) * spdMax) - s.speed) * Math.min(1, dt * 1.4);
    const steerIn = clamp(inp.R - inp.L, -1, 1);
    s.steer += (steerIn - s.steer) * Math.min(1, dt * 1.6);
    s.lane += (s.steer * (tunnel ? 1.6 : 2.6) - s.lane) * Math.min(1, dt * 1.4);
    s.bob += dt * (2 + s.speed * 0.3);
    s.kickPulse = Math.max(0, s.kickPulse - dt * 5);
    s.arpFlash = Math.max(0, s.arpFlash - dt * 5);
    if (P.focused && typeof MOut !== 'undefined') {
      const now = performance.now();
      for (let i = MOut.log.length - 1; i >= 0; i--) {
        const ev = MOut.log[i];
        if (ev.p <= s.lastEvP) break;
        if (ev.p > now) continue;
        if (ev.role === 'perc') s.kickPulse = 1;
        else if (ev.role === 'arp') { s.arpFlash = 1; s.arpIdx++; }
      }
      s.lastEvP = now;
    }
    if (s.noGL || !P._three) return;
    const T3 = P._three, E = 0.55 + s.pres * 0.45;
    const dz = s.speed * dt;
    const act = s.act;
    // act visibilities
    T3.caveG.visible = act === 0; T3.cityG.visible = act === 1;
    T3.tunG.visible = act === 2; T3.sunsetG.visible = act === 3;
    T3.stars.visible = act !== 2 && act !== 0;
    T3.ridge.visible = act === 1 || act === 3;
    // scroll + recycle
    for (const d of T3.dashes) { d.position.z += dz; if (d.position.z > 2) d.position.z -= 288; }
    const recyc = (obj, span) => { obj.position.z += dz; if (obj.position.z > 4) obj.position.z -= span; };
    if (act === 0) {
      for (const c of T3.crystals) {
        recyc(c.g, 680);
        const hand = c.side < 0 ? inp.L : inp.R;
        c.m.opacity = 0.35 + hand * 0.5 + s.arpFlash * 0.2;
      }
      for (const m of T3.shrooms) recyc(m, 690);
    } else if (act === 1) {
      for (const b of T3.towers) recyc(b, 700);
      const rp = T3.rain.geometry.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        let y = rp.getY(i) - dt * 26, z = rp.getZ(i) + dz;
        if (y < 0) y = 28; if (z > 2) z -= 120;
        rp.setY(i, y); rp.setZ(i, z);
      }
      rp.needsUpdate = true;
    } else if (act === 2) {
      for (const r2 of T3.rings) {
        recyc(r2.ring, 364);
        r2.m.opacity = 0.55 + s.kickPulse * 0.45;
      }
      for (const p2 of T3.pans) recyc(p2, 340);
    } else {
      for (const p2 of (T3.palmModels || T3.palms)) recyc(p2, T3.palmModels ? 380 : 430);
    }
    // sun per act
    const sunVis = act === 1 ? 0.85 : act === 3 ? 1 : 0;
    T3.sun.material.opacity += (sunVis - T3.sun.material.opacity) * Math.min(1, dt * 1.5);
    T3.halo.material.opacity = T3.sun.material.opacity * 0.8 + s.kickPulse * 0.08;
    if (act === 3) { T3.sun.position.set(0, 9, -300); T3.sun.scale.set(95, 95, 1); T3.halo.scale.set(220, 220, 1); }
    else { T3.sun.position.set(20, 12, -300); T3.sun.scale.set(64, 64, 1); T3.halo.scale.set(150, 150, 1); }
    T3.halo.position.copy(T3.sun.position); T3.halo.position.z -= 1;
    // atmosphere per act (+ transition fog swell that masks the swap)
    const fogA = [0.028, 0.0115, 0.017, 0.009][act];
    T3.hemi.intensity = [0.13, 0.3, 0.22, 0.34][act];
    T3.scene.fog.density = fogA - thr * 0.003 + s.trans * 0.03;
    const fogCol = [0x050210, 0x0a0714, 0x060a16, 0x140a18][act];
    T3.scene.fog.color.setHex(fogCol);
    T3.scene.background.setHex([0x030110, 0x020107, 0x02040a, 0x0a0410][act]);
    T3.renderer.toneMappingExposure = (0.68 + E * 0.5 + s.kickPulse * 0.05) * [0.8, 1, 1.02, 1.18][act];
    // road accents per act
    const edgeCol = [0x6a5aa8, 0x2ec8da, 0x49c8f2, 0xff9a6b][act];
    for (const em of T3.edgeMats) em.color.setHex(edgeCol);
    T3.pool.material.opacity = 0.4 + s.kickPulse * 0.35 + thr * 0.2 + (act === 1 ? 0.15 : 0);
    // headlight strongest in cave/tunnel where it has walls to reveal
    T3.head.intensity = (act === 0 || act === 2) ? 3.2 : 1.5;
    T3.head.position.set(-s.lane, 1.6, -20);
    // steering / lean / camera
    T3.world.rotation.y = s.steer * 0.105;
    T3.world.position.x = -s.lane;
    T3.bike.rotation.z = -s.steer * 0.34;
    T3.rider.rotation.z = -s.steer * 0.16;
    T3.bike.position.y = Math.sin(s.bob * 2.1) * 0.02 * (s.speed / 40);
    T3.cam.rotation.z = s.steer * 0.04;
    T3.cam.rotation.y = 0.06; T3.cam.rotation.x = -0.045;
    T3.cam.position.x = 1.05 + s.steer * 0.35;
    T3.cam.position.y = 2.75 + Math.sin(s.bob) * 0.015 * (s.speed / 40);
    T3.cam.fov = 58 + (tunnel ? thr * 8 : 0);
    T3.cam.updateProjectionMatrix();
    T3.tailL.scale.setScalar(1 + s.kickPulse * 0.8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('NIGHT CIRCUIT V5 · THE JOURNEY', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ACTS = ['THE CAVERN', 'NEON DISTRICT', 'THE TUNNEL', 'PALM SUNSET'];
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * Math.max(1, Math.sqrt(areaScale(P))))}px ui-monospace,monospace`;
    g.fillText(ACTS[P.state.act] + ' · ' + Math.round(s.speed * 6) + ' KM/H' + (s.pres < 0.3 ? ' · WAITING IN THE DARK' : ''), 10, h - 10);
  },
  audio(A, P) {
    // V5's own engine: 84 BPM minor, drums EARN their entrance by act
    const v = A.voice();
    const surf = v.filter('lowpass', 1000, 0.9);
    surf.connect(v.group);
    const mkBus = gain => { const gg = v.g(gain); gg.connect(surf); return gg; };
    const arpBus = mkBus(1), bassBus = mkBus(1);
    if (A.delIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.55; arpBus.connect(s2); s2.connect(A.delIn); }
    if (A.revIn) { const s3 = A.ctx.createGain(); s3.gain.value = 0.35; arpBus.connect(s3); s3.connect(A.revIn); }
    let nextT = T.next(0.25), step16 = 0;
    const schedTone = (bus, freq, t0, vol, dur, type) => {
      const o = A.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const gg = A.ctx.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg); gg.connect(bus);
      o.start(t0); o.stop(t0 + dur + 0.05);
    };
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        const s = P.state;
        const lift = clamp((inp.L + inp.R) / 2);
        const act = s.act || 0;
        const inten = [0.12, 0.55, 1.0, 0.4][act] * (0.25 + lift * 0.75);
        A.set(surf.frequency, 260 + Math.pow(lift, 1.4) * (act === 2 ? 7500 : 5200), 0.2);
        MOut.expr('arp', lift); MOut.expr('bass', lift);
        const horizon = AE.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          // drums: silent in the cave, groove in the city, full double-time in the tunnel,
          // heavy half-time at the sunset
          if (act >= 1 && lift > 0.1) {
            const kickPat = act === 3 ? (st === 0 || st === 10) : (st % 4 === 0);
            if (kickPat && inten > 0.25) A.kick(tt, 0.3);
            const snarePos = act === 3 ? st === 8 : st % 8 === 4;
            if (snarePos && inten > 0.4) {
              MOut.evDrum(38, 0.24, tt);
              A.hit({ vol: 0.16, dur: 0.16, freq: 1700, q: 0.8, at: tt });
              A.tone(170, { at: tt, vol: 0.06, dur: 0.1, type: 'triangle', rev: 0.3 });
            }
            const hatEvery = act === 2 ? 1 : 2;
            if (st % hatEvery === (hatEvery === 1 ? 0 : 1) && inten > 0.3) A.hat(tt, { vol: 0.022 + lift * 0.028, open: act === 2 && st === 14 });
          }
          // bass: cave = long dark roots; elsewhere driving 8ths
          if (act === 0) {
            if (st === 0 && lift > 0.04) {
              const bf = H.rootFreq(-2);
              MOut.evNote('bass', bf, 0.15, tt, 1.6);
              schedTone(bassBus, bf, tt, 0.15, 1.7, 'sine');
              schedTone(bassBus, bf * 0.5, tt, 0.1, 1.9, 'sine');
            }
          } else if (lift > 0.06 && st % 2 === 0) {
            const oct = st % 4 === 0 ? -2 : -1;
            const bf = H.rootFreq(oct);
            const bv = st % 2 === 0 ? 0.15 : 0.1;
            MOut.evNote('bass', bf, bv, tt, 0.22);
            schedTone(bassBus, bf, tt, bv, 0.22, 'sawtooth');
          }
          // arp: cave sparse minor bells → city 8ths → tunnel 16ths → sunset warm 8ths
          const arpStep = act === 0 ? 4 : act === 2 ? 1 : 2;
          if (lift > 0.04 && st % arpStep === 0) {
            const pat = [0, 3, 2, 4, 1, 3, 2, 5][(step16 / arpStep | 0) % 8];
            const f = H.chordTone(pat, act === 2 && lift > 0.6 ? 1 : 0);
            const vol2 = (act === 0 ? 0.045 : 0.05 + lift * 0.03);
            MOut.evNote('arp', f, vol2, tt, act === 0 ? 0.5 : 0.16);
            schedTone(arpBus, f, tt, vol2, act === 0 ? 0.6 : 0.17, act === 0 ? 'triangle' : 'square');
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < AE.t()) nextT = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-18.6 · NIGHT CIRCUIT V6 (the journey, polished) ---------- */
reg({
  id: 'SRC-18.6', family: 'SRC-18', ver: 6,
  title: 'Night Circuit V6', tech: 'WEBGL / FOUR-ACT JOURNEY / FUNK',
  music: { bpm: 84, root: 45, mode: 'aeolian', prog: [0, 5, 3, 6], chordBars: 4 },
  fx: {},
  tags: ['CAVE CITY TUNNEL SUNSET', 'ACT-AWARE MUSIC', 'TRUE 3D', 'DRUMS EARN THEIR ENTRANCE'],
  desc: 'The journey, in four acts on one endless road: it begins in a crystal cavern — dark, dripping-slow, mushrooms glowing at the walls, no drums, just a low minor pulse. You escape into the neon district: rain on the highway, lit towers, the striped sun behind the skyline, the beat arriving. Then the tunnel — walls close, light rings strobing past, double-time hats, the crescendo. And then out: palm silhouettes against a huge low sun, half-time, big and warm. Smoke-a-cig vibes. Then the road finds another cave mouth and the cycle turns again.',
  interact: 'Hands as ever: sides, steering, throttle. The journey only advances while someone rides — at rest it waits in the cavern, visible and silent. Throttle drives speed, reach, and how hard each act plays; the acts themselves change every ~40 seconds of riding, and the music arranges itself to the world: cave = beatless, city = groove, tunnel = full kit double-time, sunset = half-time weight.',
  sound: 'V5 has its own engine now — 84 BPM aeolian minor, voiced darker: sub-heavy bass, sparse minor arps that thicken by act, kick/clap gated by BOTH presence and act intensity, hats double-time only in the tunnel. Same rig roles and channels; bed/SFX lanes unchanged.',
  init(P) {
    P.state = {
      speed: 6, steer: 0, lane: 0, pres: 0, bob: 0, asleep: true,
      act: 0, actT: 0, trans: 0,
      kickPulse: 0, arpFlash: 0, arpIdx: 0, lastEvP: 0
    };
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setSize(P.w, P.h, false);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    if (THREE.sRGBEncoding !== undefined) r.outputEncoding = THREE.sRGBEncoding;
    T3.renderer = r;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x020107);
    sc.fog = new THREE.FogExp2(0x050310, 0.012);
    T3.scene = sc;
    const cam = new THREE.PerspectiveCamera(58, P.w / P.h, 0.1, 600);
    cam.position.set(1.05, 3.15, 0);
    T3.cam = cam;
    // lights: dim ambience + a REAL headlight that reveals the world
    const hemi = new THREE.HemisphereLight(0x4a3a6a, 0x030208, 0.3); sc.add(hemi); T3.hemi = hemi;
    const head = new THREE.PointLight(0xcfeaff, 2.4, 55, 1.7);
    head.position.set(0, 1.6, -18); sc.add(head); T3.head = head;
    const world = new THREE.Group(); sc.add(world); T3.world = world;
    const B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
    const L2 = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
    // seeded rand
    let seed = 1234567; const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    // ---- shared road ----
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 340), L2(0x0a0c14));
    road.rotation.x = -Math.PI / 2; road.position.z = -150; world.add(road);
    // the world has a FLOOR — a huge dark ground plane so nothing shows through
    // beneath the horizon (sun, towers) in the open acts
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), L2(0x05060d));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.06, -250); world.add(ground);
    T3.ground = ground;
    T3.edgeMats = [];
    for (const sx of [-4.5, 4.5]) {
      const em = B(0x2ec8da);
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 340), em);
      edge.position.set(sx, 0.015, -150); world.add(edge); T3.edgeMats.push(em);
    }
    T3.dashes = [];
    const dashG = new THREE.BoxGeometry(0.16, 0.02, 1.7), dashM = B(0x59e6b8);
    for (let i = 0; i < 36; i++) {
      const d = new THREE.Mesh(dashG, dashM);
      d.position.set(0, 0.012, -i * 8 - 2);
      world.add(d); T3.dashes.push(d);
    }
    const mkTex = (drawFn, s2 = 256) => { const c = document.createElement('canvas'); c.width = c.height = s2; drawFn(c.getContext('2d'), s2); return new THREE.CanvasTexture(c); };
    // headlight pool sprite
    const poolT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 8, 128, 128, 126); gr.addColorStop(0, 'rgba(205,240,255,0.7)'); gr.addColorStop(1, 'rgba(205,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 16), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -22); world.add(pool); T3.pool = pool;
    // ---- ACT 0 · THE CAVERN ----
    const caveG = new THREE.Group(); world.add(caveG); T3.caveG = caveG;
    // soft radial glow sprite — reused for crystals, mushrooms, underglow
    const glowT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 6, 128, 128, 126); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }, 128);
    const mkGlow = (col, sc2) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 })); sp.scale.set(sc2, sc2, 1); return sp; };
    T3.mkGlow = mkGlow;
    {
      // the cave surface RIDES WITH THE ROAD now — two leapfrogging low-poly
      // tube segments so the rock visibly streams past instead of sitting still
      const mkCaveTube = (zoff) => {
        const tube = new THREE.CylinderGeometry(9, 9, 240, 18, 30, true);
        const pos = tube.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const ang = Math.atan2(z, x);
          const n = Math.sin(ang * 3.1 + y * 0.11) * 0.5 + Math.sin(ang * 7.3 - y * 0.23) * 0.3 + Math.sin(y * 0.61 + ang) * 0.35;
          const k = 1 + n * 0.26;
          pos.setX(i, x * k); pos.setZ(i, z * k);
        }
        tube.computeVertexNormals();
        const grp = new THREE.Group();
        // faceted rock — flat shading sells the polygonal read
        const rock = new THREE.Mesh(tube, new THREE.MeshLambertMaterial({ color: 0x171030, side: THREE.BackSide, flatShading: true }));
        grp.add(rock);
        // glowing wireframe edges over the rock — the vibe layer
        const wire = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x6a4fd8, wireframe: true, transparent: true, opacity: 0.14, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        grp.add(wire); grp.userData.wireMat = wire.material;
        grp.rotation.x = Math.PI / 2; grp.position.set(0, 3.2, zoff);
        caveG.add(grp); return grp;
      };
      T3.caveTubes = [mkCaveTube(-100), mkCaveTube(-340)];
      // crystal shards: faceted elongated octahedra leaning off the walls, each
      // cluster wearing an additive halo — mint country left, coral right
      T3.crystals = [];
      const cryG = new THREE.OctahedronGeometry(0.42, 0);
      for (let i = 0; i < 30; i++) {
        const side = i % 2 ? 1 : -1;
        const col = side < 0 ? 0x7effc9 : 0xff8f7a;
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
        const g2 = new THREE.Group();
        const n2 = 3 + (rnd() * 3 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(cryG, m);
          const sc2 = 0.45 + rnd() * 1.15;
          cr.scale.set(sc2 * 0.6, sc2 * (1.8 + rnd() * 1.6), sc2 * 0.6);
          cr.position.set((rnd() - 0.5) * 1.7, sc2 * 0.9, (rnd() - 0.5) * 1.5);
          cr.rotation.z = -side * (0.25 + rnd() * 0.5); // lean away from the wall, over the road
          cr.rotation.y = rnd() * 6.28;
          g2.add(cr);
        }
        const halo = mkGlow(col, 3.2 + rnd() * 2); halo.position.y = 1.2; g2.add(halo);
        g2.position.set(side * (5.4 + rnd() * 2.0), 0, -(i * 22 + rnd() * 9) - 6);
        caveG.add(g2);
        T3.crystals.push({ g: g2, m, halo, side, base: 0.85 });
      }
      // glowing mushrooms — bigger, brighter, halos under the caps
      T3.shrooms = [];
      const stemG = new THREE.CylinderGeometry(0.07, 0.13, 0.6, 5);
      const capG = new THREE.SphereGeometry(0.36, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2);
      for (let i = 0; i < 26; i++) {
        const side = rnd() < 0.5 ? -1 : 1;
        const g2 = new THREE.Group();
        const n2 = 2 + (rnd() * 4 | 0);
        const glow = rnd() < 0.5 ? 0xb8a1ff : 0x7effc9;
        for (let c2 = 0; c2 < n2; c2++) {
          const sc2 = 0.7 + rnd() * 1.6;
          const stem = new THREE.Mesh(stemG, L2(0x9a90b8));
          const cap = new THREE.Mesh(capG, new THREE.MeshLambertMaterial({ color: 0x4a3866, emissive: glow, emissiveIntensity: 1.4, flatShading: true }));
          stem.scale.setScalar(sc2); cap.scale.setScalar(sc2);
          const ox = (rnd() - 0.5) * 1.6, oz = (rnd() - 0.5) * 1.4;
          stem.position.set(ox, 0.3 * sc2, oz);
          cap.position.set(ox, 0.6 * sc2, oz);
          g2.add(stem); g2.add(cap);
          const hg = mkGlow(glow, 1.6 * sc2); hg.position.set(ox, 0.65 * sc2, oz); g2.add(hg);
        }
        g2.position.set(side * (5 + rnd() * 1.8), 0, -(i * 26 + rnd() * 12) - 12);
        caveG.add(g2);
        T3.shrooms.push(g2);
      }
      // drips — thin falling streaks from the ceiling, catch the headlight
      const dn = 42, dpos = new Float32Array(dn * 3), dvel = new Float32Array(dn);
      for (let i = 0; i < dn; i++) {
        dpos[i * 3] = (rnd() - 0.5) * 12;
        dpos[i * 3 + 1] = 1 + rnd() * 8;
        dpos[i * 3 + 2] = -rnd() * 120;
        dvel[i] = 5 + rnd() * 5;
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
      const drips = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xbfe0ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.65 }));
      caveG.add(drips); T3.drips = drips; T3.dripVel = dvel;
    }
    // ---- ACT 1 · NEON DISTRICT ----
    const cityG = new THREE.Group(); world.add(cityG); T3.cityG = cityG;
    {
      const winT = [0x35e0ef, 0xff4fd8].map(col => mkTex((g, S2) => {
        g.fillStyle = '#05050c'; g.fillRect(0, 0, S2, S2);
        const c2 = '#' + col.toString(16).padStart(6, '0');
        for (let y = 8; y < S2 - 8; y += 18) for (let x = 8; x < S2 - 8; x += 14) {
          if (Math.random() < 0.55) { g.fillStyle = Math.random() < 0.85 ? c2 : '#ffd28a'; g.globalAlpha = 0.35 + Math.random() * 0.65; g.fillRect(x, y, 8, 10); }
        }
        g.globalAlpha = 1;
      }, 128));
      T3.towers = [];
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        const h2 = 10 + rnd() * 26, w2 = 4 + rnd() * 6;
        const tex = winT[(rnd() * 2) | 0];
        const bld = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, w2),
          new THREE.MeshBasicMaterial({ map: tex, color: 0x8899aa }));
        bld.position.set(side * (11 + rnd() * 22), h2 / 2 - 0.1, -(i * 26 + rnd() * 14) - 10);
        cityG.add(bld); T3.towers.push(bld);
      }
      // rain
      const rn = 500, rpos = new Float32Array(rn * 3);
      for (let i = 0; i < rn; i++) { rpos[i * 3] = (rnd() - 0.5) * 60; rpos[i * 3 + 1] = rnd() * 30; rpos[i * 3 + 2] = -rnd() * 120; }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
      const rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0x9fc8e8, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
      cityG.add(rain); T3.rain = rain;
    }
    // ---- ACT 2 · THE TUNNEL ----
    const tunG = new THREE.Group(); world.add(tunG); T3.tunG = tunG;
    {
      const tube = new THREE.CylinderGeometry(4.7, 4.7, 360, 18, 1, true);
      const tun = new THREE.Mesh(tube, L2(0x0d1220, { side: THREE.BackSide }));
      tun.rotation.x = Math.PI / 2; tun.position.set(0, 2.4, -150);
      tunG.add(tun);
      T3.rings = [];
      const ringG = new THREE.TorusGeometry(4.5, 0.09, 8, 40);
      for (let i = 0; i < 26; i++) {
        const m = B(0x49c8f2, { transparent: true, opacity: 0.9 });
        const ring = new THREE.Mesh(ringG, m);
        ring.position.set(0, 2.4, -i * 14 - 4);
        tunG.add(ring); T3.rings.push({ ring, m });
      }
      // small orange wall panels
      const panG = new THREE.BoxGeometry(0.7, 0.3, 0.06);
      T3.pans = [];
      for (let i = 0; i < 20; i++) {
        const side = i % 2 ? 1 : -1;
        const pan = new THREE.Mesh(panG, B(0xff8a50));
        pan.position.set(side * 4.3, 1.4, -i * 17 - 9);
        pan.rotation.y = side * Math.PI / 2;
        tunG.add(pan); T3.pans.push(pan);
      }
    }
    // ---- ACT 3 · PALM SUNSET ----
    const sunsetG = new THREE.Group(); world.add(sunsetG); T3.sunsetG = sunsetG;
    {
      const palmT = mkTex((g, S2) => {
        g.clearRect(0, 0, S2, S2);
        g.strokeStyle = '#1a1030'; g.fillStyle = '#1a1030';
        g.lineWidth = 7;
        g.beginPath(); g.moveTo(S2 * 0.5, S2); g.quadraticCurveTo(S2 * 0.58, S2 * 0.55, S2 * 0.52, S2 * 0.3); g.stroke();
        g.lineWidth = 5;
        for (let i = 0; i < 7; i++) {
          const a2 = -Math.PI * 0.9 + i * 0.28;
          g.beginPath(); g.moveTo(S2 * 0.52, S2 * 0.3);
          g.quadraticCurveTo(S2 * 0.52 + Math.cos(a2) * 40, S2 * 0.3 + Math.sin(a2) * 40 - 14, S2 * 0.52 + Math.cos(a2) * 78, S2 * 0.3 + Math.sin(a2) * 78 + 16);
          g.stroke();
        }
      });
      T3.palms = [];
      for (let i = 0; i < 18; i++) {
        const side = i % 2 ? 1 : -1;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: palmT, transparent: true }));
        const h2 = 9 + rnd() * 6;
        sp.scale.set(h2, h2, 1);
        sp.position.set(side * (7.5 + rnd() * 6), h2 * 0.45, -(i * 24 + rnd() * 10) - 8);
        sunsetG.add(sp); T3.palms.push(sp);
      }
    }
    // ---- scenography: sun, halo, ridge, stars ----
    const sunT = mkTex((g, S2) => {
      const gr = g.createLinearGradient(0, 40, 0, 216);
      gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(0.55, '#ffb46e'); gr.addColorStop(1, '#ff7e6b');
      g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 88, 0, 6.284); g.fill();
      g.fillStyle = '#020107';
      for (let i = 0; i < 5; i++) g.fillRect(40, 138 + i * 14, 176, 2.5 + i * 1.6);
    });
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunT, fog: false, transparent: true }));
    sun.scale.set(64, 64, 1); sun.position.set(20, 12, -300); sc.add(sun); T3.sun = sun;
    const haloT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, 'rgba(255,170,110,0.55)'); gr.addColorStop(1, 'rgba(255,140,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, fog: false, transparent: true, blending: THREE.AdditiveBlending }));
    halo.scale.set(150, 150, 1); halo.position.copy(sun.position); halo.position.z -= 1; sc.add(halo); T3.halo = halo;
    {
      const pos2 = [];
      const N2 = 70, W2 = 700;
      for (let i = 0; i < N2; i++) {
        const x0 = -W2 / 2 + (i / (N2 - 1)) * W2, x1 = -W2 / 2 + ((i + 1) / (N2 - 1)) * W2;
        const h0 = 4 + rnd() * 14, h1 = 4 + rnd() * 14;
        pos2.push(x0, 0, 0, x1, 0, 0, x0, h0, 0, x1, 0, 0, x1, h1, 0, x0, h0, 0);
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos2), 3));
      const ridge = new THREE.Mesh(gg, B(0x0b0616, { fog: false }));
      ridge.position.set(0, 0, -290); sc.add(ridge); T3.ridge = ridge;
    }
    {
      const n2 = 220, pos2 = new Float32Array(n2 * 3);
      for (let i = 0; i < n2; i++) { pos2[i * 3] = (rnd() - 0.5) * 800; pos2[i * 3 + 1] = 20 + rnd() * 200; pos2[i * 3 + 2] = -250 - rnd() * 200; }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
      const st = new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xaab4ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false }));
      sc.add(st); T3.stars = st;
    }
    // ---- machine + rider (V5 primitives — hero models drop in when they arrive) ----
    const bike = new THREE.Group(); sc.add(bike); T3.bike = bike;
    bike.position.set(0, 0, -11.5);
    const dark = 0x11141f, darker = 0x0a0c13, accent = 0x3fd9e8;
    const wheel = (z2, rad) => {
      const w2 = new THREE.Group();
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad, rad * 0.26, 12, 36), B(0x07080d)));
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.035, 8, 32), B(0x232b3d)));
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.016, 8, 32), B(accent, { transparent: true, opacity: 0.55 })));
      w2.position.set(0, rad * 1.26, z2); bike.add(w2); return w2;
    };
    T3.placeholder = [wheel(1.05, 0.58), wheel(-1.15, 0.5)];
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.7, 6, 12), L2(dark));
    body.rotation.x = Math.PI / 2; body.position.set(0, 0.86, -0.1); bike.add(body);
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), L2(0x171b29));
    tank.scale.set(1, 0.72, 1.5); tank.position.set(0, 1.06, 0.32); bike.add(tank);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 10), L2(darker));
    nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.92, -1.35); bike.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.9, 8), L2(darker));
    tail.rotation.x = Math.PI / 2; tail.position.set(0, 1.05, 1.35); bike.add(tail);
    T3.placeholder.push(body, tank, nose, tail);
    for (const sx of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 2.4), B(accent, { transparent: true, opacity: 0.8 }));
      strip.position.set(sx * 0.33, 0.9, 0); bike.add(strip); T3.placeholder.push(strip);
    }
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.05), B(0xff4560));
    tailL.position.set(0, 1.14, 1.62); bike.add(tailL); T3.tailL = tailL;
    bike.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), B(0xdff6ff))).position.set(0, 0.95, -1.8);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 11, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = Math.PI / 2; cone.position.set(0, 0.9, -7.2); bike.add(cone);
    const rider = new THREE.Group(); bike.add(rider); T3.rider = rider;
    rider.position.set(0, 1.15, 0.55);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 6, 10), L2(0x0b0d15));
    torso.rotation.x = 1.05; torso.position.set(0, 0.32, -0.1); rider.add(torso);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), L2(0x0d0f1a));
    helmet.position.set(0, 0.62, -0.42); rider.add(helmet);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.02), B(0x9f8cff, { transparent: true, opacity: 0.85 }));
    visor.position.set(0, 0.62, -0.6); rider.add(visor);
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 4, 8), L2(0x0a0c12));
    legL.rotation.z = 0.5; legL.rotation.x = 0.4; legL.position.set(-0.3, -0.05, 0.1); rider.add(legL);
    const legR = legL.clone(); legR.rotation.z = -0.5; legR.position.x = 0.3; rider.add(legR);
    // make the machine READ: cyan underglow pooling on the asphalt, and a cool
    // rim light behind the rider so the silhouette separates from the dark
    const under = mkGlow(0x2ec8da, 5.2); under.material.opacity = 0.4;
    under.position.set(0, 0.12, 0); bike.add(under); T3.under = under;
    const rim = new THREE.PointLight(0x8fb4ff, 1.5, 14, 1.6);
    rim.position.set(0.8, 3.4, 3.2); bike.add(rim); T3.rim = rim;
    // ---- HERO ASSETS (CC-BY: Akira Motorcycle by s.navajon; palms via Sketchfab) ----
    if (typeof THREE.GLTFLoader === 'function') {
      const loader = new THREE.GLTFLoader();
      loader.load('models/akira_motorcycle.glb', gl2 => {
        try {
          const m = gl2.scene;
          const bb = new THREE.Box3().setFromObject(m);
          const size = bb.getSize(new THREE.Vector3());
          let f = 3.4 / Math.max(size.x, size.y, size.z, 0.001);
          if (!isFinite(f) || f <= 0) f = 1;
          m.scale.multiplyScalar(f); // multiply — respect the export's own baked scale
          const bb2 = new THREE.Box3().setFromObject(m);
          const c2 = bb2.getCenter(new THREE.Vector3());
          m.position.set(-c2.x, -bb2.min.y, -c2.z);
          // lighter body + a whisper of self-glow so the machine reads in the dark
          m.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: 0x2a3350, emissive: 0x0a1226, flatShading: true }); });
          T3.placeholder.forEach(p2 => p2.visible = false);
          T3.bike.add(m); T3.bikeModel = m;
          const topY = bb2.max.y - bb2.min.y;
          const lenZ = bb2.max.z - bb2.min.z;
          // neon accent strips along the flanks, sized to the real model
          for (const sx of [-1, 1]) {
            const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, lenZ * 0.72),
              new THREE.MeshBasicMaterial({ color: 0x3fd9e8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
            strip.position.set(sx * (bb2.max.x - bb2.min.x) * 0.42, topY * 0.42, 0);
            T3.bike.add(strip);
          }
          T3.rider.position.set(0, topY * 0.8, 0.5);
          T3.tailL.position.set(0, topY * 0.6, 1.68);
        } catch (e) {}
      });
      loader.load('models/palm_trees.glb', gl2 => {
        try {
          const src2 = gl2.scene;
          const bb = new THREE.Box3().setFromObject(src2);
          const size = bb.getSize(new THREE.Vector3());
          let sc2 = 11 / Math.max(size.y, 0.001);
          if (!isFinite(sc2) || sc2 <= 0) sc2 = 1;
          src2.traverse(o => {
            if (o.isMesh && o.material) {
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => {
                if (mm.color) mm.color.setRGB(0.17, 0.12, 0.3);
              });
            }
          });
          T3.palms.forEach(sp => sp.visible = false);
          T3.palmModels = [];
          for (let i = 0; i < 8; i++) {
            const cl = src2.clone();
            cl.scale.multiplyScalar(sc2 * (0.75 + ((i * 37) % 11) / 11 * 0.5));
            const side = i % 2 ? 1 : -1;
            cl.position.set(side * (9.5 + ((i * 13) % 7)), 0, -(i * 46) - 12);
            cl.rotation.y = (i * 1.7) % 6.28;
            T3.sunsetG.add(cl);
            T3.palmModels.push(cl);
          }
        } catch (e) {}
      });
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.2);
    if (s.pres < 0.22) s.asleep = true;
    if (s.asleep && s.pres > 0.5) {
      s.asleep = false;
      P.ping(A => {
        if (typeof MOut !== 'undefined') MOut.sfxNote(36, 0.85, 3);
        A.hit({ vol: 0.22, dur: 0.7, freq: 85, q: 0.6, at: 0 });
      });
    }
    const thr = clamp((inp.L + inp.R) / 2);
    // the journey advances only while someone rides
    const ACT_LEN = [42, 38, 26, 42];
    if (s.pres > 0.45) {
      s.actT += dt;
      if (s.actT > ACT_LEN[s.act]) { s.actT = 0; s.act = (s.act + 1) % 4; s.trans = 1; }
    }
    s.trans = Math.max(0, s.trans - dt * 0.55);
    const tunnel = s.act === 2;
    const spdMax = tunnel ? 46 : s.act === 3 ? 26 : 34;
    s.speed += ((5 + Math.pow(thr, 1.25) * spdMax) - s.speed) * Math.min(1, dt * 1.4);
    const steerIn = clamp(inp.R - inp.L, -1, 1);
    s.steer += (steerIn - s.steer) * Math.min(1, dt * 1.6);
    s.lane += (s.steer * (tunnel ? 1.6 : 2.6) - s.lane) * Math.min(1, dt * 1.4);
    s.bob += dt * (2 + s.speed * 0.3);
    s.kickPulse = Math.max(0, s.kickPulse - dt * 5);
    s.arpFlash = Math.max(0, s.arpFlash - dt * 5);
    if (P.focused && typeof MOut !== 'undefined') {
      const now = performance.now();
      for (let i = MOut.log.length - 1; i >= 0; i--) {
        const ev = MOut.log[i];
        if (ev.p <= s.lastEvP) break;
        if (ev.p > now) continue;
        if (ev.role === 'perc') s.kickPulse = 1;
        else if (ev.role === 'arp') { s.arpFlash = 1; s.arpIdx++; }
      }
      s.lastEvP = now;
    }
    if (s.noGL || !P._three) return;
    const T3 = P._three, E = 0.55 + s.pres * 0.45;
    const dz = s.speed * dt;
    const act = s.act;
    // act visibilities
    T3.caveG.visible = act === 0; T3.cityG.visible = act === 1;
    T3.tunG.visible = act === 2; T3.sunsetG.visible = act === 3;
    T3.stars.visible = act !== 2 && act !== 0;
    T3.ridge.visible = act === 1 || act === 3;
    // scroll + recycle
    for (const d of T3.dashes) { d.position.z += dz; if (d.position.z > 2) d.position.z -= 288; }
    const recyc = (obj, span) => { obj.position.z += dz; if (obj.position.z > 4) obj.position.z -= span; };
    if (act === 0) {
      // the rock itself streams past — two tube segments leapfrogging
      for (const tb of T3.caveTubes) {
        tb.position.z += dz;
        if (tb.position.z > 140) tb.position.z -= 480;
        tb.userData.wireMat.opacity = 0.1 + s.arpFlash * 0.16 + thr * 0.08;
      }
      for (const c of T3.crystals) {
        recyc(c.g, 680);
        const hand = c.side < 0 ? inp.L : inp.R;
        c.m.opacity = 0.35 + hand * 0.5 + s.arpFlash * 0.2;
        c.halo.material.opacity = 0.22 + hand * 0.4 + s.arpFlash * 0.15;
      }
      for (const m of T3.shrooms) recyc(m, 690);
      // drips
      const dp = T3.drips.geometry.attributes.position;
      for (let i = 0; i < dp.count; i++) {
        let y = dp.getY(i) - T3.dripVel[i] * dt, z = dp.getZ(i) + dz;
        if (y < 0.05) { y = 6 + ((i * 7919) % 97) / 97 * 5; }
        if (z > 2) z -= 120;
        dp.setY(i, y); dp.setZ(i, z);
      }
      dp.needsUpdate = true;
    } else if (act === 1) {
      for (const b of T3.towers) recyc(b, 700);
      const rp = T3.rain.geometry.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        let y = rp.getY(i) - dt * 26, z = rp.getZ(i) + dz;
        if (y < 0) y = 28; if (z > 2) z -= 120;
        rp.setY(i, y); rp.setZ(i, z);
      }
      rp.needsUpdate = true;
    } else if (act === 2) {
      for (const r2 of T3.rings) {
        recyc(r2.ring, 364);
        r2.m.opacity = 0.55 + s.kickPulse * 0.45;
      }
      for (const p2 of T3.pans) recyc(p2, 340);
    } else {
      for (const p2 of (T3.palmModels || T3.palms)) recyc(p2, T3.palmModels ? 380 : 430);
    }
    // sun per act
    const sunVis = act === 1 ? 0.85 : act === 3 ? 1 : 0;
    T3.sun.material.opacity += (sunVis - T3.sun.material.opacity) * Math.min(1, dt * 1.5);
    T3.halo.material.opacity = T3.sun.material.opacity * 0.8 + s.kickPulse * 0.08;
    if (act === 3) { T3.sun.position.set(0, 9, -300); T3.sun.scale.set(95, 95, 1); T3.halo.scale.set(220, 220, 1); }
    else { T3.sun.position.set(20, 12, -300); T3.sun.scale.set(64, 64, 1); T3.halo.scale.set(150, 150, 1); }
    T3.halo.position.copy(T3.sun.position); T3.halo.position.z -= 1;
    // atmosphere per act (+ transition fog swell that masks the swap)
    const fogA = [0.028, 0.0115, 0.017, 0.009][act];
    T3.hemi.intensity = [0.13, 0.3, 0.22, 0.34][act];
    T3.scene.fog.density = fogA - thr * 0.003 + s.trans * 0.03;
    const fogCol = [0x050210, 0x0a0714, 0x060a16, 0x140a18][act];
    T3.scene.fog.color.setHex(fogCol);
    T3.scene.background.setHex([0x030110, 0x020107, 0x02040a, 0x0a0410][act]);
    T3.renderer.toneMappingExposure = (0.68 + E * 0.5 + s.kickPulse * 0.05) * [0.8, 1, 1.02, 1.18][act];
    // road accents per act
    const edgeCol = [0x6a5aa8, 0x2ec8da, 0x49c8f2, 0xff9a6b][act];
    for (const em of T3.edgeMats) em.color.setHex(edgeCol);
    T3.ground.material.color.setHex([0x050310, 0x05060e, 0x04060c, 0x0d0713][act]);
    T3.under.material.opacity = 0.25 + s.kickPulse * 0.3 + thr * 0.15;
    T3.pool.material.opacity = 0.4 + s.kickPulse * 0.35 + thr * 0.2 + (act === 1 ? 0.15 : 0);
    // headlight strongest in cave/tunnel where it has walls to reveal
    T3.head.intensity = (act === 0 || act === 2) ? 3.2 : 1.5;
    T3.head.position.set(-s.lane, 1.6, -20);
    // steering / lean / camera
    T3.world.rotation.y = s.steer * 0.105;
    T3.world.position.x = -s.lane;
    T3.bike.rotation.z = -s.steer * 0.34;
    T3.rider.rotation.z = -s.steer * 0.16;
    T3.bike.position.y = Math.sin(s.bob * 2.1) * 0.02 * (s.speed / 40);
    T3.cam.rotation.z = s.steer * 0.04;
    T3.cam.rotation.y = 0.06; T3.cam.rotation.x = -0.095; // tilted down enough to see the machine
    T3.cam.position.x = 1.05 + s.steer * 0.35;
    T3.cam.position.y = 3.15 + Math.sin(s.bob) * 0.015 * (s.speed / 40);
    T3.cam.fov = 58 + (tunnel ? thr * 8 : 0);
    T3.cam.updateProjectionMatrix();
    T3.tailL.scale.setScalar(1 + s.kickPulse * 0.8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('NIGHT CIRCUIT V6 · THE JOURNEY', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ACTS = ['THE CAVERN', 'NEON DISTRICT', 'THE TUNNEL', 'PALM SUNSET'];
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * Math.max(1, Math.sqrt(areaScale(P))))}px ui-monospace,monospace`;
    g.fillText(ACTS[P.state.act] + ' · ' + Math.round(s.speed * 6) + ' KM/H' + (s.pres < 0.3 ? ' · WAITING IN THE DARK' : ''), 10, h - 10);
  },
  audio(A, P) {
    // V5's own engine: 84 BPM minor, drums EARN their entrance by act
    const v = A.voice();
    const surf = v.filter('lowpass', 1000, 0.9);
    surf.connect(v.group);
    const mkBus = gain => { const gg = v.g(gain); gg.connect(surf); return gg; };
    const arpBus = mkBus(1), bassBus = mkBus(1);
    if (A.delIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.55; arpBus.connect(s2); s2.connect(A.delIn); }
    if (A.revIn) { const s3 = A.ctx.createGain(); s3.gain.value = 0.35; arpBus.connect(s3); s3.connect(A.revIn); }
    let nextT = T.next(0.25), step16 = 0;
    const schedTone = (bus, freq, t0, vol, dur, type) => {
      const o = A.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const gg = A.ctx.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg); gg.connect(bus);
      o.start(t0); o.stop(t0 + dur + 0.05);
    };
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        const s = P.state;
        const lift = clamp((inp.L + inp.R) / 2);
        const act = s.act || 0;
        const inten = [0.12, 0.55, 1.0, 0.4][act] * (0.25 + lift * 0.75);
        A.set(surf.frequency, 260 + Math.pow(lift, 1.4) * (act === 2 ? 7500 : 5200), 0.2);
        MOut.expr('arp', lift); MOut.expr('bass', lift);
        const horizon = AE.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          // drums: silent in the cave, groove in the city, full double-time in the tunnel,
          // heavy half-time at the sunset
          if (act >= 1 && lift > 0.1) {
            const kickPat = act === 3 ? (st === 0 || st === 10) : (st % 4 === 0);
            if (kickPat && inten > 0.25) A.kick(tt, 0.3);
            const snarePos = act === 3 ? st === 8 : st % 8 === 4;
            if (snarePos && inten > 0.4) {
              MOut.evDrum(38, 0.24, tt);
              A.hit({ vol: 0.16, dur: 0.16, freq: 1700, q: 0.8, at: tt });
              A.tone(170, { at: tt, vol: 0.06, dur: 0.1, type: 'triangle', rev: 0.3 });
            }
            const hatEvery = act === 2 ? 1 : 2;
            if (st % hatEvery === (hatEvery === 1 ? 0 : 1) && inten > 0.3) A.hat(tt, { vol: 0.022 + lift * 0.028, open: act === 2 && st === 14 });
            // open hat breathing on the offbeat 8ths — the disco lung
            if (act === 1 && st % 4 === 2 && inten > 0.4) A.hat(tt, { vol: 0.03 + lift * 0.02, open: true });
          }
          // chord stabs NEVER on the 1 — Daft Punk funk lands just after it:
          // the and-of-1, a push into beat 3, and the a-of-3 driving into 4
          if (act >= 1 && lift > 0.15 && (st === 2 || st === 7 || st === 11)) {
            const sv = (st === 2 ? 0.085 : 0.06) + lift * 0.04;
            const dur2 = 0.13;
            for (const ct of [0, 2, 4]) {
              const f2 = H.chordTone(ct, 0);
              schedTone(arpBus, f2, tt, sv * 0.5, dur2, 'sawtooth');
            }
            MOut.evNote('pad', H.chordTone(0, 0), sv, tt, dur2);
          }
          // bass: cave = long dark roots; elsewhere driving 8ths
          if (act === 0) {
            if (st === 0 && lift > 0.04) {
              const bf = H.rootFreq(-2);
              MOut.evNote('bass', bf, 0.15, tt, 1.6);
              schedTone(bassBus, bf, tt, 0.15, 1.7, 'sine');
              schedTone(bassBus, bf * 0.5, tt, 0.1, 1.9, 'sine');
            }
          } else if (lift > 0.06 && st % 2 === 0) {
            const oct = st % 4 === 0 ? -2 : -1;
            const bf = H.rootFreq(oct);
            const bv = st % 2 === 0 ? 0.15 : 0.1;
            MOut.evNote('bass', bf, bv, tt, 0.22);
            schedTone(bassBus, bf, tt, bv, 0.22, 'sawtooth');
          } else if (act >= 1 && lift > 0.3 && (st === 3 || st === 11)) {
            // ghost notes — quiet 16th pickups that make the bass line walk
            const bf = H.rootFreq(-1);
            MOut.evNote('bass', bf, 0.05, tt, 0.09);
            schedTone(bassBus, bf, tt, 0.05, 0.09, 'sawtooth');
          }
          // arp: cave sparse minor bells → city 8ths → tunnel 16ths → sunset warm 8ths
          const arpStep = act === 0 ? 4 : act === 2 ? 1 : 2;
          if (lift > 0.04 && st % arpStep === 0) {
            const pat = [0, 3, 2, 4, 1, 3, 2, 5][(step16 / arpStep | 0) % 8];
            const f = H.chordTone(pat, act === 2 && lift > 0.6 ? 1 : 0);
            const vol2 = (act === 0 ? 0.045 : 0.05 + lift * 0.03);
            MOut.evNote('arp', f, vol2, tt, act === 0 ? 0.5 : 0.16);
            schedTone(arpBus, f, tt, vol2, act === 0 ? 0.6 : 0.17, act === 0 ? 'triangle' : 'square');
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < AE.t()) nextT = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
