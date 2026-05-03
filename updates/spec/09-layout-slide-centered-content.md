# Update — LayoutSlide can center its whole content block vertically

**Date**: 2026-05-03
**Scope**:
- `src/slides/types.ts` — `SlideContent` gains `layoutVerticalAlign?: 'start' | 'center'` for `LayoutSlide`.
- `src/slides/types/LayoutSlide.tsx` — section can now vertically center the header + grid as one unit.
- `front-end/project/session-4-ai-coding/data/slides/09-your-call.json` — slide 09 sets `"layoutVerticalAlign": "center"`.
- `front-end/project/session-4-ai-coding/spec/09-your-call.md` — authoring rule updated.

## Problem
Slide 09 was technically aligned to the logo on the x-axis, but the whole
composition sat too high on the canvas. The user wanted the content block
to live in the middle of the slide, not cling to the top chrome.

## Change
New `LayoutSlide` content field:

```ts
layoutVerticalAlign?: 'start' | 'center';
```

- `start` = legacy behavior; header at the top, grid fills remaining height.
- `center` = treat the header + grid as one compact stack and center that
  stack vertically in the slide body.

Implementation detail:
- the outer `<section>` switches to `justifyContent: center`
- the grid wrapper stops using `flex: 1` when centered, so it hugs content
  instead of expanding and forcing the composition upward.

## Authoring rule
If a `LayoutSlide` has short copy and a small number of cards (for example:
decision slides, compare-two-option slides, open-question slides), default
to `layoutVerticalAlign: "center"`.

Do **not** keep these slides top-pinned unless the slide intentionally needs
large content volume below the header.

For slide 09 specifically:
- Plan A / Plan B stay compact and packed together.
- The entire left/right composition sits in the visual center band.

## Acceptance
- `/9`: the logo remains left-aligned with the headline, while the headline,
  body copy, and Plan A / Plan B group sit around the middle of the slide.
- The right cards stay close together and no longer read as floating near the
  top edge of the canvas.