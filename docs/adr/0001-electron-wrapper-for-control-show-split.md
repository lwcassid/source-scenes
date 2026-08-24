# Electron wrapper for a real control+show display split

Status: accepted

The web app cannot put a control UI on one screen and the fullscreen show on
another from a single tab: Chrome's Fullscreen API refuses to let one window
trigger fullscreen on a different window, even same-origin, even from the
gesture that opened it (`requestFullscreen` throws `Permissions check
failed` when called cross-window — confirmed empirically, not assumed). So
`CLAUDE.md`'s "one tab = one picture" law is a real platform limit, not a
missing feature. We're wrapping the app in Electron: a **show window** that
owns the full engine exactly as today (AudioContext, Web MIDI in/out, scene
rendering, transport — forced to live here since WebAudio/WebGL need a live
document) and fullscreens onto the projector display via a native,
main-process `BrowserWindow.setFullScreen()` call, which isn't subject to
the same-document-gesture restriction; and a **control window** that is the
existing app's UI reused as-is (rail, library, queue, SHOW CHECK, DBG —
nothing rebuilt), instance-flagged to never own audio/MIDI/canvas, relaying
commands to the show window over IPC and rendering its telemetry back.

## Considered options

- **Tauri** instead of Electron: ruled out on a hard fact, not preference —
  Tauri wraps the OS webview, which on macOS is WKWebView, and WebKit has
  never shipped the Web MIDI API (cited fingerprinting concerns, no
  roadmap as of 2026). This app's entire Ableton-out path is Web MIDI, so
  Tauri silently loses a load-bearing feature with no fix short of hand-
  rolling a native CoreMIDI bridge.
- **Stay pure-web, drop the control+show split**: rejected — the split is a
  must-have for this show, not a nice-to-have, and the platform limitation
  above is unconditional in a browser tab.
- **Control window as a new, purpose-built minimal panel** (just PLAY /
  QUEUE / SHOW CHECK) instead of reusing the full app UI: rejected — the
  existing control UI already does this job and stays in sync with
  `part5_tail.js` for free; a parallel minimal panel is avoidable work that
  drifts.

## Consequences

- Scope is additive only: the plain web app (Netlify, `tools/verify.sh`,
  the browser-based scene dev/preview loop in `docs/PREVIEW.md`) keeps
  working completely unchanged. Electron is a new way to *run* the show,
  not a replacement for how scenes get built, previewed, or verified.
- Packaging bar is low by design: unsigned/unpacked, for known show
  laptop(s) only. No macOS notarization or public distribution is in
  scope — revisit this ADR if that changes.
