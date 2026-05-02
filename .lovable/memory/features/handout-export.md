---
name: handout-export
description: One-click PDF handout via /handout route — stacks every linear slide, freezes animations on final states via dual-layer (CSS + Framer) kill, ShareMenu entry uses `?print=1` to auto-fire save dialog.
type: feature
---
Spec 28. Route: `/handout` (`src/pages/HandoutPage.tsx`). Mounts every `linearSlides` entry inside `<SlideStage>` stacked vertically, each wrapped in `.handout-page` (16:9 frame on screen, full A4 landscape page in print).

**Animation disable** is dual-layer:
1. CSS — `html[data-export-mode="true"] *` and `@media print *` zero `animation-duration` / `transition-duration` to 0s with `animation-fill-mode: forwards`. Catches all CSS-driven motion (ambient float, lattice glow, hover lift, cinematic capsule blur).
2. JS — `prefersReducedMotion()` in `motionPreferences.ts` returns true under `data-export-mode`. The flatteners in `transitions.ts` and `textAnimations.ts` then strip Framer transforms and clamp tweens to 10ms linear, freezing slide entrance variants and per-block presets (`bounce`, `cinematicCapsules`, etc.) on final state.

**Auto-print contract**: `/handout?print=1` mounts → two RAFs settle layout → `window.print()`. Visiting `/handout` directly is a silent on-screen preview (no dialog). ShareMenu's "Export PDF (handout)" button opens `/handout?print=1` in a new tab via `window.open(url, '_blank', 'noopener')` so the live deck is untouched.

**Pagination & fit-to-page (v0.155)**: `@page { size: A4 landscape; margin: 0 }`, `.handout-page { break-after: page }`, `:last-child { break-after: auto }`. Stage is **letterboxed not stretched** — `.handout-page` is the A4 sheet and centers a 16:9 `.handout-stage` inside via flex; stage uses `width: min(100%, calc(100vh * 16/9))` + matching height clamp so it always fits without cropping any authored content. Letterbox bars render in `--ink` so they read as deck background. On screen, page sizing uses `min(--handout-max-w, 97vw, calc(92vh * 16/9))` so neither width nor height overflows — one slide visible per viewport, scroll between.

**Reveal inclusion (v0.153)**: `?reveals=1` opts click-reveal sub-slides INTO the export. They're interleaved after their parent (authoring order via `allSlides`), tagged `data-reveal="true"` on the page wrapper and labelled "↳ reveal" in the page footer. Default remains OFF — `linearSlides`-only — so the standard export stays a clean linear walkthrough. ShareMenu surfaces a second entry "Export PDF + reveals" → `/handout?print=1&reveals=1`, only rendered when the deck actually contains reveals (`allSlides.some(s => s.isClickReveal)`).

**Inherits per-slide chrome**: BrandHeader visibility, ambient backgrounds, etc. all follow whatever the slide JSON declares — handout doesn't override them. The existing `[data-print-hide="true"]` rule still hides the controller pill, dot pagination, top jumper, and slide-number badge in the export.

**Files**: `src/pages/HandoutPage.tsx`, `src/App.tsx` (route), `src/index.css` (handout layout + dual-layer kill + fit-to-page letterboxing), `src/slides/controls/ShareMenu.tsx` (entries), `src/slides/motionPreferences.ts` (export-mode branch in `prefersReducedMotion`). v0.155.
