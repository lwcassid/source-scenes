/* ---------- SRC-64.3 · ACT 3 · THE COLLECTIVE WITNESSES, in A ----------
   Lance, Sep 29: Nima's keys. The third act of the BIRTH OF A TEMPLE set
   moves from F aeolian 50 to A aeolian 50: F5 / D♭maj7♯11/F / E♭6/9/F / F5
   become A5 / Fmaj7♯11/A / G6/9/A / A5, all white keys, and the last song
   can lift into C major (the relative major) from the same hand position.

   Spreads SRC-64.2 (Edson's act-named version of the Ascension host) and
   replaces only the music object. A host's id must be in MIX.MIXERS or the
   faders would not find it — the same line part289 uses.                */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-64.2');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-64.3', family: 'SRC-64', ver: 3,
    tech: 'TWO LAYERS / A AEOLIAN 50',
    music: { bpm: 50, root: 45, mode: 'aeolian', chordBars: 4,
             chords: [[0, 7, 12, 19, 24], [0, 8, 15, 20, 27], [0, 10, 14, 19, 26], [0, 7, 12, 19]],
             chordNames: ['A5', 'Fmaj7♯11/A', 'G6/9/A', 'A5'] },
    sound: 'A aeolian at 50 — moved from F to A for the band (white keys, Nima\'s hands). The bass ends on the chord it began on, so the night closes harmonically as well as visually; the last song can lift into C major from the same hand position.'
  }));
  if (window.MIX && MIX.MIXERS && MIX.MIXERS.indexOf('SRC-64.3') < 0) MIX.MIXERS.push('SRC-64.3');
})();
