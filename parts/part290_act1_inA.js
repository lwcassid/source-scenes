/* ---------- SRC-66.6 · ACT 1 · EXPECTATION AND LAUNCH, in A ----------
   Lance, Sep 29: the keys the band is comfortable in are Nima's — C, G,
   A minor: white keys on the piano. The act opens on Light Eclipse in F
   aeolian, and its mood is the thing to keep: V5's picture, sound and
   hands, untouched, only the root moved up a major third so the chords
   fall under Nima's hands. F5 / Fsus2 / D♭maj7/F / Fsus4 become A5 /
   Asus2 / Fmaj7/A / Asus4: the same shapes, no black keys. Every pitch in
   the sound comes off H (chordTone), so the sub, the pad and the bells all
   follow the root.

   Spreads SRC-66.5 (Edson's act-named version of Light Eclipse V4) and
   replaces only the music object, the way part289 made 66.5 from 66.4.  */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-66.5');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-66.6', family: 'SRC-66', ver: 6,
    tech: (prev.tech || 'GLSL LIGHT FIELDS') + ' · IN A',
    music: {
      bpm: 54, root: 45, mode: 'aeolian', chordBars: 8,
      chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
      chordNames: ['A5', 'Asus2', 'Fmaj7/A', 'Asus4']
    },
    sound: 'A aeolian at 54 — moved from F to A for the band (white keys, Nima\'s hands); nothing else changed. ' + (prev.sound || '').replace(/^F aeolian at 54\. /, '')
  }));
})();
