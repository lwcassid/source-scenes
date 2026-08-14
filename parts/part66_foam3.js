/* ---------- SRC-36.3 · FOAM BLOOM V3 (the dye) ---------- */
/* The hash is a Lehmer generator mod 65537 on small integers. Every
   intermediate stays under 2^24, so a float32 GPU and a float64 CPU compute
   BIT-IDENTICAL values — which is the whole trick: the CPU can enumerate the
   exact same cells the shader is drawing and hear them let go. */
const FOAM3_RND3 = (a, b, salt, out) => {
  let x = (a * 311 + b * 719 + salt * 37) % 65536;
  if (x < 0) x += 65536;
  for (let k = 0; k < 3; k++) {
    x = (x * 75 + 74) % 65537;
    const hi = Math.floor(x / 256);
    x = ((x - hi * 256) * 257 + hi * 131 + 7) % 65537;
    out[k] = x / 65537;
  }
  return out;
};
/* the dye body: a union of lobed metaballs, one per open crevice. Mirrors
   dyeF() in the shader exactly. Returns "thickness", ~1 at a pool's heart. */
const FOAM3_DYE = (s, x, y, t) => {
  let acc = 0;
  for (let i = 0; i < s.open && i < 8; i++) {
    const v = s.vents[i];
    if (v.R < 0.004) continue;
    const dx = x - v.x, dy = y - v.y;
    if (Math.abs(dx) > v.R * 2.2 || Math.abs(dy) > v.R * 2.2) continue;
    const nx = dx / Math.max(v.R, 1e-4), ny = dy / Math.max(v.R, 1e-4);
    const r = v.R * (1 + 0.26 * Math.sin(nx * 2.6 + ny * 1.7 + t * 0.19 + i * 1.7)
                       + 0.16 * Math.sin(ny * 3.3 - nx * 2.1 - t * 0.13 + i * 3.1));
    const q = Math.hypot(dx, dy) / Math.max(r, 1e-4);
    acc += Math.exp(-q * q * q * 1.1);
  }
  return acc;
};
const FOAM3_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uBoil, uOoze, uU;',
  'uniform vec2 uRes;',
  'uniform int uNV;',
  'uniform vec3 uVent[8];',
  'uniform vec4 uFlash[6];',
  'const float TAU = 6.28318530718;',
  // --- the CPU-identical hash ---------------------------------------------
  // three hashes off ONE chain — three separate chains was the single biggest
  // per-pixel cost. The byte swap between Lehmer rounds is what keeps it honest:
  // a pure LCG chain is affine in (gx, gy) and an affine hash lays its cells out
  // on a visible lattice, and consecutive raw LCG outputs are correlated.
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
  // --- the dye body -------------------------------------------------------
  'float dyeF(vec2 p){',
  '  float acc = 0.0;',
  '  for (int i = 0; i < 8; i++){',
  '    if (i >= uNV) break;',
  '    vec3 v = uVent[i];',
  '    if (v.z < 0.004) continue;',
  '    vec2 d = p - v.xy;',
  // outside this crevice's reach it contributes nothing — and skipping the two
  // sines is the single cheapest thing in the shader
  '    if (dot(d, d) > v.z * v.z * 4.4) continue;',
  '    vec2 n = d / max(v.z, 1e-4);',
  '    float r = v.z * (1.0 + 0.26*sin(n.x*2.6 + n.y*1.7 + uT*0.19 + float(i)*1.7)',
  '                        + 0.16*sin(n.y*3.3 - n.x*2.1 - uT*0.13 + float(i)*3.1));',
  '    float q = length(d) / max(r, 1e-4);',
  '    acc += exp(-q*q*q*1.1);',
  '  }',
  '  return acc;',
  '}',
  // --- the liquid the foam is sitting in ----------------------------------
  'vec2 flowW(vec2 p){',
  '  float t = uT * 0.055;',
  '  return vec2(sin(p.y*3.9 + t*1.4) + 0.55*sin(p.x*2.3 - t*0.9),',
  '              cos(p.x*3.3 - t*1.2) + 0.55*cos(p.y*2.7 + t*0.7));',
  '}',
  /* --- ONE Voronoi field, three lattices ---------------------------------
     Real foam is not layers of bubbles — it is ONE packing whose members
     happen to differ in size, so a big cell and the small cells beside it
     SHARE a wall. So all three lattices compete in a single multiplicatively
     weighted distance field: d = |p - site| / R. F2-F1 is then the whole
     Plateau network at once, and the fine sites naturally only win in the
     interstices left over near walls and junctions — which is exactly where
     real foam puts its clusters of tiny cells. */
  'void lat(vec2 p, float U, float salt, float rmin, float rspan, float thick, float slow,',
  '         float rmul, float ca, float sa, inout vec3 F, inout vec3 B, inout vec2 SP){',
  // each lattice is turned by its own angle — three axis-aligned lattices read
  // as rows of bubbles, and rows are the one thing real foam never has
  '  vec2 q = vec2(p.x * ca - p.y * sa, p.x * sa + p.y * ca) + vec2(0.173, 0.411) * salt;',
  '  vec2 g0 = floor(q / U);',
  '  for (int j = -1; j <= 1; j++){',
  '  for (int i = -1; i <= 1; i++){',
  '    vec2 gg = g0 + vec2(float(i), float(j));',
  '    vec3 h = rnd3(gg.x, gg.y, salt);',
  '    float hx = h.x, hy = h.y, hz = h.z;',
  '    vec2 site = (gg + vec2(0.5) + (vec2(hx, hy) - 0.5) * 0.88) * U;',
  '    float rate = (0.030 + uBoil * 0.26) * (0.55 + hz * 1.1) * slow;',
  '    float ph = fract(hz * 7.31 + hx * 3.17 + uT * rate);',
  // a cell swells, holds, then is squeezed out by its neighbours
  '    float grow = smoothstep(0.0, 0.26, ph) * (1.0 - smoothstep(0.86, 1.0, ph));',
  '    float R = U * (rmin + hy * hy * rspan) * (0.55 + 0.45 * thick) * (0.26 + 0.74 * grow) * rmul;',
  '    float d = length(q - site) / max(R, 1e-4);',
  '    if (d < F.x){ F.z = F.y; F.y = F.x; F.x = d; B = vec3(ph, hz, R);',
  // hand the winning site back in pa-space: the dye is asked about the CELL,
  // not about the pixel, and that is what makes the spill end on a wall
  '      vec2 sq = site - vec2(0.173, 0.411) * salt;',
  '      SP = vec2(sq.x * ca + sq.y * sa, -sq.x * sa + sq.y * ca); }',
  '    else if (d < F.y){ F.z = F.y; F.y = d; }',
  '    else if (d < F.z){ F.z = d; }',
  '  }}',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  // ADVECTION: the whole film crawls with the liquid under it
  '  float wa = 0.011 + uBoil * 0.020;',
  '  vec2 pa = p + flowW(p * 2.4) * wa;',
  '  float acc = dyeF(pa);',
  '  if (acc < 0.13){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float thick = smoothstep(0.32, 1.15, acc);',
  // a slow wobble at cell scale so no wall is ever a lattice-straight line
  '  pa += uU * 0.10 * vec2(sin(pa.y * 17.0 + uT * 0.11), cos(pa.x * 15.0 - uT * 0.09));',
  '  vec3 F = vec3(1e9), B = vec3(0.0, 0.0, uU * 0.4); vec2 SP = pa;',
  '  lat(pa, uU * 1.80, 21.0, 0.44, 0.30, thick, 0.42, 1.0, 1.0, 0.0, F, B, SP);',
  '  lat(pa, uU,        1.0,  0.30, 0.30, thick, 1.00, 1.0, 0.9323, 0.3616, F, B, SP);',
  // a small cell can only live where the packing has left it room — so the
  // fine lattice is given radius ONLY near the coarse walls and junctions.
  // Away from them it can never win, and the big cells stay clean.
  '  float gap = 1.0 - smoothstep(0.03, 0.30, F.y - F.x);',
  // squared: small cells crowd the JUNCTIONS, where the packing leaves the
  // most room, and only sparsely line a plain two-cell wall
  '  gap *= gap;',
  '  if (gap > 0.10) lat(pa, uU * 0.42, 11.0, 0.34, 0.40, thick, 1.90, gap * (0.75 + 0.25 * uBoil), 0.6216, -0.7834, F, B, SP);',
  // F2-F1 alone collapses every cell onto its medial axis and each interior
  // renders as a little star. Blending the 2nd and 3rd neighbour with a SMOOTH
  // min rounds the thin spot back into a pool, which is what a real film does.
  // THE DYE FILLS THE FOAM CELL BY CELL. Asking the dye field about the pixel
  // fades the mass out through the middle of cells and reads as fog; asking it
  // about the cell that owns the pixel makes the boundary run along films, and
  // leaves half-filled cells at the advancing rim — which is what the
  // reference actually shows.
  '  float accC = dyeF(SP);',
  '  float insideC = smoothstep(0.30, 0.52, accC);',
  '  if (insideC < 0.002){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float hh = clamp(0.5 + 0.5 * (F.z - F.y) / 0.30, 0.0, 1.0);',
  '  float f23 = mix(F.z, F.y, hh) - 0.30 * hh * (1.0 - hh);',
  '  float D = f23 - F.x;',
  '  float J = F.z - F.x;',
  '  float life = B.x, seed = B.y, R = B.z;',
  // wall thickness back in WORLD units: a fat wall on a big cell, a fine one
  // on a small cell — which is how the reference reads.
  '  float rel = max(R / (uU * 0.42), 0.06);',
  '  float rp = sqrt(rel);',
  '  float Dn = D * rp;',
  '  float Jn = J * rp;',
  // ---- shading: deep crimson wall -> pale pink film -> white where thinnest
  '  float side = smoothstep(-0.5, 0.5, p.x / max(0.5 * uRes.x / uRes.y, 0.001));',
  '  vec3 wallA = vec3(0.20, 0.004, 0.035), wallB = vec3(0.17, 0.006, 0.10);',
  '  vec3 midA  = vec3(0.86, 0.030, 0.13),  midB  = vec3(0.74, 0.022, 0.33);',
  '  vec3 filmA = vec3(1.00, 0.32, 0.38),   filmB = vec3(0.95, 0.27, 0.56);',
  '  vec3 cWall = mix(wallA, wallB, side);',
  '  vec3 cMid  = mix(midA,  midB,  side);',
  '  vec3 cFilm = mix(filmA, filmB, side);',
  '  vec3 cThin = vec3(1.0, 0.90, 0.92);',
  '  vec3 col = mix(cWall, cMid, smoothstep(0.02, 0.24, Dn));',
  '  col = mix(col, cFilm, smoothstep(0.20, 0.62, Dn));',
  // a Plateau junction is a fatter knot of liquid than a plain wall
  '  col = mix(col, cWall * 0.85, (1.0 - smoothstep(0.02, 0.20, Jn)) * 0.75);',
  // the film is thinnest at the crown of a big, mature cell — that is the bloom
  '  float big = smoothstep(0.35, 1.20, rel);',
  '  float thin = smoothstep(0.68, 1.20, Dn) * smoothstep(0.10, 0.42, life) * big;',
  '  col = mix(col, cThin, thin * 0.62);',
  // no two cells in a real foam are lit the same
  '  col *= 0.90 + 0.20 * seed;',
  // a cell about to let go goes bright and papery just before it does
  '  float going = smoothstep(0.84, 0.97, life) * (1.0 - smoothstep(0.97, 1.0, life));',
  '  col += vec3(1.0, 0.62, 0.72) * going * smoothstep(0.05, 0.45, Dn) * 0.40;',
  // the meniscus at the edge of the spill: dye piles up where it stops
  '  float ee = (accC - 0.40) / 0.13; float edge = exp(-ee * ee);',
  '  col = mix(col, mix(cMid, cWall, 0.45), edge * 0.80);',
  '  col += cMid * edge * 0.25;',
  // wet: a slow broad sheen riding the flow
  '  float sheen = 0.5 + 0.5 * sin(pa.x * 3.1 + pa.y * 2.2 + uT * 0.13);',
  '  col *= 0.90 + 0.17 * sheen;',
  '  col *= insideC * (0.55 + 0.45 * uPres);',
  // ---- the craters the CPU heard --------------------------------------
  '  for (int i = 0; i < 6; i++){',
  '    vec4 f = uFlash[i];',
  '    if (f.w <= 0.001) continue;',
  '    float rr = f.z * (1.0 + (1.0 - f.w) * 0.5);',
  '    float dd = abs(length(pa - f.xy) - rr) / (f.z * 0.22 + 0.002);',
  '    col += vec3(1.0, 0.74, 0.82) * exp(-dd * dd) * f.w * 0.55 * insideC;',
  '  }',
  // soft shoulder: a foam that clips to white loses the walls that ARE the picture
  '  col = col / (1.0 + col * 0.42);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

/* V2 drew bubbles. V3 draws a MATERIAL: a fragment shader evaluates a
   multiplicatively-weighted Voronoi in a slowly-advected coordinate frame, so
   the picture is a packed film of cells of wildly varying size whose walls meet
   at real Plateau junctions, with clusters of tiny cells wedged into the gaps.
   The foam only exists inside a dye field seeping out of eight crevices.
   Every cell's life (grow → thin → let go) is a pure function of a per-site
   hash and time, which means the CPU can compute the SAME lifecycle the shader
   is drawing: the music is read off the simulation, not invented next to it. */
reg({
  id: 'SRC-36.3', family: 'SRC-36', ver: 3, title: 'Foam Bloom V3', tech: 'FOAM SHADER / WEIGHTED VORONOI FILM',
  music: {
    bpm: 68, root: 45, mode: 'aeolian', chordBars: 4,
    chords: [
      [0, 7, 15, 19, 26],   // Am9
      [0, 8, 15, 20, 22],   // Fmaj9/A
      [0, 5, 12, 17, 20],   // Dm11/A
      [0, 7, 14, 17, 22]    // Am11
    ],
    chordNames: ['Am9', 'Fmaj9/A', 'Dm11/A', 'Am11']
  },
  fx: { bloom: 0.3 },
  tags: ['OIL DYE FROM CREVICES', 'PACKED FILM CELLS', 'PLATEAU WALLS', 'AMBIENT'],
  desc: 'Crimson dye is seeping into the frame out of eight small crevices and turning to foam as it comes. Not bubbles floating in a void — a material: a lobed body of packed film cells of wildly varying size, pale pink translucent interiors going white where the film is thinnest, deep crimson walls meeting at Plateau junctions, clusters of tiny cells wedged into every gap. The whole packing crawls with the liquid it sits in, cells swelling, being squeezed by their neighbours, and letting go. It is a macro shot of something wet, seen from directly above, at the speed of syrup.',
  interact: 'R = THE OOZE. Draw in and two crevices are weeping a small pool each; reach out and more crevices open, the pools swell, run together and finally flood the frame with dye. That is the slow hand — the shape of the picture. L = THE BOIL. How hard the liquid is working: drawn in, the film is nearly still and the cells are big and lazy; reach out and the whole body churns, cells forming and letting go everywhere, the packing driven finer and finer. A wide still flood and a small furious pool are both available, and both are worth sitting in.',
  sound: 'Ambient by design — no drums anywhere in it. Each open crevice holds one pad voice (role: pad), so the chord literally thickens as the dye spreads: two crevices is an open fifth, eight is the whole voicing, and a crevice opening enters rolled from the bottom. The boil is two layers: a wet bandpassed fizz whose brightness and level follow how much of the film is letting go, and the letting-go itself — the CPU runs the same cell lifecycle the shader draws, so every burst it hears is a cell you can see vanish. Only the bigger cells are given a note, a short glass bell (bells) at the top of the ladder, panned to where it popped, landing on the next sixteenth; small ones are heard as fizz, not as notes. Under everything, a sub pedal on A that never moves. Ableton: pad ch2 (CC74 = ooze), bells ch5, texture ch6 = fizz (CC74 = boil), bass ch3.',

  init(P) {
    const s = {
      pres: 0, boil: 0, ooze: 0, cover: 0, open: 2, popRate: 0, popCd: 0,
      vents: [], flash: [], evq: [], life: 0, cells: 0, _openT: 0,
      ax: 0.8, ay: 0.5, U: 0.100, noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    // eight crevices, spread so their pools meet as they grow
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + P.rand() * 0.7;
      const d = i === 0 ? 0.06 : 0.28 + P.rand() * 0.42;
      s.vents.push({
        x: clamp(Math.cos(a) * d * s.ax * 1.7, -s.ax * 0.82, s.ax * 0.82),
        y: clamp(Math.sin(a) * d * s.ay * 1.7, -s.ay * 0.8, s.ay * 0.8),
        R: 0, Rt: 0, seed: P.rand(), ord: 0
      });
    }
    // crevices open from the middle outward, so a small ooze is a pool in the
    // frame rather than two pools stuck in one corner
    for (const v of s.vents) v.ord = Math.hypot(v.x / s.ax, v.y / s.ay) + P.rand() * 0.18;
    s.vents.sort((a, b) => a.ord - b.ord);
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    // the foam is soft — render under-sized and let drawImage fatten it. That
    // is also what keeps a per-pixel Voronoi inside budget on weak GL.
    const sc = Math.min(1, 580 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const uni = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uPres: { value: 0 }, uBoil: { value: 0 }, uOoze: { value: 0 },
      uNV: { value: 2 }, uU: { value: s.U },
      uVent: { value: new Float32Array(24) },
      uFlash: { value: new Float32Array(24) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FOAM3_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn; T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.boil += (clamp(inp.L) - s.boil) * Math.min(1, dt * 6);
    s.ooze += (clamp(inp.R) - s.ooze) * Math.min(1, dt * 6);
    s.popCd = Math.max(0, s.popCd - dt);

    /* ---- THE OOZE: crevices open one at a time, their pools swell -------- */
    const wantOpen = 2 + Math.round(s.ooze * (s.vents.length - 2));
    if (wantOpen !== s.open) {
      s._openT += dt;
      if (s._openT > 0.22) {
        if (wantOpen > s.open) { s.open++; s.evq.push({ vent: 1 }); } else s.open--;
        s._openT = 0;
      }
    } else s._openT = 0;
    let cov = 0;
    for (let i = 0; i < s.vents.length; i++) {
      const v = s.vents[i];
      v.Rt = i < s.open ? (0.15 + s.ooze * 0.52) * (0.72 + v.seed * 0.56) : 0;
      // liquid arrives and leaves at the speed of syrup
      v.R += (v.Rt - v.R) * Math.min(1, dt * (v.Rt > v.R ? 0.85 : 1.2));
      cov += Math.PI * v.R * v.R;
    }
    s.cover += (clamp(cov / (4 * s.ax * s.ay) / 1.05) - s.cover) * Math.min(1, dt * 2);

    /* ---- THE BOIL: the SAME cell lifecycle the shader is drawing ---------
       Every lattice site's life is fract(hash + t * speed). Crossing 1.0 is a
       cell letting go — the shader shrinks it away and blooms, the CPU hears
       it. One model, two consumers: what lights up is exactly what sounds. */
    const life0 = s.life;
    s.life += dt;
    const spd = 0.030 + s.boil * 0.26;
    let popped = 0, cells = 0, bestR = 0, bestX = 0, bestY = 0;
    const hh = s._hh || (s._hh = [0, 0, 0]);
    // the same two lattices lat() walks in the shader, with the same numbers
    for (let L = 0; L < 2; L++) {
      const U = L === 0 ? s.U * 1.80 : s.U;
      const salt = L === 0 ? 21 : 1;
      const rmin = L === 0 ? 0.44 : 0.30, rspan = L === 0 ? 0.30 : 0.30;
      const slow = L === 0 ? 0.42 : 1.0;
      const ca = L === 0 ? 1.0 : 0.9323, sa = L === 0 ? 0.0 : 0.3616;
      const ox = 0.173 * salt, oy = 0.411 * salt;
      // the lattice lives in the ROTATED frame; walk a box big enough to cover
      // the rotated frame, then turn each site back into screen space
      const rad = Math.hypot(s.ax, s.ay);
      const gx0 = Math.floor((-rad + ox) / U) - 1, gx1 = Math.ceil((rad + ox) / U) + 1;
      const gy0 = Math.floor((-rad + oy) / U) - 1, gy1 = Math.ceil((rad + oy) / U) + 1;
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          FOAM3_RND3(gx, gy, salt, hh);
          const hx = hh[0], hy = hh[1], hz = hh[2];
          const qx = (gx + 0.5 + (hx - 0.5) * 0.88) * U - ox;
          const qy = (gy + 0.5 + (hy - 0.5) * 0.88) * U - oy;
          const cx = qx * ca + qy * sa, cy = -qx * sa + qy * ca;
          if (Math.abs(cx) > s.ax + U || Math.abs(cy) > s.ay + U) continue;
          const acc = FOAM3_DYE(s, cx, cy, s.life);
          if (acc < 0.44) continue;
          cells++;
          const rate = spd * (0.55 + hz * 1.1) * slow;
          const ph0 = hz * 7.31 + hx * 3.17;
          if (Math.floor(ph0 + s.life * rate) > Math.floor(ph0 + life0 * rate)) {
            popped++;
            // the radius the shader gave this site at the top of its life
            const x = clamp((acc - 0.32) / 0.83), thick = x * x * (3 - 2 * x);
            const R = U * (rmin + hy * hy * rspan) * (0.55 + 0.45 * thick);
            if (R > bestR) { bestR = R; bestX = cx; bestY = cy; }
          }
        }
      }
    }
    s.cells = cells;
    s.popRate += (popped / Math.max(dt, 1e-3) - s.popRate) * Math.min(1, dt * 2.5);
    if (bestR > 0) {
      s.flash.push({ x: bestX, y: bestY, r: bestR, a: 1 });
      if (s.flash.length > 6) s.flash.shift();
      // only the bigger cells are worth a note; the rest are heard as fizz
      if (bestR > s.U * 0.42 && s.popCd <= 0) {
        s.popCd = 0.14;
        s.evq.push({ r: bestR / s.U, x: (bestX / s.ax) * 0.5 + 0.5 });
        if (s.evq.length > 10) s.evq.shift();
      }
    }
    for (let i = s.flash.length - 1; i >= 0; i--) {
      const f = s.flash[i];
      f.a -= dt * 2.2;
      if (f.a <= 0) s.flash.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    if (s.noGL || !P._three) {
      // graceful 2D fallback (no THREE): the dye, without the film
      g.fillStyle = '#04000a'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      for (let i = 0; i < s.open; i++) {
        const v = s.vents[i];
        if (v.R < 0.01) continue;
        const x = w / 2 + v.x * mn, y = h / 2 + v.y * mn, r = v.R * mn;
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, 'rgba(255,190,205,0.85)');
        gr.addColorStop(0.55, 'rgba(215,25,70,0.75)');
        gr.addColorStop(1, 'rgba(90,0,25,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
      g.fillStyle = 'rgba(255,175,205,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('FOAM BLOOM V3 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres;
    u.uBoil.value = s.boil; u.uOoze.value = s.ooze;
    u.uNV.value = s.open; u.uU.value = s.U;
    const vv = u.uVent.value;
    for (let i = 0; i < 8; i++) {
      const v = s.vents[i];
      vv[i * 3] = v.x; vv[i * 3 + 1] = v.y; vv[i * 3 + 2] = v.R;
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
    g.fillStyle = 'rgba(255,175,205,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('CREVICES ' + s.open + '/8   OOZE ' + Math.round(s.ooze * 100) +
      '   BOIL ' + Math.round(s.boil * 100) + '   CELLS ' + s.cells +
      '   BURSTS/S ' + s.popRate.toFixed(1) + (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the wet fizz: what the small cells are, all together ----------- */
    const n1 = v.noise(), f1 = v.filter('bandpass', 1400, 0.9), g1 = v.g(0.004);
    const n2 = v.noise(), f2 = v.filter('highpass', 4200, 0.7), g2 = v.g(0.002);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);

    /* --- ONE PAD VOICE PER OPEN CREVICE: the chord thickens as it spreads */
    const NV = 8;
    const pads = A.padVoices(v, NV, { type: 'triangle', gain: 0.0001, cutoff: 340, q: 0.6 });
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.012, cutoff: 180, q: 0.5 });
    const place = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      for (let i = 0; i < NV; i++) pads[i].set(H.chordTone(i, i > 4 ? 0 : -1), glide + i * 0.01);
    };
    place(0.05);
    H.onChord(() => place(0.2));
    v.fadeIn(1, 2);

    let lastOpen = 2;
    return {
      tick(inp, dt) {
        const s = P.state;
        const gate = 0.25 + s.pres * 0.75;
        const boil = s.boil || 0, cover = s.cover || 0;

        // the fizz IS the small cells — it follows how much is letting go
        const fz = clamp((s.popRate || 0) / 45);
        A.set(g1.gain, (0.002 + fz * 0.016 + boil * cover * 0.006) * gate, 0.25);
        A.set(f1.frequency, 700 + fz * 2200 + boil * 900, 0.3);
        A.set(g2.gain, (0.0004 + fz * 0.005) * gate, 0.25);
        sub[0].level(0.008 + cover * 0.01, 0.6);

        for (let i = 0; i < NV; i++) {
          const on = i < s.open;
          pads[i].level(on ? (0.012 - i * 0.0008) * (0.4 + cover * 0.6) * gate : 0.0001, 0.9);
          pads[i].bright(200 + cover * 300 + boil * 260, 0.5);
        }
        if (s.open > lastOpen) {
          // a new crevice arrives rolled from the bottom, never as a block
          const at = T.next(0.5);
          A.bassNote(H.chordTone(0, -1), { at, vol: 0.05 * gate, dur: 3 });
          for (let k = 0; k < 3; k++) {
            A.bell(H.chordTone(s.open + k * 2, 0), { at: at + k * 0.09, vol: 0.024 * gate, dur: 3.4, pan: (s.open % 2 ? 0.4 : -0.4), rev: 0.8 });
          }
        }
        lastOpen = s.open;

        /* ---- only the bigger cells get a note --------------------------- */
        let ev, i2 = 0;
        while ((ev = s.evq.shift()) && i2 < 3) {
          i2++;
          if (ev.vent) continue;
          const at = T.next(0.25);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.7;
          const k = clamp((ev.r - 0.42) / 1.10);
          const idx = Math.round(12 - k * 7);
          A.bell(H.chordTone(idx, 1), { at, vol: (0.016 + (1 - k) * 0.016) * gate, dur: 1.6 + k * 1.4, pan, rev: 0.75 });
          // the wet click of the film breaking. A.hit is not one of the wrapped
          // helpers, so mirror it by hand — no drums in this scene, but every
          // audible event still has to reach Ableton.
          const clk = 3200 - k * 1600;
          A.hit({ at, vol: 0.02 + k * 0.03, dur: 0.05, freq: clk, q: 1.4, pan });
          if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('sfx', clk, 0.05 + k * 0.05, at, 0.06);
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', cover);
          MOut.expr('texture', boil);
          MOut.expr('bells', fz);
        }
      },
      stop() { v.kill(); }
    };
  }
});
