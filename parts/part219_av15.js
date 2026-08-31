/* ---------- SRC-09.15 · ATTRACTOR VESPERS V15 (the track bends the anatomy)
   Lance's DJ-set round (second wave). The scene's whole figure is two
   constants, and its law is "color is anatomy, sound comes from the
   drawn thing" — so with a booth feed live (audioIn: true, arbitrated
   on inp.audio.live):
   BASS BENDS a, TREBLE BENDS b: 40% authority under live hands (the
   player and the track sculpt the same body), full authority on an
   empty pedestal — the flame literally re-poses itself with the
   arrangement, and every downstream mapping (centroid → beam melody,
   occupancy → density) stays honest because it is still measured off
   the picture (Law 7 by construction).
   THE KICK IS THE MOUTH'S CONSONANT: each real kick feeds a separate
   aKick envelope (unsmoothed, back-dated) into the wah/swoop/saw-blend
   — deliberately NOT into s.vel, so the hand-stillness bloom and the
   flick detectors never see the booth (the audit's shadow rule). It
   also flushes s.wake a touch, so the figure glows per kick without a
   full-frame flash.
   MID/TREBLE BALANCE TILTS THE PALETTE — quantized to a 0.05 grid and
   held, because tilt movement rebuilds two 4096-entry LUTs (the audit's
   cost trap); a section change steps the glow teal↔lime↔blue instead
   of shimmering it.
   THE DROP IS THE AWAKENING: inp.audio.drop fires the V7 wake — the
   sample, the duck-and-bloom, the full-figure flush — the scene's own
   deepest gesture, now earned by the music. Counters seeded on first
   sight; sax hold gains enter/exit hysteresis; with no signal this is
   exactly V14. (V14 notes below.) ------------------------------------ */
/* ---------- SRC-09.14 · ATTRACTOR VESPERS V14 (the throat holds the note)
   Built on Lance's own ear-note from the bed round (rig.json, Aug 26):
   "SpaceSax = a RECORDING of a soulful sax swell... a one-note color,
   NOT a melodic voice; the Vespers beam wants a mono-analog chain
   beside it on that track." V13 cast the WALKING beam onto that seat:
   holdOn re-strikes on every semitone, so each rung step re-fired the
   sample head -- and the companion two rungs below re-fired it again
   in counterpoint. A run-incapable recording, machine-gunned twice.
   V14 makes the ch12 cast play what the patch IS: ONE hold, whose
   pitch is the beam's rung captured at the hold's ENTRY and at each
   CHORD change -- one soulful swell per chord (the same managed-hold
   swell pattern Lance approved twice on Event Horizon's sax), velocity
   breathing with the light, THE MOUTH still streaming ch12 CC74 for
   the articulation. The walking beam and the companion keep singing
   browser-side, untouched; walking MIDI returns as its own version
   once the mono-analog chain lands beside SpaceSax on track 12 (his
   stated plan of record). Everything else exactly V13: choir double,
   maw + standing sub, churn on arp CC74, pad = the light.
   (V13 notes below.) ------------------------------------------------ */
/* ---------- SRC-09.13 · ATTRACTOR VESPERS V13 (the beam finds a throat, the choir joins)
   The bench-roles round (Lance: "I thought you were gonna redo scenes
   with the new instruments"). Every racked track is a ROLE now, and
   Vespers casts two: THE BEAM moves off the felt piano -- a struck
   instrument that could never glide or breathe -- onto the SAX seat
   (ch12, SpaceSax or any legato patch Lance loads there), holds and
   companion both, with THE MOUTH now streaming on ch12 CC74 (map it to
   that patch's cutoff and the articulation works as designed). And the
   CHOIR (ch11) holds a soft root + color double under the hum,
   velocity breathing with the measured light -- the human undertone
   the rig doc always wanted here. FELT PIANO is silent in this scene
   now, as it should be. Zero Live-side clicks needed: the 1:1 rig
   already listens. (V12 notes below.) ------------------------------- */
/* ---------- SRC-09.12 · ATTRACTOR VESPERS V12 (the hum sits right on the rack)
   Pre-built rig round (Lance's head-start): V11's mirror was already the
   deepest in the library (beam holds + MOUTH on lead CC74, maw on bass,
   churn on arp CC74, wake on sfx). Two seats were wrong. The three saw
   TEETH doubled the first three pad voices as extra held notes -- eight
   notes on the pad channel where the chord is five; the teeth are a
   browser growl color now (midi:false) and the analog pad in Live holds
   exactly the chord, CC74 riding the light (the Tom Misch drone seat,
   per the rig doc -- the one scene whose held pad stack IS the cast
   instrument). And the structural sub -- "sub core always on" in the
   bass brief -- never reached SYNTH BASS; it now holds the low root all
   scene with velocity breathing on the light, under the maw's surges.
   Browser sound and visuals untouched from V11. --------------------- */
/* ---------- SRC-09.11 · ATTRACTOR VESPERS V11 (the beam gets a mouth) ---------- */
reg({
  id: 'SRC-09.15', family: 'SRC-09', ver: 15, title: 'Attractor Vespers V15', tech: 'CLIFFORD MAP / FLAME DENSITY / LISTENS',
  audioIn: true,
  music: {
    bpm: 56, root: 43, mode: 'aeolian', chordBars: 4, prog: [0, 1, 2, 3],
    chords: [
      [0, 7, 14, 15, 19],   // Gm(add9)  — open fifth, ninth
      [0, 7, 15, 22, 26],   // Gm9       — color, still consonant
      [0, 15, 17, 20, 22],  // Cm11/G    — subdominant lean over the pedal
      [0, 8, 15, 19, 22]    // E♭maj9/G  — the softest place in the key
    ],
    chordNames: ['Gm(add9)', 'Gm9', 'Cm11/G', 'E♭maj9/G']
  }, fx: { bloom: 0.5 },
  tags: ['STRANGE ATTRACTOR', 'THE TRACK BENDS THE ANATOMY', 'LIGHT = SOUND', 'THE MOUTH'],
  desc: 'V14, given ears: plug the booth in and the track bends the anatomy — bass reshapes constant a, treble constant b (40% under your hands, fully when nobody\'s there), every kick is a consonant through the MOUTH, the mid/treble balance steps the palette, and a structural DROP fires the awakening flush. With no signal, exactly V14. V10\'s in-tune beam, given a MOUTH. The voice was straight-on — a parked filter, an organ stop. Now it articulates under your hands: a fast gesture kicks its filter open with rising resonance and it wah-relaxes back; every rung it steps gets a small attack transient, consonants between the vowels; the figure\'s caustic sharpness sets how reedy it speaks; and the saw hardens into the blend as the light intensifies. Nothing autonomous — every bit of expression is caused by the hands or the figure. Same tuning guarantees as V10: every landing is exactly a chord tone.',
  interact: 'L bends constant a, R bends constant b — reach outward = more, the wake fires on first touch after stillness, color is anatomy. HOLD STILL with a bright figure and the beam sings (vibrato) while the hum blooms upward; keep the picture burning for minutes and heat earns a deeper sub and a harmony voice. Unattended, the scene dreams: slow anatomies, a murmuring hum, and an occasional unscheduled spur of life — the tease that pulls a stranger in. Your first real touch snaps it awake, instantly and totally.',
  sound: 'V13\'s cast, played the way the rack is actually built (V14). THE THROAT HOLDS THE NOTE: SpaceSax (ch12) is a RECORDING of one soulful sax swell - Lance\'s ear-note: a one-note color, not a melodic voice - so the ch12 hold now takes the beam\'s rung at entry and at each CHORD change and holds it: one swell per chord, velocity breathing with the light, re-struck fresh when the harmony moves (the Event Horizon sax pattern). THE MOUTH still streams ch12 CC74: gesture velocity kicks the filter open with rising resonance, rung steps fire attack transients, caustic sharpness sets reediness - map it to the patch\'s cutoff and the articulation lives there. The WALKING beam and its companion stay browser voices, rung-exact on the ladder; walking MIDI returns once the mono-analog chain lands beside SpaceSax on track 12. The CHOIR (ch11) holds a soft root+color double breathing with the light. Everything else as V12/V13: analog pad holds exactly the five-voice chord (teeth are browser growl only), structural sub holds the low root on SYNTH BASS all scene under the maw\'s surges, churn on arp CC74, dreaming idle with spurs, presence-gated heat, pad CC74 = the LIGHT.',
  init(P) {
    // CURATED SEED (as V3–V7): rich where the hands reach; rest may collapse.
    let c = 0.95, d = 0.8, bestScore = -1;
    for (let tr = 0; tr < 8; tr++) {
      const cc = 0.7 + P.rand() * 0.5, dd = 0.55 + P.rand() * 0.5;
      let score = 0, pass = true;
      for (const [a, b, floor] of [[-1.9, 2.0, 45], [-1.475, 1.575, 28], [-1.9, 1.15, 20], [-1.05, 2.0, 20]]) {
        let x = 0.1, y = 0.1;
        const seen = new Set();
        for (let i = 0; i < 480; i++) {
          const nx = Math.sin(a * y) + cc * Math.cos(a * x);
          const ny = Math.sin(b * x) + dd * Math.cos(b * y);
          x = nx; y = ny;
          if (i > 220) seen.add((((x + 3) * 4) | 0) * 32 + (((y + 3) * 4) | 0));
        }
        if (seen.size < floor) pass = false;
        score += Math.min(seen.size, floor * 2);
      }
      if (score > bestScore) { bestScore = score; c = cc; d = dd; }
      if (pass) break;
    }
    P.state = {
      x: 0.1, y: 0.1, c, d, a: -1.475, b: 1.575,
      spreadX: 1, spreadY: 1,
      pres: 0, occ: 0, vel: 0, pL: 0, pR: 0, tilt: 0, drive: 0,
      spur: 0, spurT: 8 + P.rand() * 10, spurAge: -1, spurDur: 5,
      bright: 0, conc: 0, cenX: 0.5, cenY: 0.5, wake: 0, heat: 0, still: 0,
      den: null, fre: null, img: null, dcv: null, dg: null, dw: 0, dh: 0,
      amb: null, glo: null, tcurve: null, lutPeak: -1, lutMix: -1, peak: 60, dt: 0.016,
      // V15: the listening layer — audio liveness, slow band eases, the
      // kick's own envelope (never s.vel — the audit's shadow rule), the
      // quantized audio tilt, drop relay flag, event-counter seeds
      aPres: 0, aBass: 0, aMid: 0, aTreb: 0, aKick: 0, dropQ: 0, _kN: 0, _dropN: 0, _aSeeded: false
    };
  },
  step(P, dt, t, inp) {
    const s = P.state;
    const live = (chan.L.mode === 'live' || chan.R.mode === 'live') ? 1 : 0;
    s.pres += (live - s.pres) * Math.min(1, dt * (live ? 3 : 0.4));
    // ---- V15: THE LISTENING LAYER --------------------------------------
    const au = inp.audio;
    const aLive = au && au.live ? 1 : 0;
    s.aPres += (aLive - s.aPres) * Math.min(1, dt * 2.2);
    if (au) {
      s.aBass += (clamp(au.bass) - s.aBass) * Math.min(1, dt * 1.8);
      s.aMid += (clamp(au.mid) - s.aMid) * Math.min(1, dt * 1.8);
      s.aTreb += (clamp(au.treble) - s.aTreb) * Math.min(1, dt * 1.8);
      if (!s._aSeeded) { s._aSeeded = true; s._kN = au.kick ? au.kick.n : 0; s._dropN = au.drop ? au.drop.n : 0; }
      // THE KICK IS THE MOUTH'S CONSONANT — its own envelope, never s.vel,
      // so the stillness bloom and gesture detectors never see the booth.
      // A touch of wake per hit lights the figure from within (on-form
      // glow, not a frame flash).
      if (au.kick && au.kick.n !== s._kN) {
        s._kN = au.kick.n;
        const age = au.kick.perfClock ? 0 : clamp(au.now - au.kick.t, 0, 0.2);
        const hit = clamp(0.55 + 0.45 * clamp(au.kick.strength)) * s.aPres;
        if (hit > 0.05) {
          s.aKick = Math.max(s.aKick, hit * Math.exp(-3.4 * (age + 0.030)));
          s.wake = Math.max(s.wake, 0.22 * hit);
        }
      }
      // THE DROP IS THE AWAKENING — relayed to audio() which owns playWake
      if (au.drop && au.drop.n !== s._dropN) {
        s._dropN = au.drop.n;
        if (s.aPres > 0.3) { s.dropQ = clamp(au.drop.strength); s.wake = 1; }
      }
    } else { s.aBass *= Math.pow(0.5, dt); s.aMid *= Math.pow(0.5, dt); s.aTreb *= Math.pow(0.5, dt); }
    s.aKick *= Math.exp(-3.4 * dt);
    // REACH OUTWARD = MORE: sphere = rest (embers), full stretch = torn smoke.
    // LIVE hands get total instant obedience; unattended, the figure DREAMS —
    // it glides toward the ghost drift on a ~3s time constant, quickening
    // only during a spur, so idle reads as slow breathing anatomies.
    // V15: THE TRACK BENDS THE ANATOMY — bass into a, treble into b, 40%
    // under live hands, full authority when the pedestal is empty. When the
    // booth is live the glide quickens (~an eased player, not a dream).
    const mixA = (s.pres > 0.5 ? 0.4 : 1) * s.aPres;
    const dL = clamp(inp.L * (1 - mixA) + s.aBass * mixA);
    const dR = clamp(inp.R * (1 - mixA) + s.aTreb * mixA);
    const aT = -1.05 - dL * 0.85, bT = 1.15 + dR * 0.85;
    if (s.pres > 0.5) { s.a = aT; s.b = bT; }
    else {
      const kk = Math.min(1, dt * (0.35 + s.spur * 4 + s.pres * 8 + s.aPres * 3));
      s.a += (aT - s.a) * kk;
      s.b += (bT - s.b) * kk;
    }
    // SPURS: every 16–42s of true rest (never metronomic) it flickers to
    // life for a few breaths, then sinks back under
    if (s.pres < 0.15) {
      if (s.spurAge < 0) {
        s.spurT -= dt;
        if (s.spurT <= 0) { s.spurAge = 0; s.spurDur = 4 + P.rand() * 5; }
      } else {
        s.spurAge += dt;
        if (s.spurAge >= s.spurDur) { s.spurAge = -1; s.spurT = 16 + P.rand() * 26; }
      }
    } else { s.spurAge = -1; s.spurT = 10 + P.rand() * 16; }
    s.spur = s.spurAge < 0 ? Math.max(0, s.spur - dt * 0.7)
      : clamp(Math.min(s.spurAge / 1.4, (s.spurDur - s.spurAge) / 2.5));
    s.vel = s.vel * Math.max(0, 1 - dt * 2.2) + (Math.abs(inp.L - s.pL) + Math.abs(inp.R - s.pR)) * 6;
    s.pL = inp.L; s.pR = inp.R;
    // V15: with the booth live and hands away, the palette tilt follows the
    // bass/treble balance — QUANTIZED to a 0.05 grid and held, because tilt
    // movement rebuilds two 4096-entry LUTs (the audit's per-frame cost
    // trap). Hands present keep their direct, continuous tilt.
    const tiltH = inp.L - inp.R;
    if (s.pres > 0.5 || s.aPres < 0.3) s.tilt = tiltH;
    else {
      const tiltA = clamp(s.aBass - s.aTreb, -1, 1) * 0.8;
      s.tilt = Math.round((tiltH * (1 - s.aPres) + tiltA * s.aPres) * 20) / 20;
    }
    s.wake *= Math.exp(-dt * 1.3);        // the awakening flush, cooling
    s.dt = dt;
  },
  draw(P, g, w, h, t, inp) {
    const s = P.state;
    /* ---- FLAME-DENSITY RENDER, ORGANISM PALETTE (see V6) --------------- */
    const bw = Math.max(8, w >> 1), bh = Math.max(8, h >> 1);
    if (s.dw !== bw || s.dh !== bh) {
      s.dw = bw; s.dh = bh;
      s.den = new Float32Array(bw * bh);
      s.fre = new Float32Array(bw * bh);
      s.img = new ImageData(bw, bh);
      const d = s.img.data;
      for (let i = 3; i < d.length; i += 4) d[i] = 255;
      s.dcv = document.createElement('canvas');
      s.dcv.width = bw; s.dcv.height = bh;
      s.dg = s.dcv.getContext('2d');
      s.lutPeak = -1;
    }
    const den = s.den, fre = s.fre;
    const cx = w / 2, cy = h / 2, scx = w * 0.215, scy = h * 0.265;
    let { x, y } = s;
    let sx = 0, sy = 0;
    const jw = clamp((0.012 - s.occ) / 0.010);
    const pulse = (typeof T !== 'undefined' && T.running) ? T.beatPulse() : 0.5;
    const halo = jw > 0.05;
    const n = P.focused ? (window.IS_MOBILE ? 7000 : (jw > 0.5 ? 6000 : 16000)) : 3000;
    const rr1 = jw * (3.2 + 1.2 * pulse), rr2 = jw * (9 + 4 * pulse);
    for (let i = 0; i < n; i++) {
      const nx = Math.sin(s.a * y) + s.c * Math.cos(s.a * x);
      const ny = Math.sin(s.b * x) + s.d * Math.cos(s.b * y);
      x = nx; y = ny;
      sx += Math.abs(x); sy += Math.abs(y);
      const bx = (cx + x * scx) >> 1, by = (cy + y * scy) >> 1;
      if (bx >= 0 && bx < bw && by >= 0 && by < bh) {
        den[by * bw + bx] += 1;
        fre[by * bw + bx] += 1;
        if (halo) {
          const a1 = P.rand() * TAU, r1 = (P.rand() + P.rand()) * 0.5 * rr1;
          const j1x = bx + Math.round(Math.cos(a1) * r1), j1y = by + Math.round(Math.sin(a1) * r1);
          if (j1x >= 0 && j1x < bw && j1y >= 0 && j1y < bh) den[j1y * bw + j1x] += 0.7;
          const a2 = P.rand() * TAU, r2 = (P.rand() + P.rand()) * 0.5 * rr2;
          const j2x = bx + Math.round(Math.cos(a2) * r2), j2y = by + Math.round(Math.sin(a2) * r2);
          if (j2x >= 0 && j2x < bw && j2y >= 0 && j2y < bh) den[j2y * bw + j2x] += 0.55;
        }
      }
    }
    s.x = x; s.y = y;
    s.spreadX = sx / n; s.spreadY = sy / n;
    if (!s.amb || Math.abs(s.peak - s.lutPeak) > s.lutPeak * 0.1 || Math.abs(s.tilt - s.lutMix) > 0.04) {
      s.lutPeak = s.peak; s.lutMix = s.tilt;
      const amb = s.amb || (s.amb = new Uint8ClampedArray(4096 * 3));
      const glo = s.glo || (s.glo = new Uint8ClampedArray(4096 * 3));
      const tcv = s.tcurve || (s.tcurve = new Float32Array(4096));
      const AMB = [[3, 2, 2], [58, 26, 12], [172, 92, 30], [250, 180, 78], [255, 246, 220]];
      const GC = [[2, 5, 5], [10, 58, 54], [28, 168, 150], [64, 235, 185], [140, 255, 220]];
      const GL = [[3, 4, 2], [24, 52, 10], [92, 168, 36], [150, 240, 80], [200, 255, 150]];
      const GR = [[3, 3, 7], [16, 36, 80], [60, 120, 210], [120, 170, 250], [180, 215, 255]];
      const tw = clamp(0.5 + s.tilt * 0.35);
      const P1 = tw >= 0.5 ? GL : GR, mf = Math.abs(tw - 0.5) * 2;
      const GLO = GC.map((st2, si) => st2.map((cv, ch) => cv + (P1[si][ch] - cv) * mf));
      const inv = 1 / Math.log1p(s.peak);
      for (let i = 0; i < 4096; i++) tcv[i] = Math.pow(clamp(Math.log1p(i / 16) * inv), 0.62);
      for (let i = 0; i < 4096; i++) {
        const tt = tcv[i] * 3.999;
        const k = tt | 0, f = tt - k, k1 = k + 1 > 4 ? 4 : k + 1;
        for (let ch = 0; ch < 3; ch++) {
          amb[i * 3 + ch] = AMB[k][ch] + (AMB[k1][ch] - AMB[k][ch]) * f;
          glo[i * 3 + ch] = GLO[k][ch] + (GLO[k1][ch] - GLO[k][ch]) * f;
        }
      }
    }
    const dec = Math.exp(-(s.dt || 0.016) * 2.4);
    const decF = Math.exp(-(s.dt || 0.016) * 7);
    const d8 = s.img.data, amb = s.amb, glo = s.glo, tcv = s.tcurve;
    const wk = s.wake;
    let rawMax = 0, lit = 0, col = 0, row = 0;
    let sumT = 0, sumTX = 0, sumTY = 0, hi = 0;
    for (let i = 0, j = 0; i < den.length; i++, j += 4) {
      const v = den[i] * dec;
      den[i] = v;
      const fr = fre[i] * decF;
      fre[i] = fr;
      if (v > rawMax) rawMax = v;
      if (v > 0.6) lit++;
      const q = v >= 255 ? 4095 : (v * 16) | 0;
      const tn = tcv[q];
      sumT += tn; sumTX += tn * col; sumTY += tn * row;
      if (tn > 0.6) hi++;
      let gb = (tn - 0.45) / 0.25; if (gb < 0) gb = 0; else if (gb > 1) gb = 1;
      let gf = (tn - 0.82) / 0.12; if (gf < 0) gf = 0; else if (gf > 1) gf = 1;
      let alF = fr < 0.8 ? 0 : (fr / (v * 0.38 + 0.4) - 1.15) / 1.4;
      if (alF < 0) alF = 0; else if (alF > 1) alF = 1;
      let al = gb * (1 - gf) * 0.9 + alF * 0.9;
      if (wk > 0.01) al += wk * (tn > 0.3 ? 0.5 : tn * 1.66);
      if (al > 1) al = 1;
      const q3 = q * 3;
      d8[j] = amb[q3] + (glo[q3] - amb[q3]) * al;
      d8[j + 1] = amb[q3 + 1] + (glo[q3 + 1] - amb[q3 + 1]) * al;
      d8[j + 2] = amb[q3 + 2] + (glo[q3 + 2] - amb[q3 + 2]) * al;
      col++; if (col === bw) { col = 0; row++; }
    }
    s.peak = Math.max(30, s.peak + (rawMax - s.peak) * 0.08);
    s.occ += (lit / den.length - s.occ) * 0.12;
    const kf = Math.min(1, (s.dt || 0.016) * 8);
    s.bright += (Math.pow(clamp((sumT / den.length) / 0.075), 0.45) - s.bright) * kf;
    s.conc += (clamp(hi / Math.max(1, lit) / 0.08) - s.conc) * kf;
    if (sumT > 1) {
      s.cenX += (sumTX / sumT / bw - s.cenX) * kf;
      s.cenY += (sumTY / sumT / bh - s.cenY) * kf;
    }
    s.dg.putImageData(s.img, 0, 0);
    g.drawImage(s.dcv, 0, 0, w, h);
    g.fillStyle = 'rgba(140,190,110,0.8)'; g.font = '10px ui-monospace,monospace';
    g.fillText('A ' + s.a.toFixed(3) + '  B ' + s.b.toFixed(3) + '  C ' + s.c.toFixed(2) + '  D ' + s.d.toFixed(2), 10, h - 10);
    if (P.focused) {
      g.fillStyle = 'rgba(140,190,110,0.55)';
      g.fillText('FIGURE ' + Math.round(clamp(s.occ / 0.09) * 100) + '   BRIGHT ' + Math.round(s.bright * 100) +
        '   SHARP ' + Math.round(s.conc * 100) + '   HEAT ' + Math.round(s.heat * 100) +
        (s.still > 0.05 ? '   BLOOM ' + Math.round(s.still * 100) : '') +
        (s.spur > 0.05 ? '   SPUR ' + Math.round(s.spur * 100) : '') +
        (s.aPres > 0.3 ? '   AUD b' + Math.round(s.aBass * 100) + ' t' + Math.round(s.aTreb * 100) : ''), 10, h - 24);
    }
  },
  audio(A, P) {
    const v = A.voice();
    const canPan = !!AE.ctx.createStereoPanner;
    const panNode = (p0) => { if (!canPan) return null; const pn = AE.ctx.createStereoPanner(); pn.pan.value = p0; return pn; };
    // move an already-built voice's output into the stereo field
    const repan = (vc, p0) => {
      const pn = panNode(p0);
      if (!pn) return null;
      try { vc.g.disconnect(); } catch (e) {}
      vc.g.connect(pn); pn.connect(v.group);
      if (AE.revIn) { const s2 = AE.ctx.createGain(); s2.gain.value = 0.55; pn.connect(s2); s2.connect(AE.revIn); }
      return pn;
    };

    /* --- the cathedral airs: a stereo pair + a center whisper ------------ */
    const mkAir = (freq, q, g0, p0) => {
      const nn = v.noise(), f = v.filter('bandpass', freq, q), g = v.g(g0);
      nn.connect(f); f.connect(g);
      const pn = panNode(p0);
      if (pn) { g.connect(pn); pn.connect(v.group); } else g.connect(v.group);
      return { f, g, pn };
    };
    const airL = mkAir(800, 6, 0.012, -0.6), airR = mkAir(1400, 6, 0.012, 0.6), airC = mkAir(480, 8, 0.008, 0);

    /* --- the pedal: sub, plus a heat-earned octave below ----------------- */
    const sub = v.osc('sine', H.rootFreq(-1));
    const sg = v.g(0.05);
    sub.connect(sg); sg.connect(v.group);
    const sub2 = v.osc('sine', H.rootFreq(-2));
    const sg2 = v.g(0.0001);
    sub2.connect(sg2); sg2.connect(v.group);
    const subH = {};   // the always-on structural floor, mirrored to bass
    const choirH1 = {}, choirH2 = {};   // the choir's soft double (ch11)

    /* --- THE MAW: the deep voice — melodic, not horror. Two detuned low
           saws through a growling resonant lowpass; it swells in when the
           light SURGES under the hands, bending up a fourth into the chord
           root like something enormous inhaling. -------------------------- */
    const maw1 = v.osc('sawtooth', 98), maw2 = v.osc('sawtooth', 98.7);
    const mawF = v.filter('lowpass', 140, 5);
    const mawG = v.g(0.0001);
    maw1.connect(mawF); maw2.connect(mawF); mawF.connect(mawG); mawG.connect(v.group);
    if (AE.revIn) { const sM = AE.ctx.createGain(); sM.gain.value = 0.3; mawG.connect(sM); sM.connect(AE.revIn); }
    const mawH = {};

    /* --- THE CHURN: the earned LFO — a tempo-locked tremolo on teeth and
           maw, depth grown by commitment, 8ths before 16ths --------------- */
    const churnO = v.osc('triangle', 1.87);
    const churnG = v.g(0);
    churnO.connect(churnG);
    churnG.connect(mawG.gain);

    /* --- bed + teeth, fanned across the field (root center, extensions
           outward) — the hum occupies space the way the light does -------- */
    const pads = A.padVoices(v, 5, { type: 'triangle', gain: 0.0001, cutoff: 320, q: 0.8 });
    const teeth = A.padVoices(v, 3, { type: 'sawtooth', gain: 0.0001, cutoff: 200, q: 2.2, midi: false });
    const PADPOS = [0, -0.4, 0.4, -0.7, 0.7], TEETHPOS = [-0.5, 0.5, 0];
    const padPan = pads.map((vc, i) => repan(vc, PADPOS[i] * 0.35));
    const teethPan = teeth.map((vc, i) => repan(vc, TEETHPOS[i] * 0.35));
    teeth.forEach(t => churnG.connect(t.g.gain));   // the churn shakes the teeth too
    const setVoices = (gl) => {
      for (let i = 0; i < 5; i++) pads[i].set(H.chordTone(i, 0), gl);
      for (let i = 0; i < 3; i++) teeth[i].set(H.chordTone(i, 0), gl);
    };
    setVoices(0.05);

    /* --- THE BEAMS: portamento voices riding the light ------------------- */
    const bv = A.voice();
    bv._noHold = true;
    const mkBeam = () => {
      // triangle-led, saw tucked underneath — the saw's SHARE is playable
      const o1 = bv.osc('triangle', 220), o2 = bv.osc('sawtooth', 220.6);
      const sawG = bv.g(0.25);
      const f = bv.filter('lowpass', 700, 2.2);
      const g = bv.g(0.0001);
      o1.connect(f); o2.connect(sawG); sawG.connect(f); f.connect(g);
      const pn = panNode(0);
      if (pn) { g.connect(pn); pn.connect(bv.group); } else g.connect(bv.group);
      if (AE.revIn) { const s2 = AE.ctx.createGain(); s2.gain.value = 0.6; g.connect(s2); s2.connect(AE.revIn); }
      return { o1, o2, sawG, f, g, pn, h: {} };
    };
    const beam = mkBeam(), beam2 = mkBeam();
    // shared vibrato LFO — depth is EARNED by holding still (a singer settling)
    const vibO = bv.osc('sine', 4.2), vibG = bv.g(0);
    vibO.connect(vibG);
    vibG.connect(beam.o1.frequency); vibG.connect(beam.o2.frequency);
    vibG.connect(beam2.o1.frequency); vibG.connect(beam2.o2.frequency);
    bv.fadeIn(1, 1.2);

    /* --- THE AWAKENING (V7) — now ducking the hum so it lands ------------ */
    let wakeBuf = null;
    fetch('assets/av_wake.wav')
      .then(r => r.arrayBuffer())
      .then(ab => AE.ctx.decodeAudioData(ab))
      .then(b => { wakeBuf = b; })
      .catch(() => {});
    const playWake = () => {
      if (typeof MOut !== 'undefined' && MOut.sfxNote) MOut.sfxNote(41, 0.75, 1.3);
      if (!wakeBuf || !AE.ctx) return;
      const src = AE.ctx.createBufferSource();
      src.buffer = wakeBuf;
      const g = AE.ctx.createGain();
      g.gain.value = 0.34;
      src.connect(g); g.connect(AE.master);
      if (AE.revIn) { const s2 = AE.ctx.createGain(); s2.gain.value = 0.4; g.connect(s2); s2.connect(AE.revIn); }
      src.start();
      // duck the hum ~45% for the surge's length, then breathe back in
      const t0 = AE.t();
      for (const grp of [v.group.gain, bv.group.gain]) {
        try {
          grp.cancelScheduledValues(t0);
          grp.setTargetAtTime(0.55, t0, 0.05);
          grp.setTargetAtTime(1, t0 + 0.5, 0.45);
        } catch (e) {}
      }
    };

    let fig = 0;
    H.onChord(() => {
      setVoices(0.18);
      [2, 3, 4].forEach((ci, i) => {
        A.bell(H.chordTone(ci, 1), { at: A.t() + i * 0.09, vol: 0.011 + fig * 0.012, pan: (i - 1) * 0.4, rev: 0.7 });
      });
    });
    v.fadeIn(1, 1.6);

    let swoop = 0, wakeArmed = true, stillArm = 0, lastBar = -1, gA = 0, gB = 0, gAs = 0, gBs = 0;
    let brSlow = 0, mawT = -9, mawBend = false, mawLvl = 0, rung = 3, rungT = 0, kick = 0, artic = 0;
    return {
      tick(inp, dt) {
        const s = P.state;
        dt = Math.min(0.1, dt || 0.016);
        fig = clamp(s.occ / 0.09);
        const br = s.bright, conc = s.conc;
        s.drive = s.pres * (0.25 + 0.75 * fig);

        // the wake — first touch after stillness, re-armed only by real absence
        if (s.pres < 0.08) stillArm += dt; else stillArm = 0;
        if (stillArm > 2) wakeArmed = true;
        if (wakeArmed && s.pres > 0.3) { wakeArmed = false; s.wake = 1; playWake(); }
        // V15: THE DROP IS THE AWAKENING — the booth earns the same flush
        if (s.dropQ > 0) { s.dropQ = 0; playWake(); }

        /* STILLNESS — the inverse gesture: holding a bright figure steady
           earns a slow bloom, and the beam settles into vibrato like a
           singer on a held note. Breaks the moment the hands move. */
        if (s.vel < 0.12 && br > 0.35 && s.pres > 0.5) this._stillT = (this._stillT || 0) + dt;
        else this._stillT = Math.max(0, (this._stillT || 0) - dt * 4);
        const stillT = this._stillT;
        const bloom = s.still = clamp((stillT - 4) / 7);

        /* HEAT — the arc: brightness integrates over minutes and earns
           layers; rest drains it. PRESENCE-GATED: heat is a living player's
           earning — ghost hands can never fire the layers for an empty room. */
        s.heat = clamp(s.heat + (s.pres > 0.4 && br > 0.5 ? (br - 0.5) * dt / 75 : 0) - (br < 0.2 ? dt / 55 : 0));
        if (typeof T !== 'undefined' && T.running && T.bar() !== lastBar) {
          lastBar = T.bar();
          gA = s.heat > 0.3 ? 1 : 0;
          gB = s.heat > 0.65 ? 1 : 0;
        }
        gAs += (gA - gAs) * Math.min(1, dt * 0.7);
        gBs += (gB - gBs) * Math.min(1, dt * 0.7);

        // REACTIVE — a fast hand bends the whole synth down and it crawls back
        // (V15: a hard kick leans on it too, at reduced depth)
        swoop = Math.max(swoop * Math.pow(0.12, dt), Math.min(1, s.vel * 0.35), s.aKick * 0.45);
        pads.forEach((p, i) => {
          A.set(p.o1.detune, -4 - i * 1.8 - 170 * swoop - s.drive * 6, 0.06);
          A.set(p.o2.detune, 5 + i * 2.4 - 170 * swoop + s.drive * 6, 0.06);
        });
        teeth.forEach((p, i) => {
          A.set(p.o1.detune, -6 - i * 2 - 170 * swoop - conc * 10, 0.06);
          A.set(p.o2.detune, 7 + i * 2.6 - 170 * swoop + conc * 10, 0.06);
        });

        /* SPACE — the stereo image widens as the smoke does, further with heat */
        const width = 0.35 + 0.65 * clamp(s.spreadX / 1.3) * (0.72 + 0.28 * gAs);
        if (canPan) {
          padPan.forEach((pn, i) => pn && A.set(pn.pan, PADPOS[i] * width, 0.4));
          teethPan.forEach((pn, i) => pn && A.set(pn.pan, TEETHPOS[i] * width, 0.4));
          if (airL.pn) A.set(airL.pn.pan, -0.65 * width, 0.5);
          if (airR.pn) A.set(airR.pn.pan, 0.65 * width, 0.5);
        }

        /* BRIGHTNESS = INTENSITY (bloom lifts it gently from within).
           Idle sinks to a murmur; a spur breathes it halfway back up. */
        const lvl = (0.30 + 0.70 * s.pres) * (1 + s.spur * 0.5);
        const glow = 0.45 + 0.9 * br;
        const bl0 = 1 + bloom * 0.22;
        pads[0].level(0.015 * lvl * glow * bl0, 0.3);
        pads[1].level(0.013 * lvl * glow * clamp(fig * 4) * bl0, 0.3);
        pads[2].level(0.012 * lvl * glow * clamp((fig - 0.15) / 0.3) * bl0, 0.4);
        pads[3].level(0.011 * lvl * glow * clamp((fig - 0.3) / 0.3) * bl0, 0.4);
        pads[4].level(0.011 * lvl * glow * Math.max(clamp((fig - 0.45) / 0.3), bloom * 0.7), 0.6);
        pads.forEach(p => p.bright(240 + br * 780 + (s.spreadX + s.spreadY) * 140 + bloom * 420, 0.25));
        // the teeth sleep at idle — they belong to a living player
        const bite = Math.pow(br, 1.4) * clamp((br - 0.12) / 0.5) * (0.15 + 0.85 * s.pres);
        teeth.forEach((p, i) => {
          p.level(0.012 * lvl * bite * (1 - i * 0.18), 0.3);
          p.bright(170 + br * 1500 + conc * 400, 0.25);
        });
        A.set(sg.gain, (0.032 + br * 0.05) * (0.6 + 0.4 * s.pres + 0.3 * s.spur), 0.4);

        /* THE MAW — swells on a surge of light under living hands, bending
           up a fourth into the chord root; sighs softly during idle spurs */
        brSlow += (br - brSlow) * Math.min(1, dt * 0.5);
        const now2 = A.t();
        if (br - brSlow > 0.15 && s.drive > 0.5 && now2 - mawT > 6) { mawT = now2; mawBend = true; }
        const mfreq = H.chordTone(0, 0);
        if (mawBend) {
          mawBend = false;
          try {
            maw1.frequency.setValueAtTime(mfreq / 1.335, now2);
            maw2.frequency.setValueAtTime((mfreq * 1.007) / 1.335, now2);
          } catch (e) {}
        }
        A.set(maw1.frequency, mfreq, 0.35);
        A.set(maw2.frequency, mfreq * 1.007, 0.36);
        const mawAct = clamp(1 - (now2 - mawT) / 4);
        const mawTgt = 0.055 * s.drive * mawAct * mawAct + s.spur * 0.018;
        mawLvl += (mawTgt - mawLvl) * Math.min(1, dt * (mawTgt > mawLvl ? 2.4 : 0.55));
        A.set(mawG.gain, mawLvl, 0.1);
        A.set(mawF.frequency, 110 + br * 260 + mawAct * 160, 0.3);

        /* THE CHURN — depth is EARNED by commitment (drive × sharpness),
           rate steps 8ths → 16ths; streamed on arp CC74 for the rig */
        const churn = clamp((s.drive * (0.3 + 0.7 * conc) - 0.35) / 0.5);
        if (typeof T !== 'undefined' && T.running) {
          A.set(churnO.frequency, (churn > 0.6 ? 4 : 2) / T.beat, 0.4);
        }
        A.set(churnG.gain, churn * (0.005 + mawLvl * 0.65), 0.3);
        // HEAT layer 1: the deep double, an octave below the sub
        A.set(sg2.gain, gAs * (0.018 + br * 0.022), 0.8);

        /* SHARPNESS = RESONANCE */
        A.set(airL.f.frequency, 300 + s.spreadX * 900, 0.2);
        A.set(airR.f.frequency, 500 + s.spreadY * 1400, 0.2);
        A.set(airC.f.frequency, 420 + br * 300, 0.3);
        // Q ceiling halved: filament states SHIMMER, they don't whistle
        A.set(airL.f.Q, 6 + conc * 4, 0.4);
        A.set(airR.f.Q, 6 + conc * 4, 0.4);
        A.set(airC.f.Q, 8 + conc * 5, 0.4);
        const airAmt = 0.55 + 0.45 * s.pres + 0.3 * s.spur;
        A.set(airL.g.gain, (0.010 + (1 - fig * 0.5) * 0.012 + br * 0.006) * airAmt, 0.4);
        A.set(airR.g.gain, (0.010 + (1 - fig * 0.5) * 0.012 + br * 0.006) * airAmt, 0.4);
        A.set(airC.g.gain, (0.005 + br * 0.007 + conc * 0.005 + bloom * 0.006) * airAmt, 0.4);

        /* THE BEAM — step-and-glide along the ladder: it walks one rung at a
           time toward the light's centroid (~11 rungs/s max) and every
           landing is EXACTLY a chord tone. The ~90ms glide between rungs is
           the portamento; the voice can never park between pitches. */
        const tgt = clamp(s.cenX) * 7;
        rungT -= dt;
        if (Math.abs(tgt - rung) > 0.6 && rungT <= 0) {
          rung += tgt > rung ? 1 : -1;
          rungT = 0.09;
          artic = 1;                 // each landed rung gets a consonant
        }
        const bfreq = H.chordTone(rung, 1);
        A.set(beam.o1.frequency, bfreq, 0.09);
        A.set(beam.o2.frequency, bfreq * 1.004, 0.095);
        const vdep = clamp(stillT / 6);
        A.set(vibG.gain, bfreq * 0.005 * vdep, 0.4);
        A.set(vibO.frequency, 4.2 + vdep * 1.3, 0.5);
        /* THE MOUTH — the beam articulates under the hands:
           kick  = gesture velocity wahs the filter open with rising Q
           artic = each rung step is a short attack transient
           conc  = the figure's sharpness sets the resting reediness
           and the saw hardens into the blend as the light intensifies. */
        // V15: the booth's kick joins the hands' gesture velocity in the
        // MOUTH — aKick is its own envelope so the stillness bloom (s.vel)
        // never sees it
        kick = Math.max(kick * Math.pow(0.05, dt), Math.min(1, s.vel * 0.6), s.aKick * 0.9);
        artic *= Math.pow(0.004, dt);
        const mouth = Math.min(2100,
          340 + br * 800 + (1 - s.cenY) * 380 + bloom * 300 + kick * 750 + artic * 450);
        A.set(beam.f.frequency, mouth, 0.08);
        A.set(beam.f.Q, 2 + conc * 2.5 + kick * 4 + artic * 2.5, 0.15);
        A.set(beam.sawG.gain, 0.18 + br * 0.3 + kick * 0.25, 0.2);
        // during a spur the beam whispers one quiet note to itself
        const bl = (s.pres * (0.003 + Math.pow(br, 1.3) * 0.017) + s.spur * 0.005 * (0.3 + br)) *
          clamp(s.occ / 0.004) * (1 + bloom * 0.3) * (1 + artic * 0.25 + kick * 0.15);
        A.set(beam.g.gain, bl, 0.3);
        if (beam.pn) A.set(beam.pn.pan, clamp((s.cenX - 0.5) * 1.6, -1, 1) * Math.max(width, 0.5), 0.2);
        // HEAT layer 2: the companion — two rungs below, opposite side
        const bfreq2 = H.chordTone(rung - 2, 1);
        A.set(beam2.o1.frequency, bfreq2, 0.1);
        A.set(beam2.o2.frequency, bfreq2 * 1.004, 0.105);
        // the companion mouths along at half depth
        A.set(beam2.f.frequency, Math.min(1300, 280 + br * 700 + kick * 350 + artic * 220), 0.15);
        A.set(beam2.f.Q, 2 + conc * 1.5 + kick * 2, 0.2);
        A.set(beam2.sawG.gain, 0.16 + br * 0.22 + kick * 0.12, 0.25);
        const bl2 = bl * 0.55 * gBs;
        A.set(beam2.g.gain, bl2, 0.3);
        if (beam2.pn) A.set(beam2.pn.pan, -clamp((s.cenX - 0.5) * 1.2, -1, 1) * Math.max(width, 0.5), 0.3);

        if (typeof MOut !== 'undefined') {
          // THE THROAT HOLDS THE NOTE (V14): SpaceSax is a recording of one
          // soulful swell -- the ch12 hold takes the beam's rung at ENTRY
          // and at each CHORD change and holds it there. One swell per
          // chord; the MOUTH (ch12 CC74, below) does the articulation. The
          // companion is browser color only now: a second held note doubled
          // the sample, and the choir already carries the double.
          // V15: hysteresis on the hold gate — bl hovering at the old bare
          // 0.0035 threshold re-triggered the SpaceSax sample per crossing
          if (!this._saxOn && bl > 0.004) this._saxOn = true;
          else if (this._saxOn && bl < 0.0028) this._saxOn = false;
          if (this._saxOn) {
            if (beam.h._mNote === undefined || beam.h._sStep !== H.step) {
              beam.h._sStep = H.step; beam.h._sF = bfreq;
            }
            MOut.holdOn(beam.h, 'sax', beam.h._sF, Math.round(34 + br * 66));
          } else MOut.holdOff(beam.h);
          // THE CHOIR: a soft root + color double under the hum, breathing
          // with the light -- seasoning, kept quiet by velocity
          if (s.pres > 0.15 || s.spur > 0.1) {
            MOut.holdOn(choirH1, 'choir', H.chordTone(0, 0), Math.round((24 + br * 30) * (0.4 + 0.6 * s.pres)));
            MOut.holdOn(choirH2, 'choir', H.chordTone(2, 0), Math.round((20 + br * 26) * (0.4 + 0.6 * s.pres)));
          } else { MOut.holdOff(choirH1); MOut.holdOff(choirH2); }
          if (mawLvl > 0.008) MOut.holdOn(mawH, 'bass', mfreq, Math.round(36 + s.drive * 52));
          else MOut.holdOff(mawH);
          // "sub core always on" (the bass brief): the low root holds all
          // scene, velocity breathing with the light, under the maw
          MOut.holdOn(subH, 'bass', H.rootFreq(-1), Math.round(30 + br * 36));
          MOut.expr('pad', br);
          MOut.expr('sax', clamp((mouth - 340) / 1500));   // CC74 sax = THE MOUTH (ch12)
          MOut.expr('choir', br * 0.8);
          MOut.expr('arp', churn);
          MOut.expr('bass', clamp(mawLvl * 16));
        }
      },
      stop() {
        if (typeof MOut !== 'undefined') { MOut.holdOff(beam.h); MOut.holdOff(mawH); MOut.holdOff(subH); MOut.holdOff(choirH1); MOut.holdOff(choirH2); }
        bv.kill(); v.kill();
      }
    };
  }
})
