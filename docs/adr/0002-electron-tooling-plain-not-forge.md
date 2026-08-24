# Plain package.json for electron/, not electron-forge

Status: accepted

`electron/` is a hand-rolled `package.json` (`electron` as a `devDependency`,
`npm start` running `electron .`) rather than an electron-forge scaffold, and
ships with no packaging step at all — the show laptop runs `npm install &&
npm start` directly from a checkout. Forge's bundler-template options
(webpack/vite) don't apply here regardless of which way this went, since the
show and control windows just load this repo's own existing static
`index.html` build via `loadFile()` — nothing new gets bundled. What forge
would have bought was scaffolding and a packaging CLI (`forge package`/`forge
make`) to produce a double-clickable `.app`. Given the packaging bar from
ADR-0001 is explicitly "unsigned/unpacked, known machine(s) only," that
bar is already met by `npm start` on a laptop Nima set up himself — no
packaging tool is needed to reach it. Plain also keeps `electron/` in the
same style as the rest of this repo (`tools/build.sh` is bash + `cat`, no
bundler anywhere), rather than importing a new tooling paradigm for one
directory.

Security posture, decided alongside this: `contextIsolation: true`,
`nodeIntegration: false`, `sandbox: true`, with a `preload.js` exposing a
minimal explicit API via `contextBridge` once ticket #29 designs it. This is
simply Electron's current recommended default — nothing in the app today
needs raw `require()` in a renderer, so there was no real pull toward the
older, insecure alternative.

## Considered options

- **electron-forge**: rejected for now — real packaging convenience, but
  extra tooling weight this repo doesn't otherwise carry, for a packaging
  bar that plain `npm start` already clears.
- **Plain + `@electron/packager`**: not built now, but the documented
  fallback if a double-clickable `.app` turns out to matter once the real
  show laptop is set up — `@electron/packager` is forge's own packaging
  engine without forge's scaffolding/CLI opinions, so adopting it later
  doesn't require unwinding the plain `package.json` chosen here.

## Consequences

- Verified end-to-end on this machine: `npm install` in `electron/`, then
  launching `Electron.app` directly, produces a live main process, a
  sandboxed renderer (confirmed via `--enable-sandbox` on the renderer
  process), a GPU process, and a network utility process, scoped to its own
  `source-show-runner` user-data directory — no crash, no error.
- One real environment gotcha hit while verifying this, worth a note for
  whoever runs `npm install` next: the `extract-zip` step of Electron's own
  postinstall silently produced a near-empty `dist/` (just the license file)
  in this sandboxed dev environment, even though the downloaded zip was
  intact (`unzip -l` read all 255 entries fine). Fix was extracting the
  already-downloaded zip from `~/Library/Caches/electron/` with the system
  `unzip` directly. Likely specific to this sandbox, not a real Electron bug
  — if it recurs on the actual show laptop, that's the fix.
