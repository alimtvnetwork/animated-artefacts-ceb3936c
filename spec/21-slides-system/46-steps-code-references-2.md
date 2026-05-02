# 46 — Steps Code-Reference Snippets (Part 2)

> **Last Enriched:** 2026-04-26 · **Phase 5/20 (cont.)** · Continuation
> of `45-steps-code-references.md`. Same rules apply: ≤8 lines per
> snippet, no `any`, positive ifs, booleans prefixed.

## 6. Active-step source-of-truth read

Always read from the existing `useFocusTimeline` hook — never introduce
a parallel state machine:

```ts
const { active, focusNext, focusPrev, tryAdvance } = useFocusTimeline({
  total: steps.length,
  intervalMs: STEP_INTERVAL_MS,
  pauseMs: PAUSE_MS,
});
```

If a new interaction needs the active index, it consumes `active`. If it
needs to change focus, it calls `focusNext` / `focusPrev` /
`tryAdvance`. Direct `setActive` is forbidden outside the hook.

## 7. Per-row data-state attribute

```tsx
<button
  type="button"
  data-state={resolveMotionState(i, active, hasRevealed)}
  aria-current={i === active ? 'step' : undefined}
  onClick={() => focusTo(i)}
>
  {/* row contents */}
</button>
```

CSS targets `[data-state="active"]`, `[data-state="inactive"]`, etc.
Never use a `.active` class — that bypasses the enum.

## 8. Reduced-motion variant builder (Framer Motion)

```ts
function buildRowVariants(isReduced: boolean) {
  if (isReduced === true) {
    return { active: { opacity: 1 }, inactive: { opacity: 0.55 } };
  }
  return RICH_ROW_VARIANTS;
}
```

`RICH_ROW_VARIANTS` is the full transform+opacity map; the reduced
branch returns a stripped object so Framer never registers a transform
animation in the first place.

## 9. Acceptance grep checks

Run from project root before merging any change to the steps slide:

```sh
grep -rn "transform: scale" src/slides/types/StepTimelineSlide.tsx
grep -rn "setActive" src/slides/types/StepTimelineSlide.tsx
grep -rn "className=\"active\"" src/slides/types/StepTimelineSlide.tsx
```

All three must return **zero** matches.

## 10. Open questions & changelog

- Open: lift the constants block into `src/slides/stepConstants.ts` so
  the editor preview imports the same numbers? Default: yes, next pass.
- 2026-04-26 (v0.79.3): Phase 5 — split off §6–§9 from spec 45 to keep
  every file under the 100-line budget.
