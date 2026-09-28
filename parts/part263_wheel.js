/* ---------- SRC-71 · THE CIRCLE (V1) ----------
   Edson, Sep 25: "The circle has always been the central piece of my AV
   performances, now we have a philosophical base for it."

   THE BASE. Joseph Campbell, *The Power of Myth*, final episode, on the
   symbolism of the circle — the clip Edson brought to this scene. The circle
   is the one figure every culture arrives at on its own: the horizon, the
   wheel, the year, the mandala, the halo. It has no beginning you can point
   at and no end, so a thing that travels it is always both leaving and
   returning. That is the whole scene: ONE POINT GOES ROUND, and everything
   else in the frame is something that point left behind.

   THE RULE THAT ORGANISES EVERY LAYER: nothing in this scene has an origin
   of its own. The trail is where the point HAS BEEN. The florets are shed
   FROM the circle and grow outward from the exact spot on it where they were
   born. The circle's own radius is the only free parameter, and sound owns
   it. If a layer cannot name its point of origin on the circle, it does not
   belong here.

   THE LAYERS, in the order Edson asked for them
   · THE POINT   — one luminous grain travelling the ring. The generator.
   · THE TRAIL   — its own past, a comet of ~700 grains cooling with age.
   · THE CIRCLE  — 2048 grains around θ, and it is ALIVE: the radius at every
                   angle is pushed by the sound. Bass swells the whole wheel,
                   mid and treble ripple standing waves around it, an onset
                   snaps a bright ring through it. Silence still breathes.
   · THE FLOURISH— on the grid, the point SHEDS A SEED where it stands, and a
                   filament grows outward from that spot into a small cloud of
                   florets. Feeds directly from the L-Flower study (SRC-65):
                   birth-time reveal on the GPU, colour as age, and the same
                   per-element scatter depth of field.

   HOW IT IS BUILT — the L-Flower's lesson, applied
   · NOTHING IS REBUILT PER FRAME. Sixteen sprout templates are grown once on
     the CPU in init(). Each floret carries its LOCAL offset and the fraction
     of growth at which it appears. At runtime a sprout is just three numbers
     — angle on the circle, birth time, life — held in a uniform array, so
     shedding a seed costs three float writes and never a buffer rebuild.
     A frame costs the same with sixteen sprouts at 1% as at 100%.
   · DEPTH OF FIELD IS PER ELEMENT, not a post blur. Every grain computes its
     own circle of confusion from its view depth against the focal plane
     (thin lens: coc ∝ A·|1/zf − 1/z|), grows by that many pixels and dims by
     the area it spread over — so an out-of-focus grain becomes a real bokeh
     disc with a bright rim, and the total light is conserved.
   · THE LENS WATCHES THE GENERATOR. Autofocus tracks the travelling point
     through an under-damped spring. Tilt the wheel and the point runs from
     near to far: the focus racks after it, and the far side of the circle
     dissolves into bokeh while the near side stays sharp. The camera is not
     looking at a circle, it is following something that is going round.

   THE HANDS (the Source law — near is less, far is more)
   · LEFT IS THE CAMERA. At the source: dead face-on, a perfect ring, flat and
     hieratic — the mandala. Draw it away and the wheel tilts up and the
     camera comes in, until it is a wheel seen in the sky, deep and elliptical.
   · RIGHT IS THE VELOCITY OF GENERATION. At the source the point barely
     crawls and the wheel is nearly still; draw it away and it races, shedding
     seeds every beat, and the whole thing flourishes.

   Scrim notes: radial composition, which is what survives being sliced across
   segmented drapes. Grains are fattened well past the 8px floor and the
   picture is a full-frame field, not an object in the middle of black. */
(() => {

  /* ---------------- the shared grain shader ----------------
     One vertex/fragment pair draws every layer. `aKind` picks the colour
     ramp and the size law; everything else — the lens, the growth reveal,
     the ring's living radius — is the same maths for all of them. */
  const VS = `
precision highp float;

attribute float aKind;      // 0 ring · 1 trail · 2 the point · 3 floret
attribute float aAng;       // ring: angle on the circle. floret: its sprout's slot
attribute float aAge;       // trail: 0 head .. 1 tail. floret: birth fraction
attribute vec3  aLocal;     // floret: offset from its origin ON the circle
attribute float aSeed;

uniform float uT, uR, uRipA, uRipB, uRipC, uBass, uFlash, uVel;
uniform float uFocus, uAper, uCocMax, uProj, uGain;
uniform vec4  uSprout[16];  // x angle on circle · y born at · z life · w seed

varying float vA, vCoc, vKind, vShade;

// the living radius of the wheel at angle a — the ONE free parameter, and
// sound owns it. Three standing waves so the ring never reads as a sine.
float ringR(float a){
  float r = uR * (1.0 + 0.085 * uBass);
  r += uR * uRipA * 0.055 * sin(a *  3.0 - uT * 0.7);
  r += uR * uRipB * 0.042 * sin(a *  7.0 + uT * 1.1);
  r += uR * uRipC * 0.026 * sin(a * 13.0 - uT * 1.9);
  r += uR * 0.012 * sin(a * 2.0 + uT * 0.23);          // it breathes in silence
  return r;
}

void main(){
  vKind = aKind;
  vec3 p;
  float size = 1.0, bright = 1.0;

  if (aKind < 0.5) {                      // ---- THE CIRCLE
    float r = ringR(aAng);
    p = vec3(cos(aAng) * r, sin(aAng) * r, 0.0);
    // the grain brightens where the wheel is pushed furthest out: hue comes
    // from the FORM, never from where it sits on screen
    vShade = clamp((r / uR - 1.0) * 5.0 + 0.5, 0.0, 1.0);
    // the rim is a FILAMENT, not a band: 2048 grains over ~3600px of
    // circumference overlap about eight deep, so each one carries an eighth
    // of the light or the wheel renders as a solid white slab (it did)
    // ~9.5px on the wall: the scrim's mesh swallows anything thinner
    size = 1.30 + 0.70 * uFlash;
    bright = 0.13 + 0.17 * vShade + 0.42 * uFlash;
    bright *= 0.88 + 0.12 * sin(aAng * 5.0 + uT * 0.4);   // alive even in silence

  } else if (aKind < 1.5) {               // ---- THE TRAIL (positions from CPU)
    p = position;
    vShade = aAge;
    size = 1.9 * (1.0 - 0.62 * aAge);
    bright = pow(1.0 - aAge, 1.7) * (0.30 + 0.5 * uVel);

  } else if (aKind < 2.5) {               // ---- THE POINT
    p = position;
    vShade = 0.0;
    size = 3.4; bright = 2.0;

  } else {                                // ---- THE FLOURISH
    vec4 S = uSprout[int(aAng)];
    float life = max(S.z, 0.001);
    float g = clamp((uT - S.y) / life, 0.0, 1.0);       // this sprout's growth
    if (S.y < -9000.0 || g <= aAge) {                   // not shed, or not born yet
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return;
    }
    float age = (g - aAge) / max(1.0 - aAge, 0.001);    // 0 just born .. 1 old
    // the origin is a point ON the circle, and the sprout grows OUTWARD from it
    vec3 o = vec3(cos(S.x) * ringR(S.x), sin(S.x) * ringR(S.x), 0.0);
    vec3 rad = normalize(vec3(o.xy, 0.0001));
    vec3 tan3 = vec3(-rad.y, rad.x, 0.0);
    float ease = 1.0 - pow(1.0 - age, 2.6);             // it decelerates as it opens
    p = o + (rad * aLocal.x + tan3 * aLocal.y + vec3(0.0, 0.0, aLocal.z)) * ease;
    vShade = age;
    size = 1.15 + 1.5 * (1.0 - pow(1.0 - age, 6.0));
    // a floret flashes as it is born, then settles — Hoopert's pop, kept
    bright = 0.40 * (1.0 - 0.45 * age) * (1.0 + 2.2 * exp(-age * 26.0));
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float z = max(-mv.z, 0.05);

  // thin lens: how far this grain is from the focal plane, in pixels
  float coc = min(uAper * abs(1.0 / uFocus - 1.0 / z) * uProj, uCocMax);
  float base = size * uProj / z * 0.016;
  float px = base + coc;
  gl_PointSize = max(px, 1.0);
  vCoc = coc / max(px, 1.0);                       // 0 sharp .. ~1 pure bokeh
  // spreading over a bigger disc must not create light: dim by the area
  vA = bright * uGain * (base * base) / (px * px);

  gl_Position = projectionMatrix * mv;
}`;

  const FS = `
precision highp float;
varying float vA, vCoc, vKind, vShade;

// the palettes. Measured off the L-Flower study for the florets — the same
// bud-green → cream → pink → lilac → blue drift, which is what growing old
// looks like in that reference.
vec3 floretCol(float a){
  vec3 c = mix(vec3(0.72, 0.93, 0.62), vec3(1.00, 0.96, 0.86), smoothstep(0.00, 0.16, a));
  c = mix(c, vec3(0.96, 0.66, 0.72), smoothstep(0.14, 0.44, a));
  c = mix(c, vec3(0.72, 0.56, 0.86), smoothstep(0.40, 0.72, a));
  c = mix(c, vec3(0.42, 0.55, 0.95), smoothstep(0.66, 1.00, a));
  return c;
}

void main(){
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d) * 2.0;
  if (r > 1.0) discard;

  // SHARP grain: a soft core. BOKEH grain: a flat disc with a bright rim,
  // which is what an out-of-focus highlight actually looks like through a
  // real iris — and the single reason defocus reads as a LENS and not a blur.
  float sharp = exp(-r * r * 3.4);
  float disc  = smoothstep(1.0, 0.86, r) * (0.62 + 0.75 * smoothstep(0.55, 0.99, r));
  float a = mix(sharp, disc, clamp(vCoc * 1.5, 0.0, 1.0));

  vec3 c;
  if (vKind < 0.5)      c = mix(vec3(0.82, 0.86, 1.00), vec3(1.00, 0.93, 0.80), vShade);
  else if (vKind < 1.5) c = mix(vec3(1.00, 0.88, 0.74), vec3(0.30, 0.42, 0.90), pow(vShade, 0.8));
  else if (vKind < 2.5) c = vec3(1.0);
  else                  c = floretCol(vShade);

  gl_FragColor = vec4(c * vA * a, 1.0);
}`;

  /* the lens pass: exposure, a little radial chroma, halation and a vignette.
     The global 2D fx.bloom stays off — this scene owns its own light. */
  const LENS = {
    uniforms: { tDiffuse: { value: null }, uExp: { value: 1.0 }, uT: { value: 0 },
                uCA: { value: 1.0 }, uVig: { value: 1.0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse; uniform float uExp, uT, uCA, uVig;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 c = vUv - 0.5;
  float rr = dot(c, c);
  // chroma grows with radius, the way a real lens misbehaves at the edge
  float k = 0.0022 * uCA * rr;
  vec3 col = vec3(
    texture2D(tDiffuse, vUv + c * k).r,
    texture2D(tDiffuse, vUv).g,
    texture2D(tDiffuse, vUv - c * k).b);
  col = vec3(1.0) - exp(-col * uExp);                  // exposure, not a clip
  col *= mix(1.0, 1.0 - rr * 1.05, uVig);              // vignette
  col += (h21(vUv * vec2(1731.0, 977.0) + fract(uT) * 61.0) - 0.5) * (1.6 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}`
  };

  /* ---------------- the sprout templates, grown once ----------------
     A filament that climbs outward from the circle, forking as it goes, with
     a cluster of florets at every tip. Local coords: x outward from the
     circle, y along it, z out of the plane. */
  const SLOTS = 16, PER = 460;
  function growTemplates(rnd) {
    const T = [];
    for (let s = 0; s < SLOTS; s++) {
      const pts = [];
      const stalk = 0.19 + rnd() * 0.10;
      // the spine
      const segs = 16;
      for (let i = 0; i < segs; i++) {
        const f = i / segs;
        pts.push({ x: stalk * f, y: (rnd() - 0.5) * 0.02 * f, z: (rnd() - 0.5) * 0.03 * f, b: f * 0.34 });
      }
      // laterals, forking dichotomously — the L-system idea, kept cheap
      const arms = 5 + (rnd() * 3 | 0);
      for (let a = 0; a < arms; a++) {
        const base = 0.35 + 0.62 * (a / arms);
        const side = a % 2 ? 1 : -1;
        const spread = (0.30 + rnd() * 0.42) * side;
        const lift = (rnd() - 0.5) * 0.5;
        const len = 0.11 + rnd() * 0.14;
        const n = 9;
        for (let i = 1; i <= n; i++) {
          const f = i / n;
          pts.push({ x: stalk * base + len * f, y: spread * len * f * f, z: lift * len * f * f,
                     b: base * 0.34 + f * 0.30 });
        }
        // the floret cluster at the tip
        const tipx = stalk * base + len, tipy = spread * len, tipz = lift * len;
        const cl = 26 + (rnd() * 14 | 0);
        for (let i = 0; i < cl; i++) {
          const u = rnd() * Math.PI * 2, v = Math.acos(2 * rnd() - 1);
          const rr = 0.032 + Math.pow(rnd(), 0.6) * 0.072;
          pts.push({ x: tipx + rr * Math.sin(v) * Math.cos(u),
                     y: tipy + rr * Math.sin(v) * Math.sin(u),
                     z: tipz + rr * Math.cos(v) * 0.75,
                     b: base * 0.34 + 0.30 + rnd() * 0.32 });
        }
      }
      // pad or trim so every slot is exactly PER points and the buffer is flat
      while (pts.length < PER) { const q = pts[(rnd() * pts.length) | 0]; pts.push({ x: q.x, y: q.y, z: q.z, b: Math.min(1, q.b + rnd() * 0.08) }); }
      T.push(pts.slice(0, PER));
    }
    return T;
  }

  const RING_N = 2048, TRAIL_N = 2048;
  /* One grain every STEP radians, and the history falls inward by PULL_STEP
     PER GRAIN rather than per second. That makes the comet a true logarithmic
     spiral whose SHAPE is identical at a crawl and at full speed — only how
     fast it is drawn changes. Pulling per second instead tied the shape to
     the hand: slow, and the trail collapsed into the centre right behind the
     point; fast, and it barely left the rim. 2048 grains × 0.0075 rad is
     about two and a half turns, which is what fills the middle of the frame. */
  const STEP = 0.0075, PULL_STEP = 0.99877;

  reg({
    id: 'SRC-71', family: 'SRC-71', ver: 1,
    title: 'The Circle',
    tech: 'WEBGL / ONE GENERATOR · GPU GROWTH FROM THE RIM · SCATTER DEPTH OF FIELD',
    tags: ['CIRCLE', 'WEBGL', 'DEPTH OF FIELD', 'BOKEH', 'AUDIO REACTIVE', 'AFTER CAMPBELL'],
    audioIn: true,
    desc: 'One luminous point travels a circle, and everything else in the frame is something that point left behind. Its own past cools behind it as a comet. The circle it runs on is alive — the sound pushes its radius at every angle, so the wheel swells on bass, ripples with standing waves on mid and treble, and a hit snaps a bright ring through it. On the grid the point sheds a seed where it stands, and a filament climbs outward from that exact spot on the rim into a small cloud of florets whose colour drifts with age from bud green through cream, pink and lilac to blue. Everything is seen through a real lens: each grain blurs by its own distance from the focal plane, so the far side of the wheel dissolves into bokeh discs while the near side stays sharp — and the focus is not fixed, it hunts the travelling point through a spring, racking round the wheel as the point runs from near to far. After Joseph Campbell, on the circle as the one figure every culture arrives at by itself.',
    interact: 'Near = less, far = more, both hands. LEFT HAND IS THE CAMERA: at the source the wheel is dead face-on, a flat perfect ring; draw it away and it tilts up and the camera travels in, until it is a wheel hanging in the sky, deep and elliptical, with the far rim thrown into bokeh. RIGHT HAND IS THE VELOCITY OF GENERATION: at the source the point barely crawls and the wheel is nearly still; draw it away and it races, shedding a seed every beat, and the whole rim flourishes at once.',
    sound: 'This scene LISTENS. Bass swells the whole wheel, mid and treble ripple standing waves around its rim, and an onset snaps a bright ring through it and brightens every grain. With nothing playing it still breathes, slowly, so it is never truly still.',

    init(P) {
      const s = {
        noGL: typeof THREE === 'undefined' || !THREE.EffectComposer || !THREE.UnrealBloomPass,
        phi: 0, vel: 0.22, tilt: 0.04, dist: 3.55, az: 0,
        focus: 3.55, focusV: 0, primed: false,
        bass: 0, mid: 0, treble: 0, level: 0, flash: 0, prevOnset: 0,
        pres: 0, shedAt: 0, slot: 0, tSec: 0, acc: 0,
        trail: new Float32Array(TRAIL_N * 3), head: 0, filled: 0
      };
      P.state = s;
      if (s.noGL) return;

      if (P._w) { try { P._w.composer.dispose && P._w.composer.dispose(); P._w.renderer.dispose(); } catch (e) {} }
      const W = {}; P._w = W;
      const sc = Math.min(1, 1600 / Math.max(P.w, P.h));
      W.rw = Math.max(2, Math.round(P.w * sc));
      W.rh = Math.max(2, Math.round(P.h * sc));

      const r = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      r.setPixelRatio(1); r.setSize(W.rw, W.rh, false); r.setClearColor(0x000000, 1);
      W.renderer = r;
      W.scene = new THREE.Scene();
      const FOV = 34;
      W.cam = new THREE.PerspectiveCamera(FOV, W.rw / W.rh, 0.05, 60);

      W.uniforms = {
        uT: { value: 0 }, uR: { value: 1.0 },
        uRipA: { value: 0 }, uRipB: { value: 0 }, uRipC: { value: 0 },
        uBass: { value: 0 }, uFlash: { value: 0 }, uVel: { value: 0 },
        uFocus: { value: 3.55 }, uAper: { value: 0.040 }, uCocMax: { value: 34 },
        uProj: { value: W.rh / (2 * Math.tan(FOV * Math.PI / 360)) },
        uGain: { value: 1 },
        uSprout: { value: Array.from({ length: SLOTS }, () => new THREE.Vector4(0, -99999, 1, 0)) }
      };
      const mat = () => new THREE.ShaderMaterial({
        uniforms: W.uniforms, vertexShader: VS, fragmentShader: FS,
        transparent: true, depthTest: false, depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      W.mat = mat();

      const mk = (n, kind, fill) => {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(n * 3), kk = new Float32Array(n),
              ang = new Float32Array(n), age = new Float32Array(n),
              loc = new Float32Array(n * 3), sd = new Float32Array(n);
        kk.fill(kind);
        fill && fill({ pos, ang, age, loc, sd, n });
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aKind', new THREE.BufferAttribute(kk, 1));
        g.setAttribute('aAng', new THREE.BufferAttribute(ang, 1));
        g.setAttribute('aAge', new THREE.BufferAttribute(age, 1));
        g.setAttribute('aLocal', new THREE.BufferAttribute(loc, 3));
        g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
        const pts = new THREE.Points(g, W.mat);
        pts.frustumCulled = false;
        W.scene.add(pts);
        return { g, pos };
      };

      // THE CIRCLE — the radius is computed on the GPU, so this never updates
      mk(RING_N, 0, ({ ang, sd, n }) => {
        for (let i = 0; i < n; i++) { ang[i] = i / n * Math.PI * 2; sd[i] = Math.random(); }
      });
      // THE TRAIL — CPU writes positions, one small upload a frame
      W.trail = mk(TRAIL_N, 1, ({ age, n }) => { for (let i = 0; i < n; i++) age[i] = i / n; });
      // THE POINT
      W.point = mk(1, 2, null);
      // THE FLOURISH — sixteen slots of one template each, revealed on the GPU
      let seed = 1;
      const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      const TPL = growTemplates(rnd);
      mk(SLOTS * PER, 3, ({ ang, age, loc, sd, n }) => {
        for (let k = 0; k < SLOTS; k++) {
          for (let i = 0; i < PER; i++) {
            const j = k * PER + i, q = TPL[k][i];
            ang[j] = k;                       // which sprout slot this floret belongs to
            age[j] = q.b;                     // the growth fraction at which it appears
            loc[j * 3] = q.x; loc[j * 3 + 1] = q.y; loc[j * 3 + 2] = q.z;
            sd[j] = rnd();
          }
        }
      });

      const comp = new THREE.EffectComposer(r, new THREE.WebGLRenderTarget(W.rw, W.rh, {
        type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false }));
      comp.addPass(new THREE.RenderPass(W.scene, W.cam));
      const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(W.rw, W.rh), 0.40, 0.70, 0.02);
      comp.addPass(bloom);
      const lens = new THREE.ShaderPass(LENS);
      lens.renderToScreen = true;
      comp.addPass(lens);
      W.composer = comp; W.bloom = bloom; W.lens = lens;
    },

    step(P, dt, t, inp) {
      const s = P.state;
      s.tSec = t;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

      // ---- the hands. Source law: distance is power.
      const L = SOURCE(inp.L), R = SOURCE(inp.R);
      // LEFT: the camera. Face-on and flat at the source, tilted and close out wide.
      const wantTilt = 0.04 + L * 1.24;
      // the wheel must still FIT at full tilt: a unit circle at distance d
      // is uProj/d pixels across, and 2.9 keeps it inside 1920 with margin
      const wantDist = 3.55 - L * 0.68;
      s.tilt += (wantTilt - s.tilt) * Math.min(1, dt * 6);
      s.dist += (wantDist - s.dist) * Math.min(1, dt * 6);
      // RIGHT: the velocity of generation.
      const wantVel = 0.10 + R * 3.0;
      s.vel += (wantVel - s.vel) * Math.min(1, dt * 6.5);
      s.phi += s.vel * dt;
      s.az += dt * 0.035;                       // a slow drift, so it is never a still image

      // ---- the sound. Bands are engine-smoothed; ease them like a hand.
      const a = inp.audio;
      if (a) {
        s.bass += (a.bass - s.bass) * Math.min(1, dt * 6);
        s.mid += (a.mid - s.mid) * Math.min(1, dt * 6);
        s.treble += (a.treble - s.treble) * Math.min(1, dt * 6);
        s.level += (a.level - s.level) * Math.min(1, dt * 6);
        // onset is raw: take the RISING edge, or this fires every frame it stays high
        if (a.onset > 0.7 && s.prevOnset <= 0.7) s.flash = 1;
        s.prevOnset = a.onset;
      }
      s.flash *= Math.exp(-dt * 6.5);

      if (s.noGL) return;
      const W = P._w, u = W.uniforms;

      // ---- the trail: where the point has been
      const rNow = ringRadiusJS(s, s.phi);
      const px = Math.cos(s.phi) * rNow, py = Math.sin(s.phi) * rNow;
      const T = s.trail;
      /* THE PAST FALLS INWARD. Laid down exactly on the rim, the trail is
         invisible — it IS the circle, drawn twice. So what the point sheds
         drifts toward the centre as it ages while the florets climb outward,
         and the circle becomes the membrane between the two. It also gives
         the middle of the frame something to hold; face-on it was a large
         dead black disc. */
      // (the per-grain pull is applied below, k grains' worth per frame)
      /* PRIME THE TRAIL. A Float32Array starts at zero, so on the first frame
         all 700 grains sit at the origin — 700 coincident additive points read
         as one hard white dot pinned to the centre of the wheel, which is
         exactly what the first shots showed. Seed the whole history with the
         point's own starting position instead: the comet then starts as a
         single grain and lengthens honestly. */
      if (!s.primed) {
        s.primed = true;
        for (let i = 0; i < TRAIL_N; i++) { T[i * 3] = px; T[i * 3 + 1] = py; T[i * 3 + 2] = 0; }
      }
      /* SAMPLE BY ARC LENGTH, NOT BY FRAME. One grain per frame means the
         comet's grain spacing is a function of frame rate and hand speed: at
         a slow crawl it is a solid rod, and at speed — or on a machine
         rendering at 20fps instead of 60 — it breaks into a dotted line. The
         first shots showed exactly that. Emitting one grain every fixed
         number of radians makes the trail look the same on any machine and
         at any velocity, which is the only version that can be trusted on an
         unfamiliar projector on the night. */
      s.acc += s.vel * dt;
      let k = Math.floor(s.acc / STEP);
      if (k > 0) {
        s.acc -= k * STEP;
        k = Math.min(k, TRAIL_N);                  // a huge dt must not walk off the end
        for (let i = TRAIL_N - 1; i >= k; i--) {
          const d = i * 3, o3 = (i - k) * 3;
          T[d] = T[o3]; T[d + 1] = T[o3 + 1]; T[d + 2] = T[o3 + 2];
        }
        // the k new grains, laid along the arc actually travelled this frame
        for (let j = 0; j < k; j++) {
          const a2 = s.phi - j * STEP;
          const r2 = ringRadiusJS(s, a2);
          T[j * 3] = Math.cos(a2) * r2; T[j * 3 + 1] = Math.sin(a2) * r2; T[j * 3 + 2] = 0;
        }
      }
      // k grains were emitted this frame, so the history falls inward by
      // exactly k steps — no more, no less, whatever the frame rate was
      if (k > 0) {
        const PULL = Math.pow(PULL_STEP, k);
        const LIFT = k * 0.00004;
        for (let i = k; i < TRAIL_N; i++) {
          const d = i * 3;
          T[d] *= PULL; T[d + 1] *= PULL;
          T[d + 2] = T[d + 2] * PULL + (i / TRAIL_N) * LIFT;      // and a little out of plane
        }
      }
      W.trail.pos.set(T);
      W.trail.g.attributes.position.needsUpdate = true;
      W.point.pos[0] = px; W.point.pos[1] = py; W.point.pos[2] = 0;
      W.point.g.attributes.position.needsUpdate = true;

      // ---- shedding a seed. On the grid when there is a grid, else on our own
      // clock; faster hands shed faster, which is what "velocity of generation"
      // has to mean if the flourish is to be part of the same gesture.
      const every = Math.max(0.28, 1.35 - s.vel * 0.33);
      if (t - s.shedAt > every) {
        s.shedAt = t;
        const sl = s.slot % SLOTS; s.slot++;
        u.uSprout.value[sl].set(s.phi, t, 5.5 + (sl % 5) * 0.8, sl / SLOTS);
      }

      // ---- the camera, and the lens that hunts the point
      const ct = Math.cos(s.tilt), st = Math.sin(s.tilt);
      W.cam.position.set(s.dist * st * Math.cos(s.az), s.dist * st * Math.sin(s.az), s.dist * ct);
      W.cam.up.set(0, 0, 1);
      W.cam.lookAt(0, 0, 0);
      // AUTOFOCUS on the generator, through an under-damped spring: move fast
      // and the lens overshoots and hunts before it settles, the way glass does
      const want = W.cam.position.distanceTo(new THREE.Vector3(px, py, 0));
      const SPR = 26, DAMP = 6.2;
      s.focusV += ((want - s.focus) * SPR - s.focusV * DAMP) * dt;
      s.focus += s.focusV * dt;

      u.uT.value = t;
      u.uBass.value = s.bass; u.uRipA.value = s.mid; u.uRipB.value = s.treble;
      u.uRipC.value = s.level; u.uFlash.value = s.flash; u.uVel.value = Math.min(1, s.vel / 3);
      u.uFocus.value = Math.max(0.4, s.focus);
      // wide open when the wheel is tilted: that is when there is depth to lose
      u.uAper.value = 0.022 + 0.034 * Math.min(1, s.tilt / 1.3);
      u.uGain.value = 0.58 + 0.34 * s.level;
      W.lens.uniforms.uT.value = t;
      W.lens.uniforms.uExp.value = 0.95 + 0.35 * s.level;
      W.lens.uniforms.uCA.value = 0.6 + 1.5 * Math.min(1, s.tilt / 1.3);
      W.bloom.strength = 0.40 + 0.34 * s.level + 0.34 * s.flash;
    },

    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) {
        if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
        g.fillStyle = 'rgba(220,220,230,0.75)';
        g.font = `${Math.round(13 * (h / 1200))}px ui-monospace,monospace`;
        g.fillText('THE CIRCLE needs WebGL + the three.js post stack', 24, h / 2);
        return;
      }
      const W = P._w;
      W.composer.render();
      g.save();
      // hosted in a mixer: add our light to what is already there, never wipe it
      g.globalCompositeOperation = P.hosted ? 'lighter' : 'copy';
      g.drawImage(W.renderer.domElement, 0, 0, W.rw, W.rh, 0, 0, w, h);
      g.restore();

      if (!P.hosted && typeof OWPERF === 'function' && !OWPERF()) {
        const ms = h / 1200;
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText('TILT ' + Math.round(s.tilt / 1.35 * 100) + '   VEL ' + s.vel.toFixed(2)
          + '   FOCUS ' + s.focus.toFixed(2) + '   BASS ' + Math.round(s.bass * 100), 10, h - 10);
      }
    }
  });

  // the same living radius the shader uses, for the CPU side (the trail and
  // the focus have to agree with the picture or the lens hunts the wrong place)
  function ringRadiusJS(s, a) {
    const t = s.tSec, R = 1.0;
    let r = R * (1 + 0.085 * s.bass);
    r += R * s.mid * 0.055 * Math.sin(a * 3 - t * 0.7);
    r += R * s.treble * 0.042 * Math.sin(a * 7 + t * 1.1);
    r += R * s.level * 0.026 * Math.sin(a * 13 - t * 1.9);
    r += R * 0.012 * Math.sin(a * 2 + t * 0.23);
    return r;
  }
})();
