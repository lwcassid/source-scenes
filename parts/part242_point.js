/* ---------- SRC-56 · THE POINT (origin) ----------
   The first scene of the Orbital Temple set, and the simplest thing in the
   library: ONE disc of light on black. No field, no particles, no second
   mechanic. It is the light source every other scene in this set is lit by,
   and the point everything else originates from.

   Reaching OUT opens it — the one inversion in the set, because a thing you
   hold near you is small and a thing you release is vast. The music breathes
   it too: the line-in drives the same radius the hands do, so with a band
   playing and nobody at the pedestal the disc is already alive.

   The rim carries the faintest hint of a corona — thirty-two strokes, barely
   lit. That is the seed ECLIPSE (SRC-57) grows into two thousand. */
(() => {
  reg({
    id: 'SRC-56', family: 'SRC-56', ver: 1, title: 'BoT · The Point', tech: 'ONE DISC / THE ORIGIN',
    audioIn: true,
    textIsContent: true,   // the poems ride this scene — performance mode must not strip fillText
    music: {
      bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
      chords: [
        [0, 7, 12, 19],        // Fm(no3) open fifth — the point before harmony
        [0, 7, 14, 19],        // Fsus2
        [0, 8, 15, 20],        // D♭maj7/F
        [0, 7, 12, 17]         // Fsus4
      ],
      chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4']
    },
    fx: { bloom: 0.3 },
    tags: ['TEMPLE SET', 'BOTH HANDS IN = A COAL', 'OPEN L = SIZE', 'OPEN R = HEAT', 'LISTENS TO THE BAND'],
    desc: 'One circle of light on black. Nothing else. Hold both hands at the Source and it is a coal, barely alive. Open the left and it grows until it fills the room; open the right and it heats, from deep ember through gold to a white that hurts. Both hands wide and it is a sun. It breathes with the band too: whatever is played into the line-in moves the same edge your hands move, so it is never still and never empty. This is the light the rest of the set is lit by, and the point the rest of the set comes out of.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE SIZE — a coal at the instrument, a sun at arm\'s length. R OPENS THE HEAT — ember, gold, white, and the rim sharpens as it climbs. The band moves it too: the low end pushes the radius, a kick knocks it. Let go entirely and it settles back to a coal and breathes.',
    sound: 'F aeolian, eight-bar chords — the slowest harmonic rhythm in the set, because this scene is a held state, not a progression. A sub root, an open fifth pad that fills to a seventh as the disc opens, and one bell struck on each chord change. Size is the filter and the level; heat is the pad brightness and a touch of detune. Line-in level adds to the swell without ever driving it alone. MIDI: pad on the chord, sub on bass, bell on bells. No drums, ever — this scene has no pulse of its own.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const NR = 32;
      const rj = new Float32Array(NR), rl = new Float32Array(NR);
      for (let i = 0; i < NR; i++) { rj[i] = (P.rand() - 0.5) * 0.04; rl[i] = 0.6 + P.rand() * 0.8; }
      P.state = {
        cx: w / 2, cy: h / 2, S, NR, rj, rl,
        pres: 0, size: 0, heat: 0, drift: P.rand() * 100,
        pulse: 0, lastKick: -1, aud: 0, events: []
      };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;

      // REACH OUT = LARGER. inp arrives lean-in = 1, so the disc reads 1 - L.
      const idleS = 0.20 + Math.sin(s.drift * 0.05) * 0.09;
      const idleH = 0.24 + Math.sin(s.drift * 0.077 + 1.3) * 0.09;
      const wantS = SOURCE(inp.L) * s.pres + idleS * (1 - s.pres);
      const wantH = SOURCE(inp.R) * s.pres + idleH * (1 - s.pres);
      s.size += (wantS - s.size) * Math.min(1, dt * 7);
      s.heat += (wantH - s.heat) * Math.min(1, dt * 7);

      // the band moves the same edge the hands do
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
      // HOSTED BY THE MIXER: the ground is painted once, by the mixer, and a
      // layer that repaints it erases every layer under it. Standalone this
      // is unchanged.
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }

      const S = Math.min(w, h);
      const R = S * (0.045 + s.size * 0.40) * (1 + s.aud * 0.10 + s.pulse * 0.07);
      const heat = clamp(s.heat + s.aud * 0.18);
      const bright = (0.55 + s.pres * 0.45) * room;

      // the body: white-hot core through gold to a deep ember rim
      const core = `rgba(255,${Math.round(238 - heat * 6)},${Math.round(196 + heat * 54)},${(0.72 + heat * 0.28) * bright})`;
      const mid  = `rgba(255,${Math.round(150 + heat * 70)},${Math.round(72 + heat * 90)},${(0.60 + heat * 0.30) * bright})`;
      const rim  = `rgba(${Math.round(226 + heat * 26)},${Math.round(64 + heat * 60)},${Math.round(34 + heat * 46)},0)`;
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, R);
      gr.addColorStop(0, core);
      gr.addColorStop(0.55 + heat * 0.18, mid);
      gr.addColorStop(1, rim);
      g.fillStyle = gr;
      g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();

      // the halo it throws into the room — this is why it is a light source
      const HR = R * (2.0 + heat * 1.1);
      const hg = g.createRadialGradient(s.cx, s.cy, R * 0.85, s.cx, s.cy, HR);
      hg.addColorStop(0, `rgba(255,${Math.round(130 + heat * 80)},${Math.round(60 + heat * 80)},${(0.16 + heat * 0.16) * bright})`);
      hg.addColorStop(1, 'rgba(255,120,60,0)');
      g.fillStyle = hg;
      g.beginPath(); g.arc(s.cx, s.cy, HR, 0, TAU); g.fill();

      // the seed of the corona: thirty-two strokes, barely there
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.lineCap = 'round';
      for (let i = 0; i < s.NR; i++) {
        const a = (i / s.NR) * TAU + s.drift * 0.06 + s.rj[i];
        const len = R * (0.06 + s.rl[i] * 0.09 * (0.4 + heat));
        const c = Math.cos(a), sn = Math.sin(a);
        g.strokeStyle = `rgba(255,${Math.round(190 + heat * 50)},${Math.round(150 + heat * 70)},${(0.10 + heat * 0.18) * bright})`;
        g.lineWidth = 1.6 * ms;
        g.beginPath(); g.moveTo(s.cx + c * R * 0.99, s.cy + sn * R * 0.99);
        g.lineTo(s.cx + c * (R + len), s.cy + sn * (R + len)); g.stroke();
      }

      // HOSTED: the mixer draws the readout for the whole movement. A layer
      // that also draws its own puts two lines of text on the same pixels.
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {

        g.globalCompositeOperation = 'source-over';

        g.fillStyle = 'rgba(225,225,235,0.8)';

        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;

        g.fillText('SIZE ' + Math.round(s.size * 100) + '   HEAT ' + Math.round(heat * 100) + (s.pres < 0.3 ? '   · BREATHING' : ''), 10, h - 10);

      }

      // HOSTED: the mixer runs the poems once for the whole movement. Left in,
      // this ran the overlay once PER LIVE LAYER — the dark plate stacked and
      // the text was painted over itself three times a frame.
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
