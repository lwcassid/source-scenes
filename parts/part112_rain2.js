/* ---------- SRC-16.2 · RAIN ATRIUM V2 (finer rain) ---------- */
/* Feedback (Aug 2026): ripples read too big on the wall, and each drop
   made only a single ring. V2 keeps the exact same instrument — density
   as paradigm, pentatonic plinks, stereo weather — but:
   - raises the heightfield grid 1/0.75 (132×82 → 176×109), so every
     ripple covers 25% less of the frame: smaller, finer circles.
   - each drop now deposits a profiled crown (a central dip ringed by a
     raised crest) instead of a single dimple, so one drop throws several
     concentric wavefronts — more ripples per drop — and the downpour is
     denser. */
reg({
  id: 'SRC-16.2', family: 'SRC-16', ver: 2, title: 'Rain Atrium V2', tech: 'HEIGHTFIELD WATER / TWO CLOUDS',
  music: { bpm: 64, root: 50, mode: 'ionian', prog: [0, 3, 4, 0] }, fx: { bloom: 0.4, edge: true },
  tags: ['WAVE EQUATION', 'DENSITY CONTROL', 'PENTATONIC PLINKS', 'STEREO WEATHER'],
  desc: 'A dark pool under two private clouds — now a finer rain. The left cloud rains only on the left of the water, the right cloud on the right, and every drop throws not one ring but a little nest of them that argues with every other drop\'s. Smaller circles, more of them: the interference in the middle is busier, the pool reads as real weather. Hands high, downpour; hands low, the last circles widen and the pool goes back to holding still.',
  interact: 'L = rain density over the left half, R = right. Interference is the secret content: medium rain from both sides makes moiré where the ring systems collide in the middle. Density, not position — a third paradigm for what a hand can mean.',
  sound: 'Plinks: each drop is a pentatonic note — x-position picks the degree (low notes left, high right), drop size → volume, everything through a bright short reverb (Ableton: rack of tuned Operator sines or a music-box sampler; velocity random 20%). Bed: real rain-on-glass noise layer per side, gain = that hand\'s density, panned hard. When both hands are high, duck the plinks 3dB under the noise — downpours drown melodies, and that is correct.',
  init(P) {
    // grid 1/0.75 finer than V1 (132×82) → ripples 25% smaller in the frame
    const W = 176, H = 109;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    P.state = {
      W, H, cur: new Float32Array(W * H), prev: new Float32Array(W * H),
      oc, og: oc.getContext('2d'), img: new ImageData(W, H)
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, H, cur, prev } = s;
    // profiled deposit: central dip ringed by a raised crown, so ONE drop
    // launches several concentric wavefronts (more ripples per drop)
    const deposit = (cx, cy, amp) => {
      for (let dy = -2; dy <= 2; dy++) {
        const yy = cy + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const xx = cx + dx; if (xx < 0 || xx >= W) continue;
          const rr = Math.sqrt(dx * dx + dy * dy);
          // cos(rr*1.6): +1 dip at centre, flips to a crest near rr≈2
          const prof = Math.cos(rr * 1.6) * Math.exp(-rr * rr * 0.5);
          cur[yy * W + xx] -= amp * prof;
        }
      }
    };
    // drops — denser than V1 (rate 15 → 21) for more rings on the water
    const tryDrop = (side, dens) => {
      if (P.rand() < dens * dens * dt * 21) {
        const x = (side === 0 ? P.rand() * 0.48 : 0.52 + P.rand() * 0.46) * W | 0;
        const y = (P.rand() * (H - 8) + 4) | 0;
        const amp = 1.2 + P.rand() * 2.2;
        deposit(x, y, amp);
        const deg = Math.round((x / W) * 9);
        const duck = 1 - 0.55 * clamp(inp.L + inp.R - 1); // downpours drown melodies
        const vol = clamp(amp * 0.04, 0.03, 0.12) * duck;
        P.ping(A => A.pluck2(H.scaleTone(deg, 1), { at: A.q(), vol, dur: 0.9, pan: (x / W) * 2 - 1, rev: 0.45 }));
      }
    };
    tryDrop(0, inp.L); tryDrop(1, inp.R);
    // downpour: distant thunder on the texture channel (rack your real thunder samples there)
    if (inp.L > 0.72 && inp.R > 0.72 && P.rand() < dt * 0.1) {
      P.ping(A => {
        MOut.evNote('texture', H.rootFreq(-3), 0.5, A.q(1), 3.5);
        A.hit({ vol: 0.3, dur: 1.1, freq: 75, q: 0.5, type: 'lowpass', at: A.q(1) });
      });
    }
    // wave step
    const next = prev; // reuse buffer
    for (let y = 1; y < H - 1; y++) {
      const y0 = y * W;
      for (let x = 1; x < W - 1; x++) {
        const i = y0 + x;
        next[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) / 2 - next[i]) * 0.976;
      }
    }
    s.prev = cur; s.cur = next;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state, { W, H, cur, img } = s;
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const l = x > 0 ? cur[i - 1] : 0, r = x < W - 1 ? cur[i + 1] : 0;
        const u = y > 0 ? cur[i - W] : 0, dn = y < H - 1 ? cur[i + W] : 0;
        const shade = (l - r) * 0.9 + (u - dn) * 0.6;
        // finer grid → gentler per-cell slopes; lift the crest gain to keep
        // ripples catching the same light they did at V1's resolution
        const crest = clamp(shade * 1.4, -0.06, 1);
        // moonlit water: indigo depths, silver crests
        d[i * 4] = 7 + Math.max(0, crest) * 165;
        d[i * 4 + 1] = 10 + Math.max(0, crest) * 190;
        d[i * 4 + 2] = 26 + Math.max(0, crest) * 224;
        d[i * 4 + 3] = 255;
      }
    }
    s.og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(s.oc, 0, 0, w, h);
    // clouds
    for (const [side, v] of [[0, inp.L], [1, inp.R]]) {
      const cx = w * (side === 0 ? 0.25 : 0.75), cy = 26;
      g.fillStyle = `rgba(160,200,215,${0.25 + v * 0.55})`;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(cx + (k - 1.5) * 13, cy + Math.sin(t + k) * 2, 9 + (k % 2) * 4, 0, TAU);
        g.fill();
      }
      // falling streaks
      g.strokeStyle = `rgba(170,220,235,${v * 0.5})`;
      g.lineWidth = 1;
      for (let k = 0; k < Math.round(v * 6); k++) {
        const rx = cx + (P.rand() - 0.5) * 60, ry = 40 + ((t * 260 + k * 47) % (h - 60));
        g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx - 2, ry + 9); g.stroke();
      }
    }
  },
  audio(A, P) {
    const v = A.voice();
    const mkRain = pan => {
      const n = v.noise();
      const f = v.filter('bandpass', 5500, 0.6);
      const gg = v.g(0);
      n.connect(f); f.connect(gg);
      if (A.ctx.createStereoPanner) {
        const p = A.ctx.createStereoPanner(); p.pan.value = pan;
        gg.connect(p); p.connect(v.group);
      } else gg.connect(v.group);
      return gg;
    };
    const gL = mkRain(-0.7), gR = mkRain(0.7);
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        A.set(gL.gain, inp.L * inp.L * 0.055, 0.25);
        A.set(gR.gain, inp.R * inp.R * 0.055, 0.25);
      },
      stop() { v.kill(); }
    };
  }
});
