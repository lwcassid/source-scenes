// Sighted-verification driver for SOURCE scenes.
// Usage:  SCENE=SRC-15 node tools/playtest.js
// Prereq: build the offline preview first (python3 tools/build_preview.py
//         from the repo root → night-circuit-preview.html). The CDN build
//         has no WebGL offline; ALWAYS test the preview.
// Env overrides: PW_MODULE (playwright require path), CHROMIUM (executable),
//                PREVIEW (preview html path).
// Saves screenshots to /tmp/pt_<state>.png and prints scene state — READ
// the screenshots; assumptions about rendered output are wrong half the time.
const PW = process.env.PW_MODULE || 'playwright';
const { chromium } = require(PW);
(async () => {
  const sceneId = process.env.SCENE || 'SRC-15';
  const preview = process.env.PREVIEW || 'night-circuit-preview.html';
  const launch = {
    args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox']
  };
  if (process.env.CHROMIUM) launch.executablePath = process.env.CHROMIUM;
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = [];
  page.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR', e.message); });
  await page.goto('file://' + require('path').resolve(preview));
  await page.waitForTimeout(2500);

  // SCENE=ALL → smoke every registered scene: open, drive hands, count errors.
  // Run this after ANY structural/core change before pushing.
  if (sceneId === 'ALL') {
    const n = await page.evaluate(() => PIECES.length);
    let bad = 0;
    for (let i = 0; i < n; i++) {
      const before = errs.length;
      const id = await page.evaluate(i => { openFocus(i); return PIECES[i].id; }, i);
      await page.waitForTimeout(800);
      await page.evaluate(() => { try { setChan('L', 0.6); setChan('R', 0.6); focus.P.state.pres = 1; } catch (e) {} });
      await page.waitForTimeout(600);
      const nw = errs.length - before;
      if (nw) { bad++; console.log(`FAIL ${id}  +${nw} error(s): ${errs[errs.length - 1]}`); }
      else console.log(`ok   ${id}`);
    }
    console.log(`smoke done: ${n} scenes, ${bad} failing, ${errs.length} total errors`);
    await browser.close();
    process.exit(bad ? 2 : 0);
  }

  const idx = await page.evaluate(id => {
    // versioned id (SRC-15.4) → exact; bare family id (SRC-15) → NEWEST
    let i = -1;
    if (/\.\d+$/.test(id)) i = PIECES.findIndex(p => p.id === id);
    else {
      let best = -1;
      PIECES.forEach((p, j) => {
        if ((p.family || p.id) === id && (best < 0 || (p.ver || 1) >= (PIECES[best].ver || 1))) best = j;
      });
      i = best;
    }
    if (i >= 0) openFocus(i);
    return i;
  }, sceneId);
  console.log(sceneId, '→ index', idx);
  if (idx < 0) { await browser.close(); process.exit(1); }
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { if (!AE.on) document.getElementById('fSound').click(); } catch (e) {} });
  await page.waitForTimeout(800);

  const hands = (l, r) => page.evaluate(([l, r]) => {
    setChan('L', l); setChan('R', r); focus.P.state.pres = 1;
  }, [l, r]);
  const pump = setInterval(() => page.evaluate(() => { focus.P.state.pres = 1; }).catch(() => {}), 1200);
  const shot = async name => { await page.screenshot({ path: `/tmp/pt_${name}.png` }); console.log(`saved /tmp/pt_${name}.png`); };
  const state = () => page.evaluate(() => {
    const s = focus.P.state, out = {};
    for (const k of ['count', 'spread', 'eL', 'eR']) if (k in s) out[k] = typeof s[k] === 'number' ? +s[k].toFixed(2) : s[k];
    out.chord = typeof H !== 'undefined' ? H.label : undefined;
    return out;
  });

  const STATES = [
    ['idle', null, 3000],            // no hands — ambient/sleep behavior
    ['tight', [0.07, 0.07], 1500],
    ['full', [0.95, 0.95], 1500],
    ['left', [0.9, 0.1], 1500],
    ['right', [0.1, 0.9], 1500]
  ];
  for (const [name, h, wait] of STATES) {
    if (h) await hands(h[0], h[1]);
    await page.waitForTimeout(wait);
    console.log(name, JSON.stringify(await state()));
    await shot(name);
  }
  // responsiveness probe: snap wide then back, sample fast
  await hands(0.06, 0.06); await page.waitForTimeout(600);
  await hands(0.95, 0.95); await page.waitForTimeout(200);
  console.log('pop@200ms', JSON.stringify(await state()));
  await hands(0.06, 0.06); await page.waitForTimeout(250);
  console.log('vanish@250ms', JSON.stringify(await state()));

  console.log('page errors:', errs.length);
  clearInterval(pump);
  await browser.close();
  process.exit(errs.length ? 2 : 0);
})().catch(e => { console.error(e); process.exit(1); });
