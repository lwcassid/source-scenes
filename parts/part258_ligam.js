/* ---------- SRC-70 · LIGAM À TERRA — Orbital Witness 6 ----------
   "Das coisas que me ligam à terra, meu filho e essa dor nas costas."
   Among the things that ground me to the earth, my son and this pain in my back.

   Edson, Sep 25: the scene for OW6, the one poem in the series that points
   DOWN. Every other scene in the set ascends; this one grows into the ground.
   "Ligam" is the language of circuits — the same word as the electrical
   ground — so the roots are WIRING, and current runs down them into the dark.

   THE PICTURE
   · One point near the top of the frame. From it, roots descend and branch in
     three dimensions. TWO of them are the main roots: one warm gold (the son),
     one crimson (the ache). A few thinner amber roots are "the things among".
   · Pulses of light travel DOWN every root from the point to the tips: the
     current that keeps him plugged into this life. The son's current is
     steady. The ache's is a throb with an irregular rhythm.
   · Dust hangs in the earth, almost all of it out of focus: the bokeh is the
     soil.

   HOW IT IS BUILT (the L-Flower study's techniques, SRC-65)
   · Roots are grown ONCE in init(), every segment tagged with its PATH LENGTH
     from the point. Growth reveal and current both read that one number: the
     growth front is "path length < uG", a pulse is a travelling wave in path
     length. A frame costs the same at any extent.
   · Colour by age behind the front: a white-gold growing tip, then amber, then
     deep umber — old root is dark wire, and only the current lights it.
   · Per-element depth of field on every ribbon and mote; the lens follows the
     growing front through an under-damped spring (it hunts), and when a poem
     is spoken the focus racks away — the picture goes soft behind the words
     instead of just dimming.
   · Additive light, luminance tonemap, bloom, and one lens pass. The scene owns
     its light (no fx.bloom).

   HANDS — THE SOURCE LAW, and the last position holds (part249_source.js)
     LEFT  = how far the roots reach. At the Source: the point and the first
             hand's-breadth of root. Wide: the whole network, deep.
     RIGHT = the current. At the Source: one slow pulse at a time, barely lit.
             Wide: a dense, fast current; the fine root hairs glint as it
             passes, and the ache throbs hard.
   Keyed A aeolian, 62 — Movement II, where poem 6 is spoken. */
(() => {
  const TAU2 = Math.PI * 2;
  const GLSL_COMMON = `
    uniform float uT;
    uniform vec2 uRes; uniform float uFocus, uAper, uProj, uCocMax;
    float cocPx(float z){ return min(uCocMax, uAper * abs(1.0/uFocus - 1.0/z) * uRes.y); }
    vec3 sway(vec3 p){
      float d = max(0.0, 0.95 - p.y);              // roots hang from the point: sway grows with depth
      return p + vec3(sin(uT*0.23 + p.y*1.7), 0.0, cos(uT*0.19 + p.x*2.1)) * 0.006 * d;
    }
    // age behind the growth front → a white-gold tip, amber, deep umber wire
    vec3 rootAge(float a){
      vec3 c0 = vec3(1.00, 0.93, 0.72), c1 = vec3(0.95, 0.56, 0.20), c2 = vec3(0.30, 0.12, 0.07);
      return a < 0.08 ? mix(c0, c1, a / 0.08) : mix(c1, c2, clamp((a - 0.08) / 0.45, 0.0, 1.0));
    }
    // the current: packets travelling down the path length s
    uniform float uPhA, uPhB, uDens, uSharp, uCur;
    float packet(float s, float ph){
      float w = fract(ph - s * uDens);
      return pow(1.0 - w, uSharp) * smoothstep(0.0, 0.015, w);
    }`;

  const RIB_VS = GLSL_COMMON + `
    uniform float uG, uFade, uLine;
    attribute vec3 aA; attribute vec3 aB; attribute vec2 aT; attribute vec2 aC;
    attribute float aW; attribute float aK;
    varying vec3 vCol; varying float vA; varying float vSide;
    void main(){
      float gr = clamp((uG - aT.x) / max(1e-4, aT.y - aT.x), 0.0, 1.0);
      if (gr <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vA = 0.0; return; }
      vec3 a = sway(aA), b = sway(mix(aA, aB, gr));
      vec4 ca = projectionMatrix * modelViewMatrix * vec4(a, 1.0);
      vec4 cb = projectionMatrix * modelViewMatrix * vec4(b, 1.0);
      vec2 d = (cb.xy / cb.w - ca.xy / ca.w) * uRes; float L = length(d);
      d = L > 1e-4 ? d / L : vec2(0.0, 1.0);
      vec2 n = vec2(-d.y, d.x);
      vec4 cp = aC.x < 0.5 ? ca : cb;
      float z = cp.w;
      float base = max(1.2, aW * uProj / z * uLine);
      float coc = cocPx(z);
      float wpx = base + coc;
      cp.xy += n * aC.y * wpx / uRes * cp.w;
      gl_Position = cp;

      float s = mix(aT.x, aT.y, aC.x);
      float age = uG - s;
      // lineage keeps its colour as it ages: 0 son GOLD, 1 ache CRIMSON, 2 the things among, umber
      vec3 bright = aK < 0.5 ? vec3(1.0, 0.72, 0.28) : (aK < 1.5 ? vec3(1.0, 0.20, 0.14) : vec3(0.80, 0.52, 0.32));
      vec3 old    = aK < 0.5 ? vec3(0.55, 0.36, 0.10) : (aK < 1.5 ? vec3(0.50, 0.06, 0.05) : vec3(0.26, 0.15, 0.09));
      vec3 c = age < 0.06 ? mix(vec3(1.0, 0.95, 0.80), bright, age / 0.06) : mix(bright, old, smoothstep(0.06, 0.5, age));
      c *= aW > 0.012 ? 1.5 : 1.0;                 // the two main roots carry more light
      float ph = aK > 0.5 && aK < 1.5 ? uPhB : uPhA;
      float cur = packet(s, ph) * uCur;
      vec3 hot = aK > 0.5 && aK < 1.5 ? vec3(1.0, 0.45, 0.35) : vec3(1.0, 0.92, 0.70);
      vCol = c * (0.30 + 0.5 * uCur) + hot * cur * (aW > 0.012 ? 3.2 : 1.6);
      float front = exp(-max(age, 0.0) * 40.0);                     // the growing tip burns
      vCol += vec3(1.0, 0.9, 0.7) * front * 0.9;
      vA = uFade * clamp(base / wpx, 0.05, 1.0);
      vSide = aC.y;
    }`;
  const RIB_FS = `
    varying vec3 vCol; varying float vA; varying float vSide;
    void main(){ float e = 1.0 - vSide * vSide; gl_FragColor = vec4(vCol * vA * e, 1.0); }`;

  // points: root hairs (k 0/1/2 by lineage) and dust (k 3)
  const PT_VS = GLSL_COMMON + `
    uniform float uG, uFade, uPt;
    attribute float aT; attribute float aS; attribute float aJ; attribute float aK;
    varying vec3 vCol; varying float vA; varying float vBlur;
    void main(){
      bool dust = aK > 2.5;
      float age = uG - aT;
      if (!dust && age <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
      vec3 p = position;
      if (dust) p += vec3(sin(uT * 0.05 + aJ * 40.0), sin(uT * 0.037 + aJ * 17.0), cos(uT * 0.043 + aJ * 23.0)) * 0.05;
      vec4 mv = modelViewMatrix * vec4(sway(p), 1.0);
      gl_Position = projectionMatrix * mv;
      float z = -mv.z;
      float base = min(18.0, max(1.3, aS * uProj / z * uPt));
      float coc = cocPx(z);
      float s = base + coc;
      gl_PointSize = s;
      float energy = clamp((base * base) / (s * s), 0.03, 1.0);
      if (dust) {
        vCol = vec3(0.85, 0.45, 0.20) * (0.30 + 0.35 * uCur);       // the soil: warm, dim, almost all bokeh
        vA = uFade * 0.5 * energy * mix(1.0, 2.2, smoothstep(2.0, 16.0, coc));
      } else {
        float ph = aK > 0.5 && aK < 1.5 ? uPhB : uPhA;
        float g = packet(aT, ph) * uCur;                 // a hair GLINTS as the current passes it
        vec3 hot = aK > 0.5 && aK < 1.5 ? vec3(1.0, 0.5, 0.4) : vec3(1.0, 0.93, 0.75);
        vCol = rootAge(age) * 0.35 + hot * g * 2.6;
        vA = uFade * energy * smoothstep(0.0, 0.02, age) * (0.35 + 1.2 * g);
      }
      vBlur = clamp(coc / max(base, 1.0) / 3.0, 0.0, 1.0);
    }`;
  const PT_FS = `
    varying vec3 vCol; varying float vA; varying float vBlur;
    void main(){
      vec2 q = gl_PointCoord * 2.0 - 1.0; float d = length(q);
      float m = smoothstep(mix(0.9, 0.97, vBlur), mix(0.4, 0.88, vBlur), d);
      m *= 1.0 + vBlur * 0.6 * smoothstep(0.55, 0.93, d);          // bokeh rim
      if (m <= 0.002) discard;
      gl_FragColor = vec4(vCol * vA * m, 1.0);
    }`;

  const LENS = {
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uCA: { value: 0.0035 }, uExpo: { value: 1.5 },
                uVig: { value: 0.6 }, uGrain: { value: 0.03 }, uRes: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uT, uCA, uExpo, uVig, uGrain; uniform vec2 uRes;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 c = vUv - 0.5; float r2 = dot(c, c);
        vec2 off = c * uCA * (0.4 + r2 * 4.0);
        vec3 col = vec3(texture2D(tDiffuse, vUv - off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + off).b);
        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col *= (1.0 - exp(-L * uExpo)) / max(L, 1e-4);          // luminance tonemap: hot wires stay gold, not white
        col = min(col, vec3(1.0));
        col *= mix(1.0, smoothstep(0.62, 0.05, r2), uVig);
        col += (hash(vUv * uRes + fract(uT * 7.13) * 91.0) - 0.5) * uGrain * (0.3 + col);
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`
  };

  // ---------- the roots ----------
  function growRoots(rand) {
    const R = (a, b) => a + (b - a) * rand();
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const rotAway = (d, ang) => { const p = norm(cross(d, [R(-1, 1), R(-1, 1), R(-1, 1)])); return norm(add(mul(d, Math.cos(ang)), mul(p, Math.sin(ang)))); };
    const segs = [], pts = [];
    const O = [0, 0.95, 0];

    // one root: n sub-segments, wandering, pulled DOWN by gravity (gravitropism)
    function root(p, d, len, s0, w, k, depth, maxD, n) {
      let s = s0;
      const step = len / n;
      for (let i = 0; i < n; i++) {
        const bend = depth === 0 ? 0.09 : 0.14;
        d = norm(add(d, [R(-bend, bend), R(-bend, bend) - (depth === 0 ? 0.035 : 0.012 + 0.018 * depth), R(-bend, bend)]));
        const q = add(p, mul(d, step));
        const wi = w * (1 - 0.5 * i / n);
        segs.push({ a: p, b: q, t0: s, t1: s + step, w: wi, k });
        // root hairs on the finer roots
        if (depth >= 2 && rand() < 0.22) {
          const u = norm([R(-1, 1), R(-1, 1), R(-1, 1)]);
          pts.push({ p: add(q, mul(u, R(0.01, 0.04))), t: s + step, s: R(0.006, 0.012), j: rand(), k });
        }
        // laterals leave along the way
        if (depth < maxD && i > 2 && rand() < (depth === 0 ? 0.13 : 0.10)) {
          // laterals leave nearly SIDEWAYS, then gravity bends them down: the network spreads wide
          const cd = rotAway(d, R(0.9, 1.45));
          cd[1] = Math.min(cd[1], -0.05);
          root(q, norm(cd), len * R(0.5, 0.72), s + step, wi * (depth === 0 ? 0.22 : 0.55), k, depth + 1, maxD, Math.max(5, (n * 0.6) | 0));
        }
        p = q; s += step;
      }
      if (depth >= 1) pts.push({ p, t: s, s: 0.016, j: rand(), k });   // a tip
    }
    // the two: the son (gold, left-front), the ache (crimson, right-back)
    root(O, norm([-0.85, -1, 0.25]), 3.1, 0, 0.048, 0, 0, 3, 84);
    root(O, norm([0.80, -1, -0.28]), 3.0, 0, 0.048, 1, 0, 3, 84);
    // the things among: thinner, amber, shorter
    for (let i = 0; i < 4; i++) {
      const az = i / 4 * TAU2 + R(-0.4, 0.4);
      root(O, norm([Math.cos(az) * 1.1, -1, Math.sin(az) * 0.8]), R(1.2, 1.9), R(0, 0.1), 0.007, 2, 1, 3, 34);
    }
    // normalise path length to 0..1 over the deepest root
    let sMax = 0;
    for (const q of segs) sMax = Math.max(sMax, q.t1);
    for (const q of segs) { q.t0 /= sMax; q.t1 /= sMax; }
    for (const q of pts) q.t /= sMax;
    // the dust in the earth: everything below the point, mostly out of focus
    const dust = [];
    for (let i = 0; i < 650; i++)
      dust.push({ p: [R(-3.0, 3.0), R(-2.2, 0.8), R(-2.2, 2.4)], t: -1, s: R(0.012, 0.03), j: rand(), k: 3 });
    // where the two main roots are at any extent (for the lens)
    const mains = [[], []];
    for (const q of segs) if (q.k < 2 && q.w > 0.009) mains[q.k].push(q);
    return { segs, pts: pts.concat(dust), mains, O };
  }

  function buildGeo(pl) {
    const S = pl.segs, NS = S.length;
    const aA = new Float32Array(NS * 12), aB = new Float32Array(NS * 12), aT = new Float32Array(NS * 8),
          aC = new Float32Array(NS * 8), aW = new Float32Array(NS * 4), aK = new Float32Array(NS * 4);
    const idx = new Uint32Array(NS * 6), C = [[0, -1], [0, 1], [1, -1], [1, 1]];
    for (let i = 0; i < NS; i++) {
      const q = S[i];
      for (let v = 0; v < 4; v++) {
        const o = i * 4 + v;
        aA.set(q.a, o * 3); aB.set(q.b, o * 3);
        aT[o * 2] = q.t0; aT[o * 2 + 1] = q.t1; aC[o * 2] = C[v][0]; aC[o * 2 + 1] = C[v][1];
        aW[o] = q.w; aK[o] = q.k;
      }
      const b = i * 4; idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], i * 6);
    }
    const rg = new THREE.BufferGeometry();
    for (const [n, arr, k] of [['position', aA, 3], ['aA', aA, 3], ['aB', aB, 3], ['aT', aT, 2], ['aC', aC, 2], ['aW', aW, 1], ['aK', aK, 1]])
      rg.setAttribute(n, new THREE.BufferAttribute(arr, k));
    rg.setIndex(new THREE.BufferAttribute(idx, 1));
    const P2 = pl.pts, NP = P2.length;
    const pos = new Float32Array(NP * 3), pt = new Float32Array(NP), ps = new Float32Array(NP), pj = new Float32Array(NP), pk = new Float32Array(NP);
    for (let i = 0; i < NP; i++) { const q = P2[i]; pos.set(q.p, i * 3); pt[i] = q.t; ps[i] = q.s; pj[i] = q.j; pk[i] = q.k; }
    const pg = new THREE.BufferGeometry();
    for (const [n, arr, k] of [['position', pos, 3], ['aT', pt, 1], ['aS', ps, 1], ['aJ', pj, 1], ['aK', pk, 1]])
      pg.setAttribute(n, new THREE.BufferAttribute(arr, k));
    return { rg, pg, nSeg: NS, nPt: NP };
  }

  // the deepest point either main root has reached at extent g
  function frontAt(pl, g) {
    let best = pl.O, by = 9;
    for (const list of pl.mains) for (const q of list) if (q.t1 <= g && q.b[1] < by) { by = q.b[1]; best = q.b; }
    return best;
  }

  reg({
    id: 'SRC-70', family: 'SRC-70', ver: 1,
    title: 'BoT · Ligam à Terra', tech: 'WEBGL / ROOTS GROWN BY PATH LENGTH + CURRENT + SCATTER DOF',
    audioIn: true, textIsContent: true,
    music: {
      bpm: 62, root: 45, mode: 'aeolian', chordBars: 8,
      chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
      chordNames: ['A5', 'Asus2', 'Fmaj7/A', 'Asus4']
    },
    tags: ['TEMPLE SET', 'ORBITAL WITNESS 6', 'THE ONE THAT POINTS DOWN', 'OPEN L = THE ROOTS REACH', 'OPEN R = THE CURRENT', 'THE LENS'],
    desc: '"Das coisas que me ligam à terra, meu filho e essa dor nas costas." The one poem in the series that points down, so the one scene that grows into the ground. From a single point, roots descend and branch through the dark: one gold (the son), one crimson (the ache), and a few thinner amber roots among them. "Ligam" is the word for a circuit, so the roots are wiring, and current runs down them into the earth: the son\'s steady, the ache\'s a throb that never keeps time. Old root is dark wire; only the current lights it. Dust hangs in the earth out of focus, and the lens follows the growing tips down, hunting as they move. When a poem is spoken the focus racks away and the whole picture softens behind the words.',
    interact: 'THE SOURCE LAW, and the last position holds. LEFT OPENS THE REACH: at the Source there is only the point and a hand\'s-breadth of root; open it and the roots grow down and outward until the whole network hangs in the dark — pull back and they withdraw. RIGHT OPENS THE CURRENT: at the Source one slow pulse at a time, barely lit; open it and the current thickens and quickens, the fine root hairs glint as it passes, and the ache throbs hard.',
    sound: 'A aeolian, 62, eight-bar chords — Movement II\'s key, where poem 6 is spoken. A deep sub for the ground, an open pad that fills as the roots reach, and two voices for the two roots: a soft bell each time a pulse leaves the point down the son\'s root, and a low muffled thump on each throb of the ache. The current (R) is the pad\'s brightness and the level of both voices. MIDI: pad, bass (the ache), bells (the son).',

    init(P) {
      const s = {
        noGL: typeof THREE === 'undefined' || !THREE.EffectComposer || !THREE.UnrealBloomPass,
        pres: 0, reach: 0.2, cur: 0.2, g: 0.12, phA: 0, phB: 0, _nA: 0, _nB: 0,
        focus: 3, focusV: 0, az: 0, drift: P.rand() * 100, aud: 0, events: []
      };
      P.state = s;
      if (s.noGL) return;
      if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
      const T3 = {}; P._three = T3;
      const sc = Math.min(1, 1600 / Math.max(P.w, P.h));
      T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
      const r = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      r.setPixelRatio(1); r.setSize(T3.rw, T3.rh, false); r.setClearColor(0x000000, 1);
      T3.renderer = r; T3.scene = new THREE.Scene();
      T3.cam = new THREE.PerspectiveCamera(32, T3.rw / T3.rh, 0.05, 50);
      const u = {
        uT: { value: 0 }, uG: { value: 0 }, uFade: { value: 1 }, uLine: { value: 1 }, uPt: { value: 1 },
        uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
        uFocus: { value: 3 }, uAper: { value: 0.05 }, uCocMax: { value: 44 },
        uProj: { value: T3.rh / (2 * Math.tan(32 * Math.PI / 360)) },
        uPhA: { value: 0 }, uPhB: { value: 0 }, uDens: { value: 1.5 }, uSharp: { value: 10 }, uCur: { value: 0.3 }
      };
      T3.u = u;
      const mk = (vs, fs) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const pl = growRoots(P.rand), geo = buildGeo(pl);
      s.pl = pl; s.nSeg = geo.nSeg; s.nPt = geo.nPt;
      const rib = new THREE.Mesh(geo.rg, mk(RIB_VS, RIB_FS)), pts = new THREE.Points(geo.pg, mk(PT_VS, PT_FS));
      rib.frustumCulled = pts.frustumCulled = false;
      T3.scene.add(rib); T3.scene.add(pts);
      // frame: the point near the top, the deepest root just inside the bottom
      let y0 = 9, rx = 0, rz = 0;
      for (const q of pl.segs) { y0 = Math.min(y0, q.b[1]); rx = Math.max(rx, Math.abs(q.b[0])); rz = Math.max(rz, Math.abs(q.b[2])); }
      const y1 = pl.O[1] + 0.12;
      s.cy = (y0 + y1) / 2;
      s.dist = Math.max((y1 - y0) / 2 * 1.02, rx / (T3.rw / T3.rh) * 1.05) / Math.tan(16 * Math.PI / 180) + rz * 0.3;
      const rt = new THREE.WebGLRenderTarget(T3.rw, T3.rh, { type: THREE.HalfFloatType });
      const comp = new THREE.EffectComposer(r, rt);
      comp.setPixelRatio(1); comp.setSize(T3.rw, T3.rh);
      comp.addPass(new THREE.RenderPass(T3.scene, T3.cam));
      T3.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(T3.rw, T3.rh), 0.8, 0.55, 0.35);
      comp.addPass(T3.bloom);
      T3.lens = new THREE.ShaderPass(LENS);
      T3.lens.uniforms.uRes.value = new THREE.Vector2(T3.rw, T3.rh);
      comp.addPass(T3.lens);
      T3.composer = comp;
    },

    step(P, dt, t, inp) {
      const s = P.state;
      dt = Math.min(dt, 0.1);
      s.drift += dt;
      s.pres += (SOURCE_PRES() - s.pres) * Math.min(1, dt * 1.5);
      // the band moves the current too
      const au = inp.audio || {};
      s.aud += (((au.live ? 1 : 0.55) * (au.level || 0)) - s.aud) * Math.min(1, dt * 6);

      const idleL = SOURCE_IDLE(s.drift, 0.22, 0.08, 0.05), idleR = SOURCE_IDLE(s.drift + 40, 0.20, 0.08, 0.07);
      const wantL = SOURCE(inp.L) * s.pres + idleL * (1 - s.pres);
      const wantR = clamp(SOURCE(inp.R) * s.pres + idleR * (1 - s.pres) + s.aud * 0.25);
      s.reach += (wantL - s.reach) * Math.min(1, dt * 3.0);    // roots grow at root speed, not hand speed
      s.cur += (wantR - s.cur) * Math.min(1, dt * 6);
      s.g = 0.07 + 0.95 * s.reach;

      // the son: steady. The ache: a throb that never keeps time.
      const rateA = 0.12 + 0.9 * s.cur;
      const lump = 0.55 + 0.9 * Math.abs(Math.sin(s.drift * 0.37) * Math.sin(s.drift * 0.13 + 1.1));
      const rateB = (0.10 + 1.0 * s.cur) * lump;
      s.phA += rateA * dt; s.phB += rateB * dt;
      // a pulse leaving the point is a sound event (read by audio)
      if (Math.floor(s.phA) !== s._nA) { s._nA = Math.floor(s.phA); s.events.push('son'); }
      if (Math.floor(s.phB) !== s._nB) { s._nB = Math.floor(s.phB); s.events.push('ache'); }
      if (s.events.length > 8) s.events.splice(0, s.events.length - 8);
      s.az = 0.35 * Math.sin(s.drift * 0.031);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      if (!P.hosted) { g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      if (s.noGL) {
        g.fillStyle = 'rgba(255,200,150,0.7)'; g.font = '12px ui-monospace,monospace';
        g.fillText('LIGAM À TERRA · needs WebGL + the three.js post stack', 10, h - 10);
      } else {
        const T3 = P._three, u = T3.u, cam = T3.cam;
        const dt = Math.min(0.1, Math.max(0.001, t - (s._lt || t))); s._lt = t;
        const tgtY = s.cy;
        cam.position.set(s.dist * Math.sin(s.az), tgtY + 0.15, s.dist * Math.cos(s.az));
        cam.lookAt(0, tgtY, 0); cam.updateMatrixWorld();

        // THE LENS follows the growing front down (under-damped: it hunts),
        // and racks AWAY while a poem is spoken — soft behind the words
        const f = frontAt(s.pl, s.g), O = s.pl.O;
        const aim = [O[0] + (f[0] - O[0]) * 0.7, O[1] + (f[1] - O[1]) * 0.7, O[2] + (f[2] - O[2]) * 0.7];
        let fWant = Math.hypot(aim[0] - cam.position.x, aim[1] - cam.position.y, aim[2] - cam.position.z);
        fWant *= 1 + 0.07 * Math.sin(t * 0.19);
        fWant *= 1 + 1.6 * (1 - room);
        const kF = 14, cF = 2 * Math.sqrt(kF) * 0.4;
        s.focusV += (kF * (fWant - s.focus) - cF * s.focusV) * dt;
        s.focus = Math.max(0.3, s.focus + s.focusV * dt);

        u.uT.value = t; u.uG.value = s.g; u.uFocus.value = s.focus;
        u.uAper.value = 0.05 * (1 + Math.min(1.2, Math.abs(s.focusV) * 0.35));
        u.uPhA.value = s.phA; u.uPhB.value = s.phB;
        u.uDens.value = 1.2 + 3.0 * s.cur;             // more packets in flight
        u.uSharp.value = 26 - 12 * s.cur;             // and longer tails
        u.uCur.value = (0.25 + 0.95 * s.cur) * room;
        u.uFade.value = 0.55 + 0.45 * room;
        T3.bloom.strength = 0.55 + 0.6 * s.cur;
        T3.lens.uniforms.uT.value = t;
        T3.composer.render();
        g.save();
        g.globalCompositeOperation = P.hosted ? 'lighter' : 'source-over';
        g.drawImage(T3.renderer.domElement, 0, 0, w, h);
        g.restore();
      }
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.005, cutoff: 220, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.9); tune(0.9); });
      v.fadeIn(1, 2.5);
      return {
        tick(inp, dt) {
          const s = P.state;
          const cur = s.cur, reach = s.reach;
          pad.forEach(p => { p.level(0.002 + reach * 0.006, 0.5); p.bright(180 + cur * 1100, 0.4); });
          A.set(sg.gain, 0.014 + reach * 0.026, 0.4);
          while (s.events.length) {
            const e = s.events.shift();
            if (e === 'son') A.tone(H.chordTone(0, 1), { vol: 0.006 + cur * 0.012, dur: 3.5, attack: 0.01, type: 'sine', rev: 0.7, role: 'bells' });
            else A.tone(H.chordTone(0, -1), { vol: 0.010 + cur * 0.030, dur: 0.9, attack: 0.02, type: 'sine', rev: 0.3, role: 'bass' });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', reach); MOut.expr('bass', cur); MOut.expr('bells', cur); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
