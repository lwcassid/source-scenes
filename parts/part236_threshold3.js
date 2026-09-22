/* ---------- SRC-51.3 · THRESHOLD V3 (the organ assembles) ----------
   V2's picture given depth and V2's sound given a musical idea (Lance:
   "the soundscapes need to not suck"). The chord ASSEMBLES as the door
   opens — one voice, two, five, rolled in low to high like an organist
   adding stops — and TEMPERATURE reshapes the harmony: cold is bare
   fifths and suspensions, hot is ninths and thirteenths. The top voice
   moves stepwise on every chord change. Moving the door breathes. */
(() => {
  const SPR = {};
  function sprite(key, rgb) {
    if (SPR[key]) return SPR[key];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.3, `rgba(${rgb},0.5)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (SPR[key] = c);
  }
  const mix = (a, b, u) => a + (b - a) * u;
  const TEMP = [[255, 110, 40], [255, 205, 120], [150, 190, 255]];
  const tempRGB = tp => {
    const u = clamp(tp) * 2, i = Math.min(1, Math.floor(u)), f = u - i;
    const a = TEMP[i], b = TEMP[Math.min(2, i + 1)];
    return [mix(a[0], b[0], f) | 0, mix(a[1], b[1], f) | 0, mix(a[2], b[2], f) | 0];
  };
  // the harmony has two faces per chord: COLD (fifths, sus) and HOT (extensions);
  // temperature crossfades which voices sound. Voice order = the order they enter.
  const COLD = [[0, 7, 12, 19, 24], [0, 7, 12, 17, 24], [0, 5, 12, 19, 24], [0, 7, 12, 19, 26]];
  const HOT  = [[0, 7, 14, 17, 24], [0, 7, 15, 21, 26], [0, 8, 15, 19, 24], [0, 5, 14, 19, 22]];

  reg({
    id: 'SRC-51.3', family: 'SRC-51', ver: 3, title: 'Threshold', tech: 'CURTAIN OF STRANDS / THE ORGAN ASSEMBLES',
    music: {
      bpm: 60, root: 50, mode: 'dorian', chordBars: 4,
      chords: HOT,
      chordNames: ['Dm11', 'Dm13', 'B♭maj7/D', 'Dm7sus']
    },
    fx: { bloom: 0.6 },
    tags: ['TEMPLE SET', 'R OPENS THE GATE', 'L RESHAPES THE CHORD', 'THE ORGAN ASSEMBLES'],
    desc: 'A wall of light, closed: two depths of hanging strands filling the frame, light running slowly up them, dark between, a rumour of something bright behind. The right hand parts them from the centre and the field behind floods in — a radiant ground, motes rising through it, slow rays turning — until at full reach the curtain is gone. The sound is the same door, and it is an organ: closed is a sub and one low voice; as the gate opens the chord assembles, voice by voice, rolled in low to high, until five are singing with the filter wide. Nothing to unlock. You are the gate.',
    interact: 'R = OPEN. Lean in and the curtain parts — continuously, exactly as far as your hand — and the organ adds a voice for every fifth of the way: one, two, three, four, five, each entering with a soft roll. Drift back and they leave in reverse. Moving the door at any speed breathes: a rush of air proportional to how fast you move it. L = TEMPERATURE. The light behind runs ember → gold → blue-white, and the HARMONY changes with it: cold is bare — fifths and suspensions, a cathedral at dawn; hot brings in the ninths and thirteenths and a high shimmer. The chord itself moves every four bars with its top voice stepping, so a held gate still has a tune.',
    sound: 'D dorian, four-bar chords with a stepwise top line. FIVE organ voices (triangle+sine pairs, browser-side; the rack gets the same five as a rolled pad chord on every change, and the currently-sounding voice count as pad CC74): voice k sounds once the door is past k/5, rolled in over ~0.5 s low to high. Each voice has two pitch targets per chord — COLD (fifths/sus) and HOT (extensions) — and temperature crossfades them, stepped-and-glided so the chord never parks between tones. Sub root on bass with a slow breathing LFO. The door\'s SPEED is a noise breath (MIDI role: texture, CC74 = door speed). Past 60% open, temperature-gated shimmer bells every 2–5 s on their own clock (bells). No drums.',

    init(P) {
      const as = areaScale(P), w = P.w, h = P.h;
      const N = Math.min(170, Math.round(80 * Math.sqrt(as)));
      const strands = [];
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N + (P.rand() - 0.5) * 0.4 / N;
        strands.push({ u, far: P.rand() < 0.45, br: 0.25 + Math.pow(P.rand(), 2.5) * 0.75, ph: P.rand() * TAU, sw: 0.7 + P.rand() * 0.6, wd: 0.7 + P.rand() * 0.8, top: P.rand() * 0.25, bot: 0.75 + P.rand() * 0.25, run: P.rand() });
      }
      const M = Math.min(900, Math.round(280 * as));
      const motes = [];
      for (let i = 0; i < M; i++) motes.push({ x: P.rand() * w, y: P.rand() * h, s: 0.4 + P.rand() * 1.2, ph: P.rand() * TAU });
      P.state = { strands, motes, pres: 0, open: 0, temp: 0, drift: 0, bellT: 2, events: [], vel: 0, rays: 0 };
    },

    step(P, dt, t, inp) {
      const s = P.state, w = P.w, h = P.h;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleO = 0.08 + Math.max(0, Math.sin(s.drift * 0.09)) * 0.14, idleT = 0.3 + Math.sin(s.drift * 0.05) * 0.15;
      const prev = s.open;
      s.open += ((clamp(inp.R) * s.pres + idleO * (1 - s.pres)) - s.open) * Math.min(1, dt * 7);
      s.temp += ((clamp(inp.L) * s.pres + idleT * (1 - s.pres)) - s.temp) * Math.min(1, dt * 5);
      // the door's speed — the breath
      s.vel += (Math.abs(s.open - prev) / Math.max(dt, 1e-3) - s.vel) * Math.min(1, dt * 5);
      s.rays += dt * (0.03 + s.temp * 0.04);
      const rise = 12 + s.temp * 90 + s.open * 40;
      for (const m of s.motes) {
        m.y -= rise * m.s * dt;
        m.x += Math.sin(s.drift * 0.6 + m.ph) * 14 * dt;
        if (m.y < -10) { m.y = h + 10; m.x = P.rand() * w; }
      }
      if (s.open > 0.6 && s.pres > 0.3) {
        s.bellT -= dt * (0.6 + s.open) * (0.3 + s.temp);
        if (s.bellT <= 0) { s.events.push({ kind: 'shimmer', open: s.open, temp: s.temp }); s.bellT = 2 + P.rand() * 3; }
      }
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      const bright = 0.55 + s.pres * 0.45;
      const O = s.open, [r, gg, b] = tempRGB(s.temp);
      const cx = w / 2;
      const lit = Math.pow(O, 1.2);
      g.globalCompositeOperation = 'lighter';
      // (1) the field behind the gate
      const R0 = Math.max(w, h) * 0.75;
      const gr = g.createRadialGradient(cx, h * 0.45, 0, cx, h * 0.45, R0);
      gr.addColorStop(0, `rgba(${r},${gg},${b},${(0.02 + lit * 0.42) * bright})`);
      gr.addColorStop(0.45, `rgba(${r},${gg},${b},${(0.005 + lit * 0.14) * bright})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      // (2) rays: a few wide wedges turning slowly, only once the gate is well open
      if (lit > 0.05) {
        g.save(); g.translate(cx, h * 0.45);
        for (let i = 0; i < 7; i++) {
          const a0 = s.rays + i * (TAU / 7), wd = 0.12 + Math.sin(s.drift * 0.2 + i) * 0.04;
          const rg = g.createLinearGradient(0, 0, Math.cos(a0) * R0, Math.sin(a0) * R0);
          rg.addColorStop(0, `rgba(${r},${gg},${b},${lit * 0.06 * bright})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = rg;
          g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R0, a0 - wd, a0 + wd); g.closePath(); g.fill();
        }
        g.restore();
      }
      const mote = sprite('mote', `${Math.min(255, r + 30)},${Math.min(255, gg + 30)},${Math.min(255, b + 30)}`);
      for (const m of s.motes) {
        const sz = (2 + m.s * 3) * ms;
        g.globalAlpha = (0.02 + lit * 0.4) * m.s * bright;
        g.drawImage(mote, m.x - sz, m.y - sz, sz * 2, sz * 2);
      }
      g.globalAlpha = 1;
      // (3) the curtain — far strands first (dimmer, thinner), near strands over them
      const spread = O * w * 0.62;
      for (const pass of [true, false]) for (const st of s.strands) {
        if (st.far !== pass) continue;
        const side = st.u < 0.5 ? -1 : 1;
        const d = Math.abs(st.u - 0.5) * 2;
        const push = spread * Math.pow(1 - d, 0.55) * side * (st.far ? 0.85 : 1);
        const x = st.u * w + push + Math.sin(t * 0.5 * st.sw + st.ph) * 6 * ms;
        if (x < -20 || x > w + 20) continue;
        const shimmer = 0.75 + Math.sin(t * 1.3 * st.sw + st.ph * 2) * 0.25;
        const a = st.br * shimmer * (0.22 + O * 0.5) * (1 - O * 0.55) * bright * (st.far ? 0.45 : 1);
        const wd = (1.6 + st.wd * 1.6) * ms * (1 - O * 0.4) * (st.far ? 0.7 : 1);
        // light RUNS up the strand: a bright knot travelling from bottom to top
        const run = ((st.run + t * 0.05 * st.sw) % 1 + 1) % 1;
        const lg = g.createLinearGradient(0, 0, 0, h);
        lg.addColorStop(0, 'rgba(0,0,0,0)');
        lg.addColorStop(st.top, `rgba(235,238,255,${a * 0.8})`);
        lg.addColorStop(clamp(1 - run, 0.01, 0.99), `rgba(255,252,245,${a * 1.6})`);
        lg.addColorStop(st.bot, `rgba(235,238,255,${a * 0.8})`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = lg;
        g.fillRect(x - wd / 2, 0, wd, h);
        if (!st.far && d < 0.12 && O > 0.03) {
          const lk = g.createLinearGradient(x - 40 * ms * side, 0, x, 0);
          lk.addColorStop(0, 'rgba(0,0,0,0)'); lk.addColorStop(1, `rgba(${r},${gg},${b},${O * 0.5 * (1 - d / 0.12) * bright})`);
          g.fillStyle = lk; g.fillRect(Math.min(x, x - 40 * ms * side), 0, 40 * ms, h);
        }
      }
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(230,225,220,0.8)';
      g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
      g.fillText('OPEN ' + Math.round(O * 100) + '%  voices ' + Math.min(5, Math.floor(O * 5 + 0.2)) + '   TEMP ' + Math.round(s.temp * 100) + (s.temp < 0.5 ? ' cold' : ' hot') + '   DOOR SPEED ' + s.vel.toFixed(2) + (s.pres < 0.3 ? '   · CLOSED, BREATHING' : ''), 10, h - 10);
    },

    audio(A, P) {
      const v = A.voice();
      const sub = v.osc('sine', 55), sg = v.g(0.03); sub.connect(sg); sg.connect(v.group);
      const lfo = v.osc('sine', 0.09), lg = v.g(0.008); lfo.connect(lg); lg.connect(sg.gain);   // the sub breathes
      // five organ voices, each a triangle+sine pair through its own filter
      const voices = [];
      for (let i = 0; i < 5; i++) {
        const o = v.osc('triangle', 220), o2 = v.osc('sine', 220), f = v.filter('lowpass', 300, 0.8), gg = v.g(0.0001);
        o2.detune.value = (i % 2 ? 4 : -4); o.connect(f); o2.connect(f); f.connect(gg);
        A.pan(gg, (i - 2) * 0.3).connect(v.group);
        if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.7; gg.connect(sd); sd.connect(A.revIn); }
        voices.push({ o, o2, f, gg, on: false, target: 0 });
      }
      // the breath: noise whose level is the door's speed
      const nz = v.noise(), nf = v.filter('bandpass', 800, 0.9), ng = v.g(0.0001); nz.connect(nf); nf.connect(ng); ng.connect(v.group);
      let hot = -1;
      const tune = gl => {
        const s = P.state;
        const ci = H.step || 0;                                     // prog is the identity cycle: step IS the chord index
        const face = s.temp < 0.5 ? COLD : HOT;                     // stepped: the chord never parks between tones
        const semis = face[ci % face.length];
        voices.forEach((vc, i) => { const f = mtof(H.root + semis[i] - 12); A.set(vc.o.frequency, f, gl); A.set(vc.o2.frequency, f, gl); });
        A.set(sub.frequency, H.rootFreq(-2), gl);
      };
      const strike = () => {   // the rack gets the assembled chord, rolled, at the voices' real loudness
        const s = P.state, now = A.t(), n = Math.min(5, Math.floor(s.open * 5 + 0.2));
        const semis = (s.temp < 0.5 ? COLD : HOT)[(H.step || 0) % 4];
        for (let i = 0; i < n; i++) A.tone(mtof(H.root + semis[i] - 12), { at: now + 0.09 * i, vol: 0.0001, dur: 4, attack: 0.6, type: 'sine', rev: 0, role: 'pad' });
      };
      H.onChord(() => { tune(0.14); strike(); });
      tune(0.05);
      v.fadeIn(1, 1.5);
      return {
        tick(inp, dt) {
          const s = P.state;
          const gate = 0.3 + s.pres * 0.7, O = s.open, Tm = s.temp;
          const face = Tm < 0.5 ? 0 : 1;
          if (face !== hot) { hot = face; tune(0.12); }
          // the door adds a voice per fifth; entrances roll low to high, exits reverse
          const n = Math.min(5, Math.floor(O * 5 + 0.2));
          voices.forEach((vc, i) => {
            const want = i < n;
            if (want !== vc.on) { vc.on = want; vc.target = want ? 1 : 0; }
            const lvl = (0.004 + O * 0.006) * (i === 4 ? 0.7 : 1) * gate;
            A.set(vc.gg.gain, vc.on ? lvl : 0.0001, vc.on ? 0.35 + i * 0.12 : 0.6 - i * 0.08);
            A.set(vc.f.frequency, 220 + O * 2200 + Tm * 600 + i * 80, 0.25);
            try { vc.f.Q.setTargetAtTime(0.7 + Tm * 2.5, A.t(), 0.25); } catch (e) {}
          });
          A.set(sg.gain, (0.025 + O * 0.025) * gate, 0.2);
          A.set(ng.gain, clamp(s.vel * 0.02) * gate, 0.08); A.set(nf.frequency, 500 + O * 1500, 0.15);
          while (s.events.length) {
            const e = s.events.shift();
            if (e.kind === 'shimmer') A.bell(H.chordTone(2 + Math.floor(e.temp * 4), 2), { vol: (0.012 + e.open * 0.03) * gate, dur: 3, rev: 0.85, pan: (P.rand() - 0.5) * 1.2 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('pad', n / 5); MOut.expr('texture', clamp(s.vel)); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
