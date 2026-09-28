/* ---------- SHEET — the standard for a secondary panel, offered for core ----------

   Edson, Sep 28 2026: "the secondary panels, the ones we open when clicking
   an item on the nav bar, are starting to get all over the place. We need
   to create a standard for these UIs." His reading of what exists: the
   SOURCE INPUT MAP is good but not great, the Twister MAP is ok, and the
   colour picker (the browser's own) is not ok.

   A SHEET is what a rail item opens when the rail is too small for the job:
   a map editor, a colour, a device. This file is the standard AND the thing
   that enforces it — a sheet built here cannot come out different. Like
   PANELS, it is written as a proposal for core: core's MAP, AUDIO IN and
   QUEUE popovers are Lance's and untouched; the rules below are drawn from
   the best of them (MAP's calm section heads and pill buttons, the Twister
   window's title bar) so adopting it there is a restyle, not a redesign.

   THE STANDARD
   1. ONE PLACE. Every sheet opens in the same slot: beside the rail, under
      the header — where core's MAP already opens. The eye learns one place.
      One sheet at a time; opening one closes the other.
   2. TWO WIDTHS. S = 340px (one column of controls, core MAP's width) and
      M = 580px (a grid, the Twister). Nothing in between.
   3. THE HEADER IS ALWAYS THE SAME: TITLE · CONTEXT · ×.
        TITLE    what this is, one or two words ("COLOUR", "MIDI FIGHTER TWISTER")
        CONTEXT  what it is editing, in mono ("SRC-73 · c0 · TEMPLE GOLD")
        ×        closes. So do Esc and a click anywhere outside.
      A hairline under it. The header does not scroll away.
   4. ONE LINE OF LEDE, AT MOST. Say what the sheet does in a sentence; the
      coaching lives in tooltips (Lance's decluttering rule for MAP, kept).
   5. SECTIONS, each a small tracked HEAD and a hairline above it — never
      a box inside a box.
   6. CORE'S OWN CONTROLS. The pill button, the select, the mono label. A
      row of actions shares its width equally. The accent colour means ON,
      nothing else.
   7. A STATUS LINE last, in faint mono, when the sheet has something to
      report (a device, a count, a warning). It is the machine talking.
   8. LIVE. No OK, no Cancel, no Apply: every change lands as it is made,
      and the wall follows. REVERT, where it exists, is a control, not a
      dialog step.
   9. IT NEVER STEALS THE SHOW. Esc is taken in the capture phase and
      stopped (in a scene, Escape also closes the scene — two core handlers);
      a drag that starts inside and ends over the stage does not close it;
      nothing inside takes focus but real text fields, so the number keys
      still solo layers. On a phone it spans the width, as core's pops do.

   THE SHAPE
       const sh = SHEET.open({
         id: 'twMap',             // the element id; also what toggles
         title: 'Colour',         // 3.
         context: 'SRC-73 · c0',  // 3. (sh.context(t) updates it)
         size: 's' | 'm',         // 2.
         trigger: el,             // the rail control that opened it: it gets
                                  //   .on while open, and clicking it again
                                  //   closes instead of re-opening
         build(body, sh) {},      // once per open; SHEET.* helpers below
         paint(body, sh) {},      // every 100 ms while open
         close() {}               // optional
       });
       SHEET.toggle(spec) · SHEET.close(id) · SHEET.isOpen(id)
       helpers: SHEET.lede(text) · SHEET.section(title) · SHEET.row(...els)
                SHEET.btn(label, title, fn) · SHEET.status()               */
(() => {
  if (typeof window === 'undefined' || window.SHEET) return;

  const css = document.createElement('style');
  css.textContent = `
  .sheet{position:fixed;top:54px;left:calc(var(--rail) + 14px);z-index:160;max-height:86vh;display:flex;flex-direction:column;
    background:var(--panel);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 18px 50px rgba(0,0,0,.3);overflow:hidden}
  .sheet.s{width:340px} .sheet.m{width:min(580px,calc(100vw - var(--rail) - 28px))}
  .sheet-head{display:flex;align-items:center;gap:10px;padding:12px 10px 11px 16px;border-bottom:1px solid var(--line2);flex:none}
  .sheet-title{font-size:10px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--txt);white-space:nowrap}
  .sheet-ctx{flex:1;min-width:0;font:9px var(--mono);letter-spacing:.12em;color:var(--txt-faint);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sheet-body{padding:12px 16px 16px;overflow-y:auto}
  .sheet-lede{font-size:10.5px;line-height:1.6;color:var(--txt-dim);margin:0 0 10px}
  .sheet-sec{border-top:1px solid var(--line2);margin-top:14px;padding-top:12px}
  .sheet-sec:first-child{border-top:0;margin-top:0;padding-top:0}
  .sheet-h{font-size:9px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--txt);margin:0 0 9px}
  .sheet-row{display:flex;gap:6px;align-items:center;margin:8px 0}
  .sheet-row > *{flex:1;min-width:0}
  .sheet-status{font:9px/1.6 var(--mono);letter-spacing:.06em;color:var(--txt-faint);margin-top:12px;white-space:pre-wrap}
  @media (max-width:700px){ .sheet,.sheet.s,.sheet.m{left:10px;right:10px;width:auto;top:50px} }`;
  document.head.appendChild(css);

  let cur = null;          // the one open sheet
  let timer = null;

  function close(id) {
    if (!cur || (id && cur.spec.id !== id)) return;
    const c = cur; cur = null;
    clearInterval(timer); timer = null;
    if (c.spec.trigger) c.spec.trigger.classList.remove('on');
    try { c.spec.close && c.spec.close(c); } catch (e) {}
    c.el.remove();
  }

  function open(spec) {
    if (cur && cur.spec.id === spec.id) { cur.spec = Object.assign(cur.spec, spec); cur.context(spec.context || ''); return cur; }
    close();
    const el = document.createElement('div');
    el.className = 'sheet ' + (spec.size === 'm' ? 'm' : 's');
    el.id = spec.id;
    const head = document.createElement('div'); head.className = 'sheet-head';
    const t = document.createElement('div'); t.className = 'sheet-title'; t.textContent = spec.title || '';
    const ctx = document.createElement('div'); ctx.className = 'sheet-ctx';
    const x = document.createElement('button'); x.className = 'icon'; x.textContent = '×'; x.title = 'close (Esc)';
    x.addEventListener('click', () => close());
    head.append(t, ctx, x);
    const body = document.createElement('div'); body.className = 'sheet-body';
    el.append(head, body);
    document.body.appendChild(el);
    const sh = cur = {
      spec, el, body, head,
      context(s) { const v = String(s || ''); if (ctx.textContent !== v) { ctx.textContent = v; ctx.title = v; } },
      close() { close(spec.id); }
    };
    sh.context(spec.context);
    if (spec.trigger) spec.trigger.classList.add('on');
    try { spec.build && spec.build(body, sh); } catch (e) { console.error('sheet build', spec.id, e); }
    const paint = () => { if (cur !== sh) return; try { sh.spec.paint && sh.spec.paint(body, sh); } catch (e) {} };
    paint(); timer = setInterval(paint, 100);
    return sh;
  }

  /* 9. — Esc in the capture phase, only while a sheet is open */
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !cur) return;
    e.stopImmediatePropagation(); e.stopPropagation(); e.preventDefault();
    close();
  }, true);
  /* a click outside closes — but a press that STARTED inside (a drag on a
     colour field that ends over the stage) never does, and the trigger
     toggles rather than closing and re-opening */
  let downInside = false;
  document.addEventListener('pointerdown', e => {
    if (!cur) return;
    downInside = cur.el.contains(e.target);
    if (downInside) return;
    const tr = cur.spec.trigger;
    if (tr && tr.contains(e.target)) return;                // the trigger's own click decides
    if (cur.spec.keep && cur.spec.keep(e.target)) return;   // e.g. the rail control it edits
    close();
  }, true);

  const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  window.SHEET = {
    open, close,
    toggle(spec) { if (cur && cur.spec.id === spec.id) { close(); return null; } return open(spec); },
    isOpen(id) { return !!cur && (!id || cur.spec.id === id); },
    current() { return cur; },
    lede(text) { return mk('p', 'sheet-lede', text); },
    section(title) { const s = mk('div', 'sheet-sec'); if (title) s.appendChild(mk('div', 'sheet-h', title)); return s; },
    row(...els) { const r = mk('div', 'sheet-row'); els.forEach(e => r.appendChild(e)); return r; },
    btn(label, title, fn) { const b = mk('button', '', label); if (title) b.title = title; b.addEventListener('click', fn); return b; },
    status() { return mk('div', 'sheet-status'); }
  };
})();
