# SOUNDSCAPE AUDIT — the Magnificent Nine, one by one (Aug 2026)

The working process this audit serves (Lance): audit everything → align on
each scene's plan WITH FEEDBACK before any version is built → get the draft
soundscape working as an INSTRUMENT in the browser's rough sound → only then
replace instruments with plugins in Ableton. The cheap sound is the design
proof; fidelity comes after the concept works. (Some scenes may run in
reverse — a plugin so good it drives the design — flagged where likely.)

Every entry: STATUS (how close to the agreed vision), GAPS (what the code
actually shows), PROPOSAL (awaiting Lance's feedback — nothing here is built
until a scene's plan is approved). Scenes audited at their latest versions.

Verdict at a glance: three scenes need real work (Weather Station, Ridge
Loom, Ferro Bloom's groove), two need a light touch (Lumen velocity, maybe
an Event Horizon nicety), three should be LEFT ALONE scene-side (Vespers,
White Study, Rain Atrium), and Chladni has a draft V11 awaiting ears.

---

## 1 · Chladni Court — THE TUNING (SRC-28.10, draft V11 on branch)

STATUS: V10's skeleton was right (two mode tones that beat while seeking,
sand noise from grain motion, lock ping) but pre-audit it had no pinned key,
a machine-flat block-chord lock, and no floor.
DRAFT V11 (built before we tightened the process — treat it as the
proposal, parked on the branch): D-pedal lydian cycle with names on the HUD
· lock shimmer retuned to the JUST ratio of n:m (2:3 = pure fifth — the sand
and the interval become the same fact) · lock bloom rolled low-to-high,
velocity from approach decisiveness, first discovery of a ratio rings
fullest · whisper D sub · sand motion → sfx CC74.
AWAITING: Lance's ears + feedback; revise or scrap freely.

## 2 · Lumen Film — THE SIT-IN (SRC-38.18)

STATUS: closest of the nine to its vision, already complete as a concept.
One held voice per lit burst, height = pitch, pan = position, rolled harp
entrances, glass bell doubling each commit, air bed + root pedal, no
percussion. The emptiness is the point — protect it.
GAPS: (a) every pad note goes to MIDI at hard-coded velocity 62 — a
velocity-sensitive patch will play every hole identically; (b) the burst
voice sender is hand-rolled MIDI (predates `MOut.holdOn`) — works, but
duplicated machinery.
PROPOSAL (minimal V19): derive burst velocity from the picture — burst size
and lamp pressure — and fold the sender onto `MOut.holdOn`. Nothing else.
ABLETON LATER: pad ch2 = glass/choir organ (CC74 = L), bells ch5, air on
texture ch6. Strong Omnisphere candidate.

## 3 · Ferro Bloom — THE POCKET (SRC-15.18)

STATUS: the three-layer poster child — the soft-piano Cm pedal, the
flower-power gate, births/flicks/stillness all answering. The bones are
exactly right.
GAPS (all in the earned groove): what fades in past 55% spread is a gentle
AFROBEAT — son clave, running shaker 16ths, sparse kick. Pleasant, but not
the spacious Chet Faker / neo-soul pocket we cast this scene as: 16th
shakers at full bloom are busier than the reference, the bass never moves
off the downbeat root, and the pocket is metronome-straight (no laid-back
drag).
PROPOSAL (V19, groove only — drone and reactive layers untouched): half-time
pocket — kick on 1, side-stick backbeat on 3, ghost-note hats with real
gaps instead of running 16ths, bass walking to a color tone late in every
second bar, backbeat dragged a few ms for the lazy feel, clave surviving
only as the topmost tier. THE scene for Lance's beat MIDI: drop files in
the repo and the pocket gets rebuilt from what you actually like.

## 4 · Ridge Loom — THE BAND (SRC-42.10)

STATUS: the band concept is real and working — left-hand loop counts
literally write the bass figures, three distinct leads arrive on the right,
convergence resolves a crowded frame. Biggest untapped upside of the nine.
GAPS: (a) THE BAND HAS NO DRUMMER — no percussion anywhere, so the
syncopated bass figure at 96 BPM has nothing to lock against; (b) the bass
figure has no accent/ghost map — funk lives on that contrast (velocity now
scales only with core weight); (c) everything is metronome-straight; funk
at 96 wants a touch of swing.
PROPOSAL (V11, the biggest build of the pass): earned drum section — dry,
tight, unreverbed (kick/hat/rim on ch10), gated on how many cores are up
across BOTH sides, ranked step-fill so low commitment stays sparse ·
accent map on the sixteenth bass figure (downbeat accents, ghosts between)
· optional ~55% swing on the 16ths, tied to total commitment. Daft Punk
discipline: nothing splashy, everything in the pocket.

## 5 · Weather Station — THE GLIDE (SRC-10.15)

STATUS: right skeleton (one wind body opening with the gale, heading-placed
bells), and per Lance's verdict it stays ambient — wide and cinematic, no
kit. But it has the LONGEST gap list of the nine:
GAPS: (a) the only scene left with NO explicit chords — key unpinned,
auto-progression, nothing on the HUD for a musician to trust; (b) NO
pitched bed at all — pure noise + bells, against the "even the driest scene
keeps a whisper-level chord-locked pedal" rule: an improviser has no tooth
to bite; (c) the bells are a DENSITY METRONOME — the schedule interval
steps 2 → 1 → 0.5 → 0.25 beats with gale strength, the exact
slower-metronome anti-pattern, and it grid-snaps what is narratively
weather (gusts should fire bells on their own clock, pitch staying on the
ladder); (d) the peak-chaos warm flare is visual only — the sound is the
light rule says the gale's peak needs its sonic payoff.
PROPOSAL (V16): pin a Gm pedal cycle with names on the HUD · whisper
triangle pedal + sub under the wind · bells fired per-gust on natural time
(min-gap + velocity spread), heading still picking the pitch · full gale =
filter thrown wide + a low storm rumble arriving with the visual warm
flare. No drums, ever, per the verdict.

## 6 · Attractor Vespers — THE DRONE (SRC-09.6)

STATUS: complete embodiment of the vision. One synth played by the measured
picture (brightness = intensity, sharpness = resonance, beam voice gliding
along the chord), explicit Gm chords, events-under-bed respected, no
scheduled notes. It already is the Tom Misch drone.
PROPOSAL: NO SCENE-SIDE CHANGES. Touch nothing.
ABLETON LATER: prime candidate for plugin-drives-design-in-reverse — an
Omnisphere pad on ch2 with CC74 riding the light could redefine what this
scene can be, and the browser side already streams everything needed.

## 7 · White Study — THE CLUB (SRC-34.7)

STATUS: conceptually finished. Sidechain pump, drop with manners (arm on
stillness, land on the bar, final accent), MIDI velocity tiers that survive
the v2v clamp, authored hook melody, ghost-stab idle teaching. The
machine-flat 16th clicks are flat ON PURPOSE (Ikeda) and documented as such.
PROPOSAL: NO SCENE-SIDE CHANGES. This is the dancey reference the others
get judged against.
ABLETON LATER: first scene to rack — kick ch10 + pumping bass + stab patch
make or break the club feel.

## 8 · Rain Atrium — THE COMEDOWN (SRC-16.6) — RE-AUDITED ON THE RACK (Lance, Aug 2026)

The W1 racking session put a real felt piano on lead, and Lance's verdict
overturned the "leave it": busy, piano chaotic/unmelodic, bass static,
groove sleepy, no room for a musician. The re-audit traces each to code:
(a) PITCH IS DICE — each drop-note's degree comes from its random x
position across ~7 ladder rungs at up to ~2.7 notes/s (0.22s global gap);
the soft browser sketch hid the randomness, a real piano exposes every
note as a melodic statement, so random reads as chaos and fills the
sit-in space; (b) BASS GAPS — downpour bass sustains 1.6s of a 3.75s bar
(64 BPM), so the pedal sounds broken, and the placeholder sine has no
character; (c) GROOVE — kick on 1 + quarter-note ticks at 64 BPM is
half-time-dead, the exact EH lesson (double-time feel fixed it there).
PROPOSAL V7 (awaiting Lance's verdict): drop notes draw from a small
per-chord MOTIF CELL (2-3 tones that voice-lead between chords, rare
passing tone) instead of position-dice, budget widened to one note per
~0.7s; bass legato to the bar with the color-walk kept; downpour groove
re-pocketed with double-time FEEL (ghosted 8th ticks, side-stick
backbeat) while staying sparse — comedown, not coma; REAL RAIN
RECORDINGS from Lance's library replace the synthesized patter
browser-side (two loops, light/heavy, crossfaded by wetness, in assets/)
and rain intensity streams as sfx CC74 so Live can ride the same
recordings; thunder/petrichor/flick logic untouched.

## 9 · Event Horizon — THE FINALE (SRC-13.9)

STATUS: the finale is built and mix-lawed — the wall outweighs every
transient, gate capped at 60%, chairs announce their entrances, flicks
write their own runs (direction, register, velocity from the throw), the
swallow telegraphs, scars, and recharges.
GAPS: one, optional — the post-swallow scar/recharge state is visual only
(ember-dim rim, fewer stars); the sound-is-the-light rule suggests the
recharging bed should sound veiled/darker until the fire returns.
PROPOSAL: optional small V10 making the recharge audible (darker filter
ceiling + hum slightly hollowed while cooling). Otherwise: nothing —
straight to the Ableton phase, where pad-gate-depth on CC74 driving a
string rack's gate plugin is the marquee mapping of the whole show.

---

## Cross-cutting (applies to the whole pass)

- **Weather Station is the only unpinned key left.** After its V16, every
  scene in the set is safe for live musicians to play against.
- **Velocity doctrine compliance is good in the newer versions** (Event
  Horizon's throws, White Study's tiers, Rain's size-scaled notes) and
  weakest in Lumen's fixed-62 pads and Ridge's unaccented bass figure —
  both covered above.
- **rig.json is still all empty strings.** Not needed for the browser-draft
  phase, but it is the gate to the Ableton phase — nothing gets racked
  until the channels are described honestly.
- **Order of work** (proposal): align + build the three real jobs first
  (Weather Station V16, Ridge Loom V11, Ferro Bloom V19), then the two
  light touches (Lumen V19, EH recharge if wanted), then the Ableton phase
  starting from White Study and Vespers as the two poles.
