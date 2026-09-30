/* ---------- SRC-68.9 · ACT 2 · THE DEPTHS, E minor chords (Sep 30, 2026) ----------
   Edson, 01:05: "please update the chords of our 3 scenes based on the new
   run of the show." The run of show: song 3 Glitch has no key (the wall is
   in E minor), song 4 Ceremony is Lance's E minor riff with tons of space.

   68.6 moved the MODE from phrygian to aeolian but kept prog [0, 1]. In
   phrygian degree 1 was F major (the dark ♭II); in aeolian the same degree
   is F♯ DIMINISHED — a tense chord against an Em riff. This spreads SRC-68.8
   (the Full Light act) and replaces only the music: two chords over an E
   pedal, Em → Cmaj7/E, E minor's own soft move (the mirror of Act 1's
   C5 → A♭maj7/C a key away), explicit so nothing drifts off E. Same 120 bpm,
   same 16 bars a chord, same layers, knobs and faders.

   Act 1 (C minor, 66.8 → 66.10/66.12) already matches the run of show.
   Act 3 is silent on the wall per the run of show; its A aeolian stays.  */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-68.8');
  if (!prev) return;
  const was = prev.music || {};
  reg(Object.assign({}, prev, {
    id: 'SRC-68.9', family: 'SRC-68', ver: 9,
    tags: (prev.tags || []).filter(t => t !== 'E MINOR CHORDS').concat(['E MINOR CHORDS']),
    music: {
      bpm: was.bpm || 120, root: 40, mode: 'aeolian', chordBars: was.chordBars || 16,
      chords: [[0, 7, 12, 15, 19], [0, 8, 12, 15, 19]],
      chordNames: ['Em', 'Cmaj7/E']
    },
    sound: 'E minor at 120 for the Ceremony riff: Em → Cmaj7/E over an E pedal, sixteen bars each (68.6\'s prog [0, 1] in aeolian landed on F♯ diminished). ' + (prev.sound || '').replace(/^E aeolian at 120 — [^.]*\. /, '')
  }));
  if (window.MIX && MIX.MIXERS && MIX.MIXERS.indexOf('SRC-68.9') < 0) MIX.MIXERS.push('SRC-68.9');
})();
