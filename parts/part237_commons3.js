/* ---------- SRC-52.3 · THE COMMONS V3 (the sky plays itself) ----------
   V2's liquid sky, polished: the lens no longer wanders on its own — it
   drifts toward the hands' BALANCE (more left hand pulls it left, more
   right pulls it right), stars near it stretch tangentially like an
   Einstein ring, and small stars move slower than big ones so the sky has
   depth. The SOUND is now the sit-in it claimed to be: a slow BOWED voice
   gliding through chord tones under the bend, and the brightest stars
   crossing the lens plink on their own time in stereo — the drawn thing
   plays the notes. Parallax stars, pearl palette. */
(() => {
  reg({
    id: 'SRC-52.3', family: 'SRC-52', ver: 3, title: 'The Commons', tech: 'LIQUID STAR FIELD / THE SKY PLAYS ITSELF',
    music: {
      bpm: 62, root: 45, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 14, 19, 24],    // Am(add9)      top E
        [0, 8, 15, 19, 26],    // Fmaj7#11/A    top D
        [0, 5, 12, 17, 21],    // Dm9/A         top C  (the top line walks down: E D C B)
        [0, 7, 10, 14, 23]     // Am7(add9)/G#  top B
      ],
      chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am(maj7)9']
    },
    fx: { bloom: 0.55 },
    tags: ['TEMPLE SET', 'L IS THE WIND', 'R BENDS THE SKY', 'THE SIT-IN'],
    desc: 'A whole sky of stars, edge to edge, and it flows. The left hand is a wind across it — lean in and the stars stream, curling into eddies, the big ones fast and the small ones slow so the sky has depth. The right hand bends it: a lens the hands steer between them grips the sky, stars near it stretch into arcs around it and brighten, and the field warps like light around a mass. Both hands out and it is a still night; both in and it is a river of light folding over itself. Ten thousand names and the one sky they share — and the sky plays: the brightest stars that cross the lens plink as they pass.',
    interact: 'L = THE WIND. Lean in and the field streams — drift, current, torrent — the stars stretching into streaks, big ones leading. Its direction slowly veers. R = THE BEND. Lean in and the lens grips: stars swirl in, brighten, and stretch into arcs around it; the more you reach the wider and deeper the warp. The lens sits where the hands put it — lean harder on the left and it drifts left, on the right and it drifts right — so aiming it is the two hands together. Nothing snaps to a grid.',
    sound: 'A aeolian, four-bar chords whose top voice walks down E–D–C–B. Under it: five pad voices browser-side, a sub. The BEND is a bowed voice (MIDI role: lead, held) — slow attack, gliding step-and-glide through the chord ladder as the warp deepens, with a vibrato that widens with the wind and a filter kick when the bend hand MOVES. The WIND is an air bed (texture, CC74 = field speed). The stars play: when one of the brightest few hundred crosses the lens\'s core, it plinks (bells) — a soft high note on the ladder, panned to where it is on screen, its velocity from its brightness, never more than ~3 a second and never on a grid — so a strong bend over a fast sky is a slow shower of notes for the flute to answer. No drums.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h;
      const n = Math.min(9000, Math.round(2600 * as));
      const x = new Float32Array(n), y = new Float32Array(n), vx = new Float32Array(n), vy = new Float32Array(n), br = new Float32Array(n), sz = new Float32Array(n), inL = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        x[i] = P.rand() * w; y[i] = P.rand() * h;
        br[i] = 0.25 + Math.pow(P.rand(), 2.2) * 0.75; sz[i] = 0.6 + Math.pow(P.rand(), 3) * 1.8;
      }
      P.state = { n, x, y, vx, vy, br, sz, inL, pres: 0, wind: 0, bend: 0, dir: 0, lx: w * 0.5, ly: h * 0.5, spd: 0, drift: 0, rung: 0, bvel: 0, events: [], plinkT: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state, w = P.w, h = P.h, S = Math.min(w, h);
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleW = 0.12 + Math.sin(s.drift * 0.07) * 0.08, idleB = 0.15 + Math.max(0, Math.sin(s.drift * 0.05)) * 0.2;
      const pb = s.bend;
      s.wind += ((clamp(inp.L) * s.pres + idleW * (1 - s.pres)) - s.wind) * Math.min(1, dt * 6);
      s.bend += ((clamp(inp.R) * s.pres + idleB * (1 - s.pres)) - s.bend) * Math.min(1, dt * 6);
      s.bvel += (Math.abs(s.bend - pb) / Math.max(dt, 1e-3) - s.bvel) * Math.min(1, dt * 5);
      s.dir += dt * 0.06;
      // the lens: steered by the hands' balance, with a slow breath of its own on top
      const bal = (clamp(inp.R) - clamp(inp.L)) * s.pres;
      const tx = w * (0.5 + bal * 0.3 + Math.sin(s.drift * 0.07) * 0.06), ty = h * (0.5 + Math.sin(s.drift * 0.05 + 1.3) * 0.12);
      s.lx += (tx - s.lx) * Math.min(1, dt * 0.8); s.ly += (ty - s.ly) * Math.min(1, dt * 0.8);
      const W = s.wind, B = s.bend;
      const speed = 8 + W * W * 420;
      const k = 0.0021 / Math.sqrt(areaScale(P));
      const sig = S * (0.12 + B * 0.2), sig2 = sig * sig, core2 = sig2 * 0.12;
      const grip = B * B * 560;
      let sum = 0;
      const { x, y, vx, vy, n, sz, br, inL } = s;
      s.plinkT = Math.max(0, s.plinkT - dt);
      for (let i = 0; i < n; i++) {
        const px = x[i], py = y[i];
        const th = s.dir + Math.sin(py * k * 1.7 + s.drift * 0.21) * (0.6 + W * 1.2) + Math.cos(px * k * 1.1 - s.drift * 0.16) * (0.5 + W * 0.9);
        const par = 0.45 + sz[i] * 0.35;                                   // parallax: big stars are near and fast
        let fx = Math.cos(th) * speed * par, fy = Math.sin(th) * speed * par;
        const dx = s.lx - px, dy = s.ly - py, d2 = dx * dx + dy * dy;
        if (d2 < sig2 * 6) {
          const g = Math.exp(-d2 / sig2) * grip;
          const d = Math.sqrt(d2) + 1;
          fx += (dx / d) * g * 0.12 - (dy / d) * g; fy += (dy / d) * g * 0.12 + (dx / d) * g;
          // the brightest stars crossing the core PLAY — rising edge, rate-limited
          const inCore = d2 < core2 ? 1 : 0;
          if (inCore && !inL[i] && br[i] > 0.78 && s.plinkT <= 0 && B > 0.25) {
            s.events.push({ kind: 'plink', pan: (px / w) * 2 - 1, vol: br[i], hi: (1 - py / h) });
            s.plinkT = 0.33;
          }
          inL[i] = inCore;
        } else inL[i] = 0;
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
      const B = s.bend, sig = Math.min(w, h) * (0.12 + B * 0.2), sig2 = sig * sig;
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const spd = Math.hypot(vx[i], vy[i]);
        const dx = s.lx - x[i], dy = s.ly - y[i], d2 = dx * dx + dy * dy;
        const lens = Math.exp(-d2 / sig2) * B;
        const a = (br[i] * (0.35 + lens * 0.5) * bright) * (1 - lens * 0.45);   // lensed stars spread their light along the arc, not pile it
        const r = sz[i] * ms * (1 + lens * 1.2);
        const heat = clamp(spd / 400 + lens);
        const col = `rgba(${205 + heat * 50 | 0},${220 + heat * 15 | 0},${255 - heat * 45 | 0},${a})`;
        if (lens > 0.12) {
          // lensed: stretched along the tangent — an arc around the mass
          const d = Math.sqrt(d2) + 1, tx = -dy / d, ty = dx / d, L = r * (1.5 + lens * 6);
          g.strokeStyle = col; g.lineWidth = r * 1.1;
          g.beginPath(); g.moveTo(x[i] - tx * L, y[i] - ty * L); g.lineTo(x[i] + tx * L, y[i] + ty * L); g.stroke();
        } else if (spd > 40) {
          const k = Math.min(0.09, 24 / spd);
          g.strokeStyle = col; g.lineWidth = r * 1.6;
          g.beginPath(); g.moveTo(x[i], y[i]); g.lineTo(x[i] - vx[i] * k, y[i] - vy[i] * k); g.stroke();
        } else {
          g.fillStyle = col;
          g.fillRect(x[i] - r, y[i] - r, r * 2, r * 2);
        }
      }
      if (B > 0.05) {
        const rr = sig * 0.9;
        const gr = g.createRadialGradient(s.lx, s.ly, rr * 0.6, s.lx, s.ly, rr * 1.6);
        gr.addColorStop(0, 'rgba(255,230,200,0)'); gr.addColorStop(0.5, `rgba(255,230,200,${B * 0.12 * bright})`); gr.addColorStop(1, 'rgba(255,230,200,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(s.lx, s.ly, rr * 1.6, 0, TAU); g.fill();
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(220,225,240,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('WIND ' + Math.round(s.wind * 100) + '   BEND ' + Math.round(s.bend * 100) + ' rung ' + s.rung + '   SPEED ' + Math.round(s.spd * 100) + '   LENS ' + Math.round(s.lx / w * 100) + '%' + (s.pres < 0.3 ? '   · STILL NIGHT' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 5, { type: 'triangle', gain: 0.005, cutoff: 260, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.03); sub.connect(sg); sg.connect(v.group);
      const nz = v.noise(), nf = v.filter('bandpass', 700, 0.7), ng = v.g(0.0001); nz.connect(nf); nf.connect(ng); ng.connect(v.group);
      // the bowed voice: two detuned triangles, vibrato LFO, its own filter with a mouth
      const lo = v.osc('triangle', 440), lo2 = v.osc('triangle', 440), lf = v.filter('lowpass', 1400, 1.2), lg = v.g(0.0001);
      lo2.detune.value = 6;
      const vib = v.osc('sine', 5), vg = v.g(0); vib.connect(vg); vg.connect(lo.frequency); vg.connect(lo2.frequency);
      lo.connect(lf); lo2.connect(lf); lf.connect(lg); lg.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.8; lg.connect(sd); sd.connect(A.revIn); }
      let rung = -1, mouth = 0;
      const tune = gl => {
        A.set(sub.frequency, H.chordTone(0, -2), gl);
        const f = H.chordTone(P.state.rung, 1); A.set(lo.frequency, f, gl); A.set(lo2.frequency, f, gl);
      };
      tune(0.05);
      const strike = () => { const now = A.t(); for (let i = 0; i < 4; i++) A.tone(H.chordTone(i, -1), { at: now + 0.09 * i, vol: 0.0001, dur: 4, attack: 0.6, type: 'sine', rev: 0, role: 'pad' }); };
      H.onChord(() => { place(0.2); tune(0.12); strike(); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7, W = s.wind, B = s.bend;
          if (s.rung !== rung) { rung = s.rung; tune(0.09); }
          pad.forEach((p, i) => { p.level((0.004 + B * 0.005 + W * 0.003) * gate, 0.3); p.bright(220 + W * 900 + B * 600, 0.25); try { p.o2.detune.setTargetAtTime(5 + i * 2.4 + B * 14, now, 0.3); } catch (e) {} });
          A.set(sg.gain, 0.028 * gate, 0.2);
          A.set(ng.gain, (0.001 + s.spd * 0.02) * gate, 0.2); A.set(nf.frequency, 400 + s.spd * 1800, 0.2);
          // the bow: level rides the bend, vibrato widens with the wind, the mouth kicks open on motion
          mouth = Math.max(mouth * Math.exp(-dt * 3), clamp(s.bvel * 0.8));
          A.set(lg.gain, (B * B * 0.014) * gate, 0.25);
          A.set(lf.frequency, 500 + B * 1600 + mouth * 1800, 0.06);
          try { lf.Q.setTargetAtTime(1.2 + mouth * 5, now, 0.06); } catch (e) {}
          A.set(vg.gain, 1.5 + W * 6, 0.3); A.set(vib.frequency, 4.5 + W * 1.5, 0.3);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'plink') A.bell(H.chordTone(3 + Math.floor(e.hi * 4), 2), { vol: (0.006 + e.vol * 0.022) * gate * (0.5 + B * 0.5), dur: 2.2, rev: 0.85, pan: e.pan * 0.8 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('lead', clamp(0.3 + B * 0.5 + mouth * 0.4)); MOut.expr('texture', s.spd); MOut.expr('pad', W); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
