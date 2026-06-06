# 06 — Slide-number controller: ellipsis pagination + configurable threshold

**Command (verbatim):** "update the slide numbers controllers spec in 2026 folder.
It is based on a condition if the slides are more than fifteen — that would be
configurable. So ask the user … more than fifteen." Show first + last slide
numbers always; show the current slide plus 2–3 neighbours; collapse the rest
into `…` (dot-dot-dot) ellipsis groups.

## Scope
Applies to every slide-number surface in `spec/27-slides-number/` (the "2026"
slide-number spec pack) and their runtime components:
- `spec/27-slides-number/05-surface-dot-pagination.md` (`DotPagination.tsx`)
- `spec/27-slides-number/06-surface-controller-indicator.md`
- `spec/27-slides-number/03-surface-top-bar.md`

## When it applies
- Trigger only when `total > threshold`. **Threshold is configurable** via
  `PresetSettings` (default proposed: `15`; expose in `/settings`). Below the
  threshold, render the existing full numbered strip unchanged.
- Windowing rule: always render slide `1` and slide `total`; render the current
  slide ±N neighbours (N configurable, default 2); replace each remaining
  contiguous gap with a single clickable `…` token that jumps to the midpoint
  (or opens the jump input).

## Notes
- Keep click-to-jump, active-pill `layoutId` morph, hover tooltip, and the
  `overflow-visible` tooltip-clip rule (memory: dot-pagination) intact.
- Configurability surfaced to user as a setting — do not hardcode 15.
