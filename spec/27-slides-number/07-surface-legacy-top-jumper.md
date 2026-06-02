# 07 — Surface 5 (legacy): Top Slide Jumper + section popover

**File:** `src/slides/controls/TopSlideJumper.tsx`
**Status:** **OFF by default.** Superseded by `PresenterTopBar` (Surface 1) for
the always-visible counter. Only mounts behind the `?jumper=1` query flag.
Documented here for completeness so a blind re-implementation matches reality.

## When it renders

```tsx
{!gridOpen && !topJumperHidden &&
 new URLSearchParams(location.search).get('jumper') === '1' && (
  <TopSlideJumper current={currentLinear} total={total}
    slides={linearSlides} onJump={jump} />
)}
```

- Requires `?jumper=1` in the URL. Otherwise never shown.
- Same gating as `PresenterTopBar` (`!gridOpen && !topJumperHidden`) so the two
  never fight when both could appear.

## Props

```ts
interface Props {
  current: number;
  total: number;
  slides: SlideSpec[];
  onJump: (n: number) => void;  // page's `jump`
}
```

## Behaviour

- Renders a top-center "NN / NN" chip (large, low-contrast, `tabular-nums`,
  gold accent on the current number, hairline rule under it).
- **Double-click** the chip opens a Popover containing a **section/slide
  jumper**: the linear slides grouped into sections delimited by
  `SlideType.SectionDividerSlide`.
  - `groupBySections(slides)` walks the linear list. Each `SectionDividerSlide`
    starts a new section (and is itself listed as that section's first
    jumpable item). Slides before the first divider go into an `Intro` section.
    If there are **no dividers**, a single `All slides` section lists
    everything.
  - Each item shows `{ index, title, slideNumber }`. `title` falls back:
    `content.title || content.eyebrow || `Slide ${oneBased}``.
- Has an inline numeric input as well:
  - On open, `val` is set to `String(current)` and selected (deferred a tick so
    the Popover focus-trap doesn't steal it).
  - `commit()` accepts `1..total` only: `if (!Number.isNaN(n) && n >= 1 && n <=
    total) { onJump(n); setOpen(false); }`. Out-of-range is a silent no-op
    (unlike the controller indicator, which toasts).
  - `pick(n)` (from a section item) calls `onJump(n)` and closes.

## Re-enable / migration guidance

- To bring the popover gesture back for a long deck, append `?jumper=1`.
- If you ever promote this back to default-on, reconcile it with
  `PresenterTopBar` so only one top-center counter renders. Prefer extending
  `PresenterTopBar` rather than running both.
