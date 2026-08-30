/* ---------- SRC-44 · ALIGNMENT FIELD (two-projector registration test card) ----------

   NOT a performance scene — a TOOL, and it breaks several scene-craft laws on
   purpose. Two PT-VMZ50s are fed the same signal off one HDMI splitter, so
   "alignment" here means getting their two images to land on top of each other
   on the scrim. Every choice below serves someone standing at a projector with
   an allen key, not a stranger at the pedestal:

   - IT NEVER GOES IDLE. Law 5 (presence gates everything) is deliberately
     broken. The person who needs this picture is thirty feet away up a ladder
     and cannot keep waving at the sensor to keep it alive. No hands = the
     pattern simply holds at its defaults.
   - IT IS SILENT. No audio() at all. You are talking to whoever is on the
     ladder; a drone over that conversation is just noise.
   - NO BLOOM (fx:{}). Every other scene wants the glow. A test card needs hard
     edges, because the entire job is judging whether an edge is one edge or
     two.
   - LINE WEIGHT IS A HAND, not a constant. Scrim eats thin lines, but a fat
     line HIDES a small misregistration — the useful weight is whatever is just
     thick enough to survive the mesh, and that changes with throw distance,
     screen gain and how much dust is in the air. Sweep it live rather than
     guessing at build time.

   Deliberately NOT in the default set list (setlists.json untouched): nobody
   wants the test card arriving mid-show on a SHOWTIME auto-advance. Tick it
   into the queue by hand when you are aiming, then untick it.                */

const ALIGNPAT = {
  // A crosshair-in-rings convergence target. Doubling shows first on the
  // rings — two circles a few px apart are unmistakable in a way that two
  // straight lines are not.
  target(g, x, y, r, lw) {
    g.lineWidth = lw;
    g.beginPath();
    g.moveTo(x - r, y); g.lineTo(x + r, y);
    g.moveTo(x, y - r); g.lineTo(x, y + r);
    g.stroke();
    for (const k of [0.42, 0.78, 1]) {
      g.beginPath(); g.arc(x, y, r * k, 0, TAU); g.stroke();
    }
  },
  // Bar groups at descending pitch. The finest group you can still read as
  // separate bars IS your registration error — this is the number to quote
  // when someone asks "how close is close enough".
  vernier(g, x, y, wd, ht, lw) {
    const pitches = [24, 16, 12, 8, 6, 4, 3];
    const colW = wd / pitches.length;
    g.font = '600 ' + Math.round(ht * 0.20) + 'px ui-monospace,monospace';
    g.textAlign = 'center'; g.textBaseline = 'top';
    pitches.forEach((p, i) => {
      const x0 = x + i * colW, barH = ht * 0.66;
      for (let bx = 0; bx < colW - p; bx += p * 2) {
        g.fillRect(Math.round(x0 + bx), Math.round(y), Math.max(1, p), Math.round(barH));
      }
      g.fillText(p + 'px', Math.round(x0 + colW / 2), Math.round(y + barH + ht * 0.08));
    });
    g.textAlign = 'start'; g.textBaseline = 'alphabetic';
    g.lineWidth = lw;
  },
};

reg({
  id: 'SRC-44', family: 'SRC-44', ver: 1,
  textIsContent: true,  // the labels ARE the test card — performance mode must not strip them
  title: 'Alignment Field', tech: 'TEST CARD / TWO-PROJECTOR REGISTRATION',
  music: { bpm: 78, root: 45, mode: 'aeolian' },
  fx: {},
  acts: ['GRID', 'CONVERGE', 'FLAT FIELD', 'EDGES'],
  setAct(P, i) { if (P.state && i >= 0 && i < 4) P.state.act = i; },
  tags: ['TEST CARD', 'NOT A SCENE', 'SILENT ON PURPOSE', 'KEEP IT OUT OF THE SET'],
  desc: 'The test card for aiming the two projectors. Both PT-VMZ50s show the same signal off the splitter, so the whole job is making their two pictures land on top of each other on the scrim — and every part of this pattern is built to make a few pixels of disagreement obvious. Four cards, on keys 1-4 or the act chips. GRID is square cells with a heavy centre cross and a true circle: the circle catches aspect and keystone errors that a grid alone hides, because a stretched circle is an egg and everybody can see an egg. CONVERGE is nine crosshair-in-ring targets — centre, edges, corners — plus a bar ladder from 24px down to 3px; the finest rung you can still read as separate bars IS your registration error, which is the number to quote when someone asks how close is close enough. FLAT FIELD is a plain lit field with a grey staircase and RGB patches: it shows the overlap seam, hotspots, vignetting, and whether the two lamps actually match in brightness and colour. EDGES puts a hairline frame, corner Ls and a slow sweeping bar right at the boundary, which is how you catch cropping and overscan. It never fades out and it makes no sound, both on purpose: whoever needs it is up a ladder, not at the pedestal.',
  interact: 'The hands are the two knobs you actually want while aiming. LEFT sets brightness — dim it right down for fine convergence work, where a hot picture blooms on the mesh and hides the very doubling you are hunting, then run it up to find the frame edges in a bright room. RIGHT sets line weight, from a hairline to a fat stroke: thin lines vanish into the mesh but fat ones HIDE a small misregistration, so the useful weight is whatever is just thick enough to see, and that changes with throw, gain and dust. Sweep it until the doubling pops. With nobody at the instrument it holds a bright, mid-weight card rather than going idle — this is the one scene that must stay up while you walk away from it.',
  sound: 'None, deliberately. This is the only silent scene in the library: you are talking to someone on a ladder thirty feet away, and a drone over that conversation is just noise. It sends no notes, so THE RIG stays dark and Ableton hears nothing but the scene bed note every scene sends on open.',

  init(P) {
    P.state = {
      act: 0,
      bright: 1,     // held, not gated on presence — see the header
      weight: 6,
      sweep: 0,
    };
  },

  step(P, dt, t, inp) {
    const s = P.state;
    const k = Math.min(1, dt * 6);
    // Only follow the hands while somebody is actually there. Without this the
    // card would drift with whatever the channels decay to and quietly change
    // under the person aiming — the exact opposite of what a reference is for.
    const live = typeof chan !== 'undefined' && (chan.L.mode === 'live' || chan.R.mode === 'live');
    if (live) {
      s.bright += ((0.28 + 0.72 * clamp(inp.L)) - s.bright) * k;
      s.weight += ((1 + 13 * clamp(inp.R)) - s.weight) * k;
    }
    s.sweep = (s.sweep + dt * 0.11) % 1;
  },

  draw(P, g, w, h, t, inp) {
    const s = P.state;
    const lw = Math.max(1, s.weight * (h / 1200));   // weight is quoted at show height
    const v = Math.round(255 * clamp(s.bright));
    const ink = `rgb(${v},${v},${v})`;
    const dim = `rgba(${v},${v},${v},0.45)`;
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = lw;
    g.lineCap = 'butt';

    if (s.act === 0) {
      // ---- GRID: square cells, heavy centre, and a TRUE CIRCLE. 16:10 divides
      // into exactly 16x10 squares, so any cell that isn't square is the
      // projector's fault, not the pattern's.
      const cell = w / 16;
      // The grid keeps its own weight, capped to a twentieth of a cell. At the
      // top of the weight knob a shared lw ate 12% of every cell and the card
      // turned into a brick wall — and the knob is there for CONVERGE and
      // EDGES, where fattening the marks is the whole point.
      g.strokeStyle = dim;
      g.lineWidth = Math.max(1, Math.min(lw, cell * 0.05));
      g.beginPath();
      for (let i = 1; i < 16; i++) { const x = Math.round(i * cell) + 0.5; g.moveTo(x, 0); g.lineTo(x, h); }
      for (let j = 1; j < 10; j++) { const y = Math.round(j * cell) + 0.5; g.moveTo(0, y); g.lineTo(w, y); }
      g.stroke();
      g.strokeStyle = ink;
      // No thirds tier. w/3 and h/3 are not multiples of the cell, so those
      // lines landed mid-cell and sliced slivers off the grid that read as a
      // rendering fault — which is fatal on the one card whose entire job is
      // being trusted as a reference. Thirds are a photographer's convention
      // and buy alignment nothing; the centre cross and the circle do the work.
      g.lineWidth = lw * 2;
      g.beginPath();
      g.moveTo(w / 2, 0); g.lineTo(w / 2, h);
      g.moveTo(0, h / 2); g.lineTo(w, h / 2);
      g.stroke();
      // a circle is the aspect check everyone can read: stretched, it is an egg
      g.beginPath(); g.arc(w / 2, h / 2, h * 0.42, 0, TAU); g.stroke();
      g.lineWidth = lw;
      g.strokeRect(Math.round(lw) + 0.5, Math.round(lw) + 0.5, w - 2 * Math.round(lw) - 1, h - 2 * Math.round(lw) - 1);

    } else if (s.act === 1) {
      // ---- CONVERGE: nine targets + the bar ladder
      const r = Math.min(w, h) * 0.075;
      for (const fy of [0.16, 0.5, 0.84]) {
        for (const fx2 of [0.13, 0.5, 0.87]) {
          if (fx2 === 0.5 && fy === 0.5) continue;
          ALIGNPAT.target(g, w * fx2, h * fy, r, lw);
        }
      }
      g.lineWidth = lw * 2;
      ALIGNPAT.target(g, w / 2, h / 2, r * 1.5, lw * 2);
      g.lineWidth = lw;
      ALIGNPAT.vernier(g, w * 0.22, h * 0.645, w * 0.56, h * 0.105, lw);

    } else if (s.act === 2) {
      // ---- FLAT FIELD: the overlap seam, hotspots and lamp mismatch all live
      // here. A plain lit field is the only thing that shows them.
      g.fillRect(0, 0, w, h);
      const bh = h * 0.11, by = h - bh - h * 0.06;
      const pw = w * 0.125, gap = w * 0.005, x0 = (w - (6 * pw + 5 * gap)) / 2;
      // The staircase sits on a BLACK band: its top step is the same value as
      // the field, so on the bare field it vanished and you only ever saw five.
      g.fillStyle = '#000';
      g.fillRect(x0 - gap, by - gap, 6 * pw + 5 * gap + gap * 2, bh + gap * 2);
      for (let i = 0; i < 6; i++) {
        const q = Math.round(255 * clamp(s.bright) * (i / 5));
        g.fillStyle = 'rgb(' + q + ',' + q + ',' + q + ')';
        g.fillRect(x0 + i * (pw + gap), by, pw, bh);
      }
      const cols = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
      cols.forEach((c, i) => {                          // colour/lamp match
        g.fillStyle = c;
        g.fillRect(x0 + i * (pw + gap), by - bh - h * 0.025, pw, bh);
      });
      g.fillStyle = '#000';
      g.fillRect(w * 0.5 - lw, 0, lw * 2, h);           // one black seam to judge the join

    } else {
      // ---- EDGES: hairline frame, corner Ls, and a slow bar that makes any
      // crop or overscan obvious as it runs off the edge.
      g.lineWidth = Math.max(1, lw * 0.5);
      g.strokeRect(0.5, 0.5, w - 1, h - 1);
      g.lineWidth = lw;
      const L = Math.min(w, h) * 0.16;
      const corner = (x, y, sx, sy) => {
        g.beginPath();
        g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y);
        g.stroke();
      };
      const m = Math.round(lw * 1.5);
      corner(m, m, 1, 1); corner(w - m, m, -1, 1);
      corner(m, h - m, 1, -1); corner(w - m, h - m, -1, -1);
      const sx2 = s.sweep * w, sy2 = ((s.sweep * 1.618) % 1) * h;
      g.globalAlpha = 0.85;
      g.fillRect(Math.round(sx2) - lw, 0, lw * 2, h);
      g.fillRect(0, Math.round(sy2) - lw, w, lw * 2);
      g.globalAlpha = 1;
    }

    // HUD — the numbers you shout down the ladder. On its own black plate,
    // because on FLAT FIELD dim-grey-on-grey disappeared entirely and the one
    // card where you most want to read the LEVEL was the one that hid it.
    const hud = ['GRID', 'CONVERGE', 'FLAT FIELD', 'EDGES'][s.act] +
      '   ·   ' + w + '×' + h +
      '   ·   WEIGHT ' + s.weight.toFixed(1) + 'px' +
      '   ·   LEVEL ' + Math.round(s.bright * 100) + '%' +
      '   ·   1-4 SWITCHES CARDS';
    const fs = Math.round(h * 0.019);
    g.font = '600 ' + fs + 'px ui-monospace,monospace';
    const tw = g.measureText(hud).width, hx = Math.round(w * 0.03), hy = Math.round(h * 0.965);
    g.fillStyle = 'rgba(0,0,0,0.8)';
    g.fillRect(hx - fs * 0.6, hy - fs * 1.15, tw + fs * 1.2, fs * 1.7);
    g.fillStyle = dim;
    g.fillText(hud, hx, hy);
  },
});
