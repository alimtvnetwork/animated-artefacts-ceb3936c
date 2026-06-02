# Controller Build — C02 Broken Into 10 Code-Ready Sub-Steps (C02.1–C02.10)

Expands **C02 — "Portal mount + 8-position anchor system"** into 10 concrete,
ordered sub-steps a blind AI can implement directly. Builds on C01's foundation
(`useDeckNavigation`, tokens, reduced-motion). File paths are suggestions — adapt
to your tree (the live app's equivalent is `src/slides/controls/ControllerBar.tsx`).

| # | Sub-step | File | Reasoning | Time |
|---|----------|------|-----------|------|
| C02.1 | Define `ControllerPosition` union (8 anchors) + default `BottomCenter` | `src/slides/controls/position.ts` | A typed anchor set is the contract for mounting anywhere; defaulting to `BottomCenter` matches the existing deck convention. | 15 m |
| C02.2 | Build `POSITION_OFFSETS` lookup → `{top,bottom,left,right,transform}` | `position.ts` | One lookup keeps all 8 anchors in a single auditable place instead of scattered conditionals, preventing drift. | 30 m |
| C02.3 | Add `safe-area-inset` to each offset | `position.ts` | Guarantees the pill never hides under notches/rounded corners on real presentation hardware. | 15 m |
| C02.4 | Derive `expandAxis` (up/down/inward) from the anchor | `position.ts` | The reveal animation must grow away from the screen edge; deriving it from position avoids per-anchor hardcoding. | 20 m |
| C02.5 | Derive `tooltipSide` from the anchor | `position.ts` | Tooltips must open inward so they're never clipped; computing from position keeps chips reusable across anchors. | 15 m |
| C02.6 | Create `ControllerPortal` mounting into `document.body` via `createPortal` | `src/slides/controls/ControllerPortal.tsx` | A portal floats the controller above the scaled stage's `overflow:hidden` wrapper so it's never clipped. | 30 m |
| C02.7 | Apply position via inline `style` (not Tailwind) on the portal root | `ControllerPortal.tsx` | Inline style supports all 8 anchors + `%`/`transform` without a class explosion; uses `--z-controller`. | 20 m |
| C02.8 | Persist + restore chosen position (`ctrl.position.v1`) | `src/slides/controls/useControllerPosition.ts` | Presenter's placement preference should survive reloads; a tiny hook centralizes read/write with a safe default. | 25 m |
| C02.9 | Add resize/orientation guard → collapse to icon-only at narrow widths | `ControllerPortal.tsx` | Below the compact breakpoint the pill must shrink so it stays fully on-screen; one `resize` listener handles it. | 25 m |
| C02.10 | Snapshot/manual-verify all 8 anchors (reveal dir + tooltip side, no clip) | `src/test/controllerPosition.test.ts` | Locking position math now (CT03 preview) prevents the easy-to-miss off-screen-clip class of regressions. | 25 m |

**Subtotal (C02.1–C02.10): ~3.5 h** (within C02's ~2 h core + buffer for persistence/tests).

## Remaining items
1. **Build order:** C01 (done-spec'd) → **C02** via C02.1–C02.10 → C03–C10 (~14 h remaining of the ~19.5 h build).
2. **Execute CT01–CT20** — verification + hardening after the code lands. (~18 h)
3. **Acceptance walk-through** — end-to-end presenter story, fix defects, flip the controller track to done.

Per-step breakdowns continue C-by-C on request (C03 next); beyond them only
writing the actual controller code and running the CT suite remain.
