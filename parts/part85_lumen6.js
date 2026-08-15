/* ---------- SRC-38.6 · LUMEN FIELD (the exact cut) ---------- */
// A minimal shader-on-quad post-pass: the scene draws normally onto the 2D
// canvas as always, then this fragment shader samples THAT canvas as a
// texture and adds a slight film grain + a soft luminosity lift before the
// result is drawn back over the same canvas. No core files touched — this
// is entirely local to this scene, same "render offscreen, then drawImage"
// pattern the other three.js scenes in this file already use.
const LUMEN6_GRAIN_FS = `
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 col = texture2D(uTex, uv);
  float lum = dot(col.rgb, vec3(0.299, 0.587, 0.114));
  col.rgb += col.rgb * smoothstep(0.32, 1.0, lum) * 0.32;
  float n = hash(gl_FragCoord.xy + uTime * 47.0);
  col.rgb += (n - 0.5) * 0.045;
  gl_FragColor = vec4(col.rgb, 1.0);
}`;

reg({
  id: 'SRC-38.6', family: 'SRC-38', ver: 6, title: 'Lumen Film', tech: 'GEM FILM / APERTURE ORGAN',
  music: {
    bpm: 66, root: 50, mode: 'dorian', chordBars: 4,
    // PEDAL ON D. The film gets lighter as the progression walks — Dm9 is the
    // closed frame, D6/9 is the frame full of holes.
    chords: [
      [0, 7, 15, 19, 26],   // Dm9
      [0, 5, 12, 17, 22],   // Gsus/D
      [0, 8, 15, 20, 24],   // B♭/D
      [0, 9, 14, 16, 21]    // D6/9    — the light gets through
    ],
    chordNames: ['Dm9', 'Gsus/D', 'B♭/D', 'D6/9']
  },
  fx: { bloom: 0.4 },
  tags: ['EXACT REFERENCE CUT', 'GRAIN + LUMINOSITY SHADER', 'BIGGER BEAMS', 'EVERY STONE ITS OWN CUT'],
  desc: 'V6: the facets are cut exactly the way the reference illustration cuts them — each half of the diamond is three NESTED triangles sharing one corner and the apex, the third point sweeping inward from the far corner in three steps, each layer painted over the last. No two stones share a size, a gradient angle, or a gradient tightness; every one is cut by hand, so to speak. The light beams are bigger again, and the red/blue chromatic separation lives only right at their edges, not through their whole width. A last pass — a real fragment shader sampling the finished frame — lays a slight film grain over everything and lifts the brightest points a little further, the way light actually blooms on film.',
  interact: 'R = LIGHT PRESSURE, unchanged — the lamp behind the sheet. Draw in and the film is closed, a faint faceted lacework and nothing else. Reach out and the junctions blow open one at a time, from the middle of the sheet outward, each one adding its own held note to the chord: the frame fills with light and the chord fills with voices, and you can hold it anywhere on the way. A hole always tells you before it commits — it leaks a little glow half a beat early, then blooms into a corner-flare with its note on the sixteenth. L = ORIENTATION — an absolute dial: hand at the sphere and the crystals sit at rest; reach out and the whole field turns with your hand, up to a full turn at full reach. Every open hole\'s rays are still anchored to real diamond corners, so turning L sweeps both the rays and which facets are catching the light. Sonically L still runs the same glassy-to-warm sweep it always has.',
  sound: 'An aperture organ. Every open hole holds one voice — pitch by where it sits in the frame (high in the frame = high in the chord), stereo position by where it sits left to right — so the picture and the chord are literally the same object; count the holes and you have counted the voices. Voices enter rolled low-to-high like a harp and each entrance is doubled by a glass bell (MIDI role: bells) on the sixteenth it commits. L still opens every voice\'s filter together and detunes their partials. Underneath: a slow air bed and a root pedal that never moves. NO PERCUSSION. Ableton: pad ch2 = the aperture voices (CC74 = L), bells ch5, texture ch6 = air, bass ch3 = pedal.',

  init(P) {
    const S = Math.min(P.w, P.h), w = P.w, h = P.h;
    // P.focused is still false during init — size off the area instead
    const N = areaScale(P) > 1.6 ? 44 : 18;
    const cells = [];
    for (let i = 0; i < N; i++) {
      // six facets per stone (three nested triangles per half); each gets
      // its own gradient angle AND its own tightness (how short/steep the
      // colour run is) — no two stones, and no two facets, match
      const facets = [];
      for (let k = 0; k < 6; k++) facets.push({ ang: P.rand() * TAU, tight: 0.25 + P.rand() * 0.95 });
      cells.push({
        x: P.rand() * w, y: P.rand() * h,
        r: S * (0.075 + P.rand() * 0.235),   // much wider size spread than before
        ph: P.rand() * TAU, sp: 0.1 + P.rand() * 0.22,
        facets,
        drift: (P.rand() - 0.5) * 0.5,
        baseRot: P.rand() * TAU, rot: 0
      });
    }
    // a few rounds of pushing apart — soap does this on its own in a second
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = cells[i], b = cells[j];
          // 0.74 — the cells must OVERLAP, or the sheet has holes in it that
          // are not apertures, just gaps, and it stops reading as one film
          const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * 0.74;
          const d = Math.hypot(dx, dy) || 1;
          if (d < rr) {
            const f = (rr - d) * 0.5, ux = dx / d * f, uy = dy / d * f;
            a.x -= ux; a.y -= uy; b.x += ux; b.y += uy;
          }
        }
      }
      for (const c of cells) {
        c.x = clamp(c.x, -c.r * 0.3, w + c.r * 0.3);
        c.y = clamp(c.y, -c.r * 0.3, h + c.r * 0.3);
      }
    }
    // THE SEAMS: every place two cells press together is a junction, and a
    // junction is where the film gets thin enough for the lamp to find it.
    const ap = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = cells[i], b = cells[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > (a.r + b.r) * 0.82) continue;
        const k = a.r / (a.r + b.r);
        ap.push({ a: i, b: j, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, open: 0, lit: 0, on: false, arm: 0, size: Math.min(a.r, b.r) });
      }
    }
    // thresholds rise with distance from the middle: the light spreads outward
    const cx = w / 2, cy = h / 2, diag = Math.hypot(w, h) * 0.5;
    for (const p of ap) p.th = clamp(Math.hypot(p.x - cx, p.y - cy) / diag * 0.85 + 0.06) * (0.75 + P.rand() * 0.45);
    ap.sort((u, z) => u.th - z.th);
    ap.forEach((p, i) => { p.i = i; p.voice = i < 8 ? i : -1; });
    P.state = { cells, ap, pres: 0, lightP: 0, thick: 0, rotL: 0, spin: 0, openN: 0, lamp: 0, evq: [], noGL: false };

    // the grain+luminosity post-pass — entirely local to this scene
    if (typeof THREE === 'undefined' || window.IS_MOBILE) { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    // render the post-pass well under-sized, upscale on drawImage — this is
    // an ADDED pass on top of an already-heavy field of gradient triangles,
    // so keep both the render target AND the texture upload small: uploading
    // the full-resolution canvas as a texture every frame is what makes this
    // expensive under software GL, not the shader math itself
    const sc = Math.min(1, 480 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    T3.srcCanvas = document.createElement('canvas');
    T3.srcCanvas.width = T3.rw; T3.srcCanvas.height = T3.rh;
    T3.srcCtx = T3.srcCanvas.getContext('2d');
    T3.tex = new THREE.CanvasTexture(T3.srcCanvas);
    T3.tex.minFilter = THREE.LinearFilter; T3.tex.magFilter = THREE.LinearFilter;
    const uni = { uTex: { value: T3.tex }, uRes: { value: new THREE.Vector2(T3.rw, T3.rh) }, uTime: { value: 0 } };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: LUMEN6_GRAIN_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn; T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.lightP += (clamp(inp.R) - s.lightP) * Math.min(1, dt * 7);
    s.thick += (clamp(inp.L) - s.thick) * Math.min(1, dt * 6);
    // idle tease: the lamp behind the sheet breathes on its own
    const idle = (1 - s.pres) * (0.12 + 0.1 * Math.sin(t * 0.31));
    s.lamp = Math.max(s.lightP, idle);

    // ORIENTATION: absolute dial. Hand at the sphere = the field sits at its
    // resting cut; reach out and the whole field turns with the hand, up to
    // one full turn — no momentum, it tracks the hand directly. At rest
    // (no presence) the field settles back to zero, per the abandoned-scene
    // rule, with a tiny sinusoidal wobble that hints it CAN be turned.
    s.rotL += (clamp(inp.L) - s.rotL) * Math.min(1, dt * 8);
    const targetSpin = s.pres > 0.05 ? s.rotL * TAU : 0;
    s.spin += (targetSpin - s.spin) * Math.min(1, dt * 7);

    for (const c of s.cells) {
      c.ph += dt * c.sp;
      c.x += Math.cos(c.ph * 0.7 + c.drift) * dt * 5;
      c.y += Math.sin(c.ph) * dt * 4;
      c.rot = c.baseRot + s.spin + (1 - s.pres) * 0.05 * Math.sin(t * 0.25 + c.ph * 2);
    }
    let open = 0;
    for (const p of s.ap) {
      const a = s.cells[p.a], b = s.cells[p.b];
      const k = a.r / (a.r + b.r);
      p.x = a.x + (b.x - a.x) * k; p.y = a.y + (b.y - a.y) * k;
      const want = s.lamp > p.th;
      // TELEGRAPH: light starts leaking through the seam before the hole
      // commits, so the eye is warned half a beat before the ear.
      const lead = clamp((s.lamp - p.th + 0.09) / 0.14);
      p.lit += (lead - p.lit) * Math.min(1, dt * 9);
      if (want !== p.on) {
        p.arm += dt;
        if (p.arm > 0.05) { p.on = want; p.arm = 0; s.evq.push({ p, on: want }); }
      } else p.arm = 0;
      p.open += ((p.on ? 1 : 0) - p.open) * Math.min(1, dt * (p.on ? 4 : 2.4));
      if (p.on) open++;
    }
    s.openN = open;
    if (s.evq.length > 20) s.evq.splice(0, s.evq.length - 20);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#010103';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const gate = clamp(s.pres * 1.15);          // keeps the field dark at rest
    const LIGHT_DIR = -Math.PI / 2;              // the sun is fixed; the field turns

    // THE PALETTE — lifted directly from the reference illustration's own
    // linear gradient (black → blue → mint → near-white → gold → red →
    // indigo → black). This is the ONLY colour source in the whole scene.
    const SVGSTOPS = [
      [0, '0,0,0'], [0.2, '37,85,238'], [0.4, '100,215,160'], [0.5, '242,255,242'],
      [0.6, '255,214,90'], [0.7, '225,61,47'], [0.8, '0,14,223'], [1, '0,0,0']
    ];
    const addSvgStops = (grad, a) => { for (const [t, rgb] of SVGSTOPS) grad.addColorStop(t, `rgba(${rgb},${a})`); };
    const lerp2 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

    // a diamond's 4 vertices — taller than wide, like a cut stone. Because
    // each vertex sits on a pure axis before rotation (up/right/down/left),
    // its WORLD angle is always exactly c.rot + k*90° — that's what lets the
    // rays below aim precisely at a corner instead of a made-up direction.
    const diamondPts = (c, rScale) => {
      const rx = c.r * 0.78 * rScale, ry = c.r * 1.08 * rScale, a = c.rot;
      const ca = Math.cos(a), sa = Math.sin(a);
      const raw = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]];
      return raw.map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };
    const vertAngle = (rot, k) => rot - Math.PI / 2 + k * (Math.PI / 2);
    const nearestVert = (rot, ang) => {
      let best = 0, bd = Infinity;
      for (let k = 0; k < 4; k++) {
        const d = Math.abs(Math.atan2(Math.sin(ang - vertAngle(rot, k)), Math.cos(ang - vertAngle(rot, k))));
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    };
    const strokePoly = pts => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath(); g.stroke();
    };

    // ---- THE FILM: cut exactly like the reference. Each half of the kite
    // is three NESTED triangles, not six independent wedges — they all
    // share one apex and one side corner, and the third point sweeps from
    // the far corner (full width, painted first) inward to 62% and then
    // 25% of the way across (painted last, on top). That's the reference
    // file's own construction, read straight off its polygon points.
    const FRACS = [1, 0.62, 0.253];
    for (const c of s.cells) {
      const pts = diamondPts(c, 1);
      const T = pts[0], R = pts[1], B = pts[2], L = pts[3];
      const halves = [{ apex: T, cA: L, cB: R }, { apex: B, cA: R, cB: L }];
      let fi = 0;
      for (const half of halves) {
        for (const f of FRACS) {
          const Q = lerp2(half.cA, half.cB, f);
          const fac = c.facets[fi++];
          const cx0 = (half.apex[0] + half.cA[0] + Q[0]) / 3, cy0 = (half.apex[1] + half.cA[1] + Q[1]) / 3;
          // true facing (for brightness) is independent of the facet's own
          // randomised gradient angle, so rotation still sweeps the light
          const trueAngle = Math.atan2(cy0 - c.y, cx0 - c.x);
          const lit = 0.5 + 0.5 * Math.cos(trueAngle - LIGHT_DIR);
          const alphaEnv = clamp(0.04 + lit * 0.5 * gate + s.lamp * 0.3);
          const hl = c.r * fac.tight;
          const gx1 = cx0 - Math.cos(fac.ang) * hl, gy1 = cy0 - Math.sin(fac.ang) * hl;
          const gx2 = cx0 + Math.cos(fac.ang) * hl, gy2 = cy0 + Math.sin(fac.ang) * hl;
          const fg = g.createLinearGradient(gx1, gy1, gx2, gy2);
          addSvgStops(fg, alphaEnv.toFixed(2));
          g.fillStyle = fg;
          g.beginPath(); g.moveTo(half.apex[0], half.apex[1]); g.lineTo(half.cA[0], half.cA[1]); g.lineTo(Q[0], Q[1]); g.closePath(); g.fill();
        }
      }
    }
    // one thin soft seam per stone — not a bold rim, just enough to
    // separate cell from cell; almost nothing at rest, blooms with lamp
    g.globalCompositeOperation = 'lighter';
    g.filter = `blur(${(1.6 * ms).toFixed(1)}px)`;
    for (const c of s.cells) {
      const pts = diamondPts(c, 1.01);
      g.lineWidth = Math.max(1.2 * ms, c.r * 0.022);
      g.strokeStyle = `rgba(37,85,238,${(0.05 + s.lamp * 0.4) * bright})`;
      strokePoly(pts);
    }
    g.filter = 'none';

    // ---- THE LAMP: sunlight caught at the diamonds' own corners, and only
    // there. Each aperture snaps to the ACTUAL touching vertex of each
    // adjoining stone (tracked live as they rotate) instead of the abstract
    // seam point, so the spark is always sitting on real geometry — never
    // floating over the black gap between stones.
    g.filter = `blur(${(1.1 * ms).toFixed(1)}px)`;
    for (const p of s.ap) {
      const a = Math.max(p.lit * 0.35, p.open);
      if (a < 0.01) continue;
      const A = s.cells[p.a], B = s.cells[p.b];
      const angA = Math.atan2(p.y - A.y, p.x - A.x), angB = Math.atan2(p.y - B.y, p.x - B.x);
      const kA = nearestVert(A.rot, angA), kB = nearestVert(B.rot, angB);
      const vA = diamondPts(A, 1)[kA], vB = diamondPts(B, 1)[kB];
      const sx = (vA[0] + vB[0]) / 2, sy = (vA[1] + vB[1]) / 2;

      const R = p.size * (0.13 + a * 0.4);
      const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(242,255,242,${(Math.min(0.92, a) * bright).toFixed(2)})`);
      gr.addColorStop(0.35, `rgba(37,85,238,${(a * 0.55 * bright).toFixed(2)})`);
      gr.addColorStop(0.7, `rgba(255,214,90,${(a * 0.3 * bright).toFixed(2)})`);
      gr.addColorStop(1, 'rgba(225,61,47,0)');
      g.fillStyle = gr;
      const dR = R * 1.1;
      g.beginPath();
      g.moveTo(sx, sy - dR); g.lineTo(sx + dR * 0.62, sy);
      g.lineTo(sx, sy + dR); g.lineTo(sx - dR * 0.62, sy);
      g.closePath(); g.fill();

      if (p.open > 0.2) {
        const L = R * (1.4 + p.open * 2.4);
        const dirs = [
          { a: vertAngle(A.rot, kA), len: 1 },
          { a: vertAngle(A.rot, (kA + 1) % 4), len: 0.42 },
          { a: vertAngle(B.rot, kB), len: 1 },
          { a: vertAngle(B.rot, (kB + 1) % 4), len: 0.42 }
        ];
        for (const dr of dirs) {
          const Ln = L * dr.len, cx = Math.cos(dr.a) * Ln, cy = Math.sin(dr.a) * Ln;
          const ex = sx + cx, ey = sy + cy;
          const av = p.open * (dr.len > 0.9 ? 0.34 : 0.16) * bright;
          // bigger core beam, reference-palette dispersion along its length
          const core = g.createLinearGradient(sx, sy, ex, ey);
          core.addColorStop(0, `rgba(242,255,242,${(av * 1.2).toFixed(2)})`);
          core.addColorStop(0.3, `rgba(37,85,238,${av.toFixed(2)})`);
          core.addColorStop(0.62, `rgba(255,214,90,${(av * 0.7).toFixed(2)})`);
          core.addColorStop(1, `rgba(225,61,47,0)`);
          const coreW = Math.max(2.2 * ms, R * (dr.len > 0.9 ? 0.24 : 0.13) * p.open);
          g.strokeStyle = core;
          g.lineWidth = coreW;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();

          // RGB fringe riding right at the beam's edges only — not through
          // its width — so the core stays clean and the chromatic
          // separation reads as a thin trim, the way a lens actually does it
          const perpx = -cy / Ln, perpy = cx / Ln, fr = coreW * 0.5 + 0.5 * ms;
          const fA = (av * 0.45).toFixed(2);
          g.lineWidth = Math.max(0.45 * ms, coreW * 0.1);
          g.strokeStyle = `rgba(225,61,47,${fA})`;
          g.beginPath(); g.moveTo(sx + perpx * fr, sy + perpy * fr); g.lineTo(ex + perpx * fr, ey + perpy * fr); g.stroke();
          g.strokeStyle = `rgba(37,85,238,${fA})`;
          g.beginPath(); g.moveTo(sx - perpx * fr, sy - perpy * fr); g.lineTo(ex - perpx * fr, ey - perpy * fr); g.stroke();
        }
      }
    }
    g.filter = 'none';
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(190,225,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HOLES ' + s.openN + '/' + s.ap.length + '   LAMP ' + Math.round(s.lamp * 100) +
      '   TURN ' + Math.round(s.spin / TAU * 100) + '%' +
      (s.pres < 0.3 ? '   · CLOSED' : ''), 10, h - 10);

    // ---- GRAIN + LUMINOSITY: a real fragment shader samples the frame we
    // just drew and lays a slight animated grain over it, lifting the
    // brightest points a little further. Entirely local to this scene.
    if (!s.noGL && P._three) {
      const T3 = P._three;
      T3.srcCtx.drawImage(P.canvas, 0, 0, T3.rw, T3.rh);
      T3.tex.needsUpdate = true;
      T3.uni.uTime.value = t;
      T3.renderer.render(T3.scene, T3.cam);
      g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    }
  },

  audio(A, P) {
    const v = A.voice();
    const s0 = P.state;

    /* --- air behind the sheet ------------------------------------------ */
    const n = v.noise(), nf = v.filter('bandpass', 500, 0.9), ng = v.g(0.006);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- ONE VOICE PER HOLE. Eight of them; the rest of the sheet is
       light only. Pitch by height in the frame, pan by side — the chord
       and the picture are the same object.                               */
    const NV = 8;
    const voices = [];
    for (let i = 0; i < NV; i++) {
      const o1 = v.osc('triangle', 220), o2 = v.osc('triangle', 220), o3 = v.osc('sine', 440);
      o2.detune.value = 6;
      const f = v.filter('lowpass', 700, 1.1);
      const g = v.g(0.0001);
      const pan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
      o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g);
      if (pan) { g.connect(pan); pan.connect(v.group); } else { g.connect(v.group); }
      if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; g.connect(sd); sd.connect(AE.revIn); }
      voices.push({ o1, o2, o3, f, g, pan, freq: 220, note: -1, lvl: 0 });
    }
    const setV = (vc, freq, glide) => {
      if (!isFinite(freq) || freq <= 20) return;
      vc.freq = freq;
      A.set(vc.o1.frequency, freq, glide);
      A.set(vc.o2.frequency, freq, glide);
      A.set(vc.o3.frequency, freq * 2.01, glide);
      if (typeof MOut !== 'undefined') {
        const note = MOut.f2n(freq);
        if (note !== vc.note) {
          const ch = MOut.chFor('pad'), p = performance.now();
          if (vc.note >= 0 && MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0], p); } catch (e) {} }
          vc.note = note;
          MOut.log.push({ p, role: 'pad', ch, note, vel: 62, durMs: 2600 });
          if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, 62], p); } catch (e) {} }
        }
      }
    };

    /* --- the pedal ------------------------------------------------------ */
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.014, cutoff: 220, q: 0.5 });
    const retune = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      // every open hole re-voices into the new chord, rolled low to high
      const ap = P.state.ap;
      for (const p of ap) {
        if (p.voice < 0 || !p.on) continue;
        const vc = voices[p.voice];
        setV(vc, H.chordTone(p.deg || 0, p.oct || 0), glide);
      }
    };
    retune(0.05);
    H.onChord(() => retune(0.2));
    v.fadeIn(1, 1.6);

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const thick = s.thick || 0;

        A.set(ng.gain, (0.003 + s.lamp * 0.012) * gate, 0.4);
        A.set(nf.frequency, 360 + s.lamp * 1500 + thick * 400, 0.4);
        sub[0].level(0.01 + s.lamp * 0.008, 0.5);

        /* ---- holes committing: the entrance is rolled and quantised --- */
        let ev, i = 0;
        while ((ev = s.evq.shift()) && i < 6) {
          i++;
          const p = ev.p;
          if (p.voice < 0) continue;
          const vc = voices[p.voice];
          if (ev.on) {
            // HEIGHT IS PITCH: a hole near the top of the sheet sings high
            const up = clamp(1 - p.y / P.h);
            const deg = Math.round(up * 9);
            const oct = up > 0.72 ? 1 : 0;
            p.deg = deg; p.oct = oct;
            setV(vc, H.chordTone(deg, oct), 0.08);
            if (vc.pan) A.set(vc.pan.pan, clamp(p.x / P.w * 2 - 1, -1, 1) * 0.7, 0.2);
            const at = T.next(0.25) + p.voice * 0.012;   // low-to-high harp stagger
            A.set(vc.g.gain, 0.024 + thick * 0.012, 0.35);
            A.bell(H.chordTone(deg + 3, oct + 1), { at, vol: 0.05 * gate, dur: 2.4, pan: clamp(p.x / P.w * 2 - 1, -1, 1) * 0.8, rev: 0.7 });
          } else {
            A.set(vc.g.gain, 0.0001, 0.5);
            if (typeof MOut !== 'undefined' && vc.note >= 0) {
              const ch = MOut.chFor('pad');
              if (MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
              vc.note = -1;
            }
          }
        }

        /* ---- L opens every voice's filter together --------------------- */
        for (let k = 0; k < NV; k++) {
          const vc = voices[k];
          A.set(vc.f.frequency, 420 + (1 - thick) * 2600 + s.lamp * 700, 0.25);
          A.set(vc.o2.detune, 4 + (1 - thick) * 16, 0.3);
          A.set(vc.o3.detune, (1 - thick) * 9, 0.3);
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', 1 - thick);
          MOut.expr('texture', s.lamp);
          MOut.expr('bells', clamp(s.openN / 8));
        }
      },
      stop() {
        if (typeof MOut !== 'undefined' && MOut.wants() && MOut.port) {
          const ch = MOut.chFor('pad');
          for (const vc of voices) if (vc.note >= 0) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
        }
        v.kill();
      }
    };
  }
});
