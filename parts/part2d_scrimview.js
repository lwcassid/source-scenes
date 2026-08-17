/* ============================================================
   SCRIM VIEW — how the frame actually lands in The Cave
   ------------------------------------------------------------
   Part of the VIEW system (dropdown on the stage, or V to cycle):
     flat    — the plain 1920x1200 frame, one projector
     double  — same frame with the second projector's ghost overlaid
     scrim   — the throw on the drape wall, viewed head-on
     scrim3d — the whole room: C cycles AUDIENCE / OBLIQUE / OVERVIEW
   What the scrim modes model that the flat frame can't:
     · segmentation — cable-mounted fabric panels with air gaps slice
       every image; panels sway a little
     · layer offset — panels hang on cables at three depths
     · double image — the projectors register on the MIDDLE cable row;
       panels nearer/farther catch the two throws laterally separated.
       With the projectors ~22ft apart this separation is BIG — that's
       the real geometry, not a bug in the sim
     · gauze optics — each layer scatters ~half and passes the rest;
       light adds across layers; spill lands on the floor

   RIG GEOMETRY — derived from Elyse's Cave Layout 2026 (duxel = 8ft):
   interior ~3 duxels wide x 5 deep (24 x 40 ft), 1-story (8ft) duxel
   walls, fabric cables strung high (~16ft, off the tower line) with
   8-16ft drops, panel widths 18/27/54in. Projectors: on top of the
   duxels at the entrance's innermost corners — ~22ft apart, 8ft up,
   behind the user at the source. Still approximate: exact per-panel
   positions along each cable, and which row the projectors converge
   on. All numbers live in SCRIMRIG (feet) — edit and everything
   follows. Needs three.js; scrim modes are skipped on mobile.
   ============================================================ */
const SCRIMRIG = {
  // drape rows: fabric panels hang from cables spanning the interior
  layers: [                        // z: + toward the entrance/projectors
    { z: 6, stagger: 0.0 },
    { z: 0, stagger: 0.5 },     // middle row — projectors registered here
    { z: -6, stagger: 0.25 },
  ],
  wallW: 22,                       // lit span across the room
  stripW: 4.5, stripGap: 1.0,      // 54in "Full" panels + air gap
  ceilH: 16, drop: 16,             // cables high off the tower line, drop to floor
  // projectors — 2x PT-VMZ50 on top of the entrance-corner duxels
  projSep: 22, projH: 8, projZ: 19,
  throwRatio: 1.1,                 // wide end of the 1.09-1.77:1 zoom
  aimH: 8,                         // converged at drape-band center, middle row
  // gauze optics — scrim survey: mesh eats ~half the light
  scatter: 0.55, transmit: 0.6,
  // context + dusk mood (moodLight: 0 kills the mood entirely)
  sourceZ: 9, bgC: 0x05050a,
  structW: 24, structD: 40, wallH: 8,
  moodLight: 0.30,
};

window.SCRIMVIEW = {
  cam: 0,
  CAMS: [
    { n: 'AUDIENCE', pos: [0, 5.8, 16.5], look: [0, 8, -2] },
    { n: 'OBLIQUE', pos: [-17, 7, 13], look: [0, 8, 0] },
    { n: 'OVERVIEW', pos: [21, 11, 33], look: [0, 7, 0] },
  ],
  STRAIGHT: { n: 'HEAD-ON', pos: [0, 8, 18], look: [0, 8, 0], fov: 44 }, // inside, at the projector line
  _init(P) {
    const R = SCRIMRIG;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(P.w, P.h, false);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(R.bgC);
    this.scene.fog = new THREE.FogExp2(R.bgC, 0.004);
    this.camera = new THREE.PerspectiveCamera(50, P.w / P.h, 0.1, 400);
    this._bindTex(P);
    // two virtual projectors — matrices rebuilt each frame (cheap) so
    // SCRIMRIG and PROJ (frame preset) edits cascade live
    this.projCams = [new THREE.PerspectiveCamera(), new THREE.PerspectiveCamera()];
    this.mats = [new THREE.Matrix4(), new THREE.Matrix4()];

    const vert = `
      uniform float uTime, uPhase, uDrop;
      varying vec3 vWorld;
      void main() {
        // sway pinned at the cable, growing toward the free hem
        float k = clamp(0.5 - position.y / uDrop, 0.0, 1.0);
        vec3 p = position;
        p.x += sin(uTime * 0.7 + uPhase + position.y * 0.35) * 0.22 * k * k;
        p.z += sin(uTime * 0.53 + uPhase * 1.7) * 0.16 * k * k;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;
    // NOTE: no woven-mesh pattern — the real scrim is high fidelity
    // (tested); a fake weave just aliases into checkerboard moire.
    const frag = `
      uniform sampler2D uMap;
      uniform mat4 uPL, uPR;
      uniform float uGain;
      varying vec3 vWorld;
      vec3 throwFrom(mat4 m) {
        vec4 q = m * vec4(vWorld, 1.0);
        if (q.w <= 0.0) return vec3(0.0);
        vec2 uv = q.xy / q.w * 0.5 + 0.5;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec3(0.0);
        return texture2D(uMap, uv).rgb;
      }
      void main() {
        vec3 col = throwFrom(uPL) + throwFrom(uPR);       // light adds on gauze
        col = col * uGain + vec3(0.016, 0.012, 0.011);    // dusk-lit fabric
        gl_FragColor = vec4(col, 1.0);
      }`;

    this.strips = [];
    const pitch = R.stripW + R.stripGap;
    const n = Math.floor(R.wallW / pitch);
    R.layers.forEach((L, li) => {
      const gain = R.scatter * Math.pow(R.transmit, li); // deeper = pre-shadowed
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * pitch + L.stagger * pitch;
        const g = new THREE.PlaneGeometry(R.stripW, R.drop, 1, 8);
        const m = new THREE.ShaderMaterial({
          vertexShader: vert, fragmentShader: frag,
          uniforms: {
            uMap: { value: this.tex }, uPL: { value: this.mats[0] }, uPR: { value: this.mats[1] },
            uGain: { value: gain }, uTime: { value: 0 },
            uPhase: { value: (li * 37 + i * 2.39) % 6.28 }, uDrop: { value: R.drop },
          },
          blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        });
        const s = new THREE.Mesh(g, m);
        s.position.set(x, R.ceilH - R.drop / 2, L.z);
        this.scene.add(s); this.strips.push(s);
      }
    });

    // floor catches the throw's spill — grounds the wall like real dust
    this.floorMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vWorld;
        void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: frag.replace('vec3(0.016, 0.012, 0.011)', 'vec3(0.013, 0.010, 0.008)'),
      uniforms: { uMap: { value: this.tex }, uPL: { value: this.mats[0] }, uPR: { value: this.mats[1] }, uGain: { value: 0.10 } },
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), this.floorMat);
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);

    // the two projectors + frustum edges to the registered image rectangle
    const lineM = new THREE.LineBasicMaterial({ color: 0x2a2a38, transparent: true, opacity: 0.5 });
    const mid = R.layers[1].z;
    [-1, 1].forEach(side => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.1),
        new THREE.MeshBasicMaterial({ color: 0x23232b }));
      box.position.set(side * R.projSep / 2, R.projH + 0.3, R.projZ); this.scene.add(box);
      const o = box.position;
      const dist = Math.hypot(o.x, o.y - R.aimH, o.z - mid);
      const tw = dist / R.throwRatio, th = tw / (PROJ.w / PROJ.h);
      const pts = [];
      [[-1, -1], [-1, 1], [1, 1], [1, -1]].forEach(([cx, cy], i2, arr) => {
        const c = new THREE.Vector3(cx * tw / 2, R.aimH + cy * th / 2, mid);
        const c2v = arr[(i2 + 1) % 4],
          c2 = new THREE.Vector3(c2v[0] * tw / 2, R.aimH + c2v[1] * th / 2, mid);
        pts.push(o, c, c, c2);
      });
      this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineM));
    });

    // the source + a person for scale
    const src = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x8fb4c8 }));
    src.position.set(0, 3.6, R.sourceZ); this.scene.add(src);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.3, 8),
      new THREE.MeshBasicMaterial({ color: 0x1a1a20 }));
    ped.position.set(0, 1.65, R.sourceZ); this.scene.add(ped);
    const person = new THREE.Mesh(
      THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.45, 4.5, 3, 8) : new THREE.CylinderGeometry(0.45, 0.45, 5.4, 8),
      new THREE.MeshBasicMaterial({ color: 0x0d0d11 }));
    person.position.set(-6, 2.7, R.sourceZ + 2); this.scene.add(person);

    // ---- dusk mood: sky, duxel-frame pavilion, string lights
    if (R.moodLight > 0) {
      const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12),
        new THREE.ShaderMaterial({
          side: THREE.BackSide, depthWrite: false, fog: false,
          vertexShader: `varying vec3 vP; void main(){ vP = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `varying vec3 vP;
            void main(){
              float h = clamp(normalize(vP).y, -0.1, 1.0);
              vec3 zen = vec3(0.016, 0.018, 0.040);
              vec3 hor = vec3(0.085, 0.042, 0.055);        // dusty rose band
              vec3 c = mix(hor, zen, smoothstep(0.0, 0.45, h));
              if (h < 0.0) c = mix(hor, vec3(0.02,0.015,0.02), -h * 8.0);
              gl_FragColor = vec4(c, 1.0);
            }`,
        }));
      this.scene.add(sky);
      // duxel walls as posts + header beams (24 x 40 interior, 8ft high)
      const woodM = new THREE.MeshLambertMaterial({ color: 0x8a6544 });
      const hw = R.structW / 2, zf = R.structD / 2, zb = -R.structD / 2;
      const addBox = (w2, h2, d2, x, y, z) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), woodM);
        b.position.set(x, y, z); this.scene.add(b); return b;
      };
      [[-hw, zf], [hw, zf], [-hw, zb], [hw, zb],
       [-hw, 0], [hw, 0]].forEach(([x, z]) => addBox(0.6, R.wallH, 0.6, x, R.wallH / 2, z));
      addBox(R.structW + 0.6, 0.5, 0.6, 0, R.wallH + 0.25, zf);
      addBox(R.structW + 0.6, 0.5, 0.6, 0, R.wallH + 0.25, zb);
      [[-hw], [hw]].forEach(([x]) => addBox(0.6, 0.5, R.structD, x, R.wallH + 0.25, 0));
      // the 16ft tower line: masts flank the entrance opening (front + back),
      // carrying the cables the fabric hangs from
      [[-4, zf], [4, zf], [-4, zb], [4, zb]].forEach(([x, z]) => addBox(0.6, R.ceilH, 0.6, x, R.ceilH / 2, z));
      const cableM = new THREE.LineBasicMaterial({ color: 0x3a3a46, transparent: true, opacity: 0.7 });
      R.layers.forEach(L => {
        const pts = [new THREE.Vector3(-hw, R.ceilH, L.z), new THREE.Vector3(hw, R.ceilH, L.z)];
        this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), cableM));
      });
      // string lights sagging along the perimeter beams
      const bulbM = new THREE.MeshBasicMaterial({ color: 0xffb469 });
      const bulbG = new THREE.SphereGeometry(0.07, 6, 5);
      const stringAt = (ax, az, bx, bz) => {
        const len = Math.hypot(bx - ax, bz - az), nB = Math.max(8, Math.round(len / 0.9));
        for (let i = 0; i <= nB; i++) {
          const t2 = i / nB, sag = Math.sin(t2 * Math.PI) * 0.55;
          const b = new THREE.Mesh(bulbG, bulbM);
          b.position.set(ax + (bx - ax) * t2, R.wallH - 0.1 - sag, az + (bz - az) * t2);
          this.scene.add(b);
        }
      };
      stringAt(-hw, zf, hw, zf);
      stringAt(-hw, zf, -hw, zb); stringAt(hw, zf, hw, zb);
      this.scene.add(new THREE.AmbientLight(0x2a2233, 0.9));
      [[0, zf - 2], [-hw * 0.7, -8], [hw * 0.7, -8]].forEach(([x, z]) => {
        const pl = new THREE.PointLight(0xffa050, R.moodLight, 30);
        pl.position.set(x, R.wallH - 0.5, z); this.scene.add(pl);
      });
    }
  },
  _bindTex(P) {
    // the texture follows the FOCUSED scene — switching scenes swaps P.canvas
    if (this.tex && this.tex.image === P.canvas) return;
    if (this.tex) this.tex.dispose();
    this.tex = new THREE.CanvasTexture(P.canvas);
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
    if (this.strips) this.strips.forEach(s => { s.material.uniforms.uMap.value = this.tex; });
    if (this.floorMat) this.floorMat.uniforms.uMap.value = this.tex;
  },
  render(fg, P, t) {
    if (!this.renderer) { try { this._init(P); } catch (e) { console.error('scrimview', e); if (typeof setView === 'function') setView('flat'); return; } }
    this._bindTex(P);
    if (this.renderer.domElement.width !== P.w || this.renderer.domElement.height !== P.h) {
      this.renderer.setSize(P.w, P.h, false);
    }
    const R = SCRIMRIG, mid = R.layers[1].z;
    // rebuild the two throw matrices (registered on the middle cable row)
    [-1, 1].forEach((side, i) => {
      const pc = this.projCams[i];
      pc.position.set(side * R.projSep / 2, R.projH, R.projZ);
      const dist = Math.hypot(pc.position.x, pc.position.y - R.aimH, pc.position.z - mid);
      const tw = dist / R.throwRatio;
      pc.fov = 2 * Math.atan((tw / (PROJ.w / PROJ.h)) / 2 / dist) * 180 / Math.PI;
      pc.aspect = PROJ.w / PROJ.h; pc.near = 0.5; pc.far = 120;
      pc.lookAt(0, R.aimH, mid);
      pc.updateProjectionMatrix(); pc.updateMatrixWorld();
      this.mats[i].multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse);
    });
    const headOn = (typeof VIEW !== 'undefined' && VIEW.mode === 'scrim');
    const C = headOn ? this.STRAIGHT : this.CAMS[this.cam % this.CAMS.length];
    const drift = headOn ? 0 : Math.sin(t * 0.13) * 0.7;    // gentle parallax cue
    this.camera.fov = C.fov || 50;
    this.camera.aspect = P.w / P.h; this.camera.updateProjectionMatrix();
    this.camera.position.set(C.pos[0] + drift, C.pos[1], C.pos[2]);
    this.camera.lookAt(C.look[0], C.look[1], C.look[2]);
    this.tex.needsUpdate = true;
    this.strips.forEach(s => { s.material.uniforms.uTime.value = t; });
    this.renderer.render(this.scene, this.camera);
    fg.fillStyle = '#000'; fg.fillRect(0, 0, P.w, P.h);
    fg.drawImage(this.renderer.domElement, 0, 0);
    fg.fillStyle = 'rgba(200,210,225,0.55)';
    fg.font = '12px monospace'; fg.textAlign = 'left';
    fg.fillText('SCRIM · The Cave rig (duxel-derived, see SCRIMRIG) · ' + C.n +
      (headOn ? '' : ' · C camera') + ' · V or the VIEW menu to switch', 14, P.h - 14);
  },
};
// V cycles the view modes; C cycles cameras inside the 3D room view
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (typeof focus === 'undefined' || focus.idx < 0) return;
  const k = e.key.toLowerCase();
  if (k === 'v' && typeof setView === 'function') {
    const order = ['flat', 'double', 'scrim', 'scrim3d'];
    setView(order[(order.indexOf(VIEW.mode) + 1) % order.length]);
  }
  if (k === 'c' && typeof VIEW !== 'undefined' && VIEW.mode === 'scrim3d')
    SCRIMVIEW.cam = (SCRIMVIEW.cam + 1) % SCRIMVIEW.CAMS.length;
});
