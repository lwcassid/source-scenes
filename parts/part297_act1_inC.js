/* ---------- SRC-66.8 · ACT 1 · EXPECTATION AND LAUNCH, in C minor ----------
   Lance, Sep 30, after the full run-through with the band: the opener is
   his composed song in C minor (A♭ minor bridge), and Edson's drone and
   sparkle on the wall have to sit in it — "I think it's in Am?" It was
   (66.6 → 66.7, A aeolian for the white keys). The Rocket Launch that
   follows is G minor strings, and G minor lives inside C aeolian, so one
   key on the wall carries the whole act.

   Spreads SRC-66.7 (Edson's three-layer host with the LAUNCH shot) and
   replaces only the music object: A5 / Asus2 / Fmaj7/A / Asus4 become
   C5 / Csus2 / A♭maj7/C / Csus4, the same shapes a minor third up. Every
   layer hears the host's harmony, so the Eclipse, the Names and the Cable
   Sphere all follow the root.  */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-66.7');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-66.8', family: 'SRC-66', ver: 8,
    tech: (prev.tech || '').replace('A AEOLIAN', 'C AEOLIAN'),
    music: {
      bpm: 54, root: 48, mode: 'aeolian', chordBars: 8,
      chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
      chordNames: ['C5', 'Csus2', 'A♭maj7/C', 'Csus4']
    },
    sound: 'C aeolian at 54 — the band\'s opener is in C minor (Lance, Sep 30), and G minor for the launch sits inside it; nothing else changed. ' + (prev.sound || '').replace(/^A aeolian at 54 \([^)]*\), /, '')
  }));
  if (window.MIX && MIX.MIXERS && !MIX.MIXERS.includes('SRC-66.8')) MIX.MIXERS.push('SRC-66.8');
})();
