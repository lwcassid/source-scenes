/* ---------- SRC-47.2 · CLOUD STEAM V2 (flying through it) ----------
   Nima on V1: "I like the aesthetic of the cloud. Now let's change it as if
   we're flying through the air through clouds — there should be cloud coming
   through the scene and forming in unison to the sound."

   So V1's one static bank becomes a SKY YOU ARE MOVING THROUGH. Sixteen cloud
   masses hold real positions in front of the camera; the camera flies forward,
   so each one drifts outward from the point you are aimed at, swells, sweeps
   past the frame and is reborn far ahead. They are depth-sorted and
   composited FRONT TO BACK, so a near cloud genuinely passes in front of the
   ones behind it — that occlusion is the whole reason it reads as flight and
   not as a zoom. Distance cools and dims (aerial perspective); nearness warms
   and lifts.

   Two failed shapes are worth recording, because the next flythrough will
   want them. A stack of full-screen noise SHEETS at different scales cannot
   do this: sparse enough to leave sky, five of them still tile the frame into
   lace; dense enough to read as cloud, they composite into a flat whiteout.
   DISCRETE MASSES are what make countable clouds, and eroding each one in its
   OWN normalised space is what makes perspective honest — a near cloud shows
   the same cauliflower as a far one, only bigger, because the noise travels
   with the object instead of with the screen.

   FORMING IN UNISON is two clocks, the split Cell Front V9 landed on:
   · EVERY KICK CONDENSES THE WHOLE SKY. The hit fattens every mass at once —
     wisps thicken into cloud across all depths together — and surges the
     flight forward. Unsmoothed, back-dated, off the engine's time-domain kick
     (Cell Front V11's law), so it lands on the frame the hit is known,
     everywhere, at once.
   · EVERY NEW MASS REMEMBERS THE MUSIC IT WAS BORN IN. A cloud reborn at the
     far plane keeps the loudness of that moment for its whole approach, so a
     loud bar builds cloud you fly into fifteen seconds later and a breakdown
     opens clear sky ahead. The beat is the pulse; the arrangement is the
     weather. HOW MANY clouds there are follows the arrangement too — quiet is
     four masses in a dark sky, loud is sixteen.
   Bands keep their V1 jobs: treble weights the fine octaves (the carve), mid
   drives the churn, bass is the light burning inside the mass.

   HANDS FLY IT. Near = more, which is also what the engine now settles an
   empty sensor to (arm's reach = zero), so losing a hand is a glide, never a
   slam. LEFT BANKS: bring it in and the point you are flying toward swings
   left, the whole sky sweeps across with it, and that side warms to apricot.
   RIGHT IS THROTTLE: bring it in and you fly harder and the steam boils as it
   goes by, and that side cools to lilac. The side axis is the HEADING — an
   axis the left hand itself moves — not a fixed screen gradient.

   THE HEART survives, and it is better here: on a big rise or fall the flight
   slows to a drift and the masses ahead resolve into a heart, its edge eroded
   by each cloud's own noise so it is a heart made of cloud rather than a
   stencil laid over one. Then it lets go and you fly on. Once every 14s at
   most; the house SUMMONS still calls one.
   ------ */
const CS2_MAX = 16;
const CS2_ZNEAR = 0.16, CS2_ZFAR = 3.2;

const CS2_FS = [
  'precision highp float;',
  'uniform float uPres, uHeart, uKick, uGlow, uWind, uHeat;',
  'uniform float uFine, uBoil, uEdge, uAmp, uFreq, uSQ, uSN, uAmb, uHaze, uHazeAmt;',
  'uniform float uHeartR, uHeartY, uHeartW;',
  'uniform int uN;',
  'uniform vec2 uRes, uC, uLdir;',
  'uniform vec4 uPuff[16];',    // screen x · screen y · screen radius · seed
  'uniform vec4 uPuffB[16];',   // nearness 0..1 · density bias · alpha · detail weight
  // V1's palette, unchanged — the plates' own
  'const vec3 CS_SHADOW = vec3(0.19, 0.032, 0.10);',
  'const vec3 CS_ROSE   = vec3(0.90, 0.33, 0.50);',
  'const vec3 CS_PINK   = vec3(0.99, 0.62, 0.72);',
  'const vec3 CS_BLUSH  = vec3(1.00, 0.83, 0.86);',
  'const vec3 CS_CREAM  = vec3(1.00, 0.94, 0.88);',
  'const vec3 CS_WARM = vec3(1.16, 0.85, 0.64);',
  'const vec3 CS_COOL = vec3(0.85, 0.83, 1.19);',
  // aerial perspective: what distance does to a cloud
  'const vec3 CS_FAR  = vec3(0.68, 0.62, 0.88);',
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
  // rounded ridges = cauliflower, not smoke (V1's law). Billow of a SMOOTHED
  // noise sits near 0.73, not 0.5 — remap the useful band onto a full 0..1 or
  // every threshold you write means something other than what you think.
  'float billow(vec2 p){ return 1.0 - abs(2.0 * vnoise(p) - 1.0); }',
  'float fbm4(vec2 q, float fw){',
  '  float a = 0.5, s = 0.0, n = 0.0;',
  '  for (int i = 0; i < 4; i++){',
  '    float fi = float(i);',
  '    float wt = fi > 1.5 ? fw : 1.0;',
  '    s += a * wt * billow(q + vec2(0.0, uBoil * (0.05 + 0.06 * fi)));',
  '    n += a * wt;',
  '    a *= 0.52; q *= 2.11;',
  '  }',
  '  return clamp((s / max(n, 1e-4) - 0.73) * 3.0 + 0.5, 0.0, 1.0);',
  '}',
  'float sm3(vec2 q){',
  '  float a = 0.5, s = 0.0, n = 0.0;',
  '  for (int i = 0; i < 3; i++){',
  '    s += a * vnoise(q + vec2(0.0, uBoil * (0.05 + 0.06 * float(i))));',
  '    n += a; a *= 0.52; q *= 2.11;',
  '  }',
  '  return clamp((s / max(n, 1e-4) - 0.5) * 2.2 + 0.5, 0.0, 1.0);',
  '}',
  'float heartSD(vec2 p){',
  '  vec2 q = (p - vec2(0.0, uHeartY)) / max(uHeartR, 1e-4);',
  '  float a = dot(q, q) - 1.0;',
  '  float f = a * a * a - q.x * q.x * q.y * q.y * q.y;',
  '  float m = min(abs(f), 400.0);',
  '  return uHeartR * 0.55 * (f < 0.0 ? 1.0 : -1.0) * pow(m, 0.3333);',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  '  float hd = uHeart > 0.002 ? heartSD(p) : 0.0;',
  '  vec3 col = vec3(0.0);',
  '  float acc = 0.0;',
  // FRONT TO BACK: uPuff is sorted nearest-first, so a mass sweeping past
  // occludes what is behind it instead of blending into it. That occlusion is
  // what makes this flight rather than a zoom.
  '  for (int i = 0; i < 16; i++){',
  '    if (i >= uN) break;',
  '    if (acc > 0.988) break;',
  '    vec4 Q = uPuff[i]; vec4 B = uPuffB[i];',
  '    if (B.z < 0.004) continue;',
  '    vec2 d = p - Q.xy;',
  '    float rr = max(Q.z, 1e-4);',
  '    if (dot(d, d) > rr * rr * 2.6) continue;',
  // the mass is eroded in ITS OWN normalised space, so perspective is honest:
  // a near cloud shows the same cauliflower as a far one, only bigger
  '    vec2 uq = d / rr;',
  '    float sd = 1.0 - length(uq);',
  '    vec2 nq = uq * uFreq + vec2(Q.w, Q.w * 1.73);',
  '    float n0 = fbm4(nq, B.w);',
  // erosion tapers with depth into the mass (V1's law) — the boundary carves,
  // the core never holes
  '    float ero = uAmp * (0.40 + 0.60 * (1.0 - smoothstep(0.0, 0.75, sd)))',
  '              * smoothstep(-0.45, 0.05, sd);',
  '    float f0 = sd + B.y + (n0 - 0.5) * ero;',
  '    float cov = smoothstep(-uEdge, uEdge, f0) * B.z;',
  // V1's steam fringe: ONE continuous falloff off the mass, never strokes
  '    float halo = exp(-max(-f0, 0.0) / uHaze) * (1.0 - cov) * uHazeAmt * B.z;',
  // the heart is eroded by THIS mass's own noise, so its edge is cloud at
  // every depth rather than one stencil laid over the whole sky
  '    if (uHeart > 0.002){',
  '      float he = hd + (n0 - 0.5) * uHeartR * 0.40;',
  '      cov *= mix(1.0, smoothstep(-uHeartW, uHeartW, he), uHeart);',
  '    }',
  '    if (cov < 0.004) continue;',
  // volumetric light, V1's law: a directional derivative of the field, one
  // step in NOISE space, so every depth is shaded at its own feature size
  '    vec2 uq1 = uq + uLdir * uSQ;',
  '    float sd1 = 1.0 - length(uq1);',
  '    vec2 nq1 = nq + uLdir * uSQ * uFreq;',
  '    float ero1 = uAmp * (0.40 + 0.60 * (1.0 - smoothstep(0.0, 0.75, sd1)))',
  '               * smoothstep(-0.45, 0.05, sd1);',
  '    float g0 = sd  + B.y + (sm3(nq)  - 0.5) * ero;',
  '    float g1 = sd1 + B.y + (sm3(nq1) - 0.5) * ero1;',
  '    float lit = smoothstep(-uSN, uSN, g0 - g1);',
  '    lit *= 0.84 + 0.20 * n0;',
  '    lit = uAmb + (1.0 - uAmb) * clamp(lit, 0.0, 1.0);',
  '    float x = clamp(lit + uGlow * 0.30 * (1.0 - lit), 0.0, 1.0);',
  '    vec3 c = mix(CS_SHADOW, CS_ROSE, smoothstep(0.00, 0.34, x));',
  '    c = mix(c, CS_PINK,  smoothstep(0.26, 0.58, x));',
  '    c = mix(c, CS_BLUSH, smoothstep(0.54, 0.82, x));',
  '    c = mix(c, CS_CREAM, smoothstep(0.80, 1.00, x));',
  '    c *= mix(CS_FAR, vec3(1.0), B.x);',
  '    c *= 0.54 + 0.58 * B.x + 0.26 * uKick;',
  '    float aa = cov + halo;',
  '    col += c * aa * (1.0 - acc);',
  '    acc += aa * (1.0 - acc);',
  '  }',
  '  if (acc < 0.002){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }',
  // hands warm/cool the two sides of the HEADING — the axis the left hand
  // itself steers, so the tint is anchored to the flight, not to the screen
  '  float wl = 1.0 - smoothstep(-0.30, 0.30, p.x - uC.x);',
  '  col *= mix(vec3(1.0), CS_WARM, clamp(wl * uWind, 0.0, 1.0));',
  '  col *= mix(vec3(1.0), CS_COOL, clamp((1.0 - wl) * uHeat, 0.0, 1.0));',
  '  col *= 1.0 + 0.26 * uHeart;',
  '  col *= 0.55 + 0.45 * uPres;',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.40);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

function CS2_spawn(P, s, c, first) {
  const ang = P.rand() * TAU;
  // biased away from dead centre so most masses sweep PAST you; a few still
  // come straight on, which is the money shot
  const rad = 0.18 + 0.95 * Math.sqrt(P.rand());
  c.X = Math.cos(ang) * rad * 1.00 * clamp(s.ax / 0.8, 0.7, 1.5);
  c.Y = Math.sin(ang) * rad * 0.62;
  c.R = 0.16 + 0.16 * P.rand();
  c.Z = first ? CS2_ZNEAR + P.rand() * (CS2_ZFAR - CS2_ZNEAR) : CS2_ZFAR;
  c.seed = P.rand() * 160;
  // the loudness it was born in, kept for the whole approach
  c.thick = clamp(0.20 + 0.75 * s.field + 0.35 * s.kick);
}

reg({
  id: 'SRC-47.2', family: 'SRC-47', ver: 2,
  title: 'Cloud Steam V2', tech: 'CLOUD FLYTHROUGH / DEPTH-SORTED MASSES, KICK-CONDENSED',
  audioIn: true,
  fx: { bloom: 0.30 },
  tags: ['AUDIO IN', 'FLYING THROUGH IT', 'REAL OCCLUSION', 'THE KICK CONDENSES IT', 'BANK + THROTTLE', 'HEART ON THE DROP'],
  desc: 'V1’s pink steam, except now you are moving through it. Cloud masses hold real positions ahead of you and the camera flies forward: they drift outward from the point you are aimed at, swell, sweep past the frame and are reborn far ahead — depth-sorted, so a near cloud passes in front of the ones behind it. Distance cools and dims them, nearness warms and lifts them. The music makes the weather on two clocks. Every kick condenses the whole sky at once — wisps fatten into mass at every depth together and the flight surges — and every cloud born at the far plane keeps the loudness of that moment for its whole approach, so a loud bar builds cloud you fly into fifteen seconds later and a breakdown opens clear sky ahead. How many clouds there are follows the arrangement too: quiet is four masses in a dark sky, loud is sixteen. Treble carves the fluff, the mids churn it, the bass is a light burning inside it. On a big rise or fall the flight slows to a drift and the masses ahead resolve into a heart, then let go.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in) — bring it music and it flies itself, condensing on every beat. The hands fly it, and answer instantly. LEFT HAND BANKS: bring it in toward the source and the point you are flying toward swings left, the whole sky sweeps across with it, and that side warms to apricot. RIGHT HAND IS THE THROTTLE: bring it in and you fly harder, and the steam boils as it goes past, and that side cools to lilac. Reach both away and you glide, slow and level — which is also where a hand the sensor loses settles, so nothing ever slams. THE HEART arrives on its own when the music makes a big move; the house code summons one — park the left hand at the source and wiggle the right until the charge fills.',
  sound: 'Makes no sound of its own — an audio-in scene, like Cell Front and Penrose Bloom. Connect a source (mic, line-in, or CAPTURE APP AUDIO for a running app’s own output) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It is built around a kick: the condensation on the beat is the whole mechanic, and a track with real section changes is what fills the sky ahead.',

  init(P) {
    const s = {
      pres: 0, life: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0,
      kick: 0, _kGap: 1, _kN: -1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      wind: 0, heat: 0, cx: 0, cy: 0,
      boil: 0, speed: 0, born: 0, nWant: 5,
      eFast: 0, eSlow: 0, swing: 0,
      heart: 0, heartHold: 0, heartGap: 9, heartN: 0, _sumWas: false,
      puffs: [],
      ax: 0.8, ay: 0.5,
      noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    for (let i = 0; i < CS2_MAX; i++) {
      const c = { rank: i, live: i < 5 ? 1 : 0 };
      CS2_spawn(P, s, c, true);
      s.puffs.push(c);
    }
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const sc = Math.min(1, 620 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const uni = {
      uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uPres: { value: 0 }, uHeart: { value: 0 }, uKick: { value: 0 }, uGlow: { value: 0 },
      uWind: { value: 0 }, uHeat: { value: 0 },
      uFine: { value: 0.5 }, uBoil: { value: 0 },
      uEdge: { value: 0.20 }, uAmp: { value: 0.85 }, uFreq: { value: 2.2 },
      uHaze: { value: 0.22 }, uHazeAmt: { value: 0.30 },
      uSQ: { value: 0.34 }, uSN: { value: 0.30 }, uAmb: { value: 0.12 },
      uHeartR: { value: 0.33 }, uHeartY: { value: -0.02 }, uHeartW: { value: 0.05 },
      uN: { value: 5 },
      uC: { value: new THREE.Vector2(0, 0) },
      uLdir: { value: new THREE.Vector2(-0.48, 0.88) },
      uPuff: { value: new Float32Array(CS2_MAX * 4) },
      uPuffB: { value: new Float32Array(CS2_MAX * 4) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: CS2_FS
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

    // HANDS FLY IT. Near = more — which is where the engine now settles an
    // empty sensor too, so a lost hand glides to level instead of slamming.
    s.wind += (clamp(inp.L) - s.wind) * Math.min(1, dt * 6);
    s.heat += (clamp(inp.R) - s.heat) * Math.min(1, dt * 6);

    // SLOW BANDS — V1's easing, unchanged. Bands weather the sky; they never
    // twitch it.
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

    // THE KICK (Cell Front V11's law, verbatim): time-domain scanner, a new
    // hit is `n` CHANGING, back-dated by its true age plus a display lead,
    // applied UNSMOOTHED. Here it is what condenses the sky.
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

    // THE HEART, V1's detector unchanged: a ~0.2s reading against a ~3s
    // running level. A big swing either way is "the music just moved".
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
    const sum = inp.summon > 0.5;
    if (sum && !s._sumWas) fire = Math.max(fire, 1);
    s._sumWas = sum;
    if (fire > 0) { s.heartGap = 0; s.heartN++; s.heartHold = 2.4 + 3.0 * fire; }
    s.heartHold = Math.max(0, s.heartHold - dt);
    const ht = s.heartHold > 0 ? 1 : 0;
    s.heart += (ht - s.heart) * Math.min(1, dt * (ht > s.heart ? 1.7 : 0.85));

    // THE FLIGHT. Base speed from the arrangement, throttle from the right
    // hand, a surge on every kick, a drift while the heart holds. Capped —
    // scrim punishes velocity, and this is the one scene that moves.
    s.speed = Math.min(0.95, (0.20 + 0.30 * s.energy) * (1 + 0.85 * s.heat) * (1 + 0.55 * s.kick))
      * (1 - 0.72 * s.heart);
    // HOW MANY clouds is the arrangement: a quiet sky is nearly empty
    s.nWant = Math.round(7 + 9 * s.field);
    for (const c of s.puffs) {
      c.Z -= s.speed * dt;
      if (c.Z < CS2_ZNEAR) { CS2_spawn(P, s, c, false); s.born++; }
      const want = c.rank < s.nWant ? 1 : 0;
      c.live += (want - c.live) * Math.min(1, dt * 0.7);   // no popping
    }
    // near first — front-to-back compositing needs the order
    s.puffs.sort((a, b) => a.Z - b.Z);

    // BANK: the point you are flying toward swings with the left hand, plus a
    // slow idle wander so an unattended sky still moves.
    const cxT = -s.wind * 0.30 * clamp(s.ax / 0.8, 0.7, 1.5) + 0.030 * Math.sin(s.life * 0.071);
    const cyT = 0.022 * Math.cos(s.life * 0.053);
    s.cx += (cxT - s.cx) * Math.min(1, dt * 3.2);
    s.cy += (cyT - s.cy) * Math.min(1, dt * 3.2);

    s.boil = (s.boil + (0.16 + 1.30 * s.mid + 0.85 * s.heat + 1.60 * s.kick) * dt) % 4096;
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const glow = clamp(0.20 + 0.75 * s.bass);
    const span = CS2_ZFAR - CS2_ZNEAR;

    // one projection, shared by the shader and the no-WebGL fallback
    const proj = c => {
      const tr = (CS2_ZFAR - c.Z) / span;              // 0 just born, 1 on top of you
      return {
        x: s.cx + c.X / c.Z, y: s.cy + c.Y / c.Z, r: c.R / c.Z,
        near: clamp(tr),
        // fades in as it appears, fades out as it engulfs you and passes
        a: clamp(tr / 0.07) * (1 - clamp((tr - 0.88) / 0.12)) * c.live
      };
    };

    if (s.noGL || !P._three) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      for (let i = s.puffs.length - 1; i >= 0; i--) {
        const pr = proj(s.puffs[i]);
        if (pr.a < 0.02) continue;
        const x = w / 2 + pr.x * mn, y = h / 2 - pr.y * mn, r = Math.max(2, pr.r * mn);
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, `rgba(255,${Math.round(210 - 40 * (1 - glow))},228,${(0.85 * pr.a).toFixed(3)})`);
        gr.addColorStop(0.6, `rgba(240,140,175,${(0.42 * pr.a).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(120,25,60,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
      g.fillStyle = 'rgba(255,200,215,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('CLOUD STEAM V2 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }

    const T3 = P._three, u = T3.uni;
    u.uPres.value = s.pres; u.uHeart.value = s.heart; u.uKick.value = s.kick; u.uGlow.value = glow;
    u.uWind.value = s.wind; u.uHeat.value = s.heat;
    u.uFine.value = 0.22 + 0.40 * clamp(s.treble * 1.25);   // treble carves
    u.uBoil.value = s.boil;                                  // mid churns
    u.uEdge.value = 0.14;
    u.uAmp.value = 0.52 + 0.18 * s.energy;
    u.uFreq.value = 1.9;
    u.uHaze.value = 0.42; u.uHazeAmt.value = 0.40 + 0.24 * glow;
    u.uSQ.value = 0.18; u.uSN.value = 0.26; u.uAmb.value = 0.10 + 0.15 * glow;
    u.uHeartR.value = 0.33; u.uHeartW.value = 0.05;
    u.uC.value.set(s.cx, s.cy);
    const la = -0.48, lb = 0.88, ln = Math.hypot(la, lb);
    u.uLdir.value.set(la / ln, lb / ln);

    const A = u.uPuff.value, B = u.uPuffB.value;
    let n = 0;
    for (let i = 0; i < CS2_MAX; i++) {
      const c = s.puffs[i], pr = proj(c);
      if (pr.a < 0.004 || pr.r < 0.002) continue;
      A[n * 4] = pr.x; A[n * 4 + 1] = pr.y; A[n * 4 + 2] = pr.r; A[n * 4 + 3] = c.seed;
      // THE UNISON: the kick fattens every mass at once, on top of whatever
      // loudness this one was born in.
      B[n * 4] = pr.near;
      B[n * 4 + 1] = -0.10 + 0.20 * c.thick + 0.18 * s.kick;
      B[n * 4 + 2] = pr.a;
      // a far cloud is smooth; the cauliflower resolves as it gets close
      B[n * 4 + 3] = u.uFine.value * clamp((pr.r - 0.05) / 0.45);
      n++;
    }
    u.uN.value = n;

    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);

    g.fillStyle = 'rgba(255,190,210,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '   MID ' + Math.round(s.mid * 100) +
      '   TREBLE ' + Math.round(s.treble * 100) + '   FIELD ' + Math.round(s.field * 100) +
      '   KICK ' + Math.round(s.kick * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' age ' + Math.round(s._kAge * 1000) + 'ms)' +
      '   SPEED ' + s.speed.toFixed(2) + '   CLOUDS ' + n + '/' + s.nWant + '   PASSED ' + s.born +
      '   BANK ' + Math.round(s.wind * 100) + ' (' + s.cx.toFixed(2) + ')   THROTTLE ' + Math.round(s.heat * 100) +
      '   CARVE ' + Math.round((0.34 + 0.66 * clamp(s.treble * 1.25)) * 100) +
      '   SWING ' + (s.swing >= 0 ? '+' : '') + Math.round(s.swing * 100) +
      '   HEART ' + Math.round(s.heart * 100) + ' (#' + s.heartN + (s.heartHold > 0 ? ' ' + s.heartHold.toFixed(1) + 's' : ' armed in ' + Math.max(0, 14 - s.heartGap).toFixed(0) + 's') + ')' +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
