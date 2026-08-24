# A second MIDI device drives the SHOW, not the sound

Status: accepted. Replaces PADMAP.

One MIDI device played the instrument — two hands, bound by a 2.6s LEARN
sweep over CC/bend/AT. Navigating the show from hardware existed only as
**PADMAP**: a 4×4 pad mapped to queue slots 1–16 from a single learned anchor
note. Two things were wrong with it.

**Its LEARN button was a no-op where it lived.** `#btnPadLearn` sat in the
queue drawer — the *control* window — and set `PADMAP.learn = true` in a window
that can never receive a MIDI note, because real MIDI-in is show-window-only
(ADR-0006). There was no `pad:*` IPC. That is precisely the gap
`midi:learnStart`/`midi:learnResult` was invented to close for the hands, and
PADMAP never got the same treatment.

**There was no prev/next**, which is the control an operator reaches for most.

## Decision

A dedicated **SHOW CONTROL** device, learned and mapped separately from the
hands, with its own device picker in the MAP popover. Three bindings: `prev`,
`next`, and a pad `base` whose next 15 consecutive numbers become queue slots
2–16. PADMAP is deleted; a one-time migration adopts its anchor so an
already-mapped 4×4 keeps every pad without re-learning.

Bindings reuse the hands' `{type, ch, num, dev}` 4-tuple, so `srcMatches()` and
`srcKey()` work on them unchanged — but `type` here is `'note'` or `'cc'`,
which the hands never bind (they take cc/bend/at, and note-ons are routed away
before the hands ever parse them).

**LEARN is one-shot, not a sweep.** The hands sweep for 2.6s because a
continuous controller has to reveal its *range* before you know what it is; a
button is decisive on its first press. NAV arms, takes the first qualifying
message, binds, disarms — with a 6s timeout, which PADMAP lacked (it armed
until you remembered to click again).

## Consequences

- **NAV gets first look at incoming MIDI, before the hands' `midi.inputId`
  filter.** That filter is a single global scalar: the moment an operator picks
  a specific device for the hands, a second device's CCs would be dropped
  before NAV ever saw them. Note-ons already bypassed it — CCs had to be given
  the same early look, or the nav controller would only half work.
- **CC bindings fire on the RISING EDGE only** (value crossing 63). A momentary
  footswitch sends 127 then 0; firing on both would advance two scenes per
  press.
- **Cross-talk is guarded in both directions.** A nav learn ignores any source
  already bound to a hand, and a hand learn ignores anything `NAV.claims()` —
  prev, next, *and* the whole pad slot range. (A first pass checked prev/next
  only, which left a CC-based pad base stealable as a hand; the guard and this
  sentence disagreed until a review caught it.) Navigation also stops firing
  while a hands sweep is running, so crossing a CC bound to PREV can't jump
  the show mid-LEARN. The IAC echo guard at the top of `onMidiMsg` already
  covers our own output coming back.
- **Once a device is named, only that device can bind.** The device gate
  originally sat below the learn branch, making LEARN device-blind: pick the
  pad, learn PADS on it, then click LEARN NEXT and let the theremin twitch
  first, and `NAV.dev` silently repointed to the theremin — leaving every pad
  binding stored but unreachable, with nothing on screen saying so. Adopting a
  new device is now something you do through the picker, not by accident.
- **The console reads its bindings from disk, not only from the relay.**
  `load()` is not role-gated and localStorage is shared between the windows,
  so the control window already knows the real mapping at boot. An early
  version returned relayed labels unconditionally — null until the show
  window happened to relay, which it never did at startup — so every launch
  showed `LEARN PREV` and a SHOW CHECK row reading "no show controller
  mapped" with a controller plainly mapped. The relay now only has to cover
  changes made *after* boot, and those always follow a control-initiated LEARN.
- **A CC bound in toggle mode will not repeat.** Rising-edge detection needs a
  value ≤63 between presses; a control that sends 127 on every press without
  an intervening 0 fires once and then never again. That is the cost of the
  edge rule, which is worth paying — the alternative double-fires every
  momentary switch. Bind such a control to a note instead.
- **A migrated PADMAP starts with an id and no name**, so the name fallback
  can't rescue it after a replug until the pad is used once — the first
  matching message backfills the name and saves.
- **Device identity is `{id, name}`, matched on id and falling back to name.**
  `MIDIInput.id` is not stable across a replug or a BLE re-pair, which matters
  for exactly the controller this is for. The MIDI-*out* path already learned
  this and persists by name (`MOut.selectPortByName`). The hands and old
  PADMAP still persist a raw id — the same latent bug, left alone here and
  worth a follow-up.
- **`nav:learn` / `nav:state`** are the LEARN round trip, the same shape as the
  hands'. The control window owns the buttons and the picker; the show window
  owns the listening. ADR-0006's split is unchanged.
- **Actions call what already exists.** prev/next are `SHOW.prev()`/`SHOW.next()`;
  slot jumps go through a new `QUEUE.goToSlot()`. That jump — resolve family id
  → tile → latest version → close-then-open → restart the dwell clock — had
  been written out four separate times before this would have made it five; it
  is now `QUEUE.goToFamily()`, with the others folded into it.
- **prev/next with nothing on stage opens the top of the set** rather than
  no-op'ing (`step()` requires `focus.idx >= 0`), because a dead pad is worst
  exactly when someone is trying to start the show.
- **SHOW CHECK gets a `Show control` row in THE RIG tier**, never worse than
  `warn`: `PRE.worst() === 'bad'` refuses to start a show, and a missing
  navigation pad must never be the reason one doesn't run.
- **Main reveals a stowed show window on `control:syncScene`.** Since ADR-0007
  the show window is hidden after CLOSE; a nav pad opens a scene *locally* in
  that window, so main never sees a `show:openScene` to un-stow it on and the
  pad would look dead while the scene ran on a hidden window.
