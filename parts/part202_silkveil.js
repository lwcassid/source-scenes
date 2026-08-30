/* ---------- SRC-50.3 · SILK NOVA V3 · THE VEIL (the fabric itself) ----------
   Artist A's take in the three-artist variation round on Nima's woven-silk
   reference. V1/V2 drew silk as bundles of stroked lines — wire, not cloth.
   THE VEIL draws the FABRIC: every ribbon is built from three translucent
   PANELS — filled quad-strip sheets that drift and lean inside the ribbon's
   width, crossing each other as they run out — so a ribbon is folded
   chiffon, and wherever panels overlap (inside one ribbon, or where two
   ribbons weave) the light doubles under 'lighter' compositing. That is the
   reference plate's overlap-darkening, inverted for scrim: crossings GLOW.
   Faint hairlines ride the sheets as texture; the sheet carries the picture.

   The engine is the family's: the spectrum laid out along the form (bass
   burns the knot and sways the inner body, mid reaches the arms, treble
   splays the panels apart at the tips into separated flags), the kick a
   transverse ripple in PIXELS that travels core→tip and rocks the sheets,
   a slow stream always flowing outward. LEFT hand = sensitivity. RIGHT
   hand = coil, winding the whole veil around the knot. Hand speed paints:
   orange breathed into the core, violet into the tips.
   Makes no sound of its own. ------ */

const SV3_ARMS = 20, SV3_SEG = 48, SV3_PAN = 3;
const SV3_PSPD = 1.7;
const SV3_SILK = [232, 228, 216];
const SV3_CORE = [255, 176, 96];
const SV3_TIP  = [176, 128, 255];

reg({
  id: 'SRC-50.3', family: 'SRC-50', ver: 3, title: 'Silk Nova V3', tech: 'THE VEIL / FILLED CHIFFON PANELS',
  audioIn: true,
  fx: { bloom: 0.30 },
  tags: ['AUDIO IN', 'RIBBONS', 'RADIAL', 'FILLED SHEETS', 'FOLDED CHIFFON', 'KICK IS A WAVE'],
  desc: 'The woven-silk flower as actual fabric: every ribbon is three translucent sheets folded inside one band, drifting across each other as they run from the knot, so the ribbon shows folds the way chiffon does — and wherever sheets cross, inside a ribbon or between two weaving ribbons, the light doubles. Bass burns the knot, mids reach the arms outward, treble splays the panels into separated flags at the tips. A kick is a ripple that travels the length of every sheet and rocks it in passing.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in). RIGHT hand is the coil — lean in and the whole veil winds tighter around the knot. LEFT hand is sensitivity, placid to violent. The hands also paint by MOVING: a fast left hand breathes orange into the core, a fast right hand breathes violet into the tips; stillness leaves cream silk.',
  sound: 'Makes no sound of its own — an audio-in scene. Connect a source (mic, line-in, or CAPTURE APP AUDIO) in MAP → Audio in, then SET REST with the room quiet. It wants a kick under a bassline; a bright top end fans the sheets apart.',

  init(P) {
    const s = {
      pres: 0, life: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, flux: 0,
      _prevBass: 0, _prevMid: 0, _prevTreble: 0,
      reach: 0.45, coil: 0, eL: 0, eR: 0, rot: P.rand() * TAU, pan: 0,
      velL: 0, velR: 0, _pL: -1, _pR: -1,
      pulses: [], _kN: -1, _kGap: 1, _prevOnset: 0, LEAD: 0.030, _kAge: 0, _kStr: 0,
      arms: []
    };
    for (let i = 0; i < SV3_ARMS; i++) {
      const panels = [];
      for (let j = 0; j < SV3_PAN; j++) {
        panels.push({
          base: (j - 1) * (0.52 + P.rand() * 0.14),
          f: 1.6 + P.rand() * 2.2, ph: P.rand() * TAU, sp: 0.12 + P.rand() * 0.16,
          g: 2.5 + P.rand() * 2.0, q: P.rand() * TAU, r: 0.08 + P.rand() * 0.12,
          th: 0.26 + P.rand() * 0.10,
          end: 0.80 + P.rand() * 0.20
        });
      }
      s.arms.push({
        a0: (i + (P.rand() - 0.5) * 1.4) / SV3_ARMS * TAU,
        len: 0.68 + P.rand() * 0.46,
        dir: P.rand() < 0.5 ? -1 : 1,
        A1: 0.30 + P.rand() * 0.18, w1: 1.4 + P.rand() * 1.8, p1: P.rand() * TAU, s1: 0.08 + P.rand() * 0.10,
        A2: 0.08, w2: 3.0 + P.rand() * 2.0, p2: P.rand() * TAU, s2: 0.05 + P.rand() * 0.09,
        wph: P.rand() * TAU,
        wid: 0.75 + P.rand() * 0.5,
        panels,
        px: new Float32Array(SV3_SEG + 1), py: new Float32Array(SV3_SEG + 1),
        nx: new Float32Array(SV3_SEG + 1), ny: new Float32Array(SV3_SEG + 1)
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
      s.pulses.push({ u: (age + s.LEAD) * SV3_PSPD, str: hit });
    }
    for (let i = s.pulses.length - 1; i >= 0; i--) {
      const p = s.pulses[i];
      p.u += dt * SV3_PSPD;
      if (p.u > 1.35) s.pulses.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const mn = Math.min(w, h), cx = w / 2, cy = h / 2;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';

    let coreKick = 0;
    for (const p of s.pulses) coreKick += p.str * Math.exp(-p.u * p.u * 18);
    const coreEnv = clamp(s.bass + coreKick * 0.7);

    // per-panel fill alpha: three panels stack to a soft sheet; crossings glow
    const aPan = 0.034 + 0.030 * s.energy + 0.014 * s.pres;
    const coreC = SV3_MIX(SV3_MIX(SV3_SILK, SV3_CORE, 0.35 + 0.4 * s.bass), SV3_CORE, s.velL);
    const tipC = SV3_MIX(SV3_MIX(SV3_SILK, SV3_TIP, 0.25 + 0.35 * s.treble), SV3_TIP, s.velR);
    const maxR = mn * 0.62;
    const swing = 0.55 + 1.3 * s.bass;
    const coilAmt = (0.85 + 2.5 * s.coil);
    const splay = 0.45 + 2.3 * s.treble;          // how far the tip fans the panels
    const streamAmp = mn * (0.008 + 0.022 * s.energy);
    const streamPh = s.life * (0.55 + 1.6 * s.bass);

    for (const arm of s.arms) {
      const armLen = maxR * arm.len * (0.5 + 0.5 * s.reach);
      for (let kk = 0; kk <= SV3_SEG; kk++) {
        const u = kk / SV3_SEG;
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
      for (let kk = 0; kk <= SV3_SEG; kk++) {
        const k0 = Math.max(0, kk - 1), k1 = Math.min(SV3_SEG, kk + 1);
        const dx = arm.px[k1] - arm.px[k0], dy = arm.py[k1] - arm.py[k0];
        const dl = Math.hypot(dx, dy) || 1;
        arm.nx[kk] = -dy / dl; arm.ny[kk] = dx / dl;
      }
      // transverse waves in PIXELS ride the normals (the family law)
      for (let kk = 0; kk <= SV3_SEG; kk++) {
        const u = kk / SV3_SEG;
        let T = streamAmp * Math.sin(u * 5.5 - streamPh + arm.wph) * (0.25 + 0.75 * u);
        for (const p of s.pulses) {
          const d = u - p.u;
          if (d < -0.42 || d > 0.42) continue;
          T += p.str * mn * 0.042 * Math.exp(-d * d * 26) * Math.sin(d * 8 + arm.wph) * (0.3 + 0.7 * u);
        }
        arm.px[kk] += arm.nx[kk] * T;
        arm.py[kk] += arm.ny[kk] * T;
      }

      const gain = 1 + 0.22 * s.pan * Math.cos(arm.a0 + s.rot);
      const aP = clamp(aPan * gain, 0.012, 0.22);

      const grad = g.createLinearGradient(arm.px[0], arm.py[0], arm.px[SV3_SEG], arm.py[SV3_SEG]);
      grad.addColorStop(0, SV3_RGBA(coreC, aP * (0.8 + 1.0 * coreEnv)));
      grad.addColorStop(0.32, SV3_RGBA(SV3_SILK, aP));
      grad.addColorStop(0.70, SV3_RGBA(SV3_MIX(SV3_SILK, tipC, 0.6), aP * 0.9));
      grad.addColorStop(1, SV3_RGBA(tipC, aP * (0.5 + 1.4 * s.treble + 0.5 * s.velR)));

      // THE PANELS: three translucent sheets folded inside the ribbon
      for (const pn of arm.panels) {
        g.beginPath();
        let kEnd = 0;
        for (let kk = 0; kk <= SV3_SEG; kk++) {
          const u = kk / SV3_SEG;
          if (u > pn.end) break;
          kEnd = kk;
          const env = 0.22 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.8);
          let halfW = mn * 0.050 * arm.wid * env;
          const tail = Math.min(1, (pn.end - u) / 0.20);
          halfW *= tail * tail * (3 - 2 * tail);
          const c = pn.base * (1 + splay * u * u) + 0.38 * Math.sin(u * pn.f + pn.ph + s.life * pn.sp);
          const th = pn.th + 0.09 * Math.sin(u * pn.g + pn.q + s.life * pn.r);
          const b1 = halfW * (c + th);
          const x = arm.px[kk] + arm.nx[kk] * b1, y = arm.py[kk] + arm.ny[kk] * b1;
          if (kk === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        for (let kk = kEnd; kk >= 0; kk--) {
          const u = kk / SV3_SEG;
          const env = 0.22 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.8);
          let halfW = mn * 0.050 * arm.wid * env;
          const tail = Math.min(1, (pn.end - u) / 0.20);
          halfW *= tail * tail * (3 - 2 * tail);
          const c = pn.base * (1 + splay * u * u) + 0.38 * Math.sin(u * pn.f + pn.ph + s.life * pn.sp);
          const th = pn.th + 0.09 * Math.sin(u * pn.g + pn.q + s.life * pn.r);
          const b0 = halfW * (c - th);
          g.lineTo(arm.px[kk] + arm.nx[kk] * b0, arm.py[kk] + arm.ny[kk] * b0);
        }
        g.closePath();
        g.fillStyle = grad;
        g.fill();
        // the sheet's rolled edge: one faint stroke of the same gradient
        g.strokeStyle = grad;
        g.lineWidth = 1.0 * ms;
        g.globalAlpha = 0.45;
        g.stroke();
        g.globalAlpha = 1;
        // woven-thread texture: two hairlines riding inside the panel
        for (const hf of [-0.45, 0.4]) {
          g.beginPath();
          for (let kk = 0; kk <= SV3_SEG; kk++) {
            const u = kk / SV3_SEG;
            if (u > pn.end) break;
            const env = 0.22 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.8);
            let halfW = mn * 0.050 * arm.wid * env;
            const tail = Math.min(1, (pn.end - u) / 0.20);
            halfW *= tail * tail * (3 - 2 * tail);
            const c = pn.base * (1 + splay * u * u) + 0.38 * Math.sin(u * pn.f + pn.ph + s.life * pn.sp);
            const th = pn.th + 0.09 * Math.sin(u * pn.g + pn.q + s.life * pn.r);
            const b = halfW * (c + th * hf);
            const x = arm.px[kk] + arm.nx[kk] * b, y = arm.py[kk] + arm.ny[kk] * b;
            if (kk === 0) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.globalAlpha = 0.30;
          g.stroke();
          g.globalAlpha = 1;
        }
      }
    }

    const coreR = mn * (0.050 + 0.085 * coreEnv);
    const cg = g.createRadialGradient(cx, cy, coreR * 0.08, cx, cy, coreR);
    const knotC = SV3_MIX(SV3_MIX(SV3_SILK, SV3_CORE, 0.3 + 0.5 * s.bass), SV3_CORE, s.velL);
    cg.addColorStop(0, SV3_RGBA(knotC, 0.18 + 0.8 * coreEnv));
    cg.addColorStop(0.55, SV3_RGBA(knotC, 0.08 + 0.4 * coreEnv));
    cg.addColorStop(1, SV3_RGBA(knotC, 0));
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
      '   SPEED L ' + Math.round(s.velL * 100) + ' R ' + Math.round(s.velR * 100) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});

function SV3_MIX(a, b, t) {
  t = clamp(t);
  return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
}
function SV3_RGBA(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`; }
