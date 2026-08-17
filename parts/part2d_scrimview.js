/* ============================================================
   SCRIM VIEW — how the frame actually lands in The Cave
   ------------------------------------------------------------
   Press V on the focus stage: instead of the flat 1920x1200 frame you see
   the frame THROWN — two projectors behind the source, converged on the
   middle drape layer, painting staggered mosquito-net strips in 3D. What it
   models (and what the flat frame can't show):
     · segmentation — the wall is 18" fabric strips with air gaps, so every
       image is sliced; strips sway a little
     · layer offset — "a few offset scrims": strips hang at 3 depths, so one
       projected pixel lands on different strips at different depths
     · double image — the projectors register on the MIDDLE layer; nearer and
       farther layers catch the two throws laterally separated (parallax),
       the depth-echo the scrim survey warns about
     · mesh optics — each layer scatters ~half and passes the rest, so deeper
       layers are dimmer, and everything adds (light on gauze is additive)
   C cycles viewpoints: AUDIENCE / OBLIQUE / OVERVIEW.

   THE RIG IS AN APPROXIMATION — every number lives in SCRIMRIG below (feet).
   Strip width + drop come from the camp planner catalog ("Hanging fabric",
   18" x 8ft, ceiling mount). Layer depths, projector separation, throw and
   mounting height are PLACEHOLDER guesses pending Elyse's planner layout
   (portal/planner/13) — drop the real numbers in and everything follows.
   Needs three.js (vendored in the preview; CDN on the live site) — the
   toggle no-ops without it. Skipped on mobile.
   ============================================================ */
const SCRIMRIG = {
  // drape wall (feet) — strips from the planner catalog; layout guessed
  layers: [                       // z: + toward projectors/audience
    { z: 0.0, stagger: 0.0 },   // nearest the projectors
    { z: -1.5, stagger: 0.5 },   // middle — projectors registered here
    { z: -3.0, stagger: 0.25 },
  ],
  wallW: 16,                       // lit span across the wall
  stripW: 1.5, stripGap: 0.25,     // 18" fabric + air gap
  ceilH: 10, drop: 8,              // strip tops at ceiling, 8ft drop
  // projectors (feet) — TWO PT-VMZ50s behind the user, over their head
  projSep: 6,                      // lens-to-lens
  projH: 9, projZ: 16.5,           // mounting height / distance from wall z=0
  throwRatio: 1.2,                 // PT-VMZ50 zoom range 1.09–1.77:1
  aimH: 6,                         // both aimed at drape band center, mid layer
  // mesh optics — scrim survey: mesh eats ~half the light
  scatter: 0.55,                   // fraction a layer catches (what you see)
  transmit: 0.6,                   // fraction passed through to deeper layers
  // context + dusk mood — the camp at dusk: warm string lights on the wood
  // structure, faint sky glow at the horizon. All of it stays far below the
  // throw so the projector remains the brightest thing in the room.
  sourceZ: 10, floorC: 0x08080a, bgC: 0x05050a,
  structW: 18, structD: 20,        // wood pavilion footprint around the rig
  moodLight: 0.30,                 // string/point light intensity (0 = off)
};

window.SCRIMVIEW = {
  on: false, cam: 0, _t: null,
  CAMS: [
    { n: 'AUDIENCE', pos: [0, 5.8, 17], look: [0, 6.2, -1.5] },
    { n: 'OBLIQUE', pos: [-14, 6.5, 9], look: [0, 6, -1.5] },
    { n: 'OVERVIEW', pos: [13, 8, 26], look: [0, 6, 0] },
  ],
  toggle() {
    if (typeof THREE === 'undefined') { console.warn('SCRIM VIEW needs three.js (CDN offline?)'); return; }
    if (window.IS_MOBILE) return;
    this.on = !this.on;
  },
  _init(P) {
    const R = SCRIMRIG;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(P.w, P.h, false);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(R.bgC);
    this.scene.fog = new THREE.FogExp2(R.bgC, 0.006);
    this.camera = new THREE.PerspectiveCamera(50, P.w / P.h, 0.1, 300);
    this.tex = new THREE.CanvasTexture(P.canvas);
    this.tex.generateMipmaps = false;
    this.tex.minFilter = THREE.LinearFilter;
    // two virtual projectors — matrices are rebuilt each frame (cheap) so
    // SCRIMRIG and PROJ (frame preset) edits cascade live
    this.projCams = [new THREE.PerspectiveCamera(), new THREE.PerspectiveCamera()];
    this.mats = [new THREE.Matrix4(), new THREE.Matrix4()];

    const vert = `
      uniform float uTime, uPhase, uDrop;
      varying vec3 vWorld;
      void main() {
        // sway pinned at the top rail, growing toward the free hem
        float k = clamp(0.5 - position.y / uDrop, 0.0, 1.0);
        vec3 p = position;
        p.x += sin(uTime * 0.7 + uPhase + position.y * 0.35) * 0.14 * k * k;
        p.z += sin(uTime * 0.53 + uPhase * 1.7) * 0.10 * k * k;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;
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
        vec3 col = throwFrom(uPL) + throwFrom(uPR);      // light adds on gauze
        // woven-mesh shimmer so the fabric reads as material, not a screen
        float weave = 0.82 + 0.18 * sin(vWorld.x * 34.0) * sin(vWorld.y * 34.0);
        col = col * uGain * weave + vec3(0.016, 0.012, 0.011); // dusk-lit fabric
        gl_FragColor = vec4(col, 1.0);
      }`;

    this.strips = [];
    const pitch = R.stripW + R.stripGap;
    const n = Math.floor(R.wallW / pitch);
    R.layers.forEach((L, li) => {
      const gain = R.scatter * Math.pow(R.transmit, li); // deeper = pre-shadowed
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * pitch + L.stagger * pitch;
        const g = new THREE.PlaneGeometry(R.stripW, R.drop, 1, 6);
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

    // context: floor, the two projector bodies + frustum edges, source, a person
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vWorld;
          void main(){ vec4 wp = modelMatrix * vec4(position,1.0); vWorld = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: frag.replace('vec3(0.016, 0.012, 0.011)', 'vec3(0.013, 0.010, 0.008)'),
        uniforms: { uMap: { value: this.tex }, uPL: { value: this.mats[0] }, uPR: { value: this.mats[1] }, uGain: { value: 0.10 } },
      }));
    floor.rotation.x = -Math.PI / 2; this.scene.add(floor);
    const lineM = new THREE.LineBasicMaterial({ color: 0x2a2a38, transparent: true, opacity: 0.5 });
    [-1, 1].forEach(side => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.1),
        new THREE.MeshBasicMaterial({ color: 0x23232b }));
      box.position.set(side * R.projSep / 2, R.projH, R.projZ); this.scene.add(box);
      const o = box.position, mid = R.layers[1].z, tw = (R.projZ - mid) / R.throwRatio;
      const th = tw / (PROJ.w / PROJ.h);
      const pts = [];
      [[-1, -1], [-1, 1], [1, 1], [1, -1]].forEach(([cx, cy], i2, arr) => {
        const c = new THREE.Vector3(cx * tw / 2, R.aimH + cy * th / 2, mid);
        const c2v = arr[(i2 + 1) % 4],
          c2 = new THREE.Vector3(c2v[0] * tw / 2, R.aimH + c2v[1] * th / 2, mid);
        pts.push(o, c, c, c2);
      });
      this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), lineM));
    });
    const src = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x8fb4c8 }));
    src.position.set(0, 3.6, R.sourceZ); this.scene.add(src);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 3.3, 8),
      new THREE.MeshBasicMaterial({ color: 0x1a1a20 }));
    ped.position.set(0, 1.65, R.sourceZ); this.scene.add(ped);
    const person = new THREE.Mesh(
      THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.45, 4.5, 3, 8) : new THREE.CylinderGeometry(0.45, 0.45, 5.4, 8),
      new THREE.MeshBasicMaterial({ color: 0x0d0d11 }));
    person.position.set(-5, 2.7, R.sourceZ + 2); this.scene.add(person);

    // ---- dusk mood: sky, wood pavilion, string lights (R.moodLight = 0 kills it)
    if (R.moodLight > 0) {
      // playa sky just after sunset — deep indigo up top, warm mauve horizon
      const sky = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 12),
        new THREE.ShaderMaterial({
          side: THREE.BackSide, depthWrite: false, fog: false,
          vertexShader: `varying vec3 vP; void main(){ vP = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `varying vec3 vP;
            void main(){
              float h = clamp(normalize(vP).y, -0.1, 1.0);
              vec3 zen = vec3(0.016, 0.018, 0.040);
              vec3 hor = vec3(0.085, 0.042, 0.055);          // dusty rose band
              vec3 c = mix(hor, zen, smoothstep(0.0, 0.45, h));
              if (h < 0.0) c = mix(hor, vec3(0.02,0.015,0.02), -h * 8.0);
              gl_FragColor = vec4(c, 1.0);
            }`,
        }));
      this.scene.add(sky);
      // wood pavilion: corner posts + perimeter beams, warm-lit
      const woodM = new THREE.MeshLambertMaterial({ color: 0x8a6544 });
      const hw = R.structW / 2, zf = -1, zb = zf + R.structD; // wall side → behind projectors
      const addBox = (w2, h2, d2, x, y, z) => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w2, h2, d2), woodM);
        b.position.set(x, y, z); this.scene.add(b); return b;
      };
      [[-hw, zf], [hw, zf], [-hw, zb], [hw, zb]].forEach(([x, z]) => addBox(0.5, R.ceilH, 0.5, x, R.ceilH / 2, z));
      addBox(R.structW + 0.5, 0.45, 0.5, 0, R.ceilH + 0.2, zf);   // front header (over the drapes)
      addBox(R.structW + 0.5, 0.45, 0.5, 0, R.ceilH + 0.2, zb);
      [[-hw], [hw]].forEach(([x]) => addBox(0.5, 0.45, R.structD, x, R.ceilH + 0.2, (zf + zb) / 2));
      // string lights: warm bulbs sagging between posts, three spans
      const bulbM = new THREE.MeshBasicMaterial({ color: 0xffb469 });
      const bulbG = new THREE.SphereGeometry(0.07, 6, 5);
      const stringAt = (ax, az, bx, bz) => {
        const len = Math.hypot(bx - ax, bz - az), nB = Math.max(8, Math.round(len / 0.9));
        for (let i = 0; i <= nB; i++) {
          const t2 = i / nB, sag = Math.sin(t2 * Math.PI) * 0.55;
          const b = new THREE.Mesh(bulbG, bulbM);
          b.position.set(ax + (bx - ax) * t2, R.ceilH - 0.15 - sag, az + (bz - az) * t2);
          this.scene.add(b);
        }
      };
      stringAt(-hw, zf, hw, zf);
      stringAt(-hw, zf, -hw, zb); stringAt(hw, zf, hw, zb);
      // what actually lights the wood: dim warm points + a whisper of ambient
      this.scene.add(new THREE.AmbientLight(0x2a2233, 0.9));
      [[0, zf + 1], [-hw * 0.6, zb - 6], [hw * 0.6, zb - 6]].forEach(([x, z]) => {
        const pl = new THREE.PointLight(0xffa050, R.moodLight, 26);
        pl.position.set(x, R.ceilH - 0.6, z); this.scene.add(pl);
      });
    }
  },
  render(fg, P, t) {
    if (!this.renderer) { try { this._init(P); } catch (e) { console.error('scrimview', e); this.on = false; return; } }
    if (this.renderer.domElement.width !== P.w || this.renderer.domElement.height !== P.h) {
      this.renderer.setSize(P.w, P.h, false);
      this.camera.aspect = P.w / P.h; this.camera.updateProjectionMatrix();
    }
    const R = SCRIMRIG, mid = R.layers[1].z;
    // rebuild the two throw matrices (registered on the middle layer)
    [-1, 1].forEach((side, i) => {
      const pc = this.projCams[i];
      const throwD = R.projZ - mid, tw = throwD / R.throwRatio;
      pc.fov = 2 * Math.atan((tw / (PROJ.w / PROJ.h)) / 2 / throwD) * 180 / Math.PI;
      pc.aspect = PROJ.w / PROJ.h; pc.near = 0.5; pc.far = 100;
      pc.position.set(side * R.projSep / 2, R.projH, R.projZ);
      pc.lookAt(0, R.aimH, mid);
      pc.updateProjectionMatrix(); pc.updateMatrixWorld();
      this.mats[i].multiplyMatrices(pc.projectionMatrix, pc.matrixWorldInverse);
    });
    const C = this.CAMS[this.cam % this.CAMS.length];
    const drift = Math.sin(t * 0.13) * 0.7;                 // gentle parallax cue
    this.camera.position.set(C.pos[0] + drift, C.pos[1], C.pos[2]);
    this.camera.lookAt(C.look[0], C.look[1], C.look[2]);
    this.tex.needsUpdate = true;
    this.strips.forEach(s => { s.material.uniforms.uTime.value = t; });
    this.renderer.render(this.scene, this.camera);
    fg.fillStyle = '#000'; fg.fillRect(0, 0, P.w, P.h);
    fg.drawImage(this.renderer.domElement, 0, 0);
    fg.fillStyle = 'rgba(200,210,225,0.55)';
    fg.font = '12px monospace'; fg.textAlign = 'left';
    fg.fillText('SCRIM VIEW · approx rig (see SCRIMRIG) · ' + C.n + ' · V exit · C camera', 14, P.h - 14);
  },
};
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (typeof focus === 'undefined' || focus.idx < 0) return;
  const k = e.key.toLowerCase();
  if (k === 'v') SCRIMVIEW.toggle();
  if (k === 'c' && SCRIMVIEW.on) SCRIMVIEW.cam = (SCRIMVIEW.cam + 1) % SCRIMVIEW.CAMS.length;
});
