# MIDI device picking is a relayed UI, not moved ownership

Status: accepted

The show window keeps the real, active `MIDIAccess` — ADR-0003's original
gate (`connectMidi()` blocked for `ELECTRON_ROLE === 'control'`) is
**unchanged**. What's new: the show window relays its device list
(`midi:devices`, show→main→control — the reverse direction of ticket #31's
`display:list`, since Electron's main process has no Web MIDI access of its
own to source it from) so the control window's SHOW CHECK pickers
(`midiInSel`, `midiOutSel`) can show real device names and let the operator
choose, writing the selection to the already-shared `srcOutPort`
`localStorage` key (ticket #30) rather than any new IPC round trip.

This was not the first design on the table. The natural first instinct —
mine, initially — was "MIDI input should live wherever the operator can
interact with it, so give the control window real `midi.access`." Nima's
correction: device **picking** (which controller, which output port, which
display) belongs in the control window because that's what's actually
visible to the operator; the **signal processing** underneath — reading raw
hand-sensor CC in real time, sending MIDI-out — belongs wherever is fastest,
which is the show window, co-located with the audio engine, with zero IPC
round-trip. Splitting picking-UI from signal-path turns out to be exactly
the pattern [ADR-0004](0004-electron-display-picker-native-screen.md) already
built for displays — this ticket applies the same shape to MIDI rather than
inventing a second one.

One consequence of the split: `MOut`'s output-port dropdown, when picked
from the control window, only *writes* the shared preference — the show
window only re-reads it when it doesn't already have a port assigned
(existing behavior, unchanged). Swapping the output port live, mid-run, from
the control window doesn't take effect until the show window's next
connect. Fixing that live-swap gap is real follow-up work, not blocking.

## Verified, not just decided

Launched both windows with a real MIDI device attached to this machine
("e-ther," in/out): triggered `connectMidi()` in the show window, confirmed
the control window's `midiRelay` received `{connected: true, inputs:
[{name: "e-ther"}], outputs: [{name: "e-ther"}]}` via the real IPC round
trip. Confirmed `refreshMidiUI()`/`MOut.refreshUI()` render correctly from
it in the control window: status badge reads "MIDI: ON," the input picker
lists the real device, the output picker lists it too. Simulated picking
the output device from the control window's dropdown and confirmed
`srcOutPort` landed in `localStorage` and was immediately visible from the
show window too. (LEARN buttons and the calibration box were hidden at
the time this was verified — see Consequences for what a later pass wired.)

## Consequences

- LEARN now runs from the control window too, on the same shape as
  CONNECT/TEST: clicking MAP L/R sends `midi:learnStart`, the show window
  runs the exact sweep it always did and reports the result back over
  `midi:learnResult`, so both windows show the same MOVE L…/LEARN L toggle
  text. Picking a specific input device (not "all") relays the same way,
  over `midi:setInput` — `midi.inputId` is still in-memory only in the
  show window, so neither window persists that choice across a restart,
  matching pre-existing single-tab behavior.
- Calibration (hand-range sweep: SET REST / INVERT) is the one thing still
  show-window-only — it needs live raw-value feedback during an active
  sweep, which needs its own narrow, temporary relay (extending the
  `telemetry:tick` concept from ADR-0003), not yet built. The control
  window's SHOW CHECK correctly hides that box rather than showing broken
  controls.
- Auto-reconnect resilience for MIDI/display after a mid-show interruption
  is explicitly out of this ticket's scope — graduated into [Auto-reconnect
  MIDI and display after an interruption during a live show](https://github.com/lwcassid/source-scenes/issues/37).
