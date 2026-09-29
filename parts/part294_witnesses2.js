/* ---------- SRC-75.2 · BoT 0.2 · III · THE WITNESSES, in A ----------
   Lance, Sep 29: Nima's keys. The 0.2 host for act three moves from F
   aeolian 68 to A aeolian 68: F5 / D♭maj7♯11/F / E♭6/9/F / F5 become A5 /
   Fmaj7♯11/A / G6/9/A / A5, all white keys. Spreads SRC-75 and replaces
   only the music object; the id joins MIX.MIXERS (part289's line).      */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-75');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-75.2', family: 'SRC-75', ver: 2,
    tech: 'THREE LAYERS / A AEOLIAN 68',
    music: { bpm: 68, root: 45, mode: 'aeolian', chordBars: 4,
             chords: [[0, 7, 12, 19, 24], [0, 8, 15, 20, 27], [0, 10, 14, 19, 26], [0, 7, 12, 19]],
             chordNames: ['A5', 'Fmaj7♯11/A', 'G6/9/A', 'A5'] },
    sound: 'A aeolian at 68 — the key of the first act, faster: an encore, not a coda. Moved from F to A for the band; the last song can lift into C major, the relative major, from the same hand position.'
  }));
  if (window.MIX && MIX.MIXERS && MIX.MIXERS.indexOf('SRC-75.2') < 0) MIX.MIXERS.push('SRC-75.2');
})();
