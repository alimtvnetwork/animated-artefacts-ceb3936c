# spec/slides/40 — Snap-to-guide for Step rows

**Status**: shipped in v0.76.0
**Companion to**: spec 35 (live guide), spec 38 (preview guide)

## Summary

Adds a per-step `leftOffsetPx?: number` field to `StepSpec` plus a "Snap
to guide" control panel inside the Step editor. Three buttons (Logo /
Body / Rail) read live x-coordinates from the SlidePreview alignment
overlay and one-click-fill the offset, so the author can snap a step
row's label/title/capsule to any of the three alignment guides without
hand-typing pixel values.

## Schema

```ts
interface StepSpec {
  id: string;
  title: string;
  description?: string;
  cta?: string;
  /** 0–80px. Adds left padding to the step row in StepTimelineSlide. */
  leftOffsetPx?: number;
}
```

Range clamped at runtime to `[0, 80]`. Omitted = no offset.

## Live measurement plumbing

```
SlidePreviewAlignmentOverlay   ─ measure ─►   guidePositions store
       (producer)                                  (singleton)
                                                       │
                                                       ▼
                                          useGuidePositions() hook
                                                       │
                                                       ▼
                                       <StepSnapControls> in editor
                                                       │
                                                       ▼
                                          onChange(leftOffsetPx)
                                                       │
                                                       ▼
                                  StepTimelineSlide row paddingLeft
```

`guidePositions.ts` is a tiny `useSyncExternalStore`-compatible pub/sub
that bypasses `presetSettings` storage — guide x-positions thrash on
every resize and we don't want that hitting localStorage. Subscribers
get re-rendered only when one of `{logoX, bodyX, railX}` actually
changes.

## Snap math

Step rows render INSIDE `.step-timeline-content` (the body grid). So the
row's intrinsic origin is `bodyX`. The padding needed to land the row's
visible left edge at any guide is:

```
leftOffsetPx = max(0, guideX - bodyX)
```

Result: clicking "Body" sets 0 (row already starts at body edge).
Clicking "Logo" pulls the row LEFT — but since padding can't go
negative, when the body grid is offset further inboard than the logo
(common with `bodyGridNudge > 0`), "Logo" lands at 0. That's fine: the
author can lower `bodyGridNudge` first if they need the row flush with
the logo.

Clicking "Rail" lands the row at the timeline rail's x — the typical
"hanging-indent" look that matches the active connector line.

## Fallbacks

When the alignment overlay is OFF (or the preview hasn't mounted yet),
guide positions are `null`. The buttons still work but use sensible
fallback offsets:
- Logo  → 0
- Body  → 0
- Rail  → 28

The hint text reminds the author to enable the guide for exact
measurements.

## Editor UI

Inside the Steps repeater, after the optional CTA pill block:

```
┌──────────────────────────────────────┐
│ ⇤  SNAP TO GUIDE         28px        │
├──────────────────────────────────────┤
│  [ Logo ]  [ Body ]  [ Rail ]        │
│  [ 28      ]  Reset                  │
└──────────────────────────────────────┘
```

Each button shows the live measured x in its `title` tooltip when
guides are active, or a "enable Alignment guide" hint when they're not.

## Verification

1. /settings → enable "Alignment guide".
2. Open /builder → pick a StepTimelineSlide → expand a step.
3. Click "Logo" — `leftOffsetPx` jumps to (logoX − bodyX), preview row
   slides left.
4. Click "Rail" — preview row slides right to the rail x.
5. Click "Body" — back to 0.
6. Type 80 manually — clamps; type 999 — clamps to 80.
7. Disable alignment guide. Buttons still work with fallback values; hint
   text turns ember-colored.

## Reveal mode (added v0.84.0)

Setting `leftOffsetPx > 0` on a step automatically opts that row into
**Step timeline reveal** — a more cinematic per-row entrance:

| Property | Default rows (`leftOffsetPx == 0`) | Snap-reveal rows (`leftOffsetPx > 0`) |
|---|---|---|
| Initial x | `-24px` | `-(offsetPx + 32px)` |
| Duration | `0.5s` | `1.1s` |
| Easing | `[0.22, 1, 0.36, 1]` | `[0.16, 1, 0.3, 1]` (expo-out, matches active text-slide) |
| Decoration | none | gold rail trace fades in `64px` from row left, 250ms after land |
| Class | `.step-row` | `.step-row` + `.step-row--snap-reveal` (also `data-snap-reveal="true"`) |

Rationale: a snap-aligned row is by definition anchored to a visual
guide, so its entrance should *land* onto that guide rather than just
fade in. The deeper start-x and longer expo-out tween read as "the row
slides into its dock"; the underline trace confirms the dock visually.

Reduced motion: x stays at 0, duration collapses to 0.001s, the
underline appears statically (no animation). Behavior remains
deterministic for screenshot/PDF capture.

Implementation: `src/slides/types/StepTimelineSlide.tsx` (~line 624)
selects `initialX`, `revealDuration`, `revealEase` per row; CSS hook
`.step-row--snap-reveal::after` lives in `src/index.css` (~line 710).


## Header offset (added v0.85.0)

A separate per-slide knob `content.headerOffsetPx` (StepTimelineSlide only)
shifts the eyebrow + title block independently of the steps below it.
Useful when the slide's title needs to sit further into the body grid
than the chip column — e.g. slide 3 "Engagement Process" where the user
asked for the header to align with the description column rather than
with step 1.

| Property | Value |
|---|---|
| Field | `content.headerOffsetPx?: number` |
| Range | `[-160, 160]` px (clamped at runtime) |
| Default | `0` (legacy; eyebrow + title align with logo sight line) |
| Affects | the `.step-timeline-header` div only — eyebrow + title |
| Does NOT affect | step rows, autoplay counter, side description panel, ambient layer |
| Mechanism | `transform: translateX(${headerOffsetPx}px)` on the wrapper |
| DOM hook | `data-header-offset="<n>"` for QA / CSS overrides |

Why this is separate from `step.leftOffsetPx`:

- `leftOffsetPx` is per-row padding used by the snap-to-guide editor and
  triggers the cinematic per-row reveal (above).
- `headerOffsetPx` is a slide-level horizontal nudge for the title block
  alone. It does NOT trigger the reveal mode and it does NOT participate
  in the snap-to-guide editor — it is a free-form nudge authored in JSON.

Implementation: `src/slides/types/StepTimelineSlide.tsx` (~line 509)
wraps the eyebrow + title in `.step-timeline-header` with the inline
transform. Schema: `spec/slides/slide.schema.json` (`content.headerOffsetPx`).
Authored example: `spec/slides/showcase/03-process.json` (`headerOffsetPx: 40`).

## Right-edge snap (added v0.86.0)

A symmetric companion field `step.rightOffsetPx?: number` lets the author
pull a row's RIGHT edge inward to align with a guide. Use cases: aligning
the label/title/capsule width with the description column, ensuring step
text doesn't bleed into the right-side ambient layer, or visually
"cropping" a row to the rail.

| Property | Value |
|---|---|
| Field | `step.rightOffsetPx?: number` |
| Range | `[0, 160]` px (clamped at runtime) |
| Default | `0` (no inset) |
| Mechanism | `paddingRight: ${px}px` on `.step-row` |
| DOM hook | `data-right-offset="<n>"` for QA / CSS overrides |
| Reveal mode | DOES NOT trigger snap-reveal (only `leftOffsetPx > 0` does) |

### Editor UI

The Step editor now renders TWO snap panels per row:

```
┌─ Snap left to guide ─────────────────┐
│  [ Logo ]  [ Body ]  [ Rail ]        │
│  [ 28      ]  Reset                  │
└──────────────────────────────────────┘
┌─ Snap right to guide ────────────────┐
│  [ Body ]  [ Half ]  [ Rail ]        │
│  [ 0       ]  Reset                  │
└──────────────────────────────────────┘
```

Right-side targets (computed from the live alignment guides):

| Button | Behavior |
|---|---|
| Body  | `0` — no right inset (full body-grid width) |
| Half  | `(stageWidth − 2·bodyX) / 2` — pull right edge to ~50% of body column |
| Rail  | `stageWidth − railX` — snap right edge to the timeline rail x |

Falls back to `80` / `120` when guides aren't measured. Tooltip shows the
exact px the button will write.

### Verification

1. /settings → enable "Alignment guide".
2. Open /builder → pick a StepTimelineSlide → expand a step.
3. Click right-side "Half" — preview row's text column shrinks toward
   the chip; capsule wraps if needed.
4. Click right-side "Rail" — preview row stops at the rail x.
5. Type 999 — clamps to 160; type -10 — clamps to 0.
6. Combine with `leftOffsetPx`: row gets both paddings; reveal mode
   still triggers off the left value alone.
