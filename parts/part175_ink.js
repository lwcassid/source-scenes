/* ---------- SRC-45 · INK BLOOM V1 (thrown pigment, bled contours)
   Nima's brief: "a visual hallucinogen that is almost just ink splattering
   on the canvas, and even the colors from the bloom scene."

   So: Ferro Bloom's exact 7-stop warm→cool palette (ember · blush · orchid ·
   chartreuse · teal · lavender · electric blue), but the FORM is thrown ink
   instead of grown flowers. One hand per side gathers a pool of pigment and
   HURLS it at the wall. Reach is the whole mechanic — it charges the pool
   (so it sets how OFTEN you throw), it sizes the splat, and it flings the
   splat further across the frame. Both hands wide and the warm ink from the
   left meets the cool ink from the right in the middle, where the contour
   bands of the two fields interfere and marble. That collision is the
   payoff, and it is the hallucinogen.

   Everything is ONE metaball field F: the silhouette is a threshold on F,
   the colour is a contour band walking the palette by F, and the marbling
   where splats overlap is what F does when you add two of them. A single
   domain-warped fbm — evaluated ONCE per pixel, amplitude riding wetness —
   is the wet paper: it drags every silhouette into fingers and tendrils and
   is the only thing that makes this read as ink rather than as blobs.

   The band FLOW runs on its own clock (Ferro V14's law — no gesture speeds
   the gradient up or drags it); wetness only sets how MANY bands there are,
   which is structural, read off the field itself, never a wash over the
   picture.
   ------------------------------------------------------------------ */
reg({
  id: 'SRC-45', family: 'SRC-45', ver: 1,
  title: 'Ink Bloom', tech: 'THROWN INK / BLED CONTOURS',
  music: {
    bpm: 84, root: 50, mode: 'aeolian', chordBars: 2,
    // A D-minor PEDAL whose colour shifts — the root never moves. Slow
    // enough to drip, dark enough that the picture's saturation reads as
    // beauty rather than as a power-up.
    chords: [
      [0, 10, 15, 19, 26],  // Dm9      — D C F A E
      [0, 10, 15, 20, 26],  // Dm9♭13   — the Bb leans the colour down
      [0, 10, 17, 19, 26],  // Dm11     — G opens it back out
      [0, 8, 15, 19, 22]    // B♭maj9/D — the light comes on, root holds
    ],
    chordNames: ['Dm9', 'Dm9♭13', 'Dm11', 'B♭maj9/D']
  },
  fx: {},
  tags: ['THROWN INK', 'BLED CONTOURS', 'MARBLING PAYOFF', 'BLOOM PALETTE'],
  desc: 'Luminous ink hurled at a black wall. Each hand gathers a pool of pigment at its own edge of the frame — you can see it swell, and hear it gather — and when the pool fills it THROWS: a ragged splat lands with a slap, flings its own droplets, and immediately starts bleeding outward into the paper. Every splat is banded like a cut agate, concentric contours running the Ferro Bloom palette — ember orange and blush pink and hot orchid out of the left hand, chartreuse and teal and lavender and electric blue out of the right. Reach is the only dial: it charges the pool (so it sets how often you throw), it sizes the splat, and it flings the splat further across the frame. Push both hands and the warm ink and the cool ink land on top of each other in the middle, where their contour bands interfere and MARBLE — the picture stops being separate blots and becomes one running, hallucinating wash. Then it dries: ink fades back into the black on its own clock, so the canvas never fills up and minute nine never looks like minute one. Left alone, one slow resting stain keeps breathing and creeping in the dark.',
  interact: 'REACH IS THE THROW. Each hand owns its side: reach toward the source and a pool of pigment gathers at that edge, glowing brighter and swelling as it charges — reach further and it charges faster, so a hand held wide throws about once a second and a hand held low throws every several seconds. When the pool fills, it hurls a splat: reach at the moment of release sets how BIG the splat is and how FAR across the frame it flies, so a soft hand stipples its own edge and a committed hand throws all the way past the centre line. Both hands committed = warm ink and cool ink landing on each other in the middle, contours interfering, the canvas going wet and marbled — that is when the groove arrives. The gradient flowing through the bands runs on its own clock throughout; no gesture speeds it up. Let go and the ink dries back into the black.',
  sound: 'Pinned to a D minor pedal (chord name on the HUD). DRONE: one soft triangle voice per living splat, panned where it landed, pitched down the chord ladder by how big it is, its level following the ink as it dries — so the chord literally thickens with the picture and thins as it fades. Sub D underneath; the bed filter opens with wetness (the sound is the light). REACTIVE: the CHARGE is audible — a filtered breath per side that rises with the pool and is cut by the throw, so a hand is heard before it is seen. Every splat lands as a soft mallet with a long tail (low for a big splat, high for a small one), panned where it hit, big ones carrying a sub thud and a floor tom. QUANTIZED: the groove is EARNED — nothing until the canvas is genuinely wet past ~55%, then shaker, then hats, then a sparse kick, fading in with the flood. THE REST: left alone the stain breathes — randomized low pedal swells 9-25s apart, about one in seven answered by a single drip-bell tease. Ableton: strike → bells (velocity by size) plus ONE placed pad note per splat, big-splat thuds on toms 41/43, groove on the R&B kit (36/42/51), CC74: pad = wetness, bells = throw energy, perc = flood gate.',

  init(P) {
    const N = 10;             // slot 0 is the resting stain; 1..9 are thrown
    P.state = {
      N, pres: 0, idleT: 0,
      eL: 0, eR: 0, dbL: 0, dbR: 0, pL: 0, pR: 0, vel: 0, still: 0,
      chL: 0, chR: 0,         // the gathering pools
      wet: 0, flow: 0, mass: 0,
      thrown: 0,              // lifetime count, for the HUD
      throwQ: [],             // { side, size, pan, slot } handed to audio()
      blot: []
    };
    for (let i = 0; i < N; i++) {
      P.state.blot.push({ x: 0, y: 0, r: 0, a: 0, seed: Math.random(), hue: 0.5, warm: 1, pop: 0, ang: 0, ecc: 1 });
    }
    // THE RESTING STAIN — slot 0 is never thrown and never fully dries. It
    // is the idle tease: something alive in the dark that creeps and
    // breathes, hinting at ink without giving away that ink gets THROWN.
    const st = P.state.blot[0];
    st.x = -0.22; st.y = 0; st.r = 0.095; st.a = 0.88; st.hue = 0.34; st.warm = 0.66;

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
      uFlow: { value: 0 }, uWet: { value: 0 }, uPres: { value: 0 },
      uChL: { value: 0 }, uChR: { value: 0 },
      uPX: { value: new Float32Array(N) }, uPY: { value: new Float32Array(N) },
      uR: { value: new Float32Array(N) }, uA: { value: new Float32Array(N) },
      uS: { value: new Float32Array(N) }, uHue: { value: new Float32Array(N) },
      uWarm: { value: new Float32Array(N) }, uPop: { value: new Float32Array(N) },
      uAng: { value: new Float32Array(N) }, uEcc: { value: new Float32Array(N) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform float uT, uFlow, uWet, uPres, uChL, uChR;',
        'uniform vec2 uRes;',
        'uniform float uPX[10];',
        'uniform float uPY[10];',
        'uniform float uR[10];',
        'uniform float uA[10];',
        'uniform float uS[10];',
        'uniform float uHue[10];',
        'uniform float uWarm[10];',
        'uniform float uPop[10];',
        'uniform float uAng[10];',
        'uniform float uEcc[10];',
        'const float TAU = 6.28318530718;',

        // --- the wet paper: one value-noise fbm, warping the whole plane ---
        'float h21(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }',
        'float vnoise(vec2 q){',
        '  vec2 i = floor(q), f = fract(q);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x),',
        '             mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);',
        '}',
        'float fbm(vec2 q){',
        '  float a = 0.5, s = 0.0;',
        '  for (int k = 0; k < 4; k++){ s += a * vnoise(q); q = q * 2.03 + vec2(1.7, 9.2); a *= 0.5; }',
        '  return s;',
        '}',

        // --- FERRO BLOOM's palette, verbatim: this is the colour world the
        //     brief asked for. 7 ordered stops, warmest to coolest. ---
        'vec3 paletteStop(float i){',
        '  if (i < 0.5) return vec3(0.98, 0.62, 0.34);',   // ember orange
        '  if (i < 1.5) return vec3(0.95, 0.55, 0.62);',   // blush pink
        '  if (i < 2.5) return vec3(1.0, 0.341, 0.831);',  // hot orchid
        '  if (i < 3.5) return vec3(0.878, 1.0, 0.161);',  // acid chartreuse
        '  if (i < 4.5) return vec3(0.16, 0.55, 0.58);',   // teal
        '  if (i < 5.5) return vec3(0.58, 0.56, 0.90);',   // lavender
        '  return vec3(0.0, 0.263, 1.0);',                  // electric blue
        '}',
        'vec3 ramp(float t){',
        '  float x = clamp(t, 0.0, 1.0) * 6.0;',
        '  float i = floor(x);',
        '  return mix(paletteStop(i), paletteStop(i + 1.0), smoothstep(0.0, 1.0, fract(x)));',
        '}',

        'void main(){',
        '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
        // THE BLEED — one domain warp, evaluated once, inherited by every
        // silhouette in the frame. Dry paper barely moves; a wet canvas
        // drags every edge out into fingers.
        '  float wa = fbm(p * 6.5 + vec2(uT * 0.055, -uT * 0.041));',
        '  float wb = fbm(p * 6.5 + vec2(4.7, 2.3) + vec2(-uT * 0.035, uT * 0.049));',
        '  vec2 q = p + (vec2(wa, wb) - 0.5) * (0.052 + 0.105 * uWet);',

        '  float F = 0.0, hueW = 0.0, wSum = 0.0;',
        '  vec3 core = vec3(0.0);',
        '  for (int i = 0; i < 10; i++){',
        '    float a = uA[i];',
        '    if (a <= 0.004) continue;',
        '    vec2 c = vec2(uPX[i], uPY[i]);',
        '    vec2 d = q - c;',
        '    float R = uR[i];',
        '    if (dot(d, d) > R * R * 12.0) continue;',
        '    float sd = uS[i];',
        '    float ca = cos(uAng[i]), sa = sin(uAng[i]);',
        '    vec2 dE = vec2(d.x * ca + d.y * sa, -d.x * sa + d.y * ca);',
        '    dE.x /= uEcc[i]; dE.y *= uEcc[i];',
        '    float th = atan(dE.y, dE.x) + uAng[i];',
        // ragged, seeded silhouette — two lobe harmonics blended, so no two
        // splats have the same outline
        '    float k1 = 7.0 + floor(fract(sd * 13.1) * 6.0);',
        '    float k2 = 15.0 + floor(fract(sd * 29.7) * 9.0);',
        '    float ln = length(dE);',
        '    float lob = (cos(k1 * th + sd * 21.0) * 0.32',
        '              +  cos(k2 * th + sd * 11.0 + uT * 0.05) * 0.26',
        '              +  cos((k1 + k2) * th + sd * 37.0) * 0.20',
        '              +  cos((k2 * 2.0 + 5.0) * th + sd * 53.0) * 0.14',
        '              +  cos((k1 * 3.0 + 7.0) * th + sd * 71.0) * 0.08)',
        '             * smoothstep(0.0, R * 0.55, ln);',
        '    float rr = R * (1.0 + 0.26 * lob);',
        '    float u = ln / max(rr, 1e-4);',
        '    float aa2 = a * a;',
        '    float f = aa2 * exp(-pow(u, 3.0) * 1.15);',
        // the flung droplets — what makes it a SPLATTER and not a blob
        '    for (int j = 0; j < 3; j++){',
        '      float fj = float(j);',
        '      float aa = fract(sd * (3.13 + fj * 1.77)) * TAU;',
        '      float dd = R * (1.50 + 1.70 * fract(sd * (7.31 + fj * 2.91)));',
        '      float rs = R * (0.055 + 0.075 * fract(sd * (11.9 + fj * 0.71)));',
        '      float uu = length(d - vec2(cos(aa), sin(aa)) * dd) / max(rs, 1e-4);',
        '      f += aa2 * 0.75 * exp(-pow(uu, 3.0) * 1.5);',
        '    }',
        '    F += f; hueW += uHue[i] * f * f; wSum += f * f;',
        '    core += mix(vec3(0.45, 0.28, 1.0), vec3(1.0, 0.55, 0.20), uWarm[i])',
        '          * exp(-pow(u / 0.42, 2.0)) * uPop[i] * 1.5;',
        '  }',

        // THE POOLS — pigment gathering at each edge before the throw. They
        // feed the same field, so they band and marble like everything else.
        '  vec2 dl = q - vec2(-0.60 + sin(uT * 0.19) * 0.02, sin(uT * 0.23) * 0.10);',
        '  float Rl = 0.030 + 0.085 * uChL;',
        '  float ul = length(dl) / Rl;',
        '  float fl = exp(-pow(ul, 2.4) * 1.3) * (0.28 + 0.80 * uChL) * uPres;',
        '  F += fl; hueW += 0.14 * fl * fl; wSum += fl * fl;',
        '  core += vec3(1.0, 0.55, 0.20) * exp(-pow(ul / 0.55, 2.0)) * uChL * uPres * 0.6;',
        '  vec2 dr = q - vec2(0.60 - sin(uT * 0.17) * 0.02, sin(uT * 0.21 + 2.1) * 0.10);',
        '  float Rr = 0.030 + 0.085 * uChR;',
        '  float ur = length(dr) / Rr;',
        '  float fr = exp(-pow(ur, 2.4) * 1.3) * (0.28 + 0.80 * uChR) * uPres;',
        '  F += fr; hueW += 0.88 * fr * fr; wSum += fr * fr;',
        '  core += vec3(0.45, 0.28, 1.0) * exp(-pow(ur / 0.55, 2.0)) * uChR * uPres * 0.6;',

        '  float hue = wSum > 1e-4 ? hueW / wSum : 0.5;',
        // THE BANDS — contours of the field itself. Where two splats overlap
        // the contours bend through each other and marble; that interference
        // is the whole picture, and it costs nothing but the sum.
        '  float bandPos = F * (1.7 + 1.6 * uWet) - uFlow;',
        '  float bs = pow(0.5 + 0.5 * cos(TAU * bandPos), 0.72);',
        '  float tt = clamp(hue + (fract(bandPos) - 0.5) * 0.40, 0.0, 1.0);',
        '  vec3 deep = vec3(0.035, 0.055, 0.17);',
        '  vec3 col = mix(deep, ramp(tt), bs);',
        '  float ink = smoothstep(0.26, 0.50, F);',
        '  col *= ink;',
        // luminous edge: the only place white-hot light is spent
        '  col += ramp(clamp(hue + 0.12, 0.0, 1.0)) * exp(-pow((F - 0.34) / 0.075, 2.0)) * (0.35 + 0.50 * uWet);',
        '  col += core * smoothstep(0.12, 0.34, F);',
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
    if (s.vel < 0.06 && s.pres > 0.3) s.still += dt; else s.still = 0;
    if (s.pres < 0.12) s.idleT += dt; else s.idleT = 0;

    // deadband so a held hand doesn't shimmer the pool, then track fast
    // (Vespers-tight): a real move must reach the pigment with no lag.
    const DEAD = 0.006;
    const settle = (raw, held) => { const d = raw - held; return Math.abs(d) > DEAD ? raw - Math.sign(d) * DEAD : held; };
    s.dbL = settle(tL, s.dbL); s.dbR = settle(tR, s.dbR);
    s.eL += (s.dbL - s.eL) * Math.min(1, dt * 9);
    s.eR += (s.dbR - s.eR) * Math.min(1, dt * 9);

    // THE CHARGE — reach² so a low hand stipples slowly and a wide hand
    // hurls about once a second. Reach is rate AND size AND range: one dial.
    const rate = e => e * e * 0.95;
    const gate = s.pres > 0.15 ? 1 : 0;
    s.chL = Math.min(1, s.chL + dt * rate(s.eL) * gate);
    s.chR = Math.min(1, s.chR + dt * rate(s.eR) * gate);
    // ONE THROW = ONE STATEMENT: take the faintest slot, land it on the
    // thrower's side, fling it further the harder the hand committed.
    const hurl = (side, e) => {
      let slot = 1, worst = 2;
      for (let i = 1; i < s.N; i++) { if (s.blot[i].a < worst) { worst = s.blot[i].a; slot = i; } }
      const b = s.blot[slot];
      b.x = side * (0.68 - e * Math.random() * 1.00);
      b.y = (Math.random() - 0.5) * (0.55 + 0.42 * e);
      b.r = (0.048 + 0.115 * e) * (0.70 + 0.60 * Math.random());
      b.a = 1; b.pop = 1; b.seed = Math.random();
      b.ang = (side < 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.1;
      b.ecc = 1.10 + 0.42 * e * Math.random();
      b.warm = side < 0 ? 1 : 0;
      // warm hand throws ember->orchid, cool hand chartreuse->blue; the band
      // walk carries each splat across its neighbouring stops from there.
      b.hue = side < 0 ? Math.random() * 0.30 : 0.55 + Math.random() * 0.35;
      s.thrown++;
      if (s.throwQ.length < 24) s.throwQ.push({ slot, size: b.r, pan: clamp(b.x / 0.8, -1, 1), side });
    };
    if (s.chL >= 1) { s.chL = 0; hurl(-1, s.eL); }
    if (s.chR >= 1) { s.chR = 0; hurl(1, s.eR); }
    if (!gate) { s.chL = Math.max(0, s.chL - dt * 0.5); s.chR = Math.max(0, s.chR - dt * 0.5); }

    // THE STAIN (slot 0) — always there, breathing, creeping, and pushed
    // under by the thrown ink once someone is actually playing.
    const st0 = s.blot[0];
    st0.x = -0.22 + Math.sin(t * 0.037) * 0.22 + Math.sin(t * 0.013) * 0.11;
    st0.y = Math.cos(t * 0.029) * 0.15;
    st0.r = 0.092 + 0.026 * Math.sin(t * 0.11) + 0.017 * Math.sin(t * 0.047);
    st0.a = (0.86 + 0.12 * Math.sin(t * 0.083)) * (1 - clamp(s.mass * 0.85) * 0.72);
    st0.hue = 0.34 + 0.30 * Math.sin(t * 0.021);
    st0.warm = clamp(1 - st0.hue);
    st0.pop = 0.20 + 0.10 * Math.sin(t * 0.13) + 0.06 * Math.sin(t * 0.052);
    st0.ang = t * 0.011;
    st0.ecc = 1.20 + 0.16 * Math.sin(t * 0.043);

    // ink LIVES: it creeps outward while wet and dries back into the black.
    // Wetter canvas = faster creep and slower drying, so a committed player
    // keeps the whole field alive and a soft one watches it recede.
    let mass = 0;
    for (let i = 1; i < s.N; i++) {
      const b = s.blot[i];
      if (b.a <= 0) continue;
      b.r = Math.min(0.30, b.r + dt * b.r * (0.020 + 0.090 * s.wet));
      b.a -= dt * (0.052 + 0.055 * (1 - s.wet));
      b.pop = Math.max(0, b.pop - dt * 2.4);
      if (b.a <= 0) { b.a = 0; b.r = 0; }
      else mass += b.a * b.r * 4.2;
    }
    s.mass = mass;

    // WETNESS — hand-owned first (immediate), flood second (earned). This is
    // the hallucinogen dial: the bleed amplitude, the band count, the bed's
    // filter and the groove gate all read it.
    const wetT = clamp(s.pres * (0.14 + 0.44 * ((s.eL + s.eR) / 2)) + Math.min(0.28, mass * 0.34));
    s.wet += (wetT - s.wet) * Math.min(1, dt * 4);

    // the gradient runs on ITS OWN clock — no gesture speeds it up or drags
    // it (Ferro V14's law); presence only lets an abandoned canvas settle.
    s.flow += dt * (0.085 + 0.115 * s.pres);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#04050c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(180,160,210,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('INK BLOOM · THROWN PIGMENT', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = t; u.uFlow.value = s.flow;
    u.uWet.value = s.wet; u.uPres.value = s.pres;
    u.uChL.value = s.chL; u.uChR.value = s.chR;
    let alive = 0;
    for (let i = 0; i < s.N; i++) {
      const b = s.blot[i];
      u.uPX.value[i] = b.x; u.uPY.value[i] = b.y;
      u.uR.value[i] = b.r; u.uA.value[i] = b.a;
      u.uS.value[i] = b.seed; u.uHue.value[i] = b.hue;
      u.uWarm.value[i] = b.warm; u.uPop.value[i] = b.pop;
      u.uAng.value[i] = b.ang || 0; u.uEcc.value[i] = b.ecc || 1;
      if (i > 0 && b.a > 0.02) alive++;
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(200,190,210,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('INK ' + alive + '/' + (s.N - 1) + ' · THROWN ' + s.thrown +
      ' · WET ' + Math.round(s.wet * 100) + (s.wet > 0.55 ? ' FLOOD' : '') +
      '  ·  ' + (H.label || '') +
      '  ·  L ' + Math.round(s.eL * 100) + ' / R ' + Math.round(s.eR * 100) +
      (s.pres < 0.3 ? '  ·  DRYING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const s = P.state;
    const v = A.voice();
    const f = v.filter('lowpass', 480, 0.75);
    f.connect(v.group);
    // ONE VOICE PER LIVING SPLAT — the chord literally thickens with the
    // picture and thins as the ink dries. Slot 0 (the stain) holds the root.
    const voices = [];
    for (let i = 0; i < s.N; i++) {
      const o = v.osc('triangle', H.chordTone(i, 0));
      const gg = v.g(0.0001);
      o.connect(gg); gg.connect(f);
      voices.push({ o, gg, idx: i, pan: 0 });
    }
    const sub = v.osc('sine', H.chordTone(0, -1));
    const subG = v.g(0.024); sub.connect(subG); subG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.62; f.connect(s2); s2.connect(A.revIn); }

    // THE CHARGE IS AUDIBLE — a filtered breath per side that rises with the
    // pool and is CUT by the throw. Hand-owned, so it is not an autonomous
    // riser: nothing here moves that a hand did not move.
    const mkPool = pan => {
      const n = v.noise();
      const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = 2.6;
      const gg = v.g(0.0001);
      const pn = A.ctx.createStereoPanner(); pn.pan.value = pan;
      n.connect(bp); bp.connect(gg); gg.connect(pn); pn.connect(v.group);
      return { g: gg, bp };
    };
    const poolL = mkPool(-0.6), poolR = mkPool(0.6);

    let answered = false;
    H.onChord(() => {
      voices.forEach(vc => A.set(vc.o.frequency, H.chordTone(vc.idx, 0), 0.18));
      A.set(sub.frequency, H.chordTone(0, -1), 0.3);
      answered = false;
      // the transition is marked by a low-to-high roll, never a block chord
      if (s.pres > 0.2) {
        const base = T.next(0.25);
        const nn = s.wet > 0.5 ? 4 : 3;
        for (let ri = 0; ri < nn; ri++) {
          const freq = H.chordTone(ri, 1);
          const at = base + ri * 0.10;
          A.bell(freq, { at, vol: 0.028 + 0.008 * s.wet, dur: 3.4, rev: 0.85, pan: (ri - 1.5) * 0.22, midi: false });
          MOut.evNote('bells', freq, 0.06 + 0.05 * s.wet, at, 2.8);
        }
      }
    });
    v.fadeIn(1, 1.2);

    // ranked step-fill: mid flood is a syncopated groove, not a slow metronome
    const SHAKE = [0, 4, 8, 12, 2, 6, 10, 14];
    const KICKP = [1, 0, 0, 0, 0, 0, 0, 0.55, 0, 0, 1, 0, 0, 0, 0, 0];
    let nextT = T.next(0.25), step16 = 0;
    let nextBreath = A.t() + 4 + Math.random() * 6;

    return {
      tick(inp) {
        const flood = clamp((s.wet - 0.55) / 0.30);

        // THE REST — the stain breathes: randomized low pedal swells, about
        // one in seven answered by a single drip-bell tease. No high floor.
        if (s.pres < 0.25) {
          if (A.t() >= nextBreath) {
            const deep = Math.random() < 1 / 7;
            const bvol = (0.030 + Math.random() * 0.030) * (deep ? 1.6 : 1);
            A.tone(H.chordTone(0, -1), {
              at: A.t() + 0.05, vol: bvol, dur: 2.4 + Math.random() * 2.6,
              attack: 0.9 + Math.random(), type: 'sine', rev: 0.45, role: 'bass'
            });
            if (deep) A.bell(H.chordTone(3, 0), { at: A.t() + 0.3, vol: 0.034, dur: 4.2, rev: 0.85 });
            nextBreath = A.t() + 9 + Math.random() * 16;
          }
        } else nextBreath = Math.max(nextBreath, A.t() + 5);

        // the sound IS the light: the bed opens as the canvas floods
        A.set(f.frequency, 300 + s.wet * 1700 + Math.min(0.5, s.vel) * 800 + s.pres * 240, 0.25);
        // the pools breathe up as they charge
        A.set(poolL.g.gain, (0.0006 + 0.0075 * Math.pow(s.chL, 1.6)) * s.pres, 0.09);
        A.set(poolR.g.gain, (0.0006 + 0.0075 * Math.pow(s.chR, 1.6)) * s.pres, 0.09);
        A.set(poolL.bp.frequency, 280 + 620 * s.chL, 0.12);
        A.set(poolR.bp.frequency, 300 + 660 * s.chR, 0.12);

        voices.forEach((vc, i) => {
          const b = s.blot[i];
          const lvl = i === 0 ? b.a * 0.55 : b.a;
          A.set(vc.gg.gain, (0.0009 + 0.0090 * lvl) * (0.45 + 0.55 * s.pres), 0.30);
        });
        MOut.expr('pad', s.wet);
        MOut.expr('bells', clamp(Math.max(s.chL, s.chR)));
        MOut.expr('perc', flood);

        // EVERY SPLAT SOUNDS — struck where it landed, pitched by how big it
        // is (big = low), on the next 16th so it stays on the ladder.
        let casc = 0;
        while (s.throwQ.length) {
          const ev = s.throwQ.shift();
          const big = clamp((ev.size - 0.05) / 0.16);           // 0 small … 1 huge
          const deg = Math.round((1 - big) * 6);                 // small = high rung
          const oct = big > 0.6 ? 0 : 1;
          const freq = H.chordTone(deg, oct);
          const at = Math.max(A.t() + 0.02, T.next(0.25)) + casc * 0.045;
          A.bell(freq, { at, vol: 0.034 + 0.026 * big, dur: 2.4 + 1.6 * big, rev: 0.8, pan: ev.pan, midi: false });
          MOut.evNote('bells', freq, 0.06 + 0.09 * big, at, 2.0 + 1.4 * big);
          // ONE placed pad note per splat — the pad law: intentional, never
          // a wash; velocity is how hard that hand threw.
          MOut.evNote('pad', H.chordTone(ev.slot % 5, 0), 0.05 + 0.08 * big, at, 3.0);
          if (big > 0.45) {
            // a big splat lands with weight — sub thump (midi:false, it is a
            // partial of the same event) plus a real floor tom in Live
            A.tone(H.chordTone(0, -1), { at, vol: 0.055 * big, dur: 0.55, attack: 0.004, type: 'sine', rev: 0.15, midi: false });
            MOut.evDrum(ev.side < 0 ? 41 : 43, 0.32 + 0.3 * big, at);
          }
          s.blot[ev.slot].pop = 1;
          casc++;
        }

        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const st32 = step16 % 32;
          const tt = nextT;
          // EARNED: nothing until the canvas is genuinely wet. Shaker, then
          // hats, then a sparse kick — each fading in with the flood.
          if (flood > 0 && s.pres > 0.25) {
            const rank = SHAKE.indexOf(st);
            if (rank >= 0 && rank < Math.ceil(flood * 8)) {
              A.pluck2(H.scaleTone(4, 1), { at: tt, vol: 0.015 * flood, dur: 0.10, pan: 0.32, rev: 0.12, midi: false });
              MOut.evDrum(51, 0.26 * flood, tt);
            }
            if (st % 4 === 2) A.hat(tt, { vol: 0.009 * flood });
            if (KICKP[st] && flood > 0.4) A.kick(tt, 0.14 * flood * KICKP[st]);
            if (st === 0 && flood > 0.3) {
              A.bassNote(H.chordTone(0, -1), { at: tt, vol: 0.050 * flood, dur: 0.6, midi: false });
              MOut.evNote('bass', H.chordTone(0, -1), 0.24 * flood, tt, 0.55);
            }
          }
          // stillness after a phrase earns the answer — two drips in the gap
          if (st32 === 24 && !answered && s.still > 0.8 && s.pres > 0.3) {
            answered = true;
            const n1 = H.chordTone(4, 2), n2 = H.chordTone(3, 2);
            A.bell(n1, { at: tt, vol: 0.050, dur: 2.4, rev: 0.85, pan: -0.25 });
            A.bell(n2, { at: tt + T.beat * 0.75, vol: 0.045, dur: 2.8, rev: 0.9, pan: 0.25 });
            MOut.evNote('lead', n1, 0.12, tt, 1.3);
            MOut.evNote('lead', n2, 0.11, tt + T.beat * 0.75, 1.7);
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < A.t()) nextT = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
