/* ---------- SRC-36 · FOAM BLOOM (breath in, skin out) ---------- */
reg({
  id: 'SRC-36', family: 'SRC-36', ver: 1, title: 'Foam Bloom', tech: 'PACKED FOAM / INFLATE + BURST',
  music: {
    bpm: 92, root: 45, mode: 'aeolian', chordBars: 2,
    // A PEDAL ON A. The root never moves — only the colour of the film over it,
    // so the foam can pop for ten minutes and never leave the key.
    chords: [
      [0, 7, 15, 19, 26],   // Am9        — open, breathing
      [0, 5, 12, 17, 20],   // Dm11/A     — the film thickens
      [0, 8, 15, 20, 22],   // Fmaj9/A    — the softest place on the pedal
      [0, 7, 14, 17, 22]    // Am11       — back to air
    ],
    chordNames: ['Am9', 'Dm11/A', 'Fmaj9/A', 'Am11']
  },
  fx: { bloom: 0.4 },
  tags: ['SOAP FOAM', 'BLOW IT UP UNTIL IT BURSTS', 'BIG = LOW', 'CRIMSON / VIOLET'],
  desc: 'A crimson soap foam packed edge to edge, every cell pressing on its neighbours. It is one closed system: air you push in has to go somewhere, so the film swells, the small cells get squeezed into the seams, and the big ones climb until their skin gives out and throws a crown of children across the frame. The colony is never still and never the same twice, but it is always the same foam — you are only ever choosing how hard you blow and how thin the skin is.',
  interact: 'L = BREATH — how hard you blow into the bed. Reach out and every cell inflates, the seams stretch, and the whole colony crowds toward the edges of the frame. R = SKIN — how thin the film is stretched. Drawn in, the skin is thick: one bubble can grow until it owns half the picture, and you can hear it descending the whole way. Reach out and the skin is gossamer: nothing survives past a couple of inches and the frame is a permanent shower of bursting cells. The two hands play against each other — hard breath into thin skin is a rolling boil, gentle breath into thick skin is a single enormous bubble you can nurse for half a minute. The cell about to go always announces itself: its rim goes white and it shivers for a beat before it bursts.',
  sound: 'A bubble sounds at the pitch its size allows: big is low, small is high, exactly as the physics does it. The GROWING GIANT is the money voice — the largest cell in the frame is a sustained bowed note (MIDI role: texture) that glides DOWNWARD the whole time it inflates and cuts off dead the instant it bursts, so the drop is a real drop. Every burst lands on the next 16th: small cells ring as glass bells (bells) at the top of the ladder, mid cells as plucks (lead), and a big burst drops a soft sub thump (bass) plus the noise of the film tearing. The bed is the foam itself — bandpassed hiss that opens with how crowded the colony is — over a pedal A that never moves. Percussion is EARNED: hats only once the bed is genuinely crowded, and a kick only when something huge lets go. Ableton: texture ch6 = the giant (map CC74 to filter — it opens as the bubble grows), bells ch5, lead ch1, bass ch3, perc ch10.',

  _pop(P, b, hard, popR) {
    const s = P.state;
    // the crown: a burst throws its film out as a ring of children
    const n = hard ? 5 + (P.rand() * 3 | 0) : 3 + (P.rand() * 2 | 0);
    const cr = b.r * (0.24 + P.rand() * 0.1);
    for (let i = 0; i < n; i++) {
      if (s.bub.length >= s.maxN) break;
      const a = (i / n) * TAU + P.rand() * 0.5;
      const d = b.r * (0.62 + P.rand() * 0.3);
      const c = this._mk(P, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, cr * (0.6 + P.rand() * 0.8));
      // a child is born WELL under its own limit — otherwise a burst
      // detonates its own children and the frame chain-reacts. Most of them
      // are under the critical radius too, so the crown mostly dissolves
      // back into the film, exactly as the tiny clusters in real foam do.
      c.r = Math.min(c.r, Math.max(s.unit * 0.34, popR * c.capF) * 0.28);
      s.bub.push(c);
    }
    // and shoves its neighbours out of the hole it leaves
    for (const o of s.bub) {
      const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < 1e-4 || d2 > b.r * b.r * 6) continue;
      const d = Math.sqrt(d2), f = (1 - d / (b.r * 2.45)) * b.r * 0.5;
      if (f > 0) { o.x += dx / d * f; o.y += dy / d * f; }
    }
    s.flash.push({ x: b.x, y: b.y, r: b.r, a: 1, hue: b.hue });
    if (s.flash.length > 60) s.flash.shift();
    s.evq.push({ r: b.r / s.unit, x: b.x / P.w, hard: !!hard });
    if (s.evq.length > 14) s.evq.shift();
  },
  _mk(P, x, y, r) {
    return {
      x, y, r, ph: P.rand() * TAU, wob: 0.5 + P.rand() * 0.9,
      hue: x < P.w / 2 ? 350 + P.rand() * 24 : 306 + P.rand() * 22,   // L warm crimson · R violet
      // HOW BIG THIS ONE CAN EVER GET, as a fraction of what the skin allows.
      // Heavy-tailed on purpose: most cells stay small, a few become the
      // giants — that size spread IS what foam looks like.
      capF: 0.2 + Math.pow(P.rand(), 2.2) * 1.05,
      born: 0, shiver: 0
    };
  },

  init(P) {
    const S = Math.min(P.w, P.h);
    // NOTE: P.focused is still false while init runs (focus mode sets it after
    // the instance is built) — size off the actual area, never off the flag.
    const big = areaScale(P) > 1.6;
    P.state = {
      bub: [], flash: [], evq: [],
      unit: S * 0.05,
      maxN: big ? 340 : 120,
      pres: 0, feed: 0.2, frag: 0.3, dens: 0, spawnAcc: 0, popCd: 0,
      bigR: 0, bigX: 0.5, bigLoad: 0, popRate: 0
    };
    const s = P.state;
    for (let i = 0; i < (big ? 70 : 26); i++) {
      const a = P.rand() * TAU, d = P.rand() * S * 0.42;
      s.bub.push(this._mk(P, P.w / 2 + Math.cos(a) * d, P.h / 2 + Math.sin(a) * d * 0.8,
        s.unit * (0.35 + P.rand() * 0.9)));
    }
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, U = s.unit;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // hands couple straight through — nothing waits for the grid
    s.feed += (inp.L - s.feed) * Math.min(1, dt * 7);
    s.frag += (inp.R - s.frag) * Math.min(1, dt * 7);

    // SKIN: fragile means a cell can barely get going before it lets go
    const popR = U * (4.2 - s.frag * 3.0);
    // OSTWALD RIPENING is what makes this look like foam and not like a
    // bubble machine: above the critical radius a cell steals air from its
    // neighbours and grows, below it, it gives its air up and disappears.
    // Only a handful of cells are ever on their way to bursting.
    const rc = U * (0.28 + s.feed * 0.6);
    // a packed frame has nowhere to expand into: the foam finds an
    // equilibrium instead of boiling forever
    const gr = (0.5 + s.feed * 1.6) * U * (1 - s.dens * 0.62);
    const bub = s.bub;
    s.popCd = Math.max(0, s.popCd - dt);

    // ---- grow, ripen, burst -------------------------------------------
    let big = null, bigR = 0, popped = 0;
    for (let i = bub.length - 1; i >= 0; i--) {
      const b = bub[i];
      b.born += dt;
      b.r += gr * (1 - rc / Math.max(b.r, U * 0.02)) * dt / (0.5 + b.r / U);
      if (b.r < U * 0.06) { bub.splice(i, 1); continue; }
      const lim = Math.max(U * 0.34, popR * b.capF);
      // A CELL TOO SMALL TO BURST just stops growing and stays in the film —
      // curvature holds it together. That is what packs the frame: a bed of
      // little stable cells with the few big ones bursting out of it.
      const stable = lim < U * 0.62;
      if (stable && b.r > lim) b.r = lim;
      // TELEGRAPH: the last stretch before the skin gives is visible and
      // audible — the cell shivers and its rim whitens for a beat first.
      b.shiver = stable ? 0 : clamp((b.r / lim - 0.93) / 0.07);
      const spont = stable ? 0 : s.frag * s.frag * 0.04 * (b.r / U) * dt;
      if ((!stable && b.r > lim) || P.rand() < spont) {
        if (s.popCd > 0) continue;
        bub.splice(i, 1);
        this._pop(P, b, b.r > U * 1.7, popR);
        // bursts are events, not a texture: a rolling boil still tops out
        // at something a drummer could play
        // just enough spacing that two bursts never land on the same sample —
        // any longer and cells QUEUE at their limit, and a frame full of
        // cells frozen at white heat is not foam, it is a headlight
        // …and a brake that leans in when the boil gets ahead of the music
        s.popCd = 0.035 + clamp((s.popRate - 6) / 14) * 0.45;
        popped++;
        continue;
      }
      if (b.r > bigR) { bigR = b.r; big = b; }
    }
    s.bigR = bigR / U;
    s.bigX = big ? big.x / w : 0.5;
    s.bigLoad = big ? clamp(big.r / Math.max(U * 0.34, popR * big.capF)) : 0;
    s.popRate += (popped / Math.max(dt, 1e-3) - s.popRate) * Math.min(1, dt * 3);

    // ---- packing: everybody presses on everybody -----------------------
    // uniform hash grid so a full frame of foam stays cheap
    // cell ≥ the largest possible diameter, so ±1 neighbour reaches every contact
    const cell = Math.max(10, popR * 2.4);
    const gw = Math.max(1, Math.ceil(w / cell)), gh = Math.max(1, Math.ceil(h / cell));
    const gkey = gw + 'x' + gh;
    const grid = s._gkey === gkey ? s._grid : (s._gkey = gkey, s._grid = new Array(gw * gh));
    for (let i = 0; i < grid.length; i++) grid[i] = null;
    for (const b of bub) {
      const gx = clamp((b.x / cell) | 0, 0, gw - 1), gy = clamp((b.y / cell) | 0, 0, gh - 1);
      const k = gy * gw + gx;
      (grid[k] || (grid[k] = [])).push(b);
    }
    const relax = Math.min(0.55, dt * 34);   // positional correction, not a force
    for (let pass = 0; pass < 2; pass++) for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const here = grid[gy * gw + gx];
        if (!here) continue;
        for (let ny = gy; ny <= gy + 1; ny++) {
          for (let nx = gx - 1; nx <= gx + 1; nx++) {
            if (ny >= gh || nx < 0 || nx >= gw || (ny === gy && nx < gx)) continue;
            const there = grid[ny * gw + nx];
            if (!there) continue;
            for (const a of here) {
              for (const c of there) {
                if (a === c) continue;
                const dx = c.x - a.x, dy = c.y - a.y;
                const rr = a.r + c.r, d2 = dx * dx + dy * dy;
                if (d2 >= rr * rr || d2 < 1e-6) continue;
                const d = Math.sqrt(d2), ov = (rr - d) * 0.5 * relax;
                const ux = dx / d * ov, uy = dy / d * ov;
                // heavy cells hold their ground, small ones get squeezed into the seams
                const wa = c.r / rr, wc = a.r / rr;
                a.x -= ux * wa * 2; a.y -= uy * wa * 2;
                c.x += ux * wc * 2; c.y += uy * wc * 2;
              }
            }
          }
        }
      }
    }
    // the frame is the dish — the foam presses against it
    for (const b of bub) {
      b.ph += dt * b.wob;
      if (b.x < b.r * 0.55) b.x += (b.r * 0.55 - b.x) * Math.min(1, dt * 8);
      if (b.x > w - b.r * 0.55) b.x -= (b.x - (w - b.r * 0.55)) * Math.min(1, dt * 8);
      if (b.y < b.r * 0.55) b.y += (b.r * 0.55 - b.y) * Math.min(1, dt * 8);
      if (b.y > h - b.r * 0.55) b.y -= (b.y - (h - b.r * 0.55)) * Math.min(1, dt * 8);
    }

    // ---- new film: breath makes cells, and the shower needs feeding -----
    s.spawnAcc += dt * (1.2 + s.feed * 5 + s.frag * 4) * Math.sqrt(areaScale(P));
    while (s.spawnAcc > 1) {
      s.spawnAcc -= 1;
      if (bub.length >= s.maxN) break;
      // new film can only appear in a GAP — a full frame of foam refuses it.
      // It is born just above the critical radius, or the ripening would eat
      // it before it ever became a cell.
      const nr = rc * (1.12 + P.rand() * 0.55);
      for (let tries = 0; tries < 4; tries++) {
        const x = P.rand() * w, y = P.rand() * h;
        let free = true;
        for (const b of bub) {
          const dx = b.x - x, dy = b.y - y, rr = b.r + nr * 0.5;
          if (dx * dx + dy * dy < rr * rr) { free = false; break; }
        }
        if (free) {
          const b2 = this._mk(P, x, y, nr);
          // whatever the skin allows, a new cell always gets room to grow
          b2.capF = Math.max(b2.capF, nr * 1.9 / popR);
          bub.push(b2);
          break;
        }
      }
    }

    // how crowded is it — the number the bed listens to
    let area = 0;
    for (const b of bub) area += b.r * b.r;
    s.dens += (clamp(area * Math.PI / (w * h) / 1.5) - s.dens) * Math.min(1, dt * 2.5);

    for (let i = s.flash.length - 1; i >= 0; i--) {
      const f = s.flash[i];
      f.a -= dt * 3.4; f.r += dt * f.r * 1.9;
      if (f.a <= 0) s.flash.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, U = s.unit;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = 'rgba(5,1,7,0.62)';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;

    for (const b of s.bub) {
      const wob = 1 + Math.sin(b.ph * 2.1) * 0.02 + b.shiver * Math.sin(t * 42 + b.ph) * 0.035;
      const r = b.r * wob;
      if (r < 1) continue;
      const heat = b.shiver;                       // about to go
      const lum = 46 + heat * 36;
      const sat = 90 - heat * 16;
      // the wet body — pale film, brightest just inside the rim
      const gr = g.createRadialGradient(b.x - r * 0.22, b.y - r * 0.26, r * 0.05, b.x, b.y, r);
      gr.addColorStop(0, `hsla(${b.hue},${sat}%,${Math.min(96, lum + 30)}%,${(0.035 + heat * 0.13) * bright})`);
      gr.addColorStop(0.62, `hsla(${b.hue},${sat}%,${lum}%,${(0.05 + heat * 0.11) * bright})`);
      gr.addColorStop(1, `hsla(${b.hue},${sat}%,${lum + 14}%,${(0.24 + heat * 0.4) * bright})`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(b.x, b.y, r, 0, TAU); g.fill();
      // the rim — fat, because mesh eats thin lines, but the frame gets
      // washed out fast if every rim is a headlight
      g.lineWidth = Math.max(1.6 * ms, Math.min(r * 0.15, 11 * ms));
      g.strokeStyle = `hsla(${b.hue},${sat}%,${52 + heat * 40}%,${(0.4 + heat * 0.5) * bright})`;
      g.beginPath(); g.arc(b.x, b.y, r * 0.985, 0, TAU); g.stroke();
      // the catchlight — one white arc is what makes it read as a BUBBLE
      if (r > U * 0.34) {
        g.lineWidth = Math.max(1.2 * ms, Math.min(r * 0.08, 6 * ms));
        g.strokeStyle = `rgba(255,244,250,${(0.18 + heat * 0.5) * bright})`;
        g.beginPath(); g.arc(b.x, b.y, r * 0.74, TAU * 0.56, TAU * 0.78); g.stroke();
      }
    }

    // bursts: the hole left behind, thrown outward
    for (const f of s.flash) {
      g.lineWidth = Math.max(1.6 * ms, f.r * 0.11 * f.a);
      g.strokeStyle = `hsla(${f.hue},86%,${64 + f.a * 26}%,${f.a * 0.6 * bright})`;
      g.beginPath(); g.arc(f.x, f.y, f.r * (1.05 + (1 - f.a) * 0.35), 0, TAU); g.stroke();
      g.fillStyle = `rgba(255,236,246,${f.a * f.a * 0.3 * bright})`;
      g.beginPath(); g.arc(f.x, f.y, f.r * 0.16 * f.a, 0, TAU); g.fill();
    }

    g.fillStyle = 'rgba(255,170,205,0.8)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('CELLS ' + s.bub.length + '   BREATH ' + Math.round(s.feed * 100) +
      '   SKIN ' + Math.round(s.frag * 100) + '   BIGGEST ' + s.bigR.toFixed(1) +
      '   BURSTS/S ' + s.popRate.toFixed(1) + (s.pres < 0.3 ? '   · RESTING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the foam itself: film hiss, two bands ------------------------- */
    const n1 = v.noise(), fb1 = v.filter('bandpass', 700, 1.1), hg1 = v.g(0.008);
    const n2 = v.noise(), fb2 = v.filter('highpass', 3200, 0.7), hg2 = v.g(0.003);
    n1.connect(fb1); fb1.connect(hg1); hg1.connect(v.group);
    n2.connect(fb2); fb2.connect(hg2); hg2.connect(v.group);

    /* --- put a section on its own MIDI channel ------------------------- */
    const route = (voices, role, vel) => voices.forEach(vc => {
      const base = vc.set.bind(vc);
      vc.set = function (freq, glide) {
        if (isFinite(freq) && freq > 20 && typeof MOut !== 'undefined') {
          const note = MOut.f2n(freq);
          if (vc._rNote !== note) {
            const ch = MOut.chFor(role), p = performance.now();
            if (vc._rNote !== undefined && MOut.wants() && MOut.port) {
              try { MOut.port.send([0x80 | (ch - 1), vc._rNote, 0], p); } catch (e) {}
            }
            vc._rNote = note;
            MOut.log.push({ p, role, ch, note, vel, durMs: 900 });
            if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, vel], p); } catch (e) {} }
          }
          vc._mNote = note;
        }
        base(freq, glide);
      };
    });

    /* --- THE GIANT: one voice for the largest cell in the frame --------
       It glides DOWN the whole time the bubble inflates and is cut off the
       instant the bubble bursts. Everything else in the scene is decoration
       around this one gesture.                                            */
    const giant = A.padVoices(v, 2, { type: 'triangle', gain: 0.0001, cutoff: 400, q: 1.6 });
    route(giant, 'texture', 70);

    /* --- the pedal: the room the foam sits in -------------------------- */
    const bed = A.padVoices(v, 3, { type: 'triangle', gain: 0.008, cutoff: 300, q: 0.6 });
    const place = glide => {
      A.leadToChord(bed, -1, glide);
    };
    place(0.05);
    H.onChord(() => place(0.18));   // snap, never a 1.6s jet takeoff
    v.fadeIn(1, 1.4);

    let nextT = T.next(1), gFreq = 0, lastKick = -9;
    return {
      tick(inp, dt) {
        const s = P.state;
        const now = A.t();
        const gate = s.pres;
        const dens = s.dens || 0;

        /* ---- film hiss: crowding opens it ---------------------------- */
        A.set(hg1.gain, (0.004 + dens * 0.02 + (s.feed || 0) * 0.008) * (0.35 + gate * 0.65), 0.25);
        A.set(fb1.frequency, 420 + dens * 900 + (s.frag || 0) * 700, 0.3);
        A.set(hg2.gain, (0.0006 + (s.popRate || 0) * 0.0016) * (0.35 + gate * 0.65), 0.2);
        bed.forEach(b => {
          b.level(0.006 + dens * 0.008, 0.5);
          b.bright(200 + dens * 380, 0.4);
        });

        /* ---- THE GIANT ------------------------------------------------
           Size → pitch, the way a bubble actually works: the bigger the
           cell the lower it speaks. The ladder keeps it in the chord, so
           a descent through the whole frame is still music.              */
        const bigR = s.bigR || 0;                        // in cell units
        const k = clamp((bigR - 0.45) / 2.6);            // 0 = nothing, 1 = enormous
        const idx = Math.round(9 - k * 9);
        const f = H.chordTone(idx, k > 0.62 ? -1 : 0);
        if (f !== gFreq) { gFreq = f; giant.forEach((vc, i) => vc.set(f * (i ? 1.005 : 1), 0.16)); }
        const gv = k * k;
        giant.forEach((vc, i) => {
          vc.level(gv * (0.032 - i * 0.008) * (0.3 + gate * 0.7), 0.12);
          vc.bright(240 + k * 900 + (s.bigLoad || 0) * 700, 0.2);
        });

        /* ---- BURSTS: every one lands on the next 16th ---------------- */
        let ev, fired = 0;
        while ((ev = s.evq.shift()) && fired < 3) {
          fired++;
          const at = T.next(0.25);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.75;
          const kk = clamp((ev.r - 0.35) / 2.4);          // how big it was
          const i2 = Math.round(10 - kk * 10);
          const vol = (0.03 + kk * 0.12) * (0.35 + gate * 0.65);
          if (kk < 0.28) {
            A.bell(H.chordTone(i2 + 4, 1), { at, vol: vol * 0.7, dur: 1.5, pan, rev: 0.6 });
          } else if (kk < 0.62) {
            A.pluck2(H.chordTone(i2, 0), { at, vol, dur: 0.9, pan, rev: 0.4, del: 0.16 });
          } else {
            A.bassNote(H.chordTone(0, -1), { at, vol: vol * 0.9, dur: 1.4 });
            A.pluck2(H.chordTone(i2 + 2, 0), { at, vol: vol * 0.7, dur: 1.2, pan, rev: 0.5 });
            if (dens > 0.42 && now - lastKick > 0.55) { lastKick = now; A.kick(at, 0.16 + kk * 0.12); }
          }
          // the film tearing
          A.hit({ at, vol: 0.05 + kk * 0.1, dur: 0.05 + kk * 0.12, freq: 2600 - kk * 1800, q: 0.8, pan });
        }

        /* ---- QUANTIZED: hats are EARNED by a crowded bed -------------- */
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const st = Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16;
          if (dens > 0.5 && gate > 0.25) {
            if (st % 4 === 2) A.hat(nextT, { vol: 0.012 + dens * 0.02 });
            if (dens > 0.72 && st % 4 === 0) A.hat(nextT, { vol: 0.008, open: st === 12 });
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(1);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('texture', k);
          MOut.expr('pad', dens);
          MOut.expr('bells', clamp((s.popRate || 0) / 6));
        }
      },
      stop() { v.kill(); }
    };
  }
});
