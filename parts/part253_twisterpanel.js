/* ---------- THE TWISTER PANEL ----------
   The controller's own group in the sidebar, directly under SOURCE INPUT —
   with the things you play, not down with the reading matter. It is a 4x4
   grid because the device is a 4x4 grid: slot 1 in the panel is the encoder
   top-left under your hand, and you should never have to translate.

   Each slot shows what it does when TURNED and what it does when PUSHED.
   Pick either from a dropdown. LEARN is only needed if the device does not
   send the factory CC n / NOTE n on channel 1 — AUTO-MAP assumes it does and
   lays the whole show out in one click.

   Injected at load from our own part file, so part5_tail.js binds its fold
   and per-browser memory to us afterwards, for free. Repaints with
   textContent and value writes only — never innerHTML, never while a control
   has focus. Unlike the mix panel this one is ALWAYS visible: you set the
   controller up before a scene is open, and a panel that hides when you need
   it is how you end up mapping in the dark. */
(() => {
  let group, cells = [], statusEl, noteEl, built = false;
  const ROWS = [], COLS = [], LIGHTBTN = [];

  /* A cell is 50-odd pixels wide, so every option label is truncated to two or
     three characters — which made the two dropdowns indistinguishable. The
     glyph goes INSIDE the option text, first, so it is the one thing that
     SURVIVES the truncation: "↻ LA…" and "↓ SO…" read at a glance.
     The border colour carries the same distinction for anyone not reading. */
  const GLYPH = { turn: '↻', push: '↓' };
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
    opts.forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = (window.TWIST && TWIST.FN[k].short) ? TWIST.FN[k].short : k;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => onChange(sel.value));
    row.append(g, sel);
    return { row, sel, g };
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
      const lb = document.createElement('button');
      lb.textContent = '⌖'; lb.title = 'LEARN this slot — click, then turn or press that encoder';
      lb.style.cssText = 'padding:1px 5px;font-size:9px;line-height:1.2';
      lb.addEventListener('click', () => TWIST.arm(i));
      top.append(n, lb); cell.appendChild(top);

      const T = mkRow('turn', TWIST.TURNS, v => TWIST.setFn(i, 'turn', v));
      const P = mkRow('push', TWIST.PUSHES, v => TWIST.setFn(i, 'push', v));
      const tSel = T.sel, pSel = P.sel;
      cell.append(T.row, P.row);
      grid.appendChild(cell);
      cells.push({ cell, lb, tSel, pSel });
    }
    group.appendChild(grid);

    /* ---- LED COLOURS ----
       The 1-126 scale is a hue sweep and the exact hue per number is not
       published, so these are adjustable and the DEVICE is the authority, not
       my table. Four families, because four is what you can hold in your head
       in a dark room. */
    const colWrap = document.createElement('div');
    colWrap.style.cssText = 'display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px;margin:0 0 8px';
    const COLROWS = [];
    [['fader', 'layers'], ['inst', 'instr'], ['solo', 'solo'], ['cue', 'cues']].forEach(([fam, lab]) => {
      const r = document.createElement('div');
      r.style.cssText = 'display:flex;align-items:center;gap:3px';
      const sw = document.createElement('span');
      sw.style.cssText = 'flex:0 0 9px;height:9px;border-radius:50%;border:1px solid var(--line2)';
      const t = document.createElement('span');
      t.textContent = lab;
      t.style.cssText = 'flex:0 0 30px;font-size:9px;opacity:.65';
      const sel = document.createElement('select');
      sel.style.cssText = 'flex:1;min-width:0;padding:2px 0 2px 2px;font-size:9px';
      (window.TWIST ? TWIST.HUES : []).forEach(h => {
        const o = document.createElement('option'); o.value = h.v; o.textContent = h.k; sel.appendChild(o);
      });
      sel.title = 'the colour this family lights up on the controller';
      sel.addEventListener('change', () => { if (window.TWIST) TWIST.setColour(fam, +sel.value); });
      r.append(sw, t, sel); colWrap.appendChild(r);
      COLROWS.push({ fam, sel, sw });
    });
    group.appendChild(colWrap);
    COLS.push(COLROWS);

    const row = document.createElement('div');
    row.className = 'srow';
    const am = document.createElement('button');
    am.textContent = 'AUTO-MAP';
    am.title = 'Assume the factory layout: encoder n sends CC n and NOTE n on channel 1';
    am.addEventListener('click', () => TWIST.autoMap());
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
    group.appendChild(noteEl);

    const help = document.createElement('p');
    help.className = 'sinfo';
    help.style.opacity = '.55';
    help.innerHTML = '<b>L1-L6</b> layer faders &nbsp; <b>VOL</b> instrument &nbsp; <b>S1-S6</b> solo &nbsp; <b>US</b> unsolo<br>'
      + '<b>GO BK AB ST</b> poem cues &nbsp;·&nbsp; hover a slot for the full name<br>'
      + '⌖ binds a slot to a control — only needed off the factory numbers';
    group.appendChild(help);

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

    for (let i = 0; i < cells.length; i++) {
      const C = cells[i], S = T.slots[i]; if (!S) continue;
      const armed = T.learn === i;
      const lab = armed ? '…' : '⌖';
      if (C.lb.textContent !== lab) C.lb.textContent = lab;
      C.lb.classList.toggle('learning', armed);
      // a slot lit by a recent message, so you can see which knob you touched
      C.cell.style.borderColor = armed ? 'var(--acc)' : 'var(--line2)';
      if (document.activeElement !== C.tSel && C.tSel.value !== S.turn) C.tSel.value = S.turn;
      // the accent means "this turns something" — an empty slot must not wear it
      const tOn = S.turn !== 'none';
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
    /* the colour rows: swatch, and the select showing what is chosen. The
       swatch only APPROXIMATES the hue — the 1-126 scale's exact colours are
       not published, so the device is the authority and these are adjustable. */
    const HUECSS = v => 'hsl(' + Math.round(((v - 1) / 125) * 330) + ',85%,55%)';
    const CR = COLS[0];
    if (CR) for (const r of CR) {
      const v = (T.colour && T.colour[r.fam] !== undefined) ? T.colour[r.fam] : 0;
      if (document.activeElement !== r.sel && +r.sel.value !== v) r.sel.value = String(v);
      const css = HUECSS(v);
      if (r.sw.style.background !== css) r.sw.style.background = css;
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
    // ARMED IS LOUD. While a slot is armed every MIDI message is swallowed by
    // the learn branch, so from the outside the controller looks dead. It must
    // be impossible to be in this state without seeing it.
    if (T.learn !== null) {
      const left = Math.max(0, Math.ceil((T.learnUntil - performance.now()) / 1000));
      n = '● LEARNING slot ' + (T.learn + 1) + ' — turn or press it (' + left + 's) · Esc to cancel';
      group.style.boxShadow = '0 0 0 1px var(--acc)';
    } else if (group.style.boxShadow) group.style.boxShadow = '';
    if (noteEl.textContent !== n) noteEl.textContent = n;
  }

  build();
  // never let a repaint throw: at this interval one bad frame becomes a
  // console flood, and a console flood looks exactly like a freeze.
  const safePaint = () => { try { paint(); } catch (e) {} };
  setInterval(safePaint, 150);
})();
