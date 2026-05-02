# 30 — Fullscreen Layout & Visual Polish (v0.36.0)

**Supersedes parts of spec 17 (StepTimeline §13.4 side-panel placement) and
spec 29 (ambient glow intensity).** Locks the answers to the
"fullscreen polish" pass: left-aligned description, blurred upcoming
steps, softer glow, more visible homepage icons, and a slightly muted
gold accent.

## 1. Why it changed

In fullscreen the right-side description column sat in an isolated
column ~50% across the stage, disconnected from the active step. The
upcoming steps read at the same crispness as the active one, weakening
the focus hierarchy. The amber glow was bright enough to compete with
text. The homepage scattered icons sat at 5% opacity — almost invisible
on a 1080p projector. The gold accent was at 96% saturation, slightly
shouty next to the cream + white text.

## 2. Decisions (locked)

### 2.1 Left edge alignment — fullscreen/wide lock

The StepTimelineSlide content column shares the **same left padding as
the BrandHeader logo** (`px-10` ≈ 40px). In fullscreen / wide-stage mode
this is a **hard lock**:

- content wrapper is `width: 100%`, `max-width: none`, `margin-left: 0`,
  `margin-right: 0`;
- left/right padding is exactly `2.5rem` to match BrandHeader `px-10`;
- these fullscreen/wide overrides must beat Tailwind utility classes such
  as `max-w-7xl mx-auto` so the slide never recenters into the middle.

Reason: the user's repeated fullscreen issue was the whole StepTimeline
composition still starting from a centered 1280px column. In wide/fullscreen,
logo → eyebrow → title → step 1 must share one left sight line.

### 2.2 Header → title gap

The title block adds `mb-12` (was `mb-8`) to create breathing room
between the slide title (`Engagement Process`) and the two-column body.
Eyebrow → title gap unchanged.

### 2.3 Description placement

In fullscreen / wide-stage mode, the grid is explicitly left-weighted:

```css
grid-template-columns:
  minmax(36rem, 0.47fr)
  minmax(28rem, 0.36fr)
  minmax(0, 0.17fr);
```

The first column owns the step chain, the second column sits adjacent for
the description, and the third empty track absorbs the unused right-side
space. This prevents the step chain from drifting into the visual middle
while still giving the description room to breathe.

### 2.4 Upcoming-step blur + gray

Inactive step rows render with:

| State    | Blur    | Color                  | Opacity |
|----------|---------|------------------------|---------|
| active   | 0       | `hsl(0 0% 100%)`       | 1.00    |
| adjacent | 1.2px   | `hsl(0 0% 78%)`        | 0.55    |
| far      | 2.5px   | `hsl(0 0% 62%)`        | 0.30    |

Blur is a CSS `filter` on `.step-row` driven by `data-state`. Reduced
motion **keeps the blur** (it's a static visual cue, not motion) but
disables the transition between states.

### 2.5 Active text slide-in

`--step-text-duration` retuned from `1500ms` → **`1000ms`** so the
active row's slide-in lands in exactly 1 second per the spec request.
Easing stays `cubic-bezier(0.19, 1, 0.22, 1)` (expo-out).

The keyframe travel `translateX(-32px → 0)` is unchanged — the
description in the right column inherits the same animation timing
through its own Framer transition (`x: { duration: 1.0, ease: ... }`)
so left chain + right description move together.

### 2.6 Glow intensity

`AmbientBackground glow` radial-gradient stops are softened:

| Stop  | v3.4 (was)              | v0.36 (now)               |
|-------|-------------------------|---------------------------|
| 0%    | `28 75% 11% / 0.85`     | `28 65% 10% / 0.55`       |
| 25%   | `28 75% 11% / 0.45`     | `28 65% 10% / 0.25`       |
| 60%   | transparent             | transparent (unchanged)   |

Inner stop drops from 85% → 55% alpha; mid drops 45% → 25%. Hue
desaturated 75 → 65 so the halo reads "warm noir" rather than
"orange spotlight".

### 2.7 Homepage icon visibility

The TitleSlide ambient field bumps:

- `count`: 12 → **18** (more density, fills the corners)
- `opacity`: 0.05 → **0.10** (twice as visible — still a texture
  layer, never competes with the title)
- `parallax`: 28 → **24** (smaller swing because more icons = more
  visual motion already)

Icon stroke stays at `1` (line-art weight). Color stays
`text-foreground` so any future theme repaint keeps the icons in sync.

### 2.8 Gold accent tone-down

`--gold` HSL channels: `40 96% 48%` → **`40 88% 50%`**.

- Saturation 96 → 88: removes the slightly neon edge.
- Lightness 48 → 50: nudges slightly brighter to compensate so the
  perceptual brightness matches but the chroma calms down.

`--gold-glow` (highlight token) stays at `42 100% 62%` — the highlight
is meant to pop, only the body color is muted.

`--ring` and `--primary` follow `--gold` (already aliased).

## 3. Reduced-motion checklist

- Inactive blur: **kept** (static visual cue).
- Slide-in animation: collapses to 150ms opacity-only.
- Glow fade-in: instant.
- Icon parallax: off.
- Icon drift: off.

## 4. Files touched

- `src/index.css` — `--gold` retune, `--step-text-duration`, blur
  state CSS.
- `src/slides/components/AmbientBackground.tsx` — glow gradient stops.
- `src/slides/types/StepTimelineSlide.tsx` — grid retune, padding
  alignment, `mb-12` gap, right-column timing match.
- `src/slides/types/TitleSlide.tsx` — icon count + opacity + parallax.

## 5. Migration notes

- Any slide that hard-codes a gold hex (e.g. inline `#f3a502`) will
  drift slightly off-brand after this change. Always use
  `hsl(var(--gold))` instead.
- The right-column animation timing is now a tuple-locked pair with
  `--step-text-duration`. If a future change retunes the chain feel,
  bump both together.
- The blur on inactive steps is a `filter` on `.step-row`. Anything
  inside a step row that needs to stay sharp (e.g. a future tooltip)
  must escape the row container.
