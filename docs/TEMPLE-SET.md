# THE TEMPLE SET — Edson's performance

Nine soundscapes for a band to play over. Open the set on the live site with
**`#set=TEMPLE`** (the queue drawer lists it as a shared set too). Five new
scenes (SRC-51..55, now at V2) plus four recycled from the installation.
Every feedback round becomes a new version file, same as every other scene.

## What the performance is (Lance's brief, Sep 2026)

A large room, ~500 people. Edson plays the wall; a pianist, a guitarist, a
flutist and maybe a drummer play OVER it. So each scene is a **soundscape
with tooth**: it sounds finished with nobody touching it (drone, pedal,
colour moving over a root), Edson's hands add expression — visibly and
audibly — including a **crescendo** on demand, and the mids are left EMPTY
for the instruments. Subtle and high quality beat clever. Beats are not off
the table: White Study is one of the best scenes to jam on precisely because
it gives the musicians space, so the set carries a pulse scene and the
recycled club scene, and the SUMMONS works everywhere.

Success criteria, in order: fun to jam on top of · sets the vibe · looks
epic. Edson's job on the night is closer to DJing for the band — pick the
soundscape, shape it, hand it to them, switch when it's time.

## What Orbital Temple is about (so the scenes aren't literal)

Edson's [Orbital Temple](https://orbitaltemple.art/) is a 250 g satellite
with a golden dome, ten years in orbit, carrying the names of people the
participants lost. It transmits back: *"Today, at this hour, the name you
sent ascended, and there it remains."* Space as "the oldest commons we
share"; heaven's gateways reclaimed from whoever decided who they open for;
"a temple exists wherever names are spoken." The vibes we took, not the
objects: **the gate · one shared sky · orbit and remaining · the message
home · ascension.**

## The rethink (V1 → V2, after Lance's verdict)

V1 was five small objects with unlocks ("hold still two seconds", "settle a
ring on a bar line") — art concepts, not instruments; Lance: "they suck if
I'm gonna be frank … not dynamic, not expressive." The good scenes in the
library (Vespers, Ridge Loom, Lumen Film) are **full-frame fields that obey
the hand instantly and totally**, sound riding the light. V2 is that:

| Scene | The field | L | R (always the crescendo) | Rhythm |
|---|---|---|---|---|
| **Threshold** (51.2) | A curtain of light-strands that parts to a radiant field | temperature (ember → gold → blue) | how OPEN — pad level + filter = the door | none |
| **The Commons** (52.2) | A liquid sky of ~9k stars, streaking and swirling | the wind (speed, curl) | the bend: a lens grips the sky; a high held voice steps the ladder | none — the sit-in |
| **Orbits** (53.2) | Thousands of points in nested Keplerian orbits | eccentricity — every orbit stretches at once | light — count, brightness, trails; five band voices | none |
| **Transmission** (54.2) | Rings from a beacon crossing the whole frame | rate — breath → heartbeat → locked to beats/eighths | weight — sub thump → earned kit, latched 4 bars | YES — the drummer's scene |
| **Ascension** (55.2) | An updraft of sparks, ember → gold → white, remaining in a gold band | the updraft; also the rate of a perpetual-rise drone | the swell — pad, sub, band bells; kit past 70% | earned |

## The running order

| # | Scene | MIN | Role |
|---|---|---|---|
| 1 | Chladni Court (SRC-28) | 6 | tuning the room — no drums, ever |
| 2 | Threshold (SRC-51) | 8 | open the gate |
| 3 | The Commons (SRC-52) | 8 | the sit-in — flute and guitar |
| 4 | Attractor Vespers (SRC-09) | 7 | the drone — one synth played by the light |
| 5 | Orbits (SRC-53) | 8 | held voices, the far-end hang |
| 6 | Spectrum Halo (SRC-49) | 8 | LISTENS to the band (audio-in) |
| 7 | Transmission (SRC-54) | 9 | the pulse — drummer in |
| 8 | White Study (SRC-34) | 10 | the jam |
| 9 | Ascension (SRC-55) | 9 | finale |

Keys: D lyd · D dor · A aeo · G m · E aeo · (halo) · C♯ dor · A m · F m.

## Honest V2 notes (what to tune with real hands)

- All new scenes are browser-sound and rig-agnostic; every event carries a
  MIDI role but nobody has done the RIG WALK (sound-craft's process law).
  Pad washes stay browser-side; each chord change places a rolled pad chord
  on the pad channel so the rack has the harmony.
- **Threshold**: the fully-open flood is the only "all light" state in the
  set — check it on the real surface; it may want a ceiling.
- **The Commons**: the lens wanders on its own; a V3 could give its position
  to the hands' balance (L−R) if Edson wants to aim it.
- **Orbits**: the stretch rotates the whole field off-centre by design; if
  it reads as "the picture fell over", pin the periapsis direction.
- **Transmission**: rate thresholds (0.45 → beats, 0.78 → eighths) and the
  kit pattern are placeholders; a drummer should choose them.
- **Ascension**: the perpetual-rise drone is browser-only (a gliding voice
  would re-strike on the texture channel every semitone).

## Shooting them (harness polarity gotcha)

`node tools/shot.mjs SRC-5X.2 prefix "label:L:R:pres:act:ms"` takes hand
values as **reach-outward = 1**; the scenes read **lean-in = 1**. So `0`
in the harness is the scene's maximum.

```
SRC-51.2  "closed:0.6:1:1:-1:4000,half:0.5:0.5:1:-1:4000,open:0.1:0:1:-1:4000"
SRC-52.2  "wind:0.1:0.7:1:-1:6000,bend:0.5:0.05:1:-1:6000"
SRC-53.2  "circles:1:0.3:1:-1:6000,stretch:0.05:0.1:1:-1:7000"
SRC-54.2  "breath:0.9:0.8:1:-1:6000,locked:0.1:0.1:1:-1:8000"
SRC-55.2  "embers:0.9:0.8:1:-1:5000,storm:0.05:0.05:1:-1:10000"
```

## The long list behind V1 (kept for the record)

Vigil · Mandala · Harmonograph · Accretion · Totality were built and are
still there as V1s of the same families. The other nine ideas (orrery,
censer, magnetosphere, nebula nursery, galaxy arms, procession, lens, comet
rosary, lantern ascent) were rejected for overlap, weak controls (a RATE is
a weak control), or being one trick.
