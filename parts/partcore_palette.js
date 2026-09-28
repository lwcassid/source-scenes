/* ---------- PALETTE — the colours that generate a scene ----------
   Edson, Sep 27 2026: every scene declares its palette on a minimal nav bar,
   "the 5 generation colours and 3 gradients". Not the only colours on
   screen — the GENERATORS: change one and the picture cascades, in real
   time, and every slot is reachable from a MIDI controller.

   THE SHAPE IS FIXED: five colours c0..c4 and three bands g0..g2 of ten
   swatches each, same order in every scene (like the sixteen knobs). A
   scene leaves slots idle; the hand and the eye learn one layout.

       reg({ id: 'SRC-73', …,
         palette: {
           c: ['#d4af37', '#947733', '#d37b50', '#d4d4d4', '#4f4f4f'],
           g: [ [ten hex], [ten hex], [ten hex] ],
           hl: [0.33, 0.44, 0.44],          // optional: where each band's highlight sits
           names: { c0: 'TEMPLE GOLD', …, g0: 'GOLD', … }
         } });

   A BAND IS ACROSS THE FORM, not across the screen (the group's law: hue
   comes from the form). A metal band reads dark edge → highlight → dark
   edge, so a layer asks for a colour ALONG the band: PAL.along(P, j, u),
   u = 0 at the dark end, 1 at the highlight. What u means is the layer's:
   the Point's centre → limb, a streak's depth, a floret's age.

   READING, in a layer:
       const gold = PAL.along(P, 0, u);     // [r,g,b] 0..255
       const core = PAL.c(P, 0);            // [r,g,b] 0..255
       if (PAL.ver(P) !== s.palVer) { rebuild(); s.palVer = PAL.ver(P); }
   In WebGL: PAL.uniforms(P) → { uPalC, uPalG, uPalH } (flat float arrays,
   0..1) and PAL.GLSL, a vertex-shader chunk with palAlong(j, u) / palC(i).
   Hosted: the host's palette is the one (`sub.palette`, beside
   `sub.macro`); standalone, the scene's own declaration.

   ONE ENTRY POINT FOR EVERY WRITE: PAL.set(op, …). The panel, the knobs,
   RESET, COPY FROM and REMOTE all go through it, so one wrap forwards
   everything. Held per scene family in localStorage (`srcPalettes`), like
   `srcTwistMaps`.

   A SCENE THAT DECLARES NOTHING IS UNTOUCHED: no panel, every PAL.* call
   answers its fallback or null, every knob is a no-op.

   TOOL-LEVEL, declared in the PR: a sidebar panel (via PANELS), a
   localStorage key, and an inert `palette:` field on reg — read by our
   layers only. If core adopts params, a colour is a param type and this
   panel is its editor.                                                    */
(() => {
  if (typeof window === 'undefined' || window.PAL) return;
  const KEY = 'srcPalettes';
  const NC = 5, NG = 3, NS = 10, TAB = 64;

  /* the measured metals — pAVoni/references/metal-gradients (the Procreate
     palette Edson linked, Sep 27): four metals × three rows. BRONZE and
     ALUMINIUM still need a reference. */
  const PRESETS = {
    GOLD1:     ['#b39b41','#dbc463','#ebe294','#f9f9c2','#f6efaf','#e8d67e','#dbbb53','#c0993e','#947733','#6d5432'],
    GOLD2:     ['#b97f23','#e0b643','#fef382','#fefda3','#fdf09b','#e8cd7f','#cda75b','#bf913b','#ae7c23','#a67020'],
    GOLD3:     ['#f3db9a','#fbe7b4','#f0d58f','#e5ca7f','#f6df9e','#fef2c4','#f5e0a4','#dcc076','#bca156','#9d8036'],
    COPPER1:   ['#b7603f','#d37b50','#df9566','#eec49b','#f7dfba','#f2c396','#e8a574','#d58354','#92452c','#6d2c1c'],
    COPPER2:   ['#652a1a','#7b3e2b','#b78167','#eec6a7','#f9e7c4','#edd9b8','#bb8c70','#925743','#834636','#5e251b'],
    COPPER3:   ['#d27d59','#a85e46','#80412f','#964534','#bb5c44','#d9835c','#eaab79','#f0ca93','#f3c691','#f8bb86'],
    SILVER1:   ['#898989','#999999','#b0b0b0','#d4d4d4','#f4f4f4','#ebebeb','#dbdbdb','#cecece','#c2c2c2','#9e9e9e'],
    SILVER2:   ['#3e3e3e','#4f4f4f','#68686a','#848485','#9c9c9c','#a1a1a1','#939393','#818181','#6e6e6e','#5f5f5f'],
    SILVER3:   ['#656569','#87868d','#a9a8b1','#c6c5cf','#eaeaec','#bebdc6','#a7a6b0','#c5c4ce','#8a8a8e','#656567'],
    ROSEGOLD1: ['#fbbebc','#fcd5d4','#eeb6b6','#e9a2a0','#e49793','#b8635e','#af5a55','#cd817e','#d38c86','#cb8381'],
    ROSEGOLD2: ['#ab7672','#d49b95','#f0c0bb','#fbdeda','#f1c5c1','#e4bbb9','#cb9a96','#b48580','#84534f','#9b6967'],
    ROSEGOLD3: ['#e1968e','#d88e85','#ce8477','#d99587','#edb4a5','#ffc7c0','#f1b7aa','#e39e91','#d68b80','#d37b6f']
  };
  const ORDER = Object.keys(PRESETS);

  /* ---- colour maths ---- */
  const hex2rgb = h => { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join('');
    const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  function rgb2hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h / 6, s, l];
  }
  function hsl2rgb([h, s, l]) {
    h = ((h % 1) + 1) % 1;
    if (!s) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  /* where a row's highlight sits, 0..1: its brightest swatch */
  function natural(row) { let k = 0, b = -1; row.forEach((h, i) => { const L = lum(hex2rgb(h)); if (L > b) { b = L; k = i; } }); return k / (NS - 1); }
  const clamp01 = v => Math.max(0, Math.min(1, +v || 0));

  /* a declaration, normalised: always 5 + 3 × 10, every slot a hex */
  function declare(d) {
    d = d || {};
    const c = []; for (let i = 0; i < NC; i++) c.push(rgb2hex(hex2rgb((d.c || [])[i] || '#808080')));
    const g = []; for (let j = 0; j < NG; j++) {
      const r = (d.g || [])[j] || PRESETS[ORDER[j * 3] ] || PRESETS.SILVER1;
      const row = []; for (let k = 0; k < NS; k++) row.push(rgb2hex(hex2rgb(r[Math.round(k * (r.length - 1) / (NS - 1))])));
      g.push(row);
    }
    const hl = []; for (let j = 0; j < NG; j++) hl.push((d.hl && typeof d.hl[j] === 'number') ? clamp01(d.hl[j]) : null);
    return { c, g, hl, names: Object.assign({}, d.names || {}) };
  }
  /* a ramp as a band: ten swatches from fn(u), u = 1 at the left (the
     highlight) → 0 at the right (the dark end). For a standalone scene that
     must keep today's look exactly: declare { g: [PAL.ramp(fn)], hl: [0] }. */
  function ramp(fn) { const r = []; for (let k = 0; k < NS; k++) r.push(rgb2hex(fn(1 - k / (NS - 1)))); return r; }

  const copy = o => JSON.parse(JSON.stringify(o));
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { store = {}; }
  let saveT = null;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }, 250); };

  /* one live palette: the declaration, what it is now, the knob offsets, and
     the tables every layer reads */
  function make(decl, key) {
    const D = declare(decl);
    const st = { key: key || null, decl: D, base: copy(D), cur: copy(D), hue: new Array(NC).fill(0.5), band: new Array(NG).fill(0.5),
                 sel: 0, ver: 0, C: [], G: [], H: [], SW: [], U: null };
    const kept = key ? store[key] : null;
    if (kept) {
      if (kept.base) st.base = declare(Object.assign({ names: D.names }, kept.base));
      if (kept.cur) st.cur = declare(Object.assign({ names: D.names }, kept.cur));
      if (Array.isArray(kept.hue)) kept.hue.forEach((v, i) => { if (i < NC) st.hue[i] = clamp01(v); });
      if (Array.isArray(kept.band)) kept.band.forEach((v, j) => { if (j < NG) st.band[j] = clamp01(v); });
    }
    rebuild(st);
    return st;
  }
  function persist(st) {
    if (!st.key) return;
    const differs = JSON.stringify([st.base.c, st.base.g, st.base.hl]) !== JSON.stringify([st.decl.c, st.decl.g, st.decl.hl]);
    store[st.key] = { cur: { c: st.cur.c, g: st.cur.g, hl: st.cur.hl }, hue: st.hue, band: st.band };
    if (differs) store[st.key].base = { c: st.base.c, g: st.base.g, hl: st.base.hl };
    save();
  }

  /* THE TABLES. Built only when something changed; a frame only indexes. */
  function rebuild(st) {
    st.C = st.cur.c.map((h, i) => {
      const hsl = rgb2hsl(hex2rgb(h));
      if (Math.abs(st.hue[i] - 0.5) > 1e-4) hsl[0] += (st.hue[i] - 0.5);   // a full turn across the knob; 0.5 = as declared
      return hsl2rgb(hsl).map(Math.round);
    });
    st.G = []; st.H = []; st.SW = [];
    for (let j = 0; j < NG; j++) {
      const row = st.cur.g[j];
      const H = (st.cur.hl[j] === null || st.cur.hl[j] === undefined) ? natural(row) : st.cur.hl[j];
      const b = (st.band[j] - 0.5) * 2;      // -1 .. +1: the band's highlight, darker or brighter
      const sw = row.map((h, k) => {
        const hsl = rgb2hsl(hex2rgb(h));
        if (Math.abs(b) > 1e-4) {
          const w = Math.max(0.3, 1 - Math.abs(k / (NS - 1) - H) * 1.6);   // the highlight moves most
          hsl[2] = b > 0 ? hsl[2] + (1 - hsl[2]) * b * 0.7 * w : hsl[2] * (1 + b * 0.65 * w);
        }
        return hsl2rgb(hsl);
      });
      const T = new Float32Array(TAB * 3);
      for (let i = 0; i < TAB; i++) {
        const x = i / (TAB - 1) * (NS - 1), k = Math.min(NS - 2, Math.floor(x)), f = x - k;
        for (let c = 0; c < 3; c++) T[i * 3 + c] = sw[k][c] + (sw[k + 1][c] - sw[k][c]) * f;
      }
      st.G.push(T); st.H.push(H); st.SW.push(sw);
    }
    st.U = null;
    st.ver++;
  }

  const NONE = null;
  function of(P) {
    if (!P) return NONE;
    if (P.palette) return P.palette;                       // hosted: the host's
    if (P._pal) return P._pal;
    const d = P.def;
    if (d && d.palette) { P._pal = make(d.palette, d.family || d.id); return P._pal; }
    return NONE;
  }
  function sampleRow(st, j, t) {
    const T = st.G[j]; if (!T) return [0, 0, 0];
    const x = clamp01(t) * (TAB - 1), i = Math.min(TAB - 2, Math.floor(x)), f = x - i, a = i * 3, b = a + 3;
    return [T[a] + (T[b] - T[a]) * f, T[a + 1] + (T[b + 1] - T[a + 1]) * f, T[a + 2] + (T[b + 2] - T[a + 2]) * f];
  }

  /* the scene that is open, and the palette it plays: a host's shared one, or
     a plain scene's own */
  function active() {
    const f = (typeof focus !== 'undefined') ? focus.P : null;
    if (!f) return NONE;
    if (f.state && f.state.pal) return f.state.pal;
    return of(f);
  }

  /* WHO READS WHICH SLOT. A layer's own declaration names exactly the slots
     it reads (56.3 names c0 and g0, 71.2 names c3, c4, g0, g2 …), so a host
     knows, per slot, which of its layers read it and whether any of them is
     up. Edson, Sep 27 19:12: "when I change color in the circle nothing
     happens" — he had turned c0 and c1, which the Circle never reads. A slot
     nobody on the wall reads must say so. */
  function readers(st) {
    const f = (typeof focus !== 'undefined') ? focus.P : null, out = {};
    const add = (slot, who, live, what) => { (out[slot] = out[slot] || []).push({ who, live, what }); };
    if (f && f.state && f.state.pal === st && f.state.L) {
      f.state.L.forEach((L, i) => {
        const nm = L.def && L.def.palette && L.def.palette.names; if (!nm) return;
        const live = (f.state.fade && f.state.fade[i] > 0.02) || (f.state.want && f.state.want[i] > 0.02);
        Object.keys(nm).forEach(k => add(k, L.short || L.id, !!live, nm[k]));
      });
    } else if (f && f.def && f.def.palette && f.def.palette.names) {
      Object.keys(f.def.palette.names).forEach(k => add(k, '', true, f.def.palette.names[k]));
    }
    return out;
  }

  const PAL = {
    PRESETS, ORDER, NC, NG, NS, readers,
    hex2rgb, rgb2hex, rgb2hsl, hsl2rgb, declare, ramp, make, of, active,
    has(P) { return !!of(P); },
    ver(P) { const st = of(P); return st ? st.ver : 0; },
    c(P, i, fb) { const st = of(P); return st ? st.C[i] : (fb || null); },
    g(P, j, t, fb) { const st = of(P); return st ? sampleRow(st, j, t) : (fb ? fb(t) : null); },
    along(P, j, u, fb) {
      const st = of(P); if (!st) return fb ? fb(u) : null;
      return sampleRow(st, j, 1 - clamp01(u) * (1 - st.H[j]));
    },
    hl(P, j) { const st = of(P); return st ? st.H[j] : 0; },
    /* WebGL: flat arrays, 0..1, rebuilt with the tables. Update your
       uniforms' .value in place when ver changes. */
    uniforms(P) {
      const st = of(P); if (!st) return null;
      if (!st.U) {
        const C = new Float32Array(NC * 3), G = new Float32Array(NG * NS * 3), H = new Float32Array(NG);
        st.C.forEach((c, i) => { C[i * 3] = c[0] / 255; C[i * 3 + 1] = c[1] / 255; C[i * 3 + 2] = c[2] / 255; });
        st.SW.forEach((row, j) => row.forEach((c, k) => { const o = (j * NS + k) * 3; G[o] = c[0] / 255; G[o + 1] = c[1] / 255; G[o + 2] = c[2] / 255; }));
        st.H.forEach((h, j) => { H[j] = h; });
        st.U = { uPalC: C, uPalG: G, uPalH: H };
      }
      return st.U;
    },
    /* for the VERTEX shader — GLSL ES 1.00 allows a computed uniform index
       there and not in a fragment shader, so pass the colour on as a varying */
    GLSL: `
uniform vec3 uPalC[5];
uniform vec3 uPalG[30];
uniform float uPalH[3];
vec3 palRow(int j, float t){
  float x = clamp(t, 0.0, 1.0) * 9.0;
  float k0 = min(floor(x), 8.0);
  int k = int(k0);
  return mix(uPalG[j * 10 + k], uPalG[j * 10 + k + 1], x - k0);
}
vec3 palAlong(int j, float u){
  float h = j == 0 ? uPalH[0] : (j == 1 ? uPalH[1] : uPalH[2]);
  return palRow(j, 1.0 - clamp(u, 0.0, 1.0) * (1.0 - h));
}
vec3 palC(int i){ return uPalC[i]; }
`,

    /* THE ONE ENTRY POINT FOR EVERY WRITE, on the open scene's palette.
         set('c', i, hex)          a generator
         set('sw', j, k, hex)      one swatch of a band
         set('row', j, [10 hex])   a whole band
         set('hl', j, x)           move a band's highlight (0..1; null = its brightest swatch)
         set('hue', i, v)          rotate generator i (0.5 = as declared, a full turn across)
         set('band', j, v)         a band's highlight, darker or brighter (0.5 = as declared)
         set('preset', j, name)    a measured metal on band j ('next' cycles)
         set('sel', j)             the band PRESET-next acts on
         set('default', j)         SET DEFAULT: band j as it is now becomes this scene's default
         set('reset')              back to the default, knobs to the middle
         set('load', {c,g,hl,hue,band})   COPY FROM / a remote snapshot
       Returns true when it changed anything. A scene with no palette: false. */
    set(op, a, b, c) {
      const st = active(); if (!st) return false;
      return this.apply(st, op, a, b, c);
    },
    apply(st, op, a, b, c) {
      const cur = st.cur;
      if (op === 'c') { if (!(a >= 0 && a < NC)) return false; cur.c[a] = rgb2hex(hex2rgb(b)); }
      else if (op === 'sw') { if (!(a >= 0 && a < NG && b >= 0 && b < NS)) return false; cur.g[a][b] = rgb2hex(hex2rgb(c)); }
      else if (op === 'row') { if (!(a >= 0 && a < NG) || !Array.isArray(b)) return false; cur.g[a] = declare({ g: [b] }).g[0]; cur.hl[a] = null; }
      else if (op === 'hl') { if (!(a >= 0 && a < NG)) return false; cur.hl[a] = (b === null || b === undefined) ? null : clamp01(b); }
      else if (op === 'hue') { if (!(a >= 0 && a < NC)) return false; st.hue[a] = clamp01(b); }
      else if (op === 'band') { if (!(a >= 0 && a < NG)) return false; st.band[a] = clamp01(b); st.sel = a; }
      else if (op === 'sel') { if (!(a >= 0 && a < NG)) return false; st.sel = a; return true; }
      else if (op === 'preset') {
        const j = (a >= 0 && a < NG) ? a : st.sel;
        let name = b;
        if (!name || name === 'next') {
          const at = ORDER.findIndex(k => PRESETS[k].join() === cur.g[j].join());
          name = ORDER[(at + 1) % ORDER.length];
        }
        if (!PRESETS[name]) return false;
        cur.g[j] = PRESETS[name].slice(); cur.hl[j] = null; st.sel = j;
      }
      else if (op === 'default') {
        const j = a;
        if (j >= 0 && j < NG) { st.base.g[j] = cur.g[j].slice(); st.base.hl[j] = cur.hl[j]; }
        else { st.base = copy(cur); }
      }
      else if (op === 'reset') { st.cur = copy(st.base); st.hue.fill(0.5); st.band.fill(0.5); }
      else if (op === 'load') {
        const o = a || {}; const d = declare({ c: o.c || cur.c, g: o.g || cur.g, hl: o.hl || cur.hl, names: cur.names });
        const same = JSON.stringify([d.c, d.g, d.hl, o.hue || st.hue, o.band || st.band]) === JSON.stringify([cur.c, cur.g, cur.hl, st.hue, st.band]);
        if (same) return false;                         // a snapshot that changes nothing costs nothing
        st.cur = d;
        if (Array.isArray(o.hue)) st.hue = o.hue.slice(0, NC).map(clamp01);
        if (Array.isArray(o.band)) st.band = o.band.slice(0, NG).map(clamp01);
      }
      else return false;
      rebuild(st); persist(st);
      return true;
    },
    /* the knobs' own values, so a relative encoder picks up where it is */
    get(fn) {
      const st = active(); if (!st) return 0;
      if (/^hue\d$/.test(fn)) return st.hue[+fn.slice(3)] || 0;
      if (/^band\d$/.test(fn)) return st.band[+fn.slice(4)] || 0;
      return 0;
    },
    /* what the open scene's palette is, whole — REMOTE's snapshot */
    snap() { const st = active(); return st ? { key: st.key, c: st.cur.c.slice(), g: st.cur.g.map(r => r.slice()), hl: st.cur.hl.slice(), hue: st.hue.slice(), band: st.band.slice() } : null; },
    /* the `palette:` block to paste into the scene — COPY FOR REPO */
    code() {
      const st = active(); if (!st) return '';
      const q = a => '[' + a.map(x => "'" + x + "'").join(',') + ']';
      // the knob offsets are baked in, so what you paste is what you see
      const c = st.C.map(rgb2hex), g = st.SW.map(r => r.map(rgb2hex));
      const hl = st.cur.hl.some(x => x !== null) ? ',\n    hl: [' + st.cur.hl.map(x => x === null ? 'null' : (+x).toFixed(2)).join(', ') + ']' : '';
      const names = Object.keys(st.cur.names).length ? ',\n    names: ' + JSON.stringify(st.cur.names).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ') : '';
      return 'palette: {\n    c: ' + q(c) + ',\n    g: [\n      ' + g.map(q).join(',\n      ') + ' ]' + hl + names + '\n  }';
    },
    /* every palette this browser knows: kept edits and every declaring scene */
    sources() {
      const out = {};
      if (typeof PIECES !== 'undefined') PIECES.forEach(p => { if (p.palette) out[p.id] = declare(p.palette); });
      Object.keys(store).forEach(k => { if (store[k] && store[k].cur) out[k + ' (kept)'] = store[k].cur; });
      return out;
    },
    state() {
      const st = active(); if (!st) return null;
      return { key: st.key, ver: st.ver, c: st.C.map(rgb2hex), hue: st.hue.slice(), band: st.band.slice(), sel: st.sel,
               hl: st.H.map(h => +h.toFixed(2)), g: st.SW.map(r => r.map(rgb2hex)) };
    },
    forget(key) { delete store[key]; save(); }
  };
  window.PAL = PAL;

  /* ---------- THE PANEL: five dots, three bands of ten swatches ----------
     Click a dot or a swatch: the native picker, live — the wall follows the
     picker as it moves. Drag along a band: its highlight moves. Per band
     PRESET ▾ and SET DEFAULT (the reference's own words); then RESET,
     COPY FROM ▾, COPY FOR REPO. Everything goes through PAL.set.          */
  if (!window.PANELS || !PANELS.register) return;
  let ui = null;
  // the dot or swatch whose colour sheet is open wears the accent (SHEET: the trigger is ON)
  { const cs = document.createElement('style');
    cs.textContent = '.paldot.on{outline:2px solid var(--acc);outline-offset:2px} #paletteGroup .on:not(.paldot){outline:2px solid var(--acc);outline-offset:1px;position:relative;z-index:1}';
    document.head.appendChild(cs); }
  const BTN = 'padding:3px 0;font-size:8px;letter-spacing:.14em;background:transparent;border:1px solid var(--line2,#333);color:var(--txt-dim,#999);box-shadow:none;cursor:pointer';
  const SEL = 'font-size:8px;letter-spacing:.1em;background:transparent;border:1px solid var(--line2,#333);color:var(--txt-dim,#999);padding:2px;max-width:100%';

  /* ---------- THE COLOUR SHEET (partcore_sheet.js) ----------
     Edson, Sep 28: the browser's own colour picker was "not ok" — an OS
     dialog in another language, floating wherever the OS put it. This is
     a SHEET, the standard every secondary panel follows: TITLE · CONTEXT
     · ×, one line saying who on the wall reads this colour, a
     saturation/value field and a hue strip (dragged live — the wall
     follows), BEFORE (click to go back) · NOW · the hex, and the twelve
     measured metals to take a colour from in one click.
     Every write goes through PAL.set, coalesced to one per frame. */
  const hsv2rgb = (h, s, v) => { h = ((h % 1) + 1) % 1; const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    const r = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; return r.map(x => x * 255); };
  const rgb2hsv = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d) h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : mx === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
    return [h, mx ? d / mx : 0, mx]; };
  const METALS = [['SILVER', 'SILVER1', 'SILVER2', 'SILVER3'], ['GOLD', 'GOLD1', 'GOLD2', 'GOLD3'],
                  ['COPPER', 'COPPER1', 'COPPER2', 'COPPER3'], ['ROSE GOLD', 'ROSEGOLD1', 'ROSEGOLD2', 'ROSEGOLD3']];

  /* slot: { kind: 'c', i } or { kind: 'sw', j, k } */
  function colourSheet(slot, trigger) {
    const st0 = active(); if (!st0 || !window.SHEET) return;
    const nm = st0.cur.names || {};
    const get = () => { const st = active(); if (!st) return '#000000'; return slot.kind === 'c' ? st.cur.c[slot.i] : st.cur.g[slot.j][slot.k]; };
    const write = hex => slot.kind === 'c' ? PAL.set('c', slot.i, hex) : PAL.set('sw', slot.j, slot.k, hex);
    const sid = slot.kind === 'c' ? 'c' + slot.i : 'g' + slot.j;
    const ctxText = () => { const st = active(); return (st && st.key ? st.key + ' · ' : '') + (slot.kind === 'c' ? sid + ' · ' + (nm[sid] || '') : sid + ' · SWATCH ' + (slot.k + 1) + ' · ' + (nm[sid] || '')); };
    const before = get();
    let hsv = rgb2hsv(hex2rgb(before)), lastHex = before, pending = null, raf = 0, drag = null;
    const flush = () => { raf = 0; if (pending) { const h = pending; pending = null; lastHex = h; write(h); } };
    const take = hex => { pending = hex; if (!raf) raf = requestAnimationFrame(flush); };
    const now = () => rgb2hex(hsv2rgb(hsv[0], hsv[1], hsv[2]));
    let sv, hue, nowSw, hexIn, lede, paintFields;

    SHEET.toggle({
      id: 'palColour', title: 'Colour', size: 's', trigger, context: ctxText(),
      build(body) {
        lede = SHEET.lede(''); body.appendChild(lede);
        // THE FIELD: saturation → right, value → up; then the hue strip
        const W = 308;
        sv = document.createElement('canvas'); sv.width = W; sv.height = 168;
        sv.style.cssText = 'width:100%;height:168px;display:block;border-radius:6px;cursor:crosshair;touch-action:none';
        hue = document.createElement('canvas'); hue.width = W; hue.height = 14;
        hue.style.cssText = 'width:100%;height:14px;display:block;border-radius:7px;margin-top:8px;cursor:ew-resize;touch-action:none';
        const at = (cv, e) => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
        const onMove = e => {
          if (drag === 'sv') { const [x, y] = at(sv, e); hsv[1] = x; hsv[2] = 1 - y; }
          else if (drag === 'hue') { hsv[0] = Math.min(0.9999, at(hue, e)[0]); }
          else return;
          paintFields(); take(now());
        };
        [[sv, 'sv'], [hue, 'hue']].forEach(([cv, k]) => {
          cv.addEventListener('pointerdown', e => { drag = k; try { cv.setPointerCapture(e.pointerId); } catch (x) {} onMove(e); });
          cv.addEventListener('pointermove', onMove);
          cv.addEventListener('pointerup', () => { drag = null; });
          cv.addEventListener('pointercancel', () => { drag = null; });
        });
        body.append(sv, hue);
        // BEFORE · NOW · HEX
        const sw = c => { const d = document.createElement('div'); d.style.cssText = 'height:26px;border-radius:6px;border:1px solid var(--line)'; d.style.background = c; return d; };
        const bef = sw(before); bef.style.cursor = 'pointer'; bef.title = 'BEFORE — click to go back to ' + before;
        bef.addEventListener('click', () => { hsv = rgb2hsv(hex2rgb(before)); paintFields(); take(before); });
        nowSw = sw(before); nowSw.title = 'NOW';
        hexIn = document.createElement('input'); hexIn.type = 'text'; hexIn.spellcheck = false; hexIn.maxLength = 7;
        hexIn.style.cssText = 'font:11px var(--mono);letter-spacing:.08em;text-transform:uppercase;background:var(--btn-bg);color:var(--txt);border:1px solid var(--line);border-radius:var(--rs);padding:5px 8px;height:26px;box-sizing:border-box;width:100%;min-width:0';
        hexIn.addEventListener('input', () => { const v = hexIn.value.trim(); if (/^#?[0-9a-f]{6}$/i.test(v)) { const h = '#' + v.replace('#', '').toLowerCase(); hsv = rgb2hsv(hex2rgb(h)); paintFields(true); take(h); } });
        const lab = t => { const d = document.createElement('div'); d.style.cssText = 'font:8px var(--mono);letter-spacing:.14em;color:var(--txt-faint);margin-bottom:4px'; d.textContent = t; return d; };
        const col = (t, el) => { const d = document.createElement('div'); d.append(lab(t), el); return d; };
        const r = SHEET.row(col('BEFORE', bef), col('NOW', nowSw), col('HEX', hexIn)); r.style.marginTop = '12px';
        body.appendChild(r);
        // THE METALS: twelve measured rows, click to take a colour
        const sec = SHEET.section('From the metals');
        METALS.forEach(([name, ...rows]) => {
          rows.forEach((key, n) => {
            const line = document.createElement('div'); line.style.cssText = 'display:grid;grid-template-columns:62px repeat(10,1fr);gap:1px;align-items:center;margin-bottom:1px';
            const l = document.createElement('div'); l.style.cssText = 'font:8px var(--mono);letter-spacing:.1em;color:var(--txt-faint);white-space:nowrap';
            l.textContent = n === 0 ? name : ''; line.appendChild(l);
            PRESETS[key].forEach(h => {
              const c = document.createElement('div'); c.style.cssText = 'height:11px;cursor:pointer'; c.style.background = h; c.title = key + ' · ' + h;
              c.addEventListener('click', () => { hsv = rgb2hsv(hex2rgb(h)); paintFields(); take(h); });
              line.appendChild(c);
            });
            if (n === 2) line.style.marginBottom = '6px';
            sec.appendChild(line);
          });
        });
        body.appendChild(sec);

        paintFields = keepHex => {
          const g = sv.getContext('2d'), w = sv.width, h = sv.height;
          const base = hsv2rgb(hsv[0], 1, 1);
          const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, '#fff'); gx.addColorStop(1, rgb2hex(base));
          g.fillStyle = gx; g.fillRect(0, 0, w, h);
          const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(1, '#000');
          g.fillStyle = gy; g.fillRect(0, 0, w, h);
          const mx = hsv[1] * w, my = (1 - hsv[2]) * h;
          g.lineWidth = 2; g.strokeStyle = hsv[2] > 0.55 ? 'rgba(0,0,0,.8)' : '#fff';
          g.beginPath(); g.arc(mx, my, 7, 0, TAU); g.stroke();
          const hg = hue.getContext('2d'), hw = hue.width, hh = hue.height;
          for (let x = 0; x < hw; x++) { hg.fillStyle = rgb2hex(hsv2rgb(x / hw, 1, 1)); hg.fillRect(x, 0, 1, hh); }
          const hx = hsv[0] * hw;
          hg.fillStyle = '#fff'; hg.fillRect(hx - 2, 0, 4, hh); hg.fillStyle = 'rgba(0,0,0,.6)'; hg.fillRect(hx - 0.5, 0, 1, hh);
          const n = now(); nowSw.style.background = n;
          if (!keepHex && document.activeElement !== hexIn) hexIn.value = n.toUpperCase();
        };
        paintFields();
      },
      paint(body, sh) {
        sh.context(ctxText());
        // who reads it — the one line of lede
        const st = active(); if (!st) { sh.close(); return; }
        const R = readers(st)[sid] || [];
        const t = R.length ? 'Read by ' + R.map(x => (x.who ? x.who + ' ' : '') + '(' + x.what.toLowerCase() + ')' + (x.live ? '' : ', fader down')).join(' · ') + '.'
                           : 'Nothing in this scene reads this colour.';
        if (lede.textContent !== t) lede.textContent = t;
        // moved from elsewhere (a knob, REMOTE, RESET): follow it
        const g = get();
        if (!drag && !pending && g !== lastHex) { lastHex = g; hsv = rgb2hsv(hex2rgb(g)); paintFields(); }
      },
      close() { if (raf) { cancelAnimationFrame(raf); flush(); } }
    });
  }

  function build(ctx) {
    ui = { dots: [], rows: [], seen: -1, key: null };
    const g = ctx.group;

    const dots = document.createElement('div');
    dots.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:4px 0 10px';
    ui.dotLabels = [];
    for (let i = 0; i < NC; i++) {
      const cell = document.createElement('div'); cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;min-width:0';
      const d = document.createElement('div'); d.className = 'paldot';
      d.style.cssText = 'width:22px;height:22px;border-radius:50%;cursor:pointer;border:1px solid rgba(255,255,255,.18)';
      d.addEventListener('click', () => colourSheet({ kind: 'c', i }, d));
      // who reads this colour, on the wall right now
      const lab = document.createElement('div');
      lab.style.cssText = 'font:7px/1.25 ui-monospace,monospace;letter-spacing:.06em;color:var(--txt-dim,#999);text-align:center;margin-top:3px;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis';
      cell.appendChild(d); cell.appendChild(lab); dots.appendChild(cell);
      ui.dots.push(d); ui.dotLabels.push(lab);
    }
    g.appendChild(dots);

    for (let j = 0; j < NG; j++) {
      const wrap = document.createElement('div'); wrap.style.cssText = 'margin-bottom:10px';
      const name = document.createElement('div');
      name.style.cssText = 'font:8px/1.4 ui-monospace,monospace;letter-spacing:.16em;color:var(--txt-dim,#999);margin-bottom:3px';
      wrap.appendChild(name);
      const sw = document.createElement('div'); sw.style.cssText = 'display:grid;grid-template-columns:repeat(10,1fr);gap:1px';
      const cells = [];
      for (let k = 0; k < NS; k++) {
        const c = document.createElement('div'); c.style.cssText = 'height:14px;cursor:pointer';
        c.addEventListener('click', () => colourSheet({ kind: 'sw', j, k }, c));
        sw.appendChild(c); cells.push(c);
      }
      wrap.appendChild(sw);
      const cv = document.createElement('canvas'); cv.width = 200; cv.height = 12;
      cv.style.cssText = 'width:100%;height:12px;display:block;margin-top:2px;cursor:ew-resize';
      // drag along the band: the highlight follows the hand
      let drag = false;
      const at = e => { const r = cv.getBoundingClientRect(); PAL.set('hl', j, (e.clientX - r.left) / r.width); };
      cv.addEventListener('pointerdown', e => { drag = true; PAL.set('sel', j); try { cv.setPointerCapture(e.pointerId); } catch (x) {} at(e); });
      cv.addEventListener('pointermove', e => { if (drag) at(e); });
      cv.addEventListener('pointerup', () => { drag = false; });
      cv.addEventListener('dblclick', () => PAL.set('hl', j, null));      // back to its brightest swatch
      wrap.appendChild(cv);
      const bar = document.createElement('div'); bar.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:3px';
      const ps = document.createElement('select'); ps.style.cssText = SEL; ps.title = 'A measured metal on this band';
      ps.innerHTML = '<option value="">PRESET ▾</option>' + ORDER.map(k => '<option value="' + k + '">' + k + '</option>').join('');
      ps.addEventListener('change', () => { if (ps.value) PAL.set('preset', j, ps.value); ps.value = ''; });
      const sd = document.createElement('button'); sd.textContent = 'SET DEFAULT'; sd.style.cssText = BTN;
      sd.title = 'This band, as it is now, becomes the scene\'s default (RESET comes back here)';
      sd.addEventListener('click', () => PAL.set('default', j));
      bar.appendChild(ps); bar.appendChild(sd); wrap.appendChild(bar);
      g.appendChild(wrap);
      ui.rows.push({ name, cells, cv });
    }

    const foot = document.createElement('div'); foot.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px';
    const rs = document.createElement('button'); rs.textContent = 'RESET'; rs.style.cssText = BTN;
    rs.title = 'Back to the scene\'s default palette; the knobs to the middle';
    rs.addEventListener('click', () => PAL.set('reset'));
    const cf = document.createElement('select'); cf.style.cssText = SEL; cf.title = 'Another scene\'s palette';
    cf.addEventListener('focus', () => {
      const S = PAL.sources();
      cf.innerHTML = '<option value="">COPY FROM ▾</option>' + Object.keys(S).map(k => '<option value="' + k + '">' + k + '</option>').join('');
    });
    cf.innerHTML = '<option value="">COPY FROM ▾</option>';
    cf.addEventListener('change', () => { const S = PAL.sources(); const p = S[cf.value]; if (p) PAL.set('load', { c: p.c, g: p.g, hl: p.hl }); cf.value = ''; });
    const cr = document.createElement('button'); cr.textContent = 'COPY FOR REPO'; cr.style.cssText = BTN;
    cr.title = 'The palette: block for this scene\'s reg(), on the clipboard';
    cr.addEventListener('click', () => {
      const t = PAL.code(); console.log(t);
      try { navigator.clipboard.writeText(t); cr.textContent = 'COPIED'; setTimeout(() => { cr.textContent = 'COPY FOR REPO'; }, 1200); } catch (e) {}
    });
    foot.appendChild(rs); foot.appendChild(cf); foot.appendChild(cr);
    g.appendChild(foot);
  }

  function paint(ctx) {
    const st = active(); if (!st || !ui) return;
    if (ctx.status) ctx.status.textContent = (st.key || '') + ' · v' + st.ver;
    /* who reads what: follows the faders, so it is checked every paint and
       the DOM is touched only when the answer changes */
    const R = readers(st);
    const rkey = JSON.stringify(R) + st.sel;
    if (st.ver === ui.seen && st === ui.st && rkey === ui.rkey) return;          // nothing moved
    ui.seen = st.ver; ui.st = st; ui.rkey = rkey;
    const nm = st.cur.names || {};
    const whoLine = slot => { const r = R[slot] || []; return r.map(x => x.who).filter(Boolean).join(' · '); };
    const isLive = slot => (R[slot] || []).some(x => x.live);
    const why = slot => { const r = R[slot] || []; return r.length ? r.map(x => (x.who ? x.who + ': ' : '') + x.what.toLowerCase() + (x.live ? '' : ' (its fader is down)')).join('\n') : 'nothing in this scene reads this colour'; };
    ui.dots.forEach((d, i) => {
      const slot = 'c' + i, live = isLive(slot), any = (R[slot] || []).length > 0;
      d.style.background = rgb2hex(st.C[i]);
      d.style.opacity = live ? '1' : (any ? '0.45' : '0.2');
      d.style.borderStyle = any ? 'solid' : 'dashed';
      d.title = slot + ' · ' + (nm[slot] || '') + ' · ' + rgb2hex(st.C[i]) + '\n' + why(slot);
      const L = ui.dotLabels[i]; L.textContent = any ? (whoLine(slot) || nm[slot] || '') : '—';
      L.style.opacity = live ? '1' : '0.45'; L.title = d.title;
    });
    ui.rows.forEach((r, j) => {
      const slot = 'g' + j, live = isLive(slot), any = (R[slot] || []).length > 0;
      const who = whoLine(slot);
      r.name.textContent = slot + ' · ' + (nm[slot] || '') + (any ? (who ? ' → ' + who : '') : ' → nothing reads it') + (st.sel === j ? '  ◂' : '');
      r.name.title = why(slot);
      r.name.parentNode.style.opacity = live ? '1' : '0.5';
      r.cells.forEach((c, k) => { c.style.background = rgb2hex(st.SW[j][k]); c.title = st.cur.g[j][k]; });
      const g = r.cv.getContext('2d'), W = r.cv.width, H = r.cv.height;
      for (let x = 0; x < W; x++) { const c = sampleRow(st, j, x / (W - 1)); g.fillStyle = rgb2hex(c); g.fillRect(x, 0, 1, H); }
      const hx = Math.round(st.H[j] * (W - 1));
      g.fillStyle = 'rgba(0,0,0,.8)'; g.fillRect(hx - 1, 0, 3, H);
      g.fillStyle = '#fff'; g.fillRect(hx, 0, 1, H);
    });
  }

  PANELS.register({
    id: 'palette', title: 'Palette', status: true, after: ['mix', 'Mix', 'Source input'], every: 100,
    build, paint,
    show() { return !!active(); }        // a scene with no palette: no panel at all
  });
})();
