/* ---------- SRC-80.4 · CABLES SPHERE, FULL LIGHT ----------
   Edson, Sep 29 2026, 20:01: "the instrument should never change the
   opacity of layers. This is only for the twister." And at 20:05, asked
   what both hands in should look like: "Smallest, full light." Near = less
   is the least FORM (fewer, smaller, slower), never dimmer.

   MEASURED on V3 (1920x1200, lit = luma > 12 on a 192x120 downsample):
   both hands in gave 0 lit pixels, a black wall. The left hand shrinks the
   disc to 0.35 of the height and turns the lens off, so the disc shows only
   the middle of the liquid, and the calm liquid there sits below the ramp's
   black stop (0.355): the small form was there, drawn in black.

   So the ramp follows the left hand. As the disc shrinks, the black stop
   and the deep stop walk down (0.355 → 0.010, 0.730 → 0.280), so the whole
   small disc is coloured: the smallest form, at full light. At L = 1 both
   stops are exactly V3's, so the wide sphere does not change. The right
   hand is still the storm, the knobs are still the colour, and the sound is
   still listening only (no voice of its own, so nothing to silence).
   Everything else is V3, spread, not copied. */
(() => {
  if (typeof PIECES === 'undefined') return;
  const prev = PIECES.find(p => p.id === 'SRC-80.3');
  if (!prev) return;
  reg(Object.assign({}, prev, {
    id: 'SRC-80.4', family: 'SRC-80', ver: 4,
    title: 'Learning: Cables Sphere, Full Light',
    interact: prev.interact + ' FULL LIGHT (Sep 29): near is the smallest disc, never a darker one; the hands never fade it, only the Twister does.',
    step(P, dt, t, inp) {
      prev.step(P, dt, t, inp);
      const s = P.state;
      if (s.noGL || !P._w) return;
      const k = 1 - Math.max(0, Math.min(1, s.L));        // 1 at the Source, 0 wide
      const uA = P._w.matA.uniforms, uB = P._w.matB.uniforms;
      uA.uK1.value.w = 0.355 - 0.345 * k;  uA.uK2.value.w = 0.730 - 0.450 * k;
      uB.uK1.value.w = 0.455 - 0.345 * k;  uB.uK2.value.w = 0.852 - 0.450 * k;
    }
  }));
})();
