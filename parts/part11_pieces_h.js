/* ============================================================
   SRC-31 · THE RIFT — pry spacetime open, let the light out
   ============================================================ */
reg({
  id: 'SRC-31', title: 'The Rift', tech: 'TEAR MECHANIC / TWO-HANDED PRY',
  music: { bpm: 84, root: 46, mode: 'phrygian', prog: [0, 1, 0, 3], chordBars: 2 },
  fx: { bloom: 0.7, edge: true },
  tags: ['COOPERATIVE PRY', 'TEAR RESISTANCE', 'LIGHT ESCAPING', 'BREAKTHROUGH'],
  desc: 'A scar hangs in the dark above the sphere — a seam in the room, barely breathing, humming at the bottom of hearing. It takes BOTH hands to open: each hand grips one lip of the tear, and reality resists. Pull, and tension builds... builds... then RIPS wider in a jolt of crimson tendrils. Inside is another place: a core of blinding iridescent light, swirling, spilling particles and god-rays out into the volume. Pry it to its limit and you break through — the whole rift blazes, the music tears open with it, and everything on the other side pours in. Let go, and the wound breathes slowly closed.',
  interact: 'L and R pry their lips of the rift — BOTH must pull; one hand alone only strains the seam. Opening is stepped, like tearing heavy fabric: resistance, then a rip, then resistance again. Asymmetric hands tilt the tear. Above 90% aperture: breakthrough. This is the cooperation piece — two strangers who have never met can open it together.',
  sound: 'Closed: sub drone (root, two octaves down) + whispering filtered noise — the other side, muffled. Every RIP: a fabric-crack transient + bell shard + bass jolt. Opening: pads swell and brighten with aperture (map pad CC74 to a big filter + reverb size — the room opens WITH the rift), shimmer voices an octave up fade in, and past 70% a sparkling 16th arp spills out like the light. Breakthrough: a long note on the texture channel — your Blade Runner vocal chops, pitched to key, arriving from the other side — plus a bell cascade. Phrygian outside, radiant inside.',
  init(P) {
    P.state = {
      ap: 0.04, tension: 0, tilt: 0, hue: 180,
      rips: [], sparks: [], rays: P.rand() * TAU,
      broke: false, flash: 0, wobble: P.rand() * 100
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // both hands required: min gates the pry, sum shapes it
    const desired = clamp(Math.min(inp.L, inp.R) * 0.7 + ((inp.L + inp.R) / 2) * 0.3);
    s.tilt += (((inp.R - inp.L)) * 0.22 - s.tilt) * Math.min(1, dt * 2);
    if (desired > s.ap) {
      s.tension += (desired - s.ap) * dt * 2.2;
      if (s.tension > 0.075) {
        // RIP — the tear jumps wider
        const jump = Math.min(desired - s.ap, 0.09 + s.tension * 0.5);
        s.ap += jump;
        s.tension = 0;
        s.flash = Math.min(1, 0.4 + jump * 4);
        // crimson tendrils from the lips
        for (let k = 0; k < 5; k++) {
          const sgn = k % 2 ? 1 : -1, sy = (P.rand() * 2 - 1);
          s.rips.push({ sgn, sy, seed: P.rand() * 100, life: 1 });
        }
        const vol = 0.1 + jump * 1.2;
        P.ping(A => {
          A.hit({ vol: Math.min(0.3, vol), dur: 0.14, freq: 2800, q: 0.6 });
          A.hit({ vol: Math.min(0.25, vol * 0.8), dur: 0.3, freq: 160, q: 0.7, type: 'lowpass' });
          A.bell(H.chordTone(7 + ((Math.random() * 3) | 0), 1), { at: A.q(), vol: 0.08, dur: 2.5, rev: 0.7 });
          A.bassNote(H.rootFreq(-2), { vol: 0.16, dur: 0.8 });
        });
      }
    } else {
      s.tension *= Math.pow(0.1, dt);
      s.ap += (desired - s.ap) * Math.min(1, dt * 1.1); // breathes closed
    }
    s.ap = clamp(s.ap, 0.03, 1);
    // breakthrough
    if (s.ap > 0.9 && !s.broke) {
      s.broke = true; s.flash = 1;
      P.ping(A => {
        MOut.evNote('texture', H.chordTone(2, 0), 0.55, 0, 4); // the other side speaks
        for (let k = 0; k < 5; k++) A.bell(H.chordTone(4 + k * 2, 1), { at: A.q() + k * 0.09, vol: 0.07, dur: 4, rev: 0.85 });
        A.bassNote(H.rootFreq(-2), { vol: 0.24, dur: 3 });
      });
    }
    if (s.ap < 0.6) s.broke = false;
    s.flash *= Math.pow(0.02, dt);
    s.hue = (s.hue + dt * (12 + s.ap * 70)) % 360;
    s.rays += dt * (0.1 + s.ap * 0.5);
    for (const r of s.rips) r.life -= dt * 2.4;
    s.rips = s.rips.filter(r => r.life > 0);
    // escaping light
    const m = Math.min(P.w, P.h);
    const rate = s.ap * s.ap * 60;
    if (P.rand() < rate * dt) {
      const sy = P.rand() * 2 - 1;
      const sgn = P.rand() < 0.5 ? -1 : 1;
      s.sparks.push({
        sy, sgn, d: 0, sp: (40 + P.rand() * 90) / m,
        hue: s.hue + P.rand() * 60, life: 1, drift: (P.rand() - 0.5) * 0.3
      });
    }
    for (const sp of s.sparks) { sp.d += sp.sp * dt * 60; sp.life -= dt * 0.55; }
    s.sparks = s.sparks.filter(sp => sp.life > 0);
  },
  _lip(s, sy, sgn, m, t) {
    // rift outline point: almond with organic wobble
    const Hh = m * (0.1 + s.ap * 0.34);
    const Wd = (m * 0.012 + Hh * s.ap * 0.42);
    const edge = Math.pow(Math.max(0, 1 - sy * sy), 0.62);
    const wob = Math.sin(sy * 11 + t * 2.1 + s.wobble) * 0.12 + Math.sin(sy * 23 - t * 3.3) * 0.06;
    return { x: sgn * Wd * edge * (1 + wob), y: sy * Hh };
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(3,2,5,0.42)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, m = Math.min(w, h);
    g.save();
    g.translate(cx, cy); g.rotate(s.tilt);
    // escaping god-rays
    if (s.ap > 0.12) {
      g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) {
        const a = s.rays + k / 7 * TAU;
        const len = m * (0.2 + s.ap * 0.55) * (0.7 + 0.3 * Math.sin(t * 0.9 + k * 2));
        const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        gr.addColorStop(0, `hsla(${s.hue + k * 12},90%,80%,${s.ap * 0.22})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.strokeStyle = gr;
        g.lineWidth = 10 + s.ap * 26;
        g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * len, Math.sin(a) * len); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    }
    // build the tear path
    const NPT = 36;
    const left = [], right = [];
    for (let i = 0; i <= NPT; i++) {
      const sy = -1 + (i / NPT) * 2;
      left.push(this._lip(s, sy, -1, m, t));
      right.push(this._lip(s, sy, 1, m, t));
    }
    // interior — the other side
    g.save();
    g.beginPath();
    g.moveTo(left[0].x, left[0].y);
    for (const p of left) g.lineTo(p.x, p.y);
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i].x, right[i].y);
    g.closePath();
    g.clip();
    const core = g.createRadialGradient(0, 0, 1, 0, 0, m * (0.1 + s.ap * 0.36));
    core.addColorStop(0, `hsla(${s.hue + 40},50%,${88 + s.flash * 12}%,1)`);
    core.addColorStop(0.4, `hsla(${s.hue},95%,${64 + s.ap * 16}%,0.95)`);
    core.addColorStop(1, `hsla(${s.hue - 50},90%,40%,0.85)`);
    g.fillStyle = core;
    g.fillRect(-m / 2, -m / 2, m, m);
    // swirl streaks inside
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 9; k++) {
      const a0 = t * (0.6 + k * 0.07) + k * 2.3;
      const rr = m * (0.02 + (k / 9) * 0.13) * (0.4 + s.ap);
      g.strokeStyle = `hsla(${s.hue + 80 + k * 14},95%,80%,${0.25 + s.ap * 0.3})`;
      g.lineWidth = 2;
      g.beginPath(); g.arc(0, 0, rr, a0, a0 + 2.2); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();
    // the lips — crimson, alive
    for (const pts of [left, right]) {
      g.strokeStyle = `hsla(8,85%,${38 + s.ap * 22 + s.flash * 30}%,0.95)`;
      g.lineWidth = 2.5 + s.ap * 2.5;
      g.shadowColor = '#ff3820'; g.shadowBlur = 14 + s.flash * 26;
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (const p of pts) g.lineTo(p.x, p.y);
      g.stroke();
      g.shadowBlur = 0;
    }
    // rip tendrils
    for (const r of s.rips) {
      const lip = this._lip(s, r.sy, r.sgn, m, t);
      g.strokeStyle = `hsla(12,95%,60%,${r.life})`;
      g.lineWidth = 1.8;
      g.shadowColor = '#ff5030'; g.shadowBlur = 10 * r.life;
      g.beginPath();
      let x = lip.x, y = lip.y;
      g.moveTo(x, y);
      for (let seg = 0; seg < 4; seg++) {
        x += r.sgn * (6 + Math.sin(r.seed + seg * 7) * 9) * (1 + s.ap);
        y += Math.cos(r.seed * 3 + seg * 5) * 12;
        g.lineTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
    }
    // escaping sparks
    g.globalCompositeOperation = 'lighter';
    for (const sp of s.sparks) {
      const lip = this._lip(s, sp.sy, sp.sgn, m, t);
      const x = lip.x + sp.sgn * sp.d * (1 + Math.abs(sp.drift)) ;
      const y = lip.y + sp.drift * sp.d * 0.8;
      g.fillStyle = `hsla(${sp.hue},95%,78%,${sp.life * 0.85})`;
      g.fillRect(x, y, 2.2, 2.2);
      g.fillStyle = `hsla(${sp.hue},95%,70%,${sp.life * 0.3})`;
      g.fillRect(x - sp.sgn * 4, y, 3.5, 1.2);
    }
    g.globalCompositeOperation = 'source-over';
    g.restore();
    // tension gauge — you can SEE the fabric straining before the rip
    if (s.tension > 0.012) {
      g.strokeStyle = `rgba(255,90,60,${Math.min(1, s.tension * 9)})`;
      g.lineWidth = 1.2;
      const th = m * (0.12 + s.ap * 0.36);
      g.setLineDash([3, 6]);
      g.beginPath(); g.moveTo(cx, cy - th - 26); g.lineTo(cx, cy - th - 8); g.stroke();
      g.beginPath(); g.moveTo(cx, cy + th + 8); g.lineTo(cx, cy + th + 26); g.stroke();
      g.setLineDash([]);
    }
    if (s.flash > 0.02) {
      g.fillStyle = `rgba(255,250,240,${s.flash * 0.22})`;
      g.fillRect(0, 0, w, h);
    }
    g.fillStyle = 'rgba(230,170,160,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('APERTURE ' + Math.round(s.ap * 100) + '%  TENSION ' + Math.round(s.tension * 1200) + (s.broke ? '  ◆ BREAKTHROUGH' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const sub = v.osc('sine', H.rootFreq(-3)), sub2 = v.osc('sine', H.rootFreq(-2) + 0.6);
    const sg = v.g(0.09);
    sub.connect(sg); sub2.connect(sg); sg.connect(v.group);
    H.onChord(() => { A.set(sub.frequency, H.rootFreq(-3), 1.4); A.set(sub2.frequency, H.rootFreq(-2) + 0.6, 1.4); });
    const whis = v.noise();
    const wf = v.filter('bandpass', 900, 2.2);
    const wg = v.g(0.03);
    whis.connect(wf); wf.connect(wg); wg.connect(v.group);
    const pads = A.padVoices(v, 4, { type: 'sawtooth', gain: 0.008, cutoff: 260, q: 0.6 });
    A.leadToChord(pads, -1, 0.05);
    const shim = A.padVoices(v, 2, { type: 'triangle', gain: 0.0001, cutoff: 2600 });
    const setShim = () => { shim[0].set(H.chordTone(4, 1), 1.2); shim[1].set(H.chordTone(6, 1), 1.5); };
    setShim();
    H.onChord(() => { A.leadToChord(pads, -1, 1.2); setShim(); });
    let next16 = T.next(0.25), st16 = 0;
    v.fadeIn(1, 1.2);
    return {
      tick(inp) {
        const s = P.state, ap = s.ap;
        A.set(sg.gain, 0.06 + ap * 0.07, 0.3);
        A.set(wg.gain, 0.012 + (1 - ap) * 0.022 + ap * 0.01, 0.3);
        A.set(wf.frequency, 700 + ap * 2600, 0.3);
        pads.forEach(p => { p.level(0.012 + ap * 0.05, 0.3); p.bright(250 + ap * 3200, 0.3); });
        shim.forEach(p => p.level(ap * ap * 0.04, 0.4));
        MOut.expr('pad', ap);
        // wide open: the light arpeggiates out
        const horizon = AE.t() + 0.15;
        while (next16 < horizon) {
          const st = st16 % 16;
          const sw = st % 2 === 1 ? T.beat * 0.07 : 0;
          if (ap > 0.68 && st % 2 === 0) {
            const f = H.chordTone([0, 4, 2, 6, 4, 8, 6, 9][(st >> 1) % 8], 1);
            A.tone(f, { at: next16 + sw, vol: 0.035 + (ap - 0.68) * 0.14, dur: 0.3, type: 'triangle', rev: 0.5, del: 0.3 });
          }
          st16++; next16 += T.beat * 0.25;
        }
        if (next16 < AE.t()) next16 = T.next(0.25);
      },
      stop() { v.kill(); }
    };
  }
});
