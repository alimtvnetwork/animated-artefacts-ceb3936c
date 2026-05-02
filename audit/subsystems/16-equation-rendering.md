# Subsystem: equation-rendering

## Spec Statement
`EquationSlide` displays exactly one equation. KaTeX HTML pre-rendered at build time by `scripts/prerender-equations.ts`. NO runtime KaTeX dependency. Slide receives opaque `equationHtml` + `termIds` for Stagger reveal (80ms apart, ≤0.6s total). Reduced motion → all visible at once.

## Implementation State
**Not built.** Spec only (§2.4 + sample slide 43).

## Gap
- No build script.
- No runtime component.
- No KaTeX dev-dep.
- No Stagger-by-termId mechanism.

## Severity
**Blocking** for the stated Phase 3 scope.

## Evidence
- spec: `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.4
- impl: absent
- test: absent

## Remediation
1. `bun add -d katex` (build-time only).
2. `scripts/prerender-equations.ts` walks `front-end/project/*/data/slides/*.json`, replaces `tex` with rendered `equationHtml`, writes alongside.
3. Component renders pre-baked HTML with per-term spans keyed by `termIds`.
4. Stagger animation reuses existing `Stagger` text-anim primitive.
