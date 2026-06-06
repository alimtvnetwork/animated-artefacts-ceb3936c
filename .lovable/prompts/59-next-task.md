# 59-next-task.md — snapshot

Saved at v1.64.0. Task: wire the dot-pagination `…` gap token to open an inline
jump field (spec 27/05) and unify slide-jump validation.

## Root cause (one sentence)
The collapsed pagination gap jumped only to the hidden run's midpoint, leaving
the flanking hidden slides unreachable from the strip, contrary to spec
`27-slides-number/05` which requires the gap to open a jump input.

## Minimum fix
- `src/slides/controls/jumpTarget.ts` — pure `resolveJumpTarget(raw,total)`.
- `src/slides/controls/GapJumpToken.tsx` — gap → inline input → validated jump.
- `src/slides/controls/DotPagination.tsx` — uses `GapJumpToken` (drop `GapToken`).
- `src/slides/controls/SlideIndicator.tsx` — `commit()` reuses the validator (DRY).

## Verification
- Fixed `TS2304` for `GapToken` / `resolveJumpTarget`; build passes.
- Vite logs clean apart from pre-existing Browserslist warning.

## Remaining
- Author remaining media slide types (plan 05, steps 11–80) spec-first.
- Register media slide types in `SlideType` + CATALOG.
- Reduced-motion + GIF loader; final 50-slide preview QA.
- Move plan `05` to `completed/`.
