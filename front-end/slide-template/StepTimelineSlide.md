# StepTimelineSlide — authoring guide

**Purpose**: Cinematic numbered step chain. One step is in limelight at any moment; neighbors dim. Advances on Next/Prev (presenter-paced).

**Template**: [`StepTimelineSlide.json`](./StepTimelineSlide.json)

---

## When to use

- Process / methodology slides ("how we work", "delivery flow").
- Any 3–6 step sequence where the audience needs to dwell on one step at a time.
- For a non-cinematic, all-steps-visible variant use **FocusTimelineSlide**.

## Required content fields

| Field    | Type        | Notes                                  |
|----------|-------------|----------------------------------------|
| `title`  | `string`    | One short headline.                    |
| `steps`  | `Step[]`    | 3–6 entries. Each `{ label, body, … }`. |

## Per-step fields

| Field           | Type      | Notes |
|-----------------|-----------|-------|
| `label`         | `string`  | Short noun (e.g. "Discover").  |
| `body`          | `string`  | One sentence. Keywords > paragraphs. |
| `topOffsetPx`   | `number`  | Vertical nudge (-160..160). v0.114. |
| `enter` / `exit`| object    | `{durationMs, delayMs, easing}`. v0.114. |
| `cta`           | object    | `{text, href?, revealSlide?, variant?}`. v0.114. |

## Stage-level knobs

- `content.stepTiming` — preset name OR `{preset?, enter?, exit?}`.
- `content.stepAmbient` — JSON-authored ambient icon block (mirrors `titleAmbient`).
- `content.transitionTiming` — `{durationMs?, delayMs?, easing?}`.

## Sound

Default focus-arrival cue is a gentle `whoosh` (volume 0.5). Override via `slide.sound.focusArrival`.

## Related specs

- [`spec/slides/23-step-timeline-v3.md`](../../spec/slides/23-step-timeline-v3.md) — v3 motion + ambient layer.
- [`spec/slides/27-step-timeline-v3.2.md`](../../spec/slides/27-step-timeline-v3.2.md) — v3.2 polish.
- [`spec/slides/49-step-top-offset-and-timing.md`](../../spec/slides/49-step-top-offset-and-timing.md) — per-step timing knobs.
- [`mem://features/step-timeline-v3`](../../.lovable/memory/features/step-timeline-v3.md).
