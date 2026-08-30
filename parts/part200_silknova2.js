/* ---------- SRC-50.2 · SILK NOVA V2 (the tangle, and the wave that dances it) ----------
   Nima on V1: "not at all close to the reference. The silks need to be
   weaving into each other much more. Instead of color flowing through it,
   a wave should flow through them instead and make them dance."

   Two corrections, both structural:
   · THE WEAVE. V1's arms each kept their own 20° lane and barely touched —
     the reference is a TANGLE, ribbons sweeping across two or three
     neighbours and back, the crossings carrying the whole picture. V2
     gives every arm a big low-frequency S-sweep (amplitude past a full
     lane width), seats the arms with heavy angular jitter so they start
     interleaved, widens the ribbons, and adds four more of them. Where
     ribbons cross, the additive strands moiré — that IS the reference.
   · THE WAVE. V1 answered a kick by running a hot colour band up the
     gradient — paint, not motion. V2 moves the FORM: a kick launches a
     DISPLACEMENT ripple, a localized S-shaped packet that travels
     core→tip in ~0.6s and physically whips every ribbon sideways as it
     passes, each arm at its own phase so the flower dances rather than
     flinches. Under it a continuous slow travelling undulation flows
     outward all the time (amplitude from the music's energy, speed from
     the bass), so between kicks the silks still stream like water weed.
     No colour rides the pulse anymore; the knot still flares on the hit.

   Everything else is V1: the radial spectrum claim (bass = core, mid =
   reach, treble = tip fray), kick via inp.audio.kick back-dated per Cell
   Front V11, LEFT = sensitivity, RIGHT = coil, hand speed painting orange
   into the core and violet into the tips. Makes no sound of its own. ------ */

const SN2_ARMS = 22, SN2_STR = 13, SN2_SEG = 56;
const SN2_PSPD = 1.7;                 // wave speed: core→tip in ~0.6s
const SN2_SILK = [232, 228, 216];
const SN2_CORE = [255, 176, 96];      // orange country (left hand / bass heat)
const SN2_TIP  = [176, 128, 255];     // violet country (right hand / treble)

reg({
  id: 'SRC-50.2', family: 'SRC-50', ver: 2, title: 'Silk Nova V2', tech: 'RADIAL RIBBON TANGLE / TRAVELLING WAVE',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'RIBBONS', 'RADIAL', 'THE WEAVE', 'KICK IS A WAVE', 'SILK'],
  desc: 'The silk flower rebuilt as a true tangle: two dozen wide ribbons sweeping across their neighbours and back, weaving where they cross, out of one luminous knot. The spectrum still reads inside-out — bass in the core, mids reaching the arms, treble fraying the tips — but the kick no longer paints: it launches a ripple that travels the length of every ribbon and physically whips the silk as it passes, each arm on its own phase, so the whole flower dances. Between hits a slow wave streams outward continuously.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in). RIGHT hand is the coil — lean in and every ribbon winds tighter around the knot. LEFT hand is sensitivity, placid to violent. The hands also paint by MOVING: a fast left hand breathes orange into the core, a fast right hand breathes violet into the tips; stillness leaves cream silk.',
  sound: 'Makes no sound of its own — an audio-in scene. Connect a source (mic, line-in, or CAPTURE APP AUDIO) in MAP → Audio in, then SET REST with the room quiet. Built for a full spectrum: it wants a kick under a bassline — every hit is a wave you watch run down the ribbons.',

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
    for (let i = 0; i < SN2_ARMS; i++) {
      const strands = [];
      for (let j = 0; j < SN2_STR; j++) {
        strands.push({ ph: P.rand() * TAU, wf: 4 + P.rand() * 6, sp: 0.25 + P.rand() * 0.4, end: 0.84 + P.rand() * 0.16 });
      }
      s.arms.push({
        // heavy jitter: arms seat interleaved, not in lanes
        a0: (i + (P.rand() - 0.5) * 1.4) / SN2_ARMS * TAU,
        len: 0.68 + P.rand() * 0.46,
        dir: P.rand() < 0.5 ? -1 : 1,
        // the S-sweep: low frequency, amplitude past a lane width — this is
        // what makes an arm cross two neighbours and come back
        A1: 0.34 + P.rand() * 0.20, w1: 1.4 + P.rand() * 1.8, p1: P.rand() * TAU, s1: 0.08 + P.rand() * 0.10,
        A2: 0.08, w2: 3.0 + P.rand() * 2.0, p2: P.rand() * TAU, s2: 0.05 + P.rand() * 0.09,
        wph: P.rand() * TAU,          // this arm's phase in the dance
        wid: 0.70 + P.rand() * 0.55,
        strands,
        px: new Float32Array(SN2_SEG + 1), py: new Float32Array(SN2_SEG + 1),
        nx: new Float32Array(SN2_SEG + 1), ny: new Float32Array(SN2_SEG + 1)
      });
    }
    P.state = s;
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;

    // hand speed → paint envelopes: snap up with the gesture, fade over ~2s
    const L = clamp(inp.L), R = clamp(inp.R);
    if (s._pL < 0) { s._pL = L; s._pR = R; }
    const dtc = Math.max(dt, 1e-3);
    const vL = clamp(Math.abs(L - s._pL) / dtc * 0.55), vR = clamp(Math.abs(R - s._pR) / dtc * 0.55);
    s._pL = L; s._pR = R;
    s.velL += (vL - s.velL) * Math.min(1, dt * (vL > s.velL ? 24 : 0.9));
    s.velR += (vR - s.velR) * Math.min(1, dt * (vR > s.velR ? 24 : 0.9));

    // hands couple fast (dt*6): left = sensitivity gain, right = coil
    s.eL += (L - s.eL) * Math.min(1, dt * 6);
    s.eR += (R - s.eR) * Math.min(1, dt * 6);
    s.coil += (s.eR - s.coil) * Math.min(1, dt * 6);
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

    // reach = the mids, growth quicker than the melt (the high-water lesson)
    const reachT = 0.42 + 0.55 * s.mid;
    s.reach += (reachT - s.reach) * Math.min(1, dt * (reachT > s.reach ? 2.2 : 0.7));

    // flux off the slow bands: wakes on a section change, not on every note
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
      // seed the wave already advanced along the arm by the hit's real age
      s.pulses.push({ u: (age + s.LEAD) * SN2_PSPD, str: hit });
    }
    for (let i = s.pulses.length - 1; i >= 0; i--) {
      const p = s.pulses[i];
      p.u += dt * SN2_PSPD;
      if (p.u > 1.35) s.pulses.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const mn = Math.min(w, h), cx = w / 2, cy = h / 2;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.lineWidth = 1.35 * ms;

    // the knot's light right now: the bass, plus every wave still being born
    let coreKick = 0;
    for (const p of s.pulses) coreKick += p.str * Math.exp(-p.u * p.u * 18);
    const coreEnv = clamp(s.bass + coreKick * 0.7);

    const aBase = 0.072 + 0.05 * s.energy + 0.028 * s.pres;
    const coreC = SN2_MIXC(SN2_MIXC(SN2_SILK, SN2_CORE, 0.35 + 0.4 * s.bass), SN2_CORE, s.velL);
    const tipC = SN2_MIXC(SN2_MIXC(SN2_SILK, SN2_TIP, 0.25 + 0.35 * s.treble), SN2_TIP, s.velR);
    const maxR = mn * 0.57;
    const flut = 0.25 + 2.0 * s.treble;
    const swing = 0.55 + 1.3 * s.bass;
    const coilAmt = (0.85 + 2.5 * s.coil);
    // the continuous stream: a slow wave always flowing outward, amplitude
    // from the music's energy, speed leaning on the bass
    const streamAmp = mn * (0.008 + 0.022 * s.energy);
    const streamPh = s.life * (0.55 + 1.6 * s.bass);

    for (const arm of s.arms) {
      const armLen = maxR * arm.len * (0.5 + 0.5 * s.reach);
      for (let kk = 0; kk <= SN2_SEG; kk++) {
        const u = kk / SN2_SEG;
        const inner = Math.exp(-u * 2.6);
        // the S-sweep IS the layout — angular, peaking mid-arm: the weave
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
      for (let kk = 0; kk <= SN2_SEG; kk++) {
        const k0 = Math.max(0, kk - 1), k1 = Math.min(SN2_SEG, kk + 1);
        const dx = arm.px[k1] - arm.px[k0], dy = arm.py[k1] - arm.py[k0];
        const dl = Math.hypot(dx, dy) || 1;
        arm.nx[kk] = -dy / dl; arm.ny[kk] = dx / dl;
      }
      // TRANSVERSE waves, in pixels, ride the normals: the same amplitude at
      // the knot and at the tip, so the silk undulates instead of kinking.
      // The kick's ripple packet and the continuous stream both live here.
      for (let kk = 0; kk <= SN2_SEG; kk++) {
        const u = kk / SN2_SEG;
        let T = streamAmp * Math.sin(u * 5.5 - streamPh + arm.wph) * (0.25 + 0.75 * u)
              + mn * 0.007 * Math.sin(u * 11 - s.life * (1.2 + 2.8 * s.treble) + arm.p1 * 2) * u * u * flut;
        for (const p of s.pulses) {
          const d = u - p.u;
          if (d < -0.42 || d > 0.42) continue;
          T += p.str * mn * 0.042 * Math.exp(-d * d * 26) * Math.sin(d * 8 + arm.wph) * (0.3 + 0.7 * u);
        }
        arm.px[kk] += arm.nx[kk] * T;
        arm.py[kk] += arm.ny[kk] * T;
      }

      const gain = 1 + 0.22 * s.pan * Math.cos(arm.a0 + s.rot);
      const a = clamp(aBase * gain, 0.02, 0.3);

      // core→tip along the form's own axis; no colour rides the wave
      const grad = g.createLinearGradient(arm.px[0], arm.py[0], arm.px[SN2_SEG], arm.py[SN2_SEG]);
      grad.addColorStop(0, SN2_RGBAC(coreC, a * (0.7 + 1.1 * coreEnv)));
      grad.addColorStop(0.32, SN2_RGBAC(SN2_SILK, a));
      grad.addColorStop(0.70, SN2_RGBAC(SN2_MIXC(SN2_SILK, tipC, 0.5), a * 0.9));
      grad.addColorStop(1, SN2_RGBAC(tipC, a * (0.4 + 1.1 * s.treble + 0.6 * s.velR)));
      g.strokeStyle = grad;

      for (let j = 0; j < SN2_STR; j++) {
        const st = arm.strands[j];
        const sj = (j / (SN2_STR - 1)) * 2 - 1;
        g.beginPath();
        for (let kk = 0; kk <= SN2_SEG; kk++) {
          const u = kk / SN2_SEG;
          if (u > st.end) break;
          const env = 0.30 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.7);
          let halfW = mn * 0.040 * arm.wid * env + mn * 0.016 * u * u * (0.2 + 2.4 * s.treble);
          const tail = Math.min(1, (st.end - u) / 0.16);
          halfW *= tail * tail * (3 - 2 * tail);
          const sjE = Math.sign(sj) * Math.pow(Math.abs(sj), 0.62);
          const weave = 0.32 * (1 - Math.abs(sj)) * Math.sin(u * st.wf + st.ph + s.life * st.sp);
          const off = halfW * (sjE + weave);
          const x = arm.px[kk] + arm.nx[kk] * off, y = arm.py[kk] + arm.ny[kk] * off;
          if (kk === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
    }

    // the knot: a breathing glow where every arm is born
    const coreR = mn * (0.050 + 0.085 * coreEnv);
    const cg = g.createRadialGradient(cx, cy, coreR * 0.08, cx, cy, coreR);
    const knotC = SN2_MIXC(SN2_MIXC(SN2_SILK, SN2_CORE, 0.3 + 0.5 * s.bass), SN2_CORE, s.velL);
    cg.addColorStop(0, SN2_RGBAC(knotC, 0.18 + 0.8 * coreEnv));
    cg.addColorStop(0.55, SN2_RGBAC(knotC, 0.08 + 0.4 * coreEnv));
    cg.addColorStop(1, SN2_RGBAC(knotC, 0));
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
      '   PAN ' + s.pan.toFixed(2) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});

function SN2_MIXC(a, b, t) {
  t = clamp(t);
  return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
}
function SN2_RGBAC(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`; }
