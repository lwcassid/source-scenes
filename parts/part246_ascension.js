/* ---------- SRC-60 · ASCENSION (escape velocity) ----------
   A burst of shards from a centre, and the whole scene is one real threshold:
   v² > 2GM/r. Under it a shard is BOUND — it slows, reddens, arcs over and
   falls back. Over it the shard is FREE — it straightens, runs white, and
   leaves the frame forever.

   That is why the left hand does not feel like a slider. Most of its travel
   is a fountain falling back on itself, and then somewhere past the middle
   the field stops returning and the whole picture commits and goes. The
   drama is not eased in by hand; it is a real bifurcation in the physics,
   and it lands in the same place every time because the number is the number.

   Colour is temperature and temperature is speed against escape: deep ember
   for the slow and bound, gold as it climbs, white at the threshold, ice
   beyond it. Hue therefore comes from the form and never from where a thing
   sits on screen. Every shard that crosses escape rings once on its way out,
   so the finale of the set counts its own departures. */
(() => {
  const GM = 1.0, R0 = 0.10, SOFT = 0.12, SUB = 3;
  // SOFTENED potential, and THREE SUBSTEPS a frame. Two separate leaks were
  // handing the field free energy: a bare 1/r² spikes for anything that falls
  // near the centre, and — the bigger one — a low-energy shard sits in an
  // orbit whose period is ~5 frames, which semi-implicit Euler pumps until it
  // escapes. That is why FREE read ~44% at ZERO energy: a numerical artifact
  // wearing the costume of the physics this whole scene is about. Softening
  // caps the force, substepping resolves the orbit, and escape is measured
  // against the SAME potential the force came from, so bound stays bound.
  function rsoft(r) { return Math.sqrt(r * r + SOFT * SOFT); }
  function vesc(r) { return Math.sqrt(2 * GM / rsoft(r)); }
  reg({
    id: 'SRC-60', family: 'SRC-60', ver: 1, title: 'BoT · Ascension', tech: 'ESCAPE VELOCITY / BOUND OR FREE',
    textIsContent: true,
    music: {
      bpm: 60, root: 41, mode: 'aeolian', chordBars: 2,
      chords: [
        [0, 7, 12, 19, 24],    // Fm5 open
        [0, 8, 15, 20, 27],    // D♭maj7♯11/F
        [0, 10, 14, 19, 26],   // E♭6/9/F
        [0, 7, 14, 21, 28],    // Fm9(13)
        [0, 5, 12, 17, 24],    // Fsus4
        [0, 9, 16, 21, 28],    // D♭maj9/F
        [0, 7, 12, 19, 26]     // Fm(add9) — the bass walks F–D♭–E♭–F
      ],
      chordNames: ['F5', 'D♭maj7♯11/F', 'E♭6/9/F', 'Fm9(13)', 'Fsus4', 'D♭maj9/F', 'Fm(add9)']
    },
    fx: { bloom: 0.55 },
    tags: ['TEMPLE SET', 'OPEN L = ENERGY', 'OPEN R = LIGHT', 'BOUND OR FREE — A REAL THRESHOLD'],
    desc: 'Shards of light thrown outward from a centre. With your hands at the Source it is a slow ember fountain: they climb, redden, slow, turn over and fall back into the dark, and the picture keeps returning to itself. Open the left hand and the energy rises — and somewhere past the middle of its travel the field reaches escape velocity and stops coming back. The shards straighten, run white, and leave. You feel the threshold arrive because it is not a fade, it is the moment the physics changes sign. Open further and the frame empties outward in a long ascending roar; close your hand and the sky rains embers again. The right hand is how many are burning and how far into the dark you can see them.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything — and this scene puts a cliff in the middle of the left hand on purpose. Closed: a fountain that always falls back. Halfway: shards hanging at the top of their arc, gold, almost free. Past it: everything commits and goes, white, straight, gone. Completely reversible — close back under the threshold and the next generation falls again. R OPENS THE LIGHT: how many shards, how bright, how long they read against the black. Each shard that crosses escape strikes one note on its way out, so opening past the threshold is an audible shower and holding it open is a rising roar.',
    sound: 'F aeolian, TWO bars a chord — the fastest harmonic rhythm in the set, and the bass walks F–D♭–E♭–F so the ground is always climbing under you. The bed is an ascending texture that only exists above half energy, so the roar is earned. Every escaping shard plucks a bell on the ladder, pitched by the angle it left at and panned to it; the escape RATE is therefore the note rate and the threshold is audible before it is countable. Sub on bass, pad on the chord, a low swell that opens with energy. Drums stay out — the rhythm here is the departures, and a grid would tame them.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(2400, Math.round(700 * areaScale(P)));
      const px = new Float32Array(n), py = new Float32Array(n);
      const vx = new Float32Array(n), vy = new Float32Array(n);
      const br = new Float32Array(n), wasFree = new Uint8Array(n);
      const st = { n, px, py, vx, vy, br, wasFree, S, cx: w / 2, cy: h * 0.56,
                   pres: 0, en: 0, light: 0, drift: P.rand() * 30, events: [], cool: 0, freed: 0, escRate: 0 };
      for (let i = 0; i < n; i++) st.br[i] = 0.25 + Math.pow(P.rand(), 1.8) * 0.75;
      P.state = st;
      P.state.spawn = (i, energy) => {
        const a = P.rand() * TAU;
        const bias = 0.78 + 0.34 * (1 - Math.abs(Math.sin(a)));   // a little more up and out: the wing
        const r = R0 * (0.75 + P.rand() * 0.6);
        px[i] = Math.cos(a) * r; py[i] = Math.sin(a) * r * 0.86;
        // Tuned so the threshold actually SWEEPS: at rest even the luckiest shard
        // (top of the random spread, best angle) stays bound, and at full energy
        // even the unluckiest gets out. A wider spread made a prettier palette and
        // a meaningless cliff — the cliff is the scene.
        const sp = vesc(r) * (0.34 + energy * 1.65) * (0.74 + P.rand() * 0.60) * bias;
        vx[i] = Math.cos(a) * sp; vy[i] = Math.sin(a) * sp * 0.92;
        br[i] = 0.25 + Math.pow(P.rand(), 1.8) * 0.75;
        wasFree[i] = 0;
      };
      // Seed the field mid-flight so it opens populated rather than as one
      // ring. Pushing a particle outward without paying for it would hand it
      // free energy and it would be born ESCAPING — the exact lie the
      // softened potential above exists to stop. So move it out, then take
      // the speed that move costs: v² = v0² + 2GM(1/rs(r) − 1/rs(r0)).
      for (let i = 0; i < n; i++) {
        P.state.spawn(i, 0.35);
        const r0 = Math.sqrt(px[i] * px[i] + py[i] * py[i]);
        const k = 1 + P.rand() * 3;
        px[i] *= k; py[i] *= k;
        const r1 = Math.sqrt(px[i] * px[i] + py[i] * py[i]);
        const v0 = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        const v1sq = v0 * v0 + 2 * GM * (1 / rsoft(r1) - 1 / rsoft(r0));
        const sc = Math.sqrt(Math.max(0.04, v1sq)) / Math.max(1e-6, v0);
        vx[i] *= sc; vy[i] *= sc;
      }
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleE = 0.20 + Math.sin(s.drift * 0.045) * 0.09;
      const idleL = 0.24 + Math.sin(s.drift * 0.068 + 2.4) * 0.09;
      s.en += ((SOURCE(inp.L) * s.pres + idleE * (1 - s.pres)) - s.en) * Math.min(1, dt * 5.5);
      s.light += ((SOURCE(inp.R) * s.pres + idleL * (1 - s.pres)) - s.light) * Math.min(1, dt * 6.5);
      s.cool = Math.max(0, s.cool - dt);

      const { n, px, py, vx, vy, br, wasFree } = s;
      const h = Math.min(0.033, dt) / SUB;
      let freed = 0, esc = 0;
      for (let i = 0; i < n; i++) {
        for (let k = 0; k < SUB; k++) {
          const r = Math.sqrt(px[i] * px[i] + py[i] * py[i]), rs = rsoft(r);
          const a = -GM / (rs * rs);                     // semi-implicit, softened
          vx[i] += a * (px[i] / rs) * h; vy[i] += a * (py[i] / rs) * h;
          px[i] += vx[i] * h; py[i] += vy[i] * h;
        }
        const r = Math.sqrt(px[i] * px[i] + py[i] * py[i]);
        const sp2 = vx[i] * vx[i] + vy[i] * vy[i];
        const free = sp2 > 2 * GM / rsoft(r) ? 1 : 0;
        if (free) freed++;
        if (free && !wasFree[i] && s.pres > 0.12 && br[i] > 0.55) {
          esc++;
          if (s.cool <= 0 && s.events.length < 5) {
            s.events.push({ ang: Math.atan2(py[i], px[i]), pan: clamp(px[i] * 0.9) , vel: br[i] });
            s.cool = 0.045 + (1 - s.en) * 0.22;
          }
        }
        wasFree[i] = free;
        if (r > 1.75 || (!free && r < R0 * 0.35)) s.spawn(i, s.en);
      }
      s.freed = freed / n;
      s.escRate += (Math.min(1, esc / 14) - s.escRate) * Math.min(1, dt * 4);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      // HOSTED BY THE MIXER: the ground is painted once, by the mixer, and a
      // layer that repaints it erases every layer under it. Standalone this
      // is unchanged.
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const { n, px, py, vx, vy, br, cx, cy, S } = s;
      const bright = (0.45 + s.pres * 0.55) * room;
      const cut = 1 - (0.20 + s.light * 0.80);
      const K = S * 0.46;
      const TRAIL = 0.055 + s.en * 0.075;
      const MAXL = S * (0.055 + s.en * 0.085);
      const BK = 6, paths = []; for (let b = 0; b < BK; b++) paths.push([]);

      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        const r = Math.sqrt(px[i] * px[i] + py[i] * py[i]);
        const sp = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        const T = sp / vesc(r);                     // 1.0 is exactly escape                    // temperature: speed against escape
        const ax = cx + px[i] * K, ay = cy + py[i] * K;
        const bx = ax - vx[i] * TRAIL * K, by = ay - vy[i] * TRAIL * K;
        if (ax < -w || ax > w * 2 || ay < -h || ay > h * 2) continue;
        // CAP THE SHARD. An escaping particle's speed is unbounded, so an
        // uncapped trail paints the whole frame white the moment the field
        // breaks free — the shard is a mark, not a measurement.
        let dx = ax - bx, dy = ay - by;
        const dl = Math.sqrt(dx * dx + dy * dy);
        if (dl > MAXL) { const k = MAXL / dl; dx *= k; dy *= k; }
        const tn = clamp((T - 0.25) / 1.00);           // spread the ramp over what is actually on screen
        const bk = Math.max(0, Math.min(BK - 1, (tn * BK) | 0));
        paths[bk].push(ax - dx, ay - dy, ax, ay);
      }

      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      // blackbody ramp: ember → gold → white → ice, driven only by temperature
      const RAMP = [[196, 44, 22], [232, 96, 34], [255, 158, 66], [255, 214, 140], [255, 248, 232], [206, 228, 255]];
      for (let b = 0; b < BK; b++) {
        const arr = paths[b]; if (!arr.length) continue;
        const c = RAMP[b], f = (b + 0.5) / BK;
        g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.045 + s.light * 0.155) * (0.35 + f * 0.6) * bright})`;
        g.lineWidth = (0.6 + f * 1.7) * ms;
        g.beginPath();
        for (let j = 0; j < arr.length; j += 4) { g.moveTo(arr[j], arr[j + 1]); g.lineTo(arr[j + 2], arr[j + 3]); }
        g.stroke();
      }

      // the source they are thrown from
      const sr = S * (0.035 + s.en * 0.045);
      const sg2 = g.createRadialGradient(cx, cy, 0, cx, cy, sr);
      sg2.addColorStop(0, `rgba(255,${Math.round(210 + s.freed * 45)},${Math.round(160 + s.freed * 90)},${(0.12 + s.light * 0.16) * bright})`);
      sg2.addColorStop(1, 'rgba(255,190,140,0)');
      g.fillStyle = sg2; g.beginPath(); g.arc(cx, cy, sr, 0, TAU); g.fill();

      // HOSTED: the mixer draws the readout for the whole movement. A layer
      // that also draws its own puts two lines of text on the same pixels.
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {

        g.globalCompositeOperation = 'source-over';

        g.fillStyle = 'rgba(225,225,235,0.8)';

        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;

        g.fillText('ENERGY ' + Math.round(s.en * 100) + '   FREE ' + Math.round(s.freed * 100) + '%   LIGHT ' + Math.round(s.light * 100) + (s.freed > 0.5 ? '   · ESCAPING' : '   · BOUND'), 10, h - 10);

      }

      // HOSTED: the mixer runs the poems once for the whole movement. Left in,
      // this ran the overlay once PER LIVE LAYER — the dark plate stacked and
      // the text was painted over itself three times a frame.
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.0035, cutoff: 200, q: 0.8, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 44), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      // the roar: only above half energy, so it is earned
      const nz = A.ctx.createBufferSource(); nz.buffer = A.noiseBuf(); nz.loop = true;
      const nf = v.filter('highpass', 300, 0.7), ng = v.g(0.0001);
      nz.connect(nf); nf.connect(ng); ng.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; ng.connect(sd); sd.connect(A.revIn); }
      try { nz.start(); } catch (e) {}
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.25); tune(0.22); });
      v.fadeIn(1, 1.6);
      return {
        tick(inp, dt) {
          const s = P.state, gate = 0.3 + s.pres * 0.7, E = s.en, L = s.light;
          const roar = clamp((E - 0.45) / 0.55);
          A.set(ng.gain, roar * roar * 0.010 * (0.4 + L * 0.7) * gate, 0.3);
          A.set(nf.frequency, 280 + roar * 1500, 0.4);
          pad.forEach(p => { p.level((0.0016 + E * 0.004) * gate, 0.35); p.bright(160 + E * 900 + L * 300, 0.3); });
          A.set(sg.gain, (0.014 + E * 0.022) * gate, 0.3);
          let k = 0;
          while (s.events.length) {
            const e = s.events.shift(); if (k++ > 3) continue;
            const deg = Math.round(clamp(0.5 - Math.sin(e.ang) * 0.5) * 4);
            A.tone(H.chordTone(deg, e.ang < 0 ? 1 : 0), { vol: (0.004 + e.vel * 0.016) * (0.3 + L * 0.7) * gate, dur: 2.6, attack: 0.006, type: 'sine', rev: 0.85, role: 'bells', pan: e.pan * 0.8 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', E); MOut.expr('texture', roar); MOut.expr('bells', s.escRate); MOut.expr('bass', E); }
        },
        stop() { try { nz.stop(); } catch (e) {} v.kill(); }
      };
    }
  });
})();
