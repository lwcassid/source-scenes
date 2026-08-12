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
