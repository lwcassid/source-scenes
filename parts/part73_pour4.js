/* ---------- SRC-41.4 · POUR CELLS V4 (the room rings with the pops) ---------- */
reg({
  id: 'SRC-41.4', family: 'SRC-41', ver: 4, title: 'Pour Cells V4', tech: 'BOILING SOURCE / TUNED ROOM',
  music: {
    // D PHRYGIAN on a D pedal. The ♭2 (E♭) is the whole character of the mode,
    // so the ladder walks from plain modal minor up to the ♭II itself.
    bpm: 72, root: 38, mode: 'phrygian', chordBars: 16,
    chords: [
      [0, 7, 15, 19, 22],   // 0  Dm7
      [0, 5, 12, 17, 20],   // 1  Gm/D
      [0, 8, 15, 20, 24],   // 2  B♭/D
      [0, 10, 15, 19, 25],  // 3  Dm7(11)
      [0, 7, 13, 20, 25],   // 4  D♭9        — the phrygian bite
      [0, 1, 8, 13, 20]     // 5  E♭/D       — the ♭II itself
    ],
    chordNames: ['Dm7', 'Gm/D', 'B♭/D', 'Dm7(11)', 'D♭9 phryg', 'E♭/D ♭II']
  },
  fx: { bloom: 0.4 },
  tags: ['A SOURCE UNDER THE FRAME', 'L = HEAT · R = THE CHORD', 'ONE BURST, ONE SOUND', 'D PHRYGIAN'],
  desc: 'There is a reservoir under this frame, full of the liquid these cells are made of, and one hot vent in the middle where it can get out. Heat drives it up; what arrives pours from the centre and drifts outward, swelling the whole way, until the film cannot hold the volume and it goes — one short bright burst, one note. And the note is not decided at the burst: every cell is issued one AT BIRTH, the next rung of an arpeggio over whatever chord the right hand is holding, and it carries that note as a coloured seed at its heart for its whole life. The frame is a queue of pitches you can see, waiting to be played by physics.',
  interact: 'L = HEAT. Reach out and the source boils: more cells break through the vent, they arrive SMALLER, swell faster and burst sooner — a rush of tiny bright cells popping high and quick. Past halfway the heat also eats the film of everything already up there, so cranking the left hand sets off the lakes you poured cold. Draw in and the liquid cools: fewer arrivals, born fat, growing so slowly you can watch one swell for half a minute before it lets go, low and long. R = THE CHORD. The right hand walks six chords over a D pedal — Dm9, Gsus/D, B♭maj7/D, Dm7, Dm11, Dm6 — and every cell issued while you hold one is stamped with the next rung of an arpeggio over it. The seed at the middle of each cell is coloured by which rung it got, so a glance at the frame tells you what is about to be played and in what order the physics will get to it. Move the hand and the queue already in the air re-voices into the new chord, keeping each cell\'s place in the arpeggio: the same shape, a different harmony.',
  sound: 'Every burst is a POP synthesised from scratch — a 1.5 ms attack, a body sine chirping down through two and a half octaves in 10–40 ms, a snap an octave over it, and 6 ms of bandpassed noise for the film tearing — no bell, no pluck. The PITCH CLASS is the rung of the arpeggio that cell was issued at birth; the OCTAVE is Minnaert, straight off its radius at the moment it fails, so a small cell pops high and tight and a lake pops low and long. The six biggest cells hold six sustained voices, each droning its own note, so the frame is always sounding the chord it is carrying. Pops quantise to 16ths when the boil is hot, 8ths when warm, the beat when cold, and a token bucket keeps a rolling boil under about five a second. A merge is its own event, and the survivor keeps the LOWER of the two notes. Underneath: a D pedal that never moves, a vent rumble that rises with heat, a wet bed that follows how much liquid is up there. MIDI: pops → bells ch5, big-lake pops bloom bass ch3, merges → lead ch1. CC74: pad = heat, texture = fill, bass = biggest cell.',

  // THE ARPEGGIO: which rung of the chord ladder each successive cell gets.
  // Ascending and wrapping, so a frame's worth of cells is one long arpeggio
  // waiting to be played out of order by the physics.
  _ARP: [0, 1, 2, 3, 4, 5, 6, 7],
  // one colour per rung, so the seed at a cell's heart IS its pitch
  _DEGC: ['#ffd24a', '#ff9a3c', '#ff5f7a', '#e45cff', '#8f7bff', '#4fb6ff', '#4fe6d0', '#b6ff6a'],

  _mk(P, x, y, vx, vy, r, bur) {
    return {
      x: x, y: y, vx: vx, vy: vy, r: r, bur: bur,
      ph: P.rand() * TAU, wob: 0.5 + P.rand() * 1.0,
      gk: 0.55 + Math.pow(P.rand(), 1.6) * 1.35,   // heavy tail: a real range of sizes
      born: 0, flash: 0, merges: 0, deg: 0
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
    if (A.revIn) { const s = ctx.createGain(); s.gain.value = 0.45 + big * 0.35; out.connect(s); s.connect(A.revIn); }
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
      pres: 0, heat: 0, press: 0, mergeCd: 0,
      // the arpeggio counter: every cell issued takes the next rung
      arp: 0, zone: 0, cand: 0, candT: 0, nextQ: [],
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
    const ARP = this._ARP;
    const cx = w / 2, cy = h / 2;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    // left alone, the source cools and the lid settles back down — an
    // abandoned frame becomes a slow pond, not a runaway boil
    const idl = 1 - s.pres;
    const tL = clamp(inp.L) * s.pres + 0.26 * idl;
    s.heat += (tL - s.heat) * Math.min(1, dt * 6);
    const HE = s.heat;
    /* ---- THE RIGHT HAND IS THE HARMONY --------------------------------
       Six chords across its travel, schmitt-latched so a hovering hand can
       never flicker between two of them. It gates nothing physical: the
       right hand decides what the frame will SAY, the left how fast.     */
    const z = clamp(inp.R) * 5.999 | 0;
    if (z !== s.cand) { s.cand = z; s.candT = t; }
    if (z !== s.zone && t - s.candT > 0.2) s.zone = z;
    s.press = clamp(inp.R);                        // kept for the HUD only

    // the vent is the left hand's now — heat alone opens it
    const open = 0.34 + HE * 0.66;
    s.vent = open;
    const flow = (0.25 + HE * 1.0) * open;          // 0 … 1.25

    /* ---- swell ------------------------------------------------------- */
    // hot liquid boils up fast; pressure holds every cell down
    const grow = U * (0.13 + HE * 0.17) * 0.74 * (1 - s.fill * 0.45);
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
      const acc = U * (1.6 + HE * 2.6) * 0.78 / (1 + dn * dn);
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
        /* ---- ONE BURST, ONE SOUND ------------------------------------
           The budget is spent HERE, on whether the film is allowed to fail
           at all — not later on whether anyone hears it. A cell that has
           reached its limit while the room is already full of bursts just
           holds there, stretched at its bursting radius with its vein gone
           white-hot, and goes as soon as there is room. Nothing on this
           frame ever pops in silence.                                    */
        if (s.tok < 1) { c.r = c.bur; continue; }
        s.tok -= 1;
        C.splice(i, 1);
        s.popN++;
        const rU = c.r / U;
        s.rings.push({
          x: c.x, y: c.y, r: c.r, age: 0, a0: c.ph, k: clamp(rU / 1.2),
          life: 0.20 + Math.min(0.26, rU * 0.11), n: 3 + Math.min(5, (rU * 2) | 0)
        });
        s.evq.push({ r: rU, x: c.x / w, y: c.y / h, m: c.merges, deg: c.deg });
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
                if (ov > Math.min(a.r, b.r) * 0.62 && s.mergeCd <= 0) {
                  const A1 = a.r * a.r, A2 = b.r * b.r;
                  const keep = A1 >= A2 ? a : b, gone = A1 >= A2 ? b : a;
                  const s1 = Math.max(A1, A2), s2 = Math.min(A1, A2);
                  keep.x = (keep.x * s1 + gone.x * s2) / (s1 + s2);
                  keep.y = (keep.y * s1 + gone.y * s2) / (s1 + s2);
                  keep.vx = (keep.vx * s1 + gone.vx * s2) / (s1 + s2);
                  keep.vy = (keep.vy * s1 + gone.vy * s2) / (s1 + s2);
                  keep.r = Math.sqrt(A1 + A2);
                  keep.bur = Math.max(keep.bur, gone.bur) * 0.88;   // merging hurries the end
                  keep.deg = Math.min(keep.deg, gone.deg);   // the survivor speaks the lower note
                  keep.merges++; keep.flash = 1;
                  dead.add(gone);
                  s.mergeCd = 0.17;                 // one merge, one gulp
                  s.mergeN++;
                  s.mevq.push({ r: keep.r / U, x: keep.x / w, deg: keep.deg });
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
    if (s.evq.length > 32) s.evq.splice(0, s.evq.length - 32);
    if (s.mevq.length > 12) s.mevq.splice(0, s.mevq.length - 12);

    /* ---- the source lets some through --------------------------------- */
    // token buckets: pops top out at something a drummer could play
    // bursts per second: about one a 16th at full heat, and every one of
    // them is heard. This is the scene's tempo, not a mixing decision.
    s.tok = Math.min(2, s.tok + dt * (2.6 + HE * 5.4));
    s.mergeCd = Math.max(0, (s.mergeCd || 0) - dt);
    s.acc += dt * (0.3 + flow * 13) * Math.sqrt(areaScale(P)) * (1 - s.fill * 0.8);
    const ap = U * (0.3 + open * 1.1) * (1 + HE * 1.4);   // the aperture
    while (s.acc > 1) {
      s.acc -= 1;
      if (C.length >= s.maxN) { s.acc = 0; break; }
      const a = P.rand() * TAU, dd = ap * Math.sqrt(P.rand());
      const sp = U * (0.8 + HE * 2.4) * 0.82 * (0.6 + P.rand() * 0.8);
      // HOT LIQUID ARRIVES SMALL AND ALREADY BOILING; cool liquid arrives fat
      const r0 = U * (0.09 + (1 - HE) * 0.20) * (0.7 + P.rand() * 0.6);
      const bur = U * (0.8 + Math.pow(1 - HE, 1.25) * 2.4) * 1.12 * (0.75 + P.rand() * 0.5);
      const nc = this._mk(P, cx + Math.cos(a) * dd, cy + Math.sin(a) * dd,
        Math.cos(a) * sp, Math.sin(a) * sp, r0, Math.max(r0 * 1.5, bur));
      // ISSUED A NOTE ON THE WAY OUT OF THE VENT — the next rung of the
      // arpeggio over whatever chord the right hand is holding
      nc.deg = ARP[s.arp % ARP.length];
      s.arp++;
      s.cells.push(nc);
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
    const q = s.nextQ; q.length = 0;
    for (let i = 0; i < 5; i++) q.push(ARP[(s.arp + i) % ARP.length]);
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

    /* ---- THE QUEUE: the next five notes, waiting at the vent ---------- */
    // the right hand loads these; the left hand decides how fast they leave
    const DEGC = this._DEGC, q = s.nextQ || [];
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < q.length; i++) {
      const a = -Math.PI / 2 + (i - (q.length - 1) / 2) * 0.34;
      const rr = U * (2.5 + i * 0.02);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
      const rad = Math.max(2 * ms, U * (0.16 - i * 0.02));
      g.fillStyle = DEGC[q[i] % DEGC.length];
      g.globalAlpha = (0.85 - i * 0.14) * bright;
      g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';

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
      // THE SEED: the note this cell was issued at the vent, in its own colour,
      // brightening as the cell comes up on its burst
      if (r > U * 0.13) {
        const dc = this._DEGC[c.deg % this._DEGC.length];
        g.fillStyle = dc;
        g.globalAlpha = (0.55 + tense * 0.45 + c.flash * 0.4) * bright;
        g.beginPath(); g.arc(c.x, c.y, Math.max(1.6 * ms, r * (0.16 + hot * 0.1)), 0, TAU); g.fill();
        g.globalAlpha = (0.3 + tense * 0.3) * bright;
        g.beginPath(); g.arc(c.x, c.y, Math.max(2.6 * ms, r * 0.3), 0, TAU);
        g.lineWidth = Math.max(1 * ms, r * 0.035); g.strokeStyle = dc; g.stroke();
        g.globalAlpha = 1;
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
    g.fillText('HEAT ' + Math.round(s.heat * 100) + '   CHORD ' + (H.label || '') +
      ' (' + (s.zone + 1) + '/6)   NEXT ' + (s.nextQ || []).map(d => d + 1).join('·') +
      '   CELLS ' + s.cells.length + '   POPS/S ' + Math.max(0, s.pps).toFixed(1) +
      (s.pres < 0.3 ? '   · SETTLED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const self = this;

    /* --- THE ROOM, TUNED ------------------------------------------------
       The old bed was a lowpassed hiss and a 44 Hz rumble — a different
       instrument from the pops, which is exactly what felt wrong. Now the air
       is three narrow resonators sitting ON the chord's own tones, so the
       ambience is the room ringing at the pitches the pops are about to play.
       A pop and the bed are the same material at two different lengths.    */
    const n = v.noise();
    const RZ = [];
    for (let i = 0; i < 3; i++) {
      const f = v.filter('bandpass', 300 + i * 220, 11);
      const gg = v.g(0.0001);
      n.connect(f); f.connect(gg); gg.connect(v.group);
      if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.55; gg.connect(sd); sd.connect(AE.revIn); }
      RZ.push({ f: f, g: gg });
    }
    const nf = RZ[0].f, ng = RZ[0].g;   // the HUD/expr layer still talks to one

    /* --- the source itself: a sine on the root, not an untuned rumble ---- */
    const ro = v.osc('sine', 44), rf = v.filter('lowpass', 120, 3.2), rg = v.g(0.0001);
    const rn = v.noise(), rnf = v.filter('bandpass', 220, 1.6), rng = v.g(0.0001);
    ro.connect(rf); rf.connect(rg); rg.connect(v.group);
    rn.connect(rnf); rnf.connect(rng); rng.connect(v.group);

    /* --- six voices for the six largest cells ---------------------------- */
    const NV = 6;
    const voices = A.padVoices(v, NV, { type: 'sine', gain: 0.0001, cutoff: 900, q: 0.7 });
    // a twelfth above the fundamental is the pop's own snap interval — the
    // sustained cells are the same voice as the bursts, just held open
    voices.forEach(vc => { vc.o2.detune.value = 1900; });
    const pans = voices.map(() => (A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null));
    voices.forEach((vc, i) => {
      if (pans[i]) { try { vc.g.disconnect(v.group); } catch (e) {} vc.g.connect(pans[i]); pans[i].connect(v.group); }
    });

    /* --- the pedal ------------------------------------------------------- */
    const bed = A.padVoices(v, 2, { type: 'triangle', gain: 0.01, cutoff: 240, q: 0.6 });
    const place = glide => {
      bed[0].set(H.rootFreq(-1), glide); bed[1].set(H.chordTone(2, -1), glide);
      // the air, the floor and the chord are one thing
      for (let i = 0; i < RZ.length; i++) A.set(RZ[i].f.frequency, H.chordTone(i * 2 + 1, 1), 0.25);
      A.set(ro.frequency, H.rootFreq(-2), 0.2);
    };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.5);

    /* ---- PITCH CLASS FROM THE CELL, OCTAVE FROM ITS SIZE ---------------
       The rung was issued at the vent and belongs to the cell; Minnaert only
       gets to choose which octave it lands in, so a lake and a speck can
       carry the same note and still sound like a lake and a speck.        */
    const octOf = rU => (rU > 1.9 ? -1 : rU > 0.7 ? 0 : 1);
    const notePitch = (deg, rU) => H.chordTone((deg || 0), octOf(rU));

    let nextT = T.next(0.25), lastBass = 0, lastZone = -1;
    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const U = s.unit;

        /* ---- the right hand chose a chord: take it now, not on the bar.
           Every cell already in the air keeps its RUNG, so the queue you can
           see re-voices into the new harmony without losing its shape.    */
        if (s.zone !== lastZone) {
          lastZone = s.zone;
          H.prog = [s.zone];
          H.step = 0;
          H.build();
          place(0.25);
          if (typeof T !== 'undefined' && T.running) H.nextChangeBar = T.bar() + H.chordBars;
        }

        for (let i = 0; i < RZ.length; i++) {
          A.set(RZ[i].g.gain, (0.004 + s.fill * 0.016) * (1 - i * 0.22) * gate, 0.35);
          A.set(RZ[i].f.Q, 9 + (1 - s.heat) * 9, 0.4);   // a hot room rings looser
        }
        // the vent: heat opens it up, pressure corks it
        A.set(rg.gain, (0.004 + s.heat * 0.016) * s.vent * gate, 0.35);
        A.set(rf.frequency, 60 + s.heat * 90, 0.4);
        A.set(rng.gain, (0.002 + s.heat * 0.011) * (0.3 + s.vent * 0.7) * gate, 0.35);
        A.set(rnf.frequency, 150 + s.heat * 700, 0.35);
        bed.forEach(b => { b.level(0.007 + s.fill * 0.006, 0.5); b.bright(180 + s.fill * 300, 0.4); });

        /* ---- the six biggest cells hold the six voices ---------------- */
        const rank = s.rank || [];
        for (let i = 0; i < NV; i++) {
          const c = rank[i];
          const vc = voices[i];
          if (!c) { vc.level(0.0001, 0.6); continue; }
          vc.set(notePitch(c.deg, c.r / U), 0.25);   // each big cell drones its own note
          vc.level((0.019 - i * 0.002) * gate * clamp(c.r / (U * 0.5)), 0.4);
          vc.bright(220 + clamp(1 - c.r / (U * 3)) * 1400, 0.4);
          if (pans[i]) A.set(pans[i].pan, clamp(c.x / P.w * 2 - 1, -1, 1) * 0.7, 0.3);
        }

        /* ---- POPS ------------------------------------------------------ */
        // hot boil earns 16ths; a cold pond gets the beat and nothing more
        const sub = s.heat > 0.62 ? 0.25 : s.heat > 0.3 ? 0.5 : 1;
        let ev, k = 0;
        while ((ev = s.evq.shift()) && k < 6) {
          k++;
          const at = T.next(sub);
          const pan = clamp(ev.x * 2 - 1, -1, 1) * 0.75;
          const size = clamp(ev.r / 3.2);
          const f = notePitch(ev.deg, ev.r);
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
        while ((mv = s.mevq.shift()) && k2 < 4) {
          k2++;
          const at = T.next(sub);
          const pan = clamp(mv.x * 2 - 1, -1, 1) * 0.7;
          const f = notePitch(mv.deg, mv.r);
          // pluck2 already puts this on the lead channel — emitting it again
          // by hand was double-striking every merge in Ableton
          A.pluck2(f, { at, vol: 0.022 * gate, dur: 0.34, pan, rev: 0.45, del: 0.18, role: 'lead' });
          A.hit({ at, vol: 0.022 * gate, dur: 0.16, freq: 320, q: 1.4, type: 'lowpass', pan });
        }

        // the pond ticking over when nothing is happening
        const horizon = now + 0.15;
        while (nextT < horizon) {
          const st = Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16;
          if (st === 0 && s.pres > 0.2 && s.cells.length < 8) {
            A.bell(H.chordTone((s.nextQ && s.nextQ[0]) || 0, 1), { at: nextT, vol: 0.016 * gate, dur: 2.6, pan: 0, rev: 0.8 });
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
