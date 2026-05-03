# Update — LayoutSlide brand-aligned padding + compact card variant

**Date**: 2026-05-03
**Scope**:
- `src/slides/types/LayoutSlide.tsx` — section padding now reads from
  `--brand-inset-x` instead of `px-24`, so the headline, eyebrow, and body
  grid all line up with the BrandHeader logo's left edge.
- `src/slides/types.ts` — `LayoutSlotSpec` gains `compact?: boolean`.
- `src/index.css` — adds `.slide-card.is-compact` rule (slim padding +
  smaller heading + tighter eyebrow).
- `front-end/project/session-4-ai-coding/data/slides/09-your-call.json` —
  Plan A and Plan B cards opt into `compact: true`.

## Why
On `/9` the eyebrow + headline sat ~24px right of the wordmark and the
two right-column cards were tall enough to feel heavy next to the calm
left column. The user asked for:
1. Headline alignment with the logo.
2. Shorter Plan A / Plan B cards.

## Brand-inset alignment
`BrandHeader` already uses `paddingLeft: var(--brand-inset-x)` (see
`src/slides/components/BrandHeader.tsx`). `LayoutSlide` previously used a
fixed `px-24`, which only matched at certain viewport widths. The fix is
to read the same token so the two are guaranteed to share an x-axis at
every width.

```tsx
<section
  className="… flex flex-col py-20"
  style={{
    paddingLeft: 'var(--brand-inset-x)',
    paddingRight: 'var(--brand-inset-x)',
  }}
>
```

## `compact` slot flag
New optional field on `LayoutSlotSpec`:

```ts
compact?: boolean; // slim padding/typography for stacked cards
```

CSS rule (added to `.slide-card`):

```css
.slide-card.is-compact { padding: 1.25rem 1.5rem; border-radius: 1rem; }
.slide-card.is-compact h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
.slide-card.is-compact .slide-eyebrow { margin-bottom: 0.5rem; }
```

Apply by setting `"compact": true` on any card slot. Use it whenever two
or more cards stack in the same column and you want them to feel like a
list, not full hero panels.

## Slide 09 spec delta
```jsonc
{
  "kind": "card",
  "eyebrow": "Plan A",
  "title": "Add a feature to Gitmap",
  "body": "Continue where we left off.",
  "compact": true
}
```

## Acceptance
- `/session-4-ai-coding/9`: headline starts directly under the
  "Riseup Asia" wordmark; Plan A/B cards are visibly shorter and tighter
  while keeping the same gold-accent eyebrow + theming.
- Other `LayoutSlide` decks unchanged (compact is opt-in, brand-inset
  alignment is a strict improvement at every width since BrandHeader
  uses the same token).
