# Slide 09 — Where do we go from here?

**Type**: `LayoutSlide` (`split-2-equal`)
**Title color**: white
**Transition**: SlideIn · **Text**: Stagger

## Layout
- Whole content block is vertically centered on the slide via
  `layoutVerticalAlign: "center"`; never pin this slide to the top.
- Left column (`kind: plain`, `rowSpan: 2`) — calm "yours to steer" ask.
- Right column — two stacked compact cards:
  - Plan A · "Add a feature to Gitmap"
  - Plan B · "Your idea"

Both right cards use `compact: true` (see
`updates/spec/06-layout-slide-brand-aligned-and-compact.md`) so the
right column reads as a Plan A/B *list* rather than two hero panels.

## Alignment
Section padding uses `var(--brand-inset-x)`, so the eyebrow + headline
share the BrandHeader logo's left edge at every viewport width. Vertical
placement is center-weighted, so the logo, headline, left copy, and Plan
A / Plan B stack read as one balanced middle-band composition.

## Notes
Pause. Read the chat. Whichever path the room picks, the next 20 minutes
bend to it.
