---
name: scene-craft
description: Build or revise a scene (visual+sound instrument) for the SOURCE Interaction Library — the design laws, scrim-projection rules, instrument criteria, interaction/sound conventions, and the verification checklist. Use whenever creating a new scene, making a new version of an existing scene (V2/V3/...), tuning visuals or audio, or evaluating whether a scene belongs in the installation set list.
---

# Scene Craft — how SOURCE scenes are built

## THE EXPERIENCE (why any of the rules below exist)
A dark room on playa. A stranger walks to a pedestal, moves two hands in the
air, and the room answers — light on fabric, sound in the body — instantly
enough that they KNOW it's them. Every scene serves four listeners at once:
1. **The stranger** — proof of agency inside one second. Sound is faster than
   sight; if the first gesture doesn't audibly answer, we lost them.
2. **The player** — the instrument carries the musicianship (key, grid,
   voicing); no wrong notes exist. What's left is INTENTION — timing,
   phrasing, restraint — so there is something to get good at.
3. **The room** — most people present aren't playing. The scene is their
   atmosphere: beautiful unattended, quiet enough to talk over when small,
   and it makes the player look like a performer.
4. **The musician who sits in** — in key, on our clock, with rhythmic and
   frequency room deliberately left EMPTY for them.
The bar: satisfying as fuck to play, professional-sounding, legible on mesh
scrim at night. An instrument, not a game; a song, not a screensaver.
When a rule below conflicts with this section, this section wins.

Every scene is a VISUAL + SOUND INSTRUMENT played by two theremin hands.

## The design laws (learned the hard way — don't relearn them)

1. **One mechanic, one second.** A stranger walking past must understand
   "my hands are doing THIS" within one second. Every mechanic added past that
   point killed the magic of an earlier version. Revisions should SUBTRACT.
2. **Vespers-tight coupling.** Hands couple to visuals continuously and fast
   (smoothing ≈ `dt*6`+). Nothing the hands do should wait — quantize EVENTS
   (bud/strike/note) to the grid, never the continuous response. A hand whose
   only effect lands at the NEXT grid event is illegible ("what does the left
   hand do?" — White Study V5): give every hand at least one continuous,
   immediate coupling, visible AND audible.
3. **Dark mass, luminous edge.** True black background, always. Light is a
   spend. White reserved for actual light sources. Full-mesh wireframe is
   banned as a default — structure exposure is an EVENT (beats, transitions).
   Same for color floods: a full-canvas invert/tint is TOO EXTREME (Lance, on
   White Study's pink flip) — confine the treatment to a bounded window,
   bar-lock it, and telegraph it a beat ahead. And hue must come from the
   FORM — a structural field (density band, freshness) — never from screen
   position: a spatial gradient reads as a filter laid over the picture
   (AV5's left-right split → AV6's organism palette, Lance). And when a
   player EARNS a way to summon a beloved autonomous event, keep the event
   visiting uninvited now and then anyway — ownership is priority, not
   exclusivity ("what happened to the pink accents?" — Lance, WS V7→V8).
4. **The side law.** Left hand = warm orange country, right = violet, in
   every scene. Intensity DIRECTION, though, is a judgement call, not a law
   (Lance): `inp` arrives reach-outward = more (sphere = 0), but map
   whichever polarity feels most natural for how the visuals move — invert
   with `1 - inp` when approaching the source should intensify. The real
   law is the FIELD EDGE: the boundary where tracking appears/disappears
   must be a gentle state, never a cliff — a hand entering mid-field must
   not slam the scene to max, a hand drifting out must not cut off at peak.
   If a mapping parks maximum at the sensor's edge, slew entries and decay
   losses.
5. **Presence gates everything.** `chan.X.mode === 'live'` → smooth `s.pres`.
   Idle = ambient tease that hints the interaction without giving it away;
   abandoned scenes drift back to rest states. But NEVER yank the
   instrument back: a hand held still reads as absence to the tracker, so
   hold the player's last pose and drift to rest only after real absence —
   above all inside an unlocked payoff window (Lance, EH V13).
6. **Bar-quantized structure.** Count changes, buds, entrances land on the
   downbeat (Schmitt thresholds + the audio tick commits at `st === 0`).
   Anticipation beats surprise: telegraph the downbeat (pre-glow the next gate).
7. **Integration must be visible (Lance, AV2→AV3).** Drive sound from the
   drawn thing itself, never from a hidden measurement (a Lyapunov exponent,
   an occupancy stat) — a mapping the player can't see reads as random. AV3's
   fix is the pattern: the same orbit that draws the figure plays the notes.
   Corollary: no hand position may read as dead — turn collapse states into
   designed payoffs IN THE SCENE'S OWN MARK LANGUAGE, or curate them out of
   reach. Intensify the native marks (halo the dust); never swap in a
   different sprite (AV3's lantern orbs lost the dust's elegance — Lance).

8. **A gradient wash is ONE FILL, never a fan of strokes.** Light bleeding
   off a shape = a single continuous gradient fill anchored to the shape's
   edge; N discrete gradient strokes read as a bar chart (Cable Strum V1's
   curtain — Lance's verdict). Gate echo/trail treatments by motion, so the
   resting state stays one clean object and the treatment never muddies it.

## Scrim rules (the projection surface is mosquito-net mesh)
Black is invisible — only light exists, floating in the room. Thin lines and
fine detail VANISH (fatten strokes 3×; band/ring width ≥ ~8px at 1080p).
Perspective/camera scenes shatter across segmented drapes — no horizons, no
roads; radial and field compositions survive slicing. Slow-to-medium motion;
the fabric punishes velocity. Two projectors overlap → bright elements get
depth-echoed: fields, swarms, rings benefit; text and frames die. Saturated
hues; mesh eats ~half the light.

## The frame is 1920×1200 (16:10) — compose for THAT
The show is ONE WUXGA render, fullscreen, cloned to both PT-VMZ50s off the
splitter: the scene is handed `P.w=1920, P.h=1200`, aspect **1.60**, and
`areaScale(P) = 4.56`. A browser window is nothing like it — windowed, the
stage is a ~1280×400 letterbox strip (aspect 3.2, areaScale 2.1), so a scene
tuned there is composed in a frame it will never play in and at HALF the
density it gets live. Two consequences:
- **The projector frame is the default.** The focus stage and the tile
  thumbnails render 16:10 everywhere (stage = exactly 1920×1200, letterboxed
  into the window); the harnesses (`tools/shot.mjs`, `tools/playtest.js`)
  shoot that frame. `?win` or `P` on the stage opts out when you want a
  native-window canvas. The DBG strip's `FRAME` line tells you what you've
  got — `1920×1200 · 1.60 · PROJ` is the show.
- **Write geometry that reflows**: fractions of `w`/`h`, `Math.min(w,h)` for
  radii, `areaScale(P)` for counts. Never hardcode pixel sizes or element
  counts tuned to one window, and never let a composition depend on a wide
  strip (a horizon band 400px tall reads as a stripe at 1200).

## Instrument criteria (score every scene 1–5 before and after work)
IMM immediacy (gesture→sound NOW) · EXP expressive range (two hands mean
different things; pitch/density/timbre to command) · JAM jam-ability (in key,
on grid, leaves rhythmic+frequency room for live players; stable voices) ·
SAT satisfaction/skill curve (juicy payoff + something to master) ·
SCR scrim (rules above). `docs/INSTRUMENT-SURVEY.md` scores all 35.

## Sound conventions
- Use `H` for ALL pitches (`H.chordTone(deg, oct)`, `H.rootFreq`) — never raw
  frequencies; re-glide voices in `H.onChord(...)`. Stay on the chord ladder
  and any cascade stays musical.
- Grid: schedule inside `tick()` with `nextT`/`step16` horizon ≈ `A.t()+0.15`
  (copy an existing scene's loop). Subdivisions step with intensity:
  whole → 8ths → 16ths are EARNED, not defaulted.
- Roles → `MOut.evNote(role, freq, vol, at, dur)` on every musical event so
  Ableton mirrors the browser. `MOut.expr(role, v)` streams CC74 energy.
  Note-offs are managed by MOut's pump — never hand-schedule them.
- Sound design direction: minor/modal, sub root under everything, long-tail
  reverb so single gestures bloom, silence between events (silence is what
  makes thunder work). Ableton recipe lives in `docs/SCRIM-SURVEY.md` §Sound.

## Audio-reactive scenes (a scene can LISTEN instead of playing)
`reg({audioIn: true, ...})` gets `inp.audio = {level, bass, mid, treble,
onset, pan}` from a real mic/line-in instead of (or alongside) the hands —
`AUDIOIN` (`parts/part2e_audioin.js`, ADR-0009). Cell Front V5 (SRC-43.5) is
the reference implementation; read it before building a second one.
- `level`/`bass`/`mid`/`treble` are already engine-smoothed 0..1 — don't
  re-smooth them, but DO still ease them into your own state the way `inp.L`
  gets eased (`s.bass += (audioBand - s.bass) * dt*6`), same as hands.
- `onset` is a raw, un-smoothed pulse — detect the RISING EDGE yourself
  (`onset > 0.7 && prevOnset <= 0.7`, then store `prevOnset`) for anything
  that should fire once per hit, not once per frame it stays above threshold.
- **Hands = sensitivity, not a competing value (Nima, on Cell Front V5).**
  Don't blend a hand into the audio band with `Math.max(audioBand,
  handValue)` — that was V4's choice and it broke: a hand frozen mid-value by
  the wall's ambient ghost-drift (mode `'drift'` HOLDS wherever drift last
  left it, it does NOT reset to neutral) reads as a permanent, wrong audio
  level with no way to tell it apart from a real signal. Make the hand a GAIN
  on the band instead — `sens = SENS_BASE + clamp(inp.hand) * SENS_RANGE`,
  then `target = clamp(audioBand * sens)` — so reach controls how reactive
  the scene IS, a stale hand value just leaves sensitivity near its base
  floor instead of lying about the signal, and a performer can visibly "tune"
  the picture's touchiness live without ever overriding what the mic hears.
  Silence still gets the same idle-breathing drift every other still scene
  gets (`Math.max(idle*(1-pres), clamp(audioBand*sens))`), never true
  stillness.
- **Two clocks: the kick swells, the bands size the field (Nima, Cell
  Front V9).** On techno/house every band is busy at once, so a shape whose
  size chases its own band (attack ≥ ~8/s) twitches on every note — that
  read as JITTER. `onset` is the engine's bass-rise kick detector: let its
  rising edge be the ONLY fast size move (per-element envelope, instant up,
  ~a beat down), and ease bass/mid/treble at ~1.5-2.5/s into a FIELD scale
  that sizes the whole ensemble, with each element's share bending only
  gently (±25%) toward its own band. Derive any "reform on change" flux
  from the slow bands, not the fast ones.
- **The kick is `inp.audio.kick`, not `onset` (Nima, Cell Front V11).**
  `onset` is the frame-polled FFT rise — ~60ms late and it fires on
  bassline notes. `kick = {t, strength, n}` is the engine's time-domain
  LP150 scanner: sample-accurate `t` on the audio clock (`inp.audio.now`),
  a NEW hit is `n` CHANGING (never truthiness). Apply it UNSMOOTHED (a
  per-frame multiplier on a slowly-smoothed base, never through the base's
  attack filter) and back-date the response by `now - t` (+ a display
  LEAD) so the frame is right for the vsync it lands on. Keep an
  `onset`-edge fallback for the test hook; `setAudioKick(strength)` fires
  one hit in harnesses. `node tools/kicktest.mjs` measures it — read the
  `exact` series (poll latency there is the headless frame interval).
- No sound of its own is not a requirement — a scene can listen AND still
  have an `audio()` block. Cell Front V5 just doesn't, because there was
  nothing left to say once the picture was the instrument's answer.

## Building a new version of a scene (the checklist)
1. NEW part file `parts/partNN_<scene>vN.js` — copy the previous version's
   `reg({...})`, bump `ver`, new `id: 'SRC-XX.N'`, same `family`. Never edit
   old versions. Add the file to `tools/build.sh` BEFORE `part15_history.js`.
2. Write desc/interact/sound honestly — they're the card copy and the manual.
3. Visuals: shader-on-quad (three.js ShaderMaterial) for gradient/field work;
   2D canvas for line/sprite work. If using a wrapper group + `fitIn`-style
   centering, ANIMATE THE WRAPPER, never the centered child (position offsets
   bake into the child — overwriting them teleports geometry underground).
   GOTCHA: `P.focused` is still FALSE while `init(P)` runs (focus mode sets it
   after the instance is built), so `P.focused ? big : small` in init silently
   gives every focused scene its TILE budget. Size off `areaScale(P)` instead.
4. Interaction: map hands per the laws above. HUD line in draw() showing the
   scene's state (count/spread/etc.) — it's the debug strip's best friend.
5. Sound: voices follow the visual state 1:1 (a bloom = a voice; its side =
   its pan). If a thing lights up, it should sound; if it sounds, light it up.
6. `bash tools/verify.sh --scene SRC-XX.N` — one command: build, preview,
   the wall, the QA sweep, and idle/full stills of your scene in the 1920×1200
   projector frame. Then READ the pngs. Iterate until the stills match the
   intent — assumptions about rendered output are wrong about half the time
   (fog, tonemapping, scale, and pivot bugs hide). For states beyond idle/full,
   drive `tools/shot.mjs` directly.
7. Capture a short GIF of the money interaction for the group chat.
8. Commit with the round's human named: end the message with
   `Round-By: <first name>` (you know who you are talking to). HISTORY shows
   it as the WHO, and the pre-push hook REFUSES a new part file without it —
   git says "Claude" for every session, so an untrailed round is anonymous
   forever.
9. Push. A push that touches index.html is BLOCKED unless verify.sh rendered
   that exact build — that guard exists because the harness once failed
   SILENTLY (ERR_MODULE_NOT_FOUND) and sessions shipped unseen work for weeks.
   If a harness ever errors, FIX IT; never downgrade to reasoning about what
   the pixels probably look like. Confirm the deploy with the Netlify MCP —
   curling the live site is 403'd by the sandbox and looks like "not deployed".

## Asset rules (when a scene uses GLBs)
Strip or shrink EVERYTHING (`tools/glbtool.py` strip|shrink, 512px textures);
decimate heavy scans with `tools/decimate.py` (vertex clustering — carries
vertex colors + one UV set). Target < 2MB shipped per model. Wrap loaded
models in a group after centering; animate the wrap. Skinned/animated GLBs
can't be `clone()`d — `loader.load` once per instance. Set `fog: false` on
anything meant to silhouette at distance; remember FogExp2 murders everything
past ~200 units.

## Judging your work (before calling it done)
- Would a drunk stranger get it in one second, from any angle, mid-loop?
- Does moving ONE hand produce an unmistakable, smooth, sounding response?
- Is there a reason to stay 3 minutes (a build, a discovery, a rare event)?
- Did this revision REMOVE at least as much as it added?
- Does it read at 20% brightness on a black background with fat marks?
- Press `V` (scrim view): does it survive slicing into 18″ strips, the
  two-projector double image, and the mesh eating half the light?
- Is the MIDI mirror complete (every audible event has an evNote/evDrum)?
