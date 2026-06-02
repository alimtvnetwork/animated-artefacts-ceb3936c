# Subsystem: number-animation

## Spec Statement
`NumberCalloutSlide` shows ONE oversized animated number. Count-up `from → to` over `--dur-count-fast` (900ms) or `--dur-count-slow` (1800ms). Easing union: `linear` | `easeOutQuint` | `spring`. Reduced motion: snap to final, no tween.

## Implementation State
**Not built.** Spec only (§2.3 + sample slide 42).

## Gap
- No `useCountUp` hook.
- Tokens `--dur-count-fast/slow` not in `index.css`.
- No `NumberCalloutSlide` component.
- Spring easing implementation choice undocumented (likely a critically-damped spring with stiffness ≈ 180, damping ≈ 22 — to be confirmed in Phase 3).

## Severity
**Blocking** for the stated Phase 3 scope.

## Evidence
- spec: `spec/21-slides-system/29-narrow-idea-and-new-slide-types.md` §2.3
- impl: absent
- test: absent

## Remediation
1. Add tokens to `:root` and `[data-reduced-motion='true'] { --dur-count-fast: 0ms; --dur-count-slow: 0ms; }`.
2. `src/slides/hooks/useCountUp.ts` with `requestAnimationFrame` driver.
3. Component renders single number, label, optional capsule.
4. Snapshot test asserts reduced-motion = final value on first frame.
