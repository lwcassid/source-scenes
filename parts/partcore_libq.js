/* ---------- LIBQ — library filtering from the URL, offered for core ----------

   Edson, Sep 25: "Instead of pushing this `#set=MINE`, which is a hack, let's
   build a proper way to send URL parameters that would help anyone filter for
   anything. We don't need a UI for now."

   WHAT THIS REPLACES, and why it was a hack. To get "only my scenes, newest
   first" we had pushed a fake setlist into `SETLISTS` and then fought the
   grid's sort on a 300ms interval, because none of the four sort options can
   express "newest". It worked, and it was two wrongs: it abused a feature
   meant for running orders, and it polled. Deleted.

   WHAT THIS IS INSTEAD. A query string in the hash, read once, applied on the
   same events the library already reacts to. It is general — nothing in it
   knows who Edson is:

       #lib?src=56-&sort=new          everything from SRC-56 up, newest first
       #lib?tag=webgl&sort=new        every WebGL scene, newest first
       #lib?tag=bokeh,webgl&match=all both tags, not either
       #lib?text=circle               title/tech/tags/desc, same haystack as the search box
       #lib?id=SRC-71,SRC-64          exactly these
       #lib?src=56-71&sort=title&limit=12

   KEYS
     src    a number or a range — `71`, `56-`, `-40`, `56-71`
     tag    comma list, matched against the scene's own `tags`
     match  `any` (default) or `all`, for `tag`
     text   substring over family + title + tech + tags + desc
     id     comma list of scene or family ids
     sort   `new` · `old` · `id` · `title`    (`new` = most recently BUILT)
     limit  keep at most N tiles

   THREE THINGS THAT MAKE IT COMPOSE INSTEAD OF FIGHT

   1. IT ONLY EVER HIDES MORE. It runs after the library's own pass and never
      un-hides a tile the search box or the IN QUEUE chip has hidden. So a URL
      filter and a typed search AND together, which is what anyone would
      expect, and neither has to know about the other.

   2. IT IS EVENT-DRIVEN, NOT POLLED. We add our own listeners to the same
      three controls the library uses — the search box, the sort select and
      the filter chips — so ours run straight after theirs. No interval, no
      wrapping of `applyLibrary` (several of your listeners hold a direct
      reference to that function, captured at load, so a wrapper would be
      bypassed by exactly the sort change it most needs to survive).

   3. `sort` IS OPTIONAL. Without it the grid keeps whatever order the sort
      dropdown says. We only take the order when the URL actually asked for one.

   `new` IS REGISTRATION ORDER, NOT ID ORDER. `tools/build.sh` concatenates
   part files in the order they were written, so the registry is the honest
   record of what was made when — SRC-66.3 was built after SRC-69, and sorting
   by number would put it in the wrong place.

   OFFERED FOR CORE. Deliberately named off our numbering: we think URL
   filtering belongs to the library, not to one person's scene pack. It adds
   one global, reads one hash prefix nothing else uses, and does nothing at
   all unless the URL asks.                                                */
(() => {
  if (typeof window === 'undefined' || window.LIBQ) return;

  const PREFIX = '#lib?';
  const famOf = id => String(id || '').split('.')[0];

  function parse(hash) {
    const h = hash || (typeof location !== 'undefined' ? location.hash : '');
    if (!h || h.indexOf(PREFIX) !== 0) return null;
    const p = new URLSearchParams(h.slice(PREFIX.length));
    const q = {};
    if (p.has('src')) q.src = p.get('src').trim();
    if (p.has('tag')) q.tag = p.get('tag').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    if (p.has('match')) q.match = p.get('match').toLowerCase() === 'all' ? 'all' : 'any';
    if (p.has('text')) q.text = p.get('text').trim().toLowerCase();
    if (p.has('id')) q.id = p.get('id').split(',').map(s => s.trim()).filter(Boolean);
    if (p.has('sort')) q.sort = p.get('sort').trim().toLowerCase();
    if (p.has('limit')) q.limit = Math.max(0, parseInt(p.get('limit'), 10) || 0);
    return Object.keys(q).length ? q : null;
  }

  // `56-` / `-40` / `56-71` / `71`
  function inSrc(n, spec) {
    if (!isFinite(n)) return false;
    const m = /^(\d+(?:\.\d+)?)?\s*-\s*(\d+(?:\.\d+)?)?$/.exec(spec);
    if (!m) { const one = parseFloat(spec); return isFinite(one) ? n === one : true; }
    const lo = m[1] === undefined ? -Infinity : parseFloat(m[1]);
    const hi = m[2] === undefined ? Infinity : parseFloat(m[2]);
    return n >= lo && n <= hi;
  }

  // every def that belongs to a family, so tags/text see all its versions
  function defsByFam() {
    const m = new Map();
    if (typeof PIECES === 'undefined') return m;
    for (const d of PIECES) {
      const f = famOf(d.id);
      if (!m.has(f)) m.set(f, []);
      m.get(f).push(d);
    }
    return m;
  }

  function test(fam, defs, haystack, q) {
    if (q.id && !q.id.some(x => x === fam || (defs || []).some(d => d.id === x))) return false;
    if (q.src !== undefined && !inSrc(parseFloat(String(fam).replace(/^\D+/, '')), q.src)) return false;
    if (q.text && !(haystack || '').includes(q.text)) return false;
    if (q.tag && q.tag.length) {
      const tags = new Set();
      for (const d of defs || []) for (const t of (d.tags || [])) tags.add(String(t).toLowerCase());
      const hit = t => [...tags].some(x => x.includes(t));
      if (!(q.match === 'all' ? q.tag.every(hit) : q.tag.some(hit))) return false;
    }
    return true;
  }

  function apply() {
    const q = parse();
    if (!q || typeof grid === 'undefined' || !grid) return;
    const byFam = defsByFam();

    // registration order = build order. Index once; a family ranks by its
    // NEWEST member, which is what "what did I work on last" actually means.
    const newest = new Map();
    if (typeof PIECES !== 'undefined') {
      PIECES.forEach((d, i) => { const f = famOf(d.id); if (!newest.has(f) || i > newest.get(f)) newest.set(f, i); });
    }

    const keep = [];
    for (const tile of grid.children) {
      const fam = tile.dataset.pid || '';
      // NEVER un-hide: the search box and the chips had their say first
      if (tile.style.display === 'none') continue;
      if (!test(fam, byFam.get(fam), tile.dataset.search, q)) { tile.style.display = 'none'; continue; }
      keep.push(tile);
    }

    let ordered = keep;
    if (q.sort) {
      const rank = t => {
        const fam = t.dataset.pid || '';
        if (q.sort === 'id') return parseFloat(String(fam).replace(/^\D+/, '')) || 0;
        if (q.sort === 'title') return 0;                       // resolved below
        const i = newest.has(fam) ? newest.get(fam) : -1;
        return q.sort === 'old' ? i : -i;                       // `new` = newest first
      };
      ordered = keep.slice();
      if (q.sort === 'title') {
        ordered.sort((a, b) => (a.querySelector('h3') || {}).textContent
          .localeCompare((b.querySelector('h3') || {}).textContent));
      } else {
        ordered.sort((a, b) => rank(a) - rank(b));
      }
      ordered.forEach((t, i) => { const o = String(i - 10000); if (t.style.order !== o) t.style.order = o; });
    }

    // limit keeps the first N IN THE ORDER ASKED FOR, not in document order —
    // `sort=new&limit=3` must be the three newest, which it was not at first
    if (q.limit) ordered.slice(q.limit).forEach(t => { t.style.display = 'none'; });

    const n = [...grid.children].filter(t => t.style.display !== 'none').length;
    const el = document.getElementById('libCount');
    if (el) el.textContent = n + ' scenes';
  }

  window.LIBQ = { parse, test, apply, PREFIX };

  function hook() {
    // our listeners are added AFTER theirs on the same controls, so they run
    // straight after the library's own pass — no polling, no wrapping
    const on = (id, ev) => { const e = document.getElementById(id); if (e) e.addEventListener(ev, () => setTimeout(apply, 0)); };
    on('searchBox', 'input');
    on('sortSel', 'change');
    document.querySelectorAll('.fchip').forEach(c => c.addEventListener('click', () => setTimeout(apply, 0)));
    /* CHANGING THE QUERY MUST WIDEN AS WELL AS NARROW. Our pass only ever
       hides, which is right when it runs after the library's own pass — but
       edit the URL in the address bar and the grid would shrink monotonically,
       never recovering the tiles the previous query hid. So a hash change
       asks the library to redo its pass first (which resets every tile's
       display from the search box and the chips) and only then narrows.
       Calling applyLibrary() is not wrapping it; their listeners keep the
       reference they already had. */
    window.addEventListener('hashchange', () => setTimeout(() => {
      try { if (typeof applyLibrary === 'function') applyLibrary(); } catch (e) {}
      apply();
    }, 0));
    setTimeout(apply, 0);
  }

  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook);
    else hook();
  } catch (e) { /* a URL filter must never take the library down */ }
})();
