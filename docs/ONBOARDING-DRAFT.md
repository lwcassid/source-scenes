# SOURCE — START HERE
*Draft copy for the in-app onboarding page. Voice: a studio notebook that talks to you, not a manual. Sections are the page's scroll stops.*

---

## 0 · You have two numbers. Go.

Stand at the pedestal. Raise your hands. That's it — that's the whole
interface. Two beams read where your hands are and hand the wall two
numbers, left and right, zero to one, sixty times a second.

Everything you see in this library — forty-something scenes, hundreds of
versions — is an answer to one question: **what can light and sound do
with only those two numbers?**

Edson calls the hardware a **visual theremin**. We call it **the source**.
Same thing. The theremin is the right ancestor: an instrument you play
without touching, where the air between you and it is the string.

---

## 1 · What it's for

A dark room. A stranger walks up, moves a hand, and the room answers —
light on fabric, sound in the body — fast enough that they *know* it was
them. Every scene has to serve four people at once:

- **The stranger** — proof of agency inside one second. Sound is faster
  than sight; if the first gesture doesn't audibly answer, we lost them.
- **The player** — the instrument carries the musicianship (key, grid,
  voicing). No wrong notes exist. What's left is *intention*: timing,
  phrasing, restraint. Something to get good at.
- **The room** — most people present aren't playing. The scene is their
  atmosphere. Beautiful unattended. Quiet enough to talk over when small.
  And it makes the player look like a performer.
- **The musician who sits in** — in key, on our clock, with rhythmic and
  frequency room deliberately left *empty* for them.

The bar: **satisfying as hell to play, professional-sounding, legible from
across a room.** An instrument, not a game. A song, not a screensaver.

Where it lives: **The Cave**, Burning Man 2026 — projected onto hanging
mosquito-net scrim by two projectors. And now, **the Temple** — Edson's
performance, a band playing over it. Same instrument, two rooms.

---

## 2 · The wall, in one breath

```
hands in the air
   ↓  two sensors
MIDI CC1 · CC2            (raw, 0–127)
   ↓  calibration         (LEARN the range, SET REST with nobody there)
inp.L · inp.R  ∈ 0..1     (lean in toward the source = more)
   ↓
the scene                 step() → draw() → audio()
   ↓                ↓
light               sound  →  speakers   +  MIDI OUT → Ableton (the real rack)
   ↓
one 1920×1200 frame, cloned to both projectors, onto mesh
```

Nothing is hidden in there. There's no engine you can't read. A scene is
one JavaScript file, and the whole site is those files concatenated in
order — no bundler, no framework, no build server. Push to `main`, it's
live in a minute.

---

## 3 · A scene is one file

```js
reg({
  id: 'SRC-53.3', family: 'SRC-53', ver: 3, title: 'Orbits',
  music: { bpm: 60, root: 40, mode: 'aeolian', chords: [...] },
  init(P)              { /* make your world: P.w × P.h, P.rand() */ },
  step(P, dt, t, inp)  { /* inp.L, inp.R — move the world */ },
  draw(P, g, w, h, t)  { /* a 2D canvas (or three.js offscreen) */ },
  audio(A, P)          { /* return { tick(inp), stop() } */ }
});
```

That's the entire contract. `init` builds, `step` moves, `draw` paints,
`audio` sings. The hands arrive already calibrated and already flipped so
that **1 = intense**; you never handle polarity. Presence is a boolean
you can read; when nobody's there the wall drifts on ghost hands and your
scene should rest, not perform.

**The laws** (the ones we learned by getting them wrong):

1. **One mechanic, one second.** A stranger must know what their hands
   do within a second. Every mechanic added past that killed an earlier
   version. Revisions should *subtract*.
2. **Nothing waits.** Hands couple to the picture continuously and fast.
   Quantize *events* to the beat — never the continuous response.
3. **A scene is a full-frame field.** Small objects behind unlocks are art
   concepts, not instruments. The whole picture is one thing, and the hand
   changes what it's *made of*, now.
4. **Dark mass, luminous edge.** Black is invisible on mesh. Light is a
   spend. Hue comes from the *form* (heat, age, density), never from
   screen position.
5. **Left is warm, right is violet.** Everywhere. So a body learns the wall.
6. **The sound is the light.** If it glows, it sounds. If it sounds, it
   glows. Drive the sound from the drawn thing, never a hidden number.

---

## 4 · Nothing is ever overwritten

Every round of feedback becomes a **new version** — a new file, a new
number: V1, V2, V3… The old ones stay forever, in the dropdown, playable.
So there is no way to break anything. Experiment like it's free, because
it is. "Go back to how it was" is always one sentence away.

Every version carries the name of the human whose round it was. That's the
only credit that exists here, and it's evidence, not a guess.

---

## 5 · The sound: three layers and a rack

Every scene's sound is one instrument with three layers:

- **DRONE** — a bed with genuinely good chord choices. The gold standard is
  a pedal: the root never moves, the colour shifts over it. Extensions
  everywhere, never plain triads. Quiet enough to talk over.
- **QUANTIZED** — chord changes and groove live on the grid. But beats are
  *earned*: no drums until the scene is thrown wide, and they fade in
  bell → shaker → kick.
- **REACTIVE** — sound that amplifies the gesture, now. A thing willed
  into being gets a rolled entrance. A flick fires on the next sixteenth.

The browser makes the sketch: sines, triangles, filtered noise, a reverb.
It's the score and the offline fallback. The *finished* sound is
**Ableton**: every note a scene plays is mirrored as MIDI on a role channel
— pad, bass, lead, bells, texture, perc — and a real rack answers. You
write for roles, never for channels. The first thing you do with a new
scene is a **rig walk**: seat by seat, what patch answers each role.

Two rules that matter more than the rest: **the mids stay empty** for the
musicians, and **no autonomous risers** — every continuous voice is
hand-coupled or chord-locked, or it reads as drift.

---

## 6 · The show

- **The queue** is the set. Tick a scene, it joins; its order *is* the
  running order. Each entry has MIN (minutes before it auto-advances) and
  OUT (web / both / Ableton).
- **Shared sets** live in `setlists.json`, committed, so git is how the
  camp agrees on a show. One link opens a whole set: `#set=TEMPLE`.
- **PLAY** runs the pre-flight (sound, set, display, hands, then rig,
  Ableton, tempo), goes fullscreen on the projector, and walks the order.
- **The show-runner** (Electron) splits control from picture: the show
  window owns audio, MIDI and the projectors; the control window is a
  console with the running order, a countdown and a live feed.
- **`#scene=SRC-53`** opens any scene. `#scene=SRC-53.2` pins a version.

---

## 7 · Working with Claude

The studio has one collaborator who has read everything: the laws, the
scrim rules, the sound doctrine, the history of every verdict anyone has
ever given. You don't install anything and you don't code. You **talk**:

> "Show me screenshots of Orbits as it is right now."
> "Make a new version where the stretch is slower and the far ends glow longer."
> "The kit is too busy — kick and sub, nothing else."
> "Reorder the Temple set: Orbits before Vespers."

It builds a new version, *looks at screenshots of its own work* in the
exact projector frame, iterates until the picture matches the intent,
verifies the whole wall still runs, and publishes. Your scene is on the
live site a minute later. Say who you are at the start of a session — that
is how the version gets your name.

The process rule that saves rounds: **concept, then verdict, then build.**
When a round is about sound, it'll walk you through the idea before
writing a note. If you skip that step you'll spend a round on something
you'd have killed in a sentence.

---

## 8 · Bringing your own work (the TouchDesigner door)

You have a body of work in TouchDesigner. Three doors in, from easiest to
truest:

**Door 1 — Bring the shader.** If the piece is a GLSL TOP, it's most of
the way here already. A scene can render a full-frame shader (three.js,
offscreen, then painted to the wall). Your uniforms become `uL` and `uR`.
Resolution is 1920×1200. Hand Claude the GLSL and a screenshot; it ports.

**Door 2 — Bring the idea.** For a network of CHOPs and particle ops,
describe the *mechanic* — what the input does to the picture, what the
picture is made of — plus a screen recording. It gets rebuilt natively in
the scene contract (2D canvas or three.js), and it gains the things the
wall gives for free: the harmony engine, MIDI to the rack, versions, the
queue, the projector frame.

**Door 3 — Run TouchDesigner beside it.** The source broadcasts the raw
hands as MIDI CC1 and CC2. Point TD at that port and your existing piece
plays the visual theremin *as is*, tonight. What you don't get: the wall's
sound, the queue, the offline show artifact. Good for a rehearsal; not a
way to be in the set list.

Whichever door: **the wall has physics.** Black is invisible; thin lines
vanish (fatten strokes, glow under them); perspective shatters across
hanging drapes (radial and field compositions survive; horizons don't);
the mesh eats half the light, so saturate. Whatever looks right on your
monitor is a starting point.

---

## 9 · See it before you ship it

Nothing goes on the wall unseen. One command builds the site, opens it in
a headless browser at 1920×1200, shoots the wall and the queue drawer,
runs a ten-scene sweep, and stamps the build. A push that changes the site
is refused unless that stamp matches. Claude does this on every round; if
you ever want to watch it work, ask for the stills.

---

## 10 · Your set: THE TEMPLE

Nine soundscapes for a band to play over, in an arc: the room is tuned
(Chladni Court) · the gate opens (Threshold) · the sit-in (The Commons) ·
the drone (Attractor Vespers) · orbit (Orbits) · the wall listens to the
band (Spectrum Halo) · the pulse, drummer in (Transmission) · the jam
(White Study) · ascension (Ascension).

Five of those are yours to shape — Threshold, The Commons, Orbits,
Transmission, Ascension — plus the running order itself. They were built
as a head start from what Orbital Temple is about: *the gate, one shared
sky, orbit and remaining, the message home, ascension.* Vibes, not
objects. Every round from here is yours.

**→ [Open the set](https://source-interaction-library.netlify.app/#set=TEMPLE)**

---

## 11 · House rules (short, because there are only three)

1. **Work on your own scenes.** Ask before touching someone else's.
   Adopting an unclaimed one is fair game.
2. **Say in the chat when you're publishing.** Two people pushing at once
   is a real conversation, not a merge conflict.
3. **Every verdict gets written down.** When you say "never do that again"
   or "this is the reference", it goes into the studio notebook the same
   session, so nobody relearns it. A verdict that isn't written down
   didn't happen.

---

*Now go make the wall answer you.*
