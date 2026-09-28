/* ---------- BIRTH OF A TEMPLE — the three acts, by name (Sep 28, 2026) ----------
   Edson, Sep 28 17:47: "organize the performance queue… Create a new set
   Birth of a Temple. Inside just 3 scenes:
     scene 1: SRC-66 — Act 1 · Expectation and Launch
     scene 2: SRC-68 — Act 2 · The Depths
     scene 3: SRC-64 — Act 3 · The Collective Witnesses"

   A NAME IS A ROUND, so each is a new version (the versioning law) — and
   nothing else changes: each is the family's latest version as it stood,
   registered again under a new id with the act's title. Same init, step,
   draw and sound, same hands, same maps (the Twister map is per family).
     SRC-66.5 = SRC-66.4 ISOTRP A · Light Eclipse V4
     SRC-68.3 = SRC-68.2 ISOTRP C · Beam
     SRC-64.2 = SRC-64   BoT · III · Ascension (a mixer host: its id joins
                         MIX.MIXERS, or the faders would not find it)
   A later round on any of these starts from THIS version and keeps the name. */
(() => {
  if (typeof PIECES === 'undefined') return;
  const act = (from, id, ver, title, tag) => {
    const d = PIECES.find(p => p.id === from);
    if (!d) { console.warn('actnames: no', from); return; }
    reg(Object.assign({}, d, { id, ver, family: d.family || from, title,
      tags: ['BIRTH OF A TEMPLE', tag].concat((d.tags || []).filter(t => t !== 'BIRTH OF A TEMPLE')) }));
  };
  act('SRC-66.4', 'SRC-66.5', 5, 'Act 1 · Expectation and Launch', 'ACT 1');
  act('SRC-68.2', 'SRC-68.3', 3, 'Act 2 · The Depths', 'ACT 2');
  act('SRC-64', 'SRC-64.2', 2, 'Act 3 · The Collective Witnesses', 'ACT 3');
  if (window.MIX && MIX.MIXERS && MIX.MIXERS.indexOf('SRC-64.2') < 0) MIX.MIXERS.push('SRC-64.2');
})();
