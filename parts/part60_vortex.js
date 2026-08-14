/* ---------- SRC-40 · VORTEX CHOIR (arms singing through the light) ---------- */
reg({
  id: 'SRC-40', family: 'SRC-40', ver: 1, title: 'Vortex Choir', tech: 'SHEARED SPIRAL / BEAM CHOIR',
  music: {
    bpm: 84, root: 46, mode: 'dorian', chordBars: 2,
    chords: [
      [0, 7, 15, 19, 22],   // B♭m7
      [0, 7, 14, 15, 21],   // B♭m13     — the C and the D♭ rubbing
      [0, 5, 12, 15, 22],   // E♭m11/B♭
      [0, 8, 15, 20, 24]    // G♭/B♭     — the widest breath
    ],
    chordNames: ['B♭m7', 'B♭m13', 'E♭m11/B♭', 'G♭/B♭']
  },
  fx: { bloom: 0.66 },
  tags: ['FIVE NESTED RINGS', 'ARMS SING WHEN THEY PASS THE LIGHT', 'RESONANT GEARS — ALWAYS ON THE GRID', 'RED HEAT'],
  desc: 'A whirlpool of red brush strokes in five nested rings, each ring turning at its own speed. There is a shaft of light standing at the top of the frame, and an arm sings for exactly as long as it is inside that light — so the picture is a choir walking past a microphone, over and over, in five different meters at once. The rings are geared to each other the way moons are: whatever speed you choose, every arm arrives on the grid, and the five parts phase against each other forever without ever falling out of time.',
  interact: 'R = SPIN, in four gears — a stately turn where the outer ring sings once every three bars, up to a full carousel with all five rings overlapping. The gears are locked to the transport, so the phasing is always musical and never a mess. L = WIND. Drawn in, the arms are short radial strokes that flick through the light and are gone: staccato, one voice at a time. Reach out and the whole vortex winds up — the arms stretch into long trailing flames that lie along the direction of travel and take much longer to cross the beam, so the same gear turns into a smeared, overlapping legato with four or five voices sounding at once. Wind and spin together are the whole instrument: tight and fast is a hocket, wide and slow is a chord that takes a minute to build.',
  sound: 'A choir, not a sequencer. Each arm crossing the shaft of light gets a swelling three-oscillator voice (MIDI role: pad) whose LENGTH is exactly how long that arm stays lit — so winding the vortex out physically lengthens the notes and the texture goes from hocket to sustained chord in your hand. Pitch is by ring: the big slow outer ring is the bass end of the ladder, the small fast inner ring the top, so the fast parts are naturally the high ones. Each entrance is struck by a soft mallet (bells) at the moment the arm reaches the light. Underneath sits a bowed drone on the root and a wash of air that opens with spin. There is no drum kit here — the five rings ARE the polyrhythm. Ableton: pad ch2 (CC74 = wind), bells ch5, bass ch3, texture ch6.',

  init(P) {
    const bands = [];
    const N = [6, 7, 8, 9, 10];         // arms per ring
    const IV = [3, 2, 1.5, 1, 0.75];    // beats between crossings at gear 1
    const RF = [0.94, 0.76, 0.58, 0.41, 0.25];
    for (let k = 0; k < 5; k++) {
      bands.push({ n: N[k], iv: IV[k], rf: RF[k], deg: (4 - k) * 2, ph: P.rand() * TAU });
    }
    for (const b of bands) { b.rot = P.rand() * TAU; b.arm = 0; b.lit = 0; b.dwell = 1; }
    P.state = { bands, pres: 0, gear: 1, gearIdx: 1, wind: 0, lit: 0, beamW: 0.3, evq: [] };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

    // R: four gears, all rational — the phasing can never drift off the grid
    const GEARS = [0.25, 0.5, 1, 1.5];
    const want = clamp(inp.R) * (GEARS.length - 0.001) | 0;
    if (want > s.gearIdx && inp.R > want / GEARS.length + 0.03) s.gearIdx = want;
    else if (want < s.gearIdx && inp.R < (want + 1) / GEARS.length - 0.03) s.gearIdx = want;
    s.gear = GEARS[s.gearIdx];

    s.wind += (clamp(inp.L) - s.wind) * Math.min(1, dt * 6);
    // WIND is dwell: a long trailing arm takes much longer to leave the light
    s.beamW = 0.1 + s.wind * 0.42;
    const beatSec = (typeof T !== 'undefined' && T.beat) ? T.beat : 0.7;

    let lit = 0;
    for (const b of s.bands) {
      // one arm reaches the light every iv/gear beats, so the ring turns at
      // exactly TAU / (n · iv / gear) per beat — the five rings are geared
      const per = b.iv / Math.max(s.gear, 0.01) * beatSec;     // seconds between arms
      b.per = per;
      b.rot += dt / (per * b.n) * TAU;
      if (b.rot > TAU * 1e6) b.rot -= TAU * 1e6;
      b.dwell = 2 * s.beamW / TAU * b.n * per;                 // seconds inside the light
      let best = 0;
      const arm = (b.rot + Math.PI / 2) / (TAU / b.n);         // beam stands at 12 o'clock
      if (Math.floor(arm) !== Math.floor(b.arm)) s.evq.push(b);
      b.arm = arm;
      for (let j = 0; j < b.n; j++) {
        const a = b.rot + j * TAU / b.n + Math.PI / 2;
        const d = Math.atan2(Math.sin(a), Math.cos(a));
        const l = Math.exp(-(d * d) / (s.beamW * s.beamW));
        if (l > best) best = l;
      }
      b.lit = best;
      lit += best;
    }
    if (s.evq.length > 10) s.evq.splice(0, s.evq.length - 10);
    s.lit = lit / s.bands.length;
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#050103';
    g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.47;
    const bright = 0.5 + s.pres * 0.5;

    // the shaft of light the arms sing in
    g.globalCompositeOperation = 'lighter';
    const bg = g.createRadialGradient(cx, cy - R * 0.55, 0, cx, cy - R * 0.55, R * 0.9);
    bg.addColorStop(0, `rgba(255,240,220,${(0.06 + s.lit * 0.1) * bright})`);
    bg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = bg;
    g.beginPath(); g.arc(cx, cy - R * 0.55, R * 0.9, 0, TAU); g.fill();
    // the arms are PAINT — they lie over each other, they do not add up
    g.globalCompositeOperation = 'source-over';

    const SEGN = P.focused ? 12 : 7;
    const litAt = an => {
      const d = Math.atan2(Math.sin(an + Math.PI / 2), Math.cos(an + Math.PI / 2));
      return Math.exp(-(d * d) / (s.beamW * s.beamW));
    };
    for (let k = s.bands.length - 1; k >= 0; k--) {
      const b = s.bands[k];
      // each ring owns a radial zone; an arm is a spiral stroke that crosses
      // its whole zone, which is what makes the picture a whirlpool instead
      // of a flower
      const rIn = R * Math.max(0.06, b.rf - 0.12), rOut = R * (b.rf + 0.12);
      const wid = R * (0.03 + (1 - b.rf) * 0.022);
      const span = (0.45 + s.wind * 2.1) * (1.2 - b.rf * 0.4);
      for (let j = 0; j < b.n; j++) {
        const a0 = b.rot + j * TAU / b.n;
        const pts = [];
        for (let i = 0; i <= SEGN; i++) {
          const u = i / SEGN;
          const rr = rIn + (rOut - rIn) * u;
          const an = a0 + span * u;
          pts.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr,
            Math.pow(Math.sin(Math.PI * u), 0.5), an]);
        }
        // the light only touches the part of the arm actually inside it
        const l0 = litAt(a0), l1 = litAt(a0 + span * 0.5), l2 = litAt(a0 + span);
        const gr = g.createLinearGradient(pts[0][0], pts[0][1], pts[SEGN][0], pts[SEGN][1]);
        const col = l => {
          const side = clamp((Math.cos(a0 + span * 0.5 + Math.PI / 2) + 1) / 2);
          const hue = ((356 + side * 30) % 360);
          return `hsla(${hue},${94 - l * 40}%,${34 + l * 54}%,${(0.45 + l * 0.5) * bright})`;
        };
        gr.addColorStop(0, col(l0));
        gr.addColorStop(0.5, col(l1));
        gr.addColorStop(1, col(l2));
        g.beginPath();
        for (let i = 0; i <= SEGN; i++) {
          const [x, y, tp] = pts[i];
          const i2 = Math.min(SEGN, i + 1), i0 = Math.max(0, i - 1);
          const tx = pts[i2][0] - pts[i0][0], ty = pts[i2][1] - pts[i0][1];
          const tl = Math.hypot(tx, ty) || 1;
          const ox = -ty / tl * wid * tp, oy = tx / tl * wid * tp;
          i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy);
        }
        for (let i = SEGN; i >= 0; i--) {
          const [x, y, tp] = pts[i];
          const i2 = Math.min(SEGN, i + 1), i0 = Math.max(0, i - 1);
          const tx = pts[i2][0] - pts[i0][0], ty = pts[i2][1] - pts[i0][1];
          const tl = Math.hypot(tx, ty) || 1;
          g.lineTo(x + ty / tl * wid * tp, y - tx / tl * wid * tp);
        }
        g.closePath();
        g.fillStyle = gr;
        g.fill();
      }
    }
    // the eye of the whirlpool
    g.globalCompositeOperation = 'lighter';
    const eg = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.24);
    eg.addColorStop(0, `rgba(255,230,200,${(0.2 + s.lit * 0.3) * bright})`);
    eg.addColorStop(1, 'rgba(255,60,30,0)');
    g.fillStyle = eg;
    g.beginPath(); g.arc(cx, cy, R * 0.24, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over';

    g.fillStyle = 'rgba(255,170,120,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const GN = ['×1/4 · SOLEMN', '×1/2', '×1 · CAROUSEL', '×1½ · DRILL'];
    g.fillText('SPIN ' + GN[s.gearIdx] + '   WIND ' + Math.round(s.wind * 100) +
      '   VOICES LIT ' + s.bands.filter(b => b.lit > 0.25).length + '/5' +
      (s.pres < 0.3 ? '   · TURNING ALONE' : ''), 10, h - 10);
  },

  audio(A, P) {
    const v = A.voice();

    /* --- air in the funnel ---------------------------------------------- */
    const n = v.noise(), nf = v.filter('bandpass', 420, 1.1), ng = v.g(0.008);
    n.connect(nf); nf.connect(ng); ng.connect(v.group);

    /* --- the bowed drone on the root ------------------------------------ */
    const drone = A.padVoices(v, 2, { type: 'triangle', gain: 0.012, cutoff: 260, q: 0.8 });
    const place = glide => { drone[0].set(H.rootFreq(-2), glide); drone[1].set(H.chordTone(1, -1), glide); };
    place(0.05);
    H.onChord(() => place(0.18));
    v.fadeIn(1, 1.4);

    // one singer: three detuned bodies with a slow swell, the length of the light
    const sing = (freq, at, dur, pan, vol) => {
      A.tone(freq, { at, vol: vol * 0.7, dur, attack: Math.min(0.9, dur * 0.4), type: 'triangle', pan, rev: 0.66, del: 0.1, role: 'pad' });
      // the two supporting bodies are the same voice — they must not each
      // become their own note on the wire
      const sp = MOut.suspend; MOut.suspend = true;
      A.tone(freq * 1.004, { at: at + 0.02, vol: vol * 0.4, dur: dur * 0.9, attack: Math.min(0.9, dur * 0.45), type: 'triangle', pan: pan * 0.4, rev: 0.7 });
      A.tone(freq * 2.002, { at: at + 0.04, vol: vol * 0.12, dur: dur * 0.6, attack: Math.min(0.9, dur * 0.5), type: 'sine', pan: -pan * 0.5, rev: 0.7 });
      MOut.suspend = sp;
    };

    return {
      tick(inp, dt) {
        const s = P.state, now = A.t();
        const gate = 0.25 + s.pres * 0.75;

        A.set(ng.gain, (0.004 + s.gear * 0.004 + s.lit * 0.01) * gate, 0.3);
        A.set(nf.frequency, 300 + s.wind * 1200 + s.lit * 900, 0.3);
        drone.forEach(d => { d.level(0.008 + s.pres * 0.006, 0.5); d.bright(200 + s.wind * 500 + s.lit * 300, 0.4); });

        /* ---- an arm has reached the light: it sings for as long as it
           stays there. The rings are geared to the beat, so the sixteenth
           it lands on is the sixteenth it was always going to land on.   */
        let b, i = 0;
        while ((b = s.evq.shift()) && i < 4) {
          i++;
          const at = T.next(0.25);
          const dur = Math.max(0.2, Math.min(7, b.dwell));
          const k = s.bands.indexOf(b);
          const pan = (k % 2 ? 0.55 : -0.55) * (0.4 + s.wind * 0.6);
          const vol = (0.028 + s.wind * 0.022) * gate * (1 - k * 0.06);
          sing(H.chordTone(b.deg, b.deg > 5 ? 0 : -1), at, dur, pan, vol);
          // only the two big outer rings get a mallet — every ring struck
          // turns the choir into a music box
          if (k < 2) A.bell(H.chordTone(b.deg + 5, 1), { at, vol: vol * 0.42, dur: 1.8, pan: -pan, rev: 0.72 });
        }

        if (typeof MOut !== 'undefined' && MOut.expr) {
          MOut.expr('pad', s.wind);
          MOut.expr('texture', clamp(s.gear / 2));
          MOut.expr('bells', s.lit);
        }
      },
      stop() { v.kill(); }
    };
  }
});
