# 05 — Impact Metrics

## Intent

Hard-evidence interlude after the strategy-detail walkthrough and
before the contact card. Audience has just heard *how* we work; this
slide answers *what does that produce*. Four headline numbers, no
prose, presenter narrates each one.

## Layout

`MetricGridSlide` 2×2 grid (auto-derived from 4 metrics):

- 3.4M — users reached, gold (primary brand accent)
- 99.9% — uptime, teal (calm "trust" accent)
- <10ms — P95 latency, sky (technical "fast" accent)
- $4.2M — ARR added, ember (commercial "warm" accent)

Each cell renders the value at `clamp(4rem, 9vw, 9rem)` in its accent
color, with a cream label and a `text-foreground/65` caption. Brand
header stays on so the audience can still see slide N/total.

## Motion

- Slide envelope: `PushIn` transition (entrance has weight to match
  the heaviness of the numbers).
- Text: `Stagger` text-animation pairs with the per-metric stagger
  inside the component (`delay: 0.18 + i * 0.08`) so the four numbers
  drop in sequence rather than all at once.
- Reduced-motion: every metric collapses to a 150 ms opacity crossfade.

## Variety guard

Neighbors:

- Slide 4 (`strategy-detail`) — `transition: SlideIn`, `textAnimation: SlideUp`.
- Slide 6 (`contact`) — `transition: FadeIn`, `textAnimation: FadeIn`.

`PushIn` + `Stagger` differs from both neighbors on both axes ✓.

## Why a new slide type

`KeywordSlide` and `CapsuleListSlide` both stack horizontally and treat
each item as a peer label, but a metric needs three rungs of typographic
hierarchy in one cell (huge value → label → caption) and the value
itself is too long for a capsule. `MetricGridSlide` is the smallest
addition that expresses this hierarchy cleanly without overloading the
existing types.

## Acceptance

- [x] Renders at `/5` (linear flow).
- [x] Renders in `/builder` thumbnail.
- [x] Renders in the `G` grid overview.
- [x] Passes the runtime contract (`assertValidSlides`).
- [x] Passes `spec/slides/slide.schema.json` Ajv validation under the
      `MetricGridSlide` discriminator branch.
- [x] No raw hex; every accent goes through `hsl(var(--token))` or a
      semantic Tailwind class.
- [x] Title styling routes through `titleClassFor(spec)` so
      `titleStyle: "white"` actually applies.
