# 45 — Phase 5 Polish Quartet (audit closeout)

**Date:** 2026-05-01
**Window:** 2 (task 7/40)

## Task context
Final polish items from the Phase 5 audit remediation plan:
1. Wire `motion-variety-audit.ts` into CI as advisory step.
2. Bump `CATALOG.json` to reference specs 62/63/64 + `DatabaseDiagramSlide.diagram` + `EquationSlide.equationHtml` contracts.
3. Add Mermaid render unit test.
4. Add KaTeX prerender unit test.

## Specific question
None — all four items had explicit shape from prior phases.

## Inferred decision
- Motion audit runs **advisory** (exits 0; surfaces `::warning::` lines). Matches script intent.
- `audit:motion` script added to `package.json` next to `check:catalog` for symmetry.
- `CATALOG.json` gains new top-level `relatedSpecs` and `slideContentNotes` blocks rather than mutating existing `registries.slideTypes` (back-compat — importers keep working).
- Mermaid test mocks `mermaid` module to avoid jsdom rendering quirks; asserts the Mermaid host div appears when `content.diagram` is non-empty and the inline-SVG fallback renders otherwise.
- KaTeX test inlines the `renderEquation` helper (the script is one-shot CLI with top-level side effects); locks term-id contract: auto-generation, length-mismatch fallback, 80ms stagger, HTML escaping, malformed-TeX safety.

## Impact
- CI gains 1 advisory step.
- No runtime behavior change.
- Two new test files (`src/test/katexPrerender.test.ts`, `src/test/mermaidErd.test.tsx`).
- `package.json` script + `ci.yml` step + `CATALOG.json` v1.2.0 → v1.3.0.

## Suggested clarification
Confirm the motion audit threshold (60% on ≥4 slides) is the right gate. Currently advisory; if you want it to **fail** CI, swap `::warning::` for `::error::` and `exit 1` in the script.

## Timestamp
2026-05-01
