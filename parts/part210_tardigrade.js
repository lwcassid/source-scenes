/* ---------- SRC-51 · TARDIGRADE RECURSION (the spectrum is the shape of the recursion) ----------
   The ask (Nima): the tardigrade model, made into an audio-reactive fractal.

   THE JOB NOBODY ELSE HAS. Three scenes in the set already listen. Cell Front
   owns "three pockets, one per band". Penrose Bloom owns "loudness is SIZE,
   spectrum is COLOUR". Spectrum Halo owns "band = harmonic ORDER of one curve,
   stamped into a long exposure". So this one takes the axis none of them use:

        BAND = GENERATION.

   The picture is one water bear that buds copies of itself, each copy budding
   its own, five levels down — a real IFS, self-similar at every scale — and
   every knob of that recursion belongs to a different part of the spectrum:

   · LEVEL  → DEPTH. How many generations exist at all. A high-water mark
     (instant up, a slow ~1.1/s melt) holds the boundary so a wobble can't
     strobe a whole ring in and out; the display then eases onto it at 6/s so
     generations BUD rather than pop. Quiet is one animal with a few buds; a
     drop crystallises the whole nimbus out to the frame edge.
   · BASS   → the SCALE RATIO. Bass-heavy and the children are fat and crowd
     their mother; bass gone and they fall away small and fine. This is the
     fractal's mass distribution — the same lattice, redistributed.
   · MID    → the TWIST. Every generation's ring is rotated by an angle mid
     owns, so the figure runs from a clean mirror-symmetric mandala to a
     shearing spiral without a single element changing size.
   · TREBLE → the BRANCH COUNT, 3..6, quantised and HELD (hysteresis + a 0.9s
     floor) so it STEPS on a section change instead of shimmering every frame.
     A re-deal rebuilds the whole tree at once — the scene's structural event.
   · KICK   → a WAVE THAT TRAVELS OUTWARD. Read off inp.audio.kick (the
     time-domain LP150 scanner, not the frame-polled onset), applied unsmoothed
     and back-dated by the hit's real age plus a display lead, then delayed a
     further 55ms per generation — so four-on-the-floor is visibly a pulse
     leaving the mother and running out through the fringe. It is the only
     fast move in the picture; everything else is eased at 1.4-2.2/s.

   COLOUR COMES FROM THE FORM, and the form's own field here is GENERATION:
   amber at the mother, teal through the middle, indigo at the fringe. So the
   palette IS the depth read — you can see how deep the music has pushed the
   recursion from across the room, with no gradient laid over the screen.

   THE HANDS NEVER COMPETE WITH THE MIC (Cell Front V5's law):
   · LEFT / CC1 = SPREAD — how far each child sits from its mother, from a
     tight clenched knot to an open lattice. Continuous, immediate, works in
     dead silence, and it is the stranger's one-second read.
   · RIGHT / CC2 = SENSITIVITY — a gain on the bands, never a value, so a hand
     the wall's ghost drift parked somewhere just leaves the scene near its
     base sensitivity instead of lying about the room.
   Speed paints (Cell Front V12's law): how fast the LEFT hand moves breathes
   ORANGE into the fringe, how fast the RIGHT moves breathes VIOLET into the
   core — onto the RIM, never the body. The 60%-cap lerp Spectrum Halo uses
   works there because its plate is white; here the body's colour IS the depth
   read, and lerping violet into an amber mother just makes her pink.
   Generation is the form's field, so the accent rides the structure and is
   never a wash across the frame.

   Makes no sound of its own. ------ */

const TR_MAXGEN = 5;                 // generations 0..5
const TR_HICAP  = 8;                 // gen 0 + gen 1 render at full resolution
const TR_LOCELL = 22;                // vertex-cluster grid for the fringe LOD
// COLOUR BY GENERATION — the form's own field, one saturated stop per level.
// A three-stop ramp was tried first and the intermediate generations landed on
// cream and sage: interpolated hues wash out, and washed-out is exactly what
// mesh scrim eats. An explicit table gives every generation its own colour.
const TR_GEN = [
  [255, 138,  40],   // 0 · the mother — orange amber
  [255, 205,  84],   // 1 · gold
  [ 92, 238, 186],   // 2 · green cyan
  [ 58, 188, 255],   // 3 · cyan blue
  [124, 118, 255],   // 4 · indigo
  [178,  96, 255]    // 5 · violet — the fringe
];
const TR_ORANGE = [255, 162,  74];   // LEFT hand's speed
const TR_VIOLET = [186, 140, 255];   // RIGHT hand's speed

// vertex clustering, run ONCE at load: the fringe never renders bigger than a
// thumb-width, so it has no business carrying 13k vertices four hundred times.
function trDecimate(geo, cells) {
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
    if (m < 24) return geo;                       // clustering ate the animal
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

// the IFS itself. Every subtree is a rotated, scaled copy of the whole, so the
// tree is genuinely self-similar rather than a mandala of rings.
function trTree(P) {
  const s = P.state;
  const B = s.branch, ratio = s.ratio, SPF = s.spf;
  s.nx[0] = 0; s.ny[0] = 0; s.nz[0] = 0; s.ns[0] = 1;
  s.na[0] = Math.PI * 0.5 + s.rot; s.ng[0] = 0; s.np[0] = 1;
  let start = 0, curN = 1, total = 1, curScale = 1;
  for (let g = 0; g < TR_MAXGEN; g++) {
    const pres = clamp(s.depth - g);          // how present generation g+1 is
    if (pres <= 0.02) break;
    const childScale = curScale * ratio;
    if (childScale < 0.011) break;            // smaller than a spark on the scrim
    const add = curN * B;
    // a generation arrives WHOLE or not at all — a truncated ring reads as a
    // bug, not as a fractal.
    if (total + add > s.cap) break;
    const twist = s.twist + g * 0.37;
    const off = (g & 1) ? 0.5 : 0;            // alternate rings interleave
    let w = total;
    for (let i = start; i < start + curN; i++) {
      const px = s.nx[i], py = s.ny[i], pz = s.nz[i], ps = s.ns[i], pa = s.na[i];
      const d = ps * SPF;
      for (let k = 0; k < B; k++) {
        const ang = pa + twist + (k + off) * TAU / B;
        s.nx[w] = px + Math.cos(ang) * d;
        s.ny[w] = py + Math.sin(ang) * d;
        s.nz[w] = pz - ps * 0.17;             // each generation sits a little behind
        s.ns[w] = childScale;
        s.na[w] = ang;                        // the child faces out of its mother
        s.ng[w] = g + 1;
        s.np[w] = pres;
        w++;
      }
    }
    start = total; total = w; curN = add; curScale = childScale;
  }
  s.count = total;
}

reg({
  id: 'SRC-51', family: 'SRC-51', ver: 1,
  title: 'Tardigrade Recursion', tech: 'WEBGL / IFS INSTANCING / AUDIO-DRAWN',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'BAND = GENERATION', 'CC1 = SPREAD', 'CC2 = SENSITIVITY', 'THE KICK TRAVELS OUT'],
  desc: 'One water bear that buds copies of itself, and every copy buds its own, five levels down — a real self-similar fractal made out of an animal, and the music is what decides its shape. LOUDNESS IS DEPTH: a quiet passage is a single creature carrying a few small buds, and a drop crystallises the whole nimbus generation by generation out to the edges of the frame, held there by a high-water mark so a wobble in the signal can never strobe a ring in and out. The rest of the spectrum owns the rest of the recursion — BASS sets how fat the children are and how close they crowd their mother, so bass-heavy music is a dense knot of bodies and a thin mix falls away into fine sparks; MID sets the TWIST of every generation\'s ring, running the figure from a mirror-symmetric mandala to a shearing spiral without changing a single size; TREBLE sets how many children each animal has, three to six, quantised and held so it steps on a section change and re-deals the entire tree at once. COLOUR IS DEPTH: amber at the mother, teal through the middle generations, indigo out at the fringe, so from across the room you can read how far the music has pushed the recursion. The kick is the only fast thing in the picture and it TRAVELS: each hit leaves the mother unsmoothed and runs outward through the generations at fifty-five milliseconds a level, so four-on-the-floor is a pulse visibly escaping through the fringe. Makes no sound of its own.',
  interact: 'THIS SCENE LISTENS (SHOW CHECK → AUDIO IN, or MAP → Audio in) — a mic, a line-in, or CAPTURE APP AUDIO for a running app’s own output. The music grows the fractal; the hands decide how it is arranged and how hard it is listening. LEFT HAND / CC1 IS SPREAD: closed, every generation clenches into its mother and the whole thing reads as one dense many-legged mass; opened, the children fly out and the tree becomes an open lattice you can count. It answers instantly, with or without a signal, which is what a stranger sees first. RIGHT HAND / CC2 IS SENSITIVITY: a gain on what the mic hears — it decides how far the recursion runs between a verse and a drop, from a placid two-generation creature to a fractal that fills the frame. A gain, never a value, so a hand the wall’s ghost drift parked somewhere just leaves the scene near its base sensitivity instead of pretending the room is loud. Moving a hand FAST paints: the left breathes orange light around the fringe, the right violet light around the core — onto the glowing rim each animal wears, never into its body, so the depth palette underneath stays exactly as legible as it was. In silence the animal keeps a slow breath and a few buds, so the scene is never dead.',
  sound: 'Makes no sound of its own — an audio-in scene, same as Cell Front, Penrose Bloom and Spectrum Halo. Connect a source in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants DYNAMICS and a real kick above all: the depth tracks loudness, so a track that never drops never shows the fractal’s range, and the kick is what makes the pulse run outward through the generations. Treble decides the branch count, so a hi-hat section visibly re-deals the whole tree. No MIDI out — there are no events to mirror.',

  init(P) {
    const as = areaScale(P);
    const cap = as > 3.2 ? 400 : as > 1.7 ? 220 : 90;
    P.state = {
      cap, count: 1, life: 0, noGL: false, ready: false,
      nx: new Float32Array(cap), ny: new Float32Array(cap), nz: new Float32Array(cap),
      ns: new Float32Array(cap), na: new Float32Array(cap),
      ng: new Uint8Array(cap), np: new Float32Array(cap),
      seed: new Float32Array(cap),
      kg: new Float32Array(TR_MAXGEN + 1),
      pres: 0, rest: 1, spread: 0.5, sens: 1.0, velL: 0, velR: 0, pL: 0.5, pR: 0.5,
      level: 0, bass: 0, mid: 0, treble: 0, energy: 0,
      depth: 0.4, hw: 0.4, ratio: 0.44, spf: 0.95, twist: 0, rot: 0,
      branch: 4, brRaw: 4, brHold: 0,
      kEnv: 0, kAge: 9, kHit: 0, _kN: -1, _kGap: 1, _prevOnset: 0, LEAD: 0.030
    };
    for (let i = 0; i < cap; i++) P.state.seed[i] = P.rand() * TAU;
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: !window.IS_MOBILE });
    r.setSize(P.w, P.h, false);
    // LINEAR, not ACES. The filmic curve's input matrix pulls saturated
    // colours toward white — the amber mother came back SALMON and the gold
    // generation came back cream, which threw away the whole depth palette.
    // The picture is authored light on black, so it wants a straight response.
    r.toneMapping = THREE.LinearToneMapping;
    r.toneMappingExposure = 0.95;
    if (THREE.sRGBEncoding !== undefined) r.outputEncoding = THREE.sRGBEncoding;
    T3.renderer = r;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x000000);   // true black — the scrim eats it whole
    T3.scene = sc;
    // fixed frame: the fractal grows INTO the frame, so the camera must not
    // pull back to meet it. Vertical fit off the SHORT side, aspect-agnostic.
    const cam = new THREE.PerspectiveCamera(40, P.w / P.h, 0.1, 60);
    T3.camD = 1.78 / Math.tan(20 * Math.PI / 180);
    cam.position.set(0, 0, T3.camD);
    cam.lookAt(0, 0, 0);
    T3.cam = cam;
    // lighting stays NEUTRAL: every hue in the frame comes from the instance
    // colours, which are keyed to generation. A coloured light would be a hue
    // keyed to screen position, which is the thing we are not allowed to do.
    // TOTAL light is the budget, and it is small: three sources summing to
    // ~1.2 at the brightest facing surface. The first cut of this scene ran at
    // 2.6 and every animal clipped to flat white, which threw away both the
    // segmented body and the entire generation palette.
    const key = new THREE.PointLight(0xffffff, 0.92, 0, 1.2);
    key.position.set(0.55, 0.9, T3.camD * 0.92); sc.add(key); T3.key = key;
    sc.add(new THREE.HemisphereLight(0x8899cc, 0x0a0812, 0.20));
    const rim = new THREE.DirectionalLight(0xbfd6ff, 0.26);
    rim.position.set(-0.7, -0.5, -1); sc.add(rim);
    T3.tmpM = new THREE.Matrix4();
    T3.tmpP = new THREE.Vector3();
    T3.tmpQ = new THREE.Quaternion();
    T3.tmpE = new THREE.Euler();
    T3.tmpS = new THREE.Vector3();
    T3.tmpC = new THREE.Color();
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
      // DORSAL VIEW: the model lies along its own Z with Y up, so a -90 turn
      // about X lays the animal flat to the camera — the top-down water bear
      // silhouette everyone recognises, head toward +Y in local space.
      hi.rotateX(-Math.PI / 2);
      hi.computeBoundingBox();
      const bb = hi.boundingBox, ctr = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      const f = 1 / Math.max(sz.x, sz.y, sz.z, 1e-4);
      hi.translate(-ctr.x, -ctr.y, -ctr.z);
      hi.scale(f, f, f);                     // one animal = one world unit
      hi.computeVertexNormals();
      const lo = trDecimate(hi.clone(), TR_LOCELL);
      T3.hiVerts = hi.attributes.position.count;
      T3.loVerts = lo.attributes.position.count;
      const body = (geo, n, flat) => {
        const m = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: !!flat });
        const im = new THREE.InstancedMesh(geo, m, n);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        im.frustumCulled = false;
        sc.add(im);
        return im;
      };
      // the luminous rim: a back-faced additive shell. Light is a spend, so it
      // goes on the animals big enough to have an edge worth drawing.
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
      T3.hi = body(hi, TR_HICAP, false);
      T3.lo = body(lo, P.state.cap, true);
      T3.hiH = shell(hi, TR_HICAP);
      T3.loH = shell(lo, P.state.cap);
      [T3.hi, T3.lo, T3.hiH, T3.loH].forEach(im => {
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(im.count * 3).fill(1), 3);
        im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      });
      P.state.ready = true;
    } catch (e) { console.error('SRC-51 load', e); } });
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

    // SPEED is its own input: a held hand has zero velocity, so no stale
    // controller value can fake it. Snap up, fade over ~2.4s.
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

    /* ---- LOUDNESS IS DEPTH ---------------------------------------------- */
    // high-water mark: instant up, a slow melt, so the boundary between "this
    // generation exists" and "it doesn't" HOLDS instead of strobing on every
    // wobble. The display then eases onto the mark at 6/s so a generation buds
    // over ~160ms rather than popping into being between two frames.
    // + a REST term: with no mic connected the scene would otherwise be one
    // animal and a bud, and the spread hand would have nothing to fan out.
    // It rides on top, and it retires the moment anything is actually playing.
    const depthT = clamp(0.10 + 1.15 * Math.pow(s.level, 1.2) + 0.25 * s.energy) * TR_MAXGEN
                 + 0.95 * s.rest;
    s.hw = Math.max(s.hw - dt * 1.1, depthT);
    s.depth += (s.hw - s.depth) * Math.min(1, dt * 6);

    /* ---- BASS = MASS, MID = TWIST --------------------------------------- */
    // ratio is how big a child is next to its mother; spf is how far out it
    // sits. The hand owns the reach, the bass owns the bulk.
    const ratioT = 0.355 + 0.165 * clamp(s.bass * 1.15);
    s.ratio += (ratioT - s.ratio) * Math.min(1, dt * 1.6);
    const spfT = 0.74 + 0.52 * s.spread + 0.08 * s.rest;
    s.spf += (spfT - s.spf) * Math.min(1, dt * 4);
    s.twist += ((s.mid * 1.75 - 0.35) - s.twist) * Math.min(1, dt * 1.5);
    s.rot += (0.045 + 0.11 * s.energy + 0.05 * s.rest) * dt;
    if (s.rot > TAU) s.rot -= TAU;

    /* ---- TREBLE = BRANCH COUNT, quantised and HELD ----------------------- */
    // a shimmering branch count would re-deal the tree every frame; this steps
    // on a section change and then sits still.
    s.brHold += dt;
    const want = 3 + clamp(s.treble * 1.25) * 3;
    if (s.brHold > 0.9 && Math.abs(want - s.branch) > 0.62) {
      s.branch = Math.max(3, Math.min(6, Math.round(want)));
      s.brHold = 0;
    }
    s.brRaw = want;

    /* ---- THE KICK (fast clock) — the only unsmoothed move ---------------- */
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
    if (edge && s._kGap > 0.09) {
      // back-date to the hit's TRUE age plus the display lead, so the wave is
      // where it belongs for the vsync this frame lands on.
      s._kGap = 0; s.kAge = age + s.LEAD; s.kHit = hit;
    }
    // the pulse leaves the mother and runs outward, 55ms a generation
    for (let g = 0; g <= TR_MAXGEN; g++) {
      const a = s.kAge - g * 0.055;
      s.kg[g] = a < 0 ? 0 : s.kHit * Math.exp(-3.6 * a);
    }
    s.kEnv = s.kg[0];

    /* ---- BUILD THE TREE, then push it at the instances ------------------- */
    trTree(P);
    const T3 = P._three;
    if (!s.ready || !T3 || !T3.lo) return;

    const cr = [], cg = [], cb = [], hr = [], hg = [], hb = [];
    for (let g = 0; g <= TR_MAXGEN; g++) {
      const u = g / TR_MAXGEN;
      const st = TR_GEN[Math.min(TR_GEN.length - 1, g)];
      let R = st[0], G = st[1], B = st[2];
      // instance colours are consumed as LINEAR, so the sRGB triples above go
      // through the 2.2 curve first — without it amber lands at (1,.69,.36),
      // which is a wash, not a colour.
      // Light is a spend: the mother carries it, the fringe only shimmers.
      const dim = 1 - 0.30 * u;
      const lift = (0.62 + 0.30 * s.pres + 0.45 * s.kg[g]) * dim;
      cr.push(Math.pow(R / 255, 2.2) * lift);
      cg.push(Math.pow(G / 255, 2.2) * lift);
      cb.push(Math.pow(B / 255, 2.2) * lift);
      // THE HANDS PAINT THE RIM, NOT THE BODY. Lerped into the body at the
      // 60% cap the way Spectrum Halo does it, a fast right hand turned the
      // amber mother PINK — Halo could get away with it because its plate is
      // white and has no hue to ruin. Here the body's colour IS the depth
      // read, so the paint moves to the additive shell: the animal keeps its
      // generation's colour and wears a ring of the hand's light around it.
      const mo = clamp(s.velL * (0.25 + 0.75 * u) * 1.2);        // orange to the fringe
      const mv = clamp(s.velR * (0.25 + 0.75 * (1 - u)) * 1.2);  // violet to the core
      let hR = R, hG = G, hB = B;
      hR += (TR_ORANGE[0] - hR) * mo * 0.85; hG += (TR_ORANGE[1] - hG) * mo * 0.85; hB += (TR_ORANGE[2] - hB) * mo * 0.85;
      hR += (TR_VIOLET[0] - hR) * mv * 0.85; hG += (TR_VIOLET[1] - hG) * mv * 0.85; hB += (TR_VIOLET[2] - hB) * mv * 0.85;
      const hlift = (1.0 + 1.9 * s.kg[g] + 1.15 * Math.max(mo, mv)) * dim;
      hr.push(Math.pow(hR / 255, 2.2) * hlift);
      hg.push(Math.pow(hG / 255, 2.2) * hlift);
      hb.push(Math.pow(hB / 255, 2.2) * hlift);
    }

    const M = T3.tmpM, PV = T3.tmpP, Q = T3.tmpQ, E = T3.tmpE, SV = T3.tmpS;
    let hiN = 0, loN = 0;
    for (let i = 0; i < s.count; i++) {
      const g = s.ng[i], sd = s.seed[i];
      const pop = 1 + 0.30 * s.kg[g];
      const breath = 1 + 0.035 * Math.sin(s.life * 1.7 + sd);
      const sc = s.ns[i] * s.np[i] * pop * breath;
      if (sc < 0.004) continue;
      PV.set(s.nx[i], s.ny[i], s.nz[i]);
      // the animal's head points along +Y in local space, so aim it by a - 90deg
      E.set(0.14 * Math.sin(s.life * 0.7 + sd), 0.18 * Math.sin(s.life * 0.53 + sd * 1.7),
            s.na[i] - Math.PI * 0.5 + 0.10 * Math.sin(s.life * 0.9 + sd), 'ZYX');
      Q.setFromEuler(E);
      SV.set(sc, sc, sc);
      M.compose(PV, Q, SV);
      const hi = g <= 1 && hiN < TR_HICAP;
      const im = hi ? T3.hi : T3.lo, imh = hi ? T3.hiH : T3.loH;
      const slot = hi ? hiN++ : loN++;
      if (!hi && slot >= s.cap) break;
      im.setMatrixAt(slot, M);
      const shell = 1.035 + 0.02 * s.kg[g];
      SV.set(sc * shell, sc * shell, sc * shell);
      M.compose(PV, Q, SV);
      imh.setMatrixAt(slot, M);
      const a3 = slot * 3, ic = im.instanceColor.array, ich = imh.instanceColor.array;
      ic[a3] = cr[g]; ic[a3 + 1] = cg[g]; ic[a3 + 2] = cb[g];
      ich[a3] = hr[g]; ich[a3 + 1] = hg[g]; ich[a3 + 2] = hb[g];
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

    // a breath of camera drift so the fractal is a body in a room, not a decal
    T3.cam.position.set(Math.sin(s.life * 0.071) * 0.30, Math.sin(s.life * 0.053) * 0.20, T3.camD);
    T3.cam.lookAt(0, 0, 0);
    T3.cam.updateProjectionMatrix();
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
      g.fillText('TARDIGRADE RECURSION', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    T3.renderer.render(T3.scene, T3.cam);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    if (!s.ready) {
      // the animal is still coming down the wire — a breathing ring, not a void
      const R = Math.min(w, h) * (0.10 + 0.02 * Math.sin(s.life * 2));
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = 'rgba(255,176,92,0.45)';
      g.lineWidth = Math.max(3, 4 * ms);
      g.beginPath(); g.arc(w / 2, h / 2, R, 0, TAU); g.stroke();
      g.globalCompositeOperation = 'source-over';
    }
    g.fillStyle = 'rgba(220,226,255,0.82)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '  MID ' + Math.round(s.mid * 100) +
      '  TREBLE ' + Math.round(s.treble * 100) + '  LEVEL ' + Math.round(s.level * 100) +
      '  DEPTH ' + s.depth.toFixed(2) + '/' + TR_MAXGEN + ' (hw ' + s.hw.toFixed(2) + ')' +
      '  BRANCH ' + s.branch + ' (' + s.brRaw.toFixed(2) + ')' +
      '  RATIO ' + s.ratio.toFixed(2) + '  SPREAD ' + s.spf.toFixed(2) +
      '  TWIST ' + s.twist.toFixed(2) +
      '  KICK ' + Math.round(s.kEnv * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') +
      (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ')' +
      '  SENS ' + s.sens.toFixed(2) + '  PAINT ' + Math.round(s.velL * 100) + '/' + Math.round(s.velR * 100) +
      '  NODES ' + (s.drawn || 0) + '/' + s.cap +
      (s.pres < 0.3 ? '   · THE ANIMAL IS BREATHING' : ''), 10, h - 10);
  }
});
