/* ---------- SRC-65.2 · L-FLOWER STUDY V2 — THE CLOUD GETS A BODY ----------
   Edson, Sep 24, after V1: "1" — make the florets block the light behind
   them. V1 was pure additive glow: every floret ADDED light, so the cloud read
   as a luminous haze and could never have the reference's dark, dense masses.
   V2 changes only the light model; the plant, the lens and the hands are V1's.
   · WEIGHTED BLENDED OIT: each element has COVERAGE; the nearest owns its
     pixel. Two targets (accum, reveal), one resolve pass, no sorting.
   · BAKED SELF-SHADOW: per plant, once, a 44^3 density grid of the finished
     cloud; every floret/segment marches toward a key light (upper
     front-left) and keeps exp(-k * sum density), plus a touch of local AO. It
     fades in as the cloud around it grows, and shade is deep BLUE, not grey.
   · Blurred florets lose coverage as they spread, so the foreground bokeh is
     translucent and does not wall off the picture.
   ------------------------------------------------------------------
   V1's notes, which still hold: SRC-65 · L-FLOWER STUDY (after Dan Hoopert's "L-Systems Flower")
   A LEARNING RUN, not a show scene. Edson, Sep 24: take the reference video
   (a gypsophila-like plant growing from one green stem into a pink→lilac→blue
   cloud, rendered offline in Houdini + Redshift with real depth of field) and
   see how much of it the stack we already ship can do, inside ONE scene,
   touching nothing in the platform.

   HOW IT IS BUILT
   · THE PLANT IS GROWN ONCE, ON THE CPU, IN init(). A stem, an umbel at its
     top, then ~16 laterals that branch dichotomously (2, sometimes 3) down to
     floret clusters. Every segment, floret and glyph carries a BIRTH TIME in
     growth units. Nothing is rebuilt per frame.
   · THE GPU REVEALS IT. One uniform, uG (growth), is compared against the
     birth times: a segment's far end slides from its start to its end as uG
     crosses [t0,t1], a floret pops in with a flash at its birth. So a frame
     costs the same at 1% grown as at 100%.
   · COLOUR IS AGE. Measured off the reference: the same patch drifts
     #b7919b → #79617e over ~7s, and the newest growth at the top stays cream
     while the old mass below turns blue. So colour = ramp(uG - birth):
     bud green → cream → pink → lilac → blue.
   · DEPTH OF FIELD IS PER ELEMENT ("scatter" DOF), not a post blur. Each
     point / ribbon computes its own circle of confusion from its view depth
     against the focus distance (thin lens: coc ∝ A·|1/zf − 1/z|), grows by
     that many pixels and dims by the area it spread over. Out-of-focus
     florets become real bokeh discs with a bright rim, in-focus ones show a
     five-lobed floret. No depth buffer, no BokehPass needed (it is not in
     the vendored stack).
   · FOCUS IS A LENS WITH A MOTOR. Autofocus aims at the growth front (the
     stem tip early, the cloud later), through an UNDER-DAMPED spring: zoom
     fast and the lens hunts — overshoots, blurs, settles. On top, a slow
     "breathing" rack drifts the plane through the cloud, and every ~14s a
     deliberate focus pull racks to the front of the plant and back.
   · STEMS ARE SCREEN-SPACE RIBBONS (WebGL lines are always 1px), so they can
     be fattened and blurred like everything else.
   · POST: HalfFloat composer → UnrealBloom → one lens pass (radial chromatic
     aberration, exp tonemap, halation tint, vignette, grain). The global 2D
     fx.bloom is OFF — the scene owns its light.
   · THE SQUARES are Hoopert's shape language (he ties cubes/triangles/
     circles to sound events). Here they flash on at tip births; silent for
     now — a candidate for "each glyph is a note" later.

   HANDS — EDSON'S INSTRUMENT RULE: NEAR = LESS, FAR = MORE. The input gate
   delivers inp high when a hand leans in (Lance's default), so this scene
   reads (1 − inp) and never touches the gate.
          LEFT = ZOOM (hand close = wide, hand far = deep inside the cloud).
          RIGHT = VELOCITY of the growth (close = nearly still, far = fast).
   With no hands it plays like the reference: ~20s to full bloom, holds,
   dissolves, and a new plant grows from a new seed. */
(() => {
  // full bloom. Chosen so that at the end the youngest crown is still cream-pink
  // and the oldest mass is blue — the reference's final gradient, not one colour
  const GEND = 1.12;
  const GLSL_SWAY = `
    uniform float uT;
    vec3 sway(vec3 p){
      float h = max(0.0, p.y + 1.6);
      return p + vec3(sin(uT*0.61 + p.y*2.1 + p.z*1.3), 0.0, cos(uT*0.47 + p.x*2.7)) * 0.010 * h * h;
    }`;
  const GLSL_RAMP = `
    vec3 ramp(float a){               // a: age 0..1+
      vec3 c0 = vec3(0.55, 0.78, 0.30);   // bud green
      vec3 c1 = vec3(0.98, 0.90, 0.70);   // cream
      vec3 c2 = vec3(0.98, 0.66, 0.80);   // pink
      vec3 c3 = vec3(0.70, 0.58, 1.00);   // lilac
      vec3 c4 = vec3(0.42, 0.44, 0.92);   // blue-violet
      if (a < 0.10) return mix(c0, c1, a / 0.10);
      if (a < 0.30) return mix(c1, c2, (a - 0.10) / 0.20);
      if (a < 0.60) return mix(c2, c3, (a - 0.30) / 0.30);
      return mix(c3, c4, clamp((a - 0.60) / 0.40, 0.0, 1.0));
    }`;
  const GLSL_COC = `
    uniform vec2 uRes; uniform float uFocus, uAper, uProj, uCocMax;
    float cocPx(float z){ return min(uCocMax, uAper * abs(1.0/uFocus - 1.0/z) * uRes.y); }`;

  // ---------- V2: WEIGHTED BLENDED ORDER-INDEPENDENT TRANSPARENCY ----------
  // Every element is drawn TWICE, into two targets, with no sorting:
  //   ACCUM  += (colour·a·w, a·w)      (One, One)
  //   REVEAL *= (1 − a)                (Zero, OneMinusSrcColor)
  // and a composite resolves colour = accum.rgb / accum.a × (1 − reveal).
  // w favours what is NEAR (McGuire & Bavoil 2013), so a front floret owns its
  // pixel and the mass behind it is hidden instead of added — the reference's
  // dark, light-blocking body, which V1's pure glow could never have.
  const GLSL_OIT = `
    uniform float uZRef;
    vec4 oit(vec3 col, float a, float z){
    #ifdef REVEAL
      return vec4(a);
    #else
      float w = a * clamp(1.0 / (1e-3 + pow(z / uZRef, 6.0)), 0.02, 150.0);
      return vec4(col * a * w, a * w);
    #endif
    }`;
  // light that reaches an element: the BAKED self-shadow (aO, marched once
  // through the finished cloud toward the key light) fades in as the cloud
  // around it fills; what is left is a deep blue shade, not grey
  const GLSL_LIGHT = `
    uniform vec3 uShade;
    vec3 lit(vec3 c, float occ, float born){
      float o = mix(1.0, occ, smoothstep(born - 0.05, born + 0.15, uG));
      return c * mix(uShade, vec3(1.0), o);
    }`;

  // ---------- ribbons (stems / branches) ----------
  const RIB_VS = GLSL_SWAY + GLSL_RAMP + GLSL_COC + `
    uniform float uG, uSpan, uLine, uFade;
    attribute vec3 aA; attribute vec3 aB; attribute vec2 aT; attribute vec2 aC;
    attribute float aW; attribute float aK; attribute float aJ; attribute float aO;
    varying vec3 vCol; varying float vA; varying float vSide; varying float vZ;
    ` + GLSL_LIGHT + `
    void main(){
      float gr = clamp((uG - aT.x) / max(1e-4, aT.y - aT.x), 0.0, 1.0);
      if (gr <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vA = 0.0; return; }
      vec3 a = sway(aA), b = sway(mix(aA, aB, gr));
      vec4 ca = projectionMatrix * modelViewMatrix * vec4(a, 1.0);
      vec4 cb = projectionMatrix * modelViewMatrix * vec4(b, 1.0);
      vec2 sa = ca.xy / ca.w, sb = cb.xy / cb.w;
      vec2 d = (sb - sa) * uRes; float L = length(d);
      d = L > 1e-4 ? d / L : vec2(0.0, 1.0);
      vec2 n = vec2(-d.y, d.x);
      vec4 cp = aC.x < 0.5 ? ca : cb;
      float z = cp.w;
      float base = max(1.1, aW * uProj / z * uLine);
      float coc = cocPx(z);
      float wpx = base + coc;
      cp.xy += n * aC.y * wpx / uRes * cp.w;
      gl_Position = cp;
      float age = (uG - aT.y) / uSpan;
      vec3 green = vec3(0.30, 0.86, 0.34);
      vec3 old = mix(vec3(0.62, 0.50, 0.46), vec3(0.55, 0.45, 0.70), aJ);
      vec3 c = aK < 0.5 ? green : mix(green * 0.9, old, smoothstep(0.02, 0.45, age));
      vCol = lit(c, aO, aT.y) * 1.25;
      vA = uFade * (aK < 0.5 ? 0.95 : 0.75) * clamp(base / wpx, 0.05, 1.0) * smoothstep(0.12, 0.45, z);
      vSide = aC.y; vZ = z;
    }`;
  const RIB_FS = GLSL_OIT + `
    varying vec3 vCol; varying float vA; varying float vSide; varying float vZ;
    void main(){
      float a = clamp(vA * (1.0 - vSide * vSide), 0.0, 0.98);
      if (a <= 0.003) discard;
      gl_FragColor = oit(vCol, a, vZ);
    }`;

  // ---------- points (florets, beads, glyphs) ----------
  const PT_VS = GLSL_SWAY + GLSL_RAMP + GLSL_COC + `
    uniform float uG, uSpan, uFade, uPt, uPtGain;
    attribute float aT; attribute float aS; attribute float aJ; attribute float aK; attribute float aO;
    varying vec3 vCol; varying float vA; varying float vBlur; varying float vK; varying float vRot; varying float vZ;
    ` + GLSL_LIGHT + `
    void main(){
      float age = uG - aT;
      if (age <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
      vec4 mv = modelViewMatrix * vec4(sway(position), 1.0);
      gl_Position = projectionMatrix * mv;
      float z = -mv.z;
      float pop = smoothstep(0.0, 0.025, age);
      float flash = exp(-age * 60.0);
      float base = min(26.0, max(1.4, aS * uProj / z * uPt)) * (0.35 + 0.65 * pop) * (1.0 + 0.6 * flash);
      float coc = cocPx(z);
      float s = base + coc;
      gl_PointSize = s;
      float a = age / uSpan + aJ * 0.12;
      vec3 c = aK > 1.5 ? vec3(1.0, 0.97, 0.90) : (aK > 0.5 ? mix(ramp(a), vec3(1.0), 0.45) : ramp(a));
      c = lit(c, aO, aT) * 1.35;                  // the lit face runs hot enough to bloom
      // sparkle: ~8% of florets catch the key light as a white speck (the reference's glints)
      float sp = step(0.92, fract(aJ * 37.13)) * smoothstep(0.35, 0.8, aO) * step(aK, 0.5);
      c += sp * vec3(1.0, 0.95, 0.88) * 1.1;
      c = mix(c, vec3(1.0, 0.98, 0.9), flash * 0.6) * (1.0 + 0.8 * flash);
      vCol = c * uPtGain;
      // COVERAGE, not light: a blurred floret spreads the same stuff thinner,
      // so out-of-focus florets turn translucent and stop occluding
      float energy = clamp(pow((base * base) / (s * s), 0.8), 0.03, 1.0);
      float k = aK > 1.5 ? 0.8 : (aK > 0.5 ? 0.9 : 0.85);
      vA = uFade * k * pop * energy * smoothstep(0.12, 0.45, z);
      vBlur = clamp(coc / max(base, 1.0) / 3.0, 0.0, 1.0);
      vK = aK; vRot = aJ * 6.2831; vZ = z;
    }`;
  const PT_FS = GLSL_OIT + `
    varying vec3 vCol; varying float vA; varying float vBlur; varying float vK; varying float vRot; varying float vZ;
    void main(){
      vec2 q = gl_PointCoord * 2.0 - 1.0;
      float d = length(q);
      float m; float lum = 1.0;
      if (vK > 1.5) {                              // glyph: hollow square
        float r = max(abs(q.x), abs(q.y));
        float w = mix(0.16, 0.5, vBlur);
        m = smoothstep(0.95, 0.85, r) * smoothstep(0.95 - w - 0.12, 0.95 - w, r);
        m = mix(m, smoothstep(1.0, 0.7, d) * 0.35, vBlur * vBlur);
      } else {
        float th = atan(q.y, q.x) + vRot;
        float lobe = 0.80 + 0.18 * cos(5.0 * th);      // five-lobed floret when sharp
        float R = mix(lobe, 0.96, vBlur);
        float soft = mix(0.22, 0.06, vBlur);
        m = smoothstep(R, R - soft, d);
        lum = 1.0 + vBlur * 0.6 * smoothstep(0.55, 0.92, d);      // bokeh rim
        lum *= mix(0.8 + 0.3 * smoothstep(0.5, 0.0, d), 1.0, vBlur);  // sharp: brighter heart
      }
      float a = clamp(vA * m, 0.0, 0.98);
      if (a <= 0.003) discard;
      gl_FragColor = oit(vCol * lum, a, vZ);
    }`;

  // ---------- composite: resolve the two targets ----------
  const RESOLVE = {
    uniforms: { tDiffuse: { value: null }, tAcc: { value: null }, tRev: { value: null }, uGain: { value: 1.15 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tAcc, tRev; uniform float uGain; varying vec2 vUv;
      void main(){
        vec4 A = texture2D(tAcc, vUv);
        float cov = 1.0 - texture2D(tRev, vUv).r;
        vec3 C = A.rgb / max(A.a, 1e-5);
        gl_FragColor = vec4(C * cov * uGain, 1.0);
      }`
  };

  // ---------- the baked self-shadow ----------
  // A coarse density grid of the finished cloud; every floret and segment
  // marches toward the key light summing what is in the way. Done ONCE per
  // plant, on the CPU (~tens of ms), so the frame pays nothing for it.
  const KEY = (() => { const v = [-0.45, 0.75, 0.50], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  function bakeShadow(plant) {
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (const q of plant.pts) {
      const p = q.p;
      x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); z0 = Math.min(z0, p[2]);
      x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); z1 = Math.max(z1, p[2]);
    }
    const pad = 0.05; x0 -= pad; y0 -= pad; z0 -= pad; x1 += pad; y1 += pad; z1 += pad;
    const N = 44, ext = Math.max(x1 - x0, y1 - y0, z1 - z0), cs = ext / N;
    const nx = Math.ceil((x1 - x0) / cs) + 1, ny = Math.ceil((y1 - y0) / cs) + 1, nz = Math.ceil((z1 - z0) / cs) + 1;
    const G = new Float32Array(nx * ny * nz);
    const cell = (x, y, z) => {
      const i = Math.floor((x - x0) / cs), j = Math.floor((y - y0) / cs), k = Math.floor((z - z0) / cs);
      return (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) ? -1 : (k * ny + j) * nx + i;
    };
    for (const q of plant.pts) if (q.k === 0) { const c = cell(q.p[0], q.p[1], q.p[2]); if (c >= 0) G[c] += 1; }
    const K = 0.055;
    const occ = (p) => {
      let sum = 0;
      for (let st = 1.5; st < 60; st += 1) {
        const c = cell(p[0] + KEY[0] * cs * st, p[1] + KEY[1] * cs * st, p[2] + KEY[2] * cs * st);
        if (c < 0) break;
        sum += G[c];
      }
      let amb = 0;                                    // a little ambient occlusion: how buried it is
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const c = cell(p[0] + dx * cs, p[1] + dy * cs, p[2] + dz * cs); if (c >= 0) amb += G[c];
      }
      return Math.exp(-sum * K) * (0.55 + 0.45 * Math.exp(-amb * 0.012));
    };
    for (const q of plant.pts) q.o = occ(q.p);
    for (const q of plant.segs) q.o = occ([(q.a[0] + q.b[0]) / 2, (q.a[1] + q.b[1]) / 2, (q.a[2] + q.b[2]) / 2]);
  }

  // ---------- lens pass ----------
  const LENS = {
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uCA: { value: 0.0035 }, uExpo: { value: 1.7 },
                uVig: { value: 0.55 }, uGrain: { value: 0.035 }, uRes: { value: new THREE_V2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uT, uCA, uExpo, uVig, uGrain; uniform vec2 uRes;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 c = vUv - 0.5; float r2 = dot(c, c);
        vec2 off = c * uCA * (0.4 + r2 * 4.0);
        vec3 col;
        col.r = texture2D(tDiffuse, vUv - off).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv + off).b;
        // tonemap LUMINANCE, not channels: thousands of additive florets must
        // stay lilac, not clip to white
        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        float Lt = 1.0 - exp(-L * uExpo);
        col *= Lt / max(L, 1e-4);
        col = mix(col, vec3(Lt), smoothstep(0.85, 1.4, max(col.r, max(col.g, col.b))) * 0.5);
        col = min(col, vec3(1.0));
        col *= mix(1.0, smoothstep(0.62, 0.05, r2), uVig);
        col += (hash(vUv * uRes + fract(uT * 7.13) * 91.0) - 0.5) * uGrain * (0.3 + col);
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`
  };
  function THREE_V2() { return (typeof THREE !== 'undefined') ? new THREE.Vector2(1, 1) : null; }

  // ---------- the plant ----------
  function growPlant(rand) {
    const R = (a, b) => a + (b - a) * rand();
    const segs = [], pts = [];
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    function rotAway(d, ang) {                 // rotate d by ang around a random perpendicular
      let p = cross(d, [R(-1, 1), R(-1, 1), R(-1, 1)]);
      p = norm(p);
      const c = Math.cos(ang), s = Math.sin(ang);
      return norm(add(mul(d, c), mul(p, s)));
    }
    // a curved piece of stem, in n sub-segments, growing across [t0,t1]
    function piece(p0, dir, len, t0, t1, w, kind, bend, droop, jit) {
      const n = kind === 0 ? 28 : 4;
      let p = p0, d = dir;
      for (let i = 0; i < n; i++) {
        d = norm(add(d, [R(-bend, bend), R(-bend, bend) - droop, R(-bend, bend)]));
        const q = add(p, mul(d, len / n));
        segs.push({ a: p, b: q, t0: t0 + (t1 - t0) * i / n, t1: t0 + (t1 - t0) * (i + 1) / n, w, k: kind, j: jit });
        p = q;
      }
      return { p, d };
    }
    const floret = (p, t, s, j) => pts.push({ p, t, s, j, k: 0 });
    const bead = (p, t, s) => pts.push({ p, t, s, j: rand(), k: 1 });
    const glyph = (p, t, s) => pts.push({ p, t, s, j: rand(), k: 2 });
    function cluster(E, D, t) {
      const n = 8 + ((rand() * 10) | 0);
      for (let i = 0; i < n; i++) {
        const u = norm([R(-1, 1), R(-1, 1), R(-1, 1)]);
        const r = 0.05 * Math.cbrt(rand());
        floret(add(add(E, mul(u, r)), mul(D, 0.02 * rand())), t + R(0, 0.035), R(0.010, 0.020), rand());
      }
      if (rand() < 0.035) glyph(add(E, mul(norm([R(-1, 1), R(-1, 1), R(-1, 1)]), 0.05)), t + R(0.01, 0.04), R(0.012, 0.020));
    }
    // velocity of growth along a branch, in length per growth unit
    const V = 3.4;
    function branch(p, d, len, depth, maxD, t, jit) {
      const t1 = t + len / V;
      const w = 0.0042 * Math.pow(0.80, depth);
      const end = piece(p, d, len, t, t1, w, 1, 0.10, 0.018 * depth, jit);
      if (depth >= 3 && rand() < 0.5) floret(end.p, t1 + R(0, 0.02), R(0.008, 0.014), rand());
      if (depth >= maxD || len < 0.03) {
        if (rand() < 0.12) {                   // a long bare stalk ending in a bead (the reference's pins)
          const st = piece(end.p, rotAway(end.d, R(0.1, 0.4)), R(0.05, 0.12), t1, t1 + 0.03, w * 0.8, 1, 0.05, 0.03, jit);
          bead(st.p, t1 + 0.03, R(0.012, 0.018));
        } else cluster(end.p, end.d, t1);
        return;
      }
      const kids = rand() < 0.28 ? 3 : 2;
      for (let i = 0; i < kids; i++)
        branch(end.p, rotAway(end.d, R(0.30, 0.70)), len * R(0.64, 0.78), depth + 1, maxD, t1 + R(0.002, 0.012), jit);
    }

    // 1 · the stem: rises from below the frame, 0 → 0.20
    const base = [R(-0.05, 0.05), -1.75, R(-0.05, 0.05)];
    const stemTop = 0.95;
    const stemPts = [];
    {
      let p = base, d = [R(-0.04, 0.04), 1, R(-0.04, 0.04)];
      const n = 56, len = stemTop - base[1];
      for (let i = 0; i < n; i++) {
        d = norm(add(d, [R(-0.02, 0.02), 0, R(-0.02, 0.02)]));
        d = norm(add(d, [-p[0] * 0.05, 0.08, -p[2] * 0.05]));
        const q = add(p, mul(d, len / n));
        const t0 = 0.20 * i / n, t1 = 0.20 * (i + 1) / n;
        segs.push({ a: p, b: q, t0, t1, w: 0.0075, k: 0, j: 0 });
        stemPts.push({ p: q, t: t1, d });
        p = q;
      }
    }
    const top = stemPts[stemPts.length - 1];
    // two blades low on the stem (the reference has a pair near the base)
    for (const s of [-1, 1]) {
      const sp = stemPts[s < 0 ? 13 : 17];
      piece(sp.p, norm([s * R(0.18, 0.3), 1, R(-0.15, 0.15)]), R(0.22, 0.36), sp.t, sp.t + 0.06, 0.0035, 0, 0.012, 0, 0);
    }
    // 2 · the leader keeps going above the cloud, and the umbel opens at the top: 0.20 → 0.30
    piece(top.p, norm([R(-0.1, 0.1), 1, R(-0.1, 0.1)]), 0.42, 0.20, 0.29, 0.0045, 0, 0.03, 0, 0);
    for (let i = 0; i < 8; i++) {
      const az = i / 8 * Math.PI * 2 + R(-0.3, 0.3), el = R(0.25, 0.65);
      const d = norm([Math.cos(az) * Math.sin(el), Math.cos(el), Math.sin(az) * Math.sin(el)]);
      const e = piece(top.p, d, R(0.18, 0.32), 0.20, 0.27, 0.0038, 1, 0.05, 0, rand());
      for (let k = 0; k < 3; k++) {
        const e2 = piece(e.p, rotAway(e.d, R(0.2, 0.6)), R(0.05, 0.12), 0.27, 0.30, 0.003, 1, 0.05, 0, rand());
        bead(e2.p, 0.30, R(0.012, 0.018));
      }
    }
    // 3 · the cloud: laterals off the upper stem, top first, lower later and longer
    const LAT = 22;
    for (let i = 0; i < LAT; i++) {
      const f = i / (LAT - 1);                    // 0 top → 1 lowest
      const idx = Math.round((stemPts.length - 2) - f * 30);
      const sp = stemPts[Math.max(0, idx)];
      const az = i * 2.39996 + R(-0.4, 0.4), el = 0.30 + 0.75 * f + R(-0.08, 0.12);
      const d = norm([Math.cos(az) * Math.sin(el), Math.cos(el), Math.sin(az) * Math.sin(el)]);
      const len = (0.10 + 0.24 * Math.sin(Math.min(1, f * 1.15) * Math.PI * 0.9 + 0.1)) * R(0.85, 1.15);
      branch(sp.p, d, len, 0, f > 0.2 ? 6 : 5, 0.28 + Math.abs(f - 0.62) * 0.55 + R(0, 0.04), rand());   // the middle first, the crown last (as in the reference)
    }
    // squeeze everything after the umbel into the reference's pace: the cloud completes by 0.95
    let tMax = 0;
    for (const s of segs) tMax = Math.max(tMax, s.t1);
    for (const p of pts) tMax = Math.max(tMax, p.t);
    const remap = (t) => t <= 0.30 ? t : 0.30 + (t - 0.30) / (tMax - 0.30) * 0.65;
    for (const s of segs) { s.t0 = remap(s.t0); s.t1 = remap(s.t1); }
    for (const p of pts) p.t = remap(p.t);
    return { segs, pts, stemPts, top: top.p };
  }

  function buildGeo(plant) {
    const S = plant.segs, NS = S.length;
    const aA = new Float32Array(NS * 4 * 3), aB = new Float32Array(NS * 4 * 3);
    const aT = new Float32Array(NS * 4 * 2), aC = new Float32Array(NS * 4 * 2);
    const aW = new Float32Array(NS * 4), aK = new Float32Array(NS * 4), aJ = new Float32Array(NS * 4), aO = new Float32Array(NS * 4);
    const idx = new Uint32Array(NS * 6);
    const C = [[0, -1], [0, 1], [1, -1], [1, 1]];
    for (let i = 0; i < NS; i++) {
      const s = S[i];
      for (let v = 0; v < 4; v++) {
        const o = i * 4 + v;
        aA.set(s.a, o * 3); aB.set(s.b, o * 3);
        aT[o * 2] = s.t0; aT[o * 2 + 1] = s.t1;
        aC[o * 2] = C[v][0]; aC[o * 2 + 1] = C[v][1];
        aW[o] = s.w; aK[o] = s.k; aJ[o] = s.j; aO[o] = s.o;
      }
      const b = i * 4;
      idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], i * 6);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(aA, 3));   // bounds only
    rg.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
    rg.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
    rg.setAttribute('aT', new THREE.BufferAttribute(aT, 2));
    rg.setAttribute('aC', new THREE.BufferAttribute(aC, 2));
    rg.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
    rg.setAttribute('aK', new THREE.BufferAttribute(aK, 1));
    rg.setAttribute('aJ', new THREE.BufferAttribute(aJ, 1));
    rg.setAttribute('aO', new THREE.BufferAttribute(aO, 1));
    rg.setIndex(new THREE.BufferAttribute(idx, 1));

    const Pp = plant.pts, NP = Pp.length;
    const pos = new Float32Array(NP * 3), pt = new Float32Array(NP), ps = new Float32Array(NP),
          pj = new Float32Array(NP), pk = new Float32Array(NP), po = new Float32Array(NP);
    for (let i = 0; i < NP; i++) {
      const p = Pp[i];
      pos.set(p.p, i * 3); pt[i] = p.t; ps[i] = p.s; pj[i] = p.j; pk[i] = p.k; po[i] = p.o;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('aT', new THREE.BufferAttribute(pt, 1));
    pg.setAttribute('aS', new THREE.BufferAttribute(ps, 1));
    pg.setAttribute('aJ', new THREE.BufferAttribute(pj, 1));
    pg.setAttribute('aK', new THREE.BufferAttribute(pk, 1));
    pg.setAttribute('aO', new THREE.BufferAttribute(po, 1));
    return { rg, pg, nSeg: NS, nPt: NP };
  }

  function cloudCentre(plant) {
    let x = 0, y = 0, z = 0, n = 0;
    for (const p of plant.pts) if (p.k === 0) { x += p.p[0]; y += p.p[1]; z += p.p[2]; n++; }
    return n ? [x / n, y / n, z / n] : plant.top;
  }

  function newPlant(P, T3) {
    const s = P.state;
    for (const o of (T3.objs || [])) { o.parent && o.parent.remove(o); }
    if (T3.geo) { T3.geo.rg.dispose(); T3.geo.pg.dispose(); }
    const plant = growPlant(P.rand);
    bakeShadow(plant);
    const geo = buildGeo(plant); T3.geo = geo;
    // the same geometry, drawn once into each OIT target
    T3.objs = [];
    for (const [scn, rm, pm] of [[T3.sAcc, T3.ribAcc, T3.ptAcc], [T3.sRev, T3.ribRev, T3.ptRev]]) {
      const a = new THREE.Mesh(geo.rg, rm), b = new THREE.Points(geo.pg, pm);
      a.frustumCulled = b.frustumCulled = false;
      scn.add(a); scn.add(b); T3.objs.push(a, b);
    }
    s.plant = plant; s.centre = cloudCentre(plant);
    // frame the WHOLE plant: base on the bottom edge, highest pin just inside the top
    let y0 = 1e9, y1 = -1e9, rx = 0;
    for (const q of plant.pts) { y1 = Math.max(y1, q.p[1]); rx = Math.max(rx, Math.hypot(q.p[0], q.p[2])); }
    for (const q of plant.segs) { y0 = Math.min(y0, q.a[1]); y1 = Math.max(y1, q.b[1]); }
    y0 = Math.max(y0, -1.2);                    // the stem may leave the frame below, like the reference
    s.wideY = (y0 + y1) / 2;
    const half = Math.max((y1 - y0) / 2 * 1.06, rx / (T3.rw / T3.rh) * 1.1);
    s.wideD = half / Math.tan(16 * Math.PI / 180) + rx * 0.5;
    s.nSeg = geo.nSeg; s.nPt = geo.nPt;
    s.g = 0; s.hold = 0; s.fade = 1; s.phase = 'grow'; s.plants++;
  }

  reg({
    id: 'SRC-65.2', family: 'SRC-65', ver: 2,
    title: 'L-Flower Study V2', tech: 'WEBGL / ORDER-INDEPENDENT TRANSPARENCY + BAKED SELF-SHADOW + SCATTER DOF',
    tags: ['STUDY', 'LOOK-DEV', 'WEBGL', 'OCCLUSION', 'SELF-SHADOW', 'DEPTH OF FIELD', 'AFTER DAN HOOPERT'],
    desc: 'A look-development study after Dan Hoopert\'s "L-Systems Flower": one green stem rises from below the frame, opens an umbel at its top, and then a cloud of thousands of florets branches out beneath it and settles, their colour drifting with age from bud green to cream, pink, lilac and finally blue. V2 gives the cloud a BODY: florets are no longer light added on black but stuff with coverage — the nearest floret owns its pixel and the mass behind it is hidden — and a key light from the upper front-left is shadowed by the cloud itself, so its interior falls into deep blue shade while its lit face stays cream and pink. Everything is seen through a lens: each floret and filament blurs by its own distance from the focal plane, so the far side of the cloud dissolves into bokeh discs while the near side stays sharp, and the focus breathes, hunts and racks on its own. When the plant is full it holds, dissolves, and a new one grows from a new seed.',
    interact: 'Near = less, far = more, both hands. LEFT HAND ZOOMS: close to the source is the whole plant; draw it away and the camera travels in, into the cloud itself — the autofocus follows through a spring, so a fast move makes the lens hunt and the picture blur before it settles. RIGHT HAND IS THE VELOCITY OF GROWTH: close to the source and the plant barely moves; draw it away and it grows fast. With no hands it grows at the reference\'s own pace (about 20 seconds to full bloom).',
    sound: 'Silent in this study. Next step to try: every square glyph is a note (Hoopert ties his shape language to sound events), pitched by height and panned by position.',

    init(P) {
      const s = {
        noGL: typeof THREE === 'undefined' || !THREE.EffectComposer || !THREE.UnrealBloomPass,
        g: 0, speed: 1, zoom: 0, zoomV: 0, focus: 4.4, focusV: 0, pull: 0, pullT: 9,
        pres: 0, plants: 0, phase: 'grow', hold: 0, fade: 1, az: 0
      };
      P.state = s;
      if (s.noGL) return;
      if (P._three) { try { P._three.composer.dispose && P._three.composer.dispose(); P._three.renderer.dispose(); } catch (e) {} }
      const T3 = {}; P._three = T3;
      const sc = Math.min(1, 1600 / Math.max(P.w, P.h));
      T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
      const r = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      r.setPixelRatio(1); r.setSize(T3.rw, T3.rh, false); r.setClearColor(0x000000, 1);
      T3.renderer = r;
      T3.sAcc = new THREE.Scene(); T3.sRev = new THREE.Scene();
      T3.cam = new THREE.PerspectiveCamera(32, T3.rw / T3.rh, 0.05, 50);

      const common = {
        uT: { value: 0 }, uG: { value: 0 }, uSpan: { value: 0.80 }, uFade: { value: 1 },
        uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
        uFocus: { value: 4.4 }, uAper: { value: 0.030 }, uCocMax: { value: 46 },
        uProj: { value: T3.rh / (2 * Math.tan(32 * Math.PI / 360)) },
        uLine: { value: 1.0 }, uPt: { value: 1.0 }, uPtGain: { value: 1.0 },
        uZRef: { value: 4 }, uShade: { value: new THREE.Vector3(0.05, 0.05, 0.16) }
      };
      T3.u = common;
      const mk = (vs, fs, reveal) => new THREE.ShaderMaterial({
        uniforms: common, vertexShader: vs, fragmentShader: fs,
        defines: reveal ? { REVEAL: 1 } : {},
        transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
        blendSrc: reveal ? THREE.ZeroFactor : THREE.OneFactor,
        blendDst: reveal ? THREE.OneMinusSrcColorFactor : THREE.OneFactor,
        blendSrcAlpha: reveal ? THREE.ZeroFactor : THREE.OneFactor,
        blendDstAlpha: reveal ? THREE.OneMinusSrcColorFactor : THREE.OneFactor
      });
      T3.ribAcc = mk(RIB_VS, RIB_FS, false); T3.ptAcc = mk(PT_VS, PT_FS, false);
      T3.ribRev = mk(RIB_VS, RIB_FS, true);  T3.ptRev = mk(PT_VS, PT_FS, true);
      const opt = { type: THREE.HalfFloatType, depthBuffer: false };
      T3.rtAcc = new THREE.WebGLRenderTarget(T3.rw, T3.rh, opt);
      T3.rtRev = new THREE.WebGLRenderTarget(T3.rw, T3.rh, opt);

      const rt = new THREE.WebGLRenderTarget(T3.rw, T3.rh, { type: THREE.HalfFloatType });
      const comp = new THREE.EffectComposer(r, rt);
      comp.setPixelRatio(1); comp.setSize(T3.rw, T3.rh);
      T3.resolve = new THREE.ShaderPass(RESOLVE);
      T3.resolve.uniforms.tAcc.value = T3.rtAcc.texture;
      T3.resolve.uniforms.tRev.value = T3.rtRev.texture;
      comp.addPass(T3.resolve);
      T3.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(T3.rw, T3.rh), 0.55, 0.6, 0.62);
      comp.addPass(T3.bloom);
      LENS.uniforms.uRes.value = new THREE.Vector2(T3.rw, T3.rh);
      T3.lens = new THREE.ShaderPass(LENS);
      T3.lens.uniforms.uRes.value.set(T3.rw, T3.rh);
      comp.addPass(T3.lens);
      T3.composer = comp;
      newPlant(P, T3);
    },

    step(P, dt, t, inp) {
      const s = P.state;
      if (s.noGL) return;
      dt = Math.min(dt, 0.1);
      const liveL = chan.L.mode === 'live', liveR = chan.R.mode === 'live';
      // FAR = MORE collides with "nobody there": a hand at full reach can drop
      // out of live. So a lost hand HOLDS its last value, and only after 4s of
      // absence eases home to the calm default.
      s.goneL = liveL ? 0 : (s.goneL || 0) + dt; s.goneR = liveR ? 0 : (s.goneR || 0) + dt;
      s.pres += (((liveL || liveR) ? 1 : 0) - s.pres) * Math.min(1, dt * 2);

      // RIGHT = velocity of growth. No hand → the reference's pace.
      const farR = 1 - clamp(inp.R), farL = 1 - clamp(inp.L);   // near = less, far = more
      const vHand = 0.08 + 3.4 * Math.pow(farR, 1.6);
      if (liveR) s.lastV = vHand;
      const vWant = liveR ? vHand : (s.goneR < 4 && s.lastV !== undefined ? s.lastV : 1);
      s.speed += (vWant - s.speed) * Math.min(1, dt * 3);
      const RATE = GEND / 20;                       // growth units per second at 1×

      if (s.phase === 'grow') {
        s.g += RATE * s.speed * dt;
        if (s.g >= GEND) { s.g = GEND; s.phase = 'hold'; s.hold = 0; }
      } else if (s.phase === 'hold') {
        s.g += RATE * 0.06 * s.speed * dt;        // the colour keeps drifting, slowly
        s.hold += dt * Math.max(0.3, s.speed);
        if (s.hold > 9) { s.phase = 'fade'; }
      } else if (s.phase === 'fade') {
        s.g += RATE * 0.06 * s.speed * dt;
        s.fade -= dt / 3.5;
        if (s.fade <= 0) newPlant(P, P._three);
      }
      if (s.phase === 'grow' && s.fade < 1) s.fade = Math.min(1, s.fade + dt);

      // LEFT = zoom, through a soft camera spring
      if (liveL) s.lastZ = farL;
      const zWant = liveL ? farL : (s.goneL < 4 && s.lastZ !== undefined ? s.lastZ : 0.08);
      const kZ = 9, cZ = 2 * Math.sqrt(kZ) * 0.95;
      s.zoomV += (kZ * (zWant - s.zoom) - cZ * s.zoomV) * dt;
      s.zoom += s.zoomV * dt;
      s.az += dt * 0.035;
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      if (s.noGL) {
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(220,200,255,0.8)';
        g.font = '12px ui-monospace,monospace';
        g.fillText('L-FLOWER STUDY · needs WebGL + the three.js post stack', 10, h - 10);
        return;
      }
      const T3 = P._three, u = T3.u, dt = Math.min(0.1, Math.max(0.001, t - (s._lt || t)));
      s._lt = t;

      // where the eye goes: the stem tip while it rises, the cloud once it exists
      const plant = s.plant;
      let front;
      if (s.g < 0.20) {
        const i = Math.min(plant.stemPts.length - 1, Math.floor(s.g / 0.20 * plant.stemPts.length));
        front = plant.stemPts[i].p;
      } else {
        const k = clamp((s.g - 0.20) / 0.45);
        front = [plant.top[0] + (s.centre[0] - plant.top[0]) * k,
                 plant.top[1] + (s.centre[1] - plant.top[1]) * k,
                 plant.top[2] + (s.centre[2] - plant.top[2]) * k];
      }
      const z = clamp(s.zoom, -0.1, 1.1), ze = Math.pow(Math.max(0, z), 1.15);
      const dist = s.wideD + (0.75 - s.wideD) * ze;
      const wide = [0, s.wideY, 0];
      const tgt = [wide[0] + (front[0] - wide[0]) * ze, wide[1] + (front[1] - wide[1]) * ze, wide[2] + (front[2] - wide[2]) * ze];
      const az = s.az + 0.25 * Math.sin(t * 0.05), el = 0.10 + 0.05 * Math.sin(t * 0.07);
      const cam = T3.cam;
      cam.position.set(tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el));
      cam.lookAt(tgt[0], tgt[1], tgt[2]);
      cam.updateMatrixWorld();

      // THE LENS: autofocus on the front, through an under-damped spring (it hunts)
      const fx = front[0] - cam.position.x, fy = front[1] - cam.position.y, fz = front[2] - cam.position.z;
      let fWant = Math.hypot(fx, fy, fz);
      fWant *= 1 + 0.10 * Math.sin(t * 0.21) + 0.05 * Math.sin(t * 0.53);   // the plane breathes through the cloud
      s.pullT -= dt;
      if (s.pullT <= 0) { s.pull = 1; s.pullT = 12 + 6 * P.rand(); }
      s.pull = Math.max(0, s.pull - dt / 3.2);
      const pullShape = Math.sin(Math.PI * (1 - s.pull));                   // 0 → 1 → 0 over the pull
      fWant *= 1 - 0.28 * pullShape * (s.g > 0.4 ? 1 : 0);                 // rack to the near side and back
      const kF = 16, cF = 2 * Math.sqrt(kF) * 0.38;
      s.focusV += (kF * (fWant - s.focus) - cF * s.focusV) * dt;
      s.focus = Math.max(0.2, s.focus + s.focusV * dt);

      u.uT.value = t; u.uG.value = s.g; u.uFade.value = Math.max(0, s.fade);
      u.uFocus.value = s.focus;
      // shallower as we get closer (macro); a touch wider open while the lens hunts
      u.uAper.value = (0.045 + 0.06 * ze) * (1 + Math.min(1.5, Math.abs(s.focusV) * 0.4));
      u.uLine.value = 1.0 + 0.6 * ze;
      u.uPtGain.value = 1.0 - 0.15 * ze;          // coverage resolves, so only a light trim close up
      // fill light rises as the camera enters the cloud: inside, EVERYTHING is in shade
      u.uShade.value.set(0.05 + 0.30 * ze, 0.05 + 0.27 * ze, 0.16 + 0.42 * ze);
      T3.bloom.strength = 0.5 + 0.2 * ze;
      T3.lens.uniforms.uT.value = t;
      // the two OIT targets, then the composer resolves + blooms + lenses them
      u.uZRef.value = Math.hypot(s.centre[0] - cam.position.x, s.centre[1] - cam.position.y, s.centre[2] - cam.position.z);
      const r = T3.renderer;
      r.setRenderTarget(T3.rtAcc); r.setClearColor(0x000000, 0); r.clear(); r.render(T3.sAcc, cam);
      r.setRenderTarget(T3.rtRev); r.setClearColor(0xffffff, 1); r.clear(); r.render(T3.sRev, cam);
      r.setRenderTarget(null); r.setClearColor(0x000000, 1);
      T3.composer.render();

      g.clearRect(0, 0, w, h);
      g.drawImage(T3.renderer.domElement, 0, 0, w, h);
      g.fillStyle = 'rgba(210,195,255,0.35)';
      g.font = `${Math.max(9, Math.round(h / 110))}px ui-monospace,monospace`;
      g.fillText('ZOOM ' + Math.round(z * 100) + '   SPEED ' + s.speed.toFixed(2) + '×   GROWTH ' + Math.round(s.g / GEND * 100) +
        '%   FOCUS ' + s.focus.toFixed(2) + ' (' + (s.focusV >= 0 ? '+' : '') + s.focusV.toFixed(2) + ')   ' +
        s.nPt + ' pts · ' + s.nSeg + ' segs   #' + s.plants + ' ' + s.phase.toUpperCase(), 10, h - 10);
    }
  });
})();
