/* ============================================================
   PIECES 01–08
   ============================================================ */

/* ---------- SRC-01 · EPICYCLE COURT ---------- */
reg({
  id: 'SRC-01', ver: 3, title: 'Epicycle Court', tech: 'CONCENTRIC RESONATOR',
  music: { bpm: 72, root: 50, mode: 'lydian', prog: [0, 1, 4, 5] }, fx: { bloom: 0.55 },
  tags: ['RING FIELD', 'SPARKLE DECAY', 'LOCAL SWELL', 'PENTATONIC BELLS'],
  desc: 'A court of nested rings that never stops shimmering. Each hand is a vertical field line; wherever it stands, the rings swell toward it like iron filings remembering a magnet. The left and right of the body become the left and right of the orbit.',
  interact: 'Mirror-symmetric: raising either hand pushes its field line OUTWARD from center, like opening a pair of doors. Sweeping rakes bells out of the rings — but the deeper play is DWELLING: hold a hand still and that column wakes up. Over a few seconds the moons inside it swell, a halo blooms, and an arpeggio gathers — sparse at first, then denser, then lifting an octave into sparkle. Move, and the gathering releases. Stillness is a musical position here, not a pause.',
  sound: 'Bed: warm pad, two detuned saws through a slow LP (Ableton: Analog, unison 2, cutoff ~600Hz, LFO on cutoff at 0.1Hz). Bulge energy opens the filter. Sparkles: bell rack in D minor pentatonic (Operator, sine + 2.76x partial), one note each time a dot crosses the swell threshold; dot x-position → pan, ring radius → pitch (inner = high). Keep bells at -18dB, lots of them, like rain on a gong.',
  init(P) {
    const m = Math.min(P.w, P.h), cx = P.w / 2, cy = P.h / 2;
    const rings = [];
    for (let i = 0; i < 8; i++) {
      const r = m * (0.08 + i * 0.056);
      const n = 14 + i * 8, dots = [];
      for (let j = 0; j < n; j++) dots.push({ a: j / n * TAU, tw: P.rand() * TAU, d: 0, hot: false, heat: 0 });
      rings.push({ r, dots });
    }
    P.state = { rings, cx, cy, m, energy: 0, lastBell: 0, lastFire: 0, dwellL: 0, dwellR: 0, prevL: 0.5, prevR: 0.5, xL: 0.5, xR: 0.5, stars: [], totalHeat: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // mirror mapping: hands push their field lines outward from center
    const xL = 0.5 - inp.L * 0.44, xR = 0.5 + inp.R * 0.44;
    s.xL = xL; s.xR = xR;
    // DWELL: a held hand gathers power in its column over ~7s
    const vL = Math.abs(inp.L - s.prevL) / Math.max(dt, 1e-4);
    const vR = Math.abs(inp.R - s.prevR) / Math.max(dt, 1e-4);
    s.prevL = inp.L; s.prevR = inp.R;
    s.dwellL = clamp(s.dwellL + (chan.L.mode === 'live' && vL < 0.06 ? dt / 7 : -dt * 0.9));
    s.dwellR = clamp(s.dwellR + (chan.R.mode === 'live' && vR < 0.06 ? dt / 7 : -dt * 0.9));
    // jiggle: small hand motions over a warmed region ripple it into firing
    const jigL = clamp(vL * 6) * (vL < 0.5 ? 1 : 0.2);
    const jigR = clamp(vR * 6) * (vR < 0.5 ? 1 : 0.2);
    let energy = 0, totalHeat = 0;
    for (const ring of s.rings) {
      const dots = ring.dots, nD = dots.length;
      for (let j = 0; j < nD; j++) {
        const dot = dots[j];
        const wx = (s.cx + Math.cos(dot.a + t * 0.05) * ring.r) / P.w;
        const bL = bump(wx, xL, 0.12), bR = bump(wx, xR, 0.12);
        const target = bL + bR;
        dot.d += (target - dot.d) * Math.min(1, dt * 6);
        energy += dot.d;
        // WARMTH: dwelling field lines heat the stars beneath them…
        if (target > 0.4) dot.heat = Math.min(1, dot.heat + dt * 0.13 * target);
        else dot.heat = Math.max(0, dot.heat - dt * 0.02);
        // …and warmth is infectious along the ring
        const nb = (dots[(j + 1) % nD].heat + dots[(j - 1 + nD) % nD].heat) / 2;
        if (nb > dot.heat) dot.heat += (nb - dot.heat) * dt * 0.9;
        totalHeat += dot.heat;
        // warm stars fire on their own — the warmer, the readier; jiggle ripples them
        const jig = bL > bR ? jigL : jigR;
        if (dot.heat > 0.25 && t - s.lastFire > 0.055 &&
            P.rand() < dot.heat * dot.heat * (0.1 + jig * 3.2) * dt * 10) {
          s.lastFire = t;
          const pitch = H.chordTone(9 - Math.round(ring.r / (s.m * 0.052)), dot.heat > 0.7 ? 1 : 0);
          P.ping(A => A.bell(pitch, { at: A.q(), vol: 0.04 + dot.heat * 0.05, pan: wx * 2 - 1, del: 0.2 }));
          dot.tw += 2; // visible flicker on fire
        }
        // SHOOTING STARS: fully warmed stars can escape
        if (dot.heat > 0.92 && P.rand() < dt * 0.4) {
          const a = dot.a + t * 0.05;
          const sx2 = s.cx + Math.cos(a) * ring.r, sy2 = s.cy + Math.sin(a) * ring.r;
          const oa = a + 0.5; // outward + tangential
          s.stars.push({ x: sx2, y: sy2, vx: Math.cos(oa) * 260, vy: Math.sin(oa) * 260, life: 1, trail: [] });
          dot.heat = 0.35;
          const pitch = H.chordTone(11, 1);
          P.ping(A => {
            A.pluck2(pitch, { at: 0, vol: 0.1, dur: 1.5, rev: 0.6, del: 0.3, pan: wx * 2 - 1 });
            A.hit({ vol: 0.06, dur: 0.25, freq: 6000, q: 0.6 });
          });
        }
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
    s.totalHeat = totalHeat / 400;
    for (const st of s.stars) {
      st.trail.unshift({ x: st.x, y: st.y });
      if (st.trail.length > 14) st.trail.pop();
      st.x += st.vx * dt; st.y += st.vy * dt;
      st.life -= dt * 0.7;
    }
    s.stars = s.stars.filter(st => st.life > 0);
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#080a06'; g.fillRect(0, 0, w, h);
    // dwell halos — the gathered power blooming in each held column
    for (const [dx, dw] of [[s.xL, s.dwellL], [s.xR, s.dwellR]]) {
      if (dw < 0.05) continue;
      const hx = dx * w;
      const gr = g.createRadialGradient(hx, h / 2, 4, hx, h / 2, s.m * (0.12 + dw * 0.3));
      gr.addColorStop(0, `hsla(52,90%,72%,${dw * 0.22})`);
      gr.addColorStop(1, 'hsla(52,90%,60%,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(hx, h / 2, s.m * (0.12 + dw * 0.3), 0, TAU); g.fill();
    }
    for (const ring of s.rings) {
      g.strokeStyle = 'rgba(122,160,70,0.18)'; g.lineWidth = 1;
      g.beginPath(); g.arc(s.cx, s.cy, ring.r, 0, TAU); g.stroke();
      for (const dot of ring.dots) {
        const a = dot.a + t * 0.05;
        const rr = ring.r * (1 + dot.d * 0.24);
        const x = s.cx + Math.cos(a) * rr, y = s.cy + Math.sin(a) * rr;
        const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + dot.tw);
        // dwelling makes the moons in that column swell
        const wx2 = (s.cx + Math.cos(a) * ring.r) / P.w;
        const dwellBoost = s.dwellL * bump(wx2, s.xL, 0.14) + s.dwellR * bump(wx2, s.xR, 0.14);
        const sz = (1.15 + dot.d * 2.4) * tw * (1 + ring.r / s.m * 3.4) * (1 + dwellBoost * 1.15 + dot.heat * 1.1);
        const lum = 0.25 + 0.75 * Math.max(tw * 0.4, Math.max(dot.d, dot.heat));
        // warmth shifts the star's color: cool green → gold → white-hot
        const heat = dot.heat;
        const baseHue = 70 - ring.r / s.m * 55;
        const hue = lerp(baseHue + 55, 42, heat);
        const sat = lerp(45, 100, heat), lit = lerp(58, 86, heat);
        g.fillStyle = (dot.d > 0.4 || heat > 0.3)
          ? `hsla(${lerp(hue, 45, Math.max(dot.d, heat))},${sat}%,${lit}%,${lum})`
          : `hsla(${hue},45%,62%,${lum * 0.75})`;
        if (dot.d > 0.5 || heat > 0.5) { g.shadowColor = heat > 0.5 ? '#ffd98a' : '#b8ff3e'; g.shadowBlur = 8 + heat * 12; }
        g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
        g.shadowBlur = 0;
      }
    }
    // shooting stars — the fully-warmed ones escaping the court
    for (const st of s.stars) {
      for (let k = 0; k < st.trail.length - 1; k++) {
        const a2 = st.life * (1 - k / st.trail.length);
        g.strokeStyle = `rgba(255,230,170,${a2 * 0.8})`;
        g.lineWidth = Math.max(0.6, 3 - k * 0.22);
        g.beginPath();
        g.moveTo(st.trail[k].x, st.trail[k].y);
        g.lineTo(st.trail[k + 1].x, st.trail[k + 1].y);
        g.stroke();
      }
      g.fillStyle = `rgba(255,250,230,${st.life})`;
      g.shadowColor = '#ffe9b0'; g.shadowBlur = 14;
      g.beginPath(); g.arc(st.x, st.y, 2.8, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.038, cutoff: 520 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    let next8 = T.next(0.5);
    v.fadeIn(1, 1);
    return {
      tick() {
        const s = P.state;
        const b = 320 + (s.energy + Math.max(s.dwellL, s.dwellR) * 0.5) * 2400;
        pads.forEach(p => p.bright(b));
        // the dwell arpeggio: a held column gathers notes — denser, then an octave up
        const horizon = AE.t() + 0.15;
        while (next8 < horizon) {
          for (const [dw, pan] of [[s.dwellL, -0.55], [s.dwellR, 0.55]]) {
            if (dw > 0.12 && Math.random() < dw * 0.85) {
              const oct = dw > 0.6 && Math.random() < (dw - 0.6) * 2 ? 1 : 0;
              const idx = 2 + ((Math.random() * 6) | 0);
              const vol = 0.045 + dw * 0.05;
              if (Math.random() < 0.35) AE.bell(H.chordTone(idx, oct), { at: next8, vol: vol * 0.8, pan, del: 0.25 });
              else AE.pluck2(H.chordTone(idx, oct), { at: next8, vol, dur: 1.1, pan, rev: 0.5, del: 0.2 });
            }
          }
          next8 += T.beat * 0.5;
        }
        if (next8 < AE.t()) next8 = T.next(0.5);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-02 · PHYLLO REACTOR ---------- */
reg({
  id: 'SRC-02', ver: 2, title: 'Phyllo Reactor', tech: 'VOGEL SPIRAL / RADIAL INSTRUMENT',
  music: { bpm: 76, root: 52, mode: 'dorian', prog: [0, 3, 4, 6] }, fx: { bloom: 0.5 },
  tags: ['SPACE = TEMPO', 'TWO-OCTAVE RING', 'GOLDEN ANGLE', 'COLOR WAVES'],
  desc: 'The spiral is an instrument with two different souls now. The LEFT hand is space itself: it breathes the florets apart with a springy bloom — and the space between the florets IS the space between the notes. Tight spiral, slow sparse pulse; fully bloomed, a glittering sixteenth-note rain, the high notes multiplying with the distance. The RIGHT hand is a two-octave ring: sweep it and a glowing band travels radially through the disk — outer rim is the low octave, blazing center is the top — and every threshold it crosses strikes a note and hurls a color wave along the spiral arm.',
  interact: 'L = expansion AND tempo, one gesture — the geometry\'s spacing and the music\'s spacing are the same number. Pump it and the disk breathes while the pulse accelerates and decelerates with it. R = pitch: fifteen thresholds spanning two full octaves of the scale, outer-to-inner, played by sweeping — a radial keyboard. Together: left hand sets the weather of time, right hand plays the melody through it.',
  sound: 'Two voices: (1) the disk\'s own pulse — floret notes on a grid whose subdivision follows L (quarters when tight → 16ths when bloomed), pitch drawn from floret radius with the high registers blooming in as it expands; (2) the ring instrument — right hand crossings play scale tones across two octaves, marimba-bright, with the struck ring flashing at the matching radius. Ableton: pulse on CH1 (kalimba/celeste), the ring notes will read as deliberate melody — give them the better patch. Pads underneath follow the bloom.',
  init(P) {
    const m = Math.min(P.w, P.h);
    const n = Math.min(1300, Math.round(480 * areaScale(P))), dots = [];
    const GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      dots.push({ i, a: i * GA, r: Math.sqrt(i / n) * m * 0.46, z: 0 });
    }
    P.state = { dots, n, rot: P.rand() * TAU, m, exp: 0.6, expV: 0, waves: [], rDeg: -1, ringFlash: 0, ringPos: 0.5 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // LEFT: springy expansion — and the tempo rides the same value
    const targetE = 0.45 + inp.L * 1.05;
    s.expV += (targetE - s.exp) * 46 * dt;
    s.expV *= Math.pow(0.002, dt);
    s.exp += s.expV * dt * 4;
    s.rot += dt * (0.08 + s.exp * 0.12);
    // RIGHT: the two-octave ring — 15 thresholds, outer = low, center = high
    const deg = Math.round(inp.R * 14);
    s.ringPos += ((1 - deg / 14) - s.ringPos) * Math.min(1, dt * 8);
    if (deg !== s.rDeg) {
      const moved = s.rDeg >= 0;
      s.rDeg = deg;
      if (moved) {
        s.ringFlash = 1;
        if (s.waves.length < 14) s.waves.push({ t0: t, hue: 160 + deg * 12, amp: 1 });
        P.ping(A => A.pluck2(H.scaleTone(deg), { at: A.q(), vol: 0.13, dur: 1.2, pan: 0.25, rev: 0.45, del: 0.18 }));
      }
    }
    s.ringFlash *= Math.pow(0.01, dt);
    // florets near the struck ring rise
    const maxR = s.m * 0.46;
    for (const d of s.dots) {
      const rN = d.r / maxR;
      const target = bump(rN, s.ringPos, 0.09) * (0.5 + s.ringFlash * 0.7);
      d.z += (target - d.z) * Math.min(1, dt * 8);
    }
    s.waves = s.waves.filter(wv => t - wv.t0 < 2.6);
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#04060a'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // the struck ring
    if (s.ringFlash > 0.02 || true) {
      const rr = s.ringPos * s.m * 0.46 * s.exp;
      g.strokeStyle = `hsla(${160 + (s.rDeg < 0 ? 0 : s.rDeg) * 12},90%,${60 + s.ringFlash * 30}%,${0.18 + s.ringFlash * 0.6})`;
      g.lineWidth = 2 + s.ringFlash * 5;
      if (s.ringFlash > 0.2) { g.shadowColor = '#dfffe9'; g.shadowBlur = 16 * s.ringFlash; }
      g.beginPath(); g.ellipse(cx, cy, Math.max(4, rr), Math.max(3, rr * 0.82), 0, 0, TAU); g.stroke();
      g.shadowBlur = 0;
    }
    for (const d of s.dots) {
      const a = d.a + s.rot;
      const rr = d.r * s.exp;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr * 0.82 - d.z * s.m * 0.2;
      let wv = 0, wHue = 168;
      const pos = d.i / s.n;
      for (const wave of s.waves) {
        const front = (t - wave.t0) * 0.62;
        if (front > 1.4) continue;
        const k = bump(pos, front, 0.12) * Math.max(0, 1.2 - front) * wave.amp;
        if (k > wv) { wv = k; wHue = wave.hue; }
      }
      const hot = Math.max(d.z, wv);
      const sz = (1.1 + d.r / s.m * 4) * (1 + d.z * 1.3 + wv * 1.6);
      if (hot > 0.3) { g.shadowColor = `hsl(${wv > d.z ? wHue : 160},90%,80%)`; g.shadowBlur = 10 + hot * 14; }
      if (hot > 0.2) {
        const hue2 = wv > d.z ? wHue : 160;
        g.fillStyle = `hsla(${hue2},${70 + hot * 30}%,${58 + hot * 36}%,${0.5 + hot * 0.5})`;
      } else {
        g.fillStyle = `hsla(${168 + (d.i % 5) * 8},45%,42%,${0.16 + 0.18 * Math.sin(t + d.i)})`;
      }
      g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
    g.fillStyle = 'rgba(150,220,190,0.75)'; g.font = '10px ui-monospace,monospace';
    const NOTE_N = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
    g.fillText('BLOOM ' + Math.round(((s.exp - 0.45) / 1.05) * 100) + '%  PULSE 1/' + [4, 4, 8, 8, 16][Math.min(4, Math.floor(((s.exp - 0.45) / 1.05) * 5))] + '  RING ' + NOTE_N[Math.max(0, s.rDeg)] + '/15', 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.05, cutoff: 620 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    let nextP = T.next(1);
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const s = P.state;
        const e = clamp((s.exp - 0.45) / 1.05);
        pads.forEach(p => { p.bright(300 + e * 2400); p.level(0.04 + e * 0.035, 0.3); });
        MOut.expr('lead', e);
        // THE PULSE: the disk plays itself — subdivision follows the bloom.
        // Tight = quarter notes. Fully bloomed = sixteenth rain, high notes multiplying.
        const horizon = AE.t() + 0.15;
        while (nextP < horizon) {
          const interval = lerp(1.0, 0.25, e); // beats
          // floret pitch: radius → scale degree; expansion invites the high registers
          const highBias = Math.random() < e * 0.65;
          const degF = highBias ? 7 + ((Math.random() * 8) | 0) : (Math.random() * 8) | 0;
          const vol = 0.055 + e * 0.04 + (highBias ? 0.01 : 0);
          AE.pluck2(H.scaleTone(degF), { at: nextP, vol, dur: 0.9, pan: (Math.random() * 2 - 1) * 0.5, rev: 0.4, del: 0.2 });
          if (P.state.waves.length < 14) P.state.waves.push({ t0: nowT + (nextP - AE.t()), hue: 160 + degF * 12, amp: 0.55 + e * 0.4 });
          nextP += T.beat * interval;
        }
        if (nextP < AE.t()) nextP = T.next(1);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-03 · GRAV CIRCUIT ---------- */
reg({
  id: 'SRC-03', title: 'Grav Circuit', tech: 'PSEUDO-3D / HOVERBIKE',
  music: { bpm: 96, root: 45, mode: 'mixolydian', prog: [0, 6, 3, 4] }, fx: { bloom: 0.45, edge: true },
  tags: ['STEERING', 'DIFFERENTIAL INPUT', 'GATES', 'ENGINE DRONE'],
  desc: 'A wireframe circuit with no ground under it. The bike answers the difference between your hands — lean left, lean right — and the sum of them is the throttle. Gates drift toward you out of the dark and ring like struck glass when you thread them.',
  interact: 'R − L = steering (differential). L + R = throttle (common mode). Thread the gates; drift off the lane and the whole frame gravels. Two scalars become a vehicle.',
  sound: 'Engine: mono saw, pitch = 45Hz + speed × 90Hz through a resonant LP that tracks throttle (Operator or a real synth bass patch, add subtle drive). Lean → auto-pan. Gate hit: bright glass chime, fifth apart alternating (Tuned glass rack). Missed gate: dull sub thud. Off-lane: gravel = filtered noise gated by an LFO at 30Hz. This is the piece that teaches differential vs common-mode input.',
  init(P) {
    P.state = {
      d: 0, px: 0, speed: 1, gates: [], nextGate: 26,
      stars: Array.from({ length: 60 }, () => ({ x: P.rand(), y: P.rand() * 0.5, tw: P.rand() * TAU })),
      shake: 0, flash: 0, score: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const steer = (inp.R - inp.L), thr = (inp.L + inp.R) / 2;
    s.speed = 8 + thr * 30;
    s.d += s.speed * dt;
    const curve = z => Math.sin(z * 0.045) * 1.4 + Math.sin(z * 0.021 + 2) * 1.9;
    const cHere = curve(s.d + 4) - curve(s.d);
    s.px += steer * dt * 3.2 - cHere * dt * s.speed * 0.04 - s.px * dt * 0.5;
    s.px = clamp(s.px, -1.6, 1.6);
    const off = Math.abs(s.px) > 1.05;
    s.shake += ((off ? 1 : 0) - s.shake) * dt * 6;
    // gates
    if (s.d > s.nextGate) {
      s.nextGate = s.d + 22 + P.rand() * 20;
      s.gates.push({ z: s.d + 60, x: (P.rand() * 2 - 1) * 0.7, hit: false });
    }
    for (const gt of s.gates) {
      if (!gt.hit && gt.z < s.d + 1.2) {
        gt.hit = true;
        if (Math.abs(s.px - gt.x) < 0.42) {
          s.flash = 1; s.score++;
          const tone = H.chordTone(4 + (s.score % 3) * 2, 1);
          P.ping(A => { A.bell(tone, { at: A.q(), vol: 0.13, del: 0.3 }); });
        } else {
          P.ping(A => A.hit({ vol: 0.2, dur: 0.3, freq: 90, type: 'lowpass' }));
        }
      }
    }
    s.gates = s.gates.filter(gt => gt.z > s.d - 2);
    s.flash *= Math.pow(0.03, dt);
    s.curve = curve; s.off = off; s.steer = steer;
  },
  draw(P, g, w, h, t) {
    const s = P.state;
    g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
    const horizon = h * 0.3;
    const shx = (Math.sin(t * 47) * s.shake) * 6, shy = (Math.cos(t * 53) * s.shake) * 4;
    g.save(); g.translate(shx, shy);
    // stars
    for (const st of s.stars) {
      g.fillStyle = `rgba(160,190,220,${0.2 + 0.4 * Math.abs(Math.sin(t + st.tw))})`;
      g.fillRect(st.x * w, st.y * h, 1.5, 1.5);
    }
    if (s.flash > 0.02) { g.fillStyle = `rgba(184,255,62,${s.flash * 0.15})`; g.fillRect(-20, -20, w + 40, h + 40); }
    // road strips near→far
    const N = 42;
    const project = tt => {
      const z = s.d + tt * 70;
      const persp = 1 - tt;
      const cx = w / 2 + (s.curve(z) - s.curve(s.d)) * w * 0.09 * tt - s.px * w * 0.22 * persp;
      const y = h - (h - horizon) * (1 - Math.pow(1 - tt, 1.7));
      const rw = lerp(w * 0.34, w * 0.012, tt);
      return { cx, y, rw };
    };
    // road surface + rails
    const pts = [];
    for (let j = 0; j <= N; j++) pts.push(project(j / N));
    g.beginPath();
    g.moveTo(pts[0].cx - pts[0].rw, pts[0].y);
    for (let j = 1; j <= N; j++) g.lineTo(pts[j].cx - pts[j].rw, pts[j].y);
    for (let j = N; j >= 0; j--) g.lineTo(pts[j].cx + pts[j].rw, pts[j].y);
    g.closePath();
    g.fillStyle = 'rgba(30,44,60,0.55)'; g.fill();
    for (const sgn of [-1, 1]) {
      g.beginPath();
      g.moveTo(pts[0].cx + sgn * pts[0].rw, pts[0].y);
      for (let j = 1; j <= N; j++) g.lineTo(pts[j].cx + sgn * pts[j].rw, pts[j].y);
      g.strokeStyle = 'rgba(150,220,255,0.85)'; g.lineWidth = 2;
      g.shadowColor = '#9fd4ff'; g.shadowBlur = 8;
      g.stroke();
      g.shadowBlur = 0;
    }
    // center dashes
    g.strokeStyle = 'rgba(120,170,210,0.5)'; g.lineWidth = 1.5;
    for (let j = 0; j < N; j++) {
      if ((j + Math.floor(s.d * 1.6)) % 4 !== 0) continue;
      const p = pts[j], p2 = pts[j + 1];
      g.beginPath(); g.moveTo(p.cx, p.y); g.lineTo((p.cx + p2.cx) / 2, (p.y + p2.y) / 2); g.stroke();
    }
    // gates
    for (const gt of s.gates) {
      const tt = (gt.z - s.d) / 70;
      if (tt < 0 || tt > 1) continue;
      const p = project(tt);
      const gx = p.cx + gt.x * p.rw, gw2 = p.rw * 0.4, gh = (1 - tt) * h * 0.14;
      g.strokeStyle = gt.hit ? 'rgba(184,255,62,0.9)' : `rgba(255,255,255,${0.85 - tt * 0.6})`;
      g.lineWidth = 1 + (1 - tt) * 1.5;
      g.beginPath();
      g.moveTo(gx - gw2, p.y); g.lineTo(gx - gw2, p.y - gh);
      g.lineTo(gx + gw2, p.y - gh); g.lineTo(gx + gw2, p.y);
      g.stroke();
    }
    // bike
    const bx = w / 2, by = h * 0.86, lean = s.steer * 0.5;
    const bs = Math.max(9, h * 0.018);
    g.save(); g.translate(bx, by); g.rotate(lean);
    g.strokeStyle = s.off ? '#ff9060' : '#eaf6ff'; g.lineWidth = 2;
    g.shadowColor = s.off ? '#ff7040' : '#9fd4ff'; g.shadowBlur = 14;
    g.beginPath(); g.arc(0, 0, bs, 0, TAU); g.stroke();
    g.beginPath(); g.arc(-bs * 1.4, bs * 0.7, bs * 0.55, 0, TAU); g.stroke();
    g.beginPath(); g.arc(bs * 1.4, bs * 0.7, bs * 0.55, 0, TAU); g.stroke();
    g.fillStyle = '#eaf6ff'; g.beginPath(); g.arc(0, 0, bs * 0.33, 0, TAU); g.fill();
    g.restore();
    g.restore();
    // hud
    g.fillStyle = 'rgba(150,220,255,0.8)'; g.font = `${Math.max(10, h * 0.02)}px ui-monospace,monospace`;
    g.fillText('VEL ' + Math.round(s.speed * 8), 12, 20);
    g.fillText('GATES ' + s.score, 12, 38);
  },
  audio(A, P) {
    const v = A.voice();
    const eng = v.osc('sawtooth', 60);
    const f = v.filter('lowpass', 300, 4);
    const eg = v.g(0.14);
    eng.connect(f); f.connect(eg); eg.connect(v.group);
    const grav = v.noise();
    const gf = v.filter('bandpass', 500, 0.7);
    const gg = v.g(0);
    grav.connect(gf); gf.connect(gg); gg.connect(v.group);
    v.fadeIn(1, 0.5);
    let lastBar = -1;
    return {
      tick(inp) {
        const s = P.state;
        A.set(eng.frequency, 42 + s.speed * 3.4, 0.08);
        A.set(f.frequency, 180 + s.speed * 34, 0.1);
        A.set(gg.gain, s.shake * 0.14, 0.1);
        const b = T.bar();
        if (b !== lastBar) { lastBar = b; A.bassNote(H.rootFreq(-1), { vol: 0.14, dur: 1.4 }); }
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-04 · BUBBLE FIELD ---------- */
reg({
  id: 'SRC-04', ver: 2, title: 'Bubble Field', tech: 'WARPED VEIL / BASS TO SPARKLE',
  music: { bpm: 70, root: 50, mode: 'aeolian', prog: [0, 5, 1, 4] }, fx: { bloom: 0.55 },
  tags: ['ONE BENT LINE', 'PITCH BY POSITION', 'SURFACE NOT LINE', 'PLAYABLE FIELD'],
  desc: 'Iridescent bubbles rising through the dark — big slow bass-bubbles drifting up the left, quick bright sparkle-bubbles on the right. Across the whole volume lies ONE luminous line, a veil with a soft wash of light falling from it like the hem of a curtain. Your two hands hold its two ends: push one down and the other up and the veil warps into a long diagonal surface through the space. Everything that rises into it bursts and plays — and pitch is position, two octaves left to right. Park the left end deep in the bass bubbles while the right end rides high, and you are holding a bassline and a melody in one bent line.',
  interact: 'L = height of the veil\'s west end, R = east — one connected surface, warped between your hands. Pitch runs left→right across two octaves: the left field is bass (bigger, slower bubbles), the right is sparkle. Dip an end to harvest that register; tilt the whole veil to rake a glissando as the field rises through it. Swipe speed = velocity. This one you can genuinely play.',
  sound: 'Pops: plucked scale tones, pitch mapped to x-position across two full octaves (deep left, bright right), bubble size → volume and length, all quantized to 16ths and panned where they burst (Ableton: split CH1 by pitch — a warm sub-bass patch below the octave break, kalimba above — and the veil becomes a two-voice instrument). Bed: soft pad + underwater air; the veil\'s motion adds an airy whoosh. Hold the left end low for a walking bass from the big bubbles; feather the right for melody.',
  _spawn(P, fromBottom) {
    const x = P.rand() * P.w;
    const xn = x / P.w;
    // bass bubbles live left: bigger, slower. Sparkle bubbles right: small, quick.
    const r = (9 + P.rand() * 15) * (1 + (1 - xn) * 0.9);
    return {
      x,
      y: fromBottom ? P.h + r + P.rand() * P.h * 0.3 : P.rand() * P.h,
      r, ph: P.rand() * TAU, wob: P.rand() * TAU,
      rise: P.h * (0.045 + P.rand() * 0.05) * (1 + xn * 0.8), sway: 10 + P.rand() * 18,
      alive: true, popT: -9, popX: 0, popY: 0
    };
  },
  init(P) {
    const bubbles = [];
    const n = Math.round(26 * Math.min(1.6, areaScale(P)));
    for (let i = 0; i < n; i++) bubbles.push(this._spawn(P, false));
    P.state = { bubbles, drops: [], prevYL: 0.5, prevYR: 0.5, velL: 0, velR: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const yL = (1 - inp.L) * h, yR = (1 - inp.R) * h;
    s.yL = yL; s.yR = yR;
    s.velL = Math.abs(yL - s.prevYL) / Math.max(dt, 1e-4) / h;
    s.velR = Math.abs(yR - s.prevYR) / Math.max(dt, 1e-4) / h;
    s.prevYL = yL; s.prevYR = yR;
    for (const b of s.bubbles) {
      if (!b.alive) {
        if (t - b.popT > 0.5) Object.assign(b, this._spawn(P, true));
        continue;
      }
      b.y -= b.rise * dt;
      b.x += Math.sin(t * 0.6 + b.ph) * b.sway * dt;
      b.wob += dt * (1.2 + b.rise * 0.02);
      if (b.y < -b.r * 2) Object.assign(b, this._spawn(P, true));
      // ONE warped veil: a smooth curve from the west hand's height to the east's
      const xn = b.x / w;
      const veilY = lerp(yL, yR, smooth(xn)) + Math.sin(xn * 9 + t * 1.8) * 6;
      if (Math.abs(b.y - veilY) < b.r * 0.85) {
        b.alive = false; b.popT = t; b.popX = b.x; b.popY = b.y; b.popR = b.r;
        const vel = lerp(s.velL, s.velR, xn);
        for (let k = 0; k < 8; k++) {
          const a = P.rand() * TAU;
          s.drops.push({
            x: b.x + Math.cos(a) * b.r * 0.6, y: b.y + Math.sin(a) * b.r * 0.6,
            vx: Math.cos(a) * (30 + vel * 160), vy: Math.sin(a) * (30 + vel * 160) - 20,
            life: 0.8, hue: 165 + b.r * 4.5
          });
        }
        // PITCH IS POSITION: two octaves left → right; size gives weight and length
        const deg = Math.round(xn * 14);
        const vol = clamp(0.08 + vel * 0.3 + (b.r / 40) * 0.06, 0.08, 0.26);
        const dur = 0.7 + (b.r / 40) * 1.6;
        const pan = xn * 2 - 1;
        P.ping(A => {
          A.pluck2(H.scaleTone(deg, -1), { at: A.q(), vol, dur, pan, rev: 0.45, del: 0.22 });
          A.hit({ vol: vol * 0.3, dur: 0.04, freq: 3200 + xn * 3200, pan });
        });
      }
    }
    for (const d of s.drops) {
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 240 * dt; d.life -= dt * 1.5;
    }
    s.drops = s.drops.filter(d => d.life > 0);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(3,6,12,0.42)'; g.fillRect(0, 0, w, h);
    if (s.yL === undefined) return;
    // THE VEIL: one connected curve warped between the hands, with a wash of
    // light falling from it — a surface, not a mechanism
    const heat = Math.min(1, (s.velL + s.velR) * 1.4);
    const veilAt = x => {
      const xn = x / w;
      return lerp(s.yL, s.yR, smooth(xn)) + Math.sin(xn * 9 + t * 1.8) * 6;
    };
    // the wash: gradient strips hanging below the curve
    const STEP = w / 34;
    for (let x = 0; x <= w - STEP; x += STEP) {
      const y0 = veilAt(x + STEP / 2);
      const depth = h * 0.16;
      const gr = g.createLinearGradient(0, y0, 0, y0 + depth);
      const xn = x / w;
      gr.addColorStop(0, `hsla(${190 + xn * 60},80%,75%,${0.14 + heat * 0.1})`);
      gr.addColorStop(1, 'hsla(200,80%,70%,0)');
      g.fillStyle = gr;
      g.fillRect(x, y0, STEP + 1, depth);
    }
    // the line itself: luminous, wispy, pitch-tinted along its length
    for (let pass = 0; pass < 2; pass++) {
      g.lineWidth = pass === 0 ? 3.5 + heat * 4 : 1.4;
      g.shadowColor = '#cfeeff'; g.shadowBlur = pass === 0 ? 16 + heat * 16 : 0;
      g.beginPath();
      for (let x = 0; x <= w; x += w / 60) {
        const y = veilAt(x) + (pass === 1 ? Math.sin(x * 0.05 + t * 3.1) * 2.5 : 0);
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      const lg = g.createLinearGradient(0, 0, w, 0);
      lg.addColorStop(0, `rgba(150,190,255,${pass === 0 ? 0.75 : 0.4})`);   // bass end: deep blue
      lg.addColorStop(1, `rgba(220,255,250,${pass === 0 ? 0.85 : 0.5})`);   // sparkle end: bright
      g.strokeStyle = lg;
      g.stroke();
      g.shadowBlur = 0;
    }
    // bubbles — iridescent soap, wobbling
    for (const b of s.bubbles) {
      if (!b.alive) {
        const k = (t - b.popT) / 0.5;
        if (k < 1) {
          g.strokeStyle = `rgba(255,255,255,${(1 - k) * 0.9})`;
          g.lineWidth = 2.5 * (1 - k);
          g.beginPath(); g.arc(b.popX, b.popY, b.popR * (1 + k * 2.6), 0, TAU); g.stroke();
        }
        continue;
      }
      const hue = 165 + b.r * 4.5;
      const wobble = Math.sin(b.wob) * 0.12;
      g.save();
      g.translate(b.x, b.y);
      g.rotate(Math.sin(b.wob * 0.6) * 0.4);
      g.scale(1 + wobble, 1 - wobble);
      // iridescent rim: two offset arc highlights
      g.strokeStyle = `hsla(${hue},85%,72%,0.85)`;
      g.lineWidth = 1.8;
      g.beginPath(); g.arc(0, 0, b.r, 0, TAU); g.stroke();
      g.strokeStyle = `hsla(${hue + 70},90%,75%,0.7)`;
      g.lineWidth = 2.4;
      g.beginPath(); g.arc(0, 0, b.r * 0.92, -2.4, -0.9); g.stroke();
      g.strokeStyle = `hsla(${hue - 55},90%,70%,0.55)`;
      g.beginPath(); g.arc(0, 0, b.r * 0.9, 0.6, 1.9); g.stroke();
      g.fillStyle = `hsla(${hue},90%,65%,0.07)`;
      g.beginPath(); g.arc(0, 0, b.r, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath(); g.arc(-b.r * 0.35, -b.r * 0.38, Math.max(1.4, b.r * 0.09), 0, TAU); g.fill();
      g.restore();
    }
    // droplets
    for (const d of s.drops) {
      g.fillStyle = `hsla(${d.hue},90%,78%,${d.life})`;
      g.beginPath(); g.arc(d.x, d.y, 1.8, 0, TAU); g.fill();
    }
  },
  audio(A, P) {
    const v = A.voice();
    const air = v.noise();
    const af = v.filter('bandpass', 1400, 0.8);
    const ag = v.g(0);
    air.connect(af); af.connect(ag); ag.connect(v.group);
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.03, cutoff: 380 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    v.fadeIn(1, 0.8);
    return {
      tick() {
        const s = P.state;
        const vel = Math.min(1, ((s.velL || 0) + (s.velR || 0)) * 1.4);
        A.set(ag.gain, vel * 0.05, 0.09);
        A.set(af.frequency, 900 + vel * 2400, 0.1);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-05 · CHIME GROVE ---------- */
reg({
  id: 'SRC-05', ver: 2, title: 'Chime Grove', tech: 'STEERABLE WIND / LIVING TREES',
  music: { bpm: 80, root: 52, mode: 'ionian', prog: [0, 3, 5, 4] }, fx: { bloom: 0.55 },
  tags: ['WIND VECTOR', 'LEAVES FLY', 'GROW WHEN CALM', 'SNAP IN STORMS'],
  desc: 'Seven glass trees, thicker now, older — and the wind is YOURS. Both hands together set its force; the difference between them steers it, so the whole grove leans east or west under your tilt like wheat under one long gust. Trees that move, sing: the harder a tree is swaying, the brighter its canopy lights and the more chimes it sheds — and at full storm, leaves tear loose and stream away downwind. Push too hard and branches SNAP. But rest your hands, let the grove go quiet, and it heals: new branches unfurl one by one in the calm, growing back everything the storm took.',
  interact: 'L + R together = wind force. R − L = wind direction — tilt your hands and the gale swings across the grove; matched hands blow it straight through the middle. The ecosystem is the deep game: storms strip leaves and snap branches (each snap is a woody crack), calm regrows them over ~20 seconds. You can farm the grove — grow it lush and quiet, then harvest one glorious destructive gust.',
  sound: 'Wind bed: noise through an LP, gain and cutoff riding force, PANNED with the wind direction — close your eyes and you can still steer. Jingles: bell rack in the key, density and velocity from each tree\'s sway speed, panned to the tree (Collision glass mallet + shimmer). Branch snap: dry woody crack + low knock — make it hurt a little. Regrowth: nearly silent, one soft high harp tick as each branch returns. The arc from storm-clatter to healing near-silence IS the composition.',
  _grow(P, a, len, depth, req) {
    const node = { a, len, depth, req, ph: P.rand() * TAU, kids: [] };
    if (depth > 1 && len > 3) {
      const spread = 0.42 + P.rand() * 0.2;
      const kidReq = Math.min(0.94, req + 0.13 + P.rand() * 0.07);
      node.kids.push(this._grow(P, -spread, len * (0.66 + P.rand() * 0.1), depth - 1, kidReq));
      node.kids.push(this._grow(P, spread, len * (0.66 + P.rand() * 0.1), depth - 1, kidReq));
    }
    return node;
  },
  init(P) {
    const trees = [];
    const nT = 7;
    for (let i = 0; i < nT; i++) {
      const tx = (i + 0.5 + (P.rand() - 0.5) * 0.4) / nT;
      const hgt = Math.min(P.w, P.h) * (0.24 + P.rand() * 0.14);
      const root = this._grow(P, -Math.PI / 2 + (P.rand() - 0.5) * 0.2, hgt, 6, 0);
      trees.push({ tx, root, sway: 0, prevSway: 0, ph: P.rand() * TAU, shake: 0, growth: 0.55 + P.rand() * 0.25 });
    }
    const streaks = [];
    for (let i = 0; i < 26; i++) streaks.push({ x: P.rand(), y: P.rand() * 0.8, ph: P.rand() * TAU });
    P.state = { trees, sparks: [], leaves: [], debris: [], streaks, lastJ: 0, windStr: 0, windDir: 0, tips: [] };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // the wind vector: force from both hands, direction from their difference
    const strT = (inp.L + inp.R) / 2;
    const dirT = (inp.R - inp.L);
    s.windStr += (strT - s.windStr) * Math.min(1, dt * 2.4);
    s.windDir += (dirT - s.windDir) * Math.min(1, dt * 2);
    for (const tr of s.trees) {
      const breeze = (0.05 + s.windStr * 0.12) * Math.sin(t * (0.7 + s.windStr * 1.6) + tr.ph);
      const target = s.windDir * (0.3 + s.windStr * 0.55) + breeze;
      tr.prevSway = tr.sway;
      tr.sway += (target - tr.sway) * Math.min(1, dt * 3.4);
      const vel = Math.abs(tr.sway - tr.prevSway) / Math.max(dt, 1e-4);
      tr.shake += (vel - tr.shake) * Math.min(1, dt * 5);
      // GROW in calm · SNAP in storms
      if (s.windStr < 0.35) tr.growth = Math.min(1, tr.growth + dt / 16);
      else if (s.windStr > 0.72 && P.rand() < dt * (s.windStr - 0.72) * 4 && tr.growth > 0.2) {
        tr.growth = Math.max(0.16, tr.growth - (0.07 + P.rand() * 0.06));
        const tips = s.tips.filter(tp => tp.tree === tr);
        const tip = tips[(P.rand() * tips.length) | 0];
        if (tip) {
          for (let k = 0; k < 4; k++) {
            s.debris.push({
              x: tip.x, y: tip.y, a: P.rand() * TAU, spin: (P.rand() - 0.5) * 9,
              vx: s.windDir * 120 + (P.rand() - 0.5) * 50, vy: -20 + P.rand() * 30, life: 1.4, len: 5 + P.rand() * 9
            });
          }
        }
        P.ping(A => {
          A.hit({ vol: 0.2, dur: 0.06, freq: 900, q: 3, pan: tr.tx * 2 - 1 });
          A.hit({ vol: 0.16, dur: 0.2, freq: 180, q: 1, type: 'lowpass', pan: tr.tx * 2 - 1 });
        });
      }
      // singing: motion = chimes; storms also tear leaves loose
      if (tr.shake > 0.08 && P.rand() < tr.shake * dt * 46 && t - s.lastJ > 0.04) {
        s.lastJ = t;
        const tips = s.tips.filter(tp => tp.tree === tr);
        const tip = tips[(P.rand() * tips.length) | 0];
        if (tip) {
          s.sparks.push({ x: tip.x, y: tip.y, vx: (P.rand() - 0.5) * 30, vy: -20 - P.rand() * 40, life: 1 });
          if (s.windStr > 0.45) {
            s.leaves.push({
              x: tip.x, y: tip.y, ph: P.rand() * TAU, spin: (P.rand() - 0.5) * 7,
              vx: s.windDir * (60 + s.windStr * 160) + (P.rand() - 0.5) * 40,
              vy: -10 + P.rand() * 24, life: 1.6 + P.rand()
            });
          }
          const note = H.chordTone(5 + ((P.rand() * 5) | 0), 1);
          const vol = 0.035 + Math.min(0.09, tr.shake * 0.1);
          P.ping(A => A.bell(note, { at: A.q(), vol, pan: tr.tx * 2 - 1 }));
        }
      }
    }
    for (const lf of s.leaves) {
      lf.x += lf.vx * dt; lf.y += lf.vy * dt;
      lf.vy += 26 * dt; lf.vx *= Math.pow(0.6, dt);
      lf.ph += dt * lf.spin; lf.life -= dt * 0.6;
    }
    s.leaves = s.leaves.filter(lf => lf.life > 0 && lf.y < P.h);
    for (const db of s.debris) {
      db.x += db.vx * dt; db.y += db.vy * dt; db.vy += 160 * dt; db.a += db.spin * dt; db.life -= dt;
    }
    s.debris = s.debris.filter(db => db.life > 0);
    for (const sp of s.sparks) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy += 18 * dt; sp.life -= dt * 0.8; }
    s.sparks = s.sparks.filter(sp => sp.life > 0);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = '#0a0608'; g.fillRect(0, 0, w, h);
    // wind made visible: streaks flowing in the wind direction
    if (Math.abs(s.windDir) > 0.06 || s.windStr > 0.2) {
      g.lineWidth = 1;
      for (const st of s.streaks) {
        st.x += (s.windDir * (0.08 + s.windStr * 0.22) + 0.005) * (1 / 60);
        if (st.x > 1.05) st.x = -0.05; if (st.x < -0.05) st.x = 1.05;
        const sy = (st.y + Math.sin(t * 0.4 + st.ph) * 0.01) * h * 0.85;
        const len = s.windDir * (18 + s.windStr * 46);
        g.strokeStyle = `rgba(230,200,170,${0.05 + s.windStr * 0.12})`;
        g.beginPath(); g.moveTo(st.x * w, sy); g.lineTo(st.x * w - len, sy + 2); g.stroke();
      }
    }
    // ground — dusk
    g.strokeStyle = 'rgba(190,120,90,0.4)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, h * 0.92); g.lineTo(w, h * 0.92); g.stroke();
    s.tips.length = 0;
    const mScale = Math.min(w, h) / 500;
    for (const tr of s.trees) {
      const bendPer = tr.sway * 0.22;
      const glowK = Math.min(1, tr.shake * 1.6);
      const drawNode = (node, x, y, absA) => {
        const gs = clamp((tr.growth - node.req) * 6);
        if (gs <= 0.02) { s.tips.push({ x, y, tree: tr }); return; }
        const a2 = absA + node.a + bendPer * (7 - node.depth);
        const len = node.len * gs;
        const x2 = x + Math.cos(a2) * len, y2 = y + Math.sin(a2) * len;
        const k7 = 7 - node.depth;
        g.strokeStyle = `rgba(${110 + k7 * 24},${62 + k7 * 20},${118 - k7 * 9},${0.35 + node.depth * 0.1})`;
        g.lineWidth = Math.max(1.2, (node.depth * 1.7 - 1) * mScale * (0.75 + gs * 0.25));
        g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
        const isLeafy = node.kids.length === 0 || node.kids.every(kk => tr.growth <= kk.req + 0.005);
        if (isLeafy) {
          s.tips.push({ x: x2, y: y2, tree: tr });
          // canopy: brighter the more the tree moves
          const glow = 0.3 + 0.6 * Math.abs(Math.sin(t * 1.4 + x2 * 0.05)) + glowK * 0.6;
          for (let li = 0; li < 3; li++) {
            const la = a2 + (li - 1) * 0.7;
            const lx = x2 + Math.cos(la) * 4 * mScale, ly = y2 + Math.sin(la) * 4 * mScale;
            g.fillStyle = `rgba(255,${160 + glowK * 80},${125 + li * 14},${Math.min(1, glow * gs * 0.6)})`;
            if (glowK > 0.4) { g.shadowColor = '#ffc890'; g.shadowBlur = 10 * glowK; }
            g.beginPath(); g.arc(lx, ly, (2.2 + glowK * 2.6) * mScale * gs, 0, TAU); g.fill();
            g.shadowBlur = 0;
          }
        } else {
          for (const k of node.kids) drawNode(k, x2, y2, a2);
        }
      };
      drawNode(tr.root, tr.tx * w, h * 0.92, 0);
    }
    // flying leaves
    for (const lf of s.leaves) {
      g.save();
      g.translate(lf.x, lf.y); g.rotate(lf.ph);
      g.fillStyle = `rgba(255,${150 + ((lf.ph * 40) | 0) % 60},110,${Math.min(1, lf.life)})`;
      g.beginPath(); g.ellipse(0, 0, 3.6, 1.7, 0, 0, TAU); g.fill();
      g.restore();
    }
    // snapped branches tumbling
    for (const db of s.debris) {
      g.save();
      g.translate(db.x, db.y); g.rotate(db.a);
      g.strokeStyle = `rgba(150,95,80,${Math.min(1, db.life)})`;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(-db.len / 2, 0); g.lineTo(db.len / 2, 0); g.stroke();
      g.restore();
    }
    for (const sp of s.sparks) {
      g.fillStyle = `rgba(255,214,180,${sp.life})`;
      g.shadowColor = '#ffcfa8'; g.shadowBlur = 9;
      g.beginPath(); g.arc(sp.x, sp.y, 2 + sp.life * 1.6, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
    // wind HUD
    const dirArrow = s.windDir > 0.05 ? '→' : s.windDir < -0.05 ? '←' : '·';
    g.fillStyle = 'rgba(240,190,160,0.8)'; g.font = '10px ui-monospace,monospace';
    const avgGrowth = s.trees.reduce((a2, tr) => a2 + tr.growth, 0) / s.trees.length;
    g.fillText('WIND ' + dirArrow + ' ' + Math.round(s.windStr * 100) + '%  GROVE ' + Math.round(avgGrowth * 100) + '% GROWN', 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 400, 0.4);
    const ng = v.g(0.05);
    n.connect(f); f.connect(ng);
    let panNode = null;
    if (A.ctx.createStereoPanner) {
      panNode = A.ctx.createStereoPanner();
      ng.connect(panNode); panNode.connect(v.group);
    } else ng.connect(v.group);
    const pads = A.padVoices(v, 2, { type: 'triangle', gain: 0.022, cutoff: 320 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    v.fadeIn(1, 1);
    return {
      tick() {
        const s = P.state;
        A.set(f.frequency, 280 + s.windStr * 2600, 0.25);
        A.set(ng.gain, 0.02 + s.windStr * 0.1, 0.25);
        if (panNode) A.set(panNode.pan, clamp(s.windDir, -1, 1) * 0.7, 0.3);
        MOut.expr('bells', s.windStr);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-06 · PHYSARUM CHANCEL ---------- */
reg({
  id: 'SRC-06', title: 'Physarum Chancel', tech: 'JONES MODEL / SLIME AGENTS',
  music: { bpm: 60, root: 45, mode: 'aeolian', prog: [0, 0, 5, 5], chordBars: 4 }, fx: { bloom: 0.35, edge: true },
  tags: ['AGENT TRAILS', 'DIFFUSE + EVAPORATE', 'FOOD NODE', 'GRANULAR SCUTTLE'],
  desc: 'Ten thousand blind agents excavate the floor of a cathedral. Your left hand drags the only food in the building along an invisible rail; the congregation re-routes itself in seconds. Your right hand is the rate of forgetting — hold it low and the architecture is fixed; raise it and the roads dissolve behind the walkers.',
  interact: 'L = HEIGHT of the attractant node — raise your hand and the food rises with it (it roams slowly side to side on its own). R = evaporation rate: low = permanent veins, high = amnesia. Structure vs. dissolution, one hand each.',
  sound: 'Bed: low 55Hz sine drone + a second at 55.4Hz for slow beating. Scuttle: granular crackle — thousands of 5–15ms filtered noise grains, density mapped to how hard the network is rebuilding (Ableton: Granulator with a vinyl-crackle sample, grain density on a macro). Evaporation opens a feedback delay send — high forgetting = washy, low = dry and skeletal.',
  init(P) {
    const W = 176, H = 110;
    const field = new Float32Array(W * H), tmp = new Float32Array(W * H);
    const N = 2600, ag = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      ag[i * 3] = P.rand() * W; ag[i * 3 + 1] = P.rand() * H; ag[i * 3 + 2] = P.rand() * TAU;
    }
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    P.state = { W, H, field, tmp, ag, N, oc, og: oc.getContext('2d'), img: new ImageData(W, H), churn: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, H, field, ag, N } = s;
    const evap = 0.978 - inp.R * 0.12;
    // hand height = food height (up is up); the node roams horizontally on its own
    const foodX = W * 0.5 + Math.sin(t * 0.09) * W * 0.34;
    const foodY = 8 + (1 - inp.L) * (H - 16);
    // deposit food
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const ix = (foodX | 0) + dx, iy = (foodY | 0) + dy;
      if (ix >= 0 && ix < W && iy >= 0 && iy < H) field[iy * W + ix] = Math.min(3, field[iy * W + ix] + 0.4);
    }
    const SA = 0.55, SD = 6, TURN = 0.42, STEP = 1.15;
    let churn = 0;
    const sample = (x, y) => {
      const ix = x | 0, iy = y | 0;
      if (ix < 0 || ix >= W || iy < 0 || iy >= H) return -1;
      return field[iy * W + ix];
    };
    for (let i = 0; i < N; i++) {
      let x = ag[i * 3], y = ag[i * 3 + 1], a = ag[i * 3 + 2];
      const fw = sample(x + Math.cos(a) * SD, y + Math.sin(a) * SD);
      const lf = sample(x + Math.cos(a - SA) * SD, y + Math.sin(a - SA) * SD);
      const rt = sample(x + Math.cos(a + SA) * SD, y + Math.sin(a + SA) * SD);
      if (fw >= lf && fw >= rt) { /* straight */ }
      else if (lf > rt) { a -= TURN; churn++; }
      else { a += TURN; churn++; }
      x += Math.cos(a) * STEP; y += Math.sin(a) * STEP;
      if (x < 0) x += W; if (x >= W) x -= W;
      if (y < 0) y += H; if (y >= H) y -= H;
      const idx = (y | 0) * W + (x | 0);
      field[idx] = Math.min(3, field[idx] + 0.13);
      ag[i * 3] = x; ag[i * 3 + 1] = y; ag[i * 3 + 2] = a;
    }
    s.churn += (churn / N - s.churn) * 0.1;
    // diffuse + evaporate (cheap cross blur)
    const tmp = s.tmp;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l = x > 0 ? field[i - 1] : field[i], r = x < W - 1 ? field[i + 1] : field[i];
        const u = y > 0 ? field[i - W] : field[i], d = y < H - 1 ? field[i + W] : field[i];
        tmp[i] = (field[i] * 0.6 + (l + r + u + d) * 0.1) * evap;
      }
    }
    s.field.set(tmp);
    // scuttle sound
    if (P.focused && P.rand() < s.churn * 1.2) {
      P.ping(A => A.hit({ vol: 0.032, dur: 0.03 + P.rand() * 0.04, freq: 2500 + P.rand() * 4000, q: 3, pan: (inp.L * 2 - 1) * 0.6 }));
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, H, field, img } = s;
    const d = img.data;
    for (let i = 0; i < W * H; i++) {
      const v = Math.min(1, field[i] * 0.42);
      const vv = Math.pow(v, 1.7);
      // bioluminescent abyss: indigo dark → cyan veins → white-hot cores
      d[i * 4] = 10 + vv * 150;
      d[i * 4 + 1] = 16 + vv * 230;
      d[i * 4 + 2] = 42 + vv * 208;
      d[i * 4 + 3] = 255;
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    // food node reticle
    const fx = (0.5 + Math.sin(t * 0.09) * 0.34) * w;
    const fy = (8 + (1 - inp.L) * (H - 16)) / H * h;
    g.strokeStyle = 'rgba(255,230,180,0.9)'; g.lineWidth = 2;
    g.beginPath(); g.arc(fx, fy, 10 + Math.sin(t * 3) * 2, 0, TAU); g.stroke();
    g.beginPath(); g.moveTo(fx - 16, fy); g.lineTo(fx - 6, fy); g.moveTo(fx + 6, fy); g.lineTo(fx + 16, fy);
    g.moveTo(fx, fy - 16); g.lineTo(fx, fy - 6); g.moveTo(fx, fy + 6); g.lineTo(fx, fy + 16); g.stroke();
    g.fillStyle = 'rgba(140,190,110,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('EVAP ' + (0.978 - inp.R * 0.12).toFixed(3), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const o1 = v.osc('sine', H.rootFreq(-2)), o2 = v.osc('sine', H.rootFreq(-2) + 0.5);
    const o3 = v.osc('sine', H.chordTone(1, -1));
    const og = v.g(0.085), o3g = v.g(0.03);
    o1.connect(og); o2.connect(og); og.connect(v.group);
    o3.connect(o3g); o3g.connect(v.group);
    H.onChord(() => {
      A.set(o1.frequency, H.rootFreq(-2), 0.8);
      A.set(o3.frequency, H.chordTone(1, -1), 1.1);
    });
    v.fadeIn(1, 1.2);
    return {
      tick(inp) { A.set(o2.frequency, H.rootFreq(-2) + 0.2 + inp.R * 1.2, 0.3); },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-07 · CORAL SCRIPTORIUM ---------- */
reg({
  id: 'SRC-07', ver: 2, title: 'Coral Scriptorium', tech: 'GRAY-SCOTT REACTION-DIFFUSION',
  music: { bpm: 66, root: 48, mode: 'dorian', prog: [0, 2, 5, 3], chordBars: 4 }, fx: { bloom: 0.3, edge: true },
  tags: ['MORPHOGENESIS', 'FEED / KILL', 'CONTOUR BANDS', 'DRONE MORPH'],
  desc: 'A chemical argument settling into skin. The two hands hold the two liturgical constants of the reaction: what is fed in, and what is taken away. Between them the scriptorium writes corals, worms, mazes and mitosis — and rewrites them the moment either hand moves.',
  interact: 'Two clear hands now: L = growth energy — walk the living ridge from sparse solitary spots up through worms and mazes to roiling coral (the chemistry writes faster and stranger as you rise, but the light stays balanced — interiors stay dark, only the pattern\'s living EDGES glow, so full growth is dense, never blinding). R = the palette — slowly turns the whole scriptorium through the color wheel, deep-sea teal → violet → ember → moss, a gradual dye you can park anywhere. Untouched, the scriptorium keeps writing but veiled and dim — put a hand in and it wakes to full light.',
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
    // L walks the living ridge; K follows the sweep-measured pattern ridge
    // (offline sweep: best structure-forming K per F for this discretization)
    const F = 0.018 + inp.L * 0.042;
    const KT = [[0, 0.047], [0.15, 0.058], [0.3, 0.062], [0.45, 0.064], [0.6, 0.065], [0.75, 0.065], [1, 0.062]];
    let K = KT[KT.length - 1][1];
    for (let ki = 1; ki < KT.length; ki++) if (inp.L <= KT[ki][0]) {
      const [a0, k0] = KT[ki - 1], [a1, k1] = KT[ki];
      K = k0 + (k1 - k0) * (inp.L - a0) / (a1 - a0); break;
    }
    const Du = 0.16, Dv = 0.08;
    // presence: hands in = full light; untouched = veiled
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.5);
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
    // EDGE-LIT: brightness peaks at the pattern's living boundaries (v≈0.5),
    // interiors stay dark — full bloom reads dense, never white
    const pres = 0.4 + (s.pres || 0) * 0.6;
    const hueShift = inp.R * 300; // R turns the palette through the wheel
    const cs = Math.cos(hueShift * Math.PI / 180), sn = Math.sin(hueShift * Math.PI / 180);
    // edge = spatial gradient of V: only true boundaries light up, so even a
    // flooded or saturated field renders as dark tissue threaded with light
    for (let y = 0; y < H; y++) {
      const ym = ((y - 1 + H) % H) * W, yp = ((y + 1) % H) * W, y0 = y * W;
      for (let x = 0; x < W; x++) {
        const xm = (x - 1 + W) % W, xp = (x + 1) % W, i = y0 + x;
        const gx = V[y0 + xp] - V[y0 + xm], gy = V[yp + x] - V[ym + x];
        const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 7);
        const body = clamp(V[i] * 2.4);
        const vv = (Math.pow(edge, 0.85) * 0.92 + body * 0.10) * pres;
        // base deep-sea ramp, then rotate hue by R (fast approximate rotation)
        const r0 = vv * 60, g0 = vv * 235, b0 = vv * 150;
        const lum2 = (r0 + g0 + b0) / 3;
        d[i * 4] = clamp((lum2 + (r0 - lum2) * cs + (g0 - lum2) * sn) / 255) * 255;
        d[i * 4 + 1] = clamp((lum2 + (g0 - lum2) * cs + (b0 - lum2) * sn) / 255) * 255;
        d[i * 4 + 2] = clamp((lum2 + (b0 - lum2) * cs + (r0 - lum2) * sn) / 255) * 255;
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    g.fillStyle = 'rgba(140,190,110,0.85)'; g.font = '10px ui-monospace,monospace';
    g.fillText('GROWTH ' + Math.round(inp.L * 100) + '%  PALETTE ' + Math.round(inp.R * 300) + '°' + ((s.pres || 0) < 0.3 ? '  · SLEEPING' : ''), 10, h - 10);
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
  id: 'SRC-08', ver: 2, title: 'Harmonograph Duet', tech: 'LISSAJOUS / JUST INTONATION',
  music: { bpm: 72, root: 45, mode: 'ionian', prog: [0], chordBars: 8 }, fx: { bloom: 0.6 },
  tags: ['RATIO LOCK', 'AUDIBLE GEOMETRY', 'BRUSH TRAIL', 'TWO SINES'],
  desc: 'Two pendulums, one for each hand, drawing with the same wide brush. Each hand chooses a pitch from a just-intonation ladder; the figure on screen is literally the interval between them. Simple ratios close into calm knots — a fifth is a trefoil, an octave is a lens. Dissonance never stops writhing.',
  interact: 'L drives the HORIZONTAL pendulum — its height stretches the figure wider and picks its pitch from an 8-step just ladder (side edges flash when it steps). R drives the VERTICAL pendulum the same way (top/bottom edges flash). Moving your hands stirs the brush: faster strokes, wider fan, faster-fading echo. Hold still on a simple ratio and the knot burns white.',
  sound: 'Literal: two sine oscillators at the actual displayed ratio (base A2 110Hz × ratio, one per hand, L panned slightly left, R right). Slow attack, no effects except a tiny room verb — the interference is the content. Movement adds brightness; a sub-octave arrives when the interval locks. In Ableton: two Operator sines, pitch via CC-mapped scale device constrained to a just scale; add a sub when ratio = simple for reward weight.',
  init(P) {
    P.state = { s: 0, ph: P.rand() * TAU, prevIL: -1, prevIR: -1, lock: 0,
      pL: 0.5, pR: 0.5, velL: 0, velR: 0, act: 0, flashL: 0, flashR: 0, pres: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const RAT = [1, 9 / 8, 5 / 4, 4 / 3, 3 / 2, 5 / 3, 15 / 8, 2];
    s.iL = Math.round(inp.L * 7); s.iR = Math.round(inp.R * 7);
    s.rL = RAT[s.iL]; s.rR = RAT[s.iR];
    // felt motion: per-hand velocity stirs the brush
    const vL = Math.abs(inp.L - s.pL) / Math.max(dt, 0.001);
    const vR = Math.abs(inp.R - s.pR) / Math.max(dt, 0.001);
    s.pL = inp.L; s.pR = inp.R;
    s.velL += (Math.min(1.6, vL) - s.velL) * Math.min(1, dt * 6);
    s.velR += (Math.min(1.6, vR) - s.velR) * Math.min(1, dt * 6);
    s.act += (Math.min(1, (s.velL + s.velR) * 1.1) - s.act) * Math.min(1, dt * 4);
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres = (s.pres || 0) + (live - (s.pres || 0)) * Math.min(1, dt * 1.5);
    if (s.iL !== s.prevIL) {
      s.prevIL = s.iL; s.flashL = 1;
      P.ping(A => A.pluck2(H.rootFreq(0) * s.rL, { at: A.q(), vol: 0.055, dur: 0.3 }));
    }
    if (s.iR !== s.prevIR) {
      s.prevIR = s.iR; s.flashR = 1;
      P.ping(A => A.pluck2(H.rootFreq(1) * s.rR, { at: A.q(), vol: 0.045, dur: 0.3 }));
    }
    s.flashL = Math.max(0, s.flashL - dt * 2.2);
    s.flashR = Math.max(0, s.flashR - dt * 2.2);
    // pen speed: rest = slow meditative writing, movement stirs it
    s.s += dt * (0.9 + s.act * 1.9 + s.pres * 0.25);
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
    // echo equilibrium: fade keeps pace with how fast ink is being laid down
    const fade = 0.05 + s.act * 0.10 + s.lock * 0.015;
    g.fillStyle = `rgba(6,8,7,${fade.toFixed(3)})`; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    // full-bleed: each hand's height stretches its own axis toward the edges
    const Ax = w * (0.355 + (s.pL || 0) * 0.125);
    const Ay = h * (0.335 + (s.pR || 0) * 0.125);
    const w1 = s.rL * 1.9, w2 = s.rR * 1.9;
    const steps = 200;
    const pres = 0.42 + s.pres * 0.58;
    // multi-line brush: a fan of strokes; movement spreads the bristles
    const spread = 1 + s.act * 2.6;
    const N = 5;
    for (let k = 0; k < N; k++) {
      const off = k - (N - 1) / 2;                       // -2..2
      const po = off * 0.016 * spread;                   // phase fan
      const as = 1 + off * 0.011 * spread;               // amplitude fan
      const cen = 1 - Math.abs(off) / 3;                 // center bristle strongest
      const hue = 300 + s.lock * 30 + off * 9;
      const alpha = (0.16 + cen * 0.34 + s.lock * 0.30) * pres;
      g.strokeStyle = `hsla(${hue},${65 - s.lock * 40}%,${64 + cen * 8 + s.lock * 26}%,${alpha})`;
      g.lineWidth = (1.1 + cen * (1.5 + s.lock * 1.5)) * (0.7 + pres * 0.5);
      if (s.lock > 0.6 && cen > 0.9) { g.shadowColor = '#ffe8ff'; g.shadowBlur = 12; }
      g.beginPath();
      for (let i = 0; i <= steps; i++) {
        const tt = s.s + i / steps * 0.3;
        const x = cx + Ax * as * Math.sin(w1 * tt * TAU * 0.2 + s.ph + po);
        const y = cy + Ay * as * Math.sin(w2 * tt * TAU * 0.2 + po * 0.7);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
    }
    // pen head
    const x = cx + Ax * Math.sin(w1 * (s.s + 0.3) * TAU * 0.2 + s.ph);
    const y = cy + Ay * Math.sin(w2 * (s.s + 0.3) * TAU * 0.2);
    g.fillStyle = '#fff'; g.shadowColor = '#ffeaff'; g.shadowBlur = 14;
    g.beginPath(); g.arc(x, y, 2.6 + s.act * 1.6, 0, TAU); g.fill();
    g.shadowBlur = 0;
    // axis flashes: L steps → side edges glow, R steps → top/bottom edges glow
    if (s.flashL > 0.01) {
      const a = s.flashL * 0.5;
      let gr = g.createLinearGradient(0, 0, w * 0.06, 0);
      gr.addColorStop(0, `hsla(305,70%,72%,${a})`); gr.addColorStop(1, 'hsla(305,70%,72%,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w * 0.06, h);
      gr = g.createLinearGradient(w, 0, w - w * 0.06, 0);
      gr.addColorStop(0, `hsla(305,70%,72%,${a})`); gr.addColorStop(1, 'hsla(305,70%,72%,0)');
      g.fillStyle = gr; g.fillRect(w - w * 0.06, 0, w * 0.06, h);
    }
    if (s.flashR > 0.01) {
      const a = s.flashR * 0.5;
      let gr = g.createLinearGradient(0, 0, 0, h * 0.09);
      gr.addColorStop(0, `hsla(280,70%,74%,${a})`); gr.addColorStop(1, 'hsla(280,70%,74%,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h * 0.09);
      gr = g.createLinearGradient(0, h, 0, h - h * 0.09);
      gr.addColorStop(0, `hsla(280,70%,74%,${a})`); gr.addColorStop(1, 'hsla(280,70%,74%,0)');
      g.fillStyle = gr; g.fillRect(0, h - h * 0.09, w, h * 0.09);
    }
    // ratio label on a solid strip (so it doesn't ghost into the trail)
    const NAMES = ['1:1', '9:8', '5:4', '4:3', '3:2', '5:3', '15:8', '2:1'];
    const fs = Math.max(10, h * 0.022);
    g.fillStyle = '#060807'; g.fillRect(0, 0, w, fs * 2.1);
    g.fillStyle = 'rgba(235,180,225,0.9)'; g.font = `${fs}px ui-monospace,monospace`;
    g.fillText('L ' + NAMES[s.iL] + '   R ' + NAMES[s.iR] + (s.lock > 0.7 ? '   ◆ LOCK' : '') + (s.pres < 0.3 ? '   · SLEEPING' : ''), 12, fs * 1.4);
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
        A.set(gL.gain, 0.07 + s.act * 0.045, 0.2);
        A.set(gR.gain, 0.07 + s.act * 0.045, 0.2);
        A.set(sg.gain, s.lock * 0.07, 0.3);
        A.set(sub.frequency, base * 0.5 * s.rL, 0.2);
      },
      stop() { v.kill(); }
    };
  }
});
