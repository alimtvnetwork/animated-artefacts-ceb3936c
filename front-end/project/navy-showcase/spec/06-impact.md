# 06 — Impact Metrics

**Type**: `MetricGridSlide`

## Purpose
Four-cell metric grid (auto 2x2 layout from `metrics.length === 4`) plus a **hotspot
click-reveal** on the ARR cell — the third reveal pattern in this deck:

| Pattern             | Slide → Target | Authored on |
|---------------------|----------------|-------------|
| Capsule revealSlide | /2 → /50       | `capsules[0].revealSlide` |
| Step revealSlide    | /3 → /50       | `steps[1].revealSlide` |
| Hotspot revealSlide | /6 → /60       | `hotspots[0].revealSlide` |

All three flow through the same v0.117 click-reveal contract owned by SlideStage.

## Animation contract
- `transition: PushIn` — depth pop matches the data-platform slide.
- `textAnimation: Stagger` — metric cells fade in 1-by-1 left-to-right, top-to-bottom.
- `accent: ember` on the ARR cell pulls the orange secondary accent — visually
  rhymes with the FK rows on slide 5, so the eye knows where to go.

## Speaker notes
Lead with users-reached. Uptime + latency are the trust proof. Close on ARR;
cue the click — slide 60 splits the $4.2M into engagement tiers.
