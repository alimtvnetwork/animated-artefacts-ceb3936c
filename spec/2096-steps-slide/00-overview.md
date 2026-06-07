# 00 — Overview

## The shared mental model

Every step slide renders an **ordered array of items**. The rendering job is the
same across the whole family:

1. Show a **header block** — eyebrow (small uppercase) + title + optional kicker.
2. Show the **ordered items**, each with a two-digit index, a title, optional
   subtitle, and an optional **capsule** on the trailing edge.
3. Optionally **highlight one active item** and dim the rest, so a presenter can
   "park" on the current step.

Index labels are always 1-based, zero-padded: `String(i + 1).padStart(2, '0')`.

## Why a shared data model matters

Because the data model is shared, an author can change a slide's *feel* by
changing only `slideType` (and a couple of layout knobs) without rewriting
content. A blind AI must therefore **never** invent per-slide content fields
that only one variant understands. New fields go through `02-data-model.md`.

## The two step types (full detail in `01-two-step-types.md`)

- **Type A — Static outline** (`SessionOutlineSlide`): every item visible at
  once, hairline separators, a glowing vertical rule in the index gutter. No
  internal advance — the whole list is the slide. Reads `content.items[]`.
- **Type B — Interactive focus** (`StepTimelineSlide`, `FocusTimelineSlide`,
  `AdvanceStepSlide`): the items become a presenter-advanced sequence. Exactly
  one **active** step at a time; neighbors dim; the active step grows and turns
  pure white; a right-side detail panel cinematically swaps. Reads
  `content.steps[]`.

## Non-negotiable house rules (the "why")

| Rule | Why it exists |
|------|---------------|
| Keywords-only, ≤ ~6 words per title | Projected slides must read in 1 second; the presenter speaks the detail. |
| `.capsule-{tone}` classes only — never inline brand-token styles | Brand tokens (`--gold`, `--cream`, `--white`, …) are *repurposed* on light themes; inline styles silently become invisible. |
| `.capsule-meta` for time/duration | Uses Radix `--muted` tokens that auto-flip per theme. |
| Semantic type classes, no inline `text-shadow` | The 45° weight-shadow bevel is applied centrally; inline shadows double up. |
| Insets from `--brand-inset-x/-y` | Keeps gutter, title, rail, and right-edge chip on a shared axis with the brand logo. |
| `transform: scale()` on rows is forbidden | It blurs glyphs; depth comes from font-size + opacity (see `04-css-tricks.md`). |
| Reduced-motion fallback required | Accessibility + projector judder; never ship motion without the opacity-only path. |
| JSON is the runtime source of truth | The component renders only what `spec.content` provides; no hardcoded copy. |

## Where the pieces live

- Slide components: `src/slides/types/<Name>Slide.tsx`
- Slide type enum: `src/slides/enums.ts`
- Content typing: `src/slides/types.ts`
- State owner hook: `src/slides/hooks/useFocusTimeline.ts`
- Capsule component: `src/slides/components/Capsule.tsx`
- Tokens: `src/index.css`

A blind AI implements a new member by copying `SessionOutlineSlide.tsx` (Type A)
or `StepTimelineSlide.tsx` (Type B), then changing **only** the items-layout JSX
and the motion — never the data contract.
