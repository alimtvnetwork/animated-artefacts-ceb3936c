# 13 — Motion System (LLM Pack)

> **Phase 11/20** · The motion contract every slide obeys. Mirrors
> canonical numbers from `spec/slides/42-steps-motion.md` and the
> animation-rules spec. Code is the source of truth — this file is a
> map.

## 1. Two motion families

| Family | Where | Default duration | Default easing |
|---|---|---|---|
| **Slide transition** | Between slides (`SlideStage`) | `420ms` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Text animation** | Inside one slide (titles, rows) | `280–600ms` | same easing |

Variety rule: consecutive slides must not pair the same `transition` +
`textAnimation`. The deck reads as one cinematic flow.

## 2. Allowed transitions (`slide.transition`)

| Token | Effect |
|---|---|
| `FadeIn` | Pure opacity (0 → 1). Use for hand-offs into still slides. |
| `SlideIn` | `translateX(40px) → 0` + opacity. Default for content slides. |
| `PushIn` | `scale(0.96) → 1` + opacity. Use sparingly (1× per deck). |
| `PushLeft` / `PushRight` | Directional. Use to reinforce narrative direction. |

Only opacity + transform. **No** `filter: blur`, **no** rotation, **no**
mask reveal — except where a per-slide spec explicitly authorizes it
(currently none).

## 3. Allowed text animations (`slide.textAnimation`)

| Token | Effect | Stagger |
|---|---|---|
| `FadeIn` | Opacity only | none |
| `SlideUp` | `translateY(16px) → 0` + opacity | `0.08s` per child |
| `Stagger` | Children fade + slide with `0.12s` per child | yes |
| `Bounce` | Single overshoot `0.94 → 1.02 → 1`, opacity | none — title only |

`Bounce` is reserved for the **first** title in a deck (slide 1 hero).
Anywhere else and the deck reads childish.

## 4. Spring profiles (Framer Motion)

| Use | `stiffness` | `damping` | `mass` |
|---|---|---|---|
| Step detail panel snap (y) | `260–380` | `26–28` | `0.7–0.8` |
| Capsule press feedback | `420` | `30` | `0.7` |
| Hover panel cross-fade | `360` | `26` | `0.7` |

Easing for non-spring tweens: **always**
`cubic-bezier(0.22, 1, 0.36, 1)` (a.k.a. `ease-out-expo`). Never
`ease-in` — pulls focus toward the start, fights the audience.

## 5. Reduced-motion master rule

`prefers-reduced-motion: reduce` collapses every transition to a
**single 150ms opacity cross-fade**. No translate. No scale. No
spring. Reduced-motion never disables a state change — it only strips
the animation that carries it (see `44-steps-accessibility.md`).

## 6. Forbidden

- `transform: scale()` on text rows (blurs glyphs).
- `filter: blur()` on motion (perf cliff on projectors).
- 3D `perspective` / `rotateY` / `translateZ` outside the explicitly
  authorized cinematic capsule animation (spec 16).
- `setTimeout` orchestration of multi-step reveals — use Framer
  variants + `delayChildren` / `staggerChildren`.

## 7. Acceptance

- DevTools paint flashing shows transform + opacity only on slide
  transitions.
- Reduced-motion on: `getAnimations()` filtered to transform returns
  empty for every slide.
- Two adjacent slides never share both `transition` and
  `textAnimation`.

## 8. Open questions & changelog

- Open: a single allowed `filter: blur` for the title hero on slide 1?
  Default: no.
- 2026-04-26 (v0.80.5): Phase 11 — pinned the two motion families,
  spring profiles, and the reduced-motion master rule.
