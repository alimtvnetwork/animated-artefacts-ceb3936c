---
name: guide-snap-controls
description: Reusable `GuideSnapControls` component (src/builder/GuideSnapControls.tsx) that owns the snap-to-guide UI chrome (label/buttons/input/reset/help). Callers pass a `buildTargets(guides)` function. Step row left/right are now thin wrappers using `stepRowLeftTargets` / `stepRowRightTargets`. Add new editors (CTAs, vertical) by writing a new target builder, NOT a new component.
type: feature
---

# GuideSnapControls — reusable snap-to-guide panel (v0.91+)

Extracted from the per-step `StepSnapControls` (spec 40). Lives in
`src/builder/GuideSnapControls.tsx`.

## API

```tsx
<GuideSnapControls
  value={value}
  onChange={onChange}
  buildTargets={(guides) => SnapTarget[]}   // 1–3 targets
  label="Snap left to guide"
  max={80}                                   // clamp + input max
  icon={SnapIcons.left}                      // AlignLeft | AlignRight | AlignVerticalSpaceAround
  helpText="..."                             // optional paragraph
/>
```

`SnapTarget = { key, tone: 'gold'|'cream'|'ember', px, live: string|null }`.
`live === null` for any target = guides aren't measured → component shows
the "Live measurement OFF" hint automatically.

## Preset target builders

Exported from the same module so callers don't re-implement step math:

- `stepRowLeftTargets(guides)` — Logo / Body / Rail (origin = bodyX).
- `stepRowRightTargets(guides)` — Body / Half / Rail (inset from stage right).

To add a new editor (e.g. CTA pill, label, vertical):
1. Write a new `xxxTargets(guides: GuidePositions): SnapTarget[]` next to
   the existing presets in `GuideSnapControls.tsx`.
2. Render `<GuideSnapControls buildTargets={xxxTargets} ... />`.
3. Do NOT fork the panel UI.

## Rules

- The reusable component owns: chrome, clamping, `useGuidePositions()`
  subscription, helper text, "live OFF" warning.
- Callers own: which guide → px math, labels, icon, range.
- Keep `STAGE_WIDTH_PX = 1920` / `STAGE_HEIGHT_PX = 1080` exported from
  this module — it's the canonical stage size used by all snap math.
- Existing `StepSnapControls` in `ContentFieldEditor.tsx` is now a
  ~30-line wrapper; do not re-inline its math.
