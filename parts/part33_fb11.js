/* ---------- SRC-15.11 · FERRO BLOOM V11 (warm-to-cool palette, dots removed) ---------- */
reg({
  id: 'SRC-15.11', family: 'SRC-15', ver: 11,
  title: 'Ferro Bloom V11', tech: 'SHADER FIELD / MOTION ILLUSION',
  music: {
    bpm: 100, root: 48, mode: 'aeolian', chordBars: 2,
    // the soft-piano-blur MIDI, verbatim: a C PEDAL DRONE whose COLOR shifts —
    // the root never moves, the extensions do. Voicings preserved (values
    // past 12 keep the file's actual octave spread, incl. the G/Ab blur).
    chords: [
      [0, 15, 19, 20, 22],  // Cm7b13 — colors stacked high, bar 1 of the file
      [0, 7, 8, 15, 26],    // Cm9b13 — the G/Ab blur cluster
      [0, 10, 15, 17, 26],  // Cm11
      [0, 7, 10, 15, 22]    // Cm7 — resolution
    ],
    chordNames: ['Cm7♭13', 'Cm9♭13', 'Cm11', 'Cm7']
  },
  fx: {},
  tags: ['WILLED BLOOMS', 'ROLLED 9THS', 'BEATS EARN THEIR PLACE', 'CALL & RESPONSE'],
  desc: 'Dots are gone — back to a clean bloom surface. The bigger fix is color: hue is no longer a per-flower dice roll cycling the whole palette (that read as a rainbow); it is now one continuous field that runs warm on the left to cool on the right, echoing the library-wide side law, with a modest per-bloom jitter so neighboring flowers vary without breaking the sweep. Ember orange and blush pink anchor the warm end, teal/lavender/electric blue the cool end, with chartreuse as the pivot color in between. Rings within a single flower stay in that flower\'s own neighborhood instead of touring the full spectrum — the outward-flowing gradient motion is carried by brightness now, not by hue-hopping. Hero keeps its clean six-petal silhouette from V10. Music unchanged: a three-layer soundscape — C-minor pedal drone whose color shifts, a quantized groove that only exists once the garden is thrown wide open, and a reactive layer where every willed bloom, flick, and stillness sounds back at you.',
  interact: 'EACH HAND WILLS ITS OWN SIDE: L reach dials up to 6 flowers into the left half, R up to 6 into the right — instantly, one per notch, gone as fast when you pull back. Push a hand past ~65% and that side OVERFLOWS: small scatter blooms flood the full frame edge to edge, popping one after another all the way to max reach. Keep it small and it stays chamber-music quiet; throw both arms wide and the groove fades in, the arp climbing an octave when the scatter is out. Quick flicks fire log-drum answers only in full bloom. Stillness after a gesture invites the garden to answer.',
  sound: 'Pinned to a C minor pedal, made to jam (chord name on the HUD). DRONE: soft triangle voices, one per bloom, panned to their side, sub C underneath — the root never moves, the color does. QUANTIZED: chord shifts every 2 bars with a rolled entrance; groove (ch10: bell clave, shaker, sparse kick) exists ONLY past ~55% spread. REACTIVE: births roll chord tones, flicks fire log-drum answers, stillness earns the two-note reply. Ableton: pads ch2, bass 3, arp 4, bells 5, perc 10, CC74 = spread.',
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
        // V10: the HERO gets a dedicated, clean flower silhouette — six
        // deep-cut petals with flattened tips — instead of the shallow,
        // low-frequency wobble that read as a blob. Satellites keep the
        // V9 two-harmonic blend (soft round through spiky, seed-driven).
        'float bloomShapeR(int i, float seed, float th, float wob, float S){',
        '  if (i == 0) {',
        '    float phaseT = uT * 0.06 + sin(uT * 0.22) * 0.35;',
        '    float raw = cos(6.0 * th + phaseT);',
        '    float shaped = sign(raw) * pow(abs(raw), 0.6);',
        '    return S * (1.0 + (0.26 + wob * 0.4) * shaped);',
        '  }',
        '  float k1 = 3.0 + floor(fract(seed * 11.7) * 4.0);',
        '  float k2 = 7.0 + floor(fract(seed * 19.3) * 5.0);',
        '  float mixK = fract(seed * 27.1);',
        '  float phaseT = float(i) * 1.9 + uT * (seed - 0.5) * 0.7 + sin(uT * 0.22 + float(i)) * 0.35;',
        '  float lobe1 = cos(k1 * th + phaseT);',
        '  float lobe2 = cos(k2 * th + phaseT * 1.3 + 2.1);',
        '  float lobes = mix(lobe1, lobe2, mixK);',
        '  float amp = 0.09 + 0.30 * fract(seed * 8.3);',
        '  return S * (1.0 + (amp + wob * 0.5) * lobes);',
        '}',
        // V11: ORDERED warm→cool palette (7 stops, non-cyclic). Ember and
        // blush anchor the warm end, teal/lavender/electric-blue the cool
        // end, chartreuse sits as the pivot between them.
        'vec3 paletteStop(float i){',
        '  if (i < 0.5) return vec3(0.98, 0.62, 0.34);',   // ember orange — warmest
        '  if (i < 1.5) return vec3(0.95, 0.55, 0.62);',   // blush pink
        '  if (i < 2.5) return vec3(1.0, 0.341, 0.831);',  // hot orchid
        '  if (i < 3.5) return vec3(0.878, 1.0, 0.161);',  // acid chartreuse — the pivot
        '  if (i < 4.5) return vec3(0.16, 0.55, 0.58);',   // teal
        '  if (i < 5.5) return vec3(0.58, 0.56, 0.90);',   // lavender
        '  return vec3(0.0, 0.263, 1.0);',                  // electric blue — coolest
        '}',
        'vec3 warmCoolPalette(float t){',
        '  float x = clamp(t, 0.0, 1.0) * 6.0;',
        '  float seg = floor(x);',
        '  float fr = smoothstep(0.0, 1.0, x - seg);',
        '  return mix(paletteStop(seg), paletteStop(min(seg + 1.0, 6.0)), fr);',
        '}',
        'void main(){',
        '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
        '  float spread = (uEL + uER) * 0.5;',
        '  p /= 0.62 + 0.58 * spread;',
        '  float breathAmt = 0.015 + 0.035 * uBreath;',
        '  p *= 1.0 / (1.0 + breathAmt * sin(uT * 0.45));',
        // V7: constant union softness — the flowers INTERMESH into one
        // breathing mass again (the V5 look Lance preferred)
        '  float k = 0.15;',
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
        '    float R = bloomShapeR(i, seed, th, wob, S);',
        '    float f = d / max(R, 1e-4);',
        '    float w = exp(-f / k);',
        '    acc += w;',
        // V11: hue comes from this bloom's POSITION (warm left, cool right —
        // the library-wide side law) plus a modest per-seed jitter, instead
        // of an unrelated per-bloom random hue. Neighboring blooms land near
        // each other in the palette, so the composition reads as a sweep,
        // not a scatter of unrelated colors.
        '    float posBias = clamp(bp.x * 0.8 + 0.5, 0.0, 1.0);',
        '    float hueJitter = (fract(seed * 13.7) - 0.5) * 0.36;',
        '    hueAcc += clamp(posBias + hueJitter, 0.0, 1.0) * w;',
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
        '      coreCol += vec3(1.0, 0.72, 0.48) * ring * pp * 0.20;',
        '    }',
        '  }',
        // V8 OVERFLOW: past ~65% reach on a side, small scatter blooms flood
        // that half of the FULL frame — staggered thresholds so pushing to
        // max pops them one after another, edge to edge. Same union field,
        // so they intermesh with the mass. Existence is willed (steep gates
        // on the hand); only placement and petal count are dice.
        '  for (int j = 0; j < 16; j++){',
        '    float sj = float(j);',
        '    float h1 = fract(sin(sj * 127.1 + 3.7) * 43758.5453);',
        '    float h2 = fract(sin(sj * 269.5 + 1.3) * 43758.5453);',
        '    float h3 = fract(sin(sj * 419.2 + 7.1) * 43758.5453);',
        '    float sideE = j < 8 ? uEL : uER;',
        '    float th0 = 0.62 + 0.33 * h1;',
        '    float gate = smoothstep(th0, th0 + 0.045, sideE);',
        '    if (gate < 0.01) continue;',
        '    float sx = (0.28 + 0.44 * h2) * (j < 8 ? -1.0 : 1.0);',
        '    float sy = (h3 - 0.5) * 0.92;',
        '    vec2 q = p - vec2(sx, sy);',
        '    float d2 = length(q);',
        '    float th2 = atan(q.y, q.x);',
        '    float kk = 3.0 + floor(h1 * 7.0);',
        '    float amp2 = 0.14 + 0.22 * h2;',
        '    float S2 = (0.050 + 0.045 * h2) * gate * (0.7 + 0.3 * sideE);',
        '    float R2 = S2 * (1.0 + amp2 * cos(kk * th2 + sj * 2.3 + uT * (h3 - 0.5) * 0.8));',
        '    float f2 = d2 / max(R2, 1e-4);',
        '    float w2 = exp(-f2 / k);',
        '    acc += w2;',
        '    float posBias2 = clamp(sx * 0.8 + 0.5, 0.0, 1.0);',
        '    float hueJitter2 = (h3 - 0.5) * 0.36;',
        '    hueAcc += clamp(posBias2 + hueJitter2, 0.0, 1.0) * w2;',
        '    coreCol += vec3(1.0, 0.62, 0.30) * exp(-pow(d2 / max(S2 * 0.30, 1e-4), 2.0)) * gate * 0.28;',
        '  }',
        '  float f = -k * log(max(acc, 1e-20));',
        '  float hueOff = clamp(hueAcc / max(acc, 1e-20), 0.0, 1.0);',
        // V7: the bent-phase illusion is BACK (V5's energy), seam tamed not
        // erased — uPh wraps mod 4 (the tint period) so the converging
        // filigree stays a slim bounded band of fine detail, never a wall.
        '  float dir = 1.0 - 2.0 * smoothstep(0.48, 0.62, f);',
        // V9 SOFT GRADIENT: fewer, wider bands and a compressed cosine swing
        // so luminance never flatlines at either extreme — this is what
        // carries the outward-flowing motion now, not hue-cycling.
        '  float bandsN = 2.6;',
        '  float phase = f * bandsN - mod(uPh, 4.0) * dir;',
        '  float band = 0.5 + 0.28 * cos(TAU * phase);',
        '  vec3 deep = vec3(0.05, 0.09, 0.30);',
        '  vec3 cream = vec3(0.97, 0.90, 0.80);',
        '  float warmMix = 0.35 * (1.0 - smoothstep(0.0, 0.55, f));',
        // V11: hue stays within this region's own neighborhood — only a
        // gentle wobble across rings — instead of touring the full palette
        // every band, which was the rainbow effect.
        '  float hueWobble = 0.035 * sin(phase * 1.3);',
        '  float t = clamp(hueOff + hueWobble, 0.0, 1.0);',
        '  vec3 tint = warmCoolPalette(t);',
        '  tint = mix(tint, vec3(0.98, 0.55, 0.38), warmMix);',
        '  vec3 bc = mix(deep, tint, smoothstep(0.0, 1.0, band));',
        '  bc = mix(bc, cream, 0.40 * smoothstep(0.55, 0.78, band));',
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
        '    float ambT = clamp(aq.x * 0.6 + 0.5, 0.0, 1.0);',
        '    col += mix(deep, warmCoolPalette(ambT), aband) * ain * 0.34 * uAmb;',
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
      g.fillText('FERRO BLOOM V11 · WARM TO COOL', w / 2, h / 2 - 12);
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
      u.uBirth.value[i] = s.birth[i] * (1 + 0.25 * s.pop[i]);
      u.uLit.value[i] = s.lit[i];
      u.uPop.value[i] = s.pop[i];
      u.uSeed.value[i] = s.seed[i];
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(200,190,210,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BLOOMS ' + s.count + '/13 (L ' + (s.cL || 0) + ' · R ' + (s.cR || 0) + ')' + ((s.eL > 0.66 || s.eR > 0.66) ? ' + SCATTER' : '') + '  ·  ' + (H.label || '') + '  ·  L ' + Math.round(s.eL * 100) + ' / R ' + Math.round(s.eR * 100) + (s.pres < 0.3 ? '  ·  SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const f = v.filter('lowpass', 600, 0.7);
    f.connect(v.group);
    const sideOf = i => i === 0 ? 0 : (i <= 6 ? -1 : 1);
    // V7: NO JET. Triangle voices, quiet, and chord changes SNAP with a tiny
    // glide (0.18s) instead of a 1.6s portamento smear across 13 saws.
    const voices = [];
    for (let i = 0; i < 13; i++) {
      const o = v.osc('triangle', H.chordTone(i, 0));
      const gg = v.g(0.0001);
      o.connect(gg); gg.connect(f);
      voices.push({ o, gg, idx: i });
    }
    const sub = v.osc('sine', H.chordTone(0, -1));
    const subG = v.g(0.026); sub.connect(subG); subG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.6; f.connect(s2); s2.connect(A.revIn); }
    let answered = false;
    H.onChord(() => {
      voices.forEach(vc => A.set(vc.o.frequency, H.chordTone(vc.idx, 0), 0.18));
      A.set(sub.frequency, H.chordTone(0, -1), 0.3);
      answered = false;
      // V7: the TRANSITION is the featured moment — each chord change gets a
      // gentle low-to-high roll (the vibe of the inspiration MIDI), scaled by
      // how much garden is awake
      const s = P.state;
      if (s.pres > 0.2) {
        const base = T.next(0.25);
        const nn = s.spread > 0.5 ? 4 : 3;
        for (let ri = 0; ri < nn; ri++) {
          const freq = H.chordTone(ri, 1);
          const at = base + ri * 0.09;
          A.bell(freq, { at, vol: 0.032 + 0.008 * s.spread, dur: 3.2, rev: 0.8, pan: (ri - 1.5) * 0.2 });
          MOut.evNote('bells', freq, 0.09, at, 2.6);
        }
      }
    });
    v.fadeIn(1, 1.2);
    // gentle afrobeat: son-clave bell, shaker 16ths, sparse kick, log answers
    const BELL = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
    const KICKP = [1, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 1, 0, 0, 0, 0, 0];
    let nextT = T.next(0.25), step16 = 0, arpIdx = 0, sparkIdx = 0, fillCool = 0;
    return {
      tick(inp) {
        const s = P.state;
        // V7: FLOWER-POWER GATE — percussion exists only when the garden is
        // wide open. Below that: pads, rolls, answers. Silence has room.
        const flower = clamp((s.spread - 0.55) / 0.3);
        A.set(f.frequency, 320 + s.spread * 1600 + Math.min(0.5, s.vel) * 900 + s.pres * 260, 0.25);
        voices.forEach((vc, i) => {
          const on = i === 0 ? 1 : s.want[i];
          const se = sideOf(i);
          const sideE = se === 0 ? s.spread : (se < 0 ? s.eL : s.eR);
          A.set(vc.gg.gain, (on ? 0.0065 + 0.008 * sideE : 0.0001) * (0.45 + 0.55 * s.pres), on ? 0.35 : 0.15);
        });
        MOut.expr('pad', s.spread); MOut.expr('arp', clamp(s.vel));
        // births roll their chord tones — darker register, quieter than V6
        let casc = 0;
        while (s.newBorn.length) {
          const bi = s.newBorn.shift();
          const pan = sideOf(bi) * 0.5;
          const base = Math.max(A.t() + 0.02, T.next(0.25)) + casc * 0.05;
          [0, 1, 2].forEach(ri => {
            const freq = H.chordTone((bi % 5) + ri * 2, 0);
            const at = base + ri * 0.07;
            A.bell(freq, { at, vol: 0.030 + ri * 0.004, dur: 2.2, rev: 0.7, pan });
            MOut.evNote('bells', freq, 0.08, at, 1.9);
          });
          s.lit[bi] = 1;
          casc++;
        }
        // gesture flick → log-drum answer, only once the garden is open
        fillCool = Math.max(0, fillCool - 0.03);
        if (s.vel > 0.55 && fillCool <= 0 && flower > 0) {
          fillCool = 0.6;
          const pan = s.eL > s.eR ? -0.4 : 0.4;
          const t1 = T.next(0.25), t2 = t1 + T.beat * 0.25;
          A.pluck2(H.chordTone(0, 0), { at: t1, vol: 0.06 * flower, dur: 0.3, pan, rev: 0.25 });
          A.pluck2(H.chordTone(2, 0), { at: t2, vol: 0.05 * flower, dur: 0.3, pan: -pan * 0.5, rev: 0.25 });
          MOut.evDrum(64, 0.4 * flower, t1); MOut.evDrum(63, 0.32 * flower, t2);
        }
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const st32 = step16 % 32; // 2-bar chord phrase
          const tt = nextT;
          // EXPANDED FLOWER POWER ONLY: the groove fades in past ~55% spread
          if (flower > 0 && s.pres > 0.25) {
            if (BELL[st]) {
              A.pluck2(H.scaleTone(4, 1), { at: tt, vol: 0.020 * flower, dur: 0.12, pan: 0.3, rev: 0.12 });
              MOut.evDrum(56, 0.3 * flower, tt);
            }
            A.hat(tt, { vol: (0.008 + (st % 4 === 2 ? 0.010 : 0)) * flower });
            if (KICKP[st] && flower > 0.4) {
              A.kick(tt, 0.15 * flower * KICKP[st]);
              s.pulse = 1;
            }
            if (st === 0 && flower > 0.3) {
              A.bassNote(H.chordTone(0, -1), { at: tt, vol: 0.055 * flower, dur: 0.5 });
              MOut.evNote('bass', H.chordTone(0, -1), 0.25 * flower, tt, 0.45);
            }
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
          // arp is garnish, and only in full bloom — when the scatter tier is
          // out (either side pushed past ~65%) it sparkles an octave higher
          if (st % 2 === 0 && flower > 0.2 && s.pres > 0.15) {
            const act = [0];
            for (let i = 1; i < 13; i++) if (s.want[i]) act.push(i);
            const bi = act[arpIdx % act.length];
            const scatter = (s.eL > 0.66 || s.eR > 0.66) && arpIdx % 3 === 0;
            const freq = H.chordTone(bi, scatter ? 2 : 1);
            A.pluck2(freq, { at: tt, vol: 0.016 * flower + 0.012, pan: sideOf(bi) * 0.55, rev: 0.5, del: 0.25 });
            MOut.evNote('arp', freq, 0.07 * flower + 0.03, tt, 0.3);
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
