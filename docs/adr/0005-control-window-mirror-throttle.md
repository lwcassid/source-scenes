# Control window mirrors at a throttled frame rate by default, manual toggle to Full

Status: accepted

ADR-0003 accepted the control window as a full mirror — same `openFocus()`,
same local rendering, not a thin remote — on one explicit condition: mirror
fidelity/frame rate must be reducible so it never competes with the show
window for GPU/CPU on the target M1 hardware. This ADR is that condition
being met.

The throttle lives entirely in the shared `frame()` loop (`part5_tail.js`):
when `window.ELECTRON_ROLE === 'control'` and a scene is focused, a
`dt`-accumulator gates how often `P.def.step()`/`P.def.draw()` run — a
fixed-ms target interval, not an `fc % N` frame-count stride, because
nothing in the codebase asserts the control window's actual display refresh
rate (only the two identical show projectors' Hz is known; the operator's
laptop panel is unasserted). No scene-side code changes, no canvas/resolution
changes — the show window's picture is untouched either way.

It's a manual Full/Throttled toggle, not automatic/adaptive. Adaptive
throttling off live show-window FPS was considered and rejected for now:
`telemetry:tick` (the channel it would need) is decided but unbuilt per
ADR-0003, and there's no real M1 performance data yet to tune a feedback
loop against — issue #33 (M1 validation) is deliberately sequenced *after*
this ticket for exactly that reason. Building hysteresis logic ahead of real
numbers is guessing at a shape we don't have yet.

Default is Throttled, not Full. Chromium's automatic background rAF
throttling only fires for hidden/occluded/minimized documents — a control
window sitting visibly on the operator's laptop screen next to the show
window on the projector output gets no free mitigation from the browser.
Whatever default ships is the real, live default during an actual show, so
the control window opts *up* to Full deliberately rather than opting *down*
from a state that already competes.

The choice persists per-browser via `localStorage` (`srcMirrorRate`,
defaulting to Throttled when unset) — matching the existing `srcPanels`/
`srcView`/`srcTheme` pattern. Unlike `srcPanels`, PLAY does **not**
force-reset it: PANELS enforces a hard show-time requirement (picture only),
while mirror fidelity is an operator tradeoff call (preview quality vs.
headroom left for the show window) that's fine to carry between rehearsal
and show.

The toggle is a pill next to `#panelTab`/`#dbgTab` in `.ostage`, labeled
`MIRROR: FULL` / `MIRROR: THROTTLED` inline so state reads at a glance
without hovering. Click-only, no dedicated keybind (matches DBG, which also
has none — only PANELS does). Entirely gated behind `ELECTRON_ROLE ===
'control'`, so it doesn't exist in the plain browser/Netlify path.

## Considered options

- **Resolution/downscale throttling** (shrink `P.canvas`/`P.g` for the
  mirrored render) instead of, or alongside, frame-rate: rejected for this
  ticket. It touches per-scene canvas sizing and anything a scene computes
  from `P.w`/`P.h`, across 35 scene families — real risk of scene-specific
  breakage for a resource win frame-rate throttling already delivers with
  zero scene-side surface area. Left in the map's Not yet specified as a
  follow-up if frame-rate throttling alone proves insufficient once #33
  produces real numbers.
- **Stepped levels** (Full/Half/Quarter) instead of binary: rejected as
  premature — there's no performance data yet to justify tuning three
  points instead of one. Binary is the honest first pass; a dropdown can
  replace the pill later if #33 shows one throttle level isn't enough.
- **`fc % N` frame-count stride** (matching the existing unfocused-library-
  wall precedent) instead of a `dt`-accumulator: rejected — that precedent
  tolerates being a few ms off because it's ambient wall drift; this ADR is
  a resource-safety guarantee, and nothing asserts the control window's
  actual Hz, so a stride tuned for 60Hz could silently under- or
  over-throttle on different hardware.

## Consequences

- The show window's rendering path and picture are completely untouched by
  this ADR — the gate only ever fires inside a document whose
  `ELECTRON_ROLE` is `'control'`.
- The plain browser/Netlify path is unaffected: `ELECTRON_ROLE` is `null`
  there, so the pill never renders and `frame()`'s existing behavior is
  unchanged — same code path as today.
- Real M1 numbers from issue #33 may show a single throttle level isn't
  enough, or that resolution/downscale is also needed. This ADR doesn't
  close that door — see Not yet specified on the map (issue #27).
