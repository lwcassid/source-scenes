# Display picker uses Electron's native screen module, not the Window Management API

Status: accepted

Under Electron, `SCREENS` (`part5_tail.js`) branches: display **enumeration**
still goes through `window.electronAPI.getDisplays()` → main process
`screen.getAllDisplays()` (IPC, ticket #31) instead of
`window.getScreenDetails()`, and the actual **fullscreen-triggering** action
in `enterShow()` sends `display:pick` to main instead of calling
`ov.requestFullscreen({screen})` at all.

This wasn't a hunch — verified empirically that `window.getScreenDetails()`
genuinely works inside an Electron renderer with no permission friction
(resolves immediately, reports real displays). That's not why this branch
exists. The actual problem: `enterShow()` fullscreens *its own document*.
Under the two-window split, PLAY gets clicked in the **control** window, but
the thing that needs to go fullscreen is the separate **show** window — and
one `BrowserWindow`'s renderer cannot trigger fullscreen on another's (the
same "Permissions check failed" limitation proved resolving [ADR-0003](0003-electron-instance-model-and-ipc-contract.md)'s
map, hit again from a different angle). `getScreenDetails()` enumerating
displays correctly doesn't help if the fullscreen call still lands on the
wrong window. Only the main process can move and fullscreen a *different*
`BrowserWindow` (`setBounds()` to the target display, then `setFullScreen()`)
— so the actual placement action has to go through IPC regardless of which
enumeration API is used, which makes using the native `screen` module for
enumeration too the simpler, more idiomatic choice, with the added benefit
of no permission-grant flow at all.

Electron's own `Display` objects already carry `.label` and `.internal`
natively (confirmed: `"Built-in Retina Display"` / `internal: true`,
`"Sidecar Display (AirPlay)"` / `internal: false` on the dev machine), so
`SCREENS.label()` and the external/non-primary auto-pick heuristic in
`SCREENS.probe()` needed zero changes — only the data source branches.

## Verified, not just decided

Launched both windows for real, drove them over CDP: `SCREENS.probe()` in
the control window returned `["Built-in Retina Display 1512×982 (primary)",
"Sidecar Display (AirPlay) 1102×742"]` — genuinely correct, genuinely live
hardware. Auto-pick correctly chose the external display. Calling
`enterShow()` in the control window: the control window's own
`document.fullscreenElement` stayed `false` (it never touches itself), and
the show window's actual OS window became `1102×742` at `(-1102, 0)` —
exactly the Sidecar display's real bounds. This is the concrete fix for the
original bug report that started this whole map: picking a second display
and having PLAY still land on the current one.

## Consequences

- `enterShow()` no longer forces panels/flat-view/PROJ *on the show window
  itself* when running under Electron — that has to happen inside the show
  window's own document over IPC (`show:play`, decided in ADR-0003, not yet
  wired). This ticket only wires display placement.
- The plain browser path (`SCREENS.inElectron()` false) is completely
  unchanged — confirmed live in real Chrome on this same machine, which
  genuinely has two displays connected: `getScreenDetails()` still drives
  it, same labels, same auto-pick, same fullscreen mechanics as before this
  ticket.
