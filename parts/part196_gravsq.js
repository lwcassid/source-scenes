/* ---------- SRC-48 · GRAVITY SQUARES V1 (the sheet sorts itself) ------------
   Nima's reference: a relief of hundreds of paper squares, every size mixed,
   packed edge to edge into one ragged sheet — big plates in the middles,
   small ones filling the seams, each lit from the same corner so the whole
   wall reads as light with black gaps for shadow.

   The claim this scene takes in the audio-in family is THE LAYOUT. Cell
   Front owns three pockets with hand-painted colour; Penrose Bloom owns a
   growth front sized by loudness and a lattice coloured by spectrum. Here
   the music does not tint anything and does not move a front — it changes
   HOW MUCH AREA each voice owns and WHERE ITS PLATES SIT, and the packing
   physically re-settles around the answer. A kick does not brighten the
   sheet, it makes the bass plates GROW and shove their neighbours out of
   the way; you read the beat as a crowd being pushed.

   THE GRAVITY. Every square carries a band (bass plates are the big ones,
   treble the small ones, mid between) and a mass that goes with its size.
   Each band has a territory — bass to the LEFT, treble to the RIGHT, mid in
   the middle — and a square is pulled toward its own territory with a force
   proportional to BOTH its mass and its band's current level. So at ambient
   the pull is nothing and the sheet is one uniform salt-and-pepper plate,
   the reference exactly; as a track comes up the crowd SORTS — an amber
   region of big slow plates gathering left, a violet drift of small fast
   ones right, heavy plates sinking to the cores and the small ones squeezed
   out to fill the margins. Separation is axis-aligned (push apart along the
   shallower overlap), which is why the packing comes out orthogonal and
   brick-like instead of like circles in a bag.

   THE HANDS, one continuous job each, both immediate:
   · LEFT · GRAIN. Lean in and the sheet SHATTERS — the same coverage
     carried by three times as many, three times smaller plates. Pull away
     and it coalesces into a few big slabs. Coverage is conserved (the size
     unit is renormalised every frame), so this is purely a change of
     resolution, never of how much light is on the scrim.
   · RIGHT · TENSION. How hard gravity pulls and how tight the sheet is
     squeezed — and, per the audio-in law, the SENSITIVITY of the bands.
     Slack: a loose, gappy, drifting sheet that barely sorts. Tight: a
     compressed plate with the territories clearly separated and every beat
     landing hard. A hand frozen by ghost drift just leaves the tension
     somewhere sensible; it can never lie about what the mic hears.

   COLOUR comes from the FORM (which band a plate belongs to), never from
   screen position, and it is EARNED: at rest every plate is the reference's
   own cream white and the picture is the greyscale relief. The tint only
   arrives with the band's own level, so a loud track resolves the wall into
   Ridge Loom's orange and violet with cream between, and silence puts it
   back to paper.

   KICK: `inp.audio.kick` (the engine's time-domain LP150 scanner), read as
   `n` CHANGING and applied UNSMOOTHED as a per-band multiplier on top of
   the slowly-eased base size, back-dated by the hit's true age plus a
   30ms display lead — Cell Front V11's law. It also throws an outward
   impulse, so the sheet visibly recoils and re-packs over the next beat.
   --------------------------------------------------------------------- */
const GS_PAL = [[252, 148, 88], [246, 242, 232], [158, 124, 255]];  // bass / mid / treble, pale by design
const GS_PAPER = [244, 241, 232];
const GS_SPR = 128, GS_INSET = 9;                                  // sprite px, square inset

function gsMakeSprite(col, lean, prev) {
  const c = prev || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
  if (!c) return null;
  c.width = c.height = GS_SPR;
  const x = c.getContext('2d');
  x.clearRect(0, 0, GS_SPR, GS_SPR);
  const mix = k => Math.round(GS_PAPER[k] + (col[k] - GS_PAPER[k]) * lean);
  const r = mix(0), gg = mix(1), b = mix(2);
  const a = GS_INSET, s = GS_SPR - GS_INSET * 2;
  // one continuous fill, lit from the top-left corner like the reference relief
  const lit = k => Math.round(mix(k) + (255 - mix(k)) * 0.55);
  const gr = x.createLinearGradient(a, a, a + s, a + s);
  gr.addColorStop(0, `rgb(${lit(0)},${lit(1)},${lit(2)})`);
  gr.addColorStop(0.42, `rgb(${r},${gg},${b})`);
  gr.addColorStop(1, `rgb(${Math.round(r * 0.30)},${Math.round(gg * 0.30)},${Math.round(b * 0.32)})`);
  x.fillStyle = gr;
  x.fillRect(a, a, s, s);
  // luminous lit edges — the plate's own rim, fat enough to survive mesh
  x.strokeStyle = `rgba(${Math.min(255, r + 26)},${Math.min(255, gg + 26)},${Math.min(255, b + 26)},0.95)`;
  x.lineWidth = GS_SPR * 0.035;
  x.beginPath();
  x.moveTo(a, a + s); x.lineTo(a, a); x.lineTo(a + s, a);
  x.stroke();
  return c;
}

reg({
  id: 'SRC-48', family: 'SRC-48', ver: 1, title: 'Gravity Squares',
  tech: 'PACKED SQUARE SHEET / BANDS SORT UNDER GRAVITY',
  audioIn: true,
  fx: { bloom: 0.20 },
  tags: ['AUDIO IN', 'SQUARE SHEET', 'PACKING', 'GRAVITY', 'GRAIN', 'TENSION', 'KICK SHOVE'],
  desc: 'A sheet of hundreds of lit squares, every size mixed, packed edge to edge with black seams — the reference relief. The music is the LAYOUT, not a tint: each square belongs to a voice (bass plates are the big ones, treble the small ones), each voice owns a territory across the sheet, and a square is pulled toward its own by its mass times its band’s level. Quiet, the pull is nothing and the wall is one uniform greyscale plate. Loud, the crowd sorts itself — amber slabs gathering left, small violet plates drifting right, heavy ones sinking to the cores while the small fill the margins. Every kick grows the bass plates and shoves the packing outward, and it settles back over the beat.',
  interact: 'This scene listens (SHOW CHECK → AUDIO IN, or MAP → Audio in). LEFT hand is GRAIN: lean in and the sheet shatters into three times as many, three times smaller plates; pull away and it coalesces into a few big slabs — the light on the scrim stays the same either way, only the resolution changes. RIGHT hand is TENSION: how hard gravity pulls the territories together, how tightly the sheet is squeezed, and how sensitive the bands are. Slack is a loose gappy drift; tight is a compressed plate with the voices clearly separated and every beat landing hard.',
  sound: 'Makes no sound of its own — an audio-in scene like Cell Front and Penrose Bloom; the room’s music is the instrument’s input. Connect a source (mic, line-in, or CAPTURE APP AUDIO) in MAP → Audio in, then SET REST with the room quiet so silence reads as silence. It wants a real kick under a bassline: the low end sizes the big plates, the top end the small ones.',

  init(P) {
    const A = areaScale(P);
    const N = Math.max(70, Math.min(900, Math.round(175 * A)));
    const mn = Math.min(P.w, P.h);
    const s = {
      sq: [], N,
      ax: P.w / (2 * mn), ay: P.h / (2 * mn),
      life: 0, pres: 0,
      grain: 0.55, tens: 0.45,
      b: 0, m: 0, tr: 0, field: 0,
      kB: 0, kM: 0, kT: 0, kick: 0, _kGap: 1, _kN: -1, _kAge: 0, _kStr: 0, _prevOnset: 0,
      LEAD: 0.030,
      cov: 0, RU: 0.02, nAct: 0,
      arr: null, _sortT: -9, _heads: null, _next: null,
      spr: [null, null, null], sprLean: [-1, -1, -1], _sprT: 9
    };
    P.state = s;
    for (let i = 0; i < N; i++) {
      const u = P.rand();
      const sz = 0.30 + 0.70 * Math.pow(u, 2.4);
      let band = sz > 0.70 ? 0 : (sz < 0.46 ? 2 : 1);
      if (P.rand() < 0.18) band = (band + 1 + (P.rand() < 0.5 ? 0 : 1)) % 3;
      s.sq.push({
        x: (P.rand() * 2 - 1) * s.ax * 0.9, y: (P.rand() * 2 - 1) * s.ay * 0.9,
        vx: 0, vy: 0, r: 0.004, rb: 0.004,
        sz, band, rank: P.rand(), on: true,
        rot: (P.rand() - 0.5) * 0.26, sp: (P.rand() - 0.5) * 0.06, seed: P.rand()
      });
    }
    s._next = new Int32Array(N);
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const mn = Math.min(P.w, P.h);
    s.ax = P.w / (2 * mn); s.ay = P.h / (2 * mn);
    s.life += dt;
    dt = Math.min(dt, 1 / 30);            // the solver stays stable across a stutter

    /* ---- HANDS: grain (L) and tension (R), continuous and immediate ---- */
    const lLive = chan.L.mode === 'live', rLive = chan.R.mode === 'live';
    const gT = lLive ? clamp(inp.L) : 0.55 + 0.10 * Math.sin(s.life * 0.09);
    const tT = rLive ? clamp(inp.R) : 0.45 + 0.12 * Math.sin(s.life * 0.061 + 1.7);
    s.grain += (gT - s.grain) * Math.min(1, dt * 6);
    s.tens += (tT - s.tens) * Math.min(1, dt * 6);

    const audioLive = inp.audio.level > 0.05 || inp.audio.onset > 0.3;
    s.pres += (((lLive || rLive || audioLive) ? 1 : 0) - s.pres) * Math.min(1, dt * 2.2);

    /* ---- BANDS: hands are a GAIN on the signal, never a value of their
       own; eased slowly so the sheet answers the arrangement, not notes. */
    const sens = 0.70 + s.tens * 0.85;
    const idle = 0.030 + 0.016 * Math.sin(s.life * 0.19);
    const bt = Math.max(idle * (1 - s.pres), clamp(inp.audio.bass * sens));
    const mt = Math.max(idle * 0.7 * (1 - s.pres), clamp(inp.audio.mid * sens));
    const tt = Math.max(idle * (1 - s.pres), clamp(inp.audio.treble * sens));
    s.b += (bt - s.b) * Math.min(1, dt * (bt > s.b ? 1.6 : 1.0));
    s.m += (mt - s.m) * Math.min(1, dt * (mt > s.m ? 1.6 : 1.0));
    s.tr += (tt - s.tr) * Math.min(1, dt * (tt > s.tr ? 1.6 : 1.0));
    const fieldT = Math.pow(clamp(0.45 * s.b + 0.35 * s.m + 0.30 * s.tr), 1.4);
    s.field += (fieldT - s.field) * Math.min(1, dt * 1.8);

    /* ---- KICK (Cell Front V11's law): inp.audio.kick, `n` changing, applied
       unsmoothed on top of the smoothed base, back-dated by age + lead. */
    const k = inp.audio.kick;
    const haveKick = k && k.n > 0;
    if (s._kN < 0) s._kN = haveKick ? k.n : 0;
    const onsetRaw = inp.audio.onset > 0.7 && s._prevOnset <= 0.7;
    s._prevOnset = inp.audio.onset;
    s._kGap += dt;
    let edge = false, hit = 0, age = 0;
    if (haveKick) {
      if (k.n !== s._kN) {
        s._kN = k.n; edge = true;
        hit = clamp(0.55 + 0.45 * k.strength);
        age = k.perfClock ? 0 : clamp(inp.audio.now - k.t, 0, 0.2);
      }
    } else if (onsetRaw) { edge = true; hit = clamp(0.4 + inp.audio.level * 0.4); }
    const onsetEdge = edge && s._kGap > 0.09;
    if (onsetEdge) {
      s._kGap = 0; s._kAge = age; s._kStr = hit;
      const adv = Math.exp(-3.4 * (age + s.LEAD));
      s.kB = Math.max(s.kB, hit * adv);
      s.kM = Math.max(s.kM, hit * 0.7 * adv);
      s.kT = Math.max(s.kT, hit * 0.5 * adv);
    }
    const kd = Math.min(1, dt * 3.4);
    s.kB -= s.kB * kd; s.kM -= s.kM * kd; s.kT -= s.kT * kd;
    s.kick = Math.max(s.kB, s.kM, s.kT);

    /* ---- SIZE: grain picks how many plates carry a CONSERVED coverage ---- */
    const act = 0.34 + 0.66 * s.grain;
    let sum = 0, nAct = 0;
    for (let i = 0; i < s.sq.length; i++) {
      const q = s.sq[i];
      q.on = q.rank < act;
      if (q.on) { sum += q.sz * q.sz; nAct++; }
    }
    s.nAct = nAct;
    const SX = s.ax * (0.97 - 0.07 * s.tens), SY = s.ay * (0.97 - 0.07 * s.tens);
    const cov = 0.60 + 0.30 * s.field;
    s.cov = cov;
    s.RU = Math.sqrt(cov * (4 * SX * SY) / Math.max(4 * sum, 1e-6));

    // each band's SHARE of that coverage — a redistribution, mean pinned to 1
    const mean = (s.b + s.m + s.tr) / 3;
    const sh = [1 + 0.55 * clamp(s.b - mean, -0.5, 0.5),
                1 + 0.55 * clamp(s.m - mean, -0.5, 0.5),
                1 + 0.55 * clamp(s.tr - mean, -0.5, 0.5)];
    const shm = (sh[0] + sh[1] + sh[2]) / 3;
    sh[0] /= shm; sh[1] /= shm; sh[2] /= shm;
    const KM = [1 + 0.55 * s.kB, 1 + 0.34 * s.kM, 1 + 0.22 * s.kT];

    const bA = [0, 0, 0];
    for (let i = 0; i < s.sq.length; i++) {
      const q = s.sq[i];
      const tgt = q.on ? s.RU * q.sz * sh[q.band] : 0;
      q.rb += (tgt - q.rb) * Math.min(1, dt * (tgt > q.rb ? 5 : 3));
      q.r = q.rb * KM[q.band];
      bA[q.band] += q.r * q.r;
    }

    /* ---- GRAVITY: pull toward the band's territory. The territories are
       COLUMNS SIZED BY THE AREA EACH BAND ACTUALLY OWNS — partition the
       sheet's width by the three area shares — so a sorted sheet still
       tiles the frame edge to edge instead of starving one side. `sortLerp`
       slides every column back to the middle when the music is quiet, which
       is what keeps the resting picture one uniform salt-and-pepper plate. */
    const aTot = Math.max(bA[0] + bA[1] + bA[2], 1e-9);
    const sortLerp = clamp(0.10 + 1.15 * s.field) * (0.35 + 0.65 * s.tens);
    const TX = [0, 0, 0];
    let cum = 0;
    for (let b = 0; b < 3; b++) {
      const f = bA[b] / aTot;
      TX[b] = SX * (2 * (cum + f * 0.5) - 1) * sortLerp * 0.82;
      cum += f;
    }
    const bandE = [s.b, s.m, s.tr];
    const kPull = 3.4 * s.tens;
    const damp = Math.exp(-5.5 * dt);
    const impW = [0.55, 0.38, 0.26];
    for (let i = 0; i < s.sq.length; i++) {
      const q = s.sq[i];
      if (!q.on && q.r < 1e-4) continue;
      const mass = clamp(q.sz / 0.55, 0.35, 2.4);
      const bd = q.band;
      const g2 = kPull * (0.22 + 0.95 * bandE[bd]) * mass;
      q.vx += (TX[bd] - q.x) * g2 * dt;      // territories are COLUMNS — X only
      q.vy += -q.y * 0.22 * g2 * dt;          // a whisper of settle, so the sheet stays whole
      q.vx += Math.sin(q.y * 3.1 + s.life * 0.13 + q.seed * TAU) * 0.010 * dt;
      q.vy += Math.cos(q.x * 2.7 - s.life * 0.11 + q.seed * TAU) * 0.010 * dt;
      if (onsetEdge) {
        const dd = Math.hypot(q.x, q.y) + 1e-4;
        const imp = hit * impW[bd] * 0.40 / (0.5 + mass);
        q.vx += q.x / dd * imp; q.vy += q.y / dd * imp;
      }
      q.vx *= damp; q.vy *= damp;
      q.x += q.vx * dt; q.y += q.vy * dt;
      q.rot += q.sp * dt * 0.15;
    }

    /* ---- SEPARATION: axis-aligned, shallower overlap wins, heavy moves
       least. This is what makes the packing come out orthogonal. ---------- */
    let maxR = 1e-3;
    for (let i = 0; i < s.sq.length; i++) if (s.sq[i].r > maxR) maxR = s.sq[i].r;
    const cell = maxR * 2.2;
    const OX = s.ax * 1.6, OY = s.ay * 1.6;
    const GW = Math.max(1, Math.min(96, Math.ceil(2 * OX / cell)));
    const GH = Math.max(1, Math.min(96, Math.ceil(2 * OY / cell)));
    if (!s._heads || s._heads.length !== GW * GH) s._heads = new Int32Array(GW * GH);
    const heads = s._heads, next = s._next;
    const GAPF = 1.10, RELAX = 0.85;
    for (let it = 0; it < 2; it++) {
      heads.fill(-1);
      for (let i = 0; i < s.sq.length; i++) {
        const q = s.sq[i];
        if (q.r < 1e-4) { next[i] = -1; continue; }
        const gx = Math.max(0, Math.min(GW - 1, Math.floor((q.x + OX) / cell)));
        const gy = Math.max(0, Math.min(GH - 1, Math.floor((q.y + OY) / cell)));
        const c = gy * GW + gx;
        next[i] = heads[c]; heads[c] = i;
      }
      for (let i = 0; i < s.sq.length; i++) {
        const a = s.sq[i];
        if (a.r < 1e-4) continue;
        const gx = Math.max(0, Math.min(GW - 1, Math.floor((a.x + OX) / cell)));
        const gy = Math.max(0, Math.min(GH - 1, Math.floor((a.y + OY) / cell)));
        for (let jy = Math.max(0, gy - 1); jy <= Math.min(GH - 1, gy + 1); jy++) {
          for (let jx = Math.max(0, gx - 1); jx <= Math.min(GW - 1, gx + 1); jx++) {
            for (let j = heads[jy * GW + jx]; j >= 0; j = next[j]) {
              if (j <= i) continue;
              const b2 = s.sq[j];
              const R = (a.r + b2.r) * GAPF;
              const dx = b2.x - a.x, dy = b2.y - a.y;
              const ox = R - (dx < 0 ? -dx : dx);
              if (ox <= 0) continue;
              const oy = R - (dy < 0 ? -dy : dy);
              if (oy <= 0) continue;
              const ma = a.r * a.r, mb = b2.r * b2.r, ms = ma + mb;
              const wa = mb / ms, wb = ma / ms;
              if (ox < oy) {
                const p = ox * RELAX * (dx < 0 ? -1 : 1);
                a.x -= p * wa; b2.x += p * wb;
              } else {
                const p = oy * RELAX * (dy < 0 ? -1 : 1);
                a.y -= p * wa; b2.y += p * wb;
              }
            }
          }
        }
      }
      // the sheet's own ragged edge — a soft wave on the containment rect
      for (let i = 0; i < s.sq.length; i++) {
        const q = s.sq[i];
        if (q.r < 1e-4) continue;
        // ONE sheet edge, not one per size: a tiny plate stops where a
        // middling one would, or the boundary frays into scattered debris.
        const mg = Math.max(q.r, s.RU * 0.55);
        const ex = Math.max(mg + 1e-4, SX * (1 + 0.055 * Math.sin(q.y * 5.3 + s.life * 0.05)) - mg);
        const ey = Math.max(mg + 1e-4, SY * (1 + 0.055 * Math.sin(q.x * 4.1 - s.life * 0.04)) - mg);
        if (q.x > ex) { q.x = ex; if (q.vx > 0) q.vx *= -0.15; }
        else if (q.x < -ex) { q.x = -ex; if (q.vx < 0) q.vx *= -0.15; }
        if (q.y > ey) { q.y = ey; if (q.vy > 0) q.vy *= -0.15; }
        else if (q.y < -ey) { q.y = -ey; if (q.vy < 0) q.vy *= -0.15; }
      }
    }

    /* ---- the tint is EARNED by the band's own level; rest is paper ---- */
    s._sprT += dt;
    const leans = [clamp(s.b * 1.2) * 0.72, clamp(s.m * 0.7) * 0.30, clamp(s.tr * 1.2) * 0.72];
    if (s._sprT > 0.12) {
      s._sprT = 0;
      for (let i = 0; i < 3; i++) {
        if (!s.spr[i] || Math.abs(leans[i] - s.sprLean[i]) > 0.015) {
          s.spr[i] = gsMakeSprite(GS_PAL[i], leans[i], s.spr[i]);
          s.sprLean[i] = leans[i];
        }
      }
    }
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state, ms = Math.max(1, Math.sqrt(areaScale(P)));
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, h);
    const mn = Math.min(w, h), cx = w / 2, cy = h / 2;
    for (let i = 0; i < 3; i++) if (!s.spr[i]) s.spr[i] = gsMakeSprite(GS_PAL[i], s.sprLean[i] < 0 ? 0 : s.sprLean[i], null);

    // big plates behind, small ones on top — the reference's stacking. Sizes
    // move slowly, so this order is re-sorted a few times a second, not every
    // frame: the sort was the only per-frame allocation in the draw.
    const n = s.sq.length;
    if (!s.arr || s.arr.length !== n || (s.life - s._sortT) > 0.25) {
      s.arr = new Array(n);
      for (let i = 0; i < n; i++) s.arr[i] = i;
      s.arr.sort((a, b) => s.sq[b].r - s.sq[a].r);
      s._sortT = s.life;
    }
    const arr = s.arr;

    const kB = [s.kB, s.kM, s.kT];
    const bandE = [s.b, s.m, s.tr];
    const pad = GS_SPR / (GS_SPR - GS_INSET * 2);
    let drawn = 0;
    for (let idx = 0; idx < n; idx++) {
      const q = s.sq[arr[idx]];
      const sd = q.r * 2 * mn;
      if (sd < 2) continue;
      const spr = s.spr[q.band];
      if (!spr) continue;
      const bri = clamp(0.34 + 0.48 * q.seed + 0.34 * kB[q.band] + 0.16 * bandE[q.band]);
      g.globalAlpha = 0.42 + 0.58 * bri * (0.6 + 0.4 * s.pres);
      const px = cx + q.x * mn, py = cy + q.y * mn, D = sd * pad;
      g.save();
      g.translate(px, py);
      g.rotate(q.rot);
      g.drawImage(spr, -D / 2, -D / 2, D, D);
      g.restore();
      drawn++;
    }
    g.globalAlpha = 1;

    g.fillStyle = 'rgba(255,200,150,0.85)';
    g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
    g.fillText('BASS ' + Math.round(s.b * 100) + '   MID ' + Math.round(s.m * 100) +
      '   TREBLE ' + Math.round(s.tr * 100) + '   FIELD ' + Math.round(s.field * 100) +
      '   KICK ' + Math.round(s.kick * 100) + ' (' + (inp.audio.kick ? '#' + inp.audio.kick.n : 'onset') +
      ' age ' + Math.round(s._kAge * 1000) + 'ms str ' + Math.round(s._kStr * 100) + ')' +
      '   GRAIN ' + Math.round(s.grain * 100) + '   TENSION ' + Math.round(s.tens * 100) +
      '   PLATES ' + s.nAct + '/' + s.N + ' drawn ' + drawn +
      '   COV ' + Math.round(s.cov * 100) + '   UNIT ' + Math.round(s.RU * 2 * mn) + 'px' +
      (s.pres < 0.3 ? '   · SETTLING' : ''), 10, h - 10);
  }
});
