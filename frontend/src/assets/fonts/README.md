# Relay's fonts

Relay serves its three typefaces itself, from this folder. Vite gives each file a hashed name under `/assets/`, cached for a year, and `index.html` preloads the two that every first screen uses: Inter and Archivo, Latin. Before 22 Nov 2026 they came from Google Fonts; nothing about the page's look changed with the move.

| Family | Files | Google Fonts version | Used for | Declared range |
| --- | --- | --- | --- | --- |
| Archivo | `archivo/archivo-latin-wdth-normal.woff2`, `archivo/archivo-latin-ext-wdth-normal.woff2` | v25 | Headings and figures | weight 500-800, width 100-125% |
| Inter | `inter/inter-latin-wght-normal.woff2`, `inter/inter-latin-ext-wght-normal.woff2` | v20 | Body and UI text | weight 400-600 |
| Geist Mono | `geist-mono/geist-mono-latin-wght-normal.woff2`, `geist-mono/geist-mono-latin-ext-wght-normal.woff2` | v6 | Times and hours | weight 400-500 |

## Where they come from

The npm packages `@fontsource-variable/inter`, `@fontsource-variable/archivo` and `@fontsource-variable/geist-mono`, version 5.3.0, which repackage Google Fonts' own files - the same versions, and within a few bytes the same sizes, the site downloaded from Google before. The files are copied as they are; nothing is installed. Only the normal style is kept (nothing in Relay is italic), in the two subsets Google Fonts serves to Latin-script pages: Latin, and Latin Extended, which a browser downloads only when a page uses one of its characters. Other scripts fall back to the system font.

## Licence

All three are under the **SIL Open Font License 1.1**, which allows using, embedding and redistributing them - serving them from a website included - as long as the licence travels with them. Each folder keeps its `OFL.txt`, the licence and copyright notice from the package. None of the three declares a Reserved Font Name.

- Archivo: Copyright 2020 The Archivo Project Authors (https://github.com/Omnibus-Type/Archivo)
- Inter: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)
- Geist Mono: Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font)

## The stand-ins (`fallbacks.css`)

Until a font arrives, text shows in a local font resized to take the same room, so nothing moves on the swap. Measured on 22 Nov 2026 in Chromium (Microsoft Edge, through Playwright), with these files loaded and the stand-ins from Windows:

- **Width:** each font's width over a paragraph of Relay's own text (the landing page's opening, the sign-in page's lines), divided by the stand-in's width over the same text. That ratio is `size-adjust`.
- **Height:** each font's ascent and descent as Chromium reports them (`TextMetrics.fontBoundingBoxAscent` and `Descent`, at 1000px), and its line gap from the height of a `line-height: normal` box. Each, divided by `size-adjust`, is the override.

| Font | Ascent | Descent | Line gap |
| --- | --- | --- | --- |
| Archivo | 0.878 | 0.210 | 0 |
| Inter | 0.969 | 0.241 | 0 |
| Geist Mono | 1.005 | 0.295 | 0 |
| Arial, Arial Bold | 0.905 | 0.212 | 0.033 |
| Courier New | 0.833 | 0.300 | 0 |

| Stand-in | Stands in for | size-adjust |
| --- | --- | --- |
| Arial | Inter 400-500 | 106.73% |
| Arial Bold | Inter 600 | 100.81% |
| Arial Bold | Archivo at 100% width (650-700) | 96.86% |
| Arial Bold | Archivo at 106% (700-750) | 105.14% |
| Arial Bold | Archivo at 112-112.5% (750) | 112.74% |
| Arial Bold | Archivo at 115% (800) | 117.82% |
| Courier New | Geist Mono | 99.98% |

Checked the same way: across ten blocks set as Relay sets them - body text, labels, buttons, each heading size and width, times - the adjusted stand-in's line is 99.1-100.7% as wide as the real font's, and every block wraps to the same number of lines. The system font the site fell back to before was 85-105% as wide, and three of the ten blocks wrapped differently.

To change a font: replace its files, keep its `OFL.txt` current, update the ranges in `fonts.css`, measure again as above and update `fallbacks.css`, and keep the preloads in `index.html` pointing at the Latin files.
