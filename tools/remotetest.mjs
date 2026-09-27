// remotetest.mjs — REMOTE: one page sends, another page applies, over the relay.
//   node tools/remotetest.mjs [baseUrl]
// Needs the local server (default http://127.0.0.1:8765) AND the relay
// (`node tools/relay.mjs`, port 8766). Exits non-zero on failure.
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const RELAY = 'ws://127.0.0.1:8766';
// NEVER the live room: a test run while the studio is connected would drive their wall
const ROOM = 'test' + Date.now().toString(36);
let fails = 0;
const ok = (name, cond, got) => { console.log((cond ? '  ok   ' : '  FAIL ') + name + (cond ? '' : '  got: ' + JSON.stringify(got))); if (!cond) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

const b = await chromium.launch({ channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] });
const mk = async () => { const c = await b.newContext({ viewport: { width: 1400, height: 900 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e))); return { p, errs }; };
const S = await mk(), Rc = await mk();
const open = async (pg, url) => { await pg.goto('about:blank'); await pg.goto(url, { waitUntil: 'load' }); await pg.waitForTimeout(3000); };

console.log('A PAGE WITH NO ROLE does nothing');
await open(Rc.p, BASE + '/index.html#scene=SRC-28');
let st = await Rc.p.evaluate(() => ({ cfg: REMOTE.cfg, panel: !!document.getElementById('remoteGroup') }));
ok('no cfg, no panel, no socket', st.cfg === null && !st.panel, st);

console.log('RECEIVER opens the set; SENDER opens Act I');
await open(Rc.p, BASE + '/index.html?relay=' + RELAY + '&recv=' + ROOM + '#set=BIRTH+OF+A+TEMPLE+0.2');
await open(S.p, BASE + '/index.html?relay=' + RELAY + '&send=' + ROOM + '#scene=SRC-73');
await wait(1500);
let rs = await Rc.p.evaluate(() => REMOTE.state()), ss = await S.p.evaluate(() => REMOTE.state());
ok('both connected', rs.open && ss.open, { rs, ss });
ok('the receiver followed the sender into SRC-73', await Rc.p.evaluate(() => focus.idx >= 0 && PIECES[focus.idx].id === 'SRC-73'), rs);
ok('the sender measured a round trip', ss.rtt !== null && ss.rtt < 500, ss.rtt);
ok('the config survived the URL rewrite (#scene= drops the query)', await S.p.evaluate(room => location.search === '' && JSON.parse(localStorage.getItem('srcRemote')).room === room, ROOM), null);

console.log('THE HANDS cross');
await S.p.evaluate(() => { setChan('L', 0.8); setChan('R', 0.3); });
await wait(900);
let h = await Rc.p.evaluate(() => ({ L: +chan.L.target.toFixed(2), R: +chan.R.target.toFixed(2), mode: chan.L.mode }));
ok('receiver hands at 0.8 / 0.3, live', Math.abs(h.L - 0.8) < 0.03 && Math.abs(h.R - 0.3) < 0.03 && h.mode === 'live', h);
await S.p.evaluate(() => { setChan('L', 0.8); setChan('R', 0.3); });
await wait(2500);
h = await Rc.p.evaluate(() => ({ L: +chan.L.target.toFixed(2), mode: chan.L.mode }));
ok('and HOLD: still 0.8 after 2.5 s of no movement (keepalive)', Math.abs(h.L - 0.8) < 0.03, h);

console.log('THE KNOBS cross: faders, a macro, blackout, a poem cue');
await S.p.evaluate(() => { MIX.set(2, 0.6); MIX.macro(0, 0.75); });
await wait(700);
let m = await Rc.p.evaluate(() => MIX.state());
ok('receiver fader 3 = 0.6, DEPTH = 0.75', m && m.want[2] === 0.6 && m.macro[0] === 0.75, m);
await S.p.evaluate(() => MIX.blackout());
await wait(700);
m = await Rc.p.evaluate(() => MIX.state());
ok('receiver is in BLACKOUT', m && m.black, m);
await S.p.evaluate(() => MIX.blackout());
await wait(700);
m = await Rc.p.evaluate(() => MIX.state());
ok('and back, fader 3 still 0.6', m && !m.black && m.want[2] === 0.6, m);
const deck = await Rc.p.evaluate(async () => { const before = POEMDECK.armed; return { before }; });
await S.p.evaluate(() => POEMDECK.go());
await wait(500);
const deck2 = await Rc.p.evaluate(() => ({ armed: POEMDECK.armed, last: REMOTE.state().last }));
ok('a GO reached the receiver\'s deck', deck2.last === 'deck:go', { deck, deck2 });

console.log('THE SCENE follows: Act II, then close');
await S.p.evaluate(() => openFocus(PIECES.findIndex(p => p.id === 'SRC-74')));
await wait(2500);
ok('receiver is on SRC-74', await Rc.p.evaluate(() => focus.idx >= 0 && PIECES[focus.idx].id === 'SRC-74'), null);
await S.p.evaluate(() => closeFocus());
await wait(1200);
ok('receiver closed too', await Rc.p.evaluate(() => focus.idx < 0), null);

console.log('THE PROTECTION RULE: a foreign scene on the receiver takes hands, ignores mixer calls, no errors');
await S.p.evaluate(() => openFocus(PIECES.findIndex(p => p.id === 'SRC-28')));
await wait(2500);
await S.p.evaluate(() => { setChan('L', 0.55); MIX.set(0, 1); MIX.blackout(); });
await wait(900);
const f = await Rc.p.evaluate(() => ({ id: PIECES[focus.idx] && PIECES[focus.idx].id, L: +chan.L.target.toFixed(2), mix: MIX.state(), err: REMOTE.state().err }));
ok('SRC-28 open on the receiver, hands at 0.55, mixer calls ignored, no error', f.id === 'SRC-28' && Math.abs(f.L - 0.55) < 0.03 && f.mix === null && !f.err, f);

console.log('A LATE JOINER lands where the sender is (the room opens the link after Edson is already playing)');
await S.p.evaluate(() => openFocus(PIECES.findIndex(p => p.id === 'SRC-73')));
await wait(2500);
await S.p.evaluate(() => { MIX.set(1, 0.45); MIX.set(2, 0.7); MIX.macro(0, 0.3); });
await wait(400);
const L2 = await mk();
await open(L2.p, BASE + '/index.html?relay=' + RELAY + '&recv=' + ROOM + '#set=BIRTH+OF+A+TEMPLE+0.2');
await wait(4500);
let lj = await L2.p.evaluate(() => ({ id: focus.idx >= 0 ? PIECES[focus.idx].id : null, mix: MIX.state() }));
ok('late joiner is on SRC-73 with the sender\'s faders and DEPTH', lj.id === 'SRC-73' && lj.mix && lj.mix.want[1] === 0.45 && lj.mix.want[2] === 0.7 && lj.mix.macro[0] === 0.3, lj);
await S.p.evaluate(() => MIX.blackout());
await wait(600);
await L2.p.goto('about:blank');
await open(L2.p, BASE + '/index.html#set=BIRTH+OF+A+TEMPLE+0.2');      // a RELOAD: the config is remembered
await wait(4500);
lj = await L2.p.evaluate(() => ({ id: focus.idx >= 0 ? PIECES[focus.idx].id : null, mix: MIX.state() }));
ok('after a reload mid-blackout: same scene, black, faders kept for the return', lj.id === 'SRC-73' && lj.mix && lj.mix.black, lj);
await S.p.evaluate(() => MIX.blackout());
await wait(2200);
lj = await L2.p.evaluate(() => MIX.state());
ok('and the blackout returns to the sender\'s faders, not zeros', lj && !lj.black && lj.want[1] === 0.45 && lj.want[2] === 0.7, lj);
ok('no page errors (late joiner)', L2.errs.length === 0, L2.errs.slice(0, 3));

console.log('STOP REMOTE forgets the room');
await S.p.evaluate(() => REMOTE.off());
await wait(300);
ok('sender cfg cleared and storage empty', await S.p.evaluate(() => REMOTE.cfg === null && localStorage.getItem('srcRemote') === null), null);

ok('no page errors (sender)', S.errs.length === 0, S.errs.slice(0, 3));
ok('no page errors (receiver)', Rc.errs.length === 0, Rc.errs.slice(0, 3));
await b.close();
console.log(fails ? '\n' + fails + ' FAILED' : '\nall passed');
process.exit(fails ? 1 : 0);
