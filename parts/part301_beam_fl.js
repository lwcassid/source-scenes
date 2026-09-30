/* ---------- SRC-68.7 · ISOTRP C · BEAM, FULL LIGHT ----------
   Edson, Sep 29 2026, 20:01: "the instrument should never change the
   opacity of layers. This is only for the twister." And at 20:05, asked
   what hands-in should look like: "Smallest, full light."

   V2's exposure rode the LEFT hand (0.95 + 0.25·width), so the hairline
   spindle at the Source was also the dimmest the beam ever got. Here the
   exposure is FULL (V2's value at arm's length) at every hand position.
   The hands keep everything that is FORM:
     L  the width, hairline spindle → wide column, and past R 70% the trails
     R  the key: steady → chopped, elements past 50%, trails past 70%
   Chopping is time, not light: every flash is at full light.
   Hands in = the hairline beam, steady, burning at full light.

   V2's draw() calls its private sequencer, so this wraps it rather than
   copying it: during the call, ISO.render receives the full exposure and
   everything else exactly as V2 computed it. Step and sound are V2's. */
(() => {
  const prev = (typeof PIECES !== 'undefined') && PIECES.find(p => p.id === 'SRC-68.2');
  const ISO = window.ISO;
  if (!prev || !ISO) return;
  const EXP = 1.2;                                     // V2's exposure with the left hand at arm's length
  reg(Object.assign({}, prev, {
    id: 'SRC-68.7', family: 'SRC-68', ver: 7,
    title: 'ISOTRP C · Beam, Full Light',
    tech: 'BEAM + GATED ELEMENTS PAST 50% + TRAILS PAST 70% / FULL LIGHT AT EVERY HAND',
    tags: (prev.tags || []).concat(['FULL LIGHT']),
    interact: (prev.interact || '') + ' The light itself never dims with the hands: the hairline at the Source burns as bright as the column at arm\'s length. Only the Twister takes the layer away.',

    draw(P, g, w, h, t, inp) {
      const render = ISO.render;
      ISO.render = (P2, g2, w2, h2, lights, o) => render(P2, g2, w2, h2, lights, Object.assign({}, o, { exp: EXP }));
      try { return prev.draw.call(this, P, g, w, h, t, inp); }
      finally { ISO.render = render; }
    }
  }));
})();
