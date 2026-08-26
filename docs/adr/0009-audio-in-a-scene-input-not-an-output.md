# Audio in is a scene INPUT, engineered like MIDI-in — not a variation on sound output

Status: accepted.

Every scene until now spoke in one direction: hands in, picture and sound
out. Cell Front V4 (grill-me session) is the first scene that LISTENS — a
live mic or line-in becomes the picture, and the scene makes no sound of its
own. This is a new model, not a one-off hack on Cell Front, and it needed a
decision before the first scene could be built on it: what does "a scene
reacts to audio" actually mean as an engine capability.

## Decision

**`AUDIOIN`** is a new subsystem (`parts/part2e_audioin.js`), architecturally
parallel to the hands' MIDI-in and following its exact precedent
(ADR-0006/0008): real capture and analysis is **show-window-only**
(`getUserMedia`, `AnalyserNode`), the control window only ever sees a relayed
device list + a light status (connected/denied/device/level), same combined
push shape `midi:devices` already uses. Works identically in the plain
browser — there's only one window there, so the split simply collapses.

**The signal scenes read is small and fixed, not raw FFT bins.**
`inp.audio = {level, bass, mid, treble, onset, pan}`, built in the same place
`inp.L`/`inp.R` already are (`part5_tail.js`'s `frame()`). `level`/`bass`/
`mid`/`treble` get engine-side attack/release smoothing before a scene ever
sees them (fast up, slower release — a VU-meter shape); `onset` stays raw,
un-smoothed peak-detection on broadband energy so hit-timing stays tight;
`pan` is stereo balance, recomputed fresh every frame, needing no calibration
of its own. A scene that wants more resolution than this is an explicit
future escape hatch, not the default — consistent with the rest of the Piece
API staying deliberately small.

**Self-widening range, reusing CAL's exact shape** (`AUDIOIN.cal.lo/hi` per
band), not a fixed dB scale — a quiet acoustic set and a hot DJ mix both need
"loudest so far reads as 1.0." **SET REST** is a real action here too (same
1.6s median-sample shape as the hands'), even though audio's continuous 0..1
mapping doesn't strictly need a presence gate the way hand idle-detection
does — REST pulls the self-widening floor down to a deliberate reading
instead of waiting for the show to organically pass through true silence.

**Capture is connect-once, then continuous for the whole show** — not gated
to whichever scene has `audioIn` open, mirroring MIDI (connect once, stays
live regardless of which scene is focused). The alternative (start/stop with
scene lifecycle, like MIDI clock) was considered and rejected: switching
between an audio-reactive scene and a hand-driven one would reconnect the
mic every time, and the library wall's own ambient tile rendering already
calls every scene's `step()` continuously — an audio-reactive tile on the
wall should breathe with the room too, not only when focused.

**A scene declares the need explicitly**: `reg({audioIn: true, ...})`, same
shape as `music: {...}`. SHOW CHECK's AUDIO IN row is therefore
**conditional** — the one row in THE RIG tier that doesn't always appear,
checked against whatever's currently open or queued (`PIECES[...].audioIn`).
Unlike NAV's always-shown "Show control" row (real optional hardware that's
*always* potentially relevant), most scenes never touch audio input at all,
so an unconditional row would be noise for the common case. Severity never
worse than `warn`, same rule as every other optional-hardware row — a
missing mic must never be the reason a show doesn't start.

**Hands are never disabled.** `inp.audio` is a genuinely independent third
input, not a replacement for `inp.L`/`inp.R` — Cell Front V4 blends them
itself (`Math.max(audioBand, handValue)`), so a facilitator can always play
the scene by hand if the audio chain is down, and a scene author can choose
per-scene whether hands should be able to override, ignored, or blended.
Silence (no signal, or nothing connected) gets the exact same idle-breathing
drift every other still scene gets — there is no engine-level concept of
"this scene is dead," only "this scene is quiet right now."

**A test hook, `setAudioIn({level, bass, mid, treble, onset, pan})`, ships
with the model itself**, mirroring `setChan`. Without it, an audio-reactive
scene is untestable in the sandboxes `playtest.js`/`shotcam.mjs` run in —
no real mic exists there — and would ship without the "shoot idle/minimal/
full states, read the PNG" verification path every other scene gets by
default.

## Consequences

- `AUDIOIN.tick()` must check a `_testOverride` flag before touching
  `level`/`bass`/`mid`/`treble`/`onset` — without it, the no-device decay
  branch (which exists so a mid-show disconnect actually reads as silence
  rather than freezing at the last value) zeroes `onset` on the very next
  animation frame after `setAudioIn()` sets it, before a scene's `step()`
  ever gets to read the edge. Caught by writing Cell Front V4's own
  verification harness against this exact bug — `BLOOMS 0/6` no matter how
  many synthetic onset pulses were sent, until the flag was added.
- Chrome's default `getUserMedia` audio constraints (echo cancellation,
  noise suppression, auto-gain) are tuned for voice calls, not music — all
  three are explicitly disabled in the constraint object, or a quiet passage
  gets gated toward silence and a loud one gets flattened before the scene
  ever sees it.
- The mono band analysis (bass/mid/treble) and the stereo pan calculation
  use two separate analyser paths off the same source — one `AnalyserNode`
  with `channelCount` forced to 1 (so a stereo source downmixes L+R
  together for the band split, per Cell Front V4's warm=bass/cool=treble
  decision), and a `ChannelSplitterNode` feeding two small time-domain
  analysers purely for per-channel RMS → pan. Doing band analysis on a
  forced-mono node and pan on a separately-split stereo pair was simpler
  than trying to extract both from one graph.
- Calibration for audio collapses the hands' two-tier model (per-side
  `lo/hi` + a separate presence-only `rest`) into one shared REST sample
  across all four bands (`level`, `bass`, `mid`, `treble`) — there is one
  signal here, not two hands, so one SET REST action covers all of it, and
  the sampled rest value directly pulls each band's self-widening floor
  down rather than existing as a separate presence gate the way the hands'
  `rest` does.
- Not built: per-scene override of the global band-split Hz boundaries
  (`AUDIOIN.BANDS`), though the shape leaves room for one in a scene's
  `audioIn` config object if a future scene wants a narrower band than the
  global default. Also not built: a live raw-value stream to the control
  window (the hands' calibration box has the same gap, same reason —
  nothing has needed it enough yet to justify the extra relay).
