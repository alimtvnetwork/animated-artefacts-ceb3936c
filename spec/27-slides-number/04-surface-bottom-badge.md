# 04 — Surface 2: Slide Number Badge (bottom-right)

**File:** `src/slides/controls/SlideNumberBadge.tsx`
**Role:** Tiny, always-on, **read-only** anchor in the bottom-right corner. Its
only job: tell everyone which slide is up, even when the controller pill is
collapsed/hidden. It deliberately does NOT support jump-to-slide (the
controller already does).

## When it renders

```tsx
{!gridOpen && <SlideNumberBadge current={currentLinear} total={total} />}
```

- Always on except in grid/overview view.

## Props

```ts
interface Props { current: number; total: number; }
```

## Exact structure

```tsx
<div
  className="pointer-events-none fixed bottom-4 right-5 z-30 select-none"
  aria-live="polite"
  aria-label={`Slide ${current} of ${total}`}
>
  <div className="rounded-full border border-border/60 bg-background/55 backdrop-blur-md px-3 py-1.5 text-[11px] font-mono tracking-[0.18em] text-foreground/70 shadow-elegant">
    <span className="text-gold tabular-nums">{String(current).padStart(2, '0')}</span>
    <span className="text-foreground/35 mx-1.5">/</span>
    <span className="tabular-nums">{String(total).padStart(2, '0')}</span>
  </div>
</div>
```

## Visual contract

- **Position:** `fixed bottom-4 right-5`, `z-30`. Sits just under/right of the
  collapsed controller pill (which is `bottom-6 right-6`) so they don't
  overlap.
- **Pill:** `rounded-full`, `border-border/60`, `bg-background/55` +
  `backdrop-blur-md`, `shadow-elegant`, padding `px-3 py-1.5`.
- **Text:** `text-[11px]`, `font-mono`, `tracking-[0.18em]`,
  base colour `text-foreground/70`.
- **Current number:** `text-gold`, `tabular-nums`, **zero-padded to 2 digits**.
- **Separator `/`:** `text-foreground/35`, `mx-1.5`.
- **Total:** `tabular-nums`, padded to 2 digits, inherits `text-foreground/70`.
- **Non-interactive:** `pointer-events-none` + `select-none`.

## Accessibility

- `aria-live="polite"` + `aria-label="Slide N of M"` so the change is
  announced. No focusable elements (read-only).

## Do / Don't

- ✅ Keep it minuscule and low-contrast — it must never pull focus from slide
  content.
- ❌ Do not add click-to-jump here. That is the controller's job; duplicating
  it caused confusion in earlier versions.
- ❌ Do not remove the zero-padding — it keeps the badge width stable.
