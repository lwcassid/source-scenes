# ABLETON RIG — derived from the nine, not from the shelf (Lance's round, Aug 2026)

The Phase-2 racking guide `SOUND-DESIGN-GOALS.md` promises, rebuilt from
first principles after Lance's verdict: **optimize for what each soundscape
needs; the instruments follow. If the palette fits, fine; if it doesn't,
unattached.** (This is the existing law — the scene casts the rig, never the
reverse — applied all the way down.)

Method: Part 1 writes each scene's timbre brief in the scene's OWN language
(from its `desc`/`sound` notes — several scenes literally specify their
instrument). Part 2 derives what the nine channels must be, as the union of
the briefs. Part 3 grades Lance's palette against that — where it answers,
where it's a compromise, what has to be sourced. Part 4 is craft: the mix
chains, sidechain wiring, and master, which are technique, not casting.

---

## PART 1 · The nine briefs (the scene's words, then the timbre it demands)

**Chladni Court — sand on a struck plate.** "Modal plate tones, beat
partners, JUST shimmer, structural bass"; a lure that breathes bass and once
in a while "a single deep bell tolls into long reverb — the sound you walk
toward from three camps away"; a sand wash; an unlock break where "every kick
pulses through the grains."
→ Demands: two pure sustained tones whose BEATING is physically exact
(browser-owned — that beating is the scene's physics); a struck resonant
metal plate; granular sand; **a deep temple-bell / tam-tam toll** — a real
struck-metal fundamental with minutes of tail; a structural sub.

**Lumen Film — light through cut stone.** "An aperture organ… every lit
burst holds one voice… doubled by a GLASS bell… a slow air bed and a root
pedal. NO PERCUSSION."
→ Demands: **glass** — blown/bowed glass organ flues (glass armonica, wine-
glass choir, breathy flue pipes), rolled entrances, zero attack transient on
the voices; real glass strikes for the bells; air.

**Ferro Bloom — a liquid-metal garden breathing warm↔cool.** "Soft triangle
voices, one per bloom… sub C underneath"; groove of "bell clave, shaker,
sparse kick"; "flicks fire log-drum answers"; cast as the Chet Faker /
neo-soul pocket.
→ Demands: warm rounded keys for the bloom voices (**electric-piano warmth —
Wurli/Rhodes territory** is the neo-soul truth, softer than felt piano);
a real **log drum / wooden mallet** for the answers; soft pocket drums —
side-stick, brushed ghost hats, a round kick; a sub that moves late.

**Ridge Loom — contour heat, the band.** The bassline "is literally written
by the picture"; "a long bowed tone… a running eighth arpeggio… a sparse
high bell"; "a bowed loom bed… **no sawtooth, no horns**."
→ Demands (the scene bans the obvious funk saw itself): **round rubbery
bass** — filtered square/triangle, Moog-ish, mono; a bowed-string lead
voice; a **clav-like** dry arp; tight DRY kit, no wash; a bowed bed.

**Weather Station — wind with a heading.** "One wind body whose gain and
filter open hard with the gale"; "a bell figure… pitch and stereo position
set by heading."
→ Demands: the wind is browser noise BY DESIGN (mirrors nothing — the body
stays web); the bells placed by heading are, from first principles, **wind
chimes / bell plates / crotales** — struck metal with air around it, placed
in stereo; a distant storm rumble for the gale peak.

**Attractor Vespers — the smoke organism.** The scene specifies its own
synthesis: the maw is "**two detuned low saws through a growling resonant
lowpass**"; the hum is one continuous voice played by the light; the churn
streams gate depth on arp CC74 "so a gate plugin in Live can take the same
motion."
→ Demands: one rich continuous **analog poly pad** whose filter rides the
measured light (this is the Tom Misch drone seat); a mono **analog growl
bass** built exactly as the scene says; a tempo-gate device on the churn
stream. Nothing struck, nothing scheduled.

**White Study — Ikeda severity meets the dancefloor.** "Mixed like a
record"; kick velocity tiers "accent 119, others ~100"; stabs whose velocity
follows flick size; the six-chord trance-minor cycle "on a serious patch";
machine-flat 16th clicks that are flat ON PURPOSE.
→ Demands: the clicks stay browser (they ARE the aesthetic); a **clean,
heavy, cold club kick**; a pumping **sub**; a stab that is SEVERE — cold,
precise, more Ikeda than lush. (This is where the earlier draft's Juno was
palette-first: Juno chorus is warm romance. Candidate A: a cold PWM/trance
pluck with no chorus. Candidate B: Jun-6 V. A/B at the rack — the scene
decides.)

**Rain Atrium — rain that earns a piano.** "Felt piano with a note budget…
small notes nearly DRY — the long reverb is saved for chord rolls, thunder
and petrichor"; rain granulated browser-side on natural time.
→ Demands: **a felt piano**, velocity-honest, close-miked and dry by
default, with the hall on a send reserved for moments. The one scene whose
brief names a palette item verbatim — the Splice felt piano is
scene-derived here, not forced.

**Event Horizon — the string wall and the swallow.** "An organ-dark string
section assembles CHAIR BY CHAIR"; "everything through the tempo gate (depth
on pad CC74 for a gate plugin in Live)"; "one enormous sub boom at totality";
then a 128-feel pocket; scars leave it "darker, heavier, forever."
→ Demands: a **dark low string ensemble** with a rhythmic gate the CC74
stream can drive (this scene is WHY the gate mapping exists); the totality
boom is **taiko-scale** — a huge low drum + sub drop, not a club kick; the
window pocket then IS the club kick. Both land on pad 36 — see the
velocity-zone answer in Part 2.

---

## PART 2 · What the channels must be (the union of the briefs)

**ch1 LEAD** — three personalities: felt piano (Rain Atrium), a bowed tone
(Ridge), a severe stab (White Study). One rack, chains; felt piano default.

**ch2 PAD** — the most divergent channel in the set, and the one that earns
the bed-note chain-selector trick first: GLASS organ (Lumen) · cathedral air
(Chladni) · ANALOG light-pad (Vespers) · dark GATED STRINGS (Event Horizon) ·
plain triangle glue (Ferro/Ridge). Four chains, selected per scene (manual to
start, chain-select on the bed note 20+SRC later).

**ch3 BASS** — one mono instrument covering a spectrum the briefs define:
structural sine sub (Chladni, EH's sub-octave stop) → round rubbery
square/tri funk (Ridge — saw banned) → pumping club sub (White Study) →
the growling detuned-saw maw (Vespers — the one seat where saw is the
spec). So: **sub core always on; a single CHARACTER macro morphing
round → bite → growl** (osc mix/warp + drive + resonance). Clean and nice at
0, teeth in the middle, the maw at the top. Sidechain-ducked by the kick
(wiring in Part 4) — and because kick is earned, the pump only exists inside
an earned groove.

**ch4 ARP** — clav-like and dry (Ridge), cutoff+resonance as THE performance
controls (CC74 is literally that stream); plus Vespers' churn arrives here as
CC74 only — so the arp chain also hosts the **tempo-synced gate** device that
motion drives.

**ch5 BELLS** — glass strikes (Lumen) · high answering bell (Ridge) · chime
plates (Weather) · the summon roll (White Study) · **the deep toll**
(Chladni — a tam-tam/temple bell, NOT a piano; the earlier draft forced the
felt piano here). Two chains: a crystal/chime strike (default) and a LOW
TOLL sampler with a long hall.

**ch6 TEXTURE** — struck resonant metal with real attack (Chladni's plate =
a hand pan is honestly the same physical object) · air (Lumen) · bowed loom
bed (Ridge). The continuous-voice mirror re-strikes on retune, so the patch
must speak on every strike, not swell in.

**ch10 PERC** — the four-bucket contract (36 kick/low · 38 crack · 42 click
· 46 air) means ONE kit serves every groove. The briefs split it two ways:
- **Character**: Ferro wants soft/brushed and lazy, Ridge wants tight and
  bone-dry, White Study wants cold club weight, the unlock windows want
  break grit. Layered pads + real velocity cover most of this (the browser
  already streams honest velocity, 28–123); dryness vs wash is a send
  question — keep the wash send modest and on 38/46 only.
- **Pad 36 has two jobs**: the club kick (White Study four-on-floor, EH's
  window pocket, Ferro/Rain backbeats) and the **taiko-scale boom** (EH's
  totality, max-energy hits). Answer: **velocity zones on pad 36** — kick
  layers across the range, a taiko + sub-drop layer only at the very top.
  The browser's `v2v` clamps every velocity to **120**, and White Study's
  accent kick is deliberately scaled to 119 — so the boom zone is exactly
  **120**, one step above the loudest club accent. Verify EH's boom `vol`
  actually reaches the clamp (vol ≥ 0.25 does) before relying on it.

**ch11 SFX** — granular weather: sand (Chladni), the wake (Vespers),
riser/impact rides on CC74 (EH). A Granulator instance fed by real recorded
material (sand, drips) plus an impact/riser sampler.

**ch12 BED** — one held atmosphere note per scene (20+SRC). A Sampler of
long real recordings; the per-scene note is also the future chain selector.

---

## PART 3 · Sourcing — the palette graded against the briefs

**Answers truthfully (use it):**
- **Splice felt piano** → Rain Atrium lead. The brief names it.
- **Arturia Augmented Strings** → EH pad chain. The gate-depth CC74 stream
  was designed around exactly this dial; the marquee mapping stands.
- **Omnisphere Hand Pan** → Chladni texture. A hand pan IS a resonant
  struck metal plate; the mirror's re-strikes are mallet strikes.
- **Omnisphere Science Class** → ch4 arp. Cutoff+res as performance
  controls is literally what CC74 streams.
- **Arturia analog classics (Prophet/Jup)** → Vespers' light-pad and the
  reference for the bass's round end. Era-honest for a continuous analog
  drone.
- **Valhalla** → the space engine on every send.
- **Splice techno/foley loops + trance kicks + break packs** → the ch10 kit
  (build notes in Part 4).
- **Sci-fi/analog atmosphere library** → ch12 bed.

**Compromise (palette *can* do it, something truer exists):**
- **Space Sax for Lumen's aperture voices** — swelling and breathy, yes,
  but the brief says GLASS. Truer: a glass armonica / blown-glass organ
  patch (Omnisphere's glass category is deep) or sampled wine-glass choir.
  Audition glass first; Space Sax is the fallback color.
- **Jun-6 V for White Study's stab** — warm/lush vs the scene's severity.
  A/B against a cold chorus-free PWM or trance pluck (Serum). Let the Ikeda
  read win.
- **Felt piano for Ferro's bloom voices** — works, but the neo-soul pocket
  points at Wurli/Rhodes warmth (Arturia has both). Audition EP first.

**Gaps (not on the shelf):**
- **A tam-tam / temple bell** for Chladni's lure toll (deep strike, long
  real tail — the toll is the scene's three-camps-away beacon and deserves
  a real instrument).
- **Wind chimes / bell plates / crotales** for Weather Station's
  heading-placed bells.
- **A log drum / wooden mallet kit** for Ferro's flick answers.
- **A taiko + sub-drop layer** for EH's totality boom (pad 36 top zone).
Cheap route: one-shot sample sourcing (a Splice evening). Better route:
the open-market instruments below, which close several gaps per purchase.

### The open market — best-in-class per brief, beyond the shelf

Ranked by briefs-answered-per-dollar:

1. **AAS Chromaphone 3** (~$199, regularly ~$99 on sale) — a physical-
   modeling instrument whose resonators are literally **plates, bars,
   membranes, beams, tubes and strings** you strike, with velocity response
   computed, not sampled. One purchase answers FOUR briefs: Chladni (the
   scene IS a modal plate — a modeled plate can even be tuned toward the
   scene's just ratios), Weather Station's chimes/bell plates, Ferro's log
   drum (wood-bar models), and modeled glass for Lumen. The strongest
   scene-first purchase on the market for this show.
2. **Soniccouture Glass Works** (~$150, runs in the free Kontakt Player) —
   the real thing for Lumen's timbre-is-the-point brief: **Glass Armonica,
   Cristal Baschet, and Cloud Chamber Bowls** (bowed articulation = pad-like
   sustains), recorded with Thomas Bloch (Radiohead/Tom Waits' glass
   player). If Lumen goes `midi` because glass is the point, this is the
   glass.
3. **u-he Diva** (~$179) — the accepted gold standard of analog emulation
   in software. Vespers' brief (one continuous analog voice + a maw of
   "two detuned low saws through a growling resonant lowpass") is a Diva
   patch almost verbatim; it also covers the era-correct funk-bass and
   cold-stab ends if Serum's versions feel too digital. CPU-hungry —
   fine here, one instance per channel.
4. **Soundiron Temple Drums** (~$40–60, Kontakt or the free Decent
   Sampler) — a 36" flat gong AND large temple drums in one library:
   closes the Chladni toll gap and the EH taiko gap in a single purchase.
   Alternatives: Riot Audio Ritual Gong Drum (deep-sampled ceremonial
   gong), Wrongtools TORUS (cinematic gongs).
5. **Pianoteq 8** (Stage ~€139) or **NI Noire** — only if the Splice felt
   piano disappoints: Pianoteq is modeled (80 MB, no samples), which means
   continuous velocity response with no layer-switching — the "velocity is
   where professional lives or dies" doctrine embodied. Noire is the
   sampled felt-concert-grand alternative with a texture engine.

**Free tier (try before any purchase):** Spitfire **LABS Soft Piano** (the
internet's default felt piano — A/B it against the Splice one), Orchestral
Tools **Layers** (free orchestral chords — audition against the EH wall),
Alan ViSta **Chau Gongs** (public-domain tam-tams, University of Iowa),
and Ableton Suite's own **Granulator III** for the ch11 sand.

---

## PART 4 · Craft — kits, chains, wiring (technique, unchanged by casting)

### The ch10 kit — build

The break-character research (Attack Magazine's beat-dissected, MusicRadar,
Reverb Machine's pack notes) on the Fred Again reference the goals doc
names: snares/hats **sliced from processed atmospheric loops** into Simpler
— the dirt in the slice is the sound; offbeat snares, two-16th rolls, heavy
velocity variation; **Drum Buss** (comp + soft drive + crunch + damp); the
signature drum reverb **~14 ms predelay, ~1.4 s decay, low-cut 250 Hz** on a
send; one clean heavy kick under the chopped break. That maps cleanly onto
the buckets: solid kick on 36, break character on 38/42/46.

- Sources, ranked: Splice **HOMAGE: Fred Again** one-shots · Lance's Splice
  techno/foley loops chopped in **XLN XO** · classic breaks (Think/Amen) ·
  a key-labeled trance-kick pack (Myloops Ultimate Trance Kicks / Allan
  Morrow) for 36 — pick the kick tuned to **A (~55 Hz)**: right for both Am
  club/finale scenes, dominant under the D scenes.
- Layer pads 2–3 deep (body + transient + air). One-shot hygiene: trim to
  transient, normalize ≈ −6 dB, HP hats/clicks 300–500 Hz.
- Per-pad **vel→vol ≈ 50–70%** (default 100% erases ghost notes), small
  vel→filter on 38/46.
- **Swing lives scene-side, never in Live** — Ableton grooves don't apply
  to live incoming MIDI. Groove Pool is only for the session-view break
  clips below.
- Group chain, in order: EQ (HP 30 Hz) → **Glue** 2:1 (4:1 for club),
  attack 10–30 ms, release Auto, 1–2 dB → **Drum Buss** (soft drive, crunch
  to taste, damp ~9–10 kHz, **Boom tuned to A**, pulled to ~50% wet) →
  parallel thump (Compressor 10:1 slammed, **Dry/Wet ~25%**) → safety
  Limiter. Sends: A tight room (~0.4 s, everything, low); B the wash
  (1.4 s, predelay 14 ms, low-cut 250 Hz inside the send) on 38/46 only.
- **Break loops as performance material**: 2–3 warped one-bar break clips in
  Session view (Groove Pool swing applies here) — the page's MIDI clock +
  song-position means they launch bar-locked over the unlock windows,
  alongside the monk vocals and Blade Runner chops. Performance layer,
  never autonomous.

### The ch3 bass — build

Tool: **Serum** (owned, does the whole spectrum), patch "SOURCE BASS":
- Sine sub osc always on (the structural floor every brief shares); Osc A
  morphable square↔saw via wavetable position; LP24; mono/legato,
  portamento ~30 ms.
- **Macro 1 = CC74 = cutoff** (universal convention). **Macro 2 =
  CHARACTER**: warp/osc blend + drive + resonance, one knob from round
  (Ridge, saw fully out) through bite (White Study) to the growling
  detuned-saw maw (Vespers, saw fully in + resonant growl). Macro 3 =
  sub/osc blend · Macro 4 = glide.
- **Sidechain**: Compressor after the rack · Audio From **ch10 group,
  Post FX** · **sidechain EQ low-pass ~150 Hz** (only the kick pumps it) ·
  4:1 · attack 1 ms · release 120–180 ms (tune at 120 BPM, check 100) ·
  3–6 dB GR. Copy at half depth onto the pad track for the club scenes.
- **Utility bass-mono below ~120 Hz** last.

### Pads, piano, bells — mixing

- Strings/pads: HP ~100–120 Hz (the floor belongs to ch3/ch12); gentle wide
  1.5–3 kHz dip — the hole-in-the-mids law as an EQ move; Glue 2:1 slow
  attack ~1 dB; Valhalla on the send, insert dry-ish so EH's gate stays
  legible; wide but mono-checked.
- Felt piano: velocity ON; HP 60 Hz; Compressor 2:1 **slow attack ~30 ms**
  (keep the felt thump); a whisper of Saturator; room send ~15%, dry by
  default per the Rain brief — the hall is spent on moments.
- Bells ch5: strike chain dry-ish into place; the TOLL chain 40–60% wet
  into a 4–8 s Valhalla — one deep note into a cathedral.

### Master — a PA on playa, not Spotify

1. Gain-stage so White Study fully open peaks ≈ **−6 dB** on the master —
   the loudest scene defines the ceiling; the ambient five sitting lower IS
   the set's arc. Don't crush it.
2. EQ Eight: HP 25 Hz, broad strokes only.
3. Glue 2:1, attack 30 ms, release Auto, **≤ 2 dB** at peak.
4. Limiter ceiling −1 dB — insurance, not loudness. Working hard = fix gain
   staging.
5. Soundcheck: White Study's drop at show volume sets the PA; never touch
   the master chain mid-show.

---

## Browser blend vs. timbre-first — the OUT casting

Per-scene (Lance's verdict): keep the browser in the mix where its character
is part of the piece; go rack-only where timbre quality IS the point. Lands
in `setlists.json` as each scene's `out` once the rack exists; until then
everything stays web.

| Scene | OUT | Why |
|---|---|---|
| Chladni Court | **both** | The just-ratio plate beating IS the physics — irreplaceable. Rack dresses it. |
| Lumen Film | **midi** | Glass is the point; the browser sine stack is the sketch of it. |
| Ferro Bloom | **both** | The soft drone has charm; rack supplies pocket drums + EP warmth. |
| Ridge Loom | **midi** | The band deserves real instruments; browser plucks read cheap at 96 BPM funk. |
| Weather Station | **both** (forced) | The wind body is browser noise by design — mirrors nothing. |
| Attractor Vespers | **midi** | One continuous synth; the analog pad ridden by the light is the upgrade. |
| White Study | **both** | The Ikeda clicks are browser-perfect on purpose; rack adds kick weight, sub, stab. |
| Rain Atrium | **both** (forced) | Rain is a pure-noise bed by design; the piano rides MIDI. |
| Event Horizon | **both** | The wall + gate carries in-browser; Augmented doubles into the marquee mapping. Review after racking. |

("Forced" = deliberate browser-only material; `midi` there is a bug, not an
option.)

---

## PART 5 · The racking walkthrough, prioritized (~3h, quick wins first)

Ordered by payoff-per-minute: hear a real upgrade inside the first half hour,
save the long jobs for when the pipeline is proven. Every rack has a console
test — with the page open and OUT on BOTH, DevTools console can fire any
channel in isolation (`MOut.evNote(role, freq, vol, 0, dur)`,
`MOut.evDrum(note, vol)`, `MOut.expr(role, v)`), which also solves MIDI-map
mode: `MOut.expr('pad', Math.random())` emits ONLY CC74 on ch2, so Live's
mapping can't be stolen by the CC1/CC2 hand streams.

- **R0 · Pipeline (10 min).** Audio MIDI Setup → IAC Driver online. Live
  MIDI prefs, IAC input: Track ON, Sync ON, Remote ON (needed for CC
  mapping; Live mappings are channel-aware). EXT pressed, page CLOCK on →
  Live's tempo follows the scene. Test: open any scene, Live's MIDI-in dot
  blinks, tempo reads the scene's BPM.
- **R1 · PAD ch2 (15 min).** One track, MIDI From IAC ch2, Instrument Rack,
  Sacred Shrine (or any analog pad), Macro 1 → cutoff/brightness, Cmd+M →
  click Macro 1 → `MOut.expr('pad', Math.random())` twice → done. Eight of
  nine scenes upgrade instantly. Test scene: Lumen (voices), Vespers (the
  light rides CC74).
- **R2 · BASS ch3 (25 min).** Serum patch per Part 4 (sub always on,
  square↔saw morph, CHARACTER macro). No sidechain yet. Test:
  `MOut.evNote('bass', 55, 0.25, 0, 1.5)`, then Ridge Loom's left hand.
- **R3 · DRUMS ch10, v1 (45–60 min).** Drum Rack, pads 36/38/42/46 from
  samples already on disk (proper sourcing is its own evening — Part 3
  gaps + HOMAGE pack). Per-pad vel→vol ~60%. Group chain + sends per
  Part 4. Test: `MOut.evDrum(36, 0.32)` … `(38, 0.2)` … `(42, 0.1)` …
  `(46, 0.1)`; `MOut.evDrum(36, 1)` proves the vel-120 boom zone. Then
  White Study's kick tiers, Ferro past 55% spread.
- **R4 · Sidechain (10 min).** Now the key source exists: bass Compressor
  keyed to the ch10 group (Post FX, sidechain EQ LP ~150 Hz, 4:1, 1 ms,
  ~150 ms, 3–6 dB); copy at half depth to the pad track. Test: White
  Study's drop — the pump should breathe with the kick and vanish when
  drums stop.
- **R5 · LEAD ch1 + BELLS ch5 (20 min).** Felt piano per Part 4; bells =
  crystal/chime chain + TOLL chain (placeholder low bell into 8 s Valhalla
  until the real tam-tam is sourced). Test: `MOut.evNote('bells', 98, 0.2,
  0, 4)`, then Rain Atrium.
- **R6 · TEXTURE ch6 + ARP ch4 (15 min).** Hand Pan; Science Class. Wire
  Vespers' churn: MIDI-map arp-ch4 CC74 (`MOut.expr('arp', Math.random())`)
  to a tempo-synced Auto-Pan amount ON THE PAD TRACK — the gate stream
  throbs the hum. Test: Chladni detents (texture), Vespers under hands
  (churn).
- **R7 · SFX ch11 + BED ch12 (20 min).** Granulator on sand/drips;
  atmosphere Sampler. Test: `MOut.sfxNote(38, 0.7, 3)`;
  `MOut.bedOn(48)` / `MOut.bedOff()`.
- **R8 · MASTER (10 min).** Gain-stage against White Study fully open
  (≈ −6 dB), then the Part 4 master chain.
- **R9 · Cast the OUT column.** A/B every scene at both; flip Lumen /
  Ridge / Vespers to midi and listen for what the browser was still
  contributing. **Fill `rig.json` in the same breath as every rack** —
  honest beats aspirational.

### Buses and the pad controller (sanity checks, Aug 2026)

- **Channel math**: a MIDI port carries 16 channels; each IAC bus is its own
  port, so Bus 1 + Bus 2 = 32 channels — the understanding is right. But the
  page speaks ONE output port at a time (MOut's device picker), using 9 of
  Bus 1's 16 channels, so **7 channels (7–9, 13–16) are still free before
  Bus 2 costs a code change** (a second MOut port — small, do it when a real
  need shows up, not before). Meanwhile **reserve Bus 2 as the performance
  lane**: the pad controller / Lance's own playing into Live, kept off the
  page's bus. If Bus 2 is enabled in Live, leave its **Sync OFF** — two
  clock sources fight.
- **4×4 pad scene-switching**: the page's MIDI-in parser currently ignores
  note messages entirely (only CC/bend/aftertouch feed the hand system), so
  pad notes are a clean, collision-free namespace. Planned design: a PAD
  LEARN in the queue drawer — press the bottom-left pad once, the page
  captures note+device and maps 16 consecutive notes to QUEUE SLOTS 1–16 in
  running order (device-filtered, so drum pads never read as hands); a pad
  press opens that queue entry with its show settings and resets the
  SHOWTIME clock. Works in PLAY mode with panels off — that's the point:
  scene changes from the source, no computer touch. Hardware note: the
  laptop still runs the show — the pad reaches it by USB-C or Bluetooth
  MIDI (macOS BLE MIDI is native and Chrome's Web MIDI sees it). The actual
  unit is an **M-VAVE SMC-PAD** (16 velocity pads, 8 assignable knobs, BLE +
  USB-C, battery). Its default note layout is undocumented and
  preset-dependent — exactly why the mapping is a LEARN, not hard-coded
  notes. Its 8 knobs send CCs, which the existing hand LEARN already
  accepts: a knob can stand in for a hand in a pinch, or map to Live macros
  over the Bus-2 lane. Playa caveat: BLE is fine in the cave, but pack the
  USB-C cable — radio last-resorts to copper.

Sourcing evening (separate, unblocks nothing above): HOMAGE: Fred Again
one-shots, a trance kick tuned to A, tam-tam/temple bell, wind
chimes/plates, log drum, taiko + sub-drop — then relayer the kit pads.

Research sources: [Attack Magazine — beats inspired by Fred
Again](https://www.attackmagazine.com/technique/beat-dissected/breaking-down-how-to-make-beats-inspired-by-fred-again/) ·
[MusicRadar — Fred Again style track](https://www.musicradar.com/news/make-a-fred-again-style-track-free-samples) ·
[Splice HOMAGE: Fred Again](https://splice.com/sounds/collections/splice/jbwvedrbqnt1lcr6gacfutn3xwg/samples) ·
[Reverb Machine Future Garage pack](https://reverbmachine.com/sounds/future-garage-fred-again-sample-pack/) ·
[Vidro Breaks Vol 1](https://cisumaudio.gumroad.com/l/vidrobreaksvol1) ·
[Myloops trance kicks guide](https://www.myloops.net/the-best-trance-kick-sample-packs) ·
[drum-bus practice](https://www.musicguymixing.com/drum-bus/).
