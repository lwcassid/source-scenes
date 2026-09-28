/* ---------- SRC-66.2 · ISOTRP A · LIGHT ECLIPSE V2 (it breathes with what it hears) ----------
   Edson on V1: "This is a beautiful starting point for us. I want in V2 to
   make the entire thing pulse gently with the sound it's listening to."

   V1's shape and hands are untouched (L walks point → disc → ring →
   eclipse, R opens the light). V2 adds ONE thing: the whole light pulses
   with the line-in / mic, gently, on two clocks (scene-craft, Cell Front V9):

   - THE KICK is the only fast move. On each detected kick the light swells
     in over ~70 ms (size, exposure, a little sharper) and relaxes over about a beat.
     The rising edge is `inp.audio.kick.n` changing, so it fires once per hit.
   - THE BODY is slow. Level and bass ease in at ~2/s into a breathing term:
     the light is a little larger and warmer while the music is full, and it
     settles while it is sparse. The eclipse's dark core breathes with the
     bass, and treble adds a faint shimmer to the ring's hot edge.
   - R (the light) also sets HOW MUCH it pulses: near the Source a whisper,
     far a clear heartbeat. Far = more, as the Source law says.

   Gentle means: at most ~9% size and ~35% exposure on the hardest kick.

   Nothing plugged in (no live input): it pulses with ITS OWN transport, one
   soft swell a beat at 54 bpm, so the scene is never dead in rehearsal. The
   HUD says which it is following. */
(() => {
  const ISO = window.ISO;
  const MUSIC = {
    bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
    chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
    chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4']
  };

  reg({
    id: 'SRC-66.2', family: 'SRC-66', ver: 2,
    title: 'ISOTRP A · Light Eclipse', tech: 'GLSL LIGHT FIELDS / PULSES WITH THE LINE-IN',
    audioIn: true,
    music: MUSIC,
    tags: ['STUDY', 'AFTER 404.ZERO', 'WEBGL', 'NO STROBE', 'LISTENS', 'THE SOURCE LAW'],
    desc: 'V1\'s light (a point that opens into a disc, hollows into a ring with one hot edge and closes into a dark eclipse) now breathes with the music it hears. Every kick swells it softly and lets it go over a beat; the fuller the music, the larger and brighter it rests; the eclipse\'s dark core breathes with the bass. Gentle, never a flash. With nothing plugged in it breathes on its own slow pulse.',
    interact: 'THE SOURCE LAW. L WALKS THE SHAPE: a point at the Source, through disc and ring to the eclipse at arm\'s length. R OPENS THE LIGHT, and with it the depth of the pulse: close is a dim glow that barely breathes, far is a burning light with a clear heartbeat.',
    sound: 'Same as V1: F aeolian at 54, a sub and three triangle pad voices (filter follows R, level follows L), one bell when the shape crosses into a new form. The pad also swells a little with the pulse, so what the room hears breathes with what it sees.',

    init(P) {
      const s = { noGL: ISO.noGL(P), pres: 0, m: 0.2, x: 0.25, drift: P.rand() * 100, ang: 0, stage: 0,
                  kick: 0, kickT: 0, body: 0, lvl: 0, bass: 0, treb: 0, lastKick: -1, lastBeat: -1, src: 'own' };
      P.state = s;
      if (!s.noGL) ISO.make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      ISO.presence(s, dt); s.drift += dt;
      ISO.hand(s, 'm', inp.L, SOURCE_IDLE(s.drift, 0.22, 0.12, 0.05), dt, 4);
      ISO.hand(s, 'x', inp.R, SOURCE_IDLE(s.drift + 40, 0.3, 0.1, 0.07), dt, 6);
      s.ang += dt * (0.08 + 0.9 * s.x);
      s.stage = Math.min(3, Math.floor(s.m * 3 + 0.5));

      // ---- what it listens to ----
      const au = inp.audio || {};
      let beatLen;
      if (au.live) {
        s.src = 'line';
        const k = au.kick;
        if (k && k.n !== s.lastKick) {
          if (s.lastKick !== -1) s.kickT = Math.min(1, s.kickT + 0.65 * (k.strength || 0.8));
          s.lastKick = k.n;
        }
        s.lvl += ((au.level || 0) - s.lvl) * Math.min(1, dt * 2);
        s.bass += ((au.bass || 0) - s.bass) * Math.min(1, dt * 2);
        s.treb += ((au.treble || 0) - s.treb) * Math.min(1, dt * 2.5);
        beatLen = 60 / ((typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm) || 100);
      } else {
        // nothing plugged in: its own slow heartbeat, one soft swell a beat
        s.src = 'own';
        const b = (typeof T !== 'undefined' && T.running) ? Math.floor(T.beats()) : Math.floor(s.drift * MUSIC.bpm / 60);
        if (b !== s.lastBeat) { if (s.lastBeat !== -1) s.kickT = Math.min(1, s.kickT + (b % 4 === 0 ? 0.5 : 0.3)); s.lastBeat = b; }
        s.lvl += (0.35 + 0.1 * Math.sin(s.drift * 0.13) - s.lvl) * Math.min(1, dt * 1);
        s.bass += (0.3 - s.bass) * Math.min(1, dt * 1);
        s.treb += (0 - s.treb) * Math.min(1, dt * 1);
        beatLen = 60 / MUSIC.bpm;
      }
      s.kickT *= Math.exp(-dt / (beatLen * 0.45));         // relaxes over about a beat
      s.kick += (s.kickT - s.kick) * Math.min(1, dt * 14); // ...and swells in over ~70 ms: gentle, never a pop
      s.body = clamp(0.6 * s.lvl + 0.4 * s.bass);
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return ISO.noGLDraw(g, w, h, 'ISOTRP A V2');
      const depth = 0.35 + 0.65 * s.x;                     // R far = a clear heartbeat
      const k = s.kick * depth, b = s.body * depth;
      const grow = 1 + 0.06 * k + 0.035 * b;               // gentle: ≤ ~9%
      const m = clamp(s.m) * 3, gr = clamp(s.m), x = s.x;
      const wt = i => Math.max(0, 1 - Math.abs(m - i));
      const y = 0.04 + 0.01 * Math.sin(s.drift * 0.3), xx = 0.02 * Math.sin(s.drift * 0.21);
      const lights = [
        { type: 0, x: xx, y, s: (0.03 + 0.06 * gr) * grow, i: 1.2 * wt(0) },
        { type: 1, x: xx, y, s: (0.06 + 0.26 * gr) * grow, i: 0.95 * wt(1) },
        { type: 2, x: xx, y, s: (0.10 + 0.28 * gr) * grow, i: 1.0 * wt(2) * (1 + 0.15 * s.treb * depth), ang: s.ang },
        { type: 3, x: xx, y, s: (0.12 + 0.26 * gr) * grow, i: 1.0 * wt(3), prm: clamp(0.25 + 0.55 * (m - 2) - 0.08 * b) }
      ].filter(L => L.i > 0.002);
      ISO.render(P, g, w, h, lights, {
        t, soft: Math.max(0.05, 0.9 - 0.75 * x - 0.12 * k),
        exp: (0.35 + 0.95 * x) * (1 + 0.28 * k + 0.12 * b)
      });
      ISO.hud(P, g, w, h, 'SHAPE ' + ['POINT', 'DISC', 'RING', 'ECLIPSE'][s.stage] + ' ' + Math.round(gr * 100) +
        '   LIGHT ' + Math.round(x * 100) + '   PULSE ' + Math.round(k * 100) + ' / ' + Math.round(b * 100) +
        (s.src === 'line' ? '   · LISTENING' : '   · OWN PULSE (no input)') + (s.pres < 0.3 ? '   · BREATHING' : ''));
    },
    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.005, cutoff: 220, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 44), sg = v.g(0.02); sub.connect(sg); sg.connect(v.group);
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.9); tune(0.9); });
      v.fadeIn(1, 2.5);
      let lastStage = P.state.stage;
      return {
        tick() {
          const s = P.state, gate = 0.35 + s.pres * 0.65;
          const swell = 1 + 0.25 * s.kick * (0.35 + 0.65 * s.x);
          pad.forEach(p => { p.level((0.002 + s.m * 0.006) * gate * swell, 0.12); p.bright(180 + s.x * 1400 * swell, 0.15); });
          A.set(sg.gain, (0.012 + s.m * 0.024) * gate, 0.4);
          if (s.stage !== lastStage) {
            A.bell(H.chordTone(s.stage * 2, 1), { at: T.next(0.5), vol: 0.02 * gate, dur: 3, rev: 0.7, role: 'bells' });
            lastStage = s.stage;
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', s.m); MOut.expr('bass', s.m); MOut.expr('bells', s.x); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
