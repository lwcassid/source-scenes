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

## Scrim view — the frame thrown into The Cave

Press **`V`** while a scene is open: instead of the flat frame you see it
PROJECTED — two projectors behind the source, converged on the middle drape
layer, painting three staggered rows of 18″ mesh strips in 3D. Slicing, layer
offsets, the two-projector double image, mesh dimming, floor spill, sway.
**`C`** cycles viewpoints (AUDIENCE / OBLIQUE / OVERVIEW); `V` again exits.
The rig dimensions are honest placeholders in `parts/part2d_scrimview.js`
(`SCRIMRIG`, in feet) — when the real layout lands from the camp planner,
drop the numbers in and the view is truthful.

## Local preview (for offline / sandbox iteration)

`python3 tools/build_preview.py` bakes a single self-contained
`night-circuit-preview.html` (three.js + all models inlined) you can open with
no network. `tools/shot.mjs` / `tools/shotevt.mjs` drive it headless for
screenshots (`npm i playwright-core` first). This is what coaching/iteration
uses to check a scene without shipping it.
