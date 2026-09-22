/* ---------- SRC-53.3 · ORBITS V3 (the phasing choir) ----------
   V2's Keplerian field with the picture and the score joined. Points GLOW
   while they hang at the far end of a stretched orbit (Kepler's slow
   apoapsis is now visible as light), the centre carries a faint periapsis
   ring, and the SOUND is a phasing choir: each of the five bands is a
   voice that swells at its own orbital rate — inner fast, outer slow —
   so with round orbits the five breathe in a hocket and eccentricity
   turns it into long legato surges. Each band has a TRACER whose
   periapsis pass plucks its note, louder the faster it rushes. */
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
    id: 'SRC-53.3', family: 'SRC-53', ver: 3, title: 'Orbits', tech: 'KEPLERIAN FIELD / THE PHASING CHOIR',
    music: {
      bpm: 60, root: 40, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 12, 19, 26],    // Em9(no3)   top F♯
        [0, 7, 12, 19, 24],    // E5         top E
        [0, 8, 15, 19, 23],    // Cmaj7/E    top D♯
        [0, 5, 12, 17, 22]     // Em7sus4    top D
      ],
      chordNames: ['Em9(no3)', 'E5', 'Cmaj7/E', 'Em7sus4']
    },
    fx: { bloom: 0.55 },
    tags: ['TEMPLE SET', 'L STRETCHES EVERY ORBIT', 'R IS THE LIGHT', 'FIVE VOICES PHASING'],
    desc: 'Thousands of points in orbit around a centre you never see, in five nested bands from gold to blue. The left hand stretches every orbit at once from circle to long ellipse: the far ends reach out past the frame, and the points, obeying Kepler, rush the near end and HANG at the far one — and while they hang they glow, so a stretched field is a slow shower of light at its tips. The right hand is the light: how many shine, how long their trails last. And the field sings: each band is a voice that swells at its own orbital pace, five breaths interleaved, and stretching the orbits stretches the breaths into long surges.',
    interact: 'L = ECCENTRICITY. Drawn back the orbits are circles: a calm layered disc and five voices breathing in a round, the inner ones quick, the outer slow. Lean in and every orbit stretches — points crowd and rush the centre, drift out and hang glowing at the far end — and the voices stretch with them into long legato swells that beat against each other. Each band\'s brightest point plucks a note as it whips through the near end; the faster it rushes, the harder the pluck. R = LIGHT. More points, brighter, longer trails, and the choir comes up; drawn back, a sparse slow constellation and a whisper.',
    sound: 'E aeolian, four-bar chords, top voice stepping F♯–E–D♯–D. Five held voices (MIDI role: texture, one per band, low inside to high outside) each with a TREMOLO at its band\'s mean orbital rate — that IS the phasing; eccentricity deepens the tremolo and widens each voice\'s detune (up to ~22 cents) so stretched orbits beat. Every band has a tracer point; its periapsis pass fires ONE pluck on that band\'s ladder rung (lead), velocity from eccentricity (a circle barely plucks, a comet strikes), per-band cooldown so nothing machine-guns. Sub root on bass. Light (R) is the choir\'s level and filter. Pad chord to the rack per change, rolled. No drums.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(3600, Math.round(1050 * as));
      const a = new Float32Array(n), th = new Float32Array(n), om = new Float32Array(n), br = new Float32Array(n), band = new Uint8Array(n);
      const tracer = new Int32Array(BANDS).fill(-1), tbest = new Float32Array(BANDS);
      for (let i = 0; i < n; i++) {
        const u = Math.pow(P.rand(), 0.8);
        a[i] = S * (0.06 + u * 0.4); band[i] = Math.min(BANDS - 1, Math.floor(u * BANDS));
        th[i] = P.rand() * TAU; om[i] = (P.rand() - 0.5) * 0.5; br[i] = 0.3 + Math.pow(P.rand(), 2) * 0.7;
        if (br[i] > tbest[band[i]]) { tbest[band[i]] = br[i]; tracer[band[i]] = i; }
      }
      P.state = { n, a, th, om, br, band, tracer, pres: 0, ecc: 0, light: 0, rot: 0, drift: 0, cx: w / 2, cy: h / 2, px: new Float32Array(n), py: new Float32Array(n), hang: new Float32Array(n), rate: new Float32Array(BANDS), events: [], lastCos: new Float32Array(BANDS), cool: new Float32Array(BANDS) };
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
      const { n, a, th, om, px, py, hang, band, tracer, lastCos, cool } = s;
      const S = Math.min(P.w, P.h);
      const k = Math.pow(1 - e * e, 1.5);
      const cr = Math.cos(s.rot), sr = Math.sin(s.rot);
      for (let b = 0; b < BANDS; b++) cool[b] = Math.max(0, cool[b] - dt);
      for (let i = 0; i < n; i++) {
        const c = Math.cos(th[i]);
        const w0 = 0.55 * Math.pow(a[i] / (S * 0.3), -1.5);
        const rate = w0 * (1 + e * c) * (1 + e * c) / k;
        th[i] += rate * dt;
        const r = a[i] * (1 - e * e) / (1 + e * Math.cos(th[i]));
        const ang = th[i] + om[i];
        const x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.82;
        px[i] = s.cx + x * cr - y * sr; py[i] = s.cy + x * sr + y * cr;
        // the hang: slow = far end = glow (only means anything once orbits are stretched)
        hang[i] = clamp((1 - rate / w0) * 1.4) * e;
        // tracers: a periapsis pass is cos θ crossing +1 from below (θ wraps) — detect via cos rising past 0.985
        if (tracer[band[i]] === i) {
          const cc = Math.cos(th[i]);
          if (cc > 0.985 && lastCos[band[i]] <= 0.985 && cool[band[i]] <= 0 && s.pres > 0.3) {
            s.events.push({ kind: 'peri', b: band[i], vel: clamp(0.15 + e * 1.2), pan: (px[i] / P.w) * 2 - 1 });
            cool[band[i]] = 0.9;
          }
          lastCos[band[i]] = cc;
        }
      }
      // each band's mean angular rate → its tremolo rate (Hz-ish, scaled to breathe)
      for (let b = 0; b < BANDS; b++) s.rate[b] = 0.55 * Math.pow((0.06 + (b + 0.5) / BANDS * 0.4) / 0.3, -1.5) / TAU;
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = `rgba(0,0,0,${0.7 - s.light * 0.4})`;
      g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const L = s.light;
      const { n, px, py, br, band, hang } = s;
      g.globalCompositeOperation = 'lighter';
      const cut = 1 - (0.15 + L * 0.85);
      const spr = BAND.map((c, i) => sprite('b' + i, c)), white = sprite('w', '255,250,240');
      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        const hg = hang[i];
        g.globalAlpha = br[i] * (0.12 + L * 0.4) * (1 + hg * 0.5) * bright;
        const r = (1.2 + br[i] * 1.8) * ms * (0.8 + L * 0.4) * (1 + hg * 0.5);
        g.drawImage(hg > 0.75 ? white : spr[band[i]], px[i] - r, py[i] - r, r * 2, r * 2);
      }
      g.globalAlpha = 1;
      // the centre: the unseen mass, and a hair-thin periapsis ring that tightens as the orbits stretch
      const e = s.ecc * 0.72;
      const gr = g.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, Math.min(w, h) * 0.08);
      gr.addColorStop(0, `rgba(255,235,200,${(0.08 + L * 0.2) * bright})`); gr.addColorStop(1, 'rgba(255,235,200,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(s.cx, s.cy, Math.min(w, h) * 0.08, 0, TAU); g.fill();
      g.strokeStyle = `rgba(255,230,190,${(0.08 + e * 0.3) * L * bright})`; g.lineWidth = 1.1 * ms;
      g.beginPath(); g.arc(s.cx, s.cy, Math.min(w, h) * 0.06 * (1 - e), 0, TAU); g.stroke();
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(225,225,235,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('ECC ' + e.toFixed(2) + '   LIGHT ' + Math.round(L * 100) + (s.pres < 0.3 ? '   · CIRCLING' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.004, cutoff: 220, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.03); sub.connect(sg); sg.connect(v.group);
      const bands = [];
      for (let b = 0; b < BANDS; b++) {
        const o = v.osc('triangle', 220), o2 = v.osc('triangle', 220), f = v.filter('lowpass', 900, 0.7), gg = v.g(0.0001);
        o.connect(f); o2.connect(f); f.connect(gg);
        A.pan(gg, (b / (BANDS - 1) - 0.5) * 1.2).connect(v.group);
        if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.65; gg.connect(sd); sd.connect(A.revIn); }
        // the tremolo: an LFO into this band's gain, at its orbital rate
        const lfo = v.osc('sine', 0.3), lg = v.g(0); lfo.connect(lg); lg.connect(gg.gain);
        bands.push({ o, o2, f, gg, lfo, lg, ph: b / BANDS });
      }
      const tune = gl => {
        A.set(sub.frequency, H.chordTone(0, -2), gl);
        bands.forEach((bd, b) => { const f = H.chordTone(b, b < 2 ? -1 : 0); A.set(bd.o.frequency, f, gl); A.set(bd.o2.frequency, f, gl); });
      };
      tune(0.05);
      const strike = () => { const now = A.t(); for (let i = 0; i < 4; i++) A.tone(H.chordTone(i, -1), { at: now + 0.08 * i, vol: 0.0001, dur: 3.5, attack: 0.5, type: 'sine', rev: 0, role: 'pad' }); };
      H.onChord(() => { place(0.2); tune(0.15); strike(); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7, L = s.light, E = s.ecc;
          bands.forEach((bd, b) => {
            const base = (0.002 + L * 0.007) * (1 - b * 0.08) * gate;
            A.set(bd.gg.gain, base, 0.3);
            A.set(bd.lg.gain, base * (0.35 + E * 0.6), 0.3);                    // tremolo depth grows with the stretch
            A.set(bd.lfo.frequency, s.rate[b] * (1 - E * 0.55), 0.5);           // and slows as the orbits lengthen
            A.set(bd.f.frequency, 300 + L * 1400 - E * 600 + b * 120, 0.3);
            try { bd.o2.detune.setTargetAtTime((b % 2 ? 1 : -1) * (3 + E * 22), now, 0.4); } catch (e) {}
          });
          pad.forEach(p => { p.level(0.003 * gate, 0.4); p.bright(180 + L * 500 - E * 100, 0.3); });
          A.set(sg.gain, (0.025 + L * 0.01) * gate, 0.2);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'peri') A.pluck2(H.chordTone(e.b, e.b < 2 ? 0 : 1), { vol: (0.01 + e.vel * 0.05) * L * gate, dur: 1.2, rev: 0.6, del: 0.25, pan: e.pan * 0.7 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', L); MOut.expr('pad', E); MOut.expr('lead', E * L); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
