# Update — Session 4 Slide 09 rebuilt as LayoutSlide ("Where do we go from here?")

**Date**: 2026-05-03
**Scope**:
- `front-end/project/session-4-ai-coding/data/slides/09-your-call.json` — converted from `CapsuleListSlide` → `LayoutSlide`.
- `front-end/project/session-4-ai-coding/spec/09-your-call.md` — new MD companion.
- `src/slides/types.ts` — added optional `colSpan` / `rowSpan` to `LayoutSlotSpec`.
- `src/slides/types/LayoutSlide.tsx` — applies `gridColumn` / `gridRow` span styles, plain slots are now flex-centered vertically.

## Visual goal
Match the reference mock the user attached: **left column = single calm
ask** ("yours to steer"), **right column = two stacked Plan A / Plan B
cards** with an eyebrow tag in the top-right corner.

## Layout
- `layout: "split-2-equal"`
- Slot 1 — `kind: "plain"`, `rowSpan: 2` (fills full left column).
- Slot 2 — `kind: "card"`, `eyebrow: "Plan A"`, "Add a feature to Gitmap".
- Slot 3 — `kind: "card"`, `eyebrow: "Plan B"`, "Your idea".

## Schema delta
`LayoutSlotSpec` now accepts:
- `colSpan?: number` — applied as `gridColumn: span N`
- `rowSpan?: number` — applied as `gridRow: span N`

These let a single `split-2-equal` layout host a 1-vs-2-stacked split
without inventing a new grid preset.

## Title color
`titleStyle: "white"` — keeps slide 09 in line with the deck-wide white
middle-title rule.

## Acceptance
- `/session-4-ai-coding/9` renders the two-column layout matching the
  attached mock.
- Theme switch keeps title pure white; card eyebrows pick up the active
  theme accent.
- No regression on existing `LayoutSlide` decks (span fields are optional).
