# Show/control instance model and IPC contract

Status: accepted

`electron/main.js` creates two `BrowserWindow`s, both loading the exact same
built `index.html`, distinguished only by a `?role=show` / `?role=control`
query param — the same mechanism this app already uses for `?proj`/`?win`/
`?frame=`. `part1_head.html` reads it once into `window.ELECTRON_ROLE`
(`null` in the plain browser — Netlify, `tools/verify.sh`, phones — so
nothing here changes existing behavior there).

The control window is a **mirror, not a thin remote**: clicking a tile
there calls the app's own existing `openFocus()` locally (same picture,
rendered a second time) *and* sends an IPC command telling the show window
to open the same scene — both fire from the same click, optimistically, no
confirmation round-trip. This was a real trade-off (a thin remote with no
local rendering costs less GPU, which matters given the M1 performance
concern this whole map exists to address) but the mirrored view was chosen
deliberately, with an explicit condition: mirror rendering fidelity/frame
rate must be reducible so it never competes with the show window for
resources. That reducibility mechanism is its own ticket (Show window's
picture is not up for negotiation; the control window's is) — see
[Control-window mirror fidelity/rate governor](https://github.com/lwcassid/source-scenes/issues/35).

**Real MIDI-in/out and audible output stay exclusively the show window's.**
`AE.ensure()` (`part2_core.js`) no longer short-circuits for
`ELECTRON_ROLE === 'control'` — it builds the SAME graph there (so
`T`/`H`, the MIDI monitor and the RIG rack all tick correctly in the
mirror) but routes it through a zero-gain node before `destination`, so
nothing is ever audible. `connectMidi()` still gates the one thing that
actually matters: it never opens a real `MIDIAccess` in the control
window. What changed is it no longer just no-ops there either — every
existing caller (CONNECT, TEST, LEARN's auto-connect, mode-switch) works
from the control window now, because `connectMidi()` relays a connect
REQUEST to the show window instead of doing nothing. `midi.access` is
still only ever assigned inside the show window's branch, so `MOut`'s real
`this.port.send(...)` and hand-sensor MIDI-in stay exactly where they
were — only the picking UI moved, not the signal path (ADR-0006).

Renderers never talk to each other directly (Electron doesn't allow it) —
every message relays through `main.js`: `preload.js` exposes
`window.electronAPI` via `contextBridge`, which calls `ipcRenderer`; `main.js`
forwards to the other window's `webContents`. The channel set:

| channel(s) | direction | purpose |
|---|---|---|
| `show:openScene` | control→show | tile/PLAY click opens the same scene in show |
| `control:syncScene` | show→control | show echoes its open scene back (e.g. after auto-advance) so control's mirror stays honest |
| `show:closeScene` | control→show | control's CLOSE drops show back to the library wall |
| `hand:drive` | control→show | mouse-driven virtual theremin input |
| `hand:mirror` | show→control | show's real calibrated hand values, so control's rail/sidebar reflect what's actually driving the scene |
| `show:control` | control→show | one generic channel for global toggles — `{kind: sound\|outMode\|clock\|outPort\|ghosts\|reseed\|vol, value}` |
| `rig:status` | show→control | MOut mode/port/clock/bpm mirrored so THE RIG rack lights up in control |
| `display:list` / `display:pick` | control↔main | ADR-0004's native-screen picker; `display:pick` now carries `{id, label}` — `id: null` deliberately means "fullscreen the show window where it already is," so PLAY is never a silent no-op on one display |
| `display:changed` | main→control | re-lists displays on hot-plug (add/remove/metrics-changed), not just at boot |
| `midi:devices` / `midi:connect` / `midi:test` | show↔control (via main) | ADR-0006's device-list relay and the CONNECT/TEST relay |
| `midi:learnStart` / `midi:learnResult` / `midi:setInput` | control↔show | LEARN sweep and specific-input-device relay — wired since ADR-0006 was written; see its Consequences |
| `audio:status` / `audio:wake` | show↔control | SOUND row mirror + wake request |
| `queue:update` | control→show | the performance queue (`{list, cfg}`) on every edit — one way, control authoritative. Cached in main and replayed on the show window's `did-finish-load` so a slow boot or a reload can't miss it |
| `show:play` | control→show | decided, still not built — forcing FLAT view / PROJ frame / panels-off remotely when PLAY fires |

Also decided: the show window is **always** picture-only in Electron
mode — the existing PANELS toggle (bring chrome back over the picture)
doesn't apply to it at all; that concept only ever existed to keep the
*show* clean, and the control window was never the show, so it doesn't
need a "hide my chrome" mode either.

## Verified, not just decided

Launched both windows for real with `--remote-debugging-port` and drove
each via the Chrome DevTools Protocol:
- Each window reports its own correct role (`window.ELECTRON_ROLE` and
  `window.electronAPI.role`) — `"show"` and `"control"` respectively.
- Triggering `AE.ensure()` + `connectMidi()` in each: the show window ends
  up with a real `AudioContext` and a real `MIDIAccess`; the control
  window ends up with its own real (muted-output) `AudioContext` too, and
  `midi.access` stays `null` there — confirming the gate is on MIDI-in/out
  ownership specifically, not on having any graph to tick against.
- `show:openScene` round-trips for real: calling
  `window.electronAPI.openScene(id)` in the control window's renderer
  reaches a listener registered in the show window's renderer, via the main
  process relay, with the exact value sent. (At the time of this pass it
  was the only wired channel; the rest of the table has since followed the
  same relay pattern — see Consequences for what's still open.)

## Consequences

- Every channel in the table above is wired end-to-end. `show:play` was
  dropped rather than built: it existed to CORRECT the show window after
  something moved it off FLAT / PROJ / panels-off, and the better answer is
  that nothing can. The show window is a focusable OS window raised to the
  front by `setFullScreen()`, so V / P / Escape / arrows / edge clicks were
  all landing on the projector output; they are now gated off there, the
  way PANELS already was. Prevention beats correction on a live wall.
  The resulting law: **the show window accepts hands and nothing else.**
  Everything with two possible drivers (R reseed, acts) has exactly one —
  control acts locally and relays the same seed/index, so the mirror and
  the wall cannot diverge.
- `queue:update` is one way on purpose. The show window is picture-only,
  so no human can ever edit a queue there — control is authoritative and
  there is nothing to merge. The show window treats QUEUE as DATA, never
  UI: it swaps `list`/`cfg` and deliberately does NOT call `QUEUE.refresh()`
  (which would re-render the drawer, repaint 43 tile badges and re-run
  `applyLibrary()` on the machine driving the projectors, to decorate a
  wall nobody can see). It also never `save()`s what it receives — writing
  back would make it a second author of a queue it cannot edit.
- Changing MIN on the scene that is ON STAGE re-times rather than restarts:
  `SHOW.retimeRotation()` keeps the time already served, and advances
  immediately if the new MIN is already used up. Restarting the clock would
  mean nudging MIN on the live scene silently granted it a whole fresh
  stay — hold the up-arrow and a scene never ends.
- The fidelity/rate governor (issue #35) landed as ADR-0005: the control
  window's mirror defaults to throttled step/draw/composite. That
  mitigates, not eliminates, the 2x-rendering-load risk this ADR flagged —
  the control window also runs a full (muted) audio graph per the gate
  change above, unconditionally, regardless of the mirror throttle.
- Calibration (SET REST / INVERT) and forcing the show window's view/
  frame/panels state remotely on PLAY remain show-window-only — see
  CLAUDE.md's electron/ section for the current list.
