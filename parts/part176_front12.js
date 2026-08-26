/* ---------- SRC-43.12 · CELL FRONT V12 (Ridge Loom's colors, painted by speed) ----------
   Nima on V11: limit the colors to RIDGE LOOM's — its violet floor
   #4900ff, orange summits #f36c3b and cyan summits #00edff — minus the
   yellow/accent (Cell Front's acid-chartreuse pivot is gone), and let the
   VELOCITY of CC1/CC2 introduce the color: how fast the left hand moves
   paints ORANGE into the LEFT side of the cloud, how fast the right hand
   moves paints CYAN into the RIGHT side. So the field rests violet like
   Ridge Loom's empty frame; a still hand adds nothing; a fast reach or
   pull floods its side with color that fades back over a couple of
   seconds. Side weights come from the cloud's own extent (bass lobe → treble
   lobe), not the screen. Everything else — kick, field, gating — is V11.
   ------ V11 notes follow ------
   Nima on V10: "much better, though it still feels like it's reacting
   too late to the kick." A research workflow + a new harness
   (tools/kicktest.mjs: synthetic 128 BPM techno fed into the real engine)
   measured why: the engine's frame-polled FFT onset landed ~60ms after
   the transient and false-fired on the 16th-note bassline, V10's 260ms
   refractory then ATE most real kicks behind those (2-42% caught), its hit
   sizing compared two smoothed signals so the first frames were under-
   sized, and the radius attack smoothing (14/s, ~70ms tau) sat downstream
   of the kick envelope. V11 fixes all four:
   · reads AUDIOIN.kick — the engine's new time-domain LP150 scanner
     (~5ms, sample-accurate timestamp) — via inp.audio.kick.n changing;
     falls back to onset's rising edge when no kick signal exists;
   · scene refractory 0.26s → 0.09s (the engine already gates at 90ms);
   · hit = 0.55 + 0.45·strength, then BACK-DATED: the envelope is seeded
     already advanced along its own decay by the hit's true age plus a
     LEAD (30ms, capture+display), so the drawn frame is where the swell
     should be for the vsync it lands on, not the moment it was computed;
   · the radius is split into a slowly-smoothed BASE (hides band motion)
     and an UNSMOOTHED kick multiplier applied per frame.
   Field cap, gating, palette, blooms: V10, verbatim.
   ------ V10 notes follow ------
   Nima on V9, live on the site with a real track: STILL too jittery and
   reactive, and it filled the whole frame with cloud almost all the time —
   "it should basically never do that." Two fixes on top of V9's two-clock
   split:
   · THE FIELD IS CAPPED. Radii now top out around a third of what V9
     allowed (compressive curve, base ≤ ~0.29 of min(w,h)), so a loud
     track is a big ensemble sitting in black, and only a kick on a peak
     ever brushes the frame edge. Spread follows suit.
   · THE KICK IS GATED. The engine's onset fires on any bass-band rise,
     which on a 16th-note bassline is every note — V9 re-armed the swell
     each time. V10 accepts a hit only after a 0.26s refractory (≥ ~230
     BPM max) and sizes it by how far the incoming bass jumps ABOVE its
     slow average, so bassline notes riding a steady level barely nudge
     it and the kick, which pokes above, owns it. Blooms follow the gate.
   · The slow bands are slower still (attack 1.4/s, release 0.9/s) and
     flux is scaled down; the radius release is softer.
   ------ V9 notes follow ------
   Nima's verdict on V8: too JITTERY on techno/house. With a full spectrum
   — kick, bassline and melody all at once — V8 let each pocket's radius
   chase its own band at 9/s attack, and FLUX (the reform swirl) was the
   derivative of those same fast bands, so every hi-hat and bassline note
   twitched a different cloud. The fix splits size into two jobs on two
   clocks:
   · THE KICK is the only thing that makes a cloud swell hard. `onset` is
     the engine's bass-band rise detector (tuned for four-on-the-floor), so
     a rising edge sets a per-pocket KICK envelope (instant up, ~a beat
     down) that balloons all three pockets together — bass hardest.
   · BASSLINE / MELODY set the size of the WHOLE FIELD, slowly: the three
     bands are eased at ~1.5/s into a FIELD scale that multiplies every
     radius and pushes the pockets apart, and each pocket's share of that
     field shifts only gently (0.75..1.25) with its own slow band — so a
     melody rising makes the ensemble grow, never one cloud jump.
   · FLUX now derives from the SLOW bands, so the field reforms on a real
     section change (bass drops out, a lead comes in), not on every note.
   Hands still paint (V8), blooms still pop on the kick, shader untouched
   apart from a small kick breath on the cell scale. ------ */
const CF12_LOBES = s => [
  [-s.offBass, -0.04, s.Rbass], [0, 0.05, s.Rmid], [s.offTreble, -0.04, s.Rtreble]
];
const CF12_POOL = (s, x, y) => {
  let acc = 0;
  for (const l of CF12_LOBES(s)) {
    if (l[2] < 0.004) continue;
    const q = Math.hypot(x - l[0], y - l[1]) / l[2];
    acc += Math.exp(-q * q * q * 1.15);
  }
  return acc;
};
const CF12_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uEnergy, uFlux, uKick, uBass, uMid, uTreble, uU;',
  'uniform float uVelL, uVelR;',   // hand-speed envelopes: orange on the left, cyan on the right
  'uniform vec2 uSpan;',           // x of the bass lobe (left) and treble lobe (right) — the side axis
  'uniform vec2 uRes;',
  'uniform vec3 uLobe[3];',       // bass, mid, treble — x,y,radius
  'uniform int uNB;',
  'uniform vec4 uBloom[8];',
  'uniform vec4 uFlash[6];',
  // RIDGE LOOM's three colors (V12): violet floor, orange and cyan summits.
  'const vec3 RL_VIOLET = vec3(0.286, 0.0, 1.0);',
  'const vec3 RL_ORANGE = vec3(0.953, 0.424, 0.231);',
  'const vec3 RL_CYAN   = vec3(0.0, 0.929, 1.0);',
  // side axis across the cloud's own extent: 1 at the bass lobe, 0 at the treble lobe
  'float sideL(vec2 p){ return 1.0 - smoothstep(uSpan.x, uSpan.y, p.x); }',
  'vec3 speedPaint(vec2 p){',
  '  float wl = sideL(p), wr = 1.0 - wl;',
  '  vec3 c = mix(RL_VIOLET, RL_ORANGE, clamp(wl * uVelL, 0.0, 1.0));',
  '  return mix(c, RL_CYAN, clamp(wr * uVelR, 0.0, 1.0));',
  '}',
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
  // proximity weights to each of the three pockets — used to blend the
  // hand-painted colors, not fixed band colors anymore.
  'vec3 lobeWeights(vec2 p){',
  '  float d0 = length(p - uLobe[0].xy) / max(uLobe[0].z, 1e-4);',
  '  float d1 = length(p - uLobe[1].xy) / max(uLobe[1].z, 1e-4);',
  '  float d2 = length(p - uLobe[2].xy) / max(uLobe[2].z, 1e-4);',
  '  return vec3(exp(-d0 * d0 * 1.3), exp(-d1 * d1 * 1.3), exp(-d2 * d2 * 1.3));',
  '}',
  'vec2 flowW(vec2 p, float amp){',
  '  float t = uT * 0.07;',
  '  return amp * vec2(sin(p.y * 3.7 + t * 1.3) + 0.5 * sin(p.x * 2.1 - t * 0.8),',
  '                     cos(p.x * 3.1 - t * 1.1) + 0.5 * cos(p.y * 2.5 + t * 0.6));',
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
  // FLUX (V7, unchanged): speed the drift/swirl when the audio is actually
  // CHANGING, not just when it's loud — settles to a calm drift when steady.
  '  float sp = 0.45 + 0.62 * uEnergy + 2.1 * uFlux;',
  '  float swirlAmp = 1.0 + 2.4 * uFlux;',
  '  vec2 pa = p + flowW(p * 2.1, (0.011 + uEnergy * 0.015) * swirlAmp);',
  '  vec2 dr0 = vec2( 0.0046,  0.0017) * uT * sp + flowW(p * 1.7 + vec2(0.0),   (0.011 + uEnergy * 0.014) * swirlAmp);',
  '  vec2 dr1 = vec2(-0.0032,  0.0039) * uT * sp + flowW(p * 2.4 + vec2(3.1),   (0.009 + uEnergy * 0.012) * swirlAmp);',
  '  vec2 dr2 = vec2( 0.0067, -0.0028) * uT * sp + flowW(p * 3.3 + vec2(6.7),   (0.007 + uEnergy * 0.010) * swirlAmp);',
  '  float ct = cos(uT * 0.030 + uFlux * 0.9), st = sin(uT * 0.030 + uFlux * 0.9);',
  '  vec2 rot = vec2(ct, st);',
  '  float acc = poolF(pa);',
  '  if (acc < 0.11){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float U0 = uU * 2.30, U1 = uU * 1.05, U2 = uU * 0.46;',
  '  float dS = 1e5, dH = 1e5, SR = uU * 0.30;',
  '  vec2 SP = pa; vec3 SH = vec3(0.5);',
  '  float cellSc = 0.68 + 0.60 * uEnergy + 0.22 * uFlux + 0.18 * uKick;',
  '  lay(pa, dr0, rot, U0, 1.0,  0.15, 0.44, 0.90 * cellSc, U0 * 0.22, dS, dH, SP, SH, SR);',
  '  lay(pa, dr1, rot, U1, 17.0, 0.20, 0.58, 0.95 * cellSc, U1 * 0.22, dS, dH, SP, SH, SR);',
  '  lay(pa, dr2, rot, U2, 31.0, 0.24, 0.54, 0.85 * cellSc, U2 * 0.24, dS, dH, SP, SH, SR);',
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
  '  vec3 wgt = lobeWeights(SP);',
  '  float wsum = wgt.x + wgt.y + wgt.z;',
  // V12: one color per cell, from where the cell sits on the side axis and
  // how fast each hand has been moving — no fixed per-pocket hue anymore.
  '  vec3 tint = speedPaint(SP);',
  // volumetric shading: bright core, soft luminous edge, nothing dark drawn
  // on top of it — the opposite of every earlier version's shadow ring.
  '  float u = -dS / max(SR, 1e-4);',
  '  float core = smoothstep(-0.30, 0.95, u);',
  '  float rim = exp(-pow((u - 0.10) / 0.42, 2.0)) * 0.55;',
  '  float turb = 0.82 + 0.34 * grainF(pa * 4.3 + vec2(3.0, 7.0));',
  '  float sparkle = 0.62 + 0.38 * SH.z;',
  // overlapping pockets read brighter — the "weld" moment, emergent from
  // density summing rather than a fourth hardcoded state
  '  float overlap = clamp(wsum - 0.55, 0.0, 1.6) * 0.65;',
  '  vec3 col = tint * (core + rim) * turb * sparkle * (1.0 + overlap);',
  '  col *= insideC * (0.55 + 0.45 * uPres);',
  '  for (int i = 0; i < 6; i++){',
  '    vec4 f = uFlash[i];',
  '    if (f.w <= 0.001) continue;',
  '    float rr = f.z * (1.0 + (1.0 - f.w) * 0.85);',
  '    float dd = abs(length(pa - f.xy) - rr) / (f.z * 0.22 + 0.002);',
  '    vec3 fc = speedPaint(f.xy);',
  '    col += fc * exp(-dd * dd) * f.w * 0.85 * insideC;',
  '  }',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.42);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-43.12', family: 'SRC-43', ver: 12, title: 'Cell Front V12', tech: 'VOLUMETRIC CELL FIELD / HAND-PAINTED AUDIO POCKETS',
  audioIn: true,
  fx: { bloom: 0.34 },
  tags: ['VOLUMETRIC', 'AUDIO IN', 'THREE POCKETS', 'SPEED = COLOR', 'RIDGE LOOM PALETTE', 'KICK SWELL', 'REFORMING'],
  desc: 'V11’s kick-true clouds in Ridge Loom’s colors only — violet floor, orange and cyan summits, no yellow. The field rests violet. Color comes from SPEED: how fast the left hand moves paints orange into the left side of the cloud, how fast the right hand moves paints cyan into the right, snapping up with the gesture and fading back to violet over a couple of seconds. A hand held still, anywhere, adds nothing. Kick swell, capped field and gating are V11 unchanged.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in) — the kick swells the clouds, the bassline and melody size the field. The hands paint by MOVING: a fast reach or pull of the left hand floods the left side orange, of the right hand floods the right side cyan; a slow drift tints faintly; stillness leaves Ridge Loom’s violet. Both hands sweeping together lights the whole field, orange meeting cyan across the middle.',
  sound: 'Makes no sound of its own — an audio-in scene, same as V4-V8. Connect a source (mic, line-in, or CAPTURE APP AUDIO for a running app’s own output) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. Built for a full spectrum: it wants a kick under a bassline.',

  init(P) {
    const s = {
      pres: 0, bass: 0, mid: 0, treble: 0, energy: 0, flux: 0,
      field: 0, kick: 0, kBass: 0, kMid: 0, kTreble: 0, _kGap: 1, _kN: -1, _kAge: 0, _kStr: 0,
      Rbase: 0, RbaseM: 0, RbaseT: 0, LEAD: 0.030,
      _prevBass: 0, _prevMid: 0, _prevTreble: 0,
      velL: 0, velR: 0, _pL: -1, _pR: -1,
      offBass: 0.1, offTreble: 0.1, Rbass: 0, Rmid: 0, Rtreble: 0,
      ax: 0.8, ay: 0.5, U: 0.050,
      blooms: [], flash: [], life: 0, popped: 0, popRate: 0,
      _prevOnset: 0,
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
      uPres: { value: 0 }, uEnergy: { value: 0 }, uFlux: { value: 0 }, uKick: { value: 0 },
      uBass: { value: 0 }, uMid: { value: 0 }, uTreble: { value: 0 },
      uVelL: { value: 0 }, uVelR: { value: 0 }, uSpan: { value: new THREE.Vector2(-0.1, 0.1) },
      uU: { value: s.U },
      uLobe: { value: new Float32Array(9) },
      uNB: { value: 0 },
      uBloom: { value: new Float32Array(32) },
      uFlash: { value: new Float32Array(24) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: CF12_FS
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

    // HAND SPEED PAINTS (Nima, V12): not where a hand IS but how fast it
    // MOVES. |d(inp)/dt| → an envelope that snaps up and fades over ~2s.
    // A full-range sweep in half a second (2/s) reads as full color.
    const L = clamp(inp.L), R = clamp(inp.R);
    if (s._pL < 0) { s._pL = L; s._pR = R; }
    const dtc = Math.max(dt, 1e-3);
    const vL = clamp(Math.abs(L - s._pL) / dtc * 0.55), vR = clamp(Math.abs(R - s._pR) / dtc * 0.55);
    s._pL = L; s._pR = R;
    s.velL += (vL - s.velL) * Math.min(1, dt * (vL > s.velL ? 24 : 0.9));
    s.velR += (vR - s.velR) * Math.min(1, dt * (vR > s.velR ? 24 : 0.9));

    const handLLive = chan.L.mode === 'live', handRLive = chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    const live = (handLLive || handRLive || audioLive) ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 2.2);

    // SLOW BANDS (V9): bass/mid/treble are eased at ~1.5/s in BOTH
    // directions — these no longer size a pocket directly, they size the
    // FIELD, so a bassline note or a melody run is a swell of the whole
    // ensemble over a bar, never a twitch of one cloud.
    const idle = 0.030 + 0.014 * Math.sin(s.life * 0.19);
    const bassTarget = Math.max(idle * (1 - s.pres), clamp(inp.audio.bass));
    const midTarget = Math.max(idle * 0.7 * (1 - s.pres), clamp(inp.audio.mid));
    const trebleTarget = Math.max(idle * (1 - s.pres), clamp(inp.audio.treble));
    s.bass += (bassTarget - s.bass) * Math.min(1, dt * (bassTarget > s.bass ? 1.4 : 0.9));
    s.mid += (midTarget - s.mid) * Math.min(1, dt * (midTarget > s.mid ? 1.4 : 0.9));
    s.treble += (trebleTarget - s.treble) * Math.min(1, dt * (trebleTarget > s.treble ? 1.4 : 0.9));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    // the field: bass-weighted mix of the slow bands, COMPRESSED (V10) so a
    // loud track sits comfortably inside the frame instead of flooding it.
    const fieldMix = clamp(0.45 * s.bass + 0.35 * s.mid + 0.30 * s.treble);
    const fieldTarget = Math.pow(fieldMix, 1.5);
    s.field += (fieldTarget - s.field) * Math.min(1, dt * 1.8);

    // KICK (V9): the engine's onset is a bass-band rise detector, i.e. the
    // kick on four-on-the-floor. Rising edge → per-pocket envelopes snap up
    // (bass hardest, treble least) and decay over roughly a beat. This is
    // the ONLY fast size movement left in the scene.
    // V11: the engine's time-domain kick (AUDIOIN.kick) when it exists —
    // a NEW hit is `n` changing, never truthiness. Fallback: onset's edge.
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetRaw = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        // true age of the hit on the audio clock (0 for the perf-clock test hook)
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    const onsetEdge = edge && s._kGap > 0.09;
    if (onsetEdge) {
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      // BACK-DATE: seed the envelope where its own decay would already be
      // (age + LEAD) after the hit, so the frame is right for its vsync.
      const adv = Math.exp(-3.4 * (age + s.LEAD));
      s.kBass = Math.max(s.kBass, hit * adv);
      s.kMid = Math.max(s.kMid, hit * 0.8 * adv);
      s.kTreble = Math.max(s.kTreble, hit * 0.65 * adv);
    }
    const kDecay = Math.min(1, dt * 3.4);
    s.kBass -= s.kBass * kDecay; s.kMid -= s.kMid * kDecay; s.kTreble -= s.kTreble * kDecay;
    s.kick = Math.max(s.kBass, s.kMid, s.kTreble);

    // FLUX (V9): derived from the SLOW bands now, so it only wakes on a
    // real change in the arrangement (bass dropping out, a lead entering),
    // not on every note the way V7/V8's fast-band derivative did.
    const fluxRaw = (Math.abs(s.bass - s._prevBass) + Math.abs(s.mid - s._prevMid) + Math.abs(s.treble - s._prevTreble)) / Math.max(dt, 1e-3);
    s._prevBass = s.bass; s._prevMid = s.mid; s._prevTreble = s.treble;
    const fluxTarget = clamp(fluxRaw * 0.6);
    s.flux += (fluxTarget - s.flux) * Math.min(1, dt * (fluxTarget > s.flux ? 4.0 : 1.5));

    const axc = clamp(s.ax, 0.6, 1.7);
    // spread follows the field, with a small outward push on the kick
    s.offBass = (0.10 + 0.26 * s.field + 0.04 * s.kBass) * axc;
    s.offTreble = (0.10 + 0.26 * s.field + 0.04 * s.kTreble) * axc;
    // each pocket's share of the field bends only gently toward its own
    // slow band (0.75..1.25); the kick multiplies on top — up to ~1.7x.
    // CAPPED (V10): base tops out ~0.29 of min(w,h) — a loud track is a
    // big ensemble in black, never a flood.
    const share = (band, mean) => 1 + 0.5 * clamp(band - mean, -0.5, 0.5);
    const mean = (s.bass + s.mid + s.treble) / 3;
    const base = 0.018 + s.field * 0.27;
    // V11: smooth only the BASE (slow — hides band motion); the kick
    // multiplier is applied per frame with NO filter, so the swell is on
    // screen the frame the hit is known.
    const Bb = base * share(s.bass, mean), Bm = base * 0.85 * share(s.mid, mean), Bt = base * share(s.treble, mean);
    s.Rbase += (Bb - s.Rbase) * Math.min(1, dt * (Bb > s.Rbase ? 6 : 3.5));
    s.RbaseM += (Bm - s.RbaseM) * Math.min(1, dt * (Bm > s.RbaseM ? 6 : 3.5));
    s.RbaseT += (Bt - s.RbaseT) * Math.min(1, dt * (Bt > s.RbaseT ? 6 : 3.5));
    s.Rbass = s.Rbase * (1 + 0.70 * s.kBass);
    s.Rmid = s.RbaseM * (1 + 0.60 * s.kMid);
    s.Rtreble = s.RbaseT * (1 + 0.55 * s.kTreble);

    /* ---- blooms: kick-driven, same shape as V4-V8. A hit spawns one
       sized by how loud it was, and finishes off whichever existing bloom
       is closest to ready. */
    if (onsetEdge) {
      if (s.blooms.length < 4) {
        let bx = 0, by = 0, ok = false;
        const bias = clamp(inp.audio.pan, -1, 1) * s.ax * 0.55;
        for (let k = 0; k < 12 && !ok; k++) {
          bx = bias + (P.rand() * 2 - 1) * s.ax * 0.7;
          by = (P.rand() * 2 - 1) * s.ay * 0.85;
          if (CF12_POOL(s, bx, by) > 0.4) ok = true;
        }
        if (ok) {
          const big = clamp(0.32 + inp.audio.level * 0.8);
          s.blooms.push({ x: bx, y: by, r: s.U * 0.4, Rt: s.U * (0.75 + big * big * 0.85), seed: P.rand() });
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
      const inPaint = CF12_POOL(s, b.x, b.y) > 0.4;
      const gr = (0.16 + s.energy * 0.55) * (0.6 + b.seed * 0.8);
      b.r += (inPaint ? (b.Rt - b.r) * gr : -b.r * 1.6) * dt;
      const sp = 0.45 + 0.62 * s.energy;
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
      const V = [73, 0, 255], O = [243, 108, 59], C = [0, 237, 255];
      const mixc = (a, b, t) => [0, 1, 2].map(k => Math.round(a[k] + (b[k] - a[k]) * clamp(t)));
      const cols = [mixc(V, O, s.velL), mixc(mixc(V, O, s.velL * 0.5), C, s.velR * 0.5), mixc(V, C, s.velR)];
      CF12_LOBES(s).forEach((l, i) => {
        if (l[2] < 0.01) return;
        const x = w / 2 + l[0] * mn, y = h / 2 + l[1] * mn, r = l[2] * mn;
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, `rgba(${cols[i].join(',')},0.9)`);
        gr.addColorStop(1, `rgba(${cols[i].join(',')},0)`);
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      });
      g.fillStyle = 'rgba(255,200,140,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('CELL FRONT V12 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres; u.uEnergy.value = s.energy; u.uFlux.value = s.flux; u.uKick.value = s.kick;
    u.uBass.value = s.bass; u.uMid.value = s.mid; u.uTreble.value = s.treble;
    u.uVelL.value = s.velL; u.uVelR.value = s.velR; u.uSpan.value.set(-s.offBass, s.offTreble);
    u.uU.value = s.U;
    const ll = u.uLobe.value, LB = CF12_LOBES(s);
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
    g.fillText('BASS ' + Math.round(s.bass * 100) + '   MID ' + Math.round(s.mid * 100) +
      '   TREBLE ' + Math.round(s.treble * 100) + '   FIELD ' + Math.round(s.field * 100) +
      '   KICK ' + Math.round(s.kick * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' age ' + Math.round(s._kAge * 1000) + 'ms str ' + Math.round(s._kStr * 100) + (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ' lead ' + Math.round(s.LEAD * 1000) + ')' +
      '   FLUX ' + Math.round(s.flux * 100) +
      '   SPEED L ' + Math.round(s.velL * 100) + ' R ' + Math.round(s.velR * 100) +
      '   PAN ' + inp.audio.pan.toFixed(2) + '   BLOOMS ' + s.blooms.length + '/4   HITS/S ' + s.popRate.toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
