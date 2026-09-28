/* ---------- SRC-68.2 · ISOTRP C · BEAM V2 (the right hand unlocks the rest) ----------
   Edson on V1: "ISOTRP C looks great." V2's brief, in his words:
   "the right hand that fragments, will also bring to the screen random
   elements like ISOTRP B, but this random elements only start to appear as
   right hand is farther than 50% distance. And the left hand starts to
   generate ISOTRP D trails if the right hand is farther than 70%."

   So the right hand is no longer just the gate: it is a KEY with three
   thresholds, and each one it passes opens a new layer of the ISOTRP studies.

     R  0 → 50%   the V1 beam: steady, then chopped towards strobe
     R  > 50%     B's random elements join the beam: point, ring, eclipse,
                  column, wash... from one a bar at 50% to dense bursts at
                  100%, their scale growing with the same ramp
     R  > 70%     D's feedback wakes up, and the LEFT hand now does two
                  things: the width (as in V1) and the length of the trails.
                  The unlock fades in over 70 → 100%, so crossing 70 with
                  the left hand wide is a swell, not a jump.

   Near = less, far = more, both hands (SOURCE()). A lost hand releases to
   its smallest form, so a lost RIGHT hand also closes both unlocks.

   Everything is built from part257's shared pieces (ISO.*): the beam, the
   gate, B's shape vocabulary and its sound, and the feedback renderer. One
   sequencer queue carries both gate events and element events, so every
   light is still on the frame its sound is heard. */
(() => {
  const ISO = window.ISO;
  const MUSIC = ISO.MUSIC_B;
  const ss = (a, b, x) => ISO.smoothstepJS(a, b, x);

  // one step of the grid = the beam's gate + (past 50%) B's elements
  function gen2(P, k, t, sx) {
    const s = P.state, out = [];
    for (const ev of ISO.genC(P, k, t, sx)) { ev.gate = true; out.push(ev); }
    if (s.elK > 0.001) {
      s.dens = s.elK; s.scale = 0.15 + 0.85 * s.elK;      // B reads these
      for (const ev of ISO.genB(P, k, t, sx)) { ev.el = true; out.push(ev); }
    } else s.bar = null;                                  // a fresh bar when they come back
    return out;
  }

  reg({
    id: 'SRC-68.2', family: 'SRC-68', ver: 2,
    title: 'ISOTRP C · Beam', tech: 'BEAM + GATED ELEMENTS PAST 50% + TRAILS PAST 70%',
    music: MUSIC,
    tags: ['STUDY', 'AFTER 404.ZERO', 'STROBE', 'WEBGL', 'FEEDBACK', 'THE SOURCE LAW'],
    desc: 'V1\'s beam, and the right hand becomes a key that opens the other ISOTRP studies one by one. Up to half its reach it only chops the beam, steady to strobe. Past half, random flashes from the Gated study start to fall around the beam: first one a bar and small, then dense and large. Past seventy percent the Trails study wakes up and the whole picture starts to leave echoes, and from then on the left hand draws them out.',
    interact: 'THE SOURCE LAW. R IS THE KEY: 0-50% chops the beam (steady → strobe). PAST 50% random elements join it, from one small flash a bar to dense bursts of rings, eclipses, columns and washes at arm\'s length. PAST 70% the trails wake up. L IS WIDTH (hairline spindle → wide column) and, once R is past 70%, ALSO THE TRAILS: close is clean, far leaves echoes over a second long.',
    sound: '120 bpm, F phrygian. The beam tone of V1, gated on the same audio-clock times as the light. Every element is Gated\'s click / thump / blip. When the trails are open, each element also rings a bell in key through the delay and reverb, and the send follows the left hand, so the sound echoes as long as the light does.',

    init(P) {
      const s = { noGL: ISO.noGL(P), pres: 0, wid: 0.2, gate: 0.2, drift: P.rand() * 100, seq: ISO.newSeq(),
                  fired: 0, hold: false, held: [], elK: 0, trK: 0, mem: 0, dens: 0, scale: 0, bar: null };
      P.state = s;
      if (!s.noGL) ISO.make(P);
    },
    step(P, dt, t, inp) {
      const s = P.state; dt = Math.min(dt, 0.1);
      ISO.presence(s, dt); s.drift += dt;
      ISO.hand(s, 'wid', inp.L, SOURCE_IDLE(s.drift, 0.22, 0.1, 0.05), dt, 5);
      ISO.hand(s, 'gate', inp.R, SOURCE_IDLE(s.drift + 9, 0.08, 0.06, 0.06), dt, 6);
      const r = clamp(s.gate);
      s.elK = clamp((r - 0.5) / 0.5);                     // elements: 0 at 50%, all at 100%
      s.trK = ss(0.7, 1.0, r);                            // trails: wake at 70%, full at 100%
      s.mem = s.trK * clamp(s.wid);                       // ...drawn out by the LEFT hand
    },
    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return ISO.noGLDraw(g, w, h, 'ISOTRP C V2');
      const c = ISO.clock();
      if (!ISO.audioOwns(s)) ISO.pump(P, c.dom, c.t, c.t + 0.05, MUSIC.bpm, gen2);
      const dt = Math.min(0.1, Math.max(0.001, t - (s._lt || t))); s._lt = t;

      const beat = c.dom === 'a' ? T.phase(8) : ((c.t * MUSIC.bpm / 60) % 8) / 8;
      const base = ISO.beamLights(s, beat);
      const steady = 1 - ss(0.05, 0.3, s.gate);
      const vis = ISO.visible(P, c.t);
      let on = 0; const els = [];
      for (const L of vis) { if (L.type === 0 && L.s <= 0.0011) on = Math.max(on, L.i); else els.push(L); }
      // the beam and the frame-sized lights (column, wash) stay crisp; only the shapes leave trails
      for (const L of els) if (L.type === 5 || L.type === 7 || (L.type !== 2 && L.type !== 8 && L.s > 0.26)) L.direct = true;
      let lights = els.concat(base.map(L => Object.assign({}, L, { i: L.i * Math.max(steady * 0.9, on), direct: true })));
      if (s.hold) { if ((on > 0.9 || els.length) && s.fired !== s._hf) { s.held = lights; s._hf = s.fired; } lights = s.held; }

      const mem = clamp(s.mem), tau = 0.02 + 1.6 * Math.pow(mem, 1.4);
      ISO.render(P, g, w, h, lights, {
        t, soft: 0.3,
        fb: mem > 0.002 ? Math.exp(-dt / tau) : 0, fbMax: 1,   // echoes fade out of the light, never pile up to white
        zoom: 1 + dt * 0.30 * mem, dy: -dt * 0.01 * mem, blur: 1.4 * mem,
        exp: 0.95 + 0.25 * s.wid
      });
      ISO.hud(P, g, w, h, 'WIDTH ' + Math.round(s.wid * 100) + '   KEY ' + Math.round(s.gate * 100) +
        (steady > 0.5 ? '   · STEADY' : '   · CHOPPED') +
        (s.elK > 0 ? '   ELEMENTS ' + Math.round(s.elK * 100) : '') +
        (s.trK > 0 ? '   TRAILS ' + Math.round(mem * 100) + ' (' + tau.toFixed(2) + ' s)' : '') +
        (c.dom === 'a' ? '   · A/V LOCKED' : ''));
    },
    audio(A, P) {
      const v = A.voice();
      const o1 = v.osc('sawtooth', 87), o2 = v.osc('sawtooth', 87), sub = v.osc('sine', 43.6);
      o2.detune.value = 9; o1.detune.value = -7;
      const f = v.filter('lowpass', 300, 0.9);
      const steadyG = v.g(0), chopG = v.g(0);
      o1.connect(f); o2.connect(f); sub.connect(f);
      f.connect(steadyG); f.connect(chopG); steadyG.connect(v.group); chopG.connect(v.group);
      if (A.revIn) { const sd = A.ctx.createGain(); sd.gain.value = 0.35; chopG.connect(sd); sd.connect(A.revIn); }
      const tune = gl => { const r = H.chordTone(0, -2); A.set(o1.frequency, r * 2, gl); A.set(o2.frequency, r * 2, gl); A.set(sub.frequency, r, gl); };
      tune(0.05); H.onChord(() => tune(0.6));
      v.fadeIn(1, 1.2);
      return {
        tick() {
          const s = P.state; if (s.noGL || !T.running) return;
          s.seq.tickWall = performance.now();
          const now = A.t(), gate = 0.4 + 0.6 * s.pres, mem = clamp(s.mem);
          const steady = 1 - ss(0.05, 0.3, s.gate), lvl = (0.05 + 0.05 * s.wid) * gate;
          A.set(steadyG.gain, lvl * steady * 0.9, 0.08);
          A.set(f.frequency, 180 + 2600 * Math.pow(s.wid, 1.5), 0.2);
          ISO.pump(P, 'a', now, now + 0.12, MUSIC.bpm, gen2, ev => {
            if (ev.gate) {
              const d = Math.max(0.012, ev.dur);
              chopG.gain.setValueAtTime(lvl * ev.amp, ev.t);
              chopG.gain.setValueAtTime(0, ev.t + d);
              A.hit({ at: ev.t, freq: 5200, q: 1.2, dur: 0.018, vol: 0.03 * gate });
              return;
            }
            ISO.soundB(A, P, ev, gate * (0.6 + 0.4 * s.elK));
            if (mem > 0.05) {
              const L = ev.lights[0], oct = L.s > 0.3 ? -1 : L.s > 0.18 ? 0 : 1;
              A.bell(H.chordTone(((L.x + 1) * 3.5) | 0, oct), {
                at: ev.t, vol: 0.025 * mem * gate, dur: 1 + 2 * mem, rev: 0.3 + 0.5 * mem, del: 0.1 + 0.6 * mem, role: 'bells' });
            }
          });
          if (typeof MOut !== 'undefined' && MOut.expr) { MOut.expr('bass', s.wid); MOut.expr('texture', s.gate); MOut.expr('bells', mem); }
        },
        stop() { v.kill(); }
      };
    }
  });
})();
