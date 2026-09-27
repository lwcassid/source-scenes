// relay.mjs — a room relay for REMOTE (parts/partcore_remote.js).
//   node tools/relay.mjs [port]            default 8766
// Every message a client sends is forwarded to every OTHER client in the same
// room, unchanged. Rooms are named by the URL path: ws://host:8766/room/<name>.
// No state, no auth beyond the room name: it is a jam tool, not a product.
//
// To reach it from outside the studio:  ngrok http 8766   → wss://<xxxx>.ngrok-free.app
// or, with nothing installed:            ssh -R 80:localhost:8766 nokey@localhost.run
// Needs `npm i ws --no-save` once (like playwright-core for the harnesses).
import http from 'http';
import { WebSocketServer } from 'ws';

const PORT = +(process.argv[2] || 8766);
const rooms = new Map();          // name → Set<ws>
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('relay ok · rooms: ' + [...rooms.entries()].map(([k, v]) => k + '(' + v.size + ')').join(' ') + '\n');
});
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  const m = (req.url || '').match(/^\/room\/([A-Za-z0-9_\-]+)/);
  const room = m ? m[1] : 'default';
  if (!rooms.has(room)) rooms.set(room, new Set());
  const set = rooms.get(room); set.add(ws);
  ws.on('message', data => { for (const o of set) if (o !== ws && o.readyState === 1) o.send(data.toString()); });
  ws.on('close', () => { set.delete(ws); if (!set.size) rooms.delete(room); });
  ws.on('error', () => {});
  console.log(new Date().toISOString().slice(11, 19), 'join', room, 'now', set.size);
});
server.listen(PORT, () => console.log('relay on ws://0.0.0.0:' + PORT + '/room/<name>'));
