# New media-rich slide types catalog

**Slug:** new-slide-types-catalog
**Status:** pending
**Parent:** 05-slide-options-themes-and-number-controller
**Created:** 2026-06-06

## Goal
Add image / SVG / GIF / media-forward slide types so an LLM can author rich
decks from JSON alone. Each new type = spec-first (JSON+MD pair) then runtime
component, registered in the `SlideType` union + renderer switch + enum catalog
used by the LLM guide.

## Proposed new types (spec-first, one idea each)
1. `FullBleedImageSlide` — edge-to-edge image/GIF, optional title overlay + scrim.
2. `SplitMediaSlide` — media one side, keywords/capsules the other (L/R config).
3. `MediaGridSlide` — 2–6 image/SVG tiles with captions.
4. `GifLoopSlide` — looping GIF/animated media with caption + play/pause respect
   for reduced-motion (freeze frame).
5. `SvgDiagramSlide` — inline SVG figure with annotation callouts.
6. `QuoteOverImageSlide` — pull-quote layered on a dimmed photo.
7. `LogoWallSlide` — grid of SVG/PNG logos (clients/tools).
8. `BeforeAfterSlide` — two media panels with a divider/label.
9. `IconRowSlide` — row of icon + label capsules.
10. `MediaTimelineSlide` — timeline rail where each step carries a thumbnail.

## Per-type deliverables (each)
- `front-end/slide-template/<Type>.json` + `<Type>.md` template.
- `spec/21-slides-system/` contract entry (props, layout, density budget).
- Runtime component in `src/slides/types/` (<100 lines, split sub-parts).
- Register in slide-type union/enum + renderer switch.
- A real sample slide in the `image-examples` deck.
- §3 inventory row + §4 per-type sample in
  `spec/llm-guideline/00-simplified-single-file-guide.md`.

## Image authoring
Reuse the existing image authoring contract (`content.image`, `imageRole`,
`images[]`, `caption`, asset/SVG/Base64/data-URI). GIF support = treat as image
src; add `freezeOnReducedMotion` flag.

## Verification
- Each type renders in `?deck=image-examples` without overflow.
- `bunx vitest run src/test/llmGuidelineBundle.test.ts` still green after
  catalog additions; add coverage asserting each new type appears in §3/§4.
