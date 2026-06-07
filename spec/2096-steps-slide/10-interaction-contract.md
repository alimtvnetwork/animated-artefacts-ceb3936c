# 10 — Interaction Contract

How a Type B (interactive focus) step slide consumes input: keyboard, click,
and autoplay. The slide is a **short-circuit** in the deck's Next/Prev chain —
it eats navigation internally until its steps run out, then hands off.

Source anchors:

- Deck wiring: `src/pages/SlideDeckPage.tsx:268` (`next`) and `:280` (`prev`) —
  both call `focusRef.current?.tryAdvance(dir)` first and `return` on `true`.
- Slide handle: `src/slides/types/FocusTimelineSlide.tsx:48`
  (`tryAdvance: (dir) => (dir === 'forward' ? next() : prev())`).
- Click-to-focus: `FocusTimelineSlide.tsx:91,144` (`onClick={() => focusOn(i)}`).
- State owner: `src/slides/hooks/useFocusTimeline.ts` (`next`/`prev`/`focusOn`).

---

## 1. The short-circuit rule (the whole contract in one line)

> The deck asks the slide first. If `tryAdvance(dir)` returns `true`, the deck
> does nothing. If it returns `false`, the deck moves to the sibling slide.

```text
ArrowRight ─▶ deck.next() ─▶ focusRef.tryAdvance('forward')
                                │ true  → focus moved, STOP (stay on slide)
                                │ false → at last step → goTo(nextSlide)
```

`prev`/ArrowLeft mirror this with `'backward'` and the first-step boundary.
Boundary `false` comes straight from `useFocusTimeline.next()/prev()` (returns
`false` at `focusIndex >= stepCount-1` / `<= 0`), so there is exactly **one**
source of boundary truth — see `09-enums-and-state.md §2`.

## 2. Keyboard

| Key | Routes to | Effect |
|---|---|---|
| `→` / `Space` / `PageDown` | `deck.next()` → `tryAdvance('forward')` | advance focus, else next slide |
| `←` / `PageUp` | `deck.prev()` → `tryAdvance('backward')` | retreat focus, else prev slide |

Key handling lives at the deck level; the slide never attaches its own global
`keydown`. This keeps a single capture point and avoids double-advance. Guard
against typing in form fields before routing (see `AdvanceStepSlide.tsx:48`).

## 3. Click / pointer

Each `.step-row` is clickable and calls `focusOn(i)` — a **direct jump** to that
index (clamped in the hook). Clicking does not loop or fall through to the deck;
it is an absolute set, not a relative advance.

## 4. Autoplay / scrubber

The imperative `setStep(index)` (see `FocusTimelineHandle`, `09 §3`) drives
programmatic stepping for `AnimationScrubber.tsx`. `setStep(-1)` returns a
`StepTimelineSlide` to the **pre-reveal phase**. Autoplay is just a timer
calling `tryAdvance('forward')` and stopping when it returns `false`.

---

## Acceptance

- [ ] Deck Next/Prev call `tryAdvance` first and only navigate on `false`.
- [ ] Boundary handoff uses the hook's `false` return — no duplicated edge logic.
- [ ] Clicking a row jumps focus via `focusOn(i)`, never advances relatively.
- [ ] No slide-local global keydown listener; deck owns the keys.
