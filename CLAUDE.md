# SOURCE // Interaction Library — The Cave, Burning Man 2026

An interactive audiovisual instrument wall: 42 scene families driven by two theremin
hands (L/R), WebAudio sound + MIDI OUT to Ableton, projected onto hanging
mosquito-net scrim inside the camp structure by two Panasonic PT-VMZ50
projectors (1920×1200, fed identically off one HDMI splitter).

Live site: https://source-interaction-library.netlify.app
Deploys: push to `main` → Netlify auto-deploys the repo root. `index.html` is
the site. That's the whole pipeline.

## Owners
Kasia: Ferro Bloom (SRC-15), Weather Station (SRC-10), Epicycle Court (SRC-01)
Nima: White Study (SRC-34), Stones/Sonora (SRC-32), Attractor Vespers (SRC-09),
  the reference-wall set (SRC-36 Foam Bloom · SRC-37 Iris Engine · SRC-38 Lumen
  Film · SRC-39 Starling Field · SRC-40 Vortex Choir · SRC-41 Pour Cells ·
  SRC-42 Ridge Loom) — scored in `docs/INSTRUMENT-SURVEY.md` §ADDENDUM
Lance: Night Circuit (SRC-18), Storm Garden (SRC-30), Bubble Field (SRC-04)
Don't rework someone else's scene without coordinating; adopting an UNCLAIMED
scene is fair game.

## Architecture — read this before touching anything
The site is ONE html file assembled by concatenating `parts/` in a fixed order
(see `tools/build.sh`). There is no bundler and no framework. Key parts:
- `part1_head.html` — CSS, markup, CDN three.js tags, mobile + showtime styles
- `part2_core.js` — input system (chan L/R, ghosts, MIDI-in learn), tile wall,
  focus mode, drawWidget, theming
- `part2b_music.js` — transport `T`, harmony `H` (key/chords/chord ladder),
  audio helpers `A` (voice/osc/filter/pluck2/bell/kick/hat), FX buses
- `part2c_midiout.js` — `MOut`: per-role MIDI channels, managed note-offs
  (NEVER send raw timestamped note-offs — Web MIDI can't cancel them and
  retriggered pitches get strangled in Ableton; use the `_offs` pump)
- `part3..part14` — scene registrations (`reg({...})`), one per scene
- `partNN_vNN.js` — Night Circuit versions (one FILE per version)
- `part15_history.js` + `part5_tail.js` — version pills, library bar,
  favorites/set-list, SHOWTIME mode, debug strip. Tail ALWAYS concatenates last.

### The versioning law (non-negotiable)
Every feedback round on a scene = a NEW VERSION as a NEW PART FILE
(`reg` with same `family`, incremented `ver`, new id `SRC-XX.N`). Never edit an
old version's behavior; the version dropdown must preserve history. Insert the
new part before `part15_history.js` in `tools/build.sh`.

### Build & publish
```
bash tools/build.sh          # assemble + node --check → index.html
python3 tools/build_preview.py  # self-contained preview for sighted testing
git add -A && git commit -m "..." && git push   # Netlify does the rest
```

### The frame: 1920×1200, 16:10 — the DEFAULT everywhere
The show is one WUXGA render fullscreen, cloned to both projectors (Panasonic
PT-VMZ50, native 1920×1200), so a scene gets `P.w=1920, P.h=1200` (aspect
1.60, `areaScale` 4.56). The focus stage now renders exactly that frame BY
DEFAULT, letterboxed and centered in whatever window you have — black bars are
invisible on scrim — and tile thumbnails are exactly 16:10 too. So what you
see is what the wall gets; there is nothing to remember to turn on.
Opt-outs: **`?win`** in the URL (or press **`P`** on the stage) gives the old
native-window canvas; phones default to native for framerate (`?proj` forces
the show frame even there). `tools/shot.mjs`, `tools/shotcam.mjs`,
`tools/shotevt.mjs` and `tools/playtest.js` shoot the show frame (`PROJ=0`
opts out), and the DBG strip's `FRAME` line reports what the scene is
actually getting — `1920×1200 · 1.60 · PROJ` is the show.
Other projector classes: **`?frame=fhd|wxga|xga|uhd|1400x1050`** (or
`setFrame(w,h)` live) re-pins the frame and cascades through every scene.
**`V`** on the stage = SCRIM VIEW: the frame thrown into The Cave in 3D — two
converged projectors, staggered 18″ drape strips, mesh optics, double-image
parallax (`C` cycles viewpoints; rig numbers in `parts/part2d_scrimview.js`,
placeholders pending Elyse's planner layout).

### Verify BEFORE you ship (sighted iteration)
Never ship a scene you haven't SEEN. In a cloud sandbox:
- build the preview, open it in headless Chromium with
  `--enable-unsafe-swiftshader --autoplay-policy=no-user-gesture-required`,
  at viewport 1920×1200 with `?proj` (that's what the harnesses do)
- `openFocus(PIECES.findIndex(p => p.id === 'SRC-XX.N'))`
- drive hands with `setChan('L', v); setChan('R', v); focus.P.state.pres = 1`
  (re-issue every ~2s — live mode decays)
- screenshot idle / minimal / one-sided / full states; READ the screenshots.
- The CDN build reports `noGL` offline — test the PREVIEW, not index.html.

### Piece API (what `reg({...})` gets)
`init(P)` (P.state, P.w/h, P.rand), `step(P, dt, t, inp)` (inp.L/inp.R ∈ 0..1,
REACH OUTWARD = HIGHER; presence via `chan.L.mode === 'live'`),
`draw(P, g, w, h, t, inp)` (2D ctx; three.js scenes render offscreen then
`drawImage`), `audio(A, P)` returns `{tick(inp), stop()}`. Global helpers:
`clamp`, `TAU`, `areaScale(P)`, `H.chordTone(deg, oct)`, `T.beat`, `T.next()`,
`MOut.evNote/evDrum/expr`. Music cfg: `music: {bpm, root, mode, prog, chordBars}`.

## Hardware truths
- Projection surface is MESH SCRIM: black is invisible, thin lines vanish,
  perspective shatters across segmented drapes. See the scene-craft skill.
- MIDI roles → channels: lead 1, pad 2, bass 3, arp 4, bells 5, texture 6,
  perc 10, sfx 11, bed 12. CC1/CC2 = raw hands. CC74 per channel = that
  layer's energy (map to filter cutoff in Ableton). Set Live's tempo to the
  scene BPM. Buffer 128.
- Mobile: bloom post-stack is gated off via `window.IS_MOBILE`; keep it that way.

## Working agreements
- Read `.claude/skills/scene-craft/SKILL.md` before building or revising any
  scene — it holds the design laws, scrim/instrument criteria, and checklists.
- Deep references live in `docs/`: instrument survey (all 35 scored),
  scrim survey, Night Circuit look-dev direction.
- Keep the site LIGHT: strip/decimate every asset (`tools/glbtool.py`,
  `tools/decimate.py`); target < ~2MB per new model.
- Verify the deploy: after pushing, fetch the live site and confirm the new
  version registered (version pill shows it).

## Working in parallel (multiple people / sessions)
`index.html` is a BUILD ARTIFACT committed to the repo. Scene part files never
conflict (one file per version), but a stale clone that rebuilds and pushes
`index.html` will silently drop someone's newer scene from the LIVE SITE
(their part file stays safe; the deploy just lags). Rules:
1. `git pull` IMMEDIATELY before running `tools/build.sh`, every time.
2. If a push is rejected: pull, then REBUILD (`bash tools/build.sh`) and
   commit the regenerated `index.html`. NEVER hand-merge index.html — it is
   generated; regeneration IS the merge.
3. Also update `.claude/skills/sound-craft/SKILL.md` awareness: sound-only
   revisions follow the same versioning law and the same pull-build-push flow.
4. Human protocol: say in the group chat when you're publishing. If the live
   site ever looks like it lost a version, any session can fix it in one
   move: pull → build → push.

## Lanes (who touches what)
- Kasia + Nima sessions: SCENE WORK ONLY — new versions of their scenes.
  Do not modify core parts (`part1_head.html`, `part2*`, `part5_tail.js`,
  `part15_history.js`) or `tools/` without coordinating with Lance.
- Lance handles structural work (harmony engine, UI/library chrome, tools).
  Structural changes must be ADDITIVE/OPT-IN where possible (existing scenes
  keep working untouched), and after ANY core change run
  `SCENE=<id> node tools/playtest.js` against at least 2–3 scenes —
  including someone else's — before pushing.
