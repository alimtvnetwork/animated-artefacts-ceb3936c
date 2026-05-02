---
name: title-slide-v2
description: TitleSlide hero treatment — radial amber glow + scattered faint line-art icons (lucide). Title always gold, subtitle muted. Built on 1920×1080 stage.
type: design
---

## Layers

1. `bg-background` (`#0F1115`).
2. Radial glow `radial-gradient(ellipse 60% 45% at 50% 55%, hsl(28 75% 11% / 0.95) 0%, hsl(28 75% 11% / 0.55) 25%, transparent 60%)`.
3. ~12 scattered lucide icons at `opacity: 0.05`, deterministic seeded layout, `pointer-events: none`, `aria-hidden`.
4. Centered title (gold) + subtitle (`foreground/65`) + optional capsules.

## Animation

Glow: 0→1 fade over 0.8s. Icons: stagger fade to 0.05 with 60ms per-icon delay. Both respect prefers-reduced-motion.

## Why

Plain centered text felt thin for a hero slide. The glow creates depth
without competing for attention; the icons read as "subject matter"
texture (chat, video, docs, people — what the deck is about).
