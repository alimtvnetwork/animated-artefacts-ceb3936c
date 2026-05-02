# 22b — Worked Example: Adding `MetricGridSlide`

> Companion to `22-add-new-slide-type.md`. This is the *actual* commit
> walked end-to-end, so a future blind LLM has a real diff to mimic
> instead of just a recipe. Pack version: v0.110.0.

The brief was: *"add a slide that shows four headline business metrics
in a grid — big number, label, caption per cell — between the strategy
detail and the contact card."* No existing slide type expresses three
rungs of typographic hierarchy per cell, so a new type is justified
(see `22-add-new-slide-type.md` §1).

---

## 1. Final shape (what shipped)

```json
{
  "slideNumber": 5,
  "slideName": "impact-metrics",
  "slideType": "MetricGridSlide",
  "transition": "PushIn",
  "textAnimation": "Stagger",
  "isClickReveal": false,
  "showBrandHeader": true,
  "showPresenterChip": true,
  "titleStyle": "white",
  "titleShimmer": false,
  "content": {
    "eyebrow": "BY THE NUMBERS",
    "title": "Proof of impact",
    "subtitle": "Last 12 months across the full Riseup Asia portfolio.",
    "metrics": [
      { "value": "3.4M",  "label": "Users reached", "caption": "Across all client surfaces.", "accent": "gold" },
      { "value": "99.9%", "label": "Uptime",        "caption": "Rolling 90-day SLO.",         "accent": "teal" },
      { "value": "<10ms", "label": "P95 latency",   "caption": "Edge-rendered globally.",     "accent": "sky"  },
      { "value": "$4.2M", "label": "ARR added",     "caption": "Net-new in 2025.",            "accent": "ember"}
    ]
  }
}
```

Rendered at `/5`, the builder thumbnail, and the `G`-key grid overview.
Lives at `spec/slides/showcase/05-impact-metrics.json` + `.md`.

---

## 2. The 8-step diff (in order)

### Step 1 — `src/slides/enums.ts`

```diff
   SectionDividerSlide: 'SectionDividerSlide',
+  /**
+   * Compact grid of headline metrics — big number + label + optional caption
+   * per cell. 2-6 cells, auto-laid out (1xN, 2x2, or 2x3 depending on count).
+   * Use for proof-of-impact slides ("3M users · 99.9% uptime · $4.2M ARR").
+   */
+  MetricGridSlide: 'MetricGridSlide',
 } as const;
```

### Step 2 — `src/slides/types.ts`

Two additions: a new `MetricSpec` interface and an optional `metrics`
field on `SlideContent`.

```diff
+export interface MetricSpec {
+  value: string;            // free-form: "$4.2M", "99.9%", "<10ms"
+  label: string;
+  caption?: string;
+  accent?: CapsuleColorValue;
+}

 export interface SlideContent {
   ...
   hotspots?: HotspotSpec[];
+  /** MetricGridSlide only — 2-6 headline metric cells. */
+  metrics?: MetricSpec[];
 }
```

`metrics?` is **optional** because `SlideContent` is shared across every
slide type (see file 22 §3 rule).

### Step 3 — `src/slides/types/MetricGridSlide.tsx`

Skeleton from file 22 §4, fleshed out:

- `pt-32 pb-20 px-[var(--brand-inset-x,...)]` for the safe area.
- `bg-ink` baseline, `<AmbientBackground seed="metric-grid-..." />` mounted at z=0.
- Header block uses `slide-eyebrow`, `slide-title-content`, `slide-subtitle`
  utilities + `titleClassFor(spec)` so `titleStyle: "white"` applies.
- Grid layout auto-derived from `metrics.length`:
  - 2 → `grid-cols-2`
  - 3 → `grid-cols-3`
  - 4 → `grid-cols-2 grid-rows-2`
  - 5–6 → `grid-cols-3 grid-rows-2`
- Per-metric stagger via `delay: 0.18 + i * 0.08`, gated on `useReducedMotion()`.
- Accent map keyed by `CapsuleColorValue`; new sky/teal/violet/rose live
  as inline `hsl()` color literals (we don't yet have semantic tokens
  for them outside the capsule context — that's a future cleanup).

### Step 4 — `src/slides/SlideStage.tsx`

```diff
 import { SectionDividerSlide } from './types/SectionDividerSlide';
+import { MetricGridSlide } from './types/MetricGridSlide';

   case 'SectionDividerSlide': return <SectionDividerSlide spec={slide} />;
+  case 'MetricGridSlide': return <MetricGridSlide spec={slide} />;
```

### Step 5 — `src/slides/components/SlidePreview.tsx`

```diff
 import { SectionDividerSlide } from '../types/SectionDividerSlide';
+import { MetricGridSlide } from '../types/MetricGridSlide';

   case 'SectionDividerSlide':return <SectionDividerSlide spec={slide} />;
+  case 'MetricGridSlide':    return <MetricGridSlide spec={slide} />;
```

### Step 6 — `src/slides/controls/GridOverview.tsx`

```diff
 import { SectionDividerSlide } from '../types/SectionDividerSlide';
+import { MetricGridSlide } from '../types/MetricGridSlide';

   case 'SectionDividerSlide':return <SectionDividerSlide spec={slide} />;
+  case 'MetricGridSlide':    return <MetricGridSlide spec={slide} />;
```

### Step 7 — `src/builder/fieldSchemas.ts`

This file was *not* listed in file 22's recipe but is required by
TypeScript (`SLIDE_TYPE_SCHEMAS: Record<SlideTypeValue, SlideTypeSchema>`).
Add the `metrics` `FieldKey` and a builder-defaults entry. **Action item
for file 22:** add this site to the recipe.

### Step 8 — Author the example

- Created `spec/slides/showcase/05-impact-metrics.json` (the spec above).
- Created `spec/slides/showcase/05-impact-metrics.md` (one-paragraph design intent + variety-guard table + acceptance checks).
- Patched `spec/slides/showcase/deck.json` `slides[]` to insert
  `"05-impact-metrics"` between `"04-strategy-detail"` and `"06-contact"`.

---

## 3. Schema + contracts updates (extra rigor — do not skip)

A new `slideType` only loads cleanly if both validation layers know about it.

### `spec/slides/slide.schema.json` (Ajv discriminator)

- Added `"MetricGridSlide"` to `slideType.enum`.
- Added a `MetricGridSlideVariant` branch under the top-level `oneOf`,
  pinning `slideType.const` and requiring `content.title` + `content.metrics` (2–6 items).
- Added a new `Metric` definition with `value`, `label`, `caption?`, `accent?`.
- Added the `metrics` array under `content.properties`.

### `src/slides/contracts.ts` (zod runtime)

- Added `MetricGridSlide: ['title', 'metrics']` to `REQUIRED_FIELDS`.
- Added a `Metric` zod schema and a `MetricGridContent` schema with
  `metrics: z.array(Metric).min(2).max(6)`.
- Added `make('MetricGridSlide', MetricGridContent)` to the discriminated union.

---

## 4. Variety guard worked through

Neighbors: slide 4 (`SlideIn` + `SlideUp`), slide 6 (`FadeIn` + `FadeIn`).
Picked `PushIn` + `Stagger` — different on both axes from both neighbors,
allowed by `24-collision-matrix.md`. Done.

---

## 5. Acceptance — what we verified

- [x] `bunx tsc --noEmit` clean — TypeScript caught every missing
      switch/case while we worked.
- [x] All 13 existing tests still pass.
- [x] `bunx vitest run src/test/schema.test.ts` — Ajv discriminator
      validates the new `05-impact-metrics.json` against the
      `MetricGridSlideVariant` branch.
- [x] `assertValidSlides` doesn't fire for the new slide.
- [x] `/5` renders the four cells in a 2×2 grid with the right
      accent colors.
- [x] Builder thumbnail + grid overview render the same slide.

---

## 6. Lessons for file 22 (already filed)

1. **Add `src/builder/fieldSchemas.ts` to §1's 8-step table.** Currently
   missing; TypeScript catches it at build time but a blind LLM might
   skip it.
2. **`AmbientBackground` requires `seed`, not `preset`.** File 22's
   skeleton omits the prop entirely; flag this so authors don't
   re-invent a `preset` prop.
3. **The schema discriminator needs both an enum entry AND a `oneOf`
   branch** — adding only the enum value silently passes any `content`
   shape because the matching branch never narrows.
