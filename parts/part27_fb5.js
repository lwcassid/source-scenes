/* ---------- SRC-15.5 · FERRO BLOOM V5 (willed blooms — instant, intentional, gone as fast) ---------- */
reg({
  id: 'SRC-15.5', family: 'SRC-15', ver: 5,
  title: 'Ferro Bloom V5', tech: 'SHADER FIELD / MOTION ILLUSION',
  music: { bpm: 66, root: 50, mode: 'lydian', prog: [0, 1], chordBars: 8 },
  fx: {},
  tags: ['WILLED BLOOMS', 'GROW+SHRINK ILLUSION', 'SIDES BLOOM APART', 'VESPERS-TIGHT'],
  desc: 'At rest: a small banded bud undulating in the black, with tiny sister-blooms drifting far off. Spread your hands and blooms POP into existence — instantly, one per notch of reach, up to a dozen — you are willing them into being, not waiting for them. Where each one lands is the garden’s choice; whether it exists is YOURS. Pull your hands back and they vanish exactly as fast as they came. The gradient bands still flow — outward through the inner flower, inward through the outer — converging on a stationary ring so the eye reads growing and shrinking at once. Rings alternate blush, ember, teal, powder blue, lavender.',
  interact: 'SPREAD is a dial with 13 clicks: every notch of reach is one more bloom, NOW — and one less the instant you come back. No downbeat, no waiting, no dice. L feeds the LEFT side’s blooms, R the RIGHT; placement is scattered fresh each time a bloom is born, so the garden never repeats but always obeys. Quick gestures splash energy into the band flow; stillness lets it settle.',
  sound: 'Each bloom is one voice of a voice-led lydian pad — willing blooms in literally thickens the chord, each voice panned to its bloom’s side. Births ring a bell cascade (grid-snapped, staggered) so a big spread sounds like a run of chimes. A quantized arp lights each bloom’s core as its note plays. Sub root underneath. Ableton: pads ch2, arp ch4, bells ch5, CC74 = spread.',
  init(P) {
    P.state = {
      pres: 0, count: 1, uph: 0, pulse: 0, breath: 0,
      eL: 0, eR: 0, vel: 0, spread: 0, pL: 0, pR: 0,
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
        'uniform float uSeed[13];',
        'const float TAU = 6.28318530718;',
        // bloom layout: hero at center; satellites at golden angles JITTERED by
        // their birth seed — placement is random, existence is not.
        'vec2 bloomPos(int i, float seed){',
        '  if (i == 0) return vec2(0.0, 0.0);',
        '  float fi = float(i);',
        '  float ang = fi * 2.39996 + 0.8 + (seed - 0.5) * 1.3;',
        '  float dst = 0.26 + 0.30 * fract(seed * 7.31) + 0.012 * fi;',
        '  return vec2(cos(ang), sin(ang)) * dst;',
        '}',
        'float bloomScale(int i, float seed){ return i == 0 ? 0.30 : (0.12 + 0.06 * fract(seed * 3.7)); }',
        'float bloomK(int i, float seed){ return i == 0 ? 8.0 : (5.0 + floor(fract(seed * 11.7) * 4.0)); }',
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
        '  float k = 0.15;',
        '  float acc = 0.0;',
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
        '    float sideE = i == 0 ? spread : (bp.x < 0.0 ? uEL : uER);',
        '    float wob = (0.05 + 0.10 * uBreath) * sin(uT * 0.35 + float(i) * 2.1 + th * 2.0);',
        // b can overshoot past 1 on birth — the WOAH pop
        '    float S = bloomScale(i, seed) * (0.25 + 0.75 * b) * (0.35 + 0.85 * sideE);',
        '    float R = S * (1.0 + (0.16 + wob * 0.5) * cos(bloomK(i, seed) * th + float(i) * 1.9 + sin(uT * 0.22 + float(i)) * 0.35));',
        '    float f = d / max(R, 1e-4);',
        '    acc += exp(-f / k);',
        '    float cr = S * (0.16 + 0.05 * uLit[i]);',
        '    float g1 = exp(-pow(d / cr, 2.0)) * min(b, 1.0);',
        '    coreSum += g1;',
        '    coreCol += (vec3(1.0, 0.47, 0.16) * g1 * (0.85 + uPulse * 0.5 + uLit[i] * 1.3)',
        '             +  vec3(1.0, 0.82, 0.6) * exp(-pow(d / (cr * 0.38), 2.0)) * min(b, 1.0) * (0.7 + uLit[i]));',
        '  }',
        '  float f = -k * log(max(acc, 1e-20));',
        // THE ILLUSION: inner bands flow outward, outer inward, converging on a
        // stationary ring — one continuous phase function, no seam possible.
        '  float dir = 1.0 - 2.0 * smoothstep(0.45, 0.65, f);',
        '  float bandsN = 4.2;',
        '  float phase = f * bandsN - uPh * dir;',
        '  float band = 0.5 + 0.5 * cos(TAU * phase);',
        '  band = pow(band, 0.70);',
        '  float ri = floor(phase + 0.5);',
        '  vec3 deep = vec3(0.05, 0.09, 0.30);',
        '  vec3 cream = vec3(0.97, 0.90, 0.80);',
        '  vec3 tint = ringTint(ri);',
        '  tint = mix(tint, vec3(0.98, 0.55, 0.38), 0.35 * (1.0 - smoothstep(0.0, 0.55, f)));',
        '  vec3 bc = mix(deep, tint, smoothstep(0.10, 0.78, band));',
        '  bc = mix(bc, cream, 0.55 * smoothstep(0.88, 1.0, band));',
        '  float inside = 1.0 - smoothstep(0.90, 1.02, f);',
        '  float presL = 0.40 + 0.60 * uPres;',
        '  col += bc * inside * presL * (0.52 + 0.44 * band) * (1.0 + uPulse * 0.18);',
        '  col += tint * exp(-max(f - 1.0, 0.0) * 4.0) * 0.10 * presL;',
        '  col += coreCol;',
        // ambient tease: tiny sister blooms far off in the black
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
    // V5 TIGHTNESS: the core already smooths hand input (dt*14) — smoothing
    // again at the same rate (V4 did dt*7!) doubled the felt lag. Near-
    // passthrough here so the only filter is the core's: Vespers-tight.
    s.eL += (tL - s.eL) * Math.min(1, dt * 28);
    s.eR += (tR - s.eR) * Math.min(1, dt * 28);
    s.spread = (s.eL + s.eR) / 2;
    if (s.pres < 0.12) { s.idleT = (s.idleT || 0) + dt; } else s.idleT = 0;
    const sleeping = (s.idleT || 0) > 12;
    // V5: blooms are WILLED. Spread is a 13-notch dial — each notch of reach
    // is one more bloom, IMMEDIATELY. No downbeat wait, no randomness in
    // existence. Placement re-rolls on each birth (that's the only dice).
    const pos = s.spread * 12.99;
    let count = 1;
    for (let i = 1; i < 13; i++) {
      if (!s.want[i] && !sleeping && pos >= i + 0.30) {
        s.want[i] = 1; s.seed[i] = Math.random(); s.pop[i] = 1;
        s.newBorn.push(i);
      } else if (s.want[i] && (sleeping || pos <= i - 0.40)) {
        s.want[i] = 0;
      }
      count += s.want[i];
    }
    s.count = count;
    s.uph += dt * (0.02 + Math.pow(s.spread, 1.4) * 0.42 + Math.min(0.5, s.vel) * 0.35) * (0.35 + 0.65 * s.pres);
    s.pulse = Math.max(0, s.pulse - dt * 3.2);
    for (let i = 0; i < 13; i++) {
      const want = i === 0 ? 1 : s.want[i];
      // pop in ~0.12s, gone in ~0.15s — as fast out as in
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
      g.fillText('FERRO BLOOM V5 · THE WILLED GARDEN', w / 2, h / 2 - 12);
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
      u.uBirth.value[i] = s.birth[i] * (1 + 0.35 * s.pop[i]); // overshoot = the pop
      u.uLit.value[i] = s.lit[i];
      u.uSeed.value[i] = s.seed[i];
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(200,190,210,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BLOOMS ' + s.count + ' / 13  ·  SPREAD ' + Math.round(s.spread * 100) + '%  ·  L ' + Math.round(s.eL * 100) + ' / R ' + Math.round(s.eR * 100) + (s.pres < 0.3 ? '  ·  SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const f = v.filter('lowpass', 600, 0.7);
    f.connect(v.group);
    const DEG = [0, 2, 4, 1, 3, 5, 6];
    const sideOf = i => i === 0 ? 0 : (Math.cos(i * 2.39996 + 0.8 + (P.state.seed[i] - 0.5) * 1.3) < 0 ? -1 : 1);
    const voices = [];
    for (let i = 0; i < 13; i++) {
      const d = DEG[i % 7], oct = i < 2 ? 0 : (i < 8 ? 1 : 2);
      const o = v.osc('sawtooth', H.chordTone(d, oct));
      const gg = v.g(0.0001);
      o.connect(gg); gg.connect(f);
      voices.push({ o, gg, d, oct });
    }
    const sub = v.osc('sine', H.rootFreq(-1));
    const subG = v.g(0.03); sub.connect(subG); subG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.6; f.connect(s2); s2.connect(A.revIn); }
    H.onChord(() => {
      voices.forEach(vc => A.set(vc.o.frequency, H.chordTone(vc.d, vc.oct), 2.2));
      A.set(sub.frequency, H.rootFreq(-1), 2.2);
    });
    v.fadeIn(1, 1.2);
    let nextT = T.next(0.25), step16 = 0, arpIdx = 0;
    return {
      tick(inp) {
        const s = P.state;
        A.set(f.frequency, 300 + s.spread * 2200 + Math.min(0.5, s.vel) * 1400 + s.pres * 300, 0.25);
        // a bloom exists → its voice sounds, on its side; gone → voice gone fast
        voices.forEach((vc, i) => {
          const on = i === 0 ? 1 : s.want[i];
          const se = sideOf(i);
          const sideE = se === 0 ? s.spread : (se < 0 ? s.eL : s.eR);
          A.set(vc.gg.gain, (on ? 0.011 + 0.013 * sideE : 0.0001) * (0.45 + 0.55 * s.pres), on ? 0.35 : 0.15);
        });
        MOut.expr('pad', s.spread); MOut.expr('arp', clamp(s.vel));
        // BIRTH BELLS: every willed bloom rings — snapped to the next 16th,
        // staggered 70ms apart so a big spread is a chime run, not a cluster
        let casc = 0;
        while (s.newBorn.length) {
          const bi = s.newBorn.shift();
          const deg = DEG[bi % 7];
          const at = Math.max(A.t() + 0.02, T.next(0.25)) + casc * 0.07;
          A.bell(H.chordTone(deg, 2), { at, vol: 0.065, dur: 2.4, rev: 0.7, pan: sideOf(bi) * 0.5 });
          MOut.evNote('bells', H.chordTone(deg, 2), 0.13, at, 2.0);
          s.lit[bi] = 1;
          casc++;
        }
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          if (st % 4 === 0 && s.spread > 0.62 && s.pres > 0.2) s.pulse = 1;
          const stepHit = s.spread < 0.22 ? (st % 16 === 0) : s.spread < 0.45 ? (st % 8 === 0) : s.spread < 0.72 ? (st % 4 === 0) : (st % 2 === 0);
          if (stepHit && s.pres > 0.15 && s.spread > 0.03 && s.count > 0) {
            const act = [0];
            for (let i = 1; i < 13; i++) if (s.want[i]) act.push(i);
            const bi = act[arpIdx % act.length];
            const freq = H.chordTone(DEG[bi % 7], 1);
            A.pluck2(freq, { at: tt, vol: 0.03 + s.spread * 0.045, pan: sideOf(bi) * 0.55, rev: 0.5, del: 0.25 });
            MOut.evNote('arp', freq, 0.1 + s.spread * 0.06, tt, 0.3);
            s.lit[bi] = 1;
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
