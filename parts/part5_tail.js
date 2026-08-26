/* ============================================================
   THE PERFORMANCE QUEUE
   ------------------------------------------------------------
   There used to be three competing answers to "what is in the
   show": a hardcoded TOP-12 badge, per-owner tags, and starred
   favourites — and the one SHOWTIME actually read was the empty
   one, so a fresh laptop performed all 43 scenes sorted by SRC
   number. There is one answer now. Tick a scene, it joins the
   queue; the queue's ORDER is the running order; SHOWTIME walks
   it. Nothing else votes.
   ============================================================ */
let libFilter = 'all';
function syncChips() {
  document.querySelectorAll('.fchip').forEach(c => c.classList.toggle('on', c.dataset.f === libFilter));
}
const famOf = def => def.family || def.id;

/* SHOW CONTROL — the second MIDI device (ADR-0008). The HANDS device plays
   the instrument; this one drives the SHOW: previous/next through the running
   order, and 16 pads that jump straight to queue slots 1-16. Two devices, two
   jobs, learned separately.

   Replaces PADMAP, which did the slot half only and whose LEARN button was a
   no-op where it lived: it sat in the queue drawer — the CONTROL window — and
   armed a listener in a window that can never receive a MIDI note, because
   real MIDI-in is show-window-only (ADR-0006). There was no pad:* IPC to
   close that gap. NAV learns over nav:learn/nav:state, the same round trip
   the hands' LEARN uses.

   LEARN IS ONE-SHOT, not the hands' 2.6s sweep. A continuous controller has
   to reveal its RANGE before you know what it is; a button is decisive on its
   first press. Times out at 6s so a stray click doesn't leave it listening.

   Bindings are the same {type, ch, num, dev} 4-tuple the hands use, so
   srcMatches()/srcKey() work on them unchanged — but `type` here is 'note' or
   'cc', a namespace the hands never touch (they bind cc/bend/at, and note-ons
   are routed here before the hands ever parse them). CC binds fire on the
   RISING EDGE ONLY, so a momentary footswitch triggers once per press instead
   of on press and release.

   Slots are anchor + offset: slot N is the base's `num` + (N-1) on the same
   type/channel/device. One press to learn all 16 — but it does assume the
   pads are consecutive, which is true of a 4x4 grid and not true of every
   controller. Slots past the end of the queue are inert. */
const NAV = {
  dev: null,                       // {id, name} — which device is the pad
  prev: null, next: null, base: null,
  learn: null,                     // 'prev' | 'next' | 'slots' | null
  _timer: null, _last: {},         // _last: CC value per source, for edges
  SLOTS: 16,
  load() {
    let m = null;
    try { m = JSON.parse(localStorage.getItem('srcNavMap') || 'null'); } catch (e) {}
    if (m) { this.dev = m.dev || null; this.prev = m.prev || null; this.next = m.next || null; this.base = m.base || null; return; }
    // migrate PADMAP: an already-mapped 4x4 keeps every pad, no re-learn
    try {
      const old = JSON.parse(localStorage.getItem('srcPadMap') || 'null');
      if (old && old.note !== undefined) {
        this.base = { type: 'note', ch: old.ch, num: old.note, dev: old.dev };
        this.dev = { id: old.dev, name: '' };
        this.save();
      }
    } catch (e) {}
  },
  save() {
    try {
      localStorage.setItem('srcNavMap', JSON.stringify({ dev: this.dev, prev: this.prev, next: this.next, base: this.base }));
    } catch (e) {}
  },
  label(m) { return m ? (m.type === 'note' ? 'NOTE' : 'CC') + m.num : null; },
  // In the control window the real bindings live in the show window, so the
  // buttons read the relayed labels (_relay) instead of local state that is
  // permanently empty there — the same split refreshMidiUI makes for hands.
  _relay: null,
  /* Review: this used to return _relay unconditionally in the control window,
     which is null until the show window happens to relay — and the show
     window never relayed at BOOT. So every launch showed LEARN PREV / "no
     show controller mapped" even with a controller mapped, which reads as a
     broken rig and invites a pointless re-learn.
     The control window is not actually ignorant: load() is not role-gated and
     localStorage is shared between the two windows, so it already has the
     real bindings. Fall back to them; _relay only has to cover CHANGES made
     after boot, and those always follow a control-initiated LEARN. */
  labels() {
    if (window.ELECTRON_ROLE === 'control' && this._relay) return this._relay;
    return { prev: this.label(this.prev), next: this.label(this.next), base: this.label(this.base) };
  },
  baseNum() {
    if (window.ELECTRON_ROLE === 'control' && this._relay) return this._relayBase;
    return this.base ? this.base.num : null;
  },
  // Which slot (if any) this source is — one definition, used both to fire a
  // pad and to tell the hands' LEARN to keep its hands off (claims()).
  slotOf(p) {
    const b = this.base;
    if (!b || b.type !== p.type || b.ch !== p.ch || b.dev !== p.dev) return -1;
    const slot = p.num - b.num;
    return (slot >= 0 && slot < this.SLOTS) ? slot : -1;
  },
  // Does SHOW CONTROL own this source? The hands' LEARN asks before binding.
  // Review: the old guard checked prev/next only, so a CC-based pad BASE
  // could still be stolen as a hand — the ADR claimed a guard in both
  // directions that the code only half had.
  claims(p) { return srcMatches(this.prev, p) || srcMatches(this.next, p) || this.slotOf(p) >= 0; },
  /* The device gate. MIDIInput ids are NOT stable across a replug or a BLE
     re-pair — the MIDI-OUT path already learned this the hard way and
     persists by NAME (MOut.selectPortByName). Match on id, fall back to name,
     so re-pairing the pad mid-show doesn't silently kill navigation. */
  isOurDevice(p) {
    if (!this.dev) return true;              // nothing picked = listen to all
    if (this.dev.id && p.dev === this.dev.id) return true;
    return !!(this.dev.name && p.devName && p.devName === this.dev.name);
  },
  arm(what) {
    this.learn = (this.learn === what) ? null : what;   // click again to cancel
    clearTimeout(this._timer);
    if (this.learn) this._timer = setTimeout(() => { this.learn = null; this.ui(); this.relay(); }, 6000);
    // Control has no MIDI-in of its own (ADR-0006) — relay the REQUEST and
    // let the show window run the real listen. The local toggle above is
    // only so the button says HIT IT… during the round trip; nav:state
    // overwrites it the moment the show window actually binds.
    if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.requestNavLearn) {
      window.electronAPI.requestNavLearn(this.learn);
    }
    this.ui(); this.relay();
  },
  onMsg(p) {
    if (this.learn) {
      // Review: the device gate used to sit BELOW this branch, so learning
      // was device-blind. Pick your pad, learn PADS on it, then click LEARN
      // NEXT and have the theremin twitch a CC first — NAV.dev silently
      // became the theremin and every pad binding went unreachable, with
      // nothing on screen saying so. Once a device is named, only that
      // device can bind; adopting a NEW one is something you do through the
      // picker (set it to ANY), not by accident.
      if (this.dev && !this.isOurDevice(p)) return;
      // Don't bind something the HANDS already own — a theremin sweeping
      // during nav-learn would otherwise steal the binding.
      if (typeof midi !== 'undefined' && (srcMatches(midi.map.L, p) || srcMatches(midi.map.R, p))) return;
      const src = { type: p.type, ch: p.ch, num: p.num, dev: p.dev };
      if (this.learn === 'slots') this.base = src; else this[this.learn] = src;
      if (!this.dev) this.dev = { id: p.dev, name: p.devName || '' };
      this.learn = null; clearTimeout(this._timer);
      this.save(); this.ui(); this.relay();
      return;
    }
    // A hands LEARN sweep is running: don't navigate off it. Crossing a CC
    // that happens to be bound to PREV would jump the show mid-sweep.
    if (typeof midi !== 'undefined' && midi.learn) return;
    if (!this.isOurDevice(p)) return;
    // Backfill a name for a mapping that only ever had an id — a migrated
    // PADMAP, or a bind from an input that hadn't reported its name — so the
    // name fallback in isOurDevice() can rescue it after a replug.
    if (this.dev && !this.dev.name && p.devName) { this.dev.name = p.devName; this.save(); }
    if (srcMatches(this.prev, p)) return this.fire('prev');
    if (srcMatches(this.next, p)) return this.fire('next');
    const slot = this.slotOf(p);
    if (slot >= 0) this.fire('slot', slot);
  },
  fire(what, slot) {
    if (what === 'slot') { QUEUE.goToSlot(slot); return; }
    // step() is a no-op with nothing on stage, which would make the pad feel
    // dead exactly when someone is trying to START the show — open the top of
    // the running order instead.
    if (focus.idx < 0) { QUEUE.goToSlot(0); return; }
    if (window.SHOW) (what === 'next' ? SHOW.next() : SHOW.prev());
  },
  ui() {
    const set = (id, txt, on) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.textContent = txt;
      b.classList.toggle('learning', !!on);
    };
    const L = this.labels();
    set('btnNavPrev', this.learn === 'prev' ? 'HIT IT…' : L.prev ? 'PREV=' + L.prev : 'LEARN PREV', this.learn === 'prev');
    set('btnNavNext', this.learn === 'next' ? 'HIT IT…' : L.next ? 'NEXT=' + L.next : 'LEARN NEXT', this.learn === 'next');
    set('btnNavSlots', this.learn === 'slots' ? 'HIT PAD 1…' : L.base ? 'PADS=' + L.base : 'LEARN PADS', this.learn === 'slots');
    const r = document.getElementById('navRange');
    const bn = this.baseNum();
    if (r) r.textContent = (bn === null || bn === undefined) ? '' : '1-' + this.SLOTS + ' → ' + bn + '-' + (bn + this.SLOTS - 1);
  },
  // show -> control, so the console's buttons reflect the real bindings
  relay() {
    if (window.ELECTRON_ROLE !== 'show' || !window.electronAPI?.sendNavState) return;
    window.electronAPI.sendNavState({
      learn: this.learn, labels: this.labels(),
      baseNum: this.base ? this.base.num : null, dev: this.dev,
    });
  },
};
NAV.load();
window.NAV = NAV;
// Show window: announce the bindings once at boot. The console is already
// correct without this (shared localStorage + the fallback in labels()), but
// this keeps _relay authoritative from the first moment rather than only
// after the first LEARN.
if (window.ELECTRON_ROLE === 'show') setTimeout(() => NAV.relay(), 1200);
// Show window: run the real listen when the console's LEARN is clicked.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onNavLearnRequested) {
  window.electronAPI.onNavLearnRequested(what => {
    // control already toggled its own copy, so set rather than toggle here —
    // arm()'s click-again-cancels logic would otherwise invert the request
    NAV.learn = what || null;
    clearTimeout(NAV._timer);
    if (NAV.learn) NAV._timer = setTimeout(() => { NAV.learn = null; NAV.ui(); NAV.relay(); }, 6000);
    NAV.ui(); NAV.relay();
  });
}
// Control window: the real bindings, mirrored back for the buttons.
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onNavState) {
  window.electronAPI.onNavState(st => {
    if (!st) return;
    NAV._relay = st.labels || null;
    NAV._relayBase = st.baseNum;
    NAV.learn = st.learn || null;
    NAV.dev = st.dev || null;
    clearTimeout(NAV._timer);
    NAV.ui();
  });
}

const QUEUE = {
  list: [], shared: null,
  /* Per-scene SHOW SETTINGS, keyed by family id:
       min — minutes on stage before SHOWTIME auto-advances (default DWELL_MIN)
       out — sound routing override for that scene ('web'|'both'|'midi');
             absent = follow the global OUT toggle.
     They live beside the list (srcQueueCfg), persist on every change, travel
     inside COPY FOR REPO, and load back in from setlists.json entries. */
  cfg: {}, DWELL_MIN: 10,
  load() {
    try { this.cfg = JSON.parse(localStorage.getItem('srcQueueCfg') || '{}') || {}; } catch (e) { this.cfg = {}; }
    try {
      const s = window.localStorage && localStorage.getItem('srcQueue');
      if (s) { this.list = JSON.parse(s).filter(Boolean); return; }
      // one-time migration: whatever was starred becomes the first queue
      const old = window.localStorage && localStorage.getItem('srcFavs');
      if (old) { this.list = JSON.parse(old).filter(Boolean); this.save(); return; }
    } catch (e) {}
    // Nothing of your own yet — start from the camp's default set rather than
    // from nothing. This is what stops a fresh show laptop performing all 43
    // scenes in SRC order because nobody remembered to build a queue on it.
    const def = this.sets().find(s2 => s2.default);
    if (def) this.adoptSet(def);
  },
  save() {
    try {
      window.localStorage && localStorage.setItem('srcQueue', JSON.stringify(this.list));
      window.localStorage && localStorage.setItem('srcQueueCfg', JSON.stringify(this.cfg));
    } catch (e) {}
    this.relay();
  },
  /* Electron: push the queue to the show window on every change. save() is
     the one choke point every mutation already funnels through — toggle,
     move, clear, setCfg, adoptSet/loadSet and the #set= merge banner — so
     relaying here means no edit path can be added later that forgets to
     sync. Control-only and one-way: the show window is picture-only, so it
     never has an edit of its own to send back (ADR-0003's queue:update).
     Both windows share localStorage, so before this the show window did
     pick edits up — but only on a reload, which is not a thing you do
     mid-show. */
  relay() {
    if (window.ELECTRON_ROLE !== 'control' || !window.electronAPI?.sendQueue) return;
    window.electronAPI.sendQueue({ list: this.list, cfg: this.cfg });
  },
  cfgFor(id) { return this.cfg[id] || {}; },
  setCfg(id, patch) {
    const c = { ...this.cfgFor(id), ...patch };
    for (const k in c) if (c[k] === undefined || c[k] === '' || c[k] === null) delete c[k];
    if (Object.keys(c).length) this.cfg[id] = c; else delete this.cfg[id];
    this.save();
  },
  dwellMs(id) {
    const m = +this.cfgFor(id).min;
    return (m > 0 ? Math.min(m, 120) : this.DWELL_MIN) * 60 * 1000;
  },
  outFor(id) { return this.cfgFor(id).out || null; },
  has(id) { return this.list.indexOf(id) >= 0; },
  pos(id) { return this.list.indexOf(id) + 1; },   // 1-based, 0 = not queued
  toggle(id) {
    const i = this.list.indexOf(id);
    if (i >= 0) this.list.splice(i, 1); else this.list.push(id);
    this.save(); this.refresh();
  },
  move(id, dir) {
    const i = this.list.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= this.list.length) return;
    this.list.splice(j, 0, this.list.splice(i, 1)[0]);
    this.save(); this.refresh();
  },
  clear() { this.list = []; this.save(); this.refresh(); },
  link() {
    const url = location.origin + location.pathname + '#set=' + this.list.join(',');
    const done = () => {
      const b = document.getElementById('btnQueueLink');
      b.textContent = 'COPIED ✓'; setTimeout(() => b.textContent = 'COPY LINK', 1500);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copy your queue link:', url));
    else prompt('Copy your queue link:', url);
  },
  // the tile a family lives on — the queue stores family ids, not versions
  tileFor(id) { return [...grid.children].find(t => t.dataset.pid === id) || null; },
  /* Put a family id on stage. This move — resolve id -> tile -> latest
     version -> close-then-open -> restart the dwell clock — was written out
     four separate times (PADMAP.go, the console row click, play(), the arrow
     walk) before the nav controller would have made it five. One helper.
     Re-selecting the scene already on stage deliberately does NOT reopen it
     (that would restart its audio and reseed it mid-show) but DOES restart
     the dwell clock, so hitting a pad for the current scene means "give this
     one another full stay". */
  goToFamily(id) {
    const tile = this.tileFor(id);
    if (!tile || !tile.cur) return false;
    const already = focus.idx >= 0 && famOf(PIECES[focus.idx]) === id;
    if (!already) {
      if (focus.idx >= 0) closeFocus();
      openFocus(tile.cur.idx);
    }
    if (window.SHOW) SHOW.resetRotation();
    return true;
  },
  // 0-based into the running order; slots past the end are simply inert, so a
  // 16-pad controller over a 9-scene set costs nothing.
  goToSlot(i) { const id = this.list[i]; return id ? this.goToFamily(id) : false; },
  titleOf(id) {
    const t = this.tileFor(id);
    return t ? (t.querySelector('h3').textContent || id) : id + ' (not on this build)';
  },
  // PLAY starts the performance: first queued scene, picture only, fullscreen
  // on the chosen display. If something is actually broken (no audio) it opens
  // the check instead of starting a silent show.
  play(force) {
    // PLAY is the pre-flight (Lance): every play walks the check — display,
    // sound, set, hands — and launches from its START THE SHOW button.
    // force=true is that button itself (and PADMAP/console jumps mid-show).
    if (!force && typeof PRE !== 'undefined') {
      document.getElementById('queuePop').classList.remove('open');
      PRE.open();
      return;
    }
    // Raise the show flag FIRST: openFocus only relays to the wall while a
    // show is live, and this open is the first scene of one.
    if (typeof setShowLive === 'function') setShowLive(true);
    const first = this.list.find(id => this.tileFor(id));
    if (!(first && this.goToFamily(first)) && focus.idx < 0) openFocus(0);
    document.getElementById('queuePop').classList.remove('open');
    this.wake(false);
    if (typeof enterShow === 'function') enterShow();
  },
  refresh() {
    const btn = document.getElementById('btnQueue');
    if (btn) { btn.textContent = 'PERFORMANCE QUEUE \u00b7 ' + this.list.length; btn.classList.toggle('off', !this.list.length); }
    document.querySelectorAll('.tile').forEach(tile => {
      const id = tile.dataset.pid, box = tile.querySelector('.qbox');
      if (!box) return;
      const n = this.pos(id);
      box.textContent = n || '';
      box.classList.toggle('on', !!n);
      box.title = n ? 'Queued #' + n + ' — click to remove' : 'Add to the performance queue';
    });
    const fq = document.getElementById('btnQueueFocus');
    if (fq && focus.idx >= 0) {
      const n = this.pos(famOf(PIECES[focus.idx]));
      fq.textContent = n ? '✓ QUEUED ' + n : '+ QUEUE';
      fq.classList.toggle('on', !!n);
    }
    this.renderList();
    if (typeof applyLibrary === 'function') applyLibrary();
  },
  renderList() {
    const ol = document.getElementById('queueList');
    if (!ol) return;
    document.getElementById('queuePop').classList.toggle('empty', !this.list.length);
    ol.innerHTML = this.list.map((id, i) => {
      const c = this.cfgFor(id);
      return `<li data-qid="${id}">
      <span class="qn">${i + 1}</span>
      <canvas class="qthumb" width="56" height="35"></canvas>
      <span class="qid">${id}</span>
      <span class="qt">${this.titleOf(id)}</span>
      <input class="qmin" type="number" min="1" max="120" step="1" value="${c.min || this.DWELL_MIN}"
        title="Minutes on stage before SHOWTIME auto-advances (any manual step resets the clock)">
      <span class="qunit">min</span>
      <select class="qout${c.out ? ' ovr' : ''}" title="Sound routing while this scene is up — SET follows the global OUT toggle">
        <option value=""${!c.out ? ' selected' : ''}>SET</option>
        <option value="web"${c.out === 'web' ? ' selected' : ''}>WEB</option>
        <option value="both"${c.out === 'both' ? ' selected' : ''}>W+M</option>
        <option value="midi"${c.out === 'midi' ? ' selected' : ''}>MIDI</option>
      </select>
      <button data-q="up" title="earlier in the set"${i === 0 ? ' disabled' : ''}>↑</button>
      <button data-q="dn" title="later in the set"${i === this.list.length - 1 ? ' disabled' : ''}>↓</button>
      <button data-q="rm" title="drop from the set">✕</button>
    </li>`; }).join('');
    ol.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
      const id = e.target.closest('li').dataset.qid, act = e.target.dataset.q;
      if (act === 'up') this.move(id, -1);
      else if (act === 'dn') this.move(id, 1);
      else this.toggle(id);
    }));
    ol.querySelectorAll('.qmin').forEach(inp => inp.addEventListener('change', e => {
      const id = e.target.closest('li').dataset.qid;
      const v = Math.max(1, Math.min(120, Math.round(+e.target.value || 0)));
      e.target.value = v;
      this.setCfg(id, { min: v === this.DWELL_MIN ? undefined : v });
    }));
    ol.querySelectorAll('.qout').forEach(sel => sel.addEventListener('change', e => {
      const id = e.target.closest('li').dataset.qid;
      this.setCfg(id, { out: e.target.value || undefined });
      e.target.classList.toggle('ovr', !!e.target.value);
      // a routing change on the OPEN scene should be audible right now
      if (focus.idx >= 0 && famOf(PIECES[focus.idx]) === id && typeof MOut !== 'undefined')
        MOut.applyMode(this.outFor(id));
    }));
    this.renderSets();
    this.paintThumbs();
    this.renderShowPanel();
  },

  /* ============================================================
     THE SHOW CONSOLE (ADR-0007) — the control window's running order.
     Deliberately NOT renderList(): that one is the EDITOR (MIN input, OUT
     select, ↑↓✕, thumbnails, shared sets) and it targets #queueList by id,
     singular. This is a read-only running order with a live clock, and it
     is the thing the operator actually looks at during a show — the picture
     is on the wall behind them.
     Split in two on purpose: renderShowPanel() rebuilds innerHTML and runs
     ONLY when the set changes; paintShowPanel() runs every frame and only
     ever writes textContent/classList. Rebuilding the DOM at 60fps is what
     made SHOW CHECK's buttons flicker, and this list has click targets.
     ============================================================ */
  renderShowPanel() {
    const ol = document.getElementById('sqList');
    if (!ol) return;
    const empty = document.getElementById('sqEmpty');
    if (empty) empty.style.display = this.list.length ? 'none' : 'block';
    ol.innerHTML = this.list.map((id, i) => {
      const c = this.cfgFor(id);
      return `<li data-sqid="${id}" title="Open this scene on the wall">
        <span class="sqn">${i + 1}</span>
        <span class="sqid">${id}</span>
        <span class="sqt">${esc(this.titleOf(id))}</span>
        <span class="sqm">${c.min || this.DWELL_MIN}m</span>
      </li>`;
    }).join('');
    // click a row to jump the SHOW there — openFocus already relays
    ol.querySelectorAll('li').forEach(li => li.addEventListener('click', () => {
      this.goToFamily(li.dataset.sqid);   // openFocus relays to the wall
    }));
    this.paintShowPanel();
  },
  paintShowPanel() {
    const ol = document.getElementById('sqList');
    if (!ol || !ol.children.length && !this.list.length) return;
    const curFam = focus.idx >= 0 ? famOf(PIECES[focus.idx]) : null;
    // tele.rotAt is an ABSOLUTE deadline stamped by the show window's dwell
    // timer. Both windows are one machine, so subtracting our own Date.now()
    // is exact — and smooth between the 4Hz packets that carry it, which a
    // relayed "seconds remaining" could never be.
    const left = tele.rotAt ? Math.max(0, tele.rotAt - Date.now()) : 0;
    const clock = ms => Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0');
    const set = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

    const ci = curFam ? this.list.indexOf(curFam) : -1;
    set(document.getElementById('sqNowTitle'), curFam ? this.titleOf(curFam) : '—');
    set(document.getElementById('sqNowClock'), tele.rotAt ? clock(left) : '—:—');
    const nextId = ci >= 0 && this.list.length ? this.list[(ci + 1) % this.list.length] : null;
    set(document.getElementById('sqNowNext'), 'next: ' + (nextId ? this.titleOf(nextId) : '—'));
    const bar = document.querySelector('#sqBar i');
    if (bar) {
      const pct = tele.rotMs ? Math.max(0, Math.min(100, (1 - left / tele.rotMs) * 100)) : 0;
      const w = pct.toFixed(1) + '%';
      if (bar.style.width !== w) bar.style.width = w;
    }
    [...ol.children].forEach(li => {
      const on = li.dataset.sqid === curFam;
      li.classList.toggle('on', on);
      const m = li.querySelector('.sqm');
      // the scene on stage counts DOWN; the rest just state their MIN
      if (on && tele.rotAt) set(m, clock(left));
      else set(m, (this.cfgFor(li.dataset.sqid).min || this.DWELL_MIN) + 'm');
    });
  },

  /* THUMBNAILS — SRC numbers are unreadable as a set list at 3am, so each row
     shows the scene. The tile canvases are already rendering, so this is a blit,
     not a second render. Tiles below the fold are paused by the
     IntersectionObserver, so while the drawer is open we wake the queued ones
     and hand their visibility back on close. */
  paintThumbs() {
    document.querySelectorAll('#queueList li').forEach(li => {
      const tile = this.tileFor(li.dataset.qid);
      const cv = li.querySelector('.qthumb');
      if (!cv) return;
      const g = cv.getContext('2d');
      const src = tile && tile.querySelector('canvas');
      if (!src || !src.width) { g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); return; }
      try { g.drawImage(src, 0, 0, cv.width, cv.height); } catch (e) {}
    });
  },
  // wake queued tiles while the drawer is open so their thumbnails move
  wake(on) {
    clearInterval(this._thumbT); this._thumbT = null;
    this.list.forEach(id => {
      const tile = this.tileFor(id);
      if (!tile) return;
      const cv = tile.querySelector('canvas');
      const P = cv && ioMap.get(cv);
      if (!P) return;
      if (on) P.visible = true;
      else {
        // hand it back honestly: the observer only fires on CHANGE, so a tile we
        // forced awake off-screen would render forever if we just walked away
        const r = cv.getBoundingClientRect();
        P.visible = r.bottom > -120 && r.top < window.innerHeight + 120;
      }
    });
    if (on) this._thumbT = setInterval(() => this.paintThumbs(), 120);
  },

  /* SHARED SETS — setlists.json, committed and baked into the build. The queue
     above is personal scratch; these are what the camp agreed on.
     A scenes[] entry is either a plain id ("SRC-15") or an object carrying
     that scene's show settings ({"id":"SRC-15","min":6,"out":"midi"}). */
  sets() { return (typeof SETLISTS !== 'undefined' && SETLISTS.sets) ? SETLISTS.sets : []; },
  setIds(set) { return set.scenes.map(e => (typeof e === 'string' ? e : e && e.id)).filter(Boolean); },
  adoptSet(set) {
    this.list = this.setIds(set);
    set.scenes.forEach(e => {
      if (typeof e !== 'object' || !e || !e.id) return;  // a bare id keeps your local settings
      this.setCfg(e.id, {
        min: +e.min > 0 ? +e.min : undefined,
        out: ['web', 'both', 'midi'].includes(e.out) ? e.out : undefined
      });
    });
  },
  sameAs(set) {
    const ids = this.setIds(set);
    return ids.length === this.list.length && ids.every((id, i) => this.list[i] === id);
  },
  loadSet(name) {
    const set = this.sets().find(s2 => s2.name === name);
    if (!set) return;
    this.adoptSet(set);
    this.save(); this.refresh();
  },
  publish() {
    const block = JSON.stringify({
      name: 'MY SET', note: 'what this set is for',
      scenes: this.list.map(id => {
        const c = this.cfgFor(id);
        return (c.min || c.out) ? { id, ...(c.min ? { min: c.min } : {}), ...(c.out ? { out: c.out } : {}) } : id;
      })
    }, null, 2);
    const done = () => {
      const b = document.getElementById('btnSetPublish');
      b.textContent = 'COPIED ✓'; setTimeout(() => b.textContent = 'COPY FOR REPO', 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(block).then(done).catch(() => prompt('Paste this into setlists.json:', block));
    else prompt('Paste this into setlists.json:', block);
  },
  renderSets() {
    const box = document.getElementById('setList');
    if (!box) return;
    const sets = this.sets();
    box.innerHTML = sets.length ? sets.map(set => `<div class="setrow${this.sameAs(set) ? ' live' : ''}">
      <span class="setname">${set.name}</span>
      <span class="setcount">${set.scenes.length} scenes${set.default ? ' · default' : ''}</span>
      <button data-set="${set.name}">${this.sameAs(set) ? 'LOADED' : 'LOAD'}</button>
    </div>`).join('') : '<p>No shared sets yet — publish one from your queue.</p>';
    box.querySelectorAll('button[data-set]').forEach(b =>
      b.addEventListener('click', () => this.loadSet(b.dataset.set)));
    const rows = box.querySelectorAll('.setrow');
    sets.forEach((set, i) => { if (rows[i]) rows[i].title = set.note || ''; });
  },
  boot() {
    this.load();
    // a shared set arrives as an ordered list; #fav= links from the star era
    // still open, they just land as a proposed queue instead of a shortlist
    const h = location.hash;
    const m = h.startsWith('#set=') ? h.slice(5) : h.startsWith('#fav=') ? h.slice(5) : null;
    if (m) {
      const ids = m.split(',').filter(Boolean);
      if (ids.length) {
        this.shared = ids;
        libFilter = 'queue'; syncChips();
        const bn = document.getElementById('favBanner');
        bn.classList.add('open');
        document.getElementById('favBannerText').textContent =
          'SOMEONE SHARED A SET · ' + ids.length + ' SCENES, IN THEIR ORDER';
        document.getElementById('favMerge').addEventListener('click', () => {
          this.list = ids.slice(); this.save(); this.shared = null;
          bn.classList.remove('open');
          history.replaceState(null, '', location.pathname);
          this.refresh();
        });
        document.getElementById('favDismiss').addEventListener('click', () => {
          this.shared = null; libFilter = 'all'; syncChips();
          bn.classList.remove('open');
          history.replaceState(null, '', location.pathname);
          this.refresh();
        });
      }
    }
    const pop = document.getElementById('queuePop');
    document.getElementById('btnQueue').addEventListener('click', () => {
      const open = pop.classList.toggle('open');
      this.wake(open);
      if (open) this.paintThumbs();
    });
    document.getElementById('btnQueueX').addEventListener('click', () => { pop.classList.remove('open'); this.wake(false); });
    // clicking anywhere off the drawer closes it — like every other popover
    document.addEventListener('pointerdown', e => {
      if (!pop.classList.contains('open')) return;
      if (pop.contains(e.target) || e.target.closest && e.target.closest('#btnQueue')) return;
      pop.classList.remove('open'); this.wake(false);
    });
    // (PAD LEARN moved to MAP -> SHOW CONTROL, ADR-0008: it could never work
    // from this drawer, which lives in the window with no MIDI-in.)
    document.getElementById('btnSetPublish').addEventListener('click', () => this.publish());
    document.getElementById('btnQueueClear').addEventListener('click', () => this.clear());
    document.getElementById('btnQueueLink').addEventListener('click', () => this.link());
    document.getElementById('btnQueuePlay').addEventListener('click', () => this.play());
    document.getElementById('btnQueueFocus').addEventListener('click', () => {
      if (focus.idx >= 0) this.toggle(famOf(PIECES[focus.idx]));
    });
    this.refresh();
    // Seed the show window (and main's replay cache) with what we booted
    // with. Both windows read the same localStorage, so they already agree
    // here — this push exists so main HAS a payload to replay if the show
    // window reloads, and so a #set= link the control window opened on is
    // in effect before the first edit rather than after it.
    this.relay();
  }
};
// part2_core calls FAV.refresh() on focus open; keep that name pointing here
const FAV = QUEUE;

/* ============================================================
   WHICH SCREEN THE SHOW LANDS ON
   ------------------------------------------------------------
   The laptop drives the projectors off a splitter, so the show
   is one fullscreen render that has to arrive on the PROJECTOR
   display, not the built-in one. Chrome's Window Management API
   can enumerate displays and fullscreen onto a named one; it
   needs a permission the first call prompts for, and it needs a
   user gesture, which is why probing happens on a click.

   Honest limitation, stated in the panel too: one tab renders
   one picture. Picking a display sends the SHOW there; it does
   not give you a separate control window on the laptop. Control
   during the show is the DBG strip and the PANELS pill (H) on
   top of the picture.
   ============================================================ */
// RIG status relay (ticket #27's SHOW CHECK follow-up) — same shape as
// audioRelay/midiRelay in part2_core.js: the control window has no real
// MOut (its MOut.mode/port/clock are local-only stand-ins, never sent
// anywhere), so the two RIG rows below (Ableton / Tempo) were reading a
// question the control window can never truthfully answer — MOut.port was
// always null there, so "Ableton" said "no port selected" forever even
// while the show window was happily sending, and MOut.clock.running was
// always false, so "Tempo" never reported "driving Live". The show window
// pushes its real state once a second; the control window just remembers
// the last one it heard.
const rigRelay = { mode: 'web', portName: null, clockOn: true, clockRunning: false, bpm: 78 };
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.sendRigStatus) {
  setInterval(() => window.electronAPI.sendRigStatus({
    mode: MOut.mode, portName: MOut.port ? MOut.port.name : null,
    clockOn: MOut.clock.on, clockRunning: MOut.clock.running, bpm: T.bpm,
  }), 1000);
}
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onRigStatus) {
  window.electronAPI.onRigStatus(s => { Object.assign(rigRelay, s); });
}
/* telemetry:tick (ADR-0003's last unbuilt channel, ADR-0007) — what the WALL
   is doing, 4x a second. The control window no longer runs its own copy of
   the scene, so everything it used to read off its own focus.P / T / H / MOut
   comes from here instead: the dwell deadline behind the countdown, the act
   chip highlight, the chord readout, and the MIDI note activity the monitor
   and THE RIG rack light up from (those are fed ONLY by a scene's audio()
   tick, which now happens exclusively in the show window). */
const tele = {
  sceneId: null, act: 0, rotAt: 0, rotMs: 0, chordHud: '', beatPhase: 0,
  fps: 0, lastByRole: {}, log: [], at: 0,
};
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.sendTelemetry) {
  let sentUpTo = 0;
  setInterval(() => {
    // Only the TAIL of MOut.log since the last tick — the full log holds up to
    // 900 events and shipping it 4x a second would be pure waste.
    const log = MOut.log.slice(sentUpTo);
    sentUpTo = MOut.log.length;
    // MOut.log self-trims (splice(0,300) past 900), which walks the index
    // backwards; resync rather than slicing from a stale offset.
    if (sentUpTo > MOut.log.length) sentUpTo = MOut.log.length;
    const rot = window.SHOW ? SHOW.rotationState() : { rotAt: 0, rotMs: 0 };
    // MOut.log stamps events with performance.now(), whose TIME ORIGIN is
    // per-document — the two windows' clocks start at different moments, so
    // shipping those numbers raw would plot the wall's notes against the
    // console's timeline and smear the whole monitor. Convert to epoch here;
    // the receiver converts back into its own performance clock.
    const toEpoch = Date.now() - performance.now();
    window.electronAPI.sendTelemetry({
      sceneId: focus.idx >= 0 ? PIECES[focus.idx].id : null,
      act: (focus.P && focus.P.state && focus.P.state.act) || 0,
      rotAt: rot.rotAt, rotMs: rot.rotMs,
      chordHud: document.getElementById('oChord')?.textContent || '',
      beatPhase: (typeof T !== 'undefined' && T.running) ? T.phase(1) : 0,
      fps: window.__showFps || 0,
      lastByRole: MOut.lastByRole,
      log: log.slice(-120).map(e => ({ ...e, p: e.p + toEpoch })),
      // Audio in monitor panel (replaces THE RIG for audioIn scenes): the
      // control window never runs AUDIOIN's real analysis (ADR-0006/0007 —
      // no scene instance there at all), so it has to ride the one channel
      // that already ticks 4x/second rather than adding a second one.
      audioIn: { level: AUDIOIN.level, bass: AUDIOIN.bass, mid: AUDIOIN.mid, treble: AUDIOIN.treble, onset: AUDIOIN.onset, pan: AUDIOIN.pan, onsetCount: AUDIOIN.onsetCount },
      at: Date.now(),
    });
  }, 250);
}
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.onTelemetry) {
  window.electronAPI.onTelemetry(t => {
    if (!t) return;
    Object.assign(tele, t, { log: tele.log });
    // Audio in monitor panel: AUDIOIN.tick() never runs here (no real
    // analysis in the control window, same split as MIDI), so both the
    // live bars AND the scrolling trace have to come from telemetry. This
    // runs UNCONDITIONALLY, ahead of the showLive gate below — Nima found
    // the panel permanently frozen at zero because that gate gated this
    // too. The gate's own reasoning ("outside a show the control window
    // runs its own scene") is ADR-0007's PREVIOUS model; the control window
    // hasn't run a local scene at all since — and the whole point of this
    // panel is checking the mic is picked up BEFORE a show starts, which is
    // exactly the state the gate was blocking it in.
    if (t.audioIn) {
      Object.assign(AUDIOIN, t.audioIn);
      AUDIOIN.history.push({ p: performance.now(), ...t.audioIn });
      if (AUDIOIN.history.length > 200) AUDIOIN.history.shift();
    }
    // Only let the wall's MIDI/chord numbers drive this window while the
    // wall IS the thing on screen — those really are performance telemetry,
    // unlike the audio monitor above.
    if (!showLive) return;
    // Feed the relayed notes into the LOCAL MOut.log the monitor already
    // draws from, rather than teaching drawMonitor a second data source.
    if (t.log && t.log.length) {
      // back out of epoch into THIS document's performance clock (see the
      // sender) so drawMonitor plots the wall's notes on our own timeline
      const toPerf = performance.now() - Date.now();
      MOut.log.push(...t.log.map(e => ({ ...e, p: e.p + toPerf })));
      if (MOut.log.length > 900) MOut.log.splice(0, MOut.log.length - 600);
    }
    if (t.lastByRole) MOut.lastByRole = t.lastByRole;
    const el = document.getElementById('oChord');
    if (el && t.chordHud && el.textContent !== t.chordHud) el.textContent = t.chordHud;
    if (typeof QUEUE !== 'undefined' && QUEUE.paintShowPanel) QUEUE.paintShowPanel();
    // titles resolve off the wall's tiles, which are built after QUEUE.boot()
    // — if the very first telemetry lands before a row list exists, build it
    if (typeof QUEUE !== 'undefined' && !document.querySelector('#sqList li') && QUEUE.list.length) QUEUE.renderShowPanel();
  });
}
/* THE LIVE FEED (ADR-0007) — control window only. The picture here is the
   SHOW WINDOW's actual composited output, not a second render of the same
   scene: it cannot drift from the wall, and it costs the show machine one
   video encode instead of a whole duplicate scene + audio graph.
   main answers the getDisplayMedia request with the show window directly
   (setDisplayMediaRequestHandler), so no picker ever appears and the
   operator cannot aim it at the wrong window. */
const FEED = {
  stream: null, status: 'idle',
  note(msg, on) {
    const n = document.getElementById('feedNote');
    if (!n) return;
    n.textContent = msg || '';
    n.classList.toggle('on', !!on);
  },
  async start() {
    if (window.ELECTRON_ROLE !== 'control' || this.stream) return;
    const v = document.getElementById('showFeed');
    if (!v || !navigator.mediaDevices?.getDisplayMedia) return;
    try {
      // audio:false is deliberate — the show window is the only thing that
      // should ever make noise, and capturing it back would double it.
      this.stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      v.srcObject = this.stream;
      this.status = 'live';
      this.note('', false);
      // the show window can be closed/reloaded under us; recover rather than
      // sitting on a frozen last frame that looks like a hung show
      this.stream.getVideoTracks().forEach(tr => tr.addEventListener('ended', () => {
        this.stream = null; this.status = 'ended';
        this.note('FEED ENDED — retrying…', true);
        setTimeout(() => this.start(), 1200);
      }));
    } catch (e) {
      this.stream = null;
      this.status = 'denied';
      // On macOS this is almost always the Screen Recording grant. Say so
      // here AND in SHOW CHECK — a black rectangle explains nothing at 3am.
      this.note('NO PREVIEW — macOS Screen Recording permission needed for this app. SHOW CHECK → Preview has the fix. The wall itself is unaffected.', true);
    }
  },
};
if (window.ELECTRON_ROLE === 'control') {
  // one gesture-free attempt at boot; Electron grants same-app capture
  // without a user gesture, so this just works when the OS grant is there
  setTimeout(() => FEED.start(), 400);
}
// SHOW CHECK reads this; polled rather than asked once, because the operator
// can grant the permission WHILE the pre-flight is open and should see it go
// green without relaunching.
const previewPerm = { status: 'checking' };
if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.previewStatus) {
  const poll = () => window.electronAPI.previewStatus()
    .then(st => {
      const was = previewPerm.status;
      previewPerm.status = st;
      // granted after a denial? take the feed now instead of at next launch
      if (was !== 'granted' && st === 'granted' && !FEED.stream) FEED.start();
    })
    .catch(() => { previewPerm.status = 'unknown'; });
  poll();
  setInterval(poll, 3000);
}
const SCREENS = {
  details: null, chosen: null, denied: false,
  // Electron path (ticket #31): never touches the web Window Management
  // API — main has unconditional, permission-free access to real displays,
  // and is the only thing that can actually fullscreen the SHOW window
  // (one BrowserWindow's renderer can't trigger fullscreen on another's,
  // proved resolving ticket #29). Electron's own Display objects already
  // carry .label/.internal, so label()/aimedInternal() below are untouched.
  inElectron() { return typeof window.electronAPI !== 'undefined'; },
  supported() { return this.inElectron() || typeof window.getScreenDetails === 'function'; },
  label(sc) { return (sc.label || '') + ' ' + sc.width + '×' + sc.height + (sc.isPrimary ? ' (primary)' : ''); },
  load() { try { this.chosen = localStorage.getItem('srcShowScreen'); } catch (e) {} },
  pick(label) {
    this.chosen = label || null;
    try {
      if (label) localStorage.setItem('srcShowScreen', label);
      else localStorage.removeItem('srcShowScreen');
    } catch (e) {}
  },
  // Nima, review fix: probe() used to cache this.details FOREVER, so a
  // projector plugged in after launch never appeared — and main's
  // display-added retry (ticket #37) was a no-op alongside it, because
  // nothing here was ever re-run to pick it up. refresh() is the one place
  // that re-runs the auto-pick logic: called once by probe() with whatever
  // it fetched, and again live whenever main tells us the display list
  // changed (see the onDisplaysChanged wiring below SCREENS.load()).
  refresh(screens) {
    this.details = { screens };
    this.denied = false;
    // Default to the display that is almost certainly the projector: the
    // external, non-primary one. Landing the show on the built-in screen is
    // the mistake this whole row exists to prevent. Only auto-picks when
    // nothing is targeted yet — a live plug-in event must never yank the
    // show off a display someone already chose.
    if (!this.target()) {
      const ext = screens.find(sc => !sc.isInternal && !sc.isPrimary) ||
                  screens.find(sc => !sc.isInternal);
      if (ext) this.pick(this.label(ext));
    }
  },
  async probe() {
    if (!this.supported() || this.details) return this.details;
    try {
      const screens = this.inElectron() ? await window.electronAPI.getDisplays() : (await window.getScreenDetails()).screens;
      this.refresh(screens);
    } catch (e) { this.denied = true; }
    return this.details;
  },
  // is the show currently aimed at the laptop while another display exists?
  aimedInternal() {
    const t = this.target();
    return !!(t && this.list().length > 1 && (t.isInternal || t.isPrimary));
  },
  // the ScreenDetailed we were told to use, if it is still attached
  target() {
    if (!this.details || !this.chosen) return null;
    return this.details.screens.find(sc => this.label(sc) === this.chosen) || null;
  },
  list() { return this.details ? this.details.screens : []; }
};
SCREENS.load();
// Ticket #37: main pushes the display list again whenever a display is
// added/removed (a projector waking up after launch, a cable coming loose)
// so the picker and the PRE panel's Display row can react without a reload.
// PRE is declared further down this file — fine, this callback only ever
// runs long after the whole script has finished and PRE exists.
if (window.electronAPI?.onDisplaysChanged) {
  window.electronAPI.onDisplaysChanged(list => { SCREENS.refresh(list); if (PRE.timer) PRE.render(); });
}

/* Enter the show: picture only, on the chosen display.
   PLAY forces performance mode — the PANELS preference persists between
   sessions, and starting a show with the MIDI console sitting over the
   picture is never what "play" meant. H (or the PANELS pill) brings it back.
   It also forces the FLAT projector view: the scrim 3D room and the ghost
   overlay are design tools, and whichever one you were rehearsing in must
   never be what the projectors get. */
function enterShow() {
  const ov = document.getElementById('overlay');
  if (typeof setPanels === 'function') setPanels(false);
  if (typeof setView === 'function' && typeof VIEW !== 'undefined' && VIEW.mode !== 'flat') setView('flat');
  if (typeof PROJ !== 'undefined' && !PROJ.on && typeof setProj === 'function') setProj(true);
  // Electron (ticket #31): this document is the CONTROL window when PLAY is
  // clicked — fullscreening IT would be wrong. Tell main to place+fullscreen
  // the SHOW window instead; the web Fullscreen API path below never runs.
  // Forcing panels/flat-view/PROJ *on the show window itself* over IPC is
  // separate, already-decided (ADR-0003's show:play channel), not-yet-wired
  // work — this only wires the display placement this ticket is about.
  // display:pick now carries { id, label } rather than a bare label string
  // (main matches on id when it has one, since a label string collides
  // whenever two attached displays share the same size). A null target is
  // a DELIBERATE single-display case, not a failure — main still
  // fullscreens the show window right where it already is, so PLAY is
  // never a silent no-op just because nothing was ever picked.
  if (SCREENS.inElectron()) {
    if (typeof setShowLive === 'function') setShowLive(true);
    const t = SCREENS.target();
    window.electronAPI.pickDisplay({ id: t ? t.id : null, label: SCREENS.chosen || null });
    return Promise.resolve(true);
  }
  if (document.fullscreenElement) return Promise.resolve(true);
  const scr = SCREENS.target();
  const opts = scr ? { screen: scr } : undefined;
  if (!ov.requestFullscreen) return Promise.resolve(false);
  return ov.requestFullscreen(opts).then(() => true).catch(() => {
    // a targeted request can be refused (permission revoked, display unplugged)
    // — fall back to plain fullscreen rather than silently doing nothing
    if (!opts) return false;
    return ov.requestFullscreen().then(() => true).catch(() => false);
  });
}

/* ============================================================
   PRE-FLIGHT — everything the wall needs, checked in one place,
   fixed in place. Written for the moment before you hand the
   instrument to strangers in the dark, so each row says what it
   FOUND, not what it wants.
   ============================================================ */
const PRE = {
  timer: null,
  open() {
    document.getElementById('preModal').classList.add('open');
    SCREENS.probe().then(() => this.render());
    this.render();
    clearInterval(this.timer);
    // render() rebuilds the whole modal via innerHTML, including the display
    // <select> — don't do that while it has focus, or a picker click gets
    // torn down and reset mid-selection before it can ever register.
    this.timer = setInterval(() => {
      if (document.activeElement?.id === 'preScreenSel') return;
      this.render();
    }, 600);
  },
  close() {
    document.getElementById('preModal').classList.remove('open');
    clearInterval(this.timer); this.timer = null;
  },
  /* Severity is deliberate: BAD is "the show will not work", WARN is "this is
     probably not what you meant". Nobody rehearsing with a mouse should get a
     wall of red for having no theremin plugged in.
     Two tiers: THE SHOW is what a newbie must get right on any laptop —
     sound, a set list, the right display, hands. THE RIG only matters when
     Ableton or hardware sensors are in the loop. (The frame row is gone:
     PLAY pins the 1920×1200 show frame itself, so there is nothing to check.) */
  rows() {
    const r = [];
    // control window: its AudioContext is real but MUTED by design (see
    // AE.ensure) — "running" there says nothing about whether the wall is
    // audible, so this row must read the show window's relayed state
    // (audioRelay), never local state. Nima found this showing "no audio
    // context yet" while sound was actually playing fine in the show window.
    const inControl = window.ELECTRON_ROLE === 'control';
    const aOn = inControl ? audioRelay.on : AE.on;
    const aCtxState = inControl ? audioRelay.ctxState : (AE.ctx ? AE.ctx.state : null);
    const aRate = inControl ? audioRelay.sampleRate : (AE.ctx ? AE.ctx.sampleRate : null);
    const ctxOn = aCtxState === 'running';
    r.push({ k: 'audio', sec: 'show', label: 'Sound', lvl: ctxOn ? 'ok' : 'bad',
      txt: !aOn ? 'muted — SOUND is OFF in the left rail'
        : !aCtxState ? 'no audio context yet — browsers need one click before they make noise'
        : aCtxState !== 'running' ? 'suspended (' + aCtxState + ') — one click wakes it'
        : 'running at ' + (aRate / 1000).toFixed(1) + ' kHz',
      fix: ctxOn ? null : ['WAKE AUDIO', () => {
        if (inControl) { if (window.electronAPI) window.electronAPI.requestAudioWake(); return; }
        AE.on = true; AE.ensure();
        // only restart a voice if a scene is actually up — startVoice reads
        // PIECES[focus.idx], and focus.idx is -1 on the library wall
        if (focus.idx >= 0 && typeof startVoice === 'function') startVoice();
      }] });

    const nq = QUEUE.list.length;
    r.push({ k: 'queue', sec: 'show', label: 'Set list', lvl: nq ? 'ok' : 'warn',
      txt: nq ? nq + (nq === 1 ? ' scene queued · ' : ' scenes queued · ') + 'opens with ' + QUEUE.titleOf(QUEUE.list[0])
        : 'empty — the show would fall back to all ' + FAMS.length + ' scenes in library order',
      fix: ['OPEN QUEUE', () => { this.close(); document.getElementById('queuePop').classList.add('open'); }] });

    // ADR-0007: the control window's picture is a capture of the show window,
    // and macOS gates that behind Screen Recording. A missing grant is a BLACK
    // PREVIEW with no error — indistinguishable from a dead show — so it gets
    // a row like every other environmental precondition.
    if (inControl) {
      // Report what is ACTUALLY TRUE — whether a stream is running — not
      // what a permission API implies. The feed captures the show window's
      // web frame rather than the OS screen, so on some setups it works with
      // no grant at all; inferring from getMediaAccessStatus would warn
      // falsely there. Permission is only consulted to EXPLAIN a failure.
      const live = FEED.status === 'live';
      const perm = previewPerm.status;
      r.push({ k: 'preview', sec: 'show', label: 'Preview',
        lvl: live ? 'ok' : FEED.status === 'denied' ? 'warn' : 'ok',
        txt: live ? 'live feed of the SHOW window — this is the wall itself, not a second render'
          : FEED.status === 'denied'
            ? 'no preview here' + (perm === 'denied' || perm === 'restricted'
                ? ' — macOS is blocking screen recording for this app' : '')
              + '. THE WALL IS UNAFFECTED; this is the console\u2019s picture only.'
          : FEED.status === 'ended' ? 'feed dropped — reconnecting…'
          : 'connecting to the SHOW window…',
        fix: FEED.status === 'denied' ? ['RETRY', () => {
          if (perm === 'denied' || perm === 'restricted') {
            if (window.electronAPI?.openScreenSettings) window.electronAPI.openScreenSettings();
          }
          FEED.start();
        }] : null });
    }
    r.push({ k: 'screen', sec: 'show', label: 'Display',
      lvl: SCREENS.aimedInternal() ? 'warn' : 'ok',
      txt: this.screenText(), screenPicker: true });

    // control window: midi.access/midi.map/midi.cal are permanently
    // null/inert here too (real MIDI-in stays show-only, ADR-0006) — same
    // class of bug as SOUND above. Nima found CONNECT looked broken from
    // here because this row never learned the show window actually
    // connected. LEARN now relays too (startLearn(), part2_core.js), so
    // MAP HANDS opens the real thing here — only calibration (REST/INVERT)
    // still needs doing directly in the show window (no live raw-value
    // stream relayed for that yet).
    const midiConnected = inControl ? midiRelay.connected : !!midi.access;
    const mapL = inControl ? midiRelay.map.L : mapLabel(midi.map.L);
    const mapR = inControl ? midiRelay.map.R : mapLabel(midi.map.R);
    const bound = (mapL ? 1 : 0) + (mapR ? 1 : 0);
    // Nima: clicking CONNECT relayed the request fine, but the button just
    // vanished with nothing said in between — it looked broken even when it
    // worked. midiConnectPending covers the round trip; midiRelay.denied
    // covers the show window actually failing (no Web MIDI, permission
    // refused) instead of silently retrying for 6s with no explanation.
    const pending = inControl && midiConnectPending;
    r.push({ k: 'hands', sec: 'show', label: 'Hands', lvl: !midiConnected ? 'warn' : bound === 2 ? 'ok' : 'warn',
      txt: !midiConnected
        ? (pending ? 'connecting to MIDI in the SHOW window…'
          : inControl && midiRelay.denied ? 'the SHOW window could not get MIDI access — check it directly'
          : 'MIDI not connected — mouse, edge lasers and W/S · ↑/↓ still play the wall')
        : bound === 2 ? 'L and R both bound (' + mapL + ' · ' + mapR + ')'
        : bound === 1 ? 'only ' + (mapL ? 'L' : 'R') + ' is bound — the other hand is dead'
        : 'MIDI on, but neither hand is bound yet',
      fix: !midiConnected ? (pending ? null : ['CONNECT', () => connectMidi()])
        : ['MAP HANDS', () => { this.close(); document.getElementById('mapPop').classList.add('open'); }] });

    const restedL = inControl ? midiRelay.calRested.L : !!(midi.cal.L && midi.cal.L.rest !== null && midi.cal.L.rest !== undefined);
    const restedR = inControl ? midiRelay.calRested.R : !!(midi.cal.R && midi.cal.R.rest !== null && midi.cal.R.rest !== undefined);
    const rested = (restedL ? 1 : 0) + (restedR ? 1 : 0);
    // Nima: "I click SET REST and nothing happens." Two reasons, both fixed
    // here. (a) The sample takes 1.6s and its result only arrives on the next
    // device poll, so for ~2.6s the row said exactly what it said before —
    // the click looked dead. It now reports the sample WHILE it runs, and
    // PRE's own 600ms poll paints it. (b) restData only collects from a hand
    // that is already BOUND, so with nothing learned SET REST genuinely does
    // nothing, forever — that is a different problem and it now says so
    // instead of offering a button that cannot work.
    const restBusy = inControl ? restPending : midi.restSampling;
    r.push({ k: 'cal', sec: 'rig', label: 'Calibration',
      lvl: !midiConnected ? 'ok' : restBusy ? 'warn' : rested === 2 ? 'ok' : 'warn',
      txt: !midiConnected ? 'not needed without hardware'
        : restBusy ? 'SAMPLING — stand clear of the instrument, hands away, until this settles'
        : rested === 2 ? 'both hands ranged and rested — idle detection is live'
        : bound === 0 ? 'no hand is bound yet, so there is nothing to take a rest reading FROM — LEARN L and R first, then set REST'
        : 'REST not set' + (rested ? ' on one hand' : '') + ' — a sensor that streams all night will read as PLAYING forever, so scenes never go idle. Stand clear of the instrument first: REST is what the sensors read with NOBODY there.',
      fix: !midiConnected || restBusy ? null
        : bound === 0 ? ['MAP HANDS', () => { this.close(); document.getElementById('mapPop').classList.add('open'); }]
        : ['SET REST', () => startRest()] });

    // control window: MOut.mode/port/clock are local stand-ins that never
    // reflect what the show window is actually sending (same bug class as
    // Sound/Hands/Calibration above) — read the relayed rigRelay instead.
    const outMode = inControl ? rigRelay.mode : MOut.mode;
    const outPortName = inControl ? rigRelay.portName : (MOut.port ? MOut.port.name : null);
    const clockOn = inControl ? rigRelay.clockOn : MOut.clock.on;
    const clockRunning = inControl ? rigRelay.clockRunning : MOut.clock.running;
    const bpm = inControl ? rigRelay.bpm : T.bpm;
    // SHOW CONTROL (ADR-0008): optional hardware, so THE RIG tier and never
    // worse than warn — PRE.worst() === 'bad' refuses to start the show, and
    // a missing nav pad must never be the reason a show doesn't run.
    const nl = NAV.labels(), navBound = (nl.prev ? 1 : 0) + (nl.next ? 1 : 0) + (nl.base ? 1 : 0);
    r.push({ k: 'nav', sec: 'rig', label: 'Show control', lvl: navBound ? 'ok' : 'warn',
      txt: !navBound ? 'no show controller mapped — the console, the arrow keys and the edge arrows still walk the set'
        : [nl.prev ? 'PREV=' + nl.prev : null, nl.next ? 'NEXT=' + nl.next : null,
           nl.base ? 'PADS=' + nl.base : null].filter(Boolean).join(' · '),
      fix: ['MAP CONTROL', () => { this.close(); document.getElementById('mapPop').classList.add('open'); }] });

    // AUDIO IN — Nima found the conditional version (only appearing when a
    // queued scene declares reg({audioIn:true})) genuinely hard to find
    // when trying to set the source up in the first place — you can't queue
    // Cell Front V4 from inside SHOW CHECK, so the row that would tell you
    // how to configure it was hidden until you'd already gone and done that
    // some other way. Standing row now, like SOUND/HANDS. Never worse than
    // warn — a missing mic must never be the reason a show doesn't start;
    // hands keep driving any scene that listens, regardless of this row.
    {
      const aConnected = inControl ? audioInRelay.connected : AUDIOIN.connected;
      const aDenied = inControl ? audioInRelay.denied : AUDIOIN.denied;
      const aRestSet = inControl ? audioInRelay.restSet : !!AUDIOIN.cal.rest;
      const aDeviceLabel = (inControl ? audioInRelay.device : AUDIOIN.device)?.label;
      // Nima: the CONNECT button read as "glitchy/flickery" — PRE.render()
      // rebuilds this whole modal's innerHTML every 600ms regardless of
      // whether anything changed, and this row used to print a live level
      // percentage that's virtually never the same number twice. Every
      // single poll was therefore a genuinely different rebuild — a
      // pre-flight row should say WHETHER it's working, not jitter with a
      // live reading; the actual VU meter lives in the Audio in panel under
      // the stage now.
      r.push({ k: 'audioin', sec: 'rig', label: 'Audio in',
        lvl: !aConnected ? 'warn' : !aRestSet ? 'warn' : 'ok',
        txt: !aConnected
          ? (aDenied ? 'no audio input — permission was denied, or nothing is plugged in. Scenes that listen still play from hands.'
            : 'not connected — only scenes that listen (Cell Front V4) need this. Scenes that listen still play from hands.')
          : !aRestSet ? 'connected to ' + (aDeviceLabel || 'the default device') + ' — SET REST with the room quiet so silence reads as silence'
          : 'connected to ' + (aDeviceLabel || 'the default device') + ' — signal live (see the Audio in panel under the stage)',
        fix: !aConnected ? ['CONNECT', () => AUDIOIN.connect()]
          : !aRestSet ? ['SET REST', () => AUDIOIN.startRest()]
          : ['AUDIO IN', () => { this.close(); document.getElementById('mapPop').classList.add('open'); }] });
    }

    const out = outMode !== 'web';
    r.push({ k: 'out', sec: 'rig', label: 'Ableton', lvl: out && outPortName ? 'ok' : 'warn',
      txt: !out ? 'WEB AUDIO only — Ableton will not hear the wall'
        : !outPortName ? 'MIDI out on, but no port selected'
        : 'sending to ' + outPortName,
      fix: out ? null : ['SEND MIDI', () => { AE.ensure(); MOut.setMode('both'); }] });

    r.push({ k: 'clock', sec: 'rig', label: 'Tempo', lvl: !out ? 'ok' : clockOn ? 'ok' : 'warn',
      txt: !out ? 'browser transport only' :
        !clockOn ? 'clock out OFF — someone has to retype Live’s tempo on every scene change'
        : clockRunning ? 'driving Live at ' + bpm + ' BPM — this app is the tempo master'
        : 'clock out armed — drives Live from the moment a scene opens (Live: port Sync on, EXT lit)',
      fix: (out && !clockOn) ? ['CLOCK ON', () => MOut.clockSet(true)] : null });
    return r;
  },
  screenText() {
    if (!SCREENS.supported()) return 'this browser cannot list displays — drag the window onto the projector, then start';
    if (SCREENS.denied) return 'permission denied — allow window management, or drag the window onto the projector';
    const list = SCREENS.list();
    if (!list.length) return 'checking displays…';
    const t = SCREENS.target();
    if (list.length === 1) return 'one display (' + SCREENS.label(list[0]) + ') — the show goes here';
    if (!t) return list.length + ' displays — pick which one gets the show';
    return SCREENS.aimedInternal()
      ? 'aimed at the BUILT-IN screen (' + SCREENS.chosen + ') — the projector will not get the show'
      : 'show goes to ' + SCREENS.chosen;
  },
  render() {
    const box = document.getElementById('preRows');
    if (!box) return;
    const rows = this.rows();
    const rowHtml = row => `<div class="prow ${row.lvl}" data-k="${row.k}">
      <span class="dot"></span><span class="plabel">${row.label}</span>
      <span class="pstat">${row.txt}</span>
      ${row.screenPicker ? '<select id="preScreenSel"></select>' : ''}
      ${row.fix ? `<button data-fix="${row.k}">${row.fix[0]}</button>` : ''}
    </div>`;
    box.innerHTML =
      '<h3 class="psec">The show <span>— every laptop, every time</span></h3>' +
      rows.filter(r => r.sec === 'show').map(rowHtml).join('') +
      '<h3 class="psec">The rig <span>— only if Ableton / hardware sensors are in the loop</span></h3>' +
      rows.filter(r => r.sec === 'rig').map(rowHtml).join('');
    box.querySelectorAll('button[data-fix]').forEach(b => b.addEventListener('click', () => {
      const row = rows.find(x => x.k === b.dataset.fix);
      if (row && row.fix) { row.fix[1](); this.render(); }
    }));
    const sel = document.getElementById('preScreenSel');
    if (sel) {
      const list = SCREENS.list();
      sel.style.display = list.length > 1 ? '' : 'none';
      sel.innerHTML = list.map(sc => {
        const l = SCREENS.label(sc);
        return `<option value="${l}"${l === SCREENS.chosen ? ' selected' : ''}>${l}</option>`;
      }).join('');
      sel.addEventListener('change', e => { SCREENS.pick(e.target.value); this.render(); });
    }
    const note = document.getElementById('preScreenNote');
    if (note) {
      note.textContent = SCREENS.inElectron()
        ? 'PLAY places and fullscreens the SHOW window on the display picked here — this control window stays put on its own screen. The DBG tab at the bottom is the truth window.'
        : SCREENS.supported()
        ? 'One tab renders one picture: choosing a display sends the SHOW there, it does not give you a second control window. During the show, PANELS (or H) brings the hands/MIDI/console back over the picture, and the DBG tab at the bottom is the truth window.'
        : 'Display picking needs Chrome’s window-management support. Without it: drag this window onto the projector screen first, then start the show.';
    }
  },
  worst() {
    const lv = this.rows().map(r => r.lvl);
    return lv.includes('bad') ? 'bad' : lv.includes('warn') ? 'warn' : 'ok';
  }
};

/* ============================================================
   BOOT — build the wall, run the loop
   ============================================================ */
const grid = document.getElementById('grid');
/* WHERE THE LOVE WENT — the default library order.
   A hand-maintained "active" list went stale the moment nobody updated it, so
   the wall now derives its own answer from two things it already knows:
     RECENCY — a new version is a new part file appended to the build, so the
       highest PIECES index in a family tracks how recently it was touched.
       (Proxy, not a timestamp: parts carry no dates. Close enough that the
       scenes people are actually working on float, which is the point.)
     DEPTH  — how many versions the family has, on a log curve so an 18-version
       obsession doesn't bury a 6-version scene that got real attention.
   Recency leads, because a scene worked on last week matters more to the set
   than one that was iterated hard a year ago and dropped. */
const LOVE = new Map();
function computeLove() {
  let maxIdx = 1, maxVer = 1;
  FAMS.forEach(F => {
    const idx = Math.max(...F.entries.map(e => e.idx));
    maxIdx = Math.max(maxIdx, idx);
    maxVer = Math.max(maxVer, F.entries.length);
  });
  FAMS.forEach(F => {
    const recency = Math.max(...F.entries.map(e => e.idx)) / maxIdx;
    const depth = Math.log(F.entries.length) / Math.log(maxVer);
    LOVE.set(F.fam, 0.55 * recency + 0.45 * depth);
  });
}
const loveRank = f => 1000 - Math.round((LOVE.get(f) || 0) * 1000);   // low = most loved
const insts = [];
// tile thumbnails render in the projector frame's exact shape (16:10, like
// 1920x1200) at thumbnail density — 420x264 was 1.59, close but a lie
const TILE_W = 416, TILE_H = 260;
const ioMap = new Map();
const io = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
  for (const en of entries) {
    const P = ioMap.get(en.target);
    if (P) P.visible = en.isIntersecting;
  }
}, { rootMargin: '120px' }) : null;

// group registered pieces into families (one tile per exploration, V-pills for history)
const FAMS = [];
{
  const fi = new Map();
  PIECES.forEach((def, i) => {
    const f = famOf(def);
    if (!fi.has(f)) { fi.set(f, FAMS.length); FAMS.push({ fam: f, entries: [] }); }
    FAMS[fi.get(f)].entries.push({ def, idx: i });
  });
  FAMS.forEach(F => F.entries.sort((a, b) => (a.def.ver || 1) - (b.def.ver || 1)));
  computeLove();
  FAMS.sort((a, b) => loveRank(a.fam) - loveRank(b.fam)); // most worked on first
}

FAMS.forEach(F => {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.pid = F.fam;
  tile.innerHTML = `
    <div class="tile-head"><span class="tid">${F.fam}</span><span class="ttag"></span><select class="vsel" style="display:none" title="version history"></select><button class="qbox" title="add to the performance queue"></button></div>
    <div class="cwrap"><canvas></canvas><span class="hoverhint">FOCUS ▸</span></div>
    <div class="tbody">
      <h3></h3>
      <p class="desc"></p>
      <span class="morelink">more</span>
      <div class="chips"></div>
      <p class="iline"></p>
    </div>`;
  grid.appendChild(tile);
  const cv = tile.querySelector('canvas');
  tile.cur = F.entries[F.entries.length - 1]; // latest version selected by default
  let P = makeInstance(tile.cur.def, cv, TILE_W, TILE_H);
  const ti = insts.length;
  insts.push(P);
  if (io) { ioMap.set(cv, P); io.observe(cv); }
  const setText = en => {
    tile.querySelector('.ttag').textContent = en.def.tech;
    tile.querySelector('h3').textContent = en.def.title;
    tile.querySelector('.desc').textContent = en.def.desc;
    tile.querySelector('.chips').innerHTML = en.def.tags.map(x => `<span class="chip">${x}</span>`).join('');
    tile.querySelector('.iline').textContent = en.def.interact;
    // versions live in a compact dropdown — latest is the default
    const vs = tile.querySelector('.vsel');
    if (F.entries.length > 1) {
      vs.style.display = '';
      vs.innerHTML = F.entries.map(e => `<option value="${e.def.ver || 1}"${e === tile.cur ? ' selected' : ''}>V${e.def.ver || 1}</option>`).join('');
    } else vs.style.display = 'none';
    // searchable text for the library bar
    tile.dataset.search = (F.fam + ' ' + en.def.title + ' ' + en.def.tech + ' ' + (en.def.tags || []).join(' ') + ' ' + en.def.desc).toLowerCase();
  };
  setText(tile.cur);
  tile.querySelector('.vsel').addEventListener('click', e => e.stopPropagation());
  tile.querySelector('.vsel').addEventListener('change', e => {
    const en = F.entries.find(x => (x.def.ver || 1) === +e.target.value);
    if (!en || en === tile.cur) return;
    tile.cur = en;
    P = makeInstance(en.def, cv, TILE_W, TILE_H);
    insts[ti] = P;
    if (io) ioMap.set(cv, P);
    setText(en);
    QUEUE.refresh();
  });
  tile.querySelector('.morelink').addEventListener('click', e => {
    e.stopPropagation();
    const on = tile.classList.toggle('exp');
    e.target.textContent = on ? 'less' : 'more';
  });
  tile.querySelector('.qbox').addEventListener('click', e => { e.stopPropagation(); QUEUE.toggle(F.fam); });
  // the whole card is the FOCUS button — the version dropdown, the queue box
  // and MORE all stop their own clicks, so there is nothing else to hit
  tile.addEventListener('click', () => openFocus(tile.cur.idx));
});

// version dropdown in fullscreen focus — flip live between versions to compare
function renderFocusVersions(i) {
  const el = document.getElementById('oVers');
  if (!el) return;
  const F = FAMS.find(x => x.fam === famOf(PIECES[i]));
  el.innerHTML = (F && F.entries.length > 1)
    ? `<select class="vsel" id="oVerSel">${F.entries.map(e => `<option value="${e.idx}"${e.idx === i ? ' selected' : ''}>V${e.def.ver || 1}</option>`).join('')}</select>`
    : '';
}
document.getElementById('oVers').addEventListener('change', e => {
  const idx = +e.target.value;
  if (idx !== focus.idx) { closeFocus(); openFocus(idx); }
});

/* ============================================================
   HISTORY — the scene's change log, in its sidebar.
   Every version is a part file, and SCENELOG (baked at build
   time by tools/scenelog.py) carries each file's birth commit:
   date + the round's summary. Owners come from the CLAUDE.md
   coordination list — git can't tell, every session commits as
   Claude. Click a row to open that version on the stage.
   ============================================================ */
function renderFocusHistory(i) {
  const box = document.getElementById('histList');
  if (!box) return;
  const F = FAMS.find(x => x.fam === famOf(PIECES[i]));
  if (!F) { box.innerHTML = ''; return; }
  const LOG = (typeof SCENELOG !== 'undefined') ? SCENELOG : { owners: {}, log: {} };
  const who = document.getElementById('histWho');
  if (who) {
    const owner = LOG.owners && LOG.owners[F.fam];
    who.textContent = F.entries.length + (F.entries.length === 1 ? ' version' : ' versions') +
      (owner ? ' · kept by ' + owner : '');
  }
  box.innerHTML = F.entries.slice().reverse().map(en => {
    const e = (LOG.log && LOG.log[en.def.id]) || {};
    const hasX = !!(e.b || e.s || e.h);   // anything for the expander to show
    return `<div class="hrow${en.idx === i ? ' on' : ''}" data-idx="${en.idx}" title="open V${en.def.ver || 1} on the stage">
      <div class="hline">
        <span class="hv">V${en.def.ver || 1}</span>
        ${e.by ? `<span class="hby">${esc(e.by)}</span>` : ''}
        <span class="hd">${e.d || ''}${e.t ? ' · ' + e.t : ''}</span>
        ${hasX ? '<span class="hxtog" title="the full round story">▸</span>' : ''}
      </div>
      ${e.m ? `<span class="hm">${esc(e.m)}</span>` : ''}
      ${hasX ? `<div class="hx">
        ${e.b ? `<pre class="hbody">${esc(e.b)}</pre>` : ''}
        <p class="hmeta">${e.h ? `commit ${e.h}` : ''}${e.a ? ` · by ${esc(e.a)}` : ''}${e.s ? ` · <a href="${esc(e.s)}" target="_blank" rel="noopener">open the session ↗</a>` : ''}</p>
      </div>` : ''}
    </div>`;
  }).join('');
  box.querySelectorAll('.hrow').forEach(row => row.addEventListener('click', () => {
    const idx = +row.dataset.idx;
    if (idx !== focus.idx) { closeFocus(); openFocus(idx); }
  }));
  // the expander is its own control — opening the story must not switch versions
  box.querySelectorAll('.hxtog').forEach(tog => tog.addEventListener('click', e => {
    e.stopPropagation();
    const open = tog.closest('.hrow').classList.toggle('open');
    tog.textContent = open ? '▾' : '▸';
  }));
  box.querySelectorAll('.hx').forEach(x => x.addEventListener('click', e => e.stopPropagation()));
}

// MIDI OUT wiring
document.getElementById('btnOut').addEventListener('click', () => {
  const next = { web: 'both', both: 'midi', midi: 'web' }[MOut.mode];
  AE.ensure();
  MOut.setMode(next);
});
document.getElementById('midiOutSel').addEventListener('change', e => {
  // control window (ticket #36): no local midi.access to pick a real port
  // from. Writing srcOutPort to localStorage (the old fix) never actually
  // changed anything — the show window only re-acquires a port when it has
  // NONE at all, which is never once it has one, so the picker looked like
  // it worked and did nothing. Relay the pick over IPC instead, by NAME
  // (MIDIAccess ids are per-window — the show window's port ids mean
  // nothing here); the show window is what persists srcOutPort now.
  if (window.ELECTRON_ROLE === 'control') {
    const picked = midiRelay.outputs[+e.target.value];
    if (picked && window.electronAPI) window.electronAPI.sendShowControl('outPort', picked.name);
    return;
  }
  if (!midi.access) return;
  const outs = [...midi.access.outputs.values()];
  MOut.port = outs[+e.target.value] || null;
  try { if (MOut.port) localStorage.setItem('srcOutPort', MOut.port.name); } catch (err) {}
});
document.getElementById('btnClock').addEventListener('click', () => MOut.clockSet(!MOut.clock.on));
setInterval(() => MOut.refreshUI(), 1500);
/* Acts, from the keys OR the chips in the top bar. Same one-driver rule as
   R (part2_core.js): the show window doesn't accept them locally, control
   applies them to its mirror and relays the identical act index on, so the
   operator's picture and the wall are never on different chapters. */
function setActLocal(n) {
  if (focus.idx < 0 || !focus.P) return;
  const d = PIECES[focus.idx];
  if (!d || !d.setAct) return;
  if (window.ELECTRON_ROLE === 'show') return;
  d.setAct(focus.P, n);
  if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('act', n);
}
// act hotkeys — keys 1-4 jump acts inside a focused journey piece (smooth-fades there)
window.addEventListener('keydown', e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key >= '1' && e.key <= '4') setActLocal(+e.key - 1);
});
// restore the MIDI rig across reloads — redeploys kept silently resetting OUT to web audio
(() => {
  let m = null, hasMap = false;
  try { m = localStorage.getItem('srcOutMode'); hasMap = !!localStorage.getItem('srcMidiMap'); } catch (e) {}
  if (m === 'both' || m === 'midi') {
    MOut.mode = MOut.baseMode = m; // set directly; setMode would re-save (harmless but redundant)
    MOut.refreshUI();
  }
  // reconnect MIDI IN too if the theremin was ever learned — bindings are already restored
  if ((m === 'both' || m === 'midi') || hasMap) connectMidi();
})();
document.getElementById('btnTest').addEventListener('click', () => { AE.ensure(); if (!midi.access) connectMidi(); MOut.testBurst(); });
// master volume — so the wall can share a room with a conversation
document.getElementById('volSlider').addEventListener('input', e => {
  AE.vol = (+e.target.value / 100) * 0.85;
  document.getElementById('volLabel').textContent = e.target.value + '%';
  if (AE.master && MOut.mode !== 'midi') AE.set(AE.master.gain, AE.vol, 0.05);
  // control window: its AE.master is real but feeds a muted sink, so moving
  // it changes nothing anyone hears — relay the raw value to the show window,
  // which owns the audible one.
  // fVol's synthesized 'input' event (below) also funnels through here, so
  // one relay call covers both the rail slider and the focus-bar mirror.
  if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('vol', +e.target.value);
});
// RIG panel
(function () {
  // (THE RIG modal is gone — the console under the stage is the rig surface)
  // focus-bar controls mirror the library header — no need to leave the scene
  const syncFocus = () => {
    const pairs = [['btnSound', 'fSound', ''], ['btnOut', 'fOut', ''], ['btnClock', 'fClock', '']];
    for (const [a, b, pre] of pairs) {
      const ea = document.getElementById(a), eb = document.getElementById(b);
      if (ea && eb) { eb.textContent = pre + ea.textContent; eb.classList.toggle('off', ea.classList.contains('off')); }
    }
    const v = document.getElementById('volSlider'), fv = document.getElementById('fVol');
    if (fv && v && document.activeElement !== fv) fv.value = v.value;
    const st = document.getElementById('oOutState');
    // control window: MOut.mode/port are local stand-ins (never the real
    // route), so read the relayed rigRelay instead — same bug class as
    // the SHOW CHECK rows above.
    const inControl = window.ELECTRON_ROLE === 'control';
    const stMode = inControl ? rigRelay.mode : MOut.mode;
    const stPort = inControl ? rigRelay.portName : (MOut.port ? MOut.port.name : null);
    if (st) st.textContent = (stMode !== 'web' && stPort) ? '→ ' + (stPort || 'MIDI OUT') : '';
  };
  document.getElementById('fSound').addEventListener('click', () => { document.getElementById('btnSound').click(); syncFocus(); });
  document.getElementById('fOut').addEventListener('click', () => { document.getElementById('btnOut').click(); syncFocus(); });
  document.getElementById('fClock').addEventListener('click', () => { document.getElementById('btnClock').click(); syncFocus(); });
  // Nima: this WAS "not relayed" on the theory that the wall's ambient
  // drift is local to whichever window you're staring at and the show
  // window never renders it — wrong, because hand:mirror (below) pushes
  // the show window's REAL chan.L/R to control 20x/s UNCONDITIONALLY,
  // overwriting control's own local value regardless of control's own
  // ghost toggle. With this un-relayed, toggling GHOSTS off in control
  // did nothing to the show window's still-true ghostsOn, so control kept
  // mirroring drift it thought it had turned off. Relay it like sceneGhosts
  // already does.
  const paintGhostBtns = () => {
    const b = document.getElementById('btnGhosts'), f = document.getElementById('fGhosts');
    if (b) { b.textContent = 'GHOSTS: ' + (ghostsOn ? 'ON' : 'OFF'); b.classList.toggle('off', !ghostsOn); }
    if (f) { f.textContent = 'GHOSTS: ' + (sceneGhosts ? 'ON' : 'OFF'); f.classList.toggle('off', !sceneGhosts); }
  };
  document.getElementById('btnGhosts').addEventListener('click', () => {
    ghostsOn = !ghostsOn;
    paintGhostBtns();
    if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('wallGhosts', ghostsOn);
  });
  // ghost hands INSIDE a focused scene — off by default (a scene starts still),
  // handy when you want the scene to demo itself while you work the rig
  document.getElementById('fGhosts').addEventListener('click', () => {
    sceneGhosts = !sceneGhosts;
    paintGhostBtns();
    // control window: sceneGhosts here only drives the LOCAL mirror's ghost
    // hands — relay it so the real show window's scene actually ghosts too.
    if (window.ELECTRON_ROLE === 'control' && window.electronAPI) window.electronAPI.sendShowControl('ghosts', sceneGhosts);
  });
  paintGhostBtns();
  document.getElementById('fVol').addEventListener('input', e => {
    const v = document.getElementById('volSlider');
    v.value = e.target.value;
    v.dispatchEvent(new Event('input'));
  });
  setInterval(syncFocus, 1200);
  syncFocus();
})();

/* ============================================================
   LIBRARY BAR — one grid, searched / sorted / filtered
   ============================================================ */
function applyLibrary() {
  const q = (document.getElementById('searchBox').value || '').trim().toLowerCase();
  const sort = document.getElementById('sortSel').value;
  const inSet = QUEUE.shared || QUEUE.list;
  const tiles = [...grid.children];
  const titleSorted = tiles.slice().sort((a, b) =>
    a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
  const tRank = new Map(titleSorted.map((t, i) => [t, i]));
  let shown = 0;
  tiles.forEach(tile => {
    const id = tile.dataset.pid;
    let show = !q || (tile.dataset.search || '').includes(q);
    if (show) {
      if (libFilter === 'queue') show = inSet.indexOf(id) >= 0;
    }
    tile.style.display = show ? '' : 'none';
    if (show) shown++;
    const src = +((id.match(/\d+/) || [999])[0]);
    const vers = (tile.querySelector('.vsel').options.length) || 1;
    let ord;
    // Queued scenes deliberately DO NOT jump to the front. Ticking a checkbox
    // used to re-sort the grid under the cursor, so the tile you just clicked
    // shot away and you could not confirm what you had done. The queue drawer
    // and the IN QUEUE chip are where you review the set; the wall holds still.
    if (sort === 'id') ord = src;
    else if (sort === 'title') ord = tRank.get(tile);
    else if (sort === 'ver') ord = -vers * 100 + src;
    else ord = loveRank(id) * 10 + src;   // most worked on first
    tile.style.order = Math.round(ord);
  });
  document.getElementById('libCount').textContent = shown + ' scenes';
}
document.getElementById('btnPreClose').addEventListener('click', () => PRE.close());
document.getElementById('preModal').addEventListener('click', e => { if (e.target.id === 'preModal') PRE.close(); });
// START goes even with warnings on the board — they are judgement calls, not blocks
document.getElementById('btnPreStart').addEventListener('click', () => { PRE.close(); QUEUE.play(true); });
// on a phone the rail folds: browsing needs search, not the whole cockpit
(() => {
  const rail = document.getElementById('librail'), tog = document.getElementById('railToggle');
  if (window.IS_MOBILE) rail.classList.add('folded');
  tog.addEventListener('click', () => {
    const folded = rail.classList.toggle('folded');
    tog.textContent = folded ? 'CONTROLS ▾' : 'CONTROLS ▴';
    tog.classList.toggle('off', folded);
  });
})();
document.getElementById('railPlay').addEventListener('click', () => QUEUE.play());
document.getElementById('btnBack').addEventListener('click', () => document.getElementById('btnClose').click());
document.getElementById('searchBox').addEventListener('input', applyLibrary);
document.getElementById('sortSel').addEventListener('change', applyLibrary);
document.querySelectorAll('.fchip').forEach(c => c.addEventListener('click', () => {
  libFilter = c.dataset.f === libFilter ? 'all' : c.dataset.f;
  if (libFilter !== 'queue') QUEUE.shared = null;
  syncChips();
  QUEUE.refresh();
}));

// SHOW CONTROL bindings (ADR-0008) — the second device's LEARN buttons and
// its own device picker, both inside the MAP popover.
(() => {
  const wire = (id, what) => {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', e => { e.stopPropagation(); NAV.arm(what); });
  };
  wire('btnNavPrev', 'prev'); wire('btnNavNext', 'next'); wire('btnNavSlots', 'slots');
  const sel = document.getElementById('navInSel');
  if (sel) sel.addEventListener('change', e => {
    const id = e.target.value;
    // 'any' keeps the old PADMAP behaviour (listen to every device); picking
    // one stores id AND name, because MIDIInput ids do not survive a replug
    const opt = e.target.selectedOptions[0];
    NAV.dev = id === 'all' ? null : { id, name: opt ? opt.dataset.name || '' : '' };
    NAV.save();
    if (window.ELECTRON_ROLE === 'control' && window.electronAPI?.sendShowControl) {
      // the show window owns the listening, so it needs the pick too
      window.electronAPI.sendShowControl('navDevice', NAV.dev);
    }
  });
  // keep the picker's options in step with whatever device list this window has
  setInterval(() => {
    if (!sel || !document.getElementById('mapPop').classList.contains('open')) return;
    const inputs = (window.ELECTRON_ROLE === 'control') ? midiRelay.inputs
      : (midi.access ? [...midi.access.inputs.values()].map(d => ({ id: d.id, name: d.name })) : []);
    const cur = NAV.dev ? NAV.dev.id : 'all';
    const sig = ['all', ...inputs.map(i => i.id)].join('|') + '#' + cur;
    if (sel.dataset.sig === sig) return;
    sel.dataset.sig = sig;
    sel.innerHTML = '<option value="all"' + (cur === 'all' ? ' selected' : '') + '>DEVICE: ANY</option>' +
      inputs.map(i => `<option value="${i.id}" data-name="${esc(i.name)}"${i.id === cur ? ' selected' : ''}>${esc(i.name)}</option>`).join('');
  }, 800);
  NAV.ui();
})();
// AUDIO IN bindings — device picker, CONNECT and SET REST, inside the MAP
// popover (same home as the hands' and SHOW CONTROL's own device pickers).
(() => {
  AUDIOIN.ui = function () {
    const inControl = window.ELECTRON_ROLE === 'control';
    const connected = inControl ? audioInRelay.connected : this.connected;
    const denied = inControl ? audioInRelay.denied : this.denied;
    const restSet = inControl ? audioInRelay.restSet : !!this.cal.rest;
    const device = inControl ? audioInRelay.device : this.device;
    const isAppAudio = connected && device?.id === 'app-audio';
    const b = document.getElementById('btnAudioConnect');
    if (b) {
      b.textContent = connected ? (isAppAudio ? 'AUDIO: MIC' : 'AUDIO: ON') : denied ? 'AUDIO: DENIED' : 'AUDIO: CONNECT';
      b.classList.toggle('off', !connected || isAppAudio);
    }
    const ab = document.getElementById('btnAudioAppCapture');
    if (ab) {
      ab.textContent = this._appAudioPending ? 'PICKING…' : isAppAudio ? 'APP AUDIO: ' + (device.label || 'ON') : 'CAPTURE APP AUDIO';
      ab.classList.toggle('learning', !!this._appAudioPending);
      ab.classList.toggle('off', isAppAudio);
    }
    const rb = document.getElementById('btnAudioRest');
    if (rb) { rb.textContent = this.restSampling ? 'SAMPLING…' : 'SET REST'; rb.classList.toggle('learning', this.restSampling); }
    // static status, not a live number — the Audio in panel under the stage
    // is the actual meter; a jittering percentage here just reads as noise
    const stat = document.getElementById('audioLevel');
    if (stat) stat.textContent = !connected ? '' : (isAppAudio ? 'capturing ' + (device.label || 'an app') : 'signal live') + (restSet ? '' : ' — REST not set');
  };
  document.getElementById('btnAudioConnect')?.addEventListener('click', () => AUDIOIN.connect());
  document.getElementById('btnAudioAppCapture')?.addEventListener('click', () => AUDIOIN.captureAppAudio());
  document.getElementById('btnAudioRest')?.addEventListener('click', () => AUDIOIN.startRest());
  const sel = document.getElementById('audioInSel');
  if (sel) sel.addEventListener('change', e => AUDIOIN.setDevice(e.target.value || null));
  setInterval(() => {
    if (!sel || !document.getElementById('mapPop').classList.contains('open')) return;
    const inControl = window.ELECTRON_ROLE === 'control';
    const devices = inControl ? audioInRelay.devices : AUDIOIN.devices;
    const cur = (inControl ? audioInRelay.device : AUDIOIN.device)?.id || '';
    const sig = devices.map(d => d.id).join('|') + '#' + cur;
    if (sel.dataset.sig === sig) return;
    sel.dataset.sig = sig;
    sel.innerHTML = '<option value=""' + (cur === '' ? ' selected' : '') + '>DEVICE: DEFAULT</option>' +
      devices.map(d => `<option value="${d.id}"${d.id === cur ? ' selected' : ''}>${esc(d.label)}</option>`).join('');
    AUDIOIN.ui();
  }, 800);
  AUDIOIN.ui();
})();
// MAP popover — the source's hardware bindings live here (library AND scene view)
(() => {
  const pop = document.getElementById('mapPop');
  for (const id of ['btnMap', 'fMap']) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', e => { e.stopPropagation(); pop.classList.toggle('open'); });
  }
  document.addEventListener('pointerdown', e => {
    if (pop.classList.contains('open') && !pop.contains(e.target) && e.target.id !== 'btnMap' && e.target.id !== 'fMap') pop.classList.remove('open');
  });
})();
// ESC closes the scene (when not exiting fullscreen)
window.addEventListener('keydown', e => {
  // The SECOND Escape path — part2_core.js has one too, and this one guards
  // on !document.fullscreenElement, which under Electron's NATIVE fullscreen
  // is always true. So in the show window this fired and dropped the
  // projectors to the library wall. Gate it the same way: CLOSE is a
  // control-window action.
  if (window.ELECTRON_ROLE === 'show') return;
  if (e.key === 'Escape' && focus.idx >= 0 && !document.fullscreenElement) {
    const c = document.getElementById('btnClose');
    if (c) c.click();
  }
});
// ←/→ flip between scenes without leaving the stage
window.addEventListener('keydown', e => {
  if (focus.idx < 0) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  // Show window: ←/→ walk the WALL (not even the set list) — a stray arrow
  // on the focused projector window jumped the show to an unrelated scene.
  // Note ↑/↓ deliberately still work here: those are the right hand, and
  // hands are the one thing this window is meant to accept.
  if (window.ELECTRON_ROLE === 'show') return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  // Nima: "left/right in control mode should go up and down the QUEUE but it
  // goes through a different list." It did — this handler walks the WALL in
  // its current sort/filter order, while the edge arrows next to it walk the
  // SET (step() -> showList()). Two controls that look identical, two
  // different lists. In the show console the set list is on screen and is
  // the thing these keys visibly move through, so route them to the same
  // step() the edges use. showList() falls back to wall order when the queue
  // is empty, so this never dead-ends.
  if (window.ELECTRON_ROLE === 'control' && window.SHOW) {
    if (e.key === 'ArrowRight') SHOW.next(); else SHOW.prev();
    return;
  }
  const tiles = [...grid.children]
    .filter(t2 => t2.style.display !== 'none')
    .sort((a2, b2) => (+a2.style.order || 0) - (+b2.style.order || 0));
  if (!tiles.length) return;
  const cur = famOf(PIECES[focus.idx]);
  let ci = tiles.findIndex(t2 => t2.dataset.pid === cur);
  ci = (ci + (e.key === 'ArrowRight' ? 1 : -1) + tiles.length) % tiles.length;
  const nt = tiles[ci];
  if (nt && nt.cur) { closeFocus(); openFocus(nt.cur.idx); }
});
// act chips — the journey's chapters in the top bar, clickable
function renderFocusActs(i) {
  const el = document.getElementById('oActs');
  if (!el) return;
  const d = PIECES[i];
  el.innerHTML = (d && d.acts)
    ? d.acts.map((a2, ai) => `<button data-a="${ai}">${a2}</button>`).join('')
    : '';
}
document.getElementById('oActs').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  setActLocal(+b.dataset.a);   // relays to the show window under Electron
});
// zen mode — in fullscreen, the chrome sleeps until the mouse moves
(() => {
  const ov = document.getElementById('overlay');
  let zt = null;
  const wake = () => {
    ov.classList.remove('zen');
    clearTimeout(zt);
    if (document.fullscreenElement) zt = setTimeout(() => ov.classList.add('zen'), 3500);
  };
  ov.addEventListener('pointermove', wake);
  document.addEventListener('fullscreenchange', wake);
})();
/* ============================================================
   SCENE DEEP LINKS — every scene has its own shareable URL.
   #scene=SRC-15.4 opens that exact version; #scene=SRC-15 opens
   the family's latest. Opening a scene writes the hash, closing
   clears it, and the LINK button copies the URL. #fav= links
   are untouched.
   ============================================================ */
(() => {
  const sceneFromHash = () => {
    const m = location.hash.match(/^#scene=([A-Za-z0-9.\-]+)/);
    if (!m) return -1;
    const id = m[1];
    // a versioned id (SRC-15.4) is exact; a bare family id (SRC-15) means LATEST
    if (/\.\d+$/.test(id)) return PIECES.findIndex(p => p.id === id);
    let best = -1, bv = 0;
    PIECES.forEach((p, pi) => { if ((p.family || p.id) === id && (p.ver || 1) >= bv) { bv = p.ver || 1; best = pi; } });
    if (best < 0) best = PIECES.findIndex(p => p.id === id);
    return best;
  };
  // wrap open/close so the URL always mirrors the stage
  const _open = openFocus, _close = closeFocus;
  let syncing = false;
  // part2_core.js's openFocus(i, fromRelay) passes fromRelay so a scene the
  // SHOW window opened for the control window (or vice versa) never bounces
  // back over show:openScene as though it were a fresh local click — every
  // wrapper in this file MUST keep taking a second arg and pass it through,
  // or a relayed open loses that flag partway down the chain and re-fires
  // the relay, which re-runs T.start/H.setup/makeInstance/MOut.bedOn and
  // visibly restarts the scene (and Live gets a spurious clock Start) on
  // every SHOWTIME auto-advance.
  window.openFocus = function (i, fromRelay) {
    _open(i, fromRelay);
    if (!syncing && PIECES[i]) {
      try { history.replaceState(null, '', location.pathname + '#scene=' + PIECES[i].id); } catch (e) {}
    }
  };
  window.closeFocus = function () {
    _close();
    if (!syncing && location.hash.startsWith('#scene=')) {
      try { history.replaceState(null, '', location.pathname); } catch (e) {}
    }
  };
  // arriving with a scene link → straight to the stage. Runs on the next tick
  // (after every openFocus wrapper below is installed), not after `load` — the
  // old 300ms-post-load wait was the library flashing before the scene came up.
  // The head sets html.deeplink at first paint to hold the wall invisible;
  // lifted here once the stage owns the screen (or the link was a dud).
  const boot = () => {
    const i = sceneFromHash();
    if (i >= 0) { syncing = true; window.openFocus(i); syncing = false;
      try { history.replaceState(null, '', location.pathname + '#scene=' + PIECES[i].id); } catch (e) {} }
    document.documentElement.classList.remove('deeplink');
  };
  setTimeout(boot, 0);
  // pasting a different scene link while the app is open
  window.addEventListener('hashchange', () => {
    const i = sceneFromHash();
    if (i >= 0 && i !== focus.idx) {
      syncing = true;
      if (focus.idx >= 0) window.closeFocus();
      window.openFocus(i);
      syncing = false;
    }
  });
  // (no LINK button: the URL carries #scene= on its own, and the address bar
  // is where anyone copying a link already looks)
})();
/* Per-scene sound routing: a queued scene can pin OUT to WEB / WEB+MIDI /
   MIDI ONLY for its stay on stage (set in the queue drawer). Scenes without
   an override — and every scene on close — fall back to the global toggle. */
(() => {
  const _open = window.openFocus, _close = window.closeFocus;
  window.openFocus = function (i, fromRelay) {
    _open(i, fromRelay);
    if (typeof MOut !== 'undefined' && PIECES[i]) MOut.applyMode(QUEUE.outFor(famOf(PIECES[i])));
  };
  window.closeFocus = function () {
    _close();
    if (typeof MOut !== 'undefined') MOut.applyMode(null); // back to the operator's choice
  };
})();
/* ============================================================
   SHOWTIME — installation player mode.
   Hover the stage → ⛶ appears → true fullscreen. In fullscreen:
   click the left/right screen edges to walk the SET LIST (starred
   scenes in wall order; nothing starred = whatever the wall shows),
   scenes auto-advance every 10 minutes, and a collapsible DBG tab
   verifies the input rig without leaving the show.
   ============================================================ */
(() => {
  const ov = document.getElementById('overlay');
  const fsBtn = document.getElementById('stageFS');
  if (!fsBtn) return;
  // Nima, testing live: the show window was showing the sidebar and every
  // other bit of library chrome, not just panels. Root cause: .fs on
  // #overlay is what the ENTIRE fullscreen show layout keys off (sidebar
  // hidden, stage takes the grid, DBG enabled — see part1_head.html's
  // #overlay.fs rules), and it only ever gets added by this fullscreenchange
  // listener — which requires a real document.fullscreenElement, which
  // Electron's native BrowserWindow.setFullScreen() (ticket #31) never
  // sets. So the show window never entered the fullscreen layout AT ALL
  // under Electron, not just "panels visible" — force it, unconditionally,
  // since the show window is always meant to be in this state (ADR-0003).
  if (window.ELECTRON_ROLE === 'show') ov.classList.add('fs');
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (ov.requestFullscreen) ov.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    ov.classList.toggle('fs', !!document.fullscreenElement || window.ELECTRON_ROLE === 'show');
    resetRotation();
  });
  // THE SET LIST — starring a card on the wall is how a scene makes the show
  // The queue, in queue order — not wall order. This is the whole point of it:
  // a set list is dramaturgy, and the old one was sorted by SRC number.
  // Empty queue still falls back to the wall so the app is never dead-ended.
  const showList = () => {
    const queued = QUEUE.list.map(id => QUEUE.tileFor(id)).filter(Boolean);
    if (queued.length) return queued;
    return [...grid.children]
      .filter(t2 => t2.style.display !== 'none')
      .sort((a2, b2) => (+a2.style.order || 0) - (+b2.style.order || 0));
  };
  const step = (dir) => {
    if (focus.idx < 0) return;
    const tiles = showList();
    if (!tiles.length) return;
    const cur = famOf(PIECES[focus.idx]);
    let ci = tiles.findIndex(t2 => t2.dataset.pid === cur);
    ci = (ci + dir + tiles.length) % tiles.length;
    const nt = tiles[ci];
    if (nt && nt.cur) { closeFocus(); openFocus(nt.cur.idx); }
    resetRotation();
  };
  // Manual walk of the set. In the show window the left/right 13% of the
  // PICTURE are click targets, and clicking that window is precisely how it
  // takes focus — so the gesture that focuses the projector output could
  // also skip a scene. CSS hides them there (part1_head.html); this is the
  // second lock, because unlike a debug tab a stray edge click costs a scene
  // mid-show. The control window gets them instead — its step() walks its
  // own mirror and relays the open through to the wall, which is where
  // manual navigation belongs now.
  const walk = dir => () => { if (window.ELECTRON_ROLE === 'show') return; step(dir); };
  document.getElementById('edgeL').addEventListener('click', walk(-1));
  document.getElementById('edgeR').addEventListener('click', walk(1));
  // each scene holds the stage for ITS OWN minutes (MIN in the queue drawer,
  // default 10) — any manual navigation resets the clock
  let rotT = null, rotAt = 0, rotMs = 0;
  function resetRotation() {
    clearTimeout(rotT); rotT = null; rotAt = 0; rotMs = 0;
    // Electron's native BrowserWindow.setFullScreen() (ticket #31) never
    // sets document.fullscreenElement — that's the web Fullscreen API's own
    // state, a different thing. Without this, SHOWTIME's dwell timer never
    // armed at all under Electron, in either window: the show would just
    // sit on the first scene forever. The show window is unconditionally
    // "live" once launched (ADR-0003 — always picture-only there), so its
    // role alone is enough; the control window never independently
    // arms this (it only mirrors what the show window is actually doing).
    if ((document.fullscreenElement || window.ELECTRON_ROLE === 'show') && focus.idx >= 0) {
      const ms = QUEUE.dwellMs(famOf(PIECES[focus.idx]));
      rotAt = Date.now() + ms; rotMs = ms;
      rotT = setTimeout(() => step(1), ms);
    }
  }
  /* The operator changed MIN on the scene that is ON STAGE right now (queue
     sync, below). resetRotation() would be wrong here: it restarts the clock
     from zero, so nudging MIN on the live scene would silently GRANT it a
     whole fresh stay — hold the up-arrow and a scene never ends. Re-derive
     the deadline from the new dwell instead, keeping the time already
     served; if the new MIN is already used up, advance now. */
  function retimeRotation() {
    if (!rotT || focus.idx < 0) return;
    const ms = QUEUE.dwellMs(famOf(PIECES[focus.idx]));
    if (ms === rotMs) return;
    const left = ms - (rotMs - (rotAt - Date.now()));   // new dwell minus time served
    clearTimeout(rotT);
    rotMs = ms;
    if (left <= 0) { rotT = null; rotAt = 0; rotMs = 0; step(1); return; }
    rotAt = Date.now() + left;
    rotT = setTimeout(() => step(1), left);
  }
  // rotationState() is how telemetry:tick reads the dwell clock without the
  // countdown having to live out here. rotAt is an absolute Date.now()
  // deadline on purpose: the control window is the same machine, so it can
  // interpolate a smooth countdown from one number instead of us shipping a
  // "seconds left" that would be stale the instant it arrived.
  window.SHOW = {
    next: () => step(1), prev: () => step(-1), resetRotation, retimeRotation,
    rotationState: () => ({ rotAt, rotMs }),
  };
  // DBG — the little truth window: is the rig actually feeling your hands?
  const dbg = document.getElementById('dbg'), body = document.getElementById('dbgBody');
  document.getElementById('dbgTab').addEventListener('click', () => dbg.classList.toggle('open'));
  let frames = 0, fps = 0, fpsT = performance.now();
  (function fpsLoop() { frames++; requestAnimationFrame(fpsLoop); })();
  setInterval(() => {
    const now = performance.now();
    fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now;
    // telemetry:tick reports this outward — in the control window the useful
    // number is the SHOW window's frame rate (the wall's), not the console's
    window.__showFps = fps;
    // #dbg is display:none unless #overlay.fs, which the show window forces
    // unconditionally (ADR-0003, above) but the control window never gets
    // (it is never really document.fullscreenElement) — so DBG belongs to
    // the control window instead, where the operator actually sits. The
    // matching CSS lives in part1_head.html, keyed off html.electron-control
    // on the root element; this just stops the loop early-returning under
    // that role so the panel has something live to show.
    const inControl = window.ELECTRON_ROLE === 'control';
    if (!dbg.classList.contains('open') || !(document.fullscreenElement || inControl)) return;
    const d = focus.idx >= 0 ? PIECES[focus.idx] : null;
    const st = focus.P && focus.P.state;
    const bar = (side) => {
      const v = chan[side].v;
      const n = Math.round(clamp(v) * 14);
      return '▮'.repeat(n) + '▯'.repeat(14 - n) + ' ' + v.toFixed(2) + ' ' + chan[side].mode.toUpperCase();
    };
    const secs = rotAt ? Math.max(0, Math.round((rotAt - Date.now()) / 1000)) : 0;
    const mmss = rotAt ? String(Math.floor(secs / 60)) + ':' + String(secs % 60).padStart(2, '0') : '—';
    // control window: midi.map/midi.cal are local and permanently inert
    // (real MIDI-in is show-only, ADR-0006) — build the line from the
    // relayed midiRelay.map instead, which already carries plain labels
    // ("CC1") rather than the raw {note,ch,dev} mapLabel() expects.
    const hand = side => {
      if (inControl) {
        const label = midiRelay.map[side];
        return label ? side + ':' + label : side + ':—';
      }
      const m = midi.map[side], cal = midi.cal[side];
      if (!m) return side + ':—';
      return side + ':' + mapLabel(m) +
        (cal ? '[' + cal.lo.toFixed(2) + '-' + cal.hi.toFixed(2) + (cal.inv ? ' INV' : '') +
          (cal.rest !== null && cal.rest !== undefined ? ' rest' + cal.rest.toFixed(2) : ' NO-REST') + ']' : '[uncal]');
    };
    const mapped = inControl ? (midiRelay.map.L || midiRelay.map.R) : (midi.map.L || midi.map.R);
    const inMap = mapped
      ? hand('L') + ' ' + hand('R')
      : 'unmapped (MAP → LEARN)';
    // MIDI OUT / CLK→LIVE: same relay as the SHOW CHECK rows and oOutState
    // above — MOut.mode/port/clock are local stand-ins in the control window.
    const outMode = inControl ? rigRelay.mode : MOut.mode;
    const outPortName = inControl ? rigRelay.portName : (MOut.port ? MOut.port.name : null);
    const clockOn = inControl ? rigRelay.clockOn : MOut.clock.on;
    const clockRunning = inControl ? rigRelay.clockRunning : MOut.clock.running;
    const bpm = inControl ? rigRelay.bpm : T.bpm;
    body.textContent =
      'SCENE  ' + (d ? d.id + ' · ' + d.title : '—') + (st && d && d.acts ? '\nACT    ' + d.acts[st.act] : '') +
      '\nL HAND ' + bar('L') +
      '\nR HAND ' + bar('R') +
      '\nMIDI IN  ' + inMap +
      '\nMIDI OUT ' + outMode.toUpperCase() + (outPortName ? ' → ' + outPortName : '') +
      '\nCLK→LIVE ' + (!clockOn ? 'OFF' : clockRunning ? 'DRIVING ' + bpm + ' BPM' : 'armed (no transport)') +
      // the dwell timer lives in the show window, not here — never fake a
      // countdown the control window doesn't actually own
      '\nNEXT SCENE ' + (inControl ? '— (show window)' : mmss) + '   FPS ' + fps + (inControl ? ' (mirror)' : '') +
      // the frame the scene is actually being handed — 1920x1200 / 1.60 is the show
      (focus.P ? '\nFRAME  ' + focus.P.w + '×' + focus.P.h + ' · ' +
        (focus.P.w / focus.P.h).toFixed(2) + (typeof PROJ !== 'undefined' && PROJ.on ? ' · PROJ' : '') +
        (typeof VIEW !== 'undefined' ? ' · ' + VIEW.mode.toUpperCase() : '') : '');
  }, 500);
})();
// live indicators: act chip highlight + now-playing role dots
setInterval(() => {
  if (focus.idx < 0) return;
  const fi = document.getElementById('frameInfo');
  if (fi && focus.P) {
    const txt = focus.P.w + '×' + focus.P.h + ' · ' + (focus.P.w / focus.P.h).toFixed(2) +
      (typeof PROJ !== 'undefined' && PROJ.on ? ' · PROJ' : ' · window');
    if (fi.textContent !== txt) fi.textContent = txt;
  }
  const el = document.getElementById('oActs');
  if (el && el.children.length && focus.P && focus.P.state) {
    const a2 = focus.P.state.act || 0;
    [...el.children].forEach((b, bi) => b.classList.toggle('on', bi === a2));
  }
}, 300);

/* ============================================================
   THE RIG RACK — the music work surface under the stage, laid
   out LIKE THE ABLETON MIXER (Lance: "a simple DAW sort of
   view — what's being triggered, what channel is which"): one
   row per channel 1-16 in numerical order, printed with the
   EXACT Live track name (rig.json `tracks`) plus the role that
   drives it. The row lights the moment anything triggers that
   channel — the association between instrument and trigger is
   the whole point. Read-only; click opens THE RIG reference.
   ============================================================ */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
(function () {
  const rack = document.getElementById('roleRack');
  if (!rack || typeof MOut === 'undefined') return;
  const DOCS = (typeof RIGDOC !== 'undefined' && RIGDOC.roles) ? RIGDOC.roles : {};
  const TRKS = (typeof RIGDOC !== 'undefined' && RIGDOC.tracks) ? RIGDOC.tracks : {};
  const DESC = {
    lead: 'melodic triggers — plucks, tones, runs', pad: 'sustained voice-led chords',
    bass: 'low anchors', arp: 'sequenced grid lines, gated by beat mode', bells: 'bells, chimes, the toll',
    texture: 'continuous-voice mirror + strikes',
    perc: 'kick 36 · hat 42 · snare 38 · open 46 · loop pad F2/53',
    sfx: 'one-shots + weather holds — 37 lightning · 38 thunder · 39/40 rain loops',
    bed: 'scene atmospheres — one held note (20+scene#) per scene'
  };
  const NN = n => ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][n % 12] + (Math.floor(n / 12) - 2);
  // every channel gets a color (Lance) — roles keep their role color, bench
  // channels get a stable spread hue, so the whole mixer reads in color
  const chCol = (ch, role) => role ? MOut.ROLE_COLORS[role] : `hsl(${(ch * 61) % 360},38%,64%)`;
  const roleAt = {};
  for (const r in MOut.roles) roleAt[MOut.roles[r]] = r;
  const rows = [];
  // HANDS lane first: the raw CC1/CC2 curves above the channels, so cause
  // (the gesture) sits directly over effect (the notes)
  const handsRow = document.createElement('div');
  handsRow.className = 'rkhands';
  handsRow.innerHTML = '<span class="rkch">·</span><span>HANDS L / R</span>';
  rack.appendChild(handsRow);
  // COLLAPSED = identity + liveness, EXPANDED = values + tools (the shell
  // law): a thin row is just CH · dot · Live track name; the lane beside it
  // is the activity display, so no readout text belongs on the row. Opening
  // a row reveals the toolbelt and turns its lane into a piano-roll band.
  for (let ch = 1; ch <= 16; ch++) {
    const role = roleAt[ch];
    const name = TRKS[ch] || (role ? role.toUpperCase() : '');
    if (!role && !TRKS[ch]) continue;
    const doc = role ? (DOCS[role] || {}) : {};
    const div = document.createElement('div');
    div.className = 'rkrow';
    div.title = (role
      ? ((doc.instrument ? doc.instrument + '\n\n' : '') + [DESC[role], doc.use].filter(Boolean).join('\n\n'))
      : 'No role routed here — nothing in the show triggers this track (yet).') +
      '\n\nDOT = one test note on this channel (outside Cmd+M). Click the row to expand.';
    div.innerHTML = `<span class="rkch">${ch}</span>
      <i style="background:${chCol(ch, role)}"></i>
      <span class="rki">${esc(name)}</span>${role ? `<em class="rkr">${role}</em>` : ''}`;
    rack.appendChild(div);
    const x = document.createElement('div');
    x.className = 'rkx'; x.hidden = true;
    x.innerHTML = `<span class="rkevt">—</span>
      <span class="rkxtools">
        ${role ? '<span class="rkcc" title="This channel\'s live CC74 (energy) value"><u></u></span>' : ''}
        ${role ? '<button class="rkm" title="For Cmd+M: click the knob in Live, then this — wiggles ONLY this channel\'s CC74.">MAP</button>' : ''}
      </span>`;
    rack.appendChild(x);
    rows.push({ ch, role, div, evts: x });
    // the colored DOT is the test button (Lance: simpler than a TEST chip)
    div.querySelector('i').addEventListener('click', e => {
      e.stopPropagation();
      AE.ensure(); if (!midi.access) connectMidi();
      if (!role) MOut.rawNote(ch);
      else if (role === 'perc') MOut.evDrum(36, 0.3);
      // sfx tests the RAIN slot (39) — its Live zones are narrowed to 39/40,
      // so a middle-C test would make a CORRECT setup look broken (it did)
      else if (role === 'sfx') MOut.evNote('sfx', 78.7, 0.25, 0, 2.5);
      else if (role === 'bed') { MOut.bedOn(48); setTimeout(() => MOut.bedOff(), 2500); }
      else MOut.evNote(role, role === 'bass' ? 65.4 : 261.6, 0.2, 0, 1.2);
    });
    const bm = x.querySelector('.rkm');
    if (bm) bm.addEventListener('click', e => {
      e.stopPropagation();
      AE.ensure(); if (!midi.access) connectMidi();
      const b = e.target;
      b.classList.add('learning'); b.textContent = 'CC74…';
      let n = 0;
      const iv = setInterval(() => {
        MOut.expr(role, (n % 2 ? 0.12 : 0.82) + Math.random() * 0.08);
        if (++n > 11) {
          clearInterval(iv); b.classList.remove('learning'); b.textContent = 'MAP';
          // always END OPEN — the wiggle must never leave a filter shut
          setTimeout(() => MOut.expr(role, 1), 130);
        }
      }, 120);
    });
    div.addEventListener('click', () => { x.hidden = !x.hidden; });
  }

  // ---- THE SPLIT (Lance): drag the console's top edge to trade picture
  // height for music-area height; the console scrolls inside itself.
  (function () {
    const drag = document.getElementById('conDrag');
    const ov = document.getElementById('overlay');
    if (!drag || !ov) return;
    try { const h = +localStorage.getItem('srcConH'); if (h > 100) ov.style.setProperty('--conH', h + 'px'); } catch (e) {}
    let startY = 0, startH = 0;
    const move = e => {
      const h = Math.max(120, Math.min(window.innerHeight * 0.75, startH + (startY - e.clientY)));
      ov.style.setProperty('--conH', h + 'px');
    };
    const up = () => {
      drag.classList.remove('dragging');
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
      try { localStorage.setItem('srcConH', parseInt(ov.style.getPropertyValue('--conH')) || ''); } catch (e) {}
    };
    drag.addEventListener('mousedown', e => {
      e.preventDefault();
      startY = e.clientY;
      startH = document.querySelector('.oconsole').getBoundingClientRect().height;
      drag.classList.add('dragging');
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    });
  })();

  // ---- PAUSE EVERYTHING (Lance): one button, whole performance ----------
  let pausedBed;
  const bp = document.getElementById('btnPauseAll');
  if (bp) bp.addEventListener('click', () => {
    if (!window.SHOWPAUSE) {
      pausedBed = MOut._bed;
      MOut.allOff();
      MOut.suspend = true;
      try { if (AE.ctx) AE.ctx.suspend(); } catch (e) {}
      window.SHOWPAUSE = true;
      bp.textContent = '▶ PLAY'; bp.classList.add('paused');
      document.getElementById('rackBox').classList.add('paused');
    } else {
      MOut.suspend = false;
      try { if (AE.ctx) AE.ctx.resume(); } catch (e) {}
      window.SHOWPAUSE = false;
      if (pausedBed !== undefined && pausedBed !== null) MOut.bedOn(pausedBed);
      // scenes re-register onModeMidi on their first resumed tick; poking it
      // shortly after resets their hold flags so weather/loop holds re-strike
      setTimeout(() => { try { if (MOut.onModeMidi) MOut.onModeMidi(); } catch (e) {} }, 400);
      bp.textContent = '⏸ PAUSE'; bp.classList.remove('paused');
      document.getElementById('rackBox').classList.remove('paused');
    }
  });

  // ---- slow refresh: liveness dots + expanded-panel readouts ------------
  setInterval(() => {
    if (!overlay.classList.contains('open')) return;
    const now = performance.now();
    const hot = {}, lastE = {};
    const L = MOut.log;
    for (let i = L.length - 1; i >= 0; i--) {
      const e = L[i];
      const age = now - e.p;
      if (age > -50 && age < Math.max(1200, e.durMs || 0)) hot[e.ch] = true;
      if (!lastE[e.ch] && age > -50) lastE[e.ch] = e;
    }
    for (const r of rows) {
      const on = !!hot[r.ch];
      r.div.classList.toggle('on', on);
      r.div.querySelector('i').style.boxShadow =
        on ? `0 0 6px 1px ${chCol(r.ch, r.role)}` : '';
      if (r.evts.hidden) continue;
      const le = lastE[r.ch];
      const evEl = r.evts.querySelector('.rkevt');
      if (le) {
        const hold = le.durMs > 100000 && now - le.p < le.durMs;
        const txt = 'last: ' + NN(le.note) + ' · v' + le.vel + (hold ? ' · HOLD' : '');
        if (evEl.textContent !== txt) evEl.textContent = txt;
      }
      if (r.role) {
        const st = MOut._exprState[r.role];
        const u = r.evts.querySelector('.rkcc u');
        if (u) u.style.width = st && st.v >= 0 ? Math.round(st.v / 1.27) + '%' : '0%';
      }
    }
  }, 250);

  // ---- THE TIMELINE (Lance: "exactly how Live looks") --------------------
  // One lane per row, MIDI scrolling left-to-right, newest at the right
  // edge. Collapsed lane = when notes hit or hold; expanded lane = a
  // piano-roll band (pitch on Y, note·vel labels, co-onsets <30ms ringed
  // red, CC74 ride underneath) — every band CLIPPED to its own rect so
  // nothing ever bleeds into a neighbor.
  const lanes = document.getElementById('rigLanes');
  const rackEl = document.getElementById('roleRack');
  const WIN = 14000;
  function drawLanes() {
    requestAnimationFrame(drawLanes);
    if (!lanes || !overlay.classList.contains('open')) return;
    const W = lanes.clientWidth | 0, Hh = rackEl.offsetHeight | 0;
    if (!W || !Hh) return;
    if (lanes.width !== W || lanes.height !== Hh) {
      lanes.width = W; lanes.height = Hh;
      lanes.style.height = Hh + 'px';   // CSS box = bitmap, or the drawing squashes
    }
    const g = lanes.getContext('2d');
    g.clearRect(0, 0, W, Hh);
    const now = performance.now();
    const x = p => W - (now - p) / WIN * W;
    // PRODUCER GRID: beats faint, bars stronger — musicians think in bars,
    // not seconds (fallback to seconds when no transport runs)
    g.lineWidth = 1;
    if (typeof T !== 'undefined' && T.running && AE.ctx) {
      const nowA = AE.ctx.currentTime;
      const perfOf = tA => now + (tA - nowA) * 1000;
      const firstBeat = Math.ceil((nowA - WIN / 1000 - T.t0) / T.beat);
      for (let k = firstBeat; ; k++) {
        const pAt = perfOf(T.t0 + k * T.beat);
        if (pAt > now) break;
        const xx = Math.round(x(pAt)) + 0.5;
        g.strokeStyle = k % 4 === 0 ? 'rgba(128,128,128,.22)' : 'rgba(128,128,128,.07)';
        g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, Hh); g.stroke();
      }
    } else {
      g.strokeStyle = 'rgba(128,128,128,.10)';
      for (let tt = now - (now % 1000); tt > now - WIN; tt -= 1000) {
        const xx = Math.round(x(tt)) + 0.5;
        g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, Hh); g.stroke();
      }
    }
    // the HANDS lane: raw CC1/CC2 curves over the channels — cause above effect
    if (handsRow) {
      const hy = handsRow.offsetTop + 2, hh = handsRow.offsetHeight - 4;
      g.save(); g.beginPath(); g.rect(0, hy, W, hh); g.clip();
      for (const [side, colr] of [['L', '#8fd48f'], ['R', '#c09aff']]) {
        const cl = MOut.ccLog[side];
        if (!cl || !cl.length) continue;
        g.strokeStyle = colr; g.globalAlpha = 0.8; g.beginPath();
        let st2 = false;
        for (const c of cl) {
          if (c.p < now - WIN) continue;
          const cx = x(c.p), cy = hy + hh - (c.v / 127) * hh;
          if (!st2) { g.moveTo(cx, cy); st2 = true; } else g.lineTo(cx, cy);
        }
        if (st2) g.stroke();
      }
      g.globalAlpha = 1; g.restore();
    }
    const L = MOut.log, byCh = {};
    for (let i = 0; i < L.length; i++) {
      const e = L[i];
      if (e.p > now + 60) continue;
      if (e.p + Math.max(150, e.durMs || 0) < now - WIN) continue;
      (byCh[e.ch] = byCh[e.ch] || []).push(e);
    }
    for (const r of rows) {
      const es = byCh[r.ch] || [];
      const col = chCol(r.ch, r.role);
      const rowY = r.div.offsetTop, rowH = r.div.offsetHeight;
      g.save();
      g.beginPath(); g.rect(0, rowY + 2, W, rowH - 4); g.clip();
      for (const e of es) {
        const sounding = Math.min(e.p + Math.max(150, e.durMs || 0), now);
        const x0 = Math.max(0, x(e.p)), x1 = Math.min(W, x(sounding));
        if (x1 <= x0) continue;
        // velocity reads as bar HEIGHT (drum-machine style), alpha assists
        const bh = 3 + (e.vel / 127) * (rowH - 9);
        g.globalAlpha = 0.35 + 0.55 * (e.vel / 127);
        g.fillStyle = col;
        g.fillRect(x0, rowY + (rowH - bh) / 2, Math.max(2, x1 - x0), bh);
      }
      g.restore(); g.globalAlpha = 1;
      if (!r.evts.hidden) {
        const bY = r.evts.offsetTop, bH = r.evts.offsetHeight;
        g.save();
        g.beginPath(); g.rect(0, bY, W, bH); g.clip();
        g.fillStyle = 'rgba(128,128,128,.05)';
        g.fillRect(0, bY, W, bH);
        if (es.length) {
          const pad = 12, rollH = bH - pad - 14;
          let lo = 127, hi = 0;
          for (const e of es) { if (e.note < lo) lo = e.note; if (e.note > hi) hi = e.note; }
          lo -= 2; hi += 2;
          if (hi - lo < 12) { const c = (hi + lo) / 2; lo = c - 6; hi = c + 6; }
          const yOf = n => bY + pad + rollH - ((n - lo) / (hi - lo)) * rollH;
          const sorted = es.slice().sort((a, b) => a.p - b.p);
          for (let i = 0; i < sorted.length; i++) {
            const e = sorted[i];
            const sounding = Math.min(e.p + Math.max(150, e.durMs || 0), now);
            const x0 = Math.max(0, x(e.p)), x1 = Math.min(W, x(sounding));
            if (x1 <= x0) continue;
            const y = yOf(e.note);
            g.globalAlpha = 0.35 + 0.6 * (e.vel / 127);
            g.fillStyle = col;
            g.fillRect(x0, y - 3, Math.max(2, x1 - x0), 6);
            g.globalAlpha = 1;
            const sim = (i > 0 && e.p - sorted[i - 1].p < 30) || (i < sorted.length - 1 && sorted[i + 1].p - e.p < 30);
            if (sim) { g.strokeStyle = '#ff5b5b'; g.strokeRect(x0 - 1, y - 4, Math.max(2, x1 - x0) + 2, 8); }
            if (x1 - x0 > 30 || e.durMs > 100000) {
              g.fillStyle = 'rgba(200,200,200,.85)';
              g.font = '8px monospace';
              g.fillText(NN(e.note) + '·' + e.vel, x0 + 3, Math.max(bY + 8, y - 5));
            }
          }
        }
        // the CC74 ride along the band's floor
        const elog = r.role && MOut._exprLog && MOut._exprLog[r.role];
        if (elog && elog.length) {
          g.strokeStyle = col; g.globalAlpha = 0.55; g.lineWidth = 1;
          g.beginPath();
          let started = false;
          for (const c of elog) {
            if (c.p < now - WIN) continue;
            const cx = x(c.p), cy = bY + bH - 3 - (c.v / 127) * 9;
            if (!started) { g.moveTo(cx, cy); started = true; } else g.lineTo(cx, cy);
          }
          if (started) { g.lineTo(W, bY + bH - 3 - ((MOut._exprState[r.role] || {}).v || 0) / 127 * 9); g.stroke(); }
          g.globalAlpha = 1;
        }
        g.restore();
      }
    }
  }
  requestAnimationFrame(drawLanes);
})();

/* ============================================================
   AUDIO IN MONITOR — Nima: "instead of showing THE RIG, on scenes with
   audio reactivity it should show something similar to the rig but show
   the data coming in from audio." Swaps in for the rack+lanes above
   whenever the open scene declares reg({audioIn:true}) — THE RIG is about
   Ableton/MIDI-out, which those scenes mostly don't touch; this shows the
   live signal actually driving the picture instead. Same rack+lanes
   shape, four continuous traces (level/bass/mid/treble) instead of a
   piano roll — there are no discrete notes here — plus a flash dot on
   each detected onset and a stereo pan indicator.
   ============================================================ */
(function () {
  const rack = document.getElementById('audioRack');
  const split = document.getElementById('audioSplit');
  const rigSplit = document.getElementById('rigSplit');
  const title = document.getElementById('rackTitle');
  const info = document.getElementById('rackInfo');
  if (!rack || !split || !rigSplit) return;
  const RIG_TITLE = 'The rig', RIG_INFO = info ? info.title : '';
  const AUDIO_TITLE = 'Audio in';
  const AUDIO_INFO = "AUDIO IN — the live signal driving this scene, not Ableton/MIDI-out (which it mostly doesn't touch).\nLEVEL/BASS/MID/TREBLE are the smoothed 0-100 values the scene reads; ONSET flashes on a detected hit; PAN is stereo balance, left/right.\nConnect and calibrate from MAP → Audio in.";

  const BARROWS = [['level', 'LEVEL'], ['bass', 'BASS'], ['mid', 'MID'], ['treble', 'TREBLE']];
  const bars = {};
  for (const [k, label] of BARROWS) {
    const div = document.createElement('div');
    div.className = 'arkrow';
    div.innerHTML = `<b>${label}</b><span class="arkbar"><u></u></span>`;
    rack.appendChild(div);
    bars[k] = div.querySelector('.arkbar u');
  }
  // PAN — bidirectional, fills from the center toward whichever side
  const panRow = document.createElement('div');
  panRow.className = 'arkrow';
  panRow.innerHTML = '<b>PAN</b><span class="arkbar"><u></u></span>';
  rack.appendChild(panRow);
  const panBar = panRow.querySelector('.arkbar u');
  // ONSET — a dot that flashes on a hit, not a continuous bar
  const onsetRow = document.createElement('div');
  onsetRow.className = 'arkrow';
  onsetRow.innerHTML = '<b>ONSET</b><span class="arkdot"></span>';
  rack.appendChild(onsetRow);
  const onsetDot = onsetRow.querySelector('.arkdot');
  let lastOnsetCount = AUDIOIN.onsetCount, onsetOffT = null;

  const stat = document.createElement('div');
  stat.id = 'audioStat';
  rack.appendChild(stat);

  const isAudioScene = () => focus.idx >= 0 && PIECES[focus.idx] && PIECES[focus.idx].audioIn;
  function syncPanel() {
    const on = isAudioScene();
    split.style.display = on ? 'flex' : 'none';
    rigSplit.style.display = on ? 'none' : 'flex';
    if (title) title.textContent = on ? AUDIO_TITLE : RIG_TITLE;
    if (info) info.title = on ? AUDIO_INFO : RIG_INFO;
  }
  // openFocus() has no "scene changed" hook to call out to — piggyback the
  // same 250ms cadence the rig rack's own liveness dots already poll at.
  setInterval(syncPanel, 250);
  syncPanel();

  function frameTick() {
    requestAnimationFrame(frameTick);
    if (!isAudioScene() || !overlay.classList.contains('open')) return;
    const inControl = window.ELECTRON_ROLE === 'control';
    // Live values are mirrored onto the shared AUDIOIN object regardless of
    // role — real analysis in the show window (part2e_audioin.js's tick()),
    // telemetry:tick's payload in the control window (above) — so reading
    // AUDIOIN directly here works either way; only connection/device status
    // still needs the separate audioInRelay (ADR-0006's split).
    for (const [k] of BARROWS) bars[k].style.width = Math.round(clamp(AUDIOIN[k]) * 100) + '%';
    const pv = clamp(AUDIOIN.pan, -1, 1);
    panBar.style.left = (pv < 0 ? 50 + pv * 50 : 50) + '%';
    panBar.style.width = Math.abs(pv) * 50 + '%';
    // A monotonic counter, not the raw onset value — in the control window
    // this only ever arrives via telemetry:tick's 4Hz samples, and a single
    // onset pulse can decay in ~150ms, well under that period. Comparing
    // counts survives the gap between samples; comparing raw values doesn't.
    if (AUDIOIN.onsetCount !== lastOnsetCount) {
      lastOnsetCount = AUDIOIN.onsetCount;
      onsetDot.classList.add('hit');
      clearTimeout(onsetOffT);
      onsetOffT = setTimeout(() => onsetDot.classList.remove('hit'), 180);
    }
    const connected = inControl ? audioInRelay.connected : AUDIOIN.connected;
    const deviceLabel = (inControl ? audioInRelay.device : AUDIOIN.device)?.label;
    const restSet = inControl ? audioInRelay.restSet : !!AUDIOIN.cal.rest;
    const txt = !connected ? 'not connected — <b>MAP</b> → Audio in to pick a source'
      : !restSet ? 'connected to <b>' + esc(deviceLabel || 'the default device') + '</b> — REST not set'
      : 'connected to <b>' + esc(deviceLabel || 'the default device') + '</b>';
    if (stat.dataset.sig !== txt) { stat.dataset.sig = txt; stat.innerHTML = txt; }
  }
  requestAnimationFrame(frameTick);

  // Same drawing shape as rigLanes above (grid + a scrolling ride line),
  // simplified to four continuous traces plus a tick mark per onset.
  const lanes = document.getElementById('audioLanes');
  const AWIN = 15000;
  const traceCol = { level: 'rgba(220,220,220,.75)', bass: '#ffb14a', mid: '#7fd8d8', treble: '#c09aff' };
  function drawAudioLanes() {
    requestAnimationFrame(drawAudioLanes);
    if (!lanes || !isAudioScene() || !overlay.classList.contains('open')) return;
    const W = lanes.clientWidth | 0, H = rack.offsetHeight | 0;
    if (!W || !H) return;
    if (lanes.width !== W || lanes.height !== H) { lanes.width = W; lanes.height = H; lanes.style.height = H + 'px'; }
    const g = lanes.getContext('2d');
    g.clearRect(0, 0, W, H);
    const now = performance.now();
    const x = p => W - (now - p) / AWIN * W;
    g.strokeStyle = 'rgba(128,128,128,.10)';
    for (let tt = now - (now % 1000); tt > now - AWIN; tt -= 1000) {
      const xx = Math.round(x(tt)) + 0.5;
      g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, H); g.stroke();
    }
    const hist = AUDIOIN.history;
    for (const key in traceCol) {
      g.strokeStyle = traceCol[key]; g.globalAlpha = key === 'level' ? 0.9 : 0.65; g.lineWidth = key === 'level' ? 1.5 : 1;
      g.beginPath();
      let started = false;
      for (const s of hist) {
        if (s.p < now - AWIN) continue;
        const cx = x(s.p), cy = H - 4 - clamp(s[key] || 0) * (H - 8);
        if (!started) { g.moveTo(cx, cy); started = true; } else g.lineTo(cx, cy);
      }
      if (started) g.stroke();
    }
    g.globalAlpha = 0.5; g.strokeStyle = '#fff'; g.lineWidth = 1;
    for (const s of hist) {
      if (s.p < now - AWIN || s.onset < 0.9) continue;
      const xx = Math.round(x(s.p)) + 0.5;
      g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx, H); g.stroke();
    }
    g.globalAlpha = 1;
  }
  requestAnimationFrame(drawAudioLanes);
})();

// COLLAPSIBLE GROUPS (Lance: treat the UX like a design tool) — every rail/
// sidebar group folds on its header; the choice persists per-browser.
(function () {
  let fold = {};
  try { fold = JSON.parse(localStorage.getItem('srcFold') || '{}'); } catch (e) {}
  document.querySelectorAll('#librail .sgroup, #sidebar .sgroup').forEach(g => {
    const h = g.querySelector('h5');
    if (!h) return;
    const key = h.textContent.trim().split('\n')[0].slice(0, 20);
    if (fold[key]) g.classList.add('fold');
    h.addEventListener('click', e => {
      if (e.target !== h) return; // controls inside the header keep working
      // SCROLL-ANCHOR (Lance: "the header moves when it expands — bad UX"):
      // whatever reflows, the header you clicked stays under your cursor.
      const sc = g.closest('#sidebar') || g.closest('#librail') || document.scrollingElement;
      const before = h.getBoundingClientRect().top;
      g.classList.toggle('fold');
      const after = h.getBoundingClientRect().top;
      if (sc) sc.scrollTop += after - before;
      fold[key] = g.classList.contains('fold');
      try { localStorage.setItem('srcFold', JSON.stringify(fold)); } catch (err) {}
    });
  });
})();

QUEUE.boot();
// VIEW dropdown — the discoverable face of the view modes (V still cycles)
(() => {
  const vs = document.getElementById('viewSel');
  if (!vs) return;
  setView(VIEW.mode); // through setView, not a raw assignment — it also sets the
                      // scrimmode class that reveals the vantage chips
  vs.addEventListener('change', () => { setView(vs.value); vs.blur(); });
})();
// PERFORMANCE MODE — fullscreen shows the picture ONLY by default; the
// PANELS pill (next to DBG) or H brings the MIDI/hands/console panels in
// for debugging. The choice persists across scenes and visits.
(() => {
  // ADR-0003: the show window is always picture-only — PANELS doesn't
  // apply there at all, full stop, not even toggleable. Ignore whatever
  // srcPanels says (it's shared, ticket #30 — someone debugging in the
  // control window must never be able to bring chrome onto the real show).
  const isShow = window.ELECTRON_ROLE === 'show';
  let panels = false;
  if (!isShow) { try { panels = localStorage.getItem('srcPanels') === '1'; } catch (e) {} }
  const apply = () => overlay.classList.toggle('perf', !panels); // .perf only bites under .fs
  const flip = () => {
    if (isShow) return;
    panels = !panels;
    try { localStorage.setItem('srcPanels', panels ? '1' : '0'); } catch (e) {}
    apply();
  };
  // starting a show must not inherit yesterday's debugging layout
  window.setPanels = on => { panels = isShow ? false : !!on; apply(); };
  const pt = document.getElementById('panelTab');
  if (pt) pt.addEventListener('click', flip);
  window.addEventListener('keydown', e => {
    if (isShow) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (focus.idx < 0 || !overlay.classList.contains('fs')) return;
    if (e.key === 'h' || e.key === 'H') flip();
  });
  apply();
})();
// theme — light matches the camper portal (default); dark is stage mode
(() => {
  let th = 'light';
  try { th = localStorage.getItem('srcTheme') || 'light'; } catch (e) {}
  const apply = () => {
    document.body.classList.toggle('light', th === 'light');
    for (const id of ['btnTheme', 'btnThemeF']) {
      const b = document.getElementById(id);
      if (b) { b.textContent = th === 'light' ? '◐' : '◑'; b.title = 'Theme: ' + th + ' — click to switch'; }
    }
  };
  const flip = () => {
    th = th === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('srcTheme', th); } catch (e) {}
    apply();
  };
  for (const id of ['btnTheme', 'btnThemeF']) {
    const b = document.getElementById(id);
    if (b) b.addEventListener('click', flip);
  }
  apply();
})();
applyLibrary();

// ADR-0007 superseded ADR-0005's MIRROR governor and it is gone with it.
// The governor existed because the control window ran its own copy of every
// scene and that doubled render cost on the show machine; the control window
// no longer renders scenes at all — its picture is a video feed of the show
// window — so there is nothing left to throttle and no pill to throttle it
let last = 0, fc = 0;
function frame(ts) {
  const t = ts / 1000;
  const dt = Math.min(0.05, last ? t - last : 0.016);
  last = t;
  // PAUSE EVERYTHING (Lance): the whole performance freezes — no input, no
  // stepping, no audio ticks — while the console's PLAY brings it all back.
  if (window.SHOWPAUSE) { requestAnimationFrame(frame); return; }
  applyKeys(dt);
  updateChannels(t, dt);
  if (typeof AUDIOIN !== 'undefined') AUDIOIN.tick(dt);
  // NEAR = MORE lives HERE and only here: channels are hand space (0 = at
  // the source), scenes read intensity — leaning in = 1. Beams, ghosts and
  // the DBG bars stay truthful to the hands.
  const inp = {
    L: 1 - chan.L.v, R: 1 - chan.R.v, summon: SUMMON.active ? 1 : 0, summonCharge: SUMMON.charge,
    audio: { level: AUDIOIN.level, bass: AUDIOIN.bass, mid: AUDIOIN.mid, treble: AUDIOIN.treble, onset: AUDIOIN.onset, pan: AUDIOIN.pan,
             kick: AUDIOIN.kick, now: (AUDIOIN.ctx && !AUDIOIN._testOverride) ? AUDIOIN.ctx.currentTime : performance.now() / 1000 },
  };
  drawWidget(document.getElementById('widgetTop'), t);
  if (overlay.classList.contains('open')) {
    drawWidget(document.getElementById('widgetFocus'), t);
    refreshSliders();
    if (typeof MOut !== 'undefined') MOut.tickCC(inp);
  }
  if (focus.P) {
    const P = focus.P;
    if (typeof H !== 'undefined' && T.running) {
      H.update();
      const hud = H.keyLabel + ' · ' + H.label + ' · BAR ' + (T.bar() + 1) + ' · ' + T.bpm + ' BPM';
      const el = document.getElementById('oChord');
      if (el && el.textContent !== hud) el.textContent = hud;
    }
    try {
      {
        P.def.step(P, dt, t, inp);
        P.def.draw(P, P.g, P.w, P.h, t, inp);
        // Nima, review fix: this composite block (drawImage/ghost-pass/
        // bloomTo/edgeFadeCtx/SCRIMVIEW.render) used to sit OUTSIDE the
        // doStep gate above, so the control window's MIRROR governor
        // (ADR-0005) throttled step/draw but still ran the expensive part —
        // bloom, for most scenes — every real frame regardless. Moving it in
        // here means a throttled tick only composites once per step; the
        // canvas simply keeps its last composited frame in between, which
        // is the whole point of throttling in the first place.
        // composite scene → display per the VIEW mode (dropdown / V key)
        const fg = focus.fctx;
        if (fg) {
          const vm = (typeof VIEW !== 'undefined') ? VIEW.mode : 'flat';
          const scrimOK = window.SCRIMVIEW && typeof THREE !== 'undefined';
          if ((vm === 'scrim' || vm === 'scrim3d') && scrimOK) {
            SCRIMVIEW.render(fg, P, t);   // the frame thrown into The Cave
          } else {
            fg.drawImage(P.canvas, 0, 0);
            if (vm === 'double') {
              // the second projector's ghost — cloned signal, worst-case
              // misregistration of ~0.8% of the frame width
              fg.save();
              fg.globalCompositeOperation = 'lighter'; fg.globalAlpha = 0.45;
              fg.drawImage(P.canvas, Math.max(2, Math.round(P.w * 0.008)), 0);
              fg.restore();
            }
            const fx = P.def.fx;
            if (fx) {
              if (fx.bloom) bloomTo(fg, P.canvas, P.w, P.h, fx.bloom);
              if (fx.edge) edgeFadeCtx(fg, P.w, P.h);
            }
          }
        }
      }
    } catch (e) { console.error(P.def.id, e); }
    if (focus.voice && AE.on) { try { focus.voice.tick(inp, dt); } catch (e) {} }
  } else if (focus.idx < 0) {
    // Only the LIBRARY WALL renders here. Before ADR-0007, "no focus.P" and
    // "no scene open" were the same condition; in the control window they no
    // longer are — a scene IS open, it just has no local instance — and
    // without this guard the wall's 43 tiles would render behind it.
    fc++;
    insts.forEach((P, i) => {
      if (!P.visible || (fc + i) % 2) return;
      try {
        P.def.step(P, dt * 2, t, inp);
        P.def.draw(P, P.g, P.w, P.h, t, inp);
      } catch (e) { console.error(P.def.id, e); }
    });
  }
  // ADR-0007: the console's clock is the thing that must be smooth, so it
  // repaints every frame off tele.rotAt. textContent only, never innerHTML —
  // that list carries click targets, and rebuilding DOM at 60fps is exactly
  // what made SHOW CHECK's buttons flicker.
  if (window.ELECTRON_ROLE === 'control' && typeof QUEUE !== 'undefined') QUEUE.paintShowPanel();
  requestAnimationFrame(frame);
}
// The show window's global controls, driven from the control window over
// show:control — sound, OUT routing, clock, MIDI OUT port, scene ghosts,
// reseed and volume all originate as clicks/drags in the control window's
// UI (the show window is picture-only, nothing to click there), so this is
// the one place the show window ever acts on them. Placed after QUEUE.boot()
// and the RIG/focus wiring above (so MOut/T/AE/startVoice/focus/sceneGhosts
// all already exist) but before the loop starts.
// Note: the 'R' reseed key itself lives in part2_core.js (not this file) —
// it is a local show-window keypress, not relayed; only the drawer/queue's
// explicit RESEED path (if any) would use this 'reseed' kind.
// Show window: the performance queue, pushed from control on every edit
// (QUEUE.relay(), above). This is what the show ACTUALLY runs on —
// SHOWTIME's running order (showList), each scene's dwell (QUEUE.dwellMs),
// its OUT override (QUEUE.outFor) and PADMAP's slot->scene map all read
// QUEUE live, so replacing list/cfg here is the whole sync.
//
// Deliberately NOT calling QUEUE.refresh(): here QUEUE is DATA, never UI.
// refresh() re-renders the drawer, repaints every tile badge and re-runs
// applyLibrary() over all 43 scenes — real DOM work, on the machine driving
// the projectors, triggered by an operator nudging a number field. Nobody
// can see this window's wall anyway (it is picture-only by design), so the
// badges would be decorating a screen no human looks at, at the price of a
// frame hitch in the middle of a show.
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onQueue) {
  window.electronAPI.onQueue(q => {
    if (!q) return;
    // What the scene on stage is currently promised, BEFORE we swap the
    // queue out — the two things that have to be re-applied live rather
    // than at the next scene change.
    const fam = focus.idx >= 0 ? famOf(PIECES[focus.idx]) : null;
    const outWas = fam ? QUEUE.outFor(fam) : null;
    QUEUE.list = Array.isArray(q.list) ? q.list.filter(Boolean) : [];
    QUEUE.cfg = (q.cfg && typeof q.cfg === 'object') ? q.cfg : {};
    // No save() — control already persisted this, and writing it back from
    // here would make the show window look like a second author of a queue
    // it is not allowed to edit.
    if (!fam) return;
    // MIN changed on the live scene: keep the time already served.
    if (window.SHOW) SHOW.retimeRotation();
    // OUT changed on the live scene: the drawer's own handler applies this
    // to the CONTROL window's MOut, which routes nothing. This is the one
    // that reaches Ableton.
    const outNow = QUEUE.outFor(fam);
    if (outNow !== outWas && typeof MOut !== 'undefined') MOut.applyMode(outNow);
  });
}
if (window.ELECTRON_ROLE === 'show' && window.electronAPI?.onShowControl) {
  window.electronAPI.onShowControl(({ kind, value }) => {
    if (kind === 'sound') {
      AE.on = !!value;
      const b = document.getElementById('btnSound');
      if (b) { b.textContent = AE.on ? 'SOUND: ON' : 'SOUND: OFF'; b.classList.toggle('off', !AE.on); }
      if (AE.on) { AE.ensure(); startVoice(); }
      else if (focus.voice) { try { focus.voice.stop(); } catch (e) {} focus.voice = null; }
    } else if (kind === 'outMode') MOut.setMode(value);
    else if (kind === 'clock') MOut.clockSet(!!value);
    else if (kind === 'outPort') MOut.selectPortByName(value);
    else if (kind === 'ghosts') sceneGhosts = !!value;
    else if (kind === 'wallGhosts') ghostsOn = !!value;
    else if (kind === 'navDevice') { NAV.dev = value || null; NAV.save(); NAV.relay(); }
    // calibration, driven from the console (ADR-0006's last show-only gap).
    // The results ride home on the existing midi:devices relay.
    else if (kind === 'setRest') startRest();
    else if (kind === 'invert') setInvert(value);
    else if (kind === 'calClear') clearCal();
    else if (kind === 'audioinRest') AUDIOIN.startRest();
    // reseed carries the SEED control just used, so the mirror and the wall
    // land on the same picture instead of two different random ones
    else if (kind === 'reseed') { if (focus.P) focus.P.reinit(typeof value === 'number' ? value : (Math.random() * 1e9) | 0); }
    else if (kind === 'act') {
      const d = focus.idx >= 0 ? PIECES[focus.idx] : null;
      if (d && d.setAct && focus.P) d.setAct(focus.P, value);
    }
    else if (kind === 'vol') {
      const v = document.getElementById('volSlider');
      if (v) { v.value = value; v.dispatchEvent(new Event('input')); }
    }
  });
}
requestAnimationFrame(frame);
