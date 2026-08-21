/* ---------- SRC-16.3 · RAIN ATRIUM V3 (bird's-eye pool) ---------- */
/* Direction (Aug 2026): drop the sky. No clouds, no falling streaks, no
   left/right weather split — just the water seen from directly above, and
   the rings drops write on it. The two hands become two global qualities of
   the same rain instead of two halves of the pool:
     L = amount of RIPPLING — how much energy each drop carries (bigger,
         longer-reaching rings with more concentric wavefronts).
     R = amount of RAIN — how many drops fall per second.
   Left hand alone: a few slow drops that ring hard and spread wide.
   Right hand alone: a fine dense drizzle of small dimples. Both up: a
   full downpour of big overlapping rings — the interference is the content. */
reg({
  id: 'SRC-16.3', family: 'SRC-16', ver: 3, title: 'Rain Atrium V3', tech: "BIRD'S-EYE POOL / DROP RIPPLES",
  music: { bpm: 64, root: 50, mode: 'ionian', prog: [0, 3, 4, 0] }, fx: { bloom: 0.4, edge: true },
  tags: ['WAVE EQUATION', "BIRD'S-EYE POOL", 'L = RIPPLE ENERGY', 'R = RAIN AMOUNT'],
  desc: 'A still black pool seen from straight above — no sky, no walls, no sides. Rain falls onto it and every drop writes a nest of rings that argues with every other drop\'s. One hand decides how hard the water rings, the other how hard it rains; together they run the whole surface from a quiet dimpling to a full downpour of overlapping circles.',
  interact: 'L = amount of RIPPLING (how much each drop rings — size, reach, number of wavefronts). R = amount of RAIN (how many drops fall). Reach outward on either hand for more. Density and energy, not position — the drops land everywhere; you shape the weather, not where it falls.',
  sound: 'Plinks: each drop is a pentatonic note — x-position across the full pool picks the degree (low left, high right), ripple energy (L) → loudness, everything through a bright short reverb (Ableton: tuned Operator sines or a music-box sampler; velocity random 20%). Bed: rain-on-glass noise, gain = R (amount of rain), spread stereo. When both hands are high, distant thunder on the texture channel — silence between drops is what makes it land.',
  init(P) {
    // finer heightfield → small, dense rings that read as real rain from above
    const W = 176, H = 109;
    const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
    P.state = {
      W, H, cur: new Float32Array(W * H), prev: new Float32Array(W * H),
      oc, og: oc.getContext('2d'), img: new ImageData(W, H)
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, { W, H, cur, prev } = s;
    const ripple = inp.L; // amount of rippling — per-drop energy
    const rain = inp.R;   // amount of rain — drop rate
    // profiled deposit: central dip ringed by a raised crown, so ONE drop
    // launches several concentric wavefronts. Crown radius + amplitude grow
    // with ripple energy (L), so the left hand literally widens the rings.
    const deposit = (cx, cy, amp, energy) => {
      const rad = 2 + Math.round(energy * 2);   // 2..4 cells: L reaches wider
      const k = 1.6 - energy * 0.5;             // lower freq at high energy → fatter rings
      for (let dy = -rad; dy <= rad; dy++) {
        const yy = cy + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -rad; dx <= rad; dx++) {
          const xx = cx + dx; if (xx < 0 || xx >= W) continue;
          const rr = Math.sqrt(dx * dx + dy * dy);
          if (rr > rad) continue;
          const prof = Math.cos(rr * k) * Math.exp(-rr * rr / (rad * rad * 0.9));
          cur[yy * W + xx] -= amp * prof;
        }
      }
    };
    // drops land ANYWHERE on the pool; rate from R, energy from L
    if (P.rand() < rain * rain * dt * 26) {
      const x = (0.04 + P.rand() * 0.92) * W | 0;
      const y = (0.05 + P.rand() * 0.90) * H | 0;
      const amp = (0.5 + P.rand() * 1.4) * (0.45 + ripple * 2.1); // L scales ring strength
      deposit(x, y, amp, ripple);
      const deg = Math.round((x / W) * 9);
      const vol = clamp(amp * 0.03, 0.03, 0.13);
      P.ping(A => A.pluck2(H.scaleTone(deg, 1), { at: A.q(), vol, dur: 0.9, pan: (x / W) * 2 - 1, rev: 0.45 }));
    }
    // downpour: distant thunder on the texture channel when it's both hard rain
    // and hard rippling (rack your real thunder samples there)
    if (rain > 0.78 && ripple > 0.6 && P.rand() < dt * 0.1) {
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
        // finer grid → gentler slopes; lift crest gain to keep rings catching light
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
    // NO clouds, NO falling streaks — pure top-down pool.
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
    const gL = mkRain(-0.6), gR = mkRain(0.6);
    v.fadeIn(1, 0.8);
    return {
      tick(inp) {
        // rain bed gain follows R (amount of rain), spread across the field
        const rain = inp.R * inp.R * 0.06;
        A.set(gL.gain, rain, 0.25);
        A.set(gR.gain, rain, 0.25);
      },
      stop() { v.kill(); }
    };
  }
});
