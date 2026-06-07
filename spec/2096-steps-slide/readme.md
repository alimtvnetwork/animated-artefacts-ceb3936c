# 2096 — Steps Slide Spec (blind-LLM build guide)

> **Audience: a "blind" AI implementer** who may never have seen this codebase.
> This folder teaches you to (re)build the **step-based slide system** — both
> step variants — from scratch, with concrete numbers, CSS tricks, and JSON
> contracts. If the code and this spec disagree on intent, the spec is the
> intended behavior; for raw constants the code is the source of truth (always
> cited by path).

## What a "step slide" is

A step slide renders an **ordered list of items**. Item `i` gets a 1-based,
two-digit index label (`String(i + 1).padStart(2, '0')` → `01`, `02`, …). Every
item has a **title**, optional supporting text, and an optional **capsule**
(small colored pill, e.g. a duration tag).

There are **two fundamentally different step types** — this is the heart of this
spec (see `01-two-step-types.md`):

| Type | Variant(s) | Behavior |
|------|-----------|----------|
| **A — Static outline** | `SessionOutlineSlide` | All items visible at once, no internal advance. Agenda / chapter opener. |
| **B — Interactive focus** | `StepTimelineSlide`, `FocusTimelineSlide`, `AdvanceStepSlide` | One **active** step at a time; presenter advances; neighbors dim. |

## Reading order (do not skip)

1. `00-overview.md` — family, shared mental model, house rules.
2. `01-two-step-types.md` — **the core**: Type A vs Type B, when to use which.
3. `02-data-model.md` — exact TS contract (`items[]` vs `steps[]`).
4. `03-focus-animation.md` — how "first active, then next" works; exact numbers.
5. `04-css-tricks.md` — connector glow, depth-without-scale, blur, chips.
6. `05-color-and-tokens.md` — `.capsule-{tone}` rule, design tokens.
7. `06-typography.md` — semantic classes, weight-shadow, keywords-only.
8. `07-layout-geometry.md` — two-column geometry, insets, counter pill.
9. `08-motion-constants.md` — single source of truth (code-cited).
10. `09-enums-and-state.md` — enums + `useFocusTimeline` hook.
11. `10-interaction-contract.md` — keyboard, click, hover, autoplay.
12. `11-reduced-motion.md` — what to disable / keep.
13. `12-accessibility.md` — ARIA, contrast, focus order.
14. `13-sound.md` — focus-arrival cue.
15. `14-implementation-checklist.md` — literal build order.
16. `15-css-recipes.md` — copy-paste snippets.
17. `16-worked-example.md` — JSON → rendered walkthrough.
18. `17-common-mistakes.md` — anti-patterns + fixes.
19. `18-acceptance-and-qa.md` — proof before "done".

## Canon cross-links (the existing implementation)

- Family overview + data model: `spec/21-slides-system/steps-based-slides/**`
- Motion numbers: `spec/21-slides-system/42-steps-motion.md`
- LLM pattern card: `spec/21-slides-system/llm/12-steps-pattern.md`
- Runtime: `src/slides/types/StepTimelineSlide.tsx`,
  `FocusTimelineSlide.tsx`, `AdvanceStepSlide.tsx`, `SessionOutlineSlide.tsx`
- Hook (state owner): `src/slides/hooks/useFocusTimeline.ts`
- Tokens: `src/index.css` (`--gold`, `--step-title-active/-adjacent/-far`, `--brand-inset-*`)

## Status

- 2026-06-07 — Folder scaffolded. `readme.md`, `00-overview.md`,
  `01-two-step-types.md`, `02-data-model.md`, `03-focus-animation.md`,
  `04-css-tricks.md` written (plan `06`, steps 1–11). Remaining files `05`–`18`
  to be authored in subsequent steps. Self-audit pending (plan step 30).
