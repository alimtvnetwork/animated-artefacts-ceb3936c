# MetricGridSlide — authoring guide

**Purpose**: Compact grid of headline metrics — big number + label + optional caption per cell. Use for proof-of-impact slides ("3M users · 99.9% uptime · $4.2M ARR").

**Template**: [`MetricGridSlide.json`](./MetricGridSlide.json)

---

## When to use

- A handful of standalone numbers that each carry weight.
- Proof / traction / impact slides where the number IS the slide.
- For trends-over-time use a chart slide instead (not a MetricGridSlide).

## Required content fields

| Field     | Type        | Notes                                                                       |
|-----------|-------------|-----------------------------------------------------------------------------|
| `metrics` | `Metric[]`  | 2–6 entries. Each `{ value: string, label: string, caption?, accent? }`.    |

`value` is a free-form string — include the unit/prefix/suffix yourself: `"3M"`, `"$4.2M"`, `"99.9%"`, `"<10ms"`.

## Recommended content fields

| Field      | Type     | Notes |
|------------|----------|-------|
| `eyebrow`  | `string` | Wide-tracking line above the grid (e.g. `"By the numbers"`). |
| `title`    | `string` | One-line section headline. |
| `subtitle` | `string` | One-line context line. |

## Layout

- 2 cells → 1×2, 3 → 1×3, 4 → 2×2, 5 → 2×3 (one empty), 6 → 2×3.
- Override with `content.metricLayout = { columns, rows, gapXPx, gapYPx, valueSize }` when the auto grid doesn't fit.

## Animation

- `transition`: `PushIn` (default) — the cells land with momentum.
- `textAnimation`: `Stagger` (default) — cells reveal one after another.

## House rules

- Each `value` MUST be display-ready (with units). Don't ask the renderer to format numbers — the spec is the source of truth.
- Captions are optional — leave blank rather than padding with filler.
- Pick `accent` deliberately. Mixing `gold` / `ember` / `cream` reads as a deck-wide story; randomising looks accidental.

## Related specs

- [`spec/slides/llm/22b-metric-grid-worked-example.md`](../../spec/slides/llm/22b-metric-grid-worked-example.md) — full worked example.
- [`spec/slides/llm/22-add-new-slide-type.md`](../../spec/slides/llm/22-add-new-slide-type.md) — pattern for adding new slide types.
