/* ---------- SRC-50.4 · SILK NOVA V4 · THE ETCHING (moiré is the material) ----------
   Artist B's take in the three-artist silk round. The reference plate is an
   ENGRAVING at heart: every ribbon is a family of thirty-odd near-parallel
   fine strands whose parameters drift apart just slightly, so the picture is
   not drawn lines but INTERFERENCE — bright rails where a family bunches,
   shimmering moiré where two families cross at a shallow angle. This version
   commits to that completely: every strand is almost invisible on its own
   (alpha ≈ 0.05); everything you see is accumulation. The whole tangle is
   drawn additively into a reduced-resolution offscreen and scaled up, which
   both buys the strand budget (700+ strokes a frame) and melts the lines
   into silk instead of wire.

   The layout keeps the family's proven anatomy: S-sweeps peaking MID-arm
   (knot → tangle → clean flying tips), coil at the core, per-strand tapered
   ends. The kick is a transverse ripple IN PIXELS travelling core→tip
   (never an angle, never a colour), the stream undulates continuously, and
   the spectrum reads inside-out — bass warms and swells the knot, mids set
   the reach, treble splays the tip families apart so the moiré combs open.

   Hands per the audio-in law: LEFT = sensitivity gain on the bands;
   RIGHT = the coil, continuous and immediate. Hand SPEED paints: orange
   breathed into the core end of every family, violet into the live tips.
   Makes no sound of its own. ------ */

const SE_ARMS = 22, SE_STR = 32, SE_SEG = 44;
const SE_PSPD = 1.7;                 // ripple speed: core→tip in ~0.6s
const SE_DS = 0.62;                  // offscreen accumulation scale
const SE_SILK = [232, 228, 216];
const SE_CORE = [255, 176, 96];
const SE_TIP  = [176, 128, 255];
const SE_MIX = (a, b, t) => {
  t = clamp(t);
  return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
};
const SE_RGBA = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;

reg({
  id: 'SRC-50.4', family: 'SRC-50', ver: 4, title: 'Silk Nova V4', tech: 'ETCHED MOIRÉ FAMILIES / ADDITIVE ACCUMULATION',
  audioIn: true,
  fx: { bloom: 0.24 },
  tags: ['AUDIO IN', 'RIBBONS', 'MOIRÉ', 'ETCHING', 'KICK IS A WAVE', 'SILK'],
  desc: 'The plate as an engraving: every ribbon is a family of thirty near-parallel hair-fine strands, each one almost invisible — the picture is pure accumulation, bright rails where a family bunches, live moiré where two families cross. Bass warms and swells the knot, mids reach the arms out, treble combs the tip families open. A kick is a ripple of displacement that runs the length of every family and sets the interference shimmering.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in). RIGHT hand is the coil — lean in and the families wind tighter around the knot. LEFT hand is sensitivity, placid to violent. Moving a hand fast paints: left breathes orange into the core, right breathes violet into the tips; stillness leaves the cream etching.',
  sound: 'Makes no sound of its own — an audio-in scene. Connect a source (mic, line-in, or CAPTURE APP AUDIO) in MAP → Audio in, then SET REST with the room quiet. Wants a full spectrum: kick under a bassline, a bright top to open the combs.',

  init(P) {
    const s = {
      pres: 0, life: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, flux: 0,
      _prevBass: 0, _prevMid: 0, _prevTreble: 0,
      reach: 0.45, coil: 0, eL: 0, eR: 0, rot: P.rand() * TAU, pan: 0,
      velL: 0, velR: 0, _pL: -1, _pR: -1,
      pulses: [], _kN: -1, _kGap: 1, _prevOnset: 0, LEAD: 0.030, _kAge: 0, _kStr: 0,
      off: null, arms: []
    };
    for (let i = 0; i < SE_ARMS; i++) {
      const strands = [];
      for (let j = 0; j < SE_STR; j++) {
        const r = (j / (SE_STR - 1)) * 2 - 1;
        strands.push({
          // edge-biased seat in the family: the fold's dark rails
          b: Math.sign(r) * Math.pow(Math.abs(r), 0.72),
          // near-parallel drift: frequencies CLOSE, phases spread — the moiré
          wf: 2.6 + j * 0.055 + P.rand() * 0.5,
          ph: P.rand() * TAU,
          sp: 0.10 + P.rand() * 0.22,
          end: 0.72 + P.rand() * 0.28
        });
      }
      s.arms.push({
        a0: (i + (P.rand() - 0.5) * 1.4) / SE_ARMS * TAU,
        len: 0.66 + P.rand() * 0.48,
        dir: P.rand() < 0.5 ? -1 : 1,
        A1: 0.32 + P.rand() * 0.20, w1: 1.4 + P.rand() * 1.6, p1: P.rand() * TAU, s1: 0.07 + P.rand() * 0.09,
        A2: 0.07, w2: 3.0 + P.rand() * 1.8, p2: P.rand() * TAU, s2: 0.05 + P.rand() * 0.08,
        wph: P.rand() * TAU,
        wid: 0.72 + P.rand() * 0.5,
        strands,
        px: new Float32Array(SE_SEG + 1), py: new Float32Array(SE_SEG + 1),
        nx: new Float32Array(SE_SEG + 1), ny: new Float32Array(SE_SEG + 1)
      });
    }
    P.state = s;
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;

    const L = clamp(inp.L), R = clamp(inp.R);
    if (s._pL < 0) { s._pL = L; s._pR = R; }
    const dtc = Math.max(dt, 1e-3);
    const vL = clamp(Math.abs(L - s._pL) / dtc * 0.55), vR = clamp(Math.abs(R - s._pR) / dtc * 0.55);
    s._pL = L; s._pR = R;
    s.velL += (vL - s.velL) * Math.min(1, dt * (vL > s.velL ? 24 : 0.9));
    s.velR += (vR - s.velR) * Math.min(1, dt * (vR > s.velR ? 24 : 0.9));

    s.eL += (L - s.eL) * Math.min(1, dt * 6);
    s.eR += (R - s.eR) * Math.min(1, dt * 6);
    s.coil += (s.eR - s.coil) * Math.min(1, dt * 6);
    const sens = 0.85 + s.eL * 1.5;

    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += ((handLive || audioLive ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    const idle = 0.035 + 0.018 * Math.sin(s.life * 0.21);
    const bT = Math.max(idle * (1 - s.pres), clamp(inp.audio.bass * sens));
    const mT = Math.max(idle * 0.8 * (1 - s.pres), clamp(inp.audio.mid * sens));
    const tT = Math.max(idle * (1 - s.pres), clamp(inp.audio.treble * sens));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 1.5 : 0.9));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 1.5 : 0.9));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 1.5 : 0.9));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);

    const reachT = 0.42 + 0.55 * s.mid;
    s.reach += (reachT - s.reach) * Math.min(1, dt * (reachT > s.reach ? 2.2 : 0.7));

    const fluxRaw = (Math.abs(s.bass - s._prevBass) + Math.abs(s.mid - s._prevMid) + Math.abs(s.treble - s._prevTreble)) / dtc;
    s._prevBass = s.bass; s._prevMid = s.mid; s._prevTreble = s.treble;
    const fluxT = clamp(fluxRaw * 0.6);
    s.flux += (fluxT - s.flux) * Math.min(1, dt * (fluxT > s.flux ? 4 : 1.5));

    s.rot += dt * (0.016 + 0.05 * s.flux + 0.02 * s.coil);
    s.pan += (clamp(inp.audio.pan, -1, 1) - s.pan) * Math.min(1, dt * 1.2);

    // THE KICK: time-domain scanner when it exists (a new hit is n CHANGING),
    // onset's rising edge as the fallback; back-date by true age + lead.
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
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      if (s.pulses.length >= 5) s.pulses.shift();
      s.pulses.push({ u: (age + s.LEAD) * SE_PSPD, str: hit });
    }
    for (let i = s.pulses.length - 1; i >= 0; i--) {
      const p = s.pulses[i];
      p.u += dt * SE_PSPD;
      if (p.u > 1.35) s.pulses.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const mn = Math.min(w, h), cx = w / 2, cy = h / 2;

    // the accumulation plate: reduced-res offscreen, additive, scaled up —
    // this is what turns 700 hair-lines into silk instead of wire
    const ow = Math.max(2, Math.round(w * SE_DS)), oh = Math.max(2, Math.round(h * SE_DS));
    if (!s.off || s.off.width !== ow || s.off.height !== oh) {
      s.off = document.createElement('canvas');
      s.off.width = ow; s.off.height = oh;
    }
    const og = s.off.getContext('2d');
    og.setTransform(1, 0, 0, 1, 0, 0);
    og.globalCompositeOperation = 'source-over';
    og.clearRect(0, 0, ow, oh);
    og.setTransform(SE_DS, 0, 0, SE_DS, 0, 0);
    og.globalCompositeOperation = 'lighter';
    og.lineWidth = 1.05 * ms;

    let coreKick = 0;
    for (const p of s.pulses) coreKick += p.str * Math.exp(-p.u * p.u * 18);
    const coreEnv = clamp(s.bass + coreKick * 0.7);

    // each strand is nearly invisible; the family is the mark
    const aStr = 0.042 + 0.030 * s.energy + 0.012 * s.pres;
    const coreC = SE_MIX(SE_MIX(SE_SILK, SE_CORE, 0.35 + 0.4 * s.bass), SE_CORE, s.velL);
    const tipC = SE_MIX(SE_MIX(SE_SILK, SE_TIP, 0.25 + 0.35 * s.treble), SE_TIP, s.velR);
    const maxR = mn * 0.56;
    const swing = 0.55 + 1.3 * s.bass;
    const coilAmt = (0.85 + 2.5 * s.coil);
    const streamAmp = mn * (0.008 + 0.020 * s.energy);
    const streamPh = s.life * (0.55 + 1.6 * s.bass);
    // treble combs the families open at the tips
    const combT = 0.25 + 2.2 * s.treble;

    for (const arm of s.arms) {
      const armLen = maxR * arm.len * (0.5 + 0.5 * s.reach);
      for (let kk = 0; kk <= SE_SEG; kk++) {
        const u = kk / SE_SEG;
        const inner = Math.exp(-u * 2.6);
        const wWin = 0.1 + 0.9 * Math.sin(Math.min(u * 1.45, 1) * Math.PI);
        const wander =
          (arm.A1 * Math.sin(u * arm.w1 + arm.p1 + s.life * arm.s1) +
           arm.A2 * Math.sin(u * arm.w2 - arm.p2 + s.life * arm.s2)) *
          wWin * (1 + (swing - 1) * inner);
        const ang = arm.a0 + s.rot + wander + arm.dir * coilAmt * Math.exp(-u * 3.2);
        const r = Math.pow(u, 0.85) * armLen;
        arm.px[kk] = cx + Math.cos(ang) * r;
        arm.py[kk] = cy + Math.sin(ang) * r;
      }
      for (let kk = 0; kk <= SE_SEG; kk++) {
        const k0 = Math.max(0, kk - 1), k1 = Math.min(SE_SEG, kk + 1);
        const dx = arm.px[k1] - arm.px[k0], dy = arm.py[k1] - arm.py[k0];
        const dl = Math.hypot(dx, dy) || 1;
        arm.nx[kk] = -dy / dl; arm.ny[kk] = dx / dl;
      }
      // transverse waves in PIXELS ride the normals: the stream, and the
      // kick's travelling ripple — the same amplitude at knot and tip
      for (let kk = 0; kk <= SE_SEG; kk++) {
        const u = kk / SE_SEG;
        let T = streamAmp * Math.sin(u * 5.5 - streamPh + arm.wph) * (0.25 + 0.75 * u);
        for (const p of s.pulses) {
          const d = u - p.u;
          if (d < -0.42 || d > 0.42) continue;
          T += p.str * mn * 0.040 * Math.exp(-d * d * 26) * Math.sin(d * 8 + arm.wph) * (0.3 + 0.7 * u);
        }
        arm.px[kk] += arm.nx[kk] * T;
        arm.py[kk] += arm.ny[kk] * T;
      }

      const gain = 1 + 0.22 * s.pan * Math.cos(arm.a0 + s.rot);
      const a = clamp(aStr * gain, 0.015, 0.14);
      const grad = og.createLinearGradient(arm.px[0], arm.py[0], arm.px[SE_SEG], arm.py[SE_SEG]);
      grad.addColorStop(0, SE_RGBA(coreC, a * (0.8 + 1.0 * coreEnv)));
      grad.addColorStop(0.35, SE_RGBA(SE_SILK, a));
      grad.addColorStop(1, SE_RGBA(tipC, a * (0.55 + 0.9 * s.treble + 0.5 * s.velR)));
      og.strokeStyle = grad;

      // THE FAMILY: near-parallel strands, edge-biased, drifting apart just
      // enough to interfere. One stroke per strand — accumulation is the ink.
      const baseW = mn * 0.050 * arm.wid;
      for (let j = 0; j < SE_STR; j++) {
        const st = arm.strands[j];
        og.beginPath();
        for (let kk = 0; kk <= SE_SEG; kk++) {
          const u = kk / SE_SEG;
          if (u > st.end) break;
          const env = 0.30 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.7);
          let halfW = baseW * env + mn * 0.014 * u * u * combT;
          const tail = Math.min(1, (st.end - u) / 0.30);
          halfW *= tail * tail * (3 - 2 * tail);
          // the drift that makes the moiré: slow, small, per-strand
          const drift = 0.13 * (1 - Math.abs(st.b) * 0.55) *
            Math.sin(u * st.wf + st.ph + s.life * st.sp);
          const off = halfW * (st.b + drift);
          const x = arm.px[kk] + arm.nx[kk] * off, y = arm.py[kk] + arm.ny[kk] * off;
          if (kk === 0) og.moveTo(x, y); else og.lineTo(x, y);
        }
        og.stroke();
      }
    }

    // composite the plate, then the knot glow at full resolution
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.drawImage(s.off, 0, 0, ow, oh, 0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    const coreR = mn * (0.050 + 0.085 * coreEnv);
    const cg = g.createRadialGradient(cx, cy, coreR * 0.08, cx, cy, coreR);
    const knotC = SE_MIX(SE_MIX(SE_SILK, SE_CORE, 0.3 + 0.5 * s.bass), SE_CORE, s.velL);
    cg.addColorStop(0, SE_RGBA(knotC, 0.18 + 0.8 * coreEnv));
    cg.addColorStop(0.55, SE_RGBA(knotC, 0.08 + 0.4 * coreEnv));
    cg.addColorStop(1, SE_RGBA(knotC, 0));
    g.fillStyle = cg;
    g.beginPath(); g.arc(cx, cy, coreR, 0, TAU); g.fill();

    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,200,150,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('CORE(bass) ' + Math.round(s.bass * 100) + '   REACH(mid) ' + Math.round(s.reach * 100) +
      '   TIPS(treble) ' + Math.round(s.treble * 100) + '   COIL ' + Math.round(s.coil * 100) +
      '   SENS ' + Math.round((0.85 + s.eL * 1.5) * 100) +
      '   KICK ' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' str ' + Math.round(s._kStr * 100) +
      '   WAVES ' + s.pulses.length +
      '   STRANDS ' + (SE_ARMS * SE_STR) +
      '   SPEED L ' + Math.round(s.velL * 100) + ' R ' + Math.round(s.velR * 100) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
