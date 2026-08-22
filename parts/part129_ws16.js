/* ---------- SRC-10.16 · WEATHER STATION V16 (THE GLIDE) ---------- */
/* The soundscape pass reaches the weather. V15's picture untouched; the
   sound rebuilt to the audit + the Chladni laws:
   - PINNED KEY: Gm pedal cycle (Gm9 - Ebmaj7/G - Gm11 - F/G), names on
     the HUD. The set's only unpinned scene, fixed.
   - A FLOOR AT LAST: low bed + sub on the pedal (V15 had NO pitched bed -
     nothing for a musician to tune to). Mids arrive only with hands.
   - BELLS ON NATURAL TIME: V15 ticked a density metronome (grid interval
     2-1-0.5-0.25 beats). Now bells fall on gust-drawn intervals with
     min-gap and velocity spread - weather, never a machine gun.
   - THE GALE PAYS OFF: the visual warm flare finally sounds - storm
     rumble + sub swell + filter thrown wide; warmT streams as sfx CC74.
   - LURE IDLE: undulating low wind floor, varied breaths that gust
     audibly AND visibly through the field, sim calmed without presence,
     bells silent for an empty room. NO DRUMS, per Lance's verdict.       */
reg({
  id: 'SRC-10.16', family: 'SRC-10', ver: 17,
  title: 'Weather Station V16', tech: 'DENSITY SMOKE / THE GLIDE',
  music: {
    bpm: 60, root: 43, mode: 'aeolian', chordBars: 4,
    chords: [
      [0, 7, 15, 22, 26],    // G · D · B♭ · F · A
      [0, 8, 15, 19, 24],    // G · E♭ · B♭ · D · G
      [0, 10, 15, 17, 26],   // G · F · B♭ · C · A
      [0, 10, 14, 17, 24]    // G · F · A · C · G
    ],
    chordNames: ['Gm9', 'E♭maj7/G', 'Gm11', 'F/G']
  },
  fx: { bloom: 0.7, edge: true },
  tags: ['THE GLIDE', 'PINNED Gm PEDAL', 'BELLS ON GUST TIME', 'THE GALE ROARS', 'LURE IDLE'],
  desc: 'The wind learns to sing in key. Same smoke, same hand-placed form - but the room finally has a floor: a dark Gm pedal breathing low under the weather, its chords named on the HUD for any musician in the cave. The lantern bells stop ticking like a machine and fall the way gusts actually arrive - unevenly, louder when the wind turns hard, silent when nobody is there. Push deep into the gale and the storm finally answers: a low rumble rolls in under the warm flare, the sub swells, the whole wind throws open. Left alone the station rests - the field calms, a low floor undulates, and every while a breath of wind gusts through the smoke, audible and visible as one thing.',
  interact: 'L = heading AND placement - the wrapped form leans downwind and the pole travels a wide loop across the sky as you move your hand. R = the pole\u2019s reach: small at rest, ballooning hard as you raise the hand. Hard heading turns crack the air and straighten the field; deep gale (R high) brings the warm flare and the storm rumble with it. The bells follow the wind, not a clock - their pitch rides your heading, their timing rides the gusts.',
  sound: 'Three layers on a pinned Gm pedal. DRONE: low triangle pair + sub walking the chord cycle (mid pair joins only under hands); wind noise panned by heading, opening with the gale. QUANTIZED (none - no drums ever, per the verdict; the chord cycle is the only grid). REACTIVE: bells on natural gust time - interval drawn from density with min-gap 0.8s and velocity spread, pitch from heading on the scale ladder, low-mid register; hard turns crack immediately (0.6s cooldown); deep gale = storm rumble + sub swell + filter wide. Idle: the lure - undulating low floor, varied breaths (4-9s, spaced 10-30s) gusting sound and smoke together, bells and payoffs presence-gated. Ableton: wind/bed on texture ch6 (CC74 = density), bells ch5, warm flare streams sfx CC74 - map to a riser/impact send.',
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
    P.state = { mass, pole, head: 0, spin: 0, turnPulse: 0, hue: 200, dens: 0, gust: 0, warmT: 0, pres: 0, tNow: 0, brT: 5, brUntil: -9, brLen: 5, brDepth: 1, brSkew: 0.4, breath: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, pole = s.pole;
    s.tNow = t;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // THE LURE (Chladni doctrine): at rest, irregular breaths of wind -
    // random length/depth/shape/spacing - gust the sound AND the smoke.
    s.brT -= dt;
    let breath = 0;
    if (s.pres < 0.25) {
      if (s.brT <= 0) {
        s.brLen = 4 + P.rand() * 5;
        s.brDepth = 0.5 + P.rand() * 0.5;
        s.brSkew = 0.3 + P.rand() * 0.5;
        s.brUntil = t + s.brLen;
        s.brT = 10 + P.rand() * 20;
      }
      if (t < s.brUntil) {
        const u = 1 - (s.brUntil - t) / s.brLen;
        breath = (u < s.brSkew
          ? Math.sin((u / s.brSkew) * Math.PI * 0.5)
          : Math.cos(((u - s.brSkew) / (1 - s.brSkew)) * Math.PI * 0.5)) * s.brDepth;
      }
    }
    s.breath = breath;
    const heading = inp.L * TAU;
    let dh = heading - (s.head || 0);
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const instSpin = Math.abs(dh) / Math.max(dt, 1e-4);
    s.spin += (instSpin - s.spin) * Math.min(1, dt * 5);
    s.turnPulse = Math.max((s.turnPulse || 0) * Math.pow(0.02, dt), Math.min(1, s.spin / 5));
    s.head = heading;
    s.hue = 175 + (heading / TAU) * 70; // cool sweep only — the warm flare is layered on separately, at peak chaos
    // the sim RESTS without presence and gusts with the idle breaths
    const calm = Math.min(1, 0.3 + 0.7 * s.pres + breath * 0.5);
    const dens = (0.06 + inp.R * 0.94) * calm;
    s.dens += (dens - s.dens) * Math.min(1, dt * 5);
    const spd0 = (34 + inp.R * 190) * (0.45 + 0.55 * calm);
    s.gust = spd0;
    // the gale payoff belongs to people - presence-scaled like every payoff
    const warmTarget = Math.pow(clamp((inp.R - 0.72) / 0.28), 2) * (0.2 + 0.8 * s.pres);
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
      const depthMul = 1 + m.depth * 0.35;
      const N = trail.length;
      const r = (0.85 + m.widP * 0.6 + m.boost * 0.35) * ms * depthMul;
      const rr = r * 2;
      const baseA = (0.05 + clamp((N - 5) / 260) * 0.07 + m.boost * 0.05) * pres;
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
    // THE WIND (kept from V15): lowpass noise panned by heading
    const n = v.noise();
    const f = v.filter('lowpass', 420, 0.55);
    const ng = v.g(0.02);
    const pan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
    n.connect(f); f.connect(ng);
    if (pan) { ng.connect(pan); pan.connect(v.group); } else { ng.connect(v.group); }
    // THE FLOOR (new): low pair + subs on the Gm pedal - a musician can
    // finally tune to this scene. Mid pair exists only under hands.
    const bedLo = A.padVoices(v, 2, { type: 'triangle', gain: 0.02, cutoff: 280, q: 0.6 });
    const bedMid = A.padVoices(v, 2, { type: 'triangle', gain: 0.026, cutoff: 700, q: 0.6 });
    const place = gl => { A.leadToChord(bedLo, -1, gl); A.leadToChord(bedMid, 0, gl); };
    place(0.05);
    H.onChord(() => place(0.2));
    const sub = v.osc('sine', H.rootFreq(-1));
    const subG = v.g(0.012); sub.connect(subG); subG.connect(v.group);
    const sub2 = v.osc('sine', H.rootFreq(0));
    const sub2G = v.g(0.006); sub2.connect(sub2G); sub2G.connect(v.group);
    // THE STORM (new): deep rumble for the gale's warm flare
    const rn = v.noise();
    const rf = v.filter('lowpass', 140, 0.7);
    const rg = v.g(0);
    rn.connect(rf); rf.connect(rg); rg.connect(v.group);
    v.fadeIn(1, 1);
    let nextBell = 0, lastTurn = -9;
    return {
      tick() {
        const s = P.state, now = A.t();
        const pres = s.pres || 0, dens = s.dens || 0, heading = s.head || 0;
        const tp = s.turnPulse || 0, warm = s.warmT || 0, breath = s.breath || 0;
        const gate = 0.3 + 0.7 * pres;
        const az = Math.sin(heading);
        // idle floor: undulating, low, never repeating (lure doctrine)
        const tt = s.tNow || 0;
        const floorAmt = Math.max(0.05, 0.17 + 0.1 * Math.sin(tt * 0.029) + 0.07 * Math.sin(tt * 0.016 + 2.1));
        const idleAmb = (1 - pres) * Math.min(1, floorAmt + 0.9 * breath);
        // wind: the played weather + the idle lure share one voice
        A.set(ng.gain, (0.014 + dens * 0.09 + tp * 0.022) * pres + 0.03 * idleAmb, 0.25);
        A.set(f.frequency, 260 + (dens * 3200 + tp * 1300) * pres + breath * 600 + warm * 800, 0.2);
        if (pan) A.set(pan.pan, az * 0.7, 0.3);
        // the floor: lows always breathe with amb, mids need hands
        const amb = Math.min(1, pres + idleAmb);
        bedLo.forEach(p => { p.level((0.011 + dens * 0.012) * amb, 0.5); p.bright(240 + dens * 400, 0.4); });
        bedMid.forEach(p => { p.level((0.013 + dens * 0.02) * pres, 0.5); p.bright(480 + dens * 900, 0.4); });
        A.set(subG.gain, (0.014 + dens * 0.014 + warm * 0.02) * amb, 0.5);
        A.set(sub2G.gain, (0.007 + dens * 0.008) * amb, 0.5);
        // THE GALE ROARS: rumble arrives with the visual warm flare
        A.set(rg.gain, warm * 0.1 * gate, 0.3);
        A.set(rf.frequency, 110 + warm * 260, 0.4);
        // BELLS ON GUST TIME: interval drawn from density, min-gap, spread -
        // weather, never a metronome. Silent for an empty room.
        if (pres > 0.2 && dens > 0.1) {
          if (!nextBell || nextBell < now - 2) nextBell = now + 0.4;
          if (now >= nextBell) {
            const deg = Math.round((heading / TAU) * 7);
            const oct = dens > 0.55 ? 0 : -1;
            const vol = Math.min(0.15, 0.028 + dens * 0.12) * (0.7 + Math.random() * 0.6) * (1 + tp * 0.5);
            A.bell(H.scaleTone(deg, oct), { vol, dur: 2.4, pan: az * 0.8, rev: 0.68 });
            const mean = 0.9 + (1 - dens) * 4.6;
            nextBell = now + Math.max(0.8, mean * (0.55 + Math.random() * 0.9));
          }
        } else nextBell = 0;
        // REACTIVE: a hard heading turn cracks the air, immediately
        if (tp > 0.55 && now - lastTurn > 0.6 && pres > 0.2) {
          lastTurn = now;
          A.hit({ vol: 0.045 + tp * 0.05, dur: 0.25, freq: 900 + dens * 1500, q: 1.4 });
          A.bell(H.scaleTone(Math.round((heading / TAU) * 7), 0), { vol: 0.05 + tp * 0.06, dur: 1.6, pan: az * 0.8, rev: 0.5 });
        }
        MOut.expr('texture', dens);
        MOut.expr('bells', dens);
        MOut.expr('sfx', warm);
      },
      stop() { v.kill(); }
    };
  }
});
