# Phase 1 — Inventory of Existing Specs

> Scope: all files under `/spec/` as of 2026-04-26. Used as the input set
> for the steps-spec enrichment work (Phases 2–5) and the blind-LLM gap
> audit (Phase 16).

## Folders

```
/spec/
  ├── architecture/    Slides.md, architecture.md
  ├── audit/           README.md, 01-blind-llm-gap-analysis.md, 00-phase1-inventory.md (this file)
  ├── issues/          22-app-issues.md
  └── slides/
      ├── README.md
      ├── 00-fundamentals.md … 41-per-slide-guide-set.md  (40 numbered specs)
      ├── deck.schema.json, deck-manifest.schema.json, slide.schema.json
      ├── assets/      reference screenshots
      ├── llm/         the LLM authoring pack (00-README → 06-cheatsheet)
      └── showcase/    canonical deck JSON + companion .md per slide
```

## Steps-related spec set (the Phase 2–5 input)

Ordered by version chronology. **Bold** = current canonical truth.
Strikethrough-style notes mark entries that are now archeology.

| # | File | Lines | Status | Topic |
|---|------|-------|--------|-------|
| 11 | `11-focus-timeline.md` | 159 | superseded by 17 | First focus-style timeline; introduced active row + side panel |
| 17 | `17-step-timeline-v2.md` | 495 | partially superseded | Locked the "no CSS scale" rule, side panel spring, autoplay off |
| 18 | `18-advance-step-cinematic.md` | 307 | active for `AdvanceStepSlide` | Camera-dolly variant with one frame visible at a time |
| 20 | `20-advance-step-v2.md` | 205 | active for `AdvanceStepSlide` | Updated reveal staging + sound integration |
| 21 | `21-sound-system.md` | 311 | active | Sound singleton, asset table, debounce |
| 23 | `23-step-timeline-v3.md` | 87 | superseded by 27 | First v3 cleanup pass |
| 27 | `27-step-timeline-v3.2.md` | 100 | superseded by 32 | Centered composition prototype |
| 32 | **`32-step-timeline-v3.3-centered-composition.md`** | 164 | **canonical layout** | 1440px centered grid, leftOffsetPx |
| 33 | **`33-step-timeline-interactions.md`** | 207 | **canonical interactions** | Hover/active swap, tryAdvance, autoplay, key bindings |
| 36 | **`36-step-timeline-first-load-and-alignment.md`** | 99 | **canonical first-load** | Ubuntu Bold for step row titles, alignment-on-mount |
| 40 | **`40-step-snap-to-guides.md`** | 113 | **canonical snapping** | Editor snap to logo / body / rail guides |
| 41 | `41-per-slide-guide-set.md` | 77 | active | Per-slide guide-set selector (HUD dropdown) |

LLM authoring pack (already exists, will be **extended** in Phases 6–14):

| # | File | Lines |
|---|------|-------|
| 00 | `llm/00-README.md` | 121 |
| 01 | `llm/01-architecture-and-files.md` | 152 |
| 02 | `llm/02-step-system-complete.md` | 479 |
| 03 | `llm/03-sound-system-complete.md` | 224 |
| 04 | `llm/04-ambient-and-title-background.md` | 307 |
| 05 | `llm/05-design-tokens-and-theme.md` | 184 |
| 06 | `llm/06-json-authoring-cheatsheet.md` | 476 |

## Decisions captured this phase

1. **Pack location**: extend `/spec/slides/llm/` — do not create a parallel
   `/spec/LLM-Slides/` folder. Confirmed by user.
2. **Reference image source**: reuse
   `spec/slides/llm/assets/step/target.png` for the canonical look and
   `spec/slides/llm/assets/step/broken-reference.png` for anti-pattern.
3. **Annotated overlay**: produced programmatically in Phase 15.
4. **Cadence**: one phase per `next` (strict).
5. **Numbering plan for new pack files** (Phases 7–14):
   `llm/07-canvas-and-scaling.md`, `08-background-system.md`,
   `09-title-background.md`, `10-typography.md`, `11-color-tokens.md`,
   `12-steps-pattern.md`, `13-motion-system.md`, `14-sound-pointer.md`,
   `15-authoring-template.md`, `16-voice-to-slide-protocol.md`,
   `17-do-and-dont.md`, `18-acceptance-checklist.md`. (Existing files
   00–06 stay; new ones append.)

## What changed

- New file: `spec/audit/00-phase1-inventory.md` (this file).
- No code touched. No memory updated yet (Phase 19).

## Remaining phases

Phase 2 → Enrich steps motion spec. Run by typing **`next`**.
