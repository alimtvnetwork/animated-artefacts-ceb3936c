# 46 — Bundle perf: vendor splits + lazy KaTeX CSS

**Date:** 2026-05-01
**Window:** 2 (task 8/40)

## Task context
User asked for a perf pass. Main bundle was 2,277 KB (gzip 600 KB) — every visitor paid the parse cost of recharts, framer-motion, all radix primitives, lucide-react, react-hook-form, zod up front, even on a TitleSlide-only first-paint deck. KaTeX CSS (~80 KB) was eager-loaded in `main.tsx` for every deck regardless of whether any EquationSlide existed.

## Specific question
None — purely additive vite config + a one-line CSS-import relocation.

## Inferred decisions
1. **Vendor manualChunks** in `vite.config.ts`. One chunk per heavy lib family: `vendor-react`, `vendor-framer`, `vendor-charts` (recharts+d3), `vendor-radix`, `vendor-lucide`, `vendor-embla`, `vendor-qrcode`, `vendor-tanstack`, `vendor-forms`, `vendor-router`, `vendor-zod`.
2. **`chunkSizeWarningLimit: 800`** — main app chunk legitimately needs 1MB-ish for the 23 slide types + builder + presenter + handout pages. The lib `cpp-*` / `wasm-*` warnings come from shiki's lazy grammar loaders and are already off the hot path.
3. **KaTeX CSS lazy-load** moved out of `main.tsx`; `EquationSlide` calls a one-shot promise-cached `import('katex/dist/katex.min.css')` from `useEffect`. Decks without equations never pay the 29KB.
4. **Mermaid, shiki, pptxgenjs** already dynamic-imported — no change needed; Rollup chunks them naturally.

## Results

| Asset                | Before    | After     | Δ        |
|----------------------|-----------|-----------|----------|
| Main JS              | 2,277 KB  | 1,080 KB  | **-53%** |
| Main JS gzip         | 600 KB    | 321 KB    | **-46%** |
| Main CSS             | 171 KB    | 142 KB    | -17%     |
| KaTeX CSS            | (in main) | 29 KB lazy| **deferred** |

Vendor chunks now cache independently — authoring changes (slide JSON, component tweaks) only bust the main app chunk; library code stays cached across deploys.

## Suggested clarification
None. If the user wants the main chunk further trimmed, the next move is route-level lazy `React.lazy()` on `BuilderPage`, `HandoutPage`, `MotionDemoPage`, `StyleGuidePage`, `ThemePreviewPage` — they're not on the deck-presentation hot path.

## Timestamp
2026-05-01
