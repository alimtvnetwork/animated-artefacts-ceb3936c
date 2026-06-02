# 03 — Surface 1: Presenter Top Bar

**File:** `src/slides/controls/PresenterTopBar.tsx`
**Role:** Non-interactive HUD pinned to the top-center of the stage. Shows the
current slide number/total plus the Next/Prev keyboard hints.

> **Default: HIDDEN.** Since v0.152 (spec 65 §2) `topJumperHidden` defaults to
> `true`, so this bar is OFF until the presenter opts in with the `J` shortcut
> (or the controller hamburger's PanelTop toggle). The default-on, always-
> visible counter is the **bottom-right Slide Number Badge** (Surface 2).

## When it renders

Mounted by `SlideDeckPage` when ALL of these are true:

```tsx
{!gridOpen && !topJumperHidden && !isStepsChain3D && (
  <PresenterTopBar current={currentLinear} total={total} />
)}
```

- Hidden in grid/overview view (`gridOpen`).
- Hidden by default via `topJumperHidden` (persisted in `localStorage` under
  `riseup.topJumperHidden`; `'0'` = presenter chose to show, anything else =
  hidden). Toggle with the `J` shortcut / controller hamburger.
- Hidden on `StepsChain3DSlide` (that slide owns the full surface).

## Props

```ts
interface Props { current: number; total: number; }
```

No jump handler — this surface is **display only**. Navigation is keyboard /
controller driven; the chips here are visual reminders, not buttons.

## Exact structure

```tsx
<div
  role="region"
  aria-label="Presenter navigation bar"
  className="pointer-events-none fixed top-2 left-1/2 z-30 flex -translate-x-1/2 items-center"
>
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    className="inline-flex h-7 items-center gap-3 rounded-full border border-gold/20 bg-background/35 px-3.5 font-mono uppercase tracking-[0.18em] text-foreground/65 backdrop-blur-md shadow-elegant"
  >
    <ShortcutHint label="Prev" glyphs={['←', '⌫']} />
    <span className="h-3 w-px bg-gold/20" aria-hidden="true" />
    <span className="inline-flex items-baseline gap-1.5 text-[11px] leading-none">
      <span className="text-foreground/40">Slide</span>
      <span className="tabular-nums text-gold">{String(current).padStart(2, '0')}</span>
      <span className="text-foreground/30">/</span>
      <span className="tabular-nums text-foreground/75">{String(total).padStart(2, '0')}</span>
    </span>
    <span className="h-3 w-px bg-gold/20" aria-hidden="true" />
    <ShortcutHint label="Next" glyphs={['→', 'Space']} />
  </div>
</div>
```

### `ShortcutHint` sub-component

```tsx
function ShortcutHint({ label, glyphs }: { label: string; glyphs: string[] }) {
  return (
    <span
      aria-label={`${label} slide shortcut: ${glyphs.join(' or ')}`}
      className="inline-flex items-center gap-1.5 text-[9px] font-medium uppercase leading-none tracking-[0.14em] text-foreground/45"
    >
      <span>{label}</span>
      <span className="flex items-center gap-1">
        {glyphs.map((g, i) => (
          <kbd key={`${g}-${i}`}
            className="inline-flex min-w-[16px] justify-center rounded border border-gold/25 bg-background/45 px-1 py-0.5 font-mono text-[9px] leading-none text-gold/80">
            {g}
          </kbd>
        ))}
      </span>
    </span>
  );
}
```

## Visual contract

- **Position:** `fixed top-2 left-1/2 -translate-x-1/2`, `z-30`.
- **Pill:** height `h-7` (28px), pill `rounded-full`, `border-gold/20`,
  `bg-background/35` + `backdrop-blur-md`, `shadow-elegant`.
- **Number block:** label `Slide` at `text-foreground/40`; current number
  **gold**, `tabular-nums`, zero-padded to 2 digits; `/` at `text-foreground/30`;
  total at `text-foreground/75`, padded to 2 digits. Font size `text-[11px]`.
- **Dividers:** 1px vertical gold hairline (`h-3 w-px bg-gold/20`).
- **Keycaps:** dark pills, gold glyph (`text-gold/80`), uppercase tracked
  legend (`Prev` / `Next`).
- **Non-interactive:** `pointer-events-none` on the wrapper.

## Accessibility

- Wrapper `role="region"`, `aria-label="Presenter navigation bar"`.
- Inner block `role="status"` + `aria-live="polite"` + `aria-atomic="true"` so
  screen readers announce the new "Slide NN / NN" on each change.
- Keycap glyphs carry an `aria-label` describing the shortcut.
