# 43 — Mermaid integration for DatabaseDiagramSlide

**Date:** 2026-05-01
**Window:** 2 (entry 05)
**Outcome:** Implemented. No surface ambiguity — spec 29 §2.1 already pinned Mermaid + token-driven theme.

## What changed

- `bun add mermaid` (v11.14.0). Pulled lazily via `await import('mermaid')` inside the slide so it's not in the initial bundle.
- `src/slides/types/DatabaseDiagramSlide.tsx` rewritten with two render paths:
  - **Mermaid path** when `content.diagram` is present — renders `erDiagram` source with `mermaid.initialize({ theme: 'base', themeVariables })` wired to CSS tokens (`--surface-2`, `--cream`, `--gold`, `--ember`, `--surface-1`, `--foreground`). `securityLevel: 'strict'`.
  - **Inline-SVG fallback** kept verbatim for decks that don't supply a Mermaid string.
- Contract `DatabaseDiagramContent` updated: `dbEntities` is now optional, `diagram` is a new optional string, and a `.refine()` enforces "at least one of the two".
- `SlideSpec.content.diagram` added in `src/slides/types.ts`.
- Runtime sample deck `front-end/project/sample/data/slides/40-database-erd.json` now ships a Mermaid `erDiagram` source (with field blocks). The legacy `dbEntities`/`dbRelationships` arrays are kept for the fallback path.

## Notes

- Reduced-motion contract preserved: a single `opacity 0→1` fade on the wrapper, no scale, no pan, no zoom, no entrance staircase per entity. Mermaid renders once and stays still.
- `useId()` colons stripped because mermaid's render id must be a valid CSS selector.
- Error path: caught render errors render as `<div role="alert">` in `--ember`, no app crash.
