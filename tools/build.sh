#!/bin/bash
# Assemble the SOURCE Interaction Library from its parts.
# Run from the REPO ROOT: bash tools/build.sh
# Output: index.html (the deployed site). Commit + push and Netlify auto-deploys.
# PART ORDER MATTERS — new scene versions insert before part15_history.js.
set -e
cd "$(dirname "$0")/.."
{
  cat parts/part1_head.html
  cat parts/part2_core.js
  cat parts/part2b_music.js
  cat parts/part2c_midiout.js
  cat parts/part3_pieces_a.js
  cat parts/part4_pieces_b.js
  cat parts/part6_pieces_c.js
  cat parts/part7_pieces_d.js
  cat parts/part8_pieces_e.js
  cat parts/part9_pieces_f.js
  cat parts/part10_pieces_g.js
  cat parts/part11_pieces_h.js
  cat parts/part12_pieces_i.js
  cat parts/part13_pieces_j.js
  cat parts/part14_pieces_v2.js
  cat parts/part16_v7.js
  cat parts/part17_v8.js
  cat parts/part18_v9.js
  cat parts/part19_v10.js
  cat parts/part20_v11.js
  cat parts/part21_v12.js
  cat parts/part22_v13.js
  cat parts/part23_v14.js
  cat parts/part24_v15.js
  cat parts/part25_fb3.js
  cat parts/part26_fb4.js
  cat parts/part27_fb5.js
  cat parts/part28_fb6.js
  cat parts/part29_fb7.js
  cat parts/part30_fb8.js
  cat parts/part31_fb9.js
  cat parts/part32_fb10.js
  cat parts/part33_fb11.js
  cat parts/part34_fb12.js
  cat parts/part35_sg3.js
  cat parts/part36_sg4.js
  cat parts/part37_sg5.js
  cat parts/part38_sg6.js
  cat parts/part39_ws3.js
  cat parts/part40_ws4.js
  cat parts/part49_ws12.js
  cat parts/part51_ws13.js
  cat parts/part52_ws14.js
  cat parts/part40_v16.js
  cat parts/part41_v17.js
  cat parts/part50_sg7.js
  cat parts/part53_av2.js
  cat parts/part54_sonora3.js
  cat parts/part55_sonora4.js
  cat parts/part56_foam.js
  cat parts/part57_iris.js
  cat parts/part58_lumen.js
  cat parts/part59_starling.js
  cat parts/part60_vortex.js
  cat parts/part61_pour.js
  cat parts/part62_ridge.js
  cat parts/part63_foam2.js
  cat parts/part64_iris2.js
  cat parts/part65_ridge2.js
  cat parts/part15_history.js
  cat parts/part5_tail.js
  printf '</script>\n</body>\n</html>\n'
} > index.html
# syntax check the assembled script
python3 - <<'EOF'
import re
src = open('index.html').read()
open('/tmp/check.js','w').write(max(re.findall(r'<script>(.*?)</script>', src, re.S), key=len))
EOF
node --check /tmp/check.js && echo "BUILD OK: index.html"
