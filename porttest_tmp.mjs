// REAL Web MIDI check: what output ports exist, which one the app auto-picks,
// and send real notes at Live through it.
import { chromium } from 'playwright-core';
import path from 'path';

const EXE = process.env.CHROMIUM;
const url = 'file://' + path.resolve('night-circuit-preview.html') + '?proj';
const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
});
const ctx = await browser.newContext();
await ctx.grantPermissions(['midi', 'midi-sysex']);
const page = await ctx.newPage();
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.evaluate(() => { connectMidi(); });
await page.waitForTimeout(1500);
const before = await page.evaluate(() => ({
  outs: midi.access ? [...midi.access.outputs.values()].map(o => o.name) : null,
  ins: midi.access ? [...midi.access.inputs.values()].map(i => i.name) : null,
}));
console.log('OUTPUTS:', JSON.stringify(before.outs, null, 1));
console.log('INPUTS:', JSON.stringify(before.ins, null, 1));
// switch to midi mode -> triggers the acquire poll
await page.evaluate(() => { MOut.setMode('midi'); });
await page.waitForTimeout(2500);
const picked = await page.evaluate(() => MOut.port ? MOut.port.name : null);
console.log('AUTO-PICKED:', picked);
// fire a real test burst + raw notes at a few channels
await page.evaluate(() => {
  MOut.rawNote(1, 38, 0.6, 0.5);
  MOut.rawNote(7, 60, 0.5, 1.0);
  MOut.rawNote(5, 55, 0.5, 1.5);
});
await page.waitForTimeout(2500);
console.log('sent raw notes on ch1/7/5 — did Live hear them?');
await browser.close();
