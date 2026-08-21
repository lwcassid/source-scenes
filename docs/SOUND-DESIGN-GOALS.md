# SOUND DESIGN GOALS — polishing the Magnificent Nine (Lance, Aug 2026)

The set: Chladni Court (SRC-28) · Lumen Film (SRC-38) · Ferro Bloom (SRC-15) ·
Ridge Loom (SRC-42) · Weather Station (SRC-10) · Attractor Vespers (SRC-09) ·
White Study (SRC-34) · Rain Atrium (SRC-16) · Event Horizon (SRC-13).

## The goal in one sentence

Every scene is a TWO-LEVEL instrument: by default it is an ambient art piece —
a sonic space with tooth, a drone you could improv over, a vibe that holds the
room with nobody touching it — and underneath that, a PERFORMABLE instrument:
someone who learns how it works can bring in beats, builds, drops, and play an
arranged set on it. The interaction is the installation; mastery is the show.

This is not a new doctrine — it is the three-layer doctrine (drone / earned
quantized / reactive, see `sound-craft`) taken seriously, with Ableton as the
sound engine that makes it actually sound expensive.

## Division of labor: browser is the sketch, Live is the finish

The "stock sounds" are pure WebAudio oscillators synthesized in
`part2b_music.js` — sines, triangles, filtered noise. No samples, no plugins.
They cannot get much higher quality and they don't need to: every one of them
ALREADY mirrors to MIDI automatically (roles → channels, per-note velocity,
CC74 energy per channel, clock). The browser sound is the score and the
offline fallback; the Live rack is the finished sound. So the process is NOT
"polish WebAudio, then recreate it in Ableton" — it is "point Ableton at the
MIDI that is already streaming, and put real patches on the channels."

Keep the browser sound working and tasteful anyway: on playa it is the
fallback when Live isn't up, and in every dev session it is the monitor.

## The reference shelf (the vibe we are aiming at)

- **Beds**: Tom Misch's looped guitar drone — one rich, reverbed pedal that
  sounds high-quality alone and invites improvisation over it. Fred Again
  builds the same way. The drone IS the product, not background.
- **Drums**: Fred Again break beats · Chet Faker · R&B pockets with a lot of
  space · Darkside (bluesy, minimal drums, vibe-first). Space beats density;
  minimal beats busy. Different drum sections / energy levels that come in
  and out — earned by the interaction, never free-running.
- **Funk**: some scenes can go Daft Punk funky — only where the scene's
  visual verb is actually funky.
- When in doubt: darker, sparser, more space for a live player to sit in.

## Ambient ↔ dancey — starting positions for the nine

To be argued with by playing them; the earned-percussion gate means every
scene still OPENS ambient — this is about how far the ceiling goes.

| Scene | Ceiling |
|---|---|
| Chladni Court | Ambient. Sand and silent lines; percussion near zero. |
| Lumen Film | Ambient. Aperture organ swells; maybe a late soft pulse. |
| Ferro Bloom | Mid. Sub wobble wants a slow, spacious R&B pocket at full bloom. |
| Ridge Loom | Mid. Loom = a groove that can weave in. |
| Weather Station | Wide. Full-commitment state can take a break beat. |
| Attractor Vespers | Ambient. Smoke; events stay under the bed (AV3 rule). |
| White Study | THE dancey one. V7 is already GATED GRID + DROP at 120 — push it toward a real break. |
| Rain Atrium | Ambient. Natural time; quantize pitch, not weather. |
| Event Horizon | Slow-build closer. The gate-depth CC74 stream is the build; one string left in the air. |

## The process (phased, back-and-forth)

**Phase 1 — Rack the rig (Lance in Live, one evening).** One Live set for the
whole show. Nine tracks matching the role channels (lead 1 · pad 2 · bass 3 ·
arp 4 · bells 5 · texture 6 · perc 10 · sfx 11 · bed 12). Each track is an
Instrument Rack with MACRO 1 mapped to the patch's brightness/cutoff and CC74
on that channel mapped to Macro 1 — then swapping patches inside the rack
never breaks the energy coupling. IAC port: Track + Sync on, EXT pressed —
the page sends 24 PPQN clock, song position, start/stop, so every scene's BPM
drives Live and any tempo-synced device (arps, delays, gates) follows.
**Fill `rig.json` in the same breath** — it is currently all empty strings,
and it is the blocker: Claude writes MIDI for the rack described there, so an
empty rig means writing for an imaginary one. Honest beats aspirational.

**Phase 2 — Two reference scenes end-to-end.** One from each pole: Lumen Film
(ambient) and White Study (dancey). Get those two sounding finished in Live —
they become the template the other seven copy. Loop: Lance swaps patches /
tweaks the rack and updates `rig.json` + says what changed → Claude revises
what the scene sends (role choices, velocity curves, CC74 rides, groove) as a
NEW VERSION per the versioning law → verify in preview, listen, repeat.

**Phase 3 — MIDI exchange.** Lance drops MIDI files in the repo (beats he
likes, his own playing, per-scene inspiration): `tools/midi2chords.py` reads
them; voicings land in `music.chords` verbatim (octave spread kept — the
spread IS the voicing), drum MIDI becomes groove arrays in the earned layer,
feel (roll stagger, sustain, where melody answers) is stolen by ear. This is
how "more Daft Punk funky" or "straight on" gets into a specific scene.

**Phase 4 — Sweep the remaining seven** against the reference templates,
one scene per round, new version each.

## Patches that play themselves (Omnisphere arps etc.)

A patch with its own arpeggiator/motion engine doesn't need note streams:
the scene sends a HELD chord on that channel and the clock drives the
patch's movement in sync. This is a per-scene, per-role choice — "send 16ths"
vs "send the chord, let the patch move" — and it should be recorded in
`rig.json`'s `use` field so scenes are written to match. Rule of thumb: the
patch's motion replaces the QUANTIZED layer's note-spam, never the REACTIVE
layer — gesture answers must stay per-note so latency stays at one 16th.

## Harmony engine, in one paragraph (how Lance works with it)

You never program it directly. A scene declares `music: { bpm, root, mode,
chords, chordNames, chordBars }` — `chords` are semitone stacks (any voicing,
octave spread preserved), and with explicit chords the KEY IS PINNED so live
musicians stay safe; the HUD shows the chord names. Scenes pull notes off the
chord ladder (`H.chordTone`) so everything — browser sound and MIDI out —
is always inside the declared harmony. Your interface to it: hand over a MIDI
file or chord names ("Cm9♭13 into Cm11, pedal on C") and it becomes the
scene's `chords`. The Tom Misch drone move is literally the doctrine's gold
standard: pedal root, color shifting on top.

## What "mastery" means concretely

The build vocabulary a practiced player can command, all of it already wired:
- **CC74 per channel** = each layer's energy → Macro 1 = the filter ride.
- **Earned drums**: percussion gates on the expanded/committed state, layers
  fade in bell → shaker → kick, ranked step-fill so mid-energy is syncopation
  and low energy is real silence.
- **Gate the bed for intensity** (Event Horizon's pattern): tempo-synced
  tremolo depth on the pad, streamed as CC74, instead of adding note-spam.
- **Drops**: White Study V7's gated-grid-and-drop is the in-house reference.
- **Silence is inventory**: the small state must stay conversational.
