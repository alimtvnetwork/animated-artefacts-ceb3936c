# AdvanceStepSlide — authoring guide

**Purpose**: Cinematic camera-zoom step chain. A vertical reel of full-viewport step frames; Next/Prev dollies the camera between them. The most dramatic of the step-chain slide types.

**Template**: [`AdvanceStepSlide.json`](./AdvanceStepSlide.json)

---

## When to use

- You want each step to feel like its own slide moment, but as a single navigable chain.
- Hero-tier process slides where every step deserves the full viewport.
- For a calmer side-by-side timeline, use **StepTimelineSlide** or **FocusTimelineSlide** instead.

## Required content fields

| Field   | Type     | Notes                                                                |
|---------|----------|----------------------------------------------------------------------|
| `title` | `string` | One-line headline (rendered above the step viewport).                |
| `steps` | `Step[]` | 3–6 entries. Each needs `label`, `title`, `description` (1 sentence).|

## Recommended content fields

| Field     | Type     | Notes |
|-----------|----------|-------|
| `eyebrow` | `string` | Wide-tracking line above the title. |

## Navigation contract

- Owns Next/Prev via `tryAdvance(dir)` — same handle as `StepTimelineSlide` / `FocusTimelineSlide`. Deck advances to a sibling slide only at the chain edges.
- Default `sound.on = "focus"` — the whoosh fires on every step landing.

## Animation

- `transition`: `FadeIn` (default). The cinematic camera zoom owns the visual change between steps.
- `textAnimation`: `FadeIn` keeps the within-step text calm.

## House rules

- Keep step descriptions short (≤ 1 sentence). The viewport is large; long copy reads as a wall of text.
- Capsules per step are optional — use only when a single label genuinely adds meaning.

## Related specs

- [`spec/slides/18-advance-step-cinematic.md`](../../spec/slides/18-advance-step-cinematic.md) — canonical contract.
- [`spec/slides/20-advance-step-v2.md`](../../spec/slides/20-advance-step-v2.md) — v2 polish.
- [`mem://features/advance-step`](../../.lovable/memory/features/advance-step.md).
