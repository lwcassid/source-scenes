/* ---------- SRC-36.2 · FOAM BLOOM V2 (the ooze) ---------- */
reg({
  id: 'SRC-36.2', family: 'SRC-36', ver: 2, title: 'Foam Bloom V2', tech: 'OOZING POOLS / BUBBLED LIQUID',
  music: {
    bpm: 68, root: 45, mode: 'aeolian', chordBars: 4,
    // Same pedal on A as V1, half the tempo and twice the bar length — this
    // version is a slow room, not a machine.
    chords: [
      [0, 7, 15, 19, 26],   // Am9
      [0, 8, 15, 20, 22],   // Fmaj9/A
      [0, 5, 12, 17, 20],   // Dm11/A
      [0, 7, 14, 17, 22]    // Am11
    ],
    chordNames: ['Am9', 'Fmaj9/A', 'Dm11/A', 'Am11']
  },
  fx: { bloom: 0.3 },
  tags: ['LIQUID, NOT BUBBLES', 'IT OOZES IN FROM VENTS', 'SMALL BUBBLES, CLOSE PACKED', 'AMBIENT'],
  desc: 'Something is seeping into the frame. It comes from a handful of vents, spreading as lobed pools of crimson liquid that meet and become one body, and the body is not still — it is full of small bubbles, packed against each other the way real foam packs, rising through the film and letting go. Nothing here is big and nothing here is fast. It is a pot on a low heat, seen from directly above.',
  interact: 'R = THE OOZE. Draw in and there are two small pools in a black frame; reach out and more vents open, the pools swell, meet, and finally flood the whole frame with liquid. That is the slow hand — the shape of the picture. L = THE BOIL. It sets how hard the liquid is working: drawn in, a few bubbles drift up a minute and let go one at a time; reach out and the whole surface fizzes, every pool crowded edge to edge with small cells forming and bursting. The two are independent on purpose: a wide still flood and a small furious pool are both available, and both are worth sitting in.',
  sound: 'Ambient by design — no drums anywhere in it. Each open vent holds one pad voice (MIDI role: pad), so the chord literally thickens as the liquid spreads: two vents is an open fifth, eight is the whole voicing, and a vent opening enters rolled from the bottom. The boil is two layers: a wet bandpassed fizz whose brightness and level follow how much is bursting, and the bursts themselves — only the bigger cells are given a note, a short glass bell (bells) at the top of the ladder, panned to where it popped, landing on the next sixteenth. Small ones are heard as fizz, not as notes, which is what keeps a full boil from turning into a hailstorm. Under everything, a sub pedal on A that never moves. Ableton: pad ch2 (CC74 = ooze), bells ch5, texture ch6 = fizz (CC74 = boil), bass ch3.',

  init(P) {
    const S = Math.min(P.w, P.h), w = P.w, h = P.h;
    const big = areaScale(P) > 1.6;             // P.focused is false during init
    const U = S * 0.024;                        // bubble unit — deliberately small
    const vents = [];
    const NV = 8;
    for (let i = 0; i < NV; i++) {
      // vents sit on a jittered ring-ish spread so the pools meet as they grow
      const a = (i / NV) * TAU + P.rand() * 0.7;
      const d = (i === 0 ? 0.05 : 0.2 + P.rand() * 0.3);
      const lobes = [];
      const nl = 4 + (P.rand() * 3 | 0);
      for (let k = 0; k < nl; k++) {
        lobes.push({
          a: (k / nl) * TAU + P.rand() * 0.8, d: 0.25 + P.rand() * 0.45,
          s: 0.5 + P.rand() * 0.34, ph: P.rand() * TAU, fr: 0.09 + P.rand() * 0.16
        });
      }
      vents.push({
        x: w * (0.5 + Math.cos(a) * d * 1.5), y: h * (0.5 + Math.sin(a) * d * 1.1),
        R: 0, Rt: 0, lobes, seed: P.rand(),
        // warm country on the left, violet on the right — the side law, in liquid
        hue: 0, order: i === 0 ? 0 : P.rand()
      });
    }
    for (const v of vents) {
      v.x = clamp(v.x, w * 0.08, w * 0.92);
      v.y = clamp(v.y, h * 0.1, h * 0.9);
      v.hue = v.x < w / 2 ? 348 + P.rand() * 18 : 312 + P.rand() * 20;
    }
    vents.sort((a, b) => a.order - b.order);
    P.state = {
      vents, bub: [], flash: [], evq: [],
      unit: U, maxB: big ? 900 : 240, base: S * 0.34,
      pres: 0, ooze: 0, boil: 0, cover: 0, open: 2, popRate: 0, spawnAcc: 0, popCd: 0
    };
  },

  _mkBub(P, v) {
    const s = P.state, U = s.unit;
    const a = P.rand() * TAU, d = Math.sqrt(P.rand()) * v.R * 0.82;
    return {
      x: v.x + Math.cos(a) * d, y: v.y + Math.sin(a) * d, v,
      r: U * 0.14,
      // most cells stay small; a few make it to the size that gets a note
      cap: U * (0.45 + Math.pow(P.rand(), 2.2) * 2.4),
      ph: P.rand() * TAU, wob: 0.4 + P.rand() * 0.8,
      vx: (P.rand() - 0.5) * 4, vy: (P.rand() - 0.5) * 4,
      hue: v.hue + (P.rand() - 0.5) * 14
    };
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, U = s.unit;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.boil += (clamp(inp.L) - s.boil) * Math.min(1, dt * 6);
    s.ooze += (clamp(inp.R) - s.ooze) * Math.min(1, dt * 5);
    s.popCd = Math.max(0, s.popCd - dt);

    // ---- THE OOZE: vents open one at a time and their pools swell --------
    const wantOpen = 2 + Math.round(s.ooze * (s.vents.length - 2));
    if (wantOpen !== s.open) {
      // a vent takes a moment to commit, so the count never chatters
      s._openT = (s._openT || 0) + dt;
      if (s._openT > 0.25) {
        if (wantOpen > s.open) { s.open++; s.evq.push({ vent: 1 }); }
        else s.open--;
        s._openT = 0;
      }
    } else s._openT = 0;
    let cover = 0;
    for (let i = 0; i < s.vents.length; i++) {
      const v = s.vents[i];
      const on = i < s.open;
      v.Rt = on ? s.base * (0.3 + s.ooze * 0.95) * (0.7 + v.seed * 0.6) : 0;
      // liquid is slow: it arrives and leaves at the speed of syrup
      v.R += (v.Rt - v.R) * Math.min(1, dt * (v.Rt > v.R ? 0.5 : 0.8));
      for (const L of v.lobes) L.ph += dt * L.fr;
      cover += Math.PI * v.R * v.R * 0.85;
    }
    s.cover += (clamp(cover / (w * h) / 1.15) - s.cover) * Math.min(1, dt * 2);

    // ---- THE BOIL: cells form in the liquid, crowd, and let go ----------
    const bub = s.bub;
    // cells accumulate: they are born often and live for seconds, which is
    // what packs the liquid instead of making it fizz
    s.spawnAcc += dt * (2 + s.boil * 30) * s.cover * 3.4 * Math.sqrt(areaScale(P));
    while (s.spawnAcc > 1) {
      s.spawnAcc -= 1;
      if (bub.length >= s.maxB) break;
      // pick a pool, weighted by how much of it there is
      let tot = 0;
      for (let i = 0; i < s.open; i++) tot += s.vents[i].R * s.vents[i].R;
      if (tot <= 0) break;
      let pick = P.rand() * tot, v = s.vents[0];
      for (let i = 0; i < s.open; i++) { pick -= s.vents[i].R * s.vents[i].R; if (pick <= 0) { v = s.vents[i]; break; } }
      if (v.R < U) continue;
      bub.push(this._mkBub(P, v));
    }

    const gr = (0.025 + s.boil * 0.16) * U;
    let popped = 0;
    for (let i = bub.length - 1; i >= 0; i--) {
      const b = bub[i];
      b.ph += dt * b.wob;
      b.r += gr * dt / (0.35 + b.r / U);
      // slow wander, and the pool holds its own cells in
      b.x += b.vx * dt; b.y += b.vy * dt;
      b.vx += (Math.sin(b.ph * 1.3) * 5 - b.vx) * Math.min(1, dt * 2);
      b.vy += (Math.cos(b.ph * 1.1) * 5 - b.vy) * Math.min(1, dt * 2);
      const dx = b.x - b.v.x, dy = b.y - b.v.y, d = Math.hypot(dx, dy) || 1;
      const lim = Math.max(0, b.v.R * 0.88 - b.r);
      if (d > lim) {
        // a cell that reaches the edge of the liquid has nothing to hold it
        if (d > lim + b.r * 1.2 || b.v.R < U) { bub.splice(i, 1); continue; }
        b.x = b.v.x + dx / d * lim; b.y = b.v.y + dy / d * lim;
        b.vx *= -0.3; b.vy *= -0.3;
      }
      if (b.r >= b.cap) {
        bub.splice(i, 1);
        s.flash.push({ x: b.x, y: b.y, r: b.r, a: 1, hue: b.hue });
        if (s.flash.length > 90) s.flash.shift();
        popped++;
        // only the bigger cells are worth a note; the rest are fizz
        if (b.r > U * 0.95 && s.popCd <= 0) {
          s.popCd = 0.13;
          s.evq.push({ r: b.r / U, x: b.x / w, cap: b.cap / U });
          if (s.evq.length > 10) s.evq.shift();
        }
        continue;
      }
    }
    s.popRate += (popped / Math.max(dt, 1e-3) - s.popRate) * Math.min(1, dt * 2.5);

    // ---- packing: cells press on their neighbours ------------------------
    const cell = Math.max(6, U * 3.6);
    const gw = Math.max(1, Math.ceil(w / cell)), gh = Math.max(1, Math.ceil(h / cell));
    const gkey = gw + 'x' + gh;
    const grid = s._gkey === gkey ? s._grid : (s._gkey = gkey, s._grid = new Array(gw * gh));
    for (let i = 0; i < grid.length; i++) grid[i] = null;
    for (const b of bub) {
      const gx = clamp((b.x / cell) | 0, 0, gw - 1), gy = clamp((b.y / cell) | 0, 0, gh - 1);
      const k = gy * gw + gx;
      (grid[k] || (grid[k] = [])).push(b);
    }
    const relax = Math.min(0.5, dt * 26);
    for (let gy = 0; gy < gh; gy++) {
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
                a.x -= ux; a.y -= uy; c.x += ux; c.y += uy;
              }
            }
          }
        }
      }
    }

    for (let i = s.flash.length - 1; i >= 0; i--) {
      const f = s.flash[i];
      f.a -= dt * 3.6; f.r += dt * f.r * 1.4;
      if (f.a <= 0) s.flash.splice(i, 1);
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, U = s.unit;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#050104';
    g.fillRect(0, 0, w, h);
    const bright = 0.55 + s.pres * 0.45;

    // ---- THE LIQUID ------------------------------------------------------
    // Every lobe's dark rim is laid down FIRST and the bodies painted over
    // them, so where two pools touch the interior rims are covered and the
    // whole spill reads as one body with one edge.
    const lobesOf = v => {
      const out = [];
      for (const L of v.lobes) {
        const a = L.a + Math.sin(L.ph) * 0.22;
        const d = v.R * L.d * (1 + Math.sin(L.ph * 1.7) * 0.07);
        out.push([v.x + Math.cos(a) * d, v.y + Math.sin(a) * d, v.R * L.s * (1 + Math.sin(L.ph * 0.9) * 0.05)]);
      }
      out.push([v.x, v.y, v.R * 0.62]);
      return out;
    };
    const rim = Math.max(3.5 * ms, U * 1.1);
    for (let i = 0; i < s.open; i++) {
      const v = s.vents[i];
      if (v.R < 2) continue;
      // the crimson meniscus at the edge of the spill — deep, saturated, fat
      g.strokeStyle = `hsla(${v.hue - 4},96%,32%,${0.95 * bright})`;
      g.lineWidth = rim * 2;
      g.lineJoin = 'round';
      for (const [x, y, r] of lobesOf(v)) {
        g.beginPath(); g.arc(x, y, Math.max(1, r - rim * 0.35), 0, TAU); g.stroke();
      }
    }
    for (let i = 0; i < s.open; i++) {
      const v = s.vents[i];
      if (v.R < 2) continue;
      // FLAT, not a gradient per lobe: a gradient inside every lobe is what
      // makes a spill look like a bag of balloons instead of one liquid
      g.fillStyle = `hsla(${v.hue},78%,37%,${0.98 * bright})`;
      for (const [x, y, r] of lobesOf(v)) {
        if (r < 1) continue;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
      // one soft shine for the whole spill, not one per lobe
      const hg = g.createRadialGradient(v.x - v.R * 0.2, v.y - v.R * 0.25, v.R * 0.05, v.x, v.y, v.R);
      hg.addColorStop(0, `hsla(${v.hue + 6},80%,60%,${0.5 * bright})`);
      hg.addColorStop(1, `hsla(${v.hue},80%,60%,0)`);
      g.fillStyle = hg;
      g.beginPath(); g.arc(v.x, v.y, v.R, 0, TAU); g.fill();
    }

    // ---- THE CELLS IN IT -------------------------------------------------
    for (const b of s.bub) {
      const wob = 1 + Math.sin(b.ph * 2.2) * 0.04;
      const r = b.r * wob;
      if (r < 0.8) continue;
      const near = clamp(b.r / b.cap);                 // about to let go
      // pale film inside, deep crimson wall around it — the cell wall is the
      // drawing, exactly as it is in the reference
      const gr = g.createRadialGradient(b.x - r * 0.25, b.y - r * 0.3, r * 0.05, b.x, b.y, r);
      gr.addColorStop(0, `hsla(${b.hue + 10},92%,${80 + near * 14}%,${0.96 * bright})`);
      gr.addColorStop(0.72, `hsla(${b.hue + 4},90%,${72 + near * 14}%,${0.94 * bright})`);
      gr.addColorStop(1, `hsla(${b.hue},90%,${60 + near * 12}%,${0.94 * bright})`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(b.x, b.y, r, 0, TAU); g.fill();
      g.lineWidth = Math.max(2 * ms, r * 0.32);
      g.strokeStyle = `hsla(${b.hue - 6},98%,${22 + near * 16}%,${0.97 * bright})`;
      g.beginPath(); g.arc(b.x, b.y, r * 0.86, 0, TAU); g.stroke();
    }

    // ---- the craters they leave ------------------------------------------
    g.globalCompositeOperation = 'lighter';
    for (const f of s.flash) {
      g.lineWidth = Math.max(1.2 * ms, f.r * 0.3 * f.a);
      g.strokeStyle = `hsla(${f.hue + 6},96%,82%,${f.a * 0.5 * bright})`;
      g.beginPath(); g.arc(f.x, f.y, f.r * (1 + (1 - f.a) * 0.7), 0, TAU); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(255,175,205,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('VENTS ' + s.open + '/' + s.vents.length + '   OOZE ' + Math.round(s.ooze * 100) +
      '   BOIL ' + Math.round(s.boil * 100) + '   CELLS ' + s.bub.length +
      '   BURSTS/S ' + s.popRate.toFixed(1) + (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the wet fizz: what the small cells are, all together ----------- */
    const n1 = v.noise(), f1 = v.filter('bandpass', 1400, 0.9), g1 = v.g(0.004);
    const n2 = v.noise(), f2 = v.filter('highpass', 4200, 0.7), g2 = v.g(0.002);
    n1.connect(f1); f1.connect(g1); g1.connect(v.group);
    n2.connect(f2); f2.connect(g2); g2.connect(v.group);

    /* --- ONE PAD VOICE PER OPEN VENT: the chord thickens as it spreads -- */
    const NV = 8;
    const pads = A.padVoices(v, NV, { type: 'triangle', gain: 0.0001, cutoff: 340, q: 0.6 });
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.012, cutoff: 180, q: 0.5 });
    const place = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      for (let i = 0; i < NV; i++) pads[i].set(H.chordTone(i, i > 4 ? 0 : -1), glide + i * 0.01);
    };
    place(0.05);
    H.onChord(() => place(0.2));
    v.fadeIn(1, 2);

    let lastOpen = 2;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const boil = s.boil || 0, cover = s.cover || 0;

        // the fizz IS the small cells — it follows how much is bursting
        const fz = clamp((s.popRate || 0) / 30);
        A.set(g1.gain, (0.002 + fz * 0.016 + boil * cover * 0.006) * gate, 0.25);
        A.set(f1.frequency, 700 + fz * 2200 + boil * 900, 0.3);
        A.set(g2.gain, (0.0004 + fz * 0.005) * gate, 0.25);
        sub[0].level(0.008 + cover * 0.01, 0.6);

        /* ---- a voice for every open vent --------------------------------
           Two vents is an open fifth in the frame; eight is the whole
           voicing. The spread of the liquid IS the voicing.               */
        for (let i = 0; i < NV; i++) {
          const on = i < s.open;
          pads[i].level(on ? (0.012 - i * 0.0008) * (0.4 + cover * 0.6) * gate : 0.0001, 0.9);
          pads[i].bright(200 + cover * 300 + boil * 260, 0.5);
        }
        if (s.open > lastOpen) {
          // a new vent arrives rolled from the bottom, never as a block
          const at = T.next(0.5);
          A.bassNote(H.chordTone(0, -1), { at, vol: 0.05 * gate, dur: 3 });
          for (let k = 0; k < 3; k++) {
            A.bell(H.chordTone(s.open + k * 2, 0), { at: at + k * 0.09, vol: 0.024 * gate, dur: 3.4, pan: (s.open % 2 ? 0.4 : -0.4), rev: 0.8 });
          }
        }
        lastOpen = s.open;

        /* ---- only the bigger cells get a note --------------------------- */
        let ev, i2 = 0;
        while ((ev = s.evq.shift()) && i2 < 3) {
          i2++;
          if (ev.vent) continue;
          const at = T.next(0.25);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.7;
          const k = clamp((ev.r - 0.6) / 1.3);
          const idx = Math.round(12 - k * 7);
          A.bell(H.chordTone(idx, 1), { at, vol: (0.016 + (1 - k) * 0.016) * gate, dur: 1.6 + k * 1.4, pan, rev: 0.75 });
          A.hit({ at, vol: 0.02 + k * 0.03, dur: 0.05, freq: 3200 - k * 1600, q: 1.4, pan });
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', cover);
          MOut.expr('texture', boil);
          MOut.expr('bells', fz);
        }
      },
      stop() { v.kill(); }
    };
  }
});
