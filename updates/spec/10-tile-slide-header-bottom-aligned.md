# 10 — TileSlide: header bottom-aligned, close to tiles

**Date:** 2026-05-03
**Slide affected:** `05` (TileSlide), and TileSlide pattern in general.

## Problem
On slide 05 the title (`TODAY'S GOAL` + `We'll build two CLIs along the way.`) was anchored at the top of the slide while the tile cards sat in the lower half. This produced a large dead band between the headline and the cards, breaking visual coupling.

The user also wanted the headline's left edge to share the same x-axis as the brand logo / tiles (already `px-24`), not float independently.

## Rule (authoring contract for TileSlide)
1. **Header is bottom-aligned with the tiles, not top-anchored.** The section uses `flex flex-col justify-end` so the header sits directly above the tile grid.
2. **Header and tile grid are close-coupled** — gap between them is `mb-6` (24px). Never reintroduce `flex-1` + `content-center` on the grid; it pushes the header away from the cards.
3. **Header shares the brand x-axis** — section padding stays `px-24` (matching the BrandLogo) so the eyebrow/title left-edge lines up with the logo and the first tile.
4. **Bottom padding** is `pb-24` to leave breathing room above the controller and caption.

## Implementation
`src/slides/types/TileSlide.tsx`:
- Section: `flex flex-col justify-end px-24 pt-20 pb-24`
- Header: `mb-6` (was `mb-8`)
- Grid: `grid ${cols} gap-6` (removed `flex-1` and `content-center`)

## Don't
- Don't re-add `content-center` or `flex-1` to the tile grid — it decouples the header from the cards.
- Don't change `px-24` — it's the shared brand gutter.
- Don't move the header back to the top of the slide for tile layouts.
