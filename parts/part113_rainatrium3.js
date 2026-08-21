/* ---------- SRC-16.5 · RAIN ATRIUM V5 (natural-time revision of the
   sunset-storm line; renumbered from 16.3 — see part112_rainatrium2.js) ---------- */
reg({
  id: 'SRC-16.5', family: 'SRC-16', ver: 5, title: 'Rain Atrium V5', tech: 'TWO-FIELD WATER / NATURAL TIME',
  music: {
    bpm: 64, root: 50, mode: 'aeolian', chordBars: 2,
    chords: [
      [0, 7, 15, 22, 26],    // D · A · F · C · E
      [0, 8, 15, 19, 22],    // D · Bb · F · A · C
      [0, 10, 15, 17, 26],   // D · C · F · G · E
      [0, 5, 8, 15, 19]      // D · G · Bb · F · A
    ],
    chordNames: ['Dm9', 'B♭maj9/D', 'Dm11', 'Gm9/D']
  },
  fx: { bloom: 0.55, edge: true },
  tags: ['WAVE INTERFERENCE', 'FELT PIANO', 'NATURAL TIME', 'EARNED GROOVE', 'SUNSET DRIFT'],
  desc: 'The pool at dusk, on nature\'s clock. Rain from the left writes ember rings, rain from the right violet, rose where they argue — but the rain now falls the way rain falls: in gusts and flurries, clustered where the cell is passing, never on a grid. Each drop lands bright and blooms slow. The felt piano plays WHEN the water is struck, so the phrasing is the weather\'s own; underneath, once the rain commits, a quiet groove fades in — a heartbeat kick, the chord root, swung ticks — the grid a musician can hold onto while the sky improvises. The palette itself drifts with the harmony, ember toward rose, violet toward magenta, too slowly to catch happening.',
  interact: 'L = rain density over the left (ember) half, R = right (violet). Density, not position — and not steadiness either: the rain gusts and wanders on its own, so equal hands never sound or look the same twice. Sustained downpour from BOTH hands charges the storm; the sky warns a bar ahead, thunder lands on the downbeat. Stillness after a strike earns the golden petrichor answer.',
  sound: 'Felt piano in natural time over a D pedal. Pitch is quantized — every drop lands on the chord ladder of a pinned Dm9 · B♭maj9/D · Dm11 · Gm9/D cycle — but TIMING is not: notes sound when drops strike, gusts cluster them into phrases, velocity follows drop size, and at full downpour not every drop speaks. Chord changes still bloom as rolled voicings sized to the weather. The grid lives in the EARNED layer: past medium rain a soft kick, chord-root bass and swung offbeat ticks fade in with intensity and vanish when the rain thins — zero percussion in the small state. Bed: whisper pedal + per-side rain noise (rumble, granulated patter, downpour sparkle), panned hard L/R. Thunder needs ~10s of two-hand downpour, telegraphed one bar. Mids stay empty; the key never moves.',
  // felt piano: mostly fundamental, muted stretched partials, soft attack, felt thump
  _felt(A, freq, { at = 0, vol = 0.1, pan = 0, dur = 1.4 } = {}) {
    if (!isFinite(freq) || freq <= 20) return;
    const t0 = Math.max(A.t(), at || 0);
    A.tone(freq, { at: t0, vol: vol, dur: dur, attack: 0.014, type: 'triangle', pan, rev: 0.5, del: 0.08 });
    A.tone(freq * 2.003, { at: t0, vol: vol * 0.30, dur: dur * 0.55, attack: 0.012, type: 'sine', pan, rev: 0.45 });
    A.tone(freq * 2.997, { at: t0, vol: vol * 0.11, dur: dur * 0.3, attack: 0.01, type: 'sine', pan, rev: 0.4 });
    A.tone(freq * 0.5, { at: t0, vol: vol * 0.4, dur: 0.07, attack: 0.004, type: 'triangle', pan, rev: 0.1 }); // thump
  },
  // palette variants per chord — the sunset drifts with the harmony, slowly
  _WPAL: [[255, 150, 92], [255, 128, 118], [255, 174, 74], [246, 116, 108]],
  _VPAL: [[138, 112, 255], [170, 102, 240], [112, 130, 255], [152, 92, 255]],
  init(P) {
    const hi = areaScale(P) > 2;
    const W = hi ? 240 : 120, Hh = hi ? 150 : 75;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = Hh;
    P.state = {
      W, Hh,
      L: { cur: new Float32Array(W * Hh), prev: new Float32Array(W * Hh) },
      R: { cur: new Float32Array(W * Hh), prev: new Float32Array(W * Hh) },
      oc, og: oc.getContext('2d'), img: new ImageData(W, Hh),
      vL: 0, vR: 0, splashes: [],
      // gusts: the rain's own unsteadiness — rate multiplier + wandering cell center
      gustL: 0.9, gustR: 0.9, gustLT: 0.9, gustRT: 0.9, gustTimerL: 0, gustTimerR: 0,
      ccL: 0.25, ccR: 0.75, ccLT: 0.25, ccRT: 0.75,
      lastNoteL: -9, lastNoteR: -9, lastBass: -9,
      warm: [255, 150, 92], viol: [138, 112, 255],
      warmT: [255, 150, 92], violT: [138, 112, 255],
      charge: 0, primed: false, strikeBeat: 0, strikeTimer: 0, flash: 0, glow: 0,
      petriArmed: false, petri: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, Hh } = s;
    const k = Math.min(1, dt * 6);
    s.vL += (clamp(inp.L) - s.vL) * k;
    s.vR += (clamp(inp.R) - s.vR) * k;
    // ---- gusts: retarget every few seconds, glide between — rain comes in flurries ----
    const gust = side => {
      const T_ = side === 0 ? 'gustTimerL' : 'gustTimerR';
      s[T_] -= dt;
      if (s[T_] <= 0) {
        s[T_] = 1.6 + P.rand() * 3.5;
        if (side === 0) { s.gustLT = 0.2 + P.rand() * 1.5; s.ccLT = 0.06 + P.rand() * 0.38; }
        else { s.gustRT = 0.2 + P.rand() * 1.5; s.ccRT = 0.56 + P.rand() * 0.38; }
      }
      if (side === 0) { s.gustL += (s.gustLT - s.gustL) * dt * 0.8; s.ccL += (s.ccLT - s.ccL) * dt * 0.35; }
      else { s.gustR += (s.gustRT - s.gustR) * dt * 0.8; s.ccR += (s.ccRT - s.ccR) * dt * 0.35; }
    };
    gust(0); gust(1);
    // ---- palette drift (targets set on chord changes; glide too slow to catch) ----
    for (let c = 0; c < 3; c++) {
      s.warm[c] += (s.warmT[c] - s.warm[c]) * dt * 0.15;
      s.viol[c] += (s.violT[c] - s.viol[c]) * dt * 0.15;
    }
    // ---- drops: clustered around the wandering cell, thinning notes in a downpour ----
    const tryDrop = (side, dens) => {
      const f = side === 0 ? s.L : s.R;
      const g = side === 0 ? s.gustL : s.gustR;
      if (P.rand() < dens * dens * dt * 20 * g) {
        const cc = side === 0 ? s.ccL : s.ccR;
        const lo = side === 0 ? 0.02 : 0.52, hi = side === 0 ? 0.48 : 0.98;
        const xf = P.rand() < 0.65
          ? clamp(cc + (P.rand() + P.rand() - 1) * 0.16, lo, hi)
          : lo + P.rand() * (hi - lo);
        const x = xf * W | 0;
        const y = (P.rand() * (Hh - 8) + 4) | 0;
        const amp = 1.2 + P.rand() * 2.2;
        f.cur[y * W + x] -= amp;
        if (x > 0) f.cur[y * W + x - 1] -= amp * 0.5;
        if (x < W - 1) f.cur[y * W + x + 1] -= amp * 0.5;
        s.splashes.push({ x: xf, y: y / Hh, amp, side, age: 0 });
        // the felt note: WHEN the drop lands (nature keeps time), pitch on the ladder
        const last = side === 0 ? s.lastNoteL : s.lastNoteR;
        if (t - last < 0.09) return;                       // no machine-gun flams
        if (P.rand() > 1.05 - 0.45 * dens) return;         // downpour: not every drop speaks
        if (side === 0) s.lastNoteL = t; else s.lastNoteR = t;
        const big = amp > 2.9 && t - s.lastBass > 1.2;
        if (big) s.lastBass = t;
        const deg = Math.floor(xf * 10);
        const duck = 1 - 0.55 * clamp(inp.L + inp.R - 1);  // downpours drown melodies
        P.ping(A => {
          const at = A.t() + 0.005 + P.rand() * 0.03;
          const vol = clamp(0.04 + amp * 0.032 + P.rand() * 0.02, 0.045, 0.14) * duck;
          P.def._felt(A, big ? H.chordTone(deg % 4, 0) : H.chordTone(deg, 1), {
            at, vol: big ? vol * 1.5 : vol, pan: xf * 2 - 1, dur: big ? 2.4 : 1.4
          });
        });
      }
    };
    tryDrop(0, inp.L); tryDrop(1, inp.R);
    // ---- storm meter: thunder is earned, telegraphed a bar, lands on the downbeat ----
    const both = Math.min(s.vL, s.vR);
    if (both > 0.68) s.charge = Math.min(1, s.charge + dt / 10);
    else s.charge = Math.max(s.primed ? 1 : 0, s.charge - dt / 6);
    if (s.charge >= 1 && !s.primed) {
      s.primed = true;
      s.strikeBeat = T.running ? (Math.floor(T.beats() / 4) + 1) * 4 : 0;
      s.strikeTimer = 0;
    }
    if (s.primed) {
      s.strikeTimer += dt;
      const due = T.running ? T.beats() >= s.strikeBeat : s.strikeTimer > 1.6;
      s.glow = T.running ? clamp(1 - (s.strikeBeat - T.beats()) / 4) : clamp(s.strikeTimer / 1.6);
      if (due) {
        s.primed = false; s.charge = 0.15; s.glow = 0; s.flash = 1; s.petriArmed = true;
        P.ping(A => {
          const at = A.t() + 0.02;
          A.hit({ vol: 0.5, dur: 2.0, freq: 90, q: 0.6, type: 'lowpass', at });
          A.hit({ vol: 0.22, dur: 3.5, freq: 210, q: 0.4, type: 'lowpass', at: at + 0.35 });
          A.tone(H.rootFreq(-2), { at, vol: 0.16, dur: 3.2, attack: 0.35, type: 'sine', rev: 0.6 });
        });
        for (let i = 0; i < 8; i++) { // the strike shakes the water
          const f = i % 2 ? s.L : s.R;
          const x = 2 + (P.rand() * (W - 4)) | 0, y = 2 + (P.rand() * (Hh - 4)) | 0;
          f.cur[y * W + x] -= 1.5 + P.rand() * 1.5;
        }
      }
    }
    s.flash = Math.max(0, s.flash - dt * 1.4);
    // ---- petrichor: stillness after the strike earns a golden answer ----
    if (s.petriArmed && s.vL < 0.18 && s.vR < 0.18) {
      s.petriArmed = false; s.petri = 1;
      P.ping(A => {
        const t0 = T.running ? T.next(0.5) : A.t() + 0.1;
        [5, 7, 6, 9, 8].forEach((ci, i) => {
          P.def._felt(A, H.chordTone(ci, 1), {
            at: t0 + i * (T.beat || 0.9) * 0.5, vol: 0.055 - i * 0.006, pan: (i - 2) * 0.35, dur: 2.2
          });
        });
      });
    }
    s.petri = Math.max(0, s.petri - dt * 0.25);
    // ---- splashes age ----
    for (const sp of s.splashes) sp.age += dt * 1.3;
    if (s.splashes.length) s.splashes = s.splashes.filter(sp => sp.age < 1);
    // ---- wave step, both fields — slower rings you can actually watch.
    // 9-point isotropic laplacian: at low wave speed the 4-neighbor stencil
    // propagates visibly square; the diagonals keep the rings round.
    const damp = W > 200 ? 0.988 : 0.979;
    for (const f of [s.L, s.R]) {
      const cur = f.cur, next = f.prev; // reuse buffer
      for (let y = 1; y < Hh - 1; y++) {
        const y0 = y * W;
        for (let x = 1; x < W - 1; x++) {
          const i = y0 + x;
          const c = cur[i];
          const lap = (cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * 0.5
                    + (cur[i - W - 1] + cur[i - W + 1] + cur[i + W - 1] + cur[i + W + 1]) * 0.25
                    - 3 * c;
          next[i] = (c * 2 - next[i] + 0.3 * lap) * damp;
        }
      }
      f.prev = cur; f.cur = next;
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, Hh, img } = s, d = img.data;
    const cL = s.L.cur, cR = s.R.cur;
    const WM = s.warm, VI = s.viol;
    const flashTop = s.flash * s.flash;
    for (let y = 0; y < Hh; y++) {
      const ty = 1 - y / Hh;                       // 1 at top
      const dusk = ty * ty;                        // sunset reflection lives up top
      let bR = 10 + 20 * dusk, bG = 7 + 9 * dusk, bB = 24 + 7 * dusk;
      if (flashTop > 0 && ty > 0.6) {              // lightning washes the upper water
        const fw = flashTop * (ty - 0.6) * 2.5;
        bR += 90 * fw; bG += 85 * fw; bB += 115 * fw;
      }
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l0 = x > 0 ? cL[i - 1] : 0, r0 = x < W - 1 ? cL[i + 1] : 0;
        const u0 = y > 0 ? cL[i - W] : 0, dn0 = y < Hh - 1 ? cL[i + W] : 0;
        const l1 = x > 0 ? cR[i - 1] : 0, r1 = x < W - 1 ? cR[i + 1] : 0;
        const u1 = y > 0 ? cR[i - W] : 0, dn1 = y < Hh - 1 ? cR[i + W] : 0;
        const eL = Math.max(0, clamp((l0 - r0) * 0.9 + (u0 - dn0) * 0.6, -0.06, 1) * 1.3);
        const eR = Math.max(0, clamp((l1 - r1) * 0.9 + (u1 - dn1) * 0.6, -0.06, 1) * 1.3);
        const gold = (eL + eR) * s.petri;          // petrichor: crests go briefly golden
        d[i * 4]     = Math.min(255, bR + eL * WM[0] + eR * VI[0] + gold * 200);
        d[i * 4 + 1] = Math.min(255, bG + eL * WM[1] + eR * VI[1] + gold * 150);
        d[i * 4 + 2] = Math.min(255, bB + eL * WM[2] + eR * VI[2] + gold * 40);
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(s.oc, 0, 0, w, h);
    // ---- impact splashes: the drop itself is the bright moment ----
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const sp of s.splashes) {
      const fade = (1 - sp.age) * (1 - sp.age);
      const r = (0.010 + sp.amp * 0.009) * w * (0.3 + sp.age * 1.1);
      const c = sp.side === 0 ? WM : VI;
      const gr = g.createRadialGradient(sp.x * w, sp.y * h, 0, sp.x * w, sp.y * h, r);
      gr.addColorStop(0, `rgba(255,244,230,${fade * 0.85})`);   // hot core
      gr.addColorStop(0.3, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${fade * 0.55})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(sp.x * w - r, sp.y * h - r, r * 2, r * 2);
    }
    g.restore();
    // ---- storm-light: the sky each hand owns, answering instantly ----
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [side, v] of [[0, s.vL], [1, s.vR]]) {
      const c = side === 0 ? WM : VI;
      const a = 0.05 + v * 0.13 + s.charge * 0.06 + s.glow * 0.3 + s.flash * 0.35;
      const cx = w * (side === 0 ? 0.24 : 0.76), rr = w * 0.42;
      const gr = g.createRadialGradient(cx, -h * 0.12, 0, cx, -h * 0.12, rr);
      gr.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a, 0, 0.7)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(cx - rr, 0, rr * 2, h * 0.35);
    }
    g.restore();
    if (P.focused) {
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.font = '10px monospace';
      g.fillText('L ' + s.vL.toFixed(2) + '  R ' + s.vR.toFixed(2) + '  STORM ' + (s.charge * 100 | 0) + '%' +
        (s.primed ? ' ⚡' : '') + '  ' + (H.label || ''), 8, h - 8);
    }
  },
  audio(A, P) {
    const self = this, s = P.state;
    const v = A.voice();
    // ---- whisper pedal: the tooth. Root + color tones, hand-coupled level ----
    const filt = A.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 500; filt.Q.value = 0.4;
    filt.connect(v.group);
    const DR = [
      { i: 0, o: -1, g: 0.010 },  // D2 — the reference pitch
      { i: 0, o: 0,  g: 0.005 },  // D3
      { i: 2, o: 0,  g: 0.006 },  // chord color
      { i: 4, o: 0,  g: 0.006 }   // chord color — moves the most
    ];
    const drones = DR.map(d => {
      const o = v.osc('triangle', H.chordTone(d.i, d.o));
      const g = v.g(0.0001);
      o.connect(g); g.connect(filt);
      return { o, g, d };
    });
    // ---- the rain bed: rumble + granulated patter + downpour sparkle, per side ----
    const layer = (type, freq, q, pan) => {
      const n = v.noise();
      const f = v.filter(type, freq, q);
      const gg = v.g(0);
      n.connect(f); f.connect(gg);
      if (A.ctx.createStereoPanner && pan !== 0) {
        const p = A.ctx.createStereoPanner(); p.pan.value = pan;
        gg.connect(p); p.connect(v.group);
      } else gg.connect(v.group);
      return gg;
    };
    const rumble = layer('lowpass', 240, 0.5, 0);
    const patL = layer('bandpass', 2600, 0.8, -0.7), patR = layer('bandpass', 2600, 0.8, 0.7);
    const spkL = layer('highpass', 6000, 0.7, -0.5), spkR = layer('highpass', 6000, 0.7, 0.5);
    let jT = 0, jL = 1, jR = 1;
    // ---- chord changes: re-glide the pedal, roll a felt voicing, drift the palette ----
    H.onChord(() => {
      for (const dr of drones) A.set(dr.o.frequency, H.chordTone(dr.d.i, dr.d.o), 0.18);
      const ci = H.step % self._WPAL.length;
      s.warmT = self._WPAL[ci].slice();
      s.violT = self._VPAL[ci].slice();
      const inten = (s.vL + s.vR) / 2;
      if (inten < 0.05) return;
      [0, 1, 2, 3, 4].forEach((cj, i) => {
        self._felt(A, H.chordTone(cj, 0), {
          at: A.t() + i * 0.075, vol: 0.028 + inten * 0.055, pan: (i - 2) * 0.28, dur: 2.6
        });
      });
    });
    v.fadeIn(1, 1.2);
    // the groove is EARNED: fades in past medium rain, gone in the small state
    let nextT = 0, lastIdx = -1;
    return {
      tick(inp) {
        const wet = (s.vL + s.vR) / 2;
        const open = 0.3 + 0.7 * wet;
        for (const dr of drones) A.set(dr.g.gain, dr.d.g * open, 0.3);
        A.set(filt.frequency, 400 + wet * 500, 0.3);
        A.set(rumble.gain, wet * wet * 0.06 + s.flash * 0.05, 0.3);
        // granulated patter: gain jitters every ~80ms so it reads as droplets, not hiss
        jT -= 1 / 60;
        if (jT <= 0) { jT = 0.05 + Math.random() * 0.07; jL = 0.55 + Math.random() * 0.9; jR = 0.55 + Math.random() * 0.9; }
        A.set(patL.gain, s.vL * s.vL * 0.05 * jL, 0.06);
        A.set(patR.gain, s.vR * s.vR * 0.05 * jR, 0.06);
        A.set(spkL.gain, Math.max(0, s.vL - 0.55) * 0.06, 0.25);
        A.set(spkR.gain, Math.max(0, s.vR - 0.55) * 0.06, 0.25);
        // ---- the earned groove: heartbeat kick, chord-root bass, swung ticks ----
        if (!T.running || !A.ctx) return;
        const gate = clamp((wet - 0.38) / 0.35);
        const stepDur = T.beat * 0.25;
        if (!nextT || nextT < A.t() - 0.05) nextT = T.next(0.25);
        const horizon = A.t() + 0.15;
        while (nextT < horizon) {
          const idx = Math.round((nextT - T.t0) / stepDur);
          if (idx > lastIdx) {
            lastIdx = idx;
            const st = ((idx % 16) + 16) % 16;
            if (gate > 0.03) {
              const at = nextT + (st % 4 === 2 ? T.beat * 0.06 : 0);  // swung offbeats
              if (st === 0) {
                A.kick(at, 0.06 + 0.13 * gate);
                A.bassNote(H.chordTone(0, -1), { at, vol: 0.05 + 0.09 * gate, dur: 1.6 });
              }
              if (st === 8) A.kick(at, (0.06 + 0.13 * gate) * 0.55);
              if (st === 4 || st === 12) A.hat(at, { vol: 0.016 + 0.026 * gate });
              if (gate > 0.6 && (st === 6 || st === 14)) A.hat(at, { vol: 0.014 });
              if (gate > 0.75 && st === 10) A.hat(at, { vol: 0.02, open: true });
            }
          }
          nextT += stepDur;
        }
      },
      stop() { v.kill(); }
    };
  }
});
