/* ---------- THE MIX PANEL ----------
   The faders, on screen. The mixer is unplayable without them: until now the
   only way to move a layer was the console or a number key, and neither is a
   thing you reach for in a dark room with both hands in the air.

   WHERE IT SITS, AND WHY. Injected into the sidebar directly after SOURCE
   INPUT — with the CONTROLS, not down at THIS SCENE with the reading matter.
   Their shell law: "INFORMATION lives in that column too, NEXT TO WHAT IT
   DESCRIBES." A fader is not information about the scene, it is a thing you
   play, and in performance you reach for SOURCE INPUT and the faders
   together and never for the description.

   HOW IT AVOIDS TOUCHING ANYTHING. part1_head.html leaves a <script> open, so
   the DOM already exists when this runs; and part5_tail.js — which binds the
   fold-and-remember behaviour to every .sgroup — concatenates AFTER us. So we
   inject at load and inherit folding, persistence and every existing style
   for free, with zero edits to any file of theirs.

   It shows only while a mixer is open, and repaints with textContent and
   style writes only — never innerHTML. Rebuilding DOM at frame rate is what
   made their own SHOW CHECK buttons flicker, and they wrote that down. */
(() => {
  const ROWS = [];
  let group = null, instRow = null, title = null, loadEl = null, built = false;

  function build(ctx) {
    if (built) return; built = true;
    // the <section>, the h5, the status label and finding where in the
    // sidebar this goes are all PANELS' job now — parts/partcore_panels.js
    group = ctx.group; title = ctx.status;

    // one row per layer: name · level · fader · solo
    for (let i = 0; i < 6; i++) {
      const row = document.createElement('div');
      row.className = 'srow';
      row.style.display = 'none';

      const nm = document.createElement('span');
      nm.style.cssText = 'flex:0 0 74px;font-size:9.5px;letter-spacing:.1em;white-space:nowrap;overflow:hidden';

      const sl = document.createElement('input');
      sl.type = 'range'; sl.min = '0'; sl.max = '1'; sl.step = '0.01'; sl.value = '0';
      sl.title = 'How much of this layer is on the wall';
      sl.addEventListener('input', () => { if (window.MIX) MIX.set(i, +sl.value); });

      const val = document.createElement('span');
      val.style.cssText = 'flex:0 0 26px;text-align:right;font-size:9.5px;opacity:.7';

      const so = document.createElement('button');
      so.textContent = 'S'; so.style.cssText = 'flex:0 0 22px;padding:5px 0;text-align:center';
      so.title = 'Solo this layer (number keys do the same)';
      so.addEventListener('click', () => { if (window.MIX) MIX.solo(i); });

      row.append(nm, sl, val, so);
      group.appendChild(row);
      ROWS.push({ row, nm, sl, val, so });
    }

    // THE INSTRUMENT — everything this machine makes, under one level, so a
    // solo or a full step-out is one reach and not six.
    const ir = document.createElement('div');
    ir.className = 'srow';
    ir.style.marginTop = '10px';
    const inm = document.createElement('span');
    inm.textContent = 'INSTRUMENT';
    inm.style.cssText = 'flex:0 0 74px;font-size:9.5px;letter-spacing:.1em;color:var(--acc)';
    const isl = document.createElement('input');
    isl.type = 'range'; isl.min = '0'; isl.max = '1'; isl.step = '0.01'; isl.value = '1';
    isl.title = 'Your whole output — pull it out and the room is the band';
    isl.addEventListener('input', () => { if (window.MIX) MIX.instrument(+isl.value); });
    const ival = document.createElement('span');
    ival.style.cssText = 'flex:0 0 26px;text-align:right;font-size:9.5px;opacity:.7';
    ir.append(inm, isl, ival);
    group.appendChild(ir);
    instRow = { sl: isl, val: ival };

    const info = document.createElement('p');
    info.className = 'sinfo';
    info.textContent = 'a layer under 1% stops rendering and falls silent · number keys solo · 0 clears · − + trim the instrument';
    group.appendChild(info);

    loadEl = document.createElement('p');
    loadEl.className = 'sinfo';
    loadEl.style.opacity = '.55';
    group.appendChild(loadEl);

  }

  /* textContent and style only — never innerHTML, and never rebuild a row.
     Sliders are left alone while they have focus, or a drag gets stamped on
     mid-gesture (the same trap their display picker documents). */
  function paint() {
    if (!built) return;
    const st = (window.MIX && MIX.state) ? MIX.state() : null;
    if (!st) return;                       // show() has already hidden us
    if (title.textContent !== st.id) title.textContent = st.id;

    const focused = document.activeElement;
    for (let i = 0; i < ROWS.length; i++) {
      const R = ROWS[i], on = i < st.layers.length;
      const want = on ? '' : 'none';
      if (R.row.style.display !== want) R.row.style.display = want;
      if (!on) continue;
      if (R.nm.textContent !== st.layers[i]) R.nm.textContent = st.layers[i];
      if (focused !== R.sl) {
        const v = String(st.want[i]);
        if (R.sl.value !== v) R.sl.value = v;
      }
      const pct = Math.round(st.fade[i] * 100) + '';
      if (R.val.textContent !== pct) R.val.textContent = pct;
      // dim a layer the budget has stood down, so a fader that is up but not
      // on the wall never looks like a lie
      const cut = st.want[i] > 0.02 && st.live.indexOf(i) < 0;
      const op = cut ? '0.4' : '1';
      if (R.row.style.opacity !== op) R.row.style.opacity = op;
      R.so.classList.toggle('on', st.solo === i);
    }
    if (focused !== instRow.sl) {
      const v = String(st.inst);
      if (instRow.sl.value !== v) instRow.sl.value = v;
    }
    const ip = Math.round(st.inst * 100) + '';
    if (instRow.val.textContent !== ip) instRow.val.textContent = ip;
    const txt = 'load ' + st.load + (st.solo >= 0 ? '  ·  SOLO ' + st.layers[st.solo] : '');
    if (loadEl.textContent !== txt) loadEl.textContent = txt;
  }

  PANELS.register({
    id: 'mix', title: 'Mix', status: true, after: 'Source input', every: 120,
    build, paint,
    // PANELS owns showing and hiding, so paint() never touches display and a
    // hidden panel is not painted at all
    show: () => !!(window.MIX && MIX.state && MIX.state())
  });
})();
