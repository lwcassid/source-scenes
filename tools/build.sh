#!/bin/bash
# Assemble the SOURCE Interaction Library from its parts.
# Run from the REPO ROOT: bash tools/build.sh
# Output: index.html (the deployed site). Commit + push and Netlify auto-deploys.
# PART ORDER MATTERS — new scene versions insert before part15_history.js.
set -e
cd "$(dirname "$0")/.."
{
  cat parts/part1_head.html
  # SHARED SET LISTS — setlists.json is the coordination file (see its _readme).
  # Baking it in is what carries the running order onto the OFFLINE show
  # artifact; a fetch would die the moment the laptop leaves the internet.
  printf 'const SETLISTS = '
  cat setlists.json
  printf ';\n'
  cat parts/part2_core.js
  cat parts/part2b_music.js
  cat parts/part2c_midiout.js
  cat parts/part2d_scrimview.js
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
  cat parts/part35_fb13.js
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
  cat parts/part66_foam3.js
  cat parts/part67_iris3.js
  cat parts/part68_ridge3.js
  cat parts/part69_iris4.js
  cat parts/part70_pour2.js
  cat parts/part71_iris5.js
  cat parts/part72_pour3.js
  cat parts/part73_pour4.js
  cat parts/part74_pour5.js
  cat parts/part75_pour6.js
  cat parts/part76_pour7.js
  cat parts/part77_pour8.js
  cat parts/part77_front.js
  cat parts/part78_front2.js
  cat parts/part79_front3.js
  cat parts/part79_whitestudy2.js
  cat parts/part80_ws15.js
  cat parts/part81_lumen2.js
  cat parts/part82_lumen3.js
  cat parts/part83_lumen4.js
  cat parts/part84_lumen5.js
  cat parts/part85_lumen6.js
  cat parts/part86_lumen7.js
  cat parts/part87_lumen8.js
  cat parts/part88_lumen9.js
  cat parts/part89_lumen10.js
  cat parts/part90_lumen11.js
  cat parts/part91_lumen12.js
  cat parts/part92_lumen13.js
  cat parts/part93_lumen14.js
  cat parts/part94_lumen15.js
  cat parts/part95_lumen16.js
  cat parts/part96_lumen17.js
  cat parts/part104_lumen18.js
  cat parts/part95_fb14.js
  cat parts/part96_fb15.js
  cat parts/part97_fb16.js
  cat parts/part98_fb17.js
  cat parts/part99_fb18.js
  cat parts/part100_ridge4.js
  cat parts/part101_ridge5.js
  cat parts/part102_ridge6.js
  cat parts/part103_ridge7.js
  cat parts/part104_ridge8.js
  cat parts/part105_ridge9.js
  cat parts/part106_ridge10.js
  cat parts/part100_chladni3.js
  cat parts/part101_chladni4.js
  cat parts/part15_history.js
  cat parts/part5_tail.js
  printf '</script>\n</body>\n</html>\n'
} > index.html
# setlists.json is hand-edited (and Claude-edited) — fail loudly, not at runtime
python3 -c "import json,sys; json.load(open('setlists.json'))" || { echo "BUILD FAILED: setlists.json is not valid JSON"; exit 1; }
# syntax check the assembled script
python3 - <<'EOF'
import re
src = open('index.html').read()
open('/tmp/check.js','w').write(max(re.findall(r'<script>(.*?)</script>', src, re.S), key=len))
EOF
node --check /tmp/check.js && echo "BUILD OK: index.html"
