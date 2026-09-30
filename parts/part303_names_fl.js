/* ---------- SRC-59.3 · THE NAMES, FULL LIGHT ----------
   Edson, Sep 29 20:01: "the instrument should never change the opacity of
   layers. This is only for the twister." And 20:05: "Smallest, full
   light." Near = less is the least FORM, never dimmer. Measured on 59.2
   with both hands in: 0.8/255 — the right hand was a fader.
   · R used to be LIGHT twice over: how many names burn (the cut) AND how
     bright each one burns (gain 0.34 → 1.89). Now it is only HOW MANY:
     hands in, the brightest ~13% of the nineteen thousand, each at full
     light; hands out, all of them. The mother's glow at the centre no
     longer rides R either.
   · L still lets the shell go (the shear). INSIDE and DIVIDE, the macros,
     are 59.2's; hosted by a host that declares no DIVIDE (Act 1), the
     shell stays ONE — the standalone slow division is for the card only.
   · BOTH HANDS AT THE SOURCE = SILENCE, which 59.2's sound never had:
     gated on the more open hand, as SRC-66.4 and 58.4.
   Everything else is 59.2. */
/* ---------- SRC-59.2 · THE NAMES, DIVIDING ----------
   The Names with TWO MACROS. Edson, Sep 26 (with Gabi), on Act 2: "essa
   célula mãe, ela se multiplica" — after the names are sent, in the music,
   "se multiplicar de verdade, se moverem de forma diferente também." And
   Gabi's worry, accepted: a second single sphere looks like Act 1's circle.
   So the sphere has to stop being one thing.

   INSIDE moves the camera into the shell. The whole thing scales up past
   the frame and the hemisphere nearest you thins away, so what is left is
   the far side wrapping around you: you are among the names, not looking
   at them.

   DIVIDE is the mitosis. One shell becomes two, then four, eight, sixteen,
   each a smaller even shell of its own names (point i belongs to cell
   i mod K, so the golden-angle evenness survives the split), the cells set
   on their own golden-angle lattice around the old centre. Between the
   steps it interpolates, so a slow turn of the knob is a slow division —
   and at every step, still, NO NAME IS CLOSER TO HEAVEN THAN ANY OTHER.

   The hands are The Names' hands: L lets the shell go (the differential
   shear, per cell now), R is how many are burning. The same half-res pixel
   buffer; nineteen thousand marks cannot be nineteen thousand draw calls.

   A LIVE FEED can drive DIVIDE later: if `window.NAMESFEED` exists with a
   0..1 `level`, it wins over the knob. Feasibility is Monday's question;
   the knob is the fallback and it works tonight.                        */
(() => {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));   // 137.507°
  // cell configurations: K = 1, 2, 4, 8, 16 shells. Each cell is smaller
  // (volume-ish preserving) and sits further out on its own lattice.
  const KS = [1, 2, 4, 8, 16];
  const CELL_R = [1.00, 0.74, 0.58, 0.44, 0.32];
  const CELL_D = [0.00, 0.66, 0.70, 0.76, 0.82];
  const CENT = KS.map(K => {
    const c = [];
    for (let j = 0; j < K; j++) {
      if (K === 1) { c.push([0, 0, 0]); continue; }
      const zz = 1 - (2 * j + 1) / K, r = Math.sqrt(Math.max(0, 1 - zz * zz)), th = GOLDEN * j + 0.7;
      c.push([Math.cos(th) * r, zz, Math.sin(th) * r]);
    }
    return c;
  });
  const smooth = f => f * f * (3 - 2 * f);

  reg({
    id: 'SRC-59.3', family: 'SRC-59', ver: 3, title: 'BoT · The Names, Full Light', tech: 'FIBONACCI SHELL / MITOSIS / FULL LIGHT, R = HOW MANY',
    textIsContent: true,
    music: {
      bpm: 58, root: 45, mode: 'aeolian', chordBars: 4,
      chords: [[0, 7, 14, 19, 24], [0, 8, 15, 19, 26], [0, 5, 12, 17, 21], [0, 7, 11, 14, 23]],
      chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am(maj7)9']
    },
    fx: { bloom: 0.5 },
    tags: ['TEMPLE SET', 'ACT 2', 'OPEN L = LET THE SHELL GO', 'OPEN R = HOW MANY', 'MACRO: INSIDE', 'MACRO: DIVIDE', 'NO NAME IS CLOSER'],
    desc: 'The nineteen thousand, and they divide. INSIDE moves you into the shell: it grows past the frame and the near side thins away until you are among the names with the far side wrapping round you. DIVIDE is the mitosis: one shell becomes two, four, eight, sixteen smaller shells, each still an even lattice of its own names, set evenly around the old centre — a slow turn is a slow division. The left hand still lets each shell go into its spiral; the right is how many are burning, each at full light at every hand: only the Twister fades it.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L LETS THE SHELL GO (every cell shears into its own spiral), R OPENS HOW MANY BURN, always at full light. INSIDE and DIVIDE are MACROS on knobs: the camera into the names, and the one cell becoming many. Not on the hands, so the theremin stays free.',
    sound: 'As The Names: A aeolian, a shell drone that opens as the sphere spreads, one plucked note per name crossing the front, the two drone layers beating harder the more the shell is undone.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(19000, Math.round(5200 * areaScale(P)));
      const ux = new Float32Array(n), uy = new Float32Array(n), uz = new Float32Array(n);
      const rad = new Float32Array(n), br = new Float32Array(n);
      const wasFront = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        const zz = 1 - (2 * i + 1) / n;
        const r = Math.sqrt(Math.max(0, 1 - zz * zz));
        const th = GOLDEN * i;
        ux[i] = Math.cos(th) * r; uy[i] = zz; uz[i] = Math.sin(th) * r;
        rad[i] = 0.55 + (i / n) * 0.9;
        br[i] = 0.25 + Math.pow(P.rand(), 2.0) * 0.75;
        wasFront[i] = 0;
      }
      const ow = Math.max(2, (w / 2) | 0), oh = Math.max(2, (h / 2) | 0);
      const oc = document.createElement('canvas'); oc.width = ow; oc.height = oh;
      const og = oc.getContext('2d');
      const img = og.createImageData(ow, oh);
      P.state = { n, ux, uy, uz, rad, br, wasFront, S, cx: w / 2, cy: h / 2,
                  oc, og, img, buf: new Uint32Array(img.data.buffer), ow, oh,
                  pres: 0, spread: 0, light: 0, inside: 0, divide: 0, rot: P.rand() * TAU, drift: P.rand() * 40,
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
      // the macros: hosted, the knobs; standalone, a slow division so the card shows it
      const M = P.macro || {};
      const wantIn = M.inside !== undefined ? M.inside : 0;
      // hosted without a DIVIDE knob (Act 1): one shell. Standalone: the slow division, for the card
      let wantDv = M.divide !== undefined ? M.divide : P.hosted ? 0 : (0.5 + 0.5 * Math.sin(s.drift * 0.06));
      if (window.NAMESFEED && typeof NAMESFEED.level === 'number') wantDv = NAMESFEED.level;   // a live feed wins
      s.inside += (clamp(wantIn) - s.inside) * Math.min(1, dt * 1.4);
      s.divide += (clamp(wantDv) - s.divide) * Math.min(1, dt * 1.2);
      s.rot += dt * 0.085;
      s.cool = Math.max(0, s.cool - dt);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }

      const { n, ux, uy, uz, rad, br, buf, ow, oh, wasFront } = s;
      buf.fill(0);
      const IN = s.inside;
      const R0 = s.S * 0.225 * (1 + IN * 2.4);          // INSIDE: the shell grows past the frame
      const sp = s.spread;
      const bright = (0.45 + s.pres * 0.55) * room;
      const cut = 1 - (0.18 + s.light * 0.82);
      const ocx = ow / 2, ocy = oh / 2;
      const half = R0 / 2;
      const gain = 1.89 * bright;   // FULL LIGHT: R is how many burn, never how bright
      const cool = s.cool;
      let fired = 0;

      // DIVIDE: which two configurations we are between, and how far
      const lvl = clamp(s.divide) * 4;
      const k0 = Math.min(4, lvl | 0), k1 = Math.min(4, k0 + 1);
      const f = k0 === 4 ? 0 : smooth(lvl - k0);
      const K0 = KS[k0], K1 = KS[k1];
      const r0 = CELL_R[k0], r1 = CELL_R[k1], d0 = CELL_D[k0], d1 = CELL_D[k1];
      const C0 = CENT[k0], C1 = CENT[k1];
      // the cells turn together, slowly, the other way from the shear
      const ca2 = Math.cos(s.rot * 0.35), sa2 = Math.sin(s.rot * 0.35);
      const cell = (C, d, j) => { const c = C[j]; return [(c[0] * ca2 - c[2] * sa2) * d, c[1] * d, (c[0] * sa2 + c[2] * ca2) * d]; };

      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        // differential rotation: the further out, the slower it turns
        const rr = 1 + sp * rad[i] * 0.70;
        const a = s.rot / rr;
        const ca = Math.cos(a), sa = Math.sin(a);
        const X = ux[i] * ca - uz[i] * sa;
        const Z = ux[i] * sa + uz[i] * ca;
        const Y = uy[i];
        // its place in the two configurations, blended
        const A0 = cell(C0, d0, i % K0), A1 = cell(C1, d1, i % K1);
        const cr = r0 + (r1 - r0) * f;
        const px0 = A0[0] + (A1[0] - A0[0]) * f + X * cr * rr;
        const py0 = A0[1] + (A1[1] - A0[1]) * f + Y * cr * rr;
        const pz0 = A0[2] + (A1[2] - A0[2]) * f + Z * cr * rr;
        const px = ocx + px0 * half;
        const py = ocy + py0 * half * 0.96;
        if (px < 0 || px >= ow || py < 0 || py >= oh) continue;
        const depth = (pz0 + 1) * 0.5;
        // INSIDE: the near side thins away, so the far side reads as around
        // you — and the far side is what carries the light now, so the depth
        // weighting flips with the knob (outside: near bright; inside: far bright)
        const near = clamp((pz0 - 0.1) / 0.9);
        const fIn = 1 - IN * near * 0.92;
        const wOut = 0.22 + depth * 0.78, wIn = 0.45 + (1 - depth) * 0.75;
        const fv = br[i] * gain * (wOut + (wIn - wOut) * IN) * fIn;
        const front = (pz0 > 0.985 * (1 + IN * 0.3)) ? 1 : 0;
        if (front && !wasFront[i] && cool <= 0 && s.pres > 0.15 && br[i] > 0.82 && fired < 2) {
          s.events.push({ hi: clamp(0.5 - Y * 0.5), pan: clamp(px0) * 0.8, vel: br[i] });
          s.cool = 0.14 + (1 - s.light) * 0.5; fired++;
        }
        wasFront[i] = front;
        const v = Math.min(255, (fv * 255) | 0); if (v < 3) continue;
        const warm = 1 - Math.min(1, sp * rad[i] * 0.9);
        const rC = v * (0.72 + warm * 0.28);
        const gC = v * (0.80 + warm * 0.14);
        const bC = v * (1.0 - warm * 0.22);
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

      // the unseen centre the names are a skin on — one per cell would be a
      // decoration; one at the origin, fading as it divides, is the mother
      const cr0 = s.S * 0.075 * (1 - sp * 0.5) * (1 + IN * 1.5);
      const cg = g.createRadialGradient(s.cx, s.cy, 0, s.cx, s.cy, cr0);
      cg.addColorStop(0, `rgba(255,228,190,${0.15 * (1 - sp) * (1 - clamp(lvl)) * bright})`);
      cg.addColorStop(1, 'rgba(255,228,190,0)');
      g.fillStyle = cg; g.beginPath(); g.arc(s.cx, s.cy, cr0, 0, TAU); g.fill();

      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText(n.toLocaleString() + ' NAMES   SPREAD ' + Math.round(sp * 100) + '   BURNING ' + Math.round(s.light * 100) + '   INSIDE ' + Math.round(IN * 100) + '   DIVIDE ' + Math.round(s.divide * 100) + ' (' + K0 + (f > 0.01 ? '→' + K1 : '') + ')', 10, h - 10);
      }
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
          const s = P.state, now = A.t();
          // BOTH HANDS AT THE SOURCE = SILENCE: the more open hand, silent below ~2%, full by ~15%
          const hand = (typeof SOURCE === 'function' && inp) ? Math.max(SOURCE(inp.L), SOURCE(inp.R)) : 1;
          const zo = clamp((hand - 0.02) / 0.13), gate = (0.3 + s.pres * 0.7) * zo * zo * (3 - 2 * zo);
          const SP = s.spread, L = s.light;
          A.set(shg.gain, (0.0025 + L * 0.006) * gate, 0.3);
          A.set(shf.frequency, 240 + SP * 2200 + L * 500 + s.divide * 600, 0.35);
          try { sh2.detune.setTargetAtTime(3 + SP * 34 + s.divide * 10, now, 0.4); } catch (e) {}
          pad.forEach(p => { p.level((0.0018 + L * 0.0032) * gate, 0.4); p.bright(170 + L * 520 + SP * 420, 0.35); });
          A.set(sg.gain, (0.016 + L * 0.014) * gate, 0.3);
          let k = 0;
          while (s.events.length) {
            const e = s.events.shift(); if (k++ > 2 || gate < 0.01) continue;
            A.pluck2(H.chordTone(Math.round(e.hi * 4), e.hi > 0.6 ? 1 : 0), { vol: (0.005 + e.vel * 0.024) * (0.3 + L * 0.7) * gate, dur: 2.0, rev: 0.8, del: 0.28, pan: e.pan });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', SP); MOut.expr('pad', L); MOut.expr('bells', L * SP); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
