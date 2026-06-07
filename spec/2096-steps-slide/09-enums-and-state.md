# 09 — Enums and State

This file documents the **state model** for interactive (Type B) step slides:
the per-row visual state enum and the `useFocusTimeline` hook that owns the
focus index.

Source anchors:

- Hook: `src/slides/hooks/useFocusTimeline.ts` (`useFocusTimeline`,
  `FocusTimelineHandle`)
- State attribute consumer: `src/index.css:1551-1582`
  (`data-state="active|adjacent|far"`)

---

## 1. Row visual-state enum

Every `.step-row` carries `data-state`, a 3-value union — never a boolean:

```ts
type StepRowState = 'active' | 'adjacent' | 'far';
```

| State | Meaning | Picked when |
|---|---|---|
| `active` | the focused step | `index === focusIndex` |
| `adjacent` | immediate neighbor(s) | `Math.abs(index - focusIndex) === 1` |
| `far` | everything else | `Math.abs(index - focusIndex) > 1` |

The CSS in `06-typography.md §3` / `08-motion-constants.md §3-4` maps each state
to font-size + alpha + blur. Authors set `data-state` in TSX; CSS does the rest.

---

## 2. `useFocusTimeline(stepCount, initial = 0)` — the state owner

The hook owns `focusIndex` and exposes navigation. It is the single source of
truth for "which step is active." Key behaviors:

| Member | Type | Behavior |
|---|---|---|
| `focusIndex` | `number` | currently focused 0-based step |
| `focusOn(idx)` | `(n)=>void` | clamps to `[0, stepCount-1]` and jumps |
| `next()` | `()=>boolean` | advance one; **returns `false` at the last step** |
| `prev()` | `()=>boolean` | back one; **returns `false` at the first step** |
| `isAtStart` | `boolean` | `focusIndex === 0` |
| `isAtEnd` | `boolean` | `focusIndex >= stepCount - 1` |

**No looping.** `next()`/`prev()` return `false` at the boundary so the caller
falls through to deck-level Next/Prev. This is what lets a Type B slide consume
arrow presses internally until it runs out of steps, then hand off to the deck.

**Self-healing index.** A `useEffect` reins `focusIndex` back in range when
`stepCount` shrinks (e.g. hot reload) so it never renders out-of-range.

---

## 3. `FocusTimelineHandle` — the deck integration contract

The imperative handle a Type B slide exposes upward:

```ts
interface FocusTimelineHandle {
  tryAdvance: (dir: 'forward' | 'backward') => boolean; // true = consumed
  setStep?: (index: number) => void;   // scrubber; -1 = pre-reveal phase
  getStep?: () => number;              // -1 when pre-reveal
  getStepCount?: () => number;
  replay?: () => void;                 // re-run entrance from initial state
}
```

- `tryAdvance` returns `true` when the slide consumed the nav (focus moved) and
  `false` when the deck should move to the sibling slide — the same boundary
  semantics as `next()/prev()`.
- `setStep(-1)` on a `StepTimelineSlide` returns to the **pre-reveal phase** so
  entrance animations can be re-watched (used by `AnimationScrubber.tsx`).

---

## Acceptance

- [ ] Rows use the 3-value `data-state` enum, never a boolean "isActive".
- [ ] `next()/prev()` do NOT loop; boundary returns `false`.
- [ ] Slide exposes a `FocusTimelineHandle` whose `tryAdvance` mirrors boundary
      semantics; `setStep(-1)` reaches the pre-reveal phase.
