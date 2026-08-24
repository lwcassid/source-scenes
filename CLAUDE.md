# SOURCE // Interaction Library — The Cave, Burning Man 2026

An interactive audiovisual instrument wall: 42 scene families driven by two theremin
hands (L/R), WebAudio sound + MIDI OUT to Ableton, projected onto hanging
mosquito-net scrim inside the camp structure by two Panasonic PT-VMZ50
projectors (1920×1200, fed identically off one HDMI splitter).

Live site: https://source-interaction-library.netlify.app
Deploys: push to `main` → Netlify auto-deploys the repo root. `index.html` is
the site. That's the whole pipeline.

## The performance queue (what's in the show)
One mechanism, not four. Tick a scene's checkbox on the wall and it joins the
QUEUE; the queue's ORDER is the running order; SHOWTIME walks exactly that.
The old stars / TOP-12 badge / per-owner tags are gone — they were three
competing answers to "what do we play", and the one the show actually read
was the empty one. Queue persists per-browser (`srcQueue`) and shares as a
`#set=a,b,c` link. Default library sort is MOST WORKED ON: recency (highest
PIECES index in a family — new versions append to the build) weighted 0.55
against version count on a log curve at 0.45, so scenes people are actively
loving float and never-revised v1s sink.

Each queued scene carries SHOW SETTINGS, edited inline in the drawer (which
closes on outside click / ✕): MIN = minutes on stage before SHOWTIME
auto-advances (default 10), OUT = per-scene sound routing (web / both / midi;
blank follows the global OUT toggle — applied transiently on scene open via
`MOut.applyMode`, restored on close). Settings save themselves per-browser
(`srcQueueCfg`) and ride inside COPY FOR REPO.

SHARED SETS live in `setlists.json` at the repo root — committed, so git is
the coordination mechanism (diff = history of what the show became, merge
conflict = a real conversation about the set). A scenes[] entry is a bare id
or `{"id":"SRC-15","min":6,"out":"midi"}`. `tools/build.sh` BAKES it into
index.html, which is what carries the running order onto the offline show
artifact; a fetch would die the moment the laptop leaves the internet. A
browser with no queue of its own loads the set flagged `default: true`, so a
fresh show laptop opens with the real set instead of 43 scenes by SRC number.
COPY FOR REPO in the drawer emits the block to paste in (or hand to a Claude
session). Editing setlists.json requires a rebuild — the build fails loudly if
the JSON is malformed.

SHOW CHECK (queue drawer) is the pre-flight, in two tiers: THE SHOW (sound /
set list / display / hands — what a newbie must get right on any laptop) and
THE RIG (calibration / Ableton / tempo — only when hardware or Live is in the
loop), each row reporting what it found with an inline fix. PLAY forces
performance mode (panels off), the FLAT view (never the scrim 3D or ghost
rehearsal views), pins the projector frame, and fullscreens onto the display
chosen via Chrome's Window Management API — defaulting to the external
screen, amber if aimed at the laptop. Red rows divert PLAY into the check.
One tab = one picture: choosing a display moves the SHOW, it does not add a
control window.

## Owners (coordination only — no longer shown in the UI)
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
- `part15_history.js` + `part5_tail.js` — version pills, library rail,
  performance queue, SHOWTIME mode, debug strip. Tail ALWAYS concatenates last.

### The shell law: ONE LEFT COLUMN, both views
The library and the scene view share the same left column (`--rail`, 248px,
`.sgroup` markup): the library's `#librail` and the focus overlay's `#sidebar`
carry the SAME groups in the same order — SOURCE INPUT and MUSIC are literally
identical, and BOTH source widgets are playable (drag the beams on the wall's
rail widget and the whole wall answers) — so a control you learn on the wall
is where you left it once a scene is open. INFORMATION lives in that column
too, NEXT TO WHAT IT DESCRIBES: the experience summary (`desc`) heads the
sidebar clamped (`MORE` expands), the interaction paradigm (`interact`) folds
under SOURCE INPUT, the Ableton build notes (`sound`) fold under MUSIC, and
HISTORY closes the column — every version with WHO · date · time and the
round summary (SCENELOG, mined from git by `tools/scenelog.py` at build
time), a ▸ expander holding the full round story (commit body, hash, git
author, Claude session link), click-through to open any version. WHO is
evidence, never a guess: the `Round-By:` trailer > a human git author > a
CREDITS correction in scenelog.py; a version without evidence shows no name
(the keeper appears only in the header, labeled "kept by"). GHOSTS exists in both views: the library
toggle drives the wall's ambient drift, the sidebar's drives ghost hands on
the focused scene (off by default — a scene starts still). Below the stage,
the console is the MUSIC WORK SURFACE: THE RIG rack (role → channel → the
instrument named in rig.json, rows lit while their lane plays, click to
remap) beside the MIDI monitor. The header is brand
+ theme + help, nothing else; the scene bar is identity + `+ QUEUE` + theme +
CLOSE, nothing else; the stage's own ⛶ is the only fullscreen control and it
hides during the show. LINK, PNG and REGEN buttons were killed as clutter —
the URL already carries `#scene=`, and `R` reseeds an open scene. A tile is a
single target: clicking anywhere on the card opens it. New chrome must earn
its place in one of these homes; a control that exists twice is a bug.

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

### electron/ — the show-runner
`electron/` wraps the built `index.html` to run the live show, purely so a
control UI can live on one screen while the show fullscreens on another — a
real Chrome limitation (cross-window `requestFullscreen` is refused), not a
missing feature. It changes NOTHING about how scenes get built, previewed,
or verified — the plain web app (Netlify, `tools/verify.sh`,
`docs/PREVIEW.md`) stays the whole dev/rehearsal path; this is only a new
way to *run* the show. Full design history: `docs/adr/0001` through `0006`
in order, and the [wayfinder map](https://github.com/lwcassid/source-scenes/issues/27)
that drove them.

**Run it**: `python3 tools/build_preview.py` from the repo root first (the
same offline, no-CDN artifact `docs/SHOW-KIT.md` already requires before any
show — `main.js` loads it specifically, not `index.html`, since `index.html`
still pulls three.js from a CDN and playa has no internet; `npm start` fails
loudly with the exact command if you skip this), then `cd electron && npm
install && npm start`. Two windows open —
**show** (owns audio + MIDI + rendering, always picture-only, fullscreens
onto whichever display SHOW CHECK picks) and **control** (the entire
existing UI, unchanged — library wall, queue, SHOW CHECK, DBG). Both load
the same `index.html`, told apart by `?role=show`/`?role=control`
(`window.ELECTRON_ROLE` in `part1_head.html` — `null`, so a no-op, in the
plain browser). The control window builds a real but silent `AudioContext`
(full graph, routed through a zero-gain node instead of `destination`) —
`AE.ensure()` no longer no-ops there, which is what makes the mirror's
transport, chord readout, MIDI monitor and RIG rack tick correctly; only
the last hop to audible output is muted. `connectMidi()` no longer no-ops
either: every caller (CONNECT, TEST, LEARN, mode-switch) still works from
the control window, because it now relays a connect REQUEST to the show
window — the sole real owner of `MIDIAccess` — instead of doing nothing.
Clicking PLAY or a tile in the control window mirrors the scene there too
(same silent audio, relayed MIDI, no port of its own) **and** tells the
show window to open the same scene and place itself on the picked display,
for real — this round trip is wired and verified end to end, not just
designed.

**What doesn't work yet**: LEARN (hand-sensor CC mapping) and MIDI-input
device picking now DO run from the control window — relayed to the show
window over `midi:learnStart` / `midi:learnResult` / `midi:setInput`, same
shape as the CONNECT/TEST relay. Calibration (SET REST / INVERT) is the
one MIDI thing still show-window-only — it needs a live raw-value stream
during an active sweep that isn't relayed; do it directly in the show
window, whose own SHOW CHECK panel is unaffected. Queue edits DO reach the
show window now (`queue:update`, pushed from `QUEUE.save()` — the choke
point every mutation already funnels through): reorder the set, drop a
scene or change a MIN/OUT and SHOWTIME follows live. Changing MIN on the
scene currently on stage re-times it keeping the minutes already served,
and cuts to the next scene at once if the new MIN is already spent.

**The show window accepts HANDS, nothing else.** It is a real, focusable OS
window that `setFullScreen()` raises to the front on PLAY, so keystrokes
aimed at the laptop land on the PROJECTORS. `V` (ghost / scrim views), `P`
(un-pin the show frame), `←`/`→` and `Escape` (both scene changes — Escape
has TWO handlers, and `part5_tail.js`'s guards on `!document.fullscreenElement`,
which native fullscreen never sets) and the edge-nav click strips are all
gated off there; `H`/PANELS already was. `W`/`S`/`↑`/`↓` still play, because
that is what the window is for. Manual next/prev moved to the control
window, which now shows the edge strips it could never display before (it
never gets `.fs`). `R` reseed and acts (keys `1`-`4`, the top-bar chips)
have ONE driver: control applies them locally and relays the same seed /
act index on, so the mirror and the wall never diverge. Still not wired:
THE RIG rack's channel remap is control-window-local only.

**MIRROR pill** (control window only, next to PANELS/DBG): toggles the
control window's own scene mirror between FULL (matches the show window's
frame rate) and THROTTLED (~20fps, the default) — on a throttled tick,
`P.def.step()`/`draw()` AND the composite pass after them (drawImage /
ghost pass / bloom / scrim render) are all skipped together, not just
step/draw, protecting the show window's real performance from the mirror's
GPU (and, since the audio graph above runs unconditionally, CPU) cost.
Resolution/downscale throttling and automatic FPS-driven throttling are
both deliberately deferred until real M1 numbers exist to justify either.

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
**VIEW dropdown on the stage** (or `V` cycles): FLAT (one projector) ·
GHOST (two-projector misregistration) · SCRIM THE CAVE 3D. The scrim view is
FULL BLEED — the room fills the whole stage at the window's own aspect (the
scene still renders offscreen in the pinned show frame that feeds the
throw); the frame views stay letterboxed. In the scrim
view YOU drive the camera — drag orbits, wheel zooms, `C` jumps vantages
(BEHIND THE SOURCE — the default: level, whole main wall in frame — /
AT THE SOURCE / AUDIENCE / HEAD-ON / OBLIQUE / OVERVIEW); the mouse belongs
to the camera there, keys still play the hands. Rig derived from Elyse's planner (duxel = 8 ft): 24×40 ft
interior, cable-hung 54″ panels on three rows 6 ft apart, projectors atop
the entrance-corner duxels ~22 ft apart — numbers in `SCRIMRIG`
(`parts/part2d_scrimview.js`). FULLSCREEN = performance mode: picture only;
the PANELS pill (or `H`) brings the MIDI/hands/console panels in for
debugging. View mode and panels choice persist across scenes and visits.

### Verify BEFORE you ship (sighted iteration)
Never ship anything you haven't SEEN — that includes the SHELL, not just
scenes. A set list, a drawer, a rail control is as checkable as a picture and
takes 30 seconds:
- `bash tools/verify.sh` is the ONE COMMAND: build, preview, wall + queue
  drawer on a fresh show laptop, and the 10-scene QA sweep. `--quick` skips
  the sweep; `--scene SRC-XX.N` adds idle/full stills of that scene. It stamps
  the index.html it rendered, and a push that changes index.html is BLOCKED
  unless that stamp matches — so unseen work cannot reach the live site.
  If a harness ERRORS, fix it; never fall back to guessing at pixels.
- underneath, if you want the pieces: `bash tools/build.sh &&
  python3 tools/build_preview.py` (~4s), then
- `node tools/shotui.mjs <prefix> --fresh` — shoots the library wall and the
  queue drawer, and prints a QUEUE VERDICT: the queue in order, resolved to
  scene titles, exiting 1 if any id resolves to no scene. `--fresh` wipes
  localStorage first, which is the ONLY way to test what a show laptop that
  has never run this build actually opens on. A typo in `setlists.json`
  fails here instead of on playa.
- then READ the png. Run `SCENE=QA node tools/playtest.js` after core changes.

For a scene, in a cloud sandbox:
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
- MIDI roles → channels: the map lives in `rig.json` (`roles[].ch`, BAKED as
  the browser's default at build time; the RIG panel is a per-browser
  override). Since Aug 2026 it follows Lance's Live set track order — perc 1
  · bass 3 · sfx 4 · lead 7 · pad 8 · texture 9 · bed 13 · bells 14 · arp 15.
  Scenes never touch channel numbers (they speak ROLE names).
  CC1/CC2 = raw hands. CC74 per channel = that
  layer's energy (map to filter cutoff in Ableton). Buffer 128. The mirror
  is AUTOMATIC for every A helper — including `A.hit` (drum note bucketed
  by filter freq) and `A.voice` (polled: audible pitched voices hold a note
  on texture ch6; pooled gain = texture CC74) — so every scene that makes
  pitched or percussive sound sends MIDI without scene-side code. What sits
  on each channel in the Live set lives in `rig.json` (hand-edited; baked
  read-only into the build as RIGDOC so THE RIG rack under the stage can
  name the actual instruments — fill in `instrument` and the UI improves).
- MIDI CLOCK goes out at 24 PPQN off the transport's own AudioContext
  timeline (`MOut.clock`), with song-position + Start on scene open and Stop
  on close — Live follows each scene's BPM instead of someone retyping it.
  Header CLOCK toggle; Live needs that port's Sync on and EXT pressed.
- Hand input is CALIBRATED, not raw (`CAL` + `midi.cal` in `part2_core.js`):
  the LEARN sweep's measured range is kept and self-widens, polarity is an
  INVERT toggle, and SET REST samples what the sensors read with nobody
  there. Presence is then "is this reading away from rest, or moving?" —
  NOT "did a message arrive", because a rangefinder streams all night.
  Uncalibrated controllers keep the old behaviour exactly.
- Mobile: bloom post-stack is gated off via `window.IS_MOBILE`; keep it that way.

## Working agreements
- EVERY SCENE-ROUND COMMIT NAMES ITS HUMAN: end the commit message with a
  `Round-By: <first name>` trailer — the person whose session/feedback round
  it is (you know who you are talking to; lwcassid@gmail.com = Lance). The
  HISTORY panel reads this trailer, and it is the ONLY reliable "who": every
  session commits as author Claude, so a round without the trailer shows no
  name. ENFORCED: the pre-push hook refuses any push whose commits add a
  parts/*.js file without the trailer (`ROUNDBY_SKIP=1` only for a genuine
  no-human case). For old rounds, corrections go in CREDITS in
  `tools/scenelog.py`, only on the person's own say-so — never inferred from
  scene ownership; versions without evidence deliberately stay blank (Lance's
  call, after inferred credits misattributed his White Study rounds).
- END EVERY ROUND WITH A CLICKABLE LINK (Lance's rule). Never hand back a
  branch name or a file path and make someone hunt. The site deep-links:
  `#scene=SRC-XX.N` opens that exact scene. In order of preference:
  1. Work merged to `main` → `https://source-interaction-library.netlify.app/#scene=SRC-XX.N`
  2. Work on a branch → open/update the PR and give BOTH the PR link and the
     Netlify deploy preview `https://deploy-preview-<PR#>--source-interaction-library.netlify.app/#scene=SRC-XX.N`
     (builds automatically when the PR opens; confirm via the Netlify MCP,
     not curl — the sandbox 403s the host).
  Merging the PR is one click for a human and puts it on the live URL.
- THE SKILLS ARE THE STUDIO NOTEBOOK. When Lance, Kasia or Nima gives a
  creative verdict in a session — a taste call, a "never do X again", a
  "this is the reference" — distill it into the relevant skill (scene-craft /
  sound-craft) IN THAT SAME SESSION, as one tight rule with the reason.
  A verdict that isn't written into a skill did not happen: the next session
  starts cold and will relearn the mistake. Skills must stay SHORT — every
  addition should earn its lines, and folding two rules into one is a
  contribution.
- Read `.claude/skills/scene-craft/SKILL.md` before building or revising any
  scene — it holds the design laws, scrim/instrument criteria, and checklists.
- Deep references live in `docs/`: instrument survey (all 35 scored),
  scrim survey, Night Circuit look-dev direction.
- Keep the site LIGHT: strip/decimate every asset (`tools/glbtool.py`,
  `tools/decimate.py`); target < ~2MB per new model.
- Verify the deploy: the sandbox's network policy BLOCKS the netlify host
  (403 on CONNECT), so `curl`ing the live site returns nothing and reads as
  "not deployed yet" when it means "never connected". Use the Netlify MCP
  instead: `get-projects` → `get-deploy-for-site`, and confirm `state: ready`
  with `commit_ref` equal to the commit you just pushed. That proves the right
  bytes shipped; it does NOT prove the page renders — do that locally, before
  pushing, with the harness above.

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
  `SCENE=QA node tools/playtest.js` before pushing — 10 deliberately
  different scenes (every rendering stack, all owners), minutes not tens of
  minutes. `SCENE=ALL` is the full sweep for release-sized changes.
