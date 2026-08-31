/* ---------- SRC-43.14 · CELL FRONT V14 (retuned onto the new AUDIO IN engine) ----------
   Not a look change — a RECALIBRATION. The engine was rewritten to
   auto-range to the material, and every constant V9-V13 chose was fitted
   to the old one, where bass sat at 0.88 and moved 0.31 end to end. On the
   new engine the same track gives bass 0.10..0.90. Same music, same scene,
   measurably DIMMER: fed 50s of real techno through the real capture path
   (MediaStreamAudioDestination -> AUDIOIN._wire), V13 rendered mean luma
   33.3 against the old engine's 57.3, and 20.8% of the frame above luma 15
   against 31.8%. On mesh scrim that is not "a bit darker", that is gone.
   V14 moves the constants back onto the new ground and uses the signals
   the rework added. Measured over the same four musical moments, mean
   luma of the frame with the HUD row excluded, and the fraction of the
   frame above luma 15 / 50 (the scrim-legibility numbers). The "old
   engine" leg is the live engine with level/bass/mid/treble pushed through
   a quantile transform onto the OLD engine's measured distribution on this
   same excerpt, so all three legs hear identical musical timing:

     leg                       mean luma   >15     >50
     old engine (the target)      57.3    31.8%   29.5%
     V13 on the new engine        33.3    20.8%   18.7%
     V14 (this file)              60.5    33.3%   30.8%

   · SATURATION FIX (the one shader change in V14, made after a scrim-
     legibility review measured the light gain above and found it had bought
     a BLOWOUT with it): the `overlap` weld term's threshold is 0.55 -> 1.20.
     The 0.65 coefficient, the 1.6 clamp and the Reinhard soft-clip are all
     untouched, and so is the radius — the radius growth is what buys the
     legibility win; the overlap gain is what turned it into white paste.
     WHY THE THRESHOLD AND NOT THE COEFFICIENT: `wsum` is already 1.0 at a
     lobe's OWN centre before any neighbour contributes anything, so at 0.55
     this was never really an overlap term — it was a x1.29 blanket gain over
     the entire cloud that merely grew where lobes met. V14's bigger radii
     (0.183 -> 0.242 at measured field) cut the lobe separation-to-radius
     ratio 1.42 -> 1.24, which raised the neighbour leakage at a lobe centre
     0.07 -> 0.14 and pushed that blanket through the clip. At 1.20 the boost
     is ZERO until a second pocket genuinely contributes, and still reaches
     ~x1.20 at a real weld, so the "overlapping pockets read brighter" moment
     the term exists for survives intact.
     Measured on the same rig as the numbers above — the real capture path,
     the same 4 musical moments, identical still hands, and metrics taken on
     the FINAL composited picture (the fx.bloom pass included; reading
     P.canvas instead understates every bright number), HUD row excluded.
     "flat" is the reviewer's structureless-white measure: pixels over luma
     200 whose +-5px neighbourhood spans under 6 luma.

       leg                     mean   >15     >50     >200    >245    flat px
       V13                     32.9  21.5%   19.3%   4.66%   0.22%    19.2k
       V14 with 0.55 (before)  65.0  35.4%   32.6%  18.59%   7.02%   133.8k
       V14 with 1.20 (this)    60.8  36.1%   33.3%  12.63%   1.20%    57.7k

     So: structureless white 133.8k -> 57.7k px (5.98% -> 2.58% of frame) and
     literal clipping 7.02% -> 1.20% of frame, for -6% mean luma and NO loss
     of scrim reach at all (>15 went 35.4% -> 36.1%). Read the stills: V14's
     600x400 band of continuous white through the upper centre is gone and
     the cell walls run through it again, with one compact bright weld left
     where two pockets actually meet.
     THE HONEST PART: this does NOT get all the way back to V13's 19.2k. It
     cannot. Setting the coefficient to 0 — deleting the weld entirely —
     bottoms out at 46.4k px (2.07% of frame) at mean 55.2, so the overlap
     term is EXHAUSTED as a lever at ~2%, and the residual gap to V13 is the
     bigger radii and the 20px bloom pass summing over a larger bright area,
     neither of which this round is allowed to touch. 3x V13's plateau at 2x
     V13's light is the deal on the table; the 0-coefficient version costs the
     weld, reads uniformly grey and is not worth it. Quiet moments were
     checked separately (the track's intro, 3 moments): mean 54.8 -> 48.3,
     >15 29.5% -> 28.4%, >245 5.89% -> 0.90% — still far above V13's loud-leg
     mean of 32.9, so nothing went dark.
   · MELODY now reads inp.audio.dev.mid, not `raw mid - eased mid`.
     dev.* IS "this band is above its own ~1.5s running level", AGC-
     normalized — exactly what melLift was hand-rolling, minus the
     dependence on absolute level the auto-ranging destroyed. V13's
     melLift > 0.14 is true on ~28% of frames on this material, so the gate
     fired every single time its 4s refractory expired — 5 fires in the 38s
     measured here, with s.mel > 0.05 on 100% of frames — and the violet
     floor V13 exists to abolish came back in through the melody door. Violet is the darkest thing this scene can draw
     (RL_VIOLET luma 0.133 vs white 0.963), so that alone cost most of the
     light. dev.mid > 0.95 with an 8s refractory and a faster fade brings
     the violet back UNDER the old engine's duty cycle — measured over the
     same 38s: fires 3 (V13-on-new 5, old 2), mel > 0.05 on 44.8% of frames
     (100% / 77%), mean mel 0.144 (0.417 / 0.219) — while still peaking at
     0.93, so the wash is an EVENT again instead of a tint.
   · LIVENESS reads inp.audio.live instead of level > 0.05. On this track
     `level` bottoms out at 0.000 mid-music while the engine's own gate was
     true on 100% of frames; s.pres was dipping to 0.705 and pulsing the
     whole picture 13% darker. `live` is the engine's gate AND its
     dynamic-range confidence — one flag no 0..1 band can express once the
     AGC normalizes everything.
   · FIELD weights x1.176 (0.53/0.41/0.35) — ratio and the ^1.5 frame cap
     untouched, so V10's "never floods the frame" law survives verbatim;
     this only puts the operating point back on 0.75.
   · RADIUS floor is now presence-gated: 0.018 + 0.072*pres + field*0.198,
     which still tops out at V10's 0.288 cap at field = 1 but stops quiet
     bars collapsing (the new engine's honest low end is much lower than
     the old one's). At pres = 0 it is identical to V13 — silence still
     reads as silence, a scene still starts still.
   · FLUX x0.6 -> x0.23 and ENERGY gamma'd 0.65. Both are shape fixes on
     STATE, not on the shader: at the measured p50s the shader's cellSc
     evaluates to 1.204 against the old engine's 1.210 and the drift speed
     sp to 1.275 against 1.319 (V13-on-new: 1.205 and 1.755 — the swirl was
     running a THIRD too fast on a permanently-elevated flux), so cellSc /
     sp / swirlAmp / flowW are correct by construction and are NOT touched.
   · The LEFT pocket's slow share now comes from `lowmid` (180-400Hz, the
     bassline's NOTES) instead of `bass`. The recut bass band is 35-160Hz,
     i.e. mostly kick fundamental: measured correlation with this scene's
     own kick envelope is bass +0.50 but lowmid +0.21, so V13's slow share
     was half a second copy of the kick V9 deliberately gave its own fast
     clock. This finishes V9's two-clock split. The FIELD stays on
     absolute bass/mid/treble — "how big is the ensemble" is a genuinely
     absolute question and a dev-driven field would be the same size in a
     whisper and a drop.
   · Bloom size 0.32 + 0.55*level (was 0.8: the new level p95 clipped, so
     every loud bloom was the same size) and the onset fallback hit
     0.4 + 0.27*level. Dynamics, not light.
   · TASTE CALL, and the one thing here that is not a recalibration: the
     melody wash colour is lifted to mix(RL_VIOLET, RL_WHITE, 0.35) =
     (0.52, 0.34, 1.0). Still unmistakably Ridge Loom's violet, at three
     times the luminance (Y 0.42 vs 0.133). At full wash V13's violet was
     a HOLE in the cloud on scrim; this is a colour.
   The kick chain is untouched and deliberately so — k.n detection,
   strength, the 30ms LEAD, the back-dating, the 0.09s refractory and the
   3.4/s decay measured identical across engines (s._kStr 0.6791 new vs
   0.6789 old). The rework never touched the time-domain scanner. V11's
   work stands.
   ------ V13 notes follow ------
   Nima on V12: keep the speed painting, make sure color FADES over time,
   and have the clouds go back to WHITE when there isn't much movement —
   with the occasional color introduced by the MELODY. So V13's floor is
   white, not violet; hand speed still paints orange (L, left) and cyan
   (R, right) and fades a little slower (~3s); and Ridge Loom's violet
   now belongs to the melody: when the mid band lifts clearly above its
   own running level (a phrase entering), a violet wash blooms around the
   MID pocket and fades over ~3s, rate-limited (≥4s apart) so it stays an
   occasion, not a strobe.
   ------ V12 notes follow ------
   Nima on V11: limit the colors to RIDGE LOOM's — its violet floor
   #4900ff, orange summits #f36c3b and cyan summits #00edff — minus the
   yellow/accent (Cell Front's acid-chartreuse pivot is gone), and let the
   VELOCITY of CC1/CC2 introduce the color: how fast the left hand moves
   paints ORANGE into the LEFT side of the cloud, how fast the right hand
   moves paints CYAN into the RIGHT side. So the field rests violet like
   Ridge Loom's empty frame; a still hand adds nothing; a fast reach or
   pull floods its side with color that fades back over a couple of
   seconds. Side weights come from the cloud's own extent (bass lobe → treble
   lobe), not the screen. Everything else — kick, field, gating — is V11.
   ------ V11 notes follow ------
   Nima on V10: "much better, though it still feels like it's reacting
   too late to the kick." A research workflow + a new harness
   (tools/kicktest.mjs: synthetic 128 BPM techno fed into the real engine)
   measured why: the engine's frame-polled FFT onset landed ~60ms after
   the transient and false-fired on the 16th-note bassline, V10's 260ms
   refractory then ATE most real kicks behind those (2-42% caught), its hit
   sizing compared two smoothed signals so the first frames were under-
   sized, and the radius attack smoothing (14/s, ~70ms tau) sat downstream
   of the kick envelope. V11 fixes all four:
   · reads AUDIOIN.kick — the engine's new time-domain LP150 scanner
     (~5ms, sample-accurate timestamp) — via inp.audio.kick.n changing;
     falls back to onset's rising edge when no kick signal exists;
   · scene refractory 0.26s → 0.09s (the engine already gates at 90ms);
   · hit = 0.55 + 0.45·strength, then BACK-DATED: the envelope is seeded
     already advanced along its own decay by the hit's true age plus a
     LEAD (30ms, capture+display), so the drawn frame is where the swell
     should be for the vsync it lands on, not the moment it was computed;
   · the radius is split into a slowly-smoothed BASE (hides band motion)
     and an UNSMOOTHED kick multiplier applied per frame.
   Field cap, gating, palette, blooms: V10, verbatim.
   ------ V10 notes follow ------
   Nima on V9, live on the site with a real track: STILL too jittery and
   reactive, and it filled the whole frame with cloud almost all the time —
   "it should basically never do that." Two fixes on top of V9's two-clock
   split:
   · THE FIELD IS CAPPED. Radii now top out around a third of what V9
     allowed (compressive curve, base ≤ ~0.29 of min(w,h)), so a loud
     track is a big ensemble sitting in black, and only a kick on a peak
     ever brushes the frame edge. Spread follows suit.
   · THE KICK IS GATED. The engine's onset fires on any bass-band rise,
     which on a 16th-note bassline is every note — V9 re-armed the swell
     each time. V10 accepts a hit only after a 0.26s refractory (≥ ~230
     BPM max) and sizes it by how far the incoming bass jumps ABOVE its
     slow average, so bassline notes riding a steady level barely nudge
     it and the kick, which pokes above, owns it. Blooms follow the gate.
   · The slow bands are slower still (attack 1.4/s, release 0.9/s) and
     flux is scaled down; the radius release is softer.
   ------ V9 notes follow ------
   Nima's verdict on V8: too JITTERY on techno/house. With a full spectrum
   — kick, bassline and melody all at once — V8 let each pocket's radius
   chase its own band at 9/s attack, and FLUX (the reform swirl) was the
   derivative of those same fast bands, so every hi-hat and bassline note
   twitched a different cloud. The fix splits size into two jobs on two
   clocks:
   · THE KICK is the only thing that makes a cloud swell hard. `onset` is
     the engine's bass-band rise detector (tuned for four-on-the-floor), so
     a rising edge sets a per-pocket KICK envelope (instant up, ~a beat
     down) that balloons all three pockets together — bass hardest.
   · BASSLINE / MELODY set the size of the WHOLE FIELD, slowly: the three
     bands are eased at ~1.5/s into a FIELD scale that multiplies every
     radius and pushes the pockets apart, and each pocket's share of that
     field shifts only gently (0.75..1.25) with its own slow band — so a
     melody rising makes the ensemble grow, never one cloud jump.
   · FLUX now derives from the SLOW bands, so the field reforms on a real
     section change (bass drops out, a lead comes in), not on every note.
   Hands still paint (V8), blooms still pop on the kick, shader untouched
   apart from a small kick breath on the cell scale. ------ */
const CF14_LOBES = s => [
  [-s.offBass, -0.04, s.Rbass], [0, 0.05, s.Rmid], [s.offTreble, -0.04, s.Rtreble]
];
const CF14_POOL = (s, x, y) => {
  let acc = 0;
  for (const l of CF14_LOBES(s)) {
    if (l[2] < 0.004) continue;
    const q = Math.hypot(x - l[0], y - l[1]) / l[2];
    acc += Math.exp(-q * q * q * 1.15);
  }
  return acc;
};
const CF14_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uEnergy, uFlux, uKick, uBass, uMid, uTreble, uU;',
  'uniform float uVelL, uVelR, uMel;',   // hand-speed envelopes (orange L / cyan R) + melody wash (violet)
  'uniform vec2 uSpan;',           // x of the bass lobe (left) and treble lobe (right) — the side axis
  'uniform vec2 uRes;',
  'uniform vec3 uLobe[3];',       // bass, mid, treble — x,y,radius
  'uniform int uNB;',
  'uniform vec4 uBloom[8];',
  'uniform vec4 uFlash[6];',
  // RIDGE LOOM's three colors (V12): violet floor, orange and cyan summits.
  'const vec3 RL_VIOLET = vec3(0.286, 0.0, 1.0);',
  // V14 taste call: the melody wash uses a LIFTED violet. Rec.709 luma of
  // RL_VIOLET is 0.133 against white's 0.963 — at a full wash the middle
  // pocket went darker than the cloud around it, which on mesh scrim reads
  // as a hole, not a colour. mix(violet, white, 0.35) is Y 0.42: the same
  // hue, three times the light.
  'const vec3 RL_VIOLET_LIT = vec3(0.521, 0.336, 1.0);',
  'const vec3 RL_ORANGE = vec3(0.953, 0.424, 0.231);',
  'const vec3 RL_CYAN   = vec3(0.0, 0.929, 1.0);',
  // side axis across the cloud's own extent: 1 at the bass lobe, 0 at the treble lobe
  'float sideL(vec2 p){ return 1.0 - smoothstep(uSpan.x, uSpan.y, p.x); }',
  'const vec3 RL_WHITE  = vec3(0.96, 0.96, 1.0);',
  'vec3 speedPaint(vec2 p){',
  '  float wl = sideL(p), wr = 1.0 - wl;',
  '  vec3 c = mix(RL_WHITE, RL_ORANGE, clamp(wl * uVelL, 0.0, 1.0));',
  '  c = mix(c, RL_CYAN, clamp(wr * uVelR, 0.0, 1.0));',
  // melody: violet around the MID pocket (form-anchored), amount = the melody envelope
  '  float dm = length(p - uLobe[1].xy) / max(uLobe[1].z, 1e-4);',
  '  float wm = exp(-dm * dm * 0.9);',
  '  return mix(c, RL_VIOLET_LIT, clamp(wm * uMel, 0.0, 0.85));',
  '}',
  'vec3 rnd3(float a, float b, float salt){',
  '  float x = mod(a * 311.0 + b * 719.0 + salt * 37.0, 65536.0);',
  '  vec3 o; float hi;',
  '  x = mod(x * 75.0 + 74.0, 65537.0);',
  '  hi = floor(x / 256.0); x = mod((x - hi * 256.0) * 257.0 + hi * 131.0 + 7.0, 65537.0); o.x = x / 65537.0;',
  '  x = mod(x * 75.0 + 74.0, 65537.0);',
  '  hi = floor(x / 256.0); x = mod((x - hi * 256.0) * 257.0 + hi * 131.0 + 7.0, 65537.0); o.y = x / 65537.0;',
  '  x = mod(x * 75.0 + 74.0, 65537.0);',
  '  hi = floor(x / 256.0); x = mod((x - hi * 256.0) * 257.0 + hi * 131.0 + 7.0, 65537.0); o.z = x / 65537.0;',
  '  return o;',
  '}',
  'float smin(float a, float b, float k){',
  '  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);',
  '  return mix(b, a, h) - k * h * (1.0 - h);',
  '}',
  'float poolF(vec2 p){',
  '  float acc = 0.0;',
  '  for (int i = 0; i < 3; i++){',
  '    vec3 L = uLobe[i];',
  '    if (L.z < 0.004) continue;',
  '    vec2 d = p - L.xy;',
  '    if (dot(d, d) > L.z * L.z * 4.6) continue;',
  '    vec2 n = d / max(L.z, 1e-4);',
  '    float r = L.z * (1.0 + 0.15 * sin(n.x * 2.4 + n.y * 1.9 + uT * 0.15 + float(i) * 2.1)',
  '                        + 0.10 * sin(n.y * 3.5 - n.x * 2.2 - uT * 0.11 + float(i) * 3.7));',
  '    float q = length(d) / max(r, 1e-4);',
  '    acc += exp(-q * q * q * 1.15);',
  '  }',
  '  return acc;',
  '}',
  // proximity weights to each of the three pockets — used to blend the
  // hand-painted colors, not fixed band colors anymore.
  'vec3 lobeWeights(vec2 p){',
  '  float d0 = length(p - uLobe[0].xy) / max(uLobe[0].z, 1e-4);',
  '  float d1 = length(p - uLobe[1].xy) / max(uLobe[1].z, 1e-4);',
  '  float d2 = length(p - uLobe[2].xy) / max(uLobe[2].z, 1e-4);',
  '  return vec3(exp(-d0 * d0 * 1.3), exp(-d1 * d1 * 1.3), exp(-d2 * d2 * 1.3));',
  '}',
  'vec2 flowW(vec2 p, float amp){',
  '  float t = uT * 0.07;',
  '  return amp * vec2(sin(p.y * 3.7 + t * 1.3) + 0.5 * sin(p.x * 2.1 - t * 0.8),',
  '                     cos(p.x * 3.1 - t * 1.1) + 0.5 * cos(p.y * 2.5 + t * 0.6));',
  '}',
  'float grainF(vec2 q){',
  '  return clamp(0.5 + 0.25 * sin(q.x * 2.3 + q.y * 1.7 + uT * 0.031)',
  '                   + 0.17 * sin(q.y * 3.1 - q.x * 1.6 + uT * 0.024)',
  '                   + 0.12 * sin(q.x * 4.1 - q.y * 2.4 - uT * 0.019), 0.0, 1.0);',
  '}',
  'void lay(vec2 p, vec2 lo, vec2 rot, float U, float salt, float rmin, float rspan, float wgt, float km,',
  '         inout float dS, inout float dH, inout vec2 SP, inout vec3 SH, inout float SR){',
  '  vec2 off = vec2(0.173, 0.411) * salt;',
  '  vec2 q = p + lo + off;',
  '  vec2 g0 = floor(q / U);',
  '  for (int j = -1; j <= 1; j++){',
  '  for (int i = -1; i <= 1; i++){',
  '    vec2 gg = g0 + vec2(float(i), float(j));',
  '    vec3 h = rnd3(gg.x, gg.y, salt);',
  '    vec2 site = (gg + vec2(0.5) + (h.xy - 0.5) * 0.86) * U;',
  '    float R = U * (rmin + rspan * h.z * h.z * h.z) * wgt',
  '            * (1.0 + 0.11 * sin(uT * (0.06 + h.y * 0.16) + h.x * 6.283));',
  '    vec2 dv = q - site;',
  '    vec2 dir = normalize(h.xy - 0.5 + vec2(1e-3, 7e-4));',
  '    vec2 dr = vec2(dir.x * rot.x - dir.y * rot.y, dir.x * rot.y + dir.y * rot.x);',
  '    vec2 rr = vec2(dot(dv, dr), dot(dv, vec2(-dr.y, dr.x)));',
  '    float ec = 1.0 + 0.30 * h.z;',
  '    vec2 ab = vec2(R * ec, R / ec);',
  '    float d = (length(rr / ab) - 1.0) * min(ab.x, ab.y);',
  '    dS = smin(dS, d, km);',
  '    if (d < dH){ dH = d; SP = site - off - lo; SH = h; SR = min(ab.x, ab.y); }',
  '  }}',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  // FLUX (V7, unchanged): speed the drift/swirl when the audio is actually
  // CHANGING, not just when it's loud — settles to a calm drift when steady.
  '  float sp = 0.45 + 0.62 * uEnergy + 2.1 * uFlux;',
  '  float swirlAmp = 1.0 + 2.4 * uFlux;',
  '  vec2 pa = p + flowW(p * 2.1, (0.011 + uEnergy * 0.015) * swirlAmp);',
  '  vec2 dr0 = vec2( 0.0046,  0.0017) * uT * sp + flowW(p * 1.7 + vec2(0.0),   (0.011 + uEnergy * 0.014) * swirlAmp);',
  '  vec2 dr1 = vec2(-0.0032,  0.0039) * uT * sp + flowW(p * 2.4 + vec2(3.1),   (0.009 + uEnergy * 0.012) * swirlAmp);',
  '  vec2 dr2 = vec2( 0.0067, -0.0028) * uT * sp + flowW(p * 3.3 + vec2(6.7),   (0.007 + uEnergy * 0.010) * swirlAmp);',
  '  float ct = cos(uT * 0.030 + uFlux * 0.9), st = sin(uT * 0.030 + uFlux * 0.9);',
  '  vec2 rot = vec2(ct, st);',
  '  float acc = poolF(pa);',
  '  if (acc < 0.11){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  float U0 = uU * 2.30, U1 = uU * 1.05, U2 = uU * 0.46;',
  '  float dS = 1e5, dH = 1e5, SR = uU * 0.30;',
  '  vec2 SP = pa; vec3 SH = vec3(0.5);',
  '  float cellSc = 0.68 + 0.60 * uEnergy + 0.22 * uFlux + 0.18 * uKick;',
  '  lay(pa, dr0, rot, U0, 1.0,  0.15, 0.44, 0.90 * cellSc, U0 * 0.22, dS, dH, SP, SH, SR);',
  '  lay(pa, dr1, rot, U1, 17.0, 0.20, 0.58, 0.95 * cellSc, U1 * 0.22, dS, dH, SP, SH, SR);',
  '  lay(pa, dr2, rot, U2, 31.0, 0.24, 0.54, 0.85 * cellSc, U2 * 0.24, dS, dH, SP, SH, SR);',
  '  for (int i = 0; i < 8; i++){',
  '    if (i >= uNB) break;',
  '    vec4 b = uBloom[i];',
  '    if (b.z < 0.004) continue;',
  '    vec2 bd = pa - b.xy;',
  '    if (dot(bd, bd) > b.z * b.z * 4.0) continue;',
  '    float dd = length(bd) - b.z;',
  '    dS = smin(dS, dd, b.z * 0.10);',
  '    if (dd < dH){ dH = dd; SP = b.xy; SH = rnd3(float(i) * 23.0, 5.0, 7.0); SR = b.z; }',
  '  }',
  '  float accC = poolF(SP);',
  '  float insideC = smoothstep(0.26, 0.46, accC);',
  '  if (insideC < 0.002){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  '  vec3 wgt = lobeWeights(SP);',
  '  float wsum = wgt.x + wgt.y + wgt.z;',
  // V12: one color per cell, from where the cell sits on the side axis and
  // how fast each hand has been moving — no fixed per-pocket hue anymore.
  '  vec3 tint = speedPaint(SP);',
  // volumetric shading: bright core, soft luminous edge, nothing dark drawn
  // on top of it — the opposite of every earlier version's shadow ring.
  '  float u = -dS / max(SR, 1e-4);',
  '  float core = smoothstep(-0.30, 0.95, u);',
  '  float rim = exp(-pow((u - 0.10) / 0.42, 2.0)) * 0.55;',
  '  float turb = 0.82 + 0.34 * grainF(pa * 4.3 + vec2(3.0, 7.0));',
  '  float sparkle = 0.62 + 0.38 * SH.z;',
  // overlapping pockets read brighter — the "weld" moment, emergent from
  // density summing rather than a fourth hardcoded state.
  // V14 SATURATION FIX: threshold 0.55 -> 1.20, coefficient 0.65 UNTOUCHED.
  // wsum is 1.0 at a lobe's OWN centre before any neighbour contributes, so
  // at 0.55 this term was never really about overlap: it was a x1.29 blanket
  // gain over the whole cloud that happened to grow where lobes met. V14's
  // bigger radii (0.183 -> 0.242 at measured field) shrank the lobe
  // separation-to-radius ratio 1.42 -> 1.24, which raised the neighbour
  // leakage at a lobe centre from 0.07 to 0.14 and pushed the blanket into
  // the clip. At 1.20 the boost is zero until a SECOND pocket genuinely
  // contributes, and still reaches ~x1.20 at a real weld — the look survives,
  // the paste does not. See the header for the measured numbers.
  '  float overlap = clamp(wsum - 1.20, 0.0, 1.6) * 0.65;',
  '  vec3 col = tint * (core + rim) * turb * sparkle * (1.0 + overlap);',
  '  col *= insideC * (0.55 + 0.45 * uPres);',
  '  for (int i = 0; i < 6; i++){',
  '    vec4 f = uFlash[i];',
  '    if (f.w <= 0.001) continue;',
  '    float rr = f.z * (1.0 + (1.0 - f.w) * 0.85);',
  '    float dd = abs(length(pa - f.xy) - rr) / (f.z * 0.22 + 0.002);',
  '    vec3 fc = speedPaint(f.xy);',
  '    col += fc * exp(-dd * dd) * f.w * 0.85 * insideC;',
  '  }',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.42);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-43.14', family: 'SRC-43', ver: 14, title: 'Cell Front V14', tech: 'VOLUMETRIC CELL FIELD / HAND-PAINTED AUDIO POCKETS',
  audioIn: true,
  fx: { bloom: 0.34 },
  tags: ['VOLUMETRIC', 'AUDIO IN', 'THREE POCKETS', 'WHITE AT REST', 'SPEED = COLOR', 'MELODY = VIOLET', 'KICK SWELL', 'RETUNED'],
  desc: 'V13, recalibrated for the new listening engine. Same instrument — white clouds, hand speed painting orange left and cyan right, a violet wash when a phrase enters, the kick swelling everything — but every audio constant refitted to a signal that now spans its whole range instead of sitting pinned near the top. On real techno it renders roughly twice the light V13 was managing, the violet is an occasion again instead of a permanent tint (once every 20-odd seconds, not every 4), and the picture no longer pulses dark when the engine briefly loses the level. The violet itself is lifted so a full wash reads as a colour on scrim rather than a hole.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in) — the kick swells the clouds, the bassline and melody size the field, a genuinely new melodic phrase washes the middle violet for a moment. The hands paint by MOVING: a fast reach or pull of the left hand floods the left side orange, of the right hand floods the right side cyan; stillness lets everything fade back to white.',
  sound: 'Makes no sound of its own — an audio-in scene, same as V4-V8. Connect a source (mic, line-in, or CAPTURE APP AUDIO for a running app’s own output) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. Built for a full spectrum: it wants a kick under a bassline.',

  init(P) {
    const s = {
      pres: 0, bass: 0, mid: 0, treble: 0, lowmid: 0, energy: 0, flux: 0,
      field: 0, kick: 0, kBass: 0, kMid: 0, kTreble: 0, _kGap: 1, _kN: -1, _kAge: 0, _kStr: 0,
      Rbase: 0, RbaseM: 0, RbaseT: 0, LEAD: 0.030,
      _prevBass: 0, _prevMid: 0, _prevTreble: 0,
      velL: 0, velR: 0, _pL: -1, _pR: -1, mel: 0, _melGap: 12, _melN: 0,
      offBass: 0.1, offTreble: 0.1, Rbass: 0, Rmid: 0, Rtreble: 0,
      ax: 0.8, ay: 0.5, U: 0.050,
      blooms: [], flash: [], life: 0, popped: 0, popRate: 0,
      _prevOnset: 0,
      noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const sc = Math.min(1, 700 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const uni = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uPres: { value: 0 }, uEnergy: { value: 0 }, uFlux: { value: 0 }, uKick: { value: 0 },
      uBass: { value: 0 }, uMid: { value: 0 }, uTreble: { value: 0 },
      uVelL: { value: 0 }, uVelR: { value: 0 }, uMel: { value: 0 }, uSpan: { value: new THREE.Vector2(-0.1, 0.1) },
      uU: { value: s.U },
      uLobe: { value: new Float32Array(9) },
      uNB: { value: 0 },
      uBloom: { value: new Float32Array(32) },
      uFlash: { value: new Float32Array(24) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: CF14_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn; T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    /* ---- THE inp.audio CONTRACT, for whoever copies this file next ------
       inp.audio always carries level/bass/mid/treble/onset/pan/kick/now.
       The audio-sensitivity round ADDED sub, lowmid, db, dev, flux and
       live — and two things are true about them that a scene must respect:
       (1) not every tick path publishes them. part5_tail's rAF loop does;
           the 100ms watchdog that keeps the show alive behind another
           window still builds the classic six. Reading inp.audio.dev.mid
           unguarded there is a TypeError, and step() runs inside a
           try/catch, so the scene would just silently stop.
       (2) setAudioIn() — the test hook the shot harnesses drive — pins
           dev to 0.5 and flux to onset when the caller omits them.
       So: read them through defaults, and design so the neutral value is
       the "nothing is happening" value. dev's neutral is 0.5, not 0. */
    const AU = inp.audio;
    const AUdev = AU.dev || { bass: 0.5, mid: 0.5, treble: 0.5 };
    const AUlowmid = (typeof AU.lowmid === 'number') ? AU.lowmid : AU.bass;
    const AUlive = (typeof AU.live === 'boolean') ? AU.live : (AU.level > 0.05 || AU.onset > 0.3);
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    s.life += dt;

    // HAND SPEED PAINTS (Nima, V12): not where a hand IS but how fast it
    // MOVES. |d(inp)/dt| → an envelope that snaps up and fades over ~2s.
    // A full-range sweep in half a second (2/s) reads as full color.
    const L = clamp(inp.L), R = clamp(inp.R);
    if (s._pL < 0) { s._pL = L; s._pR = R; }
    const dtc = Math.max(dt, 1e-3);
    const vL = clamp(Math.abs(L - s._pL) / dtc * 0.55), vR = clamp(Math.abs(R - s._pR) / dtc * 0.55);
    s._pL = L; s._pR = R;
    s.velL += (vL - s.velL) * Math.min(1, dt * (vL > s.velL ? 24 : 0.6));
    s.velR += (vR - s.velR) * Math.min(1, dt * (vR > s.velR ? 24 : 0.6));

    const handLLive = chan.L.mode === 'live', handRLive = chan.R.mode === 'live';
    // V14 FIX 3: was `level > 0.05 || onset > 0.3`. On the new engine level's
    // 1st percentile is 0.000 mid-music while the engine's own gate was true
    // on 100% of the same frames — so s.pres was easing down to 0.705 and
    // `col *= insideC * (0.55 + 0.45*uPres)` was pulsing the whole picture
    // 13% darker for no musical reason. `live` is gate AND confidence.
    const audioLive = AUlive;
    const live = (handLLive || handRLive || audioLive) ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 2.2);

    // SLOW BANDS (V9): bass/mid/treble are eased at ~1.5/s in BOTH
    // directions — these no longer size a pocket directly, they size the
    // FIELD, so a bassline note or a melody run is a swell of the whole
    // ensemble over a bar, never a twitch of one cloud.
    // V14: a FOURTH slow band, lowmid (180-400Hz) — the bassline's notes,
    // eased exactly like the other three. It sizes the LEFT pocket's share
    // only; the field stays on bass/mid/treble. See the share() note below.
    const idle = 0.030 + 0.014 * Math.sin(s.life * 0.19);
    const bassTarget = Math.max(idle * (1 - s.pres), clamp(AU.bass));
    const midTarget = Math.max(idle * 0.7 * (1 - s.pres), clamp(AU.mid));
    const trebleTarget = Math.max(idle * (1 - s.pres), clamp(AU.treble));
    const lowmidTarget = Math.max(idle * (1 - s.pres), clamp(AUlowmid));
    s.bass += (bassTarget - s.bass) * Math.min(1, dt * (bassTarget > s.bass ? 1.4 : 0.9));
    s.mid += (midTarget - s.mid) * Math.min(1, dt * (midTarget > s.mid ? 1.4 : 0.9));
    s.treble += (trebleTarget - s.treble) * Math.min(1, dt * (trebleTarget > s.treble ? 1.4 : 0.9));
    s.lowmid += (lowmidTarget - s.lowmid) * Math.min(1, dt * (lowmidTarget > s.lowmid ? 1.4 : 0.9));
    // V14 FIX 5: gamma the mean instead of patching the three places energy
    // is consumed (cellSc, drift speed, bloom growth). The new engine's
    // mean-of-three sits at p50 0.618 where the old one sat at 0.745;
    // ln(0.745)/ln(0.618) = 0.61, and 0.65 lands p50 on 0.73 while widening
    // the tails slightly — the shape changed, not just the gain.
    const mean3 = (s.bass + s.mid + s.treble) / 3;
    s.energy += (Math.pow(mean3, 0.65) - s.energy) * Math.min(1, dt * 2);
    // the field: bass-weighted mix of the slow bands, COMPRESSED (V10) so a
    // loud track sits comfortably inside the frame instead of flooding it.
    // V14 FIX 2: weights x1.176 (0.45/0.35/0.30 -> 0.53/0.41/0.35). The RATIO
    // and the ^1.5 curve are untouched — ^1.5 still maps 1->1, so V10's "never
    // floods the frame" cap survives exactly; this only puts the operating
    // point back where the old engine's amplitudes put it (fieldMix p50 0.824,
    // field p50 0.75). Scaling the exponent instead would have re-compressed
    // away the extra dynamic range the new engine just gave us.
    const fieldMix = clamp(0.53 * s.bass + 0.41 * s.mid + 0.35 * s.treble);
    const fieldTarget = Math.pow(fieldMix, 1.5);
    s.field += (fieldTarget - s.field) * Math.min(1, dt * 1.8);

    // KICK (V9): the engine's onset is a bass-band rise detector, i.e. the
    // kick on four-on-the-floor. Rising edge → per-pocket envelopes snap up
    // (bass hardest, treble least) and decay over roughly a beat. This is
    // the ONLY fast size movement left in the scene.
    // V11: the engine's time-domain kick (AUDIOIN.kick) when it exists —
    // a NEW hit is `n` changing, never truthiness. Fallback: onset's edge.
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetRaw = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        // true age of the hit on the audio clock (0 for the perf-clock test hook)
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
      // V14 FIX 7: the onset fallback only runs on a source with no
      // time-domain kick, but its level term drifted with everything else —
      // 0.4 + 0.4*level sized p50 0.64 where the old engine gave 0.56.
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + AU.level * 0.27); }
    const onsetEdge = edge && s._kGap > 0.09;
    if (onsetEdge) {
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      // BACK-DATE: seed the envelope where its own decay would already be
      // (age + LEAD) after the hit, so the frame is right for its vsync.
      const adv = Math.exp(-3.4 * (age + s.LEAD));
      s.kBass = Math.max(s.kBass, hit * adv);
      s.kMid = Math.max(s.kMid, hit * 0.8 * adv);
      s.kTreble = Math.max(s.kTreble, hit * 0.65 * adv);
    }
    const kDecay = Math.min(1, dt * 3.4);
    s.kBass -= s.kBass * kDecay; s.kMid -= s.kMid * kDecay; s.kTreble -= s.kTreble * kDecay;
    s.kick = Math.max(s.kBass, s.kMid, s.kTreble);

    // MELODY (V13's mechanic, V14's measurement): the mid band lifting
    // clearly above its own running level = a phrase entering. Fires a
    // violet wash, rate-limited so it stays an occasion, never a strobe.
    //
    // V14 FIX 1 — the single biggest brightness win. V13 hand-rolled the
    // lift as `raw mid - eased mid` against a fixed 0.14 threshold, which
    // worked when mid sat at 0.68 with a 0.27 spread. On the new engine mid
    // spans 0.11..0.89 and melLift > 0.14 is true on 28% of frames: the
    // gate fired every single time its 4s refractory expired (11 fires in
    // 48s) and s.mel > 0.05 on 99.8% of frames. The violet floor V13 exists
    // to abolish had come back in through the melody door — and violet is
    // the darkest thing this scene draws.
    //
    // dev.mid is the engine's own version of the same idea: how far this
    // band sits from its ~1.5s moving mean, remapped so 0.5 is "doing what
    // it has been doing" — and AGC-normalized, so unlike `raw - eased` it
    // does not change meaning when the input staging changes. Measured
    // offline against 48s of recorded real frames: >0.95 with an 8s gap and
    // a 0.60 decay gives 2 fires / 24s apart / mean mel 0.049, against the
    // OLD engine's mean of 0.054 — the duty cycle V13 shipped with — while
    // still peaking at 0.78 so the wash is a real event when it lands.
    s._melGap += dt;
    const dmid = AUdev.mid;
    if (dmid > 0.95 && s._melGap > 8 && s.pres > 0.3) {
      s._melGap = 0; s._melN++;
      s.mel = Math.max(s.mel, clamp(0.65 + 0.35 * (dmid - 0.95) / 0.05));
    }
    s.mel -= s.mel * Math.min(1, dt * 0.60);   // ~1.7s tau, was ~2.2s

    // FLUX (V9): derived from the SLOW bands now, so it only wakes on a
    // real change in the arrangement (bass dropping out, a lead entering),
    // not on every note the way V7/V8's fast-band derivative did.
    // V14 FIX 4: 0.6 -> 0.23. The slow bands now swing over 0.10..0.89
    // instead of 0.63..0.94, so at the same 1.4/s ease their derivative is
    // ~2.5x bigger and s.flux never settled (p5 0.340, p50 0.450 against the
    // old engine's 0.152/0.185) — the field swirled constantly and V9's
    // stated intent was dead. 0.6 x 0.185/0.450 = 0.234.
    // NOT inp.audio.flux: the engine's flux is a per-transient rise detector
    // (flux.mid p50 0.058, p95 0.962) and wiring it in here would reinstate
    // exactly the frame-to-frame twitch Nima rejected in V8. The scene's own
    // slow-band derivative is the right mechanic; it only needed rescaling.
    const fluxRaw = (Math.abs(s.bass - s._prevBass) + Math.abs(s.mid - s._prevMid) + Math.abs(s.treble - s._prevTreble)) / Math.max(dt, 1e-3);
    s._prevBass = s.bass; s._prevMid = s.mid; s._prevTreble = s.treble;
    const fluxTarget = clamp(fluxRaw * 0.23);
    s.flux += (fluxTarget - s.flux) * Math.min(1, dt * (fluxTarget > s.flux ? 4.0 : 1.5));

    const axc = clamp(s.ax, 0.6, 1.7);
    // spread follows the field, with a small outward push on the kick
    s.offBass = (0.10 + 0.26 * s.field + 0.04 * s.kBass) * axc;
    s.offTreble = (0.10 + 0.26 * s.field + 0.04 * s.kTreble) * axc;
    // each pocket's share of the field bends only gently toward its own
    // slow band (0.75..1.25); the kick multiplies on top — up to ~1.7x.
    // CAPPED (V10): base tops out ~0.29 of min(w,h) — a loud track is a
    // big ensemble in black, never a flood.
    const share = (band, mean) => 1 + 0.5 * clamp(band - mean, -0.5, 0.5);
    const mean = mean3;
    // V14 FIX 2b: the radius floor is now PRESENCE-GATED. `0.018 + field*0.27`
    // was correct arithmetic on the old engine's field, but the new engine's
    // honest low end is genuinely lower (field p5 0.557 vs 0.667), so quiet
    // bars collapsed — t=42s of the test excerpt rendered at mean luma 23
    // against the old engine's 41. Moving 0.072 of the size out of `field`
    // and into a floor that only exists while something is playing keeps
    // V10's cap intact: at field = 1, pres = 1 this is still exactly 0.288.
    // At pres = 0 it is 0.018 + ~0, identical to V13 — silence still reads
    // as silence and a scene still starts still.
    const base = (0.018 + 0.072 * s.pres) + s.field * 0.198;
    // V11: smooth only the BASE (slow — hides band motion); the kick
    // multiplier is applied per frame with NO filter, so the swell is on
    // screen the frame the hit is known.
    // V14: the LEFT pocket's slow share comes from lowmid, not bass. The
    // recut bass band is 35-160Hz — mostly kick fundamental. Measured
    // correlation with this scene's own kick envelope over 48s of real
    // techno: bass +0.50, sub +0.49, lowmid +0.21, mid +0.12, treble -0.04.
    // So share(s.bass, mean) was half a second copy of s.kBass, double-
    // counting the very thing V9 split onto its own fast clock. lowmid is
    // the bassline's NOTES; the kick envelope keeps the swelling. (sub is
    // NOT an option: at fftSize 1024 its bins are a subset of bass and the
    // two correlate at 0.996 — any mechanic separating them is a no-op.)
    const Bb = base * share(s.lowmid, mean), Bm = base * 0.85 * share(s.mid, mean), Bt = base * share(s.treble, mean);
    s.Rbase += (Bb - s.Rbase) * Math.min(1, dt * (Bb > s.Rbase ? 6 : 3.5));
    s.RbaseM += (Bm - s.RbaseM) * Math.min(1, dt * (Bm > s.RbaseM ? 6 : 3.5));
    s.RbaseT += (Bt - s.RbaseT) * Math.min(1, dt * (Bt > s.RbaseT ? 6 : 3.5));
    s.Rbass = s.Rbase * (1 + 0.70 * s.kBass);
    s.Rmid = s.RbaseM * (1 + 0.60 * s.kMid);
    s.Rtreble = s.RbaseT * (1 + 0.55 * s.kTreble);

    /* ---- blooms: kick-driven, same shape as V4-V8. A hit spawns one
       sized by how loud it was, and finishes off whichever existing bloom
       is closest to ready. */
    if (onsetEdge) {
      if (s.blooms.length < 4) {
        let bx = 0, by = 0, ok = false;
        const bias = clamp(AU.pan, -1, 1) * s.ax * 0.55;
        for (let k = 0; k < 12 && !ok; k++) {
          bx = bias + (P.rand() * 2 - 1) * s.ax * 0.7;
          by = (P.rand() * 2 - 1) * s.ay * 0.85;
          if (CF14_POOL(s, bx, by) > 0.4) ok = true;
        }
        if (ok) {
          // V14 FIX 6: 0.8 -> 0.55. This one drifted the OTHER way — the new
          // level's p95 (0.889) drove big to a clamped 1.00, so the top ~10%
          // of the range was dead and every loud bloom came out the same
          // size. 0.55 gives p50 0.65 / p95 0.81: headroom, no clipping.
          const big = clamp(0.32 + AU.level * 0.55);
          s.blooms.push({ x: bx, y: by, r: s.U * 0.4, Rt: s.U * (0.75 + big * big * 0.85), seed: P.rand() });
        }
      }
      let best = -1, bestFrac = 0.55;
      for (let i = 0; i < s.blooms.length; i++) {
        const b = s.blooms[i], frac = b.r / b.Rt;
        if (frac > bestFrac) { bestFrac = frac; best = i; }
      }
      if (best >= 0) s.blooms[best].r = s.blooms[best].Rt * 0.99;
    }
    let popped = 0;
    for (let i = s.blooms.length - 1; i >= 0; i--) {
      const b = s.blooms[i];
      const inPaint = CF14_POOL(s, b.x, b.y) > 0.4;
      const gr = (0.16 + s.energy * 0.55) * (0.6 + b.seed * 0.8);
      b.r += (inPaint ? (b.Rt - b.r) * gr : -b.r * 1.6) * dt;
      const sp = 0.45 + 0.62 * s.energy;
      b.x += (0.0046 * sp + Math.sin(b.y * 3.7 + s.life * 0.07) * 0.010) * dt;
      b.y += (0.0017 * sp + Math.cos(b.x * 3.1 - s.life * 0.06) * 0.008) * dt;
      if (b.r <= 0.002 && !inPaint) { s.blooms.splice(i, 1); continue; }
      if (b.r >= b.Rt * 0.985 && inPaint) {
        popped++;
        s.flash.push({ x: b.x, y: b.y, r: b.r, a: 1 });
        if (s.flash.length > 6) s.flash.shift();
        s.blooms.splice(i, 1);
      }
    }
    s.popped += popped;
    s.popRate += (popped / Math.max(dt, 1e-3) - s.popRate) * Math.min(1, dt * 2);
    for (let i = s.flash.length - 1; i >= 0; i--) {
      const f = s.flash[i];
      f.a -= dt * 1.9;
      if (f.a <= 0) s.flash.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    if (s.noGL || !P._three) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      const W = [245, 245, 255], V = [133, 86, 255], O = [243, 108, 59], C = [0, 237, 255];
      const mixc = (a, b, t) => [0, 1, 2].map(k => Math.round(a[k] + (b[k] - a[k]) * clamp(t)));
      const cols = [mixc(W, O, s.velL), mixc(W, V, s.mel * 0.85), mixc(W, C, s.velR)];
      CF14_LOBES(s).forEach((l, i) => {
        if (l[2] < 0.01) return;
        const x = w / 2 + l[0] * mn, y = h / 2 + l[1] * mn, r = l[2] * mn;
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, `rgba(${cols[i].join(',')},0.9)`);
        gr.addColorStop(1, `rgba(${cols[i].join(',')},0)`);
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      });
      g.fillStyle = 'rgba(255,200,140,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('CELL FRONT V14 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres; u.uEnergy.value = s.energy; u.uFlux.value = s.flux; u.uKick.value = s.kick;
    u.uBass.value = s.bass; u.uMid.value = s.mid; u.uTreble.value = s.treble;
    u.uVelL.value = s.velL; u.uVelR.value = s.velR; u.uMel.value = s.mel; u.uSpan.value.set(-s.offBass, s.offTreble);
    u.uU.value = s.U;
    const ll = u.uLobe.value, LB = CF14_LOBES(s);
    for (let i = 0; i < 3; i++) { ll[i * 3] = LB[i][0]; ll[i * 3 + 1] = LB[i][1]; ll[i * 3 + 2] = LB[i][2]; }
    const bb = u.uBloom.value;
    u.uNB.value = Math.min(8, s.blooms.length);
    for (let i = 0; i < 8; i++) {
      const b = s.blooms[i];
      bb[i * 4] = b ? b.x : 0; bb[i * 4 + 1] = b ? b.y : 0;
      bb[i * 4 + 2] = b ? b.r : 0; bb[i * 4 + 3] = b ? clamp(b.r / b.Rt) : 0;
    }
    const ff = u.uFlash.value;
    for (let i = 0; i < 6; i++) {
      const f = s.flash[i];
      ff[i * 4] = f ? f.x : 0; ff[i * 4 + 1] = f ? f.y : 0;
      ff[i * 4 + 2] = f ? f.r : 0; ff[i * 4 + 3] = f ? f.a : 0;
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    g.fillStyle = 'rgba(255,200,150,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const dmidHud = (inp.audio.dev && typeof inp.audio.dev.mid === 'number') ? inp.audio.dev.mid : 0.5;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '   LOWMID ' + Math.round(s.lowmid * 100) + '   MID ' + Math.round(s.mid * 100) +
      '   TREBLE ' + Math.round(s.treble * 100) + '   FIELD ' + Math.round(s.field * 100) +
      '   LIVE ' + (inp.audio.live ? '1' : '0') + '   DEVMID ' + Math.round(dmidHud * 100) +
      '   KICK ' + Math.round(s.kick * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' age ' + Math.round(s._kAge * 1000) + 'ms str ' + Math.round(s._kStr * 100) + (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm ? ' ' + AUDIOIN.kickBpm + 'bpm' : '') + ' lead ' + Math.round(s.LEAD * 1000) + ')' +
      '   FLUX ' + Math.round(s.flux * 100) +
      '   SPEED L ' + Math.round(s.velL * 100) + ' R ' + Math.round(s.velR * 100) + '   MELODY ' + Math.round(s.mel * 100) + ' (#' + s._melN + ')' +
      '   PAN ' + (inp.audio.pan || 0).toFixed(2) + '   BLOOMS ' + s.blooms.length + '/4   HITS/S ' + s.popRate.toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
