/* ---------- SRC-15.6 · FERRO BLOOM V6 (the band: rolled 9ths, afro groove, call & response) ---------- */
reg({
  id: 'SRC-15.6', family: 'SRC-15', ver: 6,
  title: 'Ferro Bloom V6', tech: 'SHADER FIELD / MOTION ILLUSION',
  music: {
    bpm: 104, root: 48, mode: 'ionian', chordBars: 2,
    // the inspiration MIDI, verbatim: I – IV – vi – bVII, 9ths everywhere
    chords: [
      [0, 4, 7, 11, 14],    // Cmaj9
      [5, 9, 12, 16, 19],   // Fmaj9
      [9, 12, 16, 19, 23],  // Am9
      [10, 14, 17, 21, 28]  // Bbmaj9(#11) — the borrowed badass
    ],
    chordNames: ['Cmaj9', 'Fmaj9', 'Am9', 'B♭maj9♯11']
  },
  fx: {},
  tags: ['WILLED BLOOMS', 'ROLLED 9THS', 'AFRO GROOVE', 'CALL & RESPONSE'],
  desc: 'The willed garden, now with a band inside it. Every bloom you will into existence is a rolled chord — voices entering low to high like a harp opening — drawn from a progression that is anything but plain: Cmaj9, Fmaj9, Am9, and a borrowed B♭maj9♯11 that lifts the floor. Underneath, a gentle afrobeat: a soft bell clave, shaker sixteenths, a kick that only wakes when the garden is wide, and a log drum that answers your quick gestures. Go still after a phrase and the garden answers YOU — two high notes in the gap, the way a singer leaves room. Blooms sway on their own axes now; the hero holds the center; birth sends a fat ripple ring across the black.',
  interact: 'EACH HAND WILLS ITS OWN SIDE: L reach dials up to 6 flowers into the left half, R up to 6 into the right — instantly, one per notch, gone as fast when you pull back. Go wide left-only and only the left garden fills. Quick flicks fire log-drum fills on the next sixteenth. Stillness after a gesture invites the garden to answer. The groove assembles in layers as you commit: bell first, then shaker, then kick when the garden is wide.',
  sound: 'Pinned to C major — no wandering, made to jam with live players (chord name on the HUD). Pads are one voice per bloom on a 9th-chord ladder, panned to each bloom’s side. Births roll their chord tones (staggered ~65ms). Afro groove on ch10: bell clave, shaker 16ths, sparse kick, gesture-fired log drum. Bass follows the chord root. Ableton: pads ch2, bass 3, arp 4, bells 5, perc 10, CC74 = spread.',
  init(P) {
    P.state = {
      pres: 0, count: 1, uph: 0, pulse: 0, breath: 0,
      eL: 0, eR: 0, vel: 0, spread: 0, pL: 0, pR: 0, still: 0,
      want: new Array(13).fill(0),
      birth: new Array(13).fill(0),
      lit: new Array(13).fill(0),
      pop: new Array(13).fill(0),
      seed: [0, 0.13, 0.71, 0.29, 0.88, 0.45, 0.62, 0.07, 0.94, 0.36, 0.53, 0.19, 0.80],
      newBorn: []
    };
    P.state.want[0] = 1; P.state.birth[0] = 1;
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(P.w, P.h, false);
    T3.renderer = r;
    const sc = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uni = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(P.w, P.h) },
      uPh: { value: 0 }, uPres: { value: 0 }, uPulse: { value: 0 },
      uBreath: { value: 1 }, uAmb: { value: 1 },
      uEL: { value: 0 }, uER: { value: 0 },
      uBirth: { value: new Float32Array(13) }, uLit: { value: new Float32Array(13) },
      uPop: { value: new Float32Array(13) },
      uSeed: { value: new Float32Array(P.state.seed) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform float uT, uPh, uPres, uPulse, uBreath, uAmb, uEL, uER;',
        'uniform vec2 uRes;',
        'uniform float uBirth[13];',
        'uniform float uLit[13];',
        'uniform float uPop[13];',
        'uniform float uSeed[13];',
        'const float TAU = 6.28318530718;',
        // V6: slots 1-6 live on the LEFT half, 7-12 on the RIGHT — each hand
        // wills its own side's flowers. Placement scatters within the half.
        'vec2 bloomPos(int i, float seed){',
        '  if (i == 0) return vec2(0.0, 0.0);',
        '  float j = i <= 6 ? float(i) : float(i - 6);',
        '  float base = 3.14159265 * (j - 0.5) / 6.0 + (seed - 0.5) * 0.55;',
        '  float ang = i <= 6 ? (1.5707963 + base) : (-1.5707963 + base);',
        '  float dst = 0.24 + 0.30 * fract(seed * 7.31) + 0.02 * j;',
        '  return vec2(cos(ang), sin(ang)) * dst;',
        '}',
        // V6: hero holds the center — bigger, more petals; satellites defer
        'float bloomScale(int i, float seed){ return i == 0 ? 0.34 : (0.11 + 0.05 * fract(seed * 3.7)); }',
        'float bloomK(int i, float seed){ return i == 0 ? 9.0 : (5.0 + floor(fract(seed * 11.7) * 4.0)); }',
        'vec3 ringTint(float ri){',
        '  float h = mod(ri, 4.0);',
        '  if (h < 1.0) return vec3(0.95, 0.55, 0.62);',  // blush pink
        '  if (h < 2.0) return vec3(0.16, 0.55, 0.58);',  // teal
        '  if (h < 3.0) return vec3(0.98, 0.62, 0.34);',  // soft ember orange
        '  return vec3(0.58, 0.56, 0.90);',               // lavender-periwinkle
        '}',
        'void main(){',
        '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
        '  float spread = (uEL + uER) * 0.5;',
        '  p /= 0.62 + 0.58 * spread;',
        '  float breathAmt = 0.015 + 0.035 * uBreath;',
        '  p *= 1.0 / (1.0 + breathAmt * sin(uT * 0.45));',
        // V6: union tightens as the garden grows — flowers stay flowers at
        // full spread instead of melting into one lava mass
        '  float k = 0.15 - 0.06 * clamp(spread, 0.0, 1.0);',
        '  float acc = 0.0;',
        '  float hueAcc = 0.0;',
        '  vec3 col = vec3(0.0);',
        '  float coreSum = 0.0; vec3 coreCol = vec3(0.0);',
        '  for (int i = 0; i < 13; i++){',
        '    float b = uBirth[i];',
        '    if (b < 0.02) continue;',
        '    float seed = uSeed[i];',
        '    vec2 bp = bloomPos(i, seed);',
        '    vec2 q = p - bp;',
        '    float d = length(q);',
        '    float th = atan(q.y, q.x);',
        '    float sideE = i == 0 ? spread : (i <= 6 ? uEL : uER);',
        '    float wob = (0.05 + 0.10 * uBreath) * sin(uT * 0.35 + float(i) * 2.1 + th * 2.0);',
        '    float S = bloomScale(i, seed) * (0.25 + 0.75 * b) * (0.35 + 0.85 * sideE);',
        // V6: each bloom sways on its own axis — seeded speed and direction
        '    float R = S * (1.0 + (0.16 + wob * 0.5) * cos(bloomK(i, seed) * th + float(i) * 1.9 + uT * (seed - 0.5) * 0.7 + sin(uT * 0.22 + float(i)) * 0.35));',
        '    float f = d / max(R, 1e-4);',
        '    float w = exp(-f / k);',
        '    acc += w;',
        '    hueAcc += fract(seed * 5.13) * w;',
        '    float cr = S * (0.16 + 0.05 * uLit[i]);',
        '    float g1 = exp(-pow(d / cr, 2.0)) * min(b, 1.0);',
        '    coreSum += g1;',
        '    coreCol += (vec3(1.0, 0.47, 0.16) * g1 * (0.85 + uPulse * 0.5 + uLit[i] * 1.3)',
        '             +  vec3(1.0, 0.82, 0.6) * exp(-pow(d / (cr * 0.38), 2.0)) * min(b, 1.0) * (0.7 + uLit[i]));',
        // V6: BIRTH RIPPLE — a fat ring racing outward as the bloom pops
        '    float pp = uPop[i];',
        '    if (pp > 0.02) {',
        '      float rr = (1.0 - pp) * (0.30 + 1.6 * S);',
        '      float ring = exp(-pow((d - rr) / 0.055, 2.0));',
        '      coreCol += vec3(1.0, 0.75, 0.5) * ring * pp * 0.5;',
        '    }',
        '  }',
        '  float f = -k * log(max(acc, 1e-20));',
        '  float hueOff = floor((hueAcc / max(acc, 1e-20)) * 3.99);',
        // V6 SEAM FIX: bending one phase field through the direction flip
        // compresses bands into thin chirped rings at the seam. Instead:
        // render the outward field and the inward field SEPARATELY and
        // cross-dissolve — counter-flowing waves meeting in a soft standing
        // ring. No phase chirp, no thin lines, and the convergence zone is
        // genuinely stationary.
        '  float m = smoothstep(0.45, 0.65, f);',
        '  float bandsN = 4.2;',
        '  float phA = f * bandsN - uPh;',  // inner field: flows outward
        '  float phB = f * bandsN + uPh;',  // outer field: flows inward
        '  float bandA = pow(0.5 + 0.5 * cos(TAU * phA), 0.70);',
        '  float bandB = pow(0.5 + 0.5 * cos(TAU * phB), 0.70);',
        '  vec3 deep = vec3(0.05, 0.09, 0.30);',
        '  vec3 cream = vec3(0.97, 0.90, 0.80);',
        '  float warmMix = 0.35 * (1.0 - smoothstep(0.0, 0.55, f));',
        '  vec3 tintA = mix(ringTint(floor(phA + 0.5) + hueOff), vec3(0.98, 0.55, 0.38), warmMix);',
        '  vec3 tintB = mix(ringTint(floor(phB + 0.5) + hueOff), vec3(0.98, 0.55, 0.38), warmMix);',
        '  vec3 bcA = mix(deep, tintA, smoothstep(0.10, 0.78, bandA));',
        '  bcA = mix(bcA, cream, 0.55 * smoothstep(0.88, 1.0, bandA));',
        '  vec3 bcB = mix(deep, tintB, smoothstep(0.10, 0.78, bandB));',
        '  bcB = mix(bcB, cream, 0.55 * smoothstep(0.88, 1.0, bandB));',
        '  vec3 bc = mix(bcA, bcB, m);',
        '  float band = mix(bandA, bandB, m);',
        '  vec3 tint = mix(tintA, tintB, m);',
        '  float inside = 1.0 - smoothstep(0.90, 1.02, f);',
        '  float presL = 0.40 + 0.60 * uPres;',
        '  col += bc * inside * presL * (0.52 + 0.44 * band) * (1.0 + uPulse * 0.18);',
        '  col += tint * exp(-max(f - 1.0, 0.0) * 4.0) * 0.10 * presL;',
        '  col += coreCol;',
        '  for (int j = 0; j < 3; j++){',
        '    float fj = float(j);',
        '    vec2 aq = vec2(sin(uT * 0.045 + fj * 2.1) * 0.66, cos(uT * 0.037 + fj * 3.7) * 0.44);',
        '    vec2 av = p - aq;',
        '    float ad = length(av);',
        '    float ath = atan(av.y, av.x);',
        '    float aS = 0.075 + 0.02 * sin(fj * 5.0);',
        '    float aR = aS * (1.0 + 0.18 * cos((5.0 + fj) * ath + fj * 2.0 + uT * 0.1));',
        '    float af = ad / aR;',
        '    float aband = pow(0.5 + 0.5 * cos(TAU * (af * 3.0 - uT * 0.05 - fj)), 0.8);',
        '    float ain = 1.0 - smoothstep(0.85, 1.05, af);',
        '    col += mix(deep, ringTint(floor(af * 3.0 + fj)), aband) * ain * 0.34 * uAmb;',
        '    col += vec3(1.0, 0.5, 0.2) * exp(-pow(af / 0.22, 2.0)) * 0.4 * uAmb;',
        '  }',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = sc; T3.cam = cam;
  },
  step(P, dt, t, inp) {
    const s = P.state;
    if (s.noGL) return;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const tL = clamp(inp.L), tR = clamp(inp.R);
    s.vel = s.vel * Math.max(0, 1 - dt * 2.2) + (Math.abs(tL - s.pL) + Math.abs(tR - s.pR)) * 6;
    s.pL = tL; s.pR = tR;
    // near-passthrough smoothing: the core's filter is the only one (Vespers-tight)
    s.eL += (tL - s.eL) * Math.min(1, dt * 28);
    s.eR += (tR - s.eR) * Math.min(1, dt * 28);
    s.spread = (s.eL + s.eR) / 2;
    // stillness clock — the call-and-response trigger
    if (s.vel < 0.06 && s.pres > 0.3) s.still += dt; else s.still = 0;
    if (s.pres < 0.12) { s.idleT = (s.idleT || 0) + dt; } else s.idleT = 0;
    const sleeping = (s.idleT || 0) > 12;
    // V6: EACH HAND WILLS ITS OWN SIDE — L reach dials the 6 left slots,
    // R reach the 6 right slots. Go wide left-only and the left garden fills.
    const posL = s.eL * 6.99, posR = s.eR * 6.99;
    let cL = 0, cR = 0;
    for (let i = 1; i < 13; i++) {
      const isL = i <= 6;
      const j = isL ? i : i - 6;
      const pos = isL ? posL : posR;
      if (!s.want[i] && !sleeping && pos >= j + 0.30) {
        s.want[i] = 1; s.seed[i] = Math.random(); s.pop[i] = 1;
        s.newBorn.push(i);
      } else if (s.want[i] && (sleeping || pos <= j - 0.40)) {
        s.want[i] = 0;
        s.lit[i] = 1; // ember flare as it collapses
      }
      if (s.want[i]) { if (isL) cL++; else cR++; }
    }
    s.cL = cL; s.cR = cR;
    s.count = 1 + cL + cR;
    s.uph += dt * (0.02 + Math.pow(s.spread, 1.4) * 0.42 + Math.min(0.5, s.vel) * 0.35) * (0.35 + 0.65 * s.pres);
    s.pulse = Math.max(0, s.pulse - dt * 3.2);
    for (let i = 0; i < 13; i++) {
      const want = i === 0 ? 1 : s.want[i];
      s.birth[i] += (want - s.birth[i]) * Math.min(1, dt * (want ? 9 : 7));
      s.pop[i] = Math.max(0, s.pop[i] - dt * 3.0);
      s.lit[i] = Math.max(0, s.lit[i] - dt * 3.5);
    }
    s.breath = 1 - s.pres * 0.7;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#04050c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('FERRO BLOOM V6 · THE WILLED GARDEN, WITH A BAND', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = t; u.uPh.value = s.uph;
    u.uPres.value = s.pres; u.uPulse.value = s.pulse;
    u.uBreath.value = s.breath;
    u.uAmb.value = Math.max(0, 1 - s.pres * 1.4) * 0.9;
    u.uEL.value = s.eL; u.uER.value = s.eR;
    for (let i = 0; i < 13; i++) {
      u.uBirth.value[i] = s.birth[i] * (1 + 0.35 * s.pop[i]);
      u.uLit.value[i] = s.lit[i];
      u.uPop.value[i] = s.pop[i];
      u.uSeed.value[i] = s.seed[i];
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(200,190,210,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BLOOMS ' + s.count + '/13 (L ' + (s.cL || 0) + ' · R ' + (s.cR || 0) + ')  ·  ' + (H.label || '') + '  ·  L ' + Math.round(s.eL * 100) + ' / R ' + Math.round(s.eR * 100) + (s.pres < 0.3 ? '  ·  SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const f = v.filter('lowpass', 600, 0.7);
    f.connect(v.group);
    const sideOf = i => i === 0 ? 0 : (i <= 6 ? -1 : 1);
    // one pad voice per bloom, climbing the 9th-chord ladder — willing blooms
    // in literally thickens the chord
    const voices = [];
    for (let i = 0; i < 13; i++) {
      const o = v.osc('sawtooth', H.chordTone(i, 0));
      const gg = v.g(0.0001);
      o.connect(gg); gg.connect(f);
      voices.push({ o, gg, idx: i });
    }
    const sub = v.osc('sine', H.chordTone(0, -1));
    const subG = v.g(0.03); sub.connect(subG); subG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.6; f.connect(s2); s2.connect(A.revIn); }
    let answered = false;
    H.onChord(() => {
      voices.forEach(vc => A.set(vc.o.frequency, H.chordTone(vc.idx, 0), 1.6));
      A.set(sub.frequency, H.chordTone(0, -1), 1.2); // bass follows the CHORD root
      answered = false;
    });
    v.fadeIn(1, 1.2);
    // gentle afrobeat: son-clave bell, shaker 16ths, sparse kick, log answers
    const BELL = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
    const KICKP = [1, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 1, 0, 0, 0, 0, 0];
    let nextT = T.next(0.25), step16 = 0, arpIdx = 0, sparkIdx = 0, fillCool = 0;
    return {
      tick(inp) {
        const s = P.state;
        A.set(f.frequency, 340 + s.spread * 2100 + Math.min(0.5, s.vel) * 1300 + s.pres * 300, 0.25);
        voices.forEach((vc, i) => {
          const on = i === 0 ? 1 : s.want[i];
          const se = sideOf(i);
          const sideE = se === 0 ? s.spread : (se < 0 ? s.eL : s.eR);
          A.set(vc.gg.gain, (on ? 0.009 + 0.011 * sideE : 0.0001) * (0.45 + 0.55 * s.pres), on ? 0.35 : 0.15);
        });
        MOut.expr('pad', s.spread); MOut.expr('arp', clamp(s.vel));
        // BIRTHS = ROLLED CHORDS — voices entering low to high like the MIDI
        let casc = 0;
        while (s.newBorn.length) {
          const bi = s.newBorn.shift();
          const pan = sideOf(bi) * 0.5;
          const base = Math.max(A.t() + 0.02, T.next(0.25)) + casc * 0.05;
          [0, 1, 2].forEach(ri => {
            const freq = H.chordTone((bi % 5) + ri * 2, 1);
            const at = base + ri * 0.065;
            A.bell(freq, { at, vol: 0.045 + ri * 0.006, dur: 2.0, rev: 0.65, pan });
            MOut.evNote('bells', freq, 0.11, at, 1.8);
          });
          s.lit[bi] = 1;
          casc++;
        }
        // gesture flick → log-drum fill on the next 16th
        fillCool = Math.max(0, fillCool - 0.03);
        if (s.vel > 0.55 && fillCool <= 0 && s.pres > 0.2) {
          fillCool = 0.6;
          const pan = s.eL > s.eR ? -0.4 : 0.4;
          const t1 = T.next(0.25), t2 = t1 + T.beat * 0.25;
          A.pluck2(H.chordTone(0, 0), { at: t1, vol: 0.085, dur: 0.3, pan, rev: 0.25 });
          A.pluck2(H.chordTone(2, 0), { at: t2, vol: 0.07, dur: 0.3, pan: -pan * 0.5, rev: 0.25 });
          MOut.evDrum(64, 0.5, t1); MOut.evDrum(63, 0.4, t2);
        }
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const st32 = step16 % 32; // 2-bar chord phrase
          const tt = nextT;
          // groove assembles in layers with commitment
          if (BELL[st] && s.pres > 0.25) {
            A.pluck2(H.scaleTone(4, 2), { at: tt, vol: 0.028 + s.spread * 0.018, dur: 0.12, pan: 0.3, rev: 0.12 });
            MOut.evDrum(56, 0.3 + s.spread * 0.2, tt);
            s.lit[sparkIdx % 13] = Math.max(s.lit[sparkIdx % 13], s.want[sparkIdx % 13] ? 0.7 : 0);
            sparkIdx++;
          }
          if (s.pres > 0.2 && s.spread > 0.06) {
            A.hat(tt, { vol: 0.012 + (st % 4 === 2 ? 0.014 : 0) + s.spread * 0.014 });
          }
          if (KICKP[st] && s.spread > 0.28) {
            A.kick(tt, (0.13 + s.spread * 0.09) * KICKP[st]);
            s.pulse = 1;
          }
          if (st === 0 && s.spread > 0.28) {
            A.bassNote(H.chordTone(0, -1), { at: tt, vol: 0.07, dur: 0.5 });
            MOut.evNote('bass', H.chordTone(0, -1), 0.3, tt, 0.45);
          }
          // CALL & RESPONSE: hands still in the phrase's last quarter → the
          // garden answers with two high notes in the gap (the MIDI's move)
          if (st32 === 24 && !answered && s.still > 0.8 && s.pres > 0.3) {
            answered = true;
            const n1 = H.chordTone(4, 2), n2 = H.chordTone(3, 2);
            A.bell(n1, { at: tt, vol: 0.055, dur: 2.2, rev: 0.8, pan: -0.2 });
            A.bell(n2, { at: tt + T.beat * 0.75, vol: 0.05, dur: 2.6, rev: 0.85, pan: 0.2 });
            MOut.evNote('lead', n1, 0.12, tt, 1.2);
            MOut.evNote('lead', n2, 0.11, tt + T.beat * 0.75, 1.6);
          }
          // arp demoted to garnish — the groove carries rhythm now
          if (st % 2 === 0 && s.spread > 0.5 && s.pres > 0.15) {
            const act = [0];
            for (let i = 1; i < 13; i++) if (s.want[i]) act.push(i);
            const bi = act[arpIdx % act.length];
            const freq = H.chordTone(bi, 1);
            A.pluck2(freq, { at: tt, vol: 0.02 + s.spread * 0.025, pan: sideOf(bi) * 0.55, rev: 0.5, del: 0.25 });
            MOut.evNote('arp', freq, 0.08 + s.spread * 0.05, tt, 0.3);
            s.lit[bi] = Math.max(s.lit[bi], 0.8);
            arpIdx++;
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < A.t()) nextT = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
