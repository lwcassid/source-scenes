/* ---------- SRC-80.3 · LEARNING: CABLES SPHERE (V3) — the colour knobs ARE the palette ----------
   Sep 27, 2026 (PLAN-PALETTE, decision 1, Edson 14:49: "YES, one system").
   V2 kept its two colours as macro values of its own; V3 declares them as
   the palette's generators — COLOR A is c0, COLOR B is c1 — and the macros
   are BOUND to them (`pal: 'hue0'`, `pal: 'hue1'`): the knob, the PALETTE
   panel's dot and REMOTE all move the same slot, through PAL.set. AUTO-MAP
   still lands COLOR A / COLOR B / ADD B on 13 / 14 / 15, exactly as V2.
   The knob's middle is the declared colour, a full turn of hue end to end;
   pick any colour on the panel and the knob rotates from there.
   The sphere reads the HUE of c0 / c1 (the ramp shape stays the patch's own:
   black, the deep stop, a paler stop a tenth of a turn on) and eases to it
   the short way round the wheel. Everything else is V2. */
/* (V2's header, kept) ---------- SRC-80.2 · LEARNING: CABLES SPHERE (V2) — V1's file, plus the colour knobs ----------
   A learning study, Sep 27 2026. Edson: "This is a learning session to
   understand the possibilities of the tool. We will try to make a graph as
   much as possible like this one, and make it react to sound and instrument."

   THE REFERENCE. cables.gl patch RklgDb ("Leo's patches", danielo246, Feb
   2026, CC0): a soft sphere whose surface is a slow, folded, two-colour
   liquid — blue/teal and orange/cream — with a bright crescent on the
   upper-right rim, a dark bite at the upper-left, and a focus that wanders
   across it. We pulled the public patch JSON (86 ops) and every op's shader,
   and rebuilt the graph as ONE scene. What follows is the reading.

   THERE IS NO SPHERE. The patch is a 2D image-compose chain, all fullscreen
   passes in square float buffers. The "sphere" is three tricks stacked:
   1. A HARD DISC MASK (CircleTexture, radius 0.8 of the half-height).
   2. A LENS MADE OF THE SAME DISC, inverted and blurred, used as a pixel
      displacement (luminance, +x +y, clamp). Inside the disc the map is
      black and nothing moves; across the blurred rim the luminance ramps
      0→1 and the picture is DRAGGED towards the upper-right corner and
      clamped. That drag is the whole refraction: the crescent, the bite.
   3. A BLUR WITH A WANDERING MASK. Each colour layer is blurred hard and
      the blur amount is multiplied by a slow one-octave simplex, so some of
      the sphere is sharp and some is soft, and the soft patches move. The
      disc's ALPHA is blurred with it, so the rim goes soft where the picture
      does. Depth of field with no depth at all.

   TWO COLOUR LAYERS, SCREENED. A: simplex (2 octaves) through a black →
   deep-blue → teal ramp. B: simplex (4 octaves, brightness breathing on a
   0.5 Hz sine) through a black → orange-red → cream ramp. Each is displaced
   first by a DISP field, then by the lens, then masked, then blurred; A is
   hue-shifted, B is screened over it; then chromatic aberration and a sparse
   RGB grain.

   THE DISP FIELD IS OVERDRIVEN ON PURPOSE. Five octaves, smoothness 11.29
   (which multiplies the amplitude), scale 0.11. Its values run to about ±6,
   and PixelDisplacement with MIRROR wrap folds those huge offsets back and
   forth: the ribbons and streaks are mirror folds of a displacement far
   beyond the frame. That is the "waves".

   HOW WE BUILT IT. Everything upstream of the blur is procedural, so the two
   displacement passes and the colour map collapse into ONE pass per layer:
   colour(noise(mirror(uv1 + disp(uv1)·amt))) with uv1 = clamp(uv + lens(uv)).
   The lens map is analytic (a smoothstep ring, which is what a blurred disc
   is). Then three separable masked blur passes and one final pass at the
   frame. Six passes, square buffers of min(1024, frame height).

   THE HANDS (the Source law — near is less, far is more). The reference has
   none; these are ours.
   · LEFT IS SIZE AND DEPTH. At the source: a small, FLAT disc — the lens is
     off and it is a 2D picture. Draw it away and it grows to fill the height
     and the lens rim appears: a thing that looked 2D turns out to live in a
     space (Edson, Sep 26).
   · RIGHT IS THE STORM. Flow speed, displacement amounts, and the audio
     sensitivity (a gamma on the level).
   THE SOUND (it listens; no voice of its own this round). Level → the
   reference's own Ease curve → finer features in B, tighter folds, and the
   focus pattern re-dealt. Bass swells the disc. A kick re-deals the focus
   at once and lifts the light: quick attack, ~1 s release. Treble widens
   the chromatic aberration. */
/* ---------- V2 (Sep 27, 03:52) — THE COLOUR IS ON THE TWISTER ----------
   Edson: "now use some twister controls to control colour. We can have 2
   colors with 3 knobs. If I move only one, it stays mostly on that color; if
   I move the other one also, it adds the new color."
   Three knobs, declared by the scene itself (`macros:`) and laid out by
   AUTO-MAP on 13 / 14 / 15:
   · COLOR A — the hue of the base layer (the whole sphere sits in it)
   · COLOR B — the hue of the second layer
   · ADD B   — how much of B is screened over A. At zero the sphere is A
               alone, whatever COLOR B says; raise it and B arrives.
   Each hue becomes the patch's own ramp shape — black, then the deep
   saturated stop, then a paler stop whose hue drifts a tenth of a turn —
   so the two colours keep the reference's character at any hue. The knobs
   hold where you leave them (P.state.macro), and the defaults are the
   reference's blue and orange with B silent. */
(() => {
  const S_MAX = 1024;
  const MACROS = [
    // bound to the palette: the middle = the declared colour (V2's 0.64 and 0.05)
    { k: 'hueA', label: 'COLOR A', def: 0.5, pal: 'hue0' },
    { k: 'hueB', label: 'COLOR B', def: 0.5, pal: 'hue1' },
    { k: 'mixB', label: 'ADD B',   def: 0.0 }
  ];
  // hsv → rgb, for building the ramps on the CPU each frame
  const hsv = (h, s, v) => { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i;
    const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, q, p]][i % 6]; };
  // the reference's ramp shape, in any hue: black · black · deep · pale-drifted
  // a hue as the ramp's deep stop, for the palette declaration
  const DEEPHEX = h => '#' + hsv(h, 0.93, 0.72).map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
  const rampFor = (h, cut, deepAt) => {
    const deep = hsv(h, 0.93, 0.72), pale = hsv(h + 0.09, 0.58, 0.97);
    return [[0, 0, 0, 0], [0, 0, 0, cut], [deep[0], deep[1], deep[2], deepAt], [pale[0], pale[1], pale[2], 1.0]];
  };

  // ---------- shared GLSL ----------
  const NOISE = `
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
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
}
// cables' SimplexNoise_v2, as read from the op: p = (uv-0.5)*scale + 0.5 - off,
// v = n*0.5+0.5, octaves at x2.3 x4.2 x8.1 x16.7 weighted .5 .25 .125 .0625
// (NOT centred, so v runs past 1), and smoothness MULTIPLIES the amplitude.
float cn(vec2 uv, float scale, vec2 off, float time, float harm, float sm){
  vec2 p = (uv - 0.5) * scale + 0.5 - off;
  vec3 q = vec3(p, time);
  float v = snoise(q) * sm * 0.5 + 0.5;
  if (harm >= 2.0) v += snoise(q * 2.3) * sm * 0.5;
  if (harm >= 3.0) v += snoise(q * 4.2) * sm * 0.25;
  if (harm >= 4.0) v += snoise(q * 8.1) * sm * 0.125;
  if (harm >= 5.0) v += snoise(q * 16.7) * sm * 0.0625;
  return v;
}
// PixelDisplacement's MIRROR wrap, verbatim
float mirr(float x){ float m = mod(x, 2.0); return abs(floor(m) - fract(m)); }
`;

  const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

  /* ---- one colour layer: noise → ramp → DISP displacement → LENS → disc.
     uKeys: four ramp stops (pos in .w, rgb in .xyz), smoothstepped like
     cables' GradientTexture with Smoothstep on. */
  const LAYER_FS = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uTDisp, uScale, uHarm, uSmooth, uDispScale, uBright;
uniform vec2  uOff, uDispAmt;
uniform float uR, uLens, uLensW, uDbg;
uniform vec4  uK0, uK1, uK2, uK3;
${NOISE}
vec3 ramp(float v){
  v = clamp(v, 0.0, 1.0);
  if (v <= uK1.w) return mix(uK0.xyz, uK1.xyz, smoothstep(uK0.w, uK1.w, v));
  if (v <= uK2.w) return mix(uK1.xyz, uK2.xyz, smoothstep(uK1.w, uK2.w, v));
  return mix(uK2.xyz, uK3.xyz, smoothstep(uK2.w, uK3.w, v));
}
void main(){
  vec2 uv = vUv;
  float d = length((uv - 0.5) * 2.0);
  // THE LENS: the blurred, inverted disc. Black inside, ramping to white
  // across the rim, and the picture is dragged +x +y by that much, clamped.
  float lens = smoothstep(uR - uLensW, uR + uLensW, d) * uLens;
  vec2 uv1 = clamp(uv + vec2(lens), 0.0, 1.0);
  // THE FOLDS: the overdriven DISP field, mirror-wrapped
  float disp = cn(uv1, uDispScale, vec2(0.0), uTDisp, 5.0, 11.29);
  vec2 uv2 = vec2(mirr(uv1.x + disp * uDispAmt.x), mirr(uv1.y + disp * uDispAmt.y));
  float v = cn(uv2, uScale, uOff, uTime, uHarm, uSmooth) * uBright;
  vec3 col = ramp(v);
  // THE DISC, hard-edged, at the ORIGINAL uv: the mask comes after the lens
  float a = d < uR ? 1.0 : 0.0;
  if (uDbg > 0.5 && uDbg < 1.5) col = vec3(0.5 + disp / 12.0);
  if (uDbg > 1.5 && uDbg < 2.5) col = vec3(uv2, 0.0);
  if (uDbg > 2.5) col = vec3(clamp(v, 0.0, 1.0));
  gl_FragColor = vec4(col, a);
}`;

  /* ---- cables' Blur, verbatim in spirit: 41 taps on a triangle kernel with
     a per-pixel random phase, premultiplied, amount × a noise MASK. */
  const BLUR_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uDir;
uniform float uAmount, uMaskT, uMaskScale;
uniform vec2  uMaskOff;
${NOISE}
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  float m = cn(vUv, uMaskScale, uMaskOff, uMaskT, 1.0, 1.5);
  float am = uAmount * m;
  if (am <= 0.02) { gl_FragColor = texture2D(uTex, vUv); return; }
  vec2 delta = uDir * am * 0.01;
  float offset = rnd(vUv * 1000.0);
  vec4 color = vec4(0.0); float total = 0.0;
  for (float t = -20.0; t <= 20.0; t += 1.0) {
    float pc = (t + offset - 0.5) / 20.0;
    float w = 1.0 - abs(pc);
    vec4 s = texture2D(uTex, vUv + delta * pc);
    s.rgb *= s.a;
    color += s * w; total += w;
  }
  color /= total;
  color.rgb /= color.a + 0.00001;
  gl_FragColor = color;
}`;

  /* ---- the final pass at the frame: A hue-shifted, B screened over it,
     chromatic aberration (smooth, 3 samples), sparse RGB grain overlay. */
  const FINAL_FS = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uA, uB;
uniform float uAsp, uHue, uCA, uGrainT, uGrain, uLift, uGain, uMixB;
vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y); float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 rnd3(vec2 p){ return vec3(rnd(p), rnd(p + 17.1), rnd(p + 43.7)); }
// the composed picture at a SQUARE uv: A over black, then B screened
vec3 pic(vec2 sq){
  if (sq.x < 0.0 || sq.x > 1.0 || sq.y < 0.0 || sq.y > 1.0) return vec3(0.0);
  vec4 A = texture2D(uA, sq);
  vec3 hsv = rgb2hsv(A.rgb); hsv.x += uHue;
  vec3 base = hsv2rgb(hsv) * A.a;
  vec4 B = texture2D(uB, sq);
  B.rgb *= uMixB;                       // ADD B: screen with black is identity
  vec3 scr = 1.0 - (1.0 - base) * (1.0 - B.rgb);
  return mix(base, scr, B.a);
}
void main(){
  vec2 uv = vUv;
  vec2 sq = (uv - 0.5) * vec2(uAsp, 1.0) + 0.5;
  // chromatic aberration, cables' SMOOTH path: red walks +x, blue walks -x
  vec3 col = pic(sq);
  float r = 0.0, b = 0.0;
  for (float k = 0.0; k < 3.0; k += 1.0) {
    float off = (uCA / 3.0) * k;
    r += pic(sq + vec2(off, 0.0)).r / 3.0;
    b += pic(sq - vec2(off, 0.0)).b / 3.0;
  }
  col = vec3(r, col.g, b);
  col *= uGain + uLift;
  // sparse RGB grain, overlay at 49%: 5% of pixels, animated
  vec3 g = rnd3(uv + vec2(uGrainT));
  float hit = step(0.95, rnd(uv * 11.0 + vec2(uGrainT)));
  vec3 ov = mix(2.0 * col * g, 1.0 - 2.0 * (1.0 - col) * (1.0 - g), step(0.5, col));
  col = mix(col, ov, uGrain * hit);
  gl_FragColor = vec4(col, 1.0);
}`;

  // the two ramps, read from the patch's GradientTexture ops
  const RAMP_A = [[0, 0, 0, 0], [0, 0, 0, 0.355], [0.055, 0.129, 0.627, 0.730], [0.278, 0.706, 0.773, 1.0]];
  const RAMP_B = [[0, 0, 0, 0], [0, 0, 0, 0.455], [1.0, 0.229, 0.0, 0.852], [1.0, 0.838, 0.437, 1.0]];

  // cables' Math.Ease, Expo In Out between 0.18 and 1.23
  const expoInOut = x => x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5
    ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
  const EASE = v => 0.18 + 1.05 * expoInOut((v - 0.18) / 1.05);

  reg({
    id: 'SRC-80.3', family: 'SRC-80', ver: 3,
    title: 'Learning: Cables Sphere V3',
    macros: MACROS,
    palette: (typeof PAL !== 'undefined') ? {
      c: [DEEPHEX(0.64), DEEPHEX(0.05), '#d37b50', '#d4d4d4', '#4f4f4f'],
      g: [PAL.PRESETS.GOLD1, PAL.PRESETS.COPPER1, PAL.PRESETS.SILVER1],
      names: { c0: 'COLOR A', c1: 'COLOR B' }
    } : undefined,
    tech: 'WEBGL / SIX FULLSCREEN PASSES · NO GEOMETRY · A DISC, A LENS MADE OF THE DISC, A BLUR WITH A WANDERING MASK',
    tags: ['LEARNING', 'WEBGL', 'SPHERE', 'NOISE', 'AUDIO REACTIVE', 'TWISTER', 'AFTER CABLES.GL'],
    audioIn: true,
    desc: 'A learning study after a cables.gl patch (RklgDb). A soft sphere whose surface is a slow, folded, two-colour liquid — blue and teal under orange and cream — with a bright crescent on the upper-right rim and a focus that wanders across it. There is no sphere: it is a hard disc, a lens made of the same disc blurred and used to drag the picture across the rim, and a blur whose strength is a slow noise field. The colour is two simplex fields, each folded by a wildly overdriven displacement wrapped in mirrors, screened together, hue-drifting, with chromatic aberration and a sparse grain. Built by reading the public patch and every op shader, then collapsing the 86 ops into six passes.',
    interact: 'THE COLOUR IS ON THE TWISTER (AUTO-MAP, knobs 13 / 14 / 15): COLOR A is the hue of the sphere, COLOR B the hue of the second colour, ADD B how much of it is let in — at zero the sphere is one colour whatever COLOR B says. Near = less, far = more, both hands. LEFT IS SIZE AND DEPTH: at the source a small flat disc, a 2D picture; draw it away and it grows to fill the height and the lens rim appears — it turns out to live in a space. RIGHT IS THE STORM: how fast the liquid flows, how hard it folds, and how much the sound is allowed to move it.',
    sound: 'It LISTENS. Level runs through the patch\'s own ease curve into finer features in the orange layer, tighter folds and a re-dealt focus. Bass swells the disc. A kick re-deals the focus at once and lifts the light — quick attack, a second of release. Treble widens the chromatic aberration. No voice of its own this round.',

    init(P) {
      const s = {
        noGL: typeof THREE === 'undefined',
        pres: 0, clock: 0, speed: 0.14,
        L: 0, R: 0, R_disc: 0.5, lens: 0,
        bass: 0, treble: 0, level: 0, E: 0.18, maskT: 1.63, lift: 0,
        prevOnset: 0, kickN: -1, tSec: 0,
        macro: {}, hA: 0.64, hB: 0.05, mB: MACROS[2].def
      };
      MACROS.forEach(d => { s.macro[d.k] = d.def; });
      P.state = s;
      if (s.noGL) return;
      if (P._w) { try { P._w.renderer.dispose(); } catch (e) {} }
      const W = {}; P._w = W;
      const sc = Math.min(1, 1600 / Math.max(P.w, P.h));
      W.rw = Math.max(2, Math.round(P.w * sc));
      W.rh = Math.max(2, Math.round(P.h * sc));
      W.S = Math.min(S_MAX, W.rh);

      const r = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      r.setPixelRatio(1); r.setSize(W.rw, W.rh, false); r.setClearColor(0x000000, 1);
      W.renderer = r;
      W.scene = new THREE.Scene();
      W.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      const mkRT = () => new THREE.WebGLRenderTarget(W.S, W.S, {
        type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, depthBuffer: false });
      W.rtA = mkRT(); W.rtA2 = mkRT(); W.rtB = mkRT(); W.rtB2 = mkRT();

      const keys = R => ({ uK0: { value: new THREE.Vector4(...R[0]) }, uK1: { value: new THREE.Vector4(...R[1]) },
                           uK2: { value: new THREE.Vector4(...R[2]) }, uK3: { value: new THREE.Vector4(...R[3]) } });
      const layer = (R, harm, smooth, off) => new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: LAYER_FS, depthTest: false, depthWrite: false,
        uniforms: Object.assign({
          uTime: { value: 0 }, uTDisp: { value: 0 }, uScale: { value: 0.91 }, uHarm: { value: harm },
          uSmooth: { value: smooth }, uDispScale: { value: 0.11 }, uBright: { value: 1 },
          uOff: { value: new THREE.Vector2(off[0], off[1]) }, uDispAmt: { value: new THREE.Vector2(0.5, 0.55) },
          uR: { value: 0.8 }, uLens: { value: 1 }, uLensW: { value: 0.16 }, uDbg: { value: 0 }
        }, keys(R))
      });
      W.matA = layer(RAMP_A, 2, 1.15, [0, 0]);
      W.matB = layer(RAMP_B, 4, 1.0, [0, 0]);
      W.matBlur = new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: BLUR_FS, depthTest: false, depthWrite: false,
        uniforms: { uTex: { value: null }, uDir: { value: new THREE.Vector2(0, 1) }, uAmount: { value: 9.62 },
                    uMaskT: { value: 1.63 }, uMaskScale: { value: 1.19 }, uMaskOff: { value: new THREE.Vector2(-4.11, 0.62) } }
      });
      W.matFinal = new THREE.ShaderMaterial({
        vertexShader: VS, fragmentShader: FINAL_FS, depthTest: false, depthWrite: false,
        uniforms: { uA: { value: null }, uB: { value: null }, uAsp: { value: W.rw / W.rh }, uHue: { value: 0.9 },
                    uCA: { value: 6.59 / W.S }, uGrainT: { value: 0 }, uGrain: { value: 0.494 }, uLift: { value: 0 }, uGain: { value: 1 }, uMixB: { value: 0 } }
      });
      W.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), W.matA);
      W.quad.frustumCulled = false;
      W.scene.add(W.quad);
    },

    step(P, dt, t, inp) {
      const s = P.state;
      s.tSec = t;
      const live = SOURCE_PRES();   // the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

      // ---- the hands. Source law: distance is power.
      const L = SOURCE(inp.L), R = SOURCE(inp.R);
      s.L += (L - s.L) * Math.min(1, dt * 5);
      s.R += (R - s.R) * Math.min(1, dt * 5);

      // ---- the sound. Bands are engine-smoothed; ease them like a hand.
      const a = inp.audio;
      let kick = false;
      if (a) {
        const sens = 0.7 + s.R * 1.3;                          // the storm hand is a gamma on the level
        const lv = Math.pow(Math.max(0, a.level), 1 / sens);
        s.level += (lv - s.level) * Math.min(1, dt * 5);
        s.bass += (a.bass - s.bass) * Math.min(1, dt * 6);
        s.treble += (a.treble - s.treble) * Math.min(1, dt * 6);
        if (a.kick && a.kick.n !== s.kickN) { if (s.kickN >= 0) kick = true; s.kickN = a.kick.n; }
        if (a.onset > 0.7 && s.prevOnset <= 0.7) kick = true;   // edge fallback for the harness
        s.prevOnset = a.onset;
      }
      s.E += (EASE(s.level) - s.E) * Math.min(1, dt * 4);
      if (kick) { s.maskT += 0.35; s.lift = 0.28; }            // the focus re-deals; the light lifts
      s.lift *= Math.exp(-dt * 3.2);                            // quick attack, ~1 s release
      s.maskT += dt * 0.05 * s.R;                               // the focus drifts a little in the storm

      // ---- the clock: the patch's Timer at speed 0.14; the storm hand speeds it
      s.speed += ((0.14 + s.R * 0.96) - s.speed) * Math.min(1, dt * 3);
      s.clock += dt * s.speed;

      // LEFT: size and depth. Flat and small at the source.
      s.R_disc = 0.35 + s.L * 0.50;
      s.lens = s.L;

      // ---- the knobs (they hold where they were left)
      // THE PALETTE: the hue of c0 / c1, eased the short way round the wheel
      const hueOf = i => { const c = (typeof PAL !== 'undefined') && PAL.c(P, i); return c ? PAL.rgb2hsl(c)[0] : (i ? 0.05 : 0.64); };
      const toward = (h, want, k) => { const d = ((want - h + 1.5) % 1) - 0.5; return (h + d * k + 1) % 1; };
      s.hA = toward(s.hA, hueOf(0), Math.min(1, dt * 6));
      s.hB = toward(s.hB, hueOf(1), Math.min(1, dt * 6));
      s.mB += (s.macro.mixB - s.mB) * Math.min(1, dt * 4);

      if (s.noGL) return;
      const W = P._w;
      const uA = W.matA.uniforms, uB = W.matB.uniforms;
      const rA = rampFor(s.hA, 0.355, 0.730), rB = rampFor(s.hB, 0.455, 0.852);
      uA.uK2.value.set(...rA[2]); uA.uK3.value.set(...rA[3]);
      uB.uK2.value.set(...rB[2]); uB.uK3.value.set(...rB[3]);
      const disc = s.R_disc * (1 + 0.06 * s.bass);
      const tDisp = (s.clock + 1000) * 0.15;
      /* the DISP field's scale. MEASURED, not copied: at the patch's 0.11 the
         field is nearly FLAT across the frame (a large, slowly drifting DC
         term and almost no variation), so the mirror wrap only slides the
         whole picture and no ribbon ever forms — our simplex is not the
         patch's, and at that scale the difference is everything. Ribbons
         appear from ~0.4 and the picture shreds past ~1.0. So the storm hand
         walks it 0.22 → 0.65: calm pools at the source, marbled folds wide. */
      const dispScale = 0.22 + 0.43 * s.R + (s.E - 0.18) * 0.30;
      uA.uTime.value = s.clock; uA.uTDisp.value = tDisp; uA.uDispScale.value = dispScale;
      uA.uDispAmt.value.set(0.15 + 0.40 * s.R, 0.17 + 0.42 * s.R);
      uA.uR.value = disc; uA.uLens.value = s.lens; uA.uLensW.value = 0.16 * (0.4 + 0.6 * s.L);
      uB.uTime.value = s.clock + 2386; uB.uTDisp.value = tDisp; uB.uDispScale.value = dispScale;
      uB.uDispAmt.value.set(0.05 + 0.20 * s.R, 0.05 + 0.20 * s.R);
      uB.uScale.value = s.E + 0.65 + 0.08;                       // the patch: ease + 0.65 (0.91 at rest)
      uB.uBright.value = 2 * (0.35 + 0.15 * Math.sin(2 * Math.PI * 0.5 * t));
      uB.uR.value = disc; uB.uLens.value = s.lens; uB.uLensW.value = uA.uLensW.value;
      const uF = W.matFinal.uniforms;
      uF.uHue.value = 0.9 + 0.05 * Math.sin(2 * Math.PI * 0.2 * t);
      uF.uCA.value = (3 + 9 * s.treble) / W.S;
      uF.uGrainT.value = (t % 100);
      uF.uLift.value = s.lift;
      uF.uGain.value = 0.55 + 0.45 * s.pres;
      uF.uMixB.value = s.mB;
    },

    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) {
        if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
        g.fillStyle = 'rgba(220,220,230,0.75)';
        g.font = `${Math.round(13 * (h / 1200))}px ui-monospace,monospace`;
        g.fillText('CABLES SPHERE needs WebGL + three.js', 24, h / 2);
        return;
      }
      const W = P._w, r = W.renderer;
      const pass = (mat, dst) => { W.quad.material = mat; r.setRenderTarget(dst); if (dst) r.setViewport(0, 0, W.S, W.S); r.render(W.scene, W.cam); };
      const blur = (src, dst, dx, dy, amount) => {
        const u = W.matBlur.uniforms;
        u.uTex.value = src.texture; u.uDir.value.set(dx, dy); u.uAmount.value = amount; u.uMaskT.value = s.maskT;
        pass(W.matBlur, dst);
      };
      /* the blur is in FRAME units, so a small disc at the source was blurred
         into a smear (measured: two dim blobs). Scale it with the disc so the
         small form keeps the same softness the big one has. */
      const bk = Math.min(1, s.R_disc / 0.85);
      // A: the layer, then a vertical and a horizontal masked blur (cables: "both")
      pass(W.matA, W.rtA);
      blur(W.rtA, W.rtA2, 0, 1, 9.62 * bk);
      blur(W.rtA2, W.rtA, 1, 0, 9.62 * bk);
      // B: the layer, then a vertical masked blur only
      pass(W.matB, W.rtB);
      blur(W.rtB, W.rtB2, 0, 1, 5.0 * bk);
      // the frame
      W.matFinal.uniforms.uA.value = W.rtA.texture;
      W.matFinal.uniforms.uB.value = W.rtB2.texture;
      W.quad.material = W.matFinal; r.setRenderTarget(null); r.setViewport(0, 0, W.rw, W.rh); r.render(W.scene, W.cam);

      g.save();
      g.globalCompositeOperation = P.hosted ? 'lighter' : 'copy';
      g.drawImage(r.domElement, 0, 0, W.rw, W.rh, 0, 0, w, h);
      g.restore();

      if (!P.hosted && typeof OWPERF === 'function' && !OWPERF()) {
        const ms = h / 1200;
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText('SIZE ' + Math.round(s.L * 100) + '   STORM ' + Math.round(s.R * 100)
          + '   E ' + s.E.toFixed(2) + '   FOCUS-T ' + s.maskT.toFixed(2) + '   LIFT ' + s.lift.toFixed(2)
          + '   A ' + Math.round(s.hA * 100) + '   B ' + Math.round(s.hB * 100) + '   ADD B ' + Math.round(s.mB * 100), 10, h - 10);
      }
    }
  });
})();
