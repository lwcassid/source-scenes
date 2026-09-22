/* ---------- SRC-54 · ACCRETION (an offering to the dark) ----------
   TEMPLE SET · the descent. A disc of dust in orbit around something
   black. The LEFT hand is VISCOSITY: honeyed, the dust loses its orbits
   and streams inward in prismatic ribbons; thin, it settles into crisp
   ringlets. The RIGHT hand is the FEED: a tidal stream pouring new dust in
   from the rim. Every grain that crosses the last orbit flares and is gone
   — that is the offering — and the photon ring at the edge of the dark is
   the one thin line that never goes out. Iridescent flow, not flat neon:
   colour is TEMPERATURE, and the spectrum runs from ember at the rim to
   white-blue at the last orbit. */
(() => {
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.35, `rgba(${rgb},0.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    return (SPR[key] = c);
  }
  // temperature ramp, rim -> ISCO: ember, amber, gold, pearl, ice — pearl in the middle, never a rainbow stripe
  const TEMP = ['200,70,40', '255,140,60', '255,205,140', '240,240,255', '170,200,255', '210,230,255'];
  const TILT = 0.5;      // the disc seen from ~30 degrees above its plane

  reg({
    id: 'SRC-54', family: 'SRC-54', ver: 1, title: 'Accretion', tech: 'KEPLERIAN DISC / VISCOUS INFALL',
    music: {
      bpm: 84, root: 37, mode: 'phrygian', chordBars: 2,
      chords: [
        [0, 7, 13, 19, 22],    // C#m♭9 — the phrygian dark
        [0, 7, 12, 18, 22],    // C#m11
        [0, 6, 13, 18, 25],    // C#7♭9♭5 — the fall
        [0, 7, 10, 15, 22]     // C#m7
      ],
      chordNames: ['C♯m♭9', 'C♯m11', 'C♯m7♭5♭9', 'C♯m7']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'L VISCOSITY, R FEED', 'THE PHOTON RING', 'EARNED HEARTBEAT'],
    desc: 'A disc of dust in orbit around a black centre, seen from a little above its plane. Left alone it is a set of thin ringlets, each grain keeping its orbit. Add viscosity and the orbits fail: grains lose energy to their neighbours and spiral inward in braided, iridescent streams, heating from ember-red at the rim to pearl and ice-blue near the last stable orbit. Grains that cross it flare once and are gone. Around the dark itself runs the photon ring: a single thin line of light that the dark cannot swallow. Feed the disc and it thickens and brightens; feed it hard enough, long enough, and the heartbeat starts.',
    interact: 'L = VISCOSITY. Drawn back, the dust is frictionless and the disc is a set of clean, thin rings. Lean in and the dust turns to honey: orbits decay, the rings braid into streams and pour toward the centre, and the whole disc heats. R = THE FEED. Reach and a tidal stream of new dust pours in from the right-hand rim, violet at the source, taking the disc\'s colour as it joins. Both hands high = maximum infall: a steady rain of grains crossing the last orbit, each one a flare. Hold that for two bars and the disc\'s heartbeat comes in on the downbeat and stays for a while; ease off and it lets go.',
    sound: 'A C♯ phrygian pedal, browser-side. The disc is a continuous voice (MIDI role: texture) — a dark filtered drone whose cutoff and level are the infall RATE, so the sound is the light at the photon ring. Grains crossing the last orbit are gathered per sixteenth into one soft high pluck (MIDI role: lead), velocity from how many fell in that step, never one note per grain. The heartbeat is earned: two bars of sustained infall opens a kick on 1 and the "and" of 3 with a low bass pulse (MIDI roles: perc 36, bass), latched for eight bars once opened. The feed streams CC74 on pad; viscosity on texture.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h, S = Math.min(w, h);
      const cx = w / 2, cy = h * 0.52, Rin = S * 0.09, Rout = S * 0.5;
      const n = Math.min(3200, Math.round(900 * as));
      const g = [];
      // the disc is RINGLETS: grains spawn into narrow bands, so with no
      // viscosity it reads as thin rings; viscosity smears the bands into streams
      const BANDS = 9;
      const spawn = (p, edge) => {
        const band = Math.floor(P.rand() * BANDS);
        const r = edge ? Rout * (0.96 + P.rand() * 0.04) : Rin + (band + 0.5 + (P.rand() - 0.5) * 0.28) / BANDS * (Rout - Rin);
        p.r = r; p.a = edge ? 0.15 + P.rand() * 0.3 : P.rand() * TAU;   // the feed enters from the right
        p.z = (P.rand() - 0.5) * 0.06; p.heat = 0; p.flare = 0; p.dr = 0; p.spd = 0.9 + P.rand() * 0.2; p.dying = 0;
        return p;
      };
      for (let i = 0; i < n; i++) g.push(spawn({}, false));
      P.state = { g, cx, cy, Rin, Rout, pres: 0, visc: 0, feed: 0, rate: 0, fell: 0, heat: 0, hb: 0, hbBars: 0, lastBar: -1, chargeBars: 0, spawn, drift: 0, fellStep: 0, ringGlow: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleV = 0.25 + Math.sin(s.drift * 0.13) * 0.1;
      const V = clamp(inp.L) * s.pres + idleV * (1 - s.pres);
      s.visc += (V - s.visc) * Math.min(1, dt * 6);
      s.feed += (clamp(inp.R) * s.pres - s.feed) * Math.min(1, dt * 6);
      const visc = s.visc, feed = s.feed;
      const om = 1.1;                                       // orbital rate scale
      let fell = 0, heat = 0;
      for (const p of s.g) {
        // a fallen grain flares WHERE IT FELL, then is reborn
        if (p.dying > 0) {
          p.dying -= dt;
          if (p.dying <= 0) {
            const feedIt = P.rand() < 0.3 + feed * 0.7;
            s.spawn(p, feedIt);
          }
          continue;
        }
        const rn = (p.r - s.Rin) / (s.Rout - s.Rin);         // 0 at the last orbit, 1 at the rim
        const w0 = om * Math.pow(Math.max(0.05, p.r / s.Rout), -1.5) * p.spd * 0.25;  // Kepler: inner faster
        p.a += w0 * dt;
        // viscosity: energy lost to shear — the closer in, the more shear, the faster the fall
        const inflow = visc * visc * (0.9 + (1 - rn) * 1.6) * s.Rout * 0.05;
        p.dr += (-inflow - p.dr) * Math.min(1, dt * 2);
        p.r += p.dr * dt;
        p.heat += ((1 - rn) * (0.4 + visc * 0.6) - p.heat) * Math.min(1, dt * 3);
        heat += p.heat;
        if (p.r < s.Rin) { fell++; p.flare = 1; p.r = s.Rin; p.dying = 0.45; }
      }
      for (const p of s.g) p.flare = Math.max(0, p.flare - dt * 2.5);
      // the feed also drags the disc denser at the rim: grains beyond the rim are pushed in
      s.fell += fell; s.fellStep += fell;
      s.rate += (fell / Math.max(dt, 1e-3) / 60 - s.rate) * Math.min(1, dt * 2);   // grains/s, ~1 at full
      s.heat += (heat / s.g.length - s.heat) * Math.min(1, dt * 2);
      s.ringGlow += (clamp(s.rate) - s.ringGlow) * Math.min(1, dt * 4);

      // the heartbeat: earned by two bars of real infall, latched for eight
      const bar = (typeof T !== 'undefined' && T.running) ? T.bar() : -1;
      if (bar !== s.lastBar && bar >= 0) {
        s.lastBar = bar;
        const hot = s.rate > 0.45 && s.pres > 0.5;
        s.chargeBars = hot ? s.chargeBars + 1 : 0;
        if (!s.hb && s.chargeBars >= 2) { s.hb = 1; s.hbBars = 8; }
        else if (s.hb) { if (hot) s.hbBars = 8; else if (--s.hbBars <= 0) { s.hb = 0; s.chargeBars = 0; } }
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const proj = p => {
        const x = s.cx + Math.cos(p.a) * p.r, y = s.cy + Math.sin(p.a) * p.r * TILT + p.z * p.r;
        return [x, y];
      };
      const spr = TEMP.map((c, i) => sprite('t' + i, c)), viol = sprite('feed', '190,140,255'), white = sprite('w', '255,255,255');
      const dot = (p, back) => {
        const [x, y] = proj(p);
        const rn = clamp((p.r - s.Rin) / (s.Rout - s.Rin));
        const ti = clamp(Math.round((1 - rn) * (TEMP.length - 1) * (0.5 + p.heat * 0.7)), 0, TEMP.length - 1);
        const sz = (1.4 + p.heat * 1.4 + (1 - rn) * 0.6) * ms * (back ? 0.85 : 1);
        g.globalAlpha = (0.16 + p.heat * 0.5 + (1 - rn) * 0.15) * bright * (back ? 0.75 : 1);
        g.drawImage(rn > 0.93 && s.feed > 0.05 ? viol : spr[ti], x - sz, y - sz, sz * 2, sz * 2);
        if (p.flare > 0) {
          const fr = sz * (1.5 + p.flare * 2.5);
          g.globalAlpha = p.flare * 0.7 * bright;
          g.drawImage(white, x - fr, y - fr, fr * 2, fr * 2);
        }
      };
      g.globalCompositeOperation = 'lighter';
      // back half of the disc (behind the dark), then the dark, then the front half
      for (const p of s.g) if (Math.sin(p.a) < 0) dot(p, true);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = '#000';
      g.beginPath(); g.ellipse(s.cx, s.cy, s.Rin * 0.78, s.Rin * 0.78, 0, 0, TAU); g.fill();
      g.globalCompositeOperation = 'lighter';
      // the photon ring — the one thin line; a prismatic fringe just outside it
      const rr = s.Rin * 0.8;
      const glow = 0.5 + s.ringGlow * 0.5 + (s.hb ? T.beatPulse() * 0.35 : 0);
      g.strokeStyle = `rgba(255,120,100,${0.35 * glow * bright})`; g.lineWidth = 1.2 * ms;
      g.beginPath(); g.arc(s.cx, s.cy, rr + 2.2 * ms, 0, TAU); g.stroke();
      g.strokeStyle = `rgba(120,170,255,${0.35 * glow * bright})`;
      g.beginPath(); g.arc(s.cx, s.cy, rr - 1.6 * ms, 0, TAU); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${0.95 * glow * bright})`; g.lineWidth = 1.6 * ms;
      g.beginPath(); g.arc(s.cx, s.cy, rr, 0, TAU); g.stroke();
      const gr = g.createRadialGradient(s.cx, s.cy, rr, s.cx, s.cy, rr * (1.5 + s.ringGlow * 0.5));
      gr.addColorStop(0, `rgba(230,235,255,${0.16 * glow * bright})`); gr.addColorStop(1, 'rgba(230,235,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(s.cx, s.cy, rr * (1.5 + s.ringGlow * 0.5), 0, TAU); g.fill();
      for (const p of s.g) if (Math.sin(p.a) >= 0) dot(p, false);
      // the heartbeat shows: the whole disc pulses on the kick
      if (s.hb) {
        const pl = T.beatPulse();
        g.globalAlpha = pl * 0.1 * bright;
        const R2 = s.Rout * 1.05;
        const gr2 = g.createRadialGradient(s.cx, s.cy, s.Rin, s.cx, s.cy, R2);
        gr2.addColorStop(0, 'rgba(255,200,160,0.5)'); gr2.addColorStop(1, 'rgba(255,200,160,0)');
        g.fillStyle = gr2; g.beginPath(); g.ellipse(s.cx, s.cy, R2, R2 * TILT, 0, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(230,220,220,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('VISCOSITY ' + Math.round(s.visc * 100) + '   FEED ' + Math.round(s.feed * 100) + '   INFALL ' + s.rate.toFixed(2) + '/s   HEAT ' + Math.round(s.heat * 100) +
        '   OFFERED ' + s.fell + (s.hb ? '   · HEARTBEAT ' + s.hbBars : s.chargeBars ? '   · charging ' + s.chargeBars + '/2' : '') + (s.pres < 0.3 ? '   · ORBITING' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.006, cutoff: 220, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05); H.onChord(() => { place(0.18); tune(0.1); });
      // the disc: one dark drone, the light at the ring
      const o = v.osc('sawtooth', 70), o2 = v.osc('triangle', 70), o3 = v.osc('sine', 35);
      const f = v.filter('lowpass', 200, 2.2), gg = v.g(0.0001);
      o.connect(f); o2.connect(f); o3.connect(f); f.connect(gg); gg.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.5; gg.connect(sd); sd.connect(A.revIn); }
      const tune = glide => { const r = H.chordTone(0, -1); A.set(o.frequency, r, glide); A.set(o2.frequency, r * 1.5, glide); A.set(o3.frequency, r * 0.5, glide); };
      tune(0.05);
      v.fadeIn(1, 1.5);
      let nextT = T.next(0.25);
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7;
          const rate = clamp(s.rate);
          A.set(gg.gain, (0.004 + rate * 0.02 + s.heat * 0.006) * gate, 0.15);
          A.set(f.frequency, 120 + rate * 1800 + s.visc * 300, 0.12);
          pad.forEach(p => p.level(0.005 + s.feed * 0.004, 0.5));
          const horizon = now + 0.15;
          while (nextT < horizon) {
            const st = Math.round((nextT - T.t0) / (T.beat * 0.25)) % 16;
            // the fallen, gathered per sixteenth: one statement, velocity from how many
            if (s.fellStep > 0 && gate > 0.35) {
              const k = clamp(s.fellStep / 6);
              A.pluck2(H.chordTone(2 + Math.floor(k * 4), 2), { at: nextT, vol: (0.012 + k * 0.04) * gate, dur: 0.6, rev: 0.6, del: 0.3, pan: (st % 2 ? 0.4 : -0.4) });
              s.fellStep = 0;
            }
            if (s.hb) {
              if (st === 0 || st === 10) A.kick(nextT, 0.22 + (st === 0 ? 0.1 : 0));
              if (st === 0) A.bassNote(H.chordTone(0, -2), { at: nextT, vol: 0.1, dur: 1.2 });
              if (st === 8) A.bassNote(H.chordTone(0, -2), { at: nextT, vol: 0.06, dur: 0.6 });
            }
            nextT += T.beat * 0.25;
          }
          if (nextT < now) nextT = T.next(0.25);
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', s.visc); MOut.expr('pad', s.feed); MOut.expr('lead', rate); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
