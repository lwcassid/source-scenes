# ABLETON RIG — the universal instruments (Lance's round, Aug 2026)

The Phase-2 build plan that `SOUND-DESIGN-GOALS.md` promises: what actually
goes on the nine role channels, how each is mixed, and the exact Live wiring —
so one evening of racking serves all nine scenes of THE MAGNIFICENT NINE.
The reuse principle governs everything here: ONE Live set, nine Instrument
Racks, scene identity comes from the MIDI each scene already streams plus
CC74. A quality investment in any channel multiplies ×9.

Two structural facts make "universal" actually work:

- **The four-bucket drum contract.** Every scene's percussion funnels into
  the same four pads (36 kick/low · 38 crack · 42 click · 46 air) because
  `A.hit` buckets by brightness and `A.kick`/`A.hat` land on 36/46. Build ONE
  great kit and every groove in the set — Ferro's pocket, Ridge's band, White
  Study's club, the unlock-window breaks — plays it.
- **Sidechain follows earned drums for free.** Scenes only send kick when the
  groove is earned, so a sidechain keyed to the kick pumps exactly when the
  doctrine says the music should pump, and is silent in every ambient state.
  Zero per-scene configuration.

---

## CH 10 · PERC — the kit (trance weight, Fred Again breaks)

### What the reference actually is

The Fred Again drum sound, per the production breakdowns (Attack Magazine's
beat-dissected, MusicRadar's style guide, Reverb Machine's pack notes):

- Snares and hats are **sliced from processed, atmospheric loops** (breaks,
  foley, found sound) into Simpler — not pristine drum-machine hits. The dirt
  and room in the slice IS the sound.
- Groove: offbeat snare placement, two-16th snare rolls, **heavy velocity
  variation** for human energy, swing on everything.
- Processing: **Drum Buss** (comp + soft drive + crunch + damp), and a big
  characteristic **drum reverb — ~14 ms predelay, ~1.4 s decay, low-cut at
  250 Hz** — on a send, so hits bloom into a wash without the lows smearing.
- Under the break: one clean, heavy four-on-floor-capable kick (his club-era
  tracks layer a solid kick under the chopped break).

That last point is where the trance-kick request fits: the trance kit and the
break kit are the **same Drum Rack** — trance-grade kick on pad 36 for weight,
break-sliced crack/click/air on 38/42/46 for character.

### Sample sources (ranked)

1. **Splice · HOMAGE: Fred Again** — curated one-shots + transitions in his
   style, ready for drum racks. First stop for 38/42/46.
2. **Lance's own Splice techno + foley loops** chopped to one-shots in XLN XO
   (already the rig.json plan — XO's similarity map is the right chopper).
3. **Classic breaks** (Think, Amen, Apache) — public-domain-adjacent staples;
   slice for character pads and keep 1-bar loops for the unlock windows.
4. **Myloops · Ultimate Trance Kicks** (200 kicks, key-labeled, pre-processed)
   or Allan Morrow's Heavy Trance Kicks — for pad 36. Key-labeling matters:
   see tuning below.
5. **Vidro Breaks Vol 1** / Reverb Machine's **Future Garage** pack (182
   one-shots cut on 808/DDM-110/Mother-32 hardware) — depth on the break side.

### Building the rack

- One **Drum Rack**, pads 36/38/42/46 as the contract lanes. Extra pads are
  fine (White Study's `evDrum(36)` boom can get its own 36-layer); the four
  lanes are the guarantee.
- **Layer each pad** (2–3 samples inside an instrument rack on the pad):
  36 = trance kick body + a soft beater transient; 38 = break snare + rim or
  clap air; 42 = rimshot/click; 46 = break hat + a shaker/air tick.
- **Tune the kick.** The set's roots are D·D·C·C♯·G·G·A·D·A. One kick tuned
  to **A (~55 Hz)** sits right for the two club/finale scenes (White Study,
  Event Horizon, both Am) and works as the dominant under the D scenes. The
  key-labeled trance packs make this a browse filter, not a job. (Per-scene
  kick tuning via the bed-note chain selector is the later trick; one A kick
  first.)
- **One-shot hygiene** while chopping: trim leading silence to the transient,
  peak-normalize to about −6 dB so the pad mixer does the balancing, high-pass
  the hats/clicks (300–500 Hz) so break rumble doesn't stack under the kick.
- **Velocity is already real** — the browser mirrors every hit's `vol` as
  per-note velocity (28–123). In each pad's Simpler set **vel→vol ≈ 50–70%**
  (default 100% makes ghost notes vanish) and a small vel→filter amount on
  38/46 so hard hits open up. This is where the earned-groove dynamics land.
- **Swing lives scene-side, not in Live.** Ableton's Groove Pool only applies
  to clips — live incoming MIDI bypasses it. Scenes write their own drag
  (Ferro's laid-back backbeat, Ridge's proposed ~55% 16th swing); don't try
  to add feel in Live, you can't. Groove Pool IS right for the session-view
  break clips below.

### The mix chain (on the ch10 group)

In order — compression clean first, color after:

1. **EQ Eight** — HP 30 Hz; small wide dip ~350 Hz only if the layered kit
   muds up.
2. **Glue Compressor** — ratio 2:1 (up to 4:1 for the club scenes), **attack
   10–30 ms** so transients pass, release Auto, 1–2 dB of movement. This is
   glue, not pump.
3. **Drum Buss** — the Fred move: soft Drive, Crunch to taste on the mids,
   Damp ~9–10 kHz to take the sample-pack fizz off, **Boom tuned to A** to
   reinforce the kick fundamental, then pull **Dry/Wet back to ~50%** so it
   reads as attitude, not a blanket.
4. **Parallel thump** — a Compressor set stupid (10:1, fast attack, slammed),
   **Dry/Wet at ~20–30%**. New-York compression without extra routing.
5. **Limiter** — safety ceiling only, no visible GR in normal play.

Sends: **A = tight room** (~0.4 s, low amount, everything) for placement;
**B = the Fred wash** (Valhalla VintageVerb, 1.4 s, predelay ~14 ms, EQ
low-cut 250 Hz **inside the send chain**) — generous on 38/46, never on 36.

### Break loops as performance material

Keep 2–3 one-bar classic-break clips in Session view on a separate audio
track, warped, Groove Pool swing applied. The page's MIDI clock (24 PPQN +
song-position + start/stop) means they launch bar-locked to whatever scene is
up — material for Lance to fly in over the unlock windows (Chladni's rail
secret, Event Horizon's 45 s), alongside the monk vocals and Blade Runner
chops. Performance layer, never autonomous.

---

## CH 3 · BASS — clean, but it can bite

**Instrument: Serum** (owned, reliable, exactly this brief). One patch,
"SOURCE BASS":

- Osc A: saw, unison 2–3 at slight detune, warp available for grit.
- Sub osc: sine, always on, one octave down — the clean structural floor.
- Filter: LP 24, mostly open at rest.
- Amp env fast-attack; ~40 ms release; **mono, legato, portamento ~30 ms**
  (the browser's bass lines are mono figures; Ridge's bassline especially).

Rack macros (this is the whole point):

- **Macro 1 = CC74 = cutoff** (the universal convention — every scene's bass
  energy already streams here).
- **Macro 2 = BITE**: one knob mapped to Serum distortion drive + a touch of
  filter resonance + osc warp amount. At 0 it's the clean Night-Rider-style
  fat synth; at 70 it's got teeth for Ridge Loom's funk and White Study's
  pump. Set per scene by hand (or later: bed-note chain selector).
- Macro 3 = sub/osc blend · Macro 4 = glide time.

Era-correct alternative in the same rack as a second chain: an Arturia Jup-8 V
mono patch (goals-doc candidate). And Lance's 80s Night-Rider bass sample in a
Simpler chain if a scene wants exactly that record.

**Sidechain — the wiring:**

1. On the bass track, **Compressor** after the rack.
2. Sidechain ▸ **Audio From: the ch10 drum GROUP, Post FX**.
3. **Enable the sidechain EQ: low-pass ~150 Hz** — only the kick pumps it;
   hats and cracks don't chatter the bass.
4. Ratio 4:1 · attack 1 ms (fast is correct for ducking) · **release
   120–180 ms** (≈ an 8th at 100–120 BPM; one setting reads fine across the
   set's tempos — tune by ear at White Study's 120, check it doesn't gasp at
   Ferro's 100) · 3–6 dB GR when the kick runs.

Because kick = earned, this pump only ever exists inside an earned groove.
Ambient scenes never touch the threshold. Copy the same compressor at HALF the
GR (2–3 dB) onto the pad track for the two club scenes' sidechained-pad feel
(toggle it off is one click if it leaks into the ambient five — but it
shouldn't, same reason).

Mix: **Utility "Bass Mono" below ~120 Hz** at the end of the chain (scrim PA
doesn't reward wide sub), and let CC74 do the rest — the browser already rides
it.

---

## CH 2 · PAD / STRINGS

Two chains in one rack, chosen per scene (manual to start):

- **SHRINE** (default): Omnisphere Sacred Shrine — cathedral ambient, zero
  tooth. Macro 1 → filter/brightness.
- **STRINGS**: Arturia Augmented Strings. Macro 1 → **the gate dial** (plus a
  small brightness co-mapping). Event Horizon streams gate depth as pad CC74
  by design — this is the marquee mapping of the show: the plugin throbs with
  the picture.

Mixing strings/pads so they stay expensive and stay out of the way:

- **HP ~100–120 Hz** — the floor belongs to bass ch3 and bed ch12.
- A gentle wide dip around **1.5–3 kHz** — the hole-in-the-mids law is a MIX
  law: that's where a live player (and the felt piano) sits.
- Glue 2:1, slow attack, ~1 dB — evens the voice-led chord changes.
- Valhalla send generous; keep the insert dry-ish so the gate stays legible.
- Width: wide is good, but mono-check — the room hears one PA, not headphones.

---

## CH 1 · LEAD + CH 5 · BELLS — the felt piano (and the Juno)

**Felt piano** (Splice "John Legend" piano) is the universal lead voice —
Rain Atrium's by design, Chladni's blooms/toll on bells. Chain:

- Velocity sensitivity **ON** — the scenes write real velocity (Rain's
  size-scaled notes, Chladni's approach-decisiveness blooms); this patch is
  where that work becomes audible.
- EQ: HP 60 Hz; small cut ~250 Hz only if the low-mids thicken against the
  pad.
- Compressor 2:1, **slow attack (~30 ms)** to keep the felt thump, gentle.
- A whisper of Saturator (warm curve, ~2 dB drive) for presence without EQ.
- ch1 send to the room verb ~15%.
- **ch5 bells = the same piano into a cathedral**: Valhalla (VintageVerb 4–8 s
  or Supermassive) 40–60 % wet. One deep note, huge tail — the lure toll.

**The synth lead** — second chain in the ch1 rack: **Arturia Jun-6 V** (the
Juno). Patch for White Study's stab/hook: square with PWM slowly modulated,
filter env medium decay, fast attack, **Chorus II on** (the chorus IS the
Juno), Macro 1 → cutoff. White Study sends lead + arp + drums — Juno stab on
ch1, Science Class arp on ch4 (its cutoff+resonance are natively what CC74
streams), kick on ch10, pumping Serum bass on ch3. That's the club rack.

---

## CH 4 / 6 / 11 / 12 — as already cast in rig.json

Science Class (arp) · Hand Pan (texture) · Granulator sand/drips (sfx) ·
atmosphere Sampler (bed). One mixing note each: keep the arp's insert dry
(its motion reads better dry, send-verb only); texture and sfx are send-heavy
by nature; the bed gets a **LP shelf around 6 kHz** and sits 6–10 dB under
everything — room tone, not a pad.

---

## MASTER — mixing for a PA on playa, not for Spotify

The PA is the master. Chasing LUFS is meaningless here; headroom and
translation are everything.

1. Gain-stage the nine tracks so the master peaks around **−6 dB** with White
   Study fully open — the loudest scene defines the ceiling, the ambient five
   then sit naturally lower (that dynamic arc is the SET, don't crush it).
2. **EQ Eight**: HP 25 Hz (protect the subs from DC/rumble), broad strokes
   only.
3. **Glue Compressor** 2:1, attack 30 ms, release Auto, **≤ 2 dB GR** at peak.
4. **Limiter, ceiling −1 dB** — insurance, not loudness. If it's working
   hard, fix the gain staging instead.
5. Soundcheck move: play White Study's drop at show volume, set the PA amp
   there, never touch the master chain again mid-show.

---

## Browser blend vs. timbre-first — the OUT casting

Lance's call this round: per-scene, some scenes keep the browser sound in the
mix (its character is part of the piece), some scenes' entire point is timbre
quality (rack only). Recommended casting, to land in `setlists.json` once the
rack exists (`out` per scene; until then everything stays web):

| Scene | OUT | Why |
|---|---|---|
| Chladni Court | **both** | The beating between two just-ratio plate tones IS the physics — keep it; Hand Pan + Shrine dress it. |
| Lumen Film | **midi** | Timbre is the point: the glass organ needs real glass; the browser sine stack is the sketch. |
| Ferro Bloom | **both** | The soft-piano drone has charm; the rack supplies the pocket's drums + felt piano weight. |
| Ridge Loom | **midi** | The band deserves real instruments — rubbery Serum bass, clav-ish arp, dry kit. Browser plucks read cheap at 96 BPM funk. |
| Weather Station | **both** (forced) | The wind is browser noise and mirrors nothing by design — MIDI-only would silence the scene's body. |
| Attractor Vespers | **midi** | The one-continuous-synth scene; an Omnisphere pad ridden by the light is the whole upgrade (goals doc flags it plugin-drives-design). |
| White Study | **both** | The Ikeda clicks are flat-on-purpose and browser-perfect; the rack adds what the browser can't — kick weight, Juno stab, sidechain pump. |
| Rain Atrium | **both** (forced) | Rain is a pure-noise bed, mirrors nothing by design; the felt piano rides MIDI. |
| Event Horizon | **both** | The string wall + gate carries in the browser; Augmented Strings doubles it into the marquee mapping. Review after racking — may earn midi. |

("Forced" = the scene has deliberate browser-only material; MIDI-only is not
an option there, it's a bug.)

---

## Build order (the racking evening)

1. IAC port: Track ON + Sync ON in Live's MIDI prefs; EXT pressed; page CLOCK
   toggle on.
2. Nine MIDI tracks, channels 1–6 + 10/11/12, each an Instrument Rack,
   **Macro 1 mapped, CC74 → Macro 1** on every one (the convention that makes
   patch-swapping free).
3. Drum Rack on ch10 per the kit section — buy/chop samples first, it's the
   longest job and the highest leverage.
4. Serum SOURCE BASS + the sidechain compressor wiring.
5. Felt piano ch1/ch5, Juno chain, pad chains, then the already-cast 4/6/11/12.
6. Drum group chain → sends → master chain, gain-staged against White Study.
7. **Fill `rig.json` in the same breath** — replace "(proposed)" with what's
   actually loaded. Honest beats aspirational; an empty rig means Claude
   writes for an imaginary one.
8. A/B each scene with OUT = both against the casting table; flip the two
   `midi` scenes and listen for what the browser was still contributing.

Sources for the drum research: [Attack Magazine — beats inspired by Fred
Again](https://www.attackmagazine.com/technique/beat-dissected/breaking-down-how-to-make-beats-inspired-by-fred-again/) ·
[MusicRadar — Fred Again style track](https://www.musicradar.com/news/make-a-fred-again-style-track-free-samples) ·
[Splice HOMAGE: Fred Again](https://splice.com/sounds/collections/splice/jbwvedrbqnt1lcr6gacfutn3xwg/samples) ·
[Reverb Machine Future Garage pack](https://reverbmachine.com/sounds/future-garage-fred-again-sample-pack/) ·
[Vidro Breaks Vol 1](https://cisumaudio.gumroad.com/l/vidrobreaksvol1) ·
[Myloops trance kicks guide](https://www.myloops.net/the-best-trance-kick-sample-packs) ·
[drum-bus practice](https://www.musicguymixing.com/drum-bus/).
