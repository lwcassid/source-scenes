/* ---------- TWIST · the Midi Fighter Twister ----------
   A self-contained module for the controller Edson plays: 16 push-encoders in
   a 4x4 grid. It owns its own input, its own map, its own persistence and its
   own panel (part253), and nothing else has to know it exists.

   🔴 WHY IT DOES NOT GO THROUGH NAV. Their input gate forwards CC to
   NAV.onMsg on a RISING EDGE ONLY and without the value (part2_core ~686) —
   right for a footswitch, useless for a fader, which needs every one of the
   0-127.

   SO IT LISTENS RAW, AND ADDITIVELY. Core does `inp.onmidimessage = onMidiMsg`;
   MIDIInput is an EventTarget, so `addEventListener('midimessage')` runs
   ALONGSIDE that property handler instead of replacing it. Their hands, nav
   and learn keep working untouched. Assigning onmidimessage would have taken
   the theremin out.

   THE MODEL IS THE HARDWARE. A slot IS an encoder, 1-16. Each slot can do one
   thing when TURNED and one when PUSHED, which is exactly what the device is.
   The factory default sends CC n and Note n on channel 1 for encoder n, so
   AUTO-MAP needs no learning at all — and per-slot LEARN is there for when a
   device does not match.

   IT REFUSES to bind anything the hands own (midi.map.L/R) or show control
   owns (NAV.claims) — their own guard, so mapping a knob can never quietly
   steal the instrument out from under him. */
(() => {
  const KEY = 'srcTwist2', CKEY = 'srcTwistCol', SLOTS = 16;

  /* ---------- THE LIGHTS ----------
     From the official guide (channels 0-based, as the manual numbers them):

       ch 0   CC n  →  the 11-LED RING position   ("sync the display value …
                       map the MIDI OUT for that parameter to the same MIDI
                       number on channel 0")
       ch 1   CC n  →  the RGB segment COLOUR. 0 = inactive colour,
                       127 = active colour, 1-126 = a hue across the spectrum
       ch 2   CC n  →  animation / brightness:
                         RGB strobe 1-8 · RGB pulse 9-16 · RGB brightness 17-47
                         ind. strobe 49-56 · ind. pulse 57-64 · ind. bright 65-95
                         rainbow 127

     🔴 And the trap the manual states outright: "If the encoder switch MIDI
     channel or number settings are changed from default the colour and
     animation controls do NOT change." So the LED is ALWAYS addressed by the
     slot's factory number, never by whatever a LEARN bound the input to.
     Two addresses per slot, which is why `led` is separate from `cc`/`note`. */
  const CH_RING = 0, CH_COLOUR = 1, CH_ANIM = 2;
  const RGB_BRIGHT = 17, RGB_BRIGHT_TOP = 47;      // 17-47
  const RGB_PULSE = 9;                              // 9-16

  /* The 1-126 scale is a hue sweep. These are good starting points, not gospel —
     the exact hue per number is not published, so they are EDITABLE in the panel
     and Edson should trust the device over this table. */
  const HUES = [
    { k: 'blue',    v: 15 }, { k: 'cyan',   v: 30 }, { k: 'green',  v: 45 },
    { k: 'yellow',  v: 60 }, { k: 'amber',  v: 72 }, { k: 'red',    v: 85 },
    { k: 'magenta', v: 100 }, { k: 'violet', v: 113 },
  ];
  const DEFCOL = { fader: 72, inst: 85, solo: 45, cue: 15 };     // amber · red · green · blue
  function family(fn) {
    if (fn === 'none') return null;
    if (fn.indexOf('fader') === 0) return 'fader';
    if (fn === 'inst') return 'inst';
    if (fn.indexOf('solo') === 0 || fn === 'unsolo') return 'solo';
    return 'cue';
  }

  const FN = {
    none:   { label: '—',              short: '–',   turn: false, push: false },
    fader0: { label: 'LAYER 1',        short: 'L1',  turn: true },
    fader1: { label: 'LAYER 2',        short: 'L2',  turn: true },
    fader2: { label: 'LAYER 3',        short: 'L3',  turn: true },
    fader3: { label: 'LAYER 4',        short: 'L4',  turn: true },
    fader4: { label: 'LAYER 5',        short: 'L5',  turn: true },
    fader5: { label: 'LAYER 6',        short: 'L6',  turn: true },
    inst:   { label: 'INSTRUMENT VOL', short: 'VOL', turn: true },
    solo0:  { label: 'SOLO 1',         short: 'S1',  push: true },
    solo1:  { label: 'SOLO 2',         short: 'S2',  push: true },
    solo2:  { label: 'SOLO 3',         short: 'S3',  push: true },
    solo3:  { label: 'SOLO 4',         short: 'S4',  push: true },
    solo4:  { label: 'SOLO 5',         short: 'S5',  push: true },
    solo5:  { label: 'SOLO 6',         short: 'S6',  push: true },
    unsolo: { label: 'UNSOLO',         short: 'US',  push: true },
    go:     { label: 'GO',             short: 'GO',  push: true },
    back:   { label: 'BACK',           short: 'BK',  push: true },
    abort:  { label: 'ABORT',          short: 'AB',  push: true },
    stop:   { label: 'STOP',           short: 'ST',  push: true },
  };
  const TURNS = Object.keys(FN).filter(k => k === 'none' || FN[k].turn);
  const PUSHES = Object.keys(FN).filter(k => k === 'none' || FN[k].push);

  /* the layout the device ships with, and the one the show uses */
  function factory() {
    const s = [];
    // `led` is the FACTORY number and never moves, even if a LEARN rebinds
    // cc/note — see the note above the channel table.
    for (let i = 0; i < SLOTS; i++) s.push({ turn: 'none', push: 'none', cc: i, note: i, ch: 0, dev: null, led: i });
    for (let i = 0; i < 6; i++) { s[i].turn = 'fader' + i; s[i].push = 'solo' + i; }
    s[7].turn = 'inst';  s[7].push = 'unsolo';
    s[8].push = 'go';    s[9].push = 'back';
    s[10].push = 'abort'; s[11].push = 'stop';
    return s;
  }

  const T = {
    // HUES must be on the object, not just in the closure — the panel reads
    // TWIST.HUES, and an undefined .forEach there throws during LOAD, which
    // aborts the rest of the concatenated script and leaves every `const`
    // declared after it permanently in the temporal dead zone. The symptom is
    // a baffling "Cannot access 'FAV' before initialization" from a core file
    // that is not even broken.
    FN, TURNS, PUSHES, SLOTS, HUES,
    slots: [], learn: null, note: null, _last: {}, _btn: {}, _wired: false, lastMsg: '',
    // messages per second. A controller in the wrong mode can send hundreds,
    // and "it froze" is what that looks like from outside — so put a number
    // on screen instead of leaving it a mystery.
    rate: 0, _n: 0, _rateT: 0, learnUntil: 0,
    /* ENCODER MODE, detected rather than assumed. Factory is absolute CC
       (0-127 sweep). Relative sends tiny values around a centre — 63/65 for
       binary offset, 1/127 for two's complement — and reading those as
       absolute parks every fader near zero or half and never moves it.
       Detected per CC from what actually arrives; the panel reports it. */
    mode: {}, _seen: {}, _acc: {},
    out: null, lights: true, colour: {}, _sent: {}, _echo: {},

    load() {
      try { this.colour = Object.assign({}, DEFCOL, JSON.parse(localStorage.getItem(CKEY) || '{}')); }
      catch (e) { this.colour = Object.assign({}, DEFCOL); }
      try {
        const m = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (m && m.length === SLOTS) {
          this.slots = m;
          this.slots.forEach((sl, i) => { if (sl.led === undefined) sl.led = i; });   // migrate
          return;
        }
      } catch (e) {}
      this.slots = factory();
    },
    saveColour() { try { localStorage.setItem(CKEY, JSON.stringify(this.colour)); } catch (e) {} },
    setColour(fam, v) { this.colour[fam] = v; this.saveColour(); this._sent = {}; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.slots)); } catch (e) {} },
    autoMap() { this.slots = factory(); this.save(); this.note = 'factory layout applied'; },
    clearAll() { this.slots = factory().map(s => Object.assign(s, { turn: 'none', push: 'none' })); this.save(); },
    setFn(i, which, fn) { if (this.slots[i]) { this.slots[i][which] = fn; this.save(); } },
    LEARN_MS: 6000,
    arm(i) {
      this.learn = (this.learn === i) ? null : i;
      this.note = this.learn === null ? null : 'turn or press encoder ' + (i + 1);
      // a deadline, so an armed slot can never eat input indefinitely — the
      // same six seconds NAV.arm uses, for the same reason
      this.learnUntil = (typeof performance !== 'undefined' ? performance.now() : Date.now()) + this.LEARN_MS;
    },
    disarm() { this.learn = null; this.note = null; },

    taken(p) {
      try {
        if (typeof midi !== 'undefined' && midi.map) {
          const same = x => x && x.type === p.type && x.ch === p.ch && x.num === p.num;
          if (same(midi.map.L) || same(midi.map.R)) return 'the hands';
        }
        if (typeof NAV !== 'undefined' && NAV.claims && NAV.claims(p)) return 'show control';
      } catch (e) {}
      return null;
    },

    handle(e) {
      const d = e.data; if (!d || d.length < 2) return;
      this._n++;
      const nowMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();
      if (nowMs - this._rateT > 1000) { this.rate = this._n; this._n = 0; this._rateT = nowMs; }
      const hi = d[0] & 0xF0, ch = d[0] & 15, num = d[1], raw = d.length > 2 ? d[2] : 127;
      const dev = (e.target && e.target.id) || null;
      const isCC = hi === 0xB0, isNote = (hi === 0x90 && raw > 0);
      if (!isCC && !isNote) return;
      // never read our own light update back as a knob move
      const echoAt = this._echo[ch + ':' + num];
      if (echoAt && nowMs - echoAt < 40) return;

      /* 🔴 THE BUG THAT MADE "THE TWISTER STOPS WORKING".
         This branch SWALLOWS every message while armed — correct, so a knob
         you are binding does not also fire what it is bound to. But it could
         arm and NEVER DISARM: binding needed the value to move by 3, and a
         slowly turned encoder moves by ONE per detent (and a relative one
         sends 63/65, a step of two). Either way the bind never completed,
         LEARN stayed on forever, and every message after it was eaten here —
         while the page, the picture and the music all carried on perfectly
         and the controller appeared dead. A reload cleared it because `learn`
         was never persisted.
         Three fixes: it times out, it accepts a relative encoder's step, and
         it can never swallow more than a few seconds of input. */
      if (this.learn !== null) {
        if (nowMs > this.learnUntil) { this.learn = null; this.note = 'learn timed out'; }
      }
      if (this.learn !== null) {
        const p = { type: isCC ? 'cc' : 'note', ch, num, dev };
        const why = this.taken(p);
        if (why) { this.note = 'that one belongs to ' + why; return; }
        if (isCC) {
          const k = ch + ':' + num; const prev = this._last[k]; this._last[k] = raw;
          // ANY change counts. A relative encoder moves by 1-2 and would never
          // have cleared a threshold of 3.
          if (prev === undefined || raw === prev) return;
          this.slots[this.learn].cc = num;
        } else {
          this.slots[this.learn].note = num;
        }
        this.slots[this.learn].ch = ch; this.slots[this.learn].dev = dev;
        this.note = 'slot ' + (this.learn + 1) + ' ← ' + (isCC ? 'CC' : 'NOTE') + num;
        this.learn = null; this.save();
        return;
      }

      for (let i = 0; i < this.slots.length; i++) {
        const s = this.slots[i];
        if (s.ch !== ch) continue;
        if (s.dev && dev && s.dev !== dev) continue;
        if (isCC && s.cc === num && s.turn !== 'none') {
          this.fire(s.turn, this.value(ch, num, raw, s.turn));
          this.lastMsg = 'K' + (i + 1); return;
        }
        if (isNote && s.note === num && s.push !== 'none') { this.fire(s.push, 1); this.lastMsg = 'K' + (i + 1); return; }
      }
    },

    /* turn a raw CC into a 0..1 the show can use, whichever mode the encoder
       is in. Relative is only believed after several messages that are ALL
       tiny steps around a centre — one stray 64 is not evidence. */
    value(ch, num, raw, fn) {
      const k = ch + ':' + num;
      const S = this._seen[k] || (this._seen[k] = { lo: raw, hi: raw, n: 0, set: {}, d: 0 });
      S.n++; if (raw < S.lo) S.lo = raw; if (raw > S.hi) S.hi = raw;
      if (S.set[raw] === undefined) { S.set[raw] = 1; S.d++; }

      /* THE TEST IS THE RANGE, NOT THE VALUES. An absolute knob swept slowly
         passes THROUGH 60-68 one step at a time, so "is this value near the
         centre" misreads a real sweep as relative — it did, on the first
         attempt here, and that is worse than the bug it was fixing because it
         fails silently on working hardware.
         What actually separates them: absolute SPANS its range, relative never
         leaves a handful of values however long you turn. */
      if (this.mode[k] === undefined) {
        // DISTINCT VALUES is the sharp test. A relative encoder emits from a
        // tiny fixed vocabulary — 63/64/65, or 1/127 — and REPEATS it forever,
        // however far you turn. An absolute one emits a new number every step,
        // so fourteen messages means about fourteen different values even if
        // you only nudged it. Range alone was not enough: a small slow
        // absolute wiggle also stays inside ten.
        if (S.hi - S.lo > 20) this.mode[k] = 'abs';
        else if (S.n >= 14 && S.d <= 4 && S.hi - S.lo <= 10) this.mode[k] = 'rel';
        else if (S.n >= 14 && S.d >= 8) this.mode[k] = 'abs';
      }
      if (this.mode[k] !== 'rel') return raw / 127;

      let d = 0;                                    // binary offset, or two's complement
      if (raw >= 57 && raw <= 71) d = raw - 64;
      else if (raw >= 1 && raw <= 7) d = raw;
      else if (raw >= 121) d = raw - 128;
      const cur = (this._acc[fn] !== undefined) ? this._acc[fn] : this.current(fn);
      const next = clamp(cur + d / 48);             // ~48 clicks end to end
      this._acc[fn] = next;
      return next;
    },

    /* where a control already is, so a relative knob picks up from the show
       rather than jumping */
    current(fn) {
      try {
        if (fn.indexOf('fader') === 0 && window.MIX) return MIX.get(+fn.slice(5)) || 0;
        if (fn === 'inst' && window.MIX) { const st = MIX.state(); return st ? st.inst : 1; }
      } catch (e) {}
      return 0;
    },
    modeOf() {
      const vals = Object.values(this.mode);
      if (!vals.length) return '';
      return vals.indexOf('rel') >= 0 ? 'RELATIVE' : 'ABSOLUTE';
    },

    fire(fn, val) {
      if (fn.indexOf('fader') === 0) { if (window.MIX) MIX.set(+fn.slice(5), val); return; }
      if (fn === 'inst') { if (window.MIX) MIX.instrument(val); return; }
      if (fn.indexOf('solo') === 0) { if (window.MIX) MIX.solo(+fn.slice(4)); return; }
      if (fn === 'unsolo') { const P = window.MIX && MIX.P(); if (P) P.state.solo = -1; return; }
      if (!window.POEMDECK) return;
      if (fn === 'go') POEMDECK.go();
      else if (fn === 'back') POEMDECK.back();
      else if (fn === 'abort') POEMDECK.abort();
      else if (fn === 'stop') POEMDECK.stop();
    },

    /* ---- output ---- */
    outName: null, outErr: null, sentCount: 0,
    findOut() {
      if (this.out && this.out.state !== 'disconnected') return this.out;
      this.out = null; this.outName = null;
      try {
        if (typeof midi === 'undefined' || !midi.access) { this.outErr = 'no MIDIAccess yet — press CONNECT in Source input'; return null; }
        const all = [];
        midi.access.outputs.forEach(o => all.push(o));
        this.outNames = all.map(o => o.name);
        if (!all.length) { this.outErr = 'no MIDI OUTPUT ports at all'; return null; }
        // prefer the Twister by name; if the name does not match, fall back to
        // the only port there is rather than silently doing nothing
        let pick = all.find(o => /twister|fighter/i.test(o.name || ''));
        if (!pick && all.length === 1) pick = all[0];
        if (!pick) { this.outErr = 'no port matched "twister" — ports: ' + this.outNames.join(', '); return null; }
        // ⚠️ send() is specified to open implicitly, but an explicit open is
        // what actually makes Chrome deliver reliably — and it is harmless.
        try { if (pick.open) pick.open(); } catch (e) {}
        this.out = pick; this.outName = pick.name; this.outErr = null;
      } catch (e) { this.outErr = 'findOut: ' + e.message; }
      return this.out;
    },
    send(ch, num, val) {
      const o = this.findOut(); if (!o) return;
      try {
        o.send([0xB0 | (ch & 15), num & 127, Math.max(0, Math.min(127, Math.round(val)))]);
        this.sentCount++;
        // remember what we just pushed, so the device's own report of it — if it
        // ever makes one — cannot be read back as the operator turning a knob
        this._echo[ch + ':' + num] = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      } catch (e) { this.outErr = 'send failed: ' + e.message; }
    },

    /* ---- a direct test, because "the lights do not change" has many causes ----
       Walks every knob through red · green · blue · off, ignoring all state.
       If this does nothing, the problem is the PORT, not the light logic. */
    test() {
      const o = this.findOut();
      if (!o) { this.note = 'TEST: ' + (this.outErr || 'no output port'); return false; }
      const steps = [[85, 'red'], [45, 'green'], [15, 'blue']];
      steps.forEach(([col], k) => {
        setTimeout(() => {
          for (let i = 0; i < SLOTS; i++) {
            this.send(CH_COLOUR, i, col);
            this.send(CH_ANIM, i, RGB_BRIGHT_TOP);
            this.send(CH_RING, i, 127);
          }
        }, k * 600);
      });
      setTimeout(() => { this._sent = {}; this.paintLights(); }, 2000);
      this.note = 'TEST → ' + o.name + ' · watch the knobs';
      return true;
    },
    diag() {
      this.findOut();
      const ins = []; const outs = [];
      try { if (typeof midi !== 'undefined' && midi.access) {
        midi.access.inputs.forEach(i => ins.push(i.name + '[' + i.state + '/' + i.connection + ']'));
        midi.access.outputs.forEach(o => outs.push(o.name + '[' + o.state + '/' + o.connection + ']'));
      } } catch (e) {}
      return { out: this.outName, outErr: this.outErr, lights: this.lights,
               messagesSent: this.sentCount, inputs: ins, outputs: outs };
    },

    /* one place that decides what each light should be */
    lightFor(i) {
      const S = this.slots[i];
      const fam = family(S.turn) || family(S.push);
      const armed = this.learn === i;
      if (!fam) return { ring: 0, col: 0, anim: RGB_BRIGHT + 2 };          // assigned nothing: barely lit

      let ring = 0;
      if (S.turn !== 'none') {
        const v = this.current(S.turn);
        ring = Math.round(clamp(v) * 127);
      } else if (S.push !== 'none') {
        // a cue or a solo has no value, so the ring reads as a full mark
        ring = 127;
      }
      let col = this.colour[fam] !== undefined ? this.colour[fam] : DEFCOL[fam];

      // brightness carries STATE: armed pulses, a soloed layer burns, a layer
      // the budget stood down is half-lit so the hardware never lies about
      // what is actually on the wall
      /* BRIGHTNESS IS STATE, NOT VALUE — four steps, nothing in between.
         Tracking the fade continuously meant one fader move sent eight
         brightness messages on top of the ring, for information the ring was
         already showing. Quantised, a move sends the ring and nothing else,
         and the four levels are actually distinguishable in a dark room. */
      const DIM = RGB_BRIGHT + 2, IDLE = RGB_BRIGHT + 10,
            ON = RGB_BRIGHT + 22, BURN = RGB_BRIGHT_TOP;
      let anim = ON;
      if (armed) anim = RGB_PULSE + 3;                                    // pulsing: learning
      else if (S.turn.indexOf('fader') === 0) {
        const n = +S.turn.slice(5);
        const st = (window.MIX && MIX.state) ? MIX.state() : null;
        if (!st || n >= st.layers.length) anim = DIM;                     // no such layer here
        else if (st.solo === n) anim = BURN;                              // soloed
        else if (st.want[n] > 0.02 && st.live.indexOf(n) < 0) anim = IDLE; // budget stood it down
        else anim = st.fade[n] > 0.02 ? ON : IDLE;                        // up, or down
      }
      return { ring, col, anim };
    },
    paintLights() {
      if (!this.lights || !this.findOut()) return;
      for (let i = 0; i < this.slots.length; i++) {
        const S = this.slots[i], n = (S.led === undefined ? i : S.led);
        const L = this.lightFor(i);
        const prev = this._sent[i] || {};
        // only what changed — the device does not need 480 messages a second
        if (prev.col !== L.col) { this.send(CH_COLOUR, n, L.col); }
        if (prev.anim !== L.anim) { this.send(CH_ANIM, n, L.anim); }
        if (prev.ring !== L.ring) { this.send(CH_RING, n, L.ring); }
        this._sent[i] = L;
      }
    },
    allOff() {
      const o = this.findOut(); if (!o) return;
      for (let i = 0; i < SLOTS; i++) {
        const n = (this.slots[i] && this.slots[i].led !== undefined) ? this.slots[i].led : i;
        this.send(CH_RING, n, 0); this.send(CH_ANIM, n, RGB_BRIGHT);
      }
      this._sent = {};
    },

    wire() {
      if (typeof midi === 'undefined' || !midi.access) return;
      const h = e => { try { this.handle(e); } catch (err) {} };
      const attach = () => {
        try {
          midi.access.inputs.forEach(inp => {
            if (inp.__twist) return;
            inp.__twist = true;
            inp.addEventListener('midimessage', h);   // ADDITIVE — never onmidimessage
          });
        } catch (e) {}
      };
      attach();
      if (!this._wired) {
        this._wired = true;
        try { midi.access.addEventListener('statechange', attach); } catch (e) {}
        setInterval(attach, 3000);                    // replugs and BLE re-pairs
      }
    },
    devices() {
      const out = [];
      try { if (typeof midi !== 'undefined' && midi.access) midi.access.inputs.forEach(i => out.push(i.name)); } catch (e) {}
      return out;
    },
    connected() { return this.devices().some(n => /twister|fighter/i.test(n)); }
  };

  T.load();
  window.TWIST = T;
  // the deadline above only fires when a message arrives. If the controller is
  // silent while armed, nothing would ever clear it — so clear it on a timer
  // as well, and let Escape do it by hand.
  setInterval(() => {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (T.learn !== null && now > T.learnUntil) { T.learn = null; T.note = 'learn timed out'; }
  }, 500);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && T.learn !== null) T.disarm(); });
  // 12 Hz is plenty for a light and gentle on a USB MIDI port; only changes
  // are actually transmitted, so a still rig sends nothing at all
  setInterval(() => {
    // do NOT swallow this. An error here is why the lights would be dead, and
    // a silent catch turned that into an unexplainable symptom.
    try { T.paintLights(); }
    catch (e) { T.outErr = 'paint: ' + e.message; }
  }, 80);
  const boot = setInterval(() => { if (typeof midi !== 'undefined' && midi.access) T.wire(); }, 1000);
  setTimeout(() => clearInterval(boot), 180000);
  T.wire();
})();
