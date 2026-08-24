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

   Needs three.js. Works on touch too: one finger orbits, two-finger
   pinch zooms (the phone canvas is small, so the 3D view is cheap).
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
  // context + camp mood: ambient pastel purple/pink wash (the camp runs
  // colored LEDs so people can see), playa-sand floor, duxel structure
  bgC: 0x0a070d, structW: 24, structD: 32, wallH: 8, ceilH: 16,
  moodLight: 0.5,
  moodColors: [0xf2a6d8, 0xb593f0, 0xf2a6d8, 0xb593f0], // pink / lavender floods
};

window.SCRIMVIEW = {
  // orbit state: camera on a sphere around a per-vantage target. Default is
  // BEHIND THE SOURCE — pulled back past the obelisk, level, the WHOLE main
  // scrim wall in frame (Lance: opening close-up and tilted at the sky is
  // useless for judging a look; AT THE SOURCE stays one C-press away).
  orb: { th: 0, ph: 1.52, r: 18.5, tx: 0, ty: 8, tz: -5.63 },
  PRESETS: [
    { n: 'BEHIND THE SOURCE', th: 0, ph: 1.52, r: 18.5, tgt: [0, 8, -5.63] },
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
      sel.innerHTML = this.PRESETS.map((p, i) => `<option value="${i}">CAM · ${p.n}</option>`).join('') +
        '<option value="free" disabled>CAM · FREE ORBIT</option>';
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
        col = col * uGain + vec3(0.028, 0.019, 0.030);    // pastel-washed fabric
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

    // floor: playa sand under the pastel camp wash, plus the throw's spill.
    // Brighter than true night — the camp's ambient LEDs are the reference.
    this.floorMat = new THREE.ShaderMaterial({
      vertexShader: `varying vec3 vWorld;
        void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `
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
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          // fine grain + broad drifts read as packed playa dust
          float g = hash(floor(vWorld.xz * 3.0)) * 0.5 + hash(floor(vWorld.xz * 0.7)) * 0.5;
          float drift = 0.5 + 0.5 * sin(vWorld.x * 0.31) * sin(vWorld.z * 0.23);
          vec3 sand = mix(vec3(0.135, 0.105, 0.115), vec3(0.205, 0.165, 0.175), g * 0.6 + drift * 0.4);
          sand *= vec3(1.02, 0.90, 1.06);                    // the pastel wash tints it
          float fade = exp(-length(vWorld.xz) * 0.022);      // open playa falls off into night
          sand *= mix(0.3, 1.0, fade);
          gl_FragColor = vec4(throwFrom(uPL) * uGain + throwFrom(uPR) * uGain + sand, 1.0);
        }`,
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
              vec3 zen = vec3(0.020, 0.020, 0.048);
              vec3 hor = vec3(0.110, 0.058, 0.095);        // dusty rose-violet band
              vec3 c = mix(hor, zen, smoothstep(0.0, 0.45, h));
              if (h < 0.0) c = mix(hor, vec3(0.02,0.015,0.02), -h * 8.0);
              gl_FragColor = vec4(c, 1.0);
            }`,
        }));
      this.scene.add(sky);
      // THE DUXELS — the camp's 8 ft cube frames, laid out like the planner:
      // 1-story rows down both sides, 2-story back wall, 2-story entrance
      // towers with an open arch between them, corner cubes. Toggle with the
      // DUXELS button (or D) when the frames get in the way of judging a look.
      this.duxels = new THREE.Group();
      const woodM = new THREE.MeshLambertMaterial({ color: 0x9a7047 });
      const beamG = new THREE.BoxGeometry(1, 1, 1);
      const beam = (x1, y1, z1, x2, y2, z2) => {
        const t = 0.32;
        const b = new THREE.Mesh(beamG, woodM);
        b.scale.set(Math.abs(x2 - x1) + t, Math.abs(y2 - y1) + t, Math.abs(z2 - z1) + t);
        b.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
        this.duxels.add(b);
      };
      const cube = (x0, z0, y0) => {         // one 8 ft duxel frame, base corner (x0, y0, z0)
        const x1 = x0 + 8, z1 = z0 + 8, y1 = y0 + 8;
        beam(x0, y0, z0, x0, y1, z0); beam(x1, y0, z0, x1, y1, z0);
        beam(x0, y0, z1, x0, y1, z1); beam(x1, y0, z1, x1, y1, z1);
        for (const y of [y0, y1]) {
          beam(x0, y, z0, x1, y, z0); beam(x0, y, z1, x1, y, z1);
          beam(x0, y, z0, x0, y, z1); beam(x1, y, z0, x1, y, z1);
        }
      };
      for (const zc of [-16, -8, 0, 8]) { cube(-20, zc, 0); cube(12, zc, 0); }   // side rows
      for (const xc of [-12, -4, 4]) { cube(xc, -24, 0); cube(xc, -24, 8); }     // back wall, 2-story
      for (const xc of [-12, 4]) { cube(xc, 16, 0); cube(xc, 16, 8); }           // entrance towers
      cube(-4, 16, 8);                                                            // the arch over the opening
      cube(-20, 16, 0); cube(12, 16, 0); cube(-20, -24, 0); cube(12, -24, 0);    // corners
      this.duxels.visible = (() => { try { return localStorage.getItem('srcDuxels') !== '0'; } catch (e) { return true; } })();
      this.scene.add(this.duxels);
      const bd = document.getElementById('btnDux');
      if (bd) bd.classList.toggle('off', !this.duxels.visible);
      // the REAL cable runs from the planner (including the diagonals)
      const cableM = new THREE.LineBasicMaterial({ color: 0x3a3a46, transparent: true, opacity: 0.7 });
      R.CABLES.forEach(seg => {
        const pts = seg.map(a => new THREE.Vector3(a[0], a[1], a[2]));
        this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(
          pts.length === 2 ? pts : [pts[0], pts[1], pts[1], pts[2]]), cableM));
      });
      // the camp's four floods at their real positions — pastel pink/lavender,
      // bright enough that people can see, still far below the throw
      this.scene.add(new THREE.AmbientLight(0x584a66, 1.0));
      R.floods.forEach(([x, z], i) => {
        const pl = new THREE.PointLight(R.moodColors[i % R.moodColors.length], R.moodLight, 40);
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
    // the 3D room fills the DISPLAY canvas full bleed — its aspect is the
    // window's, not the projector frame's (the frame lives on in the throw)
    const dw = fg.canvas.width, dh = fg.canvas.height;
    if (this.renderer.domElement.width !== dw || this.renderer.domElement.height !== dh) {
      this.renderer.setSize(dw, dh, false);
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
    this.camera.aspect = dw / dh; this.camera.updateProjectionMatrix();
    this.camera.position.set(
      o.tx + o.r * Math.sin(o.ph) * Math.sin(o.th),
      o.ty + o.r * Math.cos(o.ph),
      o.tz + o.r * Math.sin(o.ph) * Math.cos(o.th));
    this.camera.lookAt(o.tx, o.ty, o.tz);
    this.tex.needsUpdate = true;
    this.strips.forEach(s => { s.material.uniforms.uTime.value = t; });
    this.renderer.render(this.scene, this.camera);
    fg.fillStyle = '#000'; fg.fillRect(0, 0, dw, dh);
    fg.drawImage(this.renderer.domElement, 0, 0);
    fg.fillStyle = 'rgba(200,210,225,0.55)';
    fg.font = '12px monospace'; fg.textAlign = 'left';
    fg.fillText('SCRIM · Cave Layout 2026 (planner export) · 24×32 ft · 12 panels · ' +
      'drag ORBIT · wheel/pinch ZOOM · CAM in the sidebar (C cycles) · keys W/S ↑/↓ play the hands', 14, dh - 14);
  },
};

/* orbit input — in scrim mode the stage pointer belongs to the CAMERA
   (part2_core's ptrDrive stands down); keys keep driving the hands.
   One pointer orbits; two pointers (touch) pinch-zoom; wheel/trackpad zooms. */
(() => {
  const inScrim = () => typeof VIEW !== 'undefined' && VIEW.mode === 'scrim' &&
    typeof focus !== 'undefined' && focus.idx >= 0;
  const ptrs = new Map();
  let pinchDist = 0;
  const dist = () => {
    const [a, b] = [...ptrs.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  focusCanvas.addEventListener('pointerdown', e => {
    if (!inScrim()) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { focusCanvas.setPointerCapture(e.pointerId); } catch (err) {} // finger may already be gone
    if (ptrs.size === 2) pinchDist = dist();
  });
  focusCanvas.addEventListener('pointermove', e => {
    if (!inScrim() || !ptrs.has(e.pointerId)) return;
    const o = SCRIMVIEW.orb, prev = ptrs.get(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {                       // touch pinch → zoom
      const d = dist();
      if (pinchDist > 0 && d > 0) o.r = clamp(o.r * (pinchDist / d), 3, 70);
      pinchDist = d;
    } else if (ptrs.size === 1) {                // drag → orbit
      o.th -= (e.clientX - prev.x) * 0.009;
      o.ph = clamp(o.ph - (e.clientY - prev.y) * 0.007, 0.25, 2.0);
    }
    SCRIMVIEW._camSync(-1); // free orbit — no preset is "current" anymore
  });
  const end = e => { ptrs.delete(e.pointerId); pinchDist = 0; };
  focusCanvas.addEventListener('pointerup', end);
  focusCanvas.addEventListener('pointercancel', end);
  focusCanvas.addEventListener('wheel', e => {
    if (!inScrim()) return;
    e.preventDefault();
    // trackpad pinch arrives as ctrl+wheel with tiny deltas — give it real gain
    const k = e.ctrlKey ? 0.014 : 0.0022;
    SCRIMVIEW.orb.r = clamp(SCRIMVIEW.orb.r * (1 + e.deltaY * k), 3, 70);
  }, { passive: false });
  const duxFlip = () => {
    if (!SCRIMVIEW.duxels) return;
    SCRIMVIEW.duxels.visible = !SCRIMVIEW.duxels.visible;
    try { localStorage.setItem('srcDuxels', SCRIMVIEW.duxels.visible ? '1' : '0'); } catch (err) {}
    const bd = document.getElementById('btnDux');
    if (bd) bd.classList.toggle('off', !SCRIMVIEW.duxels.visible);
  };
  const btnDux = document.getElementById('btnDux');
  if (btnDux) btnDux.addEventListener('click', duxFlip);
  window.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if ((e.key === 'd' || e.key === 'D') && inScrim()) duxFlip();
  });
  SCRIMVIEW._camSync(SCRIMVIEW.preset); // build the vantage menu up front
  const camSel = document.getElementById('camSel');
  if (camSel) camSel.addEventListener('change', () => {
    if (camSel.value !== 'free') SCRIMVIEW.applyPreset(+camSel.value);
    camSel.blur();
  });
})();
// V cycles the view modes; C cycles vantages inside the scrim view
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (typeof focus === 'undefined' || focus.idx < 0) return;
  // Electron show window: THIS WINDOW IS THE PROJECTORS. GHOST is a
  // two-projector misregistration preview and SCRIM is the 3D room — both
  // are design tools, and CLAUDE.md is explicit that neither must ever be
  // what the wall gets. Being on a second screen is not protection: the
  // show window is a real focusable OS window that setFullScreen() raises
  // to the front on PLAY, so a stray V on the laptop keyboard landed HERE
  // rather than on the control window. Rehearse views in control.
  if (window.ELECTRON_ROLE === 'show') return;
  const k = e.key.toLowerCase();
  if (k === 'v' && typeof setView === 'function') {
    const order = VIEW.MODES;
    setView(order[(order.indexOf(VIEW.mode) + 1) % order.length]);
  }
  if (k === 'c' && typeof VIEW !== 'undefined' && VIEW.mode === 'scrim')
    SCRIMVIEW.applyPreset(SCRIMVIEW.preset + 1);
});
