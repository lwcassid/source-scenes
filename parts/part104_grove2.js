/* ---------- SRC-44.2 · GREEN FUSE V2 (the garden answers while you hold) ----
   V1's accumulator was right and its REACTIVITY was broken, two ways, and the
   measurements said so: hands down→up moved the picture by 9.3 mean levels,
   while simply letting go and waiting nine seconds moved it by 20.2. The
   scene drifted on its own harder than it answered the player.
   1. PRESENCE WAS EATING THE HAND. V1 read `LL = hand * pres + idle * (1 -
      pres)`, and `pres` follows `chan.mode`, which falls back to 'drift' six
      seconds after the last message. A player who reaches up and HOLDS still
      sends nothing more, so the scene decided nobody was there and replaced a
      hand that was still in the air with its own idle breath. Here the hand
      is authoritative — idle only ever fills in UNDERNEATH it, never over it —
      and presence counts a raised hand as a person whatever the mode says.
   2. ONLY THE TIPS MOVED. Everything a player had already grown was frozen
      geometry, so by the canopy about a twentieth of the picture could still
      answer a gesture. Now the hands set the whole colony's POSTURE, applied
      at upload as a display transform so the remembered structure is never
      touched: its side's hand stretches the colony's whole height about the
      floor, leans it, fattens it, opens every corona on it, and lights it.
      Reach up and your half of the wall RISES. What you grew is still exactly
      what you grew — the plant is standing up straight instead of slouching.
   The growth law, the eras, the die-back and the sound are V1's. ------ */

const G2_NORG = 72;          // uniform budget = the organ budget
const G2_TOP = 0.82;         // above this a shoot cannot climb — it spreads instead
const G2_ERA = [0, 0.08, 0.24, 0.48, 0.74];
const G2_ERANAME = ['SEED', 'SPROUT', 'BLOOM', 'THICKET', 'CANOPY'];

/* the SIDE LAW is the base hue: L is the ember/marigold country, R the
   indigo/violet one. Age widens the spread but only a little — the spectrum
   in the picture comes from the rings inside each corona and from the slow
   drift at canopy age, NOT from randomising every organ, which just reads as
   confetti. A plant keeps its colour. */
function G2_plantHue(P, s, side) {
  const base = side === 'L' ? 0.025 : 0.600;
  const h = base + (P.rand() - 0.5) * (0.07 + s.age * 0.20);
  return h - Math.floor(h);
}
function G2_hue(P, s, tip) {
  const h = tip.hue0 + (P.rand() - 0.5) * 0.05 + tip.gen * 0.028;
  return h - Math.floor(h);
}

/* keep the array hard-capped: the shader reads exactly G2_NORG slots */
function G2_worst(s, splicing) {
  let worst = -1, ws = 1e9;
  for (let i = 0; i < s.org.length; i++) {
    const q = s.org[i];
    if (q.isShoot || (!splicing && q.dead)) continue;
    const off = (q.by > 1.00 || Math.abs(q.bx) > s.asp * 0.50) ? -1e6 : 0;
    const sc = off + (splicing && q.dead ? -1e5 : 0) + q.n;
    if (sc < ws) { ws = sc; worst = i; }
  }
  return worst;
}

/* the oldest PLANT gives way, whole. Absorbing organ-by-organ took the base
   out from under every plant and left its canopy hanging in the air. */
function G2_absorb(s) {
  let pid = -1;
  for (const q of s.org) if (!q.dead && !q.isShoot && (pid < 0 || q.pid < pid)) pid = q.pid;
  if (pid < 0) return false;
  for (const q of s.org) if (q.pid === pid) q.dead = true;
  for (const t of s.tips) if (t.pid === pid) t.alive = false;
  return true;
}

function G2_add(s, o) {
  o.r0 = o.r; o.ph = o.ph || 0; o.open = o.open || 0; o.openT = o.openT || 0;
  o.n = ++s.born;
  if (s.org.length >= G2_NORG) {
    const worst = G2_worst(s, true);
    if (worst < 0) return null;
    s.org.splice(worst, 1);
  }
  s.org.push(o);
  return o;
}

/* HOW BIG THE GARDEN IS *IS* HOW OLD IT IS. Everything above the age's organ
   budget is marked for absorption and shrinks away rather than popping — so
   when the light fails and age falls, the overgrowth is taken back from the
   least valuable organ inward, and the same rule keeps the frame from silting
   up while a small plant churns. */
function G2_target(s) { return 10 + Math.round(s.age * (G2_NORG - 22)); }
function G2_prune(s) {
  const target = G2_target(s);
  let guard = 0;
  while (s.org.filter(q => !q.dead).length > target && guard++ < 3) {
    if (!G2_absorb(s)) break;
  }
}
function G2_livePlants(s, side) {
  const seen = {};
  for (const q of s.org) if (!q.dead && (!side || q.side === side)) seen[q.pid] = 1;
  return Object.keys(seen).length;
}

/* WHERE the next plant goes: the emptiest of that side's stations. Indexing
   the station by how many plants are already up walked the whole garden off
   to the edges of the wall — the inner plants are the oldest, so they were
   always the ones absorbed, and the next one was always seeded one station
   further out. Filling the widest gap refills the middle instead. */
const G2_STATION = [0.05, 0.225, 0.40, 0.575, 0.75];
function G2_slot(P, s, side) {
  const dir = side === 'L' ? -1 : 1;
  const taken = [];
  for (const q of s.org) if (!q.dead && q.side === side && s.baseOf[q.pid] !== undefined) {
    if (taken.indexOf(s.baseOf[q.pid]) < 0) taken.push(s.baseOf[q.pid]);
  }
  let bx = G2_STATION[0] * dir, bd = -1;
  for (const st of G2_STATION) {
    const x = st * dir;
    let d = 9;
    for (const tx of taken) d = Math.min(d, Math.abs(tx - x));
    if (d > bd) { bd = d; bx = x; }
  }
  return clamp(bx + (P.rand() - 0.5) * 0.07, -s.asp * 0.46, s.asp * 0.46);
}

function G2_seed(P, s, side, x) {
  const hue = G2_plantHue(P, s, side);
  const pid = ++s.pid;
  const vig = 0.68 + P.rand() * 0.78;
  s.capOf[pid] = 3 + s.era + (P.rand() * 3 | 0);
  s.baseOf[pid] = x;
  if (side === 'L') s.plantsL++; else s.plantsR++;
  G2_add(s, {
    ax: x, ay: 0.018, bx: x, by: 0.058, r: 0.060, hue, lobes: 0,
    side, gen: 0, pid, ph: P.rand() * TAU
  });
  const tip = {
    x, y: 0.062, ang: Math.PI / 2 + (P.rand() - 0.5) * 0.30,
    side, gen: 0, segs: 0, alive: true, shoot: null, hue0: hue, pid, vig
  };
  tip.shoot = G2_add(s, {
    ax: x, ay: 0.062, bx: x, by: 0.10, r: 0.030, hue, lobes: 0,
    side, gen: 0, pid, isShoot: true, ph: P.rand() * TAU
  });
  if (tip.shoot) tip.shoot.hue = hue;
  if (!tip.shoot) return;
  s.tips.push(tip);
}

/* ONE growth event for one side. Extend a shoot into a permanent stem, or —
   when a shoot has run its course — open it into a corona and branch. */
function G2_grow(P, s, side, light) {
  const alive = s.tips.filter(t => t.alive && t.side === side);
  const capTips = [2, 3, 4, 5, 6][s.era];
  if (!alive.length) {
    G2_seed(P, s, side, G2_slot(P, s, side));
    return;
  }
  const plantCap = (tid => s.capOf[tid] || 3 + s.era);
  const sizeOf = {};
  for (const q of s.org) if (!q.dead) sizeOf[q.pid] = (sizeOf[q.pid] || 0) + 1;
  const grown = alive.filter(t => (sizeOf[t.pid] || 0) < plantCap(t.pid));
  // a plant that has reached its size FINISHES BY FLOWERING — killing its
  // tips outright left whole bushes standing there with no coronas on them
  const pool = grown.length ? grown : alive;
  const done = !grown.length;
  let tip = pool[0], best = -1;
  for (const t of pool) {
    const sc = (1 / (1 + t.gen)) * (0.5 + P.rand());
    if (sc > best) { best = sc; tip = t; }
  }
  const maxSegs = Math.max(1, 2 - (tip.gen >> 1));
  const sh = tip.shoot;

  if (!done && tip.segs < maxSegs && sh && tip.y < G2_TOP) {
    /* SET the shoot: what your hand was holding becomes structure */
    sh.isShoot = false;
    tip.x = sh.bx; tip.y = sh.by;
    tip.segs++;
    // wander around vertical, leaning a little further off it the higher it
    // gets — but BOUNDED, and pulled back toward the middle whenever the tip
    // strays near the edge of the frame. An unbounded lean walked the whole
    // garden off both sides of the wall.
    const home = Math.sign(tip.x) * clamp((Math.abs(tip.x) - s.asp * 0.16) / (s.asp * 0.20)) * 0.75;
    const spread = (tip.side === 'L' ? 1 : -1) * (tip.y / G2_TOP) * 0.30;
    const want = Math.PI / 2 + spread + home + (P.rand() - 0.5) * 0.55;
    tip.ang += (want - tip.ang) * 0.75;
    tip.ang = clamp(tip.ang, 0.55, Math.PI - 0.55);
    if (P.rand() < 0.22 + s.era * 0.04) {
      G2_add(s, {                                   // a bulb at the node
        ax: tip.x, ay: tip.y, bx: tip.x, by: tip.y,
        r: (0.026 + P.rand() * 0.018) * Math.pow(0.88, tip.gen),
        hue: G2_hue(P, s, tip) + 0.06, lobes: 0,
        side, gen: tip.gen, pid: tip.pid, ph: P.rand() * TAU
      });
    }
    tip.shoot = G2_add(s, {
      ax: tip.x, ay: tip.y, bx: tip.x, by: tip.y + 0.04,
      r: Math.max(0.018, 0.028 - tip.gen * 0.0035),
      hue: G2_hue(P, s, tip), lobes: 0,
      side, gen: tip.gen, pid: tip.pid, isShoot: true, ph: P.rand() * TAU
    });
    if (!tip.shoot) tip.alive = false;
    s.evq.push({ k: 'stem', side, y: tip.y, gen: tip.gen, x: tip.x });
    return;
  }

  /* BLOOM — the shoot opens, the tip is spent, and the plant forks */
  if (sh) { sh.isShoot = false; tip.x = sh.bx; tip.y = sh.by; }
  const lobes = 5 + (P.rand() * 6 | 0) * 2;
  const rad = (0.040 + P.rand() * 0.052) * Math.pow(0.88, tip.gen) * (0.74 + 0.26 * s.age);
  G2_add(s, {
    ax: tip.x, ay: tip.y, bx: tip.x, by: tip.y, r: rad,
    hue: G2_hue(P, s, tip), lobes, open: 0.02, openT: 1,
    side, gen: tip.gen, pid: tip.pid, ph: P.rand() * TAU, bloom: 1
  });
  tip.alive = false;
  s.evq.push({ k: 'bloom', side, y: tip.y, gen: tip.gen, x: tip.x, lobes, r: rad });
  if (s.evq.length > 14) s.evq.shift();

  const forks = s.era >= 2 ? 2 : 1;
  const room = s.tips.filter(t => t.alive && t.side === side).length;
  const maxGen = 1 + s.era;
  for (let i = 0; i < forks && !done && room + i < capTips && tip.gen < maxGen; i++) {
    const ang = tip.ang + (i === 0 ? -1 : 1) * (0.46 + P.rand() * 0.46) * (forks > 1 ? 1 : (P.rand() - 0.5) * 2);
    const nt = {
      x: tip.x, y: tip.y, ang: clamp(ang, 0.50, Math.PI - 0.50),
      side, gen: tip.gen + 1, segs: 0, alive: true, shoot: null, hue0: tip.hue0, pid: tip.pid,
      vig: tip.vig
    };
    nt.shoot = G2_add(s, {
      ax: nt.x, ay: nt.y, bx: nt.x, by: nt.y + 0.03,
      r: Math.max(0.018, 0.028 - nt.gen * 0.0035),
      hue: G2_hue(P, s, nt), lobes: 0,
      side, gen: nt.gen, pid: nt.pid, isShoot: true, ph: P.rand() * TAU
    });
    if (nt.shoot) s.tips.push(nt);
  }
  if (s.tips.length > 24) s.tips = s.tips.filter(t => t.alive).slice(-24);
}

const G2_FS = [
  'precision highp float;',
  'uniform vec2 uRes;',
  'uniform float uT, uPres, uAge, uSky, uDrift, uDusk, uLh, uRh;',
  'uniform vec4 uO0[72];',   // ax ay bx by
  'uniform vec4 uO1[72];',   // radius hue lobes open
  'const float TAU = 6.2831853;',
  'float segD(vec2 p, vec2 a, vec2 b){',
  '  vec2 pa = p - a, ba = b - a;',
  '  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);',
  '  return length(pa - ba * h);',
  '}',
  // the reference ramp, sampled off the source images and wrapped: ember →
  // marigold → cream → sea → teal → indigo → violet → magenta → rose → ember.
  // A cosine palette put GREEN where the violet country has to be.
  'vec3 pal(float h){',
  '  h = fract(h);',
  '  vec3 c = vec3(0.95, 0.22, 0.10);',
  '  c = mix(c, vec3(1.00, 0.62, 0.08), smoothstep(0.00, 0.10, h));',
  '  c = mix(c, vec3(1.00, 0.88, 0.52), smoothstep(0.10, 0.20, h));',
  '  c = mix(c, vec3(0.42, 0.88, 0.52), smoothstep(0.20, 0.32, h));',
  '  c = mix(c, vec3(0.16, 0.72, 0.92), smoothstep(0.32, 0.44, h));',
  '  c = mix(c, vec3(0.26, 0.40, 0.96), smoothstep(0.44, 0.56, h));',
  '  c = mix(c, vec3(0.56, 0.24, 0.88), smoothstep(0.56, 0.68, h));',
  '  c = mix(c, vec3(0.98, 0.16, 0.62), smoothstep(0.68, 0.80, h));',
  '  c = mix(c, vec3(1.00, 0.46, 0.52), smoothstep(0.80, 0.90, h));',
  '  c = mix(c, vec3(0.95, 0.22, 0.10), smoothstep(0.90, 1.00, h));',
  '  return c;',
  '}',
  'void main(){',
  '  vec2 fc = gl_FragCoord.xy / uRes;',
  '  float asp = uRes.x / uRes.y;',
  '  vec2 p = vec2((fc.x - 0.5) * asp, fc.y);',
  '  float acc = 0.0, pup = 0.0;',
  '  vec2 hv = vec2(0.0);',
  '  for (int i = 0; i < 72; i++){',
  '    vec4 o0 = uO0[i], o1 = uO1[i];',
  '    float rad = o1.x;',
  '    if (rad <= 0.0008) continue;',
  '    float lob = o1.z, opn = o1.w, hue = o1.y;',
  '    float d, rr = rad;',
  '    if (lob >= 1.0){',
  '      vec2 q = p - o0.zw;',
  '      float L = length(q);',
  '      if (L > rad * 4.0) continue;',
  '      float th = atan(q.y, q.x) + hue * 19.0 + uT * 0.05 * (fract(hue * 7.3) - 0.5);',
  '      float sp = pow(abs(sin(th * lob * 0.5)), 4.0);',
  '      rr = rad * (0.36 + 0.64 * opn) * (1.0 + 1.15 * sp * opn);',
  '      d = L;',
  '      float pr = rad * (0.15 + 0.17 * opn);',
  '      pup += exp(-pow(L / pr, 2.0)) * opn;',
  '      hue += (L / max(rad, 1e-4)) * 0.20 * opn;',   // concentric rings
  '    } else {',
  '      d = segD(p, o0.xy, o0.zw);',
  '      if (d > rad * 3.0) continue;',
  '    }',
  '    float x = d / max(rr, 1e-5);',
  '    if (x > 2.7) continue;',
  '    float f = exp(-x * x * 1.42);',
  '    acc += f;',
  '    hv += vec2(cos(hue * TAU), sin(hue * TAU)) * f;',
  '  }',
  '  float hue = atan(hv.y, hv.x) / TAU;',
  '  float sat = clamp(length(hv) / max(acc, 1e-4), 0.0, 1.0);',
  '  vec3 base = pal(hue + uDrift);',
  '  base = mix(vec3(dot(base, vec3(0.31, 0.55, 0.14))), base, 0.35 + 0.65 * sat);',
  '  float soft = acc / (1.0 + acc);',
  '  float lum = smoothstep(0.13, 0.52, soft);',
  '  vec3 col = base * lum;',
  // cream in the dense middles — airbrush cores, not outlines
  '  col = mix(col, vec3(1.00, 0.955, 0.895), smoothstep(1.05, 2.45, acc) * (0.30 + 0.34 * uPres));',
  // the luminous rim at the silhouette: the one thing scrim renders perfectly
  '  col += vec3(1.00, 0.90, 0.80) * exp(-pow((acc - 0.40) / 0.17, 2.0)) * 0.20;',
  '  col *= (1.0 - clamp(pup, 0.0, 1.0) * 0.94);',
  // the sky is EARNED: nothing but black until the thicket closes over
  '  vec3 sky = mix(vec3(0.070, 0.038, 0.012), vec3(0.020, 0.014, 0.048), smoothstep(0.05, 0.95, fc.y));',
  '  sky += vec3(0.075, 0.050, 0.012) * exp(-pow((fc.y - 0.34) / 0.26, 2.0));',
  '  col += sky * uSky * 0.42 * (1.0 - clamp(lum, 0.0, 1.0));',
  // the hand lights its own country — the biggest continuous answer there is
  '  float sideK = smoothstep(-0.30, 0.30, p.x);',
  '  float hand = mix(uLh, uRh, sideK);',
  '  col *= 0.52 + 0.72 * hand;',
  '  col *= (0.55 + 0.45 * uPres) * (0.62 + 0.38 * (1.0 - uDusk));',
  '  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 1.14);',
  '  col = max(col, vec3(0.0)) / (1.0 + max(col, vec3(0.0)) * 0.55);',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

reg({
  id: 'SRC-44.2', family: 'SRC-44', ver: 2, title: 'Green Fuse V2', tech: 'ACCUMULATING GROWTH / LIVE POSTURE',
  music: {
    bpm: 92, root: 45, mode: 'aeolian', chordBars: 4,
    // PEDAL ON A. The root is the ground and never moves; the colour above it
    // opens the way the canopy does — 9th, 11th, sus, and finally the F that
    // turns the whole thing golden.
    chords: [
      [0, 7, 15, 19, 26],   // Am9
      [0, 7, 14, 17, 24],   // Am11
      [0, 5, 12, 15, 22],   // Am7add11
      [0, 8, 15, 20, 27]    // Fmaj7/A
    ],
    chordNames: ['Am9', 'Am11', 'Am7add11', 'Fmaj7/A']
  },
  fx: { bloom: 0.46 },
  tags: ['GROWTH ACCUMULATES', 'THE PLANT KEEPS IT', 'FIVE ERAS', 'OVERGROWTH IS EARNED'],
  desc: 'A garden that remembers. Two tubers glow on the floor of an empty black frame and put up one shoot each; the shoots follow your hands the way a plant follows the sun, and on every beat what they have reached becomes permanent — a stem, a bulb, a corona of fat needles with a black pupil and rings of colour running out of it. Nothing here resets between gestures, so the picture in front of you is the sum of every reach you have made: sprout, then bloom, then thicket, then a canopy that fills the wall and starts cycling through the whole spectrum, with a dim dawn coming up behind it that you only ever see if you got it that far. Everything is one fused field — organs melt into their neighbours and their colours melt with them, airbrushed, no line anywhere. Walk away and it does not snap back; the light falls, the coronas fold shut, the understory is absorbed, and over about three minutes the whole overgrowth sinks back to two tubers on the floor.',
  interact: 'REACH = GROW, and that is the whole instrument. Each hand is the sun over its own half of the garden — L the warm country on the left, R the violet country on the right — and the live shoots on that side stretch toward your hand continuously, this frame, no waiting. How HIGH you hold it is what kind of plant you get: held high, the shoots set long and the growth goes tall and spindly; held low, they set short and it packs into something dense and shrubby, so the two hands can be growing two different habits at once. On the beat the shoot sets and a new one starts from its tip, so you can feel the plant taking what you gave it. Hold both hands out and the two colonies climb, meet in the middle and interleave. What you cannot do is undo: the only way back down is to stop, and it takes minutes.',
  sound: 'The garden IS the chord. Every open corona holds a pad voice — warm blooms sit in the bottom of the voicing panned left, cool blooms in the top panned right — so a bare sprout is a bare fifth over the A pedal and a full canopy is a thick cluster you built one bloom at a time. Underneath, a sub root that never moves and an airy band whose vowel tracks the raw hands, so movement between events still speaks. Every growth event lands on the grid and sounds what it is: a stem sets with a soft wooden pluck low in the ladder, a corona opens with a bell high in it and a breath of air, and the pitch of both is the HEIGHT it happened at — the garden reads bottom to top as the chord ladder does. The growth clock subdivides as the eras open (every two beats, every beat, every half, every sixteenth) so the music thickens exactly as fast as the foliage does, and percussion is earned: a shaker only once the thicket closes, a kick only in the canopy. Ableton: pad ch2 = the blooms (CC74 = canopy), bass ch3 = pedal, lead ch1 = stems, bells ch5 = coronas, texture ch6 = the air, perc ch10.',

  init(P) {
    const s = {
      pres: 0, life: 0, L: 0, R: 0, LL: 0, RR: 0,
      age: 0, era: 0, pendEra: 0, lastBar: -1, upL: 0, upR: 0,
      org: [], tips: [], evq: [], capOf: {}, baseOf: {}, drift: 0, sky: 0, dusk: 0,
      nextGL: 0, nextGR: 0, asp: 1.6, bornL: 0, bornR: 0, born: 0, pid: 0,
      plantsL: 0, plantsR: 0,
      noGL: typeof THREE === 'undefined'
    };
    P.state = s;
    s.asp = P.w / P.h;
    G2_seed(P, s, 'L', -G2_STATION[0]);
    G2_seed(P, s, 'R', G2_STATION[0]);
    if (s.noGL) return;
    if (P._three) { try { P._three.renderer.dispose(); } catch (e) {} }
    const T3 = {}; P._three = T3;
    const sc = Math.min(1, 820 / Math.max(P.w, P.h));
    T3.rw = Math.max(2, Math.round(P.w * sc));
    T3.rh = Math.max(2, Math.round(P.h * sc));
    const r = new THREE.WebGLRenderer({ antialias: false });
    r.setSize(T3.rw, T3.rh, false);
    T3.renderer = r;
    const uni = {
      uRes: { value: new THREE.Vector2(T3.rw, T3.rh) },
      uT: { value: 0 }, uPres: { value: 0 }, uAge: { value: 0 },
      uSky: { value: 0 }, uDrift: { value: 0 }, uDusk: { value: 0 },
      uLh: { value: 0 }, uRh: { value: 0 },
      uO0: { value: new Float32Array(G2_NORG * 4) },
      uO1: { value: new Float32Array(G2_NORG * 4) }
    };
    T3.uni = uni;
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: G2_FS
    });
    const scn = new THREE.Scene();
    scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    T3.scene = scn;
    T3.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    s.life += dt;
    s.asp = P.w / P.h;
    // a RAISED HAND IS A PERSON, whatever chan.mode has decided. mode drops to
    // 'drift' six seconds after the last message, and a player holding a pose
    // sends no messages at all.
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live' ||
                  chan.L.v > 0.12 || chan.R.v > 0.12) ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // tight coupling: the shoots must not wait for anything
    s.L += (clamp(inp.L) - s.L) * Math.min(1, dt * 8);
    s.R += (clamp(inp.R) - s.R) * Math.min(1, dt * 8);
    // idle tease: a slow breath keeps one shoot feeling upward when nobody is here
    // the idle breath fills in UNDER the hand and never replaces it
    const idle = (0.20 + 0.13 * Math.sin(s.life * 0.23)) * (1 - s.pres);
    s.LL = Math.max(s.L, idle);
    s.RR = Math.max(s.R, idle);

    /* AGE — the integral of light. Up fast while played, down slow when left. */
    const feed = (s.LL + s.RR) * 0.5;
    s.age = clamp(s.age + dt * (feed * 0.0138 * (0.30 + 0.70 * s.pres) - 0.0056 * (1 - s.pres)));
    s.dusk += ((1 - s.pres) * clamp(1 - feed * 1.6) - s.dusk) * Math.min(1, dt * 0.6);

    let want = 0;
    for (let i = G2_ERA.length - 1; i >= 0; i--) if (s.age >= G2_ERA[i]) { want = i; break; }
    s.pendEra = want;
    const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : Math.floor(s.life / 2.6);
    if (bar !== s.lastBar) {                       // eras change on the bar line
      s.lastBar = bar;
      if (s.pendEra !== s.era) { s.evq.push({ k: 'era', era: s.pendEra, up: s.pendEra > s.era }); s.era = s.pendEra; }
    }
    s.drift += dt * 0.014 * clamp((s.age - 0.62) / 0.30);
    s.sky += (clamp((s.age - 0.52) / 0.34) - s.sky) * Math.min(1, dt * 0.5);

    /* the growth clock — quantised, and it subdivides as the eras open */
    const SUB = [4, 2, 1, 0.5, 0.5][s.era];
    const bt = (typeof T !== 'undefined' && T.running) ? T.beats() : s.life * 1.55;
    for (const side of ['L', 'R']) {
      const key = side === 'L' ? 'nextGL' : 'nextGR';
      if (bt < s[key]) continue;
      s[key] = (Math.floor(bt / SUB) + 1) * SUB;
      const lgt = side === 'L' ? s.LL : s.RR;
      const full = s.org.filter(q => !q.dead).length >= G2_target(s);
      if (lgt > 0.11 && P.rand() < (0.16 + lgt * 0.84) * (0.22 + 0.78 * s.pres) * (full ? 0.18 : 1)) {
        G2_grow(P, s, side, lgt);
        if (side === 'L') s.bornL++; else s.bornR++;
      }
    }
    // more plants along the floor as the garden ages — 16:10 is wide
    const wantPlants = 1 + Math.round(s.age * 3.6);
    for (const side of ['L', 'R']) {
      const n = G2_livePlants(s, side);
      const lgt = side === 'L' ? s.LL : s.RR;
      if (n < wantPlants && lgt > 0.13 && P.rand() < dt * 2.2 * s.pres) G2_seed(P, s, side, G2_slot(P, s, side));
    }
    G2_prune(s);
    if (s.evq.length > 14) s.evq.splice(0, s.evq.length - 14);

    /* the live shoots follow the hands, continuously */
    for (const tp of s.tips) {
      if (!tp.alive || !tp.shoot || tp.shoot.isShoot !== true) continue;
      const lgt = tp.side === 'L' ? s.LL : s.RR;
      const len = (0.028 + lgt * 0.098) * (1 + s.era * 0.11) * (tp.vig || 1) * Math.pow(0.88, tp.gen);
      const sh = tp.shoot;
      sh.ax = tp.x; sh.ay = tp.y;
      const tx = clamp(tp.x + Math.cos(tp.ang) * len, -s.asp * 0.46, s.asp * 0.46);
      const ty = Math.min(tp.y + Math.sin(tp.ang) * len, 0.94);
      sh.bx += (tx - sh.bx) * Math.min(1, dt * 9);
      sh.by += (ty - sh.by) * Math.min(1, dt * 9);
      sh.hue += ((tp.hue0 + tp.gen * 0.028) - sh.hue) * Math.min(1, dt * 0.8);
    }

    /* POSTURE — the live, whole-picture answer. Smoothed hard enough to feel
       instant (a quarter second) and applied only at upload, so nothing here
       can ever feed back into what the garden has already grown. */
    s.upL += (s.LL - s.upL) * Math.min(1, dt * 5);
    s.upR += (s.RR - s.upR) * Math.min(1, dt * 5);

    /* organs breathe, coronas open with the light, the dying are absorbed */
    const lightAvg = (s.LL + s.RR) * 0.5;
    for (let i = s.org.length - 1; i >= 0; i--) {
      const o = s.org[i];
      if (o.dead) {
        o.r -= dt * (o.r0 * 1.5 + 0.010);
        if (o.r <= 0.0008) { s.org.splice(i, 1); continue; }
      } else if (o.bloom) {
        o.openT = clamp(0.06 + (o.side === 'L' ? s.LL : s.RR) * 1.15);
        o.open += (o.openT - o.open) * Math.min(1, dt * 3.2);
        o.r += (o.r0 * (0.86 + 0.14 * lightAvg) - o.r) * Math.min(1, dt * 1.2);
      }
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    if (s.noGL || !P._three) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const mn = Math.min(w, h);
      for (const o of s.org) {
        const x = w / 2 + o.bx * mn * (h / mn), y = h - o.by * h, r = Math.max(2, o.r * h);
        const gr = g.createRadialGradient(x, y, r * 0.05, x, y, r * 1.6);
        gr.addColorStop(0, o.side === 'L' ? 'rgba(255,180,90,0.85)' : 'rgba(150,150,240,0.85)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 1.6, 0, TAU); g.fill();
      }
      g.fillStyle = 'rgba(255,200,140,0.8)';
      g.font = `${Math.round(11 * ms)}px ui-monospace,monospace`;
      g.fillText('GREEN FUSE · open on the hosted site (WebGL)', 10, h - 10);
      return;
    }
    const T3 = P._three, u = T3.uni;
    u.uT.value = s.life; u.uPres.value = s.pres; u.uAge.value = s.age;
    u.uSky.value = s.sky; u.uDrift.value = s.drift; u.uDusk.value = s.dusk;
    u.uLh.value = s.upL; u.uRh.value = s.upR;
    const a0 = u.uO0.value, a1 = u.uO1.value;
    // the whole garden sways on one wind — taller organs move further
    const wind = Math.sin(s.life * 0.47) * 0.010 + Math.sin(s.life * 0.19) * 0.006;
    for (let i = 0; i < G2_NORG; i++) {
      const o = s.org[i], k = i * 4;
      if (!o || o.r <= 0.0008) { a1[k] = 0; a1[k + 1] = 0; a1[k + 2] = 0; a1[k + 3] = 0; continue; }
      const up = o.side === 'L' ? s.upL : s.upR;
      const rise = 0.74 + up * 0.52;                 // the colony stands up
      const lean = (o.side === 'L' ? -1 : 1) * (0.30 - up * 0.34);
      const sa = wind * o.ay * o.ay * 3.2 + Math.sin(s.life * 0.8 + o.ph) * 0.0022 + lean * o.ay * o.ay;
      const sb = wind * o.by * o.by * 3.2 + Math.sin(s.life * 0.8 + o.ph) * 0.0022 + lean * o.by * o.by;
      a0[k] = o.ax + sa; a0[k + 1] = o.ay * rise;
      a0[k + 2] = o.bx + sb; a0[k + 3] = o.by * rise;
      a1[k] = o.r * (0.80 + up * 0.34) * (1 + 0.045 * Math.sin(s.life * 0.7 + o.ph));
      a1[k + 1] = o.hue; a1[k + 2] = o.lobes || 0; a1[k + 3] = o.open || 0;
    }
    T3.renderer.render(T3.scene, T3.cam);
    g.clearRect(0, 0, w, h);
    g.drawImage(T3.renderer.domElement, 0, 0, w, h);

    const blooms = s.org.filter(o => o.bloom && !o.dead).length;
    const SUB = [4, 2, 1, 0.5, 0.5][s.era];
    g.fillStyle = 'rgba(210,240,190,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('AGE ' + Math.round(s.age * 100) + '%   ERA ' + s.era + '/4 ' + G2_ERANAME[s.era] +
      '   L ' + Math.round(s.LL * 100) + '  R ' + Math.round(s.RR * 100) +
      '   ORGANS ' + s.org.length + '/' + G2_NORG + '   BLOOMS ' + blooms +
      '   GROW ' + (SUB >= 1 ? 'EVERY ' + SUB + (SUB > 1 ? ' BEATS' : ' BEAT') : '1/' + Math.round(1 / SUB) + ' BEAT') +
      (s.pres < 0.3 ? '   · DYING BACK' : ''), 10, h - 10);
  },

  audio(A, P) {
    const s = P.state;
    const bank = (pan, n, opts) => {
      const v = A.voice();
      try { v.group.disconnect(); A.pan(v.group, pan).connect(A.out()); } catch (e) {}
      const pv = A.padVoices(v, n, opts);
      v.fadeIn(1, 2.4);
      return { v, pv };
    };
    const warm = bank(-0.55, 3, { type: 'triangle', gain: 0.0001, cutoff: 300, q: 0.7 });
    const cool = bank(0.55, 3, { type: 'triangle', gain: 0.0001, cutoff: 420, q: 0.8 });
    const vb = A.voice();
    const sub = A.padVoices(vb, 1, { type: 'triangle', gain: 0.009, cutoff: 150, q: 0.5 });
    // the reactive layer: air that always answers a moving hand
    const air = A.voice();
    const nz = air.noise(), af = air.filter('bandpass', 900, 1.4), ag = air.g(0.002);
    nz.connect(af); af.connect(ag); ag.connect(air.group);
    if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.6; ag.connect(sd); sd.connect(A.revIn); }
    vb.fadeIn(1, 2.6); air.fadeIn(1, 2.0);

    const place = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      for (let i = 0; i < 3; i++) warm.pv[i].set(H.chordTone(i, -1), glide + i * 0.02);
      for (let i = 0; i < 3; i++) cool.pv[i].set(H.chordTone(i + 3, 0), glide + i * 0.02);
    };
    place(0.05);
    H.onChord(() => place(0.32));
    let st16 = -1;

    return {
      tick(inp, dt) {
        const gate = 0.25 + s.pres * 0.75;
        const nL = s.org.filter(o => o.bloom && !o.dead && o.side === 'L' && o.open > 0.3).length;
        const nR = s.org.filter(o => o.bloom && !o.dead && o.side === 'R' && o.open > 0.3).length;
        const canopy = clamp((nL + nR) / 10);

        sub[0].level(0.006 + s.age * 0.010, 0.7);
        for (let i = 0; i < 3; i++) {
          warm.pv[i].level((0.0001 + clamp(nL / 3) * (0.013 - i * 0.0022) * (0.35 + 0.65 * s.LL)) * gate, 0.8);
          warm.pv[i].bright(190 + s.LL * 360 + s.age * 260, 0.6);
          cool.pv[i].level((0.0001 + clamp(nR / 3) * (0.011 - i * 0.0018) * (0.35 + 0.65 * s.RR)) * gate, 0.8);
          cool.pv[i].bright(280 + s.RR * 620 + s.age * 300, 0.6);
        }
        A.set(ag.gain, (0.0012 + (s.LL + s.RR) * 0.0040 + canopy * 0.0022) * gate, 0.3);
        A.set(af.frequency, 520 + s.RR * 2600 + s.LL * 700, 0.28);
        A.set(af.Q, 0.9 + s.LL * 5.0, 0.3);

        /* earned percussion, scheduled a beat ahead on the 16th grid */
        if (typeof T !== 'undefined' && T.running) {
          const bt = T.beats();
          if (st16 < 0) st16 = Math.ceil(bt / 0.25) * 0.25;
          while (st16 < bt + 0.7) {
            const at = T.t0 + st16 * T.beat;
            const k = Math.round(st16 / 0.25) % 16;
            if (s.era >= 3 && k % 4 === 2) A.hat(at, { vol: 0.016 * gate * canopy });
            if (s.era >= 4 && (k === 0 || k === 10)) A.kick(at, 0.14 * gate);
            if (s.era >= 4 && k === 14) A.hat(at, { vol: 0.022 * gate, open: true });
            st16 += 0.25;
          }
        }

        let ev, n = 0;
        while ((ev = s.evq.shift()) && n < 4) {
          n++;
          if (ev.k === 'era') {                       // the era opens with a roll
            if (!ev.up) continue;
            const at = T.next(1);
            for (let i = 0; i < 5; i++) {
              A.bell(H.chordTone(i * 2, ev.era >= 3 ? 1 : 0),
                { at: at + i * 0.085, vol: 0.020 * gate, dur: 4.0, pan: -0.6 + i * 0.3, rev: 0.9 });
            }
            A.bassNote(H.chordTone(0, -2), { at, vol: 0.070 * gate, dur: 5 });
            continue;
          }
          // PITCH IS HEIGHT: the garden reads bottom-to-top as the chord ladder
          const idx = Math.round(clamp(ev.y / 0.92) * 9) + ev.gen;
          const pan = clamp(ev.x / Math.max(s.asp * 0.5, 1e-3), -1, 1) * 0.7;
          if (ev.k === 'stem') {
            A.pluck2(H.chordTone(idx, ev.side === 'L' ? -1 : 0),
              { at: T.next(0.25), vol: (0.016 + 0.010 * s.age) * gate, dur: 1.0 + s.age * 1.2, pan, rev: 0.5, del: 0.12 });
          } else {
            const at = T.next(0.25);
            const big = clamp((ev.r - 0.045) / 0.085);
            A.bell(H.chordTone(idx, ev.side === 'L' ? 0 : 1),
              { at, vol: (0.022 + big * 0.020) * gate, dur: 2.6 + big * 3.0, pan, rev: 0.88, del: 0.16 });
            A.hit({ at, vol: 0.012 + big * 0.016, dur: 0.22, freq: 3200 + ev.lobes * 90, q: 1.1, pan });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', canopy);
          MOut.expr('lead', s.LL);
          MOut.expr('bells', s.RR);
          MOut.expr('bass', s.age);
        }
      },
      stop() { warm.v.kill(); cool.v.kill(); vb.kill(); air.kill(); }
    };
  }
});
