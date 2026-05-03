# Update — `.slide-card.is-compact` no longer stretches to fill grid row

**Date**: 2026-05-03
**Scope**: `src/index.css` (`.slide-card.is-compact` rule).

## Problem
Update 06 added `compact: true` to Plan A / Plan B on `/9`, but the cards
still rendered tall. Reason: in `split-2-equal` with the left slot using
`rowSpan: 2`, the right column gets two auto rows that **split the
available height evenly**. Default grid item behavior is
`align-self: stretch`, so each compact card grew to fill its row — the
slimmer padding had no visible effect.

## Fix
Add `align-self: start` to `.slide-card.is-compact` so compact cards
size to their content instead of stretching. Also tightened internal
spacing further:

```css
.slide-card.is-compact {
  padding: 1rem 1.25rem;
  border-radius: 0.875rem;
  align-self: start;          /* ← key fix */
}
.slide-card.is-compact h3        { font-size: 1.25rem; margin-bottom: 0.25rem; }
.slide-card.is-compact .slide-eyebrow { margin-bottom: 0.25rem; }
.slide-card.is-compact p         { font-size: 0.95rem; line-height: 1.4; margin-bottom: 0; }
```

## Rule for authors
Whenever you stack 2+ `compact` cards in a column that shares its row
track with a tall sibling (e.g. a `rowSpan: 2` plain slot), the cards
will now hug their content. No JSON change needed — `compact: true`
alone is enough.

## Acceptance
- `/session-4-ai-coding/9`: Plan A and Plan B render as short cards
  hugging their text, with clear vertical breathing room between them
  and below Plan B.
