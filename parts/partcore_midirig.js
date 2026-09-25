/* ---------- MIDIRIG — the controllers on the desk, and what each scene does with them ----------

   Edson, Sep 25: "Let's make this MIDI already more modular. The nav is
   called MIDI Controller and it should be modular — we should be able to add
   more controllers in the future."

   And then, the same day, seeing it: "it should live in the home, like the
   source. And each scene can map it or not." So the first version had it
   upside down — the DEVICE was chosen per scene and its MAP was one for the
   whole library. It is now the other way round:

   1. A DRIVER is the code that knows one piece of hardware. It registers
      itself and never touches the sidebar. `part253_twisterpanel.js` is the
      first one; a second controller is a new file that registers and nothing
      else changes.

   2. THE DESK is which controllers are plugged in to THIS browser. It is set
      once, from the home, like SOURCE INPUT, and it is the same in every
      scene — the hardware does not change when the scene does. Kept per
      browser, because it is about the room, not the library: a scene opened
      by someone without a Twister shows no Twister.

   3. THE MAP is per scene and belongs to the DRIVER, because only the driver
      knows what a mapping means for its hardware. A scene nobody has mapped
      leaves the controller DARK AND DEAF — Edson's call, Sep 25: nothing moves
      that you did not ask for. Mapping is one tap from inside the scene.

   4. THE PANEL just renders the desk. It knows nothing about any device.

   WHY NEITHER IS A FIELD ON THE SCENE DEF. `reg({midi: [...]})` would mean
   editing other people's scenes to play them with your own hardware, and
   would bake one person's desk into a shared library.

   A DRIVER IS BUILT ONCE PER PAGE, NOT PER SCENE. Its panel holds state, a
   light cache and open selects; rebuilding it on every scene change would
   throw that away. It repaints for the new scene instead.

   DRIVER SHAPE:

       MIDIRIG.registerDriver({
         id:    'twister',
         name:  'Midi Fighter Twister',
         blurb: 'one line for the ADD list',
         build(ctx) {},            // once; ctx = {group, status, id}
         paint(ctx) {},            // while it is on the desk — home or scene;
                                   // MIDIRIG.sceneKey() is '' at home
         active(on) {}             // optional: told when it is added or removed
       });

   A driver asks `MIDIRIG.isActive('twister')` before acting on MIDI, so a
   controller that is not on the desk is deaf and dark everywhere.           */
(() => {
  if (typeof window === 'undefined' || window.MIDIRIG) return;

  const KEY = 'srcMidiDesk', OLD = 'srcMidiRig';
  const drivers = [];
  let desk = null;
  try { desk = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { desk = null; }
  /* FROM THE PER-SCENE RIG. Anything that was in any scene's rig, or in ALL,
     was a controller on the desk. Read once; the old key is left in place for
     the driver, which needs it to know which scenes had a map. */
  if (!Array.isArray(desk)) {
    desk = [];
    try {
      const old = JSON.parse(localStorage.getItem(OLD) || '{}') || {};
      for (const k in old) for (const id of (old[k] || [])) if (desk.indexOf(id) < 0) desk.push(id);
    } catch (e) {}
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(desk)); } catch (e) {} };
  save();

  // the open scene's FAMILY, so a map follows a scene across its versions.
  // '' at the home, with no scene open.
  function sceneKey() {
    try {
      if (typeof focus === 'undefined' || focus.idx < 0) return '';
      return String(PIECES[focus.idx].id).split('.')[0];
    } catch (e) { return ''; }
  }

  const effective = () => desk.filter(id => drivers.some(d => d.id === id));

  window.MIDIRIG = {
    registerDriver(spec) {
      if (!spec || !spec.id || drivers.some(d => d.id === spec.id)) return null;
      drivers.push(Object.assign({ built: false, wrap: null, ctx: null, on: false }, spec));
      return spec.id;
    },
    drivers() { return drivers.map(d => ({ id: d.id, name: d.name, blurb: d.blurb })); },
    sceneKey,
    add(id) { if (desk.indexOf(id) < 0) { desk.push(id); save(); } return true; },
    remove(id) { const i = desk.indexOf(id); if (i >= 0) { desk.splice(i, 1); save(); } },
    rig() { return effective(); },
    isActive(id) { return effective().indexOf(id) >= 0; }
  };

  /* ---------------- the panel ---------------- */
  let body = null, addWrap = null, addBtn = null, emptyEl = null, lastSig = '';

  function driverWrap(d, parent) {
    if (!d.wrap) {
      const w = document.createElement('div');
      w.id = 'drv-' + d.id;          // addressable, for a console and for tests
      // a rule only BETWEEN controllers; the first sits straight under the heading
      w.style.cssText = 'margin:2px 0 0;padding:0';
      if (parent.querySelector('[id^="drv-"]')) w.style.cssText += ';border-top:1px solid var(--line2);margin-top:10px;padding-top:10px';

      const head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:baseline;gap:6px;margin:4px 0 18px';
      const nm = document.createElement('span');
      nm.textContent = d.name || d.id;
      nm.style.cssText = 'flex:1;min-width:0;font-size:10px;letter-spacing:.08em;color:var(--acc);overflow:hidden;text-overflow:ellipsis';
      const st = document.createElement('span');
      st.id = 'drvstat-' + d.id;     // the driver's own status line, addressable
      st.style.cssText = 'flex:none;white-space:nowrap;font-size:9px;opacity:.55';
      /* NO REMOVE BUTTON HERE. Edson, Sep 25: "take out the x button …
         put it inside map, in the device section." Taking a controller off
         the desk is a setup act, not something to sit one click from a
         performer's hand — each driver offers it in its own settings, by
         calling MIDIRIG.remove(id). */
      head.append(nm, st);
      w.appendChild(head);

      const inner = document.createElement('div');
      // the driver's OWN content, separate from the header MIDIRIG owns — so
      // anything walking a driver's controls cannot reach the remove button
      inner.id = 'drvbody-' + d.id;
      w.appendChild(inner);
      d.wrap = w; d.ctx = { group: inner, status: st, id: d.id };
    }
    if (d.wrap.parentNode !== parent) parent.appendChild(d.wrap);
    if (!d.built) {
      d.built = true;
      try { d.build && d.build(d.ctx); }
      catch (e) { d.dead = 'build: ' + e.message; d.wrap.remove(); try { console.error('MIDIRIG ' + d.id + ' ' + d.dead); } catch (_) {} }
    }
  }

  function buildAddMenu() {
    addWrap.textContent = '';
    const have = effective();
    const free = drivers.filter(d => have.indexOf(d.id) < 0 && !d.dead);
    if (!free.length) {
      const p = document.createElement('p');
      p.className = 'sinfo';
      p.textContent = 'every controller this build knows about is already on the desk.';
      addWrap.appendChild(p);
      return;
    }
    for (const d of free) {
      const row = document.createElement('div');
      row.className = 'srow';
      row.style.cssText = 'display:flex;gap:4px;margin-top:4px';
      const b = document.createElement('button');
      b.textContent = d.name || d.id;
      b.style.cssText = 'flex:1;min-width:0';
      b.title = (d.blurb || '') + ' — every scene can then map it, or leave it dark';
      b.addEventListener('click', () => { MIDIRIG.add(d.id); addWrap.style.display = 'none'; lastSig = ''; });
      row.appendChild(b);
      addWrap.appendChild(row);
    }
  }

  function build(ctx) {
    body = document.createElement('div');
    ctx.group.appendChild(body);

    emptyEl = document.createElement('p');
    emptyEl.className = 'sinfo';
    emptyEl.textContent = 'No controller on the desk. ADD the one you have plugged in — it stays '
                        + 'here for every scene, and each scene maps it or leaves it dark.';
    ctx.group.appendChild(emptyEl);

    const row = document.createElement('div');
    row.className = 'srow';
    addBtn = document.createElement('button');
    addBtn.textContent = '+ ADD CONTROLLER';
    addBtn.style.cssText = 'flex:1;min-width:0';
    addBtn.addEventListener('click', () => {
      const open = addWrap.style.display === 'none';
      if (open) buildAddMenu();
      addWrap.style.display = open ? '' : 'none';
    });
    row.appendChild(addBtn);
    ctx.group.appendChild(row);

    addWrap = document.createElement('div');
    addWrap.style.display = 'none';
    ctx.group.appendChild(addWrap);
  }

  function paint(ctx) {
    const have = effective();
    const sig = sceneKey() + '|' + have.join(',');
    if (sig !== lastSig) {
      lastSig = sig;
      for (const d of drivers) {
        const want = have.indexOf(d.id) >= 0 && !d.dead;
        if (want) driverWrap(d, body);
        else if (d.wrap && d.wrap.parentNode) d.wrap.remove();
        if (d.on !== want) { d.on = want; try { d.active && d.active(want); } catch (e) {} }
      }
      emptyEl.style.display = have.length ? 'none' : '';
      // nothing left to add: the button would only open an apology
      const spare = drivers.some(d => have.indexOf(d.id) < 0 && !d.dead);
      addBtn.parentNode.style.display = spare ? '' : 'none';
      if (!spare) addWrap.style.display = 'none';
      if (addWrap.style.display !== 'none') buildAddMenu();
      // each controller says its own state in its own header; a bare count said nothing
      ctx.status.textContent = have.length ? '' : 'NONE';
    }
    for (const d of drivers) {
      if (!d.on || d.dead) continue;
      // a good frame clears the count: "three in a row" means in a row, not
      // three stray errors across a whole night of performing
      try { d.paint && d.paint(d.ctx); d.bad = 0; }
      catch (e) {
        d.bad = (d.bad || 0) + 1;
        // one bad frame is a frame; three in a row is a bug, and a driver that
        // throws every paint would flood the console and read as a freeze
        if (d.bad >= 3) {
          d.dead = 'paint: ' + e.message; if (d.wrap) d.wrap.remove(); d.on = false;
          // a driver that retires itself says why, once — silently vanishing
          // from the panel is indistinguishable from never having been added
          try { console.error('MIDIRIG ' + d.id + ' ' + d.dead); } catch (_) {}
        }
      }
    }
  }

  // below SOUND IN (Edson, Sep 25) — in a scene, audio-in lives inside SOUND
  // OUT, so that is the same spot there. At the home as well as in a scene:
  // the desk is the same in both.
  function mount() {
    if (typeof PANELS === 'undefined') return;
    PANELS.register({
      id: 'midi', title: 'MIDI Controller', status: true,
      after: ['Sound in', 'Sound out'], every: 150, home: true, build, paint
    });
  }
  if (typeof PANELS !== 'undefined') mount();
  else if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', mount);
})();
