# 11 — Accessibility & Motion

The slide-number system must be fully usable by keyboard and screen-reader
users, and must respect reduced-motion.

## Live announcements

- **Presenter Top Bar:** inner block `role="status"` + `aria-live="polite"` +
  `aria-atomic="true"` → screen readers announce the whole "Slide NN / NN" on
  each change.
- **Slide Number Badge:** wrapper `aria-live="polite"` +
  `aria-label="Slide {current} of {total}"`.
- **Page level:** `SlideDeckPage` exposes an announcement string
  `Slide ${currentLinear} of ${total}${title ? `: ${title}` : ''}` and the
  stage carries `aria-label="{deckName} — slide {currentLinear} of {total}"`.

Use **`currentLinear`** (the displayed position), not `slideNumber`, in all
announcements so what is spoken matches what is shown.

## Labels & roles per surface

| Surface | Roles / labels |
|---------|----------------|
| Top Bar | `role="region"` `aria-label="Presenter navigation bar"`; keycaps have `aria-label` describing the shortcut |
| Badge | `aria-label="Slide N of M"`, read-only, no focus |
| Dot Pagination | wrapper `role="navigation"` `aria-label="Slide pagination"`; each dot is a `<button>` with `aria-label="Go to slide N — {title}"` and `aria-current="true"` on the active dot |
| Controller Indicator | `<button>` with `aria-pressed={revealHintsActive}`; Radix Tooltip gives the description; the input is a native focusable `<input>` |

## Keyboard

- Dot Pagination dots are real buttons: Tab to focus, Enter/Space to jump,
  `focus-visible:ring-1 ring-gold/60` focus ring; focusing a dot also opens its
  tooltip (`onFocus`/`onBlur` mirror hover).
- Controller indicator: click (or Enter when focused) → input; **Enter**
  commits, **Escape** cancels, blur commits. Input text is auto-selected on
  open so typing replaces it.
- Quick-jump keyboard buffer and the controller history share the same MRU list
  (`jumpHistory.ts`).

## Reduced motion (`prefers-reduced-motion`)

- Detected with framer-motion's `useReducedMotion()`.
- **Dot Pagination active pill:** spring → `{ duration: 0.01 }` (instant jump
  between slots, no slide animation). Tooltip fade is cheap and may remain.
- Ambient/slide transitions elsewhere also collapse — but for slide numbers the
  only motion to gate is the active-pill morph.
- Never gate *information* on motion: the number itself always updates
  instantly regardless of motion preference.

## Contrast

- Current number is gold on near-black (passes), or **`text-ink`** (dark) on
  the gold active dot in Dot Pagination (passes the other direction). Keep
  these pairings — do not put gold text on the gold active pill.
