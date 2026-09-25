/* ---------- THE TWISTER PANEL ----------
   The controller's own group in the sidebar, directly under SOURCE INPUT —
   with the things you play, not down with the reading matter. It is a 4x4
   grid because the device is a 4x4 grid: slot 1 in the panel is the encoder
   top-left under your hand, and you should never have to translate.

   Each slot shows what it does when TURNED and what it does when PUSHED.
   Pick either from a dropdown. The Twister sends the factory CC n / NOTE n on
   channel 1 — AUTO-MAP assumes it does and lays the whole show out in one
   click, for exactly the layers the open scene actually has.

   TWISTER-ONLY, by Edson's call on Sep 25. Another controller gets its own
   module; there is no learn mode here to make this one generic.

   Injected at load from our own part file, so part5_tail.js binds its fold
   and per-browser memory to us afterwards, for free. Repaints with
   textContent and value writes only — never innerHTML, never while a control
   has focus. Unlike the mix panel this one is ALWAYS visible: you set the
   controller up before a scene is open, and a panel that hides when you need
   it is how you end up mapping in the dark. */
(() => {
  let group, cells = [], statusEl, noteEl, helpEl = null, built = false;
  const ROWS = [], LIGHTBTN = [], AMBTN = [];

  /* A cell is 50-odd pixels wide, so every option label is truncated to two or
     three characters — which made the two dropdowns indistinguishable. The
     glyph goes INSIDE the option text, first, so it is the one thing that
     SURVIVES the truncation: "↻ LA…" and "↓ SO…" read at a glance.
     The border colour carries the same distinction for anyone not reading. */
  const GLYPH = { turn: '↻', push: '↓' };
  /* the panel's approximation of what the ring will look like. The device
     renders a hue from one MIDI byte; these are just close enough that the
     swatch and the knob are recognisably the same colour. */
  const CSS = { blue: '#3b6cff', cyan: '#19c8d8', green: '#2fc45c', yellow: '#d9d020',
                amber: '#ee9b1c', red: '#e8402f', magenta: '#d62f9e', violet: '#8a4be0' };
  const cssFor = v => {
    if (!window.TWIST) return '#555';
    const h = TWIST.HUES.find(x => x.v === v);
    return h ? (CSS[h.k] || '#888') : '#888';
  };
  let lastN = -1, curTo = [], curPo = [];
  /* The glyph lives OUTSIDE the <select>, not inside its option text. A native
     select at fifty pixels spends fourteen of them on its own arrow, so a glyph
     in the label left about three characters for everything else and "↻L1" came
     back as "↻L" — which is any of six layers. Out here the glyph is always
     visible AND the code gets the whole field. */
  function mkRow(kind, opts, onChange) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:2px;margin-top:3px';
    const g = document.createElement('span');
    g.textContent = GLYPH[kind];
    g.style.cssText = 'flex:0 0 8px;font-size:10px;line-height:1;'
      + (kind === 'turn' ? 'color:var(--acc)' : 'color:var(--txt-dim)');
    const sel = document.createElement('select');
    sel.style.cssText = 'flex:1;min-width:0;width:100%;padding:3px 0 3px 2px;font-size:9px;letter-spacing:.02em';
    /* The list is rebuilt when the open scene's layer count changes — a
       movement with two visuals must not offer LAYER 5. Rebuilding a <select>
       loses its value, so the caller's value is reapplied by the painter; and
       we never touch a select the user currently has open. */
    const fill = (ks, cur) => {
      const keep = (cur === undefined) ? sel.value : cur;
      sel.textContent = '';
      const list = ks.slice();
      /* A SAVED MAPPING THAT OUTLIVED ITS SCENE STILL HAS TO SHOW. A layout
         stored when six layers were open keeps LAYER 5 on a knob; open a
         movement with two and that option is gone, the <select> falls back to
         empty, and the panel says the knob does nothing while the knob in
         fact still carries it. So the stale value is appended, marked, and
         left selectable-away. The hardware already tells the same story —
         lightFor dims a fader past the end of the layer list. */
      if (keep && list.indexOf(keep) < 0) list.push(keep);
      list.forEach(k => {
        const o = document.createElement('option');
        o.value = k;
        const short = (window.TWIST && TWIST.FN[k]) ? TWIST.FN[k].short : k;
        const stale = ks.indexOf(k) < 0;
        o.textContent = stale ? short + '!' : short;
        if (stale) o.title = short + ' is not in this scene';
        sel.appendChild(o);
      });
      sel.value = keep;
    };
    fill(opts);
    sel.addEventListener('change', () => onChange(sel.value));
    row.append(g, sel);
    return { row, sel, g, fill };
  }

  function build() {
    if (built || !window.TWIST) return; built = true;
    const host = document.getElementById('sidebar'); if (!host) return;
    const anchor = [...host.querySelectorAll('.sgroup')]
      .find(g => (g.querySelector('h5') || {}).textContent === 'Source input');

    group = document.createElement('section');
    group.className = 'sgroup'; group.id = 'twistGroup';

    const h = document.createElement('h5');
    h.textContent = 'Twister';
    const st = document.createElement('span');
    st.style.cssText = 'float:right;font-size:9px;letter-spacing:.1em;opacity:.6';
    h.appendChild(st); statusEl = st;
    group.appendChild(h);

    const key = document.createElement('p');
    key.className = 'sinfo';
    key.style.cssText = 'margin:0 0 6px;opacity:.7';
    key.innerHTML = '<b style="color:var(--acc)">↻ turn</b> = a value &nbsp;·&nbsp; <b>↓ push</b> = an action';
    group.appendChild(key);

    const grid = document.createElement('div');
    // minmax(0,1fr), not 1fr. A grid track defaults to min-width:auto, so a
    // column refuses to shrink below its content and the fourth one simply
    // overflowed the 248px rail and got clipped. The cells need min-width:0
    // for the same reason.
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:0 0 8px';
    for (let i = 0; i < TWIST.SLOTS; i++) {
      const cell = document.createElement('div');
      cell.style.cssText = 'border:1px solid var(--line2);border-radius:5px;padding:3px 3px 4px;min-width:0;overflow:hidden';

      const top = document.createElement('div');
      top.style.cssText = 'display:flex;align-items:center;gap:4px;margin:0 0 3px';
      const n = document.createElement('span');
      n.textContent = (i + 1); n.style.cssText = 'font-size:9px;opacity:.5;flex:1';

      /* ONE SWATCH PER KNOB (Edson, Sep 25: "colours should be an individual
         toggle for each button"). The cell is ~50px wide, which is no room for
         a named dropdown, so the swatch IS the control: click steps forward
         through the palette, shift-click steps back, and one more step past
         the end returns it to AUTO — the family colour it had before anyone
         touched it. The title attribute carries the name, because a dot in a
         dark room is not self-describing. */
      const sw = document.createElement('button');
      sw.style.cssText = 'flex:0 0 11px;height:11px;padding:0;border-radius:3px;'
        + 'border:1px solid var(--line2);cursor:pointer;line-height:0';
      sw.addEventListener('click', e => {
        e.preventDefault();
        const S = TWIST.slots[i]; if (!S) return;
        const H = TWIST.HUES, cur = (S.col === undefined || S.col === null) ? -1
          : H.findIndex(x => x.v === S.col);
        const step = e.shiftKey ? -1 : 1;
        let next = cur + step;
        if (next >= H.length || next < -1) next = -1;        // past either end: AUTO
        TWIST.setSlotColour(i, next < 0 ? null : H[next].v);
      });
      top.append(n, sw); cell.appendChild(top);

      const T = mkRow('turn', TWIST.turnOpts(), v => TWIST.setFn(i, 'turn', v));
      const P = mkRow('push', TWIST.pushOpts(), v => TWIST.setFn(i, 'push', v));
      const tSel = T.sel, pSel = P.sel;
      cell.append(T.row, P.row);
      grid.appendChild(cell);
      cells.push({ cell, tSel, pSel, sw, fillT: T.fill, fillP: P.fill });
    }
    group.appendChild(grid);

    /* ---- LED COLOURS ----
       The 1-126 scale is a hue sweep and the exact hue per number is not
       published, so these are adjustable and the DEVICE is the authority, not
       my table. Four families, because four is what you can hold in your head
       in a dark room. */
    /* The four family colour rows (layers / instr / solo / cues) were removed
       on Sep 25: colour is per knob now, set by the swatch on each slot, and
       two ways to choose the same thing is one too many on a rail this
       narrow. TWIST.colour and DEFCOL stay — they are what a slot falls back
       to when its own colour is AUTO. */

    const row = document.createElement('div');
    row.className = 'srow';
    // Five buttons total 336px against a 219px rail. Without wrapping, TEST falls
    // off the edge — the same clipping the colour rows hit.
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;min-width:0';
    const am = document.createElement('button');
    am.textContent = 'AUTO-MAP';
    am.title = 'Assume the factory layout: encoder n sends CC n and NOTE n on channel 1';
    am.addEventListener('click', () => { if (TWIST.hasMix()) TWIST.autoMap(); });
    AMBTN.push(am);
    const cl = document.createElement('button');
    cl.textContent = 'CLEAR';
    cl.addEventListener('click', () => TWIST.clearAll());
    const lt = document.createElement('button');
    lt.title = 'Stop sending to the controller\'s lights, or start again';
    lt.addEventListener('click', () => {
      TWIST.lights = !TWIST.lights;
      if (!TWIST.lights) TWIST.allOff(); else TWIST._sent = {};
    });
    const tb = document.createElement('button');
    tb.textContent = 'TEST';
    tb.title = 'Flash every knob red, green, blue. If nothing happens the port is the problem, not the mapping.';
    tb.addEventListener('click', () => TWIST.test());
    row.append(am, cl, lt, tb); group.appendChild(row);
    LIGHTBTN.push(lt);

    noteEl = document.createElement('p');
    noteEl.className = 'sinfo';
    noteEl.style.whiteSpace = 'pre-line';   // the raw-message line sits under the port line
    group.appendChild(noteEl);

    const help = document.createElement('p');
    help.className = 'sinfo';
    help.style.opacity = '.55';
    group.appendChild(help);
    helpEl = help;

    if (anchor && anchor.nextSibling) host.insertBefore(group, anchor.nextSibling);
    else host.appendChild(group);
  }

  function paint() {
    if (!built) { build(); return; }
    const T = window.TWIST; if (!T) return;
    const devs = T.devices();
    const flood = T.rate > 400;
    const s = (T.connected() ? 'CONNECTED' : (devs.length ? devs.length + ' MIDI IN' : 'NO MIDI'))
            + (T.modeOf() ? '  ' + T.modeOf() : '')
            + (T.rate ? '  ' + T.rate + '/s' + (flood ? ' ⚠' : '') : '');
    if (statusEl.textContent !== s) statusEl.textContent = s;

    /* THE LISTS FOLLOW THE SCENE. A movement with two visuals offers L1-L2 and
       S1-S2, not six of each. Only rebuilt when the count actually changes —
       refilling sixteen pairs of <select> every 150ms would fight the user for
       the one they have open. */
    const hasMix = T.hasMix();
    const nL = T.nLayers();
    // a never-configured controller lays itself out the first time a scene
    // with layers is open — once, and never again over a saved layout
    if (T.virgin && window.MIX && MIX.count && MIX.count() > 0) { T.virgin = false; T.autoMap(); }
    if (nL !== lastN) {
      lastN = nL;
      const to = T.turnOpts(), po = T.pushOpts();
      curTo = to; curPo = po;
      // the legend names the layers this scene actually has, not a fixed six
      if (helpEl) {
        const L = nL > 1 ? 'L1-L' + nL : 'L1', S = nL > 1 ? 'S1-S' + nL : 'S1';
        helpEl.innerHTML = '<b>' + L + '</b> layer faders &nbsp; <b>VOL</b> instrument &nbsp; <b>'
          + S + '</b> solo &nbsp; <b>US</b> unsolo<br>'
          + '<b>GO BK AB ST</b> poem cues &nbsp;·&nbsp; hover a slot for the full name<br>'
          + 'AUTO-MAP lays out the layers the open scene has &nbsp;·&nbsp; the dot sets that knob\'s light';
      }
      for (let i = 0; i < cells.length; i++) {
        const C = cells[i], S = T.slots[i];
        if (C.fillT) C.fillT(to, S ? S.turn : undefined);
        if (C.fillP) C.fillP(po, S ? S.push : undefined);
      }
    }

    for (let i = 0; i < cells.length; i++) {
      const C = cells[i], S = T.slots[i]; if (!S) continue;
      // a slot lit by a recent message, so you can see which knob you touched
      const hit = T.hitAge(i) < 0.25;
      C.cell.style.borderColor = hit ? 'var(--acc)' : 'var(--line2)';

      if (C.sw) {
        const auto = (S.col === undefined || S.col === null);
        const eff = T.lightFor(i).col;               // what the knob will actually show
        const bg = cssFor(eff);
        if (C.sw.style.background !== bg) C.sw.style.background = bg;
        // AUTO is drawn dimmer, so "I chose this" and "it came with the family"
        // are not the same picture
        const op = auto ? '0.4' : '1';
        if (C.sw.style.opacity !== op) C.sw.style.opacity = op;
        const h = T.HUES.find(x => x.v === eff);
        const nm = (auto ? 'AUTO · ' : '') + (h ? h.k : 'unlit');
        const tt = 'knob ' + (i + 1) + ' light: ' + nm + ' — click to change, shift-click to go back';
        if (C.sw.title !== tt) C.sw.title = tt;
      }
      if (document.activeElement !== C.tSel && C.tSel.value !== S.turn) C.tSel.value = S.turn;
      // the accent means "this turns something" — an empty slot must not wear it
      /* A STALE BINDING READS AS STALE. The '!' appended to the option text is
         clipped by the select's own arrow at this width, so the colour has to
         carry it: a knob still bound to LAYER 5 in a two-layer scene goes dim,
         matching what its LED is already doing. */
      /* A control with nothing behind it is dim, whether that is because the
         layer does not exist in this scene or because this scene has no mixer
         at all. Same signal, same cause from the player's side: do not reach
         for this one. */
      const needsMix = fn => fn !== 'none' && (fn.indexOf('fader') === 0 || fn.indexOf('solo') === 0 || fn === 'inst' || fn === 'unsolo');
      const tStale = S.turn !== 'none' && ((curTo.length && curTo.indexOf(S.turn) < 0) || (!hasMix && needsMix(S.turn)));
      const pStale = S.push !== 'none' && ((curPo.length && curPo.indexOf(S.push) < 0) || (!hasMix && needsMix(S.push)));
      const tOp = tStale ? '0.35' : '1', pOp = pStale ? '0.35' : '1';
      if (C.tSel.style.opacity !== tOp) C.tSel.style.opacity = tOp;
      if (C.pSel.style.opacity !== pOp) C.pSel.style.opacity = pOp;

      const tOn = S.turn !== 'none' && !tStale;
      const bc = tOn ? 'var(--acc)' : 'var(--line2)';
      if (C.tSel.style.borderColor !== bc) C.tSel.style.borderColor = bc;
      const ttl = '↻ TURN encoder ' + (i + 1) + ' — ' + (window.TWIST ? TWIST.FN[S.turn].label : S.turn);
      if (C.tSel.title !== ttl) C.tSel.title = ttl;
      const ptl = '↓ PUSH encoder ' + (i + 1) + ' — ' + (window.TWIST ? TWIST.FN[S.push].label : S.push);
      if (C.pSel.title !== ptl) C.pSel.title = ptl;
      if (document.activeElement !== C.pSel && C.pSel.value !== S.push) C.pSel.value = S.push;
      const dim = (S.turn === 'none' && S.push === 'none') ? '0.45' : '1';
      if (C.cell.style.opacity !== dim) C.cell.style.opacity = dim;
    }
    if (LIGHTBTN[0]) {
      const lab = !T.findOut() ? 'NO OUT' : (T.lights ? 'LIT ' + T.sentCount : 'LIGHTS OFF');
      if (LIGHTBTN[0].textContent !== lab) LIGHTBTN[0].textContent = lab;
      LIGHTBTN[0].classList.toggle('on', !!(T.lights && T.findOut()));
    }

    // say what the output actually is, or exactly why there is none
    let n = T.note || '';
    if (!n) {
      if (T.outErr) n = '⚠ ' + T.outErr;
      else if (T.outName) n = '→ ' + T.outName + ' · ' + T.sentCount + ' msgs sent';
    }
    /* THE LAST THING THE HARDWARE SAID, in plain sight. "I press ] and the
       poem starts, I press the knob and it does not" is unanswerable from a
       panel that only shows what we SEND. This shows what arrived and which
       slot claimed it — so a press that never reaches us and a press that
       reaches us and matches nothing look different. */
    if (AMBTN[0]) {
      AMBTN[0].style.opacity = hasMix ? '1' : '0.4';
      AMBTN[0].title = hasMix
        ? 'Lay out the layers this scene has, plus instrument and poem cues'
        : 'This scene has no mixer — there are no layers to map';
    }
    if (!hasMix) {
      n = (n ? n + '\n' : '') + 'no mixer in this scene — faders, solos and VOL do nothing here. Poem cues still work.';
    }
    const R = T.lastRaw;
    if (R) {
      const kind = R.st === 0xB0 ? 'CC' : R.st === 0x90 ? 'NOTE' : ('0x' + R.st.toString(16));
      n = (n ? n + '\n' : '') + 'in: ' + kind + ' ch' + R.ch + ' #' + R.num + ' = ' + R.val
        + (T.lastMsg ? '  → ' + T.lastMsg : '  → no slot');
    }
    if (group.style.boxShadow) group.style.boxShadow = '';
    if (noteEl.textContent !== n) noteEl.textContent = n;
  }

  build();
  // never let a repaint throw: at this interval one bad frame becomes a
  // console flood, and a console flood looks exactly like a freeze.
  const safePaint = () => { try { paint(); } catch (e) {} };
  setInterval(safePaint, 150);
})();
