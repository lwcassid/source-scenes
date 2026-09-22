/* ---------- SRC-53.2 · ORBITS (and there it remains) ----------
   TEMPLE SET V2. Everything on screen is in orbit around an unseen centre —
   thousands of points, full frame. The LEFT hand is ECCENTRICITY: circles
   stretch into long ellipses, every orbit at once, the whole field
   elongating; the RIGHT hand is LIGHT. Kepler's second law does the rest —
   points rush the periapsis and hang at the far end. */
(() => {
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(8, 8, 0, 8, 8, 8);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.4, `rgba(${rgb},0.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 16, 16);
    return (SPR[key] = c);
  }
  const BANDS = 5;
  const BAND = ['255,215,150', '255,190,160', '225,190,235', '170,180,255', '150,205,255'];

  reg({
    id: 'SRC-53.2', family: 'SRC-53', ver: 2, title: 'Orbits', tech: 'KEPLERIAN FIELD / ECCENTRICITY IN HAND',
    music: {
      bpm: 60, root: 40, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 12, 19, 22],    // Em7(no3)
        [0, 7, 15, 19, 26],    // Em9
        [0, 8, 15, 19, 24],    // Cmaj7/E
        [0, 5, 12, 17, 24]     // Esus4
      ],
      chordNames: ['Em7(no3)', 'Em9', 'Cmaj7/E', 'Esus4']
    },
    fx: { bloom: 0.55 },
    tags: ['TEMPLE SET', 'L STRETCHES EVERY ORBIT', 'R IS THE LIGHT', 'FIVE BANDS, FIVE VOICES'],
    desc: 'Thousands of points in orbit around a centre you never see, filling the frame in five nested bands, gold at the heart and blue at the rim. The left hand stretches them: lean in and every orbit goes from a circle to a long ellipse at once, the whole field elongating and turning, the points rushing through the near end and hanging at the far one exactly as Kepler said they would. The right hand is the light — how many of them shine and how long a trail each one leaves. It never stops moving and nothing about it waits for you; what changes is the SHAPE of the motion, and you can see it change from across a room.',
    interact: 'L = ECCENTRICITY. Drawn back the orbits are circles, a calm layered disc. Lean in and they stretch — the far ends reach out past the frame, the near ends crowd the centre, and the pace of every point changes with its place in the orbit. The stretch also slowly rotates, so the field turns as it lengthens. R = LIGHT. Lean in and more points shine, brighter, with longer trails; drawn back only the brightest few are left, a sparse slow constellation. The sound follows exactly: five bands of orbit are five held voices; stretch darkens and slows their colour, light brings them up.',
    sound: 'An E aeolian pedal. Five held voices (MIDI role: texture — one per orbit band, low inside to high outside, browser-side triangle stacks) whose levels follow R and whose detune widens with eccentricity, so stretched orbits BEAT slowly against each other and circles ring pure. A sub root on bass. Eccentricity also pulls the pad filter down (dark = far from the centre). No rhythm; the far-end hang IS the rhythm, and it is the band\'s to fill. CC74: texture = light, pad = eccentricity. A pad-channel chord per chord change (rolled) so the rack carries the harmony.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(3600, Math.round(1050 * as));
      const a = new Float32Array(n), th = new Float32Array(n), om = new Float32Array(n), br = new Float32Array(n), band = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const u = Math.pow(P.rand(), 0.8);
        a[i] = S * (0.06 + u * 0.4); band[i] = Math.min(BANDS - 1, Math.floor(u * BANDS));
        th[i] = P.rand() * TAU; om[i] = (P.rand() - 0.5) * 0.5; br[i] = 0.3 + Math.pow(P.rand(), 2) * 0.7;
      }
      P.state = { n, a, th, om, br, band, pres: 0, ecc: 0, light: 0, rot: 0, drift: 0, cx: w / 2, cy: h / 2, px: new Float32Array(n), py: new Float32Array(n), bandE: new Float32Array(BANDS) };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleE = 0.25 + Math.sin(s.drift * 0.06) * 0.2, idleL = 0.35 + Math.sin(s.drift * 0.09) * 0.1;
      s.ecc += ((clamp(inp.L) * s.pres + idleE * (1 - s.pres)) - s.ecc) * Math.min(1, dt * 5);
      s.light += ((clamp(inp.R) * s.pres + idleL * (1 - s.pres)) - s.light) * Math.min(1, dt * 6);
      const e = s.ecc * 0.72;
      s.rot += dt * (0.02 + s.ecc * 0.05);
      const { n, a, th, om, px, py } = s;
      const S = Math.min(P.w, P.h);
      const k = Math.pow(1 - e * e, 1.5);
      const cr = Math.cos(s.rot), sr = Math.sin(s.rot);
      for (let i = 0; i < n; i++) {
        // Kepler II: angular rate ∝ (1 + e cos θ)² / (1-e²)^1.5, scaled by a^-1.5
        const c = Math.cos(th[i]);
        const w0 = 0.55 * Math.pow(a[i] / (S * 0.3), -1.5);
        th[i] += w0 * (1 + e * c) * (1 + e * c) / k * dt;
        const r = a[i] * (1 - e * e) / (1 + e * Math.cos(th[i]));
        const ang = th[i] + om[i];
        const x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.82;
        px[i] = s.cx + x * cr - y * sr; py[i] = s.cy + x * sr + y * cr;
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      // trails: fade the last frame instead of clearing — the light hand sets how long they last
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(0,0,0,${0.7 - s.light * 0.4})`;
      g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const L = s.light;
      const { n, px, py, br, band } = s;
      g.globalCompositeOperation = 'lighter';
      const cut = 1 - (0.15 + L * 0.85);                             // the dimmest points go out as the light drops
      const spr = BAND.map((c, i) => sprite('b' + i, c));
      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        g.globalAlpha = br[i] * (0.12 + L * 0.4) * bright;
        const r = (1.2 + br[i] * 1.8) * ms * (0.8 + L * 0.4);
        g.drawImage(spr[band[i]], px[i] - r, py[i] - r, r * 2, r * 2);
      }
      g.globalAlpha = 1;
      // the centre: the unseen mass, only a breath of light
      const gr = g.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, Math.min(w, h) * 0.08);
      gr.addColorStop(0, `rgba(255,235,200,${(0.08 + L * 0.2) * bright})`); gr.addColorStop(1, 'rgba(255,235,200,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(s.cx, s.cy, Math.min(w, h) * 0.08, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(225,225,235,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('ECC ' + (s.ecc * 0.72).toFixed(2) + '   LIGHT ' + Math.round(L * 100) + (s.pres < 0.3 ? '   · CIRCLING' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.004, cutoff: 220, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.03); sub.connect(sg); sg.connect(v.group);
      // five bands, five held voices — the texture mirror holds each as a note
      const bands = [];
      for (let b = 0; b < BANDS; b++) {
        const o = v.osc('triangle', 220), o2 = v.osc('triangle', 220), f = v.filter('lowpass', 900, 0.7), gg = v.g(0.0001);
        o.connect(f); o2.connect(f); f.connect(gg);
        A.pan(gg, (b / (BANDS - 1) - 0.5) * 1.2).connect(v.group);
        if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.65; gg.connect(sd); sd.connect(A.revIn); }
        bands.push({ o, o2, f, gg });
      }
      const tune = gl => {
        A.set(sub.frequency, H.chordTone(0, -2), gl);
        bands.forEach((bd, b) => { const f = H.chordTone(b, b < 2 ? -1 : 0); A.set(bd.o.frequency, f, gl); A.set(bd.o2.frequency, f, gl); });
      };
      tune(0.05);
      const strike = () => { const now = A.t(); for (let i = 0; i < 3; i++) A.tone(H.chordTone(i, -1), { at: now + 0.08 * i, vol: 0.0001, dur: 3.5, attack: 0.5, type: 'sine', rev: 0, role: 'pad' }); };
      H.onChord(() => { place(0.2); tune(0.15); strike(); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state;
          const gate = 0.3 + s.pres * 0.7, L = s.light, E = s.ecc;
          bands.forEach((bd, b) => {
            const lvl = (0.002 + L * 0.007) * (1 - b * 0.08) * gate;
            A.set(bd.gg.gain, lvl, 0.3);
            A.set(bd.f.frequency, 300 + L * 1400 - E * 600 + b * 120, 0.3);
            try { bd.o2.detune.setTargetAtTime((b % 2 ? 1 : -1) * (3 + E * 22), A.t(), 0.4); } catch (e) {}
          });
          pad.forEach(p => { p.level(0.003 * gate, 0.4); p.bright(180 + L * 500 - E * 100, 0.3); });
          A.set(sg.gain, (0.025 + L * 0.01) * gate, 0.2);
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', L); MOut.expr('pad', E); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
