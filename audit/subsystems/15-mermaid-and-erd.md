# Subsystem: mermaid-and-erd

## Spec Statement
`DatabaseDiagramSlide` renders Mermaid `erDiagram` with theme variables wired to CSS tokens (`--surface-2`, `--cream`, `--gold`, `--ember`). Dynamic-imported on first mount. Caps: ≤5 entities, ≤6 relationships. Reduced motion: no auto-pan/zoom.

## Implementation State
**Not built.** Spec only (`29-narrow-idea-and-new-slide-types.md` §2.1, sample slide 40). Existing `ERDiagramSlide` is a different beast — boxes-with-fields diagram, not Mermaid; navy-blue palette, not theme-token.

## Gap
- No `mermaid` dependency in `package.json`.
- No `DatabaseDiagramSlide` component.
- Theme-token Mermaid config not implemented.
- Density caps not enforced.

## Severity
**Blocking** for the stated Phase 3 scope.

## Evidence
- spec: `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.1
- impl: absent
- test: absent

## Remediation
1. `bun add mermaid` (peer) — confirm tree-shaken bundle size.
2. Component `src/slides/types/DatabaseDiagramSlide.tsx` with dynamic import.
3. Inject CSS-token theme via `mermaid.initialize({ themeVariables })` reading `getComputedStyle(document.documentElement)`.
4. Zod schema enforces `entities ≤ 5`, `relationships ≤ 6`.
5. Add fixture + visual regression test.
