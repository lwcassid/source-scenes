/* ---------- SRC-66.10 · 68.8 · 64.5 — BIRTH OF A TEMPLE, the three acts at FULL LIGHT (Sep 30, 2026) ----------
   Edson, Sep 29 20:01: "the instrument should never change the opacity of
   layers. This is only for the twister." And 20:05, on what hands-in should
   look like: "Smallest, full light."

   Measured before this round, each layer alone at full fader, both hands
   in: the rain and Ascension fell to 0.3/255, the Names to 0.7, the Beam
   to 9 against 136. Inside an act that is the hands fading layers in and
   out, which is the Twister's job. So every layer is its Full Light
   version (part300-307): near = less is the least FORM, always at full
   light; how much of a layer is on the wall is its fader, nothing else.

   Same acts, same order, same knobs, same shot; the music is whatever the
   act's latest version carries (Lance's keys: 66.8 C aeolian, 68.6 E
   aeolian, 64.4 A aeolian), read at load so a later re-key he makes on
   the act before this one still lands. No bloom (part296's reason).     */
(() => {
  if (!window.MIX || !MIX.make || typeof PIECES === 'undefined') return;
  const def = id => PIECES.find(p => p.id === id);
  const from = id => def(id) || {};

  const act = (prevId, M, family, ver, tag) => {
    const prev = from(prevId);
    MIX.make(Object.assign({
      title: prev.title, tech: prev.tech, music: prev.music,
      desc: prev.desc, interact: prev.interact, sound: prev.sound
    }, M));
    const d = def(M.id); if (!d) return;
    d.family = family; d.ver = ver; d.fx = {};
    d.tags = ['BIRTH OF A TEMPLE', tag, 'FULL LIGHT'].concat(d.tags.filter(t => t !== 'TEMPLE SET'));
  };

  act('SRC-66.8', {
    id: 'SRC-66.10', part: 'I',
    layers: ['SRC-66.9', 'SRC-59.3', 'SRC-80.4'],
    cost: { 'SRC-66.9': 3, 'SRC-59.3': 1, 'SRC-80.4': 3 },
    shots: [{ id: 'SRC-77', label: 'LAUNCH' }],
    macros: []
  }, 'SRC-66', 10, 'ACT 1');

  act('SRC-68.6', {
    id: 'SRC-68.8', part: 'II',
    layers: ['SRC-68.7', 'SRC-70.4', 'SRC-58.5', 'SRC-79', 'SRC-59.3'],
    cost: { 'SRC-68.7': 3, 'SRC-70.4': 3, 'SRC-58.5': 3, 'SRC-79': 1, 'SRC-59.3': 1 },
    macros: [
      { k: 'dir',    label: 'DIRECTION', def: 0 },
      { k: 'wind',   label: 'WIND', def: 0.5 },
      { k: 'divide', label: 'DIVIDE', def: 0 },
      { k: 'inside', label: 'INSIDE', def: 0 }
    ]
  }, 'SRC-68', 8, 'ACT 2');

  act('SRC-64.4', {
    id: 'SRC-64.5', part: 'III',
    layers: ['SRC-58.5', 'SRC-60.2', 'SRC-61.2', 'SRC-66.9'],
    cost: { 'SRC-58.5': 3, 'SRC-60.2': 3, 'SRC-61.2': 1, 'SRC-66.9': 3 },
    macros: [
      { k: 'dir',  label: 'DIRECTION', def: 1 },
      { k: 'wind', label: 'WIND', def: 0.5 }
    ]
  }, 'SRC-64', 5, 'ACT 3');
})();
