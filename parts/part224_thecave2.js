/* ---------- SRC-50.2 · THE CAVE V2 (no stripes, more life, the rock shows its facets)
   Lance's verdict on V1, three calls: "remove the road stripes, add more
   of those plants and sea life, and then accentuate the lines of the
   polygonal cave so it gets picked up a bit more."
   1. THE STRIPES ARE GONE — the ember dashes read as highway; the floor is
      just the dim earthen path now.
   2. MORE LIFE: mushroom groves 30 → 48 colonies, fan corals 9 → 18,
      stalked jellies 7 → 11, lantern jellies 2 → 3 — with the REAL-light
      budget held (grove lights every 10th colony instead of every 8th, so
      the count stays ~5; three lantern lights).
   3. THE FACETS READ: the cave tubes' violet wireframe lifted ~2.5x (base
      0.05 → 0.05-0.115 with the glow) and the rock's emissive floor raised
      a shade, so the polygonal cave is picked up on the mesh instead of
      hovering at the threshold of visibility.
   Everything else exactly V1. (V1 notes below.) ------------------------- */
/* ---------- SRC-50.1 · THE CAVE V1 (the room travels through itself)
   Lance's DJ-set / opening-ceremony round. The brief, verbatim: "I want to
   create one scene for our opening ceremony which is just the cave part of
   the motorcycle ride one without the motorcycle either. Just slowly go
   through the cave." The camp's venue is THE CAVE — this scene is the room
   itself, processing through its own body at walking pace, built to be
   beautiful with NOBODY at the pedestal (a ceremony runs unattended).

   KEPT from Night Circuit V17 (SRC-18.17, untouched — this is a copy-and-
   prune, not an edit): the entire ACT 0 CAVERN world — leapfrogging cave
   tubes, crystal/mushroom/jelly colonies with their real lights, rock
   stalactites and GLB stalagmites, gems, corals, the gliding manta, drips —
   plus the renderer/bloom scaffolding, the first-person camera path, and
   the road as a dim earthen floor.

   REMOVED: acts 1-3 entirely (NEON DISTRICT / TUNNEL / PALM SUNSET — no
   geometry, no transitions; acts = ['CAVERN'], s.act pinned 0), everything
   motorcycle (bike, rider, headlight beams, speed-from-presence, curbs,
   the V17 road-line ignite/flash layer), and the band (arps/stabs/drums/
   hats). Speed is CONSTANT and slow — about a fifth of the ride's cruise.

   THE INSTRUMENT (hands optional, both): lean = a gentle lateral drift and
   camera bank, heavily smoothed; reach toward the source = THE CAVE
   BREATHES BRIGHTER — colony glow, grove lights and bloom swell gently.
   The light is the room's own, never a headlight. audioIn: a slow-eased
   au.level swells the same glow (Math.max blend with the hand), and the
   engine kick (back-dated, counter seeded on first sight — the part217/
   Cell Front idiom) sends a soft brightness ripple down the colonies and
   the drip field. Nothing may flash; exposure never moves on a beat.
   Sound is sparse and processional: a sub drone, bar-heartbeat sub booms,
   breathing detuned chords, slow bells, the mourner lead only when the
   glow is earned. Quiet at rest, but never silent — that IS the ceremony
   state. No drums at all. ---------------------------------------------- */
reg({
  id: 'SRC-50.2', family: 'SRC-50', ver: 2,
  title: 'The Cave V2', tech: 'NIGHT CIRCUIT CAVERN / PROCESSION',
  audioIn: true,
  music: { bpm: 60, root: 45, mode: 'aeolian', prog: [0, 5, 3, 6], chordBars: 4 },
  fx: {},
  acts: ['CAVERN'],
  setAct() {}, // one act — the procession has nowhere else to go
  tags: ['PROCESSION', 'THE ROOM ITSELF', 'UNATTENDED FIRST', 'LISTENS'],
  desc: 'V2, on Lance’s three verdicts: the road stripes are gone (the floor is just the dim earthen path), the garden thickened — 48 mushroom colonies, twice the coral, eleven stalked jellies, a third lantern — and the cave’s polygonal facets read now (the violet wireframe lifted so the rock’s lines are picked up). The opening-ceremony scene: Night Circuit’s cavern with the motorcycle taken out of it. The room travels through its own body at walking pace — crystal colonies in orange country left and violet country right, mushroom groves casting real green light, stalked jellies swaying, drips falling through the dark, the manta gliding down the passage every few minutes — forever, on a seamless loop. It is built to be beautiful with nobody at the pedestal: at rest it breathes slowly and sounds quietly, and that is the primary state. Hands are an invitation, not a requirement: lean and the procession drifts a few degrees toward that wall; reach toward the source and the cave itself breathes brighter — every colony, every grove light, the bloom — the light is the room’s, not yours. Give it a live feed and the music does the same: the level swells the same glow, and each real kick sends a soft ripple of brightness down the nearest colonies.',
  interact: 'Both hands optional — the ceremony runs handless. LEAN (either hand toward its side) = a gentle lateral drift and camera bank, heavily smoothed, a few degrees at most. REACH toward the source with both hands = the cave breathes brighter: colony glow, grove lights and bloom swell together. With a live audio feed (SHOW CHECK → AUDIO IN), the track’s level swells that same breath and the kick ripples brightness down the drip field and the colonies — subtle, never a flash. Speed never changes: this is a procession, not a ride.',
  sound: 'Sparse and processional, 60 BPM aeolian on Night Circuit’s progression. A continuous sub drone under everything; a soft pitch-dropping sub boom once a bar — the heartbeat; detuned triangle chords breathing in and out every two bars; a single slow bell every other bar walking the chord ladder; the mourner lead (Night Circuit’s cave melody) only when the glow is earned by hands or a live feed. Quiet at rest but never silent — the idle sound IS the ceremony. No drums, no hats, no arps. MIDI mirrors on bass / pad / bells / lead; CC74 carries the breath.',
  init(P) {
    P.state = {
      pres: 0, glowHand: 0, glow: 0, drift: 0, speed: 8, depth: 0, bob: 0,
      act: 0, evtT: 0,
      aPres: 0, aLevel: 0, ripple: 0, ripZ: 10, _aSeeded: false, _kN: 0, LEAD: 0.030
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
    sc.background = new THREE.Color(0x0c0620);
    sc.fog = new THREE.FogExp2(0x170c30, 0.028); // the cave veil carries luminance, not just black
    T3.scene = sc;
    const cam = new THREE.PerspectiveCamera(66, P.w / P.h, 0.1, 600);
    cam.position.set(0, 2.0, -10.2);
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
    // LIGHT IS THE ROOM'S: no headlights, no beams. A dim hemisphere, the
    // colonies' own point lights, and one soft bioluminescent fill drifting
    // with the procession so the rock facets never go fully void.
    const hemi = new THREE.HemisphereLight(0x4a3a6a, 0x030208, 0.09); sc.add(hemi); T3.hemi = hemi;
    const room = new THREE.PointLight(0x7fb0c8, 0.35, 34, 1.7);
    room.position.set(0, 2.2, -18); sc.add(room); T3.roomLight = room;
    // the side washes stay, gentled — leaning toward a wall lets its country
    // answer in its own color (orange left / violet right, the side law)
    const sideLightL = new THREE.PointLight(0xff7a2c, 0, 30, 1.5);
    sideLightL.position.set(-7.5, 2.6, -14); sc.add(sideLightL); T3.sideLightL = sideLightL;
    const sideLightR = new THREE.PointLight(0xc45cff, 0, 30, 1.5);
    sideLightR.position.set(7.5, 2.6, -14); sc.add(sideLightR); T3.sideLightR = sideLightR;
    const world = new THREE.Group(); sc.add(world); T3.world = world;
    const B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
    const L2 = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
    // seeded rand
    let seed = 7654321; const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    // detail gate: tiles and phones carry a lighter cave than the show frame
    const det = window.IS_MOBILE ? 0.5 : Math.min(1, Math.max(0.55, areaScale(P) / 4.56));
    const N = n => Math.max(2, Math.round(n * det));
    // ---- the floor: a dim earthen path (no curb, no edge lines) ----
    const roadStr = new THREE.Group(); world.add(roadStr); T3.roadStr = roadStr;
    const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 340), L2(0x0a0c14));
    road.rotation.x = -Math.PI / 2; road.position.z = -150; roadStr.add(road);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 900), L2(0x05060d));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.06, -250); world.add(ground);
    T3.ground = ground;
    // V2: the ember dashes are GONE (Lance: "remove the road stripes" —
    // they read as highway). The floor is the dim earthen path alone.
    const mkTex = (drawFn, s2 = 256) => { const c = document.createElement('canvas'); c.width = c.height = s2; drawFn(c.getContext('2d'), s2); return new THREE.CanvasTexture(c); };
    // ---- THE CAVERN (Night Circuit's ACT 0, whole) ----
    const caveG = new THREE.Group(); world.add(caveG); T3.caveG = caveG;
    const glowT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 6, 128, 128, 126); gr.addColorStop(0, 'rgba(255,255,255,0.85)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }); // 256 canvas — center must match, else halos render as corner-lit squares
    const mkGlow = (col, sc2) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5 })); sp.scale.set(sc2, sc2, 1); return sp; };
    T3.mkGlow = mkGlow;
    {
      // the cave surface rides with the path — two leapfrogging low-poly tube
      // segments so the rock visibly streams past instead of sitting still
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
        // V2: emissive floor a shade up so the facets never fully sink
        const rock = new THREE.Mesh(tube, new THREE.MeshLambertMaterial({ color: 0x171030, emissive: 0x0a0522, side: THREE.BackSide, flatShading: true })); // faceted violet mass, not void
        grp.add(rock);
        // V2: the wireframe lifted ~2.5x (Lance: "accentuate the lines of
        // the polygonal cave") — still additive, still breathing with glow
        const wire = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x7a55ff, wireframe: true, transparent: true, opacity: 0.05, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        grp.add(wire); grp.userData.wireMat = wire.material;
        grp.rotation.x = Math.PI / 2; grp.position.set(0, 3.2, zoff);
        caveG.add(grp); return grp;
      };
      T3.caveTubes = [mkCaveTube(-100), mkCaveTube(-340)];
      // crystal formations — orange country left, purple country right
      T3.crystals = [];
      const cryG = new THREE.ConeGeometry(0.34, 1.6, 5);
      const nCry = N(16);
      for (let i = 0; i < nCry; i++) {
        const side = rnd() < 0.5 ? -1 : 1;
        const col = side > 0 ? [0x9a5cff, 0xc45cff, 0x7a3fe8][i % 3] : [0xff7a2c, 0xff9440, 0xff4d1c][i % 3];
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
        m.toneMapped = false; // raw saturated color — no ACES wash
        const g2 = new THREE.Group();
        const hero = i % 4 === 0;
        const gscale = hero ? 2.1 + rnd() * 1.3 : 0.8 + rnd() * 0.6;
        const n2 = (hero ? 4 : 3) + (rnd() * 4 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(cryG, m);
          const sc2 = 0.35 + rnd() * 0.8;
          cr.scale.set(sc2, sc2 * (1.2 + rnd() * 1.4), sc2);
          cr.position.set((rnd() - 0.5) * 1.9, sc2 * 0.8, (rnd() - 0.5) * 1.7);
          cr.rotation.z = -side * (0.15 + rnd() * 0.4);
          cr.rotation.y = rnd() * 6.28;
          g2.add(cr);
        }
        g2.scale.setScalar(gscale);
        const hcol = side > 0 ? 0x8a3fff : 0xff4d14;
        const halo = mkGlow(hcol, 1.1 + rnd() * 0.6); halo.position.y = 0.8; g2.add(halo);
        const refl = mkGlow(hcol, 1.4); refl.scale.set(1.6, 0.45, 1);
        refl.material.opacity = 0.09; refl.position.y = 0.05; g2.add(refl);
        g2.position.set(side * (5.0 + rnd() * 3.0), 0, -(30 + rnd() * 600));
        caveG.add(g2);
        T3.crystals.push({ g: g2, m, halo, side, base: 0.85 });
      }
      // stalactites — dark rock teeth, revealed only by the room's light
      T3.stals = [];
      const stalG = new THREE.ConeGeometry(0.32, 2.2, 5);
      const stalMat = new THREE.MeshLambertMaterial({ color: 0x1a1236, emissive: 0x0a0620, flatShading: true });
      const nStal = N(18);
      for (let i = 0; i < nStal; i++) {
        const sxSide = i % 2 ? 1 : -1;
        const g2 = new THREE.Group();
        const n2 = 2 + (rnd() * 4 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(stalG, stalMat);
          const sc2 = 0.24 + rnd() * 0.7;
          cr.scale.set(sc2, sc2 * (0.9 + rnd() * 1.3), sc2);
          cr.rotation.x = Math.PI;
          cr.rotation.z = (rnd() - 0.5) * 0.25;
          cr.position.set((rnd() - 0.5) * 2.6, -sc2 * 1.1, (rnd() - 0.5) * 2.2);
          g2.add(cr);
        }
        const sx = sxSide * (1 + rnd() * 4.5);
        g2.position.set(sx, 10.7 - Math.abs(sx) * 0.35, -(120 + rnd() * 520));
        caveG.add(g2);
        T3.stals.push({ g: g2 });
      }
      // hero monoliths — landmark crystal formations on the walls
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
      // glowing mushrooms — colonies of green light at the walls, with REAL
      // lights every few colonies so the grove actually illuminates
      T3.shrooms = []; T3.groveLights = [];
      const stemG = new THREE.CylinderGeometry(0.06, 0.11, 0.55, 5);
      const capG = new THREE.SphereGeometry(0.34, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
      const nShroom = N(48);   // V2: more of the grove (Lance)
      for (let i = 0; i < nShroom; i++) {
        const side = rnd() < 0.5 ? -1 : 1;
        const g2 = new THREE.Group();
        const n2 = 5 + (rnd() * 8 | 0);
        const glow = rnd() < 0.5 ? 0x2fe89a : 0x52ffb0;
        for (let c2 = 0; c2 < n2; c2++) {
          const sc2 = 0.32 + rnd() * 0.55;
          const stem = new THREE.Mesh(stemG, L2(0x1e2a24));
          const capMat = new THREE.MeshLambertMaterial({ color: 0x0f2018, emissive: glow, emissiveIntensity: 0.95, flatShading: true });
          capMat.toneMapped = false;
          const cap = new THREE.Mesh(capG, capMat);
          stem.scale.setScalar(sc2); cap.scale.setScalar(sc2);
          const ox = (rnd() - 0.5) * 2.2, oz = (rnd() - 0.5) * 2.0;
          stem.position.set(ox, 0.27 * sc2, oz);
          cap.position.set(ox, 0.55 * sc2, oz);
          g2.add(stem); g2.add(cap);
          const hg = mkGlow(glow, 1.0 * sc2); hg.material.opacity = 0.5;
          hg.position.set(ox, 0.6 * sc2, oz); g2.add(hg);
        }
        if (i % 10 === 0) {   // V2: every 10th — colony count grew, light budget holds
          const gl3 = new THREE.PointLight(0x2fe89a, 0.85, 7, 1.8);
          gl3.position.y = 0.7; g2.add(gl3);
          T3.groveLights.push(gl3);
        }
        g2.position.set(side * (5 + rnd() * 1.8), 0, -(12 + i * 4.4 + rnd() * 5));   // V2: tighter spacing — 48 colonies over the same span
        g2.userData.side = side;
        caveG.add(g2);
        T3.shrooms.push(g2);
      }
      // drips — thin falling streaks from the ceiling
      const dn = N(42), dpos = new Float32Array(dn * 3), dvel = new Float32Array(dn);
      for (let i = 0; i < dn; i++) {
        dpos[i * 3] = (rnd() - 0.5) * 12;
        dpos[i * 3 + 1] = 1 + rnd() * 8;
        dpos[i * 3 + 2] = -rnd() * 120;
        dvel[i] = 5 + rnd() * 5;
      }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
      const drips = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xbfe0ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0.5 }));
      caveG.add(drips); T3.drips = drips; T3.dripVel = dvel;
    }
    // ---- HERO ASSETS — the cave's own life only (no bike, no city, no horizon) ----
    // WALL TILES SKIP THE GLB LIFE (perf hotfix, Sep 1): these loads — six
    // models, the skinned jellies once per instance — fired at BOOT for the
    // ambient tile in BOTH electron windows, each parsing megabytes of
    // base64 data-URI, and the app took minutes to open. The tile shows the
    // procedural cave (tubes, crystals, groves, drips); the full menagerie
    // loads when the scene is opened big. Same gate the detail budget uses.
    if (areaScale(P) > 1.6 && typeof THREE.GLTFLoader === 'function') {
      const loader = new THREE.GLTFLoader();
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
      // real rock — stalagmites on the floor, some flipped to hang
      loader.load('models/stalagmite.glb', gl2 => { try {
        const r0 = new THREE.Group(); r0.add(gl2.scene);
        darken(r0, 0x241838, 0x0c0618);
        fitIn(r0, 4.4);
        T3.rocks = [];
        for (let i = 0; i < 24; i++) {
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(r0.clone());
          const hang = i % 3 === 2;
          const sc3 = 0.8 + ((i * 37) % 12) / 12 * 1.8;
          wrap.scale.setScalar(sc3);
          if (hang) { wrap.rotation.z = Math.PI; wrap.position.set(side * (4.5 + (i * 7) % 4), 11.3, -(i * 28 + (i * 23) % 14) - 16); }
          else wrap.position.set(side * (6.2 + (i * 7) % 3), -0.38 * sc3, -(i * 28 + (i * 23) % 14) - 16);
          wrap.rotation.y = i * 1.3;
          T3.caveG.add(wrap); T3.rocks.push(wrap);
        }
        const big = new THREE.Group(); big.add(r0.clone());
        big.scale.setScalar(4.6);
        big.position.set(-8.6, -1.6, -350);
        T3.caveG.add(big); T3.rocks.push(big);
      } catch (e) {} });
      // handpainted gems — sided by color, plus two colossi
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
        for (let i = 0; i < 18; i++) mkGem(i, 1.5 + ((i * 31) % 10) / 10 * 3.0, (i * 7) % 5 < 2 ? 1 : -1, -(40 + ((i * 97) % 620)));
        mkGem(1, 12, -1, -300); // the orange colossus
        mkGem(2, 10, 1, -520);  // the purple one
      } catch (e) {} });
      // fan coral colonies — nearly black until light finds them
      loader.load('models/coral.glb', gl2 => { try {
        const c0 = new THREE.Group(); c0.add(gl2.scene);
        c0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.multiplyScalar(0.8);
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(c0, 3.4);
        T3.corals = [];
        for (let i = 0; i < 18; i++) {   // V2: twice the coral (Lance)
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(c0.clone());
          const sc9 = 0.7 + ((i * 29) % 10) / 10 * 1.5;
          wrap.scale.setScalar(sc9);
          const halo = mkGlow(side > 0 ? 0xc45cff : 0xff5a6a, 1.6); halo.position.y = 0.9; halo.material.opacity = 0.07; wrap.add(halo);
          wrap.userData.halo = halo; wrap.userData.side = side;
          const zone = [-40, -150, -260, -390, -520, -600][i % 6];   // V2: six zones — coral all down the passage
          wrap.position.set(side * (5.6 + (i * 7) % 3), 0, zone - (i * 11) % 34);
          wrap.rotation.y = i * 2.4;
          T3.caveG.add(wrap); T3.corals.push(wrap);
        }
      } catch (e) {} });
      // stalked jellyfish — two groves plus strays, a garden that is alive
      // (skinned → one load per instance; the file caches after the first fetch)
      T3.jellyS = [];
      [
        { x: -6.4, z: -70, sc: 3.0, tilt: 0.1 }, { x: -7.6, z: -95, sc: 5.6, tilt: -0.14 }, { x: -5.0, z: -120, sc: 2.2, tilt: 0.2 },
        { x: 6.6, z: -300, sc: 4.0, tilt: -0.1 }, { x: 7.8, z: -330, sc: 6.4, tilt: 0.16 }, { x: 5.4, z: -355, sc: 2.6, tilt: -0.22 },
        { x: -6.9, z: -520, sc: 4.6, tilt: 0.12 },
        // V2: a third grove + strays — the garden thickens (Lance)
        { x: 6.2, z: -170, sc: 3.4, tilt: 0.18 }, { x: -7.2, z: -230, sc: 5.0, tilt: -0.12 },
        { x: 7.0, z: -450, sc: 3.8, tilt: 0.14 }, { x: -5.8, z: -590, sc: 5.8, tilt: -0.18 }
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
          wrap.rotation.set(cfg.tilt, ji * 1.3, cfg.tilt * 0.6);
          wrap.userData.cfg = cfg;
          T3.caveG.add(wrap); T3.jellyS.push(wrap);
          if (gl2.animations && gl2.animations.length) {
            const mx = new THREE.AnimationMixer(gl2.scene);
            mx.clipAction(gl2.animations[0]).play(); mx.timeScale = 0.4 + (ji % 3) * 0.12;
            T3.mixers.push(mx);
          }
        } catch (e) {} });
      });
      // blue jellyfish — drifting lanterns overhead, each carrying a REAL light
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
        [{ x: -3.4, y: 6.4, z: -120 }, { x: 3.8, y: 7.6, z: -400 }, { x: -2.6, y: 7.0, z: -260 }].forEach((cfg, i) => {   // V2: a third lantern
          const wrap = new THREE.Group(); wrap.add(j0.clone());
          const gl3 = new THREE.PointLight(0x3fb8e8, 0.9, 13, 1.7);
          gl3.position.y = -1.2; wrap.add(gl3); wrap.userData.light = gl3;
          const halo = mkGlow(0x49c8f2, 3.4); halo.material.opacity = 0.1; wrap.add(halo);
          wrap.userData.halo = halo;
          wrap.position.set(cfg.x, cfg.y, cfg.z); wrap.userData.cfg = cfg;
          T3.caveG.add(wrap); T3.jellyB.push(wrap);
        });
      } catch (e) {} });
      // the manta — glides down the passage along the path every few minutes
      loader.load('models/manta.glb', gl2 => { try {
        const m0 = new THREE.Group(); m0.add(gl2.scene);
        m0.traverse(o => { if (o.isMesh && o.material) {
          o.material = o.material.clone();
          if (o.material.color) o.material.color.setRGB(0.36, 0.29, 0.56);
          if (o.material.emissive) o.material.emissive.setHex(0x4a2f8a);
          if ('emissiveIntensity' in o.material) o.material.emissiveIntensity = 0.9;
          if ('envMapIntensity' in o.material) o.material.envMapIntensity = 0;
        } });
        fitIn(m0, 18);
        const mgl = new THREE.PointLight(0x7a54ff, 0.9, 14, 1.6);
        mgl.position.y = -1.5; m0.add(mgl); // a violet underlight — the creature reveals the rock it passes
        const mhalo = mkGlow(0x8a5cff, 11); mhalo.material.opacity = 0.1; m0.add(mhalo);
        m0.rotation.x = 0.12;
        const wrap = new THREE.Group(); wrap.add(m0); // animate the wrap; m0 keeps its centering
        wrap.position.set(0, 40, -30); // parked out of sight above until its cue
        T3.caveG.add(wrap); T3.mantaCave = wrap;
        if (gl2.animations && gl2.animations.length) {
          const mx = new THREE.AnimationMixer(gl2.scene);
          mx.clipAction(gl2.animations[0]).play(); mx.timeScale = 0.7;
          T3.mixers.push(mx);
        }
      } catch (e) {} });
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.2);
    // HANDS (both optional): reach toward the source = the cave breathes
    // brighter. Closeness = 1 - inp (the V17/WS10 idiom); eased, never a cliff.
    const reachIn = clamp((1 - (inp.L + inp.R) / 2) * s.pres);
    s.glowHand += (reachIn - s.glowHand) * Math.min(1, dt * 2.5);
    // lean = a gentle lateral drift + bank, heavily smoothed (dt*2), a few
    // degrees at most. It never changes speed.
    const dIn = clamp(inp.R - inp.L, -1, 1) * s.pres;
    s.drift += (dIn - s.drift) * Math.min(1, dt * 2);
    // ---- THE LISTENING LAYER (arbitrated on inp.audio.live) ----
    const au = inp.audio;
    const aLive = au && au.live ? 1 : 0;
    s.aPres += (aLive - s.aPres) * Math.min(1, dt * 2.2);
    if (au) {
      // slow-eased level (1.2/s) — the feed swells the same breath the hands do
      s.aLevel += (clamp(au.level) * s.aPres - s.aLevel) * Math.min(1, dt * 1.2);
      // seed the kick counter on first sight — no phantom ripple on open
      if (!s._aSeeded) { s._aSeeded = true; s._kN = au.kick ? au.kick.n : 0; }
      // the kick: n CHANGING is the hit (never truthiness), back-dated by its
      // true age so the frame is right for the vsync it lands on (part217 idiom)
      if (au.kick && au.kick.n !== s._kN) {
        s._kN = au.kick.n;
        const age = au.kick.perfClock ? 0 : clamp(au.now - au.kick.t, 0, 0.2);
        const hit = clamp(0.55 + 0.45 * clamp(au.kick.strength)) * s.aPres;
        const adv = Math.exp(-1.8 * (age + s.LEAD));
        if (hit * adv > s.ripple) { s.ripple = hit * adv; s.ripZ = -6 - (age + s.LEAD) * 100; }
      }
    } else { s.aLevel *= Math.pow(0.5, dt); }
    s.ripple -= s.ripple * Math.min(1, dt * 1.8);
    s.ripZ -= dt * 100; // the ripple front travels away down the passage
    // one breath, two sources: hands and the room's music raise the same glow
    const glow = Math.max(s.glowHand, s.aLevel);
    s.glow = glow;
    if (s.noGL || !P._three) return;
    const T3 = P._three;
    if (T3.mixers) for (const mx of T3.mixers) mx.update(dt);
    // CONSTANT, SLOW — a procession, ~20% of Night Circuit's cruise. Presence
    // never touches it; the loop is seamless (the tubes leapfrog forever).
    s.speed += (8 - s.speed) * Math.min(1, dt * 0.8);
    const dz = s.speed * dt;
    s.depth += dz;
    s.bob += dt;
    s.evtT += dt; // the manta's clock runs even with nobody there — the ceremony is unattended
    // a soft brightness ripple near the traveling front (kick-fed, positional)
    const rip = z => s.ripple * Math.exp(-Math.pow((z - s.ripZ) / 20, 2));
    // side washes — gentle, smoothed by drift's own ease; the countries answer
    const sideL = clamp(-s.drift, 0, 1), sideR = clamp(s.drift, 0, 1);
    T3.sideLightL.intensity = sideL * 0.9;
    T3.sideLightR.intensity = sideR * 0.9;
    // the rock streams past — two tube segments leapfrogging
    for (const tb of T3.caveTubes) {
      tb.position.z += dz;
      if (tb.position.z > 140) tb.position.z -= 480;
      tb.userData.wireMat.opacity = 0.05 + glow * 0.065; // V2: the facets read; still no flash
    }
    const recyc = (obj, span) => { obj.position.z += dz; if (obj.position.z > 4) obj.position.z -= span; };
    for (const c of T3.crystals) {
      recyc(c.g, 680);
      const r2 = rip(c.g.position.z);
      c.m.opacity = 0.42 + glow * 0.4 + r2 * 0.22;
      c.halo.material.opacity = 0.1 + glow * 0.32 + r2 * 0.2;
    }
    for (const m2 of T3.monos) recyc(m2, 680);
    for (const st2 of T3.stals) recyc(st2.g, 680);
    for (const m of T3.shrooms) {
      recyc(m, 690);
      const sc4 = 1 + glow * 0.14 + rip(m.position.z) * 0.16; // the grove breathes, gently
      m.scale.set(sc4, sc4, sc4);
    }
    if (T3.groveLights) for (const gl3 of T3.groveLights) gl3.intensity = 0.5 + glow * 0.9 + s.ripple * 0.3;
    if (T3.rocks) for (const r3 of T3.rocks) recyc(r3, 680);
    if (T3.gems) for (const gm of T3.gems) {
      recyc(gm, 680);
      gm.userData.halo.material.opacity = 0.08 + glow * 0.3 + rip(gm.position.z) * 0.18;
    }
    if (T3.corals) for (const co of T3.corals) {
      recyc(co, 680);
      co.userData.halo.material.opacity = 0.04 + glow * 0.2 + rip(co.position.z) * 0.12;
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
      // the lantern breathes with the room, not with a beat
      j.userData.light.intensity = 0.55 + glow * 0.6 + rip(j.position.z) * 0.4;
      j.userData.halo.material.opacity = 0.06 + glow * 0.1 + rip(j.position.z) * 0.08;
    }
    // the manta's cue: every ~40s it glides down the passage along the path —
    // rising out of the road ahead, banking overhead, gone into the dark behind
    if (T3.mantaCave) {
      const ph = (s.evtT % 40) / 13;
      if (ph < 1) {
        T3.mantaCave.visible = true;
        T3.mantaCave.position.z = -150 + ph * 176;
        T3.mantaCave.position.x = Math.sin(ph * Math.PI) * 3.4;
        T3.mantaCave.position.y = 3.4 + ph * 3.0 + Math.sin(ph * Math.PI) * 1.6;
        T3.mantaCave.rotation.y = Math.PI + Math.sin(ph * 5) * 0.16;
        T3.mantaCave.rotation.z = Math.sin(t * 1.3) * 0.14;
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
    T3.drips.material.opacity = 0.45 + glow * 0.2 + s.ripple * 0.22;
    // atmosphere: the veil opens a little as the room breathes — SLOW terms
    // only. The kick never reaches exposure, fog or bloom (no frame flash).
    T3.scene.fog.density = 0.028 - glow * 0.006;
    T3.hemi.intensity = 0.07 + glow * 0.15;
    T3.roomLight.intensity = 0.3 + glow * 0.85;
    T3.roomLight.position.set(-s.drift * 1.2, 2.2, -18);
    T3.renderer.toneMappingExposure = 0.72 + glow * 0.34;
    if (T3.bloom) T3.bloom.strength = 0.55 + glow * 0.28;
    // the procession's path: lean drifts the world a step toward that wall
    T3.world.position.x = -s.drift * 1.6;
    T3.world.rotation.y = s.drift * 0.035;
    // FIRST-PERSON, unhurried: a slow breathing bob, a few degrees of bank
    const bob = Math.sin(s.bob * 0.4) * 0.06;
    T3.cam.position.set(s.drift * 0.5, 2.0 + bob, -10.2);
    T3.cam.up.set(0, 1, 0);
    T3.cam.lookAt(s.drift * 7, 1.35 + bob * 0.5, -92);
    T3.cam.rotation.z += -s.drift * 0.06; // the bank — ~3.5 degrees at full lean
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('THE CAVE V1 · THE PROCESSION', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    if (T3.comp) T3.comp.render(); else T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const aud = (inp.audio && inp.audio.live) ? ' · AUD ' + Math.round(clamp(inp.audio.level) * 100) : '';
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * Math.max(1, Math.sqrt(areaScale(P))))}px ui-monospace,monospace`;
    g.fillText('THE CAVERN · ' + Math.round(s.depth) + ' M · GLOW ' + Math.round(s.glow * 100) + '%' + aud, 10, h - 10);
  },
  audio(A, P) {
    // sparse and processional — the cave layers of Night Circuit's engine,
    // gated for a ceremony: quiet at rest, swelling with the room's breath.
    const v = A.voice();
    const surf = v.filter('lowpass', 900, 0.9);
    surf.connect(v.group);
    const mkBus = gain => { const gg = v.g(gain); gg.connect(surf); return gg; };
    const padBus = mkBus(1), bassBus = mkBus(1), leadBus = mkBus(1);
    if (A.revIn) { const s3 = A.ctx.createGain(); s3.gain.value = 0.5; padBus.connect(s3); s3.connect(A.revIn); }
    if (A.delIn) { const s4 = A.ctx.createGain(); s4.gain.value = 0.55; leadBus.connect(s4); s4.connect(A.delIn); }
    if (A.revIn) { const s5 = A.ctx.createGain(); s5.gain.value = 0.6; leadBus.connect(s5); s5.connect(A.revIn); }
    // THE SUB DRONE — continuous, re-glided to the chord every tick. This is
    // the floor the whole ceremony stands on; it never fully goes away.
    const droneO = A.ctx.createOscillator(); droneO.type = 'sine';
    droneO.frequency.value = H.rootFreq(-2);
    const droneG = A.ctx.createGain(); droneG.gain.value = 0.0001;
    droneO.connect(droneG); droneG.connect(bassBus); droneO.start();
    let nextT = T.next(0.25), step16 = 0;
    const schedTone = (bus, freq, t0, vol, dur, type) => {
      const o = A.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const gg = A.ctx.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.linearRampToValueAtTime(vol, t0 + 0.04);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg); gg.connect(bus);
      o.start(t0); o.stop(t0 + dur + 0.05);
    };
    v.fadeIn(1, 1.5);
    return {
      tick(inp) {
        const s = P.state;
        const glow = s.glow || 0;
        // the drone breathes with the glow and follows the harmony
        A.set(droneO.frequency, H.rootFreq(-2), 0.6);
        A.set(droneG.gain, 0.028 + glow * 0.05, 0.5);
        // the veil opens as the room breathes
        A.set(surf.frequency, 320 + Math.pow(glow, 1.3) * 1500, 0.3);
        MOut.expr('bass', clamp(0.3 + glow * 0.7));
        MOut.expr('pad', glow);
        MOut.expr('lead', clamp(glow * 1.2));
        const horizon = AE.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          const bar = (step16 / 16) | 0;
          // the heartbeat: one soft pitch-dropping sub boom a bar — audible at
          // rest (this IS the ceremony state), fuller as the glow rises
          if (st === 0) {
            const bf = H.rootFreq(-2);
            const bv = 0.10 + glow * 0.14;
            const o = A.ctx.createOscillator(); o.type = 'sine';
            o.frequency.setValueAtTime(bf * 2.2, tt);
            o.frequency.exponentialRampToValueAtTime(Math.max(20, bf * 0.9), tt + 0.4);
            const gg = A.ctx.createGain();
            gg.gain.setValueAtTime(0.0001, tt);
            gg.gain.linearRampToValueAtTime(bv, tt + 0.03);
            gg.gain.exponentialRampToValueAtTime(0.0001, tt + 1.4);
            o.connect(gg); gg.connect(bassBus); o.start(tt); o.stop(tt + 1.5);
            MOut.evNote('bass', bf, bv, tt, 0.9);
          }
          // breathing chords — slow detuned triads drifting into the reverb,
          // two bars apart, floating over the drone. The slow breaths.
          if (st === 0 && bar % 2 === 0) {
            for (const ct of [0, 2, 4]) {
              const f2 = H.chordTone(ct, 0);
              const o2 = A.ctx.createOscillator(); o2.type = 'triangle';
              o2.frequency.value = f2 * (ct === 2 ? 1.003 : 1);
              const g4 = A.ctx.createGain();
              g4.gain.setValueAtTime(0.0001, tt);
              g4.gain.linearRampToValueAtTime(0.032 + glow * 0.034, tt + 1.6);
              g4.gain.exponentialRampToValueAtTime(0.0001, tt + 5.2);
              o2.connect(g4); g4.connect(padBus); o2.start(tt); o2.stop(tt + 5.4);
              MOut.evNote('pad', f2, 0.10 + glow * 0.05, tt, 4.6);
            }
          }
          // a single slow bell on the back half of the odd bars, walking the
          // chord ladder — the procession's small punctuation
          if (st === 8 && bar % 2 === 1) {
            const fb = H.chordTone([0, 2, 4, 5][(bar >> 1) % 4], 1);
            schedTone(padBus, fb, tt, 0.026 + glow * 0.03, 2.4, 'sine');
            MOut.evNote('bells', fb, 0.09 + glow * 0.05, tt, 1.6);
          }
          // the mourner — Night Circuit's cave lead, EARNED: it only sings
          // when hands or a live feed have raised the glow
          if (glow > 0.22 && st === 0 && bar % 4 === 2) {
            const phrase = [[4, 2, 1], [5, 4, 2], [2, 1, 0], [4, 3, 1]][(bar >> 2) % 4];
            phrase.forEach((deg, pi) => {
              const f3 = H.chordTone(deg, 1);
              const t3 = tt + pi * T.beat * 1.33;
              schedTone(leadBus, f3, t3, 0.04 + glow * 0.03, T.beat * 1.35, 'triangle');
              MOut.evNote('lead', f3, 0.12, t3, T.beat * 1.2);
            });
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < AE.t()) nextT = T.next(0.25);
      },
      stop() { try { droneO.stop(); } catch (e) {} v.kill(); }
    };
  }
});
