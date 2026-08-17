# PROJECTOR FRAME — how realistic is each scene to the wall?

**The short answer:** every scene *runs* at the projector's dimensions (all 141
registered pieces render error-free at 1920×1200), but until now nobody was
*designing* at them. The window we iterate in is roughly **twice as wide-to-tall
as the wall and half as dense**, so the stills we've been judging are not the
picture the camp will see. 5 scenes change character enough to matter, ~10 change
brightness by ≥35%, and the rest reflow cleanly.

Measured 2026-08-17 against the latest version of all 43 families.

## The geometry (measured, not assumed)

| context | canvas the scene gets | aspect | `areaScale(P)` |
|---|---|---|---|
| **the show** — fullscreen, WUXGA out to both PT-VMZ50s | **1920×1200** | **1.60** | **4.56** |
| `tools/shot.mjs` as it used to run (1280×760 window) | 1280×397 | 3.22 | 2.14 |
| `tools/playtest.js` as it used to run (1280×800 window) | 1280×437 | 2.93 | 2.25 |
| a 1440×900 laptop, windowed | 1440×569 | 2.53 | 2.72 |
| 1920×1200 windowed (bars eat the height) | 1920×869 | 2.21 | 3.88 |
| HiDPI laptop fullscreen (1512×945 @dpr2) | 2268×1417 | 1.60 | 5.38 |

Two separate mismatches fall out of that:

1. **Shape.** Windowed, the focus stage is a ~3:1 letterbox strip — the top and
   bottom bars take 45% of the window height. A composition tuned there is
   composed for a frame that never plays.
2. **Density.** Scenes size their element counts and radii off canvas area
   (`areaScale(P) = sqrt(w·h / (420·264))`). The show hands them **2.1× the area**
   of the old harness window, so counts land ~1.5× higher and anything scaled by
   `Math.min(w,h)` comes out ~3× bigger than in the preview.

A third one, now fixed: the stage was measured *before* the console bars
reflowed, so the backing store was 429px tall inside a 400px box — every
windowed render was vertically squashed ~7%.

## What now matches

- **The projector frame is the DEFAULT.** The focus stage renders a true
  1920×1200 canvas in any window, drawn as a centered 16:10 letterbox (black
  bars are invisible on scrim), so every scene gets the show's shape *and* the
  show's density wherever it's opened. Opt out with `?win` in the URL or `P`
  on the stage; phones default to their native canvas for framerate (`?proj`
  forces the show frame there too).
- **Tile thumbnails are exactly 16:10** (416×260 — the old 420×264 was 1.59,
  close but not the wall's shape), so the library wall previews the same frame
  the stage renders.
- **`tools/shot.mjs`, `tools/shotcam.mjs`, `tools/shotevt.mjs`,
  `tools/playtest.js`** run at viewport 1920×1200 with `fs`+`zen` (SHOWTIME
  layout, chrome hidden), so screenshots are 1920×1200 pixel-for-pixel with
  the projector output. `PROJ=0` in the env restores the old window if you
  ever want the comparison.
- **The DBG strip** prints a `FRAME` line — `1920×1200 · 1.60 · PROJ` is the
  show; anything else means someone opted out.
- **On-playa**: the default already pins the render; just confirm the FRAME
  line before showtime (see `docs/SHOW-KIT.md`).

## Per-scene reading

Latest version of each family, driven to L=R=0.78 with presence on, sampled in
both frames. `vfill`/`hfill` = fraction of frame height/width the lit content
spans at 1920×1200; `vs. window` = mean frame brightness at 1920×1200 over the
same at 1280×397 (how much heavier or thinner the wall reads than the preview
suggested). Single-moment samples of time-varying scenes — treat them as
pointers to look, not verdicts; thin-line scenes read low on `hfill`.

| scene | latest | frame use (vfill/hfill) | vs. window | what to know |
|---|---|---|---|---|
| **SRC-01** Epicycle Court | `SRC-01` | fills — 1.00/1.00 | — | rings scale on `min(w,h)`; reflows |
| **SRC-02** Phyllo Reactor | `SRC-02` | fills — 0.96/1.00 | sparser ×0.59 | same spiral over 2× the area — thinner wall than preview |
| **SRC-03** Grav Circuit | `SRC-03` | fills — 0.95/0.95 | — | pseudo-3D horizon still spans; scrim slicing is the bigger risk |
| **SRC-04** Bubble Field V2 | `SRC-04.2` | partial — 0.71/0.95 | — | net hangs from the top; lower third stays dark |
| **SRC-05** Chime Grove | `SRC-05` | fills — 1.00/1.00 | hotter ×1.4 | taller trees, more canopy light |
| **SRC-06** Physarum Chancel | `SRC-06` | fills — 0.96/0.98 | — | agent field is a **fixed 128×80 grid** → ~15px cells at 1920 (was 10px); softer but holds. Grid is already 16:10 |
| **SRC-07** Coral Scriptorium | `SRC-07` | fills — 1.00/0.98 | sparser ×0.45 | **fixed 176×110 RD grid** → 11px cells, visibly blocky at show size. Grid aspect is exactly 1.60, so the *window* was stretching it 2× wide — 16:10 is its native shape |
| **SRC-08** Harmonograph Duet | `SRC-08` | fills — 1.00/1.00 | — | Lissajous figure gets rounder (was stretched wide) |
| **SRC-09** Attractor Vespers V2 | `SRC-09.2` | fills — 0.97/1.00 | — | density smoke; clean reflow |
| **SRC-10** Weather Station V15 | `SRC-10.15` | fills — 0.97/0.98 | — | plot fills; clean reflow |
| **SRC-11** Archive Territories | `SRC-11` | fills — 1.00/1.00 | — | Voronoi census re-tiles to any frame |
| **SRC-12** Murmuration Duet | `SRC-12` | island — 0.29/0.80 | — | two flocks sit high and small; ~70% of the wall is dark. Flock scale/altitude want tying to `h` |
| **SRC-13** Cable Strum | `SRC-13` | fills — 1.00/1.00 | hotter ×1.6 | bars run cable→floor, so at 1200 they're big bright slabs — check for washout |
| **SRC-14** Tilt Chamber | `SRC-14` | fills — 1.00/1.00 | — | rigid bodies fill the box |
| **SRC-15** Ferro Bloom V18 | `SRC-15.18` | fills — 1.00/0.91 | hotter ×1.4 | blooms are shader-sized, so more of the frame is bloom; reads richer than the preview |
| **SRC-16** Rain Atrium | `SRC-16` | fills — 0.97/0.98 | — | heightfield spans; clean |
| **SRC-17** Chord Cathedral | `SRC-17` | island — 0.44/0.63 | — | pitch strata spread over 1200px (more legible), but the light still lives in a mid-frame band |
| **SRC-18** Night Circuit V17 | `SRC-18.17` | fills — 1.00/1.00 | — | `PerspectiveCamera(58°, w/h)`: vertical FOV is fixed, so 16:10 **narrows horizontal FOV from ~112° to ~83°** — peripheral scenery leaves frame, the road reads narrower and taller. Nothing breaks; the composition is genuinely different |
| **SRC-19** Koi Void | `SRC-19` | partial — 0.71/0.61 | sparser ×0.49 | lanterns and koi keep their size in a 3× frame — half the light per area |
| **SRC-20** Aurora Veils | `SRC-20` | band — 0.64/0.98 | — | curtains hang in the upper two-thirds; bottom third dark |
| **SRC-21** Pulse Loom | `SRC-21` | partial — 0.71/0.79 | — | strings get 2× longer, rail sits mid-frame |
| **SRC-22** Ember Chorus | `SRC-22` | fills — 0.99/0.88 | sparser ×0.35 | **biggest dim-down in the set**: same fireflies over 2× the area. Count is `areaScale`d, brightness per bug is not |
| **SRC-23** Penrose Court | `SRC-23` | fills — 0.99/0.99 | — | aperiodic tiling re-tiles; clean |
| **SRC-24** Player Piano | `SRC-24` | island — 0.34/0.04 | — | rail + strings sit low; the top ~60% of the wall never lights. Wants the strings scaled to `h` |
| **SRC-25** Tomograph | `SRC-25` | fills — 0.93/0.79 | — | light planes span; clean |
| **SRC-26** Solid Light | `SRC-26` | fills — 0.94/0.82 | — | cones use `hypot(w,h)`; grows correctly |
| **SRC-27** Sphere Breath | `SRC-27` | fills — 0.90/0.56 | — | radial shells, `min(w,h)` — 3× bigger sphere, exactly as intended |
| **SRC-28** Chladni Court | `SRC-28.4` | band — 0.55/0.98 | sparser ×0.69 | **the one real frame assumption**: three *square* panels of side `w/3`, vertically centered. At 1920 that's a 640-tall frieze with 280px of black above and below (in the window they overflowed and filled). Either make panel height `h` or accept a floating band |
| **SRC-29** Accretion | `SRC-29` | partial — 0.86/0.93 | hotter ×3.7 | **the clearest proof the preview lied**: a ~100px blob in the window, a full 900px dendrite on the wall. Scaled on `min(w,h)`, so growth budget and mass are 3× |
| **SRC-30** Storm Garden V7 | `SRC-30.7` | fills — 0.99/1.00 | hotter ×1.4 | sky/ground gradient fills; more storm body |
| **SRC-31** The Rift | `SRC-31` | partial — 0.78/0.27 | hotter ×1.5 | vertical tear, `min(w,h)` — much bigger white core; blowout candidate on scrim |
| **SRC-32** Sonora | `SRC-32.4` | fills — 0.93/0.35 | hotter ×1.7 | stones ~3× bigger, 1.7× the ink; the pan finally uses the frame |
| **SRC-33** Apnea | `SRC-33` | island — 0.20/0.66 | — | compact creature by design; the dark frame is the point, just bigger now |
| **SRC-34** White Study V2 | `SRC-34.2` | fills — 1.00/0.98 | — | plates are 3× taller — the brightest white mass in the set; worth a scrim washout check |
| **SRC-35** Ferrous Ink | `SRC-35` | island — 0.25/0.62 | — | the ink lozenge is a wide band using ~25% of the height in *either* frame; live it floats in a lot of black |
| **SRC-36** Foam Bloom V3 | `SRC-36.3` | fills — 1.00/1.00 | — | foam film fills; clean |
| **SRC-37** Iris Engine V5 | `SRC-37.5` | fills — 1.00/1.00 | sparser ×0.62 | full-frame gradient, but mean drops — the ladder's bright core is a smaller share of the wall |
| **SRC-38** Lumen Film | `SRC-38.15` | fills — 1.00/1.00 | hotter ×1.9 | mean luma 108/255 at 87% coverage — nearly a white wall. Tuned in a window that showed half that; **check before the set list** |
| **SRC-39** Starling Field | `SRC-39` | fills — 1.00/1.00 | hotter ×1.4 | boid lattice + Turing spots, denser and brighter |
| **SRC-40** Vortex Choir | `SRC-40` | fills — 1.00/0.61 | hotter ×1.7 | spiral is `min(w,h)` — 3× bigger disc, much stronger on the wall |
| **SRC-41** Pour Cells V8 | `SRC-41.8` | fills — 1.00/1.00 | — | domes scale on area; clean |
| **SRC-42** Ridge Loom V6 | `SRC-42.6` | fills — 1.00/1.00 | — | contour field reflows, more ridges visible |
| **SRC-43** Cell Front V3 | `SRC-43.3` | fills — 0.94/0.89 | — | cell blob grows with the frame; clean |

### Summary

- **28 scenes reflow cleanly** — nothing to do but re-judge the stills in the
  real frame.
- **5 leave a third or more of the wall dark** at 16:10: `SRC-28` Chladni Court
  (a baked-in 3:1 assumption), `SRC-24` Player Piano, `SRC-12` Murmuration Duet,
  `SRC-35` Ferrous Ink, `SRC-20` Aurora Veils. Only Chladni is a bug; the rest
  are compositional choices worth re-taking on purpose.
- **10 land ≥35% brighter** on the wall than the window showed —
  `SRC-29` (×3.7), `SRC-38` (×1.9), `SRC-32`/`SRC-40` (×1.7), `SRC-13` (×1.6),
  `SRC-31` (×1.5), `SRC-05`/`SRC-15`/`SRC-30`/`SRC-39` (×1.4). Mesh eats about
  half the light, so brighter is usually welcome; `SRC-38` and `SRC-34` are the
  washout candidates.
- **7 land ≥30% dimmer** — `SRC-22` (×0.35), `SRC-07` (×0.45), `SRC-19` (×0.49),
  `SRC-02` (×0.59), `SRC-37` (×0.62), `SRC-28` (×0.69), `SRC-21` (×0.70). These
  are the ones to re-check for "does it still read at 20% brightness".
- **2 run on fixed sim grids** (`SRC-07` 176×110, `SRC-06` 128×80) whose cells
  are now 11–15px. Both grids are already 16:10, so the shape is right; the
  resolution is a look decision.

No scene was reworked here — that's owner territory and every change owes a new
version file. This is the map of what to look at.

## Frame presets

The default frame is the confirmed rig: **two Panasonic PT-VMZ50, native WUXGA
1920×1200 (16:10), one cloned render**. If the projector class ever changes,
one setting cascades everywhere (stage, thumbnails keep 16:10 as-designed,
areaScale, harness shots): `?frame=fhd` · `?frame=wxga` · `?frame=xga` ·
`?frame=uhd` · `?frame=1400x1050`, or `setFrame(w,h)` in the console while a
scene is open. Bogus values fall back to WUXGA.

## View modes — flat, ghost, and The Cave

The VIEW dropdown on the stage (or `V` to cycle; persists everywhere):
FLAT · GHOST (two-projector misregistration overlay) · SCRIM HEAD-ON ·
SCRIM THE CAVE 3D (`C` cycles cameras). `H` tucks the control bars.

### The rig, derived from Elyse's planner (duxel = 8 ft)

From the Cave Layout 2026 screenshots: interior ≈ 3 duxels wide × 5 deep
(**24 × 40 ft**), 8 ft duxel walls with 16 ft towers flanking the entrance;
fabric panels are **cable-mounted** (18″/27″/54″ widths, 8–16 ft drops) on
cables strung across the interior; projectors sit **on top of the duxels at
the entrance's innermost corners — ~22 ft apart, 8 ft up**, behind the user
at the source. Modeled in `SCRIMRIG`: 54″ panels with 1 ft gaps on three
rows 6 ft apart, 16 ft drops, converged on the middle row at 1.1:1.

**The geometry has a real consequence:** with the lenses ~22 ft apart and
registered on one row, panels one row nearer or farther catch the two
throws **several feet apart laterally** — a much stronger double image than
a close-mounted pair would give. The sim shows it honestly; if it's too
much on the wall, the fixes are physical (converge on the front row, narrow
the projector spacing, or give each projector its own half of the room).

Still approximate: per-panel positions along each cable, panel count, and
the convergence choice. All numbers are in `SCRIMRIG`
(`parts/part2d_scrimview.js`, feet) — edit and everything follows.

## Re-running the audit

`tools/frameaudit.mjs` renders the latest version of every family in both frames
and writes thumbnails plus metrics to `scratchshots/geo/`:

```
python3 tools/build_preview.py
node tools/frameaudit.mjs            # all families, both frames
node tools/frameaudit.mjs SRC-28.4   # just these ids
```
