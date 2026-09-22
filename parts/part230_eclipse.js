/* ---------- SRC-55 · TOTALITY (two spheres, one light) ----------
   TEMPLE SET · the climax and the release. A lit sphere — a soft spectral
   gradient, warm at the base, blue at the crown, like light through a glass
   ball — and a dark one that the RIGHT hand slides across it. As the dark
   covers the light, the sound hushes with it (the sound IS the light). At
   the moment of totality the corona appears: hundreds of hair-thin
   streamers of pearl-white light around the dark disc, which the LEFT hand
   reaches out and lets flutter. Totality is a WINDOW: it opens on a bar
   line with a low gong, and holds until the dark slides off — then the
   diamond ring, and the light comes back. */
(() => {
  reg({
    id: 'SRC-55', family: 'SRC-55', ver: 1, title: 'Totality', tech: 'TWO SOFT SPHERES / STREAMER CORONA',
    music: {
      bpm: 56, root: 41, mode: 'aeolian', chordBars: 2,
      chords: [
        [0, 7, 15, 19, 26],    // Fm9
        [0, 8, 15, 19, 22],    // D♭maj7/F
        [0, 7, 14, 17, 22],    // Fm11
        [0, 5, 12, 20, 24]     // B♭m/F → the hush
      ],
      chordNames: ['Fm9', 'D♭maj7/F', 'Fm11', 'B♭m(add♭6)/F']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'R COVERS THE LIGHT', 'TOTALITY IS A WINDOW', 'THE CORONA'],
    desc: 'Two spheres. One is lit from inside — a soft spectral sphere, ember at its base rising through gold to a cold blue crown, the way light spreads through a glass ball. The other is dark, and it moves. As the dark sphere crosses the lit one the room goes quiet with the light, the way birds stop at an eclipse. The instant the cover is complete, the corona appears: hundreds of hair-thin white streamers around the black disc, combed by a wind nobody can feel. Totality holds as long as you hold it. Let the dark slide off and the first bead of light is the diamond ring, and the day comes back.',
    interact: 'R = THE DARK. Lean in and the dark sphere slides across the lit one from the upper left; the covered fraction is exactly your hand, and the sound dims with the light. Cover it completely and, on the next bar line, TOTALITY: the gong, the corona, the pad chord. Hold it there — the window stays open until you let the dark slip back past about ninety percent, with a little grace. L = THE CORONA. Only alive in totality: reach and the streamers lengthen and comb outward in a slow solar wind, the shimmer on top rising with them; drawn back, the corona is a tight pearl halo. Outside totality L breathes the sphere\'s glow.',
    sound: 'An F minor pedal, browser-side. The lit sphere is a bright continuous voice (MIDI role: texture) whose cutoff and level ARE the uncovered light — partial phase is a slow dimming, and at total cover it is nearly silent, which is what makes the gong land. Totality opening: one sub gong (MIDI role: bass) plus the chord rolled low-to-high on the pad channel. Inside the window the corona is a high, sparse shimmer (MIDI role: bells) — rare bells whose density and register follow L, never a stream. The diamond ring at third contact is one bright bell cluster and the light voice swelling back. CC74: texture = visible light, bells = corona reach.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const R = S * 0.24;
      // the corona: streamers from the limb, each a polyline combed by a dipole-ish field
      const N = Math.min(320, Math.round(140 * areaScale(P)));
      const st = [];
      for (let i = 0; i < N; i++) {
        const a = P.rand() * TAU;
        // streamers cluster toward the equator like a real minimum corona, fewer at the poles
        const pole = Math.abs(Math.sin(a));
        st.push({ a, len: (0.5 + P.rand() * 1.4) * (1.3 - pole * 0.7), curl: (P.rand() - 0.5) * 1.6, ph: P.rand() * TAU, w: 0.6 + P.rand() * 0.8 });
      }
      P.state = { pres: 0, cover: 0, cv: 0, reach: 0, total: 0, wasTotal: false, lastBar: -1, gong: 0, diamond: 0, st, R, sx: w / 2, sy: h * 0.53, events: [], drift: 0, bellT: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleC = 0.5 + Math.sin(s.drift * 0.09) * 0.12;          // idle: a crescent, breathing
      const C = clamp(inp.R) * s.pres + idleC * (1 - s.pres);
      s.cv += (C - s.cv) * Math.min(1, dt * 6);
      s.reach += (clamp(inp.L) - s.reach) * Math.min(1, dt * 5);
      // totality: enter at full cover on a bar line, leave below 0.9 (hysteresis, and a beat of grace)
      const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : -1;
      const newBar = bar !== s.lastBar; s.lastBar = bar;
      if (!s.wasTotal && s.cv > 0.965 && newBar && bar >= 0 && s.pres > 0.4) {
        s.wasTotal = true; s.gong = 1; s.events.push({ kind: 'total' });
      } else if (s.wasTotal && s.cv < 0.9) {
        s.wasTotal = false; s.diamond = 1; s.events.push({ kind: 'diamond' });
      }
      s.total += ((s.wasTotal ? 1 : 0) - s.total) * Math.min(1, dt * (s.wasTotal ? 3 : 1.2));
      s.gong = Math.max(0, s.gong - dt * 0.5);
      s.diamond = Math.max(0, s.diamond - dt * 0.8);
      // the corona's rare bells: nature-timed, density from reach, only in totality
      if (s.wasTotal) {
        s.bellT -= dt;
        if (s.bellT <= 0) {
          s.events.push({ kind: 'shimmer', reach: s.reach });
          s.bellT = 1.2 + (1 - s.reach) * 5 + P.rand() * 2.5;
        }
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const R = s.R, sx = s.sx, sy = s.sy;
      // the dark sphere's path: from the upper-left, across, to dead centre at cover 1
      const mx = sx - (1 - s.cv) * R * 2.3, my = sy - (1 - s.cv) * R * 1.4;
      const light = 1 - s.total;                                     // the light left in the room

      // (1) the lit sphere: a soft spectral gradient, ember below, blue crown — light through glass
      g.globalCompositeOperation = 'lighter';
      const halo = g.createRadialGradient(sx, sy, R * 0.9, sx, sy, R * 1.7);
      halo.addColorStop(0, `rgba(255,200,140,${0.22 * light * bright})`); halo.addColorStop(1, 'rgba(255,200,140,0)');
      g.fillStyle = halo; g.beginPath(); g.arc(sx, sy, R * 1.7, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
      const body = g.createLinearGradient(sx, sy + R, sx, sy - R);
      body.addColorStop(0, `rgba(255,120,60,${bright})`);
      body.addColorStop(0.3, `rgba(255,205,110,${bright})`);
      body.addColorStop(0.62, `rgba(190,230,200,${bright})`);
      body.addColorStop(1, `rgba(70,120,230,${bright})`);
      g.fillStyle = body; g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();
      // limb softening: darken the edge so it reads as a sphere, not a coin
      const limb = g.createRadialGradient(sx - R * 0.15, sy + R * 0.1, R * 0.55, sx, sy, R);
      limb.addColorStop(0, 'rgba(0,0,0,0)'); limb.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = limb; g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();

      // (2) the corona — under the dark sphere in draw order but only visible where it's not; it
      // lives OUTSIDE the disc, so draw it before the dark disc and let the disc cover its roots
      if (s.total > 0.01) {
        g.globalCompositeOperation = 'lighter';
        g.lineCap = 'round';
        const reach = 0.35 + s.reach * 1.0;
        for (const q of s.st) {
          const L = R * q.len * reach * s.total;
          const segs = 10;
          g.strokeStyle = `rgba(235,240,255,${0.16 * q.w * s.total * bright})`;
          g.lineWidth = 1.1 * ms * q.w;
          g.beginPath();
          for (let i = 0; i <= segs; i++) {
            const u = i / segs;
            // the comb: streamers bend with the wind, flutter with time
            const ang = q.a + q.curl * u * u * (0.5 + s.reach * 0.6) + Math.sin(t * 0.5 + q.ph + u * 3) * 0.06 * u;
            const rr = R * 1.02 + L * u;
            const x = mx + Math.cos(ang) * rr, y = my + Math.sin(ang) * rr;
            if (i) g.lineTo(x, y); else g.moveTo(x, y);
          }
          g.stroke();
        }
        // the inner corona: a pearl glow hugging the limb
        const ic = g.createRadialGradient(mx, my, R, mx, my, R * (1.35 + s.reach * 0.3));
        ic.addColorStop(0, `rgba(240,240,255,${0.55 * s.total * bright})`); ic.addColorStop(1, 'rgba(240,240,255,0)');
        g.fillStyle = ic; g.beginPath(); g.arc(mx, my, R * (1.35 + s.reach * 0.3), 0, TAU); g.fill();
        // a few prominences: pink arcs at the limb
        for (let i = 0; i < 3; i++) {
          const a0 = 0.9 + i * 2.1 + Math.sin(t * 0.13 + i) * 0.2;
          g.strokeStyle = `rgba(255,150,190,${0.5 * s.total * bright})`; g.lineWidth = 2.2 * ms;
          g.beginPath(); g.arc(mx, my, R * 1.03, a0, a0 + 0.22 + Math.sin(t * 0.7 + i) * 0.05); g.stroke();
        }
        g.globalCompositeOperation = 'source-over';
      }

      // (3) the dark sphere: deep blue, shaded — a body, not a hole (the reference's dark twin)
      const dark = g.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.2, mx, my, R);
      dark.addColorStop(0, 'rgb(28,44,70)'); dark.addColorStop(0.7, 'rgb(10,16,30)'); dark.addColorStop(1, 'rgb(2,3,6)');
      g.fillStyle = dark; g.beginPath(); g.arc(mx, my, R, 0, TAU); g.fill();
      // the contact rim: a hair-thin bright line where the two limbs meet, warm side up
      const dd = Math.hypot(mx - sx, my - sy);
      if (dd < R * 2 && dd > 1) {
        const ang = Math.atan2(sy - my, sx - mx);
        const half = Math.acos(clamp(dd / (2 * R), -1, 1));
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = `rgba(255,230,200,${0.75 * light * bright + 0.2 * s.total * bright})`; g.lineWidth = 1.5 * ms;
        g.beginPath(); g.arc(mx, my, R * 1.005, ang - half, ang + half); g.stroke();
        g.globalCompositeOperation = 'source-over';
      }
      // (4) the diamond ring: one bead of light at third contact, bounded, brief
      if (s.diamond > 0) {
        const ang = Math.atan2(sy - my, sx - mx) + Math.PI;
        const bx = mx - Math.cos(ang) * R, by = my - Math.sin(ang) * R;
        g.globalCompositeOperation = 'lighter';
        const dr = R * 0.5 * s.diamond;
        const dg = g.createRadialGradient(bx, by, 0, bx, by, dr);
        dg.addColorStop(0, `rgba(255,255,255,${0.95 * s.diamond * bright})`); dg.addColorStop(0.2, `rgba(255,240,220,${0.5 * s.diamond * bright})`); dg.addColorStop(1, 'rgba(255,240,220,0)');
        g.fillStyle = dg; g.beginPath(); g.arc(bx, by, dr, 0, TAU); g.fill();
        g.globalCompositeOperation = 'source-over';
      }
      // gong flush: a pearl breath out from the dark disc, once
      if (s.gong > 0) {
        g.globalCompositeOperation = 'lighter';
        const gr2 = R * (1.2 + (1 - s.gong) * 1.6);
        g.strokeStyle = `rgba(230,235,255,${s.gong * 0.4 * bright})`; g.lineWidth = 1.4 * ms;
        g.beginPath(); g.arc(mx, my, gr2, 0, TAU); g.stroke();
        g.globalCompositeOperation = 'source-over';
      }

      g.fillStyle = 'rgba(230,225,220,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('COVER ' + Math.round(s.cv * 100) + '%   CORONA ' + Math.round(s.reach * 100) + (s.wasTotal ? '   · TOTALITY' : s.cv > 0.9 ? '   · second contact' : '') +
        (s.pres < 0.3 ? '   · PARTIAL, UNWATCHED' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.006, cutoff: 220, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      // the light: a bright held voice that dims with the cover
      const o = v.osc('triangle', 220), o2 = v.osc('sawtooth', 220), o3 = v.osc('sine', 110);
      const f = v.filter('lowpass', 1200, 0.9), gg = v.g(0.0001);
      o.connect(f); o2.connect(f); o3.connect(f); f.connect(gg); gg.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.6; gg.connect(sd); sd.connect(A.revIn); }
      const tune = glide => { const r = H.chordTone(0, 0); A.set(o.frequency, r, glide); A.set(o2.frequency, H.chordTone(2, 0), glide); A.set(o3.frequency, r * 0.5, glide); };
      tune(0.05);
      H.onChord(() => { place(0.18); tune(0.12); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7;
          const light = (1 - s.cv * 0.92) * (1 - s.total * 0.85);
          A.set(gg.gain, (0.002 + light * 0.02 + s.diamond * 0.02) * gate, 0.2);
          A.set(f.frequency, 180 + light * 2200 + s.diamond * 1500, 0.2);
          pad.forEach(p => p.level(0.004 + s.total * 0.006, 0.6));
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'total') {
              A.bassNote(H.chordTone(0, -2), { vol: 0.14 * gate, dur: 6, rev: 0.4 });
              for (let i = 0; i < 5; i++) A.tone(H.chordTone(i, -1), { at: now + 0.1 * i, vol: 0.013 * gate, dur: 6, attack: 0.5, type: 'triangle', rev: 0.9, role: 'pad', pan: (i - 2) * 0.25 });
            } else if (e.kind === 'diamond') {
              for (let i = 0; i < 3; i++) A.bell(H.chordTone(4 + i, 1), { at: now + 0.05 * i, vol: 0.04 * gate, dur: 3, rev: 0.8, pan: (i - 1) * 0.4 });
            } else if (e.kind === 'shimmer') {
              A.bell(H.chordTone(3 + Math.floor(e.reach * 4), 2), { vol: (0.012 + e.reach * 0.02) * gate, dur: 2.5, rev: 0.9, pan: (P.rand() - 0.5) * 1.2 });
            }
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', clamp(light)); MOut.expr('bells', s.reach * s.total); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
