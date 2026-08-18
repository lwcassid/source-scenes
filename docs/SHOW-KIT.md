# SHOW KIT — running SOURCE on-playa (no internet!)

**The trap:** the live Netlify site loads three.js from a CDN. There is no
internet at Burning Man. The deployed site WILL NOT render 3D scenes on-playa.

**The show artifact is the OFFLINE BUILD:** `tools/build_preview.py` produces
a single self-contained HTML file (~25MB) with three.js vendored and every
model inlined. It runs from a local file with zero network. That file — not
the URL — is what the projectors play.

## Before leaving for the burn (the checklist)

0. Publish the set to the repo: build it in the browser, COPY FOR REPO, paste
   into `setlists.json` (or hand it to Claude in a session), commit and push.
   That file is baked into the build, so the offline show artifact CARRIES the
   running order — the show laptop no longer depends on someone remembering to
   open a `#set=` link on it. Mark the one you're performing `default: true`.
1. Freeze the set: final versions pushed, then build the PERFORMANCE QUEUE —
   tick each scene's checkbox on the wall, open the QUEUE drawer in the header
   and drag the order into the shape you want the night to have. That list is
   the show: SHOWTIME walks it in queue order, screen edges step it, 10-min
   auto-advance. Empty queue = the wall plays all 43 in library order, which
   is not a set. COPY LINK shares the queue as a `#set=` URL — that is how you
   get the same running order onto the show laptop.
2. From a fresh `git pull`:
   `bash tools/build.sh && python3 tools/build_preview.py`
3. Copy the offline file to: the show laptop, TWO usb sticks, and a phone.
4. **Rehearse with wifi OFF**: open the file in Chrome, fullscreen (hover top
   edge → STAGE), confirm scenes render, sound plays, MIDI OUT reaches
   Ableton, theremins bind via MAP (bindings persist in the browser — bind
   them on the SHOW laptop, not yours).
4b. **Run SHOW CHECK** (QUEUE drawer → SHOW CHECK). It is the pre-flight: one
   line per system — sound, set list, hands, calibration, Ableton, tempo,
   frame, display — each saying what it FOUND, with a fix button that solves
   it right there. Green everything before you hand the wall over. Amber is a
   judgement call (no controller bound is fine if you're driving by mouse);
   red means the show will not work.
4c. **Check the DISPLAY row** — it picks the external screen automatically and
   turns amber if the show is aimed at the laptop's built-in display, which is
   the classic way to hit PLAY and watch nothing reach the projectors.
5. **Confirm the frame** (SHOW CHECK's FRAME row says this too): the projector frame (exactly 1920×1200 / 16:10) is
   the default on desktop, so nothing to configure — but VERIFY: the DBG
   strip's `FRAME` line must read `1920×1200 · 1.60 · PROJ` before you hand
   the wall to the camp. If it doesn't, someone toggled it — press `P` on the
   stage (or drop any `?win` from the URL) to pin it back.
6. Chrome flags for the show machine: autoplay may need one click to start
   audio — click before handing it to strangers.

## The rig (from the projector plan)

- 2× Panasonic PT-VMZ50 (WUXGA), fed IDENTICALLY off one HDMI splitter from
  the show laptop. One render, cloned — nothing to configure in software.
- Laptop → Ableton: browser MIDI OUT → IAC/loopMIDI virtual port → Live.
  Roles→channels: lead 1 · pad 2 · bass 3 · arp 4 · bells 5 · texture 6 ·
  perc 10 · sfx 11 · bed 12; CC74 per channel = layer energy; CC1/CC2 raw
  hands. Buffer 128.
- Theremins: MAP in the header, range-based learn (move each hand ~2.5s).
- The DBG strip (bottom of fullscreen) shows scene/act, hand values + mode,
  MIDI bindings, port, next-scene countdown, FPS — read it when anything
  feels wrong before touching cables.

## Starting the show

Build the queue, then **▶ PLAY** in the QUEUE drawer. PLAY does three things
you would otherwise do by hand: opens the first queued scene, forces
**performance mode** (picture only — the PANELS preference persists between
sessions and would otherwise leave the MIDI console sitting over the show),
and goes fullscreen **on the display you picked in SHOW CHECK**. If anything
is red, PLAY opens SHOW CHECK instead of starting a broken show; START THE
SHOW there overrides and goes anyway.

During the show: PANELS (or `H`) brings the hands/MIDI/console back over the
picture, the DBG tab at the bottom is the truth window, and the screen edges
step the queue.

One tab renders one picture. Picking a display sends the SHOW there — it does
not give you a separate control window on the laptop. Control happens on top
of the picture, via PANELS and DBG.

## MIDI clock — Live follows the scene

The wall runs 43 scenes at tempos from 50 to 132 BPM. It now sends **MIDI
clock** (24 PPQN), so Live re-locks to each scene on its own instead of
someone retyping the tempo in the dark.

- Header: **CLOCK: ON** (next to the port picker). Persists across reloads.
- Live: Preferences → Link/Tempo/MIDI → this input port's **Sync** switch on,
  then press **EXT** in the transport bar.
- Opening a scene sends song-position 0 then Start; closing it sends Stop, so
  every scene change re-pins Live to 1.1.1 at the new BPM.
- Live ignores clock entirely when Sync is off, so leaving CLOCK on costs
  nothing if you'd rather drive the tempo by hand.
- Check it: the DBG strip's `CLOCK` line reads `RUNNING <bpm> BPM` while a
  scene is up.

## Calibration — what the sensors say vs. what the scenes expect

Every scene is written against one contract: **at the source = 0, arm's reach
= 1**. Real sensors don't know that, so the MAP panel has three fixes. Do this
once on the show laptop; it persists.

1. **LEARN L / LEARN R** — sweep each hand through its whole range. The
   measured range is now KEPT, so full reach actually arrives at 1.00 (before,
   a sensor that really travels 0.15–0.72 handed the scenes 0.15–0.72). The
   range also keeps widening on its own as the hardware drifts with heat.
2. **INVERT L / INVERT R** — flip a hand if the readout *drops* when you reach
   outward. Whole library depends on the polarity being right.
3. **SET REST** — stand everyone clear of the instrument and press it. A laser
   rangefinder streams a value whether or not a hand is in front of it, so
   "a message arrived" is not "someone is playing". REST is what presence gets
   measured against; without it, scenes never go idle and the wall never
   teases passers-by. Re-do it if you move the sensors or the pedestal.

The panel's readout shows the whole chain live — `raw → out`, the range, the
rest point, and whether each hand reads PLAYING or idle. The DBG strip carries
the same on its `MIDI IN` line. `NO-REST` there means step 3 hasn't been done.

## On-playa recovery moves

- Scene misbehaving → switch scenes (edge click), or REGEN reseeds it.
- Audio dead → one click on the page (autoplay policy), check SOUND: ON.
- MIDI dead → RIG panel: confirm port; Ableton: confirm track monitoring IN.
- Live's tempo not following → header CLOCK: ON, and Live's port Sync + EXT.
- Hands feel weak / never reach full → MAP: re-LEARN that hand and sweep the
  WHOLE range. Backwards → INVERT. Scenes never resting → SET REST.
- Wall acting played-with when nobody's there → SET REST (a drifting sensor
  moved off its old rest point).
- Everything dead → reopen the HTML file; state (queue, calibration, bindings)
  persists per-browser. Worst case: second USB stick, second laptop.
- FPS sagging in dust/heat → close other apps; the wall alone must own the
  GPU. Mobile-class fallback: any phone can open the same file for a tiny
  emergency wall.
