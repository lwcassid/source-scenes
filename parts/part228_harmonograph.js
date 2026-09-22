/* ---------- SRC-53 · HARMONOGRAPH (the interval is the figure) ----------
   TEMPLE SET · the meditation. Two pendulums draw one pen: the ratio of
   their swings IS a musical interval, and the figure it draws is what that
   interval looks like — 3:2 is a fifth and a three-lobed rosette, 2:1 an
   octave and a figure-eight. The LEFT hand tunes the ratio through detents
   on the just intervals; between them the figure precesses and the two
   voices beat. The RIGHT hand is the swing: let it fall and the pendulums
   decay, the figure spiralling into its own centre like a real harmonograph
   running down. Hair-thin white lines, faintly prismatic, on nothing. */
(() => {
  // just intervals the detents sit on: ratio, name, how many chord-ladder
  // steps the upper voice is above the root (so the pitch stays on the ladder)
  const DET = [
    { r: 1,     nm: 'unison' }, { r: 6 / 5, nm: 'minor third' }, { r: 4 / 3, nm: 'fourth' },
    { r: 3 / 2, nm: 'fifth' }, { r: 8 / 5, nm: 'minor sixth' }, { r: 2,     nm: 'octave' },
    { r: 12 / 5, nm: 'tenth' }, { r: 3,    nm: 'twelfth' }
  ];
  const LOG = DET.map(d => Math.log2(d.r)), LMAX = LOG[LOG.length - 1];

  reg({
    id: 'SRC-53', family: 'SRC-53', ver: 1, title: 'Harmonograph', tech: 'TWIN PENDULUM PEN / JUST-INTERVAL DETENTS',
    music: {
      bpm: 60, root: 40, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 12, 19, 22],    // Em (open fifths + 7)
        [0, 7, 12, 19, 24],    // E5 (pure)
        [0, 7, 10, 15, 22],    // Em7
        [0, 5, 12, 17, 24]     // Esus4
      ],
      chordNames: ['Em7(no3)', 'E5', 'Em7', 'Esus4']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'RATIO = INTERVAL', 'DETENTS ON JUST INTONATION', 'WHITE LINE ON BLACK'],
    desc: 'A single pen driven by two pendulums, one for each axis. When their swings are in a simple ratio the pen draws a closed figure — the rosettes and knots a Victorian harmonograph left on paper — and that same ratio, played as two tones, is a consonant interval: the picture and the chord are the same number. Off the ratio the figure slowly turns and the tones beat against each other; on it, both hold still and pure. Let the swing decay and the whole figure winds down into its centre and stops, the way a real pendulum does. Thin white line, a little prismatic where it crosses itself, nothing else.',
    interact: 'L = THE INTERVAL. Sweep the hand and the ratio of the two pendulums moves through unison, minor third, fourth, fifth, sixth, octave, tenth, twelfth — each one a detent that holds, so the figure snaps closed and the two voices ring pure. Between detents the figure precesses and the voices beat; the beating IS the precession. R = THE SWING. Reach and the pendulums swing wide, the figure fills the frame and the tones sing; let the hand fall and the swing decays, the line spiralling in toward the centre and the tones fading with it. Hold a detent for a full bar and the figure is engraved: a faint copy stays on the paper.',
    sound: 'Two voices and a pedal. The lower voice is the chord root (MIDI role: texture, held); the upper is root × ratio, snapped to the nearest detent so it always lands on a real interval, with the residual detune kept — so off a detent it beats exactly as fast as the figure turns. Both ride the swing for level and the filter opens with it. Engraving a figure rings a bell at the interval\'s ladder rung (MIDI role: bells) and re-strikes the pedal low (bass). The chord cycle underneath is bare — open fifths, sus — so the interval on top is never fighting a third. No grid, no drums; the only clock is the pendulum.',

    init(P) {
      const w = P.w, h = P.h;
      P.state = {
        pres: 0, ratioL: 0.5, ratio: 1.5, det: 3, detune: 0, swing: 0, sw: 0,
        phx: 0, phy: 0, phr: 0, pts: new Float32Array(2 * 3600), head: 0, len: 0,
        engr: [], holdBars: 0, lastBar: -1, lastDet: -1, events: [], cx: w / 2, cy: h / 2,
        A: Math.min(w, h) * 0.42, drift: 0, prec: 0, flash: 0
      };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      // idle: the pendulum rests on the fifth, half swung, breathing
      const idleL = 0.47 + Math.sin(s.drift * 0.11) * 0.02, idleR = 0.5 + Math.sin(s.drift * 0.23) * 0.15;
      const Lh = clamp(inp.L) * s.pres + idleL * (1 - s.pres);
      const Rh = clamp(inp.R) * s.pres + idleR * (1 - s.pres);
      s.ratioL += (Lh - s.ratioL) * Math.min(1, dt * 7);
      s.swing += (Rh - s.swing) * Math.min(1, dt * 1.2);        // a pendulum takes time to wind up and down

      // detents: magnetise the just intervals (cubic ease inside a window in hand-travel units)
      let lg = s.ratioL * LMAX, best = 0, bd = 9;
      for (let i = 0; i < LOG.length; i++) { const d = Math.abs(lg - LOG[i]); if (d < bd) { bd = d; best = i; } }
      const win = 0.09 * LMAX;
      if (bd < win) { const u = bd / win; lg = LOG[best] + (lg - LOG[best]) * u * u * u; }
      s.det = best;
      s.ratio = Math.pow(2, lg);
      s.detune = lg - LOG[best];                                 // octaves off the detent (±)
      s.flash = Math.max(0, s.flash - dt * 1.5);

      // the pen: substep so the line is smooth at any frame rate
      const fx = 0.55, fy = fx * s.ratio;                          // Hz
      const amp = s.A * (0.15 + s.swing * 0.85);
      const sub = 6, h2 = dt / sub;
      for (let i = 0; i < sub; i++) {
        s.phx += TAU * fx * h2; s.phy += TAU * fy * h2; s.phr += TAU * fx * 0.5 * h2;
        // a small rotary term — the third pendulum a real harmonograph has
        const rx = Math.sin(s.phr) * amp * 0.08, ry = Math.cos(s.phr) * amp * 0.08;
        const x = s.cx + Math.sin(s.phx + s.prec) * amp + rx;
        const y = s.cy + Math.sin(s.phy) * amp * 0.78 + ry;
        s.pts[s.head * 2] = x; s.pts[s.head * 2 + 1] = y;
        s.head = (s.head + 1) % 3600; if (s.len < 3600) s.len++;
      }
      s.prec += dt * 0.05;                                         // the whole figure turns, slowly

      // engraving: a detent held for a bar leaves a copy on the paper
      const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : -1;
      if (bar !== s.lastBar) {
        s.lastBar = bar;
        if (Math.abs(s.detune) < 0.004 && s.det === s.lastDet && s.pres > 0.4 && s.swing > 0.3) {
          if (!s.engr.some(e => e.det === s.det && e.born > t - 40)) {
            s.engr.push({ det: s.det, pts: s.pts.slice(0), len: s.len, born: t });
            if (s.engr.length > 4) s.engr.shift();
            s.events.push({ kind: 'engrave', det: s.det, swing: s.swing });
            s.flash = 1;
          }
        }
        s.lastDet = s.det;
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round'; g.lineJoin = 'round';
      // the engraved ghosts: fainter, and they fade over a minute
      for (const e of s.engr) {
        const age = clamp(1 - (t - e.born) / 75);
        if (age <= 0) continue;
        g.strokeStyle = `rgba(200,210,255,${0.13 * age * bright})`;
        g.lineWidth = 1 * ms;
        g.beginPath();
        for (let i = 0; i < e.len; i++) { const x = e.pts[i * 2], y = e.pts[i * 2 + 1]; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      }
      // the live line: drawn in three passes, offset a pixel in three tints —
      // the prismatic fringe of light through glass, only where it overlaps
      const n = s.len, start = (s.head - n + 3600) % 3600;
      const passes = [[-1.2, 0, '255,120,110', 0.35], [0, 0, '255,255,255', 0.85], [1.2, 0.6, '120,170,255', 0.35]];
      for (const [ox, oy, rgb, al] of passes) {
        g.lineWidth = (ox === 0 ? 1.4 : 1.1) * ms;
        // the tail fades: older points dimmer, drawn in 6 chunks
        const chunks = 6, per = Math.floor(n / chunks);
        for (let c = 0; c < chunks; c++) {
          const a = al * (0.12 + 0.88 * (c + 1) / chunks) * bright * (0.6 + s.swing * 0.4);
          g.strokeStyle = `rgba(${rgb},${a})`;
          g.beginPath();
          for (let i = c * per; i < Math.min(n, (c + 1) * per + 1); i++) {
            const j = (start + i) % 3600;
            const x = s.pts[j * 2] + ox * ms, y = s.pts[j * 2 + 1] + oy * ms;
            if (i === c * per) g.moveTo(x, y); else g.lineTo(x, y);
          }
          g.stroke();
        }
      }
      // the pen: one bright point
      const j = (s.head - 1 + 3600) % 3600, px = s.pts[j * 2], py = s.pts[j * 2 + 1];
      const gr = g.createRadialGradient(px, py, 0, px, py, 14 * ms);
      gr.addColorStop(0, `rgba(255,255,255,${0.9 * bright})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(px, py, 14 * ms, 0, TAU); g.fill();
      // engraving flash: a ring at the figure's radius, once
      if (s.flash > 0) {
        g.strokeStyle = `rgba(255,255,255,${s.flash * 0.35 * bright})`;
        g.lineWidth = 1.2 * ms;
        g.beginPath(); g.arc(s.cx, s.cy, s.A * (0.15 + s.swing * 0.85) * (1.05 + (1 - s.flash) * 0.15), 0, TAU); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';

      g.fillStyle = 'rgba(230,230,240,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('RATIO ' + s.ratio.toFixed(3) + ' · ' + DET[s.det].nm + (Math.abs(s.detune) < 0.004 ? ' · PURE' : ' · beating ' + Math.abs(s.detune * 1200).toFixed(0) + '¢') +
        '   SWING ' + Math.round(s.swing * 100) + '   ENGRAVED ' + s.engr.length + (s.pres < 0.3 ? '   · AT REST' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.006, cutoff: 220, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      // the two pendulum voices: root, and root x ratio
      const mk = pan => {
        const o = v.osc('triangle', 110), o2 = v.osc('sine', 110);
        const f = v.filter('lowpass', 600, 0.7), gg = v.g(0.0001);
        o.connect(f); o2.connect(f); f.connect(gg);
        A.pan(gg, pan).connect(v.group);
        if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.6; gg.connect(sd); sd.connect(A.revIn); }
        return { o, o2, f, gg };
      };
      const lo = mk(-0.3), hi = mk(0.3);
      let lastDet = -1;
      const tune = glide => {
        const s = P.state, root = H.chordTone(0, 0);
        A.set(lo.o.frequency, root, glide); A.set(lo.o2.frequency, root * 0.5, glide);
        // the upper voice lands on the detent's ratio (a real interval), keeping only the residual beat
        const up = root * DET[s.det].r * Math.pow(2, s.detune);
        A.set(hi.o.frequency, up, glide); A.set(hi.o2.frequency, up * 2, glide);
      };
      H.onChord(() => { place(0.18); tune(0.12); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state;
          const gate = 0.3 + s.pres * 0.7;
          if (s.det !== lastDet) { lastDet = s.det; tune(0.09); }
          else tune(0.05);                                       // residual detune tracks continuously
          const lvl = (0.003 + s.swing * 0.014) * gate;
          A.set(lo.gg.gain, lvl, 0.15); A.set(hi.gg.gain, lvl * 0.8, 0.15);
          const cut = 240 + s.swing * 1400;
          A.set(lo.f.frequency, cut, 0.2); A.set(hi.f.frequency, cut * 1.3, 0.2);
          pad.forEach(p => p.level(0.005 + s.swing * 0.003, 0.5));
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'engrave') {
              A.bell(H.chordTone(e.det, 1), { vol: (0.03 + e.swing * 0.04) * gate, dur: 3.5, rev: 0.8 });
              A.bassNote(H.chordTone(0, -2), { vol: 0.07 * gate, dur: 3, rev: 0.3 });
            }
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', s.swing); MOut.expr('bells', clamp(s.engr.length / 4)); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
