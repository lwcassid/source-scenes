/* ---------- SRC-47.5 · CLOUD STEAM V5 (both hands steer) ----------
   Nima on V4: "Make CC2 pan up and down in the same way CC1 is panning left
   and right."

   So the two hands become one instrument instead of two unrelated ones. V4
   had CC1 yawing the flight (a real rotation of the ray, so the sky sweeps
   with parallax) while CC2 was a throttle — a different KIND of control, on a
   different axis of the experience. V5 makes CC2 the matching half: it
   PITCHES the flight, rotating the ray around X exactly as CC1 rotates it
   around Y. Bring the left hand in and you bank left; bring the right hand in
   and you climb; bring both and you turn and climb together. Reach both away
   and you are level. Near = more on both, which is also where the engine
   settles an empty sensor, so losing either hand is a glide back to level.

   THE THROTTLE IS GONE, deliberately. V4 gave the beat the job of pacing, and
   a hand multiplying the flight speed was quietly competing with it for the
   same axis. Now the music owns how fast you travel and the hands own where
   you are pointed — one job each, no overlap.

   THE TINT FOLLOWS THE STEERING. The side law wants warm left and cool right,
   and the scene's own rule is that hue comes from the axis the hand itself
   moves. With CC2 now moving the VERTICAL axis, its lilac follows: warm
   apricot spreads across the horizontal axis CC1 steers, cool lilac across
   the vertical axis CC2 steers. Reach both away and both drain off.

   Everything else — the raymarch, the lighting, the beat as pacing, the bands
   as shape and growth, the heart — is V4 unchanged.
   ------ */
const CS5_FS = [
  'precision highp float;',
  'uniform vec2 uRes;',
  'uniform float uPres, uGlow, uWind, uTilt, uHeart;',
  'uniform float uCover, uGain, uScale, uFly, uChurn, uFine, uFocal, uYaw, uPitch;',
  'uniform float uStepK, uAbs, uHeartZ, uHeartR, uHeartD;',
  'uniform vec3 uSun;',
  // the plates' palette — dense core is deep rose, lit top is cream
  'const vec3 CS_DEEP  = vec3(0.34, 0.27, 0.33);',
  'const vec3 CS_ROSE  = vec3(0.95, 0.42, 0.58);',
  'const vec3 CS_BLUSH = vec3(1.00, 0.80, 0.85);',
  'const vec3 CS_CREAM = vec3(1.00, 0.94, 0.88);',
  'const vec3 CS_WARM  = vec3(1.16, 0.85, 0.64);',
  'const vec3 CS_COOL  = vec3(0.85, 0.83, 1.19);',
  'const vec3 CS_FAR   = vec3(0.15, 0.09, 0.21);',
  'float h31(vec3 p){',
  '  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));',
  '  p *= 17.0;',
  '  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));',
  '}',
  'float vn3(vec3 x){',
  '  vec3 i = floor(x), f = fract(x);',
  '  f = f * f * (3.0 - 2.0 * f);',
  '  return mix(mix(mix(h31(i + vec3(0.0, 0.0, 0.0)), h31(i + vec3(1.0, 0.0, 0.0)), f.x),',
  '                 mix(h31(i + vec3(0.0, 1.0, 0.0)), h31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
  '             mix(mix(h31(i + vec3(0.0, 0.0, 1.0)), h31(i + vec3(1.0, 0.0, 1.0)), f.x),',
  '                 mix(h31(i + vec3(0.0, 1.0, 1.0)), h31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);',
  '}',
  // IQ's shear between octaves — without it fbm lines up on the axes and reads
  // as a grid, which is exactly what V2's noise did
  'const mat3 CSM = mat3( 0.00,  0.80,  0.60,',
  '                      -0.80,  0.36, -0.48,',
  '                      -0.60, -0.48,  0.64);',
  'vec3 warp(vec3 p){',
  '  return p * uScale + vec3(uChurn * 0.11, uChurn * 0.07, uFly);',
  '}',
  // THE HEART AS A SOLID: while it holds, the sky thins to mist and a
  // heart-shaped slab a fixed distance ahead thickens instead — so it is a
  // heart made of cloud with volumetric edges, not a stencil over the picture.
  'float heartMul(vec3 p){',
  '  if (uHeart < 0.002) return 1.0;',
  '  float zc = p.z - uHeartZ;',
  '  float ze = exp(-(zc * zc) / (uHeartD * uHeartD));',
  '  vec2 q = p.xy / max(uHeartR, 1e-4);',
  '  q.y -= 0.06;',
  '  float a = dot(q, q) - 1.0;',
  '  float f = a * a * a - q.x * q.x * q.y * q.y * q.y;',
  '  float sd = (f < 0.0 ? 1.0 : -1.0) * pow(min(abs(f), 400.0), 0.3333);',
  '  float ins = smoothstep(-0.55, 0.30, sd);',
  '  return (1.0 - uHeart * 0.88) + uHeart * 1.95 * ze * ins;',
  '}',
  // ONE density function with a SHARED PREFIX. The first two octaves are
  // computed once; if even the maximum the remaining octaves could add still
  // leaves us under coverage, this sample is provably empty air and we stop
  // there. A separate coarse probe would have cost those two octaves twice —
  // in a dense sky that is a net loss, which is exactly what happened.
  'float denAt(vec3 p){',
  '  vec3 q = warp(p);',
  '  float nrm = 0.75 + 0.1875 * uFine;',
  '  float f  = 0.5000 * vn3(q); q = CSM * q * 2.02;',
  '  f += 0.2500 * vn3(q);       q = CSM * q * 2.03;',
  '  if ((f + 0.1875 * uFine) < uCover * nrm) return 0.0;',
  '  if (uFine > 0.04){',
  '    f += 0.1250 * uFine * vn3(q); q = CSM * q * 2.01;',
  '    f += 0.0625 * uFine * vn3(q);',
  '  }',
  '  return clamp(uGain * (f / nrm - uCover), 0.0, 1.0) * heartMul(p);',
  '}',
  // the sunward sample only needs the big shapes
  'float denSun(vec3 p){',
  '  vec3 q = warp(p);',
  '  float f  = 0.5000 * vn3(q); q = CSM * q * 2.02;',
  '  f += 0.2500 * vn3(q);',
  '  return clamp(uGain * (f / 0.75 - uCover), 0.0, 1.0) * heartMul(p);',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);',
  // BANK is a real yaw on the ray, so the sky sweeps with parallax instead of
  // sliding like a texture
  '  vec3 rd = normalize(vec3(p.x, p.y, uFocal));',
  '  float cy = cos(uYaw), sy = sin(uYaw);',
  '  rd = vec3(rd.x * cy + rd.z * sy, rd.y, -rd.x * sy + rd.z * cy);',
  // CC2 is the matching half: the same rotation, around X instead of Y
  '  float cp = cos(uPitch), sp = sin(uPitch);',
  '  rd = vec3(rd.x, rd.y * cp - rd.z * sp, rd.y * sp + rd.z * cp);',
  '  vec4 sum = vec4(0.0);',
  '  float t = 0.25;',
  // FRONT TO BACK. There is no silhouette anywhere in this loop — a ray that
  // clips a fringe gathers a little density and comes out translucent, which
  // is the whole difference between this and V1/V2.
  '  for (int i = 0; i < 28; i++){',
  '    if (sum.a > 0.985) break;',
  '    vec3 pos = rd * t;',
  '    float den = denAt(pos);',
  '    if (den > 0.008){',
  // one cheap sample sunward: density falling toward the light = a lit top,
  // density rising = a crevice
  '      float dif = clamp((den - denSun(pos + uSun * 0.30)) / 0.30, 0.0, 1.0);',
  '      vec3 alb = mix(vec3(1.00, 0.965, 0.955), CS_DEEP, clamp(den * 1.05, 0.0, 1.0));',
  '      vec3 lin = CS_ROSE * (0.40 + 0.32 * uGlow)',
  '               + vec3(1.20, 0.94, 0.86) * dif * 2.0;',
  '      vec4 col = vec4(alb * lin, den * uAbs);',
  // aerial perspective lives in every SAMPLE, so depth is in the colour
  '      col.rgb = mix(col.rgb, CS_FAR, 1.0 - exp(-0.075 * t * t));',
  '      col.rgb *= col.a;',
  '      sum += col * (1.0 - sum.a);',
  '    }',
  '    t += max(0.070, uStepK * t);',
  '  }',
  '  vec3 outc = sum.rgb;',
  // EACH HAND TINTS THE AXIS IT STEERS: CC1 moves the horizontal, so its warm
  // apricot spreads across x; CC2 now moves the vertical, so its cool lilac
  // follows onto y. Neither is a fixed screen gradient — both are the axis the
  // hand is actually flying.
  '  float wl = 1.0 - smoothstep(-0.30, 0.30, p.x);',
  '  float wd = smoothstep(-0.24, 0.24, p.y);',
  '  outc *= mix(vec3(1.0), CS_WARM, clamp(wl * uWind, 0.0, 1.0));',
  '  outc *= mix(vec3(1.0), CS_COOL, clamp(wd * uTilt, 0.0, 1.0));',
  '  outc *= 1.0 + 0.24 * uHeart;',
  '  outc *= 0.55 + 0.45 * uPres;',
  '  outc = max(outc, vec3(0.0)) / (1.0 + max(outc, vec3(0.0)) * 0.38);',
  '  gl_FragColor = vec4(outc, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-47.5', family: 'SRC-47', ver: 5,
  title: 'Cloud Steam V5', tech: 'VOLUMETRIC RAYMARCH / BOTH HANDS STEER',
  audioIn: true,
  fx: { bloom: 0.28 },
  tags: ['AUDIO IN', 'VOLUMETRIC RAYMARCH', 'CC1 YAW / CC2 PITCH', 'THE BEAT IS THE PACING', 'NO SILHOUETTE', 'HEART ON THE DROP'],
  desc: 'V4’s volumetric raymarch with both hands made into one instrument. A ray per pixel is stepped through a 3D noise field, gathering colour and opacity as it goes, lit by sampling the density a short step toward the sun — so there is no outline anywhere in it, only soft mass. BOTH HANDS STEER: CC1 yaws the flight left and right and CC2 pitches it up and down, the same rotation on the matching axis, so you point yourself through the sky with two hands rather than steering with one and throttling with the other. THE BEAT IS THE PACING, as V4 — every kick is a forward impulse and the detected tempo sets the cruising speed, and nothing about the sky’s brightness or density is allowed to move on a beat. The bands do the rest, all on slow envelopes: loudness is GROWTH, opening and filling the sky over bars; bass is BODY, making the masses solid or vaporous; the mids are CHANGE, setting how hard the field boils and reforms; treble is CARVE, weighting the fine octaves into filigree. On a big rise or fall the sky thins to mist and a heart-shaped mass of cloud hangs in it, a fixed distance ahead, until it lets go.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in) — bring it music and it flies itself, one surge forward per beat. THE HANDS POINT IT, and answer instantly. LEFT HAND (CC1) YAWS: bring it in toward the source and the flight banks left, the whole sky sweeping past with real parallax, and the left of the frame warms to apricot. RIGHT HAND (CC2) PITCHES: bring it in and the flight climbs, the sky sweeping down past you, and the top of the frame cools to lilac. Bring both in and you turn and climb at once. Reach both away and you are level and the colour drains back — which is also where a hand the sensor loses settles, so nothing ever slams. How FAST you travel is the music’s, not yours. THE HEART arrives on its own when the music makes a big move; the house code summons one — park the left hand at the source and wiggle the right until the charge fills.',
  sound: 'Makes no sound of its own — an audio-in scene, like Cell Front and Penrose Bloom. Connect a source (mic, line-in, or CAPTURE APP AUDIO for a running app’s own output) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It is built around a kick: the whole sky condensing on the beat is the mechanic, and a track with real section changes is what fills the sky ahead.',

  init(P) {
    const s = {
      pres: 0, life: 0,
      bass: 0, mid: 0, treble: 0, energy: 0, field: 0,
      kick: 0, _kGap: 1, _kN: -1, _kAge: 0, _kStr: 0, _prevOnset: 0, LEAD: 0.030,
      wind: 0, tilt: 0, yaw: 0, pitch: 0,
      fly: 0, churn: 0, speed: 0, tempo: 1,
      eFast: 0, eSlow: 0, swing: 0,
      heart: 0, heartHold: 0, heartGap: 9, heartN: 0, _sumWas: false,
      noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    // a raymarch is far heavier per pixel than a 2D field — the softness comes
    // from the marching, not the resolution, so this can afford to be small
    const sc = Math.min(1, 620 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc)); T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const sun = new THREE.Vector3(-0.60, 0.70, -0.38).normalize();
    const uni = {
      uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uPres: { value: 0 }, uGlow: { value: 0 },
      uWind: { value: 0 }, uTilt: { value: 0 }, uHeart: { value: 0 },
      uCover: { value: 0.715 }, uGain: { value: 7.5 }, uScale: { value: 3.6 },
      uFly: { value: 0 }, uChurn: { value: 0 }, uFine: { value: 0.6 },
      uFocal: { value: 1.15 }, uYaw: { value: 0 }, uPitch: { value: 0 },
      uStepK: { value: 0.062 }, uAbs: { value: 0.42 },
      uHeartZ: { value: 1.5 }, uHeartR: { value: 1.05 }, uHeartD: { value: 0.75 },
      uSun: { value: sun }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: CS5_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn; T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;

    const liveL = chan.L.mode === 'live', liveR = chan.R.mode === 'live';
    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((liveL || liveR || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    // HANDS FLY IT. Near = more — where the engine settles an empty sensor.
    s.wind += (clamp(inp.L) - s.wind) * Math.min(1, dt * 6);
    s.tilt += (clamp(inp.R) - s.tilt) * Math.min(1, dt * 6);

    // SLOW BANDS — V1's easing, unchanged. Bands are the weather.
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

    // THE KICK (Cell Front V11's law, verbatim). Here it drops the coverage
    // threshold, so the whole sky thickens at once at every depth.
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

    // THE HEART, V1's detector unchanged.
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

    // THE FLIGHT. Capped — scrim punishes velocity, and this is the one scene
    // that moves. Wrapped so a long set never walks into float mush.
    // TEMPO sets the cruise: a faster track is a faster flight, a half-time
    // section is a drift. The engine already detects it off the same kick.
    const bpm = (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm) ? AUDIOIN.kickBpm : 0;
    const tempoT = bpm > 0 ? clamp(bpm / 124, 0.55, 1.75) : 1;
    s.tempo += (tempoT - s.tempo) * Math.min(1, dt * 0.5);
    // and every HIT is a forward impulse — the pulse arrives as travel, which
    // is the only thing the beat is allowed to move now
    // no hand multiplies this any more: V4 gave the beat the job of pacing,
    // and a throttle was quietly competing with it for the same axis
    s.speed = Math.min(0.95, (0.092 + 0.130 * s.energy) * s.tempo * (1 + 1.85 * s.kick))
      * (1 - 0.72 * s.heart);
    s.fly = (s.fly + s.speed * dt) % 4096;
    s.churn = (s.churn + (0.06 + 1.55 * s.mid + 0.75 * s.energy) * dt) % 4096;

    // BANK: a real yaw, plus a slow idle wander so an unattended sky moves.
    // CC1 yaws, CC2 pitches — same shape, same gain, same easing, one per
    // axis. Each keeps a slow idle wander so an unattended sky still drifts.
    const yawT = -s.wind * 0.30 + 0.045 * Math.sin(s.life * 0.061);
    const pitchT = -s.tilt * 0.26 + 0.035 * Math.cos(s.life * 0.053);
    s.yaw += (yawT - s.yaw) * Math.min(1, dt * 3.2);
    s.pitch += (pitchT - s.pitch) * Math.min(1, dt * 3.2);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    const glow = clamp(0.20 + 0.75 * s.bass);
    // THE UNISON: one global number, so the kick thickens every depth at once
    const cover = clamp(0.680 - 0.125 * s.field, 0.50, 0.82);
    const bpmHud = (typeof AUDIOIN !== 'undefined' && AUDIOIN.kickBpm) ? AUDIOIN.kickBpm : 0;

    if (s.noGL || !P._three) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      for (let i = 0; i < 5; i++) {
        const ph = (s.fly * 0.5 + i * 0.2) % 1;
        const r = mn * (0.06 + 0.9 * ph), a = Math.min(1, ph / 0.1) * (1 - Math.max(0, (ph - 0.7) / 0.3));
        const x = w / 2 + Math.cos(i * 2.4) * r * 0.5, y = h / 2 + Math.sin(i * 1.9) * r * 0.35;
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r);
        gr.addColorStop(0, `rgba(255,${Math.round(210 - 40 * (1 - glow))},228,${(0.5 * a).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(120,25,60,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
      g.fillStyle = 'rgba(255,200,215,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('CLOUD STEAM V5 · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }

    const T3 = P._three, u = T3.uni;
    u.uPres.value = s.pres; u.uGlow.value = glow;
    u.uWind.value = s.wind; u.uTilt.value = s.tilt; u.uHeart.value = s.heart;
    u.uCover.value = cover;
    u.uGain.value = 5.6 + 3.6 * s.bass;
    u.uScale.value = 3.6;
    u.uFly.value = s.fly;
    u.uChurn.value = s.churn;
    u.uFine.value = 0.45 + 0.55 * clamp(s.treble * 1.25);   // treble carves
    u.uYaw.value = s.yaw; u.uPitch.value = s.pitch;
    u.uAbs.value = 0.40 + 0.10 * s.field;
    u.uHeartZ.value = 1.5; u.uHeartR.value = 1.05; u.uHeartD.value = 0.75;

    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);

    g.fillStyle = 'rgba(255,190,210,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.bass * 100) + '   MID ' + Math.round(s.mid * 100) +
      '   TREBLE ' + Math.round(s.treble * 100) + '   FIELD ' + Math.round(s.field * 100) +
      '   KICK ' + Math.round(s.kick * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') + ' age ' + Math.round(s._kAge * 1000) + 'ms)' +
      '   GROWTH ' + cover.toFixed(3) + '   BODY ' + (5.6 + 3.6 * s.bass).toFixed(1) +
      '   PACE ' + s.speed.toFixed(2) + ' (tempo x' + s.tempo.toFixed(2) + (bpmHud ? ' ' + bpmHud + 'bpm' : '') + ')' +
      '   CC1 YAW ' + Math.round(s.wind * 100) + ' (' + s.yaw.toFixed(2) + ')   CC2 PITCH ' + Math.round(s.tilt * 100) + ' (' + s.pitch.toFixed(2) + ')' +
      '   CARVE ' + Math.round((0.30 + 0.70 * clamp(s.treble * 1.25)) * 100) +
      '   SWING ' + (s.swing >= 0 ? '+' : '') + Math.round(s.swing * 100) +
      '   HEART ' + Math.round(s.heart * 100) + ' (#' + s.heartN + (s.heartHold > 0 ? ' ' + s.heartHold.toFixed(1) + 's' : ' armed in ' + Math.max(0, 14 - s.heartGap).toFixed(0) + 's') + ')' +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
