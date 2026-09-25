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
   AUTO-MAP needs no learning at all.

   THIS MODULE IS TWISTER-ONLY, by Edson's call on Sep 25: another controller
   gets its own module rather than a generic learn mode in this one. That is
   why there is no LEARN here — it was removed, not forgotten. A binding UI on
   a panel touched mid-performance was sixteen ways to deafen the controller
   for six seconds, to cover a case that does not arise.

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
     slot's factory number, never by whatever the input is bound to. Two
     addresses per slot, which is why `led` is separate from `cc`/`note`. */
  const CH_RING = 0, CH_COLOUR = 1, CH_ANIM = 2;
  const BLINK_S = 0.18;        // how long a pressed knob burns, in seconds
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
  /* `n` is how many layers the open scene actually has. THE GEOGRAPHY DOES
     NOT MOVE with it: instrument volume stays on knob 8 and the poem cues on
     9-12 whatever n is, because the thing being learned here is where your
     hand goes in the dark, and a control that migrates between scenes is
     worse than a dead one. Only the faders and solos shrink. */
  function factory(n) {
    const s = [];
    const k = Math.max(0, Math.min(6, n === undefined ? 6 : n));
    // `led` is the FACTORY number and never moves, even if cc/note are
    // remapped on the device — see the note above the channel table.
    for (let i = 0; i < SLOTS; i++) s.push({ turn: 'none', push: 'none', cc: i, note: i, ch: 0, dev: null, led: i });
    for (let i = 0; i < k; i++) { s[i].turn = 'fader' + i; s[i].push = 'solo' + i; }
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
    slots: [], note: null, _last: {}, _btn: {}, _wired: false, lastMsg: '',
    // messages per second. A controller in the wrong mode can send hundreds,
    // and "it froze" is what that looks like from outside — so put a number
    // on screen instead of leaving it a mystery.
    rate: 0, _n: 0, _rateT: 0,
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
      /* NOTHING SAVED YET. A layout cannot be built here, because at load
         time no scene is open and nLayers() can only guess six. `virgin` says
         "this is a default, not a decision", and the panel maps it properly
         the first time a scene with layers is actually open. A SAVED layout
         is never touched that way — it is Edson's, stale or not. */
      this.slots = factory();
      this.virgin = true;
    },
    saveColour() { try { localStorage.setItem(CKEY, JSON.stringify(this.colour)); } catch (e) {} },
    setColour(fam, v) { this.colour[fam] = v; this.saveColour(); this._sent = {}; },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.slots)); } catch (e) {} },
    autoMap() {
      const n = this.nLayers();
      this.slots = factory(n); this.save(); this._sent = {};
      this.note = 'mapped ' + n + ' layer' + (n === 1 ? '' : 's') + ' + instrument + cues';
    },
    clearAll() { this.slots = factory(0).map(s => Object.assign(s, { turn: 'none', push: 'none' })); this.save(); this._sent = {}; },
    setFn(i, which, fn) { if (this.slots[i]) { this.slots[i][which] = fn; this.save(); } },
    setSlotColour(i, v) {
      if (!this.slots[i]) return;
      if (v === null || v === undefined) delete this.slots[i].col; else this.slots[i].col = v;
      this.save(); this._sent = {};
    },

    /* HOW MANY LAYERS ARE ACTUALLY THERE. A movement has two or three
       visuals, not six, and mapping six faders put four dead knobs under
       Edson's hands and four meaningless rows in the panel. Ask the open
       mixer. Outside one there is nothing to fade, so fall back to the full
       set rather than to nothing, or the panel becomes unconfigurable. */
    nLayers() {
      try { const n = (window.MIX && MIX.count) ? MIX.count() : 0; return n > 0 ? n : 6; }
      catch (e) { return 6; }
    },

    /* IS THERE ANYTHING FOR THE FADERS TO DRIVE. Most scenes in this library
       are not ours and have no mixer — SRC-67 is one. There the layer faders,
       the solos and the instrument fader all still MATCH and still report a
       hit, but MIX.P() is null so every one of them is a no-op. From the
       hands that is indistinguishable from a broken controller, which is what
       it looked like. The poem cues are unaffected: POEMDECK is global and
       works in any scene. */
    hasMix() {
      try { return !!(window.MIX && MIX.P && MIX.P()); } catch (e) { return false; }
    },
    turnOpts() {
      const n = this.nLayers();
      return TURNS.filter(k => k.indexOf('fader') !== 0 || +k.slice(5) < n);
    },
    pushOpts() {
      const n = this.nLayers();
      return PUSHES.filter(k => k.indexOf('solo') !== 0 || +k.slice(4) < n);
    },

    /* PRESS FEEDBACK. Edson: "when I click a nob, we should make it blink so
       I know it worked." A push often fires something with no immediate
       picture — an unsolo, a cue that waits for the next bar — and without
       this the only confirmation is the thing itself, seconds later. */
    _hit: {},
    hit(i) { this._hit[i] = (typeof performance !== 'undefined' ? performance.now() : Date.now()); },
    hitAge(i) {
      const t = this._hit[i]; if (!t) return 99;
      return ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t) / 1000;
    },

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
      /* THE ECHO GUARD IS FOR CC ONLY. Every light message we send is a CC,
         so a note can never be our own echo — and keying the guard on
         ch:num alone meant a PRESS arriving within 40ms of that knob's ring
         update was thrown away as an echo. The painter runs every 80ms, so
         that was roughly half of all presses, silently. */
      /* AN ECHO IS THE SAME VALUE COMING BACK, not merely the same address.
         Matching on address alone was too blunt in both directions: it
         swallowed any press that shared a number with a light we had just
         written — and we write COLOUR on channel 1, which is also where this
         device can send its switches — while a note could never be our echo
         at all, since every message we send is a CC. */
      if (isCC) {
        const e = this._echo['cc' + ch + ':' + num];
        if (e && nowMs - e.t < 40 && raw === e.v) return;
      }
      this.lastRaw = { st: hi, ch, num, val: raw, t: Math.round(nowMs) };

      /* TURNS FIRST, ACROSS ALL SLOTS, THEN PRESSES. Two passes, not one,
         because a press may arrive on a different channel than the turn and
         the old single pass skipped the slot outright on a channel mismatch —
         so the tolerant press test below could never be reached. Turns still
         require an exact channel match, so a press can never be mistaken for
         a rotation. */
      for (let i = 0; i < this.slots.length; i++) {
        const s = this.slots[i];
        if (s.ch !== ch) continue;
        if (s.dev && dev && s.dev !== dev) continue;
        if (isCC && s.cc === num && s.turn !== 'none') {
          this.fire(s.turn, this.value(ch, num, raw, s.turn));
          this.lastMsg = 'K' + (i + 1); return;
        }
      }

      /* A PRESS, WHICHEVER WAY THIS DEVICE SENDS ONE. The Twister's switch is
         a note in some configurations and a CC on another channel in others,
         and which is in force depends on how the unit was set up — Edson's
         was configured with zerror, not the stock utility. So match on the
         NUMBER and accept either shape: a note on any channel, or a non-zero
         CC on a channel that is not this slot's turn channel. Rotations were
         all tested in the pass above, so one can never be read as a press.
         TWIST.lastRaw shows exactly what the hardware sent, if this ever
         needs checking against the device. */
      for (let i = 0; i < this.slots.length; i++) {
        const s = this.slots[i];
        if (s.dev && dev && s.dev !== dev) continue;
        if (s.push === 'none' || num !== s.note) continue;
        if (!(isNote || (isCC && ch !== s.ch && raw > 0))) continue;
        this.hit(i);                         // burn the ring so the press is visible
        this.fire(s.push, 1); this.lastMsg = 'K' + (i + 1); return;
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
      const byte = Math.max(0, Math.min(127, Math.round(val)));
      try {
        o.send([0xB0 | (ch & 15), num & 127, byte]);
        this.sentCount++;
        // remember the exact byte we pushed, so the device's own report of it —
        // if it ever makes one — cannot be read back as the operator turning a
        // knob, while a different value on the same address still gets through
        this._echo['cc' + ch + ':' + num] =
          { t: (typeof performance !== 'undefined' ? performance.now() : Date.now()), v: byte };
      } catch (e) { this.outErr = 'send failed: ' + e.message; }
    },

    /* ---- a direct test, because "the lights do not change" has many causes ----
       Walks every knob through red · green · blue · off, ignoring all state.
       If this does nothing, the problem is the PORT, not the light logic. */
    /* IS WEB MIDI EVEN OPEN. Permission is per page load and needs a user
       gesture, so a reload leaves the panel reading NO MIDI / NO OUT with
       every control inert — which is indistinguishable from broken hardware,
       and was. */
    hasAccess() {
      try { return !!(typeof midi !== 'undefined' && midi.access); } catch (e) { return false; }
    },
    /* A BUTTON CLICK IS A USER GESTURE, so the panel can do this itself
       instead of sending Edson to another section to find CONNECT. This is
       their own connectMidi() — the same call their CONNECT button makes. */
    connect() {
      if (this.hasAccess()) return true;
      try {
        if (typeof connectMidi === 'function') { connectMidi(); this.note = 'connecting to MIDI…'; return true; }
        this.note = 'no connectMidi() in this build';
      } catch (e) { this.note = 'connect failed: ' + e.message; }
      return false;
    },

    test() {
      // no MIDI at all: connect first, on this very click, then test
      if (!this.hasAccess()) {
        this.connect();
        this.note = 'connecting to MIDI, then testing…';
        setTimeout(() => { this._sent = {}; this.test(); }, 900);
        return false;
      }
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
      if (!fam) return { ring: 0, col: 0, anim: RGB_BRIGHT + 2 };          // assigned nothing: barely lit

      let ring = 0;
      if (S.turn !== 'none') {
        const v = this.current(S.turn);
        ring = Math.round(clamp(v) * 127);
      } else if (S.push !== 'none') {
        // a cue or a solo has no value, so the ring reads as a full mark
        ring = 127;
      }
      // a slot's own colour wins; otherwise the family default
      let col = (S.col !== undefined && S.col !== null) ? S.col
              : (this.colour[fam] !== undefined ? this.colour[fam] : DEFCOL[fam]);

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
      // a knob you just pressed burns for a moment, so a push you cannot hear
      // the result of still tells you it landed
      if (this.hitAge(i) < BLINK_S) anim = BURN;
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
  }, 500);
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
