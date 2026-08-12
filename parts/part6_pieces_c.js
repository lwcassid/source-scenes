/* ============================================================
   PIECES 17–22 — ROUND TWO FLAGSHIPS
   Everything in key. Everything on the grid. Black is the room.
   ============================================================ */

/* ---------- SRC-17 · CHORD CATHEDRAL ---------- */
reg({
  id: 'SRC-17', title: 'Chord Cathedral', tech: 'CHORD-TONE LADDER / WALL OF SOUND',
  music: { bpm: 60, root: 50, mode: 'lydian', prog: [0, 1, 4, 3], chordBars: 4 },
  fx: { bloom: 0.65, edge: true },
  tags: ['VOICE LEADING', 'STACKING SUSTAIN', 'LIGHT STRATA', 'HARMONY VISIBLE'],
  desc: 'A cathedral built out of the current chord. Twelve strata of light hang in the dark, one for every chord tone across three octaves. Each hand climbs the ladder; every rung you touch begins to sing and to shine, and it keeps singing after you leave it — so climbing builds a wall of sound, stratum stacking on stratum until the whole nave is burning. When the chord changes, you watch the harmony move: every sounding stratum glides to its nearest new home.',
  interact: 'L = left hand\'s rung on the chord-tone ladder, R = right. Movement is the instrument: sweep slowly to voice-lead a hymn, sweep fast to rake glissandi. Rest and the wall slowly cools back to embers. The chord changes every four bars and re-voices everything you\'ve stacked.',
  sound: 'Eight voice-led pad voices (Ableton: lush supersaw or string-machine rack, 8-voice, slow attack, long release) — each struck stratum claims a voice at its pitch and sustains; chord changes glide every sounding voice to the nearest new chord tone (map glide via pitch-bend or MPE slide). Strike accent: soft felt-piano or pluck at the same pitch, quantized to 16ths, heavy shimmer verb. Bass: root drone two octaves down, refreshed each chord. The mix rule: individual strata at -20dB so ten together bloom instead of clip — the crescendo IS the interaction.',
  init(P) {
    const rungs = [];
    for (let i = 0; i < 12; i++) rungs.push({ energy: 0, y: 0, freq: 440, flash: 0, drift: P.rand() * TAU });
    P.state = { rungs, idxL: -1, idxR: -1, glow: 0, dust: [], strikes: [] };
    this._layout(P);
    if (typeof H !== 'undefined') H.onChord && P.focused && H.onChord(() => this._layout(P));
  },
  _layout(P) {
    // map each rung's freq to a y position (log pitch space)
    for (let i = 0; i < 12; i++) {
      const f = (typeof H !== 'undefined') ? H.chordTone(i, -1) : 110 * Math.pow(2, i / 4);
      const r = P.state.rungs[i];
      r.freq = f;
      r.targetY = P.h * (0.9 - (Math.log2(f / 65) / 3.6) * 0.8);
      if (!r.y) r.y = r.targetY;
    }
  },
  step(P, dt, t, inp) {
    const s = P.state;
    this._layout(P);
    const iL = Math.round(inp.L * 11), iR = Math.round(inp.R * 11);
    const strike = (i, side) => {
      const r = s.rungs[i];
      r.energy = 1; r.flash = 1;
      s.strikes.push({ i, side, t });
      P.ping(A => {
        A.pluck2(r.freq * 2, { at: A.q(), vol: 0.09, pan: side === 0 ? -0.35 : 0.35, rev: 0.55, del: 0.18 });
      });
    };
    if (iL !== s.idxL) { s.idxL = iL; strike(iL, 0); }
    if (iR !== s.idxR) { s.idxR = iR; strike(iR, 1); }
    let glow = 0;
    for (const r of s.rungs) {
      r.energy *= Math.pow(0.945, dt * 4);   // ~12s cool-down
      r.flash *= Math.pow(0.001, dt);
      r.y += (r.targetY - r.y) * Math.min(1, dt * 2.2); // visible voice-leading glide
      glow += r.energy;
      if (r.energy > 0.25 && P.rand() < r.energy * dt * 8) {
        s.dust.push({ x: P.rand() * P.w, y: r.y, vy: -8 - P.rand() * 18, life: 1, hue: 48 + P.rand() * 30 });
      }
    }
    s.glow += (Math.min(1, glow / 6) - s.glow) * Math.min(1, dt * 2);
    for (const d of s.dust) { d.y += d.vy * dt; d.life -= dt * 0.5; }
    s.dust = s.dust.filter(d => d.life > 0);
    s.strikes = s.strikes.filter(st => t - st.t < 1);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,3,6,0.4)'; g.fillRect(0, 0, w, h);
    // ambient nave glow grows with the wall
    if (s.glow > 0.02) {
      const gr = g.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, Math.max(w, h) * 0.7);
      gr.addColorStop(0, `rgba(90,70,40,${s.glow * 0.35})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    // hand columns
    for (const [x, v, idx] of [[w * 0.5 - w * 0.31, inp.L, s.idxL], [w * 0.5 + w * 0.31, inp.R, s.idxR]]) {
      const gr = g.createLinearGradient(x, h, x, 0);
      gr.addColorStop(0, 'rgba(255,240,200,0.0)');
      gr.addColorStop(clamp(1 - v, 0.02, 0.98), 'rgba(255,240,200,0.14)');
      gr.addColorStop(1, 'rgba(255,240,200,0.0)');
      g.strokeStyle = gr; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke();
      const ry = s.rungs[Math.max(0, Math.min(11, idx))].y;
      g.fillStyle = 'rgba(255,246,214,0.95)';
      g.shadowColor = '#ffe9b0'; g.shadowBlur = 14;
      g.beginPath(); g.arc(x, ry, 4, 0, TAU); g.fill();
      g.shadowBlur = 0;
    }
    // strata
    for (let i = 0; i < 12; i++) {
      const r = s.rungs[i];
      const e = r.energy;
      if (e < 0.015 && r.flash < 0.02) {
        g.strokeStyle = 'rgba(120,110,90,0.12)';
        g.lineWidth = 1;
        g.beginPath(); g.moveTo(w * 0.1, r.y); g.lineTo(w * 0.9, r.y); g.stroke();
        continue;
      }
      const wob = Math.sin(t * (1.2 + i * 0.13) + r.drift) * 2 * e;
      const hue = 44 + i * 2.5;
      const grd = g.createLinearGradient(w * 0.06, 0, w * 0.94, 0);
      grd.addColorStop(0, `hsla(${hue},90%,72%,0)`);
      grd.addColorStop(0.18, `hsla(${hue},92%,${68 + e * 18}%,${e * 0.85})`);
      grd.addColorStop(0.5, `hsla(${hue - 8},100%,${78 + e * 16}%,${Math.min(1, e * 1.1 + r.flash * 0.5)})`);
      grd.addColorStop(0.82, `hsla(${hue},92%,${68 + e * 18}%,${e * 0.85})`);
      grd.addColorStop(1, `hsla(${hue},90%,72%,0)`);
      g.strokeStyle = grd;
      g.lineWidth = 1.5 + e * e * 9 + r.flash * 3;
      g.shadowColor = `hsla(${hue},100%,75%,${e})`; g.shadowBlur = 18 * e + 10 * r.flash;
      g.beginPath(); g.moveTo(w * 0.06, r.y + wob); g.lineTo(w * 0.94, r.y + wob); g.stroke();
      g.shadowBlur = 0;
    }
    // dust
    for (const d of s.dust) {
      g.fillStyle = `hsla(${d.hue},90%,80%,${d.life * 0.5})`;
      g.fillRect(d.x, d.y, 1.6, 1.6);
    }
  },
  audio(A, P) {
    const v = A.voice();
    const wall = A.padVoices(v, 8, { type: 'sawtooth', gain: 0.0001, cutoff: 700, q: 0.6 });
    const assign = new Map(); // rung index -> wall voice index
    let next = 0;
    const bass = v.osc('sine', H.rootFreq(-2));
    const bg = v.g(0.09);
    bass.connect(bg); bg.connect(v.group);
    H.onChord(() => {
      A.set(bass.frequency, H.rootFreq(-2), 1.2);
      // glide every sounding voice to the new chord (voice leading, audible + visible)
      for (const [ri, wi] of assign) wall[wi].set(H.chordTone(ri, -1), 1.4);
    });
    v.fadeIn(1, 1.2);
    return {
      tick() {
        const s = P.state;
        for (let i = 0; i < 12; i++) {
          const e = s.rungs[i].energy;
          if (e > 0.03 && !assign.has(i)) {
            // steal the quietest voice
            let victim = next % 8; next++;
            for (const [ri2, wi2] of assign) if (wi2 === victim) assign.delete(ri2);
            assign.set(i, victim);
            wall[victim].set(s.rungs[i].freq, 0.05);
          }
        }
        for (const [ri, wi] of assign) {
          const e = s.rungs[ri].energy;
          wall[wi].level(e * 0.052, 0.25);
          if (e < 0.02) assign.delete(ri);
        }
        const glow = s.glow;
        wall.forEach(p2 => p2.bright(500 + glow * 1800));
        A.set(bg.gain, 0.05 + glow * 0.07, 0.4);
        MOut.expr('pad', glow);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-18 · NIGHT CIRCUIT ---------- */
reg({
  id: 'SRC-18', title: 'Night Circuit', tech: 'NEON CANYON / GENERATIVE SYNTHWAVE',
  music: { bpm: 100, root: 45, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { edge: true },
  tags: ['VIDEO FEEDBACK', 'MUSIC BY DRIVING', 'CLIMB + TURN', 'ARP ENGINE'],
  desc: 'An endless canyon of neon architecture, somewhere between an 80s rail shooter and a memory of one. You are always moving. Your hands bend the world: apart, the canyon banks and the music leans with tension; together and high, you climb and the whole track brightens an octave; together and low, you dive into the bass. The soundtrack is not playing — you are generating it, bar by bar, by how you drive.',
  interact: 'R − L = bank left/right (the walls bend, the arp pans, tension notes lean in). L + R = altitude: high = climb (arp jumps an octave, filter opens, hats double), low = descend (sub takes over, lights dim to embers). The delay throw and the motion-blur feedback are both tied to speed of change — whip the hands to smear the world.',
  sound: 'A driving synthwave engine at 100bpm, all from the current chord: bass 8ths alternating root/octave (Operator saw-sub, tight), arp 16ths cycling chord tones (analog-style pluck through dotted-8th ping-pong delay), kick on 1 and 3, hats on off-8ths (doubling when climbing), tension: banking hard substitutes the arp\'s top note with a suspended scale tone. Altitude maps to a global LP macro (300Hz–8kHz) — the classic synthwave "surface" filter ride. Chord changes every 2 bars, key modulates every 16: the track writes itself and never loops.',
  init(P) {
    const fb = document.createElement('canvas');
    fb.width = P.w; fb.height = P.h;
    P.state = {
      z: 0, bend: 0, lift: 0, fb, fbg: fb.getContext('2d'),
      stars: Array.from({ length: 70 }, () => ({ x: P.rand(), y: P.rand() * 0.6, tw: P.rand() * TAU }))
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const bendT = (inp.R - inp.L) * 1.3;
    const liftT = (inp.L + inp.R - 1) * 1.1;
    s.bend += (bendT - s.bend) * Math.min(1, dt * 2.2);
    s.lift += (liftT - s.lift) * Math.min(1, dt * 2.2);
    s.z += dt * (9 + (inp.L + inp.R) * 5);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    // video feedback: previous frame, slightly zoomed and dimmed
    if (s.fb.width !== w || s.fb.height !== h) { s.fb.width = w; s.fb.height = h; }
    s.fbg.globalAlpha = 1;
    s.fbg.clearRect(0, 0, w, h);
    s.fbg.drawImage(P.canvas, 0, 0);
    g.fillStyle = 'rgb(5,3,10)'; g.fillRect(0, 0, w, h);
    g.save();
    g.globalAlpha = 0.55;
    const zx = 1.02 + Math.abs(s.bend) * 0.012;
    g.translate(w / 2 + s.bend * 8, h / 2 + s.lift * -6);
    g.scale(zx, zx);
    g.translate(-w / 2, -h / 2);
    g.drawImage(s.fb, 0, 0);
    g.restore();
    // stars
    for (const st of s.stars) {
      g.fillStyle = `rgba(200,180,255,${0.25 + 0.35 * Math.abs(Math.sin(t + st.tw))})`;
      g.fillRect(st.x * w, (st.y - s.lift * 0.06) * h, 1.5, 1.5);
    }
    // vanishing point moves with bank + altitude
    const vpx = w / 2 + s.bend * w * 0.3;
    const vpy = h * 0.5 - s.lift * h * 0.3;
    // horizon glow pulsing on the beat
    const pulse = (typeof T !== 'undefined' && T.running) ? T.beatPulse() : Math.max(0, Math.sin(t * 6)) * 0.5;
    const hg = g.createLinearGradient(0, vpy - h * 0.16, 0, vpy + h * 0.04);
    hg.addColorStop(0, 'rgba(255,60,180,0)');
    hg.addColorStop(1, `rgba(255,70,190,${0.13 + pulse * 0.12})`);
    g.fillStyle = hg; g.fillRect(0, vpy - h * 0.16, w, h * 0.2);
    // canyon frames, far → near
    const N = 20;
    const zz = s.z % 1;
    for (let j = N; j >= 1; j--) {
      const dn = clamp((j - zz) / N);          // 0 near … 1 far
      const per = 1 / (1 + dn * 7);            // 1 … 0.125
      const near = 1 - dn;
      // frames curve toward the vanishing point as they recede
      const cx = lerp(w / 2 - s.bend * w * 0.12, vpx, dn * dn);
      const cy = lerp(h * 0.52 + s.lift * h * 0.08, vpy, dn * dn);
      const fw = per * w * 0.56, fh = per * h * 0.54;
      const seg = Math.floor(s.z) + j;
      const hueA = seg % 2 ? 315 : 185;        // magenta / cyan alternating
      g.strokeStyle = `hsla(${hueA},100%,${52 + near * 26}%,${0.1 + near * 0.8})`;
      g.lineWidth = 1 + near * 2.4;
      g.shadowColor = `hsla(${hueA},100%,60%,${near})`;
      g.shadowBlur = 12 * near;
      // canyon cross-section: two walls + floor
      g.beginPath();
      g.moveTo(cx - fw, cy - fh); g.lineTo(cx - fw, cy + fh * 0.55);
      g.lineTo(cx + fw, cy + fh * 0.55); g.lineTo(cx + fw, cy - fh);
      g.stroke();
      g.shadowBlur = 0;
      // window slits on near walls
      if (near > 0.45) {
        g.lineWidth = 1;
        g.strokeStyle = `hsla(${hueA},100%,70%,${near * 0.5})`;
        for (let wnd = 0; wnd < 3; wnd++) {
          const wy = cy - fh * (0.15 + wnd * 0.3);
          g.beginPath(); g.moveTo(cx - fw, wy); g.lineTo(cx - fw + fw * 0.09, wy); g.stroke();
          g.beginPath(); g.moveTo(cx + fw, wy); g.lineTo(cx + fw - fw * 0.09, wy); g.stroke();
        }
      }
      // floor dashes marching toward you
      if (seg % 2 === 0) {
        g.strokeStyle = `hsla(265,100%,72%,${0.12 + near * 0.55})`;
        g.lineWidth = 1 + near * 1.6;
        const fy = cy + fh * 0.55;
        g.beginPath(); g.moveTo(cx, fy); g.lineTo(cx, fy + Math.max(2, per * h * 0.05)); g.stroke();
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    // global surface filter for the arp/bass
    const surf = v.filter('lowpass', 1200, 0.9);
    surf.connect(v.group);
    const mk = (type, gain) => { const gg = v.g(gain); gg.connect(surf); return gg; };
    const arpBus = mk('a', 1), bassBus = mk('b', 1);
    if (A.delIn) { const s2 = A.ctx.createGain(); s2.gain.value = 0.5; arpBus.connect(s2); s2.connect(A.delIn); }
    if (A.revIn) { const s3 = A.ctx.createGain(); s3.gain.value = 0.25; arpBus.connect(s3); s3.connect(A.revIn); }
    let nextT = T.next(0.25), step16 = 0;
    const schedTone = (bus, freq, t0, vol, dur, type) => {
      const o = A.ctx.createOscillator(); o.type = type; o.frequency.value = freq;
      const gg = A.ctx.createGain();
      gg.gain.setValueAtTime(0.0001, t0);
      gg.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg); gg.connect(bus);
      o.start(t0); o.stop(t0 + dur + 0.05);
    };
    v.fadeIn(1, 0.6);
    return {
      tick(inp) {
        const s = P.state;
        const lift = clamp((inp.L + inp.R) / 2);
        const bank = Math.abs(inp.R - inp.L);
        A.set(surf.frequency, 320 + Math.pow(lift, 1.4) * 6800, 0.15);
        MOut.expr('arp', lift); MOut.expr('bass', lift);
        const horizon = AE.t() + 0.15;
        while (nextT < horizon) {
          const st = step16 % 16;
          // synthwave runs nearly straight — a hair of push, no shuffle
          const sw = st % 2 === 1 ? T.beat * 0.012 : 0;
          const tt = nextT + sw;
          // four-on-the-floor + clap on 2 & 4 + ghosted hats
          // (the whole rhythm section sleeps until hands arrive — rest is beatless)
          if (lift > 0.1 && st % 4 === 0) A.kick(nextT, 0.28);
          if (lift > 0.1 && st % 8 === 4) {
            MOut.evDrum(38, 0.22, nextT);
            A.hit({ vol: 0.15, dur: 0.14, freq: 1900, q: 0.8, at: nextT });
            A.tone(190, { at: nextT, vol: 0.06, dur: 0.09, type: 'triangle', rev: 0.25 });
          }
          if (lift > 0.1 && st % 2 === 1) A.hat(tt, { vol: 0.028 + lift * 0.03 });
          if (lift > 0.55 && st % 4 === 2) A.hat(tt, { vol: 0.018 + lift * 0.02, open: st === 14 });
          // bass: 8ths at cruise, rolling 16ths at full throttle
          if (lift > 0.06 && (st % 2 === 0 || lift > 0.75)) {
            const oct = st % 4 === 0 ? -2 : -1;
            const bf = H.rootFreq(oct);
            const bv = st % 2 === 0 ? 0.16 : 0.1;
            MOut.evNote('bass', bf, bv, tt, 0.2);
            schedTone(bassBus, bf, tt, bv, 0.2, 'sawtooth');
          }
          // arp: chord tones, octave up when climbing, tension tone when banking hard
          const pat = [0, 2, 1, 3, 2, 4, 3, 5][st % 8];
          let f;
          if (bank > 0.55 && st % 4 === 3) f = H.scaleTone(H.prog[H.step] + 3, 1); // suspended lean
          else f = H.chordTone(pat, lift > 0.66 ? 1 : 0);
          if (lift > 0.04) {
            MOut.evNote('arp', f, 0.055 + lift * 0.032, tt, 0.16);
            schedTone(arpBus, f, tt, 0.055 + lift * 0.032, 0.16, 'square');
          }
          step16++; nextT += T.beat * 0.25;
        }
        if (nextT < AE.t()) { nextT = T.next(0.25); } // resync after tab-idle
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-19 · KOI VOID ---------- */
reg({
  id: 'SRC-19', title: 'Koi Void', tech: 'CREATURE SCHOOL / TWO LANTERNS',
  music: { bpm: 60, root: 47, mode: 'dorian', prog: [0, 3, 6, 4], chordBars: 2 },
  fx: { bloom: 0.55, edge: true },
  tags: ['LIVING BODIES', 'LANTERN ATTRACTION', 'ARPEGGIO CROSSINGS', 'DEPTH LAYERS'],
  desc: 'Koi swimming in a volume with no water in it. Each hand is a lantern hanging in the void; raise it and it rises, and the fish that love it follow, coiling around the light in slow ribbons. When a koi passes through a lantern\'s halo it strikes one note of the chord — a school circling both lights becomes a braided arpeggio, played by animals.',
  interact: 'L = height of the west lantern, R = east. You do not control the fish — you control what they want. Hold the lanterns far apart to split the school into two orbits; bring them together and the orbits merge into one knot of light and the arpeggios interleave.',
  sound: 'Crossings: koto/kalimba hybrid plucks (Ableton: Collision wood + Operator sine layer), each fish permanently owns one chord-ladder position so the same fish always sings the same voice — the school is the sequencer. Quantize to 16ths, pan follows the fish. Bed: dark warm pad on the chord (low strings wavetable), sub root, and a very slow shimmer that rises when the school is unified around one lantern. Sparse — let the fish carry the music.',
  init(P) {
    const a = areaScale(P);
    const n = Math.min(14, Math.max(7, Math.round(7 * a)));
    const koi = [];
    for (let i = 0; i < n; i++) {
      const depth = 0.55 + P.rand() * 0.75;
      koi.push({
        x: P.rand() * P.w, y: P.rand() * P.h,
        a: P.rand() * TAU, speed: (58 + P.rand() * 34), depth,
        side: i % 2, tone: i, trail: [], phase: P.rand() * TAU,
        calico: P.rand() < 0.4, lastCross: -9
      });
    }
    P.state = { koi, ripples: [] };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h;
    const lan = [
      { x: w * 0.3, y: h * (0.86 - inp.L * 0.7), v: inp.L },
      { x: w * 0.7, y: h * (0.86 - inp.R * 0.7), v: inp.R }
    ];
    s.lan = lan;
    for (const k of s.koi) {
      const L = lan[k.side];
      const dx = L.x - k.x, dy = L.y - k.y;
      const dist = Math.hypot(dx, dy) || 1;
      // orbit: seek a ring around the lantern, tangential bias
      const ringR = 60 * k.depth + 40;
      const radial = (dist - ringR) / 220;
      const toward = Math.atan2(dy, dx);
      const tangent = toward + Math.PI / 2 * (k.tone % 2 ? 1 : -1);
      const desired = Math.abs(radial) > 0.5 ? toward : tangent + radial * 1.2;
      let da = Math.atan2(Math.sin(desired - k.a), Math.cos(desired - k.a));
      da += Math.sin(t * 0.7 + k.phase) * 0.35; // wander
      k.a += clamp(da, -2.2 * dt, 2.2 * dt) + 0;
      const sp = k.speed * (0.7 + 0.3 * Math.sin(t * 2 + k.phase)) * k.depth;
      k.x += Math.cos(k.a) * sp * dt;
      k.y += Math.sin(k.a) * sp * dt;
      if (k.x < -40) k.x = w + 40; if (k.x > w + 40) k.x = -40;
      if (k.y < -40) k.y = h + 40; if (k.y > h + 40) k.y = -40;
      k.trail.unshift({ x: k.x, y: k.y, a: k.a });
      if (k.trail.length > 34) k.trail.pop();
      // lantern crossing → this fish's own chord tone
      for (const L2 of lan) {
        const d2 = Math.hypot(L2.x - k.x, L2.y - k.y);
        if (d2 < 34 && t - k.lastCross > 1.2) {
          k.lastCross = t;
          s.ripples.push({ x: L2.x, y: L2.y, t });
          const pan = (k.x / w) * 2 - 1;
          P.ping(A => A.pluck2(H.chordTone(k.tone % 7, 0), { at: A.q(), vol: 0.11, dur: 1.3, pan, rev: 0.45, del: 0.15 }));
        }
      }
    }
    s.ripples = s.ripples.filter(r => t - r.t < 1.4);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(3,4,8,0.32)'; g.fillRect(0, 0, w, h);
    if (!s.lan) return;
    // lanterns
    for (const [i, L] of s.lan.entries()) {
      const gr = g.createRadialGradient(L.x, L.y, 2, L.x, L.y, 90);
      gr.addColorStop(0, `rgba(255,214,140,${0.5 + L.v * 0.4})`);
      gr.addColorStop(0.25, `rgba(255,170,90,${0.16 + L.v * 0.15})`);
      gr.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = gr;
      g.beginPath(); g.arc(L.x, L.y, 90, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,246,220,0.95)';
      g.beginPath(); g.arc(L.x, L.y, 3.5 + L.v * 2, 0, TAU); g.fill();
    }
    for (const r of s.ripples) {
      const k = (t - r.t) / 1.4;
      g.strokeStyle = `rgba(255,220,150,${(1 - k) * 0.6})`;
      g.lineWidth = 1.5 * (1 - k);
      g.beginPath(); g.arc(r.x, r.y, 34 + k * 70, 0, TAU); g.stroke();
    }
    // koi (far to near)
    const sorted = [...s.koi].sort((a, b) => a.depth - b.depth);
    for (const k of sorted) {
      const n = k.trail.length;
      if (n < 4) continue;
      for (let i = n - 1; i >= 0; i--) {
        const p = k.trail[i];
        const frac = i / n;
        const bodyW = Math.sin((1 - frac) * Math.PI * 0.85) * 7.5 * k.depth * (1 - frac * 0.25);
        const wig = Math.sin(t * 7 + k.phase + i * 0.55) * bodyW * 0.35 * frac;
        const px = p.x + Math.cos(p.a + Math.PI / 2) * wig;
        const py = p.y + Math.sin(p.a + Math.PI / 2) * wig;
        const alpha = (1 - frac) * 0.85 * (0.5 + k.depth * 0.4);
        let col;
        if (k.calico && (i % 7 < 3)) col = `rgba(255,120,70,${alpha})`;
        else col = i < 3 ? `rgba(255,246,235,${alpha})` : `rgba(255,${200 - frac * 60},${150 - frac * 60},${alpha * 0.9})`;
        g.fillStyle = col;
        if (i < 2) { g.shadowColor = 'rgba(255,220,180,0.9)'; g.shadowBlur = 10 * k.depth; }
        g.beginPath(); g.arc(px, py, Math.max(0.5, bodyW), 0, TAU); g.fill();
        g.shadowBlur = 0;
        // tail fins
        if (i === n - 1) {
          g.strokeStyle = `rgba(255,190,140,${0.3 * k.depth})`;
          g.lineWidth = 1;
          const fa = p.a + Math.PI;
          for (const off of [-0.5, 0, 0.5]) {
            g.beginPath(); g.moveTo(px, py);
            g.lineTo(px + Math.cos(fa + off + Math.sin(t * 8 + k.phase) * 0.3) * 10 * k.depth,
              py + Math.sin(fa + off + Math.sin(t * 8 + k.phase) * 0.3) * 10 * k.depth);
            g.stroke();
          }
        }
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.05, cutoff: 420 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 1.2));
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.07);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => A.set(sub.frequency, H.rootFreq(-2), 1.4));
    v.fadeIn(1, 1.2);
    return {
      tick(inp) {
        const together = 1 - Math.abs(inp.L - inp.R);
        pads.forEach(p => p.bright(300 + together * 500 + (inp.L + inp.R) * 300));
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-20 · AURORA VEILS ---------- */
reg({
  id: 'SRC-20', title: 'Aurora Veils', tech: 'CURTAIN FIELDS / SOLAR WIND',
  music: { bpm: 52, root: 52, mode: 'lydian', prog: [0, 1], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['VOLUME NATIVE', 'LAYERED SHEETS', 'CHORAL WALL', 'ALL-DAY AMBIENT'],
  desc: 'Five translucent curtains of aurora hang one behind another — the same geometry as the net volume itself, so through the mesh the light becomes a true volumetric object. Each hand is the solar wind on its side of the sky: raise it and the curtains on that side stretch tall and pour color; rest and they thin to a faint breathing veil. This is the piece that plays at four in the afternoon when nobody is touching anything, and it has to be beautiful then too.',
  interact: 'L = solar wind west, R = east. Slow piece by design — the curtains answer over seconds, not frames. Both hands high ignites the full sky; the interesting play is asymmetry, dragging a storm from one side of the volume to the other.',
  sound: 'A choral wall (Ableton: wavetable choir/strings, 5 detuned voices, voice-led on the chord, 4-second attacks) whose brightness and upper-octave shimmer follow total wind. Sub root underneath. Sparse bells: when a curtain peak crests, one high chord tone with 8+ seconds of shimmer reverb, quantized to the half-bar so even sparkles feel placed. Modulates key very slowly — lydian, so the changes feel like light shifting rather than a song progressing.',
  init(P) {
    const layers = [];
    for (let l = 0; l < 5; l++) {
      layers.push({ depth: 0.35 + l * 0.17, hueOff: l * 14, ph: P.rand() * 40, crest: 0 });
    }
    P.state = { layers, lastBell: 0 };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    for (const [li, L] of s.layers.entries()) {
      // crest measure for bell triggers
      const x = 0.2 + 0.6 * ((li * 0.23 + t * 0.008) % 1);
      const wind = inp.L * bump(x, 0.25, 0.5) + inp.R * bump(x, 0.75, 0.5);
      L.crest += (wind - L.crest) * Math.min(1, dt * 0.8);
      if (L.crest > 0.82 && t - s.lastBell > 3.5) {
        s.lastBell = t;
        P.ping(A => A.bell(H.chordTone(8 + li % 3, 1), { at: A.q(2), vol: 0.05, dur: 4, rev: 0.75 }));
      }
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(2,3,7,0.5)'; g.fillRect(0, 0, w, h);
    // stars
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 173) % 997) / 997, sy = ((i * 389) % 991) / 991;
      g.fillStyle = `rgba(210,220,255,${0.14 + 0.2 * Math.abs(Math.sin(t * 0.7 + i))})`;
      g.fillRect(sx * w, sy * h * 0.9, 1.2, 1.2);
    }
    const steps = Math.round(72 * Math.min(1.5, areaScale(P)));
    for (const [li, L] of s.layers.entries()) {
      const d = L.depth;
      const useGrad = d > 0.6; // gradient strokes only on near layers (perf)
      for (let i = 0; i <= steps; i++) {
        const x = i / steps;
        const wind = inp.L * bump(x, 0.25, 0.52) + inp.R * bump(x, 0.75, 0.52);
        const base = 0.1 + 0.1 * Math.sin(x * 5 + t * 0.23 * d + L.ph);
        const amp = clamp(base + wind * (0.55 + 0.2 * Math.sin(x * 9 - t * 0.31 * d + L.ph * 2)));
        const a = (0.05 + amp * 0.3) * d;
        if (a < 0.02) continue;
        const topY = h * (0.16 + 0.1 * Math.sin(x * 3.2 + t * 0.12 * d + L.ph) + (1 - amp) * 0.28);
        const len = h * (0.1 + amp * 0.55) * d;
        const sway = Math.sin(x * 14 + t * (0.4 + d * 0.4) + L.ph * 3) * w * 0.008 * d;
        const hue = 150 + x * 90 + L.hueOff + Math.sin(t * 0.1 + L.ph) * 18; // teal→violet drift
        const lum = 55 + amp * 25;
        if (useGrad) {
          const gr = g.createLinearGradient(0, topY, 0, topY + len);
          gr.addColorStop(0, `hsla(${hue},95%,${lum + 18}%,${a * 1.4})`);
          gr.addColorStop(0.35, `hsla(${hue - 20},90%,${lum}%,${a})`);
          gr.addColorStop(1, `hsla(${hue - 45},85%,${lum - 14}%,0)`);
          g.strokeStyle = gr;
        } else {
          g.strokeStyle = `hsla(${hue - 15},90%,${lum}%,${a * 0.8})`;
        }
        g.lineWidth = Math.max(1.5, w / steps * 1.1);
        g.beginPath();
        g.moveTo(x * w + sway, topY);
        g.lineTo(x * w + sway * 1.6, topY + len);
        g.stroke();
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 5, { type: 'sawtooth', gain: 0.036, cutoff: 460, q: 0.5 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1, 2.6));
    const shim = A.padVoices(v, 2, { type: 'triangle', gain: 0.0001, cutoff: 2400 });
    const setShim = () => { shim[0].set(H.chordTone(4, 1), 2); shim[1].set(H.chordTone(7, 1), 2.4); };
    setShim(); H.onChord(setShim);
    const sub = v.osc('sine', H.rootFreq(-2));
    const sg = v.g(0.075);
    sub.connect(sg); sg.connect(v.group);
    H.onChord(() => A.set(sub.frequency, H.rootFreq(-2), 2.2));
    v.fadeIn(1, 2);
    return {
      tick(inp) {
        const wind = (inp.L + inp.R) / 2;
        pads.forEach(p => p.bright(300 + wind * 1300, 0.6));
        shim.forEach(p2 => p2.level(wind * wind * 0.028, 0.8));
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-21 · PULSE LOOM ---------- */
reg({
  id: 'SRC-21', title: 'Pulse Loom', tech: 'QUANTIZED STRINGS / REZ RULE',
  music: { bpm: 92, root: 48, mode: 'dorian', prog: [0, 3, 4, 5], chordBars: 2 },
  fx: { bloom: 0.55 },
  tags: ['CANNOT MISS', 'GRID TIME', 'WOVEN HISTORY', 'SOFT BEAT'],
  desc: 'Twelve strings of light and a loom that only knows how to weave in time. Your left hand aims — it warms a neighborhood of strings. Your right hand pours — it sets how many pulses the loom drops onto the grid. Every pulse falls exactly one beat, strikes its string exactly on a sixteenth, and rings exactly a chord tone. You cannot be early, you cannot be wrong; you can only be more or less generous. The struck threads weave downward into a slowly scrolling cloth — a fabric of everything you played.',
  interact: 'L = where on the loom the pulses land (a warm neighborhood, not a single string — aim is soft). R = density, from single beads of sound to full cascades, and past 0.7 the loom adds its quiet heartbeat. The Rez rule, embodied: the hands supply where and how much; the grid supplies when; the chord supplies what.',
  sound: 'Struck strings: bright kalimba/pluck (Ableton: Tension or a plucked Operator patch), each of the 12 strings fixed to a chord-ladder degree, retuned on every chord change, dotted-8th ping-pong delay at ~35% wet. All hits on 16ths. Heartbeat at high density: soft 808-ish kick on 1 and 3 at -14dB, closed hat on off-8ths. The weave = a frozen delay/freeze-verb send that slowly accumulates everything played into a wash behind the strings (Valhalla Supermassive "Gemini", 100% feedback, faded in with density).',
  init(P) {
    const NS = 12, strings = [];
    for (let i = 0; i < NS; i++) strings.push({ vib: 0, vibPh: 0, glow: 0 });
    P.state = { NS, strings, pulses: [], weave: [], lastAmb: 0 };
  },
  _spawn(P, i, hitAt, spawnT) {
    P.state.pulses.push({ i, spawnT, hitAt, done: false });
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // ambient fallback (gallery mode): sparse fake pulses so the loom always weaves
    if (!P.focused && t - s.lastAmb > 0.9) {
      s.lastAmb = t;
      const i = Math.round(inp.L * (s.NS - 1));
      if (Math.random() < inp.R) this._spawn(P, i, t + 0.8, t);
    }
    for (const p of s.pulses) {
      const now = P.focused && T.running ? AE.t() : t;
      if (!p.done && now >= p.hitAt) {
        p.done = p.doneT = now;
        const st = s.strings[p.i];
        st.vib = 1; st.vibPh = 0; st.glow = 1;
        s.weave.push({ i: p.i, y: 0, born: t });
      }
    }
    const now = P.focused && T.running ? AE.t() : t;
    s.pulses = s.pulses.filter(p => !p.done || now - p.done < 0.3);
    for (const st of s.strings) {
      st.vib *= Math.pow(0.05, dt);
      st.vibPh += dt * 34;
      st.glow *= Math.pow(0.2, dt);
    }
    for (const wv of s.weave) wv.y += dt * 9;
    s.weave = s.weave.filter(wv => wv.y < P.h * 0.42);
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(4,4,7,0.4)'; g.fillRect(0, 0, w, h);
    const x0 = w * 0.14, x1 = w * 0.86;
    const topY = h * 0.08, bridgeY = h * 0.56;
    const sx = i => x0 + (x1 - x0) * (i / (s.NS - 1));
    // aim glow
    const aimX = x0 + (x1 - x0) * inp.L;
    const ag = g.createRadialGradient(aimX, bridgeY, 4, aimX, bridgeY, w * 0.14);
    ag.addColorStop(0, `rgba(255,200,120,${0.12 + inp.R * 0.12})`);
    ag.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = ag; g.fillRect(0, 0, w, h);
    // strings
    for (let i = 0; i < s.NS; i++) {
      const st = s.strings[i];
      const x = sx(i);
      const warmth = bump(i / (s.NS - 1), inp.L, 0.22);
      const hue = 30 + i * 6;
      g.strokeStyle = `hsla(${hue},${40 + warmth * 55}%,${45 + warmth * 28 + st.glow * 22}%,${0.3 + warmth * 0.4 + st.glow * 0.3})`;
      g.lineWidth = 1.2 + st.glow * 2 + warmth * 0.6;
      if (st.glow > 0.2) { g.shadowColor = `hsl(${hue},90%,70%)`; g.shadowBlur = 14 * st.glow; }
      g.beginPath();
      const segs = 16;
      for (let sgi = 0; sgi <= segs; sgi++) {
        const yy = topY + (bridgeY - topY) * (sgi / segs);
        const bow = Math.sin((sgi / segs) * Math.PI) * Math.sin(st.vibPh) * st.vib * 7;
        sgi === 0 ? g.moveTo(x + bow, yy) : g.lineTo(x + bow, yy);
      }
      g.stroke();
      g.shadowBlur = 0;
    }
    // bridge
    g.strokeStyle = 'rgba(220,200,160,0.5)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(x0 - 12, bridgeY); g.lineTo(x1 + 12, bridgeY); g.stroke();
    // pulses
    const now = P.focused && T.running ? AE.t() : t;
    for (const p of s.pulses) {
      const k = clamp((now - p.spawnT) / Math.max(0.001, p.hitAt - p.spawnT));
      const x = sx(p.i), y = topY + (bridgeY - topY) * k;
      if (!p.done) {
        g.fillStyle = 'rgba(255,235,190,0.95)';
        g.shadowColor = '#ffe9b0'; g.shadowBlur = 12;
        g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
        g.shadowBlur = 0;
      } else {
        const fl = 1 - (now - p.done) / 0.3;
        g.strokeStyle = `rgba(255,240,200,${fl})`;
        g.lineWidth = 1.5;
        g.beginPath(); g.arc(x, bridgeY, 6 + (1 - fl) * 18, 0, TAU); g.stroke();
      }
    }
    // the woven cloth below the bridge
    for (const wv of s.weave) {
      const x = sx(wv.i);
      const age = clamp(wv.y / (h * 0.42));
      const hue = 30 + wv.i * 6;
      g.strokeStyle = `hsla(${hue},70%,${58 - age * 25}%,${0.5 * (1 - age)})`;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x - (x1 - x0) / s.NS / 2, bridgeY + wv.y);
      g.lineTo(x + (x1 - x0) / s.NS / 2, bridgeY + wv.y);
      g.stroke();
    }
    // beat lamp
    if (P.focused && T.running) {
      const pulse = T.beatPulse();
      g.fillStyle = `rgba(255,220,160,${0.2 + pulse * 0.6})`;
      g.beginPath(); g.arc(w - 26, 26, 4 + pulse * 3, 0, TAU); g.fill();
    }
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.028, cutoff: 360 });
    A.leadToChord(pads, -1, 0.05);
    H.onChord(() => A.leadToChord(pads, -1));
    let next8 = T.next(0.5), step8 = 0;
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        const horizon = AE.t() + 0.15;
        while (next8 < horizon) {
          const density = inp.R;
          // choose strings near the aim, count scales with density
          const tries = density < 0.15 ? (Math.random() < density * 3 ? 1 : 0) : 1 + Math.floor(density * 2.4);
          for (let k = 0; k < tries; k++) {
            const spread = 0.06 + density * 0.2;
            const pos = clamp(inp.L + (Math.random() * 2 - 1) * spread);
            const i = Math.round(pos * (P.state.NS - 1));
            const hitAt = next8 + T.beat; // pulses fall exactly one beat
            P.state.pulses.push({ i, spawnT: next8, hitAt, done: false });
            const freq = H.chordTone(i - 2, 0);
            A.pluck2(freq, { at: hitAt, vol: 0.1 + density * 0.05, dur: 1.2, pan: (i / (P.state.NS - 1)) * 2 - 1, rev: 0.3, del: 0.35 });
          }
          const st8 = step8 % 8;
          if (inp.R > 0.7) {
            if (st8 === 0 || st8 === 4) A.kick(next8, 0.18);
            if (st8 % 2 === 1) A.hat(next8, { vol: 0.028 });
          }
          step8++; next8 += T.beat * 0.5;
        }
        if (next8 < AE.t()) next8 = T.next(0.5);
      },
      stop() { v.kill(); }
    };
  }
});

/* ---------- SRC-22 · EMBER CHORUS ---------- */
reg({
  id: 'SRC-22', title: 'Ember Chorus', tech: 'KURAMOTO FIREFLIES / SYNC',
  music: { bpm: 64, root: 48, mode: 'aeolian', prog: [0, 5, 3, 4], chordBars: 2 },
  fx: { bloom: 0.6, edge: true },
  tags: ['EMERGENT ORDER', 'WARMTH FIELDS', 'BEAT ENTRAINMENT', 'SLOW REWARD'],
  desc: 'Ninety embers drifting in the dark, each blinking to its own private clock. Your hands are warmth. Warm one side of the volume and the embers there begin to listen to each other — Kuramoto coupling, the real mathematics of firefly synchrony — until their scattered blinking gathers into one shared pulse that locks onto the music\'s heartbeat. Held warmth turns chaos into chorus; take your hands away and the order slowly dissolves back into night.',
  interact: 'L = warmth over the west half, R = east. This piece rewards patience: sync takes ten seconds to crystallize and it is audible as it happens — random ticking gathers into a chordal pulse. You can hold one side synchronized and let the other stay wild, two populations arguing about time.',
  sound: 'Each flash: a soft warm mallet (Ableton: muted vibraphone / Una Corda-style), pitch = that ember\'s fixed chord tone, velocity low, big warm room verb. Unsynced = flashes land anywhere (still in key, never on-grid); as the order parameter rises, flash times entrain to 8ths and the texture audibly becomes a rhythm — mix in a soft sub pulse on the beat scaled by sync. The reward is structural, not louder: order you can hear forming.',
  init(P) {
    const a = areaScale(P);
    const n = Math.min(150, Math.round(80 * a));
    const flies = [];
    for (let i = 0; i < n; i++) {
      flies.push({
        x: P.rand(), y: P.rand(),
        th: P.rand() * TAU, om: 2.6 + P.rand() * 1.4,
        depth: 0.5 + P.rand() * 0.8, ph: P.rand() * TAU,
        tone: i % 8, flash: 0
      });
    }
    P.state = { flies, sync: [0, 0] };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    // order parameters per side
    let sxL = 0, syL = 0, nL = 0, sxR = 0, syR = 0, nR = 0;
    for (const f of s.flies) {
      if (f.x < 0.5) { sxL += Math.cos(f.th); syL += Math.sin(f.th); nL++; }
      else { sxR += Math.cos(f.th); syR += Math.sin(f.th); nR++; }
    }
    const meanL = Math.atan2(syL, sxL), rL = nL ? Math.hypot(sxL, syL) / nL : 0;
    const meanR = Math.atan2(syR, sxR), rR = nR ? Math.hypot(sxR, syR) / nR : 0;
    s.sync = [rL * inp.L, rR * inp.R];
    // beat anchor: a virtual pacemaker at the transport's 8th-note phase
    const beatPh = (P.focused && T.running) ? (T.beats() % 0.5) / 0.5 * TAU : (t * 2.4) % TAU;
    for (const f of s.flies) {
      const side = f.x < 0.5 ? 0 : 1;
      const warmth = side === 0 ? inp.L : inp.R;
      const mean = side === 0 ? meanL : meanR;
      const K = warmth * 2.6;
      f.th += (f.om + K * Math.sin(mean - f.th) + warmth * 1.6 * Math.sin(beatPh - f.th)) * dt;
      // drift
      f.x += Math.sin(t * 0.21 + f.ph) * dt * 0.014;
      f.y += (Math.cos(t * 0.17 + f.ph * 2) * 0.01 - 0.006 * warmth) * dt;
      if (f.y < -0.05) f.y = 1.05;
      if (f.y > 1.05) f.y = -0.05;
      if (f.x < -0.05) f.x = 1.05;
      if (f.x > 1.05) f.x = -0.05;
      f.flash *= Math.pow(0.008, dt);
      if (f.th > TAU) {
        f.th -= TAU;
        f.flash = 1;
        const syncNow = side === 0 ? s.sync[0] : s.sync[1];
        if (P.rand() < 0.16 + syncNow * 0.12) {
          const pan = f.x * 2 - 1;
          P.ping(A => A.tone(H.chordTone(f.tone, 0), {
            at: syncNow > 0.55 ? A.q(0.5) : 0,
            vol: 0.05, dur: 0.9, attack: 0.01, type: 'sine', pan, rev: 0.55
          }));
        }
      }
    }
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    g.fillStyle = 'rgba(3,2,4,0.35)'; g.fillRect(0, 0, w, h);
    // warmth auras
    for (const [cx, v] of [[w * 0.27, inp.L], [w * 0.73, inp.R]]) {
      if (v < 0.04) continue;
      const gr = g.createRadialGradient(cx, h * 0.6, 10, cx, h * 0.6, w * 0.3);
      gr.addColorStop(0, `rgba(120,50,20,${v * 0.16})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    const sorted = [...s.flies].sort((a, b) => a.depth - b.depth);
    for (const f of sorted) {
      const x = f.x * w, y = f.y * h;
      const side = f.x < 0.5 ? 0 : 1;
      const syncNow = s.sync[side];
      const base = 0.1 + 0.08 * Math.sin(t * 1.4 + f.ph);
      const b = base + f.flash;
      // sync unifies the color toward gold
      const hue = lerp(14 + f.tone * 3, 42, syncNow);
      const sz = (0.8 + f.depth * 1.6) * (1 + f.flash * 2.2);
      if (f.flash > 0.25) {
        const gr = g.createRadialGradient(x, y, 0.5, x, y, sz * 7);
        gr.addColorStop(0, `hsla(${hue},100%,80%,${f.flash * 0.8})`);
        gr.addColorStop(1, `hsla(${hue},100%,60%,0)`);
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, sz * 7, 0, TAU); g.fill();
      }
      g.fillStyle = `hsla(${hue},95%,${58 + f.flash * 30}%,${clamp(b, 0, 1)})`;
      g.beginPath(); g.arc(x, y, sz, 0, TAU); g.fill();
    }
    // sync meters
    g.font = '9px ui-monospace,monospace';
    g.fillStyle = 'rgba(230,180,120,0.7)';
    g.fillText('SYNC W ' + (s.sync[0] * 100 | 0) + '%', 12, h - 12);
    g.textAlign = 'right';
    g.fillText('SYNC E ' + (s.sync[1] * 100 | 0) + '%', w - 12, h - 12);
    g.textAlign = 'left';
  },
  audio(A, P) {
    const v = A.voice();
    const pads = A.padVoices(v, 3, { type: 'triangle', gain: 0.032, cutoff: 300 });
    A.leadToChord(pads, -2, 0.05);
    H.onChord(() => A.leadToChord(pads, -2, 1.6));
    let lastBeat = -1;
    v.fadeIn(1, 1.4);
    return {
      tick() {
        const s = P.state;
        const sync = Math.max(s.sync[0], s.sync[1]);
        const beat = Math.floor(T.beats());
        if (beat !== lastBeat) {
          lastBeat = beat;
          if (sync > 0.4) A.tone(H.rootFreq(-2), { vol: sync * 0.11, dur: 0.4, attack: 0.01, type: 'sine', rev: 0.1 });
          // full synchrony: fire the texture channel (vocal chop territory) every 4 bars
          if (sync > 0.85 && beat % 16 === 0) {
            MOut.evNote('texture', H.chordTone(4, 0), 0.45, T.next(1), 2);
            A.bell(H.chordTone(4, 1), { at: T.next(1), vol: 0.07, dur: 3, rev: 0.7 });
          }
        }
        pads.forEach(p => p.bright(220 + sync * 480, 0.5));
      },
      stop() { v.kill(); }
    };
  }
});
