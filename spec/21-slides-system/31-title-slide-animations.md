# 31 — Title Slide Animations

Locks the full enter/exit choreography for `TitleSlide` (slide 1). Pairs
with spec 15 (visual treatment) and spec 03 (deck-wide animation rules).

The Title Slide is the first impression — it must feel **deliberate**,
**designer-grade**, and **musical**. Every beat below is calibrated to
one bar of a slow tempo (≈ 1.6 s total enter, 0.55 s exit).

---

## 1. Vocabulary

| Term | Meaning |
|---|---|
| **Slide transition** | Whole-stage motion driven by `slide.transition` (FadeIn / SlideIn / PushIn / PushLeft / PushRight). Owned by `SlideStage`. |
| **Text animation** | Per-block reveal driven by `slide.textAnimation` or `content.animations.{block}`. Owned by `TitleSlide`. |
| **Step timeline effect** | The serialised cascade — eyebrow → glow → title → subtitle → capsules — each delayed off the previous beat. |
| **Capsule cascade** | The intra-row sequencing of capsules within their reveal block. |

Direction (`forward` / `backward`) flips X-axis transitions; everything
else is symmetrical.

---

## 2. Enter timeline (canonical, from `t = 0`)

```
 t = 0.00s   Stage transition begins (SlideStage AnimatePresence enter)
 t = 0.20s   Ambient glow starts fade 0 → 1   (0.80s ease-out)
 t = 0.25s   Eyebrow reveal                    (fadeIn,  0.45s)
 t = 0.40s   Title reveal                       (variant per spec, 0.55s)
 t = 0.85s   Subtitle reveal                    (fadeIn,  0.50s)
 t = 1.10s   Capsules container reveal begins
 t = 1.10s + (i * 0.09s)   Capsule i lands     (cinematicCapsules, 0.55s)
 t ≈ 1.65s   All elements at rest
```

Children inherit Framer's stagger only as a fallback — explicit `delay`
values on each block are authoritative so the curve is identical
regardless of sibling count.

---

## 3. Slide transition variants (stage-level)

Owned by `src/slides/transitions.ts`. Title Slide defaults to **FadeIn**
(spec 15) but supports the full enum:

| Transition | Initial | Animate | Exit | Duration |
|---|---|---|---|---|
| `FadeIn`     | `opacity 0`                 | `opacity 1` | `opacity 0`                 | 0.55s |
| `SlideIn`    | `opacity 0, y +40`           | `opacity 1, y 0` | `opacity 0, y -40`           | 0.55s |
| `PushIn`     | `opacity 0, scale 0.92`      | `opacity 1, scale 1` | `opacity 0, scale 1.04` | 0.55s |
| `PushLeft`   | `opacity 0, x +8% (fwd)`     | `opacity 1, x 0` | `opacity 0, x -8% (fwd)`     | 0.55s |
| `PushRight`  | `opacity 0, x -8% (fwd)`     | `opacity 1, x 0` | `opacity 0, x +8% (fwd)`     | 0.55s |

Easing: `cubic-bezier(0.22, 1, 0.36, 1)` (out-expo). Same on enter and
exit so the slide breathes in and out symmetrically.

**Exit always** runs at 0.55s regardless of the enter timeline so the
deck never feels sticky when advancing. The capsule cascade does not
play in reverse on exit — the whole stage fades/translates as one.

---

## 4. Text animation presets (block-level)

Authored in `src/slides/textAnimations.ts`. Title Slide uses these per-block:

| Block      | Default preset       | Notes |
|---|---|---|
| `eyebrow`  | `fadeIn`             | Quiet, never bouncy. |
| `title`    | `bounce`             | The hero beat. Spring overshoot, no blur. |
| `subtitle` | `fadeIn`             | Drift +8px upward. |
| `capsules` | `cinematicCapsules`  | Container; children inherit and stagger. |

Authors can override any block via `content.animations.{block}`:

```json
"content": {
  "animations": {
    "title": "slideUp",
    "capsules": "cinematicCapsules"
  }
}
```

### 4.1 Title-specific preset (NEW)

Add `titleSlide` preset for hero titles that want the bounce **without**
the slide-up component (some long titles look unsettled with both):

```ts
titleSlide: {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1,
    transition: { type: 'spring', stiffness: 240, damping: 18, mass: 0.9 } },
}
```

---

## 5. Step timeline effect (sequenced reveal)

The Title Slide's signature is the **serial cascade** — beats land like
a drum machine, not all at once. This is driven by explicit `delay`
values on each block, NOT by container `staggerChildren` (which is
non-deterministic when blocks are conditionally rendered).

| Block      | `delay` (s) | Visual character |
|---|---|---|
| Glow       | 0.20        | radial amber rises behind the title |
| Eyebrow    | 0.25        | small text fade-up |
| Title      | 0.40        | spring scale-in |
| Subtitle   | 0.85        | quiet fade-up |
| Capsules   | 1.10        | container starts; cascade follows |

The Title Slide component owns these constants — they are not author-
configurable via JSON (changing them is a deck-wide design decision).

---

## 6. Capsule cascade (within the capsules row)

Inside the capsules row, each `Capsule` enters with the
`cinematicCapsules` preset (blur → focus + spring overshoot) and a
**0.09s per-index delay** added to the row's base 1.10s offset.

So with 3 capsules:
- Capsule 0 → 1.10s
- Capsule 1 → 1.19s
- Capsule 2 → 1.28s

Origin: each capsule scales from its center, so the row reads as a
keyboard rolling left → right, not a single block expanding.

Capsule **hover** behaviour (label flip, lift) is unchanged by this
spec — see `src/slides/components/Capsule.tsx` and spec 22.

Capsule **exit** on slide change: capsules fade with the stage
transition. They do NOT play their cinematic blur in reverse (that
would feel like undoing rather than leaving).

---

## 7. Reduced motion (`prefers-reduced-motion: reduce`)

Mandatory contract:

1. Stage transition collapses to a 0.2s opacity fade. No translate, no
   scale.
2. Each text block: `initial = animate` (instantly visible), but the
   **delay** sequence is preserved — the audience still perceives the
   step timeline, just without movement.
3. Glow: appears at final opacity instantly. Icons: appear at final
   opacity instantly (no per-icon stagger).
4. Capsule cascade: collapses to `opacity 0 → 1` over 0.18s with the
   same 0.09s per-index delay so the rhythm survives.

Detection: `useReducedMotion()` from framer-motion at the
`TitleSlide` level. The component branches once and passes the chosen
variants down — children do NOT each call the hook.

---

## 8. Implementation contract

The component (`src/slides/types/TitleSlide.tsx`) MUST:

1. Pull `useReducedMotion()` once at the top.
2. Resolve each block's variants via `resolvePreset()` with these
   defaults: `eyebrow → fadeIn`, `title → titleSlide`, `subtitle →
   fadeIn`, `capsules → cinematicCapsules`.
3. Apply explicit per-block `transition.delay` values from §5 — do not
   rely on container stagger.
4. Pass `delay = 1.10 + i * 0.09` to each `Capsule` motion wrapper.
5. When reduced motion is on, swap variants for the reduced-motion
   versions (also defined in `textAnimations.ts`) and keep the delays.

The stage transition is owned by `SlideStage` and is unchanged by this
spec. Title Slide does NOT wrap itself in another `AnimatePresence`.

---

## 9. Acceptance checklist

- [ ] Glow rises ~0.20s after the slide enters.
- [ ] Eyebrow → title → subtitle → capsules land in that order, no overlap.
- [ ] Capsules cascade left → right with a perceptible 90ms gap.
- [ ] All five `slide.transition` variants render correctly with no
      layout jump.
- [ ] On `prefers-reduced-motion`, the cascade rhythm is preserved but
      no element translates or scales.
- [ ] Slide exit completes inside 0.55s; capsules don't reverse-blur.
- [ ] No console warnings from framer-motion about animating
      conflicting properties (e.g. `y` and `transform`).
