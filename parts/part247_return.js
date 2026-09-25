/* ---------- SRC-61 · THE POINT, RETURNED (the close) ----------
   The last scene of the set is the first one again — same disc, same two
   hands, same inversion where reaching out opens it — so the room recognises
   it instantly and knows the thing has come back around.

   One difference, and it is the whole ending. This point no longer holds
   what it holds. Motes leave the rim continuously and go out into the dark,
   and as the heat climbs the body HOLLOWS: the core opens, the fill thins,
   and the disc becomes a ring. The set opens on a point from which
   everything originates and closes on the same point emptied into an orbit.

   Nothing is added to play. It is the simplest instrument in the library
   twice, and what changed in between is that it gave everything away. */
(() => {
  reg({
    id: 'SRC-61', family: 'SRC-61', ver: 1, title: 'BoT · The Point, Returned', tech: 'ONE DISC / IT HOLLOWS AND SHEDS',
    audioIn: true,
    textIsContent: true,
    music: {
      bpm: 50, root: 41, mode: 'aeolian', chordBars: 8,
      chords: [
        [0, 7, 12, 19],        // F5 — where the set began
        [0, 7, 14, 21],        // Fsus2(13)
        [0, 8, 15, 19],        // D♭maj7/F
        [0, 7, 12, 19]         // F5 — and back
      ],
      chordNames: ['F5', 'Fsus2(13)', 'D♭maj7/F', 'F5']
    },
    fx: { bloom: 0.3 },
    tags: ['TEMPLE SET', 'OPEN L = SIZE', 'OPEN R = IT HOLLOWS', 'LISTENS TO THE BAND'],
    desc: 'The circle from the beginning of the set, come back. The same hands do the same things — hold them at the Source and it is a coal, open them and it becomes a sun — and the band moves the same edge through the line-in. But this one is letting go. Motes lift off the rim and drift out into the black and do not come back, and the further you open the right hand the more the body hollows: the fill thins, the centre opens, and at full reach the disc has become a ring. The set begins on a point that everything comes out of and ends on the same point, emptied, turned into an orbit.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE SIZE, exactly as it did in THE POINT. R IS THE GIVING: closed, it is the solid coal you started the night with; opened, it hollows into a ring while the motes pour off the rim. The shedding never stops — even with nobody at the instrument something is always leaving — so the scene is never static and the room can talk over it.',
    sound: 'F aeolian, eight bars a chord, the slowest in the set and the same key it opened in — the last chord is the first chord. A sub, an open fifth pad, and one bell on each change with a very long tail. Hollowing thins the pad and raises a high air voice, so giving it away is audible as the body leaving and the overtone staying. Motes ring faintly as they go, no more than a few a second, never on the grid. MIDI: pad, bass, bells. No drums; nothing to keep time for any more.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const M = 260;
      const mr = new Float32Array(M), ma = new Float32Array(M), mv = new Float32Array(M), mb = new Float32Array(M);
      for (let i = 0; i < M; i++) { mr[i] = 1 + P.rand() * 2.4; ma[i] = P.rand() * TAU; mv[i] = 0.04 + P.rand() * 0.10; mb[i] = 0.3 + P.rand() * 0.7; }
      P.state = { cx: w / 2, cy: h / 2, S, M, mr, ma, mv, mb,
                  pres: 0, size: 0, give: 0, drift: P.rand() * 80, aud: 0, pulse: 0, lastKick: -1, events: [], cool: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleS = 0.20 + Math.sin(s.drift * 0.042) * 0.09;
      const idleG = 0.24 + Math.sin(s.drift * 0.058 + 2.7) * 0.09;
      s.size += ((SOURCE(inp.L) * s.pres + idleS * (1 - s.pres)) - s.size) * Math.min(1, dt * 7);
      s.give += ((SOURCE(inp.R) * s.pres + idleG * (1 - s.pres)) - s.give) * Math.min(1, dt * 6);

      const au = inp.audio || {};
      const lvl = (au.live ? 1 : 0.55) * (au.level || 0);
      s.aud += (lvl - s.aud) * Math.min(1, dt * 9);
      if (au.kick && au.kick.n !== s.lastKick) { s.lastKick = au.kick.n; s.pulse = Math.min(1, s.pulse + 0.4 * (au.kick.strength || 1)); }
      s.pulse *= Math.pow(0.02, dt);

      // the shedding: always something leaving
      s.cool = Math.max(0, s.cool - dt);
      const { M, mr, ma, mv, mb } = s;
      const rate = 0.55 + s.give * 1.5;
      for (let i = 0; i < M; i++) {
        mr[i] += mv[i] * rate * dt * 2.2;
        ma[i] += dt * 0.05 * (1 / mr[i]);
        if (mr[i] > 3.6) {
          mr[i] = 1.0; ma[i] = P.rand() * TAU; mv[i] = 0.04 + P.rand() * 0.10; mb[i] = 0.3 + P.rand() * 0.7;
          if (s.cool <= 0 && s.pres > 0.1 && mb[i] > 0.8 && s.events.length < 3) {
            s.events.push({ pan: Math.cos(ma[i]) * 0.7, vel: mb[i] });
            s.cool = 0.5 + (1 - s.give) * 1.4;
          }
        }
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      // HOSTED BY THE MIXER: the ground is painted once, by the mixer, and a
      // layer that repaints it erases every layer under it. Standalone this
      // is unchanged.
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const S = s.S;
      const R = S * (0.045 + s.size * 0.40) * (1 + s.aud * 0.10 + s.pulse * 0.07);
      const gv = clamp(s.give);
      const bright = (0.55 + s.pres * 0.45) * room;
      const hollow = gv * 0.80;                       // how far the core has opened

      g.globalCompositeOperation = 'lighter';
      // the body, hollowing: the inner stop walks outward until the disc is a ring
      const gr = g.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, R);
      const fill = (1 - gv * 0.32);
      if (hollow < 0.02) {
        gr.addColorStop(0, `rgba(255,232,196,${0.72 * bright})`);
      } else {
        // NOT a dimmed centre — an UNLIT one. A tinted core on black is mud,
        // and on mesh scrim mud is the one thing nobody can see.
        gr.addColorStop(0, 'rgba(255,200,150,0)');
        gr.addColorStop(hollow * 0.97, 'rgba(255,200,150,0)');
      }
      gr.addColorStop(Math.min(0.985, hollow + (1 - hollow) * 0.45), `rgba(255,${Math.round(178 + gv * 40)},${Math.round(112 + gv * 58)},${(0.64 * fill) * bright})`);
      gr.addColorStop(1, 'rgba(226,80,44,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();

      // the rim: sharpens as the body empties — the ring it is becoming
      g.strokeStyle = `rgba(255,${Math.round(214 + gv * 34)},${Math.round(176 + gv * 62)},${(0.14 + gv * 0.62) * bright})`;
      g.lineWidth = (1.0 + gv * 3.0) * ms;
      g.beginPath(); g.arc(s.cx, s.cy, R * (0.985 - hollow * 0.02), 0, TAU); g.stroke();

      // the halo
      const HR = R * (1.16 + gv * 0.30);
      const hg = g.createRadialGradient(s.cx, s.cy, R * 0.99, s.cx, s.cy, HR);
      hg.addColorStop(0, `rgba(255,${Math.round(160 + gv * 60)},${Math.round(100 + gv * 80)},${(0.07 + gv * 0.06) * bright})`);
      hg.addColorStop(1, 'rgba(255,130,80,0)');
      g.fillStyle = hg; g.beginPath(); g.arc(s.cx, s.cy, HR, 0, TAU); g.fill();

      // what is leaving, and it cools as it goes
      const { M, mr, ma, mb } = s;
      for (let i = 0; i < M; i++) {
        const rr = R * mr[i];
        const fade = clamp(1 - (mr[i] - 1) / 2.6);
        if (fade <= 0.01) continue;
        const x = s.cx + Math.cos(ma[i]) * rr, y = s.cy + Math.sin(ma[i]) * rr * 0.98;
        const cool = clamp((mr[i] - 1) / 2.6);
        const a = fade * fade * mb[i] * (0.10 + gv * 0.46) * bright;
        g.fillStyle = `rgba(${Math.round(255 - cool * 60)},${Math.round(214 - cool * 20)},${Math.round(170 + cool * 70)},${a})`;
        const rad = (0.9 + mb[i] * 1.5) * ms * (1 - cool * 0.35);
        g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      }

      // HOSTED: the mixer draws the readout for the whole movement. A layer
      // that also draws its own puts two lines of text on the same pixels.
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {

        g.globalCompositeOperation = 'source-over';

        g.fillStyle = 'rgba(225,225,235,0.8)';

        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;

        g.fillText('SIZE ' + Math.round(s.size * 100) + '   GIVING ' + Math.round(gv * 100) + (gv > 0.7 ? '   · A RING' : '') + (s.pres < 0.3 ? '   · SHEDDING' : ''), 10, h - 10);

      }

      // HOSTED: the mixer runs the poems once for the whole movement. Left in,
      // this ran the overlay once PER LIVE LAYER — the dark plate stacked and
      // the text was painted over itself three times a frame.
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.005, cutoff: 190, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 44), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const air = v.osc('sine', 660), ag = v.g(0.0001), af = v.filter('highpass', 500, 0.6);
      air.connect(af); af.connect(ag); ag.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.9; ag.connect(sd); sd.connect(A.revIn); }
      const tune = gl => { A.set(sub.frequency, H.chordTone(0, -2), gl); A.set(air.frequency, H.chordTone(2, 2), gl); };
      tune(0.05);
      H.onChord(() => {
        place(1.2); tune(1.2);
        A.tone(H.chordTone(0, 1), { vol: 0.011, dur: 9, attack: 0.04, type: 'sine', rev: 1, role: 'bells' });
      });
      v.fadeIn(1, 3);
      return {
        tick(inp, dt) {
          const s = P.state, gate = 0.35 + s.pres * 0.65;
          const sz = s.size, gv = clamp(s.give);
          // hollowing: the body thins and the overtone stays
          pad.forEach(p => { p.level((0.002 + sz * 0.006) * (1 - gv * 0.45) * gate, 0.6); p.bright(150 + sz * 400, 0.5); });
          A.set(sg.gain, (0.012 + sz * 0.026) * (1 - gv * 0.40) * gate, 0.5);
          A.set(ag.gain, (0.0004 + gv * 0.0045 * (0.3 + sz)) * gate, 0.5);
          A.set(af.frequency, 400 + gv * 1200, 0.5);
          let k = 0;
          while (s.events.length) {
            const e = s.events.shift(); if (k++ > 1) continue;
            A.tone(H.chordTone(3 + (k % 2), 1), { vol: (0.003 + e.vel * 0.008) * gate, dur: 4.5, attack: 0.02, type: 'sine', rev: 1, role: 'bells', pan: e.pan });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', sz); MOut.expr('bass', sz * (1 - gv * 0.4)); MOut.expr('bells', gv); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
