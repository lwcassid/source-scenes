/* ============================================================
   PIECES 24–27 — MIDI-FIRST + THE VOLUME PACK (part one)
   ============================================================ */

/* ---------- SRC-24 · PLAYER PIANO ---------- */
reg({
  id: 'SRC-24', title: 'Player Piano', tech: 'MIDI-FIRST / GENERATIVE PIANO',
  music: { bpm: 66, root: 48, mode: 'ionian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { bloom: 0.55, edge: true },
  tags: ['EXTERNAL INSTRUMENT', 'ENO WALK', 'SUSTAIN PEDAL', 'VERTICAL STRANDS'],
  desc: 'A piano with no pianist, built to play YOUR piano. Every note this scene generates streams out over MIDI channel 1 — point it at a real piano patch in Ableton and the browser sound becomes just a pencil sketch under the oil painting. The music is a patient Eno walk over the current chord: notes wander, cluster, rest; the sustain pedal breathes with the harmony; every chord change rolls gently through the new voicing. On screen, each note is a strand of vertical light — which in the volume becomes a curtain of falling note-beams around the source.',
  interact: 'L = density and reach — low is one note at a time with long silences, high is cascading runs across four octaves. R = tension — low keeps to pure chord tones, high invites 9ths, 11ths, 13ths and passing tones. Rest both hands and it settles into sparse, Satie-like patience. This is the scene for testing the Ableton pipeline: focus it, and if your piano track is armed you will hear it immediately.',
  sound: 'Ableton: your best piano on CH1 (felt/upright for intimacy, grand for the big room). The scene sends real sustain-pedal CC64 — repedaled at every chord change — so let the samples ring. Velocities are shaped 35–80 with occasional accents; map CC1/CC2 to nothing here, or to the piano\'s dynamics/room mic for hand-controlled intimacy. The internal WebAudio voice is deliberately plain — switch OUT to MIDI ONLY once the piano is up.',
  init(P) {
    P.state = { notes: [], lastAmb: 0, pedal: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // ambient visual life in gallery mode
    if (!P.focused && t - s.lastAmb > 1.1 - inp.L * 0.7) {
      s.lastAmb = t;
      s.notes.push({ midi: 48 + ((Math.random() * 24) | 0), vel: 50, born: t, dur: 2 });
    }
    s.notes = s.notes.filter(n => t - n.born < n.dur + 2.5);
    s.pedal *= Math.pow(0.5, dt);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,4,6,0.35)'; g.fillRect(0, 0, w, h);
    // floor line (the lid of the void-piano)
    const fy = h * 0.82;
    g.strokeStyle = 'rgba(200,180,150,0.25)';
    g.beginPath(); g.moveTo(w * 0.06, fy); g.lineTo(w * 0.94, fy); g.stroke();
    // pedal haze
    if (s.pedal > 0.03) {
      const gr = g.createLinearGradient(0, fy, 0, fy - h * 0.5);
      gr.addColorStop(0, `rgba(120,100,70,${s.pedal * 0.18})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, fy - h * 0.5, w, h * 0.5);
    }
    for (const n of s.notes) {
      const age = t - n.born;
      const x = w * (0.08 + ((n.midi - 34) / 54) * 0.84);
      const strike = Math.max(0, 1 - age * 2.2);
      const sustain = Math.max(0, 1 - age / (n.dur + 2));
      const bright = (0.35 + (n.vel / 127) * 0.65) * sustain + strike * 0.8;
      const topY = fy - h * (0.14 + ((n.midi - 34) / 54) * 0.58);
      const hue = 38 + (n.midi % 12) * 3;
      const gr = g.createLinearGradient(0, fy, 0, topY);
      gr.addColorStop(0, `hsla(${hue},85%,80%,${Math.min(1, bright)})`);
      gr.addColorStop(0.75, `hsla(${hue},80%,78%,${bright * 0.45})`);
      gr.addColorStop(1, `hsla(${hue},80%,85%,0)`);
      g.strokeStyle = gr;
      g.lineWidth = 2.4 + strike * 4 + (n.vel / 127) * 2;
      if (strike > 0.05) { g.shadowColor = `hsl(${hue},90%,75%)`; g.shadowBlur = 22 * strike; }
      g.beginPath(); g.moveTo(x, fy); g.lineTo(x, topY); g.stroke();
      g.shadowBlur = 0;
      // strike bead on the floor
      g.fillStyle = `hsla(${hue},85%,80%,${Math.max(strike, sustain * 0.3)})`;
      g.beginPath(); g.arc(x, fy, 1.6 + strike * 3.4, 0, TAU); g.fill();
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 2, { type: 'triangle', gain: 0.02, cutoff: 320 });
    A.leadToChord(pads, -1, 0.05);
    let walk = 3;                       // position on the chord ladder
    let next8 = T.next(0.5), step8 = 0;
    const pedal = () => {
      MOut.cc(1, 64, 0);
      setTimeout(() => MOut.cc(1, 64, 127), 30);
      P.state.pedal = 1;
    };
    pedal();
    H.onChord(() => {
      A.leadToChord(pads, -1);
      pedal();
      // gentle roll through the new chord
      for (let k = 0; k < 3; k++) {
        const f = H.chordTone(k * 2, -1);
        const at = AE.t() + 0.05 + k * 0.09;
        A.pluck2(f, { at, vol: 0.06, dur: 2.4, rev: 0.4 });
        P.state.notes.push({ midi: MOut.f2n(f), vel: 46, born: nowT, dur: 2.4 });
      }
    });
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const horizon = AE.t() + 0.15;
        while (next8 < horizon) {
          const density = 0.14 + inp.L * 0.62;
          if (Math.random() < density) {
            // Eno walk: drift along the ladder, range grows with L
            const range = 2 + Math.round(inp.L * 6);
            walk += [-2, -1, -1, 1, 1, 2, 3][(Math.random() * 7) | 0];
            walk = Math.max(-range, Math.min(range + 4, walk));
            let f;
            if (Math.random() < inp.R * 0.55) {
              // tension: extensions & passing tones from the scale
              f = H.scaleTone(H.prog[H.step] + [1, 3, 5, 8][(Math.random() * 4) | 0], walk > 3 ? 0 : -1);
            } else {
              f = H.chordTone(walk, -1);
            }
            const vel = 0.05 + Math.random() * 0.055 + (step8 % 8 === 0 ? 0.03 : 0);
            const dur = 1.2 + Math.random() * 1.6;
            A.pluck2(f, { at: next8, vol: vel, dur, rev: 0.35 });
            P.state.notes.push({ midi: MOut.f2n(f), vel: MOut.v2v(vel), born: nowT + (next8 - AE.t()), dur });
          }
          // occasional deep bass anchor
          if (step8 % 16 === 0) {
            const f = H.chordTone(0, -2);
            A.pluck2(f, { at: next8, vol: 0.08, dur: 3, rev: 0.3 });
            P.state.notes.push({ midi: MOut.f2n(f), vel: 60, born: nowT + (next8 - AE.t()), dur: 3 });
          }
          step8++; next8 += T.beat * 0.5;
        }
        if (next8 < AE.t()) next8 = T.next(0.5);
      },
      stop() { MOut.cc(1, 64, 0); v.kill(); }
    };
  }
});

/* ---------- SRC-25 · TOMOGRAPH ---------- */
reg({
  id: 'SRC-25', title: 'Tomograph', tech: 'LIGHT PLANES / VOLUME SLICER',
  music: { bpm: 56, root: 45, mode: 'dorian', prog: [0, 3], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['VOLUME NATIVE', 'PLANE SWEEP', 'NET CROSSINGS', 'DEPTH REVEAL'],
  desc: 'On the screen this is almost nothing: a few brilliant vertical lines in a field of dust. In the volume it is everything — each line extrudes through the hanging nets as a PLANE of light, a flat sheet standing in the room, and moving your hand drags that sheet bodily through space like a scanner through tissue. Faint striations mark where the nets hang; when a plane crosses one, the crossing rings. This is the piece that teaches an audience, in ten seconds, that the space has depth.',
  interact: 'L = position of the primary plane — your hand IS the sheet of light, one-to-one. R = multiplication: more planes fan out from the first at golden-ratio spacings, and their slow counter-drift turns one scanner into a colonnade. The paradigm is the purest possible: position and multiplicity.',
  sound: 'Plane movement: filtered air whoosh, velocity-scaled (map CC1 rate-of-change to a noise swell in Ableton). Net crossings: soft struck harmonics — each net is pinned to one chord tone, so a slow sweep across the room arpeggiates the chord in space; pitch order = spatial order, which the audience can SEE. Big slow reverb; this piece should sound like a cathedral being measured.',
  init(P) {
    const nets = [];
    const n = 8;
    for (let i = 0; i < n; i++) nets.push({ x: 0.08 + (i + P.rand() * 0.6) / n * 0.86, tone: i });
    const dust = [];
    const nd = Math.round(500 * areaScale(P));
    for (let i = 0; i < nd; i++) dust.push({ x: P.rand(), y: P.rand(), ph: P.rand() * TAU, d: 0.4 + P.rand() });
    P.state = { nets, dust, prevX: 0.5, vel: 0, crossed: {} };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    s.vel += ((inp.L - s.prevX) / Math.max(dt, 1e-4) - s.vel) * Math.min(1, dt * 8);
    // blade positions
    const nBlades = 1 + Math.floor(inp.R * 3.999);
    const blades = [inp.L];
    const PHI = 0.618;
    for (let k = 1; k < nBlades; k++) {
      blades.push(((inp.L + k * PHI + Math.sin(t * 0.13 + k) * 0.04) % 1 + 1) % 1);
    }
    s.blades = blades;
    // crossings
    for (const net of s.nets) {
      for (let bi = 0; bi < blades.length; bi++) {
        const key = net.tone * 8 + bi;
        const near = Math.abs(blades[bi] - net.x) < 0.008;
        if (near && !s.crossed[key]) {
          s.crossed[key] = true;
          net.flash = 1;
          P.ping(A => A.bell(H.chordTone(net.tone, 0), { at: A.q(), vol: 0.07, dur: 3, rev: 0.7, pan: net.x * 2 - 1 }));
        } else if (!near) s.crossed[key] = false;
      }
      net.flash = (net.flash || 0) * Math.pow(0.05, dt);
    }
    s.prevX = inp.L;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(2,3,4,0.5)'; g.fillRect(0, 0, w, h);
    if (!s.blades) return;
    // net striations
    for (const net of s.nets) {
      const x = net.x * w;
      g.strokeStyle = `rgba(140,160,170,${0.05 + (net.flash || 0) * 0.5})`;
      g.lineWidth = 1 + (net.flash || 0) * 2;
      if (net.flash > 0.2) { g.shadowColor = '#cfe8ee'; g.shadowBlur = 12 * net.flash; }
      g.beginPath(); g.moveTo(x, h * 0.04); g.lineTo(x, h * 0.96); g.stroke();
      g.shadowBlur = 0;
    }
    // dust — brightens near blades
    for (const d of s.dust) {
      let near = 0;
      for (const b of s.blades) near = Math.max(near, 1 - Math.abs(d.x - b) * 22);
      if (near <= 0) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + d.ph);
      g.fillStyle = `rgba(220,240,250,${near * near * tw * 0.8 * d.d})`;
      g.fillRect(d.x * w, (d.y + Math.sin(t * 0.2 + d.ph) * 0.01) * h, 1.3 * d.d, 1.3 * d.d);
    }
    // the blades
    for (let bi = 0; bi < s.blades.length; bi++) {
      const x = s.blades[bi] * w;
      const primary = bi === 0;
      const a = primary ? 0.95 : 0.5;
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, `rgba(210,240,255,0)`);
      gr.addColorStop(0.12, `rgba(215,245,255,${a})`);
      gr.addColorStop(0.88, `rgba(215,245,255,${a})`);
      gr.addColorStop(1, `rgba(210,240,255,0)`);
      g.strokeStyle = gr;
      g.lineWidth = primary ? 2.6 : 1.4;
      g.shadowColor = '#d9f4ff'; g.shadowBlur = primary ? 22 : 10;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
      g.shadowBlur = 0;
    }
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('bandpass', 900, 1.2);
    const ng = v.g(0);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.03, cutoff: 300 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2));
    v.fadeIn(1, 1);
    return {
      tick(inp) {
        const sp = Math.min(1, Math.abs(P.state.vel || 0) * 1.4);
        A.set(ng.gain, sp * 0.09, 0.1);
        A.set(f.frequency, 500 + sp * 2500, 0.1);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-26 · SOLID LIGHT ---------- */
reg({
  id: 'SRC-26', title: 'Solid Light', tech: 'TWO CONES / McCALL VESPERS',
  music: { bpm: 50, root: 50, mode: 'lydian', prog: [0, 1], chordBars: 4 },
  fx: { bloom: 0.65, edge: true },
  tags: ['VOLUME NATIVE', 'TWO PROJECTORS', 'CONE INTERSECTION', 'HAZE DUST'],
  desc: 'An homage to Anthony McCall: light treated as sculpture. Two cones stand in the haze — one born from each projector, one belonging to each hand. On screen they are translucent wedges; through the nets they become true solid objects, walls of light you could walk around. Steer them toward each other and where they intersect the light doubles, the air ignites, and the chord gains its fifth. Two people, one cone each, negotiating an intersection — that is the whole piece.',
  interact: 'L = direction of the west cone, R = east. Apertures breathe on their own, slowly. Each cone\'s direction picks its pitch from the chord ladder, so aiming IS voicing; full intersection is rewarded with the brightest light and the widest chord. Deliberately the slowest piece in the library.',
  sound: 'Two voice-led pad tones, one per cone (Ableton: your Zimmer strings, one voice each, hard-panned to their side), pitch stepping the chord ladder as the cone turns. Intersection amount → a third voice (the fifth above), a shimmer send, and a slow swell — map it to CC11-style expression. No transients at all: this piece is one continuous chord being steered.',
  init(P) {
    const nd = Math.round(350 * areaScale(P));
    const dust = [];
    for (let i = 0; i < nd; i++) dust.push({ x: P.rand(), y: P.rand(), ph: P.rand() * TAU });
    P.state = { dust, overlap: 0 };
  },
  _cone(P, side, v, t) {
    const w = P.w, h = P.h;
    const ox = side === 0 ? w * 0.08 : w * 0.92, oy = h * 0.06;
    const base = side === 0 ? Math.PI * 0.42 : Math.PI * 0.58;
    // raising a hand leans its cone toward the center — intersection is the reward
    const dir = base + (side === 0 ? -1 : 1) * (v - 0.3) * 1.15;
    const ap = 0.16 + 0.05 * Math.sin(t * 0.21 + side * 2.2);
    return { ox, oy, dir, ap, len: Math.hypot(w, h) * 1.05 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const cL = this._cone(P, 0, inp.L, t), cR = this._cone(P, 1, inp.R, t);
    s.cL = cL; s.cR = cR;
    // overlap: sample points, count those inside both cones
    let inBoth = 0, N = 60;
    const inside = (c, x, y) => {
      const a = Math.atan2(y - c.oy, x - c.ox);
      let d = a - c.dir;
      while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      return Math.abs(d) < c.ap;
    };
    for (let i = 0; i < N; i++) {
      const x = P.w * (0.2 + 0.6 * ((i * 37) % N) / N), y = P.h * (0.3 + 0.65 * i / N);
      if (inside(cL, x, y) && inside(cR, x, y)) inBoth++;
    }
    s.overlap += (Math.min(1, inBoth / 9) - s.overlap) * Math.min(1, dt * 1.6);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(2,2,4,0.5)'; g.fillRect(0, 0, w, h);
    if (!s.cL) return;
    g.globalCompositeOperation = 'lighter';
    for (const [c, hue] of [[s.cL, 195], [s.cR, 32]]) {
      const x1 = c.ox + Math.cos(c.dir - c.ap) * c.len, y1 = c.oy + Math.sin(c.dir - c.ap) * c.len;
      const x2 = c.ox + Math.cos(c.dir + c.ap) * c.len, y2 = c.oy + Math.sin(c.dir + c.ap) * c.len;
      const gr = g.createRadialGradient(c.ox, c.oy, 10, c.ox, c.oy, c.len * 0.8);
      gr.addColorStop(0, `hsla(${hue},60%,80%,0.16)`);
      gr.addColorStop(1, `hsla(${hue},60%,60%,0.015)`);
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(c.ox, c.oy); g.lineTo(x1, y1); g.lineTo(x2, y2); g.closePath(); g.fill();
      // hard edges — the walls of the cone
      for (const [ex, ey] of [[x1, y1], [x2, y2]]) {
        const eg = g.createLinearGradient(c.ox, c.oy, ex, ey);
        eg.addColorStop(0, `hsla(${hue},70%,88%,0.8)`);
        eg.addColorStop(1, `hsla(${hue},70%,70%,0.05)`);
        g.strokeStyle = eg; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(c.ox, c.oy); g.lineTo(ex, ey); g.stroke();
      }
      g.fillStyle = `hsla(${hue},80%,90%,0.9)`;
      g.beginPath(); g.arc(c.ox, c.oy, 3.5, 0, TAU); g.fill();
    }
    // dust in the beams
    const inside = (c, x, y) => {
      const a = Math.atan2(y - c.oy, x - c.ox);
      let d = a - c.dir;
      while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      return Math.abs(d) < c.ap;
    };
    for (const d of s.dust) {
      const x = d.x * w, y = d.y * h;
      const iL = inside(s.cL, x, y), iR = inside(s.cR, x, y);
      if (!iL && !iR) continue;
      const tw = 0.4 + 0.6 * Math.sin(t * 1.1 + d.ph);
      const both = iL && iR;
      g.fillStyle = both ? `rgba(255,250,235,${tw * 0.9})` : `rgba(210,225,235,${tw * 0.35})`;
      g.fillRect(x, y + Math.sin(t * 0.25 + d.ph) * 3, both ? 2 : 1.3, both ? 2 : 1.3);
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(190,200,210,0.7)'; g.font = '10px ui-monospace,monospace';
    g.fillText('INTERSECTION ' + Math.round(s.overlap * 100) + '%', 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const west = A.padVoices(v, 1, { type: 'sawtooth', gain: 0.045, cutoff: 420 })[0];
    const east = A.padVoices(v, 1, { type: 'sawtooth', gain: 0.045, cutoff: 420 })[0];
    const fifth = A.padVoices(v, 1, { type: 'triangle', gain: 0.0001, cutoff: 700 })[0];
    const retune = (inp) => {
      west.set(H.chordTone(Math.round((inp ? inp.L : 0.5) * 5), -1), 0.8);
      east.set(H.chordTone(Math.round((inp ? inp.R : 0.5) * 5) + 2, -1), 0.8);
    };
    retune(null);
    H.onChord(() => { retune(lastInp); fifth.set(H.chordTone(4, 0), 1.5); });
    fifth.set(H.chordTone(4, 0), 0.1);
    let lastInp = null;
    v.fadeIn(1, 2);
    return {
      tick(inp) {
        lastInp = inp;
        retune(inp);
        const ov = P.state.overlap;
        fifth.level(ov * 0.05, 0.6);
        west.bright(300 + ov * 600, 0.5); east.bright(300 + ov * 600, 0.5);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-27 · SPHERE BREATH ---------- */
reg({
  id: 'SRC-27', title: 'Sphere Breath', tech: 'RADIAL SHELLS / THE SOURCE ITSELF',
  music: { bpm: 54, root: 46, mode: 'aeolian', prog: [0, 5, 3, 5], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['VOLUME NATIVE', 'ANCHORED TO SCULPTURE', 'EXPANDING SHELLS', 'BREATH ENGINE'],
  desc: 'The one piece that is ABOUT the sphere. The center of the screen is dark — that is where the physical source sits on its pedestal, and the projection leaves it alone. Everything else radiates from it: expanding shells of light that pass outward through the nets as real curved surfaces, so the whole 20-foot volume appears to be the sphere\'s own breath. Left hand deepens the inhale, right hand releases the exhale; together they set the lungs of the room.',
  interact: 'L = breath depth (shell brightness and amplitude — how much light each exhale carries). R = breath rate (shell frequency — from one slow swell every six seconds to a fast shimmering pulse). The mapping is deliberately simple because the subject is the architecture: this is the resting-state piece, the one playing when someone first walks in.',
  sound: 'A breathing pad — literally: amplitude follows the shell cycle, swelling as each shell is born and releasing as it dissolves (Ableton: warm strings/choir with slow LFO you drive from CC2 = rate, CC1 = depth). Each shell birth is a soft low gong (chord root, felt more than heard); shells crossing the outer nets add a distant shimmer. Sub root always. The piece should sound like something enormous asleep, almost — but not quite — waking.',
  init(P) {
    P.state = { shells: [], phase: 0, breath: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const rate = 0.16 + inp.R * 0.75;           // breaths per second
    s.phase += rate * dt;
    s.breath = Math.sin(s.phase * TAU) * 0.5 + 0.5;
    if (s.phase >= 1) {
      s.phase -= 1;
      const amp = 0.25 + inp.L * 0.75;
      s.shells.push({ r: 0.06, amp, born: t });
      P.ping(A => {
        A.tone(H.rootFreq(-2), { vol: amp * 0.14, dur: 2.5, attack: 0.4, type: 'sine', rev: 0.5 });
        A.bell(H.chordTone(2, 0), { at: A.q(2), vol: amp * 0.05, dur: 4, rev: 0.8 });
      });
    }
    for (const sh of s.shells) sh.r += dt * (0.1 + inp.R * 0.1);
    s.shells = s.shells.filter(sh => sh.r < 1.2);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(3,3,5,0.4)'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R0 = Math.min(w, h);
    g.globalCompositeOperation = 'lighter';
    for (const sh of s.shells) {
      const r = sh.r * R0 * 0.7;
      const fade = Math.max(0, 1 - sh.r / 1.1);
      const a = sh.amp * fade * 0.55;
      if (a < 0.01) continue;
      const hue = 190 + sh.amp * 40;
      g.strokeStyle = `hsla(${hue},70%,${60 + sh.amp * 20}%,${a})`;
      g.lineWidth = 2 + sh.amp * 6 * fade;
      g.shadowColor = `hsla(${hue},80%,70%,${a})`; g.shadowBlur = 20 * fade;
      g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
      g.shadowBlur = 0;
      // secondary harmonic ring
      g.strokeStyle = `hsla(${hue + 20},60%,70%,${a * 0.3})`;
      g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, r * 0.92, 0, TAU); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    // the sphere's dark seat + corona
    const seatR = R0 * 0.09;
    const cor = g.createRadialGradient(cx, cy, seatR * 0.6, cx, cy, seatR * (1.7 + s.breath * 0.5));
    cor.addColorStop(0, 'rgba(0,0,0,1)');
    cor.addColorStop(0.55, 'rgba(0,0,0,1)');
    cor.addColorStop(0.72, `rgba(140,200,230,${0.12 + s.breath * 0.25})`);
    cor.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = cor;
    g.beginPath(); g.arc(cx, cy, seatR * 2.4, 0, TAU); g.fill();
    // pedestal hint
    g.strokeStyle = 'rgba(120,130,140,0.25)';
    g.strokeRect(cx - seatR * 0.8, cy + seatR, seatR * 1.6, seatR * 1.4);
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 4, { type: 'sawtooth', gain: 0.001, cutoff: 380, q: 0.5 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2.5));
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.07);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => A.set(sub.frequency, H.rootFreq(-2), 2));
    v.fadeIn(1, 1.5);
    return {
      tick(inp) {
        const s = P.state;
        const lvl = (0.012 + inp.L * 0.045) * (0.35 + s.breath * 0.65);
        pads.forEach(p => { p.level(lvl, 0.3); p.bright(260 + s.breath * 500, 0.4); });
        A.set(sg.gain, 0.05 + s.breath * 0.05, 0.4);
        MOut.expr('pad', s.breath * (0.3 + inp.L * 0.7));
      },
      stop() { v.kill(); }
    };
  }
});
