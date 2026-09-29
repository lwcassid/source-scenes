/* ---------- SRC-68.4 · ACT 2 · THE DEPTHS, in E phrygian ----------
   Lance, Sep 29: the band's keys are white keys. The act opens on the Beam
   in F phrygian at 120; moved DOWN a semitone to E phrygian it is the same
   mode on white keys — and E phrygian to A aeolian is the descent at 8:27
   with no new notes at all: the same seven, a different centre. The band
   leads that descent; this makes it a hand position, not a modulation.

   Spreads SRC-68.3 (Edson's act-named version of Beam V2) and replaces
   only the music object.                                                */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-68.3');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-68.4', family: 'SRC-68', ver: 4,
    tech: (prev.tech || 'BEAM') + ' · IN E PHRYGIAN',
    music: { bpm: 120, root: 40, mode: 'phrygian', chordBars: 16, prog: [0, 1] },
    sound: '120 bpm, E phrygian — moved down a semitone from F for the band: white keys, and one hand position away from the A aeolian the descent lands in. ' + (prev.sound || '').replace(/^120 bpm, F phrygian\. /, '')
  }));
})();
