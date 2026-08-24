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

**Audio/MIDI stay exclusively the show window's**, enforced by two gates,
not three: `AE.ensure()` (`part2_core.js`) short-circuits when
`ELECTRON_ROLE === 'control'`, and `connectMidi()` (same file) does too.
Gating `connectMidi()` alone is sufficient for MIDI: `MOut`'s real
`this.port.send(...)` calls are already only reachable once `midi.access`
exists, and `midi.access` is only ever set inside `connectMidi()` — so
blocking that one call blocks hand-sensor MIDI-in *and* MOut's MIDI-out
together, with zero changes to `part2c_midiout.js` or any scene file.

Renderers never talk to each other directly (Electron doesn't allow it) —
every message relays through `main.js`: `preload.js` exposes
`window.electronAPI` via `contextBridge`, which calls `ipcRenderer`; `main.js`
forwards to the other window's `webContents`. The full channel set decided
here: `queue:update`, `show:play`, `show:openScene`, `show:closeScene`,
`hand:drive` (control→show, for mouse-driven virtual theremin input),
`display:pick` (control→main only — main directly manages the show window's
screen placement via Electron's native `screen` API, no need to also forward
to the show renderer), and `telemetry:tick` + `midi:monitor` (show→control,
throttled to avoid IPC spam — exact rate not yet pinned down). Also decided:
the show window is **always** picture-only in Electron mode — the existing
PANELS toggle (bring chrome back over the picture) doesn't apply to it at
all; that concept only ever existed to keep the *show* clean, and the
control window was never the show, so it doesn't need a "hide my chrome"
mode either.

## Verified, not just decided

Launched both windows for real with `--remote-debugging-port` and drove
each via the Chrome DevTools Protocol:
- Each window reports its own correct role (`window.ELECTRON_ROLE` and
  `window.electronAPI.role`) — `"show"` and `"control"` respectively.
- Triggering `AE.ensure()` + `connectMidi()` in each: the show window ends
  up with a real `AudioContext` and a real `MIDIAccess` object; the control
  window's `AE.ctx` stays `null` and `midi.access` stays `null` — the gate
  works.
- The one wired channel (`show:openScene`) round-trips for real: calling
  `window.electronAPI.openScene(id)` in the control window's renderer
  reaches a listener registered in the show window's renderer, via the main
  process relay, with the exact value sent.

## Consequences

- Only `show:openScene` is wired end-to-end (`ipcMain.on`/`webContents.send`
  in `main.js`, `contextBridge` methods in `preload.js`). The rest of the
  channel list above is a decided contract, not yet built — real remaining
  implementation, tracked informally rather than as a new ticket, since the
  decision is complete.
- The control window renders every open scene live, same as the show
  window, until the fidelity/rate governor (issue #35) lands. Until then,
  running both windows with a scene open costs roughly 2x the rendering
  load of today's single-tab app.
