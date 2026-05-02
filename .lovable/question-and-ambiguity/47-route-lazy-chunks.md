# 47 — Route-level lazy chunks (perf round 2)

**Date:** 2026-05-01
**Window:** 2 (task 9/40)

## Task context
Compounding the prior bundle pass. After vendor splits the main chunk was 1,080 KB; the entire Builder, StyleGuide, MotionDemo, Settings, Handout, ThemePreview, ImagePlacement, PreviewDiagnostics, ClickRevealAudit, ReleaseChecklist, ReleaseIndex, Presenter pages were still fused into it even though a presenter on `/3` never opens any of them.

## Inferred decisions
1. **Hot-path stays eager.** `SlideDeckPage` (canonical `/N`) and `NotFound` keep `import` statements — first paint must not wait on a chunk fetch. `RootSlideQueryRedirect` and `SlideAliasRedirect` stay eager too (they're tiny and always run before a `Navigate`).
2. **All 12 off-hot-path pages → `React.lazy()`.** Each becomes its own chunk; Suspense fallback is a token-themed transparent shell (no spinner — chunk-fetch is sub-second on LAN and a spinner would flash longer than the gap).
3. **`Suspense` boundary** wraps `<Routes>` only; the global overlays (BrandStripAudit, ContractIssues, RuntimeImageQA, BlankScreenFallback, etc.) stay outside so they keep rendering during chunk fetches.

## Results

| Chunk            | Before perf pass | After vendor splits | After lazy routes |
|------------------|------------------|---------------------|-------------------|
| Main JS          | 2,277 KB         | 1,080 KB            | **865 KB**        |
| Main JS gzip     | 600 KB           | 321 KB              | **265 KB**        |

**Cumulative: -62% raw, -56% gzip on the initial download.**

Per-page lazy chunks (raw, brotli-able further on serve):
- BuilderPage 72 KB
- SettingsPage 45 KB
- StyleGuidePage 19 KB
- ClickRevealAuditPage 18 KB
- PreviewDiagnosticsPage 12 KB
- ImagePlacementPage 7 KB
- ReleaseChecklistPage 7 KB
- PresenterPage 6 KB
- ThemePreviewPage 6 KB
- HandoutPage 5 KB
- MotionDemoPage 4 KB
- ReleaseIndexPage 3 KB

## Suggested clarification
None. If user wants the next leg, lucide-react (688KB raw) is the biggest remaining vendor chunk — its barrel-import shape is what blows it up. Switching to `lucide-react/icons/<Name>` per-icon imports could save ~500KB. That's invasive (touches every component using icons) and best done as a dedicated pass.

## Timestamp
2026-05-01
