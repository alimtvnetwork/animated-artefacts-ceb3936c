# 75 — next-task snapshot (inert history)

Status: archive only — do not match/load. Summary, not an executable driver.

## Outcome of this iteration (v1.80.0)
- Root cause (one sentence): there was no runtime/build error signal; the actual gap was that `GifLoopSlide` and `SvgDiagramSlide` had runtime + contract support but no spec-first regression samples in the maintained `image-examples` deck.
- Delivered the minimum fix: added runtime deck slides `15-gif-loop.json` and `16-svg-diagram.json`, authored matching spec JSON+MD pairs under `spec/26-slide-definitions/image-examples/`, updated the deck manifest/spec inventory, and added a tiny local GIF asset for deterministic coverage.
- Verified: `bunx vitest run src/test/imageExamplesDeck.test.ts src/test/manifestKeyCasing.test.ts` → 9 passed; no runtime errors found, no console logs found.

## Next 3 steps (carried forward)
1. **`QuoteOverImageSlide` (spec + runtime + contract).** Why now: quote/testimonial beats still have no dedicated media-overlay structure. ~35 min. Unblocks: photo-backed quote moments.
2. **`LogoWallSlide` (spec + runtime + contract).** Why now: credibility/social-proof slides still require awkward manual layouts. ~35 min. Unblocks: partner/investor/customer logo pages.
3. **`BeforeAfterSlide` (spec + runtime + contract).** Why now: comparison stories still need bespoke compositions instead of a purpose-built pattern. ~35 min. Unblocks: transformation/comparison narratives.

## Remaining after those 3
- `IconRowSlide`
- `MediaTimelineSlide`
- Final 50-slide QA pass
- Move plan `05` to `completed/`