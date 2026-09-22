/* ---------- SRC-52 · SAND MANDALA (made to be swept away) ----------
   TEMPLE SET · the making. Two thousand grains, each with a home on an
   eight-fold mandala — rings of petals and dot-strings, like LED points
   strung along curves in smoke. The LEFT hand is devotion: it settles the
   grains into the pattern, ring by ring from the centre out, and each ring
   that locks rings a rung of the chord. The RIGHT hand is the sweep: the
   monks' dissolution, sand drawn spiralling into the centre and scattered.
   The Temple burns; a mandala is made to be unmade. */
(() => {
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.3, `rgba(${rgb},0.6)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return (SPR[key] = c);
  }
  // ring palette: hue comes from the FORM (which ring) — gold heart, saffron,
  // rose, then the cool outer rings; pearl rather than neon
  const RING = ['255,230,170', '255,200,120', '255,160,130', '230,150,200', '170,160,255', '140,190,255', '190,220,255'];
  const FOLD = 8, RINGS = 7;

  reg({
    id: 'SRC-52', family: 'SRC-52', ver: 1, title: 'Sand Mandala', tech: 'HOMED GRAINS / 8-FOLD LATTICE',
    music: {
      bpm: 66, root: 45, mode: 'aeolian', chordBars: 2,
      chords: [
        [0, 7, 14, 19, 24],    // Am(add9)
        [0, 8, 15, 19, 26],    // Fmaj7#11/A
        [0, 5, 12, 17, 21],    // Dm9/A
        [0, 7, 10, 17, 22]     // Am11
      ],
      chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am11']
    },
    fx: { bloom: 0.5 },
    tags: ['TEMPLE SET', 'L SETTLES, R SWEEPS', 'RINGS LOCK ON THE BAR', 'MADE TO BE UNMADE'],
    desc: 'Two thousand grains of coloured sand, each with a place on an eight-fold mandala: rings of petals and strings of dots, gold at the heart and cooling toward the rim. Left alone they hang in a slow suspension, the pattern half-guessed. Devotion settles them: ring by ring, from the centre outward, the mandala comes into focus, and when the last ring locks its outline is drawn once in thin light. Then the sweep. Sand is drawn spiralling into the centre and cast out, ring after ring letting go, until the field is dust again and can be made again. The point is not the finished mandala; it is the making and the unmaking.',
    interact: 'L = DEVOTION. Lean in and the grains are pulled to their homes; the deeper you go the more rings settle, centre first. A ring that is fully settled LOCKS on the next bar line and sounds its rung of the chord — the heart is low, the rim is high — so building the mandala is climbing the ladder. All seven locked = the mandala complete: its outline traces itself and the chord blooms. R = THE SWEEP. Reach and a spiral wind gathers sand toward the centre and scatters it; rings unlock from the rim inward, each one a falling note. Both hands together fight — devotion against dissolution — and the mandala breathes between them. Hold R off to keep what you have built.',
    sound: 'An A pedal, browser-side, whisper-level. Settling is a sound of sand: a filtered noise bed whose brightness follows how much of the field is in place (MIDI role: texture, CC74 = settled fraction). Each ring locking is one bell at that ring\'s ladder rung (MIDI role: bells), velocity from how cleanly it locked; the complete mandala rolls the whole chord on the pad channel, low-to-high, once. The sweep is the same sand bed rushing (level rides the wind) and each ring unlocking is a soft descending pluck (MIDI role: lead). No grid figures, no drums: the only quantised events are the locks, on bar lines.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h, S = Math.min(w, h);
      const cx = w / 2, cy = h / 2, Rmax = S * 0.38;
      const grains = [];
      // homes: ring k lives at radius r_k, its shape a petal curve of FOLD lobes
      const perRing = [56, 96, 136, 176, 216, 256, 296];
      for (let k = 0; k < RINGS; k++) {
        const r0 = Rmax * (0.1 + 0.9 * k / (RINGS - 1));
        const n = Math.min(perRing[k], Math.round(perRing[k] * as / 2.2));
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU;
          // petals on odd rings, dot-strings (rings with beads) on even rings
          const lobe = k % 2 ? Math.abs(Math.cos(a * FOLD / 2)) : 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(a * FOLD)), 0.35);
          const r = r0 + (k % 2 ? lobe * Rmax * 0.09 : (lobe - 0.7) * Rmax * 0.035);
          grains.push({
            hx: cx + Math.cos(a) * r, hy: cy + Math.sin(a) * r, k,
            x: cx + (P.rand() - 0.5) * w * 0.9, y: cy + (P.rand() - 0.5) * h * 0.9,
            vx: 0, vy: 0, ph: P.rand() * TAU, home: 0
          });
        }
      }
      P.state = {
        grains, cx, cy, Rmax, pres: 0, dev: 0, sweep: 0, settled: new Float32Array(RINGS),
        locked: new Array(RINGS).fill(false), lastBar: -1, complete: 0, outline: 0,
        drift: 0, events: [], unit: S * 0.008, sandLvl: 0
      };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      // idle: a half-made mandala, breathing — the tease
      const idleDev = 0.42 + Math.sin(s.drift * 0.17) * 0.12;
      const dev = clamp(inp.L) * s.pres + idleDev * (1 - s.pres);
      s.dev += (dev - s.dev) * Math.min(1, dt * 6);
      s.sweep += (clamp(inp.R) * s.pres - s.sweep) * Math.min(1, dt * 6);
      const D = s.dev, W = s.sweep;

      // ring by ring: devotion reaches ring k once D passes its threshold
      const reach = k => clamp((D - k / RINGS) * RINGS * 1.3);
      const cnt = new Float32Array(RINGS), tot = new Float32Array(RINGS);
      let moving = 0;
      for (const p of s.grains) {
        const pull = reach(p.k) * (1 - W * 0.9);
        let fx = (p.hx - p.x) * pull * 6, fy = (p.hy - p.y) * pull * 6;
        // suspension: a faint shimmer around the home when unpulled
        p.ph += dt * 0.7;
        fx += Math.sin(p.ph * 1.3 + p.hy * 0.01) * 14 * (1 - pull);
        fy += Math.cos(p.ph * 1.1 + p.hx * 0.01) * 14 * (1 - pull);
        // the sweep: a spiral into the centre; a grain that reaches the heart
        // is CAST — thrown back out in one burst and left alone until it lands
        p.cast = Math.max(0, (p.cast || 0) - dt);
        if (W > 0.01 && p.cast <= 0) {
          const dx = p.x - s.cx, dy = p.y - s.cy, dd = Math.hypot(dx, dy) + 1;
          fx += (-dx / dd * 90 - dy / dd * 260) * W;
          fy += (-dy / dd * 90 + dx / dd * 260) * W;
          if (dd < s.Rmax * 0.08 && W > 0.25) {
            const a = P.rand() * TAU, sp = 500 + P.rand() * 500;
            p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.cast = 1.2 + P.rand() * 0.8;
          }
        }
        const visc = p.cast > 0 ? 0.8 : 2.4 + pull * 5;
        p.vx += (fx - p.vx) * Math.min(1, dt * visc);
        p.vy += (fy - p.vy) * Math.min(1, dt * visc);
        p.x += p.vx * dt; p.y += p.vy * dt;
        const d = Math.hypot(p.x - p.hx, p.y - p.hy);
        p.home = clamp(1 - d / (s.unit * 3));
        tot[p.k]++; if (p.home > 0.6) cnt[p.k]++;
        moving += Math.min(1, Math.hypot(p.vx, p.vy) / 120);
      }
      for (let k = 0; k < RINGS; k++) s.settled[k] += (cnt[k] / tot[k] - s.settled[k]) * Math.min(1, dt * 4);
      s.sandLvl += (moving / s.grains.length - s.sandLvl) * Math.min(1, dt * 4);

      // locks commit on the bar line; unlocks are immediate (the sweep is not polite)
      const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : -1;
      const newBar = bar !== s.lastBar; s.lastBar = bar;
      let all = true;
      for (let k = 0; k < RINGS; k++) {
        if (!s.locked[k] && s.settled[k] > 0.85 && newBar && bar >= 0) {
          s.locked[k] = true; s.events.push({ kind: 'lock', k, q: s.settled[k] });
        } else if (s.locked[k] && s.settled[k] < 0.5) {
          s.locked[k] = false; s.events.push({ kind: 'unlock', k });
          if (s.complete) { s.complete = 0; }
        }
        if (!s.locked[k]) all = false;
      }
      if (all && !s.complete) { s.complete = 1; s.outline = 1; s.events.push({ kind: 'complete' }); }
      s.outline = Math.max(0, s.outline - dt * 0.06);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      g.globalCompositeOperation = 'lighter';
      // the grains — a dot each, glowing harder the closer to home; the sweep tints violet
      const sw = sprite('sweep', '180,140,255');
      for (const p of s.grains) {
        const spr = sprite('r' + p.k, RING[p.k]);
        const sz = s.unit * (0.8 + p.home * 0.5) * (s.locked[p.k] ? 1.2 : 1);
        g.globalAlpha = (0.16 + p.home * 0.34) * bright;
        g.drawImage(spr, p.x - sz, p.y - sz, sz * 2, sz * 2);
        if (s.sweep > 0.05) {
          g.globalAlpha = s.sweep * 0.35 * bright;
          g.drawImage(sw, p.x - sz * 1.6, p.y - sz * 1.6, sz * 3.2, sz * 3.2);
        }
      }
      g.globalAlpha = 1;
      // locked rings get a hair-thin circle; the complete mandala draws its petals once
      for (let k = 0; k < RINGS; k++) {
        if (!s.locked[k] && s.outline <= 0) continue;
        const r0 = s.Rmax * (0.1 + 0.9 * k / (RINGS - 1));
        g.strokeStyle = `rgba(${RING[k]},${(s.locked[k] ? 0.22 : 0) * bright + s.outline * 0.5 * bright})`;
        g.lineWidth = 1.1 * ms;
        g.beginPath();
        const N = 240;
        for (let i = 0; i <= N; i++) {
          const a = i / N * TAU;
          const lobe = k % 2 ? Math.abs(Math.cos(a * FOLD / 2)) : 0.35 + 0.65 * Math.pow(Math.abs(Math.sin(a * FOLD)), 0.35);
          const r = r0 + (k % 2 ? lobe * s.Rmax * 0.09 : (lobe - 0.7) * s.Rmax * 0.035);
          const x = s.cx + Math.cos(a) * r, y = s.cy + Math.sin(a) * r;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.stroke();
      }
      // the heart: a warm point that grows with devotion
      const hs = sprite('heart', '255,240,200');
      const hr = s.unit * (4 + s.dev * 6) * (1 - s.sweep * 0.5);
      g.globalAlpha = (0.4 + s.dev * 0.5) * bright;
      g.drawImage(hs, s.cx - hr, s.cy - hr, hr * 2, hr * 2);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';

      g.fillStyle = 'rgba(230,220,200,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      const locks = s.locked.map(l => l ? '●' : '○').join('');
      g.fillText('DEVOTION ' + Math.round(s.dev * 100) + '   SWEEP ' + Math.round(s.sweep * 100) + '   RINGS ' + locks +
        (s.complete ? '   · COMPLETE' : '') + (s.pres < 0.3 ? '   · SUSPENDED' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.007, cutoff: 240, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05); H.onChord(() => place(0.18));
      // sand: a noise bed whose colour is how settled the field is
      const n = v.noise(), nf = v.filter('bandpass', 1400, 1.2), ng = v.g(0.0001);
      n.connect(nf); nf.connect(ng); ng.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.35; ng.connect(sd); sd.connect(A.revIn); }
      v.fadeIn(1, 1.2);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7;
          const settled = Array.from(s.settled).reduce((a, b) => a + b, 0) / RINGS;
          A.set(ng.gain, (0.003 + s.sandLvl * 0.03 + s.sweep * 0.02) * gate, 0.2);
          A.set(nf.frequency, 900 + settled * 2600 + s.sweep * 1500, 0.2);
          pad.forEach(p => p.level(0.006 + settled * 0.005, 0.5));
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'lock') {
              A.bell(H.chordTone(e.k, e.k > 3 ? 1 : 0), { vol: (0.03 + clamp((e.q - 0.85) / 0.15) * 0.04) * gate, dur: 3, rev: 0.7, pan: 0 });
            } else if (e.kind === 'unlock') {
              A.pluck2(H.chordTone(e.k, e.k > 3 ? 0 : -1), { vol: 0.03 * gate, dur: 1.4, rev: 0.5, del: 0.25, pan: (P.rand() - 0.5) * 0.8 });
            } else if (e.kind === 'complete') {
              for (let i = 0; i < 5; i++) {
                A.tone(H.chordTone(i, -1), { at: now + 0.09 * i, vol: 0.014 * gate, dur: 4, attack: 0.3, type: 'triangle', rev: 0.85, role: 'pad', pan: (i - 2) * 0.25 });
              }
              A.bassNote(H.chordTone(0, -2), { vol: 0.08 * gate, dur: 4, rev: 0.3 });
            }
          }
          if (typeof MOut !== 'undefined' && MOut.expr) {
            MOut.expr('texture', clamp(settled));
            MOut.expr('lead', s.sweep);
          }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
