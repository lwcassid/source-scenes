// FREE-RUNNING sync check for the poem overlay.
//   node tools/poemsync.mjs [poemIdx]
// poemshot.mjs freezes the overlay to shoot one exact frame, which means it
// cannot see a timing regression. This runs the real clock path and asserts
// the fragment index tracks AE.t() monotonically, with no drift. Run it after
// touching part241_owpoem.js.
import { chromium } from 'playwright-core';
import path from 'path';
const idx = process.argv[2] || 0;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, headless: true,
  args: ['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox',
         '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
p.on('pageerror', e => console.log('PAGEERR:', e.message));
await p.goto('file://' + path.resolve('night-circuit-preview.html') + '?proj', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(1800);
await p.evaluate(() => { document.getElementById('overlay').classList.add('fs','zen');
  openFocus(PIECES.findIndex(x => x.id === 'SRC-56')); });
await p.waitForTimeout(1200);
const r = await p.evaluate(async (pi) => {
  OWPOEM.auto = false; OWPOEM.frozen = false; OWPOEM.play(+pi);
  const t0 = OWPOEM.now(), rows = [];
  let last = -1, bad = [];
  for (let i = 0; i < 24; i++) {
    await new Promise(r => setTimeout(r, 600));
    const e = OWPOEM.now() - t0, fi = OWPOEM.fi;
    if (OWPOEM.ph === 'hold') {
      if (fi < last) bad.push('fragment went BACKWARDS at t+' + e.toFixed(2));
      // Sample the clock and the index TOGETHER, and allow one fragment of
      // slack: tick() runs at frame rate, so a sample taken between two ticks
      // legitimately straddles a boundary. Real drift grows without bound and
      // blows past 1 within a couple of seconds; a straddle never does.
      const t = OWPOEM.now();
      let acc = 0, want = 0; const te = t - OWPOEM.tStart;
      while (want < OWPOEM.slot.length - 1 && acc + OWPOEM.slot[want] <= te) { acc += OWPOEM.slot[want]; want++; }
      if (Math.abs(want - fi) > 1) bad.push('DRIFT at t+' + e.toFixed(2) + ': showing ' + fi + ', clock says ' + want);
      last = fi;
    }
    rows.push('t+' + e.toFixed(2) + '  ' + OWPOEM.ph + '  ' + (fi + 1) + '/' + OWPOEM.frags.length);
    if (OWPOEM.ph === 'off' && i > 3) break;
  }
  return { rows, bad, n: OWPOEM.frags.length };
}, idx);
console.log(r.rows.join('\n'));
console.log(r.bad.length ? '\n❌ ' + r.bad.join('\n❌ ') : '\n✅ no drift, no reversal across ' + r.n + ' fragments');
await b.close();
process.exit(r.bad.length ? 1 : 0);
