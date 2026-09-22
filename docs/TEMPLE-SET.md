# THE TEMPLE SET — Edson's performance

Five scenes, one ritual arc, built Sep 2026 as a head start for Edson. Open
the set on the live site with **`#set=TEMPLE`** (the queue drawer offers it
as a shared set too). Every scene here is a V1: the point of a V1 is to be
argued with. Each feedback round becomes a new version file, same as every
other scene in the library.

## The brief (what "Temple" means here)

Edson plays with dots and viscosity — particle simulations where the fun is
in how the stuff flows. The Temple wants that, aimed at: **space, epic and
high-end, thin lines, ceremonial, ritualistic, tasteful.** Lance's visual
references, distilled:

1. **Prismatic flow** — a spectrum split along a ribbon of particles, not
   flat neon. Iridescence comes from *temperature* or *age* of a form, never
   from screen position.
2. **Sparse white filaments on a huge black** — most of the frame is nothing.
3. **Hair-thin crystalline lines, near-monochrome** — white/silver with a
   faint red/blue fringe where lines cross, like light through glass.
4. **Two soft spheres overlapping, one dark, one lit with a spectral
   gradient** — the softest picture in the set is also the biggest.
5. **Dots strung along curves in the dark** — LED points on a wire cage.

House rules that still apply (they're in `scene-craft`): black is invisible
on the scrim, so a "thin" line here is ~1.2–1.8 px at 1920×1200 *with a glow
sprite under it*; every scene keeps one line-weight constant (`ms`) so the
whole set can be fattened in one edit if the Temple surface eats it.

## The long list (fourteen ideas, very different on purpose)

| # | Idea | One line | Verdict |
|---|------|----------|---------|
| 1 | **Constellation Vigil** | Two candles in viscous dust; hold still and a star condenses; stars thread into a constellation over the whole set | **BUILT (SRC-51)** — memorial, and the only scene where minute nine looks different from minute one by construction |
| 2 | **Sand Mandala** | Grains homed on an 8-fold mandala; L settles ring by ring, R sweeps it away | **BUILT (SRC-52)** — the Temple burns; a mandala is made to be unmade |
| 3 | **Harmonograph** | Twin-pendulum pen; L tunes the frequency ratio through just-interval detents, R is the swing | **BUILT (SRC-53)** — the interval *is* the figure, which is the most honest sound-picture coupling in the library |
| 4 | **Accretion** | Keplerian dust disc; L viscosity braids rings into infall streams, R feeds it; a photon ring; an earned heartbeat | **BUILT (SRC-54)** — Edson's dots-and-viscosity, pointed at the dark |
| 5 | **Totality** | Two soft spheres; R slides the dark one across the lit one; the corona appears at totality; diamond ring on release | **BUILT (SRC-55)** — the climax; reference image 4 almost literally |
| 6 | Orrery | Thin elliptical orbits, conjunctions ring bells | Too close to Epicycle Court (SRC-01) |
| 7 | Censer | Curl-noise incense smoke rising from a thurible; viscosity = smoke thickness | Beautiful but not space; keep for a V2 of Vigil's dust |
| 8 | Magnetosphere | Dipole field lines, solar-wind particles streaming along them, aurora at the poles | Strong candidate for scene six; overlaps Totality's streamers |
| 9 | Nebula Nursery | SPH gas collapsing into stars, each birth a note | Needs a real fluid solver to look right; Cloud Steam already owns "soft mass" |
| 10 | Galaxy Arms | Density-wave spiral, L arm tightness, R rotation | Epic but a RATE control (spin) is a weak control — see scene-craft |
| 11 | Procession | Lines of dots walking an ellipse in step, a ceremony | Reads as a screensaver; no instrument in it |
| 12 | Gravitational Lens | An Einstein ring bending a star field | One trick, no second minute |
| 13 | Comet Rosary | Comets on eccentric orbits, tails as thin lines, perihelion = bell | Good; folded into Accretion's feed stream |
| 14 | Lantern Ascent | Sky lanterns released by stillness, rising, thinning to stars | Folded into Vigil (the "oldest star ascends") |

**Why these five:** each uses a different mechanic (stillness detector /
homed grains / pendulum pen / orbital dynamics / occlusion), a different
key and tempo, a different picture family (dots / dots-on-curves / one line
/ disc / spheres), and together they make an arc.

## The running order (and why)

| Slot | Scene | MIN | Role in the rite |
|------|-------|-----|------------------|
| 1 | Constellation Vigil (SRC-51) | 8 | Arrival. Quiet, hands learn stillness. The sky starts filling. |
| 2 | Sand Mandala (SRC-52) | 8 | The making. Devotion builds it; the sweep is the first release. |
| 3 | Harmonograph (SRC-53) | 7 | The meditation. One white line, two tones, pure intervals. |
| 4 | Accretion (SRC-54) | 9 | The descent. Colour returns as heat; the heartbeat is earned. |
| 5 | Totality (SRC-55) | 8 | Climax and release. The gong, the corona, the diamond ring. |

Keys walk D dorian → A aeolian → E aeolian → C♯ phrygian → F aeolian; tempi
58 → 66 → 60 → 84 → 56. Only Accretion has drums, and only when earned.

## What each scene needs next (the honest V1 list)

- **All five** are browser-sound only and rig-agnostic: every event carries a
  MIDI role, but nobody has done the RIG WALK (sound-craft's process law).
  First Ableton session: walk the roles seat by seat with Lance.
- **Vigil**: stillness threshold (2 s) and the gathered-dust requirement
  are guesses; tune on the real sensors. The idle state could use one rare
  autonomous star (ownership, not exclusivity).
- **Mandala**: the complete-mandala payoff is one chord roll; it deserves a
  window (45 s of something). The sweep's violet tint is a global — could be
  a per-grain "was swept" freshness instead.
- **Harmonograph**: the detent list is a taste call (minor third and minor
  sixth in; major third out). The 1:1 detent is dull — consider dropping it.
- **Accretion**: the heartbeat pattern is placeholder (kick on 1 and the
  "and" of 3); the infall pluck register may want to be lower.
- **Totality**: the lit sphere is bigger and bluer than the reference;
  corona streamer count/length is a budget question at 1920×1200.

## How to shoot them (the harness polarity gotcha)

`node tools/shot.mjs SRC-5X prefix "label:L:R:pres:act:ms"` takes hand values
as **reach-outward = 1**; the scenes read **lean-in = 1** (NEAR = MORE). So
`0` in the harness is the scene's maximum. States that show each scene:

```
SRC-51  "still:0.25:0.7:1:-1:9000"          two stars and a bridge
SRC-52  "built:0:1:1:-1:14000,sweep:0.7:0.1:1:-1:5000"
SRC-53  "fifth:0.53:0.1:1:-1:9000,octave:0.28:0.3:1:-1:8000"
SRC-54  "rings:1:1:1:-1:5000,honey:0.1:0.1:1:-1:12000"
SRC-55  "partial:0.7:0.5:1:-1:4000,total:0.2:0:1:-1:10000"
```
