/* ============================================================
   MIDI OUT — the page generates, Ableton plays.
   ROLE → CHANNEL routing (editable in the RIG panel):
     lead   CH1   melodic triggers (plucks, tones)
     pad    CH2   sustained voice-led chords
     bass   CH3   bass
     arp    CH4   sequenced arps (Night Circuit etc.)
     bells  CH5   bells / chimes / sparkles
     texture CH6  continuous-voice mirror (drones/films) + pooled CC74
     perc   CH10  drums (36 kick, 42/46 hats)
   Point each Ableton track's MIDI From at its channel — up to
   16 instruments, one rig. Expression: CC74 per role channel
   (map to each instrument's filter), CC1/CC2 = the hands.
   ============================================================ */
const MOut = {
  mode: 'web',            // 'web' | 'both' | 'midi'
  port: null, suspend: false,
  roles: { lead: 1, pad: 2, bass: 3, arp: 4, bells: 5, texture: 6, perc: 10, sfx: 11, bed: 12 },
  ROLE_COLORS: { lead: '#ffd977', pad: '#8fd4ff', bass: '#ff9d6b', arp: '#9fffc4', bells: '#d4b0ff', texture: '#7fe8d8', perc: '#ff6ba8', sfx: '#ff4f4f', bed: '#5e8bff' },
  lastByRole: {},
  log: [], ccLog: { L: [], R: [] },
  chFor(role) { return this.roles[role] || 1; },
  f2n(f) { return Math.max(0, Math.min(127, Math.round(69 + 12 * Math.log2(f / 440)))); },
  v2v(vol) { return Math.max(10, Math.min(120, Math.round(28 + vol * 380))); },
  ts(atAudio) {
    if (!AE.ctx || !atAudio) return performance.now();
    return performance.now() + Math.max(0, (atAudio - AE.ctx.currentTime)) * 1000;
  },
  wants() { return this.mode !== 'web'; },
  // MANAGED NOTE-OFFS — Web MIDI can't cancel a queued message, so a scheduled
  // note-off from a previous hit of the same pitch would strangle the new note
  // (fine in the browser synth, haywire in Ableton). Offs now run through our
  // own pump: retriggers close the old voice first, then re-arm.
  _offs: {}, _offTimer: null,
  _startOffPump() {
    if (this._offTimer) return;
    this._offTimer = setInterval(() => {
      const now = performance.now();
      for (const k in this._offs) {
        const o = this._offs[k];
        if (now >= o.t) {
          try { if (this.port) this.port.send([0x80 | o.st, o.note, 0]); } catch (e) {}
          delete this._offs[k];
        }
      }
    }, 25);
  },
  evNote(role, freq, vol, atAudio, durSec) {
    if (this.suspend || !isFinite(freq)) return;
    const ch = this.chFor(role);
    const note = this.f2n(freq), vel = this.v2v(vol);
    const p = this.ts(atAudio), durMs = Math.max(60, durSec * 1000);
    this.lastByRole[role] = p;
    this.log.push({ p, role, ch, note, vel, durMs });
    if (this.log.length > 900) this.log.splice(0, 300);
    if (this.wants() && this.port) {
      try {
        const st = ch - 1, key = st + ':' + note;
        if (this._offs[key]) { // same pitch still sounding — close it cleanly first
          try { this.port.send([0x80 | st, note, 0]); } catch (e) {}
          delete this._offs[key];
        }
        this.port.send([0x90 | st, note, vel], p);
        this._offs[key] = { st, note, t: p + durMs };
        this._startOffPump();
      } catch (e) {}
    }
  },
  evDrum(note, vol, atAudio) {
    if (this.suspend) return;
    const ch = this.chFor('perc');
    const vel = this.v2v(vol), p = this.ts(atAudio);
    this.lastByRole.perc = p;
    this.log.push({ p, role: 'perc', ch, note, vel, durMs: 120 });
    if (this.wants() && this.port) {
      try {
        const st = ch - 1, key = st + ':' + note;
        if (this._offs[key]) {
          try { this.port.send([0x80 | st, note, 0]); } catch (e) {}
          delete this._offs[key];
        }
        this.port.send([0x90 | st, note, vel], p);
        this._offs[key] = { st, note, t: p + 100 };
        this._startOffPump();
      } catch (e) {}
    }
  },
  // SFX — semantic one-shots (36 ignition · 37 lightning · 38 thunder · 39 rain …)
  sfxNote(note, vol = 0.7, dur = 2) {
    if (this.suspend) return;
    const ch = this.chFor('sfx');
    const vel = this.v2v(vol), p = performance.now();
    this.lastByRole.sfx = p;
    this.log.push({ p, role: 'sfx', ch, note, vel, durMs: dur * 1000 });
    if (this.wants() && this.port) {
      try {
        this.port.send([0x90 | (ch - 1), note, vel], p);
        this.port.send([0x80 | (ch - 1), note, 0], p + dur * 1000);
      } catch (e) {}
    }
  },
  // BED — each scene holds one note (20 + scene number) while it is open,
  // so a sampler on the bed channel fades that scene's atmosphere in/out
  bedOn(note) {
    this.bedOff();
    this._bed = note;
    const ch = this.chFor('bed'), p = performance.now();
    this.lastByRole.bed = p;
    this.log.push({ p, role: 'bed', ch, note, vel: 90, durMs: 4000 });
    if (this.wants() && this.port) { try { this.port.send([0x90 | (ch - 1), note, 90], p); } catch (e) {} }
  },
  bedOff() {
    if (this._bed === undefined) return;
    const ch = this.chFor('bed');
    if (this.wants() && this.port) { try { this.port.send([0x80 | (ch - 1), this._bed, 0]); } catch (e) {} }
    this._bed = undefined;
  },
  /* Managed sustained note for a CONTINUOUS voice — note-on when the voice
     fades in, retune when its pitch crosses a semitone, note-off when it is
     killed. This is what lets drone/film scenes (whose whole soundscape is
     AE.voice groups, no discrete events) exist in Ableton at all. */
  holdOn(h, role, freq, vel = 58) {
    if (!isFinite(freq)) return;
    const note = this.f2n(freq), ch = this.chFor(role);
    if (h._mNote === note && h._mCh === ch) return;
    const p = performance.now();
    if (h._mNote !== undefined && this.wants() && this.port) {
      try { this.port.send([0x80 | (h._mCh - 1), h._mNote, 0], p); } catch (e) {}
    }
    h._mNote = note; h._mCh = ch;
    this.lastByRole[role] = p;
    this.log.push({ p, role, ch, note, vel, durMs: 1600 });
    if (this.log.length > 900) this.log.splice(0, 300);
    if (this.wants() && this.port) { try { this.port.send([0x90 | (ch - 1), note, vel], p); } catch (e) {} }
  },
  holdOff(h) {
    if (h._mNote === undefined) return;
    if (this.wants() && this.port) { try { this.port.send([0x80 | (h._mCh - 1), h._mNote, 0]); } catch (e) {} }
    h._mNote = undefined; h._mCh = undefined;
  },
  padSet(voiceObj, freq, vel = 58) {
    const ch = this.chFor('pad');
    const note = this.f2n(freq);
    if (voiceObj._mNote === note) return;
    const p = performance.now();
    if (voiceObj._mNote !== undefined && this.wants() && this.port) {
      try { this.port.send([0x80 | (ch - 1), voiceObj._mNote, 0], p); } catch (e) {}
    }
    voiceObj._mNote = note;
    this.log.push({ p, role: 'pad', ch, note, vel, durMs: 1400 });
    if (this.wants() && this.port) { try { this.port.send([0x90 | (ch - 1), note, vel], p); } catch (e) {} }
  },
  cc(ch, ccNum, val) {
    if (this.wants() && this.port) { try { this.port.send([0xB0 | (ch - 1), ccNum, Math.max(0, Math.min(127, val | 0))]); } catch (e) {} }
  },
  // per-role expression stream → CC74 on that role's channel (map to filters in Live)
  _exprState: {},
  expr(role, v01) {
    const now = performance.now();
    const st = this._exprState[role] || (this._exprState[role] = { t: 0, v: -1 });
    if (now - st.t < 50) return;
    const v = Math.round(clamp(v01) * 127);
    if (v === st.v) return;
    st.t = now; st.v = v;
    this.cc(this.chFor(role), 74, v);
  },
  _lastCC: { L: -1, R: -1 }, _lastCCt: 0,
  tickCC(inp) {
    const now = performance.now();
    if (now - this._lastCCt < 33) return;
    this._lastCCt = now;
    for (const [side, ccNum] of [['L', 1], ['R', 2]]) {
      const v = Math.round(inp[side] * 127);
      this.ccLog[side].push({ p: now, v });
      if (this.ccLog[side].length > 400) this.ccLog[side].splice(0, 100);
      if (v !== this._lastCC[side]) {
        this._lastCC[side] = v;
        if (this.wants() && this.port) { try { this.port.send([0xB0, ccNum, v]); } catch (e) {} }
      }
    }
  },
  /* ---------- MIDI CLOCK — Ableton follows the scene instead of you
     retyping the tempo on every scene change.
     24 PPQN ticks (0xF8) are derived from the SAME AudioContext timeline the
     notes are scheduled on (T.t0 / T.beat), so clock and notes cannot drift
     apart. Song-position 0 then Start (0xFA) go out at beat 0; Stop (0xFC)
     when the transport stops — which closeFocus already does, so a scene
     change re-pins Live to the new BPM on its own.

     LOOKAHEAD is deliberately short. Web MIDI cannot cancel a queued
     message, so anything already scheduled WILL arrive: 120ms is enough to
     ride out a stalled frame and short enough that a scene change spills
     only a couple of stale ticks past the Stop.

     In Live: Preferences -> Link/Tempo/MIDI -> switch this port's "Sync" on,
     then press EXT in the transport bar. Live ignores clock entirely when
     Sync is off, so leaving this enabled costs nothing. ---------- */
  clock: { on: true, PPQ: 24, LOOKAHEAD: 0.12, n: 0, t0: -1, beat: 0, running: false },
  clockSet(on) {
    // Relay first: under Electron the control window's own MOut is inert
    // (no real port/AudioContext transport), so toggling CLOCK there used
    // to change nothing anyone could hear. Tell the show window, which has
    // the real clock, and let it run this same setter locally afterward —
    // ELECTRON_ROLE is 'show' there so this guard is false and there's no
    // echo back across the wire.
    if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('clock', !!on);
    this.clock.on = !!on;
    try { localStorage.setItem('srcMidiClock', this.clock.on ? '1' : '0'); } catch (e) {}
    if (!this.clock.on) this.clockStop();
    this.refreshUI();
  },
  _clk(bytes, at) { try { this.port.send(bytes, at); } catch (e) {} },
  clockStop() {
    const c = this.clock;
    if (c.running && this.port) this._clk([0xFC]);
    c.running = false; c.t0 = -1; c.n = 0;
  },
  clockPump() {
    const c = this.clock;
    const live = c.on && this.wants() && this.port &&
      typeof T !== 'undefined' && T.running && AE.ctx;
    if (!live) { if (c.running) this.clockStop(); return; }
    // a new scene (or a live tempo change) re-pins the grid — resync to its beat 0
    if (T.t0 !== c.t0 || T.beat !== c.beat) {
      if (c.running) this._clk([0xFC]);
      c.t0 = T.t0; c.beat = T.beat; c.n = 0; c.running = true;
      this._clk([0xF2, 0, 0]);                // song position -> 1.1.1
      this._clk([0xFA], this.ts(c.t0));       // start, landing on beat 0
    }
    const tick = c.beat / c.PPQ, now = AE.ctx.currentTime;
    // fell behind (throttled tab, GC pause)? jump the counter to now instead of
    // firing a burst of late ticks, which would shove Live's tempo around
    const nMin = Math.ceil((now - c.t0) / tick);
    if (c.n < nMin) c.n = nMin;
    const horizon = now + c.LOOKAHEAD;
    while (c.t0 + c.n * tick < horizon) {
      this._clk([0xF8], this.ts(c.t0 + c.n * tick));
      c.n++;
    }
  },
  testBurst() {
    const b = document.getElementById('btnTest');
    // control window has no real port to test — relay to the show window,
    // which actually has one, and give optimistic feedback here (the show
    // window's own button text update is invisible — no chrome there).
    if (window.ELECTRON_ROLE === 'control') {
      if (window.electronAPI) window.electronAPI.requestMidiTest();
      if (b) { b.textContent = 'SENT ♪♪♪'; setTimeout(() => b.textContent = 'TEST MIDI ♪', 1500); }
      return;
    }
    if (!this.port) { if (b) { b.textContent = 'TEST: NO PORT'; setTimeout(() => b.textContent = 'TEST MIDI ♪', 1500); } return; }
    const t0 = performance.now();
    [0, 4, 7, 11, 14, 19, 12].forEach((s, i) => {
      const note = 60 + s, p = t0 + i * 130;
      this.log.push({ p, role: 'lead', ch: this.chFor('lead'), note, vel: 88, durMs: 300 });
      try {
        this.port.send([0x90 | (this.chFor('lead') - 1), note, 88], p);
        this.port.send([0x80 | (this.chFor('lead') - 1), note, 0], p + 280);
      } catch (e) {}
    });
    if (b) { b.textContent = 'SENT ♪♪♪'; setTimeout(() => b.textContent = 'TEST MIDI ♪', 1500); }
  },
  // Show-window side of the control window's MIDI OUT picker (ticket #7).
  // MIDIAccess ids are scoped per-window/per-connection, so the control
  // window (relaying midiRelay's device list) can only ever name a port,
  // never hand back an id the show window's own MIDIAccess would recognize.
  // Matching by NAME is therefore the only thing that works across the IPC
  // boundary. This is now the one place that persists the choice (srcOutPort)
  // so a fresh launch of either window agrees on the same port next time.
  selectPortByName(name) {
    if (!midi.access) return false;
    const outs = [...midi.access.outputs.values()];
    const p = outs.find(o => o.name === name);
    if (!p) return false;
    this.port = p;
    try { localStorage.setItem('srcOutPort', name); } catch (e) {}
    this.refreshUI();
    return true;
  },
  allOff() {
    this.clockStop();
    if (this._voices) { this._voices.forEach(h => this.holdOff(h)); this._voices.clear(); }
    if (this.port) {
      try { for (let ch = 0; ch < 16; ch++) this.port.send([0xB0 | ch, 123, 0]); } catch (e) {}
    }
    // PARK THE ENERGY OPEN — CC74 is "open at rest" by convention, but a
    // scene that streams it leaves the last value standing when it closes,
    // and the next scene may never touch that channel: a filter parked shut
    // by one scene would silence an instrument for the rest of the night
    // (Lance hit exactly this in W1). So every all-off resets CC74 to 127
    // on every role channel and clears the dedupe cache so the next stream
    // always re-sends.
    if (this.port && this.wants()) {
      try { for (const r in this.roles) this.port.send([0xB0 | (this.roles[r] - 1), 74, 127]); } catch (e) {}
    }
    this._exprState = {};
  },
  // the operator's persistent choice — per-scene queue overrides applyMode()
  // around it and fall back to it, so a show never strands the global toggle
  baseMode: 'web',
  setMode(m) {
    // Same relay as clockSet above: this is the fix that reaches every call
    // site at once (OUT pill, fOut on the focus rail, SHOW CHECK's SEND
    // MIDI fix) since they all funnel through setMode rather than each
    // needing its own IPC call.
    if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('outMode', m);
    this.mode = m; this.baseMode = m;
    try { localStorage.setItem('srcOutMode', m); } catch (e) {}
    if (AE.master) AE.set(AE.master.gain, m === 'midi' ? 0.0001 : (AE.vol !== undefined ? AE.vol : 0.85), 0.1);
    if (m !== 'web' && !midi.access) connectMidi();
    this.refreshUI();
  },
  // transient routing (a queued scene's OUT override) — same plumbing, no save
  // DELIBERATELY NOT RELAYED: this fires on every scene's own
  // openFocus, in BOTH windows independently, each applying its OWN scene's
  // override to its OWN local mode. Relaying it from the control window
  // would make the show window apply the override twice — once from its
  // own openFocus, once from the relay — and fight itself if the two
  // windows aren't showing the same scene at the exact same instant. Leave
  // this one alone; only setMode/clockSet (the operator's explicit toggles)
  // get relayed.
  applyMode(m) {
    if (!m) m = this.baseMode;
    if (m === this.mode) return;
    this.mode = m;
    if (AE.master) AE.set(AE.master.gain, m === 'midi' ? 0.0001 : (AE.vol !== undefined ? AE.vol : 0.85), 0.1);
    if (m !== 'web' && !midi.access) connectMidi();
    this.refreshUI();
  },
  refreshUI() {
    const b = document.getElementById('btnOut');
    if (b) {
      b.textContent = 'OUT: ' + (this.mode === 'web' ? 'WEB AUDIO' : this.mode === 'both' ? 'WEB+MIDI' : 'MIDI ONLY');
      b.classList.toggle('off', this.mode === 'web');
    }
    const cb = document.getElementById('btnClock');
    if (cb) {
      cb.textContent = 'CLOCK OUT: ' + (this.clock.on ? 'ON' : 'OFF');
      cb.classList.toggle('off', !this.clock.on);
    }
    const sel = document.getElementById('midiOutSel');
    if (sel) {
      // control window (ticket #36): the show window owns the real port —
      // this only lets the operator SEE the list and pick, same split as
      // ticket #31's display picker. Applying the pick is relayed over
      // show:control 'outPort' (the port NAME, since MIDIAccess ids are
      // per-window) and bound on the show side by selectPortByName(),
      // which also persists srcOutPort so both windows agree next launch.
      if (window.ELECTRON_ROLE === 'control') {
        if (this.mode !== 'web' && midiRelay.connected) {
          sel.style.display = '';
          const outs = midiRelay.outputs;
          if (sel.options.length !== outs.length) {
            sel.innerHTML = outs.map((o, i) => `<option value="${i}">${o.name}</option>`).join('') || '<option>no MIDI outputs</option>';
          }
        } else sel.style.display = 'none';
      } else if (this.mode !== 'web' && midi.access) {
        sel.style.display = '';
        const outs = [...midi.access.outputs.values()];
        if (sel.options.length !== outs.length) {
          sel.innerHTML = outs.map((o, i) => `<option value="${i}">${o.name}</option>`).join('') || '<option>no MIDI outputs</option>';
        }
        // ticket #37: this.port is never nulled elsewhere, so a disconnected
        // device left it stale forever — a reconnect (same or fresh object)
        // never got picked back up. This runs every 1.5s already (see the
        // setInterval call site), so clearing it here is the whole fix —
        // the block below already re-acquires whenever !this.port.
        if (this.port && !outs.includes(this.port)) this.port = null;
        if (!this.port && outs.length) {
          // prefer the port the user picked last time (survives reloads/redeploys)
          let saved = null; try { saved = localStorage.getItem('srcOutPort'); } catch (e) {}
          const i = saved ? outs.findIndex(o => o.name === saved) : -1;
          this.port = outs[i >= 0 ? i : 0];
          if (i >= 0) sel.value = String(i);
        }
      } else sel.style.display = 'none';
    }
  },
  /* ---------- monitor ---------- */
  drawMonitor(cv) {
    if (!cv) return;
    const g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.fillStyle = '#07090a'; g.fillRect(0, 0, w, h);
    const now = performance.now(), SPAN = 8000;
    const x = p => w - 40 - ((now - p) / SPAN) * (w - 40);
    g.strokeStyle = 'rgba(184,255,62,0.5)';
    g.beginPath(); g.moveTo(w - 40, 0); g.lineTo(w - 40, h); g.stroke();
    if (typeof T !== 'undefined' && T.running && AE.ctx) {
      const beatMs = T.beat * 1000;
      const perfAtBeat0 = performance.now() - (AE.ctx.currentTime - T.t0) * 1000;
      for (let b = Math.ceil((now - SPAN - perfAtBeat0) / beatMs); ; b++) {
        const px = x(perfAtBeat0 + b * beatMs);
        if (px > w) break;
        if (px < 0) continue;
        g.strokeStyle = b % 4 === 0 ? 'rgba(140,160,120,0.3)' : 'rgba(140,160,120,0.1)';
        g.beginPath(); g.moveTo(px, 0); g.lineTo(px, h); g.stroke();
      }
    }
    const ccY0 = h - 18;
    for (const [side, col] of [['L', 'rgba(184,255,62,0.7)'], ['R', 'rgba(120,220,255,0.7)']]) {
      const pts = this.ccLog[side];
      if (pts.length < 2) continue;
      g.strokeStyle = col; g.lineWidth = 1;
      g.beginPath();
      let started = false;
      for (const pt of pts) {
        const px = x(pt.p);
        if (px < 0) continue;
        const py = ccY0 + 14 - (pt.v / 127) * 14;
        started ? g.lineTo(px, py) : g.moveTo(px, py);
        started = true;
      }
      g.stroke();
    }
    const noteY = n => (h - 22) - ((n - 30) / 70) * (h - 26);
    for (const ev of this.log) {
      const x0 = x(ev.p);
      if (x0 + (ev.durMs / SPAN) * (w - 40) < 0 || x0 > w) continue;
      const y = noteY(ev.note);
      const wd = Math.max(3, (ev.durMs / SPAN) * (w - 40));
      const col = this.ROLE_COLORS[ev.role] || '#ccc';
      const future = ev.p > now;
      // crisp: no age-fade, no blur — this is a working monitor, not a visual
      g.globalAlpha = (future ? 0.35 : 0.95) * (0.45 + ev.vel / 127 * 0.55);
      g.fillStyle = col;
      g.fillRect(Math.round(x0), Math.round(y - 2), Math.round(wd), 4);
      if (!future && now - ev.p < 150) {
        g.globalAlpha = 1;
        g.fillStyle = '#fff';
        g.fillRect(Math.round(x0), Math.round(y - 2), Math.min(Math.round(wd), 4), 4);
      }
    }
    g.globalAlpha = 1;
    g.font = '8px ui-monospace,monospace';
    let lx = 6;
    for (const role of ['lead', 'pad', 'bass', 'arp', 'bells', 'perc', 'sfx', 'bed']) {
      g.fillStyle = this.ROLE_COLORS[role];
      g.fillRect(lx, 5, 6, 6);
      g.fillStyle = 'rgba(180,200,160,0.8)';
      g.fillText(role.toUpperCase() + ' ' + this.roles[role], lx + 9, 11);
      lx += 56;
    }
    g.fillStyle = 'rgba(180,200,160,0.8)';
    g.fillText('CC1/CC2 HANDS · CC74 FILTER', lx + 4, 11);
  }
};

/* ---------- clock boot: restore the operator's choice, run the pump ----------
   One 20ms timer for the life of the page. It returns immediately unless a
   port is open, out-mode is not WEB, and a transport is running — so the cost
   when the clock is idle is a comparison, and there is no start/stop wiring
   for scene code to forget. ---------- */
try {
  /* role→channel boot: rig.json (baked as RIGDOC) is the agreement — the
     default map follows its `ch` values, so editing rig.json re-wires every
     browser at the next build to match the actual Live set. A RIG-panel
     remap is stored per-browser as a DIFF against the doc (srcRoleMap), so
     un-touched roles keep following rig.json across rebuilds. */
  try {
    if (typeof RIGDOC !== 'undefined' && RIGDOC.roles) {
      for (const r in MOut.roles) {
        const d = RIGDOC.roles[r];
        if (d && d.ch >= 1 && d.ch <= 16) MOut.roles[r] = d.ch;
      }
    }
    const ov = JSON.parse(localStorage.getItem('srcRoleMap') || 'null');
    if (ov) for (const r in MOut.roles) if (ov[r] >= 1 && ov[r] <= 16) MOut.roles[r] = ov[r];
  } catch (e) {}
  const ck = localStorage.getItem('srcMidiClock');
  if (ck !== null) MOut.clock.on = ck === '1';
} catch (e) {}
setInterval(() => MOut.clockPump(), 20);
// leaving the page must not strand Live running on a clock that stopped arriving
window.addEventListener('pagehide', () => { try { MOut.clockStop(); } catch (e) {} });

/* ============================================================
   SOUNDING BUS — what the board is ringing with, right now
   ------------------------------------------------------------
   Every musical event on the wall registers its fundamental
   here. Any scene can then ask "is something out there in tune
   with me?" and get a 0..1 excitation back — which is how a
   resonator behaves in a room: it answers sound it agrees with,
   whoever made it. Used by SONORA V3's dye blobs to shudder in
   sympathy and by SONORA V4's stones to hold their heat, and
   open for anything else that wants to listen.

   NOTE: this lived only in the working index.html for a while,
   so the built site shipped with `AE.SB` undefined — every
   excite() returned 0 and the sympathetic swell was silently
   dead. Keep it here, ahead of the wrappers that push to it.
   ============================================================ */
AE.SB = {
  ev: [], MAX: 96,
  push(freq, vol, at, dur) {
    if (!AE.ctx || !isFinite(freq) || freq <= 20) return;
    const v = vol !== undefined ? vol : 0.15;
    if (v <= 0.0008) return;
    const now = AE.t();
    const t0 = Math.max(now, at || 0);
    // prune the dead before adding — keeps the list short without a timer
    if (this.ev.length > 8) this.ev = this.ev.filter(e => e.t1 > now);
    this.ev.push({ f: freq, v, t0, t1: t0 + Math.max(0.05, dur !== undefined ? dur : 0.8) });
    if (this.ev.length > this.MAX) this.ev.splice(0, this.ev.length - this.MAX);
  },
  /* How hard is the board driving a resonator tuned to `freq`?
     Unison rings hardest; the octave and twelfth answer weakly;
     anything off the series barely moves it at all. */
  excite(freq) {
    if (!AE.ctx || !isFinite(freq) || freq <= 0 || !this.ev.length) return 0;
    const now = AE.t();
    let e = 0;
    for (let i = 0; i < this.ev.length; i++) {
      const ev = this.ev[i];
      if (now < ev.t0 || now > ev.t1) continue;
      const amp = ev.v * (1 - (now - ev.t0) / (ev.t1 - ev.t0));
      if (amp <= 0) continue;
      const r = ev.f > freq ? ev.f / freq : freq / ev.f;
      const n = Math.round(r);
      if (n < 1 || n > 8) continue;
      const detune = Math.abs(r - n) / n;              // relative mistune
      const window = Math.exp(-detune * detune * 900); // narrow resonance peak
      if (window < 0.02) continue;
      const coupling = n === 1 ? 1 : n === 2 ? 0.5 : n === 3 ? 0.3 : 0.45 / n;
      e += amp * window * coupling;
    }
    return Math.min(1, e * 3.4);
  }
};

/* ---------- wrap the audio engine so every musical event emits MIDI ---------- */
(function () {
  /* Three things happen in every one of these wrappers, and all three matter:
     1. the event goes out as MIDI;
     2. the event is published to the SOUNDING BUS, which is what makes any
        resonator scene able to hear the rest of the wall. Without this the
        bus only ever contains whatever a scene pushed by hand, and every
        sympathy mechanic on the site quietly reads zero;
     3. MOut.suspend is SAVED and RESTORED rather than blind-cleared — bell
        and pluck call back into tone, and clearing the flag inside a nested
        call leaks the partials onto the wire as separate notes.
     opts.role overrides the channel, so one scene can put different voices on
     different instruments without leaving the engine. */
  const _tone = AE.tone.bind(AE);
  AE.tone = function (freq, opts = {}) {
    MOut.evNote(opts.role || 'lead', freq, opts.vol !== undefined ? opts.vol : 0.15, opts.at || 0, opts.dur !== undefined ? opts.dur : 0.8);
    if (!MOut.suspend) AE.SB.push(freq, opts.vol, opts.at, opts.dur !== undefined ? opts.dur : 0.8);
    const sp = MOut.suspend; MOut.suspend = true; _tone(freq, opts); MOut.suspend = sp;
  };
  const _bell = AE.bell.bind(AE);
  AE.bell = function (freq, opts = {}) {
    MOut.evNote(opts.role || 'bells', freq, opts.vol !== undefined ? opts.vol : 0.12, opts.at || 0, opts.dur !== undefined ? opts.dur : 2.2);
    if (!MOut.suspend) AE.SB.push(freq, opts.vol !== undefined ? opts.vol : 0.12, opts.at, opts.dur !== undefined ? opts.dur : 2.2);
    const sp = MOut.suspend; MOut.suspend = true; _bell(freq, opts); MOut.suspend = sp;
  };
  const _pluck2 = AE.pluck2.bind(AE);
  AE.pluck2 = function (freq, opts = {}) {
    MOut.evNote(opts.role || 'lead', freq, opts.vol !== undefined ? opts.vol : 0.16, opts.at || 0, opts.dur !== undefined ? opts.dur : 1.1);
    if (!MOut.suspend) AE.SB.push(freq, opts.vol !== undefined ? opts.vol : 0.16, opts.at, opts.dur !== undefined ? opts.dur : 1.1);
    const sp = MOut.suspend; MOut.suspend = true; _pluck2(freq, opts); MOut.suspend = sp;
  };
  const _bassNote = AE.bassNote.bind(AE);
  AE.bassNote = function (freq, opts = {}) {
    MOut.evNote(opts.role || 'bass', freq, opts.vol !== undefined ? opts.vol : 0.2, opts.at || 0, opts.dur !== undefined ? opts.dur : 1.6);
    if (!MOut.suspend) AE.SB.push(freq, opts.vol !== undefined ? opts.vol : 0.2, opts.at, opts.dur !== undefined ? opts.dur : 1.6);
    const sp = MOut.suspend; MOut.suspend = true; _bassNote(freq, opts); MOut.suspend = sp;
  };
  const _kick = AE.kick.bind(AE);
  AE.kick = function (at, vol) { MOut.evDrum(36, vol !== undefined ? vol : 0.32, at || 0); _kick(at, vol); };
  const _hat = AE.hat.bind(AE);
  AE.hat = function (at, opts = {}) { MOut.evDrum(opts.open ? 46 : 42, opts.vol !== undefined ? opts.vol : 0.045, at || 0); _hat(at, opts); };
  /* AE.hit — filtered-noise percussion. It was the LOUDEST hole in the mirror
     (113 call sites; White Study's whole click language is hits). Map the
     filter's center frequency onto the drum-rack notes the rig already uses:
     low thud → 36, mid crack → 38, click → 42, air/tick → 46. */
  const _hit = AE.hit.bind(AE);
  AE.hit = function (opts = {}) {
    const f = opts.freq !== undefined ? opts.freq : 2000;
    const note = f < 250 ? 36 : f < 1200 ? 38 : f < 4500 ? 42 : 46;
    MOut.evDrum(note, opts.vol !== undefined ? opts.vol : 0.2, opts.at || 0);
    _hit(opts);
  };
  /* AE.voice — continuous voices, the other hole. A voice has no note events,
     and scenes drive it two different ways (fadeIn OR writing v.gain directly
     every tick), so hooks on any one method miss half the library. Instead:
     every voice registers itself, and a 4Hz poll reads what is actually true —
     group gain audible → HELD note on the texture channel at the first
     audible oscillator's CURRENT pitch (placeholders have been tuned by the
     time the gain comes up; later retunes re-strike via holdOn's semitone
     check), gain gone or voice killed → note off. The pooled gain streams as
     CC74 texture energy. Voices carrying padVoices are already mirrored
     per-pad-voice on the pad channel and are skipped (_noHold); noise-only
     voices have no pitch to report and stay silent. */
  const _voice = AE.voice.bind(AE);
  AE.voice = function () {
    const h = _voice();
    const _osc = h.osc;
    h.osc = (type, freq) => { const o = _osc(type, freq); (h._oscs || (h._oscs = [])).push(o); return o; };
    const _kill = h.kill;
    h.kill = (s) => { MOut.holdOff(h); MOut._voices.delete(h); _kill(s); };
    MOut._voices.add(h);
    if (MOut._voices.size > 64) MOut._voices.delete(MOut._voices.values().next().value); // leak guard
    return h;
  };
  MOut._voices = new Set();
  setInterval(() => {
    const M = MOut;
    if (!AE.ctx || !M._voices.size) return;
    let energy = 0;
    M._voices.forEach(h => {
      if (h._noHold) { M.holdOff(h); return; }
      let g = 0;
      try { g = h.group.gain.value; } catch (e) { M._voices.delete(h); return; }
      const o = g > 0.004 && h._oscs &&
        h._oscs.find(o2 => isFinite(o2.frequency.value) && o2.frequency.value > 25); // skip LFOs
      if (o) {
        M.holdOn(h, 'texture', o.frequency.value, Math.round(30 + Math.min(1, g) * 60));
        energy = Math.max(energy, g);
      } else M.holdOff(h);
    });
    M.expr('texture', Math.min(1, energy));
  }, 250);
  const _padVoices = AE.padVoices.bind(AE);
  AE.padVoices = function (v, n, opts) {
    v._noHold = true;   // its pad voices are mirrored individually below
    const voices = _padVoices(v, n, opts);
    for (const vc of voices) {
      const _set = vc.set.bind(vc);
      // velocity from the voice's ACTUAL gain, not a constant — measured
      // across the library, every pad note was leaving at vel 58, which is
      // exactly the machine-flat sound a velocity-sensitive patch exposes.
      // Scenes that swell a pad voice's gain now speak at that loudness.
      vc.set = function (freq, glide) {
        let g = 0.045; try { g = vc.g.gain.value; } catch (e) {}
        MOut.padSet(vc, freq, Math.round(Math.max(25, Math.min(105, 25 + (g / 0.05) * 45))));
        _set(freq, glide);
      };
    }
    return voices;
  };
})();
// Show window: the control window's TEST button has no real port to test
// with — relayed here (MOut.testBurst()'s control branch above), where a
// real one actually exists.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onMidiTestRequested) {
  window.electronAPI.onMidiTestRequested(() => MOut.testBurst());
}
