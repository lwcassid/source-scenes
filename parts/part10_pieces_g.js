/* ============================================================
   SRC-30 · STORM GARDEN — herd the clouds, build the beat
   ============================================================ */
reg({
  id: 'SRC-30', ver: 2, title: 'Storm Garden', tech: 'CLOUD HERD / ARRANGEMENT ENGINE',
  music: { bpm: 96, root: 45, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { bloom: 0.6, edge: true },
  tags: ['CHARGE = INTENSITY', 'BEAT THAT BUILDS', 'LIGHTNING PAYOFF', 'VOLUME NATIVE'],
  desc: 'A garden of slow clouds drifting through the volume, each one an instrument waiting to be fed. Each hand is a storm front — a horizontal line of pressure at your hand\'s height. Sweep it through a cloud and the cloud charges: darker, denser, raining harder, and the rain is the music. The arrangement obeys the weather: a calm sky is pads and sparse piano-rain; feed the clouds and a pulse fades in; keep feeding and the hats arrive; drive the whole garden to storm and the beat drops fully. Overcharge any single cloud and it DISCHARGES — lightning to the ground, the whole volume flashes white, thunder on your sample channel — and that cloud, spent, drifts quiet again.',
  interact: 'Each hand is a full-height vertical line of light that sweeps HORIZONTALLY — hands down, both lines rest at center; raising a hand sweeps its line outward across its half of the sky. Park a line on a cloud to SELECT it: it charges, rains harder, glows hotter, and rides on to lightning. Rake across the sky to feed many clouds a little; camp on one to take it all the way. Total charge = arrangement intensity; single-cloud overcharge = the strike.',
  sound: 'The arrangement ladder, all on the grid at 96bpm, all over MIDI: STAGE 0 pads + rain-plinks (lead, pitch by cloud position). STAGE 1 (+charge) pulse bass 8ths fades in. STAGE 2 swung hats + sparse arp. STAGE 3 four-on-the-floor + clap — the drop. Lightning: crack on bells, thunder = long low note on the texture channel (rack your REAL thunder + rain samples there; this scene was built for them). In Ableton: sidechain pads/bass to the kick so the storm pumps; map CC74 (pad) to a big reverb size — the sky literally opens as it charges.',
  init(P) {
    const clouds = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      // low-poly faceted cloud: flat-bottomed cluster of crystalline triangles
      const tris = [];
      const nT = 34 + (P.rand() * 12 | 0);
      for (let k = 0; k < nT; k++) {
        let tx, ty, tries = 0;
        do {
          tx = (P.rand() - 0.5) * 2.5;
          ty = (P.rand() - 0.5) * 0.95;
          tries++;
        } while (tries < 14 && ((tx / 1.32) ** 2 + ((ty + 0.1) / 0.52) ** 2 > 1 || ty > 0.42));
        const verts = [];
        for (let vv = 0; vv < 3; vv++) {
          const a = P.rand() * TAU, rr = 0.2 + P.rand() * 0.3;
          verts.push([tx + Math.cos(a) * rr, Math.min(0.5, ty + Math.sin(a) * rr)]);
        }
        // facets get lighter toward the top of the cloud, like the reference
        tris.push({ v: verts, lum: 52 + Math.max(0, -ty) * 36 + P.rand() * 22, fl: P.rand() * TAU });
      }
      clouds.push({
        x: (i + 0.5) / n + (P.rand() - 0.5) * 0.06, y: 0.14 + P.rand() * 0.42,
        vx: (P.rand() - 0.5) * 0.008, scale: 0.75 + P.rand() * 0.6,
        charge: P.rand() * 0.15, tris, ph: P.rand() * TAU, flash: 0, lastPlink: 0
      });
    }
    P.state = { clouds, drops: [], splashes: [], bolts: [], skyFlash: 0, total: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const groundY = 0.88;
    // vertical selector lines sweeping horizontally — mirror-outward from center
    const lineL = 0.5 - inp.L * 0.48;
    const lineR = 0.5 + inp.R * 0.48;
    s.lineL = lineL; s.lineR = lineR;
    let total = 0;
    for (const c of s.clouds) {
      c.x += c.vx * dt + Math.sin(t * 0.13 + c.ph) * dt * 0.004;
      if (c.x < -0.08) c.x = 1.08; if (c.x > 1.08) c.x = -0.08;
      c.y += Math.sin(t * 0.21 + c.ph * 2) * dt * 0.004;
      const reach = 0.055 + c.scale * 0.03;
      const feed = Math.max(bump(c.x, lineL, reach), bump(c.x, lineR, reach)) * 0.62;
      c.sel = feed > 0.1;
      c.charge = clamp(c.charge + feed * dt * 0.55 - dt * 0.025, 0, 1.02);
      c.flash *= Math.pow(0.01, dt);
      total += Math.min(1, c.charge);
      // rain
      const rate = c.charge * c.charge * 34;
      if (P.rand() < rate * dt) {
        s.drops.push({
          x: (c.x + (P.rand() - 0.5) * 0.09 * c.scale) * w,
          y: (c.y + 0.05) * h, vy: (260 + P.rand() * 160) * (0.6 + c.charge * 0.5), c
        });
      }
      // LIGHTNING
      if (c.charge >= 1) {
        c.charge = 0.22; c.flash = 1; s.skyFlash = 1;
        const pts = [[c.x * w, (c.y + 0.04) * h]];
        let bx = c.x * w;
        for (let yy = c.y + 0.08; yy < groundY; yy += 0.07) {
          bx += (P.rand() - 0.5) * w * 0.05;
          pts.push([bx, yy * h]);
        }
        pts.push([bx, groundY * h]);
        s.bolts.push({ pts, life: 1 });
        const pan = c.x * 2 - 1;
        P.ping(A => {
          MOut.evNote('texture', H.rootFreq(-3), 0.6, 0, 4);           // your real thunder lives here
          A.hit({ vol: 0.4, dur: 1.4, freq: 70, q: 0.4, type: 'lowpass' });
          A.hit({ vol: 0.22, dur: 0.08, freq: 6000, q: 0.4, pan });
          A.bell(H.chordTone(9, 1), { vol: 0.12, dur: 3, rev: 0.8, pan });
          A.bassNote(H.rootFreq(-2), { vol: 0.25, dur: 2.2 });
        });
      }
    }
    s.total += (total / s.clouds.length - s.total) * Math.min(1, dt * 2);
    s.skyFlash *= Math.pow(0.004, dt);
    // drops fall
    for (const d of s.drops) { d.y += d.vy * dt; }
    const gY = groundY * h;
    for (const d of s.drops) {
      if (d.y >= gY) {
        s.splashes.push({ x: d.x, t });
        if (t - d.c.lastPlink > 0.13 && d.c.charge > 0.12) {
          d.c.lastPlink = t;
          const deg = Math.round(d.c.x * 9);
          const vol = 0.05 + d.c.charge * 0.07;
          P.ping(A => A.pluck2(H.scaleTone(deg, 0), { at: A.q(), vol, dur: 1, pan: d.c.x * 2 - 1, rev: 0.4, del: 0.15 }));
        }
      }
    }
    s.drops = s.drops.filter(d => d.y < gY);
    s.splashes = s.splashes.filter(sp => t - sp.t < 0.5);
    for (const b of s.bolts) b.life -= dt * 2.6;
    s.bolts = s.bolts.filter(b => b.life > 0);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,5,10,0.5)'; g.fillRect(0, 0, w, h);
    // sky flash — the whole volume ignites
    if (s.skyFlash > 0.01) {
      g.fillStyle = `rgba(225,220,255,${s.skyFlash * 0.4})`;
      g.fillRect(0, 0, w, h);
    }
    const groundY = 0.88 * h;
    // the hands: full-height vertical selector lines sweeping horizontally
    for (const [lx, live] of [[s.lineL, chan.L.mode === 'live'], [s.lineR, chan.R.mode === 'live']]) {
      const colX = lx * w;
      for (let k = 0; k < 3; k++) {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, `rgba(210,235,255,${(live ? 0.5 : 0.22) / (k * 0.6 + 1)})`);
        gr.addColorStop(0.5, `rgba(165,205,255,${(live ? 0.4 : 0.18) / (k * 0.6 + 1)})`);
        gr.addColorStop(1, `rgba(150,195,255,${(live ? 0.24 : 0.1) / (k * 0.6 + 1)})`);
        g.strokeStyle = gr;
        g.lineWidth = 2.6 - k * 0.6;
        g.shadowColor = '#bfe0ff'; g.shadowBlur = k === 0 ? 12 : 0;
        g.beginPath();
        for (let yy = 0; yy <= h; yy += h / 22) {
          const sway = Math.sin(yy * 0.012 + t * (1.5 + k * 0.5) + k * 2.1) * (4 + k * 3);
          yy === 0 ? g.moveTo(colX + sway, yy) : g.lineTo(colX + sway, yy);
        }
        g.stroke();
        g.shadowBlur = 0;
      }
      // selection node: glow where the line meets a selected cloud
      for (const c of s.clouds) {
        if (!c.sel || Math.abs(c.x - lx) > 0.09) continue;
        const cy2 = c.y * h;
        const ng = g.createRadialGradient(colX, cy2, 2, colX, cy2, 34);
        ng.addColorStop(0, `rgba(235,245,255,${0.5 + Math.min(1, c.charge) * 0.5})`);
        ng.addColorStop(1, 'rgba(190,220,255,0)');
        g.fillStyle = ng;
        g.beginPath(); g.arc(colX, cy2, 34, 0, TAU); g.fill();
      }
    }
    // rain
    g.lineWidth = 1.4;
    for (const d of s.drops) {
      const ch = d.c.charge;
      g.strokeStyle = `rgba(${165 + ch * 60},${200 + ch * 30},255,${0.3 + ch * 0.5})`;
      g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(d.x - 1.5, d.y + 9 + ch * 8); g.stroke();
    }
    // splashes
    for (const sp of s.splashes) {
      const k = (t - sp.t) / 0.5;
      g.strokeStyle = `rgba(180,215,255,${(1 - k) * 0.5})`;
      g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(sp.x, groundY, 4 + k * 16, (4 + k * 16) * 0.3, 0, 0, TAU); g.stroke();
    }
    // ground
    g.strokeStyle = 'rgba(120,150,200,0.3)';
    g.beginPath(); g.moveTo(w * 0.03, groundY); g.lineTo(w * 0.97, groundY); g.stroke();
    // clouds — low-poly crystalline facets, flat-bottomed
    const m = Math.min(w, h);
    for (const c of s.clouds) {
      const cx2 = c.x * w, cy2 = c.y * h + Math.sin(t * 0.5 + c.ph) * 2.5;
      const base = m * 0.055 * c.scale;
      const ch = Math.min(1, c.charge);
      // base silhouette so the facet gaps read as shadow, not void
      g.fillStyle = `hsla(${226 + ch * 40},${16 + ch * 30}%,${16 + ch * 22}%,0.92)`;
      g.beginPath();
      g.ellipse(cx2, cy2 - base * 0.1, base * 1.42, base * 0.6, 0, 0, TAU);
      g.ellipse(cx2 - base * 0.7, cy2 + base * 0.1, base * 0.7, base * 0.42, 0, 0, TAU);
      g.ellipse(cx2 + base * 0.7, cy2 + base * 0.1, base * 0.7, base * 0.42, 0, 0, TAU);
      g.fill();
      for (const tri of c.tris) {
        // sleeper: white/blue-gray facets · charged: electric violet, flickering
        const flick = ch > 0.35 ? Math.sin(t * (14 + ch * 12) + tri.fl) * ch * 9 : 0;
        const hue = 222 + ch * 48;
        const sat = 12 + ch * 46;
        const lum = tri.lum * (0.62 + ch * 0.5) + c.flash * 34 + flick;
        g.fillStyle = `hsla(${hue},${sat}%,${clamp(lum, 8, 96)}%,0.96)`;
        const jx = ch > 0.6 ? Math.sin(t * 22 + tri.fl) * ch * 1.6 : 0;
        g.beginPath();
        g.moveTo(cx2 + tri.v[0][0] * base + jx, cy2 + tri.v[0][1] * base);
        g.lineTo(cx2 + tri.v[1][0] * base, cy2 + tri.v[1][1] * base);
        g.lineTo(cx2 + tri.v[2][0] * base + jx, cy2 + tri.v[2][1] * base);
        g.closePath();
        g.fill();
      }
      // charge meter: a heartbeat glow under the cloud, pulsing with the transport
      if (ch > 0.08) {
        const pulse = (P.focused && T.running) ? T.beatPulse() : Math.max(0, Math.sin(t * 5));
        g.fillStyle = `hsla(${265 - ch * 40},90%,${60 + ch * 25}%,${ch * (0.25 + pulse * 0.45)})`;
        g.beginPath(); g.arc(cx2, cy2 + base * 1.1, base * (0.34 + ch * 0.3), 0, TAU); g.fill();
      }
    }
    // bolts
    for (const b of s.bolts) {
      g.strokeStyle = `rgba(240,238,255,${b.life})`;
      g.lineWidth = 2.5 + b.life * 2;
      g.shadowColor = '#cfc4ff'; g.shadowBlur = 24 * b.life;
      g.beginPath();
      g.moveTo(b.pts[0][0], b.pts[0][1]);
      for (let i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i][0], b.pts[i][1]);
      g.stroke();
      g.shadowBlur = 0;
    }
    // storm meter HUD
    g.fillStyle = 'rgba(170,195,240,0.8)'; g.font = '10px ui-monospace,monospace';
    const stage = s.total > 0.72 ? 3 : s.total > 0.5 ? 2 : s.total > 0.28 ? 1 : 0;
    g.fillText('STORM ' + Math.round(s.total * 100) + '%  STAGE ' + stage + ['  · PADS', '  · +PULSE', '  · +HATS', '  · FULL BEAT'][stage], 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 4, { type: 'sawtooth', gain: 0.034, cutoff: 420, q: 0.5 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 1.4));
    let next16 = T.next(0.25), st16 = 0;
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const s = P.state;
        const total = s.total;
        pads.forEach(p => p.bright(320 + total * 1600, 0.4));
        MOut.expr('pad', total);
        const horizon = AE.t() + 0.15;
        while (next16 < horizon) {
          const st = st16 % 16;
          const sw = st % 2 === 1 ? T.beat * 0.075 : 0;
          const tt = next16 + sw;
          // STAGE 1+: pulse bass fades in with the storm
          if (total > 0.28 && st % 2 === 0) {
            const bv = Math.min(0.2, (total - 0.24) * 0.5);
            const bf = H.rootFreq(st % 8 === 0 ? -2 : -1);
            A.bassNote(bf, { at: next16, vol: bv, dur: 0.24 });
          }
          // STAGE 2+: swung hats + sparse arp
          if (total > 0.5) {
            if (st % 2 === 1) A.hat(tt, { vol: 0.02 + total * 0.03 });
            if (st % 8 === 6) A.hat(tt, { vol: 0.02, open: true });
            if (st % 4 === 2) A.tone(H.chordTone(2 + ((st16 >> 2) % 4) * 2, 0), { at: tt, vol: 0.05 + total * 0.03, dur: 0.18, type: 'square', rev: 0.2, del: 0.35 });
          }
          // STAGE 3: the drop — four-on-the-floor + clap
          if (total > 0.72) {
            if (st % 4 === 0) A.kick(next16, 0.3);
            if (st % 8 === 4) {
              MOut.evDrum(38, 0.24, next16);
              A.hit({ vol: 0.16, dur: 0.14, freq: 1900, q: 0.8, at: next16 });
            }
          }
          st16++; next16 += T.beat * 0.25;
        }
        if (next16 < AE.t()) next16 = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
