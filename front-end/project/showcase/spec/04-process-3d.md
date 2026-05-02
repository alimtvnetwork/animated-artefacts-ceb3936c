# 08 — Process 3D (Steps Chain — Cinematic)

- **Type:** `StepsChain3DSlide`
- **Transition:** `FadeIn`
- **Text animation:** `SlideUp` (right-panel staggered)
- **Sound:** existing `whoosh` step-change SFX (unchanged from `StepTimelineSlide`)
- **Codename:** "**steps chain 3D**"
- **Base spec:** [`spec/slides/61-steps-chain-3d.md`](../61-steps-chain-3d.md)

This slide is the cinematic counterpart to slide 03 (`process`). Same data
(Discovery → Strategy → Build → Scale), new motion language. Active step is
recognised purely by **scale, sharpness, and marker glow** — never by a solid
background fill.

## Visual concept

```
┌──────────────────────────────────────────────────────────┐
│  How we work                                             │
│  Engagement Process — Cinematic                          │
│                                                          │
│  ┌──── perspective: 1200px ───────┬─────────────────┐    │
│  │  ●─ Step 1   (recede)          │  ACTIVE PANEL   │    │
│  │  │                             │  Step N         │    │
│  │  ◉─ Step 2   (active, fwd Z)  →│  Title          │    │
│  │  │                             │  Subtitle       │    │
│  │  ●─ Step 3   (adjacent)        │  Capsule        │    │
│  │  │                             │                 │    │
│  │  ●─ Step 4   (distant)         │                 │    │
│  └────────────────────────────────┴─────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Depth states

Distance `d = abs(index - activeIndex)`.

| State    | d   | Scale | Opacity | Blur   | TranslateZ |
| -------- | --- | ----- | ------- | ------ | ---------- |
| Active   | 0   | 1.00  | 1.00    | 0px    | 0px        |
| Adjacent | 1   | 0.85  | 0.55    | 0.5px  | -60px      |
| Distant  | ≥2  | 0.70  | 0.30    | 1.2px  | -140px     |

These are mirrored under `content.depth` so the spec stays self-contained, but
the renderer reads them from the `--chain-depth-*` CSS tokens at mount.

## Motion

- **Card spring** — damping 14, stiffness 180, mass 1; incoming card
  overshoots `0.85 → 1.04 → 1.00`.
- **Marker spring** — same constants, **+80ms delay**, peak overshoot 1.25.
- **Revolver tilt** — chain container plays `rotateX 0° → 4° → 0°` (cap 6°).
- **Right panel** — label → title → subtitle slide in from `-32px` with
  `rotateY 6° → 0°`, staggered every 60ms.
- **Animate only** `transform`, `opacity`, `filter`. Never width/height/top/left.

## Interaction

- **Click-only. No hover effect of any kind** on step cards — no glow ring,
  no marker brightening, no lift, no filter/brightness change on hover. The
  cursor changes to `pointer` and that is the entire hover affordance.
- **No auto-direction.** Slide 04 is presenter-driven; waiting on the slide
  must not move Discovery → Strategy → Build → Scale by timer.
- Step changes happen only by direct card click, focused-card keyboard rove
  (`Arrow*`, `Home`, `End`), controller/deck Next/Prev, or animation scrubber.
- Deck hold-to-autoplay is disabled for this slide. Holding `Enter` must not
  start repeated step movement; each key press is a single explicit action.
- Controller/deck Next moves one step forward until Step 4; only then may it
  leave the slide. Controller/deck Prev moves one step backward until Step 1;
  only then may it leave the slide.
- Clicking a step card jumps to that step and triggers the bouncy
  zoom/revolver activation animation. **The click IS the feedback.**

## Reduced motion (`prefers-reduced-motion: reduce`)

- No `rotateX`, no `translateZ`, no `rotateY`, no overshoot.
- Active vs inactive distinction kept via opacity + flat 1.0 / 0.5 scale step
  with a 180ms linear opacity crossfade.
- Marker glow becomes a static gold ring; no scale animation.

## Sound

Reuses the existing `useStepSound` / `whoosh` trigger at the same moment as
`StepTimelineSlide`. No new cues for marker bubble or panel slide-in.

## Acceptance criteria (slide-local)

1. No solid background fill on the active card — recognition by scale +
   sharpness + marker glow only.
2. Switching steps shows a clear bouncy zoom on the new active and a recede
   on the previous.
3. Inactive steps are smaller, dimmer, slightly blurred; depth grows with
   distance.
4. Marker bubble lands ~80ms after the card settles.
5. Right-side detail panel slides in from the left with staggered fade + 3D.
6. Container plays a brief `rotateX 0 → 4° → 0` revolver tilt on each step
   change.
7. Existing step-change SFX still fires at the same moment as before.
8. `prefers-reduced-motion` users get a calm opacity crossfade fallback.
9. Only `transform`, `opacity`, `filter` are animated.
10. Step copy and ordering match slide 03 exactly.
11. Waiting on the slide never changes the active step; there is no internal
    autoplay timer for this slide.
12. Click/keyboard/controller actions remain responsive and move exactly one
    step per action unless a direct card/scrubber jump is used.
13. All four step cards must be visible and directly clickable at presenter
    preview height, with no extra in-slide step bubbles/scrubber controls.

## Right-panel description content

Each `step.description` may carry:

- `title` — bold heading (always rendered when present, falls back to `step.title`)
- `bullets[]` — **preferred per project Core "keywords-only" rule**. Renders
  as a vertical list of short keyword phrases with gold dot markers,
  staggered at 50ms per item.
- `body` — legacy free-form prose. Used only when `bullets` is absent.
  Triggers a dev-only console warning when its word count exceeds 12.
- `meta` — small uppercase chip rendered after the bullets/body.

## References

- Base spec: `spec/slides/61-steps-chain-3d.md`
- Sibling slide: `spec/slides/showcase/03-process.{json,md}`
- Memory: [animations](mem://features/animations), [slide-types](mem://features/slide-types)
