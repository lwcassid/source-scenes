/* ---------- SRC-41.2 · POUR CELLS V2 (the reservoir underneath) ---------- */
reg({
  id: 'SRC-41.2', family: 'SRC-41', ver: 2, title: 'Pour Cells', tech: 'BOILING SOURCE / HEAT × PRESSURE',
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
  fx: { bloom: 0.4 },
  tags: ['A SOURCE UNDER THE FRAME', 'L = HEAT · R = PRESSURE', 'EVERY BURST IS A NOTE', 'MERGE = A FASTER END'],
  desc: 'There is a reservoir under this frame, full of the liquid these cells are made of, and one hot vent in the middle where it can get out. Heat drives it up; pressure holds the lid on. What arrives pours from the centre and drifts outward, swelling the whole way, until the film cannot hold the volume any more and it goes — one short bright burst, one note. Hot liquid arrives as small cells that boil up and pop almost at once; cool liquid arrives as slow lakes that take half a minute to fail. Two cells that touch become one, area conserved, and that one is already closer to its end than either of them was.',
  interact: 'L = HEAT. Reach out and the source boils: more cells break through the vent, they arrive SMALLER, they swell faster and they burst sooner — a rush of tiny bright cells popping high and quick. Past halfway the heat also starts eating the film of everything already up there, so cranking the left hand sets off the lakes you poured cold. Draw in and the liquid cools: fewer arrivals, born fat, growing so slowly you can watch one cell swell for half a minute before it lets go, low and long. R = PRESSURE. Reach out and the lid comes down — the vent closes to a slit, almost nothing escapes, and whatever did is held flat: slow growth, late burst, little travel, everything crowding the middle. Draw in and the pressure drops, the vent opens wide and the frame pours full. The four corners are four instruments: cold and sealed is a still dark pond with one enormous burst a bar; cold and open is a slow procession of lakes; hot and sealed is a pressed simmer that keeps threatening; hot and open is a rolling boil.',
  sound: 'Every burst is a POP synthesised from scratch — a 1.5 ms attack, a body sine chirping down through two and a half octaves in 10–40 ms, a snap an octave over it, and 6 ms of bandpassed noise for the film tearing — no bell, no pluck. Minnaert holds: pitch goes as 1/radius, so a small cell pops high and tight and a lake pops low and long, and every pop sits on the chord ladder. Pops quantise to 16ths when the boil is hot, to 8ths when it is warm, to the beat when it is cold, and a token bucket keeps the rolling boil under about five a second. Underneath: six pad voices ride the six biggest cells, gliding DOWN as they swell; a two-voice D pedal that never moves; a vent rumble that rises with heat; and a wet noise bed that follows how much liquid is in the frame. A merge is its own event — a short downward gulp. MIDI: every pop → bells ch5 (short pitched percussion, note length 120 ms); big-lake pops bloom bass ch3; merges → lead ch1. CC74: pad = heat, texture = fill, bass = biggest cell.',

  _mk(P, x, y, vx, vy, r, bur) {
    return {
      x: x, y: y, vx: vx, vy: vy, r: r, bur: bur,
      ph: P.rand() * TAU, wob: 0.5 + P.rand() * 1.0,
      gk: 0.55 + Math.pow(P.rand(), 1.6) * 1.35,   // heavy tail: a real range of sizes
      born: 0, flash: 0, merges: 0
    };
  },

  /* ---- THE POP -------------------------------------------------------
     Built by hand out of three parts, because a bubble burst is not a bell:
       BODY  a sine that chirps down ~2.6× in 10–40 ms and dies in 30–130 ms
       SNAP  an octave-and-a-bit above it, gone in a third of that
       CLICK 6 ms of bandpassed noise — the film actually tearing
     `A` only needs {ctx, master, t(), noiseBuf(), revIn?, delIn?} so this can
     be rendered offline into an OfflineAudioContext and measured.          */
  _pop(A, freq, { at = 0, vol = 0.12, size = 0.4, pan = 0 } = {}) {
    const ctx = A.ctx;
    if (!ctx || !isFinite(freq) || freq <= 20) return;
    const t0 = Math.max(A.t(), at || 0);
    const big = Math.max(0, Math.min(1, size));
    const sweep = 0.010 + big * 0.030;            // chirp 10 → 40 ms
    const dur = 0.030 + big * 0.100;              // body  30 → 130 ms
    const out = ctx.createGain(); out.gain.value = 1;
    if (ctx.createStereoPanner && pan) {
      const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(p); p.connect(A.master);
    } else out.connect(A.master);
    if (A.revIn) { const s = ctx.createGain(); s.gain.value = 0.28 + big * 0.3; out.connect(s); s.connect(A.revIn); }
    if (A.delIn && big < 0.45) { const s = ctx.createGain(); s.gain.value = 0.14; out.connect(s); s.connect(A.delIn); }

    // BODY — the cavity collapsing
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(freq * (2.7 - big * 0.9), t0);
    o.frequency.exponentialRampToValueAtTime(freq * 0.94, t0 + sweep);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + dur + 0.03);

    // SNAP — the consonant. Small cells get most of it; lakes barely any.
    const o2 = ctx.createOscillator(); o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * (5.4 - big * 2.6), t0);
    o2.frequency.exponentialRampToValueAtTime(freq * 1.98, t0 + sweep * 0.6);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.linearRampToValueAtTime(vol * (0.5 - big * 0.32), t0 + 0.001);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.34);
    o2.connect(g2); g2.connect(out);
    o2.start(t0); o2.stop(t0 + dur + 0.03);

    // CLICK — the film tearing
    const n = ctx.createBufferSource(); n.buffer = A.noiseBuf();
    n.playbackRate.value = 0.8 + Math.random() * 0.4;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass';
    nf.frequency.value = 5400 - big * 3600; nf.Q.value = 1.1;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.5, t0);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.006 + big * 0.010);
    n.connect(nf); nf.connect(ng); ng.connect(out);
    n.start(t0); n.stop(t0 + 0.08);
  },

  init(P) {
    const S = Math.min(P.w, P.h);
    // P.focused is still false here — count off the area
    const big = areaScale(P) > 1.6;
    P.state = {
      cells: [], lace: [], rings: [], evq: [], mevq: [],
      unit: S * 0.05, maxN: big ? 120 : 52,
      pres: 0, heat: 0, press: 0,
      acc: 0, tok: 2, mtok: 1, fill: 0, big: 0, vent: 0, pps: 0, popN: 0, mergeN: 0
    };
    const s = P.state;
    // a few already up when you arrive — the source was running before you got here
    const cx = P.w / 2, cy = P.h / 2;
    for (let i = 0; i < (big ? 16 : 8); i++) {
      const a = P.rand() * TAU, d = s.unit * (0.6 + P.rand() * 5);
      s.cells.push(this._mk(P, cx + Math.cos(a) * d, cy + Math.sin(a) * d,
        Math.cos(a) * s.unit * 0.4, Math.sin(a) * s.unit * 0.4,
        s.unit * (0.2 + P.rand() * 0.5), s.unit * (1.2 + P.rand() * 1.6)));
    }
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, U = s.unit, C = s.cells;
    const cx = w / 2, cy = h / 2;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // left alone, the source cools and the lid settles back down — an
    // abandoned frame becomes a slow pond, not a runaway boil
    const idl = 1 - s.pres;
    const tL = clamp(inp.L) * s.pres + 0.26 * idl;
    const tR = clamp(inp.R) * s.pres + 0.36 * idl;
    s.heat += (tL - s.heat) * Math.min(1, dt * 6);
    s.press += (tR - s.press) * Math.min(1, dt * 6);
    const HE = s.heat, PR = s.press;

    // how open the vent is, and how hard the source pushes
    const open = clamp(1 - PR * 0.94);
    s.vent = open;
    const flow = (0.25 + HE * 1.0) * open;          // 0 … 1.25

    /* ---- swell ------------------------------------------------------- */
    // hot liquid boils up fast; pressure holds every cell down
    const grow = U * (0.13 + HE * 0.17) / (1 + PR * 1.9) * (1 - s.fill * 0.45);
    for (let i = C.length - 1; i >= 0; i--) {
      const c = C[i];
      c.born += dt; c.ph += dt * c.wob * (0.6 + HE);
      c.r += grow * c.gk * dt;
      // real heat weakens the film of what is ALREADY up here, so cranking the
      // left hand starts setting off the lakes you poured cold
      if (HE > 0.5) c.bur = Math.max(U * 0.35, c.bur - U * (HE - 0.5) * 0.38 * dt);
      c.flash = Math.max(0, c.flash - dt * 2.6);
      // drift outward from the vent, with drag
      const dx = c.x - cx, dy = c.y - cy, d = Math.sqrt(dx * dx + dy * dy) + 1e-3;
      // the fountain only pushes near the vent — past that they coast and
      // settle, so the field FILLS outward instead of lining the frame
      const dn = d / (U * 3.5);
      const acc = U * (1.6 + HE * 2.6) * (1 - PR * 0.62) / (1 + dn * dn);
      c.vx += dx / d * acc * dt; c.vy += dy / d * acc * dt;
      const dg = Math.exp(-dt * 0.7);
      c.vx *= dg; c.vy *= dg;
      c.x += c.vx * dt; c.y += c.vy * dt;
      // the rim of the pool
      const m = c.r * 0.45;
      if (c.x < m) { c.x = m; c.vx = Math.abs(c.vx) * 0.25; }
      if (c.x > w - m) { c.x = w - m; c.vx = -Math.abs(c.vx) * 0.25; }
      if (c.y < m) { c.y = m; c.vy = Math.abs(c.vy) * 0.25; }
      if (c.y > h - m) { c.y = h - m; c.vy = -Math.abs(c.vy) * 0.25; }
      /* ---- IT GOES ---------------------------------------------------- */
      if (c.r >= c.bur) {
        C.splice(i, 1);
        s.popN++;
        const rU = c.r / U;
        // audible? a token bucket so a rolling boil never machine-guns.
        // A lake going is never allowed to pass in silence.
        const need = rU > 1.6 ? 0.7 : 1;
        let aud = false;
        if (s.tok >= need) { s.tok -= need; aud = true; }
        s.rings.push({
          x: c.x, y: c.y, r: c.r, age: 0, a0: c.ph, k: clamp(rU / 1.2),
          life: 0.20 + Math.min(0.26, rU * 0.11), n: 3 + Math.min(5, (rU * 2) | 0)
        });
        if (aud) s.evq.push({ r: rU, x: c.x / w, y: c.y / h, m: c.merges });
      }
    }

    /* ---- press, and where two touch, they become one ------------------ */
    const cell = Math.max(12, U * 7);
    const gw = Math.max(1, Math.ceil(w / cell)), gh = Math.max(1, Math.ceil(h / cell));
    const gkey = gw + 'x' + gh;
    const grid = s._gkey === gkey ? s._grid : (s._gkey = gkey, s._grid = new Array(gw * gh));
    for (let i = 0; i < grid.length; i++) grid[i] = null;
    for (const c of C) {
      const gx = clamp((c.x / cell) | 0, 0, gw - 1), gy = clamp((c.y / cell) | 0, 0, gh - 1);
      const k = gy * gw + gx;
      (grid[k] || (grid[k] = [])).push(c);
    }
    const relax = Math.min(0.5, dt * 26);
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
                const k2 = a.r / rr;
                s.lace.push([a.x + dx * k2, a.y + dy * k2, Math.min(a.r, b.r), Math.min(1, ov / (Math.min(a.r, b.r) + 1e-3))]);
                // COALESCE: pressed hard enough and the wall between them fails.
                // Area is conserved, so the survivor is instantly much closer to
                // its own bursting radius — and that radius drops as well.
                // Pressure squeezes them together, so a sealed frame fuses.
                if (ov > Math.min(a.r, b.r) * (0.72 - PR * 0.3)) {
                  const A1 = a.r * a.r, A2 = b.r * b.r;
                  const keep = A1 >= A2 ? a : b, gone = A1 >= A2 ? b : a;
                  const s1 = Math.max(A1, A2), s2 = Math.min(A1, A2);
                  keep.x = (keep.x * s1 + gone.x * s2) / (s1 + s2);
                  keep.y = (keep.y * s1 + gone.y * s2) / (s1 + s2);
                  keep.vx = (keep.vx * s1 + gone.vx * s2) / (s1 + s2);
                  keep.vy = (keep.vy * s1 + gone.vy * s2) / (s1 + s2);
                  keep.r = Math.sqrt(A1 + A2);
                  keep.bur = Math.max(keep.bur, gone.bur) * 0.88;   // merging hurries the end
                  keep.merges++; keep.flash = 1;
                  dead.add(gone);
                  if (s.mtok >= 1) {
                    s.mtok -= 1; s.mergeN++;
                    s.mevq.push({ r: keep.r / U, x: keep.x / w });
                  }
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
    if (dead.size) { for (let i = C.length - 1; i >= 0; i--) if (dead.has(C[i])) C.splice(i, 1); }
    if (s.lace.length > 800) s.lace.length = 800;
    if (s.evq.length > 10) s.evq.splice(0, s.evq.length - 10);
    if (s.mevq.length > 4) s.mevq.splice(0, s.mevq.length - 4);

    /* ---- the source lets some through --------------------------------- */
    // token buckets: pops top out at something a drummer could play
    s.tok = Math.min(2, s.tok + dt * (1.2 + HE * 3.6) * (0.35 + open * 0.65));
    s.mtok = Math.min(1, s.mtok + dt * 1.4);
    s.acc += dt * (0.3 + flow * 13) * Math.sqrt(areaScale(P)) * (1 - s.fill * 0.8);
    const ap = U * (0.3 + open * 1.1) * (1 + HE * 1.4);   // the aperture
    while (s.acc > 1) {
      s.acc -= 1;
      if (C.length >= s.maxN) { s.acc = 0; break; }
      const a = P.rand() * TAU, dd = ap * Math.sqrt(P.rand());
      const sp = U * (0.8 + HE * 2.4) * (1 - PR * 0.6) * (0.6 + P.rand() * 0.8);
      // HOT LIQUID ARRIVES SMALL AND ALREADY BOILING; cool liquid arrives fat
      const r0 = U * (0.09 + (1 - HE) * 0.20) * (0.7 + P.rand() * 0.6);
      const bur = U * (0.8 + Math.pow(1 - HE, 1.25) * 2.4) * (1 + PR * 0.42) * (0.75 + P.rand() * 0.5);
      s.cells.push(this._mk(P, cx + Math.cos(a) * dd, cy + Math.sin(a) * dd,
        Math.cos(a) * sp, Math.sin(a) * sp, r0, Math.max(r0 * 1.5, bur)));
    }

    /* ---- rings ---------------------------------------------------------*/
    for (let i = s.rings.length - 1; i >= 0; i--) {
      const R = s.rings[i];
      R.age += dt;
      if (R.age > R.life) s.rings.splice(i, 1);
    }
    if (s.rings.length > 60) s.rings.splice(0, s.rings.length - 60);

    /* ---- how much liquid is up here ----------------------------------- */
    let area = 0, big = 0;
    for (const c of C) { area += c.r * c.r; if (c.r > big) big = c.r; }
    s.fill = clamp(area * Math.PI / (w * h) / 1.3);
    s.big = big / U;
    s.rank = C.slice().sort((a, b) => b.r - a.r).slice(0, 6);
    // pops per second, smoothed — the HUD's honest meter
    s.pps +=((s.popN - (s._lp || 0)) / Math.max(1e-3, dt) - s.pps) * Math.min(1, dt * 1.2);
    s._lp = s.popN;
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, U = s.unit;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    const cx = w / 2, cy = h / 2;
    g.fillStyle = '#01050c';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;

    /* ---- THE SOURCE: a hot vent in the middle of the floor ------------ */
    g.globalCompositeOperation = 'lighter';
    const boil = 1 + Math.sin(t * (1.6 + s.heat * 7)) * (0.05 + s.heat * 0.12);
    const vr = U * (1.6 + s.heat * 2.2) * (0.45 + s.vent * 0.9) * boil;
    const vg = g.createRadialGradient(cx, cy, 0, cx, cy, vr);
    vg.addColorStop(0, `rgba(255,${170 + s.heat * 60},${150 - s.heat * 90},${(0.18 + s.heat * 0.42) * bright})`);
    vg.addColorStop(0.35, `rgba(255,${90 + s.heat * 40},${70 + s.heat * 20},${(0.10 + s.heat * 0.24) * bright})`);
    vg.addColorStop(1, 'rgba(120,30,90,0)');
    g.fillStyle = vg;
    g.beginPath(); g.arc(cx, cy, vr, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    /* ---- THE LID: pressure drawn as a ring closing on the vent -------- */
    if (s.press > 0.05) {
      const lr = U * (2.6 - s.press * 1.55);
      g.strokeStyle = `rgba(150,190,255,${s.press * 0.5 * bright})`;
      g.lineWidth = Math.max(4 * ms, U * 0.16 * s.press);
      g.setLineDash([U * 0.8, U * 0.4]);
      g.lineDashOffset = -t * U * 0.4;
      g.beginPath(); g.arc(cx, cy, lr, 0, TAU); g.stroke();
      g.setLineDash([]);
    }

    /* ---- the cells: coral country on the left, deep blue on the right - */
    for (const c of s.cells) {
      const tense = clamp(c.r / c.bur);                       // 1 = about to go
      const wob = 1 + Math.sin(c.ph * 1.7) * (0.03 + tense * tense * 0.05);
      const r = c.r * wob;
      // the side law, steepened: everything is born mid-frame, so the coral →
      // violet → blue run has to happen across the middle of the picture
      const warm = clamp(0.5 + (0.5 - c.x / w) * 1.9);
      const hue = (196 + warm * 172) % 360;
      const small = clamp(1 - c.r / (U * 2.2));
      const gr = g.createRadialGradient(c.x - r * 0.25, c.y - r * 0.3, r * 0.05, c.x, c.y, r);
      gr.addColorStop(0, `hsla(${hue + 12},${72 + small * 20}%,${20 + small * 20 + c.flash * 22}%,${0.97 * bright})`);
      gr.addColorStop(0.72, `hsla(${hue},80%,${11 + small * 12 + c.flash * 14}%,${0.95 * bright})`);
      gr.addColorStop(1, `hsla(${hue - 8},86%,${6 + small * 6}%,${0.95 * bright})`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill();
      // THE VEIN — and it goes white-hot in the last moment before it fails
      const hot = Math.pow(tense, 5);
      g.lineWidth = Math.max(1.8 * ms, Math.min(r * 0.08, 8 * ms));
      g.strokeStyle = `hsla(${8 + small * 12 + hot * 26},${95 - hot * 40}%,${52 + c.flash * 26 + hot * 40}%,${(0.5 + c.flash * 0.35 + hot * 0.45) * bright})`;
      g.beginPath(); g.arc(c.x, c.y, r * 0.99, 0, TAU); g.stroke();
      if (r > U * 0.16) {
        g.fillStyle = `hsla(${hue + 20},100%,${76 + c.flash * 24}%,${(0.2 + small * 0.3 + c.flash * 0.5) * bright})`;
        g.beginPath(); g.arc(c.x - r * 0.1, c.y - r * 0.12, Math.max(1.2 * ms, r * (0.06 + c.flash * 0.08)), 0, TAU); g.fill();
      }
    }

    /* ---- the lacing where they crowd ---------------------------------- */
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, pressv] of s.lace) {
      if (pressv < 0.12) continue;
      const R = r * (0.2 + pressv * 0.3);
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(255,238,214,${(0.1 + pressv * 0.3) * bright})`);
      gr.addColorStop(0.35, `rgba(255,116,86,${(0.08 + pressv * 0.24) * bright})`);
      gr.addColorStop(1, 'rgba(190,40,60,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    }

    /* ---- IT WENT: the ring and the spray ------------------------------ */
    for (const R of s.rings) {
      const k = R.age / R.life, fade = 1 - k;
      // THE FLASH — the first third of a burst is light, not geometry
      if (k < 0.34) {
        const f = 1 - k / 0.34;
        const fg = g.createRadialGradient(R.x, R.y, 0, R.x, R.y, R.r * 2.2);
        fg.addColorStop(0, `rgba(255,250,238,${f * 0.95 * bright})`);
        fg.addColorStop(0.4, `rgba(255,170,120,${f * 0.5 * bright})`);
        fg.addColorStop(1, 'rgba(255,80,60,0)');
        g.fillStyle = fg;
        g.beginPath(); g.arc(R.x, R.y, R.r * 2.2, 0, TAU); g.fill();
      }
      // the ring belongs to the LAKES — a tiny cell going is all flash
      const ra = Math.pow(fade, 1.6) * (0.16 + R.k * 0.78) * bright;
      if (ra > 0.02) {
        const rr = R.r * (0.9 + k * 1.4);
        g.strokeStyle = `rgba(255,${186 - k * 40},${142 - k * 50},${ra})`;
        g.lineWidth = Math.max(2.5 * ms, Math.min(R.r * 0.42, 11 * ms) * fade);
        g.beginPath(); g.arc(R.x, R.y, rr, 0, TAU); g.stroke();
      }
      // the spray: droplets thrown clear of the ring, not spokes
      const sp = R.r * (1.3 + k * 2.4);
      const dr = Math.max(1.5 * ms, R.r * 0.16 * fade * fade);
      g.fillStyle = `rgba(255,${236 - k * 40},${212 - k * 60},${fade * fade * 0.75 * bright})`;
      for (let i = 0; i < R.n; i++) {
        const a = R.a0 + (i / R.n) * TAU;
        g.beginPath(); g.arc(R.x + Math.cos(a) * sp, R.y + Math.sin(a) * sp, dr, 0, TAU); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(150,215,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HEAT ' + Math.round(s.heat * 100) + '   PRESSURE ' + Math.round(s.press * 100) +
      '   CELLS ' + s.cells.length + '   POPS/S ' + Math.max(0, s.pps).toFixed(1) +
      '   VENT ' + (s.vent > 0.66 ? 'OPEN' : s.vent > 0.28 ? 'NARROW' : 'SEALED') +
      (s.pres < 0.3 ? '   · SETTLED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const self = this;

    /* --- the wet film --------------------------------------------------- */
    const n = v.noise(), nf = v.filter('lowpass', 700, 0.9), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- the source itself: a rumble under the floor --------------------- */
    const ro = v.osc('triangle', 44), rf = v.filter('lowpass', 120, 3.2), rg = v.g(0.0001);
    const rn = v.noise(), rnf = v.filter('bandpass', 220, 1.6), rng = v.g(0.0001);
    ro.connect(rf); rf.connect(rg); rg.connect(v.group);
    rn.connect(rnf); rnf.connect(rng); rng.connect(v.group);

    /* --- six voices for the six largest cells ---------------------------- */
    const NV = 6;
    const voices = A.padVoices(v, NV, { type: 'triangle', gain: 0.0001, cutoff: 420, q: 0.9 });
    const pans = voices.map(() => (A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null));
    voices.forEach((vc, i) => {
      if (pans[i]) { try { vc.g.disconnect(v.group); } catch (e) {} vc.g.connect(pans[i]); pans[i].connect(v.group); }
    });

    /* --- the pedal ------------------------------------------------------- */
    const bed = A.padVoices(v, 2, { type: 'triangle', gain: 0.01, cutoff: 240, q: 0.6 });
    const place = glide => { bed[0].set(H.rootFreq(-1), glide); bed[1].set(H.chordTone(2, -1), glide); };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.5);

    // MINNAERT — pitch goes as 1/radius, quantised onto the chord ladder
    const popPitch = rU => {
      const k = clamp(rU / 3.6);
      return H.chordTone(Math.max(-3, Math.round(14 - k * 17)), 0);
    };
    const padPitch = rU => {
      const k = clamp((rU - 0.18) / 3.4);
      return H.chordTone(Math.round(11 - k * 11), k > 0.72 ? -1 : 0);
    };

    let nextT = T.next(0.25), lastBass = 0;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const U = s.unit;

        A.set(ng.gain, (0.003 + s.fill * 0.014) * gate, 0.3);
        A.set(nf.frequency, 320 + s.fill * 900 + s.heat * 1400, 0.3);
        // the vent: heat opens it up, pressure corks it
        A.set(rg.gain, (0.004 + s.heat * 0.016) * s.vent * gate, 0.35);
        A.set(rf.frequency, 70 + s.heat * 130, 0.4);
        A.set(rng.gain, (0.002 + s.heat * 0.011) * (0.3 + s.vent * 0.7) * gate, 0.35);
        A.set(rnf.frequency, 150 + s.heat * 700, 0.35);
        bed.forEach(b => { b.level(0.007 + s.fill * 0.006, 0.5); b.bright(180 + s.fill * 300, 0.4); });

        /* ---- the six biggest cells hold the six voices ---------------- */
        const rank = s.rank || [];
        for (let i = 0; i < NV; i++) {
          const c = rank[i];
          const vc = voices[i];
          if (!c) { vc.level(0.0001, 0.6); continue; }
          vc.set(padPitch(c.r / U), 0.25);           // swelling is an audible sag
          vc.level((0.019 - i * 0.002) * gate * clamp(c.r / (U * 0.5)), 0.4);
          vc.bright(220 + clamp(1 - c.r / (U * 3)) * 1400, 0.4);
          if (pans[i]) A.set(pans[i].pan, clamp(c.x / P.w * 2 - 1, -1, 1) * 0.7, 0.3);
        }

        /* ---- POPS ------------------------------------------------------ */
        // hot boil earns 16ths; a cold pond gets the beat and nothing more
        const sub = s.heat > 0.62 ? 0.25 : s.heat > 0.3 ? 0.5 : 1;
        let ev, k = 0;
        while ((ev = s.evq.shift()) && k < 3) {
          k++;
          const at = T.next(sub);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.75;
          const size = clamp(ev.r / 3.2);
          const f = popPitch(ev.r);
          const vol = (0.06 + size * 0.13) * gate;
          self._pop(A, f, { at, vol, size, pan });
          if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('bells', f, vol * 3.2, at, 0.12);
          // a lake going is felt in the floor as well as heard — but the low
          // end gets at most one of these a beat, or it turns to mud
          if (ev.r > 2.3 && at > lastBass + T.beat * 2.5) {
            lastBass = at;
            A.bassNote(H.chordTone(0, -1), { at, vol: (0.03 + clamp(ev.r / 5) * 0.06) * gate, dur: 1.5 });
          }
        }

        /* ---- MERGES: two becoming one, a short downward gulp ----------- */
        let mv, k2 = 0;
        while ((mv = s.mevq.shift()) && k2 < 2) {
          k2++;
          const at = T.next(sub);
          const pan = clamp(mv.x * 2 - 1, -1, 1) * 0.7;
          const f = padPitch(mv.r);
          A.pluck2(f, { at, vol: 0.022 * gate, dur: 0.34, pan, rev: 0.45, del: 0.18 });
          A.hit({ at, vol: 0.022 * gate, dur: 0.16, freq: 320, q: 1.4, type: 'lowpass', pan });
          if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('lead', f, 0.07, at, 0.3);
        }

        // the pond ticking over when nothing is happening
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const st = Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16;
          if (st === 0 && s.pres > 0.2 && s.cells.length < 8) {
            A.bell(H.chordTone(6, 1), { at: nextT, vol: 0.016 * gate, dur: 2.6, pan: 0, rev: 0.8 });
          }
          nextT += T.beat * 0.25;
        }
        if (nextT < now) nextT = T.next(0.25);

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', s.heat);
          MOut.expr('texture', s.fill);
          MOut.expr('bass', clamp(s.big / 4));
        }
      },
      stop() { v.kill(); }
    };
  }
});
