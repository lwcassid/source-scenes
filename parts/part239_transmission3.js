/* ---------- SRC-54.3 · TRANSMISSION V3 (call and answer) ----------
   V2's beacon rings with the message actually coming BACK: every pulse
   gets an ANSWER — a quieter chord stab a dotted eighth later, the way a
   dub echo answers a kick — and the kit is a pocket, not a metronome.
   Rings ripple at weight, the beacon blooms on each pulse, and the answer
   is visible: a second, softer ring born late. */
(() => {
  const modeOf = rate => rate < 0.45 ? 0 : rate < 0.78 ? 1 : 2;   // 0 free · 1 beats · 2 eighths
  // the pocket, on an 8th grid (16 = two bars): kick, rim, hats with accents
  const KICK = [1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1];
  const RIM  = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
  const HAT  = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];
  reg({
    id: 'SRC-54.3', family: 'SRC-54', ver: 3, title: 'Transmission', tech: 'BEACON RINGS / CALL AND ANSWER',
    music: {
      bpm: 84, root: 37, mode: 'dorian', chordBars: 2,
      chords: [
        [0, 7, 14, 19, 22],    // C♯m(add9)     top A♯
        [0, 7, 12, 17, 20],    // C♯m11         top G♯
        [0, 8, 15, 19, 18],    // Amaj7♯11/C♯   top F♯
        [0, 7, 10, 15, 20]     // C♯m7          top G♯
      ],
      chordNames: ['C♯m(add9)', 'C♯m11', 'Amaj7♯11/C♯', 'C♯m7']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'L IS THE RATE', 'R IS THE WEIGHT', 'EVERY PULSE IS ANSWERED'],
    desc: 'One point of light, off-centre, and from it rings — each pulse a thin bright ring that crosses every corner of the frame, and a dotted-eighth later a second, softer ring: the answer. Left alone the beacon breathes, a ring every few seconds. The left hand quickens it — breath, heartbeat, then locked to the clock, beats then eighths — and each ring is a sub you feel in the floor, each answer a quiet chord stab in the dark behind it. The right hand gives it weight: the rings thicken and ripple, the answers get louder, and past halfway a real pocket comes in under it all — kick, rim on three, hats — and stays.',
    interact: 'L = RATE. Drawn back, a ring every four seconds, breathing. Lean in and it quickens, and past the middle it LOCKS to the transport — a ring per beat, then per half-beat at full reach. R = WEIGHT. Drawn back the rings are hair-thin, the pulse a soft sub, the answers a whisper; lean in and the rings fatten and ripple, the answers become chord stabs, and past 55% the kit comes in with a pocket (kick on one and the and-of-three, rim on three, hats between) and latches for four bars. Ease R off and it thins out over a couple of bars.',
    sound: 'C♯ dorian, two-bar chords with the top voice walking A♯–G♯–F♯–G♯. The PULSE: every ring is a sub thump (MIDI role: bass, velocity from weight, downbeats heavier). The ANSWER: a dotted-eighth after every pulse, a chord stab — three ladder tones rolled in 20 ms (pad channel, real notes, not a wash), quieter than the pulse, its level and brightness from weight, tempo-synced ping-pong delay behind it so it trails off into the room. Below half L the pulse is free-running and the answer follows it by the same dotted eighth; above, both sit on the grid. The KIT (perc): kick 36 on the pattern, rim 38 on three, closed hats 42 on the eighths with off-beat accents, open 46 on the last eighth of the phrase — earned past R 0.55, latched four bars. Pad bed browser-side under everything. CC74: bass = weight, pad = rate.',

    init(P) {
      const w = P.w, h = P.h;
      P.state = { rings: [], pres: 0, rate: 0, weight: 0, free: 0, lastStep: -1, ox: w * 0.42, oy: h * 0.5, flash: 0, kit: 0, kitBars: 0, lastBar: -1, drift: 0, pulses: 0, answers: [] };
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
        s.free += dt * (0.22 + s.rate * 1.4);
        if (s.free >= 1) { s.free = 0; fire = true; }
      } else {
        const sub = md === 1 ? 1 : 0.5;
        const st = Math.floor(T.beats() / sub);
        if (st !== s.lastStep) { s.lastStep = st; fire = true; }
        s.free = 0;
      }
      const dotted = (typeof T !== 'undefined' ? T.beat : 0.7) * 0.75;
      if (fire) { s.rings.push({ r: 0, born: t, w: s.weight, ans: false }); s.flash = 1; s.pulses++; s.answers.push(t + dotted); }
      // the answer is born late, softer
      while (s.answers.length && s.answers[0] <= t) { s.answers.shift(); s.rings.push({ r: 0, born: t, w: s.weight * 0.6, ans: true }); s.flash = Math.max(s.flash, 0.5); }
      s.flash = Math.max(0, s.flash - dt * 4);
      const v = S * 0.55;
      for (const rg of s.rings) rg.r += v * dt;
      const Rmax = Math.hypot(P.w, P.h);
      s.rings = s.rings.filter(rg => rg.r < Rmax * 1.05);
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
        const u = rg.r / Rmax;
        const a = (1 - u) * (1 - u) * (0.3 + rg.w * 0.6) * bright * (rg.ans ? 0.55 : 1);
        const lw = (1.2 + rg.w * 4) * ms * (1 + u * 1.5);
        // at weight the ring RIPPLES: a gentle 9-fold wobble on the radius, drawn as a polyline
        const rip = rg.w * rg.r * 0.02;
        g.strokeStyle = rg.ans ? `rgba(255,225,190,${a})` : `rgba(235,240,255,${a})`; g.lineWidth = lw;
        g.beginPath();
        const N = 96;
        for (let i = 0; i <= N; i++) {
          const th = i / N * TAU, rr = rg.r + Math.sin(th * 9 + rg.born * 3) * rip;
          const x = s.ox + Math.cos(th) * rr, y = s.oy + Math.sin(th) * rr;
          if (i) g.lineTo(x, y); else g.moveTo(x, y);
        }
        g.stroke();
        if (rg.w > 0.2 && !rg.ans) {
          g.strokeStyle = `rgba(255,240,225,${a * 0.14 * rg.w})`; g.lineWidth = lw * 4;
          g.beginPath(); g.arc(s.ox, s.oy, rg.r, 0, TAU); g.stroke();
        }
      }
      const br = Math.min(w, h) * (0.02 + s.flash * 0.06 + W * 0.02);
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
      // the answer: three ladder tones rolled in 20 ms, on the pad channel, a dotted eighth after the pulse
      const answer = (at, W, gate) => {
        for (let i = 0; i < 3; i++) A.tone(H.chordTone(1 + i, 0), { at: at + i * 0.02, vol: (0.008 + W * 0.02) * gate, dur: 0.45 + W * 0.4, attack: 0.012, type: 'triangle', pan: (i - 1) * 0.5, rev: 0.5, del: 0.35, role: 'pad' });
      };
      const pulse = (at, W, gate, acc) => {
        A.bassNote(H.chordTone(0, -2), { at, vol: (0.05 + W * 0.09) * gate * acc, dur: 0.8 + W * 0.5 });
        answer(at + T.beat * 0.75, W, gate);
      };
      let seen = 0, nextT = T.next(0.5), lastMode = 0;
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7, W = s.weight;
          pad.forEach(p => { p.level((0.003 + W * 0.005) * gate, 0.3); p.bright(240 + W * 1200, 0.25); });
          A.set(sg.gain, 0.02 * gate, 0.2);
          const md = modeOf(s.rate);
          if (md === 0) {
            while (seen < s.pulses) { seen++; pulse(now, W, gate, 1); }
          } else {
            seen = s.pulses;
            const horizon = now + 0.15;
            while (nextT < horizon) {
              const st = Math.round((nextT - T.t0) / (T.beat * 0.5)) % 16;   // eighth index over two bars
              const onPulse = md === 2 || st % 2 === 0;
              if (onPulse) pulse(nextT, W, gate, st % 8 === 0 ? 1.2 : 1);
              if (s.kit) {
                if (KICK[st]) A.kick(nextT, (0.16 + W * 0.16) * (st % 8 === 0 ? 1.25 : 0.9));
                if (RIM[st]) A.hit({ at: nextT, freq: 900, q: 2.5, vol: 0.05 + W * 0.05, dur: 0.08 });
                if (HAT[st]) A.hat(nextT, { vol: (0.008 + W * 0.018) * (st % 4 === 3 ? 1.3 : 0.8), open: st === 15 });
              }
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
