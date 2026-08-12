---
name: sound-craft
description: Design or revise the music and sound of a SOURCE scene — the harmony engine (H) including explicit chords, transport (T), synth helpers (A), MIDI-out (MOut), the three-layer soundscape doctrine (drone / quantized / reactive), and how to turn an inspiration MIDI into a scene's harmony. Use when writing or changing a scene's audio() block or music spec, fixing how something sounds, adding groove or drums, or translating a reference track/MIDI into chords.
---

# Sound Craft — how SOURCE scenes sound

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

- **No long glides on sustained stacks.** 13 voices gliding 1.6s = jet
  taking off. Chord changes snap with ≤ 0.2s glide; the TRANSITION moment
  is marked instead by a gentle low-to-high roll (60–90ms stagger).
- **Triangle > sawtooth for beds.** Saw stacks read cheap and loud.
- **Rolled > block.** Chords and births enter low-to-high like a harp;
  block chords are for accents only.
- **Bright major-9 cadences read "Mario power-up"** on a colorful scene.
  Minor pedal color-shift reads tasteful and badass. When in doubt, darker.
- **One voice per visual element** (a bloom = a pad voice, panned to its
  side). Willing things in literally thickens the chord.
- Bed voice gains ~0.007–0.011 each; bells 0.03–0.05; perc 0.01–0.02 × gate.
  The mix should leave a hole in the mids for live players.

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
intensity (whole → 8ths → 16ths). Groove patterns as arrays indexed by
`st = step16 % 16` (son-clave bell `[0,3,6,10,12]` works).

## MIDI out (MOut) — Ableton mirror

Roles → channels: lead 1 · pad 2 · bass 3 · arp 4 · bells 5 · texture 6 ·
perc 10 · sfx 11 · bed 12. Every audible event sends `MOut.evNote(role,
freq, vol, at, dur)` or `MOut.evDrum(note, vol, at)` (A.kick / A.hat
auto-mirror). `MOut.expr(role, v)` streams CC74 energy. Note-offs are
managed by MOut's pump — NEVER hand-schedule them. CC1/CC2 stream raw
hands globally.

## Music-revision checklist

1. New feedback round = NEW VERSION part file (the versioning law applies
   to sound-only changes too).
2. Verify in the offline preview with sound on: chords cycle (watch
   `H.label`), the music strip shows the right ROWS gated on/off with the
   interaction, no page errors.
3. Listen for: drone quiet enough to talk over · transitions audible as a
   moment · zero percussion in the scene's small state · reactive sounds
   landing within one 16th of the gesture.
