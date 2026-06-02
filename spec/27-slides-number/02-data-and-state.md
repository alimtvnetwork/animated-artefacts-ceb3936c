# 02 — Data & State (the source of truth)

Every slide-number surface is a **dumb display**. The owning page,
`src/pages/SlideDeckPage.tsx`, computes the numbers once and passes them down.
Reimplement the surfaces exactly; reimplement this derivation exactly.

## Inputs

- `deck` — the loaded deck. `deck.deckName`, and the full slide list.
- `linearSlides` — the ordered array of slides in the main flow (excludes
  disabled slides and click-reveal children).
- `allSlides` — every slide including non-linear children (used only to
  resolve click-reveal jumps).
- URL param `params.slideNumber` (the `/N` route) → `slideParam`.

## Derived values (compute these in the page)

```ts
// total = number of linear slides shown to the audience
const total = linearSlides.length;

// resolvedLinearIdx = index of the on-screen slide within linearSlides (0-based)
const resolvedLinearIdx = linearSlides.findIndex(
  (s) => s.slideNumber === slide.slideNumber,
);

// currentLinear = 1-based position; clamped so it is never < 1
const currentLinear = Math.max(1, resolvedLinearIdx + 1);
```

- **Pass `current={currentLinear}` and `total={total}` to every surface.**
- `slide.slideNumber` is the authored id; it powers the URL, not the display.

## The jump function (single entry point)

All interactive surfaces call **one** handler, `jump(n)`, where `n` is a
**1-based linear position** (what the user clicked/typed). It:

```ts
const jump = useCallback((n: number) => {
  const target = linearSlides[n - 1];      // linear position → slide
  if (target) {
    slideSound.play('click');              // exactly one cue (see 09-sound)
    goTo(target.slideNumber, n > linearIdx + 1 ? 'forward' : 'backward');
  }
}, [goTo, linearIdx]);
```

- `n` out of range (`linearSlides[n-1]` undefined) → **no-op, no sound**.
  (Surfaces also pre-validate; see `06` and `08`.)
- Direction (`'forward'`/`'backward'`) only drives the slide transition
  animation; it does not affect the number.

## `goTo` — the navigation primitive

```ts
const goTo = useCallback((n: number, dir: Direction) => {
  const target = allSlides.find(s => s.slideNumber === n);
  if (!target || target.enabled === false) return;   // never land on disabled
  navigate(`/${n}${location.search}`, { replace: false });
}, [navigate, location.search]);
```

- Pushes a new history entry (`replace: false`) so browser back/forward step
  through slides.
- Preserves the existing query string (`location.search`) so flags like
  `?theme=` survive a jump.

## Wiring map (which surface gets which handler)

| Surface | Prop passed | Handler | Plays sound? |
|---------|-------------|---------|--------------|
| PresenterTopBar | `current`, `total` | — (display only) | n/a |
| SlideNumberBadge | `current`, `total` | — (display only) | n/a |
| DotPagination | `current`, `total`, `slides`, `onJump` | `jump` | yes (in `jump`) |
| Controller `SlideIndicator` | `current`, `total`, `onJump` | `jump` | yes (in `jump`) |
| GridOverview | `current`, `onJump` | `(n)=>goTo(...)` | no |
| Legacy TopSlideJumper | `current`,`total`,`slides`,`onJump` | `jump` | yes |

**Key rule:** `jump` is the only handler that plays a sound. `goTo` is silent;
sound is added by the caller when appropriate.
