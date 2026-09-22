/* ---------- SRC-55.2 · ASCENSION (the name ascended, and there it remains) ----------
   TEMPLE SET V2 · the finale. An updraft of thousands of sparks rising the
   full height of the frame, ember at the floor, gold, then white as they
   climb — and at the top a slow golden band where they settle and REMAIN.
   The LEFT hand is the updraft; the RIGHT hand is the swell, and at full
   swell the whole frame goes up and the kit comes in under it. Under it all
   a perpetual-ascent drone whose rate is the left hand. */
(() => {
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.3, `rgba(${rgb},0.55)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return (SPR[key] = c);
  }
  const HEAT = ['210,70,30', '255,140,50', '255,205,120', '255,240,210', '235,240,255'];

  reg({
    id: 'SRC-55.2', family: 'SRC-55', ver: 2, title: 'Ascension', tech: 'UPDRAFT FIELD / PERPETUAL-RISE DRONE',
    music: {
      bpm: 66, root: 41, mode: 'aeolian', chordBars: 2,
      chords: [
        [0, 7, 15, 19, 26],    // Fm9
        [0, 8, 15, 19, 22],    // D♭maj7/F
        [0, 7, 14, 17, 22],    // Fm11
        [0, 10, 15, 19, 26]    // Fm7(9)
      ],
      chordNames: ['Fm9', 'D♭maj7/F', 'Fm11', 'Fm7(9)']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'L IS THE UPDRAFT', 'R IS THE SWELL', 'THE FINALE'],
    desc: 'Sparks. Thousands of them, rising through the whole height of the frame in a slow updraft, ember-red where they are born at the floor, gold as they climb, white as they near the top — and at the top a band of gold where they arrive and slow and stay, drifting sideways, a dome of everything that has ascended. The left hand is the updraft: still air, a rising, a storm of ascent with every spark streaking. The right hand is the swell: the light, the size, the band at the top blazing, and at full reach the beat under it. Under everything a tone that climbs and never arrives — the left hand sets how fast it climbs.',
    interact: 'L = THE UPDRAFT. Drawn back the sparks hang and drift, barely rising; lean in and the whole field lifts, faster and faster, sparks stretching into streaks, turbulence tearing through them. In the sound this is the rate of the perpetual rise — a drone forever climbing, slow to fast. R = THE SWELL. Lean in and everything brightens and thickens, more sparks, bigger; the golden band at the top blazes as they arrive, and every beat that gathers new arrivals rings a bell up there. Past 70% swell for a bar, the kit comes in — kick on the beat, hats on the eighths — and latches for four bars. Both hands home: embers, and a tone climbing so slowly you have to wait to hear it.',
    sound: 'An F minor pedal — four triangle pad voices browser-side, sub root — under a PERPETUAL-ASCENT drone: five sine-triangle voices spaced an octave apart, sweeping up through five octaves and wrapping under, each faded in and out by its place in the sweep so the ear hears a rise with no top. Its rate is L (a full octave every ~90 s drawn back, every ~9 s at full reach); it sits on the key root, browser-side only (the mirror would re-strike a gliding voice every semitone, so the rack gets a rolled pad chord per chord change instead). R is the swell: pad level and filter, sub weight, and the top band\'s bells (MIDI role: bells) — at most one per beat, velocity from how many sparks arrived that beat. The kit is earned past R 0.7 for a bar (perc 36/42), latched four bars. CC74: pad = swell, texture = updraft.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h;
      const n = Math.min(6500, Math.round(1900 * as));
      const x = new Float32Array(n), y = new Float32Array(n), vy = new Float32Array(n), vx = new Float32Array(n), sz = new Float32Array(n), ph = new Float32Array(n), st = new Uint8Array(n), age = new Float32Array(n);
      for (let i = 0; i < n; i++) { x[i] = P.rand() * w; y[i] = P.rand() * h; sz[i] = 0.5 + Math.pow(P.rand(), 2) * 1.6; ph[i] = P.rand() * TAU; }
      P.state = { n, x, y, vx, vy, sz, ph, st, age, pres: 0, lift: 0, swell: 0, drift: 0, arrived: 0, arrBeat: 0, lastBeat: -1, kit: 0, kitBars: 0, lastBar: -1, chargeBars: 0, events: [], bandY: h * 0.13, bandGlow: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state, w = P.w, h = P.h;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleL = 0.12 + Math.sin(s.drift * 0.07) * 0.08, idleS = 0.2 + Math.sin(s.drift * 0.05) * 0.1;
      s.lift += ((clamp(inp.L) * s.pres + idleL * (1 - s.pres)) - s.lift) * Math.min(1, dt * 5);
      s.swell += ((clamp(inp.R) * s.pres + idleS * (1 - s.pres)) - s.swell) * Math.min(1, dt * 6);
      const L = s.lift, Sw = s.swell;
      const up = 14 + L * L * 520;
      const turb = 20 + L * 160;
      const k = 0.004 / Math.sqrt(areaScale(P));
      const { n, x, y, vx, vy, st, age, ph } = s;
      let arrived = 0;
      for (let i = 0; i < n; i++) {
        if (st[i] === 1) {
          // REMAINING: in the band, drifting sideways, slowly fading out to be reborn below
          age[i] += dt;
          x[i] += Math.sin(s.drift * 0.3 + ph[i]) * 30 * dt + 12 * dt;
          y[i] += (s.bandY + Math.sin(s.drift * 0.7 + ph[i] * 3) * h * 0.05 - y[i]) * Math.min(1, dt * 2);
          if (x[i] > w + 4) x[i] -= w + 8;
          if (age[i] > 2.5 + (ph[i] / TAU) * 4) { st[i] = 0; y[i] = h + 6; x[i] = P.rand() * w; vy[i] = 0; age[i] = 0; }
          continue;
        }
        const fx = Math.sin(y[i] * k * 1.3 + s.drift * 0.9 + ph[i]) * turb + Math.cos(x[i] * k * 0.8 - s.drift * 0.6) * turb * 0.6;
        const fy = -up * (0.6 + s.sz[i] * 0.4) + Math.cos(x[i] * k * 1.7 + s.drift * 0.5) * turb * 0.4;
        vx[i] += (fx - vx[i]) * Math.min(1, dt * 2.5); vy[i] += (fy - vy[i]) * Math.min(1, dt * 2.5);
        x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        if (x[i] < -4) x[i] += w + 8; else if (x[i] > w + 4) x[i] -= w + 8;
        if (y[i] < s.bandY + h * 0.03) { st[i] = 1; age[i] = 0; arrived++; }
      }
      s.arrived += arrived; s.arrBeat += arrived;
      s.bandGlow += (clamp(arrived / dt / 400) - s.bandGlow) * Math.min(1, dt * 3);
      // one statement per beat from the band, at most
      const bt = (typeof T !== 'undefined' && T.running) ? Math.floor(T.beats()) : -1;
      if (bt !== s.lastBeat && bt >= 0) {
        s.lastBeat = bt;
        if (s.arrBeat > 0 && s.pres > 0.3) s.events.push({ kind: 'arrive', k: clamp(s.arrBeat / 60), swell: Sw });
        s.arrBeat = 0;
      }
      const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : -1;
      if (bar !== s.lastBar && bar >= 0) {
        s.lastBar = bar;
        const hot = Sw > 0.7 && s.pres > 0.5;
        s.chargeBars = hot ? s.chargeBars + 1 : 0;
        if (!s.kit && s.chargeBars >= 1) { s.kit = 1; s.kitBars = 4; }
        else if (s.kit) { if (hot) s.kitBars = 4; else if (--s.kitBars <= 0) { s.kit = 0; s.chargeBars = 0; } }
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const L = s.lift, Sw = s.swell;
      const { n, x, y, vx, vy, sz, st } = s;
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      const spr = HEAT.map((c, i) => sprite('h' + i, c));
      const cut = 1 - (0.3 + Sw * 0.7);
      for (let i = 0; i < n; i++) {
        if (sz[i] / 2.1 < cut * 0.6) continue;
        const u = clamp(1 - y[i] / h);                                  // 0 floor .. 1 top
        const hi = st[i] === 1 ? 3 : Math.min(4, Math.floor(u * 4.99));
        const r = (1.2 + sz[i] * 1.8) * ms * (0.7 + Sw * 0.6);
        const a = (0.14 + u * 0.3 + Sw * 0.3) * bright * (st[i] === 1 ? 0.18 : 1);
        const spd = Math.abs(vy[i]);
        if (spd > 90 && st[i] === 0) {
          const kk = Math.min(0.12, 30 / spd);
          g.strokeStyle = `rgba(${HEAT[hi]},${a})`; g.lineWidth = r;
          g.beginPath(); g.moveTo(x[i], y[i]); g.lineTo(x[i] - vx[i] * kk, y[i] - vy[i] * kk); g.stroke();
        } else {
          g.globalAlpha = a;
          g.drawImage(spr[hi], x[i] - r, y[i] - r, r * 2, r * 2);
          g.globalAlpha = 1;
        }
      }
      // the band: the dome of what remains — one wide soft gold fill across the top
      const bg = g.createLinearGradient(0, 0, 0, s.bandY * 1.8);
      const ba = (0.03 + Sw * 0.1 + s.bandGlow * 0.14) * bright;
      bg.addColorStop(0, `rgba(255,215,140,${ba * 0.5})`); bg.addColorStop(0.5, `rgba(255,225,170,${ba})`); bg.addColorStop(1, 'rgba(255,225,170,0)');
      g.fillStyle = bg; g.fillRect(0, 0, w, s.bandY * 1.8);
      // the kit shows: the floor pulses on the kick
      if (s.kit) {
        const pl = T.beatPulse();
        const fg = g.createLinearGradient(0, h, 0, h * 0.6);
        fg.addColorStop(0, `rgba(255,120,50,${pl * 0.25 * bright})`); fg.addColorStop(1, 'rgba(255,120,50,0)');
        g.fillStyle = fg; g.fillRect(0, h * 0.6, w, h * 0.4);
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(235,225,215,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('UPDRAFT ' + Math.round(L * 100) + '   SWELL ' + Math.round(Sw * 100) + '   ASCENDED ' + s.arrived + (s.kit ? '   · KIT ' + s.kitBars : '') + (s.pres < 0.3 ? '   · EMBERS' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 4, { type: 'triangle', gain: 0.004, cutoff: 240, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.025); sub.connect(sg); sg.connect(v.group);
      // the perpetual rise: N voices an octave apart, sweeping up and wrapping under
      const sh = A.voice(); sh._noHold = true;                       // browser colour only — never a gliding note stream to the rack
      const NV = 5, OCT = 5, shv = [];
      const shf = sh.filter('lowpass', 900, 0.5); const shg = sh.g(1); shf.connect(shg); shg.connect(sh.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; shg.connect(sd); sd.connect(A.revIn); }
      for (let i = 0; i < NV; i++) { const o = sh.osc(i % 2 ? 'sine' : 'triangle', 110), gg = sh.g(0.0001); o.connect(gg); gg.connect(shf); shv.push({ o, g: gg, p: i / NV }); }
      let phase = 0;
      const strike = () => { const now = A.t(); for (let i = 0; i < 3; i++) A.tone(H.chordTone(i, -1), { at: now + 0.08 * i, vol: 0.0001, dur: 3.5, attack: 0.5, type: 'sine', rev: 0, role: 'pad' }); };
      H.onChord(() => { place(0.2); A.set(sub.frequency, H.chordTone(0, -2), 0.1); strike(); });
      A.set(sub.frequency, H.chordTone(0, -2), 0.05);
      v.fadeIn(1, 1.5); sh.fadeIn(1, 2);
      let nextT = T.next(0.5);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7, L = s.lift, Sw = s.swell;
          // the rise: rate from the updraft; each voice's gain is a raised-cosine window on its place in the sweep
          const rate = (1 / 90 + L * L * (1 / 9 - 1 / 90)) / OCT;    // cycles of the whole sweep per second
          phase = (phase + rate * dt) % 1;
          const fmin = H.rootFreq(-2);
          shv.forEach((vc, i) => {
            const p = (phase + i / NV) % 1;
            const f = fmin * Math.pow(2, p * OCT);
            const win = 0.5 - 0.5 * Math.cos(p * TAU);
            try { vc.o.frequency.setTargetAtTime(f, now, 0.05); } catch (e) {}
            A.set(vc.g.gain, (0.003 + Sw * 0.006) * win * win * gate, 0.08);
          });
          A.set(shf.frequency, 500 + Sw * 1800, 0.3);
          pad.forEach(p => { p.level((0.003 + Sw * 0.008) * gate, 0.3); p.bright(240 + Sw * 1600, 0.25); });
          A.set(sg.gain, (0.02 + Sw * 0.025) * gate, 0.2);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'arrive') A.bell(H.chordTone(2 + Math.floor(e.k * 3), 2), { vol: (0.008 + e.k * 0.03 + e.swell * 0.01) * gate, dur: 3, rev: 0.85, pan: (P.rand() - 0.5) });
          }
          if (s.kit) {
            const horizon = now + 0.15;
            while (nextT < horizon) {
              const st = Math.round((nextT - T.t0) / (T.beat * 0.5)) % 8;
              if (st % 2 === 0) A.kick(nextT, 0.2 + Sw * 0.14 * (st === 0 ? 1.3 : 1));
              else A.hat(nextT, { vol: 0.01 + Sw * 0.015, open: st === 7 });
              nextT += T.beat * 0.5;
            }
          }
          if (nextT < now) nextT = T.next(0.5);
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', Sw); MOut.expr('texture', L); }
        },
        stop() { v.kill(); sh.kill(); }
      };
    }
  });
})();
