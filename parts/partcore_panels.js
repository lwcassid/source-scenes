/* ---------- PANELS — a sidebar panel API, offered for core ----------

   WHY THIS FILE HAS A FUNNY NAME. Every other part file is a scene or a
   module of ours. This one is a PROPOSAL: we think it belongs in core, owned
   by the library rather than by Edson's pack, so it is deliberately not
   numbered into our block. Move it wherever you like — nothing outside it
   depends on where it sits, only that it loads before the panels that
   register.

   THE PROBLEM IT REPLACES, honestly stated, because we wrote it:
   both of our sidebar panels found their insertion point like this —

       [...host.querySelectorAll('.sgroup')]
         .find(g => (g.querySelector('h5') || {}).textContent === 'Source input')

   — matching an ENGLISH HEADING against the DOM. Retitle that group and both
   panels silently render in the wrong place, or vanish. That is a booby trap
   we laid in your shell, and sending it to you as a complaint seemed worse
   than sending it as a fix.

   WHAT IT GIVES YOU, beyond not doing that:

   1. ONE ANCHOR, WITH A FALLBACK. `after` is a hint, not a requirement. If
      the anchor is missing the panel still mounts, at the end, instead of
      disappearing. A panel should never be able to lose itself.

   2. ONE TIMER INSTEAD OF N. Every panel used to run its own setInterval —
      120ms, 150ms, 200ms, 300ms, 80ms... Now there is a single loop and each
      panel declares the cadence it wants. It also stops when the tab is
      hidden, which none of ours did.

   3. THE HEADER ALWAYS FOLDS. A status label in an `h5` is a dead zone,
      because part5_tail's collapsible-groups code bails on
      `e.target !== h` — correct, since it keeps real controls in a header
      working, but it means a non-interactive label swallows the fold click.
      Ours was 91px wide, so half that header did nothing and looked broken.
      `status: true` builds the label with `pointer-events: none`, so the
      trap cannot be stepped in again by anyone.

   4. SHOW/HIDE THAT CANNOT CORRUPT A LAYOUT. Panels hide the GROUP, never
      their own children. Hiding a child with `display:'none'` and restoring
      it with `display:''` ERASES an inline `display:grid` or `display:flex`
      — we shipped that bug, and sixteen controls stacked into one column the
      moment a device connected. The group itself carries no inline display,
      so toggling it is always safe.

   5. A PANEL THAT THROWS IS ISOLATED. Three consecutive throws and that
      panel is disabled with a reason, instead of a repaint loop turning one
      bad frame into a console flood — which looks exactly like a freeze.

   THE SHAPE:

       PANELS.register({
         id:     'mix',            // unique; becomes <section id="mixGroup">
         title:  'Mix',            // the h5
         status: true,             // optional right-hand label, ctx.status
         after:  'Source input',   // a hint, matched on heading OR panel id
         every:  120,              // ms between paints (coalesced)
         build(ctx) {},            // once; ctx = {group, h5, status}
         paint(ctx) {},            // on the shared loop
         show(ctx) {}              // optional; false hides the whole group
         home: true                // optional; see 6
       });

   6. A PANEL CAN LIVE AT THE HOME TOO. The library has its own rail
      (#librail) and a scene has #sidebar, and core keeps SOURCE INPUT and
      SOUND OUT in both as two copies of the same markup. `home: true` does
      it with ONE element instead: the group is moved into whichever rail is
      on screen, right after its `after` anchor in that rail. Moving, not
      cloning, is the point — open selects, a half-typed field and the fold
      all survive the trip, and there is one set of listeners, not two.
      Edson, Sep 25, about the MIDI controller: "it should live in the home,
      like the source."

   Registering after load is fine — it mounts immediately. The one thing it
   cannot retrofit is part5_tail's fold binding, which runs once over the
   groups present at load; a panel registered later gets everything except
   remembered folding. Worth a hook if you ever adopt this.                */
(() => {
  if (typeof window === 'undefined' || window.PANELS) return;

  const panels = [];
  let started = false;

  /* A scene is open when the overlay is. Only a `home` panel ever asks. */
  function sceneOpen() {
    const o = document.getElementById('overlay');
    return !!o && getComputedStyle(o).display !== 'none';
  }
  function host(p) {
    if (p && p.home && !sceneOpen()) return document.getElementById('librail') || document.getElementById('sidebar');
    return document.getElementById('sidebar');
  }

  /* Find where to insert. `after` may name a panel we registered or the
     heading of one of theirs; both are hints, and a miss appends. */
  /* `after` may also be a LIST, tried in order — the two rails do not carry
     the same groups (the home has SOUND IN; a scene folds audio-in into its
     SOUND OUT), so one hint cannot name the right spot in both. */
  function anchorFor(after, h) {
    if (!h || !after) return null;
    for (const a of (Array.isArray(after) ? after : [after])) {
      const mine = panels.find(p => p.id === a && p.group);
      if (mine && mine.group.parentNode === h) return mine.group;
      const want = String(a).trim().toLowerCase();
      const g = [...h.querySelectorAll(':scope > .sgroup')]
        .find(x => ((x.querySelector('h5') || {}).firstChild || {}).textContent
          && x.querySelector('h5').firstChild.textContent.trim().toLowerCase() === want);
      if (g) return g;
    }
    return null;
  }

  // put the group after its anchor in rail `h`; a miss appends
  function place(p, h) {
    const anchor = anchorFor(p.after, h);
    if (anchor && anchor.parentNode === h) h.insertBefore(p.group, anchor.nextSibling);
    else h.appendChild(p.group);        // a panel never loses itself
    // the home rail's CONTROLS toggle folds every group marked railfold
    p.group.classList.toggle('railfold', h.id === 'librail');
  }

  function mount(p) {
    const h = host(p); if (!h || p.group) return;
    const group = document.createElement('section');
    group.className = 'sgroup';
    group.id = p.id + 'Group';

    const h5 = document.createElement('h5');
    h5.textContent = p.title || p.id;
    let status = null;
    if (p.status) {
      status = document.createElement('span');
      // the whole header must stay clickable — see note 3 above
      status.style.cssText = 'float:right;font-size:9px;letter-spacing:.1em;opacity:.55;pointer-events:none';
      h5.appendChild(status);
    }
    group.appendChild(h5);

    p.group = group; p.ctx = { group, h5, status, id: p.id };
    place(p, h);
    try { p.build && p.build(p.ctx); }
    catch (e) { p.dead = 'build: ' + e.message; group.remove(); p.group = null; }
  }

  function tick(now) {
    for (const p of panels) {
      if (p.dead) continue;
      if (!p.group) { mount(p); if (!p.group) continue; }
      // follow the view: checked every tick, so the move lands with the switch
      if (p.home) { const h = host(p); if (h && p.group.parentNode !== h) { place(p, h); p.last = 0; } }
      if (now - p.last < (p.every || 150)) continue;
      p.last = now;
      try {
        if (p.show) {
          const on = !!p.show(p.ctx);
          const want = on ? '' : 'none';
          if (p.group.style.display !== want) p.group.style.display = want;
          if (!on) continue;                       // a hidden panel is not painted
        }
        p.paint && p.paint(p.ctx);
        p.bad = 0;
      } catch (e) {
        // one bad frame is a frame; three in a row is a bug, and a repaint
        // loop that keeps throwing floods the console and reads as a freeze
        if (++p.bad >= 3) { p.dead = 'paint: ' + e.message; }
      }
    }
  }

  function start() {
    if (started) return; started = true;
    setInterval(() => {
      // a hidden tab has no panels to repaint
      if (typeof document !== 'undefined' && document.hidden) return;
      tick(Date.now());
    }, 50);
  }

  window.PANELS = {
    register(spec) {
      if (!spec || !spec.id) return null;
      if (panels.some(p => p.id === spec.id)) return null;      // idempotent
      const p = Object.assign({ last: 0, bad: 0, group: null, dead: null }, spec);
      panels.push(p);
      if (host(p)) mount(p);
      start();
      return p;
    },
    get(id) { return panels.find(p => p.id === id) || null; },
    // what is registered, and why anything stopped — for a console at 2am
    list() { return panels.map(p => ({ id: p.id, mounted: !!p.group, dead: p.dead, every: p.every || 150 })); }
  };
})();
