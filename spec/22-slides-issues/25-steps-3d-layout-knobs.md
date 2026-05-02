# Change Request 25 — StepsChain3DSlide layout knobs

> **Status:** shipped (2026-04-30)
> **Targets:** `src/slides/types/StepsChain3DSlide.tsx`
> Builds on [`spec 61`](../21-slides-system/61-steps-chain-3d.md) and
> [CR 24](./24-steps-3d-refinements.md).

## Why

The rail position, marker diameter, and per-row text gap were three separate
hardcoded numbers (`28px → 64px`, `w-14 = 56px`, `gap-5 = 20px`) that had to
stay in sync manually. Every time the user wanted breathing room tweaked,
someone edited the component. This adds an optional `content.layout` block
so designers can tune all three from JSON without touching code.

## Schema (additive, all optional)

```jsonc
{
  "slideType": "StepsChain3DSlide",
  "content": {
    "steps": [ /* ... */ ],
    "layout": {
      "markerSize": 56,   // px, ∈ [32, 96], default 56
      "railOffset": 8,    // px past marker right edge, ∈ [0, 48], default 8
      "textGap":    8     // px past rail before text starts, ∈ [0, 64], default 8
    }
  }
}
```

## Geometry

```
[ 0 .. markerSize ][ railOffset ][ rail (1px) ][ textGap ][ text … ]
                  ^--rail x = markerSize + railOffset
                  ^--row gap = railOffset + textGap
```

Defaults match the prior visual exactly (rail at 64px, row gap at 16px).

## Guards

- All three values are clamped to safe ranges at runtime — a typo cannot
  break the layout.
- Marker diameter feeds both `width`/`height` on the marker element and
  the `--chain3d-marker-size` CSS var (still exposed for any future
  CSS-only consumers).
- Omitting the block, or any field within it, restores the default 56/8/8.

## Verification

1. Add `"layout": { "markerSize": 72, "railOffset": 12, "textGap": 12 }` to
   `front-end/project/showcase/data/slides/04-process-3d.json`.
2. Open `/4`. Markers grow to 72px, rail sits at 84px, text starts 12px
   past rail with no overlap.
3. Remove the block. Layout returns to the default 56/8/8 with zero diff
   from the prior shipped look.
