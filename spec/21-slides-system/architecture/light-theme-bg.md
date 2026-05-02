# Light theme background — never pure white

## Rule

When a light theme (`github-light`, `macos-sonoma`, any future light variant)
ships, **the page surface MUST carry a faint cool tint plus a soft radial
wash — never a flat `#ffffff` sheet.**

For `github-light`, the canonical recipe is:

```css
[data-theme='github-light'] body {
  background:
    radial-gradient(ellipse 90% 60% at 50% 0%,   hsl(212 60% 94%), transparent 70%),
    radial-gradient(ellipse 70% 50% at 50% 100%, hsl(210 50% 95%), transparent 70%),
    hsl(212 40% 97%);   /* base — equivalent to #f1f5fa */
}
```

This sits **on `body`**, behind every `<SlideStage>`, so every slide type
inherits the wash without having to opt in. The slide surface itself stays
`hsl(var(--background))` (which is the same `212 40% 97%` base), so when a
slide uses no explicit color it blends seamlessly into the wash.

## Why this matters

1. **Brand consistency.** The contact card (`spec/slides/19-contact-card-v2.md`)
   ships with two warm radial glows so it never reads as a flat panel. The
   homepage and every other slide should follow the same physics — designer-
   grade decks don't ship raw `#ffffff` backgrounds.
2. **Visual depth.** A flat sheet collapses chrome (controller pill, dot
   pagination, grid-overview button) to dark-on-paper with zero atmosphere.
   The radial wash gives the surface dimension and lets translucent chrome
   sit on something other than a paper-white plane.
3. **Eye fatigue.** Pure `#fff` against a dark room (which is where decks
   are typically presented) bleaches the eye. A 3% cool tint reads
   identically as "white" but kills the glare.

## What broke before

- `themes.ts` shipped `--background: 0 0% 100%` for `github-light`. Slide
  surfaces inherited the flat sheet and the contact-page wash looked like
  the only "designed" slide in the deck.
- `MetricGridSlide` hardcoded `bg-ink` so the metric slide looked dark even
  in light themes — making the chrome (which expects to sit on the page bg)
  invisible. **Slide types must never hardcode a background color**; they
  inherit `hsl(var(--background))` so the theme controls the surface.
- `BrandedQR` re-used a single offscreen canvas via `useRef`, leaving stale
  pixel buffers under PNG-alpha exports. In `github-light` the QR's "white"
  modules read as dark gray. Fix: fresh canvas per render + explicit
  `fillRect('#fff')` base before drawing the QR image.

## How to never regress

- **Never** ship `--background: 0 0% 100%` (or `#ffffff` / `bg-white`) for a
  new light theme. Add at least a 2–4% blue tint and a paired radial wash
  on `body`. Run `bun ./scripts/contrast-audit.ts` to verify text still
  passes WCAG AA after the tint.
- **Never** hardcode `bg-ink` / `bg-white` / any literal color on a slide
  type's root container. Use `hsl(var(--background))` so the theme owns the
  surface.
- For QR / image overlays that rely on alpha, **always** seed the canvas
  with an explicit `fillRect` of the intended base color before compositing.
  PNG alpha is reliable; canvas reuse via `useRef` is not.

## Companion files

- Theme tokens: `src/slides/themes.ts` (`'github-light'` block)
- Wash recipe: `src/index.css` (`[data-theme='github-light'] body`)
- Memory: `mem://design/light-theme-bg`
