/* ---------- SRC-43.3 · CELL FRONT V3 (the film moves) ----------
   V2 fixed the material and left it standing still. Its only motion was a
   stationary warp — cells wobbled in place but never went anywhere, so the
   picture was a photograph that shimmered. What V1 had and V2 lost was the
   sense of a liquid: blobs travelling across the frame, arriving and leaving,
   and colour sweeping through the whole field when a hand moves. V3 puts both
   back without putting the blinking back with them.
   THE DRIFT. Each of the three lattices now translates at its own velocity
   and carries its own travelling warp, so they slide past one another. Cells
   float across the canvas and out of it; they enter and leave the PICTURE,
   which is what V1's cells looked like they were doing, rather than fading in
   and out of EXISTENCE, which is what V1's cells were actually doing and what
   made it flicker. Nothing here has a lifecycle still. A cell only leaves by
   drifting past the edge of the paint, and it fades as it goes because the
   pool is sampled at the cell.
   THE SWEEP. The colour band is nearly twice as wide as V2's and the front
   travels half again as far, so moving one hand repaints a broad swathe of
   the canvas instead of nudging a stripe. Cells re-read their colour off a
   band that is moving under them, so the hue crossfades through each cell in
   turn and the two paints appear to run into each other.
   And the cells breathe on their own clocks, and are slowly turning ovals
   rather than circles — the small motions that make it read as wet. ------ */
const CF3_LOBES = s => [
  [-s.offW, -0.05, s.Rw], [0, 0.02, s.Rm], [s.offC, 0.05, s.Rc]
];
const CF3_POOL = (s, x, y) => {
  let acc = 0;
  for (const l of CF3_LOBES(s)) {
    if (l[2] < 0.004) continue;
    const q = Math.hypot(x - l[0], y - l[1]) / l[2];
    acc += Math.exp(-q * q * q * 1.15);
  }
  return acc;
};
const CF3_BAND = (s, x, y) => {
  const w = 0.070 * Math.sin(y * 5.3 + s.life * 0.13)
          + 0.040 * Math.sin(y * 9.1 - s.life * 0.09)
          + 0.020 * Math.sin(y * 14.7 + s.life * 0.17);
  return clamp(((x - s.front - w) / 0.52) * 0.5 + 0.5);
};
const CF3_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uWarm, uCool, uHeat, uFront, uU;',
  'uniform vec2 uRes;',
  'uniform vec3 uLobe[3];',
  'uniform int uNB;',
  'uniform vec4 uBloom[8];',
  'uniform vec4 uFlash[6];',
  // --- the palette sampled off the reference pour -------------------------
  'const vec3 C_EMBER = vec3(0.760, 0.230, 0.030);',
  'const vec3 C_ORANG = vec3(0.996, 0.494, 0.133);',
  'const vec3 C_MARIG = vec3(1.000, 0.655, 0.110);',
  'const vec3 C_GOLD  = vec3(0.996, 0.808, 0.106);',
  'const vec3 C_CREAM = vec3(0.847, 0.753, 0.643);',
  'const vec3 C_CYAN  = vec3(0.294, 0.745, 0.988);',
  'const vec3 C_INDIG = vec3(0.329, 0.478, 0.957);',
  'const vec3 C_VIOLT = vec3(0.510, 0.169, 0.647);',
  'const vec3 C_MAGEN = vec3(0.992, 0.106, 0.486);',
  'const vec3 C_CRIMS = vec3(0.980, 0.106, 0.322);',
  'vec3 rnd3(float a, float b, float salt){',
  '  float x = mod(a * 311.0 + b * 719.0 + salt * 37.0, 65536.0);',
  '  vec3 o; float hi;',
  '  x = mod(x * 75.0 + 74.0, 65537.0);',
  '  hi = floor(x / 256.0); x = mod((x - hi * 256.0) * 257.0 + hi * 131.0 + 7.0, 65537.0); o.x = x / 65537.0;',
  '  x = mod(x * 75.0 + 74.0, 65537.0);',
  '  hi = floor(x / 256.0); x = mod((x - hi * 256.0) * 257.0 + hi * 131.0 + 7.0, 65537.0); o.y = x / 65537.0;',
  '  x = mod(x * 75.0 + 74.0, 65537.0);',
  '  hi = floor(x / 256.0); x = mod((x - hi * 256.0) * 257.0 + hi * 131.0 + 7.0, 65537.0); o.z = x / 65537.0;',
  '  return o;',
  '}',
  // two near neighbours do not meet at a point, they run together into one
  // peanut. This only works because the cells are SPARSE — on a packed field
  // the same operator fuses the whole canvas into one flat sheet.
  'float smin(float a, float b, float k){',
  '  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);',
  '  return mix(b, a, h) - k * h * (1.0 - h);',
  '}',
  'float poolF(vec2 p){',
  '  float acc = 0.0;',
  '  for (int i = 0; i < 3; i++){',
  '    vec3 L = uLobe[i];',
  '    if (L.z < 0.004) continue;',
  '    vec2 d = p - L.xy;',
  '    if (dot(d, d) > L.z * L.z * 4.6) continue;',
  '    vec2 n = d / max(L.z, 1e-4);',
  '    float r = L.z * (1.0 + 0.15 * sin(n.x * 2.4 + n.y * 1.9 + uT * 0.15 + float(i) * 2.1)',
  '                        + 0.10 * sin(n.y * 3.5 - n.x * 2.2 - uT * 0.11 + float(i) * 3.7));',
  '    float q = length(d) / max(r, 1e-4);',
  '    acc += exp(-q * q * q * 1.15);',
  '  }',
  '  return acc;',
  '}',
  'float bandK(vec2 q){',
  '  float w = 0.070 * sin(q.y * 5.3 + uT * 0.13)',
  '          + 0.040 * sin(q.y * 9.1 - uT * 0.09)',
  '          + 0.020 * sin(q.y * 14.7 + uT * 0.17);',
  '  return clamp(((q.x - uFront - w) / 0.52) * 0.5 + 0.5, 0.0, 1.0);',
  '}',
  'vec3 ramp(float k){',
  '  vec3 c = C_EMBER;',
  '  c = mix(c, C_ORANG, smoothstep(0.02, 0.14, k));',
  '  c = mix(c, C_MARIG, smoothstep(0.15, 0.28, k));',
  '  c = mix(c, C_GOLD,  smoothstep(0.29, 0.42, k));',
  '  c = mix(c, C_CYAN,  smoothstep(0.45, 0.55, k));',
  '  c = mix(c, C_INDIG, smoothstep(0.57, 0.65, k));',
  '  c = mix(c, C_VIOLT, smoothstep(0.66, 0.75, k));',
  '  c = mix(c, C_MAGEN, smoothstep(0.76, 0.86, k));',
  '  c = mix(c, C_CRIMS, smoothstep(0.88, 1.00, k));',
  '  return c;',
  '}',
  // the liquid under the film — ALL of the motion comes from here now
  'vec2 flowW(vec2 p){',
  '  float t = uT * 0.07;',
  '  return vec2(sin(p.y * 3.7 + t * 1.3) + 0.5 * sin(p.x * 2.1 - t * 0.8),',
  '              cos(p.x * 3.1 - t * 1.1) + 0.5 * cos(p.y * 2.5 + t * 0.6));',
  '}',
  'float grainF(vec2 q){',
  '  return clamp(0.5 + 0.25 * sin(q.x * 2.3 + q.y * 1.7 + uT * 0.031)',
  '                   + 0.17 * sin(q.y * 3.1 - q.x * 1.6 + uT * 0.024)',
  '                   + 0.12 * sin(q.x * 4.1 - q.y * 2.4 - uT * 0.019), 0.0, 1.0);',
  '}',
  /* ONE LAYER OF CELLS. Discs on a jittered lattice, SPARSE — the radius is
     skewed hard toward small by the cube, so a handful of fat cells sit in a
     crowd of pinheads, which is the size range the reference actually has.
     They are unioned with a smooth min, so a pair that happens to land close
     runs together into a peanut and a triple into a clover. dS is the fused
     surface; SP/SH/SR are the nearest single cell — who owns this pixel. */
  'void lay(vec2 p, vec2 lo, vec2 rot, float U, float salt, float rmin, float rspan, float wgt, float km,',
  '         inout float dS, inout float dH, inout vec2 SP, inout vec3 SH, inout float SR){',
  '  vec2 off = vec2(0.173, 0.411) * salt;',
  '  vec2 q = p + lo + off;',
  '  vec2 g0 = floor(q / U);',
  '  for (int j = -1; j <= 1; j++){',
  '  for (int i = -1; i <= 1; i++){',
  '    vec2 gg = g0 + vec2(float(i), float(j));',
  '    vec3 h = rnd3(gg.x, gg.y, salt);',
  '    vec2 site = (gg + vec2(0.5) + (h.xy - 0.5) * 0.86) * U;',
  // no birth, no death: a cell that has broken through STAYS. It breathes on
  // its own clock, and it is a slowly turning OVAL — real cells are never
  // circles, and a field of ovals all turning together is most of the wetness.
  '    float R = U * (rmin + rspan * h.z * h.z * h.z) * wgt',
  '            * (1.0 + 0.11 * sin(uT * (0.06 + h.y * 0.16) + h.x * 6.283));',
  '    vec2 dv = q - site;',
  '    vec2 dir = normalize(h.xy - 0.5 + vec2(1e-3, 7e-4));',
  '    vec2 dr = vec2(dir.x * rot.x - dir.y * rot.y, dir.x * rot.y + dir.y * rot.x);',
  '    vec2 rr = vec2(dot(dv, dr), dot(dv, vec2(-dr.y, dr.x)));',
  '    float ec = 1.0 + 0.30 * h.z;',
  '    vec2 ab = vec2(R * ec, R / ec);',
  '    float d = (length(rr / ab) - 1.0) * min(ab.x, ab.y);',
  '    dS = smin(dS, d, km);',
  '    if (d < dH){ dH = d; SP = site - off - lo; SH = h; SR = min(ab.x, ab.y); }',
  '  }}',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  '  vec2 pa = p + flowW(p * 2.1) * (0.011 + uHeat * 0.015);',
  // THE DRIFT. Three lattices, three velocities: they slide past each other,
  // so cells travel across the frame and out of it, and the parallax between
  // the coarse and the fine layer is what sells it as liquid rather than as a
  // texture being scrolled. Hands speed the whole thing up.
  '  float sp = 0.45 + 0.62 * uHeat;',
  '  vec2 dr0 = vec2( 0.0046,  0.0017) * uT * sp + flowW(p * 1.7 + vec2(0.0)) * (0.011 + uHeat * 0.014);',
  '  vec2 dr1 = vec2(-0.0032,  0.0039) * uT * sp + flowW(p * 2.4 + vec2(3.1)) * (0.009 + uHeat * 0.012);',
  '  vec2 dr2 = vec2( 0.0067, -0.0028) * uT * sp + flowW(p * 3.3 + vec2(6.7)) * (0.007 + uHeat * 0.010);',
  '  float ct = cos(uT * 0.030), st = sin(uT * 0.030);',
  '  vec2 rot = vec2(ct, st);',
  '  float acc = poolF(pa);',
  '  if (acc < 0.11){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float kk0 = bandK(pa);',
  '  float nf = exp(-pow((kk0 - 0.5) / 0.16, 2.0));',
  '  float grain = clamp(grainF(pa * 5.0) + nf * 0.42, 0.0, 1.0);',
  '  float w0 = 0.55 + 0.70 * smoothstep(0.74, 0.18, grain);',
  '  float w1 = 0.80 + 0.35 * clamp(1.0 - abs(grain - 0.5) * 1.3, 0.0, 1.0);',
  '  float w2 = 0.55 + 0.80 * smoothstep(0.26, 0.88, grain);',
  '  float U0 = uU * 2.30, U1 = uU * 1.05, U2 = uU * 0.46;',
  '  float dS = 1e5, dH = 1e5, SR = uU * 0.30;',
  '  vec2 SP = pa; vec3 SH = vec3(0.5);',
  '  lay(pa, dr0, rot, U0, 1.0,  0.15, 0.44, w0, U0 * 0.22, dS, dH, SP, SH, SR);',
  '  lay(pa, dr1, rot, U1, 17.0, 0.20, 0.58, w1, U1 * 0.22, dS, dH, SP, SH, SR);',
  '  lay(pa, dr2, rot, U2, 31.0, 0.24, 0.54, w2, U2 * 0.24, dS, dH, SP, SH, SR);',
  // a bloom is just the fattest cell in the neighbourhood, in the same union
  '  for (int i = 0; i < 8; i++){',
  '    if (i >= uNB) break;',
  '    vec4 b = uBloom[i];',
  '    if (b.z < 0.004) continue;',
  '    vec2 bd = pa - b.xy;',
  '    if (dot(bd, bd) > b.z * b.z * 4.0) continue;',
  '    float dd = length(bd) - b.z;',
  '    dS = smin(dS, dd, b.z * 0.10);',
  '    if (dd < dH){ dH = dd; SP = b.xy; SH = rnd3(float(i) * 23.0, 5.0, 7.0); SR = b.z; }',
  '  }',
  '  float accC = poolF(SP);',
  '  float insideC = smoothstep(0.26, 0.46, accC);',
  '  if (insideC < 0.002){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  /* ---- colour, looked up ONCE at the owning cell ----------------------- */
  '  float kSite = bandK(SP);',
  '  float nfS = exp(-pow((kSite - 0.5) / 0.16, 2.0));',
  '  float kc = clamp(kSite + (SH.z - 0.5) * (0.20 + 0.20 * nfS), 0.0, 1.0);',
  // a rogue: a cell of the OTHER paint carried across the front, ~5% of them
  '  float rgf = fract(SH.z * 29.71 + kSite * 0.13);',
  '  kc = mix(kc, mix(1.0 - kSite, 0.52, 0.30 + 0.45 * fract(SH.x * 7.31)), step(0.900, rgf));',
  '  float hL = SH.y;',
  '  float lum = mix(0.62 + 0.80 * pow(hL, 1.1), 0.07, step(fract(hL * 13.7), 0.17));',
  '  vec3 base = ramp(kc) * lum;',
  '  vec3 halo = mix(C_CREAM, C_CYAN, smoothstep(0.44, 0.62, kSite));',
  '  vec3 rimC = mix(ramp(kc) * (0.85 + 0.75 * lum), halo, 0.34);',
  /* ---- THE GROUND. This is the half of the picture V2 kept getting wrong.
     The cells are islands; between them lies the top film, and it is a
     MATERIAL — slate tinted by whichever paint owns the territory, running
     from near-black to grey as the grain drifts, and speckled all over with
     pinhead cells too small to have rings. Leave it black and the picture
     reads as beads on a void. */
  '  float gg2 = grainF(pa * 3.7 + vec2(19.0, 4.0));',
  '  vec3 ground = mix(vec3(0.310, 0.300, 0.360), ramp(kSite) * 0.40, 0.22) * (0.45 + 1.00 * gg2);',
  '  vec3 col = ground;',
  // pinhead speckle: the dots are far smaller than their lattice step, so the
  // owning cell is the only one that can contain the pixel — one hash, not nine
  '  float Ud = uU * 0.155;',
  '  vec2 dof = vec2(0.61, 0.29);',
  '  vec2 gd = floor((pa + dr2 * 0.7 + dof) / Ud);',
  '  vec3 hd = rnd3(gd.x, gd.y, 53.0);',
  '  vec2 sd = (gd + vec2(0.5) + (hd.xy - 0.5) * 0.9) * Ud - dof - dr2 * 0.7;',
  '  float Rd = Ud * (0.10 + 0.30 * hd.z * hd.z);',
  '  float dotd = (length(pa - sd) - Rd) / Ud;',
  '  vec3 dotC = mix(ground * 0.20, ramp(kSite) * (0.30 + 0.9 * hd.z), step(0.45, fract(hd.z * 31.0)));',
  '  col = mix(col, dotC, (1.0 - smoothstep(-0.06, 0.02, dotd)) * step(0.0, dS));',
  /* ---- THE CELL ------------------------------------------------------- */
  '  float u = -dS / max(SR, 1e-4);',
  '  float e = -dS / (uU * 0.055);',
  '  float j = SH.x;',
  // every blob sits in its own shadow: a near-black ring hugging it, then the
  // grey ground again
  '  col = mix(col, ground * 0.22, exp(-pow((e + 0.85) / 0.70, 2.0)));',
  '  col = mix(col, rimC, smoothstep(-0.50, 0.60, e));',
  '  col = mix(col, base, smoothstep(1.7, 4.2, e));',
  // a discrete inner ring, on about half of them, at its own radius
  '  col = mix(col, base * 0.36, exp(-pow((u - (0.40 + j * 0.28)) / 0.035, 2.0))',
  '                              * step(0.48, fract(j * 11.3)) * 0.60);',
  // the pupil: some cells hold a dark eye, some a bright one, most neither
  '  col = mix(col, mix(base * 0.34, base * 1.70 + vec3(0.03), step(0.5, fract(j * 17.3))),',
  '            smoothstep(0.70, 1.02, u) * step(0.55, j) * 0.50);',
  // LACING: at the front the ground itself goes white between the cells —
  // the filigree a swipe leaves where the two paints tear apart
  '  col += vec3(0.88, 0.96, 1.0) * exp(-pow((u + 0.16) / 0.18, 2.0))',
  '       * exp(-pow((kSite - 0.5) / 0.070, 2.0)) * (0.20 + 0.50 * uHeat);',
  // the meniscus: paint piles up where it stops running
  '  float ee = (accC - 0.35) / 0.12;',
  '  col = mix(col, ground * 0.5 + base * 0.20, exp(-ee * ee) * 0.72);',
  '  col *= insideC * (0.58 + 0.42 * uPres);',
  '  for (int i = 0; i < 6; i++){',
  '    vec4 f = uFlash[i];',
  '    if (f.w <= 0.001) continue;',
  '    float rr = f.z * (1.0 + (1.0 - f.w) * 0.75);',
  '    float dd = abs(length(pa - f.xy) - rr) / (f.z * 0.20 + 0.002);',
  '    vec3 fc = mix(C_GOLD, C_CYAN, smoothstep(0.44, 0.62, bandK(f.xy)));',
  '    col += fc * exp(-dd * dd) * f.w * 0.6 * insideC;',
  '  }',
  '  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.16);',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.55);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-43.3', family: 'SRC-43', ver: 3, title: 'Cell Front V3', tech: 'DRIFTING CELL FIELD / COLOUR AT CELL RESOLUTION',
  music: {
    bpm: 62, root: 43, mode: 'dorian', chordBars: 4,
    chords: [
      [0, 7, 15, 22, 26],   // Gm9
      [0, 5, 14, 17, 21],   // C6/9 over G
      [0, 10, 17, 21, 26],  // Fmaj9 over G
      [0, 3, 10, 15, 22]    // Gm11
    ],
    chordNames: ['Gm9', 'C6/9/G', 'Fmaj9/G', 'Gm11']
  },
  fx: { bloom: 0.30 },
  tags: ['POURED PAINT', 'DRIFTING CELLS', 'COLOUR SWEEP', 'TWO BANKS MEET'],
  desc: 'A macro shot of poured paint, and now the paint is moving. The material is V2\'s — islands in a ground: rounded blobs of the under-paint in a slate film, each in its own black shadow, each with a bright rim and an inner ring and often a pupil, pairs that land close running together into peanuts and clovers, and pinhead speckle everywhere between. What V3 adds is the liquid. The three lattices of cells each travel at their own velocity and carry their own drifting warp, so they slide past one another and blobs float across the frame and out of it, fading as they leave the paint rather than blinking off. Cells breathe on their own clocks and are slowly turning ovals, not circles. And the colour band is wide and moves a long way, so when a hand moves the hue crossfades through cell after cell and the two paints appear to run into each other. Still nothing with a lifecycle: a cell never appears or vanishes on the spot',
  interact: 'One hand per bank. L = THE WARM BANK — reach out and marigold floods in from the left and pushes the front to the right; draw in and it retreats to a small ember puddle. R = THE COOL BANK, the same in magenta from the right. The front only EXISTS when both hands are out: the middle of the canvas is a third pool whose size is whichever hand is doing less, so one hand alone gives you a lone island of your own colour, and two hands weld the banks into one sheet with a live seam running through it. That seam is the instrument — it sits wherever your hands balance, the film shatters along it into pinheads and white lacing, and it is where the paint blooms and lets go.',
  sound: 'Unchanged from V1 while the picture is being settled — this revision is the material only. Three layers, no drums: a sub pedal on G that never moves; two pad stacks (role: pad), the warm bank holding the bottom of the voicing and the cool bank the top, each one\'s level tied to how much canvas its colour owns; and the reactive layer, a wet bandpassed fizz for the film plus a narrow hiss panned to the front that only speaks when both banks press. Every big cell you can see swell and let go gets one note on the next sixteenth, panned to where it popped, and ITS PITCH IS ITS COLOUR — deep in a bank the ladder is low and woody (pluck, role lead over warm, bells over cool), at the front it is the top of the ladder and glass. Ableton: pad ch2 (CC74 = weld), lead ch1, bells ch5, texture ch6 = fizz (CC74 = heat), bass ch3, sfx ch11.',

  init(P) {
    const s = {
      pres: 0, warm: 0, cool: 0, heat: 0, weld: 0, front: 0,
      Rw: 0, Rc: 0, Rm: 0, offW: 0.1, offC: 0.1, ax: 0.8, ay: 0.5, U: 0.050,
      blooms: [], flash: [], evq: [], life: 0, popped: 0, popRate: 0,
      cover: 0, spawnAcc: 0, welded: false,
      noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const sc = Math.min(1, 700 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const uni = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uPres: { value: 0 }, uWarm: { value: 0 }, uCool: { value: 0 },
      uHeat: { value: 0 }, uFront: { value: 0 }, uU: { value: s.U },
      uLobe: { value: new Float32Array(9) },
      uNB: { value: 0 },
      uBloom: { value: new Float32Array(32) },
      uFlash: { value: new Float32Array(24) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: CF3_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn; T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    s.life += dt;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.warm += (clamp(inp.L) - s.warm) * Math.min(1, dt * 6);
    s.cool += (clamp(inp.R) - s.cool) * Math.min(1, dt * 6);
    const idle = 0.15 + 0.06 * Math.sin(s.life * 0.21);
    const W = Math.max(s.warm, idle * (1 - s.pres) + s.warm * s.pres);
    const C = Math.max(s.cool, idle * (1 - s.pres) + s.cool * s.pres);
    s.weld += (Math.min(W, C) - s.weld) * Math.min(1, dt * 5);
    s.heat += ((W + C) * 0.5 - s.heat) * Math.min(1, dt * 4);

    const axc = clamp(s.ax, 0.6, 1.7);
    s.offW = (0.10 + 0.48 * W) * axc;
    s.offC = (0.10 + 0.48 * C) * axc;
    const Rwt = 0.07 + W * 0.52, Rct = 0.07 + C * 0.52;
    const Rmt = 0.07 + s.weld * 0.60;
    s.Rw += (Rwt - s.Rw) * Math.min(1, dt * (Rwt > s.Rw ? 0.9 : 1.3));
    s.Rc += (Rct - s.Rc) * Math.min(1, dt * (Rct > s.Rc ? 0.9 : 1.3));
    s.Rm += (Rmt - s.Rm) * Math.min(1, dt * (Rmt > s.Rm ? 0.7 : 1.4));
    const ft = (s.warm - s.cool) * 0.62 * s.ax;
    s.front += (ft - s.front) * Math.min(1, dt * 5);
    const cov = Math.PI * (s.Rw * s.Rw + s.Rc * s.Rc + s.Rm * s.Rm);
    s.cover += (clamp(cov / (4 * s.ax * s.ay) / 1.15) - s.cover) * Math.min(1, dt * 2);

    const weldedNow = s.weld > 0.30;
    if (weldedNow && !s.welded) s.evq.push({ weld: 1 });
    s.welded = weldedNow;

    /* ---- blooms: big cells, and they take their time. V1 spawned them fast
       enough that the picture twitched; a pour swells for tens of seconds. */
    s.spawnAcc += dt * (0.16 + s.heat * 1.0) * (0.35 + s.pres * 0.65);
    while (s.spawnAcc >= 1 && s.blooms.length < 6) {
      s.spawnAcc -= 1;
      let bx = 0, by = 0, ok = false;
      for (let k = 0; k < 12 && !ok; k++) {
        if (k % 2 === 0 && s.weld > 0.2) {
          bx = s.front + (P.rand() - 0.5) * 0.30;
          by = (P.rand() * 2 - 1) * s.ay * 0.9;
        } else {
          bx = (P.rand() * 2 - 1) * s.ax * 0.95;
          by = (P.rand() * 2 - 1) * s.ay * 0.9;
        }
        if (CF3_POOL(s, bx, by) > 0.62) ok = true;
      }
      if (!ok) break;
      const big = P.rand();
      s.blooms.push({ x: bx, y: by, r: s.U * 0.4, Rt: s.U * (0.80 + big * big * 0.80), seed: P.rand() });
    }
    let popped = 0;
    for (let i = s.blooms.length - 1; i >= 0; i--) {
      const b = s.blooms[i];
      const inPaint = CF3_POOL(s, b.x, b.y) > 0.44;
      const gr = (0.16 + s.heat * 0.55) * (0.6 + b.seed * 0.8);
      b.r += (inPaint ? (b.Rt - b.r) * gr : -b.r * 1.6) * dt;
      const sp = 0.45 + 0.62 * s.heat;
      b.x += (0.0046 * sp + Math.sin(b.y * 3.7 + s.life * 0.07) * 0.010) * dt;
      b.y += (0.0017 * sp + Math.cos(b.x * 3.1 - s.life * 0.06) * 0.008) * dt;
      if (b.r <= 0.002 && !inPaint) { s.blooms.splice(i, 1); continue; }
      if (b.r >= b.Rt * 0.985 && inPaint) {
        popped++;
        s.flash.push({ x: b.x, y: b.y, r: b.r, a: 1 });
        if (s.flash.length > 6) s.flash.shift();
        s.evq.push({
          k: CF3_BAND(s, b.x, b.y),
          size: clamp((b.Rt / s.U - 0.80) / 0.80),
          x: clamp(b.x / s.ax * 0.5 + 0.5)
        });
        if (s.evq.length > 8) s.evq.shift();
        s.blooms.splice(i, 1);
      }
    }
    s.popped += popped;
    s.popRate += (popped / Math.max(dt, 1e-3) - s.popRate) * Math.min(1, dt * 2);
    for (let i = s.flash.length - 1; i >= 0; i--) {
      const f = s.flash[i];
      f.a -= dt * 1.9;
      if (f.a <= 0) s.flash.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    if (s.noGL || !P._three) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      const tint = ['255,167,28', '160,120,230', '253,27,124'];
      CF3_LOBES(s).forEach((l, i) => {
        if (l[2] < 0.01) return;
        const x = w / 2 + l[0] * mn, y = h / 2 + l[1] * mn, r = l[2] * mn;
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, 'rgba(' + tint[i] + ',0.9)');
        gr.addColorStop(1, 'rgba(' + tint[i] + ',0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      });
      g.fillStyle = 'rgba(255,200,140,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('CELL FRONT V2 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres;
    u.uWarm.value = s.warm; u.uCool.value = s.cool;
    u.uHeat.value = s.heat; u.uFront.value = s.front; u.uU.value = s.U;
    const ll = u.uLobe.value, LB = CF3_LOBES(s);
    for (let i = 0; i < 3; i++) { ll[i * 3] = LB[i][0]; ll[i * 3 + 1] = LB[i][1]; ll[i * 3 + 2] = LB[i][2]; }
    const bb = u.uBloom.value;
    u.uNB.value = Math.min(8, s.blooms.length);
    for (let i = 0; i < 8; i++) {
      const b = s.blooms[i];
      bb[i * 4] = b ? b.x : 0; bb[i * 4 + 1] = b ? b.y : 0;
      bb[i * 4 + 2] = b ? b.r : 0; bb[i * 4 + 3] = b ? clamp(b.r / b.Rt) : 0;
    }
    const ff = u.uFlash.value;
    for (let i = 0; i < 6; i++) {
      const f = s.flash[i];
      ff[i * 4] = f ? f.x : 0; ff[i * 4 + 1] = f ? f.y : 0;
      ff[i * 4 + 2] = f ? f.r : 0; ff[i * 4 + 3] = f ? f.a : 0;
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    g.fillStyle = 'rgba(255,200,150,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const fr = Math.round((s.front / Math.max(s.ax, 1e-3)) * 100);
    g.fillText('WARM ' + Math.round(s.warm * 100) + '   COOL ' + Math.round(s.cool * 100) +
      '   WELD ' + Math.round(s.weld * 100) + '   FRONT ' + (fr >= 0 ? '+' : '') + fr +
      '   BLOOMS ' + s.blooms.length + '/6   LETGO/S ' + s.popRate.toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const mkPan = x => {
      const p = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : A.ctx.createGain();
      if (p.pan) p.pan.value = x;
      return p;
    };
    const n1 = v.noise(), f1 = v.filter('bandpass', 1100, 0.9), g1 = v.g(0.003);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    const n2 = v.noise(), f2 = v.filter('bandpass', 3600, 4.5), g2 = v.g(0.0001);
    const pan2 = mkPan(0);
    n2.connect(f2); f2.connect(g2); g2.connect(pan2); pan2.connect(v.group);
    if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.5; g2.connect(sd); sd.connect(A.revIn); }

    const NW = 3, NC = 3;
    const warmP = A.padVoices(v, NW, { type: 'triangle', gain: 0.0001, cutoff: 300, q: 0.6 });
    const coolP = A.padVoices(v, NC, { type: 'sawtooth', gain: 0.0001, cutoff: 420, q: 0.8 });
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.010, cutoff: 160, q: 0.5 });
    const place = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      for (let i = 0; i < NW; i++) warmP[i].set(H.chordTone(i, -1), glide + i * 0.02);
      for (let i = 0; i < NC; i++) coolP[i].set(H.chordTone(i + 3, 0), glide + i * 0.02);
    };
    place(0.05);
    H.onChord(() => place(0.35));
    v.fadeIn(1, 2.2);

    return {
      tick(inp, dt) {
        const s = P.state;
        const gate = 0.25 + s.pres * 0.75;
        const heat = s.heat || 0, weld = s.weld || 0, cover = s.cover || 0;
        const fz = clamp((s.popRate || 0) / 5 + heat * 0.35);
        A.set(g1.gain, (0.0016 + fz * 0.011 + cover * 0.004) * gate, 0.25);
        A.set(f1.frequency, 620 + fz * 1900 + heat * 800, 0.3);
        A.set(g2.gain, (0.0001 + weld * weld * 0.016) * gate, 0.2);
        A.set(f2.frequency, 2200 + weld * 3400, 0.25);
        if (pan2.pan) A.set(pan2.pan, clamp(s.front / Math.max(s.ax, 1e-3), -1, 1) * 0.8, 0.15);
        sub[0].level(0.006 + cover * 0.011, 0.6);

        for (let i = 0; i < NW; i++) {
          warmP[i].level((0.0001 + s.warm * (0.014 - i * 0.002)) * gate, 0.7);
          warmP[i].bright(180 + s.warm * 340 + heat * 200, 0.5);
        }
        for (let i = 0; i < NC; i++) {
          coolP[i].level((0.0001 + s.cool * (0.010 - i * 0.0016)) * gate, 0.7);
          coolP[i].bright(260 + s.cool * 620 + heat * 320, 0.5);
        }

        let ev, n = 0;
        while ((ev = s.evq.shift()) && n < 3) {
          n++;
          if (ev.weld) {
            const at = T.next(0.5);
            A.bassNote(H.chordTone(0, -2), { at, vol: 0.075 * gate, dur: 4 });
            for (let k = 0; k < 4; k++) {
              A.bell(H.chordTone(2 + k * 2, 0), { at: at + k * 0.11, vol: 0.026 * gate, dur: 3.6, pan: -0.5 + k * 0.33, rev: 0.85 });
            }
            continue;
          }
          const at = T.next(0.25);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.75;
          const seam = 1 - Math.abs(ev.k - 0.5) * 2;
          const idx = Math.round(1 + seam * 10 - ev.size * 3);
          const vol = (0.014 + ev.size * 0.026) * gate;
          const dur = 1.1 + ev.size * 2.6;
          if (seam > 0.62) {
            A.bell(H.chordTone(idx, 1), { at, vol, dur, pan, rev: 0.85 });
            const clk = 4200 - ev.size * 2000;
            A.hit({ at, vol: 0.022 + ev.size * 0.03, dur: 0.05, freq: clk, q: 1.6, pan });
            if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('sfx', clk, 0.05 + ev.size * 0.05, at, 0.06);
          } else if (ev.k < 0.5) {
            A.pluck2(H.chordTone(idx, 0), { at, vol: vol * 1.15, dur, pan, rev: 0.55, del: 0.1 });
          } else {
            A.bell(H.chordTone(idx, 0), { at, vol, dur, pan, rev: 0.7 });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', weld);
          MOut.expr('texture', heat);
          MOut.expr('lead', s.warm);
          MOut.expr('bells', s.cool);
        }
      },
      stop() { v.kill(); }
    };
  }
});
