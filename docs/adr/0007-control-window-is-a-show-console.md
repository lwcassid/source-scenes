# The control window is a show console: the set list is the interface, the picture is a feed

Status: accepted. Supersedes ADR-0005.

ADR-0003 made the control window a full mirror — same `openFocus()`, same
local rendering — and ADR-0005 then spent a whole decision on making that
mirror cheap enough not to hurt the wall. Driving it revealed that both were
answering the wrong question. Two things were wrong at once.

**The wrong thing was big.** During a show the operator needs the running
order, what is on, and how long until it changes. The wall is behind them;
they do not need a large second copy of it on the laptop. What they got was
a large picture and no set list at all — `#queuePop` is `position:fixed` at
`z-index:60` under a `z-index:100` overlay, so while a scene is open it is
painted *underneath* the overlay, and its only opener (`#btnQueue`) lives on
the library wall the overlay is covering. The set list was unreachable
during precisely the activity it exists for.

**The picture was a re-render, not the wall.** The control window ran the
scene again — its own `makeInstance`, `step`/`draw`, and (since the muted-
graph fix) its own audio DSP. Two performances of the same scene from
different seeds and different clocks, both paid for by the machine driving
the projectors. Every divergence bug this branch fixed — hand mirroring,
reseed relay, act relay — was a patch on the gap between those two
performances. The gap should not exist.

## Decision

The control window's stage splits into **set list left, live feed right**
(`html.electron-control #overlay.open` grows a third grid column; `.obar`
already spans `1/-1`, so only `#showQueue`, `.ostage` and `.oconsole` need
placing). The set list carries a NOW block — scene, a large countdown, a
draining bar, and what is next — over the ordered list, with the current row
highlighted and counting down and every other row stating its MIN. Rows are
click-to-jump.

`#showQueue` is a **separate renderer from the queue drawer**, not a second
mount of it. `QUEUE.renderList()` and `paintThumbs()` target `#queueList` by
id, singular, and the drawer is the EDITOR (MIN input, OUT select, ↑↓✕,
thumbnails, shared sets). Editing stays there; this is a read-only running
order with a live clock. It is split in two for a reason that has already
bitten this codebase once: `renderShowPanel()` rebuilds innerHTML and runs
only when the set changes, `paintShowPanel()` runs every frame and only ever
writes `textContent`/`classList`. Rebuilding DOM at 60fps is what made SHOW
CHECK's buttons flicker, and this list has click targets in it.

The picture becomes a **live capture of the show window**. `main` answers
the control window's `getDisplayMedia` with `{ video: showWindow }` via
`setDisplayMediaRequestHandler`, so no source picker ever appears and the
operator cannot aim it at the wrong window (the control window itself would
be a hall of mirrors). Passing a `BrowserWindow` captures *that window*, not
the display it sits on, so it survives the show window moving screens.

The control window therefore **stops running scenes entirely**: `openFocus`
skips `makeInstance`, `startVoice` returns early. `focus.idx` is still set,
so every bit of scene-identity UI (title, tags, versions, history, act
chips) keeps working; `focus.P` stays null, which the render loop and
`syncStage` already guarded on.

## Consequences

- **ADR-0005 is superseded.** The MIRROR governor existed to make a second
  render affordable. There is no second render, so the pill, the
  `dt`-accumulator and `srcMirrorRate` are gone.
- **`telemetry:tick` (ADR-0003's last unbuilt channel) is now load-bearing.**
  At 4Hz the show window reports `{sceneId, act, rotAt, rotMs, chordHud,
  beatPhase, fps, lastByRole, log}`. `rotAt` is an ABSOLUTE `Date.now()`
  deadline, not "seconds remaining": both windows are one machine, so the
  console interpolates a smooth countdown from one number instead of
  stepping once a second on a value that was stale on arrival.
- **The MIDI monitor and THE RIG rack had to be relayed or they would die.**
  Their note bars and activity lights are fed *only* by a scene's `audio()`
  tick, which now happens exclusively in the show window. `telemetry:tick`
  carries `MOut.log`'s tail and `lastByRole`. Note the trap: `MOut.log`
  stamps events with `performance.now()`, whose time origin is
  **per-document** — the tail is converted to epoch on send and back to the
  receiver's own performance clock on arrival, or the wall's notes would be
  plotted against the console's timeline and smear the whole monitor.
- **A new failure mode: macOS Screen Recording.** Without the grant the feed
  is a black rectangle with no error — indistinguishable from a dead show.
  Mitigated in two places: an overlay note on the feed itself, and a Preview
  row in SHOW CHECK's THE SHOW tier with a button that opens the right
  settings pane. The row polls, so granting it while the pre-flight is open
  turns it green and takes the feed without a relaunch. **The wall is never
  affected by this** — it is the console's picture that goes dark, and both
  messages say so.
- The library wall's tile rendering is now gated on `focus.idx < 0` rather
  than `!focus.P`. Those were the same condition until this ADR; in the
  control window they no longer are (a scene is open with no local
  instance), and without the gate the wall's 43 tiles would render behind
  the open scene.
- The control window keeps its muted `AudioContext`. It is a gain and a
  compressor with no sources now — the expensive part was the scene's
  `audio()` graph — and `T`/`AE.ctx` still feed the monitor's beat grid.
  That grid is started by the control window's own clock, so it can drift
  from the wall's actual beat over a long scene; the notes drawn on it are
  correctly timed, the gridlines behind them are approximate.
