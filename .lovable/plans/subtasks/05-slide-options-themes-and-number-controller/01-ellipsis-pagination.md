# Ellipsis pagination for slide-number surfaces

**Slug:** ellipsis-pagination
**Status:** core shipped (v1.59.0) — `pageWindow.ts` + `DotPagination` wired & tested; PresetSettings/`/settings` keys + `SlideIndicator` jump-input reuse still pending
**Status:** pending
**Parent:** 05-slide-options-themes-and-number-controller
**Created:** 2026-06-06

## Goal
When `total > threshold` (configurable, default 15), collapse the numbered
strip to: `1 … (cur-2 cur-1 [cur] cur+1 cur+2) … N`.

## Detail
- Add `dotPaginationMaxBeforeCollapse: number` (default 15) and
  `dotPaginationNeighbors: number` (default 2) to `PresetSettings`
  (`src/slides/presetSettings.ts`) + `/settings` UI (`SettingsPage.tsx`).
- Pure helper `buildPageWindow(current, total, neighbors): (number|'gap')[]`
  in `src/slides/controls/pageWindow.ts` (own file, <80 lines, unit-tested).
  - Always include 1 and total.
  - Include `current-neighbors … current+neighbors`.
  - Any run of ≥2 skipped indices becomes one `'gap'` token; a single skipped
    index renders as the number (no `…` for a one-slide gap).
- `DotPagination.tsx` maps the window: numbers → existing button; `'gap'` →
  `<button aria-label="Jump to slides …">…</button>` that opens the jump input
  (reuse SlideIndicator path) or jumps to the gap midpoint.
- Preserve: active-pill `layoutId="dot-pagination-active"` morph, hover
  tooltip, `overflow-visible` clip rule, reduced-motion instant swap.

## Spec updates
Update `spec/27-slides-number/05-surface-dot-pagination.md`,
`06-surface-controller-indicator.md`, `03-surface-top-bar.md`, and the
acceptance checklist (`13-acceptance-checklist.md`) with the windowing math
and the configurable-threshold contract.

## Verification
- `bunx vitest run` on `pageWindow.test.ts` (windows for total=16/50/100,
  current at 1/middle/last).
- Preview a 50-slide deck: first/last always shown, `…` between, current ±2
  visible, clicking `…` jumps.
