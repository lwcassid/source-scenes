/* ---------- SRC-15.3 · FERRO BLOOM V3 (the converging garden) ---------- */
reg({
  id: 'SRC-15.3', family: 'SRC-15', ver: 3,
  title: 'Ferro Bloom V3', tech: 'SHADER FIELD / MOTION ILLUSION',
  music: { bpm: 66, root: 50, mode: 'lydian', prog: [0, 1], chordBars: 8 },
  fx: {},
  tags: ['GROW+SHRINK ILLUSION', 'SPREAD = GARDEN', 'SIDES BLOOM APART', 'VESPERS-TIGHT'],
  desc: 'At rest: a small banded bud undulating in the black, with tiny sister-blooms drifting far off — the same flower language, whispered. Spread your hands and the garden OBEYS, instantly: the whole mass swells, blooms bud outward, and the gradient bands flow — outward through the inner flower, inward through the outer — converging on a stationary ring so the eye reads growing and shrinking at once. The garden is spatial: your left hand feeds the left side of the mass, your right feeds the right; starve one side and it shrinks back to buds while the other flourishes. Rings alternate warm and cool — blush pink, ember orange, teal, powder blue, lavender — soft wide gradients, never lines.',
  interact: 'SPREAD is everything: hands together = one tight bud; hands wide = the full garden, bigger, faster, blooming everywhere — and every millimeter of hand movement moves the mass NOW, nothing waits. L feeds the LEFT side’s blooms, R the RIGHT — grow one side alone, or balance them. Quick gestures splash energy into the flow; stillness lets it settle. New blooms still arrive on the downbeat, sung in by a bell.',
  sound: 'Each bloom is one voice of a voice-led lydian pad — spreading your hands literally thickens the chord, and each side’s blooms pan to their side. A grid-quantized arp lights each bloom’s core as its note plays (quarters at rest → sixteenths at full spread); gesture energy opens the filter. Sub root underneath. Ableton: pads ch2, arp ch4, bells ch5, CC74 = spread.',
  init(P) {
    P.state = {
      pres: 0, count: 1, target: 1, uph: 0, pulse: 0, breath: 0,
      eL: 0, eR: 0, vel: 0, spread: 0, pL: 0, pR: 0,
      birth: [1, 0, 0, 0, 0, 0, 0], lit: [0, 0, 0, 0, 0, 0, 0]
    };
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
      uBirth: { value: new Float32Array(7) }, uLit: { value: new Float32Array(7) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform float uT, uPh, uPres, uPulse, uBreath, uAmb, uEL, uER;',
        'uniform vec2 uRes;',
        'uniform float uBirth[7];',
        'uniform float uLit[7];',
        'const float TAU = 6.28318530718;',
        // bloom layout: hero at center, satellites budding around at golden angles
        'vec2 bloomPos(int i){',
        '  if (i == 0) return vec2(0.0, 0.0);',
        '  float fi = float(i);',
        '  float ang = fi * 2.39996 + 0.8;',
        '  float dst = 0.34 + 0.05 * mod(fi * 37.0, 3.0) / 3.0 + 0.02 * fi;',
        '  return vec2(cos(ang), sin(ang)) * dst;',
        '}',
        'float bloomScale(int i){ return i == 0 ? 0.30 : (0.15 + 0.045 * mod(float(i) * 53.0, 4.0) / 3.0); }',
        'float bloomK(int i){ return i == 0 ? 8.0 : (5.0 + mod(float(i) * 29.0, 4.0)); }',
        // ring palette: warm and cool rings ALTERNATE, like the reference —
        // blush, ember, teal, powder blue, lavender
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
        // SPREAD IS SIZE — the whole mass swells with your hands, instantly
        '  p /= 0.62 + 0.58 * spread;',
        '  float breathAmt = 0.015 + 0.035 * uBreath;',
        '  p *= 1.0 / (1.0 + breathAmt * sin(uT * 0.45));',
        '  float k = 0.15;',
        '  float acc = 0.0;',
        '  vec3 col = vec3(0.0);',
        '  float coreSum = 0.0; vec3 coreCol = vec3(0.0);',
        '  for (int i = 0; i < 7; i++){',
        '    float b = uBirth[i];',
        '    if (b < 0.02) continue;',
        '    vec2 bp = bloomPos(i);',
        '    vec2 q = p - bp;',
        '    float d = length(q);',
        '    float th = atan(q.y, q.x);',
        // EACH SIDE ANSWERS ITS HAND: left blooms live on L, right on R, live
        '    float sideE = i == 0 ? spread : (bp.x < 0.0 ? uEL : uER);',
        '    float wob = (0.05 + 0.10 * uBreath) * sin(uT * 0.35 + float(i) * 2.1 + th * 2.0);',
        '    float S = bloomScale(i) * (0.25 + 0.75 * b) * (0.35 + 0.85 * sideE);',
        '    float R = S * (1.0 + (0.16 + wob * 0.5) * cos(bloomK(i) * th + float(i) * 1.9 + sin(uT * 0.22 + float(i)) * 0.35));',
        '    float f = d / max(R, 1e-4);',
        '    acc += exp(-f / k);',
        '    float cr = S * (0.16 + 0.05 * uLit[i]);',
        '    float g1 = exp(-pow(d / cr, 2.0)) * b;',
        '    coreSum += g1;',
        '    coreCol += (vec3(1.0, 0.47, 0.16) * g1 * (0.85 + uPulse * 0.5 + uLit[i] * 1.3)',
        '             +  vec3(1.0, 0.82, 0.6) * exp(-pow(d / (cr * 0.38), 2.0)) * b * (0.7 + uLit[i]));',
        '  }',
        '  float f = -k * log(max(acc, 1e-20));',
        // THE ILLUSION: inner bands flow outward, outer inward, converging on a
        // stationary ring — one continuous phase function, no seam possible.
        '  float dir = 1.0 - 2.0 * smoothstep(0.45, 0.65, f);',
        '  float bandsN = 4.2;', // wide, airy bands — gradients, never lines
        '  float phase = f * bandsN - uPh * dir;',
        '  float band = 0.5 + 0.5 * cos(TAU * phase);',
        '  band = pow(band, 0.70);', // long soft crests, smooth shoulders
        '  float ri = floor(phase + 0.5);', // which ring am I on
        '  vec3 deep = vec3(0.05, 0.09, 0.30);',
        '  vec3 cream = vec3(0.97, 0.90, 0.80);',
        '  vec3 tint = ringTint(ri);',
        // warmth grows toward the heart of every bloom
        '  tint = mix(tint, vec3(0.98, 0.55, 0.38), 0.35 * (1.0 - smoothstep(0.0, 0.55, f)));',
        '  vec3 bc = mix(deep, tint, smoothstep(0.10, 0.78, band));',
        '  bc = mix(bc, cream, 0.55 * smoothstep(0.88, 1.0, band));',
        '  float inside = 1.0 - smoothstep(0.90, 1.02, f);',
        '  float presL = 0.40 + 0.60 * uPres;',
        '  col += bc * inside * presL * (0.52 + 0.44 * band) * (1.0 + uPulse * 0.18);',
        '  col += tint * exp(-max(f - 1.0, 0.0) * 4.0) * 0.10 * presL;',
        '  col += coreCol;',
        // ambient tease: tiny SISTER BLOOMS far off in the black — the same
        // flower language, whispered: banded polar roses, slow phase, faint
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
    // VESPERS RULE: the hands couple DIRECTLY and fast — every gesture lands now
    const tL = clamp(inp.L), tR = clamp(inp.R);
    s.vel = s.vel * Math.max(0, 1 - dt * 2.2) + (Math.abs(tL - s.pL) + Math.abs(tR - s.pR)) * 6;
    s.pL = tL; s.pR = tR;
    s.eL += (tL - s.eL) * Math.min(1, dt * 7);
    s.eR += (tR - s.eR) * Math.min(1, dt * 7);
    s.spread = (s.eL + s.eR) / 2;
    // abandoned gardens sleep back to a single bud
    if (s.pres < 0.12) { s.idleT = (s.idleT || 0) + dt; if (s.idleT > 12) s.target = 1; }
    else {
      s.idleT = 0;
      // SPREAD grows the family (Schmitt-stepped; the downbeat does the budding)
      const pos = s.spread * 6.99;
      const cur = s.target - 1;
      if (pos > cur + 0.85 && s.target < 7) s.target++;
      else if (pos < cur - 0.85 && s.target > 1) s.target--;
    }
    // flow: spread sets the current, gesture energy splashes into it
    s.uph += dt * (0.02 + Math.pow(s.spread, 1.4) * 0.42 + Math.min(0.5, s.vel) * 0.35) * (0.35 + 0.65 * s.pres);
    s.pulse = Math.max(0, s.pulse - dt * 3.2);
    for (let i = 0; i < 7; i++) {
      const want = i < s.count ? 1 : 0;
      s.birth[i] += (want - s.birth[i]) * Math.min(1, dt * 1.1);
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
      g.fillText('FERRO BLOOM V3 · THE CONVERGING GARDEN', w / 2, h / 2 - 12);
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
    for (let i = 0; i < 7; i++) { u.uBirth.value[i] = s.birth[i]; u.uLit.value[i] = s.lit[i]; }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(200,190,210,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BLOOMS ' + s.count + (s.target !== s.count ? ' → ' + s.target : '') + '  ·  SPREAD ' + Math.round(s.spread * 100) + '%  ·  L ' + Math.round(s.eL * 100) + ' / R ' + Math.round(s.eR * 100) + (s.pres < 0.3 ? '  ·  SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const f = v.filter('lowpass', 600, 0.7);
    f.connect(v.group);
    const DEG = [0, 2, 4, 1, 3, 5, 6];
    // pan each bloom's voice to its side of the garden
    const SIDE = [0, 1, 2, 3, 4, 5, 6].map(i => i === 0 ? 0 : (Math.cos(i * 2.39996 + 0.8) < 0 ? -1 : 1));
    const voices = DEG.map((d, i) => {
      const o = v.osc('sawtooth', H.chordTone(d, i < 2 ? 0 : 1));
      const gg = v.g(0.0001);
      o.connect(gg); gg.connect(f);
      return { o, gg, d, oct: i < 2 ? 0 : 1 };
    });
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
        // each side's voices follow that side's hand — the chord IS the garden
        voices.forEach((vc, i) => {
          const sideE = SIDE[i] === 0 ? s.spread : (SIDE[i] < 0 ? s.eL : s.eR);
          A.set(vc.gg.gain, (i < s.count ? 0.014 + 0.016 * sideE : 0.0001) * (0.45 + 0.55 * s.pres), 0.6);
        });
        MOut.expr('pad', s.spread); MOut.expr('arp', clamp(s.vel));
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          if (st === 0 && s.count !== s.target) {
            const growing = s.count < s.target;
            s.count += growing ? 1 : -1;
            const deg = DEG[Math.max(0, s.count - 1)];
            if (growing) {
              A.bell(H.chordTone(deg, 2), { at: tt, vol: 0.07, dur: 2.6, rev: 0.7 });
              MOut.evNote('bells', H.chordTone(deg, 2), 0.14, tt, 2.2);
            }
          }
          if (st % 4 === 0 && s.spread > 0.62 && s.pres > 0.2) s.pulse = 1;
          const stepHit = s.spread < 0.22 ? (st % 16 === 0) : s.spread < 0.45 ? (st % 8 === 0) : s.spread < 0.72 ? (st % 4 === 0) : (st % 2 === 0);
          if (stepHit && s.pres > 0.15 && s.spread > 0.03 && s.count > 0) {
            const bi = arpIdx % s.count;
            const freq = H.chordTone(DEG[bi], 1);
            A.pluck2(freq, { at: tt, vol: 0.03 + s.spread * 0.045, pan: SIDE[bi] * 0.55, rev: 0.5, del: 0.25 });
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
