# SHOW KIT — running SOURCE on-playa (no internet!)

**The trap:** the live Netlify site loads three.js from a CDN. There is no
internet at Burning Man. The deployed site WILL NOT render 3D scenes on-playa.

**The show artifact is the OFFLINE BUILD:** `tools/build_preview.py` produces
a single self-contained HTML file (~25MB) with three.js vendored and every
model inlined. It runs from a local file with zero network. That file — not
the URL — is what the projectors play.

## Before leaving for the burn (the checklist)

1. Freeze the set: final versions pushed, set list starred in the library
   (SHOWTIME mode plays starred scenes; 10-min auto-advance).
2. From a fresh `git pull`:
   `bash tools/build.sh && python3 tools/build_preview.py`
3. Copy the offline file to: the show laptop, TWO usb sticks, and a phone.
4. **Rehearse with wifi OFF**: open the file in Chrome, fullscreen (hover top
   edge → STAGE), confirm scenes render, sound plays, MIDI OUT reaches
   Ableton, theremins bind via MAP (bindings persist in the browser — bind
   them on the SHOW laptop, not yours).
5. Chrome flags for the show machine: autoplay may need one click to start
   audio — click before handing it to strangers.

## The rig (from the projector plan)

- 2× Panasonic PT-VMZ50 (WUXGA), fed IDENTICALLY off one HDMI splitter from
  the show laptop. One render, cloned — nothing to configure in software.
- Laptop → Ableton: browser MIDI OUT → IAC/loopMIDI virtual port → Live.
  Roles→channels: lead 1 · pad 2 · bass 3 · arp 4 · bells 5 · texture 6 ·
  perc 10 · sfx 11 · bed 12; CC74 per channel = layer energy; CC1/CC2 raw
  hands. Set Live's tempo to the scene BPM (DBG strip shows it). Buffer 128.
- Theremins: MAP in the header, range-based learn (move each hand ~2.5s).
- The DBG strip (bottom of fullscreen) shows scene/act, hand values + mode,
  MIDI bindings, port, next-scene countdown, FPS — read it when anything
  feels wrong before touching cables.

## On-playa recovery moves

- Scene misbehaving → switch scenes (edge click), or REGEN reseeds it.
- Audio dead → one click on the page (autoplay policy), check SOUND: ON.
- MIDI dead → RIG panel: confirm port; Ableton: confirm track monitoring IN.
- Everything dead → reopen the HTML file; state (favorites, bindings)
  persists per-browser. Worst case: second USB stick, second laptop.
- FPS sagging in dust/heat → close other apps; the wall alone must own the
  GPU. Mobile-class fallback: any phone can open the same file for a tiny
  emergency wall.
