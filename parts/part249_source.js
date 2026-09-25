/* ---------- THE SOURCE LAW ----------
   THE SOURCE is the instrument — the two beams you play with your hands.
   (Their own word, already used throughout: "lean in toward the source",
   "park the LEFT hand at the source". This makes it the name of the rule.)

   EDSON'S LAW, Sep 24 2026:

     THE SOURCE IS A CONCENTRATION AND RELEASE DEVICE, IN TWO LAYERS.

     Both hands AT the instrument — 0,0 — is ZERO: every scene at its
     smallest, slowest, quietest form. Concentration.
     Opening one hand releases one layer. Opening the other releases the
     second. Both hands far from the instrument is the most the scene can
     ever be.

   So: DISTANCE IS POWER. You do not push the picture by leaning in, you
   let it go by opening your arms. The gesture and the image agree — a
   thing held close is small, a thing released is vast — and it gives the
   player one unmistakable physical idea to perform instead of two
   arbitrary mappings to remember.

   ---- how to obey it ----

   `inp.L` / `inp.R` arrive LEAN-IN = 1 (the library's default, flipped for
   everyone at the input gate in part2_core). Scenes that want the Source
   law read SOURCE(inp.L) instead of clamp(inp.L), and nothing else changes.

   This is explicitly allowed, not a fight with the platform. scene-craft
   law 4: "Intensity DIRECTION is likewise a judgement call: inp arrives
   lean-in = more, but invert with 1 - inp when reaching out should
   intensify."

   ---- two consequences worth knowing ----

   1. SOURCE(inp) is just the raw hand-space reading again — 0 at the
      instrument, 1 at arm's length. The scene is reading DISTANCE, which
      is what the player is actually doing.

   2. It resolves the decay conflict. Edson's firmware ramps to CC 0 over
      three seconds when a hand leaves. Under the old NEAR=MORE convention
      that landed the scene at MAXIMUM — a surge every time he stepped
      away. Under the Source law CC 0 is ZERO, so the same ramp now reads
      as the scene RELEASING back to its smallest form. The firmware and
      the law were always the same idea; only the sign was wrong.          */
(() => {
  // one line, one place — if the law ever flips, it flips here
  window.SOURCE = v => clamp(1 - clamp(v));

  /* the resting state of a Source-law scene is CONCENTRATED, not neutral:
     with nobody there it should sit near its smallest form and breathe,
     so that a stranger opening one hand is unmistakably the cause of what
     happens next. Scenes pass their own centre and swing. */
  window.SOURCE_IDLE = (t, centre, swing, rate) =>
    clamp((centre === undefined ? 0.22 : centre) +
          Math.sin(t * (rate || 0.05)) * (swing === undefined ? 0.1 : swing));
})();
