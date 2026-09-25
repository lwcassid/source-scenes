# The eleven voices — ENGLISH SET (placeholders)

**Generated 2026-09-24 with macOS `say`, eleven different English voices across six
accents (UK, US, Irish, Australian, South African, Indian).**

⚠️ **Placeholders — but the WORDS here are canonical.** Unlike the native-language set
next door, nothing is translated: these read the locked lines from
`artworks/first-witness-series/CURATORIAL.md` verbatim. Only the voices are synthetic.

*(OW6 is canonically Portuguese, so its English file reads the recorded gloss:
"Among the things that ground me to the earth, my son and this pain in my back".)*

| file | voice | accent |
|---|---|---|
| ow1 | Daniel | en_GB |
| ow2 | Samantha | en_US |
| ow3 | Moira | en_IE |
| ow4 | Karen | en_AU |
| ow5 | Tessa | en_ZA |
| ow6 | Rishi | en_IN |
| ow7 | Fred | en_US |
| ow8 | Tara | en_IN |
| ow9 | Aman | en_IN |
| ow10 | Ralph | en_US |
| ow11 | Karen | en_AU |

## Switching between the two sets
```
OWPOEM.setVoices('en')      // all English
OWPOEM.setVoices('native')  // eleven languages
```
or `?poems=en` in the URL. **Both sets are in the build**, so switching costs a reload
of eleven small buffers and nothing else — the type follows the voice automatically.

Same format as the other set: mono, 44.1 kHz, 96 kbps, **−16 LUFS**.
