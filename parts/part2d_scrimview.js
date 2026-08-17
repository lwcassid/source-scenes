/* ============================================================
   SCRIM VIEW — how the frame actually lands in The Cave
   ------------------------------------------------------------
   Part of the VIEW system (dropdown on the stage, or V to cycle):
     flat   — the plain 1920x1200 frame, one projector
     double — same frame with the second projector's ghost overlaid
     scrim  — the throw in The Cave in 3D, and YOU drive the camera:
              drag orbits, wheel zooms, C jumps between vantage
              presets (AUDIENCE / HEAD-ON / OBLIQUE / OVERVIEW).
              While orbiting, the mouse belongs to the camera — the
              hands still play from the keyboard (W/S and arrows).
   What the scrim mode models that the flat frame can't:
     · segmentation — cable-mounted fabric panels with air gaps slice
       every image; panels sway a little
     · layer offset — panels hang on cables at three depths, 6ft apart
     · double image — the projectors register on the MIDDLE cable row;
       panels nearer/farther catch the two throws laterally separated.
       With the lenses ~22ft apart that separation is BIG — that's the
       real geometry, not a bug in the sim
     · gauze optics — each layer scatters ~half and passes the rest;
       light adds across layers; spill lands on the floor

   RIG GEOMETRY — derived from Elyse's Cave Layout 2026 (duxel = 8ft):
   interior ~3 duxels wide x 5 deep (24 x 40 ft), 1-story (8ft) duxel
   walls, 16ft towers flanking the entrance; fabric cables strung high
   (~16ft) with 8-16ft drops, panel widths 18/27/54in. Projectors: on
   top of the duxels at the entrance's innermost corners — ~22ft
   apart, 8ft up, behind the user at the source. Still approximate:
   exact per-panel positions along each cable, and which row the
   projectors converge on. All numbers live in SCRIMRIG (feet) — edit
   and everything follows. Needs three.js; skipped on mobile.
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
  // context + dusk mood (moodLight: 0 kills the mood entirely).
  // NO string/fairy lights — the camp doesn't have them; the mood is
  // warm pools on the wood from the point lights.
  sourceZ: 9, bgC: 0x05050a,
  structW: 24, structD: 40, wallH: 8,
  moodLight: 0.30,
};

window.SCRIMVIEW = {
  // orbit state — camera on a sphere around the room center. The default is
  // AT THE SOURCE: standing at the pedestal, eye height, looking onward at
  // the drapes — that's who we're designing for.
  orb: { th: 0, ph: 1.736, r: 9.1, ty: 7 },
  PRESETS: [
    { n: 'AT THE SOURCE', th: 0, ph: 1.736, r: 9.1 },
    { n: 'AUDIENCE', th: 0, ph: 1.633, r: 16 },
    { n: 'HEAD-ON', th: 0, ph: 1.515, r: 18 },
    { n: 'OBLIQUE', th: -0.918, ph: 1.571, r: 21.5 },
    { n: 'OVERVIEW', th: 0.567, ph: 1.469, r: 39 },
  ],
  preset: 0,
  applyPreset(i) {
    this.preset = ((i % this.PRESETS.length) + this.PRESETS.length) % this.PRESETS.length;
    const p = this.PRESETS[this.preset];
    this.orb.th = p.th; this.orb.ph = p.ph; this.orb.r = p.r;
    this._chipSync(this.preset);
  },
  _chipSync(active) {
    const row = document.getElementById('scrimCams');
    if (!row) return;
    if (!row.children.length)
      row.innerHTML = this.PRESETS.map((p, i) => `<button data-i="${i}">${p.n}</button>`).join('');
    [...row.children].forEach((b, i) => b.classList.toggle('on', i === active));
  },
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

    // the two projectors + cone guides — a faint edge, a whisper of haze
    // near the lens, and a glow at the lens itself so anyone orbiting can see
    // where the light comes from. PURELY a guide: separate geometry, additive
    // and dim; the throw on the fabric is untouched.
    const lineM = new THREE.LineBasicMaterial({ color: 0x3c3c50, transparent: true, opacity: 0.55 });
    const mid = R.layers[1].z;
    const glowTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,245,225,1)');
      grd.addColorStop(0.35, 'rgba(200,205,235,0.5)');
      grd.addColorStop(1, 'rgba(160,170,220,0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    })();
    const coneM = new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide, fog: false,
      vertexShader: `attribute float aT; varying float vT;
        void main(){ vT = aT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying float vT;
        void main(){
          float a = (1.0 - vT); a *= a;                 // bright at the lens, gone by the wall
          gl_FragColor = vec4(vec3(0.33, 0.38, 0.55) * a * 0.16, 1.0);
        }`,
    });
    [-1, 1].forEach(side => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.1),
        new THREE.MeshBasicMaterial({ color: 0x23232b }));
      box.position.set(side * R.projSep / 2, R.projH + 0.3, R.projZ); this.scene.add(box);
      const o = box.position;
      const dist = Math.hypot(o.x, o.y - R.aimH, o.z - mid);
      const tw = dist / R.throwRatio, th = tw / (PROJ.w / PROJ.h);
      const corners = [[-1, -1], [-1, 1], [1, 1], [1, -1]].map(([cx, cy]) =>
        new THREE.Vector3(cx * tw / 2, R.aimH + cy * th / 2, mid));
      // edge lines: lens → corners + the registered rectangle
      const pts = [];
      corners.forEach((c, i2) => { pts.push(o, c, c, corners[(i2 + 1) % 4]); });
      this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineM));
      // haze cone: four translucent sides, apex-weighted
      const verts = [], aT = [];
      corners.forEach((c, i2) => {
        const c2 = corners[(i2 + 1) % 4];
        verts.push(o.x, o.y, o.z, c.x, c.y, c.z, c2.x, c2.y, c2.z);
        aT.push(0, 1, 1);
      });
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
      cg.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
      this.scene.add(new THREE.Mesh(cg, coneM));
      // the lens itself glows
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
      spr.scale.set(2.6, 2.6, 1);
      spr.position.set(o.x, o.y, o.z - 0.7);
      this.scene.add(spr);
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

    // ---- dusk mood: sky, duxel-frame pavilion, warm pools on the wood
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
      // what lights the wood: dim warm pools + a whisper of ambient
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
    if (!this.renderer) { try { this._init(P); } catch (e) { console.error('scrimview', e); if (typeof setView === 'function') setView('flat'); return; } this._chipSync(this.preset); }
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
    // camera from the orbit state — the user's hands are on this
    const o = this.orb;
    this.camera.fov = 50;
    this.camera.aspect = P.w / P.h; this.camera.updateProjectionMatrix();
    this.camera.position.set(
      o.r * Math.sin(o.ph) * Math.sin(o.th),
      o.ty + o.r * Math.cos(o.ph),
      o.r * Math.sin(o.ph) * Math.cos(o.th));
    this.camera.lookAt(0, o.ty, 0);
    this.tex.needsUpdate = true;
    this.strips.forEach(s => { s.material.uniforms.uTime.value = t; });
    this.renderer.render(this.scene, this.camera);
    fg.fillStyle = '#000'; fg.fillRect(0, 0, P.w, P.h);
    fg.drawImage(this.renderer.domElement, 0, 0);
    fg.fillStyle = 'rgba(200,210,225,0.55)';
    fg.font = '12px monospace'; fg.textAlign = 'left';
    fg.fillText('SCRIM · The Cave 24×40 ft · rows 6 ft apart · projectors 22 ft apart · ' +
      'drag ORBIT · wheel ZOOM · vantage chips top-left (C cycles) · keys W/S ↑/↓ play the hands', 14, P.h - 14);
  },
};

/* orbit input — in scrim mode the stage pointer belongs to the CAMERA
   (part2_core's ptrDrive stands down); keys keep driving the hands */
(() => {
  const inScrim = () => typeof VIEW !== 'undefined' && VIEW.mode === 'scrim' &&
    typeof focus !== 'undefined' && focus.idx >= 0;
  let drag = null;
  SCRIMVIEW._chipSync(SCRIMVIEW.preset); // build the vantage chips up front
  const row = document.getElementById('scrimCams');
  if (row) row.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (b) SCRIMVIEW.applyPreset(+b.dataset.i);
  });
  focusCanvas.addEventListener('pointerdown', e => {
    if (!inScrim()) return;
    drag = { x: e.clientX, y: e.clientY };
    focusCanvas.setPointerCapture(e.pointerId);
  });
  focusCanvas.addEventListener('pointermove', e => {
    if (!inScrim() || !drag) return;
    const o = SCRIMVIEW.orb;
    o.th -= (e.clientX - drag.x) * 0.009;
    o.ph = clamp(o.ph - (e.clientY - drag.y) * 0.007, 0.25, 1.78);
    drag = { x: e.clientX, y: e.clientY };
    SCRIMVIEW._chipSync(-1); // free orbit — no preset is "current" anymore
  });
  const end = () => { drag = null; };
  focusCanvas.addEventListener('pointerup', end);
  focusCanvas.addEventListener('pointercancel', end);
  focusCanvas.addEventListener('wheel', e => {
    if (!inScrim()) return;
    e.preventDefault();
    // trackpad pinch arrives as ctrl+wheel with tiny deltas — give it real gain
    const k = e.ctrlKey ? 0.014 : 0.0022;
    SCRIMVIEW.orb.r = clamp(SCRIMVIEW.orb.r * (1 + e.deltaY * k), 8, 70);
  }, { passive: false });
})();
// V cycles the view modes; C jumps between orbit vantages in scrim mode
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (typeof focus === 'undefined' || focus.idx < 0) return;
  const k = e.key.toLowerCase();
  if (k === 'v' && typeof setView === 'function') {
    const order = VIEW.MODES;
    setView(order[(order.indexOf(VIEW.mode) + 1) % order.length]);
  }
  if (k === 'c' && typeof VIEW !== 'undefined' && VIEW.mode === 'scrim')
    SCRIMVIEW.applyPreset(SCRIMVIEW.preset + 1);
});
