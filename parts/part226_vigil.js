/* ---------- SRC-51 · CONSTELLATION VIGIL (hold still, light a star) ----------
   TEMPLE SET · opener. Two candles held in a field of drifting dust. Each
   hand is a flame: its height is the hand. Dust near a flame is gathered into
   a slow spiral; hold the hand STILL and the gathered dust condenses into a
   STAR on the next beat. Stars stay for the whole scene, each one threaded
   to the last with a thin line — by minute nine the sky is the record of
   everyone who stood here. Memorial, quiet, ceremonial: the Temple's job. */
(() => {
  // one glow sprite per hue, drawn once — a radial gradient per dot per frame
  // is what makes a 2D particle scene crawl at 1920x1200
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.25, `rgba(${rgb},0.55)`);
    gr.addColorStop(0.6, `rgba(${rgb},0.12)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (SPR[key] = c);
  }
  const SIDES = ['L', 'R'];

  reg({
    id: 'SRC-51', family: 'SRC-51', ver: 1, title: 'Constellation Vigil', tech: 'VISCOUS DUST / STILLNESS DETECTOR',
    music: {
      bpm: 58, root: 50, mode: 'dorian', chordBars: 2,
      chords: [
        [0, 7, 14, 17, 24],    // Dm11 (open)
        [0, 7, 15, 21, 26],    // Dm13
        [0, 8, 15, 19, 24],    // B♭maj7/D
        [0, 5, 14, 19, 22]     // Dm11 (sus colour)
      ],
      chordNames: ['Dm11', 'Dm13', 'B♭maj7/D', 'Dsus/m11']
    },
    fx: { bloom: 0.55 },
    tags: ['TEMPLE SET', 'HOLD STILL = A STAR', 'THE SKY REMEMBERS', 'THIN THREADS'],
    desc: 'A dark field of dust in a slow, viscous drift. Two candle-flames stand in it, one for each hand. Dust that comes near a flame is drawn in and begins to circle. Hold the hand still, and on the next beat the circling dust condenses into a star. The star stays. Every star is threaded to the one before it by a single thin line, so as the minutes pass the room draws its own constellation — a vigil kept in light. Nothing here is fast; the dust punishes hurry and rewards stillness, which is the whole ritual.',
    interact: 'L = the LEFT flame, R = the RIGHT flame. Each hand sets its flame\'s height — lean in and the flame rises, drift back and it sinks — and the flame hums a note that steps up the chord ladder as it climbs. Dust near the flame gathers; the hum thickens as it does. HOLD STILL for about two seconds with dust gathered and the gathered dust becomes a star on the next beat, with a bell. Both hands lighting a star inside the same bar bridges the two constellations with a thread and a low toll. Move fast and nothing condenses: stillness is the only way to light anything.',
    sound: 'A D pedal under everything — three triangle pad voices, browser-side only, quiet enough to talk over. Each flame is one continuous voice (MIDI role: texture, held note follows the flame) whose pitch is a chord-ladder rung chosen by height, stepped and glided, with a soft noise breath that swells with gathered dust. A star igniting is one bell (MIDI role: bells) at the flame\'s rung, velocity from how much dust it took; a bridge between the two skies is a sub toll (bass) plus the current chord rolled low-to-high on the pad channel. No drums, ever — this is the arrival, not the dance. CC74: texture = gathered dust, bells = stars lit.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(1100, Math.round(250 * as));
      const d = [];
      for (let i = 0; i < n; i++) {
        d.push({ x: P.rand() * w, y: P.rand() * h, vx: 0, vy: 0, cap: -1, ph: P.rand() * TAU, sz: 0.7 + P.rand() * 0.9 });
      }
      const flame = side => ({
        side, x: side === 'L' ? w * 0.3 : w * 0.7, y: h * 0.55, ty: h * 0.55,
        v: 0.4, sm: 0.4, vel: 0, still: 0, gath: 0, rung: 3, charge: 0, cool: 0, flash: 0, arm: false
      });
      P.state = {
        d, F: { L: flame('L'), R: flame('R') }, pres: 0, stars: [], links: [],
        lastBeat: -1, bar: -1, litBar: { L: -9, R: -9 }, bridge: 0, drift: 0,
        S, unit: S * 0.012, n, events: []
      };
    },

    step(P, dt, t, inp) {
      const s = P.state, w = P.w, h = P.h;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const bt = (typeof T !== 'undefined' && T.running) ? Math.floor(T.beats()) : -1;
      const newBeat = bt !== s.lastBeat; s.lastBeat = bt;
      const bar = Math.floor(bt / 4);
      const R = s.S * 0.13;                    // the flame's gathering radius

      // ---- flames: the hand IS the height; stillness is measured on it ----
      for (const side of SIDES) {
        const f = s.F[side];
        const target = clamp(inp[side]);
        const prev = f.sm;
        f.sm += (target - f.sm) * Math.min(1, dt * 7);
        f.vel += ((Math.abs(f.sm - prev) / Math.max(dt, 1e-3)) - f.vel) * Math.min(1, dt * 4);
        // idle: the flames sink to embers, mid-height, and breathe
        const idleY = 0.42 + Math.sin(s.drift * 0.31 + (side === 'L' ? 0 : 1.9)) * 0.05;
        const hgt = f.sm * s.pres + idleY * (1 - s.pres);
        f.ty = h * (0.86 - hgt * 0.7);
        f.y += (f.ty - f.y) * Math.min(1, dt * 8);
        f.rung = Math.round(hgt * 6);          // 0..6 up the chord ladder
        // stillness: only counts with a live hand — ghosts cannot keep a vigil
        const stillNow = f.vel < 0.05 && chan[side].mode === 'live';
        f.still = stillNow ? f.still + dt : 0;
        f.cool = Math.max(0, f.cool - dt);
        f.flash = Math.max(0, f.flash - dt * 2.2);
        f.charge = clamp(f.still / 2.0) * clamp(f.gath / 12);
        f.arm = f.charge >= 1 && f.cool <= 0;
      }

      // ---- the dust: viscous drift, gathered by the flames -----------------
      const visc = 1.6;                        // how honeyed the field is
      let gL = 0, gR = 0;
      const k = 0.0032 / Math.sqrt(areaScale(P));
      for (const p of s.d) {
        // a slow curl field: the room breathing
        let fx = Math.sin(p.y * k * 1.3 + s.drift * 0.13) * 9 + Math.cos(p.x * k * 0.7 - s.drift * 0.09) * 5;
        let fy = Math.cos(p.x * k * 1.1 - s.drift * 0.11) * 7 - 6;   // a gentle rise — embers ascend
        // gathering: near a flame, spiral in
        let cap = -1;
        for (let i = 0; i < 2; i++) {
          const f = s.F[SIDES[i]];
          const dx = f.x - p.x, dy = f.y - p.y, dd = Math.hypot(dx, dy);
          if (dd < R) {
            const pull = (1 - dd / R);
            const orbit = dd < R * 0.45 ? 1 : 0.35;    // close in, it circles rather than falls
            fx += (dx / (dd + 1)) * pull * 90 * (1 - orbit * 0.7) - (dy / (dd + 1)) * pull * 140 * orbit;
            fy += (dy / (dd + 1)) * pull * 90 * (1 - orbit * 0.7) + (dx / (dd + 1)) * pull * 140 * orbit;
            cap = i;
            if (dd < R * 0.65) { if (i === 0) gL++; else gR++; }
          }
        }
        p.cap = cap;
        p.vx += (fx - p.vx) * Math.min(1, dt * visc);
        p.vy += (fy - p.vy) * Math.min(1, dt * visc);
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < -4) p.x += w + 8; else if (p.x > w + 4) p.x -= w + 8;
        if (p.y < -4) p.y += h + 8; else if (p.y > h + 4) p.y -= h + 8;
      }
      s.F.L.gath += (gL - s.F.L.gath) * Math.min(1, dt * 3);
      s.F.R.gath += (gR - s.F.R.gath) * Math.min(1, dt * 3);

      // ---- ignition: armed flames light on the beat -----------------------
      if (newBeat && bt >= 0) {
        for (const side of SIDES) {
          const f = s.F[side];
          if (!f.arm) continue;
          const star = { x: f.x, y: f.y, side, born: t, tw: P.rand() * TAU, r: s.unit * (1.1 + clamp(f.gath / 60) * 0.9), rung: f.rung, a: 0 };
          const prev = s.stars.filter(q => q.side === side).slice(-1)[0];
          s.stars.push(star);
          if (prev) s.links.push({ a: prev, b: star, born: t, bridge: false });
          // both skies lit inside the same bar = a bridge
          const other = SIDES[side === 'L' ? 1 : 0];
          if (s.litBar[other] === bar) {
            const os = s.stars.filter(q => q.side === other).slice(-1)[0];
            if (os) { s.links.push({ a: os, b: star, born: t, bridge: true }); s.bridge = 1; s.events.push({ kind: 'bridge', t }); }
          }
          s.litBar[side] = bar;
          s.events.push({ kind: 'star', side, rung: f.rung, vol: clamp(f.gath / 60), x: f.x / w });
          // the gathered dust is released — the star takes its place
          for (const p of s.d) if (p.cap === (side === 'L' ? 0 : 1)) {
            const dx = p.x - f.x, dy = p.y - f.y, dd = Math.hypot(dx, dy) + 1;
            p.vx += dx / dd * 260; p.vy += dy / dd * 260;
          }
          f.cool = 3.0; f.still = 0; f.flash = 1; f.gath = 0;
          // a sky can only hold so much: the oldest star ascends
          if (s.stars.length > 26) {
            const old = s.stars.shift();
            s.links = s.links.filter(l => l.a !== old && l.b !== old);
          }
        }
      }
      s.bridge = Math.max(0, s.bridge - dt * 0.35);
      for (const st of s.stars) st.a = Math.min(1, st.a + dt * 0.6);
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000';
      g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const dust = sprite('dust', '150,170,220');
      const warm = sprite('warm', '255,150,70'), viol = sprite('viol', '175,120,255');
      const starS = sprite('star', '255,240,220');

      g.globalCompositeOperation = 'lighter';
      // (1) the dust — free dust is pale, gathered dust takes its flame's colour
      for (const p of s.d) {
        const sz = p.sz * s.unit * (p.cap < 0 ? 0.32 : 0.5);
        const spr = p.cap < 0 ? dust : p.cap === 0 ? warm : viol;
        g.globalAlpha = (p.cap < 0 ? 0.2 : 0.6) * bright;
        g.drawImage(spr, p.x - sz * 2, p.y - sz * 2, sz * 4, sz * 4);
      }
      // (2) the threads — thin, but lit, with a slow pulse of light travelling them
      g.globalAlpha = 1;
      for (const l of s.links) {
        const age = Math.min(1, (t - l.born) / 1.5);
        g.strokeStyle = l.bridge ? `rgba(255,235,200,${0.5 * age * bright})` : `rgba(190,200,255,${0.32 * age * bright})`;
        g.lineWidth = (l.bridge ? 1.8 : 1.3) * ms;
        g.beginPath(); g.moveTo(l.a.x, l.a.y); g.lineTo(l.b.x, l.b.y); g.stroke();
        // the pulse
        const u = ((t * 0.18 + l.born * 0.37) % 1 + 1) % 1;
        const px = l.a.x + (l.b.x - l.a.x) * u, py = l.a.y + (l.b.y - l.a.y) * u;
        const pr = s.unit * 0.9;
        g.globalAlpha = 0.5 * age * bright;
        g.drawImage(starS, px - pr, py - pr, pr * 2, pr * 2);
        g.globalAlpha = 1;
      }
      // (3) the stars — a glow, and a thin four-point flare
      for (const st of s.stars) {
        const tw = 0.8 + Math.sin(t * 1.7 + st.tw) * 0.2;
        const r = st.r * (2.2 + tw) * st.a;
        g.globalAlpha = (0.55 + 0.35 * tw) * st.a * bright;
        g.drawImage(st.side === 'L' ? warm : viol, st.x - r * 2, st.y - r * 2, r * 4, r * 4);
        g.globalAlpha = 0.9 * st.a * bright;
        g.drawImage(starS, st.x - r, st.y - r, r * 2, r * 2);
        const fl = r * 3.2 * tw;
        g.strokeStyle = `rgba(255,245,230,${0.45 * st.a * bright})`;
        g.lineWidth = 1.1 * ms;
        g.beginPath(); g.moveTo(st.x - fl, st.y); g.lineTo(st.x + fl, st.y); g.moveTo(st.x, st.y - fl); g.lineTo(st.x, st.y + fl); g.stroke();
      }
      // (4) the flames — a stacked teardrop of glow, its charge ring closing as stillness accrues
      for (const side of SIDES) {
        const f = s.F[side];
        const spr = side === 'L' ? warm : viol;
        const base = s.unit * (2.6 + f.gath * 0.02) * (0.7 + s.pres * 0.3);
        for (let i = 0; i < 4; i++) {
          const fr = base * (1 - i * 0.18), fy = f.y - i * base * 0.55;
          const wob = 1 + Math.sin(t * 6 + i * 1.3 + (side === 'L' ? 0 : 2)) * 0.08;
          g.globalAlpha = (0.55 - i * 0.1) * bright;
          g.drawImage(spr, f.x - fr * wob * 2, fy - fr * 2, fr * wob * 4, fr * 4);
        }
        g.globalAlpha = (0.9 + f.flash) * bright;
        g.drawImage(starS, f.x - base * 0.6, f.y - base * 0.6, base * 1.2, base * 1.2);
        // the charge ring: thin, drawn as far round as the stillness has got
        if (f.charge > 0.02) {
          g.globalAlpha = 1;
          g.strokeStyle = side === 'L' ? `rgba(255,190,120,${0.55 * bright})` : `rgba(200,160,255,${0.55 * bright})`;
          g.lineWidth = 1.4 * ms;
          const rr = s.S * 0.13 * 0.5;
          g.beginPath(); g.arc(f.x, f.y, rr, -Math.PI / 2, -Math.PI / 2 + TAU * f.charge); g.stroke();
        }
        if (f.flash > 0) {
          g.globalAlpha = f.flash * 0.6 * bright;
          const rr = s.S * 0.13 * (1.4 - f.flash * 0.8);
          g.drawImage(starS, f.x - rr, f.y - rr, rr * 2, rr * 2);
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';

      g.fillStyle = 'rgba(200,200,230,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      const fL = s.F.L, fR = s.F.R;
      g.fillText('L ' + Math.round(fL.sm * 100) + ' rung ' + fL.rung + ' still ' + fL.still.toFixed(1) + 's gath ' + Math.round(fL.gath) +
        '   R ' + Math.round(fR.sm * 100) + ' rung ' + fR.rung + ' still ' + fR.still.toFixed(1) + 's gath ' + Math.round(fR.gath) +
        '   STARS ' + s.stars.length + '   THREADS ' + s.links.length + (s.pres < 0.3 ? '   · VIGIL UNKEPT' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      // the pedal: browser-side only — the pad channel is for placed notes
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.007, cutoff: 260, q: 0.6, midi: false });
      const place = glide => A.leadToChord(pad, -1, glide);
      place(0.05);
      // two flames, two continuous voices — each with its own breath of dust
      const flame = {};
      for (const side of SIDES) {
        const o = v.osc('triangle', 220), o2 = v.osc('sine', 220);
        const f = v.filter('lowpass', 500, 0.8), gg = v.g(0.0001);
        o.connect(f); o2.connect(f); f.connect(gg);
        const pn = A.pan(gg, side === 'L' ? -0.55 : 0.55); pn.connect(v.group);
        if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; gg.connect(sd); sd.connect(A.revIn); }
        const n = v.noise(), nf = v.filter('bandpass', 900, 1.4), ng = v.g(0.0001);
        n.connect(nf); nf.connect(ng); A.pan(ng, side === 'L' ? -0.5 : 0.5).connect(v.group);
        flame[side] = { o, o2, f, gg, nf, ng, rung: -1 };
      }
      const retune = (side, glide) => {
        const fl = flame[side], r = P.state.F[side].rung;
        const freq = H.chordTone(r, side === 'L' ? -1 : 0);
        A.set(fl.o.frequency, freq, glide); A.set(fl.o2.frequency, freq * 2.003, glide);
      };
      H.onChord(() => { place(0.18); SIDES.forEach(sd => retune(sd, 0.09)); });
      v.fadeIn(1, 1.5);

      let lastBar = -1, litStars = 0;
      return {
        tick(inp, dt) {
          const s = P.state, now = A.t();
          const gate = 0.3 + s.pres * 0.7;
          for (const side of SIDES) {
            const f = s.F[side], fl = flame[side];
            if (f.rung !== fl.rung) { fl.rung = f.rung; retune(side, 0.09); }   // step-and-glide: exact rungs only
            const lvl = (0.004 + f.sm * 0.006 + clamp(f.gath / 60) * 0.006) * gate;
            A.set(fl.gg.gain, lvl, 0.15);
            A.set(fl.f.frequency, 320 + f.sm * 900 + f.charge * 400, 0.12);
            A.set(fl.ng.gain, (0.002 + clamp(f.gath / 60) * 0.012) * gate, 0.2);
            A.set(fl.nf.frequency, 600 + clamp(f.gath / 60) * 2400, 0.2);
          }
          pad.forEach(p => p.level(0.006 + s.bridge * 0.004, 0.5));
          // events queued by step(): stars and bridges
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'star') {
              const oct = e.side === 'L' ? 0 : 1;
              A.bell(H.chordTone(e.rung, oct), { vol: (0.035 + e.vol * 0.05) * gate, dur: 3.2, pan: e.x * 2 - 1, rev: 0.75 });
              litStars = Math.min(1, litStars + 0.15);
            } else if (e.kind === 'bridge') {
              A.bassNote(H.chordTone(0, -2), { vol: 0.09 * gate, dur: 3.5, rev: 0.3 });
              for (let i = 0; i < 4; i++) {
                const fq = H.chordTone(i, -1);
                A.tone(fq, { at: now + 0.08 * i, vol: 0.012 * gate, dur: 2.6, attack: 0.25, type: 'triangle', rev: 0.8, role: 'pad', pan: (i - 1.5) * 0.3 });
              }
            }
          }
          litStars = Math.max(0, litStars - dt * 0.08);
          if (typeof MOut !== 'undefined' && MOut.expr) {
            MOut.expr('texture', clamp((s.F.L.gath + s.F.R.gath) / 100));
            MOut.expr('bells', clamp(s.stars.length / 20));
          }
          const bar = T.running ? T.bar() : -1;
          if (bar !== lastBar) lastBar = bar;
        },
        stop() { v.kill(); }
      };
    }
  });
})();
