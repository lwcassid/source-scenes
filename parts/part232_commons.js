/* ---------- SRC-52.2 · THE COMMONS (one sky) ----------
   TEMPLE SET V2. "The oldest commons we share": a sky of thousands of stars —
   every one a name — that FLOWS like a liquid under the hand and BENDS as if
   lensed. Full frame, instant, continuous; the sit-in scene, no rhythm at all. */
(() => {
  reg({
    id: 'SRC-52.2', family: 'SRC-52', ver: 2, title: 'The Commons', tech: 'LIQUID STAR FIELD / LENSED SKY',
    music: {
      bpm: 62, root: 45, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 14, 19, 24],    // Am(add9)
        [0, 8, 15, 19, 26],    // Fmaj7#11/A
        [0, 5, 12, 17, 21],    // Dm9/A
        [0, 7, 10, 17, 22]     // Am11
      ],
      chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am11']
    },
    fx: { bloom: 0.55 },
    tags: ['TEMPLE SET', 'L IS THE WIND', 'R BENDS THE SKY', 'THE SIT-IN'],
    desc: 'A whole sky of stars, edge to edge, and it is not fixed: it flows. The left hand is a wind across it — lean in and the stars stream, curling into eddies, every point drawing a short streak of light where it runs. The right hand bends it: a lens moves slowly through the sky and, as you reach, the stars nearest it are pulled into a swirl and brightened, the sky warping around the place like light around a mass. Both hands out and it is a still night; both in and the sky is a river of light folding over itself. Ten thousand names and the one sky they share.',
    interact: 'L = THE WIND. Lean in and the whole field streams — slow drift becomes a current becomes a torrent, and the stars stretch into streaks as they speed up. Its direction slowly turns on its own so the picture never runs one way for long. R = THE BEND. Lean in and a moving lens grips the sky: stars near it swirl in and brighten, the field warps around it, and the more you reach the wider and deeper the warp. Together: a wind through a bent sky. Nothing snaps to a grid; every response is continuous.',
    sound: 'An A aeolian pedal — five triangle pad voices browser-side, sub root on bass — with no rhythm of any kind: this is where the flute and the guitar sit in. L (the wind) is the pad\'s brightness and a soft air bed whose level follows the field\'s mean speed (MIDI role: texture, CC74 = speed). R (the bend) is a single high voice (MIDI role: lead, held) that steps up the chord ladder as the warp deepens — stepped and glided, so it always lands on a real tone — with its level riding the bend; in the pad it opens the filter and widens the detune. CC74: lead = bend, texture = wind.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h;
      const n = Math.min(9000, Math.round(2600 * as));
      const x = new Float32Array(n), y = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n), br = new Float32Array(n), sz = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        x[i] = P.rand() * w; y[i] = P.rand() * h;
        br[i] = 0.25 + Math.pow(P.rand(), 2.2) * 0.75; sz[i] = 0.6 + Math.pow(P.rand(), 3) * 1.8;
      }
      P.state = { n, x, y, vx, vy, br, sz, pres: 0, wind: 0, bend: 0, dir: 0, lx: w * 0.5, ly: h * 0.5, spd: 0, drift: 0, rung: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state, w = P.w, h = P.h, S = Math.min(w, h);
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleW = 0.12 + Math.sin(s.drift * 0.07) * 0.08, idleB = 0.15 + Math.max(0, Math.sin(s.drift * 0.05)) * 0.2;
      s.wind += ((clamp(inp.L) * s.pres + idleW * (1 - s.pres)) - s.wind) * Math.min(1, dt * 6);
      s.bend += ((clamp(inp.R) * s.pres + idleB * (1 - s.pres)) - s.bend) * Math.min(1, dt * 6);
      s.dir += dt * 0.06;                                               // the wind slowly veers
      // the lens wanders on its own slow Lissajous
      s.lx = w * (0.5 + Math.sin(s.drift * 0.11) * 0.28);
      s.ly = h * (0.5 + Math.sin(s.drift * 0.083 + 1.3) * 0.28);
      const W = s.wind, B = s.bend;
      const speed = 8 + W * W * 420;
      const k = 0.0021 / Math.sqrt(areaScale(P));
      const sig = S * (0.14 + B * 0.32), sig2 = sig * sig;
      const grip = B * B * 900;
      const cd = Math.cos(s.dir), sd = Math.sin(s.dir);
      let sum = 0;
      const { x, y, vx, vy, n } = s;
      for (let i = 0; i < n; i++) {
        const px = x[i], py = y[i];
        // the wind: a curl field — the direction turns with position and time, more so with the wind
        const th = s.dir + Math.sin(py * k * 1.7 + s.drift * 0.21) * (0.6 + W * 1.2) + Math.cos(px * k * 1.1 - s.drift * 0.16) * (0.5 + W * 0.9);
        let fx = Math.cos(th) * speed, fy = Math.sin(th) * speed;
        // the lens: a swirl around the mass, pulling in
        const dx = s.lx - px, dy = s.ly - py, d2 = dx * dx + dy * dy;
        if (d2 < sig2 * 6) {
          const g = Math.exp(-d2 / sig2) * grip;
          const d = Math.sqrt(d2) + 1;
          fx += (dx / d) * g * 0.35 - (dy / d) * g; fy += (dy / d) * g * 0.35 + (dx / d) * g;
        }
        vx[i] += (fx - vx[i]) * Math.min(1, dt * 3); vy[i] += (fy - vy[i]) * Math.min(1, dt * 3);
        let nx = px + vx[i] * dt, ny = py + vy[i] * dt;
        if (nx < -4) nx += w + 8; else if (nx > w + 4) nx -= w + 8;
        if (ny < -4) ny += h + 8; else if (ny > h + 4) ny -= h + 8;
        x[i] = nx; y[i] = ny;
        sum += Math.abs(vx[i]) + Math.abs(vy[i]);
      }
      s.spd += (clamp(sum / n / 320) - s.spd) * Math.min(1, dt * 3);
      s.rung = Math.round(B * 5);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const { x, y, vx, vy, br, sz, n } = s;
      const B = s.bend, sig = Math.min(w, h) * (0.14 + B * 0.32), sig2 = sig * sig;
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      // every star: a dot, or a streak along its velocity when it is moving; the
      // lensed ones brighten and warm. Two passes so the fast ones are one path.
      for (let i = 0; i < n; i++) {
        const spd = Math.hypot(vx[i], vy[i]);
        const dx = s.lx - x[i], dy = s.ly - y[i];
        const lens = Math.exp(-(dx * dx + dy * dy) / sig2) * B;
        const a = (br[i] * (0.35 + lens * 0.9) * bright);
        const r = sz[i] * ms * (1 + lens * 1.2);
        // colour from the FORM: still stars blue-white, fast/lensed ones gold-white
        const heat = clamp(spd / 400 + lens);
        const col = `rgba(${205 + heat * 50 | 0},${220 + heat * 15 | 0},${255 - heat * 45 | 0},${a})`;
        if (spd > 40) {
          const k = Math.min(0.09, 24 / spd);
          g.strokeStyle = col; g.lineWidth = r * 1.6;
          g.beginPath(); g.moveTo(x[i], y[i]); g.lineTo(x[i] - vx[i] * k, y[i] - vy[i] * k); g.stroke();
        } else {
          g.fillStyle = col;
          g.fillRect(x[i] - r, y[i] - r, r * 2, r * 2);
        }
      }
      // the lens itself: a faint ring of light where the sky is bent hardest
      if (B > 0.05) {
        const rr = sig * 0.9;
        const gr = g.createRadialGradient(s.lx, s.ly, rr * 0.6, s.lx, s.ly, rr * 1.6);
        gr.addColorStop(0, 'rgba(255,230,200,0)'); gr.addColorStop(0.5, `rgba(255,230,200,${B * 0.12 * bright})`); gr.addColorStop(1, 'rgba(255,230,200,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(s.lx, s.ly, rr * 1.6, 0, TAU); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(220,225,240,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('WIND ' + Math.round(s.wind * 100) + '   BEND ' + Math.round(s.bend * 100) + ' rung ' + s.rung + '   SPEED ' + Math.round(s.spd * 100) + (s.pres < 0.3 ? '   · STILL NIGHT' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 5, { type: 'triangle', gain: 0.005, cutoff: 260, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.03); sub.connect(sg); sg.connect(v.group);
      // the air: the wind's own sound
      const nz = v.noise(), nf = v.filter('bandpass', 700, 0.7), ng = v.g(0.0001); nz.connect(nf); nf.connect(ng); ng.connect(v.group);
      // the bend voice: one high held tone that steps the ladder with the warp
      const lo = v.osc('triangle', 440), lo2 = v.osc('sine', 880), lf = v.filter('lowpass', 1400, 0.8), lg = v.g(0.0001);
      lo.connect(lf); lo2.connect(lf); lf.connect(lg); lg.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.8; lg.connect(sd); sd.connect(A.revIn); }
      let rung = -1;
      const tune = gl => {
        A.set(sub.frequency, H.chordTone(0, -2), gl);
        const f = H.chordTone(P.state.rung, 1); A.set(lo.frequency, f, gl); A.set(lo2.frequency, f * 2, gl);
      };
      tune(0.05);
      H.onChord(() => { place(0.2); tune(0.12); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state;
          const gate = 0.3 + s.pres * 0.7, W = s.wind, B = s.bend;
          if (s.rung !== rung) { rung = s.rung; tune(0.09); }
          pad.forEach((p, i) => { p.level((0.004 + B * 0.006 + W * 0.003) * gate, 0.3); p.bright(220 + W * 900 + B * 600, 0.25); try { p.o2.detune.setTargetAtTime(5 + i * 2.4 + B * 14, A.t(), 0.3); } catch (e) {} });
          A.set(sg.gain, 0.028 * gate, 0.2);
          A.set(ng.gain, (0.001 + s.spd * 0.02) * gate, 0.2); A.set(nf.frequency, 400 + s.spd * 1800, 0.2);
          A.set(lg.gain, (B * B * 0.012) * gate, 0.2); A.set(lf.frequency, 600 + B * 2000, 0.2);
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('lead', B); MOut.expr('texture', s.spd); MOut.expr('pad', W); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
