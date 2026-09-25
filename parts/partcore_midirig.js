/* ---------- MIDIRIG — controllers are modular, and per scene ----------

   Edson, Sep 25: "Let's make this MIDI already more modular. The nav is
   called MIDI Controller and it should be modular — we should be able to add
   more controllers in the future. For now an ADD button that only has the
   Fighter Twister, but already organised so other controllers can be added.
   Also each scene could have its own MIDI controller devices, so my Twister
   doesn't show up when I have not explicitly added it in a scene."

   THREE IDEAS, AND THEY ARE SEPARATE ON PURPOSE

   1. A DRIVER is the code that knows one piece of hardware. It registers
      itself and never touches the sidebar. `part253_twisterpanel.js` is the
      first one; a second controller is a new file that registers and nothing
      else changes.

   2. A RIG is which controllers a SCENE uses. It is the performer's choice,
      not a property of the scene's source — so nobody has to edit anyone's
      scene to use a controller with it, and a scene opened by someone who
      does not own a Twister shows no Twister. Kept per browser.

   3. THE PANEL just renders the rig. It knows nothing about any device.

   WHY THE RIG IS NOT A FIELD ON THE SCENE DEF. Making it `reg({midi: [...]})`
   would mean editing other people's scenes to play them with your own
   hardware, and would bake one person's desk into a shared library. The rig
   is about the room you are standing in, so it lives with the browser.

   SCOPES. A controller is added to THIS SCENE, or to ALL SCENES. Most of
   Edson's set wants the Twister everywhere; a study does not want it at all.
   The effective rig is the union, so "everywhere" is a default and a scene
   can still add something of its own on top.

   A DRIVER IS BUILT ONCE PER PAGE, NOT PER SCENE. Its container is created
   the first time it is needed and then attached to or detached from the DOM
   as scenes change. That matters: the Twister's panel holds sixteen slots of
   state, a learned mapping and a light cache, and rebuilding it on every
   scene change would throw all of that away and re-send 48 LED messages.

   DRIVER SHAPE:

       MIDIRIG.registerDriver({
         id:    'twister',
         name:  'Midi Fighter Twister',
         blurb: 'one line for the ADD list',
         build(ctx) {},            // once; ctx = {group, status, id}
         paint(ctx) {},            // while attached to the open scene
         active(on) {}             // optional: told when it goes in or out of use
       });

   A driver asks `MIDIRIG.isActive('twister')` before acting on MIDI, so a
   controller that is not in the open scene's rig is deaf and dark.          */
(() => {
  if (typeof window === 'undefined' || window.MIDIRIG) return;

  const KEY = 'srcMidiRig', ALL = '*';
  const drivers = [];
  let rigs = {};
  try { rigs = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { rigs = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(rigs)); } catch (e) {} };

  // the open scene's FAMILY, so a rig follows a scene across its versions
  function sceneKey() {
    try {
      if (typeof focus === 'undefined' || focus.idx < 0) return '';
      return String(PIECES[focus.idx].id).split('.')[0];
    } catch (e) { return ''; }
  }

  const list = k => (k && Array.isArray(rigs[k])) ? rigs[k] : [];
  function effective() {
    const k = sceneKey();
    const out = list(ALL).slice();
    for (const id of list(k)) if (out.indexOf(id) < 0) out.push(id);
    return out.filter(id => drivers.some(d => d.id === id));
  }

  function add(id, scope) {
    const k = scope === ALL ? ALL : sceneKey();
    if (!k && scope !== ALL) return false;        // no scene open: only "everywhere"
    if (!rigs[k]) rigs[k] = [];
    if (rigs[k].indexOf(id) < 0) rigs[k].push(id);
    save(); return true;
  }
  function remove(id) {
    // take it out of whichever scope is providing it, so one × always works
    for (const k of [sceneKey(), ALL]) {
      if (!k || !rigs[k]) continue;
      const i = rigs[k].indexOf(id);
      if (i >= 0) { rigs[k].splice(i, 1); if (!rigs[k].length) delete rigs[k]; }
    }
    save();
  }

  window.MIDIRIG = {
    ALL,
    registerDriver(spec) {
      if (!spec || !spec.id || drivers.some(d => d.id === spec.id)) return null;
      drivers.push(Object.assign({ built: false, wrap: null, ctx: null, on: false }, spec));
      return spec.id;
    },
    drivers() { return drivers.map(d => ({ id: d.id, name: d.name, blurb: d.blurb })); },
    sceneKey, add, remove,
    rig() { return effective(); },
    isActive(id) { return effective().indexOf(id) >= 0; },
    scopeOf(id) {
      if (list(ALL).indexOf(id) >= 0) return ALL;
      return list(sceneKey()).indexOf(id) >= 0 ? sceneKey() : null;
    }
  };

  /* ---------------- the panel ---------------- */
  let body = null, addWrap = null, addBtn = null, emptyEl = null, lastSig = '';

  function driverWrap(d, parent) {
    if (!d.wrap) {
      const w = document.createElement('div');
      w.id = 'drv-' + d.id;          // addressable, for a console and for tests
      w.style.cssText = 'border-top:1px solid var(--line2);margin:6px 0 0;padding:6px 0 0';

      const head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:center;gap:6px;margin:0 0 4px';
      const nm = document.createElement('span');
      nm.textContent = d.name || d.id;
      nm.style.cssText = 'flex:1;min-width:0;font-size:10px;letter-spacing:.08em;color:var(--acc);overflow:hidden;text-overflow:ellipsis';
      const st = document.createElement('span');
      st.id = 'drvstat-' + d.id;     // the driver's own status line, addressable
      st.style.cssText = 'font-size:9px;opacity:.55';
      const x = document.createElement('button');
      x.textContent = '×';
      x.title = 'remove this controller';
      x.style.cssText = 'padding:0 6px;font-size:11px;line-height:1.3';
      x.addEventListener('click', () => { MIDIRIG.remove(d.id); lastSig = ''; });
      head.append(nm, st, x);
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
      catch (e) { d.dead = 'build: ' + e.message; d.wrap.remove(); }
    }
  }

  function buildAddMenu() {
    addWrap.textContent = '';
    const have = effective();
    const free = drivers.filter(d => have.indexOf(d.id) < 0 && !d.dead);
    if (!free.length) {
      const p = document.createElement('p');
      p.className = 'sinfo';
      p.textContent = 'every controller this build knows about is already in this scene.';
      addWrap.appendChild(p);
      return;
    }
    for (const d of free) {
      const row = document.createElement('div');
      row.className = 'srow';
      row.style.cssText = 'display:flex;gap:4px;margin-top:4px';
      const here = document.createElement('button');
      here.textContent = d.name || d.id;
      here.style.cssText = 'flex:1;min-width:0';
      here.title = (d.blurb || '') + ' — add to THIS scene';
      here.addEventListener('click', () => { MIDIRIG.add(d.id); addWrap.style.display = 'none'; lastSig = ''; });
      const all = document.createElement('button');
      all.textContent = 'ALL';
      all.title = 'add to every scene — a default you can still remove per scene';
      all.addEventListener('click', () => { MIDIRIG.add(d.id, ALL); addWrap.style.display = 'none'; lastSig = ''; });
      row.append(here, all);
      addWrap.appendChild(row);
    }
  }

  function build(ctx) {
    body = document.createElement('div');
    ctx.group.appendChild(body);

    emptyEl = document.createElement('p');
    emptyEl.className = 'sinfo';
    emptyEl.textContent = 'No controller in this scene. ADD one, and it stays with this scene '
                        + 'until you remove it — so a scene you never added it to will not show it.';
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
      if (addWrap.style.display !== 'none') buildAddMenu();
      const k = sceneKey();
      ctx.status.textContent = have.length
        ? have.length + (k ? '' : ' · ALL')
        : (k ? 'NONE' : 'NO SCENE');
    }
    for (const d of drivers) {
      if (!d.on || d.dead) continue;
      try { d.paint && d.paint(d.ctx); }
      catch (e) {
        d.bad = (d.bad || 0) + 1;
        // one bad frame is a frame; three in a row is a bug, and a driver that
        // throws every paint would flood the console and read as a freeze
        if (d.bad >= 3) { d.dead = 'paint: ' + e.message; if (d.wrap) d.wrap.remove(); d.on = false; }
      }
    }
  }

  // below SOUND OUT, where the other hardware lives — Edson, Sep 25
  function mount() {
    if (typeof PANELS === 'undefined') return;
    PANELS.register({
      id: 'midi', title: 'MIDI Controller', status: true,
      after: 'Sound out', every: 150, build, paint
    });
  }
  if (typeof PANELS !== 'undefined') mount();
  else if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', mount);
})();
