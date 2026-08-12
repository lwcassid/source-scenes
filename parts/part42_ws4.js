/* ---------- SRC-10.4 · WEATHER STATION V4 (firefly collector) ----------
   Iteration on V2 (SRC-10.2, firefly lanterns). Feedback answered:
   1. ONE luminous collector on a horizontal axis (not two lanterns). Reach
      sweeps it L/R and widens its net; fireflies spiral into orbit. Bring both
      hands in together to CHARGE (swarm cinches into a tight fast core, music
      tightens); throw hands apart to EXPLODE — stars burst, layers reset.
   2. Fluid motion restored: an actual flow field with tails (the V1/V2 feel),
      not static fireflies.
   3. Ambient = slow, dim sparkles evenly scattered (a tease). Presence grows
      tails + wind; leaving redistributes the field and clears the orbit.
   4. Three firefly COLORS = three musical layers you capture into the song:
      amber → bells, teal → pad swell, violet → arp. Explode to start fresh.
   NOTE (versioning): id/ver below are the next free slot as of authoring. If a
   sibling Weather Station version lands first, bump BOTH `ver` and the `.N` in
   `id` by one before the deploy that wins — nothing else needs to change. */
reg({
  id: 'SRC-10.4', family: 'SRC-10', ver: 5,
  title: 'Weather Station V4', tech: 'FIREFLY COLLECTOR / FLUID WIND',
  music: { bpm: 60, root: 43, mode: 'aeolian', prog: [0, 5], chordBars: 4 },
  fx: { bloom: 0.6, edge: true },
  tags: ['ONE COLLECTOR ORB', 'REACH = SWEEP + NET', 'CLENCH TO CHARGE', 'THROW TO EXPLODE', 'COLOR = LAYER'],
  desc: 'The dark wind is full of fireflies. At rest they drift as faint, slow sparkles — a tease. Reach and a single luminous collector wakes on the horizon line: sweep it left and right with your hands, and every firefly it passes bends out of the wind and spirals into orbit around it. The flies come in three colors, and each color you gather adds its own voice to the song — amber bells, a teal swell, a violet arp. Draw both hands in together and the whole swarm cinches into a tight, quickening core that charges brighter and brighter… then fling your hands apart and it detonates into a sky of stars, and the weather starts fresh.',
  interact: 'Reach outward with either hand to sweep the collector along the horizontal axis (R pulls it right, L pulls it left) and to widen its net — both hands out grabs the whole field. Fireflies caught in the net orbit the orb and their color layer fades up in the music. Bring both hands in close together and hold: the orbit tightens and CHARGES (watch the orb brighten and pulse on the beat). Throw your hands wide while charged to EXPLODE — the flies scatter as stars, every layer resets, and the field redistributes. Walk away and it drifts back to sleep.',
  sound: 'Under everything, low aeolian wind (noise → LP, opening with presence and capture). Three capture layers ride the three firefly colors: amber energy → bell chord-tones on the grid, teal energy → a sustained voice-led pad swell, violet energy → a pluck arp climbing the chord ladder. Pitch and stereo pan of the bells follow the orb along the axis. Charging tightens every subdivision and lifts the filters; the explosion is a sub thump + a fanned bell cascade (stars) that empties the mix so it can build again. Ableton: wind→texture, pad→pad, bells→bells, arp→lead, boom→perc/sfx; CC74 on texture+pad from capture.',
  init(P) {
    const as = areaScale(P);
    const n = Math.min(680, Math.round(300 * as));
    const flies = [];
    for (let i = 0; i < n; i++) flies.push({
      x: P.rand() * P.w, y: P.rand() * P.h, px: 0, py: 0, vx: 0, vy: 0,
      hx: P.rand() * P.w, hy: P.rand() * P.h,          // ambient home (even scatter)
      g: i % 3,                                        // 0 amber · 1 teal · 2 violet
      ph: P.rand() * TAU,                              // flow-field personal phase
      fr: 0.22 + P.rand() * 0.28,                      // base flash rate
      fc: P.rand(), env: 0, cap: 0
    });
    P.state = {
      flies, head: P.rand() * TAU, pres: 0,
      orbX: P.w * 0.5, orbY: P.h * 0.5, capR: 40,
      en: [0, 0, 0], charge: 0, clenchSm: 0, prevReach: 0,
      cool: 0, boom: 0, shock: 0, boomReq: false, arpI: 0
    };
  },
  step(P, dt, t, inp) {
    const s = P.state, w = P.w, h = P.h, pw = Math.pow;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * 1.6);
    const pres = s.pres;
    s.head += dt * (0.05 + Math.sin(t * 0.11) * 0.04);

    const reach = (inp.L + inp.R) * 0.5;             // 0 (both in) → 1 (both out)
    const balance = inp.R - inp.L;                   // -1 (left) → +1 (right)
    const cx = w * 0.5, cy = h * 0.5;
    s.orbX += (cx + balance * w * 0.33 - s.orbX) * Math.min(1, dt * 6);
    s.orbY = cy;
    const R0 = Math.min(w, h) * 0.15;
    // net widens with reach OR with charge (charging hoovers the whole field in
    // while the orbit ring below cinches tight — the "pull in ALL" surprise)
    const capR = R0 * (0.6 + Math.max(reach * 1.9, s.charge * 1.7));
    s.capR = capR;

    // charge / explode machine
    const clench = clamp(1 - inp.L) * clamp(1 - inp.R);   // 1 when both hands in
    s.clenchSm += (clench - s.clenchSm) * Math.min(1, dt * 4);
    const orbitFrac = (s.en[0] + s.en[1] + s.en[2]) / 3;
    if (s.cool > 0) s.cool -= dt;
    const charging = pres > 0.45 && orbitFrac > 0.12 && clench > 0.5 && s.cool <= 0;
    s.charge = charging ? Math.min(1, s.charge + dt * 0.5) : Math.max(0, s.charge - dt * 0.85);
    const released = clench < s.clenchSm - 0.16;
    if (s.charge > 0.55 && s.cool <= 0 && (reach > 0.62 || released)) {
      // EXPLODE — fling everything outward as stars, reset the mix
      for (const fl of s.flies) {
        const dx = fl.x - s.orbX, dy = fl.y - s.orbY, d = Math.hypot(dx, dy) + 1e-3;
        const sp = 240 + P.rand() * 300;
        fl.vx = dx / d * sp; fl.vy = dy / d * sp;
        fl.cap = 0; fl.env = 1;
      }
      s.charge = 0; s.cool = 1.4; s.boom = 1; s.shock = 0; s.boomReq = true;
    }
    s.prevReach = reach;
    if (s.boom > 0) { s.boom = Math.max(0, s.boom - dt * 0.6); s.shock += dt; }

    const turb = 0.35 + pres * 1.1;
    const wspd = 6 + pres * 46;
    const cnt = [0, 0, 0], tot = [0, 0, 0];
    for (const fl of s.flies) {
      tot[fl.g]++;
      const dx = s.orbX - fl.x, dy = s.orbY - fl.y, d = Math.hypot(dx, dy) + 1e-3;
      // capture with hysteresis so cinching the net inward doesn't drop the swarm
      let cap = 0;
      if (s.cool <= 0) {
        const lim = fl.cap > 0.3 ? capR * 1.9 : capR;
        if (d < lim) cap = clamp(1 - d / (capR * 1.4));
      }
      fl.cap += (cap - fl.cap) * Math.min(1, dt * 3);
      fl.px = fl.x; fl.py = fl.y;
      if (fl.cap > 0.03) {
        // orbit: converge onto a ring (shrinks as it charges), plus tangential spin
        const ring = capR * (0.28 + ((fl.fr * 131) % 1) * 0.16) * (1 - s.charge * 0.55);
        const gain = Math.min(1, dt * (1.4 + reach * 2)) * fl.cap;
        fl.x += dx / d * (d - ring) * gain;
        fl.y += dy / d * (d - ring) * gain;
        const spin = (42 + s.charge * 170) * dt * (0.6 + fl.cap);
        fl.x += -dy / d * spin; fl.y += dx / d * spin;
        fl.vx *= pw(0.02, dt); fl.vy *= pw(0.02, dt);
        if (fl.cap > 0.35) cnt[fl.g]++;
      } else {
        // fluid flow field — the movement V1/V2 had
        const a = s.head
          + turb * Math.sin(fl.x * 0.008 + t * 0.3 + fl.ph)
          + turb * Math.cos(fl.y * 0.01 - t * 0.24 + fl.ph * 0.5);
        fl.vx += (Math.cos(a) * wspd - fl.vx) * Math.min(1, dt * 3);
        fl.vy += (Math.sin(a) * wspd * 0.7 - fl.vy) * Math.min(1, dt * 3);
        // charging drags every stray fly toward the core, so it gathers ALL of them
        if (s.charge > 0.01) { fl.vx += dx / d * s.charge * 300 * dt; fl.vy += dy / d * s.charge * 300 * dt; }
        fl.vx *= pw(0.5, dt); fl.vy *= pw(0.5, dt);
      }
      fl.x += fl.vx * dt; fl.y += fl.vy * dt;
      // ambient: ease back to an even scatter so a stale swarm redistributes
      if (pres < 0.3) {
        fl.x += (fl.hx - fl.x) * dt * 0.16;
        fl.y += (fl.hy - fl.y) * dt * 0.16;
      }
      if (fl.x < -12) fl.x = w + 12; if (fl.x > w + 12) fl.x = -12;
      if (fl.y < -12) fl.y = h + 12; if (fl.y > h + 12) fl.y = -12;
      // flash clock — slower + dimmer at rest, quicker when caught / charging
      const rate = fl.fr * (0.32 + pres * 1.0) * (1 + s.charge * 1.6) * (fl.cap > 0.1 ? 0.7 + fl.cap : 1);
      fl.fc += dt * rate;
      if (fl.fc > 1) { fl.fc = 0; fl.env = 1; }
      fl.env = Math.max(0, fl.env - dt * (2.0 + s.charge * 2.4));
    }
    for (let k = 0; k < 3; k++) s.en[k] += (cnt[k] / Math.max(1, tot[k]) - s.en[k]) * Math.min(1, dt * 2.5);
  },
  draw(P, g, w, h, t) {
    const s = P.state, as = areaScale(P), ms = Math.max(1, Math.sqrt(as));
    const pres = s.pres || 0;
    g.fillStyle = `rgba(6,8,10,${0.16 + pres * 0.14})`; g.fillRect(0, 0, w, h);
    const HUE = [40, 175, 275], vis = 0.4 + pres * 0.6;
    // fireflies + tails
    for (const fl of s.flies) {
      const hue = HUE[fl.g], e = fl.env, cb = fl.cap;
      const sp = Math.hypot(fl.x - fl.px, fl.y - fl.py);
      if (pres > 0.14 && sp > 0.5 && sp < 90 * ms) {   // cap kills full-screen wrap-teleport tails
        const a = clamp((0.04 + sp * 0.02) * pres + cb * 0.22);
        g.strokeStyle = `hsla(${hue},${58 + cb * 32}%,${54 + e * 30}%,${a})`;
        g.lineWidth = (0.8 + cb * 1.7 + e * 1.1) * ms;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(fl.px, fl.py); g.lineTo(fl.x, fl.y); g.stroke();
      }
      if (e > 0.05) {
        const rr = (1.6 + e * 4.6 + cb * 2.4) * ms;
        const gr = g.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, rr);
        gr.addColorStop(0, `hsla(${hue},92%,${72 + e * 20}%,${e * 0.95 * vis})`);
        gr.addColorStop(1, `hsla(${hue},92%,70%,0)`);
        g.fillStyle = gr;
        g.beginPath(); g.arc(fl.x, fl.y, rr, 0, TAU); g.fill();
      } else {
        g.fillStyle = `hsla(${hue},52%,${44 + cb * 22}%,${(0.14 + cb * 0.42) * vis})`;
        g.beginPath(); g.arc(fl.x, fl.y, (1 + cb) * ms, 0, TAU); g.fill();
      }
    }
    // the collector orb (wakes with presence)
    if (pres > 0.03) {
      const en = s.en, gath = (en[0] + en[1] + en[2]) / 3;
      const beat = (typeof T !== 'undefined') ? T.beatPulse() : 0;
      const pulse = 1 + s.charge * beat * 0.5;
      const cr = (10 + gath * 16 + s.charge * 10) * ms * pulse;
      // faint net ring so the reach reads
      g.strokeStyle = `rgba(150,180,200,${0.05 + s.charge * 0.12})`;
      g.lineWidth = 1.2 * ms;
      g.beginPath(); g.arc(s.orbX, s.orbY, s.capR, 0, TAU); g.stroke();
      // hot core, warms as it charges
      const tint = 40 - s.charge * 12;
      const gr = g.createRadialGradient(s.orbX, s.orbY, 1, s.orbX, s.orbY, cr * 2.2);
      gr.addColorStop(0, `hsla(${tint},100%,${88}%,${(0.6 + s.charge * 0.35) * pres})`);
      gr.addColorStop(0.35, `hsla(${tint},95%,72%,${0.18 * pres})`);
      gr.addColorStop(1, `hsla(${tint},95%,70%,0)`);
      g.fillStyle = gr;
      g.beginPath(); g.arc(s.orbX, s.orbY, cr * 2.2, 0, TAU); g.fill();
      g.strokeStyle = `hsla(${tint},100%,90%,${(0.5 + s.charge * 0.4) * pres})`;
      g.lineWidth = (1.4 + s.charge * 1.6) * ms;
      g.beginPath(); g.arc(s.orbX, s.orbY, cr * 0.55, 0, TAU); g.stroke();
    }
    // explosion shockwave
    if (s.boom > 0) {
      const rad = s.shock * Math.min(w, h) * 1.1;
      g.strokeStyle = `rgba(255,240,210,${s.boom * 0.5})`;
      g.lineWidth = (2 + s.boom * 5) * ms;
      g.beginPath(); g.arc(s.orbX, s.orbY, rad, 0, TAU); g.stroke();
    }
    g.fillStyle = 'rgba(150,200,220,0.8)'; g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    const p2 = x => Math.round(x * 100);
    g.fillText('ORBIT  A' + p2(s.en[0]) + ' T' + p2(s.en[1]) + ' V' + p2(s.en[2]) +
      '   CHARGE ' + p2(s.charge) + '%' + (pres < 0.3 ? '   · SLEEPING' : ''), 10, h - 10);
  },
  audio(A, P) {
    const v = A.voice();
    const n = v.noise();
    const f = v.filter('lowpass', 400, 0.6);
    const ng = v.g(0.02);
    n.connect(f); f.connect(ng); ng.connect(v.group);
    const pads = A.padVoices(v, 2, { type: 'sawtooth', gain: 0.0001, cutoff: 700, q: 0.6 });
    A.leadToChord(pads, 0, 0.01);
    H.onChord(() => A.leadToChord(pads, 0, 0.9));
    v.fadeIn(1, 1);
    let nextBell = T.next(2), nextArp = T.next(1);
    function boom() {
      const at = A.t() + 0.02;
      A.kick(at, 0.34);
      A.bassNote(H.rootFreq(-1), { at, vol: 0.16, dur: 1.6 });
      for (let i = 0; i < 7; i++) {
        A.bell(H.chordTone(i, 1), { at: at + i * 0.045, vol: 0.09, dur: 2.6, pan: (i / 6 * 2 - 1) * 0.7, rev: 0.85 });
      }
      if (typeof MOut !== 'undefined') MOut.sfxNote(38, 0.8, 2);
    }
    return {
      tick() {
        const s = P.state, pres = s.pres || 0, en = s.en || [0, 0, 0];
        const cap = en[0] + en[1] + en[2];
        const orbPan = clamp((s.orbX / P.w) * 2 - 1);
        A.set(ng.gain, 0.013 + pres * 0.03 + cap * 0.012, 0.3);
        A.set(f.frequency, 360 + en[1] * 1300 + s.charge * 1900, 0.25);
        // teal pad swell
        for (const pd of pads) { pd.level(en[1] * 0.06, 0.3); pd.bright(560 + en[1] * 1500 + s.charge * 1500, 0.3); }
        if (typeof MOut !== 'undefined') { MOut.expr('texture', pres * 0.5 + en[1] * 0.5); MOut.expr('pad', en[1]); }
        if (s.boomReq) { s.boomReq = false; boom(); }
        const horizon = A.t() + 0.15;
        // amber bells — pitch + pan follow the orb along the axis
        while (nextBell < horizon) {
          if (en[0] > 0.1) {
            const deg = Math.round((s.orbX / P.w) * 7);
            const vol = Math.min(0.14, 0.02 + en[0] * 0.12);
            A.bell(H.chordTone(deg, 1), { at: nextBell, vol, dur: 3, pan: orbPan * 0.6, rev: 0.72 });
          }
          const iv = en[0] < 0.4 ? 2 : en[0] < 0.75 ? 1 : 0.5;
          nextBell += T.beat * (s.charge > 0.5 ? Math.max(0.5, iv * 0.5) : iv);
        }
        // violet arp — climbs the chord ladder
        while (nextArp < horizon) {
          if (en[2] > 0.12) {
            const seq = [0, 2, 4, 3, 5, 4, 2, 1];
            const deg = seq[(s.arpI = (s.arpI + 1) % seq.length)];
            const vol = Math.min(0.13, 0.02 + en[2] * 0.1);
            A.pluck2(H.chordTone(deg, 1), { at: nextArp, vol, dur: 0.9, pan: orbPan * 0.5, rev: 0.3 });
          }
          const iv = en[2] < 0.5 ? 1 : 0.5;
          nextArp += T.beat * (s.charge > 0.5 ? 0.5 : iv);
        }
        if (nextBell < A.t()) nextBell = T.next(2);
        if (nextArp < A.t()) nextArp = T.next(1);
      },
      stop() { v.kill(); }
    };
  }
});
