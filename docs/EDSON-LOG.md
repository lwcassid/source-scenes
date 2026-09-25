# Edson's work log — for Lance (and for Lance's Claude session)

**Read this cold before touching `NAV`, `AE`, `tools/build.sh` or `setlists.json`.**
Living document: appended to as work happens. Newest section at the bottom.

**Why it exists:** Edson is building his Oct 1 show — *Birth of a Temple*, Dustin
Yellin's studio — on top of this library, under a hard deadline. Everything here
is additive by design, but some of it wraps your objects at runtime, and a couple
of decisions are ones you may want to adopt, reject, or do differently in core.
**Nothing here is asking permission. It is telling you where to look.**

---

## 1 · What changed in YOUR files — the whole list

```
setlists.json   +21   one set appended: "BIRTH OF A TEMPLE"
tools/build.sh  +11   eleven cat lines
```

**32 insertions, 0 deletions, 0 modifications.** Your four set lists are untouched
and `RUN OF SHOW` is still `default: true`.

**No core file touched**: `part1_head.html`, `part2*.js`, `part5_tail.js`,
`part15_history.js`, and nothing else in `tools/`.

**Verified after every change**: a sample of 17 of your scenes across every
rendering stack and owner (SRC-28/38/15/42/09/34/16/13/44/49/43.11/18.16/51–55)
opens, renders light to the canvas, and logs no errors. 329 scenes registered.

---

## 2 · New files (all Edson's)

| file | what |
|---|---|
| `parts/part241_owpoem.js` | **OWPOEM** — the eleven Orbital Witness poems as a shared overlay that rides over any scene |
| `parts/part242…247_*.js` | six scenes, SRC-56…61 — the visuals |
| `parts/part248_poemdeck.js` | **POEMDECK** — a QLab-style cue player for the poems |
| `parts/part249_source.js` | **SOURCE** — the polarity law, see §5 |
| `parts/part250_mixer.js` | **the mixer**, SRC-62/63/64 — see §4, the part most likely to interest you |
| `parts/part251_mixpanel.js` | the fader panel, injected into `#sidebar` |
| `docs/THE-SOURCE-LAW.md` | the law, written up |
| `parts/part260_eclipse2.js` | **SRC-66.2**, ISOTRP A · Light Eclipse V2: the light pulses gently with the line-in |
| `parts/part259_beam2.js` | **SRC-68.2**, ISOTRP C · Beam V2: the right hand unlocks Gated's elements past 50% and Trails past 70% |
| `parts/part257_isotrp.js` | **ISO** + four study scenes SRC-66…69 (after 404.zero's ISOTRP): a shared GLSL light-field renderer and a frame-exact sound/light sequencer. See the log, "ISOTRP studies" |
| `assets/poems/`, `assets/poems-en/` | 22 placeholder voice files + READMEs |
| `tools/poemshot.mjs` | shoot one poem fragment, one mode, over one scene |
| `tools/poemsync.mjs` | free-running check that the type tracks the audio clock |

**New globals**: `SOURCE`, `SOURCE_IDLE`, `OWPERF`, `OWPOEM`, `POEMDECK`, `MIX`.

---

## 3 · 🔴 Where we WRAP your objects — the bit that could surprise you

All are wrap-and-call-through. Nothing is replaced, and an unclaimed input falls
back to your behaviour unchanged. **But if you restructure any of these, look here.**

| what | where | how |
|---|---|---|
| **`NAV.onMsg`** | `part248_poemdeck.js` | the deck claims its own note range for poem cues; everything else is handed straight to your `onMsg`. Deferred in a `setTimeout(0)` because `NAV` is defined in `part5_tail.js`, which concatenates after us. Feature-detected — if `NAV` is gone it goes quiet rather than throwing. |
| **`A.out` / `A.revIn` / `A.delIn`** | `part250_mixer.js` | swapped to a layer's own gain nodes **around each layer's construction and each `tick()`**, restored in a `finally`. This is what puts a layer's voices, its `A.tone`/`A.pluck2` one-shots (which go straight to `A.out()`) and its reverb/delay sends on that layer's fader. |
| **`A.voice`** | `part250_mixer.js` | patched only while a layer's `audio()` runs, to capture the voice handle so its `group` can be re-routed onto the layer bus. **Restored to the original property in a `finally`** — an earlier version restored a *bound copy*, which would have outlived the mixer and changed the shared audio API for every scene opened afterwards. |
| **`P.hosted`** | the six layer scenes | the one place we reach into a scene's own `draw`. When true the scene skips its background fill and its debug HUD, because the mixer paints the ground once and draws one readout. Standalone it is `undefined` and nothing changes. **If `makeInstance` ever changes shape, this is the line to check.** |

---

## 4 · The mixer — the pattern worth a look

`SRC-62/63/64` are three "movement" scenes. Each **hosts two of the six visuals as
layers on faders**, so inside a movement you crossfade or blend instead of cutting.

**It is a host, not a rewrite.** A scene instance is a plain object and `PIECES`
holds every `def`, so the mixer builds sub-instances and calls **the same
`init`/`step`/`draw` the six already have**. They are untouched and still open
standalone. If the mixer is ever cut, the six are exactly as they were.

**Compositing is nearly free** because of two properties your scenes already have:
none of the six set `globalAlpha`, and everything they draw after the ground is
already `'lighter'`. So a layer draws **straight onto the shared canvas under one
`globalAlpha`** — no per-layer buffer, no extra full-frame composite.

### ⭐ The measurement you may find more useful than the mixer

Real frame rate, 1920×1200, hands wide, headless swiftshader (a pessimistic floor —
read the ratios):

| scene | fps | |
|---|---|---|
| SRC-57 Eclipse | **23** | 2,600 stroked paths |
| SRC-60 Ascension | **29** | 2,400 stroked paths |
| SRC-58 The Passage | **34** | 2,200 stroked paths |
| SRC-59 The Names | **60** | **19,000 points — into an ImageData buffer** |
| SRC-56 / SRC-61 | 57–60 | one gradient |

**Cost is DRAW CALLS, not arithmetic.** The Names does ~40× more JavaScript than any
other scene (7.8 ms/frame) and is the *cheapest* on the board, because it writes
pixels into a half-res buffer and hands over one image. Eclipse does almost no
JavaScript and is the most expensive, because it asks the rasteriser for 2,600
separate stroked paths.

**If a scene of yours is heavy, the lever is fewer paths — or the pixel-buffer
route — long before it is fewer particles.**

The mixer carries a **cost budget**: each layer declares a weight, and if more is
asked for than the frame can carry, the **quietest** layer stands down rather than
the frame rate dropping for the whole room.

---

## 5 · Decisions that might influence core

### THE SOURCE LAW — a polarity convention
Full write-up: **`docs/THE-SOURCE-LAW.md`**.

> The Source is a concentration and release device. Both hands **at** the instrument
> is **zero** — smallest, slowest. Opening a hand releases a layer. Both hands wide
> is the most the scene can be.

Edson's six all read `SOURCE(inp.X)` — i.e. `1 - inp`, which your scene-craft law 4
already permits explicitly. **Suggestion, not a request:** it may be worth naming in
`scene-craft` as a declared option beside NEAR = MORE, so a scene can say which pole
it uses and a player knows before putting their hands up. A set where every scene
agrees is worth more than any one scene's preference.

It also resolved a hardware conflict for free: Edson's theremin firmware decays to
CC 0 over 3 s on hand-exit. Under NEAR = MORE that landed a scene at **maximum**
(and `CAL.POSE_RATE`'s rewind is tuned for a 0.3 s sweep, so it could not save it).
Under the Source law CC 0 is **zero**, and the same ramp reads as release.

### 🔴 `textIsContent: true` has a consequence worth documenting
It lifts the performance-mode `fillText` no-op for the **whole scene**, not just the
content you meant to protect. Edson's scenes needed it for the poems — and every
one of their debug readouts was then going to ride onto the projection on the night.

Each of his scenes now tests performance mode itself (`OWPERF()`, defined in
`parts/part241_owpoem.js`) before drawing its HUD.
**Anyone else who sets `textIsContent` will hit this.** Might be worth a line in
`scene-craft`, or a separate opt-out for "this scene's TEXT is content but its HUD
is not".

---

## 6 · Asks — none blocking, all small

1. **`playwright-core` is not in `electron/package.json` or anywhere else**, so
   `tools/shot.mjs` and `verify.sh` cannot run on a fresh clone. It was installed
   locally with `--no-save` and driven with `CHROMIUM=/Applications/Google Chrome.app/…`.
   **A devDependency and a line in the docs would save the next person an hour.**
2. **A second bank hook on `NAV`** would be cleaner than wrapping `onMsg`. The wrap
   works, so this is a nicety.
3. **A hook on `PRE.rows()`** so an external module can contribute a SHOW CHECK row
   without wrapping. Planned use: a "Poems 11/11 verified" row.
4. **Nothing has been pushed.** The pre-push hook requires a `Round-By:` trailer and
   a matching `verify.sh` stamp on `index.html`. Tell Edson how you want the sweep
   run before this lands on `main`.

---

## Log

### 2026-09-24
- Six scenes **SRC-56…61** (Birth of a Temple set) — full-frame fields, Source law.
- **OWPOEM**: the eleven poems as large spoken fragments, not subtitles. Two-language
  facing-page mode. Clean cut, no motion, no cross-fade (Edson's call).
  Timing runs off `AE.t()` and the sample is `start()`-scheduled, so audio zero and
  fragment zero are the same instant by construction.
- **POEMDECK**: cue list, single GO, **bar-quantised launch** via `T.next(4)` with
  the pre-roll opening the dark as a visible countdown. A cue fired while one is
  speaking is ignored.
- **The Source law** applied to all six and written up.
- **The mixer**: three movements, two layers each, per-layer audio on per-layer
  faders, plus one locked INSTRUMENT fader across everything so Edson can step out
  and leave the band alone in the room.
- **Mix panel** injected into `#sidebar` after SOURCE INPUT. Inherits your fold and
  persistence for free (we inject at load; `part5_tail.js` binds after us).
- Bugs found and fixed in *our* code, noted because they are the instructive kind:
  a `_loaded` latch that closed before the AudioContext existed (eleven silent
  poems, nothing in the log); `A.voice` restored as a bound copy; layer HUDs drawing
  over the mixer's; `Intl.Segmenter` needed for Chinese and Japanese word breaks.

### 2026-09-24, late
- **The Twister module** (`part252`/`part253`): a 4×4 panel shaped like the hardware, turn
  and push per encoder, AUTO-MAP to the factory layout, per-slot LEARN.
- 🔴 **A bug worth knowing about if you ever write a MIDI learn:** the learn branch
  swallows input while armed (correct), but binding required the CC to move by 3 — and a
  slowly turned encoder moves by ONE per detent. So it could arm and never disarm, eating
  every message after it, while the page, the picture and the audio all carried on
  perfectly. It reads exactly like "the controller died". Now: any change binds, a 6 s
  timeout, Escape cancels, and the armed state is loud in the UI.
- **Encoder mode is detected, not assumed** — absolute vs relative, by counting DISTINCT
  values rather than their range. (Range alone misreads a slow absolute sweep, which
  passes through the centre one step at a time. The first version of this detector was
  worse than the bug it fixed.)
- 🔴 **`AE.tone`/`pluck2`/`bell` connect to `this.master` directly, not `this.out()`** —
  worth knowing for anyone routing a scene's audio somewhere else. Our mixer has to swap
  `A.master` as well as `A.out`/`A.revIn`/`A.delIn`, or one-shots bypass the fader.
- **`DIAG`** (`part254`): a flight recorder — fps, heap, live audio sources, MIDI msgs/sec,
  sampled 1 Hz into localStorage, plus a persistent error trap and a stall watchdog.
  `DIAG.dump()` after anything odd. Free for anyone to use.
- **Canonical copy moved** to `0000 AI/tools/av-studio/source-scenes`. `~/projects/source-scenes`
  is now the other session's clone. **Build and push from one place only** — see that
  folder's README.

### 2026-09-24, night — ISOTRP studies (SRC-66…69): a possible new layer
A learning session, not a show scene (Edson: "we will imitate as close as we can so
we can learn how to build things like that on our platform"). The reference was a
30 s phone clip of 404.zero's *ISOTRP* at MUTEK.JP 2023: soft monochrome light
fields (point, disc, ring with a hot edge, a dark-cored eclipse, a pinched spindle,
a column, a full white wash) that live **one frame each**, fired by the same
sequencer as the sound. Measured on the clip: 161 of 893 frames lit; every audio
transient in the sparse passage lands on the same video frame as a flash.

**What changed in your files:** `tools/build.sh` +1 cat line. Nothing else. One new
part, `part257_isotrp.js`, holding everything below.

**Three things in it worth your eye, because each one could become core:**
1. **One shared WebGL context for a whole scene family** (`ISO.render`). Every
   instance, wall tiles included, renders through one module-level renderer onto a
   1600² canvas and copies its own corner out with `drawImage` (verified on the wall:
   all four tiles render beside the other GL tiles). Today every GL scene makes its
   own `WebGLRenderer` per tile and per open, and nothing disposes them. **Hypothesis,
   not measured:** over a long session that could approach Chrome's ~16-context
   limit, and when that happens the oldest contexts are dropped. A full-wall scroll in
   headless Chrome logged no context loss, so it isn't biting today. A core
   `GL.shared()` would rule it out for every scene.
2. **A full-screen shader host.** The whole look is one fragment shader summing up
   to 8 analytic lights (`uA[8]`/`uB[8]` uniform arrays), HalfFloat ping-pong
   feedback, and a tone/tint/dither pass. It holds 60 fps at 1920×1200 on the
   Apple-silicon Mac, including full density and 1.6 s feedback trails. **A
   `reg({shader: FS, uniforms})` path in core would let a scene be 40 lines of GLSL.**
3. **Frame-exact A/V.** `ISO.clock()` reads `AudioContext.getOutputTimestamp()`, so
   it knows what the listener is hearing *now*. The audio `tick()` schedules ahead
   (lookahead 120 ms, the same pattern as Ridge Loom); `draw()` lights an event on the
   frame whose sound is at the speaker, and a one-frame event is guaranteed exactly
   one frame. `AVOFF` (12 ms) is the picture's lead for the display's own latency.
   **Re-measure it on the projectors** with a phone at 240 fps. With no audio running
   (tiles), it falls back to a wall clock and makes no sound.

**Decisions Edson made in this session that touch the group laws:**
- 🔴 **Strobes are allowed in Edson's scenes.** His words: "We must have always complete
  freedom to create." `scene-craft`'s "no full-frame strobe" is a medium law written
  for the Cave's scrim. It is not a law for his work. SRC-67/68 strobe by design and
  carry the STROBE tag. No warning card (this is a study, probably not in the ritual).
- **60 fps is the target.** If a scene cannot share the frame and hold it, it runs alone.
- 🔭 **FUTURE: this software should drive external lights and strobes.** The sequencer
  here already produces the event list (time, duration, shape, weight) that a
  DMX/Art-Net fixture or a hardware strobe would need. Only the output is missing.
  Likely shape: a `LIGHT` output beside `MOut`, fed by the same audio-clock-stamped
  events. The browser cannot open UDP, so it would go through the Electron show window
  or a small local bridge (Web MIDI → a MIDI-to-DMX box is the zero-code route).
  **Not built. Logged so the design leaves room for it.**

**If you want the medium reference in one sentence:** darkness is the default and
light is an event, which is scene-craft law 3 taken to its limit.

---

## Sep 25, 00:45 — one clone, not two

`~/projects/source-scenes` is gone (retired to the Trash). **If you were working there, your
work is not lost and you do not need to do anything except change directory.**

The only clone on this machine is now:

```
/Users/edsonpavoni/Library/CloudStorage/Dropbox/0000 AI/tools/av-studio/source-scenes
```

Before the delete: both clones were the same repo at the same commit (`297a3c5`, 540 commits);
the retired one had zero commits outside `origin` and zero stashes; a full-tree diff confirmed
this copy is a strict superset. `part255_lflower.js`, `part256_lflower2.js` and
`part257_isotrp.js` are all here and registered in `tools/build.sh`, and
`scratchshots/lf_shot.mjs` and `lf_loss.mjs` were copied across.

Everything uncommitted — yours and ours — was committed to the local branch **`bot-oct1`**
(`9b5f0a6`) so nothing depends on a file sitting in a folder any more. **Nothing was pushed.**
`main` is untouched and still at `origin/main`.

Why: two clones both regenerating `index.html` is exactly the failure your `CLAUDE.md` warns
about, and it already cost us an evening — a local server left rooted at the old clone served a
49 KB-stale build, so a feature that was on disk appeared not to exist.

---

## Sep 25, 01:20 — the instrument holds its last position

**This one may matter to you, because it changes what a walk-away looks like in
our scenes and it started from a wrong assumption on our side.**

Edson wants the last position to hold: hands away, the scene stays exactly where
he left it. We went looking for what was pulling it back to zero and it was not
where we expected.

**Your core already holds.** `part2_core` parks the channel at the pose the
player left, no melt — "THE LAST POSE IS THE REST POSE", Aug 31. We measured it:
drive a channel to 0.5 with ghosts off, stop sending, and twelve seconds later
`chan.L.v` is still `0.500` in `drift`. Nothing upstream takes it away. That
behaviour is correct and we did not touch it.

**It was our own scenes letting go.** All six plus the mixer ran the same gate —

```js
const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
s.pres += (live - s.pres) * dt * 1.5;
want = SOURCE(inp.L) * s.pres + idle * (1 - s.pres);
```

— so once presence decayed the scene crossfaded off the held value onto its
breathing idle. Ours to fix, and fixed in our layer only: `SOURCE_PRES()` in
`parts/part249_source.js`, which returns 1. **No file of yours changed.**

Worth knowing if you copy that gate: pinning presence also pins everything else
`s.pres` drives — brightness, the audio gate, event arming. That is what Edson
wants in performance. A scene that should breathe when nobody is there writes
its own gate instead of calling `SOURCE_PRES()`.

## Same session — two Twister bugs that were ours, and one worth stealing

`part252_twister.js` is ours and touches nothing of yours, but two of these are
general MIDI traps:

1. **The echo guard was keyed on `ch:num` alone.** Every light message we send
   is a CC, so a *note* could never be our own echo — but the guard swallowed
   notes too. A knob PRESS arriving within 40ms of that knob's ring update was
   discarded as an echo, and the painter runs every 80ms, so roughly half of all
   presses vanished silently. It now also compares the value: an echo is the
   same byte coming back, not merely the same address.
2. **A press does not always arrive on the turn channel.** The dispatch loop did
   `if (s.ch !== ch) continue` before ever testing the push binding, so a switch
   that reports on another channel could never match. Now it is two passes —
   turns with an exact channel match, then presses matched on number and
   tolerant of shape (note on any channel, or a non-zero CC off the turn
   channel). Edson's symptom was exact: *"if I press ] the poem starts, if I
   press the knob it does not."*

**LEARN is gone from our module entirely** — Edson's call: *"this is a
Twister-only component, for other MIDI devices we can create other navs."*

Also added, and cheap: the panel now prints the **last incoming MIDI message**
and which slot claimed it (`in: CC ch1 #8 = 127 → K9`). "The knob does nothing"
has several causes and this separates them at a glance.

### 2026-09-25 — ISOTRP C · Beam V2 (SRC-68.2)
Edson liked V1 of the Beam. In V2 the right hand becomes a **key with thresholds**: 0-50% chops the beam as
before; **past 50%** Gated's random elements join (from one a bar, small, up to dense
and large); **past 70%** Trails wakes up and the **left hand** (still the width) also
sets the trail length. New part `part259_beam2.js` + one `build.sh` line.

**`part257_isotrp.js` grew three additive options.** V1 renders unchanged; SRC-68 and
SRC-69 were re-shot after the change:
- **More exports on `window.ISO`**, so later versions reuse the gen/sound/beam pieces.
- **`fbMax`**: feedback as `max(light, echo)` instead of `light + echo`. Echoes fade out of
  the brightest light and never pile up to white. Additive feedback under a strobing
  beam burned the frame white inside two seconds.
- **`direct: true` lights** skip the feedback: a second channel (`g`) in the same
  HalfFloat target. In V2 the beam and the frame-sized lights stay crisp, and only the
  shapes leave trails. **Worth knowing for any feedback scene:** decide per light what
  is remembered. Feedback on everything turns every big light into fog.

Measured: 60 fps at 1920×1200 at both hands 100% (elements + trails + chopped beam).

---

## Sep 25, 01:40 — a control with nothing behind it now says so

Opening one of the ISOTRP scenes (SRC-67) with the Twister mapped looked like
the controller had broken. It had not: **most scenes in this library have no
mixer**, so the layer faders, the solos and the instrument fader all still match
their MIDI and still report a hit, but `MIX.P()` is null and every one of them
is a no-op. From the hands, "does nothing" and "is broken" are the same thing.

So `TWIST.hasMix()`, and when it is false the panel dims every mixer-bound
control, greys AUTO-MAP with the reason, and says in one line: *no mixer in this
scene — faders, solos and VOL do nothing here. Poem cues still work.* The LEDs
were already telling this truth (`lightFor` dims a fader with no layer behind
it); the screen just was not.

**This is only our module** (`part252/253`), and it reads `MIX` through the
public `MIX.P()`. Nothing of yours changed. If you ever give a non-mixer scene
its own faders, the check is one function.

Also removed: the four family colour rows in the Twister panel. Colour is per
knob now — a swatch on each slot — and two ways to set the same thing was one
too many on a 219px rail. `TWIST.colour` and `DEFCOL` stay as the AUTO fallback.

### 2026-09-25 — ISOTRP A · Light Eclipse V2 (SRC-66.2)
Edson: "a beautiful starting point for us... make the entire thing pulse gently with the
sound it's listening to." V1's shape and hands are unchanged; the line-in drives a pulse on
two clocks (Cell Front V9's rule): the **kick** (`inp.audio.kick.n` rising edge) is the only
fast move, a swell in over ~70 ms that relaxes over about a beat; **level + bass**, eased at
~2/s, set a slow breathing body. R (the light) also sets the pulse depth. With no live
input it follows its own transport, one soft swell a beat. Measured: 60 fps; a hard kick at
full reach = +5-6% mean brightness and a slightly larger light, back to rest in ~0.7 s.

---

## Sep 25, 01:50 — NO OUT was a diagnosis, not a next step

Edson reloaded into a tab with no Web MIDI and the Twister panel read
`NO MIDI` / `NO OUT`, every control inert, TEST doing nothing. All of that was
*correct* — and useless, because the panel stated a condition without offering
the one action that fixes it, and the CONNECT that does fix it lives in another
section.

**Web MIDI permission is per page load and needs a user gesture.** A button
click IS that gesture, so the panel now spends it properly:

- the lights button reads **CONNECT** while `midi.access` is missing, and
  calling it runs your own `connectMidi()` — the same call your CONNECT button
  makes, not a reimplementation;
- **TEST** with no access connects first and then tests itself ~900ms later;
- the note says *"no MIDI yet — press CONNECT (or TEST) here. Permission is per
  page load, so a reload always needs it again."*

Worth knowing generally: **a reload always drops MIDI**, and until this the only
sign was a panel that looked broken. If the control window shows a similar dead
state after a reload, it is probably the same cause.

`tools/twtest.mjs` now covers it — 20 checks, including that CONNECT and TEST
both reach `connectMidi()`.
