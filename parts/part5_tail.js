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

/* PAD MAP — a 4×4 pad controller walks the queue, so scenes switch from the
   source with no computer touch. LEARN once: hit the controller's PAD 1
   (bottom-left) and its 16 consecutive notes become queue slots 1–16 in
   running order. Learned rather than hard-coded because pad controllers
   disagree about their base note (the M-VAVE's moves with its presets).
   Device- and channel-filtered, and the hand system never sees notes at
   all (part2_core routes only note-ons here) — so pads and hand sensors
   can never collide. Persists per-browser like the hand calibration. */
const PADMAP = {
  base: null, learn: false,
  load() { try { this.base = JSON.parse(localStorage.getItem('srcPadMap') || 'null'); } catch (e) { this.base = null; } },
  save() { try { localStorage.setItem('srcPadMap', JSON.stringify(this.base)); } catch (e) {} },
  onNote(p) {
    if (this.learn) {
      this.base = { note: p.note, ch: p.ch, dev: p.dev };
      this.learn = false; this.save(); this.ui();
      return;
    }
    if (!this.base || p.dev !== this.base.dev || p.ch !== this.base.ch) return;
    const slot = p.note - this.base.note;
    if (slot >= 0 && slot < 16) this.go(slot);
  },
  go(slot) {
    const id = QUEUE.list[slot];
    if (!id) return;
    const tile = QUEUE.tileFor(id);
    if (!tile || !tile.cur) return;
    const already = focus.idx >= 0 && famOf(PIECES[focus.idx]) === id;
    if (!already) {
      if (focus.idx >= 0) closeFocus();
      openFocus(tile.cur.idx);
    }
    if (window.SHOW) SHOW.resetRotation();
  },
  toggleLearn() { this.learn = !this.learn; this.ui(); },
  ui() {
    const b = document.getElementById('btnPadLearn');
    if (!b) return;
    b.textContent = this.learn ? 'HIT PAD 1…' : this.base ? 'PADS ✓' : 'PAD LEARN';
    b.classList.toggle('learning', this.learn);
  }
};
PADMAP.load();
window.PADMAP = PADMAP;

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
  titleOf(id) {
    const t = this.tileFor(id);
    return t ? (t.querySelector('h3').textContent || id) : id + ' (not on this build)';
  },
  // PLAY starts the performance: first queued scene, picture only, fullscreen
  // on the chosen display. If something is actually broken (no audio) it opens
  // the check instead of starting a silent show.
  play(force) {
    if (!force && typeof PRE !== 'undefined' && PRE.worst() === 'bad') {
      document.getElementById('queuePop').classList.remove('open');
      PRE.open();
      return;
    }
    const first = this.list.find(id => this.tileFor(id));
    const tile = first ? this.tileFor(first) : null;
    if (tile && tile.cur) { closeFocus(); openFocus(tile.cur.idx); }
    else if (focus.idx < 0) openFocus(0);
    document.getElementById('queuePop').classList.remove('open');
    this.wake(false);
    if (typeof enterShow === 'function') enterShow();
  },
  refresh() {
    const btn = document.getElementById('btnQueue');
    if (btn) { btn.textContent = 'QUEUE ' + this.list.length; btn.classList.toggle('off', !this.list.length); }
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
    document.getElementById('btnPadLearn').addEventListener('click', () => PADMAP.toggleLearn());
    PADMAP.ui();
    document.getElementById('btnSetPublish').addEventListener('click', () => this.publish());
    document.getElementById('btnQueueClear').addEventListener('click', () => this.clear());
    document.getElementById('btnQueueLink').addEventListener('click', () => this.link());
    document.getElementById('btnQueuePlay').addEventListener('click', () => this.play());
    document.getElementById('btnQueueCheck').addEventListener('click', () => { pop.classList.remove('open'); this.wake(false); PRE.open(); });
    document.getElementById('btnQueueFocus').addEventListener('click', () => {
      if (focus.idx >= 0) this.toggle(famOf(PIECES[focus.idx]));
    });
    this.refresh();
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
const SCREENS = {
  details: null, chosen: null, denied: false,
  supported() { return typeof window.getScreenDetails === 'function'; },
  label(sc) { return (sc.label || '') + ' ' + sc.width + '×' + sc.height + (sc.isPrimary ? ' (primary)' : ''); },
  load() { try { this.chosen = localStorage.getItem('srcShowScreen'); } catch (e) {} },
  pick(label) {
    this.chosen = label || null;
    try {
      if (label) localStorage.setItem('srcShowScreen', label);
      else localStorage.removeItem('srcShowScreen');
    } catch (e) {}
  },
  async probe() {
    if (!this.supported() || this.details) return this.details;
    try { this.details = await window.getScreenDetails(); }
    catch (e) { this.denied = true; }
    // Default to the display that is almost certainly the projector: the
    // external, non-primary one. Landing the show on the built-in screen is
    // the mistake this whole row exists to prevent.
    if (this.details && !this.target()) {
      const ext = this.details.screens.find(sc => !sc.isInternal && !sc.isPrimary) ||
                  this.details.screens.find(sc => !sc.isInternal);
      if (ext) this.pick(this.label(ext));
    }
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
    this.timer = setInterval(() => this.render(), 600);
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
    const ctxOn = AE.ctx && AE.ctx.state === 'running';
    r.push({ k: 'audio', sec: 'show', label: 'Sound', lvl: ctxOn ? 'ok' : 'bad',
      txt: !AE.on ? 'muted — SOUND is OFF in the left rail'
        : !AE.ctx ? 'no audio context yet — browsers need one click before they make noise'
        : AE.ctx.state !== 'running' ? 'suspended (' + AE.ctx.state + ') — one click wakes it'
        : 'running at ' + (AE.ctx.sampleRate / 1000).toFixed(1) + ' kHz',
      fix: ctxOn ? null : ['WAKE AUDIO', () => {
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

    r.push({ k: 'screen', sec: 'show', label: 'Display',
      lvl: SCREENS.aimedInternal() ? 'warn' : 'ok',
      txt: this.screenText(), screenPicker: true });

    const bound = (midi.map.L ? 1 : 0) + (midi.map.R ? 1 : 0);
    r.push({ k: 'hands', sec: 'show', label: 'Hands', lvl: !midi.access ? 'warn' : bound === 2 ? 'ok' : 'warn',
      txt: !midi.access ? 'MIDI not connected — mouse, edge lasers and W/S · ↑/↓ still play the wall'
        : bound === 2 ? 'L and R both bound (' + mapLabel(midi.map.L) + ' · ' + mapLabel(midi.map.R) + ')'
        : bound === 1 ? 'only ' + (midi.map.L ? 'L' : 'R') + ' is bound — the other hand is dead'
        : 'MIDI on, but neither hand is bound yet',
      fix: !midi.access ? ['CONNECT', () => connectMidi()]
        : ['MAP HANDS', () => { this.close(); document.getElementById('mapPop').classList.add('open'); }] });

    const cal = ['L', 'R'].map(sd => midi.cal[sd]);
    const rested = cal.filter(c => c && c.rest !== null && c.rest !== undefined).length;
    r.push({ k: 'cal', sec: 'rig', label: 'Calibration', lvl: !midi.access ? 'ok' : rested === 2 ? 'ok' : 'warn',
      txt: !midi.access ? 'not needed without hardware'
        : rested === 2 ? 'both hands ranged and rested — idle detection is live'
        : 'REST not set' + (rested ? ' on one hand' : '') + ' — a sensor that streams all night will read as PLAYING forever, so scenes never go idle',
      fix: midi.access ? ['SET REST', () => startRest()] : null });

    const out = MOut.mode !== 'web';
    r.push({ k: 'out', sec: 'rig', label: 'Ableton', lvl: out && MOut.port ? 'ok' : 'warn',
      txt: !out ? 'WEB AUDIO only — Ableton will not hear the wall'
        : !MOut.port ? 'MIDI out on, but no port selected'
        : 'sending to ' + MOut.port.name,
      fix: out ? null : ['SEND MIDI', () => { AE.ensure(); MOut.setMode('both'); }] });

    r.push({ k: 'clock', sec: 'rig', label: 'Tempo', lvl: !out ? 'ok' : MOut.clock.on ? 'ok' : 'warn',
      txt: !out ? 'browser transport only' :
        !MOut.clock.on ? 'clock out OFF — someone has to retype Live’s tempo on every scene change'
        : MOut.clock.running ? 'driving Live at ' + T.bpm + ' BPM — this app is the tempo master'
        : 'clock out armed — drives Live from the moment a scene opens (Live: port Sync on, EXT lit)',
      fix: (out && !MOut.clock.on) ? ['CLOCK ON', () => MOut.clockSet(true)] : null });
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
      note.textContent = SCREENS.supported()
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
  if (!midi.access) return;
  const outs = [...midi.access.outputs.values()];
  MOut.port = outs[+e.target.value] || null;
  try { if (MOut.port) localStorage.setItem('srcOutPort', MOut.port.name); } catch (err) {}
});
document.getElementById('btnClock').addEventListener('click', () => MOut.clockSet(!MOut.clock.on));
setInterval(() => MOut.refreshUI(), 1500);
// act hotkeys — keys 1-4 jump acts inside a focused journey piece (smooth-fades there)
window.addEventListener('keydown', e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (focus.idx < 0 || !focus.P) return;
  const d = PIECES[focus.idx];
  if (d && d.setAct && e.key >= '1' && e.key <= '4') d.setAct(focus.P, +e.key - 1);
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
});
// RIG panel
(function () {
  const rows = document.getElementById('rigRows');
  const DESC = {
    lead: 'melodic triggers — plucks, tones, runs', pad: 'sustained voice-led chords',
    bass: 'low anchors', arp: 'sequenced arps (Night Circuit)', bells: 'bells, chimes, sparkles',
    texture: 'reserved for texture layers',
    perc: 'kick 36 · hat 37/42 · snare 38 · clap 39 · toms 43/45 · open 46 · crash 49 · perc 51',
    sfx: 'one-shot events — 36 ignition · 37 lightning · 38 thunder · 39 rain',
    bed: 'scene atmospheres — each scene HOLDS note 20+scene# while open (SRC-18 → 38)'
  };
  /* The panel is the racking walk's DASHBOARD, and it matures with the rig:
     rows sit in CHANNEL ORDER (mirroring the Live set's mixer left-to-right),
     each names the instrument rig.json says is actually on that channel, and
     an entry still carrying "(proposed)"/TBD renders dimmed as a DRAFT.
     Solidify a patch → record it in rig.json → rebuild → the row turns real.
     The role's generic job + its `use` notes live in the row's tooltip. */
  const docFor = r => ((typeof RIGDOC !== 'undefined' && RIGDOC.roles && RIGDOC.roles[r]) || {});
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function renderRig() {
    rows.innerHTML = '';
    const order = Object.keys(MOut.roles).sort((a, b) => MOut.roles[a] - MOut.roles[b]);
    for (const role of order) {
      const inst = docFor(role).instrument || '';
      const draft = !inst || /\(proposed\)|TBD/i.test(inst);
      const row = document.createElement('div');
      row.className = 'rigrow' + (draft ? ' draft' : '');
      row.title = [DESC[role], docFor(role).use].filter(Boolean).join('\n\n');
      row.innerHTML = `<div class="swatch" data-role="${role}" style="background:${MOut.ROLE_COLORS[role]}" title="Click: send one test note on this channel — does the right Ableton track answer?"></div>
        <label>${role}</label>
        <select data-role="${role}">${Array.from({ length: 16 }, (_, i) =>
          `<option value="${i + 1}"${i + 1 === MOut.roles[role] ? ' selected' : ''}>CH ${i + 1}</option>`).join('')}</select>
        <span>${esc(inst || DESC[role] || '')}</span>
        <button class="rping" title="For Live's MIDI mapping: press Cmd+M in Live, click the knob you want this layer's energy on, then press MAP — it wiggles ONLY this channel's CC74 for a second, so the mapping can't be stolen by the hand streams.">MAP</button>
        <span class="rstate">${draft ? 'DRAFT' : 'LOADED'}</span>`;
      rows.appendChild(row);
      // one-click wiring checks, no console required:
      // swatch = a single test note on this role's channel (use OUTSIDE Live's
      // Cmd+M mode); MAP = a CC74-only wiggle burst FOR Cmd+M mode — values
      // alternate low/high so Live detects the sweep, and nothing else sends.
      row.querySelector('.swatch').addEventListener('click', () => {
        AE.ensure(); if (!midi.access) connectMidi();
        if (role === 'perc') MOut.evDrum(36, 0.3);
        // sfx tests the RAIN slot (note 39) — its Live zones are narrowed to
        // 39/40, so a middle-C test note would make a CORRECT setup look
        // broken (it did, for Lance); bed tests a real scene-atmosphere note
        else if (role === 'sfx') MOut.evNote('sfx', 78.7, 0.25, 0, 2.5);
        else if (role === 'bed') MOut.bedOn(48), setTimeout(() => MOut.bedOff(), 2500);
        else MOut.evNote(role, role === 'bass' ? 65.4 : 261.6, 0.2, 0, 1.2);
      });
      row.querySelector('.rping').addEventListener('click', e => {
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
      row.querySelector('select').addEventListener('change', e => {
        MOut.allOff();
        MOut.roles[role] = +e.target.value;
        // persist as a diff against rig.json's map, so untouched roles keep
        // following the doc across rebuilds while this remap survives reloads
        try {
          const doc = (typeof RIGDOC !== 'undefined' && RIGDOC.roles) || {};
          const ov = {};
          for (const r in MOut.roles) if (!doc[r] || MOut.roles[r] !== doc[r].ch) ov[r] = MOut.roles[r];
          localStorage.setItem('srcRoleMap', JSON.stringify(ov));
        } catch (err) {}
        renderRig(); // re-sort so the panel keeps mirroring the mixer
      });
    }
  }
  renderRig();
  document.getElementById('btnRig').addEventListener('click', () => document.getElementById('rigModal').classList.add('open'));
  // live activity lights: a role's swatch glows while that lane is playing,
  // so with a scene open the RIG shows exactly which roles the scene uses
  setInterval(() => {
    if (!document.getElementById('rigModal').classList.contains('open')) return;
    const now = performance.now();
    rows.querySelectorAll('.swatch').forEach(sw => {
      const role = sw.dataset.role;
      const act = MOut.lastByRole[role] && now - MOut.lastByRole[role] < 1500;
      sw.style.boxShadow = act ? `0 0 10px 3px ${MOut.ROLE_COLORS[role]}` : '';
    });
  }, 300);
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
    if (st) st.textContent = (MOut.mode !== 'web' && MOut.port) ? '→ ' + (MOut.port.name || 'MIDI OUT') : '';
  };
  document.getElementById('fSound').addEventListener('click', () => { document.getElementById('btnSound').click(); syncFocus(); });
  document.getElementById('fOut').addEventListener('click', () => { document.getElementById('btnOut').click(); syncFocus(); });
  document.getElementById('fRig').addEventListener('click', () => document.getElementById('rigModal').classList.add('open'));
  document.getElementById('fClock').addEventListener('click', () => { document.getElementById('btnClock').click(); syncFocus(); });
  document.getElementById('btnGhosts').addEventListener('click', () => {
    ghostsOn = !ghostsOn;
    document.getElementById('btnGhosts').classList.toggle('off', !ghostsOn);
  });
  // ghost hands INSIDE a focused scene — off by default (a scene starts still),
  // handy when you want the scene to demo itself while you work the rig
  document.getElementById('fGhosts').addEventListener('click', () => {
    sceneGhosts = !sceneGhosts;
    document.getElementById('fGhosts').classList.toggle('off', !sceneGhosts);
  });
  document.getElementById('fVol').addEventListener('input', e => {
    const v = document.getElementById('volSlider');
    v.value = e.target.value;
    v.dispatchEvent(new Event('input'));
  });
  setInterval(syncFocus, 1200);
  syncFocus();
  document.getElementById('btnRigClose').addEventListener('click', () => document.getElementById('rigModal').classList.remove('open'));
  document.getElementById('rigModal').addEventListener('click', e => { if (e.target.id === 'rigModal') e.target.classList.remove('open'); });
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
document.getElementById('railCheck').addEventListener('click', () => PRE.open());
document.getElementById('searchBox').addEventListener('input', applyLibrary);
document.getElementById('sortSel').addEventListener('change', applyLibrary);
document.querySelectorAll('.fchip').forEach(c => c.addEventListener('click', () => {
  libFilter = c.dataset.f === libFilter ? 'all' : c.dataset.f;
  if (libFilter !== 'queue') QUEUE.shared = null;
  syncChips();
  QUEUE.refresh();
}));

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
  if (e.key === 'Escape' && focus.idx >= 0 && !document.fullscreenElement) {
    const c = document.getElementById('btnClose');
    if (c) c.click();
  }
});
// ←/→ flip between scenes without leaving the stage
window.addEventListener('keydown', e => {
  if (focus.idx < 0) return;
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
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
  if (!b || focus.idx < 0 || !focus.P) return;
  const d = PIECES[focus.idx];
  if (d.setAct) d.setAct(focus.P, +b.dataset.a);
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
  window.openFocus = function (i) {
    _open(i);
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
  window.openFocus = function (i) {
    _open(i);
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
  fsBtn.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (ov.requestFullscreen) ov.requestFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    ov.classList.toggle('fs', !!document.fullscreenElement);
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
  document.getElementById('edgeL').addEventListener('click', () => step(-1));
  document.getElementById('edgeR').addEventListener('click', () => step(1));
  // each scene holds the stage for ITS OWN minutes (MIN in the queue drawer,
  // default 10) — any manual navigation resets the clock
  let rotT = null, rotAt = 0;
  function resetRotation() {
    clearTimeout(rotT); rotT = null; rotAt = 0;
    if (document.fullscreenElement && focus.idx >= 0) {
      const ms = QUEUE.dwellMs(famOf(PIECES[focus.idx]));
      rotAt = Date.now() + ms;
      rotT = setTimeout(() => step(1), ms);
    }
  }
  window.SHOW = { next: () => step(1), prev: () => step(-1), resetRotation };
  // DBG — the little truth window: is the rig actually feeling your hands?
  const dbg = document.getElementById('dbg'), body = document.getElementById('dbgBody');
  document.getElementById('dbgTab').addEventListener('click', () => dbg.classList.toggle('open'));
  let frames = 0, fps = 0, fpsT = performance.now();
  (function fpsLoop() { frames++; requestAnimationFrame(fpsLoop); })();
  setInterval(() => {
    const now = performance.now();
    fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now;
    if (!dbg.classList.contains('open') || !document.fullscreenElement) return;
    const d = focus.idx >= 0 ? PIECES[focus.idx] : null;
    const st = focus.P && focus.P.state;
    const bar = (side) => {
      const v = chan[side].v;
      const n = Math.round(clamp(v) * 14);
      return '▮'.repeat(n) + '▯'.repeat(14 - n) + ' ' + v.toFixed(2) + ' ' + chan[side].mode.toUpperCase();
    };
    const secs = rotAt ? Math.max(0, Math.round((rotAt - Date.now()) / 1000)) : 0;
    const mmss = rotAt ? String(Math.floor(secs / 60)) + ':' + String(secs % 60).padStart(2, '0') : '—';
    const hand = side => {
      const m = midi.map[side], cal = midi.cal[side];
      if (!m) return side + ':—';
      return side + ':' + mapLabel(m) +
        (cal ? '[' + cal.lo.toFixed(2) + '-' + cal.hi.toFixed(2) + (cal.inv ? ' INV' : '') +
          (cal.rest !== null && cal.rest !== undefined ? ' rest' + cal.rest.toFixed(2) : ' NO-REST') + ']' : '[uncal]');
    };
    const inMap = (midi.map.L || midi.map.R)
      ? hand('L') + ' ' + hand('R')
      : 'unmapped (MAP → LEARN)';
    body.textContent =
      'SCENE  ' + (d ? d.id + ' · ' + d.title : '—') + (st && d && d.acts ? '\nACT    ' + d.acts[st.act] : '') +
      '\nL HAND ' + bar('L') +
      '\nR HAND ' + bar('R') +
      '\nMIDI IN  ' + inMap +
      '\nMIDI OUT ' + MOut.mode.toUpperCase() + (MOut.port ? ' → ' + MOut.port.name : '') +
      '\nCLK→LIVE ' + (!MOut.clock.on ? 'OFF' : MOut.clock.running ? 'DRIVING ' + T.bpm + ' BPM' : 'armed (no transport)') +
      '\nNEXT SCENE ' + mmss + '   FPS ' + fps +
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
   THE RIG RACK — the music work surface under the stage.
   One row per role: color · role · channel · what answers in the
   Live set (rig.json, baked as RIGDOC — fill in `instrument` and
   the rack names your actual patches). Rows light while their
   lane is playing, so with a scene open you can SEE which
   instruments it is using and on which channels. Click to remap.
   ============================================================ */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
(function () {
  const rack = document.getElementById('roleRack');
  if (!rack || typeof MOut === 'undefined') return;
  const DOCS = (typeof RIGDOC !== 'undefined' && RIGDOC.roles) ? RIGDOC.roles : {};
  const rows = {};
  for (const role of Object.keys(MOut.roles)) {
    const doc = DOCS[role] || {};
    const div = document.createElement('div');
    div.className = 'rkrow';
    div.title = (doc.instrument ? doc.instrument + ' — ' : '') + (doc.use || '');
    div.innerHTML = `<i style="background:${MOut.ROLE_COLORS[role]}"></i>
      <b>${role}</b><span class="rkch">CH${MOut.roles[role]}</span>
      <span class="rki">${esc(doc.instrument || doc.use || '')}</span>`;
    rack.appendChild(div);
    rows[role] = div;
  }
  rack.addEventListener('click', () => document.getElementById('rigModal').classList.add('open'));
  setInterval(() => {
    if (!overlay.classList.contains('open')) return;
    const now = performance.now();
    for (const role in rows) {
      const on = MOut.lastByRole[role] && now - MOut.lastByRole[role] < 1200;
      rows[role].classList.toggle('on', !!on);
      rows[role].querySelector('i').style.boxShadow = on ? `0 0 6px 1px ${MOut.ROLE_COLORS[role]}` : '';
      const ch = 'CH' + MOut.roles[role]; // live: the RIG modal can remap
      const el = rows[role].querySelector('.rkch');
      if (el.textContent !== ch) el.textContent = ch;
    }
  }, 300);
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
  let panels = false;
  try { panels = localStorage.getItem('srcPanels') === '1'; } catch (e) {}
  const apply = () => overlay.classList.toggle('perf', !panels); // .perf only bites under .fs
  const flip = () => {
    panels = !panels;
    try { localStorage.setItem('srcPanels', panels ? '1' : '0'); } catch (e) {}
    apply();
  };
  // starting a show must not inherit yesterday's debugging layout
  window.setPanels = on => { panels = !!on; apply(); };
  const pt = document.getElementById('panelTab');
  if (pt) pt.addEventListener('click', flip);
  window.addEventListener('keydown', e => {
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

let last = 0, fc = 0;
function frame(ts) {
  const t = ts / 1000;
  const dt = Math.min(0.05, last ? t - last : 0.016);
  last = t;
  applyKeys(dt);
  updateChannels(t, dt);
  const inp = { L: chan.L.v, R: chan.R.v };
  drawWidget(document.getElementById('widgetTop'), t);
  if (overlay.classList.contains('open')) {
    drawWidget(document.getElementById('widgetFocus'), t);
    refreshSliders();
    if (typeof MOut !== 'undefined') {
      MOut.tickCC(inp);
      MOut.drawMonitor(document.getElementById('midiMon'));
    }
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
      P.def.step(P, dt, t, inp);
      P.def.draw(P, P.g, P.w, P.h, t, inp);
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
    } catch (e) { console.error(P.def.id, e); }
    if (focus.voice && AE.on) { try { focus.voice.tick(inp, dt); } catch (e) {} }
  } else {
    fc++;
    insts.forEach((P, i) => {
      if (!P.visible || (fc + i) % 2) return;
      try {
        P.def.step(P, dt * 2, t, inp);
        P.def.draw(P, P.g, P.w, P.h, t, inp);
      } catch (e) { console.error(P.def.id, e); }
    });
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
