# FocusTimelineSlide — authoring guide

**Purpose**: Carousel-of-one timeline. One step in the limelight (full colour, with description); neighbours dim and shrink. Presenter-paced — Next/Prev walks the chain, not autoplay.

**Template**: [`FocusTimelineSlide.json`](./FocusTimelineSlide.json)

---

## When to use

- A 3–7 step process you want to walk through *one beat at a time*, with the audience focused on a single step at any moment.
- Choose this over **StepTimelineSlide** when you don't want all steps visible at once and you want the deck Next/Prev to drive the chain.
- Choose **AdvanceStepSlide** instead for a cinematic camera-zoom step-chain (full-viewport per step).

## Required content fields

| Field   | Type      | Notes                                                                                  |
|---------|-----------|----------------------------------------------------------------------------------------|
| `title` | `string`  | One-line headline.                                                                     |
| `steps` | `Step[]`  | 3–7 entries. Each MUST set `label`, `title`, `description` (1–2 sentence narration).   |

## Recommended content fields

| Field        | Type     | Notes |
|--------------|----------|-------|
| `eyebrow`    | `string` | Wide-tracking line above the title. |
| `direction`  | `string` | `'horizontal'` (default) or `'vertical'`. |
| `windowSize` | `number` | `3` (default) or `5` — how many steps are visible at once. |

## Navigation contract

- The slide owns Next/Prev via `tryAdvance(dir)` — the deck only navigates to a sibling slide when the chain hits its edge.
- Same handle as `StepTimelineSlide` / `AdvanceStepSlide`.

## Animation

- `transition`: `FadeIn` (default). The slide-internal step transitions do most of the work.
- `textAnimation`: `FadeIn` keeps the focus swap calm.

## House rules

- Every step MUST have a `description`. Without it, the focused detail panel reads as empty.
- Keep descriptions to 1–2 sentences — narration tone, not paragraphs.

## Related specs

- [`spec/slides/11-focus-timeline.md`](../../spec/slides/11-focus-timeline.md) — canonical contract.
- [`mem://features/focus-timeline-effect`](../../.lovable/memory/features/focus-timeline-effect.md).
