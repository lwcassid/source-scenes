/* ---------- #set=MINE — Edson's own scenes, newest first ----------
   Edson, Sep 25: "Is there a short URL that shows only the visuals I have
   created, in reverse order of creation, so I always see the last scene I did?"

   Yes:  index.html#set=MINE

   HOW IT WORKS, AND WHY IT IS NOT A LIST. `#set=NAME` already does exactly the
   right thing — part5_tail's QUEUE.boot() looks the name up in SETLISTS, sets
   libFilter to 'queue' and shows those scenes, in that order, on the home
   view. The only question was where the list comes from.

   A hand-written list in setlists.json would be stale the moment either
   session adds a scene, and the whole point is that the newest work is the
   first thing on screen. So this set's `scenes` is a GETTER: it is computed
   from the live PIECES registry at the instant the link is opened. Add a
   scene, reload, it is at the top. Nothing to maintain, and nothing to
   remember to run.

   `SETLISTS` is a const BINDING, not a frozen object, so pushing a set into
   `SETLISTS.sets` is allowed and touches no file of theirs. We run before
   part5_tail concatenates, and `sets()` reads `SETLISTS.sets` at call time —
   so by the time the boot code looks, we are in the list.

   WHAT COUNTS AS MINE: every scene from SRC-56 up. Lance, Nima and Kasia's
   work is SRC-55 and below; everything above it came out of one of Edson's
   sessions — the Birth of a Temple set, the L-Flower and ISOTRP studies, and
   The Circle. One number to change if that ever stops being true.

   ORDER IS REGISTRATION ORDER, REVERSED — not id order. The ids were not
   issued strictly in sequence (SRC-66.2 was built after SRC-69), but
   tools/build.sh concatenates part files in creation order, so the registry
   is the honest record of what was made when. */
(() => {
  const FIRST_MINE = 56;          // SRC-55 and below belongs to the group
  const NAME = 'MINE';

  function isMine(p) {
    if (!p || typeof p.id !== 'string' || p.id.indexOf('SRC-') !== 0) return false;
    const n = parseFloat(p.id.slice(4));
    return isFinite(n) && n >= FIRST_MINE;
  }

  try {
    if (typeof SETLISTS === 'undefined' || !SETLISTS || !Array.isArray(SETLISTS.sets)) return;
    if (SETLISTS.sets.some(s => s && s.name === NAME)) return;    // idempotent

    const set = { name: NAME, note: 'Everything Edson has made, newest first. Computed, never edited.' };
    Object.defineProperty(set, 'scenes', {
      enumerable: true,
      get() {
        if (typeof PIECES === 'undefined') return [];
        const out = [];
        // walk the registry backwards: the last thing registered is the last
        // thing built, and that is what should be on screen first
        for (let i = PIECES.length - 1; i >= 0; i--) if (isMine(PIECES[i])) out.push(PIECES[i].id);
        return out;
      }
    });
    SETLISTS.sets.push(set);

    /* ---- NEWEST FIRST, which the library cannot do on its own ----
       The sort dropdown offers most-worked-on, SRC number, title and version
       count. SRC number is ASCENDING, so the newest scene lands at the BOTTOM
       — the opposite of the point. Adding a fifth option would mean editing
       part1_head.html, which is theirs and which we do not touch.

       So we set the flex order ourselves, and only while this set is the one
       on screen. It is done on a slow interval rather than by wrapping
       applyLibrary() because several of their listeners hold a DIRECT
       reference to that function (`addEventListener('change', applyLibrary)`),
       captured before we could wrap it — a wrapper would be bypassed by
       exactly the sort-dropdown change it most needs to survive. An interval
       is self-healing whatever re-sorts the grid and whoever called it.

       Versions collapse into one tile per family, so a family ranks by its
       NEWEST member: SRC-66.3 built after SRC-69 puts the whole SRC-66 family
       above it, which is the honest answer to "what did I work on last". */
    const famOfId = id => id.split('.')[0];
    let lastKey = '';
    setInterval(() => {
      try {
        if (typeof QUEUE === 'undefined' || !QUEUE.shared || typeof grid === 'undefined') return;
        const ids = set.scenes;
        if (!ids.length || QUEUE.shared.length !== ids.length || QUEUE.shared[0] !== ids[0]) return;
        const key = ids[0] + '/' + ids.length;
        const rank = new Map();
        for (let i = 0; i < ids.length; i++) {
          const f = famOfId(ids[i]);
          if (!rank.has(f)) rank.set(f, i);      // first sighting = newest
        }
        for (const tile of grid.children) {
          const r = rank.get(famOfId(tile.dataset.pid || ''));
          if (r === undefined) continue;
          const o = String(r - 1000);            // below every untouched tile
          if (tile.style.order !== o) tile.style.order = o;
        }
        lastKey = key;
      } catch (e) {}
    }, 300);
  } catch (e) { /* a set that cannot be built must never take the app down */ }
})();
