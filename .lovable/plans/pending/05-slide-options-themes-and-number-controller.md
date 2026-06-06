# Media-rich slide options, ellipsis slide-number controller, and image-derived themes

**Slug:** slide-options-themes-and-number-controller
**Steps:** 100
**Status:** pending
**Created:** 2026-06-06

## Context
Add many new media-forward slide types (image / SVG / GIF), make the slide-number
controllers collapse to `1 … current±2 … N` when `total > threshold`
(configurable, default 15), add new color themes derived from user-supplied
reference images, and update the LLM guide so an AI can author rich decks from
JSON alone. Touches `spec/27-slides-number/**`, `src/slides/controls/`,
`src/slides/types/`, `front-end/slide-template/`, `front-end/themes/`,
`spec/llm-guideline/00-simplified-single-file-guide.md`, and `LLM.md`.

Captured command: `.lovable/spec/commands/06-slide-number-ellipsis-pagination.md`.
Subtasks: `./subtasks/05-slide-options-themes-and-number-controller/01-ellipsis-pagination.md`,
`./subtasks/05-slide-options-themes-and-number-controller/02-new-slide-types-catalog.md`,
`./subtasks/05-slide-options-themes-and-number-controller/03-image-derived-themes.md`.
Coding guidelines apply: `.lovable/coding-guidelines.md` (12 rules; no
`error-manage/` folder exists, so none to follow). No SEO guidelines present.

**Open question for user:** confirm collapse threshold default (proposed 15) and
neighbor count (proposed ±2); and supply the reference images for new themes.

## Steps
1. Re-scan `.lovable/`, `spec/21-slides-system/`, `spec/27-slides-number/`, and `src/slides/` to confirm current slide-type union, renderer switch, and number-surface components.
2. Record the configurable collapse threshold (default 15) + neighbor count (default ±2) decision in the controller command file; flag for user confirmation.
3. Write the `buildPageWindow(current, total, neighbors)` algorithm spec (always 1 + N, current±neighbors, ≥2 skipped → one `…`, single skip → number). See ./subtasks/05-slide-options-themes-and-number-controller/01-ellipsis-pagination.md.
4. Update `spec/27-slides-number/05-surface-dot-pagination.md` with the windowing math + configurable threshold.
5. Update `spec/27-slides-number/06-surface-controller-indicator.md` for the same collapse behavior.
6. Update `spec/27-slides-number/03-surface-top-bar.md` for the collapsed strip.
7. Update `spec/27-slides-number/13-acceptance-checklist.md` with ellipsis acceptance criteria.
8. Spec the new `PresetSettings` fields (`dotPaginationMaxBeforeCollapse`, `dotPaginationNeighbors`) in `spec/27-slides-number/10-visibility-and-settings.md`.
9. Spec the `…` gap-token interaction (jump-to-midpoint or open jump input).
10. Spec reduced-motion behavior for the collapsed strip (instant swap, no morph jitter across gaps).
11. Inventory every existing `SlideType` variant and note which media capabilities are missing.
12. Write JSON+MD spec for `FullBleedImageSlide`.
13. Write JSON+MD spec for `SplitMediaSlide`.
14. Write JSON+MD spec for `MediaGridSlide`.
15. Write JSON+MD spec for `GifLoopSlide` (incl. reduced-motion freeze frame).
16. Write JSON+MD spec for `SvgDiagramSlide`.
17. Write JSON+MD specs for `QuoteOverImageSlide`, `LogoWallSlide`, `BeforeAfterSlide`, `IconRowSlide`, `MediaTimelineSlide`. See ./subtasks/05-slide-options-themes-and-number-controller/02-new-slide-types-catalog.md.
18. Spec image/GIF authoring extensions (`freezeOnReducedMotion`, GIF as image src) in the image authoring contract.
19. Spec the image-derived theme pipeline + asset/reference folder layout. See ./subtasks/05-slide-options-themes-and-number-controller/03-image-derived-themes.md.
20. Spec the LLM.md / `00-simplified-single-file-guide.md` update plan + acceptance for all new types.
21. Implement pure helper `src/slides/controls/pageWindow.ts` (<80 lines, no `any`).
22. Add `src/slides/controls/pageWindow.test.ts` (total=16/50/100; current at 1/middle/last).
23. Add `dotPaginationMaxBeforeCollapse` + `dotPaginationNeighbors` to `src/slides/presetSettings.ts`.
24. Add the two settings controls to `src/pages/SettingsPage.tsx`.
25. Wire `DotPagination.tsx` to render via `buildPageWindow`, preserving active-pill `layoutId` morph + tooltip + `overflow-visible` rule.
26. Implement the `…` gap-token button (jump + `aria-label`) in `DotPagination.tsx`.
27. Apply the same windowing to the controller indicator surface.
28. Apply the same windowing to the top-bar number surface.
29. Add `FullBleedImageSlide` JSON+MD to `front-end/slide-template/`.
30. Build `FullBleedImageSlide` runtime component in `src/slides/types/` (<100 lines).
31. Register `FullBleedImageSlide` in the slide-type union + renderer switch + enum catalog.
32. Add a `FullBleedImageSlide` sample to the `image-examples` deck.
33. Add `FullBleedImageSlide` to LLM guide §3 inventory + §4 sample.
34. Add `SplitMediaSlide` JSON+MD template.
35. Build `SplitMediaSlide` component.
36. Register `SplitMediaSlide` in union/renderer/catalog.
37. Add `SplitMediaSlide` sample to `image-examples`.
38. Add `SplitMediaSlide` to LLM guide §3/§4.
39. Add `MediaGridSlide` JSON+MD template.
40. Build `MediaGridSlide` component.
41. Register `MediaGridSlide` in union/renderer/catalog.
42. Add `MediaGridSlide` sample to `image-examples`.
43. Add `MediaGridSlide` to LLM guide §3/§4.
44. Add `GifLoopSlide` JSON+MD template.
45. Build `GifLoopSlide` component (reduced-motion freeze).
46. Register `GifLoopSlide` in union/renderer/catalog.
47. Add `GifLoopSlide` sample to `image-examples`.
48. Add `GifLoopSlide` to LLM guide §3/§4.
49. Add `SvgDiagramSlide` JSON+MD template.
50. Build `SvgDiagramSlide` component.
51. Register `SvgDiagramSlide` in union/renderer/catalog.
52. Add `SvgDiagramSlide` sample to `image-examples`.
53. Add `SvgDiagramSlide` to LLM guide §3/§4.
54. Add `QuoteOverImageSlide` JSON+MD template.
55. Build `QuoteOverImageSlide` component.
56. Register `QuoteOverImageSlide` in union/renderer/catalog.
57. Add `QuoteOverImageSlide` sample to `image-examples`.
58. Add `QuoteOverImageSlide` to LLM guide §3/§4.
59. Add `LogoWallSlide` JSON+MD template.
60. Build `LogoWallSlide` component.
61. Register `LogoWallSlide` in union/renderer/catalog.
62. Add `LogoWallSlide` sample to `image-examples`.
63. Add `LogoWallSlide` to LLM guide §3/§4.
64. Add `BeforeAfterSlide` JSON+MD template.
65. Build `BeforeAfterSlide` component.
66. Register `BeforeAfterSlide` in union/renderer/catalog.
67. Add `BeforeAfterSlide` sample to `image-examples`.
68. Add `BeforeAfterSlide` to LLM guide §3/§4.
69. Add `IconRowSlide` JSON+MD template.
70. Build `IconRowSlide` component.
71. Register `IconRowSlide` in union/renderer/catalog.
72. Add `IconRowSlide` sample to `image-examples`.
73. Add `IconRowSlide` to LLM guide §3/§4.
74. Add `MediaTimelineSlide` JSON+MD template.
75. Build `MediaTimelineSlide` component.
76. Register `MediaTimelineSlide` in union/renderer/catalog.
77. Add `MediaTimelineSlide` sample to `image-examples`.
78. Add `MediaTimelineSlide` to LLM guide §3/§4.
79. Implement `freezeOnReducedMotion` flag in the shared image/media renderer.
80. Add GIF support (loop + freeze-on-reduced-motion) to the image loader.
81. Create `src/assets/theme-references/` (or per-theme reference folder) and ingest the user-supplied images (lovable-assets for large files).
82. Extract palette for theme 1 from its reference image.
83. Create theme 1 `front-end/themes/<name>/themes.json` + `colors.json` (HSL only, light/dark).
84. Extract palette for theme 2 from its reference image.
85. Create theme 2 `front-end/themes/<name>/themes.json` + `colors.json`.
86. Wire new themes into the theme switcher + per-deck persistence (`riseup.theme.byDeck.v1`).
87. Run `scripts/contrast-audit.ts` for each new theme and fix failures.
88. Document each new theme (source image + palette) in `spec/21-slides-system/` + add a memory entry.
89. Update `LLM.md` / `src/slides/llmGuideBundle.ts` to include all new slide types + §0 filesystem-write rule.
90. Complete `spec/llm-guideline/00-simplified-single-file-guide.md` §3 inventory (all types, including new ones).
91. Fill §4 per-type samples for every new type (real JSON from `image-examples`).
92. Add a media-type branch to `spec/llm-guideline/09-decision-tree.md`.
93. Add GIF/SVG image authoring recipes to the image authoring guideline.
94. Update `src/slides/llmGuideBundle.ts` + bump `package.json` version.
95. Run `bunx vitest run` (incl. `pageWindow.test.ts` + `llmGuidelineBundle.test.ts`) until green.
96. Run `scripts/check-catalog-drift.ts` + `scripts/contrast-audit.ts` and resolve drift.
97. QA a 50-slide deck in preview: first/last always shown, `…` collapses, current±2 visible, each new media type renders without overflow.
98. Update `readme.md` release notes + finalize `package.json` version bump.
99. Update `.lovable/memory/index.md` + relevant memory files (dot-pagination, slide-types, themes).
100. `mv` this plan to `.lovable/plans/completed/05-...` (flip `Status:` to `completed`) and save the next prompt snapshot.

## Verification
- Build green; `bunx vitest run` passes including `pageWindow.test.ts` and the LLM guideline bundle test.
- `scripts/contrast-audit.ts` + `scripts/check-catalog-drift.ts` clean.
- Preview QA: 50-slide deck shows `1 … cur±2 … N`, configurable threshold honored, `…` jumps work, every new media slide renders without overflow in `?deck=image-examples`.
- LLM guide §3 inventory + §4 samples cover all new types; `LLM.md` regenerates to slide-only with §0 FS-write rule.

## Appended from prior pending tasks
none (pending/ was empty at scan time; plans 01–04 already in completed/).
