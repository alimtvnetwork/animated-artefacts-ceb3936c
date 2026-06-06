---
Slug: slide-types-catalog
Status: pending
Created: 2026-06-06
Parent: 01-slide-system-export-llm-overhaul
---

# Slide types catalog (for LLM guide)

For each `slideType`, the LLM guide must show: purpose, required content fields, density cap, one minimal JSON example, allowed positions/layout.

Types to document (from `SlideType` enum):
- TitleSlide
- KeywordSlide (≤6 capsules)
- CapsuleListSlide
- StepTimelineSlide
- StepsChain3DSlide
- ImageSlide (content.image OR images[])
- QrMeetingSlide
- ClickRevealSlide (isClickReveal + parentSlide)
- SectionDividerSlide
- MetricGridSlide
- NumberCalloutSlide (1 number)
- EquationSlide (1 equation)
- DataTableSlide (≤5 cols × ≤8 rows)
- DatabaseDiagramSlide / ERDiagramSlide (≤5 entities)
- TileSlide / LayoutSlide

## Position / layout variants
Document how to request: center, left-aligned, split. Capture which prop expresses this (e.g. `content.align` / `layout`) — confirm against `src/slides/types.ts` during build; if no field exists, propose adding `align: "center" | "left" | "right"`.
