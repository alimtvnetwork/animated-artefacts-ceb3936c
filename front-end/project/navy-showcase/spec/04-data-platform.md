# 04 — Data Platform

**Type**: `LayoutSlide` (v0.169)

## Purpose
Six-slot 2x3 card grid that **exercises every `LayoutSlotSpec.kind` and every
`variant`** in one slide:

| Slot | kind        | variant   | Showcases |
|------|-------------|-----------|-----------|
| 1    | `card`      | `accent`  | Cyan border (navy-blue's primary accent) |
| 2    | `card`      | (default) | Plain card surface |
| 3    | `card`      | `success` | Green border tuned for navy bg |
| 4    | `codeblock` | —         | Inline SQL with shiki highlighting |
| 5    | `card`      | `danger`  | Orange border (matches `--ember`) |
| 6    | `plain`     | —         | Raw text, no card chrome |

## Animation contract
- `transition: PushIn` — depth pop into the architecture overview.
- `textAnimation: FadeIn` — slots settle gently after the push.
- `gridPreset: "card-grid-2x3"` mirrors `layout` so the deck-wide spacing tokens
  (`--slide-grid-gutter`, `--slide-grid-padding-x`, `--slide-grid-padding-y`)
  govern this slide too.

## Speaker notes
Read top-to-bottom, left-to-right. The codeblock slot is the proof-of-truth —
literal DDL, no hand-waving. Pause on Guardrails (slot 5); cost discipline is
the part most platform decks skip.
