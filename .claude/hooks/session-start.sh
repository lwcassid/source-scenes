#!/bin/bash
# SessionStart — make the SIGHTED-ITERATION HARNESS work, PROVE it works, and
# say so where a session cannot miss it (this stdout lands in the session's
# context before any work starts).
#
# The bug this exists to prevent is not "no browser". It is SILENCE: tools/
# shot*.mjs import 'playwright-core', this repo has no node_modules on purpose,
# Node does not search the global module root — so the harness died with
# ERR_MODULE_NOT_FOUND and sessions quietly shipped things they never looked
# at. A capability that fails quietly is worse than one that is absent.
#
# Idempotent, non-interactive, never fails the session.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$ROOT" || exit 0

# ---- 1. playwright-core resolvable from the repo -------------------------
if ! node -e "import('playwright-core').then(()=>process.exit(0),()=>process.exit(1))" 2>/dev/null; then
  GLOBAL_PW=""
  for cand in "$(npm root -g 2>/dev/null)/playwright/node_modules/playwright-core" \
              "$(npm root -g 2>/dev/null)/playwright-core"; do
    [ -d "$cand" ] && GLOBAL_PW="$cand" && break
  done
  if [ -n "$GLOBAL_PW" ]; then
    mkdir -p node_modules
    ln -sfn "$GLOBAL_PW" node_modules/playwright-core
    [ -d "$(npm root -g)/playwright" ] && ln -sfn "$(npm root -g)/playwright" node_modules/playwright
  fi
fi

# ---- 2. pin the browser (glob it; the pinned build bumps every image) ----
CHROME=""
for c in /opt/pw-browsers/chromium-*/chrome-linux/chrome /opt/pw-browsers/chromium/chrome-linux/chrome; do
  [ -x "$c" ] && CHROME="$c"
done
[ -n "$CHROME" ] && [ -n "${CLAUDE_ENV_FILE:-}" ] && echo "export CHROMIUM=\"$CHROME\"" >> "$CLAUDE_ENV_FILE"
export CHROMIUM="$CHROME"

# ---- 3. arm the pre-push guard (.githooks is committed; .git/hooks is not) -
git config core.hooksPath .githooks 2>/dev/null || true

# ---- 4. PROVE it: actually launch the browser and take a picture. Cached per
#        chromium build, so this costs ~2s once per container, not per session.
mkdir -p scratchshots .claude/.cache
STAMP=".claude/.cache/harness-ok"
if [ "$(cat "$STAMP" 2>/dev/null || echo none)" != "$CHROME" ]; then
  if node -e "
    import('playwright-core').then(async ({chromium}) => {
      const b = await chromium.launch({ executablePath: process.env.CHROMIUM, headless: true,
        args: ['--enable-unsafe-swiftshader','--use-gl=swiftshader','--no-sandbox'] });
      const p = await b.newPage({ viewport: { width: 64, height: 64 } });
      await p.setContent('<canvas id=c width=64 height=64></canvas><script>const g=document.getElementById(\"c\").getContext(\"webgl\");if(!g)throw new Error(\"no webgl\")</script>');
      await p.screenshot({ path: 'scratchshots/.harness-selftest.png' });
      await b.close();
    }).then(()=>process.exit(0), e => { console.error(String(e.message||e)); process.exit(1); });
  " 2>/dev/null; then
    echo "$CHROME" > "$STAMP"
    HARNESS="ready — chromium launches, WebGL present, screenshots write"
  else
    HARNESS="BROKEN — cannot launch a browser. Screenshots WILL fail. Fix this BEFORE shipping anything visual; do not fall back to guessing."
  fi
else
  HARNESS="ready (self-test cached)"
fi

cat <<BANNER
harness: $HARNESS
VERIFY BEFORE YOU PUSH — you can see this project, so look at it:
  bash tools/verify.sh          build + preview + wall/drawer shots + QA sweep
  bash tools/verify.sh --quick  shell-only changes (~20s)
  then READ the pngs in scratchshots/ — the tools cannot see for you.
A push that changes index.html is BLOCKED unless verify.sh rendered that exact
build. Do not curl the live site to check a deploy: the network policy 403s
that host, which looks identical to "not deployed". Use the Netlify MCP.
BANNER
exit 0
