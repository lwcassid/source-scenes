/* ---------- SRC-66.4 · ISOTRP A · LIGHT ECLIPSE V4 (the sound answers the hands) ----------
   Edson on V3, Sep 27 16:10: "lets make the sound more responsive to the
   instrument and a little less dark."

   The PICTURE is V3's, untouched. V4 changes only the SOUND (and presence):
   - WHY IT WAS DARK, measured: the sub sat at H.chordTone(0,-2) = 21.8 Hz
     (below hearing, only rumble) and was 5-10x louder than the pad; the pad
     sat at 87-131 Hz behind a 180 Hz filter. Spectral centroid 110-270 Hz.
     V4: the sub moves up to F1 (43.6 Hz) and down in level, the pad moves
     up an octave (175-262 Hz) and becomes the body, and the filter has a
     key-tracked floor and opens 500 -> ~4 kHz with R. A LITTLE less dark:
     same triangle voices, same chords, no new layers.
   - WHY IT FELT LATE: the tone followed the picture's hands (~170-250 ms)
     with 0.12-0.4 s glides, and the one bell was quantised to T.next(0.5),
     up to ~0.55 s at 54 bpm. V4 reads its OWN fast hands for the sound
     (~40 ms, as SRC-56.4) and glides in ~20 ms, so the sound now LEADS the
     picture slightly.
   - THE MOTION IS HEARD (SRC-56.4's bow): a moving hand swells and opens
     the tone, a still hand settles.
   - NOTES UNDER L: walking the shape climbs the sounding chord's tones F4 → F6
     (5-8 rungs, by chord), each a soft bell, at once, rising with the hand; crossing into a new form still rings the brighter
     form bell, also at once. Hysteresis on every rung, nothing on the
     first frame, nothing until presence has faded in, and only while a hand
     is actually sending (the core's ghost glide at load is nobody playing).
   - BOTH HANDS AT THE SOURCE = SILENCE (Edson, 16:46, before V4 was
     heard, so folded into V4): below ~2% reach on both hands nothing
     sounds, not even the line-in's swell; full by ~15%, an S-curve.
   - PRESENCE is SOURCE_PRES() (the last position holds), not ISO.presence,
     which read chan.*.mode and dropped the sound to 35% when hands left. */
(() => {
  const ISO = window.ISO;
  // H.chordTone(k) folds back on these wide voicings (349, 523, 698, 349…),
  // so the ladder is built from frequencies, sorted: a rising hand climbs
  function LADDER() {
    const fs = [];
    for (let i = -4; i < 16; i++) for (const o of [0, 1, 2]) {
      const f = H.chordTone(i, o);
      if (f > 340 && f < 1420 && !fs.some(x => Math.abs(x / f - 1) < 0.01)) fs.push(Math.round(f * 100) / 100);
    }
    return fs.length ? fs.sort((a, b) => a - b) : [349.23];
  }
  const MUSIC = {
    bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
    chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
    chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4']
  };

  reg({
    id: 'SRC-66.4', family: 'SRC-66', ver: 4,
    title: 'ISOTRP A · Light Eclipse', tech: 'GLSL LIGHT FIELDS / A HEARTBEAT FROM THE LINE-IN / THE SOUND ANSWERS THE HANDS',
    audioIn: true,
    music: MUSIC,
    tags: ['STUDY', 'AFTER 404.ZERO', 'WEBGL', 'NO STROBE', 'LISTENS', 'THE SOURCE LAW'],
    desc: 'The Light Eclipse with a real heartbeat. Every kick hits it at once, the light jumping larger and brighter, sharpening, the eclipse\'s dark core contracting as the light floods in, and then it sinks back slowly, over about a second, until the next one. The fuller the music, the larger it rests. With nothing plugged in it beats on its own slow pulse.',
    interact: 'THE SOURCE LAW. L WALKS THE SHAPE: a point at the Source, through disc and ring to the eclipse at arm\'s length. R OPENS THE LIGHT, and with it the depth of the pulse: close is a dim glow that barely breathes, far is a burning light with a clear heartbeat.',
    sound: 'F aeolian at 54. A sub on F1 and three triangle pad voices an octave above V3\'s, voice-led through the chords. The sound has its own fast hands (~40 ms): L is the pad\'s level and climbs the chord\'s tones F4 → F6, one soft bell each, with a brighter bell at each new form; R opens the filter from a warm 500 Hz to ~4 kHz. A moving hand swells and opens the tone like a bow; every kick swells it with the light. Both hands at the Source is silence.',

    init(P) {
      const s = { noGL: ISO.noGL(P), pres: 0, m: 0.2, x: 0.25, drift: P.rand() * 100, ang: 0, stage: 0,
                  kick: 0, kickT: 0, body: 0, lvl: 0, bass: 0, treb: 0, lastKick: -1, lastBeat: -1, src: 'own',
                  aL: 0.2, aR: 0.25, motion: 0, rung: 0, rungN: 0, rungHz: 349, ladKey: '', seeded: false };
      P.state = s;
      if (!s.noGL) ISO.make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      s.pres += (SOURCE_PRES() - s.pres) * Math.min(1, dt * 1.5); s.drift += dt;   // the last position holds
      const idL = SOURCE_IDLE(s.drift, 0.22, 0.12, 0.05), idR = SOURCE_IDLE(s.drift + 40, 0.3, 0.1, 0.07);
      ISO.hand(s, 'm', inp.L, idL, dt, 4);
      ISO.hand(s, 'x', inp.R, idR, dt, 6);
      // THE SOUND'S OWN HANDS: ~40 ms, so the tone answers before the light has moved
      const pL = s.aL, pR = s.aR;
      ISO.hand(s, 'aL', inp.L, idL, dt, 25);
      ISO.hand(s, 'aR', inp.R, idR, dt, 25);
      const vel = s.seeded ? (Math.abs(s.aL - pL) + Math.abs(s.aR - pR)) / Math.max(dt, 1e-3) : 0;
      s.motion = Math.max(clamp(vel / 1.5), s.motion * Math.exp(-dt / 0.3));   // the bow: instant up, ~0.3 s down
      // THE RUNGS under L: the sounding chord's tones F4 → F6, one per step of the hand,
      // a new one only 0.3 of a step past the boundary; a chord change re-snaps silently
      const ns = LADDER(), key = ns.join(), rx = clamp(s.aL) * (ns.length - 1);
      if (!s.seeded || key !== s.ladKey) { s.seeded = true; s.ladKey = key; s.rung = Math.round(rx); }
      else if (Math.abs(rx - s.rung) > 0.8) { s.rung = Math.round(rx); s.rungN++; }
      s.rungHz = ns[s.rung];
      s.ang += dt * (0.08 + 0.9 * s.x);
      s.stage = Math.min(3, Math.floor(s.m * 3 + 0.5));

      // ---- what it listens to ----
      const au = inp.audio || {};
      let beatLen;
      if (au.live) {
        s.src = 'line';
        const k = au.kick;
        if (k && k.n !== s.lastKick) {
          if (s.lastKick !== -1) s.kickT = Math.max(s.kickT, 0.55 + 0.45 * clamp(k.strength || 0.8));
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
        if (b !== s.lastBeat) { if (s.lastBeat !== -1) s.kickT = Math.max(s.kickT, b % 4 === 0 ? 0.9 : 0.6); s.lastBeat = b; }
        s.lvl += (0.35 + 0.1 * Math.sin(s.drift * 0.13) - s.lvl) * Math.min(1, dt * 1);
        s.bass += (0.3 - s.bass) * Math.min(1, dt * 1);
        s.treb += (0 - s.treb) * Math.min(1, dt * 1);
        beatLen = 60 / MUSIC.bpm;
      }
      s.kickT *= Math.exp(-dt / Math.max(0.6, beatLen * 1.6)); // recovers SLOWLY, about a second
      s.kick += (s.kickT - s.kick) * Math.min(1, dt * 65);    // ...after an attack of ~15 ms
      s.body = clamp(0.6 * s.lvl + 0.4 * s.bass);
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return ISO.noGLDraw(g, w, h, 'ISOTRP A V4');
      const depth = 0.35 + 0.65 * s.x;                     // R far = a clear heartbeat
      const k = s.kick * depth, b = s.body * depth;
      const grow = 1 + 0.24 * k + 0.07 * b;                // up to ~+30%
      const m = clamp(s.m) * 3, gr = clamp(s.m), x = s.x;
      const wt = i => Math.max(0, 1 - Math.abs(m - i));
      const y = 0.04 + 0.01 * Math.sin(s.drift * 0.3), xx = 0.02 * Math.sin(s.drift * 0.21);
      const lights = [
        { type: 0, x: xx, y, s: (0.03 + 0.06 * gr) * grow, i: 1.2 * wt(0) },
        { type: 1, x: xx, y, s: (0.06 + 0.26 * gr) * grow, i: 0.95 * wt(1) },
        { type: 2, x: xx, y, s: (0.10 + 0.28 * gr) * grow, i: 1.0 * wt(2) * (1 + 0.25 * s.treb * depth), ang: s.ang },
        { type: 3, x: xx, y, s: (0.12 + 0.26 * gr) * grow, i: 1.0 * wt(3), prm: clamp(0.25 + 0.55 * (m - 2) - 0.10 * b - 0.22 * k) }
      ].filter(L => L.i > 0.002);
      ISO.render(P, g, w, h, lights, {
        t, soft: Math.max(0.03, 0.9 - 0.75 * x - 0.3 * k),
        exp: (0.35 + 0.95 * x) * (1 + 0.8 * k + 0.2 * b)
      });
      ISO.hud(P, g, w, h, 'SHAPE ' + ['POINT', 'DISC', 'RING', 'ECLIPSE'][s.stage] + ' ' + Math.round(gr * 100) +
        '   LIGHT ' + Math.round(x * 100) + '   PULSE ' + Math.round(k * 100) + ' / ' + Math.round(b * 100) +
        (s.src === 'line' ? '   · LISTENING' : '   · OWN PULSE (no input)') + (s.pres < 0.3 ? '   · BREATHING' : ''));
    },
    audio(A, P) {
      const v = A.voice();
      // an octave above V3's pad, and the pad is now the body of the sound
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.01, cutoff: 600, q: 0.8, midi: false });
      pad.forEach((p, i) => p.set(262 * (1 + i * 0.25), 0.01));   // seed high, so voice-leading lands in 175-350 Hz
      const place = gl => A.leadToChord(pad, 0, gl); place(0.05);
      const sub = v.osc('sine', 44), sg = v.g(0.01); sub.connect(sg); sg.connect(v.group);
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -1), gl); tune(0.05);   // F1, audible (V3: 21.8 Hz)
      H.onChord(() => { place(0.9); tune(0.9); });
      v.fadeIn(1, 1.5);
      const aStage = L => Math.min(3, Math.floor(L * 3 + 0.5));   // the picture's stage, read from the fast hand
      let lastStage = null, lastRung = null;   // synced on the first tick after the hands are seeded: opening rings nothing
      return {
        tick() {
          const s = P.state, gate = 0.35 + s.pres * 0.65;
          // a bell is a note a HAND plays: armed once the fade-in is over AND the hand is sending
          // (a moving hand is always 'live'; the core's ghost/drift glide at load is nobody playing).
          // Events only: presence itself stays SOURCE_PRES(), the last position holds.
          // the rungs and forms are the LEFT hand's notes: armed on L alone (the core gliding an absent L home is nobody)
          const armed = s.pres > 0.95 && chan.L.mode === 'live';
          const L = clamp(s.aL), R = clamp(s.aR), M = s.motion;
          // BOTH HANDS AT THE SOURCE = SILENCE (Edson, 16:46): gated by the more open hand, silent below
          // ~2% reach, full by ~15%, an S-curve (as SRC-56.4), so opening from nothing fades in, never clicks.
          // Silence means everything: pad, sub, bells, and the swell from the line-in.
          const zo = clamp((Math.max(L, R) - 0.02) / 0.13), open = zo * zo * (3 - 2 * zo);
          if (lastRung === null) { if (!s.seeded) return; lastRung = s.rungN; lastStage = aStage(L); }
          const kk = s.kick * (0.35 + 0.65 * R);
          const bow = 0.75 + 0.8 * M;
          pad.forEach(p => {
            p.level((0.0022 + 0.0068 * L) * gate * open * bow * (1 + 0.5 * kk), 0.02);
            // key-tracked floor: the note always speaks; R, the bow and the kick open it
            p.bright(Math.max(2.5 * p.freq, 500 + 3200 * Math.pow(R, 1.3)) + 1500 * M + 1200 * kk, 0.02);
          });
          A.set(sg.gain, (0.004 + 0.006 * L) * gate * open, 0.02);
          if (s.rungN !== lastRung) {
            if (armed && open > 0.01) A.bell(s.rungHz, { vol: (0.008 + 0.010 * R) * gate * open, dur: 2.2, rev: 0.6, pan: (clamp(s.aL) - 0.5) * 0.6, midi: false });
            lastRung = s.rungN;
          }
          // a new FORM (the sound's hand crossing point/disc/ring/eclipse): a brighter bell, an octave over the rung
          if (aStage(L) !== lastStage) {
            if (armed && open > 0.01) A.bell(s.rungHz * 2, { vol: 0.02 * gate * open, dur: 3, rev: 0.7, role: 'bells' });
            lastStage = aStage(L);
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', L); MOut.expr('bass', L); MOut.expr('bells', R); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
