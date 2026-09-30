/* ---------- SRC-68.6 · ACT 2 · THE DEPTHS, in E minor ----------
   Lance, Sep 30, after the band's run-through: the Ceremony comes out of
   the chaos on his E minor guitar riff, and the wall was in E phrygian
   (68.4 → 68.5). Same E, one note apart — F becomes F♯ — asked and
   answered ("yeah I guess"). The Glitch Moment before it has no key of
   its own, so E aeolian carries the whole act.

   Spreads SRC-68.5 (Edson's five-layer host: Beam, Ligam, the Passage
   as rain, the QR, the Names) and replaces only the music object: the
   same two-chord ladder at 120, the mode moved from phrygian to aeolian.
   Every layer hears the host's harmony.  */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-68.5');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-68.6', family: 'SRC-68', ver: 6,
    tech: (prev.tech || '').replace('E PHRYGIAN', 'E MINOR'),
    music: Object.assign({}, prev.music || {}, { root: 40, mode: 'aeolian' }),
    sound: 'E aeolian at 120 — E minor for Lance\'s Ceremony riff (Sep 30), one note off the phrygian it had; nothing else changed. ' + (prev.sound || '').replace(/^E phrygian at 120 \([^)]*\)\. /, '')
  }));
  if (window.MIX && MIX.MIXERS && !MIX.MIXERS.includes('SRC-68.6')) MIX.MIXERS.push('SRC-68.6');
})();
