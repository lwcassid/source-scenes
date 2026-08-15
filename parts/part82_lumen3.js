/* ---------- SRC-38.3 · LUMEN FIELD (crystals in the sun) ---------- */
reg({
  id: 'SRC-38.3', family: 'SRC-38', ver: 3, title: 'Lumen Film', tech: 'GEM FILM / APERTURE ORGAN',
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
  tags: ['FACETED GEM FIELD', 'RAYS SPARK FROM CORNERS', 'DISPERSION NOT RAINBOW', 'TURN THEM IN THE SUN'],
  desc: 'V3: the diamonds are cut stones now, not painted shapes — each one built from eight interior facets instead of one flat gradient behind a bold rim, so it reads as a small three-dimensional gem rather than a sticker. The sunlight is a fixed thing in the room; the crystals are what move. Where a hole opens, the light doesn\'t spark from an arbitrary point — it sparks from the diamond\'s own corners, exactly where a cut stone actually throws a glint, and the ray carries a blue-to-white-to-gold fringe like dispersion through real glass, not a hue wheel. Turn the field and every corner sweeps past the light in turn.',
  interact: 'R = LIGHT PRESSURE, unchanged — the lamp behind the sheet. Draw in and the film is closed, a faint faceted lacework and nothing else. Reach out and the junctions blow open one at a time, from the middle of the sheet outward, each one adding its own held note to the chord: the frame fills with light and the chord fills with voices, and you can hold it anywhere on the way. A hole always tells you before it commits — it leaks a little glow half a beat early, then blooms into a corner-flare with its note on the sixteenth. L = ORIENTATION, new this version — an absolute dial, not a speed: hand at the sphere and the crystals sit at rest; reach out and the whole field turns with your hand, up to a full turn at full reach, like rotating a stone between your fingers in the sun. Every open hole\'s rays are anchored to its diamond\'s actual corners, so turning L visibly sweeps the rays and re-lights which facets catch the glare. Sonically L still runs the same glassy-to-warm sweep it always has — turning fully out brightens and thins the voices, same as the old "thin film" did.',
  sound: 'An aperture organ. Every open hole holds one voice — pitch by where it sits in the frame (high in the frame = high in the chord), stereo position by where it sits left to right — so the picture and the chord are literally the same object; count the holes and you have counted the voices. Voices enter rolled low-to-high like a harp and each entrance is doubled by a glass bell (MIDI role: bells) on the sixteenth it commits. L still opens every voice\'s filter together and detunes their partials — reach out and the pad turns from warm and closed to thin and glassy, independent of which way the crystals are actually facing on screen. Underneath: a slow air bed and a root pedal that never moves. NO PERCUSSION — this is the scene that leaves the room quiet enough to talk in. Ableton: pad ch2 = the aperture voices (CC74 = L), bells ch5, texture ch6 = air, bass ch3 = pedal.',

  init(P) {
    const S = Math.min(P.w, P.h), w = P.w, h = P.h;
    // P.focused is still false during init — size off the area instead
    const N = areaScale(P) > 1.6 ? 44 : 18;
    const cells = [];
    for (let i = 0; i < N; i++) {
      // hue lives in one of two dispersion families — cool blue/cyan or warm
      // gold/amber — never the green/violet/pink band between them
      const cool = P.rand() < 0.55;
      cells.push({
        x: P.rand() * w, y: P.rand() * h,
        r: S * (0.13 + P.rand() * 0.11),
        ph: P.rand() * TAU, sp: 0.1 + P.rand() * 0.22,
        hue: cool ? 196 + (P.rand() - 0.5) * 30 : 32 + (P.rand() - 0.5) * 24,
        drift: (P.rand() - 0.5) * 0.5,
        baseRot: P.rand() * TAU, rot: 0
      });
    }
    // a few rounds of pushing apart — soap does this on its own in a second
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = cells[i], b = cells[j];
          // 0.74 — the cells must OVERLAP, or the sheet has holes in it that
          // are not apertures, just gaps, and it stops reading as one film
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
    // THE SEAMS: every place two cells press together is a junction, and a
    // junction is where the film gets thin enough for the lamp to find it.
    const ap = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = cells[i], b = cells[j];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        if (d > (a.r + b.r) * 0.82) continue;
        const k = a.r / (a.r + b.r);
        ap.push({ a: i, b: j, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, open: 0, lit: 0, on: false, arm: 0, size: Math.min(a.r, b.r) });
      }
    }
    // thresholds rise with distance from the middle: the light spreads outward
    const cx = w / 2, cy = h / 2, diag = Math.hypot(w, h) * 0.5;
    for (const p of ap) p.th = clamp(Math.hypot(p.x - cx, p.y - cy) / diag * 0.85 + 0.06) * (0.75 + P.rand() * 0.45);
    ap.sort((u, z) => u.th - z.th);
    ap.forEach((p, i) => { p.i = i; p.voice = i < 8 ? i : -1; });
    P.state = { cells, ap, pres: 0, lightP: 0, thick: 0, rotL: 0, spin: 0, openN: 0, lamp: 0, evq: [] };
  },

  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
    s.lightP += (clamp(inp.R) - s.lightP) * Math.min(1, dt * 7);
    s.thick += (clamp(inp.L) - s.thick) * Math.min(1, dt * 6);
    // idle tease: the lamp behind the sheet breathes on its own
    const idle = (1 - s.pres) * (0.12 + 0.1 * Math.sin(t * 0.31));
    s.lamp = Math.max(s.lightP, idle);

    // ORIENTATION: absolute dial. Hand at the sphere = the field sits at its
    // resting cut; reach out and the whole field turns with the hand, up to
    // one full turn — no momentum, it tracks the hand directly. At rest
    // (no presence) the field settles back to zero, per the abandoned-scene
    // rule, with a tiny sinusoidal wobble that hints it CAN be turned.
    s.rotL += (clamp(inp.L) - s.rotL) * Math.min(1, dt * 8);
    const targetSpin = s.pres > 0.05 ? s.rotL * TAU : 0;
    s.spin += (targetSpin - s.spin) * Math.min(1, dt * 7);

    for (const c of s.cells) {
      c.ph += dt * c.sp;
      c.x += Math.cos(c.ph * 0.7 + c.drift) * dt * 5;
      c.y += Math.sin(c.ph) * dt * 4;
      c.rot = c.baseRot + s.spin + (1 - s.pres) * 0.05 * Math.sin(t * 0.25 + c.ph * 2);
    }
    let open = 0;
    for (const p of s.ap) {
      const a = s.cells[p.a], b = s.cells[p.b];
      const k = a.r / (a.r + b.r);
      p.x = a.x + (b.x - a.x) * k; p.y = a.y + (b.y - a.y) * k;
      const want = s.lamp > p.th;
      // TELEGRAPH: light starts leaking through the seam before the hole
      // commits, so the eye is warned half a beat before the ear.
      const lead = clamp((s.lamp - p.th + 0.09) / 0.14);
      p.lit += (lead - p.lit) * Math.min(1, dt * 9);
      if (want !== p.on) {
        p.arm += dt;
        if (p.arm > 0.05) { p.on = want; p.arm = 0; s.evq.push({ p, on: want }); }
      } else p.arm = 0;
      p.open += ((p.on ? 1 : 0) - p.open) * Math.min(1, dt * (p.on ? 4 : 2.4));
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
    const gate = clamp(s.pres * 1.15);          // keeps the field dark at rest
    const LIGHT_DIR = -Math.PI / 2;              // the sun is fixed; the field turns

    // a diamond's 4 vertices — taller than wide, like a cut stone. Because
    // each vertex sits on a pure axis before rotation (up/right/down/left),
    // its WORLD angle is always exactly c.rot + k*90° — that's what lets the
    // rays below aim precisely at a corner instead of a made-up direction.
    const diamondPts = (c, rScale) => {
      const rx = c.r * 0.78 * rScale, ry = c.r * 1.08 * rScale, a = c.rot;
      const ca = Math.cos(a), sa = Math.sin(a);
      const raw = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]];
      return raw.map(([x, y]) => [c.x + x * ca - y * sa, c.y + x * sa + y * ca]);
    };
    const vertAngle = (rot, k) => rot - Math.PI / 2 + k * (Math.PI / 2);
    const nearestVert = (rot, ang) => {
      let best = 0, bd = Infinity;
      for (let k = 0; k < 4; k++) {
        const d = Math.abs(Math.atan2(Math.sin(ang - vertAngle(rot, k)), Math.cos(ang - vertAngle(rot, k))));
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    };
    const strokePoly = pts => {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.closePath(); g.stroke();
    };

    // ---- THE FILM: eight interior facets per stone (crown + edge-splits),
    // each lit by a fixed overhead sun crossed with its OWN world angle —
    // so as the field turns, different facets flare in turn, same geometry
    // that drives the ray corners below. Gated by presence: at rest the
    // litness swing collapses and the sheet stays a dark faceted lacework.
    for (const c of s.cells) {
      const pts = diamondPts(c, 1);
      const mids = pts.map((p, i) => { const q = pts[(i + 1) % 4]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; });
      const ring = [pts[0], mids[0], pts[1], mids[1], pts[2], mids[2], pts[3], mids[3]];
      for (let j = 0; j < 8; j++) {
        const q0 = ring[j], q1 = ring[(j + 1) % 8];
        const fmx = (q0[0] + q1[0]) / 2, fmy = (q0[1] + q1[1]) / 2;
        const facetAngle = Math.atan2(fmy - c.y, fmx - c.x);
        const lit = 0.5 + 0.5 * Math.cos(facetAngle - LIGHT_DIR);
        const Lval = 4 + lit * 34 * gate + s.lamp * 12;
        const sat = 60 - lit * 14 * gate;
        const fg = g.createLinearGradient(c.x, c.y, fmx, fmy);
        fg.addColorStop(0, `hsla(${c.hue},${(sat * 0.7).toFixed(0)}%,3%,0.95)`);
        fg.addColorStop(0.68, `hsla(${c.hue},${sat.toFixed(0)}%,${(Lval * 0.55).toFixed(0)}%,0.9)`);
        fg.addColorStop(1, `hsla(${c.hue},${sat.toFixed(0)}%,${Lval.toFixed(0)}%,0.87)`);
        g.fillStyle = fg;
        g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(q0[0], q0[1]); g.lineTo(q1[0], q1[1]); g.closePath(); g.fill();
      }
    }
    // one thin soft seam per stone — not a bold rim, just enough to
    // separate cell from cell; almost nothing at rest, blooms with lamp
    g.globalCompositeOperation = 'lighter';
    g.filter = `blur(${(1.6 * ms).toFixed(1)}px)`;
    for (const c of s.cells) {
      const pts = diamondPts(c, 1.01);
      g.lineWidth = Math.max(1.2 * ms, c.r * 0.022);
      g.strokeStyle = `hsla(${(c.hue + 12) % 360},80%,${28 + s.lamp * 36}%,${(0.05 + s.lamp * 0.4) * bright})`;
      strokePoly(pts);
    }
    g.filter = 'none';

    // ---- THE LAMP: sunlight caught at the diamonds' own corners. Each
    // aperture picks the nearest VERTEX of each adjoining stone and fires
    // its ray straight along that corner — turning L rotates the corners,
    // so it visibly sweeps which direction every ray points.
    g.filter = `blur(${(1.5 * ms).toFixed(1)}px)`;
    for (const p of s.ap) {
      const a = Math.max(p.lit * 0.35, p.open);
      if (a < 0.01) continue;
      const R = p.size * (0.15 + a * 0.45);
      const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
      gr.addColorStop(0, `rgba(255,255,255,${(Math.min(0.92, a) * bright).toFixed(2)})`);
      gr.addColorStop(0.3, `hsla(200,85%,82%,${(a * 0.55 * bright).toFixed(2)})`);
      gr.addColorStop(0.7, `hsla(34,90%,68%,${(a * 0.28 * bright).toFixed(2)})`);
      gr.addColorStop(1, 'hsla(34,90%,60%,0)');
      g.fillStyle = gr;
      const dR = R * 1.15;
      g.beginPath();
      g.moveTo(p.x, p.y - dR); g.lineTo(p.x + dR * 0.62, p.y);
      g.lineTo(p.x, p.y + dR); g.lineTo(p.x - dR * 0.62, p.y);
      g.closePath(); g.fill();

      if (p.open > 0.2) {
        const A = s.cells[p.a], B = s.cells[p.b];
        const angA = Math.atan2(p.y - A.y, p.x - A.x), angB = Math.atan2(p.y - B.y, p.x - B.x);
        const kA = nearestVert(A.rot, angA), kB = nearestVert(B.rot, angB);
        const L = R * (1.4 + p.open * 2.4);
        const dirs = [
          { a: vertAngle(A.rot, kA), len: 1 },
          { a: vertAngle(A.rot, (kA + 1) % 4), len: 0.45 },
          { a: vertAngle(B.rot, kB), len: 1 },
          { a: vertAngle(B.rot, (kB + 1) % 4), len: 0.45 }
        ];
        for (const dr of dirs) {
          const Ln = L * dr.len, cx = Math.cos(dr.a) * Ln, cy = Math.sin(dr.a) * Ln;
          // dispersion fringe: blue near the spark, warm gold at the tip —
          // like light bending through the edge of real glass, no rainbow
          const lg = g.createLinearGradient(p.x, p.y, p.x + cx, p.y + cy);
          const av = p.open * (dr.len > 0.9 ? 0.32 : 0.16) * bright;
          lg.addColorStop(0, `rgba(255,255,255,${(av * 1.3).toFixed(2)})`);
          lg.addColorStop(0.22, `hsla(202,88%,74%,${av.toFixed(2)})`);
          lg.addColorStop(0.6, `hsla(0,0%,96%,${(av * 0.7).toFixed(2)})`);
          lg.addColorStop(1, `hsla(34,92%,62%,0)`);
          g.strokeStyle = lg;
          g.lineWidth = Math.max(2 * ms, R * (dr.len > 0.9 ? 0.2 : 0.11) * p.open);
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + cx, p.y + cy); g.stroke();
        }
      }
    }
    g.filter = 'none';
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(190,225,255,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('HOLES ' + s.openN + '/' + s.ap.length + '   LAMP ' + Math.round(s.lamp * 100) +
      '   TURN ' + Math.round(s.spin / TAU * 100) + '%' +
      (s.pres < 0.3 ? '   · CLOSED' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();
    const s0 = P.state;

    /* --- air behind the sheet ------------------------------------------ */
    const n = v.noise(), nf = v.filter('bandpass', 500, 0.9), ng = v.g(0.006);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- ONE VOICE PER HOLE. Eight of them; the rest of the sheet is
       light only. Pitch by height in the frame, pan by side — the chord
       and the picture are the same object.                               */
    const NV = 8;
    const voices = [];
    for (let i = 0; i < NV; i++) {
      const o1 = v.osc('triangle', 220), o2 = v.osc('triangle', 220), o3 = v.osc('sine', 440);
      o2.detune.value = 6;
      const f = v.filter('lowpass', 700, 1.1);
      const g = v.g(0.0001);
      const pan = A.ctx.createStereoPanner ? A.ctx.createStereoPanner() : null;
      o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g);
      if (pan) { g.connect(pan); pan.connect(v.group); } else { g.connect(v.group); }
      if (AE.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; g.connect(sd); sd.connect(AE.revIn); }
      voices.push({ o1, o2, o3, f, g, pan, freq: 220, note: -1, lvl: 0 });
    }
    const setV = (vc, freq, glide) => {
      if (!isFinite(freq) || freq <= 20) return;
      vc.freq = freq;
      A.set(vc.o1.frequency, freq, glide);
      A.set(vc.o2.frequency, freq, glide);
      A.set(vc.o3.frequency, freq * 2.01, glide);
      if (typeof MOut !== 'undefined') {
        const note = MOut.f2n(freq);
        if (note !== vc.note) {
          const ch = MOut.chFor('pad'), p = performance.now();
          if (vc.note >= 0 && MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0], p); } catch (e) {} }
          vc.note = note;
          MOut.log.push({ p, role: 'pad', ch, note, vel: 62, durMs: 2600 });
          if (MOut.wants() && MOut.port) { try { MOut.port.send([0x90 | (ch - 1), note, 62], p); } catch (e) {} }
        }
      }
    };

    /* --- the pedal ------------------------------------------------------ */
    const sub = A.padVoices(v, 1, { type: 'triangle', gain: 0.014, cutoff: 220, q: 0.5 });
    const retune = glide => {
      sub[0].set(H.rootFreq(-2), glide);
      // every open hole re-voices into the new chord, rolled low to high
      const ap = P.state.ap;
      for (const p of ap) {
        if (p.voice < 0 || !p.on) continue;
        const vc = voices[p.voice];
        setV(vc, H.chordTone(p.deg || 0, p.oct || 0), glide);
      }
    };
    retune(0.05);
    H.onChord(() => retune(0.2));
    v.fadeIn(1, 1.6);

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;
        const thick = s.thick || 0;

        A.set(ng.gain, (0.003 + s.lamp * 0.012) * gate, 0.4);
        A.set(nf.frequency, 360 + s.lamp * 1500 + thick * 400, 0.4);
        sub[0].level(0.01 + s.lamp * 0.008, 0.5);

        /* ---- holes committing: the entrance is rolled and quantised --- */
        let ev, i = 0;
        while ((ev = s.evq.shift()) && i < 6) {
          i++;
          const p = ev.p;
          if (p.voice < 0) continue;
          const vc = voices[p.voice];
          if (ev.on) {
            // HEIGHT IS PITCH: a hole near the top of the sheet sings high
            const up = clamp(1 - p.y / P.h);
            const deg = Math.round(up * 9);
            const oct = up > 0.72 ? 1 : 0;
            p.deg = deg; p.oct = oct;
            setV(vc, H.chordTone(deg, oct), 0.08);
            if (vc.pan) A.set(vc.pan.pan, clamp(p.x / P.w * 2 - 1, -1, 1) * 0.7, 0.2);
            const at = T.next(0.25) + p.voice * 0.012;   // low-to-high harp stagger
            A.set(vc.g.gain, 0.024 + thick * 0.012, 0.35);
            A.bell(H.chordTone(deg + 3, oct + 1), { at, vol: 0.05 * gate, dur: 2.4, pan: clamp(p.x / P.w * 2 - 1, -1, 1) * 0.8, rev: 0.7 });
          } else {
            A.set(vc.g.gain, 0.0001, 0.5);
            if (typeof MOut !== 'undefined' && vc.note >= 0) {
              const ch = MOut.chFor('pad');
              if (MOut.wants() && MOut.port) { try { MOut.port.send([0x80 | (ch - 1), vc.note, 0]); } catch (e) {} }
              vc.note = -1;
            }
          }
        }

        /* ---- L opens every voice's filter together --------------------- */
        for (let k = 0; k < NV; k++) {
          const vc = voices[k];
          A.set(vc.f.frequency, 420 + (1 - thick) * 2600 + s.lamp * 700, 0.25);
          A.set(vc.o2.detune, 4 + (1 - thick) * 16, 0.3);
          A.set(vc.o3.detune, (1 - thick) * 9, 0.3);
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', 1 - thick);
          MOut.expr('texture', s.lamp);
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
