# The Source law

**Edson, Sep 24 2026.** A general rule for how a scene answers the hands, and a
suggestion for the library. Applied across the BIRTH OF A TEMPLE set (SRC-56…61).

---

> ## THE SOURCE IS A CONCENTRATION AND RELEASE DEVICE, IN TWO LAYERS.
>
> Both hands **at** the Source — 0,0 — is **zero**: every scene at its smallest,
> slowest, quietest form.
> Opening one hand releases one layer. Opening the other releases the second.
> **Both hands wide is the most the scene can ever be.**

**Distance is power.** You do not push the picture by leaning in; you let it go by
opening your arms.

## Why

**The gesture and the image agree.** A thing held close is small; a thing released
is vast. That is true of a held breath, a clenched hand, a coal — and it means the
player has *one physical idea* to perform instead of two arbitrary mappings to
remember. A stranger walking up understands it in the first second without being
told, which is the only test that matters.

It also gives the set one shape. Six scenes that all bloom outward from nothing
read as one instrument played six ways, rather than six scenes with their own
conventions.

## How to obey it

`inp.L` / `inp.R` arrive **lean-in = 1** — the library's default, flipped for
everyone at the input gate. A Source-law scene reads:

```js
const x = SOURCE(inp.L);     // instead of clamp(inp.L)
```

`SOURCE` is one line in `parts/part249_source.js`. Nothing else changes.

**This is allowed, not a fight with the platform.** scene-craft law 4:
*"Intensity DIRECTION is likewise a judgement call: `inp` arrives lean-in = more,
but invert with `1 - inp` when reaching out should intensify."*

## Two consequences worth knowing

**1. `SOURCE(inp)` is the raw hand-space reading again** — 0 at the instrument, 1
at arm's length. The scene is reading **distance**, which is what the player is
actually doing. The double inversion cancels, and the code says what the body says.

**2. It resolves a hardware conflict.** Edson's AV Theremin firmware ramps to CC 0
over three seconds when a hand leaves. Under NEAR = MORE that landed the scene at
**maximum** — a surge every time he stepped away, and the reason the pose-rewind in
`part2_core` could not save it (a 3 s sweep is ten times longer than the 0.3 s the
rewind is tuned for). Under the Source law CC 0 is **zero**, so the same ramp now
reads as the scene *releasing* back to its smallest form. **The firmware and the law
were always the same idea; only the sign was wrong.**

## The resting state

With nobody there a Source-law scene sits **near its smallest form and breathes** —
concentrated, not neutral. So a stranger opening one hand is unmistakably the cause
of what happens next. `SOURCE_IDLE(t, centre, swing, rate)` is the helper; the six
use a centre around 0.20–0.24.

## Verified

Every scene in the set, both poles, measured rather than assumed:

| scene | hands AT the Source | hands WIDE |
|---|---|---|
| SRC-56 The Point | 0.02, 0.01 | 1.00, 1.00 |
| SRC-57 Eclipse | 0.01, 0.00 | 1.00, 1.00 |
| SRC-58 The Passage | 0.01, 0.01 | 1.00, 1.00 |
| SRC-59 The Names | 0.01, 0.01 | 1.00, 1.00 |
| SRC-60 Ascension | 0.01, 0.01 | 1.00, 1.00 |
| SRC-61 The Point, Returned | 0.01, 0.00 | 1.00, 1.00 |

---

## For Lance

This is offered as a **suggestion for the library**, not a change to it. Nothing in
core was touched — it is one helper in Edson's own part file and six scenes choosing
to call it.

If you like it, it probably belongs in `scene-craft` as a named option beside law 4
— *"NEAR = MORE is the default; the SOURCE LAW is the opposite and a scene may
declare it"* — so a scene can say which pole it uses and a player knows before they
put their hands up. **A set where every scene agrees is worth more than any single
scene's preference**, and that agreement is a thing only the skill file can hold.
