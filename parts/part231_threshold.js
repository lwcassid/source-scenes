/* ---------- SRC-51.2 · THRESHOLD (the gate) ----------
   TEMPLE SET V2 — the rethink after Lance's verdict on V1 ("not dynamic,
   not expressive"): no unlocks, no small objects. A FULL-FRAME curtain of
   light-strands, closed, that PARTS under the right hand to reveal the
   field behind it; the filter is the door, so the crescendo is built in.
   Orbital Temple's question — who decides what opens or closes heaven's
   gateways — as one gesture: you open it. */
(() => {
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.3, `rgba(${rgb},0.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (SPR[key] = c);
  }
  const mix = (a, b, u) => a + (b - a) * u;
  // temperature ramp for the field behind: ember → gold → white-blue
  const TEMP = [[255, 110, 40], [255, 205, 120], [150, 190, 255]];
  const tempRGB = tp => {
    const u = clamp(tp) * 2, i = Math.min(1, Math.floor(u)), f = u - i;
    const a = TEMP[i], b = TEMP[Math.min(2, i + 1)];
    return [mix(a[0], b[0], f) | 0, mix(a[1], b[1], f) | 0, mix(a[2], b[2], f) | 0];
  };

  reg({
    id: 'SRC-51.2', family: 'SRC-51', ver: 2, title: 'Threshold', tech: 'CURTAIN OF STRANDS / THE FILTER IS THE DOOR',
    music: {
      bpm: 60, root: 50, mode: 'dorian', chordBars: 4,
      chords: [
        [0, 7, 14, 17, 24],    // Dm11
        [0, 7, 15, 21, 26],    // Dm13
        [0, 8, 15, 19, 24],    // B♭maj7/D
        [0, 5, 12, 19, 22]     // Dsus/m7
      ],
      chordNames: ['Dm11', 'Dm13', 'B♭maj7/D', 'Dm7sus']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'R OPENS THE GATE', 'L IS THE LIGHT\'S TEMPERATURE', 'THE FILTER IS THE DOOR'],
    desc: 'A wall of light, closed: a hundred hanging strands filling the frame edge to edge, swaying, dark between them, and a rumour of something bright behind. The right hand parts them. The strands slide apart from the centre, thinning as they go, and the field behind comes through — a radiant ground with motes drifting up through it — until at full reach the curtain is gone and the frame is all light. The sound is the same door: closed is a sub hum you feel more than hear; open is the whole pad choir with the filter thrown wide. Nothing to unlock, nothing to wait for. You are the gate.',
    interact: 'R = OPEN. Lean in and the curtain parts from the centre — continuously, instantly, exactly as far as your hand — and the light behind floods in with it; drift back and it closes. The crescendo is this hand: the pad\'s level and filter ride the opening. L = TEMPERATURE. The light behind the gate runs ember → gold → white-blue as you lean in, and the motes rise faster with it; in the sound it is the pad\'s brightness and resonance and where the shimmer sits. Both hands home = a closed gate breathing on its own.',
    sound: 'A D dorian pedal, four triangle pad voices browser-side (no pad wash to the rack) over a sub root on bass. R is the door: pad level 0.004→0.016 and cutoff 200→2600 Hz follow the opening continuously — closed is sub + a whisper, open is the choir. L is temperature: pad resonance and a brightness multiplier, and the register of the shimmer. Past 60% open a sparse shimmer arrives on its own clock (a bell every 2–5 s, MIDI role: bells, velocity from the opening). No grid, no drums, no events tied to beats — the opener\'s job is to set the room. CC74: pad = open, texture = temperature. A pad-channel note per chord (rolled) so the rack has the harmony.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h;
      const N = Math.min(150, Math.round(70 * Math.sqrt(as)));
      const strands = [];
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N + (P.rand() - 0.5) * 0.4 / N;
        strands.push({ u, br: 0.25 + Math.pow(P.rand(), 2.5) * 0.75, ph: P.rand() * TAU, sw: 0.7 + P.rand() * 0.6, wd: 0.7 + P.rand() * 0.8, top: P.rand() * 0.25, bot: 0.75 + P.rand() * 0.25 });
      }
      const M = Math.min(900, Math.round(280 * as));
      const motes = [];
      for (let i = 0; i < M; i++) motes.push({ x: P.rand() * w, y: P.rand() * h, s: 0.4 + P.rand() * 1.2, ph: P.rand() * TAU });
      P.state = { strands, motes, pres: 0, open: 0, temp: 0, drift: 0, bellT: 2, events: [] };
    },

    step(P, dt, t, inp) {
      const s = P.state, w = P.w, h = P.h;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      // idle: the gate breathes a crack open and shut on its own, warm
      const idleO = 0.08 + Math.max(0, Math.sin(s.drift * 0.09)) * 0.14, idleT = 0.3 + Math.sin(s.drift * 0.05) * 0.15;
      s.open += ((clamp(inp.R) * s.pres + idleO * (1 - s.pres)) - s.open) * Math.min(1, dt * 7);
      s.temp += ((clamp(inp.L) * s.pres + idleT * (1 - s.pres)) - s.temp) * Math.min(1, dt * 5);
      const rise = 12 + s.temp * 90 + s.open * 40;
      for (const m of s.motes) {
        m.y -= rise * m.s * dt;
        m.x += Math.sin(s.drift * 0.6 + m.ph) * 14 * dt;
        if (m.y < -10) { m.y = h + 10; m.x = P.rand() * w; }
      }
      // the shimmer: nature-timed, only once the gate is well open
      if (s.open > 0.6 && s.pres > 0.3) {
        s.bellT -= dt * (0.6 + s.open);
        if (s.bellT <= 0) { s.events.push({ kind: 'shimmer', open: s.open, temp: s.temp }); s.bellT = 2 + P.rand() * 3; }
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const O = s.open, [r, gg, b] = tempRGB(s.temp);
      const cx = w / 2;
      // (1) the field behind the gate — one radiant ground, brightness = the opening
      const lit = Math.pow(O, 1.2);
      g.globalCompositeOperation = 'lighter';
      const R0 = Math.max(w, h) * 0.75;
      const gr = g.createRadialGradient(cx, h * 0.45, 0, cx, h * 0.45, R0);
      gr.addColorStop(0, `rgba(${r},${gg},${b},${(0.02 + lit * 0.42) * bright})`);
      gr.addColorStop(0.45, `rgba(${r},${gg},${b},${(0.005 + lit * 0.14) * bright})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // the motes rising through it
      const mote = sprite('mote', `${Math.min(255, r + 30)},${Math.min(255, gg + 30)},${Math.min(255, b + 30)}`);
      for (const m of s.motes) {
        const sz = (2 + m.s * 3) * ms;
        g.globalAlpha = (0.02 + lit * 0.4) * m.s * bright;
        g.drawImage(mote, m.x - sz, m.y - sz, sz * 2, sz * 2);
      }
      g.globalAlpha = 1;
      // (2) the curtain: strands part from the centre, thinning as they go
      const spread = O * w * 0.62;
      for (const st of s.strands) {
        const side = st.u < 0.5 ? -1 : 1;
        const d = Math.abs(st.u - 0.5) * 2;                          // 0 centre .. 1 edge
        const push = spread * Math.pow(1 - d, 0.55) * side;
        const x = st.u * w + push + Math.sin(t * 0.5 * st.sw + st.ph) * 6 * ms;
        if (x < -20 || x > w + 20) continue;
        const shimmer = 0.75 + Math.sin(t * 1.3 * st.sw + st.ph * 2) * 0.25;
        const a = st.br * shimmer * (0.22 + O * 0.5) * (1 - O * 0.55) * bright;   // closed = dim, the door only lights as it moves
        const wd = (1.6 + st.wd * 1.6) * ms * (1 - O * 0.4);
        // a strand is a vertical gradient: nothing at the ends, bright through the middle
        const lg = g.createLinearGradient(0, 0, 0, h);
        lg.addColorStop(0, 'rgba(0,0,0,0)');
        lg.addColorStop(st.top, `rgba(235,238,255,${a * 0.9})`);
        lg.addColorStop(0.5, `rgba(255,250,240,${a})`);
        lg.addColorStop(st.bot, `rgba(235,238,255,${a * 0.9})`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = lg;
        g.fillRect(x - wd / 2, 0, wd, h);
        // light leaks on the innermost strands: the edge of the door is warm
        if (d < 0.12 && O > 0.03) {
          const lk = g.createLinearGradient(x - 40 * ms * side, 0, x, 0);
          lk.addColorStop(0, 'rgba(0,0,0,0)'); lk.addColorStop(1, `rgba(${r},${gg},${b},${O * 0.5 * (1 - d / 0.12) * bright})`);
          g.fillStyle = lk; g.fillRect(Math.min(x, x - 40 * ms * side), 0, 40 * ms, h);
        }
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(230,225,220,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('OPEN ' + Math.round(O * 100) + '%   TEMP ' + Math.round(s.temp * 100) + (s.pres < 0.3 ? '   · CLOSED, BREATHING' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 4, { type: 'triangle', gain: 0.004, cutoff: 200, q: 0.7, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.03); sub.connect(sg); sg.connect(v.group);
      const tuneSub = gl => A.set(sub.frequency, H.chordTone(0, -2), gl);
      tuneSub(0.05);
      // one placed pad note per chord for the rack (rolled), never a wash
      const strike = () => {
        const s = P.state, now = A.t();
        for (let i = 0; i < 3; i++) A.tone(H.chordTone(i, -1), { at: now + 0.07 * i, vol: 0.0001, dur: 3.5, attack: 0.5, type: 'sine', rev: 0, role: 'pad' });
      };
      H.onChord(() => { place(0.2); tuneSub(0.1); strike(); });
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state;
          const gate = 0.3 + s.pres * 0.7, O = s.open, Tm = s.temp;
          pad.forEach((p, i) => {
            p.level((0.004 + O * 0.013) * gate * (i === 3 ? Tm : 1), 0.25);     // the 4th voice is temperature's
            p.bright((200 + O * 2400) * (0.6 + Tm * 0.8), 0.2);
            try { p.f.Q.setTargetAtTime(0.7 + Tm * 3, A.t(), 0.2); } catch (e) {}
          });
          A.set(sg.gain, (0.025 + O * 0.03) * gate, 0.2);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'shimmer') A.bell(H.chordTone(2 + Math.floor(e.temp * 4), 2), { vol: (0.015 + e.open * 0.03) * gate, dur: 3, rev: 0.85, pan: (P.rand() - 0.5) * 1.2 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', O); MOut.expr('texture', Tm); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
