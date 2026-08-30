// Does an OPEN SCENE actually send MIDI in OUT:MIDI mode? Stub a fake port
// into MOut, open Chladni, drive hands 8s, count what got sent.
import { chromium } from 'playwright-core';
import path from 'path';

const EXE = process.env.CHROMIUM;
const url = 'file://' + path.resolve('night-circuit-preview.html') + '?proj';
const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.evaluate(() => {
  window.__sent = { notes: 0, ccs: 0, clock: 0, other: 0, chans: {} };
  const fake = { name: 'FAKE Virtual Cable Bus 1', send: (msg) => {
    const st = msg[0] & 0xf0, ch = (msg[0] & 0x0f) + 1;
    if (msg[0] === 0xF8) { window.__sent.clock++; return; }
    if (st === 0x90 && msg[2] > 0) { window.__sent.notes++; window.__sent.chans[ch] = (window.__sent.chans[ch] || 0) + 1; }
    else if (st === 0xB0) window.__sent.ccs++;
    else window.__sent.other++;
  } };
  MOut.port = fake;
  MOut.setMode('midi');
});
await page.evaluate(() => { openFocus(PIECES.findIndex(p => p.id === 'SRC-28.30')); });
await page.waitForTimeout(1000);
for (let i = 0; i < 8; i++) {
  await page.evaluate(() => { setChan('L', 0.35); setChan('R', 0.62); if (focus.P) focus.P.state.pres = 1; });
  await page.waitForTimeout(1000);
}
const out = await page.evaluate(() => ({ ...window.__sent, mode: MOut.mode, wants: MOut.wants(), aeOn: AE.on, running: T.running, port: MOut.port && MOut.port.name }));
console.log(JSON.stringify(out, null, 1));
await browser.close();
