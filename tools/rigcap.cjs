// Generic rig-capture harness: open a scene, drive hands, dump MOut.log by role.
// Usage: SCENE=SRC-38.19 [DRIVE=sweep|hold|param] node t_scene.cjs
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const sceneId = process.env.SCENE || 'SRC-38.19';
  const browser = await chromium.launch({
    args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--mute-audio']
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1200 } });
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.goto('file://' + path.resolve('night-circuit-preview.html') + '?proj');
  await page.waitForTimeout(2500);
  const opened = await page.evaluate((id) => {
    const i = PIECES.findIndex(p => p.id === id);
    if (i < 0) return null;
    openFocus(i);
    return PIECES[i].id;
  }, sceneId);
  if (!opened) { console.log('FAIL: scene not found', sceneId); process.exit(1); }
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    MOut.mode = 'midi';
    MOut.port = { name: 'stub', send() {} };
    MOut.log.length = 0;
    window.__expr = {};
    const oe = MOut.expr.bind(MOut);
    MOut.expr = (role, v) => { window.__expr[role] = Math.round(v * 100) / 100; return oe(role, v); };
  });
  const drive = process.env.DRIVE || 'sweep';
  const SECS = +(process.env.SECS || 20);
  for (let k = 0; k < SECS * 2; k++) {
    await page.evaluate(({ k, drive }) => {
      let l, r;
      if (drive === 'hold') { l = 0.75; r = 0.75; }
      else if (drive === 'low') { l = 0.2; r = 0.2; }
      else { l = 0.15 + 0.7 * ((k * 0.11) % 1); r = 0.2 + 0.65 * ((k * 0.07) % 1); }
      setChan('L', l); setChan('R', r);
      if (focus && focus.P) focus.P.state.pres = 1;
    }, { k, drive });
    await page.waitForTimeout(500);
  }
  const out = await page.evaluate(() => {
    const byRole = {};
    for (const e of MOut.log) {
      byRole[e.role] = byRole[e.role] || { n: 0, notes: {}, vels: [] };
      byRole[e.role].n++;
      byRole[e.role].notes[e.note] = (byRole[e.role].notes[e.note] || 0) + 1;
      byRole[e.role].vels.push(e.vel);
    }
    for (const r in byRole) {
      const v = byRole[r].vels;
      byRole[r].vel = { min: Math.min(...v), max: Math.max(...v), spread: new Set(v).size };
      delete byRole[r].vels;
    }
    return { byRole, expr: window.__expr, label: typeof H !== 'undefined' ? H.label : '?' };
  });
  console.log('SCENE', opened, 'chord', out.label);
  console.log('EXPR', JSON.stringify(out.expr));
  for (const r in out.byRole) console.log(r.padEnd(8), 'n=' + out.byRole[r].n,
    'vel', JSON.stringify(out.byRole[r].vel), 'notes', JSON.stringify(out.byRole[r].notes));
  await browser.close();
})();
