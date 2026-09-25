/* ---------- SRC-70.2 · LIGAM À TERRA V2 — FALLING WITH THE ROOTS ----------
   Edson, Sep 25, after V1: "it should be more immersive. Maybe the growth
   keeps happening and the camera moves down following it, with some balance,
   like it's being hand held by someone falling together with the progression
   of the roots."

   So V1's picture (a point, two roots, current running down) becomes a
   DESCENT with no bottom:
   · THE GROWTH NEVER ENDS. Roots are generated in TILES just ahead of the
     growing tip and dropped once they are far above the lens. Nothing is ever
     rebuilt per frame; a tile is ~1k segments and costs a few ms once.
   · THE TWO ROOTS BRAID. The son (gold) and the ache (crimson) descend on
     opposite phases of one loose helix around a single axis — the two things
     that ground him, twisting around each other all the way down. It is also
     what keeps them in frame forever.
   · THE CAMERA FALLS WITH THE TIP, HAND-HELD. It rides just above and behind
     the growing front, looking down the fall. On top of that: a breathing
     bob, a shake that grows with speed, a slow balancing ROLL (someone
     falling and steadying), and a lean into the direction the roots turn.
     The lens follows the tip through an under-damped spring, so a change of
     speed makes it hunt.
   · Laterals and dust pass close to the lens and blur into bokeh; dust is an
     endless camera-relative volume, so the parallax never runs out.
   · Old root above the lens has aged to dark wire; only the current lights
     it. A pulse that reaches the growing tip is a SOUND.

   HANDS — the Source law, and the last position holds
     LEFT  = the speed of the fall. At the Source: nearly a hover.
             Wide: falling fast, the shake and the roll open up.
     RIGHT = the current, as in V1: density, speed, glints, the ache's throb.
   Keyed A aeolian, 62 — Movement II, as V1. */
(() => {
  const GLSL_COMMON = `
    precision highp float;
    uniform float uT, uCamY;
    uniform vec2 uRes; uniform float uFocus, uAper, uProj, uCocMax;
    float cocPx(float z){ return min(uCocMax, uAper * abs(1.0/uFocus - 1.0/z) * uRes.y); }
    vec3 sway(vec3 p){
      return p + vec3(sin(uT*0.23 + p.y*1.7), 0.0, cos(uT*0.19 + p.x*2.1)) * 0.012;
    }
    uniform float uPhA, uPhB, uDens, uSharp, uCur;
    float packet(float s, float ph){
      float w = fract(ph - s * uDens);
      return pow(1.0 - w, uSharp) * smoothstep(0.0, 0.015, w);
    }`;

  const RIB_VS = GLSL_COMMON + `
    uniform float uG, uFade, uLine;
    attribute vec3 aA; attribute vec3 aB; attribute vec2 aT; attribute vec2 aC;
    attribute float aW; attribute float aK;
    varying vec3 vCol; varying float vA; varying float vSide;
    void main(){
      float gr = clamp((uG - aT.x) / max(1e-4, aT.y - aT.x), 0.0, 1.0);
      if (gr <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vA = 0.0; return; }
      vec3 a = sway(aA), b = sway(mix(aA, aB, gr));
      vec4 ca = projectionMatrix * modelViewMatrix * vec4(a, 1.0);
      vec4 cb = projectionMatrix * modelViewMatrix * vec4(b, 1.0);
      if (ca.w < 0.05 || cb.w < 0.05) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vA = 0.0; return; }
      vec2 d = (cb.xy / cb.w - ca.xy / ca.w) * uRes; float L = length(d);
      d = L > 1e-4 ? d / L : vec2(0.0, 1.0);
      vec2 n = vec2(-d.y, d.x);
      vec4 cp = aC.x < 0.5 ? ca : cb;
      float z = cp.w;
      float base = max(1.2, aW * uProj / z * uLine);
      float coc = cocPx(z);
      float wpx = min(base + coc, 90.0);
      cp.xy += n * aC.y * wpx / uRes * cp.w;
      gl_Position = cp;

      float s = mix(aT.x, aT.y, aC.x);
      float age = uG - s;                                   // in units of root length
      vec3 bright = aK < 0.5 ? vec3(1.0, 0.72, 0.28) : (aK < 1.5 ? vec3(1.0, 0.20, 0.14) : vec3(0.80, 0.52, 0.32));
      vec3 old    = aK < 0.5 ? vec3(0.55, 0.36, 0.10) : (aK < 1.5 ? vec3(0.50, 0.06, 0.05) : vec3(0.26, 0.15, 0.09));
      vec3 c = age < 0.12 ? mix(vec3(1.0, 0.95, 0.80), bright, age / 0.12) : mix(bright, old, smoothstep(0.12, 2.5, age));
      c *= aW > 0.02 ? 1.5 : 1.0;
      float ph = aK > 0.5 && aK < 1.5 ? uPhB : uPhA;
      float cur = packet(s, ph) * uCur;
      vec3 hot = aK > 0.5 && aK < 1.5 ? vec3(1.0, 0.45, 0.35) : vec3(1.0, 0.92, 0.70);
      vCol = c * (0.30 + 0.5 * uCur) + hot * cur * (aW > 0.02 ? 3.2 : 1.6);
      vCol += vec3(1.0, 0.9, 0.7) * exp(-max(age, 0.0) * 18.0) * 0.9;   // the growing tip burns
      vA = uFade * clamp(base / wpx, 0.04, 1.0) * smoothstep(0.08, 0.35, z);
      vSide = aC.y;
    }`;
  const RIB_FS = `
    varying vec3 vCol; varying float vA; varying float vSide;
    void main(){ float e = 1.0 - vSide * vSide; gl_FragColor = vec4(vCol * vA * e, 1.0); }`;

  const PT_VS = GLSL_COMMON + `
    uniform float uG, uFade, uPt;
    attribute float aT; attribute float aS; attribute float aJ; attribute float aK;
    varying vec3 vCol; varying float vA; varying float vBlur;
    void main(){
      bool dust = aK > 2.5;
      float age = uG - aT;
      if (!dust && age <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vA = 0.0; return; }
      vec3 p = position;
      if (dust) {
        // an endless volume that travels with the lens: the soil streams up past you
        p.y = uCamY + mod(p.y - uCamY + 3.0, 6.0) - 3.0;
        p += vec3(sin(uT * 0.05 + aJ * 40.0), 0.0, cos(uT * 0.043 + aJ * 23.0)) * 0.05;
      }
      vec4 mv = modelViewMatrix * vec4(sway(p), 1.0);
      gl_Position = projectionMatrix * mv;
      float z = -mv.z;
      float base = min(18.0, max(1.3, aS * uProj / max(z, 0.05) * uPt));
      float coc = cocPx(max(z, 0.05));
      float s = min(base + coc, 64.0);
      gl_PointSize = s;
      float energy = clamp((base * base) / (s * s), 0.03, 1.0);
      float near = smoothstep(0.1, 0.4, z);
      if (dust) {
        vCol = vec3(0.85, 0.45, 0.20) * (0.30 + 0.35 * uCur);
        vA = uFade * 0.5 * energy * mix(1.0, 2.2, smoothstep(2.0, 16.0, coc)) * near;
      } else {
        float ph = aK > 0.5 && aK < 1.5 ? uPhB : uPhA;
        float g = packet(aT, ph) * uCur;
        vec3 hot = aK > 0.5 && aK < 1.5 ? vec3(1.0, 0.5, 0.4) : vec3(1.0, 0.93, 0.75);
        vec3 base3 = aK < 0.5 ? vec3(0.6, 0.4, 0.15) : (aK < 1.5 ? vec3(0.55, 0.1, 0.08) : vec3(0.35, 0.22, 0.12));
        vCol = base3 * 0.5 + hot * g * 2.6;
        vA = uFade * energy * smoothstep(0.0, 0.02, age) * (0.35 + 1.2 * g) * near;
      }
      vBlur = clamp(coc / max(base, 1.0) / 3.0, 0.0, 1.0);
    }`;
  const PT_FS = `
    varying vec3 vCol; varying float vA; varying float vBlur;
    void main(){
      vec2 q = gl_PointCoord * 2.0 - 1.0; float d = length(q);
      float m = smoothstep(mix(0.9, 0.97, vBlur), mix(0.4, 0.88, vBlur), d);
      m *= 1.0 + vBlur * 0.6 * smoothstep(0.55, 0.93, d);
      if (m <= 0.002) discard;
      gl_FragColor = vec4(vCol * vA * m, 1.0);
    }`;

  const LENS = {
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uCA: { value: 0.0035 }, uExpo: { value: 1.5 },
                uVig: { value: 0.7 }, uGrain: { value: 0.035 }, uRes: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform float uT, uCA, uExpo, uVig, uGrain; uniform vec2 uRes;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 c = vUv - 0.5; float r2 = dot(c, c);
        vec2 off = c * uCA * (0.4 + r2 * 4.0);
        vec3 col = vec3(texture2D(tDiffuse, vUv - off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + off).b);
        float L = dot(col, vec3(0.2126, 0.7152, 0.0722));
        col *= (1.0 - exp(-L * uExpo)) / max(L, 1e-4);
        col = min(col, vec3(1.0));
        col *= mix(1.0, smoothstep(0.62, 0.05, r2), uVig);
        col += (hash(vUv * uRes + fract(uT * 7.13) * 91.0) - 0.5) * uGrain * (0.3 + col);
        gl_FragColor = vec4(max(col, 0.0), 1.0);
      }`
  };

  // ---------- endless roots, in tiles ----------
  const TILE = 2.4;            // root length generated per tile
  function makeGrower(rand) {
    const R = (a, b) => a + (b - a) * rand();
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const rotAway = (d, ang) => { const p = norm(cross(d, [R(-1, 1), R(-1, 1), R(-1, 1)])); return norm(add(mul(d, Math.cos(ang)), mul(p, Math.sin(ang)))); };
    // the two mains: opposite phases of one loose helix
    const mains = [0, 1].map(k => ({ k, p: [k ? 0.3 : -0.3, 0, 0], d: [0, -1, 0], s: 0, ph: k * Math.PI }));
    const track = [[], []];           // (s, p) samples along each main, for the camera
    function lateral(segs, pts, p, d, len, s0, w, k, depth) {
      const n = Math.max(5, Math.round(len / 0.06));
      const step = len / n; let s = s0;
      for (let i = 0; i < n; i++) {
        d = norm(add(d, [R(-0.14, 0.14), R(-0.14, 0.14) - (0.012 + 0.018 * depth), R(-0.14, 0.14)]));
        const q = add(p, mul(d, step));
        const wi = w * (1 - 0.5 * i / n);
        segs.push({ a: p, b: q, t0: s, t1: s + step, w: wi, k });
        if (depth >= 2 && rand() < 0.22) pts.push({ p: add(q, mul(norm([R(-1, 1), R(-1, 1), R(-1, 1)]), R(0.01, 0.04))), t: s + step, s: R(0.006, 0.012), j: rand(), k });
        if (depth < 3 && i > 2 && rand() < 0.10) {
          const cd = rotAway(d, R(0.9, 1.45)); cd[1] = Math.min(cd[1], -0.05);
          lateral(segs, pts, q, norm(cd), len * R(0.5, 0.72), s + step, wi * 0.55, k, depth + 1);
        }
        p = q; s += step;
      }
      pts.push({ p, t: s, s: 0.016, j: rand(), k });
    }
    function tile() {
      const segs = [], pts = [];
      let yBot = 1e9;
      for (const m of mains) {
        const sEnd = m.s + TILE, step = 0.05;
        while (m.s < sEnd) {
          // steer toward this root's place on the helix one step down
          m.ph += step * 0.55;
          const r = 0.38 + 0.12 * Math.sin(m.s * 0.23 + m.k);
          const tx = Math.cos(m.ph) * r, tz = Math.sin(m.ph) * r;
          m.d = norm(add(m.d, [(tx - m.p[0]) * 0.35 + R(-0.06, 0.06), -0.10, (tz - m.p[2]) * 0.35 + R(-0.06, 0.06)]));
          const q = add(m.p, mul(m.d, step));
          segs.push({ a: m.p, b: q, t0: m.s, t1: m.s + step, w: 0.022, k: m.k });
          if (rand() < 0.3) pts.push({ p: add(q, mul(norm([R(-1, 1), R(-1, 1), R(-1, 1)]), R(0.02, 0.05))), t: m.s + step, s: R(0.008, 0.014), j: rand(), k: m.k });
          if (rand() < 0.13) {
            const cd = rotAway(m.d, R(1.0, 1.5)); cd[1] = Math.min(cd[1], -0.05);
            lateral(segs, pts, q, norm(cd), R(0.8, 2.0), m.s + step, 0.008, m.k, 1);
          }
          track[m.k].push({ s: m.s + step, p: q });
          m.p = q; m.s += step; yBot = Math.min(yBot, q[1]);
        }
      }
      // THE THINGS AMONG: free amber roots all around the fall, revealed with the
      // front at their depth, so the lens falls THROUGH a network, not beside two wires
      const s0 = mains[0].s - TILE, y0 = track[0].length ? track[0][Math.max(0, track[0].length - 48)].p[1] : 0;
      for (let i = 0; i < 4; i++) {
        const az = R(0, Math.PI * 2), rr = R(0.9, 2.6);
        const p0 = [Math.cos(az) * rr, y0 + R(-0.3, 0.3), Math.sin(az) * rr];
        lateral(segs, pts, p0, norm([R(-0.3, 0.3), -1, R(-0.3, 0.3)]), R(1.4, 2.4), s0 + R(0, TILE * 0.5), 0.010, 2, 1);
      }
      for (const q of segs) yBot = Math.min(yBot, q.b[1]);
      return { segs, pts, yBot, sEnd: mains[0].s };
    }
    // position of main k at path length s (for the camera)
    function at(k, s) {
      const T = track[k]; if (!T.length) return mains[k].p;
      let lo = 0, hi = T.length - 1;
      if (s <= T[0].s) return T[0].p;
      if (s >= T[hi].s) return T[hi].p;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (T[mid].s < s) lo = mid; else hi = mid; }
      const a = T[lo], b = T[hi], f = (s - a.s) / (b.s - a.s);
      return [a.p[0] + (b.p[0] - a.p[0]) * f, a.p[1] + (b.p[1] - a.p[1]) * f, a.p[2] + (b.p[2] - a.p[2]) * f];
    }
    function trim(sKeep) { for (const T of track) { let i = 0; while (i < T.length - 2 && T[i].s < sKeep) i++; if (i) T.splice(0, i); } }
    return { tile, at, trim, mains };
  }

  function buildGeo(segs, pts) {
    const NS = segs.length;
    const aA = new Float32Array(NS * 12), aB = new Float32Array(NS * 12), aT = new Float32Array(NS * 8),
          aC = new Float32Array(NS * 8), aW = new Float32Array(NS * 4), aK = new Float32Array(NS * 4);
    const idx = new Uint32Array(NS * 6), C = [[0, -1], [0, 1], [1, -1], [1, 1]];
    for (let i = 0; i < NS; i++) {
      const q = segs[i];
      for (let v = 0; v < 4; v++) {
        const o = i * 4 + v;
        aA.set(q.a, o * 3); aB.set(q.b, o * 3);
        aT[o * 2] = q.t0; aT[o * 2 + 1] = q.t1; aC[o * 2] = C[v][0]; aC[o * 2 + 1] = C[v][1];
        aW[o] = q.w; aK[o] = q.k;
      }
      const b = i * 4; idx.set([b, b + 2, b + 1, b + 1, b + 2, b + 3], i * 6);
    }
    const rg = new THREE.BufferGeometry();
    for (const [n, arr, k] of [['position', aA, 3], ['aA', aA, 3], ['aB', aB, 3], ['aT', aT, 2], ['aC', aC, 2], ['aW', aW, 1], ['aK', aK, 1]])
      rg.setAttribute(n, new THREE.BufferAttribute(arr, k));
    rg.setIndex(new THREE.BufferAttribute(idx, 1));
    const NP = pts.length;
    const pos = new Float32Array(NP * 3), pt = new Float32Array(NP), ps = new Float32Array(NP), pj = new Float32Array(NP), pk = new Float32Array(NP);
    for (let i = 0; i < NP; i++) { const q = pts[i]; pos.set(q.p, i * 3); pt[i] = q.t; ps[i] = q.s; pj[i] = q.j; pk[i] = q.k; }
    const pg = new THREE.BufferGeometry();
    for (const [n, arr, k] of [['position', pos, 3], ['aT', pt, 1], ['aS', ps, 1], ['aJ', pj, 1], ['aK', pk, 1]])
      pg.setAttribute(n, new THREE.BufferAttribute(arr, k));
    return { rg, pg };
  }

  function addTile(P) {
    const s = P.state, T3 = P._three;
    const t = s.grow.tile();
    const geo = buildGeo(t.segs, t.pts);
    const rib = new THREE.Mesh(geo.rg, T3.ribMat), pts = new THREE.Points(geo.pg, T3.ptMat);
    rib.frustumCulled = pts.frustumCulled = false;
    T3.scene.add(rib); T3.scene.add(pts);
    s.tiles.push({ rib, pts, sEnd: t.sEnd, n: t.segs.length });
    s.sGen = t.sEnd;
  }

  reg({
    id: 'SRC-70.2', family: 'SRC-70', ver: 2,
    title: 'BoT · Ligam à Terra V2', tech: 'WEBGL / ENDLESS ROOTS IN TILES + A HAND-HELD FALL + SCATTER DOF',
    audioIn: true, textIsContent: true,
    music: {
      bpm: 62, root: 45, mode: 'aeolian', chordBars: 8,
      chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
      chordNames: ['A5', 'Asus2', 'Fmaj7/A', 'Asus4']
    },
    tags: ['TEMPLE SET', 'ORBITAL WITNESS 6', 'THE ONE THAT POINTS DOWN', 'FALLING WITH THE ROOTS', 'OPEN L = THE FALL', 'OPEN R = THE CURRENT'],
    desc: '"Das coisas que me ligam à terra, meu filho e essa dor nas costas." V2 is a descent with no bottom. The roots never stop growing, and the camera falls with them, held in someone\'s hands: it rides just behind the growing tip, breathes, shakes as the fall quickens, rolls and steadies itself, and leans where the roots turn. The two roots braid around one axis all the way down — gold for the son, crimson for the ache — and the current runs down them past you into the dark. Laterals and soil pass close to the lens and blur into bokeh. Everything above has aged to dark wire; only the current lights it.',
    interact: 'THE SOURCE LAW, and the last position holds. LEFT IS THE FALL: at the Source it is nearly a hover, the roots inching down; open it and you fall faster, and the hand-held camera shakes and rolls more as it tries to keep up. RIGHT IS THE CURRENT, as in V1: one slow pulse at the Source; open it and the current thickens, quickens and glints, and the ache throbs hard. A pulse that reaches the growing tip is a sound.',
    sound: 'A aeolian, 62 — Movement II. A deep sub for the ground and a pad that opens with the speed of the fall. A soft bell each time a pulse of the son\'s current reaches the growing tip, a low thump each time the ache\'s does. MIDI: pad, bass (the ache), bells (the son).',

    init(P) {
      const s = {
        noGL: typeof THREE === 'undefined' || !THREE.EffectComposer || !THREE.UnrealBloomPass,
        pres: 0, fall: 0.2, cur: 0.2, g: 0.3, v: 0, phA: 0, phB: 0, _nA: 0, _nB: 0,
        focus: 1.5, focusV: 0, drift: P.rand() * 100, aud: 0, events: [], tiles: [], sGen: 0,
        cam: null, camV: [0, 0, 0], roll: 0, rollV: 0, lean: 0
      };
      P.state = s;
      if (s.noGL) return;
      if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
      const T3 = {}; P._three = T3;
      const sc = Math.min(1, 1600 / Math.max(P.w, P.h));
      T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
      const r = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      r.setPixelRatio(1); r.setSize(T3.rw, T3.rh, false); r.setClearColor(0x000000, 1);
      T3.renderer = r; T3.scene = new THREE.Scene();
      T3.cam = new THREE.PerspectiveCamera(46, T3.rw / T3.rh, 0.03, 60);    // wider: we are inside it
      const u = {
        uT: { value: 0 }, uCamY: { value: 0 }, uG: { value: 0 }, uFade: { value: 1 }, uLine: { value: 1 }, uPt: { value: 1 },
        uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
        uFocus: { value: 1.5 }, uAper: { value: 0.04 }, uCocMax: { value: 44 },
        uProj: { value: T3.rh / (2 * Math.tan(46 * Math.PI / 360)) },
        uPhA: { value: 0 }, uPhB: { value: 0 }, uDens: { value: 0.8 }, uSharp: { value: 20 }, uCur: { value: 0.3 }
      };
      T3.u = u;
      const mk = (vs, fs) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs,
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      T3.ribMat = mk(RIB_VS, RIB_FS); T3.ptMat = mk(PT_VS, PT_FS);
      // the soil: one endless camera-relative volume (wrapped in the shader)
      const dust = [];
      for (let i = 0; i < 900; i++) dust.push({ p: [(P.rand() - 0.5) * 6, (P.rand() - 0.5) * 6, (P.rand() - 0.5) * 6], t: -1, s: 0.012 + P.rand() * 0.02, j: P.rand(), k: 3 });
      const dg = buildGeo([], dust);
      const dpts = new THREE.Points(dg.pg, T3.ptMat); dpts.frustumCulled = false; T3.scene.add(dpts);
      s.grow = makeGrower(P.rand);
      addTile(P); addTile(P);
      const rt = new THREE.WebGLRenderTarget(T3.rw, T3.rh, { type: THREE.HalfFloatType });
      const comp = new THREE.EffectComposer(r, rt);
      comp.setPixelRatio(1); comp.setSize(T3.rw, T3.rh);
      comp.addPass(new THREE.RenderPass(T3.scene, T3.cam));
      T3.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(T3.rw, T3.rh), 0.8, 0.55, 0.35);
      comp.addPass(T3.bloom);
      T3.lens = new THREE.ShaderPass(LENS);
      T3.lens.uniforms.uRes.value = new THREE.Vector2(T3.rw, T3.rh);
      comp.addPass(T3.lens);
      T3.composer = comp;
    },

    step(P, dt, t, inp) {
      const s = P.state;
      dt = Math.min(dt, 0.1);
      s.drift += dt;
      s.pres += (SOURCE_PRES() - s.pres) * Math.min(1, dt * 1.5);
      const au = inp.audio || {};
      s.aud += (((au.live ? 1 : 0.55) * (au.level || 0)) - s.aud) * Math.min(1, dt * 6);
      const idleL = SOURCE_IDLE(s.drift, 0.20, 0.06, 0.05), idleR = SOURCE_IDLE(s.drift + 40, 0.20, 0.08, 0.07);
      const wantL = SOURCE(inp.L) * s.pres + idleL * (1 - s.pres);
      const wantR = clamp(SOURCE(inp.R) * s.pres + idleR * (1 - s.pres) + s.aud * 0.25);
      s.fall += (wantL - s.fall) * Math.min(1, dt * 2.5);
      s.cur += (wantR - s.cur) * Math.min(1, dt * 6);
      // THE FALL: root length per second. Nearly a hover at the Source.
      s.v = 0.03 + 0.75 * Math.pow(s.fall, 1.4);
      s.g += s.v * dt;

      // the current travels faster than the growth, so pulses catch the tip
      const pv = 1.2 + 3.0 * s.cur, dens = 0.5 + 1.1 * s.cur;
      const lump = 0.55 + 0.9 * Math.abs(Math.sin(s.drift * 0.37) * Math.sin(s.drift * 0.13 + 1.1));
      s.dens = dens;
      s.phA += pv * dens * dt; s.phB += pv * dens * lump * dt;
      // a pulse ARRIVING at the growing tip is a sound
      const nA = Math.floor(s.phA - s.g * dens), nB = Math.floor(s.phB - s.g * dens);
      if (nA !== s._nA) { s._nA = nA; s.events.push('son'); }
      if (nB !== s._nB) { s._nB = nB; s.events.push('ache'); }
      if (s.events.length > 8) s.events.splice(0, s.events.length - 8);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      if (!P.hosted) { g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      if (s.noGL) {
        g.fillStyle = 'rgba(255,200,150,0.7)'; g.font = '12px ui-monospace,monospace';
        g.fillText('LIGAM À TERRA V2 · needs WebGL + the three.js post stack', 10, h - 10);
      } else {
        const T3 = P._three, u = T3.u, cam = T3.cam;
        const dt = Math.min(0.1, Math.max(0.001, t - (s._lt || t))); s._lt = t;

        // keep two tiles of root ahead of the tip; drop tiles far above the lens
        while (s.sGen < s.g + TILE * 1.5) addTile(P);
        while (s.tiles.length > 2 && s.tiles[0].sEnd < s.g - TILE * 2.5) {
          const o = s.tiles.shift();
          T3.scene.remove(o.rib); T3.scene.remove(o.pts);
          o.rib.geometry.dispose(); o.pts.geometry.dispose();
        }
        s.grow.trim(s.g - TILE * 3);

        // the growing tip: midway between the two mains, where uG is
        const a = s.grow.at(0, s.g), b = s.grow.at(1, s.g);
        const tip = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        const ahead = s.grow.at(0, s.g + 0.6), ahead2 = s.grow.at(1, s.g + 0.6);
        const dir = [(ahead[0] + ahead2[0]) / 2 - tip[0], (ahead[1] + ahead2[1]) / 2 - tip[1], (ahead[2] + ahead2[2]) / 2 - tip[2]];

        // THE HAND-HELD FALL. The body rides above and behind the tip, and a
        // spring (not a rail) carries the camera there: it lags when the fall
        // quickens and overshoots when it slows, like arms keeping up.
        const orbit = s.drift * 0.06;
        const R = 1.9 - 0.3 * s.fall;
        const want = [tip[0] + Math.sin(orbit) * R, tip[1] + 1.35 + 0.3 * s.fall, tip[2] + Math.cos(orbit) * R];
        if (!s.cam) s.cam = want.slice();
        const kC = 7, cC = 2 * Math.sqrt(kC) * 0.7;
        for (let i = 0; i < 3; i++) { s.camV[i] += (kC * (want[i] - s.cam[i]) - cC * s.camV[i]) * dt; s.cam[i] += s.camV[i] * dt; }
        // hand shake: breathing + tremor that opens up with the speed of the fall
        const sh = 0.004 + 0.02 * s.fall;
        const n1 = Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.9 + 1.7) * 0.3 + Math.sin(t * 7.1 + 0.4) * 0.1 * s.fall;
        const n2 = Math.sin(t * 1.1 + 2.1) * 0.6 + Math.sin(t * 3.3 + 0.2) * 0.3 + Math.sin(t * 6.3 + 2.8) * 0.1 * s.fall;
        const breath = Math.sin(t * 0.9) * 0.012;
        cam.position.set(s.cam[0] + n1 * sh, s.cam[1] + n2 * sh + breath, s.cam[2] + n1 * n2 * sh);
        // look down the fall, a little ahead of the tip
        cam.lookAt(tip[0] + dir[0] * 0.35, tip[1] + dir[1] * 0.35, tip[2] + dir[2] * 0.35);
        // BALANCE: a slow roll that is always correcting itself, plus a lean
        // into the lateral acceleration of the body
        const lat = s.camV[0] * Math.cos(orbit) - s.camV[2] * Math.sin(orbit);
        const rollWant = 0.10 * Math.sin(t * 0.31) * (0.4 + s.fall) + lat * 0.25;
        s.rollV += (12 * (rollWant - s.roll) - 2 * Math.sqrt(12) * 0.35 * s.rollV) * dt;
        s.roll += s.rollV * dt;
        cam.rotateZ(s.roll);
        cam.updateMatrixWorld();

        // THE LENS: on the tip, under-damped (it hunts); racks away for a poem
        let fWant = Math.hypot(tip[0] - cam.position.x, tip[1] - cam.position.y, tip[2] - cam.position.z);
        fWant *= 1 + 0.06 * Math.sin(t * 0.21);
        fWant *= 1 + 2.2 * (1 - room);
        const kF = 14, cF = 2 * Math.sqrt(kF) * 0.4;
        s.focusV += (kF * (fWant - s.focus) - cF * s.focusV) * dt;
        s.focus = Math.max(0.15, s.focus + s.focusV * dt);

        u.uT.value = t; u.uCamY.value = cam.position.y; u.uG.value = s.g; u.uFocus.value = s.focus;
        u.uAper.value = 0.035 * (1 + Math.min(1.2, Math.abs(s.focusV) * 0.5));
        u.uPhA.value = s.phA; u.uPhB.value = s.phB; u.uDens.value = s.dens || 0.8;
        u.uSharp.value = 26 - 12 * s.cur;
        u.uCur.value = (0.25 + 0.95 * s.cur) * room;
        u.uFade.value = 0.55 + 0.45 * room;
        T3.bloom.strength = 0.55 + 0.6 * s.cur;
        T3.lens.uniforms.uT.value = t;
        T3.composer.render();
        g.save();
        g.globalCompositeOperation = P.hosted ? 'lighter' : 'source-over';
        g.drawImage(T3.renderer.domElement, 0, 0, w, h);
        g.restore();
      }
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.005, cutoff: 220, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.9); tune(0.9); });
      v.fadeIn(1, 2.5);
      return {
        tick(inp, dt) {
          const s = P.state, cur = s.cur, fall = s.fall;
          pad.forEach(p => { p.level(0.002 + fall * 0.006, 0.5); p.bright(180 + cur * 900 + fall * 500, 0.4); });
          A.set(sg.gain, 0.016 + fall * 0.024, 0.4);
          while (s.events.length) {
            const e = s.events.shift();
            if (e === 'son') A.tone(H.chordTone(0, 1), { vol: 0.006 + cur * 0.012, dur: 3.5, attack: 0.01, type: 'sine', rev: 0.7, role: 'bells' });
            else A.tone(H.chordTone(0, -1), { vol: 0.010 + cur * 0.030, dur: 0.9, attack: 0.02, type: 'sine', rev: 0.3, role: 'bass' });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', fall); MOut.expr('bass', cur); MOut.expr('bells', cur); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
