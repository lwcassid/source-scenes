/* ---------- SRC-13.7 · EVENT HORIZON V7 ---------- */
/* Lance's V6 verdicts: V5's sky-brightening reverted (never asked for it);
   the under-line gradient is now MATHEMATICALLY smooth — one offscreen
   gradient strip blitted per 4px column, falloff starting exactly at the
   curve, no layer stripes to fight the ribbons; and the horizon line now
   continues past the anchors to the frame edges, dim and uncontrolled, so
   the grip points read as where YOUR stretch begins instead of a gap. */
reg({
  id: 'SRC-13.7', family: 'SRC-13', ver: 7, title: 'Event Horizon', tech: 'VERLET ROPE / ACCRETION',
  music: {
    bpm: 64, root: 45, mode: 'aeolian', chordBars: 2,
    chords: [
      [0, 12, 19, 24, 26],   // Am9 (open — no third, all weight)
      [0, 8, 15, 19, 24],    // F/A — the bVI lift
      [0, 10, 14, 17, 24],   // G/A — bVII
      [0, 10, 15, 19, 27]    // Am7 — home, C on top
    ],
    chordNames: ['Am9', 'F/A', 'G/A', 'Am7']
  },
  fx: { bloom: 0.6 },
  tags: ['THE LAST LINE OF LIGHT', 'AUDIBLE CRESCENDO', 'REDSHIFT ECHO', 'STARFALL', 'THE SWALLOW'],
  desc: 'The cable is the event horizon: one burning line between the sky and the void. Stars drift down, accelerate, and are eaten; nothing below the line ever comes back. Raise your arms and an organ-dark string section assembles CHAIR BY CHAIR — each entrance announced, the whole wall swelling and brightening under your hands, throbbing on the grid as it tightens. Throw a wave and its ghosts fall into the hole, stretching and redshifting as they go. Hold both arms high and the void starts to RISE: six seconds of warning, then it swallows the room — everything goes black except the line, one enormous boom, and the sky is given back.',
  interact: 'L = left arm of the conductor, R = right. Height is the crescendo: every chair you add is announced and audibly thickens the wall; the filter opens as you rise, the pulse and the booms arrive as the line tightens, the gate throbs deeper. A fast flick = one dark run in the direction you threw it, and its ribbons fall into the void. HOLD BOTH ARMS HIGH: the horizon charges — keep holding and it swallows everything but the line. That is the button you should be scared of.',
  sound: 'The crescendo is the instrument, and in V5 the WALL outweighs every transient: chairs roughly doubled again, the pulse, chair-announces, booms and runs all halved beneath it, and the rhythmic gate capped at 60% depth so the throb never guts the sustain. Each chair crossing its height threshold swells in over ~0.7s AND is announced by a low rolled tone on its own pitch, so you HEAR the orchestra assemble. Filter opens with the arms, sub-octave organ stop slides in past 70% tension, everything runs through the tempo gate (deepens with tension, 8ths then 16ths; depth on pad CC74 for the string plugin\'s gate in Live). 8th-note root pulse and taiko booms earned past half tension. A flick = one rolled five-note run, low ladder, 0.8s per-side cooldown; the wave itself is a whoosh. THE SWALLOW: hold both arms > 85% — a riser charges for ~6s (you hear it coming), the band ducks to nothing as the void climbs, one enormous sub boom at totality, then the section re-blooms. Ableton: runs ch1, pulse ch3, pad ch2/6, booms ch10, riser sfx ch11.',

  init(P) {
    const N = 40;
    const nodes = [];
    for (let i = 0; i < N; i++) nodes.push({ x: 0, y: 0, ox: 0, oy: 0 });
    const NS = Math.round(70 * Math.max(0.5, areaScale(P)));
    const stars = [];
    for (let i = 0; i < NS; i++) {
      stars.push({ x: P.rand(), y: P.rand() * 0.75, vy: 0, px: 0, py: 0 });
    }
    P.state = {
      N, nodes, seg: 0, tension: 0, wave: 0, pres: 0,
      uL: 0, uR: 0, vL: 0, vR: 0, gate: 0, runs: 0,
      prevAy: 0, prevBy: 0, cdL: 0, cdR: 0, strumQ: [],
      hist: [], histAcc: 0, idleKick: 0, born: 0, init: false,
      stars, chg: 0, act: 0, rise: 0, cdT: 0
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, { N, nodes } = s, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const idL = 0.16 + 0.09 * Math.sin(t * 0.21), idR = 0.16 + 0.09 * Math.sin(t * 0.26 + 2.1);
    s.uL = clamp(inp.L) * s.pres + idL * (1 - s.pres);
    s.uR = clamp(inp.R) * s.pres + idR * (1 - s.pres);
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
    if (s.pres < 0.2 && t - s.idleKick > 9) {
      s.idleKick = t + P.rand() * 5;
      const ni = 6 + Math.floor(P.rand() * (N - 12));
      for (let i = -2; i <= 2; i++) nodes[ni + i].oy -= (3 - Math.abs(i)) * 4;
    }

    const settled = t - s.born > 3;
    if (settled && s.pres > 0.3 && dt > 0) {
      const vA = Math.abs(ay - s.prevAy) / (h * dt), vB = Math.abs(by - s.prevBy) / (h * dt);
      if (vA > 0.9 && t > s.cdL) { s.cdL = t + 0.8; s.runs++; s.strumQ.push({ dir: 1, sp: vA }); }
      if (vB > 0.9 && t > s.cdR) { s.cdR = t + 0.8; s.runs++; s.strumQ.push({ dir: -1, sp: vB }); }
      if (s.strumQ.length > 3) s.strumQ.length = 3;
    }
    s.prevAy = ay; s.prevBy = by;

    s.seg = (bx - ax) * (1.16 - 0.22 * ((s.uL + s.uR) / 2)) / (N - 1);
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
      for (let it = 0; it < 22; it++) {
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
    // hold both arms high: 6s of charging you can hear and see, then the
    // void takes the room. Rare by construction (25s cooldown + the hold).
    if (s.act === 0 && settled && s.pres > 0.5 && s.uL > 0.85 && s.uR > 0.85 && t > s.cdT) {
      s.chg = Math.min(1, s.chg + dt / 6);
      if (s.chg >= 1) { s.act = 0.0001; s.chg = 0; }
    } else if (s.act === 0) {
      s.chg = Math.max(0, s.chg - dt * 0.5);
    }
    if (s.act > 0) {
      s.act = Math.min(1, s.act + dt / 3.2);
      s.rise = s.act < 0.5 ? s.act * 2 : (1 - s.act) * 2;   // up, hold nothing, back
      if (s.act >= 1) { s.act = 0; s.rise = 0; s.cdT = t + 25; }
    }

    // ---- starfall: everything above the line is falling toward it ------
    const cableYat = x => {
      const i = clamp((x * w - ax) / (bx - ax)) * (N - 1);
      const i0 = Math.floor(i), fr = i - i0;
      return lerp(nodes[i0].y, nodes[Math.min(N - 1, i0 + 1)].y, fr);
    };
    const hunger = 1 + s.chg * 2 + s.rise * 6;
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
    g.fillStyle = 'rgba(4,3,7,0.45)'; g.fillRect(0, 0, w, h);

    const ax = nodes[0].x, bx = nodes[N - 1].x;
    let cavg = 0, topY = h;
    for (let i = 0; i < N; i++) { cavg += nodes[i].y; if (nodes[i].y < topY) topY = nodes[i].y; }
    cavg /= N;

    // ---- the sky: stars falling toward the line, streaking as they go --
    for (const st of s.stars) {
      const sp = Math.min(1, st.vy * 6);
      const a = 0.25 + sp * 0.6;
      g.strokeStyle = `rgba(${200 + sp * 55},${205 - sp * 60},${255 - sp * 120},${a})`;
      g.lineWidth = (1 + sp * 1.4) * ms;
      g.beginPath();
      g.moveTo(st.px * w, st.py * h);
      g.lineTo(st.x * w, st.y * h + 1.5 * ms);
      g.stroke();
    }

    // ---- the sky: soft ambient light escaping upward (full-frame, no
    // hard shapes — the glow that FOLLOWS the line comes next) -----------
    const gpulse = s.gate;
    // sky back to the V4 treatment — the space stays dark, the light lives
    // at the horizon (V5's tension-scaled sky brightening: reverted)
    const glow = (0.10 + s.tension * 0.18 + gpulse * 0.10 + s.chg * 0.25) * (0.4 + s.pres * 0.6);
    const skyBot = Math.min(h, topY + h * 0.15);
    const sky = g.createLinearGradient(0, topY - h * 0.38, 0, skyBot);
    sky.addColorStop(0, 'rgba(255,80,90,0)');
    sky.addColorStop(0.72, `rgba(255,110,55,${glow * 0.5})`);
    sky.addColorStop(1, 'rgba(255,110,55,0)');
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
    for (let k = 4; k >= 1; k--) {
      ridge(-k * 7 * ms, `rgba(255,140,70,${glow * 0.28 * (1 - k / 4.6)})`, 10 * ms);
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
    const rimA = 0.30 + s.tension * 0.16 + s.chg * 0.3;
    const vg = gg2.createLinearGradient(0, 0, 0, 256);
    vg.addColorStop(0, `rgba(255,64,24,${rimA})`);
    vg.addColorStop(0.35, `rgba(200,28,16,${rimA * 0.5})`);
    vg.addColorStop(1, 'rgba(120,10,12,0)');
    gg2.fillStyle = vg; gg2.fillRect(0, 0, 1, 256);
    const depth = h * (0.12 + s.tension * 0.28);
    const ax2 = nodes[0].x, bx2 = nodes[N - 1].x;
    const yAt = px => {
      const u = clamp((px - ax2) / (bx2 - ax2)) * (N - 1);
      const i0 = Math.floor(u), fr = u - i0;
      return lerp(nodes[i0].y, nodes[Math.min(N - 1, i0 + 1)].y, fr);
    };
    for (let x = 0; x < w; x += 4) {
      g.drawImage(s.gcv, 0, 0, 1, 256, x, yAt(x + 2), 4, depth);
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

    // ---- THE SWALLOW: the void climbs over everything but the line -----
    if (s.rise > 0.001) {
      const riseY = h * (1.02 - s.rise * 1.12);
      const edge = g.createLinearGradient(0, riseY - h * 0.06, 0, riseY);
      edge.addColorStop(0, 'rgba(255,40,15,0)');
      edge.addColorStop(1, `rgba(255,60,20,${0.35 * s.rise})`);
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
    cg.addColorStop(0, '#ffb266'); cg.addColorStop(0.5, '#ff8fa8'); cg.addColorStop(1, '#b48aff');
    g.strokeStyle = cg;
    g.lineWidth = (3.6 + s.tension * 1.4 + gpulse * 1.2) * ms;
    g.shadowColor = '#ff8d5e'; g.shadowBlur = (7 + s.tension * 10 + s.wave * 2 + s.chg * 14) * ms;
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

    g.fillStyle = '#040307'; g.fillRect(0, h - 24, 400, 24);
    g.fillStyle = 'rgba(255,150,120,0.85)'; g.font = `${Math.round(10 * Math.min(ms, 1.4))}px ui-monospace,monospace`;
    g.fillText('TENSION ' + (s.tension * 100).toFixed(0) + '%  ·  ' + (H.label || '') +
      '  ·  STRINGS ' + s.vL + '+' + s.vR + '/6  ·  GATE ' + (s.gate * 100).toFixed(0) + '%' +
      (s.rise > 0.001 ? '  ·  SWALLOWED' : s.chg > 0.01 ? '  ·  HORIZON ' + (s.chg * 100).toFixed(0) + '%' : '') +
      (s.pres < 0.3 ? '  ·  RESTING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const hum = v.osc('sine', H.rootFreq(-2)), hum2 = v.osc('sine', H.rootFreq(-1));
    const hg = v.g(0.012);
    hum.connect(hg); hum2.connect(hg); hg.connect(v.group);
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

        A.set(hg.gain, (0.005 + s.tension * 0.02) * gate * duck, 0.3);
        A.set(wg.gain, clamp(s.wave / 6) * 0.05 * gate * duck, 0.08);
        A.set(wf.frequency, 260 + s.tension * 700 + s.wave * 120, 0.15);
        // the riser: you HEAR the horizon charging
        A.set(rg.gain, s.chg * s.chg * 0.055 * gate, 0.15);
        A.set(rf.frequency, 300 + s.chg * 3600, 0.2);

        // gate capped at 0.6: the throb must never gut the wall — at V4's
        // 0.85 depth the bed spent most of each cycle at 15% exactly when
        // it should be enormous
        const depth = clamp((s.tension - 0.4) / 0.45) * 0.6 * s.pres;
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
          const lvl = (j < 3 ? 0.045 : 0.03) * env[j] * body * gate * gv * duck;
          (j < 3 ? bedLo[j] : bedHi[j % 3]).level(lvl, 0.06);
        }
        s.vL = vL; s.vR = vR;
        // filter opens with the arms — the biggest "it is swelling" cue
        bedLo.forEach(b => b.bright(200 + s.uL * 900 + s.tension * 500, 0.3));
        bedHi.forEach(b => b.bright(360 + s.uR * 1400 + s.tension * 600, 0.3));
        // the organ's 16-foot stop slides in when it is really tight
        const subLvl = clamp((s.tension - 0.7) / 0.3) * 0.035 * gate * gv * duck;
        subLo.forEach(b => b.level(subLvl, 0.3));

        // ---- the grid: pulse and booms ----------------------------------
        const horizon2 = now + 0.15;
        let guard = 0;
        while (nextT < horizon2 && guard++ < 24) {
          const st = ((Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;
          if (s.tension > 0.5 && st % 2 === 0 && duck > 0.4) {
            const acc = st === 0 ? 1.35 : st % 4 === 0 ? 1.1 : 1;
            A.bassNote(H.chordTone(0, -1), {
              at: nextT, vol: (0.018 + (s.tension - 0.5) * 0.05) * acc * gate * duck, dur: 0.24
            });
          }
          if (s.tension > 0.5 && st === 0 && duck > 0.4) {
            A.kick(nextT, (0.13 + (s.tension - 0.5) * 0.25) * gate * duck);
            A.hit({ at: nextT, vol: 0.04 * gate * duck, dur: 0.3, freq: 90, q: 0.8 });
          }
          if (s.tension > 0.75 && st === 8 && duck > 0.4) A.kick(nextT, 0.09 * gate * duck);
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

        // ---- the flick: one rolled run per gesture ----------------------
        let ev, k = 0;
        while ((ev = s.strumQ.shift()) && k < 2) {
          k++;
          const base = Math.floor(s.tension * 4);
          const at0 = Math.max(now + 0.02, T.next(0.25));
          const vol0 = clamp(0.055 + ev.sp * 0.05, 0.06, 0.14) * gate * duck;
          for (let i = 0; i < 5; i++) {
            const idx = ev.dir > 0 ? base + i * 2 : base + 8 - i * 2;
            A.pluck2(H.chordTone(idx, -1), {
              at: at0 + i * 0.085, vol: vol0 * (1 - i * 0.09), dur: 2.4,
              pan: (ev.dir > 0 ? -0.7 : 0.7) + i * (ev.dir > 0 ? 0.35 : -0.35),
              rev: 0.55, del: 0.2, role: 'lead'
            });
          }
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', depth);
          MOut.expr('lead', clamp(s.wave / 4));
          MOut.expr('bass', clamp((s.tension - 0.5) * 2));
          MOut.expr('sfx', Math.max(s.chg, s.rise));
        }
      },
      stop() { v.kill(); }
    };
  }
});
