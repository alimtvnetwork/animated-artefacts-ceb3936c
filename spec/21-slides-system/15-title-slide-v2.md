# 15 — Title Slide v2 (Radial Glow + Scattered Icons)

Premium hero treatment for `TitleSlide`. Replaces the plain centered-text
version. All values calibrated for the 1920×1080 stage.

## Layers (back → front)

1. **Base** — `bg-background` (`#0F1115` in the noir-gold theme).
2. **Radial glow** — absolute, full-bleed:
   ```
   background: radial-gradient(
     ellipse 60% 45% at 50% 55%,
     hsl(28 75% 11% / 0.95) 0%,
     hsl(28 75% 11% / 0.55) 25%,
     transparent 60%
   );
   ```
   Sits above base, below icons. `pointer-events: none`.
3. **Scattered icons** — absolute, full-bleed, `pointer-events: none`,
   `opacity: 0.05`. ~10–14 line-art SVG icons (1px stroke, no fill,
   `currentColor: white`) randomly placed but **deterministic** (seeded
   so re-renders don't reshuffle). Sizes vary `28px–48px`. Icons:
   `FileText`, `Video`, `MessageSquare`, `Clipboard`, `UserCheck`, `Book`,
   `GitBranch`, `Users` from `lucide-react` — all already in the project.
4. **Content** — the existing centered title/subtitle/capsules block,
   unchanged in structure but with these tweaks:
   - Title color: `--gold` (always, regardless of preset auto-pick).
   - Subtitle color: `--foreground/65` (lighter than the default `/70`
     because of the warm glow underneath).
   - No eyebrow by default (the glow + icons carry the visual weight).

## JSON shape

`TitleSlide` keeps its existing field schema. The radial-glow + icon
layers are baked into the component — there is no new JSON field. If a
future deck wants the plain version back, that's a new slide type
(`PlainTitleSlide`) rather than a flag here.

## Animation

- Glow: fades in `opacity 0 → 1` over `0.8s ease-out` after the title
  starts animating in.
- Icons: each fades in `opacity 0 → 0.05` over `1.2s` with a `60ms` per-icon
  stagger, easeOut. Subtle enough that the audience perceives "depth" not
  "icons appearing".
- Title/subtitle: existing `bounce` / `fadeIn` text animation presets apply.

Reduced-motion: glow + icons appear at final opacity instantly.

## Accessibility

- Icon layer has `aria-hidden="true"`.
- Title is the page's `<h1>` (or `<motion.h1>`).
- Color contrast: `#FCA311` gold on `#0F1115` base = ~10.4:1 — well above WCAG AAA.

## Reference

User-supplied screenshot: "Meet the Team / The People Behind the Results"
on a deep slate background with a centered amber glow and scattered faint
line-art icons. Match that vibe exactly.
