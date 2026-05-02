---
name: light-theme-bg
description: Light themes (github-light, macos-sonoma) MUST carry a soft cool tint + radial wash on body — never flat #ffffff. Slide types must never hardcode bg colors. Spec: spec/architecture/light-theme-bg.md
type: design
---

## Rule

Any light theme must paint the page with a faint cool tint plus a soft
radial blue wash, mirroring the contact-card treatment. Pure `#ffffff`
panels are forbidden — they collapse chrome contrast, kill atmosphere, and
break visual parity with the contact slide.

Canonical github-light recipe (lives in `src/index.css`, applied to `body`):

```css
[data-theme='github-light'] body {
  background:
    radial-gradient(ellipse 90% 60% at 50% 0%,   hsl(212 60% 94%), transparent 70%),
    radial-gradient(ellipse 70% 50% at 50% 100%, hsl(210 50% 95%), transparent 70%),
    hsl(212 40% 97%);
}
```

The token `--background` for github-light is set to `212 40% 97%`
(matching the wash base), so `bg-background` slides blend seamlessly.

## Forbidden

- `--background: 0 0% 100%` for any light theme.
- Hardcoded `bg-ink`, `bg-white`, `bg-black`, or any literal color on a
  slide type's root container — it must use `hsl(var(--background))` so the
  theme owns the surface.
- Re-using a `useRef` canvas across renders for QR / overlay generation —
  stale pixel buffers leak through PNG alpha. Always create a fresh canvas
  and seed with explicit `fillRect` of the intended base color.

## Why

Decks are presented in dark rooms; pure white bleaches the eye and makes
chrome read as dark-on-paper with zero depth. The 3% cool tint reads as
"white" but adds atmosphere and visual parity with the contact card.

## Past breakage

- v before this rule: github-light shipped `#ffffff`. MetricGridSlide
  hardcoded `bg-ink` so it rendered dark in light theme. BrandedQR reused
  a ref'd canvas so the QR's "white" modules came out dark gray on light
  themes.

## See also

- `spec/architecture/light-theme-bg.md` — full rationale + recipe
- `src/slides/themes.ts` — `github-light` token block
- `src/slides/types/MetricGridSlide.tsx` — example of a slide with no
  hardcoded bg, inheriting `hsl(var(--background))`
