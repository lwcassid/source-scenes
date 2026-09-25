/* ---------- SRC-72 · BIRDSONG (V1) — a learning study after Andy Thomas ----------
   Reference: Andy Thomas, *Visual Bird Sounds* (white-tailed flycatcher). A
   blue clay creature hangs in a real forest. Every call of the bird grows a
   sculptural appendage out of it — a sheaf of grooved ribbons, a hoop, a comb,
   a spray of droplets — which lives about a second and melts while the next
   one grows. Offline work (fluid, cloth and fur sims, rendered, composited on
   filmed footage). This file asks how close a real-time instrument can get.

   WHAT THE READING OF THE REFERENCE SAID (measured, see the study folder)
   · ONE HUE. Cornflower blue, navy in the creases, pale cyan at the edges.
   · MATTER, NOT LIGHT. Matte clay with soft occlusion and a pale sheen at
     grazing angles. The first scene in this library that is lit, not glowing.
   · A GRAMMAR: a persistent CORE, with APPENDAGES that grow in ~0.3–0.5 s,
     hold, and melt. The core shrinks to a seed between phrases and swells again.
   · A FOREST PLATE, hand-held, shallow depth of field, big bokeh discs.

   HOW THIS FILE BUILDS IT
   · THE SONG MAKES THE FORM. The scene sings its own birdsong (chirps on the
     chord ladder, in phrases) and EVERY NOTE PUSHES ITS APPENDAGE OUT ONE STEP:
     a gesture is a few notes, and each one advances that gesture's growth
     with a quick attack. A rising call grows a ribbon sheaf, a trill sweeps a
     hoop round, a long whistle draws a comb, a falling call throws droplets.
     Pitch decides where it goes (high notes grow upward). One sequencer feeds
     both the speaker and the picture, and the picture shows each note on the
     frame its sound is heard (ISOTRP's clock, AudioContext output timestamp).
   · THE CORE is one sphere displaced in its vertex shader (a folded fbm, so
     it makes sheets and creases, not bumps). The normal is re-derived from
     two neighbouring samples, and the displacement also becomes a CAVITY
     term that darkens the creases toward navy: the reference's occlusion,
     bought with one varying.
   · APPENDAGES are ribbons written on the CPU each frame into fixed
     buffers (no allocation per note). Every ribbon is cupped and GROOVED,
     and the grooves are in the NORMAL, analytically, so they shade like
     carved clay without a single extra triangle.
   · LIGHT comes from the forest: a PMREM environment built from a tiny
     gradient world with the plate's colours (bright canopy above, brown earth
     below), plus a soft key. The creature is lit by the place it hangs in —
     which is most of why the reference reads as composited, not pasted.
   · THE PLATE is procedural: an endless forest of blurred trunks, canopy and
     bokeh discs, shifted by the camera's own rotation so it parallaxes as a
     far background should. `P.state.plate = 0` gives true black (the show law).
   · A DEPTH-OF-FIELD PASS from the depth buffer (a gather, near-wins), then
     ACES tone mapping, vignette and grain. The lens autofocuses on the core
     through an under-damped spring, and the camera is hand-held.

   THE HANDS (the Source law — near is less, far is more; the last position holds)
   · LEFT = SIZE AND REACH. At the source a small seed far off in the forest;
     open the hand and the camera comes in and every appendage reaches further,
     until the creature fills the frame.
   · RIGHT = SONG AND AGITATION. At the source a rare, sparse call and a core
     that barely breathes; open it and the bird sings in dense phrases, the
     clay boils, and the camera starts to walk slowly round it.

   Test hooks: P.state.force = 'sheaf'|'ring'|'comb'|'splash' fixes the gesture
   type; P.state.plate = 0..1 fades the forest.

   V1 AS BUILT (Sep 25), measured in Chrome on Metal at 1920×1200: 60 fps at
   the Source, L only, R only, both wide, and on true black — with the 48k-
   triangle core, up to ten ribbon forms and 700 beads live. Zero page errors.
   Five rounds, each fixing the biggest lie of the one before: a gravel core
   (three noise octaves → two broad ones), forms growing INSIDE the core (one
   radius now owns the surface), forms too small to be the picture (petal-
   broad, 3–5 alive at once), a sheaf growing into the lens as a pale wall
   (growth flattened to the picture plane, a real aperture), and blurred
   beads printing as clusters of copies (the DOF gather's spiral is now
   rotated per pixel; smooth spheres, stretched along their flight).
   NOT YET HEARD: the song, the sub and the forest air are wired, unheard. */
(() => {
  const MUSIC = { bpm: 96, root: 52, mode: 'ionian', chordBars: 8, prog: [0, 5, 3, 4] };
  const AVOFF = 0.012;

  // ---------------------------------------------------------------- noise
  const NOISE = `
vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
         + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

  // ---------------------------------------------------------------- the core
  // folded fbm: each octave's |n| becomes a crease, which is what turns
  // noise into sheets of clay instead of a potato
  const CORE_HEAD = NOISE + `
uniform float uNT, uAmp, uScale, uLobe;
varying float vCav;
float coreDisp(vec3 p){
  float lobes = snoise(p * 1.1 + vec3(0.0, uNT * 0.6, 0.0));
  // two octaves only, and broad: a third octave turned the clay into gravel
  float r = 0.0, a = 0.62, f = 1.9;
  for (int k = 0; k < 2; k++) {
    float n = snoise(p * f + vec3(uNT * (1.0 + float(k) * 0.5), 3.1 * float(k), -uNT * 0.4));
    r += a * (1.0 - abs(n));
    a *= 0.4; f *= 2.3;
  }
  return uAmp * (uLobe * 1.7 * lobes + 0.8 * (r - 0.62));
}`;
  const CORE_NORMAL = `
  vec3 sp = normalize(position);
  vec3 ta = normalize(cross(sp, abs(sp.y) < 0.95 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 tb = cross(sp, ta);
  float d0 = coreDisp(sp);
  vec3 q0 = sp * (1.0 + d0);
  vec3 s1 = normalize(sp + ta * 0.012); vec3 q1 = s1 * (1.0 + coreDisp(s1));
  vec3 s2 = normalize(sp + tb * 0.012); vec3 q2 = s2 * (1.0 + coreDisp(s2));
  vec3 objectNormal = normalize(cross(q1 - q0, q2 - q0));
  vCav = d0 / max(uAmp, 0.001);
`;

  // colour of the creases: shade toward deep blue, never grey (LOOK-DEV §7)
  const CAV_FRAG = `
  #include <color_fragment>
  float cav = smoothstep(-0.55, 0.35, vCav);
  diffuseColor.rgb *= mix(vec3(0.22, 0.26, 0.55), vec3(1.0), cav);
`;

  // ---------------------------------------------------------------- the plate
  const PLATE_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
  const PLATE_FS = `
precision highp float;
varying vec2 vUv;
uniform float uAsp, uT, uPlate, uRoll;
uniform vec2 uOff;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++){ s += a*vn(p); p *= 2.03; a *= 0.5; } return s; }
void main(){
  vec2 c = vUv - 0.5;
  c = mat2(cos(uRoll), -sin(uRoll), sin(uRoll), cos(uRoll)) * c;
  vec2 p = vec2(c.x * uAsp, c.y) + vec2(0.5, 0.5) + uOff;

  // the bank: a soft, sloped line between canopy and earth
  float yg = 0.40 + 0.07 * sin(p.x * 1.7 + 1.3) + 0.03 * sin(p.x * 4.1);
  float ground = smoothstep(yg + 0.07, yg - 0.07, p.y);

  float n1 = fbm(p * vec2(2.6, 2.0) + 3.0);
  float n2 = fbm(p * vec2(5.0, 4.0) - 7.0);
  vec3 canopy = mix(vec3(0.016, 0.030, 0.010), vec3(0.070, 0.115, 0.036), n1);
  canopy = mix(canopy, vec3(0.11, 0.16, 0.06), 0.55 * smoothstep(0.5, 0.85, n2) * smoothstep(0.35, 0.9, p.y));
  vec3 earth = mix(vec3(0.040, 0.030, 0.020), vec3(0.100, 0.078, 0.052), fbm(p * vec2(3.0, 5.0) + 11.0));
  earth = mix(earth, vec3(0.05, 0.07, 0.03), smoothstep(yg - 0.16, yg, p.y) * 0.6);   // grass at the lip
  vec3 col = mix(canopy, earth, ground);

  // trunks: endless in x, one per cell, soft (they are far behind the focus)
  for (int k = -1; k <= 1; k++) {
    float cell = floor(p.x / 0.62) + float(k);
    float hx = h21(vec2(cell, 7.0));
    if (hx < 0.55) {
      float x0 = (cell + 0.2 + 0.6 * h21(vec2(cell, 3.0))) * 0.62;
      float wd = 0.035 + 0.05 * h21(vec2(cell, 5.0));
      float lean = (h21(vec2(cell, 9.0)) - 0.5) * 0.08;
      float dx = abs(p.x - x0 - lean * (p.y - 0.5));
      float tr = smoothstep(wd + 0.035, wd - 0.01, dx);
      vec3 bark = mix(vec3(0.022, 0.018, 0.013), vec3(0.06, 0.05, 0.035), smoothstep(-wd, wd, p.x - x0) * 0.7);
      col = mix(col, bark, tr * 0.92);
    }
  }

  // bokeh: light through the leaves, a flat disc with a brighter rim
  vec3 bok = vec3(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cid = floor(p / 0.14) + vec2(float(i), float(j));
    float pr = h21(cid + 0.3);
    float hi = smoothstep(0.42, 0.9, cid.y * 0.14);             // mostly high in the canopy
    if (pr < 0.03 + 0.30 * hi * smoothstep(0.35, 0.75, fbm(cid * 0.35 + 5.0))) {   // clustered where the canopy opens
      vec2 ctr = (cid + vec2(h21(cid + 1.7), h21(cid + 4.1))) * 0.14;
      float r = 0.018 + 0.055 * pow(h21(cid + 9.3), 1.6);
      float d = length(p - ctr) / r;
      float disc = smoothstep(1.0, 0.9, d) * (0.65 + 0.5 * smoothstep(0.6, 0.98, d));
      float tw = 0.75 + 0.25 * sin(uT * (0.4 + h21(cid) * 0.9) + pr * 30.0);
      float br = (0.04 + 0.7 * pow(h21(cid + 5.5), 4.0)) * mix(0.3, 1.0, hi) * tw;
      bok += disc * br * mix(vec3(0.55, 0.70, 0.45), vec3(0.95, 0.98, 0.90), h21(cid + 2.2));
    }
  }
  col += bok * (1.0 - ground * 0.8);
  gl_FragColor = vec4(col * uPlate, 1.0);
}`;

  // ---------------------------------------------------------------- the lens
  const LENS_VS = PLATE_VS;
  const LENS_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tCol, tDep;
uniform vec2 uPx;
uniform float uNear, uFar, uFocus, uAper, uProj, uCocMax, uExp, uT, uVig;
float linZ(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }
float cocAt(vec2 uv){
  float d = texture2D(tDep, uv).x;
  if (d > 0.99999) return 0.0;                 // the plate is already out of focus
  float z = linZ(d);
  return min(uAper * abs(1.0 / uFocus - 1.0 / z) * uProj, uCocMax);
}
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec3 c0 = texture2D(tCol, vUv).rgb;
  float d0 = texture2D(tDep, vUv).x;
  float z0 = d0 > 0.99999 ? 1e4 : linZ(d0);
  float k0 = cocAt(vUv);
  vec3 acc = c0; float wsum = 1.0;
  // golden-angle gather; a sample reaches us if ITS blur covers the distance
  // (near samples always may; far ones only as far as our own blur allows,
  // so a blurred background never bleeds over a sharp foreground)
  // THE SPIRAL IS ROTATED PER PIXEL. With one fixed spiral for every pixel,
  // a small blurred bead is picked up by the same few taps all around it and
  // prints as a cluster of copies of itself (it did: "raspberries"). A
  // per-pixel rotation and jittered radius turns those copies into a soft disc.
  const int N = 52;
  float rot0 = h21(gl_FragCoord.xy) * 6.2832;
  float jr = h21(gl_FragCoord.yx + 17.0);
  for (int i = 1; i < N; i++) {
    float fi = float(i);
    float r = sqrt((fi - 0.5 + jr) / float(N)) * uCocMax;
    float a = fi * 2.39996 + rot0;
    vec2 uv = vUv + vec2(cos(a), sin(a)) * r * uPx;
    float ds = texture2D(tDep, uv).x;
    float zs = ds > 0.99999 ? 1e4 : linZ(ds);
    float ks = cocAt(uv);
    float reach = zs < z0 ? ks : min(ks, k0);
    float w = smoothstep(r - 1.0, r + 0.5, reach);
    acc += texture2D(tCol, uv).rgb * w; wsum += w;
  }
  vec3 col = acc / wsum;
  col = aces(col * uExp);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 q = vUv - 0.5;
  col *= mix(1.0, 1.0 - dot(q, q) * 1.1, uVig);
  col += (h21(vUv * vec2(1731.0, 977.0) + fract(uT) * 61.0) - 0.5) * (3.0 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}`;

  // ---------------------------------------------------------------- palette
  // linear-light targets, from the measured sRGB percentiles of the reference
  const PAL = {
    core:  [0.090, 0.180, 0.620],   // cornflower
    deep:  [0.040, 0.075, 0.420],
    pale:  [0.340, 0.560, 1.000],   // the pale cyan sheafs (biased blue: the forest light greens it)
    ice:   [0.640, 0.740, 1.000],   // near-white accents
    lilac: [0.200, 0.260, 0.780]
  };

  // ---------------------------------------------------------------- ribbons
  const SLOTS = 10, SMAX = 26, PTS = 32, ACR = 11;
  const SP = 64;                  // samples along a stored spine

  const v3 = (x, y, z) => [x, y, z];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sc = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  // rotate v around unit axis k by angle th (Rodrigues)
  const rot = (v, k, th) => {
    const c = Math.cos(th), s = Math.sin(th), kv = cross(k, v), kd = dot(k, v) * (1 - c);
    return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd];
  };

  /* A spine: a curve that leaves the core along `dir` and curls. Stored as
     SP samples of position, tangent and width direction. The width direction
     is kept perpendicular to the tangent by rotating both together. */
  function makeSpine(o, dir, len, curl, twist, rnd) {
    let d = nrm(dir);
    let ax = nrm(cross(d, nrm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5])));
    const P = new Float32Array(SP * 3), Tn = new Float32Array(SP * 3), Wd = new Float32Array(SP * 3);
    let p = o.slice();
    const ds = len / (SP - 1);
    for (let i = 0; i < SP; i++) {
      P.set(p, i * 3); Tn.set(d, i * 3); Wd.set(ax, i * 3);
      p = add(p, sc(d, ds));
      const kc = curl * (0.6 + 0.8 * i / SP);                 // it curls harder as it goes
      d = nrm(rot(d, ax, kc * ds));
      ax = nrm(rot(ax, d, twist * ds));
    }
    return { P, Tn, Wd, len };
  }
  function spAt(S, u, out) {
    const f = Math.min(SP - 1.0001, Math.max(0, u * (SP - 1)));
    const i = f | 0, t = f - i, j = i * 3, k = j + 3;
    for (let q = 0; q < 3; q++) {
      out.p[q] = S.P[j + q] + (S.P[k + q] - S.P[j + q]) * t;
      out.t[q] = S.Tn[j + q] + (S.Tn[k + q] - S.Tn[j + q]) * t;
      out.w[q] = S.Wd[j + q] + (S.Wd[k + q] - S.Wd[j + q]) * t;
    }
    return out;
  }

  /* Write one ribbon into a slot's buffers. `ev(i, u)` fills E.p (centre),
     E.t (tangent), E.w (width direction) and returns the half-width. The
     ribbon is cupped (a bow across its width) and grooved, and both live in
     the NORMAL: n' = normalize(n + w·(gd·πG·sin(πGv) + 2·bow·v)). */
  const E = { p: [0, 0, 0], t: [0, 0, 0], w: [0, 0, 0] };
  function writeStrip(slot, si, ev, gd, G, bow) {
    const pos = slot.pos, nr = slot.nr;
    let base = si * PTS * ACR * 3;
    for (let i = 0; i < PTS; i++) {
      const hw = ev(i, i / (PTS - 1));
      const t = nrm(E.t);
      let w = E.w;
      // re-orthogonalise: the width direction must be perpendicular to t
      const td = dot(w, t); w = nrm([w[0] - t[0] * td, w[1] - t[1] * td, w[2] - t[2] * td]);
      const n = cross(t, w);
      for (let a = 0; a < ACR; a++) {
        const v = a / (ACR - 1) * 2 - 1;
        const h = hw * (gd * Math.cos(Math.PI * G * v) - bow * v * v);
        const x = E.p[0] + w[0] * v * hw + n[0] * h;
        const y = E.p[1] + w[1] * v * hw + n[1] * h;
        const z = E.p[2] + w[2] * v * hw + n[2] * h;
        const sl = gd * Math.PI * G * Math.sin(Math.PI * G * v) + 2 * bow * v;
        let nx = n[0] + w[0] * sl, ny = n[1] + w[1] * sl, nz = n[2] + w[2] * sl;
        const l = Math.hypot(nx, ny, nz) || 1;
        pos[base] = x; pos[base + 1] = y; pos[base + 2] = z;
        nr[base] = nx / l; nr[base + 1] = ny / l; nr[base + 2] = nz / l;
        base += 3;
      }
    }
  }
  // the tip is rounded and the base narrows into the core
  const taper = (x) => {
    const tip = x > 0.86 ? Math.sqrt(Math.max(0, 1 - Math.pow((x - 0.86) / 0.14, 2))) : 1;
    return tip * (0.35 + 0.65 * Math.min(1, x * 5));
  };

  // ---------------------------------------------------------------- the sequencer
  function clock() {
    if (typeof T !== 'undefined' && T.running && AE.ctx) {
      const c = AE.ctx; let now = c.currentTime;
      if (c.getOutputTimestamp) {
        const ts = c.getOutputTimestamp();
        if (ts && ts.contextTime > 0) now = ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
      }
      return { t: now, dom: 'a' };
    }
    return { t: performance.now() / 1000, dom: 'w' };
  }
  function grid(dom) {
    return dom === 'a' ? { o: T.t0, sx: T.beat / 4 } : { o: 0, sx: 60 / MUSIC.bpm / 4 };
  }
  const TYPES = ['sheaf', 'ring', 'comb', 'splash'];
  function pickType(s, rnd) {
    if (s.force) return s.force;
    const r = rnd();
    return r < 0.36 ? 'sheaf' : r < 0.62 ? 'ring' : r < 0.78 ? 'comb' : 'splash';
  }
  /* A PHRASE is one to three GESTURES. A gesture is a handful of notes of one
     call type, and each note pushes that gesture's appendage out one step. */
  function genPhrase(s, t0, sx, rnd) {
    const d = s.dens, ev = [];
    let t = t0;
    const nG = 1 + (rnd() < 0.25 + 0.55 * d ? 1 : 0) + (rnd() < 0.2 * d ? 1 : 0);
    for (let g = 0; g < nG; g++) {
      const type = pickType(s, rnd);
      const id = ++s.gid;
      const deg = 3 + ((rnd() * 7) | 0);                 // which rung of the chord ladder
      let n, step, dur, glide;
      if (type === 'sheaf')  { n = 2 + ((rnd() * 3) | 0); step = sx * (1 + (rnd() < 0.5)); dur = 0.10; glide = 1.45; }
      else if (type === 'ring')  { n = 5 + ((rnd() * 6) | 0); step = sx / 2; dur = 0.05; glide = 0.9; }
      else if (type === 'comb')  { n = 1 + (rnd() < 0.5); step = sx * 4; dur = 0.42; glide = 1.25; }
      else { n = 2 + ((rnd() * 3) | 0); step = sx; dur = 0.13; glide = 0.62; }
      const pan = (rnd() - 0.5) * 1.4;
      const spec = { id, type, n, deg, pan, seed: rnd() * 1e6, lastT: t + (n - 1) * step };
      s.specs[id] = spec;
      for (let k = 0; k < n; k++) {
        const up = type === 'sheaf' ? k * 0.5 : type === 'splash' ? -k * 0.7 : 0;
        ev.push({ t: t + k * step, id, k, n, deg: deg + up, dur, glide, pan, type });
      }
      t += (n - 1) * step + sx * (1 + ((rnd() * 3) | 0));
    }
    return { ev, end: t };
  }
  function pump(s, dom, now, upTo, onEv) {
    const G = grid(dom), q = s.seq;
    if (q.dom !== dom || q.next < now - 0.5) { q.dom = dom; q.next = now + 0.1; s.q.length = 0; }
    let guard = 0;
    while (q.next < upTo && guard++ < 8) {
      const t0 = G.o + Math.ceil((q.next - G.o) / G.sx) * G.sx;
      const ph = genPhrase(s, t0, G.sx, s.rnd);
      for (const e of ph.ev) { s.q.push(e); if (onEv) onEv(e); }
      // the rest between phrases: long and rare near the source, short wide open
      const rest = (2.3 - 2.05 * s.dens) * (0.7 + 0.6 * s.rnd());
      q.next = ph.end + rest;
    }
  }
  const audioOwns = s => performance.now() - (s.seq.tickWall || -1e9) < 300;

  // ---------------------------------------------------------------- the scene
  reg({
    id: 'SRC-72', family: 'SRC-72', ver: 1,
    title: 'Birdsong',
    tech: 'WEBGL / LIT CLAY · GROOVED RIBBONS · PMREM FOREST LIGHT · DEPTH-BUFFER DOF',
    tags: ['STUDY', 'AFTER ANDY THOMAS', 'WEBGL', 'CLAY', 'DEPTH OF FIELD', 'THE SOURCE LAW'],
    music: MUSIC,
    desc: 'A learning study after Andy Thomas\'s Visual Bird Sounds. A blue clay creature hangs in a blurred forest, and the scene sings its own birdsong. Every call grows something out of the creature, one note at a time: a rising call pushes out a sheaf of grooved ribbons, a trill sweeps a hoop around it, a long whistle draws a comb, a falling call throws a spray of droplets. Each form holds for a moment and melts into droplets while the next one grows, and between phrases the core shrinks to a seed and swells again. The clay is lit by the forest it hangs in, and the camera is hand-held with a lens that hunts its focus.',
    interact: 'THE SOURCE LAW, and the last position holds. LEFT = SIZE AND REACH: at the source a small seed far off among the trees; open the hand and the camera comes in and every form reaches further, until the creature fills the frame. RIGHT = SONG AND AGITATION: at the source a rare, sparse call and a core that barely breathes; open it and the bird sings in dense phrases, the clay boils, and the camera starts to walk slowly around it.',
    sound: 'E major at 96. Birdsong on the chord ladder, two to three octaves up: rising chirps, fast trills, long whistles and falling calls, each one a note that makes a form. Under it a quiet sub root and a breath of forest air. MIDI: bells for every call.',

    init(P) {
      let seed = 7;
      const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      const s = {
        noGL: typeof THREE === 'undefined' || !THREE.WebGLRenderer || !THREE.PMREMGenerator,
        rnd, gid: 0, specs: {}, q: [], seq: { dom: null, next: 0, tickWall: -1e9 }, phrases: [],
        gest: [], drops: [], force: null, plate: 1,
        L: 0.35, R: 0.35, dens: 0.35, pres: 0,
        nt: 0, ntV: 0, swell: 0, size: 0.6, reach: 1, dist: 7.5, az: 0, azV: 0,
        focus: 7.5, focusV: 0, fired: 0, lastPhrase: -99, tSec: 0
      };
      P.state = s;
      if (s.noGL) return;
      if (P._w) { try { P._w.renderer.dispose(); } catch (e) {} }
      const W = {}; P._w = W;
      const k = Math.min(1, 1600 / Math.max(P.w, P.h));
      W.rw = Math.max(2, Math.round(P.w * k)); W.rh = Math.max(2, Math.round(P.h * k));

      const r = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      r.setPixelRatio(1); r.setSize(W.rw, W.rh, false); r.setClearColor(0x000000, 1);
      r.autoClear = false;
      W.renderer = r;

      // --- the render target: HDR colour + depth, for the lens
      W.rt = new THREE.WebGLRenderTarget(W.rw, W.rh, { type: THREE.HalfFloatType, depthBuffer: true,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      W.rt.depthTexture = new THREE.DepthTexture(W.rw, W.rh);
      W.rt.depthTexture.type = THREE.UnsignedIntType;

      const quad = new THREE.PlaneGeometry(2, 2);
      // --- the plate
      W.plateU = { uAsp: { value: W.rw / W.rh }, uT: { value: 0 }, uPlate: { value: 1 }, uOff: { value: new THREE.Vector2() }, uRoll: { value: 0 } };
      W.plateScene = new THREE.Scene();
      const pm = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: W.plateU, vertexShader: PLATE_VS, fragmentShader: PLATE_FS, depthTest: false, depthWrite: false }));
      pm.frustumCulled = false; W.plateScene.add(pm);
      W.orth = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      // --- the creature
      const FOV = 30;
      W.cam = new THREE.PerspectiveCamera(FOV, W.rw / W.rh, 0.3, 60);
      W.proj = W.rh / (2 * Math.tan(FOV * Math.PI / 360));
      W.scene = new THREE.Scene();

      // light from the forest: a gradient world with the plate's colours,
      // prefiltered once. Bright canopy above, warm earth below, green between.
      const envScene = new THREE.Scene();
      envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false,
        vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `varying vec3 vD; void main(){
          float y = vD.y;
          vec3 sky = mix(vec3(0.30, 0.40, 0.26), vec3(1.05, 1.12, 1.0), smoothstep(0.35, 0.95, y));
          vec3 mid = vec3(0.10, 0.16, 0.07);
          vec3 earth = vec3(0.13, 0.10, 0.07);
          vec3 c = y > 0.0 ? mix(mid, sky, smoothstep(0.0, 0.6, y)) : mix(mid, earth, smoothstep(0.0, -0.4, y));
          // a bright gap in the canopy, up and to the left: the key's source
          c += vec3(1.6, 1.6, 1.5) * pow(max(dot(vD, normalize(vec3(-0.5, 0.8, 0.35))), 0.0), 24.0);
          gl_FragColor = vec4(c, 1.0); }`
      })));
      const pmrem = new THREE.PMREMGenerator(r);
      W.env = pmrem.fromScene(envScene, 0.02).texture;
      pmrem.dispose();
      W.scene.environment = W.env;
      const key = new THREE.DirectionalLight(0xfff6e8, 1.1); key.position.set(-3, 5, 3); W.scene.add(key);
      const rim = new THREE.DirectionalLight(0xcfe6ff, 0.7); rim.position.set(2, 1.5, -4); W.scene.add(rim);

      const clay = (c, rough, sheen) => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(c[0], c[1], c[2]), roughness: rough, metalness: 0,
        sheen: sheen, sheenColor: new THREE.Color(0.75, 0.88, 1.0), sheenRoughness: 0.5,
        envMapIntensity: 1.0, side: THREE.DoubleSide
      });

      // the core: a dense sphere displaced in its vertex shader
      W.coreU = { uNT: { value: 0 }, uAmp: { value: 0.2 }, uScale: { value: 0.6 }, uLobe: { value: 0.6 } };
      const cm = clay(PAL.core, 0.82, 0.35);
      cm.side = THREE.FrontSide;
      cm.onBeforeCompile = sh => {
        Object.assign(sh.uniforms, W.coreU);
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\n' + CORE_HEAD)
          .replace('#include <beginnormal_vertex>', CORE_NORMAL)
          .replace('#include <begin_vertex>', 'vec3 transformed = q0 * uScale;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying float vCav;')
          .replace('#include <color_fragment>', CAV_FRAG);
      };
      cm.customProgramCacheKey = () => 'src72core';
      W.core = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 48), cm);
      W.core.frustumCulled = false;
      W.scene.add(W.core);

      // the ribbon slots: fixed topology, positions and normals written per frame
      const idx = [];
      for (let s2 = 0; s2 < SMAX; s2++) for (let i = 0; i < PTS - 1; i++) for (let a = 0; a < ACR - 1; a++) {
        const b = s2 * PTS * ACR, i0 = b + i * ACR + a, i1 = i0 + ACR;
        idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
      }
      W.slots = [];
      for (let q = 0; q < SLOTS; q++) {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(SMAX * PTS * ACR * 3), nr = new Float32Array(SMAX * PTS * ACR * 3);
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
        g.setAttribute('normal', new THREE.BufferAttribute(nr, 3).setUsage(THREE.DynamicDrawUsage));
        g.setIndex(idx);
        g.setDrawRange(0, 0);
        const m = new THREE.Mesh(g, clay(PAL.core, 0.72, 0.45));
        m.frustumCulled = false; m.visible = false;
        W.scene.add(m);
        W.slots.push({ g, pos, nr, mesh: m, busy: null });
      }

      // the droplets: instanced clay beads, stretched along their velocity
      W.MAXD = 700;
      const dm = clay([1, 1, 1], 0.6, 0.4);
      W.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), dm, W.MAXD);   // smooth normals: an icosahedron's facets read as glitter
      W.drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      W.drops.setColorAt(0, new THREE.Color(1, 1, 1));
      W.drops.count = 0; W.drops.frustumCulled = false;
      W.scene.add(W.drops);
      W.o3 = new THREE.Object3D(); W.qU = new THREE.Vector3(0, 1, 0); W.tmpV = new THREE.Vector3(); W.col = new THREE.Color();

      // --- the lens
      W.lensU = {
        tCol: { value: W.rt.texture }, tDep: { value: W.rt.depthTexture },
        uPx: { value: new THREE.Vector2(1 / W.rw, 1 / W.rh) },
        uNear: { value: W.cam.near }, uFar: { value: W.cam.far },
        uFocus: { value: 7.5 }, uAper: { value: 0.12 }, uProj: { value: W.proj }, uCocMax: { value: 34 },
        uExp: { value: 1.25 }, uT: { value: 0 }, uVig: { value: 1 }
      };
      W.lensScene = new THREE.Scene();
      const lm = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: W.lensU, vertexShader: LENS_VS, fragmentShader: LENS_FS, depthTest: false, depthWrite: false }));
      lm.frustumCulled = false; W.lensScene.add(lm);
    },

    step(P, dt, t, inp) {
      const s = P.state;
      s.tSec = t;
      s.pres += (SOURCE_PRES() - s.pres) * Math.min(1, dt * 1.5);
      // ---- the hands, the Source law. Continuous and immediate.
      s.L += (SOURCE(inp.L) - s.L) * Math.min(1, dt * 6);
      s.R += (SOURCE(inp.R) - s.R) * Math.min(1, dt * 6);
      s.dens = s.R;
      const L = s.L, R = s.R;
      const wantDist = 8.2 - 4.4 * L;       // mid-hand: the creature fills about half the frame height, like the reference
      s.dist += (wantDist - s.dist) * Math.min(1, dt * 5);
      s.reach = 0.95 + 0.45 * L;
      // the core breathes; agitation is the noise's own speed and depth
      s.swell *= Math.exp(-dt * 1.3);                         // attack quick, recover slow
      s.ntV += ((0.12 + 1.1 * R) - s.ntV) * Math.min(1, dt * 2);
      s.nt += s.ntV * dt;
      s.azV += ((0.015 + 0.22 * R * R) - s.azV) * Math.min(1, dt * 0.8);   // a body turning, not a motor
      s.az += s.azV * dt;
      if (s.noGL) return;

      const c = clock();
      if (!audioOwns(s)) pump(s, c.dom, c.t, c.t + 0.05, null);
      // ---- notes arriving now (on the frame their sound is heard)
      const tgt = c.t + AVOFF;
      let singing = false;
      for (const e of s.q) {
        if (e.t > tgt) continue;
        e.dead = true;
        onNote(P, e, t);
      }
      s.q = s.q.filter(e => !e.dead);
      for (const g of s.gest) if (g.alive && t < g.lastWall + 0.6) singing = true;
      // between phrases the core sinks to a seed; singing swells it
      const wantSize = (singing ? 0.66 : 0.48) + 0.24 * s.swell;
      s.size += (wantSize - s.size) * Math.min(1, dt * (wantSize > s.size ? 9 : 1.6));
      updateGestures(P, dt, t);
      updateDrops(P, dt, t);
    },

    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) {
        if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
        g.fillStyle = 'rgba(220,220,230,0.75)';
        g.font = `${Math.round(13 * (h / 1200))}px ui-monospace,monospace`;
        g.fillText('BIRDSONG needs WebGL + three.js', 24, h / 2);
        return;
      }
      const W = P._w, r = W.renderer;
      // ---- the hand-held camera: three incommensurate sines per axis, bigger
      // when the bird is agitated. It orbits slowly under the right hand.
      const amp = 0.035 * (0.6 + 0.8 * s.R) * s.dist / 7;
      const hx = amp * (Math.sin(t * 0.71) * 0.6 + Math.sin(t * 1.37 + 1) * 0.3 + Math.sin(t * 2.9 + 2) * 0.1);
      const hy = amp * (Math.sin(t * 0.53 + 4) * 0.6 + Math.sin(t * 1.21 + 3) * 0.3 + Math.sin(t * 3.3) * 0.1);
      const el = 0.10 + 0.04 * Math.sin(t * 0.11);
      W.cam.position.set(s.dist * Math.sin(s.az) * Math.cos(el) + hx, s.dist * Math.sin(el) + hy, s.dist * Math.cos(s.az) * Math.cos(el));
      W.cam.lookAt(hx * 0.4, 0.05 + hy * 0.4, 0);
      const roll = 0.012 * Math.sin(t * 0.37) * (0.6 + s.R);
      W.cam.rotateZ(roll);
      // AUTOFOCUS on the core, through an under-damped spring
      const want = W.cam.position.length() - 0.3 * s.size;
      s.focusV += ((want - s.focus) * 22 - s.focusV * 5.5) * Math.min(0.05, 1 / 60);
      s.focus += s.focusV * Math.min(0.05, 1 / 60);

      // ---- the plate moves the way a far background does: with the camera's rotation
      W.plateU.uT.value = t;
      W.plateU.uPlate.value = s.plate;
      W.plateU.uOff.value.set(-s.az / 0.8 - hx * 0.04, -hy * 0.04 + 0.02);
      W.plateU.uRoll.value = roll;

      // ---- the core
      W.coreU.uNT.value = s.nt;
      W.coreU.uAmp.value = 0.20 + 0.18 * s.R + 0.14 * s.swell;
      W.coreU.uScale.value = 0.55 * s.size;   // the same radius the appendages start from
      W.coreU.uLobe.value = 0.55 + 0.25 * Math.sin(s.nt * 0.3);

      // ---- render: plate, then the creature over it, then the lens
      r.setRenderTarget(W.rt);
      r.clear(true, true, true);
      r.render(W.plateScene, W.orth);
      r.clearDepth();
      r.render(W.scene, W.cam);
      r.setRenderTarget(null);
      const lu = W.lensU;
      lu.uFocus.value = Math.max(0.8, s.focus);
      lu.uAper.value = 0.12 + 0.16 * s.L;                     // macro: shallower as you come in
      lu.uT.value = t;
      r.clear(true, true, true);
      r.render(W.lensScene, W.orth);

      g.save();
      g.globalCompositeOperation = P.hosted ? 'lighter' : 'copy';
      g.drawImage(r.domElement, 0, 0, W.rw, W.rh, 0, 0, w, h);
      g.restore();
      if (!P.hosted && typeof OWPERF === 'function' && !OWPERF()) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * h / 1200)}px ui-monospace,monospace`;
        g.fillText('SIZE ' + Math.round(s.L * 100) + '   SONG ' + Math.round(s.R * 100) +
          '   FORMS ' + s.gest.filter(x => x.alive).length + '   CALLS ' + s.fired +
          (s.seq.dom === 'a' ? '   · A/V LOCKED' : ''), 10, h - 10);
      }
    },

    audio(A, P) {
      const v = A.voice();
      // a quiet sub root and a breath of forest air: the ground the calls sit on
      const sub = v.osc('sine', H.chordTone(0, -2));
      const subG = v.g(0.028); sub.connect(subG); subG.connect(v.group);
      const air = v.noise(), af = v.filter('bandpass', 3800, 0.6), airG = v.g(0.010);
      air.connect(af); af.connect(airG); airG.connect(v.group);
      H.onChord(() => A.set(sub.frequency, H.chordTone(0, -2), 0.8));
      v.fadeIn(1, 1.5);
      const chirp = (e) => {
        const c = A.ctx, at = Math.max(e.t, A.t() + 0.005);
        const f0 = H.chordTone(Math.round(e.deg), 2);
        const f1 = f0 * e.glide;
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(f0, at);
        o.frequency.exponentialRampToValueAtTime(f1, at + e.dur * 0.85);
        const o2 = c.createOscillator(); o2.type = 'sine';        // a thin second harmonic: a whistle, not a test tone
        o2.frequency.setValueAtTime(f0 * 2, at);
        o2.frequency.exponentialRampToValueAtTime(f1 * 2, at + e.dur * 0.85);
        const gg = c.createGain(), g2 = c.createGain(); g2.gain.value = 0.12;
        const vol = (0.05 + 0.03 * P.state.R) * (e.type === 'comb' ? 0.8 : 1);
        gg.gain.setValueAtTime(0, at);
        gg.gain.linearRampToValueAtTime(vol, at + 0.006);
        gg.gain.setTargetAtTime(0, at + e.dur * 0.55, e.dur * 0.3);
        const pn = c.createStereoPanner ? c.createStereoPanner() : null;
        o.connect(gg); o2.connect(g2); g2.connect(gg);
        if (pn) { pn.pan.value = e.pan; gg.connect(pn); pn.connect(v.group); } else gg.connect(v.group);
        if (A.revIn) { const sd = c.createGain(); sd.gain.value = 0.45; gg.connect(sd); sd.connect(A.revIn); }
        o.start(at); o2.start(at); o.stop(at + e.dur + 0.6); o2.stop(at + e.dur + 0.6);
        if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('bells', f0, vol * 3, at, e.dur);
      };
      return {
        tick() {
          const s = P.state; if (s.noGL || !T.running) return;
          s.seq.tickWall = performance.now();
          const now = A.t();
          pump(s, 'a', now, now + 0.15, chirp);
          if (typeof MOut !== 'undefined' && MOut.expr) MOut.expr('bells', s.R);
        },
        stop() { v.kill(0.4); }
      };
    }
  });

  // ---------------------------------------------------------------- gestures
  function onNote(P, e, t) {
    const s = P.state;
    s.fired++;
    s.swell = Math.max(s.swell, e.type === 'comb' ? 0.5 : 0.8);   // reset to the peak, don't stack
    let g = s.gest.find(x => x.id === e.id);
    if (!g) g = birth(P, s.specs[e.id], t);
    if (!g) return;
    g.got = e.k + 1;
    g.target = g.got / g.n;
    g.lastWall = t;
    if (g.got >= g.n) g.dieAt = t + (g.type === 'comb' ? 1.8 : 1.3) + 0.8 * s.rnd();   // long enough that 3–5 forms overlap
    if (g.type === 'splash') spray(P, g, 10 + ((s.rnd() * 8) | 0));
  }

  function birth(P, spec, t) {
    const s = P.state, W = P._w;
    if (!spec) return null;
    delete s.specs[spec.id];
    let seed = spec.seed | 0;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    // PITCH DECIDES WHERE: a high call grows upward, a low one sideways and down
    const el = (spec.deg - 6) / 4 * 0.9 + (rnd() - 0.5) * 0.4;
    const azm = spec.pan * 1.1 + (rnd() - 0.5) * 0.8 + s.az;   // pan decides left or right, in view
    // flattened toward the picture plane: a form that grows at the lens becomes a wall, not a gesture
    const dir = nrm(rot(nrm([Math.sin(azm - s.az) * Math.cos(el), Math.sin(el), Math.cos(azm - s.az) * Math.cos(el) * 0.3]), [0, 1, 0], s.az));
    const g = { id: spec.id, type: spec.type, n: spec.n, got: 0, target: 0, gr: 0, die: 0, dieAt: 1e9,
                born: t, lastWall: t, alive: true, dir, rnd, slot: null, reach: s.reach };
    const R0 = 0.55 * s.size;
    const o = sc(dir, R0 * 0.85);
    if (spec.type === 'splash') { g.origin = o; s.gest.push(g); return g; }
    // a slot: a free one, or recycle the oldest
    let sl = W.slots.find(x => !x.busy);
    if (!sl) {
      const old = s.gest.filter(x => x.slot).sort((a, b) => a.born - b.born)[0];
      if (old) { old.alive = false; old.slot.busy = null; old.slot.mesh.visible = false; sl = old.slot; old.slot = null; }
    }
    if (!sl) return null;
    sl.busy = g; g.slot = sl; sl.mesh.visible = true;
    const r = rnd();
    const col = spec.type === 'comb' ? (r < 0.5 ? PAL.ice : PAL.pale)
      : spec.type === 'ring' ? (r < 0.45 ? PAL.lilac : r < 0.75 ? PAL.core : PAL.ice)
      : (r < 0.3 ? PAL.pale : r < 0.82 ? PAL.core : PAL.deep);   // mostly the creature's own blue; pale is the accent
    sl.mesh.material.color.setRGB(col[0], col[1], col[2]);
    g.col = col;
    const reach = g.reach;
    if (spec.type === 'sheaf') {
      g.spine = makeSpine(o, dir, reach * (1.5 + 1.0 * rnd()), (rnd() < 0.5 ? -1 : 1) * (0.8 + 1.3 * rnd()), (rnd() - 0.5) * 2.4, rnd);
      g.nS = 5 + ((rnd() * 6) | 0);
      g.gap = 0.07 + 0.07 * rnd();
      g.wid = 0.10 + 0.12 * rnd();          // broad, like petals: the reference's ribbons are as wide as a finger of the core
      g.gd = 0.05 + 0.05 * rnd();
    } else if (spec.type === 'ring') {
      // a hoop above or around the core, tilted so it reads as an ellipse
      // tilted 35–70° off the view axis so it always reads as an ellipse, never a line
      const tl = 0.6 + 0.6 * rnd(), ta = rnd() * 6.283;
      // built facing the camera, then turned by the camera's own orbit
      const ax = nrm(rot([Math.sin(tl) * Math.cos(ta), Math.sin(tl) * Math.sin(ta), Math.cos(tl)], [0, 1, 0], s.az));
      const e1 = nrm(cross(ax, [0, 1, 0.001])), e2 = cross(ax, e1);
      g.ring = { c: add(sc(dir, reach * 0.35 * rnd()), [0, reach * (0.15 + 0.55 * rnd()) * (el > -0.2 ? 1 : -1), 0]),
                 r: reach * (0.55 + 0.45 * rnd()), ax, e1, e2, th0: rnd() * 6.283, turns: 0.95 + 0.25 * rnd(),
                 hoop: rnd() < 0.6, nS: 1 + ((rnd() * 3) | 0), wid: 0.06 + 0.07 * rnd() };
      g.gd = 0.07;
    } else {
      // the comb: an arc of spine with teeth standing off it
      g.spine = makeSpine(o, dir, reach * (0.9 + 0.6 * rnd()), (rnd() < 0.5 ? -1 : 1) * (1.6 + 1.2 * rnd()), (rnd() - 0.5) * 0.8, rnd);
      g.teeth = 16 + ((rnd() * 7) | 0);
      g.tl = reach * (0.22 + 0.18 * rnd());
      g.gd = 0.04;
    }
    s.gest.push(g);
    return g;
  }

  const SA = { p: [0, 0, 0], t: [0, 0, 0], w: [0, 0, 0] };
  function updateGestures(P, dt, t) {
    const s = P.state;
    for (const g of s.gest) {
      if (!g.alive) continue;
      // each note pushes the form out one step: a quick attack toward the new target
      g.gr += (g.target - g.gr) * Math.min(1, dt * (g.type === 'comb' ? 5 : 11));
      if (t > g.dieAt) {
        if (g.die === 0) melt(P, g);
        g.die = Math.min(1, g.die + dt / 0.55);
      }
      if (g.die >= 1 || (g.type === 'splash' && t > g.dieAt)) {
        g.alive = false;
        if (g.slot) { g.slot.busy = null; g.slot.mesh.visible = false; g.slot.g.setDrawRange(0, 0); g.slot = null; }
        continue;
      }
      if (g.slot) buildForm(g, t);
    }
    s.gest = s.gest.filter(x => x.alive);
  }

  /* The form, rebuilt from its spine each frame. Growth runs from the base
     out; melting runs from the base out too (the root lets go first), and
     the ribbons thin as they go. */
  function buildForm(g, t) {
    const sl = g.slot, gr = Math.max(0.001, easeOut(g.gr)), die = g.die;
    const thin = 1 - die * die;
    let ns = 0;
    const wob = Math.sin(t * 2.3 + g.id) * 0.04;
    if (g.type === 'sheaf') {
      const S = g.spine, mid = (g.nS - 1) / 2;
      for (let j = 0; j < g.nS && ns < SMAX; j++, ns++) {
        const off = (j - mid) * g.gap, lift = (j % 2 ? 1 : -1) * 0.012 * j;
        const lenJ = 1 - Math.abs(j - mid) / (g.nS + 1) * 0.6;          // the middle ribbons are longest
        writeStrip(sl, ns, (i, x) => {
          const u = die + (gr * lenJ - die) * x;
          spAt(S, Math.max(0, u), SA);
          const n = cross(SA.t, SA.w);
          const fan = off * (0.25 + 1.4 * u) * (1 + wob);
          E.p[0] = SA.p[0] + SA.w[0] * fan + n[0] * lift * u;
          E.p[1] = SA.p[1] + SA.w[1] * fan + n[1] * lift * u;
          E.p[2] = SA.p[2] + SA.w[2] * fan + n[2] * lift * u;
          E.t[0] = SA.t[0]; E.t[1] = SA.t[1]; E.t[2] = SA.t[2];
          E.w[0] = SA.w[0]; E.w[1] = SA.w[1]; E.w[2] = SA.w[2];
          return g.wid * taper(x) * thin * g.reach;
        }, g.gd, 2.5, 0.22);
      }
    } else if (g.type === 'ring') {
      const R = g.ring;
      for (let j = 0; j < R.nS && ns < SMAX; j++, ns++) {
        const rr = R.r * (1 + j * 0.09), sweep = gr * R.turns * 6.2832;
        writeStrip(sl, ns, (i, x) => {
          const th = R.th0 + j * 0.4 + sweep * (die + (1 - die) * x);
          const c = Math.cos(th), sn = Math.sin(th);
          const rad = [R.e1[0] * c + R.e2[0] * sn, R.e1[1] * c + R.e2[1] * sn, R.e1[2] * c + R.e2[2] * sn];
          const rise = (x - 0.5) * 0.06 * R.r;                 // a slight helix, so the ends pass
          E.p[0] = R.c[0] + rad[0] * rr + R.ax[0] * rise;
          E.p[1] = R.c[1] + rad[1] * rr + R.ax[1] * rise;
          E.p[2] = R.c[2] + rad[2] * rr + R.ax[2] * rise;
          const tg = cross(R.ax, rad);
          E.t[0] = tg[0]; E.t[1] = tg[1]; E.t[2] = tg[2];
          const wv = R.hoop ? R.ax : rad;                      // a hoop, or a flat washer
          E.w[0] = wv[0]; E.w[1] = wv[1]; E.w[2] = wv[2];
          const ends = Math.min(1, x * 12, (1 - x) * 12);
          return R.wid * g.reach * (0.4 + 0.6 * ends) * thin;
        }, g.gd, 2.5, R.hoop ? 0.08 : 0.02);
      }
    } else {
      const S = g.spine;
      // the spine band itself
      writeStrip(sl, ns++, (i, x) => {
        spAt(S, die + (gr - die) * x, SA);
        E.p[0] = SA.p[0]; E.p[1] = SA.p[1]; E.p[2] = SA.p[2];
        E.t[0] = SA.t[0]; E.t[1] = SA.t[1]; E.t[2] = SA.t[2];
        E.w[0] = SA.w[0]; E.w[1] = SA.w[1]; E.w[2] = SA.w[2];
        return 0.075 * g.reach * taper(x) * thin;
      }, 0.03, 1.5, 0.1);
      // the teeth, each growing once the spine has passed it
      for (let k = 0; k < g.teeth && ns < SMAX; k++) {
        const uk = 0.12 + 0.84 * k / (g.teeth - 1);
        const tg = Math.min(1, Math.max(0, (gr - uk) * 7));
        if (tg <= 0 || uk < die) continue;
        spAt(S, uk, SA);
        const b = SA.p.slice(), tt = SA.t.slice(), n = cross(SA.t, SA.w);
        const len = g.tl * (0.7 + 0.3 * Math.sin(k * 0.9)) * tg;
        writeStrip(sl, ns++, (i, x) => {
          const d = x * len;
          E.p[0] = b[0] + n[0] * d + tt[0] * d * d * 0.8 + SA.w[0] * 0;
          E.p[1] = b[1] + n[1] * d + tt[1] * d * d * 0.8;
          E.p[2] = b[2] + n[2] * d + tt[2] * d * d * 0.8;
          E.t[0] = n[0] + tt[0] * d * 1.6; E.t[1] = n[1] + tt[1] * d * 1.6; E.t[2] = n[2] + tt[2] * d * 1.6;
          E.w[0] = tt[0]; E.w[1] = tt[1]; E.w[2] = tt[2];
          return 0.036 * g.reach * (1 - 0.6 * x) * thin;
        }, 0.0, 1, 0.3);
      }
    }
    const per = (PTS - 1) * (ACR - 1) * 6;
    sl.g.setDrawRange(0, ns * per);
    const used = ns * PTS * ACR * 3;
    sl.g.attributes.position.updateRange = { offset: 0, count: used };
    sl.g.attributes.normal.updateRange = { offset: 0, count: used };
    sl.g.attributes.position.needsUpdate = true;
    sl.g.attributes.normal.needsUpdate = true;
  }
  const easeOut = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2.2);

  // ---------------------------------------------------------------- droplets
  function addDrop(P, p, v, size, col, life) {
    const s = P.state, W = P._w;
    if (s.drops.length >= W.MAXD) s.drops.shift();
    s.drops.push({ p: p.slice(), v: v.slice(), size, col, life, age: 0 });
  }
  // a falling call throws clay from the core's surface
  function spray(P, g, n) {
    const s = P.state, rnd = s.rnd, R0 = 0.55 * s.size;
    for (let i = 0; i < n; i++) {
      const d = nrm(add(g.dir, [(rnd() - 0.5) * 1.1, (rnd() - 0.5) * 1.1, (rnd() - 0.5) * 1.1]));
      const sp = (1.4 + 2.2 * rnd()) * g.reach;
      addDrop(P, sc(d, R0 * 0.95), sc(d, sp), (0.012 + 0.04 * Math.pow(rnd(), 3)) * g.reach,
        rnd() < 0.8 ? PAL.core : PAL.pale, 0.7 + 0.7 * rnd());
    }
  }
  // a dying form lets go of beads along its length
  function melt(P, g) {
    const s = P.state, rnd = s.rnd;
    if (!g.slot) return;
    const n = 26;
    const tmp = { p: [0, 0, 0], t: [0, 0, 0], w: [0, 0, 0] };
    for (let i = 0; i < n; i++) {
      let p;
      if (g.spine) { spAt(g.spine, rnd() * Math.max(0.05, g.gr), tmp); p = tmp.p.slice(); }
      else { const R = g.ring, th = R.th0 + rnd() * g.gr * R.turns * 6.2832;
        p = add(R.c, sc(add(sc(R.e1, Math.cos(th)), sc(R.e2, Math.sin(th))), R.r)); }
      const out = nrm(add(p, [(rnd() - 0.5), (rnd() - 0.5), (rnd() - 0.5)]));
      addDrop(P, p, sc(out, 0.3 + 0.7 * rnd()), (0.008 + 0.022 * Math.pow(rnd(), 2)) * g.reach, g.col, 0.5 + 0.6 * rnd());
    }
  }
  function updateDrops(P, dt, t) {
    const s = P.state, W = P._w;
    if (!W) return;
    // a fringe of spray around the core, thicker when the bird is agitated
    if (s.rnd() < dt * (2 + 14 * s.R)) {
      const d = nrm([s.rnd() - 0.5, s.rnd() - 0.5, s.rnd() - 0.5]);
      addDrop(P, sc(d, 0.55 * s.size), sc(d, 0.4 + 0.8 * s.rnd()), 0.012 + 0.02 * s.rnd(), PAL.core, 0.6 + 0.6 * s.rnd());
    }
    const o = W.o3, qv = W.tmpV;
    let n = 0;
    for (const d of s.drops) {
      d.age += dt;
      if (d.age > d.life) continue;
      d.v[1] -= 1.1 * dt;
      const k = Math.exp(-2.2 * dt);
      d.v[0] *= k; d.v[1] *= k; d.v[2] *= k;
      d.p[0] += d.v[0] * dt; d.p[1] += d.v[1] * dt; d.p[2] += d.v[2] * dt;
      const sp = Math.hypot(d.v[0], d.v[1], d.v[2]);
      const shrink = Math.pow(1 - d.age / d.life, 0.7);
      const sz = d.size * shrink;
      o.position.set(d.p[0], d.p[1], d.p[2]);
      qv.set(d.v[0], d.v[1], d.v[2]).normalize();
      if (sp > 1e-4) o.quaternion.setFromUnitVectors(W.qU, qv);
      o.scale.set(sz, sz * (1 + sp * 0.9), sz);    // a bead stretches along its flight: splash, not berries           // a bead stretches along its flight
      o.updateMatrix();
      W.drops.setMatrixAt(n, o.matrix);
      W.col.setRGB(d.col[0], d.col[1], d.col[2]);
      W.drops.setColorAt(n, W.col);
      n++;
    }
    s.drops = s.drops.filter(d => d.age <= d.life);
    W.drops.count = n;
    W.drops.instanceMatrix.needsUpdate = true;
    if (W.drops.instanceColor) W.drops.instanceColor.needsUpdate = true;
  }
})();
