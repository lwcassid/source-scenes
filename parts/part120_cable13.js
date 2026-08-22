/* ---------- SRC-13.13 · EVENT HORIZON V13 — the stargate, the held wall ---------- */
/* Lance's seven, V12→V13: NEVER TAKE THE INSTRUMENT — a still hand reads as
   absence to the tracker, so during the swallow and the window the wall
   HOLDS the player's last pose instead of sagging into the idle sway. The
   raised line makes a BRIGHT SPACE — rim depth grows with arm height. The
   pocket LATCHES its high-water intensity (dropping the arms to play must
   not fade the drums). The chords are a MELODY now: Am7→G/A→F/A→Em/A, top
   voice stepping E→D→C→B every bar, top chair mixed above the wall, flick
   hits pulled down and regularized (fixed register, one global cooldown) so
   the wall of sound is the instrument. THE STARGATE: inside the window the
   stars change paradigm — radial flight out of a vanishing point above the
   line, colorful 2001 streaks accelerating AT you. And the whole world
   commits to the drop: line, rim and ridge shift mint→cyan→violet with it.
   The lure got louder: richer floor, whispered low chair on each breath. */
reg({
  id: 'SRC-13.13', family: 'SRC-13', ver: 13, title: 'Event Horizon', tech: 'VERLET ROPE / ACCRETION',
  music: {
    bpm: 64, root: 45, mode: 'aeolian', chordBars: 1,
    chords: [
      // a LAMENT, not a bed: the top voice IS the melody, stepping down
      // E → D → C → B across the cycle, one bar per chord so you hear it move
      [0, 10, 15, 19, 31],   // Am7 — E on top
      [0, 10, 14, 17, 29],   // G/A — D on top
      [0, 8, 15, 20, 27],    // F/A — C on top
      [0, 7, 14, 19, 26]     // Em/A — B on top
    ],
    chordNames: ['Am7', 'G/A', 'F/A', 'Em/A']
  },
  fx: { bloom: 0.6 },
  tags: ['THE LAST LINE OF LIGHT', 'AUDIBLE CRESCENDO', 'THE SWALLOW', 'THE WARP', 'REDSHIFT ECHO'],
  desc: 'The cable is the event horizon: one burning line between the sky and the void. Stars drift down, accelerate, and are eaten; nothing below the line ever comes back. Raise your arms and an organ-dark string section assembles CHAIR BY CHAIR, the whole wall swelling under your hands over a descending chord melody. Hold both arms high and the void RISES and swallows the room — and the beat drops ON the boom: THE OTHER SIDE opens as a STARGATE, colorful streaks of light flying out of a point above the line straight at you, 2001-style, faster the higher you hold the wall, while the line and its glow turn mint and cyan with the new world. Each swallow leaves a scar — fewer stars, a darker, heavier wall, forever.',
  interact: 'L = left arm of the conductor, R = right. Height is the crescendo: every chair you add is announced and audibly thickens the wall; the filter opens as you rise. A flick = one run that OBEYS the throw: upward flicks rise, downward fall, lobs run dark, snaps sit brighter. HOLD BOTH ARMS HIGH to charge the swallow — once it starts charging you may relax well below the top, and a wobble only pauses the charge. At totality everything goes black but the line — then THE OTHER SIDE: a stargate opens above the line, YOUR ARMS ARE THE THROTTLE (higher = space flies at you faster), the beat pulses the starfield, and if the sensors lose you mid-window the wall HOLDS where you left it. While the rim runs ember-dim the horizon is recharging; the sound stays veiled until the fire returns.',
  sound: 'The crescendo is the instrument and the WALL outweighs every transient: six chairs with announced entrances, filter opening with the arms, sub-octave stop past 70% tension, everything through the tempo gate (depth on pad CC74 for a gate plugin in Live). THE SWALLOW: a riser you hear charging, the band ducking as the void climbs, one enormous sub boom at totality — and the window opens AT totality: the boom is beat one, the ~45s DOUBLE-TIME pocket (128-feel four-on-the-floor, crack backbeat, hats) is already driving while the void recedes — no silence between climax and groove, and the pocket LATCHES its high-water intensity so playing the wall never fades the drums. The chords are a melody: Am7→G/A→F/A→Em/A, top voice stepping E→D→C→B every bar on a chair mixed above the wall; flick runs are quiet, fixed-register, one at a time — texture under the melody, never over it. The re-bloom rolls low-to-high (subs, then low chairs, then high). Aftermath is audible: while recharging the chairs\' filter ceilings are veiled and the upper hum hollowed until the fire returns; each scar permanently darkens the ceilings and adds sub weight. Idle is a lure, not a performance: undulating low floor, randomized bass breaths that ripple the line, a rare deep toll that hurries the stars — no highs. Ableton: runs ch1, pulse ch3, pad ch2/6, pocket ch10, riser/boom sfx ch11, toll ch5.',

  init(P) {
    const N = 40;
    const nodes = [];
    for (let i = 0; i < N; i++) nodes.push({ x: 0, y: 0, ox: 0, oy: 0 });
    const NS = Math.round(70 * Math.max(0.5, areaScale(P)));
    const stars = [];
    for (let i = 0; i < NS; i++) {
      // z = per-star depth: nearer stars run faster and fatter in the warp,
      // so the window reads as flying THROUGH a field, not past a curtain
      stars.push({ x: P.rand(), y: P.rand() * 0.75, vy: 0, px: 0, py: 0, z: 0.45 + P.rand() * 0.95 });
    }
    P.state = {
      N, nodes, seg: 0, tension: 0, wave: 0, pres: 0,
      uL: 0, uR: 0, vL: 0, vR: 0, gate: 0, runs: 0,
      prevAy: 0, prevBy: 0, cdL: 0, cdR: 0, strumQ: [],
      hist: [], histAcc: 0, idleKick: 0, born: 0, init: false,
      stars, chg: 0, act: 0, rise: 0, cdT: 0, cool: 0, scar: 0,
      // V10: the jam window, the forgiving charge, the lure
      jamT: 0, jam: 0, chgGrace: 0, jamHeat: 0, warpInit: false,
      heldL: 0.3, heldR: 0.3, cdRun: 0,
      breathT: 0, breath: 0, toll: 0, tollFire: false, breathN: 0
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, { N, nodes } = s, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const idL = 0.16 + 0.09 * Math.sin(t * 0.21), idR = 0.16 + 0.09 * Math.sin(t * 0.26 + 2.1);
    s.uL = clamp(inp.L) * s.pres + idL * (1 - s.pres);
    s.uR = clamp(inp.R) * s.pres + idR * (1 - s.pres);
    // NEVER take the instrument from the player: a hand held perfectly
    // still reads as absence to the tracker, so through the swallow and
    // the whole window the wall HOLDS the last pose they gave it instead
    // of sagging into the idle sway. The sway is for real absence only.
    if (s.pres > 0.5) { s.heldL = s.uL; s.heldR = s.uR; }
    else if (s.jamT > 0 || s.act > 0 || s.chg > 0.05) {
      s.uL = clamp(inp.L) * s.pres + s.heldL * (1 - s.pres);
      s.uR = clamp(inp.R) * s.pres + s.heldR * (1 - s.pres);
    }
    const ax = w * 0.08, bx = w * 0.92;
    const ay = h * (0.62 - s.uL * 0.46), by = h * (0.62 - s.uR * 0.46);
    if (!s.init) {
      s.init = true; s.born = t; s.prevAy = ay; s.prevBy = by;
      const span = bx - ax;
      const extra = Math.max(8, (1.16 - 0.22 * ((s.uL + s.uR) / 2)) * span - span);
      const sag = Math.sqrt(3 * span * extra / 8);
      for (let i = 0; i < N; i++) {
        const tt = i / (N - 1);
        nodes[i].x = nodes[i].ox = lerp(ax, bx, tt);
        nodes[i].y = nodes[i].oy = lerp(ay, by, tt) + Math.sin(tt * Math.PI) * sag;
      }
    }
    // ---- THE LURE: idle is bass breaths that visibly move the line --------
    // randomized spacing/depth/position (never a metronome); ~1 in 7 breaths
    // is a deep toll that hurries the stars toward the horizon.
    if (s.pres < 0.25 && t > s.breathT) {
      s.breathT = t + 5 + P.rand() * 9;
      s.breath = 0.55 + P.rand() * 0.45;
      const ni = 6 + Math.floor(P.rand() * (N - 12));
      const mag = 2.5 + s.breath * 4;
      for (let i = -2; i <= 2; i++) nodes[ni + i].oy -= (3 - Math.abs(i)) * mag;
      s.breathN++;
      if (s.breathN % 5 === 2 || P.rand() < 0.08) { s.toll = 1; s.tollFire = true; }
    }
    s.breath *= Math.pow(0.25, dt);
    s.toll *= Math.pow(0.5, dt);

    const settled = t - s.born > 3;
    if (settled && s.pres > 0.3 && dt > 0) {
      // signed: y grows downward, so negative = the hand threw UPWARD
      // ONE global cooldown — overlapping runs from both sides read as
      // random spray, one at a time reads as played
      const vA = (ay - s.prevAy) / (h * dt), vB = (by - s.prevBy) / (h * dt);
      if (Math.abs(vA) > 0.9 && t > s.cdRun) { s.cdRun = t + 1.1; s.runs++; s.strumQ.push({ side: -1, up: vA < 0, sp: Math.abs(vA) }); }
      else if (Math.abs(vB) > 0.9 && t > s.cdRun) { s.cdRun = t + 1.1; s.runs++; s.strumQ.push({ side: 1, up: vB < 0, sp: Math.abs(vB) }); }
      if (s.strumQ.length > 2) s.strumQ.length = 2;
    }
    s.prevAy = ay; s.prevBy = by;

    s.seg = (bx - ax) * (1.16 - 0.22 * ((s.uL + s.uR) / 2)) / (N - 1);
    // full solver only where full fidelity is seen: phones and wall tiles
    // get a coarser (still stable) rope
    const ITER = (typeof window !== 'undefined' && window.IS_MOBILE) ? 14 : areaScale(P) > 1.6 ? 22 : 12;
    const sub = 2;
    for (let ss = 0; ss < sub; ss++) {
      const sdt = dt / sub;
      for (let i = 1; i < N - 1; i++) {
        const nd = nodes[i];
        const vx = (nd.x - nd.ox) * 0.996, vy = (nd.y - nd.oy) * 0.996;
        nd.ox = nd.x; nd.oy = nd.y;
        nd.x += vx; nd.y += vy + 1300 * sdt * sdt;
      }
      nodes[0].x = ax; nodes[0].y = ay;
      nodes[N - 1].x = bx; nodes[N - 1].y = by;
      for (let it = 0; it < ITER; it++) {
        for (let i = 0; i < N - 1; i++) {
          const a = nodes[i], b = nodes[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1e-5;
          const diff = (d - s.seg) / d * 0.5;
          const mA = i === 0 ? 0 : 1, mB = i === N - 2 ? 0 : 1;
          const tot = mA + mB || 1;
          a.x += dx * diff * 2 * mA / tot; a.y += dy * diff * 2 * mA / tot;
          b.x -= dx * diff * 2 * mB / tot; b.y -= dy * diff * 2 * mB / tot;
        }
        nodes[0].x = ax; nodes[0].y = ay;
        nodes[N - 1].x = bx; nodes[N - 1].y = by;
      }
    }
    let pathLen = 0;
    for (let i = 0; i < N - 1; i++) pathLen += Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
    const chord = Math.hypot(bx - ax, by - ay);
    s.tension += (clamp(1 - (pathLen / chord - 1) / 0.12) - s.tension) * Math.min(1, dt * 4);

    let wave = 0;
    for (let i = 1; i < N - 1; i++) wave += Math.abs(nodes[i].y - nodes[i].oy);
    s.wave += (wave / N - s.wave) * 0.25;

    // ---- THE SWALLOW state machine -------------------------------------
    // REACHABLE CHARGE (the rail-parking fix): enter charging with both arms
    // high (0.78) but SUSTAIN it well below the rails (0.62); higher arms
    // charge faster; a wobble below the hold line freezes the charge for a
    // grace beat instead of draining it.
    const lo = Math.min(s.uL, s.uR);
    const charging = s.chg > 0.001;
    const inZone = charging ? lo > 0.62 : (s.uL > 0.78 && s.uR > 0.78);
    if (s.act === 0 && settled && s.pres > 0.5 && t > s.cdT && s.jamT <= 0 && inZone) {
      const liftK = clamp((lo - 0.62) / 0.36);
      s.chgGrace = 0.8;
      s.chg = Math.min(1, s.chg + dt / (4.5 + (1 - liftK) * 4));
      if (s.chg >= 1) { s.act = 0.0001; s.chg = 0; }
    } else if (s.act === 0) {
      s.chgGrace = Math.max(0, s.chgGrace - dt);
      if (s.chgGrace <= 0) s.chg = Math.max(0, s.chg - dt * 0.5);
    }
    if (s.act > 0) {
      const actPrev = s.act;
      s.act = Math.min(1, s.act + dt / 3.2);
      s.rise = s.act < 0.5 ? s.act * 2 : (1 - s.act) * 2;   // up, hold nothing, back
      // THE DROP LANDS ON THE BOOM: the window opens AT totality, so the
      // pocket is already driving while the void recedes — flying out of
      // the black into the warp, never through a silent gap
      if (actPrev < 0.5 && s.act >= 0.5) { s.jamT = 47; s.jamHeat = 0.55; }
      if (s.act >= 1) {
        s.act = 0; s.rise = 0;
        // THE SCAR: what the hole eats, it keeps. Fewer stars, deeper rim,
        // permanently — a long session visibly consumes the sky.
        s.scar++;
        s.stars.length = Math.max(24, Math.floor(s.stars.length * 0.82));
        // the recharge countdown starts only when the window closes
        s.cdT = t + s.jamT + 25;
      }
    }
    if (s.jamT > 0) s.jamT = Math.max(0, s.jamT - dt);
    const jamTarget = s.jamT > 0 ? clamp(s.jamT / 5) : 0;   // last 5s fade out
    s.jam += (jamTarget - s.jam) * Math.min(1, dt * 3.5);
    // the pocket LATCHES its high-water mark: bringing the arms down to
    // play the wall must not fade the drums out from under the player
    if (s.jamT > 0) s.jamHeat = Math.max(s.jamHeat, s.tension);
    else s.jamHeat *= Math.pow(0.5, dt);
    // recharge state, made visible: 1 right after the window closes, easing to 0
    s.cool = (s.act === 0 && s.jamT <= 0) ? clamp((s.cdT - t) / 25) : 0;

    // ---- starfall: everything above the line is falling toward it ------
    // (during the jam window the flow REVERSES: the sky is given back upward)
    const cableYat = x => {
      const i = clamp((x * w - ax) / (bx - ax)) * (N - 1);
      const i0 = Math.floor(i), fr = i - i0;
      return lerp(nodes[i0].y, nodes[Math.min(N - 1, i0 + 1)].y, fr);
    };
    const hunger = 1 + s.chg * 2 + s.rise * 6 + s.toll * 2.2;
    // THE WARP THROTTLE: inside the window the arms drive how fast space
    // rushes past — the wall you hold IS the speed you fly
    const throttle = 0.35 + 0.65 * ((s.uL + s.uR) / 2);
    if (s.jam > 0.1) {
      // THE STARGATE: a different paradigm, not a faster ejecta — stars fly
      // radially OUT of a vanishing point above the line, accelerating at
      // the viewer, 2001-style. Depth (z) sets speed and girth.
      let topY2 = h;
      for (let i = 0; i < N; i++) if (nodes[i].y < topY2) topY2 = nodes[i].y;
      const vpx = w * 0.5, vpy = Math.max(h * 0.07, topY2 * 0.55);
      const seed = st => {
        st.rd = 0.02 + P.rand() * 0.07; st.ang = P.rand() * TAU;
        st.x = (vpx + Math.cos(st.ang) * st.rd * w * 0.8) / w;
        st.y = (vpy + Math.sin(st.ang) * st.rd * h * 0.8) / h;
        st.px = st.x; st.py = st.y;
      };
      if (!s.warpInit) {
        s.warpInit = true;
        for (const st of s.stars) {
          st.rd = 0.03 + Math.pow(P.rand(), 1.6); st.ang = P.rand() * TAU;
          st.x = (vpx + Math.cos(st.ang) * st.rd * w * 0.8) / w;
          st.y = (vpy + Math.sin(st.ang) * st.rd * h * 0.8) / h;
          st.px = st.x; st.py = st.y;
        }
      }
      for (const st of s.stars) {
        st.px = st.x; st.py = st.y;
        st.rd += (0.12 + st.rd * (1.3 + 2.0 * throttle)) * st.z * s.jam * dt;
        if (st.rd > 1.4) { seed(st); continue; }
        st.x = (vpx + Math.cos(st.ang) * st.rd * w * 0.8) / w;
        st.y = (vpy + Math.sin(st.ang) * st.rd * h * 0.8) / h;
      }
    } else {
      s.warpInit = false;
      for (const st of s.stars) {
        st.px = st.x; st.py = st.y;
        const cy = cableYat(st.x) / h;
        const d = Math.max(0.04, cy - st.y);
        st.vy += (0.0022 / (d * d)) * dt * hunger;
        st.vy = Math.min(st.vy, 0.55 * hunger);
        st.y += st.vy * dt;
        st.x += Math.sin(st.y * 17 + st.x * 31) * dt * 0.004;   // faint shear
        if (st.y >= cy - 0.004) {
          st.x = P.rand(); st.y = P.rand() * 0.12; st.vy = 0; st.px = st.x; st.py = st.y;
        }
        if (st.y < -0.06) { st.y = -0.06; st.vy = 0; }
      }
    }

    s.histAcc += dt;
    if (s.histAcc > 0.045) {
      s.histAcc = 0;
      const snap = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) { snap[i * 2] = nodes[i].x; snap[i * 2 + 1] = nodes[i].y; }
      s.hist.push(snap);
      if (s.hist.length > 22) s.hist.shift();
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, { N, nodes } = s;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    // THE OTHER SIDE is a different WORLD: space washes deep TEAL while the
    // window is open (the line and rim stay ember — you stand at the burning
    // horizon while an aurora rushes past; the two worlds can't be confused)
    const jw = s.jam;
    g.fillStyle = `rgba(${Math.round(4 - 2 * jw)},${Math.round(3 + 11 * jw)},${7 + Math.round(11 * jw)},0.45)`;
    g.fillRect(0, 0, w, h);
    // the beat is VISIBLE inside the window: kick pulse rides the starfield
    const bp = jw > 0.02 ? Math.max(0, 1 - ((T.beats() * 2) % 1) * 3) * jw : 0;

    const ax = nodes[0].x, bx = nodes[N - 1].x;
    let cavg = 0, topY = h;
    for (let i = 0; i < N; i++) { cavg += nodes[i].y; if (nodes[i].y < topY) topY = nodes[i].y; }
    cavg /= N;

    // ---- the sky: stars falling toward the line — or, on the other side,
    // a WARP FIELD: long depth-scaled blue-white streaks rushing upward ---
    for (const st of s.stars) {
      const dx = (st.x - st.px) * w, dy = (st.y - st.py) * h;
      const sp = Math.min(1, Math.abs(st.vy) * 6 + (Math.hypot(dx, dy) / (9 * ms)) * jw);
      // fat enough for mesh — the scrim erases thin streaks entirely
      const a = (0.35 + sp * 0.55) * (1 + 0.4 * bp);
      // warm ember sky normally; 2001 STARGATE in the window — each streak
      // sits somewhere on a green → cyan → violet band (by angle and depth),
      // so the portal reads as colorful gradients whizzing by
      const f = 0.5 + 0.5 * Math.sin((st.ang || 0) * 2 + st.z * 4.7);
      let pr, pg2, pb;
      if (f < 0.5) { const u = f * 2; pr = 60 + 25 * u; pg2 = 235 - 15 * u; pb = 150 + 105 * u; }
      else { const u = (f - 0.5) * 2; pr = 85 + 90 * u; pg2 = 220 - 90 * u; pb = 255; }
      const zb = 0.72 + st.z * 0.34;   // near = brighter
      const r = lerp(200 + sp * 55, pr * zb, jw);
      const gg = lerp(205 - sp * 60, pg2 * zb, jw);
      const bb = lerp(255 - sp * 120, pb * zb, jw);
      g.strokeStyle = `rgba(${r | 0},${gg | 0},${bb | 0},${Math.min(1, a)})`;
      // in the gate, girth grows as the streak flies out toward you
      g.lineWidth = (2.2 + sp * 1.8) * (1 + ((st.rd || 0) * 1.4 + (st.z - 0.9) * 0.5) * jw) * ms;
      // the streak extends backwards along the motion — at warp the tails
      // stretch several frames long and the field reads as flying through
      g.beginPath();
      g.moveTo(st.x * w - dx * (1 + jw * 3.5), st.y * h - dy * (1 + jw * 3.5));
      g.lineTo(st.x * w, st.y * h + 1.5 * ms);
      g.stroke();
    }

    // ---- the sky: soft ambient light escaping upward (full-frame, no
    // hard shapes — the glow that FOLLOWS the line comes next) -----------
    const gpulse = s.gate;
    // sky back to the V4 treatment — the space stays dark, the light lives
    // at the horizon (V5's tension-scaled sky brightening: reverted)
    const glow = (0.10 + s.tension * 0.18 + gpulse * 0.10 + s.chg * 0.25 + s.jam * 0.10) * (0.4 + s.pres * 0.6);
    const skyBot = Math.min(h, topY + h * 0.15);
    const sky = g.createLinearGradient(0, topY - h * 0.38, 0, skyBot);
    // the ambient sky light goes cyan inside the window — the world above
    // the line changes; the ember stays at (and below) the horizon
    const skR = Math.round(lerp(255, 70, jw)), skG = Math.round(lerp(110, 220, jw)), skB = Math.round(lerp(55, 200, jw));
    sky.addColorStop(0, `rgba(${Math.round(lerp(255, 60, jw))},${Math.round(lerp(80, 200, jw))},${Math.round(lerp(90, 190, jw))},0)`);
    sky.addColorStop(0.72, `rgba(${skR},${skG},${skB},${glow * 0.5})`);
    sky.addColorStop(1, `rgba(${skR},${skG},${skB},0)`);
    g.fillStyle = sky; g.fillRect(0, 0, w, skyBot);

    // ---- glow that hugs the curve: photon ring above, dying red rim
    // below. Layered full-span strokes with heavy overlap — the falloff
    // follows the LINE, not an absolute height (a gradient anchored to the
    // average y paints a flat slab wherever the curve leaves the average).
    const ridge = (off, style, lw) => {
      g.strokeStyle = style; g.lineWidth = lw;
      g.beginPath();
      g.moveTo(0, nodes[0].y + off);
      for (let i = 0; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y + off);
      g.lineTo(w, nodes[N - 1].y + off);
      g.stroke();
    };
    g.lineCap = 'round'; g.lineJoin = 'round';
    // the photon ring follows the world: ember normally, aurora in the gate
    const rgR = Math.round(lerp(255, 90, jw)), rgG = Math.round(lerp(140, 230, jw)), rgB = Math.round(lerp(70, 200, jw));
    for (let k = 4; k >= 1; k--) {
      ridge(-k * 7 * ms, `rgba(${rgR},${rgG},${rgB},${glow * 0.28 * (1 - k / 4.6)})`, 10 * ms);
    }
    // the rim below the line — SMOOTH. One 1x256 offscreen gradient, blitted
    // per 4px column so the falloff starts exactly at the curve at every x:
    // an actual gradient (no layered strokes rippling against the ribbons).
    // Deeper as the rope rises.
    if (!s.gcv) {
      s.gcv = document.createElement('canvas');
      s.gcv.width = 1; s.gcv.height = 256;
    }
    const gg2 = s.gcv.getContext('2d');
    gg2.clearRect(0, 0, 1, 256);
    // brightness floor sized for FABRIC: the mesh eats ~half the light, so
    // the tail must start hotter and hold longer than a screen needs.
    // recharging = the rim burns ember-dim; the jam window = it burns FULL;
    // scars = it runs deeper, forever; the idle breath warms it faintly
    const rimA = (0.38 + s.tension * 0.18 + s.chg * 0.3 + s.jam * 0.14 + s.breath * 0.05)
      * (1 - s.cool * 0.45);
    // the rim commits to the drop with everything else: ember → deep teal
    const vg = gg2.createLinearGradient(0, 0, 0, 256);
    vg.addColorStop(0, `rgba(${Math.round(lerp(255, 45, jw))},${Math.round(lerp(64, 225, jw))},${Math.round(lerp(24, 195, jw))},${rimA})`);
    vg.addColorStop(0.4, `rgba(${Math.round(lerp(205, 20, jw))},${Math.round(lerp(30, 145, jw))},${Math.round(lerp(16, 160, jw))},${rimA * 0.55})`);
    vg.addColorStop(1, `rgba(${Math.round(lerp(120, 8, jw))},${Math.round(lerp(10, 55, jw))},${Math.round(lerp(12, 85, jw))},0)`);
    gg2.fillStyle = vg; gg2.fillRect(0, 0, 1, 256);
    // a raised line makes a BRIGHT SPACE: the glow beneath deepens with the
    // arms so a high wall stands over a tall lit chamber, not a thin strip
    const depth = h * (0.12 + s.tension * 0.28 + ((s.uL + s.uR) / 2) * 0.34)
      * (1 + Math.min(0.5, s.scar * 0.12));
    const ax2 = nodes[0].x, bx2 = nodes[N - 1].x;
    const yAt = px => {
      const u = clamp((px - ax2) / (bx2 - ax2)) * (N - 1);
      const i0 = Math.floor(u), fr = u - i0;
      return lerp(nodes[i0].y, nodes[Math.min(N - 1, i0 + 1)].y, fr);
    };
    const colW = (typeof window !== 'undefined' && window.IS_MOBILE) ? 8 : 4;
    for (let x = 0; x < w; x += colW) {
      g.drawImage(s.gcv, 0, 0, 1, 256, x, yAt(x + colW / 2), colW, depth);
    }

    // ---- the ribbons FALL IN: displaced down with age, redshifting -----
    const echoA = clamp(s.wave / 1.2);
    if (echoA > 0.03 && s.hist.length > 1) {
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let e2 = 0; e2 < s.hist.length; e2++) {
        const snap = s.hist[e2];
        const age = (e2 + 1) / s.hist.length;          // 0 old → 1 newest
        const a = Math.pow(age, 1.7) * 0.20 * echoA;
        if (a < 0.004) continue;
        const fall = (1 - age) * (1 - age) * h * 0.13;  // older = deeper in
        const r = 90 + age * 165, gg = 25 + age * 115, bb = 20 + age * 160;
        g.strokeStyle = `rgba(${r | 0},${gg | 0},${bb | 0},${a})`;
        g.lineWidth = (1.4 + age * 1.8) * ms;
        g.beginPath();
        g.moveTo(snap[0], snap[1] + fall);
        for (let i = 1; i < N; i++) g.lineTo(snap[i * 2], snap[i * 2 + 1] + fall);
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    }

    // ---- THE SWALLOW: the void climbs over everything but the line.
    // While CHARGING it already creeps — the telegraph the room can see.
    const creep = Math.max(s.rise, s.chg * 0.16);
    if (creep > 0.001) {
      const riseY = h * (1.02 - creep * 1.12);
      const edge = g.createLinearGradient(0, riseY - h * 0.06, 0, riseY);
      edge.addColorStop(0, 'rgba(255,40,15,0)');
      edge.addColorStop(1, `rgba(255,60,20,${0.2 + 0.3 * creep})`);
      g.fillStyle = edge; g.fillRect(0, riseY - h * 0.06, w, h * 0.06);
      g.fillStyle = '#000'; g.fillRect(0, riseY, w, h - riseY);
    }

    // ---- the horizon continues past your grip: dim, uncontrolled, so the
    // anchors read as where YOUR stretch begins instead of a dead gap
    g.lineWidth = 2.4 * ms;
    g.strokeStyle = 'rgba(255,130,80,0.4)';
    g.beginPath(); g.moveTo(0, nodes[0].y); g.lineTo(nodes[0].x, nodes[0].y); g.stroke();
    g.strokeStyle = 'rgba(190,150,255,0.4)';
    g.beginPath(); g.moveTo(nodes[N - 1].x, nodes[N - 1].y); g.lineTo(w, nodes[N - 1].y); g.stroke();

    // ---- the line itself: crisp, burning, last ------------------------
    const cg = g.createLinearGradient(ax, 0, bx, 0);
    // the line itself changes worlds in the gate: warm orange→pink→violet
    // becomes mint→cyan→violet, keeping the left/right identity readable
    cg.addColorStop(0, `rgb(${Math.round(lerp(255, 122, jw))},${Math.round(lerp(178, 255, jw))},${Math.round(lerp(102, 196, jw))})`);
    cg.addColorStop(0.5, `rgb(${Math.round(lerp(255, 125, jw))},${Math.round(lerp(143, 232, jw))},${Math.round(lerp(168, 255, jw))})`);
    cg.addColorStop(1, '#b48aff');
    g.strokeStyle = cg;
    g.lineWidth = (3.6 + s.tension * 1.4 + gpulse * 1.2) * ms;
    g.shadowColor = `rgb(${Math.round(lerp(255, 94, jw))},${Math.round(lerp(141, 232, jw))},${Math.round(lerp(94, 205, jw))})`;
    g.shadowBlur = (7 + s.tension * 10 + s.wave * 2 + s.chg * 14 + s.jam * 6 + bp * 8 + s.breath * 4) * ms;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.stroke();
    g.shadowBlur = 0;

    // anchors: two star-points, no masts out here
    [[nodes[0], '#ffb266'], [nodes[N - 1], '#b48aff']].forEach(([nd, col]) => {
      g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 16 * ms;
      g.beginPath(); g.arc(nd.x, nd.y, 4.5 * ms, 0, TAU); g.fill();
      g.shadowBlur = 0;
    });

    g.fillStyle = '#040307'; g.fillRect(0, h - 24, 760, 24);
    g.fillStyle = 'rgba(255,150,120,0.85)'; g.font = `${Math.round(10 * Math.min(ms, 1.4))}px ui-monospace,monospace`;
    g.fillText('TENSION ' + (s.tension * 100).toFixed(0) + '%  ·  ' + (H.label || '') +
      '  ·  STRINGS ' + s.vL + '+' + s.vR + '/6  ·  GATE ' + (s.gate * 100).toFixed(0) + '%' +
      (s.rise > 0.001 ? '  ·  SWALLOWED' : s.jamT > 0 ? '  ·  THE OTHER SIDE ' + Math.ceil(s.jamT) + 's'
        : s.chg > 0.01 ? '  ·  HORIZON ' + (s.chg * 100).toFixed(0) + '%'
          : s.cool > 0.02 ? '  ·  RECHARGING ' + Math.ceil(s.cool * 25) + 's' : '') +
      (s.scar > 0 ? '  ·  SWALLOWS ' + s.scar : '') +
      (s.pres < 0.3 ? '  ·  RESTING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    // hum split in two so the upper octave can die at idle and veil while
    // recharging (idle highs dead; the fire audibly returns)
    const hum = v.osc('sine', H.rootFreq(-2)), hg = v.g(0.012);
    const hum2 = v.osc('sine', H.rootFreq(-1)), hg2 = v.g(0.008);
    hum.connect(hg); hg.connect(v.group);
    hum2.connect(hg2); hg2.connect(v.group);
    const wn = v.noise(), wf = v.filter('bandpass', 400, 1.1), wg = v.g(0);
    wn.connect(wf); wf.connect(wg); wg.connect(v.group);
    // the swallow riser — its own noise, rising and narrowing
    const rn = v.noise(), rf = v.filter('bandpass', 300, 3), rg = v.g(0);
    rn.connect(rf); rf.connect(rg); rg.connect(v.group);

    // SIX CHAIRS AT REAL VOLUME (the V3 mix bug: 0.0105/voice sat under the
    // 0.034 hum — the crescendo was inaudible). Chairs are the lead voice of
    // this scene: ~2x the bed guideline, hum trimmed beneath them, and each
    // chair gets its own slow entrance envelope so joining is a swell you
    // hear, not a crossfade you miss.
    const bedLo = A.padVoices(v, 3, { type: 'triangle', gain: 0.0001, cutoff: 260, q: 0.7 });
    const bedHi = A.padVoices(v, 3, { type: 'triangle', gain: 0.0001, cutoff: 520, q: 0.7 });
    const subLo = A.padVoices(v, 2, { type: 'triangle', gain: 0.0001, cutoff: 160, q: 0.6 });
    const place = glide => {
      bedLo.forEach((b, i) => b.set(H.chordTone(i, -1), glide));
      bedHi.forEach((b, i) => b.set(H.chordTone(i + 2, 0), glide));
      subLo.forEach((b, i) => b.set(H.chordTone(i * 2, -2), glide));
    };
    place(0.05);
    H.onChord(() => {
      place(0.18);
      // the chord change is a MOMENT: a gentle low-to-high roll, quiet
      // enough that the wall stays on top
      const s2 = P.state;
      if (s2.tension > 0.3 && s2.pres > 0.4) {
        const g2 = 0.3 + s2.pres * 0.7;
        for (let i = 0; i < 3; i++) {
          A.tone(H.chordTone(i * 2, -1), {
            at: A.t() + 0.05 + i * 0.07, vol: 0.028 * g2, dur: 1.6, attack: 0.12,
            type: 'triangle', pan: -0.25 + i * 0.25, rev: 0.6, role: 'pad'
          });
        }
      }
    });
    v.fadeIn(1, 0.8);

    const TH = [0.18, 0.45, 0.72];
    const env = [0, 0, 0, 0, 0, 0];      // entrance envelope per chair (L0..2, R0..2)
    const was = [false, false, false, false, false, false];
    let nextT = T.next(0.25), lastNow = A.t(), boomed = false;
    return {
      tick(inp) {
        const s = P.state, now = A.t();
        const adt = Math.min(0.1, Math.max(0.001, now - lastNow)); lastNow = now;
        const gate = 0.3 + s.pres * 0.7;
        const duck = 1 - s.rise * 0.9;    // the swallow empties the band
        // ...but the window ignores the duck: once the boom lands the pocket
        // and the low floor drive straight through the void's recession
        const duckM = Math.max(duck, s.jam * 0.85);
        // THE RE-BLOOM ROLLS low-to-high: on the way back from totality the
        // subs return first, then the low chairs, then the high — the sky
        // being given back is a gesture, not a fader move
        const ret = s.act > 0.5 ? 1 - s.rise : 1;
        const retSub = s.act > 0.5 ? clamp(ret * 3) : 1;
        const retLo = s.act > 0.5 ? clamp(ret * 2.4 - 0.4) : 1;
        const retHi = s.act > 0.5 ? clamp(ret * 2 - 0.8) : 1;
        // the aftermath, audible: recharge veils, scars weigh — forever
        const veil = 1 - s.cool * 0.35;                       // filter ceilings while cooling
        const scarDark = 1 - Math.min(0.3, s.scar * 0.06);    // permanently darker
        const scarHeavy = 1 + Math.min(0.4, s.scar * 0.08);   // permanently heavier
        const ceil2 = veil * scarDark;

        // idle floor: undulating (incommensurate LFOs — never dead, never
        // constant), swelling with each breath; upper hum dies at idle and
        // stays hollowed while the horizon recharges
        const idleAmt = 1 - s.pres;
        const und = 1 + 0.3 * Math.sin(now * 0.13) + 0.2 * Math.sin(now * 0.071);
        A.set(hg.gain, ((0.005 + s.tension * 0.02) * gate + idleAmt * (0.0075 * und + s.breath * 0.02)) * duckM * scarHeavy, 0.3);
        A.set(hg2.gain, (0.004 + s.tension * 0.016) * gate * s.pres * duckM * (1 - s.cool * 0.7), 0.3);
        // the wind itself breathes at idle — weather is the lure's body
        A.set(wg.gain, (clamp(s.wave / 6) * 0.05 * gate + idleAmt * (0.003 + s.breath * 0.009)) * duck, 0.15);
        A.set(wf.frequency, 260 + s.tension * 700 + s.wave * 120 + s.breath * idleAmt * 260, 0.15);
        // the riser: you HEAR the horizon charging
        A.set(rg.gain, s.chg * s.chg * 0.055 * gate, 0.15);
        A.set(rf.frequency, 300 + s.chg * 3600, 0.2);
        // the lure's rare payoff: one deep toll into the dark
        if (s.tollFire) {
          s.tollFire = false;
          A.tone(H.rootFreq(-2), { at: now + 0.02, vol: 0.062, dur: 3.5, attack: 0.25, type: 'sine', rev: 0.7, role: 'bells' });
        }

        // gate capped at 0.6: the throb must never gut the wall — at V4's
        // 0.85 depth the bed spent most of each cycle at 15% exactly when
        // it should be enormous. During the jam window the gate IS the
        // pulse: it gets a floor so the throb holds even at mid-height.
        const depth = Math.max(clamp((s.tension - 0.4) / 0.45) * 0.6, s.jam * 0.35) * Math.max(s.pres, s.jam * 0.85);
        const rate = s.tension > 0.8 ? 4 : 2;
        const ph = (T.beats() * rate) % 1;
        const lfo = 0.5 + 0.5 * Math.cos(ph * TAU);
        const gv = 1 - depth * (1 - lfo * lfo);
        s.gate = depth * (1 - gv);

        // ---- the crescendo: chairs enter as EVENTS -----------------------
        let vL = 0, vR = 0;
        for (let j = 0; j < 6; j++) {
          const side = j < 3 ? s.uL : s.uR;
          const th = TH[j % 3];
          const want = clamp((side - th) / 0.1);
          // slow swell in (~0.7s), faster out — the entrance is audible
          env[j] += (want - env[j]) * Math.min(1, adt * (want > env[j] ? 1.6 : 3));
          if (want > 0.5) { if (j < 3) vL++; else vR++; }
          // announce the chair the moment it commits
          if (want > 0.5 && !was[j]) {
            was[j] = true;
            const f = j < 3 ? H.chordTone(j, -1) : H.chordTone((j % 3) + 2, 0);
            A.tone(f, { at: T.next(0.5), vol: 0.045 * gate * duck, dur: 1.8, attack: 0.1, type: 'triangle', pan: j < 3 ? -0.4 : 0.4, rev: 0.55, role: 'pad' });
          } else if (want < 0.3 && was[j]) was[j] = false;
          const body = 0.6 + s.tension * 0.4;
          const retK = j < 3 ? retLo : retHi;
          // the TOP chair carries the melody — it sits above the wall so
          // the descending line is heard, not buried
          const mel = j === 5 ? 1.45 : 1;
          const lvl = (j < 3 ? 0.045 : 0.03) * env[j] * body * gate * gv * duckM * retK * mel
            + (j < 3 ? idleAmt * s.breath * 0.007 : 0);   // the lure whispers a low chair
          (j < 3 ? bedLo[j] : bedHi[j % 3]).level(lvl, 0.06);
        }
        s.vL = vL; s.vR = vR;
        // filter opens with the arms — the biggest "it is swelling" cue;
        // veiled while recharging, permanently darker with every scar
        bedLo.forEach(b => b.bright((200 + s.uL * 900 + s.tension * 500) * ceil2, 0.3));
        bedHi.forEach(b => b.bright((360 + s.uR * 1400 + s.tension * 600) * ceil2, 0.3));
        // the organ's 16-foot stop slides in when it is really tight
        const subLvl = clamp((s.tension - 0.7) / 0.3) * 0.035 * gate * gv * duckM
          * retSub * (1 - s.cool * 0.5) * scarHeavy;
        subLo.forEach(b => b.level(subLvl, 0.3));

        // ---- the grid: pulse and booms — and THE OTHER SIDE's pocket ----
        const horizon2 = now + 0.15;
        let guard = 0;
        while (nextT < horizon2 && guard++ < 24) {
          const st = ((Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;
          if ((s.tension > 0.5 || s.jam > 0.15) && st % 2 === 0 && (duck > 0.4 || s.jam > 0.15)) {
            const acc = st === 0 ? 1.35 : st % 4 === 0 ? 1.1 : 1;
            A.bassNote(H.chordTone(0, -1), {
              at: nextT, vol: (0.018 + Math.max(0, s.tension - 0.5) * 0.05 + s.jam * 0.02) * acc * gate * duckM, dur: 0.24
            });
          }
          if (s.jam > 0.15) {
            // the window's pocket runs DOUBLE-TIME: each 16th of the 64 BPM
            // bar is an 8th of a 128-feel bar. Four-on-the-floor on the even
            // steps, crack on the 128-backbeat, hats ranked by tension —
            // driving, dry, Jon Hopkins dark
            // intensity rides the LATCHED high-water mark, not the moment's
            // tension — the pocket holds while the player works the wall
            const heat = Math.max(s.tension, s.jamHeat);
            const jg = s.jam * Math.max(gate, s.jam * 0.9);
            if (st % 2 === 0) {
              const acc2 = st % 8 === 0 ? 1.3 : 1;
              A.kick(nextT, (0.12 + heat * 0.08) * acc2 * jg);
            }
            if (st === 2 || st === 6 || st === 10 || st === 14) {
              A.hit({ at: nextT, vol: 0.06 * jg, dur: 0.1, freq: 900, q: 1.4 });
            }
            if (heat > 0.3 && st % 4 === 3) {
              A.hit({ at: nextT, vol: 0.026 * jg, dur: 0.05, freq: 6000, q: 1 });
            }
            if (heat > 0.6 && st % 4 === 1) {
              A.hit({ at: nextT, vol: 0.016 * jg, dur: 0.04, freq: 6000, q: 1 });
            }
          } else if (duck > 0.4) {
            if (s.tension > 0.5 && st === 0) {
              A.kick(nextT, (0.13 + (s.tension - 0.5) * 0.25) * gate * duck);
              A.hit({ at: nextT, vol: 0.04 * gate * duck, dur: 0.3, freq: 90, q: 0.8 });
            }
            if (s.tension > 0.75 && st === 8) A.kick(nextT, 0.09 * gate * duck);
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        // ---- totality: one enormous boom out of the silence -------------
        if (s.rise > 0.9 && !boomed) {
          boomed = true;
          A.kick(now, 0.5);
          A.hit({ at: now, vol: 0.12, dur: 0.5, freq: 60, q: 0.7 });
          A.tone(H.rootFreq(-2), { at: now, vol: 0.16, dur: 5, attack: 0.02, type: 'sine', rev: 0.5, role: 'sfx' });
        }
        if (s.rise < 0.1) boomed = false;

        // ---- the flick: one rolled run per gesture. The gesture WRITES the
        // run: throw upward = the run rises, downward = it falls, and the
        // sharpness of the flick picks the register — a lob is a low dark
        // run, a snap sits nearly an octave brighter. On the other side the
        // runs ride a touch higher — the window is the bright place.
        let ev, k = 0;
        while ((ev = s.strumQ.shift()) && k < 2) {
          k++;
          // FIXED register — the sharpness-picked octave was the "random"
          // feel; now the same gesture always answers from the same place,
          // and the runs sit UNDER the wall and its melody
          const base = Math.floor(s.tension * 3);
          const at0 = Math.max(now + 0.02, T.next(0.25));
          const vol0 = clamp(0.038 + ev.sp * 0.03, 0.042, 0.085) * gate * duckM;
          for (let i = 0; i < 5; i++) {
            const idx = ev.up ? base + i * 2 : base + 8 - i * 2;
            A.pluck2(H.chordTone(idx, -1), {
              at: at0 + i * 0.085, vol: vol0 * (1 - i * 0.09), dur: 2.4,
              pan: ev.side * 0.7 - ev.side * 0.35 * i,   // travels in from the flicked side
              rev: 0.55, del: 0.2, role: 'lead'
            });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', depth);
          MOut.expr('lead', clamp(s.wave / 4));
          MOut.expr('bass', clamp((s.tension - 0.5) * 2));
          MOut.expr('sfx', Math.max(s.chg, s.rise));
          MOut.expr('perc', s.jam * (0.3 + 0.7 * s.tension));
        }
      },
      stop() { v.kill(); }
    };
  }
});
