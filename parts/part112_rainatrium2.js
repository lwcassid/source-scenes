/* ---------- SRC-16.2 · RAIN ATRIUM V2 ---------- */
reg({
  id: 'SRC-16.2', family: 'SRC-16', ver: 2, title: 'Rain Atrium V2', tech: 'TWO-FIELD WATER / SUNSET STORM',
  music: {
    bpm: 64, root: 50, mode: 'aeolian', chordBars: 2,
    // D pedal the whole storm — the root never moves, the color shifts over it.
    chords: [
      [0, 7, 15, 22, 26],    // D · A · F · C · E
      [0, 8, 15, 19, 22],    // D · Bb · F · A · C
      [0, 10, 15, 17, 26],   // D · C · F · G · E
      [0, 5, 8, 15, 19]      // D · G · Bb · F · A
    ],
    chordNames: ['Dm9', 'B♭maj9/D', 'Dm11', 'Gm9/D']
  },
  fx: { bloom: 0.55, edge: true },
  tags: ['WAVE INTERFERENCE', 'FELT PIANO', 'SUNSET STORM', 'D PEDAL', 'EARNED THUNDER'],
  desc: 'The pool at dusk. Rain from the left writes rings of ember light, rain from the right writes rings of violet, and where the two ring systems cross in the middle the water burns rose — the interference is no longer a secret, it is the color. Every drop is a felt piano note on the current chord, so light rain is sparse chord tones and a downpour literally arpeggiates the harmony. Hold both hands wide long enough and the sky charges, warns you for one bar, and breaks: thunder, a flash across the water, and — if you then go still — a few golden drops of petrichor.',
  interact: 'L = rain density over the left (ember) half, R = right (violet). Density, not position: the verb is how hard it rains, and the storm-light at the top of the frame answers each hand instantly. Medium rain from both sides makes color-moiré where the rings collide. Sustained downpour from BOTH hands charges the storm meter — the sky glow warns a bar ahead, thunder lands on the downbeat. Drop to stillness after a strike for the petrichor answer.',
  sound: 'Felt piano over a D pedal. Each drop is a soft-attack felt note on the chord ladder — x picks the rung (low left, high right), drop size picks register and velocity, downbeat drips accent — so the 2-bar chord cycle (Dm9 · B♭maj9/D · Dm11 · Gm9/D, pinned key) is heard through the rain itself. On every chord change a rolled felt voicing blooms low-to-high, loud in a storm, whisper in a drizzle. Under it: a hand-coupled whisper pedal (triangle root + color tones, quiet enough to talk over) and a three-layer rain bed per side — low rumble, granulated droplet patter, high sparkle only in a downpour — replacing the old flat hiss. Downpours still duck the melody 3dB under the weather, and that is still correct. Thunder is EARNED: ~10s of two-hand downpour, telegraphed one bar, sub roll on the downbeat. The mids stay empty for a sitting-in musician; the key never moves.',
  _WARM: [255, 150, 92], _VIOL: [138, 112, 255],
  // felt piano: mostly fundamental, muted stretched partials, soft attack, felt thump
  _felt(A, freq, { at = 0, vol = 0.1, pan = 0, dur = 1.4 } = {}) {
    if (!isFinite(freq) || freq <= 20) return;
    const t0 = Math.max(A.t(), at || 0);
    A.tone(freq, { at: t0, vol: vol, dur: dur, attack: 0.014, type: 'triangle', pan, rev: 0.5, del: 0.08 });
    A.tone(freq * 2.003, { at: t0, vol: vol * 0.30, dur: dur * 0.55, attack: 0.012, type: 'sine', pan, rev: 0.45 });
    A.tone(freq * 2.997, { at: t0, vol: vol * 0.11, dur: dur * 0.3, attack: 0.01, type: 'sine', pan, rev: 0.4 });
    A.tone(freq * 0.5, { at: t0, vol: vol * 0.4, dur: 0.07, attack: 0.004, type: 'triangle', pan, rev: 0.1 }); // thump
  },
  init(P) {
    const hi = areaScale(P) > 2;
    const W = hi ? 240 : 120, Hh = hi ? 150 : 75;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = Hh;
    P.state = {
      W, Hh,
      L: { cur: new Float32Array(W * Hh), prev: new Float32Array(W * Hh) },
      R: { cur: new Float32Array(W * Hh), prev: new Float32Array(W * Hh) },
      oc, og: oc.getContext('2d'), img: new ImageData(W, Hh),
      vL: 0, vR: 0, splashes: [], drift: 0,
      charge: 0, primed: false, strikeBeat: 0, strikeTimer: 0, flash: 0, glow: 0,
      petriArmed: false, petri: 0,
      lastSlotL: 0, lastSlotR: 0, lastBass: -9
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, Hh } = s;
    const k = Math.min(1, dt * 6);
    s.vL += (clamp(inp.L) - s.vL) * k;
    s.vR += (clamp(inp.R) - s.vR) * k;
    // ---- drops ----
    const tryDrop = (side, dens) => {
      const f = side === 0 ? s.L : s.R;
      if (P.rand() < dens * dens * dt * 15) {
        const x = (side === 0 ? P.rand() * 0.48 : 0.52 + P.rand() * 0.46) * W | 0;
        const y = (P.rand() * (Hh - 8) + 4) | 0;
        const amp = 1.2 + P.rand() * 2.2;
        f.cur[y * W + x] -= amp;
        if (x > 0) f.cur[y * W + x - 1] -= amp * 0.5;
        if (x < W - 1) f.cur[y * W + x + 1] -= amp * 0.5;
        s.splashes.push({ x: x / W, y: y / Hh, amp, side, age: 0 });
        // the felt note: chord rung from x (low left → high right), size → register + velocity
        const big = amp > 2.9 && t - s.lastBass > 1.2;
        if (big) s.lastBass = t;
        const deg = Math.floor((x / W) * 10);
        const duck = 1 - 0.55 * clamp(inp.L + inp.R - 1); // downpours drown melodies
        P.ping(A => {
          const at = A.q();
          const slot = Math.round(at * 1000);
          if (side === 0 ? slot === s.lastSlotL : slot === s.lastSlotR) return; // one note per 16th per side
          if (side === 0) s.lastSlotL = slot; else s.lastSlotR = slot;
          const accent = Math.abs(at - T.next(1)) < 0.002 ? 1.25 : 1;
          const vol = clamp(0.045 + amp * 0.03, 0.05, 0.13) * duck * accent;
          P.def._felt(A, big ? H.chordTone(deg % 4, 0) : H.chordTone(deg, 1), {
            at, vol: big ? vol * 1.5 : vol, pan: (x / W) * 2 - 1, dur: big ? 2.4 : 1.4
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
    // ---- wave step, both fields ----
    const damp = W > 200 ? 0.985 : 0.976;
    for (const f of [s.L, s.R]) {
      const cur = f.cur, next = f.prev; // reuse buffer
      for (let y = 1; y < Hh - 1; y++) {
        const y0 = y * W;
        for (let x = 1; x < W - 1; x++) {
          const i = y0 + x;
          next[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) / 2 - next[i]) * damp;
        }
      }
      f.prev = cur; f.cur = next;
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, Hh, img } = s, d = img.data;
    const cL = s.L.cur, cR = s.R.cur;
    const WM = this._WARM, VI = this._VIOL;
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
    // ---- impact splashes: each note visibly lands somewhere ----
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const sp of s.splashes) {
      const a = (1 - sp.age) * (1 - sp.age) * 0.4;
      const r = (0.012 + sp.amp * 0.01) * w * (0.4 + sp.age * 0.9);
      const c = sp.side === 0 ? this._WARM : this._VIOL;
      const gr = g.createRadialGradient(sp.x * w, sp.y * h, 0, sp.x * w, sp.y * h, r);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(sp.x * w - r, sp.y * h - r, r * 2, r * 2);
    }
    g.restore();
    // ---- storm-light: the sky each hand owns, answering instantly (no clouds).
    // radial pools so the two skies blend at center instead of meeting in a seam
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [side, v] of [[0, s.vL], [1, s.vR]]) {
      const c = side === 0 ? this._WARM : this._VIOL;
      const a = 0.05 + v * 0.13 + s.charge * 0.06 + s.glow * 0.3 + s.flash * 0.35;
      const cx = w * (side === 0 ? 0.24 : 0.76), rr = w * 0.42;
      const gr = g.createRadialGradient(cx, -h * 0.12, 0, cx, -h * 0.12, rr);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${clamp(a, 0, 0.7)})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(cx - rr, 0, rr * 2, h * 0.35);
    }
    g.restore();
    // ---- rain streaks over each half ----
    const lw = Math.max(1.5, w / 700), len = h * 0.045;
    for (const [side, v] of [[0, s.vL], [1, s.vR]]) {
      if (v < 0.03) continue;
      const c = side === 0 ? this._WARM : this._VIOL;
      g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.18 + v * 0.32})`;
      g.lineWidth = lw;
      const n = Math.round(v * w / 55);
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const rx = (side * 0.5 + 0.02 + ((i * 0.618 + side * 0.37) % 1) * 0.46) * w;
        const ry = (t * h * 0.55 + i * 173.3) % (h + len) - len;
        g.moveTo(rx, ry); g.lineTo(rx - len * 0.15, ry + len);
      }
      g.stroke();
    }
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
    // ---- chord changes bloom as rolled felt voicings, sized to the weather ----
    H.onChord(() => {
      for (const dr of drones) A.set(dr.o.frequency, H.chordTone(dr.d.i, dr.d.o), 0.18);
      const inten = (s.vL + s.vR) / 2;
      if (inten < 0.05) return;
      [0, 1, 2, 3, 4].forEach((ci, i) => {
        self._felt(A, H.chordTone(ci, 0), {
          at: A.t() + i * 0.075, vol: 0.028 + inten * 0.055, pan: (i - 2) * 0.28, dur: 2.6
        });
      });
    });
    v.fadeIn(1, 1.2);
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
      },
      stop() { v.kill(); }
    };
  }
});
