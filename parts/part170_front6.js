/* ---------- SRC-43.6 · CELL FRONT V6 (size is the reaction) ----------
   Nima's verdict on V5: like the aesthetic, but it doesn't read as REACTIVE
   enough — the pockets barely move. V5 kept a fairly loud idle floor and
   mapped intensity mostly onto brightness/area with slow, symmetric easing,
   so quiet stayed visible and loud never swelled far past it.
   V6 makes SIZE the headline reaction: near silence, a pocket shrinks to
   almost nothing (a faint ember, never fully gone — the house rule against
   true stillness) instead of sitting there at a third of its size doing
   little. Real intensity balloons it — each pocket's own footprint grows
   dramatically with its own band, and the individual glowing cells within
   it visibly swell too, on top of the macro growth. Attack is fast (a hit
   registers almost instantly), release is a touch slower so it reads as a
   breath, not a strobe. Everything else — three pockets sized by their own
   band, hands as sensitivity gain (not competition), true black, no shadow
   rings — carries over from V5 unchanged. ------ */
const CF6_LOBES = s => [
  [-s.offBass, -0.04, s.Rbass], [0, 0.05, s.Rmid], [s.offTreble, -0.04, s.Rtreble]
];
const CF6_POOL = (s, x, y) => {
  let acc = 0;
  for (const l of CF6_LOBES(s)) {
    if (l[2] < 0.004) continue;
    const q = Math.hypot(x - l[0], y - l[1]) / l[2];
    acc += Math.exp(-q * q * q * 1.15);
  }
  return acc;
};
const CF6_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uEnergy, uBass, uMid, uTreble, uU;',
  'uniform vec2 uRes;',
  'uniform vec3 uLobe[3];',       // bass, mid, treble — x,y,radius
  'uniform int uNB;',
  'uniform vec4 uBloom[8];',
  'uniform vec4 uFlash[6];',
  'const vec3 C_BASS   = vec3(0.980, 0.400, 0.086);',   // ember-orange
  'const vec3 C_MID    = vec3(0.996, 0.796, 0.420);',   // warm gold
  'const vec3 C_TREBLE = vec3(0.400, 0.560, 0.980);',   // cool violet-blue
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
  // color at a point: how close it sits to each of the three pockets. No
  // dynamic vector indexing (WebGL1 is picky about it) — three explicit terms.
  'vec3 lobeWeights(vec2 p){',
  '  float d0 = length(p - uLobe[0].xy) / max(uLobe[0].z, 1e-4);',
  '  float d1 = length(p - uLobe[1].xy) / max(uLobe[1].z, 1e-4);',
  '  float d2 = length(p - uLobe[2].xy) / max(uLobe[2].z, 1e-4);',
  '  return vec3(exp(-d0 * d0 * 1.3), exp(-d1 * d1 * 1.3), exp(-d2 * d2 * 1.3));',
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
  '  vec2 pa = p + flowW(p * 2.1) * (0.011 + uEnergy * 0.015);',
  '  float sp = 0.45 + 0.62 * uEnergy;',
  '  vec2 dr0 = vec2( 0.0046,  0.0017) * uT * sp + flowW(p * 1.7 + vec2(0.0)) * (0.011 + uEnergy * 0.014);',
  '  vec2 dr1 = vec2(-0.0032,  0.0039) * uT * sp + flowW(p * 2.4 + vec2(3.1)) * (0.009 + uEnergy * 0.012);',
  '  vec2 dr2 = vec2( 0.0067, -0.0028) * uT * sp + flowW(p * 3.3 + vec2(6.7)) * (0.007 + uEnergy * 0.010);',
  '  float ct = cos(uT * 0.030), st = sin(uT * 0.030);',
  '  vec2 rot = vec2(ct, st);',
  '  float acc = poolF(pa);',
  '  if (acc < 0.11){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float U0 = uU * 2.30, U1 = uU * 1.05, U2 = uU * 0.46;',
  '  float dS = 1e5, dH = 1e5, SR = uU * 0.30;',
  '  vec2 SP = pa; vec3 SH = vec3(0.5);',
  // individual cells swell/shrink with overall intensity too, on top of the
  // macro pocket growth — the "billowing" that makes size read as the reaction.
  '  float cellSc = 0.68 + 0.60 * uEnergy;',
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
  '  vec3 tint = (wgt.x * C_BASS + wgt.y * C_MID + wgt.z * C_TREBLE) / max(wsum, 0.30);',
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
  '    vec3 ftint = lobeWeights(f.xy);',
  '    float fsum = ftint.x + ftint.y + ftint.z;',
  '    vec3 fc = (ftint.x * C_BASS + ftint.y * C_MID + ftint.z * C_TREBLE) / max(fsum, 0.30);',
  '    col += fc * exp(-dd * dd) * f.w * 0.85 * insideC;',
  '  }',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.42);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-43.6', family: 'SRC-43', ver: 6, title: 'Cell Front V6', tech: 'VOLUMETRIC CELL FIELD / SIZE-REACTIVE AUDIO POCKETS',
  audioIn: true,
  fx: { bloom: 0.34 },
  tags: ['VOLUMETRIC', 'AUDIO IN', 'THREE POCKETS', 'HANDS = SENSITIVITY', 'SIZE REACTIVE'],
  desc: 'Same three glowing pockets as V5 — BASS, MID and TREBLE, each their own lobe, ember-orange / warm gold / cool violet, floating in true black with no shadow ring anywhere. Here the reaction is SIZE. Near silence a pocket shrinks to almost nothing, a faint ember rather than the resting third-size mass V5 held onto; real intensity balloons it fast, both the pocket’s own footprint and the individual glowing cells inside it swelling together. Attack is quick — a hit registers almost at once — release breathes back down a beat slower, so the field genuinely pulses with what it hears instead of drifting near one size all night.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in) — the mic or a captured app is what the pockets respond to. Hands still don’t fight the audio for control: L turns up how sensitive the BASS pocket is, R turns up TREBLE’s — reach out to make quiet sound read as loud, pull back to calm a loud room down. Nothing goes fully silent, but at rest the pockets sit small enough to nearly vanish, so real intensity has somewhere dramatic to go.',
  sound: 'Makes no sound of its own — an audio-in scene, same as V4/V5. Connect a source (mic, line-in, or CAPTURE APP AUDIO for a running app’s own output) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence.',

  init(P) {
    const s = {
      pres: 0, bass: 0, mid: 0, treble: 0, energy: 0,
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
      uPres: { value: 0 }, uEnergy: { value: 0 },
      uBass: { value: 0 }, uMid: { value: 0 }, uTreble: { value: 0 },
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
      fragmentShader: CF6_FS
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

    // SENSITIVITY, not competition (Nima's call, carried over from V5).
    // Audio sets the SHAPE; hands set the GAIN on top of it.
    const SENS_BASE = 0.35, SENS_RANGE = 1.45;
    const sensL = SENS_BASE + clamp(inp.L) * SENS_RANGE;
    const sensR = SENS_BASE + clamp(inp.R) * SENS_RANGE;
    const sensMid = (sensL + sensR) * 0.5;

    const handLLive = chan.L.mode === 'live', handRLive = chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    const live = (handLLive || handRLive || audioLive) ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 2.2);

    // Nima's V6 call: the idle floor was doing too much — quiet should read
    // as nearly hidden, not a third-size resting mass. Keep only a whisper.
    const idle = 0.030 + 0.014 * Math.sin(s.life * 0.19);
    const bassTarget = Math.max(idle * (1 - s.pres), clamp(inp.audio.bass * sensL));
    const midTarget = Math.max(idle * 0.7 * (1 - s.pres), clamp(inp.audio.mid * sensMid));
    const trebleTarget = Math.max(idle * (1 - s.pres), clamp(inp.audio.treble * sensR));
    // fast attack, slower release — a hit registers almost at once, the
    // field breathes back down instead of dropping like a strobe.
    s.bass += (bassTarget - s.bass) * Math.min(1, dt * (bassTarget > s.bass ? 9.0 : 3.2));
    s.mid += (midTarget - s.mid) * Math.min(1, dt * (midTarget > s.mid ? 8.0 : 3.0));
    s.treble += (trebleTarget - s.treble) * Math.min(1, dt * (trebleTarget > s.treble ? 9.0 : 3.2));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 5);

    const axc = clamp(s.ax, 0.6, 1.7);
    s.offBass = (0.10 + 0.40 * s.bass) * axc;
    s.offTreble = (0.10 + 0.40 * s.treble) * axc;
    // size IS the reaction now: near-invisible at rest, ballooning at peak —
    // roughly 40x the resting footprint at full intensity, vs. V5's ~4x.
    const Rbt = 0.018 + s.bass * 0.86, Rmt = 0.015 + s.mid * 0.72, Rtt = 0.018 + s.treble * 0.86;
    s.Rbass += (Rbt - s.Rbass) * Math.min(1, dt * (Rbt > s.Rbass ? 7.5 : 2.6));
    s.Rmid += (Rmt - s.Rmid) * Math.min(1, dt * (Rmt > s.Rmid ? 7.0 : 2.6));
    s.Rtreble += (Rtt - s.Rtreble) * Math.min(1, dt * (Rtt > s.Rtreble ? 7.5 : 2.6));

    /* ---- blooms: onset-driven only, same shape as V4/V5. A hit spawns one
       sized by how loud it was AND by the current hand sensitivity, and
       finishes off whichever existing bloom is closest to ready. */
    const sensAvg = (sensL + sensR) * 0.5;
    const onsetEdge = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    if (onsetEdge) {
      if (s.blooms.length < 6) {
        let bx = 0, by = 0, ok = false;
        const bias = clamp(inp.audio.pan, -1, 1) * s.ax * 0.55;
        for (let k = 0; k < 12 && !ok; k++) {
          bx = bias + (P.rand() * 2 - 1) * s.ax * 0.7;
          by = (P.rand() * 2 - 1) * s.ay * 0.85;
          if (CF6_POOL(s, bx, by) > 0.4) ok = true;
        }
        if (ok) {
          const big = clamp((0.32 + inp.audio.level * 0.8) * (0.55 + sensAvg * 0.5));
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
      const inPaint = CF6_POOL(s, b.x, b.y) > 0.4;
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
      const tint = ['250,102,22', '254,203,107', '102,143,250'];
      CF6_LOBES(s).forEach((l, i) => {
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
      g.fillText('CELL FRONT V6 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres; u.uEnergy.value = s.energy;
    u.uBass.value = s.bass; u.uMid.value = s.mid; u.uTreble.value = s.treble;
    u.uU.value = s.U;
    const ll = u.uLobe.value, LB = CF6_LOBES(s);
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
      '   TREBLE ' + Math.round(s.treble * 100) + '   ENERGY ' + Math.round(s.energy * 100) +
      '   PAN ' + inp.audio.pan.toFixed(2) + '   BLOOMS ' + s.blooms.length + '/6   HITS/S ' + s.popRate.toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
