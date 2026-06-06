---
Slug: slide-type-sample-coverage
Status: pending
Created: 2026-06-06
Parent: 03-simplified-single-file-llm-slide-guide
---

# Slide-type sample coverage for the simplified guide

The simplified guide must carry ONE worked, schema-valid JSON sample per
`SlideType` enum value, each wrapped as it would appear inside the single
manifest `slides[]` array. Source the enum from `src/slides/types.ts` and
cross-check required fields against
`spec/21-slides-system/llm/23-slide-type-contracts.md`.

For each type capture three things next to the sample:
- **Why / when** — the one situation this type is the right pick.
- **How it displays** — layout, density cap, motion defaults.
- **Sample JSON** — minimal but complete, using enum values (no raw hex).

Types to cover (verify the live list against the enum, do not trust this copy):
TitleSlide, MiddleTitleSlide, KeywordSlide, CapsuleListSlide,
StepTimelineSlide, AdvanceStepSlide, StepsChain3DSlide, FocusTimelineSlide,
ImageSlide, QrMeetingSlide, ClickRevealSlide, SectionDividerSlide,
MetricGridSlide, NumberCalloutSlide, EquationSlide, DataTableSlide,
DatabaseDiagramSlide, ERDiagramSlide, TileSlide, LayoutSlide.

Reuse existing authored examples where they exist
(`front-end/slide-template/*.json`, `front-end/project/*/data/slides/`) so
samples stay in sync with what actually renders.

## Verification
Every enum value appears once in the guide with all three sections; each
sample validates mentally against `slide.schema.json`.
