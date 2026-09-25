/* ---------- DIAG · the flight recorder ----------
   Edson reports: it works after a reload, runs for a while, then stops. That
   shape — fine, then degraded, then dead, cured by a reload — is something
   ACCUMULATING, and the one thing you cannot do once it has stopped is read a
   live panel. So this samples once a second into a ring buffer in
   localStorage, which survives both the freeze and the reload.

   After it happens: reload, open the console, and type   DIAG.dump()

   It counts the things that actually accumulate in this kind of app:
     · Web Audio nodes created and still un-stopped
     · JS heap
     · frames per second, measured off rAF
     · MIDI messages per second
   plus the mixer's own state, so a hang can be tied to a specific fader move.

   The node counters WRAP AE.ctx's factory methods. That is intrusive, so it is
   opt-out (DIAG.off()) and it only ever increments a number — it never changes
   what is returned. */
(() => {
  const KEY = 'srcDiag', MAX = 240;      // four minutes at 1 Hz
  const D = {
    on: true, log: [], frames: 0, _t0: 0,
    nodes: { osc: 0, gain: 0, filter: 0, buf: 0, stopped: 0 },
    _wrapped: false, peakHeap: 0,

    wrap() {
      if (this._wrapped) return;
      if (typeof AE === 'undefined' || !AE.ctx) return;
      this._wrapped = true;
      const c = AE.ctx, N = this.nodes;
      const count = (name, key) => {
        const orig = c[name]; if (typeof orig !== 'function') return;
        c[name] = function (...a) {
          const n = orig.apply(c, a);
          N[key]++;
          // a source that is never stopped is the classic Web Audio leak
          if (n && typeof n.stop === 'function') {
            const os = n.stop.bind(n);
            n.stop = (...b) => { N.stopped++; return os(...b); };
          }
          return n;
        };
      };
      count('createOscillator', 'osc');
      count('createGain', 'gain');
      count('createBiquadFilter', 'filter');
      count('createBufferSource', 'buf');
    },

    sample() {
      if (!this.on) return;
      this.wrap();
      const now = performance.now();
      const fps = this._t0 ? Math.round(this.frames * 1000 / (now - this._t0)) : 0;
      this.frames = 0; this._t0 = now;
      const mem = (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0);
      if (mem > this.peakHeap) this.peakHeap = mem;
      const mx = (window.MIX && MIX.state) ? MIX.state() : null;
      const row = {
        t: Math.round(now / 1000),
        fps,
        mb: mem,
        midi: (window.TWIST ? TWIST.rate : 0),
        ctx: (typeof AE !== 'undefined' && AE.ctx) ? AE.ctx.state : '-',
        // sources created minus sources stopped: if this climbs without bound,
        // something is leaving voices running
        live: this.nodes.osc + this.nodes.buf - this.nodes.stopped,
        osc: this.nodes.osc, gain: this.nodes.gain,
        scene: (typeof focus !== 'undefined' && focus.P) ? focus.P.def.id : '-',
        fade: mx ? mx.fade.join('/') : '-',
        poem: (window.OWPOEM && OWPOEM.i >= 0) ? OWPOEM.POEMS[OWPOEM.i].n : 0
      };
      this.log.push(row);
      if (this.log.length > MAX) this.log.shift();
      try { localStorage.setItem(KEY, JSON.stringify(this.log.slice(-90))); } catch (e) {}
    },

    /* what to read after it stops */
    dump(n) {
      let L = this.log;
      if (!L.length) { try { L = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { L = []; } }
      if (!L.length) { console.log('DIAG: nothing recorded'); return; }
      const show = L.slice(-(n || 60));
      console.log('t     fps   MB   midi/s  livesrc  osc    gain   ctx       scene    faders');
      show.forEach(r => console.log(
        String(r.t).padEnd(6) + String(r.fps).padEnd(6) + String(r.mb).padEnd(5) +
        String(r.midi).padEnd(8) + String(r.live).padEnd(9) + String(r.osc).padEnd(7) +
        String(r.gain).padEnd(7) + String(r.ctx).padEnd(10) + String(r.scene).padEnd(9) + r.fade));
      const a = show[0], z = show[show.length - 1];
      console.log('\nover ' + (z.t - a.t) + 's:  heap ' + a.mb + '→' + z.mb + ' MB' +
                  '   live sources ' + a.live + '→' + z.live +
                  '   oscillators created ' + a.osc + '→' + z.osc +
                  '   fps ' + a.fps + '→' + z.fps);
      if (z.live - a.live > 200) console.log('🔴 SOURCES ARE LEAKING — voices are being created and not stopped');
      if (z.mb - a.mb > 300) console.log('🔴 HEAP IS CLIMBING — something is retained per frame');
      if (z.midi > 400) console.log('🔴 MIDI FLOOD — the controller is sending ' + z.midi + '/s');
      const E = this.errors();
      if (E.length) {
        console.log('\n🔴 ' + E.length + ' TRAPPED ERROR(S) — this is what killed it:');
        E.forEach(e => console.log('  [' + e.at + '] ' + e.kind + ' in ' + e.scene + ' @' + e.t + 's\n    ' + e.msg + '\n    ' + e.stack.split('\n').slice(0, 4).join('\n    ')));
      } else {
        console.log('\nno errors trapped — if it froze, the thread was BLOCKED, not thrown out of');
      }
      return show;
    },
    clear() { this.log = []; try { localStorage.removeItem(KEY); localStorage.removeItem('srcDiagErr'); } catch (e) {} },
    off() { this.on = false; }
  };

  /* ---- THE TRAP ----
     "the music keeps playing, the picture stops, a reload fixes it" means the
     AUDIO THREAD is alive and the MAIN THREAD's animation loop is not. In
     their frame() the requestAnimationFrame(frame) re-arm is the LAST line, so
     ONE uncaught throw anywhere above it and the loop never comes back — while
     WebAudio, on its own thread, carries on. That is exactly the reported
     shape, so catch the throw and keep it somewhere a reload cannot erase.

     If nothing is captured when it next freezes, that is information too: it
     means the thread is BLOCKED rather than dead, and the hunt moves to a
     runaway loop instead of an exception. */
  const ERRKEY = 'srcDiagErr';
  function record(kind, msg, stack) {
    try {
      const prev = JSON.parse(localStorage.getItem(ERRKEY) || '[]');
      prev.push({ at: new Date().toISOString().slice(11, 19), kind,
                  msg: String(msg).slice(0, 300), stack: String(stack || '').slice(0, 900),
                  scene: (typeof focus !== 'undefined' && focus.P) ? focus.P.def.id : '-',
                  t: Math.round(performance.now() / 1000) });
      localStorage.setItem(ERRKEY, JSON.stringify(prev.slice(-12)));
    } catch (e) {}
  }
  window.addEventListener('error', e => record('error', e.message, e.error && e.error.stack));
  window.addEventListener('unhandledrejection', e => record('promise', e.reason && e.reason.message, e.reason && e.reason.stack));
  D.errors = () => { try { return JSON.parse(localStorage.getItem(ERRKEY) || '[]'); } catch (e) { return []; } };
  D.clearErrors = () => { try { localStorage.removeItem(ERRKEY); } catch (e) {} };

  /* A STALL WATCHDOG. rAF stops when the tab is hidden, so only a visible tab
     that has not painted for two seconds counts — and then we say how long, and
     what the last frame saw. */
  let lastFrame = performance.now();
  (function tickFrames() { D.frames++; lastFrame = performance.now(); requestAnimationFrame(tickFrames); })();
  setInterval(() => {
    if (document.hidden) { lastFrame = performance.now(); return; }
    const gap = performance.now() - lastFrame;
    if (gap > 2000 && !D._stalled) {
      D._stalled = true;
      record('STALL', 'animation loop stopped for ' + Math.round(gap) + 'ms — audio thread may still be running', '');
    } else if (gap < 500) D._stalled = false;
  }, 1000);
  setInterval(() => { try { D.sample(); } catch (e) {} }, 1000);
  window.DIAG = D;
})();
