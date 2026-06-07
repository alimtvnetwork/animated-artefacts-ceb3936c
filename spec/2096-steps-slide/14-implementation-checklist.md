# 14 — Implementation Checklist

The exact build order for a focus-timeline step slide, from empty file to
sound-wired. Each step is independently verifiable; do not start the next until
the current one renders without console errors.

Source anchors:

- Component: `src/slides/types/FocusTimelineSlide.tsx`
- State owner: `src/slides/hooks/useFocusTimeline.ts`
- Deck wiring: `src/pages/SlideDeckPage.tsx:268/280`
- Tokens: `src/index.css` (`--gold`, `--step-title-active/-adjacent/-far`,
  `--dur-*`, `--brand-inset-*`)

---

## Build order

1. **Scaffold the component.** Render a static list of `StepSpec` rows, no
   animation, no focus. Verify the slide mounts and prints all steps.
2. **Wire `useFocusTimeline`.** Move step index into the hook; render the active
   row from `activeIndex`. Verify `next`/`prev`/`focusOn` change the row.
3. **Expose `data-state`.** Stamp each row with `active | adjacent | far`
   (see `09-enums-and-state.md`). Verify the attribute flips in DevTools.
4. **Expose `FocusTimelineHandle`.** Implement `tryAdvance(dir)` via `useImperativeHandle`
   so the deck short-circuits before navigating (see `10-interaction-contract.md`).
   Verify boundary returns `false` and the deck moves slides.
5. **Apply CSS tokens.** Bind opacity/blur/color to `data-state` using the ramp
   in `05-color-and-tokens.md` and `08-motion-constants.md`. No inline hex.
6. **Add reduced motion.** Drop transforms/variants, keep opacity+blur
   (see `11-reduced-motion.md`). Verify with `[data-reduce-motion="true"]`.
7. **Add accessibility.** `aria-current="step"`, `aria-hidden` on out-of-window
   rows, tabindex windowing (see `12-accessibility.md`). Verify with keyboard tab.
8. **Wire sound.** `slideSound.play('click')` after `tryAdvance` in the deck
   (see `13-sound.md`). Verify the cue fires and degrades silently when muted.

## Done signal

- Deck Next/Prev advances steps, then slides at the boundary.
- Reduced-motion and muted both render correctly with no console errors.
- No inline hex, no magic timing numbers — all via tokens.
