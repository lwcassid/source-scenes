/* ---------- SRC-13.3 · CABLE STRUM V3 — the conductor, dark ---------- */
/* Lance's V2 verdicts: the per-bead rake machine-gunned ("5000 notes") — one
   gesture must be ONE statement; the conductor swell is the core, gate it
   rhythmically; echoes should be the visual feature (main line crisp);
   darker, dramatic, Zimmer. */
reg({
  id: 'SRC-13.3', family: 'SRC-13', ver: 3, title: 'Cable Strum V3', tech: 'VERLET ROPE / GATED SECTION',
  music: {
    bpm: 68, root: 45, mode: 'aeolian', chordBars: 2,
    chords: [
      [0, 12, 19, 24, 26],   // Am9 (open — no third, all weight)
      [0, 8, 15, 19, 24],    // F/A — the bVI lift
      [0, 10, 14, 17, 24],   // G/A — bVII
      [0, 10, 15, 19, 27]    // Am7 — home, C on top
    ],
    chordNames: ['Am9', 'F/A', 'G/A', 'Am7']
  },
  fx: { bloom: 0.55 },
  tags: ['CONDUCTOR', 'GATED STRINGS', 'RIBBON ECHO', 'EPIC MINOR', 'ONE GESTURE ONE STATEMENT'],
  desc: 'The cable as a baton. Raise your arms and a dark string section assembles voice by voice over a pulsing root — and as the tension climbs the whole wall of sound starts to GATE, throbbing on the grid like a sequenced orchestra, taiko booms landing on the bar. Jerk a hand and the wave you launch is one rolled run across the beads, not a hail of notes; the wire itself just whooshes. Behind the crisp cable, every shape it has recently held hangs in the air as fading ribbons.',
  interact: 'L = left arm of the conductor, R = right. Height builds the orchestra: low strings enter on the left arm, high strings on the right, the pulse and the booms arrive as the cable tightens, and the rhythmic gate deepens with tension. A fast flick throws a wave — one dark run in the direction you threw it, whoosh from the wire, ribbons in the air. Asymmetry tilts the catenary and the voicing.',
  sound: 'Zimmer logic: an epic-minor pedal (Am9 · F/A · G/A · Am7, i–bVI–bVII–i at 68), six triangle string chairs joining one at a time as the arms rise, a sub root and AC hum underneath. Past half tension an 8th-note root pulse starts driving; the string bed runs through a tempo-synced GATE whose depth grows with tension (8ths, then 16ths near full) — CC74 on the pad channel streams the gate depth, so map it to the gate/filter amount of the string plugin in Live and the rack breathes with the picture. Bar-downbeat taiko booms past half tension, a second hit past three-quarters, one big arrival boom when the sixth chair sits down. A flick = ONE rolled five-note run on the low chord ladder (ascending from the left hand, descending from the right, 0.8s cooldown per side); the wave itself is a pitched-noise whoosh, not notes. Ableton: runs ch1, pulse ch3, pad ch2/6, booms ch10.',

  init(P) {
    const N = 40, NB = 13;
    const nodes = [];
    for (let i = 0; i < N; i++) nodes.push({ x: 0, y: 0, ox: 0, oy: 0 });
    const beads = [];
    for (let k = 0; k < NB; k++) {
      beads.push({ ni: 2 + Math.round(k * (N - 5) / (NB - 1)), flare: 0 });
    }
    P.state = {
      N, NB, nodes, beads, seg: 0, tension: 0, wave: 0, pres: 0,
      uL: 0, uR: 0, vL: 0, vR: 0, gate: 0, runs: 0,
      prevAy: 0, prevBy: 0, cdL: 0, cdR: 0, strumQ: [],
      hist: [], histAcc: 0, idleKick: 0, born: 0, init: false
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

    // THE STRUM — the trigger is the HAND's jerk, never the rope's ringing.
    // One flick = one statement: a single rolled run, fired into the audio
    // tick's queue, per-side cooldown. Gravity-swinging the cable just makes
    // it whoosh and ribbon; it cannot machine-gun.
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

    // beads flare as the wave passes them — VISUAL ONLY, the light show of
    // the run, decoupled from note triggering
    for (let k = 0; k < s.NB; k++) {
      const b = s.beads[k], nd = nodes[b.ni];
      const amp = Math.abs(nd.y - nd.oy);
      b.flare *= Math.exp(-dt * 2.6);
      if (settled && amp > 2.0) b.flare = Math.max(b.flare, Math.min(1, amp / 7));
    }

    // ribbon history — long enough to hang in the air (the feature now)
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
    g.fillStyle = 'rgba(5,4,7,0.5)'; g.fillRect(0, 0, w, h);

    const ax = nodes[0].x, bx = nodes[N - 1].x;

    // the wash — one continuous fill under the catenary, darker at rest
    let topY = h;
    for (let i = 0; i < N; i++) if (nodes[i].y < topY) topY = nodes[i].y;
    const glow = clamp(0.06 + s.tension * 0.15 + Math.min(0.12, s.wave * 0.03)) * (0.4 + s.pres * 0.6);
    const gr = g.createLinearGradient(0, topY, 0, h * 0.99);
    gr.addColorStop(0, `rgba(255,140,66,${glow})`);
    gr.addColorStop(0.4, `rgba(255,90,128,${glow * 0.4})`);
    gr.addColorStop(0.75, 'rgba(200,60,160,0)');
    gr.addColorStop(1, 'rgba(200,60,160,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.lineTo(bx, h); g.lineTo(ax, h); g.closePath();
    g.fill();

    // THE RIBBONS — every shape the wire has recently held, hanging in the
    // air. Additive, hue drifting orange-pink into deep violet as they age,
    // motion-gated so a still cable is one clean line (law #7).
    const echoA = clamp(s.wave / 1.2);
    if (echoA > 0.03 && s.hist.length > 1) {
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round'; g.lineJoin = 'round';
      for (let e2 = 0; e2 < s.hist.length; e2++) {
        const snap = s.hist[e2];
        const age = (e2 + 1) / s.hist.length;          // 0 old → 1 newest
        const a = Math.pow(age, 1.7) * 0.20 * echoA;
        if (a < 0.004) continue;
        // newest ribbons pink-white, older sinking into violet-blue dark
        const r = 120 + age * 135, gg = 60 + age * 80, bb = 190 + age * 40;
        g.strokeStyle = `rgba(${r | 0},${gg | 0},${bb | 0},${a})`;
        g.lineWidth = (1.4 + age * 1.8) * ms;
        g.beginPath();
        g.moveTo(snap[0], snap[1]);
        for (let i = 1; i < N; i++) g.lineTo(snap[i * 2], snap[i * 2 + 1]);
        g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    }

    // masts
    const MC = ['#ffb266', '#b48aff'];
    [[nodes[0], MC[0]], [nodes[N - 1], MC[1]]].forEach(([nd, col]) => {
      g.strokeStyle = 'rgba(140,125,110,0.5)'; g.lineWidth = 2.2 * ms;
      g.beginPath(); g.moveTo(nd.x, h * 0.97); g.lineTo(nd.x, nd.y - 8 * ms); g.stroke();
      g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12 * ms;
      g.beginPath(); g.arc(nd.x, nd.y, 4 * ms, 0, TAU); g.fill();
      g.shadowBlur = 0;
    });

    // THE CABLE — crisp on top of everything it sheds
    const cg = g.createLinearGradient(ax, 0, bx, 0);
    cg.addColorStop(0, '#ffb266'); cg.addColorStop(0.5, '#ff8fa8'); cg.addColorStop(1, '#b48aff');
    g.strokeStyle = cg;
    g.lineWidth = (3.4 + s.tension * 1.2) * ms;
    g.shadowColor = '#ff9d76'; g.shadowBlur = (5 + s.tension * 9 + s.wave * 2) * ms;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.stroke();
    g.shadowBlur = 0;

    // beads — the chord ladder made visible; the pulse of the gate breathes
    // through them when the section is throbbing
    const gpulse = s.gate;
    for (let k = 0; k < s.NB; k++) {
      const b = s.beads[k], nd = nodes[b.ni];
      const u = (nd.x - ax) / (bx - ax || 1);
      const r0 = 255 - u * 75, g0 = 178 - u * 40, b0 = 102 + u * 153;
      const lit = Math.max(b.flare, gpulse * 0.45);
      const r = (4.6 + lit * 3.2) * ms;
      g.shadowColor = `rgb(${r0 | 0},${g0 | 0},${b0 | 0})`;
      g.shadowBlur = (6 + lit * 20) * ms;
      g.fillStyle = `rgba(${(r0 + lit * (255 - r0)) | 0},${(g0 + lit * (255 - g0)) | 0},${(b0 + lit * (255 - b0)) | 0},${0.5 + lit * 0.5})`;
      g.beginPath(); g.arc(nd.x, nd.y, r, 0, TAU); g.fill();
    }
    g.shadowBlur = 0;

    g.fillStyle = '#050407'; g.fillRect(0, h - 24, 360, 24);
    g.fillStyle = 'rgba(255,170,140,0.85)'; g.font = `${Math.round(10 * Math.min(ms, 1.4))}px ui-monospace,monospace`;
    g.fillText('TENSION ' + (s.tension * 100).toFixed(0) + '%  ·  ' + (H.label || '') +
      '  ·  STRINGS ' + s.vL + '+' + s.vR + '/6  ·  GATE ' + (s.gate * 100).toFixed(0) + '%  ·  RUNS ' + s.runs +
      (s.pres < 0.3 ? '  ·  RESTING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    // the AC hum — the wire is electric, still
    const hum = v.osc('sine', H.rootFreq(-2)), hum2 = v.osc('sine', H.rootFreq(-1));
    const hg = v.g(0.012);
    hum.connect(hg); hum2.connect(hg); hg.connect(v.group);
    // the whoosh — the wave itself, pitched noise instead of notes
    const wn = v.noise(), wf = v.filter('bandpass', 400, 1.1), wg = v.g(0);
    wn.connect(wf); wf.connect(wg); wg.connect(v.group);

    // six chairs, dark: low trio an octave down, high trio kept dim and low-cut
    const bedLo = A.padVoices(v, 3, { type: 'triangle', gain: 0.0001, cutoff: 260, q: 0.7 });
    const bedHi = A.padVoices(v, 3, { type: 'triangle', gain: 0.0001, cutoff: 520, q: 0.7 });
    const place = glide => {
      bedLo.forEach((b, i) => b.set(H.chordTone(i, -1), glide));
      bedHi.forEach((b, i) => b.set(H.chordTone(i + 2, 0), glide));
    };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 0.8);

    const TH = [0.18, 0.45, 0.72];
    let nextT = T.next(0.25), wasFull = false, arriveCD = 0;
    return {
      tick(inp) {
        const s = P.state, now = A.t();
        const gate = 0.3 + s.pres * 0.7;
        A.set(hg.gain, (0.006 + s.tension * 0.028) * gate, 0.3);
        // whoosh follows wave energy — instant agency for a swing, no notes
        A.set(wg.gain, clamp(s.wave / 6) * 0.05 * gate, 0.08);
        A.set(wf.frequency, 260 + s.tension * 700 + s.wave * 120, 0.15);

        // ---- THE GATE — the Zimmer throb. Depth grows with tension, rate
        // doubles near full. Streamed to CC74 (pad) so the string plugin's
        // own gate/filter can take over in Live.
        const depth = clamp((s.tension - 0.35) / 0.5) * 0.85 * s.pres;
        const rate = s.tension > 0.8 ? 4 : 2;   // 8ths → 16ths
        const ph = (T.beats() * rate) % 1;
        const lfo = 0.5 + 0.5 * Math.cos(ph * TAU);       // peak ON the grid
        const gv = 1 - depth * (1 - lfo * lfo);
        s.gate = depth * (1 - gv);

        let vL = 0, vR = 0;
        for (let j = 0; j < 3; j++) {
          const ll = clamp((s.uL - TH[j]) / 0.14), lr = clamp((s.uR - TH[j]) / 0.14);
          if (ll > 0.5) vL++;
          if (lr > 0.5) vR++;
          const body = 0.55 + s.tension * 0.45;
          bedLo[j].level(0.0105 * ll * body * gate * gv, 0.06);
          bedHi[j].level(0.008 * lr * body * gate * gv, 0.06);
          bedLo[j].bright(220 + s.tension * 380, 0.4);
          bedHi[j].bright(420 + s.tension * 800, 0.4);
        }
        s.vL = vL; s.vR = vR;

        // ---- arrival: the sixth chair sits down — one boom, one sub bloom
        const full = vL + vR >= 6;
        if (full && !wasFull && now > arriveCD && s.tension > 0.4) {
          arriveCD = now + 8;
          A.kick(T.next(0.25), 0.4);
          A.tone(H.rootFreq(-2), { at: T.next(0.25), vol: 0.12, dur: 3.2, attack: 0.25, type: 'sine', rev: 0.4 });
          s.beads.forEach(b => { b.flare = 1; });
        }
        wasFull = full;

        // ---- the grid: pulse and booms, earned by tension ----------------
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 24) {
          const st = ((Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;
          // 8th-note root pulse — the dark engine under the gate
          if (s.tension > 0.5 && st % 2 === 0) {
            const acc = st === 0 ? 1.35 : st % 4 === 0 ? 1.1 : 1;
            A.bassNote(H.chordTone(0, -1), {
              at: nextT, vol: (0.035 + (s.tension - 0.5) * 0.09) * acc * gate, dur: 0.24
            });
          }
          // taiko: the bar gets a boom, the half-bar earns a second
          if (s.tension > 0.5 && st === 0) {
            A.kick(nextT, (0.16 + (s.tension - 0.5) * 0.35) * gate);
            A.hit({ at: nextT, vol: 0.05 * gate, dur: 0.3, freq: 90, q: 0.8 });
          }
          if (s.tension > 0.75 && st === 8) A.kick(nextT, 0.12 * gate);
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        // ---- the flick: ONE rolled run per gesture, from the strum queue --
        let ev, k = 0;
        while ((ev = s.strumQ.shift()) && k < 2) {
          k++;
          const base = Math.floor(s.tension * 4);
          const at0 = Math.max(now + 0.02, T.next(0.25));
          const vol0 = clamp(0.07 + ev.sp * 0.06, 0.08, 0.2) * gate;
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
          MOut.expr('pad', depth);                    // the gate — map in Live
          MOut.expr('lead', clamp(s.wave / 4));
          MOut.expr('bass', clamp((s.tension - 0.5) * 2));
        }
      },
      stop() { v.kill(); }
    };
  }
});
