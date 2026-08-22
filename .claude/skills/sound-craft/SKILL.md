---
name: sound-craft
description: Design or revise the music and sound of a SOURCE scene — the harmony engine (H) including explicit chords, transport (T), synth helpers (A), MIDI-out (MOut), the three-layer soundscape doctrine (drone / quantized / reactive), and how to turn an inspiration MIDI into a scene's harmony. Use when writing or changing a scene's audio() block or music spec, fixing how something sounds, adding groove or drums, or translating a reference track/MIDI into chords.
---

# Sound Craft — how SOURCE scenes sound

## NORTH STAR — the five listening tests
Judge every scene's sound by PLAYING it and answering honestly; each failure
names the revision work. (The experience these serve: see scene-craft's
THE EXPERIENCE section — stranger / player / room / musician.)
1. **Agency** — blindfold someone, hand them the hands: do they know within
   3 seconds that THEY are making the sound?
2. **Record** — 30 seconds of someone playing: does it stand alone as music
   you'd play at a listening bar, or is it a demo of a tech stack?
3. **Conversation** — small state: can two people talk at normal volume?
   Silence is inventory; spend it on payoffs.
4. **Sit-in** — name the empty beats and the empty frequency band where a
   guitarist fits. Can't name them = the scene is finished-sounding = fail.
5. **Arc** — does minute 9 sound different from minute 1? A loop is a
   screensaver; an instrument accumulates.

A scene's sound is one instrument with three layers. Get the layers right
and the scene jams with live musicians; get them wrong and it's a screensaver
with a backing track.

## The three-layer doctrine (Lance's law)

1. **DRONE** — a bed with genuinely good chord selection. The gold standard
   is a PEDAL: the root never moves, the chord COLOR shifts over it
   (e.g. Cm7♭13 → Cm9♭13 → Cm11 → Cm7). Extensions everywhere; never plain
   triads. Quiet triangle voices, sub root underneath.
2. **QUANTIZED** — chord changes and groove live on the grid. But percussion
   is EARNED: no beats unless the scene is in its expanded, thrown-wide
   state (gate on the interaction's commitment, fade layers in
   bell → shaker → kick, volumes scaling with the gate). Silence has room.
3. **REACTIVE** — sound amplifies the gesture, immediately: a thing willed
   into existence gets a rolled entrance; a quick flick fires a fill on the
   NEXT 16th (with ~0.6s cooldown); stillness after a phrase earns an
   answer. If it lights up it sounds; if it sounds it lights up.

## Harmony engine (H) — the API

Scene `music` spec: `{ bpm, root, mode, prog, chordBars, fx }` plus the
**explicit-chords extension**:

```js
music: {
  bpm: 100, root: 48, mode: 'aeolian', chordBars: 2,
  chords: [            // semitone offsets from root — ANY voicing
    [0, 15, 19, 20, 22],   // values > 12 keep the octave spread verbatim
    [0, 7, 8, 15, 26],     // adjacent semitones (7,8) = intentional blur
  ],
  chordNames: ['Cm7♭13', 'Cm9♭13']   // shown on HUD + music strip
}
```

- With `chords` set, the key is PINNED — auto-modulation is disabled so
  live players stay in key. `prog` defaults to the identity cycle.
- `H.chordTone(i, octShift)` — the ladder: chord tone `i % n`, stacked up
  an octave every `n` steps. With 5-note chords, 13 voices span ~2.5
  octaves automatically.
- `H.scaleTone(deg, octShift)` — melodic scale (uses `mode`), for bells /
  claves / answers that should stay diatonic.
- `H.onChord(cb)` — fires on every chord change: re-target sustained
  voices here, ring transition rolls here, reset per-chord flags here.
- `H.rootFreq(oct)` is the KEY root; for a bass that follows the chord use
  `H.chordTone(0, -1)` instead.

## Taste — learned the hard way, do not relearn

- **THE CENSUS comes first (Lance, WS V16→V17).** Before writing a scene's
  audio, table what the EYE sees (objects, events, states) against what
  the EAR will hear. Every voice must name the visible thing it IS; every
  visual protagonist must sound. Anything unmatched is decoration and
  reads as "music playing near a picture" — WS's bells had no visual body
  while the pole-form and thread-rings were silent; the fix made the form
  the melody (sky height = pitch) and the rings the harmony (tiers you
  see = voices you hear).

- **Events must never bury the bed (Lance, AV3).** If discrete notes mask
  the drone, the mix is upside down: event layers sit UNDER the bed — soft
  attacks (≥0.1s where the verb allows), gains below the pad voices — and
  surface from the hum's timbre rather than barge over it.
- **The sound is the LIGHT (Lance, AV4→AV5).** When the picture burns
  brighter the sound must be more intense: measure per-frame brightness off
  the rendered image and ride level/cutoff/edge on it continuously. And on a
  scene whose visual verb is continuous, the instrument is the continuous
  synth — scheduled hits read as bolted-on and lazy; reserve note events for
  discrete visual events (strikes, births), else contort one voice.
- **No long glides on sustained stacks.** 13 voices gliding 1.6s = jet
  taking off. Chord changes snap with ≤ 0.2s glide; the TRANSITION moment
  is marked instead by a gentle low-to-high roll (60–90ms stagger).
- **Triangle > sawtooth for beds.** Saw stacks read cheap and loud.
- **Rolled > block.** Chords and births enter low-to-high like a harp;
  block chords are for accents only.
- **No autonomous risers/sweeps.** A background sweep nobody's hands own
  reads as drift, not music (Lance cut White Study's 30s riser). Every
  continuous voice must be hand-coupled or chord-locked. But don't cut all
  the way to bone-dry: with no bed at all there is no tooth for an
  improviser to bite on (Lance, same scene, one version later) — even the
  driest scene keeps a whisper-level chord-locked pedal.
- **Quantize pitch, not weather.** A nature-driven event stream (rain,
  sparks, embers) plays on its OWN clock — grid-snapping every event turns
  rain into a machine gun, "again and again at the same speed" (Lance, Rain
  Atrium V2→V3). Keep the ladder for pitch, let timing follow the
  simulation (with a per-voice min-gap and velocity spread), and put the
  grid in the earned groove layer underneath instead.
- **Detents for integer targets (Lance, Chladni V14).** If a payoff needs a
  continuous hand to land exact values, magnetize them (cubic ease inside a
  ~0.14 window) — otherwise the only reachable targets are the rails (inp 0
  and 1) and the instrument plays like two buttons. Check payoff geometry
  in HAND-TRAVEL units, not parameter units.
- **Idle is rest, not a performance (Lance, Chladni V13→V19).** Ghost hands
  must never keep the instrument playing: scale the payoff signal by
  presence so locks/blooms can't fire for an empty room, let the SIMULATION
  relax toward rest, and tease instead of performing. And keep idle HIGHS
  DEAD: a constant high tone floor grates ("it's grating!" — three rounds to
  kill it). The idle voice is noise/texture (sand, air) plus an occasional
  BASS breath — lows carry across the playa and attract; thin highs annoy
  up close and vanish at distance. And the lure must not be a metronome
  (Chladni V21): randomize each breath's length/depth/shape/spacing/voice,
  keep a faint UNDULATING low floor between breaths (incommensurate LFOs —
  never dead, never constant), make the sound visibly move the picture,
  and land a rare "walk toward it" payoff (a deep toll, ~1 in 7). First
  real touch snaps it awake.
- **Danceability follows interaction legibility (Lance).** Beats belong
  only to scenes whose mapping is commanded within seconds (flick, stab,
  drop). If discovering what the hands do takes minutes (Weather Station's
  heading + gale), the scene can't be performed like a kit — it stays
  ambient however high its visual energy ceiling.
- **Bright major-9 cadences read "Mario power-up"** on a colorful scene.
  Minor pedal color-shift reads tasteful and badass. When in doubt, darker.
- **One voice per visual element** (a bloom = a pad voice, panned to its
  side). Willing things in literally thickens the chord.
- Bed voice gains ~0.007–0.011 each; bells 0.03–0.05; perc 0.01–0.02 × gate.
  The mix should leave a hole in the mids for live players.
- **One gesture = one statement.** Never let a physics field trigger
  per-element notes — a wave crossing 13 beads is ONE rolled run (≤ ~5
  notes, per-side cooldown), and the trigger is the HAND's motion, never
  the simulation's ringing. Element flares stay visual. (Cable Strum V2's
  per-bead rake = Lance's "5000 notes" verdict.)
- **The featured layer must be mixed ABOVE the drone.** The bed-gain range
  above is for a bed UNDER a scene; when the swell IS the instrument, ~2x it
  and trim the hum beneath, and make each voice's entrance an audible event
  (0.7s swell + an announcing tone). Cable Strum V3's crescendo was
  inaudible because six chairs at 0.0105 sat under a 0.034 hum (Lance).
- **For intensity, gate the bed — don't add events.** A tempo-synced gate/
  tremolo on the sustained strings (depth grows with commitment, 8ths before
  16ths) reads dramatic where more note-spam reads busy; stream the depth on
  CC74 so a gate/filter plugin in Live can take over the same motion.

## One-shot samples (no Ableton rigging required)

Drop the file in `assets/` AS-IS — ship the original bit depth/rate (Lance:
keep samples high quality); the browser's decoder resamples to the context
rate with a better resampler than any script-side conversion. Convert only
if the file busts the ~2MB asset budget. `fetch` + `decodeAudioData` once in
`audio()`, play
through a gain into the scene's voice group with a reverb send. The preview
builder inlines `assets/` audio so the offline harness hears it. Mirror the
moment with `MOut.sfxNote(note, vol, dur)` on ch11 so a rig can layer its own
copy. Trigger discipline: one-shots are MOMENTS — fire on a state edge
(AV7's wake: first touch after 2s stillness, re-armed only by real absence),
never on a loop, and give the moment a visual answer (AV7 flushes the glow).

## Turning an inspiration MIDI into a scene's harmony

1. `python3 tools/midi2chords.py <file.mid>` — prints every note with beat
   time, name, and duration, plus a per-bar summary.
2. Group notes by bar; read each bar's stack as semitone offsets from the
   root **keeping the octave spread verbatim** (that spread IS the voicing).
3. Steal the FEEL, not just the pitches: rolled entrance stagger, how long
   chords sustain, where melody answers in the gaps, register rise across
   the phrase.
4. Put the result in `music.chords` + `chordNames`. Done — the ladder,
   MIDI out, and HUD all follow.

## Scheduling recipe (copy, don't reinvent)

In `tick()`: horizon `A.t() + 0.15`; `while (nextT < horizon)` walk 16ths
with `step16`; `T.next(0.25)` to re-sync. Quantize EVENTS to the grid,
never the continuous hand response. Subdivision density is EARNED by
intensity (whole → 8ths → 16ths) — best as a RANKED step-fill (beats first,
then offbeat 8ths, then 16ths, e.g. bit-reversed `[0,8,4,12,2,10,6,14,…]`)
so mid-intensity is a syncopated groove and low intensity is real silence,
not a slower metronome (White Study V4). Groove patterns as arrays indexed
by `st = step16 % 16` (son-clave bell `[0,3,6,10,12]` works).

## MIDI out (MOut) — Ableton mirror

Roles → channels: lead 1 · pad 2 · bass 3 · arp 4 · bells 5 · texture 6 ·
perc 10 · sfx 11 · bed 12. **The mirror is automatic for every A helper**:
tone/bell/pluck2/bassNote/kick/hat/padVoices auto-emit; `A.hit` auto-emits
a drum note bucketed by its filter freq (<250→36, <1200→38, <4500→42,
else 46); `A.voice` groups are polled — an audible pitched voice holds a
note on the TEXTURE channel (retunes re-strike, kill closes it) and pooled
voice gain streams as texture CC74. Only pure-noise beds mirror nothing
(Rain Atrium is the one such scene — that's by design, not a bug). Write
`MOut.evNote(role, freq, vol, at, dur)` yourself only to pick a better
role than the default. `MOut.expr(role, v)` streams CC74 energy. Note-offs
are managed by MOut's pump — NEVER hand-schedule them. CC1/CC2 stream raw
hands globally.

**`rig.json` at the repo root says what instrument sits on each channel in
the actual Live set** — read it before designing a scene's sound so you
write for the rack that exists, and tell the user to update it when the
Live set changes.

## The rig is the finish (Lance, Aug 2026)

- The WebAudio helpers are the SKETCH and the offline fallback; the Live rack
  on the mirror is the finished sound. Write MIDI (role choice, velocity,
  CC74 rides) as if a quality velocity-sensitive patch will expose it.
- Reference shelf: beds like Tom Misch's looped guitar drone — rich,
  reverbed, worth improvising over. Earned drums like Fred Again / Chet
  Faker / Darkside: breaks and R&B pockets with SPACE, minimal before busy;
  Daft Punk funk only where the scene's verb is funky.
- A Live patch with its own arp/motion gets a HELD chord and lets the clock
  drive it — never for the reactive layer, whose answers stay per-note.
  Record the choice in `rig.json`. Fuller plan AND Lance's palette — the
  named sounds he improvises with (felt piano, Hand Pan, Sacred Shrine,
  Augmented Strings' gate dial, Science Class...) with per-scene casting —
  live in `docs/SOUND-DESIGN-GOALS.md` (THE PALETTE). Shop there first;
  rig.json says what each channel currently runs.

## Velocity — where "professional" lives or dies

Velocity is PER-NOTE and mirrors the browser-side `vol` of every event
(`v2v`: vol 0→28, 0.25→123). So dynamics are already yours to write — but a
constant `vol` produces machine-flat velocity, and a velocity-sensitive patch
in Live exposes it instantly. The law:

- **Derive `vol` from the gesture**, not a literal: intensity, approach
  speed, distance from center, charge time. Storm Garden (vel 29–61 with
  hand intensity) is the reference; a bell line at `vol: 0.05` forever is a
  doorbell.
- **Accents on the grid**: downbeats and pattern heads get a vol bump
  (~×1.3), off-beats sit lower. Cheap, transforms a flat arp.
- **Flat-on-purpose is a choice, not a default** — White Study's Ikeda
  clicks are MEANT to be machine-identical; say so in the scene notes.
- The mirror already varies what it owns: texture holds scale velocity with
  voice gain, pad notes with each pad voice's gain. What's left is per-scene
  `vol` writing — check your scene with the DBG monitor: if every bar of a
  role draws the same brightness, it is flat.

## Music-revision checklist

1. New feedback round = NEW VERSION part file (the versioning law applies
   to sound-only changes too).
2. Verify in the offline preview with sound on: chords cycle (watch
   `H.label`), the music strip shows the right ROWS gated on/off with the
   interaction, no page errors.
3. Listen for: drone quiet enough to talk over · transitions audible as a
   moment · zero percussion in the scene's small state · reactive sounds
   landing within one 16th of the gesture.
