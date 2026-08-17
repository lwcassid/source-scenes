# Seeing your work live — preview links (no build, no merge)

You do **not** need to run anything locally or merge to `main` to see a scene
on a real URL. Netlify builds the site from `parts/` for you.

## The whole flow

1. **Make your scene a new version file** in `parts/` (e.g. `partNN_v3.js`) and
   add its line to `tools/build.sh` — same as always. See CLAUDE.md.
2. **Push your branch.**
   ```
   git add -A && git commit -m "SRC-XX V3: ..." && git push -u origin <your-branch>
   ```
3. **Open a Pull Request** on GitHub (one button). Within a minute Netlify
   posts a **Deploy Preview** link right on the PR — a full, real URL of the
   site *with your version in the dropdown*. Share that link with anyone.

That's it. Every push to the PR refreshes the same link automatically. You
never touch `index.html`; Netlify assembles it from `parts/` on its build.

## Even faster: branch URLs (optional, one-time setup)

If branch deploys are enabled for the project, every pushed branch also gets a
predictable URL with **no PR needed**:

```
https://<your-branch>--source-interaction-library.netlify.app
```

(Slashes in a branch name become dashes, e.g. `kasia/ferro-bloom` →
`kasia-ferro-bloom--source-interaction-library.netlify.app`.)

To turn this on once: Netlify → **source-interaction-library** → *Site
configuration → Build & deploy → Branches and deploy contexts* → set
**Branch deploys** to **All** (or list the branches you want). Production stays
pinned to `main`.

## Playing a scene in the browser

Open the link, pick your scene (or its version in the dropdown), and **move the
mouse left/right across the scene** to drive the two theremin hands (left half =
L hand, right half = R hand; toward the edges = reach outward). Keyboard works
too: `W`/`S` for the left hand, `↑`/`↓` for the right.

## You are seeing the REAL frame (by default)

The projectors give one 1920×1200 render, 16:10, fullscreen. The site now
shows you exactly that everywhere: the focus stage renders a true 1920×1200
canvas letterboxed into your window (same composition, same density as the
wall — the black bars are invisible on scrim anyway), and the tile thumbnails
are exactly 16:10. What you judge is what the camp sees.

- Press **`P`** while a scene is open (or add **`?win`** to the URL) if you
  ever want the old behavior — the canvas stretched to your window's own
  shape. Press `P` again to come back.
- Phones default to their native canvas for framerate; `?proj` forces the
  show frame there too.
- The DBG strip (bottom of fullscreen) prints a `FRAME` line — `1920×1200 ·
  1.60 · PROJ` is the show; anything else is a window.
- In fullscreen (⛶ SHOWTIME) on a 1920×1200 output it's pixel-for-pixel.
- Trying a different projector class? `?frame=fhd` / `?frame=wxga` /
  `?frame=1400x1050` re-pins the frame and every scene follows.

## View modes — from flat frame to The Cave

The **VIEW dropdown** on the stage bar (or `V` to cycle) picks what the
stage shows; the choice sticks across scenes and visits:

- **FLAT · 1 PROJECTOR** — the plain 1920×1200 frame (the default)
- **GHOST · 2 PROJECTORS** — the second projector's ghost overlaid
  (~0.8% misregistration, additive)
- **SCRIM · THE CAVE 3D** — the room at dusk, and you drive the camera:
  **drag orbits, wheel zooms**, **`C`** jumps vantages (AT THE SOURCE —
  the default; it's who we design for — / AUDIENCE / HEAD-ON / OBLIQUE /
  OVERVIEW). The mouse belongs to the camera here; `W/S` and `↑/↓` still
  play the hands.

The rig is derived from the camp planner (duxel = 8 ft): 24×40 ft interior,
54″ cable-hung fabric panels on three rows, 16 ft drops, projectors on top
of the entrance-corner duxels ~22 ft apart, converged on the middle row.
Still approximate: per-panel positions along each cable and the convergence
choice — all numbers in `SCRIMRIG` (`parts/part2d_scrimview.js`, feet).

**Fullscreen is performance mode**: the picture gets every pixel by default.
The **PANELS** pill (bottom-left, next to DBG) or **`H`** brings the
MIDI/hands/console panels in for debugging; the choice persists.

## Local preview (for offline / sandbox iteration)

`python3 tools/build_preview.py` bakes a single self-contained
`night-circuit-preview.html` (three.js + all models inlined) you can open with
no network. `tools/shot.mjs` / `tools/shotevt.mjs` drive it headless for
screenshots (`npm i playwright-core` first). This is what coaching/iteration
uses to check a scene without shipping it.
