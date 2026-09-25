/* ---------- THE FAVICON — a pure laser green circle ----------
   Edson, Sep 25: "Also add a favicon. Can be just a green circle. Pure laser
   green."

   WHY IT IS HERE AND NOT IN THE HEAD. A favicon is one `<link rel="icon">` in
   `parts/part1_head.html` — which is a core file and not ours to edit. So it
   is injected at runtime instead: same result, nothing of theirs touched.

   That makes it a TOOL-level change, not a scene, so it is declared in the
   register the same as everything else. It is the smallest possible example
   of the rule and a fair test of it: it changes what every tab shows, for
   everyone, forever, and it took one line.

   AN SVG DATA URI, not a .png. No new file to serve, no binary in the repo,
   and it stays crisp at every size a browser asks for. The circle is drawn at
   r=13 in a 32-box so it does not touch the edges — a favicon that bleeds to
   its own border reads as a square at 16px.

   THE GREEN is #00FF41: full green, a little blue, no red. Flat #00FF00 is
   the same hue a browser paints on an error chip and reads as "system", while
   the laser green Edson means is the one a 520nm pointer makes on a wall,
   which carries a trace of cyan. One constant if it ever needs to change. */
(() => {
  const GREEN = '#00FF41';
  try {
    if (typeof document === 'undefined' || !document.head) return;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
              + '<circle cx="16" cy="16" r="13" fill="' + GREEN + '"/></svg>';
    const href = 'data:image/svg+xml,' + encodeURIComponent(svg);

    // replace any icon the page already declares, rather than adding a second
    // one and letting the browser choose between them
    document.querySelectorAll('link[rel~="icon"]').forEach(l => l.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = href;
    document.head.appendChild(link);
  } catch (e) { /* a missing favicon must never take the app down */ }
})();
