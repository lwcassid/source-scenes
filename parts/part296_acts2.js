/* ---------- SRC-66.7 · 68.5 · 64.4 — BIRTH OF A TEMPLE, the three acts with their layers (Sep 29, 2026) ----------
   Edson, Sep 29 17:04: "please add as layers
     act 1: src 63, src 80
     act 2: src 70, 58 — make the direction of the rain 2 nobs on the twister
     act 3: src 74 (before 64) just layer up and down — make the direction of
            the rain 2 nobs in the twister, than src 64, src 66
     start and finish in the same place."
   And on the two knobs: "1 knob up and down, 1 knob wind to right and to
   left" → SRC-58.4 (part290). The QR and DIVIDE stay in Act 2 for the
   sending (asked, kept).

   A NAME IS A ROUND (part289), so each act is the next version of its own
   family and keeps its title — the set (SRC-66 · 68 · 64) does not change.
   What changes is that each act is a HOST again (part250's mixer): the act's
   opening picture on fader 1, the new layers after it, in his order.

   NO HOST INSIDE A HOST. 63, 64 and 74 are hosts themselves, and a nested
   host's own faders cannot be reached, so they are FLATTENED into the layers
   they hold:
     63 = THE PASSAGE + THE NAMES      → the Names only, in Act 1 (17:23: "lets put
                                         the rain only in act 2, take out of act 1")
     74 "just layer up and down"       → its one layer "The Passage, Up and Down"
     64 = ASCENSION + THE POINT, RETURNED → both, in Act 3

     SRC-66.7  Act 1 · Expectation and Launch
               ECLIPSE 66.4 · NAMES 59 · CABLE SPHERE 80.3
               + the LAUNCH shot (knob 7 push, or L), carried over from SRC-73
     SRC-68.5  Act 2 · The Depths
               BEAM 68.2 · LIGAM 70.3 · PASSAGE 58.4 · QR 79 · NAMES 59.2
               macros DIRECTION (down) · WIND · DIVIDE · INSIDE
     SRC-64.4  Act 3 · The Collective Witnesses
               PASSAGE 58.4 · ASCENSION 60 · RETURNED 61 · ECLIPSE 66.4
               macros DIRECTION (up) · WIND
               → the night closes on the picture it opened on.

   MUSIC is the host's (it sets the clock and the harmony every layer
   hears), taken from LANCE'S RE-KEYED ACTS of the same day (part290-292:
   66.6 in A aeolian, 68.4 in E phrygian, 64.3 in A aeolian, the band's
   white keys), so every layer plays in the band's key and Act 3 still ends
   in Act 1's. These hosts are the next versions after his. */
(() => {
  if (!window.MIX || !MIX.make || typeof PIECES === 'undefined') return;
  const def = id => PIECES.find(p => p.id === id);
  const music = id => { const d = def(id); return d ? d.music : undefined; };

  const SRC = 'THE SOURCE LAW is unchanged and applies to every layer at once: both hands at the instrument is the smallest, slowest form of whatever is up, and silence; both hands wide is everything at once. ';
  const FAD = 'The FADERS decide what is on the wall: knobs 1–5, or the number keys to solo one. A layer under 1% stops rendering and falls silent. BLACKOUT (knob 12, or B) glides everything to black and back. ';
  const RAIN = 'DIRECTION (knob 13) moves the rain up or down; WIND (knob 14) blows it left or right. ';

  /* makeMixer registers id = family, ver 1, and its own tags. Make it the
     next round of the act's family instead, with the act's tags, and keep
     the id in MIX.MIXERS (makeMixer already put it there). */
  const act = (M, family, ver, tag) => {
    MIX.make(M);
    const d = def(M.id); if (!d) return;
    d.family = family; d.ver = ver;
    /* NO BLOOM. The openers (66.4, 68.2) own their light and have no fx; the
       host's bloom (makeMixer: M.bloom || 0.42, so 0 cannot say "none") blew
       the Eclipse to white and ate the Beam's line, measured Sep 29 side by
       side. "The first sphere is perfect… the fresta, perfect": the act
       looks exactly like its opener alone. */
    d.fx = {};
    d.tags = ['BIRTH OF A TEMPLE', tag].concat(d.tags.filter(t => t !== 'TEMPLE SET'));
  };

  act({
    id: 'SRC-66.7', part: 'I', title: 'Act 1 · Expectation and Launch', tech: 'THREE LAYERS + THE LAUNCH / A AEOLIAN 54',
    layers: ['SRC-66.4', 'SRC-59', 'SRC-80.3'],
    cost: { 'SRC-66.4': 3, 'SRC-59': 1, 'SRC-80.3': 3 },
    shots: [{ id: 'SRC-77', label: 'LAUNCH' }],
    macros: [],
    music: music('SRC-66.6'),
    desc: 'Act one. It opens on the Light Eclipse, alone: a point that opens into a disc, a ring, an eclipse. Then the layers: THE NAMES, the nineteen thousand on their shell; THE CABLE SPHERE. When the story reaches today at 2:18, the LAUNCH is a button: one press and the rocket plays from the top over everything, with its sound, then it is gone. Layers are added and removed; nothing cuts.',
    interact: SRC + FAD + 'THE LAUNCH is a press, not a fader: knob 7 (or L) plays the clip from the top over everything; it leaves by itself when it ends, and a second press cuts it.',
    sound: 'A aeolian at 54 (Lance\'s key for the band, SRC-66.6), eight bars a chord: the slowest of the night. Each layer keeps its own sound on its own fader; the clip brings its own.'
  }, 'SRC-66', 7, 'ACT 1');

  act({
    id: 'SRC-68.5', part: 'II', title: 'Act 2 · The Depths', tech: 'FIVE LAYERS / E PHRYGIAN 120',
    layers: ['SRC-68.2', 'SRC-70.3', 'SRC-58.4', 'SRC-79', 'SRC-59.2'],
    cost: { 'SRC-68.2': 3, 'SRC-70.3': 3, 'SRC-58.4': 3, 'SRC-79': 1, 'SRC-59.2': 1 },
    macros: [
      { k: 'dir',    label: 'DIRECTION', def: 0 },   // the rain: 0 = going down, into the depths
      { k: 'wind',   label: 'WIND', def: 0.5 },      // the rain: 0 left · 0.5 still · 1 right
      { k: 'divide', label: 'DIVIDE', def: 0 },      // the Names: the mother cell → many
      { k: 'inside', label: 'INSIDE', def: 0 }       // the Names: the camera into them
    ],
    music: music('SRC-68.4'),
    desc: 'Act two. It opens on the Beam from black, one hand, then the chaos. Then the layers: LIGAM; THE PASSAGE, the rain, its direction and its wind on two knobs; THE QR for the sending; THE NAMES, the single cell, and after the names are sent, DIVIDE. Never pull attention while people are on their phones; the multiplying is for the music after.',
    interact: SRC + FAD + RAIN + 'DIVIDE (knob 15) splits the Names; INSIDE (knob 7) takes the camera into them.',
    sound: 'E phrygian at 120 (Lance\'s key for the band, SRC-68.4). The band walks it down at the descent. Each layer keeps its own sound on its own fader.'
  }, 'SRC-68', 5, 'ACT 2');

  act({
    id: 'SRC-64.4', part: 'III', title: 'Act 3 · The Collective Witnesses', tech: 'FOUR LAYERS / A AEOLIAN 50',
    layers: ['SRC-58.4', 'SRC-60', 'SRC-61', 'SRC-66.4'],
    cost: { 'SRC-58.4': 3, 'SRC-60': 3, 'SRC-61': 1, 'SRC-66.4': 3 },
    macros: [
      { k: 'dir',  label: 'DIRECTION', def: 1 },     // the rain: 1 = going up, the rise from Act 2
      { k: 'wind', label: 'WIND', def: 0.5 }
    ],
    music: music('SRC-64.3'),
    desc: 'Act three. It opens on THE PASSAGE, going up: the rise from Act 2 carries straight through, no cut. Then ASCENSION, the shards that break free; THE POINT, RETURNED; and last the LIGHT ECLIPSE, the picture the night opened on. It starts and finishes in the same place.',
    interact: SRC + FAD + RAIN,
    sound: 'A aeolian at 50 (Lance\'s key, SRC-64.3), the key of act one: the night ends harmonically where it began, as it does visually.'
  }, 'SRC-64', 4, 'ACT 3');
})();
