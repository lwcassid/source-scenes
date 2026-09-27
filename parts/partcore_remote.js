/* ---------- REMOTE — play the wall from another room ----------
   Edson, Sep 27 (eyes; the doctor says Monday): "what if they open there
   locally, and here I just send commands to their computer?"

   Exactly that. THE INSTRUMENT STAYS ON HIS DESK, THE PICTURE STAYS ON
   THEIR MACHINE. Two pages, one relay:

     SENDER   index.html?relay=wss://…&send=ROOM#scene=SRC-73
              samples the hands, and forwards every mixer, macro, blackout
              and poem cue it makes, plus "open this scene". It renders its
              own copy so he sees what he does with no delay.
     RECEIVER index.html?relay=wss://…&recv=ROOM#set=…
              applies them: setChan() for the hands, MIX / POEMDECK for the
              rest, openFocus() to follow the scene. Its sound, its MIDI to
              Ableton and its LINE-IN stay local — the wall listens to the
              band in the room. Native 60 fps; nothing is compressed.

   What crosses the wire is small: {t:'h',L,R} at ~30 Hz while the hands
   move (and every 1.5 s while they hold, so the receiver never drifts back
   to ambient), and one short JSON per knob or cue. RTT is measured and shown.

   IT DOES NOTHING UNLESS THE URL ASKS. Written as a proposal for core: the
   Electron build already relays hands and scene changes between a control
   window and a show window over IPC; this is the same relay over a socket.
   Tool-level, and declared in the PR: it calls core's setChan(), openFocus()
   and closeFocus(), reads `chan`, `focus` and `PIECES`, and wraps OUR OWN
   MIX and POEMDECK on the sender. It touches no scene of anyone's.

   THE CONFIG PERSISTS. Opening a scene rewrites the URL to `#scene=…` and
   the query string is gone, so the role, room and relay are kept in
   localStorage (`srcRemote`) and survive a reload. `?remote=off` clears it.  */
(() => {
  if (typeof window === 'undefined' || window.REMOTE) return;
  const KEY = 'srcRemote';
  const q = new URLSearchParams(location.search);
  let cfg = null;
  try { cfg = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { cfg = null; }
  if (q.get('remote') === 'off' || q.get('send') === 'off' || q.get('recv') === 'off') { cfg = null; try { localStorage.removeItem(KEY); } catch (e) {} }
  else if (q.get('send') || q.get('recv')) {
    cfg = { role: q.get('send') ? 'send' : 'recv', room: q.get('send') || q.get('recv'),
            relay: q.get('relay') || (cfg && cfg.relay) || 'ws://127.0.0.1:8766' };
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  const R = {
    cfg, ws: null, open: false, tries: 0, sent: 0, got: 0, rtt: null, lastMsg: '', err: '',
    _lastH: { L: -1, R: -1, t: 0 }, _scene: undefined, _pingT: 0, _timer: null, _wrapped: false,
    url() { return this.cfg ? this.cfg.relay.replace(/\/$/, '') + '/room/' + this.cfg.room : null; },
    state() { return { cfg: this.cfg, open: this.open, sent: this.sent, got: this.got, rtt: this.rtt, last: this.lastMsg, err: this.err }; },
    off() { this.cfg = null; try { localStorage.removeItem(KEY); } catch (e) {} if (this.ws) { try { this.ws.close(); } catch (e) {} } },

    send(o) {
      if (!this.ws || this.ws.readyState !== 1) return false;
      try { this.ws.send(JSON.stringify(o)); this.sent++; return true; } catch (e) { return false; }
    },

    connect() {
      const u = this.url(); if (!u) return;
      let ws;
      try { ws = new WebSocket(u); } catch (e) { this.err = String(e); return this.retry(); }
      this.ws = ws;
      ws.onopen = () => { this.open = true; this.tries = 0; this.err = ''; this._lastH = { L: -1, R: -1, t: 0 }; this._scene = undefined; };
      ws.onclose = () => { this.open = false; this.retry(); };
      ws.onerror = () => { this.err = 'socket error'; };
      ws.onmessage = ev => { this.got++; let o = null; try { o = JSON.parse(ev.data); } catch (e) { return; } this.onMsg(o); };
    },
    retry() {
      if (!this.cfg) return;
      const wait = Math.min(8000, 500 * Math.pow(2, this.tries++));
      setTimeout(() => { if (this.cfg) this.connect(); }, wait);
    },

    /* ---- the sender: the hands, our own controls, the scene ---- */
    tickSend() {
      if (!this.open) return;
      const now = performance.now();
      // THE HANDS: chan.L.v is what the scenes get after calibration and
      // smoothing — send that, not the raw sensor
      try {
        const L = +chan.L.v.toFixed(3), Rv = +chan.R.v.toFixed(3);
        const moved = Math.abs(L - this._lastH.L) > 0.002 || Math.abs(Rv - this._lastH.R) > 0.002;
        if (moved || now - this._lastH.t > 1500) { if (this.send({ t: 'h', L, R: Rv })) this._lastH = { L, R: Rv, t: now }; }
      } catch (e) {}
      // THE SCENE: follow what is open here
      try {
        const id = (typeof focus !== 'undefined' && focus.idx >= 0 && typeof PIECES !== 'undefined') ? PIECES[focus.idx].id : null;
        if (id !== this._scene) { this._scene = id; this.send({ t: 'scene', id }); }
      } catch (e) {}
      if (now - this._pingT > 2000) { this._pingT = now; this.send({ t: 'ping', ts: now }); }
      /* THE SNAPSHOT, every 1.5 s: the scene and the whole mixer state. A page
         that joins late — the room opens the link after Edson is already in
         Act I, or reloads mid-jam — lands where he is within 1.5 s, with his
         faders, instead of waiting for the next change. Applied idempotently. */
      if (now - (this._snapT || 0) > 1500) { this._snapT = now; this.send(this.snapshot()); }
    },
    snapshot() {
      const o = { t: 'snap', scene: this._scene === undefined ? null : this._scene, mix: null };
      try {
        const P = window.MIX && MIX.P && MIX.P();
        if (P) {
          const s = P.state;
          o.mix = { id: P.def.id, want: Array.from(s.want), macro: Object.assign({}, s.macro || {}),
                    solo: s.solo, black: !!s.black, keep: s.keep ? Array.from(s.keep) : null };
        }
      } catch (e) {}
      // THE PALETTE (Sep 27): the open scene's, whole — applied only if it differs
      try { if (window.PAL) o.pal = PAL.snap(); } catch (e) {}
      return o;
    },
    applySnap(o) {
      if (typeof focus === 'undefined' || typeof PIECES === 'undefined') return;
      const cur = focus.idx >= 0 ? PIECES[focus.idx].id : null;
      if (o.scene !== cur) {
        if (o.scene === null) { if (typeof closeFocus === 'function') closeFocus(); return; }
        const i = PIECES.findIndex(p => p.id === o.scene);
        if (i >= 0 && typeof openFocus === 'function') openFocus(i);
        return;                               // the mixer is applied on the next snapshot, once it exists
      }
      // the palette first: a plain scene can declare one with no mixer at all.
      // PAL.set('load') is a no-op when nothing differs, so this costs nothing
      // every 1.5 s (no ver bump, no rebuild, no storage write)
      try { if (o.pal && window.PAL) { const st = PAL.active(); if (st && st.key === o.pal.key) PAL.set('load', o.pal); } } catch (e) {}
      const m = o.mix, P = window.MIX && MIX.P && MIX.P();
      if (!m || !P || P.def.id !== m.id) return;
      const s = P.state;
      // BLACKOUT is a toggle that stores the faders it zeroed; mirror the
      // sender's stored faders rather than toggling on top of ours
      if (m.black && !s.black) { m.keep && m.keep.forEach((v, i) => { if (i < s.want.length) s.want[i] = v; }); MIX.blackout(); }
      else if (!m.black && s.black) { MIX.blackout(); }
      if (m.black) { if (m.keep) s.keep = m.keep.slice(0, s.want.length); }
      else m.want.forEach((v, i) => { if (i < s.want.length && Math.abs(s.want[i] - v) > 0.001) s.want[i] = v; });
      if (s.macro) for (const k in m.macro) s.macro[k] = m.macro[k];
      if (!m.black) s.solo = m.solo;
    },
    wrapOurs() {
      if (this._wrapped) return; this._wrapped = true;
      const self = this;
      // OURS: the mixer and the deck. Wrapping them forwards every path in —
      // a Twister knob, a number key, the console — with no second hook.
      if (window.MIX) {
        ['set', 'macro', 'solo', 'blackout', 'fire', 'instrument'].forEach(fn => {
          const orig = MIX[fn]; if (typeof orig !== 'function') return;
          MIX[fn] = function (...a) { const r = orig.apply(MIX, a); self.send({ t: 'mix', fn, a }); return r; };
        });
      }
      // THE PALETTE: one entry point, one wrap — panel, knobs, RESET, COPY FROM
      if (window.PAL && typeof PAL.set === 'function') {
        const orig = PAL.set;
        PAL.set = function (...a) { const r = orig.apply(PAL, a); if (r) self.send({ t: 'pal', a }); return r; };
      }
      if (window.POEMDECK) {
        ['go', 'back', 'abort', 'stop'].forEach(fn => {
          const orig = POEMDECK[fn]; if (typeof orig !== 'function') return;
          POEMDECK[fn] = function (...a) { const r = orig.apply(POEMDECK, a); self.send({ t: 'deck', fn }); return r; };
        });
      }
    },

    /* ---- the receiver: apply, in the same words ---- */
    onMsg(o) {
      if (!o || !o.t) return;
      if (this.cfg && this.cfg.role === 'send') { if (o.t === 'pong') this.rtt = Math.round(performance.now() - o.ts); return; }
      // the heartbeat traffic (snapshots, pings) is not "the last thing he did"
      if (o.t !== 'snap' && o.t !== 'ping') this.lastMsg = o.t + (o.fn ? ':' + o.fn : '');
      try {
        if (o.t === 'ping') { this.send({ t: 'pong', ts: o.ts }); return; }
        if (o.t === 'snap') { this.applySnap(o); return; }
        if (o.t === 'h') { setChan('L', +o.L); setChan('R', +o.R); return; }
        if (o.t === 'mix') {
          // a macro may belong to a plain scene that declares its own (MIX.MP,
          // the other session's extension); everything else needs a host
          const has = (o.fn === 'macro' && MIX.MP) ? MIX.MP() : (window.MIX && MIX.P());
          if (window.MIX && typeof MIX[o.fn] === 'function' && has) MIX[o.fn](...(o.a || []));
          return;
        }
        if (o.t === 'pal') { if (window.PAL) PAL.set(...(o.a || [])); return; }
        if (o.t === 'deck') { if (window.POEMDECK && typeof POEMDECK[o.fn] === 'function') POEMDECK[o.fn](); return; }
        if (o.t === 'scene') {
          if (typeof focus === 'undefined' || typeof PIECES === 'undefined') return;
          const cur = focus.idx >= 0 ? PIECES[focus.idx].id : null;
          if (o.id === cur) return;
          if (o.id === null) { if (typeof closeFocus === 'function') closeFocus(); return; }
          const i = PIECES.findIndex(p => p.id === o.id);
          if (i >= 0 && typeof openFocus === 'function') openFocus(i);
        }
      } catch (e) { this.err = String(e); }
    },

    start() {
      if (!this.cfg) return;
      this.connect();
      if (this.cfg.role === 'send') { this.wrapOurs(); this._timer = setInterval(() => this.tickSend(), 33); }
    }
  };
  window.REMOTE = R;
  R.start();

  /* the panel: only when a role is set, at the home and in a scene */
  if (R.cfg && window.PANELS && PANELS.register) {
    let line = null;
    PANELS.register({
      id: 'remote', title: 'Remote', status: true, after: 'MIDI Controller', every: 500, home: true,
      build(ctx) {
        line = document.createElement('div');
        line.style.cssText = 'font:10px/1.5 ui-monospace,monospace;color:var(--txt-dim);word-break:break-all';
        ctx.group.appendChild(line);
        const b = document.createElement('button');
        b.textContent = 'STOP REMOTE'; b.title = 'Forget the room and the relay; this page is local again';
        b.style.cssText = 'margin-top:8px;padding:4px 0;font-size:8.5px;letter-spacing:.16em;background:transparent;border:1px solid var(--line2);color:var(--txt-dim);box-shadow:none;width:100%';
        b.addEventListener('click', () => { R.off(); if (ctx.status) ctx.status.textContent = 'off'; line.textContent = 'remote off — reload to clear the panel'; });
        ctx.group.appendChild(b);
      },
      paint(ctx) {
        if (!R.cfg) return;
        if (ctx.status) ctx.status.textContent = R.open ? (R.cfg.role === 'send' ? 'sending' : 'receiving') : 'connecting…';
        if (line) line.textContent = R.cfg.role.toUpperCase() + ' · room ' + R.cfg.room + ' · ' + R.cfg.relay
          + (R.rtt !== null ? ' · rtt ' + R.rtt + ' ms' : '') + ' · ' + R.sent + '↑ ' + R.got + '↓'
          + (R.lastMsg ? ' · ' + R.lastMsg : '') + (R.err ? ' · ' + R.err : '');
      }
    });
  }
})();
