# 06 — Surface 4: Controller Indicator (click-to-type jump)

**File:** `src/slides/controls/SlideIndicator.tsx`
**Rendered by:** `src/slides/controls/ControllerBar.tsx` (inside the expanded
controller pill, between the Prev and Next chevrons).
**Role:** The interactive "NN / NN" chip. Click it → it becomes a text input;
type a number and press Enter to jump. Also supports a double-tap gesture to
toggle reveal-hints, and shows a "recent jumps" history dropdown.

## Props

```ts
interface Props {
  current: number;              // 1-based active linear position
  total: number;
  onJump: (n: number) => void;  // page's `jump`
  onDoubleTap?: () => void;     // toggle reveal-hints (optional)
  doubleTapActive?: boolean;    // reveal-hints currently on?
}
```

Mounted as:

```tsx
<SlideIndicator current={current} total={total} onJump={onJump}
  onDoubleTap={onToggleRevealHints} doubleTapActive={revealHints} />
```

## Two visual states

### A) Resting chip (not editing)

```tsx
<button onClick={handleClick} aria-pressed={doubleTapActive}
  className={`lift-hover-subtle px-3 h-9 rounded-full text-sm font-mono tracking-wider transition min-w-[64px] ${
    doubleTapActive
      ? 'bg-gold/15 text-[hsl(var(--chrome-fg))] ring-1 ring-gold/60'
      : 'text-[hsl(var(--chrome-fg-muted))] hover:bg-[hsl(var(--chrome-hover))]'}`}>
  <span className="text-gold">{current}</span>
  <span className="text-[hsl(var(--chrome-fg-subtle))] mx-1">/</span>
  <span>{total}</span>
</button>
```

- Wrapped in a Radix `Tooltip`. Tooltip text: `'Click to jump · double-tap to
  toggle reveal hints'` when `onDoubleTap` is set, else `'Click to jump'`.
- Current number is `text-gold`; `/` uses `--chrome-fg-subtle`; total inherits.
- `min-w-[64px]`, `h-9`, `rounded-full`, `font-mono tracking-wider`,
  `text-sm`. **No zero-padding** (bare numbers).
- When reveal-hints active: gold-tinted bg + gold ring + `aria-pressed`.

### B) Editing (inline input + history)

```tsx
<input ref={inputRef} value={val}
  onChange={(e) => setVal(e.target.value)}
  onBlur={commit}
  onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
  className="w-16 h-9 text-center bg-surface-2 border border-gold/40 rounded-full text-sm font-mono text-foreground outline-none focus:ring-2 focus:ring-gold/50" />
```

- On entering edit mode the input value is preset to `String(current)` and the
  text is **selected** (`inputRef.current?.select()`).
- Width `w-16`, centered, gold border, gold focus ring.

## Single- vs double-click disambiguation

```ts
function handleClick() {
  if (!onDoubleTap) { setEditing(true); return; }
  if (clickTimer.current) {            // 2nd click within window → double-tap
    clearTimeout(clickTimer.current);
    clickTimer.current = null;
    onDoubleTap();
    return;
  }
  clickTimer.current = setTimeout(() => {  // 1st click → wait 240ms then edit
    clickTimer.current = null;
    setEditing(true);
  }, 240);
}
```

- **240ms** window. A second click inside it fires `onDoubleTap` (toggle reveal
  hints) and the edit input never appears. If no `onDoubleTap` prop is given,
  a single click edits immediately (no delay).

## Commit & validation (`commit()`)

Reads the trimmed input and decides:

| Input | Result |
|-------|--------|
| empty string | silent cancel, close editor |
| not a number (`NaN`) | `toast.error('Not a slide number', { description: 'Type a number from 1 to {total}.' })`, close |
| `< 1` | `toast.info('Slides start at 1', …)`, close |
| `> total` | `toast.error('No slide {n}', { description: 'Deck has {total} slides.' })`, close |
| valid `1..total` | `onJump(n)` + `pushJumpHistory(n)` + close |

- Toast durations: `2200ms`. Uses `sonner`'s `toast`.
- `Enter` commits; `Escape` cancels (closes without jumping); blur commits.

## Recent-jumps history dropdown

- Source: `src/slides/jumpHistory.ts` — `useJumpHistory()`, `pushJumpHistory()`,
  `clearJumpHistory()`. Shared MRU list with the keyboard quick-jump buffer, so
  jumps from either entry point feed the same history.
- Shown **above** the input (opens upward, `bottom-full … mb-2`) so it never
  collides with the controller at the bottom of the viewport.
- Filtered to slides still in range and excluding the current slide:
  `history.filter(n => n >= 1 && n <= total && n !== current)`.
- Each chip uses **`onMouseDown`** (not `onClick`) with `e.preventDefault()` so
  it fires before the input's `onBlur` commit; calls `jumpFromHistory(n)` which
  re-validates range, calls `onJump`, re-pushes (move-to-front), closes.
- A trailing `X` button clears history (`clearJumpHistory()`) then refocuses
  the input.
- Pill styling: `rounded-full border-[hsl(var(--chrome-border))]
  bg-[hsl(var(--chrome-bg))]/95 px-2 py-1 shadow-elegant backdrop-blur-md`,
  `History` lucide icon, chips `font-mono tabular-nums` hovering to
  `bg-gold/15 text-gold`.

## Notes

- `val` mirrors `current` whenever `current` changes (effect).
- Clean up the click timer on unmount.
- This is the ONLY slide-number surface with a text-entry jump. Keep it inside
  the controller pill; do not duplicate the input elsewhere.
