/* ---------- SRC-41 · POUR CELLS (two notes becoming one) ---------- */
reg({
  id: 'SRC-41', family: 'SRC-41', ver: 1, title: 'Pour Cells', tech: 'COALESCING CELLS / AREA = PITCH',
  music: {
    bpm: 72, root: 38, mode: 'aeolian', chordBars: 4,
    chords: [
      [0, 7, 15, 22, 26],   // Dm9
      [0, 10, 15, 19, 24],  // Dm7
      [0, 8, 15, 19, 24],   // B♭maj7/D
      [0, 5, 12, 17, 22]    // Gsus/D
    ],
    chordNames: ['Dm9', 'Dm7', 'B♭maj7/D', 'Gsus/D']
  },
  fx: { bloom: 0.38 },
  tags: ['ACRYLIC POUR', 'AREA IS PITCH — BIG IS LOW', 'MERGE = TWO VOICES BECOMING ONE', 'CORAL LACING'],
  desc: 'Paint poured onto paint. Cells push up through the film, crowd each other, and where the lacing between two of them finally fails they coalesce — one bigger cell where two used to be, area exactly conserved. Big cells are dark deep lakes, small ones are bright and busy, and the coral lacing that separates them is the brightest thing in the frame, right up until it breaks. The picture is a system that always runs downhill toward fewer and larger, and you are the reason it never gets there.',
  interact: 'L = POUR. New cells push up out of the film and everything already there swells. Reach out and the frame fills with bright small cells crowding at their seams; draw in and the pour stops and the field only coarsens. R = LACING. Drawn in, the lacing between cells is strong: they can press until they are hexagons and never merge, and the field stays a fine mosaic. Reach out and the lacing gives at the first touch — the field collapses into a handful of enormous slow lakes, and you hear the whole thing sag as it does. The two hands are a balance you can hold anywhere: heavy pour into weak lacing is a boiling, endlessly merging field; light pour into strong lacing is a still mosaic you can leave running.',
  sound: 'Area is pitch: every cell is a voice and the bigger it is the lower it speaks, exactly the way a bubble does. The six largest cells in the frame hold sustained voices (MIDI role: pad); as a cell swells its voice glides down, so growth is audible as a slow sag. A MERGE is the event the whole scene is built on — two voices resolve into one, and the survivor is struck by a soft mallet (bells) with a sub bloom (bass) underneath, dropped a chord tone or two by the area it just swallowed. Small unvoiced cells that merge fire droplet plinks (lead) on the next sixteenth. Underneath, a wet bed: filtered noise for the film and a pedal on D. No drums — the merges make their own rhythm, and it is a good one. Ableton: pad ch2 (CC74 = pour), bells ch5, bass ch3, lead ch1, texture ch6.',

  _mk(P, x, y, r) {
    return {
      x: x, y: y, r: r, ph: P.rand() * TAU, wob: 0.4 + P.rand() * 0.8, born: 0, flash: 0,
      // how hard this cell pushes up through the film — heavy-tailed, so the
      // frame gets a real range of sizes instead of a lattice of equals
      gk: 0.3 + Math.pow(P.rand(), 1.7) * 1.7,
      id: (P.state && P.state.nid !== undefined) ? P.state.nid++ : 0
    };
  },

  init(P) {
    const S = Math.min(P.w, P.h);
    // P.focused is still false during init — size off the area instead
    const big = areaScale(P) > 1.6;
    P.state = {
      cells: [], lace: [], evq: [], nid: 1,
      unit: S * 0.05, maxN: big ? 105 : 45,
      pres: 0, pour: 0, weak: 0, mergeCd: 0, big: 0, area: 0
    };
    const s = P.state;
    for (let i = 0; i < (big ? 54 : 26); i++) {
      s.cells.push(this._mk(P, P.rand() * P.w, P.rand() * P.h, s.unit * (0.25 + P.rand() * 0.55)));
    }
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, U = s.unit, C = s.cells;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.pour += (clamp(inp.L) - s.pour) * Math.min(1, dt * 6);
    s.weak += (clamp(inp.R) - s.weak) * Math.min(1, dt * 6);
    s.mergeCd = Math.max(0, s.mergeCd - dt);

    // ---- swell -------------------------------------------------------
    for (const c of C) {
      c.born += dt; c.ph += dt * c.wob;
      // a full frame has nowhere left to swell into
      c.r += (0.04 + s.pour * 0.5) * c.gk * (1 - s.area * 0.7) * U * dt / (0.35 + c.r / U);
      c.flash = Math.max(0, c.flash - dt * 2.4);
      if (c.r > U * 5.5) c.r = U * 5.5;
    }

    // ---- press, and where the lacing fails, coalesce -------------------
    const cell = Math.max(12, U * 12);
    const gw = Math.max(1, Math.ceil(w / cell)), gh = Math.max(1, Math.ceil(h / cell));
    const gkey = gw + 'x' + gh;
    const grid = s._gkey === gkey ? s._grid : (s._gkey = gkey, s._grid = new Array(gw * gh));
    for (let i = 0; i < grid.length; i++) grid[i] = null;
    for (const c of C) {
      const gx = clamp((c.x / cell) | 0, 0, gw - 1), gy = clamp((c.y / cell) | 0, 0, gh - 1);
      const k = gy * gw + gx;
      (grid[k] || (grid[k] = [])).push(c);
    }
    const relax = Math.min(0.5, dt * 30);
    const dead = new Set();
    s.lace.length = 0;
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
              if (dead.has(a)) continue;
              for (const b of there) {
                if (a === b || dead.has(b)) continue;
                const dx = b.x - a.x, dy = b.y - a.y;
                const rr = a.r + b.r, d2 = dx * dx + dy * dy;
                if (d2 >= rr * rr || d2 < 1e-6) continue;
                const d = Math.sqrt(d2), ov = rr - d;
                // the seam between them — this is the coral lacing
                const k2 = a.r / rr;
                s.lace.push([a.x + dx * k2, a.y + dy * k2, Math.min(a.r, b.r), Math.min(1, ov / (Math.min(a.r, b.r) + 1e-3))]);
                // THE FILM FAILS. Weak lacing goes at first contact; strong
                // lacing lets them press until they are hexagons.
                const give = ov > Math.min(a.r, b.r) * (1.02 - s.weak);
                if (give && s.mergeCd <= 0) {
                  const big = a.r >= b.r ? a : b, small = a.r >= b.r ? b : a;
                  const A1 = big.r * big.r, A2 = small.r * small.r;
                  const nr = Math.sqrt(A1 + A2);
                  big.x = (big.x * A1 + small.x * A2) / (A1 + A2);
                  big.y = (big.y * A1 + small.y * A2) / (A1 + A2);
                  big.r = nr; big.flash = 1;
                  dead.add(small);
                  // merges are EVENTS: even a collapsing field stays playable
                  s.mergeCd = 0.22 + (1 - s.weak) * 0.6;
                  s.evq.push({ r: nr / U, small: small.r / U, x: big.x / w, y: big.y / h });
                  continue;
                }
                const push = ov * 0.5 * relax;
                const ux = dx / d * push, uy = dy / d * push;
                const wa = b.r / rr, wb = a.r / rr;
                a.x -= ux * wa * 2; a.y -= uy * wa * 2;
                b.x += ux * wb * 2; b.y += uy * wb * 2;
              }
            }
          }
        }
      }
    }
    if (dead.size) {
      for (let i = C.length - 1; i >= 0; i--) if (dead.has(C[i])) C.splice(i, 1);
    }
    if (s.evq.length > 12) s.evq.splice(0, s.evq.length - 12);
    if (s.lace.length > 900) s.lace.length = 900;

    // ---- the pour: new cells push up through the film ------------------
    s.acc = (s.acc || 0) + dt * (0.4 + s.pour * 5.5 + (C.length < 12 ? 5 : 0)) * Math.sqrt(areaScale(P));
    while (s.acc > 1) {
      s.acc -= 1;
      if (C.length >= s.maxN) break;
      C.push(this._mk(P, P.rand() * w, P.rand() * h, U * (0.09 + P.rand() * 0.12)));
    }
    // the frame holds the paint in
    let area = 0, big = 0;
    for (const c of C) {
      c.x = clamp(c.x, c.r * 0.4, w - c.r * 0.4);
      c.y = clamp(c.y, c.r * 0.4, h - c.r * 0.4);
      area += c.r * c.r;
      if (c.r > big) big = c.r;
    }
    s.area = clamp(area * Math.PI / (w * h) / 1.35);
    s.big = big / U;
    // rank: the six biggest hold the voices
    s.rank = C.slice().sort((a, b) => b.r - a.r).slice(0, 6);
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, U = s.unit;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#01050c';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;

    // ---- the cells: coral country on the left, deep blue on the right
    for (const c of s.cells) {
      const wob = 1 + Math.sin(c.ph * 1.7) * 0.03;
      const r = c.r * wob;
      const warm = clamp(1 - c.x / w);
      // blue → violet → coral. Going the OTHER way round the wheel runs the
      // middle of the frame through green, which is not a colour paint does.
      const hue = (196 + warm * 172) % 360;
      const small = clamp(1 - c.r / (U * 2.2));     // small cells are the bright ones
      const gr = g.createRadialGradient(c.x - r * 0.25, c.y - r * 0.3, r * 0.05, c.x, c.y, r);
      gr.addColorStop(0, `hsla(${hue + 12},${72 + small * 20}%,${20 + small * 20 + c.flash * 22}%,${0.97 * bright})`);
      gr.addColorStop(0.72, `hsla(${hue},80%,${11 + small * 12 + c.flash * 14}%,${0.95 * bright})`);
      gr.addColorStop(1, `hsla(${hue - 8},86%,${6 + small * 6}%,${0.95 * bright})`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill();
      // THE VEIN: the coral rim each cell carries. Drawn per cell, they meet
      // at the seams and read as one continuous lacework — which is the whole
      // look of a pour.
      g.lineWidth = Math.max(1.6 * ms, Math.min(r * 0.07, 7 * ms));
      g.strokeStyle = `hsla(${8 + small * 12},95%,${52 + c.flash * 30}%,${(0.5 + c.flash * 0.4) * bright})`;
      g.beginPath(); g.arc(c.x, c.y, r * 0.99, 0, TAU); g.stroke();
      // the pinprick of light every poured cell carries
      if (r > U * 0.16) {
        g.fillStyle = `hsla(${hue + 20},100%,${76 + c.flash * 24}%,${(0.2 + small * 0.3 + c.flash * 0.5) * bright})`;
        g.beginPath(); g.arc(c.x - r * 0.1, c.y - r * 0.12, Math.max(1.2 * ms, r * (0.06 + c.flash * 0.08)), 0, TAU); g.fill();
      }
    }

    // ---- THE LACING: the brightest thing in the frame, right up to the
    // moment it fails
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, press] of s.lace) {
      if (press < 0.12) continue;                   // only real pressure glows
      const R = r * (0.2 + press * 0.3);
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(255,238,214,${(0.1 + press * 0.32) * bright})`);
      gr.addColorStop(0.35, `rgba(255,116,86,${(0.08 + press * 0.26) * bright})`);
      gr.addColorStop(1, 'rgba(190,40,60,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    }
    // a merge throws its lacing outward as a ring
    for (const c of s.cells) {
      if (c.flash <= 0.02) continue;
      g.strokeStyle = `rgba(255,180,150,${c.flash * 0.8 * bright})`;
      g.lineWidth = Math.max(2 * ms, c.r * 0.12 * c.flash);
      g.beginPath(); g.arc(c.x, c.y, c.r * (1 + (1 - c.flash) * 0.5), 0, TAU); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(150,215,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('CELLS ' + s.cells.length + '   POUR ' + Math.round(s.pour * 100) +
      '   LACING ' + (s.weak > 0.66 ? 'FAILING' : s.weak > 0.33 ? 'THIN' : 'HOLDING') +
      '   BIGGEST ' + s.big.toFixed(1) + (s.pres < 0.3 ? '   · SETTLED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- the wet film --------------------------------------------------- */
    const n = v.noise(), nf = v.filter('lowpass', 700, 0.9), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- six voices for the six largest cells --------------------------- */
    const NV = 6;
    const voices = A.padVoices(v, NV, { type: 'triangle', gain: 0.0001, cutoff: 420, q: 0.9 });
    const pans = voices.map(() => (A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null));
    voices.forEach((vc, i) => {
      // re-route the dry path through a panner WITHOUT killing padVoices'
      // reverb send (a blanket disconnect() would take that with it)
      if (pans[i]) { try { vc.g.disconnect(v.group); } catch (e) {} vc.g.connect(pans[i]); pans[i].connect(v.group); }
    });

    /* --- the pedal ------------------------------------------------------ */
    const bed = A.padVoices(v, 2, { type: 'triangle', gain: 0.01, cutoff: 240, q: 0.6 });
    const place = glide => { bed[0].set(H.rootFreq(-1), glide); bed[1].set(H.chordTone(2, -1), glide); };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.5);

    // AREA IS PITCH — a cell three times the size speaks three chord tones lower
    const pitchOf = rUnits => {
      const k = clamp((rUnits - 0.18) / 3.4);
      const i = Math.round(11 - k * 11);
      return H.chordTone(i, k > 0.72 ? -1 : 0);
    };

    let nextT = T.next(0.25);
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const U = s.unit;

        A.set(ng.gain, (0.004 + s.area * 0.012 + s.pour * 0.006) * gate, 0.3);
        A.set(nf.frequency, 340 + s.pour * 1600 + s.weak * 600, 0.3);
        bed.forEach(b => { b.level(0.007 + s.area * 0.006, 0.5); b.bright(180 + s.area * 300, 0.4); });

        /* ---- the six voices follow the six biggest cells -------------- */
        const rank = s.rank || [];
        for (let i = 0; i < NV; i++) {
          const c = rank[i];
          const vc = voices[i];
          if (!c) { vc.level(0.0001, 0.6); continue; }
          vc.set(pitchOf(c.r / U), 0.25);          // growth is an audible sag
          vc.level((0.02 - i * 0.002) * gate * clamp(c.r / (U * 0.4)), 0.4);
          vc.bright(220 + clamp(1 - c.r / (U * 3)) * 1400, 0.4);
          if (pans[i]) A.set(pans[i].pan, clamp(c.x / P.w * 2 - 1, -1, 1) * 0.7, 0.3);
        }

        /* ---- MERGES: two voices resolving into one -------------------- */
        let ev, i2 = 0;
        while ((ev = s.evq.shift()) && i2 < 4) {
          i2++;
          const at = T.next(0.25);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.75;
          const f = pitchOf(ev.r);
          if (ev.r > 0.7) {
            // a real coalescence: the survivor is struck, and the sub blooms
            A.bell(f * 2, { at, vol: (0.035 + clamp(ev.small / 2) * 0.05) * gate, dur: 3, pan, rev: 0.72 });
            // the sub only blooms for a real lake — otherwise the low end
            // never gets a moment's rest
            if (ev.r > 1.15) A.bassNote(H.chordTone(0, -1), { at, vol: (0.04 + clamp(ev.r / 4) * 0.07) * gate, dur: 1.8 });
            A.hit({ at, vol: 0.04 * gate, dur: 0.3, freq: 260, q: 1.2, type: 'lowpass', pan });
          } else {
            // droplets
            A.pluck2(f * 2, { at, vol: 0.03 * gate, dur: 0.5, pan, rev: 0.5, del: 0.2 });
          }
        }

        // the film ticking over — one soft plink per bar when it is still
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const st = Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16;
          if (st === 0 && s.pres > 0.2 && s.pour < 0.25) {
            A.bell(H.chordTone(6, 1), { at: nextT, vol: 0.018 * gate, dur: 2.6, pan: 0, rev: 0.8 });
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', s.pour);
          MOut.expr('texture', s.area);
          MOut.expr('bass', clamp(s.big / 4));
        }
      },
      stop() { v.kill(); }
    };
  }
});
