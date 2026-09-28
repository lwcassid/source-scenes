/* ---------- SRC-59 · THE NAMES (the even shell) ----------
   Nineteen thousand names are already on the chip. This is them.

   THE ALGORITHM IS THE ARGUMENT. The points sit on a Fibonacci lattice —
   each one placed at the golden angle 137.507° from the last, climbing z in
   equal steps. That construction is the most even way known to put N points
   on a sphere: no cluster, no seam, no pole favoured. NO NAME IS CLOSER TO
   HEAVEN THAN ANY OTHER. Space as the oldest commons we share, stated as a
   lattice rather than as a caption.

   The left hand lets the shell go. Each name's radius spreads by its own
   index, and because the outer ones then turn slower than the inner ones —
   differential rotation, which is what real shells of gas and stars do — the
   even lattice shears into a spiral. Give it back and it gathers into one
   clean sphere again.

   Drawn into a half-resolution buffer a pixel at a time, then thrown up to
   the full frame: nineteen thousand marks cannot be nineteen thousand draw
   calls, and the softness that comes back down the scaler is the point —
   a haze that resolves into individuals only where they crowd. */
(() => {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));   // 137.507°
  reg({
    id: 'SRC-59', family: 'SRC-59', ver: 1, title: 'BoT · The Names', tech: 'FIBONACCI SHELL / DIFFERENTIAL SHEAR',
    textIsContent: true,
    music: {
      bpm: 58, root: 45, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 14, 19, 24],    // Am(add9)
        [0, 8, 15, 19, 26],    // Fmaj7♯11/A
        [0, 5, 12, 17, 21],    // Dm9/A
        [0, 7, 11, 14, 23]     // Am(maj7)9
      ],
      chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am(maj7)9']
    },
    fx: { bloom: 0.5 },
    tags: ['TEMPLE SET', 'OPEN L = LET THE SHELL GO', 'OPEN R = LIGHT', 'NO NAME IS CLOSER'],
    desc: 'A sphere made of nineteen thousand points, turning. They are not scattered — they are placed on a golden-angle lattice, the most even arrangement a sphere can have, so there is no crowd and no empty quarter and no point nearer the top than any other. Held at the Source it is a single sharp shell you can see the lattice in. Open the left hand and it lets go: every point drifts outward by its own amount, and because the outer ones turn slower than the inner ones the even lattice shears into a long spiral, a sphere unwinding into weather. Close your hand and it gathers, seam by seam, into one clean skin again. The right hand is how many are burning.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L LETS THE SHELL GO — closed, one sharp sphere; opened, the skin thickens into a cloud and then unwinds, the shear giving it away, the outside always lagging the inside. Completely reversible: the same hand gathers it back. R OPENS THE LIGHT: from a faint dust you have to look for, up to a solid burning globe. Names crossing the front of the sphere ring as they pass.',
    sound: 'A aeolian, four bars a chord, the top voice walking E–D–C–B. A deep shell drone whose filter opens as the sphere spreads — letting go is audibly letting go. Over it, names crossing the near meridian pluck a single note each: pitch from how high they cross, pan from which way they are turning, velocity from their brightness. Spreading the shell widens the detune between two drone layers so a gathered sphere is one clean tone and an unwound one beats against itself. Sub on bass, pad on the chord. No drums — this scene has no pulse, it has a rotation.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(19000, Math.round(5200 * areaScale(P)));
      const ux = new Float32Array(n), uy = new Float32Array(n), uz = new Float32Array(n);
      const rad = new Float32Array(n), br = new Float32Array(n);
      const wasFront = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const zz = 1 - (2 * i + 1) / n;                 // equal steps in z
        const r = Math.sqrt(Math.max(0, 1 - zz * zz));
        const th = GOLDEN * i;                          // the golden angle
        ux[i] = Math.cos(th) * r; uy[i] = zz; uz[i] = Math.sin(th) * r;
        rad[i] = 0.55 + (i / n) * 0.9;                  // its own amount to spread by
        br[i] = 0.25 + Math.pow(P.rand(), 2.0) * 0.75;
        wasFront[i] = 0;
      }
      const ow = Math.max(2, (w / 2) | 0), oh = Math.max(2, (h / 2) | 0);
      const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
      const og = oc.getContext('2d');
      const img = og.createImageData(ow, oh);
      P.state = { n, ux, uy, uz, rad, br, wasFront, S, cx: w / 2, cy: h / 2,
                  oc, og, img, buf: new Uint32Array(img.data.buffer), ow, oh,
                  pres: 0, spread: 0, light: 0, rot: P.rand() * TAU, drift: P.rand() * 40,
                  events: [], cool: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleSp = 0.20 + Math.sin(s.drift * 0.040) * 0.09;
      const idleL = 0.24 + Math.sin(s.drift * 0.063 + 1.9) * 0.09;
      s.spread += ((SOURCE(inp.L) * s.pres + idleSp * (1 - s.pres)) - s.spread) * Math.min(1, dt * 5.5);
      s.light += ((SOURCE(inp.R) * s.pres + idleL * (1 - s.pres)) - s.light) * Math.min(1, dt * 6.5);
      s.rot += dt * 0.085;
      s.cool = Math.max(0, s.cool - dt);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      // HOSTED BY THE MIXER: the ground is painted once, by the mixer, and a
      // layer that repaints it erases every layer under it. Standalone this
      // is unchanged.
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }

      const { n, ux, uy, uz, rad, br, buf, ow, oh, wasFront } = s;
      buf.fill(0);
      const R0 = s.S * 0.225;   // sized so a fully unwound shell still fits the 16:10 frame
      const sp = s.spread;
      const bright = (0.45 + s.pres * 0.55) * room;
      const cut = 1 - (0.18 + s.light * 0.82);
      const ocx = ow / 2, ocy = oh / 2;
      const half = R0 / 2;                              // offscreen is half scale
      const gain = (0.34 + s.light * 1.55) * bright;   // one pixel in a half-res buffer needs real weight
      const cool = s.cool;
      let fired = 0;

      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        // differential rotation: the further out, the slower it turns
        const rr = 1 + sp * rad[i] * 0.70;   // stays in frame; the shear is the point, not the size
        const a = s.rot / rr;
        const ca = Math.cos(a), sa = Math.sin(a);
        const X = ux[i] * ca - uz[i] * sa;
        const Z = ux[i] * sa + uz[i] * ca;
        const Y = uy[i];
        const px = ocx + X * half * rr;
        const py = ocy + Y * half * rr * 0.96;
        if (px < 0 || px >= ow || py < 0 || py >= oh) continue;
        const depth = (Z + 1) * 0.5;                    // 1 = nearest the viewer
        const f = br[i] * gain * (0.22 + depth * 0.78);
        // the near meridian: crossing the front, outward on the right
        const front = (Z > 0.985) ? 1 : 0;
        if (front && !wasFront[i] && cool <= 0 && s.pres > 0.15 && br[i] > 0.82 && fired < 2) {
          s.events.push({ hi: clamp(0.5 - Y * 0.5), pan: X * 0.8, vel: br[i] });
          s.cool = 0.14 + (1 - s.light) * 0.5; fired++;
        }
        wasFront[i] = front;
        const v = Math.min(255, (f * 255) | 0); if (v < 3) continue;
        // warm at the core, cooling to ice as it flies out
        const warm = 1 - Math.min(1, sp * rad[i] * 0.9);
        const rC = v * (0.72 + warm * 0.28);
        const gC = v * (0.80 + warm * 0.14);
        const bC = v * (1.0 - warm * 0.22);
        // a 2x2 footprint: a single pixel is halved again by the upscale and
        // disappears, and nineteen thousand invisible names are no picture
        const ix = px | 0, iy = py | 0;
        for (let dy = 0; dy < 2; dy++) {
          const yy = iy + dy; if (yy >= oh) break;
          for (let dx = 0; dx < 2; dx++) {
            const xx = ix + dx; if (xx >= ow) break;
            const k = (dx || dy) ? 0.55 : 1;
            const idx = yy * ow + xx, o = buf[idx];
            const orr = Math.min(255, (o & 255) + rC * k);
            const ogg = Math.min(255, ((o >> 8) & 255) + gC * k);
            const obb = Math.min(255, ((o >> 16) & 255) + bC * k);
            buf[idx] = (255 << 24) | (obb << 16) | (ogg << 8) | orr;
          }
        }
      }
      s.og.putImageData(s.img, 0, 0);
      g.globalCompositeOperation = 'lighter';
      g.imageSmoothingEnabled = true;
      g.drawImage(s.oc, 0, 0, w, h);

      // the unseen centre the names are a skin on
      const cr = s.S * 0.075 * (1 - sp * 0.5);
      const cg = g.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, cr);
      cg.addColorStop(0, `rgba(255,228,190,${(0.05 + s.light * 0.10) * (1 - sp) * bright})`);
      cg.addColorStop(1, 'rgba(255,228,190,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(s.cx, s.cy, cr, 0, TAU); g.fill();

      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      // HOSTED: the mixer draws the readout for the whole movement. A layer
      // that also draws its own puts two lines of text on the same pixels.
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText(n.toLocaleString() + ' NAMES   SPREAD ' + Math.round(sp * 100) + '   LIGHT ' + Math.round(s.light * 100) + (s.pres < 0.3 ? '   · TURNING' : ''), 10, h - 10);
      }

      // HOSTED: the mixer runs the poems once for the whole movement. Left in,
      // this ran the overlay once PER LIVE LAYER — the dark plate stacked and
      // the text was painted over itself three times a frame.
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.004, cutoff: 210, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 46), sg = v.g(0.022); sub.connect(sg); sg.connect(v.group);
      const sh1 = v.osc('triangle', 220), sh2 = v.osc('triangle', 220);
      const shf = v.filter('lowpass', 500, 0.8), shg = v.g(0.0001);
      sh1.connect(shf); sh2.connect(shf); shf.connect(shg); shg.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.75; shg.connect(sd); sd.connect(A.revIn); }
      const tune = gl => {
        A.set(sub.frequency, H.chordTone(0, -2), gl);
        const f = H.chordTone(1, -1); A.set(sh1.frequency, f, gl); A.set(sh2.frequency, f, gl);
      };
      tune(0.05);
      H.onChord(() => {
        place(0.5); tune(0.45);
        const now = A.t();
        for (let i = 0; i < 4; i++) A.tone(H.chordTone(i, -1), { at: now + 0.1 * i, vol: 0.0001, dur: 4, attack: 0.55, type: 'sine', rev: 0, role: 'pad' });
      });
      v.fadeIn(1, 2.2);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t(), gate = 0.3 + s.pres * 0.7;
          const SP = s.spread, L = s.light;
          A.set(shg.gain, (0.0025 + L * 0.006) * gate, 0.3);
          A.set(shf.frequency, 240 + SP * 2200 + L * 500, 0.35);
          try { sh2.detune.setTargetAtTime(3 + SP * 34, now, 0.4); } catch (e) {}   // the shell beating against itself
          pad.forEach(p => { p.level((0.0018 + L * 0.0032) * gate, 0.4); p.bright(170 + L * 520 + SP * 420, 0.35); });
          A.set(sg.gain, (0.016 + L * 0.014) * gate, 0.3);
          let k = 0;
          while (s.events.length) {
            const e = s.events.shift(); if (k++ > 2) continue;
            A.pluck2(H.chordTone(Math.round(e.hi * 4), e.hi > 0.6 ? 1 : 0), { vol: (0.005 + e.vel * 0.024) * (0.3 + L * 0.7) * gate, dur: 2.0, rev: 0.8, del: 0.28, pan: e.pan });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', SP); MOut.expr('pad', L); MOut.expr('bells', L * SP); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
