# 05 — Surface 3: Dot Pagination (bottom-center numbered strip)

**File:** `src/slides/controls/DotPagination.tsx`
**Role:** The bottom-center row of small numbered pills (`1 2 3 … 13`). The
active slot widens into a glowing gold pill. Each slot is a **button**:
clicking it jumps to that slide. Hovering shows a tooltip with the slide's
title.

This is the surface in the reference screenshots showing `1..13` along the
bottom-center.

## Ellipsis collapse (v1.48.0) — long decks

When `total > getPresetSettings().dotPaginationMaxBeforeCollapse` (default
**15**) the row no longer renders every dot. It renders the
`buildPageWindow(current, total, dotPaginationNeighbors)` output (see
`spec/27-slides-number/14-page-window-algorithm.md`): `1 … cur±2 … N`, always
anchoring slide 1 + last, current ±`neighbors` (default 2), and one `…` per gap
of ≥3 hidden slides (a single hidden slide renders its number, never `…`).

> **Implementation status (v1.60.0):** `buildPageWindow` lives in
> `src/slides/controls/pageWindow.ts` (pure, unit-tested in
> `src/test/pageWindow.test.ts`) and is wired into `DotPagination.tsx`. The
> threshold/neighbors are now **configurable** via `PresetSettings`
> (`dotPaginationMaxBeforeCollapse` default 15, `dotPaginationNeighbors`
> default 2), surfaced in `/settings` (two number inputs under the dot-
> pagination toggle) and passed through `SlideDeckPage` → `DotPagination`
> props (live-updated via `subscribePresetSettings`). The `…` token jumps to
> the gap midpoint; reusing the `SlideIndicator` jump input is still deferred.

- The `…` token is a focusable `<button aria-label="Jump to hidden slides">`
  that opens the jump input (reuse `SlideIndicator`); fallback jumps to the gap
  midpoint.
- This **replaces** the old "`overflow-x-auto` past 28 dots" cap (current
  `DotPagination.tsx` line 45) — collapse, do not scroll. Keep
  `overflow-visible` so the hover tooltip is never clipped.
- Active-pill `layoutId` morph + hover tooltip stay; reduced-motion → instant
  swap when the active slot crosses a `…` boundary.


## When it renders

```tsx
{showDots && !gridOpen && slide?.slideType !== 'StepsChain3DSlide' && (
  <DotPagination current={currentLinear} total={total}
    slides={linearSlides} onJump={jump} />
)}
```

- `showDots` comes from `getPresetSettings().showDotPagination` (**default
  `true`**, toggled in `/settings`).
- Hidden in grid view and on `StepsChain3DSlide`.

## Props

```ts
interface Props {
  current: number;            // 1-based active linear position
  total: number;              // count of linear slides
  slides: SlideSpec[];        // linear list — drives hover-tooltip titles
  onJump: (n: number) => void;// receives 1-based linear position → call jump
}
```

## Layout math

```ts
const SLOT = 24;                                   // px budget per dot
const maxWidth = Math.min(total * SLOT + 32, 720); // cap row width at 720px
const overflow = total > 28;                       // beyond 28 dots → scroll
```

- Wrapper: `fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto`,
  `style={{ maxWidth }}`, `data-print-hide="true"`,
  `role="navigation"`, `aria-label="Slide pagination"`.
- Inner row: `flex items-center gap-1.5 px-4 py-1`. When `overflow`, add
  `overflow-x-auto no-scrollbar` plus a left/right fade mask:
  `mask-image: linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)` (and the `-webkit-` twin). Otherwise
  `overflow-visible`.

## Each slot (button)

For `n = 1..total`, `isActive = n === current`, `isHover = hovered === n`,
`slide = slides[n-1]`, and
`titleText = slide?.content?.title ?? slide?.content?.eyebrow ?? slide?.slideName ?? ''`.

```tsx
<button
  key={n}
  onClick={() => onJump(n)}
  onMouseEnter={() => setHovered(n)}
  onMouseLeave={() => setHovered(h => h === n ? null : h)}
  onFocus={() => setHovered(n)}
  onBlur={() => setHovered(h => h === n ? null : h)}
  aria-label={`Go to slide ${n}${titleText ? ` — ${titleText}` : ''}`}
  aria-current={isActive ? 'true' : undefined}
  className="relative shrink-0 h-6 flex items-center justify-center group rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
  style={{ width: isActive ? 32 : 20 }}
>
  …
</button>
```

### Active pill (the gold highlight)

Rendered only when `isActive`. Uses a **shared `layoutId`** so it slides
(spring) from the old slot to the new slot when `current` changes:

```tsx
<motion.span
  layoutId="dot-pagination-active"
  className="absolute inset-0 rounded-full bg-gold"
  style={{ boxShadow: '0 0 12px hsl(var(--gold) / 0.55), 0 0 4px hsl(var(--gold) / 0.8)' }}
  transition={reduced
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 420, damping: 30, mass: 0.6 }}
/>
```

### Inactive pill background

```tsx
<span
  className={`absolute inset-0 rounded-full transition-colors duration-200 ${isHover ? 'bg-foreground/20' : 'bg-foreground/8'}`}
  style={{ backgroundColor: isHover ? undefined : 'hsl(var(--foreground) / 0.08)' }}
/>
```

### The number glyph (always visible)

```tsx
<span className={`relative z-10 font-display font-semibold tabular-nums leading-none transition-colors duration-200 ${
  isActive ? 'text-ink text-[11px]'
           : isHover ? 'text-foreground text-[10px]'
                     : 'text-foreground/55 text-[10px]'}`}>
  {n}
</span>
```

- Active number is **`text-ink`** (dark, for contrast against the gold pill)
  at `text-[11px]`. Inactive is `text-foreground/55` at `text-[10px]`, hover
  brightens to `text-foreground`.
- **No zero-padding here** — the bare number sits inside each dot.

### Hover tooltip (compact warm pill)

On `isHover`, render an `AnimatePresence` tooltip above the dot:

```tsx
<motion.div key="tooltip"
  initial={{ opacity: 0, y: 6, scale: 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 4, scale: 0.96 }}
  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
  style={{ transformOrigin: '12px bottom' }}
  className="absolute bottom-full left-1/2 -translate-x-[14px] mb-2.5 pointer-events-none"
  role="tooltip">
  <div className="dot-tooltip-pill relative whitespace-nowrap rounded-full border border-gold/25 bg-popover/95 pl-2.5 pr-3.5 py-1.5 backdrop-blur-md shadow-[0_8px_24px_-12px_hsl(var(--gold)/0.4)]">
    <span className="font-display text-[12px] font-semibold leading-none tabular-nums">
      <span className="text-gold">{n}.</span>{' '}
      <span className="text-foreground">{titleText || `Slide ${n}`}</span>
    </span>
  </div>
</motion.div>
```

- The tooltip is **left-anchored** to the hovered dot (`-translate-x-[14px]`)
  so the gold "N." chip lines up over the dot's number; the pill grows
  rightward for long titles.
- A separate **arrow** is a sibling anchored at the button's center so it
  always points at the dot regardless of pill width:

```tsx
<span aria-hidden="true"
  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-[6px] h-2 w-2 rotate-45 border-r border-b border-gold/25 bg-popover/95 pointer-events-none" />
```

## Behaviour rules

- Click a slot → `onJump(n)` (the page's `jump`, which plays the `click` cue
  and navigates). Clicking the **already-active** slot still calls `jump` →
  `goTo` no-ops on same route, sound still fires once.
- Hover state is single-value (`hovered: number | null`); leaving a slot only
  clears hover if it owned it.
- `aria-current="true"` on the active slot.
- Reduced motion: the active-pill spring becomes `duration: 0.01` (instant
  move). Tooltip still fades (cheap).
