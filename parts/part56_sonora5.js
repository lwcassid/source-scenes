/* ---------- SRC-32.5 · SONORA V5 (stone pan · hands herd two piles) ---------- */
/* V4's stone bed, its geologies, its heat solver and its handpan voicing are
   all kept. What changes is the HAND. V4's fronts were invisible pressure you
   read off the pile, and nobody could tell what a hand did. Now each hand OWNS
   a pile and the pile FOLLOWS it: the left hand herds the west stones, the
   right hand the east. Reach a hand out and its stones slide to that wall and
   stack; bring the hands together and the two piles slide to the middle and
   crash across the seam, bouncing off and falling back in to hit again. It is
   the motion that plays it, and every contact still warms the stones it
   touches until rock rings like a handpan. The always-on dark rim around each
   stone — the sticker outline — is gone; the stones sit on their own form. */
reg({
  id: 'SRC-32.5', family: 'SRC-32', ver: 5, title: 'Sonora', tech: 'STONE PAN / HANDS HERD',
  music: { bpm: 60, root: 48, mode: 'ionian', prog: [0, 5, 3, 4], chordBars: 4 },
  fx: { bloom: 0.32, edge: true },
  tags: ['GREY STONE / FOUR GEOLOGIES', 'PILES FOLLOW THE HANDS', 'BRING HANDS IN TO CRASH', 'ROCK WARMS INTO HANDPAN'],
  desc: 'A bed of light grey field stones in a dark tank — twenty-eight of them, five big, nine middling, fourteen small, split into a west pile and an east pile. Nothing is coloured. The only palette is value and temperature: cool slate through warm limestone, never more than a breath of saturation, so the whole plate reads as rock rather than as paint. Each stone is a geology, and the geology is the pitch — coarse dark granite on the root, sedimentary strata and slate cleavage through the middle of the register, pale quartz-veined stone at the top. You can look at the field and read the chord off it. Size is register: the big stones sit an octave below the middling ones, the pebbles an octave above. Every stone also carries a heat. Work it and it warms — the dry lithic knock lengthens, opens, and takes on partials, until a stone that started as a rock is ringing like a handpan. Leave it and it cools back to stone over a few seconds.',
  interact: 'Two hands, two piles. The left hand owns the west stones, the right hand the east, and each pile FOLLOWS its hand. Reach a hand outward and its stones slide out to that wall and stack up, jostling and knocking as they pile. Bring your hands back in toward each other and the two piles slide to the middle and crash together across the seam — and the harder and faster you move, the harder they hit, bouncing off and falling back in to hit again. It is the MOTION that plays it: hold still and the bed just leans where you left it and grinds softly; a slow gather is a soft roll of contacts; a fast sweep inward is a full crash across the centre. Every strike warms the stones it touches — work a patch and the dry knock lengthens, opens, and rings, until rock that started knocking is singing like a handpan; leave it and it cools. The slow play is the sympathy: a stone in tune with something already sounding stays warm long after you stopped working it, so the field holds its brightness in patches you did not touch.',
  sound: 'C major pentatonic — C D E G A — laid across three octaves by size, and tied to the harmony engine, so when the key moves the whole bed retunes and you hear it happen as a soft sweep from the low stones up. Five degrees, no fourth and no seventh, so any number of simultaneous collisions still agrees. Every strike is voiced by the striking stone\'s heat. Cold: a short filtered-noise knock and a stubby triangle body, twenty thousandths of a second, dry. Hot: the knock recedes, the body opens to four seconds, and the partials come in on the handpan stack — fundamental, octave, twelfth, then fourth, fifth, sixth — one more partial for every fifth of heat. Sympathy is unison, octave and twelfth only, which is exactly the handpan relationship, and it does not fire notes; it keeps stones warm and feeds a shimmer into the bed, so nothing can run away with itself. A held lean grinds instead of clattering — stone sliding on stone under the friction bed. Ableton: sub or round bass on the big stones, a soft mallet or lead on the middle, tuned glass or log drums on the pebbles.',

  init(P) {
    const m = Math.min(P.w, P.h);
    const R = P.rand;

    /* ---- C MAJOR PENTATONIC · degree carries geology, value and name ----
       Degree 0 is the root and the bottom of the field: the coarsest,
       darkest, heaviest stone. Degree 4 is the top: pale and quartz-veined. */
    const PENTA5 = [0, 2, 4, 7, 9];
    const DEG = [
      { n: 'C', geo: 0, gname: 'GRANITE', L: 0.52, temp: -0.5 },
      { n: 'D', geo: 1, gname: 'STRATA', L: 0.60, temp: 0.45 },
      { n: 'E', geo: 2, gname: 'SLATE', L: 0.65, temp: -0.8 },
      { n: 'G', geo: 1, gname: 'STRATA', L: 0.72, temp: 0.65 },
      { n: 'A', geo: 3, gname: 'QUARTZ', L: 0.82, temp: 0.1 }
    ];

    /* Three populations, one per octave. Size IS register — there is never
       a small stone playing low, so the field is readable at a glance. */
    const TIERS = [
      { n: 5, oct: -1, r0: 0.082, r1: 0.058, role: 'bass', gain: 1.0 },
      { n: 9, oct: 0, r0: 0.040, r1: 0.030, role: 'lead', gain: 0.72 },
      { n: 14, oct: 1, r0: 0.016, r1: 0.018, role: 'bells', gain: 0.42 }
    ];

    const rocks = [];
    for (let ti = 0; ti < TIERS.length; ti++) {
      const T2 = TIERS[ti];
      for (let i = 0; i < T2.n; i++) {
        // the five big stones take one pentatonic degree each, in order, so
        // the bottom octave is always a complete chord
        const deg = ti === 0 ? i % 5 : (R() * 5) | 0;
        const D = DEG[deg];
        // alternate side every stone so the two piles come out balanced — a
        // west pile and an east pile, each herded by one hand
        const side = rocks.length % 2 === 0 ? -1 : 1;
        const st = {
          side,
          x: side < 0 ? P.w * (0.10 + R() * 0.32) : P.w * (0.58 + R() * 0.32),
          y: P.h * (0.14 + R() * 0.72),
          vx: 0, vy: 0, ang: R() * TAU, va: 0,
          r: m * (T2.r0 + R() * T2.r1),
          tier: ti, deg, oct: T2.oct, role: T2.role, gain: T2.gain,
          note: D.n, geo: D.geo, gname: D.gname,
          semi: PENTA5[deg],
          // near-monochrome: value carries the register, temperature only
          // separates neighbours. Saturation never gets above about 8%.
          L: clamp(D.L + T2.oct * 0.05 + (R() - 0.5) * 0.07, 0.3, 0.9),
          temp: clamp(D.temp + (R() - 0.5) * 0.4, -1, 1),
          ph: R() * TAU, lastHit: -99,
          heat: 0, symp: 0, shock: 0, freq: 220,
          pr: null, prSpan: 0
        };

        /* Silhouette. A rock is not a lobed blob — the low harmonics stay
           small and the high ones do the work, because what makes a stone a
           stone is chipped edges, not bulges. Then a squash along one axis
           so slabs read as slabs. */
        const GEOSH = [
          { sq: 0.82, hi: 1.0 },   // granite — blocky, equant
          { sq: 0.58, hi: 0.8 },   // strata  — bedded, flattened
          { sq: 0.50, hi: 1.5 },   // slate   — flat and sharply cleaved
          { sq: 0.86, hi: 1.25 }   // quartz  — chunky, facetted
        ][D.geo];
        st.shape = {
          a1: 0.05 + R() * 0.09, p1: R() * TAU,
          a2: 0.035 + R() * 0.075, p2: R() * TAU,
          a3: 0.025 + R() * 0.05, p3: R() * TAU,
          a4: (0.018 + R() * 0.036) * GEOSH.hi, p4: R() * TAU,
          a5: (0.010 + R() * 0.022) * GEOSH.hi, p5: R() * TAU,
          a6: (0.005 + R() * 0.012) * GEOSH.hi, p6: R() * TAU,
          squash: GEOSH.sq + R() * 0.12, ang0: R() * TAU
        };

        /* ---- surface, generated once and baked once ---- */
        // GRANITE · dense speckle, feldspar grains and mica flecks
        st.flecks = [];
        if (D.geo === 0 || D.geo === 3) {
          const nf = D.geo === 0 ? 90 + (R() * 70 | 0) : 34 + (R() * 30 | 0);
          for (let k = 0; k < nf; k++) {
            const a = R() * TAU, rad = Math.sqrt(R()) * 0.94;
            st.flecks.push({
              cx: Math.cos(a) * rad, cy: Math.sin(a) * rad,
              rr: 0.012 + R() * (D.geo === 0 ? 0.045 : 0.028),
              tone: R() < 0.44 ? -(0.18 + R() * 0.3) : (0.14 + R() * 0.32),
              al: 0.16 + R() * 0.4, sq: 0.5 + R() * 0.7, ang: R() * TAU
            });
          }
        }
        // STRATA · parallel bedding planes, slightly waved, alternating load
        st.bands = [];
        if (D.geo === 1) {
          const nb = 5 + (R() * 6 | 0), ba = R() * TAU;
          st.bandAng = ba;
          let y = -1.05;
          for (let k = 0; k < nb && y < 1.05; k++) {
            const th = 0.09 + R() * 0.26;
            st.bands.push({
              y, th, tone: (k % 2 === 0 ? -1 : 1) * (0.06 + R() * 0.2),
              al: 0.24 + R() * 0.36, wav: (R() - 0.5) * 0.14, wn: 1 + (R() * 3 | 0)
            });
            y += th + 0.01 + R() * 0.05;
          }
        }
        // SLATE · straight cleavage lines and one or two flat facet planes
        st.cleave = [];
        if (D.geo === 2) {
          const ca = R() * TAU;
          st.cleaveAng = ca;
          for (let k = 0; k < 3 + (R() * 4 | 0); k++) {
            st.cleave.push({ y: (R() - 0.5) * 1.8, w: 0.006 + R() * 0.016, al: 0.2 + R() * 0.4, tone: R() < 0.6 ? -0.4 : 0.35 });
          }
          st.facets = [];
          for (let k = 0; k < 1 + (R() * 2 | 0); k++) {
            st.facets.push({ cx: (R() - 0.5) * 0.7, cy: (R() - 0.5) * 0.7, rr: 0.3 + R() * 0.4, ang: R() * TAU, sq: 0.3 + R() * 0.4, tone: 0.16 + R() * 0.2, al: 0.16 + R() * 0.18 });
          }
        }
        // QUARTZ · branching pale veins cutting the whole stone
        st.veins = [];
        if (D.geo === 3) {
          const nv = 2 + (R() * 4 | 0);
          for (let v = 0; v < nv; v++) {
            let a = R() * TAU, px = (R() - 0.5) * 1.4, py = (R() - 0.5) * 1.4;
            const pts = [[px, py]];
            for (let k = 0; k < 4 + (R() * 4 | 0); k++) {
              a += (R() - 0.5) * 0.9;
              const len = 0.14 + R() * 0.24;
              px += Math.cos(a) * len; py += Math.sin(a) * len;
              pts.push([px, py]);
            }
            const fi = 1 + ((pts.length - 1) * 0.5 | 0);
            let fa = a + (R() < 0.5 ? 1 : -1) * (0.6 + R() * 0.9);
            let fx = pts[fi][0], fy = pts[fi][1];
            const fork = [[fx, fy]];
            for (let k = 0; k < 2 + (R() * 3 | 0); k++) {
              fa += (R() - 0.5) * 0.8;
              const len = 0.1 + R() * 0.18;
              fx += Math.cos(fa) * len; fy += Math.sin(fa) * len;
              fork.push([fx, fy]);
            }
            st.veins.push({ pts, fork, w: 0.014 + R() * 0.03, al: 0.4 + R() * 0.4 });
          }
        }
        // every stone gets a few chips and pits, whatever it is made of
        st.pits = [];
        for (let k = 0; k < 4 + (R() * 8 | 0); k++) {
          const a = R() * TAU, rad = Math.sqrt(R()) * 0.9;
          st.pits.push({ cx: Math.cos(a) * rad, cy: Math.sin(a) * rad, rr: 0.03 + R() * 0.1, ang: R() * TAU, sq: 0.3 + R() * 0.5, al: 0.08 + R() * 0.16 });
        }

        rocks.push(st);
      }
    }

    // settle the pack before the first frame so nothing starts interpenetrating
    for (let pass = 0; pass < 90; pass++) {
      for (let i = 0; i < rocks.length; i++) {
        for (let j = i + 1; j < rocks.length; j++) {
          const a = rocks[i], b = rocks[j];
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
      for (const st of rocks) {
        st.x = clamp(st.x, st.r + 6, P.w - st.r - 6);
        st.y = clamp(st.y, st.r + 6, P.h - st.r - 6);
      }
    }

    P.state = {
      rocks, dust: [], rings: [], energy: 0, grind: 0, heat: 0, ring: 0,
      lastRoot: H.root, retune: 0, presL: 0, presR: 0
    };
    // first tuning
    for (const st of rocks) st.freq = H.rootFreq(st.oct) * Math.pow(2, st.semi / 12);
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    let energy = 0, grind = 0, heatSum = 0, symSum = 0;
    const SOUND_FLOOR = 11;

    /* ---- retune. The pentatonic is tied to the harmony engine, so when H
           modulates the whole bed shifts. We make it audible — the stones sound
           their new pitches in size order over about a second, low to high. */
    if (H.root !== s.lastRoot) {
      s.lastRoot = H.root;
      for (const st of s.rocks) st.freq = H.rootFreq(st.oct) * Math.pow(2, st.semi / 12);
      s.retune = 1;
      const sweep = s.rocks.filter(r => r.tier < 2).sort((a, b) => b.r - a.r);
      P.ping(A => {
        const t0 = A.t() + 0.05;
        sweep.forEach((st, i) => {
          const at = t0 + i * 0.075;
          A.tone(st.freq, {
            at, vol: 0.016 * st.gain, dur: 1.1, attack: 0.03, type: 'sine',
            pan: (st.x / w) * 2 - 1, rev: 0.6, role: st.role
          });
        });
      });
    }
    s.retune *= Math.pow(0.25, dt);

    /* ---- PRESENCE, per side. A hand only herds its pile while it is live;
           when it leaves, that pile loosens and drifts back toward the middle
           (the ambient tease), so an abandoned bed mills quietly at centre. */
    const liveL = chan.L.mode === 'live' ? 1 : 0;
    const liveR = chan.R.mode === 'live' ? 1 : 0;
    s.presL += (liveL - s.presL) * Math.min(1, dt * 1.8);
    s.presR += (liveR - s.presR) * Math.min(1, dt * 1.8);
    // one activity gate — is ANYONE working the bed? An abandoned bed still
    // drifts and its piles still touch, but that gentle jostle must not warm
    // the stones or grind out loud; both are things a present player does.
    const actGate = Math.max(s.presL, s.presR);
    s.actv = actGate;

    /* ---- THE HANDS HERD THE PILES. Each hand sets a target column for its
           half of the bed; the stones spring toward it. Reach outward (inp
           high) drives the pile to that wall; hands together (inp low) drives
           both piles to the seam at centre, where they crash. It is the MOTION
           that plays it — a fast sweep yanks the spring hard and the stones
           slam; a held reach just leans the pile against the wall. ---- */
    const GAP = 0.055, SPREAD = 0.40;
    // where each hand is asking its pile to sit (fraction of width)
    const homeL = 0.5 - GAP - inp.L * SPREAD;   // inp.L 0 → .445  · 1 → .045
    const homeR = 0.5 + GAP + inp.R * SPREAD;   // inp.R 0 → .555  · 1 → .955
    // an abandoned bed rests with the two piles WIDE apart and quiet — the
    // crush at centre is a thing a present player does by bringing hands in,
    // not the resting state. So blend the target from a wide rest toward the
    // hand's ask by presence, and keep the spring slack until a hand is live.
    const REST_L = 0.28, REST_R = 0.72;
    const txL = w * (REST_L + (homeL - REST_L) * s.presL);
    const txR = w * (REST_R + (homeR - REST_R) * s.presR);
    s.txL = txL; s.txR = txR;

    for (const st of s.rocks) {
      // slow currents — the bed drifts, strongest where no hand is working it
      const idle = 1 - (st.side < 0 ? s.presL : s.presR) * 0.7;
      st.vx += (Math.sin(t * 0.13 + st.ph) + Math.sin(t * 0.06 + st.ph * 3)) * dt * 6 * idle;
      st.vy += (Math.cos(t * 0.11 + st.ph * 2) + Math.cos(t * 0.17 + st.ph)) * dt * 7 * idle;

      // the hand-spring: pull the stone toward its pile's target column. Stiff
      // when the hand is present; at idle it still holds the two piles apart at
      // their wide rest so an abandoned bed rests calm instead of drifting into
      // a central grind — the wide rest means even this floor never crushes.
      const tx = st.side < 0 ? txL : txR;
      const pres = st.side < 0 ? s.presL : s.presR;
      const K = 2.2 + 7.8 * pres;
      st.vx += (tx - st.x) * K * dt;

      const drag = Math.pow(0.45, dt);
      st.vx *= drag; st.vy *= drag;
      // stone tumbles, unlike dye — but heavy stone in a pile barely turns
      st.va *= Math.pow(0.22, dt);
      st.x += st.vx * dt; st.y += st.vy * dt; st.ang += st.va * dt;

      const pad = st.r + 4;
      if (st.x < pad) { st.x = pad; st.vx = Math.abs(st.vx) * 0.3; }
      if (st.x > w - pad) { st.x = w - pad; st.vx = -Math.abs(st.vx) * 0.3; }
      if (st.y < pad) { st.y = pad; st.vy = Math.abs(st.vy) * 0.3; }
      if (st.y > h - pad) { st.y = h - pad; st.vy = -Math.abs(st.vy) * 0.3; }
      const sp = Math.hypot(st.vx, st.vy), CAP = 150;
      if (sp > CAP) { const k = CAP / sp; st.vx *= k; st.vy *= k; }
      energy += sp;

      st.shock *= Math.pow(0.25, dt);
      st.work = 0;                 // this frame's contact load, filled below
    }

    // ---- stone on stone ----
    for (let i = 0; i < s.rocks.length; i++) {
      for (let j = i + 1; j < s.rocks.length; j++) {
        const a = s.rocks[i], b = s.rocks[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.92;
        if (d < min && d > 0.01) {
          const nx = dx / d, ny = dy / d;
          const ma = a.r * a.r, mb = b.r * b.r, mt = ma + mb;
          const wa = mb / mt, wb = ma / mt;
          const overlap = min - d;
          a.x -= nx * overlap * wa; a.y -= ny * overlap * wa;
          b.x += nx * overlap * wb; b.y += ny * overlap * wb;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          const tangV = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
          grind += Math.abs(tangV);

          if (rel < 0) {
            /* The stones BOUNCE now, where V4's pile only leaned. A knock
               between two piles springs them apart and the hands pull them
               back in to hit again — that rebound is the "more sound". Two
               stones from OPPOSITE piles meeting at the seam bounce hardest;
               stones within a pile settle sooner so a stack still reads as a
               stack. Under a held lean it grinds instead of ringing. */
            const cross = a.side !== b.side;
            const resti = cross ? 0.72 : 0.48;
            const imp = -rel * resti + 2;
            const ia = imp * 2 * wa, ib = imp * 2 * wb;
            a.vx -= ia * nx; a.vy -= ia * ny;
            b.vx += ib * nx; b.vy += ib * ny;
            // a glancing blow spins stone; a square one does not
            a.va += -tangV * 0.0016 * wa;
            b.va += tangV * 0.0016 * wb;

            const speed = -rel;
            /* WORK. Every contact loads the stones it touches, driving heat
               through a time constant below, so warming takes seconds instead
               of depending on how many contacts a frame happens to contain. */
            const wk = clamp(speed / 110, 0, 1) + Math.min(1, Math.abs(tangV) * 0.011);
            a.work += wk * (0.6 + wa);
            b.work += wk * (0.6 + wb);

            if (speed > SOUND_FLOOR) {
              a.shock = b.shock = 1;
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              // only a real knock puts a ring in the bed, and never more than
              // a handful at once
              if (s.rings.length < 7 && Math.max(a.r, b.r) > Math.min(P.w, P.h) * 0.03) {
                s.rings.push({ x: mx, y: my, t, r0: Math.min(a.r, b.r) });
              }
              if (s.dust.length < 48) {
                for (let k = 0; k < 2; k++) {
                  s.dust.push({ x: mx, y: my, vx: (P.rand() - 0.5) * 26, vy: (P.rand() - 0.5) * 26 - 6, life: 0.9 + P.rand() * 0.8 });
                }
              }
              const baseVol = clamp((speed - SOUND_FLOOR) / 90, 0.035, 0.2);
              const pan = (mx / w) * 2 - 1;

              const shots = [];
              for (const st of [a, b]) {
                const other = st === a ? b : a;
                const dominant = st.r >= other.r;
                if (speed < (st.tier === 2 ? SOUND_FLOOR * 1.7 : SOUND_FLOOR)) continue;
                /* An enforced rest per stone, so a trembling pack reads as the
                   sparse top of the clatter rather than a wash. The rest grows
                   with heat: a cold stone's knock is gone in a fifth of a
                   second, but a hot one rings for four, and striking it again
                   underneath its own tail is what turns an instrument back into
                   noise. Warm stones speak less often and say more. */
                const base = st.tier === 2 ? 0.9 : st.tier === 1 ? 0.5 : 0.42;
                if (t - st.lastHit < base * (1 + st.heat * 2.2)) continue;
                st.lastHit = t;
                const vol = baseVol * st.gain * (dominant ? 1 : 0.6);
                if (vol < 0.010) continue;
                shots.push({
                  f: st.freq, vol, heat: st.heat, role: st.role, tier: st.tier,
                  sizeK: clamp(st.r / (Math.min(P.w, P.h) * 0.14), 0.15, 1), knock: dominant
                });
              }

              if (shots.length) P.ping(A => {
                for (const sh of shots) {
                  const H01 = clamp(sh.heat, 0, 1);
                  /* ---- COLD ROCK → HOT HANDPAN ----
                     The strike transient is loud, broadband and dry when the
                     stone is cold, and recedes into the note as it warms. The
                     body does the opposite: 0.2s of stubby triangle cold,
                     four seconds of sine with the handpan partial stack hot. */
                  if (sh.knock) {
                    A.hit({
                      vol: sh.vol * (0.95 - H01 * 0.6),
                      dur: 0.016 + 0.030 * (1 - H01),
                      freq: 700 + 2400 * (1 - H01) + sh.tier * 260,
                      q: 1.1 + H01 * 3.2, pan
                    });
                  }
                  const dur = (0.16 + 0.14 * sh.sizeK) + H01 * (1.9 + 2.1 * sh.sizeK);
                  // handpan: fundamental, octave, compound fifth, then up
                  const PART = [1, 2, 3, 4, 5.04, 6.02];
                  const PGAIN = [1, 0.42, 0.27, 0.13, 0.075, 0.045];
                  const nP = 1 + Math.round(H01 * 5);
                  for (let k = 0; k < nP; k++) {
                    A.tone(sh.f * PART[k], {
                      vol: sh.vol * PGAIN[k] * (k === 0 ? 1 : 0.5 + 0.5 * H01),
                      dur: dur * (k === 0 ? 1 : Math.max(0.22, 0.8 - 0.1 * k)),
                      attack: k === 0 ? 0.0015 + H01 * 0.007 : 0.003 + H01 * 0.004,
                      type: k === 0 ? (H01 > 0.42 ? 'sine' : 'triangle') : 'sine',
                      pan, rev: 0.18 + H01 * 0.5, del: H01 > 0.62 && k === 0 ? 0.14 : 0,
                      role: sh.role
                    });
                  }
                }
              });
            }
          }
        }
      }
    }

    /* A dense pack of very different sizes will not separate in one pass.
       Position-only relaxation, no impulses, no sound, no heat. */
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < s.rocks.length; i++) {
        for (let j = i + 1; j < s.rocks.length; j++) {
          const a = s.rocks[i], b = s.rocks[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.92;
          if (d < min && d > 0.01) {
            // split EVENLY, not by mass — mass weighting lets a pebble get
            // crushed against a big stone that refuses to yield
            const ov = (min - d) / d * 0.5;
            a.x -= dx * ov; a.y -= dy * ov;
            b.x += dx * ov; b.y += dy * ov;
          }
        }
      }
      for (const st of s.rocks) {
        st.x = clamp(st.x, st.r + 4, w - st.r - 4);
        st.y = clamp(st.y, st.r + 4, h - st.r - 4);
        const v = Math.hypot(st.vx, st.vy);
        if (v > 150) { const k = 150 / v; st.vx *= k; st.vy *= k; }
      }
    }

    /* ---- SYMPATHY. Unison, octave and twelfth only — the handpan
           relationship, and the reason a struck stone lights up its cousins
           across the tank. It never fires a note: it keeps a stone warm and
           feeds the shimmer in the bed. No feedback loop is possible. ---- */
    const bus = AE.SB;
    let ringMax = 0;
    if (bus && bus.ev && bus.ev.length && AE.ctx) {
      const now = AE.t();
      for (const st of s.rocks) {
        let e = 0;
        for (let k = 0; k < bus.ev.length; k++) {
          const ev = bus.ev[k];
          if (now < ev.t0 || now > ev.t1) continue;
          const amp = ev.v * (1 - (now - ev.t0) / (ev.t1 - ev.t0));
          if (amp <= 0) continue;
          const ratio = ev.f > st.freq ? ev.f / st.freq : st.freq / ev.f;
          const n = Math.round(ratio);
          if (n < 1 || n > 3) continue;              // 1:2:3 and nothing else
          const det = Math.abs(ratio - n) / n;
          const win = Math.exp(-det * det * 900);
          if (win < 0.03) continue;
          e += amp * win * (n === 1 ? 1 : n === 2 ? 0.5 : 0.3);
        }
        e = Math.min(1, e * 3.4);
        // slow to fill, slower to empty — a sung-to stone stays lit
        st.symp += (e - st.symp) * Math.min(1, dt * (e > st.symp ? 4.5 : 0.9));
        if (st.symp > ringMax) ringMax = st.symp;
        symSum += st.symp;
      }
    } else {
      for (const st of s.rocks) st.symp *= Math.pow(0.4, dt);
    }

    /* ---- HEAT. A first-order lag on how hard the stone is being worked right
           now, so the arc takes the seconds it should: about five to warm
           through, four to cool, as much as fourteen if something is singing
           to it — a stone in tune with the bed holds its brightness long after
           you stopped touching it, so the field keeps warm patches you never
           worked. It cannot run away: sympathy never fires a note. ---- */
    for (const st of s.rocks) {
      // gate the heat DRIVE by presence — an abandoned bed cools back to cold
      // stone; a stone the sympathy is holding still cools slowly (long tau).
      const drive = clamp((st.work || 0) * actGate, 0, 1);
      const tau = drive > st.heat ? 5.0 : (4.0 + st.symp * 10);
      st.heat += (drive - st.heat) * Math.min(1, dt / tau);
      heatSum += st.heat;
    }

    s.ring += (ringMax - s.ring) * Math.min(1, dt * 8);
    s.energy += (Math.min(1, energy / (s.rocks.length * 26)) - s.energy) * Math.min(1, dt * 1.6);
    s.grind += (Math.min(1, grind / 150) - s.grind) * Math.min(1, dt * 2.5);
    s.heat += (heatSum / s.rocks.length - s.heat) * Math.min(1, dt * 3);
    s.symTotal = symSum / s.rocks.length;

    s.rings = s.rings.filter(rp => t - rp.t < 0.9);
    for (const c of s.dust) { c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 26 * dt; c.vx *= Math.pow(0.2, dt); c.life -= dt; }
    s.dust = s.dust.filter(c => c.life > 0);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(3,3,5,0.62)'; g.fillRect(0, 0, w, h);

    /* Near-monochrome. Value carries the register; temperature only separates
       neighbours, and never gets past about 8% saturation, so the plate reads
       as rock and not as a tinted photograph. */
    const mono = (L, temp, a) => {
      const b = 255 * clamp(L, 0, 1);
      const R = clamp(b * (1 + temp * 0.030), 0, 255) | 0;
      const G = clamp(b * (1 + temp * 0.007), 0, 255) | 0;
      const B = clamp(b * (1 - temp * 0.027), 0, 255) | 0;
      return `rgba(${R},${G},${B},${a === undefined ? 1 : a})`;
    };

    // one shared silhouette so the bake, the clip and the rim all agree
    const rockPath = (q, sh, u, scale) => {
      q.beginPath();
      const NV = 76;
      const ca = Math.cos(sh.ang0), sa = Math.sin(sh.ang0);
      for (let k = 0; k <= NV; k++) {
        const a = k / NV * TAU;
        const rr = scale * (1
          + sh.a1 * Math.cos(a + sh.p1)
          + sh.a2 * Math.cos(2 * a + sh.p2)
          + sh.a3 * Math.cos(3 * a + sh.p3)
          + sh.a4 * Math.cos(5 * a + sh.p4)
          + sh.a5 * Math.cos(9 * a + sh.p5)
          + sh.a6 * Math.cos(15 * a + sh.p6));
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr * sh.squash;
        const X = (px * ca - py * sa) * u, Y = (px * sa + py * ca) * u;
        k === 0 ? q.moveTo(X, Y) : q.lineTo(X, Y);
      }
      q.closePath();
    };

    /* MINERAL GRAIN — one seamless tile, built once, shared by every stone. */
    if (!s.grain) {
      const SZ = 128;
      const c = document.createElement('canvas');
      c.width = c.height = SZ;
      const q = c.getContext('2d');
      let sd = 0x5bd1e995;
      const rnd = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      q.fillStyle = '#808080'; q.fillRect(0, 0, SZ, SZ);
      const OCT = [[22, SZ * 0.22], [80, SZ * 0.09], [260, SZ * 0.03], [700, SZ * 0.011]];
      for (const [n, rad0] of OCT) {
        for (let i = 0; i < n; i++) {
          const x = rnd() * SZ, y = rnd() * SZ;
          const dark = rnd() < 0.52;
          const a = 0.08 + rnd() * 0.22;
          const col = dark ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
          const rad = rad0 * (0.5 + rnd());
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
      const img = q.getImageData(0, 0, SZ, SZ);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (rnd() - 0.5) * 64;
        d[i] += n; d[i + 1] += n; d[i + 2] += n;
      }
      q.putImageData(img, 0, 0);
      s.grain = c;
    }

    /* Bake each stone's surface once, in its own local frame. It is drawn
       rotated afterwards, so the geology turns with the stone. */
    const bake = (st) => {
      const R = Math.max(8, Math.round(st.r));
      const SS = Math.max(0.9, Math.min(R < 26 ? 2 : 1.5, 640 / (R * 2.6)));
      const size = Math.max(28, Math.round(R * 2.6 * SS));
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const q = c.getContext('2d');
      if (!q) return;
      const u = R * SS;
      q.translate(size / 2, size / 2);

      q.save();
      rockPath(q, st.shape, u, 1);
      q.clip();

      // the body of the stone
      q.fillStyle = mono(st.L, st.temp);
      q.fillRect(-size, -size, size * 2, size * 2);

      const sh = st.shape;
      // ---- GRANITE / QUARTZ HOST · speckle
      for (const f of st.flecks) {
        q.save();
        q.translate(f.cx * u, f.cy * u);
        q.rotate(f.ang); q.scale(1, f.sq);
        q.fillStyle = mono(st.L + f.tone, st.temp, f.al);
        q.beginPath(); q.arc(0, 0, Math.max(0.4, f.rr * u), 0, TAU); q.fill();
        q.restore();
      }
      // ---- STRATA · bedding planes
      if (st.bands.length) {
        q.save();
        q.rotate(st.bandAng);
        for (const b of st.bands) {
          q.fillStyle = mono(st.L + b.tone, st.temp, b.al);
          q.beginPath();
          q.moveTo(-1.6 * u, b.y * u);
          for (let k = 0; k <= 16; k++) {
            const xx = (-1.6 + k / 16 * 3.2) * u;
            q.lineTo(xx, (b.y + Math.sin(k / 16 * TAU * b.wn) * b.wav) * u);
          }
          for (let k = 16; k >= 0; k--) {
            const xx = (-1.6 + k / 16 * 3.2) * u;
            q.lineTo(xx, (b.y + b.th + Math.sin(k / 16 * TAU * b.wn) * b.wav) * u);
          }
          q.closePath(); q.fill();
        }
        q.restore();
      }
      // ---- SLATE · facets then cleavage
      if (st.facets) {
        for (const f of st.facets) {
          q.save();
          q.translate(f.cx * u, f.cy * u); q.rotate(f.ang); q.scale(1, f.sq);
          q.fillStyle = mono(st.L + f.tone, st.temp, f.al);
          q.beginPath(); q.arc(0, 0, f.rr * u, 0, TAU); q.fill();
          q.restore();
        }
      }
      if (st.cleave.length) {
        q.save();
        q.rotate(st.cleaveAng);
        for (const cl of st.cleave) {
          q.strokeStyle = mono(st.L + cl.tone, st.temp, cl.al);
          q.lineWidth = Math.max(0.5, cl.w * u);
          q.beginPath(); q.moveTo(-1.6 * u, cl.y * u); q.lineTo(1.6 * u, cl.y * u); q.stroke();
        }
        q.restore();
      }
      // ---- QUARTZ · veins
      q.lineCap = 'round'; q.lineJoin = 'round';
      for (const v of st.veins) {
        for (const path of [v.pts, v.fork]) {
          q.strokeStyle = mono(Math.min(0.97, st.L + 0.28), st.temp * 0.3, v.al);
          q.lineWidth = Math.max(0.6, v.w * u);
          q.beginPath();
          path.forEach((p, k) => k === 0 ? q.moveTo(p[0] * u, p[1] * u) : q.lineTo(p[0] * u, p[1] * u));
          q.stroke();
          // the shadow side of a raised vein
          q.strokeStyle = mono(st.L - 0.2, st.temp, v.al * 0.5);
          q.lineWidth = Math.max(0.4, v.w * u * 0.45);
          q.beginPath();
          path.forEach((p, k) => k === 0 ? q.moveTo(p[0] * u + u * 0.012, p[1] * u + u * 0.014) : q.lineTo(p[0] * u + u * 0.012, p[1] * u + u * 0.014));
          q.stroke();
        }
      }
      // ---- pits and chips, on everything
      for (const p of st.pits) {
        q.save();
        q.translate(p.cx * u, p.cy * u); q.rotate(p.ang); q.scale(1, p.sq);
        q.fillStyle = mono(st.L - 0.26, st.temp, p.al);
        q.beginPath(); q.arc(0, 0, p.rr * u, 0, TAU); q.fill();
        // the lit lip on the far side of the pit
        q.fillStyle = mono(st.L + 0.2, st.temp, p.al * 0.6);
        q.beginPath(); q.arc(-p.rr * u * 0.18, -p.rr * u * 0.2, p.rr * u * 0.6, 0, TAU); q.fill();
        q.restore();
      }

      // mineral tooth over everything
      const pat = q.createPattern(s.grain, 'repeat');
      if (pat) {
        q.save();
        q.globalCompositeOperation = 'overlay';
        q.fillStyle = pat;
        q.fillRect(-size, -size, size * 2, size * 2);
        q.globalAlpha = 0.6;
        q.scale(2.9, 2.9);
        q.fillRect(-size / 2.9, -size / 2.9, size * 2 / 2.9, size * 2 / 2.9);
        q.restore();
      }

      /* FORM. Everything above is surface; this is what makes it a solid.
         One light from the upper left, a terminator falling away to the
         lower right. NO outline: V5 drops V4's dark inner rim stroke, which
         is the sticker edge Kasia flagged — the form gradients carry the
         thickness, and a stone with no drawn rim sits IN the dark instead of
         on it, which is exactly what black scrim wants. */
      const lg = q.createRadialGradient(-u * 0.42, -u * 0.5, u * 0.05, -u * 0.3, -u * 0.36, u * 1.7);
      lg.addColorStop(0, 'rgba(255,253,247,0.26)');
      lg.addColorStop(0.42, 'rgba(255,252,246,0.07)');
      lg.addColorStop(1, 'rgba(255,255,255,0)');
      q.fillStyle = lg;
      q.fillRect(-size, -size, size * 2, size * 2);

      // a slightly deeper terminator, since the hard rim that used to seat the
      // lower-right edge is gone — the shading now does all of that work
      const dg = q.createRadialGradient(u * 0.22, u * 0.3, u * 0.1, u * 0.28, u * 0.34, u * 1.5);
      dg.addColorStop(0, 'rgba(0,0,0,0)');
      dg.addColorStop(0.5, 'rgba(6,6,9,0.24)');
      dg.addColorStop(1, 'rgba(4,4,7,0.72)');
      q.fillStyle = dg;
      q.fillRect(-size, -size, size * 2, size * 2);

      q.restore();

      st.pr = c; st.prSpan = R * 2.6;
    };

    /* The piles are herded by invisible hands — nothing is drawn for the
       controller itself; you read it entirely in where the stones go. */

    /* Contact rings — a dry shock through the bed, kept very faint and very
       short so a full crush's dozen contacts a second do not stack into moiré. */
    for (const rp of s.rings) {
      const k = (t - rp.t) / 0.9;
      if (k > 1) continue;
      g.strokeStyle = `rgba(206,203,196,${(1 - k) * (1 - k) * 0.07})`;
      g.lineWidth = 1.1 * (1 - k);
      g.beginPath(); g.arc(rp.x, rp.y, rp.r0 * (0.6 + k * 2.2), 0, TAU); g.stroke();
    }

    let baked = 0;
    for (const st of s.rocks) {
      if (!st.pr && baked < 3) { bake(st); baked++; }
      const r = st.r;
      const heat = clamp(st.heat, 0, 1), sym = clamp(st.symp, 0, 1);

      g.save();
      g.translate(st.x, st.y);

      // the stone's own shadow on the bed
      g.fillStyle = 'rgba(0,0,0,0.42)';
      g.beginPath(); g.ellipse(r * 0.13, r * 0.2, r * 1.0, r * 0.92, 0, 0, TAU); g.fill();

      g.rotate(st.ang);

      if (st.pr) {
        const span = st.prSpan;
        g.drawImage(st.pr, -span / 2, -span / 2, span, span);
      } else {
        g.fillStyle = mono(st.L, st.temp);
        rockPath(g, st.shape, r, 1); g.fill();
      }

      /* HEAT, read on the stone. A cold stone is inert grey. A worked one
         picks up a pale ring along its rim and a standing bloom through the
         body — the visual of the same thing you are hearing: rock warming
         into an instrument. This rim is an EVENT (only a worked stone wears
         it), not the always-on outline V4 drew on every stone. */
      if (heat > 0.02 || sym > 0.05 || st.shock > 0.03) {
        g.save();
        rockPath(g, st.shape, r, 1);
        g.clip();

        /* Everything below is INSIDE the stone. Nothing draws a halo around
           the silhouette — an outline is the single loudest tell that a thing
           is a shape rather than an object. */

        // sympathy — the stone lightens from within, no edge, no ring
        if (sym > 0.12) {
          g.fillStyle = `rgba(232,240,246,${(sym - 0.12) * 0.11})`;
          g.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
        }

        // heat — the stone glows along its own edge, in its own shape
        if (heat > 0.02) {
          g.strokeStyle = `rgba(255,248,232,${heat * 0.3})`;
          g.lineWidth = Math.max(0.8, r * 0.09);
          rockPath(g, st.shape, r, 0.995); g.stroke();
          for (let k = 1; k <= 3; k++) {
            g.strokeStyle = `rgba(255,250,238,${heat * 0.05 / k})`;
            g.lineWidth = Math.max(0.5, r * 0.014);
            rockPath(g, st.shape, r, (k / 3.6) * (1 + Math.sin(t * 1.1 + k + st.ph) * 0.06));
            g.stroke();
          }
        }

        /* The shock of a strike, travelling out from the core. */
        if (st.shock > 0.06) {
          g.strokeStyle = `rgba(255,252,244,${st.shock * st.shock * 0.16})`;
          g.lineWidth = Math.max(0.5, r * 0.014);
          rockPath(g, st.shape, r, 0.42 + (1 - st.shock) * 0.56); g.stroke();
        }
        g.restore();
      }

      g.restore();
    }

    // dust thrown off the grind
    for (const c of s.dust) {
      const a = clamp(c.life * 0.4, 0, 0.4);
      g.fillStyle = `rgba(206,202,192,${a})`;
      g.fillRect(c.x, c.y, 1.6, 1.6);
    }

    g.fillStyle = 'rgba(206,208,204,0.8)'; g.font = '10px ui-monospace,monospace';
    const chord = s.rocks.filter(r => r.tier === 0).sort((a, b) => b.r - a.r).map(r => r.note).join(' ');
    g.fillText('WEST ' + Math.round(inp.L * 100) + '%  EAST ' + Math.round(inp.R * 100) +
      '%  GRIND ' + Math.round(s.grind * 100) + '%  HEAT ' + Math.round(s.heat * 100) +
      '%  SYMPATHY ' + Math.round(s.ring * 100) + '%  ' + (H.keyLabel || '') +
      ' PENTATONIC  BED ' + chord + '  + ' + s.rocks.filter(r => r.tier === 2).length + ' PEBBLES', 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    // a near-silent root drone, so the bed has a floor to be tuned against
    const o1 = v.osc('sine', H.rootFreq(-1)), o2 = v.osc('sine', H.rootFreq(-1) * 1.5);
    const og = v.g(0.02);
    o1.connect(og); o2.connect(og); og.connect(v.group);
    H.onChord(() => {
      A.set(o1.frequency, H.rootFreq(-1), 1.2);
      A.set(o2.frequency, H.rootFreq(-1) * 1.5, 1.4);
    });
    /* GRIND. Under a held lean the stones are not knocking, they are sliding
       on each other. Two bands: a low rumble of mass against mass and a dry
       rasp of grit between them. This carries the intensity so the scene does
       not have to fire more discrete notes at it. */
    const rum = v.noise();
    const rf = v.filter('lowpass', 240, 1.1);
    const rg = v.g(0);
    rum.connect(rf); rf.connect(rg); rg.connect(v.group);
    const rasp = v.noise();
    const af = v.filter('bandpass', 1700, 1.6);
    const ag = v.g(0);
    rasp.connect(af); af.connect(ag); ag.connect(v.group);
    /* SHIMMER. Sympathy never fires a note — it feeds this instead, a thin
       high band that opens as the bed rings in tune with itself. */
    const shim = v.noise();
    const sf = v.filter('bandpass', 4200, 5);
    const sg = v.g(0);
    shim.connect(sf); sf.connect(sg); sg.connect(v.group);
    v.fadeIn(1, 1.4);

    let bedT = 0;
    return {
      tick(inp) {
        const s = P.state;
        if (!s || !s.rocks) return;
        // grind and shimmer only speak while a hand is actually working the
        // bed — an abandoned pan drifts in silence but for the odd cold knock.
        const act = s.actv || 0;
        A.set(og.gain, 0.014 + s.energy * 0.04, 0.4);
        A.set(rg.gain, s.grind * 0.09 * act, 0.25);
        A.set(ag.gain, s.grind * s.grind * 0.035 * act, 0.2);
        // grit gets brighter as the stones warm
        A.set(af.frequency, 1400 + s.heat * 1800, 0.5);
        A.set(sg.gain, ((s.symTotal || 0) * 0.028 + s.ring * 0.012) * (0.25 + 0.75 * act), 0.6);
        /* Publish the drone so other scenes' resonators can hear this one —
           but an OCTAVE BELOW the lowest stone, and quietly, so it does not
           pin the bottom stone's sympathy at full. */
        const now = A.t();
        if (A.SB && now - bedT > 1.4) {
          bedT = now;
          const f = H.rootFreq(-2);
          A.SB.push(f, 0.02 + s.energy * 0.03, now, 1.6);
        }
        MOut.expr('lead', (inp.L + inp.R) / 2);
      },
      stop() { v.kill(); }
    };
  }
});
