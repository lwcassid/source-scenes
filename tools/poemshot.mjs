// Shoot a chosen poem fragment, in a chosen mode, over a chosen scene.
//   node tools/poemshot.mjs <sceneId> <poemIdx> <solo|pair> <fragIdx> <out> <L> <R>
// Hand values are the harness convention: reach OUTWARD = 1.
import { chromium } from 'playwright-core';
import path from 'path'; import fs from 'fs';
const [,, sceneId, poemIdx, mode, fragIdx, out, L, R] = process.argv;
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, headless: true,
  args: ['--enable-unsafe-swiftshader','--use-gl=swiftshader','--ignore-gpu-blocklist','--no-sandbox',
         '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1200 } });
p.on('pageerror', e => console.log('PAGEERR:', e.message));
p.on('console', m => { if (m.type()==='error') console.log('ERR:', m.text().slice(0,220)); });
await p.goto('file://' + path.resolve('night-circuit-preview.html') + '?proj', { waitUntil:'load', timeout:60000 });
await p.waitForTimeout(2200);
await p.evaluate(([id]) => { document.getElementById('overlay').classList.add('fs','zen');
  openFocus(PIECES.findIndex(x => x.id === id)); }, [sceneId]);
await p.waitForTimeout(1200);
for (let i=0;i<6;i++){ await p.evaluate(([l,r])=>{setChan('L',+l);setChan('R',+r);},[L,R]); await p.waitForTimeout(400); }
// force the overlay into a known state: this poem, this mode, this fragment, fully arrived
await p.evaluate(([pi, md, fi]) => {
  OWPOEM.auto = false; OWPOEM.frozen = true; OWPOEM.mode = md; OWPOEM.play(+pi);
  OWPOEM.ph = 'hold'; OWPOEM.fi = +fi;
  let acc = 0; for (let k = 0; k < +fi; k++) acc += OWPOEM.slot[k];
  OWPOEM.t = acc + OWPOEM.slot[+fi] * 0.5;    // mid-fragment: fully landed
}, [poemIdx, mode, fragIdx]);
await p.waitForTimeout(700);
fs.mkdirSync('scratchshots',{recursive:true});
await p.screenshot({ path: 'scratchshots/'+out+'.png' });
console.log('shot scratchshots/'+out+'.png');
await b.close();
