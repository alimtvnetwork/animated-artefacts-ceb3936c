# Subsystem: keyboard-and-accessibility

## Spec Statement
Keyboard nav: arrows = prev/next; slide-indicator click → input → Enter jumps. Roving tabindex on step rows. Focus follows active card. Arrow keys ignored unless target is a card (#17).

## Implementation State
- `stepsChain3DNavigation.test.tsx` covers click + keyboard + controller `tryAdvance`.
- Roving tabindex shipped in #17.
- Slide-indicator input lives in controller pill.

## Gap
None observed (within scope of shipped slide types).

## Severity
None.

## Evidence
- spec: `spec/21-slides-system/44-steps-accessibility.md`, ambiguity #17
- impl: `src/slides/types/StepsChain3DSlide.tsx`, controls
- test: `src/test/stepsChain3DNavigation.test.tsx`

## Remediation
On Phase 3 new types: extend roving tabindex pattern to `EquationSlide` term focus and `DataTableSlide` row focus.
