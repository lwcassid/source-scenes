/* ---------- SRC-55.3 · ASCENSION V3 (the harmony climbs) ----------
   V2's updraft with a real musical idea under it: the HARMONY ASCENDS. A
   seven-chord cycle over F minor whose bass walks up F · A♭ · B♭ · C · D♭
   · E♭ · F while the top voice steps up with it, so the music climbs
   forever without a gimmick; the perpetual-rise drone is kept only as a
   texture at high updraft. The band at the top is now a DOME — a gentle
   arc — and now and then one bright name rises alone and rings on arrival. */
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
  // the dome: the band's height at a given x — an arc, high in the middle
  const domeY = (P, xx) => { const u = (xx / P.w - 0.5) * 2; return P.state.bandY + u * u * P.h * 0.09; };

  reg({
    id: 'SRC-55.3', family: 'SRC-55', ver: 3, title: 'Ascension', tech: 'UPDRAFT FIELD / THE HARMONY CLIMBS',
    music: {
      bpm: 66, root: 41, mode: 'aeolian', chordBars: 2,
      // semitones from F; the LOWEST tone is the bass and it climbs F A♭ B♭ C D♭ E♭ F(oct)
      chords: [
        [0, 7, 15, 19, 26],    // Fm9        bass F
        [3, 10, 15, 19, 27],   // A♭maj7     bass A♭
        [5, 12, 15, 20, 27],   // B♭m7       bass B♭
        [7, 12, 17, 20, 29],   // Fm/C       bass C
        [8, 15, 19, 22, 29],   // D♭maj9     bass D♭
        [10, 17, 22, 26, 31],  // E♭6/9      bass E♭
        [12, 19, 24, 27, 31]   // Fm (8va)   bass F
      ],
      chordNames: ['Fm9', 'A♭maj7', 'B♭m7', 'Fm/C', 'D♭maj9', 'E♭6/9', 'Fm(8va)']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'L IS THE UPDRAFT', 'R IS THE SWELL', 'THE HARMONY CLIMBS'],
    desc: 'Sparks, thousands, rising through the whole frame in a slow updraft — ember where they are born at the floor, gold as they climb, white near the top — and at the top a DOME of gold, a gentle arc where they arrive and slow and stay. The left hand is the updraft: still air, a rising, a storm of ascent. The right hand is the swell: the light, the size, the dome blazing, and at full reach the beat under it. And the music climbs with them: every two bars the bass steps up — F, A♭, B♭, C, D♭, E♭, F — the chord rising over the same pedal, arriving back at F an octave up and starting again, so it never stops ascending. Now and then one name rises alone, brighter than the rest, and rings when it arrives.',
    interact: 'L = THE UPDRAFT. Drawn back the sparks hang and drift; lean in and the whole field lifts, faster and faster, streaking and torn by turbulence. Past halfway a second, perpetual-rise texture fades in under the chords — a tone that climbs without arriving — and its rate is your hand. R = THE SWELL. Lean in and everything brightens and thickens, the dome blazes as sparks arrive, and each beat that gathers new arrivals rings a bell up there. Past 70% swell for a bar, the kit comes in — kick on the beat, hats on the eighths — and latches four bars. Both hands home: embers, and the slow climb of the chords, which never needs you.',
    sound: 'F minor with an ASCENDING BASS: seven chords, two bars each, the lowest voice walking F–A♭–B♭–C–D♭–E♭–F while the upper voices step up with it (A♭maj7, B♭m7, Fm/C, D♭maj9, E♭6/9 back to Fm an octave up). Four pad voices browser-side voice-led to each chord (rolled entrance), the bass on its own channel struck once per chord (MIDI role: bass) — that walk is the tune. Above 50% updraft a three-voice perpetual-rise texture fades in (browser-only; a gliding voice would re-strike the rack every semitone). R: pad level and filter, sub weight, the dome\'s bells — at most one per beat, velocity from arrivals — and the lone rising name\'s bell (bells) on arrival. Kit past R 0.7 for a bar (perc 36/42), latched four bars. CC74: pad = swell, texture = updraft.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h;
      const n = Math.min(6500, Math.round(1900 * as));
      const x = new Float32Array(n), y = new Float32Array(n), vy = new Float32Array(n), vx = new Float32Array(n), sz = new Float32Array(n), ph = new Float32Array(n), st = new Uint8Array(n), age = new Float32Array(n);
      for (let i = 0; i < n; i++) { x[i] = P.rand() * w; y[i] = P.rand() * h; sz[i] = 0.5 + Math.pow(P.rand(), 2) * 1.6; ph[i] = P.rand() * TAU; }
      P.state = { n, x, y, vx, vy, sz, ph, st, age, pres: 0, lift: 0, swell: 0, drift: 0, arrived: 0, arrBeat: 0, lastBeat: -1, kit: 0, kitBars: 0, lastBar: -1, chargeBars: 0, events: [], bandY: h * 0.13, bandGlow: 0, name: null, nameT: 12 + P.rand() * 15, trail: [] };
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
        const dy0 = domeY(P, x[i]);
        if (st[i] === 1) {
          age[i] += dt;
          x[i] += Math.sin(s.drift * 0.3 + ph[i]) * 30 * dt + 12 * dt;
          y[i] += (dy0 + Math.sin(s.drift * 0.7 + ph[i] * 3) * h * 0.04 - y[i]) * Math.min(1, dt * 2);
          if (x[i] > w + 4) x[i] -= w + 8;
          if (age[i] > 2.5 + (ph[i] / TAU) * 4) { st[i] = 0; y[i] = h + 6; x[i] = P.rand() * w; vy[i] = 0; age[i] = 0; }
          continue;
        }
        const fx = Math.sin(y[i] * k * 1.3 + s.drift * 0.9 + ph[i]) * turb + Math.cos(x[i] * k * 0.8 - s.drift * 0.6) * turb * 0.6;
        const fy = -up * (0.6 + s.sz[i] * 0.4) + Math.cos(x[i] * k * 1.7 + s.drift * 0.5) * turb * 0.4;
        vx[i] += (fx - vx[i]) * Math.min(1, dt * 2.5); vy[i] += (fy - vy[i]) * Math.min(1, dt * 2.5);
        x[i] += vx[i] * dt; y[i] += vy[i] * dt;
        if (x[i] < -4) x[i] += w + 8; else if (x[i] > w + 4) x[i] -= w + 8;
        if (y[i] < dy0 + h * 0.03) { st[i] = 1; age[i] = 0; arrived++; }
      }
      s.arrived += arrived; s.arrBeat += arrived;
      s.bandGlow += (clamp(arrived / dt / 400) - s.bandGlow) * Math.min(1, dt * 3);
      // the lone name: rises slowly on its own clock, whatever the updraft; rings on arrival
      s.nameT -= dt;
      if (!s.name && s.nameT <= 0) { s.name = { x: w * (0.15 + P.rand() * 0.7), y: h + 10, ph: P.rand() * TAU }; s.trail = []; }
      if (s.name) {
        const nm = s.name;
        nm.y -= (70 + L * 60) * dt; nm.x += Math.sin(s.drift * 0.8 + nm.ph) * 25 * dt;
        s.trail.push([nm.x, nm.y]); if (s.trail.length > 40) s.trail.shift();
        if (nm.y < domeY(P, nm.x) + h * 0.02) { s.events.push({ kind: 'name', pan: nm.x / w * 2 - 1 }); s.name = null; s.nameT = 14 + P.rand() * 20; s.bandGlow = 1; }
      }
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
        const u = clamp(1 - y[i] / h);
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
      // the dome: a soft gold arc across the top, brighter as sparks arrive
      const ba = (0.03 + Sw * 0.1 + s.bandGlow * 0.14) * bright;
      g.lineCap = 'round';
      for (let j = 0; j < 4; j++) {
        g.strokeStyle = `rgba(255,${222 - j * 6},${160 - j * 10},${ba * (1 - j * 0.22)})`; g.lineWidth = (14 + j * 26) * ms;
        g.beginPath();
        for (let i = 0; i <= 48; i++) { const xx = i / 48 * w; const yy = domeY(P, xx); if (i) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
        g.stroke();
      }
      // the lone name and its trail
      if (s.name) {
        const nm = s.name;
        g.strokeStyle = `rgba(255,245,225,${0.5 * bright})`; g.lineWidth = 2.2 * ms;
        g.beginPath(); s.trail.forEach((p, i) => { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.stroke();
        const r = 9 * ms; g.globalAlpha = bright; g.drawImage(spr[3], nm.x - r * 2, nm.y - r * 2, r * 4, r * 4); g.globalAlpha = 1;
      }
      if (s.kit) {
        const pl = T.beatPulse();
        const fg = g.createLinearGradient(0, h, 0, h * 0.6);
        fg.addColorStop(0, `rgba(255,120,50,${pl * 0.25 * bright})`); fg.addColorStop(1, 'rgba(255,120,50,0)');
        g.fillStyle = fg; g.fillRect(0, h * 0.6, w, h * 0.4);
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(235,225,215,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('UPDRAFT ' + Math.round(L * 100) + '   SWELL ' + Math.round(Sw * 100) + '   ASCENDED ' + s.arrived + '   ' + (H.label || '') + (s.kit ? '   · KIT ' + s.kitBars : '') + (s.pres < 0.3 ? '   · EMBERS' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 4, { type: 'triangle', gain: 0.004, cutoff: 240, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, 0, glide);
      place(0.05);
      const sub = v.osc('sine', 55), sg = v.g(0.025); sub.connect(sg); sg.connect(v.group);
      // the rise texture: three voices an octave apart sweeping up and wrapping under, under the chords
      const sh = A.voice(); sh._noHold = true;
      const NV = 3, OCT = 3, shv = [];
      const shf = sh.filter('lowpass', 700, 0.5); const shg = sh.g(1); shf.connect(shg); shg.connect(sh.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; shg.connect(sd); sd.connect(A.revIn); }
      for (let i = 0; i < NV; i++) { const o = sh.osc('sine', 110), gg = sh.g(0.0001); o.connect(gg); gg.connect(shf); shv.push({ o, g: gg }); }
      let phase = 0;
      // the bass walk: struck once per chord on its own channel, plus a rolled pad chord for the rack
      const strike = () => {
        const now = A.t();
        A.bassNote(H.chordTone(0, -1), { at: now + 0.02, vol: 0.09 + P.state.swell * 0.06, dur: 3.5, rev: 0.2 });
        for (let i = 1; i < 4; i++) A.tone(H.chordTone(i, 0), { at: now + 0.09 * i, vol: 0.0001, dur: 3.5, attack: 0.5, type: 'sine', rev: 0, role: 'pad' });
      };
      H.onChord(() => { place(0.25); A.set(sub.frequency, H.chordTone(0, -2), 0.12); strike(); });
      A.set(sub.frequency, H.chordTone(0, -2), 0.05);
      v.fadeIn(1, 1.5); sh.fadeIn(1, 2);
      let nextT = T.next(0.5);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7, L = s.lift, Sw = s.swell;
          const rise = clamp((L - 0.5) * 2);                                     // the texture only past half updraft
          const rate = (1 / 60 + L * L * (1 / 8 - 1 / 60)) / OCT;
          phase = (phase + rate * dt) % 1;
          const fmin = H.rootFreq(-1);
          shv.forEach((vc, i) => {
            const p = (phase + i / NV) % 1;
            const win = 0.5 - 0.5 * Math.cos(p * TAU);
            try { vc.o.frequency.setTargetAtTime(fmin * Math.pow(2, p * OCT), now, 0.05); } catch (e) {}
            A.set(vc.g.gain, (0.004 + Sw * 0.004) * win * win * rise * gate, 0.08);
          });
          A.set(shf.frequency, 400 + Sw * 1200, 0.3);
          pad.forEach((p, i) => { p.level((0.004 + Sw * 0.009) * gate, 0.3); p.bright(260 + Sw * 1600, 0.25); });
          A.set(sg.gain, (0.02 + Sw * 0.025) * gate, 0.2);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'arrive') A.bell(H.chordTone(2 + Math.floor(e.k * 3), 2), { vol: (0.006 + e.k * 0.028 + e.swell * 0.01) * gate, dur: 3, rev: 0.85, pan: (P.rand() - 0.5) });
            else if (e.kind === 'name') A.bell(H.chordTone(4, 2), { vol: 0.05 * gate, dur: 5, rev: 0.9, pan: e.pan * 0.6 });
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
