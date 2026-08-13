/* ---------- SRC-32.3 · SONORA V3 (dye bowls) ---------- */
/* Ported verbatim from Nima's working index.html; only id/family
   metadata added so the version dropdown groups it under SRC-32. */
reg({
  id: 'SRC-32.3', family: 'SRC-32', ver: 3, title: 'Sonora', tech: 'DYE BOWLS / SIDE PRESSURE',
  music: { bpm: 60, root: 46, mode: 'mixolydian', prog: [0, 6, 4, 5], chordBars: 4 },
  fx: { bloom: 0.45, edge: true },
  tags: ['ONE BOWL, ONE INSTRUMENT', 'INVISIBLE PRESSURE FRONTS', 'SLOSHING DYE', 'SYMPATHETIC SWELL'],
  desc: 'Seven big glass dishes adrift in water you never see, with a scatter of pebble dishes filling the water around them — every one a petri dish of alcohol dye pressed flat on a lightbox. Translucent reds flood the dish and pool darker where they overlap; blues cut through as crisp-edged swatches; black oil throws dendrites and droplet clusters through the field; Snow White drops float on top. Every colour is a chip from Werner\'s Nomenclature, handed out by pitch — Arterial Blood Red on the biggest, lowest bowl, Snow White on the smallest, highest. Each dish is one instrument and never mixes voices: the two biggest are the bass, the middle ones the pad and the leads, then arp and bells — and the pebbles sit at the top of the series, quiet, on the bright channels. The dishes behave like marbles — knock two together and the dye leans, presses against the far side of the glass, and takes its time coming back. Nothing spins. Every swatch owns its own partial of the same deep fundamental, and every swatch is listening: sound anything on the wall that agrees with one and it swells, wanders off on the current, and slowly gives the volume back as the note dies.',
  interact: 'The dishes roam free — drifting, wandering, touching now and then. Your hands are two pressure fronts you cannot see: raise L and the west front advances, raise R and the east answers, and the dishes are herded between them. There is nothing on screen but glass and dye, so you read the force entirely in what the glass does. The fronts are not walls — each runs 40% of the way in, and at full squeeze they have claimed 80% of a tank the dishes cannot possibly fit in. So they pile, bulge back out through the fronts, and tremble there, grinding rather than knocking. Let go and the pressure withdraws, the dishes drift back out into open water, and the dye unleans. The real play is in what you are not touching: strike a bass dish and watch the swatch tuned to its harmonic bloom inside a dish clear across the tank, drift, and shrink back down.',
  sound: 'One dish, one channel. Register assigns the instrument: the two biggest play bass, the middle three pad and lead, then arp and bells, and the pebble dishes ride the bells and arp channels at about a third the weight — present, never loud. Both dishes in a collision ring, each in its own voice; a dish\'s fundamental and its swatch partials all land on that same channel, so it always speaks in a single throat. Pitches are the 2nd through 12th harmonic of the key\'s deep fundamental, so any number of simultaneous collisions form a natural chord (Ableton: sub/round bass on the bass channel, warm pad, a plucked lead, tuned log drums or glass on bells). Collisions add a glass-and-water knock as a short woody transient. Bed: near-silent root+fifth drone that swells with total motion, plus a soft underwater wash; grinds are low friction noise when glass slides on glass. Let the tails stack in a warm plate reverb — the stacked tails are what feeds the sympathetic swell in the dye.',
  init(P) {
    const m = Math.min(P.w, P.h);
    const HARM = [2, 3, 4, 5, 6, 8, 9, 10, 12, 3, 5, 6, 8, 4];
    /* Werner combination 1 · THE PETRI DISH — chip per harmonic.
       The series lands on a D major spread, which is exactly how
       the chips were pitched: D2 · A2 · D3 · F#3 · A3 · D4 · F#4 · A4 */
    const CHIP = {
      2: ['#721519', 'ARTERIAL BLOOD RED', 87, 0],
      3: ['#b73f37', 'SCARLET RED', 84, 0],
      4: ['#1c1b4b', 'PRUSSIAN BLUE', 25, 1],
      5: ['#b74b3c', 'VERMILION RED', 85, 0],
      6: ['#657abd', 'ULTRAMARINE BLUE', 29, 1],
      8: ['#cd6e57', 'AURORA RED', 86, 0],
      9: ['#cd6e57', 'AURORA RED', 86, 0],
      10: ['#7089b1', 'FLAX-FLOWER BLUE', 30, 1],
      12: ['#efe7cc', 'SNOW WHITE', 1, 2],
      16: ['#efe7cc', 'SNOW WHITE', 1, 2]
    };
    const WARM = ['#721519', '#b73f37', '#b74b3c', '#cd6e57'];
    const COOL = ['#1c1b4b', '#657abd', '#7089b1'];
    const PALE = ['#efe7cc', '#cd6e57', '#b74b3c'];
    const pick = arr => arr[(P.rand() * arr.length) | 0];
    // the continents want to read DARK against the flood, so the deep chips win
    const WARM_W = [0.5, 0.3, 0.2, 0.0];
    const COOL_W = [0.56, 0.27, 0.17];
    const wpick = (arr, ws) => {
      let x = P.rand();
      for (let i = 0; i < arr.length; i++) { x -= ws[i]; if (x <= 0) return arr[i]; }
      return arr[0];
    };

    /* Two populations. Seven PRINCIPAL dishes, big enough that you read the
       dye in them like a painting — these carry the rig: bass, pad, lead,
       arp, bell, one instrument per dish, never mixed. Then a scatter of
       PEBBLE dishes filling the water around them: small, high, quiet, but
       they still ring, and they still swell in sympathy. */
    const ROLES = ['bass', 'bass', 'pad', 'lead', 'lead', 'arp', 'bells'];
    const SMALL_HARM = [8, 9, 10, 12, 16, 12, 10, 9, 8, 12, 16, 10, 12, 9, 16, 10, 8, 12];
    const mk = (r, small) => ({
      x: P.w * (0.14 + P.rand() * 0.72), y: P.h * (0.14 + P.rand() * 0.72),
      vx: 0, vy: 0, r, small, ang: P.rand() * TAU, va: 0,
      pvx: 0, pvy: 0,
      // the fluid inside: offset (in bowl radii) + its own velocity
      sx: 0, sy: 0, svx: 0, svy: 0,
      ph: P.rand() * TAU, lastHit: 0, shock: 0, slosh: 0,
      pr: null, prR: 0
    });
    const bowls = [];
    for (let i = 0; i < 7; i++) bowls.push(mk(m * (0.095 + P.rand() * 0.105), false));
    const NS = 15 + (P.rand() * 6 | 0);
    for (let i = 0; i < NS; i++) bowls.push(mk(m * (0.019 + P.rand() * 0.030), true));

    // biggest dish = lowest harmonic = the bass end of the rig
    bowls.filter(b => !b.small).sort((a, b) => b.r - a.r).forEach((st, i) => {
      st.harm = HARM[i % HARM.length];
      st.role = ROLES[Math.min(i, ROLES.length - 1)];
      st.gain = 1;
    });
    // the pebbles live at the top of the series, on the bright channels
    bowls.filter(b => b.small).forEach((st, i) => {
      st.harm = SMALL_HARM[i % SMALL_HARM.length];
      st.role = i % 3 === 2 ? 'arp' : 'bells';
      st.gain = 0.32;
    });
    // settle the pack before the first frame, so nothing starts interpenetrating
    for (let pass = 0; pass < 90; pass++) {
      for (let i = 0; i < bowls.length; i++) {
        for (let j = i + 1; j < bowls.length; j++) {
          const a = bowls[i], b = bowls[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 0.01, min = (a.r + b.r) * 1.02;
          if (d < min) {
            const ma = a.r * a.r, mb = b.r * b.r, mt = ma + mb;
            const ov = (min - d) / d;
            a.x -= dx * ov * (mb / mt); a.y -= dy * ov * (mb / mt);
            b.x += dx * ov * (ma / mt); b.y += dy * ov * (ma / mt);
          }
        }
      }
      for (const st of bowls) {
        st.x = clamp(st.x, st.r + 6, P.w - st.r - 6);
        st.y = clamp(st.y, st.r + 6, P.h - st.r - 6);
      }
    }

    const f0 = H.rootFreq(-2);
    for (const st of bowls) {
      const chip = CHIP[st.harm] || CHIP[4];
      st.dye = chip[0]; st.dyeName = chip[1]; st.chipNo = chip[2];
      const family = chip[3];               // 0 warm · 1 cool · 2 pale
      // the flooding dye: this bowl's chip plus one or two of its own family
      const own = family === 1 ? COOL : family === 2 ? PALE : WARM;
      const other = family === 1 ? WARM : family === 2 ? WARM : COOL;
      st.fields = [];
      // the flood: one big field of this bowl's own chip, then a couple of
      // its cousins washing over it — multiplied, so the laps pool darker
      const nf = st.small ? 2 : 2 + (P.rand() * 2 | 0);
      for (let k = 0; k < nf; k++) {
        st.fields.push({
          cx: (P.rand() - 0.5) * (k === 0 ? 0.4 : 0.9),
          cy: (P.rand() - 0.5) * (k === 0 ? 0.4 : 0.9),
          rr: k === 0 ? 0.78 + P.rand() * 0.34 : 0.42 + P.rand() * 0.5,
          a1: 0.1 + P.rand() * 0.22, p1: P.rand() * TAU,
          a2: 0.05 + P.rand() * 0.16, p2: P.rand() * TAU,
          col: k === 0 ? st.dye : pick(own),
          alpha: k === 0 ? 0.72 + P.rand() * 0.24 : 0.5 + P.rand() * 0.34
        });
      }
      // crisp-edged continents of the opposing dye — each one a partial
      st.blobs = [];
      const nb = st.small ? 1 + (P.rand() * 2 | 0) : 2 + (P.rand() * 2 | 0);
      const mults = [2, 3, 4, 6];
      for (let k = 0; k < nb; k++) {
        const hb = st.harm * mults[(k + (P.rand() * 2 | 0)) % mults.length];
        st.blobs.push({
          cx: (P.rand() - 0.5) * 0.8, cy: (P.rand() - 0.5) * 0.8,
          rr: 0.15 + P.rand() * 0.24,
          a1: 0.14 + P.rand() * 0.2, p1: P.rand() * TAU,
          a2: 0.07 + P.rand() * 0.14, p2: P.rand() * TAU,
          a3: 0.03 + P.rand() * 0.07, p3: P.rand() * TAU,
          // the ragged register — what stops the silhouette reading as vector
          a4: 0.022 + P.rand() * 0.042, p4: P.rand() * TAU,
          a5: 0.012 + P.rand() * 0.026, p5: P.rand() * TAU,
          a6: 0.005 + P.rand() * 0.013, p6: P.rand() * TAU,
          col: family === 1 ? wpick(WARM, WARM_W) : wpick(COOL, COOL_W),
          harm: hb, freq: f0 * hb,
          /* Pigment does not dissolve — it pools. These are sub-lobes of the
             same colour carrying different loads of it, some drawn out into
             streaks along one axis the way a loaded colour drags. This is
             what gives the mass internal form instead of a flat fill. */
          veins: Array.from({ length: 7 + (P.rand() * 5 | 0) }, () => ({
            cx: (P.rand() - 0.5) * 1.0, cy: (P.rand() - 0.5) * 1.0,
            rr: 0.18 + P.rand() * 0.34,
            a1: 0.18 + P.rand() * 0.3, p1: P.rand() * TAU,
            a2: 0.1 + P.rand() * 0.2, p2: P.rand() * TAU,
            ang: P.rand() * TAU, squash: 0.45 + P.rand() * 0.5,
            // biased DARK: stacked translucent lobes lighten fast, and the
            // chip colour is the thing that has to survive
            a4: 0.03 + P.rand() * 0.05, p4: P.rand() * TAU,
            tone: (P.rand() - 0.66) * 0.62, alpha: 0.1 + P.rand() * 0.15
          })),
          exc: 0, ph: P.rand() * TAU, lit: 0,
          // swell + drift state: a swatch grows when it is being sung to,
          // wanders on the current while it is full, and gives it back
          g: 1, gv: 0, dx: 0, dy: 0, vx: 0, vy: 0
        });
      }
      // black oil: one soft-edged mass, with dendrites reaching out of it
      st.oil = {
        cx: (P.rand() - 0.5) * 0.9, cy: (P.rand() - 0.5) * 0.9,
        rr: 0.26 + P.rand() * 0.3
      };
      st.dend = [];
      const nd = st.small ? 1 : 2 + (P.rand() * 3 | 0);
      for (let d = 0; d < nd; d++) {
        const bx = st.oil.cx + (P.rand() - 0.5) * st.oil.rr * 1.2;
        const by = st.oil.cy + (P.rand() - 0.5) * st.oil.rr * 1.2;
        let a = P.rand() * TAU, px = bx, py = by;
        const pts = [[px, py]];
        const segs = 3 + (P.rand() * 4 | 0);
        for (let k = 0; k < segs; k++) {
          a += (P.rand() - 0.5) * 1.2;
          const len = 0.09 + P.rand() * 0.15;
          px += Math.cos(a) * len; py += Math.sin(a) * len;
          pts.push([px, py]);
        }
        // one fork off the middle of the trunk
        const fi = 1 + ((pts.length - 1) * 0.5 | 0);
        let fa = a + (P.rand() < 0.5 ? 1 : -1) * (0.7 + P.rand() * 0.8);
        let fx = pts[fi][0], fy = pts[fi][1];
        const fork = [[fx, fy]];
        for (let k = 0; k < 2 + (P.rand() * 2 | 0); k++) {
          fa += (P.rand() - 0.5) * 1.0;
          const len = 0.07 + P.rand() * 0.11;
          fx += Math.cos(fa) * len; fy += Math.sin(fa) * len;
          fork.push([fx, fy]);
        }
        st.dend.push({ pts, fork, w: 0.016 + P.rand() * 0.022 });
      }
      // black oil: droplet clusters, thrown off the mass
      st.drops = [];
      const ncl = st.small ? 1 : 1 + (P.rand() * 3 | 0);
      for (let c = 0; c < ncl; c++) {
        const cx = st.oil.cx + (P.rand() - 0.5) * 1.3, cy = st.oil.cy + (P.rand() - 0.5) * 1.3;
        const cn = 3 + (P.rand() * 6 | 0);
        for (let k = 0; k < cn; k++) {
          st.drops.push({
            cx: cx + (P.rand() - 0.5) * 0.34, cy: cy + (P.rand() - 0.5) * 0.34,
            rr: 0.012 + P.rand() * 0.055
          });
        }
      }
      // Snow White drops floating on top
      st.whites = [];
      const nw = st.small ? 1 + (P.rand() * 3 | 0) : 3 + (P.rand() * 5 | 0);
      for (let k = 0; k < nw; k++) {
        st.whites.push({
          cx: (P.rand() - 0.5) * 1.3, cy: (P.rand() - 0.5) * 1.3,
          rr: 0.024 + P.rand() * 0.05, ph: P.rand() * TAU
        });
      }
    }
    P.state = { bowls, ripples: [], chips: [], energy: 0, grind: 0, ring: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    let energy = 0, grind = 0;
    /* Everything here moves at oil speed now, so the impact speeds that
       count as "a knock" are small numbers. One floor, stated once. */
    const SOUND_FLOOR = 11;
    /* Two pressure fronts, invisible, one per hand. They are not barriers, so
       nothing here is capped by what the pack can geometrically hold: each
       front runs 40% of the way in, and at full squeeze the two of them have
       claimed 80% of the tank. The dishes cannot fit in what is left — that
       is deliberate. They pile, they bulge back out through the fronts, and
       they tremble there under the pressure. */
    const TRAVEL = 0.40;
    const wallL = w * (0.02 + inp.L * TRAVEL);
    const wallR = w * (0.98 - inp.R * TRAVEL);
    const wallVL = (wallL - (s.prevWallL !== undefined ? s.prevWallL : wallL)) / Math.max(dt, 1e-4);
    const wallVR = (wallR - (s.prevWallR !== undefined ? s.prevWallR : wallR)) / Math.max(dt, 1e-4);
    s.prevWallL = wallL; s.prevWallR = wallR;
    s.wallL = wallL; s.wallR = wallR;

    /* With the pressure off, the dishes want the whole tank. Left alone they
       clump toward the middle and leave dead canvas at the edges, so the pack
       gets a weak outward appetite that stops the moment it fills the frame —
       and fades out entirely as you start to squeeze. Uniform push rather
       than centrifugal, so the pack expands instead of hollowing out. */
    const press = Math.max(inp.L, inp.R);
    let spread = 0, packCx = w / 2;
    if (press < 0.85) {
      let lo = 1e9, hi = -1e9;
      for (const st of s.bowls) { if (st.x - st.r < lo) lo = st.x - st.r; if (st.x + st.r > hi) hi = st.x + st.r; }
      packCx = (lo + hi) / 2;
      const span = (hi - lo) / w;
      if (span < 0.86) spread = (0.86 - span) * (1 - press / 0.85) * 150;
    }

    for (const st of s.bowls) {
      const pvx = st.vx, pvy = st.vy;
      // slow currents, heavy water — the bed drifts, it does not swim
      st.vx += (Math.sin(t * 0.13 + st.ph) + Math.sin(t * 0.06 + st.ph * 3)) * dt * 13;
      st.vy += (Math.cos(t * 0.11 + st.ph * 2) + Math.cos(t * 0.17 + st.ph)) * dt * 13;
      if (spread > 0) st.vx += Math.sign(st.x - packCx) * spread * dt;
      /* PRESSURE, not a wall. The push grows with how far a dish has been
         driven past the front, so a dish with momentum behind it — or half
         the pack shoving it — rides straight through and sits outside the
         line, trembling against the force. That bulge is the release valve
         that lets the fronts claim 80% of a tank the glass cannot fit in.
         A sweeping front adds its own shove, but only where it has reached. */
      const PRESS = 22, SWEEP = 0.35;
      const penL = (wallL + st.r) - st.x;
      if (penL > 0) st.vx += (penL * PRESS + Math.max(0, wallVL) * SWEEP) * dt;
      const penR = st.x - (wallR - st.r);
      if (penR > 0) st.vx -= (penR * PRESS + Math.max(0, -wallVR) * SWEEP) * dt;

      const drag = Math.pow(0.45, dt);
      st.vx *= drag; st.vy *= drag; st.va *= Math.pow(0.4, dt);
      st.x += st.vx * dt; st.y += st.vy * dt; st.ang += st.va * dt;
      // the tank itself is still hard — nothing ever leaves the frame
      const pad = st.r + 4;
      if (st.x < pad) { st.x = pad; st.vx = Math.abs(st.vx) * 0.3; }
      if (st.x > w - pad) { st.x = w - pad; st.vx = -Math.abs(st.vx) * 0.3; }
      if (st.y < pad) { st.y = pad; st.vy = Math.abs(st.vy) * 0.3; }
      if (st.y > h - pad) { st.y = h - pad; st.vy = -Math.abs(st.vy) * 0.3; }
      // terminal velocity: heavy glass in heavy water has one, and it is low
      const sp = Math.hypot(st.vx, st.vy), CAP = 130;
      if (sp > CAP) { const k = CAP / sp; st.vx *= k; st.vy *= k; }
      energy += Math.hypot(st.vx, st.vy);

      /* ---- the fluid inside is OIL, not water: a long slow spring under
             heavy viscosity, so a knock sets it leaning over a second or two
             and it takes its time coming back ---- */
      /* Clamp the acceleration hard. Under full pressure a dish changes
         direction every few frames, and the raw spikes would ratchet the dye
         straight onto the glass and hold it there. Oil leans; it does not
         get pinned. */
      const ax = clamp((st.vx - pvx) / Math.max(dt, 1e-4), -600, 600);
      const ay = clamp((st.vy - pvy) / Math.max(dt, 1e-4), -600, 600);
      st.pvx = st.vx; st.pvy = st.vy;
      const K = 13, C = 2.2, COUP = 0.0022;
      st.svx += (-ax * COUP - st.sx * K) * dt;
      st.svy += (-ay * COUP - st.sy * K) * dt;
      const fd = Math.min(1, C * dt);
      st.svx -= st.svx * fd; st.svy -= st.svy * fd;
      st.sx += st.svx * dt; st.sy += st.svy * dt;
      /* The dye cannot leave the glass — but it does not bounce off the inside
         of it either. It compresses, asymptotically, and stays pressed there
         for as long as you hold the pressure. Rebounding here was producing a
         chatter that read as vibration rather than weight. */
      const sm = Math.hypot(st.sx, st.sy);
      if (sm > 0.24) {
        const eased = 0.24 + 0.10 * (1 - Math.exp(-(sm - 0.24) / 0.09));
        const k = eased / sm;
        st.sx *= k; st.sy *= k;
        const nx = st.sx / eased, ny = st.sy / eased;
        const out = st.svx * nx + st.svy * ny;
        if (out > 0) { st.svx -= nx * out * 0.92; st.svy -= ny * out * 0.92; }
      }
      st.slosh = Math.min(1, Math.hypot(st.sx, st.sy) / 0.34);
      st.shock *= Math.pow(0.3, dt);
    }

    // bowl-on-bowl
    for (let i = 0; i < s.bowls.length; i++) {
      for (let j = i + 1; j < s.bowls.length; j++) {
        const a = s.bowls[i], b = s.bowls[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.94;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d;
          // a pebble cannot shove a big dish: everything is weighted by area
          const ma = a.r * a.r, mb = b.r * b.r, mt = ma + mb;
          const wa = mb / mt, wb = ma / mt;
          const overlap = min - d;
          a.x -= nx * overlap * wa; a.y -= ny * overlap * wa;
          b.x += nx * overlap * wb; b.y += ny * overlap * wb;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          const tangV = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
          const tang = Math.abs(tangV);
          grind += tang;
          if (rel < 0) {
            /* Mostly INELASTIC, with barely any recoil. These are heavy
               dishes meeting in water: they touch, they lean on each other,
               they part. Nothing bounces. The energy goes into the dye
               instead — which is where you want to be looking anyway. */
            const imp = -rel * 0.34 + 3;
            const ia = imp * 2 * wa, ib = imp * 2 * wb;
            a.vx -= ia * nx; a.vy -= ia * ny;
            b.vx += ib * nx; b.vy += ib * ny;
            a.va += (P.rand() - 0.5) * ia * 0.012;
            b.va += (P.rand() - 0.5) * ib * 0.012;
            // the dye keeps going: it leans, slowly, toward the point of contact
            const KICK = 0.022;
            a.svx += ia * nx * KICK; a.svy += ia * ny * KICK;
            b.svx -= ib * nx * KICK; b.svy -= ib * ny * KICK;
            // the shear of a glancing blow drags the swatches sideways
            const SHEAR = 0.004;
            for (const bl of a.blobs) { bl.vx += -tangV * ny * SHEAR; bl.vy += tangV * nx * SHEAR; }
            for (const bl of b.blobs) { bl.vx += tangV * ny * SHEAR; bl.vy += -tangV * nx * SHEAR; }
            const speed = -rel;
            if (speed > SOUND_FLOOR) {
              a.shock = b.shock = 1;
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              s.ripples.push({ x: mx, y: my, t });
              // one mote per contact, hard-capped: under a sustained crush
              // these were piling into gold glitter across the whole pack
              if (s.chips.length < 36) s.chips.push({ x: mx, y: my, vx: (P.rand() - 0.5) * 16, vy: (P.rand() - 0.5) * 16, life: 1.4 });
              const f0 = H.rootFreq(-2);
              const baseVol = clamp((speed - SOUND_FLOOR) / 90, 0.035, 0.2);
              const pan = (mx / w) * 2 - 1;
              /* BOTH dishes ring — each in its own voice, at its own weight.
                 The bowl is the instrument: its fundamental and whichever
                 swatch took the blow land on the same channel, so a dish
                 always speaks with one throat. The pebbles are quiet AND
                 sparse: they need a harder knock and a longer rest between
                 notes, so they read as sparkle over the top rather than a
                 wash underneath. */
              const shots = [];
              for (const st of [a, b]) {
                const other = st === a ? b : a;
                const dominant = st.r >= other.r;
                // whichever swatch sits nearest the point of contact takes the blow
                let best = null, bd = 1e9;
                for (const bl of st.blobs) {
                  const bx = st.x + (bl.cx + bl.dx + st.sx) * st.r;
                  const by = st.y + (bl.cy + bl.dy + st.sy) * st.r;
                  const dd = (bx - mx) * (bx - mx) + (by - my) * (by - my);
                  if (dd < bd) { bd = dd; best = bl; }
                }
                if (best) best.lit = 1;
                if (speed < (st.small ? SOUND_FLOOR * 2 : SOUND_FLOOR)) continue;
                /* A dish trembling under full pressure touches its neighbours
                   constantly. Without a real rest between notes it turns into
                   a wash — so each dish gets a long enforced silence, and what
                   comes through is the sparse top of the clatter, not all of it. */
                if (t - st.lastHit < (st.small ? 1.2 : 0.55)) continue;
                st.lastHit = t;
                const vol = baseVol * (st.gain || 1) * (dominant ? 1 : 0.55);
                if (vol < 0.011) continue;
                shots.push({
                  role: st.role || 'lead', harm: st.harm, r: st.r, vol,
                  partial: best ? best.freq : 0, knock: dominant
                });
              }
              if (shots.length) P.ping(A => {
                for (const sh of shots) {
                  const f = f0 * sh.harm, dur = 0.5 + sh.r / 40, vol = sh.vol;
                  if (sh.knock) A.hit({ vol: vol * 0.9, dur: 0.035, freq: 1500 + sh.harm * 120, q: 2.4, pan });
                  if (sh.role === 'bass') {
                    A.bassNote(f, { vol: vol * 1.1, dur: dur * 2.2, rev: 0.2 });
                  } else if (sh.role === 'bells') {
                    A.bell(f, { vol: vol * 0.8, dur: 1.6 + dur, pan, rev: 0.55, del: 0.14 });
                  } else if (sh.role === 'arp') {
                    A.pluck2(f, { vol: vol * 1.1, dur: 0.9, pan, rev: 0.4, del: 0.2, role: 'arp' });
                  } else if (sh.role === 'pad') {
                    A.tone(f, { vol: vol * 0.85, dur: dur * 3, attack: 0.14, type: 'sine', pan, rev: 0.6, role: 'pad' });
                    A.tone(f * 1.5, { vol: vol * 0.3, dur: dur * 2.6, attack: 0.18, type: 'sine', pan, rev: 0.6, role: 'pad' });
                  } else {
                    A.tone(f, { vol, dur, type: 'triangle', pan, rev: 0.4, role: 'lead' });
                    A.tone(f * 2, { vol: vol * 0.24, dur: dur * 0.5, type: 'sine', pan, rev: 0.4, role: 'lead' });
                  }
                  // the swatch that took the blow speaks in the same voice
                  if (sh.partial) {
                    if (sh.role === 'bells') A.bell(sh.partial, { vol: vol * 0.3, dur: 1.4, pan, rev: 0.6 });
                    else if (sh.role === 'arp') A.pluck2(sh.partial, { vol: vol * 0.34, dur: 0.7, pan, rev: 0.45, role: 'arp' });
                    else if (sh.role === 'bass') A.tone(sh.partial, { vol: vol * 0.3, dur: 1.2, type: 'sine', pan, rev: 0.4, role: 'bass' });
                    else A.tone(sh.partial, { vol: vol * 0.4, dur: 0.9, type: sh.role === 'pad' ? 'sine' : 'triangle', attack: sh.role === 'pad' ? 0.12 : 0.006, pan, rev: 0.55, del: 0.2, role: sh.role });
                  }
                }
              });
            }
          }
        }
      }
    }

    /* A dense pack of very different sizes will not separate in one pass, and
       glass that interpenetrates stops reading as glass. Two extra
       position-only relaxations, no impulses, no sound. */
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < s.bowls.length; i++) {
        for (let j = i + 1; j < s.bowls.length; j++) {
          const a = s.bowls[i], b = s.bowls[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.94;
          if (d < min && d > 0.01) {
            // split the correction EVENLY, not by mass: this is a constraint
            // solve, and mass weighting lets a pebble get crushed against a
            // big dish that refuses to yield. Mass still governs the impulse.
            const ov = (min - d) / d * 0.5;
            a.x -= dx * ov; a.y -= dy * ov;
            b.x += dx * ov; b.y += dy * ov;
          }
        }
      }
      // only the tank is hard here. The fronts are a force, and the pack is
      // free to bulge back out through them — that is what makes it tremble.
      for (const st of s.bowls) {
        st.x = clamp(st.x, st.r + 4, w - st.r - 4);
        st.y = clamp(st.y, st.r + 4, h - st.r - 4);
        // hold the terminal velocity after the impulses too, not just before
        const v = Math.hypot(st.vx, st.vy);
        if (v > 130) { const k = 130 / v; st.vx *= k; st.vy *= k; }
      }
    }

    /* ---- sympathy: every swatch listens to the whole board, and answers
           by taking on volume and drifting, not by shaking ---- */
    let ring = 0;
    const bus = AE.SB;
    for (const st of s.bowls) {
      for (const bl of st.blobs) {
        const e = bus ? bus.excite(bl.freq) : 0;
        // slow to fill, slower to empty — an excited swatch stays swollen
        bl.exc += (e - bl.exc) * Math.min(1, dt * (e > bl.exc ? 4.5 : 0.9));
        bl.lit *= Math.pow(0.25, dt);
        const drive = Math.max(bl.exc, bl.lit);
        if (bl.exc > ring) ring = bl.exc;

        // SWELL — a slow spring under heavy damping: it takes about a second
        // to bloom and several to give the volume back. It never bounces.
        const target = 1 + drive * 0.85;
        bl.gv += (target - bl.g) * 9 * dt;
        bl.gv *= Math.pow(0.02, dt);
        bl.g += bl.gv * dt;

        // OOZE — a very slow divergence-free current under high viscosity, so
        // the swatch creeps toward its excursion instead of swimming there
        const px = bl.cx + bl.dx, py = bl.cy + bl.dy;
        const cur = 0.03 + drive * 0.8;
        const fx = Math.sin(py * 2.6 + t * 0.2 + bl.ph) * Math.cos(px * 1.9 - t * 0.13);
        const fy = -Math.cos(px * 2.6 - t * 0.18 + bl.ph) * Math.sin(py * 1.9 + t * 0.15);
        bl.vx += (fx * cur - bl.dx * 1.1 + st.svx * 0.9) * dt;
        bl.vy += (fy * cur - bl.dy * 1.1 + st.svy * 0.9) * dt;
        const bd = Math.pow(0.02, dt);
        bl.vx *= bd; bl.vy *= bd;
        bl.dx += bl.vx * dt; bl.dy += bl.vy * dt;
        const dm = Math.hypot(bl.dx, bl.dy);
        if (dm > 0.32) { const k = 0.32 / dm; bl.dx *= k; bl.dy *= k; bl.vx *= 0.3; bl.vy *= 0.3; }

        /* No swatch-to-body feedback. It reads well for a second and then
           runs away: the body pushes the swatch, the swatch pushes the body,
           and the dye ends up pinned against the glass permanently. The
           slosh belongs to the bowl's own motion and its collisions. */
      }
    }
    s.ring += (ring - s.ring) * Math.min(1, dt * 8);

    s.energy += (Math.min(1, energy / (s.bowls.length * 26)) - s.energy) * Math.min(1, dt * 1.6);
    s.grind += (Math.min(1, grind / 150) - s.grind) * Math.min(1, dt * 2.5);
    s.ripples = s.ripples.filter(rp => t - rp.t < 3.4);
    for (const c of s.chips) { c.x += c.vx * dt; c.y += c.vy * dt; c.life -= dt * 0.7; }
    s.chips = s.chips.filter(c => c.life > 0);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,4,8,0.5)'; g.fillRect(0, 0, w, h);

    const hexa = (hex, a) => {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };
    // the same colour carrying more or less pigment — never a different colour
    const shade = (hex, k, a) => {
      const n = parseInt(hex.slice(1), 16);
      let R = (n >> 16) & 255, G = (n >> 8) & 255, B = n & 255;
      if (k >= 0) { R += (255 - R) * k; G += (255 - G) * k; B += (255 - B) * k; }
      else { const m = 1 + k; R *= m; G *= m; B *= m; }
      return `rgba(${R | 0},${G | 0},${B | 0},${a})`;
    };
    // one shared outline routine so the baked fluid and the live blobs agree
    const outline = (q, o, u, extra) => {
      q.beginPath();
      // paint has a ragged edge; a smooth one is the loudest tell that this
      // is a vector shape. The high harmonics need the extra vertices.
      const NV = o.a4 ? 68 : 34;
      for (let k = 0; k <= NV; k++) {
        const a = k / NV * TAU;
        let rr = o.rr * (1
          + o.a1 * Math.cos(a + o.p1)
          + o.a2 * Math.cos(2 * a + o.p2)
          + (o.a3 ? o.a3 * Math.cos(3 * a + o.p3) : 0)
          + (o.a4 ? o.a4 * Math.cos(5 * a + o.p4) : 0)
          + (o.a5 ? o.a5 * Math.cos(9 * a + o.p5) : 0)
          + (o.a6 ? o.a6 * Math.cos(15 * a + o.p6) : 0));
        if (extra) rr *= 1 + extra.amp * Math.sin(a * extra.n + extra.ph);
        const x = (o.cx + Math.cos(a) * rr) * u, y = (o.cy + Math.sin(a) * rr) * u;
        k === 0 ? q.moveTo(x, y) : q.lineTo(x, y);
      }
      q.closePath();
    };

    /* PIGMENT GRAIN — one seamless tile, built once, shared by every dish.
       This is what stops the dye reading as flat vector: real pigment is
       suspended, not dissolved, so it clumps at several scales and settles
       unevenly. Three octaves of soft blotches over a fine tooth. Mid-grey
       base, so it can be composited in `overlay` and lift the lights while
       it deepens the darks — which is exactly how a loaded, oily colour
       behaves against a thin wash of the same colour. */
    if (!s.grain) {
      const SZ = 96;
      const c = document.createElement('canvas');
      c.width = c.height = SZ;
      const q = c.getContext('2d');
      let sd = 0x9e3779b9;
      const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      q.fillStyle = '#808080'; q.fillRect(0, 0, SZ, SZ);
      const OCT = [[26, SZ * 0.20], [90, SZ * 0.085], [300, SZ * 0.026]];
      for (const [n, rad0] of OCT) {
        for (let i = 0; i < n; i++) {
          const x = rnd() * SZ, y = rnd() * SZ;
          const dark = rnd() < 0.56;
          const a = 0.09 + rnd() * 0.2;
          const col = dark ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
          const rad = rad0 * (0.5 + rnd());
          // wrap the blotch across the seams so the tile repeats invisibly
          for (const [ox, oy] of [[0, 0], [SZ, 0], [-SZ, 0], [0, SZ], [0, -SZ]]) {
            const px = x + ox, py = y + oy;
            if (px < -rad || px > SZ + rad || py < -rad || py > SZ + rad) continue;
            const gr = q.createRadialGradient(px, py, 0, px, py, rad);
            gr.addColorStop(0, col);
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            q.fillStyle = gr;
            q.beginPath(); q.arc(px, py, rad, 0, TAU); q.fill();
          }
        }
      }
      // fine tooth, the way pigment sits in the weave of the surface
      const img = q.getImageData(0, 0, SZ, SZ);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (rnd() - 0.5) * 52;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      q.putImageData(img, 0, 0);
      s.grain = c;
    }
    if (!s.grainPat) s.grainPat = g.createPattern(s.grain, 'repeat');
    /* Unit-space gradients, cached once and reused for every swatch by
       transforming the context instead of rebuilding them per frame. */
    if (!s.bodyG) {
      const bg = g.createRadialGradient(0, 0, 0.28, 0, 0, 1.04);
      bg.addColorStop(0, 'rgba(0,0,0,0)');
      bg.addColorStop(0.6, 'rgba(16,8,14,0.07)');
      bg.addColorStop(0.88, 'rgba(16,8,14,0.2)');
      bg.addColorStop(1, 'rgba(14,6,12,0.4)');
      s.bodyG = bg;
      // a small wet glint, not a broad wash — a wash reads as plastic
      const sh = g.createRadialGradient(-0.34, -0.4, 0.02, -0.34, -0.4, 0.5);
      sh.addColorStop(0, 'rgba(255,252,244,0.2)');
      sh.addColorStop(0.45, 'rgba(255,250,238,0.05)');
      sh.addColorStop(1, 'rgba(255,255,255,0)');
      s.sheenG = sh;
    }

    /* Bake each bowl's still dye once: cream lightbox ground, flooding
       dye fields multiplied so overlaps pool darker, black oil on top.
       The blobs and the white drops stay live so they can shudder. */
    const bake = (st) => {
      const R = Math.max(7, Math.round(st.r));
      // supersample the small dishes, cap the big ones so memory stays sane
      const SS = Math.max(0.8, Math.min(R < 26 ? 2 : 1.5, 620 / (R * 2.8)));
      const size = Math.max(24, Math.round(R * 2.8 * SS));
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const q = c.getContext('2d');
      if (!q) return;
      const u = R * SS;
      q.translate(size / 2, size / 2);
      // backlit ground — a dish on a lightbox, warm at the centre
      const lg = q.createRadialGradient(0, 0, u * 0.05, 0, 0, u * 1.5);
      lg.addColorStop(0, '#f6efdc');
      lg.addColorStop(0.55, '#e4d9bc');
      lg.addColorStop(1, '#c2ad88');
      q.fillStyle = lg;
      q.fillRect(-size / 2, -size / 2, size, size);
      // flooding dye — each wash darkens where it laps the last
      q.globalCompositeOperation = 'multiply';
      for (const f of st.fields) {
        outline(q, f, u);
        q.fillStyle = hexa(f.col, f.alpha);
        q.fill();
        // pigment carried to the edge of the wash and stranded there as it
        // dries — the halo every alcohol dye leaves at its own boundary
        q.save();
        outline(q, f, u); q.clip();
        q.translate(f.cx * u, f.cy * u); q.scale(f.rr * u, f.rr * u);
        const eg = q.createRadialGradient(0, 0, 0.55, 0, 0, 1.02);
        eg.addColorStop(0, 'rgba(255,255,255,0)');
        eg.addColorStop(0.86, hexa(f.col, 0.1));
        eg.addColorStop(1, hexa(f.col, 0.42));
        q.fillStyle = eg;
        q.fillRect(-1.2, -1.2, 2.4, 2.4);
        q.restore();
      }
      q.globalCompositeOperation = 'source-over';
      // suspended pigment through the whole flood
      if (s.grain) {
        const pat = q.createPattern(s.grain, 'repeat');
        if (pat) {
          q.save();
          q.globalCompositeOperation = 'soft-light';
          q.fillStyle = pat;
          q.fillRect(-size / 2, -size / 2, size, size);
          q.restore();
        }
      }
      // the black oil mass — soft-edged, the way oil sits under alcohol
      if (st.oil) {
        const og = q.createRadialGradient(st.oil.cx * u, st.oil.cy * u, st.oil.rr * u * 0.15,
          st.oil.cx * u, st.oil.cy * u, st.oil.rr * u);
        og.addColorStop(0, 'rgba(16,13,16,0.9)');
        og.addColorStop(0.55, 'rgba(22,18,22,0.66)');
        og.addColorStop(1, 'rgba(26,20,24,0)');
        q.fillStyle = og;
        q.beginPath(); q.arc(st.oil.cx * u, st.oil.cy * u, st.oil.rr * u, 0, TAU); q.fill();
      }
      // black oil dendrites
      q.lineCap = 'round'; q.lineJoin = 'round';
      for (const d of st.dend) {
        for (const path of [d.pts, d.fork]) {
          q.strokeStyle = 'rgba(8,6,9,0.9)';
          q.lineWidth = Math.max(0.7, d.w * u);
          q.beginPath();
          path.forEach((p, k) => k === 0 ? q.moveTo(p[0] * u, p[1] * u) : q.lineTo(p[0] * u, p[1] * u));
          q.stroke();
        }
      }
      // black oil droplet clusters
      for (const d of st.drops) {
        q.fillStyle = 'rgba(10,8,11,0.9)';
        q.beginPath(); q.arc(d.cx * u, d.cy * u, Math.max(0.5, d.rr * u), 0, TAU); q.fill();
        // each droplet has its own tiny window of light
        q.fillStyle = 'rgba(255,250,235,0.3)';
        q.beginPath(); q.arc((d.cx - d.rr * 0.3) * u, (d.cy - d.rr * 0.35) * u, Math.max(0.3, d.rr * u * 0.3), 0, TAU); q.fill();
      }
      st.pr = c; st.prR = R; st.prSpan = R * 2.8;
    };

    /* The walls are not drawn. They are pressure, and pressure is invisible —
       you read it in what the dishes do, the way you read the water by how
       they move. Nothing on screen but glass, dye and the dark. */

    // ripples — the only proof of water, and they take their time
    for (const rp of s.ripples) {
      const k = (t - rp.t) / 3.4;
      g.strokeStyle = `rgba(110,220,215,${(1 - k) * 0.34})`;
      g.lineWidth = 1.4 * (1 - k);
      g.beginPath(); g.arc(rp.x, rp.y, 8 + k * 74, 0, TAU); g.stroke();
      g.strokeStyle = `rgba(110,220,215,${(1 - k) * 0.15})`;
      g.beginPath(); g.arc(rp.x, rp.y, 4 + k * 44, 0, TAU); g.stroke();
    }

    // bowls
    let baked = 0;
    for (const st of s.bowls) {
      if (!st.pr && baked < 3) { bake(st); baked++; }
      const r = st.r;
      g.save();
      g.translate(st.x, st.y);

      // the water under the glass
      g.fillStyle = 'rgba(0,0,0,0.34)';
      g.beginPath(); g.ellipse(r * 0.1, r * 0.16, r * 1.02, r * 0.98, 0, 0, TAU); g.fill();

      g.save();
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();

      if (st.pr) {
        // the fluid layer: displaced by slosh and piled up along the direction
        // of travel. It never rotates — dye slides, it doesn't spin.
        g.save();
        g.translate(st.sx * r, st.sy * r);
        const sl = st.slosh || 0;
        if (sl > 0.02) {
          const sa = Math.atan2(st.sy, st.sx);
          g.rotate(sa);
          g.scale(1 + sl * 0.34, 1 - sl * 0.16);
          g.rotate(-sa);
        }
        const span = r * 2.8;
        g.drawImage(st.pr, -span / 2, -span / 2, span, span);

        // crisp-edged continents — live, because these are the resonators
        for (const bl of st.blobs) {
          const exc = Math.max(bl.exc, bl.lit * 0.8);
          // a slow surface undulation, not a tremble — the swatch is liquid
          const extra = exc > 0.01
            ? { amp: exc * 0.09, n: 3, ph: bl.ph + t * 0.7 }
            : null;
          const o = {
            cx: bl.cx + bl.dx, cy: bl.cy + bl.dy, rr: bl.rr * bl.g,
            a1: bl.a1, p1: bl.p1, a2: bl.a2, p2: bl.p2, a3: bl.a3, p3: bl.p3,
            a4: bl.a4, p4: bl.p4, a5: bl.a5, p5: bl.p5, a6: bl.a6, p6: bl.p6
          };
          /* Still no outline — dye has no edge, it just stops being dye. But
             it does have BODY. Laid down in five passes, the way a loaded
             colour actually sits: a shadow underneath because the paint
             stands off the surface, the colour itself, suspended pigment
             clumping through it, density piling up toward the dye front, and
             a wet sheen across the shoulder. */
          const lift = Math.max(1, r * 0.02);
          outline(g, { ...o, cx: o.cx + lift / r * 0.9, cy: o.cy + lift / r * 1.2 }, r, extra);
          g.fillStyle = 'rgba(28,12,20,0.30)';
          g.fill();

          g.save();
          outline(g, o, r, extra);
          g.clip();
          const bx = (o.cx - o.rr * 1.5) * r, by = (o.cy - o.rr * 1.5) * r, bs = o.rr * 3 * r;
          g.fillStyle = hexa(bl.col, 0.96);
          g.fillRect(bx, by, bs, bs);

          // pigment pooling — the internal form. Lobes of the same colour at
          // different loads, some dragged out into streaks along one axis.
          for (const v of bl.veins) {
            g.save();
            g.translate((o.cx + v.cx * o.rr) * r, (o.cy + v.cy * o.rr) * r);
            g.rotate(v.ang);
            g.scale(1, v.squash);
            outline(g, { cx: 0, cy: 0, rr: v.rr * o.rr, a1: v.a1, p1: v.p1, a2: v.a2, p2: v.p2, a4: v.a4, p4: v.p4 }, r, null);
            g.fillStyle = shade(bl.col, v.tone, v.alpha);
            g.fill();
            g.restore();
          }

          /* Suspended grain in two octaves — soft-light, so it textures
             without bleaching. The coarse pass is what you actually see as
             "thick"; the fine pass is the tooth underneath it. */
          g.save();
          g.globalCompositeOperation = 'soft-light';
          g.translate(o.cx * r * 0.5, o.cy * r * 0.5);
          g.fillStyle = s.grainPat;
          g.fillRect(bx - r, by - r, bs + r * 2, bs + r * 2);
          g.globalAlpha = 0.75;
          g.scale(3.4, 3.4);
          g.fillRect((bx - r) / 3.4, (by - r) / 3.4, (bs + r * 2) / 3.4, (bs + r * 2) / 3.4);
          g.restore();

          // the dye front is where the pigment piles up thickest
          g.save();
          g.translate(o.cx * r, o.cy * r);
          g.scale(o.rr * r, o.rr * r);
          g.fillStyle = s.bodyG;
          g.fillRect(-1.3, -1.3, 2.6, 2.6);
          // wet sheen across the upper shoulder — oil is never matte
          g.fillStyle = s.sheenG;
          g.fillRect(-1.3, -1.3, 2.6, 2.6);
          g.restore();

          if (exc > 0.06) {
            // standing ripple through the body of a ringing swatch
            for (let k = 1; k <= 3; k++) {
              g.strokeStyle = `rgba(255,252,240,${exc * 0.07 / k})`;
              g.lineWidth = Math.max(0.5, r * 0.008);
              g.beginPath();
              g.arc(o.cx * r, o.cy * r, o.rr * r * (k / 3.4) * (1 + Math.sin(t * 0.9 + k) * 0.08), 0, TAU);
              g.stroke();
            }
          }
          g.restore();
        }

        // Snow White drops floating on top — they lag the dye a little more
        for (const wd of st.whites) {
          const dx = (wd.cx - st.sx * 0.3) * r, dy = (wd.cy - st.sy * 0.3) * r;
          const rr = Math.max(0.8, wd.rr * r);
          g.fillStyle = 'rgba(239,231,204,0.94)';
          g.beginPath(); g.arc(dx, dy, rr, 0, TAU); g.fill();
          g.fillStyle = 'rgba(255,255,252,0.9)';
          g.beginPath(); g.arc(dx - rr * 0.3, dy - rr * 0.34, rr * 0.36, 0, TAU); g.fill();
        }
        g.restore();
      } else {
        g.fillStyle = '#efe7cc';
        g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      }

      // meniscus — dye climbing the inside of the glass (cached: shape is fixed)
      if (!st.menG) {
        const men = g.createRadialGradient(0, 0, r * 0.7, 0, 0, r);
        men.addColorStop(0, 'rgba(0,0,0,0)');
        men.addColorStop(0.82, 'rgba(40,16,16,0.1)');
        men.addColorStop(1, 'rgba(28,10,12,0.5)');
        st.menG = men;
      }
      g.fillStyle = st.menG;
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();

      // the shock of a knock, read on the surface
      if (st.shock > 0.02) {
        g.strokeStyle = `rgba(255,252,240,${st.shock * 0.3})`;
        g.lineWidth = Math.max(0.6, r * 0.02);
        g.beginPath(); g.arc(-st.sx * r * 1.4, -st.sy * r * 1.4, r * (0.3 + (1 - st.shock) * 0.7), 0, TAU); g.stroke();
      }
      g.restore(); // end clip

      // the glass itself
      g.strokeStyle = 'rgba(20,10,12,0.55)';
      g.lineWidth = Math.max(1, r * 0.05);
      g.beginPath(); g.arc(0, 0, r * 0.985, 0, TAU); g.stroke();
      g.strokeStyle = `rgba(255,238,214,${0.34 + Math.min(1, Math.hypot(st.vx, st.vy) / 120) * 0.4 + s.ring * 0.2})`;
      g.lineWidth = Math.max(0.8, r * 0.026);
      g.beginPath(); g.arc(0, 0, r * 0.965, 0, TAU); g.stroke();
      // specular window on the glass
      const hx = -r * 0.36, hy = -r * 0.4;
      if (!st.specG) {
        const spec = g.createRadialGradient(hx, hy, 1, hx, hy, r * 0.52);
        spec.addColorStop(0, 'rgba(255,255,255,0.3)');
        spec.addColorStop(0.4, 'rgba(255,255,255,0.07)');
        spec.addColorStop(1, 'rgba(255,255,255,0)');
        st.specG = spec;
      }
      g.save();
      g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();
      g.fillStyle = st.specG;
      g.beginPath(); g.ellipse(hx, hy, r * 0.5, r * 0.32, -0.55, 0, TAU); g.fill();
      g.restore();
      // a bright arc where the rim catches the wall light
      g.strokeStyle = `rgba(255,214,170,${0.2 + (inp.L + inp.R) * 0.25})`;
      g.lineWidth = Math.max(0.6, r * 0.022);
      g.beginPath(); g.arc(0, 0, r * 0.99, Math.PI * 1.05, Math.PI * 1.55); g.stroke();

      g.restore();
    }

    // chips
    for (const c of s.chips) {
      g.fillStyle = `rgba(240,190,130,${c.life * 0.4})`;
      g.fillRect(c.x, c.y, 2, 2);
    }
    g.fillStyle = 'rgba(235,190,150,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('PRESSURE W ' + Math.round(inp.L * 100) + '%  E ' + Math.round(inp.R * 100) +
      '%  MOTION ' + Math.round(s.energy * 100) + '%  SYMPATHY ' + Math.round(s.ring * 100) +
      '%  RIG ' + s.bowls.filter(b => !b.small).map(b => (b.role || '').slice(0, 2).toUpperCase()).join(' ') +
      ' + ' + s.bowls.filter(b => b.small).length + ' PEBBLES', 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const o1 = v.osc('sine', H.rootFreq(-2)), o2 = v.osc('sine', H.rootFreq(-2) * 1.5);
    const og = v.g(0.03);
    o1.connect(og); o2.connect(og); og.connect(v.group);
    H.onChord(() => {
      A.set(o1.frequency, H.rootFreq(-2), 2);
      A.set(o2.frequency, H.rootFreq(-2) * 1.5, 2.4);
    });
    const wash = v.noise();
    const wf = v.filter('lowpass', 300, 0.5);
    const wg = v.g(0.012);
    wash.connect(wf); wf.connect(wg); wg.connect(v.group);
    const grindN = v.noise();
    const gf = v.filter('bandpass', 480, 1.4);
    const gg = v.g(0);
    grindN.connect(gf); gf.connect(gg); gg.connect(v.group);
    v.fadeIn(1, 1.4);
    // the drone is on the bus too, so the bowls answer the bed itself
    let bedT = 0;
    return {
      tick(inp) {
        const s = P.state;
        A.set(og.gain, 0.018 + s.energy * 0.055, 0.4);
        /* Under a sustained crush the dishes are not knocking, they are
           GRINDING against each other. Let the friction bed carry that
           intensity instead of firing more discrete notes at it. */
        A.set(gg.gain, s.grind * 0.11, 0.2);
        A.set(wg.gain, 0.008 + s.energy * 0.02, 0.4);
        // publish the drone to the sounding bus on a slow tick
        const now = A.t();
        if (A.SB && now - bedT > 1.4) {
          bedT = now;
          const f = H.rootFreq(-2);
          A.SB.push(f, 0.05 + s.energy * 0.05, now, 1.6);
          A.SB.push(f * 1.5, 0.035 + s.energy * 0.035, now, 1.6);
        }
        MOut.expr('lead', (inp.L + inp.R) / 2);
      },
      stop() { v.kill(); }
    };
  }
})

