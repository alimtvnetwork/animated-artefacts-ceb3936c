# Controller Build — C06 Broken Into 10 Code-Ready Sub-Steps (C06.1–C06.10)

Expands **C06 — "Global shortcut handler + help dialog"** into 10 concrete,
ordered sub-steps. Builds on C01–C05. Live equivalents:
`KeyboardShortcutsDialog.tsx` (the `SHORTCUTS` source) + `ControllerBar.tsx`.

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C06.1 | Define the single `SHORTCUTS` source (grouped keys + labels) | `src/slides/controls/KeyboardShortcutsDialog.tsx` | One source of truth feeds both the live handler and the help dialog so they can never drift apart. | 20 m |
| C06.2 | Create `useKeyboardShortcuts()` attaching one window `keydown` listener | `src/slides/hooks/useKeyboardShortcuts.ts` | A single window-level listener (cleaned up on unmount) avoids per-chip handlers and duplicated key logic. | 25 m |
| C06.3 | Map core nav keys: `→`/`Space`/`Enter`=next, `←`/`Backspace`=prev | `useKeyboardShortcuts.ts` | These are the keys the onboarding popup teaches; they must match the chip behavior exactly. | 15 m |
| C06.4 | Map `F`=fullscreen, `G`=overview, `Esc`=exit/close, `M`=music | `useKeyboardShortcuts.ts` | Wires the remaining global actions through the same dispatch so every control has keyboard parity. | 15 m |
| C06.5 | Implement quick-jump: digits buffer, `Enter`=jump, `Backspace`/`Esc` | `useKeyboardShortcuts.ts` | Type-a-number jump is a presenter staple; a small pending-digits buffer with clamp (C01.2) handles it. | 30 m |
| C06.6 | Add input-focus guard (input/textarea/contenteditable/modal) | `useKeyboardShortcuts.ts` | The highest-risk area: shortcuts must never fire while typing a slide number or notes. | 20 m |
| C06.7 | `preventDefault` only for handled keys (e.g. Space scroll) | `useKeyboardShortcuts.ts` | Selective prevention stops page scroll on Space without breaking native behavior elsewhere. | 10 m |
| C06.8 | Build the `/`-triggered help `Dialog` rendering from `SHORTCUTS` | `KeyboardShortcutsDialog.tsx` | A Radix dialog of grouped `<kbd>` rows gives a discoverable map; `/` opens, `Esc` closes. | 30 m |
| C06.9 | Add "Keyboard map" item to the overflow menu (reuses the dialog) | `ControllerBar.tsx` | Three ways in (`/`, menu, onboarding) maximizes discoverability without duplicating content. | 15 m |
| C06.10 | Tests: every key dispatch, focus guards, quick-jump, `/` opens dialog | `src/test/useKeyboardShortcuts.test.ts` | Locks dispatch + guards (CT07 preview) — the area most likely to regress as keys are added. | 30 m |

**Subtotal (C06.1–C06.10): ~3.5 h** (within C06's ~2 h core + buffer for quick-jump + tests).

## Remaining items
1. **Build order:** C01–C05 (spec'd) → **C06** via C06.1–C06.10 → C07–C10 (~4.5 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

Per-step breakdowns continue C-by-C on request (C07 next); beyond them only
writing the actual controller code and running the CT suite remain.
