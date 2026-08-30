/* ---------- SRC-47 · CLOUD STEAM V1 (the fluff, and the heart) ----------
   Nima's reference plates: cotton-candy cumulus, blush and rose and cream,
   and one of them a heart made of steam. "I like that but I don't want ours
   to always be a heart, maybe it turns into heart if there's a big rise/drop."

   So the heart is an EVENT, not the scene. The scene is a bank of steam
   floating in black, and the third audio-in instrument in the set — it had
   to take a job neither sibling owns:
     · Cell Front  owns "three pockets, one per band, hands paint the palette".
     · Penrose Bloom owns "loudness is SIZE, spectrum is COLOUR".
     · CLOUD STEAM owns FLUFF. The spectrum CARVES the cloud — treble weights
       the fine octaves (hats and air shred the billows into filigree; a dark
       bassy passage leaves smooth mounds), mid sets how curdled the domain
       warp is, bass is the light burning inside the mass. Loudness only sizes
       the bank; the kick puffs it. Colour is one palette, always — the plates'
       palette — because the ask was the palette.

   THE HEART. A big RISE (the drop landing) or a big FALL (it dropping out)
   condenses the whole bank into a heart over ~0.6s, holds it a few seconds
   scaled by how big the event was, and lets it billow apart again. Rate
   limited to one every 14s so it stays an occasion. The house SUMMONS (park
   the left hand at the source, wiggle the right) fires one on demand — but
   it keeps visiting uninvited anyway, because ownership is priority, not
   exclusivity (Lance, WS V7→V8).

   HANDS are the weather, not a fake audio level (Nima, Cell Front V5): they
   never pretend to be the signal, they shape the mass the signal fills.
   NEAR = MORE, so maximum lives at the source and not at the sensor's far
   edge, and a hand leaving the field decays to calm instead of cutting off
   at peak. LEFT is WIND — the steam streams sideways and the bank pulls
   wide, and the left side of the cloud warms toward apricot. RIGHT is HEAT —
   the bank stacks into towers and boils harder, and the right side cools
   toward lilac. That is the side law's warm/cool axis living inside the
   plates' pink, keyed off the cloud's OWN extent, never off screen position.
   ------ */
const CS_UNIT = [
  [-1.00, -0.10, 0.80],
  [-0.54,  0.42, 0.98],
  [ 0.00,  0.00, 1.06],
  [ 0.56,  0.46, 0.96],
  [ 1.00, -0.14, 0.78]
];
const CS_LOBES = s => CS_UNIT.map((u, i) => [
  u[0] * s.spanX + s.bob[i][0],
  u[1] * s.spanY + s.bob[i][1],
  u[2] * s.R
]);

const CS_FS = [
  'precision highp float;',
  'uniform float uT, uPres, uHeart, uKick, uGlow, uWind, uHeat;',
  'uniform float uAmp, uOccN, uHaze, uHazeAmt, uFine, uWarp, uFreq, uDrift, uBoil;',
  'uniform float uS1, uS2, uSN1, uSN2;',
  'uniform float uHeartR, uHeartY, uBail;',
  'uniform vec2 uRes, uSpan, uLdir;',
  'uniform vec3 uLobe[5];',
  // the plates' palette: deep rose in the crevices (near-black on scrim, which
  // is where black belongs), through rose and blush to a cream highlight.
  'const vec3 CS_SHADOW = vec3(0.19, 0.032, 0.10);',
  'const vec3 CS_ROSE   = vec3(0.90, 0.33, 0.50);',
  'const vec3 CS_PINK   = vec3(0.99, 0.62, 0.72);',
  'const vec3 CS_BLUSH  = vec3(1.00, 0.83, 0.86);',
  'const vec3 CS_CREAM  = vec3(1.00, 0.94, 0.88);',
  // the side law, inside the palette: warm apricot left, cool lilac right
  'const vec3 CS_WARM = vec3(1.16, 0.85, 0.64);',
  'const vec3 CS_COOL = vec3(0.85, 0.83, 1.19);',
  // Hoskins hash — the cheap fract(p.x*p.y) one leaves its lattice visible,
  // and a directional derivative turns that lattice into blocky seams.
  'float h21(vec2 p){',
  '  vec3 p3 = fract(vec3(p.xyx) * 0.1031);',
  '  p3 += dot(p3, p3.yzx + 33.33);',
  '  return fract((p3.x + p3.y) * p3.z);',
  '}',
  'float vnoise(vec2 p){',
  '  vec2 i = floor(p), f = fract(p);',
  '  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);',
  '  float a = h21(i), b = h21(i + vec2(1.0, 0.0));',
  '  float c = h21(i + vec2(0.0, 1.0)), d = h21(i + vec2(1.0, 1.0));',
  '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
  '}',
  // ROUNDED RIDGES — the difference between smoke and cauliflower. Only the
  // SILHOUETTE is built from these; the creases must never reach the lighting.
  'float billow(vec2 p){ return 1.0 - abs(2.0 * vnoise(p) - 1.0); }',
  'float smaxF(float a, float b, float k){',
  '  float h = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);',
  '  return mix(b, a, h) + k * h * (1.0 - h);',
  '}',
  // the bank: five soft lobes welded into one mass (two of them already
  // raised shoulders, so the heart is a short journey away)
  'float bankSD(vec2 p){',
  '  float d = -1e4;',
  '  for (int i = 0; i < 5; i++){',
  '    vec3 L = uLobe[i];',
  '    d = smaxF(d, L.z - length(p - L.xy), L.z * 0.55);',
  '  }',
  '  return d;',
  '}',
  // the heart: the classic implicit (x^2+y^2-1)^3 = x^2 y^3, cube-rooted into
  // something distance-shaped so it mixes smoothly with the bank
  'float heartSD(vec2 p){',
  '  vec2 q = (p - vec2(0.0, uHeartY)) / max(uHeartR, 1e-4);',
  '  float a = dot(q, q) - 1.0;',
  '  float f = a * a * a - q.x * q.x * q.y * q.y * q.y;',
  '  float m = min(abs(f), 400.0);',
  '  return uHeartR * 0.55 * (f < 0.0 ? 1.0 : -1.0) * pow(m, 0.3333);',
  '}',
  'float contSD(vec2 p){ return mix(bankSD(p), heartSD(p), uHeart); }',
  'vec2 warpAt(vec2 q){',
  '  vec2 w = vec2(vnoise(q * 0.62 + vec2(0.0, uBoil * 0.09)),',
  '                vnoise(q * 0.62 + vec2(4.7, uBoil * 0.07)));',
  '  return q + (w - 0.5) * uWarp;',
  '}',
  // THE FLUFF: five billowed octaves. uFine is the treble\'s weight on the top
  // three — this is the band that CARVES.
  'float turbF(vec2 p){',
  '  vec2 q = warpAt(p * uFreq + vec2(uDrift, uDrift * 0.18));',
  '  float a = 0.5, sum = 0.0, nrm = 0.0;',
  '  for (int i = 0; i < 5; i++){',
  '    float fi = float(i);',
  '    float wt = fi > 1.5 ? uFine : 1.0;',
  '    sum += a * wt * billow(q + vec2(0.0, uBoil * (0.05 + 0.055 * fi)));',
  '    nrm += a * wt;',
  '    a *= 0.52; q *= 2.07;',
  '  }',
  '  return sum / max(nrm, 1e-4);',
  '}',
  // THE LIGHT reads a SMOOTH field — plain value fbm, no folds. Differencing
  // two samples of a creased field is what turns billow ridges into hard
  // seams; the smooth twin carries the same big shapes without them.
  'float turbS(vec2 p){',
  '  vec2 q = warpAt(p * uFreq + vec2(uDrift, uDrift * 0.18));',
  '  float a = 0.5, sum = 0.0, nrm = 0.0;',
  '  for (int i = 0; i < 4; i++){',
  '    sum += a * vnoise(q + vec2(0.0, uBoil * (0.05 + 0.055 * float(i))));',
  '    nrm += a; a *= 0.52; q *= 2.07;',
  '  }',
  '  return sum / max(nrm, 1e-4);',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  '  float c0 = contSD(p);',
  '  if (c0 < -uBail){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  // silhouette + fluff
  '  float fluff = turbF(p);',
  '  float ero = uAmp * (0.58 + 0.42 * (1.0 - smoothstep(0.0, uOccN * 0.9, c0)));',
  '  float f0 = c0 + (fluff - 0.50) * ero;',
  '  float edge = max(ero * 0.30, 1e-4);',
  '  float cov = smoothstep(-edge, edge, f0);',
  '  float halo = exp(-max(-f0, 0.0) / max(uHaze, 1e-4)) * (1.0 - cov) * uHazeAmt;',
  '  if (cov + halo < 0.004){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  // volumetric light: a true directional derivative of the SMOOTH field, at
  // one billow (uS1) and one lobe (uS2). Density falling toward the light =
  // a lit cauliflower top; rising = a crevice. Nothing dark is ever drawn ON
  // the cloud — light is only withheld.
  '  float sA = c0 + (turbS(p) - 0.50) * ero;',
  '  vec2 q1 = p + uLdir * uS1, q2 = p + uLdir * uS2;',
  '  float s1 = contSD(q1) + (turbS(q1) - 0.50) * ero;',
  '  float s2 = contSD(q2) + (turbS(q2) - 0.50) * ero;',
  '  float lit = smoothstep(-uSN1, uSN1, sA - s1) * 0.62',
  '            + smoothstep(-uSN2, uSN2, sA - s2) * 0.38;',
  // the billow lobes themselves catch the light — a gentle multiply, never a
  // difference, so the folds stay soft
  '  lit *= 0.66 + 0.52 * fluff;',
  // depth into the mass pulls toward the rose shadow, so crevices read deep
  '  float deep = clamp(f0 / max(uOccN, 1e-4), 0.0, 1.0);',
  '  lit *= 1.0 - 0.40 * deep * deep;',
  // the bass is the light burning INSIDE the mass — it lifts the shadows
  // rather than tinting the picture
  '  float amb = 0.10 + 0.15 * uGlow;',
  '  lit = amb + (1.0 - amb) * clamp(lit, 0.0, 1.0);',
  '  float x = clamp(lit + uGlow * 0.30 * (1.0 - lit), 0.0, 1.0);',
  '  vec3 col = mix(CS_SHADOW, CS_ROSE, smoothstep(0.00, 0.34, x));',
  '  col = mix(col, CS_PINK,  smoothstep(0.26, 0.58, x));',
  '  col = mix(col, CS_BLUSH, smoothstep(0.54, 0.82, x));',
  '  col = mix(col, CS_CREAM, smoothstep(0.80, 1.00, x));',
  // ONE continuous haze field falling off the mass, never a fan of strokes
  '  col = col * cov + mix(CS_ROSE, CS_BLUSH, uGlow) * halo;',
  // warm/cool by side, measured across the CLOUD\'S OWN extent (uSpan), not
  // across the screen — hue comes from the form
  '  float wl = 1.0 - smoothstep(uSpan.x, uSpan.y, p.x);',
  '  col *= mix(vec3(1.0), CS_WARM, clamp(wl * uWind, 0.0, 1.0));',
  '  col *= mix(vec3(1.0), CS_COOL, clamp((1.0 - wl) * uHeat, 0.0, 1.0));',
  '  col *= 1.0 + 0.30 * uHeart + 0.22 * uKick;',
  '  col *= 0.55 + 0.45 * uPres;',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.40);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-47', family: 'SRC-47', ver: 1,
  title: 'Cloud Steam', tech: 'VOLUMETRIC STEAM FIELD / SPECTRUM CARVES THE FLUFF',
  audioIn: true,
  fx: { bloom: 0.30 },
  tags: ['AUDIO IN', 'COTTON CANDY', 'BLUSH + ROSE + CREAM', 'THE SPECTRUM CARVES IT', 'HEART ON THE DROP', 'WIND + HEAT'],
  desc: 'A bank of pink steam floating in black — cotton-candy cumulus, deep rose in the crevices, cream where the light lands. It listens, and the spectrum CARVES it: treble weights the fine octaves, so hats and air shred the billows into filigree while a dark bassy passage leaves smooth heavy mounds; the mids set how curdled the curl is; the bass is a light burning inside the mass, lifting the shadows from rose to blush. Loudness only sizes the bank, and the kick puffs it outward. Then the payoff: when the music makes a big move — the drop landing, or everything falling away — the whole bank CONDENSES INTO A HEART, holds for a few seconds, and billows apart again. Once every fourteen seconds at most, so it stays an occasion. One palette throughout, the plates’ own.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in) — bring it music and it breathes, carves and puffs on its own. The hands are the WEATHER over it, and they answer instantly. LEFT HAND IS WIND: bring it in toward the source and the steam streams sideways, the bank pulls wide and thin, and its left side warms toward apricot. RIGHT HAND IS HEAT: bring it in and the bank stacks upward into boiling towers, and its right side cools toward lilac. Both hands drawn away leaves a calm, low, slow bank — a hand lost by the sensor decays to calm instead of sticking at full. THE HEART comes on its own when the music makes a big move; you can also summon one with the house code — park the left hand at the source and wiggle the right until the charge fills.',
  sound: 'Makes no sound of its own — an audio-in scene, like Cell Front and Penrose Bloom. Connect a source (mic, line-in, or CAPTURE APP AUDIO for a running app’s own output) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants music with real dynamics: it is built around the difference between a section and the section after it, and the heart is the reward for a track that actually goes somewhere.',

  init(P) {
    const s = {
      pres: 0, life: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0,
      kick: 0, _kGap: 1, _kN: -1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      wind: 0, heat: 0,
      drift: 0, boil: 0, ldA: 0,
      eFast: 0, eSlow: 0, swing: 0,
      heart: 0, heartHold: 0, heartGap: 9, heartN: 0, heartStr: 0, _sumWas: false,
      Rbase: 0.150, R: 0.150, spanX: 0.245, spanY: 0.085, heartR: 0.32,
      bob: CS_UNIT.map(() => [0, 0]),
      ax: 0.8, ay: 0.5,
      noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const sc = Math.min(1, 620 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const uni = {
      uT: { value: 0 }, uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uPres: { value: 0 }, uHeart: { value: 0 }, uKick: { value: 0 }, uGlow: { value: 0 },
      uWind: { value: 0 }, uHeat: { value: 0 },
      uAmp: { value: 0.08 }, uOccN: { value: 0.1 }, uHaze: { value: 0.04 }, uHazeAmt: { value: 0.3 },
      uFine: { value: 0.5 }, uWarp: { value: 1.0 }, uFreq: { value: 5.2 },
      uDrift: { value: 0 }, uBoil: { value: 0 },
      uHeartR: { value: 0.32 }, uHeartY: { value: -0.02 }, uBail: { value: 0.4 },
      uS1: { value: 0.02 }, uS2: { value: 0.07 }, uSN1: { value: 0.02 }, uSN2: { value: 0.06 },
      uSpan: { value: new THREE.Vector2(-0.4, 0.4) },
      uLdir: { value: new THREE.Vector2(-0.48, 0.88) },
      uLobe: { value: new Float32Array(15) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: CS_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn; T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    s.life += dt;

    const liveL = chan.L.mode === 'live', liveR = chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((liveL || liveR || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    // HANDS = WEATHER. Near = more, so the maximum sits at the source and a
    // hand drifting out of the field decays to calm (the field-edge law).
    // Vespers-tight: nothing here waits for a grid.
    s.wind += (clamp(inp.L) - s.wind) * Math.min(1, dt * 6);
    s.heat += (clamp(inp.R) - s.heat) * Math.min(1, dt * 6);

    // SLOW BANDS — eased into their own state at ~1.6/s, same two-clock
    // discipline Cell Front V9 landed on: bands shape and size, they never
    // twitch. Silence still breathes.
    const idle = 0.035 + 0.018 * Math.sin(s.life * 0.21);
    const bt = Math.max(idle * (1 - s.pres), clamp(inp.audio.bass));
    const mt = Math.max(idle * 0.7 * (1 - s.pres), clamp(inp.audio.mid));
    const tt = Math.max(idle * 0.6 * (1 - s.pres), clamp(inp.audio.treble));
    s.bass += (bt - s.bass) * Math.min(1, dt * (bt > s.bass ? 1.6 : 1.0));
    s.mid += (mt - s.mid) * Math.min(1, dt * (mt > s.mid ? 1.6 : 1.0));
    s.treble += (tt - s.treble) * Math.min(1, dt * (tt > s.treble ? 1.6 : 1.0));
    s.energy += (((s.bass + s.mid + s.treble) / 3) - s.energy) * Math.min(1, dt * 2);
    const fieldTarget = Math.pow(clamp(0.45 * s.bass + 0.35 * s.mid + 0.28 * s.treble), 1.4);
    s.field += (fieldTarget - s.field) * Math.min(1, dt * 1.8);

    // THE KICK (Cell Front V11's law, verbatim): the engine's time-domain
    // LP150 scanner, a new hit is `n` CHANGING, back-dated by its true age
    // plus a display lead, applied UNSMOOTHED on top of a smoothed base.
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
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    if (edge && s._kGap > 0.09) {
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      s.kick = Math.max(s.kick, hit * Math.exp(-3.4 * (age + s.LEAD)));
    }
    s.kick -= s.kick * Math.min(1, dt * 3.4);

    // THE HEART. Two clocks on loudness alone: a ~0.2s reading against a ~3s
    // running level. A big positive swing is the drop landing, a big negative
    // one is it falling away — both are "the music just moved", both condense
    // the bank. One every 14s at most.
    const eNow = clamp(inp.audio.level);
    s.eFast += (eNow - s.eFast) * Math.min(1, dt * 5);
    s.eSlow += (eNow - s.eSlow) * Math.min(1, dt * 0.30);
    s.swing = s.eFast - s.eSlow;
    s.heartGap += dt;
    let fire = 0;
    if (s.heartGap > 14 && s.pres > 0.25) {
      if (s.swing > 0.18 && s.eFast > 0.14) fire = clamp(0.55 + s.swing * 2.2);
      else if (s.swing < -0.18 && s.eSlow > 0.22) fire = clamp(0.55 - s.swing * 2.2);
    }
    // the house summons (park L at the source, wiggle R) — the player's own
    // way in. The event keeps arriving uninvited regardless.
    const sum = inp.summon > 0.5;
    if (sum && !s._sumWas) fire = Math.max(fire, 1);
    s._sumWas = sum;
    if (fire > 0) { s.heartGap = 0; s.heartN++; s.heartStr = fire; s.heartHold = 2.4 + 3.0 * fire; }
    s.heartHold = Math.max(0, s.heartHold - dt);
    const ht = s.heartHold > 0 ? 1 : 0;
    s.heart += (ht - s.heart) * Math.min(1, dt * (ht > s.heart ? 1.7 : 0.85));

    // GEOMETRY. Capped on purpose (Cell Front V10's lesson): a loud track is
    // a big bank sitting in black, and only a kick on a peak brushes the edge.
    const axc = clamp(s.ax / 0.8, 0.8, 1.6);
    const Rt = 0.150 + 0.105 * s.field;
    s.Rbase += (Rt - s.Rbase) * Math.min(1, dt * (Rt > s.Rbase ? 6 : 3.5));
    s.R = s.Rbase * (1 + 0.28 * s.kick);
    s.spanX = (0.245 + 0.095 * s.field) * (1 + 0.36 * s.wind) * axc;
    s.spanY = (0.085 + 0.055 * s.field) * (1 + 1.30 * s.heat);
    s.heartR = Math.min(0.36, 0.29 + 0.10 * s.field);
    for (let i = 0; i < CS_UNIT.length; i++) {
      s.bob[i][0] = 0.014 * Math.sin(s.life * (0.17 + i * 0.031) + i * 1.7);
      s.bob[i][1] = 0.011 * Math.cos(s.life * (0.13 + i * 0.027) + i * 2.3);
    }

    // WIND streams the steam sideways; HEAT boils it. Both integrated, so
    // changing the rate never jumps the texture.
    s.drift = (s.drift + (0.08 + 0.62 * s.wind + 0.20 * s.energy) * dt) % 4096;
    s.boil = (s.boil + (0.16 + 1.05 * s.heat + 0.55 * s.energy + 1.60 * s.kick) * dt) % 4096;
    s.ldA = 0.26 * Math.sin(s.life * 0.043);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const LB = CS_LOBES(s);
    const glow = clamp(0.20 + 0.75 * s.bass);

    if (s.noGL || !P._three) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      const core = `rgba(255,${Math.round(215 - 60 * (1 - glow))},225,0.92)`;
      LB.forEach(l => {
        const x = w / 2 + l[0] * mn, y = h / 2 - l[1] * mn, r = l[2] * mn * (1 + 0.4 * s.heart);
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, core);
        gr.addColorStop(0.55, 'rgba(240,140,175,0.45)');
        gr.addColorStop(1, 'rgba(120,25,60,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      });
      g.fillStyle = 'rgba(255,200,215,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('CLOUD STEAM · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }

    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres; u.uHeart.value = s.heart;
    u.uKick.value = s.kick; u.uGlow.value = glow;
    u.uWind.value = s.wind; u.uHeat.value = s.heat;
    // the fluff dials: treble carves the fine octaves, mid curdles the warp
    u.uFine.value = 0.34 + 0.66 * clamp(s.treble * 1.25);
    u.uWarp.value = 0.34 + 0.42 * s.mid + 0.24 * s.kick;
    u.uFreq.value = 7.2;
    u.uDrift.value = s.drift; u.uBoil.value = s.boil;
    // erosion proportional to the mass, so the bank never shreds when small
    const amp = s.R * (0.70 + 0.42 * s.energy) * (1 + 0.30 * s.kick);
    u.uAmp.value = amp;
    u.uOccN.value = s.R * 0.80;
    u.uHaze.value = s.R * 0.22;
    u.uHazeAmt.value = 0.13 + 0.20 * glow;
    // one billow toward the light, then one lobe — the two shading scales
    u.uS1.value = amp * 0.42; u.uSN1.value = amp * 0.52;
    u.uS2.value = s.R * 0.50; u.uSN2.value = amp * 1.10;
    u.uHeartR.value = s.heartR; u.uHeartY.value = -0.02;
    u.uBail.value = amp * 0.85 + s.R * 0.95;
    u.uSpan.value.set(LB[0][0] - s.R * 0.6, LB[4][0] + s.R * 0.6);
    const la = -0.48 + s.ldA * 0.5, lb = 0.88;
    const ln = Math.hypot(la, lb) || 1;
    u.uLdir.value.set(la / ln, lb / ln);
    const ll = u.uLobe.value;
    for (let i = 0; i < 5; i++) { ll[i * 3] = LB[i][0]; ll[i * 3 + 1] = LB[i][1]; ll[i * 3 + 2] = LB[i][2]; }

    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);

    g.fillStyle = 'rgba(255,190,210,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '   MID ' + Math.round(s.mid * 100) +
      '   TREBLE ' + Math.round(s.treble * 100) + '   FIELD ' + Math.round(s.field * 100) +
      '   KICK ' + Math.round(s.kick * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' age ' + Math.round(s._kAge * 1000) + 'ms)' +
      '   WIND ' + Math.round(s.wind * 100) + '   HEAT ' + Math.round(s.heat * 100) +
      '   CARVE ' + Math.round((0.34 + 0.66 * clamp(s.treble * 1.25)) * 100) +
      '   SWING ' + (s.swing >= 0 ? '+' : '') + Math.round(s.swing * 100) +
      '   HEART ' + Math.round(s.heart * 100) + ' (#' + s.heartN + (s.heartHold > 0 ? ' ' + s.heartHold.toFixed(1) + 's' : ' armed in ' + Math.max(0, 14 - s.heartGap).toFixed(0) + 's') + ')' +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
