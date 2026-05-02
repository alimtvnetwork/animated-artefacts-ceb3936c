# 05 — ER Diagram

**Type**: `ERDiagramSlide` (v0.177)

## Purpose
Three entities (`tenants`, `users`, `core.events`) with two `1:N` relationships.
The slide is intentionally **zero-config color-wise** — the navy-blue theme's
auto-palette paints PK rows cyan and FK rows orange. On any other theme the same
JSON would render gold/ember; here it reads as native data-deck design.

## Layout
- `diagramExplanation` is set, so SlideStage auto-engages the **4/8 split**:
  paragraph on the left, ER canvas on the right. Drop the field to get a
  full-bleed diagram.
- Three entity boxes positioned across the canvas as percentages
  (`x`, `y`, `w` in 0-100 stage units) per the `DiagramNodeSpec` contract.
- Two `relationships[]` with `cardinality: ['1','N']` — the default; included
  explicitly here for clarity.

## Animation contract
- `transition: FadeIn` / `textAnimation: FadeIn` — diagrams want a calm entry
  so the eye can find the boxes before the relationships register.

## Speaker notes
Trace the relationships verbally: "tenants owns users, users emits events".
The ER box is the same `core.events` table from slide 4's codeblock — so the
audience sees the schema twice, once as DDL, once as a picture.
