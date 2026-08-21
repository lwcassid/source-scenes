// Sighted-iteration harness for the SHELL — the library wall, the queue
// drawer, the shared-sets shelf, SHOW CHECK. shot.mjs opens a SCENE; this
// opens the parts of the app you can only see with no scene running.
//
// Usage: node tools/shotui.mjs [outPrefix] [--fresh] [--set=NAME]
//   --fresh   wipe localStorage first = a SHOW LAPTOP THAT HAS NEVER RUN THIS
//             BUILD. This is the state setlists.json exists to serve, and the
//             only way to prove `default: true` actually lands.
//   --set     also LOAD the named shared set and shoot the result.
//
// Prints a QUEUE VERDICT block: what the queue holds, in order, resolved to
// titles. Read that, not just the pixels — a set list is a list, and a list
// is checkable. Exits 1 if a queued id resolves to no scene, which is the
// failure mode a typo in setlists.json produces (silently, at 3am).
import { chromium } from 'playwright-core';
import path from 'path';
import fs from 'fs';

const EXE = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const outPrefix = (process.argv[2] || 'ui').replace(/^--.*/, 'ui');
const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const setArg = (args.find(a => a.startsWith('--set=')) || '').slice(6);

const preview = path.resolve('night-circuit-preview.html');
if (!fs.existsSync(preview)) {
  console.log('NO PREVIEW: run `python3 tools/build_preview.py` first'); process.exit(1);
}
fs.mkdirSync('scratchshots', { recursive: true });

const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
         '--use-gl=swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
// The wall is chrome, not the projector frame: shoot it at a laptop viewport.
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('PAGEERR:', e.message));

const url = 'file://' + preview;
if (FRESH) {
  // localStorage is per-origin and file:// origins are opaque, so land once,
  // wipe, and reload — that reload IS the fresh-laptop boot path.
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
}
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);

if (setArg) await page.evaluate(name => QUEUE.loadSet(name), setArg);

const verdict = await page.evaluate(() => {
  const byFam = {};
  PIECES.forEach(p => { const f = p.family || p.id; if (!byFam[f] || p.ver > byFam[f].ver) byFam[f] = p; });
  return {
    sets: (typeof SETLISTS !== 'undefined' ? SETLISTS.sets : []).map(s => ({
      name: s.name, def: !!s.default, n: s.scenes.length })),
    queue: QUEUE.list.map(id => ({ id, title: byFam[id] ? byFam[id].title : null })),
  };
});

console.log('\n=== QUEUE VERDICT' + (FRESH ? ' (fresh laptop)' : '') + ' ===');
console.log('shared sets:', verdict.sets.map(s => `${s.name}${s.def ? '*' : ''} (${s.n})`).join(', ') || 'none');
let bad = 0;
verdict.queue.forEach((q, i) => {
  if (!q.title) bad++;
  console.log(` ${String(i + 1).padStart(2)}. ${q.id.padEnd(8)} ${q.title || '!! RESOLVES TO NO SCENE !!'}`);
});
if (!verdict.queue.length) { console.log(' (queue empty)'); bad++; }

// the wall, then the drawer that holds the set list
const shoot = async (label) => {
  const out = `scratchshots/${outPrefix}_${label}.png`;
  await page.screenshot({ path: out });
  console.log('shot', out);
};
await shoot('wall');
await page.evaluate(() => {
  document.getElementById('queuePop').classList.add('open');
  QUEUE.refresh();
});
await page.waitForTimeout(1200);          // let the thumbnails paint
await shoot('drawer');

await browser.close();
if (bad) { console.log(`\nFAIL: ${bad} unresolved/empty queue entr${bad === 1 ? 'y' : 'ies'}`); process.exit(1); }
console.log('\nOK: every queued id resolves to a scene');
