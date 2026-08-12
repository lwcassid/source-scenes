/* ============================================================
   MIDI OUT — the page generates, Ableton plays.
   ROLE → CHANNEL routing (editable in the RIG panel):
     lead   CH1   melodic triggers (plucks, tones)
     pad    CH2   sustained voice-led chords
     bass   CH3   bass
     arp    CH4   sequenced arps (Night Circuit etc.)
     bells  CH5   bells / chimes / sparkles
     texture CH6  reserved for future texture layers
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
  testBurst() {
    const b = document.getElementById('btnTest');
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
  allOff() {
    if (this.port) {
      try { for (let ch = 0; ch < 16; ch++) this.port.send([0xB0 | ch, 123, 0]); } catch (e) {}
    }
  },
  setMode(m) {
    this.mode = m;
    try { localStorage.setItem('srcOutMode', m); } catch (e) {}
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
    const sel = document.getElementById('midiOutSel');
    if (sel) {
      if (this.mode !== 'web' && midi.access) {
        sel.style.display = '';
        const outs = [...midi.access.outputs.values()];
        if (sel.options.length !== outs.length) {
          sel.innerHTML = outs.map((o, i) => `<option value="${i}">${o.name}</option>`).join('') || '<option>no MIDI outputs</option>';
        }
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

/* ---------- wrap the audio engine so every musical event emits MIDI ---------- */
(function () {
  const _tone = AE.tone.bind(AE);
  AE.tone = function (freq, opts = {}) {
    MOut.evNote('lead', freq, opts.vol !== undefined ? opts.vol : 0.15, opts.at || 0, opts.dur !== undefined ? opts.dur : 0.8);
    MOut.suspend = true; _tone(freq, opts); MOut.suspend = false;
  };
  const _bell = AE.bell.bind(AE);
  AE.bell = function (freq, opts = {}) {
    MOut.evNote('bells', freq, opts.vol !== undefined ? opts.vol : 0.12, opts.at || 0, opts.dur !== undefined ? opts.dur : 2.2);
    MOut.suspend = true; _bell(freq, opts); MOut.suspend = false;
  };
  const _pluck2 = AE.pluck2.bind(AE);
  AE.pluck2 = function (freq, opts = {}) {
    MOut.evNote('lead', freq, opts.vol !== undefined ? opts.vol : 0.16, opts.at || 0, opts.dur !== undefined ? opts.dur : 1.1);
    MOut.suspend = true; _pluck2(freq, opts); MOut.suspend = false;
  };
  const _bassNote = AE.bassNote.bind(AE);
  AE.bassNote = function (freq, opts = {}) {
    MOut.evNote('bass', freq, opts.vol !== undefined ? opts.vol : 0.2, opts.at || 0, opts.dur !== undefined ? opts.dur : 1.6);
    MOut.suspend = true; _bassNote(freq, opts); MOut.suspend = false;
  };
  const _kick = AE.kick.bind(AE);
  AE.kick = function (at, vol) { MOut.evDrum(36, vol !== undefined ? vol : 0.32, at || 0); _kick(at, vol); };
  const _hat = AE.hat.bind(AE);
  AE.hat = function (at, opts = {}) { MOut.evDrum(opts.open ? 46 : 42, opts.vol !== undefined ? opts.vol : 0.045, at || 0); _hat(at, opts); };
  const _padVoices = AE.padVoices.bind(AE);
  AE.padVoices = function (v, n, opts) {
    const voices = _padVoices(v, n, opts);
    for (const vc of voices) {
      const _set = vc.set.bind(vc);
      vc.set = function (freq, glide) { MOut.padSet(vc, freq); _set(freq, glide); };
    }
    return voices;
  };
})();
