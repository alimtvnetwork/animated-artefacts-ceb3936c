# Subtask: DatabaseDiagramSlide

**Slug:** database-diagram-slide
**Parent:** 02-slide-type-remediation-execution
**Status:** pending
**Created:** 2026-06-06

## Goal
Implement `DatabaseDiagramSlide` rendering a Mermaid ER/database diagram themed with semantic tokens (never raw hex).

## Details
- New component `src/slides/types/DatabaseDiagramSlide.tsx`; register in the slide-type map and `SlideType` enum.
- Reuse the existing Mermaid/ERD plumbing referenced by `quality/audit/subsystems/15-mermaid-and-erd.md` rather than adding a new renderer.
- Theme via `index.css` tokens (`--primary`, `--muted`, `--border`, gold/ember) injected into the Mermaid theme config — no hardcoded colors in the component.
- Honor `prefers-reduced-motion`: opacity-only entry, no node animation.
- Errors (Mermaid parse failure) logged via `src/lib/errors.ts` and surfaced as a fallback message, never a silent catch.

## Verification
A sample slide renders a valid diagram; a malformed `diagram` source shows the fallback and logs once; contract test asserts the type is in enum + CATALOG.
