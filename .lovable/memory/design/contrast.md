---
name: contrast
description: Title slide titles are WHITE on noir, never gold. Subtitles are warm cream (~85%). Gold is reserved for eyebrows, accents, and capsules — never the hero title. Apply via titleClassFor(spec) — never hard-code text-gold.
type: design
---

## Rule

Hero titles (`TitleSlide`, `SectionDividerSlide`) are **white** for
maximum contrast on the noir background. Subtitles are **warm cream**
(`hsl(var(--cream) / 0.85)`) — soft companion that doesn't compete with
the white title but stays readable.

**Gold is reserved for**: eyebrows, capsules, accent rules, brand
elements, and content-slide titles that explicitly opt in via
`titleStyle: "gold"` or `titleShimmer: true`. Never the hero title.

## Why

A gold title on noir reads as decorative, not declarative. The deck's
"premium" preset already auto-picks `white` for hero slide types — any
component that hard-codes `text-gold` on the title element BREAKS this
contract.

## How to apply

Always go through `titleClassFor(spec)` from `src/slides/preset.ts`:

```tsx
<motion.h1
  className={`slide-title-display whitespace-pre-line ${titleClassFor(spec)}`}
>
  {c.title}
</motion.h1>
```

Never:

```tsx
<motion.h1 className="slide-title-display text-gold">  {/* ❌ */}
```

## Subtitle

Subtitles on hero slides use cream at 85%, not foreground/65%:

```tsx
<motion.p
  className="slide-subtitle"
  style={{ color: 'hsl(var(--cream) / 0.85)' }}
>
```

This was the user's explicit correction: subtitle should be "white but a
little bit creamy."

## Audit

Any slide component that imports `text-gold`, `text-title-gold`, or sets a
gold color directly on a `<h1>`/`<h2>`/`<h3>` is suspect. Check
`titleStyle` on the spec first — if it's `white`, `cream`, or unset under
the premium preset, the title MUST go through `titleClassFor`.
