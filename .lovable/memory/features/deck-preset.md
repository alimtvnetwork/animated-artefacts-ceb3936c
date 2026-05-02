---
name: deck-preset
description: Reusable `preset: "premium"` deck-level opt-in — locks Ubuntu Bold + clamp sizing + auto-picked white/cream/gold for every slide
type: feature
---

## What

Deck-level reusable preset. Authors opt in via `deck.preset: "premium"` in
`deck.json`. Every slide that doesn't override gets:

- **Ubuntu Bold** titles, -0.02em tracking, leading 0.95.
- **Clamp-based sizing** — one global scale (no per-breakpoint className ladders).
- **Author-written casing** — NO CSS text-transform (preserves "MD", "LLC", proper nouns).
- **Auto-picked title color**:
  - TitleSlide / SectionDividerSlide → `white` (hero)
  - `titleShimmer: true` → `gold` (brand emphasis)
  - everything else → `cream`
- **Subtitles** always `text-foreground/70`.

## Files

- `src/slides/preset.ts` — `resolveTitleStyle()`, `titleColorClass()`, `titleClassFor()`.
- `src/index.css` — the four reusable utility classes:
  - `.slide-title-display` (hero) — `clamp(2.5rem, 6vw, 6rem)`
  - `.slide-title-content` (body) — `clamp(2rem, 4.2vw, 3.75rem)`
  - `.slide-eyebrow` — fixed `0.75rem`, gold, `0.35em` tracking
  - `.slide-subtitle` — `clamp(1rem, 1.6vw, 1.5rem)`, `--foreground/70`
- `spec/slides/10-deck-preset.md` — full spec.
- `spec/slides/deck.schema.json` — `preset` enum (`["premium"]`).

## Slide composition pattern

```tsx
<span className="slide-eyebrow">{c.eyebrow}</span>
<h2 className={`slide-title-display ${titleClassFor(spec)}`}>{c.title}</h2>
<p className="slide-subtitle">{c.subtitle}</p>
```

`titleClassFor` returns the resolved color class + shimmer wrapper if
`titleShimmer` is true.

## Override precedence

1. Per-slide `titleStyle` (always wins)
2. Preset auto-pick — `premium` is the **implicit default** (`deck.preset ?? 'premium'`), so this branch runs for every deck unless a future preset is added.
3. Cream fallback (only reached if a future preset name is added that doesn't auto-pick)

## Manifest round-trip

`preset` is part of `DeckSpec` and exports/imports automatically via
`buildManifest` (no special handling needed).

## Migration done

- All title-bearing slides (`TitleSlide`, `CapsuleListSlide`, `KeywordSlide`,
  `StepTimelineSlide`, `QrMeetingSlide`) refactored to use the preset
  utilities. Per-slide `titleClassFor` ternaries removed.
- `spec/slides/showcase/deck.json` opted in (`"preset": "premium"`).

## Rule

NEVER write `font-display text-5xl md:text-6xl ...` inside a slide
component again. If a new size is needed, add a new `.slide-title-*` token
to `index.css` so it's reusable.
