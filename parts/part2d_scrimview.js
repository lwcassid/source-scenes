/* ============================================================
   SCRIM VIEW — how the frame actually lands in The Cave
   ------------------------------------------------------------
   Part of the VIEW system (dropdown on the stage, or V to cycle):
     flat   — the plain 1920x1200 frame, one projector
     double — same frame with the second projector's ghost overlaid
     scrim  — the throw in The Cave in 3D, and YOU drive the camera:
              drag orbits, wheel/pinch zooms, and the CAM menu (or C)
              jumps between vantages. AT THE SOURCE is the default —
              it's who we design for. Keys still play the hands.

   THE LAYOUT IS REAL: panels, cables, source, lights and structure
   come from Elyse's "Cave Layout 2026" planner export
   (docs/cave-layout-2026.json; regenerate with tools/cave2rig.py).
   Interior 24 x 32 ft between cable anchors, 8 ft duxel walls, cables
   at 16 ft. TWELVE fabric panels on four cross-cables plus the two
   diagonals: a main wall of 54" x 16 ft panels at z -5.6 and -10.3
   (BEHIND the source), narrow 18" accents at z +2.3 and +8.1 and on
   the diagonals (in front of and around the player). The source
   obelisk stands INSIDE the drape field at (0.2, -1.5). Projectors:
   2x PT-VMZ50 on the entrance-corner duxel tops (+/-12, 8 ft up,
   z +16), converged on the main wall row (z -5.63) — so the throw
   passes through the front accents, past the player, onto the wall.
   What that shows honestly: slicing, per-panel depth offsets, the
   two-throw double image off the registration row, gauze dimming,
   floor spill. One simplification: every panel scatters uniformly
   (no panel-behind-panel shadowing).

   Needs three.js; the scrim mode is skipped on mobile.
   ============================================================ */
const SCRIMRIG = {
  // 12 fabric panels, verbatim from the planner export (sim x = planner x - 4)
  PANELS: [
    { x: -6.92, z: -10.32, w: 4.5, drop: 16, rot: 0, top: 16 },
    { x: 0.22, z: -10.32, w: 1.5, drop: 8, rot: 0, top: 16 },
    { x: 7.38, z: -10.32, w: 4.5, drop: 16, rot: 0, top: 16 },
    { x: -2.86, z: -5.63, w: 4.5, drop: 16, rot: 0, top: 16 },
    { x: 3.36, z: -5.63, w: 4.5, drop: 16, rot: 0, top: 16 },
    { x: -8.24, z: 2.3, w: 1.5, drop: 8, rot: 0, top: 16 },
    { x: 6.12, z: 2.3, w: 1.5, drop: 8, rot: 0, top: 16 },
    { x: -4.92, z: 8.15, w: 1.5, drop: 10, rot: 0, top: 16 },
    { x: 0.28, z: 8.15, w: 1.5, drop: 8, rot: 0, top: 16 },
    { x: 4.79, z: 8.15, w: 1.5, drop: 10.5, rot: 0, top: 16 },
    { x: 8.56, z: 11.41, w: 1.5, drop: 10, rot: -53.13, top: 16 },
    { x: -8.64, z: 11.52, w: 1.5, drop: 10.5, rot: 53.13, top: 16 },
  ],
  CABLES: [
    [[-12, 16, -16], [-12, 16, 16]],
    [[12, 16, -16], [12, 16, 16]],
    [[-12, 16, 16], [12, 16, -16]],
    [[-12, 16, -16], [12, 16, 16]],
    [[-12, 16, 8.15], [12, 16, 8.15]],
    [[-12, 16, -5.63], [12, 16, -5.63]],
    [[-12, 16, -10.32], [12, 16, -10.32]],
    [[-12, 16, 2.3], [12, 16, 2.3]],
    [[-4, 16, 16], [4, 16, 16]],
  ],
  // projectors — 2x PT-VMZ50 on the entrance-corner duxel tops
  projSep: 24, projH: 8, projZ: 16,
  throwRatio: 1.1,                 // wide end of the 1.09-1.77:1 zoom
  aimH: 8, aimZ: -5.63,            // converged on the main-wall row
  // gauze optics — scrim survey: mesh eats ~half the light
  scatter: 0.55,
  // real prop positions from the export
  sourceX: 0.23, sourceZ: -1.55,
  personX: -1.52, personZ: 20,     // export has them at z 34.8; kept closer for scale
  floods: [[-12, -24], [-12, 24], [12, -24], [12, 24]],
  // context + dusk mood (moodLight: 0 kills the mood entirely)
  bgC: 0x05050a, structW: 24, structD: 32, wallH: 8, ceilH: 16,
  moodLight: 0.30,
};

window.SCRIMVIEW = {
  // orbit state: camera on a sphere around a per-vantage target. Default is
  // AT THE SOURCE — standing at the obelisk, eye height, facing the main wall.
  orb: { th: 0.035, ph: 1.93, r: 7.1, tx: 0, ty: 8, tz: -8 },
  PRESETS: [
    { n: 'AT THE SOURCE', th: 0.035, ph: 1.93, r: 7.1, tgt: [0, 8, -8] },
    { n: 'AUDIENCE', th: 0, ph: 1.695, r: 16.1, tgt: [0, 8, -4] },
    { n: 'HEAD-ON', th: 0, ph: 1.571, r: 19.6, tgt: [0, 8, -5.63] },
    { n: 'OBLIQUE', th: -1.012, ph: 1.624, r: 18.9, tgt: [0, 8, -2] },
    { n: 'OVERVIEW', th: 0.656, ph: 1.39, r: 33.3, tgt: [0, 6, 0] },
  ],
  preset: 0,
  applyPreset(i) {
    this.preset = ((i % this.PRESETS.length) + this.PRESETS.length) % this.PRESETS.length;
    const p = this.PRESETS[this.preset];
    this.orb.th = p.th; this.orb.ph = p.ph; this.orb.r = p.r;
    this.orb.tx = p.tgt[0]; this.orb.ty = p.tgt[1]; this.orb.tz = p.tgt[2];
    this._camSync(this.preset);
  },
  _camSync(active) {
    const sel = document.getElementById('camSel');
    if (!sel) return;
    if (!sel.options.length)
      sel.innerHTML = this.PRESETS.map((p, i) => `<option value="${i}">CAM: ${p.n}</option>`).join('') +
        '<option value="free" disabled>CAM: FREE ORBIT</option>';
    sel.value = active >= 0 ? String(active) : 'free';
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
    R.PANELS.forEach((Q, i) => {
      const g = new THREE.PlaneGeometry(Q.w, Q.drop, 1, 8);
      const m = new THREE.ShaderMaterial({
        vertexShader: vert, fragmentShader: frag,
        uniforms: {
          uMap: { value: this.tex }, uPL: { value: this.mats[0] }, uPR: { value: this.mats[1] },
          uGain: { value: R.scatter }, uTime: { value: 0 },
          uPhase: { value: (i * 2.39) % 6.28 }, uDrop: { value: Q.drop },
        },
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      });
      const s = new THREE.Mesh(g, m);
      s.position.set(Q.x, Q.top - Q.drop / 2, Q.z);
      s.rotation.y = Q.rot * Math.PI / 180;   // diagonal-cable panels
      this.scene.add(s); this.strips.push(s);
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
    // near the lens, and a glow at the lens itself. PURELY a guide: separate
    // geometry, additive and dim; the throw on the fabric is untouched.
    const lineM = new THREE.LineBasicMaterial({ color: 0x3c3c50, transparent: true, opacity: 0.55 });
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
      const dist = Math.hypot(o.x, o.y - R.aimH, o.z - R.aimZ);
      const tw = dist / R.throwRatio, th = tw / (PROJ.w / PROJ.h);
      const corners = [[-1, -1], [-1, 1], [1, 1], [1, -1]].map(([cx, cy]) =>
        new THREE.Vector3(cx * tw / 2, R.aimH + cy * th / 2, R.aimZ));
      const pts = [];
      corners.forEach((c, i2) => { pts.push(o, c, c, corners[(i2 + 1) % 4]); });
      this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineM));
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
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9 }));
      spr.scale.set(2.6, 2.6, 1);
      spr.position.set(o.x, o.y, o.z - 0.7);
      this.scene.add(spr);
    });

    // the source obelisk (real position) + a person for scale
    const src = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x8fb4c8 }));
    src.position.set(R.sourceX, 4.0, R.sourceZ); this.scene.add(src);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 3.7, 8),
      new THREE.MeshBasicMaterial({ color: 0x1a1a20 }));
    ped.position.set(R.sourceX, 1.85, R.sourceZ); this.scene.add(ped);
    const person = new THREE.Mesh(
      THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.45, 4.5, 3, 8) : new THREE.CylinderGeometry(0.45, 0.45, 5.4, 8),
      new THREE.MeshBasicMaterial({ color: 0x0d0d11 }));
    person.position.set(R.personX, 2.7, R.personZ); this.scene.add(person);

    // ---- dusk mood: sky, duxel-frame structure, real cables, warm pools
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
      // duxel walls as posts + header beams (24 x 32 interior, 8 ft high)
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
      // 16 ft towers flank the entrance (front + back), carrying the cables
      [[-4, zf], [4, zf], [-4, zb], [4, zb]].forEach(([x, z]) => addBox(0.6, R.ceilH, 0.6, x, R.ceilH / 2, z));
      // the REAL cable runs from the planner (including the diagonals)
      const cableM = new THREE.LineBasicMaterial({ color: 0x3a3a46, transparent: true, opacity: 0.7 });
      R.CABLES.forEach(seg => {
        const pts = seg.map(a => new THREE.Vector3(a[0], a[1], a[2]));
        this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(
          pts.length === 2 ? pts : [pts[0], pts[1], pts[1], pts[2]]), cableM));
      });
      // what lights the wood: the camp's four flood positions, dim + warm
      this.scene.add(new THREE.AmbientLight(0x2a2233, 0.9));
      R.floods.forEach(([x, z]) => {
        const pl = new THREE.PointLight(0xffa050, R.moodLight, 34);
        pl.position.set(x, R.ceilH, z); this.scene.add(pl);
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
    if (!this.renderer) { try { this._init(P); } catch (e) { console.error('scrimview', e); if (typeof setView === 'function') setView('flat'); return; } this._camSync(this.preset); }
    this._bindTex(P);
    if (this.renderer.domElement.width !== P.w || this.renderer.domElement.height !== P.h) {
      this.renderer.setSize(P.w, P.h, false);
    }
    const R = SCRIMRIG;
    // rebuild the two throw matrices (registered on the main-wall row)
    [-1, 1].forEach((side, i) => {
      const pc = this.projCams[i];
      pc.position.set(side * R.projSep / 2, R.projH, R.projZ);
      const dist = Math.hypot(pc.position.x, pc.position.y - R.aimH, pc.position.z - R.aimZ);
      const tw = dist / R.throwRatio;
      pc.fov = 2 * Math.atan((tw / (PROJ.w / PROJ.h)) / 2 / dist) * 180 / Math.PI;
      pc.aspect = PROJ.w / PROJ.h; pc.near = 0.5; pc.far = 120;
      pc.lookAt(0, R.aimH, R.aimZ);
      pc.updateProjectionMatrix(); pc.updateMatrixWorld();
      this.mats[i].multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse);
    });
    // camera from the orbit state — the user's hands are on this
    const o = this.orb;
    this.camera.fov = 50;
    this.camera.aspect = P.w / P.h; this.camera.updateProjectionMatrix();
    this.camera.position.set(
      o.tx + o.r * Math.sin(o.ph) * Math.sin(o.th),
      o.ty + o.r * Math.cos(o.ph),
      o.tz + o.r * Math.sin(o.ph) * Math.cos(o.th));
    this.camera.lookAt(o.tx, o.ty, o.tz);
    this.tex.needsUpdate = true;
    this.strips.forEach(s => { s.material.uniforms.uTime.value = t; });
    this.renderer.render(this.scene, this.camera);
    fg.fillStyle = '#000'; fg.fillRect(0, 0, P.w, P.h);
    fg.drawImage(this.renderer.domElement, 0, 0);
    fg.fillStyle = 'rgba(200,210,225,0.55)';
    fg.font = '12px monospace'; fg.textAlign = 'left';
    fg.fillText('SCRIM · Cave Layout 2026 (planner export) · 24×32 ft · 12 panels · ' +
      'drag ORBIT · wheel/pinch ZOOM · CAM menu (C cycles) · keys W/S ↑/↓ play the hands', 14, P.h - 14);
  },
};

/* orbit input — in scrim mode the stage pointer belongs to the CAMERA
   (part2_core's ptrDrive stands down); keys keep driving the hands */
(() => {
  const inScrim = () => typeof VIEW !== 'undefined' && VIEW.mode === 'scrim' &&
    typeof focus !== 'undefined' && focus.idx >= 0;
  let drag = null;
  SCRIMVIEW._camSync(SCRIMVIEW.preset); // build the vantage menu up front
  const camSel = document.getElementById('camSel');
  if (camSel) camSel.addEventListener('change', () => {
    if (camSel.value !== 'free') SCRIMVIEW.applyPreset(+camSel.value);
    camSel.blur();
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
    o.ph = clamp(o.ph - (e.clientY - drag.y) * 0.007, 0.25, 2.0);
    drag = { x: e.clientX, y: e.clientY };
    SCRIMVIEW._camSync(-1); // free orbit — no preset is "current" anymore
  });
  const end = () => { drag = null; };
  focusCanvas.addEventListener('pointerup', end);
  focusCanvas.addEventListener('pointercancel', end);
  focusCanvas.addEventListener('wheel', e => {
    if (!inScrim()) return;
    e.preventDefault();
    // trackpad pinch arrives as ctrl+wheel with tiny deltas — give it real gain
    const k = e.ctrlKey ? 0.014 : 0.0022;
    SCRIMVIEW.orb.r = clamp(SCRIMVIEW.orb.r * (1 + e.deltaY * k), 3, 70);
  }, { passive: false });
})();
// V cycles the view modes; C cycles vantages inside the scrim view
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
