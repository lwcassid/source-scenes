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

## See the REAL frame (do this before judging a look)

The projectors give one 1920×1200 render, 16:10, fullscreen. A browser window
does not: windowed, the stage is a wide ~1280×400 strip, so what you're looking
at is about twice as wide-to-tall as the wall and half as dense (scenes size
their element counts off the canvas area). Two ways to see the truth:

- Add **`?proj`** to the URL, or press **`P`** while a scene is open. The canvas
  becomes exactly 1920×1200 whatever your window is, drawn letterboxed and
  centered — same composition, same density as the show. Press `P` again to go
  back. In fullscreen (⛶ SHOWTIME) with `?proj` on you get it pixel-for-pixel.
- The DBG strip (bottom of fullscreen) prints a `FRAME` line — `1920×1200 ·
  1.60 · PROJ` is the show; anything else is a window.

## Local preview (for offline / sandbox iteration)

`python3 tools/build_preview.py` bakes a single self-contained
`night-circuit-preview.html` (three.js + all models inlined) you can open with
no network. `tools/shot.mjs` / `tools/shotevt.mjs` drive it headless for
screenshots (`npm i playwright-core` first). This is what coaching/iteration
uses to check a scene without shipping it.
