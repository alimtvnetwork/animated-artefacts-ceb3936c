---
name: middle-title-slide
description: MiddleTitleSlide — section-break / interlude slide. Dark slate base, tight warm amber spotlight at 50/50, productivity ambient icons, gold title + gray subtitle only. NO capsules / steps / hotspots — purely a "pause and seed the next idea" moment between deck chapters.
type: feature
---

## Spec
`spec/slides/26-middle-title-slide.md`.

## Component
`src/slides/types/MiddleTitleSlide.tsx`. Registered as
`SlideType.MiddleTitleSlide`. Dispatched from `SlideStage.SlideBody`.

## Layers (back → front)
1. `bg-background` (inherited from SlideStage).
2. Radial spotlight — `radial-gradient(ellipse 50% 38% at 50% 50%, hsl(var(--gold)/0.18) 0%, hsl(28 75% 11%/0.55) 35%, transparent 65%)`. Tighter and warmer than the hero TitleSlide glow; centered DEAD-center, not 55%.
3. `<AmbientBackground>` with productivity icon set, `count: 12`, `opacity: 0.05`, `drift: 0.35`, `parallax: 14`, `safeZone: {x:36, y:36}`.
4. Centered eyebrow (optional) + gold title + gray subtitle (optional).

## Tokens (no raw hex allowed)
- Title: `hsl(var(--gold))`, weight 700, `clamp(3rem, 6vw, 5rem)`.
- Subtitle: `hsl(var(--foreground)/0.75)`, weight 400, `clamp(1rem, 1.4vw, 1.5rem)`.
- Spotlight uses `--gold` HSL channels so it retunes on theme swap.

## Motion (all expo-out [0.19, 1, 0.22, 1])
- Spotlight: opacity 0→1, 1.0s easeOut.
- Icons: handled by AmbientBackground (1.2s + per-icon stagger).
- Eyebrow: opacity + y(-12→0), 0.6s, delay 0.15s.
- Title: opacity + y(20→0), 0.85s, delay 0.30s.
- Subtitle: opacity + y(12→0), 0.7s, delay 0.55s.
- Reduced-motion: opacity-only fades, 0.4s each.

## Authoring rules
- Only `eyebrow`, `title`, `subtitle` are rendered. Capsules / steps / keywords / images are silently ignored.
- Default `showBrandHeader: true`, `showPresenterChip: false`, `brandStrip: false`.
- Use this between chapters. Do NOT use it as the deck opener (that's `TitleSlide`) and do NOT use it as a closer (that's `QrMeetingSlide`).
