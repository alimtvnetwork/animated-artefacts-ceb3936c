# 16 — Cinematic Capsule Entrance

Replaces the previous "tiny upward drift" used for capsule rows on
`CapsuleListSlide` (and any future slide type that renders a capsule grid).

## Goal

Capsules should feel **deliberate** — each one earns its place on screen.
The presenter should be able to time a sentence to each capsule landing.

## Per-capsule animation

Each capsule animates independently with this keyframe sequence:

| Phase | Duration | Property changes |
|-------|----------|------------------|
| **Hidden** (initial) | — | `opacity: 0`, `y: 32px`, `scale: 0.92`, `filter: blur(8px)` |
| **Focus** | `0.55s` | `opacity → 1`, `y → 0`, `scale → 1`, `filter → blur(0)` |
| **Settle** | implicit | spring overshoot — `scale 1 → 1.02 → 1` via `type: spring, stiffness: 220, damping: 18` |

## Stagger

- `staggerChildren: 0.09s`
- `delayChildren: 0.25s` (waits for the title to finish animating in)
- Children animate in **DOM order** (left-to-right, top-to-bottom in flex-wrap).

## Easing

`cubic-bezier(0.22, 1, 0.36, 1)` for the focus phase — same as the
controller morph, keeps the deck's motion language consistent.

## Hover (post-entrance)

Capsules already have `lift-hover-subtle`. The new entrance does not
interfere; once the entrance settles, the hover lift takes over.

## Reduced motion

Drop the blur (`filter` is expensive) and shorten to a `0.2s` opacity
fade. Stagger reduces to `0.04s`. No spring overshoot.

## Implementation notes

- New preset key `cinematicCapsules` added to
  `src/slides/textAnimations.ts`. Lives next to the existing presets, not
  hard-coded inside `CapsuleListSlide`, so any slide type can reuse it.
- The preset returns BOTH a container variant (with the stagger config)
  and an item variant (with the keyframe sequence). Slides reference it
  via the existing `content.animations.capsules` field — fully opt-in and
  per-slide.
- For the showcase deck, set `content.animations.capsules: "cinematicCapsules"`
  on the Capabilities slide so the new motion is visible by default.

## Capabilities slide background (paired change)

`CapsuleListSlide` no longer renders on pure `bg-background`. Same radial
amber glow as `TitleSlide v2` (see `15-title-slide-v2.md`) is added behind
the content, but **without** the scattered icons (the capsules themselves
provide the visual texture). The glow is positioned slightly off-center
(`50% 60%`) so it sits behind the capsule cluster, not the title.
