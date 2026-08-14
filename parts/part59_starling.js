/* ---------- SRC-39 · STARLING FIELD (spots that fly) ---------- */
reg({
  id: 'SRC-39', family: 'SRC-39', ver: 1, title: 'Starling Field', tech: 'BOID LATTICE / TURING SPOTS',
  music: {
    bpm: 104, root: 41, mode: 'aeolian', chordBars: 2,
    chords: [
      [0, 7, 15, 19, 22],   // Fm7
      [0, 5, 12, 17, 21],   // B♭/F      — the flock opens out
      [0, 8, 15, 20, 23],   // D♭maj9/F
      [0, 7, 14, 17, 22]    // Fm11
    ],
    chordNames: ['Fm7', 'B♭/F', 'D♭maj9/F', 'Fm11']
  },
  fx: { bloom: 0.5 },
  tags: ['TURING SPOTS THAT FLOCK', 'FORMATION = GROOVE', 'WHERE THEY ARE IS WHAT YOU HEAR', 'MERGES INTO WORMS'],
  desc: 'A field of fat spots that keep exactly as far apart as they can — which is what makes a leopard, a reef, a reaction between two chemicals. Then they fly. Push them together and the spacing rule fights the flocking rule: the spots stretch into worms, the worms into shoals, and a murmuration crosses the frame with the same lattice still visible inside it. Every beat sends a gust through the field so the whole thing breathes in time whether or not anybody is playing it.',
  interact: 'L = HEADING. The flock banks: turn your hand and the whole field wheels, exactly like a murmuration deciding. And because the melody is read straight off where the birds ARE — the frame is divided into seven vertical lanes, and whichever lane holds the most birds sounds its note — steering the flock left and right IS playing the line, low on the left, high on the right. R = FLOCK. Drawn in, the spots ignore each other and drift as an even Turing lattice; reach out and cohesion and alignment climb until the field locks into one animal, spots melting into worms as they crowd. When the formation genuinely locks, the groove arrives — you have to fly them properly to earn the drums.',
  sound: 'The picture is the score. Seven lanes, seven degrees of the chord ladder; the fullest lane fires on every eighth (MIDI role: lead), panned to where that lane sits, so the melody walks with the flock and holds still when the flock does. Coherence — how much the field agrees on a direction, measured live — is the arrangement: scattered is a bare wind bed and silence; half-locked adds a shaker and a soft bass on the downbeats; fully locked opens the kick and the flock is a groove. Every gust that crosses the frame is a filter sweep on the bed, on the beat. Ableton: lead ch1, bass ch3, perc ch10 (kick 36 / hats 42), texture ch6 = wind (CC74 = mean speed), pad ch2.',

  init(P) {
    const as = areaScale(P), w = P.w, h = P.h, S = Math.min(w, h);
    const n = Math.min(420, Math.round(150 * as));
    const b = [];
    for (let i = 0; i < n; i++) {
      const a = P.rand() * TAU;
      b.push({
        x: P.rand() * w, y: P.rand() * h,
        vx: Math.cos(a) * 20, vy: Math.sin(a) * 20,
        r: S * (0.016 + Math.pow(P.rand(), 1.7) * 0.026),
        ph: P.rand() * TAU, lift: 0, wob: 0.6 + P.rand() * 0.9,
        // its own mind — what it does when the flock isn't telling it anything
        own: a, ownSp: (P.rand() - 0.5) * 0.7
      });
    }
    P.state = {
      b, pres: 0, head: 0, flock: 0, coh: 0, spd: 0, lanes: new Float32Array(7),
      gust: 0, gustX: 0, lastBeat: -1, win: 3, unit: S * 0.02
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, B = s.b;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    const head = clamp(inp.L) * TAU;
    s.head += Math.atan2(Math.sin(head - s.head), Math.cos(head - s.head)) * Math.min(1, dt * 4);
    s.head = (s.head % TAU + TAU) % TAU;
    s.flock += (clamp(inp.R) - s.flock) * Math.min(1, dt * 5);
    const F = s.flock;

    // ---- the gust: one pulse per beat, crossing the frame downwind ------
    if (typeof T !== 'undefined' && T.running) {
      const bt = Math.floor(T.beats());
      if (bt !== s.lastBeat) { s.lastBeat = bt; s.gust = 1; }
    }
    s.gust = Math.max(0, s.gust - dt * 1.7);
    s.gustX = 1 - s.gust;

    const hx = Math.cos(s.head), hy = Math.sin(s.head);
    const sep = s.unit * (2.5 - F * 0.9);     // the Turing spacing — this is the lattice
    const cell = sep * 1.15;
    const gw = Math.max(1, Math.ceil(w / cell)), gh = Math.max(1, Math.ceil(h / cell));
    const gkey = gw + 'x' + gh;
    const grid = s._gkey === gkey ? s._grid : (s._gkey = gkey, s._grid = new Array(gw * gh));
    for (let i = 0; i < grid.length; i++) grid[i] = null;
    for (const p of B) {
      const gx = clamp((p.x / cell) | 0, 0, gw - 1), gy = clamp((p.y / cell) | 0, 0, gh - 1);
      const k = gy * gw + gx;
      (grid[k] || (grid[k] = [])).push(p);
    }

    let ox = 0, oy = 0, spd = 0;
    const cruise = 26 + F * 120;
    for (const p of B) {
      let sx = 0, sy = 0, ax = 0, ay = 0, cxs = 0, cys = 0, cn = 0;
      const gx = clamp((p.x / cell) | 0, 0, gw - 1), gy = clamp((p.y / cell) | 0, 0, gh - 1);
      for (let ny = gy - 1; ny <= gy + 1; ny++) {
        if (ny < 0 || ny >= gh) continue;
        for (let nx = gx - 1; nx <= gx + 1; nx++) {
          if (nx < 0 || nx >= gw) continue;
          const list = grid[ny * gw + nx];
          if (!list) continue;
          for (const q of list) {
            if (q === p) continue;
            const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
            if (d2 > sep * sep || d2 < 1e-6) continue;
            const d = Math.sqrt(d2);
            const push = (1 - d / sep);
            sx -= dx / d * push; sy -= dy / d * push;      // SEPARATION — the lattice
            ax += q.vx; ay += q.vy;                        // ALIGNMENT
            cxs += q.x; cys += q.y; cn++;                  // COHESION
          }
        }
      }
      // WHOSE HEADING? Scattered, each spot follows its own nose and the
      // field has no opinion; flocked, they all take the shared one. This is
      // what makes coherence a real measurement instead of a constant.
      p.own += p.ownSp * dt;
      const ox2 = Math.cos(p.own) * (1 - F) + hx * F, oy2 = Math.sin(p.own) * (1 - F) + hy * F;
      const ol = Math.hypot(ox2, oy2) || 1;
      let dvx = ox2 / ol * cruise, dvy = oy2 / ol * cruise;
      dvx += sx * cruise * 1.5; dvy += sy * cruise * 1.5;
      if (cn) {
        const al = Math.hypot(ax, ay) || 1;
        dvx += (ax / al) * cruise * F * 1.1; dvy += (ay / al) * cruise * F * 1.1;
        const cxm = cxs / cn - p.x, cym = cys / cn - p.y;
        dvx += cxm * F * 2.2; dvy += cym * F * 2.2;
      }
      // the gust lifts each bird as the line sweeps past it
      const lane = p.x / w;
      const near = 1 - Math.min(1, Math.abs(lane - s.gustX) * 5);
      p.lift += (Math.max(0, near) * (0.4 + F * 0.6) - p.lift) * Math.min(1, dt * 9);
      dvx += hx * p.lift * cruise * 0.9; dvy += hy * p.lift * cruise * 0.9;

      p.vx += (dvx - p.vx) * Math.min(1, dt * (2.5 + F * 5));
      p.vy += (dvy - p.vy) * Math.min(1, dt * (2.5 + F * 5));
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.ph += dt * p.wob;
      if (p.x < -p.r * 2) p.x = w + p.r * 2; else if (p.x > w + p.r * 2) p.x = -p.r * 2;
      if (p.y < -p.r * 2) p.y = h + p.r * 2; else if (p.y > h + p.r * 2) p.y = -p.r * 2;
      const sp = Math.hypot(p.vx, p.vy) || 1;
      ox += p.vx / sp; oy += p.vy / sp; spd += sp;
    }
    // COHERENCE — the order parameter, straight out of the flocking literature
    const coh = Math.hypot(ox, oy) / B.length;
    s.coh += (coh - s.coh) * Math.min(1, dt * 2.2);
    s.spd += (spd / B.length / 180 - s.spd) * Math.min(1, dt * 2);

    // ---- seven lanes: where the birds are IS the melody ----------------
    const lanes = s.lanes;
    for (let i = 0; i < 7; i++) lanes[i] *= 0.72;
    for (const p of B) lanes[clamp((p.x / w * 7) | 0, 0, 6)] += 0.28;
    let win = 0, best = -1;
    for (let i = 0; i < 7; i++) if (lanes[i] > best) { best = lanes[i]; win = i; }
    s.win = win;
    s.laneStr = clamp(best / (B.length / 7) / 1.6);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, B = s.b;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#02040a';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;
    const F = s.flock;

    // (1) the atmosphere the field sits in — deep teal, the reference's ground
    g.globalCompositeOperation = 'lighter';
    for (const p of B) {
      const R = p.r * (3.4 + p.lift * 2);
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
      gr.addColorStop(0, `rgba(0,190,180,${(0.05 + p.lift * 0.08) * bright})`);
      gr.addColorStop(1, 'rgba(0,120,140,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(p.x, p.y, R, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    // (2) HALOS FIRST, bodies second — where two spots touch, the body of one
    // covers the other's halo, and the pair reads as a single worm with one
    // continuous outline. This is the whole trick of the picture.
    for (const p of B) {
      const warm = clamp(1 - p.x / w);          // warm country on the left, violet on the right
      // round the wheel the SHORT way (orange → red → magenta → violet); the
      // long way runs the middle of the frame through green
      const hue = (26 - (1 - warm) * 86 + 360) % 360;
      const R = p.r * (1.42 + p.lift * 0.3);
      g.fillStyle = `hsla(${hue},100%,${56 + p.lift * 16}%,${(0.8 + p.lift * 0.2) * bright})`;
      g.beginPath(); g.arc(p.x, p.y, R, 0, TAU); g.fill();
    }
    for (const p of B) {
      const warm = clamp(1 - p.x / w);
      const hue = 330 - warm * 16;
      const wob = 1 + Math.sin(p.ph * 2.3) * 0.05;
      const R = p.r * wob * (1 + F * 0.1);
      const gr = g.createRadialGradient(p.x - R * 0.2, p.y - R * 0.25, R * 0.1, p.x, p.y, R);
      gr.addColorStop(0, `hsla(${hue},96%,${68 + p.lift * 22}%,1)`);
      gr.addColorStop(1, `hsla(${hue - 8},94%,${46 + p.lift * 14}%,1)`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(p.x, p.y, R, 0, TAU); g.fill();
    }

    // (3) the lane that is currently sounding
    const lw = w / 7;
    g.fillStyle = `rgba(255,220,140,${(0.05 + s.laneStr * 0.07) * bright})`;
    g.fillRect(s.win * lw, 0, lw, h);

    g.fillStyle = 'rgba(255,190,120,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HEADING ' + Math.round(s.head / TAU * 360) + '°   FLOCK ' + Math.round(s.flock * 100) +
      '   COHERENCE ' + Math.round(s.coh * 100) + '   LANE ' + (s.win + 1) + '/7' +
      (s.coh > 0.62 ? '   · LOCKED' : '') + (s.pres < 0.3 ? '   · DRIFTING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the air the flock is flying through ---------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 600, 0.8), ng = v.g(0.012);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- pad: quiet, only there to glue the lanes together -------------- */
    const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.008, cutoff: 320, q: 0.6 });
    const place = glide => A.leadToChord(pad, -1, glide);
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.2);

    let nextT = T.next(0.5), lastWin = -1;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const coh = s.coh || 0, F = s.flock || 0;
        const lock = clamp((coh - 0.34) / 0.4);          // 0 scattered · 1 locked

        A.set(ng.gain, (0.006 + (s.spd || 0) * 0.03 + s.gust * 0.012) * gate, 0.2);
        A.set(nf.frequency, 300 + (s.spd || 0) * 2200 + s.gust * 1400, 0.15);
        pad.forEach(p => { p.level(0.006 + lock * 0.008, 0.5); p.bright(240 + lock * 600, 0.4); });

        /* ---- the lane melody, on every eighth ------------------------- */
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const st = Math.round((nextT - T.t0) / (T.beat * 0.5)) % 8;
          const win = s.win, str = s.laneStr || 0;
          if (lock > 0.08 && gate > 0.3) {
            const skip = (win === lastWin && st % 2 === 1 && lock < 0.55);   // holding still = leave space
            if (!skip) {
              const pan = (win / 6 * 2 - 1) * 0.8;
              const vol = (0.03 + str * 0.06 + lock * 0.04) * gate;
              A.pluck2(H.chordTone(win, win > 4 ? 1 : 0), { at: nextT, vol, dur: 0.7, pan, rev: 0.42, del: 0.2 });
              if (lock > 0.7 && st === 0) {
                A.bell(H.chordTone(win + 4, 1), { at: nextT, vol: vol * 0.5, dur: 2, pan: -pan, rev: 0.7 });
              }
            }
            lastWin = win;
          }
          /* ---- the groove is EARNED by the formation ------------------ */
          if (lock > 0.35 && gate > 0.3) {
            if (st % 4 === 0) A.bassNote(H.chordTone(0, -1), { at: nextT, vol: 0.05 + lock * 0.07, dur: 0.9 });
            A.hat(nextT, { vol: 0.008 + lock * 0.016, open: st === 6 });
          }
          if (lock > 0.72 && gate > 0.3 && (st === 0 || st === 5)) A.kick(nextT, 0.16 + lock * 0.14);
          nextT += T.beat * 0.5;
        }
        if (nextT < now) nextT = T.next(0.5);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('texture', clamp(s.spd || 0));
          MOut.expr('lead', lock);
          MOut.expr('pad', F);
        }
      },
      stop() { v.kill(); }
    };
  }
});
