# CapsuleListSlide — authoring guide

**Purpose**: Title + a wrapped row of colored capsule chips. Each capsule can be a static label, a click-reveal trigger, an in-place expand card, or carry a `hoverText` flip.

**Template**: [`CapsuleListSlide.json`](./CapsuleListSlide.json)

---

## When to use

- "What we do" / capabilities lists.
- Any slide where 3–10 short labels read better as visual chips than as bullets.
- Use **MetricGridSlide** instead when each item has a number/value.

## Required content fields

| Field      | Type            | Notes                                  |
|------------|-----------------|----------------------------------------|
| `title`    | `string`        | One short headline above the row.      |
| `capsules` | `CapsuleSpec[]` | 3–10 entries. Fewer reads as keywords. |

## Capsule colors

`gold` (primary), `cream`, `white`, `outline`, `ember`. Vary across the row — never make every capsule the same color.

## Optional layout knobs (v0.114+)

```json
"capsuleLayout": {
  "columns": 3,
  "gapPx": 16,
  "align": "center"
}
```

When `columns` is set, the row uses CSS grid for full reproducibility. Omit for legacy `flex-wrap`. See [`mem://features/layout-knobs`](../../.lovable/memory/features/layout-knobs.md).

## Interactive capsules (v0.79+)

- `hoverText`: vertical-flip label reveal on hover.
- `expand`: inline expanding-card with rich content; siblings dim.
- `clickRevealSlide`: jump to a click-reveal slide on click.

See [`spec/slides/22-interactive-capsules.md`](../../spec/slides/22-interactive-capsules.md).

## Sound

Default press cue is `fadeClick` + a soft `whoosh` — already wired in the renderer. Override via `slide.sound`.

## Related specs

- [`spec/slides/00-fundamentals.md`](../../spec/slides/00-fundamentals.md) — per-slide JSON contract.
- [`spec/slides/llm/12-steps-pattern.md`](../../spec/slides/llm/12-steps-pattern.md) — when to escalate from capsules to a step timeline.
