# Author the "Steps Slide" spec folder (blind-LLM, two step types, full motion + CSS)

**Slug:** steps-slide-2096-spec-folder
**Steps:** 30
**Status:** completed
**Created:** 2026-06-07

## Context
Write a brand-new, self-contained spec folder that teaches any "blind" LLM to
build the step-based slide system from scratch — covering the **two step
variants** (the static numbered outline vs. the presenter-advanced focus/timeline
step), exactly how the focus animation works (first item active, neighbors dim),
and every CSS trick (opacity ramp, font-size depth, gold connector glow, blur,
color tokens). Folder target: `spec/2096-steps-slide/`. This consolidates and
re-explains canon currently spread across
`spec/21-slides-system/steps-based-slides/**`,
`spec/21-slides-system/42-steps-motion.md`, `llm/12-steps-pattern.md`, and the
runtime in `src/slides/types/StepTimelineSlide.tsx`, `FocusTimelineSlide.tsx`,
`AdvanceStepSlide.tsx`, `SessionOutlineSlide.tsx`.

Captured command: `.lovable/spec/commands/07-steps-slide-spec-folder.md`.

## Steps
1. Create the folder `spec/2096-steps-slide/` and a `readme.md` index listing every file below, the reading order, and the "blind LLM" promise.
2. Write `00-overview.md`: define what a step slide is, the shared mental model (ordered items → index label → title → optional capsule), and name the two step variants explicitly.
3. Write `01-two-step-types.md`: the core deliverable — contrast **Type A: static outline** (`SessionOutlineSlide`, all items visible, no advance) vs **Type B: interactive focus** (`StepTimelineSlide`/`FocusTimelineSlide`/`AdvanceStepSlide`, one active step, presenter-advanced).
4. In `01-two-step-types.md`, add a decision table: when to use Type A vs Type B, inputs each consumes (`items[]` vs `steps[]`), and migration cost between them.
5. Write `02-data-model.md`: the full TypeScript contract for `StepSlideContent`/`StepItem` (Type A) and `StepSpec`/`steps[]` (Type B), including `activeIndex`, `description` union, `capsule`, `expand`, `revealSlide`.
6. In `02-data-model.md`, give one complete valid JSON example per type, with field-by-field annotations and required/optional flags.
7. Write `03-focus-animation.md`: explain step-by-step how "first one active, second one next" works — the active index state machine, neighbor dimming, and forward/backward direction.
8. In `03-focus-animation.md`, document the exact numbers: active/adjacent/far `opacity` (1.0 / 0.55 / 0.30), `font-size` clamps, pure-white active color, translateX entrance (-24px→0).
9. In `03-focus-animation.md`, document the detail-panel snap: enter opacity 0→1 280ms, y ±12→0 by direction, scale spring `{380,28,0.7}`, exit 220ms, inner stagger 0.05/0.12/0.18/0.26s.
10. Write `04-css-tricks.md`: the gold vertical connector (`left:18px`, `width:1px`, `bg-gold/20`) and its active fill `bg-gold` + `shadow-[0_0_8px_hsl(var(--gold)/0.6)]`.
11. In `04-css-tricks.md`, document depth-without-scale: why `transform: scale()` is forbidden (glyph blur), and how font-size jump + opacity ramp + white active title carry depth instead.
12. In `04-css-tricks.md`, document optional blur/glow effects: backdrop blur on panels, ember/cream glow halos, and how to gate them behind reduced-motion.
13. In `04-css-tricks.md`, document the numbered chip: 36×36 rounded-full **button** (never a div), index label `String(i+1).padStart(2,'0')`.
14. Write `05-color-and-tokens.md`: the `.capsule-{tone}` rule (never inline brand-token styles), `.capsule-meta` for durations, and why brand tokens flip on light themes.
15. In `05-color-and-tokens.md`, list the relevant tokens from `src/index.css`: `--gold`, `--ember`, `--cream`, `--brand-inset-x/-y`, `--step-title-active/-adjacent/-far`, `--text-shadow-weight-*`.
16. Write `06-typography.md`: semantic classes (`.slide-title-content`, `.slide-eyebrow`, `.step-title`), the 45° weight-shadow bevel rule, and the keywords-only (≤~6 words) content constraint.
17. Write `07-layout-geometry.md`: the two-column geometry for Type B (560px list / 80px gutter / 800px panel), inset alignment from `--brand-inset-*`, and the `STEP NN / NN` counter pill placement.
18. Write `08-motion-constants.md`: reference the single source of truth in `src/slides/types/StepTimelineSlide.tsx` — `STEP_INTERVAL_MS=2200`, `PAUSE_MS=6000`, `REVEAL_BASE_DELAY=0.3`, `REVEAL_STAGGER=0.18` — by name + path, never duplicated inline.
19. Write `09-enums-and-state.md`: `StepMotionState` / `StepMotionDirection` enums and the `useFocusTimeline` hook as the single state owner (`active`, `hoveredIndex`, `pauseUntilRef`, `tryAdvance`).
20. Write `10-interaction-contract.md`: keyboard (`← → ↑ ↓ Home End`), click-on-inactive jumps + 6s pause, autoplay default OFF, hover overrides panel only.
21. Write `11-reduced-motion.md`: what to disable (translateX, y, scale, connector grow, directional snap) and what to keep (opacity crossfade ≤150ms; font-size clamps remain since they are layout).
22. Write `12-accessibility.md`: ARIA roles for the chip buttons, contrast ≥7:1 on active title against `#0D0D0D`, focus order, and `data-state` exposure.
23. Write `13-sound.md`: the focus-arrival `whoosh` cue (volume 0.5), debounce, and the `slide.sound.focusArrival` override hook.
24. Write `14-implementation-checklist.md`: literal build order for a blind LLM — copy `SessionOutlineSlide.tsx`, change only items-layout JSX + motion, register in `enums.ts` / `SlideStage.tsx` / `types.ts`.
25. Write `15-css-recipes.md`: copy-paste-ready Tailwind/CSS snippets for the connector, the opacity ramp, the active glow, and the panel snap (annotated, not pseudo-code).
26. Write `16-worked-example.md`: a full end-to-end JSON → expected rendered description walkthrough for one Type A and one Type B slide.
27. Write `17-common-mistakes.md`: the anti-patterns (inline brand-token capsules, `scale()` on rows, paragraphs in subtitle, second state machine, >8 items) with the correct fix for each.
28. Write `18-acceptance-and-qa.md`: how to prove it works — visual checks, behavioral checks, reduced-motion path, contrast audit, and which scripts to run (`scripts/step-timeline-contrast-report.ts`, `scripts/motion-variety-audit.ts`).
29. Add cross-links: from the new folder's `readme.md` to the existing canon files, and append a one-line pointer in `spec/readme.md` so the folder is discoverable.
30. Final self-audit: verify every file exists, the two step types are unambiguously distinguished, all numbers match the code source of truth, and no spec contradicts `42-steps-motion.md`; record the result at the bottom of `readme.md`.

## Verification
- Each step lands a markdown file under `spec/2096-steps-slide/`; `ls` confirms presence and order.
- Numbers in `03`/`08` match `src/slides/types/StepTimelineSlide.tsx` (grep the constants).
- `spec/readme.md` shows the new folder; no broken relative links (manual link check).
- A blind read-through of `readme.md` → `18` produces enough to rebuild both step types without opening source.

## Appended from prior pending tasks
- `05-slide-options-themes-and-number-controller` (Steps: 100, Status: pending) — media-rich slide types, ellipsis slide-number controller, image-derived themes. Still pending; not blocked by this plan.
