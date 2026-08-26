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
  # THE RIG DOC — rig.json baked read-only so the MIDI work surface can say
  # what actually sits on each channel in the Live set (still hand-edited).
  printf 'const RIGDOC = '
  cat rig.json
  printf ';\n'
  # SCENELOG — per-version change history mined from git (tools/scenelog.py):
  # each version is a part file, its birth commit carries the round's summary.
  printf 'const SCENELOG = '
  python3 tools/scenelog.py || printf '{"owners":{},"log":{}}'
  printf ';\n'
  cat parts/part2_core.js
  cat parts/part2b_music.js
  cat parts/part2c_midiout.js
  cat parts/part2d_scrimview.js
  cat parts/part2e_audioin.js
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
  cat parts/part107_ridge11.js
  cat parts/part100_chladni3.js
  cat parts/part101_chladni4.js
  cat parts/part103_chladni5.js
  cat parts/part104_chladni6.js
  cat parts/part105_chladni7.js
  cat parts/part106_chladni8.js
  cat parts/part107_chladni9.js
  cat parts/part108_chladni10.js
  cat parts/part109_whitestudy3.js
  cat parts/part110_whitestudy4.js
  cat parts/part111_whitestudy5.js
  cat parts/part112_whitestudy6.js
  cat parts/part114_whitestudy7.js
  cat parts/part130_whitestudy8.js
  cat parts/part112_av3.js
  cat parts/part113_av4.js
  cat parts/part109_cable2.js
  cat parts/part110_cable3.js
  cat parts/part111_cable4.js
  cat parts/part112_cable5.js
  cat parts/part113_cable6.js
  cat parts/part112_rain2.js
  cat parts/part113_rain3.js
  cat parts/part114_cable7.js
  cat parts/part112_rainatrium2.js
  cat parts/part113_rainatrium3.js
  cat parts/part114_rainatrium6.js
  cat parts/part115_av5.js
  cat parts/part115_cable8.js
  cat parts/part116_cable9.js
  cat parts/part117_av6.js
  cat parts/part118_chladni11.js
  cat parts/part119_chladni12.js
  cat parts/part120_chladni13.js
  cat parts/part121_chladni14.js
  cat parts/part122_chladni15.js
  cat parts/part123_chladni16.js
  cat parts/part124_chladni17.js
  cat parts/part125_chladni18.js
  cat parts/part126_chladni19.js
  cat parts/part127_chladni20.js
  cat parts/part128_chladni21.js
  cat parts/part129_chladni22.js
  cat parts/part121_av7.js
  cat parts/part122_av8.js
  cat parts/part117_cable10.js
  cat parts/part118_cable11.js
  cat parts/part119_cable12.js
  cat parts/part120_cable13.js
  cat parts/part121_cable14.js
  cat parts/part130_av9.js
  cat parts/part122_cable15.js
  cat parts/part131_av10.js
  cat parts/part132_av11.js
  cat parts/part109_iris6.js
  cat parts/part133_rainatrium7.js
  cat parts/part134_rainatrium8.js
  cat parts/part135_rainatrium9.js
  cat parts/part136_rainatrium10.js
  cat parts/part137_rainatrium11.js
  cat parts/part138_rainatrium12.js
  cat parts/part139_rainatrium13.js
  cat parts/part140_rainatrium14.js
  cat parts/part141_rainatrium15.js
  cat parts/part142_rainatrium16.js
  cat parts/part143_rainatrium17.js
  cat parts/part144_rainatrium18.js
  cat parts/part145_rainatrium19.js
  cat parts/part146_rainatrium20.js
  cat parts/part147_chladni23.js
  cat parts/part148_align.js
  cat parts/part148_chladni24.js
  cat parts/part149_chladni25.js
  cat parts/part150_chladni26.js
  cat parts/part151_chladni27.js
  cat parts/part152_chladni28.js
  cat parts/part153_lumen19.js
  cat parts/part154_fb19.js
  cat parts/part155_ridge12.js
  cat parts/part156_ws16.js
  cat parts/part157_av12.js
  cat parts/part158_whitestudy9.js
  cat parts/part159_eh16.js
  cat parts/part160_ridge13.js
  cat parts/part161_lumen20.js
  cat parts/part162_fb20.js
  cat parts/part163_ws17.js
  cat parts/part164_ws18.js
  cat parts/part165_chladni29.js
  cat parts/part166_ridge14.js
  cat parts/part167_eh17.js
  cat parts/part168_front4.js
  cat parts/part169_front5.js
  cat parts/part170_front6.js
  cat parts/part171_front7.js
  cat parts/part172_front8.js
  cat parts/part173_front9.js
  cat parts/part174_front10.js
  cat parts/part175_front11.js
  cat parts/part176_penrose.js
  cat parts/part177_penrose2.js
  cat parts/part178_penrose3.js
  cat parts/part179_penrose4.js
  cat parts/part15_history.js
  cat parts/part5_tail.js
  printf '</script>\n</body>\n</html>\n'
} > index.html
# setlists.json / rig.json are hand-edited (and Claude-edited) — fail loudly, not at runtime
python3 -c "import json,sys; json.load(open('setlists.json'))" || { echo "BUILD FAILED: setlists.json is not valid JSON"; exit 1; }
python3 -c "import json,sys; json.load(open('rig.json'))" || { echo "BUILD FAILED: rig.json is not valid JSON"; exit 1; }
# syntax check the assembled script
python3 - <<'EOF'
import re
src = open('index.html').read()
open('/tmp/check.js','w').write(max(re.findall(r'<script>(.*?)</script>', src, re.S), key=len))
EOF
node --check /tmp/check.js && echo "BUILD OK: index.html"
