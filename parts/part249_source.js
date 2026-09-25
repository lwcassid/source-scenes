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

  /* ---------- THE LAST POSITION HOLDS (Edson, Sep 25) ----------
     "This is the default mode for us. Last position always holds. If a scene
     needs something different we will build it."

     So: take your hands away and the scene stays exactly where you left it.
     50% stays 50%. No breathing back to a resting form, no fade-out, no
     surge — the picture on the wall is the last thing the hands said, until
     the hands say something else.

     WHERE THE OLD RETURN-TO-ZERO CAME FROM, because it is not where it looks.
     The core already holds: on walk-away part2_core parks the channel at the
     pose the player left and there is NO melt (Lance, Aug 31 — "THE LAST POSE
     IS THE REST POSE"). Measured Sep 25 with ghosts off: drive a channel to
     0.5, stop sending, and twelve seconds later chan.L.v is still 0.500 in
     drift. Nothing upstream takes it away.

     It was OUR scenes that let go. Every one of the six, and the mixer, ran

         const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
         s.pres += (live - s.pres) * dt * 1.5;
         want = SOURCE(inp.L) * s.pres + idle * (1 - s.pres);

     and once presence decayed the scene crossfaded off the held value onto
     its breathing idle. That gate was the whole behaviour, and it was ours.

     WHAT THIS ALSO SETTLES, which is the honest part: s.pres is not only the
     value crossfade. It dims the picture (0.55 + pres * 0.45), gates the
     audio (0.35 + pres * 0.65) and arms event firing (pres > 0.15). Pinning
     it means an empty room no longer dims or quiets the scene either. In a
     performance that is right — the work does not sulk because the player
     stepped back. Before doors, park the faders where you want the room to
     find them.

     s.pres still RAMPS from 0 on open, so a scene fades up into its first
     state instead of snapping. It simply never ramps back down.

     A scene that wants to breathe when nobody is there does not read this —
     it writes its own gate. That is the escape hatch, and it is per scene. */
  window.SOURCE_PRES = () => 1;
})();
