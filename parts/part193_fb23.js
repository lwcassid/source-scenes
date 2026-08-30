/* ---------- SRC-15.23 · FERRO BLOOM V23 (wide arms open the garden)
   Lance's round: "reverse the input for Bloom so it becomes bigger when
   your hands go wide" -- this scene only, the global NEAR=MORE grammar
   stands everywhere else. The flip happens at the scene's own input
   gate (scene-craft law 4's sanctioned move, `1 - inp`): reaching WIDE
   -- arms out, away from the source -- now grows the garden, leaning in
   lets it fold. Everything downstream (adaptive smoothing, bloom slots,
   overflow scatter, the flower-power groove gate, the loop seat) reads
   the same eL/eR it always did; only what a hand position MEANS changed.
   Sleep is untouched: absence still releases the reach to zero over ~7s.
   (V22 notes below.) ------------------------------------------------ */
/* ---------- SRC-15.22 · FERRO BLOOM V22 (the garden gets a loop seat)
   Lance, live: "we need better drums for this one" -- and he seated
   TL_LD_140_Drums_Dubbed (hip-hop dub, 140 source) on the drum rack.
   The truth the rack exposed: Ferro's MIDI groove was only ever the
   shaker tick (51) and the log answers (43/45) -- the browser kick and
   hat never mirror -- so Live's drums were bones. V22 gives Ferro its
   LOOP SEAT: pad 57/A2 (54/55/56 are Chladni/Ridge/EH's), struck once
   on a bar line at first full bloom (flower past half), held all
   scene, faded entirely by ch1 CC74 = the flower gate -- the loop
   swells IN as the garden opens and dies when it sleeps, the LEX
   move. While the loop is held the scene's own timekeepers step back
   (clave tick, browser kick/hat, shaker send) -- the loop IS the
   groove -- and the REACTIVE layer stays: log-drum answers on the real
   toms, births, arp garnish, the Mellotron replies, the bass root on
   the bar. Web-only (no MIDI port) is untouched: no strike, full
   afrobeat groove as before. (V21 notes below.) --------------------- */
/* ---------- SRC-15.21 · FERRO BLOOM V21 (the Mellotron answers)
   The bench-roles round: Lance on the Mellotron -- "makes a fun lead,
   pretty high" -- and Ferro's call-and-response answers are exactly
   that: two high notes in the phrase's gap. They move from the felt
   piano to the MELLOTRON role (ch10). Zero Live-side clicks; the track
   already listens. (V20 notes below.) ------------------------------- */
/* ---------- SRC-15.20 · FERRO BLOOM V20 (the sleeping garden breathes)
   The rest round (Lance: "we need a resting state"). The idle garden
   was a constant quiet drone -- steady, therefore furniture. V20 gives
   it the lure: randomized low breaths on the C pedal (soft sine swells,
   9-25s apart, length and depth rolled per breath), and roughly 1-in-7
   breaths answered by a single soft birth-bell -- the sound of the
   mechanic itself, teasing what a hand would do. Presence pushes the
   breath away; the drone under a player is unchanged. Breaths mirror
   as soft bass notes, the tease bell rings the bells seat.
   (V19 notes below.) ------------------------------------------------ */
/* ---------- SRC-15.19 · FERRO BLOOM V19 (the pocket finds its drums)
   Pre-built rig round (Lance's head-start): V18's MIDI casting had four
   wrong seats. The log-drum answers fired drum notes 63/64 and the clave
   fired 56 -- pads that do not exist on the R&B kit, so Live heard
   nothing; they now land on the real pads (toms 43/45 for the log
   answers, shaker 51 for the clave tick). The 8th-note garnish plucks
   were DOUBLE-sent -- once to arp by the scene, once to lead by the
   pluck2 auto-mirror -- so FELT PIANO was machine-gunning garnish; the
   browser pluck now opts out (midi:false, new engine contract on
   pluck2/bassNote) and only the arp send stands. The groove bass was
   sent twice for the same reason. And every birth now places ONE pad
   note (Jup-8) with velocity from that side's energy -- single placed
   notes, the pad law -- alongside its bell roll, whose velocities are
   now honest instead of flat. expr adds perc = flower.
   Browser sound and visuals untouched from V18. --------------------- */
/* ---------- SRC-15.18 · FERRO BLOOM V18 (V14 + a hand that settles when you hold it) ---------- */
reg({
  id: 'SRC-15.23', family: 'SRC-15', ver: 23,
  title: 'Ferro Bloom V23', tech: 'SHADER FIELD / MOTION ILLUSION',
  music: {
    bpm: 100, root: 48, mode: 'aeolian', chordBars: 2,
    // the soft-piano-blur MIDI, verbatim: a C PEDAL DRONE whose COLOR shifts —
    // the root never moves, the extensions do. Voicings preserved (values
    // past 12 keep the file's actual octave spread, incl. the G/Ab blur).
    chords: [
      [0, 15, 19, 20, 22],  // Cm7b13 — colors stacked high, bar 1 of the file
      [0, 7, 8, 15, 26],    // Cm9b13 — the G/Ab blur cluster
      [0, 10, 15, 17, 26],  // Cm11
      [0, 7, 10, 15, 22]    // Cm7 — resolution
    ],
    chordNames: ['Cm7♭13', 'Cm9♭13', 'Cm11', 'Cm7']
  },
  fx: {},
  tags: ['WILLED BLOOMS', 'ROLLED 9THS', 'BEATS EARN THEIR PLACE', 'CALL & RESPONSE'],
  desc: 'The randomized garden of V13, with the color put back on its own clock. Right still grows the bigger half — up to 10 flowers to the left hand\'s 6 — and the cluster still comes up different every time: the center bloom rerolls its size on each fresh engagement, so sometimes it towers and sometimes a satellite outgrows it, and every flower carries enough position jitter that the fan never fills in quite the same way twice. Hold a hand steady and the garden now HOLDS with it: the reach signal settles instead of shimmering, so flower sizes and the framing stop trembling on a still hand, while a real gesture still lands with no lag. What the hands no longer touch is the gradient. The color bands flow outward and the palette breathes through its warm↔cool scenarios at their own steady pace, exactly as in V12 — an ambient current running underneath whatever the hands are doing, never sped up or dragged by a gesture. Ember orange and blush pink at the warm end, teal/lavender/electric blue at the cool end, chartreuse the pivot. Music unchanged: a three-layer soundscape — C-minor pedal drone whose color shifts, a quantized groove that only exists once the garden is thrown wide open, and a reactive layer where every willed bloom, flick, and stillness sounds back at you.',
  interact: 'BOTH HANDS GROW FLOWERS, NEITHER DRIVES THE COLOR — and in this scene alone, WIDE = MORE (V23): throwing an arm out wide grows that side, leaning in toward the source folds it. L wide summons up to 6 flowers on the left, R wide up to 10 on the right — so the right side fills faster and denser — and each new bloom lands in a fresh random spot at a fresh random size. Push a hand past ~65% wide and that side OVERFLOWS: small scatter blooms flood the full frame edge to edge. The gradient flowing through the petals runs on its own clock throughout — no gesture speeds it up or slows it down. Keep it small and it stays chamber-music quiet; throw both arms wide and the groove fades in. Quick flicks fire log-drum answers only in full bloom. Stillness after a gesture invites the garden to answer.',
  sound: 'Pinned to a C minor pedal, made to jam (chord name on the HUD). DRONE: soft triangle voices, one per bloom, panned to their side, sub C underneath — the root never moves, the color does. QUANTIZED: chord shifts every 2 bars with a rolled entrance; groove exists ONLY past ~55% spread — and it is LOOP-FIRST now (V22): pad 57/A2 (the dub loop seat) is struck once on a bar line at first full bloom and held all scene, faded entirely by ch1 CC74 = the flower gate, so the loop swells in as the garden opens and dies when it sleeps; while the loop is held the scene\'s own clave/hat/kick step back and only the reactive layer rides it. No MIDI port = the old afrobeat groove, unchanged. REACTIVE: births roll chord tones, flicks fire log-drum answers, stillness earns the two-note reply (the MELLOTRON\'s, ch10 - V21). Ableton: births place single pad notes (velocity by side), bell rolls on bells, garnish 8ths on arp, groove bass + kick/hat/clave/log-toms on the real kit pads (36/42/51/43/45), CC74: pad = spread, arp = flick, perc = flower gate. THE REST (V20): the sleeping garden breathes - randomized low pedal swells (soft bass notes), 1-in-7 answered by a single birth-bell tease.',
  init(P) {
    P.state = {
      pres: 0, count: 1, uph: 0, pulse: 0, breath: 0,
      eL: 0, eR: 0, vel: 0, spread: 0, pL: 0, pR: 0, still: 0,
      bL: 0, bR: 0, dbL: 0, dbR: 0,
      heroScale: 0.30, wasActive: false,
      want: new Array(17).fill(0),
      birth: new Array(17).fill(0),
      lit: new Array(17).fill(0),
      pop: new Array(17).fill(0),
      seed: [0, 0.13, 0.71, 0.29, 0.88, 0.45, 0.62, 0.07, 0.94, 0.36, 0.53, 0.19, 0.80, 0.61, 0.24, 0.85, 0.42],
      newBorn: []
    };
    P.state.want[0] = 1; P.state.birth[0] = 1;
    if (typeof THREE === 'undefined') { P.state.noGL = true; return; }
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(P.w, P.h, false);
    T3.renderer = r;
    const sc = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uni = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(P.w, P.h) },
      uPh: { value: 0 }, uPres: { value: 0 }, uPulse: { value: 0 },
      uBreath: { value: 1 }, uAmb: { value: 1 },
      uEL: { value: 0 }, uER: { value: 0 },
      uHeroScale: { value: 0.30 },
      uBirth: { value: new Float32Array(17) }, uLit: { value: new Float32Array(17) },
      uPop: { value: new Float32Array(17) },
      uSeed: { value: new Float32Array(P.state.seed) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'uniform float uT, uPh, uPres, uPulse, uBreath, uAmb, uEL, uER, uHeroScale;',
        'uniform vec2 uRes;',
        'uniform float uBirth[17];',
        'uniform float uLit[17];',
        'uniform float uPop[17];',
        'uniform float uSeed[17];',
        'const float TAU = 6.28318530718;',
        // V13: L keeps its 6 slots, R now carries 10 — reaching right floods
        // that half faster and fuller. Position jitter widened on both sides
        // so the cluster doesn't fan out identically every time.
        'vec2 bloomPos(int i, float seed){',
        '  if (i == 0) return vec2(0.0, 0.0);',
        '  bool isL = i <= 6;',
        '  float nSide = isL ? 6.0 : 10.0;',
        '  float j = isL ? float(i) : float(i - 6);',
        '  float base = 3.14159265 * (j - 0.5) / nSide + (seed - 0.5) * 0.75;',
        '  float ang = isL ? (1.5707963 + base) : (-1.5707963 + base);',
        '  float dst = 0.20 + 0.32 * fract(seed * 7.31) + 0.12 * (j / nSide);',
        '  return vec2(cos(ang), sin(ang)) * dst;',
        '}',
        // V13: the center bloom's size is rerolled each time the garden
        // wakes (uHeroScale, set from JS) — sometimes it's the biggest
        // thing here, sometimes a satellite grows bigger than it.
        'float bloomScale(int i, float seed){ return i == 0 ? uHeroScale : (0.10 + 0.22 * fract(seed * 3.7)); }',
        // V10: the HERO gets a dedicated, clean flower silhouette — six
        // deep-cut petals with flattened tips — instead of the shallow,
        // low-frequency wobble that read as a blob. Satellites keep the
        // V9 two-harmonic blend (soft round through spiky, seed-driven).
        'float bloomShapeR(int i, float seed, float th, float wob, float S){',
        '  if (i == 0) {',
        '    float phaseT = uT * 0.06 + sin(uT * 0.22) * 0.35;',
        '    float raw = cos(6.0 * th + phaseT);',
        '    float shaped = sign(raw) * pow(abs(raw), 0.6);',
        '    return S * (1.0 + (0.26 + wob * 0.4) * shaped);',
        '  }',
        '  float k1 = 3.0 + floor(fract(seed * 11.7) * 4.0);',
        '  float k2 = 7.0 + floor(fract(seed * 19.3) * 5.0);',
        '  float mixK = fract(seed * 27.1);',
        '  float phaseT = float(i) * 1.9 + uT * (seed - 0.5) * 0.7 + sin(uT * 0.22 + float(i)) * 0.35;',
        '  float lobe1 = cos(k1 * th + phaseT);',
        '  float lobe2 = cos(k2 * th + phaseT * 1.3 + 2.1);',
        '  float lobes = mix(lobe1, lobe2, mixK);',
        '  float amp = 0.09 + 0.30 * fract(seed * 8.3);',
        '  return S * (1.0 + (amp + wob * 0.5) * lobes);',
        '}',
        // V11: ORDERED warm→cool palette (7 stops, non-cyclic). Ember and
        // blush anchor the warm end, teal/lavender/electric-blue the cool
        // end, chartreuse sits as the pivot between them.
        'vec3 paletteStop(float i){',
        '  if (i < 0.5) return vec3(0.98, 0.62, 0.34);',   // ember orange — warmest
        '  if (i < 1.5) return vec3(0.95, 0.55, 0.62);',   // blush pink
        '  if (i < 2.5) return vec3(1.0, 0.341, 0.831);',  // hot orchid
        '  if (i < 3.5) return vec3(0.878, 1.0, 0.161);',  // acid chartreuse — the pivot
        '  if (i < 4.5) return vec3(0.16, 0.55, 0.58);',   // teal
        '  if (i < 5.5) return vec3(0.58, 0.56, 0.90);',   // lavender
        '  return vec3(0.0, 0.263, 1.0);',                  // electric blue — coolest
        '}',
        'vec3 warmCoolPalette(float t){',
        '  float x = clamp(t, 0.0, 1.0) * 6.0;',
        '  float seg = floor(x);',
        '  float fr = smoothstep(0.0, 1.0, x - seg);',
        '  return mix(paletteStop(seg), paletteStop(min(seg + 1.0, 6.0)), fr);',
        '}',
        // V14: back to V12 — the mood runs on raw time, one slow warm↔cool
        // breath (~7 min per cycle) that no hand can hurry or hold back.
        'float seqMood(){ return 0.5 + 0.5 * sin(uT * 0.015); }',
        'void main(){',
        '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
        '  float spread = (uEL + uER) * 0.5;',
        '  p /= 0.62 + 0.58 * spread;',
        '  float breathAmt = 0.015 + 0.035 * uBreath;',
        '  p *= 1.0 / (1.0 + breathAmt * sin(uT * 0.45));',
        // V7: constant union softness — the flowers INTERMESH into one
        // breathing mass again (the V5 look Lance preferred)
        '  float k = 0.15;',
        '  float mood = seqMood();',
        '  float acc = 0.0;',
        '  float hueAcc = 0.0;',
        '  vec3 col = vec3(0.0);',
        '  float coreSum = 0.0; vec3 coreCol = vec3(0.0);',
        '  for (int i = 0; i < 17; i++){',
        '    float b = uBirth[i];',
        '    if (b < 0.02) continue;',
        '    float seed = uSeed[i];',
        '    vec2 bp = bloomPos(i, seed);',
        '    vec2 q = p - bp;',
        '    float d = length(q);',
        '    float th = atan(q.y, q.x);',
        '    float sideE = i == 0 ? spread : (i <= 6 ? uEL : uER);',
        '    float wob = (0.05 + 0.10 * uBreath) * sin(uT * 0.35 + float(i) * 2.1 + th * 2.0);',
        '    float S = bloomScale(i, seed) * (0.25 + 0.75 * b) * (0.35 + 0.85 * sideE);',
        '    float R = bloomShapeR(i, seed, th, wob, S);',
        '    float f = d / max(R, 1e-4);',
        '    float w = exp(-f / k);',
        '    acc += w;',
        // V12: hue jitters around the shared MOOD center (not position) —
        // every flower can land anywhere near the current warm↔cool point,
        // so colors mix freely across the frame while the whole garden
        // still drifts together as the mood breathes.
        '    float hueJitter = (fract(seed * 13.7) - 0.5) * 0.44;',
        '    hueAcc += clamp(mood + hueJitter, 0.0, 1.0) * w;',
        '    float cr = S * (0.16 + 0.05 * uLit[i]);',
        '    float g1 = exp(-pow(d / cr, 2.0)) * min(b, 1.0);',
        '    coreSum += g1;',
        '    coreCol += (vec3(1.0, 0.47, 0.16) * g1 * (0.85 + uPulse * 0.5 + uLit[i] * 1.3)',
        '             +  vec3(1.0, 0.82, 0.6) * exp(-pow(d / (cr * 0.38), 2.0)) * min(b, 1.0) * (0.7 + uLit[i]));',
        // V6: BIRTH RIPPLE — a fat ring racing outward as the bloom pops
        '    float pp = uPop[i];',
        '    if (pp > 0.02) {',
        '      float rr = (1.0 - pp) * (0.30 + 1.6 * S);',
        '      float ring = exp(-pow((d - rr) / 0.055, 2.0));',
        '      coreCol += vec3(1.0, 0.72, 0.48) * ring * pp * 0.20;',
        '    }',
        '  }',
        // V8 OVERFLOW: past ~65% reach on a side, small scatter blooms flood
        // that half of the FULL frame — staggered thresholds so pushing to
        // max pops them one after another, edge to edge. Same union field,
        // so they intermesh with the mass. Existence is willed (steep gates
        // on the hand); only placement and petal count are dice.
        '  for (int j = 0; j < 16; j++){',
        '    float sj = float(j);',
        '    float h1 = fract(sin(sj * 127.1 + 3.7) * 43758.5453);',
        '    float h2 = fract(sin(sj * 269.5 + 1.3) * 43758.5453);',
        '    float h3 = fract(sin(sj * 419.2 + 7.1) * 43758.5453);',
        '    float sideE = j < 8 ? uEL : uER;',
        '    float th0 = 0.62 + 0.30 * h1;',
        // V18: the old 0.045 gate snapped a scatter bloom to full size across
        // barely 4% of reach, so hovering near one popped it in and out. A much
        // wider window fades it in instead — no pop, and nothing to flicker.
        '    float gate = smoothstep(th0, th0 + 0.13, sideE);',
        '    if (gate < 0.01) continue;',
        '    float sx = (0.28 + 0.44 * h2) * (j < 8 ? -1.0 : 1.0);',
        '    float sy = (h3 - 0.5) * 0.92;',
        '    vec2 q = p - vec2(sx, sy);',
        '    float d2 = length(q);',
        '    float th2 = atan(q.y, q.x);',
        '    float kk = 3.0 + floor(h1 * 7.0);',
        '    float amp2 = 0.14 + 0.22 * h2;',
        '    float S2 = (0.050 + 0.045 * h2) * gate * (0.7 + 0.3 * sideE);',
        '    float R2 = S2 * (1.0 + amp2 * cos(kk * th2 + sj * 2.3 + uT * (h3 - 0.5) * 0.8));',
        '    float f2 = d2 / max(R2, 1e-4);',
        '    float w2 = exp(-f2 / k);',
        '    acc += w2;',
        '    float hueJitter2 = (h3 - 0.5) * 0.44;',
        '    hueAcc += clamp(mood + hueJitter2, 0.0, 1.0) * w2;',
        '    coreCol += vec3(1.0, 0.62, 0.30) * exp(-pow(d2 / max(S2 * 0.30, 1e-4), 2.0)) * gate * 0.28;',
        '  }',
        '  float f = -k * log(max(acc, 1e-20));',
        '  float hueOff = clamp(hueAcc / max(acc, 1e-20), 0.0, 1.0);',
        // V7: the bent-phase illusion is BACK (V5's energy), seam tamed not
        // erased — uPh wraps mod 4 (the tint period) so the converging
        // filigree stays a slim bounded band of fine detail, never a wall.
        '  float dir = 1.0 - 2.0 * smoothstep(0.48, 0.62, f);',
        // V9 SOFT GRADIENT: fewer, wider bands and a compressed cosine swing
        // so luminance never flatlines at either extreme — this is what
        // carries the outward-flowing motion now, not hue-cycling.
        '  float bandsN = 2.6;',
        '  float phase = f * bandsN - mod(uPh, 4.0) * dir;',
        '  float band = 0.5 + 0.28 * cos(TAU * phase);',
        '  vec3 deep = vec3(0.05, 0.09, 0.30);',
        '  vec3 cream = vec3(0.97, 0.90, 0.80);',
        '  float warmMix = 0.35 * (1.0 - smoothstep(0.0, 0.55, f));',
        // V12: richer ring-to-ring hue drift — the painterly, multi-tone
        // banding V9 had — while staying anchored to this pixel's own local
        // hueOff, so it reads as one flower's gradient, not a full-palette
        // tour.
        '  float hueWobble = 0.20 * sin(phase * 1.3);',
        '  float t = clamp(hueOff + hueWobble, 0.0, 1.0);',
        '  vec3 tint = warmCoolPalette(t);',
        '  tint = mix(tint, vec3(0.98, 0.55, 0.38), warmMix);',
        '  vec3 bc = mix(deep, tint, smoothstep(0.0, 1.0, band));',
        '  bc = mix(bc, cream, 0.40 * smoothstep(0.55, 0.78, band));',
        '  float inside = 1.0 - smoothstep(0.90, 1.02, f);',
        '  float presL = 0.40 + 0.60 * uPres;',
        '  col += bc * inside * presL * (0.52 + 0.44 * band) * (1.0 + uPulse * 0.18);',
        '  col += tint * exp(-max(f - 1.0, 0.0) * 4.0) * 0.10 * presL;',
        '  col += coreCol;',
        '  for (int j = 0; j < 3; j++){',
        '    float fj = float(j);',
        '    vec2 aq = vec2(sin(uT * 0.045 + fj * 2.1) * 0.66, cos(uT * 0.037 + fj * 3.7) * 0.44);',
        '    vec2 av = p - aq;',
        '    float ad = length(av);',
        '    float ath = atan(av.y, av.x);',
        '    float aS = 0.075 + 0.02 * sin(fj * 5.0);',
        '    float aR = aS * (1.0 + 0.18 * cos((5.0 + fj) * ath + fj * 2.0 + uT * 0.1));',
        '    float af = ad / aR;',
        '    float aband = pow(0.5 + 0.5 * cos(TAU * (af * 3.0 - uT * 0.05 - fj)), 0.8);',
        '    float ain = 1.0 - smoothstep(0.85, 1.05, af);',
        '    float ambT = clamp(mood + (fract(fj * 0.61) - 0.5) * 0.4, 0.0, 1.0);',
        '    col += mix(deep, warmCoolPalette(ambT), aband) * ain * 0.34 * uAmb;',
        '    col += vec3(1.0, 0.5, 0.2) * exp(-pow(af / 0.22, 2.0)) * 0.4 * uAmb;',
        '  }',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = sc; T3.cam = cam;
  },
  step(P, dt, t, inp) {
    const s = P.state;
    if (s.noGL) return;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // V23: THIS SCENE READS WIDE = MORE (Lance). inp arrives lean-in = 1
    // (the global NEAR=MORE grammar); Ferro alone inverts at its own gate,
    // so arms thrown wide grow the garden and leaning in folds it.
    const tL = 1 - clamp(inp.L), tR = 1 - clamp(inp.R);
    s.vel = s.vel * Math.max(0, 1 - dt * 2.2) + (Math.abs(tL - s.pL) + Math.abs(tR - s.pR)) * 6;
    s.pL = tL; s.pR = tR;
    // V18: ADAPTIVE SMOOTHING — a held hand is never perfectly still, and the
    // old near-passthrough filter (dt*28) passed that tremor straight through
    // into every flower's scale and the global zoom, so the field shimmered
    // when it should have settled. Each hand keeps a SLOW BASELINE of where it
    // has been sitting; how far the live reading sits from that baseline says
    // whether this is a real gesture or just jitter. Far from baseline → track
    // fast, so a genuine move has no lag. Close to it → smooth hard, so the
    // garden locks still while the hand holds.
    // 1. DEADBAND — the reach only moves by the part of a change that exceeds
    //    a hair's width, so tremor below that produces literally no movement.
    const DEAD = 0.008;
    const settle = (raw, held) => { const d = raw - held; return Math.abs(d) > DEAD ? raw - Math.sign(d) * DEAD : held; };
    // THE GARDEN SLEEPS (V22, the Lumen law): absence releases the reach
    // to ZERO over ~7s. The old tracking held eL/eR wherever the hands
    // left them, so the garden stayed in full bloom all night -- and now
    // that a LOOP rides ch1 CC74 = flower, a frozen flower would keep the
    // dub loop playing to an empty room. The blooms fold, flower falls,
    // the loop fades with it; first touch re-opens fast (deviation from a
    // zeroed baseline reads as a big gesture -> fast track).
    if (!live) {
      const rel = Math.min(1, dt * 0.4);
      s.eL += (0 - s.eL) * rel; s.eR += (0 - s.eR) * rel;
      s.bL += (0 - s.bL) * rel; s.bR += (0 - s.bR) * rel;
      s.dbL += (0 - s.dbL) * rel; s.dbR += (0 - s.dbR) * rel;
    } else {
      s.dbL = settle(tL, s.dbL); s.dbR = settle(tR, s.dbR);
      // 2. ADAPTIVE RATE — the baseline is where the hand has been sitting; how
      //    far the reading has departed from it separates a gesture from noise.
      s.bL += (s.dbL - s.bL) * Math.min(1, dt * 2.5);
      s.bR += (s.dbR - s.bR) * Math.min(1, dt * 2.5);
      const trackRate = dev => 4 + 26 * Math.min(1, Math.max(0, (dev - 0.04) / 0.14));
      s.eL += (s.dbL - s.eL) * Math.min(1, dt * trackRate(Math.abs(s.dbL - s.bL)));
      s.eR += (s.dbR - s.eR) * Math.min(1, dt * trackRate(Math.abs(s.dbR - s.bR)));
    }
    s.spread = (s.eL + s.eR) / 2;
    // stillness clock — the call-and-response trigger
    if (s.vel < 0.06 && s.pres > 0.3) s.still += dt; else s.still = 0;
    if (s.pres < 0.12) { s.idleT = (s.idleT || 0) + dt; } else s.idleT = 0;
    const sleeping = (s.idleT || 0) > 12;
    // V13: reroll the hero's size on every fresh wake — sometimes it's the
    // biggest bloom here, sometimes a satellite outgrows it.
    if (s.pres > 0.5 && !s.wasActive) {
      s.heroScale = 0.20 + Math.random() * 0.20;
    }
    s.wasActive = s.pres > 0.5;
    // V13: L keeps its 6 slots, R now carries 10 — reach it out and that
    // side floods faster and fuller than the left ever could.
    const L_N = 6, R_N = 10;
    const posL = s.eL * (L_N - 0.01), posR = s.eR * (R_N - 0.01);
    let cL = 0, cR = 0;
    for (let i = 1; i <= L_N + R_N; i++) {
      const isL = i <= L_N;
      const j = isL ? i : i - L_N;
      const pos = isL ? posL : posR;
      if (!s.want[i] && !sleeping && pos >= j + 0.30) {
        s.want[i] = 1; s.seed[i] = Math.random(); s.pop[i] = 1;
        s.newBorn.push(i);
      } else if (s.want[i] && (sleeping || pos <= j - 0.40)) {
        s.want[i] = 0;
        s.lit[i] = 1; // ember flare as it collapses
      }
      if (s.want[i]) { if (isL) cL++; else cR++; }
    }
    s.cL = cL; s.cR = cR;
    s.count = 1 + cL + cR;
    // V14: the gradient runs on its OWN clock — a constant outward flow rate
    // with no spread, reach, or velocity term anywhere in it. Only presence
    // touches it, and only to let an abandoned scene settle toward rest
    // (design law: idle drifts back). No gesture speeds it up or slows it.
    // 0.44/sec is exactly what V12 ran at full bloom (0.02 + spread^1.4*0.42),
    // the state this gradient was tuned and approved in — now held constant.
    s.uph += dt * 0.44 * (0.35 + 0.65 * s.pres);
    s.pulse = Math.max(0, s.pulse - dt * 3.2);
    for (let i = 0; i < L_N + R_N + 1; i++) {
      const want = i === 0 ? 1 : s.want[i];
      s.birth[i] += (want - s.birth[i]) * Math.min(1, dt * (want ? 9 : 7));
      s.pop[i] = Math.max(0, s.pop[i] - dt * 3.0);
      s.lit[i] = Math.max(0, s.lit[i] - dt * 3.5);
    }
    s.breath = 1 - s.pres * 0.7;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    if (s.noGL || !P._three) {
      g.fillStyle = '#04050c'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(150,180,220,0.7)'; g.font = `${Math.max(10, h * 0.03)}px ui-monospace,monospace`;
      g.textAlign = 'center';
      g.fillText('FERRO BLOOM V18 · STEADY HAND', w / 2, h / 2 - 12);
      g.fillText('open on the hosted site (WebGL)', w / 2, h / 2 + 14);
      g.textAlign = 'left';
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = t; u.uPh.value = s.uph;
    u.uPres.value = s.pres; u.uPulse.value = s.pulse;
    u.uBreath.value = s.breath;
    u.uAmb.value = Math.max(0, 1 - s.pres * 1.4) * 0.9;
    u.uEL.value = s.eL; u.uER.value = s.eR;
    u.uHeroScale.value = s.heroScale;
    for (let i = 0; i < 17; i++) {
      u.uBirth.value[i] = s.birth[i] * (1 + 0.25 * s.pop[i]);
      u.uLit.value[i] = s.lit[i];
      u.uPop.value[i] = s.pop[i];
      u.uSeed.value[i] = s.seed[i];
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(200,190,210,0.75)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BLOOMS ' + s.count + '/17 (L ' + (s.cL || 0) + ' · R ' + (s.cR || 0) + ')' + ((s.eL > 0.66 || s.eR > 0.66) ? ' + SCATTER' : '') + '  ·  ' + (H.label || '') + '  ·  L ' + Math.round(s.eL * 100) + ' / R ' + Math.round(s.eR * 100) + (s.pres < 0.3 ? '  ·  SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const f = v.filter('lowpass', 600, 0.7);
    f.connect(v.group);
    const sideOf = i => i === 0 ? 0 : (i <= 6 ? -1 : 1);
    // V7: NO JET. Triangle voices, quiet, and chord changes SNAP with a tiny
    // glide (0.18s) instead of a 1.6s portamento smear across 13 saws.
    // V13: 17 voices now (1 hero + 6 L + 10 R) — every willed bloom sounds.
    const voices = [];
    for (let i = 0; i < 17; i++) {
      const o = v.osc('triangle', H.chordTone(i, 0));
      const gg = v.g(0.0001);
      o.connect(gg); gg.connect(f);
      voices.push({ o, gg, idx: i });
    }
    const sub = v.osc('sine', H.chordTone(0, -1));
    const subG = v.g(0.026); sub.connect(subG); subG.connect(v.group);
    if (A.revIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.6; f.connect(s2); s2.connect(A.revIn); }
    let answered = false;
    H.onChord(() => {
      voices.forEach(vc => A.set(vc.o.frequency, H.chordTone(vc.idx, 0), 0.18));
      A.set(sub.frequency, H.chordTone(0, -1), 0.3);
      answered = false;
      // V7: the TRANSITION is the featured moment — each chord change gets a
      // gentle low-to-high roll (the vibe of the inspiration MIDI), scaled by
      // how much garden is awake
      const s = P.state;
      if (s.pres > 0.2) {
        const base = T.next(0.25);
        const nn = s.spread > 0.5 ? 4 : 3;
        for (let ri = 0; ri < nn; ri++) {
          const freq = H.chordTone(ri, 1);
          const at = base + ri * 0.09;
          A.bell(freq, { at, vol: 0.032 + 0.008 * s.spread, dur: 3.2, rev: 0.8, pan: (ri - 1.5) * 0.2, midi: false });
          MOut.evNote('bells', freq, 0.07 + 0.05 * s.spread, at, 2.6);
        }
      }
    });
    v.fadeIn(1, 1.2);
    // gentle afrobeat: son-clave bell, shaker 16ths, sparse kick, log answers
    const BELL = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0];
    const KICKP = [1, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 1, 0, 0, 0, 0, 0];
    let nextT = T.next(0.25), step16 = 0, arpIdx = 0, sparkIdx = 0, fillCool = 0;
    // THE REST: the sleeping garden breathes on its own clock
    let nextBreath = A.t() + 4 + Math.random() * 6;
    return {
      tick(inp) {
        const s = P.state;
        // V7: FLOWER-POWER GATE — percussion exists only when the garden is
        // wide open. Below that: pads, rolls, answers. Silence has room.
        const flower = clamp((s.spread - 0.55) / 0.3);
        // THE LOOP SEAT (V22): pad 57/A2 struck once on a bar line at
        // first full bloom, held all scene; ch1 CC74 (= flower, sent
        // below) does every fade, so the loop breathes with the garden
        if (typeof MOut !== 'undefined' && !s._loopHeld && flower > 0.5 && s.pres > 0.25 && MOut.wants() && T.running) {
          s._loopHeld = true;
          const barLen = T.beat * 4;
          const nextBar = T.t0 + Math.ceil((A.t() - T.t0) / barLen) * barLen;
          MOut.evNote('perc', 220.0, 0.22, nextBar, 3600);   // 220Hz -> note 57
        }
        /* THE REST: randomized low breaths on the pedal, 1-in-7 answered
           by a soft birth-bell tease -- pushed away by presence */
        if (s.pres < 0.25) {
          if (A.t() >= nextBreath) {
            const deep = Math.random() < 1 / 7;
            const bvol = (0.03 + Math.random() * 0.03) * (deep ? 1.6 : 1);
            A.tone(H.chordTone(0, -1), { at: A.t() + 0.05, vol: bvol, dur: 2.2 + Math.random() * 2.5, attack: 0.9 + Math.random(), type: 'sine', rev: 0.4, role: 'bass' });
            if (deep) A.bell(H.chordTone(2, 0), { at: A.t() + 0.25, vol: 0.035, dur: 4, rev: 0.8 });
            nextBreath = A.t() + 9 + Math.random() * 16;
          }
        } else nextBreath = Math.max(nextBreath, A.t() + 5);
        A.set(f.frequency, 320 + s.spread * 1600 + Math.min(0.5, s.vel) * 900 + s.pres * 260, 0.25);
        voices.forEach((vc, i) => {
          const on = i === 0 ? 1 : s.want[i];
          const se = sideOf(i);
          const sideE = se === 0 ? s.spread : (se < 0 ? s.eL : s.eR);
          A.set(vc.gg.gain, (on ? 0.0065 + 0.008 * sideE : 0.0001) * (0.45 + 0.55 * s.pres), on ? 0.35 : 0.15);
        });
        MOut.expr('pad', s.spread); MOut.expr('arp', clamp(s.vel)); MOut.expr('perc', flower);
        // births roll their chord tones — darker register, quieter than V6
        let casc = 0;
        while (s.newBorn.length) {
          const bi = s.newBorn.shift();
          const pan = sideOf(bi) * 0.5;
          const sideE = sideOf(bi) < 0 ? s.eL : sideOf(bi) > 0 ? s.eR : s.spread;
          const base = Math.max(A.t() + 0.02, T.next(0.25)) + casc * 0.05;
          [0, 1, 2].forEach(ri => {
            const freq = H.chordTone((bi % 5) + ri * 2, 0);
            const at = base + ri * 0.07;
            A.bell(freq, { at, vol: 0.030 + ri * 0.004, dur: 2.2, rev: 0.7, pan, midi: false });
            MOut.evNote('bells', freq, 0.05 + 0.05 * sideE, at, 1.9);
          });
          // ONE placed pad note per bloom -- the pad law: intentional,
          // never a wash; velocity is the summoning hand's energy
          MOut.evNote('pad', H.chordTone(bi % 5, 0), 0.06 + 0.06 * sideE, base, 3.2);
          s.lit[bi] = 1;
          casc++;
        }
        // gesture flick → log-drum answer, only once the garden is open
        fillCool = Math.max(0, fillCool - 0.03);
        if (s.vel > 0.55 && fillCool <= 0 && flower > 0) {
          fillCool = 0.6;
          const pan = s.eL > s.eR ? -0.4 : 0.4;
          const t1 = T.next(0.25), t2 = t1 + T.beat * 0.25;
          A.pluck2(H.chordTone(0, 0), { at: t1, vol: 0.06 * flower, dur: 0.3, pan, rev: 0.25, midi: false });
          A.pluck2(H.chordTone(2, 0), { at: t2, vol: 0.05 * flower, dur: 0.3, pan: -pan * 0.5, rev: 0.25, midi: false });
          // the log answers live on the kit's REAL wood: toms 43/45
          // (63/64 were empty pads -- Live heard nothing)
          MOut.evDrum(43, 0.4 * flower, t1); MOut.evDrum(45, 0.32 * flower, t2);
        }
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          const st32 = step16 % 32; // 2-bar chord phrase
          const tt = nextT;
          // EXPANDED FLOWER POWER ONLY: the groove fades in past ~55% spread
          if (flower > 0 && s.pres > 0.25) {
            // once the loop is seated it IS the groove: the scene's own
            // timekeepers (clave tick, hat, kick, shaker send) step back
            // and only the reactive layer plays over it
            if (!s._loopHeld) {
              if (BELL[st]) {
                A.pluck2(H.scaleTone(4, 1), { at: tt, vol: 0.020 * flower, dur: 0.12, pan: 0.3, rev: 0.12, midi: false });
                MOut.evDrum(51, 0.3 * flower, tt);   // shaker pad -- 56 was empty
              }
              A.hat(tt, { vol: (0.008 + (st % 4 === 2 ? 0.010 : 0)) * flower });
              if (KICKP[st] && flower > 0.4) A.kick(tt, 0.15 * flower * KICKP[st]);
            }
            if (KICKP[st] && flower > 0.4) s.pulse = 1;   // visuals keep the pump either way
            if (st === 0 && flower > 0.3) {
              A.bassNote(H.chordTone(0, -1), { at: tt, vol: 0.055 * flower, dur: 0.5, midi: false });
              MOut.evNote('bass', H.chordTone(0, -1), 0.25 * flower, tt, 0.45);
            }
          }
          // CALL & RESPONSE: hands still in the phrase's last quarter → the
          // garden answers with two high notes in the gap (the MIDI's move)
          if (st32 === 24 && !answered && s.still > 0.8 && s.pres > 0.3) {
            answered = true;
            const n1 = H.chordTone(4, 2), n2 = H.chordTone(3, 2);
            A.bell(n1, { at: tt, vol: 0.055, dur: 2.2, rev: 0.8, pan: -0.2 });
            A.bell(n2, { at: tt + T.beat * 0.75, vol: 0.05, dur: 2.6, rev: 0.85, pan: 0.2 });
            // the answers are the Mellotron's now (Lance: "fun lead,
            // pretty high") -- tape-flute replies in the phrase's gap
            MOut.evNote('mellotron', n1, 0.12, tt, 1.2);
            MOut.evNote('mellotron', n2, 0.11, tt + T.beat * 0.75, 1.6);
          }
          // arp is garnish, and only in full bloom — when the scatter tier is
          // out (either side pushed past ~65%) it sparkles an octave higher
          if (st % 2 === 0 && flower > 0.2 && s.pres > 0.15) {
            const act = [0];
            for (let i = 1; i < 17; i++) if (s.want[i]) act.push(i);
            const bi = act[arpIdx % act.length];
            const scatter = (s.eL > 0.66 || s.eR > 0.66) && arpIdx % 3 === 0;
            const freq = H.chordTone(bi, scatter ? 2 : 1);
            A.pluck2(freq, { at: tt, vol: 0.016 * flower + 0.012, pan: sideOf(bi) * 0.55, rev: 0.5, del: 0.25, midi: false });
            MOut.evNote('arp', freq, 0.07 * flower + 0.03, tt, 0.3);
            s.lit[bi] = Math.max(s.lit[bi], 0.8);
            arpIdx++;
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < A.t()) nextT = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
