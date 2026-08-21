/* ---------- SRC-13.2 · CABLE STRUM V2 — the wave you see is the arpeggio you hear ---------- */
reg({
  id: 'SRC-13.2', family: 'SRC-13', ver: 2, title: 'Cable Strum V2', tech: 'VERLET ROPE / BEAD RAKE',
  music: {
    bpm: 76, root: 45, mode: 'dorian', chordBars: 2,
    chords: [
      [0, 15, 19, 22, 26],   // Am13 — the dorian sixth, warm home
      [0, 14, 17, 21, 24],   // D/A  — the lift, still on the pedal
      [0, 15, 19, 24, 29],   // Am11 — suspension
      [0, 10, 15, 19, 26]    // Am9  — settle
    ],
    chordNames: ['Am13', 'D/A', 'Am11', 'Am9']
  },
  fx: { bloom: 0.5 },
  tags: ['SOFT BODY', 'BEAD RAKE', 'WAVE = ARPEGGIO', 'STRING SECTION SWELL', 'PHYSICAL STRING'],
  desc: 'The slack cable, restrung as a harp. Thirteen luminous beads sit on the span, each one a tone of the current chord — low and orange at the left mast, high and violet at the right. Jerk a hand and the wave you launch rakes the beads as it travels: the ripple you watch cross the cable IS the arpeggio you hear cross the room. Behind it the cable sheds light — a warm orange-to-pink wash pooling below the catenary, and ghost echoes of where the wire just was.',
  interact: 'L = height of the left anchor, R = right. Fast moves strum — the traveling wave plays each bead it passes, left hand launches runs that climb, right hand launches runs that fall. Slow moves conduct: raising both arms pulls the cable taut and a string section swells in voice by voice, left arm the low strings, right arm the high. Tension also slides the whole bead ladder up — taut is higher and brighter. Asymmetry tilts the catenary and the voicing with it.',
  sound: 'Three layers. DRONE: the AC-line hum on the root pedal, plus six triangle string voices that join one at a time as each arm rises — left arm admits the low trio (cellos, an octave down), right arm the high trio — so raising both arms builds the wall of sound by hand. QUANTIZED: past two-thirds tension a bead-shimmer tremolo fades in on 8ths, 16ths above 85% — earned, never default. REACTIVE: every bead the wave crosses fires a Karplus-style pluck on the chord ladder, velocity from wave amplitude, panned to where the bead hangs; simultaneous hits are rolled 50ms apart so a hard strum is a harp rake, not a chord slab. All of it is the chord ladder of an A-dorian pedal (Am13 · D/A · Am11 · Am9), so any cascade is musical. Ableton: plucks ch1 (lead), shimmer ch4 (arp), strings via texture ch6, CC74 per role = that layer\'s energy.',

  init(P) {
    const N = 40, NB = 13;
    const nodes = [];
    for (let i = 0; i < N; i++) nodes.push({ x: 0, y: 0, ox: 0, oy: 0 });
    const beads = [];
    // beads live on interior nodes — the anchor nodes are pinned and never move
    for (let k = 0; k < NB; k++) {
      beads.push({ ni: 2 + Math.round(k * (N - 5) / (NB - 1)), flare: 0, armed: true, lastT: -9 });
    }
    P.state = {
      N, NB, nodes, beads, seg: 0, tension: 0, wave: 0, pres: 0,
      uL: 0, uR: 0, vL: 0, vR: 0, rakes: 0, lastRakeAt: 0,
      hist: [], histAcc: 0, idleKick: 0, shimmer: 0, init: false
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, { N, nodes } = s, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // idle = the cable breathes on a slow swell; live hands take over smoothly
    const idL = 0.16 + 0.09 * Math.sin(t * 0.21), idR = 0.16 + 0.09 * Math.sin(t * 0.26 + 2.1);
    s.uL = clamp(inp.L) * s.pres + idL * (1 - s.pres);
    s.uR = clamp(inp.R) * s.pres + idR * (1 - s.pres);
    const ax = w * 0.08, bx = w * 0.92;
    const ay = h * (0.62 - s.uL * 0.46), by = h * (0.62 - s.uR * 0.46);
    if (!s.init) {
      s.init = true; s.born = t;
      // seed at (approximately) the natural hang for the current rest length,
      // so opening the scene is a settle, not a bounce that strums everything
      const span = bx - ax;
      const extra = Math.max(8, (1.16 - 0.22 * ((s.uL + s.uR) / 2)) * span - span);
      const sag = Math.sqrt(3 * span * extra / 8);
      for (let i = 0; i < N; i++) {
        const tt = i / (N - 1);
        nodes[i].x = nodes[i].ox = lerp(ax, bx, tt);
        nodes[i].y = nodes[i].oy = lerp(ay, by, tt) + Math.sin(tt * Math.PI) * sag;
      }
    }
    // idle tease: every so often the wind plucks the wire, softly
    if (s.pres < 0.2 && t - s.idleKick > 8) {
      s.idleKick = t + P.rand() * 5;
      const ni = 6 + Math.floor(P.rand() * (N - 12));
      for (let i = -2; i <= 2; i++) nodes[ni + i].oy -= (3 - Math.abs(i)) * 4;
    }
    // raising hands also winches the cable in: high hands = taut + high pitch.
    // Slack range is capped so the crown of the sag never leaves the frame.
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
    // tension is GEOMETRY, not solver residual: how much longer the rope's
    // path is than the straight line between its anchors. Slack sag = 0,
    // winched straight = 1 — monotonic, and honest about a tilted catenary
    // (a rope hung from one high hand really is tighter).
    let pathLen = 0;
    for (let i = 0; i < N - 1; i++) pathLen += Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
    const chord = Math.hypot(bx - ax, by - ay);
    s.tension += (clamp(1 - (pathLen / chord - 1) / 0.12) - s.tension) * Math.min(1, dt * 4);
    let wave = 0;
    for (let i = 1; i < N - 1; i++) wave += Math.abs(nodes[i].y - nodes[i].oy);
    s.wave += (wave / N - s.wave) * 0.25;

    // THE RAKE — each bead is a chord tone; the wave crossing it plays it.
    // Schmitt per bead so one crest = one note, cooldown so a standing
    // oscillation can't machine-gun.
    // the settle after (re)seed is not a performance — no rakes until the
    // rope has found its hang
    const gate = (t - s.born < 3) ? 0 : 0.3 + s.pres * 0.7;
    for (let k = 0; k < s.NB; k++) {
      const b = s.beads[k], nd = nodes[b.ni];
      const amp = Math.abs(nd.y - nd.oy);
      b.flare *= Math.exp(-dt * 2.8);
      if (gate > 0 && b.armed && amp > 2.3 && t - b.lastT > 0.22) {
        b.armed = false; b.lastT = t; b.flare = 1; s.rakes++;
        const idx = k + Math.floor(s.tension * 4);   // taut slides the ladder up
        const freq = H.chordTone(Math.min(idx, 16), 0);
        const vol = clamp(amp / 26, 0.05, 0.26) * gate;
        const pan = ((nd.x / w) * 2 - 1) * 0.8;
        P.ping(A => {
          // quantize to the 16th, but roll simultaneous hits ~50ms apart —
          // a hard strum is a harp rake, not a chord slab
          let at = A.q();
          if (at < s.lastRakeAt + 0.05) at = s.lastRakeAt + 0.05;
          s.lastRakeAt = at;
          A.pluck2(freq, { at, vol, dur: 1.7, pan, rev: 0.42, del: 0.18, role: 'lead' });
          if (vol > 0.14) A.hit({ at, vol: vol * 0.3, dur: 0.03, freq: freq * 6, q: 2 });
        });
      } else if (!b.armed && amp < 0.9) b.armed = true;
    }

    // echo history — a snapshot of the wire every 55ms, kept short
    s.histAcc += dt;
    if (s.histAcc > 0.055) {
      s.histAcc = 0;
      const snap = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) { snap[i * 2] = nodes[i].x; snap[i * 2 + 1] = nodes[i].y; }
      s.hist.push(snap);
      if (s.hist.length > 5) s.hist.shift();
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, { N, nodes } = s;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(6,5,8,0.5)'; g.fillRect(0, 0, w, h);

    const ax = nodes[0].x, bx = nodes[N - 1].x;

    // THE WASH — one continuous gradient pooling under the catenary,
    // orange at the wire falling through pink to nothing. Its top edge is
    // the cable curve itself, so there are no bars and no seams.
    let topY = h;
    for (let i = 0; i < N; i++) if (nodes[i].y < topY) topY = nodes[i].y;
    const glow = clamp(0.10 + s.tension * 0.16 + Math.min(0.16, s.wave * 0.035)) * (0.45 + s.pres * 0.55);
    const gr = g.createLinearGradient(0, topY, 0, h * 0.99);
    gr.addColorStop(0, `rgba(255,150,72,${glow})`);
    gr.addColorStop(0.4, `rgba(255,96,132,${glow * 0.42})`);
    gr.addColorStop(0.78, 'rgba(255,60,150,0)');
    gr.addColorStop(1, 'rgba(255,60,150,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.lineTo(bx, h); g.lineTo(ax, h); g.closePath();
    g.fill();
    // a soft bloom hugging the wire so the wash reads as light the cable sheds
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(255,130,90,${0.04 + s.tension * 0.05})`;
    g.lineWidth = Math.min(w, h) * 0.05;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.stroke();
    g.globalCompositeOperation = 'source-over';

    // ECHOES — ghosts of where the wire just was. Only motion leaves them:
    // a still cable is one clean line, a strummed one trails its own past.
    const echoA = clamp(s.wave / 1.6);
    if (echoA > 0.04) {
      for (let e2 = 0; e2 < s.hist.length; e2++) {
        const snap = s.hist[e2];
        const a = ((e2 + 1) / s.hist.length) * 0.11 * echoA;
        g.strokeStyle = `rgba(236,120,200,${a})`;
        g.lineWidth = 2.4 * ms;
        g.beginPath();
        g.moveTo(snap[0], snap[1]);
        for (let i = 1; i < N; i++) g.lineTo(snap[i * 2], snap[i * 2 + 1]);
        g.stroke();
      }
    }

    // masts — side law: left is the warm country, right the violet
    const MC = ['#ffb266', '#b48aff'];
    [[nodes[0], MC[0]], [nodes[N - 1], MC[1]]].forEach(([nd, col]) => {
      g.strokeStyle = 'rgba(140,125,110,0.5)'; g.lineWidth = 2.2 * ms;
      g.beginPath(); g.moveTo(nd.x, h * 0.97); g.lineTo(nd.x, nd.y - 8 * ms); g.stroke();
      g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 12 * ms;
      g.beginPath(); g.arc(nd.x, nd.y, 4 * ms, 0, TAU); g.fill();
      g.shadowBlur = 0;
    });

    // THE CABLE — fat enough for mesh, orange fading to violet across the span
    const cg = g.createLinearGradient(ax, 0, bx, 0);
    cg.addColorStop(0, '#ffb266'); cg.addColorStop(0.5, '#ff8fa8'); cg.addColorStop(1, '#b48aff');
    g.strokeStyle = cg;
    g.lineWidth = (3.4 + s.tension * 1.2) * ms;
    g.shadowColor = '#ff9d76'; g.shadowBlur = (5 + s.tension * 9 + s.wave * 2) * ms;
    g.beginPath();
    g.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < N; i++) g.lineTo(nodes[i].x, nodes[i].y);
    g.stroke();
    g.shadowBlur = 0;

    // THE BEADS — the chord ladder made visible; a raked bead flares
    for (let k = 0; k < s.NB; k++) {
      const b = s.beads[k], nd = nodes[b.ni];
      const u = (nd.x - ax) / (bx - ax || 1);
      const r0 = 255 - u * 75, g0 = 178 - u * 40, b0 = 102 + u * 153;
      const r = (4.6 + b.flare * 3.6) * ms;
      g.shadowColor = `rgb(${r0 | 0},${g0 | 0},${b0 | 0})`;
      g.shadowBlur = (6 + b.flare * 22) * ms;
      g.fillStyle = `rgba(${(r0 + b.flare * (255 - r0)) | 0},${(g0 + b.flare * (255 - g0)) | 0},${(b0 + b.flare * (255 - b0)) | 0},${0.55 + b.flare * 0.45})`;
      g.beginPath(); g.arc(nd.x, nd.y, r, 0, TAU); g.fill();
    }
    g.shadowBlur = 0;

    g.fillStyle = '#060508'; g.fillRect(0, h - 24, 340, 24);
    g.fillStyle = 'rgba(255,170,140,0.85)'; g.font = `${Math.round(10 * Math.min(ms, 1.4))}px ui-monospace,monospace`;
    g.fillText('TENSION ' + (s.tension * 100).toFixed(0) + '%  ·  ' + (H.label || '') +
      '  ·  STRINGS ' + s.vL + '+' + s.vR + '/6  ·  RAKE ' + s.rakes +
      (s.pres < 0.3 ? '  ·  RESTING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    // the AC-line hum — V1's identity, kept: the wire is electric
    const hum = v.osc('sine', H.rootFreq(-2)), hum2 = v.osc('sine', H.rootFreq(-1));
    const hg = v.g(0.012);
    hum.connect(hg); hum2.connect(hg); hg.connect(v.group);

    // THE SECTION — six triangle strings. Left arm admits the low trio an
    // octave down, right arm the high trio; each voice has its own admission
    // threshold so raising an arm is players joining one by one.
    const bedLo = A.padVoices(v, 3, { type: 'triangle', gain: 0.0001, cutoff: 300, q: 0.7 });
    const bedHi = A.padVoices(v, 3, { type: 'triangle', gain: 0.0001, cutoff: 620, q: 0.7 });
    const place = glide => {
      bedLo.forEach((b, i) => b.set(H.chordTone(i, -1), glide));
      bedHi.forEach((b, i) => b.set(H.chordTone(i + 2, 0), glide));
    };
    place(0.05);
    H.onChord(() => {
      place(0.18);   // snap, no jet takeoff — the roll marks the moment instead
      const s = P.state;
      if (s.tension > 0.3) {
        const gate = 0.3 + s.pres * 0.7;
        for (let i = 0; i < 3; i++) {
          A.pluck2(H.chordTone(i * 2, 0), {
            at: A.t() + 0.05 + i * 0.07, vol: (0.018 + s.tension * 0.02) * gate,
            dur: 1.3, pan: -0.3 + i * 0.3, rev: 0.6, del: 0.1, role: 'lead'
          });
        }
      }
    });
    v.fadeIn(1, 0.8);

    const TH = [0.18, 0.45, 0.72];   // admission height per chair
    let nextT = T.next(0.25), shimI = 0;
    return {
      tick(inp) {
        const s = P.state, now = A.t();
        const gate = 0.3 + s.pres * 0.7;
        A.set(hg.gain, (0.006 + s.tension * 0.03) * gate, 0.3);

        let vL = 0, vR = 0;
        for (let j = 0; j < 3; j++) {
          const ll = clamp((s.uL - TH[j]) / 0.14), lr = clamp((s.uR - TH[j]) / 0.14);
          if (ll > 0.5) vL++;
          if (lr > 0.5) vR++;
          const body = 0.55 + s.tension * 0.45;
          bedLo[j].level(0.0095 * ll * body * gate, 0.5);
          bedHi[j].level(0.008 * lr * body * gate, 0.5);
          bedLo[j].bright(240 + s.tension * 420, 0.4);
          bedHi[j].bright(480 + s.tension * 900, 0.4);
        }
        s.vL = vL; s.vR = vR;

        // THE SHIMMER — earned tremolo across the beads, only when taut.
        // 8ths past 62% tension, 16ths past 85%; downbeats accented.
        const amp = clamp((s.tension - 0.62) / 0.38) * s.pres;
        s.shimmer = amp;
        const horizon = now + 0.15;
        let guard = 0;
        while (nextT < horizon && guard++ < 24) {
          const st = ((Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16) + 16) % 16;
          if (amp > 0 && (st % 2 === 0 || s.tension > 0.85)) {
            shimI++;
            const p = shimI % 24, k = p < 13 ? p : 24 - p;   // ping-pong the span
            const acc = st === 0 ? 1.3 : st % 4 === 0 ? 1.12 : 1;
            A.pluck2(H.chordTone(Math.min(k + Math.floor(s.tension * 4), 16), 0), {
              at: nextT, vol: (0.012 + amp * 0.02) * acc * gate,
              dur: 0.5, pan: (k / 12 * 2 - 1) * 0.7, rev: 0.5, del: 0.25, role: 'arp'
            });
            const bd = s.beads[k];
            if (bd) bd.flare = Math.max(bd.flare, 0.45);
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('lead', clamp(s.wave / 4));
          MOut.expr('arp', amp);
          MOut.expr('texture', s.tension);
        }
      },
      stop() { v.kill(); }
    };
  }
});
