/* ---------- SRC-41.7 · POUR CELLS V7 (soft domes in a poured field) ---------- */
reg({
  id: 'SRC-41.7', family: 'SRC-41', ver: 7, title: 'Pour Cells V7', tech: 'SOFT DOMES / POURED PALETTE',
  music: {
    // D PHRYGIAN on a D pedal. The ♭2 (E♭) is the whole character of the mode,
    // so the ladder walks from plain modal minor up to the ♭II itself.
    bpm: 72, root: 38, mode: 'phrygian', chordBars: 16,
    // VOICED INSIDE ONE OCTAVE ON PURPOSE. The house style is wide spread
    // voicings, but a spread of 22 semitones makes the chord ladder fold back
    // on itself — rung 5 lands BELOW rung 4 — and an ascending arpeggio comes
    // out as a random walk. Inside an octave the ladder is monotonic, so the
    // line the right hand loads is the line you hear.
    chords: [
      [0, 3, 7, 10],       // 0  Dm7
      [0, 3, 5, 8, 10],    // 1  Gm11/D
      [0, 3, 8, 10],       // 2  B♭6/D
      [0, 3, 5, 7, 10],    // 3  Dm7(11)
      [0, 1, 5, 7, 10],    // 4  D♭9        — the phrygian bite
      [0, 1, 5, 8, 10]     // 5  E♭/D       — the ♭II itself
    ],
    chordNames: ['Dm7', 'Gm11/D', 'B♭6/D', 'Dm7(11)', 'D♭9 phryg', 'E♭/D ♭II']
  },
  fx: { bloom: 0.4 },
  tags: ['A SOURCE UNDER THE FRAME', 'L = HEAT · R = THE CHORD', 'SOFT LIT DOMES', 'SEAFOAM MEDIUM, EMBER CELLS', 'ONE BURST, ONE NOTE', 'THE QUEUE PLAYS IN ORDER'],
  desc: 'There is a reservoir under this frame, full of the liquid these cells are made of, and one hot vent in the middle where it can get out. Heat drives it up; what arrives pours from the centre and drifts outward, swelling the whole way, until the film cannot hold the volume and it goes. And the note is not decided at the burst: every cell is issued one AT BIRTH, the next rung of an arpeggio over whatever chord the right hand is holding, and it carries that note as a coloured seed at its heart for its whole life. The frame is a queue of pitches you can see, and it is played in the order it was written.',
  interact: 'L = HEAT. Reach out and the source boils: more cells break through the vent, they arrive SMALLER, swell faster and burst sooner. Draw in and the liquid cools: fewer arrivals, born fat, growing so slowly you can watch one swell for half a minute before it lets go, low and long. Past halfway the heat also eats the film of everything already up there, so cranking the left hand sets off the lakes you poured cold. R = THE CHORD: six of them over a D pedal in phrygian — Dm7, Gm/D, B♭/D, Dm7(11), D♭9, and the ♭II itself — and every cell issued while you hold one is stamped with the next rung of an arpeggio over it. The seed at the middle of each cell is coloured by which rung it got, and the next five to be issued wait as coloured dots above the vent, so you can see the line before you play it. Cells burst in the ORDER they were issued — the oldest one waiting at its limit always goes first — so what you hear is that arpeggio walking, at whatever speed the heat allows. Move the right hand and the queue already in the air re-voices into the new chord keeping each cell\'s place in the line: same shape, new harmony.',
  sound: 'ONE BURST, ONE NOTE, and the note wins over its own attack. The body is a filtered triangle sitting an octave higher than it used to — down at 73 Hz a quiet tone has almost no perceived loudness and the 5 kHz tear beat it every time, which is why it read as a tick. It holds better than half its peak through the first fortieth of a second and rings for a fifth of a second on a speck to nearly a full one on a lake, with the octave above held long enough to help the ear find the pitch; the snap is a third of what it was and the film tear is a ninth, moved down to 2.4 kHz. There is no burst anywhere on this frame you do not hear: the rate limit is spent on the physics, so a cell that reaches its bursting radius while the room is full holds there, stretched and white-veined, and goes when there is room — about one a sixteenth at full heat. The pitch is the rung the cell was issued at the vent, and the cells burst in the order they were issued, so what you hear is the arpeggio walking; size says what it needs through the length of the ring and the sub bloom a lake gets underneath. The ambience is the same material: three narrow resonators tuned live to the chord\'s own tones, a sine on the root under the floor, six sustained cell voices, and every burst thrown into the same long reverb so its tail is the pad. MIDI: pops → bells ch5 with the length they actually ring, big-lake pops bloom bass ch3, merges → lead ch1.',

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
      gk: 1,                             // identical clocks: birth order IS burst order
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
    /* A burst that is over in 40 ms is a CLICK — the ear never gets long
       enough at a steady frequency to hear a pitch, so a frame of them is
       "tack tack tack". A real bubble collapsing rings: it bends INTO its
       note in a few milliseconds and then holds it while it decays. So:
       a short bend, then a long tail at the note itself.                  */
    const bend = 0.006 + big * 0.014;             // into the note: 6 → 20 ms
    const ring = 0.34 + big * 0.86;               // and then it SINGS: 0.34 → 1.2 s
    const out = ctx.createGain(); out.gain.value = 1;
    if (ctx.createStereoPanner && pan) {
      const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(p); p.connect(A.master);
    } else out.connect(A.master);
    if (A.revIn) { const s = ctx.createGain(); s.gain.value = 0.4 + big * 0.3; out.connect(s); s.connect(A.revIn); }
    if (A.delIn) { const s = ctx.createGain(); s.gain.value = 0.10 + (1 - big) * 0.12; out.connect(s); s.connect(A.delIn); }

    /* THE NOTE. Triangle, not sine: down here a sine has almost no perceived
       loudness and the 5 kHz tear was winning every time — all you heard was
       the tack. And the tail holds at better than half its peak for the first
       fortieth of a second instead of collapsing to a third, so what carries
       out of the frame is the pitch, not the transient.                    */
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(freq * (1.5 + big * 0.5), t0);
    o.frequency.exponentialRampToValueAtTime(freq, t0 + bend);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * 9, t0);
    lp.frequency.exponentialRampToValueAtTime(Math.max(freq * 2.2, 160), t0 + ring * 0.5);
    lp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    // a 2 ms edge IS a tick, whatever comes after it. 5 ms still reads as a
    // burst and stops the onset being the loudest thing in the room.
    g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(vol * 0.66, t0 + bend + 0.05);
    // …and then a PLATEAU, not a collapse: still at a third of peak halfway
    // through the ring, which is what makes the ear hear a note at all
    g.gain.exponentialRampToValueAtTime(vol * 0.34, t0 + ring * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ring);
    o.connect(lp); lp.connect(g); g.connect(out);
    o.start(t0); o.stop(t0 + ring + 0.05);

    // the octave above, held long enough to help the ear find the pitch
    const o3 = ctx.createOscillator(); o3.type = 'sine';
    o3.frequency.setValueAtTime(freq * 2.6, t0);
    o3.frequency.exponentialRampToValueAtTime(freq * 2, t0 + bend * 1.6);
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.0001, t0);
    g3.gain.linearRampToValueAtTime(vol * 0.3, t0 + 0.006);
    g3.gain.exponentialRampToValueAtTime(0.0001, t0 + ring * 0.72);
    o3.connect(g3); g3.connect(out);
    o3.start(t0); o3.stop(t0 + ring + 0.05);

    // SNAP — a third of what it was. It should colour the attack, not be it.
    const o2 = ctx.createOscillator(); o2.type = 'triangle';
    o2.frequency.setValueAtTime(freq * (3.6 - big * 1.4), t0);
    o2.frequency.exponentialRampToValueAtTime(freq * 2, t0 + bend * 0.8);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.linearRampToValueAtTime(vol * 0.12, t0 + 0.0015);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.022 + big * 0.03);
    o2.connect(g2); g2.connect(out);
    o2.start(t0); o2.stop(t0 + 0.2);

    // the film tearing — barely there now, and well below the ear's peak
    const n = ctx.createBufferSource(); n.buffer = A.noiseBuf();
    n.playbackRate.value = 0.8 + Math.random() * 0.4;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass';
    nf.frequency.value = 2400 - big * 1200; nf.Q.value = 0.9;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(vol * 0.09, t0);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.004 + big * 0.005);
    n.connect(nf); nf.connect(ng); ng.connect(out);
    n.start(t0); n.stop(t0 + 0.06);
  },

  init(P) {
    const S = Math.min(P.w, P.h);
    // P.focused is still false here — count off the area
    const big = areaScale(P) > 1.6;
    P.state = {
      cells: [], lace: [], rings: [], evq: [], mevq: [],
      unit: S * 0.05, maxN: big ? 170 : 70,
      pres: 0, heat: 0, press: 0, mergeCd: 0,
      // the arpeggio counter: every cell issued takes the next rung
      arp: 0, zone: 0, cand: 0, candT: 0, nextQ: [],
      acc: 0, tok: 2, mtok: 1, readyN: 0, fill: 0, big: 0, vent: 0, pps: 0, popN: 0, mergeN: 0
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
    const ready = [];
    // hot liquid boils up fast; pressure holds every cell down
    const rate = (0.06 + HE * 0.85) * (1 - s.fill * 0.3);   // fraction of itself per second
    for (let i = C.length - 1; i >= 0; i--) {
      const c = C[i];
      c.born += dt; c.ph += dt * c.wob * (0.6 + HE);
      c.r += c.r * rate * c.gk * dt;
      // real heat weakens the film of what is ALREADY up here, so cranking the
      // left hand starts setting off the lakes you poured cold
      if (HE > 0.5) c.bur = Math.max(c.r, c.bur - c.bur * (HE - 0.5) * 0.30 * dt);
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
        // it has reached its limit — hold it there, stretched and white-veined,
        // and let the arpeggio take it in turn
        c.r = c.bur;
        ready.push(c);
      }
    }

    /* ---- THE QUEUE PLAYS IN THE ORDER IT WAS ISSUED --------------------
       Cells were stamped with successive rungs of the arpeggio on their way
       out of the vent. If they burst in whatever order the physics happens to
       reach them, the arpeggio is shuffled into noise. So the oldest cell
       waiting at its limit always goes first: what you hear is the arpeggio,
       in order, played at whatever speed the heat allows.                 */
    s.readyN = ready.length;
    if (ready.length) {
      ready.sort((a, b) => b.born - a.born);
      for (let q = 0; q < ready.length; q++) {
        if (s.tok < 1) break;
        s.tok -= 1;
        const c = ready[q];
        const idx = C.indexOf(c);
        if (idx < 0) continue;
        C.splice(idx, 1);
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
                if (ov > Math.min(a.r, b.r) * 0.93 && s.mergeCd <= 0) {
                  const A1 = a.r * a.r, A2 = b.r * b.r;
                  const ratio = (a.born >= b.born ? a : b).bur / Math.max((a.born >= b.born ? a : b).r, 1e-4);
                  const keep = a.born >= b.born ? a : b, gone = a.born >= b.born ? b : a;
                  const s1 = Math.max(A1, A2), s2 = Math.min(A1, A2);
                  keep.x = (keep.x * s1 + gone.x * s2) / (s1 + s2);
                  keep.y = (keep.y * s1 + gone.y * s2) / (s1 + s2);
                  keep.vx = (keep.vx * s1 + gone.vx * s2) / (s1 + s2);
                  keep.vy = (keep.vy * s1 + gone.vy * s2) / (s1 + s2);
                  keep.r = Math.sqrt(A1 + A2);
                  // the survivor keeps its OWN remaining time, shortened a little:
                  // a merge hurries the end without jumping the queue
                  keep.bur = keep.r * Math.max(1.05, ratio * 0.8);
                  keep.deg = Math.min(keep.deg, gone.deg);   // the survivor speaks the lower note
                  keep.merges++; keep.flash = 1;
                  dead.add(gone);
                  s.mergeCd = 0.55;                 // one merge, one gulp, and rarely
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
    s.acc += dt * (2.6 + HE * 5.4) * 1.7 * (1 - clamp((s.readyN || 0) / 26)) * (1 - s.fill * 0.5);
    const ap = U * (0.3 + open * 1.1) * (1 + HE * 1.4);   // the aperture
    while (s.acc > 1) {
      s.acc -= 1;
      if (C.length >= s.maxN) { s.acc = 0; break; }
      const a = P.rand() * TAU, dd = ap * Math.sqrt(P.rand());
      const sp = U * (0.8 + HE * 2.4) * 0.82 * (0.6 + P.rand() * 0.8);
      // HOT LIQUID ARRIVES SMALL AND ALREADY BOILING; cool liquid arrives fat
      const r0 = U * (0.10 + (1 - HE) * 0.30) * (0.45 + Math.pow(P.rand(), 1.7) * 1.5);
      // the limit is a MULTIPLE of the birth size, so a cell born fat bursts
      // fat and a speck bursts small, but both take the same time to get there
      const bur = r0 * 3.1;
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
    g.fillStyle = '#03100e';
    g.fillRect(0, 0, w, h);
    const bright = 0.5 + s.pres * 0.5;

    /* ---- THE SOURCE: a hot vent in the middle of the floor ------------ */
    g.globalCompositeOperation = 'lighter';
    const boil = 1 + Math.sin(t * (1.6 + s.heat * 7)) * (0.05 + s.heat * 0.12);
    const vr = U * (1.6 + s.heat * 2.2) * (0.45 + s.vent * 0.9) * boil;
    const vg = g.createRadialGradient(cx, cy, 0, cx, cy, vr);
    vg.addColorStop(0, `rgba(255,${196 + s.heat * 40},${120 - s.heat * 60},${(0.18 + s.heat * 0.42) * bright})`);
    vg.addColorStop(0.35, `rgba(${226 + s.heat * 20},${96 + s.heat * 30},${40},${(0.10 + s.heat * 0.24) * bright})`);
    vg.addColorStop(1, 'rgba(60,150,130,0)');
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

    /* ---- THE MEDIUM: the poured field the cells are sitting in ---------
       Seafoam, and only where there is liquid — the frame stays black where
       nothing has been poured, which is what the fabric needs.            */
    g.globalCompositeOperation = 'lighter';
    for (const c of s.cells) {
      const R = c.r * 2.5;
      const mg = g.createRadialGradient(c.x, c.y, c.r * 0.7, c.x, c.y, R);
      mg.addColorStop(0, `rgba(96,206,178,${0.075 * bright})`);
      mg.addColorStop(0.45, `rgba(64,168,150,${0.055 * bright})`);
      mg.addColorStop(1, 'rgba(30,96,92,0)');
      g.fillStyle = mg;
      g.beginPath(); g.arc(c.x, c.y, R, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'source-over';

    /* ---- THE CELLS AS SOFT DOMES ---------------------------------------
       No outline anywhere: the form is entirely in the shading. One light,
       upper left, so every dome carries a bright shoulder and a shadowed
       lower-right edge, and a contact shadow underneath separates it from
       the ones behind it. Ember on the warm side, violet on the cool one,
       with the amber core of a pour cell at the crown.                    */
    const LX = -0.34, LY = -0.40;
    for (const c of s.cells) {
      const tense = clamp(c.r / c.bur);
      const wob = 1 + Math.sin(c.ph * 1.7) * (0.02 + tense * tense * 0.04);
      const r = c.r * wob;
      if (r < 0.6) continue;
      const warm = clamp(0.5 + (0.5 - c.x / w) * 1.9);
      const hot = Math.pow(tense, 6);
      /* THE NOTE IS THE COLOUR OF THE DOME, not a lamp buried in it: the rung
         swings the hue around the poured palette — ember through crimson into
         violet — so you can still read the pitch off the frame without the
         cell turning into a glowing bead.                                  */
      const rung = (c.deg % 8) / 7;
      /* The rung shifts the hue by a few degrees only. Letting it swing a
         quarter of the wheel turned the pour into a bag of skittles — the
         palette has to stay ember on the warm side and violet on the cool
         one, and the vent pips are where you actually READ the notes. */
      // DOWN through crimson, not up through green: ember 14° → 350° → violet
      // 306°. Interpolating the long way round the wheel is what turned the
      // middle of the frame into limes and cyans.
      // keep them UNWRAPPED to average: once one of the two has crossed 0 and
      // the other has not, the midpoint of the wrapped values lands on the
      // opposite side of the wheel — which is where the cyan ring came from
      const bodyU = 14 - (1 - warm) * 68 + (rung - 0.5) * 20;
      const coreU = 38 - (1 - warm) * 68 + (rung - 0.5) * 14;
      const bodyH = (bodyU + 720) % 360, coreH = (coreU + 720) % 360;
      const midH = ((coreU + bodyU) * 0.5 + 720) % 360;
      // contact shadow — what makes them objects sitting ON something
      const sx = c.x + r * 0.14, sy = c.y + r * 0.18;
      const sg = g.createRadialGradient(sx, sy, r * 0.62, sx, sy, r * 1.3);
      sg.addColorStop(0, `rgba(26,10,44,${0.55 * bright})`);
      sg.addColorStop(1, 'rgba(26,10,44,0)');
      g.fillStyle = sg;
      g.beginPath(); g.arc(sx, sy, r * 1.3, 0, TAU); g.fill();
      /* THE DOME — matte. One broad light from the upper left, a long fall to
         a shadowed lower-right edge, and nothing shiny: the reference reads as
         soft rubber, and a hard specular turns it into a glass bead.       */
      const gr = g.createRadialGradient(c.x + LX * r * 0.55, c.y + LY * r * 0.55, r * 0.06,
        c.x + LX * r * 0.14, c.y + LY * r * 0.14, r * 1.04);
      // mid-value, not blown: the reference domes are SHADED, and a core at
      // 74% lightness under a sheen just reads as a white bead
      gr.addColorStop(0, `hsla(${coreH},${92 - hot * 22}%,${58 + hot * 20}%,${0.99 * bright})`);
      gr.addColorStop(0.38, `hsla(${midH},92%,${48 + c.flash * 12 + hot * 24}%,${0.99 * bright})`);
      gr.addColorStop(0.74, `hsla(${bodyH},90%,${34 + c.flash * 10 + hot * 20}%,${0.99 * bright})`);
      gr.addColorStop(0.94, `hsla(${(bodyU - 20 + 720) % 360},76%,${22 + hot * 12}%,${0.99 * bright})`);
      gr.addColorStop(1, `hsla(${(bodyU - 30 + 720) % 360},70%,${14 + hot * 8}%,${0.99 * bright})`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(c.x, c.y, r, 0, TAU); g.fill();
      // one soft sheen, small and low-contrast — a hint of wetness, no more
      if (r > U * 0.2) {
        const spx = c.x + LX * r * 0.5, spy = c.y + LY * r * 0.5;
        const hg = g.createRadialGradient(spx, spy, 0, spx, spy, r * 0.26);
        hg.addColorStop(0, `rgba(255,246,232,${(0.13 + hot * 0.45) * bright})`);
        hg.addColorStop(1, 'rgba(255,250,240,0)');
        g.fillStyle = hg;
        g.beginPath(); g.arc(spx, spy, r * 0.26, 0, TAU); g.fill();
      }
    }

    /* ---- the lacing where they crowd ---------------------------------- */
    g.globalCompositeOperation = 'lighter';
    for (const [x, y, r, pressv] of s.lace) {
      if (pressv < 0.12) continue;
      const R = r * (0.2 + pressv * 0.3);
      const gr = g.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, `rgba(212,166,255,${(0.10 + pressv * 0.26) * bright})`);
      gr.addColorStop(0.35, `rgba(126,58,190,${(0.08 + pressv * 0.24) * bright})`);
      gr.addColorStop(1, 'rgba(52,20,78,0)');
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
        fg.addColorStop(0, `rgba(255,252,240,${f * 0.95 * bright})`);
        fg.addColorStop(0.4, `rgba(255,186,88,${f * 0.5 * bright})`);
        fg.addColorStop(1, 'rgba(120,220,190,0)');
        g.fillStyle = fg;
        g.beginPath(); g.arc(R.x, R.y, R.r * 2.2, 0, TAU); g.fill();
      }
      // the ring belongs to the LAKES — a tiny cell going is all flash
      const ra = Math.pow(fade, 1.6) * (0.16 + R.k * 0.78) * bright;
      if (ra > 0.02) {
        const rr = R.r * (0.9 + k * 1.4);
        g.strokeStyle = `rgba(${170 - k * 40},${232 - k * 30},${206 - k * 40},${ra})`;
        g.lineWidth = Math.max(2.5 * ms, Math.min(R.r * 0.42, 11 * ms) * fade);
        g.beginPath(); g.arc(R.x, R.y, rr, 0, TAU); g.stroke();
      }
      // the spray: droplets thrown clear of the ring, not spokes
      const sp = R.r * (1.3 + k * 2.4);
      const dr = Math.max(1.5 * ms, R.r * 0.16 * fade * fade);
      g.fillStyle = `rgba(255,${216 - k * 40},${150 - k * 60},${fade * fade * 0.75 * bright})`;
      for (let i = 0; i < R.n; i++) {
        const a = R.a0 + (i / R.n) * TAU;
        g.beginPath(); g.arc(R.x + Math.cos(a) * sp, R.y + Math.sin(a) * sp, dr, 0, TAU); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(150,232,206,0.9)';
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
    /* The rung owns the pitch, full stop. Letting the cell's SIZE pick an
       octave is physically honest (Minnaert) but it was jumping consecutive
       notes by twelve semitones and turning an ascending arpeggio into a
       random walk. Size still says everything it needs to say through the
       length of the ring, the weight of the attack and the sub bloom a lake
       gets underneath it — it just doesn't get to move the note any more. */
    const octOf = () => 0;
    // UP AN OCTAVE. The rungs were landing between 73 and 262 Hz, where a
    // quiet tone has almost no perceived loudness — the arpeggio was there,
    // it just could not compete with its own attack.
    const notePitch = (deg) => H.chordTone(deg || 0, 1);

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
          vc.set(notePitch(c.deg), 0.25);   // each big cell drones its own note
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
          const f = notePitch(ev.deg);
          const vol = (0.10 + size * 0.14) * gate;
          self._pop(A, f, { at, vol, size, pan });
          if (typeof MOut !== 'undefined' && MOut.evNote) MOut.evNote('bells', f, vol * 3.2, at, 0.2 + clamp(size) * 0.62);
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
          const f = notePitch(mv.deg);
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
