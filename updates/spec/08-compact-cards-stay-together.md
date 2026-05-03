# Update — Compact cards in a grid column must stay packed together

**Date**: 2026-05-03
**Scope**: `src/index.css` — added `:has(.slide-card.is-compact)` packing
rule on `.slide-grid-2-equal`, `.slide-grid-5-7`, `.slide-grid-4-8`,
`.slide-grid-3-9`, `.slide-grid-12-column`.

## Problem
After update 07, compact cards stopped stretching individually — but in
`split-2-equal` with a `rowSpan: 2` left slot, the right column still
had two auto rows distributed across the full slide height. Result:
Plan A sat at the top, Plan B sat at the bottom, with a huge empty gap
between them.

## Rule (authoring contract)
**When a column stacks 2+ compact cards, they MUST visually group
together — never spread to fill the column height.**

Implementation: any layout grid that contains at least one
`.slide-card.is-compact` switches to:

```css
grid-auto-rows: min-content;
align-content: start;
row-gap: 1rem;
```

This packs rows from the top with a fixed 1rem gap, regardless of how
tall the column is or whether a sibling slot uses `rowSpan`.

## For LLM authors
- Stacking compact cards in a column? Don't try to fix spacing with
  empty slots, padding hacks, or `rowSpan` math. The CSS handles it.
- If you WANT cards spread evenly, don't use `compact: true` — use full
  cards (which still stretch via default grid behavior).
- The packing rule is opt-in via the presence of `is-compact`; non-
  compact decks are unchanged.

## Acceptance
- `/session-4-ai-coding/9`: Plan A and Plan B sit directly above each
  other with ~16px gap, both anchored near the top of the right column.
  No vertical gap between them larger than the gutter.
