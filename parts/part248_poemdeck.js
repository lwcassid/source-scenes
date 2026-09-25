/* ---------- POEMDECK · the cue player ----------
   Eleven poems, spaced minutes apart through a set, fired by hand. That is a
   THEATRE problem, not a music one, so this borrows QLab's model rather than
   inventing one: a cue list, a standby, and ONE GO.

   Why one GO and not eleven buttons: the cues are in a known order and
   minutes apart, so what you need in the dark is "next", not random access.
   One target to find, and no way to fire cue 9 when you meant 6. Direct
   jumps stay available as the exception (POEMDECK.fire(n)), never as the
   interface.

   LAUNCH IS QUANTISED, Ableton-style. GO does not start a poem; it ARMS one,
   and the voice lands on the next downbeat. A bar here is 3.75-4.8 s, so a
   naive wait would read as a broken pad — which is why the dark starts
   opening the instant you press (OWPOEM's pre-roll) and is fully open exactly
   when the voice speaks. The room sees an approach, not a delay.
   Their own law: "quantize EVENTS to the grid, never the continuous
   response." A poem is an event.

   NOTHING OF THEIRS IS TOUCHED. Input arrives by wrapping NAV.onMsg — an
   unclaimed message falls straight through to their navigation — and by our
   own keydown listener. If NAV is ever restructured this goes quiet instead
   of throwing, because a scene that throws blanks the projector. */
(() => {
  const DECK = {
    /* 'bar' | 'half' | 'off' — off fires immediately. If the jam says a bar
       drags, 'half' is the dial: ~1.9-2.4 s instead of ~3.8-4.8 s. */
    quantise: 'bar',
    armed: -1,            // POEMS index waiting for the downbeat, or -1
    armedAt: 0,

    /* the transport only runs while a scene is open; with none, fire now */
    gridAhead() {
      if (this.quantise === 'off') return 0;
      if (typeof T === 'undefined' || !T.running || typeof AE === 'undefined' || !AE.ctx) return 0;
      const beats = this.quantise === 'half' ? 2 : 4;
      const when = T.next(beats);
      return (when > AE.t()) ? when : 0;
    },

    /* ---- the two things you actually press ---- */
    go() { this.launch(OWPOEM.at(1)); },
    back() { this.launch(OWPOEM.at(-1)); },
    fire(n) { this.launch(n - 1); },              // fire(6) = OW6, 1-based on purpose

    launch(idx) {
      if (idx === undefined || idx < 0) return false;
      // IGNORED while one is speaking (Edson's call): they are minutes apart,
      // so a second press is a mistake, not an intention.
      if (OWPOEM.speaking()) return false;
      const when = this.gridAhead();
      OWPOEM.auto = false;
      OWPOEM.playAt(idx, when || (OWPOEM.now() + 0.28));
      this.armed = idx; this.armedAt = OWPOEM.now();
      return true;
    },

    /* cancel a cue that has not spoken yet. After it speaks, use stop(). */
    abort() {
      if (OWPOEM.i >= 0 && OWPOEM.now() < OWPOEM.tStart) { OWPOEM.stop(); this.armed = -1; return true; }
      return false;
    },
    stop() { OWPOEM.stop(); this.armed = -1; },

    /* ---- what the standby readout needs ---- */
    state() {
      const nextIdx = OWPOEM.at(1);
      const nextP = OWPOEM.POEMS[nextIdx] || null;
      const cur = (OWPOEM.i >= 0) ? OWPOEM.POEMS[OWPOEM.i] : null;
      const waiting = cur && OWPOEM.now() < OWPOEM.tStart;
      return {
        standbyN: nextP ? nextP.n : null,
        standbyLang: nextP ? (OWPOEM.voices === 'en' ? 'English' : nextP.spokenLang) : null,
        curN: cur ? cur.n : null,
        phase: waiting ? 'armed' : (cur ? OWPOEM.ph : 'idle'),
        countdown: waiting ? OWPOEM.countdown() : 0,
        pos: (OWPOEM.orderPos() + 1) + '/' + OWPOEM.ORDER.length,
        quantise: this.quantise
      };
    }
  };
  window.POEMDECK = DECK;

  /* ---- keyboard: the rehearsal path, and the permanent backstop ----
     A pad can fail to enumerate on the night; a keyboard cannot. These stay
     live forever, mirroring whatever the Twister does.
       ]  GO        [  back       \  stop
       .  abort an armed cue      =  hand the cycle back to auto            */
  window.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k !== ']' && k !== '[' && k !== '\\' && k !== '=' && k !== '.') return;
    e.preventDefault();
    if (k === '=') { OWPOEM.auto = true; OWPOEM.offAt = undefined; return; }
    OWPOEM.auto = false;
    if (k === '\\') return DECK.stop();
    if (k === '.') return void DECK.abort();
    DECK[k === ']' ? 'go' : 'back']();
  });

  /* ---- MIDI lives in part252_twister.js ----
     It used to wrap NAV.onMsg from here. It cannot: their input gate forwards
     CC to NAV on a RISING EDGE ONLY and without the value, which is right for
     navigation and useless for a fader. TWIST listens raw and additively
     instead, and calls POEMDECK.go()/back()/abort()/stop(). One owner. */
})();
