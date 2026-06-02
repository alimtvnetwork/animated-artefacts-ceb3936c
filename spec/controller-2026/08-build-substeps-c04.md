# Controller Build — C04 Broken Into 10 Code-Ready Sub-Steps (C04.1–C04.10)

Expands **C04 — "Wire navigation chips + inline slide jump"** into 10 concrete,
ordered sub-steps. Builds on C01 (`useDeckNavigation`), C02 (position/tooltip),
and C03 (pill shell + `ControllerChip`). Live equivalents:
`ControllerBar.tsx`, `SlideIndicator.tsx`.

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C04.1 | Wire Prev chip → `prev()`; disable + dim on slide 1 (unless loop) | `src/slides/controls/ControllerBar.tsx` | Prev is the most-used control; correct bounds + `aria-disabled` prevent dead clicks and confusion at the deck edge. | 20 m |
| C04.2 | Wire Next chip → `next()`; disable + dim on last slide (unless loop) | `ControllerBar.tsx` | Mirror of C04.1; together they enforce the clamp policy from C01.7. | 15 m |
| C04.3 | Add optional First/Last chips (ChevronsLeft/Right → 1 / total) | `ControllerBar.tsx` | Fast jumps to deck ends are cheap to add now and useful in long decks; hidden via prop when not wanted. | 15 m |
| C04.4 | Build `SlideIndicator` showing `current / total` centered | `src/slides/controls/SlideIndicator.tsx` | The indicator is both status and the jump entry point; a clean default label keeps the pill readable. | 20 m |
| C04.5 | Click indicator → swap label for focused, pre-selected number input | `SlideIndicator.tsx` | Click-to-edit is the discoverable jump affordance; auto-focus+select lets the presenter just type. | 30 m |
| C04.6 | Enter in input → `goTo(clampSlide(n, total))`, then restore label | `SlideIndicator.tsx` | Reuses C01.2's clamp so out-of-range input can't navigate off the deck. | 20 m |
| C04.7 | Esc and blur → cancel edit, restore label, no navigation | `SlideIndicator.tsx` | Prevents a stray click/keystroke from trapping the presenter mid-talk. | 15 m |
| C04.8 | Invalid/empty input → revert silently (no jump, no error toast) | `SlideIndicator.tsx` | Forgiving input keeps the control calm; non-numeric just reverts. | 15 m |
| C04.9 | Sub-step reveal handoff: next advances step before slide; prev reverses | `ControllerBar.tsx` + nav hook | Honors staged-reveal slides so the chips drive both step and slide, encoding step in URL (`/N/step`). | 30 m |
| C04.10 | Tests: bounds, click-to-jump, Enter/Esc/blur, invalid, sub-step handoff | `src/test/slideIndicator.test.tsx` | Locks the controller's primary job (CT05 preview) against regressions across all jump paths. | 30 m |

**Subtotal (C04.1–C04.10): ~3.5 h** (within C04's ~2 h core + buffer for sub-step handoff + tests).

## Remaining items
1. **Build order:** C01–C03 (spec'd) → **C04** via C04.1–C04.10 → C05–C10 (~8 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

Per-step breakdowns continue C-by-C on request (C05 next); beyond them only
writing the actual controller code and running the CT suite remain.
