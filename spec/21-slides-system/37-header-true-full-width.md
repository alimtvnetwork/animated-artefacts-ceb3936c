# Spec 37 — True Full-Width Brand Header

Status: locked (v0.69.0)
Related: spec 34 (body grid alignment), spec 35 (alignment guide), spec 36 (StepTimeline first-load + alignment).

## Root cause analysis

The header wrapper was already `absolute left-0 right-0`, but the logo still looked too far from the left edge for two separate reasons:

1. **Header chrome padding was still too generous** — `px-6 lg:px-8` placed the image box 24–32px from the viewport edge.
2. **The logo PNG itself had transparent padding** — `riseup-asia-logo.png` is `854×214`, but the visible alpha bounding box starts at `x=24`. That means even a perfectly full-width header still appeared another 24px inset.

So the apparent left gap was wrapper padding + transparent image padding.

## Decision

The BrandHeader must be independent deck chrome, not body content.

- Header remains outside the slide body's 1440px container.
- Header spans the full slide viewport via `absolute left-0 right-0`.
- Header uses small independent edge padding: `px-2 sm:px-3 lg:px-4`.
- Header imports a trimmed logo asset with transparent padding removed: `riseup-asia-logo-trimmed.png`.
- Presenter chip remains pushed to the far right by the same independent header padding.

## Body grid relationship

The body grid alignment setting still exists:

- `header-anchored` now aligns to the true visible logo edge using `clamp(0.5rem, 1vw, 1rem)`.
- `centered` still centers the 1440px content container for compositions that need it.

This means the header is true full-screen chrome, while the StepTimeline body can either align with the visible logo edge or opt back into centered content.

## Verification

1. Open `/3`.
2. The RiseupAsia visible "R" should sit close to the true left viewport edge, not inside the body/title grid gutter.
3. The presenter chip should sit close to the true right viewport edge.
4. Toggle the alignment guide: in `header-anchored`, the body guide should align to the visible logo edge; in `centered`, the body guide moves back to the centered content line while the header stays at the viewport edge.
