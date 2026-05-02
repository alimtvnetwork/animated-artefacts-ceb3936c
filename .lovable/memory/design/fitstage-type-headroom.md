---
name: fitstage-type-headroom
description: All FitStage'd slide text must be authored ≥ post-scale legibility × 1/worst-scale. Body/descriptive ≥ text-2xl (~26px source). Reserve text-sm/text-xs for metadata only.
type: design
---

The deck wraps every slide in `FitStage`, which transform-scales a fixed
1920×1080 canvas uniformly to fit the viewport. Typical preview viewports
(~1024–1280px wide) end up at scale **0.53–0.66**, which means any source
font size shrinks by that same factor on screen.

## Rule

For text that must read at ≥14px on the smallest realistic preview:

```
authored size ≥ desired px / worst-expected scale ≈ desired px / 0.55
```

So **body / descriptive text must be authored at ≥ `text-2xl` (~24-26px)**
in source. Step markers, capsule labels and detail copy follow the same
math. `text-sm` and `text-xs` are reserved for **secondary metadata**
(timestamps, auxiliary tags, small uppercase pills) — never for body,
subtitle, or descriptive bullets on a FitStage'd slide.

Marker / chip sizes follow the same headroom rule: a 56px marker becomes
~31px after scale, which is too small for confident click targets. Default
markerSize floor for FitStage'd interactive markers is **72px source**.

## Why this exists

2026-04-30 (slide 4 / StepsChain3DSlide): with FitStage active the slide
looked perfectly aligned but every text element + marker read as tiny.
Root cause was that source sizes had no scale headroom — they'd been
authored against the unscaled 1920×1080 mock. See
`.lovable/question-and-ambiguity/22-slide4-text-too-small-after-fitstage.md`.

## Forbidden

- `text-sm` / `text-xs` on body, subtitle, or any descriptive copy inside a
  FitStage'd slide.
- Authoring marker / chip sizes < 64px source for interactive elements
  inside FitStage.
- Compensating for "too small" feedback with a CSS transform scale-up — the
  fix is always to bump the source font/marker sizes (per author rule).

## Deck-wide bumps live in `src/index.css` (v0.220, 2026-04-30)

Any deck-wide type adjustment MUST edit `src/index.css` — never per-slide,
never via `transform`. Two surfaces:

1. **Semantic class clamps** — `.slide-title-display`, `.slide-title-content`,
   `.slide-eyebrow`, `.slide-subtitle`, and the `--step-title-*` custom
   properties.
2. **`[data-fit-stage="true"]` Tailwind override block** (bottom of
   `index.css`) — overrides every Tailwind `text-*` utility (xs → 9xl) with
   explicit `font-size` declarations scoped to the FitStage subtree, so the
   controller / settings panel / non-stage UI keep their original sizing.

To retune: change the multiplier (currently 1.18 for type, 1.30 for steps)
in those two locations only. See
`.lovable/question-and-ambiguity/23-deck-wide-typography-too-small.md`.

