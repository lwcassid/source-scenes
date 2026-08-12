/* ---------- SRC-18.16 · NIGHT CIRCUIT V16 (three-lane instrument road, creatures that move right, a tardigrade finale) ---------- */
reg({
  id: 'SRC-18.16', family: 'SRC-18', ver: 16,
  title: 'Night Circuit V16', tech: 'WEBGL / PROJECTION-READY',
  music: { bpm: 78, root: 45, mode: 'aeolian', prog: [0, 5, 3, 6], chordBars: 4 },
  fx: {},
  acts: ['CAVERN', 'DISTRICT', 'TUNNEL', 'SUNSET'],
  setAct(P, i) {
    const s = P.state;
    if (!s || s.noGL || i === s.act || i === s.pending) return;
    s.pending = i; s.actT = 0;
  },
  tags: ['THREE-LANE INSTRUMENT ROAD', 'ALWAYS FAST', 'TARDIGRADE FINALE', 'CREATURES THAT GLIDE'],
  desc: 'The driving round. The road is now an instrument you STEER across: three glowing rails — orange arps on the left, the drum-and-bass spine down the middle, violet stabs on the right — with note-glyphs streaming toward you that pop and sound as you ride over them, guitar-hero without a fail state. Speed no longer fights the music: you cruise fast the moment you show up, and leaning to play a side never slows you down. The cavern got its focus back — the spiked teeth went dark like the rock they hang from, the light now belongs to the mushrooms, the crystals (scattered and grown, not marched in a line) and bigger clusters of stalked jellyflowers. The manta stopped flying sideways and stopped dragging a frozen twin: it glides down the passage along your path now. The crab scuttles broadside like a crab. The tunnel is a clean geometric bore again — dimmer beams, colored section by section, curving, with drones running it. And the horizon earns a finale: a tardigrade the size of weather charges the road and mock-swallows the whole frame.',
  interact: 'STEER to play. Lean left and you slide onto the orange rail (arps + bells); center yourself for the drum-and-bass spine; lean right for the violet rail (stabs + pad). Note-glyphs light and sound as you pass them on whichever rail you are riding. Reaching toward the source still flares your beam and swells the whole mix (the crescendo) — but it is no longer the throttle: presence alone keeps you fast, so playing the road never punishes you.',
  sound: 'Its own engine — 78-ish BPM aeolian minor. The three rails foreground three voices: orange arps/bells (left), kick+808 spine (center), violet stabs/pad (right). Note-glyph crossings queue grid-quantized bells so the road you ride is the line you hear. Sub under everything, hats double-time only in the tunnel, mourner lead over cave and sunset. Same rig roles and channels.',
  init(P) {
    P.state = {
      speed: 6, steer: 0, lane: 0, pres: 0, bob: 0, asleep: true,
      act: 0, actT: 0, trans: 0, pending: null, curveA: 0, curvePh: 0, tunPh: 0,
      kickPulse: 0, arpFlash: 0, arpIdx: 0, lastEvP: 0, noteQ: [], railW: [0, 1, 0],
      chomp: 0, chompHit: 0, chompDone: false
    };
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setSize(P.w, P.h, false);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    if (THREE.sRGBEncoding !== undefined) r.outputEncoding = THREE.sRGBEncoding;
    T3.renderer = r;
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(0x020107);
    sc.fog = new THREE.FogExp2(0x050310, 0.012);
    T3.scene = sc;
    const cam = new THREE.PerspectiveCamera(58, P.w / P.h, 0.1, 600);
    cam.position.set(1.05, 3.3, 0);
    T3.cam = cam;
    // REAL glow — render through UnrealBloom when the post stack is present
    if (!window.IS_MOBILE && typeof THREE.EffectComposer === 'function' && typeof THREE.UnrealBloomPass === 'function') { // phones skip the post stack — fill rate is precious
      const comp = new THREE.EffectComposer(r);
      comp.setSize(P.w, P.h);
      comp.addPass(new THREE.RenderPass(sc, cam));
      const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(P.w, P.h), 0.75, 0.45, 0.68);
      comp.addPass(bloom);
      T3.comp = comp; T3.bloom = bloom;
    }
    // lights: dim ambience + TWO REAL HEADLIGHTS — the left hand owns the left
    // beam, the right hand the right. The world is dark until light lands on it.
    const hemi = new THREE.HemisphereLight(0x4a3a6a, 0x030208, 0.3); sc.add(hemi); T3.hemi = hemi;
    const mkBeam = (x, warm) => {
      const sp = new THREE.SpotLight(warm ? 0xffd9b0 : 0xd8cfff, 2.2, 90, 0.42, 0.55, 1.1);
      sp.position.set(x, 1.4, -9.5);
      sp.target.position.set(x * 3.2, 0.4, -55);
      sc.add(sp); sc.add(sp.target);
      return sp;
    };
    T3.headL = mkBeam(-0.42, true);   // warm beam — orange country
    T3.headR = mkBeam(0.42, false);   // cool violet beam — purple country
    // small fill so the machine itself never fully vanishes
    const head = new THREE.PointLight(0xcfeaff, 1.1, 30, 1.7);
    head.position.set(0, 1.6, -14); sc.add(head); T3.head = head;
    // V15 · THE SIDES ANSWER, everywhere: lean left and an orange wash rises
    // out of the left world; lean right and the violet country lights. Real
    // lights, so every act's geometry answers without per-act wiring.
    const sideLightL = new THREE.PointLight(0xff7a2c, 0, 30, 1.5);
    sideLightL.position.set(-7.5, 2.6, -14); sc.add(sideLightL); T3.sideLightL = sideLightL;
    const sideLightR = new THREE.PointLight(0xc45cff, 0, 30, 1.5);
    sideLightR.position.set(7.5, 2.6, -14); sc.add(sideLightR); T3.sideLightR = sideLightR;
    const world = new THREE.Group(); sc.add(world); T3.world = world;
    const B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
    const L2 = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
    // ---- V13 SHARED MATERIAL LANGUAGE ----
    // dark mass, luminous edge — but the edge is now SELECTIVE, not full wireframe.
    // hull(): inverted-hull rim shell for organic heroes (crab, manta, tower) —
    // a slightly inflated BackSide copy reads as a thin colored silhouette line.
    const hull = (obj, col, op, scl) => {
      const mats = [];
      obj.traverse(o => {
        if (!o.isMesh || o.userData.isHull) return;
        const m = new THREE.MeshBasicMaterial({ color: col, side: THREE.BackSide, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
        m.toneMapped = false;
        const sh = new THREE.Mesh(o.geometry, m);
        sh.userData.isHull = true;
        sh.scale.setScalar(scl || 1.03);
        o.add(sh); mats.push(m);
      });
      return mats;
    };
    // edges(): feature-line accents for architecture — only creases past the
    // threshold draw, so boxes read as drawn silhouettes, not exposed meshes.
    const edges = (mesh, col, op, thresh) => {
      const eg = new THREE.EdgesGeometry(mesh.geometry, thresh || 30);
      const m = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
      m.toneMapped = false;
      const ln = new THREE.LineSegments(eg, m);
      mesh.add(ln);
      return m;
    };
    T3.hull = hull; T3.edges = edges;
    // seeded rand
    let seed = 1234567; const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    // ---- shared road ----
    const roadStr = new THREE.Group(); world.add(roadStr); T3.roadStr = roadStr;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 340), L2(0x0a0c14));
    road.rotation.x = -Math.PI / 2; road.position.z = -150; roadStr.add(road);
    // the world has a FLOOR — a huge dark ground plane so nothing shows through
    // beneath the horizon (sun, towers) in the open acts
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), L2(0x05060d));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.06, -250); world.add(ground);
    T3.ground = ground;
    T3.edgeMats = [];
    T3.strEdges = [];
    const emL = B(0x2ec8da), emR = B(0x2ec8da);
    T3.edgeMats.push(emL, emR);
    for (const pair of [[-4.5, emL], [4.5, emR]]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 340), pair[1]); // V16: fatter for scrim
      edge.position.set(pair[0], 0.015, -150); roadStr.add(edge); T3.strEdges.push(edge);
    }
    // the WINDING road — a chain of segments that follows a traveling curve in
    // the open acts; the straight strip serves the enclosed ones
    const curveG = new THREE.Group(); world.add(curveG); T3.curveG = curveG; T3.segs = [];
    {
      const segQuad = new THREE.PlaneGeometry(9, 8.8);
      const segEdgeG = new THREE.BoxGeometry(0.28, 0.03, 8.8); // V16: fatter for scrim
      const roadMat = L2(0x0a0c14);
      // a city road has a CURB — raised concrete lips, toggled per act
      const curbG2 = new THREE.BoxGeometry(0.55, 0.18, 8.8);
      const curbMat = L2(0x2e343e, { flatShading: true });
      T3.curbs = [];
      for (let i = 0; i < 46; i++) {
        const sg = new THREE.Group();
        const q = new THREE.Mesh(segQuad, roadMat);
        q.rotation.x = -Math.PI / 2; q.position.y = 0.001; sg.add(q);
        const e1 = new THREE.Mesh(segEdgeG, emL); e1.position.set(-4.5, 0.015, 0); sg.add(e1);
        const e2 = new THREE.Mesh(segEdgeG, emR); e2.position.set(4.5, 0.015, 0); sg.add(e2);
        const cbL = new THREE.Mesh(curbG2, curbMat); cbL.position.set(-5.05, 0.09, 0); sg.add(cbL);
        const cbR = new THREE.Mesh(curbG2, curbMat); cbR.position.set(5.05, 0.09, 0); sg.add(cbR);
        T3.curbs.push(cbL, cbR);
        sg.position.set(0, 0, -i * 8 - 2);
        curveG.add(sg); T3.segs.push(sg);
      }
      curveG.visible = false;
    }
    T3.dashes = [];
    const dashG = new THREE.BoxGeometry(0.3, 0.02, 2.2), dashM = B(0x59e6b8); // V16: fatter/longer dashes survive the mesh
    dashM.toneMapped = false; emL.toneMapped = false; emR.toneMapped = false;
    T3.dashMat = dashM;
    for (let i = 0; i < 36; i++) {
      const d = new THREE.Mesh(dashG, dashM);
      d.position.set(0, 0.012, -i * 8 - 2);
      world.add(d); T3.dashes.push(d);
    }
    // ================= V16 · THE THREE-LANE INSTRUMENT ROAD =================
    // Three glowing rails you STEER across — orange arps (L), the drum-and-bass
    // spine (center), violet stabs (R). Note-glyphs stream toward you and pop as
    // you ride over them. Guitar hero, but the road is an instrument, not a test.
    T3.railX = [-3.0, 0, 3.0];
    T3.railBaseCol = [0xff7a2c, 0x49e6d0, 0xc45cff];
    T3.railMats = []; T3.railSegs = [[], [], []];
    const railSegG = new THREE.BoxGeometry(0.34, 0.02, 6.4); // fat + long so the rail reads as a continuous line on scrim
    for (let r = 0; r < 3; r++) {
      const rm = new THREE.MeshBasicMaterial({ color: T3.railBaseCol[r], transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false });
      rm.toneMapped = false; T3.railMats.push(rm);
      for (let i = 0; i < 26; i++) { // segmented so the rail can follow the road's bend
        const seg = new THREE.Mesh(railSegG, rm);
        seg.position.set(T3.railX[r], 0.02, -i * 7 - 2);
        world.add(seg); T3.railSegs[r].push(seg);
      }
    }
    // note-glyphs: bold upright diamonds standing on each rail, streaming in
    T3.notes = [];
    const noteG = new THREE.OctahedronGeometry(0.42, 0);
    const NOTE_PER = 10, NOTE_GAP = 7.2, NOTE_SPAN = NOTE_PER * NOTE_GAP;
    T3.noteSpan = NOTE_SPAN;
    for (let r = 0; r < 3; r++) {
      const patt = [[0, 3, 2, 4, 1, 5, 2, 3, 0, 4], [0, 0, -2, 0, 3, 0, 2, 0, -2, 0], [2, 4, 3, 5, 2, 1, 4, 3, 5, 2]][r];
      for (let i = 0; i < NOTE_PER; i++) {
        const nm = new THREE.MeshBasicMaterial({ color: T3.railBaseCol[r], transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
        nm.toneMapped = false;
        const gl = new THREE.Mesh(noteG, nm);
        gl.position.set(T3.railX[r], 0.62, -(i * NOTE_GAP) - (r * 2.4) - 4);
        gl.userData = { rail: r, deg: patt[i], m: nm, fired: false };
        world.add(gl); T3.notes.push(gl);
      }
    }
    const mkTex = (drawFn, s2 = 256) => { const c = document.createElement('canvas'); c.width = c.height = s2; drawFn(c.getContext('2d'), s2); return new THREE.CanvasTexture(c); };
    // V15: the fake headlight pool sprite is GONE — the beams are real lights
    // and the pool on the road is wherever they actually land. No more offset.
    // ---- ACT 0 · THE CAVERN ----
    const caveG = new THREE.Group(); world.add(caveG); T3.caveG = caveG;
    // soft radial glow sprite — reused for crystals, mushrooms, underglow
    const glowT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 6, 128, 128, 126); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }); // 256 canvas — center must match, else halos render as corner-lit squares
    const mkGlow = (col, sc2) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 })); sp.scale.set(sc2, sc2, 1); return sp; };
    T3.mkGlow = mkGlow;
    {
      // the cave surface RIDES WITH THE ROAD now — two leapfrogging low-poly
      // tube segments so the rock visibly streams past instead of sitting still
      const mkCaveTube = (zoff) => {
        const tube = new THREE.CylinderGeometry(9, 9, 240, 18, 30, true);
        const pos = tube.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
          const ang = Math.atan2(z, x);
          const n = Math.sin(ang * 3.1 + y * 0.11) * 0.5 + Math.sin(ang * 7.3 - y * 0.23) * 0.3 + Math.sin(y * 0.61 + ang) * 0.35;
          const band = 1 + 0.5 * Math.sin(y * 0.05 + 1.3); // the rock tightens and relaxes in sections
          const k = 1 + n * 0.26 * band;
          pos.setX(i, x * k); pos.setZ(i, z * k);
        }
        tube.computeVertexNormals();
        const grp = new THREE.Group();
        // faceted rock — flat shading sells the polygonal read
        const rock = new THREE.Mesh(tube, new THREE.MeshLambertMaterial({ color: 0x171030, emissive: 0x080418, side: THREE.BackSide, flatShading: true })); // the rock READS now — faceted violet mass, not void
        grp.add(rock);
        // glowing wireframe edges over the rock — the vibe layer
        const wire = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x7a55ff, wireframe: true, transparent: true, opacity: 0.1, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        grp.add(wire); grp.userData.wireMat = wire.material;
        grp.rotation.x = Math.PI / 2; grp.position.set(0, 3.2, zoff);
        caveG.add(grp); return grp;
      };
      T3.caveTubes = [mkCaveTube(-100), mkCaveTube(-340)];
      // crystal formations: tapered cones — thick at the root, narrowing to a
      // point — in the warm orange family, smaller and glowier
      T3.crystals = [];
      const cryG = new THREE.ConeGeometry(0.34, 1.6, 5);
      for (let i = 0; i < 16; i++) {
        const side = rnd() < 0.5 ? -1 : 1; // V16: sides mixed, not alternating in a zip
        // the street takes sides: ORANGE country left, PURPLE country right
        const col = side > 0 ? [0x9a5cff, 0xc45cff, 0x7a3fe8][i % 3] : [0xff7a2c, 0xff9440, 0xff4d1c][i % 3];
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
        m.toneMapped = false; // raw saturated orange — no ACES wash
        const g2 = new THREE.Group();
        // V16: every ~4th cluster is a HERO — big shards to match the references
        const hero = i % 4 === 0;
        const gscale = hero ? 2.1 + rnd() * 1.3 : 0.8 + rnd() * 0.6;
        const n2 = (hero ? 4 : 3) + (rnd() * 4 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(cryG, m);
          const sc2 = 0.35 + rnd() * 0.8;
          cr.scale.set(sc2, sc2 * (1.2 + rnd() * 1.4), sc2);
          cr.position.set((rnd() - 0.5) * 1.9, sc2 * 0.8, (rnd() - 0.5) * 1.7);
          cr.rotation.z = -side * (0.15 + rnd() * 0.4); // lean off the wall, over the road
          cr.rotation.y = rnd() * 6.28;
          g2.add(cr);
        }
        g2.scale.setScalar(gscale);
        const hcol = side > 0 ? 0x8a3fff : 0xff4d14;
        const halo = mkGlow(hcol, 1.1 + rnd() * 0.6); halo.position.y = 0.8; g2.add(halo);
        // wet-ground pool — a squashed echo of the glow at the crystal's feet
        const refl = mkGlow(hcol, 1.4); refl.scale.set(1.6, 0.45, 1);
        refl.material.opacity = 0.09; refl.position.y = 0.05; g2.add(refl);
        // V16: SCATTERED down the whole cave, both sides, mixed depths — not a line
        g2.position.set(side * (5.0 + rnd() * 3.0), 0, -(30 + rnd() * 600));
        caveG.add(g2);
        T3.crystals.push({ g: g2, m, halo, side, base: 0.85 });
      }
      // stalactites — V16: they are ROCK now, the same dark faceted violet as
      // the cave wall. No more clashing candy colors, no halos: they hang as
      // dark teeth and give the visual focus back to the living light.
      T3.stals = [];
      const stalG = new THREE.ConeGeometry(0.32, 2.2, 5);
      const stalMat = new THREE.MeshLambertMaterial({ color: 0x1a1236, emissive: 0x0a0620, flatShading: true }); // reads only when a headlight grazes it
      for (let i = 0; i < 18; i++) {
        const sxSide = i % 2 ? 1 : -1;
        const m = stalMat;
        const g2 = new THREE.Group();
        const n2 = 2 + (rnd() * 4 | 0); // a touch denser, more clustered
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(stalG, m);
          const sc2 = 0.24 + rnd() * 0.7; // more size variety — a few big teeth
          cr.scale.set(sc2, sc2 * (0.9 + rnd() * 1.3), sc2);
          cr.rotation.x = Math.PI; // point down
          cr.rotation.z = (rnd() - 0.5) * 0.25;
          cr.position.set((rnd() - 0.5) * 2.6, -sc2 * 1.1, (rnd() - 0.5) * 2.2);
          g2.add(cr);
        }
        const halo = mkGlow(0x2a1a4a, 0.01); halo.position.y = -0.8; halo.material.opacity = 0; g2.add(halo); // kept for the step loop, but dark
        const sx = sxSide * (1 + rnd() * 4.5);
        // teeth scattered along the ceiling, not marched — mixed depths
        g2.position.set(sx, 10.7 - Math.abs(sx) * 0.35, -(120 + rnd() * 520)); // up against the ceiling rock
        caveG.add(g2);
        T3.stals.push({ g: g2, m, halo });
      }
      // hero monoliths — big landmark crystal formations like the rendering's right wall
      T3.monos = [];
      for (let i = 0; i < 8; i++) {
        const col = [0xff7a2c, 0xff9440, 0xff2d6a][i % 3];
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 });
        m.toneMapped = false;
        const g2 = new THREE.Group();
        for (let c2 = 0; c2 < 4; c2++) {
          const cr = new THREE.Mesh(cryG, m);
          const sc2 = 1.6 + rnd() * 1.8;
          cr.scale.set(sc2 * 0.7, sc2 * (2.6 + rnd() * 1.8), sc2 * 0.7);
          cr.position.set((rnd() - 0.5) * 2.4, sc2 * 1.3, (rnd() - 0.5) * 2);
          cr.rotation.z = (rnd() - 0.5) * 0.5;
          cr.rotation.y = rnd() * 6.28;
          g2.add(cr);
        }
        const halo = mkGlow(0xff4d14, 2.6 + rnd() * 1.4); halo.position.y = 2.2; halo.material.opacity = 0.22; g2.add(halo);
        const side2 = i % 2 ? 1 : -1;
        g2.position.set(side2 * (7 + rnd() * 1.5), 0, -(i * 85 + rnd() * 20) - 30);
        caveG.add(g2);
        T3.monos.push(g2);
      }
      // glowing mushrooms — SMALL and MANY, colonies of green light at the walls
      T3.shrooms = [];
      const stemG = new THREE.CylinderGeometry(0.06, 0.11, 0.55, 5);
      const capG = new THREE.SphereGeometry(0.34, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      for (let i = 0; i < 30; i++) {
        const side = rnd() < 0.5 ? -1 : 1;
        const g2 = new THREE.Group();
        const n2 = 5 + (rnd() * 8 | 0);
        const glow = rnd() < 0.5 ? 0x2fe89a : 0x52ffb0;
        for (let c2 = 0; c2 < n2; c2++) {
          const sc2 = 0.32 + rnd() * 0.55;
          const stem = new THREE.Mesh(stemG, L2(0x1e2a24));
          const capMat = new THREE.MeshLambertMaterial({ color: 0x0f2018, emissive: glow, emissiveIntensity: 0.95, flatShading: true });
          capMat.toneMapped = false; // raw green — no wash
          const cap = new THREE.Mesh(capG, capMat);
          stem.scale.setScalar(sc2); cap.scale.setScalar(sc2);
          const ox = (rnd() - 0.5) * 2.2, oz = (rnd() - 0.5) * 2.0;
          stem.position.set(ox, 0.27 * sc2, oz);
          cap.position.set(ox, 0.55 * sc2, oz);
          g2.add(stem); g2.add(cap);
          const hg = mkGlow(glow, 1.0 * sc2); hg.material.opacity = 0.5;
          hg.position.set(ox, 0.6 * sc2, oz); g2.add(hg);
        }
        // a real light every few colonies — the grove actually ILLUMINATES
        if (i % 8 === 0) {
          const gl3 = new THREE.PointLight(0x2fe89a, 0.85, 7, 1.8);
          gl3.position.y = 0.7; g2.add(gl3);
        }
        // ZONE 1 · THE MUSHROOM GROVE — colonies bunch in the first stretch
        g2.position.set(side * (5 + rnd() * 1.8), 0, -(12 + i * 7 + rnd() * 5));
        g2.userData.side = side;
        caveG.add(g2);
        T3.shrooms.push(g2);
      }
      // drips — thin falling streaks from the ceiling, catch the headlight
      const dn = 42, dpos = new Float32Array(dn * 3), dvel = new Float32Array(dn);
      for (let i = 0; i < dn; i++) {
        dpos[i * 3] = (rnd() - 0.5) * 12;
        dpos[i * 3 + 1] = 1 + rnd() * 8;
        dpos[i * 3 + 2] = -rnd() * 120;
        dvel[i] = 5 + rnd() * 5;
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
      const drips = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xbfe0ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.65 }));
      caveG.add(drips); T3.drips = drips; T3.dripVel = dvel;
    }
    // ---- ACT 1 · NEON DISTRICT ----
    const cityG = new THREE.Group(); world.add(cityG); T3.cityG = cityG;
    {
      // towers: near-black masses, sparse cyan windows, magenta rare
      const winT = [0x35e0ef, 0xff2d6a].map(col => mkTex((g, S2) => {
        g.fillStyle = '#04040a'; g.fillRect(0, 0, S2, S2);
        const c2 = '#' + col.toString(16).padStart(6, '0');
        for (let y = 8; y < S2 - 8; y += 18) for (let x = 8; x < S2 - 8; x += 14) {
          if (Math.random() < 0.26) { g.fillStyle = Math.random() < 0.9 ? c2 : '#ffd28a'; g.globalAlpha = 0.3 + Math.random() * 0.6; g.fillRect(x, y, 8, 10); }
        }
        g.globalAlpha = 1;
      }, 128));
      T3.towers = [];
      for (let i = 0; i < 26; i++) {
        const side = i % 2 ? 1 : -1;
        const h2 = 10 + rnd() * 26, w2 = 4 + rnd() * 6;
        const tex = winT[rnd() < 0.85 ? 0 : 1]; // magenta towers are the exception
        const bld = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, w2),
          new THREE.MeshBasicMaterial({ map: tex, color: 0x3a4250 }));
        bld.position.set(side * (10 + rnd() * 20), h2 / 2 - 0.1, -(i * 26 + rnd() * 14) - 10);
        bld.userData.bx = bld.position.x;
        cityG.add(bld); T3.towers.push(bld);
      }
      // near-field industry — low brutalist blocks hugging the curb, mostly dark
      T3.blocks = [];
      for (let i = 0; i < 18; i++) {
        const side = i % 2 ? 1 : -1;
        const h3 = 2.2 + rnd() * 4, w3 = 3 + rnd() * 5;
        const blk = new THREE.Mesh(new THREE.BoxGeometry(w3, h3, w3 * (0.8 + rnd() * 0.8)), L2(0x141821, { flatShading: true }));
        blk.position.set(side * (8.8 + rnd() * 3), h3 / 2 - 0.1, -(i * 38 + rnd() * 16) - 8);
        blk.userData.bx = blk.position.x;
        cityG.add(blk); T3.blocks.push(blk);
      }
      // parked machines at the curb — dark bodies, red tails facing us
      T3.cars = [];
      const carBG = new THREE.BoxGeometry(1.7, 0.95, 4.0);
      const carCG = new THREE.BoxGeometry(1.5, 0.5, 2.0);
      const tailBG = new THREE.BoxGeometry(1.3, 0.12, 0.04);
      for (let i = 0; i < 8; i++) {
        const side = i % 2 ? 1 : -1;
        const car = new THREE.Group();
        const body2 = new THREE.Mesh(carBG, L2(0x10131b, { flatShading: true }));
        body2.position.y = 0.62; car.add(body2);
        const cab = new THREE.Mesh(carCG, L2(0x0c0f16, { flatShading: true }));
        cab.position.set(0, 1.2, 0.2); car.add(cab);
        const tail = new THREE.Mesh(tailBG, B(0xff2038));
        tail.position.set(0, 0.8, 2.02); car.add(tail);
        car.position.set(side * 6.5, 0, -(i * 64 + rnd() * 30) - 20);
        car.userData.bx = car.position.x;
        cityG.add(car); T3.cars.push(car);
      }
      // rain
      const rn = 500, rpos = new Float32Array(rn * 3);
      for (let i = 0; i < rn; i++) { rpos[i * 3] = (rnd() - 0.5) * 60; rpos[i * 3 + 1] = rnd() * 30; rpos[i * 3 + 2] = -rnd() * 120; }
      const rg = new THREE.BufferGeometry();
      rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
      const rain = new THREE.Points(rg, new THREE.PointsMaterial({ color: 0x9fc8e8, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
      cityG.add(rain); T3.rain = rain;
    }
    // ---- ACT 2 · THE TUNNEL ----
    const tunG = new THREE.Group(); world.add(tunG); T3.tunG = tunG;
    {
      // octagonal bore — flat-shaded facets read sci-fi, not anatomical
      const tube = new THREE.CylinderGeometry(4.7, 4.7, 360, 8, 1, true);
      const tun = new THREE.Mesh(tube, new THREE.MeshLambertMaterial({ color: 0x0c1018, side: THREE.BackSide, flatShading: true }));
      tun.rotation.x = Math.PI / 2; tun.position.set(0, 2.4, -150);
      tunG.add(tun); T3.tunBore = tun;
      const tunWire = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x1e4a6a, wireframe: true, transparent: true, opacity: 0.05, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      tunWire.rotation.x = Math.PI / 2; tunWire.position.set(0, 2.4, -150);
      tunG.add(tunWire); T3.tunWire = tunWire;
      // V16 · SECTION COLORS: the bore is zoned. As you travel, the rings and
      // walls shift through a palette so the tunnel stops being one endless hue.
      T3.tunZoneCols = [0x49c8f2, 0xff2d6a, 0xff8a2c, 0x8a5cff, 0x2fe89a];
      T3.rings = [];
      const ringG = new THREE.TorusGeometry(4.4, 0.14, 6, 8); // fat octagonal light rings (scrim-safe width)
      for (let i = 0; i < 26; i++) {
        const m = B(0x49c8f2, { transparent: true, opacity: 0.9 });
        m.toneMapped = false;
        const ring = new THREE.Mesh(ringG, m);
        ring.rotation.z = Math.PI / 8;
        ring.position.set(0, 2.4, -i * 20 - 4); // wide spacing — the bore breathes between gates
        tunG.add(ring); T3.rings.push({ ring, m });
      }
      // wall panels — magenta service lights
      const panG = new THREE.BoxGeometry(0.7, 0.3, 0.06);
      T3.pans = [];
      for (let i = 0; i < 20; i++) {
        const side = i % 2 ? 1 : -1;
        const pm = B(side < 0 ? 0xff7a2c : 0xc45cff, { transparent: true, opacity: 0.75 });
        pm.toneMapped = false;
        const pan = new THREE.Mesh(panG, pm);
        pan.position.set(side * 5.0, 1.25, -i * 17 - 9); // flush against the hero bore's wall
        pan.rotation.y = side * Math.PI / 2;
        pan.userData.side = side; pan.userData.m = pm;
        tunG.add(pan); T3.pans.push(pan);
      }
      // floor seams — magenta guides running the deck
      for (const sx of [-3.4, 3.4]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 360),
          new THREE.MeshBasicMaterial({ color: 0xff2d6a, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
        strip.position.set(sx, 0.02, -150); tunG.add(strip);
      }
      // V14 · the light at the end — a warm mouth far down the bore that only
      // opens as the build earns it; the tunnel keeps its promise
      const exitG = mkGlow(0xffc890, 26);
      exitG.position.set(0, 3.4, -168);
      exitG.material.opacity = 0;
      exitG.material.fog = false; exitG.material.needsUpdate = true;
      tunG.add(exitG); T3.tunExit = exitG;
      // V14 · contamination — a mushroom colony at a wall seam. Nobody
      // maintains this section anymore.
      if (T3.shrooms && T3.shrooms.length > 3) {
        const mold = T3.shrooms[2].clone();
        mold.position.set(-4.1, 0.1, -96); mold.scale.setScalar(0.85);
        tunG.add(mold);
        const mold2 = T3.shrooms[5].clone();
        mold2.position.set(4.0, 0.1, -210); mold2.scale.setScalar(0.7);
        tunG.add(mold2);
        const mold3 = T3.shrooms[8].clone();
        mold3.position.set(-3.9, 0.1, -290); mold3.scale.setScalar(1.0);
        tunG.add(mold3);
      }
      // V16 · MAINTENANCE DRONES — small geometric flyers running the bore,
      // weaving toward you, nav-lights blinking. Cheap procedural bodies so they
      // never wait on a model load, and they read as machines, not creatures.
      T3.drones = [];
      const droneBodyG = new THREE.OctahedronGeometry(0.34, 0);
      for (let i = 0; i < 5; i++) {
        const dr = new THREE.Group();
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x0e1622, emissive: 0x0a1420, flatShading: true });
        const body2 = new THREE.Mesh(droneBodyG, bodyMat); body2.scale.set(1.2, 0.7, 1.7); dr.add(body2);
        // a bright nav light underneath + a ring accent
        const navCol = [0x49c8f2, 0xff2d6a, 0x2fe89a][i % 3];
        const nav = mkGlow(navCol, 1.1); nav.material.opacity = 0.7; nav.position.y = -0.3; dr.add(nav);
        const lt = new THREE.PointLight(navCol, 0.7, 8, 1.8); lt.position.y = -0.2; dr.add(lt);
        const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 5, 8),
          new THREE.MeshBasicMaterial({ color: navCol, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
        ringA.material.toneMapped = false; ringA.rotation.x = Math.PI / 2; dr.add(ringA);
        dr.position.set((i % 2 ? 1 : -1) * (1.6 + (i % 3)), 1.6 + ((i * 5) % 3) - 1, -(i * 44) - 30);
        dr.userData = { nav: nav.material, ph: i * 1.7, lane: (i % 2 ? 1 : -1) * (1.6 + (i % 3)), yb: 1.6 + ((i * 5) % 3) - 1 };
        tunG.add(dr); T3.drones.push(dr);
      }
    }
    // ---- ACT 3 · PALM SUNSET ----
    const sunsetG = new THREE.Group(); world.add(sunsetG); T3.sunsetG = sunsetG;
    {
      const palmT = mkTex((g, S2) => {
        g.clearRect(0, 0, S2, S2);
        g.strokeStyle = '#1a1030'; g.fillStyle = '#1a1030';
        g.lineWidth = 7;
        g.beginPath(); g.moveTo(S2 * 0.5, S2); g.quadraticCurveTo(S2 * 0.58, S2 * 0.55, S2 * 0.52, S2 * 0.3); g.stroke();
        g.lineWidth = 5;
        for (let i = 0; i < 7; i++) {
          const a2 = -Math.PI * 0.9 + i * 0.28;
          g.beginPath(); g.moveTo(S2 * 0.52, S2 * 0.3);
          g.quadraticCurveTo(S2 * 0.52 + Math.cos(a2) * 40, S2 * 0.3 + Math.sin(a2) * 40 - 14, S2 * 0.52 + Math.cos(a2) * 78, S2 * 0.3 + Math.sin(a2) * 78 + 16);
          g.stroke();
        }
      });
      T3.palms = [];
      for (let i = 0; i < 18; i++) {
        const side = i % 2 ? 1 : -1;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: palmT, transparent: true }));
        const h2 = 9 + rnd() * 6;
        sp.scale.set(h2, h2, 1);
        sp.position.set(side * (7.5 + rnd() * 6), h2 * 0.45, -(i * 24 + rnd() * 10) - 8);
        sp.userData.bx = sp.position.x;
        sunsetG.add(sp); T3.palms.push(sp);
      }
    }
    // ---- polygonal terrain — faceted low hills flanking the road (city + sunset) ----
    const terrG = new THREE.Group(); world.add(terrG); T3.terrG = terrG;
    {
      T3.terr = [];
      const mkTerr = (sideX, zoff) => {
        const g3 = new THREE.PlaneGeometry(90, 120, 10, 12);
        const tp = g3.attributes.position;
        for (let i = 0; i < tp.count; i++) {
          const x = tp.getX(i), y = tp.getY(i);
          const inner = sideX > 0 ? x + 45 : 45 - x; // 0 at the road side, 90 far out
          const n = Math.sin(x * 0.21 + (y + zoff) * 0.13) + Math.sin(x * 0.06 - (y + zoff) * 0.17) * 0.8;
          tp.setZ(i, Math.pow(Math.max(0, inner) / 90, 1.5) * (8 + n * 4));
        }
        g3.computeVertexNormals();
        const mesh = new THREE.Mesh(g3, new THREE.MeshLambertMaterial({ color: 0x140b26, flatShading: true }));
        const wire = new THREE.Mesh(g3, new THREE.MeshBasicMaterial({ color: 0x5a3fae, wireframe: true, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
        const grp = new THREE.Group(); grp.add(mesh); grp.add(wire);
        grp.rotation.x = -Math.PI / 2;
        grp.position.set(sideX * 62, -0.04, zoff);
        grp.userData.sx = sideX * 62;
        terrG.add(grp); T3.terr.push(grp);
      };
      // short tiles so the terrain can FOLLOW the road's curve — no more road
      // sliding across the grid
      for (const sx2 of [1, -1]) for (const z2 of [-60, -180, -300, -420]) mkTerr(sx2, z2);
    }
    // ---- scenography: sun, halo, ridge, stars ----
    const sunT = mkTex((g, S2) => {
      const gr = g.createLinearGradient(0, 40, 0, 216);
      gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(0.55, '#ffb46e'); gr.addColorStop(1, '#ff7e6b');
      g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 88, 0, 6.284); g.fill();
      g.fillStyle = '#020107';
      for (let i = 0; i < 5; i++) g.fillRect(40, 138 + i * 14, 176, 2.5 + i * 1.6);
    });
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunT, fog: false, transparent: true }));
    sun.scale.set(64, 64, 1); sun.position.set(20, 12, -300); sc.add(sun); T3.sun = sun;
    const haloT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, 'rgba(255,170,110,0.55)'); gr.addColorStop(1, 'rgba(255,140,110,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloT, fog: false, transparent: true, blending: THREE.AdditiveBlending }));
    halo.scale.set(150, 150, 1); halo.position.copy(sun.position); halo.position.z -= 1; sc.add(halo); T3.halo = halo;
    // V13 · the sister planet — a vast dark body hanging over the horizon act.
    // Not a texture: a real sphere, lit like everything else, lavender rim so
    // the sky reads planetary rather than terrestrial
    {
      const pg = new THREE.SphereGeometry(56, 28, 20);
      const planet = new THREE.Mesh(pg, new THREE.MeshLambertMaterial({ color: 0x16102e, emissive: 0x0a0718, fog: false }));
      const prim = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: 0xb9a4ff, side: THREE.BackSide, transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
      prim.scale.setScalar(1.015); prim.material.toneMapped = false;
      planet.add(prim);
      planet.position.set(-148, 84, -370);
      sc.add(planet); T3.planet = planet;
      planet.visible = false;
    }
    {
      const pos2 = [];
      const N2 = 70, W2 = 700;
      for (let i = 0; i < N2; i++) {
        const x0 = -W2 / 2 + (i / (N2 - 1)) * W2, x1 = -W2 / 2 + ((i + 1) / (N2 - 1)) * W2;
        const h0 = 4 + rnd() * 14, h1 = 4 + rnd() * 14;
        pos2.push(x0, 0, 0, x1, 0, 0, x0, h0, 0, x1, 0, 0, x1, h1, 0, x0, h0, 0);
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos2), 3));
      const ridge = new THREE.Mesh(gg, B(0x0b0616, { fog: false }));
      ridge.position.set(0, 0, -290); sc.add(ridge); T3.ridge = ridge;
    }
    {
      const n2 = 220, pos2 = new Float32Array(n2 * 3);
      for (let i = 0; i < n2; i++) { pos2[i * 3] = (rnd() - 0.5) * 800; pos2[i * 3 + 1] = 20 + rnd() * 200; pos2[i * 3 + 2] = -250 - rnd() * 200; }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
      const st = new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xaab4ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.55, fog: false }));
      sc.add(st); T3.stars = st;
    }
    // ---- machine + rider (V5 primitives — hero models drop in when they arrive) ----
    const bike = new THREE.Group(); sc.add(bike); T3.bike = bike;
    bike.position.set(0, 0, -10.5);
    const dark = 0x11141f, darker = 0x0a0c13, accent = 0x3fd9e8;
    const wheel = (z2, rad) => {
      const w2 = new THREE.Group();
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad, rad * 0.26, 12, 36), B(0x07080d)));
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.035, 8, 32), B(0x232b3d)));
      w2.add(new THREE.Mesh(new THREE.TorusGeometry(rad * 0.62, 0.016, 8, 32), B(accent, { transparent: true, opacity: 0.55 })));
      w2.position.set(0, rad * 1.26, z2); bike.add(w2); return w2;
    };
    T3.placeholder = [wheel(1.05, 0.58), wheel(-1.15, 0.5)];
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 1.7, 6, 12), L2(dark));
    body.rotation.x = Math.PI / 2; body.position.set(0, 0.86, -0.1); bike.add(body);
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 10), L2(0x171b29));
    tank.scale.set(1, 0.72, 1.5); tank.position.set(0, 1.06, 0.32); bike.add(tank);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.0, 10), L2(darker));
    nose.rotation.x = -Math.PI / 2; nose.position.set(0, 0.92, -1.35); bike.add(nose);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.9, 8), L2(darker));
    tail.rotation.x = Math.PI / 2; tail.position.set(0, 1.05, 1.35); bike.add(tail);
    T3.placeholder.push(body, tank, nose, tail);
    for (const sx of [-1, 1]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 2.4), B(accent, { transparent: true, opacity: 0.8 }));
      strip.position.set(sx * 0.33, 0.9, 0); bike.add(strip); T3.placeholder.push(strip);
    }
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.07, 0.05), B(0xff4560));
    tailL.position.set(0, 1.14, 1.62); bike.add(tailL); T3.tailL = tailL;
    // NOTE: .add() returns the GROUP — assigning to its return value once
    // teleported the whole bike under the camera. The bulb gets its own const.
    const headBulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), B(0xbfd8ff));
    headBulb.position.set(0, 0.95, -1.8); bike.add(headBulb);
    // V15: the painted light-cone is retired with the pool sprite — real beams only.
    const rider = new THREE.Group(); bike.add(rider); T3.rider = rider;
    rider.position.set(0, 1.15, 0.55);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 6, 10), L2(0x0b0d15));
    torso.rotation.x = 1.05; torso.position.set(0, 0.32, -0.1); rider.add(torso);
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), L2(0x0d0f1a));
    helmet.position.set(0, 0.62, -0.42); rider.add(helmet);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.02), B(0x9f8cff, { transparent: true, opacity: 0.85 }));
    visor.position.set(0, 0.62, -0.6); rider.add(visor);
    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.5, 4, 8), L2(0x0a0c12));
    legL.rotation.z = 0.5; legL.rotation.x = 0.4; legL.position.set(-0.3, -0.05, 0.1); rider.add(legL);
    const legR = legL.clone(); legR.rotation.z = -0.5; legR.position.x = 0.3; rider.add(legR);
    rider.visible = false; // the capsule person is retired until a real rider model arrives
    // machine light: V16 tames the red halo that used to SWALLOW the bike, and
    // adds a real key light overhead so you can actually see the machine
    const under = mkGlow(0xff5a3c, 2.6); under.material.opacity = 0.16; // smaller, dimmer underglow — it hints, it doesn't erase the bike
    under.position.set(0, 0.1, 0.2); bike.add(under); T3.under = under;
    const rim = new THREE.PointLight(0x7a5cf0, 0.7, 12, 1.6); // deep purple rim on the flanks
    rim.position.set(0.8, 3.0, 3.2); bike.add(rim); T3.rim = rim;
    // KEY: a cool near-white light riding just above and behind the camera line,
    // aimed down at the machine so its top surfaces and the rider read
    const key = new THREE.PointLight(0xbcd4ff, 1.5, 9, 1.8);
    key.position.set(0, 3.0, 2.6); bike.add(key); T3.bikeKey = key;
    const cock = new THREE.PointLight(0xff7a4c, 0.9, 7, 1.5); // low orange machine-light
    cock.position.set(0, 2.2, -0.8); bike.add(cock); T3.cock = cock;
    const tailGlow = mkGlow(0xff2038, 1.9); tailGlow.material.opacity = 0.42; tailGlow.position.set(0, 1.1, 1.9); bike.add(tailGlow);
    // wet-road streak — the tail light smearing down the asphalt behind us
    const streak = mkGlow(0xff2038, 2.6); streak.scale.set(0.9, 3.6, 1);
    streak.material.opacity = 0.06; streak.position.set(0, 0.04, 3.2);
    bike.add(streak); T3.streak = streak;
    // ---- HERO ASSETS (CC-BY: Akira Motorcycle by s.navajon; palms via Sketchfab) ----
    if (typeof THREE.GLTFLoader === 'function') {
      const loader = new THREE.GLTFLoader();
      loader.load('models/akira_motorcycle.glb', gl2 => {
        try {
          const m = gl2.scene;
          m.updateMatrixWorld(true); // settle child matrices BEFORE measuring — stale boxes mis-centered the fit
          const bb = new THREE.Box3().setFromObject(m);
          const size = bb.getSize(new THREE.Vector3());
          let f = 3.4 / Math.max(size.x, size.y, size.z, 0.001);
          if (!isFinite(f) || f <= 0) f = 1;
          m.scale.multiplyScalar(f); // multiply — respect the export's own baked scale
          m.rotation.y = -Math.PI / 2; // the export runs nose-along-X: turn it to face down the road
          m.updateMatrixWorld(true);
          const bb2 = new THREE.Box3().setFromObject(m);
          const c2 = bb2.getCenter(new THREE.Vector3());
          m.position.set(-c2.x, -bb2.min.y, -c2.z);
          // V16: brighter body + a real self-glow so the machine reads in the dark
          m.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: 0x33405e, emissive: 0x1a2340, emissiveIntensity: 1.0, flatShading: true }); });
          T3.placeholder.forEach(p2 => p2.visible = false);
          T3.bike.add(m); T3.bikeModel = m;
          const topY = bb2.max.y - bb2.min.y;
          const lenZ = bb2.max.z - bb2.min.z;
          // neon accent strips along the flanks, sized to the real model
          for (const sx of [-1, 1]) {
            const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, lenZ * 0.72),
              new THREE.MeshBasicMaterial({ color: 0xff2d6a, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }));
            strip.position.set(sx * (bb2.max.x - bb2.min.x) * 0.42, topY * 0.42, 0);
            T3.bike.add(strip);
          }
          T3.rider.position.set(0, topY * 0.8, 0.5);
          T3.tailL.position.set(0, topY * 0.6, 1.68);
        } catch (e) {}
      });
      loader.load('models/palm_trees.glb', gl2 => {
        try {
          const inner = gl2.scene;
          const bb = new THREE.Box3().setFromObject(inner);
          const size = bb.getSize(new THREE.Vector3());
          const c0 = bb.getCenter(new THREE.Vector3());
          let sc2 = 11 / Math.max(size.y, 0.001);
          if (!isFinite(sc2) || sc2 <= 0) sc2 = 1;
          // recenter the cluster on its own footprint so clones don't straddle the road
          const src2 = new THREE.Group();
          inner.position.set(-c0.x, -bb.min.y, -c0.z);
          src2.add(inner);
          src2.traverse(o => {
            if (o.isMesh && o.material) {
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => {
                if (mm.color) mm.color.setRGB(0.28, 0.23, 0.42); // V13: deeper dusk — the beams find the texture, not the ambient
              });
            }
          });
          T3.palms.forEach(sp => sp.visible = false);
          T3.palmModels = [];
          for (let i = 0; i < 8; i++) {
            const cl = src2.clone();
            cl.scale.multiplyScalar(sc2 * (0.75 + ((i * 37) % 11) / 11 * 0.5));
            // V13: asymmetry — palms crowd the LEFT shore; the right stays open
            // for the antenna-coral and the long view to the sun
            const side = i % 3 === 2 ? 1 : -1;
            cl.position.set(side * (side > 0 ? 21 + ((i * 13) % 6) : 14 + ((i * 13) % 9)), 0, -(i * 46) - 12);
            cl.userData.bx = cl.position.x;
            cl.rotation.y = (i * 1.7) % 6.28;
            // glowing linework — a wireframe echo that brightens as the tree passes
            const wm = new THREE.MeshBasicMaterial({ color: 0x6a2fd8, wireframe: true, transparent: true, opacity: 0.012, blending: THREE.AdditiveBlending, depthWrite: false });
            const meshes2 = [];
            cl.traverse(o => { if (o.isMesh) meshes2.push(o); });
            meshes2.forEach(o => o.add(new THREE.Mesh(o.geometry, wm)));
            cl.userData.wireMat = wm;
            T3.sunsetG.add(cl);
            T3.palmModels.push(cl);
          }
        } catch (e) {}
      });
      // ---- V10 HERO FLEET — every file shrunk (textures stripped or downscaled) ----
      T3.mixers = [];
      const fitIn = (m, target) => {
        m.updateMatrixWorld(true);
        const bb = new THREE.Box3().setFromObject(m);
        const sz = bb.getSize(new THREE.Vector3());
        let f = target / Math.max(sz.x, sz.y, sz.z, 0.001);
        if (!isFinite(f) || f <= 0) f = 1;
        m.scale.multiplyScalar(f);
        m.updateMatrixWorld(true);
        const b2 = new THREE.Box3().setFromObject(m);
        const c3 = b2.getCenter(new THREE.Vector3());
        m.position.set(-c3.x, -b2.min.y, -c3.z);
      };
      const darken = (mm, col, em) => mm.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: col, emissive: em || 0x000000, flatShading: true }); });
      // real buildings — split the night skyline into blocks, placed curb-side
      loader.load('models/city_buildings.glb', gl2 => { try {
        const src3 = gl2.scene; src3.updateMatrixWorld(true);
        const parts = [];
        // the pack is a BACKGROUND SKYLINE set — it ships glow billboards (suns,
        // flares) alongside the buildings. Keep only real volumes: no transparent
        // materials, no flat planes.
        src3.traverse(o => {
          if (!o.isMesh) return;
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          if (mats.some(mm => mm.transparent || mm.alphaTest > 0)) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bs = o.geometry.boundingBox.getSize(new THREE.Vector3());
          const dims = [bs.x, bs.y, bs.z].sort((a, b) => a - b);
          if (dims[0] < dims[2] * 0.06) return; // flat billboard — skip
          parts.push(o);
        });
        if (!parts.length) return;
        T3.bldModels = [];
        for (let i = 0; i < 24; i++) {
          const src4 = parts[i % parts.length];
          const inner4 = src4.clone();
          inner4.applyMatrix4(src4.matrixWorld); // bake skyline placement, then recenter
          const w4 = new THREE.Group(); w4.add(inner4);
          fitIn(w4, 9 + ((i * 37) % 10));
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(w4);
          wrap.position.set(side * (9.5 + ((i * 13) % 5)), 0, -(i * 30 + ((i * 29) % 14)) - 14);
          wrap.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          wrap.userData.bx = wrap.position.x;
          T3.cityG.add(wrap); T3.bldModels.push(wrap);
        }
      } catch (e) {} });
      // the cyberpunk car — parked at the curb, plus two oncoming in the far lane
      loader.load('models/cyber_car.glb', gl2 => { try {
        const car0 = new THREE.Group(); car0.add(gl2.scene);
        fitIn(car0, 4.6);
        // V15: the white full-mesh stroke is GONE. The car is a dark textured
        // body that the beams and side washes actually reveal.
        car0.traverse(o => { if (o.isMesh && o.material && o.material.emissive) o.material.emissive.setHex(0x131725); });
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2038 }); tailMat.toneMapped = false;
        T3.cars.forEach((cg, i) => {
          while (cg.children.length) cg.remove(cg.children[0]);
          const cl = car0.clone();
          cl.rotation.y = i % 2 ? 0.05 : -0.05;
          cg.add(cl);
          const tail = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.07, 0.05), tailMat);
          tail.position.set(0, 0.7, 2.15); cg.add(tail);
          // let the body READ so the lights don't float
          cl.traverse(o => { if (o.isMesh && o.material && o.material.emissive) { o.material = o.material.clone(); o.material.emissive.setHex(0x11141f); } });
        });
        T3.traffic = [];
        for (let i = 0; i < 2; i++) {
          const wrap = new THREE.Group();
          const mv = car0.clone(); mv.rotation.y = Math.PI; wrap.add(mv);
          const head2 = mkGlow(0xcfe8ff, 0.85); head2.position.set(0, 1, 2.4); head2.material.opacity = 0.2; wrap.add(head2);
          wrap.position.set(-2.3, 0, -160 - i * 190);
          T3.cityG.add(wrap); T3.traffic.push(wrap);
        }
      } catch (e) {} });
      // street signage — glowing boards leaning over the curb
      loader.load('models/sign_board.glb', gl2 => { try {
        const s0 = new THREE.Group(); s0.add(gl2.scene);
        fitIn(s0, 4.2);
        T3.signs = [];
        for (let i = 0; i < 7; i++) {
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(s0.clone());
          wrap.position.set(side * 6.9, 0, -(i * 74 + ((i * 31) % 26)) - 30);
          wrap.rotation.y = (side < 0 ? 0.5 : Math.PI - 0.5);
          wrap.userData.bx = wrap.position.x;
          T3.cityG.add(wrap); T3.signs.push(wrap);
        }
      } catch (e) {} });
      // real rock — stalagmites on the floor, some flipped to hang as stalactites
      loader.load('models/stalagmite.glb', gl2 => { try {
        const r0 = new THREE.Group(); r0.add(gl2.scene);
        darken(r0, 0x241838, 0x0c0618); // brighter — the REAL rock should read over the procedural fill
        fitIn(r0, 4.4);
        T3.rocks = [];
        for (let i = 0; i < 24; i++) {
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(r0.clone());
          const hang = i % 3 === 2;
          const sc3 = 0.8 + ((i * 37) % 12) / 12 * 1.8;
          wrap.scale.setScalar(sc3);
          // V15: ROOTED — floor rocks sink their bases into the ground, hangers
          // embed their bases in the ceiling rock instead of floating below it
          if (hang) { wrap.rotation.z = Math.PI; wrap.position.set(side * (4.5 + (i * 7) % 4), 11.3, -(i * 28 + (i * 23) % 14) - 16); }
          else wrap.position.set(side * (6.2 + (i * 7) % 3), -0.38 * sc3, -(i * 28 + (i * 23) % 14) - 16);
          wrap.rotation.y = i * 1.3;
          T3.caveG.add(wrap); T3.rocks.push(wrap);
        }
        // one colossal formation — scale is the fun
        const big = new THREE.Group(); big.add(r0.clone());
        big.scale.setScalar(4.6);
        big.position.set(-8.6, -1.6, -350); // rooted, not perched
        T3.caveG.add(big); T3.rocks.push(big);
      } catch (e) {} });
      // handpainted GEMS — the pack split into its four crystals, sided by color,
      // plus two colossi. These are the cave's jewelry now.
      loader.load('models/gems.glb', gl2 => { try {
        const src5 = gl2.scene; src5.updateMatrixWorld(true);
        const gemParts = [];
        src5.traverse(o => { if (o.isMesh) gemParts.push(o); });
        T3.gems = [];
        const mkGem = (i, scale, side, z) => {
          const src6 = gemParts[i % gemParts.length];
          const inner6 = src6.clone();
          inner6.applyMatrix4(src6.matrixWorld);
          inner6.material = inner6.material.clone();
          if (inner6.material.color) inner6.material.color.setRGB(side > 0 ? 0.72 : 1.0, side > 0 ? 0.58 : 0.72, side > 0 ? 1.0 : 0.45);
          if ('toneMapped' in inner6.material) inner6.material.toneMapped = false;
          const g6 = new THREE.Group(); g6.add(inner6);
          fitIn(g6, scale);
          const wrap = new THREE.Group(); wrap.add(g6);
          const halo = mkGlow(side > 0 ? 0x8a3fff : 0xff5a14, scale * 0.9);
          halo.position.y = scale * 0.45; halo.material.opacity = 0.12; wrap.add(halo);
          wrap.userData.halo = halo; wrap.userData.side = side;
          wrap.position.set(side * (5.6 + (i * 7) % 3), 0, z);
          wrap.rotation.y = i * 2.1;
          T3.caveG.add(wrap); T3.gems.push(wrap);
        };
        // V16: scattered the length of the cave, both sides, wide size range —
        // some near, some deep, no marching line
        for (let i = 0; i < 18; i++) mkGem(i, 1.5 + ((i * 31) % 10) / 10 * 3.0, (i * 7) % 5 < 2 ? 1 : -1, -(40 + ((i * 97) % 620)));
        mkGem(1, 12, -1, -300); // the orange colossus
        mkGem(2, 10, 1, -520);  // the purple one
      } catch (e) {} });
      // ================= V13 · THE PLANET'S NEW LIFE =================
      // CAVERN · fan coral colonies — real reef fans clustered at the rock,
      // nearly black until a headlight finds them, warm-pink halo at the roots
      loader.load('models/coral.glb', gl2 => { try {
        const c0 = new THREE.Group(); c0.add(gl2.scene);
        c0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.multiplyScalar(0.8);
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(c0, 3.4);
        T3.corals = [];
        for (let i = 0; i < 9; i++) {
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(c0.clone());
          const sc9 = 0.7 + ((i * 29) % 10) / 10 * 1.5;
          wrap.scale.setScalar(sc9);
          const halo = mkGlow(side > 0 ? 0xc45cff : 0xff5a6a, 1.6); halo.position.y = 0.9; halo.material.opacity = 0.07; wrap.add(halo);
          wrap.userData.halo = halo; wrap.userData.side = side;
          // colonies CLUSTER — three tight groups instead of an even sprinkle
          const zone = [ -40, -260, -520 ][i % 3];
          wrap.position.set(side * (5.6 + (i * 7) % 3), 0, zone - (i * 11) % 34);
          wrap.rotation.y = i * 2.4;
          T3.caveG.add(wrap); T3.corals.push(wrap);
        }
        // HORIZON · the same organism grown tall — antenna plants on the open right shore
        T3.antennae = [];
        for (let i = 0; i < 4; i++) {
          const wrap = new THREE.Group(); wrap.add(c0.clone());
          wrap.scale.set(2.2, 3.6 + (i % 3), 2.2); // stretched — coral becoming araucaria
          wrap.position.set(10.5 + (i * 9) % 8, 0, -(i * 92) - 40);
          wrap.userData.bx = wrap.position.x;
          wrap.rotation.y = i * 1.9;
          T3.sunsetG.add(wrap); T3.antennae.push(wrap);
        }
      } catch (e) {} });
      // CAVERN · stalked jellyfish — V16: the crowd favorite gets its due. Two
      // CLUSTERS of stauromedusae in wildly varied sizes and tilts, a couple of
      // them hero-scale, standing like a garden that turns out to be alive.
      // (skinned → one load per instance; the file caches after the first fetch)
      T3.jellyS = [];
      [ // two groves, near-left and deep-right, plus a few strays
        { x: -6.4, z: -70, sc: 3.0, tilt: 0.1 }, { x: -7.6, z: -95, sc: 5.6, tilt: -0.14 }, { x: -5.0, z: -120, sc: 2.2, tilt: 0.2 },
        { x: 6.6, z: -300, sc: 4.0, tilt: -0.1 }, { x: 7.8, z: -330, sc: 6.4, tilt: 0.16 }, { x: 5.4, z: -355, sc: 2.6, tilt: -0.22 },
        { x: -6.9, z: -520, sc: 4.6, tilt: 0.12 }
      ].forEach((cfg, ji) => {
        loader.load('models/jelly_s.glb', gl2 => { try {
          const j0 = new THREE.Group(); j0.add(gl2.scene);
          j0.traverse(o => { if (o.isMesh && o.material) {
            o.material.transparent = true;
            if (o.material.emissive) o.material.emissive.setHex(0x0e2a34);
            if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
          } });
          fitIn(j0, cfg.sc);
          const wrap = new THREE.Group(); wrap.add(j0); // move the WRAP — fitIn's centering lives in j0.position
          wrap.position.set(cfg.x, 0, cfg.z);
          wrap.rotation.set(cfg.tilt, ji * 1.3, cfg.tilt * 0.6); // varied lean + facing so it reads as a natural stand
          wrap.userData.cfg = cfg;
          T3.caveG.add(wrap); T3.jellyS.push(wrap);
          if (gl2.animations && gl2.animations.length) {
            const mx = new THREE.AnimationMixer(gl2.scene);
            mx.clipAction(gl2.animations[0]).play(); mx.timeScale = 0.4 + (ji % 3) * 0.12; // desync the swaying
            T3.mixers.push(mx);
          }
        } catch (e) {} });
      });
      // CAVERN · blue jellyfish — drifting lanterns overhead; each carries a
      // REAL light, because bioluminescence is one of the few honest emitters
      loader.load('models/jelly_b.glb', gl2 => { try {
        const j0 = new THREE.Group(); j0.add(gl2.scene);
        j0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          o.material.transparent = true;
          if (o.material.emissive) o.material.emissive.setHex(0x123448);
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(j0, 4.4);
        T3.jellyB = [];
        [ { x: -3.4, y: 6.4, z: -120 }, { x: 3.8, y: 7.6, z: -400 } ].forEach((cfg, i) => {
          const wrap = new THREE.Group(); wrap.add(j0.clone());
          const gl3 = new THREE.PointLight(0x3fb8e8, 0.9, 13, 1.7);
          gl3.position.y = -1.2; wrap.add(gl3); wrap.userData.light = gl3;
          const halo = mkGlow(0x49c8f2, 3.4); halo.material.opacity = 0.1; wrap.add(halo);
          wrap.userData.halo = halo;
          wrap.position.set(cfg.x, cfg.y, cfg.z); wrap.userData.cfg = cfg;
          T3.caveG.add(wrap); T3.jellyB.push(wrap);
        });
      } catch (e) {} });
      // CAVERN · the manta — glides down the passage ALONG your path. V16: no
      // hull() here (it froze a static bind-pose shell inside the swimming mesh);
      // the silhouette rides on an emissive lift + a soft violet halo instead.
      loader.load('models/manta.glb', gl2 => { try {
        const m0 = new THREE.Group(); m0.add(gl2.scene);
        m0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.setRGB(0.36, 0.29, 0.56);
          if (o.material.emissive) o.material.emissive.setHex(0x4a2f8a); // brighter dusk so the wings read on scrim
          if ('emissiveIntensity' in o.material) o.material.emissiveIntensity = 0.9;
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(m0, 18);
        const mgl = new THREE.PointLight(0x7a54ff, 0.9, 14, 1.6);
        mgl.position.y = -1.5; m0.add(mgl); // a violet underlight — the creature reveals the rock it passes
        const mhalo = mkGlow(0x8a5cff, 11); mhalo.material.opacity = 0.1; m0.add(mhalo); // a soft body glow — reads as a silhouette line, not a cloud
        m0.rotation.x = 0.12; // slight wing-plane tilt so it reads as a body, not a hairline
        const wrap = new THREE.Group(); wrap.add(m0); // animate the wrap; m0 keeps its centering
        wrap.position.set(0, 40, -30); // parked out of sight above until its cue
        T3.caveG.add(wrap); T3.mantaCave = wrap;
        if (gl2.animations && gl2.animations.length) {
          const mx = new THREE.AnimationMixer(gl2.scene);
          mx.clipAction(gl2.animations[0]).play(); mx.timeScale = 0.7;
          T3.mixers.push(mx);
        }
      } catch (e) {} });
      // HORIZON · a second manta, loaded separately (skinned meshes don't clone) —
      // a slow dark shape crossing the face of the sun
      loader.load('models/manta.glb', gl2 => { try {
        const m0 = new THREE.Group(); m0.add(gl2.scene);
        m0.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: 0x0d0616, fog: false }); });
        fitIn(m0, 46);
        m0.rotation.x = 0.4; // tip the wing plane so the crossing reads as a diamond, not a hairline
        const wrap = new THREE.Group(); wrap.add(m0);
        wrap.position.set(-160, 22, -262);
        T3.sunsetG.add(wrap); T3.mantaSun = wrap;
        if (gl2.animations && gl2.animations.length) {
          const mx = new THREE.AnimationMixer(gl2.scene);
          mx.clipAction(gl2.animations[0]).play(); mx.timeScale = 0.35;
          T3.mixers.push(mx);
        }
      } catch (e) {} });
      // DISTRICT · the landmark — a laminar tower that reads as grown, not built.
      // Coral logic at architectural scale: the premise of the whole planet
      loader.load('models/tower.glb', gl2 => { try {
        const t0 = new THREE.Group(); t0.add(gl2.scene);
        t0.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: 0x161228, fog: false }); });
        hull(t0, 0xff6a9e, 0.05, 1.012); // warm pink rim — the city's one soft color
        fitIn(t0, 72);
        const wrap = new THREE.Group(); wrap.add(t0);
        wrap.position.set(-26, 0, -280);
        wrap.userData.bx = -26;
        T3.cityG.add(wrap); T3.landmark = wrap;
      } catch (e) {} });
      // DISTRICT · maintenance robots doing inexplicable jobs at the curb —
      // deadpan, headlight-lit, softly bobbing as if underwater
      loader.load('models/robot.glb', gl2 => { try {
        const r0 = new THREE.Group(); r0.add(gl2.scene);
        r0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.multiplyScalar(0.78); // V15: the worker keeps its orange-and-cream identity
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(r0, 2.3);
        T3.robots = [];
        [ { x: -6.6, z: -84, r: 2.4 }, { x: 6.5, z: -228, r: -1.9 } ].forEach((cfg, i) => {
          const wrap = new THREE.Group(); wrap.add(r0.clone());
          wrap.position.set(cfg.x, 0, cfg.z); wrap.rotation.y = cfg.r;
          wrap.userData.cfg = cfg; wrap.userData.bx = cfg.x;
          T3.cityG.add(wrap); T3.robots.push(wrap);
        });
      } catch (e) {} });
      // DISTRICT · the crab. Once in a while it crosses the highway, enormous
      // and completely serious. Nobody in the city finds this unusual.
      loader.load('models/crab.glb', gl2 => { try {
        const c0 = new THREE.Group(); c0.add(gl2.scene);
        // V15 · CYBER CRAB: the nature documentary is over. The scan renders as
        // a translucent cyan hologram with a hot magenta rim — and it flickers.
        T3.crabMats = [];
        c0.traverse(o => { if (o.isMesh) {
          // additive — holograms EMIT. The scan's vertex shading becomes the scan-line detail.
          o.material = new THREE.MeshBasicMaterial({ vertexColors: true, color: 0x3fd0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
          o.material.toneMapped = false;
          T3.crabMats.push(o.material);
        } });
        hull(c0, 0xff2da8, 0.14, 1.024);
        fitIn(c0, 16);
        const wrap = new THREE.Group(); wrap.add(c0);
        wrap.position.set(999, 0, -46); // offstage until its scene
        wrap.rotation.y = Math.PI / 2;
        T3.cityG.add(wrap); T3.crab = wrap;
      } catch (e) {} });
      // DISTRICT · ships that swim — two fighters gliding between towers with
      // the body language of reef fish, engines as the only bright thing
      loader.load('models/fighter.glb', gl2 => { try {
        const f0 = new THREE.Group(); f0.add(gl2.scene);
        f0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.multiplyScalar(0.82); // V15: keep the red-striped hull readable — assets get their own identities back
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(f0, 7);
        T3.fighters = [];
        for (let i = 0; i < 2; i++) {
          const wrap = new THREE.Group(); wrap.add(f0.clone());
          const eng = mkGlow(0xff9a3c, 1.5); eng.position.set(0, 0.4, 3.2); eng.material.opacity = 0.35; wrap.add(eng);
          wrap.position.set(i ? 18 : -14, 9 + i * 4, -90 - i * 110);
          wrap.userData.ph = i * 2.6;
          T3.cityG.add(wrap); T3.fighters.push(wrap);
        }
      } catch (e) {} });
      // TUNNEL · V16 retires the hero bore. The user's call: the hero model +
      // round rings read as a busy mix that lost the badass-ness. We're back to
      // the clean geometric octagon bore (T3.tunBore stays visible), zoned by
      // color, curving, with drones — see the tunnel init + step. No load here.
      // HORIZON · once in a long while, something the size of weather walks the
      // ridge. It is a water bear. This is normal here.
      loader.load('models/waterbear.glb', gl2 => { try {
        const w0 = new THREE.Group(); w0.add(gl2.scene);
        w0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          o.material.fog = false;
          if (o.material.color) o.material.color.multiplyScalar(0.5);
          if (o.material.emissive) o.material.emissive.setHex(0x180d12); // fleshy dusk — it must read against the dark sky, not just the disk
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        hull(w0, 0xff8a5e, 0.07, 1.012);
        w0.traverse(o => { if (o.userData.isHull) o.material.fog = false; }); // the rim must survive 300 units of fog
        fitIn(w0, 92); // the size of weather — it must clear the ridge line
        const wrap = new THREE.Group(); wrap.add(w0);
        wrap.position.set(230, 0, -302); // in FRONT of the ridge — nothing between it and the sky
        T3.bear = wrap;
        T3.sunsetG.add(wrap);
      } catch (e) {} });
      // the leviathans — a POD: one massive and near, three ranging behind
      T3.whales = [];
      // V16: the pod rides CLOSER — a leviathan looming near-frame, the rest
      // ranging behind. Off in the distance they read great; up close they awe.
      const PODS = [
        { fit: 66, y: 13, z: -80, x0: -70, spd: 2.4, ts: 0.28 },
        { fit: 30, y: 19, z: -150, x0: -20, spd: 1.5, ts: 0.35 },
        { fit: 20, y: 24, z: -260, x0: 45, spd: 1.1, ts: 0.42 },
        { fit: 13, y: 9, z: -50, x0: 75, spd: 3.0, ts: 0.5 }
      ];
      PODS.forEach(cfg => {
        loader.load('models/whale.glb', gl2 => { try {
          const w0 = gl2.scene;
          darken(w0, 0x141026, 0x070310);
          const wrap = new THREE.Group(); wrap.add(w0);
          fitIn(wrap, cfg.fit);
          wrap.position.set(cfg.x0, cfg.y, cfg.z);
          wrap.rotation.y = Math.PI / 2;
          wrap.userData.cfg = cfg;
          T3.sunsetG.add(wrap); T3.whales.push(wrap);
          if (gl2.animations && gl2.animations.length) {
            const mx = new THREE.AnimationMixer(w0);
            mx.clipAction(gl2.animations[0]).play();
            mx.timeScale = cfg.ts;
            T3.mixers.push(mx);
          }
        } catch (e) {} });
      });
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.2);
    if (s.pres < 0.22) s.asleep = true;
    if (s.asleep && s.pres > 0.5) {
      s.asleep = false;
      P.ping(A => {
        if (typeof MOut !== 'undefined') MOut.sfxNote(36, 0.85, 3);
        A.hit({ vol: 0.22, dur: 0.7, freq: 85, q: 0.6, at: 0 });
      });
    }
    // V16: closeness to the source is INTENSITY (beam flare + mix swell), no
    // longer the throttle. Presence alone keeps you fast, so leaning to play a
    // side never slows you down — the road stopped punishing the instrument.
    const reachIn = clamp((1 - (inp.L + inp.R) / 2) * s.pres);
    const thr = reachIn; // downstream visuals/audio read closeness as intensity
    // the journey advances only while someone rides
    const ACT_LEN = [42, 38, 26, 42];
    if (s.pres > 0.45 && s.pending == null) {
      s.actT += dt;
      if (s.actT > ACT_LEN[s.act]) { s.actT = 0; s.pending = (s.act + 1) % 4; }
    }
    // smooth crossfade: fog closes in BEFORE the swap, the world changes at the
    // peak where nothing can be seen, then it clears into the new act
    if (s.pending != null) {
      s.trans = Math.min(1, s.trans + dt * 0.9);
      if (s.trans >= 1) { s.act = s.pending; s.pending = null; } // V15: no FPV rip — the zone is sacred
    } else {
      s.trans = Math.max(0, s.trans - dt * 0.5);
    }
    const tunnel = s.act === 2;
    const spdMax = tunnel ? 40 : s.act === 3 ? 30 : 34;
    // presence-driven cruise: show up and you GO. reachIn only tops it off.
    const cruise = clamp(s.pres);
    s.speed += ((7 + cruise * spdMax + reachIn * spdMax * 0.18) - s.speed) * Math.min(1, dt * 1.4);
    const steerIn = clamp(inp.R - inp.L, -1, 1);
    s.steer += (steerIn - s.steer) * Math.min(1, dt * 1.6);
    // the lean carries you across the three rails: full lean sits you on a side rail
    s.lane += (s.steer * 3.0 - s.lane) * Math.min(1, dt * 1.4);
    s.bob += dt * (2 + s.speed * 0.3);
    s.kickPulse = Math.max(0, s.kickPulse - dt * 5);
    s.arpFlash = Math.max(0, s.arpFlash - dt * 5);
    if (P.focused && typeof MOut !== 'undefined') {
      const now = performance.now();
      for (let i = MOut.log.length - 1; i >= 0; i--) {
        const ev = MOut.log[i];
        if (ev.p <= s.lastEvP) break;
        if (ev.p > now) continue;
        if (ev.role === 'perc') s.kickPulse = 1;
        else if (ev.role === 'arp') { s.arpFlash = 1; s.arpIdx++; }
      }
      s.lastEvP = now;
    }
    if (s.noGL || !P._three) return;
    const T3 = P._three, E = 0.55 + s.pres * 0.45;
    if (T3.mixers) for (const mx of T3.mixers) mx.update(dt);
    const dz = s.speed * dt;
    const act = s.act;
    // THE STREET IS THE INSTRUMENT: drift toward a side and that side wakes —
    // orange country to the left, purple country to the right
    const sideL = clamp(-s.lane / 2.0, 0, 1), sideR = clamp(s.lane / 2.0, 0, 1);
    s.sideL = sideL; s.sideR = sideR;
    // V16 · which of the three rails you're riding (0 orange L, 1 spine, 2 violet R)
    const railW = [
      clamp(1 - Math.abs(s.lane - T3.railX[0]) / 2.0),
      clamp(1 - Math.abs(s.lane - T3.railX[1]) / 2.0),
      clamp(1 - Math.abs(s.lane - T3.railX[2]) / 2.0)
    ];
    s.railW = railW;
    // the side washes: your country lights up and beats with the kick
    if (T3.sideLightL) {
      T3.sideLightL.intensity = sideL * (2.0 + s.kickPulse * 1.4);
      T3.sideLightR.intensity = sideR * (2.0 + s.kickPulse * 1.4);
    }
    // act visibilities
    T3.caveG.visible = act === 0; T3.cityG.visible = act === 1;
    T3.tunG.visible = act === 2; T3.sunsetG.visible = act === 3;
    T3.stars.visible = act !== 2 && act !== 0;
    T3.ridge.visible = act === 1 || act === 3;
    if (T3.planet) T3.planet.visible = act === 3;
    // the long clock that paces the planet's rare events — it only advances
    // while someone is riding, so the surprises are EARNED, not scheduled
    s.evtT = (s.evtT || 0) + dt * (s.pres > 0.35 ? 1 : 0.12);
    T3.terrG.visible = act === 1 || act === 3;
    // winding-road math — amplitude eases in for the open acts, phase travels with the ride
    const curveTarget = act === 1 ? 7 : act === 3 ? 5 : 0;
    s.curveA += (curveTarget - s.curveA) * Math.min(1, dt * 0.5);
    s.curvePh += dz * 0.010;
    const CW = 0.010;
    const cxF = z => s.curveA * (Math.sin(z * CW + s.curvePh) - Math.sin(s.curvePh));
    const slopeF = z => s.curveA * CW * Math.cos(z * CW + s.curvePh);
    const curvedOn = s.curveA >= 0.4;
    T3.roadStr.visible = !curvedOn;
    T3.curveG.visible = curvedOn;
    if (curvedOn) for (let i2 = 0; i2 < T3.segs.length; i2++) {
      const sg = T3.segs[i2], zq = -i2 * 8 - 2;
      sg.position.x = cxF(zq);
      sg.rotation.y = Math.atan(slopeF(zq));
    }
    // terrain rides the curve with the road — no more sliding across the grid
    if (T3.terrG.visible) for (const tg of T3.terr) {
      tg.position.z += dz; if (tg.position.z > 60) tg.position.z -= 480;
      tg.position.x = tg.userData.sx + cxF(tg.position.z - 60);
    }
    // scroll + recycle
    for (const d of T3.dashes) { d.position.z += dz; if (d.position.z > 2) d.position.z -= 288; d.position.x = cxF(d.position.z); }
    const recyc = (obj, span) => { obj.position.z += dz; if (obj.position.z > 4) obj.position.z -= span; };
    // ---- V16 · the three rails + streaming note-glyphs ----
    if (T3.railSegs) {
      for (let r = 0; r < 3; r++) {
        const w2 = railW[r];
        T3.railMats[r].opacity = 0.07 + w2 * (0.28 + s.kickPulse * 0.22) + s.arpFlash * 0.05; // additive segments stack in perspective — keep the ceiling low
        for (const seg of T3.railSegs[r]) {
          seg.position.z += dz; if (seg.position.z > 4) seg.position.z -= 182;
          seg.position.x = T3.railX[r] + cxF(seg.position.z);
          seg.scale.x = 1 + w2 * 0.55; // your rail fattens, but not into a white slab
        }
      }
      s.noteQ = s.noteQ || [];
      const PLAY_Z = -13; // the play line, out ahead of the machine so pops don't cover it
      for (const gl of T3.notes) {
        const prevZ = gl.position.z;
        gl.position.z += dz;
        if (gl.position.z > 6) { gl.position.z -= T3.noteSpan * 3; gl.userData.fired = false; gl.userData.pop = 0; }
        gl.position.x = T3.railX[gl.userData.rail] + cxF(gl.position.z);
        gl.rotation.y += dt * 2.2;
        const r = gl.userData.rail, w2 = railW[r];
        gl.userData.pop = Math.max(0, (gl.userData.pop || 0) - dt * 3.2); // pop decays after the hit
        if (!gl.userData.fired && prevZ <= PLAY_Z && gl.position.z > PLAY_Z) {
          gl.userData.fired = true; gl.userData.pop = 1;
          if (w2 > 0.35) { // you're on this rail — it SOUNDS
            s.noteQ.push({ rail: r, deg: gl.userData.deg, v: w2 });
            if (r === 1) s.kickPulse = Math.max(s.kickPulse, 0.8); else s.arpFlash = Math.max(s.arpFlash, 0.8);
          }
        }
        // brighten as it nears the play line, flash on the hit, then FADE OUT
        // before it reaches the machine so it never washes the bike
        const near = clamp(1 - Math.abs(gl.position.z - PLAY_Z) / 30);
        const pop = gl.userData.pop * (0.4 + w2 * 0.6);
        const fade = gl.position.z <= PLAY_Z ? 1 : clamp(1 - (gl.position.z - PLAY_Z) / 4.5);
        gl.userData.m.opacity = (0.1 + near * (0.26 + w2 * 0.4) + pop * 0.45) * fade;
        gl.scale.setScalar((0.7 + near * 0.36 + pop * 0.6) * (0.5 + fade * 0.5));
      }
    }
    if (act === 0) {
      // the rock itself streams past — two tube segments leapfrogging
      for (const tb of T3.caveTubes) {
        tb.position.z += dz;
        if (tb.position.z > 140) tb.position.z -= 480;
        // V13: the skeleton is an EVENT, not the default surface — near-black rock
        // revealed by headlights, structure exposed only on beats and transitions
        tb.userData.wireMat.opacity = 0.022 + s.kickPulse * 0.085 + s.arpFlash * 0.035 + s.trans * 0.3;
      }
      for (const c of T3.crystals) {
        recyc(c.g, 680);
        // YOUR side answers YOUR hand — push toward the source to light it up
        const hand = clamp(((c.side < 0 ? 1 - inp.L : 1 - inp.R) * s.pres) * 0.6 + (c.side < 0 ? sideL : sideR) * 0.8);
        const opp = c.side < 0 ? sideR : sideL; // the far country FALLS AWAY — contrast makes the lean legible
        c.m.opacity = (0.42 - opp * 0.24) + hand * 0.55 + s.arpFlash * 0.2;
        c.halo.material.opacity = 0.1 + hand * (0.3 + s.kickPulse * 0.4) + s.arpFlash * 0.1;
      }
      for (const m2 of T3.monos) recyc(m2, 680);
      for (const st2 of T3.stals) {
        recyc(st2.g, 680); // V16: rock teeth — no self-glow, no halo, revealed only by the beams
      }
      for (const m of T3.shrooms) {
        recyc(m, 690);
        const near2 = m.userData.side < 0 ? sideL : sideR;
        const sc4 = 1 + near2 * (0.2 + s.arpFlash * 0.22); // the grove dances only when you lean into it
        m.scale.set(sc4, sc4, sc4);
      }
      if (T3.rocks) for (const r3 of T3.rocks) recyc(r3, 680);
      if (T3.gems) for (const gm of T3.gems) {
        recyc(gm, 680);
        const near3 = gm.userData.side > 0 ? sideR : sideL;
        gm.userData.halo.material.opacity = 0.08 + near3 * (0.4 + s.kickPulse * 0.45) + s.arpFlash * 0.08;
      }
      // V13 cave life
      if (T3.corals) for (const co of T3.corals) {
        recyc(co, 680);
        const nearC = co.userData.side > 0 ? sideR : sideL;
        co.userData.halo.material.opacity = 0.04 + nearC * (0.22 + s.kickPulse * 0.3);
      }
      if (T3.jellyS) for (const j of T3.jellyS) {
        recyc(j, 680);
        j.rotation.y += dt * 0.15;
      }
      if (T3.jellyB) for (const j of T3.jellyB) {
        recyc(j, 680);
        const cfg = j.userData.cfg;
        j.position.x = cfg.x + Math.sin(t * 0.21 + cfg.z) * 1.6;
        j.position.y = cfg.y + Math.sin(t * 0.34 + cfg.x) * 0.9;
        // the lantern BREATHES — brighter on the beat, real light and halo together
        j.userData.light.intensity = 0.55 + s.kickPulse * 0.9 + s.arpFlash * 0.4;
        j.userData.halo.material.opacity = 0.06 + s.kickPulse * 0.12 + s.arpFlash * 0.08;
      }
      // the manta's cue: every ~40 riding-seconds it GLIDES down the passage
      // along your path — rising up out of the road ahead, banking overhead,
      // and swimming off into the dark behind you. No more sideways slide.
      if (T3.mantaCave) {
        const ph = (s.evtT % 40) / 13; // active for the first 13s of each cycle
        if (ph < 1) {
          T3.mantaCave.visible = true;
          T3.mantaCave.position.z = -150 + ph * 176;      // far ahead → past the rider
          T3.mantaCave.position.x = Math.sin(ph * Math.PI) * 3.4; // a lazy S down the bore
          T3.mantaCave.position.y = 3.4 + ph * 3.0 + Math.sin(ph * Math.PI) * 1.6; // lifts over your head as it passes
          T3.mantaCave.rotation.y = Math.PI + Math.sin(ph * 5) * 0.16; // face down-road (toward the camera it approaches)
          T3.mantaCave.rotation.z = Math.sin(t * 1.3) * 0.14; // the wingbeat bank
        } else T3.mantaCave.visible = false;
      }
      // drips
      const dp = T3.drips.geometry.attributes.position;
      for (let i = 0; i < dp.count; i++) {
        let y = dp.getY(i) - T3.dripVel[i] * dt, z = dp.getZ(i) + dz;
        if (y < 0.05) { y = 6 + ((i * 7919) % 97) / 97 * 5; }
        if (z > 2) z -= 120;
        dp.setY(i, y); dp.setZ(i, z);
      }
      dp.needsUpdate = true;
    } else if (act === 1) {
      for (const b of T3.towers) { recyc(b, 700); b.position.x = b.userData.bx + cxF(b.position.z); }
      for (const b of T3.blocks) { recyc(b, 700); b.position.x = b.userData.bx + cxF(b.position.z); }
      for (const c2 of T3.cars) { recyc(c2, 520); c2.position.x = c2.userData.bx + cxF(c2.position.z); c2.rotation.y = Math.atan(slopeF(c2.position.z)); }
      if (T3.bldModels) for (const b2 of T3.bldModels) { recyc(b2, 730); b2.position.x = b2.userData.bx + cxF(b2.position.z); }
      if (T3.signs) for (const sg2 of T3.signs) {
        recyc(sg2, 540); sg2.position.x = sg2.userData.bx + cxF(sg2.position.z);
        const nearS = sg2.userData.bx < 0 ? sideL : sideR;
        sg2.scale.setScalar(1 + nearS * 0.34); // your side's signage leans in — visibly now
      }
      if (T3.traffic) for (const tr of T3.traffic) {
        tr.position.z += dz + dt * 16; // oncoming — closing speed
        if (tr.position.z > 8) tr.position.z -= 400;
        tr.position.x = -2.3 + cxF(tr.position.z);
        tr.rotation.y = Math.PI + Math.atan(slopeF(tr.position.z));
      }
      // V13 district life
      if (T3.landmark) {
        recyc(T3.landmark, 760);
        T3.landmark.position.x = T3.landmark.userData.bx + cxF(T3.landmark.position.z) * 0.4;
        T3.landmark.rotation.y = t * 0.008; // geological patience
      }
      if (T3.robots) for (const rb of T3.robots) {
        recyc(rb, 700); rb.position.x = rb.userData.bx + cxF(rb.position.z);
        const cfg = rb.userData.cfg;
        rb.position.y = 0.15 + Math.sin(t * 0.9 + cfg.z) * 0.12; // underwater hover
        rb.rotation.y = cfg.r + Math.sin(t * 0.23 + cfg.x) * 0.4; // absorbed in the job
      }
      if (T3.fighters) for (const fg of T3.fighters) {
        fg.position.z += dz;
        if (fg.position.z > -30) fg.position.z -= 500; // never through the camera — sea life keeps its distance
        const ph = t * 0.4 + fg.userData.ph;
        fg.position.x = Math.sin(ph) * 17 + cxF(fg.position.z);
        fg.position.y = 10 + Math.sin(ph * 0.7) * 3.5;
        fg.rotation.y = Math.PI + Math.cos(ph) * 0.5; // it TURNS like a fish
        fg.rotation.z = Math.cos(ph) * 0.4;            // and BANKS like one
      }
      // the crab's scene: every ~55 riding-seconds it SCUTTLES across the
      // highway broadside — body square to you, legs carrying it sideways, the
      // honest gait of a crab. Completely serious about it.
      if (T3.crab) {
        const ph = ((s.evtT + 22) % 55) / 14; // 14-second crossing
        if (ph < 1) {
          T3.crab.visible = true;
          const dir = ((s.evtT / 55) | 0) % 2 ? -1 : 1; // alternate which way it crosses
          T3.crab.position.x = dir * (-46 + ph * 92);
          T3.crab.position.z = -46;
          T3.crab.position.y = Math.abs(Math.sin(ph * 26)) * 0.35; // the tiny gallop of a giant
          T3.crab.rotation.y = Math.PI + Math.sin(ph * 12) * 0.08; // broadside to the camera, faint scuttle-sway
          // hologram shimmer — two incommensurate flickers plus the kick
          if (T3.crabMats) {
            const flick = 0.42 + Math.sin(t * 23) * 0.07 + Math.sin(t * 61) * 0.05 + s.kickPulse * 0.16;
            for (const cm of T3.crabMats) cm.opacity = flick;
          }
        } else T3.crab.visible = false;
      }
      const rp = T3.rain.geometry.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        let y = rp.getY(i) - dt * 26, z = rp.getZ(i) + dz;
        if (y < 0) y = 28; if (z > 2) z -= 120;
        rp.setY(i, y); rp.setZ(i, z);
      }
      rp.needsUpdate = true;
    } else if (act === 2) {
      const bld = s.tunBuild || 0;
      // V14 · the phrase clock, read from the audio engine: where we are in the
      // bar, which beat is sounding, and how close the next phrase downbeat is
      const nowMs = performance.now();
      const barPh = s.tunBarLen ? clamp((nowMs - (s.tunBarAt || nowMs)) / s.tunBarLen) : 0;
      const beatIdx = Math.min(3, (barPh * 4) | 0);
      const antic = s.tunPhraseBar === 3 ? barPh : 0; // ramps through the phrase's last bar
      // V16 · the maintenance drones run the bore toward you, weaving and
      // blinking; recycled when they pass behind
      if (T3.drones) for (const dr of T3.drones) {
        dr.position.z += dz + dt * 10; // they close faster than the ground — traffic
        if (dr.position.z > 6) dr.position.z -= 240;
        const ph = t * 1.1 + dr.userData.ph;
        dr.position.x = dr.userData.lane + Math.sin(ph) * 1.4; // weave across the bore
        dr.position.y = dr.userData.yb + 2.4 + Math.sin(ph * 0.7) * 0.5; // hover mid-bore
        dr.rotation.y = Math.sin(ph) * 0.4;
        dr.rotation.z = Math.cos(ph) * 0.3;
        dr.userData.nav.opacity = 0.5 + Math.abs(Math.sin(t * 6 + dr.userData.ph)) * 0.5; // blinking nav light
      }
      // V16 · SECTION COLORS: each ring takes the color of the zone it's passing
      // through, so travelling the bore walks you through cyan → magenta →
      // amber → violet → green districts. The beat still chases across them.
      const ZC = T3.tunZoneCols;
      let nearest = null, nearZ = -1e9;
      T3.rings.forEach((r2, i2) => {
        recyc(r2.ring, 520);
        r2.ring.scale.setScalar(1);
        const zone = Math.floor((-r2.ring.position.z + 500) / 60) % ZC.length;
        r2.m.color.setHex(ZC[zone]);
        const chase = (i2 % 4) === beatIdx ? s.kickPulse : 0;
        r2.m.opacity = 0.12 + bld * 0.15 + chase * (0.22 + bld * 0.55);
        if (r2.ring.position.z < -6 && r2.ring.position.z > nearZ) { nearZ = r2.ring.position.z; nearest = r2; }
      });
      if (nearest) {
        nearest.m.opacity = Math.max(nearest.m.opacity, 0.18 + antic * 0.82);
        nearest.ring.scale.setScalar(1 + antic * 0.07);
      }
      for (const p2 of T3.pans) {
        recyc(p2, 340);
        // your wall answers your lean — pulsing in its side color
        const near4 = p2.userData.side < 0 ? sideL : sideR;
        p2.userData.m.opacity = 0.22 + bld * 0.08 + near4 * (0.78 + s.kickPulse * 0.35);
        p2.scale.setScalar(1 + near4 * (0.5 + s.kickPulse * 0.25));
      }
      // the light at the end opens with the build and hands off to the sunset
      if (T3.tunExit) {
        T3.tunExit.material.opacity = Math.pow(bld, 2.2) * 0.5 + s.trans * 0.35;
        T3.tunExit.scale.setScalar(26 + Math.pow(bld, 2) * 34);
      }
    } else {
      for (const p2 of (T3.palmModels || T3.palms)) {
        recyc(p2, T3.palmModels ? 380 : 430);
        if (p2.userData.bx !== undefined) p2.position.x = p2.userData.bx + cxF(p2.position.z);
        if (p2.userData.wireMat) {
          const nearSide = (p2.userData.bx || 0) < 0 ? sideL : sideR; // your side's palms light their lines
          p2.userData.wireMat.opacity = 0.008 + Math.max(0, 1 - Math.abs(p2.position.z + 40) / 110) * (0.02 + nearSide * (0.1 + s.kickPulse * 0.12));
        }
      }
      if (T3.whales) for (const wh of T3.whales) {
        const cfg = wh.userData.cfg;
        wh.position.x += dt * cfg.spd;
        if (wh.position.x > 110) wh.position.x = -110;
        wh.rotation.y = Math.PI / 2 + Math.sin(t * 0.1 + cfg.z) * 0.08;
        wh.position.y = cfg.y + Math.sin(t * 0.15 + cfg.x0) * 1.2;
      }
      // V13 horizon life
      if (T3.antennae) for (const an of T3.antennae) {
        recyc(an, 380);
        an.position.x = an.userData.bx + cxF(an.position.z);
      }
      if (T3.planet) T3.planet.rotation.y = t * 0.005;
      // the manta crossing the sun — one slow dark wingbeat across the disk
      if (T3.mantaSun) {
        const ph = (s.evtT % 64) / 26; // 26-second crossing every ~64
        if (ph < 1) {
          T3.mantaSun.visible = true;
          T3.mantaSun.position.x = -150 + ph * 300;
          T3.mantaSun.position.y = 20 + Math.sin(ph * Math.PI) * 9;
          T3.mantaSun.rotation.z = Math.sin(t * 0.9) * 0.18; // the long slow wingbeat
        } else T3.mantaSun.visible = false;
      }
      // V16 · THE FINALE: the tardigrade the size of weather no longer just
      // walks the ridge — it CHARGES the road, rears up over the machine, and
      // mock-swallows the whole frame before lumbering off. Say nothing.
      if (T3.bear) {
        const ph = ((s.evtT + 24) % 78) / 16; // ~16s charge every 78 riding-seconds
        if (ph < 1) {
          T3.bear.visible = true;
          // barrels in from deep center to right on top of you, then lifts away
          const approach = ph < 0.66 ? ph / 0.66 : 1 - (ph - 0.66) / 0.34;
          const az = -235 + approach * 226; // -235 (far) → -9 (in your face)
          T3.bear.position.set(Math.sin(ph * 3) * 3, 1.5 + (1 - approach) * 9 + Math.abs(Math.sin(ph * 30)) * 1.6, az);
          T3.bear.rotation.y = Math.PI; // face down the road, toward the camera it's charging
          T3.bear.rotation.x = -approach * 0.35; // rears its head as it closes
          const sc = 1 + approach * 0.9; T3.bear.scale.setScalar(sc);
          // THE BITE: at the closest pass, the flash + the chomp
          if (approach > 0.9 && !s.chompDone) { s.chomp = 1; s.chompHit = 1; s.chompDone = true; }
          if (approach < 0.6) s.chompDone = false;
        } else { T3.bear.visible = false; T3.bear.scale.setScalar(1); }
      }
      s.chomp = Math.max(0, (s.chomp || 0) - dt * 1.6);
    }
    // the tunnel dives and climbs — a gradual vertical sweep
    if (act === 2) {
      s.tunPh += dz * 0.016;
      T3.world.position.y = Math.sin(s.tunPh) * 1.15 * (0.7 + (s.tunBuild || 0) * 0.7); // the dive deepens as the build rises
    } else if (Math.abs(T3.world.position.y) > 0.01) {
      T3.world.position.y *= Math.max(0, 1 - dt * 1.5);
    }
    // per-act road dressing: dirt in the cave, curbs in the city, pale desert lines at sunset
    for (const e2 of T3.strEdges) e2.visible = act !== 0;
    T3.dashMat.color.setHex([0x54382a, 0x59e6b8, 0x59e6b8, 0xe8bd92][act]);
    for (const cb of T3.curbs) cb.visible = act === 1;
    // sun per act
    const sunVis = act === 1 ? 0.45 : act === 3 ? 1 : 0;
    T3.sun.material.opacity += (sunVis - T3.sun.material.opacity) * Math.min(1, dt * 1.5);
    T3.sun.material.color.setHex(act === 1 ? 0xffb37a : 0xffffff); // warm through the city haze
    T3.halo.material.color.setHex(act === 1 ? 0xff8a5e : 0xffaa6e);
    T3.halo.material.opacity = T3.sun.material.opacity * (act === 1 ? 0.45 : 0.8) + s.kickPulse * 0.08;
    if (act === 3) { T3.sun.position.set(0, 9, -300); T3.sun.scale.set(95, 95, 1); T3.halo.scale.set(220, 220, 1); }
    else { T3.sun.position.set(20, 12, -300); T3.sun.scale.set(64, 64, 1); T3.halo.scale.set(150, 150, 1); }
    T3.halo.position.copy(T3.sun.position); T3.halo.position.z -= 1;
    // atmosphere per act (+ transition fog swell that masks the swap)
    const fogA = [0.028, 0.0135, 0.017, 0.009][act];
    T3.hemi.intensity = [0.055, 0.2, 0.075, 0.3][act]; // V15: the cavern lifts its floor of light — a projector at night on playa dust needs pixels to hold onto
    T3.scene.fog.density = fogA - thr * 0.003 + s.trans * 0.05;
    const fogCol = [0x170c30, 0x0a0714, 0x060a16, 0x140a18][act]; // cave veil carries luminance now, not just black
    T3.scene.fog.color.setHex(fogCol);
    T3.scene.background.setHex([0x0c0620, 0x020107, 0x02040a, 0x0a0410][act]);
    const expAct = act === 2 ? 0.76 + (s.tunBuild || 0) * 0.32 : [0.94, 0.9, 1.0, 1.12][act]; // the tunnel EARNS its brightness; the cave holds a projector-safe floor
    T3.renderer.toneMappingExposure = (0.68 + E * 0.5 + s.kickPulse * 0.05 + (s.chomp || 0) * 0.9) * expAct * (1 - s.trans * 0.45); // the bite flashes the frame white
    // road accents per act
    const edgeCol = [0x6a5aa8, 0x2ec8da, 0x49c8f2, 0xff9a6b][act];
    // THE LEAN, made legible: your side's road line IGNITES in its color —
    // orange left, purple right — and beats in time with the side's objects
    T3._cb = T3._cb || new THREE.Color(); T3._co = T3._co || new THREE.Color(0xff7a2c); T3._cp = T3._cp || new THREE.Color(0xc45cff);
    T3._cb.setHex(edgeCol);
    T3.edgeMats[0].color.copy(T3._cb).lerp(T3._co, sideL).multiplyScalar(1 + sideL * (0.5 + s.kickPulse * 0.9));
    T3.edgeMats[1].color.copy(T3._cb).lerp(T3._cp, sideR).multiplyScalar(1 + sideR * (0.5 + s.kickPulse * 0.9));
    if (sideL > 0.05 || sideR > 0.05) T3.dashMat.color.lerp(sideL > sideR ? T3._co : T3._cp, Math.max(sideL, sideR) * 0.5);
    T3.ground.material.color.setHex([0x050310, 0x05060e, 0x04060c, 0x0d0713][act]);
    T3.under.material.opacity = 0.1 + s.kickPulse * 0.16 + thr * 0.08; // V16: the underglow no longer swallows the bike
    if (T3.bloom) T3.bloom.strength = [0.6, 0.75, 0.72, 0.62][act] + s.kickPulse * 0.12;
    // V13 · TWO REAL HEADLIGHTS — each hand owns a beam. Closeness to the
    // source flares your side and pulls its color into the world; the enclosed
    // acts get longer throw because they have walls to catch it
    const handL = clamp((1 - inp.L) * s.pres), handR = clamp((1 - inp.R) * s.pres);
    // V16: the tunnel's beams were blinding — the bore lights itself now, so the
    // headlights back off there and let the section colors carry it
    const reach = act === 0 ? 1.6 : act === 2 ? 0.7 : 0.72;
    const beamBase = act === 2 ? 0.4 : 0.7, beamGain = act === 2 ? 2.0 : 3.4;
    T3.headL.intensity = (beamBase + handL * beamGain + s.kickPulse * 0.5 * handL) * reach;
    T3.headR.intensity = (beamBase + handR * beamGain + s.kickPulse * 0.5 * handR) * reach;
    T3.headL.target.position.set(-3.2 + s.steer * 9 - s.lane, 0.4, -55);
    T3.headR.target.position.set(3.2 + s.steer * 9 - s.lane, 0.4, -55);
    T3.headL.position.x = -0.42 - s.lane * 0.2;
    T3.headR.position.x = 0.42 - s.lane * 0.2;
    T3.head.intensity = 0.5 + (handL + handR) * 0.5;
    T3.rim.intensity = act === 0 ? 0.22 : 0.55; // purple rim stays a whisper
    T3.head.color.setHex([0xffb066, 0xcfeaff, 0x9fd8ff, 0xffc890][act]);
    T3.head.position.set(-s.lane, 1.6, -20);
    // steering / lean / camera
    // heading follows the road's tangent — without this the road slides sideways
    // under the bike and the path reads as detached from the world
    // V16 · the tunnel CURVES now: a slow yaw of the whole world about the bike
    // swings the vanishing point left and right, so the bore winds instead of
    // running dead straight. Bike stays on its rail; the world bends around it.
    s.tunCurvePh = (s.tunCurvePh || 0) + dz * 0.006;
    const tunYaw = act === 2 ? Math.sin(s.tunCurvePh) * 0.13 : 0;
    T3.world.rotation.y = s.steer * 0.105 - Math.atan(slopeF(0)) + tunYaw;
    T3.world.position.x = -s.lane;
    T3.bike.rotation.z = -s.steer * 0.34 - slopeF(-10) * 2.2; // bank into the road's own bend too
    T3.rider.rotation.z = -s.steer * 0.16;
    T3.bike.position.y = T3.world.position.y + Math.sin(s.bob * 2.1) * 0.02 * (s.speed / 40); // ride the road's rise and fall — no more floating
    // V13 CAMERA: the attract state stays elevated and calm so a bystander can
    // read the whole scene; engagement drops into a LOW CHASE behind the tail —
    // embodied, banking with the machine, trailing it with a breath of lag
    // V15 · ONE CONTINUOUS CAMERA. No modes, no cuts: presence eases the view
    // down and IN over ~2.5s, and the machine rides much larger in frame.
    const camKraw = s.pres * s.pres * (3 - 2 * s.pres);
    s.camKs = (s.camKs || 0) + (camKraw - (s.camKs || 0)) * Math.min(1, dt * 0.55); // the blend breathes — it never rips
    const camK = s.camKs;
    s.camX = (s.camX || 0) + ((s.steer * 0.85) * camK - (s.camX || 0)) * Math.min(1, dt * 2.1); // the lag IS the weight
    s.camR = (s.camR || 0) + ((-s.steer * 0.1 - slopeF(-10) * 0.5) * camK - (s.camR || 0)) * Math.min(1, dt * 2.6);
    T3.cam.rotation.z = s.camR + (act === 2 ? -Math.sin(s.tunCurvePh) * 0.17 * camK : 0); // bank into the tunnel's curve
    T3.cam.rotation.y = 0.05 * camK - s.camX * 0.06;
    T3.cam.rotation.x = (-0.27 + 0.215 * camK) + (act === 2 ? Math.cos(s.tunPh) * 0.03 : 0);
    T3.cam.position.x = 1.05 * (1 - camK) + s.camX;
    // near-field motion grows with intensity: bob + a shiver of kick
    T3.cam.position.y = (4.9 - 2.7 * camK)
      + Math.sin(s.bob) * (0.015 + camK * 0.03) * (s.speed / 40)
      + s.kickPulse * camK * 0.045
      + T3.world.position.y * 0.4;
    T3.cam.position.z = -3.1 * camK; // ride up close behind the tail — the machine fills the frame
    T3.cam.fov = 58 + camK * 5 + (tunnel ? thr * 8 + (s.tunBuild || 0) * 6 : 0);
    T3.cam.updateProjectionMatrix();
    T3.tailL.scale.setScalar(1 + s.kickPulse * 0.8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('NIGHT CIRCUIT V16 · THE JOURNEY', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    if (T3.comp) T3.comp.render(); else T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ACTS = ['THE CAVERN', 'NEON DISTRICT', 'THE TUNNEL', 'PALM SUNSET'];
    const rw = s.railW || [0, 1, 0];
    const rail = rw[0] > rw[1] && rw[0] > rw[2] ? 'ORANGE RAIL' : rw[2] > rw[1] ? 'VIOLET RAIL' : 'SPINE';
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * Math.max(1, Math.sqrt(areaScale(P))))}px ui-monospace,monospace`;
    g.fillText(ACTS[P.state.act] + ' · ' + Math.round(s.speed * 6) + ' KM/H · ' + (s.pres < 0.3 ? 'WAITING IN THE DARK' : rail) + ' · [1-4] SKIP ACT', 10, h - 10);
  },
  audio(A, P) {
    // V5's own engine: 84 BPM minor, drums EARN their entrance by act
    const v = A.voice();
    const surf = v.filter('lowpass', 1000, 0.9);
    surf.connect(v.group);
    const mkBus = gain => { const gg = v.g(gain); gg.connect(surf); return gg; };
    const arpBus = mkBus(1), bassBus = mkBus(1), leadBus = mkBus(1);
    if (A.delIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.55; arpBus.connect(s2); s2.connect(A.delIn); }
    if (A.revIn) { const s3 = A.ctx.createGain(); s3.gain.value = 0.35; arpBus.connect(s3); s3.connect(A.revIn); }
    if (A.delIn) { const s4 = A.ctx.createGain(); s4.gain.value = 0.7; leadBus.connect(s4); s4.connect(A.delIn); }
    if (A.revIn) { const s5 = A.ctx.createGain(); s5.gain.value = 0.5; leadBus.connect(s5); s5.connect(A.revIn); }
    let nextT = T.next(0.25), step16 = 0;
    const schedTone = (bus, freq, t0, vol, dur, type) => {
      const o = A.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const gg = A.ctx.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg); gg.connect(bus);
      o.start(t0); o.stop(t0 + dur + 0.05);
    };
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        const s = P.state;
        // the instrument: LEFT hand plays the arps, RIGHT hand plays the stabs,
        // both together drive the drums — closeness to the source = intensity
        const closeL = clamp((1 - inp.L) * s.pres), closeR = clamp((1 - inp.R) * s.pres);
        const sideL2 = s.sideL || 0, sideR2 = s.sideR || 0;
        const lift = clamp((closeL + closeR) / 2);
        const act = s.act || 0;
        const rw = s.railW || [0, 1, 0]; // V16 · rail emphasis: your lane foregrounds its voice
        // V16 · the tardigrade's BITE — one enormous pitch-dropping maw of sub
        if (s.chompHit) {
          s.chompHit = 0;
          const at = T.next(0.02);
          const o = A.ctx.createOscillator(); o.type = 'sine';
          o.frequency.setValueAtTime(H.rootFreq(-1) * 2.2, at);
          o.frequency.exponentialRampToValueAtTime(22, at + 0.5);
          const gg = A.ctx.createGain();
          gg.gain.setValueAtTime(0.0001, at);
          gg.gain.linearRampToValueAtTime(0.42, at + 0.02);
          gg.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
          o.connect(gg); gg.connect(bassBus); o.start(at); o.stop(at + 1.2);
          A.hit({ vol: 0.3, dur: 0.5, freq: 240, q: 0.5, at });
          if (typeof MOut !== 'undefined') { MOut.sfxNote(30, 0.9, 4); MOut.evDrum(35, 0.6, at); }
        }
        // V16 · drain the note-glyph queue — the rail you ride SOUNDS as you cross
        // its glyphs; scheduled at the next grid tick so it stays quantized
        if (s.noteQ && s.noteQ.length) {
          const nq = s.noteQ.splice(0, s.noteQ.length);
          const at = T.next(0.04);
          for (const n of nq) {
            if (n.rail === 1) { A.kick(at, 0.26); MOut.evDrum(41, 0.22, at); } // spine: a tom/kick accent
            else {
              const f = H.chordTone(n.deg, n.rail === 0 ? 1 : 0);
              schedTone(arpBus, f, at, 0.05 + n.v * 0.05, n.rail === 0 ? 0.42 : 0.22, n.rail === 0 ? 'sine' : 'sawtooth');
              MOut.evNote(n.rail === 0 ? 'bells' : 'pad', f, 0.12 + n.v * 0.08, at, n.rail === 0 ? 0.42 : 0.22);
            }
          }
        }
        // V14 · the tunnel is a COMPOSED ARC: how deep you've ridden into the
        // act is the arrangement dial. Back off the hands and it thins, but the
        // structure itself is authored — pulse, build, crescendo, release.
        const build = act === 2 ? clamp((s.actT || 0) / 26) : 0;
        s.tunBuild = build;
        const inten = [0.12, 0.55, 1.0, 0.4][act] * (0.25 + lift * 0.75) * (act === 2 ? 0.45 + build * 0.55 : 1);
        A.set(surf.frequency, 260 + Math.pow(lift, 1.4) * (act === 2 ? 2200 + build * 5600 : 5200), 0.2);
        MOut.expr('arp', closeL); MOut.expr('bass', lift); MOut.expr('pad', closeR);
        const horizon = AE.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          // V14 · publish the phrase clock so the WORLD can play along: bar
          // downbeat wall-time + phrase position, read by the gate lighting
          if (act === 2 && st === 0) {
            const bar = (step16 / 16) | 0;
            s.tunPhraseBar = bar % 4;
            s.tunBarAt = performance.now() + Math.max(0, (tt - AE.t()) * 1000);
            s.tunBarLen = T.beat * 4000;
          }
          // drums: silent in the cave, groove in the city, full double-time in the tunnel,
          // heavy half-time at the sunset
          if (act >= 1 && lift > 0.1) {
            const kickPat = act === 3 ? (st === 0 || st === 10) : (st % 4 === 0);
            if (kickPat && inten > 0.25) A.kick(tt, 0.26 + rw[1] * 0.12); // the spine hits harder when you ride the center rail
            // 808 under the kick, once a bar — the badass low end lives in every act
            if (st === 0 && inten > 0.3) {
              const bf8 = H.rootFreq(-2);
              const o8 = A.ctx.createOscillator(); o8.type = 'sine';
              o8.frequency.setValueAtTime(bf8 * 2.6, tt);
              o8.frequency.exponentialRampToValueAtTime(Math.max(20, bf8 * 0.95), tt + 0.25);
              const g8 = A.ctx.createGain();
              g8.gain.setValueAtTime(0.0001, tt);
              g8.gain.linearRampToValueAtTime(0.2 + lift * 0.08, tt + 0.01);
              g8.gain.exponentialRampToValueAtTime(0.0001, tt + 0.7);
              o8.connect(g8); g8.connect(bassBus); o8.start(tt); o8.stop(tt + 0.8);
            }
            const snarePos = act === 3 ? st === 8 : st % 8 === 4;
            if (snarePos && inten > 0.4) {
              MOut.evDrum(38, 0.24, tt);
              A.hit({ vol: 0.16, dur: 0.16, freq: 1700, q: 0.8, at: tt });
              A.tone(170, { at: tt, vol: 0.06, dur: 0.1, type: 'triangle', rev: 0.3 });
            }
            const hatEvery = act === 2 ? (build > 0.28 ? 1 : 2) : 2; // double-time hats are EARNED a quarter of the way in
            if (st % hatEvery === (hatEvery === 1 ? 0 : 1) && inten > 0.3) A.hat(tt, { vol: 0.022 + lift * 0.028, open: act === 2 && st === 14 });
            // open hat breathing on the offbeat 8ths — the disco lung
            if (act === 1 && st % 4 === 2 && inten > 0.4) A.hat(tt, { vol: 0.03 + lift * 0.02, open: true });
          }
          // ---- V14 · THE TUNNEL'S AUTHORED LAYERS ----
          if (act === 2 && lift > 0.08) {
            const pb2 = ((step16 / 16) | 0) % 4;
            // the fifth answers the root once the build warms — the ostinato walks
            if (build > 0.35 && (st === 6 || st === 14)) {
              const f5 = H.chordTone(2, -1);
              schedTone(bassBus, f5, tt, 0.08 + build * 0.05, 0.2, 'sawtooth');
              MOut.evNote('bass', f5, 0.12, tt, 0.2);
            }
            // the lead motif arrives mid-build: four urgent notes opening every phrase
            if (build > 0.5 && pb2 === 0 && st === 0) {
              [0, 2, 4, 5].forEach((deg, pi) => {
                const f = H.chordTone(deg, 1);
                const t2 = tt + pi * T.beat * 0.5;
                schedTone(leadBus, f, t2, 0.05 + build * 0.03, T.beat * 0.55, 'square');
                MOut.evNote('lead', f, 0.14, t2, T.beat * 0.5);
              });
            }
            // snare roll through the last bar of every phrase — the turn is felt
            if (build > 0.55 && pb2 === 3 && st >= 12) {
              const k2 = (st - 12) / 4;
              A.hit({ vol: 0.045 + k2 * 0.085 * build, dur: 0.09, freq: 1900, q: 0.9, at: tt });
              if (st === 15) MOut.evDrum(38, 0.3, tt);
            }
            // the riser: one slow climbing tone per phrase at the top of the build
            if (build > 0.8 && pb2 === 0 && st === 0) {
              const oR = A.ctx.createOscillator(); oR.type = 'sine';
              oR.frequency.setValueAtTime(H.rootFreq(1), tt);
              oR.frequency.exponentialRampToValueAtTime(H.rootFreq(1) * 3, tt + T.beat * 16);
              const gR = A.ctx.createGain();
              gR.gain.setValueAtTime(0.0001, tt);
              gR.gain.linearRampToValueAtTime(0.045, tt + T.beat * 8);
              gR.gain.exponentialRampToValueAtTime(0.0001, tt + T.beat * 16);
              oR.connect(gR); gR.connect(leadBus); oR.start(tt); oR.stop(tt + T.beat * 16.2);
            }
          }
          // chord stabs NEVER on the 1 — Daft Punk funk lands just after it:
          // the and-of-1, a push into beat 3, and the a-of-3 driving into 4
          if (act >= 1 && closeR > 0.15 && (st === 2 || st === 7 || st === 11)) {
            const sv = ((st === 2 ? 0.085 : 0.06) + closeR * 0.04) * (0.6 + sideR2 * 0.6) * (0.6 + rw[2] * 0.7);
            const dur2 = 0.13;
            for (const ct of [0, 2, 4]) {
              const f2 = H.chordTone(ct, 0);
              schedTone(arpBus, f2, tt, sv * 0.5, dur2, 'sawtooth');
            }
            MOut.evNote('pad', H.chordTone(0, 0), sv, tt, dur2);
          }
          // lean hard LEFT: the orange country answers with bells.
          // lean hard RIGHT: the purple country swells a low pad.
          if (sideL2 > 0.5 && st % 4 === 2) { // sides answer in EVERY act
            const fb = H.chordTone([0, 2, 4, 5][(step16 / 4 | 0) % 4], 1);
            MOut.evNote('bells', fb, 0.1 + sideL2 * 0.06, tt, 0.4);
            schedTone(arpBus, fb, tt, 0.038 + sideL2 * 0.03, 0.55, 'sine');
          }
          if (sideR2 > 0.5 && st === 8) {
            const fp = H.chordTone(2, 0);
            MOut.evNote('pad', fp, 0.1 + sideR2 * 0.08, tt, 1.4);
            schedTone(bassBus, fp, tt, 0.05 + sideR2 * 0.04, 1.6, 'triangle');
          }
          // the mourner — a sparse, sad minor lead that sings over the cave and the sunset
          if ((act === 0 || act === 3) && lift > 0.18 && st === 0 && (step16 / 16 | 0) % 2 === 1) {
            const phrase = [[4, 2, 1], [5, 4, 2], [2, 1, 0], [4, 3, 1]][(step16 / 32 | 0) % 4];
            phrase.forEach((deg, pi) => {
              const f3 = H.chordTone(deg, 1);
              const t3 = tt + pi * T.beat * 1.33;
              schedTone(leadBus, f3, t3, 0.05 + lift * 0.03, T.beat * 1.35, 'triangle');
              MOut.evNote('lead', f3, 0.13, t3, T.beat * 1.2);
            });
          }
          // bass: cave = long dark roots; elsewhere driving 8ths
          if (act === 0) {
            // percussive sub-BOOMS — pitch-dropping 808 hits on a syncopated
            // heartbeat, punchy enough to actually hear. Low tom rides along on
            // the kit so the cave hits in Ableton too.
            if (lift > 0.06 && (st === 0 || st === 7 || (st === 10 && lift > 0.4))) {
              const bf = H.rootFreq(-2);
              const bv = st === 0 ? 0.34 : 0.22;
              const o = A.ctx.createOscillator(); o.type = 'sine';
              o.frequency.setValueAtTime(bf * 3.2, tt);
              o.frequency.exponentialRampToValueAtTime(Math.max(20, bf * 0.9), tt + 0.3);
              const gg = A.ctx.createGain();
              gg.gain.setValueAtTime(0.0001, tt);
              gg.gain.linearRampToValueAtTime(bv, tt + 0.012);
              gg.gain.exponentialRampToValueAtTime(0.0001, tt + 0.85);
              o.connect(gg); gg.connect(bassBus); o.start(tt); o.stop(tt + 0.95);
              MOut.evNote('bass', bf, bv, tt, 0.5);
              MOut.evDrum(43, bv * 0.7, tt);
            }
            // ethereal chords — slow-breathing detuned triads drifting into the
            // reverb, two bars apart, floating over the booms
            if (st === 0 && (step16 / 16 | 0) % 2 === 0 && lift > 0.1) {
              for (const ct of [0, 2, 4]) {
                const f2 = H.chordTone(ct, 0);
                const o2 = A.ctx.createOscillator(); o2.type = 'triangle';
                o2.frequency.value = f2 * (ct === 2 ? 1.003 : 1);
                const g4 = A.ctx.createGain();
                g4.gain.setValueAtTime(0.0001, tt);
                g4.gain.linearRampToValueAtTime(0.05 + lift * 0.03, tt + 1.2);
                g4.gain.exponentialRampToValueAtTime(0.0001, tt + 4.2);
                o2.connect(g4); g4.connect(arpBus); o2.start(tt); o2.stop(tt + 4.4);
                MOut.evNote('pad', f2, 0.12, tt, 3.8);
              }
            }
          } else if (lift > 0.06 && st % 2 === 0) {
            const oct = st % 4 === 0 ? -2 : -1;
            const bf = H.rootFreq(oct);
            const bv = st % 2 === 0 ? 0.15 : 0.1;
            MOut.evNote('bass', bf, bv, tt, 0.22);
            schedTone(bassBus, bf, tt, bv, 0.22, 'sawtooth');
          } else if (act >= 1 && lift > 0.3 && (st === 3 || st === 11)) {
            // ghost notes — quiet 16th pickups that make the bass line walk
            const bf = H.rootFreq(-1);
            MOut.evNote('bass', bf, 0.05, tt, 0.09);
            schedTone(bassBus, bf, tt, 0.05, 0.09, 'sawtooth');
          }
          // arp: cave sparse minor bells → city 8ths → tunnel 16ths → sunset warm 8ths
          const arpStep = act === 0 ? 4 : act === 2 ? (build > 0.45 ? 1 : 2) : 2; // 16ths are the REWARD of the build
          if (closeL > 0.04 && st % arpStep === 0) {
            const pat = [0, 3, 2, 4, 1, 3, 2, 5][(step16 / arpStep | 0) % 8];
            const f = H.chordTone(pat, act === 2 && closeL > 0.6 ? 1 : 0);
            const vol2 = (act === 0 ? 0.045 : 0.05 + closeL * 0.03) * (0.6 + sideL2 * 0.6) * (0.6 + rw[0] * 0.7);
            MOut.evNote('arp', f, vol2, tt, act === 0 ? 0.5 : 0.16);
            schedTone(arpBus, f, tt, vol2, act === 0 ? 0.6 : 0.17, act === 0 ? 'triangle' : 'square');
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < AE.t()) nextT = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
