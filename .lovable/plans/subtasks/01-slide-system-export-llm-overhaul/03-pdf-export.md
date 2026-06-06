---
Slug: pdf-export
Status: done (impl 2026-06-06 v1.15.0 — single-slide PDF via ?slide=N)
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# PDF export

## Options considered
1. **Print route** (`?print` / `/slides/print`) renders all slides stacked, then `window.print()` with `@page { size: 1920px 1080px landscape; margin:0 }` and `break-after: page`. Pros: pixel-faithful, zero deps, matches on-screen design. Cons: relies on browser print dialog.
2. **jsPDF + html-to-image** per slide → addImage per page. Pros: one-click download, no dialog. Cons: heavier deps, font/gradient fidelity risk.

## Recommendation
Default to the **print route** for full-deck PDF (faithful, dependency-free). Offer single-slide via a `?print&slide=N` variant. Re-evaluate jsPDF only if a silent one-click download is mandatory.

## Tasks for build turn
- Add/confirm print route rendering all active slides at 1920x1080.
- Wire "Export deck to PDF" → open print route → print.
- Wire "Export current slide to PDF" → print route scoped to current slide.
- Visual QA: render to PDF, inspect each page for clipping/overflow.
