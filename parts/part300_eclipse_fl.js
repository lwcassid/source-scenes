/* ---------- SRC-66.9 · ISOTRP A · LIGHT ECLIPSE, FULL LIGHT ----------
   Edson, Sep 29 2026, 20:01: "the instrument should never change the
   opacity of layers. This is only for the twister." And at 20:05, asked
   what hands-in should look like: "Smallest, full light."

   V4 let R open the EXPOSURE (0.35 → 1.3), so with both hands in the
   Eclipse was a dim point — the hands were fading the layer, which is the
   Twister's job in an act. Here the exposure is FULL at every hand
   position. The hands keep the FORM:
     L  walks the shape, as V4: point → disc → ring → eclipse
     R  was the light (exposure AND softness: V4's point at the Source was
        a faint haze); now it is the SIZE of the form (0.55× at the Source
        → 1× at arm's length) and the depth of the pulse. The sharpness is
        V4's at arm's length, always.
   Hands in = the smallest point, burning at full light.
   The kick, the step and the whole sound (both hands in = silence) are
   V4's, untouched: this spreads SRC-66.4 and replaces only draw().    */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-66.4');
  const ISO = window.ISO;
  if (!prev || !ISO) return;
  const EXP = 1.3;                                     // V4's exposure with R at arm's length
  reg(Object.assign({}, prev, {
    id: 'SRC-66.9', family: 'SRC-66', ver: 9,
    title: 'ISOTRP A · Light Eclipse, Full Light',
    tech: 'GLSL LIGHT FIELDS / FULL LIGHT AT EVERY HAND / R IS SIZE',
    tags: (prev.tags || []).concat(['FULL LIGHT']),
    interact: 'THE SOURCE LAW, AT FULL LIGHT. L WALKS THE SHAPE: a point at the Source, through disc and ring to the eclipse at arm\'s length. R IS THE SIZE, and with it the depth of the pulse: close is a small sharp form that barely breathes, far is a large one with a clear heartbeat. The light itself never dims; only the Twister takes the layer away.',

    draw(P, g, w, h, t) {
      const s = P.state;
      if (s.noGL) return ISO.noGLDraw(g, w, h, 'ISOTRP A · FULL LIGHT');
      const x = clamp(s.x);
      const depth = 0.35 + 0.65 * x;                     // R far = a clear heartbeat (form, not light)
      const k = s.kick * depth, b = s.body * depth;
      const size = 0.55 + 0.45 * x;                      // R: the size of the form
      const grow = (1 + 0.24 * k + 0.07 * b) * size;
      const m = clamp(s.m) * 3, gr = clamp(s.m);
      const wt = i => Math.max(0, 1 - Math.abs(m - i));
      const y = 0.04 + 0.01 * Math.sin(s.drift * 0.3), xx = 0.02 * Math.sin(s.drift * 0.21);
      const lights = [
        { type: 0, x: xx, y, s: (0.03 + 0.06 * gr) * grow, i: 1.2 * wt(0) },
        { type: 1, x: xx, y, s: (0.06 + 0.26 * gr) * grow, i: 0.95 * wt(1) },
        { type: 2, x: xx, y, s: (0.10 + 0.28 * gr) * grow, i: 1.0 * wt(2) * (1 + 0.25 * s.treb * depth), ang: s.ang },
        { type: 3, x: xx, y, s: (0.12 + 0.26 * gr) * grow, i: 1.0 * wt(3), prm: clamp(0.25 + 0.55 * (m - 2) - 0.10 * b - 0.22 * k) }
      ].filter(L => L.i > 0.002);
      ISO.render(P, g, w, h, lights, {
        t, soft: Math.max(0.03, 0.15 - 0.3 * k),         // V4's sharpness at arm's length, always: a haze is a dimmer light
        exp: EXP * (1 + 0.8 * k + 0.2 * b)              // full light always; the kick still flares it
      });
      ISO.hud(P, g, w, h, 'SHAPE ' + ['POINT', 'DISC', 'RING', 'ECLIPSE'][s.stage] + ' ' + Math.round(gr * 100) +
        '   SIZE ' + Math.round(size * 100) + '   PULSE ' + Math.round(k * 100) + ' / ' + Math.round(b * 100) +
        (s.src === 'line' ? '   · LISTENING' : '   · OWN PULSE (no input)') + '   · FULL LIGHT');
    }
  }));
})();
