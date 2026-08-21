#!/bin/bash
# THE ONE COMMAND. Build, render, look, sweep — then stamp the result so the
# pre-push hook can tell whether the index.html you are shipping is the one
# you actually looked at.
#
#   bash tools/verify.sh            build + preview + wall/drawer shots + QA sweep
#   bash tools/verify.sh --quick    skip the 10-scene sweep (shell-only changes)
#   bash tools/verify.sh --scene SRC-42.10   also shoot that scene, idle+full
#
# Exits non-zero if ANY step fails. The pngs land in scratchshots/ — this
# script cannot read them for you. READ THEM.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

QUICK=0; SCENE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --quick) QUICK=1 ;;
    --scene) shift; SCENE="${1:-}" ;;
    *) echo "unknown arg: $1"; exit 2 ;;
  esac; shift
done

fail() { echo ""; echo "VERIFY FAILED: $1"; exit 1; }
step() { echo ""; echo "── $1"; }

step "build"
bash tools/build.sh || fail "build.sh"

step "preview"
python3 tools/build_preview.py || fail "build_preview.py"

step "shell — fresh show laptop (wall + queue drawer)"
node tools/shotui.mjs verify --fresh || fail "shotui.mjs — the set list does not resolve, or the wall did not render"

if [ -n "$SCENE" ]; then
  step "scene $SCENE"
  node tools/shot.mjs "$SCENE" "verify_${SCENE//./_}" "idle:0:0:0:-1:2500,full:1:1:1:-1:3000" \
    || fail "shot.mjs for $SCENE"
fi

if [ "$QUICK" = "0" ]; then
  step "QA sweep (10 scenes, every rendering stack)"
  SCENE=QA node tools/playtest.js || fail "playtest.js"
fi

# stamp WHAT WE LOOKED AT, not when. Time-based staleness lies; a hash does not.
shasum -a 256 index.html 2>/dev/null | cut -d' ' -f1 > .verify-stamp \
  || sha256sum index.html | cut -d' ' -f1 > .verify-stamp

echo ""
echo "════════════════════════════════════════════════════════"
echo " VERIFY PASSED — now READ the screenshots:"
ls -1 scratchshots/verify_*.png 2>/dev/null | sed 's/^/   /'
echo "   Nothing below this line is verified until you have"
echo "   looked at those. The tools cannot see for you."
echo "════════════════════════════════════════════════════════"
