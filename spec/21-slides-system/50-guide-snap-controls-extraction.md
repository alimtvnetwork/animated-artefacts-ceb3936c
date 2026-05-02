# spec/slides/50 — GuideSnapControls extraction

**Status**: shipped in v0.91.0
**Companion to**: spec 40 (snap-to-guide for step rows)

## Summary

The `StepSnapControls` previously hard-coded inside
`src/builder/ContentFieldEditor.tsx` has been extracted into a reusable
component, `GuideSnapControls`, at `src/builder/GuideSnapControls.tsx`.
The visible UI for the existing per-step left/right snap panels is
unchanged — this is a structural refactor that opens the door for other
editors (step CTAs, capsule labels, future vertical snap) to reuse the
same chrome without forking it.

## What moved

| Concern | Before (v0.90) | After (v0.91) |
|---|---|---|
| Panel chrome (label row, buttons, input, reset, hint) | inlined in `StepSnapControls` | owned by `GuideSnapControls` |
| `useGuidePositions()` subscription | inlined | owned by `GuideSnapControls` |
| Step left math (Logo / Body / Rail) | inlined | exported as `stepRowLeftTargets` |
| Step right math (Body / Half / Rail) | inlined | exported as `stepRowRightTargets` |
| `STAGE_WIDTH_PX` constant | local to ContentFieldEditor | exported from `GuideSnapControls` |
| `StepSnapControls` (per-step wrapper) | ~165 lines | ~30 line thin wrapper |

## New API

```tsx
import {
  GuideSnapControls,
  SnapIcons,
  stepRowLeftTargets,
  stepRowRightTargets,
  type SnapTarget,
} from './GuideSnapControls';

<GuideSnapControls
  value={value}
  onChange={onChange}
  buildTargets={stepRowLeftTargets}
  label="Snap left to guide"
  max={80}
  icon={SnapIcons.left}
  helpText="Adds left padding (0–80px) ..."
/>
```

`buildTargets` receives the live `GuidePositions` snapshot and returns 1–3
`SnapTarget`s. Targets describe a label, tone (`gold|cream|ember`), the
px value to write on click, and a `live` tooltip string (or `null` if
the guide isn't currently measured).

The component automatically:
- Subscribes to `useGuidePositions()`.
- Clamps numeric input to `[min, max]` (default `[0, 80]`).
- Sizes the button grid to `targets.length` columns.
- Shows the "Live measurement OFF" ember-colored hint when every target
  reports `live === null`.

## Adding a new snap editor

1. Write a target builder in `GuideSnapControls.tsx` (or co-located with
   the consuming editor):

   ```ts
   export function ctaPillSnapTargets(guides: GuidePositions): SnapTarget[] {
     return [
       { key: 'Body', tone: 'cream', px: 0, live: ... },
       { key: 'Rail', tone: 'ember', px: ..., live: ... },
     ];
   }
   ```

2. Render `<GuideSnapControls buildTargets={ctaPillSnapTargets} ... />`.
3. **Do not** copy the panel JSX. The whole point of the extraction is
   that the chrome stays single-source.

## Verification

- Type-check passes (`bunx tsc --noEmit`).
- /builder → StepTimelineSlide → expand a step: both Snap-left and
  Snap-right panels render identically to v0.90.
- Live measurement still updates on /settings → toggle Alignment guide.
- Range clamping unchanged: 80 / 160 max for left / right respectively.

## Files

- New: `src/builder/GuideSnapControls.tsx`
- Edited: `src/builder/ContentFieldEditor.tsx` (StepSnapControls is now a
  thin wrapper)
- Memory: `.lovable/memory/features/guide-snap-controls.md`
