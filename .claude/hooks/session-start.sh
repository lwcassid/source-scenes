#!/bin/bash
# SessionStart — make the SIGHTED-ITERATION HARNESS work out of the box.
#
# This repo has no package.json on purpose (it is gitignored: the site is one
# hand-assembled html file, not an npm project). But tools/shot*.mjs and
# tools/playtest.js `import ... from 'playwright-core'`, and Node will not look
# in the global module root — so in a fresh cloud session those harnesses die
# with ERR_MODULE_NOT_FOUND, and the session quietly falls back to shipping
# things it has not looked at. That is the failure this hook exists to stop.
#
# Idempotent, non-interactive, and a no-op on a machine that has its own
# playwright (Lance's laptop) or none at all — never fail the session over it.
set -euo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT"

# 1. playwright-core resolvable from the repo
if node -e "import('playwright-core').then(()=>process.exit(0),()=>process.exit(1))" 2>/dev/null; then
  echo "harness: playwright-core already resolves"
else
  GLOBAL_PW=""
  for cand in "$(npm root -g 2>/dev/null)/playwright/node_modules/playwright-core" \
              "$(npm root -g 2>/dev/null)/playwright-core"; do
    [ -d "$cand" ] && GLOBAL_PW="$cand" && break
  done
  if [ -n "$GLOBAL_PW" ]; then
    mkdir -p node_modules
    ln -sfn "$GLOBAL_PW" node_modules/playwright-core
    [ -d "$(npm root -g)/playwright" ] && ln -sfn "$(npm root -g)/playwright" node_modules/playwright
    echo "harness: linked playwright-core from $GLOBAL_PW"
  else
    echo "harness: no global playwright found — run 'npm i playwright-core' to shoot screenshots" >&2
  fi
fi

# 2. pin the browser the harnesses launch (they read $CHROMIUM, with a
#    hardcoded fallback that goes stale every time the image bumps the build)
CHROME=""
for c in /opt/pw-browsers/chromium-*/chrome-linux/chrome /opt/pw-browsers/chromium/chrome-linux/chrome; do
  [ -x "$c" ] && CHROME="$c"
done
if [ -n "$CHROME" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export CHROMIUM=\"$CHROME\"" >> "$CLAUDE_ENV_FILE"
  echo "harness: CHROMIUM=$CHROME"
fi

mkdir -p scratchshots
exit 0
