/* ---------- SRC-58.3 · THE PASSAGE, UP AND DOWN — it reads the palette ----------
   Sep 27, 2026 (PLAN-PALETTE). 58.2 bucketed its streaks between a warm
   white and a Doppler blue it owned; this version reads them.
   · THE STREAKS walk band g2 from its dark end (bucket 0: far, receding) to
     its highlight (bucket 4: near, Doppler) — the Doppler end IS the
     highlight, so hue still comes from the form.
   · WHAT LIES AHEAD (the glow at the vanishing point / the edge) is c3.
   Standalone it declares 58.2's own colours, so the card does not change.
   Everything else is 58.2. */
/* ---------- SRC-58.2 · THE PASSAGE, UP AND DOWN ----------
   The Passage with ONE MACRO — DIRECTION. Edson, Sep 26 (with Gabi), on
   Act 1: "se tornar uma coisa meio estrelas… partículas que você tá
   viajando no espaço… e daí você está indo para cima." And on Act 2: "ele
   pode ir para baixo, como se a câmera estivesse indo para baixo, a gente
   está agora indo para as profundezas."

   That is one scene, not two. DIRECTION at 1 is UP: the stars stream down
   the frame, near ones fast, far ones slow, and the glow of what lies ahead
   sits on the top edge. At 0 it is DOWN: the same field falling upward past
   the lens, the glow on the bottom edge. At 0.5 it is the original Passage,
   pouring outward from the vanishing point. Between, it banks.

   Everything else is The Passage: L opens the SPEED (and the shutter, since
   a streak IS how far a star went while the shutter was open), R opens the
   LIGHT. The Doppler shift still comes from the form — cos θ against the
   direction of travel, whichever way that is. Stars leaving the frame pluck
   a note on the way out, so the music falls as fast as the picture. Act 1
   hosts it at 1, Act 2 hosts it at 0. Standalone it holds at UP.         */
(() => {
  const HAS = typeof PAL !== 'undefined';
  // 58.2's streak ramp, as a band: warm white (u 0) → Doppler blue (u 1)
  const STREAK = u => [255 - u * 95, 196 + u * 44, 150 + u * 105];
  reg({
    id: 'SRC-58.3', family: 'SRC-58', ver: 3, title: 'BoT · The Passage, Up and Down', tech: 'VERTICAL TRAVEL / TRUE EXPOSURE BLUR / READS THE PALETTE',
    palette: HAS ? {
      c: ['#d4af37', '#947733', '#d37b50', '#96cdff', '#4f4f4f'],
      g: [PAL.PRESETS.GOLD1, PAL.PRESETS.COPPER1, PAL.ramp(STREAK)],
      hl: [null, null, 0],
      names: { c3: 'WHAT LIES AHEAD', g2: 'THE STREAKS: FAR → DOPPLER' }
    } : undefined,
    textIsContent: true,
    music: {
      bpm: 64, root: 40, mode: 'aeolian', chordBars: 4,
      chords: [[0, 7, 12, 19, 26], [0, 7, 15, 19, 22], [0, 5, 12, 17, 24], [0, 8, 14, 20, 27]],
      chordNames: ['Em9(no3)', 'Cmaj7/E', 'Em7sus4', 'Am(add9)/E']
    },
    fx: { bloom: 0.5 },
    tags: ['TEMPLE SET', 'ACT 1', 'ACT 2', 'PALETTE: g2 STREAKS · c3 AHEAD', 'OPEN L = SPEED', 'OPEN R = LIGHT', 'MACRO: DIRECTION', 'DOPPLER FROM THE FORM'],
    desc: 'The Passage, with a direction. At DIRECTION 1 you are travelling UP: the stars stream down the frame, the near ones fast and long, the far ones slow and small, and the glow of what lies ahead sits on the top edge. At 0 you are going DOWN into the depths, the same field falling upward past you. At the middle it is the original, pouring outward from a point you never reach. Open the left hand and everything flies; open the right and the field lights.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE SPEED — how fast the field moves and how long each streak is, one thing. R OPENS THE LIGHT. DIRECTION is a MACRO on a knob: up, outward, down. Not on the hands, so the theremin stays free.',
    sound: 'As The Passage: E aeolian, four bars a chord, a rush of filtered noise whose brightness rides the speed, and one plucked note per star that leaves the frame, pitched by where it went, panned to the side it left.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(2200, Math.round(620 * areaScale(P)));
      const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n), br = new Float32Array(n);
      const wasIn = new Uint8Array(n);
      const FAR = 1.0, NEAR = 0.035;
      for (let i = 0; i < n; i++) {
        const a = P.rand() * TAU, rr = Math.pow(P.rand(), 0.5) * 0.72;
        x[i] = Math.cos(a) * rr; y[i] = Math.sin(a) * rr * 0.9;
        z[i] = NEAR + P.rand() * (FAR - NEAR);
        br[i] = 0.25 + Math.pow(P.rand(), 2.2) * 0.75;
        wasIn[i] = 1;
      }
      P.state = { n, x, y, z, br, wasIn, FAR, NEAR, cx: w / 2, cy: h / 2, S,
                  pres: 0, spd: 0, light: 0, dir: 1, drift: P.rand() * 50, events: [], cool: 0, f: S * 0.62, v: 0, vy: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleS = 0.20 + Math.sin(s.drift * 0.048) * 0.09;
      const idleL = 0.24 + Math.sin(s.drift * 0.071 + 0.8) * 0.09;
      s.spd += ((SOURCE(inp.L) * s.pres + idleS * (1 - s.pres)) - s.spd) * Math.min(1, dt * 6);
      s.light += ((SOURCE(inp.R) * s.pres + idleL * (1 - s.pres)) - s.light) * Math.min(1, dt * 6.5);
      // DIRECTION: the host's macro (0 down · 0.5 outward · 1 up); standalone holds UP
      const wantDir = (P.macro && P.macro.dir !== undefined) ? P.macro.dir : 1;
      s.dir += (clamp(wantDir) - s.dir) * Math.min(1, dt * 1.6);
      const D = s.dir * 2 - 1;                                 // -1 down … +1 up

      const { n, x, y, z, br, wasIn, FAR, NEAR } = s;
      const v = 0.035 + Math.pow(s.spd, 1.6) * 1.15;          // scene units per second
      const vz = v * (1 - Math.abs(D));                        // forward part
      const vy = v * D * 0.55;                                 // vertical part: UP = the stars go DOWN the frame (+y)
      const ring = 0.40;
      s.cool = Math.max(0, s.cool - dt);
      const cut = 1 - (0.20 + s.light * 0.80);
      for (let i = 0; i < n; i++) {
        z[i] -= vz * dt;
        y[i] += vy * dt;
        if (z[i] <= NEAR) {   // past you — respawn at the far wall
          const a = P.rand() * TAU, rr = Math.pow(P.rand(), 0.5) * 0.72;
          x[i] = Math.cos(a) * rr; y[i] = Math.sin(a) * rr * 0.9;
          z[i] = FAR; br[i] = 0.25 + Math.pow(P.rand(), 2.2) * 0.75; wasIn[i] = 1;
          continue;
        }
        // vertical travel: a star that leaves the field wraps to the other edge — and plucks on the way out
        if (y[i] > 0.75 || y[i] < -0.75) {
          if (br[i] > cut && s.cool <= 0 && s.pres > 0.15) {
            s.events.push({ pan: clamp(x[i] / 0.72) * 0.8, hi: y[i] > 0 ? 0.25 : 0.8, vel: br[i] });
            s.cool = 0.055 + (1 - s.spd) * 0.30;
          }
          y[i] = y[i] > 0 ? y[i] - 1.5 : y[i] + 1.5;
          x[i] = (P.rand() - 0.5) * 1.44;
          wasIn[i] = 1;
          continue;
        }
        // the crossing: projected radius passing the ring, outward (the forward part)
        const pr = Math.sqrt(x[i] * x[i] + y[i] * y[i]) * (s.f / z[i]) / s.S;
        const inside = pr < ring ? 1 : 0;
        if (wasIn[i] && !inside && br[i] > cut && s.cool <= 0 && s.pres > 0.15) {
          s.events.push({ pan: clamp((x[i] * (s.f / z[i])) / (P.w * 0.5) * 0.5 + 0.5) * 2 - 1,
                          hi: clamp(0.5 - (y[i] * (s.f / z[i])) / (P.h * 0.9)),
                          vel: br[i] });
          s.cool = 0.055 + (1 - s.spd) * 0.30;
        }
        wasIn[i] = inside;
      }
      s.v = v; s.vz = vz; s.vy = vy; s.D = D;
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const bright = (0.5 + s.pres * 0.5) * room;
      const { n, x, y, z, br, f, cx, cy } = s;
      const D = s.D || 0, vz = s.vz || 0, vy = s.vy || 0;
      const cut = 1 - (0.20 + s.light * 0.80);
      const EXP = 0.026 + Math.pow(s.spd, 1.4) * 0.12;      // shutter, in seconds
      const BK = 5, paths = []; for (let b = 0; b < BK; b++) paths.push([]);
      // the direction of travel, for the Doppler: ahead is where the stars come FROM
      const mL = Math.hypot(vy, vz) || 1, my = -vy / mL, mz = vz / mL;

      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        // where it was when the shutter opened
        const z0 = z[i], z1 = Math.max(s.NEAR * 0.9, z[i] + vz * EXP);
        const y0 = y[i], y1 = y[i] - vy * EXP;
        const k0 = f / z0, k1 = f / z1;
        const ax = cx + x[i] * k1, ay = cy + y1 * k1;
        const bx = cx + x[i] * k0, by = cy + y0 * k0;
        if (bx < -w || bx > w * 2 || by < -h || by > h * 2) continue;
        const pl = Math.sqrt(x[i] * x[i] + y0 * y0 + z0 * z0) || 1;
        const cosT = Math.max(0, (y0 * my + z0 * mz) / pl);
        const blue = clamp(Math.pow(cosT, 1.8) * (0.30 + s.spd * 0.85));
        const depth = clamp(1 - z0 / s.FAR);
        const bk = Math.min(BK - 1, ((blue * 0.65 + depth * 0.35) * BK) | 0);
        paths[bk].push(ax, ay, bx, by, br[i] * (0.35 + depth * 0.65));
      }

      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      for (let b = 0; b < BK; b++) {
        const arr = paths[b]; if (!arr.length) continue;
        const fb = (b + 0.5) / BK;
        const sc = HAS ? PAL.along(P, 2, fb, STREAK) : STREAK(fb);
        const r = Math.round(sc[0]), gg = Math.round(sc[1]), bb = Math.round(sc[2]);
        g.strokeStyle = `rgba(${r},${gg},${bb},${(0.07 + s.light * 0.30) * bright})`;
        g.lineWidth = (0.7 + fb * 1.9) * ms;
        g.beginPath();
        for (let j = 0; j < arr.length; j += 5) { g.moveTo(arr[j], arr[j + 1]); g.lineTo(arr[j + 2], arr[j + 3]); }
        g.stroke();
      }

      // what lies ahead: a breath of blue at the vanishing point when going forward,
      // on the top edge going up, on the bottom edge going down
      const ah = (HAS && PAL.c(P, 3)) || [150, 205, 255], AH = ah[0] + ',' + ah[1] + ',' + ah[2];
      const fw = 1 - Math.abs(D);
      if (fw > 0.02) {
        const vr = Math.min(w, h) * (0.05 + s.spd * 0.09);
        const vg = g.createRadialGradient(cx, cy, 0, cx, cy, vr);
        vg.addColorStop(0, `rgba(${AH},${(0.05 + s.spd * 0.20) * s.light * bright * fw})`);
        vg.addColorStop(1, `rgba(${AH},0)`);
        g.fillStyle = vg; g.beginPath(); g.arc(cx, cy, vr, 0, TAU); g.fill();
      }
      if (Math.abs(D) > 0.02) {
        const eh = h * (0.10 + s.spd * 0.18), top = D > 0;
        const lg = top ? g.createLinearGradient(0, 0, 0, eh) : g.createLinearGradient(0, h, 0, h - eh);
        lg.addColorStop(0, `rgba(${AH},${(0.05 + s.spd * 0.22) * s.light * bright * Math.abs(D)})`);
        lg.addColorStop(1, `rgba(${AH},0)`);
        g.fillStyle = lg; g.fillRect(0, top ? 0 : h - eh, w, eh);
      }

      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText('SPEED ' + Math.round(s.spd * 100) + '   LIGHT ' + Math.round(s.light * 100) + '   DIR ' + (D > 0.33 ? 'UP' : D < -0.33 ? 'DOWN' : 'OUT') + ' ' + Math.round(s.dir * 100) + '   SHUTTER ' + (EXP * 1000).toFixed(0) + 'ms', 10, h - 10);
      }
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.004, cutoff: 220, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 41), sg = v.g(0.022); sub.connect(sg); sg.connect(v.group);
      const nz = A.ctx.createBufferSource(); nz.buffer = A.noiseBuf(); nz.loop = true;
      const nf = v.filter('bandpass', 500, 0.9), ng = v.g(0.0001);
      nz.connect(nf); nf.connect(ng); ng.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.55; ng.connect(sd); sd.connect(A.revIn); }
      try { nz.start(); } catch (e) {}
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.35); tune(0.3); });
      v.fadeIn(1, 1.8);
      return {
        tick(inp, dt) {
          const s = P.state, gate = 0.3 + s.pres * 0.7, S = s.spd, L = s.light;
          A.set(ng.gain, (0.0008 + S * 0.011) * (0.4 + L * 0.8) * gate, 0.25);
          A.set(nf.frequency, 320 + S * 2600, 0.25);
          try { nf.Q.setTargetAtTime(0.7 + S * 2.5, A.t(), 0.3); } catch (e) {}
          pad.forEach(p => { p.level((0.0018 + L * 0.0035) * gate, 0.4); p.bright(180 + L * 600 + S * 400, 0.3); });
          A.set(sg.gain, (0.016 + S * 0.016) * gate, 0.3);
          let fired = 0;
          while (s.events.length) {
            const e = s.events.shift();
            if (fired++ > 3) continue;
            const deg = Math.round(e.hi * 4);
            A.pluck2(H.chordTone(deg, e.hi > 0.62 ? 1 : 0), { vol: (0.006 + e.vel * 0.030) * (0.3 + L * 0.7) * gate, dur: 1.6, rev: 0.7, del: 0.3, pan: e.pan * 0.8 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', S); MOut.expr('lead', L); MOut.expr('bass', S); }
        },
        stop() { try { nz.stop(); } catch (e) {} v.kill(); }
      };
    }
  });
})();
