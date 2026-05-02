# 05 — /settings export menu (PDF/CMYK/SVG/PNG/JPG)

- Task: "Implement a full /settings export menu so I can export the entire deck as PDF (and choose formats like CMYK PDF, RGB SVG, PNG, and JPG)."
- Spec refs: `src/slides/export.ts`, `src/pages/SettingsPage.tsx`, `src/pages/HandoutPage.tsx`, `src/index.css` (CMYK filter block).

## Ambiguities resolved by inference

### A. True CMYK conversion
- **Unclear**: Browsers cannot emit a real ICC CMYK PDF. Did the user want (a) a placeholder CMYK option, (b) a server-side conversion path, or (c) a CSS approximation?
- **Options**:
  1. **CSS-filter approximation** — chosen. Applies `saturate(0.86) contrast(1.04) hue-rotate(-2deg)` on `.handout-stage` when `?cmyk=1`. Pre-desaturates the gold/cream/ember palette into the offset-CMYK gamut so press conversion doesn't shift colours hard. Pros: zero deps, immediate, visible in print preview. Cons: not a real ICC profile — exact colours still depend on the press's RIP.
  2. **Server-side Ghostscript** — out of scope (no backend). Would require an edge function + Ghostscript binary.
  3. **External library** (e.g., `pdfkit` + `convertColors`) — adds 400+ KB and only handles synthetic PDFs, not browser-rendered HTML.
- **Recommendation**: ship (1) with an explicit banner on the handout page + a note in the Settings UI directing the user to Acrobat Pro's **Convert Colors** action for a true ICC CMYK pass.
- **Reversible?** Yes — drop the `data-export-cmyk` block in `index.css` and the `?cmyk=1` plumbing in HandoutPage / export.ts.

### B. SVG / PNG / JPG output cardinality
- **Unclear**: One combined file per format, or one file per slide?
- **Decision**: **one file per slide** for SVG/PNG/JPG. Rationale:
  - SVG: a single SVG with all slides stacked would be huge and most editors (Figma/Illustrator) prefer per-artboard files.
  - PNG/JPG: per-slide is what every existing slide tool (Keynote, PowerPoint, Pitch) does on export.
  - PDF stays a single file because that's the format's native unit.
- The export module does sequential `downloadBlob()` calls with a 250–300ms stagger so browsers don't block the second+ as a popup.

### C. Render source (live deck vs. hidden iframe)
- **Unclear**: Where does the export pull DOM from? The live deck only renders one slide at a time.
- **Decision**: open `/handout` in an off-screen iframe (`position: fixed; left: -99999px`) at 1920×1080, await `fonts.ready` and a settle frame, then snapshot every `.handout-stage` innerHTML. Removes the iframe afterwards. Reuses the existing handout route's animation-killer + chrome-stripper rules.

### D. CSS preservation in SVG `<foreignObject>`
- The exporter walks `document.styleSheets`, dumps every accessible `cssRules.cssText`, and prepends a `:root { --gold: …; … }` block from `getComputedStyle(documentElement)` so colour tokens resolve inside the foreignObject sandbox. Cross-origin sheets (Google Fonts) are skipped — index.css already declares `@font-face` fallbacks for Ubuntu/Inter that cover the visible weights.

### E. Bundle weight
- Considered `html2canvas` (250 KB), `jsPDF` (350 KB), `html-to-image` (180 KB).
- **Chose**: pure browser primitives (`XMLSerializer`, `<foreignObject>`, `canvas.toBlob`, `window.print()`). Total cost of `src/slides/export.ts`: ~6 KB minified. No new deps in package.json.

## Action taken (v0.123)

- Created `src/slides/export.ts` with the `EXPORT_FORMATS` registry + `runExport(format)` dispatcher.
- Wired five buttons into `SettingsPage` (PDF RGB, PDF CMYK-safe, SVG, PNG, JPG) with per-format busy state, icons, file-count chips, and a CMYK explainer footnote.
- Extended `HandoutPage` to honour `?cmyk=1` (sets `data-export-cmyk="true"`, shows a sticky banner explaining the gamut approximation).
- Added a CMYK CSS filter block in `index.css` (saturate 0.86 / contrast 1.04 / hue-rotate -2°). Active on screen and in print preview.
- Bumped to **v0.123.0**. All 31 tests pass; `tsc` clean.

## Reversibility

Each layer is independent:
- Drop the new buttons → revert SettingsPage edit; export module stays available for future re-use.
- Drop the CMYK option → remove the EXPORT_FORMATS entry + the `data-export-cmyk` CSS block.
- Drop SVG/PNG/JPG → remove the relevant branches in `runExport`; the exporter remains a thin wrapper around `/handout?print=1`.

## Deferred follow-ups

- Server-side Ghostscript pipeline for a true ICC CMYK PDF (would belong in an edge function once Lovable Cloud is enabled for this project).
- Per-slide format override (e.g., "export slide 3 only as PNG"). Currently every export runs over `linearSlides`. The dispatcher could grow a `slides?: number[]` filter without API churn.
- ZIP bundle for SVG/PNG/JPG so the user gets one file instead of N. Would need `jszip` (~95 KB) — defer until the user asks.
