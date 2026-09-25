/* ---------- OWPOEM · the eleven voices ----------
   A SHARED OVERLAY, not a scene. The twelve Orbital Witnesses carry eleven
   poems and one silence; on the night each is heard as a recording in a
   friend's mother tongue.

   THE TEXT IS PART OF THE PICTURE, NOT A SUBTITLE (Edson, Sep 24). So the
   line is not set small and entire along the bottom — it arrives as LARGE
   FRAGMENTS, two or three words at a time, in step with the voice. A
   fragment is a mark on the wall the size of the wall. That also happens to
   be the only typography mesh scrim can hold: thin small letters vanish on
   it, and a word a metre tall does not.

   TWO MODES.
     solo — one fragment, centred, as big as the frame allows.
     pair — the same fragment in two languages, side by side, so the room
            sees the tongue it is being spoken in and its English at once.
   Switch with ?poem=pair in the URL, or OWPOEM.mode = 'pair' live.

   It lives here as a global (the same way areaScale and bloomTo do) because
   it has to ride over ALL SIX scenes and nothing in core draws above a
   scene. Every scene calls OWPOEM.draw() last in its own draw, and scales
   its brightness by OWPOEM.room() so the field makes way for the voice.

   THE TWELFTH IS SILENT, by the series' own argument: eleven poems and one
   silence makes the set an open question. Playing index 11 draws nothing and
   holds the room quiet for its duration — a scheduled event, not an absence.

   Audio: drop files at <assets>/poems/ow1.mp3 … ow11.mp3 (or .wav/.m4a) and
   they play and drive the timing, fragment by fragment. With no files there
   it runs on a reading-speed estimate, so the typography can be judged today
   and the recordings dropped in on Friday without touching a line. */
(() => {
  /* 🔴 `spoken` IS A PLACEHOLDER UNTIL FRIDAY. `text` is the canonical line,
     locked in artworks/first-witness-series/CURATORIAL.md, and never changes.
     `spoken` is what the RECORDING says — on the night, a friend reading in
     their mother tongue. Right now it is a machine translation voiced by
     macOS TTS, generated 2026-09-24 so the timing, the two-language layout
     and eleven different scripts could be tested before the real files land.
     Every entry marked draft:true needs Edson's pass and a real voice.
     ⚠️ OW5 is canonically YORUBA (Oxum). There is no Yoruba system voice —
     the placeholder is Hindi and that mismatch is deliberate and temporary. */
  const POEMS = [
    { n: 1,  lang: 'English', text: "who can be accepted, who shall be denied, I'm god, as I witness the heavens I've created and destroyed",
             spokenLang: 'English' },
    { n: 2,  lang: 'English', text: "trembling before reaching the ocean, a river looks back on her journey, oblivious to the pleasure of becoming",
             spokenLang: 'Français', spoken: "tremblante avant d'atteindre l'océan, une rivière se retourne sur son voyage, ignorant le plaisir de devenir", draft: true },
    { n: 3,  lang: 'English', text: "there is a sword glowing with flames, blocking the path to the third heaven — they say.",
             spokenLang: 'العربية', spoken: "هناك سيف يتوهج باللهب، يسد الطريق إلى السماء الثالثة — هكذا يقولون.", draft: true },
    { n: 4,  lang: 'English', text: "although bottomless, the sacred space is never empty",
             spokenLang: '日本語', spoken: "底がないのに、聖なる空間は決して空ではない", draft: true },
    { n: 5,  lang: 'English', text: "standing half Oxum, half mirror, a woman showing no fear of being naked opens her eyes looking exactly into mine, and without moving anything but her arm, takes a rose crystal egg from the place in her body that bleeds",
             spokenLang: 'हिन्दी', spoken: "आधी ओशुम, आधी दर्पण, एक स्त्री जो नग्न होने से नहीं डरती, अपनी आँखें खोलकर सीधे मेरी आँखों में देखती है, और अपनी बाँह के सिवा कुछ हिलाए बिना, अपने शरीर की उस जगह से जहाँ से रक्त बहता है, एक गुलाबी स्फटिक का अंडा निकालती है", draft: true },
    { n: 6,  lang: 'Português', text: "Das coisas que me ligam à terra, meu filho e essa dor nas costas",
             spokenLang: 'Português', en: "Among the things that ground me to the earth, my son and this pain in my back",
             gloss: "Among the things that ground me to the earth, my son and this pain in my back" },
    { n: 7,  lang: 'English', text: "what pays for grace? No need to pay they say. behave.",
             spokenLang: 'Deutsch', spoken: "was bezahlt die Gnade? Man muss nicht bezahlen, sagen sie. Benimm dich.", draft: true },
    { n: 8,  lang: 'English', text: "in search for just the right amount of freedom",
             spokenLang: 'Italiano', spoken: "in cerca della giusta quantità di libertà", draft: true },
    { n: 9,  lang: 'English', text: "Designed to reach the third heaven, now, mostly used for fun",
             spokenLang: '中文', spoken: "为抵达第三重天而造，如今大多只用来消遣", draft: true },
    { n: 10, lang: 'English', text: "nevertheless not thy will, but mine be done",
             spokenLang: 'Русский', spoken: "и всё же да будет не Твоя воля, а моя", draft: true },
    { n: 11, lang: 'English', text: "I again make an alliance with mystery",
             spokenLang: 'Español', spoken: "vuelvo a hacer una alianza con el misterio", draft: true },
    { n: 12, lang: '—', text: null, silent: true }
  ];
  // what each poem SAYS (falls back to the canonical line) and its GLOSS
  const said = p => (OWPOEM.voices === 'en') ? (p.en || p.text) : (p.spoken || p.text);
  const gloss = p => (OWPOEM.voices === 'en')
    ? (p.en ? p.text : null)                       // only OW6 has a second language in English mode
    : (p.gloss || (p.spoken ? p.text : null));
  const saidLang = p => (OWPOEM.voices === 'en') ? 'English' : p.spokenLang;

  /* LITERAL paths, on purpose: tools/build_preview.py scans for quoted asset
     literals and inlines them as data URIs, which is what puts the voices
     inside the OFFLINE show artifact. A computed path is invisible to it and
     a fetch finds nothing in a warehouse. Keep these literal. */
  const FILES = {
    native: {
      1: 'assets/poems/ow1.mp3', 2: 'assets/poems/ow2.mp3', 3: 'assets/poems/ow3.mp3',
      4: 'assets/poems/ow4.mp3', 5: 'assets/poems/ow5.mp3', 6: 'assets/poems/ow6.mp3',
      7: 'assets/poems/ow7.mp3', 8: 'assets/poems/ow8.mp3', 9: 'assets/poems/ow9.mp3',
      10: 'assets/poems/ow10.mp3', 11: 'assets/poems/ow11.mp3'
    },
    en: {
      1: 'assets/poems-en/ow1.mp3', 2: 'assets/poems-en/ow2.mp3', 3: 'assets/poems-en/ow3.mp3',
      4: 'assets/poems-en/ow4.mp3', 5: 'assets/poems-en/ow5.mp3', 6: 'assets/poems-en/ow6.mp3',
      7: 'assets/poems-en/ow7.mp3', 8: 'assets/poems-en/ow8.mp3', 9: 'assets/poems-en/ow9.mp3',
      10: 'assets/poems-en/ow10.mp3', 11: 'assets/poems-en/ow11.mp3'
    }
  };


  /* ---------- THE RUNNING ORDER ----------
     The OW numbers are the Witnesses and never move. THIS is the order they
     are SPOKEN in, which is a performance decision and a different thing.

     Edson, Sep 24: Portuguese opens, then French, then Japanese, and ENGLISH
     LAST. The middle alternates script families rather than grouping them —
     Latin, then CJK, then Arabic, back to Latin, Cyrillic, Devanagari — so no
     two neighbouring poems look alike on the wall, and the set comes home to
     the language the poems were written in.

     ⚠️ The twelfth is SILENT and it is placed here on purpose, after the last
     spoken line — the set ends on the silence rather than merely lacking a
     twelfth poem. Move it or drop it; it is one number in this array.

     This is the cue list. Edit it here, or live: OWPOEM.ORDER = [...]. */
  const ORDER = [
     6,   // Português  — Edson's own tongue, and the line about his son
     2,   // Français
     4,   // 日本語
     3,   // العربية
    11,   // Español
    10,   // Русский
     8,   // Italiano
     5,   // हिन्दी      (canonically Yoruba — see the assets README)
     7,   // Deutsch
     9,   // 中文
     1,   // English    — last, as asked
    12    // the silence
  ];

  /* 🔴 textIsContent:true is what keeps the POEMS alive in performance mode —
     but it lifts the no-op off fillText for the WHOLE scene, so every debug
     readout these six draw would ride onto the projection too. Each of them
     now asks this before drawing its HUD line. The poems never ask. */
  function perf() {
    try { const o = document.getElementById('overlay');
      return !!(o && o.classList.contains('fs') && o.classList.contains('perf')); }
    catch (e) { return false; }
  }
  window.OWPERF = perf;

  const MINROLL = 0.28, OUT = 1.6, GAP = 3.6, SILENT_HOLD = 14.0;
  const FAM = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  const buffers = { native: {}, en: {} };

  /* 2–3 words, breaking at punctuation where it falls — the line arrives the
     way it is spoken, not the way it is typeset. */
  function chunk(text) {
    const t = String(text).trim();
    // CHINESE AND JAPANESE DO NOT SPACE THEIR WORDS, so splitting on
    // whitespace returns the whole line as one "word" and the entire poem
    // lands on the wall in a single frame. Break those by character instead,
    // honouring their own punctuation.
    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(t)) {
      // Intl.Segmenter knows where Chinese and Japanese words actually end.
      // Chopping every N characters instead put breaks inside words — 为抵达第
      // is not a thing anybody says. Chrome has had this for years; the
      // character fallback below only runs somewhere that does not.
      let units = null;
      try {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          const lang = /[\u3040-\u30ff]/.test(t) ? 'ja' : 'zh';
          units = [...new Intl.Segmenter(lang, { granularity: 'word' }).segment(t)]
            .map(x => x.segment).filter(x => x.trim());
        }
      } catch (e) { units = null; }
      if (!units) { units = []; for (const ch of t) if (ch.trim()) units.push(ch); }
      const out = []; let cur = '';
      for (const u of units) {
        cur += u;
        const punct = /[、。，,.!?；;：:—]$/.test(u);
        if (punct || cur.length >= 5) { out.push(cur); cur = ''; }
      }
      if (cur) { if (cur.length <= 1 && out.length) out[out.length - 1] += cur; else out.push(cur); }
      return out.length ? out : [t];
    }
    const words = t.split(/\s+/).filter(Boolean);
    const out = []; let cur = [];
    for (const w of words) {
      cur.push(w);
      const punct = /[,.;:!?\u2014\u2013]$/.test(w);
      // a comma is where the voice stops, so it ends the fragment even on a
      // single word — as long as that word has enough body to stand alone.
      const solid = cur.join(' ').length >= 5;
      if ((punct && (cur.length >= 2 || solid)) || cur.length >= 3) { out.push(cur.join(' ')); cur = []; }
    }
    if (cur.length) {
      if (cur.length === 1 && out.length) out[out.length - 1] += ' ' + cur[0];
      else out.push(cur.join(' '));
    }
    return out.length ? out : [t];
  }
  /* the second language has to land on the SAME beats, so it is cut into the
     same number of pieces by weight rather than by its own punctuation */
  /* one unit at a time — a word in a spaced script, a segment in one that
     does not space. Used by grain:'word'. */
  function splitUnits(frag) {
    const t = String(frag).trim();
    if (/[\u3040-\u30ff\u3400-\u9fff]/.test(t)) {
      try {
        if (typeof Intl !== 'undefined' && Intl.Segmenter) {
          const lang = /[\u3040-\u30ff]/.test(t) ? 'ja' : 'zh';
          const u = [...new Intl.Segmenter(lang, { granularity: 'word' }).segment(t)]
            .map(x => x.segment).filter(x => x.trim());
          if (u.length) return u;
        }
      } catch (e) {}
      return [t];
    }
    const w = t.split(/\s+/).filter(Boolean);
    return w.length ? w : [t];
  }

  function chunkTo(text, n) {
    const words = String(text).split(/\s+/).filter(Boolean);
    if (!words.length) return new Array(n).fill('');
    const out = []; let i = 0;
    for (let k = 0; k < n; k++) {
      const end = Math.min(words.length, Math.max(i + 1, Math.round(((k + 1) * words.length) / n)));
      out.push(words.slice(i, end).join(' ')); i = end;
    }
    return out;
  }
  function fit(g, text, maxW, startPx, weight) {
    let px = startPx;
    for (let k = 0; k < 28 && px > 6; k++) {
      g.font = `${weight} ${px}px ${FAM}`;
      if (g.measureText(text).width <= maxW) break;
      px *= 0.93;
    }
    return px;
  }

  const OWPOEM = {
    POEMS,
    /* PAIR by default (Edson, Sep 24). Nine of the eleven are spoken in a
       language most of the room will not have, so the English is not a nicety
       — without it those poems are sound and shape only. Both columns anchor
       to the centre gutter, so the middle of the frame never moves however
       unequal the two fragments are. ?poem=solo forces one language. */
    mode: 'pair',            // 'pair' | 'solo'
    grain: 'word',           // 'word' = one at a time (default) · 'phrase' = 2–3
    voices: 'native',        // 'native' = eleven languages · 'en' = all English
    /* Switch banks live. Both sets are in the build, so this costs a reload of
       eleven small buffers and nothing else. ?poems=en picks it at startup. */
    setVoices(which) {
      if (which !== 'en' && which !== 'native') return;
      if (which === this.voices) return;
      this.stop(); this.voices = which; this._loaded = false; this._pxFor = -1;
      buffers.native = {}; buffers.en = {};
      this.load();
    },
    i: -1, ph: 'off', dur: 0, frozen: false, offAt: undefined,
    tArm: 0, tStart: 0, tEnd: 0, tGone: 0,
    /* OFF by default (Edson, Sep 24 — twice). Auto-cycling was a scaffold for
       judging typography when there was nothing to press; it is not how the
       night works and it gets in the way of looking at one poem. Press ']' to
       fire one, '=' if you ever want the cycle back. */
    auto: false,
    src: null, _loaded: false,
    frags: [], altFrags: [], slot: [], fi: 0,

    estimate(p) {
      if (!p || !p.text) return SILENT_HOLD;
      return Math.max(6, Math.min(30, p.text.split(/\s+/).length / 2.1 + 3));
    },

    load() {
      if (this._loaded) return;
      try {
        const q = (location.search + location.hash);
        if (/poem=pair/.test(q)) this.mode = 'pair';
        if (/poem=solo/.test(q)) this.mode = 'solo';
        if (/grain=word/.test(q)) this.grain = 'word';
        if (/grain=phrase/.test(q)) this.grain = 'phrase';
        if (/poems=en/.test(q)) this.voices = 'en';
      } catch (e) {}
      // ⚠️ DO NOT set _loaded before this check. It used to, which meant a
      // single tick landing before the AudioContext existed marked the voices
      // as loaded FOREVER — eleven silent poems and nothing in the log. The
      // latch closes only once the fetches have actually been started.
      if (typeof AE === 'undefined' || !AE.ctx) return;
      this._loaded = true;
      POEMS.forEach(p => {
        if (p.silent) return;
        const set = this.voices, bank = FILES[set] || FILES.native;
        const url = bank[p.n]; if (!url) { buffers[set][p.n] = false; return; }
        fetch(url).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
          .then(ab => AE.ctx.decodeAudioData(ab))
          .then(buf => { buffers[set][p.n] = buf; })
          .catch(() => { buffers[set][p.n] = false; });
      });
    },

    /* ---------- SCHEDULING ----------
       Everything is an ABSOLUTE audio-clock time, not an elapsed counter,
       because the launch is quantised and the pre-roll is therefore a
       different length every time you press.

         tArm    the moment you pressed
         tStart  the moment the voice speaks and fragment 0 appears
         tEnd    tStart + the length of the recording
         tGone   tEnd + the fade out

       BETWEEN tArm AND tStart THE DARK OPENS. That is the countdown: press
       just after a downbeat and it widens slowly over most of a bar; press
       just before one and it snaps. Either way it is fully open at tStart,
       so the room never sees a delay — it sees an approach — and the voice
       lands on the beat. Their own law: anticipation beats surprise. */
    playAt(idx, when) {
      const p = POEMS[idx]; if (!p) return;
      // AE.master is built inside ensure(), and a poem can be fired BEFORE any
      // scene has opened. Without this the master bus does not exist, the
      // fallback reaches for ctx.destination, and the control-window mute gate
      // is bypassed — the exact failure this routing exists to prevent.
      try { if (typeof AE !== 'undefined' && AE.ensure) AE.ensure(); } catch (e) {}
      this.stopAudio();
      const now = this.now();
      this.i = idx; this.last = idx; this.fi = 0; this._pxFor = -1;
      this.tArm = now;
      this.tStart = Math.max(now + MINROLL, when || 0);

      const buf = (buffers[this.voices] || {})[p.n];
      this.dur = (buf && buf.duration) ? buf.duration : this.estimate(p);
      this.tEnd = this.tStart + this.dur;
      this.tGone = this.tEnd + OUT;

      if (p.silent || !p.text) { this.frags = []; this.altFrags = []; this.slot = []; }
      else {
        this.frags = chunk(said(p));                       // what you HEAR is what you READ
        if (this.grain === 'word') this.frags = this.frags.flatMap(f => splitUnits(f));
        const g = gloss(p);
        this.altFrags = g ? chunkTo(g, this.frags.length) : [];
        const wgt = this.frags.map(f => f.length + 7);
        const tot = wgt.reduce((a, b) => a + b, 0);
        this.slot = wgt.map(x => (x / tot) * this.dur);
      }
      if (buf && typeof AE !== 'undefined' && AE.ctx) {
        try {
          const sN = AE.ctx.createBufferSource(); sN.buffer = buf;
          const g = AE.ctx.createGain(); g.gain.value = 0.9;
          // AE.master, NEVER ctx.destination — the master carries the volume
          // and the compressor, and in the Electron CONTROL window it is the
          // gate that keeps that window silent during a show.
          sN.connect(g); g.connect(AE.master || AE.ctx.destination);
          sN.start(this.tStart);          // the same instant fragment 0 appears
          this.src = sN;
        } catch (e) {}
      }
      if (typeof MOut !== 'undefined' && MOut.evNote && !p.silent) {
        try { MOut.evNote('sfx', 48 + idx, 0.3, 0, 0.4); } catch (e) {}
      }
    },
    play(idx) { this.playAt(idx, this.now() + MINROLL); },

    ORDER,
    /* step through the RUNNING ORDER, not the OW numbering */
    orderPos() {
      const n = (this.last === undefined) ? -1 : this.last + 1;
      return this.ORDER.indexOf(n);
    },
    at(dir) {
      const O = this.ORDER; if (!O.length) return -1;
      const k = this.orderPos();
      const j = (k < 0) ? (dir > 0 ? 0 : O.length - 1) : ((k + dir) % O.length + O.length) % O.length;
      return O[j] - 1;                                       // OW number -> POEMS index
    },
    step(dir) { const i = this.at(dir); if (i >= 0) this.play(i); },
    next() { this.step(1); },
    prev() { this.step(-1); },
    stopAudio() { if (this.src) { try { this.src.stop(); } catch (e) {} this.src = null; } },
    stop() { this.stopAudio(); this.i = -1; this.ph = 'off'; this.offAt = this.now(); },

    now() { return (typeof AE !== 'undefined' && AE.ctx) ? AE.t() : performance.now() / 1000; },

    tick() {
      this.load();
      if (this.frozen) return;                 // held by a harness on one frame
      const now = this.now();
      if (this.i < 0) {
        this.ph = 'off';
        if (!this.auto) return;
        if (this.offAt === undefined) this.offAt = now;
        if (now - this.offAt > this.gap) { this.offAt = undefined; this.next(); }
        return;
      }
      if (now < this.tStart) { this.ph = 'arm'; this.fi = 0; return; }
      if (now < this.tEnd) {
        this.ph = 'hold';
        const te = now - this.tStart;
        let acc = 0, k = 0;
        while (k < this.slot.length - 1 && acc + this.slot[k] <= te) { acc += this.slot[k]; k++; }
        this.fi = k;
        return;
      }
      if (now < this.tGone) { this.ph = 'out'; return; }
      this.ph = 'off'; this.i = -1; this.offAt = now; this.gap = GAP; this.stopAudio();
    },

    /* how present the voice is — what a scene dims itself by. Rises through
       the pre-roll so the field starts making room the moment you press. */
    level() {
      if (this.i < 0) return 0;
      if (this.frozen) return 1;
      const now = this.now();
      if (now < this.tStart) {
        const roll = Math.max(0.001, this.tStart - this.tArm);
        return clamp((now - this.tArm) / roll);
      }
      if (now < this.tEnd) return 1;
      return clamp(1 - (now - this.tEnd) / OUT);
    },
    /* the hole. Fully open exactly at tStart, whatever the pre-roll was. */
    plateLevel() {
      if (this.i < 0) return 0;
      if (this.frozen) return 1;
      const now = this.now();
      if (now < this.tStart) {
        const roll = Math.max(0.001, this.tStart - this.tArm);
        const x = clamp((now - this.tArm) / roll);
        return x * x * (3 - 2 * x);
      }
      if (now < this.tEnd) return 1;
      return clamp(1 - (now - this.tEnd) / OUT);
    },
    /* the words: on the wall or not. No fade, no drift — Edson's clean cut. */
    typeOn() {
      if (this.i < 0 || !this.frags.length) return false;
      if (this.frozen) return true;
      const now = this.now();
      return now >= this.tStart && now < this.tEnd;
    },
    /* seconds until the voice speaks — the deck's standby countdown */
    countdown() { return (this.i < 0) ? 0 : Math.max(0, this.tStart - this.now()); },

    fragPhase() {
      if (this.frozen) return 0.5;
      if (this.ph !== 'hold' || !this.slot.length) return 1;
      const te = this.now() - this.tStart;
      let acc = 0; for (let k = 0; k < this.fi; k++) acc += this.slot[k];
      return clamp((te - acc) / Math.max(0.15, this.slot[this.fi]));
    },
    room() { return 1 - 0.58 * this.level(); },
    speaking() { return this.ph !== 'off'; },

    /* a fragment this big does not need a rectangle behind it — it needs the
       field to stop where it stands. A soft ellipse, opened before the word
       arrives, which is also the better order: the room makes way, then the
       voice speaks. */
    /* the size at which the WIDEST fragment pair still fits — measured once
       per poem and held, so the type never resizes between beats */
    sizeFor(g, w, h, pair) {
      if (this._pxFor === this.i && this._px) return this._px;
      const S = Math.min(w, h);
      let px = pair ? S * 0.150 : S * 0.190;
      const colW = pair ? w * 0.41 : w * 0.78;
      for (let k = 0; k < this.frags.length; k++) {
        px = Math.min(px, fit(g, this.frags[k], colW, px, 600));
        if (pair && this.altFrags[k]) px = Math.min(px, fit(g, this.altFrags[k], colW, px, 400));
      }
      this._px = px; this._pxFor = this.i;
      return px;
    },

    plate(g, cx, cy, rx, ry, a) {
      g.save();
      g.translate(cx, cy); g.scale(rx / ry, 1);
      const pg = g.createRadialGradient(0, 0, 0, 0, 0, ry);
      pg.addColorStop(0, `rgba(0,0,0,${0.88 * a})`);
      pg.addColorStop(0.30, `rgba(0,0,0,${0.80 * a})`);
      pg.addColorStop(0.62, `rgba(0,0,0,${0.42 * a})`);
      pg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = pg;
      g.beginPath(); g.arc(0, 0, ry, 0, TAU); g.fill();
      g.restore();
    },

    draw(g, w, h) {
      const a = this.level(); if (a <= 0.001) return;
      const p = POEMS[this.i]; if (!p || p.silent || !this.frags.length) return;

      const ease = a * a * (3 - 2 * a);
      const pe = (x => x * x * (3 - 2 * x))(clamp(a / 0.34));   // the hole opens first
      const S = Math.min(w, h);
      // CLEAN CUT (Edson, Sep 24). The type does not drift up, does not fade
      // between fragments, and does not ease in or out: it is either on the
      // wall or it is not. Only the DARK behind it moves — the field opens a
      // hole, the word cuts in, the word cuts out, the hole closes. Anything
      // softer turns a mark back into a caption.
      const fa = this.typeOn() ? 1 : 0;
      const rise = 0;

      const pair = this.mode === 'pair' && this.altFrags.length;
      const cy = h * 0.52;

      g.save();
      g.globalCompositeOperation = 'source-over';
      g.textAlign = 'center';
      g.textBaseline = 'middle';

      if (!pair) {
        const txt = this.frags[this.fi] || '';
        const px = this.sizeFor(g, w, h, false);
        g.font = `600 ${px}px ${FAM}`;
        const tw = g.measureText(txt).width;
        this.plate(g, w / 2, cy, Math.max(tw * 0.62, S * 0.20), px * 2.4, pe);
        g.font = `600 ${px}px ${FAM}`;
        g.fillStyle = `rgba(255,248,238,${Math.max(0, fa)})`;
        g.fillText(txt, w / 2, cy - rise);
        // no language tag here: there is only one language on screen
      } else {
        // FACING PAGES. Centred columns drift apart whenever the two
        // languages differ in length, which is always. Setting the original
        // flush to a centre gutter and the other flush away from it keeps the
        // pair reading as one object however unequal the fragments are.
        const A = this.frags[this.fi] || '', B = this.altFrags[this.fi] || '';
        const gut = w / 2, pad = S * 0.042;
        const px = this.sizeFor(g, w, h, true);
        this.plate(g, gut, cy, w * 0.50, px * 2.6, pe);
        g.textAlign = 'right';
        g.font = `600 ${px}px ${FAM}`;
        g.fillStyle = `rgba(255,248,238,${Math.max(0, fa)})`;
        g.fillText(A, gut - pad, cy - rise);
        g.textAlign = 'left';
        g.font = `300 ${px}px ${FAM}`;
        g.fillStyle = `rgba(206,214,236,${Math.max(0, fa * 0.82)})`;
        g.fillText(B, gut + pad, cy - rise);
        g.textAlign = 'center';
      }

      // the mark it came from, and how far through it we are — quiet
      if (!perf()) {
        const bs = Math.max(7, S * 0.0115);
        g.font = `400 ${bs}px ui-monospace, monospace`;
        g.fillStyle = `rgba(188,184,200,${fa * 0.38})`;
        g.fillText('ORBITAL WITNESS ' + p.n + '   ' + (this.fi + 1) + '/' + this.frags.length, w / 2, h * 0.93);
      }
      g.restore();
    }

  };

  window.OWPOEM = OWPOEM;

  /* Input lives in part248_poemdeck.js — one owner, and their own rule:
     a control that exists twice is a bug. */
})();
