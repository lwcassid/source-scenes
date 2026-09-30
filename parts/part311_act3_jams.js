/* ---------- SRC-64.6 · ACT 3 · THE COLLECTIVE WITNESSES, the two jams (Sep 30, 2026) ----------
   Edson, 01:09: "create a good set of sounds for act 3 layers based on the
   run of the show. We might use tomorrow in the rehearsal."

   THE RUN OF SHOW, Act 3 (get people dancing): song 5, the Am jam — Lance
   on the Nord in Am, then the Am → Gm cue and Fresco's breakbeat; song 6,
   the Cm jam — Lance on piano in Cm, Nima's Cm arp on the modular, the
   right hand walking up over bass notes A♭, F, C, E♭.

   THE PROBLEM with any wall harmony under a live jam: the band changes
   chords on ITS clock, the wall on its own. A wall that changes chord will
   be wrong against the band half the time. So this act never tries to
   follow the band's changes. It holds a PITCH WORLD that is consonant with
   EVERY chord the band plays in that song, and lets only the COLOUR shift
   inside it (the sound-craft pedal: the root never moves, the colour does):

     SONG A · Am jam (Am and Gm)  — the notes Am and Gm share in spirit:
       D F G A C (D minor pentatonic). Over Am they are the 11, ♭3, ♭7, root,
       ♭3; over Gm the 5, ♭7, root, 9, 11. No B♭, no E, no B: nothing that
       fights either chord. Pedal on D, the one note that is home in both.
         Am11/D  D A C G · C6/9/D  D G C F A · Dm11  D A F G C
     SONG B · Cm jam (A♭ F C E♭ under Cm) — Cm7's four notes and the 9/11:
       C E♭ G B♭ (+D, F). Over A♭ they are 3 5 maj7 9(#11 with D); over F
       the 5 ♭7 9 11; over E♭ the 6 root 3 5. Pedal on C.
         Cm7 · Cm9 · Cm11 · Cm7
     Eight bars a colour: slow enough that no change is ever an event.

   KNOB 15 · SONG (Twister macro C, beside DIRECTION 13 and WIND 14):
   left half = the Am jam (default), right half = the Cm jam. The switch
   re-voices every layer at once (they all read the host's harmony) on the
   turn of the knob — Edson turns it when Lance moves to the piano.

   AND A BASS CUT. Every layer carries its own sub (the Eclipse's F1, the
   Point's sub, Ascension's sub on the bass); under a band with a bass, a
   Nord and a kit that is mud. The act's whole output runs through a
   180 Hz high-pass: the wall lives above the band, in the air and the
   mids' top, and leaves the floor to Fresco and the low end of the Nord.
   24 dB/octave (two biquads): at 12 dB the D pedal's sub still carried ~20%
   of the energy under 150 Hz.

   Everything else is SRC-64.5 (Full Light): the same four layers in the
   same order, DIRECTION and WIND on 13 and 14, the faders, the picture.
   Nothing in the layers is edited; the act re-casts them.               */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-64.5');
  if (!prev || typeof H === 'undefined') return;

  const SONGS = [
    { name: 'Am JAM', root: 50, mode: 'aeolian', chordBars: 8,                // D pedal: Am and Gm share it
      chords: [[0, 7, 10, 17, 19], [0, 5, 10, 15, 19], [0, 7, 15, 17, 22], [0, 7, 10, 17, 19]],
      chordNames: ['Am11/D', 'C6/9/D', 'Dm11', 'Am11/D'] },
    { name: 'Cm JAM', root: 48, mode: 'aeolian', chordBars: 8,                // C pedal: safe over A♭ F C E♭
      chords: [[0, 7, 10, 15, 19], [0, 7, 14, 15, 22], [0, 7, 10, 15, 17], [0, 7, 10, 15, 19]],
      chordNames: ['Cm7', 'Cm9', 'Cm11', 'Cm7'] }
  ];
  const MACROS = (prev._macros || prev.macros || [
    { k: 'dir', label: 'DIRECTION', def: 1 }, { k: 'wind', label: 'WIND', def: 0.5 }
  ]).filter(d => d.k !== 'song').concat([{ k: 'song', label: 'SONG Am | Cm', def: 0 }]);

  // retune the running harmony to a song, and tell every layer's voices (H.onChord)
  function setSong(i) {
    const S = SONGS[i];
    H.root = S.root; H.mode = S.mode; H.chords = S.chords; H.chordNames = S.chordNames;
    H.prog = S.chords.map((_, k) => k); H.chordBars = S.chordBars; H.step = 0;
    H.nextChangeBar = (T.running ? Math.floor(T.bar()) : 0) + S.chordBars;
    H.build();
    for (const cb of H.listeners) { try { cb(); } catch (e) {} }
  }
  const songOf = P => (P.state && P.state.macro && P.state.macro.song >= 0.5) ? 1 : 0;

  const def = Object.assign({}, prev, {
    id: 'SRC-64.6', family: 'SRC-64', ver: 6,
    tech: 'FOUR LAYERS / THE TWO JAMS: Am (D PEDAL) · Cm (C PEDAL) ON A KNOB / 180 Hz CUT',
    tags: (prev.tags || []).filter(t => t !== 'THE TWO JAMS').concat(['THE TWO JAMS']),
    music: { bpm: (prev.music && prev.music.bpm) || 50, root: SONGS[0].root, mode: SONGS[0].mode,
             chordBars: SONGS[0].chordBars, chords: SONGS[0].chords, chordNames: SONGS[0].chordNames },
    macros: MACROS, _macros: MACROS,
    interact: (prev.interact || '') + ' SONG (knob 15): left = the Am jam, right = the Cm jam; turn it when Lance moves to the piano.',
    sound: 'Built for the two jams of Act 3, under a live band. The wall never follows the band\'s chord changes (it would be wrong half the time); it holds a pitch world that sits under every chord of the song. Am jam: a D pedal, D F G A C only (Am11/D · C6/9/D · Dm11), consonant under both Am and Gm. Cm jam: a C pedal, Cm7 · Cm9 · Cm11, consonant over the walk-up A♭ F C E♭. Eight bars a colour. Knob 15 switches the song and every layer re-voices at once. The whole act runs through a 180 Hz high-pass, so the wall leaves the floor to the band.',

    init(P) {
      prev.init.apply(this, arguments);
      if (P.state && P.state.macro && P.state.macro.song === undefined) P.state.macro.song = 0;
      if (P.state) P.state._song = -1;
    },
    step(P) {
      const s = P.state;
      if (s) {
        const want = songOf(P);
        if (want !== s._song && H.chords) { setSong(want); s._song = want; }
      }
      return prev.step.apply(this, arguments);
    },
    audio(A, P) {
      // the bass cut: the mixer's bus connects to A.master at creation, so hand it the filter
      // two stacked biquads = 24 dB/octave: a 12 dB slope left ~20% of the energy under 150 Hz (measured)
      const hp = A.ctx.createBiquadFilter(), hp2 = A.ctx.createBiquadFilter();
      hp.type = hp2.type = 'highpass'; hp.frequency.value = hp2.frequency.value = 180; hp.Q.value = hp2.Q.value = 0.707;
      const m = A.master;
      hp.connect(hp2); hp2.connect(m || A.ctx.destination);
      A.master = hp;
      let inst;
      try { inst = prev.audio.apply(this, arguments); } finally { A.master = m; }
      if (P.state) P.state._song = -1;          // re-apply the song once the voices exist
      return {
        tick() { return inst && inst.tick && inst.tick.apply(inst, arguments); },
        stop() { try { inst && inst.stop && inst.stop.apply(inst, arguments); } finally { setTimeout(() => { try { hp.disconnect(); hp2.disconnect(); } catch (e) {} }, 1500); } }
      };
    }
  });
  reg(def);
  if (window.MIX && MIX.MIXERS && MIX.MIXERS.indexOf('SRC-64.6') < 0) MIX.MIXERS.push('SRC-64.6');
})();
