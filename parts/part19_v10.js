/* ---------- SRC-18.10 · NIGHT CIRCUIT V10 (the real 3D arrives) ---------- */
reg({
  id: 'SRC-18.10', family: 'SRC-18', ver: 10,
  title: 'Night Circuit V10', tech: 'WEBGL / HERO ASSETS / TWO CAMERAS',
  music: { bpm: 78, root: 45, mode: 'aeolian', prog: [0, 5, 3, 6], chordBars: 4 },
  fx: {},
  acts: ['CAVERN', 'DISTRICT', 'TUNNEL', 'SUNSET'],
  setAct(P, i) {
    const s = P.state;
    if (!s || s.noGL || i === s.act || i === s.pending) return;
    s.pending = i; s.actT = 0;
  },
  tags: ['CAVE CITY TUNNEL SUNSET', 'ACT-AWARE MUSIC', 'TRUE 3D', 'DRUMS EARN THEIR ENTRANCE'],
  desc: 'The journey, in four acts on one endless road: it begins in a crystal cavern — dark, dripping-slow, mushrooms glowing at the walls, no drums, just a low minor pulse. You escape into the neon district: rain on the highway, lit towers, the striped sun behind the skyline, the beat arriving. Then the tunnel — walls close, light rings strobing past, double-time hats, the crescendo. And then out: palm silhouettes against a huge low sun, half-time, big and warm. Smoke-a-cig vibes. Then the road finds another cave mouth and the cycle turns again.',
  interact: 'Hands as ever: sides, steering, throttle. The journey only advances while someone rides — at rest it waits in the cavern, visible and silent. Throttle drives speed, reach, and how hard each act plays; the acts themselves change every ~40 seconds of riding, and the music arranges itself to the world: cave = beatless, city = groove, tunnel = full kit double-time, sunset = half-time weight.',
  sound: 'V5 has its own engine now — 84 BPM aeolian minor, voiced darker: sub-heavy bass, sparse minor arps that thicken by act, kick/clap gated by BOTH presence and act intensity, hats double-time only in the tunnel. Same rig roles and channels; bed/SFX lanes unchanged.',
  init(P) {
    P.state = {
      speed: 6, steer: 0, lane: 0, pres: 0, bob: 0, asleep: true,
      act: 0, actT: 0, trans: 0, pending: null, curveA: 0, curvePh: 0, tunPh: 0,
      kickPulse: 0, arpFlash: 0, arpIdx: 0, lastEvP: 0
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
    // lights: dim ambience + a REAL headlight that reveals the world
    const hemi = new THREE.HemisphereLight(0x4a3a6a, 0x030208, 0.3); sc.add(hemi); T3.hemi = hemi;
    const head = new THREE.PointLight(0xcfeaff, 2.4, 55, 1.7);
    head.position.set(0, 1.6, -18); sc.add(head); T3.head = head;
    const world = new THREE.Group(); sc.add(world); T3.world = world;
    const B = (c, o) => new THREE.MeshBasicMaterial(Object.assign({ color: c }, o));
    const L2 = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o));
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
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 340), pair[1]);
      edge.position.set(pair[0], 0.015, -150); roadStr.add(edge); T3.strEdges.push(edge);
    }
    // the WINDING road — a chain of segments that follows a traveling curve in
    // the open acts; the straight strip serves the enclosed ones
    const curveG = new THREE.Group(); world.add(curveG); T3.curveG = curveG; T3.segs = [];
    {
      const segQuad = new THREE.PlaneGeometry(9, 8.8);
      const segEdgeG = new THREE.BoxGeometry(0.14, 0.03, 8.8);
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
    const dashG = new THREE.BoxGeometry(0.16, 0.02, 1.7), dashM = B(0x59e6b8);
    dashM.toneMapped = false; emL.toneMapped = false; emR.toneMapped = false;
    T3.dashMat = dashM;
    for (let i = 0; i < 36; i++) {
      const d = new THREE.Mesh(dashG, dashM);
      d.position.set(0, 0.012, -i * 8 - 2);
      world.add(d); T3.dashes.push(d);
    }
    const mkTex = (drawFn, s2 = 256) => { const c = document.createElement('canvas'); c.width = c.height = s2; drawFn(c.getContext('2d'), s2); return new THREE.CanvasTexture(c); };
    // headlight pool sprite
    const poolT = mkTex((g) => { const gr = g.createRadialGradient(128, 128, 8, 128, 128, 126); gr.addColorStop(0, 'rgba(205,240,255,0.7)'); gr.addColorStop(1, 'rgba(205,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 16), new THREE.MeshBasicMaterial({ map: poolT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.02, -22); world.add(pool); T3.pool = pool;
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
        const rock = new THREE.Mesh(tube, new THREE.MeshLambertMaterial({ color: 0x0d081e, side: THREE.BackSide, flatShading: true }));
        grp.add(rock);
        // glowing wireframe edges over the rock — the vibe layer
        const wire = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x5a3fce, wireframe: true, transparent: true, opacity: 0.07, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
        grp.add(wire); grp.userData.wireMat = wire.material;
        grp.rotation.x = Math.PI / 2; grp.position.set(0, 3.2, zoff);
        caveG.add(grp); return grp;
      };
      T3.caveTubes = [mkCaveTube(-100), mkCaveTube(-340)];
      // crystal formations: tapered cones — thick at the root, narrowing to a
      // point — in the warm orange family, smaller and glowier
      T3.crystals = [];
      const cryG = new THREE.ConeGeometry(0.34, 1.6, 5);
      for (let i = 0; i < 30; i++) {
        const side = i % 2 ? 1 : -1;
        const col = [0xff7a2c, 0xff9440, 0xff4d1c][i % 3];
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
        m.toneMapped = false; // raw saturated orange — no ACES wash
        const g2 = new THREE.Group();
        const n2 = 3 + (rnd() * 4 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(cryG, m);
          const sc2 = 0.35 + rnd() * 0.8;
          cr.scale.set(sc2, sc2 * (1.2 + rnd() * 1.2), sc2);
          cr.position.set((rnd() - 0.5) * 1.7, sc2 * 0.8, (rnd() - 0.5) * 1.5);
          cr.rotation.z = -side * (0.15 + rnd() * 0.4); // lean off the wall, over the road
          cr.rotation.y = rnd() * 6.28;
          g2.add(cr);
        }
        const halo = mkGlow(0xff4d14, 1.1 + rnd() * 0.6); halo.position.y = 0.8; g2.add(halo);
        // wet-ground pool — a squashed echo of the glow at the crystal's feet
        const refl = mkGlow(0xff4d14, 1.4); refl.scale.set(1.6, 0.45, 1);
        refl.material.opacity = 0.09; refl.position.y = 0.05; g2.add(refl);
        g2.position.set(side * (5.4 + rnd() * 2.0), 0, -(i * 22 + rnd() * 9) - 6);
        caveG.add(g2);
        T3.crystals.push({ g: g2, m, halo, side, base: 0.85 });
      }
      // stalactites — proper tapered forms: thick where they meet the ceiling,
      // narrowing to a drip point. Warm orange, with the rare magenta intruder.
      T3.stals = [];
      const stalG = new THREE.ConeGeometry(0.32, 2.2, 5);
      for (let i = 0; i < 34; i++) {
        const col = i % 5 === 4 ? 0xff2d6a : (i % 2 ? 0xff7a2c : 0xff9440);
        const m = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.8 });
        m.toneMapped = false;
        const g2 = new THREE.Group();
        const n2 = 2 + (rnd() * 3 | 0);
        for (let c2 = 0; c2 < n2; c2++) {
          const cr = new THREE.Mesh(stalG, m);
          const sc2 = 0.22 + rnd() * 0.5;
          cr.scale.set(sc2, sc2 * (0.9 + rnd() * 0.9), sc2);
          cr.rotation.x = Math.PI; // point down
          cr.rotation.z = (rnd() - 0.5) * 0.2;
          cr.position.set((rnd() - 0.5) * 2.2, -sc2 * 1.1, (rnd() - 0.5) * 1.8);
          g2.add(cr);
        }
        const halo = mkGlow(col === 0xff2d6a ? 0xff1450 : 0xff4d14, 0.85 + rnd() * 0.5); halo.position.y = -0.8; g2.add(halo);
        const sx = (rnd() - 0.5) * 10;
        g2.position.set(sx, 8.6 - Math.abs(sx) * 0.28, -(i * 20 + rnd() * 11) - 10);
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
          const capMat = new THREE.MeshLambertMaterial({ color: 0x0f2018, emissive: glow, emissiveIntensity: 0.5, flatShading: true });
          capMat.toneMapped = false; // raw green — no wash
          const cap = new THREE.Mesh(capG, capMat);
          stem.scale.setScalar(sc2); cap.scale.setScalar(sc2);
          const ox = (rnd() - 0.5) * 2.2, oz = (rnd() - 0.5) * 2.0;
          stem.position.set(ox, 0.27 * sc2, oz);
          cap.position.set(ox, 0.55 * sc2, oz);
          g2.add(stem); g2.add(cap);
          const hg = mkGlow(glow, 0.7 * sc2); hg.material.opacity = 0.38;
          hg.position.set(ox, 0.6 * sc2, oz); g2.add(hg);
        }
        g2.position.set(side * (5 + rnd() * 1.8), 0, -(i * 23 + rnd() * 11) - 12);
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
      tunG.add(tun);
      const tunWire = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: 0x1e4a6a, wireframe: true, transparent: true, opacity: 0.05, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }));
      tunWire.rotation.x = Math.PI / 2; tunWire.position.set(0, 2.4, -150);
      tunG.add(tunWire);
      T3.rings = [];
      const ringG = new THREE.TorusGeometry(4.4, 0.1, 6, 8); // octagonal light rings
      for (let i = 0; i < 26; i++) {
        const m = B(i % 4 === 3 ? 0xff2d6a : 0x49c8f2, { transparent: true, opacity: 0.9 });
        m.toneMapped = false;
        const ring = new THREE.Mesh(ringG, m);
        ring.rotation.z = Math.PI / 8;
        ring.position.set(0, 2.4, -i * 14 - 4);
        tunG.add(ring); T3.rings.push({ ring, m });
      }
      // wall panels — magenta service lights
      const panG = new THREE.BoxGeometry(0.7, 0.3, 0.06);
      T3.pans = [];
      for (let i = 0; i < 20; i++) {
        const side = i % 2 ? 1 : -1;
        const pan = new THREE.Mesh(panG, B(0xff2d6a));
        pan.position.set(side * 4.3, 1.4, -i * 17 - 9);
        pan.rotation.y = side * Math.PI / 2;
        tunG.add(pan); T3.pans.push(pan);
      }
      // floor seams — magenta guides running the deck
      for (const sx of [-3.4, 3.4]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 360),
          new THREE.MeshBasicMaterial({ color: 0xff2d6a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
        strip.position.set(sx, 0.02, -150); tunG.add(strip);
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
        const g3 = new THREE.PlaneGeometry(90, 240, 10, 24);
        const tp = g3.attributes.position;
        for (let i = 0; i < tp.count; i++) {
          const x = tp.getX(i), y = tp.getY(i);
          const inner = sideX > 0 ? x + 45 : 45 - x; // 0 at the road side, 90 far out
          const n = Math.sin(x * 0.21 + y * 0.13) + Math.sin(x * 0.06 - y * 0.17) * 0.8;
          tp.setZ(i, Math.pow(Math.max(0, inner) / 90, 1.5) * (8 + n * 4));
        }
        g3.computeVertexNormals();
        const mesh = new THREE.Mesh(g3, new THREE.MeshLambertMaterial({ color: 0x140b26, flatShading: true }));
        const wire = new THREE.Mesh(g3, new THREE.MeshBasicMaterial({ color: 0x5a3fae, wireframe: true, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false }));
        const grp = new THREE.Group(); grp.add(mesh); grp.add(wire);
        grp.rotation.x = -Math.PI / 2;
        grp.position.set(sideX * 52, -0.04, zoff);
        terrG.add(grp); T3.terr.push(grp);
      };
      mkTerr(1, -100); mkTerr(1, -340); mkTerr(-1, -100); mkTerr(-1, -340);
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
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.6, 11, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.rotation.x = Math.PI / 2; cone.position.set(0, 0.9, -7.2); bike.add(cone);
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
    // machine light, per the reference: dim purple ambience, orange and red
    // machine lights — nothing white, nothing washed
    const under = mkGlow(0xff5a3c, 4.6); under.material.opacity = 0.3;
    under.position.set(0, 0.12, 0); bike.add(under); T3.under = under;
    const rim = new THREE.PointLight(0x6a4fd8, 0.55, 12, 1.6); // deep purple rim
    rim.position.set(0.8, 3.4, 3.2); bike.add(rim); T3.rim = rim;
    const cock = new THREE.PointLight(0xff5a3c, 0.9, 7, 1.5); // low orange machine-light
    cock.position.set(0, 2.2, -0.8); bike.add(cock); T3.cock = cock;
    const tailGlow = mkGlow(0xff2038, 2.6); tailGlow.position.set(0, 1.1, 1.9); bike.add(tailGlow);
    // wet-road streak — the tail light smearing down the asphalt behind us
    const streak = mkGlow(0xff2038, 3.2); streak.scale.set(1.1, 4.4, 1);
    streak.material.opacity = 0.09; streak.position.set(0, 0.04, 3.4);
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
          // lighter body + a whisper of self-glow so the machine reads in the dark
          m.traverse(o => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ color: 0x1c2438, emissive: 0x0a0e22, flatShading: true }); });
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
                if (mm.color) mm.color.setRGB(0.09, 0.07, 0.17); // near-black silhouettes
              });
            }
          });
          T3.palms.forEach(sp => sp.visible = false);
          T3.palmModels = [];
          for (let i = 0; i < 8; i++) {
            const cl = src2.clone();
            cl.scale.multiplyScalar(sc2 * (0.75 + ((i * 37) % 11) / 11 * 0.5));
            const side = i % 2 ? 1 : -1;
            cl.position.set(side * (17 + ((i * 13) % 5)), 0, -(i * 46) - 12); // clear of the road, finally
            cl.userData.bx = cl.position.x;
            cl.rotation.y = (i * 1.7) % 6.28;
            // glowing linework — a wireframe echo that brightens as the tree passes
            const wm = new THREE.MeshBasicMaterial({ color: 0xff9a6e, wireframe: true, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false });
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
        src3.traverse(o => { if (o.isMesh) parts.push(o); });
        T3.bldModels = [];
        for (let i = 0; i < 14; i++) {
          const src4 = parts[i % parts.length];
          const inner4 = src4.clone();
          inner4.applyMatrix4(src4.matrixWorld); // bake skyline placement, then recenter
          const w4 = new THREE.Group(); w4.add(inner4);
          fitIn(w4, 9 + ((i * 37) % 10));
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(w4);
          wrap.position.set(side * (9.5 + ((i * 13) % 5)), 0, -(i * 48 + ((i * 29) % 22)) - 14);
          wrap.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
          wrap.userData.bx = wrap.position.x;
          T3.cityG.add(wrap); T3.bldModels.push(wrap);
        }
      } catch (e) {} });
      // the cyberpunk car — parked at the curb, plus two oncoming in the far lane
      loader.load('models/cyber_car.glb', gl2 => { try {
        const car0 = new THREE.Group(); car0.add(gl2.scene);
        fitIn(car0, 4.6);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2038 }); tailMat.toneMapped = false;
        T3.cars.forEach((cg, i) => {
          while (cg.children.length) cg.remove(cg.children[0]);
          const cl = car0.clone();
          cl.rotation.y = i % 2 ? 0.05 : -0.05;
          cg.add(cl);
          const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.05), tailMat);
          tail.position.set(0, 0.75, 2.15); cg.add(tail);
        });
        T3.traffic = [];
        for (let i = 0; i < 2; i++) {
          const wrap = new THREE.Group();
          const mv = car0.clone(); mv.rotation.y = Math.PI; wrap.add(mv);
          const head2 = mkGlow(0xcfe8ff, 1.3); head2.position.set(0, 1, 2.4); head2.material.opacity = 0.45; wrap.add(head2);
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
        darken(r0, 0x160e28, 0x07030f);
        fitIn(r0, 4.4);
        T3.rocks = [];
        for (let i = 0; i < 14; i++) {
          const side = i % 2 ? 1 : -1;
          const wrap = new THREE.Group(); wrap.add(r0.clone());
          const hang = i % 3 === 2;
          const sc3 = 0.5 + ((i * 37) % 12) / 12 * 1.3;
          wrap.scale.setScalar(sc3);
          if (hang) { wrap.rotation.z = Math.PI; wrap.position.set(side * (4.5 + (i * 7) % 4), 9.2, -(i * 47 + (i * 23) % 20) - 16); }
          else wrap.position.set(side * (6.2 + (i * 7) % 3), 0, -(i * 47 + (i * 23) % 20) - 16);
          wrap.rotation.y = i * 1.3;
          T3.caveG.add(wrap); T3.rocks.push(wrap);
        }
      } catch (e) {} });
      // the leviathan — a slow whale crossing the sunset sky, swim cycle at quarter speed
      loader.load('models/whale.glb', gl2 => { try {
        const w0 = gl2.scene;
        darken(w0, 0x100b20, 0x05030c);
        const wrap = new THREE.Group(); wrap.add(w0);
        fitIn(wrap, 26);
        wrap.position.set(-60, 19, -230);
        wrap.rotation.y = Math.PI / 2;
        T3.sunsetG.add(wrap); T3.whale = wrap;
        if (gl2.animations && gl2.animations.length) {
          const mx = new THREE.AnimationMixer(w0);
          mx.clipAction(gl2.animations[0]).play();
          mx.timeScale = 0.35;
          T3.mixers.push(mx);
        }
      } catch (e) {} });
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
    // push-together = intensity: CLOSENESS to the source drives the ride,
    // gated by presence so the resting wall stays silent. Steering unchanged.
    const thr = clamp((1 - (inp.L + inp.R) / 2) * s.pres);
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
      if (s.trans >= 1) { s.act = s.pending; s.pending = null; }
    } else {
      s.trans = Math.max(0, s.trans - dt * 0.5);
    }
    const tunnel = s.act === 2;
    const spdMax = tunnel ? 46 : s.act === 3 ? 26 : 34;
    s.speed += ((5 + Math.pow(thr, 1.25) * spdMax) - s.speed) * Math.min(1, dt * 1.4);
    const steerIn = clamp(inp.R - inp.L, -1, 1);
    s.steer += (steerIn - s.steer) * Math.min(1, dt * 1.6);
    s.lane += (s.steer * (tunnel ? 1.6 : 2.6) - s.lane) * Math.min(1, dt * 1.4);
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
    // act visibilities
    T3.caveG.visible = act === 0; T3.cityG.visible = act === 1;
    T3.tunG.visible = act === 2; T3.sunsetG.visible = act === 3;
    T3.stars.visible = act !== 2 && act !== 0;
    T3.ridge.visible = act === 1 || act === 3;
    T3.terrG.visible = act === 1 || act === 3;
    if (T3.terrG.visible) for (const tg of T3.terr) { tg.position.z += dz; if (tg.position.z > 140) tg.position.z -= 480; }
    // winding-road math — amplitude eases in for the open acts, phase travels with the ride
    const curveTarget = act === 1 ? 7 : act === 3 ? 9 : 0;
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
    // scroll + recycle
    for (const d of T3.dashes) { d.position.z += dz; if (d.position.z > 2) d.position.z -= 288; d.position.x = cxF(d.position.z); }
    const recyc = (obj, span) => { obj.position.z += dz; if (obj.position.z > 4) obj.position.z -= span; };
    if (act === 0) {
      // the rock itself streams past — two tube segments leapfrogging
      for (const tb of T3.caveTubes) {
        tb.position.z += dz;
        if (tb.position.z > 140) tb.position.z -= 480;
        tb.userData.wireMat.opacity = 0.1 + s.kickPulse * 0.14 + s.arpFlash * 0.08 + thr * 0.05; // the surface finally reads
      }
      for (const c of T3.crystals) {
        recyc(c.g, 680);
        // YOUR side answers YOUR hand — push toward the source to light it up
        const hand = clamp((c.side < 0 ? 1 - inp.L : 1 - inp.R) * s.pres);
        c.m.opacity = 0.35 + hand * 0.5 + s.arpFlash * 0.2;
        c.halo.material.opacity = 0.12 + hand * 0.3 + s.arpFlash * 0.12 + s.kickPulse * 0.18;
      }
      for (const m2 of T3.monos) recyc(m2, 680);
      for (const st2 of T3.stals) {
        recyc(st2.g, 680);
        st2.m.opacity = 0.5 + s.arpFlash * 0.3 + thr * 0.15;
        st2.halo.material.opacity = 0.08 + s.arpFlash * 0.14 + s.kickPulse * 0.22 + thr * 0.08;
      }
      for (const m of T3.shrooms) recyc(m, 690);
      if (T3.rocks) for (const r3 of T3.rocks) recyc(r3, 680);
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
      if (T3.bldModels) for (const b2 of T3.bldModels) { recyc(b2, 700); b2.position.x = b2.userData.bx + cxF(b2.position.z); }
      if (T3.signs) for (const sg2 of T3.signs) { recyc(sg2, 540); sg2.position.x = sg2.userData.bx + cxF(sg2.position.z); }
      if (T3.traffic) for (const tr of T3.traffic) {
        tr.position.z += dz + dt * 16; // oncoming — closing speed
        if (tr.position.z > 8) tr.position.z -= 400;
        tr.position.x = -2.3 + cxF(tr.position.z);
        tr.rotation.y = Math.PI + Math.atan(slopeF(tr.position.z));
      }
      const rp = T3.rain.geometry.attributes.position;
      for (let i = 0; i < rp.count; i++) {
        let y = rp.getY(i) - dt * 26, z = rp.getZ(i) + dz;
        if (y < 0) y = 28; if (z > 2) z -= 120;
        rp.setY(i, y); rp.setZ(i, z);
      }
      rp.needsUpdate = true;
    } else if (act === 2) {
      for (const r2 of T3.rings) {
        recyc(r2.ring, 364);
        r2.m.opacity = 0.55 + s.kickPulse * 0.45;
      }
      for (const p2 of T3.pans) recyc(p2, 340);
    } else {
      for (const p2 of (T3.palmModels || T3.palms)) {
        recyc(p2, T3.palmModels ? 380 : 430);
        if (p2.userData.bx !== undefined) p2.position.x = p2.userData.bx + cxF(p2.position.z);
        if (p2.userData.wireMat) p2.userData.wireMat.opacity = 0.04 + Math.max(0, 1 - Math.abs(p2.position.z + 40) / 110) * 0.26;
      }
      if (T3.whale) {
        T3.whale.position.x += dt * 1.6;
        if (T3.whale.position.x > 90) T3.whale.position.x = -90;
        T3.whale.rotation.y = Math.PI / 2 + Math.sin(t * 0.1) * 0.08;
        T3.whale.position.y = 19 + Math.sin(t * 0.17) * 1.4;
      }
    }
    // the tunnel dives and climbs — a gradual vertical sweep
    if (act === 2) {
      s.tunPh += dz * 0.016;
      T3.world.position.y = Math.sin(s.tunPh) * 1.15;
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
    T3.hemi.intensity = [0.04, 0.18, 0.2, 0.3][act]; // dark base everywhere — light is a spend
    T3.scene.fog.density = fogA - thr * 0.003 + s.trans * 0.05;
    const fogCol = [0x0a0418, 0x0a0714, 0x060a16, 0x140a18][act];
    T3.scene.fog.color.setHex(fogCol);
    T3.scene.background.setHex([0x050112, 0x020107, 0x02040a, 0x0a0410][act]);
    T3.renderer.toneMappingExposure = (0.68 + E * 0.5 + s.kickPulse * 0.05) * [0.8, 0.9, 1.0, 1.12][act] * (1 - s.trans * 0.45);
    // road accents per act
    const edgeCol = [0x6a5aa8, 0x2ec8da, 0x49c8f2, 0xff9a6b][act];
    for (const em of T3.edgeMats) em.color.setHex(edgeCol);
    T3.ground.material.color.setHex([0x050310, 0x05060e, 0x04060c, 0x0d0713][act]);
    T3.under.material.opacity = 0.2 + s.kickPulse * 0.25 + thr * 0.12;
    T3.pool.material.opacity = 0.4 + s.kickPulse * 0.35 + thr * 0.2 + (act === 1 ? 0.15 : 0);
    T3.pool.position.x = cxF(-22);
    if (T3.bloom) T3.bloom.strength = [0.6, 0.75, 0.8, 0.7][act] + s.kickPulse * 0.12;
    // headlight strongest in cave/tunnel where it has walls to reveal
    T3.head.intensity = (act === 0 || act === 2) ? 3.4 : 1.5;
    T3.rim.intensity = act === 0 ? 0.25 : 0.55; // purple rim stays a whisper
    T3.head.color.setHex([0xffb066, 0xcfeaff, 0x9fd8ff, 0xffc890][act]); // warm orange throw in the cave, like the rendering
    T3.pool.material.color.setHex([0xffa870, 0xcdf0ff, 0xbfe4ff, 0xffc290][act]);
    T3.head.position.set(-s.lane, 1.6, -20);
    // steering / lean / camera
    T3.world.rotation.y = s.steer * 0.105;
    T3.world.position.x = -s.lane;
    T3.bike.rotation.z = -s.steer * 0.34 - slopeF(-10) * 2.2; // bank into the road's own bend too
    T3.rider.rotation.z = -s.steer * 0.16;
    T3.bike.position.y = T3.world.position.y + Math.sin(s.bob * 2.1) * 0.02 * (s.speed / 40); // ride the road's rise and fall — no more floating
    // TWO CAMERAS: wide third-person while the wall rests — showing the machine
    // waiting in the world — diving to first-person over the tail when hands engage
    const camK = s.pres * s.pres * (3 - 2 * s.pres);
    T3.cam.rotation.z = s.steer * 0.04 * camK;
    T3.cam.rotation.y = 0.06 * camK;
    T3.cam.rotation.x = (-0.3 + 0.19 * camK) + (act === 2 ? Math.cos(s.tunPh) * 0.035 : 0);
    T3.cam.position.x = (1.05 + s.steer * 0.35) * camK;
    T3.cam.position.y = (6.0 - 3.3 * camK) + Math.sin(s.bob) * 0.015 * (s.speed / 40) + T3.world.position.y * 0.4;
    T3.cam.fov = 58 + (tunnel ? thr * 8 : 0);
    T3.cam.updateProjectionMatrix();
    T3.tailL.scale.setScalar(1 + s.kickPulse * 0.8);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#05040c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('NIGHT CIRCUIT V10 · THE JOURNEY', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL + CDN)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three;
    if (T3.comp) T3.comp.render(); else T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ACTS = ['THE CAVERN', 'NEON DISTRICT', 'THE TUNNEL', 'PALM SUNSET'];
    g.fillStyle = 'rgba(150,200,220,0.75)'; g.font = `${Math.round(10 * Math.max(1, Math.sqrt(areaScale(P))))}px ui-monospace,monospace`;
    g.fillText(ACTS[P.state.act] + ' · ' + Math.round(s.speed * 6) + ' KM/H · [1-4] SKIP ACT' + (s.pres < 0.3 ? ' · WAITING IN THE DARK' : ''), 10, h - 10);
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
        const lift = clamp((closeL + closeR) / 2);
        const act = s.act || 0;
        const inten = [0.12, 0.55, 1.0, 0.4][act] * (0.25 + lift * 0.75);
        A.set(surf.frequency, 260 + Math.pow(lift, 1.4) * (act === 2 ? 7500 : 5200), 0.2);
        MOut.expr('arp', closeL); MOut.expr('bass', lift); MOut.expr('pad', closeR);
        const horizon = AE.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const tt = nextT;
          // drums: silent in the cave, groove in the city, full double-time in the tunnel,
          // heavy half-time at the sunset
          if (act >= 1 && lift > 0.1) {
            const kickPat = act === 3 ? (st === 0 || st === 10) : (st % 4 === 0);
            if (kickPat && inten > 0.25) A.kick(tt, 0.3);
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
            const hatEvery = act === 2 ? 1 : 2;
            if (st % hatEvery === (hatEvery === 1 ? 0 : 1) && inten > 0.3) A.hat(tt, { vol: 0.022 + lift * 0.028, open: act === 2 && st === 14 });
            // open hat breathing on the offbeat 8ths — the disco lung
            if (act === 1 && st % 4 === 2 && inten > 0.4) A.hat(tt, { vol: 0.03 + lift * 0.02, open: true });
          }
          // chord stabs NEVER on the 1 — Daft Punk funk lands just after it:
          // the and-of-1, a push into beat 3, and the a-of-3 driving into 4
          if (act >= 1 && closeR > 0.15 && (st === 2 || st === 7 || st === 11)) {
            const sv = (st === 2 ? 0.085 : 0.06) + closeR * 0.04;
            const dur2 = 0.13;
            for (const ct of [0, 2, 4]) {
              const f2 = H.chordTone(ct, 0);
              schedTone(arpBus, f2, tt, sv * 0.5, dur2, 'sawtooth');
            }
            MOut.evNote('pad', H.chordTone(0, 0), sv, tt, dur2);
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
          const arpStep = act === 0 ? 4 : act === 2 ? 1 : 2;
          if (closeL > 0.04 && st % arpStep === 0) {
            const pat = [0, 3, 2, 4, 1, 3, 2, 5][(step16 / arpStep | 0) % 8];
            const f = H.chordTone(pat, act === 2 && closeL > 0.6 ? 1 : 0);
            const vol2 = (act === 0 ? 0.045 : 0.05 + closeL * 0.03);
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
