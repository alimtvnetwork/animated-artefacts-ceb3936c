# 14 — `buildPageWindow` algorithm (ellipsis collapse for slide-number surfaces)

**Status:** spec (v1.47.0) · **Command:** `.lovable/spec/commands/06-slide-number-ellipsis-pagination.md`
**Consumed by:** `DotPagination.tsx` (`src/slides/controls/DotPagination.tsx`),
the controller indicator (spec `06-surface-controller-indicator.md`), and the
top bar (spec `03-surface-top-bar.md`). Single source of truth so the three
surfaces never diverge.

## Why
A 50-slide deck cannot show 50 numbered pills — the row overflows and the
audience loses "where are we". The strip must collapse to
`1 … cur-2 cur-1 [cur] cur+1 cur+2 … N`, always anchoring first + last so any
slide is reachable, while keeping click-to-jump, the active-pill `layoutId`
morph, the hover tooltip, and the `overflow-visible` tooltip-clip rule intact.

## Signature
```ts
// src/slides/controls/pageWindow.ts
export type PageToken = number | 'gap';
export function buildPageWindow(
  current: number,   // 1-based active slide
  total: number,     // count of linear slides
  neighbors: number, // slides shown on EACH side of current (default 2)
): PageToken[];
```

## Rules (deterministic)
1. **Below threshold → no collapse.** Callers only invoke `buildPageWindow`
   when `total > maxBeforeCollapse` (configurable, default **15**). At/below
   the threshold render the full `1..total` strip unchanged.
2. **Anchors always present:** slide `1` and slide `total`.
3. **Window:** every `n` with `current - neighbors <= n <= current + neighbors`
   (clamped to `[1, total]`).
4. **Build the sorted set** of kept indices = `{1, total} ∪ window`.
5. **Fill gaps between consecutive kept indices `a < b`:**
   - `b - a == 1` → adjacent, nothing between.
   - `b - a == 2` → emit the single missing number (`a+1`); **never** a `…`
     for a one-slide gap (a `…` that hides one slide is worse than the number).
   - `b - a >= 3` → emit one `'gap'` token.
6. **No duplicate tokens, ascending order**, `1` first and `total` last.

## Worked outputs (neighbors = 2)
| current | total | result |
|--------:|------:|--------|
| 1   | 50  | `1 2 3 … 50` |
| 8   | 50  | `1 … 6 7 8 9 10 … 50` |
| 25  | 50  | `1 … 23 24 25 26 27 … 50` |
| 49  | 50  | `1 … 47 48 49 50` |
| 3   | 16  | `1 2 3 4 5 … 16` |
| 14  | 16  | `1 … 12 13 14 15 16` |

## Gap-token interaction
A `'gap'` renders as a `<button aria-label="Jump to hidden slides">…</button>`.
Click → open the existing jump input (reuse `SlideIndicator` number-entry path)
so the presenter types an exact target. (Fallback if no jump input on a surface:
jump to the gap midpoint.) The token is keyboard-focusable.

## Settings (configurable)
Add to `PresetSettings` (`src/slides/presetSettings.ts`, after
`showDotPagination` at line 40; defaults in `DEFAULT_PRESET_SETTINGS` at ~line
303):
- `dotPaginationMaxBeforeCollapse: number` — default **15**.
- `dotPaginationNeighbors: number` — default **2**.
Surface both in `/settings` (`SettingsPage.tsx`). Thresholds are NOT hardcoded.

## Reduced motion
When collapsed, the active-pill `layoutId` morph still applies between adjacent
visible slots; when the active slot crosses a `…` boundary (window re-windows),
`prefers-reduced-motion` → instant swap (no fly-across-gap animation). The
`'gap'` token never animates.

## Tests (`pageWindow.test.ts`)
Assert every row of the worked-outputs table plus: `total=100` at current
1/50/100; neighbors=0 and neighbors=3; the one-slide-gap rule (`b-a==2` → number,
not `…`); anchors always present; ascending + de-duped.
