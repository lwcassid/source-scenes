/* ---------- SRC-50 · SILK NOVA V1 (the spectrum laid out along the form) ----------
   Nima's reference plate: a radial flower of translucent chiffon ribbons —
   two dozen arms flying out of a dense dark knot, every ribbon made of many
   fine near-parallel strands that weave and fray, ink on paper. On scrim it
   inverts: luminous silk on black, the knot the brightest thing in the room.

   The claim this scene takes in the audio-in family is RADIUS. Cell Front
   owns three pockets with hand-painted colour; Penrose Bloom owns loudness-
   as-size and spectrum-as-colour; Gravity Squares owns the layout; Spectrum
   Halo owns one curve's harmonics by order. Here the spectrum is laid out
   ALONG THE FORM, inside-out: BASS lives in the core knot (it glows and
   swings the inner body), MID is the body — it sets how far the arms REACH —
   and TREBLE lives at the tips, fraying the ribbon ends into separated
   filaments and fluttering them. You read the track radially: a bass-heavy
   drop is a burning heart with short arms; a bright section is a wide-open
   flower with frayed, shivering ends.

   THE KICK travels. A hit (inp.audio.kick — the time-domain scanner, a new
   hit is `n` CHANGING; onset's rising edge is the fallback) launches a
   luminous pulse that runs OUTWARD along every ribbon, core to tip in about
   half a second — so the beat is not a flash, it is a wave you watch leave
   the heart of the flower. Applied unsmoothed, back-dated by the hit's true
   age plus a display lead, exactly as Cell Front V11 established.

   THE HANDS do not compete with the mic (Cell Front V5's law):
   · LEFT / CC1 = SENSITIVITY — a gain on the bands, placid to violent. A
     hand left stale by ghost drift sits near the base floor; it can never
     lie about what the music is doing.
   · RIGHT / CC2 = COIL — continuous and immediate: lean in and every arm
     winds tighter around the knot before flying out, the whole flower
     curling like it's being wrung; pull away and it relaxes straight.
     This is the one-second read for a stranger.
   Speed paints (Cell Front V12's law): how fast the LEFT hand moves
   breathes ORANGE into the core, how fast the RIGHT hand moves breathes
   VIOLET into the tips — the radial field is the form's own axis, so the
   colour never reads as a screen gradient. At rest the silk is cream.

   Makes no sound of its own — it listens. ------ */

const SN_ARMS = 18, SN_STR = 13, SN_SEG = 48;
const SN_PSPD = 1.8;                 // kick pulse speed: core→tip in ~0.55s
const SN_SILK = [232, 228, 216];     // resting cream silk
const SN_CORE = [255, 176, 96];      // orange country (left hand / bass heat)
const SN_TIP  = [176, 128, 255];     // violet country (right hand / treble)
const SN_HOT  = [255, 246, 232];     // the kick front
const SN_MIX = (a, b, t) => {
  t = clamp(t);
  return [a[0] + (b[0] - a[0]) * t | 0, a[1] + (b[1] - a[1]) * t | 0, a[2] + (b[2] - a[2]) * t | 0];
};
const SN_RGBA = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a).toFixed(3)})`;

reg({
  id: 'SRC-50.1', family: 'SRC-50', ver: 1, title: 'Silk Nova', tech: 'RADIAL RIBBON FIELD / SPECTRUM ALONG THE FORM',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'RIBBONS', 'RADIAL', 'KICK TRAVELS', 'SPEED = COLOR', 'SILK'],
  desc: 'A flower of translucent silk ribbons flying out of a dense luminous knot, every ribbon a bundle of fine weaving strands. The spectrum is laid out along the form, inside-out: bass burns in the core and swings the inner body, the mids reach the arms outward, treble frays the tips into shivering filaments. A kick is a wave of light you watch travel from the heart to the ends of every ribbon.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in). RIGHT hand is the coil — lean in and every ribbon winds tighter around the knot, pull away and the flower relaxes straight. LEFT hand is sensitivity, placid to violent. The hands also paint by MOVING: a fast left hand breathes orange into the core, a fast right hand breathes violet into the tips; stillness leaves cream silk.',
  sound: 'Makes no sound of its own — an audio-in scene. Connect a source (mic, line-in, or CAPTURE APP AUDIO) in MAP → Audio in, then SET REST with the room quiet. Built for a full spectrum: it wants a kick under a bassline, and a bright top end to open the tips.',

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
    for (let i = 0; i < SN_ARMS; i++) {
      const strands = [];
      for (let j = 0; j < SN_STR; j++) {
        strands.push({ ph: P.rand() * TAU, wf: 4 + P.rand() * 6, sp: 0.25 + P.rand() * 0.4, end: 0.84 + P.rand() * 0.16 });
      }
      s.arms.push({
        a0: (i + (P.rand() - 0.5) * 0.55) / SN_ARMS * TAU,
        len: 0.72 + P.rand() * 0.42,
        dir: P.rand() < 0.5 ? -1 : 1,
        w1: 2.2 + P.rand() * 2.4, p1: P.rand() * TAU, s1: 0.10 + P.rand() * 0.14,
        w2: 5.0 + P.rand() * 4.0, p2: P.rand() * TAU, s2: 0.06 + P.rand() * 0.11,
        wid: 0.70 + P.rand() * 0.55,
        strands,
        // scratch buffers: centerline points + normals, filled per frame
        px: new Float32Array(SN_SEG + 1), py: new Float32Array(SN_SEG + 1),
        nx: new Float32Array(SN_SEG + 1), ny: new Float32Array(SN_SEG + 1)
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
      // seed the pulse already advanced along the arm by the hit's real age
      s.pulses.push({ u: (age + s.LEAD) * SN_PSPD, str: hit });
    }
    for (let i = s.pulses.length - 1; i >= 0; i--) {
      const p = s.pulses[i];
      p.u += dt * SN_PSPD;
      if (p.u > 1.25) s.pulses.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const mn = Math.min(w, h), cx = w / 2, cy = h / 2;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.lineWidth = 1.35 * ms;

    // how bright the core is right now: the bass, plus every pulse still near it
    let coreKick = 0;
    for (const p of s.pulses) coreKick += p.str * Math.exp(-p.u * p.u * 18);
    const coreEnv = clamp(s.bass + coreKick * 0.7);

    const aBase = 0.075 + 0.055 * s.energy + 0.03 * s.pres;
    const coreC = SN_MIX(SN_MIX(SN_SILK, SN_CORE, 0.35 + 0.4 * s.bass), SN_CORE, s.velL);
    const tipC = SN_MIX(SN_MIX(SN_SILK, SN_TIP, 0.25 + 0.35 * s.treble), SN_TIP, s.velR);
    const maxR = mn * 0.53;
    const flut = 0.25 + 2.0 * s.treble;         // tip flutter amplitude
    const swing = 0.55 + 1.3 * s.bass;          // inner-body sway amplitude
    const coilAmt = (0.85 + 2.5 * s.coil);      // how far arms wrap the knot

    for (const arm of s.arms) {
      const armLen = maxR * arm.len * (0.5 + 0.5 * s.reach);
      // centerline: polar walk out of the knot
      for (let kk = 0; kk <= SN_SEG; kk++) {
        const u = kk / SN_SEG;
        const inner = Math.exp(-u * 2.6);       // 1 at the core, ~0 past mid-arm
        const wander =
          (0.18 * Math.sin(u * arm.w1 + arm.p1 + s.life * arm.s1) +
           0.11 * Math.sin(u * arm.w2 - arm.p2 + s.life * arm.s2)) *
          (0.25 + 0.75 * u) * (1 + (swing - 1) * inner) +
          0.038 * Math.sin(u * 11 - s.life * (1.2 + 2.8 * s.treble) + arm.p1 * 2) * u * u * flut;
        const ang = arm.a0 + s.rot + wander + arm.dir * coilAmt * Math.exp(-u * 3.2);
        const r = Math.pow(u, 0.85) * armLen;
        arm.px[kk] = cx + Math.cos(ang) * r;
        arm.py[kk] = cy + Math.sin(ang) * r;
      }
      for (let kk = 0; kk <= SN_SEG; kk++) {
        const k0 = Math.max(0, kk - 1), k1 = Math.min(SN_SEG, kk + 1);
        const dx = arm.px[k1] - arm.px[k0], dy = arm.py[k1] - arm.py[k0];
        const dl = Math.hypot(dx, dy) || 1;
        arm.nx[kk] = -dy / dl; arm.ny[kk] = dx / dl;
      }

      // per-arm gain: the stereo field leans the flower, gently
      const gain = 1 + 0.22 * s.pan * Math.cos(arm.a0 + s.rot);
      const a = clamp(aBase * gain, 0.02, 0.3);

      // one gradient per arm, core→tip along the form's own axis
      const grad = g.createLinearGradient(arm.px[0], arm.py[0], arm.px[SN_SEG], arm.py[SN_SEG]);
      const stops = [
        [0, coreC, a * (0.7 + 1.1 * coreEnv)],
        [0.32, SN_SILK, a],
        [0.70, SN_MIX(SN_SILK, tipC, 0.5), a * 0.9],
        [1, tipC, a * (0.4 + 1.1 * s.treble + 0.6 * s.velR)]
      ];
      for (const p of s.pulses) {
        if (p.u < -0.05 || p.u > 1.08) continue;
        const pu = clamp(p.u);
        stops.push(
          [clamp(pu - 0.11), SN_SILK, a],
          [pu, SN_HOT, clamp(a * (2.4 + 2.8 * p.str), 0, 0.85)],
          [clamp(pu + 0.16), SN_SILK, a]
        );
      }
      stops.sort((x, y) => x[0] - y[0]);
      for (const st of stops) grad.addColorStop(st[0], SN_RGBA(st[1], st[2]));
      g.strokeStyle = grad;

      // the strands: offsets from the centerline, weaving, fraying at the tips
      for (let j = 0; j < SN_STR; j++) {
        const st = arm.strands[j];
        const sj = (j / (SN_STR - 1)) * 2 - 1;
        g.beginPath();
        for (let kk = 0; kk <= SN_SEG; kk++) {
          const u = kk / SN_SEG;
          const env = 0.30 + 0.85 * Math.pow(Math.sin(Math.min(u * 1.12, 1) * Math.PI), 0.7);
          let halfW = mn * 0.032 * arm.wid * env + mn * 0.016 * u * u * (0.2 + 2.4 * s.treble);
          if (u > st.end) break;
          const tail = Math.min(1, (st.end - u) / 0.16);
          halfW *= tail * tail * (3 - 2 * tail);
          const weave = 0.5 * (1 - Math.abs(sj)) * Math.sin(u * st.wf + st.ph + s.life * st.sp);
          const off = halfW * (sj + weave);
          const x = arm.px[kk] + arm.nx[kk] * off, y = arm.py[kk] + arm.ny[kk] * off;
          if (kk === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
    }

    // the knot: a breathing glow where every arm is born
    const coreR = mn * (0.050 + 0.085 * coreEnv);
    const cg = g.createRadialGradient(cx, cy, coreR * 0.08, cx, cy, coreR);
    const knotC = SN_MIX(SN_MIX(SN_SILK, SN_CORE, 0.3 + 0.5 * s.bass), SN_CORE, s.velL);
    cg.addColorStop(0, SN_RGBA(knotC, 0.18 + 0.8 * coreEnv));
    cg.addColorStop(0.55, SN_RGBA(knotC, 0.08 + 0.4 * coreEnv));
    cg.addColorStop(1, SN_RGBA(knotC, 0));
    g.fillStyle = cg;
    g.beginPath(); g.arc(cx, cy, coreR, 0, TAU); g.fill();

    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,200,150,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('CORE(bass) ' + Math.round(s.bass * 100) + '   REACH(mid) ' + Math.round(s.reach * 100) +
      '   TIPS(treble) ' + Math.round(s.treble * 100) + '   COIL ' + Math.round(s.coil * 100) +
      '   SENS ' + Math.round((0.85 + s.eL * 1.5) * 100) +
      '   KICK ' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' str ' + Math.round(s._kStr * 100) +
      '   PULSES ' + s.pulses.length +
      '   SPEED L ' + Math.round(s.velL * 100) + ' R ' + Math.round(s.velR * 100) +
      '   PAN ' + s.pan.toFixed(2) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
