# NIGHT CIRCUIT V13 — One Impossible Planet
## Look-development pass · asset evaluation · direction

V12 is preserved and selectable from the version dropdown. V13 is the new default.

---

## 1 · The visual-language rules (apply everywhere)

**Dark mass, luminous edge — but the edge is now earned.** The full-mesh wireframe default is retired. Three treatments replace it, chosen by what a thing *is*:

- **Inverted-hull rim** for organic heroes (manta, crab, tower, water bear): a slightly inflated back-face shell in one accent color. Reads as a thin silhouette line that survives any lighting, costs almost nothing, never exposes polygons.
- **Feature-edge lines** (EdgesGeometry, threshold ~30°) reserved for architecture — only creases draw, so boxes read as drawn silhouettes. Built as a helper; the district's next pass should apply it to the procedural towers.
- **Wireframe as event.** The cave's skeleton now sits at 0.008 opacity and only surfaces on kick (+0.085), arp (+0.035), and act transitions (+0.3). Structure exposure *means* something: the world shows its bones when the music hits or reality is changing.

**Light is a spend.** Hemisphere ambient dropped to 0.012 in the cavern and 0.075 in the tunnel. Honest emitters only: bioluminescence (mushrooms, jellyfish — the blue jellies carry real PointLights), machine LEDs (tunnel conduits, tail light), the sun, windows. Everything else is revealed, not shown.

**Two real headlights.** The single fake point light is replaced by two SpotLights: left hand drives the warm beam, right hand the cool-violet beam. Push toward the source and your side flares (0.7 → 4.1 intensity, +kick shiver). Enclosed acts get 1.6× throw because they have walls to catch it; open acts drop to 0.72× so the sky does the work. Steering swings both beam targets. This is the connective tissue of the whole instrument: *the world is dark; your hands are the light.*

**Palette:** near-black violet base · warm orange left / violet right (the standing law) · warm pink `#ff6a9e` reserved for the district's organisms-as-architecture · restrained cyan for machine light · white only where something is actually a light source.

---

## 2 · Act identities

### ACT 1 · THE CAVERN — *wonder and awakening*
- **Hierarchy:** black rock → clustered bioluminescence (three colony zones, not a sprinkle) → one moving creature.
- **New life:** fan-coral colonies at the walls (headlight-revealed, warm halo at the roots), two animated stalked jellyfish standing like flowers that turn out to be animals, two blue jellyfish drifting overhead as real lanterns (PointLights breathing with the kick), and **the manta** — every ~40 riding-seconds it crosses the road ahead, wings through both beams, carrying a faint violet underlight that brushes the rock as it passes.
- **Hands:** L = arps + orange country, R = stabs + violet country (unchanged); both = beams, speed, reveal distance.
- **Low state:** black, drips, one mushroom colony breathing. **Crescendo:** skeleton flashes on the kick, jelly lanterns surge, manta cue.
- **Musical role:** beatless minor pulse; the mourner lead. Hero event: the manta crossing. Absurd card: none — the cavern stays sincere.

### ACT 2 · THE DISTRICT — *rhythm and playful activity*
- **Landmark:** the laminar sculptural tower (fit 72, fog-proof, geological 0.008 rad/s rotation, warm-pink rim) — coral logic at architectural scale. This is the planet's thesis statement.
- **Life:** two maintenance robots hovering at the curb, absorbed in inexplicable jobs; two fighters gliding between towers with reef-fish body language (they bank *and* turn); parked cybercars whose textures the beams actually reveal.
- **THE CRAB.** Every ~55 riding-seconds an enormous pale crab crosses the highway, sideways, with a tiny gallop, completely serious. Rendered from its own vertex-color shading (it reads at any distance), pink rim. Deadpan absurdity lives here and only here.
- **Hands:** signage leans toward your side (kept); beams paint the near facades; L/R side-color law on the road.
- **Musical role:** the groove arrives. Windows-as-notes is the planned hook for the production pass (window texture flashes on arp events, per side).

### ACT 3 · THE TUNNEL — *propulsion and rising tension*
- **The hero bore is in.** future_tunnel.glb, two leapfrogging segments, interior swallowing the road. Wall/floor textures kept but crushed to 0.26 — darkness between luminous structures. Its **LED conduits are the sequencer readout**: cyan mainline breathes with the kick, magenta service lines answer the arps and your lean. Octagonal rings retained as phrase markers inside the bore.
- **Hands:** L/R wall panels pulse per side (kept), beams at 1.6× throw, FOV push with throttle.
- **Musical role:** double-time kit, the crescendo. This act is now the clearest proof that the environment is a playable sequencer.

### ACT 4 · THE HORIZON — *harmonic release and scale*
- **Planetary now:** a 56-unit dark sister planet hangs over the left horizon with a lavender rim — the sky stopped being terrestrial.
- **Asymmetry:** palms crowd the left shore (2:1), deep-dusk tinted with linework demoted to an event; the right shore carries stretched fan-coral "antenna plants" — coral becoming araucaria.
- **Silhouettes:** the whale pod remains; a **manta crosses the face of the sun** every ~64 riding-seconds with a slow wingbeat; and every ~130 riding-seconds **a water bear the size of weather walks the ridge in front of the sun.** Say nothing. It leaves.
- **Musical role:** half-time weight, the mourner returns, long exhale.

---

## 3 · Camera and embodiment
- Attract state unchanged in spirit: elevated, calm, whole-scene legible for bystanders.
- Engaged state is now a **low chase** (y ≈ 2.45) with **lagged lateral follow** (the lag is the weight), banking that mixes steering with the road's own bend, near-field bob + a kick shiver that grows with intensity, and a mild FOV push. First-person is retained as a possibility for the tunnel production pass, not the default.

## 4 · Events as future music hooks
All rare events run off `state.evtT` — a clock that only advances while someone rides, so surprises are earned, not scheduled. Phases are deterministic (`evtT % period / duration`), which means the future composed-generativity pass can read the same clock and score the crab, the manta, and the bear as *arranged moments* without touching the visuals.

---

## 5 · Asset evaluation (15 files reviewed, 10 shipped)

| Asset | Verdict | Treatment | Shipped size |
|---|---|---|---|
| manta_ray (animated) | **Hero ×2** — cave crossing + sun silhouette. Rigged swim loop, clean silhouette. Skinned → loaded twice, never cloned. | dusk lambert + violet hull / black fog-free silhouette | 0.36 MB |
| stalked_jellyfish (animated) | **Keep** — the single most otherworldly organism in the set. | translucent + cyan emissive lift | 0.78 MB |
| blue_jellyfish | **Keep ×2** — decimated 97k→28k tris. Carries real light. | translucent + PointLight lantern | 1.0 MB |
| fan_coral_cluster_low | **Keep** — 2.2k tris, perfect instancing material. Cave colonies + horizon antenna-plants. | dark cards, headlight-revealed, root halos | 0.62 MB |
| fan_coral_med | **Exclude** — 105k tris for the same silhouette as the low version. |
| blue_crab | **Hero** — decimated 421k→56k tris, vertex-color shading preserved and used directly. Rare event only. | vertex-color basic, dusk tint, pink hull | 1.6 MB |
| architectural_tower | **Landmark** — decimated 605k→106k at the coarsest grid that keeps the laminar fins. | dark lambert, pink hull, fog-free | 1.98 MB |
| space_maintenance_robot | **Keep ×2** — decimated 54k→28k, textures at 512. | 0.5 dusk, beam-revealed | 0.83 MB |
| space_fighter | **Keep ×2** — textures 5.3→0.9MB. Flies like a fish, engine glow only bright element. | 0.55 dusk + orange engines | 1.4 MB |
| future_tunnel | **Hero environment** — modular, sane UVs, and its LED materials were separable *by name*, which made the beat-wiring trivial. | dark walls + LED conduits as instrument | 2.0 MB |
| water_bear | **Rare event** — decimated 683k→27k with texture kept (1.4 MB). The heaviest source file; decimation was mandatory. | fleshy dusk, fog-free, warm rim | 1.4 MB |
| suction_cup_tardigrade | **Exclude** — redundant with water_bear, no texture. |
| mars | **Exclude** — its 5.5MB texture doesn't bind in three r147 (spec-gloss extension); a procedural sphere does the job for free. |
| last_moments_of_planet_mars | **Exclude** — an 8000-unit flat sandy dish; weak silhouette, no role. |
| akira_motorcycle_1 | **Exclude** — geometry-only duplicate of the bike already shipping. |
| liang_lisaibam_rock_art | **Never arrived** — listed in the brief but not among the uploaded files. Re-send if you want it evaluated (cave rock-art monolith is a good slot for it). |

New model payload: **12.0 MB** on top of the existing 5.1 MB (total site ~17 MB, loads async after first paint).

## 6 · Performance and pipeline notes
- No off-the-shelf decimator is installable in the sandbox, so I wrote a numpy vertex-clustering decimator (bakes node transforms, merges primitives, recomputes normals, carries vertex colors / one UV set + baseColor texture). It's crude but effective on organic scans; it chews thin laminar fins, so the tower runs at the coarsest acceptable grid.
- Two full-frame pitfalls found and fixed: `fitIn`'s centering offset lives in the group's position, so every directly-animated hero needed a wrapper group (the crab spent two iterations underground — only its carapace poked through the road, reading as a mysterious dark dome). And FogExp2 murders anything past ~200 units unless materials opt out — all horizon silhouettes are fog-free.
- Frame cost: the added scene peaks around +250k triangles (tunnel act, both segments in view). SwiftShader (software GL) renders it fine, so real GPUs will not struggle. Draw calls grew modestly; nothing needed instancing yet.

## 7 · What still feels generic or unresolved (honest list)
- The **district's procedural towers** are still boxes with a window texture; the landmark carries the act. Next pass: feature-edge lines + musical windows + one or two more grown-tower variants.
- The **cave's far throat** still shows the old wireframe tube on beats a touch too literally; it's tempered, not solved. A displaced-mesh rock with real headlight response would finish it.
- **Beam splash** on close district facades can bloom hot (an honest side effect of real lights; needs a per-act ceiling).
- The crab/manta/bear events are deterministic clocks — fine for look-dev, but the production pass should tie them to musical phrase boundaries so they land *on* the music.
- The rider is still absent (bike rides riderless, by earlier decision) and the sunset road rails still run white-hot at high exposure.

## 8 · Which act gets the first full production pass
**The Tunnel.** It's the strongest case that the environment is a playable sequencer: the hero asset is in, its LEDs are already beat-wired by name, the act is short and disciplined, the music (double-time crescendo) is its identity, and it has the clearest one-to-one hooks (gates = phrases, conduits = kick/arp, width/FOV = intensity). Polishing it end-to-end — composed build structure, phrase-timed gate lighting, first-person entrance moment, exit into the horizon — would produce the single most convincing demo of the whole premise for the least scope.

---
*V13 live at https://source-interaction-library.netlify.app — V12 kept for comparison in the version dropdown.*
