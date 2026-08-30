/* ---------- SRC-50.5 · SILK NOVA V5 · THE LOOM (the motion is real) ----------
   Artist C's take in the three-artist variation round on Nima's chiffon
   reference. V1/V2 faked the dance with sines; here the silk is SIMULATED.

   Every ribbon is a verlet chain of 32 particles anchored at the knot:
   distance constraints keep it silk-taut, a rest-pose spring (stiff at the
   root, nearly free at the tip) remembers the woven flower — the same
   interleaved S-sweep layout the family owns, so at rest the tangle still
   reads — and light damping makes every disturbance settle like fabric,
   not rope. The music is not a modulator here, it is WEATHER:
   · the KICK is an impulse struck into the root of every chain (per-arm
     phase sign, so the flower dances rather than flinches) — the wave that
     runs to the tip is free, produced by the constraints themselves, and
     the settle afterwards is physically honest;
   · BASS is a slow swinging wind that leans the whole field;
   · TREBLE is fine turbulence that only the free ends feel;
   · MIDS lengthen the rest pose — the flower reaches when the music fills.
   The sim runs on a fixed 1/120s accumulator (≤3 substeps a frame), with a
   per-substep speed cap and a soft radial fence, so a dropped frame or a
   hard drop state cannot detonate it. A kick's true age (≤0.2s) is not
   rewindable in a simulation; the impulse lands on the frame the hit is
   known, which the ~5ms time-domain scanner keeps honest.

   Hands (the audio-in law): LEFT = sensitivity gain on the bands. RIGHT =
   THE CURRENT — a continuous vortex force: lean in and the whole flower
   swirls around the knot like silk in stirred water, release and it
   relaxes back radial. Hand SPEED paints: orange breathed into the core by
   a fast left hand, violet into the tips by a fast right.
   Makes no sound of its own. ------ */

const SL_ARMS = 20, SL_PTS = 32, SL_STR = 9;
const SL_H = 1 / 120;                // fixed sim timestep
const SL_SILK = [232, 228, 216];
const SL_CORE = [255, 176, 96];
const SL_TIP  = [176, 128, 255];

reg({
  id: 'SRC-50.5', family: 'SRC-50', ver: 5, title: 'Silk Nova V5', tech: 'VERLET SILK SIMULATION / AUDIO AS WEATHER',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'RIBBONS', 'SIMULATED', 'KICK IS AN IMPULSE', 'VORTEX HAND', 'SILK'],
  desc: 'The silk flower as a real simulation: every ribbon is a chain of particles anchored at the knot, remembering the woven rest pose through soft springs. The music is weather — the kick strikes the root of every chain and the wave that runs to the tip is free, made by the physics; bass is a slow wind leaning the whole field; treble is turbulence only the loose ends feel; the mids let the flower reach. Nothing is scripted: every hit travels, every settle is honest fabric.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in). RIGHT hand is the current — lean in and the whole flower swirls around the knot like silk in stirred water; release and it relaxes back radial. LEFT hand is sensitivity, placid to violent. The hands also paint by MOVING: a fast left hand breathes orange into the core, a fast right hand violet into the tips.',
  sound: 'Makes no sound of its own — an audio-in scene. Connect a source (mic, line-in, or CAPTURE APP AUDIO) in MAP → Audio in, then SET REST with the room quiet. Wants a kick under a bassline: every hit is struck into the silk and you watch it travel out.',

  init(P) {
    const s = {
      pres: 0, life: 0, acc: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, flux: 0,
      _prevBass: 0, _prevMid: 0, _prevTreble: 0,
      reach: 0.45, swirl: 0, eL: 0, eR: 0, rot: P.rand() * TAU, pan: 0,
      velL: 0, velR: 0, _pL: -1, _pR: -1,
      kickFlash: 0, maxV: 0,
      _kN: -1, _kGap: 1, _prevOnset: 0, LEAD: 0.030, _kAge: 0, _kStr: 0, _kicks: 0,
      arms: []
    };
    for (let i = 0; i < SL_ARMS; i++) {
      const strands = [];
      for (let j = 0; j < SL_STR; j++) {
        strands.push({ ph: P.rand() * TAU, wf: 4 + P.rand() * 6, sp: 0.25 + P.rand() * 0.4, end: 0.84 + P.rand() * 0.16 });
      }
      s.arms.push({
        a0: (i + (P.rand() - 0.5) * 1.4) / SL_ARMS * TAU,
        len: 0.68 + P.rand() * 0.46,
        dir: P.rand() < 0.5 ? -1 : 1,
        A1: 0.34 + P.rand() * 0.20, w1: 1.4 + P.rand() * 1.8, p1: P.rand() * TAU, s1: 0.08 + P.rand() * 0.10,
        A2: 0.08, w2: 3.0 + P.rand() * 2.0, p2: P.rand() * TAU, s2: 0.05 + P.rand() * 0.09,
        wph: P.rand() * TAU,
        wid: 0.70 + P.rand() * 0.55,
        strands,
        // sim state (px, relative to the canvas center) + scratch
        x: new Float32Array(SL_PTS), y: new Float32Array(SL_PTS),
        ox: new Float32Array(SL_PTS), oy: new Float32Array(SL_PTS),
        rx: new Float32Array(SL_PTS), ry: new Float32Array(SL_PTS),
        rl: new Float32Array(SL_PTS),
        nx: new Float32Array(SL_PTS), ny: new Float32Array(SL_PTS)
      });
    }
    P.state = s;
    // seed the chains ON their rest pose so the first frame is the flower
    const mn = Math.min(P.w, P.h);
    for (const arm of s.arms) {
      SL_REST(s, arm, mn);
      arm.x.set(arm.rx); arm.y.set(arm.ry);
      arm.ox.set(arm.rx); arm.oy.set(arm.ry);
    }
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;
    const mn = Math.min(P.w, P.h);

    // hand speed → paint envelopes: snap up with the gesture, fade over ~2s
    const L = clamp(inp.L), R = clamp(inp.R);
    if (s._pL < 0) { s._pL = L; s._pR = R; }
    const dtc = Math.max(dt, 1e-3);
    const vL = clamp(Math.abs(L - s._pL) / dtc * 0.55), vR = clamp(Math.abs(R - s._pR) / dtc * 0.55);
    s._pL = L; s._pR = R;
    s.velL += (vL - s.velL) * Math.min(1, dt * (vL > s.velL ? 24 : 0.9));
    s.velR += (vR - s.velR) * Math.min(1, dt * (vR > s.velR ? 24 : 0.9));

    // hands couple fast (dt*6): left = sensitivity gain, right = the current
    s.eL += (L - s.eL) * Math.min(1, dt * 6);
    s.eR += (R - s.eR) * Math.min(1, dt * 6);
    s.swirl += (s.eR - s.swirl) * Math.min(1, dt * 6);
    const sens = 0.85 + s.eL * 1.5;

    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += ((handLive || audioLive ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    // slow bands, sensitivity-gained, with the idle breath under silence
    const idle = 0.035 + 0.018 * Math.sin(s.life * 0.21);
    const bT = Math.max(idle * (1 - s.pres), clamp(inp.audio.bass * sens));
    const mT = Math.max(idle * 0.8 * (1 - s.pres), clamp(inp.audio.mid * sens));
    const tT = Math.max(idle * (1 - s.pres), clamp(inp.audio.treble * sens));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 1.5 : 0.9));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 1.5 : 0.9));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 1.5 : 0.9));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);

    // reach = the mids, growth quicker than the melt
    const reachT = 0.42 + 0.55 * s.mid;
    s.reach += (reachT - s.reach) * Math.min(1, dt * (reachT > s.reach ? 2.2 : 0.7));

    // flux off the slow bands
    const fluxRaw = (Math.abs(s.bass - s._prevBass) + Math.abs(s.mid - s._prevMid) + Math.abs(s.treble - s._prevTreble)) / dtc;
    s._prevBass = s.bass; s._prevMid = s.mid; s._prevTreble = s.treble;
    const fluxT = clamp(fluxRaw * 0.6);
    s.flux += (fluxT - s.flux) * Math.min(1, dt * (fluxT > s.flux ? 4 : 1.5));

    s.rot += dt * (0.014 + 0.04 * s.flux + 0.05 * s.swirl);
    s.pan += (clamp(inp.audio.pan, -1, 1) - s.pan) * Math.min(1, dt * 1.2);

    // THE KICK (V2's reader): a new hit is n CHANGING; onset edge fallback.
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetRaw = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    if (edge && s._kGap > 0.09) {
      s._kGap = 0; s._kAge = age; s._kStr = hit; s._kicks++;
      s.kickFlash = Math.max(s.kickFlash, hit);
      // STRIKE the root of every chain: a one-time velocity added to the
      // first free particles, tangential, sign alternating by arm phase —
      // the chain constraints carry it outward, nothing else is scripted.
      const V = hit * mn * 0.52;
      for (const arm of s.arms) {
        const sign = Math.sin(arm.wph * 3 + s._kicks * 1.7) > 0 ? 1 : -1;
        for (let kk = 1; kk <= 5; kk++) {
          const fall = 1 - (kk - 1) / 5;
          const rr = Math.hypot(arm.x[kk], arm.y[kk]) || 1;
          const tx = -arm.y[kk] / rr, ty = arm.x[kk] / rr;
          arm.ox[kk] -= tx * sign * V * fall * SL_H;
          arm.oy[kk] -= ty * sign * V * fall * SL_H;
        }
      }
    }
    s.kickFlash -= s.kickFlash * Math.min(1, dt * 3.4);

    /* ---- THE SIM: fixed 1/120s substeps, capped at 3 a frame ---- */
    s.acc = Math.min(s.acc + dt, 3.5 * SL_H);
    // rest pose + segment lengths once per frame (it drifts slowly)
    for (const arm of s.arms) SL_REST(s, arm, mn);
    const damp = 0.965;
    const vCap = mn * 0.011;                 // per-substep speed cap
    const fence = mn * 0.62;                 // soft radial fence
    const windA = mn * (0.05 + 0.85 * s.bass);
    const windPh = s.life * 0.42;
    const turbA = mn * 1.5 * s.treble;
    const swirlA = mn * 0.9 * s.swirl;
    let maxV = 0;
    while (s.acc >= SL_H) {
      s.acc -= SL_H;
      for (const arm of s.arms) {
        const X = arm.x, Y = arm.y, OX = arm.ox, OY = arm.oy, RX = arm.rx, RY = arm.ry;
        for (let kk = 2; kk < SL_PTS; kk++) {
          const u = kk / (SL_PTS - 1);
          // spring back to the remembered flower — root stiff, tip free
          const kS = 30 * (1 - 0.78 * u);
          let fx = (RX[kk] - X[kk]) * kS, fy = (RY[kk] - Y[kk]) * kS;
          const rr = Math.hypot(X[kk], Y[kk]) || 1;
          const tx = -Y[kk] / rr, ty = X[kk] / rr;
          // bass wind: a slow swing of the whole field
          const wsw = Math.sin(windPh + u * 1.6 + arm.wph);
          fx += tx * windA * wsw; fy += ty * windA * wsw;
          // treble turbulence: only the free ends feel it
          const tb = Math.sin(s.life * 6.3 + kk * 1.9 + arm.p1 * 4.1);
          fx += tx * turbA * u * u * tb; fy += ty * turbA * u * u * tb;
          // the current (right hand): one-direction vortex
          fx += tx * swirlA * (0.3 + 0.7 * u); fy += ty * swirlA * (0.3 + 0.7 * u);
          // verlet with damping + speed cap
          let vx = (X[kk] - OX[kk]) * damp + fx * SL_H * SL_H;
          let vy = (Y[kk] - OY[kk]) * damp + fy * SL_H * SL_H;
          const sp = Math.hypot(vx, vy);
          if (sp > vCap) { vx *= vCap / sp; vy *= vCap / sp; }
          if (sp > maxV) maxV = sp;
          OX[kk] = X[kk]; OY[kk] = Y[kk];
          X[kk] += vx; Y[kk] += vy;
          // soft radial fence
          const r2 = Math.hypot(X[kk], Y[kk]);
          if (r2 > fence) { X[kk] *= fence / r2; Y[kk] *= fence / r2; }
        }
        // pins: the knot end holds the rest pose exactly
        X[0] = RX[0]; Y[0] = RY[0]; OX[0] = RX[0]; OY[0] = RY[0];
        X[1] = RX[1]; Y[1] = RY[1]; OX[1] = RX[1]; OY[1] = RY[1];
        // distance constraints: 3 relaxation passes keep it silk-taut
        for (let it = 0; it < 3; it++) {
          for (let kk = 1; kk < SL_PTS; kk++) {
            const dx = X[kk] - X[kk - 1], dy = Y[kk] - Y[kk - 1];
            const d = Math.hypot(dx, dy) || 1e-4;
            const diff = (d - arm.rl[kk]) / d;
            const wA = kk === 1 ? 0 : 0.5, wB = kk === 1 ? 1 : 0.5;
            X[kk - 1] += dx * diff * wA; Y[kk - 1] += dy * diff * wA;
            X[kk] -= dx * diff * wB; Y[kk] -= dy * diff * wB;
          }
        }
      }
    }
    s.maxV = maxV / SL_H;                    // px/s, for the HUD
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const mn = Math.min(w, h), cx = w / 2, cy = h / 2;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.lineWidth = 1.35 * ms;

    const coreEnv = clamp(s.bass + s.kickFlash * 0.7);
    const aBase = 0.078 + 0.05 * s.energy + 0.028 * s.pres;
    const coreC = SL_MIXC(SL_MIXC(SL_SILK, SL_CORE, 0.35 + 0.4 * s.bass), SL_CORE, s.velL);
    const tipC = SL_MIXC(SL_MIXC(SL_SILK, SL_TIP, 0.25 + 0.35 * s.treble), SL_TIP, s.velR);

    for (const arm of s.arms) {
      // normals from the SIMULATED positions
      for (let kk = 0; kk < SL_PTS; kk++) {
        const k0 = Math.max(0, kk - 1), k1 = Math.min(SL_PTS - 1, kk + 1);
        const dx = arm.x[k1] - arm.x[k0], dy = arm.y[k1] - arm.y[k0];
        const dl = Math.hypot(dx, dy) || 1;
        arm.nx[kk] = -dy / dl; arm.ny[kk] = dx / dl;
      }
      const gain = 1 + 0.22 * s.pan * Math.cos(arm.a0 + s.rot);
      const a = clamp(aBase * gain, 0.02, 0.3);
      const gx0 = cx + arm.x[0], gy0 = cy + arm.y[0];
      const gx1 = cx + arm.x[SL_PTS - 1], gy1 = cy + arm.y[SL_PTS - 1];
      const grad = g.createLinearGradient(gx0, gy0, gx1, gy1);
      grad.addColorStop(0, SL_RGBAC(coreC, a * (0.5 + 0.7 * coreEnv)));
      grad.addColorStop(0.32, SL_RGBAC(SL_SILK, a));
      grad.addColorStop(0.70, SL_RGBAC(SL_MIXC(SL_SILK, tipC, 0.5), a * 0.9));
      grad.addColorStop(1, SL_RGBAC(tipC, a * (0.4 + 1.1 * s.treble + 0.6 * s.velR)));
      g.strokeStyle = grad;

      for (let j = 0; j < SL_STR; j++) {
        const st = arm.strands[j];
        const sj = (j / (SL_STR - 1)) * 2 - 1;
        g.beginPath();
        let started = false, lx = 0, ly = 0;
        for (let kk = 0; kk < SL_PTS; kk++) {
          const u = kk / (SL_PTS - 1);
          if (u > st.end) break;
          const env = 0.30 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.7);
          let halfW = mn * 0.040 * arm.wid * env + mn * 0.016 * u * u * (0.2 + 2.4 * s.treble);
          const tail = Math.min(1, (st.end - u) / 0.16);
          halfW *= tail * tail * (3 - 2 * tail);
          const sjE = Math.sign(sj) * Math.pow(Math.abs(sj), 0.62);
          const weave = 0.32 * (1 - Math.abs(sj)) * Math.sin(u * st.wf + st.ph + s.life * st.sp);
          const off = halfW * (sjE + weave);
          const x = cx + arm.x[kk] + arm.nx[kk] * off, y = cy + arm.y[kk] + arm.ny[kk] * off;
          // midpoint-quadratic smoothing: 32 sim points render as one curve
          if (!started) { g.moveTo(x, y); started = true; }
          else g.quadraticCurveTo(lx, ly, (lx + x) / 2, (ly + y) / 2);
          lx = x; ly = y;
        }
        if (started) { g.lineTo(lx, ly); g.stroke(); }
      }
    }

    // the knot
    const coreR = mn * (0.038 + 0.055 * coreEnv);
    const cg = g.createRadialGradient(cx, cy, coreR * 0.08, cx, cy, coreR);
    const knotC = SL_MIXC(SL_MIXC(SL_SILK, SL_CORE, 0.3 + 0.5 * s.bass), SL_CORE, s.velL);
    cg.addColorStop(0, SL_RGBAC(knotC, 0.14 + 0.55 * coreEnv));
    cg.addColorStop(0.55, SL_RGBAC(knotC, 0.05 + 0.26 * coreEnv));
    cg.addColorStop(1, SL_RGBAC(knotC, 0));
    g.fillStyle = cg;
    g.beginPath(); g.arc(cx, cy, coreR, 0, TAU); g.fill();

    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,200,150,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('CORE(bass) ' + Math.round(s.bass * 100) + '   REACH(mid) ' + Math.round(s.reach * 100) +
      '   TIPS(treble) ' + Math.round(s.treble * 100) + '   CURRENT ' + Math.round(s.swirl * 100) +
      '   SENS ' + Math.round((0.85 + s.eL * 1.5) * 100) +
      '   KICK ' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' str ' + Math.round(s._kStr * 100) +
      '   SIM vmax ' + Math.round(s.maxV) + 'px/s' +
      '   SPEED L ' + Math.round(s.velL * 100) + ' R ' + Math.round(s.velR * 100) +
      '   PAN ' + s.pan.toFixed(2) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});

// the remembered flower: V2's interleaved S-sweep layout as a REST POSE,
// recomputed each frame (it drifts slowly), relative to the canvas center
function SL_REST(s, arm, mn) {
  const maxR = mn * 0.57;
  const armLen = maxR * arm.len * (0.5 + 0.5 * s.reach);
  const swing = 0.55 + 0.9 * s.bass;
  for (let kk = 0; kk < SL_PTS; kk++) {
    const u = kk / (SL_PTS - 1);
    const inner = Math.exp(-u * 2.6);
    const wWin = 0.1 + 0.9 * Math.sin(Math.min(u * 1.45, 1) * Math.PI);
    const wander =
      (arm.A1 * Math.sin(u * arm.w1 + arm.p1 + s.life * arm.s1) +
       arm.A2 * Math.sin(u * arm.w2 - arm.p2 + s.life * arm.s2)) *
      wWin * (1 + (swing - 1) * inner);
    const ang = arm.a0 + s.rot + wander + arm.dir * 0.85 * Math.exp(-u * 3.2);
    const r = Math.pow(u, 0.85) * armLen;
    arm.rx[kk] = Math.cos(ang) * r;
    arm.ry[kk] = Math.sin(ang) * r;
    arm.rl[kk] = kk === 0 ? 0 : Math.hypot(arm.rx[kk] - arm.rx[kk - 1], arm.ry[kk] - arm.ry[kk - 1]);
  }
}
function SL_MIXC(a, b, t) {
  t = clamp(t);
  return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
}
function SL_RGBAC(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`; }
