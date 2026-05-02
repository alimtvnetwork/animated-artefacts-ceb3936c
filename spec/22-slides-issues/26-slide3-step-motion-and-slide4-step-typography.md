# 26 — Slide 3 step motion + Slide 4 step typography

**Reported:** 2026-04-30 (presenter feedback after deck-wide typography pass v1.1.0)
**Slides affected:** `/3` (`StepTimelineSlide`), `/4` (`StepsChain3DSlide`)
**Severity:** Polish — both slides render correctly, but visual weight + motion
feel between them is inconsistent and slide 3's step transition reads flat.

---

## Observations (verbatim)

> "For slide three, the text size looks all right and okay. For slide four,
> the text size looks a little bit small for the steps, so make it bigger
> like slide three.
>
> In the slide three, there is a very less animation from the movement of
> one step to the another. If we could have a little bit of, uh, animation
> like the 3D slide, it would really feel very nice."

Two distinct problems, captured together because they share the same
underlying contract: **the two step-driven slide types should feel like
siblings — same legibility floor, same caliber of motion on step change.**

---

## Root cause analysis

### A. Slide 4 step labels read smaller than slide 3

Slide 3's step rows use semantic CSS variables that received the deck-wide
**+30%** bump in v1.1.0 (`src/index.css`):

```css
--step-title-active:   clamp(3.25rem, 5.98vw, 5.85rem);  /* ~52→94px source */
--step-title-adjacent: clamp(1.95rem, 2.86vw, 2.6rem);
--step-title-far:      clamp(1.46rem, 2.08vw, 1.95rem);
```

Slide 4 (`StepsChain3DSlide.tsx`) hardcodes Tailwind utilities:

```tsx
<div className="step-eyebrow text-[12px] tracking-[0.22em] uppercase ...">
<div className="step-title  text-3xl  font-display font-bold ...">
{subtitle && <div className="text-base ...">}
```

After the FitStage-scoped Tailwind override (×1.18) those land at
`~14px / ~36px / ~19px` source. Compared to slide 3's active title at
~52–94px (clamped), slide 4 looks small — **even though both slides
inherit the same FitStage scale.** The bug is that slide 4 was never
migrated onto the `--step-title-*` token system; its sizes are
literal Tailwind utilities and therefore opted out of the v1.1.0 bump.

### B. Slide 3 step change feels under-animated

`.step-row` only transitions three properties:

```css
.step-row {
  transition:
    opacity 1300ms var(--step-text-ease),
    color   1300ms var(--step-text-ease),
    filter  900ms  var(--step-text-ease);
}
```

`font-size` is **not** in the transition list, so when `data-state`
flips `adjacent → active` the title snaps from `--step-title-adjacent`
(~31–42px) to `--step-title-active` (~52–94px) instantly while opacity
crossfades over 1.3s. The eye sees a size *pop* but no *motion* — there
is no translate, no lift, no parallax, no swipe accent. Slide 4
(`StepsChain3D`) by contrast has marker scale, traveling gold pulse,
3D card transform — that's the motion vocabulary the presenter wants
slide 3 to *gesture toward* (not match 1:1 — slide 3 is a vertical
focus-timeline, not a 3D rail).

---

## Fix design

### Principle (codified in memory)

**`mem://design/step-row-motion-parity`** — the two step-driven slides
must share a single typography token set and a comparable motion budget
on step change. New step-driven slide types added in the future MUST opt
in to the same `--step-title-*` clamps and the same step-change motion
contract, scaled to their layout.

### B.1 Slide 4 typography parity

Replace the three Tailwind size utilities on every step row's label
column with token-driven font-sizes:

| Element              | Before (Tailwind)     | After (token-driven)                                          |
|----------------------|-----------------------|---------------------------------------------------------------|
| Step eyebrow / label | `text-[12px]`         | `clamp(0.95rem, 1.15vw, 1.15rem)` (~`var(--step-eyebrow)`)    |
| Step title           | `text-3xl`            | `var(--step-title-3d-active)` for active row, `--…-adjacent` for upcoming |
| Step subtitle        | `text-base`           | `clamp(1.15rem, 1.4vw, 1.4rem)` (~`var(--step-subtitle-3d)`)  |

Active vs. upcoming sizing already exists conceptually (the active card
is highlighted, others dimmed) — we just plumb size into that distinction
instead of holding it constant. New CSS vars introduced (in `:root`
inside the `[data-preset="premium"]` block to mirror `--step-title-*`):

```css
--step-title-3d-active:   clamp(2.6rem, 3.6vw, 3.6rem);
--step-title-3d-adjacent: clamp(1.95rem, 2.6vw, 2.6rem);
--step-eyebrow-3d:        clamp(0.95rem, 1.15vw, 1.15rem);
--step-subtitle-3d:       clamp(1.15rem, 1.4vw, 1.4rem);
```

The 3D variant sizes are intentionally ~30% smaller than slide 3's
*vertical* timeline (the 3D rail shows multiple cards simultaneously, so
each gets less canvas) but use the **same authoring grammar and the
same +18%/+30% headroom philosophy** so any future deck-wide bump
applies to both.

### B.2 Slide 3 step-change motion

Three additive layers, all reduced-motion-safe:

1. **Animate the size change.** Add `font-size` (and a paired
   `translateZ`-style scale fake) to the transitioned property list:

   ```css
   .step-row .step-title {
     transition:
       font-size 700ms var(--step-text-ease),
       transform 700ms var(--step-text-ease),
       color     1300ms var(--step-text-ease);
   }
   .step-row[data-state="active"]   .step-title { transform: translateY(0)   scale(1);    }
   .step-row[data-state="adjacent"] .step-title { transform: translateY(2px) scale(0.985); }
   .step-row[data-state="far"]      .step-title { transform: translateY(4px) scale(0.97); }
   ```

   Result: when a row promotes adjacent → active, the title grows AND
   subtly lifts/parallaxes forward over the same 700ms — eye reads
   "depth", not "snap."

2. **Active-row swipe pulse.** A one-shot left-to-right gold/ember
   gradient sweeps across the active row's title baseline whenever
   `data-state` becomes `active`, mirroring the gold pulse that travels
   the rail on slide 4. Implemented as a `::before` pseudo on
   `.step-row[data-state="active"] .step-title` with a CSS keyframe
   triggered by an animation-name change (state attribute swap) and
   `animation-fill-mode: backwards` so it fires exactly once per
   activation.

3. **Subtitle / capsule stagger.** The subtitle and capsule on the
   active row already animate via Framer Motion enter timings; we add
   a 60ms additional stagger so they read as following the title's
   lift, not parallel to it.

`@media (prefers-reduced-motion: reduce)` collapses all three layers:
font-size still tweens but at 0ms (instant snap matching pre-fix
behavior), transform is removed, swipe pulse is suppressed.

### Out of scope (explicitly NOT changing)

- Slide 3 rail / lattice background — already tuned (issue 02).
- Slide 4 marker geometry / rail alignment — already finalized in
  v1.1.0 (issues 20–22).
- The deck-wide +18%/+30% type bump itself — this issue only fixes the
  slide that opted out (slide 4) and the property that wasn't in the
  transition list (slide 3 font-size).

---

## Files to touch

- `src/index.css` — new `--step-title-3d-*` / `--step-eyebrow-3d` /
  `--step-subtitle-3d` tokens; extend `.step-row .step-title` transition;
  add `.step-row[data-state="active"] .step-title::before` swipe pulse
  keyframe; reduced-motion guard.
- `src/slides/types/StepsChain3DSlide.tsx` — replace `text-[12px]` /
  `text-3xl` / `text-base` on the step row label column with
  `style={{ fontSize: 'var(--step-…-3d…)' }}`. Active vs upcoming
  resolved via `isActive` (already in scope).
- `.lovable/memory/design/step-row-motion-parity.md` — new design rule.
- `.lovable/memory/index.md` — link the new memory under "Memories".
- `.lovable/question-and-ambiguity/24-slide3-motion-slide4-typography.md` —
  RCA log for no-questions mode.
- `.lovable/question-and-ambiguity/task-counter.md` — bump 23 → 24.

## Acceptance

- Slide 4 active step's title visually reads at the same character height
  (within ±10%) as slide 3's active step title, measured at the standard
  1280×720 preview viewport.
- Stepping through slide 3 with `→` shows: smooth 700ms grow + lift on
  the new active title, one-shot gold sweep across it, and the previous
  active row easing down + dimming (no instantaneous size pop).
- `prefers-reduced-motion: reduce`: no transform, no sweep; opacity +
  color crossfade only (current behavior preserved).
- No CSS `transform: scale()` on the slide stage itself — all changes
  are honest font-size / token-driven, per
  `mem://design/fitstage-type-headroom`.
- Build green; existing slide-3/4 tests pass.
