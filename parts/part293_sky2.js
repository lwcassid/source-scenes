/* ---------- SRC-73.2 · BoT 0.2 · I · THE SKY, in A ----------
   Lance, Sep 29: Nima's keys. The 0.2 host for act one moves from F
   aeolian to A aeolian: same chords, same eight bars each, a major third
   up, no black keys. Spreads SRC-73 — its layers, shots, macros and
   palette come with it — and replaces only the music object; the id joins
   MIX.MIXERS so the faders find it (part289's line).                     */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-73');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-73.2', family: 'SRC-73', ver: 2,
    tech: (prev.tech || 'FIVE LAYERS + THE LAUNCH').replace(/F AEOLIAN/, 'A AEOLIAN'),
    music: { bpm: 54, root: 45, mode: 'aeolian', chordBars: 8,
             chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
             chordNames: ['A5', 'Asus2', 'Fmaj7/A', 'Asus4'] },
    sound: 'A aeolian, eight bars a chord, the slowest of the night — moved from F to A for the band (white keys, Nima\'s hands). ' + (prev.sound || '').replace(/^F aeolian, eight bars a chord, the slowest of the night — /, '')
  }));
  if (window.MIX && MIX.MIXERS && MIX.MIXERS.indexOf('SRC-73.2') < 0) MIX.MIXERS.push('SRC-73.2');
})();
