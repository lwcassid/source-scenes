/* ---------- SRC-58 · THE PASSAGE (forward motion) ----------
   A field of stars and you are moving through it. Every streak on screen is
   not a drawn tail — it is the distance that star actually travelled while
   the shutter was open. Open the shutter (speed) and points become lines,
   because that is what a long exposure does to a moving world.

   THE COLOUR IS A DOPPLER SHIFT, and it comes from the form, never from
   screen position: cos θ = z / |p| is how directly a star lies ahead of the
   motion. Straight ahead it is closing on you and runs blue; out at the
   edges it is passing sideways and stays warm. Turn the speed up and the
   whole field pushes toward ice at the centre. It is one line of physics
   doing all the art direction.

   Ten years of orbit is ten years of passing. This is what that looks like
   from inside — and stars that cross the threshold ring ring out as they go,
   so the music accelerates exactly as fast as the picture does. */
(() => {
  reg({
    id: 'SRC-58', family: 'SRC-58', ver: 1, title: 'BoT · The Passage', tech: 'FORWARD MOTION / TRUE EXPOSURE BLUR',
    textIsContent: true,
    music: {
      bpm: 64, root: 40, mode: 'aeolian', chordBars: 4,
      chords: [
        [0, 7, 12, 19, 26],    // Em9(no3)
        [0, 7, 15, 19, 22],    // Cmaj7/E
        [0, 5, 12, 17, 24],    // Em7sus4
        [0, 8, 14, 20, 27]     // Amadd9/E
      ],
      chordNames: ['Em9(no3)', 'Cmaj7/E', 'Em7sus4', 'Am(add9)/E']
    },
    fx: { bloom: 0.5 },
    tags: ['TEMPLE SET', 'OPEN L = SPEED', 'OPEN R = LIGHT', 'DOPPLER FROM THE FORM'],
    desc: 'You are moving, and the stars are going past. With both hands at the Source it is a still, deep, almost motionless field. Open the left hand and the whole thing pours outward from a point you never quite reach — points stretch into lines, the lines stretch past the frame, and the centre turns blue because what lies straight ahead is closing on you. Open the right and the field lights: more stars burning, brighter, deeper into the dark. Every star that crosses the threshold ring strikes a note on its way out, panned to where it passed — so the further you open, the faster the music falls.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE SPEED, and it is the whole scene in one second — open your arm and everything flies. It changes two things at once because in the real world they are one thing: how fast the field moves, and how long each streak is, since a streak IS how far a star went while the shutter was open. R OPENS THE LIGHT: how many stars are lit, how bright, how deep the field runs. Nothing quantises; the rush is continuous, only the notes land on the grid.',
    sound: 'E aeolian, four bars a chord. The bed is the rush itself — filtered noise whose brightness and level ride the speed, so the hand that moves the picture is audibly the hand that moves the air. Over it: every star crossing the threshold ring plucks ONE note, pitched by how high it passed on screen, panned to which side it left, velocity from its brightness. Speed therefore sets the NOTE RATE, not a tempo — at a crawl it is a slow constellation of single tones, at full rush it is a shower. Sub root on bass, a three-voice pad underneath. Drums stay out: the passage has its own rhythm and it is not a grid.',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const n = Math.min(2200, Math.round(620 * areaScale(P)));
      const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n), br = new Float32Array(n);
      const wasIn = new Uint8Array(n);
      const FAR = 1.0, NEAR = 0.035;
      for (let i = 0; i < n; i++) {
        const a = P.rand() * TAU, rr = Math.pow(P.rand(), 0.5) * 0.72;
        x[i] = Math.cos(a) * rr; y[i] = Math.sin(a) * rr * 0.9;
        z[i] = NEAR + P.rand() * (FAR - NEAR);
        br[i] = 0.25 + Math.pow(P.rand(), 2.2) * 0.75;
        wasIn[i] = 1;
      }
      P.state = { n, x, y, z, br, wasIn, FAR, NEAR, cx: w / 2, cy: h / 2, S,
                  pres: 0, spd: 0, light: 0, drift: P.rand() * 50, events: [], cool: 0, f: S * 0.62 };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;
      const idleS = 0.20 + Math.sin(s.drift * 0.048) * 0.09;
      const idleL = 0.24 + Math.sin(s.drift * 0.071 + 0.8) * 0.09;
      s.spd += ((SOURCE(inp.L) * s.pres + idleS * (1 - s.pres)) - s.spd) * Math.min(1, dt * 6);
      s.light += ((SOURCE(inp.R) * s.pres + idleL * (1 - s.pres)) - s.light) * Math.min(1, dt * 6.5);

      const { n, x, y, z, br, wasIn, FAR, NEAR } = s;
      const v = 0.035 + Math.pow(s.spd, 1.6) * 1.15;      // scene units per second
      const ring = 0.40;                                   // threshold ring, in screen-radius units
      s.cool = Math.max(0, s.cool - dt);
      const cut = 1 - (0.20 + s.light * 0.80);
      for (let i = 0; i < n; i++) {
        z[i] -= v * dt;
        if (z[i] <= NEAR) {   // past you — respawn at the far wall
          const a = P.rand() * TAU, rr = Math.pow(P.rand(), 0.5) * 0.72;
          x[i] = Math.cos(a) * rr; y[i] = Math.sin(a) * rr * 0.9;
          z[i] = FAR; br[i] = 0.25 + Math.pow(P.rand(), 2.2) * 0.75; wasIn[i] = 1;
          continue;
        }
        // the crossing: projected radius passing the ring, outward
        const pr = Math.sqrt(x[i] * x[i] + y[i] * y[i]) * (s.f / z[i]) / s.S;
        const inside = pr < ring ? 1 : 0;
        if (wasIn[i] && !inside && br[i] > cut && s.cool <= 0 && s.pres > 0.15) {
          s.events.push({ pan: clamp((x[i] * (s.f / z[i])) / (P.w * 0.5) * 0.5 + 0.5) * 2 - 1,
                          hi: clamp(0.5 - (y[i] * (s.f / z[i])) / (P.h * 0.9)),
                          vel: br[i] });
          s.cool = 0.055 + (1 - s.spd) * 0.30;
        }
        wasIn[i] = inside;
      }
      s.v = v;
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      // HOSTED BY THE MIXER: the ground is painted once, by the mixer, and a
      // layer that repaints it erases every layer under it. Standalone this
      // is unchanged.
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const bright = (0.5 + s.pres * 0.5) * room;
      const { n, x, y, z, br, f, cx, cy } = s;
      const cut = 1 - (0.20 + s.light * 0.80);
      const EXP = 0.026 + Math.pow(s.spd, 1.4) * 0.12;      // shutter, in seconds
      const BK = 5, paths = []; for (let b = 0; b < BK; b++) paths.push([]);

      for (let i = 0; i < n; i++) {
        if (br[i] < cut) continue;
        const z0 = z[i], z1 = Math.max(s.NEAR * 0.9, z[i] + s.v * EXP);   // where it was when the shutter opened
        const k0 = f / z0, k1 = f / z1;
        const ax = cx + x[i] * k1, ay = cy + y[i] * k1;
        const bx = cx + x[i] * k0, by = cy + y[i] * k0;
        if (bx < -w || bx > w * 2 || by < -h || by > h * 2) continue;
        // DOPPLER: how directly this star lies ahead of the motion
        const rad = Math.sqrt(x[i] * x[i] + y[i] * y[i]);
        const cosT = z0 / Math.sqrt(rad * rad + z0 * z0);
        // ^1.8 spreads the shift across the frame instead of pinning almost
        // everything at the blue end the moment the speed comes up
        const blue = clamp(Math.pow(cosT, 1.8) * (0.30 + s.spd * 0.85));
        const depth = clamp(1 - z0 / s.FAR);
        const bk = Math.min(BK - 1, ((blue * 0.65 + depth * 0.35) * BK) | 0);
        paths[bk].push(ax, ay, bx, by, br[i] * (0.35 + depth * 0.65));
      }

      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      for (let b = 0; b < BK; b++) {
        const arr = paths[b]; if (!arr.length) continue;
        const fb = (b + 0.5) / BK;
        const r = Math.round(255 - fb * 95);
        const gg = Math.round(196 + fb * 44);
        const bb = Math.round(150 + fb * 105);
        g.strokeStyle = `rgba(${r},${gg},${bb},${(0.07 + s.light * 0.30) * bright})`;
        g.lineWidth = (0.7 + fb * 1.9) * ms;
        g.beginPath();
        for (let j = 0; j < arr.length; j += 5) { g.moveTo(arr[j], arr[j + 1]); g.lineTo(arr[j + 2], arr[j + 3]); }
        g.stroke();
      }

      // the vanishing point: a breath of blue where everything is coming from
      const vr = Math.min(w, h) * (0.05 + s.spd * 0.09);
      const vg = g.createRadialGradient(cx, cy, 0, cx, cy, vr);
      vg.addColorStop(0, `rgba(150,205,255,${(0.05 + s.spd * 0.20) * s.light * bright})`);
      vg.addColorStop(1, 'rgba(150,205,255,0)');
      g.fillStyle = vg; g.beginPath(); g.arc(cx, cy, vr, 0, TAU); g.fill();

      // HOSTED: the mixer draws the readout for the whole movement. A layer
      // that also draws its own puts two lines of text on the same pixels.
      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {

        g.globalCompositeOperation = 'source-over';

        g.fillStyle = 'rgba(225,225,235,0.8)';

        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;

        g.fillText('SPEED ' + Math.round(s.spd * 100) + '   LIGHT ' + Math.round(s.light * 100) + '   SHUTTER ' + (EXP * 1000).toFixed(0) + 'ms' + (s.pres < 0.3 ? '   · DRIFTING' : ''), 10, h - 10);

      }

      // HOSTED: the mixer runs the poems once for the whole movement. Left in,
      // this ran the overlay once PER LIVE LAYER — the dark plate stacked and
      // the text was painted over itself three times a frame.
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      const v = A.voice();
      const pad = A.padVoices(v, 3, { type: 'triangle', gain: 0.004, cutoff: 220, q: 0.7, midi: false });
      const place = gl => A.leadToChord(pad, -1, gl); place(0.05);
      const sub = v.osc('sine', 41), sg = v.g(0.022); sub.connect(sg); sg.connect(v.group);
      // the rush: the bed IS the speed
      const nz = A.ctx.createBufferSource(); nz.buffer = A.noiseBuf(); nz.loop = true;
      const nf = v.filter('bandpass', 500, 0.9), ng = v.g(0.0001);
      nz.connect(nf); nf.connect(ng); ng.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.55; ng.connect(sd); sd.connect(A.revIn); }
      try { nz.start(); } catch (e) {}
      const tune = gl => A.set(sub.frequency, H.chordTone(0, -2), gl); tune(0.05);
      H.onChord(() => { place(0.35); tune(0.3); });
      v.fadeIn(1, 1.8);
      return {
        tick(inp, dt) {
          const s = P.state, gate = 0.3 + s.pres * 0.7, S = s.spd, L = s.light;
          A.set(ng.gain, (0.0008 + S * 0.011) * (0.4 + L * 0.8) * gate, 0.25);
          A.set(nf.frequency, 320 + S * 2600, 0.25);
          try { nf.Q.setTargetAtTime(0.7 + S * 2.5, A.t(), 0.3); } catch (e) {}
          pad.forEach(p => { p.level((0.0018 + L * 0.0035) * gate, 0.4); p.bright(180 + L * 600 + S * 400, 0.3); });
          A.set(sg.gain, (0.016 + S * 0.016) * gate, 0.3);
          let fired = 0;
          while (s.events.length) {
            const e = s.events.shift();
            if (fired++ > 3) continue;
            const deg = Math.round(e.hi * 4);
            A.pluck2(H.chordTone(deg, e.hi > 0.62 ? 1 : 0), { vol: (0.006 + e.vel * 0.030) * (0.3 + L * 0.7) * gate, dur: 1.6, rev: 0.7, del: 0.3, pan: e.pan * 0.8 });
          }
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('texture', S); MOut.expr('lead', L); MOut.expr('bass', S); }
        },
        stop() { try { nz.stop(); } catch (e) {} v.kill(); }
      };
    }
  });
})();
