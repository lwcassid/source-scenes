/* ---------- SRC-66..69 · THE ISOTRP STUDIES (after 404.zero) ----------
   A learning study, not a show scene. Reference: 404.zero's ISOTRP live at
   MUTEK.JP 2023 (a 30 s phone clip). What the frames say:

   - IT IS MOSTLY DARK. 161 of 893 frames carry light at all. Most flashes
     live ONE camera frame (< 33 ms); the hard horizontal edges in some frames
     are the phone's rolling shutter slicing a flash, not a designed shape.
   - EVERY IMAGE IS A SOFT LIGHT FIELD in one colour: point, disc, ring with
     one hot edge, a dark-cored "eclipse" donut, a pinched vertical spindle,
     a wide column, a lens-shaped vesica, a full white wash, a caustic ring
     with a cusp. Measured tint: mids carry ~+20/255 of blue (153,151,174),
     whites clip to white. Each is one distance function through a falloff.
   - SOUND AND LIGHT ARE ONE INSTRUMENT. In the sparse passage every audio
     transient lands on the same video frame as a flash, faint ones included,
     with no measurable lag; in the dense passage the audio is a steady wall
     and the light keeps its own pattern. So one sequencer fires both. The
     artists play modular synths and drive TouchDesigner from them.

   HOW THIS FILE REBUILDS THAT, with nothing outside this file:
   1. ISO.render — ONE shared WebGL context for every instance (tiles on the
      wall included), a full-screen fragment shader that sums up to 8 analytic
      light fields into a HalfFloat target, optional ping-pong feedback, then
      a tone/tint pass. Cheap: a handful of exp() per pixel.
   2. ISO.clock — the time the listener is HEARING now, from
      AudioContext.getOutputTimestamp(). The sequencer schedules sound ahead
      (lookahead in the audio tick) and the picture shows an event on the
      frame whose sound is at the speaker. That is the "no measurable lag"
      the reference has. With no audio running (wall tiles), a wall clock.
   3. Scenes: A continuous (no strobe), B the gated imitation, C the beam,
      D the trails. Every hand follows THE SOURCE LAW via SOURCE().

   Test hooks for the harness: P.state.hold = true freezes the last lit
   picture; P.state.forceType = n makes the sequencer fire that shape. */
(() => {
  const TYPES = ['POINT', 'DISC', 'RING', 'ECLIPSE', 'SPINDLE', 'COLUMN', 'VESICA', 'WASH', 'CAUSTIC'];
  const AVOFF = 0.012;   // picture leads sound by ~ one refresh: glass shows it a frame later

  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

  const FS_FIELD = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uPrev;
uniform float uFb, uZoom, uAsp, uSoft, uT, uBlur;
uniform vec2 uDrift, uPx;
uniform vec4 uA[8];
uniform vec4 uB[8];
uniform int uN;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), f.x), mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++){ s += a*vn(p); p *= 2.03; a *= 0.5; } return s; }
float g2(float x){ return exp(-x*x); }
float field(vec2 p, vec4 A, vec4 B){
  int ty = int(B.x + 0.5);
  vec2 q = p - A.xy; q.x /= max(B.y, 0.05);
  float s = max(A.z, 1e-3), r = length(q), sf = uSoft, f = 0.0;
  if (ty == 0) {                                   // POINT
    f = g2(r/(s*(0.55+sf))) + 0.22*g2(r/(s*3.2));
  } else if (ty == 1) {                            // DISC: flat body, soft edge, a little halo
    float e = s*(0.10+0.5*sf);
    f = smoothstep(s+e, s-e, r)*(0.78+0.22*g2(r/(s*0.7))) + 0.22*g2(max(r-s,0.0)/(s*0.7));
  } else if (ty == 2) {                            // RING with one hot edge
    float w = s*(0.03+0.16*sf);
    float hot = pow(0.5+0.5*cos(atan(q.y,q.x)-B.w), 2.0);
    float hotIn = mix(0.75, 0.5+0.5*hot, smoothstep(0.0, s*0.7, r));   // no angular wedge at the centre
    f = g2((r-s)/w)*(0.18+1.35*hot) + g2((r-s)/(w*3.5))*0.35*hot + 0.20*smoothstep(s*1.02, s*0.15, r)*hotIn
      + 0.16*g2(max(r-s,0.0)/(s*0.45));
  } else if (ty == 3) {                            // ECLIPSE: bright annulus, dark core (B.z = core)
    float k = B.z*s, e = s*(0.04+0.2*sf);
    float body = smoothstep(s*1.9, s*0.7, r);
    float core = smoothstep(k-e, k+e, r);
    f = body*core + 0.55*g2((r-k)/(s*0.05+e))*body*step(0.02, B.z);
  } else if (ty == 4) {                            // SPINDLE: hourglass beam, bright core line (B.z = pinch)
    float y = q.y/s, x = q.x;
    float ve = smoothstep(1.0, 0.55, abs(y));
    float wid = s*0.30*(1.0 - 0.8*B.z + 0.8*B.z*pow(abs(y), 1.3)) + 1e-3;
    f = ve*(0.72*g2(x/wid) + 0.75*g2(x/(s*0.010+0.004*sf))*(0.45+0.55*abs(y)))
      + 0.55*g2(length(vec2(x, (abs(y)-0.86)*s))/(s*0.11));
  } else if (ty == 5) {                            // COLUMN: full-height band (s = half width)
    f = exp(-pow(abs(q.x)/s, 2.4))*(0.9+0.1*g2(q.x/(s*0.3)));
  } else if (ty == 6) {                            // VESICA: two discs' lens, rims bright (B.z = separation)
    float d = s*B.z, dA = length(q-vec2(d,0.0)), dB = length(q+vec2(d,0.0)), w = s*(0.05+0.2*sf);
    float inA = smoothstep(s+w, s-w, dA), inB = smoothstep(s+w, s-w, dB);
    f = 0.45*inA*inB + 0.9*(g2((dA-s)/w)*inB + g2((dB-s)/w)*inA) + 0.10*(inA+inB);
  } else if (ty == 7) {                            // WASH: the whole field, a soft dark cloud in it
    float n = fbm(p*1.6 + B.w*7.3 + uT*0.05);
    f = (1.0 - 0.62*g2(r/s)*(0.6+0.8*n))*(0.78+0.35*n);
  } else {                                         // CAUSTIC: two rims meeting in a cusp at the top
    float w = s*(0.03+0.15*sf);
    vec2 q2 = q - vec2(0.0, 0.30*s);                  // inner rim tangent at the top: the cusp
    float rim1 = g2((r-s)/w), rim2 = g2((length(q2)-s*0.70)/(w*1.4));
    f = 0.30*smoothstep(s*1.05, s*0.55, r) + 0.65*rim1 + 0.40*rim2 + 1.5*rim1*rim2
      + 0.14*g2(max(r-s,0.0)/(s*0.5));
  }
  return f*A.w;
}
void main(){
  vec2 p = (vUv - 0.5)*vec2(uAsp, 1.0);
  float L = 0.0;
  for (int i = 0; i < 8; i++){ if (i >= uN) break; L += field(p, uA[i], uB[i]); }
  L *= 0.93 + 0.07*vn(p*3.0 + uT*0.3);            // light is never perfectly clean
  float prev = 0.0;
  if (uFb > 0.001) {
    vec2 pu = (vUv - 0.5)/uZoom + 0.5 + uDrift;
    vec2 o = uPx*uBlur;
    prev = 0.4*texture2D(uPrev, pu).r + 0.15*(texture2D(uPrev, pu+vec2(o.x,0.0)).r + texture2D(uPrev, pu-vec2(o.x,0.0)).r
         + texture2D(uPrev, pu+vec2(0.0,o.y)).r + texture2D(uPrev, pu-vec2(0.0,o.y)).r);
  }
  gl_FragColor = vec4(L + prev*uFb, 0.0, 0.0, 1.0);
}`;

  const FS_OUT = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uExp, uT;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  float L = 1.0 - exp(-2.0*max(0.0, texture2D(uTex, vUv).r*uExp));
  // the reference's tint, measured: mids ~ (153,151,174), whites clip to white
  vec3 c = vec3(L, L*0.985, min(1.0, pow(L, 0.85)*1.05));
  c += (h21(vUv*vec2(1731.0, 977.0) + fract(uT)*61.0) - 0.5)*(1.5/255.0);   // dither: no banding in the falloffs
  gl_FragColor = vec4(c, 1.0);
}`;

  /* ---------------- the shared renderer ---------------- */
  const CW = 1600, CH = 1600;
  let R = null;
  function renderer() {
    if (R && !(R.getContext().isContextLost && R.getContext().isContextLost())) return R;
    R = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    R.setPixelRatio(1); R.setSize(CW, CH, false); R.setClearColor(0x000000, 1);
    return R;
  }
  function make(P) {
    if (P._iso) { try { P._iso.rt.forEach(r => r.dispose()); } catch (e) {} }
    const sc = Math.min(1, 1600 / Math.max(P.w, P.h));
    const rw = Math.max(2, Math.round(P.w * sc)), rh = Math.max(2, Math.round(P.h * sc));
    const mkRT = () => new THREE.WebGLRenderTarget(rw, rh, {
      type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    const A = [], B = [];
    for (let k = 0; k < 8; k++) { A.push(new THREE.Vector4(0, 0, 0.1, 0)); B.push(new THREE.Vector4(0, 1, 0, 0)); }
    const fieldMat = new THREE.ShaderMaterial({
      uniforms: {
        uPrev: { value: null }, uFb: { value: 0 }, uZoom: { value: 1 }, uAsp: { value: rw / rh },
        uSoft: { value: 0.3 }, uT: { value: 0 }, uBlur: { value: 0 },
        uDrift: { value: new THREE.Vector2() }, uPx: { value: new THREE.Vector2(1 / rw, 1 / rh) },
        uA: { value: A }, uB: { value: B }, uN: { value: 0 }
      },
      vertexShader: VS, fragmentShader: FS_FIELD, depthTest: false, depthWrite: false
    });
    const outMat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: null }, uExp: { value: 1 }, uT: { value: 0 } },
      vertexShader: VS, fragmentShader: FS_OUT, depthTest: false, depthWrite: false
    });
    const scene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fieldMat);
    quad.frustumCulled = false; scene.add(quad);
    P._iso = { rw, rh, rt: [mkRT(), mkRT()], i: 0, fieldMat, outMat, scene, quad,
               cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), A, B, asp: rw / rh };
    return P._iso;
  }
  // lights: [{type, x, y, s, i, asp, prm, ang}]  (x,y in frame-height units, 0,0 = centre, +y up)
  function render(P, g, w, h, lights, o) {
    const I = P._iso, r = renderer(), u = I.fieldMat.uniforms;
    const n = Math.min(8, lights.length), off = lights.length - n;   // keep the newest 8
    for (let k = 0; k < 8; k++) {
      const L = k < n ? lights[off + k] : null;
      if (L) { I.A[k].set(L.x || 0, L.y || 0, L.s, L.i); I.B[k].set(L.type, L.asp || 1, L.prm || 0, L.ang || 0); }
      else I.A[k].w = 0;
    }
    u.uN.value = n; u.uFb.value = o.fb || 0; u.uZoom.value = o.zoom || 1;
    u.uDrift.value.set(o.dx || 0, o.dy || 0); u.uSoft.value = o.soft !== undefined ? o.soft : 0.3;
    u.uT.value = o.t || 0; u.uBlur.value = o.blur || 0;
    const src = I.rt[I.i], dst = I.rt[1 - I.i];
    u.uPrev.value = src.texture;
    I.quad.material = I.fieldMat; r.setRenderTarget(dst); r.render(I.scene, I.cam);
    I.i = 1 - I.i;
    I.quad.material = I.outMat;
    I.outMat.uniforms.uTex.value = dst.texture;
    I.outMat.uniforms.uExp.value = o.exp !== undefined ? o.exp : 1;
    I.outMat.uniforms.uT.value = o.t || 0;
    r.setRenderTarget(null); r.setViewport(0, 0, I.rw, I.rh); r.render(I.scene, I.cam);
    // the shared canvas is bigger than any one instance: copy our corner (GL's origin is bottom-left)
    g.save();
    g.globalCompositeOperation = P.hosted ? 'lighter' : 'copy';
    g.drawImage(r.domElement, 0, CH - I.rh, I.rw, I.rh, 0, 0, w, h);
    g.restore();
  }

  /* ---------------- the clock and the sequencer ---------------- */
  // what the listener hears NOW: the audio clock at the speaker, or wall time
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
  function grid(dom, bpm) {
    return dom === 'a' ? { o: T.t0, sx: T.beat / 4 } : { o: 0, sx: 60 / bpm / 4 };
  }
  // generate every grid step up to `upTo`; gen(P, k, t, sx) returns events [{t, dur, tail, amp, lights, ...}]
  function pump(P, dom, now, upTo, bpm, gen, onEv) {
    const q = P.state.seq, G = grid(dom, bpm);
    if (q.dom !== dom || q.k === null || G.o + q.k * G.sx < now - 0.5) {
      q.dom = dom; q.q.length = 0; q.k = Math.ceil((now - G.o) / G.sx);
    }
    let guard = 0;
    while (G.o + q.k * G.sx < upTo && guard++ < 64) {
      const evs = gen(P, q.k, G.o + q.k * G.sx, G.sx) || [];
      for (const ev of evs) { q.q.push(ev); if (onEv) onEv(ev); }
      q.k++;
    }
  }
  // the lights visible at the listener's now; a one-frame event is guaranteed exactly one frame
  function visible(P, now) {
    const s = P.state, q = s.seq.q, tgt = now + AVOFF, out = [];
    let fired = 0;
    for (const ev of q) {
      if (ev.t > tgt) continue;
      const end = ev.t + ev.dur;
      let a;
      if (!ev.seen || tgt <= end) { a = 1; if (!ev.seen) fired++; }
      else a = ev.tail > 0 ? Math.exp(-(tgt - end) / ev.tail) : 0;
      ev.seen = true;
      if (a < 0.01) { ev.dead = true; continue; }
      for (const L of ev.lights) out.push(Object.assign({}, L, { i: L.i * a * (ev.amp || 1) }));
    }
    s.seq.q = q.filter(e => !e.dead);
    s.fired = (s.fired || 0) + fired;
    return out;
  }
  // audio tick ran recently → it owns generation (and scheduled the sound)
  const audioOwns = s => performance.now() - (s.seq.tickWall || -1e9) < 300;
  function newSeq() { return { k: null, q: [], dom: null, tickWall: -1e9 }; }
  function euclid(n, len) { const p = []; for (let i = 0; i < len; i++) p.push(((i * n) % len) < n); return p; }

  // presence-blended Source-law value, the way The Point does it
  function hand(s, key, v, idle, dt, rate) {
    const want = SOURCE(v) * s.pres + idle * (1 - s.pres);
    s[key] += (want - s[key]) * Math.min(1, dt * (rate || 7));
    return s[key];
  }
  function presence(s, dt) {
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
  }
  function noGL(P) { return typeof THREE === 'undefined' || !THREE.WebGLRenderer; }
  function noGLDraw(g, w, h, name) {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(220,215,245,0.8)'; g.font = '12px ui-monospace,monospace';
    g.fillText(name + ' · needs WebGL', 10, h - 10);
  }
  function hud(P, g, w, h, txt) {
    if (P.hosted || (typeof OWPERF !== 'undefined' && OWPERF())) return;
    g.fillStyle = 'rgba(215,210,240,0.38)';
    g.font = `${Math.max(9, Math.round(h / 110))}px ui-monospace,monospace`;
    g.fillText(txt, 10, h - 10);
  }

  /* ---------------- the shape vocabulary ---------------- */
  //            POINT DISC RING ECL SPIN COL VES WASH CAUS
  const W_NEAR = [5.0, 2.5, 2.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.3];
  const W_MID  = [0.5, 1.0, 2.5, 2.0, 1.5, 0.5, 1.0, 0.3, 1.5];
  const W_FAR  = [0.0, 2.0, 1.0, 1.0, 0.5, 2.5, 1.0, 3.0, 1.0];
  function pickType(z, rnd) {
    const a = z < 0.5 ? W_NEAR : W_MID, b = z < 0.5 ? W_MID : W_FAR, k = z < 0.5 ? z * 2 : (z - 0.5) * 2;
    const w = a.map((x, i) => x + (b[i] - x) * k), sum = w.reduce((p, c) => p + c, 0);
    let r = rnd() * sum;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; }
    return 0;
  }
  function makeLight(type, z, rnd) {
    const v = 0.6 + 0.6 * rnd();
    const L = { type, x: (rnd() - 0.5) * 0.3 * (0.3 + z), y: 0.05 + (rnd() - 0.5) * 0.16, i: 1, asp: 1, prm: 0, ang: rnd() * TAU };
    switch (type) {
      case 0: L.s = 0.035 + 0.05 * z + 0.02 * rnd(); L.i = 1.1; L.x *= 1.6; break;
      case 1: L.s = 0.08 + 0.32 * z * v; L.asp = rnd() < 0.3 ? 1.2 + 0.5 * rnd() : 1; L.i = 0.9; break;
      case 2: L.s = 0.12 + 0.30 * z * v; L.x += (rnd() - 0.5) * 0.5; break;
      case 3: L.s = 0.09 + 0.22 * z * v; L.prm = 0.15 + 0.6 * rnd(); L.asp = rnd() < 0.3 ? 1.25 : 1; break;
      case 4: L.s = 0.32 + 0.18 * z; L.prm = 0.4 + 0.5 * rnd(); L.x *= 0.4; L.y = 0.02; break;
      case 5: L.s = 0.07 + 0.28 * z * v; L.y = 0; L.i = 1.05; break;
      case 6: L.s = 0.22 + 0.20 * z; L.prm = 0.35 + 0.4 * rnd(); L.asp = 1.3; L.y = 0.1; break;
      case 7: L.s = 0.25 + 0.35 * rnd(); L.x = (rnd() - 0.5) * 0.4; L.i = 1.0; break;
      default: L.s = 0.18 + 0.28 * z; L.ang = 0; break;
    }
    return L;
  }
  // how much of the frame a light fills, 0..1 — sound weight follows light weight
  function weight(L) {
    const k = [0.05, 2, 1.4, 1.4, 1.2, 2.4, 1.6, 4, 2][L.type] || 1;
    return clamp(L.s * k * (L.type === 7 ? 0.3 : 1) + (L.type === 7 ? 0.7 : 0));
  }

  const MUSIC_A = {
    bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
    chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
    chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4']
  };
  // the reference has no steady pulse (onset autocorrelation is weak; ~0.5 s shows up), so 120
  const MUSIC_B = { bpm: 120, root: 41, mode: 'phrygian', chordBars: 16, prog: [0, 1] };

  /* ================= A · ISOTRP · LIGHT ECLIPSE (no strobe) ================= */
  reg({
    id: 'SRC-66', family: 'SRC-66', ver: 1,
    title: 'ISOTRP A · Light Eclipse', tech: 'GLSL LIGHT FIELDS / POINT → DISC → RING → ECLIPSE',
    audioIn: true,
    music: MUSIC_A,
    tags: ['STUDY', 'AFTER 404.ZERO', 'WEBGL', 'NO STROBE', 'THE SOURCE LAW'],
    desc: 'The run at 12.7 s of the ISOTRP clip, held still instead of flashed: a point of light opens into a disc, the disc hollows into a ring with one hot edge, and the ring closes its centre into a dark eclipse. The same soft, one-colour light fields as the reference (a faint lavender in the greys, pure white where it burns), drawn by a shader, never strobed. It breathes on its own when nobody plays.',
    interact: 'THE SOURCE LAW. L WALKS THE SHAPE: at the Source a point; opening the hand passes through disc and ring to the eclipse at arm\'s length, growing as it goes. R OPENS THE LIGHT: close is a dim, soft glow; far is crisp and burning, the halo widens and the hot edge on the ring turns faster. The band\'s level adds to the exposure.',
    sound: 'F aeolian at 54, eight-bar chords. A sub root and three triangle pad voices; the pad filter follows R (the light) and the level follows L (the shape). One bell each time the shape crosses into a new form (point, disc, ring, eclipse). MIDI: pad, bass, bells.',

    init(P) {
      const s = { noGL: noGL(P), pres: 0, m: 0.2, x: 0.25, drift: P.rand() * 100, ang: 0, aud: 0, stage: 0 };
      P.state = s;
      if (!s.noGL) make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      presence(s, dt); s.drift += dt;
      hand(s, 'm', inp.L, SOURCE_IDLE(s.drift, 0.22, 0.12, 0.05), dt, 4);
      hand(s, 'x', inp.R, SOURCE_IDLE(s.drift + 40, 0.3, 0.1, 0.07), dt, 6);
      const au = inp.audio || {};
      s.aud += ((au.level || 0) - s.aud) * Math.min(1, dt * 8);
      s.ang += dt * (0.08 + 0.9 * s.x);
      s.stage = Math.min(3, Math.floor(s.m * 3 + 0.5));
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return noGLDraw(g, w, h, 'ISOTRP A');
      const m = clamp(s.m) * 3, gr = clamp(s.m), x = s.x;
      const wt = i => Math.max(0, 1 - Math.abs(m - i));
      const y = 0.04 + 0.01 * Math.sin(s.drift * 0.3), xx = 0.02 * Math.sin(s.drift * 0.21);
      const lights = [
        { type: 0, x: xx, y, s: 0.03 + 0.06 * gr, i: 1.2 * wt(0) },
        { type: 1, x: xx, y, s: 0.06 + 0.26 * gr, i: 0.95 * wt(1) },
        { type: 2, x: xx, y, s: 0.10 + 0.28 * gr, i: 1.0 * wt(2), ang: s.ang },
        { type: 3, x: xx, y, s: 0.12 + 0.26 * gr, i: 1.0 * wt(3), prm: clamp(0.25 + 0.55 * (m - 2)) }
      ].filter(L => L.i > 0.002);
      render(P, g, w, h, lights, { t, soft: 0.9 - 0.75 * x, exp: 0.35 + 0.95 * x + 0.3 * s.aud });
      hud(P, g, w, h, 'SHAPE ' + ['POINT', 'DISC', 'RING', 'ECLIPSE'][s.stage] + ' ' + Math.round(gr * 100) +
        '   LIGHT ' + Math.round(x * 100) + (s.pres < 0.3 ? '   · BREATHING' : ''));
    },
    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.005, cutoff: 220, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 44), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.9); tune(0.9); });
      v.fadeIn(1, 2.5);
      let lastStage = P.state.stage;
      return {
        tick() {
          const s = P.state, gate = 0.35 + s.pres * 0.65;
          pad.forEach(p => { p.level((0.002 + s.m * 0.006) * gate, 0.5); p.bright(180 + s.x * 1400, 0.4); });
          A.set(sg.gain, (0.012 + s.m * 0.024) * gate, 0.4);
          if (s.stage !== lastStage) {
            A.bell(H.chordTone(s.stage * 2, 1), { at: T.next(0.5), vol: 0.02 * gate, dur: 3, rev: 0.7, role: 'bells' });
            lastStage = s.stage;
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', s.m); MOut.expr('bass', s.m); MOut.expr('bells', s.x); }
        },
        stop() { v.kill(); }
      };
    }
  });

  /* ================= B · ISOTRP · GATED (the imitation) ================= */
  function barB(P) {
    const s = P.state, rnd = P.rand, d = s.dens;
    const n = Math.max(1, Math.round(1 + d * 13));
    const b = { pat: euclid(n, 16), rot: (rnd() * 16) | 0, burst: false };
    if (d > 0.55 && rnd() < (d - 0.55) * 1.8) {
      b.burst = true; b.bs = (rnd() * 8) | 0; b.bl = 3 + ((rnd() * 7 * d) | 0);
      b.mode = rnd() < 0.5 + 0.3 * s.scale ? 'hold' : 'stutter';
    }
    s.bar = b;
  }
  function genB(P, k, t, sx) {
    const s = P.state, st = ((k % 16) + 16) % 16, rnd = P.rand;
    if (st === 0 || !s.bar) barB(P);
    const b = s.bar, z = s.scale;
    const inBurst = b.burst && st >= b.bs && st < b.bs + b.bl;
    if (!(b.pat[(st + b.rot) % 16] || inBurst)) return [];
    let dur, tail;
    if (inBurst && b.mode === 'hold') { dur = sx * 1.02; tail = 0.02; }
    else {
      dur = rnd() < 0.18 + 0.2 * z ? 0.03 + rnd() * 0.09 : 0.001;
      tail = rnd() < 0.3 ? 0.02 + rnd() * 0.05 : 0;
    }
    const rat = !inBurst && rnd() < s.dens * 0.25 ? 2 + ((rnd() * 2) | 0) : 1;
    const out = [];
    for (let j = 0; j < rat; j++) {
      const type = s.forceType !== undefined ? s.forceType : pickType(z, rnd);
      const L = makeLight(type, z, rnd);
      out.push({ t: t + j * sx / rat, dur: rat > 1 ? 0.001 : dur, tail, amp: 0.85 + 0.35 * rnd(), lights: [L], w: weight(L) });
    }
    return out;
  }
  function soundB(A, P, ev, gate) {
    const L = ev.lights[0], wgt = ev.w, at = ev.t;
    A.hit({ at, freq: 9000 - 7000 * wgt, q: 0.7 + 2 * (1 - wgt), dur: Math.max(0.012, Math.min(ev.dur, 0.2)) + 0.02,
            vol: (0.05 + 0.12 * wgt) * ev.amp * gate });
    if (wgt > 0.35) A.kick(at, (0.07 + 0.16 * wgt) * gate);
    if (L.type === 2 || L.type === 3 || L.type === 8) {
      A.tone(H.chordTone(((L.ang * 3) | 0) % 5, 2), { at, vol: 0.018 * gate, dur: 0.12, attack: 0.002, type: 'sine', rev: 0.35, role: 'bells' });
    }
  }
  reg({
    id: 'SRC-67', family: 'SRC-67', ver: 1,
    title: 'ISOTRP B · Gated', tech: 'GLSL + FRAME-EXACT A/V SEQUENCER / ONE-FRAME FLASHES',
    music: MUSIC_B,
    tags: ['STUDY', 'AFTER 404.ZERO', 'STROBE', 'WEBGL', 'THE SOURCE LAW'],
    desc: 'The imitation. Darkness by default, and light only as an event: every flash is one soft shape (point, disc, ring, eclipse, spindle, column, lens, a full white wash, a caustic), most of them lasting a single frame, and every flash is a sound fired by the same step of the same sequencer, shown on the frame whose click is at the speaker. Opened up it runs into bursts: runs of held whites morphing step by step, stutters, ratchets between the steps, the way the ISOTRP clip does.',
    interact: 'THE SOURCE LAW. L IS DENSITY: at the Source one hit a bar; opening it fills the bar through quarters and eighths to every sixteenth, and past two thirds it starts throwing bursts and ratchets. R IS SCALE: at the Source the flashes are points and small discs; opening it grows them through rings, eclipses and spindles to columns and full-frame washes. Both wide is the dense white section of the clip.',
    sound: '120 bpm, F phrygian. No bed: silence between hits, like the reference. Each flash = one filtered noise click whose pitch falls and whose body grows with how much of the frame the light fills; big lights add a low thump (kick, MIDI 36); rings, eclipses and caustics add a very short sine blip in key (bells). Clicks mirror to Ableton as drum notes (42/46/38 by their filter).',

    init(P) {
      const s = { noGL: noGL(P), pres: 0, dens: 0.2, scale: 0.25, drift: P.rand() * 100, seq: newSeq(), bar: null, fired: 0, hold: false, held: [] };
      P.state = s;
      if (!s.noGL) make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      presence(s, dt); s.drift += dt;
      hand(s, 'dens', inp.L, SOURCE_IDLE(s.drift, 0.2, 0.1, 0.05), dt, 6);
      hand(s, 'scale', inp.R, SOURCE_IDLE(s.drift + 17, 0.25, 0.12, 0.06), dt, 6);
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return noGLDraw(g, w, h, 'ISOTRP B');
      const c = clock();
      if (!audioOwns(s)) pump(P, c.dom, c.t, c.t + 0.05, MUSIC_B.bpm, genB);
      let lights = visible(P, c.t);
      if (s.hold) { if (lights.length && s.fired !== s._hf) { s.held = lights; s._hf = s.fired; } lights = s.held; }
      render(P, g, w, h, lights, { t, soft: 0.25, exp: 1.0 });
      hud(P, g, w, h, 'DENSITY ' + Math.round(s.dens * 100) + '   SCALE ' + Math.round(s.scale * 100) +
        '   FLASHES ' + s.fired + (s.bar && s.bar.burst ? '   · BURST ' + s.bar.mode.toUpperCase() : '') + (c.dom === 'a' ? '   · A/V LOCKED' : ''));
    },
    audio(A, P) {
      return {
        tick() {
          const s = P.state; if (s.noGL || !T.running) return;
          s.seq.tickWall = performance.now();
          const now = A.t(), gate = 0.4 + 0.6 * s.pres;
          pump(P, 'a', now, now + 0.12, MUSIC_B.bpm, genB, ev => soundB(A, P, ev, gate));
        },
        stop() {}
      };
    }
  });

  /* ================= C · ISOTRP · BEAM ================= */
  // gate events carry no shape: a probe whose intensity visible() scales tells the beam how open it is
  const GATE_PROBE = { type: 0, x: 0, y: 0, s: 0.001, i: 1 };
  function genC(P, k, t, sx) {
    const s = P.state, gt = s.gate, rnd = P.rand;
    if (gt < 0.12) return [];
    const every = gt < 0.35 ? 4 : gt < 0.6 ? 2 : 1;
    if (((k % every) + every) % every) return [];
    if (rnd() < 0.12) return [];                      // algorithmic, not a metronome
    const per = every * sx;
    const duty = 0.5 - 0.5 * clamp((gt - 0.12) / 0.7);
    const dur = Math.max(0.001, per * duty);
    const out = [{ t, dur, tail: 0.01, amp: 1, lights: [GATE_PROBE] }];
    if (gt > 0.85 && rnd() < 0.5) out.push({ t: t + sx / 2, dur: 0.001, tail: 0, amp: 0.9, lights: [GATE_PROBE] });
    return out;
  }
  function beamLights(s, T0) {
    const wv = s.wid, pinch = 0.35 + 0.45 * (0.5 + 0.5 * Math.cos(T0 * TAU));
    const spW = 1 - smoothstepJS(0.45, 0.85, wv), coW = smoothstepJS(0.3, 0.8, wv);
    const out = [];
    if (spW > 0.01) out.push({ type: 4, x: 0, y: 0.02, s: 0.40 + 0.08 * wv, i: spW, prm: pinch * (1 - 0.6 * wv), asp: 0.5 + 1.8 * wv });
    if (coW > 0.01) out.push({ type: 5, x: 0, y: 0, s: 0.05 + 0.33 * wv, i: coW * 1.05 });
    return out;
  }
  function smoothstepJS(a, b, x) { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); }
  reg({
    id: 'SRC-68', family: 'SRC-68', ver: 1,
    title: 'ISOTRP C · Beam', tech: 'GLSL SPINDLE → COLUMN / SOUND GATED WITH THE LIGHT',
    music: MUSIC_B,
    tags: ['STUDY', 'AFTER 404.ZERO', 'STROBE', 'WEBGL', 'ASCENSION', 'THE SOURCE LAW'],
    desc: 'The vertical light of the ISOTRP clip: a pinched spindle of light with a burning core line that breathes on an eight-beat cycle, widening into a full-height column. Held steady it is a beam to stand under; opened up it is chopped into quarters, eighths and sixteenths until it is a strobe, and the tone it makes is chopped with it, on the same sample, by the same gate.',
    interact: 'THE SOURCE LAW. L IS WIDTH: at the Source a hairline spindle; opening it swells the spindle and hands it over to a wide column. R IS THE GATE: at the Source the beam is steady; opening it chops it, quarters to eighths to sixteenths, the on-time shrinking to a single frame; at arm\'s length it throws ratchets between the steps.',
    sound: '120 bpm, F phrygian. The beam is a tone: a sub and a detuned saw pair on the root through a low-pass that opens with the width. The steady beam sounds steady; the chopped beam is the same tone through a gain that is switched on and off at the exact audio-clock times the light is, plus a tiny click on each. MIDI: bass on the root, texture energy follows the width.',

    init(P) {
      const s = { noGL: noGL(P), pres: 0, wid: 0.2, gate: 0.2, drift: P.rand() * 100, seq: newSeq(), fired: 0, hold: false, held: [] };
      P.state = s;
      if (!s.noGL) make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      presence(s, dt); s.drift += dt;
      hand(s, 'wid', inp.L, SOURCE_IDLE(s.drift, 0.22, 0.1, 0.05), dt, 5);
      hand(s, 'gate', inp.R, SOURCE_IDLE(s.drift + 9, 0.08, 0.06, 0.06), dt, 6);
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return noGLDraw(g, w, h, 'ISOTRP C');
      const c = clock();
      if (!audioOwns(s)) pump(P, c.dom, c.t, c.t + 0.05, MUSIC_B.bpm, genC);
      const beat = c.dom === 'a' ? T.phase(8) : ((c.t * MUSIC_B.bpm / 60) % 8) / 8;
      const base = beamLights(s, beat);
      const steady = 1 - smoothstepJS(0.05, 0.3, s.gate);
      // the gate events carry no shape of their own: they switch the beam
      const ev = visible(P, c.t);
      let on = 0; for (const L of ev) on = Math.max(on, L.i);
      let lights = base.map(L => Object.assign({}, L, { i: L.i * Math.max(steady * 0.9, on) }));
      if (s.hold) { if ((on > 0.9 && s.fired !== s._hf) || steady > 0.5) { s.held = lights; s._hf = s.fired; } lights = s.held; }
      render(P, g, w, h, lights, { t, soft: 0.3, exp: 0.95 + 0.25 * s.wid });
      hud(P, g, w, h, 'WIDTH ' + Math.round(s.wid * 100) + '   GATE ' + Math.round(s.gate * 100) +
        (steady > 0.5 ? '   · STEADY' : '   · CHOPPED') + (c.dom === 'a' ? '   · A/V LOCKED' : ''));
    },
    audio(A, P) {
      const v = A.voice();
      const o1 = v.osc('sawtooth', 87), o2 = v.osc('sawtooth', 87), sub = v.osc('sine', 43.6);
      o2.detune.value = 9; o1.detune.value = -7;
      const f = v.filter('lowpass', 300, 0.9);
      const steadyG = v.g(0), chopG = v.g(0);
      o1.connect(f); o2.connect(f); sub.connect(f);
      f.connect(steadyG); f.connect(chopG); steadyG.connect(v.group); chopG.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.35; chopG.connect(sd); sd.connect(A.revIn); }
      const tune = gl => { const r = H.chordTone(0, -2); A.set(o1.frequency, r * 2, gl); A.set(o2.frequency, r * 2, gl); A.set(sub.frequency, r, gl); };
      tune(0.05); H.onChord(() => tune(0.6));
      v.fadeIn(1, 1.2);
      return {
        tick() {
          const s = P.state; if (s.noGL || !T.running) return;
          s.seq.tickWall = performance.now();
          const now = A.t(), gate = 0.4 + 0.6 * s.pres;
          const steady = 1 - smoothstepJS(0.05, 0.3, s.gate), lvl = (0.05 + 0.05 * s.wid) * gate;
          A.set(steadyG.gain, lvl * steady * 0.9, 0.08);
          A.set(f.frequency, 180 + 2600 * Math.pow(s.wid, 1.5), 0.2);
          pump(P, 'a', now, now + 0.12, MUSIC_B.bpm, genC, ev => {
            const d = Math.max(0.012, ev.dur);
            chopG.gain.setValueAtTime(lvl * ev.amp, ev.t);
            chopG.gain.setValueAtTime(0, ev.t + d);
            A.hit({ at: ev.t, freq: 5200, q: 1.2, dur: 0.018, vol: 0.03 * gate });
          });
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('bass', s.wid); MOut.expr('texture', s.gate); }
        },
        stop() { v.kill(); }
      };
    }
  });

  /* ================= D · ISOTRP · TRAILS (feedback) ================= */
  function genD(P, k, t, sx) {
    const s = P.state, st = ((k % 16) + 16) % 16, rnd = P.rand;
    if (st === 0 || !s.pat) { s.pat = euclid(Math.max(1, Math.round(1 + s.dens * 9)), 16); s.rot = (rnd() * 16) | 0; }
    if (!s.pat[(st + s.rot) % 16]) return [];
    const r = rnd();
    const type = s.forceType !== undefined ? s.forceType : (r < 0.45 ? 2 : r < 0.65 ? 8 : r < 0.8 ? 3 : r < 0.9 ? 1 : 0);
    const L = makeLight(type, 0.35 + 0.4 * rnd(), rnd);
    L.x = (rnd() - 0.5) * 1.1; L.y = (rnd() - 0.5) * 0.5;
    return [{ t, dur: 0.001, tail: 0.035, amp: 0.9 + 0.3 * rnd(), lights: [L], w: weight(L) }];
  }
  reg({
    id: 'SRC-69', family: 'SRC-69', ver: 1,
    title: 'ISOTRP D · Trails', tech: 'GLSL + PING-PONG FEEDBACK / ECHOES IN LIGHT AND SOUND',
    music: MUSIC_B,
    tags: ['STUDY', 'AFTER 404.ZERO', 'FEEDBACK', 'WEBGL', 'THE SOURCE LAW'],
    desc: 'The doubled, smeared rings of the ISOTRP clip (around 3.7 s), taken as a question: what if they are video feedback? Single-frame rings, caustics and eclipses fire across the frame on the grid, and each one leaves echoes that expand, soften and fade through a feedback loop. The sound echoes exactly as long as the light does: the same hand sets the delay send.',
    interact: 'THE SOURCE LAW. L IS MEMORY: at the Source every flash is gone in a frame, clean; opening it lengthens the trails to over a second, the echoes growing outward and blurring as they fade, and the delay on the sound opens with it. R IS DENSITY: one ring a bar at the Source, up to ten a bar at arm\'s length.',
    sound: '120 bpm, F phrygian. Each ring is a bell in key, pitched by its size (big rings low), with a small click on the strike; the delay send and the reverb follow L, so echoes in the sound and echoes in the light share one control. MIDI: bells.',

    init(P) {
      const s = { noGL: noGL(P), pres: 0, mem: 0.2, dens: 0.25, drift: P.rand() * 100, seq: newSeq(), fired: 0, hold: false, held: [], pat: null, rot: 0 };
      P.state = s;
      if (!s.noGL) make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      presence(s, dt); s.drift += dt;
      hand(s, 'mem', inp.L, SOURCE_IDLE(s.drift, 0.3, 0.12, 0.05), dt, 5);
      hand(s, 'dens', inp.R, SOURCE_IDLE(s.drift + 23, 0.25, 0.1, 0.06), dt, 6);
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return noGLDraw(g, w, h, 'ISOTRP D');
      const c = clock();
      if (!audioOwns(s)) pump(P, c.dom, c.t, c.t + 0.05, MUSIC_B.bpm, genD);
      const dt = Math.min(0.1, Math.max(0.001, t - (s._lt || t))); s._lt = t;
      let lights = visible(P, c.t);
      if (s.hold) { if (lights.length && s.fired !== s._hf) { s.held = lights; s._hf = s.fired; } lights = s.held; }
      const mem = clamp(s.mem), tau = 0.02 + 1.6 * Math.pow(mem, 1.4);
      render(P, g, w, h, lights, {
        t, soft: 0.2, fb: Math.exp(-dt / tau), zoom: 1 + dt * 0.30 * mem, dy: -dt * 0.01 * mem,
        blur: 1.4 * mem, exp: 1.0 / (1 + 3.2 * Math.pow(mem, 1.2) * (0.4 + 0.6 * s.dens))
      });
      hud(P, g, w, h, 'MEMORY ' + Math.round(mem * 100) + ' (' + tau.toFixed(2) + ' s)   DENSITY ' + Math.round(s.dens * 100) +
        '   RINGS ' + s.fired + (c.dom === 'a' ? '   · A/V LOCKED' : ''));
    },
    audio(A, P) {
      return {
        tick() {
          const s = P.state; if (s.noGL || !T.running) return;
          s.seq.tickWall = performance.now();
          const now = A.t(), gate = 0.4 + 0.6 * s.pres, mem = clamp(s.mem);
          pump(P, 'a', now, now + 0.12, MUSIC_B.bpm, genD, ev => {
            const L = ev.lights[0], oct = L.s > 0.3 ? -1 : L.s > 0.18 ? 0 : 1;
            A.bell(H.chordTone(((L.x + 1) * 3.5) | 0, oct), { at: ev.t, vol: 0.03 * ev.amp * gate, dur: 1.2 + 2 * mem, rev: 0.3 + 0.5 * mem, del: 0.05 + 0.6 * mem, role: 'bells' });
            A.hit({ at: ev.t, freq: 7000, q: 1, dur: 0.02, vol: 0.035 * gate });
          });
          if (typeof MOut !== 'undefined' && MOut.expr) MOut.expr('bells', mem);
        },
        stop() {}
      };
    }
  });

  window.ISO = { render, make, clock, pump, visible, TYPES };
})();
