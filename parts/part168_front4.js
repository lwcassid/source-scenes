/* ---------- SRC-43.4 · CELL FRONT V4 (it listens, it doesn't speak) ----------
   Every version before this one was driven by two hands and answered with
   its own sound. V4 is the first scene built around AUDIO IN (grill-me
   session): it watches a real signal — a mic, a line-in from a mixer — and
   the picture is what that signal looks like poured across the canvas. It
   makes no sound of its own; there is nothing to route out.
   THE TWO BANKS ARE NOW A SPECTRUM. Warm used to be the left hand, cool the
   right. Now warm is BASS energy and cool is TREBLE energy, summed across
   both input channels — the seam (front) stops being "wherever the hands
   balance" and becomes a real spectral-tilt reading: a bass-heavy passage
   floods marigold in from the left, a bright/hi-hat-heavy one floods magenta
   from the right, and weld — the two banks meeting — means the material
   genuinely has both ends of the spectrum in it at once, not just volume.
   BLOOMS ARE HITS, NOT WEATHER. V3 grew blooms off average energy on a
   probabilistic timer; V4 grows nothing on its own. A detected onset spawns
   one directly (louder hit, bigger bloom) and gives whichever existing bloom
   is closest to ready a decisive push to finish — the picture visibly
   punches on the beat instead of drifting toward it. Stereo pan biases
   WHERE a hit lands, so a hard-panned kick pops toward that side of frame.
   HANDS NEVER LEFT. Reaching in still floods a bank exactly like it always
   did — audio and hands both feed the same two numbers, whichever is
   louder in the moment wins, so a facilitator can always play this by hand
   if the audio chain is down. Silence gets the same idle-breathing drift
   every still scene gets; nothing here ever goes fully dead. ------ */
const CF4_LOBES = s => [
  [-s.offW, -0.05, s.Rw], [0, 0.02, s.Rm], [s.offC, 0.05, s.Rc]
];
const CF4_POOL = (s, x, y) => {
  let acc = 0;
  for (const l of CF4_LOBES(s)) {
    if (l[2] < 0.004) continue;
    const q = Math.hypot(x - l[0], y - l[1]) / l[2];
    acc += Math.exp(-q * q * q * 1.15);
  }
  return acc;
};
const CF4_BAND = (s, x, y) => {
  const w = 0.070 * Math.sin(y * 5.3 + s.life * 0.13)
          + 0.040 * Math.sin(y * 9.1 - s.life * 0.09)
          + 0.020 * Math.sin(y * 14.7 + s.life * 0.17);
  return clamp(((x - s.front - w) / 0.52) * 0.5 + 0.5);
};
const CF4_FS = [
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
  '  float kSite = bandK(SP);',
  '  float nfS = exp(-pow((kSite - 0.5) / 0.16, 2.0));',
  '  float kc = clamp(kSite + (SH.z - 0.5) * (0.20 + 0.20 * nfS), 0.0, 1.0);',
  '  float rgf = fract(SH.z * 29.71 + kSite * 0.13);',
  '  kc = mix(kc, mix(1.0 - kSite, 0.52, 0.30 + 0.45 * fract(SH.x * 7.31)), step(0.900, rgf));',
  '  float hL = SH.y;',
  '  float lum = mix(0.62 + 0.80 * pow(hL, 1.1), 0.07, step(fract(hL * 13.7), 0.17));',
  '  vec3 base = ramp(kc) * lum;',
  '  vec3 halo = mix(C_CREAM, C_CYAN, smoothstep(0.44, 0.62, kSite));',
  '  vec3 rimC = mix(ramp(kc) * (0.85 + 0.75 * lum), halo, 0.34);',
  '  float gg2 = grainF(pa * 3.7 + vec2(19.0, 4.0));',
  '  vec3 ground = mix(vec3(0.310, 0.300, 0.360), ramp(kSite) * 0.40, 0.22) * (0.45 + 1.00 * gg2);',
  '  vec3 col = ground;',
  '  float Ud = uU * 0.155;',
  '  vec2 dof = vec2(0.61, 0.29);',
  '  vec2 gd = floor((pa + dr2 * 0.7 + dof) / Ud);',
  '  vec3 hd = rnd3(gd.x, gd.y, 53.0);',
  '  vec2 sd = (gd + vec2(0.5) + (hd.xy - 0.5) * 0.9) * Ud - dof - dr2 * 0.7;',
  '  float Rd = Ud * (0.10 + 0.30 * hd.z * hd.z);',
  '  float dotd = (length(pa - sd) - Rd) / Ud;',
  '  vec3 dotC = mix(ground * 0.20, ramp(kSite) * (0.30 + 0.9 * hd.z), step(0.45, fract(hd.z * 31.0)));',
  '  col = mix(col, dotC, (1.0 - smoothstep(-0.06, 0.02, dotd)) * step(0.0, dS));',
  '  float u = -dS / max(SR, 1e-4);',
  '  float e = -dS / (uU * 0.055);',
  '  float j = SH.x;',
  '  col = mix(col, ground * 0.22, exp(-pow((e + 0.85) / 0.70, 2.0)));',
  '  col = mix(col, rimC, smoothstep(-0.50, 0.60, e));',
  '  col = mix(col, base, smoothstep(1.7, 4.2, e));',
  '  col = mix(col, base * 0.36, exp(-pow((u - (0.40 + j * 0.28)) / 0.035, 2.0))',
  '                              * step(0.48, fract(j * 11.3)) * 0.60);',
  '  col = mix(col, mix(base * 0.34, base * 1.70 + vec3(0.03), step(0.5, fract(j * 17.3))),',
  '            smoothstep(0.70, 1.02, u) * step(0.55, j) * 0.50);',
  '  col += vec3(0.88, 0.96, 1.0) * exp(-pow((u + 0.16) / 0.18, 2.0))',
  '       * exp(-pow((kSite - 0.5) / 0.070, 2.0)) * (0.20 + 0.50 * uHeat);',
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
  id: 'SRC-43.4', family: 'SRC-43', ver: 4, title: 'Cell Front V4', tech: 'DRIFTING CELL FIELD / AUDIO-REACTIVE, NOT AUDIO-GENERATING',
  audioIn: true,
  fx: { bloom: 0.30 },
  tags: ['POURED PAINT', 'DRIFTING CELLS', 'AUDIO IN', 'LISTENS, DOESN’T SPEAK'],
  desc: 'The same poured-paint material every Cell Front has had — islands in a slate ground, each in its own shadow, each with a bright rim and often a pupil, pinhead speckle everywhere between — but this version is not driven by hands. It listens. A real audio signal, routed into the wall’s AUDIO IN, becomes the picture: bass energy floods the warm marigold bank, treble energy floods the cool magenta one, and where both are present the two banks weld into one sheet with a live seam running through it, exactly where the mix’s spectral balance sits in the moment. Blooms no longer grow on a timer — they spawn on a detected hit, sized by how loud it was, and a hit also finishes off whichever bloom is closest to ready, so the picture visibly punches with the beat instead of drifting toward it.',
  interact: 'This scene reacts to whatever is playing into the wall’s audio input (SHOW CHECK → AUDIO IN, or MAP → Audio in). BASS energy is the warm bank, TREBLE energy is the cool bank — a bass-heavy passage pushes the seam toward marigold, a bright one pushes it toward magenta, and full-spectrum sound welds the two into one sheet. Stereo balance biases where a new bloom lands left/right of frame. Hands still work exactly as before — reaching in with L or R floods a bank directly — audio and hands feed the same two numbers, whichever is louder in the moment wins, so this is playable by hand if nothing is connected to AUDIO IN.',
  sound: 'This version makes no sound of its own — nothing to route out, nothing to map in Ableton. It listens instead: connect a real source (a DJ mixer’s line-out, a room mic, an aux send) to the machine’s audio input, then AUDIO IN → CONNECT (SHOW CHECK will flag it if a scene needing audio is queued and nothing is hooked up). Once connected, press SET REST with the room quiet so the scene can tell silence from music — the same idea as the hands’ SET REST, just for a microphone instead of a sensor.',

  init(P) {
    const s = {
      pres: 0, warm: 0, cool: 0, heat: 0, weld: 0, front: 0,
      Rw: 0, Rc: 0, Rm: 0, offW: 0.1, offC: 0.1, ax: 0.8, ay: 0.5, U: 0.050,
      blooms: [], flash: [], life: 0, popped: 0, popRate: 0,
      cover: 0, welded: false, _prevOnset: 0,
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
      fragmentShader: CF4_FS
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

    // WARM = bass, COOL = treble — the grill-me decision. Hands never left:
    // audio and hands both feed the same two numbers, whichever is louder
    // in the moment wins, so this is playable by hand with nothing plugged
    // into AUDIO IN.
    //
    // Nima found this stuck permanently near-max regardless of what the mic
    // heard — root cause: inp.L/inp.R don't idle at 0 when nobody's there.
    // The library wall's ambient ghost-drift can leave chan.L/R.v frozen
    // near an EXTREME value the instant a scene opens with GHOSTS off (mode
    // goes to 'drift', which HOLDS wherever the wall last left it rather
    // than resetting) — so Math.max(audioBand, inp.L/R) was silently
    // comparing real audio against a stale, meaningless leftover number
    // forever, not "nobody's touching the hands." Only actually honor a
    // hand while chan.mode is 'live' — a real pointer/key/MIDI event within
    // the last few seconds — the same test presence already used below.
    const handLLive = chan.L.mode === 'live', handRLive = chan.R.mode === 'live';
    const bassSrc = handLLive ? Math.max(inp.audio.bass, inp.L) : inp.audio.bass;
    const trebleSrc = handRLive ? Math.max(inp.audio.treble, inp.R) : inp.audio.treble;
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    const live = (handLLive || handRLive || audioLive) ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.warm += (clamp(bassSrc) - s.warm) * Math.min(1, dt * 6);
    s.cool += (clamp(trebleSrc) - s.cool) * Math.min(1, dt * 6);
    // silence gets the same idle-breathing drift every still scene gets —
    // there is no difference between "nobody's playing" and "nothing's
    // coming through the mic" from the audience's side.
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
    s.welded = weldedNow;

    /* ---- blooms: onset-driven, not ambient (Q8). A hit spawns one sized by
       how loud it was, and separately gives whichever existing bloom is
       closest to ready a decisive push to finish — heat/level still shape
       how a bloom GROWS and DRIFTS once it exists, only the decision of
       WHEN a new one starts is onset's now. */
    const onsetEdge = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    if (onsetEdge) {
      if (s.blooms.length < 6) {
        let bx = 0, by = 0, ok = false;
        const bias = clamp(inp.audio.pan, -1, 1) * s.ax * 0.55;
        for (let k = 0; k < 12 && !ok; k++) {
          bx = (k % 2 === 0 && s.weld > 0.2) ? s.front + (P.rand() - 0.5) * 0.30
            : bias + (P.rand() * 2 - 1) * s.ax * 0.6;
          by = (P.rand() * 2 - 1) * s.ay * 0.9;
          if (CF4_POOL(s, bx, by) > 0.44) ok = true;
        }
        if (ok) {
          const big = clamp(0.35 + inp.audio.level * 0.85);
          s.blooms.push({ x: bx, y: by, r: s.U * 0.4, Rt: s.U * (0.80 + big * big * 0.80), seed: P.rand() });
        }
      }
      let best = -1, bestFrac = 0.55;
      for (let i = 0; i < s.blooms.length; i++) {
        const b = s.blooms[i], frac = b.r / b.Rt;
        if (frac > bestFrac) { bestFrac = frac; best = i; }
      }
      if (best >= 0) s.blooms[best].r = s.blooms[best].Rt * 0.99;
    }
    let popped = 0;
    for (let i = s.blooms.length - 1; i >= 0; i--) {
      const b = s.blooms[i];
      const inPaint = CF4_POOL(s, b.x, b.y) > 0.44;
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
      CF4_LOBES(s).forEach((l, i) => {
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
      g.fillText('CELL FRONT V4 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres;
    u.uWarm.value = s.warm; u.uCool.value = s.cool;
    u.uHeat.value = s.heat; u.uFront.value = s.front; u.uU.value = s.U;
    const ll = u.uLobe.value, LB = CF4_LOBES(s);
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
    g.fillText('BASS ' + Math.round(s.warm * 100) + '   TREBLE ' + Math.round(s.cool * 100) +
      '   WELD ' + Math.round(s.weld * 100) + '   FRONT ' + (fr >= 0 ? '+' : '') + fr +
      '   PAN ' + inp.audio.pan.toFixed(2) + '   BLOOMS ' + s.blooms.length + '/6   HITS/S ' + s.popRate.toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
