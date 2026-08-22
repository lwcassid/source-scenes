/* ---------- SRC-38.19 · LUMEN FILM (the turn is a sound) ---------- */
// Colour-stop strings, memoised by the alpha they were built for — see V18.
const LUMEN19_STOPCACHE = new Map();
reg({
  id: 'SRC-38.19', family: 'SRC-38', ver: 19, title: 'Lumen Film', tech: 'GEM FILM / APERTURE ORGAN',
  music: {
    bpm: 66, root: 50, mode: 'dorian', chordBars: 4,
    // PEDAL ON D. The film gets lighter as the progression walks — Dm9 is the
    // closed frame, D6/9 is the frame full of holes.
    chords: [
      [0, 7, 15, 19, 26],   // Dm9
      [0, 5, 12, 17, 22],   // Gsus/D
      [0, 8, 15, 20, 24],   // B♭/D
      [0, 9, 14, 16, 21]    // D6/9    — the light gets through
    ],
    chordNames: ['Dm9', 'Gsus/D', 'B♭/D', 'D6/9']
  },
  fx: { bloom: 0.46 },
  tags: ['THE TURN IS A SOUND', 'POOLED CHORD', 'NO PERCUSSION', 'THE SIT-IN'],
  desc: 'V19 (sound only): the soundscape rebuilt around the one thing that was working — the sound moving round your head when the field turns. Every held voice now rides its own burst continuously: its pan tracks where the stone actually is, so turning the field audibly swings the whole chord through the room, and the speed of the turn — not its angle — is what brightens and swirls the air. The organ no longer gets louder as it gets fuller: the voices share one loudness pool, so a single lit burst sings out alone and a full film is a rich quiet chord, not a wall. Dynamics are played, not printed — how hard the hand pushes through a burst’s threshold sets that note’s velocity and its bell, and an empty room gets no highs at all, just air and a slow bass breath. — V18: the two smallest bands of stone are gone — the little ones were reading as grit against the big cut faces rather than as gems of their own. The floor of the size range lifts, the spread narrows from roughly four-to-one to under two-to-one, and because the weave is held as a fraction of the frame the count simply falls out of that: bigger stones, fewer of them, the same amount of picture under stone. — V17: the weave is held as a fraction of the frame rather than a fixed number of stones, so it looks the same whatever shape the window or the projector is.',
  interact: 'R = LIGHT PRESSURE — the lamp behind the sheet. Draw in and the film is closed, dark faceted stone and a whisper of air. Reach out and bursts light one at a time, each adding one held voice to the chord — and how FAST you push through decides how hard each note speaks. L = ORIENTATION — an absolute dial: reach out and the whole field turns with your hand, up to a full turn. Turning is the money gesture: the chord’s voices sweep round the stereo field with the stones that hold them, and the speed of the turn opens a bright swirl of air that dies the moment you stop. Still hands = a still, quiet picture.',
  sound: 'An aperture organ, tamed. Three layers. DRONE: a root pedal on D that never moves plus a whisper of band-passed air — quiet enough to talk over, undulating, never dead; alone in the room it breathes an occasional bass swell and nothing else (no highs at idle). REACTIVE, the instrument: one held glass voice per lit burst, pitch by height in the frame, PAN LIVE from the stone’s actual position — L’s turn swings the whole chord round the head, and turn SPEED (not angle) opens the filters, detunes the partials, and swells a swirling air band that stops when the hand stops. Voices share a fixed loudness pool: fuller film = richer, never louder. Each commit’s velocity comes from how hard R pushed through the threshold; a glass bell (0.6s cooldown per voice) doubles the entrance at that same weight. QUANTIZED: bells land on the sixteenth; chords change with a 0.2s glide. NO PERCUSSION — this is the sit-in scene; the grid and the mids stay empty for a live player. Ableton: pad ch2 = voices (real velocity; CC74 = lamp + whip), bells ch5, texture ch6 = air (CC74 = swirl), bass ch3 = pedal.',

  init(P) {
    const S = Math.min(P.w, P.h), w = P.w, h = P.h;
    // Geometry is V18's, verbatim — this round is the soundscape.
    const B = Math.max(P.w, P.h);
    const R_LO = 0.0345, R_HI = 0.0632, RD = R_HI - R_LO;
    const meanKite = 1.6848 * B * B * (R_LO * R_LO + R_LO * RD + RD * RD / 3);
    const COVER = areaScale(P) > 1.6 ? 0.55 : 0.34;
    const N = Math.max(10, Math.min(130, Math.round(COVER * w * h / meanKite)));
    const cells = [];
    for (let i = 0; i < N; i++) {
      cells.push({
        x: P.rand() * w, y: P.rand() * h,
        r: B * (R_LO + P.rand() * RD),
        ph: P.rand() * TAU, sp: 0.1 + P.rand() * 0.22,
        gradRot: (P.rand() - 0.5) * 1.3,
        drift: (P.rand() - 0.5) * 0.5,
        baseRot: P.rand() * TAU, rot: 0
      });
    }
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = cells[i], b = cells[j];
          const dx = b.x - a.x, dy = b.y - a.y, rr = (a.r + b.r) * 0.74;
          const d = Math.hypot(dx, dy) || 1;
          if (d < rr) {
            const f = (rr - d) * 0.5, ux = dx / d * f, uy = dy / d * f;
            a.x -= ux; a.y -= uy; b.x += ux; b.y += uy;
          }
        }
      }
      for (const c of cells) {
        c.x = clamp(c.x, -c.r * 0.3, w + c.r * 0.3);
        c.y = clamp(c.y, -c.r * 0.3, h + c.r * 0.3);
      }
    }
    const vertsAt = (c, rot) => {
      const rx = c.r * 0.78, ry = c.r * 1.08, ca = Math.cos(rot), sa = Math.sin(rot);
      return [[0, -ry], [rx, 0], [0, ry], [-rx, 0]]
        .map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };
    const inKite = (pt, poly) => {
      let sign = 0;
      for (let k = 0; k < 4; k++) {
        const A = poly[k], B = poly[(k + 1) % 4];
        const cr = (B[0] - A[0]) * (pt[1] - A[1]) - (B[1] - A[1]) * (pt[0] - A[0]);
        if (cr === 0) continue;
        const sg = cr > 0 ? 1 : -1;
        if (sign === 0) sign = sg; else if (sg !== sign) return false;
      }
      return true;
    };
    const neigh = [];
    for (let i = 0; i < N; i++) neigh.push([]);
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = cells[i], b = cells[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) > (a.r + b.r) * 0.82) continue;
        neigh[i].push(j); neigh[j].push(i);
      }
    }
    const ap = [];
    for (let i = 0; i < N; i++) {
      if (!neigh[i].length) continue;
      if (P.rand() > 0.55) continue;
      const host = cells[i];
      const hv = vertsAt(host, host.baseRot);
      const order = neigh[i].slice().sort((x, y) =>
        Math.hypot(cells[x].x - host.x, cells[x].y - host.y) -
        Math.hypot(cells[y].x - host.x, cells[y].y - host.y));
      let found = null;
      for (const j of order) {
        const guest = cells[j], gv = vertsAt(guest, guest.baseRot);
        let bd = Infinity, be = -1, bu = 0.5;
        for (let e = 0; e < 4; e++) {
          const p0 = hv[e], p1 = hv[(e + 1) % 4];
          for (let si = 0; si <= 24; si++) {
            const u = si / 24;
            const pt = [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u];
            if (!inKite(pt, gv)) continue;
            const dd = Math.hypot(pt[0] - guest.x, pt[1] - guest.y);
            if (dd < bd) { bd = dd; be = e; bu = u; }
          }
        }
        if (be >= 0) { found = { e: be, u: bu }; break; }
      }
      if (!found) continue;
      ap.push({
        host: i, eIdx: found.e, u0: clamp(found.u, 0.16, 0.84),
        uSp: 0.12 + P.rand() * 0.3, uPh: P.rand() * TAU,
        size: host.r * (0.83 + P.rand() * 1.92),
        open: 0, lit: 0, on: false, arm: 0,
        x: host.x, y: host.y,
        th: clamp(0.06 + P.rand() * 0.92),
        growRate: 2.4 + P.rand() * 4.6, fadeRate: 1.1 + P.rand() * 2.8
      });
    }
    ap.sort((u, z) => u.th - z.th);
    ap.forEach((p, i) => { p.i = i; p.voice = i < 8 ? i : -1; });
    P.state = { cells, ap, pres: 0, lightP: 0, thick: 0, rotL: 0, spin: 0, spinRate: 0, _pvSpin: 0, openN: 0, lamp: 0, evq: [] };
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.lightP += (clamp(inp.R) - s.lightP) * Math.min(1, dt * 7);
    s.thick += (clamp(inp.L) - s.thick) * Math.min(1, dt * 6);
    const idle = (1 - s.pres) * (0.12 + 0.1 * Math.sin(t * 0.31));
    s.lamp = Math.max(s.lightP, idle);

    s.rotL += (clamp(inp.L) - s.rotL) * Math.min(1, dt * 8);
    const targetSpin = s.pres > 0.05 ? s.rotL * TAU : 0;
    s.spin += (targetSpin - s.spin) * Math.min(1, dt * 7);
    // ANGULAR VELOCITY, smoothed — the audio rides the SPEED of the turn
    // (the whip), not its angle. Dies to zero the moment the hand stops.
    const sr = (s.spin - s._pvSpin) / Math.max(dt, 0.001);
    s._pvSpin = s.spin;
    s.spinRate += (sr - s.spinRate) * Math.min(1, dt * 5);

    for (const c of s.cells) {
      c.ph += dt * c.sp;
      c.x += Math.cos(c.ph * 0.7 + c.drift) * dt * 5;
      c.y += Math.sin(c.ph) * dt * 4;
      c.rot = c.baseRot + s.spin + (1 - s.pres) * 0.05 * Math.sin(t * 0.25 + c.ph * 2);
    }
    let open = 0;
    for (const p of s.ap) {
      const H = s.cells[p.host];
      p.x = H.x; p.y = H.y;
      const want = s.lamp > p.th;
      const lead = clamp((s.lamp - p.th + 0.09) / 0.14);
      p.lit += (lead - p.lit) * Math.min(1, dt * 9);
      if (want !== p.on) {
        p.arm += dt;
        if (p.arm > 0.05) { p.on = want; p.arm = 0; s.evq.push({ p, on: want }); }
      } else p.arm = 0;
      p.open += ((p.on ? 1 : 0) - p.open) * Math.min(1, dt * (p.on ? p.growRate : p.fadeRate));
      if (p.on) open++;
    }
    s.openN = open;
    if (s.evq.length > 20) s.evq.splice(0, s.evq.length - 20);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#010103';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const gate = clamp(s.pres * 1.15);
    const LIGHT_DIR = -Math.PI / 2;

    const SVGSTOPS = [
      [0, '0,0,0'], [0.2, '37,85,238'], [0.4, '100,215,160'], [0.5, '242,255,242'],
      [0.6, '255,214,90'], [0.7, '225,61,47'], [0.8, '0,14,223'], [1, '0,0,0']
    ];
    const addSvgStops = (grad, a) => {
      let set = LUMEN19_STOPCACHE.get(a);
      if (!set) {
        set = SVGSTOPS.map(([t, rgb]) => [t, `rgba(${rgb},${a})`]);
        LUMEN19_STOPCACHE.set(a, set);
      }
      for (let i = 0; i < set.length; i++) grad.addColorStop(set[i][0], set[i][1]);
    };

    const diamondPts = (c, rScale) => {
      const rx = c.r * 0.78 * rScale, ry = c.r * 1.08 * rScale, a = c.rot;
      const ca = Math.cos(a), sa = Math.sin(a);
      const raw = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]];
      return raw.map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };

    const gradLag = s.spin * 0.34;
    const stonePts = [];
    for (const c of s.cells) {
      const pts = diamondPts(c, 1);
      stonePts.push(pts);
      const T = pts[0], R = pts[1], B = pts[2], L = pts[3];
      const U = [c.x + (T[0] - c.x) * 0.45, c.y + (T[1] - c.y) * 0.45];
      const D = [c.x + (B[0] - c.x) * 0.45, c.y + (B[1] - c.y) * 0.45];
      const tris = [[T, U, R], [U, D, R], [D, B, R], [T, U, L], [U, D, L], [D, B, L]];
      const gAng = c.gradRot + gradLag;
      const cr = Math.cos(gAng), sr = Math.sin(gAng);
      for (const [inA, inB, outV] of tris) {
        const mx = (inA[0] + inB[0]) / 2, my = (inA[1] + inB[1]) / 2;
        const facetAngle = Math.atan2(outV[1] - my, outV[0] - mx);
        const lit = 0.5 + 0.5 * Math.cos(facetAngle - LIGHT_DIR);
        const alphaEnv = clamp(0.04 + lit * 0.5 * gate + s.lamp * 0.3);
        const dx0 = outV[0] - mx, dy0 = outV[1] - my;
        const gx = mx + dx0 * cr - dy0 * sr, gy = my + dx0 * sr + dy0 * cr;
        const fg = g.createLinearGradient(mx, my, gx, gy);
        addSvgStops(fg, alphaEnv.toFixed(2));
        g.fillStyle = fg;
        g.beginPath(); g.moveTo(inA[0], inA[1]); g.lineTo(inB[0], inB[1]); g.lineTo(outV[0], outV[1]); g.closePath();
        g.fill();
      }
    }

    g.globalCompositeOperation = 'lighter';
    const BEAM = [
      [0, 242, 255, 242, 1.32],
      [0.25, 37, 85, 238, 1.06],
      [0.55, 255, 214, 90, 0.6],
      [0.82, 225, 61, 47, 0.2],
      [1, 225, 61, 47, 0]
    ];
    for (const p of s.ap) {
      const a = Math.max(p.lit * 0.35, p.open);
      if (a < 0.01) continue;
      const hv = stonePts[p.host];
      const e0 = hv[p.eIdx], e1 = hv[(p.eIdx + 1) % 4];
      const u = clamp(p.u0 + Math.sin(t * p.uSp + p.uPh) * 0.12, 0.06, 0.94);
      const sx = e0[0] + (e1[0] - e0[0]) * u, sy = e0[1] + (e1[1] - e0[1]) * u;
      const eAng = Math.atan2(e1[1] - e0[1], e1[0] - e0[0]);

      const R = p.size * (0.13 + a * 0.4);
      const gr = g.createRadialGradient(sx, sy, 0, sx, sy, R);
      gr.addColorStop(0, `rgba(242,255,242,${(Math.min(0.92, a) * bright).toFixed(2)})`);
      gr.addColorStop(0.35, `rgba(37,85,238,${(a * 0.55 * bright).toFixed(2)})`);
      gr.addColorStop(0.7, `rgba(255,214,90,${(a * 0.3 * bright).toFixed(2)})`);
      gr.addColorStop(1, 'rgba(225,61,47,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(sx, sy, R, 0, TAU); g.fill();

      if (p.open > 0.2) {
        const L = R * (2.2 + p.open * 5);
        const dirs = [
          { a: eAng, len: 1, w: 0.475, wMin: 4.5, av: 0.27 },
          { a: eAng + Math.PI, len: 1, w: 0.475, wMin: 4.5, av: 0.27 },
          { a: eAng + Math.PI / 2, len: 0.4, w: 0.22, wMin: 3, av: 0.19 },
          { a: eAng - Math.PI / 2, len: 0.4, w: 0.22, wMin: 3, av: 0.19 }
        ];
        g.lineCap = 'round';
        for (const dr of dirs) {
          const Ln = L * dr.len, cx = Math.cos(dr.a) * Ln, cy = Math.sin(dr.a) * Ln;
          const ex = sx + cx, ey = sy + cy;
          const av = p.open * dr.av * bright;
          const coreW = Math.max(dr.wMin * ms, R * dr.w * p.open);
          const mkGrad = (mult, ch) => {
            const gd = g.createLinearGradient(sx, sy, ex, ey);
            for (const st of BEAM) {
              const rr = (ch === undefined || ch === 0) ? st[1] : 0;
              const gg = (ch === undefined || ch === 1) ? st[2] : 0;
              const bb = (ch === undefined || ch === 2) ? st[3] : 0;
              gd.addColorStop(st[0], `rgba(${rr},${gg},${bb},${(av * st[4] * mult).toFixed(3)})`);
            }
            return gd;
          };
          g.strokeStyle = mkGrad(0.26);
          g.lineWidth = coreW * 1.5;
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();

          const perpx = -cy / Ln, perpy = cx / Ln;
          const sep = Math.max(1.5 * ms, coreW * 0.085);
          for (let ch = 0; ch < 3; ch++) {
            g.strokeStyle = mkGrad(1, ch);
            g.lineWidth = coreW;
            const off = (ch - 1) * sep;
            g.beginPath();
            g.moveTo(sx + perpx * off, sy + perpy * off);
            g.lineTo(ex + perpx * off, ey + perpy * off);
            g.stroke();
          }
          g.strokeStyle = mkGrad(1.6);
          g.lineWidth = Math.max(2.4 * ms, coreW * 0.2);
          g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
        }
        g.lineCap = 'butt';
      }
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(190,225,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('SPOTS ' + s.openN + '/' + s.ap.length + '   LAMP ' + Math.round(s.lamp * 100) +
      '   TURN ' + Math.round(s.spin / TAU * 100) + '%   WHIP ' + Math.round(clamp(Math.abs(s.spinRate) / 3.5) * 100) +
      (s.pres < 0.3 ? '   · CLOSED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- air behind the sheet — also the swirl carrier. Panned: as the
       field turns, the air itself moves round the head, and the SPEED of
       the turn swells it. Still hand = the swirl dies.                    */
    const n = v.noise(), nf = v.filter('bandpass', 420, 0.8), ng = v.g(0.002);
    const nPan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
    n.connect(nf); nf.connect(ng);
    if (nPan) { ng.connect(nPan); nPan.connect(v.group); } else { ng.connect(v.group); }

    /* --- ONE VOICE PER BURST, POOLED LOUDNESS. Eight voices; the loudness
       pool is fixed, so one lit burst sings out alone and a full film is a
       rich quiet chord — never a wall. Pan is LIVE from the stone's actual
       position every tick, which is what makes the turn a sound.          */
    const NV = 8;
    const voices = [];
    for (let i = 0; i < NV; i++) {
      const o1 = v.osc('triangle', 220), o2 = v.osc('triangle', 220), o3 = v.osc('sine', 440);
      o2.detune.value = 5;
      const f = v.filter('lowpass', 600, 0.9);
      const g = v.g(0.0001);
      const pan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
      o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g);
      if (pan) { g.connect(pan); pan.connect(v.group); } else { g.connect(v.group); }
      if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.8; g.connect(sd); sd.connect(AE.revIn); }
      voices.push({ o1, o2, o3, f, g, pan, note: -1, burst: null, lastBell: -9 });
    }
    const setV = (vc, freq, glide, vel) => {
      if (!isFinite(freq) || freq <= 20) return;
      A.set(vc.o1.frequency, freq, glide);
      A.set(vc.o2.frequency, freq, glide);
      A.set(vc.o3.frequency, freq * 2.01, glide);
      if (typeof MOut !== 'undefined') {
        const note = MOut.f2n(freq);
        if (note !== vc.note) {
          const ch = MOut.chFor('pad'), pnow = performance.now();
          if (vc.note >= 0 && MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0], pnow); } catch (e) {} }
          vc.note = note;
          const vv = Math.max(20, Math.min(120, Math.round(vel || 50)));
          MOut.log.push({ p: pnow, role: 'pad', ch, note, vel: vv, durMs: 2600 });
          if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, vv], pnow); } catch (e) {} }
        }
      }
    };

    /* --- the pedal ------------------------------------------------------ */
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.012, cutoff: 220, q: 0.5 });
    const retune = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      for (const p of P.state.ap) {
        if (p.voice < 0 || !p.on) continue;
        const vc = voices[p.voice];
        // a chord re-voice keeps the dynamic the note was PLAYED at,
        // slightly relaxed — a flat re-strike velocity erases the playing
        setV(vc, H.chordTone(p.deg || 0, p.oct || 0), glide, Math.round((vc.vel || 50) * 0.85));
      }
    };
    retune(0.05);
    H.onChord(() => retune(0.2));
    v.fadeIn(1, 1.6);

    let prevLamp = null, lampVel = 0;
    let nextBreath = 0, breath = 0, breathFall = 1.2;

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        dt = dt || 0.016;
        const gate = clamp(s.pres * 1.2);
        // the WHIP: how fast the field is actually turning, 0..1
        const whip = clamp(Math.abs(s.spinRate) / 3.5);

        // how hard R is pushing through thresholds right now — this is the
        // velocity source for commits, so dynamics are played, not printed
        const rawLv = Math.max(0, prevLamp === null ? 0 : (s.lamp - prevLamp) / Math.max(dt, 0.008));
        prevLamp = s.lamp;
        // attack-instant, slow release: a stab's FIRST commits must already
        // carry its full weight — smoothing both ways made stabs print soft
        lampVel = rawLv > lampVel ? rawLv : lampVel + (rawLv - lampVel) * Math.min(1, dt * 3);

        /* ---- the swirl: air turns with the field, swells with the whip - */
        if (nPan) A.set(nPan.pan, Math.sin(s.spin) * 0.85, 0.08);
        A.set(ng.gain, 0.002 + (s.lamp * 0.004 + whip * 0.011) * gate, 0.2);
        A.set(nf.frequency, 380 + s.lamp * 900 + whip * 1600, 0.2);

        /* ---- pooled loudness: the chord thickens, never gets louder ---- */
        let act = 0;
        for (const vc of voices) if (vc.burst && vc.burst.on) act++;
        const per = Math.min(0.045, 0.08 / Math.pow(Math.max(2, act), 0.65));

        /* ---- commits: velocity from the push, bell on the sixteenth ---- */
        let ev, i = 0;
        while ((ev = s.evq.shift()) && i < 6) {
          i++;
          const p = ev.p;
          if (p.voice < 0) continue;
          const vc = voices[p.voice];
          if (ev.on) {
            vc.burst = p;
            const up = clamp(1 - p.y / P.h);
            p.deg = Math.round(up * 9); p.oct = up > 0.72 ? 1 : 0;
            // 1.2: a slow swell (lamp 0→1 over ~3s) lands mid-range; only a
            // real stab saturates. At 2.2 every creep printed near-max.
            const push = clamp(lampVel * 1.2);
            const vel = 34 + Math.round(push * 52 + clamp(p.size / (P.state.cells[p.host].r * 2.75)) * 22);
            vc.vel = vel;
            setV(vc, H.chordTone(p.deg, p.oct), 0.08, vel);
            if (gate > 0.15 && now - vc.lastBell > 0.6) {
              vc.lastBell = now;
              const at = T.next(0.25) + p.voice * 0.014;   // low-to-high harp stagger
              A.bell(H.chordTone(p.deg + 3, p.oct + 1),
                { at, vol: (0.014 + push * 0.03) * gate, dur: 2.6, pan: clamp(p.x / P.w * 2 - 1, -1, 1) * 0.8, rev: 0.8 });
            }
          }
          // releases need no event handling — the level ride below follows
          // p.open down and closes the MIDI note once it has faded
        }

        /* ---- the ride: every voice follows its burst, every tick ------- */
        for (const vc of voices) {
          const p = vc.burst;
          const env = p ? p.open : 0;
          // NO HIGHS FOR AN EMPTY ROOM: the whole organ is presence-gated
          A.set(vc.g.gain, 0.0001 + per * env * gate, 0.12);
          if (p && vc.pan) A.set(vc.pan.pan, clamp(p.x / P.w * 2 - 1, -1, 1) * 0.8, 0.07);
          A.set(vc.f.frequency, 480 + s.lamp * 1000 + whip * 900, 0.2);
          A.set(vc.o2.detune, 4 + whip * 20, 0.15);
          if (p && !p.on && env < 0.05) {
            if (typeof MOut !== 'undefined' && vc.note >= 0) {
              const ch = MOut.chFor('pad');
              if (MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
              vc.note = -1;
            }
            vc.burst = null;
          }
        }

        /* ---- pedal: undulating low floor; alone, a slow bass breath ---- */
        const und = 0.5 + 0.5 * (Math.sin(now * 0.13) * 0.6 + Math.sin(now * 0.071) * 0.4);
        if (s.pres < 0.15) {
          if (now > nextBreath) {
            nextBreath = now + 5 + P.rand() * 8;
            breath = 0.5 + P.rand() * 0.6;
            breathFall = 1.0 + P.rand() * 1.6;
          }
          breath *= Math.exp(-dt / breathFall);
        } else breath = 0;
        sub[0].level(0.006 + und * 0.003 + s.lamp * 0.006 * gate + breath * 0.012, 0.4);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', clamp(0.12 + s.lamp * 0.5 + whip * 0.5));
          MOut.expr('texture', clamp(s.lamp * 0.6 + whip * 0.6));
          MOut.expr('bells', clamp(s.openN / 8));
        }
      },
      stop() {
        if (typeof MOut !== 'undefined' && MOut.wants() && MOut.port) {
          const ch = MOut.chFor('pad');
          for (const vc of voices) if (vc.note >= 0) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
        }
        v.kill();
      }
    };
  }
});
