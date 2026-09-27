# The eleven voices (the LANGUAGE pass) — 1 real, 10 PLACEHOLDERS

**Every poem plays twice, back to back (Edson, 2026-09-27): its language from this bank, then immediately its English from `../poems-en/`. One GO per cue, 23 cues.**

**✅ Real so far (2026-09-27):** `ow1.mp3` Tetsuro Hoshi, 日本語. (Amanda Perry's English OW5 is in the English bank.) Raw originals + transcripts: `artworks/first-witness-series/recordings/`.

**The other ten were generated 2026-09-24 with macOS `say`, one voice and one language per poem, so the
timing, the two-language layout and eleven different scripts could be tested before
the real recordings land.**

🔴 **THE TEN PLACEHOLDERS ARE NOT THE ARTWORK. Replace every one of them.**

On the night each poem is a friend reading in their mother tongue. Drop the real file
over the placeholder, keep the filename, and nothing else has to change — the tool
reads `ow1.mp3` … `ow11.mp3` from this folder and re-measures the duration on load.

| file | placeholder voice | language | ⚠️ |
|---|---|---|---|
| ow1.mp3 | ✅ **REAL — Tetsuro Hoshi** | 日本語 | dropped in 2026-09-27, from `#1 japanese.mp4` |
| ow2.mp3 | Thomas | Français | machine translation |
| ow3.mp3 | Majed | العربية | machine translation · RTL |
| ow4.mp3 | Kyoko | 日本語 | machine translation |
| ow5.mp3 | Lekha | हिन्दी | 🔴 **canonically YORUBA** (Oxum) — no Yoruba system voice exists, so the placeholder is Hindi. Still needs a non-English reader. (Amanda Perry's English reading, 2026-09-27, is the English pass: `../poems-en/ow5.mp3`.) |
| ow6.mp3 | Luciana | Português | canonical language ✅ (Edson's own tongue) |
| ow7.mp3 | Anna | Deutsch | machine translation |
| ow8.mp3 | Alice | Italiano | machine translation |
| ow9.mp3 | Tingting | 中文 | machine translation |
| ow10.mp3 | Milena | Русский | machine translation |
| ow11.mp3 | Paulina | Español | machine translation |

**The twelfth Witness is silent by design and has no file. That is correct.**

## There is a second set

`assets/poems-en/` holds the same eleven in **English**, eleven different voices across
six accents — and those read the **canonical** lines, untranslated. The cue list plays
them itself; `OWPOEM.setVoices('en')` / `?poems=en` only set the bank for a bare `play(idx)`. Both are in the build.

## Replacing them

1. Drop the real recording in, named `owN.mp3` (or `.wav` — change the entry in
   `parts/part241_owpoem.js` `FILES` if the extension differs; it must stay a
   **literal** string or it will not be inlined into the offline show build).
2. Update that poem's `spoken` and `spokenLang` in `parts/part241_owpoem.js`
   to the real text and language, and remove `draft: true`.
3. `bash tools/build.sh && python3 tools/build_preview.py`
4. `node tools/poemsync.mjs <n>` to confirm the type still tracks the voice.

## Format
Mono, 44.1 kHz, 96 kbps mp3, loudness-normalised to **−16 LUFS**.
**Normalise the real ones the same way** — eleven phones is eleven different levels,
and an un-normalised set means one poem whispers and the next one shouts.

```
ffmpeg -i IN -af loudnorm=I=-16:TP=-1.5:LRA=11 -ac 1 -ar 44100 -b:a 96k owN.mp3
```
