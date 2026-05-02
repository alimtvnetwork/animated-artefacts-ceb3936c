# 19 — Remediation Pack (Audit 02 Gap Closures)

> **Phase 17/20** · Closes the four gaps flagged by
> `spec/audit/02-blind-llm-gap-analysis-v2.md`. Each section is the
> canonical answer for one gap; older specs defer to this file.

---

## G1 — Reference renders for empty asset folders

INDEX.md flagged `assets/canvas/`, `assets/background/`,
`assets/typography/`, `assets/authoring/` as empty. Until rendered
PNGs land, the **ASCII reference cards below** are authoritative.

### G1.1 Canvas (1920×1080 with safe-area)

```
┌──────────────────────────────────────────────────────────────┐ 1080
│  ┌────────────────────────────────────────────────────────┐  │
│  │  brand header (top 96px)                               │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │                                                        │  │
│  │  CONTENT SAFE AREA                                     │  │
│  │  centered band: 1440 wide × 760 tall                   │  │
│  │  inner: 560 list  +  80 gutter  +  800 detail          │  │
│  │                                                        │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │  controller pill (bottom 96px, hover-reveal)           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘ 1920
```

Cited by `07-canvas-and-scaling.md`. Pin: never let content cross the
top/bottom 96px reserved bands.

### G1.2 Ambient drift (default background)

```
   bg #0D0D0D  ─ radial gold glow at (cx 50%, cy 38%, r 60%)
                 opacity 0.10 → 0.04 → 0.0
   2 floating ember dots (parallax x: ±8px, y: ±4px on cursor)
   1 cream wisp (top-right, opacity 0.06, drift 14s loop)
```

Cited by `04-ambient-and-title-background.md` Part A,
`08-background-system.md`. Pin: dot radius ≤ 24px, motion ≤ 14s loop.

### G1.3 Typography ladder

```
display-xl  72/80   Ubuntu Bold    title slide hero
display-lg  56/64   Ubuntu Bold    content slide titles
display-md  40/48   Ubuntu Bold    middle title chapters
title       28/36   Ubuntu Bold    step row titles, panel headings
body        18/28   Inter          description, panel copy
eyebrow     13/16   Inter Medium   uppercase 0.08em tracking
capsule     14/20   Inter Medium   capsule labels
caption     12/16   Inter          micro labels, badge text
```

Cited by `10-typography.md`. Pin: never invent a size between rungs.

### G1.4 Authoring JSON flow

```
voice/text brief
   │
   ▼
 file 16 §1  six-question intake  ──►  pick slideType
   │
   ▼
 file 06       per-type template   ──►  fill content fields
   │
   ▼
 file 15 §4   variety guard        ──►  pick transition + textAnimation
   │
   ▼
 emit 3 artifacts atomically:
   spec/slides/{deck}/NN-name.json    ◄── runtime source of truth
   spec/slides/{deck}/NN-name.md      ◄── design intent
   spec/slides/{deck}/deck.json       ◄── append filename
   │
   ▼
 file 18  run 40-box checklist  ──►  ship if 40/40
```

---

## G2 — Adding a brand-new `slideType` (5-step recipe)

When intent doesn't match any existing type (file 16 §2), don't force
a hybrid. Add a new type. Five steps, each one commit:

### Step 1 — Add the enum

```ts
// src/slides/enums.ts
export enum SlideType {
  // …existing…
  MyNewSlide = "MyNewSlide",
}
```

### Step 2 — Add the type definition

```ts
// src/slides/types.ts (or types/MyNewSlide.ts if rich)
export interface MyNewSlideContent {
  title: string;
  // domain-specific fields
}
```

### Step 3 — Add the React renderer

```tsx
// src/slides/types/MyNewSlide.tsx
import type { SlideSpec } from "@/slides/types";

export function MyNewSlide({ slide }: { slide: SlideSpec }) {
  return (
    <section className="relative h-full w-full">
      <h1 className="font-display text-foreground">
        {slide.content.title}
      </h1>
      {/* render the rest from slide.content */}
    </section>
  );
}
```

Rules: tokens only (no hex), `.font-display` for titles, opacity +
transform animations only.

### Step 4 — Register in `SlidePreview.tsx`

```tsx
case SlideType.MyNewSlide:
  return <MyNewSlide slide={slide} />;
```

### Step 5 — Document + author

1. Add a row to file 06's per-type template table with the JSON
   shape.
2. Add a row to file 15 §1's decision tree mapping intent → type.
3. Add a row to INDEX.md if the type ships with a reference image.
4. Author at least one slide instance under `spec/slides/{deck}/` so
   the type is exercised end-to-end.
5. Bump `package.json` minor (new capability).

---

## G3 — Per-type required-fields table (machine-checkable summary)

As of v0.82.1, `slide.schema.json` enforces these per-type
constraints via an `allOf` block of `if/then` discriminator branches
keyed on `slideType`. Run `python3 -c "from jsonschema import
Draft7Validator, json; …"` (or any Draft-7 validator) and a missing
required field fails fast with a clear path. The table below is the
human-readable mirror of that schema enforcement.

| `slideType` | Required content fields | Optional content fields |
|---|---|---|
| `TitleSlide` | `title` | `eyebrow`, `subtitle`, `presenter`, `wordmark`, `icons[]` |
| `MiddleTitleSlide` | `title` | `subtitle`, `chapter` |
| `SectionDividerSlide` | `title` | `index`, `subtitle` |
| `KeywordSlide` | `title`, `keywords[]` (minItems 3) | `eyebrow`, `subtitle` |
| `CapsuleListSlide` | `title`, `capsules[]` (minItems 3) | `eyebrow`, `subtitle` |
| `StepTimelineSlide` | `title`, `steps[]` (3–6) | `subtitle`, `step.capsule`, `step.cta` |
| `FocusTimelineSlide` | `title`, `steps[]` | `eyebrow`, `subtitle` |
| `AdvanceStepSlide` | `title`, `steps[]` | `eyebrow`, `subtitle` |
| `QrMeetingSlide` | one of `meetingUrl` / `qrUrl` / `qrAsset` | `meetingLabel`, `contactRows`, `cta`, `socials` |
| `ImageSlide` | `image` | `caption`, `eyebrow`, `title` |

Common envelope (all types) per `15-authoring-template.md` §1:
`slideType`, `transition`, `textAnimation`, `showBrandHeader`,
`showPresenterChip`, `isClickReveal`, `slideNumber`, `slideName`,
`content`. Strict validation happens at load via the
`allOf`-discriminator block in `spec/slides/slide.schema.json`.

---

## G4 — Variety collision matrix

When picking a `transition + textAnimation` pair for slide N, this
matrix tells you which pairs are blocked by neighbors N-1 and N+1.

### Allowed pairs (10 of 20 combos — others reserved)

| # | transition | textAnimation | Use |
|---|---|---|---|
| 1 | `FadeIn` | `FadeIn` | Quiet hand-off, image slides |
| 2 | `FadeIn` | `SlideUp` | Title → content transition |
| 3 | `FadeIn` | `Stagger` | Capsule lists, keywords |
| 4 | `SlideIn` | `FadeIn` | Content slide, restful body |
| 5 | `SlideIn` | `SlideUp` | **Default content slide** |
| 6 | `SlideIn` | `Stagger` | Step rows, sequential reveal |
| 7 | `PushIn` | `FadeIn` | Section divider, single beat |
| 8 | `PushIn` | `Bounce` | Slide 1 hero only |
| 9 | `PushLeft` | `SlideUp` | Narrative leftward push |
| 10 | `PushRight` | `Stagger` | Narrative rightward reveal |

### Collision rule

A pair **collides** with a neighbor if **either** the `transition` OR
the `textAnimation` matches. Example: if N-1 is pair #5 (`SlideIn` +
`SlideUp`), then for slide N you must not pick pair #4, #5, #6
(SlideIn collision) **and** not #2, #5, #9 (SlideUp collision).
Remaining: #1, #3, #7, #8, #10.

### Quick lookup (most common neighbors)

| Neighbor pair | Safe choices for N |
|---|---|
| #5 (default content) | #1, #3, #7, #8, #10 |
| #1 (quiet) | #5, #6, #8, #9, #10 |
| #3 (stagger lists) | #2, #4, #5, #7, #8, #9 |
| #6 (step rows) | #1, #2, #3, #7, #8, #10 |
| #7 (divider) | #2, #3, #4, #5, #6, #9, #10 |

If both neighbors block every pair (rare in 3-slide decks), prefer
the pair whose `transition` differs from N-1 (the more recent
neighbor).

---

## Acceptance + changelog

- G1 closed via 4 ASCII reference cards (canvas, ambient, type
  ladder, JSON flow). PNG renders still welcome but no longer
  blocking.
- G2 closed via the 5-step new-`slideType` recipe with code skeletons.
- G3 closed via per-type required-fields table.
- G4 closed via 10-pair allowlist + collision rule + quick-lookup.
- 2026-04-26 (v0.81.1): Phase 17 — Audit 02 gap remediation pack.
