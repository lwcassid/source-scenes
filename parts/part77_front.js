/* ---------- SRC-43 · CELL FRONT (two banks of poured paint) ----------
   The thing to steal from a real acrylic pour is not the palette, it is WHERE
   the mixing happens. Poured paint does not blend per-pixel into mud — the
   heavy top layer splits into cells, and each cell shows you whatever colour
   was sitting UNDER it, flat, edge to edge, walled off from its neighbour by a
   near-black contour. So two colours meeting produce a mosaic of two flat
   colours, not a gradient. Mixing happens at CELL resolution.
   This shader does exactly that: the colour is sampled once at the winning
   Voronoi SITE and painted across the whole cell, so a cell straddling the
   boundary between the warm and the cool bank has to pick a side. ------- */
/* the CPU's copy of the only two things it has to agree with the shader
   about: where there is paint, and which colour is under a given point. */
const CF_LOBES = s => [
  [-s.offW, -0.05, s.Rw], [0, 0.02, s.Rm], [s.offC, 0.05, s.Rc]
];
const CF_POOL = (s, x, y) => {
  let acc = 0;
  const L = CF_LOBES(s);
  for (const l of L) {
    if (l[2] < 0.004) continue;
    const q = Math.hypot(x - l[0], y - l[1]) / l[2];
    acc += Math.exp(-q * q * q * 1.15);
  }
  return acc;
};
const CF_BAND = (s, x, y) => {
  const w = 0.055 * Math.sin(y * 5.3 + s.life * 0.10)
          + 0.030 * Math.sin(y * 9.1 - s.life * 0.07)
          + 0.016 * Math.sin(y * 14.7 + s.life * 0.13);
  return clamp(((x - s.front - w) / 0.34) * 0.5 + 0.5);
};
const CF_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uWarm, uCool, uHeat, uFront, uU;',
  'uniform vec2 uRes;',
  'uniform vec3 uLobe[3];',   // x, y, R  — warm bank, seam, cool bank
  'uniform int uNB;',
  'uniform vec4 uBloom[8];',  // x, y, R, life
  'uniform vec4 uFlash[6];',  // x, y, R, alpha
  'const float TAU = 6.28318530718;',
  // --- the sampled palette of the reference pour --------------------------
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
  // --- hash (Lehmer, byte-swapped: no lattice, CPU-reproducible) ----------
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
  /* --- WHERE THERE IS PAINT ----------------------------------------------
     Three lobes: the warm bank on the left, the cool bank on the right, and a
     seam lobe in the middle whose radius is min(warm, cool). One hand alone
     gives you a single island of its own colour; only when BOTH hands are out
     does the middle fill in, the two banks become one canvas, and a front
     exists to be pushed around. */
  'float poolF(vec2 p){',
  '  float acc = 0.0;',
  '  for (int i = 0; i < 3; i++){',
  '    vec3 L = uLobe[i];',
  '    if (L.z < 0.004) continue;',
  '    vec2 d = p - L.xy;',
  '    if (dot(d, d) > L.z * L.z * 4.6) continue;',
  '    vec2 n = d / max(L.z, 1e-4);',
  '    float r = L.z * (1.0 + 0.24 * sin(n.x * 2.4 + n.y * 1.9 + uT * 0.15 + float(i) * 2.1)',
  '                        + 0.15 * sin(n.y * 3.5 - n.x * 2.2 - uT * 0.11 + float(i) * 3.7));',
  '    float q = length(d) / max(r, 1e-4);',
  '    acc += exp(-q * q * q * 1.15);',
  '  }',
  '  return acc;',
  '}',
  /* --- WHICH PAINT ------------------------------------------------------
     One number, 0 = deep warm bank, 0.5 = the front, 1 = deep cool bank. The
     front is not a straight line: three sines of the vertical give it the
     fingering a real swipe line has. */
  'float bandK(vec2 q){',
  '  float w = 0.055 * sin(q.y * 5.3 + uT * 0.10)',
  '          + 0.030 * sin(q.y * 9.1 - uT * 0.07)',
  '          + 0.016 * sin(q.y * 14.7 + uT * 0.13);',
  '  return clamp(((q.x - uFront - w) / 0.34) * 0.5 + 0.5, 0.0, 1.0);',
  '}',
  // the ramp itself: successive mixes, no branching
  'vec3 ramp(float k){',
  '  vec3 c = C_EMBER;',
  '  c = mix(c, C_ORANG, smoothstep(0.02, 0.14, k));',
  '  c = mix(c, C_MARIG, smoothstep(0.15, 0.28, k));',
  '  c = mix(c, C_GOLD,  smoothstep(0.29, 0.41, k));',
  '  c = mix(c, C_CREAM, smoothstep(0.44, 0.50, k));',
  '  c = mix(c, C_CYAN,  smoothstep(0.51, 0.57, k));',
  '  c = mix(c, C_INDIG, smoothstep(0.59, 0.66, k));',
  '  c = mix(c, C_VIOLT, smoothstep(0.66, 0.75, k));',
  '  c = mix(c, C_MAGEN, smoothstep(0.76, 0.86, k));',
  '  c = mix(c, C_CRIMS, smoothstep(0.88, 1.00, k));',
  '  return c;',
  '}',
  // the liquid under the film — everything crawls with it
  'vec2 flowW(vec2 p){',
  '  float t = uT * 0.05;',
  '  return vec2(sin(p.y * 3.7 + t * 1.3) + 0.5 * sin(p.x * 2.1 - t * 0.8),',
  '              cos(p.x * 3.1 - t * 1.1) + 0.5 * cos(p.y * 2.5 + t * 0.6));',
  '}',
  /* --- ONE multiplicatively-weighted Voronoi, three lattices -------------
     A pour is one packing whose members differ wildly in size, so a big cell
     and the small ones beside it SHARE a wall. All three lattices therefore
     compete in a single d = |p - site| / R field. F2-F1 is the whole wall
     network at once. SP hands back the WINNING SITE, which is the whole point
     of this scene: the colour is looked up there, not here. */
  'void lat(vec2 p, float U, float salt, float rmin, float rspan, float slow,',
  '         float rmul, float ca, float sa, inout vec3 F, inout vec3 B, inout vec2 SP){',
  '  vec2 q = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca) + vec2(0.173, 0.411) * salt;',
  '  vec2 g0 = floor(q / U);',
  '  for (int j = -1; j <= 1; j++){',
  '  for (int i = -1; i <= 1; i++){',
  '    vec2 gg = g0 + vec2(float(i), float(j));',
  '    vec3 h = rnd3(gg.x, gg.y, salt);',
  '    vec2 site = (gg + vec2(0.5) + (h.xy - 0.5) * 0.88) * U;',
  '    float rate = (0.026 + uHeat * 0.20) * (0.55 + h.z * 1.1) * slow;',
  '    float ph = fract(h.z * 7.31 + h.x * 3.17 + uT * rate);',
  '    float grow = smoothstep(0.0, 0.26, ph) * (1.0 - smoothstep(0.86, 1.0, ph));',
  '    float R = U * (rmin + h.y * h.y * rspan) * (0.28 + 0.72 * grow) * rmul;',
  '    float d = length(q - site) / max(R, 1e-4);',
  '    if (d < F.x){ F.z = F.y; F.y = F.x; F.x = d; B = vec3(ph, h.z, R);',
  '      vec2 sq = site - vec2(0.173, 0.411) * salt;',
  '      SP = vec2(sq.x * ca + sq.y * sa, -sq.x * sa + sq.y * ca); }',
  '    else if (d < F.y){ F.z = F.y; F.y = d; }',
  '    else if (d < F.z){ F.z = d; }',
  '  }}',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  '  float wa = 0.010 + uHeat * 0.018;',
  '  vec2 pa = p + flowW(p * 2.3) * wa;',
  '  float acc = poolF(pa);',
  '  if (acc < 0.14){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float thick = smoothstep(0.32, 1.20, acc);',
  '  pa += uU * 0.11 * vec2(sin(pa.y * 17.0 + uT * 0.10), cos(pa.x * 15.0 - uT * 0.08));',
  // cells run FINE at the front and coarse out in the deep banks — the seam is
  // where the two paints are actually fighting, so that is where the packing
  // shatters. This is the single strongest read in the reference image.
  '  float kk0 = bandK(pa);',
  '  float nf = exp(-pow((kk0 - 0.5) / 0.17, 2.0));',
  '  vec3 F = vec3(1e9), B = vec3(0.0, 0.0, uU * 0.4); vec2 SP = pa;',
  '  lat(pa, uU * 1.90, 21.0, 0.44, 0.30, 0.42, 1.0 - nf * 0.45, 1.0,    0.0,     F, B, SP);',
  '  lat(pa, uU,        1.0,  0.30, 0.30, 1.00, 0.9 + nf * 0.35, 0.9323, 0.3616,  F, B, SP);',
  '  float gap = 1.0 - smoothstep(0.03, 0.30, F.y - F.x);',
  '  gap *= gap;',
  '  float fine = max(gap, nf * 0.55);',
  '  if (fine > 0.10) lat(pa, uU * 0.44, 11.0, 0.34, 0.40, 1.90, fine * (0.7 + 0.3 * uHeat), 0.6216, -0.7834, F, B, SP);',
  // ask the pool about the CELL, not the pixel: the paint's edge then runs
  // along walls instead of fading out through the middle of cells
  '  float accC = poolF(SP);',
  '  float insideC = smoothstep(0.30, 0.52, accC);',
  '  if (insideC < 0.002){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float hh = clamp(0.5 + 0.5 * (F.z - F.y) / 0.30, 0.0, 1.0);',
  '  float f23 = mix(F.z, F.y, hh) - 0.30 * hh * (1.0 - hh);',
  '  float D = f23 - F.x;',
  '  float J = F.z - F.x;',
  '  float life = B.x, seed = B.y, R = B.z;',
  '  float rel = max(R / (uU * 0.44), 0.06);',
  '  float rp = sqrt(rel);',
  '  float Dn = D * rp, Jn = J * rp;',
  /* ---- THE COLOUR, LOOKED UP AT THE SITE -------------------------------
     kSite is the band of the cell, not of the pixel, so the whole cell is one
     flat colour. The hash then walks it a little way along the ramp: a
     territory is a FAMILY of colours scattered cell by cell, which is why a
     pour never reads as a gradient. And cell brightness varies enormously —
     an amber cell blazing beside a near-black one is most of the texture. */
  '  float kSite = bandK(SP);',
  '  float kk = clamp(kSite + (seed - 0.5) * (0.17 + 0.13 * thick), 0.0, 1.0);',
  // cell brightness varies enormously — an amber cell blazing next to a
  // near-black one is most of what a pour's texture actually IS. The dark end
  // slides to graphite rather than to a dim version of its own hue.
  '  float lum = 0.10 + 1.45 * pow(fract(seed * 11.37 + rel * 0.7), 1.7);',
  '  vec3 body = ramp(kk) * lum + vec3(0.030, 0.026, 0.042) * (1.0 - smoothstep(0.0, 0.55, lum));',
  '  vec3 wallC = body * 0.05 + vec3(0.010, 0.005, 0.013);',
  // the halo is the top film pushed aside by the cell: cream over the warm
  // bank, cyan over the cool one
  '  vec3 halo = mix(C_CREAM, C_CYAN, smoothstep(0.44, 0.62, kSite)) * (0.40 + 0.80 * lum);',
  // wall → a THIN bright halo → the cell's own flat colour, which owns the
  // rest of it. Widen the halo and every cell turns to cream porridge.
  '  vec3 col = mix(wallC, halo, smoothstep(0.015, 0.085, Dn));',
  '  col = mix(col, body, smoothstep(0.055, 0.26, Dn));',
  '  col = mix(col, wallC * 0.8, (1.0 - smoothstep(0.02, 0.20, Jn)) * 0.7);',
  // a mature cell goes thin and papery at the crown
  '  float big = smoothstep(0.35, 1.20, rel);',
  '  col = mix(col, mix(halo, vec3(1.0), 0.35), smoothstep(0.82, 1.30, Dn) * smoothstep(0.10, 0.42, life) * big * 0.30);',
  '  float going = smoothstep(0.84, 0.97, life) * (1.0 - smoothstep(0.97, 1.0, life));',
  '  col += halo * going * smoothstep(0.05, 0.45, Dn) * 0.5;',
  // LACING: at the front the walls themselves light up white — the filigree a
  // swipe leaves where the two paints tear apart
  '  float lace = (1.0 - smoothstep(0.0, 0.11, Dn)) * exp(-pow((kSite - 0.5) / 0.085, 2.0));',
  '  col += vec3(0.88, 0.96, 1.0) * lace * (0.30 + 0.75 * uHeat);',
  // the meniscus: paint piles up where it stops running
  '  float ee = (accC - 0.40) / 0.13; float edge = exp(-ee * ee);',
  '  col = mix(col, wallC + body * 0.25, edge * 0.72);',
  '  col *= insideC * (0.52 + 0.48 * uPres);',
  /* ---- THE BLOOMS: the big cells you can hear -------------------------- */
  '  float bD = 1e9, bLife = 0.0, bR = 0.0; vec2 bC = vec2(0.0);',
  '  for (int i = 0; i < 8; i++){',
  '    if (i >= uNB) break;',
  '    vec4 b = uBloom[i];',
  '    if (b.z < 0.003) continue;',
  '    vec2 d = pa - b.xy;',
  '    if (dot(d, d) > b.z * b.z * 2.6) continue;',
  '    float a = atan(d.y, d.x);',
  '    float rr = b.z * (1.0 + 0.15 * sin(a * 3.0 + uT * 0.22 + float(i) * 1.9)',
  '                         + 0.09 * sin(a * 5.0 - uT * 0.17 + float(i) * 3.3));',
  '    float q = length(d) / max(rr, 1e-4);',
  '    if (q < bD){ bD = q; bLife = b.w; bR = b.z; bC = b.xy; }',
  '  }',
  '  if (bD < 1.14){',
  '    float kb = clamp(bandK(bC) + (fract(bR * 137.3) - 0.5) * 0.12, 0.0, 1.0);',
  '    float lb = 0.55 + 0.85 * bLife;',
  '    vec3 bodyB = ramp(kb) * lb;',
  '    vec3 wallB = bodyB * 0.06 + vec3(0.012, 0.006, 0.014);',
  '    vec3 haloB = mix(C_CREAM, C_CYAN, smoothstep(0.44, 0.62, kb));',
  '    float Db = 1.0 - bD;',
  '    vec3 cb = mix(wallB, haloB, smoothstep(0.0, 0.09, Db));',
  '    cb = mix(cb, bodyB, smoothstep(0.06, 0.36, Db));',
  '    cb += vec3(1.0, 0.95, 0.86) * smoothstep(0.80, 1.0, bLife) * smoothstep(0.25, 0.85, Db) * 0.55;',
  '    col = mix(col, cb * insideC, smoothstep(1.14, 0.94, bD));',
  '  }',
  /* ---- and the craters they leave ------------------------------------- */
  '  for (int i = 0; i < 6; i++){',
  '    vec4 f = uFlash[i];',
  '    if (f.w <= 0.001) continue;',
  '    float rr = f.z * (1.0 + (1.0 - f.w) * 0.75);',
  '    float dd = abs(length(pa - f.xy) - rr) / (f.z * 0.20 + 0.002);',
  '    vec3 fc = mix(C_GOLD, C_CYAN, smoothstep(0.44, 0.62, bandK(f.xy)));',
  '    col += fc * exp(-dd * dd) * f.w * 0.7 * insideC;',
  '  }',
  '  col = col / (1.0 + col * 0.40);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-43', family: 'SRC-43', ver: 1, title: 'Cell Front', tech: 'POURED PAINT / COLOUR AT CELL RESOLUTION',
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
  fx: { bloom: 0.34 },
  tags: ['POURED PAINT', 'CELLS', 'TWO BANKS MEET', 'COLOUR = PITCH'],
  desc: 'A macro shot of poured paint, at the moment the heavy top film has split and let the colours underneath through. Two banks of paint are lying on the same canvas — marigold, gold and ember on the left, magenta, violet and indigo on the right — and where they meet they refuse to blend. They cell instead. The trick this scene is built on is that colour is sampled once per CELL, not per pixel: a cell straddling the boundary has to pick a side, so the mixing happens as a mosaic of flat colours walled off by near-black contours, never as a gradient. Cell size grades from big and lazy out in the deep banks to a shattered glitter along the front, where the walls themselves go white with lacing. Everything crawls at the speed of wet paint.',
  interact: 'One hand per bank. L = THE WARM BANK — reach out and marigold floods in from the left and pushes the front to the right; draw in and it retreats to a small ember island. R = THE COOL BANK, the same in magenta from the right. The front only EXISTS when both hands are out: the middle of the canvas is a third pool whose size is whichever hand is doing less, so one hand alone gives you a lone island of your own colour, and two hands weld the banks into one sheet with a live seam running through it. That seam is the instrument — it sits wherever your hands balance, it shatters into fine cells and white lacing, and it is where the paint blooms and lets go. Push it slowly across the frame and you sweep the whole palette; hold it dead centre and the picture argues with itself.',
  sound: 'Three layers, no drums. Under everything a sub pedal on G that never moves. Above it two pad stacks (role: pad): the warm bank holds the bottom of the voicing, the cool bank the top, each one\'s level and brightness tied to how much canvas its colour owns — so a one-handed picture is a bare open sound and a welded canvas is the full chord. The reactive layer is the paint itself: a wet bandpassed fizz for the packing, and a narrow hiss panned to the front that only speaks when both banks are pressing. Then the blooms: every big cell you can see swell and let go gets one note on the next sixteenth, panned to where it popped, and ITS PITCH IS ITS COLOUR — deep in a bank the ladder is low and the timbre is woody (pluck, role lead over the warm bank, bells over the cool), at the front it is the top of the ladder and glass. Sweeping the front therefore sweeps the melody. When the two banks first weld, the chord arrives rolled from the bass. Ableton: pad ch2 (CC74 = weld), lead ch1, bells ch5, texture ch6 = fizz (CC74 = heat), bass ch3, sfx ch11 = the tear.',

  init(P) {
    const s = {
      pres: 0, warm: 0, cool: 0, heat: 0, weld: 0, front: 0,
      Rw: 0, Rc: 0, Rm: 0, offW: 0.1, offC: 0.1, ax: 0.8, ay: 0.5, U: 0.070,
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
    // the paint is soft — render under-size and let drawImage fatten it, which
    // is also what keeps a three-lattice Voronoi inside budget on weak GL
    const sc = Math.min(1, 640 / Math.max(P.w, P.h));
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
      fragmentShader: CF_FS
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
    // Vespers-tight: the banks answer the hands now, the paint just takes its
    // time arriving (the radii below are the slow part, not the reading)
    s.warm += (clamp(inp.L) - s.warm) * Math.min(1, dt * 6);
    s.cool += (clamp(inp.R) - s.cool) * Math.min(1, dt * 6);
    const idle = 0.10 + 0.05 * Math.sin(s.life * 0.21);
    const W = Math.max(s.warm, idle * (1 - s.pres) + s.warm * s.pres);
    const C = Math.max(s.cool, idle * (1 - s.pres) + s.cool * s.pres);
    s.weld += (Math.min(W, C) - s.weld) * Math.min(1, dt * 5);
    s.heat += ((W + C) * 0.5 - s.heat) * Math.min(1, dt * 4);

    /* ---- the three lobes: paint arrives at the speed of paint ----------
       The banks SEPARATE as they grow. Held in, all three lobes sit on top of
       each other and the idle picture is one small quiet pool; reach out and
       they walk apart and swell until they cover the canvas — which is also
       what stops a wide frame from reading as three unrelated islands. */
    const axc = clamp(s.ax, 0.6, 1.7);
    s.offW = (0.10 + 0.58 * W) * axc;
    s.offC = (0.10 + 0.58 * C) * axc;
    const Rwt = 0.14 + W * 0.46, Rct = 0.14 + C * 0.46;
    const Rmt = 0.06 + s.weld * 0.48;
    s.Rw += (Rwt - s.Rw) * Math.min(1, dt * (Rwt > s.Rw ? 0.9 : 1.3));
    s.Rc += (Rct - s.Rc) * Math.min(1, dt * (Rct > s.Rc ? 0.9 : 1.3));
    s.Rm += (Rmt - s.Rm) * Math.min(1, dt * (Rmt > s.Rm ? 0.7 : 1.4));
    // the front sits where the hands balance. Reach LEFT out and the warm bank
    // wins ground, so the front travels right.
    const ft = (s.warm - s.cool) * 0.40 * s.ax;
    s.front += (ft - s.front) * Math.min(1, dt * 5);
    const cov = Math.PI * (s.Rw * s.Rw + s.Rc * s.Rc + s.Rm * s.Rm);
    s.cover += (clamp(cov / (4 * s.ax * s.ay) / 1.15) - s.cover) * Math.min(1, dt * 2);

    // the weld itself is an event: the two banks touching is the whole scene
    const weldedNow = s.weld > 0.30;
    if (weldedNow && !s.welded) s.evq.push({ weld: 1 });
    s.welded = weldedNow;

    /* ---- BLOOMS: the big cells. Spawned inside the paint, biased to the
       front when the banks are welded, because that is where a real pour
       tears. Each one swells until the film cannot hold it. ------------- */
    s.spawnAcc += dt * (0.35 + s.heat * 2.4) * (0.35 + s.pres * 0.65);
    while (s.spawnAcc >= 1 && s.blooms.length < 8) {
      s.spawnAcc -= 1;
      let bx = 0, by = 0, ok = false;
      for (let k = 0; k < 12 && !ok; k++) {
        // half the attempts hunt the seam, half roam the whole canvas
        if (k % 2 === 0 && s.weld > 0.2) {
          bx = s.front + (P.rand() - 0.5) * 0.30;
          by = (P.rand() * 2 - 1) * s.ay * 0.9;
        } else {
          bx = (P.rand() * 2 - 1) * s.ax * 0.95;
          by = (P.rand() * 2 - 1) * s.ay * 0.9;
        }
        if (CF_POOL(s, bx, by) > 0.62) ok = true;
      }
      if (!ok) break;
      const big = P.rand();
      s.blooms.push({
        x: bx, y: by, r: 0.006,
        Rt: s.U * (1.1 + big * big * 2.6),
        seed: P.rand()
      });
    }
    let popped = 0;
    for (let i = s.blooms.length - 1; i >= 0; i--) {
      const b = s.blooms[i];
      // out of paint (a hand pulled back) → the bloom just sinks away
      const inPaint = CF_POOL(s, b.x, b.y) > 0.44;
      const gr = (0.45 + s.heat * 1.5) * (0.6 + b.seed * 0.8);
      b.r += (inPaint ? (b.Rt - b.r) * gr : -b.r * 1.6) * dt;
      // it drifts with the liquid, and the liquid drifts away from the front
      b.x += Math.sin(b.y * 3.7 + s.life * 0.07) * 0.006 * dt * 6;
      b.y += Math.cos(b.x * 3.1 - s.life * 0.06) * 0.005 * dt * 6;
      if (b.r <= 0.002 && !inPaint) { s.blooms.splice(i, 1); continue; }
      if (b.r >= b.Rt * 0.985 && inPaint) {
        popped++;
        s.flash.push({ x: b.x, y: b.y, r: b.r, a: 1 });
        if (s.flash.length > 6) s.flash.shift();
        s.evq.push({
          k: CF_BAND(s, b.x, b.y),
          size: clamp((b.Rt / s.U - 1.1) / 2.6),
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
      CF_LOBES(s).forEach((l, i) => {
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
      g.fillText('CELL FRONT · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres;
    u.uWarm.value = s.warm; u.uCool.value = s.cool;
    u.uHeat.value = s.heat; u.uFront.value = s.front; u.uU.value = s.U;
    const ll = u.uLobe.value, LB = CF_LOBES(s);
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
      '   BLOOMS ' + s.blooms.length + '/8   LETGO/S ' + s.popRate.toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const mkPan = x => {
      const p = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : A.ctx.createGain();
      if (p.pan) p.pan.value = x;
      return p;
    };

    /* --- the packing, heard as one wet fizz ---------------------------- */
    const n1 = v.noise(), f1 = v.filter('bandpass', 1100, 0.9), g1 = v.g(0.003);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    /* --- the front: a narrow hiss that only speaks when both banks press */
    const n2 = v.noise(), f2 = v.filter('bandpass', 3600, 4.5), g2 = v.g(0.0001);
    const pan2 = mkPan(0);
    n2.connect(f2); f2.connect(g2); g2.connect(pan2); pan2.connect(v.group);
    if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.5; g2.connect(sd); sd.connect(A.revIn); }

    /* --- two pad stacks: the warm bank holds the bottom of the voicing,
           the cool bank the top. A one-handed picture is literally a
           half-voiced chord. ------------------------------------------- */
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

        // the fizz is the packing letting go, continuously
        const fz = clamp((s.popRate || 0) / 5 + heat * 0.35);
        A.set(g1.gain, (0.0016 + fz * 0.011 + cover * 0.004) * gate, 0.25);
        A.set(f1.frequency, 620 + fz * 1900 + heat * 800, 0.3);
        // the front only exists when both banks are out — so does its hiss
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

        /* ---- the events ---------------------------------------------- */
        let ev, n = 0;
        while ((ev = s.evq.shift()) && n < 3) {
          n++;
          if (ev.weld) {
            // the two banks touch: the chord arrives rolled from the bass
            const at = T.next(0.5);
            A.bassNote(H.chordTone(0, -2), { at, vol: 0.075 * gate, dur: 4 });
            for (let k = 0; k < 4; k++) {
              A.bell(H.chordTone(2 + k * 2, 0), { at: at + k * 0.11, vol: 0.026 * gate, dur: 3.6, pan: -0.5 + k * 0.33, rev: 0.85 });
            }
            continue;
          }
          const at = T.next(0.25);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.75;
          // PITCH IS COLOUR: deep in a bank the ladder is low, at the front it
          // is the top of it. Bigger cells sit lower on the ladder.
          const seam = 1 - Math.abs(ev.k - 0.5) * 2;
          const idx = Math.round(1 + seam * 10 - ev.size * 3);
          const vol = (0.014 + ev.size * 0.026) * gate;
          const dur = 1.1 + ev.size * 2.6;
          if (seam > 0.62) {
            // at the front the paint tears: glass, high, with the tear on it
            A.bell(H.chordTone(idx, 1), { at, vol, dur, pan, rev: 0.85, role: 'bells' });
            const clk = 4200 - ev.size * 2000;
            A.hit({ at, vol: 0.022 + ev.size * 0.03, dur: 0.05, freq: clk, q: 1.6, pan });
            if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('sfx', clk, 0.05 + ev.size * 0.05, at, 0.06);
          } else if (ev.k < 0.5) {
            // the warm bank is woody
            A.pluck2(H.chordTone(idx, 0), { at, vol: vol * 1.15, dur, pan, rev: 0.55, del: 0.1 });
          } else {
            // the cool bank is glass, but sits below the front
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
