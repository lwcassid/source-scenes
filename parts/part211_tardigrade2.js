/* ---------- SRC-51.2 · TARDIGRADE RECURSION V2 (the weave) ----------
   Nima's round on V1: "make them overlap a bunch and spin around more, make
   them really fun and interesting, different colours, use the sound to make
   them, everything interconnected, weaving in the universe."

   Four things change. Every mapping V1 established survives them.

   1. THEY OVERLAP. V1's children stood politely off their mother at arm's
      length and the fractal read as a diagram. The ring radius now sits INSIDE
      the parent's own silhouette (0.40-0.80 of its scale against a 0.50-0.66
      size ratio), so bodies pile through each other and the frame is a tangle
      of animals rather than a spaced lattice.

   2. THEY SPIN. Every animal turns on its own axis, and generations turn in
      ALTERNATING directions at rates that climb with depth — the mother rolls
      over slowly, the fringe whirls. Rate is the music's: energy and treble.
      A busy track churns; a quiet one barely stirs.

   3. THE WEAVE. Every parent-child link is drawn as a luminous strand, bowed
      perpendicular to the link so the web looks woven rather than spoked, and
      tapered to nothing at both bodies (one gradient per strand — never a fan
      of strokes faking a glow) so the thread reads as light between animals
      instead of a line ruled across their faces. This is where the KICK now
      lives: the pulse lights the strands generation by generation on its way
      out, so you watch the beat travel along the threads before it reaches
      the animals it is going to swell.

   4. COLOUR IS THE BRANCH YOU ARE ON, and the SOUND MIXES IT. Every child
      takes its mother's hue and fans off it by its index in the ring, the fan
      narrowing 0.62x a generation — so each limb of the recursion is its own
      colour family and the frame carries a dozen hues that are all structural,
      never a gradient laid over the screen. The music owns the wheel: the
      spectral tilt ROTATES it (bass-heavy and treble-heavy sit in different
      countries of the colour circle) and loudness sets its SATURATION, so a
      quiet passage is nearly monochrome and a drop is the full spectrum.

   Everything else is V1 and stays: level = DEPTH on a high-water mark, bass =
   the scale ratio, mid = the twist, treble = the branch count quantised and
   held, kick read off inp.audio.kick (unsmoothed, back-dated, 55ms a
   generation), LEFT/CC1 = spread, RIGHT/CC2 = sensitivity, speed paints the
   rim and never the body, LinearToneMapping because ACES eats saturation.
   Makes no sound of its own. ------ */

const T2_MAXGEN = 5;
const T2_HICAP  = 8;
const T2_LOCELL = 22;
const T2_ORANGE = [255, 162,  74];
const T2_VIOLET = [186, 140, 255];

// hsl -> sRGB 0..255. The wheel is the palette now: there is no fixed table,
// because the colour of an animal is WHICH LIMB OF THE TREE IT IS ON.
function t2hsl(h, s, l, out) {
  h -= Math.floor(h);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  const k = Math.floor(h * 6);
  if (k === 0) { r = c; g = x; }
  else if (k === 1) { r = x; g = c; }
  else if (k === 2) { g = c; b = x; }
  else if (k === 3) { g = x; b = c; }
  else if (k === 4) { r = x; b = c; }
  else { r = c; b = x; }
  out[0] = (r + m) * 255; out[1] = (g + m) * 255; out[2] = (b + m) * 255;
}

function t2Decimate(geo, cells) {
  try {
    const pos = geo.attributes.position;
    if (!pos) return geo;
    const n = pos.count, pa = pos.array;
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
    const cell = Math.max(sx, sy, sz) / cells;
    if (!(cell > 0)) return geo;
    const GX = Math.ceil(sx / cell) + 2, GY = Math.ceil(sy / cell) + 2;
    const map = new Map(), remap = new Int32Array(n);
    const ax = [], ay = [], az = [], cnt = [];
    for (let i = 0; i < n; i++) {
      const x = pa[i * 3], y = pa[i * 3 + 1], z = pa[i * 3 + 2];
      const gx = Math.floor((x - bb.min.x) / cell);
      const gy = Math.floor((y - bb.min.y) / cell);
      const gz = Math.floor((z - bb.min.z) / cell);
      const key = (gz * GY + gy) * GX + gx;
      let j = map.get(key);
      if (j === undefined) { j = ax.length; map.set(key, j); ax.push(0); ay.push(0); az.push(0); cnt.push(0); }
      remap[i] = j; ax[j] += x; ay[j] += y; az[j] += z; cnt[j]++;
    }
    const m = ax.length;
    if (m < 24) return geo;
    const out = new Float32Array(m * 3);
    for (let j = 0; j < m; j++) { out[j * 3] = ax[j] / cnt[j]; out[j * 3 + 1] = ay[j] / cnt[j]; out[j * 3 + 2] = az[j] / cnt[j]; }
    const idx = geo.index ? geo.index.array : null;
    const len = idx ? idx.length : n;
    const tri = [];
    for (let i = 0; i + 2 < len; i += 3) {
      const a = remap[idx ? idx[i] : i], b = remap[idx ? idx[i + 1] : i + 1], c = remap[idx ? idx[i + 2] : i + 2];
      if (a === b || b === c || a === c) continue;
      tri.push(a, b, c);
    }
    if (tri.length < 36) return geo;
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(out, 3));
    g2.setIndex(tri);
    g2.computeVertexNormals();
    return g2;
  } catch (e) { return geo; }
}

// the IFS. V2 carries two more fields down the tree: the node's HUE (its
// mother's, fanned by which child it is) and its PARENT, which is what the
// weave is drawn along.
function t2Tree(P) {
  const s = P.state;
  const B = s.branch, ratio = s.ratio, SPF = s.spf, SPFO = s.spfo;
  s.nx[0] = 0; s.ny[0] = 0; s.nz[0] = 0; s.ns[0] = 1;
  s.na[0] = Math.PI * 0.5 + s.rot; s.ng[0] = 0; s.np[0] = 1;
  s.nh[0] = s.hue0; s.npar[0] = -1; s.nsib[0] = -1;
  let start = 0, curN = 1, total = 1, curScale = 1, fan = 0.50;
  for (let g = 0; g < T2_MAXGEN; g++) {
    const pres = clamp(s.depth - g);
    if (pres <= 0.02) break;
    const childScale = curScale * ratio;
    if (childScale < 0.011) break;
    const add = curN * B;
    if (total + add > s.cap) break;          // a generation arrives WHOLE
    const twist = s.twist + g * 0.37;
    const off = (g & 1) ? 0.5 : 0;
    let w = total;
    for (let i = start; i < start + curN; i++) {
      const px = s.nx[i], py = s.ny[i], pz = s.nz[i], ps = s.ns[i], pa = s.na[i], ph = s.nh[i];
      // TWO RADII. One spacing for everything made a single tight ball with
      // no black left in it, and a weave with nowhere to be seen. The mother's
      // own children are thrown WIDE — those are the limbs, and the strands
      // that tie them back to her cross real gaps — while everything deeper
      // hugs its own parent and overlaps it. Dense clumps, open web.
      const d = ps * (g === 0 ? SPFO : SPF);
      for (let k = 0; k < B; k++) {
        const ang = pa + twist + (k + off) * TAU / B;
        s.nx[w] = px + Math.cos(ang) * d;
        s.ny[w] = py + Math.sin(ang) * d;
        s.nz[w] = pz - ps * 0.20;
        s.ns[w] = childScale;
        s.na[w] = ang;
        s.ng[w] = g + 1;
        s.np[w] = pres;
        // THE FAN, ON A GOLDEN STEP. Fanning hue by k directly made hue track
        // the placement ANGLE, and the frame came out red-on-the-left,
        // cyan-on-the-right — a spatial gradient wearing a structural costume,
        // which is the one thing colour is not allowed to be. The golden
        // increment puts neighbours in the ring far apart on the wheel, so the
        // colour says WHICH CHILD, never WHERE.
        s.nh[w] = ph + fan * (((k * 0.6180339887) % 1) - 0.5) + 0.055 * g;
        s.npar[w] = i;
        s.nsib[w] = (k === B - 1) ? (w - B + 1) : (w + 1);  // the ring closes
        w++;
      }
    }
    start = total; total = w; curN = add; curScale = childScale; fan *= 0.55;
  }
  s.count = total;
}

reg({
  id: 'SRC-51.2', family: 'SRC-51', ver: 2,
  title: 'Tardigrade Recursion V2', tech: 'WEBGL / IFS INSTANCING / AUDIO-DRAWN',
  audioIn: true,
  fx: { bloom: 0.30 },
  tags: ['AUDIO IN', 'BAND = GENERATION', 'THE WEAVE', 'COLOUR IS THE BRANCH', 'EVERYTHING SPINS'],
  desc: 'The weave. V1\'s water bears stood politely off each other and read as a diagram; here they OVERLAP — every child sits inside its mother\'s own silhouette, so the frame is a tangle of animals piling through each other five levels deep. Every one of them SPINS, generations turning in alternating directions at rates that climb with depth, so the mother rolls over slowly while the fringe whirls, and the whole churn speeds up with the music. And nothing is alone: every mother-child link is drawn as a luminous strand, bowed so the web looks woven rather than spoked and tapered to nothing at both bodies, which is where the KICK now lives — the pulse lights the strands generation by generation on its way out, so you watch the beat travel along the threads before it reaches the animals it is about to swell. COLOUR IS WHICH BRANCH YOU ARE ON: every child takes its mother\'s hue and fans off it by its place in her ring, the fan narrowing each generation, so each limb of the recursion is its own colour family and a dozen hues share the frame — all of them structural, none of them a gradient laid over the screen. The music mixes the wheel: the spectral balance ROTATES it, so bass-heavy and treble-heavy music live in different countries of the colour circle, and loudness sets its SATURATION, so a quiet passage is nearly one colour and a drop opens into the full spectrum. Everything V1 mapped survives: loudness is the DEPTH of the recursion on a high-water mark, bass the scale ratio, mid the twist, treble the branch count quantised and held so it steps on a section change and re-deals the whole tree. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app\'s own output. LEFT HAND / CC1 IS SPREAD: closed, every generation collapses into its mother and the whole tree is one churning knot of overlapping bodies; opened, the limbs fly out and the weave stretches into a lit web you can follow strand by strand. It answers instantly, with or without a signal, and it is what a stranger sees first. RIGHT HAND / CC2 IS SENSITIVITY: a gain on what the mic hears, deciding how far the recursion runs between a verse and a drop — a gain, never a value, so a hand the wall\'s ghost drift parked somewhere just leaves the scene near its base sensitivity instead of pretending the room is loud. Moving a hand FAST paints: the left breathes orange light around the fringe, the right violet around the core, onto the glowing rim each animal wears and never into its body, so the colour wheel underneath stays exactly as legible as it was. In silence the tangle keeps turning and the strands keep breathing, so an unattended scene is still alive.',
  sound: 'Makes no sound of its own — an audio-in scene, same as Cell Front, Penrose Bloom and Spectrum Halo. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants DYNAMICS and a real kick above all: depth tracks loudness, the spin rate tracks energy, and the kick is what sends the pulse running out along the strands. Treble decides the branch count, so a hi-hat section visibly re-deals the whole tree into a new number of limbs and a new set of colours. No MIDI out — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const cap = as > 3.2 ? 400 : as > 1.7 ? 220 : 90;
    P.state = {
      cap, count: 1, life: 0, noGL: false, ready: false,
      nx: new Float32Array(cap), ny: new Float32Array(cap), nz: new Float32Array(cap),
      ns: new Float32Array(cap), na: new Float32Array(cap), nh: new Float32Array(cap),
      ng: new Uint8Array(cap), np: new Float32Array(cap), npar: new Int32Array(cap),
      nsib: new Int32Array(cap),
      sx: new Float32Array(cap), sy: new Float32Array(cap), spx: new Float32Array(cap),
      nr: new Float32Array(cap), ngc: new Float32Array(cap), nbc: new Float32Array(cap),
      wr: new Float32Array(cap), wg: new Float32Array(cap), wb: new Float32Array(cap),
      seed: new Float32Array(cap), spin: new Float32Array(cap),
      kg: new Float32Array(T2_MAXGEN + 1),
      pres: 0, rest: 1, spread: 0.5, sens: 1.0, velL: 0, velR: 0, pL: 0.5, pR: 0.5,
      level: 0, bass: 0, mid: 0, treble: 0, energy: 0, tilt: 0.5,
      depth: 0.4, hw: 0.4, ratio: 0.56, spf: 0.52, spfo: 1.3, twist: 0, rot: 0,
      hueRot: P.rand(), hue0: 0, spinPh: 0,
      branch: 4, brRaw: 4, brHold: 0,
      kEnv: 0, kAge: 9, kHit: 0, _kN: -1, _kGap: 1, _prevOnset: 0, LEAD: 0.030,
      _c: [0, 0, 0]
    };
    for (let i = 0; i < cap; i++) {
      P.state.seed[i] = P.rand() * TAU;
      P.state.spin[i] = (P.rand() < 0.5 ? -1 : 1) * (0.6 + P.rand() * 0.9);
    }
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: !window.IS_MOBILE });
    r.setSize(P.w, P.h, false);
    // LINEAR, not ACES: the filmic curve pulls saturated colour toward white,
    // and this scene is nothing BUT saturated colour.
    r.toneMapping = THREE.LinearToneMapping;
    r.toneMappingExposure = 0.95;
    if (THREE.sRGBEncoding !== undefined) r.outputEncoding = THREE.sRGBEncoding;
    T3.renderer = r;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x000000);
    T3.scene = sc;
    const cam = new THREE.PerspectiveCamera(40, P.w / P.h, 0.1, 60);
    T3.half = 2.05;
    T3.camD = T3.half / Math.tan(20 * Math.PI / 180);
    cam.position.set(0, 0, T3.camD);
    cam.lookAt(0, 0, 0);
    T3.cam = cam;
    // neutral light, small budget — every hue in the frame is an instance
    // colour, and the total must not clip or the wheel goes white.
    const key = new THREE.PointLight(0xffffff, 0.92, 0, 1.2);
    key.position.set(0.55, 0.9, T3.camD * 0.92); sc.add(key); T3.key = key;
    sc.add(new THREE.HemisphereLight(0x8899cc, 0x0a0812, 0.20));
    const rim = new THREE.DirectionalLight(0xbfd6ff, 0.26);
    rim.position.set(-0.7, -0.5, -1); sc.add(rim);
    T3.tmpM = new THREE.Matrix4();
    T3.tmpP = new THREE.Vector3();
    T3.tmpV = new THREE.Vector3();
    T3.tmpQ = new THREE.Quaternion();
    T3.tmpE = new THREE.Euler();
    T3.tmpS = new THREE.Vector3();
    if (typeof THREE.GLTFLoader !== 'function') return;
    new THREE.GLTFLoader().load('models/waterbear.glb', gl2 => { try {
      let src = null, best = 0;
      gl2.scene.updateMatrixWorld(true);
      gl2.scene.traverse(o => {
        if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
        const c = o.geometry.attributes.position.count;
        if (c > best) { best = c; src = o; }
      });
      if (!src) return;
      const hi = src.geometry.clone();
      hi.applyMatrix4(src.matrixWorld);
      hi.rotateX(-Math.PI / 2);          // dorsal view — the silhouette people know
      hi.computeBoundingBox();
      const bb = hi.boundingBox, ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      const f = 1 / Math.max(sz.x, sz.y, sz.z, 1e-4);
      hi.translate(-ctr.x, -ctr.y, -ctr.z);
      hi.scale(f, f, f);
      hi.computeVertexNormals();
      const lo = t2Decimate(hi.clone(), T2_LOCELL);
      const body = (geo, n, flat) => {
        const m = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: !!flat });
        const im = new THREE.InstancedMesh(geo, m, n);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.frustumCulled = false;
        sc.add(im);
        return im;
      };
      const shell = (geo, n) => {
        const m = new THREE.MeshBasicMaterial({
          color: 0xffffff, side: THREE.BackSide, transparent: true,
          opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false
        });
        m.toneMapped = false;
        const im = new THREE.InstancedMesh(geo, m, n);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.frustumCulled = false;
        sc.add(im);
        return im;
      };
      T3.hi = body(hi, T2_HICAP, false);
      T3.lo = body(lo, P.state.cap, true);
      T3.hiH = shell(hi, T2_HICAP);
      T3.loH = shell(lo, P.state.cap);
      [T3.hi, T3.lo, T3.hiH, T3.loH].forEach(im => {
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.count * 3).fill(1), 3);
        im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      });
      P.state.ready = true;
    } catch (e) { console.error('SRC-51.2 load', e); } });
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;
    if (s.noGL) return;

    /* ---- HANDS: an arrangement and a gain, never a signal value --------- */
    const cc1 = clamp(inp.L), cc2 = clamp(inp.R);
    const handLive = chan.L.mode === 'live' || chan.R.mode === 'live';
    const sprT = handLive ? cc1 : 0.55;
    const sensT = handLive ? 0.55 + cc2 * 1.15 : 1.0;
    s.spread += (sprT - s.spread) * Math.min(1, dt * 5);
    s.sens += (sensT - s.sens) * Math.min(1, dt * 4);
    const vL = clamp(Math.abs(cc1 - s.pL) / Math.max(dt, 1e-3) * 0.85);
    const vR = clamp(Math.abs(cc2 - s.pR) / Math.max(dt, 1e-3) * 0.85);
    s.pL = cc1; s.pR = cc2;
    s.velL -= s.velL * Math.min(1, dt * 0.42); if (vL > s.velL) s.velL = vL;
    s.velR -= s.velR * Math.min(1, dt * 0.42); if (vR > s.velR) s.velR = vR;

    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((handLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);
    s.rest += (((handLive || audioLive) ? 0 : 1) - s.rest) * Math.min(1, dt * 0.8);

    /* ---- THE BANDS (slow clock) ----------------------------------------- */
    const idle = (0.055 + 0.035 * Math.sin(s.life * 0.23)) * (1 - 0.70 * s.pres);
    const lT = Math.max(idle, clamp(inp.audio.level * s.sens));
    const bT = Math.max(idle, clamp(inp.audio.bass * s.sens));
    const mT = Math.max(idle * 0.7, clamp(inp.audio.mid * s.sens));
    const tT = Math.max(idle * 0.6, clamp(inp.audio.treble * s.sens));
    s.level += (lT - s.level) * Math.min(1, dt * (lT > s.level ? 2.2 : 1.4));
    s.bass += (bT - s.bass) * Math.min(1, dt * (bT > s.bass ? 2.2 : 1.4));
    s.mid += (mT - s.mid) * Math.min(1, dt * (mT > s.mid ? 2.2 : 1.4));
    s.treble += (tT - s.treble) * Math.min(1, dt * (tT > s.treble ? 2.2 : 1.4));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    // spectral balance of the moment — it ROTATES the colour wheel
    const tiltT = clamp((s.treble * 1.25 + s.mid * 0.45) / (s.treble * 1.25 + s.mid * 0.45 + s.bass + 0.02));
    s.tilt += (tiltT - s.tilt) * Math.min(1, dt * 1.1);

    /* ---- LOUDNESS IS DEPTH ---------------------------------------------- */
    const depthT = clamp(0.10 + 1.15 * Math.pow(s.level, 1.2) + 0.25 * s.energy) * T2_MAXGEN
                 + 0.95 * s.rest;
    s.hw = Math.max(s.hw - dt * 1.1, depthT);
    s.depth += (s.hw - s.depth) * Math.min(1, dt * 6);

    /* ---- OVERLAP: the ring sits INSIDE the mother ------------------------ */
    const ratioT = 0.42 + 0.15 * clamp(s.bass * 1.15);
    s.ratio += (ratioT - s.ratio) * Math.min(1, dt * 1.6);
    const spfT = 0.42 + 0.22 * s.spread;                    // inside a limb
    s.spf += (spfT - s.spf) * Math.min(1, dt * 4);
    const spfoT = 1.05 + 0.75 * s.spread + 0.10 * s.rest;   // the limbs themselves
    s.spfo += (spfoT - s.spfo) * Math.min(1, dt * 4);
    s.twist += ((s.mid * 1.75 - 0.35) - s.twist) * Math.min(1, dt * 1.5);
    s.rot += (0.045 + 0.11 * s.energy + 0.05 * s.rest) * dt;
    if (s.rot > TAU) s.rot -= TAU;
    // THE SPIN — one accumulating phase; each generation multiplies it and
    // flips its sign, so the tree counter-rotates against itself.
    s.spinPh += (0.22 + 1.9 * s.energy + 1.3 * s.treble + 0.18 * s.rest) * dt;
    if (s.spinPh > 1e5) s.spinPh = 0;
    // the colour wheel: a slow intrinsic turn, offset by the spectral balance
    s.hueRot += (0.010 + 0.055 * s.energy) * dt;
    s.hue0 = s.hueRot + 0.42 * s.tilt;

    /* ---- TREBLE = BRANCH COUNT, quantised and HELD ------------------------ */
    s.brHold += dt;
    const want = 3 + clamp(s.treble * 1.25) * 3;
    if (s.brHold > 0.9 && Math.abs(want - s.branch) > 0.62) {
      s.branch = Math.max(3, Math.min(6, Math.round(want)));
      s.brHold = 0;
    }
    s.brRaw = want;

    /* ---- THE KICK — unsmoothed, back-dated, 55ms a generation ------------ */
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetEdge = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt; s.kAge += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetEdge) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    if (edge && s._kGap > 0.09) { s._kGap = 0; s.kAge = age + s.LEAD; s.kHit = hit; }
    for (let g = 0; g <= T2_MAXGEN; g++) {
      const a = s.kAge - g * 0.055;
      s.kg[g] = a < 0 ? 0 : s.kHit * Math.exp(-3.6 * a);
    }
    s.kEnv = s.kg[0];

    /* ---- BUILD, COLOUR, PLACE ------------------------------------------- */
    t2Tree(P);
    const T3 = P._three;
    if (!T3) return;
    T3.cam.position.set(Math.sin(s.life * 0.071) * 0.30, Math.sin(s.life * 0.053) * 0.20, T3.camD);
    T3.cam.lookAt(0, 0, 0);
    T3.cam.updateProjectionMatrix();
    T3.cam.updateMatrixWorld(true);
    if (!s.ready || !T3.lo) return;

    const M = T3.tmpM, PV = T3.tmpP, PJ = T3.tmpV, Q = T3.tmpQ, E = T3.tmpE, SV = T3.tmpS;
    const C = s._c;
    // SATURATION IS LOUDNESS: quiet is nearly one colour, a drop is the wheel
    // SATURATION IS LOUDNESS — but capped short of the point where two of
    // the three channels pin and the animal goes flat. The first cut ran the
    // wheel at full chroma into a light budget that clipped, and the mother
    // came back as a shadeless magenta cutout with no body on her at all.
    const sat = Math.min(0.86, clamp(0.34 + 0.50 * s.level + 0.12 * s.energy));
    const pxPerUnit = P.h / (2 * T3.half);
    let hiN = 0, loN = 0;
    for (let i = 0; i < s.count; i++) {
      const g = s.ng[i], sd = s.seed[i], u = g / T2_MAXGEN;
      const pop = 1 + 0.30 * s.kg[g];
      const breath = 1 + 0.035 * Math.sin(s.life * 1.7 + sd);
      const sc = s.ns[i] * s.np[i] * pop * breath;
      s.spx[i] = 0;
      if (sc < 0.004) continue;
      PV.set(s.nx[i], s.ny[i], s.nz[i]);
      // SPIN: rate climbs with depth, direction alternates generation to
      // generation, and each animal keeps its own seed offset and handedness.
      const dir = (g & 1) ? -1 : 1;
      const spin = s.spinPh * dir * (0.55 + 0.42 * g) * s.spin[i] + sd;
      E.set(0.34 * Math.sin(s.life * 0.7 + sd), 0.40 * Math.sin(s.life * 0.53 + sd * 1.7), spin, 'ZYX');
      Q.setFromEuler(E);
      SV.set(sc, sc, sc);
      M.compose(PV, Q, SV);

      // COLOUR: the hue this node inherited down its own limb of the tree.
      const dim = 1 - 0.30 * u;
      t2hsl(s.nh[i], sat, 0.58 - 0.08 * u, C);
      const lift = (0.55 + 0.26 * s.pres + 0.40 * s.kg[g]) * dim;
      const br = Math.pow(C[0] / 255, 2.2) * lift;
      const bg = Math.pow(C[1] / 255, 2.2) * lift;
      const bb = Math.pow(C[2] / 255, 2.2) * lift;
      s.nr[i] = C[0]; s.ngc[i] = C[1]; s.nbc[i] = C[2];
      // the STRAND's colour is the animal it leads to, at the top of its own
      // hue's brightness. Averaging the two ends and drawing at body value
      // gave dark maroon threads under neon bodies — the weave has to be the
      // brightest thing in the frame, because it is the light between them.
      t2hsl(s.nh[i], Math.min(1, sat * 1.05), 0.70, C);
      s.wr[i] = C[0] | 0; s.wg[i] = C[1] | 0; s.wb[i] = C[2] | 0;
      // the hands paint the RIM only — the body's hue is the structure's
      const mo = clamp(s.velL * (0.25 + 0.75 * u) * 1.2);
      const mv = clamp(s.velR * (0.25 + 0.75 * (1 - u)) * 1.2);
      let hR = C[0], hG = C[1], hB = C[2];
      hR += (T2_ORANGE[0] - hR) * mo * 0.85; hG += (T2_ORANGE[1] - hG) * mo * 0.85; hB += (T2_ORANGE[2] - hB) * mo * 0.85;
      hR += (T2_VIOLET[0] - hR) * mv * 0.85; hG += (T2_VIOLET[1] - hG) * mv * 0.85; hB += (T2_VIOLET[2] - hB) * mv * 0.85;
      const hlift = (1.0 + 1.9 * s.kg[g] + 1.15 * Math.max(mo, mv)) * dim;

      const useHi = g <= 1 && hiN < T2_HICAP;
      const im = useHi ? T3.hi : T3.lo, imh = useHi ? T3.hiH : T3.loH;
      const slot = useHi ? hiN++ : loN++;
      if (!useHi && slot >= s.cap) break;
      im.setMatrixAt(slot, M);
      const shellK = 1.035 + 0.02 * s.kg[g];
      SV.set(sc * shellK, sc * shellK, sc * shellK);
      M.compose(PV, Q, SV);
      imh.setMatrixAt(slot, M);
      const a3 = slot * 3, ic = im.instanceColor.array, ich = imh.instanceColor.array;
      ic[a3] = br; ic[a3 + 1] = bg; ic[a3 + 2] = bb;
      ich[a3] = Math.pow(hR / 255, 2.2) * hlift;
      ich[a3 + 1] = Math.pow(hG / 255, 2.2) * hlift;
      ich[a3 + 2] = Math.pow(hB / 255, 2.2) * hlift;

      // where this animal lands on the stage — the weave is drawn in 2D
      PJ.copy(PV).project(T3.cam);
      s.sx[i] = (PJ.x * 0.5 + 0.5) * P.w;
      s.sy[i] = (-PJ.y * 0.5 + 0.5) * P.h;
      s.spx[i] = sc * pxPerUnit;
    }
    T3.hi.count = hiN; T3.hiH.count = hiN;
    T3.lo.count = loN; T3.loH.count = loN;
    [T3.hi, T3.lo, T3.hiH, T3.loH].forEach(im => {
      im.instanceMatrix.needsUpdate = true;
      im.instanceColor.needsUpdate = true;
    });
    const paint = Math.max(s.velL, s.velR);
    T3.hiH.material.opacity = 0.07 + 0.11 * s.pres + 0.20 * s.kEnv + 0.20 * paint;
    T3.loH.material.opacity = 0.04 + 0.07 * s.pres + 0.13 * s.kEnv + 0.14 * paint;
    s.drawn = hiN + loN;
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    if (s.noGL || !P._three) {
      g.fillStyle = 'rgba(150,180,220,0.7)';
      g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('TARDIGRADE RECURSION V2', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    T3.renderer.render(T3.scene, T3.cam);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);

    /* ---- THE WEAVE ------------------------------------------------------
       Every mother-child link, bowed perpendicular so the web reads woven
       rather than spoked, and TAPERED at both ends by one gradient per strand
       — never a fan of strokes faking a glow — so the thread is light in the
       gap between two animals instead of a line ruled across their faces. */
    if (s.ready && s.count > 1) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      const bright = 0.55 + 0.45 * s.pres;
      // one strand: bowed hard off the straight line so the web reads WOVEN
      // rather than spoked, and tapered to nothing at both ends by ONE
      // gradient — never a fan of strokes faking a glow — so the thread is
      // light in the gap between two animals, not a line ruled across a face.
      const strand = (x0, y0, x1, y1, bx, by, lw, a, cr, cg, cb) => {
        const grd = g.createLinearGradient(x0, y0, x1, y1);
        const col = 'rgba(' + cr + ',' + cg + ',' + cb + ',';
        const A = a.toFixed(3);
        grd.addColorStop(0, col + '0)');
        grd.addColorStop(0.30, col + A + ')');
        grd.addColorStop(0.70, col + A + ')');
        grd.addColorStop(1, col + '0)');
        g.strokeStyle = grd;
        g.lineWidth = lw;
        g.beginPath();
        g.moveTo(x0, y0);
        g.quadraticCurveTo(bx, by, x1, y1);
        g.stroke();
      };
      for (let i = 1; i < s.count; i++) {
        const p = s.npar[i];
        if (p < 0 || s.spx[i] <= 0 || s.spx[p] <= 0) continue;
        const gg = s.ng[i];
        const x0 = s.sx[p], y0 = s.sy[p], x1 = s.sx[i], y1 = s.sy[i];
        const dx = x1 - x0, dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        if (len < 4) continue;
        const fade = 1 - 0.40 * (gg / T2_MAXGEN);
        // THE PULSE LIVES HERE: the kick lights each generation's strands on
        // its way out, so the beat is visible travelling along the threads
        // before it reaches the animals it is about to swell.
        const kk = s.kg[gg];
        const cr = s.wr[i], cg = s.wg[i], cb = s.wb[i];
        // A THREAD, not a fog bank. The first cut sized width off the
        // animal's own screen radius and gen-1 strands came out 30px of soft
        // wash that read as haze; a strand has to stay a LINE (fat enough for
        // scrim, capped well under the bodies it ties together).
        const lw = Math.min(12 * ms, Math.max(2.2 * ms, 2.4 * ms + s.spx[i] * 0.045)) * (1 + 0.7 * kk);
        const a = (0.30 + 0.34 * s.np[i] + 0.60 * kk) * bright * fade;
        if (a > 0.012) {
          const bow = (0.30 + 0.14 * Math.sin(s.life * 0.6 + s.seed[i])) * len * ((i & 1) ? 1 : -1);
          strand(x0, y0, x1, y1,
            (x0 + x1) * 0.5 - dy / len * bow, (y0 + y1) * 0.5 + dx / len * bow,
            lw, a, cr, cg, cb);
        }
        // AND THE RING CLOSES. Parent-to-child alone is a star; tying each
        // mother's children to each other turns the frame into loops, which is
        // what actually reads as weaving. Bowed AWAY from the mother so the
        // loop bulges instead of cutting through her.
        const sb = s.nsib[i];
        if (gg <= 3 && sb > 0 && sb < s.count && s.spx[sb] > 0) {
          const x2 = s.sx[sb], y2 = s.sy[sb];
          const ex = x2 - x1, ey = y2 - y1;
          const el = Math.hypot(ex, ey);
          if (el > 4) {
            let mx = (x1 + x2) * 0.5 - x0, my = (y1 + y2) * 0.5 - y0;
            const ml = Math.hypot(mx, my) || 1;
            mx /= ml; my /= ml;
            const ao = (0.20 + 0.26 * s.np[i] + 0.50 * kk) * bright * fade;
            if (ao > 0.012) {
              // undulate the loop: a fixed bow made every ring a perfect
              // circle, which reads as a diagram. Breathing it per node turns
              // the ring back into thread.
              const ob = el * (0.30 + 0.16 * Math.sin(s.life * 0.5 + s.seed[i] * 2.3));
              strand(x1, y1, x2, y2,
                (x1 + x2) * 0.5 + mx * ob, (y1 + y2) * 0.5 + my * ob,
                Math.max(1.2, lw * 0.72), ao, cr, cg, cb);
            }
          }
        }
      }
      g.restore();
    }

    g.fillStyle = 'rgba(220,226,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '  MID ' + Math.round(s.mid * 100) +
      '  TREBLE ' + Math.round(s.treble * 100) + '  LEVEL ' + Math.round(s.level * 100) +
      '  DEPTH ' + s.depth.toFixed(2) + '/' + T2_MAXGEN +
      '  BRANCH ' + s.branch + '  RATIO ' + s.ratio.toFixed(2) +
      '  LIMB ' + s.spfo.toFixed(2) + '  HUG ' + s.spf.toFixed(2) +
      '  SPIN ' + (0.22 + 1.9 * s.energy + 1.3 * s.treble).toFixed(2) +
      '  HUE ' + (s.hue0 - Math.floor(s.hue0)).toFixed(2) + '  TILT ' + Math.round(s.tilt * 100) +
      '  KICK ' + Math.round(s.kEnv * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ')' +
      '  SENS ' + s.sens.toFixed(2) + '  PAINT ' + Math.round(s.velL * 100) + '/' + Math.round(s.velR * 100) +
      '  NODES ' + (s.drawn || 0) + '/' + s.cap +
      (s.pres < 0.3 ? '   · THE WEAVE IS TURNING' : ''), 10, h - 10);
  }
});
