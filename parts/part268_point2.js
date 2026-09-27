/* ---------- SRC-56.2 · THE POINT, GOLD (flat → a body in a space) ----------
   Act 1 of Birth of a Temple 0.2 opens on this. Edson, Sep 26 (with Gabi):
   "quando eu começar a fazer assim, aparece um círculo… dourado
   provavelmente, coisa do Orbital Temple. No começo é muito simples… o foco
   tá na música." And the form of the act: "uma versão que parece totalmente
   bidimensional e que depois se mostra estar num espaço e pertencer a um
   universo."

   So: THE SAME POINT, in temple gold, and ONE MACRO — DEPTH. At zero it is a
   flat disc with a hard edge, one colour, no halo, nothing behind it: a
   light, not a picture. "Se ele for verde, ele deixa as pessoas verdes" —
   in Act 1 the wall IS the room's light. Turn DEPTH up and the disc becomes
   a body: a highlight moves off-centre, the limb darkens, the halo it throws
   appears, the corona seeds appear, and a far dust of points resolves
   behind it. It was in a space all along.

   The hands are The Point's hands: L opens the SIZE, R opens the HEAT (deep
   gold → temple gold → pale gold → white). The band moves the same edge.
   Same sound as SRC-56. Standalone, DEPTH breathes on its own so the card
   shows the reveal; hosted, the knob owns it and it holds.               */
(() => {
  // the temple gold from the site: #D4AF37 (212,175,55); pale #FFF7E6
  const GOLD = [
    [150, 100, 25],    // heat 0    deep gold, almost bronze
    [212, 175, 55],    // heat 0.4  the temple's gold
    [255, 232, 170],   // heat 0.75 pale gold
    [255, 250, 240]    // heat 1    white
  ];
  const STOPS = [0, 0.4, 0.75, 1];
  function gold(h) {
    h = clamp(h);
    let i = 0; while (i < STOPS.length - 2 && h > STOPS[i + 1]) i++;
    const f = (h - STOPS[i]) / (STOPS[i + 1] - STOPS[i]);
    const a = GOLD[i], b = GOLD[i + 1];
    return [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
  }
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  reg({
    id: 'SRC-56.2', family: 'SRC-56', ver: 2, title: 'BoT · The Point, Gold', tech: 'ONE DISC / FLAT GOLD → A BODY IN A SPACE',
    audioIn: true,
    textIsContent: true,
    music: {
      bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
      chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
      chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4']
    },
    fx: { bloom: 0.25 },
    tags: ['TEMPLE SET', 'ACT 1', 'BOTH HANDS IN = A COAL', 'OPEN L = SIZE', 'OPEN R = HEAT', 'MACRO: DEPTH', 'LISTENS TO THE BAND'],
    desc: 'The Point, in the temple\'s gold. At DEPTH zero it is a flat disc with a hard edge and one colour — a light on the wall, not a picture, and the room is lit by it. Turn DEPTH up and it becomes a body: a highlight moves off centre, the limb darkens, a halo appears, the corona seeds show, and far behind it a dust of points resolves. It was in a space the whole time. Hold both hands at the Source and it is a coal; open the left and it grows until it fills the room; open the right and it heats from deep gold through the temple\'s gold to a white that hurts.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE SIZE, R OPENS THE HEAT. DEPTH is a MACRO on a knob (in a movement) — the slow decided move from flat to a body in a space; it is not on the hands so the theremin stays free. The band moves the edge through the line-in.',
    sound: 'As The Point: F aeolian, eight-bar chords, a sub root, an open fifth pad that fills as the disc opens, one bell on each chord change. Size is filter and level; heat is brightness and detune.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const NR = 32;
      const rj = new Float32Array(NR), rl = new Float32Array(NR);
      for (let i = 0; i < NR; i++) { rj[i] = (P.rand() - 0.5) * 0.04; rl[i] = 0.6 + P.rand() * 0.8; }
      // the space behind it: a far dust, fixed, that only exists with depth
      const ND = Math.min(520, Math.round(180 * areaScale(P)));
      const dx = new Float32Array(ND), dy = new Float32Array(ND), db = new Float32Array(ND), dp = new Float32Array(ND);
      for (let i = 0; i < ND; i++) { dx[i] = P.rand() * w; dy[i] = P.rand() * h; db[i] = 0.2 + Math.pow(P.rand(), 2.5) * 0.8; dp[i] = P.rand() * TAU; }
      P.state = {
        cx: w / 2, cy: h / 2, S, NR, rj, rl, ND, dx, dy, db, dp,
        pres: 0, size: 0, heat: 0, depth: 0, drift: P.rand() * 100,
        pulse: 0, lastKick: -1, aud: 0, events: []
      };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;

      const idleS = 0.20 + Math.sin(s.drift * 0.05) * 0.09;
      const idleH = 0.24 + Math.sin(s.drift * 0.077 + 1.3) * 0.09;
      const wantS = SOURCE(inp.L) * s.pres + idleS * (1 - s.pres);
      const wantH = SOURCE(inp.R) * s.pres + idleH * (1 - s.pres);
      s.size += (wantS - s.size) * Math.min(1, dt * 7);
      s.heat += (wantH - s.heat) * Math.min(1, dt * 7);

      // DEPTH: the host's macro when hosted; a slow breath on its own
      const wantD = (P.macro && P.macro.depth !== undefined) ? P.macro.depth : (0.5 + 0.5 * Math.sin(s.drift * 0.09));
      s.depth += (clamp(wantD) - s.depth) * Math.min(1, dt * 2.0);

      const au = inp.audio || {};
      const lvl = (au.live ? 1 : 0.55) * (au.level || 0);
      s.aud += (lvl - s.aud) * Math.min(1, dt * 9);
      if (au.kick && au.kick.n !== s.lastKick) { s.lastKick = au.kick.n; s.pulse = Math.min(1, s.pulse + 0.45 * (au.kick.strength || 1)); }
      s.pulse *= Math.pow(0.02, dt);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }

      const S = Math.min(w, h), D = s.depth;
      const R = S * (0.045 + s.size * 0.40) * (1 + s.aud * 0.10 + s.pulse * 0.07);
      const heat = clamp(s.heat + s.aud * 0.18);
      const bright = (0.55 + s.pres * 0.45) * room;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const C = gold(heat), Chi = gold(heat + 0.35), Clo = gold(heat - 0.30);

      g.globalCompositeOperation = 'lighter';

      // THE SPACE: the far dust, only as deep as the knob says
      if (D > 0.01) {
        const { ND, dx, dy, db, dp } = s;
        const a = D * 0.55 * bright;
        for (let i = 0; i < ND; i++) {
          const tw = 0.6 + 0.4 * Math.sin(s.drift * 0.7 + dp[i]);
          const al = a * db[i] * tw; if (al < 0.01) continue;
          const rr = (0.6 + db[i] * 1.3) * ms;
          g.fillStyle = `rgba(255,236,200,${al})`;
          g.beginPath(); g.arc(dx[i], dy[i], rr, 0, TAU); g.fill();
        }
      }

      // THE FLAT DISC: one colour, a hard edge — a light, not a picture
      if (D < 0.995) {
        g.fillStyle = rgba(C, (0.85 + heat * 0.15) * bright * (1 - D));
        g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();
      }
      // THE BODY: the highlight moves off centre, the limb darkens
      if (D > 0.005) {
        const off = R * 0.34 * D;
        const gr = g.createRadialGradient(s.cx - off, s.cy - off, 0, s.cx, s.cy, R);
        gr.addColorStop(0, rgba(Chi, (0.85 + heat * 0.15) * bright * D));
        gr.addColorStop(0.45, rgba(C, (0.80 + heat * 0.2) * bright * D));
        gr.addColorStop(0.92, rgba(Clo, 0.45 * bright * D));
        gr.addColorStop(1, rgba(Clo, 0.10 * bright * D));
        g.fillStyle = gr;
        g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();

        // the halo it throws into the room
        const HR = R * (2.0 + heat * 1.1);
        const hg = g.createRadialGradient(s.cx, s.cy, R * 0.85, s.cx, s.cy, HR);
        hg.addColorStop(0, rgba(C, (0.14 + heat * 0.14) * bright * D));
        hg.addColorStop(1, rgba(C, 0));
        g.fillStyle = hg;
        g.beginPath(); g.arc(s.cx, s.cy, HR, 0, TAU); g.fill();

        // the seed of the corona: thirty-two strokes, barely there
        g.lineCap = 'round';
        for (let i = 0; i < s.NR; i++) {
          const a = (i / s.NR) * TAU + s.drift * 0.06 + s.rj[i];
          const len = R * (0.06 + s.rl[i] * 0.09 * (0.4 + heat));
          const c = Math.cos(a), sn = Math.sin(a);
          g.strokeStyle = rgba(Chi, (0.10 + heat * 0.18) * bright * D);
          g.lineWidth = 1.6 * ms;
          g.beginPath(); g.moveTo(s.cx + c * R * 0.99, s.cy + sn * R * 0.99);
          g.lineTo(s.cx + c * (R + len), s.cy + sn * (R + len)); g.stroke();
        }
      }

      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText('SIZE ' + Math.round(s.size * 100) + '   HEAT ' + Math.round(heat * 100) + '   DEPTH ' + Math.round(D * 100) + (s.pres < 0.3 ? '   · BREATHING' : ''), 10, h - 10);
      }
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.005, cutoff: 200, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 44), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const air = v.osc('sine', 330), ag = v.g(0.0001), af = v.filter('lowpass', 800, 0.6);
      air.connect(af); af.connect(ag); ag.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.8; ag.connect(sd); sd.connect(A.revIn); }
      const tune = gl => { A.set(sub.frequency, H.chordTone(0, -2), gl); A.set(air.frequency, H.chordTone(2, 1), gl); };
      tune(0.05);
      const bell = () => A.tone(H.chordTone(0, 1), { vol: 0.012, dur: 5, attack: 0.02, type: 'sine', rev: 0.8, role: 'bells' });
      H.onChord(() => { place(0.9); tune(0.9); bell(); });
      v.fadeIn(1, 2.5);
      return {
        tick(inp, dt) {
          const s = P.state, gate = 0.35 + s.pres * 0.65;
          const sz = s.size, ht = clamp(s.heat + s.aud * 0.18);
          pad.forEach(p => { p.level((0.002 + sz * 0.006) * gate, 0.5); p.bright(160 + ht * 900 + sz * 300, 0.4); });
          A.set(sg.gain, (0.012 + sz * 0.028) * gate, 0.4);
          A.set(ag.gain, (0.0005 + ht * 0.004 * sz) * gate, 0.4);
          A.set(af.frequency, 400 + ht * 2600, 0.4);
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', sz); MOut.expr('bass', sz); MOut.expr('bells', ht); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
