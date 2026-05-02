# 22 — Slide 4 text + step markers too small after FitStage uniform scaling

**Date:** 2026-04-30
**Slide:** `/4` (StepsChain3DSlide)
**Trigger:** User feedback on screenshot — alignment perfect, but every text
element + step marker visually too small at typical preview viewports
(~1053×622 → FitStage scale ≈ 0.55 of the 1920×1080 design canvas).

## Root cause

The slide was authored with **literal Tailwind size classes** (`text-2xl`,
`text-sm`, `text-4xl`, `text-[10px]`) and a **fixed default `markerSize: 56`**
sized for a 1:1 1920×1080 stage. Once `FitStage` (introduced in the responsive
scaling pass) wraps the whole deck and uniformly transform-scales it down to
fit narrower viewports, every one of those source pixel/rem values shrinks by
the same factor — so 56px markers render as ~31px and `text-sm` body reads as
~9px on a typical preview. Alignment stays correct (everything scales by the
same factor) but legibility collapses.

In short: there was **no headroom in the source typography** to survive
FitStage's downscale. Sizes were tuned for the unscaled 1920×1080 mock, not
for the realistic post-FitStage rendered size.

## Fix (2026-04-30, source-size only — NO transform scaling per author rule)

Bumped source font + marker sizes ~15-30%:

- `markerSize` default: **56 → 72** (+~29%); clamp upper bound 96 → 120
- `stepNumberSize3dRatio` default: **0.5 → 0.65** (+30%) — drives the top
  ghost numerals via `--step-number-size-3d`
- Marker numeral class: `text-xl` → **`text-2xl`** (+20%)
- Left chain row eyebrow: `text-[10px]` → **`text-[12px]`** (+20%)
- Left chain row title: `text-2xl` → **`text-3xl`** (+~20%)
- Left chain row subtitle: `text-sm` → **`text-base`** (+~14%)
- Slide eyebrow: `text-sm` → **`text-base`** (+~14%)
- Slide title (Tailwind hint): `text-4xl` → **`text-5xl`** (effective size now
  driven by `.slide-title-content` clamp)
- `.slide-title-content` clamp: `clamp(2rem, 4.2vw, 3.75rem)` →
  **`clamp(2.4rem, 5vw, 4.5rem)`** (~+20%)
- `.slide-eyebrow` global: `0.75rem` → **`0.9rem`** (+20%)
- Right detail capsule: `text-sm` → **`text-base`**
- Right detail h3: `text-4xl` → **`text-5xl`**
- Right detail bullet capsules: `text-sm` → **`text-base`**
- Right detail meta pill: `text-xs` → **`text-sm`**

## Prevention rule (added to memory)

When designing for a uniformly-scaled fixed canvas (`FitStage` 1920×1080),
authored type sizes must be the **post-scale legible size × inverse of the
worst expected scale**. Practical rule of thumb for this deck: type that needs
to read at ≥14px on the smallest realistic preview (~1024px wide → scale
~0.53) must be authored at ≥**26px (≈ `text-2xl`)** in source. `text-sm` /
`text-xs` are reserved for genuinely secondary metadata only — never for body
or descriptive copy on FitStage'd slides. New memory:
[fitstage-type-headroom](mem://design/fitstage-type-headroom).
