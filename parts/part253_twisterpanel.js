/* ---------- THE TWISTER PANEL ----------
   Two surfaces, on Edson's call, Sep 25:

   THE RAIL is a picture of the controller and nothing else — "a beautiful,
   clean visualization of the controller's current state", after 404zero's
   zerror MIDI surface: a 4x4 of knob discs, each with its value arc in the
   colour its LED is showing, a tiny label underneath, and an empty or dark
   knob drawn as a thin outline. Under it, MAP — and in a scene, AUTO-MAP.
   Slot 1 is the encoder top-left under your hand; you never translate.

   THE MAP WINDOW is where everything else went: the knob editor (turn and
   push per knob, the light swatch), UNMAP and COPY FROM, and the device's
   own tools — TEST and the lights switch. They were on the rail and they
   were too loud there: "the button LIT 40 is confusing … I don't like the
   button TEST in home, it has too much prominence." It opens like the
   SOURCE MAP popover beside the rail, only bigger, and at this width the
   dropdowns finally read in full.

   Knob 16 is SOUND OUT by the driver's suggestion — AUTO-MAP puts it there
   and a dark scene keeps it live — but every knob, 16 included, is yours.

   Repaints with textContent and value writes only — never innerHTML over a
   live control, never while a control has focus. */
(() => {
  const GLYPH = { turn: '↻', push: '↓' };
  /* the panel's approximation of what the ring will look like. The device
     renders a hue from one MIDI byte; these are close enough that the drawn
     knob and the real one are recognisably the same colour. */
  const CSS = { blue: '#3b6cff', cyan: '#19c8d8', green: '#2fc45c', yellow: '#d9d020',
                amber: '#ee9b1c', red: '#e8402f', magenta: '#d62f9e', violet: '#8a4be0' };
  const cssFor = v => {
    if (!window.TWIST) return '#555';
    const h = TWIST.HUES.find(x => x.v === v);
    return h ? (CSS[h.k] || '#888') : '#888';
  };
  const needsMix = fn => fn !== 'none' && (fn.indexOf('fader') === 0 || fn.indexOf('solo') === 0 || fn === 'unsolo'
                                           || fn.indexOf('macro') === 0 || fn === 'blackout');

  /* ================= THE RAIL ================= */
  let built = false, statusEl = null, cv = null, btnRow = null, amBtn = null, mapBtn = null, connRow = null;

  function btn(label, title, fn, css) {
    const b = document.createElement('button');
    b.textContent = label; if (title) b.title = title;
    b.style.cssText = 'flex:1;min-width:0' + (css ? ';' + css : '');
    b.addEventListener('click', fn);
    return b;
  }

  function build(ctx) {
    if (built || !window.TWIST) return; built = true;
    statusEl = ctx.status;
    const g = ctx.group;

    cv = document.createElement('canvas');
    cv.id = 'twSurface';
    cv.title = 'The Twister as it is right now — click a knob to push it, drag it to turn it; MAP to change what each knob does';
    cv.style.cssText = 'display:block;width:100%;cursor:pointer;margin:0 0 12px';
    mouse(cv);
    g.appendChild(cv);

    btnRow = document.createElement('div');
    btnRow.className = 'srow';
    btnRow.style.cssText = 'display:flex;gap:6px;min-width:0';
    /* AUXILIARY, and they look it (Edson, Sep 25: "the buttons on the bottom
       are auxiliars"): the picture is the panel; these are small, quiet,
       outlined, and do not compete with it. */
    const AUX = 'padding:4px 0;font-size:8.5px;letter-spacing:.16em;background:transparent;'
      + 'border:1px solid var(--line2);color:var(--txt-dim);box-shadow:none';
    amBtn = btn('AUTO-MAP', 'Lay out this scene: its layers, the solos and the poem cues', () => TWIST.autoMap(), AUX);
    mapBtn = btn('MAP', 'Everything else: what each knob does, its light, TEST', () => openPop(!isOpen()), AUX);
    btnRow.append(amBtn, mapBtn);
    g.appendChild(btnRow);

    /* DISCONNECTED SHOWS ONE THING. Edson, Sep 25: "if it's disconnected do
       not show the interface, just the connect button." */
    connRow = document.createElement('div');
    connRow.className = 'srow';
    connRow.style.display = 'none';
    connRow.appendChild(btn('CONNECT THE TWISTER',
      'Ask the browser for MIDI. Permission is per page load, so a reload always needs this again.',
      () => TWIST.connect()));
    g.appendChild(connRow);
  }

  /* ---- THE MOUSE (Edson, Sep 30: "if I click in a knob is a click, if I
     click and drag it changes the [value] of that knob") ----
     The picture is also a Twister you can play without the hardware:
       CLICK a knob     = its PUSH, exactly as the hardware press (and it burns)
       DRAG a knob      = its TURN: up or right = more, ~160 px end to end,
                          SHIFT for fine. Picks up from where the control is.
       CLICK elsewhere  = MAP, as the picture always did — so does a knob that
                          does nothing here, which is the one you want to map.
     A press never fires after a drag, and a drag never starts under 4 px, so
     a slightly shaky click is still a click. Everything goes through
     TWIST.fire, the same door the hardware uses, so the show cannot tell the
     mouse from the knob. Same knobs as the picture: nothing is clickable that
     is not drawn live (no MIDI, off the desk, a dark scene's fifteen). */
  let geo = null;                                   // the last draw's geometry
  const DRAG_PX = 160, SLOP = 4;
  function knobAt(ev) {
    if (!geo || !cv) return -1;
    const r = cv.getBoundingClientRect(); if (!r.width) return -1;
    const k = geo.W / r.width, x = (ev.clientX - r.left) * k, y = (ev.clientY - r.top) * k;
    const col = Math.floor(x / geo.cw), row = Math.floor(y / geo.ch);
    if (col < 0 || col > 3 || row < 0 || row > 3) return -1;
    const cx = (col + 0.5) * geo.cw, cy = row * geo.ch + geo.R + 3;
    return Math.hypot(x - cx, y - cy) <= geo.R + 6 ? row * 4 + col : -1;
  }
  function liveSlot(i) {
    const T = window.TWIST; if (i < 0 || !T || !T.hasAccess()) return null;
    const hit = T.live().find(p => p[0] === i), S = hit && hit[1];
    return S && (S.turn !== 'none' || S.push !== 'none') ? S : null;
  }
  function mouse(el) {
    let d = null;                                   // the gesture in progress
    const end = () => { d = null; el.style.cursor = 'pointer'; };
    el.addEventListener('pointerdown', ev => {
      if (ev.button !== 0 || d) return;
      const i = knobAt(ev), S = liveSlot(i);
      d = { id: ev.pointerId, i: S ? i : -1, S, x: ev.clientX, y: ev.clientY,
            lx: ev.clientX, ly: ev.clientY, moved: false, v: 0 };
      if (S) {
        ev.preventDefault();                        // no text selection, no focus theft
        if (S.turn !== 'none') d.v = clamp(TWIST.current(S.turn));
      }
      try { el.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    el.addEventListener('pointermove', ev => {
      if (!d || ev.pointerId !== d.id) return;
      if (!d.moved) {
        if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < SLOP) return;
        d.moved = true; d.lx = d.x; d.ly = d.y;     // the slop counts toward the turn
        if (d.S && d.S.turn !== 'none') el.style.cursor = 'ns-resize';
      }
      const dx = ev.clientX - d.lx, dy = ev.clientY - d.ly;
      d.lx = ev.clientX; d.ly = ev.clientY;
      if (!d.S || d.S.turn === 'none') return;
      const next = clamp(d.v + (dx - dy) / DRAG_PX * (ev.shiftKey ? 0.2 : 1));
      if (next === d.v) return;
      d.v = next;
      const T = TWIST;
      T.fire(d.S.turn, next);
      // a relative encoder keeps its own running value; keep it in step so
      // the hardware picks up where the mouse left it instead of jumping back
      if (T._acc && T._acc[d.S.turn] !== undefined) T._acc[d.S.turn] = next;
      draw();
    });
    el.addEventListener('pointerup', ev => {
      if (!d || ev.pointerId !== d.id) return;
      const g = d; end();
      if (g.moved) return;
      if (g.S) {
        if (g.S.push !== 'none') { TWIST.hit(g.i); TWIST.fire(g.S.push, 1); draw(); }
        return;                                     // a turn-only knob: a click is nothing
      }
      openPop(true);
    });
    el.addEventListener('pointercancel', end);
    el.addEventListener('lostpointercapture', ev => { if (d && ev.pointerId === d.id) end(); });
  }

  /* ---- the picture ----
     Drawn every paint; sixteen discs is nothing. Theme colours come from the
     page's own tokens, so it is right in light and dark without a table. */
  function tok(name, fb) {
    // from BODY: the theme is a class on body (body.light), so the tokens
    // resolved on <html> are always the dark ones
    try { const v = getComputedStyle(document.body).getPropertyValue(name).trim(); return v || fb; }
    catch (e) { return fb; }
  }
  // the colour actually painted behind the picture — the first ancestor with
  // an opaque background, since the two rails do not share one token
  function railBg() {
    for (let e = cv; e; e = e.parentElement) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
    }
    return tok('--bg', '#111');
  }
  function draw() {
    const T = window.TWIST; if (!cv || !T) return;
    // a folded rail, or the show fullscreen, has no picture to keep fresh —
    // and the show has to hold 60fps
    if (!cv.offsetParent || document.fullscreenElement) return;
    const W = Math.max(120, Math.round(cv.parentNode ? cv.parentNode.clientWidth : 220));
    /* ONE MODULE, repeated. A knob's whole footprint is its arc radius R;
       every other size — disc, lit pad, empty ring, label — is derived from
       it, and a row is almost exactly a column, so the 4x4 reads as the square
       grid the hardware is. */
    const cw = W / 4, ch = cw * 0.98, R = cw * 0.29;
    const H = Math.round(ch * 4);
    geo = { W, cw, ch, R };
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr || cv.height !== H * dpr) {
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
    }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    const dim = tok('--txt-dim', '#888'),
          line = tok('--line2', tok('--line', '#444')), mono = tok('--mono', 'ui-monospace, monospace'),
          bg = railBg();
    const live = T.hasAccess();
    const hasMix = T.hasMix(), nL = T.nLayers();
    const r = R - 5;                                           // the disc inside the arc
    const A0 = Math.PI * 0.75, SWEEP = Math.PI * 1.5;          // a knob's 270°

    for (let i = 0; i < 16; i++) {
      const cx = (i % 4 + 0.5) * cw, cy = Math.floor(i / 4) * ch + R + 3;
      const S = live ? T.slotAt(i) : null;
      const on = S && (S.turn !== 'none' || S.push !== 'none');

      if (!on) {
        /* AN UNUSED KNOB IS A KNOB, just without colour (Edson, Sep 25: the
           orange outline "is getting too much attention"). Same track, same
           disc, same dot — grey, and quieter than anything that does work. */
        g.globalAlpha = live ? 0.55 : 0.35;
        g.lineCap = 'round';
        g.strokeStyle = line; g.lineWidth = 3;
        g.beginPath(); g.arc(cx, cy, R - 1.5, A0, A0 + SWEEP); g.stroke();
        g.fillStyle = '#2b2b30';
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = line; g.lineWidth = 1;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
        g.fillStyle = '#55555c';
        g.beginPath(); g.arc(cx, cy, Math.max(2, R * 0.13), 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1;
        continue;
      }

      const L = T.lightFor(i, S);
      const col = cssFor(L.col);
      const stale = (S.turn !== 'none' && !hasMix && needsMix(S.turn))
        || (S.turn.indexOf('fader') === 0 && +S.turn.slice(5) >= nL)
        || (S.turn.indexOf('macro') === 0 && hasMix && +S.turn.slice(5) >= T.nMacros())
        || (/^(hue|band)\d$/.test(S.turn) && !(window.PAL && PAL.active()));
      g.globalAlpha = stale ? 0.35 : 1;

      /* THREE KINDS OF KNOB, one colour each — the knob's own LED colour,
         never a second one (Edson, Sep 25), and the centre dot ALWAYS there:
           TURNS          a value arc around a dark disc; a grey dot (no push)
           ONLY PUSHES    no arc — a pad lit in its colour; a dot in the
                          page's own background, a hole punched in the pad
           BOTH           the arc, and the dot in the knob's colour */
      const turns = S.turn !== 'none', pushes = S.push !== 'none';
      g.lineCap = 'round';
      if (turns) {
        const v = L.ring / 127;
        g.strokeStyle = line; g.lineWidth = 3;
        g.beginPath(); g.arc(cx, cy, R - 1.5, A0, A0 + SWEEP); g.stroke();
        if (v > 0.004) {
          g.strokeStyle = col; g.lineWidth = 3.2;
          g.beginPath(); g.arc(cx, cy, R - 1.5, A0, A0 + SWEEP * v); g.stroke();
        }
        // the disc — dark in both themes, like the hardware, with a rim so it
        // still reads against a dark panel
        g.fillStyle = '#2b2b30';
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
        g.strokeStyle = line; g.lineWidth = 1;
        g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
      } else {
        g.fillStyle = col;
        g.beginPath(); g.arc(cx, cy, R - 3, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = (turns && pushes) ? col : (turns ? '#6c6c74' : bg);
      g.beginPath(); g.arc(cx, cy, Math.max(2, R * 0.13), 0, Math.PI * 2); g.fill();
      // pressed: the rim burns for a moment, as the LED does
      if (T.hitAge(i) < 0.25) {
        g.strokeStyle = '#fff'; g.lineWidth = 1.5;
        g.beginPath(); g.arc(cx, cy, turns ? r : R - 3, 0, Math.PI * 2); g.stroke();
      }

      // the label, tiny, underneath
      const lab = [S.turn, S.push].filter(f => f !== 'none').map(f => T.FN[f].short).join(' ');
      g.fillStyle = dim; g.font = '8.5px ' + mono; g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillText(lab, cx, cy + R + 4);
      g.globalAlpha = 1;
    }
  }

  function paint() {
    if (!built) return;
    const T = window.TWIST; if (!T) return;
    const live = T.hasAccess();
    T.sync();
    const key = T.key(), mapped = T.mapped();

    const devs = T.devices();
    let s = !live ? 'NOT CONNECTED'
      : (T.connected() ? 'CONNECTED' : (devs.length ? devs.length + ' MIDI IN' : 'NO MIDI'))
        + (T.rate > 400 ? '  ' + T.rate + '/s ⚠' : '');
    if (live && key && !mapped) s = 'DARK · ' + s;
    if (statusEl.textContent !== s) statusEl.textContent = s;

    const show = (el, on, d) => { const w = on ? (d || '') : 'none'; if (el.style.display !== w) el.style.display = w; };
    show(btnRow, live, 'flex');
    show(connRow, !live);
    show(amBtn, !!key);          // at the home there is no scene to lay out
    draw();

    if (isOpen() && pop) paintPop(T, live, key, mapped);
  }

  /* ================= THE MAP WINDOW ================= */
  let pop = null, whereEl = null, connBox = null, homeBox = null, darkBox = null, mapBox = null, devBox = null;
  let cells = [], helpEl = null, noteEl = null, lightBtn = null, copySels = [], lastN = -1, lastKey = null, lastCopy = null,
      curTo = [], curPo = [];

  function mkRow(kind, opts, onChange) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:4px';
    const g = document.createElement('span');
    g.textContent = GLYPH[kind];
    g.style.cssText = 'flex:0 0 10px;font-size:11px;line-height:1;'
      + (kind === 'turn' ? 'color:var(--acc)' : 'color:var(--txt-dim)');
    const sel = document.createElement('select');
    sel.style.cssText = 'flex:1;min-width:0;width:100%;padding:3px 2px;font-size:10px;letter-spacing:.02em';
    /* A SAVED MAPPING THAT OUTLIVED ITS SCENE STILL HAS TO SHOW. A knob on
       LAYER 5 in a two-layer movement keeps the option, marked, so the editor
       never claims a knob does nothing while it in fact still carries it. */
    const fill = (ks, cur) => {
      const keep = (cur === undefined) ? sel.value : cur;
      sel.textContent = '';
      const list = ks.slice();
      if (keep && list.indexOf(keep) < 0) list.push(keep);
      list.forEach(k => {
        const o = document.createElement('option');
        o.value = k;
        const lab = (window.TWIST && TWIST.FN[k]) ? TWIST.FN[k].label : k;
        const stale = ks.indexOf(k) < 0;
        o.textContent = k === 'none' ? '—' : (stale ? lab + ' (not here)' : lab);
        sel.appendChild(o);
      });
      sel.value = keep;
    };
    fill(opts);
    sel.addEventListener('change', () => onChange(sel.value));
    row.append(g, sel);
    return { row, sel, fill };
  }

  function h4(text) {
    const h = document.createElement('h4');
    h.textContent = text;
    h.style.cssText = 'font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--txt);margin:0 0 8px';
    return h;
  }
  function para(text, faint) {
    const p = document.createElement('p');
    p.style.cssText = 'font-size:10.5px;line-height:1.65;color:var(--txt-dim);margin:6px 0' + (faint ? ';font-size:9.5px;color:var(--txt-faint)' : '');
    if (text) p.textContent = text;
    return p;
  }
  function row(...els) {
    const r = document.createElement('div');
    r.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0';
    els.forEach(e => { e.style.flex = '1'; e.style.minWidth = '0'; r.appendChild(e); });
    return r;
  }
  function copySel() {
    const sel = document.createElement('select');
    sel.style.cssText = 'font-size:10px';
    sel.title = 'Start from another scene\'s map. It is copied, so the two never edit each other.';
    sel.addEventListener('change', () => { if (sel.value) TWIST.copyFrom(sel.value); sel.value = ''; });
    copySels.push(sel);
    return sel;
  }

  /* THE MAP WINDOW IS A SHEET (partcore_sheet.js, Sep 28): the standard for
     every secondary panel — the same place, the same header (TITLE · CONTEXT
     · ×), Esc and a click outside close it. `pop` is the sheet's body while
     it is open and null otherwise; everything is rebuilt on each open. */
  let sheet = null;
  const isOpen = () => !!(window.SHEET && SHEET.isOpen('twMap'));
  function buildPop(body) {
    const T = window.TWIST;
    pop = body; cells = []; copySels = [];
    whereEl = { set textContent(v) { if (sheet) sheet.context(v); }, get textContent() { return sheet ? sheet.el.querySelector('.sheet-ctx').textContent : ''; } };

    connBox = document.createElement('div');
    connBox.append(para('MIDI permission is per page load — a reload always needs it again.'),
      row(btn('CONNECT THE TWISTER', '', () => TWIST.connect())));
    pop.appendChild(connBox);

    homeBox = para('This is the desk. Open a scene to map its knobs — each scene maps the Twister or leaves it dark. Here, and in a dark scene, knob 16 is SOUND OUT.');
    pop.appendChild(homeBox);

    darkBox = document.createElement('div');
    darkBox.append(para('Not mapped in this scene — the knobs do nothing here and their lights are off, except knob 16, SOUND OUT.'),
      row(btn('AUTO-MAP', 'Lay out this scene: its layers, the solos and the poem cues', () => TWIST.autoMap()), copySel()));
    pop.appendChild(darkBox);

    mapBox = document.createElement('div');
    const key = para(''); key.innerHTML = '<b style="color:var(--acc)">↻ turn</b> = a value &nbsp;·&nbsp; <b>↓ push</b> = an action &nbsp;·&nbsp; the square sets that knob\'s light';
    mapBox.appendChild(key);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0';
    for (let i = 0; i < T.SLOTS; i++) {
      const cell = document.createElement('div');
      cell.style.cssText = 'border:1px solid var(--line2);border-radius:6px;padding:5px 6px 7px;min-width:0;overflow:hidden';
      const top = document.createElement('div');
      top.style.cssText = 'display:flex;align-items:center;gap:4px';
      const n = document.createElement('span');
      n.textContent = i + 1; n.style.cssText = 'font:9px var(--mono);opacity:.55;flex:1';
      /* ONE SWATCH PER KNOB: click steps forward through the palette,
         shift-click back, one more past the end returns to AUTO (the family
         colour). */
      const sw = document.createElement('button');
      sw.style.cssText = 'flex:0 0 12px;height:12px;padding:0;border-radius:3px;border:1px solid var(--line2);cursor:pointer;line-height:0';
      sw.addEventListener('click', e => {
        e.preventDefault();
        const S = TWIST.slots[i]; if (!S) return;
        const H = TWIST.HUES, cur = (S.col === undefined || S.col === null) ? -1 : H.findIndex(q => q.v === S.col);
        let next = cur + (e.shiftKey ? -1 : 1);
        if (next >= H.length || next < -1) next = -1;
        TWIST.setSlotColour(i, next < 0 ? null : H[next].v);
      });
      top.append(n, sw); cell.appendChild(top);
      const Tr = mkRow('turn', T.turnOpts(), v => TWIST.setFn(i, 'turn', v));
      const Pr = mkRow('push', T.pushOpts(), v => TWIST.setFn(i, 'push', v));
      cell.append(Tr.row, Pr.row);
      grid.appendChild(cell);
      cells.push({ cell, tSel: Tr.sel, pSel: Pr.sel, sw, fillT: Tr.fill, fillP: Pr.fill });
    }
    mapBox.appendChild(grid);
    mapBox.appendChild(row(
      btn('AUTO-MAP', 'Lay out this scene again: its layers, the solos and the poem cues', () => TWIST.autoMap()),
      btn('UNMAP', 'This scene goes back to dark: the knobs do nothing here and their lights go off', () => TWIST.unmap()),
      copySel()));
    helpEl = para('', true);
    mapBox.appendChild(helpEl);
    pop.appendChild(mapBox);

    devBox = SHEET.section('The device');
    lightBtn = btn('LIGHTS: ON', 'Stop sending to the controller\'s lights, or start again', () => {
      TWIST.lights = !TWIST.lights;
      if (!TWIST.lights) TWIST.allOff(); else TWIST._sent = {};
    });
    devBox.appendChild(row(
      btn('TEST', 'Flash every knob red, green, blue. If nothing happens the port is the problem, not the mapping.', () => TWIST.test()),
      lightBtn,
      // taking it off the desk lives here, not on the rail — Edson, Sep 25
      // says only what it does (Edson, Sep 25: "this is disconnecting? if yes,
      // it should only say that")
      btn('DISCONNECT', 'Disconnect the Twister: deaf and dark in every scene until you ADD it again. Its maps are kept.',
        () => { openPop(false); MIDIRIG.remove('twister'); })));
    noteEl = SHEET.status();                       // the machine talking
    devBox.appendChild(noteEl);
    pop.appendChild(devBox);

  }

  function openPop(on) {
    if (!window.SHEET) return;
    if (!on) { SHEET.close('twMap'); return; }
    if (isOpen()) return;
    lastN = -1; lastCopy = null; lastKey = null;
    sheet = SHEET.open({
      id: 'twMap', title: 'Midi Fighter Twister', size: 'm', trigger: mapBtn,
      keep: t => !!(cv && cv.contains(t)),        // clicking the rail's knob picture keeps it open
      build: body => buildPop(body),
      close: () => { pop = null; sheet = null; }
    });
    paint();
  }

  function paintPop(T, live, key, mapped) {
    const show = (el, on) => { const w = on ? '' : 'none'; if (el.style.display !== w) el.style.display = w; };
    show(connBox, !live);
    show(homeBox, live && !key);
    show(darkBox, live && !!key && !mapped);
    show(mapBox, live && !!key && mapped);
    show(devBox, live);
    const where = key ? key + (mapped ? '' : ' · DARK') : 'THE DESK';
    if (whereEl.textContent !== where) whereEl.textContent = where;
    if (!live) return;

    const hasMix = T.hasMix(), nL = T.nLayers();
    if (key !== lastKey) { lastKey = key; lastN = -1; lastCopy = null; }

    // COPY FROM: every other mapped scene, plus the old shared map if there was one
    const srcs = T.mappedScenes().filter(k => k !== key);
    const sig = srcs.join(',') + (T.legacy ? '|old' : '');
    if (sig !== lastCopy && !copySels.includes(document.activeElement)) {
      lastCopy = sig;
      for (const sel of copySels) {
        sel.textContent = '';
        const add = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); };
        add('', srcs.length || T.legacy ? 'COPY FROM…' : 'nothing to copy yet');
        for (const k of srcs) {
          let t = k;
          try { const p = PIECES.find(q => String(q.id).split('.')[0] === k); if (p && p.title) t = k + ' · ' + p.title; } catch (e) {}
          add(k, t);
        }
        if (T.legacy) add('~old', 'the old shared map');
        sel.disabled = !(srcs.length || T.legacy);
      }
    }

    if (mapped) {
      /* THE LISTS FOLLOW THE SCENE: two layers offer L1-L2, not six. Only
         rebuilt when the count or the scene changes — refilling 32 selects
         every paint would fight the one you have open. */
      if (nL !== lastN) {
        lastN = nL;
        curTo = T.turnOpts(); curPo = T.pushOpts();
        const L = nL > 1 ? 'L1-L' + nL : 'L1', S = nL > 1 ? 'S1-S' + nL : 'S1';
        helpEl.innerHTML = '<b>' + L + '</b> layer faders &nbsp; <b>' + S + '</b> solo &nbsp; <b>US</b> unsolo &nbsp; '
          + '<b>GO BK AB ST</b> poem cues &nbsp; <b>OUT</b> sound out — AUTO-MAP puts it on knob 16';
        cells.forEach((C, i) => {
          const S2 = T.slots[i];
          C.fillT(curTo, S2 ? S2.turn : undefined);
          C.fillP(curPo, S2 ? S2.push : undefined);
        });
      }
      cells.forEach((C, i) => {
        const S2 = T.slots[i]; if (!S2) return;
        const hit = T.hitAge(i) < 0.25;
        const bc = hit ? 'var(--acc)' : 'var(--line2)';
        if (C.cell.style.borderColor !== bc) C.cell.style.borderColor = bc;
        const auto = (S2.col === undefined || S2.col === null);
        const eff = T.lightFor(i).col, bg = cssFor(eff);
        if (C.sw.style.background !== bg) C.sw.style.background = bg;
        const op = auto ? '0.4' : '1';
        if (C.sw.style.opacity !== op) C.sw.style.opacity = op;
        const h = T.HUES.find(q => q.v === eff);
        const tt = 'knob ' + (i + 1) + ' light: ' + (auto ? 'AUTO · ' : '') + (h ? h.k : 'unlit') + ' — click to change, shift-click to go back';
        if (C.sw.title !== tt) C.sw.title = tt;
        if (document.activeElement !== C.tSel && C.tSel.value !== S2.turn) C.tSel.value = S2.turn;
        if (document.activeElement !== C.pSel && C.pSel.value !== S2.push) C.pSel.value = S2.push;
        // a control with nothing behind it in this scene is dim
        const tStale = S2.turn !== 'none'
          && ((curTo.length && curTo.indexOf(S2.turn) < 0) || (!hasMix && needsMix(S2.turn)));
        const pStale = S2.push !== 'none' && ((curPo.length && curPo.indexOf(S2.push) < 0) || (!hasMix && needsMix(S2.push)));
        const tOp = tStale ? '0.35' : '1', pOp = pStale ? '0.35' : '1';
        if (C.tSel.style.opacity !== tOp) C.tSel.style.opacity = tOp;
        if (C.pSel.style.opacity !== pOp) C.pSel.style.opacity = pOp;
        const tb = (S2.turn !== 'none' && !tStale) ? 'var(--acc)' : 'var(--line2)';
        if (C.tSel.style.borderColor !== tb) C.tSel.style.borderColor = tb;
        const dimc = (S2.turn === 'none' && S2.push === 'none') ? '0.5' : '1';
        if (C.cell.style.opacity !== dimc) C.cell.style.opacity = dimc;
      });
    }

    const lab = !T.findOut() ? 'LIGHTS: NO OUTPUT' : (T.lights ? 'LIGHTS: ON' : 'LIGHTS: OFF');
    if (lightBtn.textContent !== lab) lightBtn.textContent = lab;

    /* WHAT WENT OUT AND WHAT CAME IN, in plain sight: "I press the knob and
       nothing happens" is unanswerable from a panel that only shows what we
       send. A press that never arrives and one that arrives and matches no
       knob look different here. */
    let n = T.note || '';
    if (T.outErr) n = (n ? n + '\n' : '') + '⚠ ' + T.outErr;
    else if (T.outName) n = (n ? n + '\n' : '') + '→ ' + T.outName + ' · ' + T.sentCount + ' light messages sent';
    if (T.modeOf()) n += '\nencoders: ' + T.modeOf() + (T.rate ? ' · ' + T.rate + ' msg/s' : '');
    if (key && mapped && !hasMix) n += '\nno mixer in this scene — faders and solos do nothing here. Poem cues and SOUND OUT still work.';
    const R = T.lastRaw;
    if (R) {
      const kind = R.st === 0xB0 ? 'CC' : R.st === 0x90 ? 'NOTE' : ('0x' + R.st.toString(16));
      n += '\nin: ' + kind + ' ch' + R.ch + ' #' + R.num + ' = ' + R.val + (T.lastMsg ? '  → ' + T.lastMsg : '  → no knob');
    }
    if (noteEl.textContent !== n) noteEl.textContent = n;
  }

  /* A DRIVER, not a panel. MIDIRIG owns the sidebar group, the ADD button and
     the desk; this file only knows how to draw a Twister. */
  MIDIRIG.registerDriver({
    id: 'twister',
    name: 'Midi Fighter Twister',
    blurb: '16 encoders with push and RGB rings',
    build, paint,
    // off the desk: dark, deaf, and its window closed
    active(on) {
      try {
        if (!on) { if (window.TWIST) TWIST.allOff(); openPop(false); }
        else if (window.TWIST) TWIST._sent = {};
      } catch (e) {}
    }
  });
  window.TWISTPANEL = { open: () => openPop(true), close: () => openPop(false) };
})();
