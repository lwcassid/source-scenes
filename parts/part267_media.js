/* ---------- MEDIA · clips and stills as layers ----------
   Edson, Sep 26 (the walkthrough with Gabi): "precisamos criar um sistema
   dentro do source-scenes que a gente consiga colocar clipes de vídeo e até
   quem sabe stream de vídeo." The two exceptions to "never literal": the
   launch clip — "um clipe de alguns segundos, que nem um reels", no countdown
   — and a still of the temple behind him while he talks: "aperto um botão,
   aparece atrás e eu continuo falando… não é um capítulo, ele ilustra."

   A MEDIA ITEM IS A SCENE. reg() stores the object whole and never inspects
   it; this draws in its own frame and nothing else; if it is wrong, nobody
   else's scene changes. MEDIA.reg() is a convention helper like SOURCE(),
   not a tool change. It is built to be HOSTED by a movement (part250): its
   fader is its opacity, and bringing the fader up from nothing starts the
   clip from the top (wake), pulling it down parks it (sleep). Standalone it
   plays on open and loops, so it can be checked in the library.

   THE HANDS DO NOTHING HERE, ON PURPOSE. A photograph is not an instrument;
   the knob is. Edson decides at the jam — if he wants L = size it is one
   line in step().

   FILES live in assets/media/ and are NEVER baked into index.html: the build
   concatenates parts, and a 10 MB page must not become a 60 MB one. The
   folder is gitignored except its README; the show laptop carries the files.
   Missing file → the layer prints its own name and the path, so a wrong
   filename is visible on the wall in rehearsal, never a silent black.

   SOUND. The rocket is the sound of the clip, so a video is NOT muted unless
   asked, and it plays through the layer's own audio bus — in a movement the
   fader is the volume too, and the tail goes down with the picture. An
   element can be bound to one AudioContext once; the source node is kept on
   the item and reused.

   A STREAM later (a camera, a capture) is `el.srcObject = stream` on the same
   element; nothing about the layer changes. Not built tonight.             */
(() => {
  const ITEMS = {};

  function element(M) {
    if (M._el) return M._el;
    let e;
    if (M.kind === 'video') {
      e = document.createElement('video');
      e.muted = !!M.muted; e.loop = !!M.loop; e.playsInline = true; e.preload = 'auto';
      e.addEventListener('loadeddata', () => { M._ready = true; M._err = false; });
      e.addEventListener('error', () => { M._err = true; });
      e.src = M.src;
      try { e.load(); } catch (err) {}
    } else {
      e = new Image();
      e.onload = () => { M._ready = true; M._err = false; };
      e.onerror = () => { M._err = true; };
      e.src = M.src;
    }
    M._el = e;
    return e;
  }
  const play = M => {
    const e = M._el; if (!e || M.kind !== 'video') return;
    try { const p = e.play(); if (p && p.catch) p.catch(() => {}); } catch (err) {}
  };
  const restart = M => { const e = M._el; if (!e || M.kind !== 'video') return; try { e.currentTime = 0; } catch (err) {} play(M); };
  const pause = M => { const e = M._el; if (!e || M.kind !== 'video') return; try { e.pause(); } catch (err) {} };
  /* one element, many instances: play while anyone wants it, park when nobody does */
  const want = (M, P, on, fromTop) => {
    if (!M._want) M._want = new Set();
    const had = M._want.size > 0, was = M._want.has(P);
    if (on) M._want.add(P); else M._want.delete(P);
    const has = M._want.size > 0;
    if (on && !was) { try { element(M).loop = !P.hosted || !!M.loop; } catch (err) {} if (fromTop || !had) restart(M); else play(M); }
    else if (!has && had) pause(M);
  };
  const size = M => {
    const e = M._el; if (!e) return null;
    const w = M.kind === 'video' ? e.videoWidth : e.naturalWidth;
    const h = M.kind === 'video' ? e.videoHeight : e.naturalHeight;
    return (w > 0 && h > 0) ? { w, h } : null;
  };

  window.MEDIA = {
    reg(M) {
      M.kind = M.kind || (/\.(mp4|webm|mov|m4v)$/i.test(M.src) ? 'video' : 'image');
      M.fit = M.fit || 'contain';
      ITEMS[M.id] = M;
      const isVid = M.kind === 'video';
      reg({
        id: M.id, family: M.family || M.id, ver: M.ver || 1, title: M.title,
        tech: isVid ? 'MEDIA / CLIP' : 'MEDIA / STILL',
        textIsContent: true,
        music: M.music || { bpm: 54, root: 41, mode: 'aeolian', chordBars: 8 },
        fx: { bloom: 0 },
        tags: ['TEMPLE SET', 'MEDIA', isVid ? 'CLIP' : 'STILL', 'THE KNOB IS THE INSTRUMENT', 'HANDS DO NOTHING'].concat(M.tags || []),
        desc: M.desc || (isVid ? 'A clip, played as a layer. In a movement its fader is its opacity and its volume; bring the fader up from nothing and it starts from the top.' : 'A still, shown as a layer. In a movement its fader is its opacity.'),
        interact: M.interact || 'The hands do nothing here, on purpose: a photograph is not an instrument, the knob is. Fader up from zero starts the clip from the beginning; fader down parks it.',
        sound: M.sound || (isVid && !M.muted ? 'The clip\'s own sound, through the layer\'s bus — the fader is the volume too.' : 'Silent.'),

        init(P) {
          element(M);                       // load now, so the clip is ready before its fader moves
          P.state = { t: 0, on: false };
        },
        /* WHO IS ALLOWED TO PLAY. The library wall runs a small instance of
           every scene for its thumbnail, and one element is shared by all
           instances of this item — so "play on init" put the rocket's sound
           under the whole library (Edson, 04:00). An instance may play only
           if it is FOCUSED (opened on its own) or a HOSTED layer whose fader
           is up; the element plays while any instance wants it, and parks
           when none does. */
        wake(P) { P.state.on = true; want(M, P, true, true); },
        sleep(P) { P.state.on = false; want(M, P, false); },
        step(P, dt) {
          P.state.t += dt;
          if (!P.hosted) want(M, P, !!P.focused, false);
        },

        draw(P, g, w, h) {
          const s = P.state;
          g.globalCompositeOperation = 'source-over';
          if (!P.hosted) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
          const ms = Math.max(1, Math.sqrt(areaScale(P)));
          const e = M._el, dim = size(M);
          if (M._err || !e || !dim || (M.kind === 'video' && e.readyState < 2)) {
            g.fillStyle = 'rgba(225,225,235,0.75)';
            g.font = `${Math.round(13 * ms)}px ui-monospace,monospace`;
            g.textAlign = 'center';
            g.fillText((M._err ? 'MEDIA NOT FOUND · ' : 'MEDIA LOADING · ') + M.title + ' · ' + M.src, w / 2, h / 2);
            g.textAlign = 'left';
            return;
          }
          // fit: contain keeps the whole picture; cover fills the wall
          const sc = M.fit === 'cover' ? Math.max(w / dim.w, h / dim.h) : Math.min(w / dim.w, h / dim.h);
          const dw = dim.w * sc * (M.scale || 1), dh = dim.h * sc * (M.scale || 1);
          const dx = (w - dw) / 2, dy = (h - dh) / 2;
          try { g.drawImage(e, dx, dy, dw, dh); } catch (err) {}
          if (!P.hosted && (typeof OWPERF === 'undefined' || !OWPERF())) {
            g.fillStyle = 'rgba(225,225,235,0.8)';
            g.font = `${Math.round(10 * ms)}px ui-monospace,monospace`;
            const tt = M.kind === 'video' ? ('   ' + e.currentTime.toFixed(1) + ' / ' + (e.duration || 0).toFixed(1) + 's' + (e.paused ? ' · PAUSED' : '')) : '';
            g.fillText(M.title.toUpperCase() + tt, 10, h - 10);
          }
        },

        audio(A, P) {
          if (M.kind !== 'video' || M.muted) return { tick() {}, stop() {} };
          const e = element(M);
          let src = M._src;
          if (!src || M._ctx !== A.ctx) {
            // one element, one context, one source — ever. If the context was
            // replaced, the old node is dead and a new one cannot be made;
            // the picture still shows, the sound stays on the element's own
            // output instead of the bus.
            try { src = A.ctx.createMediaElementSource(e); M._src = src; M._ctx = A.ctx; } catch (err) { src = null; }
          }
          const gn = A.ctx.createGain(); gn.gain.value = M.gain || 1;
          if (src) { try { src.connect(gn); gn.connect(A.out()); } catch (err) {} }
          return { tick() {}, stop() { setTimeout(() => { try { gn.disconnect(); } catch (err) {} }, 400); } };
        }
      });
    },
    item(id) { return ITEMS[id] || null; },
    cue(id) { const M = ITEMS[id]; if (M) restart(M); },
    state(id) {
      const M = ITEMS[id]; if (!M || !M._el) return null;
      const e = M._el;
      return { id, kind: M.kind, ready: !!M._ready, err: !!M._err,
               t: M.kind === 'video' ? +e.currentTime.toFixed(2) : 0, paused: M.kind === 'video' ? e.paused : true };
    }
  };

  /* ---- the three the night needs (files in assets/media/, see its README) ---- */
  MEDIA.reg({
    id: 'SRC-77', title: 'BoT · Launch Clip', src: 'assets/media/launch.mp4', kind: 'video', loop: false, fit: 'contain',
    tags: ['ACT 1'],
    desc: 'Transporter-18, Oct 1 2026, 2:18 PM New York: the launch and the separation, a few seconds, no countdown — shown like a reel, then gone. Alex cuts the real clip on the afternoon of the launch; until then this file is a placeholder that says so on screen. In Act 1 it sits on a fader: bring it up and it plays from the top with its own sound, pull it down and it is gone.',
    sound: 'The rocket. The clip\'s own audio through the layer\'s bus; the band holds one note under it.'
  });
  MEDIA.reg({
    id: 'SRC-78', title: 'BoT · The Temple', src: 'assets/media/temple.jpg', kind: 'image', fit: 'contain', scale: 0.72,
    tags: ['ACT 1'],
    desc: 'A photograph of the Orbital Temple, shown behind Edson while he talks about it. "A button, not a chapter": it appears, it illustrates, the talk goes on.',
    sound: 'Silent.'
  });
  MEDIA.reg({
    id: 'SRC-79', title: 'BoT · The QR', src: 'assets/media/qr.png', kind: 'image', fit: 'contain', scale: 0.78,
    tags: ['ACT 2'],
    desc: 'The QR code and the address, for the sending: think of someone, take out your phone, point it here. Up for the five minutes of the bed, then faded out when Edson pulls the room back.',
    sound: 'Silent.'
  });
})();
