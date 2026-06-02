# Subsystem: reduced-motion

## Spec Statement
Every motion respects `prefers-reduced-motion`. Transitions collapse to 150ms fade. Text animations collapse to instant. Step motion variants disabled. Count-up snaps to final.

## Implementation State
- `src/slides/motionPreferences.ts` central gate.
- `[data-reduced-motion='true']` attribute toggled at mount.
- Tests: `motionPreferences.test.ts`, `motionCollisions.test.ts`, `slide4VisualQa.test.ts`.

## Gap
- Count-up snap not yet implemented (depends on Phase 3).

## Severity
None (current shipped scope).

## Evidence
- spec: `spec/21-slides-system/03-animation-rules.md`
- impl: `src/slides/motionPreferences.ts`
- test: `src/test/motionPreferences.test.ts`

## Remediation
Add reduced-motion early-snap to `useCountUp` hook (Phase 3).
