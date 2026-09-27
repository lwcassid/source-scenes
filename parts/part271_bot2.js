/* ---------- SRC-73/74/75 · BIRTH OF A TEMPLE 0.2 — three acts, many layers ----------
   The night as decided with Gabi on Sep 26 (SESSION-GABI-NIGHT-SHOW-2026-09-26):
   three acts of about twenty minutes, every beat music → a short story → a
   milestone. Sky → depths → the collective. "You give before you ask."

     I   · THE SKY        expectation → triumph · the rocket goes up
     II  · THE DEPTHS     down, dense, the heart · think of a name → send
     III · THE WITNESSES  refresh, back up, collective · the twelve point

   Each act is ONE HOST (part250's mixer, 0.2) with up to six layers on the
   Twister's faders and up to four MACROS on knobs 13, 14, 15, 7 — the slow
   decided moves of the act, so the theremin stays a performance instrument.
   Inside an act you MIX; between acts you CUT, and the cut is where colour,
   shape and tempo change ("refresh", II → III). BLACKOUT on knob 12 takes
   the wall to black for the 8:00 silence and the twelfth Witness.

   THE LAYERS ARE SCENES THAT ALREADY EXIST, hosted, not copied: SRC-56.2,
   58.2, 59.2 are the versions with macros; 57, 60, 61, 71 are as they were;
   77, 78, 79 are the MEDIA scenes (part267) — the launch clip, the temple
   still, the QR. Act III's radar (SRC-76) is the one build still to come;
   until it lands, III hosts Ascension, Returned and The Circle.

   BoT 0.1 (SRC-62/63/64) is untouched and still opens.                  */
(() => {
  if (!window.MIX || !MIX.make) return;

  const SRC = 'THE SOURCE LAW is unchanged and applies to every layer at once: both hands at the instrument is the smallest, slowest form of whatever is up; both hands wide is everything at once. ';
  const FAD = 'The FADERS decide what is on the wall: knobs 1–6, or the number keys to solo one. A layer under 1% stops rendering and falls silent. ';
  const MACS = 'The MACROS (knobs 13, 14, 15, 7) are the act\'s slow decided moves; they hold where you leave them. BLACKOUT (knob 12, or B) glides everything to black and back. ';

  MIX.make({
    id: 'SRC-73', part: 'I', title: 'BoT 0.2 · I · The Sky', tech: 'SIX LAYERS / F AEOLIAN 54',
    /* Sep 27 (PLAN-PALETTE): the four generated layers are their versions
       that READ the palette below — 56.3, 71.2, 58.3, 57.2. The old ones are
       untouched and still open. `cost` follows the ids: Eclipse and the
       Passage are the heavies (3), or the budget lets them meet. */
    layers: ['SRC-56.3', 'SRC-71.2', 'SRC-58.3', 'SRC-77', 'SRC-78', 'SRC-57.2'],
    cost: { 'SRC-56.3': 1, 'SRC-71.2': 2, 'SRC-58.3': 3, 'SRC-77': 1, 'SRC-78': 1, 'SRC-57.2': 3 },
    macros: [
      { k: 'depth', label: 'DEPTH', def: 0 },      // the flat gold disc → a body in a space
      { k: 'dir',   label: 'DIRECTION', def: 1 }   // the Passage: 1 = up
    ],
    /* THE PALETTE (partcore_palette.js, Sep 27): gold, copper and silver —
       Edson's call for Act I. Three bands MEASURED off the Procreate metal
       palette he linked (pAVoni/references/metal-gradients): each is the row
       with a full metal arc, dark edge → highlight → dark edge. c0 is the
       temple's own gold from the site. Every layer of the act reads these. */
    palette: {
      c: ['#d4af37', '#947733', '#d37b50', '#d4d4d4', '#4f4f4f'],
      g: [
        ['#b39b41','#dbc463','#ebe294','#f9f9c2','#f6efaf','#e8d67e','#dbbb53','#c0993e','#947733','#6d5432'],   // GOLD1
        ['#b7603f','#d37b50','#df9566','#eec49b','#f7dfba','#f2c396','#e8a574','#d58354','#92452c','#6d2c1c'],   // COPPER1
        ['#898989','#999999','#b0b0b0','#d4d4d4','#f4f4f4','#ebebeb','#dbdbdb','#cecece','#c2c2c2','#9e9e9e'] ], // SILVER1
      names: { c0: 'TEMPLE GOLD', c1: 'DEEP GOLD', c2: 'COPPER', c3: 'SILVER', c4: 'DARK SILVER',
               g0: 'GOLD', g1: 'COPPER', g2: 'SILVER' }
    },
    bloom: 0.34,
    music: { bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
             chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
             chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4'] },
    desc: 'Act one. It opens on a flat gold circle, alone — a light on the wall, the room lit by it. Turn DEPTH and it turns out to sit in a space. Bring up THE CIRCLE and the ring is alive with the band; bring up THE PASSAGE and you are travelling upward through stars. When the story reaches today at 2:18, the LAUNCH CLIP is a fader: up, it plays from the top, a few seconds, then gone. THE TEMPLE is a still behind the talk, a button not a chapter. ECLIPSE is the crown for the triumph. Layers are added and removed; nothing cuts.',
    interact: SRC + FAD + MACS + 'DEPTH is macro A, DIRECTION is macro B (leave it up).',
    sound: 'F aeolian, eight bars a chord, the slowest of the night — this act is a held state that a band plays over. Each layer keeps its own sound on its own fader; the clip brings its own.'
  });

  MIX.make({
    id: 'SRC-74', part: 'II', title: 'BoT 0.2 · II · The Depths', tech: 'FOUR LAYERS / A AEOLIAN 50',
    layers: ['SRC-58.2', 'SRC-59.2', 'SRC-79', 'SRC-71'],
    cost: { 'SRC-58.2': 3, 'SRC-59.2': 1, 'SRC-79': 1, 'SRC-71': 2 },
    macros: [
      { k: 'inside', label: 'INSIDE', def: 0 },    // the camera into the names
      { k: 'divide', label: 'DIVIDE', def: 0 },    // the mother cell → many
      { k: 'dir',    label: 'DIRECTION', def: 0 }  // the Passage: 0 = down
    ],
    bloom: 0.46,
    music: { bpm: 50, root: 45, mode: 'aeolian', chordBars: 4,
             chords: [[0, 7, 14, 19, 24], [0, 8, 15, 19, 26], [0, 5, 12, 17, 21], [0, 7, 11, 14, 23]],
             chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am(maj7)9'] },
    desc: 'Act two. The camera goes down: THE PASSAGE at DIRECTION zero, the same stars falling upward past you into the depths. THE NAMES is the single cell, nineteen thousand on one even shell; INSIDE takes you into it. THE QR is a fader for the sending: think of someone, take out your phone, point it here. And after the names are sent, in the music, DIVIDE: the mother cell becomes two, four, eight, sixteen. Never pull attention while people are on their phones; the multiplying is for the music after.',
    interact: SRC + FAD + MACS + 'INSIDE is macro A, DIVIDE is macro B, DIRECTION is macro C (leave it down).',
    sound: 'A aeolian at 50, four bars a chord, denser and lower than act one. The shell drone opens as the names spread and beats harder as they divide.'
  });

  MIX.make({
    id: 'SRC-75', part: 'III', title: 'BoT 0.2 · III · The Witnesses', tech: 'THREE LAYERS / F AEOLIAN 68',
    layers: ['SRC-60', 'SRC-61', 'SRC-71'],
    cost: { 'SRC-60': 3, 'SRC-61': 1, 'SRC-71': 2 },
    macros: [],
    bloom: 0.42,
    music: { bpm: 68, root: 41, mode: 'aeolian', chordBars: 4,
             chords: [[0, 7, 12, 19, 24], [0, 8, 15, 20, 27], [0, 10, 14, 19, 26], [0, 7, 12, 19]],
             chordNames: ['F5', 'D♭maj7♯11/F', 'E♭6/9/F', 'F5'] },
    desc: 'Act three, the refresh: colour and shape change, the tempo comes up, the room is pulled back in. The spiral radar in the Witnesses\' metals — aluminium, brass, copper, bronze — and the blip of where the carrier is right now are the build still to come (SRC-76). Until they land, this act hosts ASCENSION for the toast and the last song, THE POINT, RETURNED to close the loop, and THE CIRCLE. The poems ride over everything on GO; the twelfth is silence: BLACKOUT.',
    interact: SRC + FAD + MACS + 'No macros yet in this act; the radar brings its own.',
    sound: 'F aeolian at 68 — the key of the first act, faster: an encore, not a coda.'
  });
})();
