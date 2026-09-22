/* ---------- SRC-54.2 · TRANSMISSION (the message home) ----------
   TEMPLE SET V2. The satellite transmits back: "today, at this hour, the
   name you sent ascended". Rings of light expanding from one point, each
   pulse crossing the whole frame. The LEFT hand is the RATE — a breath, a
   heartbeat, then locked to the transport so a drummer can sit on it; the
   RIGHT hand is WEIGHT, and weight brings the kit. The one Temple scene
   whose job is a pulse. */
(() => {
  // one grammar for both clocks: which subdivision the rate hand asks for
  const modeOf = rate => rate < 0.45 ? 0 : rate < 0.78 ? 1 : 2;   // 0 free · 1 beats · 2 eighths
  reg({
    id: 'SRC-54.2', family: 'SRC-54', ver: 2, title: 'Transmission', tech: 'BEACON RINGS / PULSE LOCKED TO THE CLOCK',
    music: {
      bpm: 84, root: 37, mode: 'dorian', chordBars: 2,
      chords: [
        [0, 7, 14, 19, 22],    // C#m(add9)
        [0, 7, 12, 17, 22],    // C#m11
        [0, 8, 15, 19, 26],    // Amaj7#11/C#
        [0, 7, 10, 15, 22]     // C#m7
      ],
      chordNames: ['C♯m(add9)', 'C♯m11', 'Amaj7♯11/C♯', 'C♯m7']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'L IS THE RATE', 'R IS THE WEIGHT', 'THE DRUMMER\'S SCENE'],
    desc: 'One point of light, off-centre, and from it rings — each pulse a thin bright ring that expands until it has crossed every corner of the frame, fattening and fading as it goes. Left alone the beacon breathes: a ring every few seconds, a slow tide of light. The left hand quickens it, from a breath to a heartbeat to a pulse locked to the clock — beats, then eighths — and each ring is one hit of a sub you feel in the floor. The right hand gives it weight: the rings thicken and brighten, and past halfway the kit comes in on the pulse and stays. It is the one scene in the set with a beat, and the beat is the picture.',
    interact: 'L = RATE. Drawn back, a ring every four seconds or so, breathing. Lean in and the pulse quickens, and past the middle it LOCKS to the transport — one ring per beat, then per half-beat at full reach — so a drummer can lean on it. R = WEIGHT. Drawn back the rings are hair-thin and the pulse is a soft sub; lean in and the rings fatten and blaze, the sub gets a kick under it, and hats fill the eighths between. Ease R off and the kit thins out in a couple of bars rather than cutting. Both home: the beacon breathes alone.',
    sound: 'A C♯ dorian pedal — three triangle pad voices browser-side, sub root — under a PULSE. Every ring is one sub thump (MIDI role: bass, velocity from R). Below half L the pulse is free-running (nature time); above it the pulses are scheduled on the grid (beats, then eighths at full reach) so the picture and a live drummer share one clock. Past R 0.55 the kit is earned: kick on every pulse (perc 36), closed hats on the eighths between (42), open hat on the last eighth of the bar; it latches for four bars once opened so a hand dropped to play does not drop the drums. The pad filter opens with R. CC74: bass = weight, pad = rate.',

    init(P) {
      const w = P.w, h = P.h;
      P.state = { rings: [], pres: 0, rate: 0, weight: 0, free: 0, lastStep: -1, ox: w * 0.42, oy: h * 0.5, flash: 0, kit: 0, kitBars: 0, lastBar: -1, drift: 0, pulses: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state, S = Math.min(P.w, P.h);
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleR = 0.12 + Math.sin(s.drift * 0.05) * 0.08, idleW = 0.15;
      s.rate += ((clamp(inp.L) * s.pres + idleR * (1 - s.pres)) - s.rate) * Math.min(1, dt * 5);
      s.weight += ((clamp(inp.R) * s.pres + idleW * (1 - s.pres)) - s.weight) * Math.min(1, dt * 5);
      const md = modeOf(s.rate);
      let fire = false;
      if (md === 0 || typeof T === 'undefined' || !T.running) {
        s.free += dt * (0.22 + s.rate * 1.4);                        // breath → heartbeat
        if (s.free >= 1) { s.free = 0; fire = true; }
      } else {
        const sub = md === 1 ? 1 : 0.5;
        const st = Math.floor(T.beats() / sub);
        if (st !== s.lastStep) { s.lastStep = st; fire = true; }
        s.free = 0;
      }
      if (fire) { s.rings.push({ r: 0, born: t, w: s.weight }); s.flash = 1; s.pulses++; }
      s.flash = Math.max(0, s.flash - dt * 4);
      const v = S * 0.55;
      for (const rg of s.rings) rg.r += v * dt;
      const Rmax = Math.hypot(P.w, P.h);
      s.rings = s.rings.filter(rg => rg.r < Rmax * 1.05);
      // the kit: earned by weight, latched in bars
      const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : -1;
      if (bar !== s.lastBar && bar >= 0) {
        s.lastBar = bar;
        const heavy = s.weight > 0.55 && s.pres > 0.5;
        if (heavy) { s.kit = 1; s.kitBars = 4; }
        else if (s.kit && --s.kitBars <= 0) s.kit = 0;
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const W = s.weight, Rmax = Math.hypot(w, h);
      g.globalCompositeOperation = 'lighter';
      for (const rg of s.rings) {
        const u = rg.r / Rmax;                                         // 0 born .. 1 gone
        const a = (1 - u) * (1 - u) * (0.3 + rg.w * 0.6) * bright;
        const lw = (1.2 + rg.w * 4) * ms * (1 + u * 1.5);
        // the ring is a thin bright core with a wide soft skirt: one stroke, one fill
        g.strokeStyle = `rgba(235,240,255,${a})`; g.lineWidth = lw;
        g.beginPath(); g.arc(s.ox, s.oy, rg.r, 0, TAU); g.stroke();
        if (rg.w > 0.2) {
          g.strokeStyle = `rgba(255,240,225,${a * 0.14 * rg.w})`; g.lineWidth = lw * 4;
          g.beginPath(); g.arc(s.ox, s.oy, rg.r, 0, TAU); g.stroke();
        }
      }
      // the beacon: a point that flashes on every pulse
      const br = Math.min(w, h) * (0.02 + s.flash * 0.05 + W * 0.02);
      const gr = g.createRadialGradient(s.ox, s.oy, 0, s.ox, s.oy, br * 3);
      gr.addColorStop(0, `rgba(255,255,255,${(0.6 + s.flash * 0.4) * bright})`);
      gr.addColorStop(0.3, `rgba(255,220,180,${(0.25 + s.flash * 0.4) * bright})`);
      gr.addColorStop(1, 'rgba(255,220,180,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(s.ox, s.oy, br * 3, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over';
      const md = modeOf(s.rate);
      g.fillStyle = 'rgba(225,225,235,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('RATE ' + Math.round(s.rate * 100) + (md === 0 ? ' · free' : md === 1 ? ' · BEATS' : ' · EIGHTHS') + '   WEIGHT ' + Math.round(W * 100) + (s.kit ? '   · KIT ' + s.kitBars : '') + '   PULSES ' + s.pulses + (s.pres < 0.3 ? '   · BREATHING' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.004, cutoff: 240, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl);
      tune(0.05);
      H.onChord(() => { place(0.2); tune(0.1); });
      v.fadeIn(1, 1.5);
      let seen = 0, nextT = T.next(0.5), lastMode = 0;
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7, W = s.weight;
          pad.forEach(p => { p.level((0.003 + W * 0.005) * gate, 0.3); p.bright(240 + W * 1200, 0.25); });
          A.set(sg.gain, 0.02 * gate, 0.2);
          const md = modeOf(s.rate);
          if (md === 0) {
            // free mode: the picture fires, the sound answers now
            while (seen < s.pulses) { seen++; A.bassNote(H.chordTone(0, -2), { vol: (0.05 + W * 0.09) * gate, dur: 0.9 + W * 0.6 }); if (s.kit) A.kick(now, 0.18 + W * 0.16); }
          } else {
            // locked: schedule on the grid the picture is reading
            seen = s.pulses;
            const sub = md === 1 ? T.beat : T.beat * 0.5;
            const horizon = now + 0.15;
            while (nextT < horizon) {
              const st = Math.round((nextT - T.t0) / (T.beat * 0.5)) % 8;   // eighth index in the bar
              const onPulse = md === 2 || st % 2 === 0;
              if (onPulse) {
                A.bassNote(H.chordTone(0, -2), { at: nextT, vol: (0.05 + W * 0.09) * gate * (st === 0 ? 1.2 : 1), dur: 0.7 });
                if (s.kit) A.kick(nextT, (0.18 + W * 0.16) * (st === 0 ? 1.25 : 1));
              } else if (s.kit) A.hat(nextT, { vol: 0.01 + W * 0.02, open: st === 7 });
              nextT += T.beat * 0.5;
            }
            if (nextT < now) nextT = T.next(0.5);
          }
          if (md !== lastMode) { lastMode = md; nextT = T.next(0.5); }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('bass', W); MOut.expr('pad', s.rate); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
