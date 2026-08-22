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

## Sonic visions — the nine (guidelines, not laws)

These are directions to grow each scene toward, drawn from what each scene
already IS — never force a scene to be something it's not. Three of the nine
have hard sonic identities that must not be violated: Lumen Film has NO
percussion by design (it is the sit-in scene), Attractor Vespers is one
continuous synth played by the light (scheduled hits are banned there), and
Rain Atrium's rain lives on natural time, never the grid. Respecting those,
the 4 dancey / 5 ambient split falls out on its own — nothing forced.

**Danceability follows interaction legibility (Lance, Aug 2026).** A scene
only earns beats if its mapping can be commanded within seconds — flick,
stab, drop. If the player needs minutes just to discover what their hands
do (Weather Station: wind heading + gale intensity), the scene cannot be
performed like a DJ set no matter how much energy the picture has. It's
ambient, however high its visual ceiling.

**THE DANCEY FOUR** (every one still opens ambient; this is the ceiling):

- **Ferro Bloom — THE POCKET** (100 BPM, Cm pedal · Chet Faker / neo-soul).
  The soft-piano Cm7♭13 drone already jams; the earned groove (clave,
  shaker, sparse kick past 55% spread) grows into a real half-time neo-soul
  pocket: side-stick, sub that moves late in the bar, log-drum call-and-
  response, everything lazy and behind the beat via velocity. Warm, spacious,
  vocal-shaped hole in the mids. First groove of the night.
- **Ridge Loom — THE BAND** (96 BPM, C♯ dorian · Daft Punk funk / Darkside).
  The scene is already a band: left hand literally writes the bassline
  (loops = notes), right hand hires three soloists. Vision: round rubbery
  Moog-ish bass, clav-like arp, and an earned drum section — tight, dry,
  syncopated, disciplined — once both sides are busy. The two-player scene:
  one runs the rhythm section, one runs the front line.
- **White Study — THE CLUB** (120 BPM, Am pedal · minimal techno). Already a
  club machine: gated grid, sidechained pumping bed, player-owned drop and
  summon. Vision: finish it as the set's peak — real kick weight, stab
  velocity, the six-chord trance-minor cycle on a serious patch. Ikeda
  severity meets the dancefloor. The mastery script is already written.
- **Event Horizon — THE FINALE** (64 BPM, Am · Darkside / Jon Hopkins). The
  crescendo is the instrument: chair-by-chair string wall, tempo gate
  deepening 8ths→16ths, taiko booms, the swallow as the night's single
  biggest moment. Dancey in the BUILD sense — the gate is the pulse, not a
  drum kit. Ends the set with everything black but one string.

**THE AMBIENT FIVE:**

- **Weather Station — THE GLIDE** (60 BPM, Gm · cinematic weather). Not a
  banger (Lance): the wind-heading/gale mapping takes time to internalize,
  so it can't be performed like a kit — it's the set's WIDE scene instead.
  One wind body opening hard with the gale, heading-placed bells ticking
  on the grid, and at full gale the intensity comes from the WEATHER —
  filter thrown open, bells densening, maybe distant storm rumble — never
  from a drum section. Big, textural, room-filling; ambient at heart.

- **Chladni Court — THE TUNING** (58 BPM, D lydian). A tuning ritual: two
  glass/bowl plate tones, granular sand-rush, tam-tam bloom on lock, the
  interval left ringing. Mastery = playing intervals through geometry
  (2:3 locks a fifth in sand and sound). No drums, ever. The overture.
- **Lumen Film — THE SIT-IN** (66 BPM, D dorian). The aperture organ: one
  held glass voice per lit burst, rolled entrances, bells on commit, no
  percussion, no rhythmic space filled — DELIBERATELY the place a live
  player solos. Mastery = voice-leading with light, breathing the chord
  like a pipe-organ crescendo. Protect its emptiness.
- **Attractor Vespers — THE DRONE** (56 BPM, Gm). The set's pure drone and
  the Tom Misch reference embodied: one synth played by the picture's
  brightness, the beam voice as slow melody, chord color drifting
  underneath. Mastery = performing swells like a bowed instrument. Never
  add beats; never add events.
- **Rain Atrium — THE COMEDOWN** (64 BPM, Dm · Darkside at 3am). Felt piano
  on a note budget, rain on natural time, and a downpour groove that leans
  bluesy — walking bass, breathing backbeat — but stays WEATHER-FIRST: rain
  with a memory of a band, never a beat scene.

## The performance arc — the order already works

Lance's running order, kept: the visual arc he chose IS a two-peak musical
set. Energy 0–10, with the sonic role each scene plays:

| # | Scene | Role | Key | BPM | Energy |
|---|---|---|---|---|---|
| 1 | Chladni Court | overture — tuning the room | D lyd | 58 | 2 |
| 2 | Lumen Film | first light — musicians sit in | D dor | 66 | 3 |
| 3 | Ferro Bloom | first groove — the pocket | Cm | 100 | 5 |
| 4 | Ridge Loom | FIRST PEAK — the band | C♯m | 96 | 7 |
| 5 | Weather Station | the glide — wide, cinematic, textural | Gm | 60 | 5 |
| 6 | Attractor Vespers | the breather — pure drone | Gm | 56 | 3 |
| 7 | White Study | SECOND PEAK — the drop | Am | 120 | 9 |
| 8 | Rain Atrium | comedown — rain at 3am | Dm | 64 | 4 |
| 9 | Event Horizon | finale — build → swallow → one string | Am | 64 | 6→10→1 |

The key map is quietly coherent and worth preserving through revisions:
D → D holds through the opening pair; C → C♯ is a half-step lift into the
funk; Weather Station → Vespers is the SAME ROOT (G), so the long glide
down from the Ridge Loom peak settles rather than channel-changes; Gm → Am
lifts into the club; Am → Dm → Am is i → iv → i, the back half resolving
home. The shape: rise to the band · a two-scene glide down through the
weather and the smoke · the big club peak · rain comedown · finale.

## The process (revised, Lance Aug 2026 — concept before fidelity)

The browser's rough sound is the DESIGN PROOF: a scene must work as an
instrument at low fidelity before any Ableton investment. The sequence:

**Phase 0 — Audit** (`docs/SOUNDSCAPE-AUDIT.md`): every scene's current
sound vs. the vision, with a proposal per scene. No building.

**Phase 1 — Align + draft, one scene at a time.** For each scene: Claude
presents the proposal → Lance gives feedback → only then a new version is
built, verified, and committed. Nothing is written before the feedback.
Goal: draft soundscapes that work as instruments in the crappy sound.

**Phase 2 — Rack the rig.** Once the drafts are aligned, the Ableton phase
begins (below). Some scenes may run in reverse — a plugin so distinctive it
drives a redesign — but that is the exception, flagged per scene.

**Racking the rig (Lance in Live, one evening).** One Live set for the
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

## THE PALETTE — Lance's toolbox (Aug 2026, from his own rig)

What Lance actually improvises with; the Ableton phase draws from here
first so the show carries his stamp. Nothing is forced into a scene — but
when a role needs a voice, shop this list before inventing one.

**Vendors installed:** Apple · Arturia (V Collection + Augmented) · Native
Instruments · Spectrasonics (Omnisphere) · Splice instruments · Valhalla
DSP · Waves · Xfer (Serum) · XLN Audio.

**The named sounds:**
- **Splice felt piano** ("the John Legend piano") — gorgeous, spacious.
  Lance has a felt-piano riff with lots of space to feed us as MIDI.
  → OBVIOUS HOME: Rain Atrium's lead IS a felt piano by design. Also the
  candidate for Chladni's lock blooms and lure toll (through Valhalla).
- **Omnisphere · Sacred Shrine** — cathedral ambient, zero tooth.
  → bed/pad material anywhere space is needed; Chladni's lydian bed.
- **Omnisphere · Hand Pan** — huge reverb but CRACKLY REAL STRIKES.
  → Chladni's plate tones: the mirror re-strikes on every retune, and a
  hand pan is literally a resonant metal plate. Poetic match.
- **Omnisphere · Space Sax** — swelling, barely-a-sax under Valhalla.
  → Lumen Film's aperture voices / Vespers' beam are the natural homes.
- **Omnisphere · Science Class** — arpeggiating synth where cutoff +
  resonance are THE performance controls.
  → any arp-channel scene: CC74 already streams exactly that energy.
  Lance pairs it with the Blade Runner rain chops.
- **Arturia Augmented Strings** — gorgeous; has a DIAL that gates the
  strings into rhythm. → EVENT HORIZON: its pad CC74 literally streams
  gate depth. Map CC74 to that dial = the marquee mapping of the show.
- **Mellotron** — the play is the octave knob (up/down a register mid-
  phrase); without knob motion it's "a cheap violin". → give the knob to
  a hand (CC1/CC2) in whichever scene adopts it.
- **Ambient FX library** — cave drips, sci-fi spaceship bass atmospheres,
  a 4-hour analog ambient synth recording. → bed ch12 scene-atmosphere
  sampler (one held note per scene) + sfx layers. The spaceship bass =
  idle attract material.
- **Drum material** — Splice techno loops, foley drum loops, an 80s
  ~100bpm Night-Rider beat with a fat simple bass synth. Loops need
  chopping to ONE-SHOTS for the MIDI kits — XLN XO is the right tool.
- **Monk/meditation vocal recordings** and **Blade Runner rain chops** —
  performance-layer material for Lance to fly in live over scenes.
- **Blade Runner PAD** (Lance, Aug 2026: "the samples that I have from
  blade runner are so sick.. I have a pad with them") — a pad he has
  already built from those samples. → OBVIOUS HOME: RAIN ATRIUM pad ch2 —
  the rain scene wears the Blade Runner rain. Cast it when the Ableton
  phase reaches SRC-16. Related: Lance also wants REAL sound in this scene
  (actual rain/thunder one-shots browser-side, AV7-wake style) — he drops
  the files in `assets/`, a session wires them; thunder is the natural
  first candidate.
- **Valhalla reverb** — the atmosphere engine, on sends everywhere.
- **Arturia classics** (Prophet, Jup, Wurli...) — deep bench; we pick
  specific patches per scene as needed (Jup/Prophet pads and fat mono
  bass are the era-correct choices for the funk/club scenes).

**Reuse principle (minimize Lance's setup work):** ONE Live set, nine
role-channel Instrument Racks shared by all scenes — a patch is chosen to
serve the whole set, scene identity comes from what MIDI each scene sends
plus CC74. Advanced trick for later, only if a scene truly needs its own
flavor: the bed channel's per-scene note (20 + SRC number) can drive a
rack CHAIN SELECTOR, auto-switching a channel's sound per scene with zero
hands. Start simple; add chains only when a scene earns it.

## Chladni Court → Ableton (the pilot rack, step by step)

1. IAC port: Track ON + Sync ON in Live's MIDI prefs; EXT pressed; page
   CLOCK toggle on. (Scene sends 58 BPM clock + start/stop.)
2. **ch6 texture — Omnisphere Hand Pan.** The two mode tones re-strike on
   every retune: each detent catch is a mallet strike, the reverb tail is
   the plate. CC74 (pooled voice energy) → Macro 1 → brightness.
3. **ch2 pad — Omnisphere Sacred Shrine.** The lydian bed + breaths.
4. **ch5 bells — Splice felt piano through Valhalla.** Lock blooms with
   their earned velocities; the 1-in-7 lure toll becomes one deep felt
   note into a cathedral. Velocity sensitivity ON — the whole point.
5. **ch3 bass — fat mono synth** (the Night-Rider bass or an Arturia
   Prophet/Jup mono patch). Lock bass + beat-mode doubling.
6. **ch10 perc — XO kit** from Splice one-shots: 36 kick · 38 crack ·
   42 click · 46 air. The rail-secret break plays this kit.
7. **ch11 sfx — granular sand**: Granulator with a real sand/rain-ish
   sample (or the cave-drips), CC74 = sand motion → volume/density.
8. **ch12 bed — Sampler with the sci-fi spaceship atmosphere** keyed to
   note 48 (20 + 28): the scene's room tone, fading with the show.
9. **ch1 lead — no notes from Chladni; CC74 = resonance.** Map it to a
   send/brightness macro so the whole mix opens as the pattern locks.
Then: update the `roles` in rig.json from "(proposed)" to what actually
got loaded, in the same breath. OUT toggle → BOTH while A/B-ing the
browser sketch against the rack, → MIDI when Live wins.

## Unlock modes — easter eggs for Source masters (Lance, Aug 2026)

Some scenes hide a SECRET GESTURE that unlocks a beat window: a specific
hold or move, sustained ~5s, with a visible charge (the picture tightens /
shifts color), opening ~45s of groove to jam over — then it must be re-lit.
Never announced in the UI until the player is already doing it. Strangers
may stumble into it; performers know it cold. First one: Chladni's RAIL
SECRET (hold either hand at its extreme; sand bunches, goes blue, a broken
116-feel beat unlocks). The pattern can spread to other scenes with
different gestures — each scene's secret should grow out of its own
interaction, one per scene at most.

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
