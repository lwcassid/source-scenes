/* ---------- SRC-56.4 · THE POINT, VOICED — the first thing the room hears ----------
   Sep 27, 2026. Act I, layer 1 of Birth of a Temple 0.2. Edson: "The first
   layer is the dot, the circle. It's just this very simple element. It is
   in the center. It reacts to the music, quick attack, slow return. The
   instrument also changes its size. And the sound of the instrument here is
   very important, it will be solo when the show starts, so it's the first
   time people will understand that the instrument produces sound and
   visuals."

   Round 2, same day, before anyone played it (16:08): "the sound should be
   more responsive to my hands in here. This is the presentation of the
   instrument. It should really read like I'm playing it." So: the hands
   answer in ~40 ms (was ~140), R walks EVERY NOTE OF THE KEY (15 over two
   octaves, was the chord's 5), each new note is articulated (a soft pluck
   on top of the held tone), and THE MOTION ITSELF IS HEARD: a moving hand
   swells and brightens the tone like a bow on a string; a still hand
   settles back to the held note.

   Round 3 (16:19): "when both hands are close to the instrument, it should
   be silence." The Source law's zero, applied to the sound: the voice is
   gated by the MORE OPEN hand — silent below ~2% reach, full by ~15% — so
   either hand opening brings it in, and both in is nothing. The dot stays.

   So the dot gets a VOICE, and the voice and the picture are one gesture:
   · L IS SIZE — and it is SRC-68's left hand, as he asked: the same detuned
     saw pair and sub, the low-pass opening and the level rising with the
     width. A small dot is a dark, close tone; a dot that fills the room is
     an open, bright one.
   · R IS PITCH — NOT 68's right hand (no gate, no chopping: "let's not make
     the fragmented sounds"). The hand walks the notes of the key, F aeolian,
     two octaves from the root, and glides between them: "change the pitch,
     always harmonic". Set LADDER = 'chord' below to walk only the tones of
     the sounding chord (fewer notes, never a passing tone). The heat of the gold follows the same hand: a higher note is a
     hotter gold.
   · EVERY NEW NOTE IS A PULSE. One note pushes one step (the Birdsong law):
     the dot punches out on the frame you hear it, and the sound's filter
     opens with the same envelope. Quick attack, slow return (~1.2 s).
   · THE MUSIC HITS IT THE SAME WAY. The band through the line-in: level and
     kicks, instant up, slow down. The dot takes the MAX of its own notes and
     the room, never the sum, so when the PA feeds the line-in a note does
     not hit twice.
   The picture is SRC-56.3's (the palette-reading gold: band g0 is the body,
   c0 the dust; DEPTH is the host's macro, flat light → a body in a space).
   The pulse is new and much larger than 56.3's: Light Eclipse V3's verdict,
   "too gentle — attack quick, recover slow", read as SMOOTH, not SMALL. */
(() => {
  const GOLD = [[150, 100, 25], [212, 175, 55], [255, 232, 170], [255, 250, 240]];
  const STOPS = [0, 0.4, 0.75, 1];
  function gold(h) {
    h = clamp(h);
    let i = 0; while (i < STOPS.length - 2 && h > STOPS[i + 1]) i++;
    const f = (h - STOPS[i]) / (STOPS[i + 1] - STOPS[i]);
    const a = GOLD[i], b = GOLD[i + 1];
    return [Math.round(a[0] + (b[0] - a[0]) * f), Math.round(a[1] + (b[1] - a[1]) * f), Math.round(a[2] + (b[2] - a[2]) * f)];
  }
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const HAS = typeof PAL !== 'undefined';
  const WHITE = [255, 250, 240];
  function metal(P, h) {
    h = clamp(h);
    if (!HAS) return gold(h);
    if (h <= 0.75) return PAL.along(P, 0, h / 0.75, u => gold(u * 0.75));
    const a = PAL.along(P, 0, 1, () => gold(0.75)), f = (h - 0.75) / 0.25;
    return [a[0] + (WHITE[0] - a[0]) * f, a[1] + (WHITE[1] - a[1]) * f, a[2] + (WHITE[2] - a[2]) * f];
  }

  /* THE LADDER. R spans two octaves, F2 (87 Hz, SRC-68's register) → F4,
     and the hand's pitch SNAPS to the nearest note of the chord that is
     sounding. A fixed span, not "the next n chord tones": these voicings
     are wider than an octave (F5 = 41,48,53,60), so H.chordTone(k) climbs
     and falls back (…60, 53, 60, 65…) — measured, and it is why this is
     built from pitch classes. A sparse chord (F5) has few rungs, a full one
     (D♭maj7) has more; the span never changes. */
  const LADDER = 'scale';                // 'scale' = every note of the key · 'chord' = the sounding chord's tones
  const LO = 41, HI = 65, HYST = 0.6;   // midi; a new note 0.3 semitone PAST the midpoint (~1.3% of the reach)
  const RESP = 25;                       // hand response, 1/s: ~40 ms
  function chordNotes() {
    const src = LADDER === 'scale' ? [0, 1, 2, 3, 4, 5, 6].map(d => H.degSemi(d)) : (H.chordSemis || [LO]);
    const pcs = src.map(m => ((m % 12) + 12) % 12), out = [];
    for (let m = LO; m <= HI; m++) if (pcs.indexOf(m % 12) >= 0) out.push(m);
    return out.length ? out : [LO];
  }
  const nearest = (ns, x) => ns.reduce((a, m) => Math.abs(m - x) < Math.abs(a - x) ? m : a, ns[0]);
  const RELEASE = 0.45;           // pulse time constant, s → ~1.2 s to near nothing
  const NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
  const envDecay = dt => Math.exp(-dt / RELEASE);

  reg({
    id: 'SRC-56.4', family: 'SRC-56', ver: 4, title: 'BoT · The Point, Voiced', tech: 'ONE DISC / L = SIZE + SRC-68 TONE / R = PITCH IN KEY F2→F4 / MOTION = BOW / NOTES PULSE',
    palette: HAS ? {
      c: ['#ffecc8', '#947733', '#d37b50', '#d4d4d4', '#4f4f4f'],
      g: [PAL.ramp(u => gold(u * 0.75)), PAL.PRESETS.COPPER1, PAL.PRESETS.SILVER1],
      hl: [0, null, null],
      names: { c0: 'DUST', g0: 'THE BODY: DARK END → HIGHLIGHT' }
    } : undefined,
    audioIn: true,
    textIsContent: true,
    music: {
      bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
      chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
      chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4']
    },
    fx: { bloom: 0.25 },
    tags: ['TEMPLE SET', 'ACT 1', 'LAYER 1', 'THE INSTRUMENT SPEAKS', 'OPEN L = SIZE + TONE', 'OPEN R = PITCH + HEAT', 'NOTES PULSE', 'MACRO: DEPTH', 'LISTENS TO THE BAND'],
    desc: 'The first thing the room hears and sees at once. A gold dot in the centre, and a voice: the left hand grows the dot and opens the tone, the right hand walks the pitch up a ladder of chord tones, always in the harmony, and every new note makes the dot punch out and fall back. The band hits it the same way — quick attack, slow return. DEPTH (a knob, in the act) turns the flat light into a body in a space.',
    interact: 'THE SOURCE LAW: hands in is zero, hands out is everything. L OPENS THE SIZE — and the tone opens with it (SRC-68\'s left hand). R CLIMBS THE PITCH — two octaves, F2 to F4, every note of the key; a moving hand swells the tone like a bow, with a glide; the gold heats as it climbs. Each new note pulses the dot. DEPTH is a macro on a knob.',
    sound: 'F aeolian, eight-bar chords. The voice is SRC-68\'s beam tone — a detuned sawtooth pair and a sine sub through a low-pass — but held steady, never chopped. The sub stays on the root; the saws take the note the right hand chooses and glide to the next. Size is the filter and the level; each new note opens the filter with the same quick-attack, slow-return envelope that pulses the picture. MIDI: the voice is mirrored automatically (A.voice); CC energy on bass (size) and lead (pitch).',

    init(P) {
      const w = P.w, h = P.h, S = Math.min(w, h);
      const NR = 32;
      const rj = new Float32Array(NR), rl = new Float32Array(NR);
      for (let i = 0; i < NR; i++) { rj[i] = (P.rand() - 0.5) * 0.04; rl[i] = 0.6 + P.rand() * 0.8; }
      const ND = Math.min(520, Math.round(180 * areaScale(P)));
      const dx = new Float32Array(ND), dy = new Float32Array(ND), db = new Float32Array(ND), dp = new Float32Array(ND);
      for (let i = 0; i < ND; i++) { dx[i] = P.rand() * w; dy[i] = P.rand() * h; db[i] = 0.2 + Math.pow(P.rand(), 2.5) * 0.8; dp[i] = P.rand() * TAU; }
      P.state = {
        cx: w / 2, cy: h / 2, S, NR, rj, rl, ND, dx, dy, db, dp,
        pres: 0, size: 0, heat: 0, depth: 0, drift: P.rand() * 100,
        midi: LO, notes: 0, chordKey: '',  // the note the right hand holds; a counter of new notes
        envNote: 0, envRoom: 0, env: 0, motion: 0,    // quick attack, slow return — own notes, the band, and their max
        lastKick: -1, seeded: false
      };
    },

    step(P, dt, t, inp) {
      const s = P.state;
      const live = SOURCE_PRES();
      s.pres += (live - s.pres) * Math.min(1, dt * 1.5);
      s.drift += dt;

      const idleS = 0.20 + Math.sin(s.drift * 0.05) * 0.09;
      const idleH = 0.24 + Math.sin(s.drift * 0.077 + 1.3) * 0.09;
      const wantS = SOURCE(inp.L) * s.pres + idleS * (1 - s.pres);
      const wantH = SOURCE(inp.R) * s.pres + idleH * (1 - s.pres);
      const ps = s.size, ph = s.heat;
      s.size += (wantS - s.size) * Math.min(1, dt * RESP);
      s.heat += (wantH - s.heat) * Math.min(1, dt * RESP);
      // THE MOTION: how fast the hands are moving, heard like a bow (instant up, ~0.3 s down)
      const vel = s.seeded ? (Math.abs(s.size - ps) + Math.abs(s.heat - ph)) / Math.max(dt, 1e-3) : 0;
      s.motion = Math.max(clamp(vel / 1.5), s.motion * Math.exp(-dt / 0.3));

      // the first frame fires nothing: no stale kick, no note from the idle settling
      if (!s.seeded) {
        s.seeded = true;
        const k0 = inp.audio && inp.audio.kick; s.lastKick = k0 ? k0.n : -1;
        s.heat = wantH; s.size = wantS;
        const ns0 = chordNotes(); s.chordKey = ns0.join(); s.midi = nearest(ns0, LO + clamp(s.heat) * (HI - LO));
      }
      // THE LADDER, with hysteresis: a hand trembling on a boundary does not chatter
      const ns = chordNotes(), key = ns.join();
      const x = LO + clamp(s.heat) * (HI - LO);
      if (key !== s.chordKey) {            // the chord moved: the held note moves to its nearest tone, no pulse
        s.chordKey = key; s.midi = nearest(ns, s.midi);
      }
      const cand = nearest(ns, x);
      if (cand !== s.midi && Math.abs(x - s.midi) - Math.abs(x - cand) > HYST) {
        s.midi = cand;
        s.notes++;
        s.envNote = Math.max(s.envNote, 0.8); // one note pushes one step — instant
      }

      const wantD = (P.macro && P.macro.depth !== undefined) ? P.macro.depth : (0.5 + 0.5 * Math.sin(s.drift * 0.09));
      s.depth += (clamp(wantD) - s.depth) * Math.min(1, dt * 2.0);

      // THE BAND: instant up, slow down
      const au = inp.audio || {};
      const lvl = au.live ? clamp(au.level || 0) : 0;
      const roomLvl = Math.pow(lvl, 1.3) * 0.75;
      s.envRoom = Math.max(roomLvl, s.envRoom * envDecay(dt));
      if (au.kick && au.kick.n !== s.lastKick) {
        s.lastKick = au.kick.n;
        s.envRoom = Math.max(s.envRoom, 0.55 + 0.45 * clamp(au.kick.strength || 1));
      }
      s.envNote *= envDecay(dt);
      s.env = Math.max(s.envNote, s.envRoom);   // the max, never the sum
    },

    draw(P, g, w, h, t, inp) {
      const s = P.state;
      const room = (typeof OWPOEM !== 'undefined') ? OWPOEM.room() : 1;
      g.globalCompositeOperation = 'source-over';
      if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }

      const S = Math.min(w, h), D = s.depth, E = s.env;
      // the pulse is a BIG move: up to +45% radius at a full hit
      const R = S * (0.045 + s.size * 0.40) * (1 + E * 0.45);
      const heat = clamp(s.heat + E * 0.22);
      const bright = (0.55 + s.pres * 0.45) * room * (1 + E * 0.25);
      const ms = Math.max(1, Math.sqrt(areaScale(P)));
      const C = metal(P, heat), Chi = metal(P, heat + 0.35), Clo = metal(P, heat - 0.30);
      const C0 = HAS ? (PAL.c(P, 0) || [255, 236, 200]) : [255, 236, 200];
      const dust = `rgba(${C0[0]},${C0[1]},${C0[2]},`;

      g.globalCompositeOperation = 'lighter';

      if (D > 0.01) {
        const { ND, dx, dy, db, dp } = s;
        const a = D * 0.55 * Math.min(1, bright);
        for (let i = 0; i < ND; i++) {
          const tw = 0.6 + 0.4 * Math.sin(s.drift * 0.7 + dp[i]);
          const al = a * db[i] * tw; if (al < 0.01) continue;
          const rr = (0.6 + db[i] * 1.3) * ms;
          g.fillStyle = dust + al + ')';
          g.beginPath(); g.arc(dx[i], dy[i], rr, 0, TAU); g.fill();
        }
      }

      // a breath of light thrown into the room on each hit — even when flat
      if (E > 0.02) {
        const HR = R * (1.6 + E * 1.4);
        const hg = g.createRadialGradient(s.cx, s.cy, R * 0.9, s.cx, s.cy, HR);
        hg.addColorStop(0, rgba(C, 0.22 * E * Math.min(1, bright)));
        hg.addColorStop(1, rgba(C, 0));
        g.fillStyle = hg;
        g.beginPath(); g.arc(s.cx, s.cy, HR, 0, TAU); g.fill();
      }

      if (D < 0.995) {
        g.fillStyle = rgba(C, Math.min(1, (0.85 + heat * 0.15) * bright) * (1 - D));
        g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();
      }
      if (D > 0.005) {
        const off = R * 0.34 * D, b = Math.min(1, bright);
        const gr = g.createRadialGradient(s.cx - off, s.cy - off, 0, s.cx, s.cy, R);
        gr.addColorStop(0, rgba(Chi, (0.85 + heat * 0.15) * b * D));
        gr.addColorStop(0.45, rgba(C, (0.80 + heat * 0.2) * b * D));
        gr.addColorStop(0.92, rgba(Clo, 0.45 * b * D));
        gr.addColorStop(1, rgba(Clo, 0.10 * b * D));
        g.fillStyle = gr;
        g.beginPath(); g.arc(s.cx, s.cy, R, 0, TAU); g.fill();

        const HR = R * (2.0 + heat * 1.1);
        const hg = g.createRadialGradient(s.cx, s.cy, R * 0.85, s.cx, s.cy, HR);
        hg.addColorStop(0, rgba(C, (0.14 + heat * 0.14) * b * D));
        hg.addColorStop(1, rgba(C, 0));
        g.fillStyle = hg;
        g.beginPath(); g.arc(s.cx, s.cy, HR, 0, TAU); g.fill();

        g.lineCap = 'round';
        for (let i = 0; i < s.NR; i++) {
          const a = (i / s.NR) * TAU + s.drift * 0.06 + s.rj[i];
          const len = R * (0.06 + s.rl[i] * 0.09 * (0.4 + heat)) * (1 + E);
          const c = Math.cos(a), sn = Math.sin(a);
          g.strokeStyle = rgba(Chi, (0.10 + heat * 0.18) * b * D);
          g.lineWidth = 1.6 * ms;
          g.beginPath(); g.moveTo(s.cx + c * R * 0.99, s.cy + sn * R * 0.99);
          g.lineTo(s.cx + c * (R + len), s.cy + sn * (R + len)); g.stroke();
        }
      }

      if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = 'rgba(225,225,235,0.8)';
        g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
        g.fillText('SIZE ' + Math.round(s.size * 100) + '   NOTE ' + NAMES[s.midi % 12] + (Math.floor(s.midi / 12) - 1) + '   PULSE ' + Math.round(E * 100) + '   DEPTH ' + Math.round(D * 100), 10, h - 10);
      }
      if (!P.hosted && typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
    },

    audio(A, P) {
      // SRC-68's beam tone, held steady: detuned saw pair + sine sub → low-pass
      const v = A.voice();
      const o1 = v.osc('sawtooth', 87), o2 = v.osc('sawtooth', 87), sub = v.osc('sine', 43.6);
      o1.detune.value = -7; o2.detune.value = 9;
      const f = v.filter('lowpass', 300, 0.9);
      const lg = v.g(0), sg = v.g(0);
      o1.connect(f); o2.connect(f); f.connect(lg); lg.connect(v.group);
      sub.connect(sg); sg.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.28; lg.connect(sd); sd.connect(A.revIn); }
      if (A.delIn) { const dd = A.ctx.createGain(); dd.gain.value = 0.10; lg.connect(dd); dd.connect(A.delIn); }

      const hzOf = m => 440 * Math.pow(2, (m - 69) / 12);
      let held = P.state.midi, lastNotes = P.state.notes;
      const glideTo = (m, gl) => { const hz = hzOf(m); A.set(o1.frequency, hz, gl); A.set(o2.frequency, hz, gl); };
      A.set(sub.frequency, hzOf(LO - 12), 0.05);   // the sub holds the root, F1, under every chord
      glideTo(held, 0.01);
      v.fadeIn(1, 1.2);

      return {
        tick() {
          const s = P.state;
          // BOTH HANDS AT THE SOURCE = SILENCE: the more open hand opens the voice
          const op = Math.max(clamp(s.size), clamp(s.heat)), ok = clamp((op - 0.02) / 0.13);
          const gate = (0.35 + s.pres * 0.65) * ok * ok * (3 - 2 * ok);
          // a new note glides fast; a chord moving the held note glides slow
          if (s.midi !== held) { const played = s.notes !== lastNotes; held = s.midi; glideTo(held, played ? 0.018 : 0.5); }
          const wid = clamp(s.size), E = s.env, M = s.motion;
          // each PLAYED note is articulated: a soft pluck an octave up, on top of the held tone
          if (s.notes !== lastNotes) {
            lastNotes = s.notes;
            A.tone(hzOf(held) * 2, { vol: (0.010 + 0.014 * wid) * gate, dur: 0.9, attack: 0.004, type: 'triangle', rev: 0.35, role: 'lead' });
          }
          // 68's left hand: level and low-pass open with the width; the pulse opens it further
          // the bow: a still hand is the held tone, a moving hand swells it
          A.set(lg.gain, (0.035 + 0.06 * wid) * gate * (0.7 + 0.9 * M) * (1 + 0.4 * s.envNote), 0.015);
          A.set(sg.gain, (0.05 + 0.05 * wid) * gate, 0.03);
          // key-tracked floor: a high note never drowns under a closed filter
          A.set(f.frequency, Math.max(2.2 * hzOf(held), 180 + 2600 * Math.pow(wid, 1.5)) + 1400 * E + 1800 * M, 0.015);
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('bass', wid * ok); MOut.expr('lead', clamp(s.heat)); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
