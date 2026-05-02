# 02 — Capabilities

- **Type:** CapsuleListSlide
- **Transition:** PushLeft
- **Text animation:** Stagger
- **Click-reveal:** "Strategy" capsule → opens slide 4 (Strategy detail) on click.
- **Visual:** Grid of multi-color capsules with hover-lift; presenter clicks any to expand.

## Typography rules

- `titleStyle: "white"` — the title is set in pure white (`hsl(var(--white))`) for max contrast against the noir background. Cream is reserved for warmer slides.
- `titleShimmer: true` — one-shot gold shimmer sweep on entry.
- Title font: **Ubuntu Bold**, fluid sized via `clamp(2.5rem, 9vw, 6rem)` so it never clips on small viewports.
- Eyebrow ("What We Do"): **Ubuntu Bold**, Title Case, `text-base md:text-lg`, `tracking-[0.3em]`, gold. Bigger and heavier than the previous tracking-only label so the slide reads as a real section header.
