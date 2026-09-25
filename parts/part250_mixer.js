/* ---------- SRC-62/63/64 · BIRTH OF A TEMPLE, in three movements ----------
   The show as THREE scenes, each holding two visuals as LAYERS on their own
   faders. Edson, Sep 24: mixing beats cutting, but one key and one tempo for
   a whole night is the wrong price to pay for it.

   So the night is three movements. INSIDE a movement you mix — bring one
   picture up under the other, let the old one go, or leave both and get a
   third thing neither of them was. BETWEEN movements you cut, and the cut is
   where the key and the tempo change, which is exactly where a listener
   expects one. The two places the set hard-cuts are now the two places it
   was always going to modulate.

     I  · ORIGIN     F aeolian, 54  · THE POINT + ECLIPSE
     II · ORBIT      A aeolian, 62  · THE PASSAGE + THE NAMES
     III· ASCENSION  F aeolian, 50  · ASCENSION + THE POINT, RETURNED

   It ends in the key it opened in, slower. The loop closes in the music as
   well as in the picture.

   ⭐ AND THE SPLIT PAYS FOR ITSELF IN FRAME TIME. Cost is draw calls, not
   arithmetic: Eclipse, Passage and Ascension each stroke thousands of
   separate paths (23-34 fps alone at 1920x1200); Point, Names and Returned
   are cheap. Every movement here is EXACTLY ONE EXPENSIVE LAYER PLUS ONE
   CHEAP ONE — cost 4 against a budget of 7. So both layers of a movement can
   sit at full, together, indefinitely. Two heavies never meet.

   IT IS A HOST, NOT A REWRITE. A scene instance is a plain object and PIECES
   holds every def, so each movement builds sub-instances and calls the SAME
   init/step/draw the six already have. They are untouched and still open on
   their own. If the mixer is cut, the six are exactly as they were.

   AUDIO FOLLOWS THE PICTURE. Each layer keeps its own audio(); its level
   rides its own fader. A.out/A.revIn/A.delIn are swapped to that layer's
   nodes around every construction and every tick, so voices, one-shots and
   reverb sends all land on the right fader — pull a layer down and its tail
   goes with it. A seventh, locked fader is THE INSTRUMENT: everything this
   machine makes, under one level, so Edson can solo or step out entirely and
   leave the room to Nima and Lance. */
(() => {
  const COST = { 'SRC-56': 1, 'SRC-57': 3, 'SRC-58': 3, 'SRC-59': 1, 'SRC-60': 3, 'SRC-61': 1 };
  const CULL = 0.012;      // below this a layer does not step, draw, or sound
  const BUDGET = 7;
  const MIXERS = [];

  function makeMixer(M) {
    MIXERS.push(M.id);
    reg({
      id: M.id, family: M.id, ver: 1, title: M.title, tech: M.tech,
      audioIn: true, textIsContent: true,
      music: M.music, fx: { bloom: M.bloom || 0.42 },
      tags: ['TEMPLE SET', 'MOVEMENT ' + M.part, 'MIX, DO NOT CUT', 'THE SOURCE LAW'],
      desc: M.desc, interact: M.interact, sound: M.sound,

      init(P) {
        const s = { L: [], insts: [], fade: new Float32Array(M.layers.length),
                    want: new Float32Array(M.layers.length), live: [], spent: 0,
                    inst: 1, solo: -1, pres: 0 };
        M.layers.forEach((id, i) => {
          const def = (typeof PIECES !== 'undefined') ? PIECES.find(x => x.id === id) : null;
          // "THE POINT" and "THE PASSAGE" both abbreviate to "THE" if you just
          // take the first letters. Drop the article, and prefer what comes
          // after a comma — "THE POINT, RETURNED" is RETURNED, not POINT.
          // strip the BoT search prefix and the article before abbreviating, or
          // every layer in every movement reads "BOT"
          const full = (def ? def.title.toUpperCase() : id).replace(/^\s*BOT\s*·\s*/, '');
          const shortName = (full.indexOf(',') >= 0 ? full.split(',').pop() : full)
            .replace(/^\s*THE\s+/, '').trim();
          s.L.push({ id, def, name: full, short: shortName, cost: COST[id] || 2 });
          const sub = {
            def, canvas: P.canvas, g: P.g, w: P.w, h: P.h, state: {},
            seed: (P.seed + i * 7919) | 0, focused: true, visible: true, rand: null,
            hosted: true, ping() {}
          };
          sub.rand = mulberry32(sub.seed);
          try { if (def) def.init(sub); } catch (e) { console.error('mixer init', id, e); }
          s.insts.push(sub);
        });
        s.want[0] = 1;                      // opening on black helps nobody
        P.state = s;
      },

      step(P, dt, t, inp) {
        const s = P.state;
        const live = SOURCE_PRES();   // always 1 — the last position holds (part249_source.js)
        s.pres += (live - s.pres) * Math.min(1, dt * 1.5);

        const order = [];
        for (let i = 0; i < s.L.length; i++) {
          const target = (s.solo >= 0) ? (i === s.solo ? 1 : 0) : s.want[i];
          s.fade[i] += (target - s.fade[i]) * Math.min(1, dt * 4.5);   // a knob jump is a move, not a jolt
          if (s.fade[i] > CULL) order.push(i);
        }
        /* THE BUDGET. With one heavy and one cheap layer per movement this
           never bites — it is here so a third layer added later degrades the
           QUIETEST picture instead of the frame rate for the whole room. */
        order.sort((a, b) => s.fade[b] - s.fade[a]);
        const keep = []; let spent = 0;
        for (const i of order) {
          const c = s.L[i].cost;
          if (spent + c <= BUDGET || !keep.length) { keep.push(i); spent += c; }
        }
        keep.sort((a, b) => a - b);          // draw in set order, not by level
        s.live = keep; s.spent = spent;
        for (const i of keep) { try { s.L[i].def.step(s.insts[i], dt, t, inp); } catch (e) {} }
      },

      draw(P, g, w, h, t, inp) {
        const s = P.state;
        g.globalCompositeOperation = 'source-over';
        g.fillStyle = '#000'; g.fillRect(0, 0, w, h);      // the ground, painted ONCE
        for (const i of s.live) {
          const a = clamp(s.fade[i]); if (a <= CULL) continue;
          g.save(); g.globalAlpha = a;                      // the fader
          try { s.L[i].def.draw(s.insts[i], g, w, h, t, inp); } catch (e) {}
          g.restore();
        }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        if (typeof OWPERF === 'undefined' || !OWPERF()) {
          const ms = Math.max(1, Math.sqrt(areaScale(P)));
          g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
          g.fillStyle = 'rgba(225,225,235,0.8)';
          const bars = s.L.map((L, i) => L.short + ' ' + Math.round(s.fade[i] * 100)).join('   ');
          // no INST here: SOUND OUT is the one level now (Edson, Sep 25)
          g.fillText(M.part + ' · ' + bars + '   load ' + s.spent + '/' + BUDGET, 10, h - 10);
        }
        if (typeof OWPOEM !== 'undefined') { OWPOEM.tick(); OWPOEM.draw(g, w, h); }
      },

      audio(A, P) {
        const s = P.state;
        const bus = A.ctx.createGain(); bus.gain.value = 1;   // THE INSTRUMENT
        bus.connect(A.master || A.ctx.destination);
        const nodes = s.L.map(() => null), voices = s.L.map(() => []);

        /* Run anything a layer does with A pointing at THAT layer's nodes, so
           its voices, its one-shots (A.tone/A.pluck2 go straight to A.out())
           and its sends all land on its own fader. Always restored. */
        const withLayer = (i, fn) => {
          const n = nodes[i]; if (!n) return fn();
          // 🔴 A.master AS WELL AS A.out. AE.tone/pluck2/bell/bassNote connect to
          // `this.master` DIRECTLY — not to this.out() — so swapping out() alone
          // left every one-shot bypassing the layer fader and, worse, the
          // INSTRUMENT fader: pulling yourself out of the room would still have
          // let plucks and bells through. Swap all four.
          const o = A.out, r = A.revIn, d = A.delIn, m = A.master;
          A.out = () => n.dry; A.revIn = n.rev; A.delIn = n.del; A.master = n.dry;
          try { return fn(); } finally { A.out = o; A.revIn = r; A.delIn = d; A.master = m; }
        };
        const build = i => {
          if (nodes[i]) return;
          const dry = A.ctx.createGain(); dry.gain.value = 0; dry.connect(bus);
          const rev = A.ctx.createGain(); rev.gain.value = 0;
          const del = A.ctx.createGain(); del.gain.value = 0;
          if (A.revIn) rev.connect(A.revIn);          // sends rejoin the global buses,
          if (A.delIn) del.connect(A.delIn);          // but scaled by this fader
          nodes[i] = { dry, rev, del, inst: null, lastV: -1 };
          // Restore the ORIGINAL property, not a bound copy of it — leaving a
          // bound function on A.voice would outlive this mixer and quietly
          // change the shared audio API for every scene after it.
          const origVoice = A.voice;
          A.voice = function (...a) { const v = origVoice.apply(A, a); voices[i].push(v); return v; };
          try { withLayer(i, () => { nodes[i].inst = s.L[i].def.audio(A, s.insts[i]); }); }
          catch (e) { console.error('mixer audio', s.L[i].id, e); }
          finally { A.voice = origVoice; }
          // a voice group connects to A.out() at CREATION, before the swap could
          // reach it — move it onto this layer's dry bus
          voices[i].forEach(v => { try { v.group.disconnect(); v.group.connect(nodes[i].dry); } catch (e) {} });
        };

        return {
          tick(inp, dt) {
            for (let i = 0; i < s.L.length; i++) {
              const on = s.live.indexOf(i) >= 0;
              if (on && !nodes[i]) build(i);          // built when first needed, then kept
              const n = nodes[i]; if (!n) continue;
              const v = on ? clamp(s.fade[i]) * clamp(s.inst) : 0;
              // only when it has actually moved. A still fader was scheduling
              // 180 setTargetAtTime events a second for nothing, on the audio
              // thread — invisible headless with --mute-audio, real on a laptop.
              if (Math.abs(v - n.lastV) > 0.002) {
                n.lastV = v;
                A.set(n.dry.gain, v, 0.08); A.set(n.rev.gain, v, 0.08); A.set(n.del.gain, v, 0.08);
              }
              if (on && n.inst && n.inst.tick) { try { withLayer(i, () => n.inst.tick(inp, dt)); } catch (e) {} }
            }
            // MOut.expr sends a CC — every frame was 60 messages a second to
            // Ableton for a value that barely changes
            const iv = clamp(s.inst);
            if (Math.abs(iv - (this._lastInst === undefined ? -1 : this._lastInst)) > 0.004) {
              this._lastInst = iv;
              if (typeof MOut !== 'undefined' && MOut.expr) MOut.expr('pad', iv);
            }
          },
          stop() {
            nodes.forEach(n => { if (n && n.inst && n.inst.stop) { try { n.inst.stop(); } catch (e) {} } });
            setTimeout(() => { try { bus.disconnect(); } catch (e) {} }, 800);
          }
        };
      }
    });
  }

  const SRC = 'THE SOURCE LAW is unchanged and applies to every layer at once: both hands at the instrument is the smallest, slowest form of whatever is up; both hands wide is everything at once. ';
  const FAD = 'The FADERS decide what is on the wall — the controller\'s knobs, or the number keys to solo one. A layer under 1% stops rendering and falls silent, so nothing costs anything while it is down. The INSTRUMENT fader is your whole output: pull it out and the room is the band.';

  makeMixer({
    id: 'SRC-62', part: 'I', title: 'BoT · I · Origin', tech: 'TWO LAYERS / F AEOLIAN 54',
    layers: ['SRC-56', 'SRC-57'], bloom: 0.36,
    music: { bpm: 54, root: 41, mode: 'aeolian', chordBars: 8,
             chords: [[0, 7, 12, 19], [0, 7, 14, 19], [0, 8, 15, 20], [0, 7, 12, 17]],
             chordNames: ['F5', 'Fsus2', 'D♭maj7/F', 'Fsus4'] },
    desc: 'The first movement. One disc of light, and the body that decides what passes around it — THE POINT and ECLIPSE on two faders, mixed rather than cut. Hold both hands at the Source and whatever is up is a coal; open them and it becomes a sun with a woven crown. The slowest music of the night, eight bars to a chord, in the key the whole set will end in.',
    interact: SRC + FAD,
    sound: 'F aeolian, eight bars a chord — the slowest harmonic rhythm of the night, because this movement is a held state rather than a progression. Each layer keeps its own sound and its level rides its own fader.'
  });

  makeMixer({
    id: 'SRC-63', part: 'II', title: 'BoT · II · Orbit', tech: 'TWO LAYERS / A AEOLIAN 62',
    layers: ['SRC-58', 'SRC-59'], bloom: 0.5,
    music: { bpm: 62, root: 45, mode: 'aeolian', chordBars: 4,
             chords: [[0, 7, 14, 19, 24], [0, 8, 15, 19, 26], [0, 5, 12, 17, 21], [0, 7, 11, 14, 23]],
             chordNames: ['Am(add9)', 'Fmaj7♯11/A', 'Dm9/A', 'Am(maj7)9'] },
    desc: 'The second movement, and the key lifts. THE PASSAGE and THE NAMES on two faders — the field you are moving through, and the nineteen thousand on their golden-angle shell. Mix them and you are travelling through the names themselves. Faster than the first movement and brighter, four bars to a chord.',
    interact: SRC + FAD,
    sound: 'A aeolian, four bars a chord, the top voice walking E–D–C–B. A lift of a major third from the first movement, and the fastest tempo of the night.'
  });

  makeMixer({
    id: 'SRC-64', part: 'III', title: 'BoT · III · Ascension', tech: 'TWO LAYERS / F AEOLIAN 50',
    layers: ['SRC-60', 'SRC-61'], bloom: 0.42,
    music: { bpm: 50, root: 41, mode: 'aeolian', chordBars: 4,
             chords: [[0, 7, 12, 19, 24], [0, 8, 15, 20, 27], [0, 10, 14, 19, 26], [0, 7, 12, 19]],
             chordNames: ['F5', 'D♭maj7♯11/F', 'E♭6/9/F', 'F5'] },
    desc: 'The last movement, back in the key it opened in and slower than anything before it. ASCENSION and THE POINT, RETURNED — the shards that break free, and the disc that empties into a ring. Mix them and the thing leaving and the thing left behind are on the wall together. The set closes where it started: one point, and the loop shut.',
    interact: SRC + FAD,
    sound: 'F aeolian at 50 — the key of the first movement, slower. The bass ends on the chord it began on, so the night closes harmonically as well as visually.'
  });

  /* the faders — reachable from the controller, the keyboard and the console */
  window.MIX = {
    MIXERS,
    P() { const f = (typeof focus !== 'undefined') ? focus.P : null;
          return (f && MIXERS.indexOf(f.def.id) >= 0) ? f : null; },
    count() { const P = this.P(); return P ? P.state.L.length : 0; },
    names() { const P = this.P(); return P ? P.state.L.map(l => l.short) : []; },
    set(i, v) { const P = this.P(); if (P && i >= 0 && i < P.state.L.length) P.state.want[i] = clamp(v); },
    get(i) { const P = this.P(); return P ? P.state.want[i] : 0; },
    instrument(v) { const P = this.P(); if (P) P.state.inst = clamp(v); },
    solo(i) { const P = this.P(); if (P && i < P.state.L.length) P.state.solo = (P.state.solo === i) ? -1 : i; },
    state() {
      const P = this.P(); if (!P) return null; const s = P.state;
      return { id: P.def.id, layers: s.L.map(l => l.short),
               fade: Array.from(s.fade).map(x => +x.toFixed(2)),
               want: Array.from(s.want).map(x => +x.toFixed(2)),
               live: s.live.slice(), load: s.spent + '/' + BUDGET,
               inst: +s.inst.toFixed(2), solo: s.solo };
    }
  };

  window.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!MIX.P()) return;
    const k = e.key;
    if (k >= '1' && k <= '9') { const i = +k - 1; if (i < MIX.count()) { e.preventDefault(); MIX.solo(i); } return; }
    if (k === '0') { e.preventDefault(); MIX.P().state.solo = -1; return; }
    /* − + step SOUND OUT, the rail's own volume, not a second hidden
       instrument level — Edson, Sep 25: they were the same thing twice, and
       a trim with no slider on screen is a volume drop nobody can explain. */
    const step = d => { const v = document.getElementById('volSlider'); if (!v) return;
      v.value = String(Math.max(0, Math.min(100, +v.value + d))); v.dispatchEvent(new Event('input'));
      const f = document.getElementById('fVol'); if (f) f.value = v.value; };
    if (k === '-' || k === '_') { e.preventDefault(); step(-10); return; }
    if (k === '+') { e.preventDefault(); step(10); return; }
  });
})();
