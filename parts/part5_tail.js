/* ============================================================
   TEAM — locked top-12 shortlist and owners (Wed deadline)
   ============================================================ */
const OWNERS = {
  'SRC-15': 'KASIA', 'SRC-10': 'KASIA', 'SRC-01': 'KASIA',
  'SRC-34': 'NIMA', 'SRC-32': 'NIMA', 'SRC-09': 'NIMA',
  'SRC-18': 'LANCE', 'SRC-30': 'LANCE', 'SRC-04': 'LANCE'
};
const TOP12 = new Set(['SRC-01', 'SRC-04', 'SRC-05', 'SRC-07', 'SRC-09', 'SRC-10',
  'SRC-15', 'SRC-18', 'SRC-28', 'SRC-30', 'SRC-32', 'SRC-34']);
let libFilter = 'all';
function syncChips() {
  document.querySelectorAll('.fchip').forEach(c => c.classList.toggle('on', c.dataset.f === libFilter));
  const bf = document.getElementById('btnFav');
  if (bf) bf.classList.toggle('off', libFilter !== 'fav');
}
const famOf = def => def.family || def.id;

/* ============================================================
   FAVORITES / SHORTLIST — star pieces, share picks by link
   Storage is guarded: persists on the hosted site, falls back
   to in-memory anywhere storage is unavailable.
   ============================================================ */
const FAV = {
  set: new Set(), filterOn: false, shared: null,
  load() { try { const s = window.localStorage && localStorage.getItem('srcFavs'); if (s) this.set = new Set(JSON.parse(s)); } catch (e) {} },
  save() { try { window.localStorage && localStorage.setItem('srcFavs', JSON.stringify([...this.set])); } catch (e) {} },
  toggle(id) {
    this.set.has(id) ? this.set.delete(id) : this.set.add(id);
    this.save(); this.refresh();
  },
  link() {
    const url = location.origin + location.pathname + '#fav=' + [...this.set].join(',');
    const done = () => {
      const b = document.getElementById('btnFavLink');
      b.textContent = 'COPIED ✓'; setTimeout(() => b.textContent = 'COPY LINK', 1500);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => prompt('Copy your shortlist link:', url));
    else prompt('Copy your shortlist link:', url);
  },
  refresh() {
    document.getElementById('btnFav').textContent = '★ ' + this.set.size;
    document.getElementById('btnFavLink').style.display = (libFilter === 'fav' && this.set.size) ? '' : 'none';
    document.querySelectorAll('.tile').forEach(tile => {
      const id = tile.dataset.pid;
      const star = tile.querySelector('.star');
      if (star) { star.textContent = this.set.has(id) ? '★' : '☆'; star.classList.toggle('on', this.set.has(id)); }
    });
    const fs = document.getElementById('btnStarFocus');
    if (fs && focus.idx >= 0) {
      const id = famOf(PIECES[focus.idx]);
      fs.textContent = this.set.has(id) ? '★' : '☆';
      fs.classList.toggle('on', this.set.has(id));
    }
    if (typeof applyLibrary === 'function') applyLibrary();
  },
  boot() {
    this.load();
    if (location.hash.startsWith('#fav=')) {
      const ids = location.hash.slice(5).split(',').filter(Boolean);
      if (ids.length) {
        this.shared = new Set(ids);
        libFilter = 'fav'; syncChips();
        const bn = document.getElementById('favBanner');
        bn.classList.add('open');
        document.getElementById('favBannerText').textContent =
          'VIEWING A SHARED SHORTLIST · ' + ids.length + ' PIECES';
        document.getElementById('favMerge').addEventListener('click', () => {
          ids.forEach(id => this.set.add(id));
          this.save(); this.shared = null;
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
    document.getElementById('btnFav').addEventListener('click', () => {
      libFilter = libFilter === 'fav' ? 'all' : 'fav';
      if (libFilter !== 'fav') this.shared = null;
      syncChips();
      this.refresh();
    });
    document.getElementById('btnFavLink').addEventListener('click', () => this.link());
    document.getElementById('btnStarFocus').addEventListener('click', () => {
      if (focus.idx >= 0) this.toggle(famOf(PIECES[focus.idx]));
    });
    this.refresh();
  }
};

/* ============================================================
   BOOT — build the wall, run the loop
   ============================================================ */
const grid = document.getElementById('grid');
// "active" = the owned shortlist (OWNERS) — drives the default sort + ACTIVE filter
const ACTIVE_ORDER = ['SRC-18', 'SRC-30', 'SRC-04', 'SRC-15', 'SRC-10', 'SRC-01', 'SRC-34', 'SRC-32', 'SRC-09'];
const famRank = f => { const i = ACTIVE_ORDER.indexOf(f); return i < 0 ? 999 : i; };
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
  FAMS.sort((a, b) => famRank(a.fam) - famRank(b.fam)); // stable: library keeps its order
}

FAMS.forEach(F => {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.pid = F.fam;
  const own = OWNERS[F.fam];
  tile.innerHTML = `
    <div class="tile-head"><span class="tid">${F.fam}</span><span class="ttag"></span>${TOP12.has(F.fam) ? '<span class="owner t12">★ TOP 12</span>' : ''}${own ? `<span class="owner ${own.toLowerCase()}">${own}</span>` : ''}<select class="vsel" style="display:none" title="version history"></select><button class="star" title="add to shortlist">☆</button></div>
    <div class="cwrap"><canvas></canvas><span class="hoverhint">FOCUS ▸</span></div>
    <div class="tbody">
      <h3></h3>
      <p class="desc"></p>
      <span class="morelink">more</span>
      <div class="chips"></div>
      <p class="iline"></p>
      <div class="btns">
        <button data-act="focus">FOCUS</button>
        <button data-act="regen">REGEN</button>
        <button data-act="png">PNG</button>
      </div>
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
    tile.dataset.search = (F.fam + ' ' + en.def.title + ' ' + en.def.tech + ' ' + (en.def.tags || []).join(' ') + ' ' + (OWNERS[F.fam] || '') + ' ' + en.def.desc).toLowerCase();
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
    FAV.refresh();
  });
  tile.querySelector('.morelink').addEventListener('click', e => {
    e.stopPropagation();
    const on = tile.classList.toggle('exp');
    e.target.textContent = on ? 'less' : 'more';
  });
  tile.querySelector('.star').addEventListener('click', e => { e.stopPropagation(); FAV.toggle(F.fam); });
  tile.querySelector('.cwrap').addEventListener('click', () => openFocus(tile.cur.idx));
  tile.querySelector('[data-act=focus]').addEventListener('click', () => openFocus(tile.cur.idx));
  tile.querySelector('[data-act=regen]').addEventListener('click', () => insts[ti].reinit((Math.random() * 1e9) | 0));
  tile.querySelector('[data-act=png]').addEventListener('click', () => {
    const a = document.createElement('a');
    a.download = tile.cur.def.id.toLowerCase() + '.png';
    a.href = cv.toDataURL('image/png');
    a.click();
  });
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
    MOut.mode = m; // set directly; setMode would re-save (harmless but redundant)
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
  for (const role of Object.keys(MOut.roles)) {
    const row = document.createElement('div');
    row.className = 'rigrow';
    row.innerHTML = `<div class="swatch" data-role="${role}" style="background:${MOut.ROLE_COLORS[role]}"></div>
      <label>${role}</label>
      <select data-role="${role}">${Array.from({ length: 16 }, (_, i) =>
        `<option value="${i + 1}"${i + 1 === MOut.roles[role] ? ' selected' : ''}>CH ${i + 1}</option>`).join('')}</select>
      <span>${DESC[role] || ''}</span>`;
    rows.appendChild(row);
    row.querySelector('select').addEventListener('change', e => {
      MOut.allOff();
      MOut.roles[role] = +e.target.value;
    });
  }
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
    const pairs = [['btnSound', 'fSound', 'SOUND: '], ['btnOut', 'fOut', '']];
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
  document.getElementById('btnGhosts').addEventListener('click', () => {
    ghostsOn = !ghostsOn;
    document.getElementById('btnGhosts').classList.toggle('off', !ghostsOn);
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
  const activeShort = FAV.shared || FAV.set;
  const tiles = [...grid.children];
  const titleSorted = tiles.slice().sort((a, b) =>
    a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent));
  const tRank = new Map(titleSorted.map((t, i) => [t, i]));
  let shown = 0;
  tiles.forEach(tile => {
    const id = tile.dataset.pid;
    let show = !q || (tile.dataset.search || '').includes(q);
    if (show) {
      if (libFilter === 'fav') show = activeShort.has(id);
      else if (libFilter === 'top12') show = TOP12.has(id);
      else if (libFilter === 'active') show = !!OWNERS[id];
      else if (libFilter === 'KASIA' || libFilter === 'NIMA' || libFilter === 'LANCE') show = OWNERS[id] === libFilter;
    }
    tile.style.display = show ? '' : 'none';
    if (show) shown++;
    const src = +((id.match(/\d+/) || [999])[0]);
    const vers = (tile.querySelector('.vsel').options.length) || 1;
    let ord;
    if (sort === 'id') ord = src;
    else if (sort === 'title') ord = tRank.get(tile);
    else if (sort === 'ver') ord = -vers * 100 + src;
    else ord = famRank(id) * 1000 + (FAV.set.has(id) ? 0 : 500) + src; // active first, your stars float
    tile.style.order = Math.round(ord);
  });
  document.getElementById('libCount').textContent = shown + ' scenes';
}
document.getElementById('searchBox').addEventListener('input', applyLibrary);
document.getElementById('sortSel').addEventListener('change', applyLibrary);
document.querySelectorAll('.fchip').forEach(c => c.addEventListener('click', () => {
  libFilter = c.dataset.f === libFilter ? 'all' : c.dataset.f;
  if (libFilter !== 'fav') FAV.shared = null;
  syncChips();
  FAV.refresh();
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
// fullscreen — the scene takes the whole display
(() => {
  const b = document.getElementById('fFull');
  if (!b) return;
  b.addEventListener('click', () => {
    const ov = document.getElementById('overlay');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (ov.requestFullscreen) ov.requestFullscreen();
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
  // arriving with a scene link → straight to the stage
  const boot = () => {
    const i = sceneFromHash();
    if (i >= 0) { syncing = true; window.openFocus(i); syncing = false;
      try { history.replaceState(null, '', location.pathname + '#scene=' + PIECES[i].id); } catch (e) {} }
  };
  if (document.readyState === 'complete') setTimeout(boot, 300);
  else window.addEventListener('load', () => setTimeout(boot, 300));
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
  // LINK — copy this scene's URL
  const b = document.getElementById('fShare');
  if (b) b.addEventListener('click', () => {
    if (focus.idx < 0) return;
    const url = location.origin + location.pathname + '#scene=' + PIECES[focus.idx].id;
    const done = () => { b.textContent = 'COPIED ✓'; setTimeout(() => b.textContent = 'LINK', 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done).catch(() => prompt('Scene link:', url));
    else prompt('Scene link:', url);
  });
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
  const showList = () => {
    const tiles = [...grid.children]
      .filter(t2 => t2.style.display !== 'none')
      .sort((a2, b2) => (+a2.style.order || 0) - (+b2.style.order || 0));
    const starred = tiles.filter(t2 => FAV.set.has(t2.dataset.pid));
    return starred.length ? starred : tiles;
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
  // ten minutes per scene, reset by any manual navigation
  const ROT_MS = 10 * 60 * 1000;
  let rotT = null, rotAt = 0;
  function resetRotation() {
    clearTimeout(rotT); rotT = null; rotAt = 0;
    if (document.fullscreenElement && focus.idx >= 0) {
      rotAt = Date.now() + ROT_MS;
      rotT = setTimeout(() => step(1), ROT_MS);
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
    const inMap = (midi.map.L || midi.map.R)
      ? 'L:' + (midi.map.L ? 'cc' + midi.map.L.cc : '—') + ' R:' + (midi.map.R ? 'cc' + midi.map.R.cc : '—')
      : 'unmapped (MAP → LEARN)';
    body.textContent =
      'SCENE  ' + (d ? d.id + ' · ' + d.title : '—') + (st && d && d.acts ? '\nACT    ' + d.acts[st.act] : '') +
      '\nL HAND ' + bar('L') +
      '\nR HAND ' + bar('R') +
      '\nMIDI IN  ' + inMap +
      '\nMIDI OUT ' + MOut.mode.toUpperCase() + (MOut.port ? ' → ' + MOut.port.name : '') +
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
  const el = document.getElementById('oActs');
  if (el && el.children.length && focus.P && focus.P.state) {
    const a2 = focus.P.state.act || 0;
    [...el.children].forEach((b, bi) => b.classList.toggle('on', bi === a2));
  }
  const rr = document.getElementById('oRoles');
  if (rr && typeof MOut !== 'undefined') {
    if (!rr.children.length) {
      rr.innerHTML = Object.keys(MOut.roles).map(role =>
        `<i data-role="${role}" style="background:${MOut.ROLE_COLORS[role]}" title="${role}"></i>`).join('');
    }
    const now = performance.now();
    [...rr.children].forEach(dot => {
      const role = dot.dataset.role;
      const on = MOut.lastByRole[role] && now - MOut.lastByRole[role] < 1200;
      dot.classList.toggle('on', !!on);
      dot.style.boxShadow = on ? `0 0 6px 1px ${MOut.ROLE_COLORS[role]}` : '';
    });
  }
}, 300);

FAV.boot();
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
