// libqtest.mjs — LIBQ, the URL library filter, checked against a running page.
//   node tools/libqtest.mjs [baseUrl]
// Needs the local server (default http://127.0.0.1:8765). Exits non-zero on failure.
//
// NOTE FOR WHOEVER EDITS THIS: a hash-only page.goto() is a SAME-DOCUMENT
// navigation and does NOT reload. Every case here goes via about:blank first,
// because without that each query inherits the previous one's hidden tiles —
// which made the first run of this suite quietly measure nothing at all.
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://127.0.0.1:8765';
let fails = 0;
const ok = (name, cond, got) => {
  console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond ? '' : '  got: ' + JSON.stringify(got)));
  if (!cond) fails++;
};

const b = await chromium.launch({ channel: 'chrome' });
const pg = await b.newPage({ viewport: { width: 1500, height: 1000 } });
const errs = []; pg.on('pageerror', e => errs.push(String(e)));

const shown = () => pg.evaluate(() => [...grid.children]
  .filter(t => t.style.display !== 'none')
  .sort((a, b2) => (+a.style.order || 0) - (+b2.style.order || 0))
  .map(t => t.dataset.pid));

const go = async hash => {
  await pg.goto('about:blank');
  await pg.goto(BASE + '/index.html' + hash, { waitUntil: 'load' });
  await pg.waitForTimeout(3200);
  return shown();
};
const t = async (label, hash, expect) => {
  const r = await go(hash);
  ok(label.padEnd(26) + r.length + ' tiles · ' + r.slice(0, 6).join(' '), expect(r), r.slice(0, 8));
};

console.log('every key');
await t('src=56-&sort=new',    '#lib?src=56-&sort=new',         r => r.length > 14 && r[0].startsWith('SRC-7'));
await t('tag=webgl&sort=new',  '#lib?tag=webgl&sort=new',       r => r.length > 4);
await t('tag=bokeh+webgl all', '#lib?tag=bokeh,webgl&match=all', r => r.length === 1 && r[0] === 'SRC-71');
await t('text=circle',         '#lib?text=circle',              r => r.includes('SRC-71'));
await t('id=SRC-71,SRC-64',    '#lib?id=SRC-71,SRC-64',         r => r.length === 2);
await t('sort=new&limit=3',    '#lib?src=56-&sort=new&limit=3', r => r.length === 3 && r[0].startsWith('SRC-7'));
await t('src=56-71&sort=old',  '#lib?src=56-71&sort=old',       r => r.length > 10 && r[0] === 'SRC-56');
await t('src=71 single',       '#lib?src=71',                   r => r.length === 1 && r[0] === 'SRC-71');
await t('no query, untouched', '',                              r => r.length > 60);

console.log('it composes with the library instead of fighting it');
await go('#lib?src=56-&sort=new');
const before = (await shown()).length;
await pg.evaluate(() => { const s = document.getElementById('searchBox'); s.value = 'eclipse'; s.dispatchEvent(new Event('input')); });
await pg.waitForTimeout(700);
const withSearch = await shown();
ok('search ANDs with the URL, never widens it',
  withSearch.length < before && withSearch.every(id => parseFloat(id.replace(/^\D+/, '')) >= 56), withSearch);

await pg.evaluate(() => { const s = document.getElementById('searchBox'); s.value = ''; s.dispatchEvent(new Event('input'));
  const q = document.getElementById('sortSel'); q.value = 'title'; q.dispatchEvent(new Event('change')); });
await pg.waitForTimeout(800);
const afterSort = await shown();
ok('the URL order survives a sort-dropdown change', afterSort[0].startsWith('SRC-7'), afterSort.slice(0, 4));

// our pass only ever hides, so a live query change has to ask the library to
// redo its own pass first or the grid shrinks monotonically and never recovers
await pg.evaluate(() => { location.hash = '#lib?src=56-71'; }); await pg.waitForTimeout(800);
const wide = (await shown()).length;
await pg.evaluate(() => { location.hash = '#lib?src=71'; }); await pg.waitForTimeout(800);
const narrow = (await shown()).length;
await pg.evaluate(() => { location.hash = '#lib?src=56-71'; }); await pg.waitForTimeout(800);
const back = (await shown()).length;
ok('editing the URL live widens as well as narrows', narrow < wide && back === wide, { wide, narrow, back });

ok('no page errors', errs.length === 0, errs.slice(0, 3));
await b.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
