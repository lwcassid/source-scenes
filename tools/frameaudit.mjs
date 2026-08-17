// Projector-realism audit — does a scene compose the same in a browser window
// and on the wall? Renders each scene TWICE: once in the old harness window
// (1280x760 -> a ~1280x397 letterbox strip) and once in the show frame
// (1920x1200 / 16:10, via ?proj), then reports how the picture changed and
// writes thumbnails of both.
//
// Usage:  node tools/frameaudit.mjs                 # latest version of every family
//         node tools/frameaudit.mjs SRC-28.4 SRC-29 # just these ids
// Prereq: python3 tools/build_preview.py  (offline preview; the CDN build has
//         no WebGL in a sandbox). npm i playwright-core.
// Env:    SETTLE=ms per state (default 6000)
// Out:    scratchshots/geo/<id>_{wide,proj}.png + metrics.json
//
// Reading the numbers: vfill/hfill = fraction of frame height/width the lit
// content spans; mean = frame brightness. A big mean jump from wide->proj means
// the wall gets a heavier picture than the window showed (element counts scale
// with canvas AREA); a vfill collapse means the composition was built for a
// wide strip and leaves the top and bottom of the wall dark.
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';

const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'file://' + path.resolve(process.env.PREVIEW || 'night-circuit-preview.html');
const OUT = path.resolve('scratchshots/geo');
const SETTLE = +(process.env.SETTLE || 6000);
const WANT = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive: true });

const GEOS = [
  { key: 'wide', vw: 1280, vh: 760, proj: false },   // a native browser window (?win — proj is the default now)
  { key: 'proj', vw: 1920, vh: 1200, proj: true },   // what the projectors show
];
const results = {};
const browser = await chromium.launch({ executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--ignore-gpu-blocklist',
         '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

// which scenes: explicit ids, else the newest version of each family
const probe = await browser.newPage({ viewport: { width: 900, height: 700 } });
await probe.goto(URL, { waitUntil: 'load', timeout: 180000 });
const ids = WANT.length ? WANT : await probe.evaluate(() => {
  const byFam = {};
  PIECES.forEach(p => { const f = p.family || p.id; if (!byFam[f] || (p.ver || 1) > (byFam[f].ver || 1)) byFam[f] = p; });
  return Object.keys(byFam).sort().map(f => byFam[f].id);
});
await probe.close();
console.log(ids.length + ' scenes ×2 frames');

for (const geo of GEOS) {
  let page = null, opened = 0;
  const fresh = async () => {                        // WebGL contexts leak across
    if (page) await page.close();                    // scenes; recycle the page
    page = await browser.newPage({ viewport: { width: geo.vw, height: geo.vh }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.log('PAGEERR', e.message.slice(0, 120)));
    await page.goto(URL + (geo.proj ? '?proj' : '?win'), { waitUntil: 'load', timeout: 180000 });
    await page.waitForTimeout(3000);
    if (geo.proj) await page.evaluate(() => document.getElementById('overlay').classList.add('fs', 'zen'));
    opened = 0;
  };
  await fresh();

  for (const id of ids) {
    if (opened >= 6) await fresh();
    opened++;
    let m;
    try {
      const ok = await page.evaluate((id) => {
        const i = PIECES.findIndex(p => p.id === id);
        if (i < 0) return false;
        if (focus.idx >= 0) closeFocus();
        openFocus(i);
        clearInterval(window.__di);                  // live mode decays — keep driving
        window.__di = setInterval(() => {
          setChan('L', 0.78); setChan('R', 0.78);
          if (focus.P && focus.P.state) focus.P.state.pres = 1;
        }, 300);
        return true;
      }, id);
      if (!ok) { console.log('MISSING', id); continue; }
      await page.waitForTimeout(SETTLE);
      m = await page.evaluate(() => {
        const c = document.getElementById('focusCanvas');
        const W = 128, H = Math.max(1, Math.round(W * c.height / c.width));
        const s = document.createElement('canvas'); s.width = W; s.height = H;
        s.getContext('2d').drawImage(c, 0, 0, W, H);
        const d = s.getContext('2d').getImageData(0, 0, W, H).data;
        const lum = new Float64Array(W * H);
        for (let i = 0, p = 0; i < d.length; i += 4, p++)
          lum[p] = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        let mean = 0, cov = 0;
        for (let i = 0; i < lum.length; i++) { mean += lum[i]; if (lum[i] > 10) cov++; }
        mean /= lum.length; cov /= lum.length;
        const rows = [], cols = new Array(W).fill(0);
        let r0 = -1, r1 = -1, c0 = -1, c1 = -1;
        for (let y = 0; y < H; y++) {
          let acc = 0, hot = 0;
          for (let x = 0; x < W; x++) { const v = lum[y * W + x]; acc += v; cols[x] += v; if (v > 10) hot++; }
          rows.push(acc / W);
          if (hot / W > 0.02) { if (r0 < 0) r0 = y; r1 = y; }
        }
        for (let x = 0; x < W; x++) { cols[x] /= H; if (cols[x] > 6) { if (c0 < 0) c0 = x; c1 = x; } }
        const band = a => { const n = 6, o = []; for (let k = 0; k < n; k++) { const s0 = Math.floor(k * a.length / n), s1 = Math.floor((k + 1) * a.length / n); let v = 0; for (let i = s0; i < s1; i++) v += a[i]; o.push(+(v / (s1 - s0)).toFixed(1)); } return o; };
        const th = document.createElement('canvas');
        th.width = 460; th.height = Math.round(460 * c.height / c.width);
        th.getContext('2d').drawImage(c, 0, 0, th.width, th.height);
        return { w: c.width, h: c.height, mean: +mean.toFixed(2), cov10: +cov.toFixed(4),
                 vfill: r0 < 0 ? 0 : +((r1 - r0 + 1) / H).toFixed(3),
                 hfill: c0 < 0 ? 0 : +((c1 - c0 + 1) / W).toFixed(3),
                 rowBands: band(rows), png: th.toDataURL('image/png') };
      });
    } catch (e) { console.log('ERR', id, String(e).slice(0, 120)); continue; }
    fs.writeFileSync(path.join(OUT, `${id}_${geo.key}.png`), Buffer.from(m.png.split(',')[1], 'base64'));
    delete m.png;
    (results[id] = results[id] || {})[geo.key] = m;
    fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify(results, null, 1));
    console.log(geo.key, id, `${m.w}x${m.h}`, 'mean', m.mean, 'ink', m.cov10, 'vfill', m.vfill, 'hfill', m.hfill);
  }
  await page.close();
}
await browser.close();

console.log('\nwindow → projector');
for (const [id, v] of Object.entries(results)) {
  if (!v.wide || !v.proj) continue;
  const br = (v.proj.mean + 1) / (v.wide.mean + 1);
  const flag = br >= 1.35 ? 'HEAVIER' : br <= 0.70 ? 'THINNER' : '';
  const shape = v.proj.vfill < 0.70 ? (v.proj.hfill >= 0.85 ? 'BAND' : 'ISLAND') : '';
  console.log(`${id.padEnd(11)} bright ×${br.toFixed(2)}  vfill ${v.wide.vfill}→${v.proj.vfill}  ${flag} ${shape}`);
}
console.log('thumbs in', OUT);
